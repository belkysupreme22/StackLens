//! React Native framework detector.

use super::traits::{DetectionContext, Detector};
use stacklens_shared::*;

/// Detector for Meta's React Native framework.
pub struct ReactNativeDetector;

impl Detector for ReactNativeDetector {
    fn name(&self) -> &str {
        "React Native Detector"
    }

    fn detect(&self, context: &DetectionContext) -> FrameworkDetection {
        let mut evidence = Vec::new();
        let mut limitations = Vec::new();
        let mut score: f64 = 0.0;

        // 1. CONFIRMED: libreactnativejni.so or libreactnative.so in native libs
        let has_rn_jni = context.has_native_lib("libreactnativejni.so");
        let has_rn_core = context.has_native_lib("libreactnative.so");
        let has_rn_native_lib = has_rn_jni || has_rn_core;

        if has_rn_native_lib {
            let lib_name = if has_rn_jni {
                "libreactnativejni.so"
            } else {
                "libreactnative.so"
            };
            evidence.push(Evidence {
                evidence_type: EvidenceType::Confirmed,
                category: EvidenceCategory::NativeLibrary,
                description: format!(
                    "Found core React Native runtime bridge library ({})",
                    lib_name
                ),
                source: "lib/*/libreactnative*.so".to_string(),
                file_path: Some(format!("lib/*/{lib_name}")),
                class_name: None,
            });
            score = 0.85;
        }

        // 2. STRONG: index.android.bundle in assets
        let has_bundle = context.has_file(|p| p.ends_with("index.android.bundle"))
            || context.has_asset(|a| a.contains("index.android.bundle"));
        if has_bundle {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::Asset,
                description: "Found React Native compiled JavaScript entry bundle (index.android.bundle)".to_string(),
                source: "assets/index.android.bundle".to_string(),
                file_path: Some("assets/index.android.bundle".to_string()),
                class_name: None,
            });
            if has_rn_native_lib {
                score = 0.95;
            } else if score < 0.80 {
                score = 0.80;
            }
        }

        // 3. SUPPORTING: libhermes.so (Hermes JavaScript engine)
        let has_hermes = context.has_native_lib("libhermes.so");
        if has_hermes {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::NativeLibrary,
                description: "Found Hermes JavaScript bytecode engine (libhermes.so)".to_string(),
                source: "lib/*/libhermes.so".to_string(),
                file_path: Some("lib/*/libhermes.so".to_string()),
                class_name: None,
            });
            if has_rn_native_lib && has_bundle {
                score = 0.97;
            } else if has_rn_native_lib {
                score = 0.90;
            } else if score < 0.50 {
                score += 0.25;
            }
        }

        // 4. SUPPORTING: libjsc.so (JavaScriptCore engine)
        let has_jsc = context.has_native_lib("libjsc.so");
        if has_jsc {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::NativeLibrary,
                description: "Found JavaScriptCore runtime library (libjsc.so)".to_string(),
                source: "lib/*/libjsc.so".to_string(),
                file_path: Some("lib/*/libjsc.so".to_string()),
                class_name: None,
            });
            if score < 0.85 && has_bundle {
                score = 0.90;
            }
        }

        // 5. SUPPORTING: dex_classes or dex_strings containing com.facebook.react
        let react_classes = context.find_classes(|c| c.contains("com.facebook.react"));
        let has_react_classes = !react_classes.is_empty();
        let has_react_strings = context.has_dex_string("com.facebook.react");

        if has_react_classes || has_react_strings {
            let class_example = react_classes.first().cloned();
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::DexClass,
                description: format!(
                    "Found React Native Java/Kotlin framework classes or string references (com.facebook.react, count: {})",
                    react_classes.len()
                ),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: class_example,
            });
            if score < 0.65 {
                score = 0.65;
            }
        }

        // 6. SUPPORTING: libreactperfloggerjni.so, libyoga.so
        if context.has_native_lib("libyoga.so") {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::NativeLibrary,
                description: "Found Meta Yoga Flexbox layout engine (libyoga.so)".to_string(),
                source: "lib/*/libyoga.so".to_string(),
                file_path: Some("lib/*/libyoga.so".to_string()),
                class_name: None,
            });
        }

        if context.has_native_lib("libreactperfloggerjni.so") {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::NativeLibrary,
                description: "Found React Native performance logger library (libreactperfloggerjni.so)".to_string(),
                source: "lib/*/libreactperfloggerjni.so".to_string(),
                file_path: Some("lib/*/libreactperfloggerjni.so".to_string()),
                class_name: None,
            });
        }

        if score >= 0.60 && !has_bundle {
            limitations.push(
                "React Native framework detected but index.android.bundle was not located at standard path; bundle may be split, encrypted, or loaded dynamically".to_string(),
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
            framework: Framework::ReactNative,
            status,
            confidence,
            confidence_score: score,
            is_primary: score >= 0.6,
            evidence,
            limitations,
        }
    }
}
