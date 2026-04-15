from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List
import os
import pickle


router = APIRouter()


MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "model.pkl")
_model = None


def load_model():
    global _model
    if _model is None and os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            _model = pickle.load(f)
    return _model


class RecRequest(BaseModel):
    user_id: str | None = None
    movie_id: int | None = None


class RecItem(BaseModel):
    movie_id: int
    score: float


@router.post("/", response_model=List[RecItem])
def recommend(payload: RecRequest) -> List[RecItem]:
    model = load_model()
    # Placeholder: return mock recommendations if no model
    if not model:
        return [
            RecItem(movie_id=1, score=0.95),
            RecItem(movie_id=2, score=0.90),
            RecItem(movie_id=3, score=0.88),
        ]
    # If model exists, call model.predict or similar. Placeholder:
    return [RecItem(movie_id=1, score=0.99)]


