import { Movie } from "./types";

const WATCHLIST_STORAGE_KEY = "cinematch_watchlist";

export function getWatchlist(): Movie[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Validate entries have at least movieId and title
      return parsed.filter((item) => item && typeof item.movieId === "number" && typeof item.title === "string");
    }
  } catch (err) {
    console.error("Failed to parse watchlist from localStorage:", err);
  }
  return [];
}

export function saveWatchlist(movies: Movie[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(movies));
    window.dispatchEvent(new Event("watchlist_updated"));
  } catch (err) {
    console.error("Failed to save watchlist to localStorage:", err);
  }
}

export function addToWatchlist(movie: Movie): void {
  const current = getWatchlist();
  if (!current.some((m) => m.movieId === movie.movieId)) {
    // Store concise snapshot
    const item: Movie = {
      movieId: movie.movieId,
      title: movie.title,
      year: movie.year,
      genres: movie.genres || [],
      averageRating: movie.averageRating,
      ratingCount: movie.ratingCount,
      weightedRating: movie.weightedRating,
      posterUrl: movie.posterUrl,
    };
    saveWatchlist([...current, item]);
  }
}

export function removeFromWatchlist(movieId: number): void {
  const current = getWatchlist();
  saveWatchlist(current.filter((m) => m.movieId !== movieId));
}

export function isInWatchlist(movieId: number): boolean {
  const current = getWatchlist();
  return current.some((m) => m.movieId === movieId);
}
