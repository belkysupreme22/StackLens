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
  const [shakeZone, setShakeZone] = useState(false);

  const triggerRefusal = (message: string) => {
    setErrorMessage(message);
    setShakeZone(true);
    setTimeout(() => setShakeZone(false), 450);
  };

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".apk")) {
      triggerRefusal("Please select a valid Android APK file (.apk).");
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
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Upload Zone */}
      <Card
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`p-10 border border-dashed rounded-[20px] text-center transition-colors ${
          shakeZone ? "animate-refusal" : ""
        } ${
          isDragging
            ? "border-[#47ab61] bg-[#18181b]"
            : "border-[#26262a] bg-[#131315] hover:border-[#333338]"
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-3 rounded-[20px] bg-[#0a0a0b] border border-[#26262a] text-[#47ab61]">
            <Upload className="h-6 w-6" strokeWidth={1.5} />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[#ffffff] tracking-tight">
              Drop an APK to inspect its stack
            </h3>
            <p className="text-xs text-[#8c8b8f]">
              Inspect binary files, assets, and runtime signatures offline.
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
              <span className="inline-flex items-center justify-center rounded-full bg-[#47ab61] px-5 py-2 text-xs font-semibold text-[#0a0a0b] hover:bg-[#3b9352] cursor-pointer transition-colors gap-2 shadow-sm">
                <FolderOpen className="h-4 w-4" strokeWidth={1.5} />
                Browse files
              </span>
            </label>
          </div>

          <div className="text-xs text-[#8c8b8f] pt-1">
            Supports APK, XAPK, and split packages up to 500 MB.
          </div>
        </div>
      </Card>

      {/* Progress status */}
      {isAnalyzing && (
        <Card className="p-4 border-[#26262a] bg-[#131315] rounded-[20px] text-xs text-[#ffffff] flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-[#47ab61] animate-pulse shrink-0" />
          <span className="truncate">{statusText}</span>
        </Card>
      )}

      {/* Error status */}
      {errorMessage && (
        <Card className="p-4 border-rose-900/50 bg-[#120507] rounded-[20px] text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div>{errorMessage}</div>
        </Card>
      )}

      {/* Capabilities Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        <div className="p-5 rounded-[20px] border border-[#26262a] bg-[#131315] space-y-1.5">
          <span className="text-sm font-semibold text-[#ffffff] tracking-tight">Framework intelligence</span>
          <p className="text-xs text-[#8c8b8f] leading-relaxed">
            Identifies modern hybrid engines, game runtimes, and native Android toolkits.
          </p>
        </div>

        <div className="p-5 rounded-[20px] border border-[#26262a] bg-[#131315] space-y-1.5">
          <span className="text-sm font-semibold text-[#ffffff] tracking-tight">Evidence you can verify</span>
          <p className="text-xs text-[#8c8b8f] leading-relaxed">
            Inspect exact file paths, DEX symbols, and confidence scores.
          </p>
        </div>

        <div className="p-5 rounded-[20px] border border-[#26262a] bg-[#131315] space-y-1.5">
          <span className="text-sm font-semibold text-[#ffffff] tracking-tight">Completely offline</span>
          <p className="text-xs text-[#8c8b8f] leading-relaxed">
            Your binaries stay on your device. Nothing leaves your machine.
          </p>
        </div>
      </div>
    </div>
  );
}
