"use client";

import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, SetStateAction, useEffect, useMemo, useState } from "react";
import { Play, Clock, Star } from "lucide-react";
import ButtonGray from "../ui/ButtonGray";
import CustomerMovieService from "../services/CustomerMovieService";

function splitTitle(title: string) {
  const parts = title.trim().split(" ");
  if (parts.length <= 1) {
    return { primary: title, secondary: "" };
  }

  return {
    primary: parts.slice(0, -1).join(" "),
    secondary: parts[parts.length - 1],
  };
}

export default function CarouselContent() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { data } = CustomerMovieService.FetchAll({
    limit: 5,
    sortBy: "releaseDate",
    sortOrder: "desc",
  });
  const movies = data?.movies ?? [];
  const activeMovie = movies[activeIndex] ?? null;
  const title = activeMovie ? splitTitle(activeMovie.title) : null;

  useEffect(() => {
    if (movies.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % movies.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [movies.length]);

  const genres = useMemo(() => {
    if (!activeMovie) {
      return [];
    }

    return (activeMovie.genres || []).filter(Boolean).slice(0, 2);
  }, [activeMovie]);

  if (!activeMovie) {
    return (
      <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-24">
        <div className="absolute inset-0 bg-black" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full mb-6">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-red-500">Now Playing</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-white">
              Loading latest movies...
            </h1>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-24">
      <div className="absolute inset-0">
        {activeMovie.backdropUrl || activeMovie.posterUrl ? (
          <img
            src={activeMovie.backdropUrl || activeMovie.posterUrl}
            alt={activeMovie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full mb-6">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-red-500">Now Playing</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-white">
            {title?.primary}
            {title?.secondary ? (
              <>
                <br />
                <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
                  {title.secondary}
                </span>
              </>
            ) : null}
          </h1>

          <p className="text-xl text-zinc-300 mb-8 leading-relaxed">
            {activeMovie.description}
          </p>

          <div className="flex flex-wrap items-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold text-white">
                {activeMovie.rating || "NR"}
              </span>
              <span className="text-zinc-400 text-sm">IMDb</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-zinc-400" />
              <span className="text-zinc-300">{activeMovie.duration}</span>
            </div>
            <div className="px-3 cursor-pointer hover:bg-white/20 transition-all py-1 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-white">
              {activeMovie.certification}
            </div>
            <div className="flex gap-2">
              {genres.length > 0
                ? genres
                    .filter((genre: any) => typeof genre === "string" || typeof genre === "number")
                    .map((genre: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, idx: string) => (
                      <span
                        key={String(genre) + idx}
                        className="px-3 py-1 cursor-pointer hover:bg-white/20 transition-all bg-zinc-800 border border-zinc-700 rounded-md text-sm text-white"
                      >
                        {genre}
                      </span>
                    ))
                : (
                    <span className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-white">
                      {activeMovie.genre}
                    </span>
                  )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <ButtonGray
              size="2xl"
              className="flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all"
            >
              <Play className="w-5 h-5" />
              Watch Trailer
            </ButtonGray>
          </div>

          {movies.length > 1 ? (
            <div className="mt-8 flex items-center gap-2">
              {movies.map((movie: { id: Key | null | undefined; title: any; }, index: SetStateAction<number>) => (
                <button
                  key={movie.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeIndex
                      ? "w-8 bg-red-500"
                      : "w-3 bg-zinc-700 hover:bg-zinc-500"
                  }`}
                  aria-label={`Show ${movie.title}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
