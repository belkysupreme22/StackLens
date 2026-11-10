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
  type LucideIcon,
} from "lucide-react";
import { useAppStore, PageId } from "@/stores/app-store";
import { cn } from "@/lib/utils";

interface NavItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "devices", label: "Device manager", icon: Smartphone },
  { id: "analyzer", label: "Package analyzer", icon: PackageSearch },
  { id: "inspector", label: "APK inspector", icon: FileSearch },
  { id: "batch", label: "Batch analysis", icon: Layers },
  { id: "comparison", label: "Comparison studio", icon: GitCompare },
  { id: "explorer", label: "Framework explorer", icon: BookOpen },
  { id: "history", label: "Analysis history", icon: History },
  { id: "signatures", label: "Custom signatures", icon: Fingerprint },
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
        "flex flex-col border-r border-[#1f1f1f] bg-[#000000] select-none",
        sidebarCollapsed ? "w-14" : "w-60"
      )}
    >
      {/* Brand Header - exactly 44px */}
      <div className="flex h-11 items-center justify-between border-b border-[#1f1f1f] px-3">
        <div
          onClick={() => setCurrentPage("dashboard")}
          className="flex items-center gap-2.5 cursor-pointer overflow-hidden"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[2px] bg-[#4ade80] text-[#000000] font-bold">
            <ShieldCheck className="h-3.5 w-3.5 text-[#000000]" strokeWidth={2.2} />
          </div>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-1.5 font-display text-xs tracking-wider text-[#ffffff]">
              <span>STACK<span className="text-[#4ade80]">LENS</span></span>
            </div>
          )}
        </div>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1 rounded-[2px] text-[#7a7a7a] hover:text-[#ffffff] hover:bg-[#141414]"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-0.5 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                "group relative flex w-full items-center gap-2.5 rounded-[3px] px-2.5 py-1.5 text-xs font-mono transition-colors cursor-pointer",
                isActive
                  ? "bg-[#0e0e0e] text-[#ffffff] border border-[#1f1f1f]"
                  : "text-[#7a7a7a] hover:bg-[#070707] hover:text-[#ffffff] border border-transparent"
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-[#4ade80] rounded-r-[1px]" />
              )}

              <Icon
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  isActive ? "text-[#4ade80]" : "text-[#7a7a7a] group-hover:text-[#ffffff]"
                )}
                strokeWidth={1.5}
              />

              {!sidebarCollapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {!sidebarCollapsed && item.id === "devices" && (
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    onlineDevicesCount > 0
                      ? "bg-[#4ade80] animate-status-pulse"
                      : adbAvailable
                      ? "bg-[#2a2a2a]"
                      : "bg-rose-500"
                  )}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      {!sidebarCollapsed && (
        <div className="border-t border-[#1f1f1f] p-2.5 text-[10px] font-mono text-[#7a7a7a] flex items-center justify-between">
          <span>v0.1.0</span>
          <span className="px-1.5 py-0.5 rounded-[2px] bg-[#070707] border border-[#1f1f1f]">
            Offline
          </span>
        </div>
      )}
    </aside>
  );
}
