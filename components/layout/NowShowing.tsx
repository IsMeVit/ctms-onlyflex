"use client";

import Link from "next/link";
import BaseMovieCard from "@/components/layout/BaseMovieCard";
import { cn } from "@/lib/utils";
import { buttonRedVariants } from "../ui/ButtonRed";
import CustomerMovieService from "../services/CustomerMovieService";

export function NowShowing() {
  const { data, error, isLoading } = CustomerMovieService.FetchAll({
    limit: 8,
    sortBy: "releaseDate",
    sortOrder: "desc",
  });

  const movies = data?.movies ?? [];
  const today = new Date().toDateString();

  return (
    <section className=" pt-10 bg-gradient-to-b from-black via-zinc-950 to-black">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-4">Now Showing</h2>
          <p className="text-zinc-400 text-lg">Experience the latest blockbusters in premium quality</p>
        </div>

        {/* Movies Grid */}
        {error ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center text-zinc-400">
            Failed to load movies.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={`movie-skeleton-${index}`}
                    className="h-[28rem] rounded-2xl border border-zinc-800 bg-zinc-900/60 animate-pulse"
                  />
                ))
              : movies.map((movie: any) => {
                  const todaysShowtimes = (movie.showtimeDetails || [])
                    .filter((showtime: any) => {
                      if (!showtime.startTime) return false;
                      return new Date(showtime.startTime).toDateString() === today;
                    })
                    .slice(0, 3)
                    .map((showtime: any) => showtime.time);

                  return (
                    <BaseMovieCard
                      key={movie.id}
                      movie={{ ...movie, showtimes: todaysShowtimes }}
                      href={`/customer/movies/view/${movie.id}`}
                    />
                  );
                })}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            href="/customer/movies"
            className={cn(
              buttonRedVariants({ size: "default" }),
              "bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition-colors"
            )}
          >
            View All Movies
          </Link>
        </div>
      </div>
    </section>
  );
}
