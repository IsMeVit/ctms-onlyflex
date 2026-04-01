import type { ReactNode } from "react";
import { CustomerRouteHeader } from "@/components/layout/CustomerRouteHeader";
import { CustomerFooter } from "@/components/layout/CustomerFooter";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <CustomerRouteHeader />
      {children}
      <CustomerFooter />
    </div>
  );
}
