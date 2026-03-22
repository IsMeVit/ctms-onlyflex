'use client';

import { Seat } from '@/types/seat';

interface SeatTooltipProps {
  seat: Seat;
  viewMode: 'admin' | 'preview';
  position: { x: number; y: number };
  visible: boolean;
}

export function SeatTooltip({ seat, viewMode, position, visible }: SeatTooltipProps) {
  if (!visible) return null;

  const getSeatTypeLabel = () => {
    switch (seat.seatType) {
      case 'REGULAR': return 'Regular Seat';
      case 'VIP': return 'VIP Seat';
      case 'TWINSEAT': return 'Twinseat';
      default: return 'Seat';
    }
  };

  const getStatusLabel = () => {
    switch (seat.status) {
      case 'AVAILABLE': return 'Available';
      case 'SELECTED': return 'Selected';
      case 'BOOKED': return 'Booked';
      case 'RESERVED': return 'Reserved';
      case 'INACTIVE': return 'Inactive (Aisle)';
      case 'BLOCKED': return 'Blocked';
      default: return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (seat.status) {
      case 'AVAILABLE': return 'text-green-600';
      case 'SELECTED': return 'text-blue-600';
      case 'BOOKED': return 'text-red-600';
      case 'RESERVED': return 'text-yellow-600';
      case 'INACTIVE': return 'text-gray-500';
      case 'BLOCKED': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div
      className="fixed z-50 pointer-events-none animate-fade-in"
      style={{
        left: position.x + 10,
        top: position.y - 60,
      }}
    >
      <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 backdrop-blur-sm bg-opacity-95 min-w-48">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-bold">
            {viewMode === 'admin' 
              ? `${seat.row}-${seat.column}`
              : seat.seatNumber 
                ? `${seat.row}${seat.seatNumber}${seat.seatType === 'TWINSEAT' ? `-${seat.seatNumber + 1}` : ''}`
                : 'Inactive'
            }
          </span>
        </div>
        <div className="text-sm text-slate-300">{getSeatTypeLabel()}</div>
        <div className={`text-sm font-semibold ${getStatusColor()} mt-1`}>
          {getStatusLabel()}
        </div>
        {seat.seatType === 'TWINSEAT' && (
          <div className="text-xs text-pink-400 mt-1">
            Occupies 2 seats
          </div>
        )}
      </div>
      {/* Arrow */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-slate-900" />
    </div>
  );
}
