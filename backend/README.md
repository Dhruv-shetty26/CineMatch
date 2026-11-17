# CineMatch Backend

FastAPI service powering CineMatch movie discovery and recommendation.

## Setup
1. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
2. Train the ML model:
   ```bash
   python -m ml.train_model
   ```
3. Run test suite:
   ```bash
   pytest
   ```
4. Start FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
