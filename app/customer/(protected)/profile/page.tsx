"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Mail,
  Phone,
  Ticket,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { ButtonRed } from "@/components/ui/ButtonRed";

interface ProfileBooking {
  id: string;
  createdAt: string;
  finalAmount?: string | number;
  bookingStatus?: string;
  showtime?: {
    startTime?: string;
    movie?: {
      title?: string;
      posterUrl?: string;
    };
    hall?: {
      name?: string;
    };
  };
  tickets?: {
    seat?: {
      row?: string;
      seatNumber?: number | null;
    };
  }[];
}

interface ProfileResponse {
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    image: string | null;
    role: string;
    membershipTier: string;
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    totalBookings: number;
    activeTickets: number;
  };
  recentBookings: ProfileBooking[];
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function CustomerProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, isAuthenticated, isInitialized, refreshSession, updateAvatar } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.push("/login?callbackUrl=/customer/profile");
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    const section = searchParams.get("section");
    setActiveTab(section === "password" || section === "security" ? "security" : "profile");
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!isAuthenticated) return;

      setProfileLoading(true);
      setError("");

      try {
        const res = await fetch("/api/customer/profile", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load profile");
        }

        if (!mounted) return;
        setProfile(data);
        setFormName(data.user.name || "");
        setFormPhone(data.user.phone || "");
        setAvatarPreview(data.user.image || "");
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load profile");
      } finally {
        if (mounted) setProfileLoading(false);
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const pageTabs = [
    { value: "profile", label: "Profile" },
    { value: "security", label: "Reset Password" },
  ];

  const handleTabChange = (value: string) => {
    const nextTab = value === "security" ? "security" : "profile";
    setActiveTab(nextTab);
    setMessage("");
    setError("");
    router.replace(nextTab === "security" ? "/customer/profile?section=password" : "/customer/profile");
  };

  const displayAvatar = avatarPreview || profile?.user.image || user?.avatarUrl || "";

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result;
      if (typeof result === "string") {
        setAvatarPreview(result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview("");
  };

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProfile(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          phone: formPhone,
          image: avatarPreview,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to update profile");
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              user: data.user,
            }
          : prev
      );

      if (typeof updateAvatar === "function") {
        await updateAvatar(avatarPreview || "");
      }

      await refreshSession();
      setMessage("Profile updated successfully.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/customer/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to update password");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated successfully.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!isInitialized || profileLoading) {
    return (
      <div className="min-h-screen bg-[#050909] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl pt-24 text-zinc-400">Loading your profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050909] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl pt-24">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/customer/movies"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Movies
          </Link>
          <ButtonRed
            onClick={logout}
            className="text-sm cursor-pointer font-medium text-white transition-colors hover:text-red-300"
          >
            <LogOut />
            Sign out
          </ButtonRed>
        </div>

        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.35em] text-zinc-500">Customer profile</p>
          <h1 className="mt-3 text-4xl font-bold text-white">Manage your account</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Update your profile details, keep your avatar fresh, and reset your password from one place.
          </p>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {message}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden">
            <div className="border-b border-zinc-800 px-6 pt-6">
              <Tabs
                items={pageTabs}
                value={activeTab}
                onChange={handleTabChange}
              />
            </div>

            <div className="p-6">
              {activeTab === "profile" ? (
                <form className="space-y-6" onSubmit={handleProfileSubmit}>
                  <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
                      {displayAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={displayAvatar}
                          alt={profile?.user.name || "Profile avatar"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-500">
                          <User className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">
                        {profile?.user.name || user?.name || "Guest user"}
                      </p>
                      <p className="text-xs text-zinc-500">{profile?.user.email || user?.email}</p>
                      <p className="mt-2 text-xs text-zinc-500">
                        {profile?.user.membershipTier || "NONE"} membership
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="avatar-upload"
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
                      >
                        <Camera className="h-4 w-4" />
                        Change
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="text-left text-xs text-zinc-500 transition-colors hover:text-white"
                      >
                        Remove avatar
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Full Name"
                      name="name"
                      value={formName}
                      onChange={(event) => setFormName(event.target.value)}
                      leftIcon={<User className="h-4 w-4" />}
                    />
                    <Input
                      label="Phone Number"
                      name="phone"
                      value={formPhone}
                      onChange={(event) => setFormPhone(event.target.value)}
                      leftIcon={<Phone className="h-4 w-4" />}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <Input
                    label="Email Address"
                    value={profile?.user.email || ""}
                    leftIcon={<Mail className="h-4 w-4 fill-none stroke-white" />}
                    readOnly
                    className="opacity-90"
                  />

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="submit"
                      variant="default"
                      disabled={savingProfile}
                      className="min-w-40"
                    >
                      {savingProfile ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setActiveTab("security")}
                    >
                      Reset Password
                    </Button>
                  </div>
                </form>
              ) : (
                <form className="space-y-5" onSubmit={handlePasswordSubmit}>
                  <Input
                    label="Current Password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    leftIcon={<Lock className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((value) => !value)}
                        className="rounded-md p-1 text-zinc-500 transition-colors hover:text-zinc-200"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />

                  <Input
                    label="New Password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    leftIcon={<Lock className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((value) => !value)}
                        className="rounded-md p-1 text-zinc-500 transition-colors hover:text-zinc-200"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />

                  <Input
                    label="Confirm New Password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    leftIcon={<Lock className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        className="rounded-md p-1 text-zinc-500 transition-colors hover:text-zinc-200"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="submit"
                      variant="default"
                      disabled={passwordLoading}
                      className="min-w-40"
                    >
                      {passwordLoading ? "Updating..." : "Update Password"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setActiveTab("profile")}
                    >
                      Back to Profile
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Account summary</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    {profile?.user.name || user?.name || "Your profile"}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">{profile?.user.email || user?.email}</p>
                </div>
                <div className="rounded-2xl bg-red-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
                  {profile?.user.membershipTier || "NONE"}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Bookings</p>
                  <p className="mt-2 text-2xl font-bold text-white">{profile?.stats.totalBookings || 0}</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Active Tickets</p>
                  <p className="mt-2 text-2xl font-bold text-white">{profile?.stats.activeTickets || 0}</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Member since</p>
                <p className="mt-2 text-sm text-zinc-200">
                  {profile?.user.createdAt
                    ? dateFormatter.format(new Date(profile.user.createdAt))
                    : "Recently"}
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Account type</p>
                <p className="mt-2 text-sm text-zinc-200">
                  {profile?.user.role || "USER"}
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Recent bookings</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Latest activity</h2>
                </div>
                <Ticket className="h-5 w-5 text-red-400" />
              </div>

              <div className="mt-5 space-y-4">
                {(profile?.recentBookings || []).length > 0 ? (
                  (profile?.recentBookings || []).map((booking) => {
                    const movie = booking?.showtime?.movie;
                    const seats = booking?.tickets
                      ?.map((seatTicket) => `${seatTicket.seat?.row}${seatTicket.seat?.seatNumber}`)
                      .join(", ");
                    const startTime = booking?.showtime?.startTime;

                    return (
                    <div key={booking.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{movie?.title || "Movie"}</p>
                            <p className="mt-1 text-sm text-zinc-400">
                              {startTime ? dateFormatter.format(new Date(startTime)) : "TBA"} at{" "}
                              {startTime ? timeFormatter.format(new Date(startTime)) : "TBA"}
                            </p>
                          </div>
                          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                            {booking?.bookingStatus || "PENDING"}
                          </span>
                        </div>
                        <div className="mt-3 text-sm text-zinc-400">
                          Seats: <span className="text-zinc-200">{seats || "TBA"}</span>
                        </div>
                        <div className="mt-2 text-sm text-zinc-400">
                          Hall: <span className="text-zinc-200">{booking?.showtime?.hall?.name || "TBA"}</span>
                        </div>
                      </div>
                  );
                })
                ) : (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
                    No recent bookings yet.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CustomerProfilePage />
    </Suspense>
  );
}
