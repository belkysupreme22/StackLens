use std::collections::HashMap;
use std::process::Command;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct ToolStatus {
    pub available: bool,
    pub path: Option<String>,
    pub version: Option<String>,
}

#[tauri::command]
pub fn get_app_version() -> String {
    "0.1.0".to_string()
}

#[tauri::command]
pub fn check_external_tools() -> HashMap<String, ToolStatus> {
    let mut tools = HashMap::new();

    let check_cmd = |name: &str, ver_arg: &str| -> ToolStatus {
        match Command::new(name).arg(ver_arg).output() {
            Ok(output) if output.status.success() => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let first_line = stdout.lines().next().unwrap_or("").trim().to_string();
                ToolStatus {
                    available: true,
                    path: Some(name.to_string()),
                    version: if first_line.is_empty() { None } else { Some(first_line) },
                }
            }
            _ => ToolStatus {
                available: false,
                path: None,
                version: None,
            },
        }
    };

    tools.insert("adb".to_string(), check_cmd("adb", "version"));
    tools.insert("jadx".to_string(), check_cmd("jadx", "--version"));
    tools.insert("apktool".to_string(), check_cmd("apktool", "--version"));
    tools.insert("aapt2".to_string(), check_cmd("aapt2", "version"));
    tools.insert("apkanalyzer".to_string(), check_cmd("apkanalyzer", "--version"));

    tools
}

#[tauri::command]
pub fn open_in_explorer(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("-R")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg("/select,")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}
