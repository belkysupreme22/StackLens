//! Unity game engine detector.

use super::traits::{DetectionContext, Detector};
use stacklens_shared::*;

/// Detector for the Unity 3D/2D game engine.
pub struct UnityDetector;

impl Detector for UnityDetector {
    fn name(&self) -> &str {
        "Unity Detector"
    }

    fn detect(&self, context: &DetectionContext) -> FrameworkDetection {
        let mut evidence = Vec::new();
        let mut limitations = Vec::new();
        let mut score: f64 = 0.0;

        // 1. CONFIRMED: libunity.so in native libs
        let has_libunity = context.has_native_lib("libunity.so");
        if has_libunity {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Confirmed,
                category: EvidenceCategory::NativeLibrary,
                description: "Found core Unity engine runtime library (libunity.so)".to_string(),
                source: "lib/*/libunity.so".to_string(),
                file_path: Some("lib/*/libunity.so".to_string()),
                class_name: None,
            });
            score = 0.90;
        }

        // 2. STRONG: libil2cpp.so (IL2CPP ahead-of-time compiled C# runtime)
        let has_il2cpp = context.has_native_lib("libil2cpp.so");
        if has_il2cpp {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::NativeLibrary,
                description: "Found Unity IL2CPP runtime library (libil2cpp.so) executing compiled C# game assemblies".to_string(),
                source: "lib/*/libil2cpp.so".to_string(),
                file_path: Some("lib/*/libil2cpp.so".to_string()),
                class_name: None,
            });
            if has_libunity {
                score = 0.98;
            } else if score < 0.75 {
                score = 0.75;
            }
        }

        // 3. STRONG: assets/bin/Data/ in file listing
        let has_bin_data = context.has_file(|p| {
            p.starts_with("assets/bin/Data/") || p.contains("/bin/Data/") || p.starts_with("bin/Data/")
        });
        if has_bin_data {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::Asset,
                description: "Found Unity binary data directory (assets/bin/Data/) containing serialized scenes, resources, and settings".to_string(),
                source: "assets/bin/Data/".to_string(),
                file_path: Some("assets/bin/Data/".to_string()),
                class_name: None,
            });
            if has_libunity && !has_il2cpp {
                score = 0.95;
            } else if !has_libunity && has_il2cpp {
                score = 0.85;
            } else if !has_libunity && score < 0.75 {
                score = 0.75;
            }
        }

        // 4. SUPPORTING: libmain.so with Unity
        if context.has_native_lib("libmain.so") && (has_libunity || has_bin_data) {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::NativeLibrary,
                description: "Found Unity Android launcher native entry library (libmain.so)".to_string(),
                source: "lib/*/libmain.so".to_string(),
                file_path: Some("lib/*/libmain.so".to_string()),
                class_name: None,
            });
        }

        // 5. SUPPORTING: unity default resources or level files in bin/Data
        let has_unity_resources = context.has_file(|p| {
            p.contains("unity default resources")
                || p.contains("sharedassets")
                || p.ends_with(".assets")
                || (p.contains("bin/Data") && (p.contains("level") || p.ends_with("data.unity3d")))
        });
        if has_unity_resources {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::Asset,
                description: "Found Unity serialized assets and scene level files (sharedassets*.assets, unity default resources)".to_string(),
                source: "assets/bin/Data/sharedassets*.assets".to_string(),
                file_path: Some("assets/bin/Data/unity default resources".to_string()),
                class_name: None,
            });
            if score < 0.60 {
                score += 0.20;
            }
        }

        // 6. SUPPORTING: globalgamemanagers or mainData
        let has_game_managers = context.has_file(|p| {
            p.ends_with("globalgamemanagers") || p.ends_with("mainData") || p.ends_with("globalgamemanagers.assets")
        });
        if has_game_managers {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::Asset,
                description: "Found Unity project settings metadata file (globalgamemanagers / mainData)".to_string(),
                source: "assets/bin/Data/globalgamemanagers".to_string(),
                file_path: Some("assets/bin/Data/globalgamemanagers".to_string()),
                class_name: None,
            });
            if score < 0.50 {
                score += 0.20;
            }
        }

        // 7. SUPPORTING: com.unity3d classes
        let unity_classes = context.find_classes(|c| c.starts_with("com.unity3d."));
        if !unity_classes.is_empty() {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::DexClass,
                description: format!(
                    "Found Unity Player Android Java bridge classes (e.g. com.unity3d.player.UnityPlayerActivity, count: {})",
                    unity_classes.len()
                ),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: unity_classes.first().cloned(),
            });
            if score < 0.50 {
                score += 0.20;
            }
        }

        if has_libunity && !has_il2cpp {
            limitations.push("Unity engine detected using Mono JIT backend rather than IL2CPP ahead-of-time compilation".to_string());
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
            framework: Framework::Unity,
            status,
            confidence,
            confidence_score: score,
            is_primary: score >= 0.6,
            evidence,
            limitations,
        }
    }
}
