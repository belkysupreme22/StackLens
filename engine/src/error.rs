use thiserror::Error;

/// Errors that can occur during APK analysis.
#[derive(Debug, Error)]
pub enum EngineError {
    #[error("I/O error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("ZIP error: {0}")]
    ZipError(#[from] zip::result::ZipError),

    #[error("Parse error: {0}")]
    ParseError(String),

    #[error("Invalid APK: {0}")]
    InvalidApk(String),

    #[error("Analysis timed out after {0} seconds")]
    Timeout(u64),

    #[error("{0}")]
    Other(String),
}

/// Result type alias for engine operations.
pub type EngineResult<T> = Result<T, EngineError>;
