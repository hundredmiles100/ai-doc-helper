from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import documents, ai

Base.metadata.create_all(bind=engine)

app = FastAPI(title="DocHelper API", version="0.1.0")

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
