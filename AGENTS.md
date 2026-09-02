# AGENTS.md

If you are an AI agent starting in this repo after context was lost:

1. Read `CONTEXT.md` immediately.
2. Check `git log --oneline -10` and `git status`.
3. Don't re-scaffold - continue from last TODO in CONTEXT.md.
4. Verify backend & frontend still run (`uvicorn`, `npm run dev`) before making changes.
5. Update CONTEXT.md after you finish a phase.

Project is AI Document Helper (FastAPI + React + Postgres + OpenAI). All AI endpoints have mock fallback - no API key needed for demo.
