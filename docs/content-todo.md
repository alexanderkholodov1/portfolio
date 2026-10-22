# Content still needed from the operator (P3)

The shell is built so that real content drops in by editing data files only. All operator content
lives in `src/data/content.ts`, EN and ES side by side. Anything missing is a `todo(...)` entry
there. Run

    pnpm run content:todo

to print the current list with exactly what each item needs. Pages never show a TODO: a section
whose content is missing is omitted or shows a short honest state (for example `/links` has no
rows until links are supplied).

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
