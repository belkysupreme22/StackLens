use rusqlite::{Connection, params};
use crate::state::AppSettings;
use stacklens_shared::types::AnalysisResult;

/// Initialize database tables with versioned migrations
pub fn initialize(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch("PRAGMA journal_mode=WAL;")?;
    conn.execute_batch("PRAGMA foreign_keys=ON;")?;

    // Create schema version table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        )",
        [],
    )?;

    let current_version: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_version",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    if current_version < 1 {
        migrate_v1(conn)?;
    }

    Ok(())
}

fn migrate_v1(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS analyses (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            filename TEXT NOT NULL,
            package_name TEXT,
            app_label TEXT,
            primary_framework TEXT,
            primary_confidence TEXT,
            confidence_score REAL,
            result_json TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'success',
            error_message TEXT,
            file_size INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_analyses_timestamp ON analyses(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_analyses_package ON analyses(package_name);
        CREATE INDEX IF NOT EXISTS idx_analyses_framework ON analyses(primary_framework);
        CREATE INDEX IF NOT EXISTS idx_analyses_filename ON analyses(filename);

        CREATE TABLE IF NOT EXISTS custom_signatures (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            framework TEXT NOT NULL,
            enabled INTEGER NOT NULL DEFAULT 1,
            definition_json TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        INSERT INTO schema_version (version) VALUES (1);
        ",
    )?;
    Ok(())
}

/// Save an analysis result to the database
pub fn save_analysis(conn: &Connection, result: &AnalysisResult) -> Result<(), rusqlite::Error> {
    let primary = result
        .detections
        .iter()
        .find(|d| d.is_primary)
        .or_else(|| {
            result
                .detections
                .iter()
                .filter(|d| d.status == stacklens_shared::types::DetectionStatus::Detected)
                .max_by(|a, b| a.confidence_score.partial_cmp(&b.confidence_score).unwrap_or(std::cmp::Ordering::Equal))
        });

    let primary_framework = primary.map(|d| format!("{:?}", d.framework));
    let primary_confidence = primary.map(|d| format!("{:?}", d.confidence));
    let confidence_score = primary.map(|d| d.confidence_score);

    let result_json = serde_json::to_string(result).unwrap_or_default();

    conn.execute(
        "INSERT OR REPLACE INTO analyses (id, timestamp, filename, package_name, app_label, primary_framework, primary_confidence, confidence_score, result_json, status, file_size)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'success', ?10)",
        params![
            result.analysis_id,
            result.timestamp,
            result.apk.filename,
            result.apk.package_name,
            result.apk.app_label,
            primary_framework,
            primary_confidence,
            confidence_score,
            result_json,
            result.apk.file_size as i64,
        ],
    )?;
    Ok(())
}

/// Load analysis history entries
pub fn get_history(
    conn: &Connection,
    limit: i64,
    offset: i64,
) -> Result<Vec<HistoryEntry>, rusqlite::Error> {
    let mut stmt = conn.prepare(
        "SELECT id, timestamp, filename, package_name, primary_framework, primary_confidence, status, error_message
         FROM analyses ORDER BY timestamp DESC LIMIT ?1 OFFSET ?2",
    )?;

    let entries = stmt
        .query_map(params![limit, offset], |row| {
            Ok(HistoryEntry {
                id: row.get(0)?,
                timestamp: row.get(1)?,
                filename: row.get(2)?,
                package_name: row.get(3)?,
                primary_framework: row.get(4)?,
                confidence: row.get(5)?,
                status: row.get(6)?,
                error_message: row.get(7)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(entries)
}

/// Load a single analysis by ID
pub fn get_analysis_by_id(
    conn: &Connection,
    id: &str,
) -> Result<Option<AnalysisResult>, Box<dyn std::error::Error>> {
    let mut stmt = conn.prepare("SELECT result_json FROM analyses WHERE id = ?1")?;
    let result = stmt.query_row(params![id], |row| {
        let json: String = row.get(0)?;
        Ok(json)
    });

    match result {
        Ok(json) => {
            let analysis: AnalysisResult = serde_json::from_str(&json)?;
            Ok(Some(analysis))
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(Box::new(e)),
    }
}

/// Delete a single analysis
pub fn delete_analysis_by_id(conn: &Connection, id: &str) -> Result<(), rusqlite::Error> {
    conn.execute("DELETE FROM analyses WHERE id = ?1", params![id])?;
    Ok(())
}

/// Clear all analyses
pub fn clear_all_analyses(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute("DELETE FROM analyses", [])?;
    Ok(())
}

/// Search analyses
pub fn search_analyses(
    conn: &Connection,
    query: &str,
) -> Result<Vec<HistoryEntry>, rusqlite::Error> {
    let pattern = format!("%{}%", query);
    let mut stmt = conn.prepare(
        "SELECT id, timestamp, filename, package_name, primary_framework, primary_confidence, status, error_message
         FROM analyses
         WHERE filename LIKE ?1 OR package_name LIKE ?1 OR primary_framework LIKE ?1
         ORDER BY timestamp DESC LIMIT 100",
    )?;

    let entries = stmt
        .query_map(params![pattern], |row| {
            Ok(HistoryEntry {
                id: row.get(0)?,
                timestamp: row.get(1)?,
                filename: row.get(2)?,
                package_name: row.get(3)?,
                primary_framework: row.get(4)?,
                confidence: row.get(5)?,
                status: row.get(6)?,
                error_message: row.get(7)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(entries)
}

/// Get dashboard statistics
pub fn get_stats(conn: &Connection) -> Result<DashboardStatsRow, Box<dyn std::error::Error>> {
    let total_analyses: i64 = conn.query_row(
        "SELECT COUNT(*) FROM analyses",
        [],
        |row| row.get(0),
    )?;

    let success_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM analyses WHERE status = 'success'",
        [],
        |row| row.get(0),
    )?;

    let failure_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM analyses WHERE status = 'error'",
        [],
        |row| row.get(0),
    )?;

    // Framework distribution
    let mut framework_dist = std::collections::HashMap::new();
    let mut stmt = conn.prepare(
        "SELECT primary_framework, COUNT(*) FROM analyses WHERE primary_framework IS NOT NULL GROUP BY primary_framework",
    )?;
    let rows = stmt.query_map([], |row| {
        let fw: String = row.get(0)?;
        let count: i64 = row.get(1)?;
        Ok((fw, count))
    })?;
    for row in rows {
        let (fw, count) = row?;
        framework_dist.insert(fw, count);
    }

    // Confidence distribution
    let mut confidence_dist = std::collections::HashMap::new();
    let mut stmt = conn.prepare(
        "SELECT primary_confidence, COUNT(*) FROM analyses WHERE primary_confidence IS NOT NULL GROUP BY primary_confidence",
    )?;
    let rows = stmt.query_map([], |row| {
        let conf: String = row.get(0)?;
        let count: i64 = row.get(1)?;
        Ok((conf, count))
    })?;
    for row in rows {
        let (conf, count) = row?;
        confidence_dist.insert(conf, count);
    }

    Ok(DashboardStatsRow {
        total_analyses,
        success_count,
        failure_count,
        framework_distribution: framework_dist,
        confidence_distribution: confidence_dist,
    })
}

/// Save settings to database
pub fn save_settings(conn: &Connection, settings: &AppSettings) -> Result<(), Box<dyn std::error::Error>> {
    let json = serde_json::to_string(settings)?;
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('app_settings', ?1, datetime('now'))",
        params![json],
    )?;
    Ok(())
}

/// Load settings from database
pub fn load_settings(conn: &Connection) -> Result<AppSettings, Box<dyn std::error::Error>> {
    let json: String = conn.query_row(
        "SELECT value FROM settings WHERE key = 'app_settings'",
        [],
        |row| row.get(0),
    )?;
    let settings: AppSettings = serde_json::from_str(&json)?;
    Ok(settings)
}

/// Save custom signature
pub fn save_custom_signature(
    conn: &Connection,
    sig: &stacklens_shared::types::CustomSignature,
) -> Result<(), Box<dyn std::error::Error>> {
    let json = serde_json::to_string(sig)?;
    conn.execute(
        "INSERT OR REPLACE INTO custom_signatures (id, name, framework, enabled, definition_json, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))",
        params![sig.id, sig.name, sig.framework, sig.enabled as i32, json],
    )?;
    Ok(())
}

/// Load custom signatures
pub fn load_custom_signatures(
    conn: &Connection,
) -> Result<Vec<stacklens_shared::types::CustomSignature>, Box<dyn std::error::Error>> {
    let mut stmt = conn.prepare("SELECT definition_json FROM custom_signatures ORDER BY name")?;
    let sigs = stmt
        .query_map([], |row| {
            let json: String = row.get(0)?;
            Ok(json)
        })?
        .filter_map(|r| r.ok())
        .filter_map(|json| serde_json::from_str(&json).ok())
        .collect();
    Ok(sigs)
}

/// Delete custom signature
pub fn delete_custom_signature_by_id(conn: &Connection, id: &str) -> Result<(), rusqlite::Error> {
    conn.execute("DELETE FROM custom_signatures WHERE id = ?1", params![id])?;
    Ok(())
}

// Data types for database results

#[derive(Debug, Clone, serde::Serialize)]
pub struct HistoryEntry {
    pub id: String,
    pub timestamp: String,
    pub filename: String,
    pub package_name: Option<String>,
    pub primary_framework: Option<String>,
    pub confidence: Option<String>,
    pub status: String,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone)]
pub struct DashboardStatsRow {
    pub total_analyses: i64,
    pub success_count: i64,
    pub failure_count: i64,
    pub framework_distribution: std::collections::HashMap<String, i64>,
    pub confidence_distribution: std::collections::HashMap<String, i64>,
}
