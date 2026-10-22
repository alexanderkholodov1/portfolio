# AGENTS.md — the contract every agent obeys in this repo

> **portfolio** is Alexander Kholodov's personal website (`alexanderkholodov.web.app`) and the
> host that assembles and deploys his web games (first: **Collective Galaxy** at `/galaxy`, built in
> the separate `galaxy` repo). The plan of record is `docs/plan/` — read `docs/plan/README.md`
> before doing anything. The original dossier is `WAR-COUNCIL.md`.

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

## Design artifact (DESIGN-DOCTRINE R1)

The portfolio borrows its structure from **an observatory logbook**: the bound, ruled ledger kept at
the telescope, where each night's observations are entered as numbered lines.

- **Entries, not cards.** A project is a numbered ledger line (`01`, `02`, ...) separated by hairline
  rules; no boxes, shadows or rounded corners. Square edges throughout.
- **The live banner is tonight's entry.** It sits at the top of Home like the day's header line, with
  a status lamp. Lamp colours are semantic: grey = not read, green = a fresh reading, amber = the
  last reading is old. A count is printed only when it was actually read (R9).
- **Numbers are set as figures in a log**: `tabular-nums`, aligned at the right margin of a row.
- **Missing content is omitted.** Visitors never see editorial status ("not yet entered", "profile not written"); the explanation lives only in `pnpm run content:todo` and the PR report. Never filler text.
- **`/links` is the call-sign list**: one big ruled row per link, nothing else. Its only script is the
  inline preference initializer shared by every page (about 700 bytes, render-blocking, no external
  JS, no module): it applies the saved theme before paint and drives the theme control. This is the
  accepted exception to "zero JS" on `/links`; without JavaScript the page follows the system theme and
  the control is hidden.
- Type: Spectral (display, a book face with a bookish register) against Archivo Narrow (the narrow
  sans of instrument labels and ledger columns). Two weights far apart for labels.
- Rhythm: tight inside a ledger row (0.25-0.5rem), wide between sections (4-7rem).

## Content rule (zero invented content)

All operator content lives in typed modules under `src/data/` (`content.ts`, EN and ES side by
side). Anything not yet supplied is a `todo(...)` entry there. `pnpm run content:todo` prints
the list; `docs/content-todo.md` explains it. Pages omit
pending items, with no replacement text; they never print a TODO or editorial status.
