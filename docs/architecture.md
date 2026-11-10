# StackLens Architecture

## System Overview

StackLens is designed around a strictly decoupled, reusable detection engine written in pure Rust (`stacklens-engine`). The desktop application (`stacklens-desktop`) is built using Tauri 2, bridging the Rust engine with a React 18 + TypeScript frontend.

```text
┌────────────────────────────────────────────────────────┐
│              StackLens Desktop UI (React 18)           │
│  Dashboard • Device Manager • APK Inspector • Batch    │
│  Comparison • Framework Explorer • History • Settings   │
└──────────────────────────┬─────────────────────────────┘
                           │ Tauri 2 IPC
┌──────────────────────────┴─────────────────────────────┐
│          Desktop Native Layer (stacklens-desktop)       │
│  Tauri Commands • ADB Device Bridge • SQLite Storage   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────┴─────────────────────────────┐
│          Detection Engine Core (stacklens-engine)      │
│  APK Archive Parser • DEX String/Class Extractor       │
│  14 Framework Detectors • Evidence Scoring • Reporting │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────┴─────────────────────────────┐
│           Shared Data Models (stacklens-shared)         │
│  Enums • Serde Schemas • Framework Indicators Types     │
└────────────────────────────────────────────────────────┘
```

## Core Principles

1. **Decoupled Engine**: The detection engine has zero dependencies on Tauri or any graphical interface. It can be embedded in CLIs, web servers, or mobile backends.
2. **Deterministic Evidence**: No framework is reported as detected without concrete file paths, native symbols, or bytecode descriptors.
3. **In-Memory Safety**: APKs are parsed directly as read-only ZIP archives without extracting entire archives to disk.
4. **Offline Privacy**: No application code, telemetry, or metadata is ever transmitted externally.
