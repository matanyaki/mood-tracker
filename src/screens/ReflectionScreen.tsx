import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Modal
} from 'react-native';
import { ArrowLeft, Sparkles, Check } from 'lucide-react-native';
import { ScreenContainer, AppHeader, ReflectionCard } from '../components';
import { useReflectionController } from '../controllers/useReflectionController';

export default function ReflectionScreen({ route, navigation }: any) {
  const {
    selections,
    notes,
    loading,
    handleTextChange,
    handleSave,
    // AI Props
    aiFeedback,
    showAiModal,
    closeAiModal
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
            // Simplified: use item.id directly as root, or map if needed. 
            // In new scale logic, item.id is 'happy', 'sad', etc.

            return (
              <ReflectionCard
                key={item.id}
                label={item.label}
                rootEmotionId={item.id}
                note={notes[item.id] || ''}
                onChangeText={(text) => handleTextChange(item.id, text)}
                isLast={isLast}
              // We no longer pass onSave to individual cards
              />
            );
          })}

          {/* Main Save Button */}
          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={[styles.saveButton, loading && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.saveText}>Saving...</Text>
              ) : (
                <>
                  <Text style={styles.saveText}>Save Entry</Text>
                  <Check size={20} color="#fff" strokeWidth={2.5} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- AI FEEDBACK MODAL --- */}
      <Modal
        visible={showAiModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeAiModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.aiHeader}>
              <Sparkles size={32} color="#4F46E5" />
            </View>

            <Text style={styles.aiTitle}>Your Daily Insight</Text>

            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackText}>
                "{aiFeedback}"
              </Text>
            </View>

            <TouchableOpacity style={styles.closeAiButton} onPress={closeAiModal}>
              <Text style={styles.closeAiText}>Got it</Text>
              <Check size={20} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  },
  saveButton: {
    backgroundColor: '#1A1A2E',
    width: '100%',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10
  },
  aiHeader: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16
  },
  aiTitle: {
    fontSize: 22, fontWeight: '800', color: '#1F2937', marginBottom: 16
  },
  feedbackContainer: {
    backgroundColor: '#F8FAFB',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5'
  },
  feedbackText: {
    fontSize: 16, color: '#374151', lineHeight: 24, fontStyle: 'italic'
  },
  closeAiButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30
  },
  closeAiText: {
    color: '#fff', fontSize: 16, fontWeight: '700'
  }
});
