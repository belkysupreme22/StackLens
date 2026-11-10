import React, { useState, useEffect } from "react";
import * as commands from "@/lib/commands";

interface AppLogoProps {
  packageName: string;
  appName: string;
  serial?: string | null;
  brandColor?: string;
  initials?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Global in-memory cache for extracted device icons so we never fetch twice
const globalIconCache: Record<string, string> = {};
const pendingFetches = new Set<string>();

export function AppLogo({
  packageName,
  appName,
  serial,
  brandColor = "#47ab61",
  initials = "AP",
  size = "md",
  className = "",
}: AppLogoProps) {
  const [deviceIcon, setDeviceIcon] = useState<string | null>(
    globalIconCache[packageName] || null
  );

  useEffect(() => {
    if (deviceIcon || !serial) return;
    if (globalIconCache[packageName]) {
      setDeviceIcon(globalIconCache[packageName]);
      return;
    }

    // Only fetch for non-system apps or if we don't have a known vector
    if (!pendingFetches.has(packageName)) {
      pendingFetches.add(packageName);
      commands
        .getDevicePackageIcon(serial, packageName)
        .then((b64) => {
          if (b64) {
            globalIconCache[packageName] = b64;
            setDeviceIcon(b64);
          }
        })
        .catch(() => {})
        .finally(() => {
          pendingFetches.delete(packageName);
        });
    }
  }, [packageName, serial, deviceIcon]);

  const sizeClasses = {
    sm: "h-7 w-7 text-[10px] rounded-[8px]",
    md: "h-10 w-10 text-xs rounded-[12px]",
    lg: "h-14 w-14 text-sm rounded-[16px]",
  }[size];

  // 1. If we have the extracted real device icon, render it directly!
  if (deviceIcon) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-[#18181b] border border-[#26262a] shadow-sm ${sizeClasses} ${className}`}
      >
        <img
          src={deviceIcon}
          alt={appName}
          className="h-full w-full object-contain p-0.5"
          onError={() => setDeviceIcon(null)}
        />
      </div>
    );
  }

  // 2. Official High-Resolution Vector Brand Logos for major apps
  const vectorLogo = getKnownBrandVector(packageName, size);
  if (vectorLogo) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden shadow-sm ${sizeClasses} ${className}`}
      >
        {vectorLogo}
      </div>
    );
  }

  // 3. Fallback: Sleek initials badge with brand gradient
  return (
    <div
      className={`flex shrink-0 items-center justify-center font-bold text-[#ffffff] shadow-sm ${sizeClasses} ${className}`}
      style={{
        backgroundColor: brandColor,
        boxShadow: `0 4px 14px ${brandColor}33`,
      }}
    >
      {initials}
    </div>
  );
}

// Built-in authentic vector logos for the world's most popular Android applications
function getKnownBrandVector(packageName: string, size: "sm" | "md" | "lg") {
  const iconSize = size === "sm" ? 18 : size === "md" ? 24 : 32;

  switch (packageName) {
    // Spotify
    case "com.spotify.music":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect width="48" height="48" rx="12" fill="#1DB954" />
          <path
            d="M34.8 22.4c-6.8-4-18.1-4.4-24.6-2.4-.9.3-1.9-.3-2.1-1.2-.3-.9.3-1.9 1.2-2.1 7.5-2.3 20-1.8 27.9 2.9.8.5 1.1 1.6.6 2.4-.5.7-1.5 1-2.4.5zm-.4 5.3c-.5.8-1.5 1-2.3.5-5.7-3.5-14.4-4.5-21.1-2.5-.9.3-1.8-.2-2.1-1.1-.3-.9.2-1.8 1.1-2.1 7.7-2.3 17.3-1.2 23.9 2.8.8.6 1 1.6.5 2.4zm-2.6 5.1c-.4.6-1.2.8-1.9.4-5-3-11.2-3.7-18.6-2-1 .2-1.6-.4-1.7-1.1-.2-.7.4-1.6 1.1-1.7 8.1-1.9 15-1.1 20.7 2.3.6.4.8 1.2.4 2.1z"
            fill="#000000"
          />
        </svg>
      );

    // Telegram
    case "org.telegram.messenger":
    case "org.telegram.messenger.web":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect width="48" height="48" rx="12" fill="#24A1DE" />
          <path
            d="M10 24.5l26-10-5.8 24.5s-.8 1.9-2.5 1.1l-7.7-5.8-4.5 4.3s-.5.5-.9.5l.7-7.2 13-11.8c.6-.5-.3-.9-1-.5l-16.1 10.1-6.2-2s-1-.3-1-1.1c0-.8 1-1.1 1-1.1z"
            fill="#ffffff"
          />
        </svg>
      );

    // YouTube
    case "com.google.android.youtube":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect width="48" height="48" rx="12" fill="#FF0000" />
          <path d="M20 16l12 8-12 8z" fill="#ffffff" />
        </svg>
      );

    // YouTube Music
    case "com.google.android.apps.youtube.music":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect width="48" height="48" rx="12" fill="#FF0000" />
          <circle cx="24" cy="24" r="14" fill="#ffffff" fillOpacity="0.2" />
          <circle cx="24" cy="24" r="9" fill="#ffffff" />
          <path d="M22 20l6 4-6 4z" fill="#FF0000" />
        </svg>
      );

    // WhatsApp
    case "com.whatsapp":
    case "com.whatsapp.w4b":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect width="48" height="48" rx="12" fill="#25D366" />
          <path
            d="M24 10C16.3 10 10 16.3 10 24c0 2.7.8 5.2 2.2 7.4L10 38l6.8-2.2C19 37.2 21.4 38 24 38c7.7 0 14-6.3 14-14S31.7 10 24 10zm7.1 20c-.3.8-1.7 1.6-2.4 1.7-.7.1-1.5.2-4.9-1.2-4.3-1.8-7-6.2-7.2-6.5-.2-.3-1.8-2.4-1.8-4.5s1.1-3.2 1.5-3.6c.4-.4.9-.5 1.2-.5h.9c.3 0 .7 0 1 .7.4 1 1.3 3.1 1.4 3.3.1.2.2.5 0 .8-.1.3-.3.5-.5.7-.2.2-.4.4-.6.6-.2.2-.4.5-.2.9.3.6 1.3 2.1 2.8 3.4 1.9 1.7 3.5 2.2 4 2.4.5.2.8.2 1.1-.2.3-.4 1.3-1.5 1.6-2 .3-.5.7-.4 1.1-.2.5.2 3.1 1.5 3.6 1.7.5.3.9.4 1 .6.1.3.1 1.6-.2 2.4z"
            fill="#ffffff"
          />
        </svg>
      );

    // Google Chrome
    case "com.android.chrome":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect width="48" height="48" rx="12" fill="#ffffff" />
          <circle cx="24" cy="24" r="16" fill="#EA4335" />
          <circle cx="24" cy="24" r="8" fill="#4285F4" stroke="#ffffff" strokeWidth="2.5" />
          <path d="M24 16h14a16 16 0 0 1-5 13.9L24 24z" fill="#FBBC04" opacity="0.95" />
          <path d="M10 24h14l-5 11.5A16 16 0 0 1 10 24z" fill="#34A853" opacity="0.95" />
        </svg>
      );

    // ChatGPT
    case "com.openai.chatgpt":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect width="48" height="48" rx="12" fill="#10A37F" />
          <path
            d="M34.8 21.6c-.3-2.6-2.1-4.6-4.6-5.2-.6-1.8-2.1-3.1-3.9-3.7-2.5-.7-5.1.2-6.5 2.2-1.9-.3-3.8.6-4.8 2.2-1.4 2.3-1.1 5.2.6 7.2-.3 2.6 1.5 5 4 5.7.5 1.8 1.9 3.2 3.8 3.8 2.5.8 5.2 0 6.6-2 1.8.3 3.7-.5 4.7-2.1 1.5-2.3 1.3-5.3-.3-7.3l.4-.8zm-11-7.1c1.2 0 2.3.6 2.9 1.7l-4.5 2.6-3-1.7c1.1-1.6 2.8-2.6 4.6-2.6zm-7.7 5.1c.7-.7 1.8-1 2.8-.8v5.2l-4.5 2.6c-.7-1.8-.3-4 1.7-7zm-.6 9.3c-.6-1.1-.6-2.4 0-3.5l4.5 2.6v3.5l-4.5-2.6zm10.7 4.9c-1.2 0-2.3-.6-2.9-1.7l4.5-2.6 3 1.7c-1.1 1.6-2.8 2.6-4.6 2.6zm5.3-4.3c-.7.7-1.8 1-2.8.8v-5.2l4.5-2.6c.7 1.8.3 4-1.7 7zm.6-9.3c.6 1.1.6 2.4 0 3.5l-4.5-2.6v-3.5l4.5 2.6z"
            fill="#ffffff"
          />
        </svg>
      );

    // Bybit
    case "com.bybit.app":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect width="48" height="48" rx="12" fill="#121214" />
          <path
            d="M17 14h8c4.4 0 7 2.2 7 5.5 0 2.2-1.2 4-3.2 4.8 2.6.7 4.2 2.8 4.2 5.5 0 3.8-3.1 6.2-7.8 6.2H17V14zm5.5 8h2.8c1.6 0 2.7-.9 2.7-2.3 0-1.4-1.1-2.2-2.7-2.2h-2.8v4.5zm0 10.5h3.3c1.8 0 3-1 3-2.6 0-1.5-1.2-2.5-3-2.5h-3.3v5.1z"
            fill="#F7A600"
          />
        </svg>
      );

    // Binance
    case "com.binance.dev":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect width="48" height="48" rx="12" fill="#181A20" />
          <path
            d="M24 10l5.2 5.2-2.5 2.5L24 15l-2.7 2.7-2.5-2.5L24 10zm-8.8 8.8l2.5-2.5 2.7 2.7-2.7 2.7-2.5-2.9zm17.6 0l-2.5-2.5-2.7 2.7 2.7 2.7 2.5-2.9zM24 20.3l3.7 3.7-3.7 3.7-3.7-3.7 3.7-3.7zm-14 3.7l5.2-5.2 2.5 2.5L15 24l2.7 2.7-2.5 2.5L10 24zm28 0l-5.2-5.2-2.5 2.5 2.7 2.7-2.7 2.7 2.5 2.5L38 24zM24 38l-5.2-5.2 2.5-2.5L24 33l2.7-2.7 2.5 2.5L24 38z"
            fill="#F3BA2F"
          />
        </svg>
      );

    // Google Docs
    case "com.google.android.apps.docs":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect width="48" height="48" rx="12" fill="#ffffff" />
          <path d="M15 11h12l8 8v18H15z" fill="#4285F4" />
          <path d="M27 11v8h8z" fill="#A1C2FA" />
          <rect x="18" y="24" width="12" height="2" rx="1" fill="#ffffff" />
          <rect x="18" y="28" width="12" height="2" rx="1" fill="#ffffff" />
          <rect x="18" y="32" width="7" height="2" rx="1" fill="#ffffff" />
        </svg>
      );

    // Google Sheets
    case "com.google.android.apps.docs.editors.sheets":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect width="48" height="48" rx="12" fill="#ffffff" />
          <path d="M15 11h12l8 8v18H15z" fill="#0F9D58" />
          <path d="M27 11v8h8z" fill="#87CEAC" />
          <path d="M18 23h12v11H18z" fill="#ffffff" fillOpacity="0.2" />
          <rect x="18" y="23" width="12" height="11" fill="none" stroke="#ffffff" strokeWidth="1.5" />
          <line x1="18" y1="28.5" x2="30" y2="28.5" stroke="#ffffff" strokeWidth="1.5" />
          <line x1="24" y1="23" x2="24" y2="34" stroke="#ffffff" strokeWidth="1.5" />
        </svg>
      );

    // Netflix
    case "com.netflix.mediaclient":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect width="48" height="48" rx="12" fill="#000000" />
          <path d="M16 11h5v26h-5z" fill="#E50914" />
          <path d="M27 11h5v26h-5z" fill="#E50914" />
          <path d="M16 11l16 26h-5L16 13z" fill="#B81D24" />
        </svg>
      );

    // TikTok
    case "com.zhiliaoapp.musically":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect width="48" height="48" rx="12" fill="#000000" />
          <path
            d="M32 17c-2.3 0-4.3-1.2-5.4-3v14.5c0 4.1-3.4 7.5-7.5 7.5s-7.5-3.4-7.5-7.5 3.4-7.5 7.5-7.5c.8 0 1.6.1 2.3.4V25c-.7-.3-1.5-.4-2.3-.4-2.5 0-4.5 2-4.5 4.5s2 4.5 4.5 4.5 4.5-2 4.5-4.5V11h6c.6 3.4 3.3 6 6.8 6v-3h-2.4z"
            fill="#25F4EE"
          />
          <path
            d="M33 18c-2.3 0-4.3-1.2-5.4-3v14.5c0 4.1-3.4 7.5-7.5 7.5s-7.5-3.4-7.5-7.5 3.4-7.5 7.5-7.5c.8 0 1.6.1 2.3.4V25c-.7-.3-1.5-.4-2.3-.4-2.5 0-4.5 2-4.5 4.5s2 4.5 4.5 4.5 4.5-2 4.5-4.5V11h6c.6 3.4 3.3 6 6.8 6v-3h-2.4z"
            fill="#FE2C55"
            opacity="0.8"
          />
        </svg>
      );

    // Instagram
    case "com.instagram.android":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <defs>
            <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#FFDC80" />
              <stop offset="50%" stop-color="#FD1D1D" />
              <stop offset="100%" stop-color="#833AB4" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" rx="12" fill="url(#ig-grad)" />
          <rect
            x="13"
            y="13"
            width="22"
            height="22"
            rx="6"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
          />
          <circle cx="24" cy="24" r="5.5" fill="none" stroke="#ffffff" strokeWidth="2.5" />
          <circle cx="30" cy="18" r="1.5" fill="#ffffff" />
        </svg>
      );

    // X (Twitter)
    case "com.twitter.android":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect width="48" height="48" rx="12" fill="#000000" />
          <path
            d="M29.5 13h4.1l-9 10.3 10.6 14h-8.3l-6.5-8.5-7.4 8.5H8.9l9.6-11L8.3 13h8.5l5.9 7.8L29.5 13zm-1.4 21.8h2.3L17.7 15.3h-2.4l12.8 19.5z"
            fill="#ffffff"
          />
        </svg>
      );

    // Facebook
    case "com.facebook.katana":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect width="48" height="48" rx="12" fill="#1877F2" />
          <path
            d="M29 25h-4.5v14h-5.5V25h-3v-4.5h3v-3c0-3.5 1.8-5.5 5.5-5.5h4v4.5h-2.5c-1.5 0-2 .7-2 1.8v2.2H29L29 25z"
            fill="#ffffff"
          />
        </svg>
      );

    // Discord
    case "com.discord":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect width="48" height="48" rx="12" fill="#5865F2" />
          <path
            d="M33.5 16.5c-2.3-1-4.7-1.7-7.2-1.8l-.4.8c2.7.8 3.9 2 3.9 2-1.7-.9-3.4-1.5-5.2-1.7-1.8-.3-3.6-.3-5.4 0-1.7.3-3.3.8-4.8 1.6 0 0 1.2-1.2 4-2l-.4-.8c-2.5.1-4.9.8-7.2 1.8-4.6 6.8-5.8 13.5-5.2 20.1 3 2.2 6 2.3 6 2.3l1.3-1.7c-2.1-.6-2.9-1.9-2.9-1.9.2.1.4.2.6.3 2.5 1.4 5.3 2.1 8.2 2.1 2.9 0 5.7-.7 8.2-2.1.2-.1.4-.2.6-.3 0 0-.8 1.3-2.9 1.9l1.3 1.7s3-.1 6-2.3c.7-7.6-.7-14.2-5.1-20.1zM19.5 29c-1.4 0-2.5-1.2-2.5-2.8s1.1-2.8 2.5-2.8 2.5 1.2 2.5 2.8-1.1 2.8-2.5 2.8zm9 0c-1.4 0-2.5-1.2-2.5-2.8s1.1-2.8 2.5-2.8 2.5 1.2 2.5 2.8-1.1 2.8-2.5 2.8z"
            fill="#ffffff"
          />
        </svg>
      );

    // Samsung Internet
    case "com.sec.android.app.sbrowser":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect width="48" height="48" rx="12" fill="#1249D6" />
          <circle cx="24" cy="24" r="13" fill="none" stroke="#ffffff" strokeWidth="2.5" />
          <ellipse
            cx="24"
            cy="24"
            rx="15"
            ry="6"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            transform="rotate(-28 24 24)"
          />
        </svg>
      );

    default:
      return null;
  }
}
