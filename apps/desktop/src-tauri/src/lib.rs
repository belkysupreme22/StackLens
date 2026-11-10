use tauri::Manager;
use crate::state::AppState;

mod adb;
mod commands;
mod state;
mod database;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "stacklens=info".parse().unwrap()),
        )
        .init();

    tracing::info!("Starting StackLens — Android Application Intelligence");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            // Analysis
            commands::analysis::analyze_apk,
            commands::analysis::analyze_apk_bytes,
            commands::analysis::analyze_batch,
            commands::analysis::get_batch_status,
            commands::analysis::cancel_batch,
            // Devices
            commands::devices::check_adb_available,
            commands::devices::list_devices,
            commands::devices::get_device_packages,
            commands::devices::get_launcher_packages,
            commands::devices::get_package_icon,
            commands::devices::pull_and_analyze_package,
            // History
            commands::history::get_analysis_history,
            commands::history::get_analysis_by_id,
            commands::history::delete_analysis,
            commands::history::clear_history,
            commands::history::search_history,
            // Dashboard
            commands::dashboard::get_dashboard_stats,
            // Settings
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::settings::reset_settings,
            // Signatures
            commands::signatures::get_custom_signatures,
            commands::signatures::add_custom_signature,
            commands::signatures::update_custom_signature,
            commands::signatures::delete_custom_signature,
            commands::signatures::test_signature,
            // Reports
            commands::reports::export_report,
            commands::reports::export_batch_report,
            // Utilities
            commands::utils::get_app_version,
            commands::utils::check_external_tools,
            commands::utils::open_in_explorer,
        ])
        .setup(|app| {
            let app_handle = app.handle().clone();
            let state = app_handle.state::<AppState>();
            state.initialize(&app_handle)?;
            tracing::info!("StackLens initialized successfully");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Failed to run StackLens");
}
