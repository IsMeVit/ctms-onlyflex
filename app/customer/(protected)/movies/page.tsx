"use client";

<<<<<<< HEAD
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
=======
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
>>>>>>> e5e1fb5 (fix: resolve build errors from customer merge)
import { Search, SlidersHorizontal, X } from "lucide-react";
import BaseMovieCard from "@/components/layout/BaseMovieCard";
import CustomerMovieService from "@/components/services/CustomerMovieService";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { ButtonRed } from "@/components/ui/ButtonRed";

const sortOptions = [
  { value: "rating", label: "Sort by Rating" },
  { value: "title", label: "Sort by Title" },
  { value: "duration", label: "Sort by Duration" },
];

function MoviesContent() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All Genres");
  const [selectedCertification, setSelectedCertification] = useState("All Ratings");
  const [selectedLanguage, setSelectedLanguage] = useState("All Languages");
  const [sortBy, setSortBy] = useState<"title" | "rating" | "duration">("rating");
  const [showFilters, setShowFilters] = useState(false);
  const { data, error, isLoading } = CustomerMovieService.FetchAll();

  const movies = useMemo(() => data?.movies ?? [], [data?.movies]);

  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  const genreOptions: Array<{ value: string; label: string }> = useMemo(() => {
    const uniqueGenres: string[] = Array.from(
      new Set<string>(
        movies.flatMap((movie: { genres: string[] }) =>
          Array.isArray(movie.genres) ? movie.genres.map((genre: string) => genre.trim()).filter(Boolean) : [],
        ),
      ),
    ).sort((left: string, right: string) => left.localeCompare(right));

    return [
      { value: "All Genres", label: "All Genres" },
      ...uniqueGenres.map((genre: string) => ({ value: genre, label: genre })),
    ];
  }, [movies]);

  const certificationOptions: Array<{ value: string; label: string }> = useMemo(() => {
    const uniqueCertifications = Array.from<string>(
      new Set(
        movies
          .map((movie: { certification?: string }) => movie.certification?.trim())
          .filter((certification: string | undefined): certification is string => Boolean(certification)),
      ),
    ).sort((left: string, right: string) => left.localeCompare(right));

    return [
      { value: "All Ratings", label: "All Ratings" },
      ...uniqueCertifications.map((certification: string) => ({
        value: certification,
        label: certification,
      })),
    ];
  }, [movies]);

  const languageOptions: Array<{ value: string; label: string }> = useMemo(() => {
    const uniqueLanguages = Array.from<string>(
      new Set(
        movies
          .map((movie: { language?: string }) => movie.language?.trim())
          .filter((language: string | undefined): language is string => Boolean(language)),
      ),
    ).sort((left: string, right: string) => left.localeCompare(right));

    return [
      { value: "All Languages", label: "All Languages" },
      ...uniqueLanguages.map((language): { value: string; label: string } => ({
        value: language as string,
        label: language as string,
      })),
    ];
  }, [movies]);

  const filteredAndSortedMovies = useMemo(() => {
    const filtered = movies.filter((movie: { title: string; genres: string[]; certification: string; language: string; }) => {
      const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre =
        selectedGenre === "All Genres" ||
        movie.genres.some((genre) => genre === selectedGenre);
      const matchesCertification =
        selectedCertification === "All Ratings" || movie.certification === selectedCertification;
      const matchesLanguage = selectedLanguage === "All Languages" || movie.language === selectedLanguage;
      
      return matchesSearch && matchesGenre && matchesCertification && matchesLanguage;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'duration') {
        const aDuration = a.durationMinutes;
        const bDuration = b.durationMinutes;
        return bDuration - aDuration;
      }
      return 0;
    });
  }, [movies, searchQuery, selectedGenre, selectedCertification, selectedLanguage, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedGenre("All Genres");
    setSelectedCertification("All Ratings");
    setSelectedLanguage("All Languages");
    setSortBy("rating");
  };

  const activeFiltersCount = [
    selectedGenre !== "All Genres",
    selectedCertification !== "All Ratings",
    selectedLanguage !== "All Languages",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-28">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4">All Movies</h1>
          <p className="text-zinc-400 text-lg">Browse our complete collection of films</p>
        </div>

        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-stretch md:justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-red-500 transition-all"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 bg-red-500 rounded-full text-xs">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <div className="w-full md:w-56">
              <CustomDropdown
                value={sortBy}
                onChange={(value) => setSortBy(value as "title" | "rating" | "duration")}
                options={sortOptions}
                className="w-full"
              />
            </div>
          </div>

          <div
            className={`${
              showFilters ? "flex" : "hidden md:flex"
            } mt-4 flex-col md:flex-row md:items-stretch md:justify-between gap-4`}
          >
            <div className="w-full md:flex-1">
              <CustomDropdown
                value={selectedGenre}
                onChange={setSelectedGenre}
                options={genreOptions}
                className="w-full"
              />
            </div>

            <div className="w-full md:flex-1">
              <CustomDropdown
                value={selectedCertification}
                onChange={setSelectedCertification}
                options={certificationOptions}
                className="w-full"
              />
            </div>

            <div className="w-full md:flex-1">
              <CustomDropdown
                value={selectedLanguage}
                onChange={setSelectedLanguage}
                options={languageOptions}
                className="w-full"
              />
            </div>

            <ButtonRed
              onClick={clearFilters}
              disabled={activeFiltersCount === 0 && !searchQuery}
              className="h-12 w-full md:w-auto md:min-w-40 px-4 py-3 border border-zinc-800 rounded-xl cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-zinc-800"
            >
              Clear All
            </ButtonRed>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          {/* <p className="text-zinc-400">
            Showing <span className="text-white font-semibold">{filteredAndSortedMovies.length}</span> {filteredAndSortedMovies.length === 1 ? 'movie' : 'movies'}
          </p> */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">{activeFiltersCount} active filter{activeFiltersCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-zinc-400">Loading movies...</div>
        ) : error ? (
          <div className="text-center py-20">
            <h3 className="text-2xl font-bold mb-2">Unable to load movies</h3>
            <p className="text-zinc-400">Please try again later.</p>
          </div>
        ) : filteredAndSortedMovies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedMovies.map((movie) => (
              <BaseMovieCard
                key={movie.id}
                movie={movie}
                href={`/customer/movies/view/${movie.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-full mb-6">
              <Search className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No movies found</h3>
            <p className="text-zinc-400 mb-6">Try adjusting your filters or search query</p>
            <ButtonRed
              onClick={clearFilters}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 rounded-lg font-medium hover:shadow-lg hover:shadow-red-500/30 transition-all"
            >
              Clear All Filters
            </ButtonRed>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ViewAllMoviesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-400">Loading movies...</div>
      </div>
    }>
      <MoviesContent />
    </Suspense>
  );
}
