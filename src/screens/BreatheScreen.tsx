import React, { useCallback, useEffect } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Pause, Play, type LucideIcon } from 'lucide-react-native';
import { ScreenContainer, AppHeader, BackButton, PixelCard, PrimaryButton, primaryButtonInk, BreathCircle } from '../components';
import type { PrimaryButtonTone } from '../components/ui/PrimaryButton';
import { PixelAlert } from '../components/ui/PixelAlert';
import { CIRCLE_FULL } from '../components/breathe/BreathCircle';
import { useBreathingSession, type BreathStatus, type BreathTick } from '../hooks/useBreathingSession';
import { useBreathCues } from '../hooks/useBreathCues';
import { MONK_IMAGE } from '../constants/images';
import {
    INHALE_SECONDS, HOLD_SECONDS, EXHALE_SECONDS, SESSION_CYCLES, SESSION_SECONDS,
} from '../constants/breathing';
import { CARD_PADDING, SCREEN_BOTTOM, SCREEN_GUTTER, SCREEN_TOP, SPACE } from '../constants/layout';
import { TYPE } from '../constants/typography';

/**
 * The monk, in dp. A fixed size that never animates -- the circle behind it does
 * the breathing. The source is a 1254px canvas with no whole-number fit at this
 * size, so 160 is simply the top of the range: the figure fills only the middle of
 * its canvas, and this is where it reads best.
 */
const MONK = 160;

/** "4-7-8", from the pattern itself. */
const PATTERN = `${INHALE_SECONDS}-${HOLD_SECONDS}-${EXHALE_SECONDS}`;

/** "2:32" */
const SESSION_LENGTH = `${Math.floor(SESSION_SECONDS / 60)}:${String(SESSION_SECONDS % 60).padStart(2, '0')}`;

/** The one button, in each state of the session. Pause steps back to paper. */
const BUTTON: Record<BreathStatus, { label: string; tone: PrimaryButtonTone; icon?: LucideIcon }> = {
    idle: { label: 'Start', tone: 'green', icon: Play },
    running: { label: 'Pause', tone: 'paper', icon: Pause },
    paused: { label: 'Resume', tone: 'green', icon: Play },
    done: { label: 'Close', tone: 'green' },
};

/**
 * A guided 4-7-8 breathing session: breathe in for 4, hold for 7, breathe out for
 * 8, eight times over.
 *
 * The timing all lives in useBreathingSession and the voice in useBreathCues; this
 * screen only says what each phase start, pause and finish should do, and draws.
 * Every cue is doubled by a light haptic tick, which is also the whole cue when the
 * sound files are missing or the phone is on silent.
 */
export default function BreatheScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { play: playCue, pause: pauseCue, resume: resumeCue } = useBreathCues();

    const goBack = useCallback(() => navigation.goBack(), [navigation]);

    const handlePhaseStart = useCallback((tick: BreathTick) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        playCue(tick.phase.id);
    }, [playCue]);

    const handleComplete = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // 'cancel', so Android's back gesture on the dialog also returns to Today.
        PixelAlert.alert(
            'Well done!',
            `You finished ${SESSION_CYCLES} cycles of ${PATTERN} breathing. Keep going.`,
            [{ text: 'Close', style: 'cancel', onPress: goBack }],
        );
    }, [goBack]);

    const { status, tick, fullness, start, pause, resume } = useBreathingSession({
        onPhaseStart: handlePhaseStart,
        onPause: pauseCue,
        onResume: resumeCue,
        onComplete: handleComplete,
    });

    // Leaving the screen stops the session where it is -- another screen opening on
    // top, or the app going to the background -- and RESUME carries on from there.
    // Going back unmounts the screen, which ends the session and unloads its sounds.
    useFocusEffect(useCallback(() => pause, [pause]));

    useEffect(() => {
        const subscription = AppState.addEventListener('change', state => {
            if (state !== 'active') pause();
        });
        return () => subscription.remove();
    }, [pause]);

    const isActive = status === 'running' || status === 'paused';

    const phaseLabel = isActive ? tick.phase.label : status === 'done' ? 'DONE' : 'READY';
    const count = isActive ? String(tick.secondsLeft) : status === 'done' ? '0' : PATTERN;
    const caption = status === 'idle'
        ? `${SESSION_CYCLES} CYCLES, ${SESSION_LENGTH}`
        : `CYCLE ${status === 'done' ? SESSION_CYCLES : tick.cycle} / ${SESSION_CYCLES}`;

    const button = BUTTON[status];
    const ButtonIcon = button.icon;
    const onButtonPress = { idle: start, running: pause, paused: resume, done: goBack }[status];

    return (
        <ScreenContainer variant="calm">
            <AppHeader
                title="Breathe"
                subtitle={`${PATTERN} breathing`}
                leftAction={<BackButton onPress={goBack} />}
            />

            {/* Scrolls only on a phone too short for the full circle and the controls
                together; everywhere else the stage takes up the slack. */}
            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: SCREEN_BOTTOM + insets.bottom }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.stage}>
                    <BreathCircle fullness={fullness} />
                    <Image source={MONK_IMAGE} style={styles.monk} resizeMode="contain" />
                </View>

                <PixelCard padding={CARD_PADDING}>
                    <View style={styles.readout}>
                        {/* Android announces the phase as it changes. Only the phase: a
                            live countdown would be read out every second. */}
                        <Text style={styles.phase} accessibilityLiveRegion="polite">{phaseLabel}</Text>
                        <Text style={styles.count}>{count}</Text>
                        <Text style={styles.caption}>{caption}</Text>
                    </View>
                </PixelCard>

                <Text style={styles.hint}>
                    In through the nose, out through the mouth. If you feel light-headed, stop and breathe normally.
                </Text>

                <PrimaryButton
                    label={button.label}
                    tone={button.tone}
                    onPress={onButtonPress}
                    icon={ButtonIcon
                        ? <ButtonIcon size={18} color={primaryButtonInk(button.tone)} strokeWidth={3} />
                        : undefined}
                />
            </ScrollView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    content: {
        flexGrow: 1,
        paddingHorizontal: SCREEN_GUTTER,
        paddingTop: SCREEN_TOP,
        gap: SPACE.lg,
    },
    stage: {
        flex: 1,
        // Room for the circle at full size, which a scale transform does not claim
        // in layout: without this it would grow over the readout below.
        minHeight: CIRCLE_FULL,
        alignItems: 'center',
        justifyContent: 'center',
    },
    monk: {
        // Laid over the circle's centre; an absolute child still takes the stage's
        // centring.
        position: 'absolute',
        width: MONK,
        height: MONK,
    },
    readout: {
        alignItems: 'center',
        gap: SPACE.xs,
    },
    phase: {
        ...TYPE.h3,
        textAlign: 'center',
    },
    count: {
        ...TYPE.stat,
        textAlign: 'center',
    },
    caption: {
        ...TYPE.caption,
        textAlign: 'center',
    },
    hint: {
        ...TYPE.caption,
        textAlign: 'center',
        paddingHorizontal: SPACE.md,
    },
});
