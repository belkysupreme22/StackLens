// TypeScript types mirroring the Rust shared types

export type Framework =
  | "Flutter"
  | "ReactNative"
  | "NativeAndroidJava"
  | "NativeAndroidKotlin"
  | "Unity"
  | "Xamarin"
  | "DotNetMaui"
  | "Cordova"
  | "Capacitor"
  | "Ionic"
  | "NativeScript"
  | "UnrealEngine"
  | "Godot"
  | "JetpackCompose"
  | "Unknown";

export type ConfidenceLevel = "Inconclusive" | "Low" | "Medium" | "High";

export type EvidenceType =
  | "Confirmed"
  | "StrongIndicator"
  | "Supporting"
  | "Weak"
  | "Conflicting";

export type EvidenceCategory =
  | "FileStructure"
  | "NativeLibrary"
  | "DexClass"
  | "Asset"
  | "Manifest"
  | "Resource"
  | "RuntimeComponent";

export type DetectionStatus = "Detected" | "NotDetected" | "Inconclusive";

export interface Evidence {
  evidence_type: EvidenceType;
  category: EvidenceCategory;
  description: string;
  source: string;
  file_path: string | null;
  class_name: string | null;
}

export interface FrameworkDetection {
  framework: Framework;
  status: DetectionStatus;
  confidence: ConfidenceLevel;
  confidence_score: number;
  is_primary: boolean;
  evidence: Evidence[];
  limitations: string[];
}

export interface ApkMetadata {
  filename: string;
  file_size: number;
  package_name: string | null;
  app_label: string | null;
  version_name: string | null;
  version_code: number | null;
  min_sdk: number | null;
  target_sdk: number | null;
  permissions: string[];
  main_activity: string | null;
  is_split_apk: boolean;
  split_name: string | null;
}

export interface DexFileInfo {
  name: string;
  size: number;
}

export interface NativeLibInfo {
  name: string;
  arch: string;
  size: number;
  purpose: string | null;
}

export interface SigningInfo {
  scheme: string | null;
  certificates: CertificateInfo[];
}

export interface CertificateInfo {
  subject: string | null;
  issuer: string | null;
  fingerprint_sha256: string | null;
  valid_from: string | null;
  valid_to: string | null;
}

export interface ApkStructure {
  dex_files: DexFileInfo[];
  native_libraries: NativeLibInfo[];
  assets: string[];
  resource_count: number;
  resource_types: string[];
  total_entries: number;
}

export interface AnalysisResult {
  schema_version: string;
  analysis_id: string;
  timestamp: string;
  apk: ApkMetadata;
  detections: FrameworkDetection[];
  apk_structure: ApkStructure;
  signing_info: SigningInfo | null;
  warnings: string[];
  analysis_duration_ms: number;
}

export interface DeviceInfo {
  serial: string;
  model: string | null;
  manufacturer: string | null;
  android_version: string | null;
  sdk_level: string | null;
  state: DeviceState;
}

export type DeviceState = "Online" | "Offline" | "Unauthorized" | "Unknown";

export interface CustomSignature {
  id: string;
  name: string;
  framework: string;
  enabled: boolean;
  file_patterns: string[];
  native_lib_patterns: string[];
  asset_patterns: string[];
  class_patterns: string[];
  manifest_patterns: string[];
  evidence_description: string;
  evidence_type: EvidenceType;
}

export interface AnalysisConfig {
  enable_custom_signatures: boolean;
  max_file_size_bytes: number;
  timeout_seconds: number;
}

export interface AppSettings {
  theme: "dark" | "light" | "system";
  apk_output_dir: string;
  temp_dir: string;
  retain_apks: boolean;
  analysis_concurrency: number;
  adb_path: string;
  report_export_dir: string;
  log_level: "error" | "warn" | "info" | "debug" | "trace";
}

// Dashboard types
export interface DashboardStats {
  total_analyses: number;
  total_apks: number;
  framework_distribution: Record<Framework, number>;
  recent_analyses: AnalysisHistoryEntry[];
  connected_devices: number;
  confidence_distribution: Record<ConfidenceLevel, number>;
  success_count: number;
  failure_count: number;
}

export interface AnalysisHistoryEntry {
  id: string;
  timestamp: string;
  filename: string;
  package_name: string | null;
  primary_framework: Framework | null;
  confidence: ConfidenceLevel | null;
  status: "success" | "error";
  error_message: string | null;
}

// Batch analysis types
export interface BatchJob {
  id: string;
  files: BatchFileEntry[];
  status: "pending" | "running" | "completed" | "cancelled";
  started_at: string | null;
  completed_at: string | null;
  progress: number;
  total: number;
}

export interface BatchFileEntry {
  path: string;
  filename: string;
  status: "pending" | "running" | "completed" | "error" | "cancelled";
  result: AnalysisResult | null;
  error: string | null;
}

// Comparison types
export interface ComparisonItem {
  analysis: AnalysisResult;
  label: string;
}
