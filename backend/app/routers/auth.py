from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from ..database import get_db
from ..models import User
from ..services.auth import get_password_hash, authenticate_user, create_access_token, get_current_user, get_user_by_username

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    user_id: int

class UserOut(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    created_at: str
    class Config:
        from_attributes = True

@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    username = payload.username.strip()
    if len(username) < 3:
        raise HTTPException(400, "Username must be at least 3 characters")
    if len(payload.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    if get_user_by_username(db, username):
        raise HTTPException(400, "Username already taken")
    if payload.email:
        existing = db.query(User).filter(User.email == payload.email.strip()).first()
        if existing:
            raise HTTPException(400, "Email already registered")
    user = User(
        username=username,
        email=payload.email.strip() if payload.email else None,
        hashed_password=get_password_hash(payload.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "username": user.username, "user_id": user.id}

@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2PasswordRequestForm expects username & password fields (form-encoded)
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password", headers={"WWW-Authenticate": "Bearer"})
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "username": user.username, "user_id": user.id}

# JSON login alternative (for frontend fetch JSON)
class LoginJSON(BaseModel):
    username: str
    password: str

@router.post("/login-json", response_model=TokenResponse)
def login_json(payload: LoginJSON, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "username": user.username, "user_id": user.id}

@router.post("/guest", response_model=TokenResponse)
def guest(db: Session = Depends(get_db)):
    # Free one-click guest — no password, no email, instant private session
    import uuid, secrets
    # generate unique guest name like guest_a3f9
    for _ in range(5):
        uname = f"guest_{secrets.token_hex(3)}"
        if not get_user_by_username(db, uname):
            break
    else:
        uname = f"guest_{uuid.uuid4().hex[:6]}"
    # random password not needed but we store a random hash so account is not guessable
    random_pw = secrets.token_urlsafe(16)
    user = User(username=uname, email=None, hashed_password=get_password_hash(random_pw))
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "username": user.username, "user_id": user.id}

@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "email": current_user.email, "created_at": current_user.created_at.isoformat()}
