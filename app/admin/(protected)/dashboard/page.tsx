import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { 
  Film, 
  Building2, 
  Calendar
} from "lucide-react";
import { SeatIcon } from "@/components/seats/SeatSVG";
import { StatsCard } from "@/app/admin/_components/StatsCard";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default async function AdminDashboardPage() {
  // Fetch stats
  const [totalMovies, totalHalls, totalShowtimes, totalBookings] = await Promise.all([
    prisma.movie.count(),
    prisma.hall.count(),
    prisma.showtime.count(),
    prisma.booking.count(),
  ]);
  
  // Get recent bookings
  const recentBookings = await prisma.booking.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      showtime: {
        include: {
          movie: { select: { title: true } },
          hall: { select: { name: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Overview of your cinema management system.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Movies"
          value={totalMovies}
          icon={Film}
          trend="+2.5%"
          trendUp={true}
          link={{ href: "/admin/movies", label: "Manage movies" }}
        />
        <StatsCard
          title="Total Halls"
          value={totalHalls}
          icon={Building2}
          link={{ href: "/admin/halls", label: "Manage halls" }}
        />
        <StatsCard
          title="Active Showtimes"
          value={totalShowtimes}
          icon={Calendar}
          trend="+12%"
          trendUp={true}
          link={{ href: "/admin/showtimes", label: "Manage showtimes" }}
        />
        <StatsCard
          title="Total Bookings"
          value={totalBookings}
          icon={SeatIcon}
          trend="+4.3%"
          trendUp={true}
          link={{ href: "/admin/bookings", label: "View bookings" }}
        />
      </div>

      {/* Recent Bookings */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Recent Bookings
          </h3>
          <button className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors font-medium">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          {recentBookings.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="px-6 py-3 font-semibold">User</th>
                  <th className="px-6 py-3 font-semibold">Movie</th>
                  <th className="px-6 py-3 font-semibold">Hall</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-zinc-600 dark:text-zinc-300">
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors group">
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-200">
                      {booking.user.name || booking.user.email}
                    </td>
                    <td className="px-6 py-4">{booking.showtime.movie.title}</td>
                    <td className="px-6 py-4">{booking.showtime.hall.name}</td>
                    <td className="px-6 py-4 font-mono text-zinc-500 dark:text-zinc-400">
                      ${booking.finalAmount.toString()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge 
                        status={booking.bookingStatus} 
                        variant={
                          booking.bookingStatus === 'CONFIRMED' ? 'success' :
                          booking.bookingStatus === 'PENDING' ? 'pending' :
                          booking.bookingStatus === 'CANCELLED' ? 'error' : 'default'
                        } 
                      />
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-400 dark:text-zinc-500">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center text-zinc-400 dark:text-zinc-500">
              <SeatIcon size={32} className="mx-auto mb-3 opacity-20" />
              <p>No bookings found yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
