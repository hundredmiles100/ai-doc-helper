# CONTEXT.md - read this first if you lost chat history

## What is this project
AI Document Helper - students upload PDFs and can: summarize, ask questions, extract info, compare 2 docs, generate notes, convert notes to quizzes. Example: 100-page textbook -> "explain chapter 4 simply".

Stack: React (Vite) + FastAPI + PostgreSQL/SQLite + OpenAI API (mock fallback)

## How to run
- Backend: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000` (or docker-compose up)
- Frontend: `cd frontend && npm install && npm run dev` -> http://localhost:5173 proxies /api to :8000
- Docker: `docker-compose up --build` (needs .env with OPENAI_API_KEY)
- API docs: http://localhost:8000/docs

## File map
- `backend/app/main.py` - FastAPI app + CORS + init DB
- `backend/app/config.py` - env loader (DATABASE_URL, OPENAI_API_KEY)
- `backend/app/database.py` - SQLAlchemy engine, handles sqlite vs postgres
- `backend/app/models.py` - Document, Summary, QAHistory, Note, Quiz
- `backend/app/routers/documents.py` - upload/list/get/delete
- `backend/app/routers/ai.py` - summarize, ask, extract, compare, notes, quiz
- `backend/app/services/pdf_parser.py` - PyMuPDF -> PyPDF2 fallback
- `backend/app/services/llm.py` - _call() wrapper + mock(), functions: summarize_text, answer_question, extract_info, compare_docs, generate_notes, generate_quiz
- `frontend/src/api/client.js` - axios instance
- `frontend/src/pages/Dashboard.jsx` - upload + list
- `frontend/src/pages/DocumentView.jsx` - tabs for all AI features
- `frontend/src/pages/ComparePage.jsx` - compare 2 docs
- `frontend/src/components/UploadDropzone.jsx` - drag & drop
- `frontend/src/components/QuizView.jsx` - MCQ + scoring
- `docker-compose.yml` - db, backend, frontend

## Env
DATABASE_URL, OPENAI_API_KEY, OPENAI_MODEL, UPLOAD_DIR, MAX_UPLOAD_MB (see .env.example)

## Current status ( Sep 2026 )
- [x] Backend MVP done - all 6 features working with mock fallback
- [x] Frontend MVP done - upload, dashboard, doc view tabs, compare, quiz scoring
- [x] Docker + README
- [ ] Need to push to GitHub (use gh cli)
- [ ] Optional: auth, docx support, chunking for large PDFs

## If you are a new AI continuing this
1. Read this file
2. Check `git log --oneline` to see last commit
3. Run backend/frontend to verify not broken
4. Continue from TODOs above
5. Update this file after each phase

## Decisions made
- PyMuPDF primary because better text extraction, fallback to PyPDF2 for compat
- SQLite fallback so devs don't need postgres immediately
- Mock LLM so demo works without API key - _call() checks USE_MOCK
- Simple tabs UI not separate pages - easier for student flow
- vite proxy for dev, docker-compose for prod-like

## How to continue after context loss
Just prompt new AI: "Read CONTEXT.md and continue building, last TODO was GitHub push" - it will know where we left off.
