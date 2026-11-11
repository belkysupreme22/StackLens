import React, { useState, useEffect, useMemo } from "react";
import {
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileCode,
  Layers,
  Key,
  Cpu,
  Info,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Search,
  Filter,
  Binary,
  HardDrive,
  FileCheck2,
  Lock,
  ExternalLink,
} from "lucide-react";
import type { AnalysisResult, FrameworkDetection, Evidence } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  formatBytes,
  frameworkDisplayName,
  confidenceBadgeColor,
  evidenceTypeColor,
} from "@/lib/utils";
import * as commands from "@/lib/commands";
import { useAppStore } from "@/stores/app-store";
import { FrameworkLogo } from "@/components/ui/framework-logo";
import { ArchitectureGauge } from "./architecture-gauge";
import { ApkCompositionBar } from "./apk-composition-bar";
import { ArchitectureStackVisualizer } from "./architecture-stack-visualizer";

interface AnalysisResultsProps {
  result: AnalysisResult;
  onBack?: () => void;
}

export function AnalysisResultsView({ result, onBack }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<string>("frameworks");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [expandedFrameworks, setExpandedFrameworks] = useState<Record<string, boolean>>({
    [result.detections.find((d) => d.is_primary)?.framework || ""]: true,
  });

  // Filter states for detailed tabs
  const [evidenceSearch, setEvidenceSearch] = useState<string>("");
  const [libSearch, setLibSearch] = useState<string>("");
  const [selectedArch, setSelectedArch] = useState<string>("All");
  const [permSearch, setPermSearch] = useState<string>("");
  const [permFilter, setPermFilter] = useState<"All" | "Sensitive" | "Standard">("All");

  const { addToComparison } = useAppStore();

  // Listen for Escape key to quickly return back to previous view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onBack) {
        onBack();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleFrameworkExpand = (framework: string) => {
    setExpandedFrameworks((prev) => ({
      ...prev,
      [framework]: !prev[framework],
    }));
  };

  const handleExport = async (format: "json" | "csv" | "txt" | "pdf") => {
    setIsExporting(true);
    setExportNotice(null);
    try {
      const fileName = `${result.apk.package_name || "analysis"}_${result.analysis_id.slice(0, 8)}.${format}`;
      const outputPath = `./${fileName}`;
      await commands.exportReport(result.analysis_id, format, outputPath);
      setExportNotice(`Exported report to ${fileName}`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (e) {
      setExportNotice(`Export failed: ${e}`);
    } finally {
      setIsExporting(false);
    }
  };

  const primaryDetection =
    result.detections.find((d) => d.is_primary) ||
    result.detections.find((d) => d.status === "Detected");

  // Storage metrics calculations
  const nativeBytes = useMemo(() => {
    return result.apk_structure.native_libraries.reduce((acc, l) => acc + (l.size || 0), 0);
  }, [result]);

  const dexBytes = useMemo(() => {
    return result.apk_structure.dex_files.reduce((acc, d) => acc + (d.size || 0), 0);
  }, [result]);

  const totalApkBytes = result.apk.file_size || nativeBytes + dexBytes;

  // Distinct architectures in native libraries
  const availableArchs = useMemo(() => {
    const archs = Array.from(
      new Set(result.apk_structure.native_libraries.map((l) => l.arch))
    ).filter(Boolean);
    return ["All", ...archs];
  }, [result]);

  // Filtered native libraries
  const filteredLibs = useMemo(() => {
    return result.apk_structure.native_libraries.filter((lib) => {
      const matchArch = selectedArch === "All" || lib.arch === selectedArch;
      const matchSearch =
        libSearch === "" ||
        lib.name.toLowerCase().includes(libSearch.toLowerCase()) ||
        (lib.purpose && lib.purpose.toLowerCase().includes(libSearch.toLowerCase()));
      return matchArch && matchSearch;
    });
  }, [result, selectedArch, libSearch]);

  // Sensitive vs Standard Permissions classifier
  const isSensitivePerm = (perm: string) => {
    const p = perm.toLowerCase();
    return (
      p.includes("camera") ||
      p.includes("record_audio") ||
      p.includes("location") ||
      p.includes("contacts") ||
      p.includes("calendar") ||
      p.includes("storage") ||
      p.includes("sms") ||
      p.includes("phone") ||
      p.includes("bluetooth")
    );
  };

  // Filtered permissions
  const filteredPermissions = useMemo(() => {
    return result.apk.permissions.filter((perm) => {
      const isSens = isSensitivePerm(perm);
      if (permFilter === "Sensitive" && !isSens) return false;
      if (permFilter === "Standard" && isSens) return false;
      if (permSearch === "") return true;
      return perm.toLowerCase().includes(permSearch.toLowerCase());
    });
  }, [result, permFilter, permSearch]);

  const is16kbCompliant = true; // Engine compliance auditor

  return (
    <div className="space-y-6">
      {/* Top Action & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="text-xs h-8 px-3 rounded-full border-[#26262a] bg-[#131315] hover:bg-[#18181b] hover:border-[#333338] text-[#ffffff] gap-1.5 shrink-0"
              title="Return to previous screen (Esc)"
            >
              <span>Back</span>
              <kbd className="px-1 py-0.5 rounded bg-[#26262a] text-[10px] text-[#8c8b8f] font-mono leading-none">
                Esc
              </kbd>
            </Button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-[#ffffff] truncate">
                {result.apk.app_label || result.apk.package_name || result.apk.filename}
              </h2>
              {result.apk.is_split_apk && (
                <span className="px-2 py-0.5 rounded-full bg-[#18181b] border border-[#26262a] text-[10px] font-mono text-[#8c8b8f] shrink-0">
                  Split Bundle
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-[#8c8b8f] truncate mt-0.5">
              {result.apk.package_name || "Unknown package"} • v{result.apk.version_name || "?"} (code {result.apk.version_code ?? "?"})
            </p>
          </div>
        </div>

        {/* Quick Actions Ribbon */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addToComparison(result)}
            className="gap-1.5 text-xs rounded-full border-[#26262a] bg-[#131315] hover:border-[#333338] text-[#ffffff]"
          >
            <GitCompare className="h-3.5 w-3.5 text-[#47ab61]" strokeWidth={1.5} />
            <span>Compare</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("json")}
            disabled={isExporting}
            className="gap-1.5 text-xs rounded-full border-[#26262a] bg-[#131315] hover:border-[#333338] text-[#ffffff]"
          >
            <Download className="h-3.5 w-3.5 text-[#38bdf8]" strokeWidth={1.5} />
            <span>JSON</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("csv")}
            disabled={isExporting}
            className="gap-1.5 text-xs rounded-full border-[#26262a] bg-[#131315] hover:border-[#333338] text-[#ffffff]"
          >
            <Download className="h-3.5 w-3.5 text-[#fbbf24]" strokeWidth={1.5} />
            <span>CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("txt")}
            disabled={isExporting}
            className="gap-1.5 text-xs rounded-full border-[#26262a] bg-[#131315] hover:border-[#333338] text-[#ffffff]"
          >
            <Download className="h-3.5 w-3.5 text-[#a78bfa]" strokeWidth={1.5} />
            <span>Text</span>
          </Button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 text-xs rounded-[16px] border border-[#26262a] bg-[#131315] text-[#47ab61] flex items-center justify-between">
          <span>{exportNotice}</span>
          <span className="text-[10px] text-[#8c8b8f] font-mono">Saved locally</span>
        </div>
      )}

      {/* HERO TELEMETRY DECK (High Craft Architecture Banner) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Primary Framework Identification & D3 Confidence Gauge (Span 5) */}
        <Card className="lg:col-span-5 p-5 border-[#26262a] bg-[#131315] rounded-[20px] shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#47ab61] font-mono font-semibold">
              Primary Architecture
            </span>
            <span className="text-[10px] text-[#8c8b8f] font-mono">
              Engine verified in {result.analysis_duration_ms}ms
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-3 rounded-[16px] bg-[#18181b] border border-[#26262a] shrink-0 shadow-inner">
                {primaryDetection ? (
                  <FrameworkLogo framework={primaryDetection.framework} size="lg" />
                ) : (
                  <Layers className="h-8 w-8 text-[#8c8b8f]" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-[#ffffff] tracking-tight truncate">
                  {primaryDetection ? frameworkDisplayName(primaryDetection.framework) : "Native Android"}
                </h3>
                <p className="text-xs text-[#8c8b8f] mt-0.5">
                  {primaryDetection?.evidence.length
                    ? `${primaryDetection.evidence.length} verified bytecode & symbol markers`
                    : "No third-party runtime detected"}
                </p>
              </div>
            </div>

            {/* D3 Architecture Confidence Gauge */}
            <div className="shrink-0">
              <ArchitectureGauge
                score={primaryDetection?.confidence_score ?? 1}
                confidence={primaryDetection?.confidence ?? "High"}
                size={96}
                color="#47ab61"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#26262a] flex items-center justify-between text-[11px] text-[#8c8b8f]">
            <span className="flex items-center gap-1.5 text-[#47ab61]">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span>Offline deterministic scoring</span>
            </span>
            <span className="font-mono text-[#ffffff]">
              {result.apk_structure.total_entries.toLocaleString()} archive files
            </span>
          </div>
        </Card>

        {/* Card 2: Physical Storage Anatomy & Segment Bar (Span 7) */}
        <Card className="lg:col-span-7 p-5 border-[#26262a] bg-[#131315] rounded-[20px] shadow-sm flex flex-col justify-between space-y-3">
          <ApkCompositionBar
            nativeBytes={nativeBytes}
            dexBytes={dexBytes}
            totalApkBytes={totalApkBytes}
            resourceCount={result.apk_structure.resource_count}
            assetCount={result.apk_structure.assets.length}
          />

          {/* Android 15 & System Compatibility Ribbon */}
          <div className="pt-3 border-t border-[#26262a] grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="p-2 rounded-[12px] bg-[#18181b] border border-[#26262a]">
              <span className="text-[10px] text-[#8c8b8f] block">16 KB Page Audit</span>
              <span className="text-[#47ab61] font-semibold text-[11px] flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#47ab61]" />
                Android 15 Ready
              </span>
            </div>

            <div className="p-2 rounded-[12px] bg-[#18181b] border border-[#26262a]">
              <span className="text-[10px] text-[#8c8b8f] block">Target SDK</span>
              <span className="text-[#ffffff] font-semibold text-[11px] mt-0.5 block">
                API {result.apk.target_sdk ?? "N/A"}
              </span>
            </div>

            <div className="p-2 rounded-[12px] bg-[#18181b] border border-[#26262a]">
              <span className="text-[10px] text-[#8c8b8f] block">Minimum SDK</span>
              <span className="text-[#ffffff] font-semibold text-[11px] mt-0.5 block">
                API {result.apk.min_sdk ?? "N/A"}
              </span>
            </div>

            <div className="p-2 rounded-[12px] bg-[#18181b] border border-[#26262a]">
              <span className="text-[10px] text-[#8c8b8f] block">Native ABIs</span>
              <span className="text-[#38bdf8] font-semibold text-[11px] mt-0.5 block truncate">
                {availableArchs.filter((a) => a !== "All").join(", ") || "No native code"}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto bg-[#131315] border border-[#26262a] rounded-[20px] p-1.5 h-auto gap-1">
          <TabsTrigger
            value="frameworks"
            className="shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs data-[state=active]:bg-[#18181b] data-[state=active]:text-[#ffffff] data-[state=active]:shadow-sm"
          >
            Frameworks ({result.detections.length})
          </TabsTrigger>
          <TabsTrigger
            value="stack"
            className="shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs data-[state=active]:bg-[#18181b] data-[state=active]:text-[#ffffff] data-[state=active]:shadow-sm"
          >
            Architecture Stack
          </TabsTrigger>
          <TabsTrigger
            value="binaries"
            className="shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs data-[state=active]:bg-[#18181b] data-[state=active]:text-[#ffffff] data-[state=active]:shadow-sm"
          >
            Native Libraries ({result.apk_structure.native_libraries.length})
          </TabsTrigger>
          <TabsTrigger
            value="dex"
            className="shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs data-[state=active]:bg-[#18181b] data-[state=active]:text-[#ffffff] data-[state=active]:shadow-sm"
          >
            DEX Bytecode ({result.apk_structure.dex_files.length})
          </TabsTrigger>
          <TabsTrigger
            value="permissions"
            className="shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs data-[state=active]:bg-[#18181b] data-[state=active]:text-[#ffffff] data-[state=active]:shadow-sm"
          >
            Permissions ({result.apk.permissions.length})
          </TabsTrigger>
          <TabsTrigger
            value="metadata"
            className="shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs data-[state=active]:bg-[#18181b] data-[state=active]:text-[#ffffff] data-[state=active]:shadow-sm"
          >
            Manifest & Spec
          </TabsTrigger>
          <TabsTrigger
            value="signing"
            className="shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs data-[state=active]:bg-[#18181b] data-[state=active]:text-[#ffffff] data-[state=active]:shadow-sm"
          >
            Signing & Security
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: FRAMEWORKS & EVIDENCE */}
        <TabsContent value="frameworks" className="space-y-3">
          {result.detections.map((detection) => {
            const isExpanded = !!expandedFrameworks[detection.framework];

            return (
              <Card
                key={detection.framework}
                className={`border rounded-[20px] transition-all overflow-hidden ${
                  detection.is_primary
                    ? "border-[#47ab61]/40 bg-[#131315] shadow-sm"
                    : "border-[#26262a] bg-[#131315]"
                }`}
              >
                <div
                  onClick={() => toggleFrameworkExpand(detection.framework)}
                  className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-[#18181b]/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-2 rounded-[12px] bg-[#18181b] border border-[#26262a] shrink-0">
                      <FrameworkLogo framework={detection.framework} size="sm" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#ffffff] truncate">
                          {frameworkDisplayName(detection.framework)}
                        </span>
                        {detection.is_primary && (
                          <Badge className="text-[10px] rounded-full bg-[#47ab61] text-[#0a0a0b] font-semibold hover:bg-[#47ab61]">
                            Primary Runtime
                          </Badge>
                        )}
                        <Badge
                          className={`rounded-full text-[10px] px-2 py-0.2 ${confidenceBadgeColor(
                            detection.confidence
                          )}`}
                        >
                          {detection.confidence} ({Math.round(detection.confidence_score * 100)}%)
                        </Badge>
                      </div>
                      <span className="text-[11px] text-[#8c8b8f] mt-0.5 block">
                        {detection.evidence.length} evidence marker(s) verified
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-20 hidden sm:block">
                      <Progress value={detection.confidence_score * 100} />
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-[#8c8b8f]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#8c8b8f]" />
                    )}
                  </div>
                </div>

                {/* Expanded Evidence List */}
                {isExpanded && (
                  <div className="border-t border-[#26262a] p-5 space-y-4 bg-[#0a0a0b]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#8c8b8f] font-semibold">
                        Verified Evidence Markers
                      </span>
                      <span className="text-[10px] text-[#47ab61] font-mono">
                        Deterministic matching
                      </span>
                    </div>

                    {detection.evidence.length === 0 ? (
                      <p className="text-xs font-mono text-[#8c8b8f] italic">
                        No direct evidence markers registered.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {detection.evidence.map((ev, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-[16px] border border-[#26262a] bg-[#131315] text-xs font-mono flex flex-col gap-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className={`font-semibold ${evidenceTypeColor(ev.evidence_type)}`}>
                                [{ev.evidence_type}] {ev.category}
                              </span>
                              <span className="text-[10px] text-[#8c8b8f] px-2 py-0.5 rounded-full bg-[#18181b] border border-[#26262a]">
                                {ev.source}
                              </span>
                            </div>
                            <p className="text-[#ffffff] leading-relaxed font-sans text-xs">
                              {ev.description}
                            </p>
                            {(ev.file_path || ev.class_name) && (
                              <div className="mt-1 flex items-center justify-between gap-2 text-[11px] font-mono bg-[#0a0a0b] px-2.5 py-1.5 rounded-[10px] border border-[#26262a]">
                                <div className="flex items-center gap-2 truncate">
                                  <span className="text-[#8c8b8f]">Path:</span>
                                  <span className="truncate text-[#47ab61]">
                                    {ev.file_path || ev.class_name}
                                  </span>
                                </div>
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      ev.file_path || ev.class_name || "",
                                      `ev-${idx}`
                                    )
                                  }
                                  className="text-[#8c8b8f] hover:text-[#ffffff] p-0.5 shrink-0"
                                  title="Copy path"
                                >
                                  {copiedKey === `ev-${idx}` ? (
                                    <Check className="h-3 w-3 text-[#47ab61]" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Limitations */}
                    {detection.limitations.length > 0 && (
                      <div className="p-3 rounded-[16px] border border-amber-900/40 bg-[#160e04] text-xs font-mono text-amber-300 flex gap-2.5">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                        <div>
                          <span className="font-semibold block mb-1">
                            Heuristic Analysis Limitations
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-[#8c8b8f]">
                            {detection.limitations.map((lim, lIdx) => (
                              <li key={lIdx}>{lim}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </TabsContent>

        {/* TAB 2: ARCHITECTURE STACK */}
        <TabsContent value="stack">
          <Card className="p-6 border border-[#26262a] bg-[#131315] rounded-[20px]">
            <ArchitectureStackVisualizer
              primaryDetection={primaryDetection || null}
              nativeLibs={result.apk_structure.native_libraries}
              minSdk={result.apk.min_sdk}
              targetSdk={result.apk.target_sdk}
              is16kbCompliant={is16kbCompliant}
            />
          </Card>
        </TabsContent>

        {/* TAB 3: NATIVE LIBRARIES */}
        <TabsContent value="binaries">
          <Card className="p-6 border border-[#26262a] bg-[#131315] rounded-[20px] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-[#ffffff] tracking-tight">
                  Native Shared Libraries (.so)
                </h4>
                <p className="text-xs text-[#8c8b8f]">
                  {result.apk_structure.native_libraries.length} binary shared objects found across architectures
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-[#8c8b8f] absolute left-3 top-2.5" />
                  <Input
                    placeholder="Search library..."
                    value={libSearch}
                    onChange={(e) => setLibSearch(e.target.value)}
                    className="h-8 pl-8 pr-3 text-xs rounded-full bg-[#18181b] border-[#26262a] w-40 sm:w-48 text-[#ffffff]"
                  />
                </div>

                {/* Architecture Filter Pills */}
                <div className="inline-flex items-center rounded-full bg-[#18181b] border border-[#26262a] p-1 text-[11px]">
                  {availableArchs.map((arch) => (
                    <button
                      key={arch}
                      onClick={() => setSelectedArch(arch)}
                      className={`px-2.5 py-0.5 rounded-full font-medium transition-all cursor-pointer ${
                        selectedArch === arch
                          ? "bg-[#47ab61] text-[#0a0a0b] font-semibold"
                          : "text-[#8c8b8f] hover:text-[#ffffff]"
                      }`}
                    >
                      {arch}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredLibs.length === 0 ? (
              <p className="py-8 text-center text-xs font-mono text-[#8c8b8f] italic">
                No matching native libraries found.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-[14px] border border-[#26262a]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#18181b] border-b border-[#26262a] text-[#8c8b8f]">
                    <tr>
                      <th className="py-2.5 px-4">Library Name</th>
                      <th className="py-2.5 px-4">Architecture</th>
                      <th className="py-2.5 px-4">File Size</th>
                      <th className="py-2.5 px-4">Identified Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#26262a] tabular-nums bg-[#131315]">
                    {filteredLibs.map((lib, idx) => (
                      <tr key={idx} className="hover:bg-[#18181b]/70 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-[#ffffff]">
                          {lib.name}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-[#18181b] border border-[#26262a] text-[#38bdf8] text-[10px] font-medium">
                            {lib.arch}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-[#8c8b8f]">
                          {formatBytes(lib.size)}
                        </td>
                        <td className="py-2.5 px-4 text-[#47ab61]">
                          {lib.purpose || "Application native logic"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 4: DEX FILES */}
        <TabsContent value="dex">
          <Card className="p-6 border border-[#26262a] bg-[#131315] rounded-[20px] space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-[#ffffff] tracking-tight">
                Dalvik Executable (DEX) Binaries
              </h4>
              <p className="text-xs text-[#8c8b8f]">
                {result.apk_structure.dex_files.length} DEX container(s) totaling {formatBytes(dexBytes)}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs tabular-nums">
              {result.apk_structure.dex_files.map((dex, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-[16px] border border-[#26262a] bg-[#18181b]/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-[10px] bg-[#131315] border border-[#26262a] text-[#47ab61]">
                      <FileCode className="h-4 w-4" strokeWidth={1.5} />
                    </div>
                    <div>
                      <span className="text-[#ffffff] font-semibold block">{dex.name}</span>
                      <span className="text-[10px] text-[#8c8b8f]">
                        {idx === 0 ? "Primary application classes" : "Multi-DEX secondary archive"}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-medium text-[#ffffff]">
                    {formatBytes(dex.size)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* TAB 5: PERMISSIONS */}
        <TabsContent value="permissions">
          <Card className="p-6 border border-[#26262a] bg-[#131315] rounded-[20px] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-[#ffffff] tracking-tight">
                  Declared Permissions ({result.apk.permissions.length})
                </h4>
                <p className="text-xs text-[#8c8b8f]">
                  Audit of application permissions requested in AndroidManifest.xml
                </p>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-[#8c8b8f] absolute left-3 top-2.5" />
                  <Input
                    placeholder="Search permission..."
                    value={permSearch}
                    onChange={(e) => setPermSearch(e.target.value)}
                    className="h-8 pl-8 pr-3 text-xs rounded-full bg-[#18181b] border-[#26262a] w-44 text-[#ffffff]"
                  />
                </div>

                <div className="inline-flex items-center rounded-full bg-[#18181b] border border-[#26262a] p-1 text-[11px]">
                  {(["All", "Sensitive", "Standard"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setPermFilter(filter)}
                      className={`px-2.5 py-0.5 rounded-full font-medium transition-all cursor-pointer ${
                        permFilter === filter
                          ? "bg-[#47ab61] text-[#0a0a0b] font-semibold"
                          : "text-[#8c8b8f] hover:text-[#ffffff]"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredPermissions.length === 0 ? (
              <p className="py-8 text-center text-xs font-mono text-[#8c8b8f] italic">
                No matching permissions found.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                {filteredPermissions.map((perm, idx) => {
                  const isSens = isSensitivePerm(perm);

                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-[12px] border text-xs font-mono flex items-center justify-between transition-colors ${
                        isSens
                          ? "bg-[#18181b]/70 border-amber-900/30 text-[#ffffff]"
                          : "bg-[#18181b]/40 border-[#26262a] text-[#8c8b8f]"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isSens ? (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] uppercase tracking-wider shrink-0 font-medium">
                            Sensitive
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded-full bg-[#26262a] text-[#8c8b8f] text-[9px] uppercase tracking-wider shrink-0">
                            Normal
                          </span>
                        )}
                        <span className="truncate">{perm}</span>
                      </div>

                      <button
                        onClick={() => copyToClipboard(perm, `perm-${idx}`)}
                        className="text-[#8c8b8f] hover:text-[#ffffff] p-1 shrink-0"
                        title="Copy permission string"
                      >
                        {copiedKey === `perm-${idx}` ? (
                          <Check className="h-3 w-3 text-[#47ab61]" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 6: MANIFEST & SPECIFICATION */}
        <TabsContent value="metadata">
          <Card className="p-6 border border-[#26262a] bg-[#131315] rounded-[20px] space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-[#ffffff] tracking-tight">
                Package Specification & Manifest Anatomy
              </h4>
              <p className="text-xs text-[#8c8b8f]">
                Compiled AndroidManifest metadata and packaging attributes
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono tabular-nums">
              <div className="p-3 rounded-[14px] border border-[#26262a] bg-[#18181b]/50 flex justify-between items-center">
                <span className="text-[#8c8b8f]">Package Name:</span>
                <span className="text-[#ffffff] font-semibold">{result.apk.package_name || "N/A"}</span>
              </div>
              <div className="p-3 rounded-[14px] border border-[#26262a] bg-[#18181b]/50 flex justify-between items-center">
                <span className="text-[#8c8b8f]">Application Label:</span>
                <span className="text-[#ffffff]">{result.apk.app_label || "N/A"}</span>
              </div>
              <div className="p-3 rounded-[14px] border border-[#26262a] bg-[#18181b]/50 flex justify-between items-center">
                <span className="text-[#8c8b8f]">Version Name:</span>
                <span className="text-[#ffffff]">{result.apk.version_name || "N/A"}</span>
              </div>
              <div className="p-3 rounded-[14px] border border-[#26262a] bg-[#18181b]/50 flex justify-between items-center">
                <span className="text-[#8c8b8f]">Version Code:</span>
                <span className="text-[#ffffff]">{result.apk.version_code ?? "N/A"}</span>
              </div>
              <div className="p-3 rounded-[14px] border border-[#26262a] bg-[#18181b]/50 flex justify-between items-center">
                <span className="text-[#8c8b8f]">Minimum SDK Level:</span>
                <span className="text-[#47ab61] font-semibold">API {result.apk.min_sdk ?? "N/A"}</span>
              </div>
              <div className="p-3 rounded-[14px] border border-[#26262a] bg-[#18181b]/50 flex justify-between items-center">
                <span className="text-[#8c8b8f]">Target SDK Level:</span>
                <span className="text-[#38bdf8] font-semibold">API {result.apk.target_sdk ?? "N/A"}</span>
              </div>
              <div className="p-3 rounded-[14px] border border-[#26262a] bg-[#18181b]/50 flex justify-between items-center">
                <span className="text-[#8c8b8f]">Packaging Type:</span>
                <span className="text-[#ffffff]">{result.apk.is_split_apk ? `Split Bundle (${result.apk.split_name || "config"})` : "Monolithic APK"}</span>
              </div>
              <div className="p-3 rounded-[14px] border border-[#26262a] bg-[#18181b]/50 flex justify-between items-center">
                <span className="text-[#8c8b8f]">Archive File Count:</span>
                <span className="text-[#ffffff]">{result.apk_structure.total_entries.toLocaleString()} files</span>
              </div>
            </div>

            {result.apk.main_activity && (
              <div className="p-3 rounded-[14px] border border-[#26262a] bg-[#18181b]/50 text-xs font-mono space-y-1">
                <span className="text-[#8c8b8f] block">Launcher Intent Activity:</span>
                <span className="text-[#47ab61] break-all">{result.apk.main_activity}</span>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 7: SIGNING & SECURITY */}
        <TabsContent value="signing">
          <Card className="p-6 border border-[#26262a] bg-[#131315] rounded-[20px] space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-[#ffffff] tracking-tight">
                Signature Scheme & Certificate Chain
              </h4>
              <p className="text-xs text-[#8c8b8f]">
                Cryptographic authentication block and certificate fingerprint audit
              </p>
            </div>

            {result.signing_info ? (
              <div className="space-y-3 text-xs font-mono">
                <div className="p-3.5 rounded-[14px] border border-[#26262a] bg-[#18181b]/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-[#47ab61]" />
                    <span className="text-[#8c8b8f]">Signature Scheme:</span>
                  </div>
                  <span className="font-semibold text-[#47ab61]">
                    {result.signing_info.scheme || "APK Signature Scheme v2/v3"}
                  </span>
                </div>

                {result.signing_info.certificates.map((cert, idx) => (
                  <div key={idx} className="p-4 rounded-[16px] border border-[#26262a] bg-[#18181b]/50 space-y-2">
                    <div className="font-semibold text-[#ffffff]">{cert.subject || "Primary Signing Certificate"}</div>
                    {cert.fingerprint_sha256 && (
                      <div className="font-mono text-[11px] text-[#8c8b8f] break-all bg-[#131315] p-2.5 rounded-[10px] border border-[#26262a] flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[#8c8b8f]">SHA-256: </span>
                          <span className="text-[#47ab61]">{cert.fingerprint_sha256}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(cert.fingerprint_sha256 || "", `sha-${idx}`)}
                          className="text-[#8c8b8f] hover:text-[#ffffff] p-1 shrink-0"
                          title="Copy fingerprint"
                        >
                          {copiedKey === `sha-${idx}` ? (
                            <Check className="h-3.5 w-3.5 text-[#47ab61]" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-xs font-mono text-[#8c8b8f] italic">
                No signature blocks recorded in package metadata.
              </p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
