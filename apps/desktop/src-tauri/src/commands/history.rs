use tauri::State;
use stacklens_shared::types::AnalysisResult;
use crate::database::{self, HistoryEntry};
use crate::state::AppState;

#[tauri::command]
pub async fn get_analysis_history(
    state: State<'_, AppState>,
    limit: i64,
    offset: i64,
) -> Result<Vec<HistoryEntry>, String> {
    let guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or("Database not initialized")?;
    database::get_history(conn, limit, offset).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_analysis_by_id(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<AnalysisResult>, String> {
    // Check in-memory cache first
    if let Ok(analyses) = state.analyses.lock() {
        if let Some(res) = analyses.get(&id) {
            return Ok(Some(res.clone()));
        }
    }

    let guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or("Database not initialized")?;
    database::get_analysis_by_id(conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_analysis(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    if let Ok(mut analyses) = state.analyses.lock() {
        analyses.remove(&id);
    }

    let guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or("Database not initialized")?;
    database::delete_analysis_by_id(conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn clear_history(state: State<'_, AppState>) -> Result<(), String> {
    if let Ok(mut analyses) = state.analyses.lock() {
        analyses.clear();
    }

    let guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or("Database not initialized")?;
    database::clear_all_analyses(conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_history(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<HistoryEntry>, String> {
    let guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or("Database not initialized")?;
    database::search_analyses(conn, &query).map_err(|e| e.to_string())
}
