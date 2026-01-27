// src/screens/ReflectionScreen.tsx
import React from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Modal
} from 'react-native';
import { Save, ArrowLeft, Sparkles, Check } from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, LoadingState } from '../components';
import { useReflectionController } from '../controllers/useReflectionController';

export default function ReflectionScreen({ route, navigation }: any) {
  const {
    selections,
    notes,
    loading,
    handleTextChange,
    handleSave,
    // New Props
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
            <ArrowLeft color="#1A202C" size={24} />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.instruction}>Why do you feel this way?</Text>

          {selections.map((item: any) => (
            <Card key={item.id} style={styles.cardSpacing} padding={20}>
              <View style={styles.cardHeader}>
                <View style={styles.pathContainer}>
                  {item.path && item.path.map((p: string) => (
                    <Text key={p} style={styles.pathText}>{p}  →</Text>
                  ))}
                  <Text style={styles.finalEmotionText}>{item.label}</Text>
                </View>
              </View>
              <TextInput
                style={styles.input}
                placeholder={`I feel ${item.label} because...`}
                placeholderTextColor="#9CA3AF"
                multiline
                value={notes[item.id] || ''}
                onChangeText={(text) => handleTextChange(item.id, text)}
              />
            </Card>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {/* Show Loading Text if waiting for AI */}
          {loading ? (
            <Text style={styles.saveText}>Generating Insight...</Text>
          ) : (
            <>
              <Save color="#fff" size={20} style={{ marginRight: 10 }} />
              <Text style={styles.saveText}>Save Entry</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

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
  // ... Keep existing styles ...
  scrollContent: { padding: 20, paddingBottom: 0 },
  instruction: { fontSize: 18, color: '#6B7280', marginBottom: 20, fontWeight: '500' },
  cardSpacing: { marginBottom: 16 },
  cardHeader: { marginBottom: 12, borderBottomWidth: 1, borderColor: '#F3F4F6', paddingBottom: 12 },
  pathContainer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  pathText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500', marginRight: 4 },
  finalEmotionText: { fontSize: 16, color: '#1F2937', fontWeight: '700' },
  input: { fontSize: 16, color: '#1F2937', minHeight: 80, textAlignVertical: 'top' },
  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#E5E7EB' },
  saveButton: { backgroundColor: '#1F2937', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // --- NEW MODAL STYLES ---
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