import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  label?: string;
  isRequired?: boolean;
}

export function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Select option",
  className = "",
  label,
  isRequired,
}: CustomDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || placeholder;

  return (
    <div className={`relative flex-1 ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider">
          {label}
          {isRequired && <span className="text-red-500 mx-1">*</span>}
        </label>
      )}
      <button
        className="h-12 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] px-4 text-sm text-zinc-900 dark:text-zinc-100 text-left focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all flex items-center justify-between outline-none"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span className={value ? "text-zinc-900 dark:text-zinc-100 font-medium" : "text-zinc-400 dark:text-zinc-600"}>
          {selectedLabel}
        </span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => (
            <li
              key={opt.value}
              className={`px-4 py-2.5 text-sm cursor-pointer rounded-lg transition-colors mb-0.5 ${
                value === opt.value
                  ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold"
                  : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </li>
          ))}
          {options.length === 0 && (
            <li className="px-4 py-3 text-sm text-zinc-400 italic text-center">No options available</li>
          )}
        </ul>
      )}
    </div>
  );
}
