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
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";
import { FilterMore } from "./FilterMore";
import { Button } from "@/components/ui/ButtonAddNew";
import { useForm } from "react-hook-form";
import BaseFormModal from "@/components/utils/BaseFormModal";
import BaseInput from "@/components/utils/BaseInput";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import React from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import BaseTextBox from "@/components/utils/BaseTextBox";
import ButtonCancel from "@/components/ui/ButtonCancel";

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
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<UiStatusFilter>("all");
  const [movie, setMovie] = useState("all");

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
  const [showMoreFilter, setShowMoreFilter] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Initialize react-hook-form methods for the booking form
  const formMethods = useForm();

  const mapUiFilterToApiStatus = useCallback(
    (status: UiStatusFilter): "" | BookingStatus => {
      if (status === "all") return "";
      return status.toUpperCase() as BookingStatus;
    },
    [],
  );

  const fetchBookingCount = useCallback(async (status?: BookingStatus) => {
    const params = new URLSearchParams({ page: "1", limit: "1" });
    if (status) {
      params.set("status", status);
    }

    const response = await fetch(`/api/admin/booking?${params.toString()}`);
    const data = (await response.json()) as BookingsResponse & {
      error?: string;
    };

    if (!response.ok) {
      return 0;
    }

    return data.pagination?.totalCount || 0;
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
      if (apiStatus) {
        params.set("status", apiStatus);
      }

      const response = await fetch(`/api/admin/booking?${params.toString()}`);
      const data = (await response.json()) as BookingsResponse & {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error || "Failed to fetch bookings");
        setBookings([]);
        return;
      }

      setBookings(data.bookings || []);
      setPagination(
        data.pagination || { page: 1, limit: 10, totalCount: 0, totalPages: 1 },
      );
    } catch {
      setError("Failed to fetch bookings");
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit, mapUiFilterToApiStatus, page, sortOrder, statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatMoney = useCallback((value: string | number) => {
    const parsed = typeof value === "number" ? value : Number.parseFloat(value);

    if (Number.isNaN(parsed)) {
      return "$0.00";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parsed);
  }, []);

  const formatShowtime = useCallback((value: string) => {
    const date = new Date(value);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, []);

  const formatBookingCode = useCallback((value: string) => {
    const cleaned = value.replace(/-/g, "").toUpperCase();
    const suffix = cleaned.slice(-4);
    return `BK-${suffix || "0000"}`;
  }, []);

  const formatSeatList = useCallback((booking: BookingItem) => {
    if (!booking.tickets || booking.tickets.length === 0) {
      return `${booking._count.tickets} seat(s)`;
    }

    return booking.tickets
      .map((ticket) => {
        const seatNo = ticket.seat.seatNumber ?? ticket.seat.column;
        return `${ticket.seat.row}${seatNo}`;
      })
      .join(", ");
  }, []);

  const formatPaymentMethod = useCallback((value: string | undefined) => {
    if (!value) return "No payment";
    return value
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }, []);

  const getStatusStyle = useCallback((status: BookingStatus) => {
    if (status === "CONFIRMED") return "bg-green-500/10 text-green-400";
    if (status === "PENDING") return "bg-yellow-500/10 text-yellow-400";
    if (status === "CANCELLED") return "bg-red-500/10 text-red-400";
    return "bg-cyan-500/10 text-cyan-400";
  }, []);

  const getStatusIcon = useCallback((status: BookingStatus) => {
    if (status === "CONFIRMED") return <CheckCircle className="h-3.5 w-3.5" />;
    if (status === "PENDING") return <Clock className="h-3.5 w-3.5" />;
    if (status === "CANCELLED") return <XCircle className="h-3.5 w-3.5" />;
    return <RotateCcw className="h-3.5 w-3.5" />;
  }, []);

  const totalText = useMemo(() => {
    if (!pagination.totalCount) return "No records";

    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(
      pagination.page * pagination.limit,
      pagination.totalCount,
    );
    return `Showing ${start}-${end} of ${pagination.totalCount}`;
  }, [pagination]);

  const filteredBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return bookings;

    return bookings.filter((booking) => {
      const bookingId = booking.id.toLowerCase();
      const customer = (booking.user.name || "").toLowerCase();
      const email = booking.user.email.toLowerCase();
      const movie = booking.showtime.movie.title.toLowerCase();

      return (
        bookingId.includes(query) ||
        customer.includes(query) ||
        email.includes(query) ||
        movie.includes(query)
      );
    });
  }, [bookings, searchQuery]);

  const exportCsv = useCallback(() => {
    if (filteredBookings.length === 0) {
      alert("No bookings available to export.");
      return;
    }

    const header = [
      "Booking ID",
      "Customer",
      "Email",
      "Movie",
      "Hall",
      "Showtime",
      "Tickets",
      "Amount",
      "Status",
    ];

    const rows = filteredBookings.map((booking) => [
      booking.id,
      booking.user.name || "Unnamed user",
      booking.user.email,
      booking.showtime.movie.title,
      booking.showtime.hall.name,
      formatShowtime(booking.showtime.startTime),
      String(booking._count.tickets),
      formatMoney(booking.finalAmount),
      booking.bookingStatus,
    ]);

    const csvContent = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `bookings-page-${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredBookings, formatMoney, formatShowtime, page]);

  const handleAddBooking = (data: any) => {
    // TODO: Implement booking creation logic
    setShowForm(false);
    alert("Booking created!\n" + JSON.stringify(data, null, 2));
  };

  return (
    <div className="text-zinc-100">
      <div className="flex flex-1 justify-end mb-4">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-5 w-5" />
          Add New Booking
        </Button>
      </div>

      <BaseFormModal
        showModal={showForm}
        closeModal={setShowForm}
        modalId="addBookingModal"
        modalTitle="Add New Booking"
      >
        <form
          className="space-y-4"
          onSubmit={formMethods.handleSubmit(handleAddBooking)}
        >
          <CustomDropdown
            value={movie}
            onChange={setMovie}
            label="Select Movie"
            isRequired={true}
            options={[
              { value: "all", label: "All Movies" },
              { value: "legen-cinema", label: "Legen Cinema" },
              { value: "legen-kmall", label: "Legen Kmall" },
              { value: "olympia", label: "Olympia ---" },
            ]}
          />
          <BaseInput
            label="Customer Name"
            isRequired={true}
            type="text"
            placeholder="Enter customer name..."
            {...formMethods.register("customerName", {
              required: "Name is required",
            })}
          />
          <div className="release-date flex gap-4">
            <BaseInput
              label="Director"
              isRequired={true}
              type="text"
              className="flex-1"
              placeholder="Enter director name..."
              {...formMethods.register("director", {
                required: "Director is required",
              })}
            />
            <DatePicker
              value=""
              onChange={() => {}}
              label="Select Release Date"
              isRequired={true}
              placeholder="Select Release Date"
              className="flex-1"
            />
          </div>
          <BaseTextBox
            label="Description"
            placeholder="Enter movie synopsis..."
          />
          <div className="flex gap-4">
            <ButtonCancel
              onClick={() => setShowForm(false)}
              className="flex-1"
            />
            <Button type="submit" className="flex-1">
              Create Booking
            </Button>
          </div>
        </form>
      </BaseFormModal>

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Bookings Management</h1>
            <p className="mt-2 text-zinc-400">
              Track and manage all ticket bookings
            </p>
          </div>

          <button
            onClick={exportCsv}
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-6 py-3 font-medium transition-all hover:border-zinc-700 cursor-pointer"
          >
            <Download className="h-5 w-5" />
            Export
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="mb-1 text-sm text-zinc-400">Total Bookings</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="mb-1 flex items-center gap-2 text-sm text-green-500">
              <CheckCircle className="h-4 w-4" />
              <span className="text-zinc-400">Confirmed</span>
            </div>
            <p className="text-3xl font-bold text-green-500">
              {stats.confirmed}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="mb-1 flex items-center gap-2 text-sm text-yellow-500">
              <Clock className="h-4 w-4" />
              <span className="text-zinc-400">Pending</span>
            </div>
            <p className="text-3xl font-bold text-yellow-500">
              {stats.pending}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="mb-1 flex items-center gap-2 text-sm text-red-500">
              <XCircle className="h-4 w-4" />
              <span className="text-zinc-400">Cancelled</span>
            </div>
            <p className="text-3xl font-bold text-red-500">{stats.cancelled}</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative min-w-[260px] flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search by booking ID, customer, email, or movie..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-12 w-full rounded-lg border border-zinc-800 bg-zinc-950 pl-12 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as UiStatusFilter);
                  setPage(1);
                }}
                className="h-12 rounded-lg border border-zinc-800 bg-zinc-950 px-4 pr-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>

              <select
                value={sortOrder}
                onChange={(event) => {
                  setSortOrder(event.target.value as "asc" | "desc");
                  setPage(1);
                }}
                className="h-12  rounded-lg border border-zinc-800 bg-zinc-950 px-4 pr-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>

              <button
                onClick={() => setShowMoreFilter((prev) => !prev)}
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-4 text-sm transition-all hover:border-zinc-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <Filter className="h-4 w-4" />
                More Filters
              </button>
            </div>
          </div>
          <div className="more-filter">{showMoreFilter && <FilterMore />}</div>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-3 text-xs text-zinc-500">
            <span>{totalText}</span>
            <span>Showing {filteredBookings.length} row(s) on this page</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="border-b border-zinc-800 bg-zinc-950">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400">
                    Booking ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400">
                    Movie & Showtime
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400">
                    Seats
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading && (
                  <tr>
                    <td className="px-6 py-8 text-sm text-zinc-400" colSpan={7}>
                      Loading bookings...
                    </td>
                  </tr>
                )}

                {!isLoading && error && (
                  <tr>
                    <td className="px-6 py-8 text-sm text-red-400" colSpan={7}>
                      {error}
                    </td>
                  </tr>
                )}

                {!isLoading && !error && filteredBookings.length === 0 && (
                  <tr>
                    <td className="px-6 py-8 text-sm text-zinc-400" colSpan={7}>
                      No bookings found for the selected filters.
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  !error &&
                  filteredBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-b border-zinc-800 transition-colors hover:bg-zinc-950"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium">
                          {formatBookingCode(booking.id)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium">
                            {booking.user.name || "Unnamed user"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {booking.user.email}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {booking.user.phone || "No phone"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium">
                            {booking.showtime.movie.title}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {formatShowtime(booking.showtime.startTime)}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {booking.showtime.hall.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-zinc-400">
                          {formatSeatList(booking)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold">
                          {formatMoney(booking.finalAmount)}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {formatPaymentMethod(booking.payment?.paymentMethod)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                            booking.bookingStatus,
                          )}`}
                        >
                          {getStatusIcon(booking.bookingStatus)}
                          {booking.bookingStatus.charAt(0) +
                            booking.bookingStatus.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              window.open(
                                `/api/admin/booking/${booking.id}`,
                                "_blank",
                              )
                            }
                            className="rounded-lg p-2 transition-colors hover:bg-zinc-800"
                            title="View booking details"
                          >
                            <Eye className="h-4 w-4 text-zinc-400" />
                          </button>

                          <button
                            className="rounded-lg p-2 transition-colors hover:bg-zinc-800"
                            title="More options"
                          >
                            <MoreVertical className="h-4 w-4 text-zinc-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-zinc-500">
            Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={pagination.page <= 1 || isLoading}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 transition-colors hover:bg-zinc-800 cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setPage((current) =>
                  Math.min(current + 1, Math.max(pagination.totalPages, 1)),
                )
              }
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 transition-colors hover:bg-zinc-800 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
