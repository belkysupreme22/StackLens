import React, { useEffect } from "react";
import {
  Layers,
  Smartphone,
  Upload,
  PackageSearch,
  BookOpen,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3,
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

// Custom high-craft tooltip for Recharts
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-[14px] border border-[#26262a] bg-[#18181b]/95 p-3 shadow-xl backdrop-blur-md text-xs select-none">
        <div className="font-semibold text-[#ffffff] flex items-center gap-2">
          {data.payload.color && (
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: data.payload.color }}
            />
          )}
          <span>{data.name || label}</span>
        </div>
        <div className="mt-1 text-[#8c8b8f] flex items-center justify-between gap-4">
          <span>Total packages:</span>
          <span className="font-mono text-[#ffffff] font-medium">{data.value}</span>
        </div>
      </div>
    );
  }
  return null;
}

export function DashboardPage() {
  const {
    dashboardStats,
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

  const fwEntries = dashboardStats?.framework_distribution
    ? Object.entries(dashboardStats.framework_distribution)
    : [];

  const fwData = fwEntries.length > 0
    ? fwEntries.map(([fw, count]) => ({
        name: frameworkDisplayName(fw),
        value: count,
        color: frameworkColor(fw),
      }))
    : [
        // Default preview distributions when starting fresh
        { name: "Flutter", value: 38, color: "#027DFD" },
        { name: "React Native", value: 29, color: "#61DAFB" },
        { name: "Jetpack Compose", value: 24, color: "#4285F4" },
        { name: "Unity", value: 16, color: "#47ab61" },
        { name: "Native Kotlin", value: 18, color: "#7F52FF" },
      ];

  const confEntries = dashboardStats?.confidence_distribution
    ? Object.entries(dashboardStats.confidence_distribution)
    : [];

  const confData = confEntries.length > 0
    ? confEntries.map(([conf, count]) => ({
        name: conf,
        count,
      }))
    : [
        { name: "High", count: 68 },
        { name: "Medium", count: 24 },
        { name: "Low", count: 9 },
        { name: "Inconclusive", count: 4 },
      ];

  const total = dashboardStats?.total_analyses || 0;
  const successRate = total > 0
    ? Math.round(((dashboardStats?.success_count || 0) / total) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-[#26262a] bg-[#131315] rounded-[20px] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8c8b8f] tracking-tight">Inspections</span>
            <div className="p-2 rounded-full bg-[#18181b] border border-[#26262a] text-[#47ab61]">
              <Layers className="h-4 w-4" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[#ffffff] tracking-tight tabular-nums">
            {dashboardStats?.total_analyses || 0}
          </div>
          <p className="mt-1 text-xs text-[#8c8b8f]">Analyzed application packages</p>
        </Card>

        <Card className="p-5 border-[#26262a] bg-[#131315] rounded-[20px] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8c8b8f] tracking-tight">Detection rate</span>
            <div className="p-2 rounded-full bg-[#18181b] border border-[#26262a] text-[#47ab61]">
              <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[#47ab61] tracking-tight tabular-nums">
            {successRate}%
          </div>
          <p className="mt-1 text-xs text-[#8c8b8f]">Confident framework classification</p>
        </Card>

        <Card className="p-5 border-[#26262a] bg-[#131315] rounded-[20px] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8c8b8f] tracking-tight">Signatures</span>
            <div className="p-2 rounded-full bg-[#18181b] border border-[#26262a] text-[#47ab61]">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[#ffffff] tracking-tight tabular-nums">
            14
          </div>
          <p className="mt-1 text-xs text-[#8c8b8f]">Active runtime engine detectors</p>
        </Card>

        <Card className="p-5 border-[#26262a] bg-[#131315] rounded-[20px] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8c8b8f] tracking-tight">Devices</span>
            <div className="p-2 rounded-full bg-[#18181b] border border-[#26262a] text-[#47ab61]">
              <Smartphone className="h-4 w-4" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[#ffffff] tracking-tight tabular-nums">
            {dashboardStats?.connected_devices || 0}
          </div>
          <p className="mt-1 text-xs text-[#8c8b8f]">Connected Android hardware</p>
        </Card>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Framework Distribution Donut Chart */}
        <Card className="p-6 border-[#26262a] bg-[#131315] rounded-[20px] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-[#ffffff] tracking-tight">
                Framework distribution
              </CardTitle>
              <p className="text-xs text-[#8c8b8f] mt-0.5">
                Relative share of detected application runtimes
              </p>
            </div>
            <div className="p-2 rounded-full bg-[#18181b] border border-[#26262a] text-[#47ab61]">
              <PieIcon className="h-4 w-4" strokeWidth={1.5} />
            </div>
          </div>

          <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="h-56 w-56 relative flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fwData}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="#131315"
                    strokeWidth={3}
                  >
                    {fwData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-[#ffffff] tracking-tight">
                  {fwData.reduce((acc, curr) => acc + curr.value, 0)}
                </span>
                <span className="text-[10px] text-[#8c8b8f] uppercase tracking-wider">
                  Apps
                </span>
              </div>
            </div>

            {/* Legend chips */}
            <div className="flex-1 space-y-2 w-full">
              {fwData.slice(0, 5).map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between p-2 rounded-full bg-[#18181b] border border-[#26262a] text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-[#ffffff] font-medium truncate">{entry.name}</span>
                  </div>
                  <span className="font-mono text-[#8c8b8f] tabular-nums font-semibold">
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Confidence Scores Bar Chart */}
        <Card className="p-6 border-[#26262a] bg-[#131315] rounded-[20px] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-[#ffffff] tracking-tight">
                Confidence levels
              </CardTitle>
              <p className="text-xs text-[#8c8b8f] mt-0.5">
                Heuristic certainty breakdown across inspections
              </p>
            </div>
            <div className="p-2 rounded-full bg-[#18181b] border border-[#26262a] text-[#47ab61]">
              <BarChart3 className="h-4 w-4" strokeWidth={1.5} />
            </div>
          </div>

          <div className="h-64 flex items-center justify-center pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confData} barCategoryGap="25%">
                <XAxis
                  dataKey="name"
                  stroke="#8c8b8f"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#26262a" }}
                />
                <YAxis
                  stroke="#8c8b8f"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#26262a" }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  fill="#47ab61"
                  radius={[9999, 9999, 9999, 9999]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Quick Launch Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setCurrentPage("inspector")}
          className="p-5 rounded-[20px] border border-[#26262a] bg-[#131315] hover:bg-[#18181b] hover:border-[#333338] cursor-pointer transition-all flex items-center justify-between group shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-full bg-[#0a0a0b] border border-[#26262a] text-[#47ab61] group-hover:scale-105 transition-transform">
              <Upload className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#ffffff] tracking-tight">Inspect APK binary</h4>
              <p className="text-xs text-[#8c8b8f]">Drop local package file</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[#8c8b8f] group-hover:text-[#47ab61] group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
        </div>

        <div
          onClick={() => setCurrentPage("devices")}
          className="p-5 rounded-[20px] border border-[#26262a] bg-[#131315] hover:bg-[#18181b] hover:border-[#333338] cursor-pointer transition-all flex items-center justify-between group shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-full bg-[#0a0a0b] border border-[#26262a] text-[#47ab61] group-hover:scale-105 transition-transform">
              <PackageSearch className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#ffffff] tracking-tight">Device packages</h4>
              <p className="text-xs text-[#8c8b8f]">Pull from phone via ADB</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[#8c8b8f] group-hover:text-[#47ab61] group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
        </div>

        <div
          onClick={() => setCurrentPage("explorer")}
          className="p-5 rounded-[20px] border border-[#26262a] bg-[#131315] hover:bg-[#18181b] hover:border-[#333338] cursor-pointer transition-all flex items-center justify-between group shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-full bg-[#0a0a0b] border border-[#26262a] text-[#47ab61] group-hover:scale-105 transition-transform">
              <BookOpen className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#ffffff] tracking-tight">Runtime knowledge</h4>
              <p className="text-xs text-[#8c8b8f]">14 runtime signatures</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[#8c8b8f] group-hover:text-[#47ab61] group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
        </div>
      </div>

      {/* Recent Analyses Table */}
      <Card className="p-6 border-[#26262a] bg-[#131315] rounded-[20px] space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-[#ffffff] tracking-tight">
              Recent inspections
            </CardTitle>
            <p className="text-xs text-[#8c8b8f] mt-0.5">
              History of analyzed APK binaries and connected packages
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage("history")}
            className="text-xs text-[#47ab61] hover:text-[#3b9352] hover:bg-transparent rounded-full px-3"
          >
            <span>View all</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {dashboardStats?.recent_analyses && dashboardStats.recent_analyses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#26262a] text-[#8c8b8f]">
                <tr>
                  <th className="py-2.5 pr-4 font-medium">Timestamp</th>
                  <th className="py-2.5 pr-4 font-medium">File name</th>
                  <th className="py-2.5 pr-4 font-medium">Package ID</th>
                  <th className="py-2.5 pr-4 font-medium">Framework</th>
                  <th className="py-2.5 pr-4 font-medium">Confidence</th>
                  <th className="py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26262a]/60 tabular-nums">
                {dashboardStats.recent_analyses.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => viewAnalysis(item.id)}
                    className="hover:bg-[#18181b] cursor-pointer transition-colors"
                  >
                    <td className="py-3 pr-4 text-[#8c8b8f]">{formatDate(item.timestamp)}</td>
                    <td className="py-3 pr-4 font-semibold text-[#ffffff] truncate max-w-xs">
                      {item.filename}
                    </td>
                    <td className="py-3 pr-4 text-[#8c8b8f] font-mono truncate max-w-xs">
                      {item.package_name || "N/A"}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-[#47ab61] font-medium">
                        {item.primary_framework ? frameworkDisplayName(item.primary_framework) : "Unknown"}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className="text-[10px] rounded-full px-2.5 border-[#26262a]">
                        {item.confidence || "N/A"}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-[#47ab61] hover:underline font-medium">Inspect</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-[#8c8b8f]">
            Nothing here yet. Drop an APK or connect an Android device to begin inspecting.
          </div>
        )}
      </Card>
    </div>
  );
}
