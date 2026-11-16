# Test Automation Plan (Android)

Scope: Expo/RN app (`src/`), Express API (`server/`), shared logic (`shared/`). Android only. iOS is out of scope for now.

## 1. Goal and starting point

Automate the app with tests that are **data-driven** (cases live in data, not in copied tests) and **generic** (one test body covers many cases).

Today:
- One test: `server/src/utils/streak.test.ts` (`node:test`). Nothing else is automated.
- No `testID` in `src/`, so there are no E2E selectors.
- No CI config (no `.github/`).
- `android/` is prebuilt; EAS has a `preview` APK profile.
- Rule-heavy logic (streaks, goal schedules, goal progress, zod schemas) is pure, takes `today` as a parameter, and is shared by device (guest mode) and server. This is ideal for table-driven tests.

## 2. Decision: Maestro for E2E, on Android emulators

- **Maestro** runs flows (YAML) against any APK with no app changes, auto-waits through animations, and is quick to write. Android emulators work locally on Windows and in GitHub Actions.
- **Appium is not chosen.** It needs a server, drivers and explicit waits, and is the flakiest option. Revisit only if we need real-device-farm features Maestro lacks, or YAML parameterisation becomes a limit.
- Data-driven E2E: a small runner (`tests/e2e/run.ts`) reads a dataset and calls `maestro test -e KEY=value` once per row.
- Most combinations are NOT tested end-to-end. They are tested as pure functions (L1), which is faster and more reliable.

## 3. Layers

| Layer | Covers | Tool | Runs |
|---|---|---|---|
| L1 Unit | `shared/` logic: streak, goal schedule/progress, emotions, zod schemas | `node:test` + ts-node (already in use), table-driven | every commit |
| L2 API | Routes → controllers → services → repositories on Firebase Auth + Firestore emulators: auth, validation, 409s, owner isolation, deletion | `node:test` + `supertest` | every PR |
| L3 Services/controllers | Guest branch of `src/services` (AsyncStorage mocked), cache invalidation, guest→account migration | `jest-expo` + React Native Testing Library | every PR |
| L4 E2E | Real app on an Android emulator: navigation, forms, persistence, offline, account switch | Maestro | smoke per PR, full nightly |

Target split of cases: L1–L3 about 85%, L4 about 15%.

## 4. Data-driven design

```
tests/
  data/        emotions.json, goal-schedules.json, streak-cases.json,
               timezones.json, profiles.json, users.json (personas)
  unit/        L1, loops over data/*.json
  api/         L2
  rn/          L3
  e2e/
    flows/     generic Maestro flows, parameterised by env
    run.ts     dataset row -> maestro test -e ...
    seed.ts    creates a user with N entries/greetings/goals via Admin SDK
```

Rules:
1. A test body is written once; adding a case means adding a row.
2. One generic flow per user action. `flows/log-emotion.yaml` takes `EMOTION`, `SCALE`, `NOTE`, `MODE` (guest | account) and checks the entry in Today, Diary and Insights. The runner runs it for every emotion × scale × mode.
3. The 9 emotions are imported from `shared/types/emotions.ts`, never retyped. A new emotion joins the matrix automatically.
4. Every test pins `today` and timezone. No wall-clock reads.
5. Datasets are validated with zod in CI so a malformed row fails fast.

Example goal rows (feed both L1 and the E2E goal-form flow):

```json
{ "name": "weekdays, 4 weeks",   "unit": "weeks", "count": 4, "mode": "weekdays", "days": ["mon","wed","fri"], "start": "2026-11-02", "expectDays": 12, "expectEnd": "2026-11-29" }
{ "name": "picked dates",        "mode": "dates", "dates": ["2026-11-03","2026-11-10"], "expectDays": 2 }
{ "name": "past start rejected", "start": "2020-01-01", "expectError": "past" }
{ "name": "over max duration",   "unit": "days", "count": 367, "expectError": "max" }
```

## 5. Test plan

Priority: **P0** blocks release, **P1** must pass before release, **P2** best effort. Each test name starts with its ID, e.g. `[GL-03]`.

### Entries (check-in → reflection → diary)

| ID | Scenario | Layer | Pri |
|---|---|---|---|
| E-01 | Log an emotion with scale + note; shows in Diary and Today (9 emotions × scales × guest/account) | L4 | P0 |
| E-02 | Several emotions in one entry (1, 2, all 9) | L4 | P1 |
| E-03 | Draft notes survive Back and clear after save | L3 | P1 |
| E-04 | Edit and delete entry | L2, L4 | P0 |
| E-05 | Retired ids `worry`/`fear` fold into `anxious`; label re-derived from id | L1 | P0 |
| E-06 | `GET /entries?month=` boundaries (month edges, ±1, timezones) | L2 | P0 |
| E-07 | Validation: no emotions, scale out of range, note too long | L2 | P1 |
| E-08 | Save invalidates `['entries', thisMonth]` and `['streaks']` | L3 | P0 |
| E-09 | Offline save: guest works, account shows error without data loss | L4 | P1 |

### Greetings

| ID | Scenario | Layer | Pri |
|---|---|---|---|
| G-01 | Save from FAB and StreakCard pill; dot on Diary calendar | L4 | P0 |
| G-02 | Text trimmed; 0, 1, 2000, 2001 chars; whitespace only | L1, L2 | P0 |
| G-03 | Guest ISO `createdAt` and server Timestamp both parse | L1 | P0 |
| G-04 | Greeting counts toward the greeting streak | L2, L3 | P0 |

### Streaks

| ID | Scenario | Layer | Pri |
|---|---|---|---|
| S-01 | `computeStreak`: empty, today only, yesterday only, gap, long run, duplicates, future dates | L1 | P0 |
| S-02 | `dayKeyFromMillis` across offsets −720…+840, midnight edges, DST | L1 | P0 |
| S-03 | `streakStillAlive` and client `select` zero a dead streak from restored cache | L1, L3 | P0 |
| S-04 | Guest and server return identical results for the same fixtures | L2, L3 | P0 |
| S-05 | `GET /streaks?tzOffsetMinutes=` validation | L2 | P1 |
| S-06 | Streak card updates after reflection or greeting save | L4 | P1 |

### Goals

| ID | Scenario | Layer | Pri |
|---|---|---|---|
| GL-01 | `goalScheduleError`: unit × count × mode × start date, limits `MAX_DURATION`, `MAX_PLAN_DATES` | L1 | P0 |
| GL-02 | `isGoalScheduledOn`, `plannedDayCount`, `goalLastDay`, `computeEndDate` (month-end, leap year) | L1 | P0 |
| GL-03 | Pause/resume: `addPause`, `endPause`, `pauseLastDay`, `resumeDay` | L1 | P0 |
| GL-04 | `computeGoalProgress`, `goalDayStatus` (paused, done, future) | L1 | P0 |
| GL-05 | Create goal via the form for each unit and mode; appears in Goals, Today, Diary | L4 | P0 |
| GL-06 | Edit, pause, resume, delete goal | L4 | P0 |
| GL-07 | Tick today; Today card and Insights update | L4 | P0 |
| GL-08 | Server: 409 on no-op pause/resume, server-computed `endDate`, `/completions` and `/progress` above `/:id` | L2 | P0 |
| GL-09 | Invalidation matrix matches the table in `.claude/CLAUDE.md` | L3 | P1 |
| GL-10 | Form: no past start date; keyboard does not hide fields | L4 | P1 |

### Diary and Insights

| ID | Scenario | Layer | Pri |
|---|---|---|---|
| D-01 | Month navigation loads ±1 month; day modal lists emotions, goals, greetings | L4 | P1 |
| D-02 | Calendar markers for entries, greetings, goal pips | L3 | P1 |
| I-01 | `aggregateByDay` and `/entries/stats` on fixtures (all 9 emotions, empty month, many entries in a day) | L1, L2 | P0 |
| I-02 | Filters and charts with 0, 1, many data points | L4 | P1 |
| I-03 | Goals progress panel and `goalsDoneIn` | L3 | P1 |

### Auth, guest mode, migration

| ID | Scenario | Layer | Pri |
|---|---|---|---|
| A-01 | First launch is guest; data survives app restart | L4 | P0 |
| A-02 | Sign up, sign in, sign out; token attached; 401 handling | L2, L4 | P0 |
| A-03 | `migrateGuestData` order, item removed after upload, resumes after mid-way failure | L3, L4 | P0 |
| A-04 | Account switch resets all caches | L4 | P0 |
| A-05 | Logout keeps guest storage, clears query cache | L3 | P0 |
| A-06 | Owner isolation: user B cannot read or change user A's data | L2 | P0 |
| A-07 | Every `GUEST_*` key is handled by migrate, clear and delete-data (iterate keys in `constants/variables.ts`) | L3 | P0 |

### Profile and deletion

| ID | Scenario | Layer | Pri |
|---|---|---|---|
| P-01 | Edit profile with valid and invalid rows; cache updated | L3, L4 | P1 |
| P-02 | Delete all data: entries, greetings, goals gone; profile stays | L2, L4 | P0 |
| P-03 | Delete account: data, then Firebase user, then logout (hold-to-confirm) | L2, L4 | P0 |
| P-04 | Every collection under `users/{uid}` is removed on delete (list in emulator) | L2 | P0 |

### Other screens and cross-cutting

| ID | Scenario | Layer | Pri |
|---|---|---|---|
| M-01 | Tips and Help show every item from `constants/tips.ts` / `help.ts` | L4 | P2 |
| M-02 | Breathe 4-7-8 phase sequence and durations (fake timers); start/stop | L3, L4 | P1 |
| M-03 | Quote card: success, failure, offline fallback | L3 | P2 |
| M-04 | Every tab and stack route reachable; `navigation.reset` after save | L4 | P0 |
| X-01 | Persisted cache with an old `CACHE_BUSTER` is discarded | L3 | P1 |
| X-02 | Retry only when `ApiError.status === 0` | L3 | P1 |
| X-03 | Every route: 400 bad body, 401 no/bad token, 404, 409 (one suite over a route table) | L2 | P0 |
| X-04 | Slow network and timeouts | L4 | P1 |
| X-05 | Large font scale does not clip primary actions; controls have labels | L4 | P2 |
| X-06 | Perf smoke: cold start, Diary/Insights with 1 000 entries | L4 | P2 |
| X-07 | `/healthz` always 200 without Firestore | L2 | P1 |

## 6. Device and environment matrix (Android)

| Tier | Device | Runs |
|---|---|---|
| A | Pixel-class emulator, current Android | every PR (smoke) |
| B | Pixel-class emulator, API 30–31 (oldest supported) | nightly |
| B | Small phone emulator (~5", 720p, high density) | nightly |
| C | One real Samsung mid-range phone (USB/ADB) | release |
| C | One real low-end Android phone | release (haptics, Breathe audio, performance) |

Set the minimum supported Android version in `app.json` / Gradle before pinning tier B.

Environment dimensions are **parameters**, not extra devices:

| Dimension | Values |
|---|---|
| Mode | guest, account |
| Timezone | UTC−12, UTC−5 (DST), UTC, UTC+5:30, UTC+14 |
| Font scale | 100%, 130%, 200% |
| Network | online, offline, slow, drops mid-request |
| Data volume | empty, 30 days, 1 000 entries |

Never run the full cross product. Use **pairwise** selection so every pair of values appears at least once: about 8–10 nightly runs instead of hundreds. Timezone behaviour is mostly proven in L1; E2E runs only a few timezones.

## 7. Cadence

| Trigger | Suite | Target |
|---|---|---|
| Every commit/PR | L1 + L2 + L3, lint, `tsc`, server build | < 5 min |
| PR touching app code | L4 smoke on tier A: guest log emotion, create goal, tick goal, sign in, delete data | < 10 min |
| Nightly | L4 P0 + P1 on tier B, pairwise matrix | < 45 min |
| Release candidate | Everything + tier C real devices + manual checklist (haptics, audio, animation feel) | half a day |

## 8. Prerequisites in the code

1. **`testID`s**, convention `<screen>.<element>[.<key>]` (e.g. `checkin.emotion.happy`, `goalform.save`). Add them to the primitives in `src/components/ui` (`PrimaryButton`, `PixelField`, `ToggleBox`, `PixelSelect`, `PixelAlert`, `HoldToConfirmDialog`, `Card`) so most screens get them for free. Emotion ids come from `shared/types/emotions.ts`.
2. **Auth-emulator flag** in the Firebase client config (env-driven) so test builds never touch the real project. Test builds also point `API_URL` at a server running against the emulators.
3. **Seeding through the Admin SDK** against the emulators (`tests/e2e/seed.ts`). No test endpoint is added to the server.
4. **Scripts and docs:** add `test:unit`, `test:api` (server) and `test:rn` (root); update `.claude/CLAUDE.md`, which says there is no general test runner. Add an EAS `e2e` profile that builds an APK.

## 9. Rollout

| Phase | Deliverable | Effort |
|---|---|---|
| 0 | GitHub Actions: lint, `tsc`, server build, `test:streak` | 0.5 day |
| 1 | L1 data-driven suites: streak, goal schedule/progress, emotions, zod schemas | 2–3 days |
| 2 | Firebase emulators + L2 route-table suite (auth isolation, deletion guards) | 2–3 days |
| 3 | `jest-expo` + RNTL: services, migration, invalidation matrix | 2–3 days |
| 4 | `testID`s + Maestro smoke (5 P0 flows) on an emulator in CI, then dataset-driven flows, nightly matrix, real-device release pass | 5–7 days |

Stop after phase 3 and the logic, where most risk lives, is covered. Phase 4 adds confidence in wiring and layout.

## 10. Reporting

- JUnit XML from every layer, merged into one CI summary. Failed E2E runs attach a screenshot, video and Maestro log.
- Coverage is tracked by scenario ID, not line coverage. A script lists IDs from section 5 that have no test.
- Flaky tests: log retries, quarantine after 3 flakes in 14 days, fix within a week. No blanket auto-retry on P0.
