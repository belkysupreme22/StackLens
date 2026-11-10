//! Ionic framework detector.

use super::traits::{DetectionContext, Detector};
use stacklens_shared::*;

/// Detector for the Ionic UI mobile framework (usually built atop Cordova or Capacitor).
pub struct IonicDetector;

impl Detector for IonicDetector {
    fn name(&self) -> &str {
        "Ionic Detector"
    }

    fn detect(&self, context: &DetectionContext) -> FrameworkDetection {
        let mut evidence = Vec::new();
        let mut limitations = Vec::new();
        let mut score: f64 = 0.0;

        // 1. SUPPORTING: Ionic-specific files in assets (www/ or public/)
        let ionic_assets = context.find_files(|p| {
            p.contains("ionic")
                && (p.starts_with("assets/www/")
                    || p.starts_with("assets/public/")
                    || p.starts_with("www/")
                    || p.starts_with("public/")
                    || p.ends_with(".js")
                    || p.ends_with(".css"))
        });

        if !ionic_assets.is_empty() {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::Asset,
                description: format!(
                    "Found {} Ionic UI framework asset file(s) (e.g. {})",
                    ionic_assets.len(),
                    ionic_assets[0]
                ),
                source: "assets/**/ionic*".to_string(),
                file_path: Some(ionic_assets[0].clone()),
                class_name: None,
            });
            score = 0.70;
        }

        // 2. SUPPORTING: @ionic/ package references in assets or strings
        let has_ionic_pkg = context.has_file(|p| p.contains("@ionic/"))
            || context.has_dex_string("@ionic/")
            || context.has_manifest_string(|s| s.contains("@ionic/"));

        if has_ionic_pkg {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::Asset,
                description: "Found @ionic/* package bundle or dependency references".to_string(),
                source: "@ionic/".to_string(),
                file_path: None,
                class_name: None,
            });
            if score > 0.0 {
                score = 0.80;
            } else {
                score = 0.65;
            }
        }

        // 3. SUPPORTING: dex_strings or classes referencing ionic or io.ionic
        let ionic_classes = context.find_classes(|c| c.contains("ionic"));
        let has_ionic_dex = context.has_dex_string("io.ionic") || context.has_dex_string("ionic");

        if !ionic_classes.is_empty() || has_ionic_dex {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::DexClass,
                description: format!(
                    "Found Ionic DEX string or package references (e.g. io.ionic, count: {})",
                    ionic_classes.len()
                ),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: ionic_classes.first().cloned(),
            });
            if score > 0.0 {
                score = 0.80;
            } else {
                score = 0.60;
            }
        }

        limitations.push(
            "Ionic is a web component UI toolkit typically deployed on top of Capacitor or Cordova; classified as secondary framework".to_string(),
        );

        // Determine status and confidence
        let (status, confidence) = if score >= 0.80 {
            (DetectionStatus::Detected, ConfidenceLevel::High)
        } else if score >= 0.60 {
            (DetectionStatus::Detected, ConfidenceLevel::Medium)
        } else if score >= 0.30 {
            (DetectionStatus::Inconclusive, ConfidenceLevel::Low)
        } else {
            (DetectionStatus::NotDetected, ConfidenceLevel::Inconclusive)
        };

        FrameworkDetection {
            framework: Framework::Ionic,
            status,
            confidence,
            confidence_score: score,
            // Ionic is always a secondary framework (runs inside Capacitor or Cordova webview)
            is_primary: false,
            evidence,
            limitations,
        }
    }
}
