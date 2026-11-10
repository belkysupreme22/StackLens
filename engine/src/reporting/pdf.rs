use stacklens_shared::AnalysisResult;

/// Generate a structured text representation suitable for PDF conversion.
///
/// Full PDF generation requires additional dependencies (e.g., `printpdf` or `genpdf`).
/// This function produces a structured text format that can be converted to PDF
/// by a downstream tool or service.
pub fn to_pdf_text(result: &AnalysisResult) -> String {
    // Reuse the text report format with PDF-specific markers
    let mut out = String::new();

    out.push_str("%%PDF-READY-TEXT%%\n");
    out.push_str("%%TITLE: StackLens Analysis Report%%\n");
    out.push_str(&format!(
        "%%DATE: {}%%\n",
        result.timestamp
    ));
    out.push_str(&format!(
        "%%SUBJECT: Analysis of {}%%\n\n",
        result.apk.package_name.as_deref().unwrap_or(&result.apk.filename)
    ));

    // Use the text report as the body
    out.push_str(&super::txt::to_text(result));

    out.push_str("\n%%END-PDF-READY-TEXT%%\n");

    out
}
