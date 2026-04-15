from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
import jwt
from ..core.config import get_settings


router = APIRouter()
settings = get_settings()


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCredentials(BaseModel):
    email: str
    password: str


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


@router.post("/register", response_model=Token)
def register(creds: UserCredentials) -> Token:
    # Placeholder: insert user into DB, hash password
    token = create_access_token(creds.email)
    return Token(access_token=token)


@router.post("/login", response_model=Token)
def login(creds: UserCredentials) -> Token:
    # Placeholder: verify user credentials
    token = create_access_token(creds.email)
    return Token(access_token=token)


