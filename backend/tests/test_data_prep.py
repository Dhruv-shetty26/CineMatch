"""
Tests for the ML training script data preparation logic.
Covers: required files/columns, missing values, duplicate IDs,
row mapping alignment, and empty-tag handling.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import pandas as pd
import pytest

# Allow importing from backend/ root
sys.path.insert(0, str(Path(__file__).parent.parent))

from ml.train_model import (
    _parse_year,
    _load_movies,
    _aggregate_tags,
    _compute_ratings,
    _build_features,
    _validate_dataset,
    DATA_DIR,
)


# ── _parse_year ───────────────────────────────────────────────────────────────

def test_parse_year_standard():
    assert _parse_year("Toy Story (1995)") == 1995

def test_parse_year_missing():
    assert _parse_year("No Year Here") is None

def test_parse_year_trailing_space():
    assert _parse_year("Some Movie (2001)  ") == 2001

def test_parse_year_non_year_parens():
    assert _parse_year("Movie (Part II)") is None


# ── Dataset validation ────────────────────────────────────────────────────────

def test_validate_dataset_passes_with_real_data():
    """Real dataset must pass validation without errors."""
    if not DATA_DIR.exists():
        pytest.skip("Dataset not present — skipping real-data test")
    _validate_dataset(DATA_DIR)  # should not raise


def test_validate_dataset_missing_file(tmp_path):
    with pytest.raises(FileNotFoundError, match="movies.csv"):
        _validate_dataset(tmp_path)


def test_validate_dataset_missing_column(tmp_path):
    # Create movies.csv with wrong columns
    pd.DataFrame({"wrong": [1]}).to_csv(tmp_path / "movies.csv", index=False)
    pd.DataFrame({"userId": [], "movieId": [], "rating": []}).to_csv(
        tmp_path / "ratings.csv", index=False
    )
    pd.DataFrame({"userId": [], "movieId": [], "tag": []}).to_csv(
        tmp_path / "tags.csv", index=False
    )
    with pytest.raises(ValueError, match="missing columns"):
        _validate_dataset(tmp_path)


# ── _aggregate_tags ───────────────────────────────────────────────────────────

def test_aggregate_tags_empty():
    """Movies with no tags get an empty string, not NaN."""
    movies = pd.DataFrame({
        "movieId": [1, 2],
        "title": ["A (2000)", "B (2001)"],
        "genres_list": [["Action"], []],
        "genres_text": ["action", ""],
        "year": [2000, 2001],
    })
    tags = pd.DataFrame({"movieId": pd.Series([], dtype=int), "tag": pd.Series([], dtype=str)})
    result = _aggregate_tags(movies, tags)
    assert result.loc[result["movieId"] == 1, "tags_text"].iloc[0] == ""
    assert result.loc[result["movieId"] == 2, "tags_text"].iloc[0] == ""


def test_aggregate_tags_deduplication():
    movies = pd.DataFrame({
        "movieId": [1],
        "title": ["A (2000)"],
        "genres_list": [["Action"]],
        "genres_text": ["action"],
        "year": [2000],
    })
    tags = pd.DataFrame({
        "movieId": [1, 1, 1],
        "tag": ["fun", "fun", "action"],  # 'fun' appears twice
    })
    result = _aggregate_tags(movies, tags)
    tags_text = result.loc[result["movieId"] == 1, "tags_text"].iloc[0]
    # Deduplicated — 'fun' should appear only once
    words = tags_text.split()
    assert words.count("fun") == 1


# ── _compute_ratings ──────────────────────────────────────────────────────────

def test_weighted_rating_formula():
    """Bayesian WR should lie between global mean C and movie's own R."""
    movies = pd.DataFrame({
        "movieId": [1, 2],
        "title": ["A (2000)", "B (2001)"],
        "genres_list": [["Action"], ["Comedy"]],
        "genres_text": ["action", "comedy"],
        "year": [2000, 2001],
    })
    ratings = pd.DataFrame({
        "userId": [1, 2, 3, 4],
        "movieId": [1, 1, 2, 2],
        "rating": [4.0, 4.0, 2.0, 2.0],
    })
    result = _compute_ratings(movies, ratings)
    # Global mean = (4+4+2+2)/4 = 3.0
    # Movie 1: R=4, v=2, m=10; WR = (2/12)*4 + (10/12)*3 = 0.667+2.5 = 3.167
    wr1 = result.loc[result["movieId"] == 1, "weightedRating"].iloc[0]
    assert 3.0 < wr1 < 4.0  # between global mean and movie's own rating


def test_movies_with_no_ratings_get_zero_count():
    movies = pd.DataFrame({
        "movieId": [99],
        "title": ["Obscure Film (1960)"],
        "genres_list": [[]],
        "genres_text": [""],
        "year": [1960],
    })
    ratings = pd.DataFrame({"userId": [], "movieId": [], "rating": []})
    # Should not crash
    result = _compute_ratings(movies, ratings)
    assert result.loc[result["movieId"] == 99, "ratingCount"].iloc[0] == 0


# ── Feature building ──────────────────────────────────────────────────────────

def test_build_features_combines_genres_and_tags():
    movies = pd.DataFrame({
        "genres_text": ["action comedy"],
        "tags_text": ["funny superhero"],
    })
    features = _build_features(movies)
    assert "action comedy" in features.iloc[0]
    assert "funny superhero" in features.iloc[0]


# ── Real data smoke test ──────────────────────────────────────────────────────

def test_real_data_load_no_errors():
    if not DATA_DIR.exists():
        pytest.skip("Dataset not present")
    movies = _load_movies(DATA_DIR)
    assert len(movies) > 9000
    assert "movieId" in movies.columns
    assert "year" in movies.columns
    assert "genres_list" in movies.columns
    # No duplicate movie IDs
    assert not movies["movieId"].duplicated().any()
