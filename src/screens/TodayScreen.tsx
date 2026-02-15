import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AppHeader, ScreenContainer, FabMenu, QuoteCard } from '../components'; // FabMenu exported from index?
import { Smile, Target, MessageCircle } from 'lucide-react-native';

export default function TodayScreen({ navigation }: any) {
    const handleFabAction = (action: string) => {
        console.log(`Fab Action: ${action}`);
        if (action === 'Emotions') {
            navigation.navigate('CheckIn');
        } else if (action === 'Goals') {
            // navigation.navigate('GoalSetting'); 
        }
    };

    const fabActions = [
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
        // We could keep greeting or other actions
    ];

    return (
        <ScreenContainer variant="focus">
            <AppHeader
                title="Today"
                subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                emoji="☀️"
            />

            <ScrollView contentContainerStyle={styles.content}>

                {/* Morning Intentions Card (Placeholder for now) */}
                <View style={styles.placeholderCard}>
                    <Text style={[styles.cardTitle, { color: '#F59E0B' }]}>Morning Intentions</Text>
                    <Text style={styles.cardText}>What's your main focus today?</Text>
                </View>

                {/* ZenQuotes Daily Card */}
                <QuoteCard />

            </ScrollView>

            <FabMenu actions={fabActions} />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 20,
        gap: 16,
    },
    placeholderCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        color: '#1F2937',
    },
    cardText: {
        fontSize: 16,
        color: '#4B5563',
        lineHeight: 24,
    },
});
