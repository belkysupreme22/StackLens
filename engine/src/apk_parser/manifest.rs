//! AndroidManifest.xml parser.
//!
//! Provides parsing for Android's binary XML format with heuristic fallbacks
//! to extract package metadata, SDK versions, permissions, activities, and strings.

use serde::{Deserialize, Serialize};
use std::collections::HashSet;

/// Parsed metadata from `AndroidManifest.xml`.
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct ManifestInfo {
    /// The Android package name (e.g., "com.example.app").
    pub package_name: Option<String>,
    /// The human-readable version string (e.g., "1.0.3").
    pub version_name: Option<String>,
    /// The internal integer version code (e.g., 42).
    pub version_code: Option<u64>,
    /// Minimum SDK level required by the application (e.g., 21).
    pub min_sdk: Option<u32>,
    /// Target SDK level the application was compiled against (e.g., 34).
    pub target_sdk: Option<u32>,
    /// Declared Android permissions (e.g., "android.permission.INTERNET").
    pub permissions: Vec<String>,
    /// Declared activity classes in the manifest.
    pub activities: Vec<String>,
    /// The primary launcher activity, if found.
    pub main_activity: Option<String>,
    /// Whether this APK is a split APK (feature or configuration split).
    pub is_split_apk: bool,
    /// The split name if this is a split APK.
    pub split_name: Option<String>,
    /// All extracted strings from the binary manifest string pool and byte scan.
    pub all_strings: Vec<String>,
}

// Android binary XML chunk types
#[allow(dead_code)]
const RES_NULL_TYPE: u16 = 0x0000;
const RES_STRING_POOL_TYPE: u16 = 0x0001;
const RES_XML_TYPE: u16 = 0x0003;
#[allow(dead_code)]
const RES_XML_START_NAMESPACE_TYPE: u16 = 0x0100;
#[allow(dead_code)]
const RES_XML_END_NAMESPACE_TYPE: u16 = 0x0101;
const RES_XML_START_ELEMENT_TYPE: u16 = 0x0102;
const RES_XML_END_ELEMENT_TYPE: u16 = 0x0103;
#[allow(dead_code)]
const RES_XML_CDATA_TYPE: u16 = 0x0104;
const RES_XML_RESOURCE_MAP_TYPE: u16 = 0x0180;

// Android resource ID constants for common manifest attributes
#[allow(dead_code)]
const ATTR_LABEL: u32 = 0x01010001;
const ATTR_NAME: u32 = 0x01010003;
const ATTR_VERSION_CODE: u32 = 0x0101001b;
const ATTR_MIN_SDK_VERSION: u32 = 0x01010020;
const ATTR_TARGET_SDK_VERSION: u32 = 0x01010021;
const ATTR_VERSION_NAME: u32 = 0x0101002b;
const ATTR_PACKAGE: u32 = 0x0101000c;
const ATTR_SPLIT: u32 = 0x01010547;

// Typed value data types
const TYPE_STRING: u8 = 0x03;
const TYPE_INT_DEC: u8 = 0x10;
const TYPE_INT_HEX: u8 = 0x11;
#[allow(dead_code)]
const TYPE_INT_BOOLEAN: u8 = 0x12;

/// Parse AndroidManifest.xml bytes into [`ManifestInfo`].
///
/// Handles binary XML format (AXML) as well as raw byte and UTF-16LE string
/// heuristic extraction for resilience against corrupted or unusual manifests.
pub fn parse_manifest(data: &[u8]) -> ManifestInfo {
    let mut info = ManifestInfo::default();

    if data.is_empty() {
        return info;
    }

    // Try structured binary XML parsing first
    let _axml_success = parse_axml(data, &mut info);

    // Heuristics scanning for UTF-8 and UTF-16LE strings across the raw bytes
    let scanned_strings = scan_strings(data);

    // Merge scanned strings into all_strings, preserving order and avoiding duplicates
    let mut existing_set: HashSet<String> = info.all_strings.iter().cloned().collect();
    for s in scanned_strings {
        if !existing_set.contains(&s) {
            existing_set.insert(s.clone());
            info.all_strings.push(s);
        }
    }

    // Apply heuristic fallbacks for any missing fields
    apply_heuristics(&mut info, data);

    info
}

/// Parse structured Android Binary XML.
fn parse_axml(data: &[u8], info: &mut ManifestInfo) -> bool {
    if data.len() < 8 {
        return false;
    }

    let file_magic = u16_at(data, 0);
    let header_size = u16_at(data, 2) as usize;
    if file_magic != RES_XML_TYPE || header_size < 8 {
        return false;
    }

    let mut string_pool: Vec<String> = Vec::new();
    let mut res_ids: Vec<u32> = Vec::new();
    let mut offset = header_size;

    let mut current_element_stack: Vec<String> = Vec::new();
    let mut current_activity: Option<String> = None;
    let mut current_activity_has_main = false;
    let mut current_activity_has_launcher = false;

    while offset + 8 <= data.len() {
        let chunk_type = u16_at(data, offset);
        let chunk_header_size = u16_at(data, offset + 2) as usize;
        let chunk_size = u32_at(data, offset + 4) as usize;

        if chunk_size == 0 || offset + chunk_size > data.len() {
            // Reached invalid or truncated chunk
            break;
        }

        match chunk_type {
            RES_STRING_POOL_TYPE => {
                if let Some(pool) = parse_string_pool(&data[offset..offset + chunk_size]) {
                    string_pool = pool;
                }
            }
            RES_XML_RESOURCE_MAP_TYPE => {
                if chunk_header_size <= chunk_size {
                    let map_bytes = &data[offset + chunk_header_size..offset + chunk_size];
                    let id_count = map_bytes.len() / 4;
                    res_ids.clear();
                    for i in 0..id_count {
                        res_ids.push(u32_at(map_bytes, i * 4));
                    }
                }
            }
            RES_XML_START_ELEMENT_TYPE => {
                if offset + 30 <= data.len() {
                    let _ns_index = u32_at(data, offset + 16) as usize;
                    let name_index = u32_at(data, offset + 20) as usize;
                    let tag_name = string_pool.get(name_index).cloned().unwrap_or_default();
                    current_element_stack.push(tag_name.clone());

                    if tag_name == "activity" || tag_name == "activity-alias" {
                        current_activity = None;
                        current_activity_has_main = false;
                        current_activity_has_launcher = false;
                    }

                    // Parse attributes
                    let attr_start = u16_at(data, offset + 24) as usize;
                    let attr_size = u16_at(data, offset + 26) as usize;
                    let attr_count = u16_at(data, offset + 28) as usize;

                    let mut attr_offset = offset + 16 + attr_start;
                    for _ in 0..attr_count {
                        if attr_offset + 20 > offset + chunk_size {
                            break;
                        }

                            let _ns_idx = u32_at(data, attr_offset) as usize;
                            let name_idx = u32_at(data, attr_offset + 4) as usize;
                            let raw_val_idx = u32_at(data, attr_offset + 8);
                            let _typed_size = u16_at(data, attr_offset + 12);
                            let _res0 = data[attr_offset + 14];
                            let data_type = data[attr_offset + 15];
                            let typed_data = u32_at(data, attr_offset + 16);

                            let attr_name = string_pool.get(name_idx).cloned().unwrap_or_default();
                            let res_id = if name_idx < res_ids.len() {
                                res_ids[name_idx]
                            } else {
                                0
                            };

                            let str_val = if raw_val_idx != 0xFFFFFFFF {
                                string_pool.get(raw_val_idx as usize).cloned()
                            } else if data_type == TYPE_STRING {
                                string_pool.get(typed_data as usize).cloned()
                            } else {
                                None
                            };

                            match tag_name.as_str() {
                                "manifest" => {
                                    if attr_name == "package" || res_id == ATTR_PACKAGE {
                                        if let Some(pkg) = &str_val {
                                            if !pkg.is_empty() {
                                                info.package_name = Some(pkg.clone());
                                            }
                                        }
                                    }
                                    if attr_name == "versionCode" || res_id == ATTR_VERSION_CODE {
                                        if data_type == TYPE_INT_DEC || data_type == TYPE_INT_HEX {
                                            info.version_code = Some(typed_data as u64);
                                        } else if let Some(ref s) = str_val {
                                            if let Ok(v) = s.parse::<u64>() {
                                                info.version_code = Some(v);
                                            }
                                        }
                                    }
                                    if attr_name == "versionName" || res_id == ATTR_VERSION_NAME {
                                        if let Some(v) = &str_val {
                                            info.version_name = Some(v.clone());
                                        }
                                    }
                                    if attr_name == "split" || res_id == ATTR_SPLIT {
                                        info.is_split_apk = true;
                                        if let Some(s) = &str_val {
                                            info.split_name = Some(s.clone());
                                        }
                                    }
                                }
                                "uses-sdk" => {
                                    if attr_name == "minSdkVersion" || res_id == ATTR_MIN_SDK_VERSION {
                                        if data_type == TYPE_INT_DEC || data_type == TYPE_INT_HEX {
                                            info.min_sdk = Some(typed_data);
                                        } else if let Some(ref s) = str_val {
                                            if let Ok(v) = s.parse::<u32>() {
                                                info.min_sdk = Some(v);
                                            }
                                        }
                                    }
                                    if attr_name == "targetSdkVersion" || res_id == ATTR_TARGET_SDK_VERSION {
                                        if data_type == TYPE_INT_DEC || data_type == TYPE_INT_HEX {
                                            info.target_sdk = Some(typed_data);
                                        } else if let Some(ref s) = str_val {
                                            if let Ok(v) = s.parse::<u32>() {
                                                info.target_sdk = Some(v);
                                            }
                                        }
                                    }
                                }
                                "uses-permission" => {
                                    if attr_name == "name" || res_id == ATTR_NAME {
                                        if let Some(p) = str_val {
                                            if !p.is_empty() && !info.permissions.contains(&p) {
                                                info.permissions.push(p);
                                            }
                                        }
                                    }
                                }
                                "activity" | "activity-alias" => {
                                    if attr_name == "name" || res_id == ATTR_NAME {
                                        if let Some(act) = str_val {
                                            let full_name = normalize_component_name(
                                                &act,
                                                info.package_name.as_deref().unwrap_or(""),
                                            );
                                            current_activity = Some(full_name.clone());
                                            if !info.activities.contains(&full_name) {
                                                info.activities.push(full_name);
                                            }
                                        }
                                    }
                                }
                                "action" => {
                                    if attr_name == "name" || res_id == ATTR_NAME {
                                        if let Some(act) = &str_val {
                                            if act == "android.intent.action.MAIN" {
                                                current_activity_has_main = true;
                                            }
                                        }
                                    }
                                }
                                "category" => {
                                    if attr_name == "name" || res_id == ATTR_NAME {
                                        if let Some(cat) = &str_val {
                                            if cat == "android.intent.category.LAUNCHER" {
                                                current_activity_has_launcher = true;
                                            }
                                        }
                                    }
                                }
                                _ => {}
                            }

                            attr_offset += if attr_size >= 20 { attr_size } else { 20 };
                        }
                }
            }
            RES_XML_END_ELEMENT_TYPE => {
                if let Some(popped) = current_element_stack.pop() {
                    if (popped == "activity" || popped == "activity-alias")
                        && current_activity_has_main
                        && current_activity_has_launcher
                    {
                        if let Some(ref act) = current_activity {
                            if info.main_activity.is_none() {
                                info.main_activity = Some(act.clone());
                            }
                        }
                    }
                }
            }
            _ => {}
        }

        offset += chunk_size;
    }

    info.all_strings = string_pool;
    true
}

/// Parse string pool chunk from Android binary format.
fn parse_string_pool(pool_data: &[u8]) -> Option<Vec<String>> {
    if pool_data.len() < 28 {
        return None;
    }

    let string_count = u32_at(pool_data, 8) as usize;
    let flags = u32_at(pool_data, 16);
    let strings_start = u32_at(pool_data, 20) as usize;
    let is_utf8 = (flags & (1 << 8)) != 0;

    let offsets_end = 28 + string_count * 4;
    if offsets_end > pool_data.len() || strings_start > pool_data.len() {
        return None;
    }

    let mut string_offsets = Vec::with_capacity(string_count);
    for i in 0..string_count {
        string_offsets.push(u32_at(pool_data, 28 + i * 4) as usize);
    }

    let mut strings = Vec::with_capacity(string_count);
    let data_section = &pool_data[strings_start..];

    for off in string_offsets {
        if off >= data_section.len() {
            strings.push(String::new());
            continue;
        }

        let slice = &data_section[off..];
        let s = if is_utf8 {
            decode_pool_utf8(slice)
        } else {
            decode_pool_utf16(slice)
        };
        strings.push(s);
    }

    Some(strings)
}

/// Decode a UTF-8 string from the Android binary XML string pool.
fn decode_pool_utf8(slice: &[u8]) -> String {
    if slice.is_empty() {
        return String::new();
    }
    let mut cur = 0;
    // Skip UTF-16 character length (1 or 2 bytes)
    if cur < slice.len() {
        if (slice[cur] & 0x80) != 0 {
            cur += 2;
        } else {
            cur += 1;
        }
    }
    // Read UTF-8 byte length (1 or 2 bytes)
    let mut byte_len = 0usize;
    if cur < slice.len() {
        if (slice[cur] & 0x80) != 0 {
            if cur + 1 < slice.len() {
                byte_len = (((slice[cur] & 0x7f) as usize) << 8) | (slice[cur + 1] as usize);
                cur += 2;
            }
        } else {
            byte_len = slice[cur] as usize;
            cur += 1;
        }
    }

    if cur + byte_len <= slice.len() {
        String::from_utf8_lossy(&slice[cur..cur + byte_len]).to_string()
    } else {
        // Fallback: read until null byte
        let null_pos = slice[cur..].iter().position(|&b| b == 0).unwrap_or(slice.len() - cur);
        String::from_utf8_lossy(&slice[cur..cur + null_pos]).to_string()
    }
}

/// Decode a UTF-16LE string from the Android binary XML string pool.
fn decode_pool_utf16(slice: &[u8]) -> String {
    if slice.len() < 2 {
        return String::new();
    }
    let mut cur = 0;
    // Read char length (1 or 2 u16s)
    let first_u16 = u16_at(slice, 0) as usize;
    let char_len = if (first_u16 & 0x8000) != 0 {
        cur += 4;
        if slice.len() >= 4 {
            let second_u16 = u16_at(slice, 2) as usize;
            ((first_u16 & 0x7fff) << 16) | second_u16
        } else {
            0
        }
    } else {
        cur += 2;
        first_u16
    };

    let byte_len = char_len * 2;
    if cur + byte_len <= slice.len() {
        let u16_units: Vec<u16> = (0..char_len)
            .map(|i| u16_at(slice, cur + i * 2))
            .collect();
        String::from_utf16_lossy(&u16_units)
    } else {
        // Fallback: read until 0x0000
        let mut u16_units = Vec::new();
        while cur + 1 < slice.len() {
            let val = u16_at(slice, cur);
            if val == 0 {
                break;
            }
            u16_units.push(val);
            cur += 2;
        }
        String::from_utf16_lossy(&u16_units)
    }
}

/// Scan raw byte data for UTF-8 and UTF-16LE strings and constituent tokens.
pub fn scan_strings(data: &[u8]) -> Vec<String> {
    let mut results = Vec::new();

    // 1. Scan UTF-16LE strings (sequence of `[ascii, 0]`)
    let mut i = 0;
    while i + 1 < data.len() {
        if is_printable_ascii(data[i]) && data[i + 1] == 0 {
            let mut u16_chars = Vec::new();
            while i + 1 < data.len() && is_printable_ascii(data[i]) && data[i + 1] == 0 {
                u16_chars.push(data[i] as u16);
                i += 2;
            }
            if u16_chars.len() >= 3 {
                if let Ok(s) = String::from_utf16(&u16_chars) {
                    let trimmed = s.trim();
                    if !trimmed.is_empty() {
                        add_string_and_tokens(&mut results, trimmed);
                    }
                }
            }
        } else {
            i += 1;
        }
    }

    // 2. Scan UTF-8 / ASCII strings (runs of printable characters)
    let mut j = 0;
    while j < data.len() {
        if is_printable_ascii(data[j]) {
            let start = j;
            while j < data.len() && is_printable_ascii(data[j]) {
                j += 1;
            }
            if j - start >= 3 {
                let s = String::from_utf8_lossy(&data[start..j]).trim().to_string();
                if !s.is_empty() {
                    add_string_and_tokens(&mut results, &s);
                }
            }
        } else {
            j += 1;
        }
    }

    results
}

fn add_string_and_tokens(results: &mut Vec<String>, s: &str) {
    if !results.contains(&s.to_string()) {
        results.push(s.to_string());
    }
    // Tokenize on whitespace, quotes, angles, equals, commas, semicolons
    for token in s.split(|c: char| {
        c.is_whitespace() || c == '"' || c == '\'' || c == '=' || c == '<' || c == '>' || c == ';' || c == ','
    }) {
        let trimmed = token.trim();
        if trimmed.len() >= 3 && !results.contains(&trimmed.to_string()) {
            results.push(trimmed.to_string());
        }
    }
}

fn is_printable_ascii(b: u8) -> bool {
    (0x20..=0x7E).contains(&b)
}

/// Normalize an activity component name (e.g., ".MainActivity" -> "com.example.MainActivity").
fn normalize_component_name(activity_name: &str, package_name: &str) -> String {
    if activity_name.starts_with('.') {
        format!("{}{}", package_name, activity_name)
    } else if !activity_name.contains('.') && !package_name.is_empty() {
        format!("{}.{}", package_name, activity_name)
    } else {
        activity_name.to_string()
    }
}

/// Apply heuristics to extract or refine manifest metadata from all available strings and bytes.
fn apply_heuristics(info: &mut ManifestInfo, raw_data: &[u8]) {
    // 1. Permissions scan: look for android.permission.* or custom *.permission.*
    for s in &info.all_strings {
        if s.starts_with("android.permission.") {
            let clean = clean_identifier(s);
            if !info.permissions.contains(&clean) {
                info.permissions.push(clean);
            }
        } else if let Some(idx) = s.find("android.permission.") {
            let clean = clean_identifier(&s[idx..]);
            if !info.permissions.contains(&clean) {
                info.permissions.push(clean);
            }
        }
    }

    // 2. Activities scan
    for s in &info.all_strings {
        if (s.ends_with("Activity") || s.contains(".Activity"))
            && looks_like_class_name(s)
            && !info.activities.contains(s)
        {
            let normalized = normalize_component_name(s, info.package_name.as_deref().unwrap_or(""));
            if !info.activities.contains(&normalized) {
                info.activities.push(normalized);
            }
        }
    }

    // 3. Main activity selection
    if info.main_activity.is_none() && !info.activities.is_empty() {
        // Look for typical main activity names
        if let Some(main) = info
            .activities
            .iter()
            .find(|a| a.ends_with("MainActivity") || a.ends_with(".Main"))
            .cloned()
        {
            info.main_activity = Some(main);
        } else {
            info.main_activity = info.activities.first().cloned();
        }
    }

    // 4. Package name heuristic scan if not already found
    if info.package_name.is_none() {
        info.package_name = find_package_name_in_bytes(raw_data)
            .or_else(|| find_package_name_in_strings(&info.all_strings));
    }

    // 5. Min / Target SDK versions scan if not found
    if info.min_sdk.is_none() {
        info.min_sdk = find_sdk_near_keyword(&info.all_strings, "minSdkVersion");
    }
    if info.target_sdk.is_none() {
        info.target_sdk = find_sdk_near_keyword(&info.all_strings, "targetSdkVersion");
    }

    // 6. Split APK check
    if !info.is_split_apk {
        for s in &info.all_strings {
            if s.starts_with("config.") || s.starts_with("split_") || s.contains(".split.") {
                info.is_split_apk = true;
                if info.split_name.is_none() {
                    info.split_name = Some(s.clone());
                }
                break;
            }
        }
    }
}

/// Clean permission or identifier of any trailing punctuation.
fn clean_identifier(s: &str) -> String {
    let mut end = 0;
    for (i, c) in s.char_indices() {
        if c.is_ascii_alphanumeric() || c == '.' || c == '_' {
            end = i + c.len_utf8();
        } else {
            break;
        }
    }
    s[..end].to_string()
}

/// Find package name by looking for UTF-16LE / UTF-8 "package" attribute keyword followed by a package name.
fn find_package_name_in_bytes(raw_data: &[u8]) -> Option<String> {
    // Look for UTF-16LE "package" -> [b'p', 0, b'a', 0, b'c', 0, b'k', 0, b'a', 0, b'g', 0, b'e', 0]
    let pkg_u16 = [
        b'p', 0, b'a', 0, b'c', 0, b'k', 0, b'a', 0, b'g', 0, b'e', 0,
    ];
    if let Some(pos) = raw_data.windows(pkg_u16.len()).position(|w| w == pkg_u16) {
        // Search subsequent 500 bytes for a package name
        let scan_region = &raw_data[pos..std::cmp::min(raw_data.len(), pos + 500)];
        let strings = scan_strings(scan_region);
        for s in strings {
            if is_valid_package_name(&s) {
                return Some(s);
            }
        }
    }

    // Fallback: look for UTF-8 "package="
    if let Some(pos) = raw_data.windows(8).position(|w| w == b"package=") {
        let scan_region = &raw_data[pos..std::cmp::min(raw_data.len(), pos + 256)];
        let s = String::from_utf8_lossy(scan_region);
        if let Some(start) = s.find('"') {
            if let Some(end) = s[start + 1..].find('"') {
                let candidate = &s[start + 1..start + 1 + end];
                if is_valid_package_name(candidate) {
                    return Some(candidate.to_string());
                }
            }
        }
    }

    None
}

/// Find package name among extracted strings.
fn find_package_name_in_strings(strings: &[String]) -> Option<String> {
    for s in strings {
        if is_valid_package_name(s) {
            return Some(s.clone());
        }
    }
    None
}

/// Check if a string looks like a valid Java package name.
fn is_valid_package_name(s: &str) -> bool {
    if !s.contains('.') || s.len() < 3 || s.len() > 120 {
        return false;
    }
    // Reject common URIs, namespaces, or file paths
    if s.starts_with("http")
        || s.starts_with("xmlns")
        || s.starts_with("schema")
        || s.starts_with("android.")
        || s.ends_with(".xml")
        || s.ends_with(".png")
        || s.ends_with(".so")
        || s.contains('/')
        || s.contains('\\')
    {
        return false;
    }

    let parts: Vec<&str> = s.split('.').collect();
    if parts.len() < 2 {
        return false;
    }

    for part in parts {
        if part.is_empty() {
            return false;
        }
        let mut chars = part.chars();
        let first = chars.next().unwrap();
        if !first.is_ascii_alphabetic() && first != '_' {
            return false;
        }
        if !chars.all(|c| c.is_ascii_alphanumeric() || c == '_') {
            return false;
        }
    }

    true
}

/// Check if a string looks like a Java class name.
fn looks_like_class_name(s: &str) -> bool {
    if s.len() < 3 || s.contains(' ') || s.contains('/') || s.contains('\\') {
        return false;
    }
    s.chars().all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '$' || c == '_')
}

/// Look for an integer SDK version near a keyword like "minSdkVersion" or "targetSdkVersion".
fn find_sdk_near_keyword(strings: &[String], keyword: &str) -> Option<u32> {
    let pos = strings.iter().position(|s| s.contains(keyword))?;
    let start = pos.saturating_sub(5);
    let end = std::cmp::min(strings.len(), pos + 6);

    for s in &strings[start..end] {
        if let Ok(val) = s.parse::<u32>() {
            if (1..=36).contains(&val) {
                return Some(val);
            }
        }
    }

    None
}

#[inline]
fn u16_at(data: &[u8], offset: usize) -> u16 {
    if offset + 2 <= data.len() {
        u16::from_le_bytes([data[offset], data[offset + 1]])
    } else {
        0
    }
}

#[inline]
fn u32_at(data: &[u8], offset: usize) -> u32 {
    if offset + 4 <= data.len() {
        u32::from_le_bytes([
            data[offset],
            data[offset + 1],
            data[offset + 2],
            data[offset + 3],
        ])
    } else {
        0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_manifest() {
        let info = parse_manifest(&[]);
        assert_eq!(info.package_name, None);
        assert!(info.permissions.is_empty());
        assert!(info.all_strings.is_empty());
    }

    #[test]
    fn test_heuristic_utf8_scan() {
        let fake_data = b"package=\"com.example.myapp\" some text android.permission.INTERNET and android.permission.CAMERA com.example.myapp.MainActivity";
        let info = parse_manifest(fake_data);
        assert_eq!(info.package_name.as_deref(), Some("com.example.myapp"));
        assert!(info.permissions.contains(&"android.permission.INTERNET".to_string()));
        assert!(info.permissions.contains(&"android.permission.CAMERA".to_string()));
        assert!(info.activities.contains(&"com.example.myapp.MainActivity".to_string()));
        assert_eq!(info.main_activity.as_deref(), Some("com.example.myapp.MainActivity"));
    }

    #[test]
    fn test_heuristic_utf16le_scan() {
        // Construct UTF-16LE encoded string: "com.test.app" and "android.permission.RECORD_AUDIO"
        let mut data = Vec::new();
        for &c in b"package" {
            data.push(c);
            data.push(0);
        }
        for &c in b" " {
            data.push(c);
            data.push(0);
        }
        for &c in b"com.test.app" {
            data.push(c);
            data.push(0);
        }
        for &c in b" " {
            data.push(c);
            data.push(0);
        }
        for &c in b"android.permission.RECORD_AUDIO" {
            data.push(c);
            data.push(0);
        }

        let info = parse_manifest(&data);
        assert_eq!(info.package_name.as_deref(), Some("com.test.app"));
        assert!(info.permissions.contains(&"android.permission.RECORD_AUDIO".to_string()));
    }

    #[test]
    fn test_is_valid_package_name() {
        assert!(is_valid_package_name("com.example.app"));
        assert!(is_valid_package_name("io.flutter.demo"));
        assert!(!is_valid_package_name("android.permission.INTERNET"));
        assert!(!is_valid_package_name("com"));
        assert!(!is_valid_package_name("http://schemas.android.com"));
    }

    #[test]
    fn test_axml_structured_manifest() {
        let mut axml = Vec::new();

        // 1. File Header (8 bytes)
        axml.extend_from_slice(&0x0003u16.to_le_bytes()); // RES_XML_TYPE
        axml.extend_from_slice(&8u16.to_le_bytes());
        let total_size_pos = axml.len();
        axml.extend_from_slice(&0u32.to_le_bytes()); // placeholder

        // 2. String Pool
        let str_list = vec![
            "manifest",
            "package",
            "com.example.axmlapp",
            "versionCode",
            "versionName",
            "2.1.0",
            "split",
            "split_feature",
            "uses-sdk",
            "minSdkVersion",
            "targetSdkVersion",
        ];

        let pool_start = axml.len();
        axml.extend_from_slice(&0x0001u16.to_le_bytes()); // RES_STRING_POOL_TYPE
        axml.extend_from_slice(&28u16.to_le_bytes());
        let pool_size_pos = axml.len();
        axml.extend_from_slice(&0u32.to_le_bytes());
        axml.extend_from_slice(&(str_list.len() as u32).to_le_bytes());
        axml.extend_from_slice(&0u32.to_le_bytes());
        axml.extend_from_slice(&0x00000100u32.to_le_bytes()); // flags: UTF-8

        let offsets_start = 28;
        let strings_start = offsets_start + str_list.len() * 4;
        axml.extend_from_slice(&(strings_start as u32).to_le_bytes());
        axml.extend_from_slice(&0u32.to_le_bytes());

        let mut string_data = Vec::new();
        let mut offsets = Vec::new();

        for s in &str_list {
            offsets.push(string_data.len() as u32);
            let bytes = s.as_bytes();
            string_data.push(bytes.len() as u8);
            string_data.push(bytes.len() as u8);
            string_data.extend_from_slice(bytes);
            string_data.push(0);
        }

        for off in offsets {
            axml.extend_from_slice(&off.to_le_bytes());
        }
        axml.extend_from_slice(&string_data);

        while (axml.len() - pool_start) % 4 != 0 {
            axml.push(0);
        }
        let pool_chunk_size = (axml.len() - pool_start) as u32;
        axml[pool_size_pos..pool_size_pos + 4].copy_from_slice(&pool_chunk_size.to_le_bytes());

        // 3. Start Element: <manifest package="com.example.axmlapp" versionCode=42 versionName="2.1.0" split="split_feature">
        let elem_start = axml.len();
        axml.extend_from_slice(&0x0102u16.to_le_bytes()); // RES_XML_START_ELEMENT_TYPE
        axml.extend_from_slice(&16u16.to_le_bytes());
        let elem_size_pos = axml.len();
        axml.extend_from_slice(&0u32.to_le_bytes());
        axml.extend_from_slice(&1u32.to_le_bytes());
        axml.extend_from_slice(&0xFFFFFFFFu32.to_le_bytes());
        axml.extend_from_slice(&0xFFFFFFFFu32.to_le_bytes());
        axml.extend_from_slice(&0u32.to_le_bytes()); // name_index: 0 ("manifest")
        axml.extend_from_slice(&20u16.to_le_bytes()); // attr_start
        axml.extend_from_slice(&20u16.to_le_bytes()); // attr_size
        axml.extend_from_slice(&4u16.to_le_bytes()); // attr_count: 4
        axml.extend_from_slice(&0u16.to_le_bytes());
        axml.extend_from_slice(&0u16.to_le_bytes());
        axml.extend_from_slice(&0u16.to_le_bytes());

        // Attr 0: package="com.example.axmlapp"
        axml.extend_from_slice(&0xFFFFFFFFu32.to_le_bytes());
        axml.extend_from_slice(&1u32.to_le_bytes());
        axml.extend_from_slice(&2u32.to_le_bytes());
        axml.extend_from_slice(&8u16.to_le_bytes());
        axml.push(0);
        axml.push(TYPE_STRING);
        axml.extend_from_slice(&2u32.to_le_bytes());

        // Attr 1: versionCode=42
        axml.extend_from_slice(&0xFFFFFFFFu32.to_le_bytes());
        axml.extend_from_slice(&3u32.to_le_bytes());
        axml.extend_from_slice(&0xFFFFFFFFu32.to_le_bytes());
        axml.extend_from_slice(&8u16.to_le_bytes());
        axml.push(0);
        axml.push(TYPE_INT_DEC);
        axml.extend_from_slice(&42u32.to_le_bytes());

        // Attr 2: versionName="2.1.0"
        axml.extend_from_slice(&0xFFFFFFFFu32.to_le_bytes());
        axml.extend_from_slice(&4u32.to_le_bytes());
        axml.extend_from_slice(&5u32.to_le_bytes());
        axml.extend_from_slice(&8u16.to_le_bytes());
        axml.push(0);
        axml.push(TYPE_STRING);
        axml.extend_from_slice(&5u32.to_le_bytes());

        // Attr 3: split="split_feature"
        axml.extend_from_slice(&0xFFFFFFFFu32.to_le_bytes());
        axml.extend_from_slice(&6u32.to_le_bytes());
        axml.extend_from_slice(&7u32.to_le_bytes());
        axml.extend_from_slice(&8u16.to_le_bytes());
        axml.push(0);
        axml.push(TYPE_STRING);
        axml.extend_from_slice(&7u32.to_le_bytes());

        let elem_chunk_size = (axml.len() - elem_start) as u32;
        axml[elem_size_pos..elem_size_pos + 4].copy_from_slice(&elem_chunk_size.to_le_bytes());

        let total_file_size = axml.len() as u32;
        axml[total_size_pos..total_size_pos + 4].copy_from_slice(&total_file_size.to_le_bytes());

        let info = parse_manifest(&axml);
        assert_eq!(info.package_name.as_deref(), Some("com.example.axmlapp"));
        assert_eq!(info.version_code, Some(42));
        assert_eq!(info.version_name.as_deref(), Some("2.1.0"));
        assert!(info.is_split_apk);
        assert_eq!(info.split_name.as_deref(), Some("split_feature"));
    }
}
