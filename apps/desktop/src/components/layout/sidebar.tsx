import React from "react";
import {
  LayoutDashboard,
  Smartphone,
  FileSearch,
  Layers,
  GitCompare,
  History,
  Settings,
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
  { id: "inspector", label: "APK inspector", icon: FileSearch },
  { id: "batch", label: "Batch analysis", icon: Layers },
  { id: "comparison", label: "Comparison studio", icon: GitCompare },
  { id: "history", label: "Analysis history", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { currentPage, setCurrentPage, sidebarCollapsed, setSidebarCollapsed, adbAvailable, devices } =
    useAppStore();

  const onlineDevicesCount = devices.filter((d) => d.state === "Online").length;

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-[#26262a] bg-[#0a0a0b] select-none",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header - perfectly aligned h-14 height with the top navigation bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#26262a] px-4">
        <div
          onClick={() => setCurrentPage("dashboard")}
          className="flex items-center gap-2.5 cursor-pointer overflow-hidden"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden shadow-sm">
            <img src="/stacklens-icon.svg" alt="StackLens" className="h-8 w-8 object-contain" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-1 font-bold text-sm tracking-tight text-[#ffffff]">
              <span>Stack<span className="text-[#47ab61]">Lens</span></span>
            </div>
          )}
        </div>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 rounded-full text-[#8c8b8f] hover:text-[#ffffff] hover:bg-[#18181b] transition-colors cursor-pointer"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-full px-3.5 py-2 text-xs font-medium transition-all cursor-pointer",
                isActive
                  ? "bg-[#18181b] text-[#ffffff] border border-[#26262a] shadow-sm"
                  : "text-[#8c8b8f] hover:bg-[#131315] hover:text-[#ffffff] border border-transparent"
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {isActive && (
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#47ab61] rounded-full" />
              )}

              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-[#47ab61]" : "text-[#8c8b8f] group-hover:text-[#ffffff]"
                )}
                strokeWidth={1.5}
              />

              {!sidebarCollapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {!sidebarCollapsed && item.id === "devices" && (
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    onlineDevicesCount > 0
                      ? "bg-[#47ab61] animate-pulse"
                      : adbAvailable
                      ? "bg-[#26262a]"
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
        <div className="border-t border-[#26262a] p-3 text-xs text-[#8c8b8f] flex items-center justify-between">
          <span className="font-medium">v0.1.0</span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#131315] border border-[#26262a] text-[11px] text-[#47ab61]">
            Offline Ready
          </span>
        </div>
      )}
    </aside>
  );
}
