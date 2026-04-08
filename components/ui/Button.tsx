"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-500 cursor-pointer",
        secondary:
          "border border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 cursor-pointer",
        ghost:
          "text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer",
        outline:
          "border border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800 cursor-pointer",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonIcon = React.ComponentType<{ className?: string }>;

function Button({
  className,
  variant,
  size,
  asChild = false,
  icon: Icon,
  iconClassName,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    icon?: ButtonIcon;
    iconClassName?: string;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {Icon ? <Icon className={cn("size-4", iconClassName)} /> : null}
      {children}
    </Comp>
  );
}

export { Button, buttonVariants };
