"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Clock,
  Download,
  Eye,
  Filter,
  MoreVertical,
  Plus,
  Search,
  XCircle,
  Mail,
  Phone,
  Film,
  Monitor,
  Loader2,
  Calendar,
  DollarSign,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Trash2
} from "lucide-react";
import { SeatIcon } from "@/components/seats/SeatSVG";
import { FilterMore } from "./FilterMore";
import React from "react";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import { StatsCard } from "@/app/admin/_components/StatsCard";
import BookingForm from "./_components/BookingForm";
import BookingDetails from "./_components/BookingDetails";

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "REFUNDED";

interface BookingItem {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  showtime: {
    id: string;
    startTime: string;
    movie: {
      id: string;
      title: string;
    };
    hall: {
      id: string;
      name: string;
    };
  };
  finalAmount: string | number;
  bookingStatus: BookingStatus;
  payment: {
    id: string;
    paymentMethod: string;
    status: string;
  } | null;
  tickets: Array<{
    id: string;
    seat: {
      row: string;
      seatNumber: number | null;
      column: number;
    };
  }>;
  _count: {
    tickets: number;
  };
  createdAt: string;
}

interface BookingsResponse {
  bookings: BookingItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

type UiStatusFilter =
  | "all"
  | "confirmed"
  | "pending"
  | "cancelled"
  | "refunded";

export default function AdminBookingsPage() {
  // State
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<UiStatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
  });
  
  // Advanced Filters
  const [showMoreFilter, setShowMoreFilter] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    dateFrom: "",
    dateTo: "",
    movieId: "",
    hallId: ""
  });

  // UI State
  const [showForm, setShowForm] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const mapUiFilterToApiStatus = useCallback(
    (status: UiStatusFilter): "" | BookingStatus => {
      if (status === "all") return "";
      return status.toUpperCase() as BookingStatus;
    },
    [],
  );

  const fetchBookingCount = useCallback(async (status?: BookingStatus) => {
    const params = new URLSearchParams({ page: "1", limit: "1" });
    if (status) params.set("status", status);

    const response = await fetch(`/api/admin/booking?${params.toString()}`);
    const data = (await response.json()) as BookingsResponse;
    return response.ok ? (data.pagination?.totalCount || 0) : 0;
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [total, confirmed, pending, cancelled] = await Promise.all([
        fetchBookingCount(),
        fetchBookingCount("CONFIRMED"),
        fetchBookingCount("PENDING"),
        fetchBookingCount("CANCELLED"),
      ]);
      setStats({ total, confirmed, pending, cancelled });
    } catch {
      setStats({ total: 0, confirmed: 0, pending: 0, cancelled: 0 });
    }
  }, [fetchBookingCount]);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy: "createdAt",
        sortOrder,
      });

      const apiStatus = mapUiFilterToApiStatus(statusFilter);
      if (apiStatus) params.set("status", apiStatus);
      if (searchQuery) params.set("search", searchQuery);
      
      // Add advanced filters
      if (advancedFilters.dateFrom) params.set("dateFrom", advancedFilters.dateFrom);
      if (advancedFilters.dateTo) params.set("dateTo", advancedFilters.dateTo);
      if (advancedFilters.movieId) params.set("movieId", advancedFilters.movieId);
      if (advancedFilters.hallId) params.set("hallId", advancedFilters.hallId);

      const response = await fetch(`/api/admin/booking?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to fetch bookings");
        setBookings([]);
        return;
      }

      setBookings(data.bookings || []);
      setPagination(data.pagination || { page: 1, limit: 10, totalCount: 0, totalPages: 1 });
    } catch {
      setError("Failed to fetch bookings");
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortOrder, statusFilter, searchQuery, advancedFilters, mapUiFilterToApiStatus]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Helpers
  const formatMoney = (value: string | number) => {
    const parsed = typeof value === "number" ? value : Number.parseFloat(value);
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(parsed || 0);
  };

  const formatShowtime = (value: string) => {
    return new Date(value).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
  };

  const formatBookingCode = (value: string) => `BK-${value.slice(-6).toUpperCase()}`;

  const formatSeatList = (booking: BookingItem) => {
    if (!booking.tickets?.length) return `${booking._count.tickets} seat(s)`;
    return booking.tickets.map(t => `${t.seat.row}${t.seat.seatNumber ?? t.seat.column}`).join(", ");
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters({ dateFrom: "", dateTo: "", movieId: "", hallId: "" });
  };

  const handleBookingDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking? This will automatically remove all associated tickets and payment records.")) return;
    
    try {
      const response = await fetch(`/api/admin/booking/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchBookings();
        fetchStats();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete booking");
      }
    } catch {
      alert("An error occurred while deleting");
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams({
      sortBy: "createdAt",
      sortOrder,
      format: "csv"
    });

    const apiStatus = mapUiFilterToApiStatus(statusFilter);
    if (apiStatus) params.set("status", apiStatus);
    if (searchQuery) params.set("search", searchQuery);
    
    if (advancedFilters.dateFrom) params.set("dateFrom", advancedFilters.dateFrom);
    if (advancedFilters.dateTo) params.set("dateTo", advancedFilters.dateTo);
    if (advancedFilters.movieId) params.set("movieId", advancedFilters.movieId);
    if (advancedFilters.hallId) params.set("hallId", advancedFilters.hallId);

    window.open(`/api/admin/booking?${params.toString()}`, "_blank");
  };

  return (
    <div className="space-y-8 relative pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Bookings</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Track and manage all customer ticket bookings.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={handleExport}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] text-zinc-700 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all shadow-sm"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Bookings" value={stats.total} icon={SeatIcon} />
        <StatsCard title="Confirmed" value={stats.confirmed} icon={CheckCircle} trend="+12%" trendUp={true} />
        <StatsCard title="Pending" value={stats.pending} icon={Clock} />
        <StatsCard title="Cancelled" value={stats.cancelled} icon={XCircle} />
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-[#09090b] p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by ID, customer, email, or movie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 pl-11 pr-4 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-medium"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as UiStatusFilter); setPage(1); }}
              className="h-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 pr-10 text-sm font-bold text-zinc-700 dark:text-zinc-300 focus:border-red-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>

            <button
              onClick={() => setShowMoreFilter((prev) => !prev)}
              className={`inline-flex h-12 items-center gap-2 rounded-2xl border px-5 text-sm font-bold transition-all ${
                showMoreFilter 
                  ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400" 
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              <Filter className="h-4 w-4" />
              Advanced
            </button>
          </div>
        </div>
        {showMoreFilter && (
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <FilterMore 
              filters={advancedFilters} 
              setFilters={setAdvancedFilters} 
              onClear={clearAdvancedFilters} 
            />
          </div>
        )}
      </div>

      {/* Bookings Table */}
      <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-4xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Booking Ref</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Customer</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Movie & Session</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Seats</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Payment</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Status</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {isLoading ? (
                <tr>
                  <td className="px-6 py-16 text-center" colSpan={7}>
                    <div className="flex flex-col items-center gap-3">
                       <Loader2 className="h-10 w-10 animate-spin text-red-500" />
                       <p className="font-black text-zinc-500 uppercase tracking-widest text-xs">Retrieving bookings...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="px-6 py-16 text-center text-red-500 font-bold" colSpan={7}>
                    <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    {error}
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td className="px-6 py-16 text-center text-zinc-500" colSpan={7}>
                    <div className="bg-zinc-100 dark:bg-zinc-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <SeatIcon size={40} className="text-zinc-400" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">No bookings found</h3>
                    <p className="mt-2 font-medium">Try adjusting your filters.</p>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors group cursor-pointer" onClick={() => setSelectedBookingId(booking.id)}>
                    <td className="px-6 py-4">
                      <span className="font-black text-zinc-900 dark:text-zinc-50 tabular-nums bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs">
                        {formatBookingCode(booking.id)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="font-bold text-zinc-900 dark:text-zinc-200 truncate max-w-37.5">
                          {booking.user.name || "Anonymous User"}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-37.5">
                          {booking.user.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5 truncate max-w-45">
                          <Film className="h-3.5 w-3.5 text-zinc-400" />
                          {booking.showtime.movie.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-tighter">
                           {formatShowtime(booking.showtime.startTime)} • {booking.showtime.hall.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-xs text-zinc-600 dark:text-zinc-400 tabular-nums">
                        {formatSeatList(booking)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-zinc-900 dark:text-zinc-100 tabular-nums text-base">
                        {formatMoney(booking.finalAmount)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={booking.bookingStatus} variant={
                        booking.bookingStatus === 'CONFIRMED' ? 'success' :
                        booking.bookingStatus === 'PENDING' ? 'pending' :
                        booking.bookingStatus === 'CANCELLED' ? 'error' : 'default'
                      } />
                    </td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedBookingId(booking.id)}
                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleBookingDelete(booking.id)}
                          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                          title="Delete Record"
                        >
                           <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 px-8 py-5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            Showing {bookings.length} of {pagination.totalCount} entries
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="px-5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] text-xs font-black text-zinc-600 dark:text-zinc-400 disabled:opacity-30 hover:border-red-500 hover:text-red-600 transition-all cursor-pointer flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages || isLoading}
              className="px-5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] text-xs font-black text-zinc-600 dark:text-zinc-400 disabled:opacity-30 hover:border-red-500 hover:text-red-600 transition-all cursor-pointer flex items-center gap-2"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      <BookingForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => { fetchBookings(); fetchStats(); }}
      />

      {/* Booking Details Drawer */}
      {selectedBookingId && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-55 animate-in fade-in duration-300" onClick={() => setSelectedBookingId(null)} />
          <BookingDetails 
            bookingId={selectedBookingId} 
            onClose={() => setSelectedBookingId(null)} 
            onUpdate={() => { fetchBookings(); fetchStats(); }}
          />
        </>
      )}
    </div>
  );
}
