use tauri::State;
use stacklens_shared::types::{DeviceInfo, AnalysisResult};
use stacklens_engine::analyze_apk as engine_analyze_apk;

use crate::adb::AdbManager;
use crate::database;
use crate::state::AppState;

#[tauri::command]
pub async fn check_adb_available(state: State<'_, AppState>) -> Result<bool, String> {
    let adb_path = {
        let settings = state.settings.lock().map_err(|e| e.to_string())?;
        settings.adb_path.clone()
    };
    let adb = AdbManager::new(&adb_path);
    Ok(adb.is_available())
}

#[tauri::command]
pub async fn list_devices(state: State<'_, AppState>) -> Result<Vec<DeviceInfo>, String> {
    let adb_path = {
        let settings = state.settings.lock().map_err(|e| e.to_string())?;
        settings.adb_path.clone()
    };
    let adb = AdbManager::new(&adb_path);
    let devices = adb.list_devices()?;

    if let Ok(mut dev_state) = state.devices.lock() {
        *dev_state = devices.clone();
    }

    Ok(devices)
}

#[tauri::command]
pub async fn get_device_packages(
    state: State<'_, AppState>,
    serial: String,
) -> Result<Vec<String>, String> {
    let adb_path = {
        let settings = state.settings.lock().map_err(|e| e.to_string())?;
        settings.adb_path.clone()
    };
    let adb = AdbManager::new(&adb_path);
    adb.list_packages(&serial)
}

#[tauri::command]
pub async fn get_package_icon(
    state: State<'_, AppState>,
    serial: String,
    package_name: String,
) -> Result<Option<String>, String> {
    let adb_path = {
        let settings = state.settings.lock().map_err(|e| e.to_string())?;
        settings.adb_path.clone()
    };
    let adb = AdbManager::new(&adb_path);
    adb.get_package_icon(&serial, &package_name)
}

#[tauri::command]
pub async fn pull_and_analyze_package(
    state: State<'_, AppState>,
    serial: String,
    package_name: String,
) -> Result<AnalysisResult, String> {
    let (adb_path, temp_dir, retain_apks) = {
        let settings = state.settings.lock().map_err(|e| e.to_string())?;
        (
            settings.adb_path.clone(),
            std::path::PathBuf::from(&settings.temp_dir),
            settings.retain_apks,
        )
    };

    let adb = AdbManager::new(&adb_path);
    let apk_path = adb.pull_package(&serial, &package_name, &temp_dir)?;

    let result = engine_analyze_apk(&apk_path, None)
        .map_err(|e| format!("Analysis of pulled APK failed: {e}"))?;

    // Persist to database
    if let Ok(guard) = state.db.lock() {
        if let Some(ref conn) = *guard {
            let _ = database::save_analysis(conn, &result);
        }
    }

    if let Ok(mut analyses) = state.analyses.lock() {
        analyses.insert(result.analysis_id.clone(), result.clone());
    }

    // Clean up temporary APK unless retention requested
    if !retain_apks {
        let _ = std::fs::remove_file(&apk_path);
    }

    Ok(result)
}
