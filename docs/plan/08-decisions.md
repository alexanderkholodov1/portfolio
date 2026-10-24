# 08 — Decision log

## Decided (by the operator in planning, 2026-10-04/05)

| Topic | Decision |
|---|---|
| Project for BAD | Collective Galaxy, as an event inside the portfolio |
| Concept | Empty solar system grown by visitors; BAD is one project among many (operator is not the sun) |
| Repos | Two repos: `galaxy` (game) and `portfolio` (site + assembly + only production deployer) |
| Firebase | Portfolio project `alexanderkholodov` = Hosting only; separate data project for game data |
| URL | `alexanderkholodov.web.app/galaxy` (same Hosting site) |
| Language | English primary everywhere (URLs, UI, defaults); Spanish secondary |
| Objects | One active object per person, editable all day; new launch crumbles previous into hangar; relaunch reassembles |
| Failed launch | Becomes a comet; never destroyed |
| Global interactions | Shake (aurora/nebula) any time; comets; shooting stars with **predefined** messages only |
| Events | Meteor shower as ambient random event; no eclipse / chorus / star-birth events |
| Sound | Subtle per-object unique fingerprint from parameters; petting with tender animation + small sound |
| Memory | Timelapse viewable for years; permanent object pages; postcard; season freeze |
| Rejected | Life seeding, free text, camera counting, lapel mic, QR cards, MunHub seed, "say it and it appears", competitive minigame (see 01) |
| Assistant | Companion with dry + Wheatley-ish personality; voice via phones; owner/public separation; N0–N3 levels; near-full laptop control; workspace folder; no access to Google accounts/phone contacts; live fixes with verification + rollback |
| Live deploys | Promotion to production must survive whatever screen/phones are doing |
| Deadline | Everything done by 2026-10-21 |
| Milestone scheduling (operator, 2026-10-14) | Clear versioned milestones, scope, acceptance and priority; no intermediate schedule dates; retain only the final delivery date |
| Assistant cost (operator, 2026-10-14) | Strictly free only; nothing paid or able to silently become paid. Anthropic API key not allowed. Cut G v0.8.0 first if no strictly free brain is viable |
| Data project (operator confirmed) | `little-galaxy` created with Firestore, Authentication and a registered web app; service-account key in the galaxy checkout's git-ignored `private/` |
| Objective (operator, 2026-10-22) | "todo el juego y todo lo planificado listo" for 2026-10-23: the roadmap from G v0.1.0 to G v1.0.0 and P v0.1.0 to P v1.0.0, in its order and priority; the cut order decides what shrinks first if time or quota runs short |
| Assistant out of Be A Dragon (operator, 2026-10-22) | "ni hagamos NADA del asistente como parte del galaxy, sino como mas bien parte del CASPIAN ALGUN DIA (no lo elimines ciegamente, pero que los agentes ni se preocupen de hacer un asistente)". G v0.8.0 is not built and work that only serves the assistant (the G v0.5.0 voice spike) is skipped. Its plan text stays, marked deferred to CASPIAN |
| Merges (operator, 2026-10-22) | "Me avisas cuando este LISTO, y voy a mergearlo". The operator merges every pull request himself. A pull request is opened only when it is ready to merge: verified locally, reviewed, remote CI green |
| Portfolio content (operator, 2026-10-22) | P3 content will come from the operator's own posts, which he is collecting. Until their location is given, P v0.2.0 content stays as visible TODOs and everything else is built |
| D6 moons (captain, 2026-10-22, implementing the operator’s D6) | Moons may orbit own or unclaimed planets, never another visitor’s planet. A hangared planet remains visible in its original orbit while hosting an active moon; status stays `hangar`, ownership is unchanged, and it does not count as a creator or active object |

## Operator decisions (2026-10-23)

### Versioning: v1.0.0-alpha.N
Operator decision (2026-10-23): "para que sea 1.0.0 debe ser PERFECTA E IMPECABLE"
Milestones leading up to the final fair delivery use alpha iterations (`v1.0.0-alpha.N`). Releases published on GitHub are pre-releases until the final release is accepted. Release resolution must include pre-releases and order by publication time so that `v1.0.0-alpha.N` is selected over older semver tags (`v1.0.1`, `v1.0.0`).

### Deploy chain: option b (agent branch/preview testing, operator merges final)
Operator decision (2026-10-23, option b): "que los agentes 'prueben' la produccion en su rama de trabajo o links temporales, y yo quiero ver solo la final-final-final que desplegare haciendo el PR."
Option b governs production deployment:
- Agents test production candidates exclusively in their working branch or on ephemeral preview links (PR preview channels).
- Only the operator's merge / approved release deploy reaches production Hosting.
- No version pin in `games.json` that requires a PR; `games.json` selects `latest` (`alexanderkholodov1/little-galaxy`).
- Pushes to `main` build with the most recently published Galaxy release (by publication timestamp, pre-releases included).
- The Galaxy release workflow sends `repository_dispatch` (event `galaxy-release`, `client_payload.tag` = the exact tag); portfolio builds and verifies that exact tag and deploys production.

### Architecture: the sky in three layers ("las tres cosas")
Operator decision (2026-10-23): "las tres cosas"
The runtime architecture operates across three synchronized layers:
1. Firebase-only for everyone (phones, visitors, public web hosting and Firestore data).
2. A stand on Beacon (booth screen / physical exhibit display).
3. The laptop as backup (local stand/server runtime ready to take over if connectivity or external hosting fails).

### Prototypes first: visual craft and interactivity
Operator decision (2026-10-23): Prototypes first exploring visual craft and feel: liquid glass, passive and active interactivity, "No se debe ver como IA".
Design must feel human-crafted, tactile, and intentional; machine-default or generic AI aesthetics are strictly defects.

### Release following and rollback
Operator decision (2026-10-23): "NO, NO FIJEMOS NADA, DEBEMOS PODER PROBARLO Y ACTUALIZAR SIN QUE HAYA NINGUN PROBLEMA, HASTA LA FERIA Y DURANTE LA FERIA TAMBIEN!"

Operator decision (2026-10-23): "Apruebo tu plan de eliminacion de la version y que se haga todo desarrollo futuro flexible y con rollback tambien"

`games.json` follows `latest`; no standing galaxy pin, before or during the fair.
Each build resolves the latest published release through GitHub's API, verifies the release
archive and metadata, and records its concrete tag in `dist/assembly.json`,
`dist/galaxy/version.json`, build logs and the GitHub job summary. Missing releases fail the build.
Galaxy release publication sends `repository_dispatch: galaxy-release` to portfolio with
`client_payload.tag`. Portfolio builds and deploys that exact tag on main.
Manual `galaxy_tag` / local `GALAXY_TAG` selects a known-good published release for that deploy
only, with the same integrity checks. Later automatic deploys follow latest again.
PR previews remain the place to test changes before production. Production deploys serialize
under one shared concurrency group (`production-deploy`) with cancel-in-progress false to prevent
overlapping live writes. Immediately before the deploy step, every automatic production run (main
pushes and release dispatches) re-resolves the newest published galaxy release and refuses to deploy
if an older release is about to be deployed (newest published wins, preventing stale automatic
overwrites or reverse-arrival regressions). Manual rollback via workflow_dispatch remains an
explicit operator override. PR previews keep independent, cancellable per-PR queues. Local preview,
smoke, promotion and previous-Hosting-release rollback remain available. See `../deploy-and-rollback.md`
for commands and sender setup.

## Pending — proceed with the default unless the operator overrides

| # | Question | Default |
|---|---|---|
| D1 | Fair date / schedule | Assume on or after 2026-10-21; complete v1.0.0 and rehearsal before final delivery |
| D2 | Assistant brain | Claude Agent SDK + Claude Code headless for fixes; CASPIAN later |
| D4 | Galaxy start | Starts with a central star (otherwise nothing can orbit) |
| D5 | Object names | Generated combinations (EN/ES), no free text |
| D5b | Crumble rocks | Fade after ~2 min |
| D7 | Humming as individual interaction | Out of scope for the 21st |
| D8 | Speech-to-text | Local Whisper if the laptop can do it within latency target; else a verified strictly free alternative, with no silent paid fallback |
| D9 | Audio output | TV/monitor speakers |
| D10 | Theme | Light/dark for UI; galaxy scene always dark |
| D11 | Phone language | Opens in English with a visible Spanish toggle; Russian later |
| D12 | Post-fair interactivity ("Season 2") | Decide after the fair |
| D13 | Assistant name | Config constant until chosen (candidates: Bólido, Kepler, Perihelio, Satélite) |
| D14 | Data project name | Operator chooses (suggestion `collective-galaxy`) |

Superseded (2026-10-14): D2 — the operator requires a strictly free brain; nothing paid or able to silently become paid is allowed. The Anthropic API key requirement is not allowed; cut G v0.8.0 first if no strictly free brain is viable.

Superseded (2026-10-15): D14 — the operator confirmed the data project is `little-galaxy`; no naming decision remains.
