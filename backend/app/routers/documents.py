import os, uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Document, User
from ..services.pdf_parser import extract_text_from_pdf
from ..services.auth import get_current_user
from ..config import UPLOAD_DIR, MAX_UPLOAD_MB

router = APIRouter(prefix="/api", tags=["documents"])
os.makedirs(UPLOAD_DIR, exist_ok=True)

def _get_owned_doc_or_404(db: Session, doc_id: int, current_user: User):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    # owner check: null docs are treated as not found for privacy; only owner can access
    if doc.user_id is not None and doc.user_id != current_user.id:
        raise HTTPException(404, "Document not found")
    if doc.user_id is None:
        # legacy doc with no owner — deny access (isolate). Optionally migrate: assign to current user on first access?
        raise HTTPException(404, "Document not found")
    return doc

@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
    doc = Document(user_id=current_user.id, filename=saved_name, original_name=file.filename, file_path=save_path, file_size=len(content), content_text=text, page_count=pages)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"id": doc.id, "original_name": doc.original_name, "page_count": doc.page_count, "file_size": doc.file_size, "preview": text[:500]}

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    total_docs = len(docs)
    total_pages = sum(d.page_count or 0 for d in docs)
    total_size = sum(d.file_size or 0 for d in docs)
    avg_pages = round(total_pages / total_docs, 1) if total_docs else 0
    avg_size_kb = round((total_size / total_docs) / 1024, 1) if total_docs else 0
    total_size_mb = round(total_size / (1024*1024), 2)
    # counts for other entities — only for docs owned by current user
    try:
        from ..models import Note, Quiz, QAHistory
        owned_ids = [d.id for d in docs]
        if owned_ids:
            note_count = db.query(Note).filter(Note.document_id.in_(owned_ids)).count()
            quiz_count = db.query(Quiz).filter(Quiz.document_id.in_(owned_ids)).count()
            qa_count = db.query(QAHistory).filter(QAHistory.document_id.in_(owned_ids)).count()
        else:
            note_count = quiz_count = qa_count = 0
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
def list_docs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    docs = db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.created_at.desc()).all()
    return [{"id": d.id, "original_name": d.original_name, "page_count": d.page_count, "file_size": d.file_size, "created_at": d.created_at.isoformat(), "preview": (d.content_text or "")[:200]} for d in docs]

@router.get("/documents/{doc_id}")
def get_doc(doc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = _get_owned_doc_or_404(db, doc_id, current_user)
    return {"id": doc.id, "original_name": doc.original_name, "filename": doc.filename, "page_count": doc.page_count, "file_size": doc.file_size, "created_at": doc.created_at.isoformat(), "content_text": doc.content_text[:5000], "full_length": len(doc.content_text or "")}

@router.delete("/documents/{doc_id}")
def delete_doc(doc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = _get_owned_doc_or_404(db, doc_id, current_user)
    try:
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
    except:
        pass
    db.delete(doc)
    db.commit()
    return {"ok": True}
