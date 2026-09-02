# Custom Domain Setup (you pay ~$10-15/yr for .com, hosting stays free)

**Best cheap registrars:** Cloudflare Registrar (no markup, ~$9-12/yr .com) or Porkbun/Namecheap. Avoid GoDaddy markup. `.ai` costs ~$80/yr.

## 1. Buy domain (2 min)
- Cloudflare: dash.cloudflare.com → Domain Registration → Search `yourdomain.com` → Buy
- Or Namecheap/Porkbun → Search → Buy → keep auto-renew on

**Pick:** Short, e.g. `dochelperai.com`, `aidocmate.com`, `studyquik.com`, `dochelper.app`. Check namecheap.com for availability first. Tell me name and I’ll wire it.

## 2. Connect Frontend (Vercel) — free SSL auto
1. Vercel → your project `ai-doc-helper` → Settings → Domains → Add `yourdomain.com` + `www.yourdomain.com`
2. Vercel shows DNS instructions:
   - If domain on Cloudflare: set NS to Cloudflare or add CNAME `cname.vercel-dns.com`
   - Add: `A @ 76.76.21.21` and `CNAME www cname.vercel-dns.com` (Vercel tells exact)
3. Wait 2-5 min → SSL auto → `https://yourdomain.com` works

## 3. Connect Backend (Render) — optional but cleaner
1. Render → `ai-doc-helper-backend` → Settings → Custom Domain → Add `api.yourdomain.com`
2. Render shows `CNAME api your-backend.onrender.com` → add in Cloudflare DNS
3. Update Vercel env: `VITE_API_URL=https://api.yourdomain.com` (frontend/src/api/client.js:4 already supports it)
4. Or keep `vercel.json:6` rewrite to `https://ai-doc-helper-backend.onrender.com/api/*` — no env needed, frontend `/api` → backend via Vercel. Both work.

## 4. Update envs after domain
- Vercel → Settings → Environment Variables → `VITE_API_URL=https://api.yourdomain.com` → Redeploy
- Render → Environment → `ENV=production` (keeps /docs hidden) + `OPENAI_API_KEY=sk-...`
- `render.yaml` + `frontend/vercel.json` already pushed (6923ba6) — no code change needed.

## Costs
- Domain: ~$10-15/yr (.com), ~$80/yr (.ai) — only cost you pay
- Hosting: Vercel free 100GB, Render free 750h/mo, Neon Postgres free 3GB — stays free
- OpenAI: $5 credit free → pay after

## What to tell me
Send me the domain you bought (e.g. `dochelperai.com`) and I’ll update `vercel.json` + `VITE_API_URL` to use it and push.

## Free alternative (no domain)
You get `https://ai-doc-helper.vercel.app` + `https://ai-doc-helper-backend.onrender.com` instantly after deploy — works without paying. Custom domain just looks more pro.
