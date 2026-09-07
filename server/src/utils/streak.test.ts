import test from 'node:test';
import assert from 'node:assert/strict';

import { computeStreak, dayKeyFromMillis, latestDayKey } from '../../../shared/utils/streak';

/**
 * Tests for the shared streak maths.
 *
 * They live in server/ because it is the only package with a TypeScript runner
 * (ts-node, already a dependency). Run them with `npm run test:streak` from
 * server/. The server tsconfig excludes '**\/*.test.ts', so this file never
 * reaches the build output.
 *
 * Every case pins `today` explicitly instead of reading the clock, so the suite
 * gives the same answer in any timezone and on any date.
 */

// --- computeStreak --------------------------------------------------------

test('no entries at all is not a streak', () => {
    assert.equal(computeStreak([], '2026-09-07'), 0);
});

test('a single entry today is a one-day streak', () => {
    assert.equal(computeStreak(['2026-09-07'], '2026-09-07'), 1);
});

test('a single entry yesterday still counts — today is pending, not missed', () => {
    assert.equal(computeStreak(['2026-09-06'], '2026-09-07'), 1);
});

test('an entry two days ago is a broken streak', () => {
    assert.equal(computeStreak(['2026-09-05'], '2026-09-07'), 0);
});

test('a run of consecutive days ending today counts all of them', () => {
    const days = ['2026-09-07', '2026-09-06', '2026-09-05', '2026-09-04'];
    assert.equal(computeStreak(days, '2026-09-07'), 4);
});

test('a run ending yesterday is still alive and counts from yesterday', () => {
    const days = ['2026-09-06', '2026-09-05', '2026-09-04'];
    assert.equal(computeStreak(days, '2026-09-07'), 3);
});

test('several entries on the same day count as one day', () => {
    const days = [
        '2026-09-07', '2026-09-07', '2026-09-07',
        '2026-09-06', '2026-09-06',
    ];
    assert.equal(computeStreak(days, '2026-09-07'), 2);
});

test('day keys do not have to arrive sorted', () => {
    const days = ['2026-09-05', '2026-09-07', '2026-09-04', '2026-09-06'];
    assert.equal(computeStreak(days, '2026-09-07'), 4);
});

test('a gap stops the count instead of skipping over it', () => {
    // Sep 4 is stranded on the far side of the missing Sep 5.
    const days = ['2026-09-07', '2026-09-06', '2026-09-04', '2026-09-03'];
    assert.equal(computeStreak(days, '2026-09-07'), 2);
});

test('a streak counts across a month boundary', () => {
    const days = ['2026-09-02', '2026-09-01', '2026-08-31', '2026-08-30'];
    assert.equal(computeStreak(days, '2026-09-02'), 4);
});

test('a streak counts across a year boundary', () => {
    const days = ['2027-01-01', '2026-12-31', '2026-12-30'];
    assert.equal(computeStreak(days, '2027-01-01'), 3);
});

test('a streak counts across a leap day', () => {
    const days = ['2028-03-01', '2028-02-29', '2028-02-28'];
    assert.equal(computeStreak(days, '2028-03-01'), 3);
});

test('a day in the future is ignored rather than breaking the streak', () => {
    // A device clock running fast can stamp an entry ahead of today. That must not
    // read as "most recent day is older than yesterday" and zero a live streak.
    const days = ['2026-09-09', '2026-09-07', '2026-09-06'];
    assert.equal(computeStreak(days, '2026-09-07'), 2);
});

test('only future days is not a streak', () => {
    assert.equal(computeStreak(['2026-09-09'], '2026-09-07'), 0);
});

// --- dayKeyFromMillis -----------------------------------------------------

test('UTC offset zero reads the day straight off the instant', () => {
    const ms = Date.UTC(2026, 8, 7, 12, 0, 0); // 2026-09-07T12:00:00Z
    assert.equal(dayKeyFromMillis(ms, 0), '2026-09-07');
});

test('an instant late on the UTC day is already tomorrow ahead of UTC', () => {
    // 22:00 UTC is 01:00 the next day in UTC+3, which reports offset -180.
    const ms = Date.UTC(2026, 8, 7, 22, 0, 0);
    assert.equal(dayKeyFromMillis(ms, -180), '2026-09-08');
});

test('an instant early on the UTC day is still yesterday behind UTC', () => {
    // 02:00 UTC is 21:00 the previous day in UTC-5, which reports offset 300.
    const ms = Date.UTC(2026, 8, 7, 2, 0, 0);
    assert.equal(dayKeyFromMillis(ms, 300), '2026-09-06');
});

// --- latestDayKey ---------------------------------------------------------

test('no days has no latest day', () => {
    assert.equal(latestDayKey([]), null);
});

test('the latest day is found regardless of order', () => {
    assert.equal(latestDayKey(['2026-08-31', '2026-09-07', '2026-09-01']), '2026-09-07');
});
