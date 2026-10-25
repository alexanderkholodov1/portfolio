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
New objects use `schemaVersion: 2`. Version 1 is limited to legacy planets with `size`, `palette`,
`oceans`; readers default the remaining appearance parameters. No destructive migration.
User, event, config and snapshot envelopes remain `schemaVersion: 1`.

| Field | Type | Notes |
|---|---|---|
| `ownerUid` | string | `request.auth.uid` at creation; immutable; unclaimed planets have `ownerUid == ''`, which clients cannot create |
| `type` | `"planet" \| "star" \| "moon"` | immutable |
| `nameKey` | string | four legacy keys (`quiet-aurora`, `bright-tide`, `gentle-horizon`, `distant-garden`) plus `n[0-3][0-9]-[0-3][0-9]` (40×40 generated combinations per language, EN/ES); no free text |
| `params` | map | per-type, every value range-checked (sizes, colours as palette indices or bounded numbers) |
| `orbit` | map | orbital elements + epoch; `isComet` boolean; `hostId` |
| `hostOrbit` | map | moons only; checked against the host planet’s orbit at launch, then immutable |
| `status` | `"active" \| "hangar"` | transitions only by the owner, via the launch/relaunch batch |
| `createdAt`, `updatedAt` | timestamp | `== request.time` |
| `season` | string | e.g. `"bad-2026"` |

Appearance also determines the G v0.4.0 Tone.js sound fingerprint: size sets register/release;
atmosphere sets low-pass cutoff; mountains/craters set partials; oceans add chorus; rings/corona
feed reverb; temperature brightens; clouds soften attack; palette/moon colour change timbre.
Names do not affect sound. D minor pentatonic, with pets one octave up; at most eight monophonic
voices, pets reusing their slot. Tone and the audio engine load lazily after an unmuted trusted
gesture; no context on first paint or sound before a gesture. Audio is synthesized locally,
never transmitted or persisted. Physical-device unlock and booth-speaker acceptance remain open.

### `users/{uid}`
`activeObjectId`, `launchesToday` (int), `launchDay` (yyyy-mm-dd), `editsToday` (int),
`editDay` (UTC yyyy-mm-dd), `lastWriteAt` (timestamp),
`lastShakeAt`, `lastCometAt`, `lastStarAt` (timestamps). Only the owner writes it.

### `events/{eventId}` (append-only log; source of the timelapse)
`type` ∈ `create | edit | launch | crumble | relaunch | shake | comet | shootingStar | meteorShower`,
`objectId?`, `uid?`, `at` (`== request.time`), `payload` (small, validated per type).
`meteorShower` events are written only by the stand (admin SDK).

### `snapshots/live` (written by the stand only)
Compact state of the visible galaxy (active objects' render params + orbits + counters, plus
supporting moon-host planets marked `moonHost: true`, stripped of ownership/timestamps), rewritten
every ~30 s by `apps/stand`. Public viewers of `/galaxy` and the portfolio's live banner read **this
one document** instead of every object. Supporting planets do not increment creator or active-object
counters.

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
  immutable fields unchanged, params valid. No delete. Read: signed-in screens query only active
  objects, then get missing moon-host planets by ID; rules allow signed-in planet gets. Hangar
  inventory queries are owner-only, with the planet-by-ID exception for moon hosts. Anonymous
  public readers can only get `snapshots/live`, never object documents or collection lists.
- `events`: create only, `at == request.time`, `uid == request.auth.uid`, per-type payload checks,
  per-type cooldown via `users/{uid}` timestamps. No update/delete.
- `users/{uid}`: owner only; counters may only move forward; `launchesToday ≤ MAX_LAUNCHES_PER_DAY`
  (default 5); `editsToday ≤ 100`, tracked independently by UTC `editDay`. Edits increment once
  per confirmed save, reset to one on a new day; missing legacy edit counters mean zero.
  Launch/relaunch cannot erase today’s edit budget.
- `snapshots/live`: public document get only; `config/live`: signed-in document get only. Write: nobody
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

**D6 (captain, 2026-10-22, implementing the operator’s D6):** moons may orbit own or unclaimed
planets, never another visitor’s planet. A hangared planet stays visible in its original orbit
while it hosts an active moon; stored status stays `hangar`, ownership stays unchanged, and it
does not count as a creator or active object. It leaves the supporting scene when its last active
moon leaves.

**Edit batch:** each confirmed edit writes three documents: object, user and edit event. The
rules-enforced 100 edits/day budget is independent of five launches/relaunches per day and does
not bypass the 2-second write cooldown. Appearance/name edits preserve orbital data.

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

## Alpha.2 B1 data contract (2026-10-25)

The operator requested instance-scoped galaxies, accepted actions, checkpoints, private chosen-name
profiles, quotas and a shared GalaxyStore adapter for alpha.2. The implementation contract is
`galaxy/docs/galaxy-store.md`; operational migration is RUNBOOK section 13. Public log visibility
is fixed at galaxy creation; fork to change it. Phone checkpoints remain untrusted until replay
or trusted certification. R25 preserves the submitted launch orbit without eccentricity caps.
The P2 default is 400 accepted mutations, including edits; import sizing chooses 300–600
against actual genesis and per-request rule dependencies before publication.
Packed pages allow 128 KiB: 64 valid rich planet actions exceeded the original 32 KiB target;
an action has a 2,000-byte envelope, retaining fixed 64-entry rollover without blocking a galaxy.
The fair quota scenario is replaced by `galaxy/docs/alpha2-b1-quota.md` (below 50%, conditional
on three mean feed recipients and disabled legacy stand enrichment). Kernel/device acceptance
and the preview/real-phone gate remain outstanding integration work.
