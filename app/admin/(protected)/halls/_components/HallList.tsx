"use client";

import { Search, Filter, Monitor, Building2 } from "lucide-react";

interface Hall {
  id: string;
  name: string;
  hallType: string;
  screenType: string;
  capacity: number;
  isActive: boolean;
  _count: {
    showtimes: number;
    seats: number;
  };
}

interface HallListProps {
  halls: Hall[];
  selectedHall: Hall | null;
  onSelectHall: (hall: Hall) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  typeFilter: string;
  onTypeFilterChange: (filter: string) => void;
  isMobile?: boolean;
}

const hallTypes = [
  { value: "all", label: "All Types" },
  { value: "REGULAR", label: "Regular" },
  { value: "PREMIUM", label: "Premium" },
  { value: "VIP", label: "VIP" },
];

export default function HallList({
  halls,
  selectedHall,
  onSelectHall,
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  isMobile = false,
}: HallListProps) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#09090b]">
      {/* Search & Filter Header */}
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search halls..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-600" />
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all appearance-none cursor-pointer"
          >
            {hallTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hall List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {halls.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
            <Building2 className="h-8 w-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No halls found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {halls.map((hall) => {
              const isSelected = selectedHall?.id === hall.id;
              return (
                <button
                  key={hall.id}
                  onClick={() => onSelectHall(hall)}
                  className={`w-full text-left p-4 rounded-xl transition-all group ${
                    isSelected
                      ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30"
                      : "bg-transparent border border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-bold text-sm ${isSelected ? "text-red-700 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                      {hall.name}
                    </span>
                    {!hall.isActive && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    <div className="flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      {hall.screenType.replace("_", " ")}
                    </div>
                    <span>•</span>
                    <span>{hall.capacity || hall._count.seats} Seats</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {!isMobile && (
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 text-[10px] text-zinc-400 dark:text-zinc-600 font-bold uppercase tracking-widest flex justify-between">
          <span>Total: {halls.length}</span>
          <span>Updated Live</span>
        </div>
      )}
    </div>
  );
}
