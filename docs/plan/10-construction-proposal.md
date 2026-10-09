# Portfolio construction plan — M0

Status: **M0 authorized with operator corrections on 2026-10-09; documentation and commit only.**

## Purpose and boundaries

Build Alexander's personal portfolio as a durable place for his profile, work and public links.
It will present many independent projects, starting with the game currently named Galaxy.
The portfolio owns content, identity, project discovery and production assembly/hosting.
The game owns its own planning, source, design and backend.

Priority is galaxy first, portfolio second. The fair QR goes directly to the game. A visitor
does not need to browse Alexander's profile to participate. Portfolio discovery is an additional
entry route for people arriving independently of the fair.

The intended game location is `alexanderkholodov.web.app/<game-name>`; naming and the exact
path are pending the game's dedicated design session. Do not reserve a domain, fix the game
brand or hard-code `/galaxy` as the final public route during M0.

## Foundation after M0

Use Astro, TypeScript, static content/data and reusable layouts. Establish EN/ES routes,
light/dark, accessible navigation, responsive behavior and a schema for actual profile/project
content. Build the public profile/token contract and the independent-project artifact assembly
described in [02-architecture.md](02-architecture.md).

The first shell must be useful for validating structure and integration, while clearly remaining
a development foundation. Missing content is an editorial task, not permission to invent text
or publish broken links. Game libraries must not become a dependency of ordinary profile pages.

## Tentative visual references

The operator likes modern liquid glass. Supplied references are an AK monogram, a circular
variation and an AKLABS wordmark. Deep blue/cyan with restrained red accents is a candidate
direction, not an approved palette or final game identity.

Keep translucent controls readable, bound the blurred area, provide opaque fallbacks and test
light/dark. Navigation and contact links must remain easy to use on small screens and keyboards.
Choose final typography, composition and animation with the operator in a dedicated session.

The referenced CASPIAN design doctrine was absent at the checked local paths. Current operator
instructions provide the preparation brief; record any later supplied design material.

## Public assets and privacy

Logo references are currently inside ignored `private/logos/`. At implementation, curate only
those user-authorized public logo derivatives into a public brand directory with an explicit
allowlist/provenance record. Never import/copy `private/` as a directory. Build gates must reject
key material, credentials, env files and other private content. No assets are moved or published
as part of M0.

## Acceptance and next boundary

M0 is complete when ownership, current decisions, integration responsibilities and the portfolio
roadmap agree and are committed in this repository. The game plan lives in
[its own repository](../../../galaxy/docs/plan/README.md).

Future P M1 evidence includes a reproducible build, working local assembled routes, responsive
language/theme foundations, the privacy gate, and a preview once external access is verified.
Final visuals and content remain reviewable before extending the site. The assistant has no
work package, dependency or milestone.

See [06-roadmap.md](06-roadmap.md) for the portfolio-only sequence and
[07-operator-checklist.md](07-operator-checklist.md) for external dependencies. The operator owns
the calendar; this plan assigns no work to specific days.
