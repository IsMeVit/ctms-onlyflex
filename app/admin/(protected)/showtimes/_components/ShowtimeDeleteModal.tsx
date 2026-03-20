"use client";

import { AlertTriangle, Trash2, Loader2, Calendar, Clock } from "lucide-react";

interface Showtime {
  id: string;
  startTime: string;
  movie: {
    title: string;
  };
  bookingCount: number;
}

interface ShowtimeDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  showtime: Showtime | null;
  isLoading: boolean;
}

export default function ShowtimeDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  showtime,
  isLoading,
}: ShowtimeDeleteModalProps) {
  if (!isOpen || !showtime) return null;

  const hasBookings = showtime.bookingCount > 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#09090b] rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 dark:bg-red-900/20 mb-6">
            <Trash2 className="h-8 w-8 text-red-600 dark:text-red-500" />
          </div>
          
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Cancel Screening
          </h3>
          
          <div className="mt-3">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Are you sure you want to remove the screening of <span className="font-bold text-zinc-900 dark:text-zinc-200">&quot;{showtime.movie.title}&quot;</span>?
            </p>
            
            <div className="mt-4 flex flex-col items-center gap-1 text-xs font-bold text-zinc-400 uppercase tracking-widest">
               <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  {new Date(showtime.startTime).toLocaleDateString()}
               </div>
               <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  {new Date(showtime.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </div>
            </div>
            
            {hasBookings && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl">
                <div className="flex items-center justify-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  Active Bookings Detected
                </div>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  This screening has {showtime.bookingCount} active bookings. Cancelling it will require manual refunds or re-scheduling for customers.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900/50 px-8 py-5 flex gap-3 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors outline-none"
          >
            Keep it
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 outline-none"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {isLoading ? "Cancelling..." : "Confirm Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
