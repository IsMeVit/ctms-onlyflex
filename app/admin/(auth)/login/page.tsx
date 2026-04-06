"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Background from "@/components/layout/Background";

function LoginFormContent() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.csrfToken))
      .catch(console.error);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      csrfToken,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials");
      setLoading(false);
    } else {
      router.push("/admin/dashboard");
    }
  }

  return (
    <div className="relative max-w-md w-full p-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white tracking-wider">
          ADMIN PORTAL
        </h2>
        <p className="mt-2 text-xl text-white/80">
          Only<span className="text-red-500 font-bold">Flix</span> 
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {csrfToken && <input type="hidden" name="csrfToken" value={csrfToken} />}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
              placeholder="admin@example.com"
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all pr-20"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-10 text-white/60 hover:text-white text-sm font-medium transition-colors"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-white/30 bg-white/10 text-red-500 focus:ring-red-500/50 focus:ring-offset-0"
            />
            <span className="ml-2 text-sm text-white/70">Remember me</span>
          </label>
          <span className="text-sm text-white/60">
            Forgot password?
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-red-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div className="text-center">
          <a href="/" className="text-sm text-white/60 hover:text-white transition-colors">
            ← Back to main site
          </a>
        </div>
      </form>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="relative max-w-md w-full p-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white tracking-wider">
          ADMIN PORTAL
        </h2>
        <p className="mt-2 text-xl text-white/80">
          Only<span className="text-red-500 font-bold">Flix</span> 
        </p>
      </div>
      <div className="text-center text-white/60">Loading...</div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Suspense fallback={
        <>
          <Background />
          <LoadingFallback />
        </>
      }>
        <Background />
        <LoginFormContent />
      </Suspense>
    </div>
  );
}