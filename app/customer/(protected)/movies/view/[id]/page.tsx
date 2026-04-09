"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Film,
  Heart,
  Play,
  Star,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ButtonRed } from "@/components/ui/ButtonRed";
import ButtonGray from "@/components/ui/ButtonGray";
import { Card } from "@/components/ui/Card";
import CustomerMovieService from "@/components/services/CustomerMovieService";
import { isFavoriteMovie, toggleFavoriteMovie } from "@/lib/favorite-movies";
import { canRateMovie, getRatingEligibilityMessage } from "@/lib/rating-eligibility";
import { getNextShowingLabel, getUpcomingShowtimes } from "@/lib/movie-availability";

type RatingBooking = {
  id: string;
  isScanned: boolean;
  isRated: boolean;
  showtime: {
    startTime: string;
    movie: {
      id: string;
      title: string;
      duration?: number | null;
    };
  };
};

export default function MovieDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [isRatingLoading, setIsRatingLoading] = useState(true);
  const [eligibleBookingId, setEligibleBookingId] = useState<string | null>(null);
  const [ratingMessage, setRatingMessage] = useState("");
  const [ratingValue, setRatingValue] = useState(5);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [ratingSuccess, setRatingSuccess] = useState("");
  const { data: movie, error, isLoading } = CustomerMovieService.FetchById(params.id);

  useEffect(() => {
    let mounted = true;

    const loadEligibility = async () => {
      if (!movie?.id) {
        return;
      }

      setIsRatingLoading(true);
      setRatingError("");
      setRatingSuccess("");

      try {
        const response = await fetch(
          `/api/customer/booking?movieId=${encodeURIComponent(movie.id)}&limit=50`,
          { credentials: "include" },
        );
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load rating eligibility");
        }

        const bookings: RatingBooking[] = Array.isArray(payload?.bookings) ? payload.bookings : [];
        const alreadyRated = bookings.some((booking) => booking.isRated);
        const eligibleBooking = bookings.find((booking) =>
          canRateMovie({
            showtimeStart: booking?.showtime?.startTime,
            duration: movie?.durationMinutes,
            isScanned: booking?.isScanned,
            isRated: booking?.isRated,
          }),
        );

        if (!mounted) {
          return;
        }

        if (alreadyRated) {
          setEligibleBookingId(null);
          setRatingMessage("You already rated this movie.");
        } else if (eligibleBooking) {
          setEligibleBookingId(eligibleBooking.id);
          setRatingMessage(
            getRatingEligibilityMessage({
              showtimeStart: eligibleBooking?.showtime?.startTime,
              duration: movie?.durationMinutes,
              isScanned: eligibleBooking?.isScanned,
              isRated: eligibleBooking?.isRated,
            }),
          );
        } else if (bookings.length > 0) {
          setEligibleBookingId(null);
          setRatingMessage(
            getRatingEligibilityMessage({
              showtimeStart: bookings[0]?.showtime?.startTime,
              duration: movie?.durationMinutes,
              isScanned: bookings[0]?.isScanned,
              isRated: bookings[0]?.isRated,
            }),
          );
        } else {
          setEligibleBookingId(null);
          setRatingMessage("You can rate this movie after the show ends.");
        }
      } catch (loadError) {
        if (!mounted) {
          return;
        }
        setEligibleBookingId(null);
        setRatingMessage("");
        setRatingError(loadError instanceof Error ? loadError.message : "Failed to load rating eligibility");
      } finally {
        if (mounted) {
          setIsRatingLoading(false);
        }
      }
    };

    void loadEligibility();

    return () => {
      mounted = false;
    };
  }, [movie?.id, movie?.durationMinutes]);

  useEffect(() => {
    if (!movie?.id) {
      setIsLiked(false);
      return;
    }

    const syncFavoriteState = () => {
      setIsLiked(isFavoriteMovie(movie.id));
    };

    syncFavoriteState();
    window.addEventListener("favorite-movies-updated", syncFavoriteState);
    window.addEventListener("storage", syncFavoriteState);

    return () => {
      window.removeEventListener("favorite-movies-updated", syncFavoriteState);
      window.removeEventListener("storage", syncFavoriteState);
    };
  }, [movie?.id]);

  const handleSubmitRating = async () => {
    if (!eligibleBookingId) {
      return;
    }

    setRatingSubmitting(true);
    setRatingError("");

    try {
      const response = await fetch("/api/customer/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bookingId: eligibleBookingId,
          rating: ratingValue,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to save rating");
      }

      setRatingSuccess(payload?.message || "Thanks! Your rating was saved.");
      setEligibleBookingId(null);
      setRatingMessage("You already rated this movie.");
      setShowRatingModal(false);
    } catch (submitError) {
      setRatingError(submitError instanceof Error ? submitError.message : "Failed to save rating");
    } finally {
      setRatingSubmitting(false);
    }
  };

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
                  onClick={() => {
                    if (!movie?.id) {
                      return;
                    }

                    setIsLiked(toggleFavoriteMovie(movie.id));
                  }}
                  className={`inline-flex items-center justify-center rounded-lg border-2 p-4 transition-all ${
                    isLiked
                      ? "border-red-500 bg-red-500 text-white hover:border-red-500 hover:bg-red-500"
                      : "border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-zin-500 hover:bg-zinc-800"
                  }`}
                  aria-pressed={isLiked}
                  aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? "fill-white text-white" : ""}`} />
                </ButtonGray>
               
                {isRatingLoading ? (
                  <ButtonGray
                    type="button"
                    disabled
                    className="rounded-lg border-2 border-zinc-700 bg-zinc-900 px-5 py-4 text-lg"
                  >
                    Checking rating...
                  </ButtonGray>
                ) : eligibleBookingId && !ratingSuccess ? (
                  <ButtonRed
                    type="button"
                    onClick={() => setShowRatingModal(true)}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-red-700 px-6 py-4 text-lg font-bold transition-all hover:shadow-lg hover:shadow-red-500/30"
                  >
                    <Star className="h-5 w-5 fill-white" />
                    Rate Movie
                  </ButtonRed>
                ) : (
                  <ButtonGray
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center rounded-lg border-2 border-orange-500/50 bg-zinc-900 p-4 text-orange-400 transition-colors"
                    aria-label="Rate Locked"
                    title="Rate Locked"
                  >
                    <Star className="h-5 w-5" />
                    <span className="sr-only">{ratingSuccess ? "Rated" : "Rate Locked"}</span>
                  </ButtonGray>
                )}
              </div>

              <div className="mt-4 space-y-2">
                {ratingMessage ? (
                  <p className="text-sm text-zinc-400">{ratingMessage}</p>
                ) : null}
                {ratingSuccess ? (
                  <p className="text-sm text-emerald-400">{ratingSuccess}</p>
                ) : null}
                {ratingError ? (
                  <p className="text-sm text-red-400">{ratingError}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {showRatingModal && eligibleBookingId ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <Card className="w-full max-w-md border-zinc-800 bg-zinc-950 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Rate Movie</p>
                <h3 className="mt-2 text-2xl font-bold text-white">{movie.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRatingModal(false)}
                className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-white"
                aria-label="Close rating dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <p className="text-sm text-zinc-400">
                Pick a score from 1 to 5 stars. Your rating will be saved to this movie.
              </p>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setRatingValue(score)}
                    className="rounded-full p-1 transition-transform hover:scale-110"
                    aria-label={`Set rating to ${score} star${score > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        score <= ratingValue
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-zinc-700"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <ButtonGray
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 rounded-xl bg-zinc-800 py-3 text-base"
                >
                  Cancel
                </ButtonGray>
                <ButtonRed
                  type="button"
                  onClick={() => void handleSubmitRating()}
                  disabled={ratingSubmitting}
                  className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-700 py-3 text-base font-bold"
                >
                  {ratingSubmitting ? "Saving..." : "Submit Rating"}
                </ButtonRed>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

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
                {getUpcomingShowtimes(movie).length > 0
                  ? getUpcomingShowtimes(movie)
                      .slice(0, 6)
                      .map((showtime) => (
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
                  : getNextShowingLabel(movie) ? (
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
                        Next showing: {getNextShowingLabel(movie)}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
                        No future showtimes available yet.
                      </div>
                    )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
