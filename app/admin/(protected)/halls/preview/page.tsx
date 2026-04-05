"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { SeatGrid } from "@/components/seats/SeatGrid";
import { SeatSVG } from "@/components/seats/SeatSVG";
import { Seat } from "@/types/seat";
import { usePolling } from "@/lib/use-polling";
import { 
  Monitor, 
  Search, 
  LayoutGrid, 
  Clock, 
  Building2, 
  Loader2,
  ChevronRight,
  ChevronLeft,
  Info
} from "lucide-react";
import Link from "next/link";

interface Hall {
  id: string;
  name: string;
  hallType: string;
  screenType: string;
  capacity: number;
  rows: number;
  columns: number;
  isActive: boolean;
  createdAt: string;
  seats?: Seat[];
  _count: {
    showtimes: number;
    seats: number;
  };
}

export default function HallPreviewPage() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeats] = useState<Set<string>>(new Set());
  const [viewMode] = useState<"admin">("admin");

  const getScreenTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      STANDARD_2D: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      THREE_D: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      SCREENX: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    };
    return styles[type] || "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
  };

  const formatScreenType = (type: string) => {
    const labels: Record<string, string> = {
      STANDARD_2D: "2D",
      THREE_D: "3D",
      SCREENX: "ScreenX",
    };
    return labels[type] || type;
  };

  const fetchHalls = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/admin/halls?${params}`);
      const data = await response.json();

      if (response.ok) {
        setHalls(data.halls);
        // Fetch seats for first hall only if no hall is currently selected
        if (data.halls.length > 0) {
          // If we already have a selected hall with seats, keep it
          if (selectedHall && selectedHall.seats && selectedHall.seats.length > 0) {
            return;
          }
          // Otherwise fetch seats for the first hall
          const firstHall = data.halls[0];
          const seatsResponse = await fetch(`/api/admin/halls/${firstHall.id}/seats`);
          const seatsData = await seatsResponse.json();
          if (seatsResponse.ok) {
            setSelectedHall({ ...firstHall, seats: seatsData.seats });
          } else {
            setSelectedHall(firstHall);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch halls:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  // Fetch seats when selecting a hall
  const handleSelectHall = useCallback(async (hall: Hall) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/halls/${hall.id}/seats`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedHall({ ...hall, seats: data.seats });
      } else {
        setSelectedHall(hall);
      }
    } catch (error) {
      console.error("Failed to fetch seats:", error);
      setSelectedHall(hall);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHalls();
  }, [fetchHalls]);

  // Polling disabled for better performance - only fetch on mount and hall selection
  const { isPolling, lastUpdated } = usePolling({
    interval: 60000,
    enabled: false,
    onPoll: fetchHalls,
  });

  // Format last updated time
  const getLastUpdatedText = () => {
    if (!lastUpdated) return "Never";
    const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (seconds < 5) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  const handleSeatClick = (seat: Seat) => {
    console.log("Seat clicked:", seat);
  };

  const getSeatsForGrid = useMemo((): Seat[] => {
    if (!selectedHall) return [];
    
    if (!selectedHall.seats || selectedHall.seats.length === 0) {
      const seats: Seat[] = [];
      for (let rowIdx = 0; rowIdx < selectedHall.rows; rowIdx++) {
        const row = String.fromCharCode(65 + rowIdx);
        for (let col = 0; col < selectedHall.columns; col++) {
          seats.push({
            id: `${selectedHall.id}-${row}-${col}`,
            hallId: selectedHall.id,
            row,
            column: col,
            number: col + 1,
            seatNumber: col + 1,
            seatType: "REGULAR",
            status: "AVAILABLE",
          });
        }
      }
      return seats;
    }

    return selectedHall.seats.map((seat: Seat) => ({
      ...seat,
      status: seat.status || "AVAILABLE",
    }));
  }, [selectedHall]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-zinc-50 dark:bg-[#030712]">
        <div className="text-center flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Loading Cinema Layouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-zinc-50 dark:bg-[#030712] transition-colors">
      {/* Left Panel - Hall List */}
      <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] flex flex-col">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link 
                href="/admin/halls"
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
              </Link>
              <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight uppercase">Seat Preview</h1>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter">
              <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span className="text-zinc-500">{halls.length} Halls</span>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search halls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {halls.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 flex flex-col items-center gap-2">
              <Building2 className="w-8 h-8 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">No halls found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {halls.map((hall) => (
                <button
                  key={hall.id}
                  onClick={() => handleSelectHall(hall)}
                  disabled={isLoading}
                  className={`w-full p-4 text-left rounded-xl transition-all group border ${
                    selectedHall?.id === hall.id 
                      ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30" 
                      : "bg-transparent border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-bold text-sm ${selectedHall?.id === hall.id ? "text-red-700 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                      {hall.name}
                    </h3>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedHall?.id === hall.id ? "translate-x-0 opacity-100 text-red-500" : "-translate-x-2 opacity-0"}`} />
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded border ${
                      hall.hallType === "VIP"
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                    }`}>
                      {hall.hallType}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded border ${getScreenTypeBadge(hall.screenType)}`}>
                      {formatScreenType(hall.screenType)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-tighter">
                    <span className="flex items-center gap-1"><LayoutGrid className="w-3 h-3" /> {hall.rows}x{hall.columns}</span>
                    <span className="flex items-center gap-1"><Monitor className="w-3 h-3" /> {hall.capacity} Seats</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Seat Preview */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        {selectedHall ? (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight uppercase">
                      {selectedHall.name}
                    </h2>
                    <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg border ${
                      selectedHall.hallType === "VIP"
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                    }`}>
                      {selectedHall.hallType}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Monitor className="w-4 h-4 text-zinc-400" /> {formatScreenType(selectedHall.screenType)} Display</span>
                    <span className="flex items-center gap-1.5"><LayoutGrid className="w-4 h-4 text-zinc-400" /> {selectedHall.rows} Rows • {selectedHall.columns} Cols</span>
                    <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-zinc-400" /> {selectedHall.capacity} Total Capacity</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Updated: {getLastUpdatedText()}</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Seat Grid Area */}
            <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 shadow-sm relative overflow-hidden">
              <div className="absolute top1 left-0 w-full h-1 bg-linear-to-r from-transparent via-red-499 to-transparent opacity-20" />
              
              <div className="mb-12 text-center">
                 <div className="inline-block px-12 py-2 bg-zinc-100 dark:bg-zinc-900 border-x border-b border-zinc-200 dark:border-zinc-800 rounded-b-3xl text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] shadow-inner">
                    Cinema Screen
                 </div>
              </div>

              <div className="flex justify-center">
                <SeatGrid
                  seats={getSeatsForGrid}
                  columns={selectedHall.columns}
                  selectedSeats={selectedSeats}
                  viewMode={viewMode}
                  hallName={selectedHall.name}
                  isDragging={false}
                  onSeatClick={handleSeatClick}
                  onMouseDown={() => {}}
                  onMouseEnter={() => {}}
                  onMouseUp={() => {}}
                  onContextMenu={() => {}}
                />
              </div>

              <div className="mt-12 flex flex-wrap justify-center gap-8 border-t border-zinc-100 dark:border-zinc-800 pt-8">
                 <div className="flex items-center gap-3">
                    <SeatSVG size={20} color="#3B82F6" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Regular</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <SeatSVG size={20} color="#F59E0B" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">VIP</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <SeatSVG size={24} color="#EF4444" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Twinseat</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-zinc-900 dark:bg-black border border-zinc-700 dark:border-zinc-800 rounded-md" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Inactive</span>
                 </div>
              </div>
            </div>

            {/* Info Footer */}
            <div className="flex gap-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
               <Info className="w-5 h-5 text-blue-500 shrink-0" />
               <p className="text-xs text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
                 This is a live read-only preview of the cinema hall layout. To modify the seat configuration, use the <span className="font-black underline uppercase">Visual Seat Editor</span> in the Hall Details section.
               </p>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-500">
            <div className="text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                 <LayoutGrid className="w-10 h-10 opacity-20" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">Select a Hall</h3>
              <p className="text-sm font-medium mt-2 max-w-xs mx-auto">Choose a hall from the left panel to explore its real-time seating arrangement.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
   return (
      <div className="flex items-center gap-2">
         <div className={`w-4 h-4 rounded-md shadow-sm ${color}`} />
         <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
      </div>
   );
}
