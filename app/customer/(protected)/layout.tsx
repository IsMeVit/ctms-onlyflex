import type { ReactNode } from "react";

export const revalidate = 0;

export default async function ProtectedCustomerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
