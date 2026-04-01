"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import BaseMovieCard from "@/components/layout/BaseMovieCard";
import CustomerMovieService from "@/components/services/CustomerMovieService";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

const genres = ["All Genres", "Action", "Sci-Fi", "Horror", "Fantasy", "Drama", "Comedy", "Romance", "Documentary"];
const certifications = ["All Ratings", "G", "PG", "PG-13", "R"];
const languages = ["All Languages", "English", "Spanish", "French", "Hindi"];
const sortOptions = [
  { value: "rating", label: "Sort by Rating" },
  { value: "title", label: "Sort by Title" },
  { value: "duration", label: "Sort by Duration" },
];

export default function ViewAllMoviesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All Genres");
  const [selectedCertification, setSelectedCertification] = useState("All Ratings");
  const [selectedLanguage, setSelectedLanguage] = useState("All Languages");
  const [sortBy, setSortBy] = useState<"title" | "rating" | "duration">("rating");
  const [showFilters, setShowFilters] = useState(false);
  const { data, error, isLoading } = CustomerMovieService.FetchAll();

  const movies = data?.movies || [];

  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  const genreOptions = genres.map((genre) => ({ value: genre, label: genre }));
  const certificationOptions = certifications.map((certification) => ({
    value: certification,
    label: certification,
  }));
  const languageOptions = languages.map((language) => ({
    value: language,
    label: language,
  }));

  const filteredAndSortedMovies = useMemo(() => {
    const filtered = movies.filter((movie: { title: string; genre: string | string[]; certification: string; language: string; }) => {
      const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === 'All Genres' || movie.genre.includes(selectedGenre);
      const matchesCertification = selectedCertification === 'All Ratings' || movie.certification === selectedCertification;
      const matchesLanguage = selectedLanguage === 'All Languages' || movie.language === selectedLanguage;
      
      return matchesSearch && matchesGenre && matchesCertification && matchesLanguage;
    });

    // Sort movies
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
    selectedGenre !== 'All Genres',
    selectedCertification !== 'All Ratings',
    selectedLanguage !== 'All Languages',
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-28">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4">All Movies</h1>
          <p className="text-zinc-400 text-lg">Browse our complete collection of films</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-stretch md:justify-between gap-4">
            {/* Search */}
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

            {/* Filter Toggle Button (Mobile) */}
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

            {/* Sort */}
            <div className="w-full md:w-56">
              <CustomDropdown
                value={sortBy}
                onChange={(value) => setSortBy(value as "title" | "rating" | "duration")}
                options={sortOptions}
                className="w-full"
              />
            </div>
          </div>

          {/* Filter Options */}
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

            <button
              onClick={clearFilters}
              disabled={activeFiltersCount === 0 && !searchQuery}
              className="h-12 w-full md:w-auto md:min-w-40 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-700 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-zinc-800"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-zinc-400">
            Showing <span className="text-white font-semibold">{filteredAndSortedMovies.length}</span> {filteredAndSortedMovies.length === 1 ? 'movie' : 'movies'}
          </p>
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">{activeFiltersCount} active filter{activeFiltersCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Movies Grid */}
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
                movie={{ ...movie, showtimes: movie.showtimes.slice(0, 3) }}
                href={`/customer/movies/view/${movie.id}`}
                onBookNow={() =>
                  router.push(`/customer/bookings?movie=${encodeURIComponent(movie.title)}`)
                }
                onShowtimeClick={(time) =>
                  router.push(
                    `/customer/bookings?movie=${encodeURIComponent(movie.title)}&time=${encodeURIComponent(time)}`
                  )
                }
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
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 rounded-lg font-medium hover:shadow-lg hover:shadow-red-500/30 transition-all"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
