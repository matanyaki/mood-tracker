import { JournalService } from '../services/journalService';
import { auth } from '../config/firebase';

/** Shared freshness window for the journal queries. */
export const STALE_TIME_MS = 1000 * 60 * 5;  // treat as fresh for 5 min
export const GC_TIME_MS = 1000 * 60 * 10;

/**
 * The acting user id, resolved the way every call site resolved it before:
 * the signed-in uid, or GUEST_ID, which the services branch on internally.
 *
 * Read inside the queryFn rather than baked into the query key, so the key stays
 * the documented ['entries', month] that other modules invalidate against.
 */
export const actingUserId = (): string =>
    auth.currentUser?.uid ?? JournalService.GUEST_ID;
