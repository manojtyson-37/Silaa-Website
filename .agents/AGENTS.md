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

## Incident Learnings & Strict Constraints
Based on past mistakes (Incident on 04 Aug 2026), you MUST adhere to the following strict constraints:
1. **Never Hardcode Placeholder Data in Production:** If you are updating a database record (e.g., via a cleanup script), do NOT arbitrarily guess values like prices or amounts. Always fetch the true values first (e.g., query the Sanity catalog for product prices or check Razorpay logs) before modifying production data.
2. **Schema & API Validation Awareness:** When adding new database columns (especially `Decimal`), you must thoroughly check all downstream Pydantic schemas and UI serializers. Pydantic v2 is strict; if a schema expects a `str`, returning a `Decimal` from the DB will crash the endpoint. Use `field_validator` or update the schema correctly.
3. **End-to-End Verification Before Confirmation:** Never declare a task "done" without manually verifying the live endpoint. If you run a migration, test the API locally or curl the production endpoint to ensure it returns a 200 OK and isn't throwing a 500 Internal Server Error due to validation failures.

## Incident Learnings & Strict Constraints (Update)
4. **Always Push Fixes Immediately:** When fixing a critical 500 error locally (such as Pydantic serialization bugs), ALWAYS commit and push the fix to production immediately. Leaving a known broken state deployed while debugging other frontend issues leads to cascading failures where other API endpoints (e.g. `/customers`) silently fail. 
