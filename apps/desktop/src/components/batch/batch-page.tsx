import React, { useState } from "react";
import {
  Layers,
  Upload,
  Play,
  XCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  FileCode,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import * as commands from "@/lib/commands";
import { formatBytes, frameworkDisplayName, confidenceBadgeColor } from "@/lib/utils";
import type { AnalysisResult } from "@/types";

interface BatchItem {
  id: string;
  name: string;
  size: number;
  file: File;
  status: "pending" | "running" | "completed" | "error";
  result?: AnalysisResult;
  error?: string;
}

export function BatchAnalysisPage() {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newItems: BatchItem[] = Array.from(e.target.files)
        .filter((f) => f.name.toLowerCase().endsWith(".apk"))
        .map((f) => ({
          id: Math.random().toString(36).substring(7),
          name: f.name,
          size: f.size,
          file: f,
          status: "pending",
        }));
      setItems((prev) => [...prev, ...newItems]);
    }
  };

  const startBatch = async () => {
    if (items.length === 0 || isRunning) return;
    setIsRunning(true);
    setIsCancelled(false);

    for (let i = 0; i < items.length; i++) {
      if (isCancelled) break;
      const item = items[i];
      if (item.status === "completed") continue;

      // Update item to running
      setItems((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: "running" } : it))
      );

      try {
        const buffer = await item.file.arrayBuffer();
        const bytes = Array.from(new Uint8Array(buffer));
        const res = await commands.analyzeApkBytes(item.name, bytes);

        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i ? { ...it, status: "completed", result: res } : it
          )
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i ? { ...it, status: "error", error: String(err) } : it
          )
        );
      }
    }

    setIsRunning(false);
  };

  const cancelBatch = () => {
    setIsCancelled(true);
    setIsRunning(false);
  };

  const clearBatch = () => {
    if (!isRunning) {
      setItems([]);
    }
  };

  const completedCount = items.filter((i) => i.status === "completed").length;
  const errorCount = items.filter((i) => i.status === "error").length;
  const progressPct = items.length > 0 ? ((completedCount + errorCount) / items.length) * 100 : 0;

  const handleExportBatch = async (format: "json" | "csv" | "txt") => {
    const analysisIds = items
      .filter((i) => i.result)
      .map((i) => i.result!.analysis_id);

    if (analysisIds.length === 0) {
      setExportNotice("No completed analyses available to export.");
      return;
    }

    try {
      const outputPath = `./batch_export_${Date.now()}.${format}`;
      await commands.exportBatchReport(analysisIds, format, outputPath);
      setExportNotice(`Exported batch report to ${outputPath}`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (e) {
      setExportNotice(`Batch export failed: ${e}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="p-6 border-neutral-800 bg-neutral-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              Batch Application Analysis
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Select or drop multiple APK files (supports 50+ applications) to inspect runtimes concurrently.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label>
              <input
                type="file"
                multiple
                accept=".apk"
                className="hidden"
                onChange={handleFilesSelected}
                disabled={isRunning}
              />
              <span className="inline-flex items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 cursor-pointer transition-colors gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                Add APKs
              </span>
            </label>

            <Button
              size="sm"
              onClick={startBatch}
              disabled={isRunning || items.length === 0}
              className="gap-1.5 text-xs h-8"
            >
              <Play className="h-3.5 w-3.5" />
              Run Batch
            </Button>

            {isRunning && (
              <Button
                size="sm"
                variant="destructive"
                onClick={cancelBatch}
                className="gap-1.5 text-xs h-8"
              >
                <XCircle className="h-3.5 w-3.5" />
                Stop
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={clearBatch}
              disabled={isRunning || items.length === 0}
              className="text-xs h-8 border-neutral-800"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {items.length > 0 && (
          <div className="mt-6 pt-4 border-t border-neutral-800/80 space-y-2">
            <div className="flex justify-between text-xs font-mono text-neutral-400">
              <span>
                Progress: {completedCount + errorCount} / {items.length} completed
              </span>
              <span>{Math.round(progressPct)}%</span>
            </div>
            <Progress value={progressPct} />
          </div>
        )}
      </Card>

      {exportNotice && (
        <div className="p-3 text-xs rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
          {exportNotice}
        </div>
      )}

      {/* Export row */}
      {completedCount > 0 && (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExportBatch("csv")}
            className="text-xs h-8 gap-1.5 border-neutral-700"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExportBatch("json")}
            className="text-xs h-8 gap-1.5 border-neutral-700"
          >
            <Download className="h-3.5 w-3.5" /> Export JSON
          </Button>
        </div>
      )}

      {/* Items Table */}
      <Card className="p-6 border-neutral-800 bg-neutral-900/60">
        {items.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400 space-y-2">
            <Layers className="h-8 w-8 text-neutral-600 mx-auto" />
            <p className="font-semibold text-neutral-300">Queue is Empty</p>
            <p>Click "Add APKs" to select multiple application files for batch execution.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-800 text-neutral-400 font-mono">
                <tr>
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">File Name</th>
                  <th className="py-2 pr-4">Size</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Detected Framework</th>
                  <th className="py-2">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono">
                {items.map((it, idx) => {
                  const primary = it.result?.detections.find((d) => d.is_primary);

                  return (
                    <tr key={it.id} className="hover:bg-neutral-800/30">
                      <td className="py-2.5 pr-4 text-neutral-400">{idx + 1}</td>
                      <td className="py-2.5 pr-4 font-semibold text-neutral-200 font-sans truncate max-w-xs">
                        {it.name}
                      </td>
                      <td className="py-2.5 pr-4 text-neutral-400">{formatBytes(it.size)}</td>
                      <td className="py-2.5 pr-4">
                        {it.status === "completed" ? (
                          <Badge variant="success" className="text-[10px] gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Done
                          </Badge>
                        ) : it.status === "running" ? (
                          <Badge variant="default" className="text-[10px] gap-1">
                            <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Running
                          </Badge>
                        ) : it.status === "error" ? (
                          <Badge variant="destructive" className="text-[10px] gap-1">
                            <AlertCircle className="h-2.5 w-2.5" /> Error
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 font-sans font-semibold text-indigo-300">
                        {primary ? frameworkDisplayName(primary.framework) : it.status === "completed" ? "Unknown" : "—"}
                      </td>
                      <td className="py-2.5">
                        {primary ? (
                          <Badge className={confidenceBadgeColor(primary.confidence)}>
                            {primary.confidence}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
