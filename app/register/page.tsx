"use client";

import { useSearchParams } from "next/navigation";
import { AuthScreen } from "@/components/auth/AuthScreen";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/customer/bookings";

  return <AuthScreen initialTab="register" callbackUrl={callbackUrl} />;
}
