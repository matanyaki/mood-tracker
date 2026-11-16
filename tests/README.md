# tests/

Automated tests. The full plan is in [docs/test-automation-plan.md](../docs/test-automation-plan.md).

```
tests/
  data/    test cases as JSON rows, shared by every layer
  unit/    L1: pure logic in shared/ (node:test + ts-node)
  api/     L2: server routes on Firebase emulators (not started)
  rn/      L3: app services and controllers with jest-expo (not started)
  e2e/
    flows/ L4: Maestro flows on an Android emulator (not started)
```

## Run

```
cd server
npm run test:unit
```

## Rules

- A test body is written once. To add a case, add a row in `data/`.
- Import emotions, schemas and other shared values from `shared/`. Never retype them.
- Pin `today` and the timezone in every test. Never read the clock.
- Start each test name with its plan ID, e.g. `[E-05] ...`.
