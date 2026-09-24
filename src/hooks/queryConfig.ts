import { JournalService } from '../services/journalService';
import { auth } from '../config/firebase';
import { ApiError } from '../config/api';

/** Shared freshness window for the journal queries. */
export const STALE_TIME_MS = 1000 * 60 * 5;  // treat as fresh for 5 min
// Also the persister's maxAge (App.tsx). Long on purpose: a query garbage-collected
// from memory is removed from the persisted cache too, and a week covers a user who
// skips a few days -- their streak still paints instantly on the next open.
export const GC_TIME_MS = 1000 * 60 * 60 * 24 * 7;

/**
 * Version of the persisted cache. Change it whenever a query's data changes shape.
 *
 * A restored query hands its saved data straight to the screen -- it never passes
 * back through the service's zod parse -- so an old shape reaches components written
 * for the new one. A different buster makes the persister discard the saved copy
 * instead of restoring it.
 *
 * Bumped for ['goalProgress'], which went from a { weekStart, weekEnd, goals } object
 * to a plain array: the saved object crashed GoalsProgress on `goals.map`.
 */
export const CACHE_BUSTER = '2';

/**
 * Retry only what a second attempt could actually fix.
 *
 * React Query's default is three retries for ANY failure, and it holds `isLoading`
 * true for the whole sequence — so a deterministic failure (a 4xx, a malformed
 * payload) doesn't surface as an error, it surfaces as a skeleton that sits there
 * for seven seconds and then quietly gives up. With a request timeout on top, that
 * is closer to forty.
 *
 * A status of 0 is the one case worth repeating: the request never got an answer,
 * which is a timeout or a dropped connection.
 */
export const retryTransportFailures = (failureCount: number, error: unknown): boolean =>
    error instanceof ApiError && error.status === 0 && failureCount < 2;

/**
 * The acting user id, resolved the way every call site resolved it before:
 * the signed-in uid, or GUEST_ID, which the services branch on internally.
 *
 * Read inside the queryFn rather than baked into the query key, so the key stays
 * the documented ['entries', month] that other modules invalidate against.
 */
export const actingUserId = (): string =>
    auth.currentUser?.uid ?? JournalService.GUEST_ID;
