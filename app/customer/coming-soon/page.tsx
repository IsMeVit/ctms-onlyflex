"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Calendar } from "lucide-react";
import CustomerMovieService from "@/components/services/CustomerMovieService";
<<<<<<< HEAD
=======
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
>>>>>>> e5e1fb5 (fix: resolve build errors from customer merge)
import { getMovieDetailsHref, isComingSoonMovie } from "@/lib/movie-availability";

export default function ComingSoonPage() {
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const { data, error, isLoading, mutate } = CustomerMovieService.FetchAll(
    {
      limit: 100,
      sortBy: "releaseDate",
      sortOrder: "asc",
    },
    {
      refreshInterval: 24 * 60 * 60 * 1000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  );

  const movies = useMemo(() => {
    return [...(data?.movies || [])]
      .filter((movie) => isComingSoonMovie(movie, currentTime))
      .sort((left, right) => {
        const leftRelease = left.releaseDateValue ? new Date(left.releaseDateValue).getTime() : Number.MAX_SAFE_INTEGER;
        const rightRelease = right.releaseDateValue ? new Date(right.releaseDateValue).getTime() : Number.MAX_SAFE_INTEGER;
        return leftRelease - rightRelease;
      })
      .slice(0, 5);
  }, [data?.movies, currentTime]);

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
    <div className="min-h-screen bg-black pt-24 text-white">
      <section className="bg-black py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12">
            <h2 className="mb-4 text-4xl font-bold">Coming Soon</h2>
            <p className="text-lg text-zinc-400">Get notified when these movies hit the big screen</p>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
              Loading upcoming movies...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-200">
              Unable to load coming soon movies right now.
            </div>
          ) : movies.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
              No upcoming movies found.
            </div>
          ) : (
            <div className="space-y-6">
              {movies.map((movie) => (
                <div
                  key={movie.id}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition-all hover:border-red-500/50 hover:shadow-xl hover:shadow-red-500/10"
                >
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="relative aspect-video overflow-hidden md:aspect-auto">
                      <img
                        src={movie.image}
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
                      <p className="mb-4 text-zinc-400">{movie.genre}</p>
                      <p className="mb-6 text-lg leading-relaxed text-zinc-300">
                        {movie.description}
                      </p>

                      <div className="flex flex-wrap gap-4">
                        <Link
                          href={getMovieDetailsHref(movie.id)}
                          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-red-700 px-6 py-3 font-medium transition-all hover:shadow-lg hover:shadow-red-500/30"
                        >
                          View Details
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
