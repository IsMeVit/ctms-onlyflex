"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerClassName,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || props.name;

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label ? (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-zinc-300"
          >
            {label}
          </label>
        ) : null}
        <div className="relative">
          {leftIcon ? (
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-zinc-500">
              {leftIcon}
            </div>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20",
              leftIcon ? "pl-12" : "",
              rightIcon ? "pr-12" : "",
              className,
            )}
            {...props}
          />
          {rightIcon ? (
            <div className="absolute inset-y-0 right-4 flex items-center text-zinc-500">
              {rightIcon}
            </div>
          ) : null}
        </div>
        {helperText ? (
          <p className="text-xs text-zinc-500">{helperText}</p>
        ) : null}
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
