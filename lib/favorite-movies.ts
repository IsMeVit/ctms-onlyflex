export const FAVORITE_MOVIES_STORAGE_KEY = "onlyflex.favorite-movies";
export const FAVORITE_MOVIES_UPDATED_EVENT = "favorite-movies-updated";

function readStoredFavoriteIds() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FAVORITE_MOVIES_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function writeStoredFavoriteIds(ids: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FAVORITE_MOVIES_STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(FAVORITE_MOVIES_UPDATED_EVENT));
}

export function getFavoriteMovieIds() {
  return readStoredFavoriteIds();
}

export function isFavoriteMovie(movieId?: string | null) {
  if (!movieId) {
    return false;
  }

  return readStoredFavoriteIds().includes(movieId);
}

export function setFavoriteMovie(movieId: string, isFavorite: boolean) {
  const currentIds = readStoredFavoriteIds();
  const nextIds = isFavorite
    ? Array.from(new Set([...currentIds, movieId]))
    : currentIds.filter((id) => id !== movieId);

  writeStoredFavoriteIds(nextIds);
  return nextIds;
}

export function toggleFavoriteMovie(movieId: string) {
  const currentIds = readStoredFavoriteIds();
  const isCurrentlyFavorite = currentIds.includes(movieId);
  const nextIds = isCurrentlyFavorite
    ? currentIds.filter((id) => id !== movieId)
    : Array.from(new Set([...currentIds, movieId]));

  writeStoredFavoriteIds(nextIds);
  return !isCurrentlyFavorite;
}
