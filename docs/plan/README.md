# Portfolio plan of record

This repository owns Alexander's personal portfolio, its content and visual identity, and the
production assembly/hosting of independent projects. It is not the Galaxy game repository.
The portfolio will present many projects; Galaxy is one of them.

**M0 recorded on 2026-10-09:** the operator authorized corrected planning and separate commits.
Priority is **galaxy first, portfolio second**. Implementation starts at a later M1 step; M0 is
documentation only. Work is organized by outcomes, without assigning calendar days.

| Document | Purpose |
| --- | --- |
| [10-construction-proposal.md](10-construction-proposal.md) | Portfolio M0 scope and next foundation boundary |
| [02-architecture.md](02-architecture.md) | Portfolio architecture and external-project integration contract |
| [06-roadmap.md](06-roadmap.md) | Portfolio-only milestones and acceptance evidence |
| [07-operator-checklist.md](07-operator-checklist.md) | Portfolio content/access dependencies |
| [08-decisions.md](08-decisions.md) | Confirmed decisions and genuinely open design questions |
| [09-sources.md](09-sources.md) | Hosting references to verify at implementation |
| [90-idea-backlog.md](90-idea-backlog.md) | Optional, non-exhaustive portfolio ideas |
| [CHANGELOG.md](CHANGELOG.md) | Planning history |

The game's authoritative plan is now in the separate repository:
[Galaxy plan](../../../galaxy/docs/plan/README.md). Game-specific files were moved there in M0,
not duplicated here. Relative sibling links assume the two local checkouts share a parent; the
corresponding repository is [alexanderkholodov1/galaxy](https://github.com/alexanderkholodov1/galaxy).

The original [WAR-COUNCIL.md](../../WAR-COUNCIL.md) remains a historical portfolio dossier.
Current operator instructions and 08 take precedence over its old answers, dates and approval text.

## Change policy

Apply direct operator corrections and log them. Implementation-level improvements can be made
with a reason recorded. Propose material product, architecture or security changes before
implementing them unless the operator already instructed the change. Open visual ideas are not
decisions and must not be treated as a closed feature list.

No current assistant work belongs in either project's milestones. No game flow may require a
profile visit: the fair QR opens the game directly. The game's final name/path remain undecided.

## Verified state

Both repositories exist with history and configured Git author identities. They contain planning,
not application code. Logos are present in this repository's ignored `private/logos/` directory.
Cloud configuration, remote push access and CI secrets have not been verified during M0.
