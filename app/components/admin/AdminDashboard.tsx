import React from "react";

interface AdminDashboardProps {
  onExitAdmin: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExitAdmin }) => (
  <div>
    <h1>Admin Dashboard</h1>
    <button onClick={onExitAdmin}>Exit Admin Mode</button>
    {/* Add your admin dashboard UI here */}
  </div>
);