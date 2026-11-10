use std::path::Path;
use tauri::State;
use stacklens_engine::reporting;

use crate::database;
use crate::state::AppState;

#[tauri::command]
pub async fn export_report(
    state: State<'_, AppState>,
    analysis_id: String,
    format: String,
    output_path: String,
) -> Result<String, String> {
    let guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or("Database not initialized")?;

    let analysis = database::get_analysis_by_id(conn, &analysis_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Analysis '{analysis_id}' not found"))?;

    let content = match format.to_lowercase().as_str() {
        "json" => reporting::json::to_json(&analysis).map_err(|e| e.to_string())?,
        "csv" => reporting::csv::to_csv(&analysis),
        "txt" => reporting::txt::to_text_report(&analysis),
        "pdf" => reporting::pdf::to_pdf_text(&analysis),
        _ => return Err(format!("Unsupported export format: {format}")),
    };

    let target_path = Path::new(&output_path);
    if let Some(parent) = target_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }

    std::fs::write(target_path, content.as_bytes())
        .map_err(|e| format!("Failed to write report to '{output_path}': {e}"))?;

    Ok(output_path)
}

#[tauri::command]
pub async fn export_batch_report(
    state: State<'_, AppState>,
    analysis_ids: Vec<String>,
    format: String,
    output_path: String,
) -> Result<String, String> {
    let guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or("Database not initialized")?;

    let mut results = Vec::new();
    for id in &analysis_ids {
        if let Ok(Some(res)) = database::get_analysis_by_id(conn, id) {
            results.push(res);
        }
    }

    if results.is_empty() {
        return Err("No analyses found to export".to_string());
    }

    let content = match format.to_lowercase().as_str() {
        "json" => serde_json::to_string_pretty(&results).map_err(|e| e.to_string())?,
        "csv" => {
            let mut lines = Vec::new();
            lines.push("Package Name,App Label,Primary Framework,Confidence,Score,File Name".to_string());
            for r in &results {
                let primary = r.detections.iter().find(|d| d.is_primary);
                let fw = primary.map(|p| format!("{:?}", p.framework)).unwrap_or_else(|| "Unknown".to_string());
                let conf = primary.map(|p| format!("{:?}", p.confidence)).unwrap_or_else(|| "Inconclusive".to_string());
                let score = primary.map(|p| p.confidence_score).unwrap_or(0.0);
                lines.push(format!(
                    "\"{}\",\"{}\",\"{}\",\"{}\",{:.2},\"{}\"",
                    r.apk.package_name.as_deref().unwrap_or(""),
                    r.apk.app_label.as_deref().unwrap_or(""),
                    fw,
                    conf,
                    score,
                    r.apk.filename
                ));
            }
            lines.join("\n")
        }
        "txt" => {
            let mut sections = Vec::new();
            sections.push("================================================================================".to_string());
            sections.push("                       STACKLENS BATCH ANALYSIS REPORT                          ".to_string());
            sections.push("================================================================================".to_string());
            sections.push(format!("Total Applications: {}", results.len()));
            sections.push(format!("Report Generated: {}", chrono::Utc::now().to_rfc3339()));
            sections.push("\n".to_string());

            for (idx, r) in results.iter().enumerate() {
                sections.push(format!("[{}] {}", idx + 1, r.apk.filename));
                sections.push(format!("    Package: {}", r.apk.package_name.as_deref().unwrap_or("N/A")));
                let primary = r.detections.iter().find(|d| d.is_primary);
                if let Some(p) = primary {
                    sections.push(format!("    Framework: {:?} (Confidence: {:?}, Score: {:.2})", p.framework, p.confidence, p.confidence_score));
                } else {
                    sections.push("    Framework: Unknown".to_string());
                }
                sections.push(format!("    Size: {:.2} MB", r.apk.file_size as f64 / (1024.0 * 1024.0)));
                sections.push("--------------------------------------------------------------------------------".to_string());
            }

            sections.join("\n")
        }
        _ => return Err(format!("Unsupported batch export format: {format}")),
    };

    let target_path = Path::new(&output_path);
    if let Some(parent) = target_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }

    std::fs::write(target_path, content.as_bytes())
        .map_err(|e| format!("Failed to write batch report: {e}"))?;

    Ok(output_path)
}
