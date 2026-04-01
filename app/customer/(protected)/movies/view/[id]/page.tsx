"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Film, Heart, MapPin, Play, Share2, Star, Users } from "lucide-react";
import { useState } from "react";
import { ButtonRed } from "@/components/ui/ButtonRed";
import ButtonGray from "@/components/ui/ButtonGray";
import CustomerMovieService from "@/components/services/CustomerMovieService";

const theaters = [
  { id: 1, name: "OnlyFlix Central", address: "Norodom Blvd, Phnom Penh" },
  { id: 2, name: "OnlyFlix Riverside", address: "Sisowath Quay, Phnom Penh" },
  { id: 3, name: "OnlyFlix Sen Sok", address: "Street 2004, Phnom Penh" },
];

export default function MovieDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const { data: movie, error, isLoading } = CustomerMovieService.FetchById(params.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="flex min-h-screen items-center justify-center text-zinc-400">
          Loading movie...
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-3xl font-bold">Movie not found</h1>
          <p className="text-zinc-400">We couldn&apos;t load this movie right now.</p>
          <ButtonGray onClick={() => router.push("/customer/movies")}>Back to Movies</ButtonGray>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed left-6 top-20 z-40">
        <ButtonGray
          type="button"
          onClick={() => router.back()}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl transition-all hover:bg-zinc-800"
        >
          <ArrowLeft size={4} />
          <span className="text-sm">Back</span>
        </ButtonGray>
      </div>

      <section className="relative overflow-hidden pt-24">
        <div className="absolute inset-0">
          <img src={movie.image} alt={movie.title} className="h-full w-full object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.25),transparent_35%)]" />
        </div>

        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl items-end px-6 pb-14 pt-28">
          <div className="grid w-full gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="mx-auto hidden w-full max-w-xs overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70 shadow-2xl lg:block">
              <img src={movie.image} alt={movie.title} className="h-full w-full object-cover" />
            </div>

            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-sm font-medium">
                  {movie.certification}
                </span>
                <span className="rounded-full bg-gradient-to-r from-red-500 to-red-700 px-3 py-1 text-sm font-medium">
                  Now Showing
                </span>
              </div>

              <h1 className="mb-4 max-w-4xl text-5xl font-bold tracking-tight md:text-6xl">
                {movie.title}
              </h1>

              <div className="mb-6 flex flex-wrap items-center gap-5 text-zinc-300">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  <span className="text-lg font-semibold">{movie.rating}/10</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{movie.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Film className="h-5 w-5" />
                  <span>{movie.genre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>{movie.releaseDate}</span>
                </div>
              </div>

              <p className="mb-8 max-w-3xl text-lg leading-8 text-zinc-300">
                {movie.description}
              </p>

              <div className="flex flex-wrap gap-4">
                <ButtonRed className="flex p-4 items-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-red-700 px-8 py-4 text-lg font-bold transition-all hover:shadow-lg hover:shadow-red-500/30">
                  <Play className="h-5 w-5 fill-white" />
                  Watch Trailer
                </ButtonRed>
                <ButtonGray
                  type="button"
                  onClick={() => setIsLiked((value) => !value)}
                  className={`rounded-lg border-2 p-4 transition-all ${
                    isLiked
                      ? "border-red-500 bg-red-500"
                      : "border-zinc-700 bg-zinc-900 hover:border-zin-500"
                  }`}
                  aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? "fill-white" : ""}`} />
                </ButtonGray>
                <ButtonGray
                  type="button"
                  className="rounded-lg border-2 border-zinc-700 bg-zinc-900 p-4 transition-all hover:border-zin-500"
                  aria-label="Share movie"
                >
                  <Share2 className="h-5 w-5" />
                </ButtonGray>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="space-y-8">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-4 text-2xl font-bold">Cast</h2>
              <div className="flex flex-wrap gap-3">
                {movie.cast.map((actor) => (
                  <div key={actor} className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm">{actor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-4 text-2xl font-bold">About</h2>
              <div className="grid gap-4 text-sm text-zinc-300 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-zinc-500">Director</p>
                  <p className="font-medium text-white">{movie.director}</p>
                </div>
                <div>
                  <p className="mb-1 text-zinc-500">Language</p>
                  <p className="font-medium text-white">{movie.language}</p>
                </div>
                <div>
                  <p className="mb-1 text-zinc-500">Genre</p>
                  <p className="font-medium text-white">{movie.genre}</p>
                </div>
                <div>
                  <p className="mb-1 text-zinc-500">Release Date</p>
                  <p className="font-medium text-white">{movie.releaseDate}</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
              <h3 className="mb-3 text-lg font-semibold">Book Today</h3>
              <p className="mb-4 text-sm text-zinc-400">
                Choose a showtime and head into booking with fewer clicks.
              </p>
              <div className="space-y-3">
                {movie.showtimeDetails.length > 0
                  ? movie.showtimeDetails.slice(0, 6).map((showtime) => (
                      <Link
                        key={showtime.id}
                        href={`/customer/bookings?showtimeId=${encodeURIComponent(showtime.id)}&movie=${encodeURIComponent(movie.title)}&time=${encodeURIComponent(showtime.time)}&screen=${encodeURIComponent(showtime.screen)}&type=${encodeURIComponent(showtime.type)}`}
                        className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 transition-all hover:border-red-500 hover:bg-zinc-900"
                      >
                        <div>
                          <span className="font-semibold">{showtime.time}</span>
                          <p className="text-xs text-zinc-500">{showtime.screen}</p>
                        </div>
                        <span className="text-xs text-zinc-400">Reserve</span>
                      </Link>
                    ))
                  : movie.showtimes.map((time, index) => (
                      <Link
                        key={`${time}-${index}`}
                        href={`/customer/bookings?movie=${encodeURIComponent(movie.title)}&time=${encodeURIComponent(time)}`}
                        className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 transition-all hover:border-red-500 hover:bg-zinc-900"
                      >
                        <span className="font-semibold">{time}</span>
                        <span className="text-xs text-zinc-400">Reserve</span>
                      </Link>
                    ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
              <h3 className="mb-3 text-lg font-semibold">Available Theaters</h3>
              <div className="space-y-3">
                {theaters.map((theater) => (
                  <div key={theater.id} className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                    <div className="mb-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-400" />
                      <span className="font-medium">{theater.name}</span>
                    </div>
                    <p className="text-sm text-zinc-500">{theater.address}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
