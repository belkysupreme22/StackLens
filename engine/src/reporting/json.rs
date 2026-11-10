use stacklens_shared::AnalysisResult;

/// Serialize an analysis result to formatted JSON.
pub fn to_json(result: &AnalysisResult) -> Result<String, serde_json::Error> {
    serde_json::to_string_pretty(result)
}

/// Serialize an analysis result to compact JSON.
pub fn to_json_compact(result: &AnalysisResult) -> Result<String, serde_json::Error> {
    serde_json::to_string(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use stacklens_shared::*;

    fn sample_result() -> AnalysisResult {
        AnalysisResult {
            schema_version: "1.0".to_string(),
            analysis_id: "test-id".to_string(),
            timestamp: "2024-01-01T00:00:00Z".to_string(),
            apk: ApkMetadata {
                filename: "test.apk".to_string(),
                file_size: 1024,
                package_name: Some("com.example.test".to_string()),
                app_label: Some("Test App".to_string()),
                version_name: Some("1.0.0".to_string()),
                version_code: Some(1),
                min_sdk: Some(21),
                target_sdk: Some(33),
                permissions: vec!["android.permission.INTERNET".to_string()],
                main_activity: Some("com.example.test.MainActivity".to_string()),
                is_split_apk: false,
                split_name: None,
            },
            detections: vec![],
            apk_structure: ApkStructure {
                dex_files: vec![],
                native_libraries: vec![],
                assets: vec![],
                resource_count: 0,
                resource_types: vec![],
                total_entries: 0,
            },
            signing_info: None,
            warnings: vec![],
            analysis_duration_ms: 100,
        }
    }

    #[test]
    fn test_json_output() {
        let result = sample_result();
        let json = to_json(&result).unwrap();
        assert!(json.contains("com.example.test"));
        assert!(json.contains("schema_version"));
    }
}
