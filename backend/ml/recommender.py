"""
CineMatch Recommender
======================
Loads pre-trained TF-IDF artifacts and provides fast inference for:
  - Movie search
  - Movie detail lookup
  - Similar-movie recommendations (cosine similarity)
  - Popular movies (Bayesian weighted rating)
  - Genre listing

The Recommender singleton is loaded once at API startup via lifespan.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from scipy.sparse import load_npz, csr_matrix
from sklearn.metrics.pairwise import cosine_similarity

log = logging.getLogger(__name__)

_HERE = Path(__file__).parent.parent  # backend/
_DEFAULT_MODELS_DIR = Path(os.getenv("MODELS_DIR", _HERE / "models"))
_MAX_RECOMMENDATIONS = 20
_MAX_PAGE_SIZE = 50


@dataclass
class MovieRecord:
    movieId: int
    title: str
    year: int | None
    genres: list[str]
    averageRating: float | None
    ratingCount: int
    weightedRating: float
    posterUrl: str | None = None
    overview: str | None = None


@dataclass
class RecommendationResult:
    movieId: int
    title: str
    year: int | None
    genres: list[str]
    averageRating: float | None
    ratingCount: int
    similarity: float
    posterUrl: str | None = None


class Recommender:
    """
    Thread-safe (read-only after load) recommendation engine.
    Loads artifacts from disk once; all inference is in-memory.
    """

    def __init__(self, models_dir: Path = _DEFAULT_MODELS_DIR) -> None:
        self._models_dir = models_dir
        self._loaded = False

        # Populated by load()
        self._movie_df: pd.DataFrame = pd.DataFrame()
        self._tfidf_matrix: csr_matrix | None = None
        self._idx_to_movieid: list[int] = []
        self._movieid_to_idx: dict[int, int] = {}

    # ── Public ────────────────────────────────────────────────────────────────

    def load(self) -> None:
        """Load all artifacts from disk. Call once at startup."""
        d = self._models_dir
        required = [
            "movie_df.pkl",
            "tfidf_vectorizer.pkl",
            "tfidf_matrix.npz",
            "idx_to_movieid.pkl",
            "movieid_to_idx.pkl",
        ]
        missing = [f for f in required if not (d / f).exists()]
        if missing:
            raise FileNotFoundError(
                f"Model artifacts not found in {d}: {missing}\n"
                "Run 'python -m ml.train_model' from the backend/ directory first."
            )

        log.info("Loading model artifacts from %s …", d)
        self._movie_df = joblib.load(d / "movie_df.pkl")
        # vectorizer loaded but kept for potential future re-inference
        _vectorizer = joblib.load(d / "tfidf_vectorizer.pkl")
        self._tfidf_matrix = load_npz(str(d / "tfidf_matrix.npz"))
        self._idx_to_movieid = joblib.load(d / "idx_to_movieid.pkl")
        self._movieid_to_idx = joblib.load(d / "movieid_to_idx.pkl")

        # ── Integrity checks ──────────────────────────────────────────────────
        n_rows = self._tfidf_matrix.shape[0]
        n_idx = len(self._idx_to_movieid)
        n_df = len(self._movie_df)
        if not (n_rows == n_idx == n_df):
            raise ValueError(
                f"Artifact alignment mismatch: matrix={n_rows} rows, "
                f"idx_to_movieid={n_idx} entries, movie_df={n_df} rows. "
                "Re-run train_model.py to rebuild artifacts."
            )

        self._loaded = True
        log.info(
            "Recommender loaded ✓  movies=%d  matrix=%s",
            n_df,
            self._tfidf_matrix.shape,
        )

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def movie_count(self) -> int:
        return len(self._movie_df) if self._loaded else 0

    # ── Search ────────────────────────────────────────────────────────────────

    def search(
        self,
        q: str = "",
        genre: str = "",
        page: int = 1,
        limit: int = 20,
    ) -> dict[str, Any]:
        """Case-insensitive substring search on title. Optional genre filter."""
        self._require_loaded()
        limit = min(limit, _MAX_PAGE_SIZE)
        page = max(page, 1)

        df = self._movie_df
        if q:
            q_lower = q.strip().lower()
            mask = df["title"].str.lower().str.contains(q_lower, regex=False)
            df = df[mask]
        if genre:
            genre_lower = genre.strip().lower()
            mask = df["genres"].apply(
                lambda gl: any(g.lower() == genre_lower for g in gl)
            )
            df = df[mask]

        # Deterministic ordering: title ascending when scores are equal
        df = df.sort_values("title")

        total = len(df)
        start = (page - 1) * limit
        page_df = df.iloc[start : start + limit]

        return {
            "items": [self._row_to_list_item(row) for _, row in page_df.iterrows()],
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": max(1, -(-total // limit)),  # ceiling division
        }

    # ── Movie detail ──────────────────────────────────────────────────────────

    def get_movie(self, movie_id: int) -> MovieRecord | None:
        self._require_loaded()
        row = self._movie_df[self._movie_df["movieId"] == movie_id]
        if row.empty:
            return None
        return self._row_to_movie_record(row.iloc[0])

    # ── Recommendations ───────────────────────────────────────────────────────

    def get_recommendations(
        self, movie_id: int, limit: int = 10
    ) -> list[RecommendationResult]:
        """
        Compute cosine similarity between the seed movie and all others.
        Returns top-N results, excluding the seed movie itself.
        """
        self._require_loaded()
        limit = min(limit, _MAX_RECOMMENDATIONS)

        idx = self._movieid_to_idx.get(movie_id)
        if idx is None:
            return []

        # Compute similarity for this one row vs. all rows — stays sparse
        seed_vec = self._tfidf_matrix[idx]
        sim_scores = cosine_similarity(seed_vec, self._tfidf_matrix).flatten()

        # Sort descending; exclude seed itself
        sorted_indices = np.argsort(sim_scores)[::-1]
        results: list[RecommendationResult] = []
        for i in sorted_indices:
            if i == idx:
                continue
            mid = self._idx_to_movieid[i]
            row = self._movie_df[self._movie_df["movieId"] == mid]
            if row.empty:
                continue
            r = row.iloc[0]
            results.append(
                RecommendationResult(
                    movieId=int(r["movieId"]),
                    title=str(r["title"]),
                    year=int(r["year"]) if pd.notna(r.get("year")) else None,
                    genres=list(r["genres"]) if isinstance(r["genres"], list) else [],
                    averageRating=float(r["averageRating"]) if pd.notna(r.get("averageRating")) else None,
                    ratingCount=int(r["ratingCount"]),
                    similarity=round(float(sim_scores[i]), 4),
                )
            )
            if len(results) >= limit:
                break
        return results

    # ── Popular ───────────────────────────────────────────────────────────────

    def get_popular(self, page: int = 1, limit: int = 20) -> dict[str, Any]:
        """Return movies sorted by Bayesian weighted rating descending."""
        self._require_loaded()
        limit = min(limit, _MAX_PAGE_SIZE)
        page = max(page, 1)

        df = self._movie_df.sort_values(
            ["weightedRating", "title"], ascending=[False, True]
        )

        total = len(df)
        start = (page - 1) * limit
        page_df = df.iloc[start : start + limit]

        return {
            "items": [self._row_to_list_item(row) for _, row in page_df.iterrows()],
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": max(1, -(-total // limit)),
        }

    # ── Genres ────────────────────────────────────────────────────────────────

    def get_genres(self) -> list[str]:
        """Return a sorted list of all distinct genres in the dataset."""
        self._require_loaded()
        all_genres: set[str] = set()
        for gl in self._movie_df["genres"]:
            if isinstance(gl, list):
                all_genres.update(gl)
        return sorted(all_genres)

    # ── Internals ─────────────────────────────────────────────────────────────

    def _require_loaded(self) -> None:
        if not self._loaded:
            raise RuntimeError("Recommender.load() has not been called.")

    def _row_to_movie_record(self, row: pd.Series) -> MovieRecord:
        return MovieRecord(
            movieId=int(row["movieId"]),
            title=str(row["title"]),
            year=int(row["year"]) if pd.notna(row.get("year")) else None,
            genres=list(row["genres"]) if isinstance(row["genres"], list) else [],
            averageRating=float(row["averageRating"]) if pd.notna(row.get("averageRating")) else None,
            ratingCount=int(row["ratingCount"]),
            weightedRating=float(row["weightedRating"]),
        )

    def _row_to_list_item(self, row: pd.Series) -> dict[str, Any]:
        return {
            "movieId": int(row["movieId"]),
            "title": str(row["title"]),
            "year": int(row["year"]) if pd.notna(row.get("year")) else None,
            "genres": list(row["genres"]) if isinstance(row["genres"], list) else [],
            "averageRating": float(row["averageRating"]) if pd.notna(row.get("averageRating")) else None,
            "ratingCount": int(row["ratingCount"]),
            "weightedRating": float(row["weightedRating"]),
            "posterUrl": None,
        }


# Module-level singleton — imported and loaded by main.py lifespan
recommender = Recommender()
