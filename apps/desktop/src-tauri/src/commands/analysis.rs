use std::path::Path;
use tauri::State;
use uuid::Uuid;

use stacklens_engine::analyze_apk as engine_analyze_apk;
use stacklens_engine::analyze_apk_bytes as engine_analyze_bytes;
use stacklens_shared::types::AnalysisResult;

use crate::database;
use crate::state::{AppState, BatchFileState, BatchJobState};

#[tauri::command]
pub async fn analyze_apk(
    state: State<'_, AppState>,
    path: String,
) -> Result<AnalysisResult, String> {
    let result = engine_analyze_apk(&path, None)
        .map_err(|e| format!("Engine analysis failed: {e}"))?;

    // Persist to database and memory
    if let Ok(guard) = state.db.lock() {
        if let Some(ref conn) = *guard {
            let _ = database::save_analysis(conn, &result);
        }
    }

    if let Ok(mut analyses) = state.analyses.lock() {
        analyses.insert(result.analysis_id.clone(), result.clone());
    }

    Ok(result)
}

#[tauri::command]
pub async fn analyze_apk_bytes(
    state: State<'_, AppState>,
    filename: String,
    bytes: Vec<u8>,
) -> Result<AnalysisResult, String> {
    let result = engine_analyze_bytes(filename, bytes, None)
        .map_err(|e| format!("Byte analysis failed: {e}"))?;

    if let Ok(guard) = state.db.lock() {
        if let Some(ref conn) = *guard {
            let _ = database::save_analysis(conn, &result);
        }
    }

    if let Ok(mut analyses) = state.analyses.lock() {
        analyses.insert(result.analysis_id.clone(), result.clone());
    }

    Ok(result)
}

#[tauri::command]
pub async fn analyze_batch(
    state: State<'_, AppState>,
    paths: Vec<String>,
) -> Result<String, String> {
    let batch_id = Uuid::new_v4().to_string();
    let total = paths.len();

    let file_states: Vec<BatchFileState> = paths
        .into_iter()
        .map(|p| {
            let fname = Path::new(&p)
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "unknown.apk".to_string());
            BatchFileState {
                path: p,
                filename: fname,
                status: "pending".to_string(),
                result: None,
                error: None,
            }
        })
        .collect();

    let job = BatchJobState {
        id: batch_id.clone(),
        files: file_states,
        status: "running".to_string(),
        started_at: Some(chrono::Utc::now().to_rfc3339()),
        completed_at: None,
        progress: 0,
        total,
        cancelled: false,
    };

    if let Ok(mut jobs) = state.batch_jobs.lock() {
        jobs.insert(batch_id.clone(), job);
    }

    // Run processing
    if let Ok(mut jobs) = state.batch_jobs.lock() {
        if let Some(job) = jobs.get_mut(&batch_id) {
            for file_entry in &mut job.files {
                if job.cancelled {
                    file_entry.status = "cancelled".to_string();
                    continue;
                }

                file_entry.status = "running".to_string();
                match engine_analyze_apk(&file_entry.path, None) {
                    Ok(res) => {
                        file_entry.status = "completed".to_string();
                        file_entry.result = Some(res);
                        job.progress += 1;
                    }
                    Err(e) => {
                        file_entry.status = "error".to_string();
                        file_entry.error = Some(e.to_string());
                        job.progress += 1;
                    }
                }
            }
            job.status = if job.cancelled { "cancelled".to_string() } else { "completed".to_string() };
            job.completed_at = Some(chrono::Utc::now().to_rfc3339());
        }
    }

    Ok(batch_id)
}

#[tauri::command]
pub async fn get_batch_status(
    state: State<'_, AppState>,
    batch_id: String,
) -> Result<BatchJobState, String> {
    let jobs = state.batch_jobs.lock().map_err(|e| e.to_string())?;
    jobs.get(&batch_id)
        .cloned()
        .ok_or_else(|| format!("Batch job '{batch_id}' not found"))
}

#[tauri::command]
pub async fn cancel_batch(
    state: State<'_, AppState>,
    batch_id: String,
) -> Result<(), String> {
    let mut jobs = state.batch_jobs.lock().map_err(|e| e.to_string())?;
    if let Some(job) = jobs.get_mut(&batch_id) {
        job.cancelled = true;
        job.status = "cancelled".to_string();
    }
    Ok(())
}
