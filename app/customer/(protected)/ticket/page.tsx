"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import CustomerTicketService from "@/components/services/CustomerTicketService";
import Image from "next/image";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function StatusBadge({ status }: { status?: string }) {
  const s = (status || "").toLowerCase();
  const base = "px-2 py-1 rounded-full text-xs font-medium";
  if (s === "reserved" || s === "confirmed" || s === "active") return <span className={`${base} bg-green-600 text-white`}>Active</span>;
  if (s === "used") return <span className={`${base} bg-zinc-600 text-white`}>Used</span>;
  if (s === "cancelled" || s === "canceled") return <span className={`${base} bg-red-600 text-white`}>Cancelled</span>;
  return <span className={`${base} bg-zinc-600 text-white`}>{status}</span>;
}

type Tab = "towatch" | "used";

export default function MyTickets() {
  const { data, error, isLoading } = CustomerTicketService.FetchAll();
  const [activeTab, setActiveTab] = useState<Tab>("towatch");

  const allTickets = useMemo(() => (data as any[]) || [], [data]);

  const toWatchTickets = useMemo(
    () => allTickets.filter((t) => ["reserved", "confirmed"].includes((t.status || "").toLowerCase())),
    [allTickets]
  );

  const usedTickets = useMemo(
    () => allTickets.filter((t) => (t.status || "").toLowerCase() === "used"),
    [allTickets]
  );

  const displayedTickets = activeTab === "towatch" ? toWatchTickets : usedTickets;

  if (isLoading) {
    return (
      <div className="pt-24 px-6 max-w-4xl mx-auto">
        <div className="text-zinc-400">Loading your tickets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-24 px-6 max-w-4xl mx-auto">
        <div className="text-center text-zinc-400">Unable to load tickets. Please try again later.</div>
      </div>
    );
  }

  return (
    <div className="py-24 px-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">My Tickets</h1>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-zinc-700 mb-6">
        <button
          onClick={() => setActiveTab("towatch")}
          className={`pb-3 cursor-pointer text-sm font-medium transition-colors ${
            activeTab === "towatch"
              ? "text-red-500 border-b-2 border-red-500"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          To watch ({toWatchTickets.length})
        </button>
        <button
          onClick={() => setActiveTab("used")}
          className={`pb-3 cursor-pointer text-sm font-medium transition-colors ${
            activeTab === "used"
              ? "text-red-500 border-b-2 border-red-500"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Used ({usedTickets.length})
        </button>
      </div>

      {/* Empty state */}
      {displayedTickets.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            {activeTab === "towatch" ? "No upcoming tickets" : "No used tickets"}
          </h3>
          <p className="text-zinc-400 mb-4">
            {activeTab === "towatch"
              ? "You don't have any upcoming bookings. Browse showtimes and book a ticket."
              : "You haven't watched any movies yet."}
          </p>
          {activeTab === "towatch" && (
            <Link href="/customer/showtimes" className="inline-block bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
              Browse showtimes
            </Link>
          )}
        </div>
      )}

      {/* Ticket list */}
      <div className="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedTickets.map((ticket: any) => {
          const movie = ticket?.booking?.showtime?.movie || {};
          const screen = ticket?.booking?.showtime?.hall;
          const startTime = ticket?.booking?.showtime?.startTime;
          const status = ticket?.status || "active";

          return (
            <div key={ticket.id} className="bg-zinc-800 rounded-2xl overflow-hidden">
              {/* Top section */}
              <div className="p-4 flex gap-4">
                {/* Poster */}
                <div className="w-24 h-36 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-700">
                  {movie.posterUrl ? (
                    <Image src={movie.posterUrl} alt={movie.title} width={96} height={144} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full bg-zinc-700" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col gap-2">
                  <h3 className="text-white font-bold text-base leading-tight">{movie.title}</h3>

                  {/* Details */}
                  <div className="text-sm text-zinc-300 space-y-1 mt-1">
                    <div className="grid grid-cols-[70px_1fr]">
                      <span className="text-zinc-400">Hall:</span>
                      <span>{typeof screen === "object" ? (screen as any)?.name : screen || "—"}</span>
                    </div>
                    <div className="grid grid-cols-[70px_1fr]">
                      <span className="text-zinc-400">Seat:</span>
                      <span>
                        {ticket?.booking?.tickets
                          ?.map((t: any) => `${t.seat?.row}${t.seat?.seatNumber}`)
                          .join(", ") || `${ticket?.seat?.row}${ticket?.seat?.seatNumber}`}
                      </span>
                    </div>
                    <div className="grid grid-cols-[70px_1fr]">
                      <span className="text-zinc-400">Date:</span>
                      <span>{startTime ? dateFormatter.format(new Date(startTime)) : "TBA"}</span>
                    </div>
                    <div className="grid grid-cols-[70px_1fr]">
                      <span className="text-zinc-400">Time:</span>
                      <span>
                        {startTime ? timeFormatter.format(new Date(startTime)) : "TBA"}
                        {ticket?.booking?.showtime?.endTime
                          ? ` - ${timeFormatter.format(new Date(ticket.booking.showtime.endTime))}`
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider with notches */}
              <div className="relative flex items-center px-4">
                <div className="absolute -left-3 w-6 h-6 bg-black rounded-full" />
                <div className="flex-1 border-t-2 border-dashed border-zinc-600" />
                <div className="absolute -right-3 w-6 h-6 bg-black rounded-full" />
              </div>

              {/* Bottom section */}
              <div className="p-4 flex items-center justify-between">
                <div className="text-zinc-400 text-sm">
                  {ticket?.booking?.tickets?.length || 1} ticket{(ticket?.booking?.tickets?.length || 1) > 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={status} />
                  <span className="text-white font-bold text-lg">
                    ${parseFloat(ticket?.booking?.finalAmount || ticket?.finalPrice || "0").toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}