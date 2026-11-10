//! StackLens framework detectors module.
//!
//! Provides individual detectors for 14 mobile frameworks as well as unified
//! detector collection functions.

pub mod capacitor;
pub mod cordova;
pub mod dotnet_maui;
pub mod flutter;
pub mod godot;
pub mod ionic;
pub mod jetpack_compose;
pub mod kotlin;
pub mod native_android;
pub mod nativescript;
pub mod react_native;
pub mod traits;
pub mod unity;
pub mod unreal;
pub mod xamarin;

pub use capacitor::CapacitorDetector;
pub use cordova::CordovaDetector;
pub use dotnet_maui::DotNetMauiDetector;
pub use flutter::FlutterDetector;
pub use godot::GodotDetector;
pub use ionic::IonicDetector;
pub use jetpack_compose::JetpackComposeDetector;
pub use kotlin::KotlinDetector;
pub use native_android::{NativeAndroidDetector, NativeJavaDetector, NativeKotlinDetector};
pub use nativescript::NativeScriptDetector;
pub use react_native::ReactNativeDetector;
pub use traits::{DetectionContext, Detector};
pub use unity::UnityDetector;
pub use unreal::UnrealEngineDetector;
pub use xamarin::XamarinDetector;

/// Returns instances of all 14 framework detectors.
pub fn all_detectors() -> Vec<Box<dyn Detector>> {
    vec![
        // Cross-platform runtime frameworks
        Box::new(FlutterDetector),
        Box::new(ReactNativeDetector),
        // Game engines
        Box::new(UnityDetector),
        Box::new(UnrealEngineDetector),
        Box::new(GodotDetector),
        // .NET ecosystem
        Box::new(DotNetMauiDetector),
        Box::new(XamarinDetector),
        // Hybrid / JavaScript runtimes
        Box::new(NativeScriptDetector),
        Box::new(CapacitorDetector),
        Box::new(CordovaDetector),
        // Secondary hybrid UI toolkit
        Box::new(IonicDetector),
        // Native Android platforms
        Box::new(NativeKotlinDetector),
        Box::new(NativeJavaDetector),
        // Native Android UI toolkit
        Box::new(JetpackComposeDetector),
    ]
}

/// Alias for [`all_detectors`] used by engine analyzers.
pub fn default_detectors() -> Vec<Box<dyn Detector>> {
    all_detectors()
}

#[cfg(test)]
mod tests {
    use super::*;
    use stacklens_shared::*;

    fn mock_context() -> DetectionContext {
        DetectionContext {
            file_listing: Vec::new(),
            native_libs: Vec::new(),
            assets: Vec::new(),
            dex_classes: Vec::new(),
            dex_strings: Vec::new(),
            manifest_content: None,
            manifest_strings: Vec::new(),
            apk_metadata: ApkMetadata {
                filename: "test.apk".to_string(),
                file_size: 1024,
                package_name: Some("com.example.test".to_string()),
                app_label: None,
                version_name: Some("1.0.0".to_string()),
                version_code: Some(1),
                min_sdk: Some(21),
                target_sdk: Some(34),
                permissions: vec![],
                main_activity: None,
                is_split_apk: false,
                split_name: None,
            },
        }
    }

    #[test]
    fn test_all_detectors_count() {
        let detectors = all_detectors();
        assert_eq!(detectors.len(), 14);
        let names: Vec<_> = detectors.iter().map(|d| d.name()).collect();
        assert!(names.contains(&"Flutter Detector"));
        assert!(names.contains(&"React Native Detector"));
        assert!(names.contains(&"Unity Detector"));
        assert!(names.contains(&"Unreal Engine Detector"));
        assert!(names.contains(&"Godot Detector"));
        assert!(names.contains(&".NET MAUI Detector"));
        assert!(names.contains(&"Xamarin Detector"));
        assert!(names.contains(&"NativeScript Detector"));
        assert!(names.contains(&"Capacitor Detector"));
        assert!(names.contains(&"Cordova Detector"));
        assert!(names.contains(&"Ionic Detector"));
        assert!(names.contains(&"Native Android (Kotlin) Detector"));
        assert!(names.contains(&"Native Android (Java) Detector"));
        assert!(names.contains(&"Jetpack Compose Detector"));
    }

    #[test]
    fn test_flutter_detector_scoring() {
        let detector = FlutterDetector;

        // 1. libflutter.so alone = 0.90
        let mut ctx = mock_context();
        ctx.native_libs.push(NativeLibInfo {
            name: "libflutter.so".to_string(),
            arch: "arm64-v8a".to_string(),
            size: 10_000_000,
            purpose: None,
        });
        let res = detector.detect(&ctx);
        assert_eq!(res.status, DetectionStatus::Detected);
        assert_eq!(res.confidence, ConfidenceLevel::High);
        assert!((res.confidence_score - 0.90).abs() < f64::EPSILON);
        assert!(res.is_primary);

        // 2. with flutter_assets = 0.95
        ctx.file_listing.push("flutter_assets/kernel_blob.bin".to_string());
        let res2 = detector.detect(&ctx);
        assert!((res2.confidence_score - 0.95).abs() < f64::EPSILON);

        // 3. with libapp.so = 0.98
        ctx.native_libs.push(NativeLibInfo {
            name: "libapp.so".to_string(),
            arch: "arm64-v8a".to_string(),
            size: 5_000_000,
            purpose: None,
        });
        let res3 = detector.detect(&ctx);
        assert!((res3.confidence_score - 0.98).abs() < f64::EPSILON);
    }

    #[test]
    fn test_react_native_detector_scoring() {
        let detector = ReactNativeDetector;

        // 1. libreactnativejni.so = 0.85
        let mut ctx = mock_context();
        ctx.native_libs.push(NativeLibInfo {
            name: "libreactnativejni.so".to_string(),
            arch: "arm64-v8a".to_string(),
            size: 2_000_000,
            purpose: None,
        });
        let res = detector.detect(&ctx);
        assert_eq!(res.status, DetectionStatus::Detected);
        assert!((res.confidence_score - 0.85).abs() < f64::EPSILON);

        // 2. with index.android.bundle = 0.95
        ctx.file_listing.push("assets/index.android.bundle".to_string());
        let res2 = detector.detect(&ctx);
        assert!((res2.confidence_score - 0.95).abs() < f64::EPSILON);

        // 3. with libhermes.so = 0.97
        ctx.native_libs.push(NativeLibInfo {
            name: "libhermes.so".to_string(),
            arch: "arm64-v8a".to_string(),
            size: 3_000_000,
            purpose: None,
        });
        let res3 = detector.detect(&ctx);
        assert!((res3.confidence_score - 0.97).abs() < f64::EPSILON);
    }

    #[test]
    fn test_unity_detector_scoring() {
        let detector = UnityDetector;

        // 1. libunity.so alone = 0.90
        let mut ctx = mock_context();
        ctx.native_libs.push(NativeLibInfo {
            name: "libunity.so".to_string(),
            arch: "arm64-v8a".to_string(),
            size: 20_000_000,
            purpose: None,
        });
        let res = detector.detect(&ctx);
        assert_eq!(res.status, DetectionStatus::Detected);
        assert!((res.confidence_score - 0.90).abs() < f64::EPSILON);

        // 2. with bin/Data = 0.95
        ctx.file_listing.push("assets/bin/Data/sharedassets0.assets".to_string());
        let res2 = detector.detect(&ctx);
        assert!((res2.confidence_score - 0.95).abs() < f64::EPSILON);

        // 3. with libil2cpp.so = 0.98
        ctx.native_libs.push(NativeLibInfo {
            name: "libil2cpp.so".to_string(),
            arch: "arm64-v8a".to_string(),
            size: 15_000_000,
            purpose: None,
        });
        let res3 = detector.detect(&ctx);
        assert!((res3.confidence_score - 0.98).abs() < f64::EPSILON);
    }

    #[test]
    fn test_xamarin_and_maui_distinction() {
        let xamarin = XamarinDetector;
        let maui = DotNetMauiDetector;

        // Xamarin app
        let mut ctx = mock_context();
        ctx.native_libs.push(NativeLibInfo {
            name: "libmonodroid.so".to_string(),
            arch: "arm64-v8a".to_string(),
            size: 1_000_000,
            purpose: None,
        });
        ctx.file_listing.push("assemblies/Xamarin.Forms.Core.dll".to_string());

        let xam_res = xamarin.detect(&ctx);
        assert_eq!(xam_res.status, DetectionStatus::Detected);
        assert!(xam_res.confidence_score >= 0.95);

        let maui_res = maui.detect(&ctx);
        assert_eq!(maui_res.status, DetectionStatus::NotDetected);

        // MAUI app
        let mut ctx_maui = mock_context();
        ctx_maui.native_libs.push(NativeLibInfo {
            name: "libmonosgen-2.0.so".to_string(),
            arch: "arm64-v8a".to_string(),
            size: 1_000_000,
            purpose: None,
        });
        ctx_maui.file_listing.push("assemblies/Microsoft.Maui.dll".to_string());
        ctx_maui.file_listing.push("assemblies/Microsoft.Maui.Controls.dll".to_string());

        let maui_res2 = maui.detect(&ctx_maui);
        assert_eq!(maui_res2.status, DetectionStatus::Detected);
        assert!(maui_res2.confidence_score >= 0.95);

        // Xamarin should have reduced confidence due to MAUI conflicting evidence
        let xam_res2 = xamarin.detect(&ctx_maui);
        assert!(xam_res2.confidence_score <= 0.35);
    }

    #[test]
    fn test_cordova_detector_scoring() {
        let detector = CordovaDetector;
        let mut ctx = mock_context();

        ctx.file_listing.push("assets/www/cordova.js".to_string());
        let res = detector.detect(&ctx);
        assert!((res.confidence_score - 0.85).abs() < f64::EPSILON);

        ctx.file_listing.push("assets/www/cordova_plugins.js".to_string());
        let res2 = detector.detect(&ctx);
        assert!((res2.confidence_score - 0.92).abs() < f64::EPSILON);

        ctx.dex_classes.push("org.apache.cordova.CordovaActivity".to_string());
        let res3 = detector.detect(&ctx);
        assert!((res3.confidence_score - 0.95).abs() < f64::EPSILON);
    }

    #[test]
    fn test_capacitor_detector_scoring() {
        let detector = CapacitorDetector;
        let mut ctx = mock_context();

        ctx.file_listing.push("assets/capacitor.config.json".to_string());
        let res = detector.detect(&ctx);
        assert!((res.confidence_score - 0.85).abs() < f64::EPSILON);

        ctx.dex_classes.push("com.getcapacitor.BridgeActivity".to_string());
        let res2 = detector.detect(&ctx);
        assert!((res2.confidence_score - 0.92).abs() < f64::EPSILON);
    }

    #[test]
    fn test_ionic_secondary_flag() {
        let detector = IonicDetector;
        let mut ctx = mock_context();

        ctx.file_listing.push("assets/www/ionic.bundle.js".to_string());
        ctx.dex_strings.push("@ionic/core".to_string());

        let res = detector.detect(&ctx);
        assert_eq!(res.status, DetectionStatus::Detected);
        // Ionic is always secondary (is_primary = false)
        assert!(!res.is_primary);
        assert!(res.confidence_score >= 0.60 && res.confidence_score <= 0.80);
    }

    #[test]
    fn test_nativescript_detector_scoring() {
        let detector = NativeScriptDetector;
        let mut ctx = mock_context();

        ctx.native_libs.push(NativeLibInfo {
            name: "libNativeScript.so".to_string(),
            arch: "arm64-v8a".to_string(),
            size: 4_000_000,
            purpose: None,
        });
        let res = detector.detect(&ctx);
        assert!((res.confidence_score - 0.85).abs() < f64::EPSILON);

        ctx.file_listing.push("assets/app/bundle.js".to_string());
        let res2 = detector.detect(&ctx);
        assert!((res2.confidence_score - 0.93).abs() < f64::EPSILON);
    }

    #[test]
    fn test_unreal_engine_detector_scoring() {
        let detector = UnrealEngineDetector;
        let mut ctx = mock_context();

        ctx.native_libs.push(NativeLibInfo {
            name: "libUE4.so".to_string(),
            arch: "arm64-v8a".to_string(),
            size: 50_000_000,
            purpose: None,
        });
        let res = detector.detect(&ctx);
        assert!((res.confidence_score - 0.90).abs() < f64::EPSILON);

        ctx.file_listing.push("assets/game.pak".to_string());
        let res2 = detector.detect(&ctx);
        assert!((res2.confidence_score - 0.95).abs() < f64::EPSILON);
    }

    #[test]
    fn test_godot_detector_scoring() {
        let detector = GodotDetector;
        let mut ctx = mock_context();

        ctx.native_libs.push(NativeLibInfo {
            name: "libgodot_android.so".to_string(),
            arch: "arm64-v8a".to_string(),
            size: 30_000_000,
            purpose: None,
        });
        let res = detector.detect(&ctx);
        assert!((res.confidence_score - 0.90).abs() < f64::EPSILON);

        ctx.file_listing.push("assets/main.pck".to_string());
        let res2 = detector.detect(&ctx);
        assert!((res2.confidence_score - 0.95).abs() < f64::EPSILON);
    }

    #[test]
    fn test_native_android_detector_java_vs_kotlin() {
        let detector = NativeAndroidDetector;

        // Kotlin App: metadata present
        let mut ctx_kotlin = mock_context();
        ctx_kotlin.dex_strings.push("kotlin.Metadata".to_string());
        ctx_kotlin.dex_classes.push("kotlin.Metadata".to_string());
        ctx_kotlin.file_listing.push("kotlin/reflect.kotlin_builtins".to_string());
        ctx_kotlin.dex_classes.push("com.example.test.MainActivity".to_string());

        let res_kotlin = detector.detect(&ctx_kotlin);
        assert_eq!(res_kotlin.framework, Framework::NativeAndroidKotlin);
        assert_eq!(res_kotlin.status, DetectionStatus::Detected);
        assert_eq!(res_kotlin.confidence, ConfidenceLevel::High);
        assert!((res_kotlin.confidence_score - 0.85).abs() < f64::EPSILON);

        // Java App: standard Android classes without Kotlin metadata
        let mut ctx_java = mock_context();
        ctx_java.dex_classes.push("com.example.test.MainActivity".to_string());
        ctx_java.dex_classes.push("androidx.appcompat.app.AppCompatActivity".to_string());

        let res_java = detector.detect(&ctx_java);
        assert_eq!(res_java.framework, Framework::NativeAndroidJava);
        assert_eq!(res_java.status, DetectionStatus::Detected);
        assert_eq!(res_java.confidence, ConfidenceLevel::Medium);
        assert!((res_java.confidence_score - 0.70).abs() < f64::EPSILON);

        // Empty App: no indicators
        let ctx_empty = mock_context();
        let res_empty = detector.detect(&ctx_empty);
        assert_eq!(res_empty.status, DetectionStatus::NotDetected);
    }

    #[test]
    fn test_jetpack_compose_secondary_flag() {
        let detector = JetpackComposeDetector;
        let mut ctx = mock_context();

        ctx.dex_classes.push("androidx.compose.ui.Modifier".to_string());
        let res = detector.detect(&ctx);
        assert_eq!(res.status, DetectionStatus::Detected);
        assert!(!res.is_primary);
        assert!((res.confidence_score - 0.80).abs() < f64::EPSILON);

        ctx.dex_strings.push("androidx.compose.runtime".to_string());
        let res2 = detector.detect(&ctx);
        assert!((res2.confidence_score - 0.90).abs() < f64::EPSILON);
    }
}
