import React, { useState, useEffect } from "react";
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
  ShieldCheck,
  Zap,
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
import { FrameworkLogo } from "@/components/ui/framework-logo";

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
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="text-xs h-8 px-3 rounded-full border-[#26262a] bg-[#131315] hover:bg-[#18181b] hover:border-[#333338] text-[#ffffff] gap-1.5"
              title="Return to previous screen (Esc)"
            >
              <span>Back</span>
              <kbd className="px-1 py-0.5 rounded bg-[#26262a] text-[10px] text-[#8c8b8f] font-mono leading-none">
                Esc
              </kbd>
            </Button>
          )}
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[#ffffff] flex items-center gap-2">
              {result.apk.app_label || result.apk.package_name || result.apk.filename}
            </h2>
            <p className="text-xs font-mono text-[#8c8b8f]">
              {result.apk.package_name || "Unknown package"} • v{result.apk.version_name || "?"} (code {result.apk.version_code ?? "?"})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addToComparison(result)}
            className="gap-1.5 text-xs rounded-full border-[#26262a] bg-[#131315] hover:border-[#333338]"
          >
            <GitCompare className="h-3.5 w-3.5 text-[#47ab61]" strokeWidth={1.5} />
            Compare
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("json")}
            disabled={isExporting}
            className="gap-1.5 text-xs rounded-full border-[#26262a] bg-[#131315] hover:border-[#333338]"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            JSON
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("csv")}
            disabled={isExporting}
            className="gap-1.5 text-xs rounded-full border-[#26262a] bg-[#131315] hover:border-[#333338]"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("txt")}
            disabled={isExporting}
            className="gap-1.5 text-xs rounded-full border-[#26262a] bg-[#131315] hover:border-[#333338]"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            Text
          </Button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-2.5 text-xs rounded-[16px] border border-[#26262a] bg-[#131315] text-[#47ab61]">
          {exportNotice}
        </div>
      )}

      {/* Primary Framework Highlight Banner */}
      <Card className="border border-[#26262a] bg-[#131315] rounded-[20px] p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            {primaryDetection && (
              <div className="flex shrink-0 items-center justify-center p-3 rounded-[16px] bg-[#18181b] border border-[#26262a] shadow-inner">
                <FrameworkLogo framework={primaryDetection.framework} size="lg" />
              </div>
            )}
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-[#47ab61] font-semibold">
                  Primary architecture
                </span>
                {primaryDetection && (
                  <Badge className={`rounded-full text-[10px] px-2.5 py-0.5 ${confidenceBadgeColor(primaryDetection.confidence)}`}>
                    {primaryDetection.confidence} ({Math.round(primaryDetection.confidence_score * 100)}%)
                  </Badge>
                )}
              </div>
              <h3 className="text-xl font-bold text-[#ffffff] tracking-tight truncate">
                {primaryDetection ? frameworkDisplayName(primaryDetection.framework) : "Unknown runtime"}
              </h3>
              <p className="text-xs text-[#8c8b8f] max-w-2xl">
                {primaryDetection?.evidence.length
                  ? `Identified with ${primaryDetection.evidence.length} verified structural indicators.`
                  : "No verified framework signatures found in package."}
              </p>
            </div>
          </div>

          <div className="flex flex-col md:items-end gap-1.5 text-xs text-[#8c8b8f] border-t md:border-t-0 md:border-l border-[#26262a] pt-3 md:pt-0 md:pl-6 tabular-nums shrink-0">
            <div>Package size: <span className="text-[#ffffff] font-medium">{formatBytes(result.apk.file_size)}</span></div>
            <div>Min SDK: <span className="text-[#ffffff] font-medium">{result.apk.min_sdk ?? "N/A"}</span> • Target: <span className="text-[#ffffff] font-medium">{result.apk.target_sdk ?? "N/A"}</span></div>
            <div>Inspection time: <span className="text-[#ffffff] font-medium">{result.analysis_duration_ms}ms</span></div>
          </div>
        </div>

        {/* Engine Security & Offline Guarantee Note */}
        <div className="pt-3 border-t border-[#26262a] flex items-center justify-between gap-3 text-xs text-[#8c8b8f]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#47ab61] shrink-0" strokeWidth={1.5} />
            <span className="text-[11px]">
              Built-in signatures are compiled directly into the Rust detection engine core for maximum performance, safety against regex backtracking, and deterministic offline scoring.
            </span>
          </div>
          <span className="text-[11px] text-[#47ab61] font-medium shrink-0 hidden sm:inline">
            Zero telemetry
          </span>
        </div>
      </Card>

      {/* Detailed Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto bg-[#131315] border border-[#26262a] rounded-[20px]">
          <TabsTrigger value="frameworks">
            Frameworks ({result.detections.length})
          </TabsTrigger>
          <TabsTrigger value="metadata">Manifest</TabsTrigger>
          <TabsTrigger value="binaries">
            Libraries ({result.apk_structure.native_libraries.length})
          </TabsTrigger>
          <TabsTrigger value="dex">
            DEX files ({result.apk_structure.dex_files.length})
          </TabsTrigger>
          <TabsTrigger value="permissions">
            Permissions ({result.apk.permissions.length})
          </TabsTrigger>
          <TabsTrigger value="signing">Signing</TabsTrigger>
        </TabsList>

        {/* TAB 1: FRAMEWORKS & EVIDENCE */}
        <TabsContent value="frameworks" className="space-y-3">
          {result.detections.map((detection) => {
            const isExpanded = !!expandedFrameworks[detection.framework];

            return (
              <Card
                key={detection.framework}
                className={`border rounded-[20px] transition-colors ${
                  detection.is_primary
                    ? "border-[#47ab61]/40 bg-[#131315]"
                    : "border-[#26262a] bg-[#131315]"
                }`}
              >
                <div
                  onClick={() => toggleFrameworkExpand(detection.framework)}
                  className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-neutral-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex shrink-0 items-center justify-center p-2 rounded-[12px] bg-[#18181b] border border-[#26262a]">
                      <FrameworkLogo framework={detection.framework} size="sm" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#ffffff]">
                          {frameworkDisplayName(detection.framework)}
                        </span>
                        {detection.is_primary && (
                          <Badge variant="default" className="text-[10px] rounded-full bg-[#47ab61] text-[#0a0a0b] font-semibold">
                            Primary
                          </Badge>
                        )}
                        <Badge className={`rounded-full text-[10px] ${confidenceBadgeColor(detection.confidence)}`}>
                          {detection.confidence} ({Math.round(detection.confidence_score * 100)}%)
                        </Badge>
                      </div>
                      <span className="text-[11px] text-[#8c8b8f] mt-0.5">
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
                  <div className="border-t border-[#26262a] p-4 space-y-3 bg-[#0a0a0b]">
                    <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#8c8b8f]">
                      Evidence indicators
                    </h4>

                    {detection.evidence.length === 0 ? (
                      <p className="text-xs font-mono text-[#8c8b8f] italic">No direct evidence indicators registered.</p>
                    ) : (
                      <div className="space-y-2">
                        {detection.evidence.map((ev, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-[20px] border border-[#26262a] bg-[#131315] text-xs font-mono flex flex-col gap-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className={`font-semibold ${evidenceTypeColor(ev.evidence_type)}`}>
                                [{ev.evidence_type}] {ev.category}
                              </span>
                              <span className="text-[10px] text-[#8c8b8f]">
                                {ev.source}
                              </span>
                            </div>
                            <p className="text-[#ffffff]">{ev.description}</p>
                            {(ev.file_path || ev.class_name) && (
                              <div className="mt-1 flex items-center gap-2 text-[11px] font-mono text-[#8c8b8f] bg-[#0a0a0b] px-2 py-1 rounded-full border border-[#26262a]">
                                <span className="text-[#8c8b8f]">Ref:</span>
                                <span className="truncate text-[#ffffff]">{ev.file_path || ev.class_name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Limitations */}
                    {detection.limitations.length > 0 && (
                      <div className="mt-2.5 p-2.5 rounded-[20px] border border-amber-900/30 bg-[#160e04] text-xs font-mono text-amber-300 flex gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                        <div>
                          <span className="font-semibold block mb-0.5">Limitations</span>
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

        {/* TAB 2: METADATA & MANIFEST */}
        <TabsContent value="metadata">
          <Card className="p-5 border border-[#26262a] bg-[#131315] rounded-[20px] space-y-4">
            <h4 className="text-xs font-mono font-medium text-[#ffffff]">Package specification</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono tabular-nums">
              <div className="p-2.5 rounded-[20px] border border-[#26262a] bg-[#0a0a0b] flex justify-between items-center">
                <span className="text-[#8c8b8f]">Package Name:</span>
                <span className="text-[#ffffff] font-semibold">{result.apk.package_name || "N/A"}</span>
              </div>
              <div className="p-2.5 rounded-[20px] border border-[#26262a] bg-[#0a0a0b] flex justify-between items-center">
                <span className="text-[#8c8b8f]">Application Label:</span>
                <span className="text-[#ffffff]">{result.apk.app_label || "N/A"}</span>
              </div>
              <div className="p-2.5 rounded-[20px] border border-[#26262a] bg-[#0a0a0b] flex justify-between items-center">
                <span className="text-[#8c8b8f]">Version Name:</span>
                <span className="text-[#ffffff]">{result.apk.version_name || "N/A"}</span>
              </div>
              <div className="p-2.5 rounded-[20px] border border-[#26262a] bg-[#0a0a0b] flex justify-between items-center">
                <span className="text-[#8c8b8f]">Version Code:</span>
                <span className="text-[#ffffff]">{result.apk.version_code ?? "N/A"}</span>
              </div>
              <div className="p-2.5 rounded-[20px] border border-[#26262a] bg-[#0a0a0b] flex justify-between items-center">
                <span className="text-[#8c8b8f]">Minimum SDK:</span>
                <span className="text-[#ffffff]">API {result.apk.min_sdk ?? "N/A"}</span>
              </div>
              <div className="p-2.5 rounded-[20px] border border-[#26262a] bg-[#0a0a0b] flex justify-between items-center">
                <span className="text-[#8c8b8f]">Target SDK:</span>
                <span className="text-[#ffffff]">API {result.apk.target_sdk ?? "N/A"}</span>
              </div>
              <div className="p-2.5 rounded-[20px] border border-[#26262a] bg-[#0a0a0b] flex justify-between items-center">
                <span className="text-[#8c8b8f]">Split APK:</span>
                <span className="text-[#ffffff]">{result.apk.is_split_apk ? `Yes (${result.apk.split_name || "config"})` : "No (Base)"}</span>
              </div>
              <div className="p-2.5 rounded-[20px] border border-[#26262a] bg-[#0a0a0b] flex justify-between items-center">
                <span className="text-[#8c8b8f]">Total Entries:</span>
                <span className="text-[#ffffff]">{result.apk_structure.total_entries.toLocaleString()} files</span>
              </div>
            </div>

            {result.apk.main_activity && (
              <div className="p-2.5 rounded-[20px] border border-[#26262a] bg-[#0a0a0b] text-xs font-mono">
                <span className="text-[#8c8b8f] block mb-1">Launcher activity:</span>
                <span className="text-[#47ab61]">{result.apk.main_activity}</span>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 3: NATIVE LIBRARIES */}
        <TabsContent value="binaries">
          <Card className="p-5 border border-[#26262a] bg-[#131315] rounded-[20px]">
            <h4 className="text-xs font-mono font-medium text-[#ffffff] mb-3">
              Native libraries (.so)
            </h4>

            {result.apk_structure.native_libraries.length === 0 ? (
              <p className="text-xs font-mono text-[#8c8b8f] italic">No native libraries found in lib/ directory.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="border-b border-[#26262a] text-[#8c8b8f]">
                    <tr>
                      <th className="py-2 pr-4">Library name</th>
                      <th className="py-2 pr-4">Architecture</th>
                      <th className="py-2 pr-4">File size</th>
                      <th className="py-2">Identified purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#26262a] tabular-nums">
                    {result.apk_structure.native_libraries.map((lib, idx) => (
                      <tr key={idx} className="hover:bg-[#18181b] transition-colors">
                        <td className="py-2 pr-4 font-medium text-[#ffffff]">{lib.name}</td>
                        <td className="py-2 pr-4">
                          <span className="px-1.5 py-0.5 rounded-full bg-[#0a0a0b] border border-[#26262a] text-[#8c8b8f] text-[10px]">
                            {lib.arch}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-[#8c8b8f]">{formatBytes(lib.size)}</td>
                        <td className="py-2 text-[#47ab61]">{lib.purpose || "Custom native logic"}</td>
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
          <Card className="p-5 border border-[#26262a] bg-[#131315] rounded-[20px]">
            <h4 className="text-xs font-mono font-medium text-[#ffffff] mb-3">
              Dalvik executable (DEX) binaries
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-mono text-xs tabular-nums">
              {result.apk_structure.dex_files.map((dex, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-[20px] border border-[#26262a] bg-[#0a0a0b] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <FileCode className="h-3.5 w-3.5 text-[#47ab61]" strokeWidth={1.5} />
                    <span className="text-[#ffffff]">{dex.name}</span>
                  </div>
                  <span className="text-[#8c8b8f]">{formatBytes(dex.size)}</span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* TAB 5: PERMISSIONS */}
        <TabsContent value="permissions">
          <Card className="p-5 border border-[#26262a] bg-[#131315] rounded-[20px]">
            <h4 className="text-xs font-mono font-medium text-[#ffffff] mb-3">
              Declared permissions ({result.apk.permissions.length})
            </h4>

            {result.apk.permissions.length === 0 ? (
              <p className="text-xs font-mono text-[#8c8b8f] italic">No permissions declared in manifest.</p>
            ) : (
              <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
                {result.apk.permissions.map((perm, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-full border border-[#26262a] bg-[#0a0a0b] text-xs font-mono flex items-center justify-between text-[#ffffff]"
                  >
                    <span className="truncate">{perm}</span>
                    <button
                      onClick={() => copyToClipboard(perm, `perm-${idx}`)}
                      className="text-[#8c8b8f] hover:text-[#ffffff] p-1"
                    >
                      {copiedKey === `perm-${idx}` ? (
                        <Check className="h-3 w-3 text-[#47ab61]" />
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
          <Card className="p-5 border border-[#26262a] bg-[#131315] rounded-[20px] space-y-3">
            <h4 className="text-xs font-mono font-medium text-[#ffffff]">
              Signature scheme and certificates
            </h4>

            {result.signing_info ? (
              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-[20px] border border-[#26262a] bg-[#0a0a0b]">
                  <span className="text-[#8c8b8f] block mb-0.5">Signature Scheme:</span>
                  <span className="font-semibold text-[#47ab61]">{result.signing_info.scheme || "Unknown Scheme"}</span>
                </div>

                {result.signing_info.certificates.map((cert, idx) => (
                  <div key={idx} className="p-3 rounded-[20px] border border-[#26262a] bg-[#0a0a0b] space-y-1.5">
                    <div className="font-medium text-[#ffffff]">{cert.subject || "Signature Block"}</div>
                    {cert.fingerprint_sha256 && (
                      <div className="font-mono text-[10px] text-[#8c8b8f] break-all bg-[#131315] p-2 rounded-full border border-[#26262a]">
                        <span className="text-[#8c8b8f]">SHA-256: </span>
                        {cert.fingerprint_sha256}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-[#8c8b8f] italic">No legacy META-INF signature files observed in archive.</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
