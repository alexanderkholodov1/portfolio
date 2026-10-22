# 07 — Operator checklist (only Alexander can do these)

Agents: do not work around these. If one blocks a version, stop that version, report, and continue
with work that isn't blocked.

## Portfolio repo
- [x] **P1 — BLOCKER for P v0.1.0:** push access. The agent's shell on the laptop has no GitHub
      credentials (`git push` fails). Either push yourself or configure credentials (e.g. `gh auth
      login`) for the implementing agent.
      Done (2026-10-15): the agent's shell has push access through `gh`.
- [x] **P1b:** git identity configured (`user.name`, `user.email`) — commits are authored as you.
      As of 2026-10-05 the repo has no local or global identity set.
      Done (2026-10-15): git identity is set.
- [ ] **P2 — BLOCKER for P v0.1.0 CI deploy:** add secret `FIREBASE_SERVICE_ACCOUNT` (project
      `alexanderkholodov`) to `alexanderkholodov1/portfolio`. Least-privilege option: create a
      deploy-only service account (role *Firebase Hosting Admin*) instead of the admin key.
- [ ] **P3 — BLOCKER for P v0.2.0, needed before P v0.2.0:** portfolio content — project texts (title, one-line
      pitch, role, stack, links, dates, images), About, the links for `/links`, social profiles. No
      content is invented.
- [ ] **P4:** sign `WAR-COUNCIL.md` §7 once updated.
- [ ] **P5:** confirm `00-context.md` application text matches what was submitted.

## Galaxy repo + data project
- [x] **G1 — BLOCKER for G v0.1.0:** create GitHub repo `alexanderkholodov1/galaxy`.
      Done (2026-10-15): the `galaxy` repository exists.
- [x] **G2 — BLOCKER for G v0.1.0:** create the Firebase **data project** (name your choice;
      suggestion `collective-galaxy`). In it:
      - Firestore → create database, **production mode**, location (recommended US-East, e.g.
        `us-east1`; permanent).
      - Authentication → Get started → enable **Anonymous** and **Google**.
      - Authentication → Settings → authorized domains: add `alexanderkholodov.web.app` (and preview
        channel domains when they appear).
      Done (2026-10-15): the operator created `little-galaxy` with Firestore and Authentication as described above.
- [x] **G3 — BLOCKER for G v0.1.0:** register a **web app** in the data project and share its public
      config (or authorize the agent to register it via API).
      Done (2026-10-15): the web app in `little-galaxy` is registered.
- [x] **G4:** generate the data project's service account key → store **outside any repo** or in a
      git-ignored `private/`; used by `apps/stand` via `GOOGLE_APPLICATION_CREDENTIALS`. Add the
      needed CI secrets to the galaxy repo (rules deploy to the data project; preview-channel deploy to
      `alexanderkholodov`).
      Done (2026-10-15): the service-account key was generated and is kept in the galaxy checkout's git-ignored `private/` folder.
- [ ] **G4 CI follow-up — needed before G v0.1.0 CI deploy:** add the needed CI secrets to the
      galaxy repo (rules deploy to `little-galaxy`; preview-channel deploy to `alexanderkholodov`).
      Key generation does not confirm CI secrets are configured.
- [ ] **G5 (deferred with the assistant):** sign in once with Google on `/galaxy/talk` so your uid can be set as `config/live.ownerUid`.

## Assistant (deferred to CASPIAN, operator 2026-10-22: not needed for Be A Dragon)
- [ ] **A1 — BLOCKER for G v0.8.0:** confirm brain (D2) and provide an Anthropic API key (cost) if
      the default is kept.
      Superseded (2026-10-14, operator decision): nothing paid or able to silently become paid; a strictly free brain or v0.8.0 is cut first.
- [ ] **A2:** booth laptop specs (CPU, GPU, RAM, OS) → decides local Whisper vs cloud STT (D8) and the
      performance target.
- [ ] **A3:** assistant workspace folder location (default `C:\My Files\AKLabs\Fawns\assistant-workspace\`).
- [ ] **A4:** choose the assistant's name.

## Fair
- [ ] **F1:** confirm the fair date and booth schedule (D1).
- [ ] **F2:** speakers: TV/monitor speakers or a Bluetooth speaker (D9).
- [ ] **F3:** rehearsal on campus Wi-Fi with real Android + iPhone (needed before G/P v1.0.0 acceptance).
- [ ] **F4:** bring: laptop + charger, HDMI cable/adapter for the stand monitor, phone with mobile data
      as hotspot backup.
