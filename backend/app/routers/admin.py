from fastapi import APIRouter, HTTPException


router = APIRouter()


@router.get("/stats")
def stats() -> dict[str, int]:
    return {"users": 0, "movies": 2}


