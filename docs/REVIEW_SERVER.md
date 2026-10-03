# Server review — `server/`

## Summary

The core of the API is in good shape. Every `/api` router verifies the Firebase ID token, ownership always comes from the verified uid and never from the request, every Firestore path is scoped under `users/{uid}/…`, bodies go through Zod, and error responses are generic. **The Render deploy will fail as configured, though**, for two reasons found while checking the build:
- `tsc` can't find `zod` for the shared types unless the repo-root `node_modules` exists (reproduced below).
- `NODE_ENV=production` makes `npm install` skip `typescript`.

After those, the remaining issues are:
- Wrong status codes for bad JSON bodies.
- A health check that isn't lightweight.
- A rate limit that is tight for this client.
- Some dead routes, scripts and debug logging.

---

## How the server is put together

| Piece | Where |
|---|---|
| Entry point | [server/src/index.ts](server/src/index.ts). It listens on `process.env.PORT`, or 3000. |
| App setup | [server/src/app.ts](server/src/app.ts): `helmet` → `cors` → `express.json()` → request logger → rate limiter on `/api` → routers → `/health` → `errorHandler` |
| Firebase Admin | [server/src/config/firebase.ts](server/src/config/firebase.ts). Loads the key from the `FIREBASE_SERVICE_ACCOUNT` env var (JSON), falling back to `service-account.json` on disk. Exports `admin` and `db`. |
| Auth | [server/src/middleware/auth.ts](server/src/middleware/auth.ts). `authenticateUser` runs `verifyIdToken` on the `Bearer` token and sets `req.user`. `requireUid(req)` is the only way controllers read the owner. |
| Errors | [server/src/middleware/errorHandler.ts](server/src/middleware/errorHandler.ts): `AppError` (with a status), `asyncWrap`, `rethrow` (logs the real error and throws a generic one), and the central handler (ZodError → 400, AppError → its status, anything else → 500). |
| Layers | routes → controllers (parse with Zod, call `requireUid`) → services (`try` / `rethrow`) → repositories (Firestore) |
| Firestore layout | `users/{uid}` (profile), `users/{uid}/entries`, `users/{uid}/greetings`, `users/{uid}/goals/{goalId}/completions/{YYYY-MM-DD}` |
| Shared code | `../shared/types` and `../shared/utils`, compiled in through the tsconfig `include`, so output lands at `dist/server/src/index.js` |

**Routes.** Every `/api` router mounts `authenticateUser` first. The last column shows whether the mobile/web client calls the route.

| Method + path | Handler | Client uses it? |
|---|---|---|
| `GET /health` | [app.ts:63](server/src/app.ts#L63) (public) | Render health check |
| `GET /api/entries?month=` | [journalController.ts:33](server/src/controllers/journalController.ts#L33) | yes |
| `GET /api/entries/stats?month=` | [insightsController.ts:37](server/src/controllers/insightsController.ts#L37) | yes |
| `POST /api/entries` | [journalController.ts:20](server/src/controllers/journalController.ts#L20) | yes |
| `PUT` / `DELETE /api/entries/:id` | [journalController.ts:48](server/src/controllers/journalController.ts#L48), [:62](server/src/controllers/journalController.ts#L62) | **no** |
| `GET` / `POST /api/greetings` | [greetingController.ts:23](server/src/controllers/greetingController.ts#L23), [:36](server/src/controllers/greetingController.ts#L36) | yes |
| `GET` / `POST /api/goals`, `PUT` / `DELETE /api/goals/:id` | [goalController.ts](server/src/controllers/goalController.ts) | yes |
| `GET /api/goals/completions`, `GET /api/goals/progress`, `POST /api/goals/:id/completions` | [goalController.ts:78](server/src/controllers/goalController.ts#L78), [:93](server/src/controllers/goalController.ts#L93), [:146](server/src/controllers/goalController.ts#L146) | yes |
| `GET /api/goals/:id` | [goalController.ts:106](server/src/controllers/goalController.ts#L106) | only from dead client code (`GoalService.getGoal`) |
| `POST /api/users/sync` | [userController.ts:14](server/src/controllers/userController.ts#L14) | yes |
| `POST /api/users/increment-entry`, `GET /api/users/me` | [userController.ts:30](server/src/controllers/userController.ts#L30), [:42](server/src/controllers/userController.ts#L42) | **no** |
| `GET /api/insights?days=` | [insightsController.ts:24](server/src/controllers/insightsController.ts#L24) | **no** |
| `GET /api/streaks?tzOffsetMinutes=` | [streakController.ts:26](server/src/controllers/streakController.ts#L26) | yes |

---

## 🔴 Must fix before deploy

### 1. The Render build can't compile the shared types: `Cannot find module 'zod'`
- **Where:** [server/tsconfig.json:17-19](server/tsconfig.json#L17-L19) (`paths`) and [render.yaml:14-15](render.yaml#L14-L15) (`rootDir: server`)
- **What's wrong:** `shared/types/*.ts` import `zod`. TypeScript resolves that import by walking up from `shared/`, so it finds the **repo-root** `node_modules`, never `server/node_modules`. Locally that works by accident, because the frontend's `node_modules` is there. `tsc --traceResolution` shows the shared files resolving `zod` to the root copy (4.3.5), while server files use `server/node_modules` (4.4.3). On Render, `rootDir: server` means only `server/` gets `npm install`.
- **How I verified it:** I copied `server/` and `shared/` to a scratch folder with no root `node_modules` and ran `tsc`. It exited with code 2: `TS2307: Cannot find module 'zod'` in all 6 shared type files, plus implicit-`any` errors that follow from it. `npm run build` fails, so the deploy fails.
- **Why it matters:** The API can't be deployed at all.
- **Minimal fix:** Point `zod` at the server's own copy. It's one line, and I re-ran the scratch build with it: `tsc` exited 0.
  ```jsonc
  "paths": {
      "@shared/*": ["../shared/*"],
      "zod": ["./node_modules/zod"]
  }
  ```
  This also stops the server's types from silently mixing two zod versions. Runtime was never affected: compiled `dist/shared/**` resolves `zod` from `server/node_modules` because `dist` lives inside `server/`.

### 2. `NODE_ENV=production` at build time skips `typescript`
- **Where:** [render.yaml:15](render.yaml#L15) (`npm install && npm run build`), [render.yaml:22-23](render.yaml#L22-L23) (`NODE_ENV: production`), and [server/package.json:16-26](server/package.json#L16-L26), where `typescript` and all `@types/*` are devDependencies
- **What's wrong:** With `NODE_ENV=production`, npm omits devDependencies by default. I checked: `NODE_ENV=production npm config get omit` prints `dev` on npm 11.6.2. Render makes service env vars available during the build as well as at runtime. So `npm install` doesn't install `typescript`, and `npm run build` (`tsc`) fails. *Confidence: high on the npm behaviour. It rests on Render's documented build-time env handling, which I didn't observe in a live build.*
- **Minimal fix:** Change only the build command:
  ```yaml
  buildCommand: npm install --include=dev && npm run build
  ```

---

## 🟡 Should fix soon

### 3. Malformed JSON and oversized bodies return 500 instead of 400 or 413
- **Where:** [errorHandler.ts:77-85](server/src/middleware/errorHandler.ts#L77-L85)
- **What's wrong:** `express.json()` rejects a malformed body with an error that carries `status: 400` (`type: 'entity.parse.failed'`), and a body over 100 kB with `status: 413`. The custom handler only recognises `ZodError` and `AppError`, so both fall through to "Internal server error" (500). They also get logged as unhandled errors.
- **Why it matters:** The client is told the server broke when the request was bad. The client's retry logic and error copy both key off the status.
- **Minimal fix:** Add a branch before the final 500:
  ```ts
  const status = (err as { status?: number })?.status;
  if (typeof status === 'number' && status >= 400 && status < 500) {
      return res.status(status).json({ success: false, data: null, error: 'Invalid request body' });
  }
  ```

### 4. `GET /api/entries?month=` doesn't validate `month`
- **Where:** [journalController.ts:36](server/src/controllers/journalController.ts#L36): `req.query.month as string | undefined`
- **What's wrong:** Its sibling `/api/entries/stats` validates the same parameter with `MonthQuerySchema` ([insightsController.ts:15](server/src/controllers/insightsController.ts#L15), where the comment says a malformed month must never reach the Firestore range query). This route passes the value straight into `where('date', '>=', \`${yearMonth}-01\`)` ([journalRepository.ts:61-62](server/src/repositories/journalRepository.ts#L61-L62)). `?month=2026` or `?month=a&month=b` (an array) produce nonsense ranges that return the wrong rows with a 200. Nothing crashes, but the result is silently wrong.
- **Minimal fix:** Export the existing schema from `insightsController.ts` and reuse it:
  ```ts
  const month = MonthQuerySchema.parse(req.query.month);
  ```

### 5. A broken Firebase config starts the server anyway, and users are told their session expired
- **Where:** [firebase.ts:45-62](server/src/config/firebase.ts#L45-L62) and [auth.ts:63-70](server/src/middleware/auth.ts#L63-L70)
- **What's wrong:** If `FIREBASE_SERVICE_ACCOUNT` is missing, or its JSON is invalid (easy to get wrong when pasting into the Render dashboard), the error is logged and the server boots with no Admin app. Every request then fails inside `admin.auth()`. The auth middleware's catch-all turns that into **401 "Invalid token"**, which the client displays as "Session expired. Please log in again". `/health` does return 503, so Render will probably mark a fresh deploy as failed, but the logs and client errors point at auth rather than config.
- **Minimal fix:** Fail fast outside development:
  ```ts
  } catch (error) {
      console.error("Failed to initialize Firebase:", error);
  }
  if (!db && process.env.NODE_ENV === 'production') {
      throw new Error('Firebase Admin not initialized: set FIREBASE_SERVICE_ACCOUNT');
  }
  ```

### 6. The rate limit is tight for how this client uses the API
- **Where:** [app.ts:44-51](server/src/app.ts#L44-L51): 100 requests per 15 minutes, per IP
- **What's wrong:** One app launch fires roughly 10-15 API calls:
  - Today: entries (1-2 months), goals, completions, streaks, user sync.
  - Diary: 3 months of entries, greetings, goals, completions.
  - Insights: entries, stats, the previous month, goal progress.

  Browsing months in Insights costs about 3 calls per month. Mobile carriers commonly put many users behind one IP (CGNAT), and they would all share this budget. *Confidence: moderate on real-world impact, since it depends on traffic.*
- **Minimal fix:** Raise `max` (e.g. `600`). Keep it per-IP, since the limiter runs before auth.

### 7. `/health` isn't lightweight: it calls Firestore on every probe
- **Where:** [app.ts:76](server/src/app.ts#L76): `await db.listCollections()`, with Render polling it via [render.yaml:20](render.yaml#L20)
- **What's wrong:** Each health probe is a Firestore round trip. A brief Firestore slowdown makes Render consider the instance unhealthy and restart it, even though restarting fixes nothing. It also adds Firestore operations for every probe.
- **Minimal fix:** Answer from process state only:
  ```ts
  app.get('/health', (_req, res) => {
      res.status(admin.apps.length ? 200 : 503).json({ status: admin.apps.length ? 'OK' : 'ERROR' });
  });
  ```
  With #5 in place, a server without Firebase won't even start, so this check is enough.

### 8. Entry bodies have no size limits
- **Where:** [journalController.ts:9](server/src/controllers/journalController.ts#L9) (`CreateEntryBodySchema`) and [journalController.ts:10](server/src/controllers/journalController.ts#L10) (update)
- **What's wrong:** `note` has no maximum length, and `emotions` has no maximum count or uniqueness rule. One request can store a note of about 100 kB, or `happy` 5,000 times. Every copy counts in `/api/entries/stats` ([journalRepository.ts:143-157](server/src/repositories/journalRepository.ts#L143-L157)). Greetings already get a local bound ([greetingController.ts:12-14](server/src/controllers/greetingController.ts#L12-L14)); entries don't.
- **Minimal fix:** Follow the same local pattern:
  ```ts
  const CreateEntryBodySchema = JournalEntrySchema
      .omit({ id: true, userId: true, createdAt: true, updatedAt: true })
      .extend({ emotions: JournalEntrySchema.shape.emotions.max(9) });
  ```
  Also cap `note` (e.g. `.max(2000)`) in the shared emotion item, or in a local copy of it.

---

## 🟢 Nice to have

### 9. Leftover debug logging
- [journalRepository.ts:21](server/src/repositories/journalRepository.ts#L21) and [:26-30](server/src/repositories/journalRepository.ts#L26-L30) log cutoffs, doc counts and a sample timestamp on every read.
- [auth.ts:38-39](server/src/middleware/auth.ts#L38-L39) and [:59](server/src/middleware/auth.ts#L59) log three lines per request, including the uid.
- [auth.ts:64](server/src/middleware/auth.ts#L64) logs the full error object and stack for every expired token. Expired tokens are routine, so this floods the logs.
- [app.ts:37-41](server/src/app.ts#L37-L41) logs every request.

Fix: delete them, or log one line per failed auth (`error.code` only). Keep the `console.error` calls in `rethrow` and `errorHandler`.

### 10. Dead routes and the code behind them
- `GET /api/insights`: [insightsRoutes.ts](server/src/routes/insightsRoutes.ts), [insightsController.ts:24-35](server/src/controllers/insightsController.ts#L24-L35), [app.ts:11](server/src/app.ts#L11), [app.ts:58](server/src/app.ts#L58). The client uses `/api/entries/stats` instead.
- `POST /api/users/increment-entry`: [userRoutes.ts:12](server/src/routes/userRoutes.ts#L12), [userController.ts:30-40](server/src/controllers/userController.ts#L30-L40), [userService.ts:25-31](server/src/services/userService.ts#L25-L31), [userRepository.ts:67-78](server/src/repositories/userRepository.ts#L67-L78). Because nothing calls it, the `stats` object written on profile creation ([userRepository.ts:34](server/src/repositories/userRepository.ts#L34)) is never updated: `totalEntries` and `currentStreak` stay 0 forever. Delete the route, or drop `stats` from new profiles so nobody trusts it.
- `GET /api/users/me`: [userRoutes.ts:13](server/src/routes/userRoutes.ts#L13).
- `PUT` and `DELETE /api/entries/:id`: [journalRoutes.ts:21-24](server/src/routes/journalRoutes.ts#L21-L24). Keep these if editing is planned, since they're correct and scoped.

### 11. Dead functions, parameters and exports
- `userRepository.update` ([userRepository.ts:52-58](server/src/repositories/userRepository.ts#L52-L58)) has no callers.
- The `explicitId` parameter ([baseRepository.ts:19](server/src/repositories/baseRepository.ts#L19), [:32-34](server/src/repositories/baseRepository.ts#L32-L34)) is never passed.
- `BaseRepository.findAll` ([baseRepository.ts:55-84](server/src/repositories/baseRepository.ts#L55-L84)) is overridden by all three subclasses, so the base version never runs.
- `export default errorHandler` ([errorHandler.ts:88](server/src/middleware/errorHandler.ts#L88)) is never imported (app.ts uses the named export).

### 12. Stale scripts in `src/scripts/`
- [testEndpoints.ts](server/src/scripts/testEndpoints.ts) sends no `Authorization` header, so every `/api` call in it now returns 401.
- [checkFirebase.ts:19](server/src/scripts/checkFirebase.ts#L19) checks for a top-level `greetings` collection that no longer exists (greetings are a subcollection now). It then **writes a test greeting** through the real service, into whichever project the credentials point at.

Neither script is referenced in `package.json`. Delete both. That also keeps them out of `dist/`, since `tsc` currently compiles them.

### 13. Stale comments
- [greetingRoutes.ts:8-9](server/src/routes/greetingRoutes.ts#L8-L9): "allow passing userId in body for now if auth is loose"
- [userRoutes.ts:7-8](server/src/routes/userRoutes.ts#L7-L8): "Public route… Let's secure it."

Both describe an auth model the code no longer has. A future reader could take them as permission, so delete them.

### 14. The same code is copied into many files
- `interface ApiResponse<T>` is declared separately in all 6 controllers ([goalController.ts:40](server/src/controllers/goalController.ts#L40), [greetingController.ts:17](server/src/controllers/greetingController.ts#L17), [insightsController.ts:18](server/src/controllers/insightsController.ts#L18), [journalController.ts:13](server/src/controllers/journalController.ts#L13), [streakController.ts:20](server/src/controllers/streakController.ts#L20), [userController.ts:8](server/src/controllers/userController.ts#L8)). Export it once from `errorHandler.ts` or a small `types.ts`.
- The Firestore `Timestamp → Date` conversion is copied 5 times ([baseRepository.ts:67-75](server/src/repositories/baseRepository.ts#L67-L75), [:103-111](server/src/repositories/baseRepository.ts#L103-L111), [goalRepository.ts:35-44](server/src/repositories/goalRepository.ts#L35-L44), [journalRepository.ts:38-46](server/src/repositories/journalRepository.ts#L38-L46), [:72-80](server/src/repositories/journalRepository.ts#L72-L80)). One plain function in `baseRepository.ts` would cover all of them:
  ```ts
  export const toPlain = (doc: FirebaseFirestore.DocumentSnapshot) => {
      const d = doc.data()!;
      const date = (v: any) => (v && typeof v.toDate === 'function' ? v.toDate() : v);
      return { id: doc.id, ...d, createdAt: date(d.createdAt), updatedAt: date(d.updatedAt) };
  };
  ```

### 15. Create endpoints return `createdAt` in a different shape from list endpoints
- **Where:** [baseRepository.ts:39-48](server/src/repositories/baseRepository.ts#L39-L48)
- **What's wrong:** `create()` re-reads the document (one extra read per write) and spreads the raw data, so `createdAt` serialises as `{ "_seconds": …, "_nanoseconds": … }`. The list endpoints send an ISO string. The current client ignores the value returned from create, so nothing breaks today.
- **Minimal fix:** Pass the snapshot through the same conversion as #14.

### 16. Completions are read one goal at a time (N+1), and goals are read twice for progress
- **Where:** [goalRepository.ts:70-75](server/src/repositories/goalRepository.ts#L70-L75) and [goalService.ts:67-70](server/src/services/goalService.ts#L67-L70)
- **What's wrong:** `findAllCompletions` runs one query per goal (in parallel, so latency stays flat) and reads every completion ever written. `getGoalProgress` also calls `findAll` alongside it, so the goals list is read twice per request. With a handful of goals the cost is small. The code comment explains why a collection-group query wasn't used.
- **Minimal fix:** For now, pass the goal ids from the `findAll` result into the completions read, instead of re-querying goals. Revisit only if users end up with dozens of goals.

### 17. Deleting a goal isn't atomic
- **Where:** [goalRepository.ts:88-93](server/src/repositories/goalRepository.ts#L88-L93)
- **What's wrong:** The goal document is deleted first, then its completions with `Promise.all`. If a completion delete fails, the client gets a 500 for a goal that is already gone, and orphaned completions are left behind.
- **Minimal fix:** Put the goal and its completions in one `db.batch()`. That's fine below 500 completions, which is about 16 months of daily ticks.

### 18. A goal can be marked done for any date
- **Where:** [goalController.ts:31-33](server/src/controllers/goalController.ts#L31-L33) and [goalService.ts:123-127](server/src/services/goalService.ts#L123-L127)
- **What's wrong:** `date` only has to be a valid `YYYY-MM-DD`. Completions are write-once, so a future date, or one outside the goal's schedule, is stored permanently. The app only offers "today", but the API doesn't enforce it. *Moderate confidence on impact: `computeGoalProgress` appears to ignore days after today, so a future completion would only count once that day arrives.*
- **Minimal fix:** In `markGoalDone`, reject dates after the caller's today. The client already sends `tzOffsetMinutes` for progress, so do the same here, and reject dates before the goal's `startDate`.

### 19. `CORS_ORIGIN` falls back to `*`
- **Where:** [app.ts:31](server/src/app.ts#L31)
- **What's wrong:** This API uses bearer tokens, not cookies, so `*` doesn't expose credentials. It's a loose default, not a hole.
- **Minimal fix:** Set `CORS_ORIGIN` in Render ([render.yaml:34](render.yaml#L34)) to the web app's origin.

### 20. `dotenv.config()` runs twice, and the second call runs late
- **Where:** [app.ts:15](server/src/app.ts#L15) runs after all imports (which include [firebase.ts:6](server/src/config/firebase.ts#L6), which already loaded `.env`)
- **What's wrong:** It's harmless today, but any module that reads `process.env` at import time and runs before `firebase.ts` would miss `.env`.
- **Minimal fix:** Call `dotenv.config()` once, as the first line of [index.ts](server/src/index.ts), and remove the other two.

---

## Checked and clean

- **Auth on every data route:** `router.use(authenticateUser)` is the first line in all six routers.
- **Ownership comes from the token only:** Every controller calls `requireUid(req)`. Create schemas `.omit({ userId })`, so a client-sent `userId` is stripped. Every repository path starts with `users/{uid}`, so a guessed `:id` can't reach another user's data. `markGoalDone` checks goal ownership before writing ([goalService.ts:125](server/src/services/goalService.ts#L125)).
- **No committed secrets:** `server/.env` and `server/service-account.json` are gitignored ([server/.gitignore](server/.gitignore)), and `git log --all` shows neither was ever committed.
- **No leaked internals:** Unknown errors return an opaque 500, and `rethrow` deliberately drops Firestore messages. The 400 for a `ZodError` includes `details: err.issues`, which is field paths and validation messages only, and that's fine.
- **Async handlers:** They're all wrapped in `asyncWrap`, so rejections reach the error handler. Express 5 would also forward them natively, so there's no crash or hang path.
- **Firestore failures don't go silent:** Service methods rethrow, updates and deletes 404 on missing documents, and streak reads use `.select()` with a 400-day window.
- **Dependencies:** All 7 runtime packages are used.
- **Startup work:** Firebase Admin initialises once at module load, and there's no per-request setup.

---

## Deploy checklist for Render

- [ ] **Fix the build:** add `"zod": ["./node_modules/zod"]` to `paths` in `server/tsconfig.json` (#1).
- [ ] **Install devDependencies at build time:** use `buildCommand: npm install --include=dev && npm run build` (#2).
- [ ] Set **`FIREBASE_SERVICE_ACCOUNT`** in the dashboard to the whole key JSON on one line. The code already supports this ([firebase.ts:24-28](server/src/config/firebase.ts#L24-L28)).
- [ ] Make the server **fail fast** when Firebase isn't initialised (#5), so a bad key fails the deploy instead of returning 401s.
- [ ] Set **`CORS_ORIGIN`** to the web app's URL (#19).
- [ ] Make **`/health`** lightweight (#7).
- [ ] Raise the **rate limit** (#6).
- [ ] Already fine, no action needed:
  - `PORT` comes from the environment ([index.ts:3](server/src/index.ts#L3)).
  - `start` points at the real compiled entry, `dist/server/src/index.js`.
  - `TRUST_PROXY=true` is set in the blueprint.
  - `NODE_ENV` is set.
- [ ] Note: on the **free plan**, the service sleeps when idle, and the first request after that is slow. The frontend's 10 s axios timeout can expire before the server wakes (see `docs/review-frontend.md`, DR3).
