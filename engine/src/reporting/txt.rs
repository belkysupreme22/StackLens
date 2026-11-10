use stacklens_shared::{AnalysisResult, DetectionStatus};

pub use to_text as to_text_report;

/// Generate a human-readable text report from an analysis result.
pub fn to_text(result: &AnalysisResult) -> String {
    let mut out = String::new();

    // Header
    out.push_str("═══════════════════════════════════════════════════════════════\n");
    out.push_str("                    StackLens Analysis Report                  \n");
    out.push_str("═══════════════════════════════════════════════════════════════\n\n");

    // APK Info
    out.push_str("── APK Information ──────────────────────────────────────────\n\n");
    out.push_str(&format!("  Filename:      {}\n", result.apk.filename));
    out.push_str(&format!("  File Size:     {} bytes\n", result.apk.file_size));
    if let Some(ref pkg) = result.apk.package_name {
        out.push_str(&format!("  Package:       {}\n", pkg));
    }
    if let Some(ref label) = result.apk.app_label {
        out.push_str(&format!("  App Label:     {}\n", label));
    }
    if let Some(ref ver) = result.apk.version_name {
        out.push_str(&format!("  Version:       {}\n", ver));
    }
    if let Some(code) = result.apk.version_code {
        out.push_str(&format!("  Version Code:  {}\n", code));
    }
    if let Some(min) = result.apk.min_sdk {
        out.push_str(&format!("  Min SDK:       {}\n", min));
    }
    if let Some(target) = result.apk.target_sdk {
        out.push_str(&format!("  Target SDK:    {}\n", target));
    }
    if result.apk.is_split_apk {
        out.push_str("  Split APK:     Yes\n");
        if let Some(ref split) = result.apk.split_name {
            out.push_str(&format!("  Split Name:    {}\n", split));
        }
    }
    out.push('\n');

    // Detections
    out.push_str("── Framework Detections ─────────────────────────────────────\n\n");

    let detected: Vec<_> = result
        .detections
        .iter()
        .filter(|d| d.status == DetectionStatus::Detected)
        .collect();

    if detected.is_empty() {
        out.push_str("  No frameworks detected with sufficient confidence.\n\n");
    } else {
        for det in &detected {
            let primary_tag = if det.is_primary { " [PRIMARY]" } else { "" };
            out.push_str(&format!(
                "  ✓ {}{}\n",
                det.framework, primary_tag
            ));
            out.push_str(&format!(
                "    Confidence: {} ({:.0}%)\n",
                det.confidence,
                det.confidence_score * 100.0
            ));
            out.push_str(&format!("    Evidence ({} items):\n", det.evidence.len()));
            for ev in &det.evidence {
                out.push_str(&format!(
                    "      • [{}] {}\n",
                    ev.evidence_type, ev.description
                ));
                if let Some(ref path) = ev.file_path {
                    out.push_str(&format!("        File: {}\n", path));
                }
            }
            if !det.limitations.is_empty() {
                out.push_str("    Limitations:\n");
                for lim in &det.limitations {
                    out.push_str(&format!("      ⚠ {}\n", lim));
                }
            }
            out.push('\n');
        }
    }

    // Inconclusive
    let inconclusive: Vec<_> = result
        .detections
        .iter()
        .filter(|d| d.status == DetectionStatus::Inconclusive)
        .collect();
    if !inconclusive.is_empty() {
        out.push_str("── Inconclusive Detections ──────────────────────────────────\n\n");
        for det in &inconclusive {
            out.push_str(&format!(
                "  ? {} (score: {:.0}%)\n",
                det.framework,
                det.confidence_score * 100.0
            ));
        }
        out.push('\n');
    }

    // APK Structure
    out.push_str("── APK Structure ───────────────────────────────────────────\n\n");
    out.push_str(&format!(
        "  Total Entries: {}\n",
        result.apk_structure.total_entries
    ));
    out.push_str(&format!(
        "  DEX Files:     {}\n",
        result.apk_structure.dex_files.len()
    ));
    for dex in &result.apk_structure.dex_files {
        out.push_str(&format!("    - {} ({} bytes)\n", dex.name, dex.size));
    }
    out.push_str(&format!(
        "  Native Libs:   {}\n",
        result.apk_structure.native_libraries.len()
    ));
    for lib in &result.apk_structure.native_libraries {
        let purpose = lib
            .purpose
            .as_deref()
            .map(|p| format!(" ({})", p))
            .unwrap_or_default();
        out.push_str(&format!(
            "    - {} [{}]{}\n",
            lib.name, lib.arch, purpose
        ));
    }
    out.push_str(&format!(
        "  Assets:        {}\n",
        result.apk_structure.assets.len()
    ));
    out.push_str(&format!(
        "  Resources:     {} (types: {})\n",
        result.apk_structure.resource_count,
        result.apk_structure.resource_types.join(", ")
    ));
    out.push('\n');

    // Permissions
    if !result.apk.permissions.is_empty() {
        out.push_str("── Permissions ─────────────────────────────────────────────\n\n");
        for perm in &result.apk.permissions {
            out.push_str(&format!("  • {}\n", perm));
        }
        out.push('\n');
    }

    // Warnings
    if !result.warnings.is_empty() {
        out.push_str("── Warnings ────────────────────────────────────────────────\n\n");
        for warn in &result.warnings {
            out.push_str(&format!("  ⚠ {}\n", warn));
        }
        out.push('\n');
    }

    // Footer
    out.push_str("═══════════════════════════════════════════════════════════════\n");
    out.push_str(&format!("  Analysis ID:       {}\n", result.analysis_id));
    out.push_str(&format!("  Timestamp:         {}\n", result.timestamp));
    out.push_str(&format!(
        "  Duration:          {} ms\n",
        result.analysis_duration_ms
    ));
    out.push_str(&format!("  Schema Version:    {}\n", result.schema_version));
    out.push_str("═══════════════════════════════════════════════════════════════\n");

    out
}
