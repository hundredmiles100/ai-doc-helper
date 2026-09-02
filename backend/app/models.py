from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255))
    file_path = Column(String(500))
    file_size = Column(Integer)
    content_text = Column(Text)
    page_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    summaries = relationship("Summary", back_populates="document", cascade="all, delete-orphan")
    questions = relationship("QAHistory", back_populates="document", cascade="all, delete-orphan")

class Summary(Base):
    __tablename__ = "summaries"
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    summary_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    document = relationship("Document", back_populates="summaries")

class QAHistory(Base):
    __tablename__ = "qa_history"
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    question = Column(Text)
    answer = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    document = relationship("Document", back_populates="questions")

class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    title = Column(String(255))
    questions_json = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
