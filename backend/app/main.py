import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import documents, ai, auth

Base.metadata.create_all(bind=engine)

# --- lightweight migration: add user_id to documents if missing (sqlite without alembic) ---
try:
    from sqlalchemy import inspect, text
    insp = inspect(engine)
    if "documents" in insp.get_table_names():
        cols = [c["name"] for c in insp.get_columns("documents")]
        if "user_id" not in cols:
            # add column nullable
            with engine.begin() as conn:
                # sqlite needs simple ALTER
                conn.execute(text("ALTER TABLE documents ADD COLUMN user_id INTEGER REFERENCES users(id)"))
            print("migrated: added documents.user_id")
    if "users" not in insp.get_table_names():
        # ensure users created (create_all already did, but double check)
        Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"migration check failed: {e}")

# hide docs in production unless ENABLE_DOCS=true
ENV = os.getenv("ENV", "development")
ENABLE_DOCS = os.getenv("ENABLE_DOCS", "true" if ENV != "production" else "false").lower() in ("true","1","yes")
docs_url = "/docs" if ENABLE_DOCS else None
redoc_url = "/redoc" if ENABLE_DOCS else None
openapi_url = "/openapi.json" if ENABLE_DOCS else None

app = FastAPI(title="DocHelper API", version="0.1.0", docs_url=docs_url, redoc_url=redoc_url, openapi_url=openapi_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(ai.router)

@app.get("/")
def root():
    return {"status": "ok", "message": "DocHelper API running"}

@app.get("/health")
def health():
    return {"ok": True}
