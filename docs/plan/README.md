# Plan of record — Portfolio + Collective Galaxy (BAD Day 2026)

> Written 2026-10-05 from the planning session with the operator. **Everything decided in that
> session is in these files; nothing lives in chat.** Implementation is done by Claude Code (or any
> agent) following `AGENTS.md`.

**Hard deadline: everything fair-ready by 2026-10-21.**

## Reading order

| File | What it holds |
|---|---|
| [00-context.md](00-context.md) | The fair, why we are doing this, the application as submitted, audience |
| [01-product-spec.md](01-product-spec.md) | Collective Galaxy: every approved feature, and everything rejected (with reasons) |
| [02-architecture.md](02-architecture.md) | Two repos, two Firebase projects, routing, build/release/deploy pipeline, stack |
| [03-data-and-security.md](03-data-and-security.md) | Firestore data model, security rules, rate limits, quota budget |
| [04-assistant.md](04-assistant.md) | The fair assistant ("adjutant"): voice loop, personality, permission levels, live code fixes |
| [05-live-deploys-and-ops.md](05-live-deploys-and-ops.md) | Deploying during the fair without breaking anyone, rollback, testing, failure modes, fair-day runbook |
| [06-roadmap.md](06-roadmap.md) | **Versioned milestones with dates and acceptance criteria — start here to implement** |
| [07-operator-checklist.md](07-operator-checklist.md) | Things only Alexander can do (console switches, secrets, content) — blockers |
| [08-decisions.md](08-decisions.md) | Decision log: decided, and pending-with-default |
| [09-sources.md](09-sources.md) | Verified external facts (quotas, Hosting behaviour) with links and date checked |
| [CHANGELOG.md](CHANGELOG.md) | Log of every change to this plan after 2026-10-05 |
| [90-idea-backlog.md](90-idea-backlog.md) | Ideas discussed but **not approved** — do not build without asking |
| [templates/galaxy/](templates/galaxy/) | `AGENTS.md` / `CLAUDE.md` to copy into the new `galaxy` repo |

## How this plan changes (it is NOT absolute truth)

This plan was written in one planning session and has known room for improvement. The implementing
agent (Claude Code) is expected to **edit and adjust it** — using its own judgment and the
operator's instructions given in the moment.

| Kind of change | What to do |
|---|---|
| Operator instructs a change (any size) | Apply it. Update the affected plan files in the same PR. Log it. |
| Implementation-level improvement (library choice, file layout, algorithm, test approach, ordering of tasks inside a version, estimates, fixing an error in the plan) | Edit the plan directly, apply it, log it with the reason. |
| Change to scope, product behaviour visible to visitors, architecture (repos, Firebase projects, hosting), security model, deadline, or anything in `08-decisions.md` → "Decided" | **Propose it to the operator first** with the justification and trade-offs (his standing preference); apply after his yes. Log it. |
| Something in the plan turns out to be wrong or impossible | Stop that item, explain, propose an alternative. Never silently work around it. |

Every change goes into [CHANGELOG.md](CHANGELOG.md) (date, what changed, why, who decided). When a
plan file and the code disagree, the plan is updated — docs are part of done.

## Where to start (for the implementing agent)

1. Read `AGENTS.md`, then all files above in order.
2. Check `07-operator-checklist.md`: items marked **BLOCKER for vX** must be done by the operator
   before that version can be verified. Do not work around them.
3. Implement `06-roadmap.md` top to bottom: **galaxy v0.1.0** and **portfolio v0.1.0** first.
4. One PR per version, titled `vX.Y.Z: <what it delivers>`. Stack the next version's branch on the
   previous one while a PR waits for the operator's merge.

## State at time of writing (2026-10-05)

- `portfolio` repo: no commits yet. Contains `WAR-COUNCIL.md`, `private/` (admin key of Firebase
  project `alexanderkholodov`), and this plan. `.gitignore` excludes `private/`.
  **Never `git add .` before confirming `.gitignore` is in place.**
- `galaxy` repo: **not created yet** (operator task).
- Firebase project `alexanderkholodov`: active; one Hosting site `alexanderkholodov`
  (`https://alexanderkholodov.web.app`); Firestore not created; Authentication not initialized; no
  web app registered. Under the agreed architecture this project only needs **Hosting**.
- Firebase data project for the galaxy: **not created yet** (operator task; name chosen by him).
