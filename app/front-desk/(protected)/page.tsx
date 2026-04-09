"use client";

import Link from "next/link";
import { 
  Ticket, 
  CalendarDays, 
  Search, 
  Clock,
  Users,
  Film,
  ArrowRight
} from "lucide-react";

interface QuickStat {
  label: string;
  value: string;
  icon: React.ReactNode;
  change?: string;
  trendUp?: boolean;
}

export default function FrontDeskDashboard() {
  const stats: QuickStat[] = [
    {
      label: "Today&apos;s Bookings",
      value: "24",
      icon: <Ticket className="w-5 h-5" />,
      change: "+12%",
      trendUp: true
    },
    {
      label: "Available Seats",
      value: "156",
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: "Active Showtimes",
      value: "8",
      icon: <Clock className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Dashboard
          </h1>
          <p className="text-white/60 mt-1">
            Welcome back! What would you like to do today?
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-black/40 backdrop-blur-xl rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-white/10 rounded-lg text-white/80 group-hover:text-white group-hover:bg-white/20 transition-all">
                {stat.icon}
              </div>
              {stat.change && (
                <span className={`text-sm font-medium ${stat.trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stat.change}
                </span>
              )}
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-white">
                {stat.value}
              </p>
              <p className="text-sm text-white/60">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-black/40 backdrop-blur-xl rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/front-desk/bookings"
              className="p-5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all group text-center"
            >
              <Search className="w-7 h-7 mx-auto mb-3 text-white/60 group-hover:text-white transition-all" />
              <p className="font-medium text-white">View Bookings</p>
              <p className="text-xs text-white/50 mt-1">Search existing bookings</p>
            </Link>
            <Link
              href="/front-desk/schedule"
              className="p-5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all group text-center"
            >
              <CalendarDays className="w-7 h-7 mx-auto mb-3 text-white/60 group-hover:text-white transition-all" />
              <p className="font-medium text-white">Schedule</p>
              <p className="text-xs text-white/50 mt-1">View movie schedule</p>
            </Link>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">
              Today&apos;s Showtimes
            </h2>
            <Link
              href="/front-desk/schedule"
              className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { movie: "Avengers: Endgame", time: "10:30 AM", hall: "Hall A", seats: 24 },
              { movie: "Inception", time: "1:00 PM", hall: "Hall B", seats: 45 },
              { movie: "The Dark Knight", time: "4:30 PM", hall: "Hall A", seats: 12 },
            ].map((showtime, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Film className="w-5 h-5 text-white/60" />
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {showtime.movie}
                    </p>
                    <p className="text-xs text-white/50">
                      {showtime.hall}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-white">
                    {showtime.time}
                  </p>
                  <p className="text-xs text-white/50">
                    {showtime.seats} seats left
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
