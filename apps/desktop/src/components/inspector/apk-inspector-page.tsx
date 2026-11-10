import React, { useState } from "react";
import {
  Upload,
  FileCode,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalysisResultsView } from "@/components/analyzer/analysis-results";
import * as commands from "@/lib/commands";
import type { AnalysisResult } from "@/types";

export function ApkInspectorPage() {
  const { activeAnalysis, setActiveAnalysis } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".apk")) {
      setErrorMessage("Please select a valid Android APK file (.apk).");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setStatusText(`Reading ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);

    try {
      const buffer = await file.arrayBuffer();
      const bytes = Array.from(new Uint8Array(buffer));

      setStatusText("Parsing archive structure, bytecode, and framework signatures...");
      const result = await commands.analyzeApkBytes(file.name, bytes);
      setActiveAnalysis(result);
    } catch (e) {
      setErrorMessage(String(e));
    } finally {
      setIsAnalyzing(false);
      setStatusText(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  if (activeAnalysis) {
    return (
      <AnalysisResultsView
        result={activeAnalysis}
        onBack={() => setActiveAnalysis(null)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Upload Zone */}
      <Card
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`p-12 border-2 border-dashed rounded-2xl text-center transition-all ${
          isDragging
            ? "border-indigo-500 bg-indigo-950/20 shadow-xl"
            : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-600/10 text-indigo-400 ring-8 ring-indigo-600/5">
            <Upload className="h-8 w-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-100">
              Drag & Drop Android APK File Here
            </h3>
            <p className="text-xs text-neutral-400">
              Inspect application binaries, assets, dex classes, and framework signatures offline
            </p>
          </div>

          <div className="pt-2">
            <label>
              <input
                type="file"
                accept=".apk"
                className="hidden"
                onChange={handleFileInput}
                disabled={isAnalyzing}
              />
              <span className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-indigo-500 cursor-pointer transition-colors gap-2">
                <FolderOpen className="h-4 w-4" />
                Browse Local Files
              </span>
            </label>
          </div>

          <div className="text-[11px] text-neutral-400 pt-2">
            Supports APK, XAPK extraction, Split APK base binaries up to 500 MB
          </div>
        </div>
      </Card>

      {/* Progress status */}
      {isAnalyzing && (
        <Card className="p-4 border-indigo-500/30 bg-indigo-950/20 text-xs text-indigo-300 flex items-center gap-3">
          <RefreshCw className="h-4 w-4 animate-spin text-indigo-400 shrink-0" />
          <span>{statusText}</span>
        </Card>
      )}

      {/* Error status */}
      {errorMessage && (
        <Card className="p-4 border-rose-900/50 bg-rose-950/20 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div>{errorMessage}</div>
        </Card>
      )}

      {/* Capabilities Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-1">
          <span className="text-xs font-semibold text-neutral-200">14 Framework Runtimes</span>
          <p className="text-[11px] text-neutral-400">
            Detects Flutter, React Native, Unity, .NET MAUI, Unreal Engine, Godot, Cordova, NativeScript, Kotlin, Compose, and more.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-1">
          <span className="text-xs font-semibold text-neutral-200">Transparent Evidence</span>
          <p className="text-[11px] text-neutral-400">
            Every detection exposes concrete file paths, native symbol names, dex descriptors, and confidence calculations.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-1">
          <span className="text-xs font-semibold text-neutral-200">100% Offline Analysis</span>
          <p className="text-[11px] text-neutral-400">
            Your application packages are never uploaded to any remote server or external telemetry endpoint.
          </p>
        </div>
      </div>
    </div>
  );
}
