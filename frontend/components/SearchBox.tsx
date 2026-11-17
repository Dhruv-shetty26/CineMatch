"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, X } from "lucide-react";
import { fetchMovies } from "@/lib/api";
import { Movie } from "@/lib/types";

export default function SearchBox({ placeholder = "Search by movie title (e.g. Toy Story, Matrix)..." }: { placeholder?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search effect
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const data = await fetchMovies({ q: trimmed, limit: 6 });
        setResults(data.items);
        setIsOpen(true);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (movieId: number) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/movies/${movieId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && results.length > 0) {
      handleSelect(results[0].movieId);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <div className="absolute left-4 pointer-events-none text-slate-400">
          <Search className="w-5 h-5 text-cyan-500" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3.5 bg-charcoal-850/90 hover:bg-charcoal-850 focus:bg-charcoal-800 text-white placeholder-slate-400 rounded-xl border border-charcoal-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none text-sm sm:text-base shadow-inner"
        />
        {loading ? (
          <div className="absolute right-4 text-cyan-400 animate-spin">
            <Loader2 className="w-5 h-5" />
          </div>
        ) : query ? (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-4 text-slate-400 hover:text-white p-1 rounded-md"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Auto-suggest dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-charcoal-900 border border-charcoal-700/80 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-charcoal-800/60">
          {results.length > 0 ? (
            results.map((movie) => (
              <button
                key={movie.movieId}
                onClick={() => handleSelect(movie.movieId)}
                className="w-full px-4 py-3 text-left hover:bg-charcoal-800/80 flex items-center justify-between group transition-colors"
              >
                <div className="flex flex-col pr-2">
                  <span className="font-semibold text-slate-200 group-hover:text-amber-400 transition-colors text-sm">
                    {movie.title}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                    {movie.year && <span className="text-slate-500">{movie.year}</span>}
                    {movie.genres?.length > 0 && (
                      <span className="truncate max-w-[280px]">
                        {movie.genres.slice(0, 3).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                {movie.averageRating ? (
                  <div className="flex items-center gap-1 bg-charcoal-800 px-2 py-1 rounded-md text-xs font-semibold text-amber-400 border border-charcoal-700">
                    <span>★</span>
                    <span>{movie.averageRating.toFixed(1)}</span>
                  </div>
                ) : null}
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-slate-400">
              No matching movies found in MovieLens catalogue.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
