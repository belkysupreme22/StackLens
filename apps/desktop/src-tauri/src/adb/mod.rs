//! ADB (Android Debug Bridge) Integration Module

use std::path::{Path, PathBuf};
use std::process::Command;
use stacklens_shared::types::{DeviceInfo, DeviceState};

pub struct AdbManager {
    adb_path: String,
}

impl AdbManager {
    pub fn new(configured_path: &str) -> Self {
        let adb_path = if !configured_path.is_empty() && Path::new(configured_path).exists() {
            configured_path.to_string()
        } else if let Some(discovered) = Self::discover_adb() {
            discovered.to_string_lossy().to_string()
        } else {
            "adb".to_string()
        };

        Self { adb_path }
    }

    /// Try to locate adb binary in PATH or common Android SDK locations
    pub fn discover_adb() -> Option<PathBuf> {
        // 1. Check if "adb version" succeeds directly
        if Command::new("adb").arg("version").output().is_ok() {
            return Some(PathBuf::from("adb"));
        }

        // 2. Check ANDROID_HOME / ANDROID_SDK_ROOT
        for env_var in &["ANDROID_HOME", "ANDROID_SDK_ROOT"] {
            if let Ok(dir) = std::env::var(env_var) {
                let candidate = PathBuf::from(dir).join("platform-tools").join("adb");
                if candidate.exists() {
                    return Some(candidate);
                }
            }
        }

        // 3. Common macOS / Linux paths
        let home = std::env::var("HOME").unwrap_or_default();
        let common_paths = [
            format!("{home}/Library/Android/sdk/platform-tools/adb"),
            format!("{home}/Android/Sdk/platform-tools/adb"),
            "/opt/homebrew/bin/adb".to_string(),
            "/usr/local/bin/adb".to_string(),
        ];

        for path in &common_paths {
            let p = PathBuf::from(path);
            if p.exists() {
                return Some(p);
            }
        }

        None
    }

    /// Test if adb executable is working and can contact the daemon
    pub fn is_available(&self) -> bool {
        Command::new(&self.adb_path)
            .arg("version")
            .output()
            .map(|out| out.status.success())
            .unwrap_or(false)
    }

    /// List all currently connected Android devices with full details
    pub fn list_devices(&self) -> Result<Vec<DeviceInfo>, String> {
        if !self.is_available() {
            return Err("ADB is not available on this system. Please configure the ADB path in Settings or install the Android SDK platform-tools.".to_string());
        }

        let output = Command::new(&self.adb_path)
            .args(["devices", "-l"])
            .output()
            .map_err(|e| format!("Failed to execute adb devices: {e}"))?;

        if !output.status.success() {
            let err = String::from_utf8_lossy(&output.stderr);
            return Err(format!("ADB command returned error: {err}"));
        }

        let text = String::from_utf8_lossy(&output.stdout);
        let mut devices = Vec::new();

        for line in text.lines().skip(1) {
            let line = line.trim();
            if line.is_empty() {
                continue;
            }

            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.is_empty() {
                continue;
            }

            let serial = parts[0].to_string();
            let state_str = parts.get(1).copied().unwrap_or("unknown");

            let state = match state_str {
                "device" => DeviceState::Online,
                "offline" => DeviceState::Offline,
                "unauthorized" => DeviceState::Unauthorized,
                _ => DeviceState::Unknown,
            };

            let mut model = None;
            for part in parts.iter().skip(2) {
                if let Some(m) = part.strip_prefix("model:") {
                    model = Some(m.replace('_', " "));
                }
            }

            let (manufacturer, android_version, sdk_level) = if state == DeviceState::Online {
                self.query_device_properties(&serial)
            } else {
                (None, None, None)
            };

            devices.push(DeviceInfo {
                serial,
                model,
                manufacturer,
                android_version,
                sdk_level,
                state,
            });
        }

        Ok(devices)
    }

    /// Query getprop values for an online device
    fn query_device_properties(
        &self,
        serial: &str,
    ) -> (Option<String>, Option<String>, Option<String>) {
        let run_prop = |prop: &str| -> Option<String> {
            Command::new(&self.adb_path)
                .args(["-s", serial, "shell", "getprop", prop])
                .output()
                .ok()
                .filter(|out| out.status.success())
                .map(|out| String::from_utf8_lossy(&out.stdout).trim().to_string())
                .filter(|s| !s.is_empty())
        };

        let manufacturer = run_prop("ro.product.manufacturer");
        let android_ver = run_prop("ro.build.version.release");
        let sdk_level = run_prop("ro.build.version.sdk");

        (manufacturer, android_ver, sdk_level)
    }

    /// List third-party and system installed packages on a device
    pub fn list_packages(&self, serial: &str) -> Result<Vec<String>, String> {
        let output = Command::new(&self.adb_path)
            .args(["-s", serial, "shell", "pm", "list", "packages"])
            .output()
            .map_err(|e| format!("Failed to list packages: {e}"))?;

        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }

        let text = String::from_utf8_lossy(&output.stdout);
        let mut packages = Vec::new();

        for line in text.lines() {
            let line = line.trim();
            if let Some(pkg) = line.strip_prefix("package:") {
                let clean = pkg.trim();
                if !clean.is_empty() {
                    packages.push(clean.to_string());
                }
            }
        }

        packages.sort();
        Ok(packages)
    }

    /// Pull the APK(s) for a package from the device to a local target folder.
    /// Returns the local path to the primary/base APK.
    pub fn pull_package(
        &self,
        serial: &str,
        package_name: &str,
        dest_dir: &Path,
    ) -> Result<PathBuf, String> {
        // 1. Get apk path(s) using 'pm path'
        let output = Command::new(&self.adb_path)
            .args(["-s", serial, "shell", "pm", "path", package_name])
            .output()
            .map_err(|e| format!("Failed to resolve package path: {e}"))?;

        if !output.status.success() {
            return Err(format!(
                "Package '{}' not found on device or inaccessible: {}",
                package_name,
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        let text = String::from_utf8_lossy(&output.stdout);
        let mut remote_paths = Vec::new();

        for line in text.lines() {
            let line = line.trim();
            if let Some(p) = line.strip_prefix("package:") {
                let trimmed = p.trim();
                if !trimmed.is_empty() {
                    remote_paths.push(trimmed.to_string());
                }
            }
        }

        if remote_paths.is_empty() {
            return Err(format!("Could not locate any APK files for package '{package_name}'"));
        }

        std::fs::create_dir_all(dest_dir).map_err(|e| format!("Failed to create output dir: {e}"))?;

        let mut primary_apk: Option<PathBuf> = None;

        for remote in &remote_paths {
            let file_name = Path::new(remote)
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "base.apk".to_string());

            let safe_filename = format!("{package_name}_{file_name}");
            let local_dest = dest_dir.join(&safe_filename);

            let pull_out = Command::new(&self.adb_path)
                .args(["-s", serial, "pull", remote, &local_dest.to_string_lossy()])
                .output()
                .map_err(|e| format!("Failed to pull APK: {e}"))?;

            if !pull_out.status.success() {
                return Err(format!(
                    "Failed to pull APK from '{}': {}",
                    remote,
                    String::from_utf8_lossy(&pull_out.stderr)
                ));
            }

            if primary_apk.is_none() || file_name.contains("base") {
                primary_apk = Some(local_dest);
            }
        }

        primary_apk.ok_or_else(|| "No valid APK could be retrieved".to_string())
    }
}
