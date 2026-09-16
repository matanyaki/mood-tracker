import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { ArrowLeft, Check } from 'lucide-react-native';
import type { Goal, TimeOfDay } from '@shared/types';
import { computeEndDate } from '../../shared/types';
import { ScreenContainer, AppHeader, PrimaryButton, PixelSelect, PixelField, ToggleBox } from '../components';
import { useGoalsController } from '../controllers/useGoalsController';
import {
  WEEKDAY_LABELS, TIMES_OF_DAY, TIME_OF_DAY_LABELS, TIMES_PER_WEEK_OPTIONS,
} from '../constants/goals';
import { PIXEL, PIXEL_BOLD } from '../constants/typography';
import {
  OUTLINE, PAPER, INK, INK_MUTED, BORDER_W_INNER,
} from '../constants/pixel';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/** Days in a given 1-12 month. Day 0 of the next month is the last of this one. */
const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * Create or edit one goal.
 *
 * Both jobs are one screen because a goal is only valid as a whole -- the weekday
 * boxes mean nothing without the times-per-week they have to match -- so there is
 * no half of this form worth showing on its own. `route.params.goal` is what tells
 * the two apart.
 */
export default function GoalFormScreen({ route, navigation }: any) {
  const existing: Goal | undefined = route.params?.goal;
  const isEditing = !!existing;

  const { createGoal, updateGoal, isSaving } = useGoalsController();

  const today = new Date();
  const initialStart = existing?.startDate ?? `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const [initialYear, initialMonth, initialDay] = initialStart.split('-').map(Number);

  const [name, setName] = useState(existing?.name ?? '');
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [day, setDay] = useState(initialDay);
  const [monthsText, setMonthsText] = useState(existing ? String(existing.months) : '1');
  const [timesPerWeek, setTimesPerWeek] = useState(existing?.timesPerWeek ?? 3);
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

  const timesPerWeekOptions = useMemo(
    () => TIMES_PER_WEEK_OPTIONS.map(n => ({ label: `${n} x / week`, value: String(n) })),
    []
  );

  // The 31st of a month the user then switches away from has to land somewhere:
  // clamping to the last real day keeps the picker from ever showing a date that
  // does not exist.
  const clampedDay = Math.min(day, daysInMonth(year, month));
  const startDate = `${year}-${pad(month)}-${pad(clampedDay)}`;

  const months = parseInt(monthsText, 10);
  const hasValidMonths = Number.isFinite(months) && months > 0;
  const endDate = hasValidMonths ? computeEndDate(startDate, months) : null;

  const handleTimesPerWeekChange = useCallback((value: string) => {
    const next = parseInt(value, 10);
    setTimesPerWeek(next);
    // Lowering the count would leave more days picked than the goal allows, which
    // the server rejects — drop the extras rather than letting the form sit in a
    // state it cannot save from.
    setDaysOfWeek(prev => (prev.length > next ? [...prev].sort((a, b) => a - b).slice(0, next) : prev));
  }, []);

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

  // The same four rules the server enforces, checked here so the user is told
  // which one they missed instead of being handed a 400.
  const validationError = useMemo(() => {
    if (!name.trim()) return 'Give the goal a name.';
    if (!hasValidMonths) return 'Set how many months it runs for.';
    if (daysOfWeek.length !== timesPerWeek) {
      return `Pick exactly ${timesPerWeek} ${timesPerWeek === 1 ? 'day' : 'days'}.`;
    }
    if (timesOfDay.length === 0) return 'Pick at least one time of day.';
    return null;
  }, [name, hasValidMonths, daysOfWeek, timesPerWeek, timesOfDay]);

  const handleSave = useCallback(async () => {
    if (validationError || isSaving) return;

    const data = {
      name: name.trim(),
      startDate,
      months,
      timesPerWeek,
      daysOfWeek: [...daysOfWeek].sort((a, b) => a - b),
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
      Alert.alert('Error', 'Could not save your goal. Please try again.');
    }
  }, [
    validationError, isSaving, name, startDate, months, timesPerWeek,
    daysOfWeek, timesOfDay, isEditing, existing, updateGoal, createGoal, navigation,
  ]);

  return (
    <ScreenContainer variant="focus">
      <AppHeader
        title={isEditing ? 'Edit Goal' : 'New Goal'}
        titleStyle={styles.headerTitle}
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
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

          <View style={styles.row}>
            <PixelField
              eyebrow="[ MONTHS ]"
              value={monthsText}
              onChangeText={setMonthsText}
              keyboardType="number-pad"
              maxLength={2}
              flex={1}
            />
            <PixelSelect
              eyebrow="[ TIMES / WEEK ]"
              options={timesPerWeekOptions}
              value={String(timesPerWeek)}
              onChange={handleTimesPerWeekChange}
              flex={1.4}
            />
          </View>

          {/* endDate is derived, never typed -- the server computes the stored value
              the same way, so this is a preview of what will be saved. */}
          <Text style={styles.endDate}>
            ENDS: {endDate ?? '--'}
          </Text>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.eyebrow}>[ DAYS ]</Text>
              <Text style={[
                styles.counter,
                daysOfWeek.length === timesPerWeek && styles.counterDone,
              ]}>
                {daysOfWeek.length} / {timesPerWeek}
              </Text>
            </View>

            {/* Exactly timesPerWeek boxes may be lit, so once the week is full the
                unpicked ones go inert rather than silently refusing a tap. */}
            <View style={styles.weekRow}>
              {WEEKDAY_LABELS.map((label, index) => {
                const selected = daysOfWeek.includes(index);
                return (
                  <ToggleBox
                    key={label}
                    label={label}
                    selected={selected}
                    disabled={!selected && daysOfWeek.length >= timesPerWeek}
                    onPress={() => toggleDay(index)}
                    style={styles.dayBox}
                    fontSize={8}
                  />
                );
              })}
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
          {!!validationError && (
            <Text style={styles.validationText}>{validationError}</Text>
          )}

          <View style={styles.footerContainer}>
            <PrimaryButton
              label={isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Goal'}
              onPress={handleSave}
              loading={isSaving}
              disabled={!!validationError || isSaving}
              icon={!isSaving ? <Check size={18} color="#fff" strokeWidth={3} /> : undefined}
              style={{ backgroundColor: '#10B981' }}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 18,
    letterSpacing: 2,
    color: INK,
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
    paddingTop: 10,
    gap: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  endDate: {
    fontSize: 11,
    fontFamily: PIXEL_BOLD,
    color: INK_MUTED,
    letterSpacing: 1,
    marginTop: -6,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 10,
    fontFamily: PIXEL_BOLD,
    color: INK_MUTED,
    letterSpacing: 2,
  },
  counter: {
    fontSize: 10,
    fontFamily: PIXEL_BOLD,
    color: INK_MUTED,
    letterSpacing: 1,
  },
  counterDone: {
    color: '#10B981',
  },
  weekRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dayBox: {
    flex: 1,
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeBox: {
    // Two per row: "AFTERNOON" is nine characters of a face that draws ~0.76em
    // each, which does not survive a quarter of a phone's width.
    width: '48%',
  },
  validationText: {
    fontSize: 10,
    fontFamily: PIXEL,
    color: '#EF4444',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  footerContainer: {
    marginTop: 4,
  },
});
