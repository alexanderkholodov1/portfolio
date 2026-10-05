# 06 — Roadmap: versioned milestones

One PR per version, titled `vX.Y.Z: <what it delivers>`. Patch versions (`vX.Y.Z+1`) for fixes.
Dates are targets; **the hard deadline is 2026-10-21** (v1.0.0 on 10-20, 10-21 is buffer).
`G` = galaxy repo, `P` = portfolio repo. "Blocker" = operator task from `07-operator-checklist.md`.

## Timeline

| Dates | Version | Repo |
|---|---|---|
| Oct 5–6 | P v0.1.0 · G v0.1.0 | both |
| Oct 7–8 | G v0.2.0 | galaxy |
| Oct 9–10 | G v0.3.0 | galaxy |
| Oct 11 | G v0.4.0 | galaxy |
| Oct 12–13 | G v0.5.0 | galaxy |
| Oct 14 | G v0.6.0 | galaxy |
| Oct 15 | P v0.2.0 | portfolio |
| Oct 16 | G v0.7.0 · P v0.3.0 | both |
| Oct 17–19 | G v0.8.0 | galaxy |
| Oct 20 | G v1.0.0 · P v1.0.0 | both |
| Oct 21 | buffer + operator rehearsal | — |
| after fair | G v1.1.0 · P v1.1.0 | both |

---

## P v0.1.0 — Portfolio foundations & game assembly
Blockers: P1 (push access), P2 (`FIREBASE_SERVICE_ACCOUNT` secret).
- `.gitignore` (already written in planning) committed first; privacy test as build gate (fails if
  anything from `private/` or key material is in `dist/`).
- Astro project: EN at `/`, ES at `/es/`, light/dark with persisted preference, base layout + header
  with placeholder-free skeleton pages (Home, Projects, About, Links, Galaxy entry).
- `/profile.json` and `/tokens.css` published (initial values from the operator's known public
  links; anything unknown → TODO in PR, not invented).
- `games.json` + `scripts/assemble-games` (download pinned GitHub Release artifact → `dist/galaxy/`).
- `firebase.json` per `02-architecture.md`; `.firebaserc` → `alexanderkholodov`.
- GitHub Actions: PR → preview channel; merge to `main` → production.
- `WAR-COUNCIL.md` §3/§7 updated to reflect the agreed plan (operator signs).
- **Accept:** `https://alexanderkholodov.web.app` serves the skeleton in EN and `/es/`, light/dark;
  `/galaxy` serves the G v0.1.0 artifact; deployed by CI, not by hand.

## G v0.1.0 — Galaxy foundations
Blockers: G1 (repo), G2 (data project + Firestore + Auth), G3 (web app config), G4 (secrets).
- Copy `templates/galaxy/AGENTS.md` + `CLAUDE.md` from this repo; add a pointer to this plan.
- pnpm + turbo monorepo: `apps/web`, `apps/stand`, `packages/shared`.
- Vite + React + TS + R3F skeleton built with base `/galaxy/`; routes `/galaxy`, `/screen`,
  `/create`, `/talk`, `/o/:id` stubbed; language toggle (EN default); header from `/profile.json`.
- Firebase: emulator config (Firestore + Auth), **deny-all rules** + rules test harness, data project
  web config via env, Anonymous Auth wired.
- CI: PR → checks + preview channel; tag → release artifact `galaxy-dist-vX.Y.Z.tar.gz`.
- `version.json` generated at build.
- **Accept:** release `v0.1.0` exists and is served at `alexanderkholodov.web.app/galaxy` through
  P v0.1.0; rules tests run in CI.

## G v0.2.0 — Galaxy core
- `/galaxy/screen`: 3D scene, central star, join QR (pointing to `/galaxy/create`), creator counter.
- `/galaxy/create`: choose a basic planet → local preview → swipe to launch.
- Orbital model per `02-architecture.md` (escape/fall → comet), in `packages/shared` with unit tests.
- Data model + rules per `03-data-and-security.md` (objects, users, events, config), launch batch,
  rate limits, all with emulator tests.
- `apps/stand`: snapshot writer (`snapshots/live` every ~30 s) via admin SDK.
- **Accept:** two real phones create and launch; objects appear on the screen in ≤ 2 s; invalid writes
  rejected in tests; a bad swipe produces a returning comet.

## G v0.3.0 — Rich objects & hangar
- Planet / star / moon controls and procedural shaders per `01-product-spec.md` §A; stars light
  nearby planets; visitor stars as hosts (spiral layout); moons per D6.
- Generated names (EN/ES lists in `packages/shared`).
- Live non-destructive editing.
- Hangar: crumble-to-rocks animation on new launch; relaunch reassembles; rocks per D5b.
- Instancing + LOD.
- **Accept:** 500 synthetic objects at 60 fps on the booth laptop (or real figure reported); hangar
  round-trip works on real phones; no free text anywhere.

## G v0.4.0 — Sound
- Parametric sound fingerprint (Tone.js) per `01` §C, quantized to one scale.
- Petting: squash-and-stretch + derived sound (phone and screen).
- Screen mix: ≤ ~8 voices, global volume; phone mute toggle; audio unlock on first tap (mobile).
- **Accept:** two objects with different params sound different; 50 active objects don't sound muddy.

## G v0.5.0 — Global interactions, screen scenes, voice spike
- Shake → aurora/nebula wave (iOS motion permission + fallback button); swipe comets; predefined
  shooting-star messages (~12, EN/ES); ambient meteor showers (stand-triggered at random intervals).
- Cooldowns enforced in rules.
- Screen scenes: galaxy, big QR, spotlight on new object, idle cinematic camera, timelapse placeholder;
  driven by `config/live.screenScene`.
- Kill switches read from `config/live`.
- **Voice spike:** phone clip → Firestore → stand → STT → reply via TTS on laptop speakers; measure
  and report end-to-end latency.
- **Accept:** interactions verified on a real Android and iPhone; spike latency reported.

## G v0.6.0 — Memory
- Timelapse from the event log (scrubber, speed, pause), exact.
- `/galaxy/o/{id}` permanent object page (3D, sound, name, date, portfolio header + socials).
- Postcard 1080×1920 rendered on the phone (name, "Be a Dragon 2026", QR/link to object page); Web
  Share API with download fallback.
- `freeze-season` script (export to static JSON) — tested on emulator data.
- **Accept:** timelapse of a test session matches what happened; postcard shares on Android and iPhone.

## P v0.2.0 — Portfolio shell with real content
Blocker: P3 (operator content by **Oct 13**).
- Home (with live banner reading `snapshots/live` from the data project), Projects, About, Links,
  Galaxy entry — EN/ES, light/dark, per DESIGN-DOCTRINE.
- **Accept:** Lighthouse ≥ 95 on portfolio pages; `/links` instant on mobile; zero invented content.

## G v0.7.0 — Live-safe deploys · P v0.3.0 — Local deploy & rollback
- G: chunk-error soft reload, state restore (phone draft, screen camera/scene), safe-moment updates,
  backward-compatible reads, kill switches complete, Playwright smoke tests (local, CI, preview URL).
- P: `scripts/deploy-local` (build + local galaxy build → preview → promote on confirmation),
  `scripts/rollback` (previous Hosting release).
- **Accept:** with a phone mid-edit and the screen open, a new version is deployed and neither loses
  state nor breaks; rollback restores the previous release in one command.

## G v0.8.0 — Assistant
Blockers: A1 (brain decision D2 + API key), A2 (laptop specs for D8), A3 (workspace folder).
- Everything in `04-assistant.md`: push-to-talk (owner `/galaxy/talk`, public in `/create`), STT,
  brain, Piper TTS, subtitles + orb on screen, personality, owner/public separation, levels N0–N3,
  galaxy tools, laptop control, workspace folder, action log, fix pipeline using P v0.3.0 scripts,
  end-of-fair report.
- **Accept:** 20 real spoken owner commands executed without error; public session proven toolless
  (injection attempt test); a planted bug is fixed, previewed, applied and rolled back live without
  breaking the screen or phones.

## G v1.0.0 · P v1.0.0 — Fair-ready
- Load test (100 simulated phones) + quota report; failure-mode drills from `05`.
- `docs/RUNBOOK.md` (galaxy repo) per `05`; backup video recorded.
- Pin `games.json` to `galaxy v1.0.0`; production verified on real devices.
- Operator: rehearsal on campus Wi-Fi with real phones (Oct 21 buffer).
- **Accept:** runbook dry-run passes end to end on the booth hardware.

## G v1.1.0 · P v1.1.0 — Season freeze (after the fair)
- Close season, run `freeze-season`, `/galaxy` switches to frozen "Season: BAD 2026" with timelapse
  and object pages served statically. Decide Season 2 (D12).

---

## Cut order if behind schedule

1. G v0.8.0 shrinks first: live fixes become a manual command run by the operator; laptop control
   limited to opening/moving windows.
2. G v0.4.0: simpler sound (one tone per type + pet sound).
3. G v0.6.0: postcard dropped (timelapse and object pages stay).

Never cut: G v0.2.0–v0.3.0 core, P v0.2.0 shell, G v0.7.0 live safety.
