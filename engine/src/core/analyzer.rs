//! Core APK Analysis Engine

use std::fs::File;
use std::io::{Cursor, Read, Seek};
use std::path::Path;
use std::time::Instant;

use chrono::Utc;
use sha2::{Digest, Sha256};
use uuid::Uuid;
use zip::ZipArchive;

use crate::apk_parser::{
    catalog_resources, dex, extract_native_libraries, manifest,
};
use crate::detectors::{default_detectors, traits::DetectionContext};
use crate::error::{EngineError, EngineResult};
use stacklens_shared::types::{
    AnalysisConfig, AnalysisResult, ApkMetadata, ApkStructure, CertificateInfo,
    ConfidenceLevel, DetectionStatus, DexFileInfo, Framework, FrameworkDetection,
    SigningInfo,
};

/// High-level analysis pipeline runner.
pub struct Analyzer {
    config: AnalysisConfig,
}

impl Analyzer {
    pub fn new(config: AnalysisConfig) -> Self {
        Self { config }
    }

    /// Analyze an APK file directly from a filesystem path.
    pub fn analyze_file<P: AsRef<Path>>(&self, path: P) -> EngineResult<AnalysisResult> {
        let path_ref = path.as_ref();
        let file = File::open(path_ref)?;
        let metadata = file.metadata()?;
        let file_size = metadata.len();

        if file_size > self.config.max_file_size_bytes {
            return Err(EngineError::InvalidApk(format!(
                "File size ({:.1} MB) exceeds configured limit ({:.1} MB)",
                file_size as f64 / (1024.0 * 1024.0),
                self.config.max_file_size_bytes as f64 / (1024.0 * 1024.0)
            )));
        }

        let filename = path_ref
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "unknown.apk".to_string());

        self.analyze_reader(file, filename, file_size)
    }

    /// Analyze an APK from in-memory bytes.
    pub fn analyze_bytes(&self, filename: String, bytes: Vec<u8>) -> EngineResult<AnalysisResult> {
        let file_size = bytes.len() as u64;
        let cursor = Cursor::new(bytes);
        self.analyze_reader(cursor, filename, file_size)
    }

    fn analyze_reader<R: Read + Seek>(
        &self,
        reader: R,
        filename: String,
        file_size: u64,
    ) -> EngineResult<AnalysisResult> {
        let start_time = Instant::now();
        let mut warnings = Vec::new();

        let mut archive = ZipArchive::new(reader).map_err(|e| {
            EngineError::InvalidApk(format!("Failed to open APK as ZIP archive: {e}"))
        })?;

        // 1. Gather all file paths and sizes
        let mut file_listing = Vec::new();
        let mut file_sizes = Vec::new();
        let mut dex_files = Vec::new();
        let mut manifest_bytes: Option<Vec<u8>> = None;
        let mut dex_raw_entries = Vec::new();
        let mut signature_file_bytes = Vec::new();

        for i in 0..archive.len() {
            if let Ok(mut zip_file) = archive.by_index(i) {
                let name = zip_file.name().to_string();
                let size = zip_file.size();
                file_listing.push(name.clone());
                file_sizes.push((name.clone(), size));

                if name == "AndroidManifest.xml" {
                    let mut buf = Vec::new();
                    if zip_file.read_to_end(&mut buf).is_ok() {
                        manifest_bytes = Some(buf);
                    }
                } else if name.ends_with(".dex") {
                    dex_files.push(DexFileInfo {
                        name: name.clone(),
                        size,
                    });
                    // Read up to 8MB of primary classes.dex for class scanning to keep memory lean
                    if dex_raw_entries.len() < 3 {
                        let mut buf = Vec::new();
                        let mut limited = zip_file.take(8 * 1024 * 1024);
                        if limited.read_to_end(&mut buf).is_ok() {
                            dex_raw_entries.push(buf);
                        }
                    }
                } else if name.starts_with("META-INF/") && (name.ends_with(".RSA") || name.ends_with(".DSA") || name.ends_with(".EC")) {
                    let mut buf = Vec::new();
                    if zip_file.read_to_end(&mut buf).is_ok() {
                        signature_file_bytes.push((name.clone(), buf));
                    }
                }
            }
        }

        // 2. Parse Manifest
        let manifest_info = if let Some(ref m_bytes) = manifest_bytes {
            manifest::parse_manifest(m_bytes)
        } else {
            warnings.push("AndroidManifest.xml not found or unreadable in APK".to_string());
            manifest::ManifestInfo {
                package_name: None,
                version_name: None,
                version_code: None,
                min_sdk: None,
                target_sdk: None,
                permissions: Vec::new(),
                activities: Vec::new(),
                main_activity: None,
                is_split_apk: false,
                split_name: None,
                all_strings: Vec::new(),
            }
        };

        // 3. Extract DEX strings and class names
        let mut dex_classes = Vec::new();
        let mut all_dex_strings = Vec::new();
        for dex_bytes in &dex_raw_entries {
            if let Ok(strings) = dex::parse_dex_strings(dex_bytes) {
                let classes = dex::extract_class_names(&strings);
                dex_classes.extend(classes);
                // Also add raw strings that look like package prefixes
                for s in &strings {
                    if s.starts_with("L") && s.contains('/') {
                        if let Some(c) = dex::descriptor_to_class_name(s) {
                            dex_classes.push(c);
                        }
                    }
                }
                all_dex_strings.extend(strings);
            }
        }
        dex_classes.sort();
        dex_classes.dedup();
        all_dex_strings.sort();
        all_dex_strings.dedup();

        // 4. Catalog Native Libraries
        let native_libraries = extract_native_libraries(&file_listing, &file_sizes);

        // 5. Catalog Assets and Resources
        let resource_info = catalog_resources(&file_listing);

        // 6. Inspect Signing Certificates
        let signing_info = if !signature_file_bytes.is_empty() {
            let mut certs = Vec::new();
            for (sig_name, sig_data) in &signature_file_bytes {
                let mut hasher = Sha256::new();
                hasher.update(sig_data);
                let sha256_hash = hex::encode(hasher.finalize());
                certs.push(CertificateInfo {
                    subject: Some(format!("APK Signature Block ({sig_name})")),
                    issuer: None,
                    fingerprint_sha256: Some(sha256_hash),
                    valid_from: None,
                    valid_to: None,
                });
            }
            Some(SigningInfo {
                scheme: Some("v1 (JAR Signature / META-INF)".to_string()),
                certificates: certs,
            })
        } else {
            None
        };

        // 7. Formulate APK Metadata
        let app_label = manifest_info
            .package_name
            .as_deref()
            .map(|pkg| pkg.split('.').last().unwrap_or(pkg))
            .map(|s| s.to_string());

        let apk_metadata = ApkMetadata {
            filename,
            file_size,
            package_name: manifest_info.package_name.clone(),
            app_label,
            version_name: manifest_info.version_name.clone(),
            version_code: manifest_info.version_code,
            min_sdk: manifest_info.min_sdk,
            target_sdk: manifest_info.target_sdk,
            permissions: manifest_info.permissions.clone(),
            main_activity: manifest_info.main_activity.clone(),
            is_split_apk: manifest_info.is_split_apk,
            split_name: manifest_info.split_name.clone(),
        };

        // 8. Build Detection Context
        let context = DetectionContext {
            file_listing: file_listing.clone(),
            native_libs: native_libraries.clone(),
            assets: resource_info.assets.clone(),
            dex_classes: dex_classes.clone(),
            dex_strings: all_dex_strings,
            manifest_content: manifest_bytes,
            manifest_strings: manifest_info.all_strings.clone(),
            apk_metadata: apk_metadata.clone(),
        };

        // 9. Run all detectors
        let detectors = default_detectors();
        let mut detections = Vec::new();

        for detector in detectors {
            let det = detector.detect(&context);
            if det.status == DetectionStatus::Detected || det.confidence >= ConfidenceLevel::Low {
                detections.push(det);
            }
        }

        // 10. Prioritize and select primary framework
        designate_primary_framework(&mut detections);

        // If no framework was detected with reasonable confidence, append Unknown detection
        if !detections.iter().any(|d| d.status == DetectionStatus::Detected) {
            detections.push(FrameworkDetection {
                framework: Framework::Unknown,
                status: DetectionStatus::Inconclusive,
                confidence: ConfidenceLevel::Inconclusive,
                confidence_score: 0.0,
                is_primary: true,
                evidence: Vec::new(),
                limitations: vec![
                    "No supported framework indicators met confidence threshold; APK may use a custom, obfuscated, or unsupported runtime engine".to_string()
                ],
            });
        }

        // 11. Assemble final structure
        let apk_structure = ApkStructure {
            dex_files,
            native_libraries,
            assets: resource_info.assets,
            resource_count: resource_info.resource_count,
            resource_types: resource_info.resource_types,
            total_entries: file_listing.len(),
        };

        let duration = start_time.elapsed().as_millis() as u64;

        Ok(AnalysisResult {
            schema_version: "1.0.0".to_string(),
            analysis_id: Uuid::new_v4().to_string(),
            timestamp: Utc::now().to_rfc3339(),
            apk: apk_metadata,
            detections,
            apk_structure,
            signing_info,
            warnings,
            analysis_duration_ms: duration,
        })
    }
}

/// Assigns `is_primary = true` to the most significant primary framework according to hierarchy:
/// Game/Hybrid frameworks (Flutter, React Native, Unity, Unreal, Godot, .NET MAUI, Xamarin, NativeScript, Cordova, Capacitor)
/// supersede Native Kotlin / Native Java.
/// Jetpack Compose and Ionic are secondary toolkits.
fn designate_primary_framework(detections: &mut [FrameworkDetection]) {
    let hybrid_precedence = [
        Framework::Flutter,
        Framework::ReactNative,
        Framework::Unity,
        Framework::UnrealEngine,
        Framework::Godot,
        Framework::DotNetMaui,
        Framework::Xamarin,
        Framework::NativeScript,
        Framework::Capacitor,
        Framework::Cordova,
    ];

    // Check if any hybrid / game framework is detected
    for fw in &hybrid_precedence {
        if let Some(pos) = detections.iter().position(|d| d.framework == *fw && d.status == DetectionStatus::Detected) {
            detections[pos].is_primary = true;
            return;
        }
    }

    // Check if Native Kotlin is detected
    if let Some(pos) = detections.iter().position(|d| d.framework == Framework::NativeAndroidKotlin && d.status == DetectionStatus::Detected) {
        detections[pos].is_primary = true;
        return;
    }

    // Check if Native Java is detected
    if let Some(pos) = detections.iter().position(|d| d.framework == Framework::NativeAndroidJava && d.status == DetectionStatus::Detected) {
        detections[pos].is_primary = true;
        return;
    }

    // Otherwise, assign highest confidence score among detected
    if let Some(max_det) = detections
        .iter_mut()
        .filter(|d| d.status == DetectionStatus::Detected)
        .max_by(|a, b| a.confidence_score.partial_cmp(&b.confidence_score).unwrap_or(std::cmp::Ordering::Equal))
    {
        max_det.is_primary = true;
    }
}
