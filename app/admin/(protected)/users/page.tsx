"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  User,
  Mail,
  Shield,
  Award,
  Calendar,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Filter,
  Eye
} from "lucide-react";
import { SeatIcon } from "@/components/seats/SeatSVG";
import React from "react";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import { StatsCard } from "@/app/admin/_components/StatsCard";
import UserDetails from "./_components/UserDetails";
import UserForm from "./_components/UserForm";

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  membershipTier: string;
  createdAt: string;
  _count: {
    bookings: number;
  };
}

interface UsersResponse {
  users: UserItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
  });

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchQuery,
        role: roleFilter,
        tier: tierFilter,
      });

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to fetch users");
        setUsers([]);
        return;
      }

      setUsers(data.users || []);
      setPagination(data.pagination || { page: 1, limit: 10, totalCount: 0, totalPages: 1 });
    } catch {
      setError("Failed to fetch users");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchQuery, roleFilter, tierFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="space-y-8 relative pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Users Management</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Oversee customer accounts, roles and membership status.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-600/20 active:scale-95"
        >
          <UserPlus className="h-5 w-5" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Users" value={pagination.totalCount} icon={User} />
        <StatsCard title="Active Members" value={users.filter(u => u.membershipTier === 'MEMBER').length} icon={Award} />
        <StatsCard title="Administrators" value={users.filter(u => u.role === 'ADMIN').length} icon={Shield} />
        <StatsCard title="New This Month" value={5} icon={Calendar} />
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-[#09090b] p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="h-12 w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 pl-11 pr-4 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-medium"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="h-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 pr-10 text-sm font-bold text-zinc-700 dark:text-zinc-300 focus:border-red-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
            </select>

            <select
              value={tierFilter}
              onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
              className="h-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 pr-10 text-sm font-bold text-zinc-700 dark:text-zinc-300 focus:border-red-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">All Tiers</option>
              <option value="NONE">None</option>
              <option value="MEMBER">Member</option>
            </select>

            <button
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 px-5 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              <Filter className="h-4 w-4" />
              More
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Name & Identity</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Email Address</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Membership</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Role</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Bookings</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Joined Date</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {isLoading ? (
                <tr>
                  <td className="px-6 py-16 text-center" colSpan={7}>
                    <div className="flex flex-col items-center gap-3">
                       <Loader2 className="h-10 w-10 animate-spin text-red-500" />
                       <p className="font-black text-zinc-500 uppercase tracking-widest text-xs">Fetching user directory...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="px-6 py-16 text-center text-red-500 font-bold" colSpan={7}>
                    <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    {error}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="px-6 py-16 text-center text-zinc-500" colSpan={7}>
                    <div className="bg-zinc-100 dark:bg-zinc-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <User className="h-10 w-10 text-zinc-400" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">No users found</h3>
                    <p className="mt-2 font-medium">Try different search terms or filters.</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors group cursor-pointer" onClick={() => setSelectedUserId(user.id)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-red-50 dark:group-hover:bg-red-950/30 transition-colors font-black">
                            {user.name?.charAt(0) || "U"}
                         </div>
                         <div>
                            <p className="font-bold text-zinc-900 dark:text-zinc-200">
                              {user.name || "Anonymous User"}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-tighter tabular-nums">ID: {user.id.slice(-8).toUpperCase()}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-medium">
                         <Mail className="w-3.5 h-3.5" />
                         {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <Award className={`w-3.5 h-3.5 ${user.membershipTier === 'MEMBER' ? 'text-emerald-500' : 'text-zinc-300'}`} />
                          <span className={`text-xs font-black uppercase ${user.membershipTier === 'MEMBER' ? 'text-emerald-600' : 'text-zinc-400'}`}>
                             {user.membershipTier}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <StatusBadge 
                         status={user.role} 
                         variant={user.role === 'ADMIN' ? 'error' : 'default'} 
                       />
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-1.5 font-black text-zinc-900 dark:text-zinc-100 tabular-nums bg-zinc-50 dark:bg-zinc-800 w-fit px-2 py-1 rounded-lg border border-zinc-100 dark:border-zinc-700">
                          <SeatIcon size={14} className="text-zinc-400" />
                          {user._count.bookings}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 text-xs font-bold tabular-nums">
                       {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedUserId(user.id)}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                        title="View Profile"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 px-8 py-5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            Showing {users.length} of {pagination.totalCount} users
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="px-5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] text-xs font-black text-zinc-600 dark:text-zinc-400 disabled:opacity-30 hover:border-red-500 hover:text-red-600 transition-all cursor-pointer flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages || isLoading}
              className="px-5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] text-xs font-black text-zinc-600 dark:text-zinc-400 disabled:opacity-30 hover:border-red-500 hover:text-red-600 transition-all cursor-pointer flex items-center gap-2"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* User Details Drawer */}
      {selectedUserId && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] animate-in fade-in duration-300" onClick={() => setSelectedUserId(null)} />
          <UserDetails 
            userId={selectedUserId} 
            onClose={() => setSelectedUserId(null)} 
            onUpdate={fetchUsers}
          />
        </>
      )}

      {/* User Form Modal */}
      <UserForm 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
        onSuccess={fetchUsers} 
      />
    </div>
  );
}
