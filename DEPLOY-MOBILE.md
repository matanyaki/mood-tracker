# Shipping the mobile app with EAS

The native app is built by EAS, not Render. This covers pointing EAS builds at
the deployed API while local development keeps using your machine's LAN IP.

Nothing here has been applied yet: there is no `eas.json`, and `src/config/api.ts`
doesn't read `EXPO_PUBLIC_API_URL`. These are the steps to do it.

## How the API URL is chosen today

`src/config/api.ts` → `getHost()` tries, in order:

1. `API_URL` from `@env` (react-native-dotenv)
2. The Metro host IP from `Constants.expoConfig.hostUri`. This is skipped under
   `--tunnel`, because that host is an `exp.direct` address.
3. `API_HOST` from `@env` → `http://<API_HOST>:3000`. **This is the LAN-IP dev fallback.**
4. `http://localhost:3000`

Every one of these is fixed **at bundle time**, not read at runtime. Changing the
URL means building again.

## 1. Set up EAS

```bash
npm install -g eas-cli
eas login
eas init              # creates the EAS project; writes extra.eas.projectId into app.json
eas build:configure   # generates eas.json
```

## 2. Put the API URL into `eas.json`

Add an `env` block to the profiles that should talk to Render. Leave
`development` without it, so dev builds keep the LAN fallback.

```jsonc
{
  "build": {
    "development": {
      // no EXPO_PUBLIC_API_URL -> falls through to API_HOST (your LAN IP)
    },
    "preview": {
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_API_URL": "https://mood-tracker-api.onrender.com" },
    },
    "production": {
      "env": { "EXPO_PUBLIC_API_URL": "https://mood-tracker-api.onrender.com" },
    },
  },
}
```

Keep the rest of what `eas build:configure` generated. Use the URL Render actually
assigned; the `.onrender.com` name gets a suffix if `mood-tracker-api` was taken.

## 3. Read it in `src/config/api.ts`

At the top of `getHost()`, replace the `API_URL` block with:

```ts
// Set per EAS build profile in eas.json and inlined at build time. Must stay the
// literal `process.env.EXPO_PUBLIC_API_URL`: destructuring it or indexing
// process.env[name] is not inlined and reads undefined on device.
const deployedUrl = process.env.EXPO_PUBLIC_API_URL || API_URL;

if (deployedUrl) {
  console.log("[API Config] Using deployed API:", deployedUrl);
  return deployedUrl.replace(/\/+$/, ""); // A trailing slash would double up on every path
}
```

Leave the `hostUri` → `API_HOST` → `localhost` fallbacks below it unchanged. Those
are the dev path.

**No babel change is needed.** `babel-preset-expo` inlines `EXPO_PUBLIC_*` on its own,
and `react-native-dotenv` keeps handling `@env`. They don't interact.

## 4. Get the Firebase client config onto EAS

**Without this step, EAS builds can't sign in.** The six `FIREBASE_*` values come
from the root `.env` via `@env`. `.env` is gitignored, so EAS never uploads it, and
`react-native-dotenv` (`allowUndefined: true`) inlines `undefined` without
complaining.

`react-native-dotenv` gives `process.env` priority over `.env`, so build-time EAS
variables fill `@env` imports. Create them once per environment:

```bash
eas env:create --environment production --name FIREBASE_API_KEY --value "<from .env>" --visibility plaintext
# ...repeat for FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET,
#    FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID
# ...and again with --environment preview
```

Then set `"environment": "production"` / `"environment": "preview"` on the matching
build profile in `eas.json`. These values end up in every app binary anyway, so
they aren't secret. Keeping them out of `eas.json` still saves you GitHub
secret-scanning alerts on the `AIza…` key.

## 5. Keep local dev on your LAN IP

- **Don't put `EXPO_PUBLIC_API_URL` in `.env` or `.env.local`.** Expo CLI loads those
  for `npx expo start` too, so dev would silently talk to Render.
- `npx expo start --tunnel` → `EXPO_PUBLIC_API_URL` unset → `API_HOST` from `.env` →
  `http://<LAN IP>:3000`. Keep `API_HOST` current (`ipconfig` → IPv4 Address).
- To test a dev session against Render, set it for one session only and clear the
  bundler cache (the babel config uses `api.cache(true)`):
  ```bash
  EXPO_PUBLIC_API_URL=https://mood-tracker-api.onrender.com npx expo start --tunnel -c
  ```
- **Expo Go works.** No native module outside Expo Go is installed (no Skia, Victory
  Native or dev client), so a dev build isn't needed for day-to-day testing.

## 6. Build and verify

```bash
eas build --profile preview --platform android
```

Install the APK and look for `[API Config] Using deployed API: https://…` in the
logs. Opening `https://<api>/healthz` in the phone's browser should show
`{"status":"OK"}`.

Gotchas:

- **Never point a preview or production build at the LAN IP.** Android release
  builds block cleartext `http://` by default. That's fine for the Render URL,
  which is https.
- **The first request after ~15 idle minutes waits ~50s** while the free Render
  instance wakes, and the app's 10s axios timeout fires first. See DEPLOY.md →
  Known caveats.
- **`expo-updates` isn't installed**, so a new API URL needs a new build, not an OTA
  update.
