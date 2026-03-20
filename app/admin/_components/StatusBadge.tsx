import React from "react";

const variants = {
  success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  error: "bg-red-500/10 text-red-500 border-red-500/20",
  default: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

const sizes = {
  sm: "px-1.5 py-0.5 text-[8px] font-black tracking-widest uppercase",
  md: "px-2.5 py-1 text-[10px] font-black tracking-widest uppercase",
};

interface StatusBadgeProps {
  status: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export function StatusBadge({ status, variant = "default", size = "md" }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border transition-all ${variants[variant]} ${sizes[size]}`}>
      {status}
    </span>
  );
}
