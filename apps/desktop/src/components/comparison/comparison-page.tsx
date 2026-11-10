import React, { useState, useEffect } from "react";
import {
  GitCompare,
  Plus,
  Trash2,
  AlertCircle,
  FileSearch,
  CheckCircle2,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  formatBytes,
  frameworkDisplayName,
  confidenceBadgeColor,
} from "@/lib/utils";
import * as commands from "@/lib/commands";
import type { AnalysisResult } from "@/types";

export function ComparisonPage() {
  const { comparisonItems, removeFromComparison, clearComparison, history, loadHistory } =
    useAppStore();

  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    loadHistory(20);
  }, []);

  const addFromHistory = async (id: string) => {
    try {
      const res = await commands.getAnalysisById(id);
      if (res) {
        useAppStore.getState().addToComparison(res);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <Card className="p-4 border-[#26262a] bg-[#131315] rounded-[20px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-mono font-medium text-[#ffffff] flex items-center gap-2">
              <GitCompare className="h-3.5 w-3.5 text-[#47ab61]" strokeWidth={1.5} />
              Comparison studio
            </h3>
            <p className="text-[11px] font-mono text-[#8c8b8f] mt-0.5">
              Compare 2 to 4 application packages side-by-side to inspect architectural variations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setHistoryOpen(!historyOpen)}
              className="text-xs font-mono h-8 gap-1.5 border-[#26262a] bg-[#0a0a0b] rounded-[20px] hover:border-[#333338]"
            >
              <Plus className="h-3.5 w-3.5 text-[#47ab61]" strokeWidth={1.5} />
              Add from history
            </Button>

            {comparisonItems.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={clearComparison}
                className="text-xs font-mono h-8 text-rose-400 hover:text-rose-300 border-[#26262a] bg-[#0a0a0b] rounded-[20px]"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* History Quick Picker Dropdown */}
        {historyOpen && (
          <div className="mt-3 pt-3 border-t border-[#26262a] space-y-2">
            <h4 className="text-xs font-mono font-medium text-[#ffffff]">
              Select previous analysis:
            </h4>
            {history.length === 0 ? (
              <p className="text-xs font-mono text-[#8c8b8f] italic">No previous analyses found in history.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {history.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => {
                      addFromHistory(h.id);
                      setHistoryOpen(false);
                    }}
                    className="p-2.5 rounded-[20px] border border-[#26262a] bg-[#0a0a0b] hover:border-[#47ab61] cursor-pointer text-xs font-mono transition-colors flex items-center justify-between"
                  >
                    <div className="truncate pr-2">
                      <div className="font-medium text-[#ffffff] truncate">
                        {h.filename}
                      </div>
                      <div className="text-[10px] text-[#8c8b8f] truncate">
                        {h.package_name || "N/A"}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] shrink-0">
                      {h.primary_framework ? frameworkDisplayName(h.primary_framework) : "Unknown"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Comparison Grid */}
      {comparisonItems.length === 0 ? (
        <Card className="p-12 border-[#26262a] bg-[#131315] rounded-[20px] text-center space-y-2">
          <GitCompare className="h-8 w-8 text-[#333338] mx-auto" strokeWidth={1.5} />
          <h4 className="text-xs font-mono font-medium text-[#ffffff]">
            No packages selected
          </h4>
          <p className="text-xs font-mono text-[#8c8b8f] max-w-md mx-auto">
            Inspect an APK and select "Compare", or choose "Add from history" above.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-mono border-collapse border border-[#26262a]">
            <thead>
              <tr className="border-b border-[#26262a]">
                <th className="p-3 bg-[#0a0a0b] text-[#8c8b8f] w-40">
                  Attribute
                </th>
                {comparisonItems.map((item) => (
                  <th
                    key={item.analysis_id}
                    className="p-3 bg-[#131315] border-l border-[#26262a] min-w-56 max-w-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-xs text-[#ffffff] truncate">
                          {item.apk.app_label || item.apk.package_name || item.apk.filename}
                        </h4>
                        <p className="text-[10px] text-[#8c8b8f] truncate mt-0.5">
                          {item.apk.package_name || item.apk.filename}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromComparison(item.analysis_id)}
                        className="text-[#8c8b8f] hover:text-rose-400 p-1"
                        title="Remove from comparison"
                      >
                        <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#26262a] tabular-nums">
              {/* Primary Framework */}
              <tr className="hover:bg-[#18181b] transition-colors">
                <td className="p-2.5 bg-[#0a0a0b] text-[#8c8b8f]">
                  Primary Framework
                </td>
                {comparisonItems.map((item) => {
                  const p = item.detections.find((d) => d.is_primary);
                  return (
                    <td key={item.analysis_id} className="p-2.5 border-l border-[#26262a]">
                      <span className="font-medium text-[#47ab61] text-xs block">
                        {p ? frameworkDisplayName(p.framework) : "Unknown"}
                      </span>
                      {p && (
                        <Badge className={`${confidenceBadgeColor(p.confidence)} text-[9px] mt-1`}>
                          {p.confidence} ({Math.round(p.confidence_score * 100)}%)
                        </Badge>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Version */}
              <tr className="hover:bg-[#18181b] transition-colors">
                <td className="p-2.5 bg-[#0a0a0b] text-[#8c8b8f]">
                  Version
                </td>
                {comparisonItems.map((item) => (
                  <td key={item.analysis_id} className="p-2.5 border-l border-[#26262a] text-[#ffffff]">
                    {item.apk.version_name || "?"} (code {item.apk.version_code ?? "?"})
                  </td>
                ))}
              </tr>

              {/* Min & Target SDK */}
              <tr className="hover:bg-[#18181b] transition-colors">
                <td className="p-2.5 bg-[#0a0a0b] text-[#8c8b8f]">
                  SDK Levels
                </td>
                {comparisonItems.map((item) => (
                  <td key={item.analysis_id} className="p-2.5 border-l border-[#26262a] text-[#ffffff]">
                    Min API {item.apk.min_sdk ?? "N/A"} • Target API {item.apk.target_sdk ?? "N/A"}
                  </td>
                ))}
              </tr>

              {/* File Size */}
              <tr className="hover:bg-[#18181b] transition-colors">
                <td className="p-2.5 bg-[#0a0a0b] text-[#8c8b8f]">
                  File Size
                </td>
                {comparisonItems.map((item) => (
                  <td key={item.analysis_id} className="p-2.5 border-l border-[#26262a] text-[#ffffff]">
                    {formatBytes(item.apk.file_size)}
                  </td>
                ))}
              </tr>

              {/* Native Libraries */}
              <tr className="hover:bg-[#18181b] transition-colors">
                <td className="p-2.5 bg-[#0a0a0b] text-[#8c8b8f]">
                  Native Libraries
                </td>
                {comparisonItems.map((item) => (
                  <td key={item.analysis_id} className="p-2.5 border-l border-[#26262a] text-[#ffffff]">
                    {item.apk_structure.native_libraries.length} libraries
                    <div className="text-[10px] text-[#8c8b8f] truncate mt-0.5">
                      {Array.from(new Set(item.apk_structure.native_libraries.map((l) => l.arch))).join(", ") || "No native code"}
                    </div>
                  </td>
                ))}
              </tr>

              {/* DEX Files */}
              <tr className="hover:bg-[#18181b] transition-colors">
                <td className="p-2.5 bg-[#0a0a0b] text-[#8c8b8f]">
                  DEX Binaries
                </td>
                {comparisonItems.map((item) => (
                  <td key={item.analysis_id} className="p-2.5 border-l border-[#26262a] text-[#ffffff]">
                    {item.apk_structure.dex_files.length} file(s)
                  </td>
                ))}
              </tr>

              {/* Permissions Count */}
              <tr className="hover:bg-[#18181b] transition-colors">
                <td className="p-2.5 bg-[#0a0a0b] text-[#8c8b8f]">
                  Permissions
                </td>
                {comparisonItems.map((item) => (
                  <td key={item.analysis_id} className="p-2.5 border-l border-[#26262a] text-[#ffffff]">
                    {item.apk.permissions.length} declared
                  </td>
                ))}
              </tr>

              {/* Signature Scheme */}
              <tr className="hover:bg-[#18181b] transition-colors">
                <td className="p-2.5 bg-[#0a0a0b] text-[#8c8b8f]">
                  Signature Scheme
                </td>
                {comparisonItems.map((item) => (
                  <td key={item.analysis_id} className="p-2.5 border-l border-[#26262a] text-[#ffffff]">
                    {item.signing_info?.scheme || "None / Modern v2+"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
