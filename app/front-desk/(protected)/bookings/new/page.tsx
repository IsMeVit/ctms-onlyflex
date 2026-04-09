"use client";

import { useRouter } from "next/navigation";
import Background from "@/components/layout/Background";
import BookingForm from "../../../../admin/(protected)/bookings/_components/BookingForm";

export default function FrontDeskNewBookingPage() {
  const router = useRouter();

  const handleClose = () => {
    router.push("/front-desk/bookings");
  };

  const handleSuccess = () => {
    router.push("/front-desk/bookings");
  };

  return (
    <div className="min-h-screen relative">
      <Background />
      <div className="relative z-10 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BookingForm
            isOpen={true}
            onClose={handleClose}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
}
