import React, { useEffect, useState } from "react";
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
  Cpu,
  Boxes,
  Compass,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { frameworkColor, frameworkDisplayName, formatDate } from "@/lib/utils";
import * as commands from "@/lib/commands";

export function DashboardPage() {
  const {
    dashboardStats,
    loadDashboardStats,
    setCurrentPage,
    setActiveAnalysis,
  } = useAppStore();

  const [hoveredFw, setHoveredFw] = useState<string | null>(null);

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

  const total = dashboardStats?.total_analyses || 0;
  const successRate =
    total > 0
      ? Math.round(((dashboardStats?.success_count || 0) / total) * 100)
      : 100;

  // Framework distribution entries
  const fwEntries = dashboardStats?.framework_distribution
    ? Object.entries(dashboardStats.framework_distribution)
    : [];

  // Ranked framework list
  const rankedFrameworks = fwEntries
    .map(([fw, count]) => {
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      return {
        id: fw,
        name: frameworkDisplayName(fw),
        count,
        percentage,
        color: frameworkColor(fw),
        category: getFrameworkCategory(fw),
      };
    })
    .sort((a, b) => b.count - a.count);

  // Confidence entries
  const confLevels = [
    { key: "High", label: "High Confidence", color: "#47ab61", desc: "Multiple confirmed file and bytecode indicators" },
    { key: "Medium", label: "Medium Confidence", color: "#38bdf8", desc: "Strong primary runtime symbols verified" },
    { key: "Low", label: "Low Confidence", color: "#fbbf24", desc: "Supporting indicators with partial evidence" },
    { key: "Inconclusive", label: "Inconclusive", color: "#8c8b8f", desc: "Obfuscated or non-standard framework bundle" },
  ];

  const confStats = confLevels.map((lvl) => {
    const dist = dashboardStats?.confidence_distribution as Record<string, number> | undefined;
    const count = (dist && dist[lvl.key]) || 0;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return { ...lvl, count, percentage };
  });

  // Architectural category groups
  const categoryGroups = [
    {
      name: "Cross-Platform & Hybrid",
      desc: "Flutter, React Native, Capacitor, Cordova, Ionic",
      count: rankedFrameworks
        .filter((f) => f.category === "Cross-Platform")
        .reduce((sum, f) => sum + f.count, 0),
      color: "#027DFD",
    },
    {
      name: "Native Android",
      desc: "Jetpack Compose, Kotlin, Java Toolkits",
      count: rankedFrameworks
        .filter((f) => f.category === "Native")
        .reduce((sum, f) => sum + f.count, 0),
      color: "#4285F4",
    },
    {
      name: "Game Engines",
      desc: "Unity, Unreal Engine, Godot Runtimes",
      count: rankedFrameworks
        .filter((f) => f.category === "Gaming")
        .reduce((sum, f) => sum + f.count, 0),
      color: "#47ab61",
    },
  ];

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
            {total}
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
          <p className="mt-1 text-xs text-[#8c8b8f]">Verified framework attribution</p>
        </Card>

        <Card className="p-5 border-[#26262a] bg-[#131315] rounded-[20px] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8c8b8f] tracking-tight">Coverage</span>
            <div className="p-2 rounded-full bg-[#18181b] border border-[#26262a] text-[#47ab61]">
              <Cpu className="h-4 w-4" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[#ffffff] tracking-tight tabular-nums">
            Full Catalog
          </div>
          <p className="mt-1 text-xs text-[#8c8b8f]">Cross-platform, native, & games</p>
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
          <p className="mt-1 text-xs text-[#8c8b8f]">Connected Android targets</p>
        </Card>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Framework Architecture Distribution (Span 7) */}
        <Card className="lg:col-span-7 p-6 border-[#26262a] bg-[#131315] rounded-[20px] space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-[#ffffff] tracking-tight">
                Framework distribution
              </CardTitle>
              <p className="text-xs text-[#8c8b8f] mt-0.5">
                Breakdown of detected runtime technologies across inspected packages
              </p>
            </div>
            <div className="p-2 rounded-full bg-[#18181b] border border-[#26262a] text-[#47ab61]">
              <Boxes className="h-4 w-4" strokeWidth={1.5} />
            </div>
          </div>

          {rankedFrameworks.length > 0 ? (
            <div className="space-y-5">
              {/* Proportional Stacked Spectrum Bar */}
              <div className="space-y-2">
                <div className="h-3 w-full rounded-full bg-[#18181b] border border-[#26262a] p-0.5 flex overflow-hidden">
                  {rankedFrameworks.map((fw) => (
                    <div
                      key={fw.id}
                      className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300 relative group cursor-pointer"
                      style={{
                        width: `${Math.max(fw.percentage, 4)}%`,
                        backgroundColor: fw.color,
                        opacity: hoveredFw && hoveredFw !== fw.id ? 0.35 : 1,
                      }}
                      onMouseEnter={() => setHoveredFw(fw.id)}
                      onMouseLeave={() => setHoveredFw(null)}
                      title={`${fw.name}: ${fw.count} apps (${fw.percentage}%)`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#8c8b8f]">
                  <span>Proportional runtime share</span>
                  <span className="font-mono text-[#ffffff]">{total} total packages</span>
                </div>
              </div>

              {/* Framework Rows with Proportional Tracks */}
              <div className="space-y-3 pt-2">
                {rankedFrameworks.slice(0, 6).map((fw) => (
                  <div
                    key={fw.id}
                    onMouseEnter={() => setHoveredFw(fw.id)}
                    onMouseLeave={() => setHoveredFw(null)}
                    className={`p-3 rounded-[14px] border transition-all ${
                      hoveredFw === fw.id
                        ? "bg-[#18181b] border-[#333338]"
                        : "bg-[#18181b]/50 border-transparent hover:border-[#26262a]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: fw.color }}
                        />
                        <span className="font-semibold text-[#ffffff]">{fw.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#26262a] text-[#8c8b8f]">
                          {fw.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-[#ffffff] tabular-nums font-semibold">
                          {fw.percentage}%
                        </span>
                        <span className="text-xs font-mono text-[#8c8b8f] tabular-nums">
                          {fw.count} {fw.count === 1 ? "app" : "apps"}
                        </span>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="h-1.5 w-full rounded-full bg-[#26262a]/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.max(fw.percentage, 2)}%`,
                          backgroundColor: fw.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-[#18181b] border border-[#26262a] text-[#8c8b8f]">
                  <Boxes className="h-6 w-6" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-xs text-[#8c8b8f] max-w-sm mx-auto">
                No framework distribution recorded yet. Drop an APK or inspect a connected device app to generate charts.
              </p>
            </div>
          )}
        </Card>

        {/* Right: Confidence Scorecard & Ecosystem Tiers (Span 5) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Confidence Scorecard */}
          <Card className="p-6 border-[#26262a] bg-[#131315] rounded-[20px] space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-[#ffffff] tracking-tight">
                  Heuristic certainty
                </CardTitle>
                <p className="text-xs text-[#8c8b8f] mt-0.5">
                  Detection confidence across analyzed binaries
                </p>
              </div>
              <div className="p-2 rounded-full bg-[#18181b] border border-[#26262a] text-[#47ab61]">
                <Compass className="h-4 w-4" strokeWidth={1.5} />
              </div>
            </div>

            <div className="space-y-3.5">
              {confStats.map((lvl) => (
                <div key={lvl.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: lvl.color }}
                      />
                      <span className="font-semibold text-[#ffffff]">{lvl.label}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono tabular-nums text-xs">
                      <span className="font-semibold text-[#ffffff]">{lvl.percentage}%</span>
                      <span className="text-[#8c8b8f]">({lvl.count})</span>
                    </div>
                  </div>

                  <div className="h-2 w-full rounded-full bg-[#18181b] border border-[#26262a] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.max(lvl.percentage, lvl.count > 0 ? 3 : 0)}%`,
                        backgroundColor: lvl.color,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-[#8c8b8f]">{lvl.desc}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Technology Tiers */}
          <Card className="p-6 border-[#26262a] bg-[#131315] rounded-[20px] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-[#ffffff] tracking-tight">
                Ecosystem tiers
              </CardTitle>
              <span className="text-xs text-[#8c8b8f]">Category breakdown</span>
            </div>

            <div className="space-y-2.5">
              {categoryGroups.map((cat) => {
                const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
                return (
                  <div
                    key={cat.name}
                    className="p-3 rounded-[14px] bg-[#18181b] border border-[#26262a] space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#ffffff]">{cat.name}</span>
                      <span className="font-mono text-[#8c8b8f] font-semibold">{cat.count} apps</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#26262a] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, cat.count > 0 ? 4 : 0)}%`, backgroundColor: cat.color }}
                      />
                    </div>
                    <p className="text-[10px] text-[#8c8b8f]">{cat.desc}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
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
              <p className="text-xs text-[#8c8b8f]">Explore framework signatures</p>
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

function getFrameworkCategory(framework: string): string {
  switch (framework) {
    case "Flutter":
    case "ReactNative":
    case "Cordova":
    case "Capacitor":
    case "Ionic":
    case "NativeScript":
    case "Xamarin":
    case "DotNetMaui":
      return "Cross-Platform";
    case "Unity":
    case "UnrealEngine":
    case "Godot":
      return "Gaming";
    case "NativeAndroidJava":
    case "NativeAndroidKotlin":
    case "JetpackCompose":
      return "Native";
    default:
      return "Runtime";
  }
}
