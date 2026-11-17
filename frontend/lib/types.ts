export interface Movie {
  movieId: number;
  title: string;
  year?: number | null;
  genres: string[];
  averageRating?: number | null;
  ratingCount?: number | null;
  weightedRating?: number | null;
  posterUrl?: string | null;
  overview?: string | null;
}

export interface PaginatedMovies {
  items: Movie[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RecommendationItem extends Movie {
  similarity: number;
}

export interface RecommendationResponse {
  sourceMovieId: number;
  items: RecommendationItem[];
  model: string;
}

export interface GenreListResponse {
  genres: string[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
