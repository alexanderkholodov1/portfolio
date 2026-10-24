# Portfolio foundations

Astro static portfolio and the assembly host for Collective Galaxy. The plan of
record is [docs/plan/](docs/plan/README.md); local milestone evidence and open
operator questions are in [docs/foundations-status.md](docs/foundations-status.md).

Use Node >=22.23.4 (CI uses Node 24) and pnpm 11.5.2. Dependencies are locked.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
```

Local offline rehearsal, with a release-shaped directory containing
`galaxy-dist-v0.1.0.tar.gz`, `version.json` and `SHA256SUMS`:

```sh
GAMES_ARTIFACT_DIR=/absolute/path/to/release-files pnpm run check
```

Pack the Galaxy branch's built `apps/web/dist` using its release workflow:
`tar -czf galaxy-dist-v0.1.0.tar.gz -C apps/web/dist .`; copy its `version.json`
next to the archive and run `sha256sum galaxy-dist-v0.1.0.tar.gz version.json > SHA256SUMS`.
The archive root must contain `index.html`, `assets/` and `version.json`, rather
than a wrapping `dist/` directory. A synthetic-config Galaxy rehearsal remains
a rehearsal after assembly. Do not publish it.

`pnpm run build:site` builds only the portfolio and runs the privacy gate.
`pnpm run build` builds, assembles games and gates the **whole** output.
`pnpm run check` runs typechecking, lint (including workflow YAML/Bash syntax),
unit/security tests, full build, built-site/link checks and Chromium checks, in
sequence. Browser checks start a loopback-only static harness and stop it.
They block external browser requests and do not use the Firebase emulator.

`pnpm dev` and `pnpm preview` bind to loopback. The development server shows the
portfolio shell; a full build plus the static test harness is used to exercise
the assembled Galaxy and its deep routes.

In an authorized network-enabled CI run, `GAME_DOWNLOADS=1 pnpm run check`
downloads the manifest's pinned GitHub Release. There is no silent network
fallback if local files are absent. `GAMES_ARTIFACT_DIR` takes precedence, marks
`dist/assembly.json` as `local-rehearsal`, and fails CI's Hosting input guard.
The workflow never sets that local override.

For a real Galaxy artifact containing its public Firebase web key, supply the
exact `VITE_FIREBASE_API_KEY` in the process environment (GitHub repository
variable of the same name in CI). The portfolio privacy gate does not load
`.env` files. It permits only that exact web key, never service-account material.
No other Firebase config or client SDK is needed by the portfolio shell.

The workflow prepares same-repository PR previews and production on pushes to
`main`. It needs operator-provisioned `FIREBASE_SERVICE_ACCOUNT` for the approved
Hosting project `alexanderkholodov`. Fork PRs run checks without deploying.
Neither local checks nor the night phase accept a release or exercise these
external steps.

## Local deploy and rollback

`pnpm run deploy-local` builds the site and the local galaxy checkout
(`../little-galaxy`, or `--galaxy`/`GALAXY_DIR`), assembles it with the same
checks as `assemble-games`, deploys a preview channel on `alexanderkholodov`,
smoke checks it and promotes it to live only after you type `promote` (or pass
`--yes`). `pnpm run rollback` restores the previous live Hosting release. Both
need `GOOGLE_APPLICATION_CREDENTIALS` (a file outside the repo or in `private/`)
and both support `--dry-run`, which prints every action and makes no network
call. Usage, flags and the CI-path rollback are in
[docs/deploy-and-rollback.md](docs/deploy-and-rollback.md).
