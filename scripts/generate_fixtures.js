/**
 * Generates synthetic test APK archives for testing framework detection.
 * APK files are standard ZIP archives containing Android binaries and assets.
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const fixturesDir = path.join(__dirname, "..", "tests", "fixtures");
fs.mkdirSync(fixturesDir, { recursive: true });

// Minimal zip builder helper
function createZip(entries) {
  const localHeaders = [];
  const centralEntries = [];
  let offset = 0;

  for (const entry of entries) {
    const filenameBuf = Buffer.from(entry.name, "utf-8");
    const dataBuf = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data || "");

    const crcVal = zlib.crc32(dataBuf);
    const size = dataBuf.length;

    // Local file header (30 bytes + name)
    const lh = Buffer.alloc(30 + filenameBuf.length);
    lh.writeUInt32LE(0x04034b50, 0); // Signature
    lh.writeUInt16LE(20, 4); // Min version
    lh.writeUInt16LE(0, 6); // Flags
    lh.writeUInt16LE(0, 8); // Compression: Stored (0)
    lh.writeUInt16LE(0, 10); // Mod time
    lh.writeUInt16LE(0, 12); // Mod date
    lh.writeUInt32LE(crcVal, 14); // CRC32
    lh.writeUInt32LE(size, 18); // Compressed size
    lh.writeUInt32LE(size, 22); // Uncompressed size
    lh.writeUInt16LE(filenameBuf.length, 26); // Name length
    lh.writeUInt16LE(0, 28); // Extra length
    filenameBuf.copy(lh, 30);

    localHeaders.push(lh, dataBuf);

    // Central directory header (46 bytes + name)
    const cd = Buffer.alloc(46 + filenameBuf.length);
    cd.writeUInt32LE(0x02014b50, 0); // Signature
    cd.writeUInt16LE(20, 4); // Version made by
    cd.writeUInt16LE(20, 6); // Min version
    cd.writeUInt16LE(0, 8); // Flags
    cd.writeUInt16LE(0, 10); // Compression: Stored
    cd.writeUInt16LE(0, 12); // Mod time
    cd.writeUInt16LE(0, 14); // Mod date
    cd.writeUInt32LE(crcVal, 16); // CRC32
    cd.writeUInt32LE(size, 20); // Compressed size
    cd.writeUInt32LE(size, 24); // Uncompressed size
    cd.writeUInt16LE(filenameBuf.length, 28); // Name length
    cd.writeUInt16LE(0, 30); // Extra length
    cd.writeUInt16LE(0, 32); // Comment length
    cd.writeUInt16LE(0, 34); // Disk start
    cd.writeUInt16LE(0, 36); // Internal attributes
    cd.writeUInt32LE(0, 38); // External attributes
    cd.writeUInt32LE(offset, 42); // Offset of local header
    filenameBuf.copy(cd, 46);

    centralEntries.push(cd);
    offset += lh.length + dataBuf.length;
  }

  const centralDirBuf = Buffer.concat(centralEntries);
  const cdOffset = offset;
  const cdSize = centralDirBuf.length;

  // End of Central Directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // Signature
  eocd.writeUInt16LE(0, 4); // Disk number
  eocd.writeUInt16LE(0, 6); // Start disk
  eocd.writeUInt16LE(entries.length, 8); // Entries on disk
  eocd.writeUInt16LE(entries.length, 10); // Total entries
  eocd.writeUInt32LE(cdSize, 12); // CD size
  eocd.writeUInt32LE(cdOffset, 16); // CD offset
  eocd.writeUInt16LE(0, 20); // Comment length

  return Buffer.concat([...localHeaders, centralDirBuf, eocd]);
}

// Minimal DEX file (112 bytes header)
function createMinimalDex(classes = []) {
  const buf = Buffer.alloc(112);
  Buffer.from("dex\n035\0").copy(buf, 0); // DEX magic
  buf.writeUInt32LE(0x12345678, 40); // Endian tag
  buf.writeUInt32LE(112, 32); // File size
  buf.writeUInt32LE(112, 36); // Header size
  return buf;
}

// 1. Flutter Synthetic APK
const flutterApk = createZip([
  { name: "AndroidManifest.xml", data: "android.permission.INTERNET com.example.flutterapp" },
  { name: "classes.dex", data: createMinimalDex() },
  { name: "lib/arm64-v8a/libflutter.so", data: "ELF-flutter-runtime-mock" },
  { name: "lib/arm64-v8a/libapp.so", data: "ELF-flutter-aot-dart-snapshot-mock" },
  { name: "assets/flutter_assets/AssetManifest.json", data: "{}" },
  { name: "assets/flutter_assets/FontManifest.json", data: "[]" },
]);
fs.writeFileSync(path.join(fixturesDir, "synthetic_flutter.apk"), flutterApk);

// 2. React Native Synthetic APK
const reactNativeApk = createZip([
  { name: "AndroidManifest.xml", data: "android.permission.INTERNET com.example.rnapp" },
  { name: "classes.dex", data: createMinimalDex() },
  { name: "lib/arm64-v8a/libreactnativejni.so", data: "ELF-react-native-jni-mock" },
  { name: "lib/arm64-v8a/libhermes.so", data: "ELF-hermes-js-engine-mock" },
  { name: "assets/index.android.bundle", data: "// React Native bundle mock" },
]);
fs.writeFileSync(path.join(fixturesDir, "synthetic_react_native.apk"), reactNativeApk);

// 3. Unity Synthetic APK
const unityApk = createZip([
  { name: "AndroidManifest.xml", data: "android.permission.WAKE_LOCK com.example.unitygame" },
  { name: "classes.dex", data: createMinimalDex() },
  { name: "lib/arm64-v8a/libunity.so", data: "ELF-unity-engine-mock" },
  { name: "lib/arm64-v8a/libil2cpp.so", data: "ELF-unity-il2cpp-mock" },
  { name: "assets/bin/Data/globalgamemanagers", data: "UNITY-GLOBALGAMEMANAGERS" },
]);
fs.writeFileSync(path.join(fixturesDir, "synthetic_unity.apk"), unityApk);

// 4. .NET MAUI Synthetic APK
const mauiApk = createZip([
  { name: "AndroidManifest.xml", data: "com.example.mauiapp" },
  { name: "classes.dex", data: createMinimalDex() },
  { name: "lib/arm64-v8a/libmonosgen-2.0.so", data: "ELF-mono-sgen-mock" },
  { name: "assemblies/Microsoft.Maui.dll", data: "MZ-maui-dll-mock" },
  { name: "assemblies/Microsoft.Maui.Controls.dll", data: "MZ-maui-controls-mock" },
]);
fs.writeFileSync(path.join(fixturesDir, "synthetic_maui.apk"), mauiApk);

// 5. Cordova Synthetic APK
const cordovaApk = createZip([
  { name: "AndroidManifest.xml", data: "com.example.cordovaapp" },
  { name: "classes.dex", data: createMinimalDex() },
  { name: "assets/www/cordova.js", data: "// Apache Cordova mock" },
  { name: "assets/www/cordova_plugins.js", data: "// Cordova plugins mock" },
]);
fs.writeFileSync(path.join(fixturesDir, "synthetic_cordova.apk"), cordovaApk);

// 6. Godot Synthetic APK
const godotApk = createZip([
  { name: "AndroidManifest.xml", data: "com.example.godotgame" },
  { name: "classes.dex", data: createMinimalDex() },
  { name: "lib/arm64-v8a/libgodot_android.so", data: "ELF-godot-mock" },
  { name: "assets/main.pck", data: "GDPCK" },
]);
fs.writeFileSync(path.join(fixturesDir, "synthetic_godot.apk"), godotApk);

console.log("Successfully generated 6 synthetic test APK fixtures.");
