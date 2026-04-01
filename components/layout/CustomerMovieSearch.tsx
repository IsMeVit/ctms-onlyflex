"use client";

import { Search, X } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CustomerMovieService from "@/components/services/CustomerMovieService";
import { ImageWithFallback } from "@/app/sample_app/src/components/figma/ImageWithFallback";

type CustomerMovieSearchProps = {
  mobile?: boolean;
};

type Movie = {
  id: string;
  title: string;
  image: string;
  releaseDate: string;
};

export default function CustomerMovieSearch({
  mobile = false,
}: CustomerMovieSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState(searchParams.get("search") || "");
  const deferredQuery = useDeferredValue(query);
  const searchRef = useRef<HTMLDivElement>(null);
  const { data } = CustomerMovieService.FetchAll({
    limit: 50,
    sortBy: "releaseDate",
    sortOrder: "desc",
  });

  const movies: Movie[] = data?.movies || [];
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalizedQuery) {
      return movies.slice(0, 10);
    }

    return movies
      .filter((movie: Movie) => movie.title.toLowerCase().includes(normalizedQuery))
      .slice(0, 10);
  }, [movies, normalizedQuery]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      router.push("/customer/movies");
      setIsOpen(false);
      return;
    }

    router.push(`/customer/movies?search=${encodeURIComponent(trimmedQuery)}`);
  };

  const handleMovieClick = (movieId: string) => {
    setIsOpen(false);
    router.push(`/customer/movies/view/${movieId}`);
  };

  useEffect(() => {
    setQuery(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (mobile) {
    return (
      <div ref={searchRef} className="pb-2">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-red-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setIsOpen(true);
              }}
              onFocus={() => {
                setIsOpen(true);
                setIsFocused(true);
              }}
              onBlur={() => setIsFocused(false)}
              onClick={() => setIsOpen(true)}
              placeholder="Search Movies..."
className="w-full rounded-2xl border border-zinc-500 bg-zinc-950 py-2 pl-11 pr-11 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/30"            />
            {isFocused || query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setIsOpen(false);
                }}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {isOpen ? (
            <div className="max-h-[26rem] overflow-y-auto rounded-2xl border border-zinc-700/60 bg-black p-3 shadow-2xl shadow-black/50">
              <p className="mb-3 px-2 text-2xl font-bold text-white">Search</p>
              {results.length > 0 ? (
                <div className="space-y-2">
                  {results.map((movie) => (
                    <button
                      key={movie.id}
                      type="button"
                      onClick={() => handleMovieClick(movie.id)}
                      className="flex w-full items-start gap-4 rounded-xl border border-zinc-700/60 bg-zinc-950/40 px-2 py-3 text-left transition-all hover:bg-zinc-950"
                    >
                      <div className="h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
                        <ImageWithFallback
                          src={movie.image}
                          alt={movie.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-2xl font-semibold text-white">
                          {movie.title}
                        </p>
                        <p className="mt-2 text-base text-zinc-400">{movie.releaseDate}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-700/60 bg-zinc-950 px-4 py-6 text-center text-sm text-zinc-400">
                  No movies found.
                </div>
              )}
            </div>
          ) : null}
        </form>
      </div>
    );
  }

  return (
    <div ref={searchRef} className="relative hidden md:block">
      <div className="relative">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-300" />
            <input
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setIsOpen(true);
              }}
              placeholder="Search Movies..."
              onFocus={() => {
                setIsOpen(true);
                setIsFocused(true);
              }}
              onBlur={() => setIsFocused(false)}
              onClick={() => setIsOpen(true)}
className="w-60 rounded-3xl border border-zinc-500 bg-zinc-900/95 py-2 pl-12 pr-12 text-base text-white outline-none placeholder:text-zinc-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/30"            />
            {isFocused || query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery(searchParams.get("search") || "");
                  setIsOpen(false);
                }}
                className="absolute cursor-pointer right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </form>

        {isOpen ? (
          <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[70] w-[28rem] max-h-[28rem] overflow-y-auto rounded-2xl border border-zinc-700/60 bg-black p-5 shadow-2xl shadow-black/60">
            <p className="mb-4 text-2xl font-bold text-white">Search</p>
            {results.length > 0 ? (
              <div className="space-y-3">
                {results.map((movie) => (
                  <button
                    key={movie.id}
                    type="button"
                    onClick={() => handleMovieClick(movie.id)}
                    className="flex w-full items-start gap-4 rounded-xl border border-zinc-700/60 bg-zinc-950/40 p-4 text-left transition-all hover:bg-zinc-950"
                  >
                    <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
                      <ImageWithFallback
                        src={movie.image}
                        alt={movie.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xl font-semibold text-white">
                        {movie.title}
                      </p>
                      <p className="mt-2 text-sm text-zinc-400">{movie.releaseDate}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950 px-4 py-8 text-center text-zinc-400">
                No movies found.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
