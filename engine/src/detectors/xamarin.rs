//! Xamarin framework detector.

use super::traits::{DetectionContext, Detector};
use stacklens_shared::*;

/// Detector for the Microsoft Xamarin / Xamarin.Forms framework.
pub struct XamarinDetector;

impl Detector for XamarinDetector {
    fn name(&self) -> &str {
        "Xamarin Detector"
    }

    fn detect(&self, context: &DetectionContext) -> FrameworkDetection {
        let mut evidence = Vec::new();
        let mut limitations = Vec::new();
        let mut score: f64 = 0.0;

        // 1. CONFIRMED: libmonodroid.so or libmonosgen-2.0.so in native libs
        let has_monodroid = context.has_native_lib("libmonodroid.so");
        let has_monosgen = context.has_native_lib("libmonosgen-2.0.so");
        let has_mono_lib = has_monodroid || has_monosgen;

        if has_mono_lib {
            let lib_name = if has_monodroid {
                "libmonodroid.so"
            } else {
                "libmonosgen-2.0.so"
            };
            evidence.push(Evidence {
                evidence_type: EvidenceType::Confirmed,
                category: EvidenceCategory::NativeLibrary,
                description: format!(
                    "Found Mono Android runtime library ({})",
                    lib_name
                ),
                source: "lib/*/libmono*.so".to_string(),
                file_path: Some(format!("lib/*/{lib_name}")),
                class_name: None,
            });
            score = 0.85;
        }

        // 2. STRONG: assemblies/ directory with .dll files
        let assembly_files = context.find_files(|p| {
            (p.starts_with("assemblies/") || p.contains("/assemblies/")) && p.ends_with(".dll")
        });
        let has_assemblies = !assembly_files.is_empty();

        if has_assemblies {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::Asset,
                description: format!(
                    "Found assemblies/ directory containing {} compiled .NET managed assembly (.dll) file(s)",
                    assembly_files.len()
                ),
                source: "assemblies/*.dll".to_string(),
                file_path: Some(assembly_files[0].clone()),
                class_name: None,
            });
            if has_mono_lib {
                score = 0.95;
            } else if score < 0.70 {
                score = 0.70;
            }
        }

        // 3. STRONG: Xamarin. prefixed assemblies
        let xamarin_assemblies: Vec<_> = assembly_files
            .iter()
            .filter(|p| {
                let fname = p.split('/').last().unwrap_or("");
                fname.starts_with("Xamarin.")
            })
            .collect();
        let has_xamarin_assemblies = !xamarin_assemblies.is_empty();

        if has_xamarin_assemblies {
            evidence.push(Evidence {
                evidence_type: EvidenceType::StrongIndicator,
                category: EvidenceCategory::Asset,
                description: format!(
                    "Found {} Xamarin-specific managed assembly file(s) (e.g. {})",
                    xamarin_assemblies.len(),
                    xamarin_assemblies[0].split('/').last().unwrap_or("")
                ),
                source: "assemblies/Xamarin.*.dll".to_string(),
                file_path: Some(xamarin_assemblies[0].clone()),
                class_name: None,
            });
            if score >= 0.85 {
                score = 0.98;
            } else if score < 0.85 {
                score = 0.85;
            }
        }

        // 4. SUPPORTING: libxamarin-app.so
        if context.has_native_lib("libxamarin-app.so") {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::NativeLibrary,
                description: "Found Xamarin application bootstrap library (libxamarin-app.so)".to_string(),
                source: "lib/*/libxamarin-app.so".to_string(),
                file_path: Some("lib/*/libxamarin-app.so".to_string()),
                class_name: None,
            });
            if score < 0.90 && has_mono_lib {
                score = 0.95;
            }
        }

        // 5. SUPPORTING: dex_strings with mono. or xamarin.
        let has_mono_strings = context.has_dex_string("mono.") || context.has_dex_string("xamarin.");
        let xamarin_classes = context.find_classes(|c| c.contains("mono.") || c.contains("xamarin."));
        if has_mono_strings || !xamarin_classes.is_empty() {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Supporting,
                category: EvidenceCategory::DexClass,
                description: "Found Mono/Xamarin Java interop classes or DEX string references (mono.* / xamarin.*)".to_string(),
                source: "classes.dex".to_string(),
                file_path: None,
                class_name: xamarin_classes.first().cloned(),
            });
            if score < 0.60 {
                score += 0.20;
            }
        }

        // 6. IMPORTANT: Check for MAUI assemblies (Microsoft.Maui.dll).
        // If detected, reduce confidence because it is more likely .NET MAUI.
        let has_maui = context.has_file(|p| {
            p.contains("Microsoft.Maui.dll") || p.contains("Microsoft.Maui.Controls.dll")
        });
        if has_maui {
            evidence.push(Evidence {
                evidence_type: EvidenceType::Conflicting,
                category: EvidenceCategory::Asset,
                description: "Detected .NET MAUI assemblies (Microsoft.Maui.dll); application is .NET MAUI rather than legacy Xamarin".to_string(),
                source: "assemblies/Microsoft.Maui.dll".to_string(),
                file_path: Some("assemblies/Microsoft.Maui.dll".to_string()),
                class_name: None,
            });
            // Drastically reduce score for Xamarin
            score = (score - 0.65).max(0.15);
            limitations.push(".NET MAUI assemblies detected; application is superseded by .NET MAUI".to_string());
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
            framework: Framework::Xamarin,
            status,
            confidence,
            confidence_score: score,
            is_primary: score >= 0.6,
            evidence,
            limitations,
        }
    }
}
