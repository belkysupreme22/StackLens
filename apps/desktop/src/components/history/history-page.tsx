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
      <Card className="p-6 border-neutral-800 bg-neutral-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-400" />
              Analysis History & Records
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Locally persisted records of analyzed application packages, frameworks, and findings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadHistory(100)}
              disabled={isLoadingHistory}
              className="text-xs h-8 gap-1.5 border-neutral-700"
            >
              <RefreshCw className={`h-3 w-3 ${isLoadingHistory ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            {history.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setClearDialogOpen(true)}
                className="text-xs h-8 text-rose-400 hover:text-rose-300 border-neutral-800 gap-1.5"
              >
                <Trash2 className="h-3 w-3" />
                Clear History
              </Button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-4 pt-4 border-t border-neutral-800/80 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <Input
              placeholder="Search filename, package name, or framework..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-8 border-neutral-700 bg-neutral-950"
            />
          </div>

          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
            className="h-8 rounded-md border border-neutral-700 bg-neutral-950 px-3 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Frameworks</option>
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
      <Card className="p-6 border-neutral-800 bg-neutral-900/60">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400 space-y-2">
            <History className="h-8 w-8 text-neutral-600 mx-auto" />
            <p className="font-semibold text-neutral-300">No Analysis Records Match</p>
            <p>Try clearing your search query or inspect new applications.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-800 text-neutral-400 font-mono">
                <tr>
                  <th className="py-2 pr-4">Timestamp</th>
                  <th className="py-2 pr-4">File Name</th>
                  <th className="py-2 pr-4">Package</th>
                  <th className="py-2 pr-4">Primary Framework</th>
                  <th className="py-2 pr-4">Confidence</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenAnalysis(item.id)}
                    className="hover:bg-neutral-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 pr-4 text-neutral-400">{formatDate(item.timestamp)}</td>
                    <td className="py-2.5 pr-4 font-semibold text-neutral-200 font-sans truncate max-w-xs">
                      {item.filename}
                    </td>
                    <td className="py-2.5 pr-4 text-neutral-400 truncate max-w-xs">
                      {item.package_name || "N/A"}
                    </td>
                    <td className="py-2.5 pr-4 font-sans font-semibold text-indigo-300">
                      {item.primary_framework ? frameworkDisplayName(item.primary_framework) : "Unknown"}
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge className={confidenceBadgeColor(item.confidence || "Inconclusive")}>
                        {item.confidence || "N/A"}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAnalysis(item.id);
                          }}
                          className="p-1 rounded text-neutral-400 hover:text-indigo-400 transition-colors"
                          title="View analysis details"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, item.id)}
                          className="p-1 rounded text-neutral-400 hover:text-rose-400 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
        title="Clear Analysis History"
        description="Are you sure you want to permanently clear all previous analysis records from the local SQLite database? This action cannot be undone."
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setClearDialogOpen(false)}
            className="text-xs border-neutral-700"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleClearAll}
            className="text-xs"
          >
            Yes, Clear History
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
