/**
 * The guided breathing session: a 4-7-8 pattern, repeated for a set number of
 * cycles. Change the numbers here and the circle, the countdown, the cycle count
 * and the voice cues all follow.
 *
 * Whole seconds only. The countdown and the phase cues advance on the whole second
 * the session clock is in, so a phase that ended between two seconds would be
 * announced up to a second late.
 */

/** Breathe in, through the nose. */
export const INHALE_SECONDS = 4;

/** Hold the breath. */
export const HOLD_SECONDS = 7;

/** Breathe out, through the mouth. */
export const EXHALE_SECONDS = 8;

/** Full in-hold-out cycles in one session. */
export const SESSION_CYCLES = 8;

export type BreathPhaseId = 'inhale' | 'hold' | 'exhale';

export interface BreathPhase {
    id: BreathPhaseId;
    label: string;
    seconds: number;
    /**
     * The circle's size at the start and the end of the phase: 0 is its base size,
     * 1 its full size. Holding is a phase that starts and ends at the same size.
     */
    from: number;
    to: number;
}

/** One cycle, in order. */
export const BREATH_PHASES: readonly BreathPhase[] = [
    { id: 'inhale', label: 'BREATHE IN', seconds: INHALE_SECONDS, from: 0, to: 1 },
    { id: 'hold', label: 'HOLD', seconds: HOLD_SECONDS, from: 1, to: 1 },
    { id: 'exhale', label: 'BREATHE OUT', seconds: EXHALE_SECONDS, from: 1, to: 0 },
];

/** 19 at 4-7-8. */
export const CYCLE_SECONDS = BREATH_PHASES.reduce((total, phase) => total + phase.seconds, 0);

/** 152 at 8 cycles, or 2 min 32 s. */
export const SESSION_SECONDS = CYCLE_SECONDS * SESSION_CYCLES;
