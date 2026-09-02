# Deploy - Best Way (Free, Persistent)

**Stack:** Frontend Vercel + Backend Render Docker + DB Neon Postgres (free forever). `sqlite` fallback works locally if `DATABASE_URL` empty.

## Why this is best
- **Vercel** = fastest Vite React deploy, auto GitHub push, free
- **Render** = free Docker for FastAPI, health check `/health`
- **Neon** = free Postgres forever (vs Render Postgres free 90 days then sleeps). Persistent — sqlite on Render would lose data on redeploy (ephemeral disk).

## Steps (5 min)

### 1. DB — Neon (free forever)
1. Go neon.tech → Sign up → New Project `dochelper` → copy `DATABASE_URL` like `postgresql://user:pass@ep-xxx.neon.tech/dochelper?sslmode=require`
2. Alternative: use Render's `dochelper-db` in `render.yaml` (auto) but expires 90 days.

### 2. Backend — Render
1. render.com → New + → Blueprint → Connect GitHub `hundredmiles100/ai-doc-helper` → `render.yaml` auto detected
2. Add env var `OPENAI_API_KEY=sk-proj-...` (from platform.openai.com → API keys → Billing add $5 → Create) — leave empty for mock mode
3. Deploy → wait → copy URL like `https://ai-doc-helper-backend.onrender.com` → check `/health` and `/docs` (hidden in prod unless `ENABLE_DOCS=true`)

### 3. Frontend — Vercel
1. vercel.com → Add New Project → Import same GitHub repo → Root Directory `frontend` → Framework Vite → Build `npm run build` Output `dist`
2. If backend URL differs from `vercel.json` rewrite, set `VITE_API_URL` env or edit `frontend/vercel.json:6` `destination` to your Render URL
3. Deploy → you get `https://ai-doc-helper.vercel.app`

### 4. Test
Upload PDF at Vercel URL → Summarize/Ask should return markdown tables (local mock if no key, real AI if key set).

## Env summary
- `ENV=production` hides `POST /docs` (`backend/app/main.py:9`)
- `DATABASE_URL` → if empty locally, uses `sqlite:///./dochelper.db` (`backend/app/config.py:5`)
- `OPENAI_API_KEY` → empty = mock (real doc text, tables), set = full GPT-4o-mini
- Frontend `vite.config.js:7` proxies `/api` to `localhost:8000` in dev; in prod `vercel.json:6` rewrites to Render

## Local prod test
```
docker-compose up --build  # uses db:5432 postgres, needs .env with DATABASE_URL
# or without docker:
cd backend && pip install -r requirements.txt && uvicorn app.main:app --port 8000
cd frontend && npm install && npm run build && npm run preview
```

## Costs
- Vercel free 100GB, Render free 750h/mo, Neon free 3GB, OpenAI pay-as-you-go $5 free credit → ~3000 quiz generations.
