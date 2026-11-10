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
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3.5 border-[#26262a] bg-[#131315] rounded-[20px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#8c8b8f]">Analyses</span>
            <Layers className="h-3.5 w-3.5 text-[#47ab61]" strokeWidth={1.5} />
          </div>
          <div className="mt-1 text-xl font-mono font-medium text-[#ffffff] tabular-nums">
            {dashboardStats?.total_analyses || 0}
          </div>
          <p className="mt-0.5 text-[11px] font-mono text-[#8c8b8f]">APKs inspected</p>
        </Card>

        <Card className="p-3.5 border-[#26262a] bg-[#131315] rounded-[20px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#8c8b8f]">Frameworks</span>
            <TrendingUp className="h-3.5 w-3.5 text-[#47ab61]" strokeWidth={1.5} />
          </div>
          <div className="mt-1 text-xl font-mono font-medium text-[#ffffff] tabular-nums">
            {fwData.length}
          </div>
          <p className="mt-0.5 text-[11px] font-mono text-[#8c8b8f]">Unique runtimes</p>
        </Card>

        <Card className="p-3.5 border-[#26262a] bg-[#131315] rounded-[20px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#8c8b8f]">Success</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-[#47ab61]" strokeWidth={1.5} />
          </div>
          <div className="mt-1 text-xl font-mono font-medium text-[#ffffff] tabular-nums">
            {successRate}%
          </div>
          <p className="mt-0.5 text-[11px] font-mono text-[#8c8b8f]">Clean runs</p>
        </Card>

        <Card className="p-3.5 border-[#26262a] bg-[#131315] rounded-[20px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#8c8b8f]">Devices</span>
            <Smartphone className="h-3.5 w-3.5 text-[#47ab61]" strokeWidth={1.5} />
          </div>
          <div className="mt-1 text-xl font-mono font-medium text-[#ffffff] tabular-nums">
            {dashboardStats?.connected_devices || 0}
          </div>
          <p className="mt-0.5 text-[11px] font-mono text-[#8c8b8f]">Online ADB targets</p>
        </Card>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Framework Distribution */}
        <Card className="p-4 border-[#26262a] bg-[#131315] rounded-[20px]">
          <CardTitle className="text-xs font-mono font-medium mb-3 text-[#ffffff]">
            Framework distribution
          </CardTitle>
          {fwData.length > 0 ? (
            <div className="h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fwData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {fwData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#131315",
                      borderColor: "#26262a",
                      borderRadius: "3px",
                      color: "#fff",
                      fontSize: "11px",
                      fontFamily: "monospace",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-xs font-mono text-[#8c8b8f] text-center p-4">
              <Layers className="h-6 w-6 text-[#333338] mb-2" strokeWidth={1.5} />
              <span>No analysis data recorded yet</span>
            </div>
          )}
        </Card>

        {/* Confidence Scores */}
        <Card className="p-4 border-[#26262a] bg-[#131315] rounded-[20px]">
          <CardTitle className="text-xs font-mono font-medium mb-3 text-[#ffffff]">
            Confidence levels
          </CardTitle>
          {confData.length > 0 ? (
            <div className="h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confData}>
                  <XAxis dataKey="name" stroke="#8c8b8f" fontSize={10} fontFamily="monospace" />
                  <YAxis stroke="#8c8b8f" fontSize={10} fontFamily="monospace" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#131315",
                      borderColor: "#26262a",
                      borderRadius: "3px",
                      color: "#fff",
                      fontSize: "11px",
                      fontFamily: "monospace",
                    }}
                  />
                  <Bar dataKey="count" fill="#47ab61" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-xs font-mono text-[#8c8b8f] text-center p-4">
              <TrendingUp className="h-6 w-6 text-[#333338] mb-2" strokeWidth={1.5} />
              <span>No confidence records yet</span>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Launch Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => setCurrentPage("inspector")}
          className="p-3.5 rounded-[20px] border border-[#26262a] bg-[#131315] hover:bg-[#18181b] hover:border-[#333338] cursor-pointer transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-full bg-[#0a0a0b] border border-[#26262a] text-[#47ab61]">
              <Upload className="h-4 w-4" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-xs font-mono font-medium text-[#ffffff]">Inspect APK file</h4>
              <p className="text-[11px] font-mono text-[#8c8b8f]">Import package binary</p>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-[#8c8b8f] group-hover:text-[#47ab61] transition-colors" strokeWidth={1.5} />
        </div>

        <div
          onClick={() => setCurrentPage("analyzer")}
          className="p-3.5 rounded-[20px] border border-[#26262a] bg-[#131315] hover:bg-[#18181b] hover:border-[#333338] cursor-pointer transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-full bg-[#0a0a0b] border border-[#26262a] text-[#47ab61]">
              <PackageSearch className="h-4 w-4" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-xs font-mono font-medium text-[#ffffff]">Analyze device app</h4>
              <p className="text-[11px] font-mono text-[#8c8b8f]">Pull via ADB</p>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-[#8c8b8f] group-hover:text-[#47ab61] transition-colors" strokeWidth={1.5} />
        </div>

        <div
          onClick={() => setCurrentPage("explorer")}
          className="p-3.5 rounded-[20px] border border-[#26262a] bg-[#131315] hover:bg-[#18181b] hover:border-[#333338] cursor-pointer transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-full bg-[#0a0a0b] border border-[#26262a] text-[#47ab61]">
              <BookOpen className="h-4 w-4" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-xs font-mono font-medium text-[#ffffff]">Runtime knowledge</h4>
              <p className="text-[11px] font-mono text-[#8c8b8f]">14 runtime signatures</p>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-[#8c8b8f] group-hover:text-[#47ab61] transition-colors" strokeWidth={1.5} />
        </div>
      </div>

      {/* Recent Analyses Table */}
      <Card className="p-4 border-[#26262a] bg-[#131315] rounded-[20px]">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="text-xs font-mono font-medium text-[#ffffff]">
            Recent analyses
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage("history")}
            className="text-xs font-mono text-[#47ab61] hover:text-[#3ecb74] hover:bg-transparent p-0 h-auto"
          >
            History view →
          </Button>
        </div>

        {dashboardStats?.recent_analyses && dashboardStats.recent_analyses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-[#26262a] text-[#8c8b8f]">
                <tr>
                  <th className="py-2 pr-4">Timestamp</th>
                  <th className="py-2 pr-4">File</th>
                  <th className="py-2 pr-4">Package</th>
                  <th className="py-2 pr-4">Framework</th>
                  <th className="py-2 pr-4">Confidence</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26262a] tabular-nums">
                {dashboardStats.recent_analyses.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => viewAnalysis(item.id)}
                    className="hover:bg-[#18181b] cursor-pointer transition-colors"
                  >
                    <td className="py-2 pr-4 text-[#8c8b8f]">{formatDate(item.timestamp)}</td>
                    <td className="py-2 pr-4 font-medium text-[#ffffff] truncate max-w-xs">
                      {item.filename}
                    </td>
                    <td className="py-2 pr-4 text-[#8c8b8f] truncate max-w-xs">
                      {item.package_name || "N/A"}
                    </td>
                    <td className="py-2 pr-4">
                      <span className="text-[#47ab61]">
                        {item.primary_framework ? frameworkDisplayName(item.primary_framework) : "Unknown"}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant="outline" className="text-[9px]">
                        {item.confidence || "N/A"}
                      </Badge>
                    </td>
                    <td className="py-2 text-right">
                      <span className="text-[#47ab61] hover:underline">Inspect</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-xs font-mono text-[#8c8b8f]">
            No analyses recorded yet. Drop an APK or connect an Android device to inspect.
          </div>
        )}
      </Card>
    </div>
  );
}
