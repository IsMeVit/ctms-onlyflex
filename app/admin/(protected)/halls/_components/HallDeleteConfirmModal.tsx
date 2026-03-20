"use client";

import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

interface Hall {
  id: string;
  name: string;
  _count: {
    showtimes: number;
    seats: number;
  };
}

interface HallDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  hall: Hall | null;
  isLoading: boolean;
}

export default function HallDeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  hall,
  isLoading,
}: HallDeleteConfirmModalProps) {
  if (!isOpen || !hall) return null;

  const hasShowtimes = hall._count.showtimes > 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#09090b] rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 dark:bg-red-900/20 mb-6">
            <Trash2 className="h-8 w-8 text-red-600 dark:text-red-500" />
          </div>
          
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Delete Cinema Hall
          </h3>
          
          <div className="mt-3">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-zinc-900 dark:text-zinc-200">&quot;{hall.name}&quot;</span>? 
              This will also remove all associated seat configurations. This action cannot be undone.
            </p>
            
            {hasShowtimes && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl">
                <div className="flex items-center justify-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  Cannot Delete Active Hall
                </div>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  This hall has {hall._count.showtimes} scheduled showtimes. You must delete or move those showtimes before removing this hall.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900/50 px-8 py-5 flex gap-3 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors outline-none focus:ring-2 focus:ring-zinc-500/20"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || hasShowtimes}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 outline-none focus:ring-2 focus:ring-red-500/20"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {isLoading ? "Deleting..." : "Confirm Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
