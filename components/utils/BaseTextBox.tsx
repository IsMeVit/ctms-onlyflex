import React from "react";

interface BaseTextBoxProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  isRequired?: boolean;
  error?: string;
}

const BaseTextBox = React.forwardRef<HTMLTextAreaElement, BaseTextBoxProps>(
  ({ label, isRequired, error, className = "", ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider">
          {label}
          {isRequired && <span className="text-red-500 mx-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={`w-full min-h-[120px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] px-4 py-3 text-zinc-900 dark:text-zinc-100 font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all resize-none ${className}`}
        {...props}
      />
      {error && (
        <span className="text-sm text-red-500 mt-1.5 block font-medium">{error}</span>
      )}
    </div>
  ),
);

BaseTextBox.displayName = "BaseTextBox";

export default BaseTextBox;
