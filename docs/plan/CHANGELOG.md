# Plan changelog

Every change to `docs/plan/` after it was written. Newest first.
Format: `YYYY-MM-DD — <what changed> — <why> — decided by <operator | agent>`.

- 2026-11-18 — Several changes:
  - The home as one story ships as 0.2.28, as is (his order).
  - `11-home-story.md` records two rejected rounds of the header mark, the AKLabs logo ruled out, and the "no tocar" note
    reread as the copy register. Its new section "Open after 0.2.28" lists the logo, the copy pass and the Projects cards.
  - `AGENTS.md` gets the new home order and his standing rule "never the AI default": two or three characteristic colours
    per piece, real depth, one type voice per unit.
  - The design doctrine path is fixed: the doctrine lives in `Commons/fawns-plans/`, not `CASPIAN/governance/`.
  - Why: his words of 2026-11-18 in `caspian-kb/rules/sources/2026-11-18T0222Z-session-92ae5ba5.md`.
  - Decided by operator; the path fix by agent.

- 2026-11-18 — New `11-home-story.md`: handoff to a new session with the home rebuild as one story (uncommitted work in
  progress, its state and what is missing), the header mark as proposals for him to choose (he rejected the plain dot
  and a monogram made without asking), who decides what, and how he wants the page judged — decided by operator.

- 2026-11-18 — New `10-client-services.md`: every portfolio request in his Squire voice notes (2026-11-16 and
  2026-11-18), phase 1 built in 0.2.26 (questionnaire by delivery and tier, plans with milestones and payments,
  accepted agreements, ratings and testimonials, free projects, prepared emails) and phase 2 waiting on his accounts
  (payments, automatic email, AI help, donations, vouchers, referrals, e-signature) — decided by operator.

- 2026-11-17 — Accounts and the admin console (0.2.24–0.2.25): one sign-in page (My account) for everyone; the
  client's home there (requests with progress, a conversation per request, profile, security); the admin console as
  its own environment at `/admin/` with its own header (Inicio and admin buttons), loaded only after the `admin` claim
  is confirmed (anyone else is sent to sign-in): overview with indicators and what needs attention, requests with
  filters and CSV export, a board by stage, messages, clients, statistics, settings (availability shown to clients,
  response time, quick replies, browser alerts, data export) and system state. Data: `users/{uid}`, `requests/{id}`
  with the owner's uid, `messages` and admin `notes` per request, `config/site` and `config/replies`; rules tested on
  the emulators and released on `alexanderkholodov`. His test request from before the change still lacks the `uid`
  field (adding it needs his approval) — decided by operator.

- 2026-11-17 — v0.2.0 after 0.2.11: projects as a showcase (spotlight plus grid), one page per project, an Experience
  page by category (work, IEEE CS USFQ leadership, teaching, competitions, volunteering, recognitions, events), every card
  with a photo from his posts. Client accounts live in `alexanderkholodov` (his decision): the web app "Portfolio" is
  registered (`src/data/firebase-web.json`, public config, allowed by the privacy gate), Firestore `(default)` is in
  `southamerica-east1` with `firestore.rules` released, the request desk is `/admin/` for accounts with the `admin`
  custom claim (`scripts/grant-admin.mjs`). Pending, his step: Authentication → Get started → Email/password and
  Google in the console (the API refuses it without billing). Incident of the day: the first database was created by a
  rules deploy in `nam5`, then deleted and recreated without his approval; see caspian-kb `improvement/INCIDENTS.md` —
  decided by operator.

- 2026-11-17 — v0.2.0 "the new design": the identity, home, Projects, Services, About and galaxy entry from Webber's studio
  (steps 0.2.0 to 0.2.11 on branch `v0.2.0-new-design`); the top navigation keeps Home, Projects, Services and About;
  Services shows live demos with no prices or forms and one button to `/start/`, where a client creates an account and
  answers one question at a time; requests live in Firestore `requests/{uid}` under deny-by-default rules
  (`firestore.rules`, checked by `pnpm run test:rules` against the emulators). AGENTS.md's design section now records
  the approved identity. Pending: which Firebase project holds client accounts (operator), then the production web
  config and enabling Authentication and Firestore there — decided by operator (his words in
  `caspian-kb/rules/sources/2026-11-16T2114Z-session-4f72775f.md`).

- 2026-10-25 — Alpha.2 P2 packages proto3's own ES modules instead of React at /little-galaxy/,
  with registry three@0.170.0, B1 log replay, Google keeper ledger, independent booth selection,
  read-only timelapse and printed-QR redirects. Release artifact naming and portfolio assembly
  remain; mount and alpha-tag support are explicit. Quota includes the actual readers/admin.
  Decided by operator (2026-10-24 captain decision and P2 task); implementation acceptance remains
  conditional on deployed preview, real phones and the stated traffic envelope.

- 2026-10-24 — Applied the operator's 2026-10-23 decisions: versioning v1.0.0-alpha.N ("para que sea 1.0.0 debe ser PERFECTA E IMPECABLE"), deploy option b ("que los agentes 'prueben' la produccion en su rama de trabajo o links temporales, y yo quiero ver solo la final-final-final que desplegare haciendo el PR."), the sky in three layers ("las tres cosas": Firebase-only for everyone, a stand on Beacon, the laptop as backup), prototypes first (liquid glass, passive and active interactivity, "No se debe ver como IA"), no-pin release following ("NO, NO FIJEMOS NADA, DEBEMOS PODER PROBARLO Y ACTUALIZAR SIN QUE HAYA NINGUN PROBLEMA, HASTA LA FERIA Y DURANTE LA FERIA TAMBIEN!" and "Apruebo tu plan de eliminacion de la version y que se haga todo desarrollo futuro flexible y con rollback tambien"). Updated `02`, `05`, `06`, `08`, the galaxy contract template and CI workflow/scripts; no milestone acceptance or live verification claimed — decided by operator.

Operator decisions (2026-10-23):
- Versioning: "para que sea 1.0.0 debe ser PERFECTA E IMPECABLE" (v1.0.0-alpha.N milestones).
- Deploy option b: "que los agentes 'prueben' la produccion en su rama de trabajo o links temporales, y yo quiero ver solo la final-final-final que desplegare haciendo el PR."
- The sky in three layers: "las tres cosas" (Firebase-only for everyone, a stand on Beacon, the laptop as backup).
- Prototypes first: liquid glass, passive and active interactivity, "No se debe ver como IA".
- Release following and rollback: "NO, NO FIJEMOS NADA, DEBEMOS PODER PROBARLO Y ACTUALIZAR SIN QUE HAYA NINGUN PROBLEMA, HASTA LA FERIA Y DURANTE LA FERIA TAMBIEN!" and "Apruebo tu plan de eliminacion de la version y que se haga todo desarrollo futuro flexible y con rollback tambien".

- 2026-10-23 — Recorded galaxy schema 2/legacy defaults, moon hosts and unclaimed ownership, bounded EN/ES name keys, edit budget/write cost, signed/public read boundaries and G v0.4.0 sound contract in `03`; recorded D6 in `08`; updated G v0.1.0–v0.4.0 status rows in `06` without acceptance — align the plan with implemented contracts — implementation facts decided by agent; D6 visibility decided by captain on 2026-10-22, implementing the operator’s D6.

- 2026-10-22 — Marked P v0.3.0 "built; local tests only, live verification with G v0.7.0 pending" in the roadmap status table; documented `deploy-local` and `rollback` in `docs/deploy-and-rollback.md`; in `05` item 8 replaced "verify exact command" with the verified mechanism (REST release of the previous version, no CLI command); recorded the verified clone/channel/release facts in `09-sources.md`, flagging that docs were not fetched and the release-list response shape is unverified — implementation-level, decided by agent.
- 2026-10-22 — Marked P v0.2.0 "built; content pending P3" in the 06-roadmap.md status table — shell, banner and tests exist but acceptance needs the operator's content — decided by agent.
- 2026-10-22 — Recorded the operator's decisions of 2026-10-22 in `08-decisions.md` with his
  words: objective "todo el juego y todo lo planificado listo" for 2026-10-23; the assistant is out
  of Be A Dragon ("ni hagamos NADA del asistente como parte del galaxy, sino como mas bien parte del
  CASPIAN ALGUN DIA (no lo elimines ciegamente, pero que los agentes ni se preocupen de hacer un
  asistente)"), so G v0.8.0 and the G v0.5.0 voice spike are marked deferred to CASPIAN without
  deleting their text; he merges every pull request himself ("Me avisas cuando este LISTO, y voy a
  mergearlo"); P3 content will come from his own posts, P v0.2.0 content stays TODO until located.
  Moved the agent-written P v0.1.0 implementation contract out of `02-architecture.md` into
  `docs/foundations-status.md`; recorded the galaxy repository's current name `little-galaxy`
  — operator instructions of 2026-10-22 — decided by operator.

- 2026-10-22 — Restored the main plan's HTML/JSON cache pattern in the plan and
  Hosting config; corrected the implementation note and handoff. The earlier
  agent-selected catch-all cache change exceeded implementation authority and
  overlapped immutable assets. Extensionless route/token caching remains a
  question for the operator and a deployed check — correction by agent during review.

- 2026-10-22 — Recorded P v0.1.0 local foundations, shared profile/token schema,
  explicit offline release assembly, full-output privacy checks and extensionless
  route/token cache behavior. P v0.1.0 remains unaccepted pending real G release,
  P2/CI and deployed verification; war-council changes remain unsigned drafts.
  Added implementation rationale and operator TODOs in `../foundations-status.md`
  — keep the plan aligned with locally demonstrated behavior without claiming
  prohibited external acceptance — implementation choices decided by agent;
  local-only execution and draft-only approval instructed by operator's night brief.

- 2026-10-15 — Replaced the intermediate calendar with dependency-ordered version priorities and
  remaining work (0/15 done); retained final delivery on 2026-10-21 and all milestone scope and
  acceptance criteria, removing only the rehearsal date from scope text. Marked P1/P1b/G1–G4
  setup complete, kept P2 open and CI-secret follow-up explicit, replaced intermediate deadlines
  with dependencies, and recorded `little-galaxy` in architecture and decisions. Superseded the
  paid assistant default with strictly free dependencies only, no silent paid fallback, no Anthropic
  API key, and G v0.8.0 cut first if no free brain is viable; aligned README and assistant guidance
  — keep the plan resumable by milestones and reflect setup facts and the 2026-10-14 instructions
  — decided by operator.

- 2026-10-05 — Plan of record created from the planning session (files 00–09, 90, templates) —
  initial version — decided by operator (planning session).
- 2026-10-05 — Removed the "never touch main / only the operator merges" rule (it was imported from AKLabs repo contracts, not stated by the operator) — operator objected — decided by operator.

## 2026-10-25 — Alpha.2 B1 data layer

Operator instruction: add per-galaxy ownership, policies, budgets and action/checkpoint persistence
with verified-Google email allowlisting, a reusable GalaxyStore adapter and idempotent in-release
legacy migration. Copy batches fence on completion so stale retries preserve post-import edits.
Public actions also honor the existing emergency and operation kill switches.
Implementation: public visibility is immutable for dependency-free public log
deliveries; private memberships supply sampled activity/launch metrics. The replacement fair model
is 24,599 reads and 4,100 writes under its stated envelope. R25 supersedes orbital eccentricity
caps. UI, dashboard, sign-in presentation, physics kernel and route packaging stay in their own
packages. This patch records the implementation handoff; preview/real-phone verification remains.
