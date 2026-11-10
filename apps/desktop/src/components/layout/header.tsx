import React from "react";
import { RefreshCw, Smartphone, Shield, HelpCircle } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: "System Dashboard",
    subtitle: "At-a-glance framework metrics, recent analyses, and inspection distribution",
  },
  devices: {
    title: "Connected Devices",
    subtitle: "Manage Android hardware and emulators via Android Debug Bridge",
  },
  analyzer: {
    title: "Package Analyzer",
    subtitle: "Inspect installed applications from connected Android devices",
  },
  inspector: {
    title: "APK Inspector",
    subtitle: "Direct local APK file reverse engineering, structure, and framework detection",
  },
  batch: {
    title: "Batch Analysis",
    subtitle: "Simultaneous automated inspection of multiple Android application packages",
  },
  comparison: {
    title: "Comparison Studio",
    subtitle: "Side-by-side structural, dependency, and framework diff analysis",
  },
  explorer: {
    title: "Framework Explorer",
    subtitle: "Comprehensive knowledge base of runtime signatures, indicators, and architectures",
  },
  history: {
    title: "Analysis History",
    subtitle: "Local record of previous analyses, detections, and exported reports",
  },
  signatures: {
    title: "Custom Signatures",
    subtitle: "Manage, create, and calibrate framework detection rules and patterns",
  },
  settings: {
    title: "Preferences & Tooling",
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
    <header className="flex h-14 items-center justify-between border-b border-neutral-800 bg-neutral-950/80 px-6 backdrop-blur-md select-none">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
          {currentMeta.title}
        </h1>
        <p className="text-[11px] text-neutral-400 truncate max-w-xl">
          {currentMeta.subtitle}
        </p>
      </div>

      {/* Quick Status Bar */}
      <div className="flex items-center gap-3">
        {/* ADB Connectivity Pill */}
        <div
          onClick={() => setCurrentPage("devices")}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-neutral-800 bg-neutral-900/60 text-xs cursor-pointer hover:bg-neutral-800 transition-colors"
          title="Click to manage Android devices"
        >
          <Smartphone className="h-3.5 w-3.5 text-neutral-400" />
          {onlineCount > 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-neutral-200 font-mono text-[11px]">
                {selectedDevice ? selectedDevice.model || selectedDevice.serial : `${onlineCount} Online`}
              </span>
            </div>
          ) : adbAvailable ? (
            <span className="text-neutral-400 text-[11px]">No devices</span>
          ) : (
            <span className="text-rose-400 text-[11px]">ADB Offline</span>
          )}
        </div>

        {/* Refresh Devices Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshDevices()}
          disabled={isRefreshingDevices}
          className="h-8 gap-1.5 text-xs border-neutral-800 hover:bg-neutral-800"
          title="Refresh connected devices"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshingDevices ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>

        {/* Privacy Indicator */}
        <Badge variant="outline" className="text-[10px] gap-1 text-emerald-400 border-emerald-900/40 bg-emerald-950/20">
          <Shield className="h-2.5 w-2.5" />
          Offline
        </Badge>
      </div>
    </header>
  );
}
