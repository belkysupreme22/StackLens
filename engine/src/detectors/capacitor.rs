//! Capacitor framework detector.

use super::traits::{DetectionContext, Detector};
use stacklens_shared::*;

/// Detector for the Ionic Capacitor modern hybrid runtime framework.
pub struct CapacitorDetector;

impl Detector for CapacitorDetector {
    fn name(&self) -> &str {
        "Capacitor Detector"
    }

    fn detect(&self, context: &DetectionContext) -> FrameworkDetection {
        let mut evidence = Vec::new();
        let limitations = Vec::new();
        let mut score: f64 = 0.0;

        // 1. STRONG: capacitor.config.json or capacitor.config.ts in assets or root
        let has_config_json = context.has_file(|p| p.ends_with("capacitor.config.json"));
        let has_config_ts = context.has_file(|p| p.ends_with("capacitor.config.ts") || p.ends_with("capacitor.config.js"));
        let has_config = has_config_json || has_config_ts;

        if has_config {
            let config_name = if has_config_json {
                "capacitor.config.json"
            } else {
                "capacitor.config.ts"
            };
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::Asset,
                description: format!("Found Capacitor configuration manifest ({})", config_name),
                source: format!("assets/{config_name}"),
                file_path: Some(format!("assets/{config_name}")),
                class_name: None,
            });
            score = 0.85;
        }

        // 2. SUPPORTING: dex_classes or dex_strings with com.getcapacitor
        let cap_classes = context.find_classes(|c| c.contains("com.getcapacitor"));
        let has_cap_dex_string = context.has_dex_string("com.getcapacitor");
        let has_cap_classes = !cap_classes.is_empty() || has_cap_dex_string;

        if has_cap_classes {
            let class_example = cap_classes.first().cloned();
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::DexClass,
                description: format!(
                    "Found Capacitor Android Java runtime bridge classes (com.getcapacitor.*, count: {})",
                    cap_classes.len()
                ),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: class_example,
            });
            if has_config {
                score = 0.92;
            } else if score < 0.70 {
                score = 0.70;
            }
        }

        // 3. STRONG: assets/public/ web content directory
        let has_public_dir = context.has_file(|p| p.starts_with("assets/public/") || p.starts_with("public/"));
        if has_public_dir {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::Asset,
                description: "Found standard Capacitor public web assets directory (assets/public/)".to_string(),
                source: "assets/public/".to_string(),
                file_path: Some("assets/public/".to_string()),
                class_name: None,
            });
            if score < 0.40 {
                score = 0.40;
            }
        }

        // 4. SUPPORTING: assets/public/index.html
        let has_public_index = context.has_file(|p| p.ends_with("public/index.html") || p == "assets/public/index.html");
        if has_public_index {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::Asset,
                description: "Found Capacitor web application entry point (assets/public/index.html)".to_string(),
                source: "assets/public/index.html".to_string(),
                file_path: Some("assets/public/index.html".to_string()),
                class_name: None,
            });
            if has_config && has_cap_classes {
                score = 0.95;
            }
        }

        // 5. SUPPORTING: capacitor.plugins.json in file listing
        let has_plugins_json = context.has_file(|p| p.ends_with("capacitor.plugins.json"));
        if has_plugins_json {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::Asset,
                description: "Found Capacitor registered plugins descriptor (capacitor.plugins.json)".to_string(),
                source: "assets/capacitor.plugins.json".to_string(),
                file_path: Some("assets/capacitor.plugins.json".to_string()),
                class_name: None,
            });
            if score < 0.88 && has_config {
                score += 0.05;
            }
        }

        // Must distinguish from Cordova:
        // If cordova.js is present without capacitor config or capacitor classes, ensure Capacitor score stays low
        if !has_config && !has_cap_classes && context.has_file(|p| p.contains("cordova.js")) {
            score = 0.0;
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
            framework: Framework::Capacitor,
            status,
            confidence,
            confidence_score: score,
            is_primary: score >= 0.6,
            evidence,
            limitations,
        }
    }
}
