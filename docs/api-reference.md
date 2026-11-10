# API & CLI Reference

## Rust Engine API

```rust
use stacklens_engine::{analyze_apk, analyze_apk_bytes, AnalysisConfig};

// Analyze an APK file from path
let result = analyze_apk("path/to/app.apk", None)?;
println!("Primary framework: {:?}", result.detections[0].framework);

// Analyze from in-memory byte buffer
let bytes = std::fs::read("path/to/app.apk")?;
let result = analyze_apk_bytes("app.apk".to_string(), bytes, None)?;
```

## CLI Usage

```bash
# Analyze an APK
stacklens analyze <APK_PATH> [--format txt|json|csv]

# General info and supported frameworks
stacklens info
```

## Structured JSON Output Schema

```json
{
  "schema_version": "1.0.0",
  "analysis_id": "uuid",
  "timestamp": "ISO-8601",
  "apk": {
    "filename": "string",
    "file_size": 1024,
    "package_name": "string",
    "app_label": "string",
    "version_name": "string",
    "version_code": 1,
    "min_sdk": 21,
    "target_sdk": 34,
    "permissions": ["android.permission.INTERNET"],
    "main_activity": "string",
    "is_split_apk": false,
    "split_name": null
  },
  "detections": [
    {
      "framework": "Flutter",
      "status": "Detected",
      "confidence": "High",
      "confidence_score": 0.98,
      "is_primary": true,
      "evidence": [
        {
          "evidence_type": "Confirmed",
          "category": "NativeLibrary",
          "description": "Found Flutter engine runtime library (libflutter.so)",
          "source": "lib/*/libflutter.so",
          "file_path": "lib/arm64-v8a/libflutter.so",
          "class_name": null
        }
      ],
      "limitations": []
    }
  ]
}
```
