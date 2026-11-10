//! Apache Cordova framework detector.

use super::traits::{DetectionContext, Detector};
use stacklens_shared::*;

/// Detector for the Apache Cordova hybrid webview framework.
pub struct CordovaDetector;

impl Detector for CordovaDetector {
    fn name(&self) -> &str {
        "Cordova Detector"
    }

    fn detect(&self, context: &DetectionContext) -> FrameworkDetection {
        let mut evidence = Vec::new();
        let mut limitations = Vec::new();
        let mut score: f64 = 0.0;

        // 1. STRONG: assets/www/cordova.js in file listing
        let has_cordova_js = context.has_file(|p| {
            p.ends_with("cordova.js") || p.ends_with("/cordova.js") || p == "assets/www/cordova.js"
        });
        if has_cordova_js {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::Asset,
                description: "Found core Apache Cordova JavaScript runtime bridge (cordova.js)".to_string(),
                source: "assets/www/cordova.js".to_string(),
                file_path: Some("assets/www/cordova.js".to_string()),
                class_name: None,
            });
            score = 0.85;
        }

        // 2. STRONG: assets/www/cordova_plugins.js
        let has_cordova_plugins = context.has_file(|p| p.ends_with("cordova_plugins.js"));
        if has_cordova_plugins {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::Asset,
                description: "Found Cordova plugins registry and metadata file (cordova_plugins.js)".to_string(),
                source: "assets/www/cordova_plugins.js".to_string(),
                file_path: Some("assets/www/cordova_plugins.js".to_string()),
                class_name: None,
            });
            if has_cordova_js {
                score = 0.92;
            } else if score < 0.70 {
                score = 0.70;
            }
        }

        // 3. STRONG: assets/www/ directory pattern in file listing
        let has_www_dir = context.has_file(|p| p.starts_with("assets/www/") || p.starts_with("www/"));
        if has_www_dir {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::Asset,
                description: "Found standard Cordova webview asset root directory (assets/www/)".to_string(),
                source: "assets/www/".to_string(),
                file_path: Some("assets/www/".to_string()),
                class_name: None,
            });
            if score < 0.40 {
                score = 0.40;
            }
        }

        // 4. SUPPORTING: dex_strings with org.apache.cordova or classes
        let cordova_classes = context.find_classes(|c| c.contains("org.apache.cordova"));
        let has_cordova_dex_string = context.has_dex_string("org.apache.cordova");
        let has_cordova_classes = !cordova_classes.is_empty() || has_cordova_dex_string;

        if has_cordova_classes {
            let class_example = cordova_classes.first().cloned();
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::DexClass,
                description: format!(
                    "Found Apache Cordova Java bridge classes or DEX string references (org.apache.cordova, count: {})",
                    cordova_classes.len()
                ),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: class_example,
            });
            if has_cordova_js {
                score = 0.95;
            } else if score < 0.75 {
                score = 0.75;
            }
        }

        // 5. SUPPORTING: config.xml with cordova references
        let has_config_xml = context.has_file(|p| {
            p.ends_with("config.xml") || p.ends_with("res/xml/config.xml")
        });
        if has_config_xml {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::FileStructure,
                description: "Found Cordova XML configuration descriptor (config.xml)".to_string(),
                source: "res/xml/config.xml".to_string(),
                file_path: Some("res/xml/config.xml".to_string()),
                class_name: None,
            });
            if score < 0.80 && (has_cordova_js || has_cordova_classes) {
                score += 0.05;
            }
        }

        // 6. SUPPORTING: assets/www/plugins/ directory
        let has_plugins_dir = context.has_file(|p| p.contains("assets/www/plugins/") || p.contains("www/plugins/"));
        if has_plugins_dir {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::Asset,
                description: "Found Cordova installed plugins web assets directory (assets/www/plugins/)".to_string(),
                source: "assets/www/plugins/".to_string(),
                file_path: Some("assets/www/plugins/".to_string()),
                class_name: None,
            });
        }

        // Check for Capacitor conflict: If capacitor.config exists, Cordova might just be legacy plugins
        if context.has_file(|p| p.contains("capacitor.config")) {
            limitations.push("App contains Capacitor configuration; Cordova plugins may be running via Capacitor compatibility layer".to_string());
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
            framework: Framework::Cordova,
            status,
            confidence,
            confidence_score: score,
            is_primary: score >= 0.6,
            evidence,
            limitations,
        }
    }
}
