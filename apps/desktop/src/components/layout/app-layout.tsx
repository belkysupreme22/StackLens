import React, { useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useAppStore } from "@/stores/app-store";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { refreshDevices, loadDashboardStats, loadSettings } = useAppStore();

  useEffect(() => {
    refreshDevices();
    loadDashboardStats();
    loadSettings();
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#000000] text-[#ffffff] font-sans antialiased">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#000000]">
          {children}
        </main>
      </div>
    </div>
  );
}
