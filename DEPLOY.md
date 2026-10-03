# Deploying to Render

Two services, defined in `render.yaml`: the Express API and the Expo **web** build.
This does not ship the native app — that goes through EAS (see `DEPLOY-MOBILE.md`).

Render reads `render.yaml` when you create a Blueprint from the repo. Everything
marked `sync: false` is prompted for in the dashboard and never stored in git.

## How the API service is built

- **No root directory.** The server compiles `../shared`, and Render hides every
  file outside a service's root directory at build and run time. The service runs
  from the repo root and scopes itself to `server/` with `npm --prefix`.
- **Build:** `npm ci --prefix server --include=dev && npm run build --prefix server`
- **Start:** `node server/dist/server/src/index.js`. The compiled entry is nested
  because `server/tsconfig.json` has `rootDir: ".."` so it can compile `shared/`.
- **Build filter:** only `server/**`, `shared/**` and `render.yaml` trigger a deploy,
  so mobile-only commits don't redeploy the API.
- **Health check:** `GET /healthz`, which always answers 200 and never touches Firestore.
  `/health` is still there for `server/src/scripts/testEndpoints.ts`.
- **Node:** pinned by `NODE_VERSION` in `render.yaml` (22.23.3). It's set there, not in
  `.nvmrc` or `engines`, because with the repo root as the service root Render would
  read those from the Expo app's `package.json`.
- **Region:** permanent once the service exists. It should match the Firestore
  database's location.

## Firebase credentials

The service account key is a Render **Secret File**, not an env var and never a
file in the repo. `GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/serviceAccount.json`
(set by the blueprint) points Application Default Credentials at it.

In production the server **refuses to boot** if that variable is unset, the file is
missing, or the file isn't a service account key. The deploy fails loudly instead
of going live and answering every request with 401.

Locally nothing changes: with `GOOGLE_APPLICATION_CREDENTIALS` unset and `NODE_ENV`
not `production`, `npm run dev` uses `FIREBASE_SERVICE_ACCOUNT_PATH` or
`server/service-account.json`, as before.

## First-time setup

Before you start: commit and push the branch that contains `render.yaml` and the
`server/` changes, with `region:` set to a real value. The placeholder is invalid on
purpose, so the Blueprint is rejected until it's replaced.

1. **Create the account.** Sign up at render.com with GitHub. When prompted, install
   the Render GitHub app and grant it access to this repository.
2. **Create the Blueprint.** Dashboard → **New** → **Blueprint** → pick this repo
   → pick the branch you pushed → give the Blueprint a name.
3. **Fill in the prompted values.** Render lists both services and asks for every
   `sync: false` value:
   - `mood-tracker-api` → `CORS_ORIGIN`: `*` for now (native apps don't send an
     `Origin` header, so this only matters for the web build).
   - `mood-tracker-web` → `API_URL` and the six `FIREBASE_*` values (see
     *Frontend env vars* below). The API's URL will be
     `https://mood-tracker-api.onrender.com` unless Render reports that name taken.
4. **Apply.** The API's first deploy is **expected to fail** with
   `GOOGLE_APPLICATION_CREDENTIALS points at /etc/secrets/serviceAccount.json, which does not exist`.
   A Blueprint can't declare secret files, so the key isn't there yet.
5. **Add the key.** `mood-tracker-api` → **Environment** → **Secret Files** →
   **Add Secret File**:
   - Filename: `serviceAccount.json` (exact case; it mounts at `/etc/secrets/serviceAccount.json`)
   - Contents: paste the entire contents of the service account JSON.
   - **Save, rebuild, and deploy.**

   Consider generating a key just for Render (Firebase Console → Project settings →
   Service accounts → Generate new private key), so the deployed key and your local
   one can be revoked independently.
6. **Verify the deploy.** In **Logs** you should see:
   ```
   Firebase Admin connected to project: emotion-tracker-d05fa (key: /etc/secrets/serviceAccount.json)
   Server is running on 0.0.0.0:10000
   ```
   Then `curl https://mood-tracker-api.onrender.com/healthz` should return `{"status":"OK"}`.
7. **Check the settings.** `mood-tracker-api` → **Settings**:
   - Root Directory is empty.
   - Build Filters shows the paths above.
   - Health Check Path is `/healthz`.
   - The region is the one you chose.
8. **Hand the URL to the app.** Put the service URL into `eas.json` (see
   `DEPLOY-MOBILE.md`) and into the web service's `API_URL`.
9. **Tighten CORS** once the web service has a URL. Set the API's `CORS_ORIGIN` to
   the web origin.

## Backend env vars

| Variable | Value |
|---|---|
| `GOOGLE_APPLICATION_CREDENTIALS` | `/etc/secrets/serviceAccount.json`, set by the blueprint |
| Secret File `serviceAccount.json` | The service account key; added by hand (step 5) |
| `CORS_ORIGIN` | The web service's origin (`*` only while testing) |
| `TRUST_PROXY` | `true`, set by the blueprint |
| `NODE_ENV` | `production`, set by the blueprint |
| `NODE_VERSION` | `22.23.3`, set by the blueprint |

`PORT` is injected by Render. The server binds it on `0.0.0.0`.

## Frontend env vars

`react-native-dotenv` inlines these **at build time**, so a change needs a rebuild,
not a restart. Render's env vars take priority over the `.env` file, and the missing
`.env` on the build host is handled — verified against `react-native-dotenv@3.4.11`.

| Variable | Value |
|---|---|
| `API_URL` | The API service's full origin, e.g. `https://mood-tracker-api.onrender.com` |
| `FIREBASE_*` | The six values from the root `.env` |

`API_URL` exists because every other branch in `src/config/api.ts` builds
`http://<host>:3000`, which cannot describe an HTTPS host on port 443. When it is
set, the LAN-IP guessing is skipped entirely.

Also add the web service's domain to **Firebase Console → Authentication →
Settings → Authorized domains**, or sign-in will be rejected.

## Known caveats

- **The free plan spins down after ~15 minutes idle**, and the next request pays a
  ~50 second cold start. The first load of the day will feel broken. The API's
  10s axios timeout will fire well before the server wakes, and
  `retryTransportFailures` will retry twice more. The query cache is persisted to
  the device, so screens with data from a previous session ride this out by showing
  it; only a query with nothing persisted will show an error first.
- **The web bundle builds** (verified: `npx expo export --platform web`, 6.2MB), but the
  screens are unverified at runtime. `react-native-calendars`,
  `react-native-gifted-charts` and `react-native-chart-kit` are not guaranteed on
  web; the Diary and Insights screens are the ones to check first.
- **Firestore reads are not free.** The streak endpoint reads up to 400 days of
  entry documents per call, though the client caches for 5 minutes.
