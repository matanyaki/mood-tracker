import { useState, useCallback, useMemo } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { PixelAlert } from '../components/ui/PixelAlert';
import { AppHeader, ScreenContainer, FabMenu, QuoteCard, IntentionCard, GratitudeNote, StreakCard, TodayGoalsCard, EmotionCheckInCard } from '../components'; // FabMenu exported from index?
import { Smile, Target, MessageCircle } from 'lucide-react-native';
import { useGreetingController } from '../controllers/GreetingController';
import { CARD_GAP, FAB_CLEARANCE } from '../constants/layout';

export default function TodayScreen({ navigation }: any) {
    const [isGratitudeVisible, setIsGratitudeVisible] = useState(false);
    const { saveGreeting, isLoading } = useGreetingController();

    const handleFabAction = useCallback((action: string) => {
        console.log(`Fab Action: ${action}`);
        if (action === 'Emotions') {
            navigation.navigate('CheckIn');
        } else if (action === 'Goals') {
            navigation.navigate('Goals');
        } else if (action === 'Greeting') {
            setIsGratitudeVisible(true);
        }
    }, [navigation]);

    const handleSaveGratitude = useCallback(async (text: string) => {
        try {
            await saveGreeting(text);
            console.log('Saved gratitude:', text);
            setIsGratitudeVisible(false); // Close strict after save success
        } catch (error) {
            PixelAlert.alert("Error", "Failed to save your gratitude note. Please try again.");
        }
    }, [saveGreeting]);

    const handleCloseGratitude = useCallback(() => setIsGratitudeVisible(false), []);

    // The streak pills lead to the same two inputs the Fab opens, so they route
    // through the same handler rather than duplicating the navigate and the modal
    // toggle. Each pill opens ITS OWN type's input.
    const openEmotionInput = useCallback(() => handleFabAction('Emotions'), [handleFabAction]);
    const openGreetingInput = useCallback(() => handleFabAction('Greeting'), [handleFabAction]);

    // Straight to the form, not the goals list: this is the empty day's shortcut to
    // making one, and the list has nothing to show it yet.
    const openGoalForm = useCallback(() => navigation.navigate('GoalForm', {}), [navigation]);

    const fabActions = useMemo(() => [
        {
            label: 'Emotions',
            icon: <Smile size={20} color="#FBBF24" />,
            onPress: () => handleFabAction('Emotions'),
            color: '#FEF3C7',
        },
        {
            label: 'Goals',
            icon: <Target size={20} color="#10B981" />,
            onPress: () => handleFabAction('Goals'),
            color: '#D1FAE5',
        },
        {
            label: 'Greeting',
            icon: <MessageCircle size={20} color="#0099ffff" />,
            onPress: () => handleFabAction('Greeting'),
            color: '#D1FAE5',
        },
    ], [handleFabAction]);

    return (
        <ScreenContainer variant="focus">
            <AppHeader
                title="Today"
                subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                emoji="☀️"
            />

            <ScrollView contentContainerStyle={styles.content}>

                {/* The primary action, so it sits directly under the header. An entry
                    point only -- it reports whether today has been logged and hands
                    off to the check-in screen, which owns the actual input. */}
                <EmotionCheckInCard onPress={openEmotionInput} />

                {/* What is due today, with the one checkbox each that can still be
                    ticked. */}
                <TodayGoalsCard onAddGoal={openGoalForm} />

                {/* Morning Intentions Card */}
                <IntentionCard />

                {/* Daily Streaks -- a thin strip, below the two cards that ask for
                    something. It reports on what is already done, so it reads as a
                    footnote to them rather than the first thing on the screen. */}
                <StreakCard
                    onPressEmotions={openEmotionInput}
                    onPressGreetings={openGreetingInput}
                />

                {/* ZenQuotes Daily Card */}
                <QuoteCard />

            </ScrollView>

            <FabMenu actions={fabActions} />

            {/* Gratitude Modal */}
            <GratitudeNote
                visible={isGratitudeVisible}
                onClose={handleCloseGratitude}
                onSave={handleSaveGratitude}
            />
        </ScreenContainer>
    );
}


const styles = StyleSheet.create({
    content: {
        padding: 20,
        // The ONE thing that spaces this column. Every card reserves room for its own
        // shadow and nothing else carries a margin, so the gaps are all this value.
        gap: CARD_GAP,
        // Clears the FAB, which floats outside the scroll view and would otherwise
        // sit on top of the last card at the end of the scroll.
        paddingBottom: FAB_CLEARANCE,
    },
});
