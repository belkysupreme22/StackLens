//! .NET MAUI framework detector.

use super::traits::{DetectionContext, Detector};
use stacklens_shared::*;

/// Detector for Microsoft's .NET Multi-platform App UI (.NET MAUI) framework.
pub struct DotNetMauiDetector;

impl Detector for DotNetMauiDetector {
    fn name(&self) -> &str {
        ".NET MAUI Detector"
    }

    fn detect(&self, context: &DetectionContext) -> FrameworkDetection {
        let mut evidence = Vec::new();
        let mut limitations = Vec::new();
        let mut score: f64 = 0.0;

        // 1. Check for Mono / .NET runtime native library
        let has_mono = context.has_native_lib("libmonosgen-2.0.so")
            || context.has_native_lib("libmonodroid.so")
            || context.has_native_lib("libnetcore.so");

        if has_mono {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::NativeLibrary,
                description: "Found .NET / Mono mobile runtime library (libmonosgen-2.0.so)".to_string(),
                source: "lib/*/libmonosgen-2.0.so".to_string(),
                file_path: Some("lib/*/libmonosgen-2.0.so".to_string()),
                class_name: None,
            });
        }

        // 2. CONFIRMED / STRONG: Microsoft.Maui.dll in assemblies
        let has_maui_core = context.has_file(|p| p.ends_with("Microsoft.Maui.dll"));
        if has_maui_core {
            let maui_path = context
                .find_files(|p| p.ends_with("Microsoft.Maui.dll"))
                .into_iter()
                .next();
            evidence.push(Evidence {
                evidence_type: if has_mono {
                    EvidenceType::Confirmed
                } else {
                    EvidenceType::StrongIndicator
                },
                category: EvidenceCategory::Asset,
                description: "Found core .NET MAUI assembly (Microsoft.Maui.dll)".to_string(),
                source: "assemblies/Microsoft.Maui.dll".to_string(),
                file_path: maui_path,
                class_name: None,
            });
            score = 0.90;
        }

        // 3. STRONG: Microsoft.Maui.Controls.dll
        let has_maui_controls = context.has_file(|p| p.ends_with("Microsoft.Maui.Controls.dll"));
        if has_maui_controls {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::Asset,
                description: "Found .NET MAUI Controls UI framework assembly (Microsoft.Maui.Controls.dll)".to_string(),
                source: "assemblies/Microsoft.Maui.Controls.dll".to_string(),
                file_path: Some("assemblies/Microsoft.Maui.Controls.dll".to_string()),
                class_name: None,
            });
            if score >= 0.90 {
                score = 0.95;
            } else if score < 0.85 {
                score = 0.85;
            }
        }

        // Boost score if both MAUI core/controls and mono runtime library are confirmed
        if (has_maui_core || has_maui_controls) && has_mono {
            score = 0.98;
        }

        // 4. STRONG: assemblies/ with other .NET MAUI assemblies
        let other_maui = context.find_files(|p| {
            p.contains("Microsoft.Maui.Graphics")
                || p.contains("Microsoft.Maui.Essentials")
                || p.contains("Microsoft.Maui.Controls.Compatibility")
        });
        if !other_maui.is_empty() {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::Asset,
                description: format!(
                    "Found {} additional .NET MAUI ecosystem assembly/assemblies",
                    other_maui.len()
                ),
                source: "assemblies/Microsoft.Maui.*.dll".to_string(),
                file_path: Some(other_maui[0].clone()),
                class_name: None,
            });
            if score < 0.85 {
                score = 0.85;
            }
        }

        // 5. SUPPORTING: .NET 6+ runtime indicators (System.Private.CoreLib.dll, Microsoft.Android.dll)
        let has_net6_runtime = context.has_file(|p| {
            p.ends_with("System.Private.CoreLib.dll") || p.ends_with("Microsoft.Android.dll")
        });
        if has_net6_runtime {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::Asset,
                description: "Found modern .NET 6+ runtime libraries (System.Private.CoreLib.dll / Microsoft.Android.dll)".to_string(),
                source: "assemblies/System.Private.CoreLib.dll".to_string(),
                file_path: Some("assemblies/System.Private.CoreLib.dll".to_string()),
                class_name: None,
            });
            if score < 0.60 && (has_maui_core || has_maui_controls) {
                score += 0.15;
            }
        }

        // Must distinguish from Xamarin:
        // If mono libs exist, but NO MAUI assemblies and only Xamarin assemblies, ensure MAUI score is 0
        if has_mono && !has_maui_core && !has_maui_controls && other_maui.is_empty() {
            score = 0.0;
        }

        if score >= 0.60 && !has_maui_controls {
            limitations.push(".NET MAUI detected, but Microsoft.Maui.Controls was not found; app may use raw Blazor Hybrid or custom handler architecture".to_string());
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
            framework: Framework::DotNetMaui,
            status,
            confidence,
            confidence_score: score,
            is_primary: score >= 0.6,
            evidence,
            limitations,
        }
    }
}
