from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from ..services.tmdb import get_popular_movies, search_movies, get_movie_details


router = APIRouter()


class Movie(BaseModel):
    id: int
    title: str
    overview: Optional[str] = None
    genres: list[str] = []
    rating: Optional[float] = None
    poster: Optional[str] = None
    year: Optional[str] = None


@router.get("/", response_model=List[Movie])
def list_movies(q: Optional[str] = Query(default=None)) -> List[Movie]:
    """Get movies - popular if no query, search results if query provided"""
    if q:
        results = search_movies(q)
    else:
        results = get_popular_movies()
    
    movies = []
    for m in results:
        genres = [g.get("name", "") for g in m.get("genres", [])] if isinstance(m.get("genres"), list) else []
        if not genres and m.get("genre_ids"):
            # Fallback: genre_ids would need mapping, skip for now
            genres = []
        
        poster_path = m.get("poster_path")
        poster = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else None
        
        movies.append(Movie(
            id=m.get("id", 0),
            title=m.get("title", ""),
            overview=m.get("overview"),
            genres=genres,
            rating=m.get("vote_average"),
            poster=poster,
            year=m.get("release_date", "")[:4] if m.get("release_date") else None
        ))
    
    return movies


@router.get("/{movie_id}", response_model=Movie)
def get_movie(movie_id: int) -> Movie:
    """Get movie details by ID from TMDB"""
    details = get_movie_details(movie_id)
    if not details:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    genres = [g.get("name", "") for g in details.get("genres", [])]
    poster_path = details.get("poster_path")
    poster = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else None
    
    return Movie(
        id=details.get("id", 0),
        title=details.get("title", ""),
        overview=details.get("overview"),
        genres=genres,
        rating=details.get("vote_average"),
        poster=poster,
        year=details.get("release_date", "")[:4] if details.get("release_date") else None
    )


