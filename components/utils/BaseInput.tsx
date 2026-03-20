import React from "react";

interface BaseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  isRequired?: boolean;
  error?: string;
}

const BaseInput = React.forwardRef<HTMLInputElement, BaseInputProps>(
  ({ label, isRequired, error, className = "", ...props }, ref) => (
    <div className={className}>
      {label && (
        <label className="block mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider">
          {label}
          {isRequired && <span className="text-red-500 mx-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] px-4 text-zinc-900 dark:text-zinc-100 font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-red-500 dark:focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
        {...props}
      />
      {error && (
        <span className="text-sm text-red-500 mt-1.5 block font-medium">{error}</span>
      )}
    </div>
  ),
);

BaseInput.displayName = "BaseInput";

export default BaseInput;
