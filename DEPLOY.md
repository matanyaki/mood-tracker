# Deploying to Render

Two services, defined in `render.yaml`: the Express API and the Expo **web** build.
This does not ship the native app — that goes through EAS to the app stores.

Render reads `render.yaml` when you create a Blueprint from the repo
(New → Blueprint → pick this repo → branch `deploy/render`). Everything marked
`sync: false` is prompted for in the dashboard and never stored in git.

## Order matters

Each service needs the other's URL, so do it in this order:

1. Deploy `mood-tracker-api`, set `CORS_ORIGIN=*` for now. Note its URL.
2. Deploy `mood-tracker-web` with `API_URL` set to that URL.
3. Go back and set the API's `CORS_ORIGIN` to the web service's URL.

## Backend env vars

| Variable | Value |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | The entire `server/service-account.json`, as one line |
| `CORS_ORIGIN` | The web service's origin (`*` only while testing) |
| `TRUST_PROXY` | `true` — set by the blueprint |
| `NODE_ENV` | `production` — set by the blueprint |

`PORT` is injected by Render; `server/src/index.ts` already reads it.

**Getting the service account onto one line:**

```bash
node -e "console.log(JSON.stringify(require('./server/service-account.json')))"
```

Paste that output as the value. Do not commit it, and do not paste it into
`render.yaml` — it is a private key.

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
  `retryTransportFailures` will retry twice more. The StreakCard rides this out by
  showing its cached counts, but other screens will show an error first.
- **The web bundle builds** (verified: `npx expo export --platform web`, 6.2MB), but the
  screens are unverified at runtime. `react-native-calendars`,
  `react-native-gifted-charts` and `react-native-chart-kit` are not guaranteed on
  web; the Diary and Insights screens are the ones to check first.
- **Firestore reads are not free.** The streak endpoint reads up to 400 days of
  entry documents per call, though the client caches for 5 minutes.
