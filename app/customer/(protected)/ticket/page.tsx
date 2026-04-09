"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CustomerTicketService, { type TicketWithBooking } from "@/components/services/CustomerTicketService";
import Image from "next/image";
import { getTicketLifecycleState, type TicketLifecycleState } from "@/lib/ticket-status";

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
  if (s === "reserved" || s === "confirmed" || s === "active" || s === "towatch")
    return <span className={`${base} bg-green-600 text-white`}>Active</span>;
  if (s === "used") return <span className={`${base} bg-zinc-600 text-white`}>Used</span>;
  if (s === "expired") return <span className={`${base} bg-amber-600 text-white`}>Expired</span>;
  if (s === "cancelled" || s === "canceled") return <span className={`${base} bg-red-600 text-white`}>Cancelled</span>;
  return <span className={`${base} bg-zinc-600 text-white`}>{status}</span>;
}

type Tab = "towatch" | "used";
type TicketView = TicketWithBooking & { lifecycleState: TicketLifecycleState };

export default function MyTickets() {
  const { data, error, isLoading } = CustomerTicketService.FetchAll();
  const [activeTab, setActiveTab] = useState<Tab>("towatch");
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const allTickets = useMemo<TicketWithBooking[]>(() => data || [], [data]);
  const tick = () => setCurrentTime(Date.now());

  useEffect(() => {
    tick();

    const intervalId = window.setInterval(tick, 5 * 60 * 1000);
    const handleFocus = () => tick();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const ticketsWithState = useMemo<TicketView[]>(
    () =>
      allTickets.map((ticket) => ({
        ...ticket,
        lifecycleState: getTicketLifecycleState(ticket, currentTime),
      })),
    [allTickets, currentTime],
  );

  const toWatchTickets = useMemo(
    () => ticketsWithState.filter((ticket) => ticket.lifecycleState === "towatch"),
    [ticketsWithState]
  );

  const usedTickets = useMemo(
    () => ticketsWithState.filter((ticket) => ticket.lifecycleState === "used" || ticket.lifecycleState === "expired"),
    [ticketsWithState]
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedTickets.map((ticket) => {
          const movie = ticket.booking?.showtime?.movie || {};
          const screen = ticket.booking?.showtime?.hall;
          const startTime = ticket.booking?.showtime?.startTime;
          const status = ticket.lifecycleState || ticket.status || "active";
          const hallName = typeof screen === "string" ? screen : screen?.name || "—";

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
                      <span>{hallName}</span>
                    </div>
                    <div className="grid grid-cols-[70px_1fr]">
                      <span className="text-zinc-400">Seat:</span>
                      <span>
                        {ticket.booking?.tickets
                          ?.map((t) => `${t.seat?.row}${t.seat?.seatNumber}`)
                          .join(", ") || `${ticket.seat?.row}${ticket.seat?.seatNumber}`}
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
                    ${parseFloat(String(ticket.booking?.finalAmount || ticket.finalPrice || "0")).toFixed(2)}
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
