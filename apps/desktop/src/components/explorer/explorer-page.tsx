import React, { useState } from "react";
import {
  BookOpen,
  Search,
  Code2,
  FolderTree,
  Cpu,
  Layers,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { frameworkColor } from "@/lib/utils";

interface FrameworkDoc {
  id: string;
  name: string;
  category: "Cross-Platform" | "Native Android" | "Game Engine" | "Hybrid Web";
  tagline: string;
  description: string;
  typicalFiles: string[];
  nativeLibs: string[];
  dexPatterns: string[];
  limitations: string;
  accentColor: string;
}

const frameworkDocs: FrameworkDoc[] = [
  {
    id: "flutter",
    name: "Flutter",
    category: "Cross-Platform",
    tagline: "Google's UI toolkit compiling directly to ARM native code",
    description:
      "Flutter applications bundle the Flutter C++ engine (libflutter.so) and compile Dart code into an AOT snapshot (libapp.so). Assets and font registries are placed in flutter_assets/.",
    typicalFiles: [
      "assets/flutter_assets/AssetManifest.json",
      "assets/flutter_assets/FontManifest.json",
      "assets/flutter_assets/kernel_blob.bin (debug)",
    ],
    nativeLibs: ["libflutter.so (Engine)", "libapp.so (Dart AOT Snapshot)"],
    dexPatterns: ["io.flutter.embedding.engine.*", "io.flutter.plugin.*"],
    limitations:
      "Apps utilizing 'add-to-app' embed Flutter inside an existing Java/Kotlin application, meaning native android classes will also be prominent.",
    accentColor: "#027DFD",
  },
  {
    id: "react_native",
    name: "React Native",
    category: "Cross-Platform",
    tagline: "Meta's framework running JavaScript over a native bridge",
    description:
      "React Native bundles JavaScript logic into index.android.bundle (often precompiled into bytecode by the Hermes engine). It uses Yoga for layout calculations and C++ JNI bridges.",
    typicalFiles: [
      "assets/index.android.bundle",
      "assets/index.android.bundle.hbc (Hermes Bytecode)",
    ],
    nativeLibs: [
      "libreactnativejni.so",
      "libhermes.so (Hermes JS Engine)",
      "libjsc.so (JavaScriptCore)",
      "libyoga.so (Flexbox)",
    ],
    dexPatterns: ["com.facebook.react.*", "com.facebook.hermes.*"],
    limitations:
      "Bundles can be renamed, loaded dynamically via CodePush, or split into multiple assets. Hermes bytecode may omit plain-text JS references.",
    accentColor: "#61DAFB",
  },
  {
    id: "unity",
    name: "Unity",
    category: "Game Engine",
    tagline: "Industry-standard real-time 3D and 2D game engine",
    description:
      "Unity builds compile C# game scripts to native C++ using IL2CPP, generating libil2cpp.so alongside the core engine libunity.so. Game data is located in assets/bin/Data/.",
    typicalFiles: [
      "assets/bin/Data/globalgamemanagers",
      "assets/bin/Data/mainData",
      "assets/bin/Data/level*",
    ],
    nativeLibs: ["libunity.so", "libil2cpp.so", "libmain.so"],
    dexPatterns: ["com.unity3d.player.UnityPlayerActivity"],
    limitations:
      "Unity can be embedded into non-game apps as an interactive 3D sub-view ('Unity as a Library').",
    accentColor: "#222C37",
  },
  {
    id: "unreal",
    name: "Unreal Engine",
    category: "Game Engine",
    tagline: "Epic Games high-fidelity 3D and simulation engine",
    description:
      "Unreal Engine compiles C++ game logic and engine code into libUE4.so / libUnreal.so. Assets are packed into monolithic encrypted or compressed .pak files.",
    typicalFiles: [
      "assets/UE4Game/*",
      "assets/main.pak / *.pak",
      "assets/CookedAndroid/*",
    ],
    nativeLibs: ["libUE4.so", "libUnreal.so"],
    dexPatterns: ["com.epicgames.ue4.GameActivity"],
    limitations:
      "PAK files may be split into separate OBB expansion files hosted on the Google Play Store.",
    accentColor: "#313131",
  },
  {
    id: "godot",
    name: "Godot",
    category: "Game Engine",
    tagline: "Lightweight open-source 2D and 3D game engine",
    description:
      "Godot Android exports run on libgodot_android.so and package game scenes and scripts into a main project .pck file in assets.",
    typicalFiles: ["assets/*.pck", "assets/project.godot", "assets/project.binary"],
    nativeLibs: ["libgodot_android.so"],
    dexPatterns: ["org.godotengine.godot.GodotActivity"],
    limitations:
      "PCK files can be embedded directly inside the APK or downloaded on first launch.",
    accentColor: "#478CBF",
  },
  {
    id: "dotnet_maui",
    name: ".NET MAUI",
    category: "Cross-Platform",
    tagline: "Modern evolution of Xamarin for .NET 6/7/8/9 applications",
    description:
      "Multi-platform App UI (.NET MAUI) uses Mono or CoreCLR runtime hosting libraries and bundles modern .NET assemblies under assemblies/.",
    typicalFiles: [
      "assemblies/Microsoft.Maui.dll",
      "assemblies/Microsoft.Maui.Controls.dll",
      "assemblies/System.Private.CoreLib.dll",
    ],
    nativeLibs: ["libmonosgen-2.0.so", "libnetcorehost.so"],
    dexPatterns: ["crc64* (Java Callable Wrappers)"],
    limitations:
      "Shares Mono runtime with legacy Xamarin; detection relies on Microsoft.Maui.* assembly presence.",
    accentColor: "#512BD4",
  },
  {
    id: "xamarin",
    name: "Xamarin",
    category: "Cross-Platform",
    tagline: "Legacy Microsoft .NET framework for Android",
    description:
      "Legacy Xamarin applications utilize MonoDroid to execute .NET C# bytecode packaged inside the assemblies directory.",
    typicalFiles: [
      "assemblies/Xamarin.Forms.dll",
      "assemblies/Xamarin.Android.Support.*.dll",
    ],
    nativeLibs: ["libmonodroid.so", "libmonosgen-2.0.so"],
    dexPatterns: ["mono.android.Runtime", "crc64*"],
    limitations:
      "Superseded by .NET MAUI in modern projects. Check for Maui assemblies to avoid false classification.",
    accentColor: "#3498DB",
  },
  {
    id: "cordova",
    name: "Apache Cordova",
    category: "Hybrid Web",
    tagline: "Classic hybrid container executing HTML5 in a WebView",
    description:
      "Cordova applications package standard web assets inside assets/www/, bridging JavaScript APIs to native Android plugins via cordova.js.",
    typicalFiles: [
      "assets/www/cordova.js",
      "assets/www/cordova_plugins.js",
      "assets/www/index.html",
      "res/xml/config.xml",
    ],
    nativeLibs: [],
    dexPatterns: ["org.apache.cordova.CordovaActivity"],
    limitations:
      "Web content can be hosted remotely on a web server rather than bundled in assets/www/.",
    accentColor: "#E8E8E8",
  },
  {
    id: "capacitor",
    name: "Capacitor",
    category: "Hybrid Web",
    tagline: "Modern cross-platform runtime for web apps by Ionic",
    description:
      "Capacitor packages web applications into assets/public/ with capacitor.config.json, exposing native APIs through modern JavaScript bridge plugins.",
    typicalFiles: [
      "assets/capacitor.config.json",
      "assets/capacitor.plugins.json",
      "assets/public/index.html",
    ],
    nativeLibs: [],
    dexPatterns: ["com.getcapacitor.BridgeActivity"],
    limitations:
      "Often used in conjunction with Ionic, Angular, React, or Vue web component libraries.",
    accentColor: "#53B9FF",
  },
  {
    id: "ionic",
    name: "Ionic",
    category: "Hybrid Web",
    tagline: "UI component kit built atop web standards",
    description:
      "Ionic provides UI widgets for hybrid applications. In an APK, it appears as web components inside Cordova or Capacitor assets.",
    typicalFiles: ["assets/*/ionic.config.json", "assets/*/ionic.css"],
    nativeLibs: [],
    dexPatterns: ["io.ionic.*"],
    limitations:
      "Ionic is almost always a secondary framework layered over Capacitor or Cordova.",
    accentColor: "#3880FF",
  },
  {
    id: "nativescript",
    name: "NativeScript",
    category: "Cross-Platform",
    tagline: "Direct JavaScript access to native Android APIs without WebViews",
    description:
      "NativeScript uses V8 to execute JavaScript that calls native Java/Android APIs directly. Bundles are located under assets/app/.",
    typicalFiles: [
      "assets/app/bundle.js",
      "assets/app/package.json",
      "assets/internal/metadata.bin",
    ],
    nativeLibs: ["libNativeScript.so", "libv8.so"],
    dexPatterns: ["com.tns.Runtime", "org.nativescript.*"],
    limitations:
      "Bundle files may be minimized, obscured, or converted to V8 snapshot bytecode.",
    accentColor: "#65ADF1",
  },
  {
    id: "kotlin",
    name: "Native Android (Kotlin)",
    category: "Native Android",
    tagline: "Google's preferred modern language for Android development",
    description:
      "Kotlin-compiled APKs contain kotlin.Metadata annotations on compiled classes and compiler metadata in kotlin/*.kotlin_module.",
    typicalFiles: [
      "kotlin/*.kotlin_module",
      "META-INF/*.kotlin_module",
    ],
    nativeLibs: [],
    dexPatterns: ["kotlin.Metadata", "kotlin.jvm.internal.Intrinsics", "kotlinx.coroutines.*"],
    limitations:
      "Kotlin libraries (e.g. AndroidX) may be bundled in pure Java apps, requiring metadata annotation analysis to confirm primary codebase language.",
    accentColor: "#7F52FF",
  },
  {
    id: "java",
    name: "Native Android (Java)",
    category: "Native Android",
    tagline: "Foundational Android SDK implementation language",
    description:
      "Standard Java Android applications compile Java source directly to Dalvik bytecode (classes.dex) utilizing Android framework and AndroidX components.",
    typicalFiles: ["classes.dex", "classes2.dex", "AndroidManifest.xml"],
    nativeLibs: [],
    dexPatterns: ["androidx.appcompat.*", "android.support.*"],
    limitations:
      "Virtually all Android apps contain some Dalvik bytecode, so pure Java is assigned when other specialized runtimes and Kotlin annotations are absent.",
    accentColor: "#3DDC84",
  },
  {
    id: "jetpack_compose",
    name: "Jetpack Compose",
    category: "Native Android",
    tagline: "Modern declarative UI toolkit for native Android",
    description:
      "Jetpack Compose replaces XML layout resources with declarative Kotlin functions, emitting androidx.compose.ui and androidx.compose.runtime bytecode.",
    typicalFiles: ["classes.dex"],
    nativeLibs: [],
    dexPatterns: [
      "androidx.compose.runtime.Composer",
      "androidx.compose.ui.Modifier",
      "androidx.compose.material3.*",
    ],
    limitations:
      "Compose is a UI toolkit within Native Kotlin, not a multi-platform runtime.",
    accentColor: "#4285F4",
  },
];

export function FrameworkExplorerPage() {
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<FrameworkDoc>(frameworkDocs[0]);

  const filtered = frameworkDocs.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header with Search */}
      <Card className="p-4 border-[#26262a] bg-[#131315] rounded-[20px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-mono font-medium text-[#ffffff] flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 text-[#47ab61]" strokeWidth={1.5} />
              Framework architecture library
            </h3>
            <p className="text-[11px] font-mono text-[#8c8b8f] mt-0.5">
              Inspection signatures, binary markers, and heuristics for 14 supported Android frameworks.
            </p>
          </div>

          <div className="relative w-64">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-[#8c8b8f]" strokeWidth={1.5} />
            <Input
              placeholder="Search frameworks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs font-mono h-8 border-[#26262a] bg-[#0a0a0b] rounded-[20px]"
            />
          </div>
        </div>
      </Card>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Framework Selector Sidebar */}
        <div className="md:col-span-4 space-y-1.5">
          {filtered.map((doc) => {
            const isSelected = doc.id === selectedDoc.id;

            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`p-2.5 rounded-[20px] border cursor-pointer font-mono transition-colors ${
                  isSelected
                    ? "border-[#47ab61] bg-[#18181b]"
                    : "border-[#26262a] bg-[#131315] hover:border-[#333338]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: doc.accentColor }}
                    />
                    <h4 className="text-xs font-medium text-[#ffffff]">
                      {doc.name}
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-[9px]">
                    {doc.category}
                  </Badge>
                </div>
                <p className="text-[11px] text-[#8c8b8f] truncate mt-1">
                  {doc.tagline}
                </p>
              </div>
            );
          })}
        </div>

        {/* Selected Framework Documentation */}
        <div className="md:col-span-8">
          <Card className="p-5 border-[#26262a] bg-[#131315] rounded-[20px] space-y-5">
            <div className="border-b border-[#26262a] pb-3">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: selectedDoc.accentColor }}
                />
                <h3 className="text-base font-mono font-medium text-[#ffffff]">
                  {selectedDoc.name}
                </h3>
                <Badge variant="outline" className="text-[9px] ml-2">
                  {selectedDoc.category}
                </Badge>
              </div>
              <p className="text-xs text-[#47ab61] font-mono">
                {selectedDoc.tagline}
              </p>
              <p className="text-xs font-mono text-[#8c8b8f] mt-2 leading-relaxed">
                {selectedDoc.description}
              </p>
            </div>

            {/* Typical File Paths */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#8c8b8f] flex items-center gap-1.5">
                <FolderTree className="h-3.5 w-3.5 text-[#47ab61]" strokeWidth={1.5} />
                Directory and file markers
              </h4>
              <div className="space-y-1">
                {selectedDoc.typicalFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded-full bg-[#0a0a0b] border border-[#26262a] font-mono text-xs text-[#ffffff]"
                  >
                    {file}
                  </div>
                ))}
              </div>
            </div>

            {/* Native Libraries */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#8c8b8f] flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-[#47ab61]" strokeWidth={1.5} />
                Native libraries (.so)
              </h4>
              {selectedDoc.nativeLibs.length === 0 ? (
                <p className="text-xs font-mono text-[#8c8b8f] italic">No exclusive native libraries bundled.</p>
              ) : (
                <div className="space-y-1">
                  {selectedDoc.nativeLibs.map((lib, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded-full bg-[#0a0a0b] border border-[#26262a] font-mono text-xs text-[#47ab61]"
                    >
                      {lib}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DEX Classes */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#8c8b8f] flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-[#47ab61]" strokeWidth={1.5} />
                DEX bytecode class descriptors
              </h4>
              <div className="space-y-1">
                {selectedDoc.dexPatterns.map((pat, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded-full bg-[#0a0a0b] border border-[#26262a] font-mono text-xs text-[#ffffff]"
                  >
                    {pat}
                  </div>
                ))}
              </div>
            </div>

            {/* Limitations Notice */}
            <div className="p-3 rounded-[20px] border border-amber-900/30 bg-[#160e04] text-xs font-mono text-amber-300 flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Detection considerations:</span>
                <p className="text-[#8c8b8f]">{selectedDoc.limitations}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
