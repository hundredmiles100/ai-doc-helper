from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Document, QAHistory, Note, Quiz
from ..schemas import AskRequest, CompareRequest
from ..services import llm
import json

router = APIRouter(prefix="/api", tags=["ai"])

@router.post("/summarize/{doc_id}")
def summarize(doc_id: int, body: dict = {}, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Doc not found")
    length = body.get("length", "medium") if body else "medium"
    if not doc.content_text:
        raise HTTPException(400, "No content")
    res = llm.summarize_text(doc.content_text, length)
    return {"summary": res, "document_id": doc_id}

@router.post("/ask")
def ask(payload: AskRequest, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == payload.document_id).first()
    if not doc:
        raise HTTPException(404, "Doc not found")
    if not payload.question.strip():
        raise HTTPException(400, "Empty question")
    ans = llm.answer_question(doc.content_text or "", payload.question)
    h = QAHistory(document_id=doc.id, question=payload.question, answer=ans)
    db.add(h)
    db.commit()
    return {"answer": ans, "question": payload.question}

@router.get("/ask/history/{doc_id}")
def ask_history(doc_id: int, db: Session = Depends(get_db)):
    rows = db.query(QAHistory).filter(QAHistory.document_id == doc_id).order_by(QAHistory.created_at.desc()).limit(20).all()
    return [{"question": r.question, "answer": r.answer, "created_at": r.created_at.isoformat()} for r in rows]

@router.post("/extract/{doc_id}")
def extract(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Not found")
    return llm.extract_info(doc.content_text or "")

@router.post("/compare")
def compare(payload: CompareRequest, db: Session = Depends(get_db)):
    d1 = db.query(Document).filter(Document.id == payload.doc_id_1).first()
    d2 = db.query(Document).filter(Document.id == payload.doc_id_2).first()
    if not d1 or not d2:
        raise HTTPException(404, "One or both docs not found")
    if payload.doc_id_1 == payload.doc_id_2:
        raise HTTPException(400, "Pick two different docs")
    res = llm.compare_docs(d1.content_text or "", d2.content_text or "")
    return {"comparison": res, "doc1": d1.original_name, "doc2": d2.original_name}

@router.post("/notes/{doc_id}")
def create_notes(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Not found")
    content = llm.generate_notes(doc.content_text or "")
    n = Note(document_id=doc.id, content=content)
    db.add(n)
    db.commit()
    db.refresh(n)
    return {"notes": content, "note_id": n.id}

@router.get("/notes/{doc_id}")
def get_notes(doc_id: int, db: Session = Depends(get_db)):
    rows = db.query(Note).filter(Note.document_id == doc_id).order_by(Note.created_at.desc()).all()
    return [{"id": x.id, "content": x.content, "created_at": x.created_at.isoformat()} for x in rows]

@router.post("/quiz/{doc_id}")
def create_quiz(doc_id: int, body: dict = {}, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Not found")
    num = body.get("num_questions", 5) if body else 5
    num = max(3, min(int(num), 10))
    qs = llm.generate_quiz(doc.content_text or "", num)
    q = Quiz(document_id=doc.id, title=f"Quiz for {doc.original_name}", questions_json=json.dumps(qs))
    db.add(q)
    db.commit()
    db.refresh(q)
    return {"quiz_id": q.id, "title": q.title, "questions": qs}

@router.get("/quiz/{doc_id}")
def list_quiz(doc_id: int, db: Session = Depends(get_db)):
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
def quiz_from_notes(note_id: int, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(404, "Note not found")
    qs = llm.generate_quiz(note.content or "", 5)
    q = Quiz(document_id=note.document_id, title="Quiz from notes", questions_json=json.dumps(qs))
    db.add(q)
    db.commit()
    db.refresh(q)
    return {"quiz_id": q.id, "questions": qs}
