"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  Clock, 
  Star, 
  Trash2,
  Edit,
  AlertTriangle,
  Loader2
} from "lucide-react";
import MovieForm from "./_components/MovieForm";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";

interface Movie {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  releaseDate: string | null;
  duration: number | null;
  rating: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  language: string;
  status: string;
  genres: { id: string; name: string }[];
  _count: { showtimes: number };
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

const movieStatuses = [
  { value: "", label: "All Statuses" },
  { value: "ANNOUNCED", label: "Announced" },
  { value: "POST_PRODUCTION", label: "Post Production" },
  { value: "RELEASED", label: "Released" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);

  // Genre seeding state
  const [hasGenres, setHasGenres] = useState<boolean | null>(null);
  const [isSeedingGenres, setIsSeedingGenres] = useState(false);

  // Check if genres exist
  useEffect(() => {
    async function checkGenres() {
      try {
        const response = await fetch("/api/admin/seed/genres");
        if (response.ok) {
          const data = await response.json();
          setHasGenres(data.hasGenres);
        }
      } catch {
        console.error("Failed to check genres");
      }
    }
    checkGenres();
  }, []);

  // Seed genres function
  async function handleSeedGenres() {
    setIsSeedingGenres(true);
    try {
      const response = await fetch("/api/admin/seed/genres", {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        setHasGenres(true);
        // Toast notification would be better here
        alert(data.message);
      } else {
        alert(data.error || "Failed to seed genres");
      }
    } catch {
      alert("Failed to seed genres");
    } finally {
      setIsSeedingGenres(false);
    }
  }

  const fetchMovies = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      });

      if (search) params.set("search", search);
      if (status) params.set("status", status);

      const response = await fetch(`/api/admin/movies?${params}`);
      const data = await response.json();

      if (response.ok) {
        setMovies(data.movies);
        setPagination(data.pagination);
      } else {
        setError(data.error || "Failed to fetch movies");
      }
    } catch {
      setError("Failed to fetch movies");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, status, sortBy, sortOrder]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleCreateMovie(formData: any) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setIsFormOpen(false);
        fetchMovies();
      } else {
        alert(data.error || "Failed to create movie");
      }
    } catch {
      alert("Failed to create movie");
    } finally {
      setIsSubmitting(false);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleUpdateMovie(formData: any) {
    if (!editingMovie) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/movies/${editingMovie.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setIsFormOpen(false);
        setEditingMovie(null);
        fetchMovies();
      } else {
        alert(data.error || "Failed to update movie");
      }
    } catch {
      alert("Failed to update movie");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteMovie() {
    if (!movieToDelete) return;

    try {
      const response = await fetch(`/api/admin/movies/${movieToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setMovieToDelete(null);
        fetchMovies();
      } else {
        alert(data.error || "Failed to delete movie");
      }
    } catch {
      alert("Failed to delete movie");
    }
  }

  function handleEdit(movie: Movie) {
    setEditingMovie(movie);
    setIsFormOpen(true);
  }

  function handleAddNew() {
    setEditingMovie(null);
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
    setEditingMovie(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Movies</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your cinema&apos;s movie catalog.</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-red-600/20 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          <span>Add Movie</span>
        </button>
      </div>

      {/* Seed Genres Banner */}
      {hasGenres === false && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-amber-600 dark:text-amber-400">
               <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">No Genres Found</h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                You need to create genres before you can add movies.
              </p>
              <button
                onClick={handleSeedGenres}
                disabled={isSeedingGenres}
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-xs font-bold uppercase tracking-wider rounded-lg text-amber-900 bg-amber-200/50 hover:bg-amber-200 focus:outline-none disabled:opacity-50 transition-colors"
              >
                {isSeedingGenres ? "Creating Genres..." : "Seed Default Genres"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-[#09090b] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all appearance-none cursor-pointer"
            >
              {movieStatuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="createdAt">Date Created</option>
              <option value="title">Title</option>
              <option value="releaseDate">Release Date</option>
              <option value="rating">Rating</option>
            </select>
          </div>

          <div className="relative">
             <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Movies Table */}
      <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 flex flex-col items-center gap-3">
             <Loader2 className="h-8 w-8 animate-spin text-red-500" />
             <p>Loading movies...</p>
          </div>
        ) : movies.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
            <div className="bg-zinc-100 dark:bg-zinc-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No movies found</h3>
            <p className="mt-1">Try adjusting your search or filters, or add a new movie.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Movie</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Release Date</th>
                  <th className="px-6 py-4 font-semibold">Duration</th>
                  <th className="px-6 py-4 font-semibold">Rating</th>
                  <th className="px-6 py-4 font-semibold">Showtimes</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {movies.map((movie) => (
                  <tr key={movie.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-12 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700">
                          {movie.posterUrl ? (
                            <Image
                              src={movie.posterUrl}
                              alt={movie.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full w-full text-zinc-400">
                              <Search className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-zinc-900 dark:text-zinc-200 text-base">
                            {movie.title}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-[200px] truncate">
                            {movie.genres.map((g) => g.name).join(", ") || "No genres"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge 
                        status={movie.status.replace("_", " ")} 
                        variant={
                          movie.status === 'RELEASED' ? 'success' :
                          movie.status === 'ANNOUNCED' ? 'pending' :
                          movie.status === 'POST_PRODUCTION' ? 'pending' :
                          movie.status === 'CANCELLED' ? 'error' : 'default'
                        } 
                      />
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                        {movie.releaseDate
                          ? new Date(movie.releaseDate).toLocaleDateString()
                          : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-zinc-400" />
                        {movie.duration ? `${movie.duration} min` : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <span className="font-medium">{movie.rating ? movie.rating : "-"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/showtimes?movie=${movie.id}`}
                        className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                      >
                        {movie._count.showtimes} showtimes
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(movie)}
                          className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setMovieToDelete(movie)}
                          className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white dark:bg-[#09090b] px-4 py-3 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              Showing{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-200">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-200">
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.totalCount
                )}
              </span>{" "}
              of <span className="font-medium text-zinc-900 dark:text-zinc-200">{pagination.totalCount}</span>{" "}
              movies
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page - 1 }))
                }
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page + 1 }))
                }
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Movie Form Modal */}
      <MovieForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingMovie ? handleUpdateMovie : handleCreateMovie}
        movie={editingMovie}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      {movieToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#09090b] rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transform transition-all">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Delete Movie
              </h3>
              <div className="mt-2">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Are you sure you want to delete <span className="font-semibold text-zinc-900 dark:text-zinc-200">&quot;{movieToDelete.title}&quot;</span>? This action cannot be undone.
                </p>
                {movieToDelete._count.showtimes > 0 && (
                  <div className="mt-3 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                     <p className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center justify-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Cannot delete active movie
                     </p>
                     <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        This movie has {movieToDelete._count.showtimes} scheduled showtimes. Please remove them first.
                     </p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-4 flex gap-3">
              <button
                onClick={() => setMovieToDelete(null)}
                className="flex-1 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMovie}
                disabled={movieToDelete._count.showtimes > 0}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-600/20"
              >
                Delete Movie
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
