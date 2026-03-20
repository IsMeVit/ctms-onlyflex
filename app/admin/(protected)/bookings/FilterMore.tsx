"use client";

import { Calendar, Monitor, Film, X } from "lucide-react";
import { useEffect, useState } from "react";

interface FilterMoreProps {
  filters: {
    dateFrom: string;
    dateTo: string;
    movieId: string;
    hallId: string;
  };
  setFilters: (filters: any) => void;
  onClear: () => void;
}

export function FilterMore({ filters, setFilters, onClear }: FilterMoreProps) {
  const [movies, setMovies] = useState<{id: string, title: string}[]>([]);
  const [halls, setHalls] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [moviesRes, hallsRes] = await Promise.all([
          fetch("/api/admin/movies?limit=100"),
          fetch("/api/admin/halls")
        ]);
        
        if (moviesRes.ok) {
          const data = await moviesRes.json();
          setMovies(data.movies || []);
        }
        
        if (hallsRes.ok) {
          const data = await hallsRes.json();
          setHalls(data.halls || []);
        }
      } catch (err) {
        console.error("Failed to fetch filter data:", err);
      }
    }
    fetchData();
  }, []);

  const handleChange = (name: string, value: string) => {
    setFilters((prev: any) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Calendar className="w-3 h-3" /> Date Range
          </label>
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={filters.dateFrom}
              onChange={(e) => handleChange("dateFrom", e.target.value)}
              className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:border-red-500 outline-none dark:[color-scheme:dark]" 
            />
            <span className="text-zinc-400 text-xs font-bold">TO</span>
            <input 
              type="date" 
              value={filters.dateTo}
              onChange={(e) => handleChange("dateTo", e.target.value)}
              className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:border-red-500 outline-none dark:[color-scheme:dark]" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Film className="w-3 h-3" /> Specific Movie
          </label>
          <select 
            value={filters.movieId}
            onChange={(e) => handleChange("movieId", e.target.value)}
            className="w-full h-10 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:border-red-500 outline-none appearance-none cursor-pointer"
          >
            <option value="">All Movies</option>
            {movies.map(movie => (
              <option key={movie.id} value={movie.id}>{movie.title}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Monitor className="w-3 h-3" /> Hall Location
          </label>
          <select 
            value={filters.hallId}
            onChange={(e) => handleChange("hallId", e.target.value)}
            className="w-full h-10 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:border-red-500 outline-none appearance-none cursor-pointer"
          >
            <option value="">All Halls</option>
            {halls.map(hall => (
              <option key={hall.id} value={hall.id}>{hall.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button 
          onClick={onClear}
          className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-1.5"
        >
          <X className="w-3 h-3" /> Clear Advanced Filters
        </button>
      </div>
    </div>
  );
}
