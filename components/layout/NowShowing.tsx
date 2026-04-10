"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { buttonRedVariants } from "../ui/ButtonRed";
import CustomerMovieService from "../services/CustomerMovieService";
import {
  getMovieAvailabilityState,
  getNowShowingSortTimestamp,
} from "@/lib/movie-availability";

export function NowShowing() {
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const { data, error, isLoading, mutate } = CustomerMovieService.FetchAll(
    {
      limit: 100,
      sortBy: "releaseDate",
      sortOrder: "desc",
    },
    {
      refreshInterval: 24 * 60 * 60 * 1000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  );

  const movies = useMemo(() => data?.movies ?? [], [data?.movies]);
  const nowShowingMovies = useMemo(() => {
    return [...movies]
      .filter(
        (movie) =>
          getMovieAvailabilityState(movie, currentTime) === "now-showing",
      )
      .sort((left, right) => {
        const leftTime =
          getNowShowingSortTimestamp(left, currentTime) ??
          Number.MAX_SAFE_INTEGER;
        const rightTime =
          getNowShowingSortTimestamp(right, currentTime) ??
          Number.MAX_SAFE_INTEGER;
        return leftTime - rightTime;
      })
      .slice(0, 8);
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
    window.addEventListener(
      "movie-catalog-updated",
      handleMovieCatalogUpdate as EventListener,
    );

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(
        "movie-catalog-updated",
        handleMovieCatalogUpdate as EventListener,
      );
    };
  }, [mutate]);

  return (
    <section className="bg-gradient-to-b from-black via-zinc-950 to-black pt-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12">
          <h2 className="mb-4 text-4xl font-bold">Now Showing</h2>
          <p className="text-lg text-zinc-400">
            Experience the latest blockbusters in premium quality
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center text-zinc-400">
            Failed to load movies.
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={`movie-skeleton-${index}`}
                className="h-[28rem] animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60"
              />
            ))}
          </div>
        ) : nowShowingMovies.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400">
            No movies are currently showing.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {nowShowingMovies.map((movie) => {
              const detailsHref = movie.id
                ? `/customer/movies/view/${movie.id}`
                : "/customer/movies";
              const cardHref = detailsHref;
              const posterContent = (
                <>
                  <img
                    src={movie.image || "/placeholder.png"}
                    alt={movie.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </>
              );

              return (
                <article
                  key={movie.id}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition-all hover:-translate-y-2 hover:border-red-500/50 hover:shadow-2xl hover:shadow-red-500/20"
                >
                  {cardHref ? (
                    <Link
                      href={cardHref}
                      className="relative block aspect-[3/4] overflow-hidden"
                    >
                      {posterContent}
                    </Link>
                  ) : (
                    <div className="relative aspect-[3/4] overflow-hidden">
                      {posterContent}
                    </div>
                  )}

                  <div className="p-5">
                    <h3 className="mb-2 text-lg font-bold transition-colors group-hover:text-red-500">
                      {movie.title}
                    </h3>
                    <p className=" text-md text-zinc-400">
                      {movie.releaseDate}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/customer/movies"
            className={cn(
              buttonRedVariants({ size: "default" }),
              "bg-zinc-800 text-sm font-medium transition-colors hover:bg-zinc-700",
            )}
          >
            View All Movies
          </Link>
        </div>
      </div>
    </section>
  );
}
