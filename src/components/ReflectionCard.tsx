import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { Check } from 'lucide-react-native';
import Card from './Card';
import { MOOD_IMAGES } from '../constants/images';
import { getEmotionImageKey, type EmotionId } from '../../shared/types/emotions';

interface ReflectionCardProps {
    label: string;
    rootEmotionId: EmotionId;
    note: string;
    onChangeText: (id: string, text: string) => void;
    isLast: boolean; // Optional: Determine if we show save button here or externally
    onSave?: () => void;
    loading?: boolean;
}

const ReflectionCard: React.FC<ReflectionCardProps> = React.memo(({
    label,
    rootEmotionId,
    note,
    onChangeText,
    isLast,
    onSave,
    loading = false,
}) => {
    return (
        <Card style={styles.card} padding={24} borderRadius={24}>
            <View style={styles.cardHeader}>
                <Image
                    source={MOOD_IMAGES[getEmotionImageKey(rootEmotionId)]}
                    style={styles.emotionImage}
                    resizeMode="contain"
                />
                <Text style={styles.emotionTitle}>{label}</Text>
                <Text style={styles.helperText}>Why do you feel this way?</Text>
            </View>

            <TextInput
                style={styles.input}
                placeholder={`I feel ${label.toLowerCase()} because...`}
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                value={note}
                onChangeText={(text) => onChangeText(rootEmotionId, text)}
            />
        </Card>
    );
});

ReflectionCard.displayName = 'ReflectionCard';

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        marginBottom: 20,
    },
    cardHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    emotionImage: {
        width: 60,
        height: 60,
        marginBottom: 12,
    },
    emotionTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1A1A2E',
        marginBottom: 4,
    },
    helperText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        color: '#1F2937',
        minHeight: 140,
        marginBottom: 24,
    },
});

export default ReflectionCard;
