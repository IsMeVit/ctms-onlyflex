"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthScreen } from "@/components/auth/AuthScreen";

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/customer/bookings";

  return <AuthScreen initialTab="login" callbackUrl={callbackUrl} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-zinc-400">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
