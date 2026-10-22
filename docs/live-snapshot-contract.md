# Live snapshot contract (portfolio live banner <-> galaxy)

The Home banner reads one document, `snapshots/live`, of the galaxy data project (Firestore
project `little-galaxy`, configurable with `LIVE_PROJECT_ID`) through the public REST endpoint:

    GET https://firestore.googleapis.com/v1/projects/<project>/databases/(default)/documents/snapshots/live?key=<VITE_FIREBASE_API_KEY>

The key is the public web key. No Firebase SDK is loaded on text pages.

## Shape (written by the galaxy stand; source of truth: `packages/shared/src/schema.ts` in the galaxy repository, `LiveSnapshot`)

```
{ schemaVersion: 1, at: <timestamp>, objects: [...], creators: <number>, activeCount: <number> }
```

The portfolio reads only two fields:

| Field | REST encoding | Meaning |
|---|---|---|
| `creators` | `integerValue` (string) or `doubleValue` | Number of creators; whole, non-negative |
| `at` | `timestampValue` (RFC 3339) | When the stand wrote the snapshot |

Rules: the galaxy's Firestore rules allow public `get` of `snapshots/live` only (no `list`).

## What the banner may show (doctrine R9)

| Reading | Banner |
|---|---|
| Request fails, times out, non-200, malformed document, missing/invalid `at` or `creators`, `at` more than 2 min in the future | Event name only, no number |
| `at` older than 10 min (`STALE_AFTER_MS`) | Event name and "last updated HH:MM", no number |
| Fresh and valid | Event name and `N creators` |
| JavaScript off | Event name only, linking to `/galaxy` |

Tests: `tests/live-snapshot.test.mjs` (interpretation) and `tests/browser/shell.spec.mjs` (mocked
endpoint; no real Google call).
