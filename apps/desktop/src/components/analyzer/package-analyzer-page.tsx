import React, { useState } from "react";
import {
  PackageSearch,
  Smartphone,
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileSearch,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import * as commands from "@/lib/commands";
import { AnalysisResultsView } from "./analysis-results";
import type { AnalysisResult } from "@/types";

export function PackageAnalyzerPage() {
  const {
    adbAvailable,
    devices,
    selectedDeviceSerial,
    setSelectedDeviceSerial,
    refreshDevices,
    activeAnalysis,
    setActiveAnalysis,
    setPullProgress,
    setCurrentPage,
  } = useAppStore();

  const [packageName, setPackageName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [localResult, setLocalResult] = useState<AnalysisResult | null>(null);
  const [shakeInput, setShakeInput] = useState(false);

  const isValidPackage =
    /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(packageName.trim());

  const triggerRefusal = (message: string) => {
    setErrorMessage(message);
    setShakeInput(true);
    setTimeout(() => setShakeInput(false), 450);
  };

  const handleAnalyze = async () => {
    if (!selectedDeviceSerial) {
      triggerRefusal("Please select a target Android device.");
      return;
    }
    if (!isValidPackage) {
      triggerRefusal("Please enter a valid Android package name (e.g. com.google.android.youtube).");
      return;
    }

    const pkg = packageName.trim();
    setErrorMessage(null);

    // Trigger fullscreen pull loader
    setPullProgress({
      active: true,
      packageName: pkg,
      appName: pkg.split(".").pop() || pkg,
      stage: 0,
      stageLabel: "Connecting ADB bridge",
      details: `Connecting to ${selectedDeviceSerial}...`,
      error: null,
    });

    try {
      setTimeout(() => {
        setPullProgress({
          active: true,
          packageName: pkg,
          appName: pkg.split(".").pop() || pkg,
          stage: 2,
          stageLabel: "Streaming APK payload",
          details: `Extracting binary archive for ${pkg}...`,
          error: null,
        });
      }, 700);

      setTimeout(() => {
        setPullProgress({
          active: true,
          packageName: pkg,
          appName: pkg.split(".").pop() || pkg,
          stage: 4,
          stageLabel: "Analyzing framework runtimes",
          details: "Scanning DEX bytecode and matching signatures...",
          error: null,
        });
      }, 1500);

      const result = await commands.pullPackageApk(selectedDeviceSerial, pkg);
      setLocalResult(result);
      setActiveAnalysis(result);
      setPullProgress(null);
    } catch (e) {
      setPullProgress({
        active: true,
        packageName: pkg,
        appName: pkg,
        stage: 2,
        stageLabel: "Extraction failed",
        details: String(e),
        error: `Failed to pull or inspect package: ${e}`,
      });
      setErrorMessage(String(e));
    }
  };

  if (localResult) {
    return (
      <AnalysisResultsView
        result={localResult}
        onBack={() => setLocalResult(null)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6 border-[#26262a] bg-[#131315] rounded-[20px] space-y-5">
        <div>
          <h3 className="text-sm font-mono font-medium text-[#ffffff] flex items-center gap-2">
            <PackageSearch className="h-4 w-4 text-[#47ab61]" />
            Extract and analyze application
          </h3>
          <p className="text-xs text-[#8c8b8f] mt-1 font-mono">
            Extract installed package APK over ADB and inspect runtime framework signatures.
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 rounded-[20px] border border-rose-900/50 bg-[#120507] text-xs font-mono text-rose-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Device selector */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-[#ffffff] flex items-center justify-between">
            <span>Target device</span>
            <button
              onClick={() => refreshDevices()}
              className="text-[11px] font-mono text-[#47ab61] hover:underline flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </label>

          {devices.length === 0 ? (
            <div className="p-4 rounded-[20px] border border-[#26262a] bg-[#0a0a0b] text-xs font-mono text-[#8c8b8f] text-center">
              No devices online. Connect hardware via USB or start an emulator.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {devices.map((dev) => (
                <div
                  key={dev.serial}
                  onClick={() => setSelectedDeviceSerial(dev.serial)}
                  className={`p-2.5 rounded-[20px] border cursor-pointer text-xs font-mono transition-colors ${
                    dev.serial === selectedDeviceSerial
                      ? "border-[#47ab61] bg-[#18181b] text-[#ffffff]"
                      : "border-[#26262a] bg-[#0a0a0b] text-[#8c8b8f] hover:border-[#333338] hover:text-[#ffffff]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#ffffff]">{dev.model || "Android device"}</span>
                    <Badge variant={dev.state === "Online" ? "success" : "secondary"} className="text-[9px]">
                      {dev.state}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-[#8c8b8f] mt-1 truncate">
                    {dev.serial}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Package input */}
        <div className={`space-y-2 ${shakeInput ? "animate-refusal" : ""}`}>
          <label className="text-xs font-mono font-medium text-[#ffffff]">
            Package identifier
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. com.spotify.music"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAnalyze();
                }
              }}
              className="font-mono text-xs h-9 border-[#26262a] bg-[#0a0a0b] rounded-[20px] focus-visible:border-[#47ab61]"
              disabled={isAnalyzing}
            />
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !isValidPackage || !selectedDeviceSerial}
              className="h-9 px-4 text-xs font-mono shrink-0 rounded-[20px]"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Analyzing
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Inspect package
                </>
              )}
            </Button>
          </div>
          <p className="text-[11px] font-mono text-[#8c8b8f]">
            Consolidates split APKs and native architecture binaries automatically.
          </p>
        </div>

        {/* Live Status indicator */}
        {isAnalyzing && (
          <div className="p-3 rounded-[20px] border border-[#26262a] bg-[#131315] text-xs font-mono text-[#ffffff] flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#47ab61] animate-status-pulse shrink-0" />
            <span className="truncate">{statusMessage}</span>
          </div>
        )}
      </Card>

      {/* Suggested package examples */}
      <Card className="p-4 border-[#26262a] bg-[#131315] rounded-[20px]">
        <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#8c8b8f] mb-2.5">
          Common packages
        </h4>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            "com.google.android.youtube",
            "com.spotify.music",
            "org.telegram.messenger",
            "com.discord",
            "com.twitter.android",
            "org.wikipedia",
          ].map((pkg) => (
            <button
              key={pkg}
              onClick={() => setPackageName(pkg)}
              className="px-2 py-1 rounded-[20px] border border-[#26262a] bg-[#0a0a0b] text-[#8c8b8f] hover:text-[#47ab61] hover:border-[#333338] font-mono text-[11px]"
            >
              {pkg}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
