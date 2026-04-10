import { Suspense } from "react";
import BookingPageClient from "../(protected)/bookings/BookingPageClient";

export const dynamic = "force-dynamic";

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white px-4 py-24">Loading booking...</div>}>
      <BookingPageClient />
    </Suspense>
  );
}
