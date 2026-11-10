# StackLens — Android Application Intelligence

> **Discover. Analyze. Understand.**  
> Application ID: `com.stacklens.desktop`

StackLens is a desktop utility and decoupled detection engine for inspecting Android applications, reverse-engineering APK structures, and determining the underlying frameworks and runtime architectures with transparent, evidence-based confidence scoring.

---

## Supported Frameworks

StackLens detects 14 primary mobile frameworks, runtimes, and indicators:

1. **Flutter** (`libflutter.so`, `libapp.so`, `flutter_assets/`, `AssetManifest.json`)
2. **React Native** (`libreactnativejni.so`, `index.android.bundle`, `libhermes.so`, `libjsc.so`, `libyoga.so`)
3. **Unity** (`libunity.so`, `libil2cpp.so`, `assets/bin/Data/`, `globalgamemanagers`)
4. **Native Android (Kotlin)** (`kotlin.Metadata`, `kotlin/*.kotlin_module`, `kotlinx.coroutines`)
5. **Native Android (Java)** (Dalvik bytecode, `classes.dex`, AndroidX components without Kotlin metadata)
6. **.NET MAUI** (`Microsoft.Maui.dll`, `Microsoft.Maui.Controls.dll`, `libmonosgen-2.0.so`)
7. **Xamarin** (`Xamarin.Forms.dll`, `assemblies/*.dll`, `libmonodroid.so`)
8. **Apache Cordova** (`assets/www/cordova.js`, `assets/www/cordova_plugins.js`, `res/xml/config.xml`)
9. **Capacitor** (`assets/capacitor.config.json`, `assets/public/`, `com.getcapacitor.*`)
10. **Ionic** (`ionic.config.json`, Ionic component bundles)
11. **NativeScript** (`libNativeScript.so`, `assets/app/bundle.js`, `org.nativescript.*`)
12. **Unreal Engine** (`libUE4.so`, `libUnreal.so`, `*.pak`, `assets/UE4Game/`)
13. **Godot** (`libgodot_android.so`, `assets/*.pck`, `assets/project.godot`)
14. **Jetpack Compose** (`androidx.compose.ui.*`, `androidx.compose.runtime.*`, `androidx.compose.material3.*`)

---

## Quick Start: Using StackLens Right Now

### 1. Command Line Interface (CLI)

The CLI is fully compiled and ready to inspect APKs immediately:

```bash
# Display version and supported frameworks
cargo run -p stacklens-cli -- info

# Inspect an APK with human-readable text report
cargo run -p stacklens-cli -- analyze /path/to/app.apk --format txt

# Output structured JSON (compatible with external tools)
cargo run -p stacklens-cli -- analyze /path/to/app.apk --format json

# Output CSV
cargo run -p stacklens-cli -- analyze /path/to/app.apk --format csv
```

### 2. Desktop Application (GUI)

To start the desktop UI in development mode:

```bash
cd apps/desktop
npm run tauri dev
```

Or to build a standalone release binary:

```bash
cd apps/desktop
npm run build
cargo build --release -p stacklens-desktop
```

---

## Workspace Architecture

```text
StackLens/
├── engine/             # Independent, reusable detection engine (Rust)
│   ├── src/apk_parser/ # DEX, Manifest, native libs, resource cataloging
│   ├── src/detectors/  # 14 framework detectors implementing Detector trait
│   ├── src/scoring/    # Weighted evidence confidence calculation
│   ├── src/signatures/ # Built-in & custom user signatures
│   └── src/reporting/  # JSON, CSV, TXT, PDF-ready exporters
├── shared/             # Shared data models & JSON schemas (Rust)
├── cli/                # Command-line utility (Rust + clap)
├── apps/desktop/       # Desktop application
│   ├── src/            # React + TypeScript + Vite + Tailwind UI
│   └── src-tauri/      # Tauri 2 native bridge + ADB manager + SQLite
├── tests/              # Automated unit tests and synthetic APK fixtures
└── docs/               # Complete architecture & API documentation
```

---

## Security & Privacy

- **100% Offline-First**: No binaries, code, or telemetry are ever uploaded or transmitted externally.
- **Safe Inspection**: APKs are parsed strictly as read-only ZIP archives in memory. Code is never executed.
- **Path Traversal Protection**: All extraction and file access is sandboxed to user-configured directories.
