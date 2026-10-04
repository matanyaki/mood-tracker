import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { format } from 'date-fns';
import type { Goal } from '@shared/types';
import {
  pauseLastDay, resumeDay, currentPause, isGoalPaused, goalLastDay, plannedDayCount, endPause,
} from '../../shared/types';
import { countScheduledDaysThrough } from '../../shared/utils/goalProgress';
import { ScreenContainer, AppHeader, EmptyState, GoalCard } from '../components';
import { PixelAlert } from '../components/ui/PixelAlert';
import { useGoalsQuery, useGoalCompletionsQuery } from '../hooks/useGoalsQuery';
import { useGoalsController } from '../controllers/useGoalsController';
import { PIXEL, PIXEL_BOLD } from '../constants/typography';
import {
  OUTLINE, PAPER, INK, INK_MUTED,
  SHADOW_OFFSET, BORDER_W, BORDER_W_INNER,
} from '../constants/pixel';

/**
 * The goal list: everything the user is working on, with the way in to the form.
 *
 * Reached from the Fab's Goals action. Reads through useGoalsQuery and writes only
 * pauses, resumes and deletes -- creating and editing both hand off to GoalForm,
 * which owns the whole schedule at once.
 *
 * Pausing is the everyday way to step back from a goal: it keeps every day already
 * behind it, and resuming picks the run up where it left off. Delete stays for
 * goals made by mistake.
 */
export default function GoalsScreen({ navigation }: any) {
  const { data: goals, isLoading, isError, refetch } = useGoalsQuery();
  const { data: completions } = useGoalCompletionsQuery();
  const { deleteGoal, pauseGoal, resumeGoal } = useGoalsController();

  // Read once per mount, like the Today card and the Diary: which day is "today"
  // must not move under a confirmation dialog that is already open.
  const [today] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  // Running goals first, paused ones in their own section underneath.
  const { activeGoals, pausedGoals } = useMemo(() => ({
    activeGoals: (goals ?? []).filter(goal => !isGoalPaused(goal)),
    pausedGoals: (goals ?? []).filter(goal => isGoalPaused(goal)),
  }), [goals]);

  const handleCreate = useCallback(() => {
    navigation.navigate('GoalForm', {});
  }, [navigation]);

  const handleEdit = useCallback((goal: Goal) => {
    navigation.navigate('GoalForm', { goal });
  }, [navigation]);

  // Deleting takes the completions with it, so it is worth one confirmation --
  // this is the only destructive action in the flow.
  const confirmDelete = useCallback((goal: Goal, title: string, message: string) => {
    PixelAlert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGoal(goal.id!);
          } catch {
            PixelAlert.alert('Error', 'Could not delete the goal. Please try again.');
          }
        },
      },
    ]);
  }, [deleteGoal]);

  const handlePause = useCallback((goal: Goal) => {
    const doneToday = (completions?.[goal.id!] ?? []).includes(today);
    const lastDay = pauseLastDay(today, doneToday);

    // A goal with no scheduled day up to the pause has no past to keep, so pausing
    // it would only leave an empty card behind. Offer the delete instead.
    if (countScheduledDaysThrough(goal, lastDay) === 0) {
      confirmDelete(
        goal,
        'Nothing to keep yet',
        `"${goal.name}" hasn't had any days yet, so there's no history to keep. Delete it instead?`
      );
      return;
    }

    PixelAlert.alert(
      'Pause goal?',
      `"${goal.name}" won't be scheduled from ${doneToday ? 'tomorrow' : 'today'} until you resume it. ` +
      "Every day behind you stays, and the days you haven't done yet wait for you.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pause',
          onPress: async () => {
            try {
              await pauseGoal(goal.id!, lastDay);
            } catch {
              PixelAlert.alert('Error', 'Could not pause the goal. Please try again.');
            }
          },
        },
      ]
    );
  }, [completions, today, pauseGoal, confirmDelete]);

  const handleResume = useCallback((goal: Goal) => {
    const pause = currentPause(goal);
    if (!pause) return;

    const resumedOn = resumeDay(today, pause.lastDay);
    const daysLeft = plannedDayCount(goal) - countScheduledDaysThrough(goal, pause.lastDay);

    // The end it will have once resumed -- the same rule the server applies, so the
    // date in the dialog is the date the card shows afterwards.
    const change = endPause(goal, resumedOn);
    const newEnd = 'pauses' in change ? goalLastDay({ ...goal, pauses: change.pauses }) : null;
    const [y, m, d] = (newEnd ?? '').split('-');

    PixelAlert.alert(
      'Resume goal?',
      `"${goal.name}" picks up where it left off, from ${resumedOn === today ? 'today' : 'tomorrow'}. ` +
      `${daysLeft} goal ${daysLeft === 1 ? 'day' : 'days'} to go` +
      (newEnd ? `, so it now ends ${d}/${m}/${y.slice(2)}.` : '.'),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resume',
          onPress: async () => {
            try {
              await resumeGoal(goal.id!, resumedOn);
            } catch {
              PixelAlert.alert('Error', 'Could not resume the goal. Please try again.');
            }
          },
        },
      ]
    );
  }, [today, resumeGoal]);

  const handleDelete = useCallback((goal: Goal) => {
    confirmDelete(
      goal,
      'Delete goal?',
      `"${goal.name}" and every day marked done against it will be removed.`
    );
  }, [confirmDelete]);

  return (
    <ScreenContainer variant="focus">
      {/* AppHeader is shared with five other screens, so the pixel treatment is
          passed in here rather than baked into the component. */}
      <AppHeader
        title="Goals"
        subtitle="What you are working on"
        style={styles.header}
        titleStyle={styles.headerTitle}
        subtitleStyle={styles.headerSubtitle}
        leftAction={
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            hitSlop={8}
          >
            <ArrowLeft color={INK} size={20} strokeWidth={2.5} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && (
          <ActivityIndicator style={styles.loader} color={INK} />
        )}

        {isError && !isLoading && (
          <EmptyState
            emoji="⚠️"
            title="Could not load goals"
            subtitle="Check your connection and try again."
            buttonLabel="Retry"
            onButtonPress={refetch}
          />
        )}

        {!isLoading && !isError && goals?.length === 0 && (
          <EmptyState
            emoji="🎯"
            title="No goals yet"
            subtitle="Set one and pick the days you want to show up for it."
            buttonLabel="New Goal"
            onButtonPress={handleCreate}
          />
        )}

        {!isLoading && !isError && !!goals?.length && (
          <>
            {activeGoals.length > 0 && (
              <Text style={styles.countEyebrow}>
                [ ACTIVE ]
              </Text>
            )}

            {activeGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={handleEdit}
                // A goal past its last day has no days left to pause.
                onPause={goalLastDay(goal) >= today ? handlePause : undefined}
                onDelete={handleDelete}
              />
            ))}

            {pausedGoals.length > 0 && (
              <Text style={[styles.countEyebrow, activeGoals.length > 0 && styles.sectionGap]}>
                [ PAUSED ]
              </Text>
            )}

            {pausedGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={handleEdit}
                onResume={handleResume}
                onDelete={handleDelete}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Pinned rather than scrolled with the list: the way to add a goal should not
          move further away the more goals there are. */}
      <View style={styles.footer}>
        <View style={styles.newButtonWrapper}>
          <View style={styles.newButtonShadow} pointerEvents="none" />
          <Pressable
            onPress={handleCreate}
            style={({ pressed }) => [styles.newButton, pressed && styles.newButtonPressed]}
          >
            <Plus size={18} color="#FFF" strokeWidth={3} />
            <Text style={styles.newButtonText}>NEW GOAL</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    letterSpacing: 2,
    color: INK,
  },
  headerSubtitle: {
    fontSize: 11,
    letterSpacing: 1,
    color: INK_MUTED,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PAPER,
    borderWidth: BORDER_W_INNER,
    borderColor: OUTLINE,
  },
  backButtonPressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
    backgroundColor: '#EDE9E0',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 14,
  },
  loader: {
    marginTop: 40,
  },
  countEyebrow: {
    fontSize: 10,
    fontFamily: PIXEL_BOLD,
    color: INK_MUTED,
    letterSpacing: 2,
  },
  sectionGap: {
    marginTop: 10,
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
    // Flat rule instead of a gradient fade, the same way CheckIn separates its
    // footer: this is a separate pixel plane sitting over the scroll.
    borderTopWidth: BORDER_W_INNER,
    borderTopColor: OUTLINE,
    backgroundColor: 'rgba(255,253,248,0.92)',
  },
  newButtonWrapper: {
    alignSelf: 'stretch',
    position: 'relative',
    marginRight: SHADOW_OFFSET,
    marginBottom: SHADOW_OFFSET,
  },
  newButtonShadow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: OUTLINE,
    transform: [{ translateX: SHADOW_OFFSET }, { translateY: SHADOW_OFFSET }],
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#10B981',
    borderWidth: BORDER_W,
    borderColor: OUTLINE,
  },
  newButtonPressed: {
    // Sinks onto its own shadow block, which is the press feedback PrimaryButton
    // uses -- the travel has to equal the offset or the face lands off the block.
    transform: [{ translateX: SHADOW_OFFSET }, { translateY: SHADOW_OFFSET }],
  },
  newButtonText: {
    fontSize: 13,
    fontFamily: PIXEL_BOLD,
    color: '#FFF',
    letterSpacing: 1,
  },
});
