"use client";

import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CustomerMovieService from "../services/CustomerMovieService";
import {
  getMovieDetailsHref,
  isComingSoonMovie,
} from "@/lib/movie-availability";

export function ComingSoon() {
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const { data, error, isLoading, mutate } = CustomerMovieService.FetchAll({
    limit: 100,
    sortBy: "releaseDate",
    sortOrder: "asc",
  }, {
    refreshInterval: 24 * 60 * 60 * 1000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const movies = useMemo(() => data?.movies ?? [], [data?.movies]);
  const comingSoonMovies = useMemo(() => {
    return [...movies]
      .filter((movie) => isComingSoonMovie(movie, currentTime))
      .sort((left, right) => {
        const leftRelease = left.releaseDateValue ? new Date(left.releaseDateValue).getTime() : Number.MAX_SAFE_INTEGER;
        const rightRelease = right.releaseDateValue ? new Date(right.releaseDateValue).getTime() : Number.MAX_SAFE_INTEGER;
        return leftRelease - rightRelease;
      })
      .slice(0, 3);
  }, [movies, currentTime]);

  useEffect(() => {
    const tick = () => setCurrentTime(Date.now());
    tick();

    const intervalId = window.setInterval(tick, 24 * 60 * 60 * 1000);
    const handleFocus = () => {
      tick();
      void mutate();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        tick();
        void mutate();
      }
    };
    const handleMovieCatalogUpdate = () => {
      tick();
      void mutate();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("movie-catalog-updated", handleMovieCatalogUpdate as EventListener);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("movie-catalog-updated", handleMovieCatalogUpdate as EventListener);
    };
  }, [mutate]);

  return (
    <section className="bg-black py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12">
          <h2 className="mb-4 text-4xl font-bold">Coming Soon</h2>
          <p className="text-lg text-zinc-400">Get notified when these movies hit the big screen</p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
            Failed to load upcoming movies.
          </div>
        ) : isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`coming-soon-skeleton-${index}`}
                className="h-[16rem] animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/70"
              />
            ))}
          </div>
        ) : comingSoonMovies.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
            No upcoming movies found.
          </div>
        ) : (
          <div className="space-y-6">
            {comingSoonMovies.map((movie) => (
              <article
                key={movie.id}
                className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition-all hover:border-red-500/50 hover:shadow-xl hover:shadow-red-500/10"
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="relative aspect-video overflow-hidden md:aspect-auto">
                    <img
                      src={movie.image || "/placeholder.png"}
                      alt={movie.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/50" />
                  </div>

                  <div className="flex flex-col justify-center p-6 md:col-span-2 md:p-8">
                    <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1">
                      <Calendar className="h-3 w-3 text-red-500" />
                      <span className="text-sm font-medium text-red-500">Coming Soon</span>
                    </div>

                    <h3 className="mb-2 text-3xl font-bold transition-colors group-hover:text-red-500">
                      {movie.title}
                    </h3>
                    <p className="mb-3 text-sm text-zinc-500">{movie.releaseDate}</p>
                    <p className="mb-4 text-zinc-400">{movie.genre}</p>
                    <p className="mb-6 text-lg leading-relaxed text-zinc-300">
                      {movie.description}
                    </p>

                    <div className="flex flex-wrap gap-4">
                      <Link
                        href={movie.id ? getMovieDetailsHref(movie.id) : "/customer/movies"}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-red-700 px-6 py-3 font-medium transition-all hover:shadow-lg hover:shadow-red-500/30"
                      >
                        View Details
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
