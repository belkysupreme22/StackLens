//! Flutter framework detector.

use super::traits::{DetectionContext, Detector};
use stacklens_shared::*;

/// Detector for Google's Flutter cross-platform framework.
pub struct FlutterDetector;

impl Detector for FlutterDetector {
    fn name(&self) -> &str {
        "Flutter Detector"
    }

    fn detect(&self, context: &DetectionContext) -> FrameworkDetection {
        let mut evidence = Vec::new();
        let mut limitations = Vec::new();
        let mut score: f64 = 0.0;

        // 1. CONFIRMED: libflutter.so in native libs
        let flutter_libs = context.find_native_libs("libflutter.so");
        let has_libflutter = !flutter_libs.is_empty();
        if has_libflutter {
            let archs: Vec<_> = flutter_libs.iter().map(|l| l.arch.as_str()).collect();
            evidence.push(Evidence {
                evidence_type: EvidenceType::Confirmed,
                category: EvidenceCategory::NativeLibrary,
                description: format!(
                    "Found Flutter engine runtime library (libflutter.so) for ABI(s): {}",
                    archs.join(", ")
                ),
                source: "lib/*/libflutter.so".to_string(),
                file_path: Some(format!("lib/{}/libflutter.so", archs[0])),
                class_name: None,
            });
            score = 0.90;
        }

        // 2. STRONG: libapp.so alongside flutter (AOT compiled application snapshot)
        let app_libs = context.find_native_libs("libapp.so");
        let has_libapp = !app_libs.is_empty();
        if has_libapp {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::NativeLibrary,
                description: "Found compiled Flutter application snapshot (libapp.so) containing AOT Dart code".to_string(),
                source: "lib/*/libapp.so".to_string(),
                file_path: Some("lib/*/libapp.so".to_string()),
                class_name: None,
            });
            if has_libflutter {
                score = 0.98;
            } else {
                score = (score + 0.60).min(0.85);
            }
        }

        // 3. STRONG: flutter_assets/ directory in file listing
        let has_flutter_assets = context.has_file(|p| {
            p.starts_with("flutter_assets/")
                || p.contains("/flutter_assets/")
                || p.starts_with("assets/flutter_assets/")
        });
        if has_flutter_assets {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::Asset,
                description: "Found flutter_assets/ directory containing compiled Flutter assets, fonts, or manifests".to_string(),
                source: "flutter_assets/".to_string(),
                file_path: Some("assets/flutter_assets/".to_string()),
                class_name: None,
            });
            if has_libflutter && !has_libapp {
                score = 0.95;
            } else if !has_libflutter && score < 0.70 {
                score = 0.70;
            }
        }

        // 4. SUPPORTING: AssetManifest.json, FontManifest.json in flutter_assets
        let has_asset_manifest = context.has_file(|p| {
            p.ends_with("AssetManifest.json")
                || p.ends_with("AssetManifest.bin")
                || p.ends_with("AssetManifest.smcbin")
        });
        if has_asset_manifest {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::Asset,
                description: "Found Flutter AssetManifest index file".to_string(),
                source: "flutter_assets/AssetManifest.json".to_string(),
                file_path: Some("assets/flutter_assets/AssetManifest.json".to_string()),
                class_name: None,
            });
            if score < 0.60 {
                score += 0.20;
            }
        }

        let has_font_manifest = context.has_file(|p| p.ends_with("FontManifest.json"));
        if has_font_manifest {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::Asset,
                description: "Found Flutter FontManifest typography configuration file".to_string(),
                source: "flutter_assets/FontManifest.json".to_string(),
                file_path: Some("assets/flutter_assets/FontManifest.json".to_string()),
                class_name: None,
            });
        }

        // 5. SUPPORTING: kernel_blob.bin or vm_snapshot_data (Dart JIT / debug snapshot)
        let has_kernel_or_snapshot = context.has_file(|p| {
            p.ends_with("kernel_blob.bin")
                || p.ends_with("vm_snapshot_data")
                || p.ends_with("isolate_snapshot_data")
        });
        if has_kernel_or_snapshot {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::Asset,
                description: "Found Dart VM snapshot or kernel blob (JIT/debug runtime artifacts)".to_string(),
                source: "flutter_assets/kernel_blob.bin".to_string(),
                file_path: Some("assets/flutter_assets/kernel_blob.bin".to_string()),
                class_name: None,
            });
            if score < 0.60 {
                score += 0.25;
            }
        }

        // 6. SUPPORTING: io.flutter classes in DEX
        let flutter_classes = context.find_classes(|c| c.starts_with("io.flutter."));
        if !flutter_classes.is_empty() {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::DexClass,
                description: format!(
                    "Found {} Flutter engine Java/Kotlin embedding class reference(s) (e.g. io.flutter.embedding.*)",
                    flutter_classes.len()
                ),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: flutter_classes.first().cloned(),
            });
            if score < 0.50 {
                score += 0.20;
            }
        }

        if has_libflutter && !has_libapp {
            limitations.push(
                "App contains Flutter engine (libflutter.so) but libapp.so was not located; app may use add-to-app, debug JIT mode, or custom library packaging".to_string(),
            );
        }

        // Determine status and confidence
        let (status, confidence) = if score >= 0.85 {
            (DetectionStatus::Detected, ConfidenceLevel::High)
        } else if score >= 0.6 {
            (DetectionStatus::Detected, ConfidenceLevel::Medium)
        } else if score >= 0.3 {
            (DetectionStatus::Inconclusive, ConfidenceLevel::Low)
        } else {
            (DetectionStatus::NotDetected, ConfidenceLevel::Inconclusive)
        };

        FrameworkDetection {
            framework: Framework::Flutter,
            status,
            confidence,
            confidence_score: score,
            is_primary: score >= 0.6,
            evidence,
            limitations,
        }
    }
}
