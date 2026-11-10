use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

use rusqlite::Connection;
use tauri::AppHandle;

use stacklens_shared::types::{AnalysisResult, DeviceInfo};

use crate::database;

/// Application-wide state managed by Tauri
pub struct AppState {
    pub db: Mutex<Option<Connection>>,
    pub analyses: Mutex<HashMap<String, AnalysisResult>>,
    pub devices: Mutex<Vec<DeviceInfo>>,
    pub batch_jobs: Mutex<HashMap<String, BatchJobState>>,
    pub settings: Mutex<AppSettings>,
    pub data_dir: Mutex<Option<PathBuf>>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AppSettings {
    pub theme: String,
    pub apk_output_dir: String,
    pub temp_dir: String,
    pub retain_apks: bool,
    pub analysis_concurrency: u32,
    pub adb_path: String,
    pub report_export_dir: String,
    pub log_level: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
            apk_output_dir: String::new(),
            temp_dir: String::new(),
            retain_apks: false,
            analysis_concurrency: 4,
            adb_path: "adb".to_string(),
            report_export_dir: String::new(),
            log_level: "info".to_string(),
        }
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct BatchJobState {
    pub id: String,
    pub files: Vec<BatchFileState>,
    pub status: String,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub progress: usize,
    pub total: usize,
    pub cancelled: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct BatchFileState {
    pub path: String,
    pub filename: String,
    pub status: String,
    pub result: Option<AnalysisResult>,
    pub error: Option<String>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            db: Mutex::new(None),
            analyses: Mutex::new(HashMap::new()),
            devices: Mutex::new(Vec::new()),
            batch_jobs: Mutex::new(HashMap::new()),
            settings: Mutex::new(AppSettings::default()),
            data_dir: Mutex::new(None),
        }
    }

    pub fn initialize(&self, app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
        // Set up data directory
        let data_dir = app
            .path()
            .app_data_dir()
            .unwrap_or_else(|_| PathBuf::from(".stacklens"));

        std::fs::create_dir_all(&data_dir)?;

        // Set default paths
        {
            let mut settings = self.settings.lock().unwrap();
            if settings.apk_output_dir.is_empty() {
                settings.apk_output_dir = data_dir.join("apks").to_string_lossy().to_string();
            }
            if settings.temp_dir.is_empty() {
                settings.temp_dir = data_dir.join("temp").to_string_lossy().to_string();
            }
            if settings.report_export_dir.is_empty() {
                settings.report_export_dir =
                    data_dir.join("reports").to_string_lossy().to_string();
            }
        }

        // Create subdirectories
        let apk_dir = data_dir.join("apks");
        let temp_dir = data_dir.join("temp");
        let reports_dir = data_dir.join("reports");
        std::fs::create_dir_all(&apk_dir)?;
        std::fs::create_dir_all(&temp_dir)?;
        std::fs::create_dir_all(&reports_dir)?;

        // Initialize database
        let db_path = data_dir.join("stacklens.db");
        let conn = Connection::open(&db_path)?;
        database::initialize(&conn)?;

        // Load settings from DB
        if let Ok(saved_settings) = database::load_settings(&conn) {
            *self.settings.lock().unwrap() = saved_settings;
        }

        *self.db.lock().unwrap() = Some(conn);
        *self.data_dir.lock().unwrap() = Some(data_dir);

        tracing::info!("Database initialized at {:?}", db_path);
        Ok(())
    }
}

use tauri::Manager;
