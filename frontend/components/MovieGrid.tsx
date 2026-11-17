import MovieCard from "./MovieCard";
import { Movie } from "@/lib/types";

interface MovieGridProps {
  movies: Movie[];
  similarities?: Record<number, number>;
  showRanks?: boolean;
}

export default function MovieGrid({ movies, similarities, showRanks }: MovieGridProps) {
  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
      {movies.map((movie, index) => (
        <MovieCard
          key={movie.movieId}
          movie={movie}
          rank={showRanks ? index + 1 : undefined}
          similarity={similarities ? similarities[movie.movieId] : undefined}
        />
      ))}
    </div>
  );
}
