# Content still needed from the operator (P3)

The shell is built so that real content drops in by editing data files only. All operator content
lives in `src/data/content.ts`, EN and ES side by side. Anything missing is a `todo(...)` entry
there. Run

    pnpm run content:todo

to print the current list with exactly what each item needs. Pages never show a TODO or any editorial
status: missing sub-fields are omitted in a designed no-image layout. This file and the command are
the only place the gaps are explained.

The Collective Galaxy pitch claims only what the pinned galaxy release delivers (design, launch and
orbit of planets, stars and moons; hangar; sound and petting). The "kept as a keepsake" claim returns
once G v0.6.0 (Memory) is the pinned release.

## What is still pending

| Item (`content.ts` path) | Needed | Status |
|---|---|---|
| `profile.cv` | Public CV link and label, or confirmation that there is none | Pending operator selection |
| `projects` | Exact start and completion dates where only month or year is known | Partial (known dates rendered) |
| `projects.items[*].image` | Screenshot or photo with alt text in EN and ES for each project card | Pending images |
| `projects.items[5].role` | Prompt Engineering course: specific role and individual contributions | Pending confirmation |
| `projects.items[7].role` | Computer refurbishment (SLB/USFQ): specific volunteer technical tasks | Pending confirmation |
| `projects.items[11].role` | Blue Challenge: specific role and technical contributions in the solution | Pending confirmation |

## Delivered in P v0.2.0 Content

- `profile.role`: One-line bilingual role from approved draft.
- `profile.bio`: Complete bilingual biography from operator posts, including restored Adobe sentence.
- `socials`: Approved LinkedIn, Instagram, GitHub, and Facebook profiles.
- `links`: Approved project and portfolio links for `/links` and `/profile.json`.
- `projects.items`: 14 approved project cards in recency order with Collective Galaxy first, rendered in designed no-image layout.

## Hard rules

- Nothing is invented: bio, role, employers, dates, numbers, handles and other projects stay TODO
  until he supplies them.
- The portfolio repository is private; it is never linked from public pages or `/profile.json`.
  The public galaxy repository is `https://github.com/alexanderkholodov1/little-galaxy`.
