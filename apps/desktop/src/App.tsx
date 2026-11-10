import React from "react";
import { useAppStore } from "@/stores/app-store";
import { AppLayout } from "@/components/layout/app-layout";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { DevicePage } from "@/components/device/device-page";
import { PackageAnalyzerPage } from "@/components/analyzer/package-analyzer-page";
import { ApkInspectorPage } from "@/components/inspector/apk-inspector-page";
import { BatchAnalysisPage } from "@/components/batch/batch-page";
import { ComparisonPage } from "@/components/comparison/comparison-page";
import { FrameworkExplorerPage } from "@/components/explorer/explorer-page";
import { HistoryPage } from "@/components/history/history-page";
import { CustomSignaturesPage } from "@/components/signatures/signatures-page";
import { SettingsPage } from "@/components/settings/settings-page";
import { AboutPage } from "@/components/layout/about-page";

export default function App() {
  const { currentPage } = useAppStore();

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />;
      case "devices":
        return <DevicePage />;
      case "analyzer":
        return <PackageAnalyzerPage />;
      case "inspector":
        return <ApkInspectorPage />;
      case "batch":
        return <BatchAnalysisPage />;
      case "comparison":
        return <ComparisonPage />;
      case "explorer":
        return <FrameworkExplorerPage />;
      case "history":
        return <HistoryPage />;
      case "signatures":
        return <CustomSignaturesPage />;
      case "settings":
        return <SettingsPage />;
      case "about":
        return <AboutPage />;
      default:
        return <DashboardPage />;
    }
  };

  return <AppLayout>{renderPage()}</AppLayout>;
}
