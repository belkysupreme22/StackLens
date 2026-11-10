import React, { useState, useEffect, useMemo } from "react";
import {
  Smartphone,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  Package,
  ArrowRight,
  Search,
  Filter,
  Layers,
  Sparkles,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import * as commands from "@/lib/commands";
import { resolveAppProfile, AppProfile } from "@/lib/package-resolver";
import { AppLogo } from "@/components/ui/app-logo";

export function DevicePage() {
  const {
    adbAvailable,
    devices,
    selectedDeviceSerial,
    setSelectedDeviceSerial,
    refreshDevices,
    isRefreshingDevices,
    devicePackagesCache,
    setDevicePackagesCache,
    setActiveAnalysis,
    setCurrentPage,
    setPullProgress,
  } = useAppStore();

  const [packageSearch, setPackageSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"third-party" | "all" | "system">("third-party");
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-select first device if none selected
  useEffect(() => {
    if (!selectedDeviceSerial && devices.length > 0) {
      setSelectedDeviceSerial(devices[0].serial);
    }
  }, [devices, selectedDeviceSerial]);

  // Fetch packages only if not cached for the selected device
  useEffect(() => {
    if (selectedDeviceSerial) {
      if (!devicePackagesCache[selectedDeviceSerial]) {
        fetchPackages(selectedDeviceSerial);
      }
    }
  }, [selectedDeviceSerial]);

  const fetchPackages = async (serial: string) => {
    setIsLoadingPackages(true);
    setErrorMessage(null);
    try {
      const pkgs = await commands.getDevicePackages(serial);
      setDevicePackagesCache(serial, pkgs);
    } catch (e) {
      setErrorMessage(String(e));
    } finally {
      setIsLoadingPackages(false);
    }
  };

  const handleSelectDevice = (serial: string) => {
    setSelectedDeviceSerial(serial);
    if (!devicePackagesCache[serial]) {
      fetchPackages(serial);
    }
  };

  const handlePullAndAnalyze = async (profile: AppProfile) => {
    if (!selectedDeviceSerial) return;
    setErrorMessage(null);

    // Initialize fullscreen animated pull loader
    setPullProgress({
      active: true,
      packageName: profile.packageName,
      appName: profile.appName,
      stage: 0,
      stageLabel: "Connecting ADB bridge",
      details: `Connecting to device ${selectedDeviceSerial}...`,
      error: null,
    });

    try {
      // Stage 1: Resolving binary
      setTimeout(() => {
        setPullProgress({
          active: true,
          packageName: profile.packageName,
          appName: profile.appName,
          stage: 1,
          stageLabel: "Resolving package paths",
          details: `Querying pm path for ${profile.packageName}...`,
          error: null,
        });
      }, 400);

      // Stage 2: Streaming APK
      setTimeout(() => {
        setPullProgress({
          active: true,
          packageName: profile.packageName,
          appName: profile.appName,
          stage: 2,
          stageLabel: "Streaming APK payload",
          details: `Streaming package binary from device into sandbox...`,
          error: null,
        });
      }, 1000);

      // Stage 3: Bytecode extraction
      setTimeout(() => {
        setPullProgress({
          active: true,
          packageName: profile.packageName,
          appName: profile.appName,
          stage: 3,
          stageLabel: "Parsing DEX & Manifest",
          details: `Decoding AXML headers and indexing DEX class hierarchies...`,
          error: null,
        });
      }, 1800);

      // Stage 4: Framework classification
      setTimeout(() => {
        setPullProgress({
          active: true,
          packageName: profile.packageName,
          appName: profile.appName,
          stage: 4,
          stageLabel: "Evaluating framework runtimes",
          details: `Matching runtime signatures against binary evidence...`,
          error: null,
        });
      }, 2400);

      // Actual Rust IPC Call
      const result = await commands.pullPackageApk(selectedDeviceSerial, profile.packageName);

      // Complete stage
      setPullProgress({
        active: true,
        packageName: profile.packageName,
        appName: profile.appName,
        stage: 5,
        stageLabel: "Analysis completed",
        details: "Synthesizing evidence and launching inspector...",
        error: null,
      });

      setTimeout(() => {
        setPullProgress(null);
        setActiveAnalysis(result);
        setCurrentPage("inspector");
      }, 600);
    } catch (e) {
      setPullProgress({
        active: true,
        packageName: profile.packageName,
        appName: profile.appName,
        stage: 2,
        stageLabel: "Pull failed",
        details: `ADB command error: ${e}`,
        error: `Failed to pull or inspect ${profile.appName}: ${e}`,
      });
    }
  };

  const selectedDevice = devices.find((d) => d.serial === selectedDeviceSerial);
  const rawPackages = (selectedDeviceSerial && devicePackagesCache[selectedDeviceSerial]) || [];

  // Parse raw package strings into rich profiles
  const allProfiles = useMemo(() => {
    return rawPackages.map((pkg) => resolveAppProfile(pkg));
  }, [rawPackages]);

  // Counts
  const thirdPartyCount = useMemo(() => allProfiles.filter((p) => !p.isSystem).length, [allProfiles]);
  const systemCount = useMemo(() => allProfiles.filter((p) => p.isSystem).length, [allProfiles]);

  // Filtered list
  const filteredProfiles = useMemo(() => {
    let list = allProfiles;
    if (filterMode === "third-party") {
      list = list.filter((p) => !p.isSystem);
    } else if (filterMode === "system") {
      list = list.filter((p) => p.isSystem);
    }

    if (packageSearch.trim()) {
      const q = packageSearch.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.appName.toLowerCase().includes(q) ||
          p.packageName.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allProfiles, filterMode, packageSearch]);

  return (
    <div className="space-y-6">
      {/* ADB Unavailable Banner */}
      {!adbAvailable ? (
        <Card className="p-5 border-amber-900/40 bg-amber-950/20 text-amber-300 rounded-[20px]">
          <div className="flex items-start gap-3.5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold text-amber-200">
                Android Debug Bridge (ADB) not found
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                StackLens uses ADB to connect to your Android device and emulators.
                Verify Platform-Tools is installed or configure the exact binary path in Settings.
              </p>
              <div className="pt-2 flex gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refreshDevices()}
                  className="text-xs rounded-full border-amber-800 text-amber-200 hover:bg-amber-900/40"
                >
                  Check again
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCurrentPage("settings")}
                  className="text-xs rounded-full text-amber-400 hover:text-amber-300"
                >
                  Configure path
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : devices.length === 0 ? (
        <Card className="p-6 border-[#26262a] bg-[#131315] rounded-[20px] text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#18181b] border border-[#26262a] text-[#8c8b8f]">
            <Smartphone className="h-6 w-6 text-[#8c8b8f]" strokeWidth={1.5} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#ffffff]">
              No connected Android devices detected
            </h4>
            <p className="text-xs text-[#8c8b8f] max-w-md mx-auto mt-1">
              Enable USB debugging in Developer Options and connect your device with a data cable.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => refreshDevices()}
            disabled={isRefreshingDevices}
            className="rounded-full px-5 text-xs bg-[#47ab61] text-[#0a0a0b]"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshingDevices ? "animate-spin" : ""}`} />
            Refresh devices
          </Button>
        </Card>
      ) : null}

      {/* Discovered Devices Cards */}
      {devices.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#ffffff] flex items-center gap-2 tracking-tight">
              Connected devices ({devices.length})
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refreshDevices()}
              disabled={isRefreshingDevices}
              className="h-8 gap-1.5 text-xs rounded-full border-[#26262a] hover:bg-[#18181b]"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshingDevices ? "animate-spin" : ""}`} />
              Scan devices
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device) => {
              const isSelected = device.serial === selectedDeviceSerial;
              const isOnline = device.state === "Online";

              return (
                <Card
                  key={device.serial}
                  onClick={() => handleSelectDevice(device.serial)}
                  className={`p-4 border rounded-[20px] cursor-pointer transition-all ${
                    isSelected
                      ? "border-[#47ab61] bg-[#18181b] shadow-[0_0_0_1px_rgba(71,171,97,0.3)]"
                      : "border-[#26262a] bg-[#131315] hover:border-[#333338]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-[#0a0a0b] border border-[#26262a] text-[#47ab61]">
                        <Smartphone className="h-4 w-4" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#ffffff] truncate">
                          {device.model || "Android Device"}
                        </h4>
                        <p className="text-xs text-[#8c8b8f]">
                          {device.manufacturer || "Manufacturer"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isOnline && (
                        <span className="h-2 w-2 rounded-full bg-[#47ab61] animate-pulse" />
                      )}
                      <Badge
                        variant={isOnline ? "success" : "secondary"}
                        className="text-[10px] rounded-full px-2.5"
                      >
                        {device.state}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#26262a] grid grid-cols-2 gap-2 text-xs text-[#8c8b8f]">
                    <div>
                      <span className="text-[#8c8b8f]/60 block text-[10px] uppercase">Serial</span>
                      <span className="font-mono text-[#ffffff] truncate block">{device.serial}</span>
                    </div>
                    <div>
                      <span className="text-[#8c8b8f]/60 block text-[10px] uppercase">OS / API</span>
                      <span className="text-[#ffffff]">
                        Android {device.android_version || "?"} (API {device.sdk_level || "?"})
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Package Browser on Selected Device */}
      {selectedDevice && (
        <Card className="p-6 border-[#26262a] bg-[#131315] rounded-[20px] space-y-5">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#26262a]">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-[#ffffff] tracking-tight">
                  Installed applications
                </CardTitle>
                <Badge variant="outline" className="text-xs rounded-full border-[#26262a] text-[#8c8b8f]">
                  {selectedDevice.model || selectedDevice.serial}
                </Badge>
              </div>
              <p className="text-xs text-[#8c8b8f] mt-0.5">
                Inspect and pull applications directly from your connected device.
              </p>
            </div>

            {/* Filter Tabs and Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Pills */}
              <div className="inline-flex items-center rounded-full bg-[#18181b] border border-[#26262a] p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterMode("third-party")}
                  className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                    filterMode === "third-party"
                      ? "bg-[#47ab61] text-[#0a0a0b] font-semibold"
                      : "text-[#8c8b8f] hover:text-[#ffffff]"
                  }`}
                >
                  User apps ({thirdPartyCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                    filterMode === "all"
                      ? "bg-[#47ab61] text-[#0a0a0b] font-semibold"
                      : "text-[#8c8b8f] hover:text-[#ffffff]"
                  }`}
                >
                  All ({allProfiles.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("system")}
                  className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                    filterMode === "system"
                      ? "bg-[#47ab61] text-[#0a0a0b] font-semibold"
                      : "text-[#8c8b8f] hover:text-[#ffffff]"
                  }`}
                >
                  System ({systemCount})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-56">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#8c8b8f]" />
                <Input
                  placeholder="Search by name or package..."
                  value={packageSearch}
                  onChange={(e) => setPackageSearch(e.target.value)}
                  className="pl-8 text-xs h-8 rounded-full border-[#26262a] bg-[#18181b] placeholder:text-[#8c8b8f]"
                />
              </div>

              {/* Force Refresh Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchPackages(selectedDevice.serial)}
                disabled={isLoadingPackages}
                className="h-8 rounded-full border-[#26262a] text-xs hover:bg-[#18181b]"
                title="Sync and refresh app list from device"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingPackages ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Sync</span>
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-[16px] border border-rose-900/50 bg-[#120507] text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Package Content List */}
          {isLoadingPackages && rawPackages.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="flex justify-center">
                <span className="h-4 w-4 rounded-full bg-[#47ab61] animate-ping" />
              </div>
              <div className="text-sm font-semibold text-[#ffffff]">
                Reading installed packages over ADB...
              </div>
              <p className="text-xs text-[#8c8b8f]">
                Parsing application descriptors on {selectedDevice.model || selectedDevice.serial}.
              </p>
            </div>
          ) : rawPackages.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-xs text-[#8c8b8f]">
                No cached packages found for this device.
              </p>
              <Button
                size="sm"
                onClick={() => fetchPackages(selectedDevice.serial)}
                className="rounded-full px-5 text-xs bg-[#47ab61] text-[#0a0a0b]"
              >
                Load installed packages
              </Button>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#8c8b8f]">
              No applications match "{packageSearch}".
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-[#8c8b8f] flex items-center justify-between px-1 pb-1">
                <span>
                  Showing {filteredProfiles.length} of {allProfiles.length} installed apps
                </span>
                <span className="text-[11px] text-[#47ab61]">
                  Instant offline cache active
                </span>
              </div>

              {/* Scrollable App Cards Grid/List */}
              <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
                {filteredProfiles.map((app) => (
                  <div
                    key={app.packageName}
                    className="p-3.5 rounded-[16px] border border-[#26262a] bg-[#18181b]/70 hover:bg-[#18181b] hover:border-[#333338] flex items-center justify-between gap-4 transition-all"
                  >
                    {/* App Icon + Title + Package ID */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Real App Icon (Device-extracted or Official Vector Brand Logo) */}
                      <AppLogo
                        packageName={app.packageName}
                        appName={app.appName}
                        serial={selectedDeviceSerial}
                        brandColor={app.brandColor}
                        initials={app.initials}
                        size="md"
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-[#ffffff] tracking-tight truncate">
                            {app.appName}
                          </h4>
                          {app.isSystem ? (
                            <span className="px-2 py-0.5 rounded-full bg-[#26262a] text-[10px] text-[#8c8b8f]">
                              System
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-[#47ab61]/15 text-[10px] text-[#47ab61] font-medium border border-[#47ab61]/30">
                              {app.category}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-[#8c8b8f] truncate mt-0.5">
                          {app.packageName}
                        </p>
                      </div>
                    </div>

                    {/* Pull & Inspect Button */}
                    <Button
                      size="sm"
                      onClick={() => handlePullAndAnalyze(app)}
                      className="rounded-full px-4 h-8 text-xs font-semibold bg-[#47ab61] text-[#0a0a0b] hover:bg-[#3b9352] shrink-0 gap-1.5 shadow-sm"
                    >
                      <span>Pull & Inspect</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Troubleshooting Guidance */}
      <Card className="p-5 border-[#26262a] bg-[#131315] rounded-[20px] space-y-3">
        <h4 className="text-xs font-semibold text-[#ffffff] flex items-center gap-2 tracking-tight">
          <HelpCircle className="h-4 w-4 text-[#47ab61]" strokeWidth={1.5} />
          Connecting your device via ADB
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#8c8b8f]">
          <div className="p-3.5 rounded-[16px] bg-[#0a0a0b] border border-[#26262a]">
            <span className="font-semibold text-[#ffffff] block mb-1">1. Enable USB debugging</span>
            Open Settings &gt; About phone &gt; Tap "Build number" 7 times. Return to Developer options and turn on USB debugging.
          </div>
          <div className="p-3.5 rounded-[16px] bg-[#0a0a0b] border border-[#26262a]">
            <span className="font-semibold text-[#ffffff] block mb-1">2. Authorize computer</span>
            When the prompt appears on your phone screen, check "Always allow from this computer" and tap Allow.
          </div>
          <div className="p-3.5 rounded-[16px] bg-[#0a0a0b] border border-[#26262a]">
            <span className="font-semibold text-[#ffffff] block mb-1">3. Instant local cache</span>
            Packages stay cached locally during your session. You can switch between tabs without any reloading lag.
          </div>
        </div>
      </Card>
    </div>
  );
}
