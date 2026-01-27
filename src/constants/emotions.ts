// src/constants/emotions.ts
import { EmotionCategory } from '../types';

// NOTE: Ideally, update your 'types/index.ts' to support a 3rd layer (grandchildren)
// or use this recursive structure if you want infinite depth.
// For this file, I'm using a structure that fits the standard "3-Ring" model.

export const EMOTION_WHEEL = [
  {
    id: 'happy',
    label: 'Happy',
    color: '#F59E0B', // Bold Amber/Orange
    children: [
      {
        id: 'playful',
        label: 'Playful',
        children: [
          { id: 'aroused', label: 'Aroused' },
          { id: 'cheeky', label: 'Cheeky' }
        ]
      },
      {
        id: 'content',
        label: 'Content',
        children: [
          { id: 'free', label: 'Free' },
          { id: 'joyful', label: 'Joyful' }
        ]
      },
      {
        id: 'interested',
        label: 'Interested',
        children: [
          { id: 'curious', label: 'Curious' },
          { id: 'inquisitive', label: 'Inquisitive' }
        ]
      },
      {
        id: 'proud',
        label: 'Proud',
        children: [
          { id: 'successful', label: 'Successful' },
          { id: 'confident', label: 'Confident' }
        ]
      },
      {
        id: 'accepted',
        label: 'Accepted',
        children: [
          { id: 'respected', label: 'Respected' },
          { id: 'valued', label: 'Valued' }
        ]
      },
      {
        id: 'powerful',
        label: 'Powerful',
        children: [
          { id: 'courageous', label: 'Courageous' },
          { id: 'creative', label: 'Creative' }
        ]
      },
      {
        id: 'peaceful',
        label: 'Peaceful',
        children: [
          { id: 'loving', label: 'Loving' },
          { id: 'thankful', label: 'Thankful' }
        ]
      },
      {
        id: 'trusting',
        label: 'Trusting',
        children: [
          { id: 'sensitive', label: 'Sensitive' },
          { id: 'intimate', label: 'Intimate' }
        ]
      },
      {
        id: 'optimistic',
        label: 'Optimistic',
        children: [
          { id: 'hopeful', label: 'Hopeful' },
          { id: 'inspired', label: 'Inspired' }
        ]
      }
    ]
  },
  {
    id: 'sad',
    label: 'Sad',
    color: '#3B82F6', // Blue bold
    children: [
      {
        id: 'lonely',
        label: 'Lonely',
        children: [
          { id: 'isolated', label: 'Isolated' },
          { id: 'abandoned', label: 'Abandoned' }
        ]
      },
      {
        id: 'vulnerable',
        label: 'Vulnerable',
        children: [
          { id: 'victimized', label: 'Victimized' },
          { id: 'fragile', label: 'Fragile' }
        ]
      },
      {
        id: 'despair',
        label: 'Despair',
        children: [
          { id: 'grief', label: 'Grief' },
          { id: 'powerless', label: 'Powerless' }
        ]
      },
      {
        id: 'guilty',
        label: 'Guilty',
        children: [
          { id: 'ashamed', label: 'Ashamed' },
          { id: 'remorseful', label: 'Remorseful' }
        ]
      },
      {
        id: 'depressed',
        label: 'Depressed',
        children: [
          { id: 'empty', label: 'Empty' },
          { id: 'inferior', label: 'Inferior' }
        ]
      },
      {
        id: 'hurt',
        label: 'Hurt',
        children: [
          { id: 'disappointed', label: 'Disappointed' },
          { id: 'embarrassed', label: 'Embarrassed' }
        ]
      }
    ]
  },
  {
    id: 'disgusted',
    label: 'Disgusted',
    color: '#6B7280', // Grey/Greenish center
    children: [
      {
        id: 'repelled',
        label: 'Repelled',
        children: [
          { id: 'hesitant', label: 'Hesitant' },
          { id: 'horrified', label: 'Horrified' }
        ]
      },
      {
        id: 'awful',
        label: 'Awful',
        children: [
          { id: 'detestable', label: 'Detestable' },
          { id: 'nauseated', label: 'Nauseated' }
        ]
      },
      {
        id: 'disappointed_disgust',
        label: 'Disappointed',
        children: [
          { id: 'revolted', label: 'Revolted' },
          { id: 'appalled', label: 'Appalled' }
        ]
      },
      {
        id: 'disapproving',
        label: 'Disapproving',
        children: [
          { id: 'embarrassed_disgust', label: 'Embarrassed' },
          { id: 'judgmental', label: 'Judgmental' }
        ]
      }
    ]
  },
  {
    id: 'angry',
    label: 'Angry',
    color: '#EF4444', // Red bold
    children: [
      {
        id: 'critical',
        label: 'Critical',
        children: [
          { id: 'skeptical', label: 'Skeptical' },
          { id: 'dismissive', label: 'Dismissive' }
        ]
      },
      {
        id: 'distant',
        label: 'Distant',
        children: [
          { id: 'numb', label: 'Numb' },
          { id: 'withdrawn', label: 'Withdrawn' }
        ]
      },
      {
        id: 'frustrated',
        label: 'Frustrated',
        children: [
          { id: 'annoyed', label: 'Annoyed' },
          { id: 'infuriated', label: 'Infuriated' }
        ]
      },
      {
        id: 'aggressive',
        label: 'Aggressive',
        children: [
          { id: 'hostile', label: 'Hostile' },
          { id: 'provoked', label: 'Provoked' }
        ]
      },
      {
        id: 'mad',
        label: 'Mad',
        children: [
          { id: 'jealous', label: 'Jealous' },
          { id: 'furious', label: 'Furious' }
        ]
      },
      {
        id: 'bitter',
        label: 'Bitter',
        children: [
          { id: 'violated', label: 'Violated' },
          { id: 'indignant', label: 'Indignant' }
        ]
      },
      {
        id: 'humiliated',
        label: 'Humiliated',
        children: [
          { id: 'ridiculed', label: 'Ridiculed' },
          { id: 'disrespected', label: 'Disrespected' }
        ]
      },
      {
        id: 'let_down',
        label: 'Let Down',
        children: [
          { id: 'resentful', label: 'Resentful' },
          { id: 'betrayed', label: 'Betrayed' }
        ]
      }
    ]
  },
  {
    id: 'fearful',
    label: 'Fearful',
    color: '#F97316', // Orange/Yellow bold
    children: [
      {
        id: 'threatened',
        label: 'Threatened',
        children: [
          { id: 'nervous', label: 'Nervous' },
          { id: 'exposed', label: 'Exposed' }
        ]
      },
      {
        id: 'rejected',
        label: 'Rejected',
        children: [
          { id: 'excluded', label: 'Excluded' },
          { id: 'persecuted', label: 'Persecuted' }
        ]
      },
      {
        id: 'weak',
        label: 'Weak',
        children: [
          { id: 'worthless', label: 'Worthless' },
          { id: 'insignificant', label: 'Insignificant' }
        ]
      },
      {
        id: 'insecure',
        label: 'Insecure',
        children: [
          { id: 'inadequate', label: 'Inadequate' },
          { id: 'inferior_fear', label: 'Inferior' }
        ]
      },
      {
        id: 'anxious',
        label: 'Anxious',
        children: [
          { id: 'overwhelmed', label: 'Overwhelmed' },
          { id: 'worried', label: 'Worried' }
        ]
      },
      {
        id: 'scared',
        label: 'Scared',
        children: [
          { id: 'frightened', label: 'Frightened' },
          { id: 'helpless', label: 'Helpless' }
        ]
      }
    ]
  },
  {
    id: 'bad',
    label: 'Bad',
    color: '#10B981', // Green bold
    children: [
      {
        id: 'bored',
        label: 'Bored',
        children: [
          { id: 'indifferent', label: 'Indifferent' },
          { id: 'apathetic', label: 'Apathetic' }
        ]
      },
      {
        id: 'busy',
        label: 'Busy',
        children: [
          { id: 'pressured', label: 'Pressured' },
          { id: 'rushed', label: 'Rushed' }
        ]
      },
      {
        id: 'stressed',
        label: 'Stressed',
        children: [
          { id: 'overwhelmed_bad', label: 'Overwhelmed' },
          { id: 'out_of_control', label: 'Out of Control' }
        ]
      },
      {
        id: 'tired',
        label: 'Tired',
        children: [
          { id: 'sleepy', label: 'Sleepy' },
          { id: 'unfocussed', label: 'Unfocussed' }
        ]
      }
    ]
  },
  {
    id: 'surprised',
    label: 'Surprised',
    color: '#8B5CF6', // Bold Purple
    children: [
      {
        id: 'startled',
        label: 'Startled',
        children: [
          { id: 'shocked', label: 'Shocked' },
          { id: 'dismayed', label: 'Dismayed' }
        ]
      },
      {
        id: 'confused',
        label: 'Confused',
        children: [
          { id: 'disillusioned', label: 'Disillusioned' },
          { id: 'perplexed', label: 'Perplexed' }
        ]
      },
      {
        id: 'amazed',
        label: 'Amazed',
        children: [
          { id: 'astonished', label: 'Astonished' },
          { id: 'awe', label: 'Awe' }
        ]
      },
      {
        id: 'excited',
        label: 'Excited',
        children: [
          { id: 'eager', label: 'Eager' },
          { id: 'energetic', label: 'Energetic' }
        ]
      }
    ]
  }
];

//This will change later

export const EMOTION_RESPONSES: Record<string, string> = {
  // Add generic responses for the 7 main roots
  happy: "It is great to see you thriving! Remember this feeling.",
  sad: "It's okay to feel sad. Be gentle with yourself today.",
  disgusted: "Trust your instincts. If something feels wrong, it probably is.",
  angry: "Anger is a signal. What boundary of yours was crossed?",
  fearful: "You are safe. Take a deep breath and ground yourself.",
  bad: "It sounds like a tough moment. Take it one step at a time.",
  surprised: "Life is full of the unexpected. Take a moment to process it."
};