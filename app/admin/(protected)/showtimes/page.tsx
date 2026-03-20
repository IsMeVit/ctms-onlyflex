"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Ticket, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Monitor
} from "lucide-react";
import ShowtimeForm from "./_components/ShowtimeForm";
import ShowtimeDeleteModal from "./_components/ShowtimeDeleteModal";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";

interface Movie {
  id: string;
  title: string;
  posterUrl: string | null;
  duration: number | null;
}

interface Hall {
  id: string;
  name: string;
  capacity?: number;
  isActive: boolean;
  isPublished: boolean;
}

interface Showtime {
  id: string;
  movieId: string;
  hallId: string;
  startTime: string;
  endTime: string;
  basePrice: string;
  weekendMultiplier: string;
  vipMultiplier: string;
  twinseatMultiplier: string;
  isWeekend: boolean;
  status: string;
  movie: Movie;
  hall: Hall;
  bookingCount: number;
  ticketCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

const showtimeStatuses = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "SOLD_OUT", label: "Sold Out" },
  { value: "COMPLETED", label: "Completed" },
];

export default function ShowtimesPage() {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [movieFilter, setMovieFilter] = useState("");
  const [hallFilter, setHallFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy] = useState("startTime");
  const [sortOrder] = useState<"asc" | "desc">("asc");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState<Showtime | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showtimeToDelete, setShowtimeToDelete] = useState<Showtime | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMovies = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/movies?status=RELEASED&limit=100");
      if (response.ok) {
        const data = await response.json();
        setMovies(data.movies || []);
      }
    } catch (err) {
      console.error("Error fetching movies:", err);
    }
  }, []);

  const fetchHalls = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/halls");
      if (response.ok) {
        const data = await response.json();
        const publishedHalls = (data.halls || []).filter(
          (h: Hall & { isActive: boolean }) => h.isActive
        );
        setHalls(publishedHalls);
      }
    } catch (err) {
      console.error("Error fetching halls:", err);
    }
  }, []);

  const fetchShowtimes = useCallback(async () => {
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
      if (movieFilter) params.set("movieId", movieFilter);
      if (hallFilter) params.set("hallId", hallFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const response = await fetch(`/api/admin/showtimes?${params}`);
      const data = await response.json();

      if (response.ok) {
        setShowtimes(data.showtimes);
        setPagination(data.pagination);
      } else {
        setError(data.error || "Failed to fetch showtimes");
      }
    } catch {
      setError("Failed to fetch showtimes");
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    search,
    movieFilter,
    hallFilter,
    statusFilter,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchShowtimes();
    fetchMovies();
    fetchHalls();
  }, [fetchShowtimes, fetchMovies, fetchHalls]);

  async function handleCreateShowtime(formData: Record<string, string | number | boolean>) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/showtimes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setIsFormOpen(false);
        fetchShowtimes();
      } else {
        alert(data.error || "Failed to create showtime");
      }
    } catch {
      alert("Failed to create showtime");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateShowtime(formData: Record<string, string | number | boolean>) {
    if (!editingShowtime) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/showtimes/${editingShowtime.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setIsFormOpen(false);
        setEditingShowtime(null);
        fetchShowtimes();
      } else {
        alert(data.error || "Failed to update showtime");
      }
    } catch {
      alert("Failed to update showtime");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteShowtime() {
    if (!showtimeToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/showtimes/${showtimeToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setShowtimeToDelete(null);
        fetchShowtimes();
      } else {
        alert(data.error || "Failed to delete showtime");
      }
    } catch {
      alert("Failed to delete showtime");
    } finally {
      setIsDeleting(false);
    }
  }

  function handleEdit(showtime: Showtime) {
    setEditingShowtime(showtime);
    setIsFormOpen(true);
  }

  function handleAddNew() {
    setEditingShowtime(null);
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
    setEditingShowtime(null);
  }

  function formatPrice(price: string, multiplier: string): string {
    const base = parseFloat(price);
    const mult = parseFloat(multiplier);
    return `$${(base * mult).toFixed(2)}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Showtimes</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Schedule and manage movie screenings.</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-600/20 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          <span>Schedule Screening</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#09090b] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <select
              value={movieFilter}
              onChange={(e) => setMovieFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">All Movies</option>
              {movies.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Monitor className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <select
              value={hallFilter}
              onChange={(e) => setHallFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">All Halls</option>
              {halls.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <TrendingUp className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all appearance-none cursor-pointer"
            >
              {showtimeStatuses.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all dark:[color-scheme:dark]"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all dark:[color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-16 text-center text-zinc-500 flex flex-col items-center gap-3">
             <Loader2 className="h-10 w-10 animate-spin text-red-500" />
             <p className="font-bold">Loading showtimes...</p>
          </div>
        ) : showtimes.length === 0 ? (
          <div className="p-16 text-center text-zinc-500">
            <div className="bg-zinc-100 dark:bg-zinc-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-10 w-10 text-zinc-400" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">No showtimes scheduled</h3>
            <p className="mt-2 font-medium">Try adjusting your filters or schedule a new screening.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Movie</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Hall</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Date & Time</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Base Price</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Bookings</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Status</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {showtimes.map((showtime) => (
                  <tr key={showtime.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {showtime.movie.posterUrl && (
                          <div className="relative h-14 w-10 shrink-0 shadow-sm overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                            <Image
                              src={showtime.movie.posterUrl}
                              alt={showtime.movie.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-200">{showtime.movie.title}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{showtime.movie.duration} min</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-bold">
                         <Monitor className="h-3.5 w-3.5 text-zinc-400" />
                         {showtime.hall.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-900 dark:text-zinc-100 font-bold">
                        {new Date(showtime.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-1 font-bold">
                        <Clock className="h-3 w-3" />
                        {new Date(showtime.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {showtime.isWeekend && (
                          <span className="px-1.5 py-0.5 text-[9px] uppercase font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded">
                            Weekend
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-zinc-900 dark:text-zinc-100 font-black tabular-nums">
                          {formatPrice(showtime.basePrice, "1")}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                           <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-[#09090b] flex items-center justify-center">
                              <Ticket className="h-3 w-3 text-zinc-400" />
                           </div>
                        </div>
                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                          {showtime.bookingCount} bookings
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge 
                        status={showtime.status} 
                        variant={
                          showtime.status === 'ACTIVE' ? 'success' :
                          showtime.status === 'SOLD_OUT' ? 'pending' :
                          showtime.status === 'CANCELLED' ? 'error' : 'default'
                        } 
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(showtime)}
                          className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowtimeToDelete(showtime)}
                          className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
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
          <div className="bg-white dark:bg-[#09090b] px-6 py-4 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ShowtimeForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingShowtime ? handleUpdateShowtime : handleCreateShowtime}
        showtime={editingShowtime}
        isLoading={isSubmitting}
      />

      <ShowtimeDeleteModal
        isOpen={!!showtimeToDelete}
        onClose={() => setShowtimeToDelete(null)}
        onConfirm={handleDeleteShowtime}
        showtime={showtimeToDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
