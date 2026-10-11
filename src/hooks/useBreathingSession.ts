import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    useSharedValue, useDerivedValue, useAnimatedReaction,
    withTiming, cancelAnimation, Easing, ReduceMotion,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import {
    BREATH_PHASES, CYCLE_SECONDS, SESSION_SECONDS, type BreathPhase,
} from '../constants/breathing';

export type BreathStatus = 'idle' | 'running' | 'paused' | 'done';

export interface BreathTick {
    /** 1-based, for display. */
    cycle: number;
    phase: BreathPhase;
    /** This phase's place in the whole session. Changes exactly once per phase. */
    step: number;
    /** Whole seconds left in the phase, counting down to 1. */
    secondsLeft: number;
}

const SESSION_MS = SESSION_SECONDS * 1000;
const CYCLE_MS = CYCLE_SECONDS * 1000;

/** Where whole second `second` of the session falls. */
export function tickAt(second: number): BreathTick {
    const clamped = Math.min(Math.max(second, 0), SESSION_SECONDS - 1);
    const cycleIndex = Math.floor(clamped / CYCLE_SECONDS);

    let into = clamped - cycleIndex * CYCLE_SECONDS;
    let phaseIndex = 0;
    while (into >= BREATH_PHASES[phaseIndex].seconds) {
        into -= BREATH_PHASES[phaseIndex].seconds;
        phaseIndex++;
    }

    const phase = BREATH_PHASES[phaseIndex];
    return {
        cycle: cycleIndex + 1,
        phase,
        step: cycleIndex * BREATH_PHASES.length + phaseIndex,
        secondsLeft: phase.seconds - into,
    };
}

/**
 * How full the breath is `ms` into the session: 0 is the circle at its base size,
 * 1 at its full size.
 *
 * A function of the clock and nothing else, so a stopped clock is a stopped circle,
 * and a restarted one picks the curve up exactly where it left it -- there is no
 * per-phase animation to restart. Within a phase the size follows a sine in-out: it
 * leaves and arrives at rest, the way a breath does, and still lands exactly on its
 * base or full size on the second the phase ends.
 */
function fullnessAt(ms: number): number {
    'worklet';
    if (ms <= 0 || ms >= SESSION_MS) return 0;

    let into = ms % CYCLE_MS;
    for (let i = 0; i < BREATH_PHASES.length; i++) {
        const { seconds, from, to } = BREATH_PHASES[i];
        const phaseMs = seconds * 1000;
        if (into < phaseMs) {
            const eased = 0.5 - 0.5 * Math.cos(Math.PI * (into / phaseMs));
            return from + (to - from) * eased;
        }
        into -= phaseMs;
    }
    return 0;
}

interface BreathingSessionHandlers {
    /** A phase has just begun, the first one included. */
    onPhaseStart: (tick: BreathTick) => void;
    onPause: () => void;
    onResume: () => void;
    /** The last breath out has ended. */
    onComplete: () => void;
}

/**
 * The breathing session's clock, and everything read off it.
 *
 * One shared value counts the milliseconds into the session, animated linearly on
 * the UI thread from wherever it stands to the end. Pausing cancels that animation,
 * which leaves the value exactly where it stopped; resuming animates on from there
 * over the time that is left. The circle, the countdown, the phase and the cycle
 * are all derived from that one value, so they cannot drift apart, and a resume
 * never restarts a phase.
 *
 * JS hears from the clock once a second, on the whole second. That is all the
 * countdown needs, and with whole-second phases it is also when every phase begins.
 */
export function useBreathingSession(handlers: BreathingSessionHandlers) {
    const elapsed = useSharedValue(0);
    const fullness = useDerivedValue(() => fullnessAt(elapsed.value));

    const [status, setStatusState] = useState<BreathStatus>('idle');
    const [second, setSecond] = useState(0);

    // Read from the clock's callbacks, which must see the latest values rather than
    // the ones from the render they were created in.
    const statusRef = useRef<BreathStatus>('idle');
    const lastStep = useRef(-1);
    /** A phase that began in the frame between a pause and the clock stopping. */
    const pendingPhase = useRef<BreathTick | null>(null);
    const handlersRef = useRef(handlers);
    useLayoutEffect(() => {
        handlersRef.current = handlers;
    });

    const setStatus = useCallback((next: BreathStatus) => {
        statusRef.current = next;
        setStatusState(next);
    }, []);

    const handleSecond = useCallback((next: number) => {
        setSecond(next);

        if (next >= SESSION_SECONDS) {
            setStatus('done');
            handlersRef.current.onComplete();
            return;
        }

        const tick = tickAt(next);
        if (tick.step === lastStep.current) return;
        lastStep.current = tick.step;

        // The clock stops on the UI thread, a frame after the tap that paused it. A
        // phase that began inside that frame is held for the resume, so its cue does
        // not play over a paused screen.
        if (statusRef.current === 'running') {
            handlersRef.current.onPhaseStart(tick);
        } else {
            pendingPhase.current = tick;
        }
    }, [setStatus]);

    useAnimatedReaction(
        () => Math.floor(elapsed.value / 1000),
        (current, previous) => {
            if (previous !== null && current !== previous) {
                scheduleOnRN(handleSecond, current);
            }
        },
    );

    /** Runs the clock from where it stands (or from 0) to the end of the session. */
    const runClock = useCallback((fromStart: boolean) => {
        scheduleOnUI((restart: boolean) => {
            'worklet';
            if (restart) elapsed.value = 0;
            elapsed.value = withTiming(SESSION_MS, {
                duration: SESSION_MS - elapsed.value,
                easing: Easing.linear,
                // A clock, not decoration. With the system's reduce-motion setting on,
                // Reanimated would otherwise jump it straight to the end of the session.
                reduceMotion: ReduceMotion.Never,
            });
        }, fromStart);
    }, [elapsed]);

    const start = useCallback(() => {
        if (statusRef.current !== 'idle') return;
        lastStep.current = -1;
        pendingPhase.current = null;
        setStatus('running');
        runClock(true);
        // The first phase begins now, not on the clock's first whole second.
        handleSecond(0);
    }, [runClock, setStatus, handleSecond]);

    const pause = useCallback(() => {
        if (statusRef.current !== 'running') return;
        cancelAnimation(elapsed);
        setStatus('paused');
        handlersRef.current.onPause();
    }, [elapsed, setStatus]);

    const resume = useCallback(() => {
        if (statusRef.current !== 'paused') return;
        setStatus('running');

        // A phase that began as the pause landed starts properly now; otherwise the
        // phase that was interrupted carries on.
        const pending = pendingPhase.current;
        pendingPhase.current = null;
        if (pending) {
            handlersRef.current.onPhaseStart(pending);
        } else {
            handlersRef.current.onResume();
        }

        runClock(false);
    }, [runClock, setStatus]);

    // Closing the screen mid-session stops the clock with it.
    useEffect(() => () => cancelAnimation(elapsed), [elapsed]);

    return { status, tick: tickAt(second), fullness, start, pause, resume };
}
