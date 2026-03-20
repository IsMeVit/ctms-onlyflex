import * as React from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./ButtonAddNew";

interface ButtonCancelProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  size?: "default" | "sm" | "lg" | "icon";
}

const ButtonCancel: React.FC<ButtonCancelProps> = ({
  children = "Cancel",
  className = "",
  size = "default",
  ...props
}) => (
  <button
    type="button"
    className={cn(
      buttonVariants({
        variant: "outline",
        size,
        className: `border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer rounded-xl font-bold ${className}`,
      })
    )}
    {...props}
  >
    {children}
  </button>
);

export default ButtonCancel;
