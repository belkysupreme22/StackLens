//! APK parser module for StackLens.
//!
//! Provides parsing and cataloging for Android APK packages:
//! - Manifest parsing ([`manifest`]): AndroidManifest.xml extraction, package metadata, permissions, activities
//! - DEX analysis ([`dex`]): String extraction, class descriptors, header verification
//! - Native library cataloging ([`native_libs`]): ABI architecture detection, framework purpose classification
//! - Resources & assets cataloging ([`resources`]): Asset listing, resource types, count

pub mod dex;
pub mod manifest;
pub mod native_libs;
pub mod resources;

pub use dex::*;
pub use manifest::*;
pub use native_libs::*;
pub use resources::*;

use crate::error::{EngineError, EngineResult};
use sha2::{Digest, Sha256};
use stacklens_shared::{
    ApkMetadata, ApkStructure, CertificateInfo, DexFileInfo, SigningInfo,
};
use std::io::{Read, Seek};
use zip::ZipArchive;

/// Complete result of parsing an APK archive.
#[derive(Debug, Clone)]
pub struct ParsedApk {
    /// High-level metadata extracted from AndroidManifest.xml and APK file properties.
    pub metadata: ApkMetadata,
    /// Structural overview of files, native libraries, assets, and resources in the APK.
    pub structure: ApkStructure,
    /// Full parsed details from AndroidManifest.xml.
    pub manifest: ManifestInfo,
    /// All string literals extracted from all DEX files in the APK.
    pub dex_strings: Vec<String>,
    /// All class names and descriptors extracted from the DEX files.
    pub dex_classes: Vec<String>,
    /// APK signing scheme and certificate information if present.
    pub signing_info: Option<SigningInfo>,
}

/// Parse an entire APK archive from a reader.
///
/// Analyzes `AndroidManifest.xml`, extracts classes and strings from all `classes*.dex` files,
/// catalogs native libraries under `lib/`, catalogs assets and resources, and inspects signing blocks.
pub fn parse_apk_archive<R: Read + Seek>(
    mut reader: R,
    filename: &str,
    file_size: u64,
) -> EngineResult<ParsedApk> {
    // 1. Inspect signing block before opening as ZIP
    let v2_v3_detected = check_apk_signing_block(&mut reader).unwrap_or(false);

    // 2. Open ZIP archive
    let mut archive = ZipArchive::new(reader).map_err(EngineError::ZipError)?;

    let total_entries = archive.len();
    let mut entry_names_and_sizes: Vec<(String, u64)> = Vec::with_capacity(total_entries);
    let mut manifest_bytes: Option<Vec<u8>> = None;
    let mut dex_files_data: Vec<(String, Vec<u8>)> = Vec::new();
    let mut v1_cert_bytes: Option<Vec<u8>> = None;

    for i in 0..total_entries {
        let mut file = archive.by_index(i).map_err(EngineError::ZipError)?;
        let name = file.name().to_string();
        let size = file.size();
        entry_names_and_sizes.push((name.clone(), size));

        let norm_name = name.replace('\\', "/");
        if norm_name == "AndroidManifest.xml" {
            let mut buf = Vec::with_capacity(size as usize);
            file.read_to_end(&mut buf).map_err(EngineError::IoError)?;
            manifest_bytes = Some(buf);
        } else if norm_name.starts_with("classes") && norm_name.ends_with(".dex") {
            let mut buf = Vec::with_capacity(size as usize);
            file.read_to_end(&mut buf).map_err(EngineError::IoError)?;
            dex_files_data.push((name, buf));
        } else if (norm_name.starts_with("META-INF/")
            && (norm_name.ends_with(".RSA")
                || norm_name.ends_with(".DSA")
                || norm_name.ends_with(".EC")))
            && v1_cert_bytes.is_none()
        {
            let mut buf = Vec::with_capacity(size as usize);
            file.read_to_end(&mut buf).map_err(EngineError::IoError)?;
            v1_cert_bytes = Some(buf);
        }
    }

    // 3. Parse manifest
    let manifest_info = if let Some(ref bytes) = manifest_bytes {
        manifest::parse_manifest(bytes)
    } else {
        ManifestInfo::default()
    };

    // 4. Parse DEX files
    let mut dex_files_info = Vec::new();
    let mut all_dex_strings = Vec::new();
    for (name, data) in dex_files_data {
        dex_files_info.push(DexFileInfo {
            name,
            size: data.len() as u64,
        });

        match dex::parse_dex_strings(&data) {
            Ok(strings) => {
                all_dex_strings.extend(strings);
            }
            Err(e) => {
                tracing::warn!("Failed to parse DEX strings: {}", e);
            }
        }
    }

    // Deduplicate DEX strings
    all_dex_strings.sort();
    all_dex_strings.dedup();
    let dex_classes = dex::extract_class_names(&all_dex_strings);

    // 5. Catalog native libraries
    let native_libraries = native_libs::catalog_native_libs(&entry_names_and_sizes);

    // 6. Catalog resources and assets
    let file_names: Vec<String> = entry_names_and_sizes.iter().map(|(n, _)| n.clone()).collect();
    let res_info = resources::catalog_resources(&file_names);

    // 7. Determine signing information
    let signing_info = create_signing_info(v1_cert_bytes, v2_v3_detected);

    // 8. Build ApkMetadata
    let metadata = ApkMetadata {
        filename: filename.to_string(),
        file_size,
        package_name: manifest_info.package_name.clone(),
        app_label: None,
        version_name: manifest_info.version_name.clone(),
        version_code: manifest_info.version_code,
        min_sdk: manifest_info.min_sdk,
        target_sdk: manifest_info.target_sdk,
        permissions: manifest_info.permissions.clone(),
        main_activity: manifest_info.main_activity.clone(),
        is_split_apk: manifest_info.is_split_apk,
        split_name: manifest_info.split_name.clone(),
    };

    // 9. Build ApkStructure
    let structure = ApkStructure {
        dex_files: dex_files_info,
        native_libraries,
        assets: res_info.assets,
        resource_count: res_info.resource_count,
        resource_types: res_info.resource_types,
        total_entries,
    };

    Ok(ParsedApk {
        metadata,
        structure,
        manifest: manifest_info,
        dex_strings: all_dex_strings,
        dex_classes,
        signing_info,
    })
}

/// Check for the presence of the APK Signing Block (used by APK Signature Scheme v2, v3, and v4).
///
/// Scans the end of the file preceding the ZIP Central Directory for the 16-byte magic:
/// `APK Sig Block 42` (0x32 0x34 0x20 0x6b 0x63 0x6f 0x6c 0x42 0x20 0x67 0x69 0x53 0x20 0x4b 0x50 0x41).
fn check_apk_signing_block<R: Read + Seek>(reader: &mut R) -> std::io::Result<bool> {
    let file_len = reader.seek(std::io::SeekFrom::End(0))?;
    if file_len < 32 {
        return Ok(false);
    }

    // Read up to 64KB from the end of the file to scan for the APK Sig Block magic
    let read_len = std::cmp::min(file_len, 65536) as usize;
    reader.seek(std::io::SeekFrom::End(-(read_len as i64)))?;
    let mut tail = vec![0u8; read_len];
    reader.read_exact(&mut tail)?;

    let magic = b"APK Sig Block 42";
    let found = tail.windows(magic.len()).any(|w| w == magic);
    Ok(found)
}

/// Create [`SigningInfo`] based on detected v1 signature files and v2/v3 signing blocks.
fn create_signing_info(v1_cert: Option<Vec<u8>>, v2_v3: bool) -> Option<SigningInfo> {
    let mut scheme_parts = Vec::new();
    if v1_cert.is_some() {
        scheme_parts.push("v1 (JAR)");
    }
    if v2_v3 {
        scheme_parts.push("v2/v3");
    }

    if scheme_parts.is_empty() {
        return None;
    }

    let scheme_str = scheme_parts.join(" + ");
    let mut certificates = Vec::new();

    if let Some(cert_data) = v1_cert {
        let mut hasher = Sha256::new();
        hasher.update(&cert_data);
        let hash = hasher.finalize();
        let fingerprint = hex::encode(hash);

        certificates.push(CertificateInfo {
            subject: None,
            issuer: None,
            fingerprint_sha256: Some(fingerprint),
            valid_from: None,
            valid_to: None,
        });
    }

    Some(SigningInfo {
        scheme: Some(scheme_str),
        certificates,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;
    use zip::write::{SimpleFileOptions, ZipWriter};

    #[test]
    fn test_parse_apk_archive_in_memory() {
        let mut buf = Vec::new();
        {
            let mut writer = ZipWriter::new(Cursor::new(&mut buf));
            let options = SimpleFileOptions::default();

            // 1. AndroidManifest.xml
            writer.start_file("AndroidManifest.xml", options).unwrap();
            let manifest_content = b"package=\"com.test.app\" android.permission.INTERNET com.test.app.MainActivity";
            std::io::Write::write_all(&mut writer, manifest_content).unwrap();

            // 2. Native lib
            writer.start_file("lib/arm64-v8a/libflutter.so", options).unwrap();
            std::io::Write::write_all(&mut writer, b"\x7fELF").unwrap();

            // 3. Asset
            writer.start_file("assets/flutter_assets/kernel_blob.bin", options).unwrap();
            std::io::Write::write_all(&mut writer, b"bin").unwrap();

            // 4. Resource
            writer.start_file("res/layout/activity_main.xml", options).unwrap();
            std::io::Write::write_all(&mut writer, b"<xml>").unwrap();

            writer.finish().unwrap();
        }

        let total_size = buf.len() as u64;
        let parsed = parse_apk_archive(Cursor::new(buf), "test.apk", total_size)
            .expect("parse_apk_archive should succeed");

        assert_eq!(parsed.metadata.filename, "test.apk");
        assert_eq!(parsed.metadata.package_name.as_deref(), Some("com.test.app"));
        assert!(parsed.metadata.permissions.contains(&"android.permission.INTERNET".to_string()));
        assert_eq!(parsed.structure.native_libraries.len(), 1);
        assert_eq!(parsed.structure.native_libraries[0].name, "libflutter.so");
        assert_eq!(parsed.structure.native_libraries[0].arch, "arm64-v8a");
        assert_eq!(
            parsed.structure.native_libraries[0].purpose.as_deref(),
            Some("Flutter engine")
        );
        assert_eq!(parsed.structure.assets.len(), 1);
        assert_eq!(parsed.structure.resource_count, 1);
    }
}
