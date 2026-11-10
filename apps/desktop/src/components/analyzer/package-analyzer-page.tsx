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
  } = useAppStore();

  const [packageName, setPackageName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [localResult, setLocalResult] = useState<AnalysisResult | null>(null);

  const isValidPackage =
    /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(packageName.trim());

  const handleAnalyze = async () => {
    if (!selectedDeviceSerial) {
      setErrorMessage("Please select a target Android device.");
      return;
    }
    if (!isValidPackage) {
      setErrorMessage("Please enter a valid Android package name (e.g. com.google.android.youtube).");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setStatusMessage("Connecting to device via ADB...");

    try {
      setStatusMessage(`Locating APK binaries for package: ${packageName.trim()}...`);
      const result = await commands.pullPackageApk(selectedDeviceSerial, packageName.trim());

      setStatusMessage("Parsing APK archive and evaluating framework indicators...");
      setLocalResult(result);
      setActiveAnalysis(result);
    } catch (e) {
      setErrorMessage(String(e));
    } finally {
      setIsAnalyzing(false);
      setStatusMessage(null);
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
      <Card className="p-8 border-neutral-800 bg-neutral-900/60 shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
            <PackageSearch className="h-5 w-5 text-indigo-400" />
            Analyze Installed Application
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Specify an installed Android package identifier to extract its APK directly over ADB and inspect its framework architecture.
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3.5 rounded-lg border border-rose-900/50 bg-rose-950/20 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Device selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
            <span>Target Device</span>
            <button
              onClick={() => refreshDevices()}
              className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </label>

          {devices.length === 0 ? (
            <div className="p-4 rounded-lg border border-neutral-800 bg-neutral-950 text-xs text-neutral-400 text-center">
              No devices online. Connect your phone or launch an emulator with USB debugging enabled.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {devices.map((dev) => (
                <div
                  key={dev.serial}
                  onClick={() => setSelectedDeviceSerial(dev.serial)}
                  className={`p-3 rounded-lg border cursor-pointer text-xs transition-all ${
                    dev.serial === selectedDeviceSerial
                      ? "border-indigo-500 bg-indigo-950/20 text-neutral-100 shadow-sm"
                      : "border-neutral-800 bg-neutral-950/80 text-neutral-400 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>{dev.model || "Android Device"}</span>
                    <Badge variant={dev.state === "Online" ? "success" : "secondary"} className="text-[9px]">
                      {dev.state}
                    </Badge>
                  </div>
                  <div className="text-[11px] font-mono text-neutral-400 mt-1 truncate">
                    {dev.serial}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Package input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300">
            Package Name
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. com.spotify.music or org.wikipedia"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              className="font-mono text-xs h-10 border-neutral-700 bg-neutral-950"
              disabled={isAnalyzing}
            />
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !isValidPackage || !selectedDeviceSerial}
              className="h-10 px-6 gap-2 shrink-0"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Analysis
                </>
              )}
            </Button>
          </div>
          <p className="text-[11px] text-neutral-400">
            Split APKs are automatically resolved and consolidated during analysis.
          </p>
        </div>

        {/* Live Status indicator */}
        {isAnalyzing && (
          <div className="p-4 rounded-lg border border-indigo-500/30 bg-indigo-950/20 text-xs text-indigo-300 flex items-center gap-3">
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </Card>

      {/* Suggested package examples */}
      <Card className="p-6 border-neutral-800 bg-neutral-900/40">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
          Popular Application Package Names
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
              className="px-2.5 py-1 rounded border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-indigo-300 hover:border-neutral-700 font-mono text-[11px] transition-colors"
            >
              {pkg}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
