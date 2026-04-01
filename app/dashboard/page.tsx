import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome, {session.user?.name || session.user?.email}
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-indigo-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-indigo-900">Account Info</h2>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {session.user?.email}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Role:</span> {session.user?.role}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Membership:</span>{" "}
                  <span className={session.user?.membershipTier === "MEMBER" ? "text-green-600 font-medium" : ""}>
                    {session.user?.membershipTier}
                  </span>
                  {session.user?.membershipTier === "MEMBER" && (
                    <span className="text-green-600 ml-2">(30% discount active!)</span>
                  )}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900">Quick Actions</h2>
              <div className="mt-2 space-y-2">
                <a
                  href="/movies"
                  className="block text-sm text-blue-600 hover:text-blue-800"
                >
                  → Browse Movies
                </a>
                <a
                  href="/bookings"
                  className="block text-sm text-blue-600 hover:text-blue-800"
                >
                  → View My Bookings
                </a>
                <a
                  href="/watchlist"
                  className="block text-sm text-blue-600 hover:text-blue-800"
                >
                  → My Watchlist
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Bookings</h2>
            <p className="text-gray-500 italic">
              No bookings yet. Start by browsing movies and booking tickets!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
