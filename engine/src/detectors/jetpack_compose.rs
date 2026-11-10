//! Jetpack Compose UI toolkit detector.

use super::traits::{DetectionContext, Detector};
use stacklens_shared::*;

/// Detector for Android Jetpack Compose modern declarative UI toolkit.
pub struct JetpackComposeDetector;

impl Detector for JetpackComposeDetector {
    fn name(&self) -> &str {
        "Jetpack Compose Detector"
    }

    fn detect(&self, context: &DetectionContext) -> FrameworkDetection {
        let mut evidence = Vec::new();
        let mut limitations = Vec::new();
        let mut score: f64 = 0.0;

        // 1. STRONG: dex_classes with androidx.compose.
        let compose_classes = context.find_classes(|c| c.starts_with("androidx.compose."));
        let has_compose_classes = !compose_classes.is_empty();

        if has_compose_classes {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::DexClass,
                description: format!(
                    "Found {} Jetpack Compose UI toolkit class reference(s) (androidx.compose.*)",
                    compose_classes.len()
                ),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: compose_classes.first().cloned(),
            });
            score = 0.80;
        }

        // 2. STRONG: dex_strings containing androidx.compose.runtime or androidx.compose.ui
        let has_compose_runtime = context.has_dex_string("androidx.compose.runtime")
            || context.has_class(|c| c.contains("androidx.compose.runtime"));
        let has_compose_ui = context.has_dex_string("androidx.compose.ui")
            || context.has_class(|c| c.contains("androidx.compose.ui"));

        if has_compose_runtime {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::DexClass,
                description: "Found Jetpack Compose State/Recomposition runtime (androidx.compose.runtime)".to_string(),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: Some("androidx.compose.runtime.Composable".to_string()),
            });
            if score >= 0.80 {
                score = 0.90;
            } else if score < 0.70 {
                score = 0.70;
            }
        }

        if has_compose_ui {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::DexClass,
                description: "Found Jetpack Compose Layout and Rendering subsystem (androidx.compose.ui)".to_string(),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: Some("androidx.compose.ui.Modifier".to_string()),
            });
            if score < 0.80 {
                score = 0.80;
            }
        }

        // 3. SUPPORTING: Compose Material / Foundation / Animation metadata
        let has_compose_material = context.has_class(|c| c.contains("androidx.compose.material"));
        if has_compose_material {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::DexClass,
                description: "Found Jetpack Compose Material Design design system components".to_string(),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: Some("androidx.compose.material3.MaterialTheme".to_string()),
            });
            if score >= 0.90 {
                score = 0.95;
            }
        }

        limitations.push(
            "Jetpack Compose is a modern UI toolkit running on native Android; classified as secondary framework alongside Native Kotlin/Java".to_string(),
        );

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
            framework: Framework::JetpackCompose,
            status,
            confidence,
            confidence_score: score,
            // Compose is a UI toolkit within native Android, always set is_primary = false
            is_primary: false,
            evidence,
            limitations,
        }
    }
}
