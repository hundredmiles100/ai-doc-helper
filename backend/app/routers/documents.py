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
