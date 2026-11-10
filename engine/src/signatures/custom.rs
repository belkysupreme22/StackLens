use stacklens_shared::{
    CustomSignature, Evidence, EvidenceCategory, EvidenceType, FrameworkDetection,
    Framework, DetectionStatus, ConfidenceLevel,
};
use crate::detectors::traits::DetectionContext;
use crate::error::{EngineError, EngineResult};

/// Load custom signatures from a JSON string.
pub fn load_signatures(json_data: &str) -> EngineResult<Vec<CustomSignature>> {
    serde_json::from_str(json_data)
        .map_err(|e| EngineError::ParseError(format!("Failed to parse custom signatures: {}", e)))
}

/// Load custom signatures from a file path.
pub fn load_signatures_from_file(path: &std::path::Path) -> EngineResult<Vec<CustomSignature>> {
    let data = std::fs::read_to_string(path)?;
    load_signatures(&data)
}

/// Validate a set of custom signatures.
pub fn validate_signatures(signatures: &[CustomSignature]) -> Vec<String> {
    let mut warnings = Vec::new();

    for sig in signatures {
        if sig.id.is_empty() {
            warnings.push(format!("Signature '{}' has empty ID", sig.name));
        }
        if sig.name.is_empty() {
            warnings.push(format!("Signature with ID '{}' has empty name", sig.id));
        }
        let has_any_pattern = !sig.file_patterns.is_empty()
            || !sig.native_lib_patterns.is_empty()
            || !sig.asset_patterns.is_empty()
            || !sig.class_patterns.is_empty()
            || !sig.manifest_patterns.is_empty();
        if !has_any_pattern {
            warnings.push(format!(
                "Signature '{}' ({}) has no patterns defined",
                sig.name, sig.id
            ));
        }
    }

    warnings
}

/// Apply custom signatures against a detection context and return any matches.
pub fn apply_signatures(
    signatures: &[CustomSignature],
    context: &DetectionContext,
) -> Vec<FrameworkDetection> {
    let mut results = Vec::new();

    for sig in signatures {
        if !sig.enabled {
            continue;
        }

        let mut evidence = Vec::new();

        // Check file patterns
        for pattern in &sig.file_patterns {
            let matches: Vec<_> = context
                .file_listing
                .iter()
                .filter(|f| f.contains(pattern.as_str()))
                .collect();
            if !matches.is_empty() {
                evidence.push(Evidence {
                    evidence_type: sig.evidence_type.clone(),
                    category: EvidenceCategory::FileStructure,
                    description: format!(
                        "{}: found {} files matching pattern '{}'",
                        sig.evidence_description,
                        matches.len(),
                        pattern
                    ),
                    source: format!("Custom signature: {}", sig.name),
                    file_path: matches.first().map(|s| s.to_string()),
                    class_name: None,
                });
            }
        }

        // Check native lib patterns
        for pattern in &sig.native_lib_patterns {
            let matches: Vec<_> = context
                .native_libs
                .iter()
                .filter(|lib| lib.name.contains(pattern.as_str()))
                .collect();
            if !matches.is_empty() {
                evidence.push(Evidence {
                    evidence_type: sig.evidence_type.clone(),
                    category: EvidenceCategory::NativeLibrary,
                    description: format!(
                        "{}: found native library matching '{}'",
                        sig.evidence_description, pattern
                    ),
                    source: format!("Custom signature: {}", sig.name),
                    file_path: Some(matches[0].name.clone()),
                    class_name: None,
                });
            }
        }

        // Check asset patterns
        for pattern in &sig.asset_patterns {
            let matches: Vec<_> = context
                .assets
                .iter()
                .filter(|a| a.contains(pattern.as_str()))
                .collect();
            if !matches.is_empty() {
                evidence.push(Evidence {
                    evidence_type: sig.evidence_type.clone(),
                    category: EvidenceCategory::Asset,
                    description: format!(
                        "{}: found {} assets matching pattern '{}'",
                        sig.evidence_description,
                        matches.len(),
                        pattern
                    ),
                    source: format!("Custom signature: {}", sig.name),
                    file_path: matches.first().map(|s| s.to_string()),
                    class_name: None,
                });
            }
        }

        // Check class patterns
        for pattern in &sig.class_patterns {
            let matches: Vec<_> = context
                .dex_classes
                .iter()
                .filter(|c| c.contains(pattern.as_str()))
                .collect();
            if !matches.is_empty() {
                evidence.push(Evidence {
                    evidence_type: sig.evidence_type.clone(),
                    category: EvidenceCategory::DexClass,
                    description: format!(
                        "{}: found {} classes matching pattern '{}'",
                        sig.evidence_description,
                        matches.len(),
                        pattern
                    ),
                    source: format!("Custom signature: {}", sig.name),
                    file_path: None,
                    class_name: matches.first().map(|s| s.to_string()),
                });
            }
        }

        // Check manifest patterns
        for pattern in &sig.manifest_patterns {
            let matches: Vec<_> = context
                .manifest_strings
                .iter()
                .filter(|s| s.contains(pattern.as_str()))
                .collect();
            if !matches.is_empty() {
                evidence.push(Evidence {
                    evidence_type: sig.evidence_type.clone(),
                    category: EvidenceCategory::Manifest,
                    description: format!(
                        "{}: found manifest string matching '{}'",
                        sig.evidence_description, pattern
                    ),
                    source: format!("Custom signature: {}", sig.name),
                    file_path: None,
                    class_name: None,
                });
            }
        }

        // Only create a detection if we found evidence
        if !evidence.is_empty() {
            let score = match sig.evidence_type {
                EvidenceType::Confirmed => 0.9,
                EvidenceType::StrongIndicator => 0.75,
                EvidenceType::Supporting => 0.5,
                EvidenceType::Weak => 0.3,
                EvidenceType::Conflicting => 0.1,
            };

            let (status, confidence) = if score >= 0.85 {
                (DetectionStatus::Detected, ConfidenceLevel::High)
            } else if score >= 0.6 {
                (DetectionStatus::Detected, ConfidenceLevel::Medium)
            } else if score >= 0.3 {
                (DetectionStatus::Inconclusive, ConfidenceLevel::Low)
            } else {
                (DetectionStatus::NotDetected, ConfidenceLevel::Inconclusive)
            };

            results.push(FrameworkDetection {
                framework: Framework::Unknown, // Custom signatures map to Unknown framework
                status,
                confidence,
                confidence_score: score,
                is_primary: false,
                evidence,
                limitations: vec![format!(
                    "Detected via custom signature '{}'. Manual verification recommended.",
                    sig.name
                )],
            });
        }
    }

    results
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_load_signatures() {
        let json = r#"[{
            "id": "test-1",
            "name": "Test Framework",
            "framework": "TestFW",
            "enabled": true,
            "file_patterns": ["test_file.txt"],
            "native_lib_patterns": [],
            "asset_patterns": [],
            "class_patterns": [],
            "manifest_patterns": [],
            "evidence_description": "Test evidence",
            "evidence_type": "StrongIndicator"
        }]"#;

        let sigs = load_signatures(json).unwrap();
        assert_eq!(sigs.len(), 1);
        assert_eq!(sigs[0].name, "Test Framework");
    }

    #[test]
    fn test_validate_empty_patterns() {
        let sigs = vec![CustomSignature {
            id: "test".to_string(),
            name: "Test".to_string(),
            framework: "Test".to_string(),
            enabled: true,
            file_patterns: vec![],
            native_lib_patterns: vec![],
            asset_patterns: vec![],
            class_patterns: vec![],
            manifest_patterns: vec![],
            evidence_description: "Test".to_string(),
            evidence_type: EvidenceType::StrongIndicator,
        }];

        let warnings = validate_signatures(&sigs);
        assert_eq!(warnings.len(), 1);
        assert!(warnings[0].contains("no patterns defined"));
    }
}
