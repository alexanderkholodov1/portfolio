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

1. `pnpm run build:site` (Astro build + privacy gate).
2. Galaxy: `pnpm run build` in the local galaxy checkout, then its output directory is assembled as
   `dist/galaxy` with the same validation and privacy gate as `scripts/assemble-games.mjs`.
   `dist/assembly.json` records `source: "local-build"`, so CI's Hosting input guard rejects it.
3. Privacy gate over the whole `dist/`.
4. `firebase hosting:channel:deploy <channel> --expires 1d --json` on project `alexanderkholodov`
   (channels never touch live). The preview URL is printed.
5. Smoke check against the preview: HTTP 200 for `/`, `/es/`, `/links/`, `/galaxy/`,
   `/galaxy/version.json`, and the version in `version.json` equals the assembled galaxy version.
   A failed check **never** promotes, with or without `--yes`.
6. Promotion: type `promote` (or pass `--yes`). It runs
   `firebase hosting:clone alexanderkholodov:<channel> alexanderkholodov:live`, which copies the
   tested preview version to live, so live is byte-identical to what was checked. Then the same smoke
   check runs against `https://alexanderkholodov.web.app`.

| Flag | Meaning |
|---|---|
| `--galaxy <dir>` | galaxy checkout (default `$GALAXY_DIR`, else `../little-galaxy`) |
| `--galaxy-dist <dir>` | build output inside the checkout (default `apps/web/dist`) |
| `--skip-galaxy-build` | assemble the existing build output without rebuilding |
| `--artifact-dir <dir>` | use the pinned release artifact files instead (default `$GAMES_ARTIFACT_DIR`); labelled `local-rehearsal` |
| `--channel <id>` | preview channel (default `local-<yyyymmddhhmm>`; `live` is refused) |
| `--expires <12h\|2d>` | channel lifetime (default `1d`, CLI maximum 30d) |
| `--no-smoke` | skip the smoke checks |
| `--yes` | promote without typing; still blocked by a failed smoke check |
| `--dry-run` | print the plan only |

The galaxy must be built with base `/galaxy/`; assembly rejects HTML that does not use it.

## Rollback: `pnpm run rollback`

```sh
pnpm run rollback --dry-run
pnpm run rollback            # shows live and previous versions, asks for the word "rollback"
pnpm run rollback --yes      # no prompt
```

It lists the live channel's releases (`GET .../sites/alexanderkholodov/channels/live/releases`,
newest first), picks the newest finalized release whose version differs from the one live now, shows
both, and on confirmation creates a new live release for the previous version (`POST
.../channels/live/releases?versionName=<previous version>`). That is the same call the Firebase
console's Rollback button makes; the Firebase CLI has no rollback command. Rollback is atomic and
does not rebuild anything.

Rollback restores the site only. For the CI path, **revert the `games.json` pin** (git revert the
commit that bumped it) and merge, otherwise the next `main` deploy ships the bad game again.

If Hosting no longer keeps the previous version (version retention is finite), the script fails with
"No previous release to roll back to"; use the console or redeploy a known-good build.

## Fair-day use

Rehearse `--dry-run` and one full preview before the fair. Never deploy rules with these scripts;
rules deploys are separate and operator-confirmed.
