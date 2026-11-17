"use client";

import { useEffect, useState } from "react";
import { Flame, ChevronLeft, ChevronRight } from "lucide-react";
import MovieGrid from "@/components/MovieGrid";
import { SkeletonGrid } from "@/components/SkeletonCard";
import ErrorState from "@/components/ErrorState";
import { fetchPopular } from "@/lib/api";
import { Movie } from "@/lib/types";

export default function PopularPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPopular(p, 20);
      setMovies(data.items);
      setTotalPages(data.totalPages);
      setPage(p);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load popular movies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(1);
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-charcoal-800 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Flame className="w-5 h-5" />
            <span className="text-xs uppercase font-extrabold tracking-wider">
              Bayesian Weighted Rating
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Popular Movies
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Ranked using Bayesian weighted rating: titles with few ratings are
            dampened towards the global average, avoiding ranking noise from 1-vote movies.
          </p>
        </div>

        {/* Page status */}
        {!loading && !error && (
          <span className="text-xs text-slate-400 bg-charcoal-900 border border-charcoal-800 px-3 py-1.5 rounded-lg self-start sm:self-auto">
            Page <strong className="text-amber-400">{page}</strong> of{" "}
            <strong>{totalPages}</strong>
          </span>
        )}
      </div>

      {/* Grid Content */}
      {error ? (
        <ErrorState message={error} onRetry={() => loadPage(page)} />
      ) : loading ? (
        <SkeletonGrid count={20} />
      ) : (
        <>
          <MovieGrid
            movies={movies}
            showRanks
          />

          {/* Pagination Controls */}
          <div className="flex items-center justify-center gap-3 pt-6 border-t border-charcoal-850">
            <button
              onClick={() => loadPage(page - 1)}
              disabled={page <= 1 || loading}
              className="px-4 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-slate-200 border border-charcoal-700 disabled:opacity-30 disabled:pointer-events-none text-sm font-semibold flex items-center gap-1.5 transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-cyan-400" />
              <span>Previous</span>
            </button>

            <span className="text-sm text-slate-400 px-3">
              {page} / {totalPages}
            </span>

            <button
              onClick={() => loadPage(page + 1)}
              disabled={page >= totalPages || loading}
              className="px-4 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-slate-200 border border-charcoal-700 disabled:opacity-30 disabled:pointer-events-none text-sm font-semibold flex items-center gap-1.5 transition-all"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
