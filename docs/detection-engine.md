# Detection Engine Specification

The StackLens engine evaluates 14 framework technologies across 7 evidence tiers:

1. **FileStructure**: Direct archive directory hierarchies (e.g. `assets/bin/Data/`, `assets/www/`, `flutter_assets/`).
2. **NativeLibrary**: ELF `.so` shared objects located in ABI subdirectories (`lib/arm64-v8a/`, `lib/armeabi-v7a/`, `lib/x86_64/`).
3. **DexClass**: Dalvik executable class descriptors extracted from `classes*.dex` (e.g. `Lio/flutter/embedding/engine/FlutterEngine;`).
4. **Asset**: Distinct bundles and configuration files (e.g. `index.android.bundle`, `capacitor.config.json`, `Microsoft.Maui.dll`).
5. **Manifest**: Binary XML attributes, declared permissions, and activities.
6. **Resource**: Android compiled resource tables and layout types.
7. **RuntimeComponent**: Embedded virtual machine snapshots and engine markers.

## Confidence Calculation Formula

Scores are weighted according to evidentiary specificity:
- **Confirmed**: 1.0 (Unique, conclusive runtime binary such as `libflutter.so`)
- **Strong Indicator**: 0.8 (Compiled application bundle such as `index.android.bundle`)
- **Supporting**: 0.5 (Utility classes or configuration metadata)
- **Weak**: 0.2 (Heuristic string matching)
- **Conflicting**: -0.3 (Penalizes contradictory signatures, e.g. MAUI overriding Xamarin)

Scores are mapped into 4 confidence tiers:
- **High**: $\ge 0.85$
- **Medium**: $\ge 0.60$
- **Low**: $\ge 0.30$
- **Inconclusive**: $< 0.30$
