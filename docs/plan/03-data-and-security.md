# 03 — Data model, security rules, quota budget

All data lives in the **galaxy data project's** Firestore. Types are defined once in
`galaxy/packages/shared` and reused by the web app, the stand process and the rules tests.

## Principles

1. **Firestore is the single source of truth.** No page holds important state only in memory: any
   phone or screen can reload and recover.
2. **Phones only write** (plus a tiny read of their own docs). They do not subscribe to the whole
   galaxy. Only the booth screen(s) listen in real time.
3. **Nothing is ever deleted** during a season. Events are append-only.
4. Deny-by-default rules; every field validated (type, range, enum), ownership enforced.

## Collections

### `objects/{objectId}`
| Field | Type | Notes |
|---|---|---|
| `ownerUid` | string | `request.auth.uid` at creation; immutable |
| `type` | `"planet" \| "star" \| "moon"` | immutable |
| `nameKey` | string | id of the generated name combination (rendered in EN/ES); no free text |
| `params` | map | per-type, every value range-checked (sizes, colours as palette indices or bounded numbers) |
| `orbit` | map | orbital elements + epoch; `isComet` boolean; `hostId` |
| `status` | `"active" \| "hangar"` | transitions only by the owner, via the launch/relaunch batch |
| `createdAt`, `updatedAt` | timestamp | `== request.time` |
| `season` | string | e.g. `"bad-2026"` |

### `users/{uid}`
`activeObjectId`, `launchesToday` (int), `launchDay` (yyyy-mm-dd), `lastWriteAt` (timestamp),
`lastShakeAt`, `lastCometAt`, `lastStarAt` (timestamps). Only the owner writes it.

### `events/{eventId}` (append-only log; source of the timelapse)
`type` ∈ `create | edit | launch | crumble | relaunch | shake | comet | shootingStar | meteorShower`,
`objectId?`, `uid?`, `at` (`== request.time`), `payload` (small, validated per type).
`meteorShower` events are written only by the stand (admin SDK).

### `snapshots/live` (written by the stand only)
Compact state of the whole galaxy (all active objects' render params + orbits + counters), rewritten
every ~30 s by `apps/stand`. Public viewers of `/galaxy` and the portfolio's live banner read **this
one document** instead of every object.

### `config/live` (written by stand / operator only)
`appVersion`, feature flags / kill switches (`comets`, `shake`, `shootingStars`, `launches`,
`assistantPublic`…), `screenScene`, `ownerUid`, `seasonOpen` (bool).

### `assistant/inbox/{msgId}` and `assistant/outbox/{msgId}`
See `04-assistant.md`. Inbox: `{ role: "owner" | "public", uid, audio (base64, ≤ ~20 s clip),
mime, at }`. Outbox: transcript + reply text for subtitles. Owner messages require
`request.auth.uid == get(config/live).ownerUid` (Google sign-in).

## Rules outline (implement + test every line)

- `match /{document=**} { allow read, write: if false; }` as the base.
- `objects`: create if signed in, `ownerUid == request.auth.uid`, schema valid, `createdAt ==
  request.time`, `status == "active"`, and part of a valid launch batch (below). Update only by owner,
  immutable fields unchanged, params valid. No delete. Read: owner reads own docs; screen and public
  read via snapshot (screen may read `objects` — decide per implementation, keep public reads minimal).
- `events`: create only, `at == request.time`, `uid == request.auth.uid`, per-type payload checks,
  per-type cooldown via `users/{uid}` timestamps. No update/delete.
- `users/{uid}`: owner only; counters may only move forward; `launchesToday ≤ MAX_LAUNCHES_PER_DAY`
  (default 5).
- `snapshots`, `config`: read public (snapshot) / read for clients that need flags; write: nobody
  from clients (stand uses admin SDK, which bypasses rules).
- `assistant/inbox`: create only, size-bounded, role checks as above; no client reads of others'
  messages.

**Rate-limit technique:** write the object/event **in the same batch** as an update of
`users/{uid}.lastWriteAt = request.time`; rules check
`request.time > resource.data.lastWriteAt + duration.value(N, 's')` on the user doc and
`getAfter(/users/$(uid)).data.lastWriteAt == request.time` on the object/event. Cooldowns (defaults,
tune in testing): any write ≥ 2 s; shake ≥ 10 s; comet ≥ 10 s; shooting star ≥ 20 s.

**Launch batch** (new object or relaunch): in one batch — previous active object → `hangar`,
new/relaunched object → `active`, `users.activeObjectId` updated, `launchesToday` incremented,
`crumble` + `launch|relaunch` events appended.

**Identity limits (be honest):** one active object per *anonymous identity*. A visitor could get a
second identity by switching browser/private mode. Acceptable for the fair; do not claim "one per
person" as a hard guarantee.

## Quota budget (Spark, per day, data project) — see 09-sources.md

- Writes: 20,000/day. Estimate 300 visitors × ~30 writes ≈ 9,000. Throttle shakes so a crowd shaking
  together can't burn the budget (cooldowns above; optionally aggregate shakes client-side).
- Reads: 50,000/day. Screen listener ≈ 1 read per new doc/change. Public `/galaxy` viewers read
  `snapshots/live` (1 doc + updates) — never the whole `objects` collection.
- Document max size 1 MiB → audio clips capped (~20 s, compressed) and the snapshot kept compact
  (if it approaches the limit, shard into `snapshots/live-0..n`).
- Realtime Database is **not used** (Spark caps it at 100 simultaneous connections).
- After the fair, the season is frozen to static JSON on Hosting → zero Firestore reads forever.
- Hosting transfer (portfolio project): 10 GB/month on Spark; 500 visitors × ~2–3 MB bundle ≈ 1.5 GB.
  Keep the galaxy bundle lean; large future game assets go elsewhere.
