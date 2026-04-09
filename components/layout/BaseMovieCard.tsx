"use client";

import Link from "next/link";
import { useState } from "react";
import { Clock, Star } from "lucide-react";
import Image from "next/image";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  getMovieAvailabilityState,
  getNextShowingLabel,
  getTodaysUpcomingShowtimes,
} from "@/lib/movie-availability";
import type { CustomerMovieShowtime } from "@/components/services/CustomerMovieService";

interface Movie {
  id?: string;
  title: string;
  genre?: string;
  rating?: number;
  duration?: string;
  image?: string;
  showtimes?: string[];
  showtimeDetails?: CustomerMovieShowtime[];
  releaseDateValue?: string | null;
  certification?: string;
}

interface BaseMovieCardProps {
  movie: Movie;
  href?: string;
  onClick?: () => void;
  onShowtimeClick?: (time: string) => void;
  className?: string;
  imageAspectClassName?: string;
  contentClassName?: string;
  showShowtimes?: boolean;
  showCertification?: boolean;
}

export default function BaseMovieCard({
  movie,
  href,
  onClick,
  onShowtimeClick,
  className = "",
  imageAspectClassName = "aspect-[3/4]",
  contentClassName = "p-5",
  showShowtimes = true,
  showCertification = true,
}: BaseMovieCardProps) {
  const [currentTime] = useState(() => Date.now());
  const availabilityState = getMovieAvailabilityState(
    { showtimeDetails: movie.showtimeDetails ?? [], releaseDateValue: movie.releaseDateValue ?? null },
    currentTime,
  );
  const todaysShowtimes = getTodaysUpcomingShowtimes(
    { showtimeDetails: movie.showtimeDetails ?? [] },
    currentTime,
  );
  const nextShowingLabel = getNextShowingLabel(
    { showtimeDetails: movie.showtimeDetails ?? [] },
    currentTime,
  );
  const showtimeButtons = todaysShowtimes.map((showtime) => showtime.time);
  const hasShowtimes = showShowtimes && showtimeButtons.length > 0;
  const shouldShowComingSoon = availabilityState === "coming-soon";
  const shouldRenderSchedule = showShowtimes && !shouldShowComingSoon;
  const cardContent = (
    <>
      <div className={`relative overflow-hidden ${imageAspectClassName}`}>
        <ImageWithFallback
          src={movie.image || "/placeholder.png"}
          alt={movie.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        {typeof movie.rating === "number" ? (
          <div className="absolute right-4 top-4 flex items-center gap-1 rounded-lg bg-black/80 px-3 py-1.5 backdrop-blur-sm">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            <span className="text-sm font-semibold">{movie.rating}</span>
          </div>
        ) : null}

        {shouldShowComingSoon ? (
          <div className="absolute left-4 top-4 rounded-lg bg-red-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            Coming Soon
          </div>
        ) : showCertification && movie.certification ? (
          <div className="absolute left-4 top-4 rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            {movie.certification}
          </div>
        ) : null}
      </div>

      <div className={contentClassName}>
        <h3 className="mb-1 text-lg font-bold transition-colors group-hover:text-red-500">
          {movie.title}
        </h3>
        <p className="mb-2 text-sm text-zinc-400">{movie.genre || "Uncategorized"}</p>

        <div className="mb-3 flex items-center gap-2 text-sm text-zinc-500">
          <Clock className="h-4 w-4" />
          <span>{movie.duration || "TBA"}</span>
        </div>

        {shouldRenderSchedule && hasShowtimes ? (
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500">Showtimes Today</p>
            <div className="flex flex-wrap gap-2">
              {showtimeButtons.map((time, idx) =>
                onShowtimeClick ? (
                  <button
                    key={idx}
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onShowtimeClick(time);
                    }}
                    className="cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium transition-all hover:border-red-500 hover:bg-red-500"
                  >
                    {time}
                  </button>
                ) : (
                  <span
                    key={idx}
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium"
                  >
                    {time}
                  </span>
                )
              )}
            </div>
          </div>
        ) : shouldRenderSchedule && nextShowingLabel ? (
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500">Next Showing: {nextShowingLabel}</p>
          </div>
        ) : null}
      </div>
    </>
  );

  const cardClassName =
    `group relative block transform cursor-pointer overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition-all hover:-translate-y-2 hover:border-red-500/50 hover:shadow-2xl hover:shadow-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-500/70 ${className}`;

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
