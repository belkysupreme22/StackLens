import React, { useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { FullscreenPullLoader } from "@/components/device/fullscreen-pull-loader";
import { useAppStore } from "@/stores/app-store";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { refreshDevices, loadDashboardStats, loadSettings } = useAppStore();

  useEffect(() => {
    refreshDevices();
    loadDashboardStats();
    loadSettings();

    // Automatically detect when devices are plugged in or unplugged over USB
    const watcher = setInterval(() => {
      refreshDevices(true);
    }, 1500);

    return () => clearInterval(watcher);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0b] text-[#ffffff] font-sans antialiased">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0a0a0b]">
          <div className="mx-auto max-w-[1400px] w-full">
            {children}
          </div>
        </main>
      </div>
      {/* Immersive Fullscreen Pull & Analyze Loader */}
      <FullscreenPullLoader />
    </div>
  );
}
