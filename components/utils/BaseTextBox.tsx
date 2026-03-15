import React from "react";

interface BaseTextBoxProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  isRequired?: boolean;
  error?: string;
}

const BaseTextBox = React.forwardRef<HTMLTextAreaElement, BaseTextBoxProps>(
  ({ label, isRequired, error, className = "", ...props }, ref) => (
    <div className="mb-4">
      {label && (
        <label className="block mb-2 font-semibold text-zinc-200">
          {label}
          {isRequired && <span className="text-red-500 mx-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={`w-full h-[100px] rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 font-medium font-light placeholder:font-normal placeholder:text-zinc-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 ${className}`}
        {...props}
      />
      {error && (
        <span className="text-sm text-red-500 mt-1 block">{error}</span>
      )}
    </div>
  ),
);

BaseTextBox.displayName = "BaseTextBox";

export default BaseTextBox;
