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
      <Card className="p-8 border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 via-neutral-900 to-neutral-900 text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 ring-8 ring-indigo-600/10">
            <ShieldCheck className="h-9 w-9" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-wider text-neutral-100">
            STACK<span className="text-indigo-400">LENS</span>
          </h2>
          <p className="text-sm text-indigo-300 font-medium mt-1">
            Discover. Analyze. Understand.
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs font-mono">
              Version 0.1.0
            </Badge>
            <Badge variant="outline" className="text-xs font-mono text-indigo-400 border-indigo-500/30">
              com.stacklens.desktop
            </Badge>
          </div>
        </div>

        <p className="text-xs text-neutral-300 max-w-xl mx-auto leading-relaxed">
          StackLens is a professional Android application intelligence, reverse-engineering, and framework detection platform. It enables engineers, security analysts, and researchers to dissect APK binaries, identify runtime architectures, inspect Dalvik bytecode, and generate structured evidence reports.
        </p>
      </Card>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 border-neutral-800 bg-neutral-900/60 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
            <Cpu className="h-4 w-4" />
            Decoupled Rust Detection Engine
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            The detection engine is implemented in pure Rust (`stacklens-engine`), completely independent of the desktop interface. It is reusable across command-line interfaces, automated CI pipelines, and future server or mobile environments.
          </p>
        </Card>

        <Card className="p-6 border-neutral-800 bg-neutral-900/60 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
            <Lock className="h-4 w-4" />
            Offline-First Privacy Guarantee
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Analyses execute 100% locally on your workstation. No application binaries, classes, assets, or extracted metadata are ever transmitted to any remote servers or third-party telemetry services.
          </p>
        </Card>

        <Card className="p-6 border-neutral-800 bg-neutral-900/60 space-y-2">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs">
            <Terminal className="h-4 w-4" />
            Unified CLI & Desktop Suite
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Includes the `stacklens` command-line utility for scripting, batch scans, and headless server environments with output formats in formatted JSON, CSV, and text reports.
          </p>
        </Card>

        <Card className="p-6 border-neutral-800 bg-neutral-900/60 space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs">
            <Database className="h-4 w-4" />
            Embedded SQLite Persistence
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Historical inspections and custom signatures are securely cataloged in a versioned, migration-tracked SQLite database with indexed lookups and export facilities.
          </p>
        </Card>
      </div>

      {/* Technology Stack Specifications */}
      <Card className="p-6 border-neutral-800 bg-neutral-900/60 space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Technology Stack
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950">
            <span className="text-neutral-400 block text-[10px]">Desktop Core</span>
            <span className="text-neutral-200 font-bold">Tauri 2</span>
          </div>
          <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950">
            <span className="text-neutral-400 block text-[10px]">Engine & Backend</span>
            <span className="text-neutral-200 font-bold">Rust 1.85+</span>
          </div>
          <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950">
            <span className="text-neutral-400 block text-[10px]">User Interface</span>
            <span className="text-neutral-200 font-bold">React 18 & Vite</span>
          </div>
          <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950">
            <span className="text-neutral-400 block text-[10px]">Styling</span>
            <span className="text-neutral-200 font-bold">Tailwind CSS</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
