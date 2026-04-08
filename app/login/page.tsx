"use client";

import { useSearchParams } from "next/navigation";
import { AuthScreen } from "@/components/auth/AuthScreen";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/customer/bookings";

  return <AuthScreen initialTab="login" callbackUrl={callbackUrl} />;
}
