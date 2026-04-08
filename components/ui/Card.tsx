"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-zinc-800 bg-zinc-950/85 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
