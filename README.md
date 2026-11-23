CineMatch – ML-Based Movie Recommendation System

Introduction

CineMatch is a machine learning-based movie recommendation system that helps users discover movies similar to the ones they already enjoy. It uses movie genres and tags to recommend relevant movies.

Features

- Movie Discovery: Search and browse movies from the MovieLens dataset.
- Movie Details: View movie titles and genres.
- Similar Movie Recommendations: Find movies based on genre and tag similarity.
- Popular Movies: Explore movies ranked using Bayesian weighted ratings.
- Personal Watchlist: Save favourite movies using browser localStorage.

Technologies Used

Frontend:

- Next.js
- React
- TypeScript
- Tailwind CSS

Backend:

- Python
- FastAPI
- REST API

Machine Learning and Data Processing:

- Scikit-learn
- TF-IDF
- Cosine Similarity
- Pandas
- NumPy
- Joblib

Dataset

CineMatch uses the MovieLens Latest Small Dataset provided by GroupLens Research.

The dataset contains the following files:

1. "movies.csv" – Contains movie IDs, titles and genres.
2. "ratings.csv" – Contains user IDs, movie IDs and ratings.
3. "tags.csv" – Contains user-generated tags and descriptive keywords.
4. "links.csv" – Contains external IMDb and TMDb movie IDs.

How It Works

1. The user searches for or selects a movie.
2. The system extracts the movie's genres and tags.
3. TF-IDF converts movie features into numerical vectors.
4. Cosine Similarity measures the similarity between movies.
5. Movies are ranked according to their similarity scores.
6. The system displays the Top-N similar movie recommendations.

Machine Learning Algorithm

CineMatch uses Content-Based Filtering.

- TF-IDF: Converts movie genres and tags into numerical vectors.
- Cosine Similarity: Measures similarity between movie feature vectors.
- Recommendation Ranking: Sorts movies based on similarity scores and displays the most relevant recommendations.

System Architecture

The system consists of three main components:

1. Frontend: Next.js and React provide the user interface.
2. Backend: Python and FastAPI handle application requests.
3. ML Recommendation Engine: Uses TF-IDF and Cosine Similarity to generate movie recommendations.

Installation and Execution

1. Clone the repository:

git clone <repository-url>

2. Navigate to the project folder:

cd <project-folder>

3. Install the frontend and backend dependencies using the respective dependency files.

4. Configure the required environment variables.

5. Run the frontend and backend using the commands specified in the project configuration.

Future Scope

- Personalized recommendations based on user preferences.
- Hybrid recommendation techniques.
- Improved recommendation accuracy and evaluation.
- Enhanced user feedback and watchlist features.

Project Team

- Abhishek Thotanthillaya – 4MT24IS004
- Ajith R Loni – 4MT24IS009
- Anmitha Bangera – 4MT24IS034
- Dhruv T Shetty – 4MT24IS047
- Disha Nayak – 4MT24IS049
- Gowthami – 4MT24IS055

Conclusion

CineMatch provides a simple and interactive way to discover movies using Machine Learning. It uses Content-Based Filtering, TF-IDF and Cosine Similarity to recommend movies based on genres and tags.

CineMatch – Discover movies based on what you already love!