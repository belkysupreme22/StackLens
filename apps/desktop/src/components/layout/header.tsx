import React from "react";
import { RefreshCw, Smartphone, Shield } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: "System dashboard",
    subtitle: "At-a-glance framework metrics, recent analyses, and inspection distribution",
  },
  devices: {
    title: "Connected devices",
    subtitle: "Manage Android hardware and emulators via Android Debug Bridge",
  },
  analyzer: {
    title: "Package analyzer",
    subtitle: "Inspect installed applications from connected Android devices",
  },
  inspector: {
    title: "APK inspector",
    subtitle: "Direct local APK file reverse engineering, structure, and framework detection",
  },
  batch: {
    title: "Batch analysis",
    subtitle: "Simultaneous automated inspection of multiple Android application packages",
  },
  comparison: {
    title: "Comparison studio",
    subtitle: "Side-by-side structural, dependency, and framework diff analysis",
  },
  explorer: {
    title: "Framework explorer",
    subtitle: "Comprehensive knowledge base of runtime signatures, indicators, and architectures",
  },
  history: {
    title: "Analysis history",
    subtitle: "Local record of previous analyses, detections, and exported reports",
  },
  signatures: {
    title: "Custom signatures",
    subtitle: "Manage, create, and calibrate framework detection rules and patterns",
  },
  settings: {
    title: "Preferences and tooling",
    subtitle: "Configure ADB paths, storage locations, external tools, and engine limits",
  },
  about: {
    title: "About StackLens",
    subtitle: "Application intelligence platform information and license details",
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
