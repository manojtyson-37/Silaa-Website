# Silaa Website — Agent Rules

## Git Account
**ALWAYS** use the `manojtyson-37` GitHub account when pushing from this workspace.

Before every `git push`, run:
```bash
gh auth switch --user manojtyson-37
```

Then push:
```bash
git push origin main
```

Never push using `kbdcreditsolutions` or `travelkathegalu` — those accounts do not have access to this repository.

## Project Context
- **Repo:** `manojtyson-37/Silaa-Website`
- **Framework:** Next.js 14 (App Router)
- **CMS:** Sanity (project `nmf3ae7w`, dataset `production`)
- **Hosting:** Vercel (auto-deploys on push to `main`)
- **Domain:** `silaa-website.vercel.app` / `silacollective.in`
