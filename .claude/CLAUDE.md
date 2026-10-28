# CLAUDE.md

## What This Is

Emotion journaling + wellness app (pixel-art UI). Monorepo: Expo/RN frontend (root) + Express 5 backend (`server/`) + shared types/logic (`shared/`).

## Stack

- Frontend: React Native, Expo, React Navigation, TanStack Query (persisted to AsyncStorage), axios, zod, Firebase Auth SDK
- Backend: Express 5, Firebase Admin, zod, ts-node, nodemon
- DB: Firestore | Auth: Firebase Authentication (ID token → `Authorization: Bearer`)
- Shared via `@shared/*` alias (types only) or relative `../../shared/...` (runtime values, e.g. zod schemas, utils)

## Commands

| What | Command | Where |
|---|---|---|
| Frontend | `npx expo start --tunnel` (ALWAYS `--tunnel`) | root |
| Android / iOS | `npm run android` / `npm run ios` | root |
| Backend dev | `npm run dev` | server/ |
| Backend build | `npm run build` | server/ |
| Lint | `npm run lint` (root: `expo lint`, server: `eslint src`) | either |
| Streak test | `npm run test:streak` | server/ |

- The only test is `server/src/utils/streak.test.ts` (node:test). No general test runner — never suggest `npm test`.
- A PostToolUse hook (`.claude/hooks/lint-fix.js`) runs `eslint --fix` on every `.ts/.tsx` you write/edit. Don't hand-format.
- Type-check by hand: `npx tsc --noEmit` (root) / `npm run build` (server).

## Layout (where to look — don't scan the rest)

```
App.tsx                    QueryClient + persister (CACHE_BUSTER) + AuthProvider + navigator
src/navigation/            index.tsx (tabs: Today, Diary, Insights, Profile; stack: Goals, GoalForm, EditProfile, Help, Tips, Breathe), types.ts
src/screens/               one per route; thin, delegate to controllers
src/controllers/           use*Controller.ts — WRITES + derived view-state. Own the cache invalidation.
src/hooks/                 use*Query.ts — READS (TanStack Query) · queryConfig.ts = stale/gc/retry/CACHE_BUSTER
src/services/              ONLY place that calls api/Firebase/AsyncStorage. Each branches guest vs API.
src/context/AuthContext    auth state, guest→account migration, cache reset on account switch
src/components/<area>/     today, journal, goals, insights, breathe, layout, ui (pixel primitives), skeleton
src/constants/             variables.ts (GUEST_* keys), emotions, images, colors, pixel, typography, layout, tips, help, goals, breathing
src/config/api.ts          axios instance + token interceptor + ApiError(status 0 = no response)
shared/types/*.types.ts    zod schemas + DTOs + goal schedule logic (goal.types.ts is big: 576 lines, pure functions)
shared/utils/              streak.ts, goalProgress.ts — pure, run on device (guest) AND server
server/src/app.ts          middleware + route mounting (index.ts only calls listen)
server/src/{routes→controllers→services→repositories}/   per feature; repositories own Firestore paths
server/src/middleware/     auth.ts (authenticateUser, requireUid), errorHandler.ts (AppError, asyncWrap, rethrow)
```

Pattern for any feature: `screen → controller (write) / query hook (read) → src/services → api → server route → controller → service → repository → Firestore`.

## API Routes (all under `authenticateUser` except health)

| Mount | Endpoints |
|---|---|
| `/api/entries` | `GET /` (`?month=YYYY-MM`), `GET /stats`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/greetings` | `GET /`, `POST /` |
| `/api/goals` | `GET /`, `GET /completions`, `GET /progress?tzOffsetMinutes=`, `GET\|PUT\|DELETE /:id`, `POST /`, `POST /:id/pause`, `/:id/resume`, `/:id/completions` |
| `/api/users` | `POST /sync`, `POST /increment-entry`, `GET\|PATCH /me`, `DELETE /me/data`, `DELETE /me` |
| `/api/insights` | `GET /` |
| `/api/streaks` | `GET /?tzOffsetMinutes=` |
| `/health`, `/healthz` | public. `/healthz` = Render check, always 200, no Firestore |

Express matches in order: fixed paths (`/completions`, `/progress`, `/stats`) MUST stay above `/:id`.
Firestore: everything under `users/{uid}/…` (`entries`, `greetings`, `goals/{id}/completions/{YYYY-MM-DD}`). Owner always comes from the verified token (`requireUid`), never from body/query.

## Env & Deploy

- Frontend: root `.env` via `@env` alias (react-native-dotenv; `API_URL` wins, else `API_HOST` → `http://<host>:3000`).
- Backend: `process.env` via `dotenv`; `server/.env` + `server/service-account.json` gitignored. `GOOGLE_APPLICATION_CREDENTIALS` → key file (Render: `/etc/secrets/serviceAccount.json`); unset in dev → `server/service-account.json`; production throws at boot without it.
- Backend compiled entry: `server/dist/server/src/index.js` (tsconfig `rootDir: ".."` compiles `../shared`).
- Render: NO rootDir (server needs `shared/`); build scoped with `npm --prefix server`. See `render.yaml` (DEPLOY.md is referenced but not in the repo).
- `src/config/api.ts` LAN IP fallback is machine-specific, not a real default.

## Cross-cutting rules

- **Guest mode**: no account → `GUEST_ID`, data in AsyncStorage (`GUEST_*` keys in `constants/variables.ts`). Every service method has a guest branch AND an API branch — change both. Guest logic that must match the server lives in `shared/` (streak, goalProgress, goal schedule validation) so the two can't drift.
- **Cache keys** (no uid in key; `AuthContext` resets all queries on account change):
  `['entries', 'YYYY-MM']` `['greetings']` `['streaks']` `['goals']` `['goalCompletions']` `['goalProgress']` `['profile']` `['quote', day]`
- **Persisted cache**: change a query's data shape → bump `CACHE_BUSTER` in `src/hooks/queryConfig.ts` (restored data skips the service's zod parse).
- **Dates**: all day logic uses `'YYYY-MM-DD'` keys. Timezone is resolved once via `dayKeyFromMillis(ms, getTimezoneOffset())`; client sends `tzOffsetMinutes` to streaks/progress. Never compare Date objects for "which day".
- **Schemas**: zod schema in `shared/types` is the contract; services `.parse` API responses. Server controllers `.parse` bodies (omit `userId`).
- **Retry**: `retryTransportFailures` (only `ApiError.status === 0`). New query hooks should use it.

## Emotion System

9 emotions in `shared/types/emotions.ts` (ids, labels, colors, imageKey) — every screen derives from that array. Order (pleasant → unpleasant = render order): Happy, Excited, Calm, Confused, Bored, Tired, Sad, Anxious, Angry.
Icons: `assets/images/emojis/<Label>.png`, wired in `src/constants/images.ts` (literal `require` paths — Metro resolves at build time).
Retired ids (`worry`, `fear`) live in `LEGACY_EMOTION_IDS`, fold into `anxious` on read. Never drop a retired id without adding it there. Entry `label` is re-derived from id on parse.

## Feature Workflows — check the whole chain before editing any link

When you change one step, walk the others in the same row. If it touches a shared type, check both `src/` and `server/src/`.

### Emotion entry (check-in → diary → insights)
`CheckInScreen` (pick emotions + scale) → `ReflectionScreen` / `useReflectionController` (notes; draft kept in module var `draftNotes`; on save → `JournalService.addEntry`) → invalidates `['entries', thisMonth]` + `['streaks']` → `navigation.reset` to `App`.
Server: `POST /api/entries` → `journalController` → `journalService` → `journalRepository`.
Readers of `['entries', month]`: `DiaryScreen` via `useDiaryController` (loads month ±1), `InsightsScreen` via `useInsightsController` (+ `usePrefetchInsights` in AppTabs), `EmotionCheckInCard` (today logged?), `StreakCard`.
Also: `/api/entries/stats` (`insightsController.getEmotionStats`) for Insights counts, `JournalEntrySchema` in `shared/types/journal.types.ts`.
**Break risks**: new field on entry → `JournalEntrySchema`, server repo mapping, guest branch in `journalService`, Diary `DayEntryModal`/`EntryEmotionsList`, Insights aggregation (`aggregateByDay`), `CACHE_BUSTER`. Streaks derive from entry `timestamp`.

### Greeting (gratitude note)
`TodayScreen` FAB "Greeting" or StreakCard pill → `GratitudeNote` modal → `useGreetingController.saveGreeting` (`GreetingController.ts`) → `GreetingService.addGreeting` → invalidates `['greetings']` + `['streaks']`.
Server: `POST /api/greetings` (text trimmed, 1–2000) → greetingService → greetingRepository (`createdAt` is a SERVER timestamp; no date field).
Readers: `useGreetingsQuery` (Diary calendar dots, `useDiaryController`), `StreakCard` (greeting streak via `/api/streaks`).
**Break risks**: streak counts use `greetingRepository.getRecentCreatedAtMillis`; guest greeting has ISO `createdAt`, server has Timestamp → both handled by `GreetingSchema` (`createdAt: z.any()`). Migration in `AuthContext.migrateGuestData` re-posts via `addGreeting`.

### Streaks
Nothing stored. `GET /api/streaks?tzOffsetMinutes` → `streakService` reads entry + greeting timestamps (last 400 days) → `shared/utils/streak.ts` (`computeStreak`, `dayKeyFromMillis`). Guest: `src/services/streakService.ts` runs the SAME shared functions on AsyncStorage data.
Client `useStreaksQuery.select` zeroes dead streaks (`streakStillAlive`) so a restored cache doesn't lie.
Invalidated by: reflection save, greeting save. **Break risks**: any new thing that should count toward a streak must invalidate `['streaks']`; changing `shared/utils/streak.ts` affects server + guest + `server/src/utils/streak.test.ts`.

### Goals (create / edit / mark / pause / delete / progress)
Screens: `GoalsScreen` (list, pause/resume/delete), `GoalFormScreen` (create when no `goal` param, edit otherwise — one form because a goal is valid only as a whole schedule), `TodayGoalsCard` (tick today), `GoalCard`/`PixelField`/`ToggleBox` components.
Writes: all through `useGoalsController` → `GoalService` (guest = AsyncStorage `GUEST_GOALS_KEY` / `GUEST_GOAL_COMPLETIONS_KEY`; auth = `/api/goals…`).
Invalidation matrix (keep in sync with `useGoalsController.ts`):

| Action | `['goals']` | `['goalCompletions']` | `['goalProgress']` |
|---|---|---|---|
| create / update / pause / resume | ✔ | – | ✔ |
| markGoalDone | – | ✔ | ✔ |
| delete | ✔ | ✔ | ✔ |

Schedule logic lives ONLY in `shared/types/goal.types.ts` (`isGoalScheduledOn`, `goalLastDay`, `plannedDayCount`, `goalScheduleError`, `resolveGoalSchedule`, pauses via `addPause`/`endPause`, `goalDayStatus`) + `shared/utils/goalProgress.ts`. Lengths: days/weeks/months/date; schedule modes: `weekdays` | `dates`. Server computes `endDate` (client sends it only for unit `date`).
Readers: `GoalsScreen`, `TodayGoalsCard`, Diary (`useDiaryController` builds per-day goal pips from goals+completions), Insights (`GoalsProgress`, `goalsDoneIn` in `InsightsScreen`, prefetched by `usePrefetchInsights`).
Server: `goalRoutes → goalController → goalService → goalRepository` (completions are docs named by date; pause/resume 409 on no-op).
**Break risks**: new goal field → `GoalSchema`/`CreateGoalDTO`, `GoalFormScreen`, guest `createGoal`/`updateGoal` in `src/services/goalService.ts`, server controller body schema, `AuthContext.migrateGuestData` (strips `id,userId,endDate,pauses,createdAt,updatedAt` and replays pauses), `GoalCard`, `CACHE_BUSTER`. Changing schedule rules → Diary, TodayGoalsCard, progress (server + guest both use shared code).

### Auth, guest, migration, account switch
`AuthContext.onAuthStateChanged`: different uid → `queryClient.resetQueries()`; signed-in → `UserService.syncUser` + `migrateGuestData` (entries → greetings → goals+pauses → completions, each item removed from guest storage after upload; `invalidateQueries()` when done). `logout` → `queryClient.clear()` and fall back to guest (guest storage kept).
**Break risks**: any NEW guest AsyncStorage key must be added to `migrateGuestData`, `UserService.migrateGuestData/clearGuestData`, and the delete-data flow.

### Profile & deletion
`ProfileScreen`/`useProfileController` ← `useProfileQuery` (`['profile']`, disabled for guests). `EditProfileScreen` → `useEditProfileController` → `setQueryData(['profile'])`.
"Delete all data" → `DELETE /api/users/me/data` (entries, greetings, goals; profile stays) → `resetQueries` for everything except `profile`. "Delete account" → `DELETE /api/users/me` (data, then Firebase Auth user) → `logout`.
**Break risks**: a new Firestore collection under `users/{uid}` must be added to `userRepository.deleteAllData/deleteUser`.

### Static/other screens
`TipsScreen` (`constants/tips.ts`), `HelpScreen` (`constants/help.ts`), `BreatheScreen` (4-7-8; `useBreathingSession`, `useBreathCues`, `constants/breathing.ts`, `components/breathe/`), `QuoteCard` (ZenQuotes, `['quote', day]`). No backend.

## Change checklist

1. Shared type/schema changed? → grep both `src/` and `server/src/`; update guest branch; consider `CACHE_BUSTER`.
2. Added a write? → which cache keys does it make stale? (see matrices above) Put the invalidation in the controller.
3. Added a route? → mount in `server/src/app.ts` (routes file under `authenticateUser`), keep fixed paths above `/:id`, add the service method + guest equivalent.
4. Added a screen? → `src/navigation/index.tsx` + `src/navigation/types.ts`.
5. UI: use pixel primitives in `components/ui` and tokens in `constants/{pixel,typography,layout,colors}`; no hardcoded fonts/spacing.
6. Run `npx tsc --noEmit` (and `npm run build` in `server/` if you touched `server/` or `shared/`).
