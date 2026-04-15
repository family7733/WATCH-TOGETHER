import requests
from typing import Optional, List, Dict, Any
from ..core.config import get_settings

settings = get_settings()
TMDB_BASE = "https://api.themoviedb.org/3"
TMDB_IMG = "https://image.tmdb.org/t/p"


def get_tmdb_headers() -> Dict[str, str]:
    """Get headers for TMDB API requests"""
    headers = {"Accept": "application/json"}
    if settings.tmdb_read_token:
        headers["Authorization"] = f"Bearer {settings.tmdb_read_token}"
    return headers


def get_tmdb_params() -> Dict[str, str]:
    """Get query params for TMDB API requests"""
    params = {}
    if settings.tmdb_api_key and not settings.tmdb_read_token:
        params["api_key"] = settings.tmdb_api_key
    return params


def get_popular_movies() -> List[Dict[str, Any]]:
    """Fetch popular movies from TMDB"""
    try:
        url = f"{TMDB_BASE}/movie/popular"
        response = requests.get(
            url,
            headers=get_tmdb_headers(),
            params=get_tmdb_params(),
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        return data.get("results", [])
    except Exception as e:
        print(f"TMDB API error: {e}")
        return []


def search_movies(query: str) -> List[Dict[str, Any]]:
    """Search movies on TMDB"""
    try:
        url = f"{TMDB_BASE}/search/movie"
        params = get_tmdb_params()
        params.update({"query": query, "language": "en-US", "include_adult": False})
        response = requests.get(
            url,
            headers=get_tmdb_headers(),
            params=params,
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        return data.get("results", [])
    except Exception as e:
        print(f"TMDB search error: {e}")
        return []


def get_movie_details(movie_id: int) -> Optional[Dict[str, Any]]:
    """Get movie details by ID from TMDB"""
    try:
        url = f"{TMDB_BASE}/movie/{movie_id}"
        params = get_tmdb_params()
        params["language"] = "en-US"
        response = requests.get(
            url,
            headers=get_tmdb_headers(),
            params=params,
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"TMDB movie details error: {e}")
        return None

