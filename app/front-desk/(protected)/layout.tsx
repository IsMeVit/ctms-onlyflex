import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import Link from "next/link";
import Background from "@/components/layout/Background";

interface FrontDeskLayoutProps {
  children: ReactNode;
}

export default async function FrontDeskLayout({
  children,
}: FrontDeskLayoutProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== "FRONT_DESK") {
    redirect("/front-desk/login");
  }

  return (
    <div className="min-h-screen relative">
      <Background />
      <div className="relative z-10 min-h-screen bg-black/20">
        <header className="bg-black/40 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <h1 className="text-xl font-bold text-white tracking-wider">
                  FRONT DESK
                </h1>
                <nav className="flex space-x-1">
                  <Link
                    href="/front-desk"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/front-desk/bookings"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
                  >
                    Bookings
                  </Link>
                  <Link
                    href="/front-desk/schedule"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
                  >
                    Schedule
                  </Link>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-white/70">
                  {session.user.name || session.user.email}
                </span>
                <form action={async () => {
                  "use server";
                  const { signOut } = await import("@/auth");
                  await signOut({ redirect: true, redirectTo: "/front-desk/login" });
                }}>
                  <button
                    type="submit"
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
