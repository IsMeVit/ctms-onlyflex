import React from "react";

export interface SeatRow {
  rowId: string;
  label: string;
  seats: number;
  price: number;
}

export interface SelectedSeat {
  rowId: string;
  seatNumber: number;
  price: number;
  label: string;
}

interface BaseSeatGridProps {
  seatConfig: SeatRow[];
  bookedSeats: string[];
  selectedSeats: SelectedSeat[];
  onToggleSeat: (rowId: string, seatNumber: number, price: number, label: string) => void;
}

export const BaseSeatGrid: React.FC<BaseSeatGridProps> = ({
  seatConfig,
  bookedSeats,
  selectedSeats,
  onToggleSeat,
}) => (
  <div className="space-y-2">
    {seatConfig.map((row) => (
      <div key={row.rowId} className="flex items-center mb-2">
        <span className="w-12 inline-block text-zinc-400 font-mono">{row.label} {row.rowId}</span>
        {[...Array(row.seats)].map((_, i) => {
          const seatId = `${row.rowId}${i + 1}`;
          const isBooked = bookedSeats.includes(seatId);
          const isSelected = selectedSeats.some((s) => s.rowId === row.rowId && s.seatNumber === i + 1);
          return (
            <button
              key={seatId}
              className={`mx-1 px-2 py-1 rounded transition-colors duration-150 border border-zinc-700 text-sm font-semibold 
                ${isBooked ? 'bg-zinc-400 text-zinc-600 cursor-not-allowed' : isSelected ? 'bg-red-600 text-white' : 'bg-zinc-800 hover:bg-red-500 hover:text-white'}`}
              disabled={isBooked}
              onClick={() => onToggleSeat(row.rowId, i + 1, row.price, row.label)}
              aria-label={`Seat ${row.label}${i + 1}${isBooked ? ' (booked)' : isSelected ? ' (selected)' : ''}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    ))}
  </div>
);
