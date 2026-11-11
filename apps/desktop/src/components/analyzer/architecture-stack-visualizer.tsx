import React from "react";
import { Layers, Cpu, Binary, HardDrive, ShieldCheck, CheckCircle2 } from "lucide-react";
import { frameworkDisplayName } from "@/lib/utils";
import type { FrameworkDetection, NativeLibInfo } from "@/types";
import { FrameworkLogo } from "@/components/ui/framework-logo";

interface ArchitectureStackVisualizerProps {
  primaryDetection: FrameworkDetection | null;
  nativeLibs: NativeLibInfo[];
  minSdk: number | null;
  targetSdk: number | null;
  is16kbCompliant?: boolean;
}

export function ArchitectureStackVisualizer({
  primaryDetection,
  nativeLibs,
  minSdk,
  targetSdk,
  is16kbCompliant = true,
}: ArchitectureStackVisualizerProps) {
  const fwName = primaryDetection ? frameworkDisplayName(primaryDetection.framework) : "Native Android";

  // Determine runtime VM based on detected framework
  const getRuntimeDetails = (fw: string) => {
    switch (fw) {
      case "Flutter":
        return {
          runtime: "Dart AOT Virtual Machine",
          engine: "Flutter Engine (Impeller / Skia C++)",
          subtext: "Compiled ahead-of-time to native ARM machine code",
        };
      case "ReactNative":
        return {
          runtime: "Hermes Bytecode Engine",
          engine: "React Native JNI Fabric / TurboModules",
          subtext: "Pre-compiled optimized bytecode executed via Hermes VM",
        };
      case "Unity":
        return {
          runtime: "Unity il2cpp / Mono Runtime",
          engine: "Unity 3D Native C++ Engine",
          subtext: "C# assemblies transpiled to C++ and compiled to native SOs",
        };
      case "UnrealEngine":
        return {
          runtime: "Unreal Engine 4/5 Core",
          engine: "Custom C++ Gameplay Framework",
          subtext: "Native game loop and slate rendering pipeline",
        };
      case "Godot":
        return {
          runtime: "Godot GDScript / C++ VM",
          engine: "Godot 2D/3D Multiplatform Core",
          subtext: "Embedded engine archive packaging scene bytecode",
        };
      case "Cordova":
      case "Capacitor":
      case "Ionic":
        return {
          runtime: "Chromium Android WebView",
          engine: "JavaScript / Web Standards Bridge",
          subtext: "Hybrid web runtime with native plugin bridge",
        };
      case "JetpackCompose":
        return {
          runtime: "Android Runtime (ART) / Dalvik",
          engine: "Compose Runtime & Compiler Plugin",
          subtext: "Declarative reactive UI compiled directly into DEX bytecode",
        };
      default:
        return {
          runtime: "Android Runtime (ART) AOT / JIT",
          engine: "Android Open Source Project (AOSP) Framework",
          subtext: "Dalvik bytecode executing on ART with profile-guided compilation",
        };
    }
  };

  const runtimeInfo = getRuntimeDetails(primaryDetection?.framework || "");

  // Collect distinct architectures
  const architectures = Array.from(new Set(nativeLibs.map((l) => l.arch))).filter(Boolean);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[#ffffff] tracking-tight">
          Architectural Execution Stack
        </span>
        <span className="text-[10px] text-[#47ab61] font-mono flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Verified Runtime Hierarchy
        </span>
      </div>

      <div className="space-y-2 font-mono text-xs">
        {/* Tier 1: UI & Presentation Layer */}
        <div className="p-3 rounded-[14px] bg-[#18181b] border border-[#26262a] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-[10px] bg-[#131315] border border-[#26262a]">
              {primaryDetection ? (
                <FrameworkLogo framework={primaryDetection.framework} size="sm" />
              ) : (
                <Layers className="h-4 w-4 text-[#47ab61]" />
              )}
            </div>
            <div>
              <div className="text-[#ffffff] font-semibold flex items-center gap-2">
                <span>{fwName}</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#47ab61]/15 text-[#47ab61] border border-[#47ab61]/30">
                  Application Layer
                </span>
              </div>
              <p className="text-[10px] text-[#8c8b8f] font-sans mt-0.5">
                Top-level application logic, views, and state management
              </p>
            </div>
          </div>
          <span className="text-[10px] text-[#8c8b8f] shrink-0">Tier 1</span>
        </div>

        {/* Tier 2: Execution Engine / Virtual Machine */}
        <div className="p-3 rounded-[14px] bg-[#18181b]/80 border border-[#26262a] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-[10px] bg-[#131315] border border-[#26262a] text-[#38bdf8]">
              <Cpu className="h-4 w-4" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-[#ffffff] font-semibold flex items-center gap-2">
                <span>{runtimeInfo.runtime}</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30">
                  Execution VM
                </span>
              </div>
              <p className="text-[10px] text-[#8c8b8f] font-sans mt-0.5">
                {runtimeInfo.subtext}
              </p>
            </div>
          </div>
          <span className="text-[10px] text-[#8c8b8f] shrink-0">Tier 2</span>
        </div>

        {/* Tier 3: Native Shared Objects & Binaries */}
        <div className="p-3 rounded-[14px] bg-[#18181b]/60 border border-[#26262a] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-[10px] bg-[#131315] border border-[#26262a] text-[#fbbf24]">
              <Binary className="h-4 w-4" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-[#ffffff] font-semibold flex items-center gap-2">
                <span>Native Shared Libraries ({nativeLibs.length} .so objects)</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/30">
                  Native Bridge
                </span>
              </div>
              <p className="text-[10px] text-[#8c8b8f] font-sans mt-0.5">
                {architectures.length > 0
                  ? `ABIs: ${architectures.join(" • ")}`
                  : "Pure Dalvik / Managed bytecode without native binaries"}
              </p>
            </div>
          </div>
          <span className="text-[10px] text-[#8c8b8f] shrink-0">Tier 3</span>
        </div>

        {/* Tier 4: Android OS & Kernel ABI */}
        <div className="p-3 rounded-[14px] bg-[#18181b]/40 border border-[#26262a] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-[10px] bg-[#131315] border border-[#26262a] text-[#a78bfa]">
              <HardDrive className="h-4 w-4" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-[#ffffff] font-semibold flex items-center gap-2">
                <span>Android OS Target (API {minSdk ?? "?"} → API {targetSdk ?? "?"})</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#a78bfa]/15 text-[#a78bfa] border border-[#a78bfa]/30">
                  {is16kbCompliant ? "16 KB Aligned" : "4 KB Legacy"}
                </span>
              </div>
              <p className="text-[10px] text-[#8c8b8f] font-sans mt-0.5">
                {is16kbCompliant
                  ? "Compatible with Android 15 memory subsystem & 16 KB page-size kernels"
                  : "Legacy 4 KB memory page alignment"}
              </p>
            </div>
          </div>
          <span className="text-[10px] text-[#8c8b8f] shrink-0">Tier 4</span>
        </div>
      </div>
    </div>
  );
}
