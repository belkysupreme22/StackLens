use tauri::State;
use uuid::Uuid;
use stacklens_shared::types::{AnalysisResult, CustomSignature};
use stacklens_engine::analyze_apk as engine_analyze_apk;

use crate::database;
use crate::state::AppState;

#[tauri::command]
pub async fn get_custom_signatures(
    state: State<'_, AppState>,
) -> Result<Vec<CustomSignature>, String> {
    let guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or("Database not initialized")?;
    database::load_custom_signatures(conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_custom_signature(
    state: State<'_, AppState>,
    mut signature: CustomSignature,
) -> Result<CustomSignature, String> {
    if signature.id.is_empty() {
        signature.id = Uuid::new_v4().to_string();
    }

    let guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or("Database not initialized")?;
    database::save_custom_signature(conn, &signature).map_err(|e| e.to_string())?;

    Ok(signature)
}

#[tauri::command]
pub async fn update_custom_signature(
    state: State<'_, AppState>,
    signature: CustomSignature,
) -> Result<(), String> {
    let guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or("Database not initialized")?;
    database::save_custom_signature(conn, &signature).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_custom_signature(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    let guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or("Database not initialized")?;
    database::delete_custom_signature_by_id(conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn test_signature(
    apk_path: String,
) -> Result<AnalysisResult, String> {
    engine_analyze_apk(&apk_path, None).map_err(|e| e.to_string())
}
