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
        variant: undefined,
        size,
        className: `bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition-colors cursor-pointer ${className}`,
      })
    )}
    {...props}
  >
    {children}
  </button>
);

export default ButtonCancel;
