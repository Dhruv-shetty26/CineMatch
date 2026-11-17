"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Star,
  Bookmark,
  Sparkles,
  ArrowLeft,
  Flame,
  Check,
  Info,
} from "lucide-react";
import MovieCard from "@/components/MovieCard";
import { SkeletonGrid } from "@/components/SkeletonCard";
import ErrorState from "@/components/ErrorState";
import { fetchMovie, fetchRecommendations } from "@/lib/api";
import { Movie, RecommendationItem } from "@/lib/types";
import { isInWatchlist, addToWatchlist, removeFromWatchlist } from "@/lib/watchlist";

export default function MovieDetailPage() {
  const params = useParams();
  const movieId = Number(params.id);

  const [movie, setMovie] = useState<Movie | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recsLoading, setRecsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const loadData = async () => {
    if (isNaN(movieId)) {
      setError("Invalid movie identifier.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchMovie(movieId);
      setMovie(data);
      setSaved(isInWatchlist(data.movieId));

      // Trigger recommendation fetch
      setRecsLoading(true);
      fetchRecommendations(movieId, 10)
        .then((recData) => setRecommendations(recData.items))
        .catch((err) => console.error("Recommendations fetch error:", err))
        .finally(() => setRecsLoading(false));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Movie not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [movieId]);

  const toggleWatchlist = () => {
    if (!movie) return;
    if (saved) {
      removeFromWatchlist(movie.movieId);
      setSaved(false);
    } else {
      addToWatchlist(movie);
      setSaved(true);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>Back to Discover</span>
        </Link>
        <ErrorState
          title="Movie Not Found"
          message={error}
          onRetry={loadData}
        />
      </div>
    );
  }

  if (loading || !movie) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-6 w-32 bg-charcoal-800 rounded" />
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 aspect-[2/3] bg-charcoal-800 rounded-2xl" />
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-charcoal-800 rounded w-3/4" />
            <div className="h-4 bg-charcoal-800 rounded w-1/3" />
            <div className="h-20 bg-charcoal-800 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Navigation Breadcrumb */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4 text-cyan-400" />
        <span>Back to Discover</span>
      </Link>

      {/* Hero Movie Presentation */}
      <div className="relative overflow-hidden rounded-3xl bg-charcoal-900 border border-charcoal-800 p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row gap-8 items-start">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Poster / Fallback */}
        <div className="relative w-full max-w-[240px] aspect-[2/3] rounded-2xl overflow-hidden border border-charcoal-700/80 shadow-2xl flex-shrink-0 bg-charcoal-950 mx-auto md:mx-0">
          <Image
            src={movie.posterUrl || "/placeholder-poster.svg"}
            alt={movie.title}
            fill
            priority
            sizes="240px"
            className="object-cover"
          />
        </div>

        {/* Info & Metadata */}
        <div className="flex-1 space-y-6 relative z-10 w-full">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {movie.year && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-charcoal-800 text-slate-300 border border-charcoal-700">
                  {movie.year}
                </span>
              )}
              <span className="text-xs font-mono text-slate-500">
                MovieLens ID: #{movie.movieId}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              {movie.title}
            </h1>
          </div>

          {/* Rating stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-charcoal-850 border border-charcoal-700/80 rounded-xl p-3">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                Average Rating
              </span>
              <div className="flex items-center gap-1.5 text-amber-400 text-lg font-black">
                <Star className="w-5 h-5 fill-current" />
                <span>{movie.averageRating ? movie.averageRating.toFixed(2) : "N/A"}</span>
                <span className="text-xs text-slate-500 font-normal">/ 5.0</span>
              </div>
            </div>

            <div className="bg-charcoal-850 border border-charcoal-700/80 rounded-xl p-3">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                Ratings Count
              </span>
              <div className="text-slate-100 text-lg font-black">
                {movie.ratingCount ? movie.ratingCount.toLocaleString() : "0"}
                <span className="text-xs text-slate-500 font-normal ml-1">votes</span>
              </div>
            </div>

            {movie.weightedRating !== undefined && movie.weightedRating !== null && (
              <div className="bg-charcoal-850 border border-charcoal-700/80 rounded-xl p-3 col-span-2 sm:col-span-1">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Bayesian Score</span>
                </span>
                <div className="text-amber-400 text-lg font-black">
                  {movie.weightedRating.toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {/* Genres */}
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Genres
            </span>
            <div className="flex flex-wrap gap-2">
              {movie.genres?.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 rounded-lg bg-charcoal-800 text-slate-200 border border-charcoal-700 text-xs font-semibold"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Overview if present, otherwise note */}
          {movie.overview ? (
            <div className="space-y-1">
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Overview
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {movie.overview}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-charcoal-850/60 border border-charcoal-800 text-xs text-slate-400">
              <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>
                Standard MovieLens record. Content similarity is derived from verified dataset genres &amp; user tags.
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={toggleWatchlist}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                saved
                  ? "bg-crimson-600 hover:bg-crimson-700 text-white shadow-lg shadow-crimson-600/30"
                  : "bg-charcoal-800 hover:bg-charcoal-700 text-slate-200 border border-charcoal-600"
              }`}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>In Watchlist</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>Save to Watchlist</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI Recommendations Section */}
      <section className="space-y-6 pt-4">
        <div className="border-b border-charcoal-800 pb-4">
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs uppercase font-extrabold tracking-wider">
              Scikit-Learn TF-IDF Cosine Similarity
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Similar Movies You Might Enjoy
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Ranked mathematically by cosine distance over combined genre combinations and
            user-generated tags from MovieLens. Match scores reflect metadata feature overlap.
          </p>
        </div>

        {recsLoading ? (
          <SkeletonGrid count={5} />
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
            {recommendations.map((rec) => (
              <MovieCard
                key={rec.movieId}
                movie={rec}
                similarity={rec.similarity}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-charcoal-900 border border-charcoal-800 rounded-2xl text-slate-400 text-sm">
            No similar movies found for this title.
          </div>
        )}
      </section>
    </div>
  );
}
