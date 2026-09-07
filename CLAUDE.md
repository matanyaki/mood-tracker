# CLAUDE.md

## What This Is

Emotion journaling + wellness app. Monorepo: Expo/RN frontend (root) + Express 5 backend (`server/`) + shared types (`shared/types/`).

## Stack

- Frontend: React Native, Expo, Firebase SDK, React Navigation
- Backend: Express 5, Firebase Admin, ts-node, nodemon
- DB: Firestore | Auth: Firebase Authentication
- Shared types via `@shared/*` alias (frontend) / tsconfig include (backend)

## Structure

root/src: components/ context/ hooks/ navigation/ screens/ services/ utils/ config/api.ts types/ models/ controllers/ constants/
server/src/index.ts — backend entry
shared/types/ — consumed by both sides

## Commands

Start frontend | `npx expo start --tunnel` | root — ALWAYS use --tunnel |
Android | `npm run android` | root |
iOS | `npm run ios` | root |
Start backend | `npm run dev` | server/ |
Build backend | `npm run build` | server/ |

❌ No test runner. No linter. Never suggest `npm test` or `npm run lint`.

## API Routes

`/api/entries` `/api/greetings` `/api/users` `/api/insights` `/api/streaks` `/health`

## Env Vars

- Frontend: root `.env` via `@env` alias (react-native-dotenv / babel.config.js)
- Backend: `server/.env` + `server/service-account.json` — both gitignored ✔

## Gotchas

- `--tunnel` always. LAN IP in `src/config/api.ts` is machine-specific, not a real default.
- Backend compiled output is `dist/server/src/index.js` not `dist/index.js` — tsconfig includes `../shared/types/**/*` which shifts layout.
- Frontend env = `@env` alias. Backend env = `process.env` via `dotenv.config()`.

## Emotion System

9 emotions across 3 valences:

- Positive: Happy, Grateful, Excited
- Neutral: Calm, Confused
- Negative: Sad, Anxious, Angry, Fear

Firestore: entries grouped by date, multiple entries per day, emotions array per entry.

## Key Files

- `src/config/api.ts` — API base URL config
- `src/services/` — all Firebase + backend calls live here
- `babel.config.js` — defines `@env` and `@shared/*` aliases
- `server/src/index.ts` — Express entry, all routes registered here
