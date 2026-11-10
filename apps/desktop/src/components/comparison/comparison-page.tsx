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
    <div className="space-y-6">
      {/* Top Header */}
      <Card className="p-6 border-neutral-800 bg-neutral-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-indigo-400" />
              Comparison Studio
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Compare 2 to 4 application packages side-by-side to inspect architectural, dependency, and SDK variations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setHistoryOpen(!historyOpen)}
              className="text-xs h-8 gap-1.5 border-neutral-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add from History
            </Button>

            {comparisonItems.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={clearComparison}
                className="text-xs h-8 text-rose-400 hover:text-rose-300 border-neutral-800"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* History Quick Picker Dropdown */}
        {historyOpen && (
          <div className="mt-4 pt-4 border-t border-neutral-800 space-y-2">
            <h4 className="text-xs font-semibold text-neutral-300">
              Select Recent Analysis to Compare:
            </h4>
            {history.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">No previous analyses found in history.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {history.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => {
                      addFromHistory(h.id);
                      setHistoryOpen(false);
                    }}
                    className="p-2.5 rounded-lg border border-neutral-800 bg-neutral-950 hover:border-indigo-500/50 cursor-pointer text-xs transition-colors flex items-center justify-between"
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold text-neutral-200 truncate font-sans">
                        {h.filename}
                      </div>
                      <div className="font-mono text-[10px] text-neutral-400 truncate">
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
        <Card className="p-16 border-neutral-800 bg-neutral-900/40 text-center space-y-3">
          <GitCompare className="h-10 w-10 text-neutral-600 mx-auto" />
          <h4 className="text-sm font-semibold text-neutral-200">
            No Packages Selected for Comparison
          </h4>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Open the Inspector to analyze an APK and click "Add to Compare", or click "Add from History" above to choose previously scanned applications.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="p-4 bg-neutral-950 font-mono text-neutral-400 w-44">
                  Attribute
                </th>
                {comparisonItems.map((item) => (
                  <th
                    key={item.analysis_id}
                    className="p-4 bg-neutral-900/80 border-l border-neutral-800 min-w-64 max-w-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-neutral-100 font-sans truncate">
                          {item.apk.app_label || item.apk.package_name || item.apk.filename}
                        </h4>
                        <p className="text-[11px] font-mono text-neutral-400 truncate mt-0.5">
                          {item.apk.package_name || item.apk.filename}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromComparison(item.analysis_id)}
                        className="text-neutral-400 hover:text-rose-400 p-1"
                        title="Remove from comparison"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-800 font-mono">
              {/* Primary Framework */}
              <tr className="hover:bg-neutral-900/30">
                <td className="p-3 bg-neutral-950 font-semibold text-neutral-300">
                  Primary Framework
                </td>
                {comparisonItems.map((item) => {
                  const p = item.detections.find((d) => d.is_primary);
                  return (
                    <td key={item.analysis_id} className="p-3 border-l border-neutral-800 font-sans">
                      <span className="font-bold text-indigo-400 text-sm block">
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
              <tr className="hover:bg-neutral-900/30">
                <td className="p-3 bg-neutral-950 font-semibold text-neutral-300">
                  Version
                </td>
                {comparisonItems.map((item) => (
                  <td key={item.analysis_id} className="p-3 border-l border-neutral-800 text-neutral-200">
                    {item.apk.version_name || "?"} (code {item.apk.version_code ?? "?"})
                  </td>
                ))}
              </tr>

              {/* Min & Target SDK */}
              <tr className="hover:bg-neutral-900/30">
                <td className="p-3 bg-neutral-950 font-semibold text-neutral-300">
                  SDK Levels
                </td>
                {comparisonItems.map((item) => (
                  <td key={item.analysis_id} className="p-3 border-l border-neutral-800 text-neutral-200">
                    Min API {item.apk.min_sdk ?? "N/A"} • Target API {item.apk.target_sdk ?? "N/A"}
                  </td>
                ))}
              </tr>

              {/* File Size */}
              <tr className="hover:bg-neutral-900/30">
                <td className="p-3 bg-neutral-950 font-semibold text-neutral-300">
                  File Size
                </td>
                {comparisonItems.map((item) => (
                  <td key={item.analysis_id} className="p-3 border-l border-neutral-800 text-neutral-200">
                    {formatBytes(item.apk.file_size)}
                  </td>
                ))}
              </tr>

              {/* Native Libraries */}
              <tr className="hover:bg-neutral-900/30">
                <td className="p-3 bg-neutral-950 font-semibold text-neutral-300">
                  Native Libraries
                </td>
                {comparisonItems.map((item) => (
                  <td key={item.analysis_id} className="p-3 border-l border-neutral-800 text-neutral-200">
                    {item.apk_structure.native_libraries.length} libraries
                    <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                      {Array.from(new Set(item.apk_structure.native_libraries.map((l) => l.arch))).join(", ") || "No native code"}
                    </div>
                  </td>
                ))}
              </tr>

              {/* DEX Files */}
              <tr className="hover:bg-neutral-900/30">
                <td className="p-3 bg-neutral-950 font-semibold text-neutral-300">
                  DEX Binaries
                </td>
                {comparisonItems.map((item) => (
                  <td key={item.analysis_id} className="p-3 border-l border-neutral-800 text-neutral-200">
                    {item.apk_structure.dex_files.length} file(s)
                  </td>
                ))}
              </tr>

              {/* Permissions Count */}
              <tr className="hover:bg-neutral-900/30">
                <td className="p-3 bg-neutral-950 font-semibold text-neutral-300">
                  Permissions
                </td>
                {comparisonItems.map((item) => (
                  <td key={item.analysis_id} className="p-3 border-l border-neutral-800 text-neutral-200">
                    {item.apk.permissions.length} declared
                  </td>
                ))}
              </tr>

              {/* Signature Scheme */}
              <tr className="hover:bg-neutral-900/30">
                <td className="p-3 bg-neutral-950 font-semibold text-neutral-300">
                  Signature Scheme
                </td>
                {comparisonItems.map((item) => (
                  <td key={item.analysis_id} className="p-3 border-l border-neutral-800 text-neutral-200">
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
