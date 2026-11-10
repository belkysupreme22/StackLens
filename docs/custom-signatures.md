# Custom Signatures Guide

StackLens allows security researchers and developers to define custom detection signatures to identify internal, proprietary, or emerging frameworks.

## Signature JSON Format

```json
{
  "id": "sig-001",
  "name": "Acme Game Engine",
  "framework": "AcmeEngine",
  "enabled": true,
  "file_patterns": ["assets/acme/data.bin"],
  "native_lib_patterns": ["libacme.so", "libacme_core.so"],
  "asset_patterns": ["acme.config"],
  "class_patterns": ["com.acme.engine."],
  "manifest_patterns": ["com.acme.GameActivity"],
  "evidence_description": "Found Acme proprietary mobile game engine components",
  "evidence_type": "StrongIndicator"
}
```

Signatures can be managed directly in the **Custom Signatures** screen in the desktop application or persisted via SQLite.
