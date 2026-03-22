"use client";

import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Award, 
  Calendar, 
  Star,
  Loader2,
  AlertTriangle,
  History,
  TrendingUp,
  Settings,
  Trash2
} from "lucide-react";
import { SeatIcon } from "@/components/seats/SeatSVG";
import { useEffect, useState, useCallback } from "react";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";

interface UserDetailsProps {
  userId: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function UserDetails({ userId, onClose, onUpdate }: UserDetailsProps) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        setError("Failed to fetch user details");
      }
    } catch (err) {
      setError("An error occurred while fetching details");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleUpdateUser = async (data: any) => {
    if (!userId) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        fetchUser();
        onUpdate();
      } else {
        const resData = await response.json();
        alert(resData.error || "Failed to update user");
      }
    } catch (err) {
      alert("An error occurred while updating");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
     if (!userId || !confirm("Are you sure? This is permanent.")) return;
     try {
        const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
        if (response.ok) {
           onUpdate();
           onClose();
        } else {
           const data = await response.json();
           alert(data.error || "Failed to delete user");
        }
     } catch {
        alert("An error occurred");
     }
  };

  if (!userId) return null;

  return (
    <div className={`fixed inset-y-0 right-0 w-full max-w-xl bg-white dark:bg-[#09090b] shadow-2xl z-[60] transform transition-transform duration-500 ease-in-out border-l border-zinc-200 dark:border-zinc-800 ${userId ? "translate-x-0" : "translate-x-full"}`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400">
                <User className="w-6 h-6" />
             </div>
             <div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">{user?.name || "User Details"}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">ID: {userId.slice(-12).toUpperCase()}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 dark:text-zinc-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
              <Loader2 className="w-10 h-10 animate-spin text-red-500" />
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Loading User Profile...</p>
            </div>
          ) : error ? (
            <div className="p-8 bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/30 rounded-[32px] text-center">
               <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
               <p className="text-red-700 dark:text-red-400 font-bold">{error}</p>
            </div>
          ) : user ? (
            <>
              {/* Profile Summary */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Membership</p>
                    <div className="flex items-center gap-2">
                       <Award className={`w-4 h-4 ${user.membershipTier === 'MEMBER' ? 'text-emerald-500' : 'text-zinc-400'}`} />
                       <span className="text-lg font-black">{user.membershipTier}</span>
                    </div>
                 </div>
                 <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">User Role</p>
                    <div className="flex items-center gap-2">
                       <Shield className={`w-4 h-4 ${user.role === 'ADMIN' ? 'text-red-500' : 'text-blue-500'}`} />
                       <span className="text-lg font-black">{user.role}</span>
                    </div>
                 </div>
              </div>

              {/* Personal Info */}
              <section className="space-y-4">
                 <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Account Settings
                 </h4>
                 <div className="space-y-4 p-6 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-[32px] border border-zinc-100 dark:border-zinc-800">
                    <DetailField icon={Mail} label="Email Address" value={user.email} />
                    <DetailField icon={Phone} label="Phone Number" value={user.phone || "Not linked"} />
                    <DetailField icon={Calendar} label="Member Since" value={new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })} />
                 </div>
              </section>

              {/* Stats */}
              <section className="space-y-4">
                 <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Activity Overview
                 </h4>
                 <div className="grid grid-cols-2 gap-4">
                    <StatCard icon={SeatIcon} label="Total Bookings" value={user._count.bookings} />
                    <StatCard icon={Star} label="Reviews Written" value={user._count.reviews} />
                 </div>
              </section>

              {/* Management Actions */}
              <section className="space-y-4">
                 <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Administrative Controls
                 </h4>
                 <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                       <button 
                         disabled={isUpdating}
                         onClick={() => handleUpdateUser({ membershipTier: user.membershipTier === 'MEMBER' ? 'NONE' : 'MEMBER' })}
                         className={`flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                            user.membershipTier === 'MEMBER'
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                            : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                         }`}
                       >
                          {user.membershipTier === 'MEMBER' ? 'Revoke Membership' : 'Upgrade to Member'}
                       </button>
                       <button 
                         disabled={isUpdating}
                         onClick={() => handleUpdateUser({ role: user.role === 'ADMIN' ? 'USER' : 'ADMIN' })}
                         className="flex-1 h-12 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all"
                       >
                          {user.role === 'ADMIN' ? 'Demote to User' : 'Grant Admin'}
                       </button>
                    </div>
                 </div>
              </section>

              {/* Recent History */}
              {user.bookings?.length > 0 && (
                 <section className="space-y-4 pb-8">
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                       <History className="w-4 h-4" /> Recent Booking History
                    </h4>
                    <div className="space-y-3">
                       {user.bookings.map((b: any) => (
                          <div key={b.id} className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-zinc-800 rounded-xl">
                                   <SeatIcon className="w-4 h-4 text-zinc-400" />
                                </div>
                                <div>
                                   <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate max-w-[150px]">{b.showtime.movie.title}</p>
                                   <p className="text-[10px] font-bold text-zinc-400 uppercase">{new Date(b.createdAt).toLocaleDateString()}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">${Number(b.finalAmount).toFixed(2)}</p>
                                <StatusBadge status={b.bookingStatus} size="sm" />
                             </div>
                          </div>
                       ))}
                    </div>
                 </section>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-zinc-100 dark:border-zinc-800 flex gap-4 bg-zinc-50/50 dark:bg-zinc-900/50">
           <button 
             onClick={handleDeleteUser}
             className="flex-1 h-12 bg-white dark:bg-zinc-800 text-red-600 border border-red-100 dark:border-red-900/30 rounded-2xl font-black text-sm hover:bg-red-50 transition-all flex items-center justify-center gap-2"
           >
              <Trash2 className="w-4 h-4" /> Remove Account
           </button>
           <button 
             onClick={onClose}
             className="flex-1 h-12 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-black text-sm hover:opacity-90 transition-all"
           >
              Close Profile
           </button>
        </div>
      </div>
    </div>
  );
}

function DetailField({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
   return (
      <div className="flex items-start gap-4">
         <div className="p-2 bg-white dark:bg-zinc-800 rounded-xl shadow-sm">
            <Icon className="w-4 h-4 text-zinc-400" />
         </div>
         <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{value}</p>
         </div>
      </div>
   );
}

function StatCard({ icon: Icon, label, value }: { icon: any, label: string, value: number }) {
   return (
      <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[32px] space-y-2">
         <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
            <Icon className="w-5 h-5 text-zinc-400" />
         </div>
         <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-tight">{label}</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tabular-nums">{value}</p>
         </div>
      </div>
   );
}
