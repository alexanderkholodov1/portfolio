# AGENTS.md — the contract every agent obeys in this repo

> **portfolio** is Alexander Kholodov's personal website (`alexanderkholodov.web.app`) and the
> host that assembles and deploys his web games (first: **Collective Galaxy** at `/galaxy`, built in
> the separate `galaxy` repo). The plan of record is `docs/plan/` — read `docs/plan/README.md`
> before doing anything. The original dossier is `WAR-COUNCIL.md`.

## Non-negotiables

1. **NEVER touch `main`.** Feature branch → commit → push → PR → stop. Only the operator merges.
2. Every PR is a milestone titled **`vX.Y.Z: <what it delivers>`** (see `docs/plan/06-roadmap.md`).
3. **Commits are authored as the operator** (his git config). **No AI co-author trailers.** History
   states what the change delivers — never process narration, never "as requested", never apologies.
4. **Repo content is in English** (code, comments, docs, commits). Conversation with the operator is
   in Spanish (mirror him; technical terms stay in English).
5. **Secrets.** `private/` holds an admin service-account key: god-mode, server-side only. Use it by
   path via `GOOGLE_APPLICATION_CREDENTIALS`; never print it, read it aloud, commit it, or bundle it.
   The *web* Firebase config (apiKey, authDomain, projectId) is public by design. A privacy test is a
   **build gate**: the build fails if anything from `private/` or any key material reaches `dist/`.
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
11. **Design:** follow `../../CASPIAN/governance/DESIGN-DOCTRINE.md` on every UI. Generic,
    machine-default output is a defect.
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
