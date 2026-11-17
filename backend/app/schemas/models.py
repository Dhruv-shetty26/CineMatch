"""
Pydantic schemas for CineMatch API requests and responses.
These define the JSON contract between FastAPI and the Next.js frontend.
"""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


# ── Shared building blocks ────────────────────────────────────────────────────

class MovieBase(BaseModel):
    movieId: int
    title: str
    year: Optional[int] = None
    genres: List[str] = []
    averageRating: Optional[float] = None
    ratingCount: Optional[int] = None
    weightedRating: Optional[float] = None
    posterUrl: Optional[str] = None
    overview: Optional[str] = None


# ── Response models ───────────────────────────────────────────────────────────

class MovieResponse(MovieBase):
    """Full movie detail returned by GET /api/v1/movies/{movie_id}"""
    pass


class MovieListItem(BaseModel):
    """Compact representation used in search and popular lists."""
    movieId: int
    title: str
    year: Optional[int] = None
    genres: List[str] = []
    averageRating: Optional[float] = None
    ratingCount: Optional[int] = None
    weightedRating: Optional[float] = None
    posterUrl: Optional[str] = None


class PaginatedMovies(BaseModel):
    """Paginated wrapper for movie list endpoints."""
    items: List[MovieListItem]
    total: int
    page: int
    limit: int
    totalPages: int


class RecommendationItem(BaseModel):
    """A single recommended movie with its similarity score."""
    movieId: int
    title: str
    year: Optional[int] = None
    genres: List[str] = []
    averageRating: Optional[float] = None
    ratingCount: Optional[int] = None
    similarity: float = Field(..., ge=0.0, le=1.0, description="Cosine similarity score (0–1)")
    posterUrl: Optional[str] = None


class RecommendationResponse(BaseModel):
    """Response for GET /api/v1/movies/{movie_id}/recommendations"""
    sourceMovieId: int
    items: List[RecommendationItem]
    model: str = "tfidf-cosine-v1"


class GenreListResponse(BaseModel):
    genres: List[str]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    movie_count: Optional[int] = None


# ── Error model ───────────────────────────────────────────────────────────────

class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorDetail
