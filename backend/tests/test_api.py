"""
Integration tests for the FastAPI endpoints.
Uses httpx AsyncClient against the real app (requires model artifacts).
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, str(Path(__file__).parent.parent))

from ml.recommender import _DEFAULT_MODELS_DIR, Recommender


@pytest.fixture(scope="module", autouse=True)
def skip_if_no_model():
    if not _DEFAULT_MODELS_DIR.exists() or not any(_DEFAULT_MODELS_DIR.iterdir()):
        pytest.skip("Model artifacts not built — run train_model.py first")


@pytest_asyncio.fixture(scope="module")
async def client():
    from app.main import app
    # Manually load the recommender so it's available during tests
    # (lifespan runs but we ensure the singleton is loaded)
    from ml import recommender as rec_module
    if not rec_module.recommender.is_loaded:
        rec_module.recommender.load()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", follow_redirects=True
    ) as c:
        yield c


# ── Health ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health_ok(client):
    r = await client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert isinstance(data["model_loaded"], bool)


# ── Genres ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_genres_returns_list(client):
    r = await client.get("/api/v1/genres")
    assert r.status_code == 200
    data = r.json()
    assert "genres" in data
    assert len(data["genres"]) > 0


# ── Movie search ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_search_returns_paginated(client):
    r = await client.get("/api/v1/movies?q=Toy+Story")
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_search_no_results(client):
    r = await client.get("/api/v1/movies?q=xyzzy_no_such_movie_12345")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 0
    assert data["items"] == []


@pytest.mark.asyncio
async def test_search_invalid_page(client):
    r = await client.get("/api/v1/movies?page=0")
    assert r.status_code == 422  # FastAPI validation error


@pytest.mark.asyncio
async def test_search_limit_too_large(client):
    r = await client.get("/api/v1/movies?limit=200")
    assert r.status_code == 422


# ── Popular ───────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_popular_returns_sorted(client):
    r = await client.get("/api/v1/movies/popular?limit=10")
    assert r.status_code == 200
    data = r.json()
    scores = [item["weightedRating"] for item in data["items"]]
    assert scores == sorted(scores, reverse=True)


# ── Movie detail ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_movie_detail_known(client):
    r = await client.get("/api/v1/movies/1")
    assert r.status_code == 200
    data = r.json()
    assert data["movieId"] == 1
    assert "Toy Story" in data["title"]


@pytest.mark.asyncio
async def test_movie_detail_not_found(client):
    r = await client.get("/api/v1/movies/999999999")
    assert r.status_code == 404
    data = r.json()
    assert "error" in data
    assert data["error"]["code"] == "MOVIE_NOT_FOUND"


# ── Recommendations ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_recommendations_response_shape(client):
    r = await client.get("/api/v1/movies/1/recommendations?limit=5")
    assert r.status_code == 200
    data = r.json()
    assert data["sourceMovieId"] == 1
    assert isinstance(data["items"], list)
    assert len(data["items"]) <= 5
    assert data["model"] == "tfidf-cosine-v1"


@pytest.mark.asyncio
async def test_recommendations_no_self(client):
    r = await client.get("/api/v1/movies/1/recommendations?limit=20")
    ids = [item["movieId"] for item in r.json()["items"]]
    assert 1 not in ids


@pytest.mark.asyncio
async def test_recommendations_unknown_movie(client):
    r = await client.get("/api/v1/movies/999999999/recommendations")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_recommendations_limit_capped(client):
    r = await client.get("/api/v1/movies/1/recommendations?limit=999")
    assert r.status_code == 422  # exceeds Query max=20
