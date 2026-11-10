use std::collections::HashMap;
use serde::Serialize;
use tauri::State;

use crate::database::{self, HistoryEntry};
use crate::state::AppState;

#[derive(Debug, Clone, Serialize)]
pub struct DashboardStats {
    pub total_analyses: i64,
    pub total_apks: i64,
    pub framework_distribution: HashMap<String, i64>,
    pub recent_analyses: Vec<HistoryEntry>,
    pub connected_devices: usize,
    pub confidence_distribution: HashMap<String, i64>,
    pub success_count: i64,
    pub failure_count: i64,
}

#[tauri::command]
pub async fn get_dashboard_stats(state: State<'_, AppState>) -> Result<DashboardStats, String> {
    let guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or("Database not initialized")?;

    let stats_row = database::get_stats(conn).map_err(|e| e.to_string())?;
    let recent = database::get_history(conn, 10, 0).map_err(|e| e.to_string())?;

    let connected_devices = state
        .devices
        .lock()
        .map(|d| d.len())
        .unwrap_or(0);

    Ok(DashboardStats {
        total_analyses: stats_row.total_analyses,
        total_apks: stats_row.total_analyses,
        framework_distribution: stats_row.framework_distribution,
        recent_analyses: recent,
        connected_devices,
        confidence_distribution: stats_row.confidence_distribution,
        success_count: stats_row.success_count,
        failure_count: stats_row.failure_count,
    })
}
