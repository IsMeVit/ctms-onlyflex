// Copied from CTMS-Project/components/ui/Toast.tsx
"use client";

import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: Toast["type"], message: string, duration?: number) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (type: Toast["type"], message: string, duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const timerMap = new Map<string, ReturnType<typeof setTimeout>>();

    toasts.forEach((toast) => {
      if (toast.duration && !timerMap.has(toast.id)) {
        const timer = setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration);
        timerMap.set(toast.id, timer);
      }
    });

    return () => {
      timerMap.forEach((timer) => clearTimeout(timer));
      timerMap.clear();
    };
  }, [toasts]);

  const getToastStyles = (type: Toast["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-600/90 border-green-500 text-white";
      case "error":
        return "bg-red-600/90 border-red-500 text-white";
      case "info":
        return "bg-blue-600/90 border-blue-500 text-white";
      case "warning":
        return "bg-yellow-600/90 border-yellow-500 text-white";
      default:
        return "bg-gray-800/90 border-gray-700 text-white";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-6 py-4 rounded-xl border shadow-lg ${getToastStyles(toast.type)}`}
          >
            {toast.type === "success" && <CheckCircle className="text-green-300" size={24} />}
            {toast.type === "error" && <AlertCircle className="text-red-300" size={24} />}
            {toast.type === "info" && <Info className="text-blue-300" size={24} />}
            {toast.type === "warning" && <AlertTriangle className="text-yellow-300" size={24} />}
            <span className="flex-1 font-medium">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="ml-2">
              <X size={20} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
