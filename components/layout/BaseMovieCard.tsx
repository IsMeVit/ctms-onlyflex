import Link from "next/link";
import { Star, Clock } from "lucide-react";

interface Movie {
  id?: string;
  title: string;
  genre?: string;
  rating?: number;
  duration?: string;
  image?: string;
  showtimes?: string[];
  certification?: string;
}

interface BaseMovieCardProps {
  movie: Movie;
  href?: string;
  onClick?: () => void;
  onBookNow?: () => void;
  onShowtimeClick?: (time: string) => void;
  className?: string;
  imageAspectClassName?: string;
  contentClassName?: string;
  showBookNowButton?: boolean;
  showShowtimes?: boolean;
  showCertification?: boolean;
}

export default function BaseMovieCard({
  movie,
  href,
  onClick,
  onBookNow,
  onShowtimeClick,
  className = "",
  imageAspectClassName = "aspect-[4/4]",
  contentClassName = "p-5",
  showBookNowButton = true,
  showShowtimes = true,
  showCertification = true,
}: BaseMovieCardProps) {
  const showtimes = movie.showtimes || [];
  const hasShowtimes = showShowtimes && showtimes.length > 0;
  const cardContent = (
    <>
      <div className={`relative overflow-hidden ${imageAspectClassName}`}>
        <img
          src={movie.image || "/placeholder.png"}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {typeof movie.rating === "number" ? (
          <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold text-sm">{movie.rating}</span>
          </div>
        ) : null}

        {showCertification && movie.certification ? (
          <div className="absolute top-4 left-4 px-3 py-1 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-lg text-xs font-medium">
            {movie.certification}
          </div>
        ) : null}

        {showBookNowButton && onBookNow ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onBookNow();
            }}
            className="absolute bottom-4 cursor-pointer left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-700 rounded-lg font-medium opacity-0 group-hover:opacity-800 hover:bg-red-300 transition-all transform translate-y-4 group-hover:translate-y-0"
          >
            Book Now
          </button>
        ) : null}
      </div>

      <div className={contentClassName}>
        <h3 className="font-bold text-lg mb-1 group-hover:text-red-500 transition-colors">
          {movie.title}
        </h3>
        <p className="text-zinc-400 text-sm mb-2">{movie.genre || "Uncategorized"}</p>

        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-3">
          <Clock className="w-4 h-4" />
          <span>{movie.duration || "TBA"}</span>
        </div>

        {hasShowtimes ? (
          <div className="space-y-1">
            <p className="text-xs text-zinc-500 font-medium">Showtimes Today</p>
            <div className="flex flex-wrap gap-2">
              {showtimes.map((time, idx) =>
                onShowtimeClick ? (
                  <button
                    key={idx}
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onShowtimeClick(time);
                    }}
                    className="px-3 py-1.5 bg-zinc-800 cursor-pointer hover:bg-red-500 border border-zinc-700 hover:border-red-500 rounded-lg text-xs font-medium transition-all"
                  >
                    {time}
                  </button>
                ) : (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-medium"
                  >
                    {time}
                  </span>
                )
              )}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );

  const cardClassName =
    `group relative block bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-red-500/50 transition-all hover:shadow-2xl hover:shadow-red-500/20 transform hover:-translate-y-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/70 ${className}`;

  if (href) {
    return (
      <Link href={href} className={cardClassName} aria-label={`View details for ${movie.title}`}>
        {cardContent}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${cardClassName} w-full text-left`}
      aria-label={`Open ${movie.title}`}
    >
      {cardContent}
    </button>
  );
}
