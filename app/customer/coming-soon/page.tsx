"use client";

import { Bell, Calendar } from "lucide-react";
import CustomerMovieService from "@/components/services/CustomerMovieService";
import { ImageWithFallback } from "@/app/sample_app/src/components/figma/ImageWithFallback";

function parseReleaseDate(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export default function ComingSoonPage() {
  const { data, error, isLoading } = CustomerMovieService.FetchAll({
    limit: 50,
    sortBy: "releaseDate",
    sortOrder: "desc",
  });

  const movies = [...(data?.movies || [])]
    .sort((a, b) => parseReleaseDate(b.releaseDate) - parseReleaseDate(a.releaseDate))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-black pt-24 text-white">
      <section className="bg-black py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <h2 className="text-4xl font-bold mb-4">Coming Soon</h2>
            <p className="text-zinc-400 text-lg">
              Get notified when these movies hit the big screen
            </p>
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
                  className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-red-500/50 transition-all hover:shadow-xl hover:shadow-red-500/10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative aspect-video md:aspect-auto overflow-hidden">
                      <ImageWithFallback
                        src={movie.image}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/50"></div>
                    </div>

                    <div className="md:col-span-2 p-6 md:p-8 flex flex-col justify-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full w-fit mb-4">
                        <Calendar className="w-3 h-3 text-red-500" />
                        <span className="text-sm font-medium text-red-500">{movie.releaseDate}</span>
                      </div>

                      <h3 className="text-3xl font-bold mb-2 group-hover:text-red-500 transition-colors">
                        {movie.title}
                      </h3>
                      <p className="text-zinc-400 mb-4">{movie.genre}</p>
                      <p className="text-zinc-300 text-lg mb-6 leading-relaxed">
                        {movie.description}
                      </p>

                      <div className="flex flex-wrap gap-4">
                        <button
                          type="button"
                          className="flex cursor-pointer items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 rounded-lg font-medium hover:shadow-lg hover:shadow-red-500/30 transition-all"
                        >
                          <Bell className="w-4 h-4" />
                          Notify Me
                        </button>
                        <button
                          type="button"
                          className="px-6 cursor-pointer py-3 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-lg font-medium transition-all"
                        >
                          More Info
                        </button>
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
