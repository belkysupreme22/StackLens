// Tauri command invocations - bridge between React frontend and Rust backend
import { invoke } from "@tauri-apps/api/core";
import type {
  AnalysisResult,
  DeviceInfo,
  DashboardStats,
  AnalysisHistoryEntry,
  AppSettings,
  CustomSignature,
  BatchJob,
} from "@/types";

// === Analysis Commands ===

export async function analyzeApk(path: string): Promise<AnalysisResult> {
  return invoke<AnalysisResult>("analyze_apk", { path });
}

export async function analyzeApkBytes(
  filename: string,
  bytes: number[]
): Promise<AnalysisResult> {
  return invoke<AnalysisResult>("analyze_apk_bytes", { filename, bytes });
}

export async function analyzeBatch(
  paths: string[]
): Promise<string> {
  return invoke<string>("analyze_batch", { paths });
}

export async function getBatchStatus(
  batchId: string
): Promise<BatchJob> {
  return invoke<BatchJob>("get_batch_status", { batchId });
}

export async function cancelBatch(batchId: string): Promise<void> {
  return invoke<void>("cancel_batch", { batchId });
}

// === Device Commands ===

export async function checkAdbAvailable(): Promise<boolean> {
  return invoke<boolean>("check_adb_available");
}

export async function listDevices(): Promise<DeviceInfo[]> {
  return invoke<DeviceInfo[]>("list_devices");
}

export async function getDevicePackages(
  serial: string
): Promise<string[]> {
  return invoke<string[]>("get_device_packages", { serial });
}

export async function pullPackageApk(
  serial: string,
  packageName: string
): Promise<AnalysisResult> {
  return invoke<AnalysisResult>("pull_and_analyze_package", {
    serial,
    packageName,
  });
}

// === History Commands ===

export async function getAnalysisHistory(
  limit?: number,
  offset?: number
): Promise<AnalysisHistoryEntry[]> {
  return invoke<AnalysisHistoryEntry[]>("get_analysis_history", {
    limit: limit ?? 50,
    offset: offset ?? 0,
  });
}

export async function getAnalysisById(
  id: string
): Promise<AnalysisResult | null> {
  return invoke<AnalysisResult | null>("get_analysis_by_id", { id });
}

export async function deleteAnalysis(id: string): Promise<void> {
  return invoke<void>("delete_analysis", { id });
}

export async function clearHistory(): Promise<void> {
  return invoke<void>("clear_history");
}

export async function searchHistory(
  query: string
): Promise<AnalysisHistoryEntry[]> {
  return invoke<AnalysisHistoryEntry[]>("search_history", { query });
}

// === Dashboard Commands ===

export async function getDashboardStats(): Promise<DashboardStats> {
  return invoke<DashboardStats>("get_dashboard_stats");
}

// === Settings Commands ===

export async function getSettings(): Promise<AppSettings> {
  return invoke<AppSettings>("get_settings");
}

export async function updateSettings(
  settings: Partial<AppSettings>
): Promise<void> {
  return invoke<void>("update_settings", { settings });
}

export async function resetSettings(): Promise<AppSettings> {
  return invoke<AppSettings>("reset_settings");
}

// === Custom Signatures ===

export async function getCustomSignatures(): Promise<CustomSignature[]> {
  return invoke<CustomSignature[]>("get_custom_signatures");
}

export async function addCustomSignature(
  signature: Omit<CustomSignature, "id">
): Promise<CustomSignature> {
  return invoke<CustomSignature>("add_custom_signature", { signature });
}

export async function updateCustomSignature(
  signature: CustomSignature
): Promise<void> {
  return invoke<void>("update_custom_signature", { signature });
}

export async function deleteCustomSignature(id: string): Promise<void> {
  return invoke<void>("delete_custom_signature", { id });
}

export async function testSignature(
  signatureId: string,
  apkPath: string
): Promise<AnalysisResult> {
  return invoke<AnalysisResult>("test_signature", { signatureId, apkPath });
}

// === Report Generation ===

export async function exportReport(
  analysisId: string,
  format: "json" | "csv" | "txt" | "pdf",
  outputPath: string
): Promise<string> {
  return invoke<string>("export_report", { analysisId, format, outputPath });
}

export async function exportBatchReport(
  analysisIds: string[],
  format: "json" | "csv" | "txt",
  outputPath: string
): Promise<string> {
  return invoke<string>("export_batch_report", {
    analysisIds,
    format,
    outputPath,
  });
}

// === Utility Commands ===

export async function getAppVersion(): Promise<string> {
  return invoke<string>("get_app_version");
}

export async function checkExternalTools(): Promise<
  Record<string, { available: boolean; path: string | null; version: string | null }>
> {
  return invoke("check_external_tools");
}

export async function openFileInExplorer(path: string): Promise<void> {
  return invoke<void>("open_in_explorer", { path });
}
