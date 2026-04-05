"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calendar,
  Film,
  LayoutDashboard,
  LogOut,
  Users,
  TrendingUp,
} from "lucide-react";
import { SeatIcon } from "@/components/seats/SeatSVG";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { id: "analytics", label: "Analytics", icon: TrendingUp, href: "/admin/analytics" },
  { id: "movies", label: "Movies", icon: Film, href: "/admin/movies" },
  { id: "halls", label: "Halls", icon: Building2, href: "/admin/halls" },
  { id: "showtimes", label: "Showtimes", icon: Calendar, href: "/admin/showtimes" },
  { id: "bookings", label: "Bookings", icon: SeatIcon, href: "/admin/bookings" },
  { id: "users", label: "Users", icon: Users, href: "/admin/users" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen shrink-0 flex w-70 flex-col border-r border-[#1a1f2e] bg-[#030712] font-sans text-zinc-50 antialiased">
      <div className="border-b border-[#1a1f2e] px-6 py-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#ff1f4d] to-[#df002b] shadow-[0_10px_25px_rgba(255,0,60,0.35)]">
            <Film className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">OnlyFlex</h1>
            <p className="text-xs text-zinc-500">Admin Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2.5 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`group flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-[#ff1546] to-[#e1002b] text-white shadow-[0_12px_28px_rgba(255,0,60,0.35)]"
                  : "text-zinc-400 hover:bg-[#101827] hover:text-zinc-60"
              }`}
            >
              <item.icon
                className={`h-5 w-5 ${
                  isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
                strokeWidth={2}
              />
              <span className="text-[16px] font-medium tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {/* Footer */}
      <div className="p-4 border-t border-zinc-800">
        <div className="bg-zinc-900 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-zinc-400">System Status</span>
          </div>
          <p className="text-sm font-medium">All Systems Online</p>
        </div>
      </div>

      <div className="border-t border-[#1a1f2e] p-4">
        <Link
          href="/"
          className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-zinc-80 transition-all hover:bg-[#101827] hover:text-zinc-100"
        >
          <LogOut className="h-5 w-5" strokeWidth={1.9} />
          <span className="text-[15px] font-medium tracking-tight">Back To Site</span>
        </Link>
      </div>
    </aside>
  );
}
