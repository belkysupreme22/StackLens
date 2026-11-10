//! Unreal Engine game engine detector.

use super::traits::{DetectionContext, Detector};
use stacklens_shared::*;

/// Detector for Epic Games' Unreal Engine runtime.
pub struct UnrealEngineDetector;

impl Detector for UnrealEngineDetector {
    fn name(&self) -> &str {
        "Unreal Engine Detector"
    }

    fn detect(&self, context: &DetectionContext) -> FrameworkDetection {
        let mut evidence = Vec::new();
        let limitations = Vec::new();
        let mut score: f64 = 0.0;

        // 1. CONFIRMED: libUE4.so or libUnreal.so in native libs
        let has_ue4 = context.has_native_lib("libUE4.so");
        let has_unreal = context.has_native_lib("libUnreal.so");
        let has_ue_lib = has_ue4 || has_unreal;

        if has_ue_lib {
            let lib_name = if has_ue4 { "libUE4.so" } else { "libUnreal.so" };
            evidence.push(Evidence {
                evidence_type: EvidenceType::Confirmed,
                category: EvidenceCategory::NativeLibrary,
                description: format!("Found Unreal Engine runtime native library ({})", lib_name),
                source: format!("lib/*/{lib_name}"),
                file_path: Some(format!("lib/*/{lib_name}")),
                class_name: None,
            });
            score = 0.90;
        }

        // 2. STRONG: .pak files in file listing (Unreal pak game archives)
        let pak_files = context.find_files(|p| p.ends_with(".pak"));
        let has_pak_files = !pak_files.is_empty();

        if has_pak_files {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::Asset,
                description: format!(
                    "Found {} Unreal Engine cooked package archive file(s) (*.pak, e.g. {})",
                    pak_files.len(),
                    pak_files[0]
                ),
                source: "*.pak".to_string(),
                file_path: Some(pak_files[0].clone()),
                class_name: None,
            });
            if has_ue_lib {
                score = 0.95;
            } else if score < 0.60 {
                score = 0.60;
            }
        }

        // 3. STRONG: assets/UE4Game/ or similar in file listing
        let has_ue4_game_dir = context.has_file(|p| {
            p.starts_with("assets/UE4Game/")
                || p.contains("/UE4Game/")
                || p.starts_with("assets/Unreal/")
                || p.contains("/Unreal/")
        });
        if has_ue4_game_dir {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::Asset,
                description: "Found Unreal Engine game project asset directory (assets/UE4Game/)".to_string(),
                source: "assets/UE4Game/".to_string(),
                file_path: Some("assets/UE4Game/".to_string()),
                class_name: None,
            });
            if has_ue_lib && has_pak_files {
                score = 0.98;
            } else if has_ue_lib {
                score = 0.95;
            } else if score < 0.70 {
                score = 0.70;
            }
        }

        // 4. SUPPORTING: assets/CookedAssets/ in file listing
        let has_cooked_assets = context.has_file(|p| p.contains("CookedAssets/") || p.contains("CookedAndroid/"));
        if has_cooked_assets {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::Asset,
                description: "Found Unreal Engine cooked asset deployment directory".to_string(),
                source: "assets/CookedAssets/".to_string(),
                file_path: Some("assets/CookedAssets/".to_string()),
                class_name: None,
            });
            if score < 0.90 && has_ue_lib {
                score += 0.03;
            }
        }

        // 5. SUPPORTING: Epic Games classes or dex strings
        let epic_classes = context.find_classes(|c| c.contains("com.epicgames.ue4") || c.contains("com.epicgames.unreal"));
        if !epic_classes.is_empty() {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::DexClass,
                description: format!(
                    "Found Unreal Engine Java GameActivity integration classes ({})",
                    epic_classes[0]
                ),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: Some(epic_classes[0].clone()),
            });
            if score < 0.60 {
                score += 0.20;
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
            framework: Framework::UnrealEngine,
            status,
            confidence,
            confidence_score: score,
            is_primary: score >= 0.6,
            evidence,
            limitations,
        }
    }
}
