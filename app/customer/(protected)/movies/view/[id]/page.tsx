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
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ButtonRed } from "@/components/ui/ButtonRed";
import ButtonGray from "@/components/ui/ButtonGray";
import CustomerMovieService from "@/components/services/CustomerMovieService";
import RatingMovie from "@/app/customer/(protected)/movies/RatingMovie";
import { isFavoriteMovie, toggleFavoriteMovie } from "@/lib/favorite-movies";

type DateOption = {
  value: string;
  label: string;
  dayOfWeek: string;
  date: string;
  hasShowtimes: boolean;
};

const dayOfWeekFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function getDateKey(value: string | Date) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default function MovieDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [selectedDate, setSelectedDate] = useState<DateOption | null>(null);
  const [isRatingLoading, setIsRatingLoading] = useState(true);
  const [hasRatedMovie, setHasRatedMovie] = useState(false);
  const [ratingMessage, setRatingMessage] = useState("");
  const [ratingValue, setRatingValue] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [ratingSuccess, setRatingSuccess] = useState("");
  const { data: movie, error, isLoading } = CustomerMovieService.FetchById(params.id);

  useEffect(() => {
    let mounted = true;

    const loadRatingStatus = async () => {
      if (!movie?.id) {
        setHasRatedMovie(false);
        setRatingMessage("");
        setIsRatingLoading(false);
        return;
      }

      setIsRatingLoading(true);
      setRatingError("");
      setRatingSuccess("");

      try {
        const response = await fetch(`/api/customer/rating?movieId=${encodeURIComponent(movie.id)}`, {
          credentials: "include",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load rating status");
        }

        if (!mounted) {
          return;
        }

        if (payload?.hasRated) {
          setHasRatedMovie(true);
          setRatingMessage("You already rated this movie.");
        } else {
          setHasRatedMovie(false);
          setRatingMessage("How would you rate this movie?");
        }
      } catch (loadError) {
        if (!mounted) {
          return;
        }
        setHasRatedMovie(false);
        setRatingMessage("");
        setRatingError(loadError instanceof Error ? loadError.message : "Failed to load rating status");
      } finally {
        if (mounted) {
          setIsRatingLoading(false);
        }
      }
    };

    void loadRatingStatus();

    return () => {
      mounted = false;
    };
  }, [movie?.id]);

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

  useEffect(() => {
    const tick = () => setCurrentTime(Date.now());
    tick();

    const intervalId = window.setInterval(tick, 5 * 60 * 1000);
    const handleFocus = () => tick();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const movieShowtimeDetails = useMemo(() => movie?.showtimeDetails ?? [], [movie?.showtimeDetails]);
  const dateOptions: DateOption[] = Array.from({ length: 7 }).map((_, index) => {
    const today = startOfDay(new Date(currentTime));
    const todayKey = getDateKey(today);
    const tomorrowKey = getDateKey(addDays(today, 1));
    const date = addDays(today, index);
    const dateKey = getDateKey(date);
    const hasShowtimes = movieShowtimeDetails.some((showtime) => {
      if (!showtime.startTime) {
        return false;
      }

      const slotKey = getDateKey(showtime.startTime);
      if (slotKey !== dateKey) {
        return false;
      }

      if (slotKey === todayKey) {
        return new Date(showtime.startTime).getTime() > currentTime;
      }

      return true;
    });

    return {
      value: dateKey,
      label:
        dateKey === todayKey
          ? "Today"
          : dateKey === tomorrowKey
            ? "Tomorrow"
            : shortDateFormatter.format(date),
      dayOfWeek: dayOfWeekFormatter.format(date),
      date: shortDateFormatter.format(date),
      hasShowtimes,
    };
  });
  const visibleDateOptions = dateOptions.filter((date) => date.hasShowtimes);

  useEffect(() => {
    if (!selectedDate && visibleDateOptions.length > 0) {
      setSelectedDate(visibleDateOptions[0]);
      return;
    }

    if (selectedDate && !visibleDateOptions.some((option) => option.value === selectedDate.value)) {
      setSelectedDate(visibleDateOptions[0] ?? null);
    }
  }, [selectedDate, visibleDateOptions]);

  const selectedDateKey = selectedDate?.value ?? null;
  const selectedDateShowtimes = useMemo(() => {
    if (!selectedDateKey) {
      return [];
    }

    const todayKey = getDateKey(new Date(currentTime));

    return movieShowtimeDetails
      .filter((showtime) => {
        if (!showtime.startTime) {
          return false;
        }

        const slotKey = getDateKey(showtime.startTime);
        if (slotKey !== selectedDateKey) {
          return false;
        }

        if (slotKey === todayKey) {
          return new Date(showtime.startTime).getTime() > currentTime;
        }

        return true;
      })
      .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime());
  }, [movieShowtimeDetails, selectedDateKey, currentTime]);

  const handleSubmitRating = async () => {
    if (!movie?.id || hasRatedMovie) {
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
          movieId: movie.id,
          rating: ratingValue,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to save rating");
      }

      setRatingSuccess(payload?.message || "Thanks! Your rating was saved.");
      setHasRatedMovie(true);
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
                ) : hasRatedMovie ? (
                  <ButtonGray
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center rounded-lg border-2 border-orange-500/50 bg-zinc-900 p-4 text-orange-400 transition-colors"
                    aria-label="Rated"
                    title="Rated"
                  >
                    <Star className="h-5 w-5 fill-orange-400 text-orange-400" />
                    <span className="sr-only">Rated</span>
                  </ButtonGray>
                ) : (
                  <ButtonGray
                    type="button"
                    onClick={() => {
                      setRatingValue(0);
                      setShowRatingModal(true);
                    }}
                    // className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-red-700 px-6 py-4 text-lg font-bold transition-all hover:shadow-lg hover:shadow-red-500/30"
                  >
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    Rate
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

      <RatingMovie
        open={showRatingModal}
        title={movie.title}
        ratingValue={ratingValue}
        ratingSubmitting={ratingSubmitting}
        onClose={() => setShowRatingModal(false)}
        onSubmit={() => void handleSubmitRating()}
        onRatingChange={setRatingValue}
      />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className={`grid gap-8 ${movie.cast.length > 0 ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
          {movie.cast.length > 0 ? (
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
          ) : null}

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

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
          <h3 className="mb-3 text-lg font-semibold">Book Today</h3>
          <p className="mb-4 text-sm text-zinc-400">
            Choose a date and showtime before heading into booking.
          </p>

          {visibleDateOptions.length > 0 ? (
            <div className="space-y-5">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                  <Calendar className="h-4 w-4" />
                  Select Date
                </label>
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
                >
                  {dateOptions.map((date) => (
                    date.hasShowtimes ? (
                      <button
                        key={date.value}
                        type="button"
                        onClick={() => setSelectedDate(date)}
                        className={`w-full rounded-lg border px-2 py-3 text-center transition-all ${
                          selectedDate?.value === date.value
                            ? "border-red-500 bg-gradient-to-r from-red-500 to-red-700 text-white shadow-lg shadow-red-500/30"
                            : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                        }`}
                      >
                        <p className="mb-1 text-xs font-medium">{date.dayOfWeek}</p>
                        <p className="truncate text-sm font-bold">
                          {date.label === "Today" || date.label === "Tomorrow" ? date.label : date.date}
                        </p>
                      </button>
                    ) : (
                      <div
                        key={date.value}
                        className="invisible w-full rounded-lg border border-transparent px-2 py-3"
                        aria-hidden="true"
                      >
                        <p className="mb-1 text-xs font-medium">{date.dayOfWeek}</p>
                        <p className="truncate text-sm font-bold">
                          {date.label === "Today" || date.label === "Tomorrow" ? date.label : date.date}
                        </p>
                      </div>
                    )
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-400">
                  {selectedDate?.label ? `Showtimes on ${selectedDate.label}` : "Showtimes"}
                </p>

                {selectedDateShowtimes.length > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    {selectedDateShowtimes.map((showtime) => (
                      <Link
                        key={showtime.id}
                        href={`/customer/bookings?showtimeId=${encodeURIComponent(showtime.id)}&movie=${encodeURIComponent(movie.title)}&time=${encodeURIComponent(showtime.time)}&screen=${encodeURIComponent(showtime.screen)}&type=${encodeURIComponent(showtime.type)}`}
                        className="min-w-[280px] rounded-2xl border border-zinc-800 bg-black px-4 py-4 transition-all hover:border-red-500"
                      >
                        <div className="space-y-2">
                          <h4 className="text-md font-bold tracking-tight text-white">
                            {showtime.time}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span>{showtime.availableSeats} seats left</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
                    {selectedDate?.value === getDateKey(new Date(currentTime))
                      ? "No future showtimes available for today."
                      : "No showtimes available on this date."}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
              No future showtimes available yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
