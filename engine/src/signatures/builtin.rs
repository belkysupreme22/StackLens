/// Built-in signature definitions used by the detection engine.
///
/// These patterns define the file, library, asset, and class indicators
/// for each supported framework. They are used by the individual detectors.

/// Native library patterns associated with each framework.
pub struct LibrarySignature {
    pub name: &'static str,
    pub framework: &'static str,
    pub purpose: &'static str,
}

/// Known native library signatures.
pub const KNOWN_LIBRARIES: &[LibrarySignature] = &[
    // Flutter
    LibrarySignature {
        name: "libflutter.so",
        framework: "Flutter",
        purpose: "Flutter engine",
    },
    LibrarySignature {
        name: "libapp.so",
        framework: "Flutter",
        purpose: "Flutter application code (AOT compiled)",
    },
    // React Native
    LibrarySignature {
        name: "libreactnativejni.so",
        framework: "ReactNative",
        purpose: "React Native JNI bridge",
    },
    LibrarySignature {
        name: "libreactnative.so",
        framework: "ReactNative",
        purpose: "React Native runtime",
    },
    LibrarySignature {
        name: "libhermes.so",
        framework: "ReactNative",
        purpose: "Hermes JavaScript engine",
    },
    LibrarySignature {
        name: "libjsc.so",
        framework: "ReactNative",
        purpose: "JavaScriptCore engine",
    },
    LibrarySignature {
        name: "libyoga.so",
        framework: "ReactNative",
        purpose: "Yoga layout engine",
    },
    LibrarySignature {
        name: "libreactperfloggerjni.so",
        framework: "ReactNative",
        purpose: "React Native performance logger",
    },
    // Unity
    LibrarySignature {
        name: "libunity.so",
        framework: "Unity",
        purpose: "Unity engine",
    },
    LibrarySignature {
        name: "libil2cpp.so",
        framework: "Unity",
        purpose: "Unity IL2CPP runtime",
    },
    // Xamarin / .NET
    LibrarySignature {
        name: "libmonodroid.so",
        framework: "Xamarin",
        purpose: "Mono Android runtime",
    },
    LibrarySignature {
        name: "libmonosgen-2.0.so",
        framework: "Xamarin",
        purpose: "Mono SGen garbage collector",
    },
    LibrarySignature {
        name: "libxamarin-app.so",
        framework: "Xamarin",
        purpose: "Xamarin application runtime",
    },
    // NativeScript
    LibrarySignature {
        name: "libNativeScript.so",
        framework: "NativeScript",
        purpose: "NativeScript runtime",
    },
    // Unreal Engine
    LibrarySignature {
        name: "libUE4.so",
        framework: "UnrealEngine",
        purpose: "Unreal Engine 4 runtime",
    },
    LibrarySignature {
        name: "libUnreal.so",
        framework: "UnrealEngine",
        purpose: "Unreal Engine runtime",
    },
    // Godot
    LibrarySignature {
        name: "libgodot_android.so",
        framework: "Godot",
        purpose: "Godot engine for Android",
    },
];

/// File path patterns that indicate a framework.
pub struct FilePatternSignature {
    pub pattern: &'static str,
    pub framework: &'static str,
    pub description: &'static str,
}

/// Known file path signatures.
pub const KNOWN_FILE_PATTERNS: &[FilePatternSignature] = &[
    // Flutter
    FilePatternSignature {
        pattern: "flutter_assets/",
        framework: "Flutter",
        description: "Flutter assets directory",
    },
    FilePatternSignature {
        pattern: "flutter_assets/AssetManifest.json",
        framework: "Flutter",
        description: "Flutter asset manifest",
    },
    FilePatternSignature {
        pattern: "flutter_assets/FontManifest.json",
        framework: "Flutter",
        description: "Flutter font manifest",
    },
    // React Native
    FilePatternSignature {
        pattern: "assets/index.android.bundle",
        framework: "ReactNative",
        description: "React Native JavaScript bundle",
    },
    // Unity
    FilePatternSignature {
        pattern: "assets/bin/Data/",
        framework: "Unity",
        description: "Unity data directory",
    },
    // Cordova
    FilePatternSignature {
        pattern: "assets/www/cordova.js",
        framework: "Cordova",
        description: "Cordova JavaScript runtime",
    },
    FilePatternSignature {
        pattern: "assets/www/cordova_plugins.js",
        framework: "Cordova",
        description: "Cordova plugins manifest",
    },
    // Capacitor
    FilePatternSignature {
        pattern: "assets/capacitor.config.json",
        framework: "Capacitor",
        description: "Capacitor configuration",
    },
    FilePatternSignature {
        pattern: "assets/capacitor.config.ts",
        framework: "Capacitor",
        description: "Capacitor TypeScript configuration",
    },
    // NativeScript
    FilePatternSignature {
        pattern: "assets/app/bundle.js",
        framework: "NativeScript",
        description: "NativeScript application bundle",
    },
    FilePatternSignature {
        pattern: "assets/app/vendor.js",
        framework: "NativeScript",
        description: "NativeScript vendor bundle",
    },
];

/// DEX class/string patterns that indicate a framework.
pub struct ClassPatternSignature {
    pub pattern: &'static str,
    pub framework: &'static str,
    pub description: &'static str,
}

/// Known class/string patterns.
pub const KNOWN_CLASS_PATTERNS: &[ClassPatternSignature] = &[
    ClassPatternSignature {
        pattern: "com.facebook.react",
        framework: "ReactNative",
        description: "React Native runtime classes",
    },
    ClassPatternSignature {
        pattern: "org.apache.cordova",
        framework: "Cordova",
        description: "Apache Cordova runtime classes",
    },
    ClassPatternSignature {
        pattern: "com.getcapacitor",
        framework: "Capacitor",
        description: "Capacitor runtime classes",
    },
    ClassPatternSignature {
        pattern: "org.nativescript",
        framework: "NativeScript",
        description: "NativeScript runtime classes",
    },
    ClassPatternSignature {
        pattern: "androidx.compose.",
        framework: "JetpackCompose",
        description: "Jetpack Compose UI classes",
    },
    ClassPatternSignature {
        pattern: "kotlin.Metadata",
        framework: "NativeAndroidKotlin",
        description: "Kotlin metadata annotations",
    },
];

/// Look up the purpose of a native library by its filename.
pub fn identify_library(name: &str) -> Option<&'static str> {
    KNOWN_LIBRARIES
        .iter()
        .find(|sig| sig.name == name)
        .map(|sig| sig.purpose)
}
