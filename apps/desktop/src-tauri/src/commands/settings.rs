use tauri::State;
use crate::database;
use crate::state::{AppSettings, AppState};

#[tauri::command]
pub async fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    Ok(settings.clone())
}

#[tauri::command]
pub async fn update_settings(
    state: State<'_, AppState>,
    settings: AppSettings,
) -> Result<(), String> {
    {
        let mut curr = state.settings.lock().map_err(|e| e.to_string())?;
        *curr = settings.clone();
    }

    let guard = state.db.lock().map_err(|e| e.to_string())?;
    if let Some(ref conn) = *guard {
        database::save_settings(conn, &settings).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn reset_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    let default = AppSettings::default();
    {
        let mut curr = state.settings.lock().map_err(|e| e.to_string())?;
        *curr = default.clone();
    }

    let guard = state.db.lock().map_err(|e| e.to_string())?;
    if let Some(ref conn) = *guard {
        database::save_settings(conn, &default).map_err(|e| e.to_string())?;
    }

    Ok(default)
}
