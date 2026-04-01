"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, Film, Calendar, MapPin, Clock, Users, CreditCard, Check } from 'lucide-react';
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
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';

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

interface BookingPageProps {
  showtime?: MovieShowtime;
  onBack?: () => void;
}

function BookingPage({ showtime, onBack }: BookingPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();
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

  const showWarningDialog = (message: string) => {
    setWarningMessage(message);
    setShowWarning(true);
  };

  const currentShowtime: MovieShowtime = useMemo(() => ({
    id: searchParams.get('showtimeId') || showtime?.id || '',
    movieTitle: searchParams.get('movie') || showtime?.movieTitle || 'The Dark Knight Returns',
    date: searchParams.get('date') || showtime?.date || 'March 20, 2026',
    time: searchParams.get('time') || showtime?.time || '7:30 PM',
    location: searchParams.get('location') || showtime?.location || 'Downtown Cinema',
    screen: searchParams.get('screen') || showtime?.screen || 'Screen 2',
    type: searchParams.get('type') || showtime?.type || 'IMAX',
  }), [searchParams, showtime]);

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
        showWarningDialog("Please sign in to continue your booking");
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

  return (
    <div className="min-h-screen bg-black text-white">
      <BaseSuccessDialog
        open={showSuccessDialog}
        title="SUCCESS"
        message="Your booking was completed successfully."
        durationMs={3000}
        onClose={() => setShowSuccessDialog(false)}
      />

      <BaseWarningDialog
        open={showWarning}
        message={warningMessage}
        onClose={() => setShowWarning(false)}
      />

      {/* Header */}
      <div className="bg-zinc-900 mt-[5rem] border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={handleBack}
            className="flex cursor-pointer items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{currentShowtime.movieTitle}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {currentShowtime.date}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {currentShowtime.time}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {currentShowtime.location} - {currentShowtime.screen}
                </div>
              </div>
            </div>

            {[...selectedSeats].length > 0 && currentStep < 4 && (
              <div className="text-right">
                <p className="text-sm text-zinc-400">Total Amount</p>
                <p className="text-3xl font-bold">${getTotalAmount().toFixed(2)}</p>
                <p className="text-xs text-zinc-500">
                  {[...selectedSeats].length} seat{[...selectedSeats].length > 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      {currentStep < 4 && (
        <div className="bg-zinc-950 border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              {steps.slice(0, 3).map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                return (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                        ${isActive ? "border-red-500 bg-red-500/20" : ""}
                        ${isCompleted ? "border-green-500 bg-green-500/20" : ""}
                        ${!isActive && !isCompleted ? "border-zinc-700 bg-zinc-900" : ""}
                      `}>
                        {isCompleted ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <Icon className={`w-5 h-5 ${isActive ? "text-red-500" : "text-zinc-500"}`} />
                        )}
                      </div>
                      <div className="hidden sm:block">
                        <p className={`text-sm font-medium ${isActive ? "text-white" : "text-zinc-500"}`}>
                          Step {step.number}
                        </p>
                        <p className={`text-xs ${isActive ? "text-zinc-400" : "text-zinc-600"}`}>
                          {step.name}
                        </p>
                      </div>
                    </div>
                    {index < 2 && (
                      <div className={`flex-1 h-0.5 mx-4 ${isCompleted ? "bg-green-500" : "bg-zinc-800"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {currentStep === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Select Your Seats</h2>
            <SeatGrid
              seats={seats}
              columns={12}
              selectedSeats={selectedSeats}
              viewMode="preview"
              hallName={currentShowtime.screen}
              isDragging={false}
              onSeatClick={handleSeatClick}
              onMouseDown={handleMouseDown}
              onMouseEnter={handleMouseEnter}
              onMouseUp={handleMouseUp}
              onContextMenu={handleContextMenu}
            />
          </div>
        )}

        {currentStep === 2 && (
          <div className="max-w-2xl mx-auto">
            {isAuthenticated ? (
              <>
                <h2 className="text-xl font-semibold mb-6">Enter Your Details</h2>
                <CustomerDetailsForm
                  details={customerDetails}
                  onChange={setCustomerDetails}
                />
              </>
            ) : (
              <div className="space-y-6">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                  <h2 className="text-xl font-semibold mb-2">Login Required</h2>
                  <p className="text-sm text-zinc-400">
                    Sign in to continue with your booking details. After login, you&apos;ll stay on this booking step.
                  </p>
                </div>
                {isLoading ? (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
                    Checking your session...
                  </div>
                ) : (
                  <LoginForm
                    redirectTo="/customer/bookings"
                    title="Sign in to continue booking"
                    subtitle="Your selected seats will stay here while you log in."
                    onSuccess={() => setBookingError('')}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-6">Payment</h2>
            <PaymentForm
              totalAmount={getTotalAmount()}
              onPaymentMethodSelect={setPaymentMethod}
              selectedMethod={paymentMethod}
            />
          </div>
        )}

        {currentStep === 4 && (
          <div className="max-w-2xl mx-auto">
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
          </div>
        )}

        {/* Booking Summary */}
        {currentStep > 1 && currentStep < 4 && (
          <div className="max-w-2xl mx-auto mt-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Booking Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Movie</span>
                  <span className="font-medium">{currentShowtime.movieTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Date & Time</span>
                  <span className="font-medium">{currentShowtime.date}, {currentShowtime.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Location</span>
                  <span className="font-medium">{currentShowtime.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Seats</span>
                  <span className="font-medium">{getSelectedSeatLabels().join(", ")}</span>
                </div>
                <div className="pt-3 border-t border-zinc-800 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-xl">${getTotalAmount().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep < 4 && (
          <div className="flex gap-4 mt-8 max-w-2xl mx-auto">
            <ButtonGray
              onClick={handleBack}
              className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-all"
            >
              {currentStep === 1 ? "Cancel" : "Back"}
            </ButtonGray>
            {!(currentStep === 2 && !isAuthenticated) ? (
              <ButtonRed
                onClick={handleNext}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 rounded-lg font-medium hover:shadow-lg hover:shadow-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {currentStep === 3 ? "Confirm & Pay" : "Continue"}
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </ButtonRed>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export { BookingPage };
export default BookingPage;