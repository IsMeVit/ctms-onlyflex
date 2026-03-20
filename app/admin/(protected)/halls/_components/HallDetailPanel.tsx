"use client";

import { 
  Edit, 
  Trash2, 
  Power, 
  Monitor, 
  Users, 
  LayoutGrid, 
  Calendar,
  ChevronLeft,
  Settings2,
  Info,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";

interface Hall {
  id: string;
  name: string;
  hallType: string;
  screenType: string;
  capacity: number;
  rows: number;
  columns: number;
  isActive: boolean;
  createdAt: string;
  _count: {
    showtimes: number;
    seats: number;
  };
}

interface HallDetailPanelProps {
  hall: Hall | null;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  isUpdating: boolean;
  isMobile?: boolean;
  onBackToList?: () => void;
}

export default function HallDetailPanel({
  hall,
  onEdit,
  onDelete,
  onToggleStatus,
  isUpdating,
  isMobile = false,
  onBackToList,
}: HallDetailPanelProps) {
  if (!hall) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#09090b]">
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-3xl mb-4">
           <Building2Icon className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
        </div>
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">No Hall Selected</h3>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 max-w-xs">
          Select a hall from the list to view its configuration and management options.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#09090b] transition-colors overflow-y-auto custom-scrollbar">
      {/* Detail Header */}
      <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button
                onClick={onBackToList}
                className="p-2 -ml-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  {hall.name}
                </h2>
                <StatusBadge 
                  status={hall.isActive ? "Active" : "Inactive"} 
                  variant={hall.isActive ? "success" : "default"} 
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                   {hall.hallType}
                </span>
                <span>•</span>
                <span>Created {new Date(hall.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleStatus}
              disabled={isUpdating}
              className={`p-2.5 rounded-xl border transition-all ${
                hall.isActive
                  ? "border-zinc-200 dark:border-zinc-800 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                  : "border-zinc-200 dark:border-zinc-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              }`}
              title={hall.isActive ? "Deactivate Hall" : "Activate Hall"}
            >
              <Power className="h-5 w-5" />
            </button>
            <button
              onClick={onEdit}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
              title="Edit Configuration"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button
              onClick={onDelete}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
              title="Delete Hall"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Content */}
      <div className="p-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <DetailStatCard 
            icon={Monitor} 
            label="Screen Type" 
            value={hall.screenType.replace("_", " ")} 
            color="indigo" 
          />
          <DetailStatCard 
            icon={Users} 
            label="Total Capacity" 
            value={`${hall.capacity || hall._count.seats} Seats`} 
            color="emerald" 
          />
          <DetailStatCard 
            icon={Calendar} 
            label="Active Showtimes" 
            value={hall._count.showtimes} 
            color="rose" 
          />
        </div>

        {/* Grid Config Info */}
        <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings2 className="h-5 w-5 text-zinc-400" />
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Grid Configuration</h3>
          </div>
          <div className="grid grid-cols-2 gap-8">
             <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Rows</p>
                <div className="flex items-end gap-1">
                   <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{hall.rows}</span>
                   <span className="text-sm text-zinc-500 mb-1 font-medium">A to {String.fromCharCode(64 + hall.rows)}</span>
                </div>
             </div>
             <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Columns</p>
                <div className="flex items-end gap-1">
                   <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{hall.columns}</span>
                   <span className="text-sm text-zinc-500 mb-1 font-medium">1 to {hall.columns}</span>
                </div>
             </div>
          </div>
        </div>

        {/* Action Links */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Management Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link 
              href={`/admin/halls/preview?id=${hall.id}`}
              className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-red-500/30 hover:bg-red-50/30 dark:hover:bg-red-950/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                  <LayoutGrid className="h-5 w-5 text-zinc-500 dark:text-zinc-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                </div>
                <span className="font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">Visual Seat Editor</span>
              </div>
              <ExternalLink className="h-4 w-4 text-zinc-300 dark:text-zinc-600 group-hover:text-red-500 transition-colors" />
            </Link>

            <Link 
              href={`/admin/showtimes?hallId=${hall.id}`}
              className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-red-500/30 hover:bg-red-50/30 dark:hover:bg-red-950/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                  <Calendar className="h-5 w-5 text-zinc-500 dark:text-zinc-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                </div>
                <span className="font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">View Schedule</span>
              </div>
              <ExternalLink className="h-4 w-4 text-zinc-300 dark:text-zinc-600 group-hover:text-red-500 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Warning/Info */}
        {hall._count.showtimes > 0 && (
           <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
              <Info className="h-5 w-5 text-blue-500 shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
                This hall has active showtimes. Modifying the grid configuration or seats might affect existing bookings. Proceed with caution.
              </p>
           </div>
        )}
      </div>
    </div>
  );
}

function DetailStatCard({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: string | number, color: string }) {
  const colors: Record<string, string> = {
    indigo: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20",
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
    rose: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20",
  };

  return (
    <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
      <div className={`p-2 w-fit rounded-lg mb-3 ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{label}</p>
      <p className="text-xl font-black text-zinc-900 dark:text-zinc-50 mt-0.5">{value}</p>
    </div>
  );
}

function Building2Icon({ className }: { className?: string }) {
   return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
   );
}
