from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Document, QAHistory, Note, Quiz, User
from ..schemas import AskRequest, CompareRequest
from ..services import llm
from ..services.auth import get_current_user
import json

router = APIRouter(prefix="/api", tags=["ai"])

def _require_doc(db: Session, doc_id: int, current_user: User):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Doc not found")
    if doc.user_id is not None and doc.user_id != current_user.id:
        raise HTTPException(404, "Doc not found")
    if doc.user_id is None:
        raise HTTPException(404, "Doc not found")
    return doc

def _require_note(db: Session, note_id: int, current_user: User):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(404, "Note not found")
    # ensure owning document belongs to user
    _require_doc(db, note.document_id, current_user)
    return note

@router.post("/summarize/{doc_id}")
def summarize(doc_id: int, body: dict = {}, lang: str = "en", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = _require_doc(db, doc_id, current_user)
    length = body.get("length", "medium") if body else "medium"
    lang = body.get("lang", lang) if body and isinstance(body, dict) else lang
    if not doc.content_text:
        raise HTTPException(400, "No content")
    res = llm.summarize_text(doc.content_text, length, lang=lang or "en")
    return {"summary": res, "document_id": doc_id, "lang": lang}

@router.post("/ask")
def ask(payload: AskRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = _require_doc(db, payload.document_id, current_user)
    if not payload.question.strip():
        raise HTTPException(400, "Empty question")
    lang = getattr(payload, "lang", "en") or "en"
    ans = llm.answer_question(doc.content_text or "", payload.question, lang=lang)
    h = QAHistory(document_id=doc.id, question=payload.question, answer=ans)
    db.add(h)
    db.commit()
    return {"answer": ans, "question": payload.question, "lang": lang}

@router.get("/ask/history/{doc_id}")
def ask_history(doc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_doc(db, doc_id, current_user)
    rows = db.query(QAHistory).filter(QAHistory.document_id == doc_id).order_by(QAHistory.created_at.desc()).limit(20).all()
    return [{"question": r.question, "answer": r.answer, "created_at": r.created_at.isoformat()} for r in rows]

@router.post("/extract/{doc_id}")
def extract(doc_id: int, body: dict = {}, lang: str = "en", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = _require_doc(db, doc_id, current_user)
    # lang from query or body
    lang = body.get("lang", lang) if body and isinstance(body, dict) else lang
    return llm.extract_info(doc.content_text or "", lang=lang or "en")

@router.post("/compare")
def compare(payload: CompareRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    d1 = _require_doc(db, payload.doc_id_1, current_user)
    d2 = _require_doc(db, payload.doc_id_2, current_user)
    if payload.doc_id_1 == payload.doc_id_2:
        raise HTTPException(400, "Pick two different docs")
    lang = getattr(payload, "lang", "en") or "en"
    res = llm.compare_docs(d1.content_text or "", d2.content_text or "", lang=lang)
    return {"comparison": res, "doc1": d1.original_name, "doc2": d2.original_name, "lang": lang}

@router.post("/compare/save")
def save_comparison(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Save comparison result as a Note for doc_id_1
    doc_id = payload.get("doc_id") or payload.get("document_id") or payload.get("doc_id_1")
    content = payload.get("content") or payload.get("comparison") or ""
    if not doc_id or not content.strip():
        raise HTTPException(400, "doc_id and content required")
    doc = _require_doc(db, int(doc_id), current_user)
    n = Note(document_id=doc.id, content=content.strip()[:20000])
    db.add(n)
    db.commit()
    db.refresh(n)
    return {"note_id": n.id, "document_id": doc.id, "content": n.content}

@router.post("/notes/{doc_id}")
def create_notes(doc_id: int, body: dict = {}, lang: str = "en", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = _require_doc(db, doc_id, current_user)
    lang = body.get("lang", lang) if body and isinstance(body, dict) else lang
    content = llm.generate_notes(doc.content_text or "", lang=lang or "en")
    n = Note(document_id=doc.id, content=content)
    db.add(n)
    db.commit()
    db.refresh(n)
    return {"notes": content, "note_id": n.id, "lang": lang}

@router.post("/notes/custom/{doc_id}")
def create_custom_note(doc_id: int, body: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = _require_doc(db, doc_id, current_user)
    content = (body.get("content") or body.get("notes") or "").strip()
    if not content:
        raise HTTPException(400, "content required")
    n = Note(document_id=doc.id, content=content[:20000])
    db.add(n)
    db.commit()
    db.refresh(n)
    return {"note_id": n.id, "content": n.content, "document_id": doc.id}

@router.get("/notes/{doc_id}")
def get_notes(doc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_doc(db, doc_id, current_user)
    rows = db.query(Note).filter(Note.document_id == doc_id).order_by(Note.created_at.desc()).all()
    return [{"id": x.id, "content": x.content, "created_at": x.created_at.isoformat()} for x in rows]

@router.post("/quiz/{doc_id}")
def create_quiz(doc_id: int, body: dict = {}, lang: str = "en", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = _require_doc(db, doc_id, current_user)
    num = body.get("num_questions", 5) if body else 5
    lang = body.get("lang", lang) if body and isinstance(body, dict) else lang
    num = max(3, min(int(num), 10))
    qs = llm.generate_quiz(doc.content_text or "", num, lang=lang or "en")
    q = Quiz(document_id=doc.id, title=f"Quiz for {doc.original_name}", questions_json=json.dumps(qs))
    db.add(q)
    db.commit()
    db.refresh(q)
    return {"quiz_id": q.id, "title": q.title, "questions": qs, "lang": lang}

@router.get("/quiz/{doc_id}")
def list_quiz(doc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_doc(db, doc_id, current_user)
    rows = db.query(Quiz).filter(Quiz.document_id == doc_id).order_by(Quiz.created_at.desc()).all()
    out = []
    for r in rows:
        try:
            qs = json.loads(r.questions_json)
        except:
            qs = []
        out.append({"id": r.id, "title": r.title, "questions": qs, "created_at": r.created_at.isoformat()})
    return out

@router.post("/quiz/from-notes/{note_id}")
def quiz_from_notes(note_id: int, body: dict = {}, lang: str = "en", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    note = _require_note(db, note_id, current_user)
    lang = body.get("lang", lang) if body and isinstance(body, dict) else lang
    qs = llm.generate_quiz(note.content or "", 5, lang=lang or "en")
    q = Quiz(document_id=note.document_id, title="Quiz from notes", questions_json=json.dumps(qs))
    db.add(q)
    db.commit()
    db.refresh(q)
    return {"quiz_id": q.id, "questions": qs, "lang": lang}
