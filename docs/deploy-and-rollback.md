# Deploy and rollback (local)

Runbook section for the fair; it feeds `docs/RUNBOOK.md` in the galaxy repo (G v1.0.0). Both
commands are Node scripts using the pinned `firebase-tools` and the Hosting REST API. Neither is
run by CI. Both take `--dry-run`, which prints every action and makes no network call.

## Credentials

Only `GOOGLE_APPLICATION_CREDENTIALS`, pointing at a service-account file **outside the repository**
or under git-ignored `private/`. The scripts refuse any other location inside the repo and never
open, print or copy the file.

## Deploy: `pnpm run deploy-local`

```sh
export GOOGLE_APPLICATION_CREDENTIALS=/path/outside/repo/key.json
export VITE_FIREBASE_API_KEY=<public web key>        # needed by the galaxy build and the privacy gate
pnpm run deploy-local --dry-run                      # read the plan first
pnpm run deploy-local                                # build, preview, smoke check, then ask
```

Steps, in order, stopping at the first failure:

1. Non-interactive runs without `--yes-preview` stop here, before anything is built or uploaded.
2. `pnpm run build:site` (Astro build + privacy gate).
3. Galaxy: `pnpm run build` in the local galaxy checkout, then its output directory is assembled as
   `dist/galaxy` with the same validation and privacy gate as `scripts/assemble-games.mjs`.
   `dist/assembly.json` records `source: "local-build"`, so CI's Hosting input guard rejects it.
4. Privacy gate over the whole `dist/`. Headless Chromium is started, so a missing browser stops the
   run before the first upload.
5. **Preview confirmation.** Type `preview` (or pass `--yes-preview`). Declining makes no Hosting
   call at all. `--yes` never authorizes the preview.
6. `firebase hosting:channel:deploy <channel> --expires 1d --json` on project `alexanderkholodov`
   (channels never touch live). The immutable Hosting **version ID** is read from the JSON result.
   Default channel names are `local-<yyyymmddhhmmss>-<random>`, unique per run.
7. The channel is read back (`GET .../channels/<channel>`) and must serve that version ID, before and
   after the smoke test. A different version means another run deployed to the channel; nothing is
   promoted.
8. Browser smoke on the preview (Playwright, Chromium, 375px): `/`, `/es/`, `/links/` render with no
   console errors, runtime errors, failed same-origin requests or HTTP errors; `/galaxy/`,
   `/galaxy/screen`, `/galaxy/create` boot (`#root` gets content, no runtime error, no chunk-load
   failure, no failed same-origin asset); `/galaxy/version.json` equals the assembled galaxy's
   `version` **and** `commit`. A failed smoke **never** promotes, with or without `--yes`.
9. **Promotion confirmation.** Type `promote` (or pass `--yes`).
10. `firebase hosting:clone alexanderkholodov@<version ID> alexanderkholodov:live`. The source is the
    version ID, not the channel, so whatever the channel serves at that moment cannot reach live. The
    live channel is then read back and the same browser smoke runs against
    `https://alexanderkholodov.web.app`; a failure sets a non-zero exit code (use `pnpm run rollback`).

| Flag | Meaning |
|---|---|
| `--galaxy <dir>` | galaxy checkout (default `$GALAXY_DIR`, else `../little-galaxy`) |
| `--galaxy-dist <dir>` | build output inside the checkout (default `apps/web/dist`) |
| `--skip-galaxy-build` | assemble the existing build output without rebuilding |
| `--artifact-dir <dir>` | use the pinned release artifact files instead (default `$GAMES_ARTIFACT_DIR`); labelled `local-rehearsal` |
| `--channel <id>` | preview channel (default unique `local-...`; `live` is refused) |
| `--expires <12h\|2d>` | channel lifetime (default `1d`, CLI maximum 30d) |
| `--yes-preview` | authorize the preview upload without typing |
| `--yes` | authorize promotion without typing; still blocked by a failed smoke test |
| `--no-smoke` | preview-only diagnostics: skips the browser and **makes promotion impossible**; refused together with `--yes` |
| `--dry-run` | print the plan only |

Boolean flags are presence-only. `--yes=false`, `--yes=0` or `--yes false` are errors, never a
silent "off" or "on". Unknown flags and stray arguments are errors.

The galaxy must be built with base `/galaxy/`; assembly rejects HTML that does not use it.

## Rollback: `pnpm run rollback`

```sh
pnpm run rollback --dry-run
pnpm run rollback            # shows live and previous versions, asks for the word "rollback"
pnpm run rollback --yes      # no prompt
```

It reads the live channel's authoritative current release (`GET .../channels/live`, field
`release`), then every page of `GET .../channels/live/releases` (the API documents no ordering, so
none is assumed). Candidates are ordered by validated `releaseTime`; the previous release is the newest
other version that is `FINALIZED`, not a `SITE_DISABLE` release, and not newer than the current one.
Repeated, deleted, expired and unparseable entries are skipped. It shows both versions and, on
confirmation, re-reads the live release and the target version; if live changed or the target is no
longer finalized it stops without writing. Only then it creates a new live release (`POST
.../channels/live/releases?versionName=<previous version>`), the same call the Firebase console's
Rollback button makes; the Firebase CLI has no rollback command. Rollback is atomic and does not
rebuild anything. `--yes` is presence-only (see above). Sources: `docs/plan/09-sources.md`.

Rollback restores the site only. For the CI path, **revert the `games.json` pin** (git revert the
commit that bumped it) and merge, otherwise the next `main` deploy ships the bad game again.

If Hosting no longer keeps the previous version (version retention is finite), the script fails with
"No previous release to roll back to"; use the console or redeploy a known-good build.

## Fair-day use

Rehearse `--dry-run` and one full preview before the fair. Never deploy rules with these scripts;
rules deploys are separate and operator-confirmed.

## Known dependency advisories (dev-only)

`pnpm audit` reports three advisories, all through `firebase-tools` (a development tool; none of it is
in the visitor bundle or in `dist/`). Checked 2026-10-22:

| Package | Path | Patched | Why no override |
|---|---|---|---|
| `braces@3.0.3` (high, nested brace patterns) | `firebase-tools > chokidar` | `>=3.0.4`, not published to npm (latest is 3.0.3) | nothing to upgrade to |
| `uuid@9.0.1` (moderate, buffer bounds in some functions) | `firebase-tools > gaxios` (and `google-auth-library > gaxios`) | `>=11.1.1` | semver-major jump from `gaxios@6`'s `^9` range; not applied |
| `@opentelemetry/core@1.30.1` (moderate, unbounded W3C baggage) | `firebase-tools > @google-cloud/pubsub` | `>=2.8.0` | semver-major jump; not applied |

Reachability: the scripts run only `hosting:channel:deploy` and `hosting:clone`. No watcher is started
(chokidar and `braces` only run for emulators/serve), the glob patterns come from the checked-in
`firebase.json`, never from input. `gaxios@6.7.1` calls `uuid.v4()` without a buffer argument (only for
multipart boundaries), outside the affected functions. The Pub/Sub tracing path is not used by Hosting
commands and no inbound `baggage` header is ever parsed. Update plan: re-run `pnpm audit` whenever
`firebase-tools` is bumped and drop this section when a release with patched ranges exists (firebase-tools
15.34.1 itself overrides `uuid` and `@opentelemetry/core` for its own package, which pnpm does not apply to
dependents).
