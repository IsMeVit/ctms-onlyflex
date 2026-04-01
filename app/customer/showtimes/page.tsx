"use client";

import Image from 'next/image';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomerMovieService, {
  type CustomerMovie,
  type CustomerMovieShowtime,
} from '@/components/services/CustomerMovieService';

const DEFAULT_THEATER_NAME = 'OnlyFlix Downtown';

type DateOption = {
  value: string;
  label: string;
  dayOfWeek: string;
  day?: string;
  date?: string;
};

type MovieWithTimes = CustomerMovie & {
  times: CustomerMovieShowtime[];
};

const dayOfWeekFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
});

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const bookingDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

function getDateKey(value: string | Date) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// Available theaters (fallback/static list)
const theaters = [
  { id: 1, name: 'OnlyFlix Central', address: 'Norodom Blvd, Phnom Penh' },
  { id: 2, name: 'OnlyFlix Riverside', address: 'Sisowath Quay, Phnom Penh' },
  { id: 3, name: 'OnlyFlix Sen Sok', address: 'Street 2004, Phnom Penh' },
];

interface ShowtimesPageProps {
  onBookingClick?: () => void;
}

export function ShowtimesPage({ onBookingClick }: ShowtimesPageProps) {
  const router = useRouter();
  const [selectedTheater, setSelectedTheater] = useState(theaters[0]);
  const [selectedDate, setSelectedDate] = useState<DateOption | null>(null);
  const [showtimePageByMovie, setShowtimePageByMovie] = useState<Record<string, number>>({});
  const { data, error, isLoading } = CustomerMovieService.FetchAll();

  // Compute date options based on available showtimes and a 7-day window
  const dates = useMemo(() => {
    const start = startOfDay(new Date());
    const todayKey = getDateKey(start);
    const tomorrowKey = getDateKey(addDays(start, 1));
    const maxWindowEnd = addDays(start, 6);

    // Collect showtime date keys from fetched movies (startTime)
    const showtimeKeys = new Set<string>();
    (data?.movies || []).forEach((movie: any) => {
      (movie.showtimeDetails || []).forEach((st: any) => {
        if (st.startTime) showtimeKeys.add(getDateKey(st.startTime));
      });
    });

    // Determine end date clamped to 6-day window
    let endDate = maxWindowEnd;
    if (showtimeKeys.size > 0) {
      const parsed = Array.from(showtimeKeys).map((k) => getDateFromKey(k));
      const maxShow = new Date(Math.max(...parsed.map((d) => d.getTime())));
      if (maxShow < start) {
        endDate = maxShow;
      } else if (maxShow < maxWindowEnd) {
        endDate = maxShow;
      }
    }

    const days: DateOption[] = [];
    for (let d = new Date(start); d <= endDate; d = addDays(d, 1)) {
      const key = getDateKey(d);
      days.push({
        value: key,
        label:
          key === todayKey
            ? 'Today'
            : key === tomorrowKey
              ? 'Tomorrow'
              : shortDateFormatter.format(d),
        dayOfWeek: dayOfWeekFormatter.format(d),
        date: shortDateFormatter.format(d),
      });
    }

    return days;
  }, [data?.movies]);

  // Initialize selected date when dates are available
  useEffect(() => {
    if (!selectedDate && dates.length > 0) {
      setSelectedDate(dates[0]);
    }
  }, [dates, selectedDate]);

  // Reset showtime pagination whenever the selected date changes
  useEffect(() => {
    setShowtimePageByMovie({});
  }, [selectedDate]);

  // Filter movies and their showtimes to only those matching the selected date
  const showtimes = useMemo(() => {
    if (!selectedDate?.value) return [];

    return (data?.movies || [])
      .map((movie: any) => ({
        ...movie,
        // Keep only slots whose startTime falls on the selected date
        times: (movie.showtimeDetails || []).filter((st: any) => {
          if (!st.startTime) return false;
          return getDateKey(st.startTime) === selectedDate.value;
        }),
      }))
      // Hide movies that have no showtimes on the selected date
      .filter((movie: any) => movie.times.length > 0);
  }, [data?.movies, selectedDate]);

  const handleBookShowtime = (
    movieTitle: string,
    slot: { id: string; time: string; screen: string; type: string }
  ) => {
    if (onBookingClick) {
      onBookingClick();
    }

    router.push(
      `/customer/bookings?showtimeId=${encodeURIComponent(slot.id)}&movie=${encodeURIComponent(movieTitle)}&time=${encodeURIComponent(slot.time)}&location=${encodeURIComponent(selectedTheater.name)}&screen=${encodeURIComponent(slot.screen)}&type=${encodeURIComponent(slot.type)}`
    );
  };

  return (
    <div className="pt-24 pb-20 bg-gradient-to-b from-black via-zinc-950 to-black min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">Showtimes</h1>
          <p className="text-zinc-400 text-lg">
            Choose your preferred date, and showtime
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-6 mb-12">
          {/* Date Selection */}
          <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-400 mb-3">
              <Calendar className="w-4 h-4" />
              Select Date
            </label>
            {/* Full-width grid that divides equally among available dates */}
            <div
              className="grid w-full gap-2"
              style={{ gridTemplateColumns: `repeat(${dates.length}, minmax(0, 1fr))` }}
            >
              {dates.map((date, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`w-full px-2 py-3 rounded-lg focus:outline-none cursor-pointer ${
                    selectedDate?.value === date.value
                      ? 'bg-gradient-to-r from-red-500 to-red-700 text-white shadow-lg shadow-red-500/30'
                      : 'bg-zinc-950 border border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <p className="text-xs font-medium mb-1">{date.dayOfWeek}</p>
                  <p className="font-bold text-sm truncate">
                    {date.label === 'Today' || date.label === 'Tomorrow'
                      ? date.label
                      : date.date}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Showtimes Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-zinc-400">Loading showtimes...</div>
        ) : error ? (
          <div className="text-center py-20">
            <h3 className="text-2xl font-bold mb-2">Unable to load showtimes</h3>
            <p className="text-zinc-400">Please try again later.</p>
          </div>
        ) : showtimes.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-2xl font-bold mb-2">No showtimes available</h3>
            <p className="text-zinc-400">
              There are no screenings scheduled for{' '}
              {selectedDate?.label === 'Today' || selectedDate?.label === 'Tomorrow'
                ? selectedDate.label
                : selectedDate?.date ?? 'this date'}
              . Please select another date.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {showtimes.map((show: {
              image: string;
              title: string;
              genre: string;
              duration: string;
              certification: string;
              rating: number;
              times: {
                id: string;
                time: string;
                screen: string;
                type: string;
                availableSeats: number;
              }[];
            }, index: number) => (
              <div
                key={index}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
                  {/* Movie Info */}
                  <div className="flex gap-4">
                    <div className="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden">
                      <img
                        src={show.image}
                        alt={show.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-lg mb-1">{show.title}</h3>
                        <p className="text-zinc-400 text-sm mb-2">{show.genre}</p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Clock className="w-3 h-3" />
                          {show.duration}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs">
                          {show.certification}
                        </span>
                        <span className="text-yellow-500 text-sm font-medium">★ {show.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Showtimes */}
                  <div className="md:col-span-3 flex">
                    {(() => {
                      const pageSize = 4;
                      const currentPage = showtimePageByMovie[show.title] ?? 0;
                      const totalPages = Math.max(Math.ceil(show.times.length / pageSize), 1);
                      const canPrev = currentPage > 0;
                      const canNext = currentPage < totalPages - 1;
                      const pages = Array.from({ length: totalPages }, (_, pageIndex) =>
                        show.times.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize)
                      );

                      return (
                        <div className="flex items-center gap-3 w-full">
                          {show.times.length > pageSize ? (
                            <button
                              type="button"
                              onClick={() =>
                                setShowtimePageByMovie((prev) => ({
                                  ...prev,
                                  [show.title]: Math.max(currentPage - 1, 0),
                                }))
                              }
                              disabled={!canPrev}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-black/60 text-zinc-300 backdrop-blur transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Previous showtimes"
                            >
                              <ChevronLeft className="h-4 w-4 cursor-pointer" />
                            </button>
                          ) : null}

                          <div className="flex-1 overflow-hidden">
                            <div
                              className="flex transition-transform duration-300 ease-out"
                              style={{ transform: `translateX(-${currentPage * 100}%)` }}
                            >
                              {pages.map((pageTimes, pageIndex) => (
                                <div
                                  key={`showtime-page-${pageIndex}`}
                                  className="w-full flex-shrink-0"
                                >
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {pageTimes.map((slot: {
                                      id: string;
                                      time: string;
                                      screen: string;
                                      type: string;
                                      availableSeats: number;
                                    }) => (
                                      <button
                                        key={slot.id}
                                        onClick={() => handleBookShowtime(show.title, slot)}
                                        className="group cursor-pointer bg-zinc-950 border border-zinc-800 hover:border-red-500 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-red-500/20"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="font-bold text-lg">{slot.time}</span>
                                        </div>
                                        <div className="text-left space-y-1">
                                          <div className="flex items-center gap-1 mt-2">
                                            <div className={`w-2 h-2 rounded-full ${
                                              slot.availableSeats > 40 ? 'bg-green-500' :
                                              slot.availableSeats > 20 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}></div>
                                            <span className="text-xs text-zinc-500">{slot.availableSeats} seats left</span>
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {show.times.length > pageSize ? (
                            <button
                              type="button"
                              onClick={() =>
                                setShowtimePageByMovie((prev) => ({
                                  ...prev,
                                  [show.title]: Math.min(currentPage + 1, totalPages - 1),
                                }))
                              }
                              disabled={!canNext}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-black/60 text-zinc-300 backdrop-blur transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Next showtimes"
                            >
                              <ChevronRight className="h-4 w-4 cursor-pointer" />
                            </button>
                          ) : null}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="mt-12 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">Screening Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="font-medium text-sm mb-1">Standard</p>
              <p className="text-xs text-zinc-500">Regular screening</p>
            </div>
            <div>
              <p className="font-medium text-sm mb-1">IMAX</p>
              <p className="text-xs text-zinc-500">Large format screen</p>
            </div>
            <div>
              <p className="font-medium text-sm mb-1">Dolby Atmos</p>
              <p className="text-xs text-zinc-500">Premium sound</p>
            </div>
            <div>
              <p className="font-medium text-sm mb-1">4DX</p>
              <p className="text-xs text-zinc-500">Motion seats & effects</p>
            </div>
            <div>
              <p className="font-medium text-sm mb-1">3D</p>
              <p className="text-xs text-zinc-500">3D experience</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShowtimesPageRoute() {
  return <ShowtimesPage />;
}