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

## Pending — proceed with the default unless the operator overrides

| # | Question | Default |
|---|---|---|
| D1 | Fair date / schedule | Assume on or after 2026-10-21; complete v1.0.0 and rehearsal before final delivery |
| D2 | Assistant brain | Claude Agent SDK + Claude Code headless for fixes; CASPIAN later |
| D4 | Galaxy start | Starts with a central star (otherwise nothing can orbit) |
| D5 | Object names | Generated combinations (EN/ES), no free text |
| D5b | Crumble rocks | Fade after ~2 min |
| D6 | Moons | Allowed around your own planet or unclaimed planets; not on other people's planets |
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
