//! Kotlin framework detector.

use super::traits::{DetectionContext, Detector};
use stacklens_shared::*;

/// Dedicated detector for Native Android applications built with Kotlin.
pub struct KotlinDetector;

impl Detector for KotlinDetector {
    fn name(&self) -> &str {
        "Kotlin Detector"
    }

    fn detect(&self, context: &DetectionContext) -> FrameworkDetection {
        let mut evidence = Vec::new();
        let mut limitations = Vec::new();
        let mut score: f64 = 0.0;

        // 1. Check for Kotlin compiler metadata in file listing (kotlin/ or *.kotlin_module)
        let kotlin_files = context.find_files(|p| p.starts_with("kotlin/") || p.contains(".kotlin_module"));
        let has_kotlin_files = !kotlin_files.is_empty();
        if has_kotlin_files {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::FileStructure,
                description: format!(
                    "Found Kotlin compiler metadata file(s) ({})",
                    kotlin_files[0]
                ),
                source: "kotlin/*.kotlin_module".to_string(),
                file_path: Some(kotlin_files[0].clone()),
                class_name: None,
            });
            score += 0.35;
        }

        // 2. Check for kotlin.Metadata annotations in DEX bytecode
        let has_kotlin_metadata_string = context.has_dex_string("kotlin.Metadata");
        let has_kotlin_metadata_class = context.has_class(|c| c.contains("kotlin.Metadata"));
        let has_kotlin_metadata = has_kotlin_metadata_string || has_kotlin_metadata_class;

        if has_kotlin_metadata {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::DexClass,
                description: "Found kotlin.Metadata annotations on compiled bytecode".to_string(),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: Some("kotlin.Metadata".to_string()),
            });
            score += 0.50;
        }

        // 3. Check for Kotlin standard library and coroutines classes
        let kotlin_classes = context.find_classes(|c| c.starts_with("kotlin.") || c.starts_with("kotlinx."));
        let kotlin_class_count = kotlin_classes.len();
        if kotlin_class_count > 5 {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::DexClass,
                description: format!(
                    "Found {} Kotlin standard library / coroutines runtime classes in DEX",
                    kotlin_class_count
                ),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: kotlin_classes.first().cloned(),
            });
            if score < 0.60 {
                score += 0.20;
            }
        }

        // Check for AndroidX components
        let androidx_classes = context.find_classes(|c| c.starts_with("androidx."));
        if !androidx_classes.is_empty() || context.has_dex_string("androidx.") {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::DexClass,
                description: "Found modern AndroidX support library components".to_string(),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: androidx_classes.first().cloned(),
            });
        }

        score = score.min(1.0);

        let (status, confidence) = if score >= 0.85 {
            (DetectionStatus::Detected, ConfidenceLevel::High)
        } else if score >= 0.60 {
            (DetectionStatus::Detected, ConfidenceLevel::Medium)
        } else if score >= 0.30 {
            (DetectionStatus::Inconclusive, ConfidenceLevel::Low)
        } else {
            (DetectionStatus::NotDetected, ConfidenceLevel::Inconclusive)
        };

        if status == DetectionStatus::Detected {
            limitations.push(
                "Presence of Kotlin runtime does not strictly preclude portions of code written in Java".to_string(),
            );
        }

        FrameworkDetection {
            framework: Framework::NativeAndroidKotlin,
            status,
            confidence,
            confidence_score: score,
            is_primary: score >= 0.60,
            evidence,
            limitations,
        }
    }
}
