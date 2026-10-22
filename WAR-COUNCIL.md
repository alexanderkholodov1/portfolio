# War-council dossier — Portfolio Center (v0 DRAFT)

> Planning document per CASPIAN doctrine rule 8: **no build starts until the operator signs §7.**
> Drafted 2026-07-15. Small, ships in days; from the operator's own notes: a website for his
> portfolio + a Linktree-style links page.

> **Update 2026-10-05 — plan of record moved to [`docs/plan/`](docs/plan/README.md).** The portfolio
> now also hosts and deploys Alexander's web games, starting with *Collective Galaxy* (`/galaxy`, separate
> `galaxy` repo) for USFQ's BAD Day 2026, deadline 2026-10-21. Agreed in planning: English primary /
> Spanish secondary (supersedes §3 Q3's "ES+EN"), Astro for the portfolio (§3 Q4), Firebase Hosting on
> project `alexanderkholodov`. §7 still requires the operator's signature.

## 1. Concept

**The product in one paragraph.** A personal website presenting Alexander's work (MunHub Lab,
research at USFQ, the app family as it ships, publications) plus a self-hosted link-in-bio page
(`/links`) replacing Linktree — no paid third-party service. Static, fast, bilingual at minimum
(ES/EN; RU optional), dark+light mode (operator's standing preference for all web/UI projects).

**Riskiest assumption.** None technical. The real risk is content staleness — the design must make
updating trivially cheap (markdown content files, no CMS ceremony).

## 2. Landscape

- Static site generators: **Astro** (content-first, near-zero JS by default) or **Next.js** (if
  interactive pieces are wanted later). Free hosting: GitHub Pages / Cloudflare Pages / Vercel free
  tier — all sufficient for a portfolio.
- Linktree replacement: a single static route (`/links`) on the same site — zero extra cost,
  full control, no branding.
- Domain: personal name domain vs studio domain — depends on StudioBranding Q3 (recommended there:
  portfolio under his own name).

## 3. Decision log — draft reconciliation, unsigned

This draft reconciles the original questions with the operator's recorded planning
choices in `docs/plan/`. It does not sign this dossier or approve missing content.
The 2026-10-21/22 night brief authorizes local P v0.1.0 work only.

| # | Original question | Recorded plan / draft resolution for operator review |
|---|---|---|
| Q1 | Own-name domain or studio brand? | Existing approved Hosting URL: `https://alexanderkholodov.web.app`. A custom domain remains undecided; recommend retaining the existing URL for foundations. No name is reserved. |
| Q2 | Which projects and sections? | P v0.1.0: Home, Projects, About, Links and Galaxy entry, with known content only. P v0.2.0 adds operator-approved project descriptions, biography and social links (P3). Recommend supplying that content before P v0.2.0. |
| Q3 | Languages? | Recorded decision: English primary at `/`; Spanish secondary at `/es/`. Russian is later. |
| Q4 | Stack? | Recorded decision: Astro static site; two game/site repos; portfolio assembles pinned release artifacts and alone deploys production Hosting. Hosting-only project `alexanderkholodov`; data project remains separate. |
| Q5 | Design source? | Light/dark required. The normative DESIGN-DOCTRINE document is unavailable on Beacon. Draft foundation tokens follow the Galaxy handoff fallbacks; recommend supplying the doctrine for review. No final personal identity/style approval is inferred. |

Outstanding operator choices and missing content are in
[`docs/foundations-status.md`](docs/foundations-status.md). The original sketch
below is historical where the plan of record supersedes it.

## 4. Specification (sketch)

- Static site, content as markdown/data files; project cards with links (GitHub, papers, Play Store
  when apps ship); `/links` page; dark+light; i18n; analytics via a privacy-respecting option
  (e.g. self-hosted Plausible on Homelab later, or none).
- **Acceptance criteria:** Lighthouse ≥95 across the board; content update = editing one markdown
  file; /links loads instantly on mobile.

## 4b. Architecture, ready to build (drafted 2026-07-23)

> The smallest fawn in the portfolio, and it should stay that way. Its job is to load fast, say who he
> is, and never need maintenance — a portfolio that rots is worse than a plain one.

### Shape

Astro, static output, content in Markdown/MDX in the repo. Deployed to Firebase Hosting (the path he
already runs for MunHub) or GitHub Pages — both free, both static, neither with a server to patch.

```
content/  (projects, research, CV)  ──►  Astro build  ──►  static HTML  ──►  CDN
```

**Why static, and why Astro:** zero JavaScript shipped for pages that are text, which means it loads
instantly on a recruiter's phone and scores well without effort. No database, no runtime, no
dependency that can break while he is not looking. Interactivity (if any) is islands, not a framework.

### Content model

`Project` (title, one-line pitch, role, stack, links, dates, images), `Writing`, `CV`. Each is a file,
so adding a project is a commit, not a CMS. **MunHub Lab is the flagship** and leads.

### The two things it must get right

1. **The CV must be current.** A stale CV on a personal site actively hurts. So the CV page is
   generated from a single source of truth that `EfficientJobSearcher` also reads — one profile, not
   two that drift apart.
2. **i18n from the start** (ES+EN per §3 Q3). Retrofitting a second language into a site is the same
   tax as retrofitting it into an app; Astro handles it with routing and content collections if it is
   there from day one.

### Dependencies

Only §3 Q1 (domain: own name vs studio brand). Nothing else blocks it, and it can ship in a weekend
once that is answered — which makes it the best candidate whenever he wants a quick, visible win.

## 5. Build plan

1. Content inventory (operator provides/approves texts) → design tokens → build → deploy on free
   hosting → domain.
2. Iterate as projects ship (each shipped app adds a card).

Dependencies: StudioBranding Q3 (domain decision) — soft. Nothing else.

## 6. Delivery & handover

- Own git repo, AGENTS.md scaffold, English inside (site content ES/EN).
- Data class: public by definition — nothing private enters this repo (CASPIAN anonymization rule:
  personal context beyond what he chooses to publish stays out).
- Notification points: DEPLOY_PREVIEW_READY.

## 7. Approval — draft only

- Operator signature: _pending — operator only._
- Draft scope: P v0.1.0 foundations and game assembly as recorded in `docs/plan/06-roadmap.md`.
- Q1 custom domain, Q5 design review and P3 public content remain open as described above.
- This draft records the agreed architecture and language decisions. It is not a
  signature, a release acceptance, or permission to publish/deploy during the night.
- Operator review: sign this section, or amend the draft choices first. Recommendation:
  review the existing-URL foundation separately from later content/custom-domain work.
