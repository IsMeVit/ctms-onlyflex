import type { ReactNode } from "react";

export default async function ProtectedCustomerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
