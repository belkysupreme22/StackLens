//! Traits and context definitions for StackLens framework detectors.

use stacklens_shared::*;

/// Context provided to each detector containing pre-parsed APK data.
#[derive(Debug, Clone)]
pub struct DetectionContext {
    /// Normalized full file paths in the APK archive (e.g. "lib/arm64-v8a/libflutter.so", "assets/...").
    pub file_listing: Vec<String>,
    /// Parsed native shared libraries (.so) found in the APK.
    pub native_libs: Vec<NativeLibInfo>,
    /// Asset file paths inside the APK (starting with "assets/").
    pub assets: Vec<String>,
    /// Extracted DEX class names and descriptors (e.g. "io.flutter.embedding.engine.FlutterEngine").
    pub dex_classes: Vec<String>,
    /// All string literals extracted from all DEX files in the APK.
    pub dex_strings: Vec<String>,
    /// Raw bytes of AndroidManifest.xml if successfully extracted.
    pub manifest_content: Option<Vec<u8>>,
    /// Extracted strings from AndroidManifest.xml string pool and attribute values.
    pub manifest_strings: Vec<String>,
    /// Basic APK metadata extracted from manifest and file properties.
    pub apk_metadata: ApkMetadata,
}

impl DetectionContext {
    /// Helper to test if any file path in the APK satisfies a predicate.
    pub fn has_file<F>(&self, predicate: F) -> bool
    where
        F: Fn(&str) -> bool,
    {
        self.file_listing.iter().any(|f| predicate(f))
    }

    /// Helper to collect all file paths matching a predicate.
    pub fn find_files<F>(&self, predicate: F) -> Vec<String>
    where
        F: Fn(&str) -> bool,
    {
        self.file_listing
            .iter()
            .filter(|f| predicate(f))
            .cloned()
            .collect()
    }

    /// Helper to check if a specific native library filename exists.
    pub fn has_native_lib(&self, lib_name: &str) -> bool {
        self.native_libs.iter().any(|lib| lib.name == lib_name)
    }

    /// Helper to find native libraries matching a filename.
    pub fn find_native_libs(&self, lib_name: &str) -> Vec<&NativeLibInfo> {
        self.native_libs
            .iter()
            .filter(|lib| lib.name == lib_name)
            .collect()
    }

    /// Helper to check if any asset path matches a predicate.
    pub fn has_asset<F>(&self, predicate: F) -> bool
    where
        F: Fn(&str) -> bool,
    {
        self.assets.iter().any(|a| predicate(a))
    }

    /// Helper to find assets matching a predicate.
    pub fn find_assets<F>(&self, predicate: F) -> Vec<String>
    where
        F: Fn(&str) -> bool,
    {
        self.assets.iter().filter(|a| predicate(a)).cloned().collect()
    }

    /// Helper to check if any DEX class matches a predicate.
    pub fn has_class<F>(&self, predicate: F) -> bool
    where
        F: Fn(&str) -> bool,
    {
        self.dex_classes.iter().any(|c| predicate(c))
    }

    /// Helper to find DEX classes matching a predicate.
    pub fn find_classes<F>(&self, predicate: F) -> Vec<String>
    where
        F: Fn(&str) -> bool,
    {
        self.dex_classes
            .iter()
            .filter(|c| predicate(c))
            .cloned()
            .collect()
    }

    /// Helper to check if any DEX string contains a substring.
    pub fn has_dex_string(&self, pattern: &str) -> bool {
        self.dex_strings.iter().any(|s| s.contains(pattern))
    }

    /// Helper to check if any manifest string matches a predicate.
    pub fn has_manifest_string<F>(&self, predicate: F) -> bool
    where
        F: Fn(&str) -> bool,
    {
        self.manifest_strings.iter().any(|s| predicate(s))
    }
}

/// Trait that all framework detectors must implement.
pub trait Detector: Send + Sync {
    /// Returns the human-readable name of this detector.
    fn name(&self) -> &str;

    /// Analyzes the context and returns a framework detection result.
    fn detect(&self, context: &DetectionContext) -> FrameworkDetection;
}
