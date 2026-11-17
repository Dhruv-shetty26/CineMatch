"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Flame, Film, ArrowRight } from "lucide-react";
import SearchBox from "@/components/SearchBox";
import MovieGrid from "@/components/MovieGrid";
import { SkeletonGrid } from "@/components/SkeletonCard";
import ErrorState from "@/components/ErrorState";
import { fetchPopular, fetchMovies, fetchGenres } from "@/lib/api";
import { Movie } from "@/lib/types";

export default function DiscoverPage() {
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [genreFilter, setGenreFilter] = useState<string>("");
  const [genres, setGenres] = useState<string[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [popData, genreData] = await Promise.all([
        fetchPopular(1, 10),
        fetchGenres(),
      ]);
      setPopularMovies(popData.items);
      setGenres(genreData.genres);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load movie catalogue"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When a genre pill is clicked
  useEffect(() => {
    if (!genreFilter) {
      setFilteredMovies([]);
      return;
    }

    setFilterLoading(true);
    fetchMovies({ genre: genreFilter, limit: 15 })
      .then((data) => setFilteredMovies(data.items))
      .catch((err) => console.error("Genre filter error:", err))
      .finally(() => setFilterLoading(false));
  }, [genreFilter]);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-charcoal-850 via-charcoal-900 to-charcoal-950 border border-charcoal-800 p-8 sm:p-14 text-center shadow-2xl">
        {/* Glow orb accents */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-charcoal-800/90 border border-charcoal-700 text-xs font-semibold text-amber-400 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Content-Based Filtering · TF-IDF &amp; Cosine Similarity</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Discover Your Next <br />
            <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-crimson-500 bg-clip-text text-transparent">
              Cinematic Obsession
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Search 9,700+ verified MovieLens films. Open any movie to unlock
            mathematically ranked recommendations based on shared genres and user tags.
          </p>

          <div className="pt-2">
            <SearchBox />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      {error ? (
        <ErrorState onRetry={loadData} message={error} />
      ) : loading ? (
        <div className="space-y-6">
          <div className="h-6 w-48 bg-charcoal-800 rounded animate-pulse" />
          <SkeletonGrid count={10} />
        </div>
      ) : (
        <>
          {/* Genre Explorer Pills */}
          {genres.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Film className="w-4 h-4 text-cyan-400" />
                  <span>Browse by Genre</span>
                </h2>
                {genreFilter && (
                  <button
                    onClick={() => setGenreFilter("")}
                    className="text-xs text-slate-400 hover:text-white underline underline-offset-2"
                  >
                    Clear filter
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {genres.map((g) => {
                  const isSelected = genreFilter === g;
                  return (
                    <button
                      key={g}
                      onClick={() => setGenreFilter(isSelected ? "" : g)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-cyan-500 text-charcoal-950 font-bold shadow-md shadow-cyan-500/20"
                          : "bg-charcoal-900 hover:bg-charcoal-800 text-slate-300 border border-charcoal-800 hover:border-charcoal-700"
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Filtered Genre Results (if any genre selected) */}
          {genreFilter && (
            <section className="space-y-4 pt-4 border-t border-charcoal-850">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{genreFilter} Movies</span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-normal">
                  {filteredMovies.length} titles
                </span>
              </h2>
              {filterLoading ? (
                <SkeletonGrid count={5} />
              ) : filteredMovies.length > 0 ? (
                <MovieGrid movies={filteredMovies} />
              ) : (
                <p className="text-slate-500 text-sm">No movies found for this genre.</p>
              )}
            </section>
          )}

          {/* Popular Spotlight Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <span>Popular Titles</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ranked by Bayesian weighted rating (incorporating average rating &amp; rating counts)
                </p>
              </div>
              <Link
                href="/popular"
                className="text-xs sm:text-sm font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 group"
              >
                <span>View all</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <MovieGrid movies={popularMovies} showRanks />
          </section>
        </>
      )}
    </div>
  );
}
