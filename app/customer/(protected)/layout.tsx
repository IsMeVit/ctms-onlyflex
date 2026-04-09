import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";

<<<<<<< HEAD
export default function ProtectedCustomerLayout({
=======
export const revalidate = 0;

export default async function ProtectedCustomerLayout({
>>>>>>> e5e1fb5 (fix: resolve build errors from customer merge)
  children,
}: {
  children: ReactNode;
}) {
  return <ToastProvider>{children}</ToastProvider>;
}
