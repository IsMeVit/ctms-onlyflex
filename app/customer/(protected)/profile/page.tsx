"use client";

import Image from "next/image";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "../../../../components/ui/Toast";
// Try direct relative import as fallback for Toast
// import { useToast } from "../../../../components/ui/Toast";
import {
  User,
  Calendar,
  Clock,
  DollarSign,
  Camera,
  X,
  Ticket,
  Film,
  Settings,
  LogOut,
  ChevronRight,
  Star,
} from "lucide-react";
import { getUserBookingsAPI } from "@/lib/api";

interface Booking {
  reference: string;
  userId: string;
  movie: string;
  date: string;
  time: string;
  seats: string[];
  totalPrice: number;
  timestamp: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getCurrentDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ProfileContent() {
  const { user, logout, isAuthenticated, isInitialized, isLoading, updateAvatar } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [showFullAvatar, setShowFullAvatar] = useState(false);
  const { showToast } = useToast();
  const [greeting, setGreeting] = useState(getGreeting());
  const [currentDate, setCurrentDate] = useState(getCurrentDate());

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }

    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const loadBookings = async () => {
      try {
        const bookings = await getUserBookingsAPI(user?.id);
        setBookings(bookings);
      } catch (error) {
        console.error("Failed to load bookings:", error);
        setBookings([]);
      } finally {
        setBookingsLoading(false);
      }
    };
    loadBookings();
  }, [isAuthenticated, isInitialized, router, user?.id, searchParams]);

  const handleRemoveAvatar = () => {
    if (updateAvatar) updateAvatar("");
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("error", "Image must be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (updateAvatar) updateAvatar(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Customer Profile</h1>
        <button
          onClick={logout}
          className="text-red-500 hover:text-red-700"
        >
          Log out
        </button>
      </div>
      <div className="flex items-center mb-4">
        <img
          src={user?.avatarUrl || "/default-avatar.png"}
          alt="Profile"
          className="w-10 h-10 rounded-full cursor-pointer"
          onClick={() => setShowFullAvatar((prev) => !prev)}
        />
        <div className="ml-3">
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
        </div>
        <div className="ml-4">
          <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" id="avatar-upload" />
          <label htmlFor="avatar-upload" className="text-blue-500 hover:underline cursor-pointer">Change</label>
          <button onClick={handleRemoveAvatar} className="ml-2 text-red-500 hover:underline">Remove</button>
        </div>
      </div>
      {showFullAvatar && (
        <div className="mb-4">
          <img src={user?.avatarUrl || "/default-avatar.png"} alt="Full Avatar" className="w-32 h-32 rounded-full mx-auto" />
        </div>
      )}
      <div className="mb-4">
        <h3>Bookings</h3>
        {bookingsLoading ? (
          <div>Loading...</div>
        ) : (
          <ul>
            {bookings.map((booking) => (
              <li key={booking.reference}>
                <div>{booking.movie} on {booking.date} at {booking.time}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mb-4">
        <h3>Settings</h3>
        <div>
          <button
            onClick={() => setShowFullAvatar((prev) => !prev)}
            className="text-blue-500 hover:text-blue-700"
          >
            {showFullAvatar ? "Hide" : "Show"} Full Avatar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
