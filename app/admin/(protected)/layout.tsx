import { auth } from "@/auth";
import { redirect } from "next/navigation";
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

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#030712]">
      <Sidebar />
      <main className="flex-1">
        <Header title="Dashboard" />
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
