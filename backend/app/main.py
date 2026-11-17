"""
CineMatch FastAPI Application
==============================
Entry point for the backend API server.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ml.recommender import recommender
from app.api.routes import router

# Load .env from the backend/ directory
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the ML model once at startup; nothing to tear down."""
    try:
        recommender.load()
    except FileNotFoundError as exc:
        log.error("Could not load model artifacts: %s", exc)
        # API still starts but /health will report model_loaded=False
    yield


app = FastAPI(
    title="CineMatch API",
    description="Movie discovery and recommendation API powered by TF-IDF content-based filtering.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
_cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:3000")
_cors_origins = [o.strip() for o in _cors_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(router)
