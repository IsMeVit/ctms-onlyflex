import { Suspense } from "react";

<<<<<<< HEAD
export default function DashboardPage() {
=======
function DashboardContent() {
>>>>>>> e5e1fb5 (fix: resolve build errors from customer merge)
  return (
    <div className="min-h-screen bg-black text-white pt-28">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
        <p className="text-zinc-400">Welcome to your customer dashboard.</p>
      </div>
    </div>
  );
}
<<<<<<< HEAD
=======

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white pt-28">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
>>>>>>> e5e1fb5 (fix: resolve build errors from customer merge)
