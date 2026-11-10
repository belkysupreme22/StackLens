//! DEX (Dalvik Executable) file parser.
//!
//! Extracts strings, class names, and header metadata from Android DEX binaries.

use serde::{Deserialize, Serialize};

/// Little-endian tag constant in standard DEX files (0x12345678).
pub const ENDIAN_CONSTANT: u32 = 0x12345678;

/// Minimum header size for standard DEX binaries (0x70 = 112 bytes).
pub const DEX_HEADER_MIN_SIZE: usize = 0x70;

/// Parsed header of a DEX file.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DexHeader {
    /// 8-byte magic: "dex\n035\0", "dex\n037\0", "dex\n038\0", "dex\n039\0", etc.
    pub magic: [u8; 8],
    /// Adler32 checksum of the rest of the file.
    pub checksum: u32,
    /// SHA-1 signature of the rest of the file.
    pub signature: [u8; 20],
    /// Total file size according to the header.
    pub file_size: u32,
    /// Header size (usually 0x70).
    pub header_size: u32,
    /// Endianness tag (0x12345678).
    pub endian_tag: u32,
    /// Link section size in bytes.
    pub link_size: u32,
    /// Link section offset.
    pub link_off: u32,
    /// Map list offset.
    pub map_off: u32,
    /// Number of strings in the string identifiers list.
    pub string_ids_size: u32,
    /// File offset to string identifiers list.
    pub string_ids_off: u32,
}

/// Verify if the given bytes represent a valid DEX magic number.
pub fn is_dex_magic(magic: &[u8]) -> bool {
    if magic.len() < 8 {
        return false;
    }
    // Starts with "dex\n", followed by 3 ascii digits (e.g. "035"), and null terminator
    &magic[0..4] == b"dex\n"
        && magic[4].is_ascii_digit()
        && magic[5].is_ascii_digit()
        && magic[6].is_ascii_digit()
        && magic[7] == 0
}

/// Parse the DEX header from raw bytes.
pub fn parse_dex_header(data: &[u8]) -> Result<DexHeader, String> {
    if data.len() < DEX_HEADER_MIN_SIZE {
        return Err(format!(
            "DEX data too short: {} bytes (expected at least {} bytes)",
            data.len(),
            DEX_HEADER_MIN_SIZE
        ));
    }

    let mut magic = [0u8; 8];
    magic.copy_from_slice(&data[0..8]);
    if !is_dex_magic(&magic) {
        return Err(format!(
            "Invalid DEX magic: {:?} (expected 'dex\\nXXX\\0')",
            &magic[0..4]
        ));
    }

    let checksum = u32::from_le_bytes(data[0x08..0x0c].try_into().unwrap());
    let mut signature = [0u8; 20];
    signature.copy_from_slice(&data[0x0c..0x20]);
    let file_size = u32::from_le_bytes(data[0x20..0x24].try_into().unwrap());
    let header_size = u32::from_le_bytes(data[0x24..0x28].try_into().unwrap());
    let endian_tag = u32::from_le_bytes(data[0x28..0x2c].try_into().unwrap());
    let link_size = u32::from_le_bytes(data[0x2c..0x30].try_into().unwrap());
    let link_off = u32::from_le_bytes(data[0x30..0x34].try_into().unwrap());
    let map_off = u32::from_le_bytes(data[0x34..0x38].try_into().unwrap());
    let string_ids_size = u32::from_le_bytes(data[0x38..0x3c].try_into().unwrap());
    let string_ids_off = u32::from_le_bytes(data[0x3c..0x40].try_into().unwrap());

    if endian_tag != ENDIAN_CONSTANT {
        return Err(format!(
            "Unsupported DEX endianness tag: 0x{:08X} (expected 0x{:08X})",
            endian_tag, ENDIAN_CONSTANT
        ));
    }

    Ok(DexHeader {
        magic,
        checksum,
        signature,
        file_size,
        header_size,
        endian_tag,
        link_size,
        link_off,
        map_off,
        string_ids_size,
        string_ids_off,
    })
}

/// Parse all strings stored in a DEX file.
///
/// Reads the DEX header, navigates to the `string_ids` table, resolves string data offsets,
/// decodes the ULEB128 length prefix, and converts Modified UTF-8 bytes to Rust strings.
pub fn parse_dex_strings(data: &[u8]) -> Result<Vec<String>, String> {
    let header = parse_dex_header(data)?;

    let string_count = header.string_ids_size as usize;
    let ids_offset = header.string_ids_off as usize;

    let required_ids_len = string_count.checked_mul(4).ok_or("String IDs table overflow")?;
    if ids_offset + required_ids_len > data.len() {
        return Err(format!(
            "string_ids section bounds [0x{:X}..0x{:X}] exceed file size {}",
            ids_offset,
            ids_offset + required_ids_len,
            data.len()
        ));
    }

    let mut strings = Vec::with_capacity(string_count);

    for i in 0..string_count {
        let entry_offset = ids_offset + i * 4;
        let string_data_off = u32::from_le_bytes(
            data[entry_offset..entry_offset + 4]
                .try_into()
                .map_err(|e| format!("Failed to read string data offset: {}", e))?,
        ) as usize;

        if string_data_off >= data.len() {
            continue;
        }

        let mut cur = string_data_off;
        // Read ULEB128 utf16 size
        let _utf16_len = match read_uleb128(data, &mut cur) {
            Ok(len) => len,
            Err(_) => continue,
        };

        // Read modified UTF-8 string data terminated by 0x00
        match read_mutf8_string(data, &mut cur) {
            Ok(s) => strings.push(s),
            Err(_) => {
                // Skip unparseable string entry
                continue;
            }
        }
    }

    Ok(strings)
}

/// Read an unsigned LEB128 integer from data at `*offset`.
pub fn read_uleb128(data: &[u8], offset: &mut usize) -> Result<u32, String> {
    let mut result: u32 = 0;
    let mut shift = 0;

    loop {
        if *offset >= data.len() {
            return Err("Unexpected EOF while reading ULEB128".into());
        }
        let byte = data[*offset];
        *offset += 1;

        result |= ((byte & 0x7f) as u32) << shift;

        if (byte & 0x80) == 0 {
            break;
        }

        shift += 7;
        if shift > 35 {
            return Err("ULEB128 integer overflow".into());
        }
    }

    Ok(result)
}

/// Read a Modified UTF-8 string terminated by a null byte (0x00).
fn read_mutf8_string(data: &[u8], offset: &mut usize) -> Result<String, String> {
    let start = *offset;
    let mut end = start;

    while end < data.len() && data[end] != 0 {
        end += 1;
    }

    if end >= data.len() {
        return Err("Unterminated string in DEX data section".into());
    }

    *offset = end + 1; // Move past null byte
    let bytes = &data[start..end];
    Ok(decode_mutf8(bytes))
}

/// Decode Modified UTF-8 (MUTF-8) bytes into a standard Rust String.
///
/// In MUTF-8:
/// - Null byte (\0) is encoded as two bytes `0xC0 0x80`.
/// - Characters in U+0001..=U+007F are 1 byte.
/// - Surrogate pairs for characters > U+FFFF are encoded as two consecutive 3-byte sequences.
pub fn decode_mutf8(bytes: &[u8]) -> String {
    let mut result = String::with_capacity(bytes.len());
    let mut i = 0;

    while i < bytes.len() {
        let b0 = bytes[i];
        if b0 < 0x80 {
            result.push(b0 as char);
            i += 1;
        } else if (b0 & 0xE0) == 0xC0 {
            if i + 1 >= bytes.len() {
                result.push(char::REPLACEMENT_CHARACTER);
                break;
            }
            let b1 = bytes[i + 1];
            if b0 == 0xC0 && b1 == 0x80 {
                result.push('\0');
            } else {
                let code_point = (((b0 & 0x1F) as u32) << 6) | ((b1 & 0x3F) as u32);
                if let Some(ch) = char::from_u32(code_point) {
                    result.push(ch);
                } else {
                    result.push(char::REPLACEMENT_CHARACTER);
                }
            }
            i += 2;
        } else if (b0 & 0xF0) == 0xE0 {
            if i + 2 >= bytes.len() {
                result.push(char::REPLACEMENT_CHARACTER);
                break;
            }
            let b1 = bytes[i + 1];
            let b2 = bytes[i + 2];
            let code_point = (((b0 & 0x0F) as u32) << 12)
                | (((b1 & 0x3F) as u32) << 6)
                | ((b2 & 0x3F) as u32);

            // Check for surrogate pairs in MUTF-8 (high surrogate 0xD800..=0xDBFF)
            if (0xD800..=0xDBFF).contains(&code_point) && i + 5 < bytes.len() {
                let b3 = bytes[i + 3];
                let b4 = bytes[i + 4];
                let b5 = bytes[i + 5];
                if (b3 & 0xF0) == 0xE0 {
                    let trail = (((b3 & 0x0F) as u32) << 12)
                        | (((b4 & 0x3F) as u32) << 6)
                        | ((b5 & 0x3F) as u32);
                    if (0xDC00..=0xDFFF).contains(&trail) {
                        let full = 0x10000 + (((code_point - 0xD800) << 10) | (trail - 0xDC00));
                        if let Some(ch) = char::from_u32(full) {
                            result.push(ch);
                            i += 6;
                            continue;
                        }
                    }
                }
            }

            if let Some(ch) = char::from_u32(code_point) {
                result.push(ch);
            } else {
                result.push(char::REPLACEMENT_CHARACTER);
            }
            i += 3;
        } else {
            result.push(char::REPLACEMENT_CHARACTER);
            i += 1;
        }
    }

    result
}

/// Filter string table to identify class-name-like strings.
///
/// Recognizes DEX type descriptors (e.g. `Lcom/example/MyClass;`), array types
/// (e.g. `[Lcom/example/MyClass;`), and standard package-qualified class identifiers.
pub fn extract_class_names(all_strings: &[String]) -> Vec<String> {
    let mut class_names = Vec::new();

    for s in all_strings {
        if is_class_descriptor(s) {
            class_names.push(s.clone());
        } else if looks_like_java_class_name(s) {
            class_names.push(s.clone());
        }
    }

    class_names
}

/// Check if a string is a DEX class descriptor (e.g. `Lcom/example/MyClass;` or `[Lcom/example/MyClass;`).
pub fn is_class_descriptor(s: &str) -> bool {
    let trimmed = s.trim_start_matches('[');
    trimmed.starts_with('L') && trimmed.ends_with(';') && trimmed.contains('/')
}

/// Convert a DEX class descriptor `Lcom/example/MyClass;` into Java dot notation `com.example.MyClass`.
pub fn descriptor_to_class_name(desc: &str) -> Option<String> {
    let trimmed = desc.trim_start_matches('[');
    if trimmed.starts_with('L') && trimmed.ends_with(';') && trimmed.len() > 2 {
        let inner = &trimmed[1..trimmed.len() - 1];
        Some(inner.replace('/', "."))
    } else {
        None
    }
}

/// Check if a string looks like a standard Java package-qualified class name.
fn looks_like_java_class_name(s: &str) -> bool {
    if s.len() < 3 || s.len() > 200 || !s.contains('.') || s.contains(' ') || s.contains('/') {
        return false;
    }
    // Must not be a URI or permission
    if s.starts_with("http") || s.starts_with("android.permission.") {
        return false;
    }
    // Ensure all characters are valid Java identifier parts or dots/dollars
    s.chars().all(|c| c.is_alphanumeric() || c == '.' || c == '$' || c == '_')
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_dex_magic() {
        assert!(is_dex_magic(b"dex\n035\0"));
        assert!(is_dex_magic(b"dex\n037\0"));
        assert!(is_dex_magic(b"dex\n039\0"));
        assert!(!is_dex_magic(b"dex\n03a\0"));
        assert!(!is_dex_magic(b"PK\x03\x04\0\0\0\0"));
    }

    #[test]
    fn test_read_uleb128() {
        // Value 0
        let data1 = [0x00];
        let mut offset = 0;
        assert_eq!(read_uleb128(&data1, &mut offset).unwrap(), 0);
        assert_eq!(offset, 1);

        // Value 1
        let data2 = [0x01];
        offset = 0;
        assert_eq!(read_uleb128(&data2, &mut offset).unwrap(), 1);

        // Value 128 (0x80) -> encoded as [0x80, 0x01]
        let data3 = [0x80, 0x01];
        offset = 0;
        assert_eq!(read_uleb128(&data3, &mut offset).unwrap(), 128);
        assert_eq!(offset, 2);

        // Value 624485 (0x98765) -> [0xE5, 0x8E, 0x26]
        let data4 = [0xE5, 0x8E, 0x26];
        offset = 0;
        assert_eq!(read_uleb128(&data4, &mut offset).unwrap(), 624485);
        assert_eq!(offset, 3);
    }

    #[test]
    fn test_decode_mutf8() {
        // ASCII
        assert_eq!(decode_mutf8(b"Hello World"), "Hello World");

        // Embedded null 0xC0 0x80
        assert_eq!(decode_mutf8(b"Hello\xC0\x80World"), "Hello\0World");

        // 2-byte UTF-8
        assert_eq!(decode_mutf8("café".as_bytes()), "café");
    }

    #[test]
    fn test_parse_dex_synthetic() {
        // Construct a valid minimal synthetic DEX binary
        let mut data = vec![0u8; 112]; // Header is 112 bytes
        data[0..8].copy_from_slice(b"dex\n035\0");
        // endian_tag at 0x28
        data[0x28..0x2c].copy_from_slice(&ENDIAN_CONSTANT.to_le_bytes());
        // header_size at 0x24 = 112 (0x70)
        data[0x24..0x28].copy_from_slice(&112u32.to_le_bytes());

        // We will append 2 strings:
        // String 0: "Lio/flutter/embedding/engine/FlutterEngine;"
        // String 1: "Lcom/facebook/react/ReactActivity;"
        let str0 = b"Lio/flutter/embedding/engine/FlutterEngine;\0";
        let str1 = b"Lcom/facebook/react/ReactActivity;\0";

        let str_ids_off = 112; // starts right after header
        let str0_off = str_ids_off + 8; // 2 * 4 bytes for string IDs
        let mut str0_data = vec![str0.len() as u8 - 1]; // uleb128 len
        str0_data.extend_from_slice(str0);

        let str1_off = str0_off + str0_data.len();
        let mut str1_data = vec![str1.len() as u8 - 1]; // uleb128 len
        str1_data.extend_from_slice(str1);

        // Header string_ids_size = 2
        data[0x38..0x3c].copy_from_slice(&2u32.to_le_bytes());
        // Header string_ids_off = 112
        data[0x3c..0x40].copy_from_slice(&(str_ids_off as u32).to_le_bytes());

        // Append string IDs
        data.extend_from_slice(&(str0_off as u32).to_le_bytes());
        data.extend_from_slice(&(str1_off as u32).to_le_bytes());

        // Append string data
        data.extend_from_slice(&str0_data);
        data.extend_from_slice(&str1_data);

        // Update file_size
        let total_len = data.len() as u32;
        data[0x20..0x24].copy_from_slice(&total_len.to_le_bytes());

        let strings = parse_dex_strings(&data).expect("Parsing DEX strings must succeed");
        assert_eq!(strings.len(), 2);
        assert_eq!(strings[0], "Lio/flutter/embedding/engine/FlutterEngine;");
        assert_eq!(strings[1], "Lcom/facebook/react/ReactActivity;");

        let classes = extract_class_names(&strings);
        assert_eq!(classes.len(), 2);
        assert_eq!(
            descriptor_to_class_name(&classes[0]),
            Some("io.flutter.embedding.engine.FlutterEngine".to_string())
        );
    }

    #[test]
    fn test_extract_class_names_and_descriptors() {
        let input = vec![
            "Lcom/example/MyClass;".to_string(),
            "[Ljava/lang/String;".to_string(),
            "com.example.AnotherClass".to_string(),
            "not a class".to_string(),
            "android.permission.INTERNET".to_string(),
        ];
        let classes = extract_class_names(&input);
        assert!(classes.contains(&"Lcom/example/MyClass;".to_string()));
        assert!(classes.contains(&"[Ljava/lang/String;".to_string()));
        assert!(classes.contains(&"com.example.AnotherClass".to_string()));
        assert!(!classes.contains(&"not a class".to_string()));
        assert!(!classes.contains(&"android.permission.INTERNET".to_string()));
    }
}
