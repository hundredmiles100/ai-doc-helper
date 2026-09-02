import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import documents, ai

Base.metadata.create_all(bind=engine)

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

app.include_router(documents.router)
app.include_router(ai.router)

@app.get("/")
def root():
    return {"status": "ok", "message": "DocHelper API running"}

@app.get("/health")
def health():
    return {"ok": True}
