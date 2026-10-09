# AGENTS.md — the contract every agent obeys in this repo

> **portfolio** is Alexander Kholodov's personal website (`alexanderkholodov.web.app`) and the
> host that assembles and deploys independent projects (first: the game in the separate `galaxy`
> repo, whose final public name/path remain pending). The portfolio plan is `docs/plan/` — read `docs/plan/README.md`
> before doing anything. The original dossier is `WAR-COUNCIL.md`.

## Current M0 decisions

- Galaxy and portfolio have separate plans, source and commits. The game plan lives in
  `../galaxy/docs/plan/`; this repository owns profile/content, identity and project hosting.
- Priority is galaxy first, portfolio second. The portfolio will host many independent projects.
- The fair QR opens the game directly; profile navigation is an optional discovery route, not
  an entry prerequisite. The intended game URL is a path under the existing domain, name pending.
- Liquid glass and supplied logos are tentative references for a dedicated design session.
- The assistant is entirely excluded from current work. Current instruction is M0 documentation
  and separate documentation commits only; implementation belongs to the next M1 boundary.
- Milestones describe outcomes without calendar-day allocation; the operator owns scheduling.

## Non-negotiables

1. **Branch + PR per version** (`vX.Y.Z: <what it delivers>`) for history and CI previews. There is
   no "never touch `main`" rule: the operator decides in the moment who merges (default: the agent
   merges once CI is green, unless he says otherwise).
2. Every PR is a milestone titled **`vX.Y.Z: <what it delivers>`** (see `docs/plan/06-roadmap.md`).
3. **Commits are authored as the operator** (his git config). **No AI co-author trailers.** History
   states what the change delivers — never process narration, never "as requested", never apologies.
4. **Repo content is in English** (code, comments, docs, commits). Conversation with the operator is
   in Spanish (mirror him; technical terms stay in English).
5. **Secrets.** `private/` holds an admin service-account key: god-mode, server-side only. Use it by
   path via `GOOGLE_APPLICATION_CREDENTIALS`; never print it, read it aloud, commit it, or bundle it.
   The *web* Firebase config (apiKey, authDomain, projectId) is public by design. A privacy test is a
   **build gate**: reject credentials, key material and arbitrary private content in `dist/`.
   User-authorized logo derivatives may be explicitly curated into public assets with recorded
   provenance; never copy/import `private/` wholesale. M0 does not publish or relocate assets.
6. **Free tier only** (Firebase Spark). Anything that needs Blaze is flagged as a paid dependency with
   a free path offered first.
7. **Never reserve a public name without asking** — Hosting sites, Firebase projects, domains, repos,
   handles. Deploying to an approved target is fine.
8. **Only this repo deploys to production Hosting.** A Hosting deploy replaces the whole site; the
   `galaxy` repo only publishes release artifacts and preview channels (see
   `docs/plan/02-architecture.md`).
9. **Access is enforced by Firestore security rules, deny-by-default** — never by hiding routes.
10. **English is the primary language everywhere** (URLs, UI, defaults); Spanish is secondary.
    **Light and dark mode** on every UI. No broken buttons, dead links or placeholder content shipped.
11. **Design:** use the operator's brief and any supplied DESIGN-DOCTRINE on UI work. The historical
    CASPIAN path was absent on Hearth; do not claim it was read. Final identity awaits a dedicated session.
12. **Zero invented content.** Project descriptions, bios, numbers and claims come from the operator
    or from verifiable sources. If content is missing, leave a visible TODO in a PR, never filler.
13. **The plan is a living document, not absolute truth.** You may and should improve it with your
    own judgment and with whatever the operator tells you in the moment. See "How this plan changes"
    in `docs/plan/README.md`: implementation-level improvements → edit the plan and log them;
    changes to scope, product behaviour, architecture or anything in "Decided" → propose to the
    operator with a justification first (or apply directly when he instructs it). The operator's
    current instruction always overrides the plan; update the plan to match. Pending decisions in
    `docs/plan/08-decisions.md` proceed with their stated default unless the operator overrides.
14. **Verify on the deployed URL** (preview channel or production) in a real browser before claiming
    anything works. Docs are part of done: update `docs/plan/` when reality diverges from it.
