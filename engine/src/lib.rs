//! StackLens Detection Engine — Android Application Intelligence
//!
//! A modular, standalone engine for reverse-engineering and framework detection of Android APK files.

pub mod apk_parser;
pub mod core;
pub mod detectors;
pub mod error;
pub mod reporting;
pub mod scoring;
pub mod signatures;

pub use core::Analyzer;
pub use error::{EngineError, EngineResult};
pub use stacklens_shared::types::{AnalysisConfig, AnalysisResult};

use std::path::Path;

/// High-level convenience function to analyze an APK at a given file path.
pub fn analyze_apk<P: AsRef<Path>>(path: P, config: Option<AnalysisConfig>) -> EngineResult<AnalysisResult> {
    let cfg = config.unwrap_or_default();
    let analyzer = Analyzer::new(cfg);
    analyzer.analyze_file(path)
}

/// High-level convenience function to analyze an APK from raw in-memory bytes.
pub fn analyze_apk_bytes(
    filename: String,
    bytes: Vec<u8>,
    config: Option<AnalysisConfig>,
) -> EngineResult<AnalysisResult> {
    let cfg = config.unwrap_or_default();
    let analyzer = Analyzer::new(cfg);
    analyzer.analyze_bytes(filename, bytes)
}
