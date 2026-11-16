import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

import { EMOTIONS, LEGACY_EMOTION_IDS } from '../../shared/types/emotions';
import { JournalEntrySchema } from '../../shared/types/journal.types';
import rawCases from '../data/emotion-ids.json';

/**
 * [E-05] Retired emotion ids fold into their replacement, and an entry's label
 * is re-derived from its id.
 *
 * Why it matters: Firestore still holds entries saved as `worry` / `fear`. If
 * they stopped parsing, the client would drop them and their counts would
 * vanish from Diary and Insights.
 *
 * Two kinds of cases:
 *  - Hand-picked edge cases come from tests/data/emotion-ids.json. To add a
 *    case, add a row there; the test body below does not change.
 *  - Every current and retired id is looped straight from shared/types/emotions.ts,
 *    never retyped, so a new emotion is covered automatically.
 *
 * Run: `npm run test:unit` from server/.
 */

// A malformed row should fail loudly here, not show up as a confusing assertion.
const CaseSchema = z.object({
    name: z.string(),
    storedId: z.string(),
    storedLabel: z.string(),
    expect: z.union([
        z.literal('rejected'),
        z.object({ id: z.string(), label: z.string() }),
    ]),
});
const cases = z.array(CaseSchema).parse(rawCases);

/** A minimal stored entry holding one emotion, as it would come back from Firestore. */
function storedEntry(id: string, label: string) {
    return {
        userId: 'test-user',
        date: '2026-11-04',
        timestamp: Date.UTC(2026, 10, 4, 12, 0, 0),
        emotions: [{ id, label, scale: 3 }],
    };
}

// --- Data-driven: one test body, one run per JSON row ---------------------

for (const row of cases) {
    test(`[E-05] ${row.name}`, () => {
        const result = JournalEntrySchema.safeParse(storedEntry(row.storedId, row.storedLabel));

        if (row.expect === 'rejected') {
            assert.equal(result.success, false, `"${row.storedId}" should not parse`);
            return;
        }

        assert.ok(result.success, `"${row.storedId}" should parse`);
        const [emotion] = result.data.emotions;
        assert.equal(emotion.id, row.expect.id);
        assert.equal(emotion.label, row.expect.label);
    });
}

// --- Generic: driven by the taxonomy itself --------------------------------

for (const current of EMOTIONS) {
    test(`[E-05] current id "${current.id}" keeps its id and gets the taxonomy label`, () => {
        const entry = JournalEntrySchema.parse(storedEntry(current.id, 'stale label'));
        assert.equal(entry.emotions[0].id, current.id);
        assert.equal(entry.emotions[0].label, current.label);
    });
}

for (const [retired, replacement] of Object.entries(LEGACY_EMOTION_IDS)) {
    test(`[E-05] retired id "${retired}" folds into "${replacement}"`, () => {
        const entry = JournalEntrySchema.parse(storedEntry(retired, retired));
        assert.equal(entry.emotions[0].id, replacement);
    });
}

test('[E-05] every retired id points at a current emotion and is not one itself', () => {
    const currentIds = EMOTIONS.map(e => e.id as string);
    for (const [retired, replacement] of Object.entries(LEGACY_EMOTION_IDS)) {
        assert.ok(currentIds.includes(replacement), `"${retired}" → "${replacement}" is not a current emotion`);
        assert.ok(!currentIds.includes(retired), `"${retired}" is retired but still in EMOTIONS`);
    }
});
