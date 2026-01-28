import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView, StatusBar, Animated, LayoutAnimation, UIManager, Image } from 'react-native';
import { Check, ChevronLeft, Sparkles, ChevronRight } from 'lucide-react-native';
import { EMOTION_WHEEL } from '../constants/emotions';
import { ScreenContainer, AppHeader, Card } from '../components';
import { useCheckInController } from '../controllers/useCheckInController';
import { getRootEmotion } from '../utils/emotionUtils';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MOOD_IMAGES: { [key: string]: any } = {
  happy: require('../../assets/images/emojis/happy.png'),
  sad: require('../../assets/images/emojis/sad.png'),
  angry: require('../../assets/images/emojis/angry.png'),
  disgusted: require('../../assets/images/emojis/disgusted.png'),
  fearful: require('../../assets/images/emojis/fearful.png'),
  bad: require('../../assets/images/emojis/bad.png'),
  surprised: require('../../assets/images/emojis/surprised.png'),
};

export default function CheckInScreen({ navigation }: any) {
  const { finalSelections, toggleSelection, isSelected } = useCheckInController();

  // Ring navigation state
  const [currentRing, setCurrentRing] = useState<'root' | 'children' | 'grandchildren'>('root');
  const [selectedRootForExpansion, setSelectedRootForExpansion] = useState<any>(null);
  const [selectedChildForExpansion, setSelectedChildForExpansion] = useState<any>(null);

  // Hover state for current emotion being explored
  const [currentEmotionInFocus, setCurrentEmotionInFocus] = useState<any>(null);

  const pillAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;
  const ctaAnimation = useRef(new Animated.Value(0)).current;

  // Animate CTA button entrance
  useEffect(() => {
    if (finalSelections.length > 0) {
      Animated.spring(ctaAnimation, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(ctaAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [finalSelections.length]);

  // Reset to root ring with smooth animation
  const resetToRootRing = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        300,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );

    setCurrentRing('root');
    setSelectedRootForExpansion(null);
    setSelectedChildForExpansion(null);
    setCurrentEmotionInFocus(null);
  };

  // Add emotion to selections (with animation)
  const addSelectionWithAnimation = (emotion: any) => {
    let parent = null;
    let grandparent = null;

    // Determine context for path building
    if (currentRing === 'grandchildren') {
      grandparent = selectedRootForExpansion;
      parent = selectedChildForExpansion;
    } else if (currentRing === 'children') {
      parent = selectedRootForExpansion;
    }

    // Initialize animation
    pillAnimations[emotion.id] = new Animated.Value(0);

    // Use controller's toggleSelection to add
    // Passing parent/grandparent lets the controller build the correct path
    toggleSelection(emotion, parent, grandparent);

    // Animate in
    Animated.spring(pillAnimations[emotion.id], {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  // Handle "Select This Emotion" button
  const handleSelectCurrentEmotion = () => {
    if (!currentEmotionInFocus) return;

    if (finalSelections.length >= 3) {
      Alert.alert(
        "You're doing great! 🌟",
        "Three emotions is perfect for reflection. Ready to continue?",
        [{ text: "Okay", style: "default" }]
      );
      return;
    }

    addSelectionWithAnimation(currentEmotionInFocus);

    // Return to root after selection
    setTimeout(resetToRootRing, 400);
  };

  // Handle "Go Deeper" button - navigate to next ring
  const handleGoDeeper = (emotion: any) => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        300,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );

    if (currentRing === 'root') {
      setCurrentRing('children');
      setSelectedRootForExpansion(emotion);
      setCurrentEmotionInFocus(emotion);
    } else if (currentRing === 'children') {
      setCurrentRing('grandchildren');
      setSelectedChildForExpansion(emotion);
      setCurrentEmotionInFocus(emotion);
    }
  };

  // Handle emotion card tap - shows action buttons
  const handleEmotionCardTap = (emotion: any) => {
    setCurrentEmotionInFocus(emotion);
  };

  // Check if emotion is in focus
  const isInFocus = (id: string) => currentEmotionInFocus?.id === id;

  // Remove selection with animation
  const removeSelectionWithAnimation = (id: string) => {
    if (pillAnimations[id]) {
      Animated.timing(pillAnimations[id], {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        toggleSelection({ id });
      });
    } else {
      toggleSelection({ id });
    }
  };



  // Check if emotion has children
  const hasChildren = (emotion: any) => {
    return emotion.children && emotion.children.length > 0;
  };

  // Render Ring 1: Root emotions
  const renderRootRing = () => {
    return (
      <View style={styles.wheelContainer}>
        <Card style={styles.emotionGrid} padding={16} borderRadius={24}>
          {EMOTION_WHEEL.map((rootEmotion) => {
            const isEmotionSelected = isSelected(rootEmotion.id);
            const isEmotionInFocus = isInFocus(rootEmotion.id);
            const canGoDeeper = hasChildren(rootEmotion);
            const emojiSource = MOOD_IMAGES[rootEmotion.id];

            return (
              <View key={rootEmotion.id}>
                <TouchableOpacity
                  style={[
                    styles.emotionSegment,
                    isEmotionSelected && styles.emotionSegmentSelected,
                    isEmotionInFocus && styles.emotionSegmentInFocus,
                    {
                      borderColor: isEmotionSelected || isEmotionInFocus ? rootEmotion.color : '#F1F5F9',
                      backgroundColor: isEmotionSelected ? rootEmotion.color + '08' : '#fff',
                    }
                  ]}
                  onPress={() => handleEmotionCardTap(rootEmotion)}
                  activeOpacity={0.7}
                >
                  <View style={styles.emotionLeft}>
                    {emojiSource ? (
                      <Image source={emojiSource} style={styles.emotionEmoji} resizeMode="contain" />
                    ) : (
                      <View style={[
                        styles.emotionDot,
                        {
                          backgroundColor: rootEmotion.color,
                          shadowColor: rootEmotion.color,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 4,
                          elevation: 3,
                        }
                      ]} />
                    )}

                    <Text style={[
                      styles.emotionLabel,
                      isEmotionSelected && styles.emotionLabelSelected
                    ]}>
                      {rootEmotion.label}
                    </Text>
                  </View>

                  <View style={styles.emotionRight}>
                    {isEmotionSelected && (
                      <View style={[
                        styles.checkCircle,
                        { backgroundColor: rootEmotion.color }
                      ]}>
                        <Check size={14} color="#fff" strokeWidth={3} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Action Buttons - Show when emotion is in focus */}
                {isEmotionInFocus && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.selectButton,
                        { backgroundColor: rootEmotion.color }
                      ]}
                      onPress={handleSelectCurrentEmotion}
                      activeOpacity={0.8}
                    >
                      <Check size={18} color="#fff" strokeWidth={2.5} />
                      <Text style={styles.actionButtonText}>Select This</Text>
                    </TouchableOpacity>

                    {canGoDeeper && (
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.deeperButton,
                          { borderColor: rootEmotion.color }
                        ]}
                        onPress={() => handleGoDeeper(rootEmotion)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.actionButtonTextOutline, { color: rootEmotion.color }]}>
                          Go Deeper
                        </Text>
                        <ChevronRight size={18} color={rootEmotion.color} strokeWidth={2.5} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </Card>
      </View>
    );
  };

  // Render Ring 2: Children emotions
  const renderChildrenRing = () => {
    if (!selectedRootForExpansion) return null;

    return (
      <View style={styles.wheelContainer}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={resetToRootRing}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={selectedRootForExpansion.color} strokeWidth={2.5} />
          <Text style={[styles.backText, { color: selectedRootForExpansion.color }]}>
            Back to emotions
          </Text>
        </TouchableOpacity>

        <View style={[
          styles.categoryBadge,
          { backgroundColor: selectedRootForExpansion.color + '15' }
        ]}>
          <View style={[
            styles.categoryBadgeDot,
            { backgroundColor: selectedRootForExpansion.color }
          ]} />
          <Text style={[styles.categoryBadgeText, { color: selectedRootForExpansion.color }]}>
            {selectedRootForExpansion.label}
          </Text>
        </View>

        <Card style={styles.emotionGrid} padding={16} borderRadius={24}>
          {selectedRootForExpansion.children.map((childEmotion: any) => {
            const isEmotionSelected = isSelected(childEmotion.id);
            const isEmotionInFocus = isInFocus(childEmotion.id);
            const canGoDeeper = hasChildren(childEmotion);

            return (
              <View key={childEmotion.id}>
                <TouchableOpacity
                  style={[
                    styles.emotionSegment,
                    styles.childEmotionSegment,
                    isEmotionSelected && styles.emotionSegmentSelected,
                    isEmotionInFocus && styles.emotionSegmentInFocus,
                    {
                      borderColor: isEmotionSelected || isEmotionInFocus ? selectedRootForExpansion.color : '#E2E8F0',
                      backgroundColor: isEmotionSelected ? selectedRootForExpansion.color + '08' : '#fff',
                    }
                  ]}
                  onPress={() => handleEmotionCardTap(childEmotion)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.emotionLabel,
                    styles.childEmotionLabel,
                    isEmotionSelected && styles.emotionLabelSelected
                  ]}>
                    {childEmotion.label}
                  </Text>

                  {isEmotionSelected && (
                    <View style={[
                      styles.checkCircle,
                      { backgroundColor: selectedRootForExpansion.color }
                    ]}>
                      <Check size={14} color="#fff" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Action Buttons */}
                {isEmotionInFocus && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.selectButton,
                        { backgroundColor: selectedRootForExpansion.color }
                      ]}
                      onPress={handleSelectCurrentEmotion}
                      activeOpacity={0.8}
                    >
                      <Check size={18} color="#fff" strokeWidth={2.5} />
                      <Text style={styles.actionButtonText}>Select This</Text>
                    </TouchableOpacity>

                    {canGoDeeper && (
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.deeperButton,
                          { borderColor: selectedRootForExpansion.color }
                        ]}
                        onPress={() => handleGoDeeper(childEmotion)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.actionButtonTextOutline, { color: selectedRootForExpansion.color }]}>
                          Go Deeper
                        </Text>
                        <ChevronRight size={18} color={selectedRootForExpansion.color} strokeWidth={2.5} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </Card>
      </View>
    );
  };

  // Render Ring 3: Grandchildren emotions
  const renderGrandchildrenRing = () => {
    if (!selectedRootForExpansion || !selectedChildForExpansion) return null;

    return (
      <View style={styles.wheelContainer}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            LayoutAnimation.configureNext(
              LayoutAnimation.create(
                300,
                LayoutAnimation.Types.easeInEaseOut,
                LayoutAnimation.Properties.opacity
              )
            );
            setCurrentRing('children');
            setSelectedChildForExpansion(null);
            setCurrentEmotionInFocus(null);
          }}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={selectedRootForExpansion.color} strokeWidth={2.5} />
          <Text style={[styles.backText, { color: selectedRootForExpansion.color }]}>
            Back to {selectedRootForExpansion.label}
          </Text>
        </TouchableOpacity>

        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <View style={[
            styles.breadcrumbBadge,
            { backgroundColor: selectedRootForExpansion.color + '15' }
          ]}>
            <Text style={[styles.breadcrumbText, { color: selectedRootForExpansion.color }]}>
              {selectedRootForExpansion.label}
            </Text>
          </View>
          <ChevronRight size={14} color="#94A3B8" strokeWidth={2} />
          <View style={[
            styles.breadcrumbBadge,
            { backgroundColor: selectedRootForExpansion.color + '25' }
          ]}>
            <Text style={[styles.breadcrumbText, { color: selectedRootForExpansion.color }]}>
              {selectedChildForExpansion.label}
            </Text>
          </View>
        </View>

        <Text style={styles.ringTitle}>Refine your feeling</Text>

        <Card style={styles.emotionGrid} padding={16} borderRadius={24}>
          {selectedChildForExpansion.children?.map((grandchildEmotion: any) => {
            const isEmotionSelected = isSelected(grandchildEmotion.id);
            const isEmotionInFocus = isInFocus(grandchildEmotion.id);

            return (
              <View key={grandchildEmotion.id}>
                <TouchableOpacity
                  style={[
                    styles.emotionSegment,
                    styles.grandchildEmotionSegment,
                    isEmotionSelected && styles.emotionSegmentSelected,
                    isEmotionInFocus && styles.emotionSegmentInFocus,
                    {
                      borderColor: isEmotionSelected || isEmotionInFocus ? selectedRootForExpansion.color : '#E2E8F0',
                      backgroundColor: isEmotionSelected ? selectedRootForExpansion.color + '08' : '#fff',
                    }
                  ]}
                  onPress={() => handleEmotionCardTap(grandchildEmotion)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.emotionLabel,
                    styles.grandchildEmotionLabel,
                    isEmotionSelected && styles.emotionLabelSelected
                  ]}>
                    {grandchildEmotion.label}
                  </Text>

                  {isEmotionSelected && (
                    <View style={[
                      styles.checkCircle,
                      styles.checkCircleSmall,
                      { backgroundColor: selectedRootForExpansion.color }
                    ]}>
                      <Check size={12} color="#fff" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Action Button - Only Select (no deeper levels) */}
                {isEmotionInFocus && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.selectButton,
                        styles.actionButtonFull,
                        { backgroundColor: selectedRootForExpansion.color }
                      ]}
                      onPress={handleSelectCurrentEmotion}
                      activeOpacity={0.8}
                    >
                      <Check size={18} color="#fff" strokeWidth={2.5} />
                      <Text style={styles.actionButtonText}>Select This Emotion</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </Card>
      </View>
    );
  };

  return (
    <ScreenContainer variant="focus">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <AppHeader
        emoji="💭"
        title="How are you feeling?"
        subtitle="Take a moment to check in with yourself"
        style={styles.header}
        titleStyle={styles.title}
        subtitleStyle={styles.subtitle}
      />

      {/* Floating Selected Pills */}
      {finalSelections.length > 0 && (
        <View style={styles.floatingSelected}>
          <View style={styles.selectedPillsContainer}>
            {finalSelections.map((selection) => {
              const rootEmotion = getRootEmotion(selection);
              const color = rootEmotion?.color || '#6B7280';
              const animValue = pillAnimations[selection.id] || new Animated.Value(1);

              return (
                <Animated.View
                  key={selection.id}
                  style={[
                    styles.selectedPill,
                    {
                      backgroundColor: color + '15',
                      borderColor: color,
                      opacity: animValue,
                      transform: [
                        {
                          scale: animValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 1],
                          }),
                        },
                      ],
                    }
                  ]}
                >
                  <Text style={[styles.selectedPillText, { color }]}>
                    {selection.label}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeSelectionWithAnimation(selection.id)}
                    style={styles.pillRemove}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={[styles.pillRemoveText, { color }]}>×</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}

            {/* Empty slots */}
            {[...Array(3 - finalSelections.length)].map((_, i) => (
              <View key={`empty-${i}`} style={styles.emptySlot}>
                <Text style={styles.emptySlotText}>+</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Conditionally render current ring */}
        {currentRing === 'root' && renderRootRing()}
        {currentRing === 'children' && renderChildrenRing()}
        {currentRing === 'grandchildren' && renderGrandchildrenRing()}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Animated CTA Button */}
      {finalSelections.length > 0 && (
        <Animated.View
          style={[
            styles.ctaContainer,
            {
              opacity: ctaAnimation,
              transform: [
                {
                  translateY: ctaAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
                {
                  scale: ctaAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            }
          ]}
        >
          <TouchableOpacity
            style={[
              styles.ctaButton,
              finalSelections.length === 3 && styles.ctaButtonComplete
            ]}
            onPress={() => navigation?.navigate('Reflection', { selections: finalSelections })}
            activeOpacity={0.9}
          >
            <View style={styles.ctaContent}>
              <Sparkles size={20} color="#fff" strokeWidth={2} />
              <Text style={styles.ctaText}>
                {finalSelections.length === 3
                  ? "Continue to Reflection"
                  : `Continue (${finalSelections.length}/3)`}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },

  // Header
  header: {
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A4A4A',
    fontWeight: '500',
  },

  // Floating Pills
  floatingSelected: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  selectedPillsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  selectedPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pillRemove: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillRemoveText: {
    fontSize: 20,
    fontWeight: '400',
    lineHeight: 20,
  },
  emptySlot: {
    width: 40,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotText: {
    fontSize: 18,
    color: '#CBD5E1',
    fontWeight: '300',
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 140,
  },

  // Wheel Container
  wheelContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ringTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  ringSubtitle: {
    fontSize: 16,
    color: '#4A4A4A',
    textAlign: 'center',
    marginBottom: 28,
    fontWeight: '500',
  },

  // Back Button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 16,
    gap: 4,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Category Badge (Ring 2)
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    gap: 8,
  },
  categoryBadgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Breadcrumb (Ring 3)
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    gap: 8,
  },
  breadcrumbBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  breadcrumbText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Emotion Grid
  emotionGrid: {
    gap: 20,
  },
  emotionEmoji: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  emotionSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 60,
  },

  emotionSegmentSelected: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emotionSegmentInFocus: {
    borderWidth: 2.5,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  childEmotionSegment: {
    minHeight: 60,
    paddingVertical: 16,
  },
  grandchildEmotionSegment: {
    minHeight: 56,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  emotionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  emotionRight: {
    marginLeft: 12,
  },
  emotionDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  emotionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    flex: 1,
  },
  childEmotionLabel: {
    fontSize: 16,
  },
  grandchildEmotionLabel: {
    fontSize: 15,
  },
  emotionLabelSelected: {
    fontWeight: '700',
    color: '#0F172A',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    gap: 6,
    flex: 1,
  },
  actionButtonFull: {
    flex: 1,
  },
  selectButton: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  deeperButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  actionButtonTextOutline: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  bottomSpacer: {
    height: 20,
  },

  // CTA Button
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  ctaButton: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  ctaButtonComplete: {
    backgroundColor: '#10B981',
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
      },
    }),
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});