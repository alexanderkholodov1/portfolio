# 07 — Operator checklist (only Alexander can do these)

Agents: do not work around these. If one blocks a version, stop that version, report, and continue
with work that isn't blocked.

## Portfolio repo
- [ ] **P1 — BLOCKER for P v0.1.0:** push access. The agent's shell on the laptop has no GitHub
      credentials (`git push` fails). Either push yourself or configure credentials (e.g. `gh auth
      login`) for the implementing agent.
- [ ] **P1b:** git identity configured (`user.name`, `user.email`) — commits are authored as you.
      As of 2026-10-05 the repo has no local or global identity set.
- [ ] **P2 — BLOCKER for P v0.1.0 CI deploy:** add secret `FIREBASE_SERVICE_ACCOUNT` (project
      `alexanderkholodov`) to `alexanderkholodov1/portfolio`. Least-privilege option: create a
      deploy-only service account (role *Firebase Hosting Admin*) instead of the admin key.
- [ ] **P3 — BLOCKER for P v0.2.0, due Oct 13:** portfolio content — project texts (title, one-line
      pitch, role, stack, links, dates, images), About, the links for `/links`, social profiles. No
      content is invented.
- [ ] **P4:** sign `WAR-COUNCIL.md` §7 once updated.
- [ ] **P5:** confirm `00-context.md` application text matches what was submitted.

## Galaxy repo + data project
- [ ] **G1 — BLOCKER for G v0.1.0:** create GitHub repo `alexanderkholodov1/galaxy`.
- [ ] **G2 — BLOCKER for G v0.1.0:** create the Firebase **data project** (name your choice;
      suggestion `collective-galaxy`). In it:
      - Firestore → create database, **production mode**, location (recommended US-East, e.g.
        `us-east1`; permanent).
      - Authentication → Get started → enable **Anonymous** and **Google**.
      - Authentication → Settings → authorized domains: add `alexanderkholodov.web.app` (and preview
        channel domains when they appear).
- [ ] **G3 — BLOCKER for G v0.1.0:** register a **web app** in the data project and share its public
      config (or authorize the agent to register it via API).
- [ ] **G4:** generate the data project's service account key → store **outside any repo** or in a
      git-ignored `private/`; used by `apps/stand` via `GOOGLE_APPLICATION_CREDENTIALS`. Add the
      needed CI secrets to the galaxy repo (rules deploy to the data project; preview-channel deploy to
      `alexanderkholodov`).
- [ ] **G5:** sign in once with Google on `/galaxy/talk` so your uid can be set as `config/live.ownerUid`.

## Assistant
- [ ] **A1 — BLOCKER for G v0.8.0:** confirm brain (D2) and provide an Anthropic API key (cost) if
      the default is kept.
- [ ] **A2:** booth laptop specs (CPU, GPU, RAM, OS) → decides local Whisper vs cloud STT (D8) and the
      performance target.
- [ ] **A3:** assistant workspace folder location (default `C:\My Files\AKLabs\Fawns\assistant-workspace\`).
- [ ] **A4:** choose the assistant's name.

## Fair
- [ ] **F1:** confirm the fair date and booth schedule (D1).
- [ ] **F2:** speakers: TV/monitor speakers or a Bluetooth speaker (D9).
- [ ] **F3:** rehearsal on campus Wi-Fi with real Android + iPhone (Oct 21).
- [ ] **F4:** bring: laptop + charger, HDMI cable/adapter for the stand monitor, phone with mobile data
      as hotspot backup.
