"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Film,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Tabs } from "@/components/ui/Tabs";

type AuthTab = "login" | "register";
type LoginMode = "email" | "phone";

interface AuthScreenProps {
  initialTab: AuthTab;
  callbackUrl: string;
}

const HERO_IMAGE =
  "https://img.freepik.com/premium-photo/cinema-house-inside_133748-23.jpg";

const normalizePhone = (value: string) => value.replace(/\D/g, "");

const isEmailLike = (value: string) => value.includes("@");

export function AuthScreen({ initialTab, callbackUrl }: AuthScreenProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [loginMode, setLoginMode] = useState<LoginMode>("email");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [registerContact, setRegisterContact] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const loginValid = loginIdentifier.trim().length > 0 && loginPassword.trim().length > 0;
  const registerValid =
    fullName.trim().length > 0 &&
    registerContact.trim().length > 0 &&
    registerPassword.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    registerPassword === confirmPassword;

  const loginTabItems = useMemo(
    () => [
      { value: "login", label: "Log In" },
      { value: "register", label: "Sign Up" },
    ],
    [],
  );

  const goToTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setLoginError("");
    setRegisterError("");

    const nextPath = tab === "login" ? "/login" : "/register";
    const nextUrl = callbackUrl
      ? `${nextPath}?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : nextPath;

    router.replace(nextUrl);
  };

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const identifier = loginMode === "phone" ? normalizePhone(loginIdentifier) : loginIdentifier.trim();
      await login(identifier, loginPassword);
      router.refresh();
      router.push(callbackUrl);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "An error occurred. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterError("");
    setRegisterLoading(true);

    if (registerPassword !== confirmPassword) {
      setRegisterError("Passwords do not match");
      setRegisterLoading(false);
      return;
    }

    const trimmedContact = registerContact.trim();
    const contactIsEmail = isEmailLike(trimmedContact);
    const normalizedPhone = normalizePhone(trimmedContact);

    if (!contactIsEmail && normalizedPhone.length < 7) {
      setRegisterError("Enter a valid email address or phone number");
      setRegisterLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          contact: trimmedContact,
          password: registerPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to create account");
      }

      const identifier = contactIsEmail ? trimmedContact : normalizedPhone;
      const result = await signIn("credentials", {
        email: identifier,
        password: registerPassword,
        redirect: false,
      });

      if (result?.error) {
        setRegisterError("Account created but sign in failed. Please log in manually.");
        goToTab("login");
        return;
      }

      router.refresh();
      router.push(callbackUrl);
    } catch (error) {
      setRegisterError(
        error instanceof Error ? error.message : "An error occurred. Please try again.",
      );
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050909] px-4 py-6 sm:px-6 lg:px-8">
      <Card className="mx-auto flex w-full max-w-5xl overflow-hidden lg:min-h-[760px]">
        <div className="relative hidden lg:block lg:w-[40%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_IMAGE}
            alt="Cinema theater interior"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/35 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-between p-10">
            <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
              <Film className="h-4 w-4 text-red-500" />
              OnlyFlex Access
            </div>

            <div className="max-w-md space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-white/55">
                Premium cinema experience
              </p>
              <h1 className="text-4xl font-bold leading-tight text-white">
                Step into the show with a cleaner, calmer booking flow.
              </h1>
              <p className="max-w-sm text-sm leading-6 text-white/70">
                Sign in to manage tickets, book seats, and keep your movie nights in one place.
              </p>
            </div>
          </div>
        </div>

        <div className="flex w-full items-stretch bg-[#0a1111] lg:w-[60%]">
          <div className="flex w-full items-center px-5 py-8 sm:px-8 lg:px-10">
            <div className="w-full max-w-lg">
              <Link
                href="/"
                className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-red-500 transition-colors hover:text-zinc-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>

              <div className="mb-8 space-y-4">
                <p className="text-sm font-medium uppercase tracking-[0.35em] text-zinc-500">
                  Welcome to OnlyFlex
                </p>
                <h2 className="text-3xl font-bold text-white sm:text-4xl">
                  {activeTab === "login" ? "Log in to continue" : "Create your account"}
                </h2>
                <p className="max-w-lg text-sm leading-6 text-zinc-400">
                  {activeTab === "login"
                    ? "Pick a sign-in method, enter your details, and jump back into your tickets."
                    : "Create your profile and start booking without losing the cinematic feel."}
                </p>
              </div>

              <Tabs
                items={loginTabItems}
                value={activeTab}
                onChange={(value) => goToTab(value as AuthTab)}
                className="cursor-pointer"
              />

              <div className="mt-6">
                <SegmentedControl
                  options={[
                    { value: "email", label: "Email" },
                    { value: "phone", label: "Phone Number" },
                  ]}
                  value={loginMode}
                  onChange={(value) => setLoginMode(value as LoginMode)}
                />
              </div>

              {activeTab === "login" ? (
                <form className="mt-8 space-y-5" onSubmit={handleLoginSubmit}>
                  {loginError ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {loginError}
                    </div>
                  ) : null}

                  <Input
                    label={loginMode === "phone" ? "Phone Number" : "Email Address"}
                    name="email"
                    type="text"
                    autoComplete={loginMode === "phone" ? "tel" : "email"}
                    placeholder={loginMode === "phone" ? "Enter your phone number" : "Enter your email address"}
                    value={loginIdentifier}
                    onChange={(event) => setLoginIdentifier(event.target.value)}
                    leftIcon={loginMode === "phone" ? <Phone className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  />

                  <Input
                    label="Password"
                    name="password"
                    type={showLoginPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    leftIcon={<Lock className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((value) => !value)}
                        className="rounded-md p-1 text-zinc-500 transition-colors hover:text-zinc-200"
                        aria-label={showLoginPassword ? "Hide password" : "Show password"}
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-right text-sm text-zinc-500 transition-colors hover:text-zinc-200"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    variant={loginValid ? "default" : "secondary"}
                    disabled={!loginValid || loginLoading}
                    className="h-12 w-full"
                  >
                    {loginLoading ? "Continuing..." : "Continue"}
                  </Button>
                </form>
              ) : (
                <form className="mt-8 space-y-5" onSubmit={handleRegisterSubmit}>
                  {registerError ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {registerError}
                    </div>
                  ) : null}

                  <Input
                    label="Full Name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    leftIcon={<User className="h-4 w-4" />}
                  />

                  <Input
                    label={loginMode === "phone" ? "Phone Number" : "Email Address"}
                    name="contact"
                    type="text"
                    autoComplete={loginMode === "phone" ? "tel" : "email"}
                    placeholder={loginMode === "phone" ? "Enter your phone number" : "john@example.com"}
                    value={registerContact}
                    onChange={(event) => setRegisterContact(event.target.value)}
                    leftIcon={loginMode === "phone" ? <Phone className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  />

                  <Input
                    label="Password"
                    name="password"
                    type={showRegisterPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={registerPassword}
                    onChange={(event) => setRegisterPassword(event.target.value)}
                    leftIcon={<Lock className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword((value) => !value)}
                        className="rounded-md p-1 text-zinc-500 transition-colors hover:text-zinc-200"
                        aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                      >
                        {showRegisterPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                  />

                  <Input
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    leftIcon={<Lock className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        className="rounded-md p-1 text-zinc-500 transition-colors hover:text-zinc-200"
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                  />

                  <p className="text-sm text-zinc-500">
                    By signing up, you agree to our Terms.
                  </p>

                  <Button
                    type="submit"
                    variant="default"
                    disabled={!registerValid || registerLoading}
                    className="h-12 w-full cursor-pointer"
                  >
                    {registerLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
