"use client";

import { cn } from "@/lib/utils";

export interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className = "",
}: SegmentedControlProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-full border border-zinc-800 bg-zinc-950 p-1",
        className,
      )}
      role="radiogroup"
      aria-label="Selection mode"
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "cursor-pointer rounded-full px-4 py-2 text-xs font-semibold transition-all",
              active
                ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                : "text-zinc-400 hover:text-white",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
