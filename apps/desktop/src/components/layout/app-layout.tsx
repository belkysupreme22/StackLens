import React, { useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useAppStore } from "@/stores/app-store";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { refreshDevices, loadDashboardStats, loadSettings } = useAppStore();

  useEffect(() => {
    // Initial startup data loading
    refreshDevices();
    loadDashboardStats();
    loadSettings();
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans antialiased">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900/40">
          {children}
        </main>
      </div>
    </div>
  );
}
