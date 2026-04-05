"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar, 
  Building2,
  Film,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Download
} from "lucide-react";

type DateRange = "today" | "week" | "month" | "year" | "all";

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalBookings: number;
    cancelledBookings: number;
    cancellationRate: number;
    occupancyRate: number;
    totalCapacity: number;
    newUsers: number;
  };
  revenueByHall: Record<string, number>;
  topMovies: Array<{
    id: string;
    title: string;
    revenue: number;
    bookings: number;
  }>;
  revenueByDay: Array<{ date: string; revenue: number }>;
  bookingsByDay: Array<{ date: string; count: number }>;
  peakHours: Array<{ hour: number; count: number }>;
  range: {
    start: string;
    end: string;
  };
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<DateRange>("month");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/admin/analytics?range=${range}`);
        const result = await response.json();
        
        if (response.ok) {
          setData(result);
        } else {
          setError(result.error || "Failed to fetch analytics");
        }
      } catch {
        setError("Failed to fetch analytics");
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [range]);

  const formatCurrency = (amount: number | unknown) => {
    const num = typeof amount === "number" ? amount : 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const maxRevenue = useMemo(() => {
    if (!data?.revenueByDay.length) return 100;
    return Math.max(...data.revenueByDay.map((d) => d.revenue), 100);
  }, [data]);

  const maxBookings = useMemo(() => {
    if (!data?.bookingsByDay.length) return 10;
    return Math.max(...data.bookingsByDay.map((d) => d.count), 10);
  }, [data]);

  const maxHallRevenue = useMemo(() => {
    if (!data?.revenueByHall) return 100;
    return Math.max(...Object.values(data.revenueByHall), 100);
  }, [data]);

  const exportToCSV = () => {
    if (!data) return;

    const rangeLabel = range;
    const timestamp = new Date().toISOString().split("T")[0];
    let csvContent = "";

    // Summary Section
    csvContent += "=== SUMMARY ===\n";
    csvContent += `Total Revenue,${data.summary.totalRevenue}\n`;
    csvContent += `Total Bookings,${data.summary.totalBookings}\n`;
    csvContent += `Cancelled Bookings,${data.summary.cancelledBookings}\n`;
    csvContent += `Cancellation Rate,${data.summary.cancellationRate}%\n`;
    csvContent += `Occupancy Rate,${data.summary.occupancyRate}%\n`;
    csvContent += `Total Capacity,${data.summary.totalCapacity}\n`;
    csvContent += `New Users,${data.summary.newUsers}\n`;
    csvContent += "\n";

    // Revenue by Day
    csvContent += "=== REVENUE BY DAY ===\n";
    csvContent += "Date,Revenue\n";
    data.revenueByDay.forEach((item) => {
      csvContent += `${item.date},${item.revenue}\n`;
    });
    csvContent += "\n";

    // Bookings by Day
    csvContent += "=== BOOKINGS BY DAY ===\n";
    csvContent += "Date,Bookings\n";
    data.bookingsByDay.forEach((item) => {
      csvContent += `${item.date},${item.count}\n`;
    });
    csvContent += "\n";

    // Revenue by Hall
    csvContent += "=== REVENUE BY HALL ===\n";
    csvContent += "Hall,Revenue\n";
    Object.entries(data.revenueByHall).forEach(([hall, revenue]) => {
      csvContent += `${hall},${revenue}\n`;
    });
    csvContent += "\n";

    // Top Movies
    csvContent += "=== TOP MOVIES ===\n";
    csvContent += "Rank,Title,Revenue,Bookings\n";
    data.topMovies.forEach((movie, idx) => {
      csvContent += `${idx + 1},"${movie.title}",${movie.revenue},${movie.bookings}\n`;
    });
    csvContent += "\n";

    // Peak Hours
    csvContent += "=== PEAK HOURS ===\n";
    csvContent += "Hour,Bookings\n";
    data.peakHours.forEach((peak) => {
      csvContent += `${peak.hour}:00 - ${peak.hour + 1}:00,${peak.count}\n`;
    });

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `analytics-${rangeLabel}-${timestamp}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const rangeOptions: Array<{ value: DateRange; label: string }> = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
    { value: "all", label: "All Time" },
  ];

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 rounded-r-xl">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Analytics</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Track performance and insights.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Export Button */}
          <button
            onClick={exportToCSV}
            disabled={!data || loading}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          
          {/* Date Range Selector */}
          <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            {rangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setRange(option.value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  range === option.value
                    ? "bg-white dark:bg-zinc-700 text-red-600 dark:text-red-400 shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(data?.summary.totalRevenue || 0)}
          icon={DollarSign}
          trend="+12%"
          trendUp={true}
          color="emerald"
        />
        <StatsCard
          title="Total Bookings"
          value={data?.summary.totalBookings || 0}
          icon={Calendar}
          trend="+8%"
          trendUp={true}
          color="blue"
        />
        <StatsCard
          title="Occupancy Rate"
          value={`${data?.summary.occupancyRate || 0}%`}
          icon={TrendingUp}
          trend={`${data?.summary.occupancyRate || 0}%`}
          trendUp={(data?.summary.occupancyRate || 0) > 50}
          color="amber"
        />
        <StatsCard
          title="New Users"
          value={data?.summary.newUsers || 0}
          icon={Users}
          trend="+15%"
          trendUp={true}
          color="purple"
        />
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Cancellation Rate</span>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{data?.summary.cancellationRate || 0}%</p>
          <p className="text-xs text-zinc-500 mt-1">{data?.summary.cancelledBookings || 0} cancelled bookings</p>
        </div>

        <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Capacity</span>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{data?.summary.totalCapacity || 0}</p>
          <p className="text-xs text-zinc-500 mt-1">seats across all halls</p>
        </div>

        <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Peak Hour</span>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {data?.peakHours?.[0] ? `${data.peakHours[0].hour}:00` : "--:--"}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {data?.peakHours?.[0]?.count || 0} bookings during peak
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-6">Revenue Trend</h3>
          <div className="h-48 flex items-end gap-1">
            {data?.revenueByDay.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-emerald-500 dark:bg-emerald-600 rounded-t transition-all hover:bg-emerald-600 dark:hover:bg-emerald-500"
                  style={{ height: `${(item.revenue / maxRevenue) * 100}%`, minHeight: item.revenue > 0 ? "4px" : "0" }}
                  title={`${formatDate(item.date)}: ${formatCurrency(item.revenue)}`}
                />
              </div>
            ))}
          </div>
          {data?.revenueByDay.length === 0 && (
            <p className="text-center text-zinc-400 text-sm py-8">No revenue data for this period</p>
          )}
        </div>

        {/* Bookings Chart */}
        <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-6">Bookings Trend</h3>
          <div className="h-48 flex items-end gap-1">
            {data?.bookingsByDay.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-blue-500 dark:bg-blue-600 rounded-t transition-all hover:bg-blue-600 dark:hover:bg-blue-500"
                  style={{ height: `${(item.count / maxBookings) * 100}%`, minHeight: item.count > 0 ? "4px" : "0" }}
                  title={`${formatDate(item.date)}: ${item.count} bookings`}
                />
              </div>
            ))}
          </div>
          {data?.bookingsByDay.length === 0 && (
            <p className="text-center text-zinc-400 text-sm py-8">No booking data for this period</p>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Hall */}
        <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-6">Revenue by Hall</h3>
          <div className="space-y-4">
            {Object.entries(data?.revenueByHall || {}).length > 0 ? (
              Object.entries(data?.revenueByHall || {})
                .sort(([, a], [, b]) => b - a)
                .map(([hallName, revenue]) => (
                  <div key={hallName} className="flex items-center gap-4">
                    <span className="w-24 text-sm font-medium text-zinc-600 dark:text-zinc-400 truncate">{hallName}</span>
                    <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                        style={{ width: `${(revenue / maxHallRevenue) * 100}%` }}
                      />
                    </div>
                    <span className="w-20 text-sm font-bold text-zinc-900 dark:text-zinc-100 text-right">{formatCurrency(revenue)}</span>
                  </div>
                ))
            ) : (
              <p className="text-center text-zinc-400 text-sm py-8">No hall data available</p>
            )}
          </div>
        </div>

        {/* Top Movies */}
        <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-6">Top Movies by Revenue</h3>
          <div className="space-y-4">
            {data?.topMovies && data.topMovies.length > 0 ? (
              data.topMovies.slice(0, 5).map((movie, idx) => (
                <div key={movie.id} className="flex items-center gap-4">
                  <span className="w-6 h-6 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-bold text-zinc-500">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{movie.title}</p>
                    <p className="text-xs text-zinc-500">{movie.bookings} bookings</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(movie.revenue)}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-zinc-400 text-sm py-8">No movie data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Peak Hours Analysis */}
      <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-6">Peak Hours Analysis</h3>
        <div className="flex gap-2 flex-wrap">
          {data?.peakHours && data.peakHours.length > 0 ? (
            data.peakHours.map((peak, idx) => (
              <div
                key={idx}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center gap-2"
              >
                <Clock className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {peak.hour}:00 - {peak.hour + 1}:00
                </span>
                <span className="text-xs text-zinc-500">({peak.count} bookings)</span>
              </div>
            ))
          ) : (
            <p className="text-center text-zinc-400 text-sm py-4">No peak hour data available</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendUp?: boolean;
  color?: "emerald" | "blue" | "amber" | "purple";
}) {
  const colorClasses = {
    emerald: "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    blue: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    amber: "bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
    purple: "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
  };

  const iconBgClass = colorClasses[color || "blue"];

  return (
    <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${iconBgClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">{title}</p>
    </div>
  );
}
