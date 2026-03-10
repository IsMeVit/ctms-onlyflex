import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/SideBar";
import { Header } from "@/components/layout/Header";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminProtectedLayout({
  children,
}: AdminLayoutProps) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-[#030712]">
        <Header title="Dashboard" />
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
