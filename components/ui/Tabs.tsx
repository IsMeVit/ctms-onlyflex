"use client";

import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ items, value, onChange, className = "" }: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Authentication tabs"
      className={cn("flex items-center gap-8 border-b border-zinc-800", className)}
    >
      {items.map((item) => {
        const active = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "cursor-pointer relative pb-4 text-sm font-medium transition-colors",
              active ? "text-red-500" : "text-zinc-500 hover:text-zinc-200",
            )}
          >
            {item.label}
            <span
              className={cn(
                "absolute inset-x-0 -bottom-px h-0.5 rounded-full transition-all",
                active ? "bg-red-500" : "bg-transparent",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
