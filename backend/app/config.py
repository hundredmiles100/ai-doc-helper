import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dochelper.db")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "")  # for Groq https://api.groq.com/openai/v1 / OpenRouter https://openrouter.ai/api/v1
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "20"))
# Auth
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production-please-set-env")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")) * 24 * 7  # 7 days default
