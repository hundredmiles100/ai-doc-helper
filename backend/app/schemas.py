from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class DocumentOut(BaseModel):
    id: int
    filename: str
    original_name: str
    page_count: int
    file_size: int
    created_at: datetime
    class Config:
        from_attributes = True

class AskRequest(BaseModel):
    document_id: int
    question: str
    lang: Optional[str] = "en"

class CompareRequest(BaseModel):
    doc_id_1: int
    doc_id_2: int
    lang: Optional[str] = "en"
