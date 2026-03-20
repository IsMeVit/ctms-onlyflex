import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string; // e.g., "+12.5%"
  trendUp?: boolean;
  link?: {
    href: string;
    label: string;
  }
}

export function StatsCard({ title, value, icon: Icon, trend, trendUp, link }: StatsCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] p-6 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm">
      <div className="absolute inset-0 bg-linear-to-br from-red-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{value}</h3>
          {trend && (
             <p className={`mt-2 text-xs font-medium ${trendUp ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
               {trend} <span className="text-zinc-400 dark:text-zinc-500">from last month</span>
             </p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 group-hover:text-red-500 group-hover:border-red-500/20 transition-colors">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {link && (
        <div className="mt-4 border-t border-zinc-100 dark:border-zinc-800 pt-4 relative z-10">
          <Link 
            href={link.href}
            className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-500 transition-colors flex items-center gap-1"
          >
            {link.label} &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}

