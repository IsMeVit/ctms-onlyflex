"use client";
import { CheckCircle, Download, Mail, Calendar, Clock, MapPin, Film, Users, Ticket, QrCode } from 'lucide-react';

interface BookingConfirmationProps {
  bookingId: string;
  movieTitle: string;
  showtime: string;
  date: string;
  location: string;
  screen: string;
  seats: string[];
  totalAmount: number;
  customerEmail: string;
}

export function BookingConfirmation({
  bookingId,
  movieTitle,
  showtime,
  date,
  location,
  screen,
  seats,
  totalAmount,
  customerEmail,
}: BookingConfirmationProps) {
  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-green-700 mx-auto">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-2">Booking Confirmed!</h2>
          <p className="text-zinc-400">Your tickets have been successfully booked</p>
        </div>
      </div>

      {/* Booking ID */}
      <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border border-red-500/20 rounded-xl p-6 text-center">
        <p className="text-sm text-zinc-400 mb-1">Booking Reference</p>
        <p className="text-2xl font-bold tracking-wider">{bookingId}</p>
      </div>

      {/* QR Code Placeholder */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center">
            <QrCode className="w-32 h-32 text-black" />
          </div>
          <p className="text-sm text-zinc-400 text-center">
            Show this QR code at the cinema entrance
          </p>
        </div>
      </div>

      {/* Booking Details */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-lg mb-4">Booking Details</h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Film className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm text-zinc-500">Movie</p>
              <p className="font-medium">{movieTitle}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm text-zinc-500">Date</p>
              <p className="font-medium">{date}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm text-zinc-500">Showtime</p>
              <p className="font-medium">{showtime}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm text-zinc-500">Location</p>
              <p className="font-medium">{location} - {screen}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm text-zinc-500">Seats</p>
              <p className="font-medium">{seats.join(', ')}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Ticket className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm text-zinc-500">Total Amount</p>
              <p className="font-medium text-xl">${totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Notification */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex items-start gap-3">
        <Mail className="w-5 h-5 text-blue-500 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Email Confirmation Sent</p>
          <p className="text-xs text-zinc-500 mt-1">
            Booking details and tickets have been sent to <span className="text-blue-400">{customerEmail}</span>
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 rounded-lg font-medium hover:shadow-lg hover:shadow-red-500/30 transition-all flex items-center justify-center gap-2">
          <Download className="w-5 h-5" />
          Download Ticket
        </button>
        <button className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-all flex items-center justify-center gap-2">
          <Mail className="w-5 h-5" />
          Email Ticket
        </button>
      </div>

      {/* Important Notes */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
        <h4 className="font-medium mb-2 text-sm">Important Information</h4>
        <ul className="space-y-1 text-xs text-zinc-400">
          <li>• Please arrive 15 minutes before showtime</li>
          <li>• Carry a valid ID proof for entry</li>
          <li>• Outside food and beverages are not allowed</li>
          <li>• Tickets are non-refundable and non-transferable</li>
        </ul>
      </div>
    </div>
  );
}
