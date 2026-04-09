import type { CustomerMovie, CustomerMovieShowtime } from "@/components/services/CustomerMovieService";

function toTimestamp(value?: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function isSameLocalDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function isActiveTimestamp(value: string | null, currentTime: number) {
  const timestamp = toTimestamp(value);
  return timestamp !== null && timestamp > currentTime;
}

export function getReleaseTimestamp(movie: Pick<CustomerMovie, "releaseDateValue">) {
  return toTimestamp(movie.releaseDateValue);
}

export function isComingSoonMovie(movie: Pick<CustomerMovie, "releaseDateValue">, currentTime = Date.now()) {
  const releaseTimestamp = getReleaseTimestamp(movie);
  return releaseTimestamp !== null && releaseTimestamp > currentTime;
}

export function getUpcomingShowtimes(
  movie: Pick<CustomerMovie, "showtimeDetails">,
  currentTime = Date.now(),
) {
  return movie.showtimeDetails
    .filter((showtime) => {
      const startTime = toTimestamp(showtime.startTime);
      return startTime !== null && startTime > currentTime;
    })
    .sort((left, right) => {
      const leftStart = toTimestamp(left.startTime) ?? 0;
      const rightStart = toTimestamp(right.startTime) ?? 0;
      return leftStart - rightStart;
    });
}

export function getActiveOrUpcomingShowtimes(
  movie: Pick<CustomerMovie, "showtimeDetails">,
  currentTime = Date.now(),
) {
  return movie.showtimeDetails
    .filter((showtime) => isActiveTimestamp(showtime.endTime, currentTime))
    .sort((left, right) => {
      const leftStart = toTimestamp(left.startTime) ?? 0;
      const rightStart = toTimestamp(right.startTime) ?? 0;
      return leftStart - rightStart;
    });
}

export function getTodaysUpcomingShowtimes(
  movie: Pick<CustomerMovie, "showtimeDetails">,
  currentTime = Date.now(),
) {
  const now = new Date(currentTime);

  return getUpcomingShowtimes(movie, currentTime).filter((showtime) => {
    const startTime = toTimestamp(showtime.startTime);
    return startTime !== null && isSameLocalDay(new Date(startTime), now);
  });
}

export function getNextUpcomingShowtime(
  movie: Pick<CustomerMovie, "showtimeDetails">,
  currentTime = Date.now(),
) {
  return getUpcomingShowtimes(movie, currentTime)[0] ?? null;
}

export function getNowShowingSortTimestamp(
  movie: Pick<CustomerMovie, "showtimeDetails">,
  currentTime = Date.now(),
) {
  const upcomingShowtime = getUpcomingShowtimes(movie, currentTime)[0];
  if (upcomingShowtime) {
    return toTimestamp(upcomingShowtime.startTime);
  }

  const activeShowtime = getActiveOrUpcomingShowtimes(movie, currentTime)[0];
  return activeShowtime ? toTimestamp(activeShowtime.endTime) : null;
}

export function getNextShowingLabel(
  movie: Pick<CustomerMovie, "showtimeDetails">,
  currentTime = Date.now(),
) {
  const nextShowtime = getNextUpcomingShowtime(movie, currentTime);
  if (!nextShowtime) {
    return null;
  }

  return formatShortDate(nextShowtime.startTime);
}

export function getMovieAvailabilityState(
  movie: Pick<CustomerMovie, "releaseDateValue" | "showtimeDetails">,
  currentTime = Date.now(),
): "coming-soon" | "now-showing" | "expired" {
  if (isComingSoonMovie(movie, currentTime)) {
    return "coming-soon";
  }

  if (getActiveOrUpcomingShowtimes(movie, currentTime).length > 0) {
    return "now-showing";
  }

  return "expired";
}

export function getBookingHref(movie: CustomerMovie, showtime: CustomerMovieShowtime) {
  const date = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(showtime.startTime));

  const params = new URLSearchParams({
    showtimeId: showtime.id,
    movie: movie.title,
    date,
    time: showtime.time,
    screen: showtime.screen,
    type: showtime.type,
  });

  return `/customer/bookings?${params.toString()}`;
}

export function getMovieDetailsHref(movieId: string) {
  return `/customer/movies/view/${encodeURIComponent(movieId)}`;
}
