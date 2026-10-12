import { useCallback, useEffect, useRef } from 'react';
import type { AudioPlayer } from 'expo-audio';
import type { BreathPhaseId } from '../constants/breathing';

/**
 * expo-audio, if this build has it.
 *
 * It is a native module, so a dev build made before it was added throws the
 * moment it is imported -- and since the navigator imports every screen up front,
 * a plain import would take the whole app down at launch, not just this screen.
 * Loaded this way, an old build runs the breathing session on haptics alone.
 */
const ExpoAudio: typeof import('expo-audio') | null = (() => {
    try {
        return require('expo-audio');
    } catch {
        return null;
    }
})();

/**
 * The voice cues, one per phase, from assets/audio/meditation/.
 *
 * Each `require` sits alone in a try block on purpose. Expo's Metro config allows
 * optional dependencies, and a require inside a try is one: a file that is not
 * there yet bundles as a throw at runtime, caught here, instead of failing the
 * build. The paths stay literal for the same reason as constants/images.ts --
 * Metro resolves them at build time.
 */
const CUE_SOURCES: Record<BreathPhaseId, number | null> = {
    inhale: (() => {
        try { return require('../../assets/audio/meditation/breathe-in.mp3'); } catch { return null; }
    })(),
    hold: (() => {
        try { return require('../../assets/audio/meditation/hold.mp3'); } catch { return null; }
    })(),
    exhale: (() => {
        try { return require('../../assets/audio/meditation/breathe-out.mp3'); } catch { return null; }
    })(),
};

/** Runs one player call. A cue is never worth breaking the session for. */
function quietly(what: string, action: () => void) {
    try {
        action();
    } catch (error) {
        console.warn(`[useBreathCues] Could not ${what}:`, error);
    }
}

/**
 * Plays each phase's voice cue, and pauses and resumes it along with the session.
 *
 * Every player call is wrapped: a missing cue file, a build without the native
 * module, or a player that fails all leave the session running on its haptics.
 *
 * The audio mode is left alone, so the cues follow each platform's default: on
 * iOS they respect the silent switch, on Android they play at media volume.
 */
export function useBreathCues() {
    const players = useRef<Partial<Record<BreathPhaseId, AudioPlayer>>>({});
    /** The cue of the phase in progress, if it has one. */
    const current = useRef<AudioPlayer | null>(null);
    /** A pause cut the current cue off mid-word, so the resume should finish it. */
    const interrupted = useRef(false);

    useEffect(() => {
        const loaded: Partial<Record<BreathPhaseId, AudioPlayer>> = {};
        if (ExpoAudio) {
            for (const id of Object.keys(CUE_SOURCES) as BreathPhaseId[]) {
                const source = CUE_SOURCES[id];
                if (source == null) continue;
                quietly(`load the ${id} cue`, () => {
                    loaded[id] = ExpoAudio.createAudioPlayer(source);
                });
            }
        }
        players.current = loaded;

        // Unloaded with the screen: stop whatever is playing, then free the players.
        return () => {
            for (const player of Object.values(loaded)) {
                quietly('unload a cue', () => {
                    player.pause();
                    player.remove();
                });
            }
            players.current = {};
            current.current = null;
            interrupted.current = false;
        };
    }, []);

    const play = useCallback((id: BreathPhaseId) => {
        interrupted.current = false;

        // The outgoing cue is cut off and rewound here, a whole phase before it plays
        // again, so the next cycle can start it without waiting on a seek.
        const outgoing = current.current;
        if (outgoing) {
            quietly('rewind a cue', () => {
                outgoing.pause();
                outgoing.seekTo(0).catch(error => console.warn('[useBreathCues] Could not rewind a cue:', error));
            });
        }

        const next = players.current[id] ?? null;
        current.current = next;
        if (next) quietly(`play the ${id} cue`, () => next.play());
    }, []);

    const pause = useCallback(() => {
        const player = current.current;
        if (!player) return;
        quietly('pause a cue', () => {
            if (player.playing) {
                player.pause();
                interrupted.current = true;
            }
        });
    }, []);

    const resume = useCallback(() => {
        const player = current.current;
        if (!player || !interrupted.current) return;
        interrupted.current = false;
        quietly('resume a cue', () => player.play());
    }, []);

    return { play, pause, resume };
}
