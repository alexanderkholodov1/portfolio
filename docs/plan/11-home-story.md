# 11 — The home as one story (handoff, 2026-11-18)

Written at the end of session 4f72775f at his request ("Handoff y sesión nueva"). The next session starts here.

## Read first, in this order

1. `AGENTS.md`, then `docs/plan/README.md`.
2. His words, verbatim, in `caspian-kb/rules/sources/2026-11-16T2114Z-session-4f72775f.md`: the sections headed
   `2026-11-18 (in the chat, after the 0.2.27 report)`, `… while the home was being rebuilt`, `… second note` and
   `… third note, on the header mark`. They are the brief. Do not work from this summary alone.
3. `caspian-kb/roles/webber/TASTE.md` (his verdicts, newest first) and the 2026-11-18 rows of
   `caspian-kb/improvement/INCIDENTS.md`.

## Who decides what

| His decision: bring options and ask | The agent's own call |
|---|---|
| His mark (logo, monogram, favicon), colours, identity | Layout, spacing and motion inside the approved identity |
| Any phrase that speaks for him (hero line, beliefs, titles) | Implementation, structure, tests, performance |
| Which photos of him appear and where | Fixing a clear defect, said plainly as a defect |

The last session broke this. It designed an AK monogram by itself (white A, orange K) and announced it. He said
"el logotipo principal no es algo que te puedo dejar solo a ti … es una cuestion de PREGUNTAR". White with orange
does not work for him. The monogram was deleted before any commit.

## Task 1 — The header mark (he chose: see proposals)

- **Today:** `.signature::before` in `src/styles/site.css` draws a plain blue dot beside his name. He rejects it as a
  default AI ball with no relation to him or to any logo. There is no favicon.
- **What to do:** make 3 or 4 sketches on a local HTML page, outside the site: not a claude.ai artifact, because the
  account is shared. Show them to him, open in Chrome, and also give him the local path.
- **Brief for the sketches:** use the brand colours from `AGENTS.md`, never white with orange, and tie each one to
  him rather than making a generic shape.
- **Gate:** nothing goes into the site until he picks one. After the pick, build the favicon from the same drawing.

## Task 2 — Finish the home (work in progress, not committed)

### What he asked

- **One message.** The home conveys one message, with a logical and emotional thread. Every section complements the
  others.
- **Identity back.** Who he is, his vision, his philosophy, how he works and why. Placed where it belongs, not
  removed.
- **Community.** The section needs illustrations, animation, eye-catching visuals and a message ("sin alma" was his
  word), preferably without real photos.
- **Contact.** It is well placed and offers more than LinkedIn.
- **Motion.** More interactions and memorable animations; today only the name has one.
- **Tone.** Fun, positive and inspiring: love for the work, professionalism, helping people, impact.
- **Visuals over words.** Fewer words, more visuals, clear at a glance even in a five-second scroll.
- **No "tocar".** No "tocar" wording anywhere.

### What is on disk now (branch `v0.2.0-new-design`, after 0.2.27 `18c86ce`)

- **`src/data/copy.ts`:**
  - New key `story` in EN and ES: rail, chapters, identity (title, lead, fields, four beliefs), community,
    stickers, learning, impact, contact.
  - The hero line was rewritten without "tocar". The new line, ES "Convierto ideas complejas en soluciones claras.",
    is a proposal and still needs his approval.
  - The cue became "Conóceme". "toca" in two hints became "pulsa".
- **`src/components/Page.astro`:** the home is rebuilt as seven numbered chapters, with a side rail:
  1. Who I am: beliefs with animated drawings, and his portrait orbited by his fields.
  2. What I build: the showcase, unchanged.
  3. Community: a board of draggable stickers, his roles with periods plus events.
  4. Learning: the certificates.
  5. Impact: cards that turn from the problem to the project.
  6. How I help: services and process. The process track moved out of the `<ol>` into `.steps-wrap`.
  7. Let's talk: LinkedIn plus every social channel, the start button and a paper-plane scene.

  New helpers: `S`, `chapterIds`, `chap`, `beliefArt`, `stickers`, `socialIcons`, `FLIGHT`. The old `commIcons` was
  removed.
- **`src/scripts/story.ts` (new):**
  - Rail scrollspy.
  - `.live` on the chapters in view; loops pause off screen.
  - Sticker drag that stays inside the board, with a tap "pop".
  - The flip sequence.
  - The plane's SMIL animation, paused off screen.
- **Checks:** `astro check` gives 0 errors and lint passes.
- **Not there yet:** the CSS for all of it. Missing classes:
  - `.story-rail` and `.chap`.
  - `.who-grid`, `.beliefs`, `.belief`, `.b-ico` with the b0–b3 drawing animations.
  - `.orbits`, `.ring`, `.core`, `.orbit`, `.sat`.
  - `.comm-head`, `.drag-hint`, `.board`, `.stk.role` (holographic), `.stk.ev.v0–v4`, with states `.in` (slap on),
    `.drag` and `.pop`, and the variables `--tx`, `--ty`, `--dr`, `--r` and `--oy`.
  - `.flips`, `.flip`, `.flip-in`, `.face.front`, `.face.back`, `.qmark`, `.back-text`, with `.on` as turned.
  - `.steps-wrap .track`.
  - `.talk-*`, `.soc-ico`, `.flight`, `.trail`, `.from`, `.to`, `.plane`, `.topics`.
  - `[data-chapter]:not(.live)` pausing, and reduced motion.

Review this work with a clear eye; keep it or discard it. Points to show him before shipping:
- The hero line.
- The identity title "Me mueve la curiosidad" and the four beliefs.
- His portrait at the centre of the orbit.

Once it ships:
- Clean the dead styles: `.comm-cols`, `.comm-col`, `.comm-ico`, `.cm-*`, `.cases`, `.case`, `.bridge`,
  `.solution`, `.invite`, `.contact-end`, `.chips-big`, `.via`. Check other pages first.
- Remove the copy keys that are no longer used.
- Update the "Home order" in `AGENTS.md`.

### How he wants it judged

- **As a visitor.** Judge the page from the first second: emotions, surprise, impact, the message underneath. Do
  not tick boxes.
- **In Chrome, always.** Look at it with Claude in Chrome at desktop and phone width, in light and dark, and iterate
  before showing it to him. Do this unprompted.
- **Spot what looks wrong.** Notice anything that looks off before he has to point at it, as he had to with the
  header dot.

## Standing rules (details in caspian-kb and AGENTS.md)

- **Commits:** authored as the operator, with no AI co-author trailers; explicit paths; no destructive git.
- **Production:** deploy only after his approval. Never delete, recreate or move production resources without his
  approval for that exact action.
- **Secrets:** `private/` holds an admin key. Never print, commit or bundle it. The privacy test is a build gate.
- **Read-only source:** the Publicaciones folder.
- **Artifacts:** no claude.ai artifacts; work locally.
- **Language:** Spanish with him, English in the repo. Times for him in UTC-5.
- **Cost:** free tier only.
- **Privacy:** his email stays private.

## Other open items

- `tests/browser/*.spec.mjs` are stale: banner, old project list, the `/about/` h2 count. Update them before the PR.
- The PR for `v0.2.0-new-design` (29 commits ahead of `main`, not pushed), then the production deploy after his
  approval.
- Client services phase 2 waits on his accounts (`10-client-services.md`).
- LinkedIn post URLs for Experience, if he sends them.

## Sources gathered for the home (2026-11-18)

- Manifesto in a portfolio, built around what, why, how and who inspires: https://blog.readymag.com/manifesto-or-portfolio/
- About-me practices for creatives: https://landing.vsble.me/blog/about-me-page-best-practices-for-creatives-2025-en
- Projects as problem, process, result, told as one story: https://scale.jobs/blog/how-to-build-a-portfolio-with-storytelling
- Playful physics and scroll motion: https://www.awwwards.com/case-study-stas-bondar-25.html
- A sticker board portfolio: https://21st.dev/@kedhareswer/templates/designer-portfolio-template-with-stickers
- Draggable elements: https://www.awwwards.com/inspiration/draggable-elements-platse
