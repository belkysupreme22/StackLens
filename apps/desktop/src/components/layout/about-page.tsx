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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Brand Hero Card */}
      <Card className="p-8 border-[#26262a] bg-[#131315] rounded-[20px] text-center space-y-4 shadow-sm">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#18181b] border border-[#26262a] p-1 shadow-md">
            <img src="/stacklens-icon.svg" alt="StackLens Logo" className="h-14 w-14 object-contain" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#ffffff]">
            Stack<span className="text-[#47ab61]">Lens</span>
          </h2>
          <p className="text-xs text-[#8c8b8f] mt-1">
            Inspect any Android app. Know the stack in seconds.
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge variant="outline" className="text-xs rounded-full px-3 border-[#26262a]">
              v0.1.0
            </Badge>
            <Badge variant="outline" className="text-xs rounded-full px-3 text-[#47ab61] border-[#47ab61]/30 bg-[#47ab61]/10">
              com.stacklens.desktop
            </Badge>
          </div>
        </div>

        <p className="text-xs text-[#8c8b8f] max-w-xl mx-auto leading-relaxed">
          Offline Android application intelligence and reverse engineering desktop suite built with Rust and Tauri 2.
        </p>
      </Card>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 border-[#26262a] bg-[#131315] rounded-[20px] space-y-2">
          <div className="flex items-center gap-2 text-[#47ab61] font-semibold text-xs tracking-tight">
            <Cpu className="h-4 w-4" strokeWidth={1.5} />
            Pure Rust engine
          </div>
          <p className="text-xs text-[#8c8b8f] leading-relaxed">
            Fast in-memory parsing of APK archives, binary AXML manifests, and DEX class descriptors without Java dependencies.
          </p>
        </Card>

        <Card className="p-5 border-[#26262a] bg-[#131315] rounded-[20px] space-y-2">
          <div className="flex items-center gap-2 text-[#47ab61] font-semibold text-xs tracking-tight">
            <Lock className="h-4 w-4" strokeWidth={1.5} />
            Offline privacy
          </div>
          <p className="text-xs text-[#8c8b8f] leading-relaxed">
            All analysis executes locally on your workstation. No application binaries or telemetry leave your computer.
          </p>
        </Card>

        <Card className="p-5 border-[#26262a] bg-[#131315] rounded-[20px] space-y-2">
          <div className="flex items-center gap-2 text-[#47ab61] font-semibold text-xs tracking-tight">
            <Terminal className="h-4 w-4" strokeWidth={1.5} />
            Unified CLI & desktop
          </div>
          <p className="text-xs text-[#8c8b8f] leading-relaxed">
            Includes the `stacklens` command-line utility for CI pipelines and headless scripting with formatted JSON output.
          </p>
        </Card>

        <Card className="p-5 border-[#26262a] bg-[#131315] rounded-[20px] space-y-2">
          <div className="flex items-center gap-2 text-[#47ab61] font-semibold text-xs tracking-tight">
            <Database className="h-4 w-4" strokeWidth={1.5} />
            Local SQLite persistence
          </div>
          <p className="text-xs text-[#8c8b8f] leading-relaxed">
            Historical inspections and custom signatures are cataloged in an embedded, migration-tracked SQLite database.
          </p>
        </Card>
      </div>

      {/* Technology Stack Specifications */}
      <Card className="p-4 border-[#26262a] bg-[#131315] rounded-[20px] space-y-3">
        <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#8c8b8f]">
          Technology stack
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded-[20px] border border-[#26262a] bg-[#0a0a0b]">
            <span className="text-[#8c8b8f] block text-[10px]">Desktop core</span>
            <span className="text-[#ffffff] font-medium">Tauri 2</span>
          </div>
          <div className="p-2.5 rounded-[20px] border border-[#26262a] bg-[#0a0a0b]">
            <span className="text-[#8c8b8f] block text-[10px]">Engine backend</span>
            <span className="text-[#ffffff] font-medium">Rust 1.85+</span>
          </div>
          <div className="p-2.5 rounded-[20px] border border-[#26262a] bg-[#0a0a0b]">
            <span className="text-[#8c8b8f] block text-[10px]">Interface</span>
            <span className="text-[#ffffff] font-medium">React 18 & Vite</span>
          </div>
          <div className="p-2.5 rounded-[20px] border border-[#26262a] bg-[#0a0a0b]">
            <span className="text-[#8c8b8f] block text-[10px]">Styling</span>
            <span className="text-[#ffffff] font-medium">Tailwind CSS</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
