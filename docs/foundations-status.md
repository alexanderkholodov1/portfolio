# P v0.1.0 local foundation status

P v0.1.0 is implemented locally on `v0.1.0-foundations`. Release acceptance is
blocked: no GitHub Release was retrieved, CI was not run, and no Hosting or
Firebase call/deploy was made in the 2026-10-21/22 portfolio phase. The night
brief prohibits those actions. The roadmap acceptance remains unmet.

## Roadmap evidence

| Bullet | Local result / remaining dependency |
|---|---|
| Ignore rules and privacy build gate | Existing `.gitignore` was committed before implementation. Both build commands gate output; the full build also checks each incoming game before replacement. Negative tests cover private file copies, escaped private JSON values, key material, symlinks, archive traversal and corruption. |
| Astro shell | EN `/`, ES `/es/`, Projects, About, Links and Galaxy entry in both languages, plus 404. System theme and explicit persisted preference; storage denial is tolerated. Minimal known content, no invented biography or placeholders. Local Chromium verifies navigation, 360px width, theme and no-JS behavior. |
| Profile and tokens | `/profile.json` derives navigation and known repository links from `src/data/site.ts`. Unknown role/socials are absent. `/tokens.css` implements the Galaxy handoff tokens, light/dark and licensed self-hosted fonts. Browser integration verifies Galaxy consumes them at the same origin. |
| Manifest and assembly | `games.json` pins `alexanderkholodov1/galaxy` `v0.1.0`. Local release-shaped tarball built from Galaxy's branch output assembles successfully. Real release availability is unverified. Local source is labeled and rejected by the Hosting guard. |
| Hosting | `firebase.json` follows the plan's static-file and Galaxy rewrite model; `.firebaserc` uses the already approved project. Local config assertions pass; the harness approximates route precedence, not the actual Hosting service. |
| Actions | Prepared PR preview/main production workflow with full checks, fork deployment exclusion and upstream-source guard. P2 secret, public-key variable, real release and actual Actions/deployed URL verification remain external dependencies. |
| War council | §3 and §7 reconciled as an unsigned draft. P4 remains operator-only. |
| Acceptance | Blocked by real-config G release, P2/CI, deployed URL/theme/language checks and operator review. No milestone is marked done. |

## Implementation choices and reasons

- Use Astro static routing for English and Spanish counterparts, a tiny inline
  theme controller, and CSS system-theme fallback without JavaScript. No client
  UI framework or data-project SDK is needed for this shell.
- Use Astro 7.4.1, selected from the registry by pnpm's release-age policy; pin
  TypeScript 6.0.3 because the installed Astro checker rejects TypeScript 7.
  Lock dependencies and use Node 24 in CI to satisfy Astro's minimum version.
- Adopt the coordinated Galaxy profile schema and `--pf-*` fallback palette.
  Reuse its supplied Spectral/Archivo Narrow font files with their original OFL
  notices. This is a provisional implementation choice, not doctrine acceptance.
- Keep About sparse (the known name and navigation) and show the one scoped
  project rather than fabricate biography, projects or public social profiles.
- Put the Galaxy entry at `/projects/galaxy/` (and `/es/projects/galaxy/`), leaving
  `/galaxy/` entirely to the assembled game. Spanish entry uses `?lang=es`.
- Require explicit `GAME_DOWNLOADS=1` for release network access; local input
  overrides it without fallback. This makes offline/no-service work enforceable
  and leaves GitHub Releases as the configured production source.
- Verify archive and standalone metadata against release `SHA256SUMS`, require
  matching version metadata and mounted asset base, reject traversal/links and
  private payloads, and stage validation before replacing an existing game.
  SHA checks detect corruption; they do not independently authenticate a
  compromised upstream release or make a mutable release tag immutable.
- Retain the approved HTML/JSON `no-cache` rule and immutable asset rule. Review
  removed an unauthorized catch-all cache rule that overlapped asset caching.
  Extensionless route and mutable `/tokens.css` caching need operator review
  and verification on Hosting; the local harness cannot prove those headers.
- CI pins every third-party action to a full commit SHA, reusing the exact
  references already recorded in the Galaxy workflows. Workflow lint rejects
  moving action tags. The pins' upstream availability and behavior have not
  been contacted/verified during the no-GitHub night. Local YAML/Bash lint is
  not GitHub workflow execution or actionlint.
- The privacy gate compares private file bytes/hashes and private JSON string
  values in memory, suppressing matched values and private names. It rejects
  suspicious output paths and common key patterns. Whole-file equality covers
  even short private files; embedded non-JSON private bytes are checked from 16
  bytes upward. Arbitrary encodings/fragmentation and all possible secret types
  cannot be proven absent by this scanner.

## Operator TODOs / questions

| Item | Options | Recommendation |
|---|---|---|
| P2 CI Hosting credential | Provide a least-privilege Hosting service account as `FIREBASE_SERVICE_ACCOUNT`, or keep external deployment blocked. | Provision only Hosting access for the approved project in an authorized session; do not commit a key. |
| Real G v0.1.0 release | Supply G's real public configuration, address the later Galaxy review, then release after review; or keep the milestone blocked. | Complete that sequence in the Galaxy/fixes phases and an authorized delivery session; do not publish rehearsal bytes. |
| Public web key for portfolio gate | Set portfolio repository variable `VITE_FIREBASE_API_KEY` and the matching local process environment, or leave real-artifact builds blocked. | Use the exact public web key that was built into the pinned release; no admin credentials. |
| Role, biography, CV, social profiles and other portfolio project content | Supply approved EN/ES content/links; or retain the minimal known-content shell. | Supply via P3 before P v0.2.0; omit unknown public data now. No inferred social URL is published. |
| DESIGN-DOCTRINE | Supply the document for review, or explicitly approve this provisional visual treatment. | Supply it; do not claim doctrine compliance from unavailable text. |
| War-council P4 | Sign the updated draft, or amend §3 before signing. | Review and sign personally. No signature was inferred from implementation authorization. |
| Custom domain | Retain the approved Hosting URL, or choose/reserve a custom domain later. | Keep the existing URL for foundations; no name reservation now. |
| External verification | Authorize CI/preview/production and real-browser/device verification later, or retain blocked acceptance. | Verify the assembled real-config release through CI before accepting P/G v0.1.0. |

## Limits and uncertainty

The accessible plan is authoritative. The design doctrine was absent at its
contracted local path. The Galaxy review was read but Galaxy code was not
changed. Actual release contents/config, CI credentials/settings, action
availability, Firebase rewrite/cache behavior and deployed phones are not
verified. Chromium's local harness proves local rendering and routing only;
it is not real-device or production acceptance. Current check results and
commit hashes belong in the phase report outside the repository.
