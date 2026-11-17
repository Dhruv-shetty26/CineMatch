"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Trash2, Film, Compass } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import { getWatchlist, saveWatchlist } from "@/lib/watchlist";
import { Movie } from "@/lib/types";

export default function WatchlistPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [mounted, setMounted] = useState(false);

  const refreshList = () => {
    setMovies(getWatchlist());
  };

  useEffect(() => {
    setMounted(true);
    refreshList();
    window.addEventListener("watchlist_updated", refreshList);
    return () => window.removeEventListener("watchlist_updated", refreshList);
  }, []);

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear your entire watchlist?")) {
      saveWatchlist([]);
      setMovies([]);
    }
  };

  if (!mounted) {
    return (
      <div className="py-20 text-center text-slate-500">
        Loading saved watchlist...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-charcoal-800 pb-6 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-crimson-500 mb-1">
            <Bookmark className="w-5 h-5 fill-current" />
            <span className="text-xs uppercase font-extrabold tracking-wider">
              Browser Storage
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            My Watchlist
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Saved locally in your browser. No account or backend persistence required.
          </p>
        </div>

        {movies.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-crimson-400 hover:text-white bg-charcoal-900 hover:bg-crimson-700/80 border border-charcoal-800 hover:border-crimson-600 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      {/* Watchlist Grid or Empty State */}
      {movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
          {movies.map((movie) => (
            <MovieCard key={movie.movieId} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-charcoal-900 border border-charcoal-800 flex items-center justify-center text-slate-500 mx-auto">
            <Film className="w-8 h-8 text-amber-500/60" />
          </div>
          <h2 className="text-xl font-bold text-white">Your watchlist is empty</h2>
          <p className="text-sm text-slate-400">
            Browse movies and tap the bookmark icon to save titles for later viewing.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Discover Page</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
