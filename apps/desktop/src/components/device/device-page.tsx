import React, { useState } from "react";
import {
  Smartphone,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Package,
  ArrowRight,
  ShieldAlert,
  Search,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import * as commands from "@/lib/commands";

export function DevicePage() {
  const {
    adbAvailable,
    devices,
    selectedDeviceSerial,
    setSelectedDeviceSerial,
    refreshDevices,
    isRefreshingDevices,
    setActiveAnalysis,
    setCurrentPage,
  } = useAppStore();

  const [packageSearch, setPackageSearch] = useState("");
  const [devicePackages, setDevicePackages] = useState<string[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [analyzingPackage, setAnalyzingPackage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedDevice = devices.find((d) => d.serial === selectedDeviceSerial);

  const fetchPackages = async (serial: string) => {
    setIsLoadingPackages(true);
    setErrorMessage(null);
    try {
      const pkgs = await commands.getDevicePackages(serial);
      setDevicePackages(pkgs);
    } catch (e) {
      setErrorMessage(String(e));
      setDevicePackages([]);
    } finally {
      setIsLoadingPackages(false);
    }
  };

  const handleSelectDevice = (serial: string) => {
    setSelectedDeviceSerial(serial);
    fetchPackages(serial);
  };

  const handlePullAndAnalyze = async (pkg: string) => {
    if (!selectedDeviceSerial) return;
    setAnalyzingPackage(pkg);
    setErrorMessage(null);
    try {
      const result = await commands.pullPackageApk(selectedDeviceSerial, pkg);
      setActiveAnalysis(result);
      setCurrentPage("inspector");
    } catch (e) {
      setErrorMessage(`Failed to pull or inspect package: ${e}`);
    } finally {
      setAnalyzingPackage(null);
    }
  };

  const filteredPackages = devicePackages.filter((p) =>
    p.toLowerCase().includes(packageSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ADB Status Banner */}
      {!adbAvailable ? (
        <Card className="p-4 border-amber-900/40 bg-amber-950/20 text-amber-300">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-amber-200">
                Android Debug Bridge (ADB) Is Not Available
              </h4>
              <p className="text-xs text-neutral-300">
                StackLens requires ADB to communicate with connected hardware devices and emulators.
                Please ensure Android SDK Platform-Tools is installed and added to your system PATH, or specify the exact executable path in Settings.
              </p>
              <div className="pt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refreshDevices()}
                  className="text-xs h-7 border-amber-800 hover:bg-amber-900/40 text-amber-200"
                >
                  Check Again
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCurrentPage("settings")}
                  className="text-xs h-7 text-amber-400 hover:text-amber-300"
                >
                  Configure ADB Path →
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : devices.length === 0 ? (
        <Card className="p-3.5 border-[#26262a] bg-[#131315] rounded-[20px] text-[#8c8b8f]">
          <div className="flex items-start gap-2.5">
            <Smartphone className="h-4 w-4 shrink-0 text-[#8c8b8f] mt-0.5" strokeWidth={1.5} />
            <div className="space-y-1">
              <h4 className="text-xs font-mono font-medium text-[#ffffff]">
                No connected Android devices detected
              </h4>
              <p className="text-[11px] font-mono text-[#8c8b8f]">
                Enable <strong>USB Debugging</strong> in developer options and connect via USB, or execute <code className="text-[#47ab61]">adb connect &lt;ip:port&gt;</code>.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Connected Devices Grid */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-mono font-medium text-[#ffffff] flex items-center gap-2">
            Discovered devices ({devices.length})
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refreshDevices()}
            disabled={isRefreshingDevices}
            className="h-8 gap-1 text-xs border-neutral-800"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshingDevices ? "animate-spin" : ""}`} />
            Refresh List
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
                className={`p-3.5 border rounded-[20px] cursor-pointer transition-colors ${
                  isSelected
                    ? "border-[#47ab61] bg-[#18181b]"
                    : "border-[#26262a] bg-[#131315] hover:border-[#333338]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-full bg-[#0a0a0b] border border-[#26262a] text-[#47ab61]">
                      <Smartphone className="h-4 w-4" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="text-xs font-mono font-medium text-[#ffffff]">
                        {device.model || "Android device"}
                      </h4>
                      <p className="text-[11px] font-mono text-[#8c8b8f]">
                        {device.manufacturer || "Unknown manufacturer"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isOnline && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#47ab61] animate-status-pulse" />
                    )}
                    <Badge
                      variant={isOnline ? "success" : "secondary"}
                      className="text-[9px]"
                    >
                      {device.state}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#26262a] grid grid-cols-2 gap-2 text-[11px] font-mono text-[#8c8b8f]">
                  <div>
                    <span className="text-neutral-400 block">Serial:</span>
                    <span className="truncate block text-neutral-200">{device.serial}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">OS / SDK:</span>
                    <span className="text-neutral-200">
                      Android {device.android_version || "?"} (API {device.sdk_level || "?"})
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Package Browser on Selected Device */}
      {selectedDevice && (
        <Card className="p-6 border-neutral-800 bg-neutral-900/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-semibold text-neutral-200">
                Installed Packages on {selectedDevice.model || selectedDevice.serial}
              </CardTitle>
              <p className="text-xs text-neutral-400">
                Select an application package to pull and analyze its architecture
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-neutral-400" />
                <Input
                  placeholder="Filter packages..."
                  value={packageSearch}
                  onChange={(e) => setPackageSearch(e.target.value)}
                  className="pl-8 text-xs h-8 border-neutral-700 bg-neutral-950"
                />
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchPackages(selectedDevice.serial)}
                disabled={isLoadingPackages}
                className="h-8 text-xs border-neutral-700"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingPackages ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-[20px] border border-rose-900/40 bg-[#120507] text-xs font-mono text-rose-300">
              {errorMessage}
            </div>
          )}

          {isLoadingPackages ? (
            <div className="p-8 text-center text-xs font-mono text-[#8c8b8f]">
              <span className="h-2 w-2 rounded-full bg-[#47ab61] animate-status-pulse inline-block mb-2" />
              <div>Querying package manager via ADB...</div>
            </div>
          ) : devicePackages.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-[#8c8b8f]">
              <Button
                size="sm"
                onClick={() => fetchPackages(selectedDevice.serial)}
                className="text-xs font-mono rounded-[20px]"
              >
                Load packages
              </Button>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-1 pr-1">
              <div className="text-[10px] font-mono text-[#8c8b8f] pb-1">
                Showing {filteredPackages.length} of {devicePackages.length} packages
              </div>
              {filteredPackages.map((pkg) => (
                <div
                  key={pkg}
                  className="p-2 rounded-[20px] border border-[#26262a] bg-[#0a0a0b] hover:border-[#333338] flex items-center justify-between text-xs font-mono transition-colors"
                >
                  <span className="truncate pr-4 text-[#ffffff]">{pkg}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePullAndAnalyze(pkg)}
                    disabled={analyzingPackage === pkg}
                    className="h-6 text-[11px] font-mono border-[#26262a] bg-[#131315] text-[#47ab61] hover:bg-[#47ab61] hover:text-[#0a0a0b] rounded-full shrink-0"
                  >
                    {analyzingPackage === pkg ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-1">
                        Pull <ArrowRight className="h-3 w-3" />
                      </span>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Troubleshooting Guidance */}
      <Card className="p-4 border-[#26262a] bg-[#131315] rounded-[20px] space-y-2.5">
        <h4 className="text-[11px] font-mono text-[#8c8b8f] uppercase tracking-wider flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5 text-[#47ab61]" strokeWidth={1.5} />
          ADB device connection troubleshooting
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs font-mono text-[#8c8b8f]">
          <div className="p-2.5 rounded-[20px] bg-[#0a0a0b] border border-[#26262a]">
            <span className="font-medium text-[#ffffff] block mb-0.5">1. Enable USB debugging</span>
            Settings &gt; About phone &gt; Tap "Build number" 7 times. Return to developer options and enable USB debugging.
          </div>
          <div className="p-2.5 rounded-[20px] bg-[#0a0a0b] border border-[#26262a]">
            <span className="font-medium text-[#ffffff] block mb-0.5">2. Authorize computer</span>
            On phone screen, accept RSA key fingerprint dialog: "Always allow from this computer".
          </div>
          <div className="p-2.5 rounded-[20px] bg-[#0a0a0b] border border-[#26262a]">
            <span className="font-medium text-[#ffffff] block mb-0.5">3. Verify cable</span>
            Ensure cable supports data transfer. On Windows, install Google USB Drivers or vendor OEM driver.
          </div>
        </div>
      </Card>
    </div>
  );
}
