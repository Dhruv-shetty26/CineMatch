"use client";

import Link from "next/link";
import Image from "next/image";
import { Bookmark, Star, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { Movie } from "@/lib/types";
import { isInWatchlist, addToWatchlist, removeFromWatchlist } from "@/lib/watchlist";

interface MovieCardProps {
  movie: Movie;
  similarity?: number; // 0 to 1
  rank?: number;
}

export default function MovieCard({ movie, similarity, rank }: MovieCardProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isInWatchlist(movie.movieId));
  }, [movie.movieId]);

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (saved) {
      removeFromWatchlist(movie.movieId);
      setSaved(false);
    } else {
      addToWatchlist(movie);
      setSaved(true);
    }
  };

  return (
    <div className="group relative bg-charcoal-900 border border-charcoal-800 hover:border-charcoal-700 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/5 flex flex-col h-full">
      {/* Top Banner / Badges */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
        {rank !== undefined ? (
          <span className="px-2 py-0.5 rounded-md bg-charcoal-950/80 backdrop-blur-md border border-charcoal-700 text-amber-500 text-xs font-black shadow-sm">
            #{rank}
          </span>
        ) : similarity !== undefined ? (
          <span className="px-2 py-0.5 rounded-md bg-charcoal-950/90 backdrop-blur-md border border-cyan-500/40 text-cyan-400 text-xs font-bold flex items-center gap-1 shadow-sm">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            {Math.round(similarity * 100)}% match
          </span>
        ) : <div />}

        {/* Watchlist Quick Button */}
        <button
          onClick={handleWatchlistToggle}
          aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
          className={`pointer-events-auto p-1.5 rounded-lg backdrop-blur-md transition-all ${
            saved
              ? "bg-crimson-600 text-white shadow-md shadow-crimson-600/30"
              : "bg-charcoal-950/80 text-slate-400 hover:text-white hover:bg-charcoal-800 border border-charcoal-700/60"
          }`}
        >
          <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Poster Image / Fallback Container */}
      <Link href={`/movies/${movie.movieId}`} className="relative aspect-[2/3] w-full overflow-hidden bg-charcoal-950 block">
        <Image
          src={movie.posterUrl || "/placeholder-poster.svg"}
          alt={movie.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-transparent to-transparent opacity-80" />
      </Link>

      {/* Movie Details */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          <Link href={`/movies/${movie.movieId}`}>
            <h3 className="font-bold text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-1 text-sm sm:text-base leading-snug">
              {movie.title}
            </h3>
          </Link>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            {movie.year && <span>{movie.year}</span>}
            {movie.averageRating ? (
              <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                <Star className="w-3 h-3 fill-current" />
                {movie.averageRating.toFixed(1)}
              </span>
            ) : null}
            {Boolean(movie.ratingCount && movie.ratingCount > 0) && (
              <span className="text-slate-500">({movie.ratingCount})</span>
            )}
          </div>
        </div>

        {/* Genres tag pills */}
        <div className="flex flex-wrap gap-1">
          {movie.genres?.slice(0, 2).map((genre) => (
            <span
              key={genre}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-charcoal-800 text-slate-300 border border-charcoal-700/50"
            >
              {genre}
            </span>
          ))}
          {movie.genres?.length > 2 && (
            <span className="text-[10px] text-slate-500 self-center">
              +{movie.genres.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
