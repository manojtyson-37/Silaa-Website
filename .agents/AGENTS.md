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

## Deployment Verification
**ALWAYS** verify deployments after pushing code.
When pushing code to Vercel (or any other deployment target), you must:
1. Wait for the deployment to finish building.
2. Verify that the deployment was successful by checking the live production URL (`https://silaa-website.vercel.app` or `https://silacollective.in`).
3. Report back to the user only after confirming the live site reflects the changes or that the build succeeded without errors.

# Vercel Automation
When automating Vercel tasks, ALWAYS use the provided CLI token. The token is available in your environment variables as VERCEL_TOKEN.
Command format: `npx vercel [command] --token $VERCEL_TOKEN --scope manojsuperb09-7598s-projects`

