import React from "react";
import { RefreshCw, Smartphone, Shield } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: "System dashboard",
    subtitle: "Metrics, framework distribution, and recent analyses.",
  },
  devices: {
    title: "Connected devices",
    subtitle: "Manage connected Android hardware and emulators.",
  },
  analyzer: {
    title: "Package analyzer",
    subtitle: "Pull and inspect applications from connected devices.",
  },
  inspector: {
    title: "APK inspector",
    subtitle: "Reverse-engineer and detect frameworks from APK binaries.",
  },
  batch: {
    title: "Batch analysis",
    subtitle: "Concurrently inspect multiple Android application packages.",
  },
  comparison: {
    title: "Comparison studio",
    subtitle: "Compare application architectures and dependencies side-by-side.",
  },
  explorer: {
    title: "Framework explorer",
    subtitle: "Reference signatures and heuristics for 14 runtimes.",
  },
  history: {
    title: "Analysis history",
    subtitle: "Locally saved records and exported reports.",
  },
  signatures: {
    title: "Custom signatures",
    subtitle: "Author custom patterns and native library indicators.",
  },
  settings: {
    title: "Preferences and tooling",
    subtitle: "Configure ADB, directories, concurrency, and logging.",
  },
  about: {
    title: "About StackLens",
    subtitle: "Offline application intelligence suite built with Rust.",
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
    <header className="flex h-11 items-center justify-between border-b border-[#1f1f1f] bg-[#000000] px-4 select-none">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-xs font-mono font-medium text-[#ffffff] flex items-center gap-2">
          {currentMeta.title}
        </h1>
      </div>

      {/* Quick Status Bar */}
      <div className="flex items-center gap-2">
        {/* ADB Connectivity Pill */}
        <div
          onClick={() => setCurrentPage("devices")}
          className="flex items-center gap-2 px-2 py-0.5 rounded-[2px] border border-[#1f1f1f] bg-[#070707] text-[11px] font-mono cursor-pointer hover:border-[#2a2a2a] transition-colors"
          title="Click to manage Android devices"
        >
          <Smartphone className="h-3 w-3 text-[#7a7a7a]" strokeWidth={1.5} />
          {onlineCount > 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80] animate-status-pulse" />
              <span className="text-[#ffffff]">
                {selectedDevice ? selectedDevice.model || selectedDevice.serial : `${onlineCount} online`}
              </span>
            </div>
          ) : adbAvailable ? (
            <span className="text-[#7a7a7a]">No devices</span>
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
          className="h-7 px-2 gap-1 text-[11px]"
          title="Refresh connected devices"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshingDevices ? "animate-spin" : ""}`} strokeWidth={1.5} />
          <span>Refresh</span>
        </Button>

        {/* Offline Badge */}
        <Badge variant="outline" className="text-[10px] gap-1 text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/5">
          <Shield className="h-2.5 w-2.5" strokeWidth={1.5} />
          Offline
        </Badge>
      </div>
    </header>
  );
}
