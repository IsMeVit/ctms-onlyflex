"use client";

import {
  X,
  User,
  Film,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Receipt,
  Download,
  QrCode,
} from "lucide-react";
import type { ComponentType } from "react";
import { SeatIcon } from "@/components/seats/SeatSVG";
import { useEffect, useState, useCallback } from "react";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";

interface BookingDetailsData {
  id: string;
  bookingStatus: string;
  isScanned: boolean;
  isRated: boolean;
  subtotal: string | number;
  totalDiscount: string | number;
  finalAmount: string | number;
  user: {
    name: string | null;
    email: string;
    phone: string | null;
    membershipTier?: string | null;
  };
  showtime: {
    startTime: string;
    movie: {
      title: string;
      posterUrl?: string | null;
    };
    hall: {
      name: string;
    };
  };
  payment?: {
    paymentMethod: string;
    status: string;
  } | null;
  tickets: Array<{
    id: string;
    seat: {
      row: string;
      seatNumber: number | null;
      seatType: string;
    };
  }>;
}

interface BookingDetailsProps {
  bookingId: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function BookingDetails({ bookingId, onClose, onUpdate }: BookingDetailsProps) {
  const [booking, setBooking] = useState<BookingDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/booking/${bookingId}`);
      if (response.ok) {
        const data = await response.json();
        setBooking(data);
      } else {
        setError("Failed to fetch booking details");
      }
      } catch {
        setError("An error occurred while fetching details");
      } finally {
        setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleStatusChange = async (newStatus: string) => {
    if (!bookingId) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/booking/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingStatus: newStatus })
      });
      if (response.ok) {
        fetchBooking();
        onUpdate();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update status");
      }
      } catch {
        alert("An error occurred while updating status");
      } finally {
        setIsUpdating(false);
    }
  };

  const handleMarkScanned = async () => {
    if (!bookingId) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/booking/${bookingId}/scan`, {
        method: "PATCH",
      });

      if (response.ok) {
        fetchBooking();
        onUpdate();
      } else {
        const data = await response.json().catch(() => null);
        alert(data?.error || "Failed to mark booking as scanned");
      }
    } catch {
      alert("An error occurred while updating scan status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!bookingId) return null;

  return (
    <div className={`fixed inset-y-0 right-0 w-full max-w-xl bg-white dark:bg-[#09090b] shadow-2xl z-[60] transform transition-transform duration-500 ease-in-out border-l border-zinc-200 dark:border-zinc-800 ${bookingId ? "translate-x-0" : "translate-x-full"}`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Booking Information</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Ref: {bookingId.slice(-8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 dark:text-zinc-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
              <Loader2 className="w-10 h-10 animate-spin text-red-500" />
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Retrieving Records...</p>
            </div>
          ) : error ? (
            <div className="p-8 bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/30 rounded-[32px] text-center">
               <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
               <p className="text-red-700 dark:text-red-400 font-bold">{error}</p>
            </div>
          ) : booking ? (
            <>
              {/* Status Header */}
              <div className="flex items-center justify-between p-6 bg-zinc-50 dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Current Status</p>
                    <StatusBadge status={booking.bookingStatus} variant={
                       booking.bookingStatus === 'CONFIRMED' ? 'success' :
                       booking.bookingStatus === 'PENDING' ? 'pending' :
                       booking.bookingStatus === 'CANCELLED' ? 'error' : 'default'
                    } />
                    <div className="pt-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      Scan:{" "}
                      <span className={booking.isScanned ? "text-emerald-500" : "text-zinc-500"}>
                        {booking.isScanned ? "Scanned" : "Not scanned"}
                      </span>
                    </div>
                 </div>
                 <div className="text-right space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Grand Total</p>
                    <p className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tabular-nums">${Number(booking.finalAmount).toFixed(2)}</p>
                 </div>
              </div>

              {/* Customer Info */}
              <section className="space-y-4">
                 <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <User className="w-4 h-4" /> Customer Details
                 </h4>
                 <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Full Name" value={booking.user.name || "Anonymous User"} />
                    <DetailItem label="Email Address" value={booking.user.email} />
                    <DetailItem label="Contact Phone" value={booking.user.phone || "Not provided"} />
                    <DetailItem label="Membership" value={booking.user.membershipTier || "NONE"} />
                 </div>
              </section>

              {/* Showtime Info */}
              <section className="space-y-4">
                 <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <Film className="w-4 h-4" /> Showtime Details
                 </h4>
                 <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800 flex items-start gap-4">
                    <div className="relative w-16 h-24 rounded-xl overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-800 shrink-0">
                       {booking.showtime.movie.posterUrl ? (
                       <img src={booking.showtime.movie.posterUrl || ""} className="w-full h-full object-cover" alt="Poster" />
                       ) : (
                         <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                            <Film className="w-6 h-6 text-zinc-400" />
                         </div>
                       )}
                    </div>
                    <div className="space-y-3">
                       <div>
                          <p className="text-lg font-black text-zinc-900 dark:text-zinc-50 leading-tight">{booking.showtime.movie.title}</p>
                          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{booking.showtime.hall.name}</p>
                       </div>
                       <div className="flex flex-wrap gap-4">
                          <SummaryIcon icon={Calendar} label={new Date(booking.showtime.startTime).toLocaleDateString()} />
                          <SummaryIcon icon={Clock} label={new Date(booking.showtime.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                       </div>
                    </div>
                 </div>
              </section>

              {/* Tickets/Seats */}
              <section className="space-y-4">
                 <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <SeatIcon className="w-4 h-4" /> Reserved Seats ({booking.tickets.length})
                 </h4>
                 <div className="flex flex-wrap gap-2">
                    {booking.tickets.map((t) => (
                       <div key={t.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-xl text-xs font-black shadow-sm flex items-center gap-2">
                          <span className="text-red-600">{t.seat.row}{t.seat.seatNumber}</span>
                          <span className="text-[10px] text-zinc-400 uppercase">{t.seat.seatType}</span>
                       </div>
                    ))}
                 </div>
              </section>

              {/* Payment Info */}
              <section className="space-y-4">
                 <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Transaction details
                 </h4>
                 <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800 space-y-4">
                    <div className="flex justify-between items-center">
                       <p className="text-sm font-bold text-zinc-500">Subtotal</p>
                       <p className="text-sm font-black tabular-nums">${Number(booking.subtotal).toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                       <p className="text-sm font-bold text-zinc-500">Member Discount</p>
                       <p className="text-sm font-black text-emerald-600 tabular-nums">-${Number(booking.totalDiscount).toFixed(2)}</p>
                    </div>
                    <hr className="border-zinc-200 dark:border-zinc-800 border-dashed" />
                    <div className="flex justify-between items-center">
                       <p className="text-base font-black text-zinc-900 dark:text-zinc-100 uppercase">Amount Paid</p>
                       <p className="text-xl font-black text-zinc-900 dark:text-zinc-50 tabular-nums">${Number(booking.finalAmount).toFixed(2)}</p>
                    </div>
                    {booking.payment && (
                       <div className="mt-4 p-3 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-between border border-zinc-100 dark:border-zinc-700">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-700 rounded-lg flex items-center justify-center">
                                <Receipt className="w-4 h-4 text-zinc-500" />
                             </div>
                             <div>
                                <p className="text-[10px] font-black uppercase text-zinc-400 leading-none">Method</p>
                                <p className="text-xs font-bold">{booking.payment.paymentMethod}</p>
                             </div>
                          </div>
                          <StatusBadge status={booking.payment.status} variant="success" />
                       </div>
                    )}
                 </div>
              </section>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-zinc-100 dark:border-zinc-800 flex gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
           {booking && !booking.isScanned && booking?.bookingStatus !== 'CANCELLED' && booking?.bookingStatus !== 'REFUNDED' && (
              <button
                onClick={handleMarkScanned}
                disabled={isUpdating}
                className="flex-1 bg-zinc-950 text-white border border-zinc-800 h-12 rounded-2xl font-black text-sm hover:bg-zinc-900 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                Mark as Scanned
              </button>
           )}
           {booking?.bookingStatus === 'PENDING' && (
              <button 
                onClick={() => handleStatusChange('CONFIRMED')}
                disabled={isUpdating}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirm Order
              </button>
           )}
           {booking?.bookingStatus !== 'CANCELLED' && booking?.bookingStatus !== 'REFUNDED' && (
              <button 
                onClick={() => handleStatusChange('CANCELLED')}
                disabled={isUpdating}
                className="flex-1 bg-white dark:bg-zinc-800 text-red-600 border border-red-100 dark:border-red-900/30 h-12 rounded-2xl font-black text-sm hover:bg-red-50 dark:hover:bg-red-950/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Cancel Booking
              </button>
           )}
           <button 
              onClick={() => window.open(`/api/admin/booking/${bookingId}`, "_blank")}
              className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
           >
              <Download className="w-5 h-5" />
           </button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
   return (
      <div className="space-y-1">
         <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
         <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200 truncate">{value}</p>
      </div>
   );
}

function SummaryIcon({ icon: Icon, label }: { icon: ComponentType<{ className?: string }>; label: string }) {
   return (
      <div className="flex items-center gap-2 text-zinc-500 font-bold text-xs uppercase tracking-tight">
         <Icon className="w-3.5 h-3.5" />
         {label}
      </div>
   );
}
