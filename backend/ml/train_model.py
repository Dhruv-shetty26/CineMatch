"""
CineMatch ML Training Script
=============================
Run this script once to build and save the TF-IDF recommendation artifacts.

Usage (from the backend/ directory):
    python -m ml.train_model

Artifacts saved to models/:
    movie_df.pkl          — preprocessed DataFrame with all movie metadata
    tfidf_vectorizer.pkl  — fitted TfidfVectorizer
    tfidf_matrix.npz      — sparse TF-IDF matrix (rows = movies)
    idx_to_movieid.pkl    — list mapping matrix row index → movieId
"""

from __future__ import annotations

import os
import re
import sys
import logging
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from scipy.sparse import save_npz
from sklearn.feature_extraction.text import TfidfVectorizer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Paths ─────────────────────────────────────────────────────────────────────
# Resolve relative to this file so the script works regardless of CWD
_HERE = Path(__file__).parent.parent  # backend/
DATA_DIR = Path(os.getenv("DATA_DIR", _HERE / "data" / "ml-latest-small"))
MODELS_DIR = Path(os.getenv("MODELS_DIR", _HERE / "models"))

# ── Bayesian rating parameters ────────────────────────────────────────────────
BAYESIAN_MIN_VOTES: int = int(os.getenv("BAYESIAN_MIN_VOTES", "10"))

# ── Required CSV columns ──────────────────────────────────────────────────────
REQUIRED = {
    "movies.csv": ["movieId", "title", "genres"],
    "ratings.csv": ["userId", "movieId", "rating"],
    "tags.csv": ["userId", "movieId", "tag"],
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _validate_dataset(data_dir: Path) -> None:
    """Fail fast if any required file or column is missing."""
    for filename, cols in REQUIRED.items():
        path = data_dir / filename
        if not path.exists():
            raise FileNotFoundError(
                f"Required dataset file not found: {path}\n"
                "Download from https://files.grouplens.org/datasets/movielens/ml-latest-small.zip "
                f"and place the contents in {data_dir}/"
            )
        df = pd.read_csv(path, nrows=1)
        missing = [c for c in cols if c not in df.columns]
        if missing:
            raise ValueError(f"{filename} is missing columns: {missing}")
    log.info("Dataset validation passed ✓")


def _parse_year(title: str) -> int | None:
    """Extract the 4-digit year from a MovieLens title like 'Toy Story (1995)'."""
    match = re.search(r"\((\d{4})\)\s*$", title)
    return int(match.group(1)) if match else None


def _load_movies(data_dir: Path) -> pd.DataFrame:
    df = pd.read_csv(data_dir / "movies.csv")
    df["movieId"] = df["movieId"].astype(int)
    df["year"] = df["title"].apply(_parse_year)
    df["genres_list"] = df["genres"].apply(
        lambda g: g.split("|") if isinstance(g, str) and g != "(no genres listed)" else []
    )
    df["genres_text"] = df["genres_list"].apply(
        lambda gl: " ".join(gl).replace("-", " ").lower()
    )
    log.info(f"Loaded {len(df):,} movies")
    return df


def _load_ratings(data_dir: Path) -> pd.DataFrame:
    df = pd.read_csv(data_dir / "ratings.csv")
    df["movieId"] = df["movieId"].astype(int)
    return df


def _load_tags(data_dir: Path) -> pd.DataFrame:
    df = pd.read_csv(data_dir / "tags.csv")
    df["movieId"] = df["movieId"].astype(int)
    df["tag"] = df["tag"].astype(str).str.lower().str.strip()
    return df


def _compute_ratings(movies: pd.DataFrame, ratings: pd.DataFrame) -> pd.DataFrame:
    """Add averageRating, ratingCount and Bayesian weightedRating to movies DataFrame."""
    stats = (
        ratings.groupby("movieId")["rating"]
        .agg(averageRating="mean", ratingCount="count")
        .reset_index()
    )
    movies = movies.merge(stats, on="movieId", how="left")
    movies["averageRating"] = movies["averageRating"].round(2)
    movies["ratingCount"] = movies["ratingCount"].fillna(0).astype(int)

    # Bayesian Weighted Rating: WR = (v / (v + m)) * R + (m / (v + m)) * C
    # C = global mean rating, m = minimum votes threshold (configurable)
    C = ratings["rating"].mean()  # global mean across all ratings
    m = BAYESIAN_MIN_VOTES

    def _wr(row: pd.Series) -> float:
        v = row["ratingCount"]
        R = row["averageRating"] if not pd.isna(row["averageRating"]) else 0.0
        return (v / (v + m)) * R + (m / (v + m)) * C

    movies["weightedRating"] = movies.apply(_wr, axis=1).round(4)
    log.info(
        f"Ratings computed — global mean={C:.3f}, min_votes={m}, "
        f"movies_with_ratings={stats['movieId'].nunique():,}"
    )
    return movies


def _aggregate_tags(movies: pd.DataFrame, tags: pd.DataFrame) -> pd.DataFrame:
    """Join aggregated (deduplicated) tags onto the movies DataFrame."""
    tag_agg = (
        tags.groupby("movieId")["tag"]
        .apply(lambda ts: " ".join(sorted(set(ts))))
        .reset_index()
        .rename(columns={"tag": "tags_text"})
    )
    movies = movies.merge(tag_agg, on="movieId", how="left")
    movies["tags_text"] = movies["tags_text"].fillna("")
    tagged = (movies["tags_text"] != "").sum()
    log.info(f"Tags aggregated — {tagged:,} movies have at least one tag")
    return movies


def _build_features(movies: pd.DataFrame) -> pd.Series:
    """Combine genres and tags into a single feature string per movie."""
    # genres_text already lowercased; tags_text already lowercased
    return (movies["genres_text"] + " " + movies["tags_text"]).str.strip()


def train(data_dir: Path = DATA_DIR, models_dir: Path = MODELS_DIR) -> None:
    log.info("=" * 60)
    log.info("CineMatch — TF-IDF model training")
    log.info(f"Data   : {data_dir}")
    log.info(f"Models : {models_dir}")
    log.info("=" * 60)

    # 1. Validate
    _validate_dataset(data_dir)

    # 2. Load
    movies = _load_movies(data_dir)
    ratings = _load_ratings(data_dir)
    tags = _load_tags(data_dir)

    # 3. Enrich
    movies = _compute_ratings(movies, ratings)
    movies = _aggregate_tags(movies, tags)

    # 4. Build feature strings
    movies["feature_text"] = _build_features(movies)
    empty_features = (movies["feature_text"] == "").sum()
    if empty_features > 0:
        log.warning(f"{empty_features} movies have empty feature text — they will be less recommendable")

    # 5. Fit TF-IDF
    log.info("Fitting TF-IDF vectorizer …")
    vectorizer = TfidfVectorizer(
        analyzer="word",
        ngram_range=(1, 2),   # unigrams + bigrams for genre combos
        min_df=1,
        sublinear_tf=True,    # apply log(1+tf) to dampen high-frequency terms
    )
    tfidf_matrix = vectorizer.fit_transform(movies["feature_text"])
    log.info(
        f"TF-IDF matrix shape: {tfidf_matrix.shape} "
        f"(vocab size: {len(vectorizer.vocabulary_):,})"
    )

    # 6. Build row-index ↔ movieId mapping
    # This is crucial — it lets the recommender find any movieId's row quickly
    idx_to_movieid: list[int] = movies["movieId"].tolist()
    movieid_to_idx: dict[int, int] = {mid: i for i, mid in enumerate(idx_to_movieid)}

    # Sanity: verify no duplicate movieIds (would corrupt the index)
    if movies["movieId"].duplicated().any():
        raise ValueError("Duplicate movieIds detected — dataset may be corrupted")

    # 7. Persist artifacts
    models_dir.mkdir(parents=True, exist_ok=True)

    # Drop helper columns not needed at inference time (keep df small)
    save_cols = [
        "movieId", "title", "year", "genres_list", "averageRating",
        "ratingCount", "weightedRating", "feature_text",
    ]
    movies_save = movies[save_cols].copy()
    movies_save = movies_save.rename(columns={"genres_list": "genres"})

    joblib.dump(movies_save, models_dir / "movie_df.pkl")
    joblib.dump(vectorizer, models_dir / "tfidf_vectorizer.pkl")
    joblib.dump(idx_to_movieid, models_dir / "idx_to_movieid.pkl")
    joblib.dump(movieid_to_idx, models_dir / "movieid_to_idx.pkl")
    save_npz(str(models_dir / "tfidf_matrix.npz"), tfidf_matrix)

    log.info("Artifacts saved:")
    for f in sorted(models_dir.iterdir()):
        log.info(f"  {f.name}  ({f.stat().st_size / 1024:.1f} KB)")

    log.info("=" * 60)
    log.info("Training complete ✓")
    log.info("=" * 60)


if __name__ == "__main__":
    try:
        train()
    except (FileNotFoundError, ValueError) as exc:
        log.error(f"Training failed: {exc}")
        sys.exit(1)
