import os, uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Document
from ..services.pdf_parser import extract_text_from_pdf
from ..config import UPLOAD_DIR, MAX_UPLOAD_MB

router = APIRouter(prefix="/api", tags=["documents"])
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files allowed")
    content = await file.read()
    size_mb = len(content) / (1024*1024)
    if size_mb > MAX_UPLOAD_MB:
        raise HTTPException(400, f"File too large. Max {MAX_UPLOAD_MB}MB")
    ext = os.path.splitext(file.filename)[1]
    saved_name = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(UPLOAD_DIR, saved_name)
    with open(save_path, "wb") as f:
        f.write(content)
    text, pages = extract_text_from_pdf(save_path)
    if not text.strip():
        text = "(No extractable text - scanned PDF?)"
    doc = Document(filename=saved_name, original_name=file.filename, file_path=save_path, file_size=len(content), content_text=text, page_count=pages)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"id": doc.id, "original_name": doc.original_name, "page_count": doc.page_count, "file_size": doc.file_size, "preview": text[:500]}

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    docs = db.query(Document).all()
    total_docs = len(docs)
    total_pages = sum(d.page_count or 0 for d in docs)
    total_size = sum(d.file_size or 0 for d in docs)
    avg_pages = round(total_pages / total_docs, 1) if total_docs else 0
    avg_size_kb = round((total_size / total_docs) / 1024, 1) if total_docs else 0
    total_size_mb = round(total_size / (1024*1024), 2)
    # counts for other entities (optional, import lazily)
    try:
        from ..models import Note, Quiz, QAHistory
        note_count = db.query(Note).count()
        quiz_count = db.query(Quiz).count()
        qa_count = db.query(QAHistory).count()
    except:
        note_count = quiz_count = qa_count = 0
    # latest doc
    latest = max(docs, key=lambda d: d.created_at) if docs else None
    return {
        "total_docs": total_docs,
        "total_pages": total_pages,
        "avg_pages": avg_pages,
        "total_size": total_size,
        "total_size_mb": total_size_mb,
        "avg_size_kb": avg_size_kb,
        "note_count": note_count,
        "quiz_count": quiz_count,
        "qa_count": qa_count,
        "latest_doc": {"id": latest.id, "original_name": latest.original_name, "created_at": latest.created_at.isoformat()} if latest else None,
    }

@router.get("/documents")
def list_docs(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    return [{"id": d.id, "original_name": d.original_name, "page_count": d.page_count, "file_size": d.file_size, "created_at": d.created_at.isoformat(), "preview": (d.content_text or "")[:200]} for d in docs]

@router.get("/documents/{doc_id}")
def get_doc(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    return {"id": doc.id, "original_name": doc.original_name, "filename": doc.filename, "page_count": doc.page_count, "file_size": doc.file_size, "created_at": doc.created_at.isoformat(), "content_text": doc.content_text[:5000], "full_length": len(doc.content_text or "")}

@router.delete("/documents/{doc_id}")
def delete_doc(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Not found")
    try:
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
    except:
        pass
    db.delete(doc)
    db.commit()
    return {"ok": True}
