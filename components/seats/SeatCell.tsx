'use client';

import React, { memo } from 'react';
import { Seat } from '@/types/seat';
import { SeatSVG } from './SeatSVG';
import { getSeatDisplayLabel } from '@/lib/seat-logic';

interface SeatCellProps {
  seat: Seat;
  isSelected: boolean;
  viewMode: 'admin' | 'preview';
  onClick: (e: React.MouseEvent) => void;
  onMouseDown: () => void;
  onMouseEnter: () => void;
  onMouseUp: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
}

const getSeatColor = (seatType: string): string => {
  switch (seatType) {
    case 'VIP':
      return '#F59E0B'; // Amber 500
    case 'TWINSEAT':
      return '#EF4444'; // Red 500
    default:
      return '#3B82F6'; // Blue 500
  }
};

export const SeatCell = memo(function SeatCell({
  seat,
  isSelected,
  viewMode,
  onClick,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
  onContextMenu,
  onMouseMove
}: SeatCellProps) {
  if (seat.status === 'INACTIVE') return null;

  const isTwinseat = seat.seatType === 'TWINSEAT';
  const isBooked = seat.status === 'BOOKED';
  const isBlocked = seat.status === 'BLOCKED';

  const color = getSeatColor(seat.seatType);
  const displayNumber = getSeatDisplayLabel(seat, viewMode);

  return (
    <div
      className={`
        relative flex items-center justify-center transition-all duration-300 group
        ${isTwinseat ? 'w-25' : 'w-10'} 
        h-10
        ${!isBooked && !isBlocked 
          ? 'cursor-pointer hover:-translate-y-1' 
          : 'cursor-not-allowed opacity-80'}
      `}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseUp={onMouseUp}
      onContextMenu={onContextMenu}
      onMouseMove={onMouseMove}
    >
      <SeatSVG
        size={36}
        isTwinseat={isTwinseat}
        color={color}
        isSelected={isSelected}
        isBooked={isBooked}
        isBlocked={isBlocked}
      />

      <span
        className={`
          absolute inset-0 flex items-center justify-center pt-2 pointer-events-none
          text-[9px] font-black uppercase tracking-tighter transition-all duration-300
          ${
            isBooked || isBlocked
              ? 'text-zinc-500/50'
              : isSelected
              ? 'text-white scale-110'
              : 'text-white/90 group-hover:text-white'
          }
          ${
            isSelected
              ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
              : ''
          }
        `}
      >
        {displayNumber}
      </span>

      {!isBooked && !isBlocked && !isSelected && (
        <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/20 rounded-xl transition-all pointer-events-none" />
      )}
    </div>
  );
});