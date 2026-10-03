# Frontend review — `src/`

Reviewed: every file under `src/`, plus `App.tsx`, `babel.config.js`, `metro.config.js`, `app.json`, `render.yaml` and the shared schemas where `src/` depends on them. Working tree as of branch `feat/insights-screen` (including the 5 uncommitted Insights files).

Severity key: **MUST** = must fix before deploy · **SHOULD** = should fix · **NICE** = nice to have.
Confidence is high unless a finding says otherwise.

---

## 1. Bugs and errors

### B1. Signup uploads guest data twice, so entries and greetings get duplicated — **MUST**
- **Where:** [AuthContext.tsx:45-80](../src/context/AuthContext.tsx#L45-L80) and [AuthContext.tsx:114-167](../src/context/AuthContext.tsx#L114-L167)
- **What:** The guest-to-account migration runs in two places. ProfileScreen calls `signup()` ([ProfileScreen.tsx:59](../src/screens/ProfileScreen.tsx#L59)). `createUserWithEmailAndPassword` fires `onAuthStateChanged`, and that listener starts uploading guest entries one by one. At the same time `signup()` awaits `syncUser`, reads the same AsyncStorage keys (still there, because storage is only cleared after *all* uploads finish), and uploads them again. With 2+ guest entries, duplicates are close to certain.
- **Related:** If one upload fails mid-loop, nothing is cleared, and the next login re-uploads the entries that already made it.
- **Why it matters:** A new user's first action (sign up) corrupts their history, and Insights counts double.
- **Fix:** Delete the migration block from `signup()` (lines 116-167) and keep only the listener path. Add an in-flight guard, and remove each item from guest storage as it uploads, so a partial failure can't re-upload:
  ```ts
  let migrating: Promise<void> | null = null; // module level
  // in the listener:
  if (currentUser && !migrating) {
      migrating = migrateGuestData(currentUser).finally(() => { migrating = null; });
  }
  ```
  This also removes the largest duplicated block in the app (see D1).

### B2. Entries are filed under the UTC date, not the user's date — **MUST** (before real data piles up)
- **Where:** [useReflectionController.ts:43](../src/controllers/useReflectionController.ts#L43): `date: new Date().toISOString().split('T')[0]`
- **What:** `date` is the UTC day. In Israel (UTC+3), an entry at 01:30 is filed under yesterday. In the US, an evening entry is filed under tomorrow. The server's month query, the Insights chart (`aggregateByDay` groups by `entry.date`) and the month-level invalidation all use `date`. Meanwhile Diary and EmotionCheckInCard use the local `timestamp`, so the same entry can land on different days on different screens. On the last evening of a month (west of UTC) or the first early morning (east of UTC) it lands in the wrong *month* in Insights.
- **Evidence the bug is known:** [EmotionCheckInCard.tsx:61-73](../src/components/today/EmotionCheckInCard.tsx#L61-L73) already works around it by fetching two months.
- **Why it matters:** Every production entry will carry this. Fixing it after launch means living with a mix of UTC-dated and local-dated documents.
- **Fix:** `date: format(new Date(), 'yyyy-MM-dd')` (date-fns is already imported everywhere). After that, the extra UTC-month query in EmotionCheckInCard can go.

### B3. Today's goals card can mark a goal done for yesterday — **MUST**
- **Where:** [TodayGoalsCard.tsx:113](../src/components/today/TodayGoalsCard.tsx#L113): `const [today] = useState(() => format(new Date(), 'yyyy-MM-dd'))`
- **What:** "Today" is frozen when the card mounts. The Today tab stays mounted for the whole session, and a phone keeps the app process alive in the background overnight. The next morning the card still shows yesterday's due goals, and tapping one writes a completion for **yesterday's** date.
- **Why it matters:** The app says completions can't be undone ("This cannot be undone."), so the wrong record is permanent. A daily-habit app is exactly the kind that gets reopened from the background every morning.
- **Fix:** Compute `today` on each render (`const today = format(new Date(), 'yyyy-MM-dd')`, cheap), plus B4 so the screen re-renders when the app comes back. The same frozen-day pattern in [useDiaryController.ts:85](../src/controllers/useDiaryController.ts#L85) is read-only, so it is only NICE there.

### B4. TanStack Query never refetches when the app returns from background — **SHOULD**
- **Where:** [App.tsx:16](../App.tsx#L16). There is no `focusManager` / `AppState` wiring anywhere in `src/` or `App.tsx` (searched).
- **What:** On the web, `refetchOnWindowFocus` does this for free. In React Native it does nothing until `focusManager` is connected to `AppState`. Tab screens never remount, so their queries never go stale-and-refetch on resume. Streaks, the "logged today?" card and goal completions show whatever was cached when the app was backgrounded, and the `select` in `useStreaksQuery` that zeroes broken streaks never re-runs.
- **Fix:** This is the documented TanStack setup for React Native, about 6 lines in `App.tsx`, and no new library:
  ```ts
  import { focusManager } from '@tanstack/react-query';
  import { AppState } from 'react-native';
  focusManager.setEventListener(handleFocus => {
      const sub = AppState.addEventListener('change', s => handleFocus(s === 'active'));
      return () => sub.remove();
  });
  ```

### B5. Logging in from guest mode keeps showing guest data from the cache — **SHOULD**
- **Where:** [AuthContext.tsx:35-38](../src/context/AuthContext.tsx#L35-L38). Query keys carry no user id ([queryConfig.ts:47](../src/hooks/queryConfig.ts#L47) explains this is deliberate).
- **What:** `logout()` calls `queryClient.clear()`, but nothing resets the cache on *login*. After a guest logs in or signs up, `['goals']`, `['entries', month]`, `['streaks']` and `['goalCompletions']` still hold guest data and are "fresh" for up to 5 minutes. The persister also writes that data back to disk. Guest goals have local ids like `"1727..."`, so ticking one on the Today card sends `POST /api/goals/1727.../completions`, which fails.
- **Fix:** When `onAuthStateChanged` sees a different uid than before, call `queryClient.clear()` or `queryClient.resetQueries()`. Call `invalidateQueries()` again after migration finishes, so migrated entries show up.

### B6. Guest goals are silently left behind on signup — **SHOULD**
- **Where:** [userService.ts:28-57](../src/services/userService.ts#L28-L57)
- **What:** Migration reads and clears only entries and greetings. `@guest_goals` and `@guest_goal_completions` ([variables.ts:3-4](../src/constants/variables.ts#L3-L4)) are never uploaded, so once the user is signed in their goals disappear from every screen. Meanwhile ProfileScreen reports "Account created and data synced!" ([ProfileScreen.tsx:60](../src/screens/ProfileScreen.tsx#L60)), which it shows even if migration threw, because the errors are swallowed at [AuthContext.tsx:164-166](../src/context/AuthContext.tsx#L164-L166).
- **Fix:** Either migrate goals too (create each one, then post its completions), or change the copy so it doesn't promise a sync that didn't happen. Show the success message only if migration actually succeeded.

### B7. A failed gratitude save loses what the user wrote — **SHOULD**
- **Where:** [GratitudeNote.tsx:125-142](../src/components/today/GratitudeNote.tsx#L125-L142), [TodayScreen.tsx:24-32](../src/screens/TodayScreen.tsx#L24-L32)
- **What:** `handleSave` calls `onSave(cleaned)` without awaiting it, then immediately runs `setText('')` and `onClose()`. If the request fails, TodayScreen shows "Failed to save…", but the note is already wiped and closed. The comment in TodayScreen ("Close strict after save success") describes behaviour that never happens.
- **Fix:** Make `onSave` return a promise and `await` it. Clear and close only on success, and let TodayScreen own the closing. Also block saving an empty note: today the note closes and the controller returns silently.

### B8. The "Morning intention" resets at UTC midnight, not the user's midnight — **SHOULD**
- **Where:** [IntentionCard.tsx:11](../src/components/today/IntentionCard.tsx#L11): `new Date().toISOString().slice(0, 10)`
- **What:** Same root cause as B2. In Israel the card clears at 03:00. In California it clears at 17:00, the same afternoon the intention was written.
- **Fix:** `format(new Date(), 'yyyy-MM-dd')`. As a side note, one key per day accumulates forever. It's harmless, but it could be a single key that stores `{ day, text }`.

### B9. Raw Firebase error strings are shown to users — **SHOULD**
- **Where:** [ProfileScreen.tsx:69](../src/screens/ProfileScreen.tsx#L69): `PixelAlert.alert('Authentication Error', error.message)`
- **What:** Users see text like `Firebase: Error (auth/invalid-credential).`
- **Fix:** Map the handful of common `error.code` values (`auth/invalid-credential`, `auth/email-already-in-use`, `auth/weak-password`, `auth/network-request-failed`) to plain sentences, with a generic fallback. A small inline `switch` is enough.

### B10. Guest entries skip schema normalization — **NICE** (low likelihood)
- **Where:** [journalService.ts:105-118](../src/services/journalService.ts#L105-L118), [journalService.ts:144-152](../src/services/journalService.ts#L144-L152)
- **What:** API entries pass through `JournalEntrySchema`, which folds `worry`/`fear` into `anxious` and re-derives labels. Guest entries come straight from `JSON.parse`. A guest who logged before the rename has `worry` counted under a key that Insights never displays, which breaks the CLAUDE.md rule that retired ids "still count".
- **Fix:** Run guest entries through the same `parseEntries(...)` used for the API branch.

### B11. ChartTooltipModal sorts its props array in place — **NICE**
- **Where:** [ChartTooltipModal.tsx:44](../src/components/insights/ChartTooltipModal.tsx#L44): `data.emotions.sort(...)`
- **What:** This mutates state owned by InsightsScreen during render. Today it's harmless because there is only one item.
- **Fix:** `[...data.emotions].sort(...)`.

### B12. The mood score change is labelled as a percentage but is in points — **NICE** (uncommitted file)
- **Where:** [SummaryCards.tsx:43](../src/components/insights/SummaryCards.tsx#L43): `{Math.abs(delta)}%`
- **What:** `delta` is the difference between two 0-100 scores, so a move from 40 to 60 displays as "20%".
- **Fix:** Drop the `%` or say "pts".

---

## 2. Auth flow: why "Auth check timed out, forcing load" appears

**Short answer:** The timeout path runs on every launch because of a stale closure, not because Firebase hangs. The warning itself is noise, but it hides two real problems: slow startup when there is guest data, and the duplicate migration in B1.

### A1. The timeout reads a stale `isLoading` and is never cancelled — **SHOULD**
- **Where:** [AuthContext.tsx:94-99](../src/context/AuthContext.tsx#L94-L99)
- **What:** The effect runs once (`[]` deps), so the `isLoading` inside the `setTimeout` callback is the initial `true` forever. The timer is only cleared on unmount. So 5 s after every cold start, `isMounted && isLoading` is `true`, the warning is logged, and `setIsLoading(false)` runs (usually a no-op by then). `console.warn` shows up as the yellow LogBox toast in dev. LogBox is dev-only, so release users will **not** see this toast.
- **Is it masking a real bug?** Yes, two:
  1. **Slow startup when guest data exists.** The listener `await`s the whole migration (one sequential POST per entry and greeting) *before* `setIsLoading(false)` ([AuthContext.tsx:47-89](../src/context/AuthContext.tsx#L47-L89)). On the Render free tier, the first request after idle can take tens of seconds (see DR3), so the spinner genuinely hangs. The timeout then lets the app render mid-migration, on top of the guest cache (B5).
  2. **Two sources of truth for "who is acting".** If the timeout ever fires before Firebase answers, context says `isGuest: true` while `auth.currentUser` is later non-null. Controllers pick the user id from context ([GreetingController.ts:20](../src/controllers/GreetingController.ts#L20), [useGoalsController.ts:23](../src/controllers/useGoalsController.ts#L23), [useReflectionController.ts:25](../src/controllers/useReflectionController.ts#L25)), while query hooks use `auth.currentUser` ([queryConfig.ts:47](../src/hooks/queryConfig.ts#L47)). Writes would go to guest storage while reads go to the API. *Moderate confidence that this happens in practice*, because Firebase restores a persisted session from AsyncStorage quickly even offline. It is still a real inconsistency.
- **Fix:** Resolve loading as soon as Firebase answers, and run migration in the background:
  ```ts
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsGuest(!currentUser);
      setIsLoading(false);            // don't wait on the network
      if (currentUser) {
          UserService.syncUser(currentUser);
          runGuestMigrationOnce(currentUser)          // B1's guarded version
              .then(() => queryClient.invalidateQueries());
      }
  });
  ```
  Then delete the timeout. If you want to keep a safety net, clear it inside the listener (`clearTimeout(timeout)`) instead of reading state. For the controllers, use `actingUserId()` everywhere so there is one answer (see D3).

### A2. Other auth notes — **NICE**
- The `value` object is rebuilt on every provider render and `login`/`signup`/`logout` aren't memoized ([AuthContext.tsx:185-192](../src/context/AuthContext.tsx#L185-L192)). The provider rarely re-renders, so the impact is small. Wrap it in `useMemo` if you touch the file anyway.
- `login` from guest mode also migrates the device's guest data into whatever account logs in. That's by design (per the comment), but on a shared device it merges one person's guest entries into another's account. This is a product call, flagged only so it's a conscious one.

---

## 3. Dead code

All **NICE** unless marked. "Unused" means there is no import or JSX usage anywhere in `src/` or `App.tsx`.

| # | Where | What |
|---|---|---|
| X1 | [useProfileController.ts](../src/controllers/useProfileController.ts) | Whole file unused. ProfileScreen uses `useAuth()`. It is also a *dangerous* leftover: its `handleLogout` calls `signOut` directly and skips `queryClient.clear()`. Delete it. |
| X2 | [insightsService.ts](../src/services/insightsService.ts) | Whole file unused. It duplicates `useEntriesQuery`. |
| X3 | [ui/Card.tsx](../src/components/ui/Card.tsx) + [components/index.ts:3](../src/components/index.ts#L3) | `<Card>` only appears in comments. Replaced by `PixelCard`. |
| X4 | [skeleton/TodayScreenSkeleton.tsx](../src/components/skeleton/TodayScreenSkeleton.tsx) + [skeleton/index.ts:5](../src/components/skeleton/index.ts#L5) | Never rendered. |
| X5 | [navigation/types.ts](../src/navigation/types.ts) | Never imported, and stale: it declares an `Auth` route and a `CheckIn` tab that don't exist, and omits `Reflection`/`CheckIn` stack routes. Either delete it or wire it into the screens (they all take `any` today). |
| X6 | [goalService.ts:178-200](../src/services/goalService.ts#L178-L200) | `GoalService.getGoal` is never called. |
| X7 | [journalService.ts:55](../src/services/journalService.ts#L55) | `JournalService.isGuest` is never called. The methods compare to `GUEST_ID` inline instead. |
| X8 | [firebase.ts:5](../src/config/firebase.ts#L5), [firebase.ts:42-44](../src/config/firebase.ts#L42-L44) | `db` / `getFirestore` is never used: all data goes through the backend. Removing it also drops the Firestore SDK from the bundle (see P2). |
| X9 | [useDiaryController.ts:329](../src/controllers/useDiaryController.ts#L329), [useDiaryController.ts:346](../src/controllers/useDiaryController.ts#L346) | `entries` is read only by commented-out JSX. `getEmotionColor` ("expose for UI if needed") is never read. |
| X10 | [DiaryScreen.tsx:134](../src/screens/DiaryScreen.tsx#L134), [DiaryScreen.tsx:136](../src/screens/DiaryScreen.tsx#L136), [DayEntryModal.tsx:5](../src/components/journal/DayEntryModal.tsx#L5) | `handleAddFirstEntry` and `handleEditEntry` only feed commented-out code. The `Edit` icon import is unused. |
| X11 | [AppBackground.tsx:8-9](../src/components/layout/AppBackground.tsx#L8-L9), [ScreenContainer.tsx:11](../src/components/layout/ScreenContainer.tsx#L11) | The `variant` and `animated` props are accepted and ignored, so every `variant="calm"`/`"focus"` in the screens does nothing. Remove them, or say in one comment that they're reserved. |
| X12 | [useReflectionController.ts:27-30](../src/controllers/useReflectionController.ts#L27-L30) | Unreachable: `isGuest` is always `true` when `user` is null. |
| X13 | [QuoteCard.tsx:62-65](../src/components/today/QuoteCard.tsx#L62-L65) | `TouchableOpacity` with no `onPress`. It gives press feedback for a tap that does nothing, so use a `View`. |
| X14 | [constants/emotions.ts:10](../src/constants/emotions.ts#L10) | The `EMOTIONS_CONFIG` alias. Import `EMOTIONS` directly and drop the alias (7 call sites, a mechanical rename). |
| X15 | Commented-out blocks | [navigation/index.tsx:68-75](../src/navigation/index.tsx#L68-L75) and [:180](../src/navigation/index.tsx#L180) (`// Trigger reload…`), [components/index.ts:23-24](../src/components/index.ts#L23-L24), [DiaryScreen.tsx:227-235](../src/screens/DiaryScreen.tsx#L227-L235), [DayEntryModal.tsx:153-157](../src/components/journal/DayEntryModal.tsx#L153-L157), [MonthlyReassurance.tsx:233-238](../src/components/insights/MonthlyReassurance.tsx#L233-L238). Git has them if you need them back. |
| X16 | [navigation/index.tsx:61-62](../src/navigation/index.tsx#L61-L62) | `require('../screens/TodayScreen').default` with `@ts-ignore`. Use a normal `import` like the other screens. |
| X17 | `package.json` (root) | No import anywhere in `src/` or `App.tsx` for `react-native-gifted-charts`, `fast-deep-equal`, `expo-linear-gradient` or `@react-native-picker/picker` (the picker is only mentioned in a comment). Keep `react-native-web`, because the Render web build needs it. |
| X18 | root `.env` | `EXPO_PUBLIC_SENTRY_DSN` is set but nothing reads it. It's not a secret problem, just a loose end (see DR2 before wiring Sentry). |

---

## 4. Duplication

### D1. The guest migration loop is written out twice — **MUST** (as part of B1)
[AuthContext.tsx:47-80](../src/context/AuthContext.tsx#L47-L80) and [AuthContext.tsx:126-166](../src/context/AuthContext.tsx#L126-L166) are nearly identical. Fixing B1 removes one copy.

### D2. The mood, greeting and goal dot colours are hard-coded in 4-7 places each — **SHOULD**
- `'#A78BFA'` (mood): [useDiaryController.ts:213](../src/controllers/useDiaryController.ts#L213), [DiaryScreen.tsx:19](../src/screens/DiaryScreen.tsx#L19), [EmotionCheckInCard.tsx:22](../src/components/today/EmotionCheckInCard.tsx#L22), [DayEntryModal.tsx:140-141](../src/components/journal/DayEntryModal.tsx#L140-L141)
- `'#0099ffff'` (greeting): [useDiaryController.ts:228](../src/controllers/useDiaryController.ts#L228), [DiaryScreen.tsx:20](../src/screens/DiaryScreen.tsx#L20), [DayEntryModal.tsx:90-99](../src/components/journal/DayEntryModal.tsx#L90-L99), [TodayScreen.tsx:61](../src/screens/TodayScreen.tsx#L61)
- `'#10B981'` (goal): [useDiaryController.ts:242](../src/controllers/useDiaryController.ts#L242), [DiaryScreen.tsx:21](../src/screens/DiaryScreen.tsx#L21), [TodayGoalsCard.tsx:20](../src/components/today/TodayGoalsCard.tsx#L20), [GoalCard.tsx:19](../src/components/goals/GoalCard.tsx#L19), [DayEntryModal.tsx:28](../src/components/journal/DayEntryModal.tsx#L28), [PixelProgressRing.tsx:14](../src/components/insights/PixelProgressRing.tsx#L14), [TodayScreen.tsx:56](../src/screens/TodayScreen.tsx#L56)
- **Why:** The DiaryScreen legend comment says it "matches the dot colours the controller marks days with", but that is only true by copy-paste.
- **Fix:** Three exported constants in `constants/colors.ts` (`MOOD_COLOR`, `GREETING_COLOR`, `GOAL_COLOR`), imported everywhere. These are constants, not an abstraction.

### D3. The acting user id is resolved two different ways — **SHOULD**
Controllers use `isGuest || !user ? GUEST_ID : user.uid` ([GreetingController.ts:20](../src/controllers/GreetingController.ts#L20), [useGoalsController.ts:23](../src/controllers/useGoalsController.ts#L23), [useReflectionController.ts:25](../src/controllers/useReflectionController.ts#L25)). Query hooks use `actingUserId()` ([queryConfig.ts:47](../src/hooks/queryConfig.ts#L47)). They can disagree (A1). Use `actingUserId()` in the three controllers too.

### D4. Month and date helpers are re-implemented — **NICE**
- `previousMonth` ([useInsightsController.ts:10](../src/controllers/useInsightsController.ts#L10)) vs `shiftMonth` ([useDiaryController.ts:40](../src/controllers/useDiaryController.ts#L40))
- `daysInMonth` ([GoalFormScreen.tsx:26](../src/screens/GoalFormScreen.tsx#L26)) vs `getDaysInMonth` ([InsightsScreen.tsx:20](../src/screens/InsightsScreen.tsx#L20))
- `MONTH_NAMES` ([GoalFormScreen.tsx:20](../src/screens/GoalFormScreen.tsx#L20)) vs the exported one in [FilterRow.tsx:14](../src/components/insights/FilterRow.tsx#L14)

Import the existing ones rather than adding a new file. For example, export `shiftMonth` and call `shiftMonth(m, -1)` in Insights.

### D5. InsightsScreen re-filters data that is already month-scoped — **NICE**
[InsightsScreen.tsx:69-90](../src/screens/InsightsScreen.tsx#L69-L90) filters `entries` and `aggregatedEntries` down to the selected month twice. Both come from the `['entries', month]` query, which is already that month. Delete both filters and use the arrays directly (this also removes ~20 lines of `any`).

### D6. Every authenticated service method re-checks `auth.currentUser` — **NICE**
There are about 12 copies of `const user = auth.currentUser; if (!user) throw …` across the services, and the request interceptor already handles auth ([api.ts:90-119](../src/config/api.ts#L90-L119)). The guest check also differs: Journal uses `userId === GUEST_ID`, while Goal and Greeting use `!userId || userId === GUEST_ID`. This is harmless today, so it's only worth tidying while you're in those files.

### Checked and clean
- **Emotion taxonomy:** No emotion id, label or colour map is defined outside `shared/types/emotions.ts`. `EMOTION_COLORS`, `MOOD_IMAGES` (required by Metro) and `EMOTION_VALENCE` are all derived from `EMOTIONS`. One weak spot: [EmotionBreakdown.tsx:91-93](../src/components/insights/EmotionBreakdown.tsx#L91-L93) looks up the image **by label**. Pass `id` in `EmotionStat` from [InsightsScreen.tsx:135-143](../src/screens/InsightsScreen.tsx#L135-L143) instead (**NICE**).
- **Manual fetches next to TanStack Query:** All server reads go through the `hooks/` queries, and QuoteCard's external fetch is a `useQuery` too. The only leftovers are the dead X1 and X2. IntentionCard's AsyncStorage `useEffect` is local-only, which is fine.

---

## 5. Performance

### P1. `background.png` is 7.7 MB and sits behind every screen — **SHOULD** (high impact)
- **Where:** `assets/images/background.png` (1696×2528 PNG), loaded by [AppBackground.tsx:23](../src/components/layout/AppBackground.tsx#L23)
- **Why it matters:** It adds 7.7 MB to the app binary and every OTA bundle, and it's the first thing the Render **web** build downloads before anything paints. Decoded, it's roughly 17 MB of RGBA (1696 × 2528 × 4), which is my estimate. By comparison, all nine emoji PNGs together are ~40 KB.
- **Fix:** Re-export it as JPEG or WebP at about phone width (~1080 px). It should land in the low hundreds of KB. The code doesn't need to change.

### P2. The Firestore SDK is bundled but never used — **NICE**
[firebase.ts:5](../src/config/firebase.ts#L5) imports `firebase/firestore` only to create an unused `db` (X8). Removing it drops a large dependency from the JS bundle (I didn't measure the exact saving). If the client never touches Firestore, you can also lock the Firestore security rules to deny all client access. That's outside `src/`, so verify it.

### P3. The Insights chart re-renders on unrelated state changes — **NICE** (modest impact)
- **What:** `EmotionWavesChart` isn't memoized, and it builds `chartConfig` inline ([EmotionWavesChart.tsx:244-275](../src/components/insights/EmotionWavesChart.tsx#L244-L275)) and `emotionOptions` on every render ([:53](../src/components/insights/EmotionWavesChart.tsx#L53)). Opening or closing the tooltip, or any `isFetching` flip, re-renders InsightsScreen, which redraws the whole SVG `LineChart` (~31 points plus grid). `ChartTooltipModal`'s `onClose` and `GoalsProgress`'s `onAddGoal` are also inline arrows ([InsightsScreen.tsx:283](../src/screens/InsightsScreen.tsx#L283), [:291](../src/screens/InsightsScreen.tsx#L291)).
- **Fix:** Export `React.memo(EmotionWavesChart)`, move `chartConfig` into a `useMemo` keyed on `selectedColor`, and `useCallback` the two arrows. The heavy data shaping in InsightsScreen is already memoized correctly.

### Checked and clean
- No list is long enough to need `FlatList`: at most 9 emotions, a few goals, and 3 months of calendar dots. Keys are fine; index keys appear only on static lists.
- `useDiaryController`'s ~90-day goal walk and `markedDates` are memoized with correct dependencies.
- Emoji images are small, and their display sizes are chosen so they don't upscale.

---

## 6. Deploy readiness

### DR1. Native release builds have no production API URL and fail silently — **MUST**
- **Where:** [api.ts:12-47](../src/config/api.ts#L12-L47) and the root `.env`, which has **no `API_URL`** (checked key names only). There is also no `eas.json`.
- **What:** The web build is covered: `render.yaml` injects `API_URL` at build time. A native build (EAS or `expo run:android --variant release`) inlines `.env` at build time. It finds no `API_URL`, `hostUri` isn't set in a release build, and it falls back to `http://<API_HOST>:3000` or `http://localhost:3000`. On Android release builds, cleartext `http://` is also blocked by default, so every request fails with "No connection". That fallback only works in dev.
- **Fix:** Set `API_URL` for native builds (in `.env` on the build machine or in EAS build env). Make production refuse to guess:
  ```ts
  if (!__DEV__) {
      if (!API_URL) throw new Error('API_URL is not set for this build');
      return API_URL.replace(/\/+$/, '');
  }
  // ...LAN detection below stays dev-only
  ```
- **Gotcha:** `babel.config.js` has `api.cache(true)`, so after editing `.env` you need `npx expo start --tunnel -c` or the old value stays inlined.

### DR2. Private journal content and emails are written to logs — **MUST** for the private data, **SHOULD** for the rest
- **Private data:**
  - [useReflectionController.ts:52](../src/controllers/useReflectionController.ts#L52) logs the full entry payload, **including the user's notes**.
  - [AuthContext.tsx:31](../src/context/AuthContext.tsx#L31) logs the user's email.
  - Services log uids ([goalService.ts:98](../src/services/goalService.ts#L98), [greetingService.ts:69](../src/services/greetingService.ts#L69), [journalService.ts:125](../src/services/journalService.ts#L125)).
  - [TodayScreen.tsx:27](../src/screens/TodayScreen.tsx#L27) logs the gratitude text.
- **Why:** On web these appear in any visitor's devtools, and on Android they're in logcat. A Sentry DSN is already in `.env`, and Sentry's default console breadcrumbs would upload journal notes the day it's wired in.
- **The rest:** There are 76 `console.*` calls in `src/`. The heaviest are AuthContext (17), goalService (16) and useGoalsController (8).
- **Fix:** Delete the payload, email, uid and text logs outright. For the rest, keep `console.error` in `catch` blocks and delete or `__DEV__`-guard the `console.log` progress lines.

### DR3. The first request after idle will likely time out on Render's free tier — **SHOULD** (moderate confidence)
- **Where:** [api.ts:70](../src/config/api.ts#L70) (`timeout: 10000`) and `render.yaml` (`plan: free`)
- **What:** Free Render web services spin down when idle, and the first request after that commonly takes well over 10 s to answer. That's a known platform behaviour I haven't measured for this service. With a 10 s timeout and `retryTransportFailures` (2 retries), the first open of the day is likely to show "No connection" or skeletons.
- **Fix:** Pick one: a paid instance, a keep-warm ping on `/health`, or raise the axios timeout to about 30 s. The first two are ops changes, not code.

### DR4. Hard-coded or misleading strings users will see — **NICE**
- [ProfileScreen.tsx:60](../src/screens/ProfileScreen.tsx#L60): "data synced!" (see B6)
- [ProfileScreen.tsx:69](../src/screens/ProfileScreen.tsx#L69): raw Firebase errors (B9)
- The version text `V1.0.0 [ PRO ]` / `[ GUEST ]` is hard-coded ([ProfileScreen.tsx:211](../src/screens/ProfileScreen.tsx#L211), [:283](../src/screens/ProfileScreen.tsx#L283)). Read `Constants.expoConfig?.version` instead, and decide whether "PRO" should appear at all.
- "EDIT PROFILE" and "PRIVACY & SECURITY" rows open "Coming Soon" ([ProfileScreen.tsx:253-267](../src/screens/ProfileScreen.tsx#L253-L267)). Consider hiding them for launch.

### DR5. Secrets — checked and clean
- The only credentials in client code are the Firebase web config, which is public by design; access is enforced by rules and the backend's token check.
- `.env` and `server/service-account.json` are gitignored.
- There are no hard-coded tokens, keys or LAN IPs in `src/`. The only hard-coded URL is ZenQuotes, which is public.
- The dev LogBox toasts (the auth timeout warning, `[API Config] API_HOST is not set`, `[PixelAlert] No PixelAlertHost…`) are `console.warn`, and LogBox doesn't run in release builds, so users won't see them.

### Outside `src/`, noted only
`app.json` still has `"package": "com.anonymous.emotiontracker"`. It needs a real id before any store upload, and it can't be changed after the first release.

---

## Top 5 things to fix first

1. **Collapse guest migration into one guarded path** (B1 + A1 + D1). Right now it duplicates user data on signup, blocks the spinner on network calls, and the stale-closure timeout masks both problems. One edit to `AuthContext.tsx` fixes all three.
2. **Set `API_URL` for native builds and stop the LAN fallback in production** (DR1). Without it, a release APK can't reach the backend at all.
3. **Write entry dates in local time** (B2, and the same one-line fix in B8), before production data starts accumulating under UTC dates.
4. **Stop freezing "today" and wire `focusManager` to `AppState`** (B3 + B4). Otherwise an app resumed the next morning can permanently mark goals done for the wrong day and shows stale streaks.
5. **Remove the logs that contain journal notes, emails and uids** (DR2), then delete the dead files X1 and X2. X1's `handleLogout` is a trap that skips the cache clear if anyone wires it up again.

Close behind: re-export `background.png` (P1). It's a two-minute asset change that cuts about 7 MB from every build and from the web first load.
