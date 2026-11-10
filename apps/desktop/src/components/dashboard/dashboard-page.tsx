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
  Cpu,
  Boxes,
  Compass,
  Zap,
  Activity,
  Terminal,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { frameworkColor, frameworkDisplayName, formatDate } from "@/lib/utils";
import * as commands from "@/lib/commands";
import { FrameworkLogo } from "@/components/ui/framework-logo";

const SUPPORTED_FRAMEWORKS = [
  { id: "Flutter", name: "Flutter", vendor: "Google", desc: "Dart AOT, libflutter.so, flutter_assets" },
  { id: "ReactNative", name: "React Native", vendor: "Meta", desc: "Hermes bytecode, index.android.bundle" },
  { id: "Unity", name: "Unity Engine", vendor: "Unity", desc: "libunity.so, libil2cpp.so, global-metadata" },
  { id: "JetpackCompose", name: "Jetpack Compose", vendor: "Google", desc: "androidx.compose, compiler runtime" },
  { id: "NativeAndroidKotlin", name: "Kotlin Native", vendor: "JetBrains", desc: "kotlinx.coroutines, standard runtime" },
  { id: "UnrealEngine", name: "Unreal Engine", vendor: "Epic Games", desc: "libUnreal.so, pak chunks, Oodle" },
  { id: "Godot", name: "Godot Engine", vendor: "Godot", desc: "libgodot_android.so, main.pck" },
  { id: "DotNetMaui", name: ".NET MAUI", vendor: "Microsoft", desc: "libmonosgen, Microsoft.Maui.dll" },
];

export function DashboardPage() {
  const {
    dashboardStats,
    loadDashboardStats,
    setCurrentPage,
    setActiveAnalysis,
    devices,
    selectedDeviceSerial,
  } = useAppStore();

  const [hoveredFw, setHoveredFw] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

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

  const connectedDevice = devices.find((d) => d.serial === selectedDeviceSerial) || devices[0];

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

  // Filtered by selected category
  const displayedFrameworks =
    selectedCategory === "All"
      ? rankedFrameworks
      : rankedFrameworks.filter((f) => f.category === selectedCategory);

  // Confidence entries
  const confLevels = [
    { key: "High", label: "High Confidence", color: "#47ab61", desc: "Multiple verified bytecode and library indicators" },
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

  return (
    <div className="space-y-6">
      {/* Live Engine Command Banner (Interactive Hero) */}
      <div className="relative overflow-hidden rounded-[24px] border border-[#26262a] bg-gradient-to-r from-[#18181b] via-[#131315] to-[#0a0a0b] p-6 shadow-md group">
        {/* Ambient subtle emerald glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-[#47ab61]/10 blur-[80px] pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#47ab61] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#47ab61]" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#47ab61]">
                Rust Detection Engine Online
              </span>
              <span className="text-[#333338] text-xs">•</span>
              <span className="text-xs text-[#8c8b8f] font-mono">v0.1.0 Offline Core</span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-[#ffffff] tracking-tight">
              Android Application Intelligence
            </h2>

            <p className="text-xs text-[#8c8b8f] max-w-xl leading-relaxed">
              Deterministic offline bytecode classification, 16 KB page-alignment auditing, native library cataloging, and framework runtime detection.
            </p>
          </div>

          {/* Quick Target Device Status & Launch Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {connectedDevice ? (
              <div
                onClick={() => setCurrentPage("devices")}
                className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#0a0a0b]/80 border border-[#26262a] hover:border-[#47ab61]/50 cursor-pointer transition-all shadow-sm group/dev"
              >
                <div className="p-2 rounded-full bg-[#18181b] border border-[#26262a] text-[#47ab61] group-hover/dev:scale-105 transition-transform">
                  <Smartphone className="h-4 w-4" strokeWidth={1.5} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-[#ffffff] truncate max-w-[140px]">
                    {connectedDevice.model || connectedDevice.serial}
                  </div>
                  <div className="text-[10px] text-[#47ab61] font-mono flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#47ab61] animate-pulse" />
                    Target Connected
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-[#8c8b8f] group-hover/dev:text-[#47ab61] transition-colors" />
              </div>
            ) : null}

            <Button
              onClick={() => setCurrentPage("inspector")}
              className="h-11 px-5 rounded-full bg-[#47ab61] text-[#0a0a0b] hover:bg-[#3b9352] font-semibold text-xs gap-2 shadow-[0_4px_16px_rgba(71,171,97,0.25)] transition-all"
            >
              <Upload className="h-4 w-4" strokeWidth={2} />
              <span>Inspect APK</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-[#26262a] bg-[#131315] hover:border-[#333338] transition-colors rounded-[20px] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8c8b8f] tracking-tight">Total Inspections</span>
            <div className="p-2 rounded-full bg-[#18181b] border border-[#26262a] text-[#47ab61]">
              <Layers className="h-4 w-4" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[#ffffff] tracking-tight tabular-nums">
            {total}
          </div>
          <p className="mt-1 text-xs text-[#8c8b8f]">Analyzed application packages</p>
        </Card>

        <Card className="p-5 border-[#26262a] bg-[#131315] hover:border-[#333338] transition-colors rounded-[20px] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8c8b8f] tracking-tight">Detection Rate</span>
            <div className="p-2 rounded-full bg-[#18181b] border border-[#26262a] text-[#47ab61]">
              <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[#47ab61] tracking-tight tabular-nums flex items-baseline gap-2">
            <span>{successRate}%</span>
            <span className="text-xs text-[#8c8b8f] font-normal">verified</span>
          </div>
          <p className="mt-1 text-xs text-[#8c8b8f]">Attributed framework runtime</p>
        </Card>

        <Card className="p-5 border-[#26262a] bg-[#131315] hover:border-[#333338] transition-colors rounded-[20px] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8c8b8f] tracking-tight">Runtimes Covered</span>
            <div className="p-2 rounded-full bg-[#18181b] border border-[#26262a] text-[#47ab61]">
              <Cpu className="h-4 w-4" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[#ffffff] tracking-tight tabular-nums">
            Supported Catalog
          </div>
          <p className="mt-1 text-xs text-[#8c8b8f]">Cross-platform, native & games</p>
        </Card>

        <Card className="p-5 border-[#26262a] bg-[#131315] hover:border-[#333338] transition-colors rounded-[20px] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8c8b8f] tracking-tight">Connected Targets</span>
            <div className="p-2 rounded-full bg-[#18181b] border border-[#26262a] text-[#47ab61]">
              <Smartphone className="h-4 w-4" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[#ffffff] tracking-tight tabular-nums flex items-center gap-2">
            <span>{dashboardStats?.connected_devices || 0}</span>
            {dashboardStats?.connected_devices ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#47ab61]/15 text-[#47ab61] border border-[#47ab61]/30 font-medium">
                Online
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-[#8c8b8f]">USB transport & emulators</p>
        </Card>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Framework Architecture Distribution (Span 7) */}
        <Card className="lg:col-span-7 p-6 border-[#26262a] bg-[#131315] rounded-[20px] space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-[#ffffff] tracking-tight flex items-center gap-2">
                <span>Framework Distribution</span>
                {rankedFrameworks.length > 0 && (
                  <Badge variant="outline" className="text-xs rounded-full border-[#26262a] text-[#8c8b8f]">
                    {rankedFrameworks.length} detected
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-[#8c8b8f] mt-0.5">
                Runtime technologies identified across your inspected applications
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="inline-flex items-center rounded-full bg-[#18181b] border border-[#26262a] p-1 text-[11px]">
              {["All", "Cross-Platform", "Native", "Gaming"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-0.5 rounded-full font-medium transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#47ab61] text-[#0a0a0b] font-semibold"
                      : "text-[#8c8b8f] hover:text-[#ffffff]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {rankedFrameworks.length > 0 ? (
            <div className="space-y-5">
              {/* Proportional Stacked Spectrum Bar */}
              <div className="space-y-2">
                <div className="h-3.5 w-full rounded-full bg-[#18181b] border border-[#26262a] p-0.5 flex overflow-hidden">
                  {rankedFrameworks.map((fw) => (
                    <div
                      key={fw.id}
                      className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300 relative group cursor-pointer"
                      style={{
                        width: `${Math.max(fw.percentage, 4)}%`,
                        backgroundColor: fw.color,
                        opacity: hoveredFw && hoveredFw !== fw.id ? 0.35 : 1,
                        boxShadow: hoveredFw === fw.id ? `0 0 12px ${fw.color}` : undefined,
                      }}
                      onMouseEnter={() => setHoveredFw(fw.id)}
                      onMouseLeave={() => setHoveredFw(null)}
                      title={`${fw.name}: ${fw.count} apps (${fw.percentage}%)`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#8c8b8f]">
                  <span>Interactive runtime spectrum</span>
                  <span className="font-mono text-[#ffffff]">{total} analyzed packages</span>
                </div>
              </div>

              {/* Framework Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {displayedFrameworks.map((fw) => (
                  <div
                    key={fw.id}
                    onMouseEnter={() => setHoveredFw(fw.id)}
                    onMouseLeave={() => setHoveredFw(null)}
                    onClick={() => setCurrentPage("explorer")}
                    className={`p-3.5 rounded-[16px] border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      hoveredFw === fw.id
                        ? "bg-[#18181b] border-[#47ab61]/50 shadow-[0_4px_20px_rgba(71,171,97,0.12)] scale-[1.01]"
                        : "bg-[#18181b]/60 border-[#26262a] hover:border-[#333338]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-[10px] bg-[#131315] border border-[#26262a] shadow-sm">
                          <FrameworkLogo framework={fw.id} size="sm" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-[#ffffff] tracking-tight">{fw.name}</h4>
                          <span className="text-[10px] text-[#8c8b8f]">{fw.category}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-[#ffffff] tabular-nums">
                          {fw.percentage}%
                        </div>
                        <div className="text-[10px] text-[#8c8b8f] font-mono">
                          {fw.count} {fw.count === 1 ? "app" : "apps"}
                        </div>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="h-1.5 w-full rounded-full bg-[#26262a] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.max(fw.percentage, 4)}%`,
                          backgroundColor: fw.color,
                          boxShadow: hoveredFw === fw.id ? `0 0 10px ${fw.color}` : undefined,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-14 text-center space-y-3 bg-[#18181b]/30 rounded-[16px] border border-dashed border-[#26262a]">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-[#18181b] border border-[#26262a] text-[#8c8b8f]">
                  <Boxes className="h-6 w-6" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-xs text-[#8c8b8f] max-w-sm mx-auto">
                No framework distribution recorded yet. Inspect a package from your connected device or drop an APK file.
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
                <CardTitle className="text-base font-bold text-[#ffffff] tracking-tight">
                  Heuristic Certainty
                </CardTitle>
                <p className="text-xs text-[#8c8b8f] mt-0.5">
                  Confidence distribution across analyzed binaries
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
                        className="h-2 w-2 rounded-full shrink-0 shadow-sm"
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
                        width: `${Math.max(lvl.percentage, lvl.count > 0 ? 4 : 0)}%`,
                        backgroundColor: lvl.color,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-[#8c8b8f]">{lvl.desc}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Engine Architecture Guarantee */}
          <Card className="p-5 border-[#26262a] bg-[#131315] rounded-[20px] space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-[#ffffff] font-semibold">
              <ShieldCheck className="h-4 w-4 text-[#47ab61]" strokeWidth={1.5} />
              <span>Deterministic Offline Engine</span>
            </div>
            <p className="text-xs text-[#8c8b8f] leading-relaxed">
              Signatures are compiled directly into the Rust detection core for maximum performance, protection against regex backtracking, and zero data leakage.
            </p>
            <div className="pt-2 border-t border-[#26262a] flex items-center justify-between text-[11px]">
              <span className="text-[#47ab61] font-mono">100% On-Device</span>
              <span className="text-[#8c8b8f] font-mono">0ms Cloud Latency</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Supported Technology Showcase Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#ffffff] tracking-tight">
              Supported Framework Architectures
            </h3>
            <p className="text-xs text-[#8c8b8f]">
              Direct binary detection across mobile frameworks and game engines
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage("explorer")}
            className="text-xs rounded-full border-[#26262a] hover:bg-[#18181b] gap-1"
          >
            <span>Explore All</span>
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {SUPPORTED_FRAMEWORKS.map((fw) => (
            <div
              key={fw.id}
              onClick={() => setCurrentPage("explorer")}
              className="p-4 rounded-[18px] border border-[#26262a] bg-[#131315] hover:bg-[#18181b] hover:border-[#333338] cursor-pointer transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[12px] bg-[#18181b] border border-[#26262a] shadow-sm group-hover:scale-105 transition-transform">
                  <FrameworkLogo framework={fw.id} size="md" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#ffffff] group-hover:text-[#47ab61] transition-colors">
                    {fw.name}
                  </h4>
                  <span className="text-[10px] text-[#8c8b8f]">{fw.vendor}</span>
                </div>
              </div>
              <p className="text-[11px] font-mono text-[#8c8b8f] truncate">{fw.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Launch Cards */}
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
              <h4 className="text-sm font-semibold text-[#ffffff] tracking-tight">Inspect APK Binary</h4>
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
              <h4 className="text-sm font-semibold text-[#ffffff] tracking-tight">Device Applications</h4>
              <p className="text-xs text-[#8c8b8f]">Pull from phone via ADB (Grid View)</p>
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
              <h4 className="text-sm font-semibold text-[#ffffff] tracking-tight">Runtime Signatures</h4>
              <p className="text-xs text-[#8c8b8f]">Inspect binary indicators</p>
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
              Recent Inspections
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
                      <div className="flex items-center gap-2">
                        {item.primary_framework && (
                          <div className="p-1 rounded-[6px] bg-[#131315] border border-[#26262a]">
                            <FrameworkLogo framework={item.primary_framework} size="sm" />
                          </div>
                        )}
                        <span className="text-[#ffffff] font-medium">
                          {item.primary_framework ? frameworkDisplayName(item.primary_framework) : "Unknown"}
                        </span>
                      </div>
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
