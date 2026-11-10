import React from "react";

interface FrameworkLogoProps {
  framework: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function FrameworkLogo({ framework, size = "md", className = "" }: FrameworkLogoProps) {
  const norm = framework.toLowerCase().replace(/[^a-z]/g, "");

  const sizeClass = {
    sm: "h-6 w-6 p-1",
    md: "h-9 w-9 p-1.5",
    lg: "h-12 w-12 p-2",
  }[size];

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-[12px] bg-[#18181b] border border-[#26262a] shadow-sm ${sizeClass} ${className}`}
    >
      {renderLogo(norm)}
    </div>
  );
}

function renderLogo(norm: string) {
  switch (norm) {
    // Flutter
    case "flutter":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <path d="M29.5 6L11 24.5l5.7 5.7L39 7.9z" fill="#42A5F5" />
          <path d="M29.5 28.5L19.3 38.7 25 44.4 41 28.5z" fill="#0D47A1" />
          <path d="M20.2 30.2l5.7-5.7 8.6 8.6-5.7 5.7z" fill="#29B6F6" />
        </svg>
      );

    // React Native
    case "reactnative":
    case "react":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <circle cx="24" cy="24" r="4.5" fill="#61DAFB" />
          <ellipse cx="24" cy="24" rx="18" ry="7" fill="none" stroke="#61DAFB" strokeWidth="2.2" />
          <ellipse
            cx="24"
            cy="24"
            rx="18"
            ry="7"
            fill="none"
            stroke="#61DAFB"
            strokeWidth="2.2"
            transform="rotate(60 24 24)"
          />
          <ellipse
            cx="24"
            cy="24"
            rx="18"
            ry="7"
            fill="none"
            stroke="#61DAFB"
            strokeWidth="2.2"
            transform="rotate(120 24 24)"
          />
        </svg>
      );

    // Unity
    case "unity":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <path
            d="M24 10l-4.5 7.8 7.5 4.3v8.7l-7.5-4.3L15 31l9 5.2 9-5.2-4.5-4.5-7.5 4.3v-8.7l7.5-4.3L33 13.5z"
            fill="#ffffff"
          />
          <path d="M24 6l15.6 9v18L24 42 8.4 33V15L24 6zm0 4.2L12 17.1v13.8L24 37.8l12-6.9V17.1L24 10.2z" fill="#ffffff" fillOpacity="0.4" />
        </svg>
      );

    // Unreal Engine
    case "unreal":
    case "unrealengine":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <circle cx="24" cy="24" r="17" fill="none" stroke="#ffffff" strokeWidth="2.5" />
          <path
            d="M20 16v10.5c0 2.2 1.8 4 4 4s4-1.8 4-4V16h3.5v10.5c0 4.1-3.4 7.5-7.5 7.5s-7.5-3.4-7.5-7.5V16H20z"
            fill="#ffffff"
          />
        </svg>
      );

    // Godot
    case "godot":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect x="12" y="14" width="24" height="22" rx="6" fill="#478CBF" />
          <circle cx="19" cy="22" r="3" fill="#ffffff" />
          <circle cx="29" cy="22" r="3" fill="#ffffff" />
          <circle cx="19" cy="22" r="1.5" fill="#000000" />
          <circle cx="29" cy="22" r="1.5" fill="#000000" />
          <rect x="18" y="29" width="12" height="2.5" rx="1.2" fill="#ffffff" />
          <path d="M10 20l4-2M38 20l-4-2M24 10v4" stroke="#478CBF" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    // .NET MAUI
    case "dotnetmaui":
    case "maui":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <circle cx="24" cy="24" r="17" fill="#512BD4" />
          <path
            d="M17 28V20h3.5l3.5 5 3.5-5H31v8h-3v-4.5l-3 4h-2l-3-4V28H17z"
            fill="#ffffff"
          />
        </svg>
      );

    // Xamarin
    case "xamarin":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <path
            d="M14 12l10 12-10 12h5.5l7.5-9 7.5 9H40L30 24l10-12h-5.5L27 21l-7.5-9H14z"
            fill="#3498DB"
          />
        </svg>
      );

    // Apache Cordova
    case "cordova":
    case "apachecordova":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect x="12" y="14" width="24" height="20" rx="5" fill="#E8E8E8" />
          <circle cx="19" cy="22" r="2.5" fill="#4C545C" />
          <circle cx="29" cy="22" r="2.5" fill="#4C545C" />
          <rect x="17" y="27" width="14" height="2.5" rx="1.2" fill="#4C545C" />
          <path d="M15 11l3 3M33 11l-3 3" stroke="#E8E8E8" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    // Capacitor
    case "capacitor":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <circle cx="24" cy="24" r="17" fill="#119EFF" />
          <path d="M26 12L15 26h8l-2 10 12-14h-8l3-10z" fill="#ffffff" />
        </svg>
      );

    // Ionic
    case "ionic":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <circle cx="24" cy="24" r="17" fill="#3880FF" />
          <circle cx="24" cy="24" r="9" fill="none" stroke="#ffffff" strokeWidth="3" />
          <circle cx="34" cy="18" r="3" fill="#ffffff" />
        </svg>
      );

    // NativeScript
    case "nativescript":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect width="48" height="48" rx="12" fill="#000000" />
          <path
            d="M16 14v20l16-10L16 14z"
            fill="#65ADF1"
          />
          <path d="M24 19l8 5-8 5v-10z" fill="#ffffff" />
        </svg>
      );

    // Jetpack Compose
    case "jetpackcompose":
    case "compose":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <path d="M24 8l14 8-14 8-14-8z" fill="#4285F4" />
          <path d="M10 16l14 8v16L10 32z" fill="#34A853" />
          <path d="M38 16l-14 8v16l14-8z" fill="#1A73E8" />
          <path d="M24 24l9.5-5.5L24 13l-9.5 5.5z" fill="#669DF6" />
        </svg>
      );

    // Native Android (Kotlin)
    case "nativeandroidkotlin":
    case "kotlin":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <path d="M12 10h24L24 22 12 10z" fill="#7F52FF" />
          <path d="M12 10v28l14-14L12 10z" fill="#C757BC" />
          <path d="M12 38h24L24 22 12 38z" fill="#E24462" />
        </svg>
      );

    // Native Android (Java)
    case "nativeandroidjava":
    case "java":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <path
            d="M27.5 13c0 0-2 2-2 4s2 3 2 5-3 3-3 3"
            stroke="#EA2D2E"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M21.5 15c0 0-2 2-2 3.5s2 2.5 2 4-2.5 2.5-2.5 2.5"
            stroke="#5382A1"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M14 30c0 4 4.5 6 10 6s10-2 10-6H14z"
            fill="#5382A1"
          />
          <path d="M31 31c2 0 4-1 4-2.5S33 26 31 26" stroke="#5382A1" strokeWidth="2.2" fill="none" />
          <path d="M16 38c3 1.5 13 1.5 16 0" stroke="#EA2D2E" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <circle cx="24" cy="24" r="14" fill="#47ab61" fillOpacity="0.2" stroke="#47ab61" strokeWidth="2" />
          <path d="M24 16v16M16 24h16" stroke="#47ab61" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
}
