import React from "react";
import {
  ShieldCheck,
  Code2,
  Terminal,
  Cpu,
  Layers,
  Database,
  Lock,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Brand Hero Card */}
      <Card className="p-6 border-[#1f1f1f] bg-[#070707] rounded-[3px] text-center space-y-3">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-[3px] bg-[#000000] border border-[#1f1f1f] text-[#4ade80]">
            <ShieldCheck className="h-6 w-6" strokeWidth={1.5} />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-mono font-medium tracking-wider text-[#ffffff]">
            STACK<span className="text-[#4ade80]">LENS</span>
          </h2>
          <p className="text-xs font-mono text-[#7a7a7a] mt-0.5">
            Discover. Analyze. Understand.
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs font-mono">
              v0.1.0
            </Badge>
            <Badge variant="outline" className="text-xs font-mono text-[#4ade80] border-[#1f1f1f]">
              com.stacklens.desktop
            </Badge>
          </div>
        </div>

        <p className="text-xs font-mono text-[#7a7a7a] max-w-xl mx-auto leading-relaxed">
          Offline Android application intelligence and runtime framework reverse engineering suite built with Rust and Tauri 2.
        </p>
      </Card>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="p-4 border-[#1f1f1f] bg-[#070707] rounded-[3px] space-y-1.5">
          <div className="flex items-center gap-2 text-[#4ade80] font-mono font-medium text-xs">
            <Cpu className="h-3.5 w-3.5" strokeWidth={1.5} />
            Decoupled Rust engine
          </div>
          <p className="text-xs font-mono text-[#7a7a7a] leading-relaxed">
            The detection engine is implemented in pure Rust (`stacklens-engine`), completely independent of the desktop interface.
          </p>
        </Card>

        <Card className="p-4 border-[#1f1f1f] bg-[#070707] rounded-[3px] space-y-1.5">
          <div className="flex items-center gap-2 text-[#4ade80] font-mono font-medium text-xs">
            <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
            Offline-first privacy
          </div>
          <p className="text-xs font-mono text-[#7a7a7a] leading-relaxed">
            Analyses execute 100% locally on your workstation. No application binaries or telemetry are ever sent over the network.
          </p>
        </Card>

        <Card className="p-4 border-[#1f1f1f] bg-[#070707] rounded-[3px] space-y-1.5">
          <div className="flex items-center gap-2 text-[#4ade80] font-mono font-medium text-xs">
            <Terminal className="h-3.5 w-3.5" strokeWidth={1.5} />
            Unified CLI and desktop suite
          </div>
          <p className="text-xs font-mono text-[#7a7a7a] leading-relaxed">
            Includes the `stacklens` command-line utility for CI pipelines and headless scripting with formatted JSON and CSV outputs.
          </p>
        </Card>

        <Card className="p-4 border-[#1f1f1f] bg-[#070707] rounded-[3px] space-y-1.5">
          <div className="flex items-center gap-2 text-[#4ade80] font-mono font-medium text-xs">
            <Database className="h-3.5 w-3.5" strokeWidth={1.5} />
            Embedded SQLite persistence
          </div>
          <p className="text-xs font-mono text-[#7a7a7a] leading-relaxed">
            Historical inspections and custom signatures are cataloged in an embedded, migration-tracked SQLite database.
          </p>
        </Card>
      </div>

      {/* Technology Stack Specifications */}
      <Card className="p-4 border-[#1f1f1f] bg-[#070707] rounded-[3px] space-y-3">
        <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#7a7a7a]">
          Technology stack
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded-[3px] border border-[#1f1f1f] bg-[#000000]">
            <span className="text-[#7a7a7a] block text-[10px]">Desktop core</span>
            <span className="text-[#ffffff] font-medium">Tauri 2</span>
          </div>
          <div className="p-2.5 rounded-[3px] border border-[#1f1f1f] bg-[#000000]">
            <span className="text-[#7a7a7a] block text-[10px]">Engine backend</span>
            <span className="text-[#ffffff] font-medium">Rust 1.85+</span>
          </div>
          <div className="p-2.5 rounded-[3px] border border-[#1f1f1f] bg-[#000000]">
            <span className="text-[#7a7a7a] block text-[10px]">Interface</span>
            <span className="text-[#ffffff] font-medium">React 18 & Vite</span>
          </div>
          <div className="p-2.5 rounded-[3px] border border-[#1f1f1f] bg-[#000000]">
            <span className="text-[#7a7a7a] block text-[10px]">Styling</span>
            <span className="text-[#ffffff] font-medium">Tailwind CSS</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
