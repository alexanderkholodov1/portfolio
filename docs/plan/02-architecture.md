# 02 — Architecture

## Overview

```
 GitHub: alexanderkholodov1/galaxy            GitHub: alexanderkholodov1/portfolio
 ┌──────────────────────────────┐              ┌──────────────────────────────────────┐
 │ apps/web   (Vite+React+R3F)  │  release     │ apps: Astro site (/, /es/, /links…)   │
 │ apps/stand (Node, laptop)    │  artifact    │ games.json  { "galaxy": "latest" }    │
 │ packages/shared (types,math) │ ───────────► │ CI: resolve latest artifacts →        │
 │ firestore.rules + tests      │  vX.Y.Z      │     dist/galaxy/ → deploy whole site  │
 └──────────────────────────────┘              └──────────────────────────────────────┘
          │ preview channels only                         │ ONLY deployer of production
          ▼                                               ▼
 Firebase project "alexanderkholodov"  ── Hosting only ──  https://alexanderkholodov.web.app
 Firebase project "little-galaxy"      ── Firestore + Auth (Anonymous, Google) + its own service account
```

Agreed in planning: **two repos** (each game independent; this is the pattern for future games),
**one Hosting site** (the portfolio's), **a separate Firebase project for game data**.

## Repositories

### `portfolio` (this repo)

- Astro, static output (per `WAR-COUNCIL.md` §3 Q4/§4b: zero JS for text pages, Lighthouse ≥95).
- i18n routing: **English at `/`**, Spanish at `/es/`. Light/dark.
- Publishes two same-origin runtime files consumed by games (single source of truth):
  - `/profile.json` — name, role line, social links, nav links (EN/ES labels).
  - `/tokens.css` — design tokens (colour, type, spacing) for light/dark.
- `games.json` — manifest selecting the latest published release of each game (no standing version pin).
- `scripts/assemble-games.*` — resolves each game's release through GitHub's API, downloads its
  checksummed artifact and unpacks it into `dist/<game>/` after the Astro build.
- `firebase.json` — Hosting config (rewrites, headers, caching), see below.
- The **only** repo that deploys to production Hosting.

### `galaxy` (to be created by the operator)

Status update (operator): the repository exists as `alexanderkholodov1/little-galaxy` (public; the
old name `alexanderkholodov1/galaxy` redirects to it).

```
apps/web/        Vite + React + TypeScript + React Three Fiber (+ drei, postprocessing), Zustand,
                 Tone.js. Built with base "/galaxy/".
apps/stand/      Node + TypeScript process that runs on the booth laptop: snapshot writer,
                 assistant (see 04-assistant.md), local deploy helpers. Uses the data project's
                 admin key via GOOGLE_APPLICATION_CREDENTIALS. Never shipped to Hosting.
packages/shared/ Types and schema (single definition used by web, stand and rules tests),
                 orbital math, name lists, predefined messages, sound mapping.
firestore.rules, firestore.indexes.json, firebase.json (emulators + rules deploy to data project)
tests/           rules tests (emulator), unit tests (orbit math, schema), Playwright smoke tests
```

pnpm workspaces + turbo (same tooling as other AKLabs fawns). Use current stable versions at
implementation time; pin them in lockfiles.

The assistant lives in `apps/stand` for the fair. It is meant to become the operator's general
personal assistant later (possibly extracted / merged with CASPIAN) — keep it modular.
For the fair, every assistant component must be free and unable to silently become paid
(operator decision, 2026-10-14). Paid APIs are not allowed; cut G v0.8.0 first if no strictly
free brain is viable (A1/D2).

## Firebase projects

| Project | Services | Notes |
|---|---|---|
| `alexanderkholodov` (exists) | Hosting (site `alexanderkholodov`) | Nothing else needed. Its admin key in `private/` is used for Hosting deploys only. |
| `little-galaxy` (created by the operator) | Firestore, Authentication (Anonymous + Google) | Own quota, own rules, own service account. Can be reset without touching the portfolio. |

- The galaxy web app initializes Firebase with the **data project's public web config**.
- In the data project's Auth settings, **authorized domains** must include
  `alexanderkholodov.web.app` and the preview-channel domains (needed for the operator's Google
  sign-in; verify whether anonymous sign-in needs it).
- Firestore location: chosen by operator at creation, **cannot be changed later**. Recommendation:
  a US-East region (e.g. `us-east1`) for latency from Quito.
- No Cloud Functions (Blaze-only). The booth laptop (`apps/stand`) plays the server role.

## Hosting config (portfolio `firebase.json`)

First matching rewrite wins; brace globs are supported.

```json
{
  "hosting": {
    "public": "dist",
    "cleanUrls": true,
    "rewrites": [
      { "source": "/galaxy{,/**}", "destination": "/galaxy/index.html" },
      { "source": "**", "destination": "/404.html" }
    ],
    "headers": [
      { "source": "**/*.@(html|json)", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] },
      { "source": "**/assets/**", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }
    ]
  }
}
```

The Astro site is static (real files per route), so its catch-all is a 404 page, not an SPA
fallback. Future games add one rewrite line each and, if needed, their own headers (e.g.
cross-origin isolation for Godot web exports) scoped to their path.

## Build → release → deploy pipeline

**galaxy repo (GitHub Actions):**
- On PR: typecheck, lint, unit + rules tests (emulator), build → deploy a **preview channel** on the
  portfolio site containing only the galaxy build (channels never touch production). Needs secret
  with deploy rights to project `alexanderkholodov` (ideally a deploy-only "Firebase Hosting Admin"
  service account; only the operator can create it).
- On tag `vX.Y.Z` (after the version PR is merged): build with base `/galaxy/` → attach
  `galaxy-dist-vX.Y.Z.tar.gz` (+ `version.json`) to a GitHub Release. Also deploys
  `firestore.rules` to the data project (rules changes always require operator approval, see 05).

**portfolio repo (GitHub Actions):**
- On PR: build Astro + assemble games from `games.json` → preview channel.
- On merge to `main`: same build → deploy production (`FIREBASE_SERVICE_ACCOUNT` secret).
- Galaxy merge → tag → release → `repository_dispatch` (`galaxy-release`, `client_payload.tag`)
  → portfolio builds that exact tag and deploys production automatically. Sender setup is in
  `../deploy-and-rollback.md`; both repos' workflows must be merged and its token provisioned.
- `workflow_dispatch` input `galaxy_tag` (empty = latest) or local `GALAXY_TAG=vX.Y.Z`
  selects a published release for this deploy only (rollback). No manifest edit or persistent pin.
- Every build logs and serves the resolved tag (`/assembly.json`, `/galaxy/version.json`) and
  records it in the GitHub job summary. Missing releases fail; no cached-release fallback.
- All production triggers share one serial queue; newest pending wins, active deploys finish.

**At the fair (local, no CI round-trip):** `portfolio/scripts/deploy-local` builds the portfolio,
takes the galaxy build from the local `galaxy` checkout (or a selected published release via
`--release` / `--galaxy-tag`), deploys a preview channel, and promotes to live only on confirmation. Used by the assistant's fix pipeline (04, 05).

## Orbital model (deterministic)

- Two-body Keplerian orbits around a host star. Position = f(orbital elements, t). Every screen
  computes the same positions from the same data without frame sync; the timelapse is exact.
- Launch: swipe vector → initial velocity at the launch point → orbital elements analytically.
  - Specific energy ≥ 0 (escape) **or** periapsis inside the star → convert to a **comet**: a closed,
    highly eccentric ellipse (so it always returns). Never lost, never destroyed.
  - Clamp inclination/eccentricity ranges so orbits read well on screen.
- No collisions; overlapping orbits get small inclination offsets.
- Host stars: v0.2 uses the central star only (D4). From v0.3, visitor-created stars are placed
  outward (spiral-arm layout) and become hosts; the create flow picks a host (default: the
  least crowded star). Moons orbit a planet (D6).
- All maths in `packages/shared`, unit-tested.

## Rendering & performance

- Instanced meshes, LOD by distance, shared shader programs, bloom post-processing.
- Target: 500 objects at 60 fps on the booth laptop (report the real number if hardware can't).
- Phones render only their own object's preview (light).

## Language & theme

- **English default everywhere**; Spanish via a visible toggle. Galaxy app: language toggle persisted
  in `localStorage` (try/catch), `?lang=es` supported. Portfolio: `/` and `/es/`. Russian later (D11).
- Light/dark applies to all UI chrome (phone panels, portfolio pages, overlays). The galaxy scene is
  always dark (D10).
- Design per `C:\My Files\AKLabs\CASPIAN\governance\DESIGN-DOCTRINE.md`.

## Shared header across repos

Galaxy pages render a compact portfolio header (name, links to portfolio, socials) built from the
same-origin `/profile.json` and `/tokens.css` published by the portfolio, so profile data has one
source of truth.

## Alpha.2 P2 packaging decision — 2026-10-25

Operator decision (2026-10-24): ship proto3's plain ES modules and registry-pinned three@0.170.0
through Vite at /little-galaxy/. React views are retired. The galaxy repository keeps its CI,
rules/emulator tests, stand, version/privacy gates and exact-tag release artifact. Portfolio
assembly keeps the `galaxy` release key/artifact name and adds an explicit `little-galaxy` mount.
Printed /galaxy paths redirect to the new root; the old screen redirects to the new screen.
The prototype's fonts/identity ship locally. Google admin precedes player account/invite UI;
shared play remains gentle. Preview and real-phone acceptance are still required before release.
