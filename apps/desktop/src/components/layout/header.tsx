import React from "react";
import { RefreshCw, Smartphone, Shield } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: "System dashboard",
    subtitle: "Track framework distribution and recent application inspections.",
  },
  devices: {
    title: "Connected devices",
    subtitle: "Manage your connected Android hardware and running emulators.",
  },
  analyzer: {
    title: "Package analyzer",
    subtitle: "Pull and inspect applications directly from your device.",
  },
  inspector: {
    title: "APK inspector",
    subtitle: "Drop any APK file to inspect its stack.",
  },
  batch: {
    title: "Batch analysis",
    subtitle: "Inspect multiple Android application packages at once.",
  },
  comparison: {
    title: "Comparison studio",
    subtitle: "Compare application stacks and dependencies side by side.",
  },
  explorer: {
    title: "Framework explorer",
    subtitle: "Explore runtime signatures across supported Android frameworks.",
  },
  history: {
    title: "Analysis history",
    subtitle: "Review your saved inspection records and exported reports.",
  },
  signatures: {
    title: "Custom signatures",
    subtitle: "Create custom patterns to detect your own frameworks.",
  },
  settings: {
    title: "Settings",
    subtitle: "Configure your local ADB bridge, storage, and concurrency.",
  },
  about: {
    title: "About StackLens",
    subtitle: "Local Android application intelligence built with Rust.",
  },
};

export function Header() {
  const {
    currentPage,
    adbAvailable,
    devices,
    selectedDeviceSerial,
    refreshDevices,
    isRefreshingDevices,
    setCurrentPage,
  } = useAppStore();

  const currentMeta = pageTitles[currentPage] || {
    title: "StackLens",
    subtitle: "Android Application Intelligence",
  };

  const selectedDevice = devices.find((d) => d.serial === selectedDeviceSerial);
  const onlineCount = devices.filter((d) => d.state === "Online").length;

  return (
    <header className="flex h-14 items-center justify-between border-b border-[#26262a] bg-[#0a0a0b]/90 backdrop-blur-md px-6 select-none shrink-0">
      {/* Page Title & Subtitle */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-[#ffffff] tracking-tight">
          {currentMeta.title}
        </h1>
        <span className="text-[#333338] text-xs">/</span>
        <span className="text-xs text-[#8c8b8f] font-normal truncate max-w-lg hidden sm:inline">
          {currentMeta.subtitle}
        </span>
      </div>

      {/* Quick Status Bar */}
      <div className="flex items-center gap-3">
        {/* ADB Connectivity Pill */}
        <div
          onClick={() => setCurrentPage("devices")}
          className="flex h-8 items-center gap-2 px-3.5 rounded-full border border-[#26262a] bg-[#131315] text-xs font-medium cursor-pointer hover:border-[#333338] hover:bg-[#18181b] transition-all"
          title="Click to manage Android devices"
        >
          <Smartphone className="h-3.5 w-3.5 text-[#8c8b8f]" strokeWidth={1.5} />
          {onlineCount > 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#47ab61] animate-pulse" />
              <span className="text-[#ffffff]">
                {selectedDevice ? selectedDevice.model || selectedDevice.serial : `${onlineCount} online`}
              </span>
            </div>
          ) : adbAvailable ? (
            <span className="text-[#8c8b8f]">No devices</span>
          ) : (
            <span className="text-rose-400">ADB offline</span>
          )}
        </div>

        {/* Refresh Devices Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshDevices()}
          disabled={isRefreshingDevices}
          className="h-8 px-3.5 gap-1.5 text-xs font-medium rounded-full border-[#26262a] bg-[#131315] hover:bg-[#18181b] hover:border-[#333338]"
          title="Refresh connected devices"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingDevices ? "animate-spin" : ""}`} strokeWidth={1.5} />
          <span>Refresh</span>
        </Button>

        {/* Offline Badge */}
        <div className="flex h-8 items-center gap-1.5 text-xs text-[#47ab61] border border-[#47ab61]/30 bg-[#47ab61]/10 rounded-full px-3 font-medium">
          <Shield className="h-3 w-3" strokeWidth={1.5} />
          <span>Offline</span>
        </div>
      </div>
    </header>
  );
}
