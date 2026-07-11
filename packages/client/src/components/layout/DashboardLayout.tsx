import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useSocketEvents } from "@/hooks/useSocketEvents";

export function DashboardLayout() {
  useSocketEvents();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-surface-dark">
      <Sidebar />
      <main className="flex flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
