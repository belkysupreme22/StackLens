//! Native library (.so) cataloging and classification.
//!
//! Inspects native shared libraries within an APK, extracts target ABI/architecture,
//! and identifies framework purposes (e.g., Flutter engine, Hermes, React Native).

use stacklens_shared::NativeLibInfo;

pub fn extract_native_libraries(_file_listing: &[String], entries: &[(String, u64)]) -> Vec<NativeLibInfo> {
    catalog_native_libs(entries)
}

/// Catalog all native libraries from a list of archive entries with their file sizes.
///
/// Searches for files matching `lib/{arch}/{name}.so`, extracts the target architecture,
/// library filename, and assigns a known framework or runtime purpose if recognized.
pub fn catalog_native_libs(entries: &[(String, u64)]) -> Vec<NativeLibInfo> {
    let mut libs = Vec::new();

    for (path, size) in entries {
        if let Some((arch, name)) = parse_lib_path(path) {
            let purpose = identify_lib_purpose(&name);
            libs.push(NativeLibInfo {
                name,
                arch,
                size: *size,
                purpose,
            });
        }
    }

    libs
}

/// Catalog native libraries from a slice of file paths without size information (size defaults to 0).
pub fn catalog_native_libs_from_names(paths: &[String]) -> Vec<NativeLibInfo> {
    let entries: Vec<(String, u64)> = paths.iter().map(|p| (p.clone(), 0)).collect();
    catalog_native_libs(&entries)
}


/// Parse a file path to check if it points to a native `.so` library under `lib/{arch}/{name}.so`.
///
/// Returns `Some((arch, lib_name))` if the path matches, or `None` otherwise.
pub fn parse_lib_path(path: &str) -> Option<(String, String)> {
    let normalized = path.replace('\\', "/");
    let trimmed = normalized.trim_start_matches('/');

    let parts: Vec<&str> = trimmed.split('/').collect();
    // Expected structure: "lib" / "{arch}" / "{name}.so"
    if parts.len() == 3 && parts[0] == "lib" && parts[2].ends_with(".so") && !parts[1].is_empty() {
        let arch = parts[1].to_string();
        let name = parts[2].to_string();
        Some((arch, name))
    } else {
        None
    }
}

/// Identify the known purpose or framework association of a native `.so` library.
pub fn identify_lib_purpose(filename: &str) -> Option<String> {
    let name_lower = filename.to_ascii_lowercase();

    match name_lower.as_str() {
        // Flutter
        "libflutter.so" => Some("Flutter engine".to_string()),
        "libapp.so" => Some("Flutter application AOT code".to_string()),

        // React Native & JS Engines
        "libreactnativejni.so" | "libreactnative.so" => {
            Some("React Native bridge".to_string())
        }
        "libreactnativeblob.so" => Some("React Native Blob module".to_string()),
        "libturbomodulejsijni.so" => Some("React Native TurboModule JSI".to_string()),
        "libhermes.so" => Some("Hermes JS engine".to_string()),
        "libhermesexecutor.so" => Some("React Native Hermes executor".to_string()),
        "libjsc.so" => Some("JavaScriptCore engine".to_string()),
        "libjscexecutor.so" => Some("React Native JSC executor".to_string()),
        "libv8.so" | "libv8_android.so" => Some("V8 JavaScript engine".to_string()),
        "libfbjni.so" => Some("Facebook JNI helper (React Native)".to_string()),
        "libfolly_runtime.so" | "libfolly_json.so" => {
            Some("Facebook Folly runtime (React Native)".to_string())
        }
        "libglog.so" | "libglog_init.so" => {
            Some("Google GLog library (React Native)".to_string())
        }

        // Unity
        "libunity.so" => Some("Unity engine".to_string()),
        "libil2cpp.so" => Some("Unity IL2CPP runtime".to_string()),
        "libmain.so" => Some("Unity / native application entry point".to_string()),

        // Xamarin / .NET MAUI / Mono
        "libmonodroid.so" => Some("Mono Android runtime".to_string()),
        "libmonosgen-2.0.so" => Some("Mono SGen GC runtime".to_string()),
        "libmonosgen-64bit-2.0.so" => Some("Mono 64-bit SGen GC runtime".to_string()),
        "libxamarin-app.so" => Some("Xamarin application runtime".to_string()),
        "libxa-internal-api.so" => Some("Xamarin internal API".to_string()),
        "libmono-native.so" => Some("Mono native runtime".to_string()),
        "libmono-btls-shared.so" => Some("Mono TLS runtime".to_string()),
        "libdotnet.so" => Some(".NET runtime".to_string()),

        // Godot
        "libgodot_android.so" => Some("Godot engine".to_string()),

        // Unreal Engine
        "libue4.so" | "libunreal.so" => Some("Unreal Engine".to_string()),

        // NativeScript
        "libnativescript.so" => Some("NativeScript runtime".to_string()),

        // Qt Framework
        "libqt5core.so" | "libqt6core.so" => Some("Qt Core framework".to_string()),
        "libqt5gui.so" | "libqt6gui.so" => Some("Qt GUI framework".to_string()),

        // Capacitor / Cordova
        "libcapacitor.so" => Some("Capacitor native runtime".to_string()),

        // Databases
        "libsqlite.so" | "libsqlite3.so" | "libsqlitex.so" => {
            Some("SQLite database engine".to_string())
        }
        "libe_sqlite3.so" => Some("SQLitePCLRaw database engine".to_string()),
        "librealm-jni.so" => Some("Realm database runtime".to_string()),
        "libsqlcipher.so" => Some("SQLCipher encrypted database".to_string()),

        // Machine Learning & Media
        "libtensorflowlite_jni.so" => Some("TensorFlow Lite runtime".to_string()),
        "libonnxruntime.so" => Some("ONNX runtime".to_string()),
        "libopencv_java.so" | "libopencv_java4.so" => {
            Some("OpenCV computer vision library".to_string())
        }
        "libwebrtc.so" => Some("WebRTC native library".to_string()),
        "libagora-rtc-sdk.so" => Some("Agora RTC SDK".to_string()),

        // Security / Crypto / Network
        "libcrypto.so" => Some("OpenSSL / BoringSSL crypto library".to_string()),
        "libssl.so" => Some("OpenSSL / BoringSSL SSL library".to_string()),

        _ => {
            if name_lower.starts_with("libreact_") || name_lower.starts_with("libreactnative_") {
                Some("React Native component".to_string())
            } else if name_lower.starts_with("libcronet.") {
                Some("Chromium Cronet network library".to_string())
            } else {
                None
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_lib_path() {
        assert_eq!(
            parse_lib_path("lib/arm64-v8a/libflutter.so"),
            Some(("arm64-v8a".to_string(), "libflutter.so".to_string()))
        );
        assert_eq!(
            parse_lib_path("/lib/x86_64/libhermes.so"),
            Some(("x86_64".to_string(), "libhermes.so".to_string()))
        );
        assert_eq!(
            parse_lib_path("lib\\armeabi-v7a\\libreactnativejni.so"),
            Some(("armeabi-v7a".to_string(), "libreactnativejni.so".to_string()))
        );
        assert_eq!(parse_lib_path("assets/libflutter.so"), None);
        assert_eq!(parse_lib_path("lib/libflutter.so"), None);
        assert_eq!(parse_lib_path("lib/arm64-v8a/something.txt"), None);
    }

    #[test]
    fn test_identify_purposes() {
        assert_eq!(
            identify_lib_purpose("libflutter.so").as_deref(),
            Some("Flutter engine")
        );
        assert_eq!(
            identify_lib_purpose("libapp.so").as_deref(),
            Some("Flutter application AOT code")
        );
        assert_eq!(
            identify_lib_purpose("libreactnativejni.so").as_deref(),
            Some("React Native bridge")
        );
        assert_eq!(
            identify_lib_purpose("libhermes.so").as_deref(),
            Some("Hermes JS engine")
        );
        assert_eq!(
            identify_lib_purpose("libjsc.so").as_deref(),
            Some("JavaScriptCore engine")
        );
        assert_eq!(
            identify_lib_purpose("libunity.so").as_deref(),
            Some("Unity engine")
        );
        assert_eq!(
            identify_lib_purpose("libil2cpp.so").as_deref(),
            Some("Unity IL2CPP runtime")
        );
        assert_eq!(
            identify_lib_purpose("libmonodroid.so").as_deref(),
            Some("Mono Android runtime")
        );
        assert_eq!(
            identify_lib_purpose("libmonosgen-2.0.so").as_deref(),
            Some("Mono SGen GC runtime")
        );
        assert_eq!(
            identify_lib_purpose("libgodot_android.so").as_deref(),
            Some("Godot engine")
        );
        assert_eq!(
            identify_lib_purpose("libUE4.so").as_deref(),
            Some("Unreal Engine")
        );
        assert_eq!(
            identify_lib_purpose("libNativeScript.so").as_deref(),
            Some("NativeScript runtime")
        );
        assert_eq!(identify_lib_purpose("libunknown_custom.so"), None);
    }

    #[test]
    fn test_catalog_native_libs() {
        let entries = vec![
            ("lib/arm64-v8a/libflutter.so".to_string(), 1234567),
            ("lib/arm64-v8a/libapp.so".to_string(), 7654321),
            ("lib/x86/libunity.so".to_string(), 3456789),
            ("res/layout/main.xml".to_string(), 1024),
        ];

        let libs = catalog_native_libs(&entries);
        assert_eq!(libs.len(), 3);

        assert_eq!(libs[0].name, "libflutter.so");
        assert_eq!(libs[0].arch, "arm64-v8a");
        assert_eq!(libs[0].size, 1234567);
        assert_eq!(libs[0].purpose.as_deref(), Some("Flutter engine"));

        assert_eq!(libs[1].name, "libapp.so");
        assert_eq!(libs[1].arch, "arm64-v8a");
        assert_eq!(libs[1].size, 7654321);

        assert_eq!(libs[2].name, "libunity.so");
        assert_eq!(libs[2].arch, "x86");
        assert_eq!(libs[2].size, 3456789);
        assert_eq!(libs[2].purpose.as_deref(), Some("Unity engine"));
    }
}
