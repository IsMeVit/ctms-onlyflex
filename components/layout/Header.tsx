"use client";

import { ReactNode } from "react";
import { Bell, Search } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
}

export function Header({ rightSlot }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 dark:border-[#1a1f2e] bg-white/95 dark:bg-[#030712]/95 backdrop-blur py-3">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex w-full items-center gap-3">
          <div className="hidden flex-[1] items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-3 md:flex focus-within:border-2 focus-within:border-red-500 transition-all">
            <Search className="h-5 w-5 text-zinc-400 dark:text-zinc-500" strokeWidth={2} />
            <input
              className="w-full bg-transparent text-medium text-zinc-900 dark:text-zinc-200 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              placeholder="Search movies, bookings, customers..."
            />
          </div>

          <div className="flex flex-[1] items-center gap-2 justify-end">
            <ThemeToggle />
            <button
              type="button"
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2 text-zinc-600 dark:text-zinc-300 transition hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>

            {rightSlot}

            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#ff1f4d] to-[#df002b] text-xs font-semibold text-white">
                A
              </div>
              <span className="hidden pr-1 text-sm text-zinc-600 dark:text-zinc-300 sm:inline">
                Admin
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
