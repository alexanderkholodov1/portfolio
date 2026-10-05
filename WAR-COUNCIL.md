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

## 3. Decision log (war council — answer once, batched)

| # | Question | Operator's answer | Recommendation |
|---|---|---|---|
| Q1 | Domain: your own name (.com/.dev/.ec) or under the new studio brand? | — | **Own name** (recruiters/collaborators search the person); studio gets its own site later. Depends on StudioBranding Q3. |
| Q2 | Content v1: which projects/sections? (MunHub, research, apps, CV page, blog?) | — | MunHub + research + selected projects + /links v1; blog only if you'll actually write. |
| Q3 | Languages: ES+EN, or +RU too? | — | ES+EN v1 (audience reality); RU if cheap with the chosen i18n setup. |
| Q4 | Stack: Astro (recommended for pure content) vs Next.js? | — | **Astro** unless you foresee app-like interactivity. |
| Q5 | Design: from the studio tokens (StudioBranding Q5) or independent personal style? | — | Independent personal style — this site represents YOU, not the studio. |

Unanswered questions block §7.

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

## 7. Approval

- Operator signature: _pending — blocked on §3 Q1–Q5._
