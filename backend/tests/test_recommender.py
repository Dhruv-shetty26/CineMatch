"""
Tests for the Recommender inference class.
Covers: load, search, recommendations, popular, genres, edge cases.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from ml.recommender import Recommender, _DEFAULT_MODELS_DIR


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def rec() -> Recommender:
    """Load the recommender once for the whole module."""
    if not _DEFAULT_MODELS_DIR.exists() or not any(_DEFAULT_MODELS_DIR.iterdir()):
        pytest.skip("Model artifacts not built — run train_model.py first")
    r = Recommender()
    r.load()
    return r


# ── Load / integrity ──────────────────────────────────────────────────────────

def test_recommender_loads(rec):
    assert rec.is_loaded
    assert rec.movie_count > 9000


def test_recommender_requires_load():
    r = Recommender()
    with pytest.raises(RuntimeError, match="load\\(\\)"):
        r.search()


# ── Search ────────────────────────────────────────────────────────────────────

def test_search_toy_story(rec):
    result = rec.search(q="Toy Story")
    assert result["total"] >= 1
    titles = [item["title"] for item in result["items"]]
    assert any("Toy Story" in t for t in titles)


def test_search_case_insensitive(rec):
    lower = rec.search(q="toy story")
    upper = rec.search(q="TOY STORY")
    assert lower["total"] == upper["total"]


def test_search_unknown_returns_empty(rec):
    result = rec.search(q="xyzzy_no_such_movie_exists_12345")
    assert result["total"] == 0
    assert result["items"] == []


def test_search_pagination(rec):
    page1 = rec.search(q="", page=1, limit=5)
    page2 = rec.search(q="", page=2, limit=5)
    ids_p1 = {item["movieId"] for item in page1["items"]}
    ids_p2 = {item["movieId"] for item in page2["items"]}
    assert ids_p1.isdisjoint(ids_p2), "Paginated pages must not overlap"


def test_search_limit_capped(rec):
    result = rec.search(q="", limit=100)  # above max (50)
    assert len(result["items"]) <= 50


# ── Movie detail ──────────────────────────────────────────────────────────────

def test_get_movie_known(rec):
    movie = rec.get_movie(1)  # Toy Story
    assert movie is not None
    assert movie.movieId == 1
    assert "Toy Story" in movie.title


def test_get_movie_unknown(rec):
    assert rec.get_movie(999_999_999) is None


# ── Recommendations ───────────────────────────────────────────────────────────

def test_recommendations_excludes_seed(rec):
    recs = rec.get_recommendations(movie_id=1, limit=10)
    movie_ids = [r.movieId for r in recs]
    assert 1 not in movie_ids, "Seed movie must not appear in its own recommendations"


def test_recommendations_limit_respected(rec):
    recs = rec.get_recommendations(movie_id=1, limit=5)
    assert len(recs) <= 5


def test_recommendations_limit_capped(rec):
    recs = rec.get_recommendations(movie_id=1, limit=999)
    assert len(recs) <= 20  # hard max


def test_recommendations_scores_descending(rec):
    recs = rec.get_recommendations(movie_id=1, limit=10)
    scores = [r.similarity for r in recs]
    assert scores == sorted(scores, reverse=True), "Recommendations must be sorted by similarity desc"


def test_recommendations_deterministic(rec):
    recs1 = rec.get_recommendations(movie_id=1, limit=10)
    recs2 = rec.get_recommendations(movie_id=1, limit=10)
    assert [r.movieId for r in recs1] == [r.movieId for r in recs2]


def test_recommendations_unknown_movie_returns_empty(rec):
    recs = rec.get_recommendations(movie_id=999_999_999, limit=10)
    assert recs == []


def test_recommendations_similarity_in_range(rec):
    recs = rec.get_recommendations(movie_id=1, limit=20)
    for r in recs:
        assert 0.0 <= r.similarity <= 1.0


# ── Popular ───────────────────────────────────────────────────────────────────

def test_popular_sorted_by_weighted_rating(rec):
    result = rec.get_popular(page=1, limit=50)
    scores = [item["weightedRating"] for item in result["items"]]
    assert scores == sorted(scores, reverse=True)


def test_popular_pagination_no_overlap(rec):
    p1 = rec.get_popular(page=1, limit=10)
    p2 = rec.get_popular(page=2, limit=10)
    ids1 = {i["movieId"] for i in p1["items"]}
    ids2 = {i["movieId"] for i in p2["items"]}
    assert ids1.isdisjoint(ids2)


# ── Genres ────────────────────────────────────────────────────────────────────

def test_genres_list_non_empty(rec):
    genres = rec.get_genres()
    assert len(genres) > 0


def test_genres_list_sorted(rec):
    genres = rec.get_genres()
    assert genres == sorted(genres)


def test_genres_contains_common(rec):
    genres = set(rec.get_genres())
    for expected in ["Action", "Comedy", "Drama"]:
        assert expected in genres
