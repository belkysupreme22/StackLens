//! Native Android (Java and Kotlin) framework detectors.

use super::traits::{DetectionContext, Detector};
use stacklens_shared::*;

/// Detector for Native Android applications (distinguishing between Java and Kotlin).
pub struct NativeAndroidDetector;

impl Detector for NativeAndroidDetector {
    fn name(&self) -> &str {
        "Native Android Detector"
    }

    fn detect(&self, context: &DetectionContext) -> FrameworkDetection {
        let mut evidence = Vec::new();
        let mut limitations = Vec::new();

        // 1. Check for Kotlin indicators
        // Kotlin directory in file listing (e.g. kotlin/ or *.kotlin_module)
        let kotlin_files = context.find_files(|p| p.starts_with("kotlin/") || p.contains(".kotlin_module"));
        let has_kotlin_files = !kotlin_files.is_empty();

        // dex_strings containing kotlin.Metadata
        let has_kotlin_metadata_string = context.has_dex_string("kotlin.Metadata");
        let has_kotlin_metadata_class = context.has_class(|c| c.contains("kotlin.Metadata"));
        let has_kotlin_metadata = has_kotlin_metadata_string || has_kotlin_metadata_class;

        // kotlin. class patterns in dex_classes or dex_strings
        let kotlin_classes = context.find_classes(|c| c.starts_with("kotlin.") || c.starts_with("kotlinx."));
        let kotlin_class_count = kotlin_classes.len();
        let has_kotlin_classes = kotlin_class_count > 5;

        let kotlin_indicator_count = (if has_kotlin_files { 1 } else { 0 })
            + (if has_kotlin_metadata { 1 } else { 0 })
            + (if has_kotlin_classes { 1 } else { 0 });

        // 2. Check for Java / Android platform indicators
        let androidx_classes = context.find_classes(|c| c.starts_with("androidx."));
        let has_androidx = !androidx_classes.is_empty() || context.has_dex_string("androidx.");
        let has_android_support = context.has_class(|c| c.starts_with("android.support."))
            || context.has_dex_string("android.support.");
        let total_classes = context.dex_classes.len();
        let has_android_classes = total_classes > 0;

        // 3. Evaluate whether application is Kotlin or Java
        // Kotlin runtime can exist in non-Kotlin apps (via libraries), so require multiple indicators
        // for high confidence Kotlin.
        if has_kotlin_metadata && kotlin_indicator_count >= 2 {
            // Significant Kotlin metadata present -> NativeAndroidKotlin (0.85)
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
            }

            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::DexClass,
                description: "Found kotlin.Metadata annotations on compiled application bytecode".to_string(),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: Some("kotlin.Metadata".to_string()),
            });

            if has_kotlin_classes {
                evidence.push(Evidence {
                    evidence_type: EvidenceType::Supporting,
                    category: EvidenceCategory::DexClass,
                    description: format!(
                        "Found {} Kotlin standard library / coroutines classes in DEX",
                        kotlin_class_count
                    ),
                    source: "classes.dex".to_string(),
                    file_path: None,
                    class_name: kotlin_classes.first().cloned(),
                });
            }

            if has_androidx {
                evidence.push(Evidence {
                    evidence_type: EvidenceType::Supporting,
                    category: EvidenceCategory::DexClass,
                    description: "Found modern AndroidX support library components".to_string(),
                    source: "classes.dex".to_string(),
                    file_path: None,
                    class_name: androidx_classes.first().cloned(),
                });
            }

            limitations.push(
                "Presence of Kotlin does not preclude portions of code written in Java or other languages".to_string(),
            );

            let score = 0.85;
            FrameworkDetection {
                framework: Framework::NativeAndroidKotlin,
                status: DetectionStatus::Detected,
                confidence: ConfidenceLevel::High,
                confidence_score: score,
                is_primary: true,
                evidence,
                limitations,
            }
        } else if has_android_classes || has_androidx || has_android_support {
            // Only Java indicators present (or minimal Kotlin without metadata) -> NativeAndroidJava (0.70)
            if has_androidx {
                evidence.push(Evidence {
                    evidence_type: EvidenceType::Supporting,
                    category: EvidenceCategory::DexClass,
                    description: "Found modern AndroidX support library components".to_string(),
                    source: "classes.dex".to_string(),
                    file_path: None,
                    class_name: androidx_classes.first().cloned(),
                });
            } else if has_android_support {
                evidence.push(Evidence {
                    evidence_type: EvidenceType::Supporting,
                    category: EvidenceCategory::DexClass,
                    description: "Found legacy Android Support library components".to_string(),
                    source: "classes.dex".to_string(),
                    file_path: None,
                    class_name: None,
                });
            }

            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::DexClass,
                description: format!("Found {} compiled Dalvik bytecode class(es)", total_classes),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: None,
            });

            if !has_kotlin_metadata {
                evidence.push(Evidence {
                    evidence_type: EvidenceType::StrongIndicator,
                    category: EvidenceCategory::DexClass,
                    description: "Absence of kotlin.Metadata annotations indicates primary codebase was compiled directly with Java (javac)".to_string(),
                    source: "classes.dex".to_string(),
                    file_path: None,
                    class_name: None,
                });
            } else {
                evidence.push(Evidence {
                    evidence_type: EvidenceType::Weak,
                    category: EvidenceCategory::DexClass,
                    description: "Isolated Kotlin runtime classes present from third-party libraries".to_string(),
                    source: "classes.dex".to_string(),
                    file_path: None,
                    class_name: None,
                });
            }

            let score = 0.70;
            FrameworkDetection {
                framework: Framework::NativeAndroidJava,
                status: DetectionStatus::Detected,
                confidence: ConfidenceLevel::Medium,
                confidence_score: score,
                is_primary: true,
                evidence,
                limitations,
            }
        } else {
            // No indicators at all -> NotDetected
            FrameworkDetection {
                framework: Framework::NativeAndroidJava,
                status: DetectionStatus::NotDetected,
                confidence: ConfidenceLevel::Inconclusive,
                confidence_score: 0.0,
                is_primary: false,
                evidence: vec![],
                limitations: vec![],
            }
        }
    }
}

/// Standalone detector specifically evaluating Native Android (Kotlin).
pub struct NativeKotlinDetector;

impl Detector for NativeKotlinDetector {
    fn name(&self) -> &str {
        "Native Android (Kotlin) Detector"
    }

    fn detect(&self, context: &DetectionContext) -> FrameworkDetection {
        let mut evidence = Vec::new();
        let mut limitations = Vec::new();
        let mut score: f64 = 0.0;

        let kotlin_files = context.find_files(|p| p.starts_with("kotlin/") || p.contains(".kotlin_module"));
        let has_kotlin_files = !kotlin_files.is_empty();

        let has_kotlin_metadata = context.has_dex_string("kotlin.Metadata")
            || context.has_class(|c| c.contains("kotlin.Metadata"));

        let kotlin_classes = context.find_classes(|c| c.starts_with("kotlin.") || c.starts_with("kotlinx."));
        let kotlin_class_count = kotlin_classes.len();
        let has_kotlin_classes = kotlin_class_count > 5;

        if has_kotlin_files {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::FileStructure,
                description: format!("Found Kotlin compiler metadata file(s) ({})", kotlin_files[0]),
                source: "kotlin/*.kotlin_module".to_string(),
                file_path: Some(kotlin_files[0].clone()),
                class_name: None,
            });
            score += 0.35;
        }

        if has_kotlin_metadata {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::DexClass,
                description: "Found kotlin.Metadata annotations emitted on Kotlin-compiled bytecode".to_string(),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: Some("kotlin.Metadata".to_string()),
            });
            score += 0.50;
        }

        if has_kotlin_classes {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::DexClass,
                description: format!("Found {} Kotlin runtime / stdlib classes in DEX", kotlin_class_count),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: kotlin_classes.first().cloned(),
            });
            if score < 0.60 {
                score += 0.20;
            }
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
            limitations.push("Presence of Kotlin does not strictly preclude portions of code written in Java".to_string());
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

/// Standalone detector specifically evaluating Native Android (Java).
pub struct NativeJavaDetector;

impl Detector for NativeJavaDetector {
    fn name(&self) -> &str {
        "Native Android (Java) Detector"
    }

    fn detect(&self, context: &DetectionContext) -> FrameworkDetection {
        let mut evidence = Vec::new();
        let mut limitations = Vec::new();
        let mut score: f64 = 0.0;

        let androidx_classes = context.find_classes(|c| c.starts_with("androidx."));
        let has_androidx = !androidx_classes.is_empty() || context.has_dex_string("androidx.");
        let has_android_support = context.has_class(|c| c.starts_with("android.support."))
            || context.has_dex_string("android.support.");
        let total_classes = context.dex_classes.len();
        let has_android_classes = total_classes > 0;

        let has_kotlin_metadata = context.has_dex_string("kotlin.Metadata")
            || context.has_class(|c| c.contains("kotlin.Metadata"));

        if has_androidx {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::DexClass,
                description: "Found modern AndroidX support library components".to_string(),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: androidx_classes.first().cloned(),
            });
            score += 0.35;
        } else if has_android_support {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::DexClass,
                description: "Found legacy Android Support library components".to_string(),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: None,
            });
            score += 0.30;
        }

        if has_android_classes {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::DexClass,
                description: format!("Found {} compiled Dalvik bytecode classes", total_classes),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: None,
            });
            score += 0.35;
        }

        if !has_kotlin_metadata && score > 0.0 {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::DexClass,
                description: "Absence of kotlin.Metadata annotations indicates primary codebase was compiled directly with Java".to_string(),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: None,
            });
            score = 0.70;
        } else if has_kotlin_metadata {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Conflicting,
                category: EvidenceCategory::DexClass,
                description: "Kotlin metadata annotations present; Kotlin is likely the primary development language".to_string(),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: None,
            });
            score = (score - 0.40).max(0.15);
            limitations.push("App contains substantial Kotlin bytecode; Java is likely auxiliary or from legacy dependencies".to_string());
        }

        let (status, confidence) = if score >= 0.85 {
            (DetectionStatus::Detected, ConfidenceLevel::High)
        } else if score >= 0.60 {
            (DetectionStatus::Detected, ConfidenceLevel::Medium)
        } else if score >= 0.30 {
            (DetectionStatus::Inconclusive, ConfidenceLevel::Low)
        } else {
            (DetectionStatus::NotDetected, ConfidenceLevel::Inconclusive)
        };

        FrameworkDetection {
            framework: Framework::NativeAndroidJava,
            status,
            confidence,
            confidence_score: score,
            is_primary: score >= 0.60,
            evidence,
            limitations,
        }
    }
}
