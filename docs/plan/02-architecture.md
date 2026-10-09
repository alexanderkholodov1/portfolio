# Portfolio architecture and project hosting contract

## Ownership

Portfolio owns personal content, navigation, identity tokens, project catalog, artifact assembly
and production Hosting. Each project owns its source, product decisions, data and releases in
its own repository. Hosting a game does not make its design or backend part of this repository.

Current hosting baseline: Firebase Hosting at `alexanderkholodov.web.app`. The intended game URL
is a path under that origin, `/<game-name>`. Final naming/path are pending the game's design
session; `/galaxy` is only an earlier prototype example. No hostname or public name is reserved.

## Portfolio foundation

- Astro static output, TypeScript, content/data files and reusable layouts.
- English routes at `/`, Spanish at `/es/`; accessible light/dark themes.
- Home, Projects, About and Links, driven by real supplied/verified content. Do not publish
  empty sections, invented biography or placeholder project claims.
- A project catalog that can link to independent projects with different visual identities.
- Public `/profile.json` and `/tokens.css` as a versioned integration contract. Personal data
  published here must be intended for publication; game render data does not belong here.
- Lightweight, progressively enhanced UI. Avoid loading the game's 3D runtime on profile pages.

## Artifact contract

The external project's release supplies a static build, version metadata and checksum. Portfolio's
manifest pins project version, repository and configured mount path. A game base path must match
the manifest; final route selection must not require rewriting game logic.

Assembly downloads only pinned artifacts, validates version/checksum and extraction paths,
rejects traversal outside the destination and fails on missing or incompatible inputs. Each
project has an isolated output directory. Identity/token contract versions are explicit, and
standalone project previews supply compatible public fixtures rather than depending on missing
portfolio root files.

Galaxy is the first consumer. Its internal layout, rules, simulation and interaction decisions
are defined in its own [architecture](../../../galaxy/docs/plan/02-architecture.md).

## Deployment and recovery

- Portfolio is the only production Hosting deployer under the current architecture.
- A portfolio PR builds the site and assembles pinned projects into a preview.
- Production publication follows approved repository workflow and verified integration checks.
- Configure project rewrites before the site's 404 fallback; verify direct deep-link entry and
  reloads. The fair QR links to the game entry, never through the profile or project-detail page.
- Use versioned assets and appropriate cache policies, check clients across a release, preserve
  required old assets where needed, and provide a tested rollback path.
- Reverting a project pin is the normal CI rollback. The portfolio must preserve unrelated
  projects when publishing an update to one project.
- Security-rule deployments belong to the owning data project, not a routine portfolio deploy.

Cloud access remains unverified. Preview/production verification is distinct from a successful
local build. Refer to [hosting sources](09-sources.md) before finalizing implementation details.
