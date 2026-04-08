export type RatingEligibilityInput = {
  showtimeStart?: string | Date | null;
  duration?: number | null;
  isScanned?: boolean | null;
  isRated?: boolean | null;
  now?: Date;
};

function toDate(value?: string | Date | null) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export function getShowtimeEnd(showtimeStart?: string | Date | null, duration?: number | null) {
  const start = toDate(showtimeStart);
  if (!start || !duration || duration <= 0) {
    return null;
  }

  return new Date(start.getTime() + duration * 60_000);
}

export function canRateMovie({
  showtimeStart,
  duration,
  isScanned,
  isRated,
  now = new Date(),
}: RatingEligibilityInput) {
  if (isRated) {
    return false;
  }

  if (isScanned) {
    return true;
  }

  const showtimeEnd = getShowtimeEnd(showtimeStart, duration);
  if (!showtimeEnd) {
    return false;
  }

  return now.getTime() > showtimeEnd.getTime();
}

export function getRatingEligibilityMessage({
  showtimeStart,
  duration,
  isScanned,
  isRated,
  now = new Date(),
}: RatingEligibilityInput) {
  if (isRated) {
    return "You already rated this movie.";
  }

  if (isScanned) {
    return "Thanks for checking in! You can rate now.";
  }

  const showtimeEnd = getShowtimeEnd(showtimeStart, duration);
  if (!showtimeEnd) {
    return "You can rate this movie after the show ends.";
  }

  return now.getTime() > showtimeEnd.getTime()
    ? "You can rate this movie now."
    : "You can rate this movie after the show ends.";
}
