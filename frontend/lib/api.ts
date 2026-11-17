import { Movie, PaginatedMovies, RecommendationResponse, GenreListResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiRequestError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = "UNKNOWN_ERROR", status = 500) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.status = status;
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      let code = "HTTP_ERROR";
      let message = `Request failed with status ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData?.error?.message) {
          message = errorData.error.message;
          code = errorData.error.code || code;
        } else if (errorData?.detail) {
          message = typeof errorData.detail === "string" ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch {
        // failed to parse JSON error, fall back to default
      }
      throw new ApiRequestError(message, code, res.status);
    }

    return await res.json();
  } catch (err: unknown) {
    if (err instanceof ApiRequestError) {
      throw err;
    }
    throw new ApiRequestError(
      "Unable to connect to CineMatch backend. Please ensure the API is running.",
      "SERVICE_UNAVAILABLE",
      503
    );
  }
}

export async function fetchHealth(): Promise<{ status: string; model_loaded: boolean; movie_count?: number }> {
  return request<{ status: string; model_loaded: boolean; movie_count?: number }>("/health");
}

export async function fetchMovies(params?: {
  q?: string;
  genre?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedMovies> {
  const sp = new URLSearchParams();
  if (params?.q) sp.append("q", params.q);
  if (params?.genre) sp.append("genre", params.genre);
  if (params?.page) sp.append("page", params.page.toString());
  if (params?.limit) sp.append("limit", params.limit.toString());

  const qs = sp.toString();
  return request<PaginatedMovies>(`/api/v1/movies${qs ? `?${qs}` : ""}`);
}

export async function fetchPopular(page = 1, limit = 20): Promise<PaginatedMovies> {
  return request<PaginatedMovies>(`/api/v1/movies/popular?page=${page}&limit=${limit}`);
}

export async function fetchMovie(movieId: number): Promise<Movie> {
  return request<Movie>(`/api/v1/movies/${movieId}`);
}

export async function fetchRecommendations(movieId: number, limit = 10): Promise<RecommendationResponse> {
  return request<RecommendationResponse>(`/api/v1/movies/${movieId}/recommendations?limit=${limit}`);
}

export async function fetchGenres(): Promise<GenreListResponse> {
  return request<GenreListResponse>("/api/v1/genres");
}
