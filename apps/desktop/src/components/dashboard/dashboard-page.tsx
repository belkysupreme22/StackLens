import React, { useEffect } from "react";
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Upload,
  PackageSearch,
  BookOpen,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useAppStore } from "@/stores/app-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { frameworkColor, frameworkDisplayName, formatDate } from "@/lib/utils";
import * as commands from "@/lib/commands";

export function DashboardPage() {
  const {
    dashboardStats,
    isLoadingStats,
    loadDashboardStats,
    setCurrentPage,
    setActiveAnalysis,
  } = useAppStore();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const viewAnalysis = async (id: string) => {
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

  const fwData = dashboardStats?.framework_distribution
    ? Object.entries(dashboardStats.framework_distribution).map(([fw, count]) => ({
        name: frameworkDisplayName(fw),
        value: count,
        color: frameworkColor(fw),
      }))
    : [];

  const confData = dashboardStats?.confidence_distribution
    ? Object.entries(dashboardStats.confidence_distribution).map(([conf, count]) => ({
        name: conf,
        count,
      }))
    : [];

  const total = dashboardStats?.total_analyses || 0;
  const successRate = total > 0
    ? Math.round(((dashboardStats?.success_count || 0) / total) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Total Analyses</span>
            <Layers className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-100">
            {dashboardStats?.total_analyses || 0}
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">APKs reverse-engineered</p>
        </Card>

        <Card className="p-4 border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Frameworks Found</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-100">
            {fwData.length}
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">Unique runtimes identified</p>
        </Card>

        <Card className="p-4 border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Detection Health</span>
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-100">
            {successRate}%
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">Successful inspections</p>
        </Card>

        <Card className="p-4 border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Connected Devices</span>
            <Smartphone className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-100">
            {dashboardStats?.connected_devices || 0}
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">Online ADB targets</p>
        </Card>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Framework Distribution */}
        <Card className="p-6 border-neutral-800 bg-neutral-900/60">
          <CardTitle className="text-sm font-semibold mb-4 text-neutral-200">
            Framework Distribution
          </CardTitle>
          {fwData.length > 0 ? (
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fwData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {fwData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      borderColor: "#262626",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-xs text-neutral-400 text-center p-4">
              <Layers className="h-8 w-8 text-neutral-600 mb-2" />
              <span>No analysis data recorded yet</span>
              <span className="text-[11px] text-neutral-400">Inspect APKs to visualize runtime distribution</span>
            </div>
          )}
        </Card>

        {/* Confidence Scores */}
        <Card className="p-6 border-neutral-800 bg-neutral-900/60">
          <CardTitle className="text-sm font-semibold mb-4 text-neutral-200">
            Confidence Levels
          </CardTitle>
          {confData.length > 0 ? (
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confData}>
                  <XAxis dataKey="name" stroke="#525252" fontSize={11} />
                  <YAxis stroke="#525252" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      borderColor: "#262626",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-xs text-neutral-400 text-center p-4">
              <TrendingUp className="h-8 w-8 text-neutral-600 mb-2" />
              <span>No confidence distribution yet</span>
              <span className="text-[11px] text-neutral-400">Detections will display confidence tiers here</span>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Launch Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setCurrentPage("inspector")}
          className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 hover:border-indigo-500/40 cursor-pointer transition-all duration-150 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-neutral-200">Inspect APK File</h4>
              <p className="text-[11px] text-neutral-400">Import single APK or bundle</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-indigo-400 transition-colors" />
        </div>

        <div
          onClick={() => setCurrentPage("analyzer")}
          className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 hover:border-indigo-500/40 cursor-pointer transition-all duration-150 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <PackageSearch className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-neutral-200">Analyze Installed App</h4>
              <p className="text-[11px] text-neutral-400">Pull package from device</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-emerald-400 transition-colors" />
        </div>

        <div
          onClick={() => setCurrentPage("explorer")}
          className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 hover:border-indigo-500/40 cursor-pointer transition-all duration-150 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-neutral-200">Framework Knowledge</h4>
              <p className="text-[11px] text-neutral-400">Browse 14 supported runtimes</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-sky-400 transition-colors" />
        </div>
      </div>

      {/* Recent Analyses Table */}
      <Card className="p-6 border-neutral-800 bg-neutral-900/60">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-sm font-semibold text-neutral-200">
            Recent Analyses
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage("history")}
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            View All History →
          </Button>
        </div>

        {dashboardStats?.recent_analyses && dashboardStats.recent_analyses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-800 text-neutral-400 font-mono">
                <tr>
                  <th className="py-2 pr-4">Timestamp</th>
                  <th className="py-2 pr-4">Application / File</th>
                  <th className="py-2 pr-4">Package</th>
                  <th className="py-2 pr-4">Framework</th>
                  <th className="py-2 pr-4">Confidence</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono">
                {dashboardStats.recent_analyses.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => viewAnalysis(item.id)}
                    className="hover:bg-neutral-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 pr-4 text-neutral-400">{formatDate(item.timestamp)}</td>
                    <td className="py-2.5 pr-4 font-semibold text-neutral-200 truncate max-w-xs font-sans">
                      {item.filename}
                    </td>
                    <td className="py-2.5 pr-4 text-neutral-400 truncate max-w-xs">
                      {item.package_name || "N/A"}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="font-sans font-semibold text-indigo-300">
                        {item.primary_framework ? frameworkDisplayName(item.primary_framework) : "Unknown"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge variant="outline" className="text-[10px]">
                        {item.confidence || "N/A"}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-right font-sans">
                      <span className="text-indigo-400 hover:underline">Inspect</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-neutral-400">
            No analyses have been conducted yet. Import an APK or connect an Android device to start.
          </div>
        )}
      </Card>
    </div>
  );
}
