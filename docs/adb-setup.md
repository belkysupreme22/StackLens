# Android Debug Bridge (ADB) Setup Guide

StackLens integrates directly with ADB to discover connected devices, enumerate installed application packages, and pull APK binaries for offline inspection.

## Prerequisites

Install Android SDK Platform-Tools:
- **macOS (Homebrew)**: `brew install android-platform-tools`
- **Linux (Ubuntu/Debian)**: `sudo apt-get install adb`
- **Windows**: Download Android SDK Platform-Tools zip from Google and add to System PATH.

## Connecting Devices

1. Enable Developer Options: **Settings > About Phone > Tap 'Build Number' 7 times**.
2. Enable USB Debugging in Developer Options.
3. Connect your Android device via a USB data cable.
4. Accept the RSA Key prompt on the device screen: **"Always allow from this computer"**.
5. Verify connection:
   ```bash
   adb devices -l
   ```
