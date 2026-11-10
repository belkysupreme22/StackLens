//! Godot engine detector.

use super::traits::{DetectionContext, Detector};
use stacklens_shared::*;

/// Detector for the open-source Godot game engine.
pub struct GodotDetector;

impl Detector for GodotDetector {
    fn name(&self) -> &str {
        "Godot Detector"
    }

    fn detect(&self, context: &DetectionContext) -> FrameworkDetection {
        let mut evidence = Vec::new();
        let limitations = Vec::new();
        let mut score: f64 = 0.0;

        // 1. CONFIRMED: libgodot_android.so in native libs
        let has_godot_android = context.has_native_lib("libgodot_android.so");

        // Supporting check: any native lib matching godot pattern (lib/*/libgodot*.so)
        let godot_native_libs: Vec<_> = context
            .native_libs
            .iter()
            .filter(|l| l.name.contains("godot"))
            .collect();
        let has_any_godot_lib = !godot_native_libs.is_empty();

        if has_godot_android || has_any_godot_lib {
            let lib_name = if has_godot_android {
                "libgodot_android.so"
            } else {
                godot_native_libs[0].name.as_str()
            };
            evidence.push(Evidence {
                evidence_type: EvidenceType::Confirmed,
                category: EvidenceCategory::NativeLibrary,
                description: format!("Found Godot engine runtime native library ({})", lib_name),
                source: format!("lib/*/{lib_name}"),
                file_path: Some(format!("lib/*/{lib_name}")),
                class_name: None,
            });
            score = 0.90;
        }

        // 2. STRONG: .pck files in assets or file listing (Godot package archives)
        let pck_files = context.find_files(|p| p.ends_with(".pck"));
        let has_pck = !pck_files.is_empty();

        if has_pck {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::Asset,
                description: format!(
                    "Found {} Godot game resource pack file(s) (*.pck, e.g. {})",
                    pck_files.len(),
                    pck_files[0]
                ),
                source: "*.pck".to_string(),
                file_path: Some(pck_files[0].clone()),
                class_name: None,
            });
            if score >= 0.90 {
                score = 0.95;
            } else if score < 0.60 {
                score = 0.60;
            }
        }

        // 3. SUPPORTING: dex_strings with org.godotengine or classes
        let godot_classes = context.find_classes(|c| c.contains("org.godotengine.godot"));
        let has_godot_dex = context.has_dex_string("org.godotengine") || !godot_classes.is_empty();

        if has_godot_dex {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::DexClass,
                description: "Found Godot engine Android embedding/activity classes (org.godotengine.godot.*)".to_string(),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: godot_classes.first().cloned(),
            });
            if score >= 0.90 {
                score = 0.98;
            } else if score < 0.50 {
                score = 0.50;
            }
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
            framework: Framework::Godot,
            status,
            confidence,
            confidence_score: score,
            is_primary: score >= 0.6,
            evidence,
            limitations,
        }
    }
}
