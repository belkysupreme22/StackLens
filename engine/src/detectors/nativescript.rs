//! NativeScript framework detector.

use super::traits::{DetectionContext, Detector};
use stacklens_shared::*;

/// Detector for the Progress NativeScript native JavaScript/TypeScript framework.
pub struct NativeScriptDetector;

impl Detector for NativeScriptDetector {
    fn name(&self) -> &str {
        "NativeScript Detector"
    }

    fn detect(&self, context: &DetectionContext) -> FrameworkDetection {
        let mut evidence = Vec::new();
        let mut limitations = Vec::new();
        let mut score: f64 = 0.0;

        // 1. STRONG / CONFIRMED: libNativeScript.so in native libs
        let has_ns_lib = context.has_native_lib("libNativeScript.so");
        if has_ns_lib {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Confirmed,
                category: EvidenceCategory::NativeLibrary,
                description: "Found NativeScript JavaScript runtime native bridge (libNativeScript.so)".to_string(),
                source: "lib/*/libNativeScript.so".to_string(),
                file_path: Some("lib/*/libNativeScript.so".to_string()),
                class_name: None,
            });
            score = 0.85;
        }

        // 2. STRONG: assets/app/bundle.js or assets/app/vendor.js in file listing
        let has_bundle_js = context.has_file(|p| p.ends_with("app/bundle.js") || p == "assets/app/bundle.js");
        let has_vendor_js = context.has_file(|p| p.ends_with("app/vendor.js") || p == "assets/app/vendor.js");
        let has_app_bundle = has_bundle_js || has_vendor_js;

        if has_app_bundle {
            let bundle_name = if has_bundle_js {
                "assets/app/bundle.js"
            } else {
                "assets/app/vendor.js"
            };
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::Asset,
                description: format!("Found NativeScript compiled application bundle ({})", bundle_name),
                source: bundle_name.to_string(),
                file_path: Some(bundle_name.to_string()),
                class_name: None,
            });
            if has_ns_lib {
                score = 0.93;
            } else if score < 0.75 {
                score = 0.75;
            }
        }

        // 3. SUPPORTING: assets/app/package.json
        let has_package_json = context.has_file(|p| p.ends_with("app/package.json") || p == "assets/app/package.json");
        if has_package_json {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::Asset,
                description: "Found NativeScript app package manifest (assets/app/package.json)".to_string(),
                source: "assets/app/package.json".to_string(),
                file_path: Some("assets/app/package.json".to_string()),
                class_name: None,
            });
            if score >= 0.85 {
                score = (score + 0.03).min(0.96);
            }
        }

        // 4. SUPPORTING: assets/internal/ directory in file listing
        let has_internal_dir = context.has_file(|p| p.starts_with("assets/internal/") || p.starts_with("internal/"));
        if has_internal_dir {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::Asset,
                description: "Found NativeScript internal runtime metadata directory (assets/internal/)".to_string(),
                source: "assets/internal/".to_string(),
                file_path: Some("assets/internal/".to_string()),
                class_name: None,
            });
            if score < 0.60 && has_ns_lib {
                score += 0.05;
            }
        }

        // 5. SUPPORTING: dex_strings with org.nativescript or com.tns.
        let ns_classes = context.find_classes(|c| c.contains("org.nativescript") || c.contains("com.tns."));
        let has_ns_dex = context.has_dex_string("org.nativescript") || context.has_dex_string("com.tns.");

        if !ns_classes.is_empty() || has_ns_dex {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::DexClass,
                description: format!(
                    "Found NativeScript Java runtime binding classes (org.nativescript / com.tns, count: {})",
                    ns_classes.len()
                ),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: ns_classes.first().cloned(),
            });
            if has_ns_lib && has_app_bundle {
                score = 0.96;
            } else if score < 0.70 {
                score = 0.70;
            }
        }

        if has_ns_lib && !has_app_bundle {
            limitations.push("NativeScript native engine detected but application JS bundle was not located in standard assets/app/ folder".to_string());
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
            framework: Framework::NativeScript,
            status,
            confidence,
            confidence_score: score,
            is_primary: score >= 0.6,
            evidence,
            limitations,
        }
    }
}
