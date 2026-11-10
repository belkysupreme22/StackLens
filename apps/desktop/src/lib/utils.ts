import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleString();
}

export function frameworkDisplayName(framework: string): string {
  const names: Record<string, string> = {
    Flutter: "Flutter",
    ReactNative: "React Native",
    NativeAndroidJava: "Native Android (Java)",
    NativeAndroidKotlin: "Native Android (Kotlin)",
    Unity: "Unity",
    Xamarin: "Xamarin",
    DotNetMaui: ".NET MAUI",
    Cordova: "Apache Cordova",
    Capacitor: "Capacitor",
    Ionic: "Ionic",
    NativeScript: "NativeScript",
    UnrealEngine: "Unreal Engine",
    Godot: "Godot",
    JetpackCompose: "Jetpack Compose",
    Unknown: "Unknown",
  };
  return names[framework] || framework;
}

export function frameworkColor(framework: string): string {
  const colors: Record<string, string> = {
    Flutter: "#027DFD",
    ReactNative: "#61DAFB",
    NativeAndroidJava: "#3DDC84",
    NativeAndroidKotlin: "#7F52FF",
    Unity: "#222C37",
    Xamarin: "#3498DB",
    DotNetMaui: "#512BD4",
    Cordova: "#E8E8E8",
    Capacitor: "#53B9FF",
    Ionic: "#3880FF",
    NativeScript: "#65ADF1",
    UnrealEngine: "#313131",
    Godot: "#478CBF",
    JetpackCompose: "#4285F4",
    Unknown: "#6B7280",
  };
  return colors[framework] || "#6B7280";
}

export function confidenceBadgeColor(confidence: string): string {
  switch (confidence) {
    case "High":
      return "bg-[#47ab61]/10 text-[#47ab61] border-[#47ab61]/30";
    case "Medium":
      return "bg-amber-400/10 text-amber-300 border-amber-400/30";
    case "Low":
      return "bg-neutral-800 text-neutral-400 border-neutral-700";
    case "Inconclusive":
      return "bg-neutral-900 text-neutral-500 border-neutral-800";
    default:
      return "bg-neutral-900 text-neutral-400 border-neutral-800";
  }
}

export function evidenceTypeColor(type: string): string {
  switch (type) {
    case "Confirmed":
      return "text-[#47ab61]";
    case "StrongIndicator":
      return "text-emerald-300";
    case "Supporting":
      return "text-neutral-300";
    case "Weak":
      return "text-neutral-500";
    case "Conflicting":
      return "text-rose-400";
    default:
      return "text-neutral-400";
  }
}
