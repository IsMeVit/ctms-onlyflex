"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { 
  X, 
  Clock, 
  DollarSign, 
  Film, 
  Monitor, 
  TrendingUp, 
  AlertTriangle,
  Loader2,
  Save
} from "lucide-react";

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

interface ShowtimeFormData {
  movieId: string;
  hallId: string;
  startTime: string;
  basePrice: string;
  weekendMultiplier: string;
  vipMultiplier: string;
  twinseatMultiplier: string;
  status: string;
}

interface ShowtimeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ShowtimeFormData) => void;
  showtime?: {
    id: string;
    movieId: string;
    hallId: string;
    startTime: string;
    basePrice: string;
    weekendMultiplier: string;
    vipMultiplier: string;
    twinseatMultiplier: string;
    status: string;
    movie?: Movie;
    hall?: Hall;
    bookingCount?: number;
  } | null;
  isLoading: boolean;
}

const initialFormData: ShowtimeFormData = {
  movieId: "",
  hallId: "",
  startTime: "",
  basePrice: "12.00",
  weekendMultiplier: "1.0",
  vipMultiplier: "1.5",
  twinseatMultiplier: "1.5",
  status: "ACTIVE",
};

const showtimeStatuses = [
  { value: "ACTIVE", label: "Active" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "SOLD_OUT", label: "Sold Out" },
];

function formatDateTimeForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getWeekendMultiplier(dateStr: string): number {
  if (!dateStr) return 1.0;
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0 ? 1.3 : 1.0;
}

export default function ShowtimeForm({
  isOpen,
  onClose,
  onSubmit,
  showtime,
  isLoading,
}: ShowtimeFormProps) {
  const [formData, setFormData] = useState<ShowtimeFormData>(initialFormData);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState("");

  const fetchMovies = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const response = await fetch("/api/admin/movies?status=RELEASED&limit=100");
      if (response.ok) {
        const data = await response.json();
        setMovies(data.movies || []);
      }
    } catch {
      console.error("Error fetching movies");
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const fetchHalls = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const response = await fetch("/api/admin/halls");
      if (response.ok) {
        const data = await response.json();
        const activeHalls = (data.halls || []).filter(
          (h: Hall) => h.isActive
        );
        setHalls(activeHalls);
      }
    } catch {
      console.error("Error fetching halls");
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    fetchMovies();
    fetchHalls();

    if (showtime) {
      setFormData({
        movieId: showtime.movieId || "",
        hallId: showtime.hallId || "",
        startTime: showtime.startTime
          ? formatDateTimeForInput(new Date(showtime.startTime))
          : "",
        basePrice: showtime.basePrice || "12.00",
        weekendMultiplier: showtime.weekendMultiplier || "1.0",
        vipMultiplier: showtime.vipMultiplier || "1.5",
        twinseatMultiplier: showtime.twinseatMultiplier || "1.5",
        status: showtime.status || "ACTIVE",
      });

      if (showtime.movie) {
        setSelectedMovie(showtime.movie as Movie);
      }
    } else {
      setFormData(initialFormData);
      setSelectedMovie(null);
    }
  }, [showtime, isOpen, fetchMovies, fetchHalls]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "startTime") {
        next.weekendMultiplier = getWeekendMultiplier(value).toString();
      }

      return next;
    });

    if (name === "movieId") {
      const movie = movies.find((m) => m.id === value);
      setSelectedMovie(movie || null);
    }
  };

  const getEndTime = (): string => {
    if (!formData.startTime || !selectedMovie?.duration) return "--:--";
    const start = new Date(formData.startTime);
    const duration = selectedMovie.duration;
    const end = new Date(start.getTime() + duration * 60000);
    return end.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const isWeekend = (): boolean => {
    if (!formData.startTime) return false;
    const date = new Date(formData.startTime);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.movieId || !formData.hallId || !formData.startTime) {
      setError("Please fill in all required fields");
      return;
    }

    if (!selectedMovie?.duration) {
      setError("Please select a movie with a valid duration");
      return;
    }

    setError("");
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-50 transition-colors">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {showtime ? "Edit Showtime Schedule" : "Schedule New Screening"}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Assign movie, hall, and pricing for this session.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 dark:text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm font-bold rounded-r-xl flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              {error}
            </div>
          )}

          {isLoadingData ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-red-500" />
              <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-xs">Loading Resources...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Selection Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5" /> Movie
                  </label>
                  <select
                    name="movieId"
                    value={formData.movieId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium focus:border-red-500 outline-none dark:bg-[#09090b]"
                  >
                    <option value="">Select a movie...</option>
                    {movies.map((movie) => (
                      <option key={movie.id} value={movie.id}>
                        {movie.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5" /> Cinema Hall
                  </label>
                  <select
                    name="hallId"
                    value={formData.hallId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium focus:border-red-500 outline-none dark:bg-[#09090b]"
                  >
                    <option value="">Select a hall...</option>
                    {halls.map((hall) => (
                      <option key={hall.id} value={hall.id}>
                        {hall.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedMovie && (
                <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                  {selectedMovie.posterUrl ? (
                    <div className="relative h-20 w-14 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
                      <Image
                        src={selectedMovie.posterUrl}
                        alt={selectedMovie.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="h-20 w-14 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                      <Film className="w-6 h-6 text-zinc-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{selectedMovie.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                       <Clock className="w-3.5 h-3.5" />
                       <span>{selectedMovie.duration || 0} minutes screening</span>
                    </div>
                  </div>
                </div>
              )}

              <hr className="border-zinc-100 dark:border-zinc-800" />

              {/* Timing Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <Clock className="w-4 h-4 text-zinc-400" />
                   <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Timing</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Start Time</label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold focus:border-red-500 outline-none transition-all dark:scheme-dark"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Estimated End Time</label>
                    <div className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 font-bold flex items-center">
                      {selectedMovie?.duration ? getEndTime() : "--:--"}
                    </div>
                  </div>
                </div>

                {formData.startTime && (
                  <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-colors ${
                    isWeekend() 
                      ? "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400" 
                      : "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  }`}>
                    <div className={`p-2 rounded-xl ${isWeekend() ? "bg-amber-100 dark:bg-amber-900/40" : "bg-emerald-100 dark:bg-emerald-900/40"}`}>
                       {isWeekend() ? <TrendingUp className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                       <p className="text-sm font-bold">{isWeekend() ? "Weekend Slot Detected" : "Standard Weekday Slot"}</p>
                       <p className="text-xs opacity-80">{isWeekend() ? "Weekend multiplier automatically applied." : "Base pricing logic active."}</p>
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-zinc-100 dark:border-zinc-800" />

              {/* Pricing Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <DollarSign className="w-4 h-4 text-zinc-400" />
                   <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Pricing Strategy</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Base Price ($)</label>
                    <input
                      type="number"
                      name="basePrice"
                      step="0.01"
                      min="0"
                      value={formData.basePrice}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl font-black text-lg focus:border-red-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Weekend Multiplier</label>
                    <input
                      type="number"
                      name="weekendMultiplier"
                      step="0.1"
                      min="1"
                      max="3"
                      value={formData.weekendMultiplier}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold focus:border-red-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">VIP Seat Multiplier</label>
                    <input
                      type="number"
                      name="vipMultiplier"
                      step="0.1"
                      min="1"
                      value={formData.vipMultiplier}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold focus:border-red-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Twinseat Multiplier</label>
                    <input
                      type="number"
                      name="twinseatMultiplier"
                      step="0.1"
                      min="1"
                      value={formData.twinseatMultiplier}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold focus:border-red-500 outline-none"
                    />
                  </div>
                </div>

                {/* Price Preview Card */}
                <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                   <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4 text-zinc-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live Price Preview</span>
                   </div>
                   <div className="grid grid-cols-3 gap-4">
                      <PriceBox 
                        label="Regular" 
                        price={parseFloat(formData.basePrice) * parseFloat(formData.weekendMultiplier)} 
                      />
                      <PriceBox 
                        label="VIP" 
                        price={parseFloat(formData.basePrice) * parseFloat(formData.weekendMultiplier) * parseFloat(formData.vipMultiplier)} 
                      />
                      <PriceBox 
                        label="Twinseat" 
                        price={parseFloat(formData.basePrice) * parseFloat(formData.weekendMultiplier) * parseFloat(formData.twinseatMultiplier)} 
                      />
                   </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Availability Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold focus:border-red-500 outline-none dark:bg-[#09090b]"
                >
                  {showtimeStatuses.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Form Footer Actions */}
          <div className="flex justify-end gap-4 pt-8 border-t border-zinc-100 dark:border-zinc-800 items-center">
             <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">Discard</button>
             <button 
              type="submit" 
              disabled={isLoading || isLoadingData} 
              className="px-8 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isLoading ? "Processing..." : showtime ? "Update Schedule" : "Confirm Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PriceBox({ label, price }: { label: string, price: number }) {
   return (
      <div className="space-y-1">
         <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">{label}</p>
         <p className="text-lg font-black text-zinc-900 dark:text-zinc-50 tabular-nums">${price.toFixed(2)}</p>
      </div>
   );
}
