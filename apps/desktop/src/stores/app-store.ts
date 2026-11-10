import { create } from "zustand";
import type {
  AnalysisResult,
  DeviceInfo,
  DashboardStats,
  AnalysisHistoryEntry,
  AppSettings,
  CustomSignature,
  BatchJob,
} from "@/types";
import * as commands from "@/lib/commands";

export type PageId =
  | "dashboard"
  | "devices"
  | "analyzer"
  | "inspector"
  | "batch"
  | "comparison"
  | "explorer"
  | "history"
  | "signatures"
  | "settings"
  | "about";

interface AppState {
  // Navigation
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Active Analysis
  activeAnalysis: AnalysisResult | null;
  setActiveAnalysis: (analysis: AnalysisResult | null) => void;

  // Devices & ADB
  adbAvailable: boolean;
  devices: DeviceInfo[];
  selectedDeviceSerial: string | null;
  isRefreshingDevices: boolean;
  refreshDevices: () => Promise<void>;
  setSelectedDeviceSerial: (serial: string | null) => void;
  devicePackagesCache: Record<string, string[]>;
  setDevicePackagesCache: (serial: string, packages: string[]) => void;
  invalidateDevicePackagesCache: (serial?: string) => void;

  // Immersive Fullscreen Pull Loader State
  pullProgress: {
    active: boolean;
    packageName: string;
    appName: string;
    stage: number;
    stageLabel: string;
    details: string;
    error: string | null;
  } | null;
  setPullProgress: (progress: AppState["pullProgress"]) => void;

  // Dashboard Stats
  dashboardStats: DashboardStats | null;
  isLoadingStats: boolean;
  loadDashboardStats: () => Promise<void>;

  // History
  history: AnalysisHistoryEntry[];
  isLoadingHistory: boolean;
  loadHistory: (limit?: number) => Promise<void>;

  // Settings
  settings: AppSettings | null;
  loadSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;

  // Custom Signatures
  signatures: CustomSignature[];
  loadSignatures: () => Promise<void>;

  // Comparison
  comparisonItems: AnalysisResult[];
  addToComparison: (analysis: AnalysisResult) => void;
  removeFromComparison: (id: string) => void;
  clearComparison: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentPage: "dashboard",
  setCurrentPage: (page) => set({ currentPage: page }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  activeAnalysis: null,
  setActiveAnalysis: (analysis) => set({ activeAnalysis: analysis }),

  adbAvailable: false,
  devices: [],
  selectedDeviceSerial: null,
  isRefreshingDevices: false,
  devicePackagesCache: {},
  setDevicePackagesCache: (serial, packages) =>
    set((state) => ({
      devicePackagesCache: { ...state.devicePackagesCache, [serial]: packages },
    })),
  invalidateDevicePackagesCache: (serial) =>
    set((state) => {
      if (serial) {
        const next = { ...state.devicePackagesCache };
        delete next[serial];
        return { devicePackagesCache: next };
      }
      return { devicePackagesCache: {} };
    }),

  pullProgress: null,
  setPullProgress: (pullProgress) => set({ pullProgress }),

  refreshDevices: async () => {
    set({ isRefreshingDevices: true });
    try {
      const available = await commands.checkAdbAvailable();
      set({ adbAvailable: available });
      if (available) {
        const devs = await commands.listDevices();
        set({
          devices: devs,
          selectedDeviceSerial:
            devs.length > 0 ? get().selectedDeviceSerial || devs[0].serial : null,
        });
      } else {
        set({ devices: [], selectedDeviceSerial: null });
      }
    } catch (e) {
      console.error("Failed to refresh devices:", e);
      set({ devices: [], selectedDeviceSerial: null });
    } finally {
      set({ isRefreshingDevices: false });
    }
  },

  setSelectedDeviceSerial: (serial) => set({ selectedDeviceSerial: serial }),

  dashboardStats: null,
  isLoadingStats: false,
  loadDashboardStats: async () => {
    set({ isLoadingStats: true });
    try {
      const stats = await commands.getDashboardStats();
      set({ dashboardStats: stats });
    } catch (e) {
      console.error("Failed to load dashboard stats:", e);
    } finally {
      set({ isLoadingStats: false });
    }
  },

  history: [],
  isLoadingHistory: false,
  loadHistory: async (limit = 50) => {
    set({ isLoadingHistory: true });
    try {
      const hist = await commands.getAnalysisHistory(limit, 0);
      set({ history: hist });
    } catch (e) {
      console.error("Failed to load history:", e);
    } finally {
      set({ isLoadingHistory: false });
    }
  },

  settings: null,
  loadSettings: async () => {
    try {
      const s = await commands.getSettings();
      set({ settings: s });
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  },
  updateSettings: async (newSettings) => {
    try {
      await commands.updateSettings(newSettings);
      const updated = await commands.getSettings();
      set({ settings: updated });
    } catch (e) {
      console.error("Failed to update settings:", e);
    }
  },

  signatures: [],
  loadSignatures: async () => {
    try {
      const sigs = await commands.getCustomSignatures();
      set({ signatures: sigs });
    } catch (e) {
      console.error("Failed to load custom signatures:", e);
    }
  },

  comparisonItems: [],
  addToComparison: (analysis) => {
    const exists = get().comparisonItems.some((i) => i.analysis_id === analysis.analysis_id);
    if (!exists && get().comparisonItems.length < 4) {
      set({ comparisonItems: [...get().comparisonItems, analysis] });
    }
  },
  removeFromComparison: (id) => {
    set({ comparisonItems: get().comparisonItems.filter((i) => i.analysis_id !== id) });
  },
  clearComparison: () => set({ comparisonItems: [] }),
}));
