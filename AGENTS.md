# AGENTS.md — the contract every agent obeys in this repo

> **portfolio** is Alexander Kholodov's personal website (`alexanderkholodov.web.app`) and the
> host that assembles and deploys his web games (first: **Collective Galaxy** at `/galaxy`, built in
> the separate `galaxy` repo). The plan of record is `docs/plan/` — read `docs/plan/README.md`
> before doing anything. The original dossier is `WAR-COUNCIL.md`.

## Non-negotiables

0. **A Faun's brigadista owns its Faun end to end, alone**: requirements, plan, hitos, workers, verification and the
   PR. The Adjutant is not involved. Before acting, read the CASPIAN normative context in `caspian-kb`.

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
11. **Design:** follow `../../Commons/fawns-plans/DESIGN-DOCTRINE.md` on every UI (its rule R1 is overridden by Webber's
    `caspian-kb/roles/webber/TASTE.md` section 4), and Webber's persona in `caspian-kb/roles/webber/`. Generic,
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

The identity was chosen by the operator in Webber's studio on 2026-11-16 and the home was approved by him on
2026-11-17 (`caspian-kb/rules/sources/2026-11-16T2114Z-session-4f72775f.md`; his verdicts are in
`caspian-kb/roles/webber/TASTE.md`). The approved home is the reference for every page.

- **Colours, in roles.** Blue `#056ad6` leads, red `#bd1f27` marks single accent words and alerts, orange `#ff8e52`
  is light and warmth; ink `#020b2c` on page `#f3f4f7`. Light by default, dark as an option. Light runs down the
  page as soft OKLab glows, deep-blue bands and a static grain tile; never one flat colour, never borrowed palettes.
- **Type.** Plus Jakarta Sans, with an Instrument Serif italic for one word or phrase per heading.
- **Home order (2026-11-18: the home is one story).** His name alone on the first screen (solid letters over a ribbon of
  light), then seven numbered chapters, with a side rail on wide screens: who he is (four beliefs as small moving drawings
  beside his portrait with his fields in orbit), what he builds (the showcase), community (a board of draggable stickers: his
  real roles with their periods, and the events he was at), learning (certifications), impact (cards that turn from a real
  problem to the project built for it), how he helps (services and the process), and an invitation to talk (LinkedIn, every
  social channel, the start button). Show, do not tell: short captions over motion, never paragraphs of belief.
- **Services sells by showing.** Live demos recognisable at a glance, no prices and no forms on the page; one button
  opens account creation and then one question at a time, each with the time it takes.
- **Motion with a budget.** One live canvas at a time, 1x canvases at 30 fps when idle, nothing animating off
  screen, no full-screen blend modes or backdrop blurs over moving content. Reduced motion shows everything still.
- **Copy.** Professional, warm and inviting; it describes value for the visitor. No colons in copy. Human, never
  contrived, never misreadable, never promising what he does not offer: a complaint about one phrase is about the register
  of all the copy (2026-11-18).
- **Never the AI default** (his standing rule, 2026-11-18, `caspian-kb/rules/proposed/2026-11-18-unique-never-the-ai-default.md`).
  Every piece that stands for him (logo, favicon, card, section, graphic) carries two or three of his characteristic colours
  in proportion, volume toward the viewer and depth into the screen with quality light, reflections and gradients, and type
  set with taste. A flat ground with a token shadow, flat type, or one colour is a defect. Inside one unit (a name, a
  logo, a header) there is one type voice; contrast separates two different things.
- **Missing content is omitted.** Visitors never see editorial status; it lives in `pnpm run content:todo`.
- **`/links`** keeps one script only: the inline preference initializer (about 700 bytes, no module).

## Content rule (zero invented content)

All operator content lives in typed modules under `src/data/` (`content.ts`, EN and ES side by
side). Anything not yet supplied is a `todo(...)` entry there. `pnpm run content:todo` prints
the list; `docs/content-todo.md` explains it. Pages omit
pending items, with no replacement text; they never print a TODO or editorial status.
