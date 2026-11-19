import React from "react";
import { useAppStore } from "@/stores/app-store";
import { AppLayout } from "@/components/layout/app-layout";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { DevicePage } from "@/components/device/device-page";
import { ApkInspectorPage } from "@/components/inspector/apk-inspector-page";
import { BatchAnalysisPage } from "@/components/batch/batch-page";
import { ComparisonPage } from "@/components/comparison/comparison-page";
import { HistoryPage } from "@/components/history/history-page";
import { SettingsPage } from "@/components/settings/settings-page";

export default function App() {
  const { currentPage } = useAppStore();

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />;
      case "devices":
        return <DevicePage />;
      case "inspector":
        return <ApkInspectorPage />;
      case "batch":
        return <BatchAnalysisPage />;
      case "comparison":
        return <ComparisonPage />;
      case "history":
        return <HistoryPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return <AppLayout>{renderPage()}</AppLayout>;
}
