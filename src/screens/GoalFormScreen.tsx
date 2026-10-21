import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import type { DateData } from 'react-native-calendars';
import type { Goal, TimeOfDay, DurationUnit } from '@shared/types';
import {
  goalDuration, resolveEndDate, goalScheduleError, plannedDayCount, nextDay, MAX_DURATION,
} from '../../shared/types';
import {
  ScreenContainer, AppHeader, BackButton, PrimaryButton, primaryButtonInk,
  PixelSelect, PixelField, ToggleBox, PixelCard, PixelCalendar,
} from '../components';
import { PixelAlert } from '../components/ui/PixelAlert';
import { useGoalsController } from '../controllers/useGoalsController';
import { GOAL_TEXT, DANGER_TEXT } from '../constants/colors';
import {
  WEEKDAY_LABELS, TIMES_OF_DAY, TIME_OF_DAY_LABELS, DURATION_UNIT_LABELS,
} from '../constants/goals';
import { TYPE } from '../constants/typography';
import { SCREEN_BOTTOM, SCREEN_GUTTER, SCREEN_TOP, SECTION_GAP, SPACE } from '../constants/layout';
import { INK_MUTED, SHADOW_OFFSET } from '../constants/pixel';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/** Days in a given 1-12 month. Day 0 of the next month is the last of this one. */
const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

const pad = (value: number) => String(value).padStart(2, '0');

/** 'YYYY-MM-DD' -> 'DD/MM/YY', the way the goal card writes its dates. */
const shortDate = (date: string) => {
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y.slice(2)}`;
};

/** The order the length boxes are drawn in: shortest first, the picked date last. */
const DURATION_UNITS_SHOWN: DurationUnit[] = ['days', 'weeks', 'months', 'date'];

/** The dot the Diary marks a goal day with, so the picker previews what it will show. */
const GOAL_DOT = { key: 'goal', color: '#10B981' };

/**
 * Create or edit one goal.
 *
 * Both jobs are one screen because a goal is only valid as a whole -- the days
 * picked mean nothing without the run they have to fall inside -- so there is no
 * half of this form worth showing on its own. `route.params.goal` is what tells
 * the two apart.
 */
export default function GoalFormScreen({ route, navigation }: any) {
  const existing: Goal | undefined = route.params?.goal;
  const isEditing = !!existing;

  const { createGoal, updateGoal, isSaving } = useGoalsController();
  const insets = useSafeAreaInsets();

  const today = new Date();
  const initialStart = existing?.startDate ?? `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const [initialYear, initialMonth, initialDay] = initialStart.split('-').map(Number);

  const [name, setName] = useState(existing?.name ?? '');
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [day, setDay] = useState(initialDay);
  const existingLength = existing ? goalDuration(existing) : null;
  const [unit, setUnit] = useState<DurationUnit>(existingLength?.unit ?? 'weeks');
  const [countText, setCountText] = useState(
    existingLength && existingLength.unit !== 'date' ? String(existingLength.count) : '2'
  );
  // The end date picked on the calendar. Only read while unit is 'date'.
  const [pickedEnd, setPickedEnd] = useState<string | null>(
    existingLength?.unit === 'date' ? existing!.endDate : null
  );
  // The month the calendar opens on, fixed when it mounts. Handing the calendar a
  // moving initialDate re-seeds it on every pick (see useDiaryController).
  const [calendarSeed, setCalendarSeed] = useState(pickedEnd ?? initialStart);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(existing?.daysOfWeek ?? []);
  const [timesOfDay, setTimesOfDay] = useState<TimeOfDay[]>(existing?.timesOfDay ?? []);

  // A year before today through five after, widened to hold the goal being edited
  // so its own start year is never missing from its own picker.
  const yearOptions = useMemo(() => {
    const first = Math.min(today.getFullYear() - 1, initialYear);
    const last = Math.max(today.getFullYear() + 5, initialYear);
    const years: { label: string; value: string }[] = [];
    for (let y = first; y <= last; y++) {
      years.push({ label: String(y), value: String(y) });
    }
    return years;
  }, [initialYear]);

  const monthOptions = useMemo(
    () => MONTH_NAMES.map((label, i) => ({ label, value: String(i + 1) })),
    []
  );

  const dayOptions = useMemo(() => {
    const total = daysInMonth(year, month);
    return Array.from({ length: total }, (_, i) => ({
      label: String(i + 1),
      value: String(i + 1),
    }));
  }, [year, month]);

  // The 31st of a month the user then switches away from has to land somewhere:
  // clamping to the last real day keeps the picker from ever showing a date that
  // does not exist.
  const clampedDay = Math.min(day, daysInMonth(year, month));
  const startDate = `${year}-${pad(month)}-${pad(clampedDay)}`;

  const count = parseInt(countText, 10);
  const sortedDays = useMemo(() => [...daysOfWeek].sort((a, b) => a - b), [daysOfWeek]);

  // The goal's length exactly as it will be sent: a count, or the picked end date.
  const length = useMemo(() => unit === 'date'
    ? { durationUnit: unit, ...(pickedEnd ? { endDate: pickedEnd } : {}) }
    : { durationUnit: unit, durationCount: Number.isFinite(count) && count > 0 ? count : 0 },
  [unit, pickedEnd, count]);

  // A preview of what the server will store -- it derives endDate the same way.
  const endDate = resolveEndDate({ startDate, ...length });
  const goalDays = endDate && endDate >= startDate && sortedDays.length > 0
    ? plannedDayCount({ startDate, endDate, daysOfWeek: sortedDays })
    : 0;

  const handleUnitChange = useCallback((next: DurationUnit) => {
    // Opening the calendar on the end the current length gives keeps a switch to
    // DATE from throwing away what was already set.
    if (next === 'date' && !pickedEnd) {
      const seed = endDate && endDate >= startDate ? endDate : startDate;
      setPickedEnd(seed);
      setCalendarSeed(seed);
    }
    setUnit(next);
  }, [pickedEnd, endDate, startDate]);

  const handleEndDayPress = useCallback((day: DateData) => setPickedEnd(day.dateString), []);

  // The picked end, and every goal day up to it, marked the way the Diary will mark
  // them -- so picking a date shows which days the goal will actually ask for.
  const calendarMarks = useMemo(() => {
    if (unit !== 'date') return {};
    const marks: Record<string, any> = {};
    if (pickedEnd && pickedEnd >= startDate && sortedDays.length > 0) {
      for (let day = startDate; day <= pickedEnd; day = nextDay(day)) {
        const [y, m, d] = day.split('-').map(Number);
        if (sortedDays.includes(new Date(y, m - 1, d).getDay())) {
          marks[day] = { marked: true, dots: [GOAL_DOT] };
        }
      }
    }
    if (pickedEnd) marks[pickedEnd] = { ...marks[pickedEnd], selected: true };
    return marks;
  }, [unit, pickedEnd, startDate, sortedDays]);

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

  // The same rules the server enforces (the shared goalScheduleError), checked here
  // so the user is told which one they missed instead of being handed a 400.
  const validationError = useMemo(() => {
    if (!name.trim()) return 'Give the goal a name.';
    const scheduleError = goalScheduleError({
      startDate, ...length, daysOfWeek: sortedDays, timesPerWeek: sortedDays.length,
    });
    if (scheduleError) return scheduleError;
    if (timesOfDay.length === 0) return 'Pick at least one time of day.';
    return null;
  }, [name, startDate, length, sortedDays, timesOfDay]);

  const handleSave = useCallback(async () => {
    if (validationError || isSaving) return;

    const data = {
      name: name.trim(),
      startDate,
      ...length,
      // The days ARE the weekly count: picking WED and SUN is twice a week.
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
    validationError, isSaving, name, startDate, length,
    sortedDays, timesOfDay, isEditing, existing, updateGoal, createGoal, navigation,
  ]);

  return (
    <ScreenContainer variant="focus">
      <AppHeader
        title={isEditing ? 'Edit Goal' : 'New Goal'}
        leftAction={<BackButton onPress={() => navigation.goBack()} />}
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

          {/* Start date, as three of the same drop-down the Insights filter uses --
              a native date picker renders as a rounded wheel that this screen has
              nowhere to put. */}
          <View style={styles.row}>
            <PixelSelect
              eyebrow="[ DAY ]"
              options={dayOptions}
              value={String(clampedDay)}
              onChange={value => setDay(parseInt(value, 10))}
              flex={1}
            />
            <PixelSelect
              eyebrow="[ MONTH ]"
              options={monthOptions}
              value={String(month)}
              onChange={value => setMonth(parseInt(value, 10))}
              flex={1.8}
            />
            <PixelSelect
              eyebrow="[ YEAR ]"
              options={yearOptions}
              value={String(year)}
              onChange={value => setYear(parseInt(value, 10))}
              flex={1.2}
            />
          </View>

          {/* How long it runs: a count of days, weeks or months, or an end date
              picked on the same calendar the Diary draws. */}
          <View style={styles.section}>
            <Text style={styles.eyebrow}>[ LENGTH ]</Text>

            <View style={styles.weekRow}>
              {DURATION_UNITS_SHOWN.map(option => (
                <ToggleBox
                  key={option}
                  label={DURATION_UNIT_LABELS[option]}
                  selected={unit === option}
                  onPress={() => handleUnitChange(option)}
                  style={styles.dayBox}
                  accessibilityRole="radio"
                  tight
                />
              ))}
            </View>

            {unit !== 'date' ? (
              <PixelField
                eyebrow={`[ ${DURATION_UNIT_LABELS[unit]} ]`}
                value={countText}
                onChangeText={setCountText}
                keyboardType="number-pad"
                maxLength={String(MAX_DURATION[unit]).length}
              />
            ) : (
              <PixelCard padding={0} style={styles.calendarCard} wrapperStyle={styles.calendarWrapper}>
                <PixelCalendar
                  initialDate={calendarSeed}
                  minDate={startDate}
                  onDayPress={handleEndDayPress}
                  markingType="multi-dot"
                  markedDates={calendarMarks}
                />
              </PixelCard>
            )}

            {/* endDate is derived for a count -- the server computes the stored value
                the same way, so this is a preview of what will be saved. */}
            <Text style={styles.endDate}>
              ENDS: {endDate && endDate >= startDate ? shortDate(endDate) : '--'}
              {goalDays > 0 ? `  [${goalDays} GOAL ${goalDays === 1 ? 'DAY' : 'DAYS'}]` : ''}
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.eyebrow}>[ DAYS ]</Text>
              <Text style={[styles.counter, daysOfWeek.length > 0 && styles.counterDone]}>
                {daysOfWeek.length} x / WEEK
              </Text>
            </View>

            {/* Any set of days: how many are lit is how many times a week it runs. */}
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
              "Pick exactly 3 days" is answerable, a dead button is not. */}
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
  row: {
    flexDirection: 'row',
    gap: SPACE.md,
  },
  endDate: {
    ...TYPE.label,
    color: INK_MUTED,
  },
  calendarWrapper: {
    marginRight: SHADOW_OFFSET, // Room for the offset shadow, as PixelSelect leaves
  },
  calendarCard: {
    // Tight for the same reason as the Diary's: seven 34px cells need ~250px.
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.md,
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
