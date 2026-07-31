# Silaa Workspace — Agent Operational Guide

## Autonomous capabilities — NO need to ask the user

### 1. Production Supabase (read + write)

```bash
cd "/Users/manojaaa/Silaa Website/erp-backend"
export $(grep -v '^#' .env.production | xargs)
python3 -c "
from app.db import SessionLocal
db = SessionLocal()
# run queries here
db.close()
"
```

Or run a one-off script:
```bash
cd "/Users/manojaaa/Silaa Website/erp-backend"
export $(grep -v '^#' .env.production | xargs)
python3 scripts/your_script.py
```

The `.env.production` file holds `DATABASE_URL` pointing at the Supabase Postgres pooler. Loading it with `export $(...)` makes it available to Python. Never print DATABASE_URL to the transcript.

### 2. Alembic migrations on production

```bash
cd "/Users/manojaaa/Silaa Website/erp-backend"
export $(grep -v '^#' .env.production | xargs)
python3 -m alembic heads        # always run first
python3 -m alembic upgrade head
```

If migration fails with DuplicateTable: stamp the existing revision, run only the missing DDL (ALTER TABLE ... IF NOT EXISTS), then stamp the new revision. See memory: `feedback_production-alembic-divergence`.

### 3. Vercel deployment verification

```bash
# Get latest SHA
cd "/Users/manojaaa/Silaa Website" && git log --oneline -1

# Check deploy status (no auth needed for public repos)
gh api repos/manojtyson-37/silaa-website/commits/<SHA>/statuses | jq '.[0] | {state, context, target_url}'

# Or check all status checks
gh api repos/manojtyson-37/silaa-website/commits/<SHA>/check-runs | jq '.check_runs[] | {name, status, conclusion}'
```

Both ERP frontend and the main Next.js app deploy to Vercel. There are two separate Vercel projects:
- `silaa-website` — main Next.js (silacollective.in + erp.silacollective.in via rewrites)
- Check `vercel.json` at root for routing rules

### 4. Git identity — pick by repo owner

```bash
git remote -v  # check owner
```

- owner `kbdcreditsolutions` → `gh auth switch -u kbdcreditsolutions`
- owner `travelkathegalu` → `gh auth switch -u travelkathegalu`
- everything else → `gh auth switch -u manojtyson-37`

### 5. Running local ERP backend

```bash
cd "/Users/manojaaa/Silaa Website/erp-backend"
source venv/bin/activate && uvicorn app.main:app --reload --port 8001
```

### 6. UI verification — ERP is login-gated

Production ERP at `https://erp.silacollective.in` requires login. Cannot enter credentials (security rule). Verify UI changes by:
1. Confirming Vercel deploy status is `success`
2. Confirming DB columns/tables exist via production SQLAlchemy query
3. Reading the source files to confirm code is correct
4. Optionally fetch the HTML to confirm JS bundle updated

Do NOT repeatedly ask the user to manually verify — do items 1-3 autonomously and report findings.

---

## Stack snapshot

| Layer | Tech | Location |
|-------|------|----------|
| Frontend (retail + ERP) | Next.js 14 App Router | `/erp-frontend/` + `/src/` |
| Backend API | FastAPI + SQLAlchemy | `/erp-backend/app/` |
| DB (dev) | SQLite | `erp-backend/erp.db` |
| DB (prod) | Supabase Postgres | `.env.production` |
| Migrations | Alembic | `erp-backend/alembic/versions/` |
| Deploy | Vercel | auto on push to `main` |
| CMS | Sanity | `sanity.config.ts` |

## CompanySetting keys (ERP admin)

`currency`, `gstin`, `business_address`, `bank_name`, `bank_account`, `bank_ifsc`, `bank_upi`, `invoice_terms`, `proforma_terms`

Set via: `POST /api/erp/settings` with `{"key": "...", "value": "..."}`

## Key patterns (hard-won lessons)

- Always `alembic heads` before writing `down_revision`
- `db.flush()` → set `display_number = f"PREFIX-{obj.id:04d}"` → `db.commit()` (never COUNT*)
- Pass ALL fields into service function in one commit (never set + commit after service committed)
- Use `Literal["Cash","UPI",...]` in Pydantic — not runtime set checks
- PATCH replacing a child list: guard `if not list: raise HTTPException(400, ...)`
- New CompanySetting key = allowlist change + read it in the consuming endpoint

## ERP modules

- `/sales-orders` → Retail Sales Invoice (retail, StyleVariant-linked, captures payment_mode)
- `/proforma-invoices` → Proforma Invoice (B2B bulk, client fabric, size-wise JSON qty)
- `/expenses` → Expenses + CompanySetting admin
- Production backend: `https://silaa-website.vercel.app/api/erp/`
