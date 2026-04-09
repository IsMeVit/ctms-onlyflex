"use client";

import { useState, useEffect, useCallback } from "react";
import { Film, Clock, MapPin, Users, Calendar, Ticket } from "lucide-react";

interface Showtime {
  id: string;
  startTime: string;
  endTime: string;
  basePrice: string;
  status: string;
  hall: {
    id: string;
    name: string;
    capacity: number;
  };
  movie: {
    id: string;
    title: string;
    posterUrl: string | null;
    duration: number | null;
  };
  _count: {
    tickets: number;
  };
}

export default function FrontDeskSchedulePage() {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchShowtimes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/front-desk/schedule?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setShowtimes(data.showtimes || []);
      }
    } catch (err) {
      console.error("Error fetching schedule:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchShowtimes();
  }, [fetchShowtimes]);

  const getAvailableSeats = (showtime: Showtime) => {
    return showtime.hall.capacity - showtime._count.tickets;
  };

  const getDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.toISOString().split("T")[0],
        label: i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
      });
    }
    return dates;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Movie Schedule
          </h1>
          <p className="text-white/60 mt-1">
            View showtimes and availability
          </p>
        </div>
      </div>

      <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {getDates().map((d) => (
            <button
              key={d.date}
              onClick={() => setSelectedDate(d.date)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedDate === d.date
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/25"
                  : "bg-white/10 border border-white/20 text-white/70 hover:text-white hover:bg-white/20"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/60">Loading schedule...</div>
      ) : showtimes.length === 0 ? (
        <div className="text-center py-12">
          <Film className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">No showtimes scheduled for this date</p>
        </div>
      ) : (
        <div className="space-y-4">
          {showtimes.map((showtime) => {
            const availableSeats = getAvailableSeats(showtime);
            const isSoldOut = availableSeats <= 0;
            const isAlmostFull = availableSeats < 10;

            return (
              <div
                key={showtime.id}
                className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-4 hover:border-white/20 transition-all"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-24 h-36 bg-white/10 border border-white/20 rounded-lg overflow-hidden flex-shrink-0">
                    {showtime.movie.posterUrl ? (
                      <img
                        src={showtime.movie.posterUrl}
                        alt={showtime.movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-8 h-8 text-white/40" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {showtime.movie.title}
                        </h3>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-white/60">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {new Date(showtime.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {" - "}
                            {new Date(showtime.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {showtime.hall.name}
                          </div>
                          {showtime.movie.duration && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {showtime.movie.duration} min
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">
                          ${parseFloat(showtime.basePrice).toFixed(2)}
                        </p>
                        <p className="text-xs text-white/50">from</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-white/50" />
                        <span className="text-sm">
                          <span className={isSoldOut ? "text-red-400" : isAlmostFull ? "text-yellow-400" : "text-white/70"}>
                            {availableSeats} seats available
                          </span>
                          {" / "}
                          <span className="text-white/50">{showtime.hall.capacity} total</span>
                        </span>
                      </div>

                      {showtime.status === "ACTIVE" && !isSoldOut && (
                        <a
                          href={`/front-desk/bookings/new?showtimeId=${showtime.id}`}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-red-600/25 text-sm flex items-center gap-2"
                        >
                          <Ticket className="w-4 h-4" />
                          Book Now
                        </a>
                      )}
                      {isSoldOut && (
                        <span className="px-3 py-1.5 bg-white/10 border border-white/20 text-white/60 rounded-lg text-sm">
                          Sold Out
                        </span>
                      )}
                      {showtime.status === "CANCELLED" && (
                        <span className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
