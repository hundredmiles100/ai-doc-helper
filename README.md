# AI Document Helper

Upload PDFs and do stuff with them - summarize, chat, extract key points, compare two docs, generate notes, and turn notes into quizzes. Built this for students who have to deal with 100-page textbooks.

example: upload a textbook -> ask "explain chapter 4 in simple language" -> get notes -> generate quiz.

## Stack
- Frontend: React + Vite
- Backend: FastAPI + SQLAlchemy
- DB: PostgreSQL (falls back to SQLite for local dev)
- LLM: OpenAI API (gpt-4o-mini by default) - works in mock mode if no key

## Quick start (local without docker)

### Backend
```bash
cd backend
pip install -r requirements.txt
# create .env - copy from .env.example
# set OPENAI_API_KEY if you have one, otherwise it runs in mock mode
uvicorn app.main:app --reload --port 8000
```
API at http://localhost:8000 - docs at /docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs at http://localhost:5173, proxies /api to backend.

### With Docker (recommended)
```bash
docker-compose up --build
```
- frontend: http://localhost:5173
- backend: http://localhost:8000
- postgres: localhost:5432

create a `.env` in root for OPENAI_API_KEY, or set it in docker-compose env.

## Env vars
```
DATABASE_URL=postgresql://postgres:postgres@db:5432/dochelper
OPENAI_API_KEY=sk-xxxx
OPENAI_MODEL=gpt-4o-mini
UPLOAD_DIR=uploads
MAX_UPLOAD_MB=20
```

If `OPENAI_API_KEY` is empty, all AI endpoints return mock data so you can still demo the UI.

## API
- `POST /api/upload` - multipart pdf
- `GET /api/documents` - list
- `GET /api/documents/{id}` - get one
- `POST /api/summarize/{id}` `{length: short|medium|detailed}`
- `POST /api/ask` `{document_id, question}`
- `POST /api/extract/{id}`
- `POST /api/compare` `{doc_id_1, doc_id_2}`
- `POST /api/notes/{id}` / `GET /api/notes/{id}`
- `POST /api/quiz/{id}` / `GET /api/quiz/{id}` / `POST /api/quiz/from-notes/{note_id}`

## Notes
- PDFs parsed with PyMuPDF first, fallback to PyPDF2. Scanned PDFs (image only) will have no text - shows placeholder.
- Uploads stored in `backend/uploads/`.
- Frontend is pretty minimal, uses axios + react-router.

TODO:
- auth
- support docx
- better handling for big files (chunking)
- vector search for better Q&A

---

built over a weekend, lmk if you find bugs
