use serde::{Deserialize, Serialize};
use std::fmt;

// ─── Framework enum ───────────────────────────────────────────────────────────

/// All supported frameworks that StackLens can detect.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum Framework {
    Flutter,
    ReactNative,
    NativeAndroidJava,
    NativeAndroidKotlin,
    Unity,
    Xamarin,
    DotNetMaui,
    Cordova,
    Capacitor,
    Ionic,
    NativeScript,
    UnrealEngine,
    Godot,
    JetpackCompose,
    Unknown,
}

impl fmt::Display for Framework {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Framework::Flutter => write!(f, "Flutter"),
            Framework::ReactNative => write!(f, "React Native"),
            Framework::NativeAndroidJava => write!(f, "Native Android (Java)"),
            Framework::NativeAndroidKotlin => write!(f, "Native Android (Kotlin)"),
            Framework::Unity => write!(f, "Unity"),
            Framework::Xamarin => write!(f, "Xamarin"),
            Framework::DotNetMaui => write!(f, ".NET MAUI"),
            Framework::Cordova => write!(f, "Apache Cordova"),
            Framework::Capacitor => write!(f, "Capacitor"),
            Framework::Ionic => write!(f, "Ionic"),
            Framework::NativeScript => write!(f, "NativeScript"),
            Framework::UnrealEngine => write!(f, "Unreal Engine"),
            Framework::Godot => write!(f, "Godot"),
            Framework::JetpackCompose => write!(f, "Jetpack Compose"),
            Framework::Unknown => write!(f, "Unknown"),
        }
    }
}

// ─── Confidence ───────────────────────────────────────────────────────────────

/// Confidence levels for a detection result.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum ConfidenceLevel {
    Inconclusive,
    Low,
    Medium,
    High,
}

impl fmt::Display for ConfidenceLevel {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ConfidenceLevel::Inconclusive => write!(f, "Inconclusive"),
            ConfidenceLevel::Low => write!(f, "Low"),
            ConfidenceLevel::Medium => write!(f, "Medium"),
            ConfidenceLevel::High => write!(f, "High"),
        }
    }
}

// ─── Evidence types ───────────────────────────────────────────────────────────

/// Classification of how strong a piece of evidence is.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum EvidenceType {
    Confirmed,
    StrongIndicator,
    Supporting,
    Weak,
    Conflicting,
}

impl fmt::Display for EvidenceType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            EvidenceType::Confirmed => write!(f, "Confirmed"),
            EvidenceType::StrongIndicator => write!(f, "Strong Indicator"),
            EvidenceType::Supporting => write!(f, "Supporting"),
            EvidenceType::Weak => write!(f, "Weak"),
            EvidenceType::Conflicting => write!(f, "Conflicting"),
        }
    }
}

/// Category of evidence source within the APK.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum EvidenceCategory {
    FileStructure,
    NativeLibrary,
    DexClass,
    Asset,
    Manifest,
    Resource,
    RuntimeComponent,
}

impl fmt::Display for EvidenceCategory {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            EvidenceCategory::FileStructure => write!(f, "File Structure"),
            EvidenceCategory::NativeLibrary => write!(f, "Native Library"),
            EvidenceCategory::DexClass => write!(f, "DEX Class"),
            EvidenceCategory::Asset => write!(f, "Asset"),
            EvidenceCategory::Manifest => write!(f, "Manifest"),
            EvidenceCategory::Resource => write!(f, "Resource"),
            EvidenceCategory::RuntimeComponent => write!(f, "Runtime Component"),
        }
    }
}

// ─── Detection status ─────────────────────────────────────────────────────────

/// Overall detection status for a framework.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum DetectionStatus {
    Detected,
    NotDetected,
    Inconclusive,
}

impl fmt::Display for DetectionStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DetectionStatus::Detected => write!(f, "Detected"),
            DetectionStatus::NotDetected => write!(f, "Not Detected"),
            DetectionStatus::Inconclusive => write!(f, "Inconclusive"),
        }
    }
}

// ─── Evidence ─────────────────────────────────────────────────────────────────

/// A single piece of evidence found during detection.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Evidence {
    pub evidence_type: EvidenceType,
    pub category: EvidenceCategory,
    pub description: String,
    pub source: String,
    pub file_path: Option<String>,
    pub class_name: Option<String>,
}

// ─── Framework detection result ───────────────────────────────────────────────

/// Detection result for a single framework.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameworkDetection {
    pub framework: Framework,
    pub status: DetectionStatus,
    pub confidence: ConfidenceLevel,
    pub confidence_score: f64,
    pub is_primary: bool,
    pub evidence: Vec<Evidence>,
    pub limitations: Vec<String>,
}

// ─── APK metadata ─────────────────────────────────────────────────────────────

/// Metadata extracted from the APK file.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApkMetadata {
    pub filename: String,
    pub file_size: u64,
    pub package_name: Option<String>,
    pub app_label: Option<String>,
    pub version_name: Option<String>,
    pub version_code: Option<u64>,
    pub min_sdk: Option<u32>,
    pub target_sdk: Option<u32>,
    pub permissions: Vec<String>,
    pub main_activity: Option<String>,
    pub is_split_apk: bool,
    pub split_name: Option<String>,
}

// ─── DEX file info ────────────────────────────────────────────────────────────

/// Information about a DEX file within the APK.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DexFileInfo {
    pub name: String,
    pub size: u64,
}

// ─── Native library info ──────────────────────────────────────────────────────

/// Information about a native library (.so) within the APK.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NativeLibInfo {
    pub name: String,
    pub arch: String,
    pub size: u64,
    pub purpose: Option<String>,
}

// ─── Signing info ─────────────────────────────────────────────────────────────

/// APK signing information.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SigningInfo {
    pub scheme: Option<String>,
    pub certificates: Vec<CertificateInfo>,
}

/// Certificate information.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CertificateInfo {
    pub subject: Option<String>,
    pub issuer: Option<String>,
    pub fingerprint_sha256: Option<String>,
    pub valid_from: Option<String>,
    pub valid_to: Option<String>,
}

// ─── APK structure info ───────────────────────────────────────────────────────

/// Structural overview of an APK's contents.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApkStructure {
    pub dex_files: Vec<DexFileInfo>,
    pub native_libraries: Vec<NativeLibInfo>,
    pub assets: Vec<String>,
    pub resource_count: usize,
    pub resource_types: Vec<String>,
    pub total_entries: usize,
}

// ─── Complete analysis result ─────────────────────────────────────────────────

/// The complete result of an APK analysis.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisResult {
    pub schema_version: String,
    pub analysis_id: String,
    pub timestamp: String,
    pub apk: ApkMetadata,
    pub detections: Vec<FrameworkDetection>,
    pub apk_structure: ApkStructure,
    pub signing_info: Option<SigningInfo>,
    pub warnings: Vec<String>,
    pub analysis_duration_ms: u64,
}

// ─── Device info ──────────────────────────────────────────────────────────────

/// Information about a connected Android device (for ADB integration).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub serial: String,
    pub model: Option<String>,
    pub manufacturer: Option<String>,
    pub android_version: Option<String>,
    pub sdk_level: Option<String>,
    pub state: DeviceState,
}

/// State of a connected Android device.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum DeviceState {
    Online,
    Offline,
    Unauthorized,
    Unknown,
}

impl fmt::Display for DeviceState {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DeviceState::Online => write!(f, "Online"),
            DeviceState::Offline => write!(f, "Offline"),
            DeviceState::Unauthorized => write!(f, "Unauthorized"),
            DeviceState::Unknown => write!(f, "Unknown"),
        }
    }
}

// ─── Custom signature ─────────────────────────────────────────────────────────

/// A user-defined detection signature for custom framework detection.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomSignature {
    pub id: String,
    pub name: String,
    pub framework: String,
    pub enabled: bool,
    pub file_patterns: Vec<String>,
    pub native_lib_patterns: Vec<String>,
    pub asset_patterns: Vec<String>,
    pub class_patterns: Vec<String>,
    pub manifest_patterns: Vec<String>,
    pub evidence_description: String,
    pub evidence_type: EvidenceType,
}

// ─── Analysis config ──────────────────────────────────────────────────────────

/// Configuration options for analysis.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisConfig {
    pub enable_custom_signatures: bool,
    pub max_file_size_bytes: u64,
    pub timeout_seconds: u64,
}

impl Default for AnalysisConfig {
    fn default() -> Self {
        Self {
            enable_custom_signatures: true,
            max_file_size_bytes: 500 * 1024 * 1024, // 500 MB
            timeout_seconds: 300,
        }
    }
}
