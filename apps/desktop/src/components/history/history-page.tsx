import React, { useState, useEffect } from "react";
import {
  History,
  Search,
  Trash2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  FileSearch,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import {
  formatDate,
  frameworkDisplayName,
  confidenceBadgeColor,
} from "@/lib/utils";
import * as commands from "@/lib/commands";

export function HistoryPage() {
  const {
    history,
    isLoadingHistory,
    loadHistory,
    setActiveAnalysis,
    setCurrentPage,
  } = useAppStore();

  const [search, setSearch] = useState("");
  const [selectedFramework, setSelectedFramework] = useState("all");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  useEffect(() => {
    loadHistory(100);
  }, []);

  const handleOpenAnalysis = async (id: string) => {
    try {
      const res = await commands.getAnalysisById(id);
      if (res) {
        setActiveAnalysis(res);
        setCurrentPage("inspector");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await commands.deleteAnalysis(id);
      await loadHistory(100);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    try {
      await commands.clearHistory();
      await loadHistory(100);
      setClearDialogOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = history.filter((item) => {
    const matchesSearch =
      item.filename.toLowerCase().includes(search.toLowerCase()) ||
      (item.package_name && item.package_name.toLowerCase().includes(search.toLowerCase())) ||
      (item.primary_framework && item.primary_framework.toLowerCase().includes(search.toLowerCase()));

    const matchesFw =
      selectedFramework === "all" || item.primary_framework === selectedFramework;

    return matchesSearch && matchesFw;
  });

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <Card className="p-4 border-[#26262a] bg-[#131315] rounded-[20px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-mono font-medium text-[#ffffff] flex items-center gap-2">
              <History className="h-3.5 w-3.5 text-[#47ab61]" strokeWidth={1.5} />
              Analysis history
            </h3>
            <p className="text-[11px] font-mono text-[#8c8b8f] mt-0.5">
              Locally persisted records of analyzed application packages and findings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadHistory(100)}
              disabled={isLoadingHistory}
              className="text-xs font-mono h-8 gap-1.5 border-[#26262a] bg-[#0a0a0b] rounded-[20px] hover:border-[#333338]"
            >
              <RefreshCw className={`h-3 w-3 ${isLoadingHistory ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            {history.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setClearDialogOpen(true)}
                className="text-xs font-mono h-8 text-rose-400 hover:text-rose-300 border-[#26262a] bg-[#0a0a0b] rounded-[20px] gap-1.5"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-3 pt-3 border-t border-[#26262a] flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-[#8c8b8f]" strokeWidth={1.5} />
            <Input
              placeholder="Search filename, package name, or framework..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs font-mono h-8 border-[#26262a] bg-[#0a0a0b] rounded-[20px]"
            />
          </div>

          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
            className="h-8 rounded-[20px] border border-[#26262a] bg-[#0a0a0b] px-2.5 text-xs font-mono text-[#ffffff] focus:outline-none focus:border-[#47ab61]"
          >
            <option value="all">All frameworks</option>
            <option value="Flutter">Flutter</option>
            <option value="ReactNative">React Native</option>
            <option value="Unity">Unity</option>
            <option value="NativeAndroidKotlin">Native Android (Kotlin)</option>
            <option value="NativeAndroidJava">Native Android (Java)</option>
            <option value="DotNetMaui">.NET MAUI</option>
            <option value="Xamarin">Xamarin</option>
            <option value="Cordova">Cordova</option>
            <option value="Capacitor">Capacitor</option>
            <option value="UnrealEngine">Unreal Engine</option>
            <option value="Godot">Godot</option>
          </select>
        </div>
      </Card>

      {/* History Table */}
      <Card className="p-4 border-[#26262a] bg-[#131315] rounded-[20px]">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-[#8c8b8f] space-y-1.5">
            <History className="h-6 w-6 text-[#333338] mx-auto" strokeWidth={1.5} />
            <p className="font-medium text-[#ffffff]">No matching records found</p>
            <p>Try clearing your query or inspect new applications.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-[#26262a] text-[#8c8b8f]">
                <tr>
                  <th className="py-2 pr-4">Timestamp</th>
                  <th className="py-2 pr-4">File name</th>
                  <th className="py-2 pr-4">Package</th>
                  <th className="py-2 pr-4">Primary framework</th>
                  <th className="py-2 pr-4">Confidence</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26262a] tabular-nums">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenAnalysis(item.id)}
                    className="hover:bg-[#18181b] cursor-pointer transition-colors"
                  >
                    <td className="py-2 pr-4 text-[#8c8b8f]">{formatDate(item.timestamp)}</td>
                    <td className="py-2 pr-4 font-medium text-[#ffffff] truncate max-w-xs">
                      {item.filename}
                    </td>
                    <td className="py-2 pr-4 text-[#8c8b8f] truncate max-w-xs">
                      {item.package_name || "N/A"}
                    </td>
                    <td className="py-2 pr-4 text-[#47ab61]">
                      {item.primary_framework ? frameworkDisplayName(item.primary_framework) : "Unknown"}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge className={confidenceBadgeColor(item.confidence || "Inconclusive")}>
                        {item.confidence || "N/A"}
                      </Badge>
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAnalysis(item.id);
                          }}
                          className="p-1 rounded-full text-[#8c8b8f] hover:text-[#47ab61] transition-colors"
                          title="View analysis details"
                        >
                          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, item.id)}
                          className="p-1 rounded-full text-[#8c8b8f] hover:text-rose-400 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={clearDialogOpen}
        onOpenChange={setClearDialogOpen}
        title="Clear analysis history"
        description="Permanently deletes all saved analysis records from local SQLite storage."
      >
        <div className="flex justify-end gap-2 pt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setClearDialogOpen(false)}
            className="text-xs font-mono h-8 border-[#26262a] bg-[#131315] rounded-[20px]"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleClearAll}
            className="text-xs font-mono h-8 rounded-[20px]"
          >
            Clear history
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
