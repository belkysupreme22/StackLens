//! Catalog resources and assets contained in an APK archive.
//!
//! Categorizes files residing in `assets/` and `res/` directories, determines
//! distinct resource types (layout, drawable, values, etc.), and counts total resources.

use serde::{Deserialize, Serialize};
use std::collections::BTreeSet;

/// Information about assets and Android resources within an APK.
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct ResourceInfo {
    /// File paths found under the `assets/` directory.
    pub assets: Vec<String>,
    /// Distinct resource types (e.g., "anim", "color", "drawable", "layout", "mipmap", "raw", "values", "xml").
    pub resource_types: Vec<String>,
    /// Total count of distinct resource files located under `res/`.
    pub resource_count: usize,
}

/// Catalog resources and assets from a flat file listing of the APK archive.
///
/// - Entries starting with `assets/` are collected into `assets`.
/// - Entries starting with `res/` increment `resource_count` and their subdirectory
///   base names (e.g. `drawable-hdpi` -> `drawable`) are collected into `resource_types`.
pub fn catalog_resources(file_listing: &[String]) -> ResourceInfo {
    let mut assets = Vec::new();
    let mut resource_types_set = BTreeSet::new();
    let mut resource_files = BTreeSet::new();

    for raw_path in file_listing {
        let normalized = raw_path.replace('\\', "/");
        let path = normalized.trim_start_matches('/');

        // Skip directory marker entries
        if path.ends_with('/') || path.is_empty() {
            continue;
        }

        if path.starts_with("assets/") && path.len() > "assets/".len() {
            assets.push(path.to_string());
        } else if path.starts_with("res/") && path.len() > "res/".len() {
            resource_files.insert(path.to_string());

            let remainder = &path["res/".len()..];
            if let Some(slash_pos) = remainder.find('/') {
                let subfolder = &remainder[..slash_pos];
                // Extract base resource type (e.g., "drawable-xxhdpi" -> "drawable")
                let base_type = subfolder.split('-').next().unwrap_or(subfolder);
                if !base_type.is_empty() {
                    resource_types_set.insert(base_type.to_string());
                }
            }
        }
    }

    ResourceInfo {
        assets,
        resource_types: resource_types_set.into_iter().collect(),
        resource_count: resource_files.len(),
    }
}

/// Catalog resources and assets from (path, size) entries.
pub fn catalog_resources_from_entries(entries: &[(String, u64)]) -> ResourceInfo {
    let paths: Vec<String> = entries.iter().map(|(p, _)| p.clone()).collect();
    catalog_resources(&paths)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_catalog() {
        let info = catalog_resources(&[]);
        assert!(info.assets.is_empty());
        assert!(info.resource_types.is_empty());
        assert_eq!(info.resource_count, 0);
    }

    #[test]
    fn test_catalog_assets_and_resources() {
        let listing = vec![
            "AndroidManifest.xml".to_string(),
            "classes.dex".to_string(),
            "assets/index.android.bundle".to_string(),
            "assets/flutter_assets/kernel_blob.bin".to_string(),
            "res/drawable-hdpi/ic_launcher.png".to_string(),
            "res/drawable-xxhdpi/ic_launcher.png".to_string(),
            "res/layout/activity_main.xml".to_string(),
            "res/layout-v21/activity_main.xml".to_string(),
            "res/values/strings.xml".to_string(),
            "res/raw/keep.xml".to_string(),
            "lib/arm64-v8a/libflutter.so".to_string(),
        ];

        let info = catalog_resources(&listing);
        assert_eq!(info.assets.len(), 2);
        assert!(info.assets.contains(&"assets/index.android.bundle".to_string()));
        assert!(info.assets.contains(&"assets/flutter_assets/kernel_blob.bin".to_string()));

        assert_eq!(info.resource_count, 6);
        assert!(info.resource_types.contains(&"drawable".to_string()));
        assert!(info.resource_types.contains(&"layout".to_string()));
        assert!(info.resource_types.contains(&"values".to_string()));
        assert!(info.resource_types.contains(&"raw".to_string()));
        assert_eq!(info.resource_types.len(), 4);
    }
}
