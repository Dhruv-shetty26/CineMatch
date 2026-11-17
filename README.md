# CineMatch

> A full-stack movie discovery and recommendation web application powered by Machine Learning on the official MovieLens dataset.

---

## 🎨 Design & Palette
The UI features a cinematic high-contrast theme customized with:
- **Deep Charcoal Black** (`#07090e`, `#0b0e14`, `#161b26`): immersive cinema backdrop
- **Fiery Amber Gold** (`#f59e0b`, `#fbbf24`): highlights, primary accents, star ratings
- **Cool Cyan Blue** (`#06b6d4`, `#22d3ee`): AI match scores, exploration filters, icons
- **Crimson Red** (`#e11d48`, `#be123c`): watchlist badge and bookmarks

---

## 🚀 Technology Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Python 3.12, FastAPI, Pydantic v2, Uvicorn
- **Machine Learning**: Scikit-Learn, Pandas, NumPy, Scipy (Sparse Matrix), Joblib
- **Dataset**: MovieLens Latest Small (9,742 movies, 100,836 ratings, 3,683 user tags)
- **ML Approach**: Content-based filtering using TF-IDF vectorization and query-time cosine similarity.

---

## 📂 Repository Structure

```
CineMatch/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app lifecycle and CORS
│   │   ├── api/routes.py        # /health, /api/v1/movies, /popular, /recommendations, /genres
│   │   └── schemas/models.py    # Pydantic schemas
│   ├── ml/
│   │   ├── train_model.py       # TF-IDF model training script
│   │   └── recommender.py       # Recommender inference engine
│   ├── data/
│   │   └── ml-latest-small/     # MovieLens CSV dataset (movies, ratings, tags, links)
│   ├── models/                  # Generated joblib & npz sparse model artifacts
│   ├── tests/                   # Pytest suite (47 automated tests)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── layout.tsx           # Global shell & Header
│   │   ├── page.tsx             # Discover page with hero search & popular spotlight
│   │   ├── popular/page.tsx     # Paginated popular movies (Bayesian ranking)
│   │   ├── watchlist/page.tsx   # LocalStorage browser watchlist
│   │   └── movies/[id]/page.tsx # Movie details and AI similar movie recommendations
│   ├── components/              # Header, SearchBox, MovieCard, MovieGrid, SkeletonGrid, ErrorState
│   ├── lib/                     # api.ts, watchlist.ts, types.ts
│   ├── public/                  # SVG fallback poster
│   └── tailwind.config.ts       # Customized theme tokens
└── README.md
```

---

## ⚙️ Quick Start

### 1. Backend Setup

```bash
cd backend

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify dataset & train ML model (generates artifacts into models/)
python -m ml.train_model

# Run the automated test suite (47 tests)
pytest

# Launch FastAPI backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Backend will be available at: `http://localhost:8000`  
Interactive Swagger docs: `http://localhost:8000/docs`

---

### 2. Frontend Setup

```bash
cd frontend

# Install npm dependencies
npm install

# Build Next.js application
npm run build

# Start production server
npm run start
```
Frontend will be available at: `http://localhost:3000`

---

## 🧠 Machine Learning Engine

### 1. Feature Representation
For each movie in MovieLens, we combine:
- **Genres**: normalized into space-separated terms
- **User-generated Tags**: lowercased and deduplicated

### 2. TF-IDF & Cosine Similarity
- A `TfidfVectorizer(ngram_range=(1,2), sublinear_tf=True)` is fitted over all movies.
- The resulting sparse TF-IDF matrix is saved as `tfidf_matrix.npz` to preserve minimal memory footprint.
- At inference time, recommendations compute cosine similarity between the seed movie's sparse vector and all other titles, excluding the seed movie itself.

### 3. Bayesian Weighted Rating for Popularity
Popular titles are ranked using Bayesian weighted rating:
$$WR = \left(\frac{v}{v + m}\right) R + \left(\frac{m}{v + m}\right) C$$
- $R$: Average rating of the movie
- $v$: Number of ratings for the movie
- $C$: Global mean rating across all movies ($\approx 3.50$)
- $m$: Minimum vote threshold ($m = 10$)
This prevents movies with a single 5-star rating from outranking critically acclaimed titles.

---

## 🧪 Testing Verification

Run the full pytest suite from `backend/`:
```bash
pytest -v
```
All **47 tests** cover:
- Data validation & missing column handling
- Release year regex extraction
- Tag deduplication and aggregation
- Bayesian weighted rating formula calculations
- TF-IDF recommendation determinism & seed self-exclusion
- FastAPI endpoints (`/health`, `/api/v1/movies`, `/popular`, `/{id}/recommendations`, `/genres`)
- 404, 422, and error response contracts

---

## 🔒 Security & Privacy
- Zero user data or watchlist contents are transmitted to the backend (localStorage only).
- API keys (e.g. optional TMDB) are read strictly from backend environment variables.
