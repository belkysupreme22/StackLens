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
    subtitle: "Explore runtime signatures across 14 supported frameworks.",
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
    <header className="flex h-12 items-center justify-between border-b border-[#26262a] bg-[#0a0a0b]/90 backdrop-blur-md px-5 select-none">
      {/* Page Title & Subtitle */}
      <div className="flex items-center gap-2.5">
        <h1 className="text-xs font-semibold text-[#ffffff] tracking-tight">
          {currentMeta.title}
        </h1>
        <span className="text-[#26262a] text-xs">/</span>
        <span className="text-[11px] text-[#8c8b8f] font-normal truncate max-w-md hidden sm:inline">
          {currentMeta.subtitle}
        </span>
      </div>

      {/* Quick Status Bar */}
      <div className="flex items-center gap-2.5">
        {/* ADB Connectivity Pill */}
        <div
          onClick={() => setCurrentPage("devices")}
          className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-[#26262a] bg-[#131315] text-[11px] font-medium cursor-pointer hover:border-[#333338] hover:bg-[#18181b] transition-all"
          title="Click to manage Android devices"
        >
          <Smartphone className="h-3 w-3 text-[#8c8b8f]" strokeWidth={1.5} />
          {onlineCount > 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#47ab61] animate-pulse" />
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
          className="h-7 px-2.5 gap-1 text-[11px] rounded-full border-[#26262a] hover:bg-[#18181b]"
          title="Refresh connected devices"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshingDevices ? "animate-spin" : ""}`} strokeWidth={1.5} />
          <span>Refresh</span>
        </Button>

        {/* Offline Badge */}
        <Badge variant="outline" className="text-[10px] gap-1 text-[#47ab61] border-[#47ab61]/30 bg-[#47ab61]/10 rounded-full px-2.5 py-0.5">
          <Shield className="h-2.5 w-2.5" strokeWidth={1.5} />
          Offline
        </Badge>
      </div>
    </header>
  );
}
