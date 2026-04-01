import * as React from "react";
import { cn } from "@/lib/utils";
import { buttonRedVariants } from "./ButtonRed";

interface ButtonGrayProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  size?: "default" | "sm" | "lg" | "xl" | "2xl" | "icon";
}

const ButtonGray: React.FC<ButtonGrayProps> = ({
  children = "Cancel",
  className = "",
  size = "default",
  ...props
}) => (
  <button
    type="button"
    className={cn(
      buttonRedVariants({
        variant: undefined,
        size,
        className: `bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition-colors cursor-pointer ${className}`,
      }),
    )}
    {...props}
  >
    {children}
  </button>
);

export default ButtonGray;
