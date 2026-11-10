use stacklens_shared::AnalysisResult;

/// Generate a CSV report from an analysis result.
///
/// Columns: package_name, app_label, framework, confidence, confidence_score, evidence_count, filename
pub fn to_csv(result: &AnalysisResult) -> String {
    let mut output = String::new();
    output.push_str("package_name,app_label,framework,confidence,confidence_score,evidence_count,filename\n");

    let package_name = result
        .apk
        .package_name
        .as_deref()
        .unwrap_or("unknown");
    let app_label = result.apk.app_label.as_deref().unwrap_or("unknown");
    let filename = &result.apk.filename;

    if result.detections.is_empty() {
        output.push_str(&format!(
            "{},{},None,Inconclusive,0.0,0,{}\n",
            csv_escape(package_name),
            csv_escape(app_label),
            csv_escape(filename),
        ));
    } else {
        for detection in &result.detections {
            output.push_str(&format!(
                "{},{},{},{},{:.2},{},{}\n",
                csv_escape(package_name),
                csv_escape(app_label),
                csv_escape(&detection.framework.to_string()),
                detection.confidence,
                detection.confidence_score,
                detection.evidence.len(),
                csv_escape(filename),
            ));
        }
    }

    output
}

/// Escape a field for CSV output by quoting if necessary.
fn csv_escape(field: &str) -> String {
    if field.contains(',') || field.contains('"') || field.contains('\n') {
        format!("\"{}\"", field.replace('"', "\"\""))
    } else {
        field.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_csv_escape_simple() {
        assert_eq!(csv_escape("hello"), "hello");
    }

    #[test]
    fn test_csv_escape_with_comma() {
        assert_eq!(csv_escape("hello,world"), "\"hello,world\"");
    }

    #[test]
    fn test_csv_escape_with_quotes() {
        assert_eq!(csv_escape("say \"hi\""), "\"say \"\"hi\"\"\"");
    }
}
