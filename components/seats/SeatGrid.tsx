'use client';

import React, { useState, useCallback } from 'react';
import { Seat } from '@/types/seat';
import { SeatCell } from './SeatCell';
import { ScreenIndicator } from './ScreenIndicator';
import { SeatTooltip } from './SeatTooltip';
import { SeatSVG } from './SeatSVG';

interface SeatGridProps {
  seats: Seat[];
  columns: number;
  selectedSeats: Set<string>;
  viewMode: 'admin' | 'preview';
  hallName?: string;
  onSeatClick: (seat: Seat, event: React.MouseEvent) => void;
  onMouseDown: (seat: Seat) => void;
  onMouseEnter: (seat: Seat) => void;
  onMouseUp: () => void;
  onContextMenu: (seat: Seat, event: React.MouseEvent) => void;
}

// Calculate aisle positions based on total columns
const getAisleColumns = (totalColumns: number): number[] => {
  if (totalColumns <= 5) return [];
  if (totalColumns <= 8) return [2];
  if (totalColumns <= 12) return [2, 8];
  // For larger halls, add aisles every 6-8 seats
  const aisles: number[] = [2];
  for (let i = 8; i < totalColumns - 2; i += 6) {
    aisles.push(i);
  }
  return aisles;
};

export const SeatGrid = memo(function SeatGrid({
  seats,
  columns,
  selectedSeats,
  viewMode,
  hallName,
  onSeatClick,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
  onContextMenu
}: SeatGridProps) {
  const [tooltipState, setTooltipState] = useState<{
    seat: Seat | null;
    position: { x: number; y: number };
    visible: boolean;
  }>({
    seat: null,
    position: { x: 0, y: 0 },
    visible: false
  });

  // Group seats by row
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  // Sort rows (A, B, C... AA, AB, etc.)
  const sortedRows = Object.keys(seatsByRow).sort((a, b) => {
    const idxA = a.split('').reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 65), 0);
    const idxB = b.split('').reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 65), 0);
    return idxA - idxB;
  });

  const aisleColumns = getAisleColumns(columns);

  const handleMouseMove = useCallback((e: React.MouseEvent, seat: Seat) => {
    setTooltipState({
      seat,
      position: { x: e.clientX, y: e.clientY },
      visible: true
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltipState(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Screen Indicator */}
      <div className="mb-16">
        <ScreenIndicator hallName={hallName} />
      </div>

      {/* Main Grid Container */}
      <div className='flex flex-col items-center gap-4'> 
        <div className="space-y-4">
          {sortedRows.map((row) => {
            const rowSeats = seatsByRow[row].sort((a, b) => a.column - b.column);
            
            return (
              <div 
                key={row} 
                className="flex items-center gap-6 group px-6 py-1 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                onMouseLeave={handleMouseLeave}
              >
                {/* Left Row Label */}
                <div className="w-8 h-8 shrink-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700">
                  <span className="text-zinc-500 dark:text-zinc-400 font-black text-xs">
                    {row}
                  </span>
                </div>

                {/* Seats with Aisles */}
                <div className="flex items-center gap-1.5">
                  {(() => {
                    const renderedSeatIds = new Set<string>();
                    
                    return rowSeats.map((seat, index) => {
                      if (renderedSeatIds.has(seat.id)) return null;

                      let isTwinPair = false;
                      if (seat.seatType === 'TWINSEAT') {
                        // Find potential partner (must be adjacent and also TWINSEAT)
                        const partner = rowSeats.find(s => 
                          s.column === seat.column + 1 && s.seatType === 'TWINSEAT'
                        );
                        if (partner) {
                          isTwinPair = true;
                          renderedSeatIds.add(partner.id);
                        }
                      }

                      return (
                        <React.Fragment key={seat.id}>
                          <SeatCell
                            seat={seat}
                            isSelected={selectedSeats.has(seat.id) || (isTwinPair && selectedSeats.has(rowSeats.find(s => s.column === seat.column + 1)?.id || ''))}
                            viewMode={viewMode}
                            onClick={(e) => onSeatClick(seat, e)}
                            onMouseDown={() => onMouseDown(seat)}
                            onMouseEnter={() => onMouseEnter(seat)}
                            onMouseUp={onMouseUp}
                            onContextMenu={(e) => onContextMenu(seat, e)}
                            onMouseMove={(e) => handleMouseMove(e, seat)}
                          />
                          {/* Aisle gap after certain columns */}
                          {aisleColumns.includes(index + 1) && index < rowSeats.length - 1 && (
                            <div className="w-8 h-4 flex items-center justify-center">
                               <div className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    });
                  })()}
                </div>

                {/* Right Row Label (Optional for symmetry) */}
                <div className="w-8 h-8 shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-400 font-black text-[10px]">
                    {row}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Exit Indicators */}
      <div className="mt-12 flex justify-between items-center px-10">
        <div className="flex items-center gap-3 text-zinc-400 font-black text-[10px] tracking-[0.2em]">
          <div className="w-8 h-px bg-zinc-200 dark:bg-zinc-800" />
          <span>EXIT</span>
        </div>
        <div className="flex items-center gap-3 text-zinc-400 font-black text-[10px] tracking-[0.2em]">
          <span>EXIT</span>
          <div className="w-8 h-px bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      {/* Tooltip */}
      {tooltipState.seat && (
        <SeatTooltip
          seat={tooltipState.seat}
          viewMode={viewMode}
          position={tooltipState.position}
          visible={tooltipState.visible}
        />
      )}

      {/* Legend */}
      <div className="mt-10 flex flex-wrap justify-center gap-6 text-[10px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <SeatSVG size={20} color="#3B82F6" />
          <span className="text-slate-500">Regular</span>
        </div>
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <SeatSVG size={20} color="#F59E0B" />
          <span className="text-slate-500">VIP</span>
        </div>
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <SeatSVG size={20} color="#EF4444" isTwinseat={true} />
          <span className="text-slate-500">Twinseat</span>
        </div>
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <SeatSVG size={20} isBooked={true} />
          <span className="text-slate-500">Booked</span>
        </div>
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <div className="w-4 h-4 rounded bg-slate-700" />
          <span className="text-slate-500">Aisle</span>
        </div>
      </div>
    </div>
  );
});
