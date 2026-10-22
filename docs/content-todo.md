# Content still needed from the operator (P3)

The shell is built so that real content drops in by editing data files only. All operator content
lives in `src/data/content.ts`, EN and ES side by side. Anything missing is a `todo(...)` entry
there. Run

    pnpm run content:todo

to print the current list with exactly what each item needs. Pages never show a TODO or any editorial
status: a section or entry whose content is missing is omitted (for example Projects lists only the
complete projects, About has no biography block until it is written). This file and the command are
the only place the gaps are explained.

The Collective Galaxy pitch claims only what the pinned galaxy release delivers (design, launch and
orbit of planets, stars and moons). The "kept as a keepsake" claim returns once G v0.6.0 (Memory) is
the pinned release.

## What to send

| Item (`content.ts` path) | Needed |
|---|---|
| `links` | The links for `/links`: label, URL, order; EN/ES labels where they differ |
| `profile.role` | One-line role, EN and ES |
| `profile.bio` | About text, EN and ES, from his own posts |
| `profile.cv` | Public CV link and label, or confirmation that there is none |
| `projects` | Each other project: title, pitch, role, stack, links, dates, image, EN and ES |
| `projects.items[0].*` | Collective Galaxy: role, approved stack, dates (Be a Dragon 2026 date is unconfirmed, D1), image with alt text |
| `socials` | Approved public profiles: platform, handle, URL (also fills `/profile.json`) |

## Hard rules

- Nothing is invented: bio, role, employers, dates, numbers, handles and other projects stay TODO
  until he supplies them.
- The portfolio repository is private; it is never linked from public pages or `/profile.json`.
  The public galaxy repository is `https://github.com/alexanderkholodov1/little-galaxy`.
