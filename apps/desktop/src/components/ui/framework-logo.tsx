import React from "react";

interface FrameworkLogoProps {
  framework: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const FRAMEWORK_ICON_MAP: Record<string, string> = {
  flutter: "/frameworks/flutter.svg",
  react_native: "/frameworks/react-native.svg",
  unity: "/frameworks/unity.svg",
  unreal_engine: "/frameworks/unreal-engine.svg",
  godot: "/frameworks/godot.svg",
  dotnet_maui: "/frameworks/dotnet-maui.svg",
  xamarin: "/frameworks/xamarin.svg",
  apache_cordova: "/frameworks/apache-cordova.svg",
  capacitor: "/frameworks/capacitor.svg",
  ionic: "/frameworks/ionic.svg",
  nativescript: "/frameworks/nativescript.svg",
  native_kotlin: "/frameworks/kotlin.svg",
  native_java: "/frameworks/java.svg",
  jetpack_compose: "/frameworks/jetpack-compose.svg",
};

export function FrameworkLogo({
  framework,
  size = "md",
  className = "",
}: FrameworkLogoProps) {
  const normKey = framework.toLowerCase().replace(/[^a-z0-9]/g, "_");

  let iconPath = FRAMEWORK_ICON_MAP[normKey];
  if (!iconPath) {
    if (normKey.includes("flutter")) iconPath = FRAMEWORK_ICON_MAP.flutter;
    else if (normKey.includes("react")) iconPath = FRAMEWORK_ICON_MAP.react_native;
    else if (normKey.includes("unity")) iconPath = FRAMEWORK_ICON_MAP.unity;
    else if (normKey.includes("unreal")) iconPath = FRAMEWORK_ICON_MAP.unreal_engine;
    else if (normKey.includes("godot")) iconPath = FRAMEWORK_ICON_MAP.godot;
    else if (normKey.includes("maui")) iconPath = FRAMEWORK_ICON_MAP.dotnet_maui;
    else if (normKey.includes("xamarin")) iconPath = FRAMEWORK_ICON_MAP.xamarin;
    else if (normKey.includes("cordova")) iconPath = FRAMEWORK_ICON_MAP.apache_cordova;
    else if (normKey.includes("capacitor")) iconPath = FRAMEWORK_ICON_MAP.capacitor;
    else if (normKey.includes("ionic")) iconPath = FRAMEWORK_ICON_MAP.ionic;
    else if (normKey.includes("nativescript")) iconPath = FRAMEWORK_ICON_MAP.nativescript;
    else if (normKey.includes("kotlin")) iconPath = FRAMEWORK_ICON_MAP.native_kotlin;
    else if (normKey.includes("java")) iconPath = FRAMEWORK_ICON_MAP.native_java;
    else if (normKey.includes("compose")) iconPath = FRAMEWORK_ICON_MAP.jetpack_compose;
  }

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-9 w-9",
  }[size];

  if (!iconPath) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center font-mono font-bold text-xs bg-[#26262a] text-[#ffffff] rounded-[8px] ${sizeClasses} ${className}`}
      >
        {framework.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={iconPath}
      alt={framework}
      className={`object-contain shrink-0 ${sizeClasses} ${className}`}
    />
  );
}
