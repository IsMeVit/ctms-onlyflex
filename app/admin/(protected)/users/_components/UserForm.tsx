"use client";

import { useState } from "react";
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Shield, 
  Award,
  Loader2,
  AlertTriangle,
  UserPlus,
  Eye,
  EyeOff
} from "lucide-react";

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserForm({ isOpen, onClose, onSuccess }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "USER",
    membershipTier: "NONE",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "USER",
        membershipTier: "NONE",
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-50 transition-colors animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
               <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Create User Account</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Manual account provisioning</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 dark:text-zinc-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm font-bold rounded-r-xl flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              {error}
            </div>
          )}

          <div className="space-y-6">
             {/* Name Field */}
             <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                   <User className="w-3.5 h-3.5" /> Full Name <span className="text-red-500">*</span>
                </label>
                <input 
                  required
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full h-12 px-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-bold"
                />
             </div>

             {/* Email & Phone Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                     <Mail className="w-3.5 h-3.5" /> Email Address <span className="text-red-500">*</span>
                  </label>
                  <input 
                    required
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="w-full h-12 px-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                     <Phone className="w-3.5 h-3.5" /> Phone Number
                  </label>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+84 900 000 000"
                    className="w-full h-12 px-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-bold"
                  />
                </div>
             </div>

             {/* Password Field */}
             <div className="space-y-1.5 relative">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                   <Lock className="w-3.5 h-3.5" /> Account Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    required
                    type={showPassword ? "text" : "password"} 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 8 characters"
                    className="w-full h-12 px-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-bold pr-12"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
             </div>

             <hr className="border-zinc-100 dark:border-zinc-800 border-dashed" />

             {/* Role & Tier Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                     <Shield className="w-3.5 h-3.5" /> User Role
                  </label>
                  <select 
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full h-12 px-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-black uppercase text-xs tracking-widest cursor-pointer"
                  >
                    <option value="USER">Standard User</option>
                    <option value="ADMIN">System Administrator</option>
                    <option value="MANAGER">Branch Manager</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                     <Award className="w-3.5 h-3.5" /> Membership Tier
                  </label>
                  <select 
                    name="membershipTier"
                    value={formData.membershipTier}
                    onChange={handleChange}
                    className="w-full h-12 px-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-black uppercase text-xs tracking-widest cursor-pointer"
                  >
                    <option value="NONE">No Membership</option>
                    <option value="MEMBER">Active Member</option>
                  </select>
                </div>
             </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-4 pt-4">
             <button 
               type="button"
               onClick={onClose}
               className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
             >
                Discard
             </button>
             <button 
              type="submit" 
              disabled={isLoading} 
              className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {isLoading ? "Provisioning..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
