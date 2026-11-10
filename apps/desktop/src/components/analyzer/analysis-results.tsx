import React, { useState } from "react";
import {
  ShieldAlert,
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
  HelpCircle,
} from "lucide-react";
import type { AnalysisResult, FrameworkDetection, Evidence } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  const { addToComparison } = useAppStore();

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
      setExportNotice(`Exported successfully to ${fileName}`);
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

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              ← Back
            </Button>
          )}
          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
              {result.apk.app_label || result.apk.package_name || result.apk.filename}
            </h2>
            <p className="text-xs font-mono text-neutral-400">
              {result.apk.package_name || "Unknown Package"} • v{result.apk.version_name || "?"} (code {result.apk.version_code ?? "?"})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addToComparison(result)}
            className="gap-1.5 text-xs border-neutral-700"
          >
            <GitCompare className="h-3.5 w-3.5 text-indigo-400" />
            Add to Compare
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("json")}
            disabled={isExporting}
            className="gap-1.5 text-xs border-neutral-700"
          >
            <Download className="h-3.5 w-3.5" />
            JSON
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("csv")}
            disabled={isExporting}
            className="gap-1.5 text-xs border-neutral-700"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("txt")}
            disabled={isExporting}
            className="gap-1.5 text-xs border-neutral-700"
          >
            <Download className="h-3.5 w-3.5" />
            Text
          </Button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 text-xs rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
          {exportNotice}
        </div>
      )}

      {/* Primary Framework Highlight Banner */}
      <Card className="border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 via-neutral-900 to-neutral-900 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">
                Primary Architecture & Framework
              </span>
              {primaryDetection && (
                <Badge className={confidenceBadgeColor(primaryDetection.confidence)}>
                  {primaryDetection.confidence} Confidence ({Math.round(primaryDetection.confidence_score * 100)}%)
                </Badge>
              )}
            </div>
            <h3 className="text-2xl font-black text-neutral-100 flex items-center gap-2">
              {primaryDetection ? frameworkDisplayName(primaryDetection.framework) : "Unknown Runtime"}
            </h3>
            <p className="text-xs text-neutral-400 max-w-2xl">
              {primaryDetection?.evidence.length
                ? `Identified based on ${primaryDetection.evidence.length} verified structural and binary indicator(s).`
                : "No verified framework signatures found; application may use custom C++ or obfuscated runtime."}
            </p>
          </div>

          <div className="flex flex-col md:items-end gap-1.5 text-xs font-mono text-neutral-400 border-t md:border-t-0 md:border-l border-neutral-800 pt-3 md:pt-0 md:pl-6">
            <div>Size: <span className="text-neutral-200">{formatBytes(result.apk.file_size)}</span></div>
            <div>Min SDK: <span className="text-neutral-200">{result.apk.min_sdk ?? "N/A"}</span> • Target: <span className="text-neutral-200">{result.apk.target_sdk ?? "N/A"}</span></div>
            <div>Inspection: <span className="text-neutral-200">{result.analysis_duration_ms}ms</span></div>
          </div>
        </div>
      </Card>

      {/* Detailed Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto bg-neutral-900 border border-neutral-800">
          <TabsTrigger value="frameworks">
            Frameworks ({result.detections.length})
          </TabsTrigger>
          <TabsTrigger value="metadata">Overview & Manifest</TabsTrigger>
          <TabsTrigger value="binaries">
            Native Libraries ({result.apk_structure.native_libraries.length})
          </TabsTrigger>
          <TabsTrigger value="dex">
            DEX Files ({result.apk_structure.dex_files.length})
          </TabsTrigger>
          <TabsTrigger value="permissions">
            Permissions ({result.apk.permissions.length})
          </TabsTrigger>
          <TabsTrigger value="signing">Signing & Security</TabsTrigger>
        </TabsList>

        {/* TAB 1: FRAMEWORKS & EVIDENCE */}
        <TabsContent value="frameworks" className="space-y-4">
          {result.detections.map((detection) => {
            const isExpanded = !!expandedFrameworks[detection.framework];

            return (
              <Card
                key={detection.framework}
                className={`border transition-all ${
                  detection.is_primary
                    ? "border-indigo-500/40 bg-neutral-900/90"
                    : "border-neutral-800 bg-neutral-900/50"
                }`}
              >
                <div
                  onClick={() => toggleFrameworkExpand(detection.framework)}
                  className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-neutral-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-neutral-100">
                          {frameworkDisplayName(detection.framework)}
                        </span>
                        {detection.is_primary && (
                          <Badge variant="default" className="text-[10px]">
                            Primary
                          </Badge>
                        )}
                        <Badge className={confidenceBadgeColor(detection.confidence)}>
                          {detection.confidence} ({Math.round(detection.confidence_score * 100)}%)
                        </Badge>
                      </div>
                      <span className="text-[11px] text-neutral-400 mt-0.5">
                        {detection.evidence.length} evidence indicator(s) verified
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-24 hidden sm:block">
                      <Progress value={detection.confidence_score * 100} />
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-neutral-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-neutral-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Evidence List */}
                {isExpanded && (
                  <div className="border-t border-neutral-800/80 p-4 space-y-3 bg-neutral-950/40">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      Detection Evidence & Indicators
                    </h4>

                    {detection.evidence.length === 0 ? (
                      <p className="text-xs text-neutral-400 italic">No direct evidence indicators registered.</p>
                    ) : (
                      <div className="space-y-2">
                        {detection.evidence.map((ev, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg border border-neutral-800/80 bg-neutral-900/70 text-xs flex flex-col gap-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className={`font-semibold ${evidenceTypeColor(ev.evidence_type)}`}>
                                [{ev.evidence_type}] {ev.category}
                              </span>
                              <span className="font-mono text-[10px] text-neutral-400">
                                {ev.source}
                              </span>
                            </div>
                            <p className="text-neutral-300">{ev.description}</p>
                            {(ev.file_path || ev.class_name) && (
                              <div className="mt-1 flex items-center gap-2 text-[11px] font-mono text-neutral-400 bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
                                <span className="text-neutral-400">Ref:</span>
                                <span className="truncate">{ev.file_path || ev.class_name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Limitations */}
                    {detection.limitations.length > 0 && (
                      <div className="mt-3 p-3 rounded-lg border border-amber-900/30 bg-amber-950/20 text-xs text-amber-300/90 flex gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                        <div>
                          <span className="font-semibold block mb-0.5">Analysis Limitations:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-neutral-300">
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

        {/* TAB 2: METADATA & MANIFEST */}
        <TabsContent value="metadata">
          <Card className="p-6 space-y-4">
            <h4 className="text-sm font-semibold text-neutral-200">Package & Application Specification</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/60 flex justify-between items-center">
                <span className="text-neutral-400">Package Name:</span>
                <span className="text-neutral-100 font-semibold">{result.apk.package_name || "N/A"}</span>
              </div>
              <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/60 flex justify-between items-center">
                <span className="text-neutral-400">Application Label:</span>
                <span className="text-neutral-100">{result.apk.app_label || "N/A"}</span>
              </div>
              <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/60 flex justify-between items-center">
                <span className="text-neutral-400">Version Name:</span>
                <span className="text-neutral-100">{result.apk.version_name || "N/A"}</span>
              </div>
              <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/60 flex justify-between items-center">
                <span className="text-neutral-400">Version Code:</span>
                <span className="text-neutral-100">{result.apk.version_code ?? "N/A"}</span>
              </div>
              <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/60 flex justify-between items-center">
                <span className="text-neutral-400">Minimum SDK:</span>
                <span className="text-neutral-100">API {result.apk.min_sdk ?? "N/A"}</span>
              </div>
              <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/60 flex justify-between items-center">
                <span className="text-neutral-400">Target SDK:</span>
                <span className="text-neutral-100">API {result.apk.target_sdk ?? "N/A"}</span>
              </div>
              <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/60 flex justify-between items-center">
                <span className="text-neutral-400">Split APK:</span>
                <span className="text-neutral-100">{result.apk.is_split_apk ? `Yes (${result.apk.split_name || "config"})` : "No (Base)"}</span>
              </div>
              <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/60 flex justify-between items-center">
                <span className="text-neutral-400">Total Entries:</span>
                <span className="text-neutral-100">{result.apk_structure.total_entries.toLocaleString()} files</span>
              </div>
            </div>

            {result.apk.main_activity && (
              <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/60 text-xs">
                <span className="text-neutral-400 block mb-1">Launcher Activity:</span>
                <span className="font-mono text-indigo-400">{result.apk.main_activity}</span>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 3: NATIVE LIBRARIES */}
        <TabsContent value="binaries">
          <Card className="p-6">
            <h4 className="text-sm font-semibold text-neutral-200 mb-4">
              Native Binaries (.so) Catalog
            </h4>

            {result.apk_structure.native_libraries.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">No native libraries found in lib/ directory (pure bytecode application).</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-neutral-800 text-neutral-400 font-mono">
                    <tr>
                      <th className="py-2 pr-4">Library Name</th>
                      <th className="py-2 pr-4">Architecture</th>
                      <th className="py-2 pr-4">File Size</th>
                      <th className="py-2">Identified Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono">
                    {result.apk_structure.native_libraries.map((lib, idx) => (
                      <tr key={idx} className="hover:bg-neutral-800/30">
                        <td className="py-2 pr-4 font-semibold text-neutral-200">{lib.name}</td>
                        <td className="py-2 pr-4">
                          <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[11px]">
                            {lib.arch}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-neutral-400">{formatBytes(lib.size)}</td>
                        <td className="py-2 text-indigo-300 font-sans">{lib.purpose || "Custom native logic"}</td>
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
          <Card className="p-6">
            <h4 className="text-sm font-semibold text-neutral-200 mb-4">
              Dalvik Executable (DEX) Binaries
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              {result.apk_structure.dex_files.map((dex, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-indigo-400" />
                    <span className="text-neutral-200 font-semibold">{dex.name}</span>
                  </div>
                  <span className="text-neutral-400">{formatBytes(dex.size)}</span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* TAB 5: PERMISSIONS */}
        <TabsContent value="permissions">
          <Card className="p-6">
            <h4 className="text-sm font-semibold text-neutral-200 mb-4">
              Declared Android Permissions ({result.apk.permissions.length})
            </h4>

            {result.apk.permissions.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">No permissions declared in manifest.</p>
            ) : (
              <div className="space-y-1.5 max-h-96 overflow-y-auto pr-2">
                {result.apk.permissions.map((perm, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded border border-neutral-800/80 bg-neutral-900/50 text-xs font-mono flex items-center justify-between text-neutral-300"
                  >
                    <span>{perm}</span>
                    <button
                      onClick={() => copyToClipboard(perm, `perm-${idx}`)}
                      className="text-neutral-400 hover:text-neutral-200 p-1"
                    >
                      {copiedKey === `perm-${idx}` ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 6: SIGNING & SECURITY */}
        <TabsContent value="signing">
          <Card className="p-6 space-y-4">
            <h4 className="text-sm font-semibold text-neutral-200">
              APK Signature Scheme & Certificate Fingerprints
            </h4>

            {result.signing_info ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/60">
                  <span className="text-neutral-400 block mb-1">Signature Scheme:</span>
                  <span className="font-semibold text-emerald-400">{result.signing_info.scheme || "Unknown Scheme"}</span>
                </div>

                {result.signing_info.certificates.map((cert, idx) => (
                  <div key={idx} className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/50 space-y-2">
                    <div className="font-semibold text-neutral-200">{cert.subject || "Signature Block"}</div>
                    {cert.fingerprint_sha256 && (
                      <div className="font-mono text-[11px] text-neutral-400 break-all bg-neutral-950 p-2 rounded border border-neutral-800">
                        <span className="text-neutral-400">SHA-256: </span>
                        {cert.fingerprint_sha256}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">No legacy META-INF signature files observed in archive.</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
