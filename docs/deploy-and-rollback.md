# Deploy and rollback

Runbook section for the fair; it feeds `docs/RUNBOOK.md` in the galaxy repo (G v1.0.0). Local
commands are Node scripts using the pinned `firebase-tools` and the Hosting REST API. Neither is
run by CI. Both take `--dry-run`, which prints every action and makes no network call.

## Automatic production updates and PR previews

`games.json` selects `latest`, with no standing galaxy version pin. The complete path is:
**galaxy merge → tag → GitHub Release → portfolio repository dispatch → checks → production**.
The galaxy release workflow sends `event_type: galaxy-release` with `client_payload.tag`
**after** release publication succeeds. Portfolio validates that `client_payload.tag` is a valid,
nonempty release tag (failing closed if absent or invalid), builds the site with exactly that published galaxy tag
(`client_payload.tag`), executes full download, checksum verification, assembly, privacy gate, site
checks and browser tests, verifies release freshness (newest published wins), and deploys to production Hosting. Merge the receiver workflow into
portfolio's default branch before enabling the sender.

Sender setup (captain: separate change to `little-galaxy`): after the release publication step,
use a GitHub App token or fine-grained token with access to private `portfolio` and repository
Contents: write, stored as `PORTFOLIO_DISPATCH_TOKEN` in galaxy. The galaxy repository's default
`GITHUB_TOKEN` cannot access another private repository. Example step:

```yaml
- name: Redeploy portfolio after galaxy publication
  env:
    GH_TOKEN: ${{ secrets.PORTFOLIO_DISPATCH_TOKEN }}
  run: |
    jq -n --arg tag "$GITHUB_REF_NAME" '{event_type:"galaxy-release",client_payload:{tag:$tag}}' |
      gh api --method POST repos/alexanderkholodov1/portfolio/dispatches --input -
```

Portfolio builds PRs with latest Galaxy and deploys same-repository PR previews. Open the preview
and verify changes before merging; fork PRs run checks without uploading. Production runs serialize
under one shared concurrency group (`production-deploy`) with cancel-in-progress false to prevent
overlapping live writes. A release freshness check immediately before production deployment enforces
that newest published wins: every automatic production run (main pushes and release dispatches)
re-resolves the latest published galaxy release; if a newer release has been published, an older or
delayed automatic build skips deployment to prevent regressing production (reverse arrival or stale main
overwrites). Manual rollback via `workflow_dispatch` remains an explicit operator override. PR previews
keep independent, cancellable per-PR queues. Active Hosting writes finish rather than being interrupted.

Each build resolves one concrete published tag via GitHub's API (authenticated with `GITHUB_TOKEN`
when present), downloads `galaxy-dist-<tag>.tar.gz`, `SHA256SUMS` and `version.json`, and verifies
every checksum, archive path, metadata/base path and privacy check. Release lookup or download
failure fails CI; there is no fallback to an old version. Build logs, `/assembly.json`,
`/galaxy/version.json` and the GitHub job summary identify the served release.

## Roll back a galaxy release from GitHub

Actions → **Portfolio checks and Hosting** (CI, `.github/workflows/ci.yml`) → **Run workflow** →
select **main** → set **galaxy_tag** to a published tag such as `v1.0.1` → Run workflow.
Leave `galaxy_tag` empty to deploy latest. Invalid or missing releases fail before Hosting.
The tag overrides **this deployment only**. No commit or manifest edit is needed; the next
normal build/release dispatch follows latest again. If a release is bad, fix and publish a new
release before relying on automatic deploys; a rollback does not pause release following.
Manual runs on other branches check/build but cannot deploy production.

References: [GitHub Releases API](https://docs.github.com/en/rest/releases/releases#get-the-latest-release),
[repository dispatch](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event),
[workflow concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).

## Credentials

Only `GOOGLE_APPLICATION_CREDENTIALS`, pointing at a service-account file **outside the repository**
or under git-ignored `private/`. The scripts refuse any other location inside the repo and never
open, print or copy the file.

## Deploy: `pnpm run deploy-local`

Published release mode uses the same preview, browser smoke and immutable-version promotion:

```sh
pnpm run deploy-local --release                       # latest published release
GALAXY_TAG=v1.0.1 pnpm run deploy-local                # one-deploy rollback override
pnpm run rollback --galaxy-tag v1.0.1                 # equivalent known-good release path
pnpm run rollback --galaxy-tag v1.0.1 --dry-run        # inspect without any external effect
```

Release mode skips the local galaxy build and downloads the verified published release.
`--galaxy-tag` also selects release mode. It cannot be mixed with local input flags.
Both uploads and promotion retain their existing separate confirmations and smoke checks.
For non-interactive tagged rollback, supply `--yes-preview --yes` explicitly.
Without release mode, local source rehearsal remains available:

```sh
export GOOGLE_APPLICATION_CREDENTIALS=/path/outside/repo/key.json
export VITE_FIREBASE_API_KEY=<public web key>        # needed by the galaxy build and the privacy gate
pnpm run deploy-local --dry-run                      # read the plan first
pnpm run deploy-local                                # build, preview, smoke check, then ask
```

Steps, in order, stopping at the first failure:

1. Non-interactive runs without `--yes-preview` stop here, before anything is built or uploaded.
2. `pnpm run build:site` (Astro build + privacy gate).
3. Galaxy (local mode): `pnpm run build` in the local galaxy checkout, then its output directory is assembled as
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
| `--release` | download latest published release, skipping local galaxy build |
| `--galaxy-tag <vX.Y.Z>` | download a specific published release for this deploy only; also `$GALAXY_TAG` |
| `--galaxy <dir>` | galaxy checkout (default `$GALAXY_DIR`, else `../little-galaxy`) |
| `--galaxy-dist <dir>` | build output inside the checkout (default `apps/web/dist`) |
| `--skip-galaxy-build` | assemble the existing build output without rebuilding |
| `--artifact-dir <dir>` | use explicit local release files instead (latest is resolved from their version.json, or set `GALAXY_TAG`) (default `$GAMES_ARTIFACT_DIR`); labelled `local-rehearsal` |
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

Previous-Hosting-release rollback restores the whole site without rebuilding. Tagged rollback
(`--galaxy-tag`) rebuilds the portfolio with a specific published galaxy release through the preview
path above. Neither creates a permanent pin: the next normal CI build follows latest again.

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
