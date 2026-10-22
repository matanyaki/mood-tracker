import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, Check } from 'lucide-react-native';
import { format } from 'date-fns';
import type { CreateGoalDTO, DurationUnit, Goal, ScheduleMode, TimeOfDay } from '@shared/types';
import {
  MAX_DURATION, goalDuration, goalScheduleError, plannedDayCount, resolveEndDate,
  isDatesSchedule, datesScheduleFields,
} from '../../shared/types';
import {
  ScreenContainer, AppHeader, BackButton, PrimaryButton, primaryButtonInk, PixelField, ToggleBox,
  CalendarPickerModal,
} from '../components';
import { PixelAlert } from '../components/ui/PixelAlert';
import { GOOD_GOAL_TIPS } from '../constants/help';
import { useGoalsController } from '../controllers/useGoalsController';
import { GOAL_TEXT, DANGER_TEXT } from '../constants/colors';
import {
  WEEKDAY_LABELS, TIMES_OF_DAY, TIME_OF_DAY_LABELS, DURATION_UNITS, DURATION_UNIT_LABELS,
  SCHEDULE_MODES, SCHEDULE_MODE_LABELS,
} from '../constants/goals';
import { TYPE, TIGHT_FONT_SCALE } from '../constants/typography';
import { HEADING_GAP, SCREEN_BOTTOM, SCREEN_GUTTER, SCREEN_TOP, SECTION_GAP, SPACE } from '../constants/layout';
import {
  INK, INK_MUTED, OUTLINE, PAPER, PRESSED, SHADOW_OFFSET, BORDER_W_INNER,
} from '../constants/pixel';

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * '2026-10-21' as '21 OCT 2026'. Built from the parts as a LOCAL date: parsing the
 * string would read it as UTC midnight, the previous day west of Greenwich.
 */
const formatDay = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return format(new Date(year, month - 1, day), 'd MMM yyyy').toUpperCase();
};

/** '2026-11-03' as '03/11/26', for the ENDS line. Sliced, so no Date is involved. */
const formatShortDay = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(2, 4)}`;

/** What a new goal starts on: short enough to finish, long enough to mean something. */
const DEFAULT_DURATION = { unit: 'weeks' as DurationUnit, count: 2 };

interface DateTriggerProps {
  eyebrow: string;
  value: string;
  accessibilityLabel: string;
  onPress: () => void;
}

/**
 * A date row that opens the calendar pop-up -- a native date picker renders as a
 * rounded wheel that this screen has nowhere to put. Drawn like a PixelSelect
 * trigger so it reads as the same kind of control as the fields around it.
 */
function DateTrigger({ eyebrow, value, accessibilityLabel, onPress }: DateTriggerProps) {
  return (
    <View>
      <Text style={[styles.eyebrow, styles.fieldEyebrow]}>{eyebrow}</Text>
      <View style={styles.dateWrapper}>
        <View style={styles.dateShadow} pointerEvents="none" />
        <Pressable
          onPress={onPress}
          hitSlop={{ top: 2, bottom: 2 }}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint="Opens a calendar to choose from"
          style={({ pressed }) => [styles.dateTrigger, pressed && styles.dateTriggerPressed]}
        >
          <Text style={styles.dateText} numberOfLines={1} maxFontSizeMultiplier={TIGHT_FONT_SCALE}>
            {value}
          </Text>
          <CalendarDays size={16} color={INK} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Create or edit one goal.
 *
 * Both jobs are one screen because a goal is only valid as a whole -- the weekday
 * boxes mean nothing without the length they repeat over -- so there is no half of
 * this form worth showing on its own. `route.params.goal` is what tells
 * the two apart.
 */
export default function GoalFormScreen({ route, navigation }: any) {
  const existing: Goal | undefined = route.params?.goal;
  const isEditing = !!existing;

  const { createGoal, updateGoal, isSaving } = useGoalsController();
  const insets = useSafeAreaInsets();

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const initialStart = existing?.startDate ?? todayKey;
  const isDatesGoal = !!existing && isDatesSchedule(existing);

  const [name, setName] = useState(existing?.name ?? '');
  const [mode, setMode] = useState<ScheduleMode>(isDatesGoal ? 'dates' : 'weekdays');
  // Only read in PICK DAYS mode, and kept while the user looks at SAME DAYS.
  const [pickedDates, setPickedDates] = useState<string[]>(isDatesGoal ? existing.dates ?? [] : []);
  const [daysPickerOpen, setDaysPickerOpen] = useState(false);
  const [startDate, setStartDate] = useState(initialStart);
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  // An edited goal opens on its own unit and count. A 'date' goal has no count, so
  // the field keeps the default ready in case the user switches to a counted unit.
  // A picked-days goal has no length at all, so SAME DAYS starts from the default.
  const initialDuration = existing && !isDatesGoal ? goalDuration(existing) : DEFAULT_DURATION;
  const [unit, setUnit] = useState<DurationUnit>(initialDuration.unit);
  const [countText, setCountText] = useState(String(initialDuration.count || DEFAULT_DURATION.count));
  // Only read for unit 'date'. Kept while the user tries other units, so coming
  // back to DATE finds the day they picked.
  const [pickedEndDate, setPickedEndDate] = useState<string | null>(
    existing && initialDuration.unit === 'date' ? existing.endDate : null
  );
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(existing?.daysOfWeek ?? []);
  const [timesOfDay, setTimesOfDay] = useState<TimeOfDay[]>(existing?.timesOfDay ?? []);

  // A new goal starts today or later. An edited goal that already started keeps its
  // start reachable, since its past days are history.
  const startMinDate = existing && existing.startDate < todayKey ? existing.startDate : todayKey;
  const startSelected = useMemo(() => [startDate], [startDate]);
  const handleStartSelect = useCallback((dates: string[]) => setStartDate(dates[0]), []);
  const closeStartPicker = useCallback(() => setStartPickerOpen(false), []);

  const endSelected = useMemo(() => (pickedEndDate ? [pickedEndDate] : []), [pickedEndDate]);
  const handleEndSelect = useCallback((dates: string[]) => setPickedEndDate(dates[0]), []);
  const closeEndPicker = useCallback(() => setEndPickerOpen(false), []);

  const closeDaysPicker = useCallback(() => setDaysPickerOpen(false), []);

  const sortedDays = useMemo(() => [...daysOfWeek].sort((a, b) => a - b), [daysOfWeek]);
  const count = parseInt(countText, 10);

  // The schedule exactly as it will be saved: the same object the shared rules,
  // the end date and the goal-day count all read, so the preview cannot disagree
  // with what the server stores. timesPerWeek is not a choice any more -- it is
  // however many weekdays are picked.
  const schedule = useMemo(() => ({
    scheduleMode: 'weekdays' as const,
    startDate,
    durationUnit: unit,
    durationCount: unit !== 'date' && count > 0 ? count : undefined,
    endDate: unit === 'date' ? pickedEndDate ?? undefined : undefined,
    daysOfWeek: sortedDays,
    timesPerWeek: sortedDays.length,
  }), [startDate, unit, count, pickedEndDate, sortedDays]);

  const endDate = resolveEndDate(schedule);
  const goalDays = endDate ? plannedDayCount({ ...schedule, endDate }) : 0;

  // PICK DAYS: the whole schedule is derived from the picks, by the same function
  // the server stores it with.
  const datesSchedule = useMemo(() => datesScheduleFields(pickedDates), [pickedDates]);
  const activeSchedule = mode === 'dates' ? datesSchedule : schedule;

  // The first switch to DATE starts from the end the current count gives, so the
  // length the user already set carries over instead of being dropped.
  const selectUnit = useCallback((option: DurationUnit) => {
    if (option === 'date' && !pickedEndDate && endDate) setPickedEndDate(endDate);
    setUnit(option);
  }, [pickedEndDate, endDate]);

  const toggleDay = useCallback((index: number) => {
    setDaysOfWeek(prev =>
      prev.includes(index)
        ? prev.filter(d => d !== index)
        : [...prev, index]
    );
  }, []);

  const toggleTimeOfDay = useCallback((time: TimeOfDay) => {
    setTimesOfDay(prev =>
      prev.includes(time)
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  }, []);

  // The schedule rules are goalScheduleError, the very function the server runs,
  // so the user is told which one they missed instead of being handed a 400. Today
  // is passed on create only: an edit keeps the past picks its history rests on.
  const validationError = useMemo(() => {
    if (!name.trim()) return 'Give the goal a name.';
    const scheduleError = goalScheduleError(activeSchedule, isEditing ? undefined : todayKey);
    if (scheduleError) return scheduleError;
    if (timesOfDay.length === 0) return 'Pick at least one time of day.';
    return null;
  }, [name, activeSchedule, isEditing, todayKey, timesOfDay]);

  const handleSave = useCallback(async () => {
    if (validationError || isSaving) return;

    // SAME DAYS: unit and count, never `months`. endDate goes up only for 'date',
    // where it is the length itself; for every other unit the server resolves its
    // own. PICK DAYS: the picks, and the fields derived from them.
    const data: CreateGoalDTO = mode === 'dates'
      ? { name: name.trim(), ...datesSchedule, timesOfDay }
      : {
        name: name.trim(),
        scheduleMode: 'weekdays',
        startDate,
        durationUnit: unit,
        ...(unit === 'date' ? { endDate: pickedEndDate! } : { durationCount: count }),
        timesPerWeek: sortedDays.length,
        daysOfWeek: sortedDays,
        timesOfDay,
      };

    try {
      if (isEditing) {
        await updateGoal(existing!.id!, data);
      } else {
        await createGoal(data);
      }
      navigation.goBack();
    } catch {
      PixelAlert.alert('Error', 'Could not save your goal. Please try again.');
    }
  }, [
    validationError, isSaving, name, startDate, unit, pickedEndDate, count,
    sortedDays, timesOfDay, isEditing, existing, updateGoal, createGoal, navigation,
    mode, datesSchedule,
  ]);

  return (
    <ScreenContainer variant="focus">
      <AppHeader
        title={isEditing ? 'Edit Goal' : 'New Goal'}
        leftAction={<BackButton onPress={() => navigation.goBack()} />}
        rightAction={{ label: 'HELP', onPress: () => PixelAlert.alert(GOOD_GOAL_TIPS.title, GOOD_GOAL_TIPS.body, [{ text: 'GOT IT' }]) }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: SCREEN_BOTTOM + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <PixelField
            eyebrow="[ GOAL ]"
            value={name}
            onChangeText={setName}
            placeholder="Run three times a week"
            maxLength={80}
          />

          {/* Everything below it until TIME OF DAY depends on this choice, so it
              sits first among the schedule fields. */}
          <View style={styles.section}>
            <Text style={styles.eyebrow}>[ SCHEDULE ]</Text>

            <View style={styles.weekRow}>
              {SCHEDULE_MODES.map(option => (
                <ToggleBox
                  key={option}
                  label={SCHEDULE_MODE_LABELS[option]}
                  selected={mode === option}
                  onPress={() => setMode(option)}
                  style={styles.dayBox}
                  accessibilityRole="radio"
                />
              ))}
            </View>
          </View>

          {mode === 'dates' ? (
            // Each day picked on the calendar, so no week has to look like the
            // last. Today is the earliest day that can be tapped, which on an edit
            // also locks the past picks: the goal's history is built on them.
            <View style={styles.section}>
              <DateTrigger
                eyebrow="[ DAYS ]"
                value={pickedDates.length > 0 ? `${pickedDates.length} PICKED` : 'PICK DAYS'}
                accessibilityLabel={`Picked days: ${pickedDates.length}`}
                onPress={() => setDaysPickerOpen(true)}
              />

              {pickedDates.length > 0 && (
                <Text style={styles.endDate}>
                  {pickedDates.length} {pickedDates.length === 1 ? 'DAY' : 'DAYS'}
                  {' * '}{formatShortDay(datesSchedule.startDate)} {'>'} {formatShortDay(datesSchedule.endDate)}
                  {' * '}MAX {datesSchedule.timesPerWeek} x / WEEK
                </Text>
              )}
            </View>
          ) : (
            <>
              <DateTrigger
                eyebrow="[ START DATE ]"
                value={formatDay(startDate)}
                accessibilityLabel={`Start date: ${formatDay(startDate)}`}
                onPress={() => setStartPickerOpen(true)}
              />

              {/* How long the goal runs: a unit, then its count -- or, for DATE, an end
                  date. The end date reads off both, so it sits with them rather than
                  floating between them and the next section. */}
              <View style={styles.section}>
                <Text style={styles.eyebrow}>[ LENGTH ]</Text>

                <View style={styles.weekRow}>
                  {DURATION_UNITS.map(option => (
                    <ToggleBox
                      key={option}
                      label={DURATION_UNIT_LABELS[option]}
                      selected={unit === option}
                      onPress={() => selectUnit(option)}
                      style={styles.dayBox}
                      accessibilityRole="radio"
                      tight
                    />
                  ))}
                </View>

                {unit === 'date' ? (
                  <DateTrigger
                    eyebrow="[ END DATE ]"
                    value={pickedEndDate ? formatShortDay(pickedEndDate) : 'PICK A DATE'}
                    accessibilityLabel={pickedEndDate ? `End date: ${formatDay(pickedEndDate)}` : 'Pick an end date'}
                    onPress={() => setEndPickerOpen(true)}
                  />
                ) : (
                  <PixelField
                    eyebrow={`[ ${DURATION_UNIT_LABELS[unit]} ]`}
                    value={countText}
                    onChangeText={setCountText}
                    keyboardType="number-pad"
                    // As many digits as the longest allowed run: 3 for 366 days, 2 otherwise.
                    maxLength={String(MAX_DURATION[unit]).length}
                  />
                )}

                {/* endDate is derived, never typed -- the server computes the stored value
                    the same way, so this is a preview of what will be saved. */}
                <Text style={styles.endDate}>
                  ENDS: {endDate ? formatShortDay(endDate) : '--'}
                  {goalDays > 0 && ` [${goalDays} GOAL ${goalDays === 1 ? 'DAY' : 'DAYS'}]`}
                </Text>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.eyebrow}>[ DAYS ]</Text>
                  <Text style={[styles.counter, sortedDays.length > 0 && styles.counterDone]}>
                    {sortedDays.length} x / WEEK
                  </Text>
                </View>

                {/* Any weekdays, as many as wanted: the count a week is just how many
                    are lit, so no box ever needs to refuse a tap. */}
                <View style={styles.weekRow}>
                  {WEEKDAY_LABELS.map((label, index) => (
                    <ToggleBox
                      key={label}
                      label={label}
                      selected={daysOfWeek.includes(index)}
                      onPress={() => toggleDay(index)}
                      style={styles.dayBox}
                      tight
                    />
                  ))}
                </View>
              </View>
            </>
          )}

          <View style={styles.section}>
            <Text style={styles.eyebrow}>[ TIME OF DAY ]</Text>

            <View style={styles.timesGrid}>
              {TIMES_OF_DAY.map(time => (
                <ToggleBox
                  key={time}
                  label={TIME_OF_DAY_LABELS[time]}
                  selected={timesOfDay.includes(time)}
                  onPress={() => toggleTimeOfDay(time)}
                  style={styles.timeBox}
                />
              ))}
            </View>
          </View>

          {/* Says which rule is unmet rather than just greying the button out --
              "Pick at least one day of the week" is answerable, a dead button is not. */}
          <View style={styles.group}>
            {!!validationError && (
              <Text style={styles.validationText}>{validationError}</Text>
            )}

            <PrimaryButton
              label={isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Goal'}
              onPress={handleSave}
              loading={isSaving}
              disabled={!!validationError || isSaving}
              icon={!isSaving ? <Check size={18} color={primaryButtonInk()} strokeWidth={3} /> : undefined}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CalendarPickerModal
        visible={startPickerOpen}
        selected={startSelected}
        minDate={startMinDate}
        onSelect={handleStartSelect}
        onClose={closeStartPicker}
      />

      <CalendarPickerModal
        visible={daysPickerOpen}
        title="[ PICK DAYS ]"
        selected={pickedDates}
        minDate={todayKey}
        multiple
        onSelect={setPickedDates}
        onClose={closeDaysPicker}
      />

      {/* Days before the start are greyed out. A start later moved past the pick
          leaves it standing, and goalScheduleError says so. */}
      <CalendarPickerModal
        visible={endPickerOpen}
        selected={endSelected}
        minDate={startDate}
        onSelect={handleEndSelect}
        onClose={closeEndPicker}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: SCREEN_TOP,
    gap: SECTION_GAP,
  },
  group: {
    gap: SPACE.sm,
  },
  endDate: {
    ...TYPE.label,
  },
  section: {
    gap: SPACE.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    ...TYPE.h2,
  },
  fieldEyebrow: {
    marginBottom: HEADING_GAP,
  },
  // The start-date trigger, matching PixelSelect's: face, offset shadow block, and
  // the same pressed fill.
  dateWrapper: {
    position: 'relative',
    marginRight: SHADOW_OFFSET,
  },
  dateShadow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: OUTLINE,
    transform: [{ translateX: SHADOW_OFFSET }, { translateY: SHADOW_OFFSET }],
  },
  dateTrigger: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.md,
    backgroundColor: PAPER,
    borderWidth: BORDER_W_INNER,
    borderColor: OUTLINE,
  },
  dateTriggerPressed: {
    backgroundColor: PRESSED,
  },
  dateText: {
    ...TYPE.label,
    flex: 1,
  },
  counter: {
    ...TYPE.label,
    color: INK_MUTED,
  },
  counterDone: {
    color: GOAL_TEXT,
  },
  weekRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
  },
  dayBox: {
    flex: 1,
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
  },
  timeBox: {
    // Two per row: "AFTERNOON" is nine characters of a face that draws ~0.76em
    // each, which does not survive a quarter of a phone's width.
    width: '48%',
  },
  validationText: {
    ...TYPE.caption,
    color: DANGER_TEXT,
  },
});
