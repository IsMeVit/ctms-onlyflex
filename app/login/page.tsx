"use client";

import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoginForm redirectTo={callbackUrl} />
    </div>
  );
}
