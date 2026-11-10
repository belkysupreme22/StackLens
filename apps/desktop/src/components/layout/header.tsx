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
    <header className="flex h-[68px] items-center justify-between border-b border-[#26262a] bg-[#0a0a0b]/80 backdrop-blur-md px-6 select-none">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-base font-semibold text-[#ffffff] flex items-center gap-2.5 tracking-tight">
          {currentMeta.title}
        </h1>
        <p className="text-xs text-[#8c8b8f] tracking-normal font-normal">
          {currentMeta.subtitle}
        </p>
      </div>

      {/* Quick Status Bar */}
      <div className="flex items-center gap-3">
        {/* ADB Connectivity Pill */}
        <div
          onClick={() => setCurrentPage("devices")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#26262a] bg-[#131315] text-xs font-medium cursor-pointer hover:border-[#333338] hover:bg-[#18181b] transition-all"
          title="Click to manage Android devices"
        >
          <Smartphone className="h-3.5 w-3.5 text-[#8c8b8f]" strokeWidth={1.5} />
          {onlineCount > 0 ? (
            <div className="flex items-center gap-2">
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
          className="h-8 px-3 gap-1.5 text-xs rounded-full border-[#26262a] hover:bg-[#18181b]"
          title="Refresh connected devices"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingDevices ? "animate-spin" : ""}`} strokeWidth={1.5} />
          <span>Refresh</span>
        </Button>

        {/* Offline Badge */}
        <Badge variant="outline" className="text-xs gap-1.5 text-[#47ab61] border-[#47ab61]/30 bg-[#47ab61]/10 rounded-full px-3 py-1">
          <Shield className="h-3 w-3" strokeWidth={1.5} />
          Offline
        </Badge>
      </div>
    </header>
  );
}
