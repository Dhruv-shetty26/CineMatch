"""
CineMatch API Routes
=====================
All endpoints are mounted under /api/v1 (except /health).

IMPORTANT: The /api/v1/movies/popular route MUST be registered before
/api/v1/movies/{movie_id} so FastAPI matches the literal "popular" path
before treating it as a movie_id integer.
"""

from __future__ import annotations

import logging
from typing import Annotated, Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from ml.recommender import recommender
from app.schemas.models import (
    ErrorDetail,
    ErrorResponse,
    GenreListResponse,
    HealthResponse,
    MovieResponse,
    PaginatedMovies,
    RecommendationResponse,
)

log = logging.getLogger(__name__)

router = APIRouter()

# ── Helpers ───────────────────────────────────────────────────────────────────

def _error(code: str, message: str, status: int) -> JSONResponse:
    body = ErrorResponse(error=ErrorDetail(code=code, message=message))
    return JSONResponse(status_code=status, content=body.model_dump())


def _require_model() -> None:
    if not recommender.is_loaded:
        raise HTTPException(
            status_code=503,
            detail={"error": {"code": "MODEL_NOT_LOADED", "message": "The recommendation model is not available. Please try again later."}},
        )


# ── Health ────────────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse, tags=["health"])
async def health() -> HealthResponse:
    """Health and readiness check. Reports whether the ML model is loaded."""
    return HealthResponse(
        status="ok",
        model_loaded=recommender.is_loaded,
        movie_count=recommender.movie_count if recommender.is_loaded else None,
    )


# ── Genres ────────────────────────────────────────────────────────────────────

@router.get("/api/v1/genres", response_model=GenreListResponse, tags=["catalogue"])
async def list_genres() -> GenreListResponse:
    """Return all distinct genres present in the dataset."""
    _require_model()
    return GenreListResponse(genres=recommender.get_genres())


# ── Movies — popular (MUST be before /{movie_id}) ────────────────────────────

@router.get("/api/v1/movies/popular", response_model=PaginatedMovies, tags=["catalogue"])
async def popular_movies(
    page: Annotated[int, Query(ge=1, description="Page number (1-based)")] = 1,
    limit: Annotated[int, Query(ge=1, le=50, description="Items per page (max 50)")] = 20,
) -> PaginatedMovies:
    """
    Return movies ranked by Bayesian weighted rating (descending).
    Use this endpoint for the /popular page.
    """
    _require_model()
    result = recommender.get_popular(page=page, limit=limit)
    return PaginatedMovies(**result)


# ── Movies — search/browse catalogue ─────────────────────────────────────────

@router.get("/api/v1/movies", response_model=PaginatedMovies, tags=["catalogue"])
async def search_movies(
    q: Annotated[Optional[str], Query(description="Partial title search (case-insensitive)")] = None,
    genre: Annotated[Optional[str], Query(description="Filter by genre name")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
) -> PaginatedMovies:
    """
    Search the movie catalogue by title and/or genre.
    Returns an empty items list (not 404) when no movies match.
    """
    _require_model()
    result = recommender.search(
        q=q or "",
        genre=genre or "",
        page=page,
        limit=limit,
    )
    return PaginatedMovies(**result)


# ── Movies — single movie detail ──────────────────────────────────────────────

@router.get("/api/v1/movies/{movie_id}", response_model=MovieResponse, tags=["catalogue"])
async def get_movie(movie_id: int) -> MovieResponse:
    """
    Return full details for a single movie by its MovieLens movie ID.
    Returns 404 when the ID is not in the dataset.
    """
    _require_model()
    movie = recommender.get_movie(movie_id)
    if movie is None:
        return _error("MOVIE_NOT_FOUND", f"Movie with id {movie_id} was not found.", 404)
    return MovieResponse(**movie.__dict__)


# ── Movies — recommendations ──────────────────────────────────────────────────

@router.get(
    "/api/v1/movies/{movie_id}/recommendations",
    response_model=RecommendationResponse,
    tags=["recommendations"],
)
async def get_recommendations(
    movie_id: int,
    limit: Annotated[int, Query(ge=1, le=20, description="Number of recommendations (max 20)")] = 10,
) -> RecommendationResponse:
    """
    Return similar movies for the given movie_id using TF-IDF cosine similarity.
    The seed movie is excluded from results.
    """
    _require_model()

    # Verify the seed movie exists
    movie = recommender.get_movie(movie_id)
    if movie is None:
        return _error("MOVIE_NOT_FOUND", f"Movie with id {movie_id} was not found.", 404)

    recs = recommender.get_recommendations(movie_id=movie_id, limit=limit)

    from app.schemas.models import RecommendationItem
    items = [
        RecommendationItem(
            movieId=r.movieId,
            title=r.title,
            year=r.year,
            genres=r.genres,
            averageRating=r.averageRating,
            ratingCount=r.ratingCount,
            similarity=r.similarity,
            posterUrl=r.posterUrl,
        )
        for r in recs
    ]

    return RecommendationResponse(sourceMovieId=movie_id, items=items)
