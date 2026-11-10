# Contributing to StackLens

Thank you for your interest in contributing to StackLens!

## Project Architecture

StackLens is split into a standalone detection engine and a desktop application:

- `engine/`: Standalone Rust crate for reverse-engineering and framework detection.
- `shared/`: Shared Rust data types and schemas across the engine, desktop app, and CLI.
- `cli/`: Command-line interface for headless execution and scripting.
- `apps/desktop/`: Tauri 2 desktop application (React 18 + TypeScript + Tailwind CSS).
- `tests/`: Automated unit tests and synthetic APK test fixtures.
- `docs/`: Technical guides, ADB setup, and API specifications.

## How to Add a New Framework Detector

1. Add the new framework variant to `Framework` enum in `shared/src/types.rs`.
2. Create a new detector file in `engine/src/detectors/<framework>.rs`.
3. Implement the `Detector` trait:
   ```rust
   pub struct MyFrameworkDetector;

   impl Detector for MyFrameworkDetector {
       fn name(&self) -> &str {
           "MyFramework"
       }

       fn detect(&self, ctx: &DetectionContext) -> FrameworkDetection {
           // Collect evidence items...
       }
   }
   ```
4. Register the detector in `engine/src/detectors/mod.rs` inside `default_detectors()`.
5. Add a unit test verifying detection scoring.

## Running Tests

Verify engine tests:
```bash
cargo test --workspace
```

Verify the frontend build:
```bash
cd apps/desktop
npm run build
```

## Pull Request Guidelines

- Ensure `cargo test --workspace` passes before opening a PR.
- Add evidence-backed indicators rather than guessing frameworks.
- Keep commits focused and provide clear descriptions.
