"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Film, 
  Monitor, 
  Calendar, 
  Clock, 
  DollarSign, 
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  Ticket,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Lock
} from "lucide-react";
import { SeatIcon } from "@/components/seats/SeatSVG";
import { Seat } from "@/types/seat";
import { SeatGrid } from "@/components/seats/SeatGrid";

interface Movie {
  id: string;
  title: string;
  posterUrl: string | null;
  duration: number | null;
}

interface Showtime {
  id: string;
  movieId: string;
  hallId: string;
  startTime: string;
  basePrice: string;
  movie: Movie;
  hall: {
    id: string;
    name: string;
    capacity: number;
  };
}

interface BookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "movie" | "customer" | "seats" | "payment" | "success";

export default function BookingForm({ isOpen, onClose, onSuccess }: BookingFormProps) {
  const [step, setStep] = useState<Step>("movie");
  const [isLoading, setIsLoading] = useState(false);
  const [processingBank, setProcessingBank] = useState(false);
  const [error, setError] = useState("");

  // Data
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  
  // Selection
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [bookedId, setBookedId] = useState<string | null>(null);

  // Card State (Mock)
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: ""
  });
  
  // Customer
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    membershipTier: "NONE"
  });

  // --- Data Fetching ---

  const fetchMovies = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/movies?status=RELEASED&limit=100");
      if (response.ok) {
        const data = await response.json();
        setMovies(data.movies || []);
      } else {
        const data = await response.json().catch(() => null);
        setError(data?.error || "Failed to fetch movies");
      }
    } catch (err) {
      console.error("Error fetching movies:", err);
      setError("Failed to fetch movies");
    }
  }, []);

  const fetchShowtimes = useCallback(async (movieId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/showtimes?movieId=${movieId}&status=ACTIVE&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setShowtimes(data.showtimes || []);
      }
    } catch (err) {
      console.error("Error fetching showtimes:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSeats = useCallback(async (showtime: Showtime) => {
    try {
      setIsLoading(true);
      
      // 1. Fetch hall seats
      const seatsRes = await fetch(`/api/admin/halls/${showtime.hallId}/seats`);
      if (!seatsRes.ok) throw new Error("Failed to fetch seats");
      const seatsData = await seatsRes.json();
      let hallSeats: Seat[] = seatsData.seats || [];

      // 2. Fetch current bookings for this showtime to find booked seats
      const bookingsRes = await fetch(`/api/admin/booking?showtimeId=${showtime.id}&limit=500`);
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        const bookedSeatIds = new Set<string>();
        
        bookingsData.bookings?.forEach((b: any) => {
           b.tickets?.forEach((t: any) => {
              if (t.seat?.id) bookedSeatIds.add(t.seat.id);
           });
        });

        // Mark seats as booked
        hallSeats = hallSeats.map(s => ({
           ...s,
           status: bookedSeatIds.has(s.id) ? 'BOOKED' : s.status
        }));
      }

      setSeats(hallSeats);
    } catch (err) {
      console.error("Error fetching seats:", err);
      setError("Failed to load seat layout");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCustomerMembership = useCallback(async (email: string) => {
    if (!email || !email.includes("@")) return;
    try {
      const response = await fetch(`/api/admin/users/search?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(prev => ({ 
          ...prev, 
          name: prev.name || data.name || "", 
          phone: prev.phone || data.phone || "",
          membershipTier: data.membershipTier || "NONE" 
        }));
      } else {
        setCustomer(prev => ({ ...prev, membershipTier: "NONE" }));
      }
    } catch (err) {
      console.error("Error fetching membership:", err);
    }
  }, []);

  // --- Effects ---

  useEffect(() => {
    if (isOpen) {
      fetchMovies();
    } else {
      // Reset form
      setStep("movie");
      setSelectedMovie(null);
      setSelectedShowtime(null);
      setSelectedSeatIds(new Set());
      setCustomer({ name: "", email: "", phone: "", membershipTier: "NONE" });
      setPaymentMethod("CASH");
      setCardDetails({ number: "", expiry: "", cvv: "" });
      setBookedId(null);
      setError("");
    }
  }, [isOpen, fetchMovies]);

  // --- Handlers ---

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    fetchShowtimes(movie.id);
  };

  const handleShowtimeSelect = (showtime: Showtime) => {
    setSelectedShowtime(showtime);
    fetchSeats(showtime);
    setStep("customer");
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== 'AVAILABLE') return;
    
    setSelectedSeatIds(prev => {
      const next = new Set(prev);
      
      if (seat.seatType === 'TWINSEAT') {
        // Find the partner seat using consistent sequential pairing
        const rowTwinSeats = seats
          .filter(s => s.row === seat.row && s.seatType === 'TWINSEAT')
          .sort((a, b) => a.column - b.column);
        
        let partner: Seat | undefined;
        for (let i = 0; i < rowTwinSeats.length; i += 2) {
          if (rowTwinSeats[i].id === seat.id) {
            partner = rowTwinSeats[i+1];
            break;
          }
          if (rowTwinSeats[i+1]?.id === seat.id) {
            partner = rowTwinSeats[i];
            break;
          }
        }

        if (next.has(seat.id)) {
          next.delete(seat.id);
          if (partner) next.delete(partner.id);
        } else {
          next.add(seat.id);
          if (partner) next.add(partner.id);
        }
      } else {
        if (next.has(seat.id)) {
          next.delete(seat.id);
        } else {
          next.add(seat.id);
        }
      }
      return next;
    });
  };

  const pricingSummary = useMemo(() => {
    if (!selectedShowtime) return { subtotal: 0, discount: 0, total: 0 };
    const basePrice = parseFloat(selectedShowtime.basePrice);
    let subtotal = 0;
    
    selectedSeatIds.forEach(id => {
       const seat = seats.find(s => s.id === id);
       if (!seat) return;
       
       let price = basePrice;
       if (seat.seatType === 'VIP') price *= 1.5;
       if (seat.seatType === 'TWINSEAT') price *= 1.5;
       subtotal += price;
    });

    const discount = customer.membershipTier === "MEMBER" ? subtotal * 0.3 : 0;
    
    return {
      subtotal,
      discount,
      total: subtotal - discount
    };
  }, [selectedShowtime, selectedSeatIds, seats, customer.membershipTier]);

  const handleSubmit = async () => {
    if (!selectedShowtime || selectedSeatIds.size === 0 || !customer.email || !customer.name) {
      setError("Please complete all required fields");
      return;
    }

    if (paymentMethod === "CARD" && (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv)) {
      setError("Please enter complete card details");
      return;
    }

    setIsLoading(true);
    setError("");

    // Simulate Bank Processing for Card
    if (paymentMethod === "CARD") {
      setProcessingBank(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setProcessingBank(false);
    }

    try {
      // 1. Find or create user
      let userId = "";
      
      const searchRes = await fetch(`/api/admin/users/search?email=${encodeURIComponent(customer.email)}`);
      if (searchRes.ok) {
        const userData = await searchRes.json();
        userId = userData.id;
      } else {
        // Register new user
        const userRes = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: customer.name,
            email: customer.email,
            password: "temporary-password-" + Math.random().toString(36).slice(-8),
            phone: customer.phone
          })
        });

        const userData = await userRes.json();
        if (userRes.ok) {
          userId = userData.userId;
        } else {
          throw new Error(userData.error || "Failed to create user");
        }
      }

      // 2. Create booking
      const bookingRes = await fetch("/api/admin/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          showtimeId: selectedShowtime.id,
          subtotal: pricingSummary.subtotal,
          totalDiscount: pricingSummary.discount,
          finalAmount: pricingSummary.total,
          bookingStatus: "CONFIRMED",
          seatIds: Array.from(selectedSeatIds),
          paymentMethod: paymentMethod
        })
      });

      if (!bookingRes.ok) {
        const errorData = await bookingRes.json();
        throw new Error(errorData.error || "Failed to create booking");
      }

      const finalBooking = await bookingRes.json();
      setBookedId(finalBooking.id);
      setStep("success");
      onSuccess();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-50 transition-colors">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
               <SeatIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                {step === "movie" && "Choose Screening"}
                {step === "customer" && "Customer Details"}
                {step === "seats" && "Select Seats"}
                {step === "payment" && "Finalize Booking"}
                {step === "success" && "Booking Confirmed"}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-bold uppercase tracking-widest">Manual Ticket Issuance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 dark:text-zinc-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-8 py-2 bg-zinc-100/50 dark:bg-zinc-900/30 border-b border-zinc-200 dark:border-zinc-800">
           <div className="flex justify-between items-center max-w-2xl mx-auto">
              <ProgressStep active={step === "movie"} completed={step !== "movie"} label="Session" />
              <div className="flex-1 h-0.5 mx-4 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                 <div className={`h-full bg-red-600 transition-all duration-500 ${step === "movie" ? "w-0" : "w-full"}`} />
              </div>
              <ProgressStep active={step === "customer"} completed={step === "seats" || step === "payment" || step === "success"} label="Customer" />
              <div className="flex-1 h-0.5 mx-4 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                 <div className={`h-full bg-red-600 transition-all duration-500 ${step === "seats" || step === "payment" || step === "success" ? "w-full" : "w-0"}`} />
              </div>
              <ProgressStep active={step === "seats"} completed={step === "payment" || step === "success"} label="Seats" />
              <div className="flex-1 h-0.5 mx-4 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                 <div className={`h-full bg-red-600 transition-all duration-500 ${step === "payment" || step === "success" ? "w-full" : "w-0"}`} />
              </div>
              <ProgressStep active={step === "payment"} completed={step === "success"} label="Confirm" />
              <div className="flex-1 h-0.5 mx-4 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                 <div className={`h-full bg-emerald-500 transition-all duration-500 ${step === "success" ? "w-full" : "w-0"}`} />
              </div>
              <ProgressStep active={step === "success"} completed={false} label="Receipt" />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm font-bold rounded-r-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="h-5 w-5" />
              {error}
            </div>
          )}

          {step === "movie" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                     <Film className="w-4 h-4" /> 1. Select Movie
                  </h4>
                  <div className="grid grid-cols-2 gap-3 max-h-100 overflow-y-auto pr-2 custom-scrollbar">
                     {movies.map(movie => (
                        <button
                          key={movie.id}
                          onClick={() => handleMovieSelect(movie)}
                          className={`group relative aspect-2/3 rounded-2xl overflow-hidden border-2 transition-all ${
                            selectedMovie?.id === movie.id 
                              ? "border-red-600 ring-4 ring-red-600/10 shadow-xl" 
                              : "border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                          }`}
                        >
                           {movie.posterUrl ? (
                             <Image src={movie.posterUrl} alt={movie.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                           ) : (
                             <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                <Film className="w-8 h-8 text-zinc-400" />
                             </div>
                           )}
                           <div className="absolute inset-x-0 bottom-0 p-3 bg-linear-to-t from-black/80 via-black/40 to-transparent">
                              <p className="text-white text-xs font-bold truncate">{movie.title}</p>
                           </div>
                        </button>
                     ))}
                  </div>
               </div>

               <div className="space-y-6">
                  <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                     <Clock className="w-4 h-4" /> 2. Pick Showtime
                  </h4>
                  {!selectedMovie ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl opacity-50">
                       <Film className="w-12 h-12 text-zinc-300 mb-4" />
                       <p className="text-zinc-500 font-medium">Select a movie first to see available showtimes.</p>
                    </div>
                  ) : isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                       <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-4" />
                       <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Fetching sessions...</p>
                    </div>
                  ) : showtimes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-red-100 dark:border-red-900/20 rounded-3xl">
                       <AlertTriangle className="w-12 h-12 text-red-200 mb-4" />
                       <p className="text-zinc-500 font-medium">No active showtimes found for this movie.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-100 overflow-y-auto pr-2 custom-scrollbar">
                       {showtimes.map(st => (
                          <button
                            key={st.id}
                            onClick={() => handleShowtimeSelect(st)}
                            className="w-full p-4 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl hover:border-red-500 hover:ring-4 hover:ring-red-500/5 transition-all group"
                          >
                             <div className="flex items-center gap-4">
                                <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm group-hover:bg-red-50 dark:group-hover:bg-red-950/30 transition-colors">
                                   <Calendar className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="text-left">
                                   <p className="font-black text-zinc-900 dark:text-zinc-100">{new Date(st.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                                   <p className="text-xs text-zinc-500 font-bold uppercase">{new Date(st.startTime).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">{st.hall.name}</p>
                                <p className="text-xs text-zinc-400 font-medium">Starts from ${st.basePrice}</p>
                             </div>
                          </button>
                       ))}
                    </div>
                  )}
               </div>
            </div>
          )}

          {step === "customer" && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in duration-300">
               <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                     <User className="w-8 h-8 text-zinc-400" />
                  </div>
                  <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Customer Information</h4>
                  <p className="text-sm text-zinc-500 font-medium">Link this booking to a user account.</p>
               </div>

               <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                       <span className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Email Address <span className="text-red-500">*</span></span>
                       {customer.membershipTier === "MEMBER" && (
                         <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full animate-pulse">30% MEMBER DISCOUNT</span>
                       )}
                    </label>
                    <input 
                      type="email" 
                      value={customer.email}
                      onChange={(e) => setCustomer({...customer, email: e.target.value})}
                      onBlur={(e) => fetchCustomerMembership(e.target.value)}
                      placeholder="customer@example.com"
                      className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                         <User className="w-3.5 h-3.5" /> Full Name <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        value={customer.name}
                        onChange={(e) => setCustomer({...customer, name: e.target.value})}
                        placeholder="John Doe"
                        className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                         <Phone className="w-3.5 h-3.5" /> Phone Number
                      </label>
                      <input 
                        type="tel" 
                        value={customer.phone}
                        onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                        placeholder="+84 900 000 000"
                        className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-medium"
                      />
                    </div>
                  </div>
               </div>

               <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setStep("movie")}
                    className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl font-black text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
                  >
                     <ChevronLeft className="w-4 h-4" /> Back to Session
                  </button>
                  <button 
                    disabled={!customer.email || !customer.name}
                    onClick={() => setStep("seats")}
                    className="flex-2 py-4 bg-red-600 text-white rounded-2xl font-black text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                     Select Seats <ChevronRight className="w-4 h-4" />
                  </button>
               </div>
            </div>
          )}

          {step === "seats" && (
            <div className="space-y-8 animate-in fade-in zoom-in duration-300">
               <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1 bg-zinc-50 dark:bg-[#050505] border border-zinc-100 dark:border-zinc-900 rounded-[40px] p-12 overflow-x-auto min-h-125 flex items-center justify-center">
                     <SeatGrid 
                        seats={seats}
                        columns={selectedShowtime?.hall.capacity ? 12 : 10} // Default or dynamic
                        selectedSeats={selectedSeatIds}
                        viewMode="preview"
                        hallName={selectedShowtime?.hall.name}
                        isDragging={false}
                        onSeatClick={handleSeatClick}
                        onMouseDown={() => {}}
                        onMouseEnter={() => {}}
                        onMouseUp={() => {}}
                        onContextMenu={() => {}}
                     />
                  </div>

                  <div className="w-full lg:w-80 space-y-6">
                     <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                           <SeatIcon className="w-4 h-4" /> Reservation Summary
                        </h4>
                        
                        <div className="space-y-4">
                           <div className="flex flex-wrap gap-2">
                              {selectedSeatIds.size === 0 ? (
                                 <p className="text-sm text-zinc-500 italic">No seats selected yet.</p>
                              ) : (
                                 Array.from(selectedSeatIds).map(id => {
                                    const seat = seats.find(s => s.id === id);
                                    if (!seat) return null;
                                    return (
                                       <span key={id} className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5">
                                          {seat.row}{seat.seatNumber}
                                          <button onClick={() => handleSeatClick(seat)} className="text-zinc-400 hover:text-red-500">
                                             <X className="w-3 h-3" />
                                          </button>
                                       </span>
                                    );
                                 })
                              )}
                           </div>

                           <hr className="border-zinc-200 dark:border-zinc-800" />

                           <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                 <span className="text-zinc-500 font-medium">Selected Seats</span>
                                 <span className="font-black">{selectedSeatIds.size}</span>
                              </div>
                              <div className="flex justify-between text-lg font-black pt-2">
                                 <span className="text-zinc-900 dark:text-zinc-50">Total Amount</span>
                                 <span className="text-red-600">${pricingSummary.total.toFixed(2)}</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="flex flex-col gap-3">
                        <button 
                          onClick={() => setStep("payment")}
                          disabled={selectedSeatIds.size === 0}
                          className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                           Proceed to Payment <ChevronRight className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setStep("customer")}
                          className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl font-black text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
                        >
                           <ChevronLeft className="w-4 h-4" /> Back to Customer
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {step === "payment" && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-300">
               {processingBank ? (
                 <div className="py-20 flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                       <Loader2 className="w-16 h-16 animate-spin text-red-600" />
                       <ShieldCheck className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center space-y-2">
                       <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Authorizing Transaction</h4>
                       <p className="text-sm text-zinc-500 font-medium italic">Connecting to secure banking gateway...</p>
                    </div>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                     <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl overflow-hidden">
                        <div className="px-8 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-800/50 flex justify-between items-center">
                           <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Booking Overview</span>
                        </div>
                        <div className="p-8 space-y-6">
                           <div className="grid grid-cols-2 gap-6">
                              <SummaryItem icon={Film} label="Movie" value={selectedMovie?.title || ""} />
                              <SummaryItem icon={Monitor} label="Hall" value={selectedShowtime?.hall.name || ""} />
                              <SummaryItem icon={Calendar} label="Date" value={selectedShowtime ? new Date(selectedShowtime.startTime).toLocaleDateString() : ""} />
                              <SummaryItem icon={Clock} label="Time" value={selectedShowtime ? new Date(selectedShowtime.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""} />
                              <SummaryItem icon={User} label="Customer" value={customer.name} />
                              <SummaryItem icon={Ticket} label="Seats" value={Array.from(selectedSeatIds).map(id => {
                                 const seat = seats.find(s => s.id === id);
                                 return seat ? `${seat.row}${seat.seatNumber}` : "";
                              }).join(", ")} />
                           </div>
                        </div>
                     </div>

                     <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-8 space-y-6">
                        <div className="flex items-center justify-between">
                           <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                              <DollarSign className="w-4 h-4" /> Payment Method
                           </h4>
                           {paymentMethod === "CARD" && (
                             <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                <Lock className="w-3 h-3" /> Secure Gateway
                             </div>
                           )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <PaymentMethodCard 
                              active={paymentMethod === "CASH"} 
                              onClick={() => setPaymentMethod("CASH")} 
                              icon={DollarSign} 
                              label="Cash" 
                           />
                           <PaymentMethodCard 
                              active={paymentMethod === "CARD"} 
                              onClick={() => setPaymentMethod("CARD")} 
                              icon={CreditCard} 
                              label="Card" 
                           />
                           <PaymentMethodCard 
                              active={paymentMethod === "ONLINE"} 
                              onClick={() => setPaymentMethod("ONLINE")} 
                              icon={Monitor} 
                              label="Online" 
                           />
                           <PaymentMethodCard 
                              active={paymentMethod === "MOBILE_WALLET"} 
                              onClick={() => setPaymentMethod("MOBILE_WALLET")} 
                              icon={Smartphone} 
                              label="Wallet" 
                           />
                        </div>

                        {/* Card Details Form */}
                        {paymentMethod === "CARD" && (
                          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Card Number</label>
                                <div className="relative">
                                   <input 
                                     type="text" 
                                     maxLength={19}
                                     value={cardDetails.number}
                                     onChange={(e) => setCardDetails({...cardDetails, number: e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim()})}
                                     placeholder="0000 0000 0000 0000"
                                     className="w-full h-12 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 font-mono text-sm outline-none focus:border-red-500 transition-colors"
                                   />
                                   <CreditCard className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2" />
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Expiry Date</label>
                                   <input 
                                     type="text" 
                                     maxLength={5}
                                     value={cardDetails.expiry}
                                     onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value.replace(/\D/g, '').replace(/(.{2})/g, '$1/').replace(/\/$/, '')})}
                                     placeholder="MM/YY"
                                     className="w-full h-12 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 font-mono text-sm outline-none focus:border-red-500 transition-colors"
                                   />
                                </div>
                                <div className="space-y-1.5">
                                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">CVV</label>
                                   <div className="relative">
                                      <input 
                                        type="password" 
                                        maxLength={3}
                                        value={cardDetails.cvv}
                                        onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value.replace(/\D/g, '')})}
                                        placeholder="***"
                                        className="w-full h-12 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 font-mono text-sm outline-none focus:border-red-500 transition-colors"
                                      />
                                      <Lock className="w-3.5 h-3.5 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2" />
                                   </div>
                                </div>
                             </div>
                          </div>
                        )}
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="p-8 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-[40px] shadow-2xl space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest opacity-50">Pricing Breakdown</h4>
                        
                        <div className="space-y-4">
                           <div className="flex justify-between items-center">
                              <span className="text-sm font-medium opacity-70">Subtotal</span>
                              <span className="font-bold tabular-nums">${pricingSummary.subtotal.toFixed(2)}</span>
                           </div>
                           
                           {pricingSummary.discount > 0 && (
                              <div className="flex justify-between items-center text-emerald-400 dark:text-emerald-600">
                                 <span className="text-sm font-medium flex items-center gap-1.5">
                                    <CheckCircle className="w-3.5 h-3.5" /> Membership (30%)
                                 </span>
                                 <span className="font-bold tabular-nums">-${pricingSummary.discount.toFixed(2)}</span>
                              </div>
                           )}

                           <div className="h-px bg-white/10 dark:bg-zinc-200" />
                           
                           <div className="flex justify-between items-end pt-2">
                              <div>
                                 <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Total Amount</p>
                                 <p className="text-4xl font-black tabular-nums">${pricingSummary.total.toFixed(2)}</p>
                              </div>
                           </div>
                        </div>

                        <button 
                          disabled={isLoading}
                          onClick={handleSubmit}
                          className="w-full py-5 bg-red-600 hover:bg-red-700 text-white rounded-3xl font-black text-sm transition-all shadow-lg shadow-red-600/40 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                           {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                           {isLoading ? "Processing..." : "Confirm Booking"}
                        </button>

                        <button 
                          onClick={() => setStep("seats")}
                          className="w-full py-3 text-xs font-bold opacity-50 hover:opacity-100 transition-opacity"
                        >
                           Back to Seat Selection
                        </button>
                     </div>
                  </div>
               </div>
               )}
            </div>
          )}

          {step === "success" && (
            <div className="max-w-2xl mx-auto py-8 space-y-8 animate-in fade-in zoom-in duration-500">
               <div className="text-center space-y-2 no-print">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                     <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Booking Successful!</h4>
                  <p className="text-sm text-zinc-500 font-medium">The ticket has been issued and confirmed.</p>
               </div>

               {/* Physical Ticket Look */}
               <div className="relative group success-ticket">
                  {/* Decorative Notches */}
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-[#09090b] rounded-full border border-zinc-200 dark:border-zinc-800 z-10 hidden md:block no-print" />
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-[#09090b] rounded-full border border-zinc-200 dark:border-zinc-800 z-10 hidden md:block no-print" />
                  
                  <div className="bg-white dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 rounded-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
                     {/* Left Side: Main Info */}
                     <div className="flex-2 p-8 border-b-2 md:border-b-0 md:border-r-2 border-dashed border-zinc-100 dark:border-zinc-800 relative">
                        <div className="flex justify-between items-start mb-8">
                           <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-red-600 rounded-xl">
                                 <Film className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cinema Ticket</p>
                                 <p className="text-lg font-black text-zinc-900 dark:text-zinc-50 leading-tight">{selectedMovie?.title}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Ref No.</p>
                              <p className="text-sm font-black text-red-600">BK-{bookedId?.slice(-6).toUpperCase()}</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                           <TicketInfo label="Date" value={selectedShowtime ? new Date(selectedShowtime.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ""} />
                           <TicketInfo label="Time" value={selectedShowtime ? new Date(selectedShowtime.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""} />
                           <TicketInfo label="Hall" value={selectedShowtime?.hall.name || ""} />
                           <TicketInfo label="Seats" value={Array.from(selectedSeatIds).map(id => {
                              const seat = seats.find(s => s.id === id);
                              return seat ? `${seat.row}${seat.seatNumber}` : "";
                           }).join(", ")} />
                        </div>

                        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-end">
                           <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Paid</p>
                              <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tabular-nums">${pricingSummary.total.toFixed(2)}</p>
                           </div>
                           <div className="text-right space-y-1">
                              <div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-black text-zinc-500 uppercase inline-block">
                                 {paymentMethod} Payment
                              </div>
                              {paymentMethod === "CARD" && (
                                <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-tighter">Auth: {Math.random().toString(36).slice(-8).toUpperCase()}</p>
                              )}
                           </div>
                        </div>
                     </div>

                     {/* Right Side: QR Code Area */}
                     <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-900/50 p-8 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="relative p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-700 group-hover:scale-105 transition-transform duration-500">
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BK-${bookedId}`} 
                              alt="Booking QR Code"
                              className="w-32 h-32 dark:invert-[0.05]"
                           />
                        </div>
                        <div className="space-y-1">
                           <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Scan to Verify</p>
                           <p className="text-[8px] font-mono text-zinc-400 break-all opacity-50">{bookedId}</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col md:flex-row gap-4 no-print">
                  <button 
                    onClick={() => {
                      setStep("movie");
                      setSelectedMovie(null);
                      setSelectedShowtime(null);
                      setSelectedSeatIds(new Set());
                      setCustomer({ name: "", email: "", phone: "", membershipTier: "NONE" });
                      setPaymentMethod("CASH");
                      setBookedId(null);
                    }}
                    className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl font-black text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
                  >
                     Book Another
                  </button>
                  <button 
                    onClick={onClose}
                    className="flex-1 py-4 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-2xl font-black text-sm hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-black/10"
                  >
                     Close Window
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="flex-1 py-4 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-black text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                     <Monitor className="w-4 h-4" /> Print Ticket
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressStep({ active, completed, label }: { active: boolean, completed: boolean, label: string }) {
   return (
      <div className="flex flex-col items-center gap-1.5 relative">
         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
            active 
               ? "bg-red-600 text-white scale-110 shadow-lg shadow-red-600/20" 
               : completed 
                  ? "bg-emerald-500 text-white" 
                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600"
         }`}>
            {completed ? "✓" : ""}
         </div>
         <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
            active ? "text-red-600" : completed ? "text-emerald-500" : "text-zinc-400 dark:text-zinc-600"
         }`}>
            {label}
         </span>
      </div>
   );
}

function SummaryItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) {
   return (
      <div className="flex items-start gap-3">
         <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
            <Icon className="w-3.5 h-3.5 text-zinc-400" />
         </div>
         <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-37.5">{value}</p>
         </div>
      </div>
   );
}

function PaymentMethodCard({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: React.ElementType, label: string }) {
   return (
      <button 
         onClick={onClick}
         className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${
            active 
               ? "border-red-600 bg-red-50 dark:bg-red-900/20 ring-4 ring-red-600/10" 
               : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
         }`}
      >
         <div className={`p-2 rounded-xl transition-colors ${
            active ? "bg-red-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:text-zinc-600"
         }`}>
            <Icon className="w-5 h-5" />
         </div>
         <span className={`text-[10px] font-black uppercase tracking-widest ${
            active ? "text-red-600" : "text-zinc-400"
         }`}>{label}</span>
      </button>
   );
}

function TicketInfo({ label, value }: { label: string, value: string }) {
   return (
      <div className="space-y-0.5">
         <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
         <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
      </div>
   );
}
