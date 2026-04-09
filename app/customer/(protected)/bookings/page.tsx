"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, Film, Users, CreditCard, Check } from 'lucide-react';
import { SeatGrid } from '@/components/seats/SeatGrid';
import { assignSeatNumbers } from '@/lib/seat-logic';
import { Seat } from '@/types/seat';
import { CustomerDetailsForm } from './CustomerDetailsForm';
import { PaymentForm } from './PaymentForm';
import { BookingConfirmation } from './BookingConfirmation';
import { ButtonRed } from '@/components/ui/ButtonRed';
import ButtonGray from '@/components/ui/ButtonGray';
import BaseSuccessDialog from '@/components/layout/BaseSuccessDialog';
import BaseWarningDialog from '@/components/layout/BaseWarningDialog';
import { useAuth } from '@/contexts/AuthContext';
import {
  buildLoginRedirectUrl,
  clearBookingDraft,
  getBookingShowtimeKey,
  loadBookingDraft,
  saveBookingDraft,
} from '@/lib/booking-draft';

const generateSeats = (): Seat[] => {
  const rows = 8;
  const columns = 12;
  const hallId = 'demo-hall';
  const seats: Seat[] = [];
  for (let r = 0; r < rows; r++) {
    const rowLabel = String.fromCharCode(65 + r);
    for (let c = 0; c < columns; c++) {
      const status = Math.random() > 0.7 ? 'BOOKED' : 'AVAILABLE';
      const seatType = (r === 3 || r === 4) && c >= 3 && c <= 8 ? 'VIP' : 'REGULAR';
      seats.push({
        id: `${hallId}-${rowLabel}-${c}`,
        hallId,
        row: rowLabel,
        column: c,
        number: c + 1,
        seatNumber: c + 1,
        seatType,
        status,
      });
    }
  }
  return assignSeatNumbers(seats);
};

interface MovieShowtime {
  id: string;
  movieTitle: string;
  date: string;
  time: string;
  location: string;
  screen: string;
  type: string;
}

interface BookingContentProps {
  showtime?: MovieShowtime;
  onBack?: () => void;
}

function BookingContent({ showtime, onBack }: BookingContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const seats = useMemo(() => generateSeats(), []);
  const [customerDetails, setCustomerDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    sendConfirmationSms: false,
    sendConfirmationEmail: true,
    subscribeToPromotionalOffers: false,
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [restoredShowtime, setRestoredShowtime] = useState<MovieShowtime | null>(null);

  const showWarningDialog = (message: string) => {
    setWarningMessage(message);
    setShowWarning(true);
  };

  const currentShowtime: MovieShowtime = useMemo(() => ({
    id: searchParams.get('showtimeId') || restoredShowtime?.id || showtime?.id || '',
    movieTitle: searchParams.get('movie') || restoredShowtime?.movieTitle || showtime?.movieTitle || 'The Dark Knight Returns',
    date: searchParams.get('date') || restoredShowtime?.date || showtime?.date || 'March 20, 2026',
    time: searchParams.get('time') || restoredShowtime?.time || showtime?.time || '7:30 PM',
    location: searchParams.get('location') || restoredShowtime?.location || showtime?.location || 'Downtown Cinema',
    screen: searchParams.get('screen') || restoredShowtime?.screen || showtime?.screen || 'Screen 2',
    type: searchParams.get('type') || restoredShowtime?.type || showtime?.type || 'IMAX',
  }), [restoredShowtime, searchParams, showtime]);
  const currentShowtimeKey = useMemo(() => getBookingShowtimeKey(currentShowtime), [currentShowtime]);
  const currentBookingUrl = useMemo(() => {
    if (!currentShowtime.id) {
      return '/customer/bookings';
    }

    return `/customer/bookings?showtimeId=${encodeURIComponent(currentShowtime.id)}`;
  }, [currentShowtime.id]);

  useEffect(() => {
    const draft = loadBookingDraft(currentShowtimeKey);
    if (draft) {
      setRestoredShowtime(draft.showtime);
      setCurrentStep(draft.currentStep);
      setSelectedSeats(new Set(draft.selectedSeats));
      setCustomerDetails(draft.customerDetails);
      setPaymentMethod(draft.paymentMethod);
    }

    setDraftHydrated(true);
  }, [currentShowtimeKey]);

  useEffect(() => {
    if (!draftHydrated) {
      return;
    }

    saveBookingDraft({
      showtimeKey: currentShowtimeKey,
      showtime: currentShowtime,
      currentStep,
      selectedSeats: Array.from(selectedSeats),
      customerDetails,
      paymentMethod,
    });
  }, [draftHydrated, currentShowtime, currentShowtimeKey, currentStep, selectedSeats, customerDetails, paymentMethod]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const nameParts = user.name.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");
    setCustomerDetails((prev) => ({
      ...prev,
      firstName: prev.firstName || firstName,
      lastName: prev.lastName || lastName,
      email: prev.email || user.email,
    }));
  }, [isAuthenticated, user]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== 'AVAILABLE') return;
    setSelectedSeats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seat.id)) {
        newSet.delete(seat.id);
      } else {
        if (newSet.size >= 10) {
          showWarningDialog("Maximum 10 seats can be selected");
          return prev;
        }
        newSet.add(seat.id);
      }
      return newSet;
    });
  };

  const handleMouseDown = () => {};
  const handleMouseEnter = () => {};
  const handleMouseUp = () => {};
  const handleContextMenu = (_seat: Seat, event: React.MouseEvent) => { event.preventDefault(); };

  const getSelectedSeatsDetails = () => seats.filter(seat => selectedSeats.has(seat.id));
  const getSelectedSeatLabels = () => getSelectedSeatsDetails().map((seat) => `${seat.row}${seat.seatNumber ?? seat.column + 1}`);
  const getTotalAmount = () => getSelectedSeatsDetails().reduce((total, seat) => total + (seat.seatType === 'VIP' ? 25 : 15), 0);

  const handleNext = () => {
    if (currentStep === 1 && selectedSeats.size === 0) {
      showWarningDialog("Please select at least one seat");
      return;
    }

    if (currentStep === 2) {
      if (!isAuthenticated) {
        saveBookingDraft({
          showtimeKey: currentShowtimeKey,
          showtime: currentShowtime,
          currentStep: 2,
          selectedSeats: Array.from(selectedSeats),
          customerDetails,
          paymentMethod,
        });
        router.push(buildLoginRedirectUrl(currentBookingUrl));
        return;
      }
      if (!customerDetails.firstName || !customerDetails.lastName || !customerDetails.email || !customerDetails.phone) {
        showWarningDialog("Please fill in all required fields");
        return;
      }
    }

    if (currentStep === 3 && !paymentMethod) {
      showWarningDialog("Please select a payment method");
      return;
    }

    if (currentStep === 3) {
      void handlePayment();
    } else {
      setBookingError('');
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    if (currentStep === 1 && onBack) {
      onBack();
    } else if (currentStep === 1) {
      router.back();
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 1));
    }
  };

  const handlePayment = async () => {
    const selectedSeatsData = getSelectedSeatsDetails();

    if (selectedSeatsData.length === 0) {
      showWarningDialog("Please select at least one seat");
      return;
    }

    setIsProcessing(true);
    setBookingError('');

    try {
      const response = await fetch('/api/customer/booking/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showtimeId: currentShowtime.id || undefined,
          movieTitle: currentShowtime.movieTitle,
          showtimeTime: currentShowtime.time,
          paymentMethod,
          customerDetails,
          selectedSeats: selectedSeatsData.map((seat) => ({
            id: currentShowtime.id ? seat.id : undefined,
            row: seat.row,
            column: seat.column,
            seatNumber: seat.seatNumber,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to complete booking');
      }

      clearBookingDraft();
      setBookingId(result.id);
      setShowSuccessDialog(true);
      setCurrentStep(4);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete booking';
      setBookingError(message);
      showWarningDialog(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    { number: 1, name: 'Select Seats', icon: Users },
    { number: 2, name: 'Your Details', icon: Film },
    { number: 3, name: 'Payment', icon: CreditCard },
    { number: 4, name: 'Confirmation', icon: Check },
  ];

<<<<<<< HEAD
=======
export const dynamic = "force-dynamic";

export default function BookingPage() {
>>>>>>> e5e1fb5 (fix: resolve build errors from customer merge)
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Step indicators */}
      <div className="px-4 py-8 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= step.number ? 'bg-red-600' : 'bg-zinc-700'}`}>
                <step.icon className="w-5 h-5" />
              </div>
              {index < steps.length - 1 && <ChevronRight className="w-5 h-5 mx-2 text-zinc-600" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Select Your Seats</h2>
              <SeatGrid
                seats={seats}
                selectedSeats={selectedSeats}
                onSeatClick={handleSeatClick}
                onMouseDown={handleMouseDown}
                onMouseEnter={handleMouseEnter}
                onMouseUp={handleMouseUp}
                onContextMenu={handleContextMenu}
              />
              <div className="mt-6 p-4 bg-zinc-900 rounded-lg">
                <p className="text-sm"><span className="font-semibold">Selected Seats:</span> {getSelectedSeatLabels().join(', ') || 'None'}</p>
                <p className="text-sm mt-2"><span className="font-semibold">Total Amount:</span> ${getTotalAmount()}</p>
              </div>
            </div>
          )}

          {currentStep === 2 && isAuthenticated && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Your Details</h2>
              <CustomerDetailsForm
                details={customerDetails}
                onChange={setCustomerDetails}
              />
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Payment</h2>
              <PaymentForm
                selectedMethod={paymentMethod}
                onChange={setPaymentMethod}
                totalAmount={getTotalAmount()}
                onPaymentMethodSelect={setPaymentMethod}
              />
            </div>
          )}

          {currentStep === 4 && (
            <BookingConfirmation
              bookingId={bookingId}
              movieTitle={currentShowtime.movieTitle}
              showtime={currentShowtime.time}
              date={currentShowtime.date}
              location={currentShowtime.location}
              screen={currentShowtime.screen}
              seats={getSelectedSeatLabels()}
              totalAmount={getTotalAmount()}
              customerEmail={customerDetails.email}
            />
          )}

          {bookingError && (
            <div className="mt-4 p-4 bg-red-900 text-red-100 rounded-lg">
              {bookingError}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <ButtonGray onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </ButtonGray>
            {currentStep < 4 && (
              <ButtonRed onClick={handleNext} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : currentStep === 3 ? 'Complete Booking' : 'Next'}
              </ButtonRed>
            )}
          </div>
        </div>
      </div>

      <BaseSuccessDialog
        open={showSuccessDialog}
        title="Booking Confirmed"
        message="Your booking has been confirmed successfully!"
        onClose={() => setShowSuccessDialog(false)}
      />

      <BaseWarningDialog
        open={showWarning}
        title="Warning"
        message={warningMessage}
        onClose={() => setShowWarning(false)}
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-400">Loading booking...</div>
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}
