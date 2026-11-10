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

    // Automatically fetch real native icon from device APK
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

  // 2. Fallback: Sleek initials badge with dynamic brand color
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
