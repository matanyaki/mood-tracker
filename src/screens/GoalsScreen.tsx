import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle, Plus, Target } from 'lucide-react-native';
import { format } from 'date-fns';
import type { Goal } from '@shared/types';
import {
  pauseLastDay, resumeDay, currentPause, isGoalPaused, goalLastDay, plannedDayCount, endPause,
} from '../../shared/types';
import { countScheduledDaysThrough } from '../../shared/utils/goalProgress';
import {
  ScreenContainer, AppHeader, BackButton, EmptyState, GoalCard, PrimaryButton, primaryButtonInk,
} from '../components';
import { GoalListSkeleton } from '../components/skeleton';
import { PixelAlert } from '../components/ui/PixelAlert';
import { useGoalsQuery, useGoalCompletionsQuery } from '../hooks/useGoalsQuery';
import { useGoalsController } from '../controllers/useGoalsController';
import { TYPE } from '../constants/typography';
import {
  CARD_GAP, HEADING_GAP, SCREEN_BOTTOM, SCREEN_GUTTER, SCREEN_TOP, SECTION_GAP, SPACE,
} from '../constants/layout';
import { OUTLINE, INK_MUTED, BORDER_W_INNER } from '../constants/pixel';

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
  const insets = useSafeAreaInsets();

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
      <AppHeader
        title="Goals"
        subtitle="What you are working on"
        leftAction={<BackButton onPress={() => navigation.goBack()} />}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && <GoalListSkeleton />}

        {isError && !isLoading && (
          <EmptyState
            icon={<AlertTriangle size={32} color={INK_MUTED} strokeWidth={2.5} />}
            title="COULD NOT LOAD GOALS"
            subtitle="Check your connection and try again."
            buttonLabel="[ TRY AGAIN ]"
            onButtonPress={refetch}
          />
        )}

        {!isLoading && !isError && goals?.length === 0 && (
          <EmptyState
            icon={<Target size={32} color={INK_MUTED} strokeWidth={2.5} />}
            title="NO GOALS YET"
            subtitle="Set one and pick the days you want to show up for it."
            buttonLabel="[ NEW GOAL ]"
            onButtonPress={handleCreate}
          />
        )}

        {!isLoading && !isError && !!goals?.length && (
          // Each heading travels with its cards: closer to them (HEADING_GAP) than
          // the two sections are to each other (SECTION_GAP).
          <>
            {activeGoals.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.countEyebrow}>[ ACTIVE ]</Text>
                <View style={styles.cards}>
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
                </View>
              </View>
            )}

            {pausedGoals.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.countEyebrow}>[ PAUSED ]</Text>
                <View style={styles.cards}>
                  {pausedGoals.map(goal => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={handleEdit}
                      onResume={handleResume}
                      onDelete={handleDelete}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Pinned rather than scrolled with the list: the way to add a goal should not
          move further away the more goals there are. */}
      <View style={[styles.footer, { paddingBottom: SPACE.lg + insets.bottom }]}>
        {/* The screen's one primary action -- the same PrimaryButton as everywhere
            else, rather than the hand-drawn copy of it this used to be. */}
        <PrimaryButton
          label="NEW GOAL"
          onPress={handleCreate}
          icon={<Plus size={18} color={primaryButtonInk()} strokeWidth={3} />}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: SCREEN_TOP,
    paddingBottom: SCREEN_BOTTOM,
    gap: SECTION_GAP,
  },
  section: {
    gap: HEADING_GAP,
  },
  cards: {
    gap: CARD_GAP,
  },
  countEyebrow: {
    ...TYPE.h2,
  },
  footer: {
    // paddingBottom is set inline: the home-indicator inset is added to it.
    paddingTop: SPACE.lg,
    paddingHorizontal: SCREEN_GUTTER,
    // Flat rule instead of a gradient fade, the same way CheckIn separates its
    // footer: this is a separate pixel plane sitting over the scroll.
    borderTopWidth: BORDER_W_INNER,
    borderTopColor: OUTLINE,
    backgroundColor: 'rgba(255,253,248,0.92)',
  },
});
