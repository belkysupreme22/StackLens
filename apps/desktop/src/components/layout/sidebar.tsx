import React from "react";
import {
  LayoutDashboard,
  Smartphone,
  PackageSearch,
  FileSearch,
  Layers,
  GitCompare,
  BookOpen,
  History,
  Fingerprint,
  Settings,
  Info,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useAppStore, PageId } from "@/stores/app-store";
import { cn } from "@/lib/utils";

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "devices", label: "Device Manager", icon: Smartphone },
  { id: "analyzer", label: "Package Analyzer", icon: PackageSearch },
  { id: "inspector", label: "APK Inspector", icon: FileSearch },
  { id: "batch", label: "Batch Analysis", icon: Layers },
  { id: "comparison", label: "Comparison Studio", icon: GitCompare },
  { id: "explorer", label: "Framework Explorer", icon: BookOpen },
  { id: "history", label: "Analysis History", icon: History },
  { id: "signatures", label: "Custom Signatures", icon: Fingerprint },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "about", label: "About", icon: Info },
];

export function Sidebar() {
  const { currentPage, setCurrentPage, sidebarCollapsed, setSidebarCollapsed, adbAvailable, devices } =
    useAppStore();

  const onlineDevicesCount = devices.filter((d) => d.state === "Online").length;

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-neutral-800 bg-neutral-950 transition-all duration-200 select-none",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Logo Header */}
      <div className="flex h-14 items-center justify-between border-b border-neutral-800 px-4">
        <div
          onClick={() => setCurrentPage("dashboard")}
          className="flex items-center gap-3 cursor-pointer overflow-hidden"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wider text-neutral-100 flex items-center gap-1.5">
                STACK<span className="text-indigo-400">LENS</span>
              </span>
              <span className="text-[10px] text-neutral-400 font-mono tracking-tighter">
                APP INTELLIGENCE
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1 rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/60 transition-colors"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 cursor-pointer",
                isActive
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm"
                  : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 border border-transparent"
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-indigo-400" : "text-neutral-400 group-hover:text-neutral-200"
                )}
              />
              {!sidebarCollapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {!sidebarCollapsed && item.id === "devices" && (
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    onlineDevicesCount > 0
                      ? "bg-emerald-400 ring-2 ring-emerald-400/20"
                      : adbAvailable
                      ? "bg-neutral-600"
                      : "bg-rose-500"
                  )}
                  title={
                    onlineDevicesCount > 0
                      ? `${onlineDevicesCount} device(s) online`
                      : adbAvailable
                      ? "No devices connected"
                      : "ADB unavailable"
                  }
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer info */}
      {!sidebarCollapsed && (
        <div className="border-t border-neutral-800 p-3 text-[10px] text-neutral-400 flex items-center justify-between">
          <span>v0.1.0 • Desktop</span>
          <span className="inline-block px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 font-mono">
            Offline-first
          </span>
        </div>
      )}
    </aside>
  );
}
