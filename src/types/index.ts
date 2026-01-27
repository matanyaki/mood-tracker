// src/types/index.ts

// 1. The Structure of a "Child" Emotion (e.g., "Lonely")
export interface SubEmotion {
    id: string;
    label: string;
    description?: string; // Optional helper text
    children?: SubEmotion[]; // Optional children for grandchild emotions
  }
  
  // 2. The Structure of a "Parent" Emotion (e.g., "Sadness")
  export interface EmotionCategory {
    id: string;
    label: string;
    color: string; // Hex code for the wheel slice
    children: SubEmotion[];
  }
  
  // 3. The Structure of a Journal Entry (What we save to Firebase)
  export interface JournalEntry {
    id?: string; // Optional because new entries don't have an ID yet
    userId: string;
    date: string; // Format: "YYYY-MM-DD"
    timestamp: number; // For sorting
    emotions: SelectedEmotion[]; // The list of 1-3 emotions user picked
  }
  
  // 4. The specific data for a selected emotion
  export interface SelectedEmotion {
    parentId: string; // e.g., "sadness"
    childId: string;  // e.g., "lonely"
    userNote: string; // The "Why" text the user wrote
  }