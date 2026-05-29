import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Modal
} from 'react-native';
import { ArrowLeft, Check } from 'lucide-react-native';
import { ScreenContainer, AppHeader, ReflectionCard, PrimaryButton } from '../components';
import { useReflectionController } from '../controllers/useReflectionController';

export default function ReflectionScreen({ route, navigation }: any) {
  const {
    selections,
    notes,
    loading,
    handleTextChange,
    handleSave
  } = useReflectionController(route, navigation);

  return (
    <ScreenContainer variant="focus">
      <AppHeader
        title="Reflect"
        leftAction={
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <ArrowLeft color="#1A1A2E" size={24} />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>
            Take a moment to write about your feelings.
          </Text>

          {/* Loop through selections */}
          {selections.map((item: any, index: number) => {
            const isLast = index === selections.length - 1;

            return (
              <ReflectionCard
                key={item.id}
                label={item.label}
                rootEmotionId={item.id}
                note={notes[item.id] || ''}
                onChangeText={handleTextChange}
                isLast={isLast}
              />
            );
          })}

          {/* Main Save Button */}
          <View style={styles.footerContainer}>
            <PrimaryButton
              label={loading ? "Saving..." : "Save Entry"}
              onPress={handleSave}
              loading={loading}
              disabled={loading}
              icon={!loading ? <Check size={20} color="#fff" strokeWidth={2.5} /> : undefined}
              style={{ backgroundColor: '#1A1A2E', shadowColor: '#1A1A2E' }}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    fontWeight: '500',
  },
  footerContainer: {
    marginTop: 10,
    marginBottom: 20,
  }
});
