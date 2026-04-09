"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Film, Heart } from "lucide-react";
import BaseMovieCard from "@/components/layout/BaseMovieCard";
import CustomerMovieService from "@/components/services/CustomerMovieService";
import { buttonRedVariants } from "@/components/ui/ButtonRed";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  FAVORITE_MOVIES_UPDATED_EVENT,
  getFavoriteMovieIds,
} from "@/lib/favorite-movies";

export default function FavoriteMoviesPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();
  const { data, error, isLoading } = CustomerMovieService.FetchAll({
    limit: 100,
    sortBy: "releaseDate",
    sortOrder: "desc",
  });
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isFavoritesReady, setIsFavoritesReady] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login?callbackUrl=/customer/favorite");
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    const syncFavorites = () => {
      setFavoriteIds(getFavoriteMovieIds());
      setIsFavoritesReady(true);
    };

    syncFavorites();
    window.addEventListener(FAVORITE_MOVIES_UPDATED_EVENT, syncFavorites as EventListener);
    window.addEventListener("storage", syncFavorites);

    return () => {
      window.removeEventListener(FAVORITE_MOVIES_UPDATED_EVENT, syncFavorites as EventListener);
      window.removeEventListener("storage", syncFavorites);
    };
  }, []);

  const favoriteMovies = useMemo(() => {
    const favoriteIdSet = new Set(favoriteIds);
    const movies = data?.movies ?? [];

    return [...movies]
      .filter((movie) => favoriteIdSet.has(movie.id))
      .sort((left, right) => favoriteIds.indexOf(left.id) - favoriteIds.indexOf(right.id));
  }, [data?.movies, favoriteIds]);

  if (!isInitialized || !isFavoritesReady) {
    return (
      <div className="min-h-screen bg-[#050909] px-4 py-6 sm:px-6 lg:px-8 text-white">
        <div className="mx-auto max-w-7xl pt-24 text-zinc-400">Loading favorites...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050909] px-4 py-6 sm:px-6 lg:px-8 text-white">
      <div className="mx-auto max-w-7xl pt-24">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/customer/profile"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300">
            <Heart className="h-4 w-4" />
            Favorites
          </div>
        </div>

        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.35em] text-zinc-500">Saved movies</p>
          <h1 className="mt-3 text-4xl font-bold text-white">My Favorites</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Movies you marked as favorites will appear here for quick access.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Failed to load favorite movies.
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`favorite-movie-skeleton-${index}`}
                className="h-[30rem] animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60"
              />
            ))}
          </div>
        ) : favoriteMovies.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-500">
              <Film className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-white">No favorites yet</h2>
            <p className="mt-3 text-sm text-zinc-400">
              Tap the heart on a movie to save it here.
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/customer/movies"
                className={cn(
                  buttonRedVariants({ size: "default" }),
                  "bg-red-600 text-white hover:bg-red-500",
                )}
              >
                Browse Movies
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {favoriteMovies.map((movie) => (
              <BaseMovieCard
                key={movie.id}
                movie={movie}
                href={`/customer/movies/view/${movie.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
