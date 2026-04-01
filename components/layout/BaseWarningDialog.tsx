"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

type BaseWarningDialogProps = {
  open?: boolean;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
  durationMs?: number;
};

export default function BaseWarningDialog({
  open = true,
  title = "WARNING",
  message,
  onClose,
  className = "",
  durationMs = 3000,
}: BaseWarningDialogProps) {
  const [visible, setVisible] = useState(open);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    setVisible(open);

    if (!open) {
      return;
    }

    setAnimationKey((current) => current + 1);

    const timeoutId = window.setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, durationMs);

    return () => window.clearTimeout(timeoutId);
  }, [durationMs, message, onClose, open, title]);

  if (!open || !visible) {
    return null;
  }

  return (
    <div
      className={`fixed left-1/2 top-5 z-[100] flex w-[min(92vw,38rem)] -translate-x-1/2 items-center gap-4 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-white shadow-[0_12px_32px_rgba(0,0,0,0.28)] ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400">
        <AlertTriangle className="h-5 w-5 text-white" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold tracking-wide text-amber-400">{title}</p>
        <p className="text-sm text-zinc-300">{message}</p>
      </div>

      {onClose ? (
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            onClose?.();
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          aria-label="Close warning dialog"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 h-1 bg-zinc-800">
        <div
          key={animationKey}
          className="h-full w-full origin-right bg-amber-400"
          style={{
            animation: `warning-dialog-timer ${durationMs}ms linear forwards`,
          }}
        />
      </div>

      <style jsx>{`
        @keyframes warning-dialog-timer {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </div>
  );
}
