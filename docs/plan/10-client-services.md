# Client services: everything he asked for, and where each piece stands

Written 2026-11-18 from his voice notes to Squire about the portfolio (caspian-kb `rules/sources/`, the authority:
`2026-11-16T203904Z`, `…204615Z`, `…211105Z`, `…211818Z`, `…221518Z`, `…222024Z`, `…225718Z`,
`2026-11-18T003059Z` voice notes) and the chat of 2026-11-17/18. His principle, in his words (2026-11-18): "mientras
más libertad tienes tú sobre tu proyecto … subiría más el precio … para que cualquier persona pueda acceder a su
nivel de servicio"; and (2026-11-16) "tú puedes pedir cualquier cosa".

Constraints that shape the phases: Firebase free plan (Spark: no Cloud Functions, no new Storage bucket), no
accounts or payment details created or typed by an agent, prices are his to set (the site never invents amounts).

## Phase 1 — built on the free plan, no new accounts (0.2.26)

| # | What he asked | Source | Status |
|---|---|---|---|
| 1 | Ask for anything, not only software: image or poster, certificate, presentation, 3D model and printing, tools for a business, games, talks; always an "Other" | 211105Z, 211818Z, 203904Z | Questionnaire: broader first question, "Other" everywhere |
| 2 | How it is delivered decides the price: flat image (cheapest) vs editable (Canva, PowerPoint, Illustrator); a tool inside his site in the client's profile (cheapest), a file, GitHub, deployed and managed by him (subscription), or in the client's own Firebase/Cloudflare with credentials (most freedom, most cost) | 211105Z, 2026-11-18 | Questionnaire: "How do you want to receive it?", options by kind, relative cost marks ($ to $$$), no amounts |
| 3 | 3D printing with delivery in Quito or Servientrega elsewhere | 211818Z | Delivery options in the same question |
| 4 | Speed changes the price | 2026-11-18 | Hint on "When" |
| 5 | Big projects: contract with scope and ownership (optional for small ones), a video call, payment in one go or a deposit, or a subscription | 203904Z | Two questions for big kinds only |
| 6 | "Do you want this for your company?" on each project, linked to the request | 204615Z | Project page button carries the project; the request records it |
| 7 | Contact for talks, events, sponsorships, questions | 204615Z | Talk / collaboration kinds in the questionnaire; LinkedIn stays on the home |
| 8 | Orders tab with live progress, what is owed now, previews to try, comments and corrections | 211105Z | Client request page: plan with milestones (each with a link to try), payments due, conversation |
| 9 | Standard approval: a plan with milestones, deliverables, time estimate; not just "approved and a message" | 2026-11-18 | Console: plan editor with defaults; publishing moves the request to Proposal |
| 10 | Automatic contracts; e-signature later | 203904Z | Service agreement generated from the plan, accepted with one click (timestamped), printable; his e-signature is phase 2 |
| 11 | Deposit option; payment methods valid in Ecuador and abroad | 203904Z | Payments per plan (deposit and balance) marked paid by him; "How to pay" text he writes in Settings |
| 12 | Corrections and warranty policy | 211105Z | Defaults in Settings (rounds of corrections, warranty days), shown in every plan; the policy itself is his decision (research below) |
| 13 | Rating when a project ends; real testimonials on the services page | 211818Z | Client rates after delivery (stars, comment, consent to publish); he chooses which to show; Services shows them only when real ones exist |
| 14 | Follow free projects (e.g. USFQ Energy) with a client view and prototypes | 225718Z | Console: "New project" for an existing client, marked free; same client page with milestones and links |
| 15 | Emails at milestones and approval | 211105Z, 2026-11-18 | Phase 1: a prepared email from the console (opens his mail app); automatic sending is phase 2 |

## Phase 2 — needs his accounts, decisions or a paid feature

| # | What | Source | What it needs |
|---|---|---|---|
| 16 | Real payments (global and Ecuador) | 203904Z | His merchant accounts (e.g. PayPal, a local gateway); then a checkout link per payment |
| 17 | Automatic emails | 211105Z | An email service account (e.g. EmailJS free tier) or the Blaze plan with the email extension |
| 18 | AI help for him: an interpreted request, a solution sketch, a draft plan, follow-up questions; shown to the client only after his approval | 203904Z, 2026-11-18 | A server for the model key (e.g. a Cloudflare Worker with Workers AI on his account) |
| 19 | Donations with perks, one system across his sites | 221518Z | His donation accounts (Patreon, PayPal) and the shared account system across sites |
| 20 | Vouchers for returning clients, referrals with discounts, digital perks for reviews | 211105Z, 211818Z | His rules for amounts; builds on 16 |
| 21 | Recommending other professionals when he cannot take a job | 222024Z | The people he trusts, and their consent |
| 22 | His e-signature on agreements | 203904Z | His certificate |

## Research for him (feeds 10–12 and prices)

- Invoicing and electronic signature for freelance work in Ecuador (SRI electronic invoicing, RUC/RIMPE, signature
  certificates), and how project contracts usually define scope and ownership. 203904Z.
- Usual warranty and correction terms for web, design and video work. 211105Z.
- Reference prices in the United States for comparable services. 203904Z.
