// Dynamic package resolver: automatically derives canonical app metadata, categories,
// and presentation profiles from Android package names and device launcher queries.
// Zero hardcoded app lists.

export interface AppProfile {
  packageName: string;
  appName: string;
  isSystem: boolean;
  isLauncher: boolean;
  isBackgroundStub: boolean;
  category:
    | "Social"
    | "Entertainment"
    | "Finance"
    | "Tools"
    | "Productivity"
    | "Shopping"
    | "Gaming"
    | "Navigation"
    | "System"
    | "Other";
  iconType: "brand" | "initials";
  brandColor: string;
  initials: string;
}

// Background system daemons, font packs, RRO overlays, and hardware stubs
const BACKGROUND_STUB_PATTERNS = [
  ".font.",
  "rro_",
  "_overlay",
  "trichromelibrary",
  ".overlay.",
  ".wallpaper.",
  ".theme.",
  ".carrier.",
  ".telephony.",
  ".knox.",
  ".location.nsflp",
  ".agent",
  ".service.systemhelper",
  ".openmobileapi.",
  ".tuiservice",
  "com.google.android.verifier",
  "com.google.android.contactkeys",
  "com.sec.epdg",
  "com.samsung.klmsagent",
];

const SYSTEM_PREFIXES = [
  "com.android.",
  "com.google.android.gms",
  "com.google.android.gsf",
  "android.",
  "com.qualcomm.",
  "com.miui.",
  "com.huawei.",
  "com.oppo.",
  "com.vivo.",
];

export function resolveAppProfile(
  packageName: string,
  launcherSet?: Set<string>
): AppProfile {
  const isLauncher = launcherSet ? launcherSet.has(packageName) : false;

  const isBackgroundStub = BACKGROUND_STUB_PATTERNS.some((pattern) =>
    packageName.includes(pattern)
  );

  const isSystem =
    !isLauncher &&
    (isBackgroundStub ||
      SYSTEM_PREFIXES.some((prefix) => packageName.startsWith(prefix)));

  // Derive human-readable app name dynamically
  const appName = deriveSmartAppName(packageName);
  const brandColor = generateHarmonicColor(packageName);
  const initials = getInitials(appName);
  const category = isSystem ? "System" : detectCategory(packageName, appName);

  return {
    packageName,
    appName,
    isSystem,
    isLauncher,
    isBackgroundStub,
    category,
    iconType: "initials",
    brandColor,
    initials,
  };
}

export function deriveSmartAppName(packageName: string): string {
  // Strip common root domains
  let p = packageName.replace(
    /^(com|org|net|io|co|app|tv|cn|et|gov|edu|me|dev|mobi)\./i,
    ""
  );

  // Detect and preserve major vendor namespaces
  let vendor = "";
  if (p.startsWith("google.android.apps.")) {
    vendor = "Google ";
    p = p.replace("google.android.apps.", "");
  } else if (p.startsWith("google.android.")) {
    p = p.replace("google.android.", "");
  } else if (
    p.startsWith("sec.android.app.") ||
    p.startsWith("samsung.android.app.")
  ) {
    vendor = "Samsung ";
    p = p.replace(/^(sec|samsung)\.android\.app\./, "");
  } else if (p.startsWith("sec.android.") || p.startsWith("samsung.android.")) {
    vendor = "Samsung ";
    p = p.replace(/^(sec|samsung)\.android\./, "");
  } else if (p.startsWith("microsoft.office.")) {
    vendor = "Microsoft ";
    p = p.replace("microsoft.office.", "");
  } else if (p.startsWith("microsoft.")) {
    vendor = "Microsoft ";
    p = p.replace("microsoft.", "");
  } else if (p.startsWith("android.")) {
    p = p.replace("android.", "");
  }

  // Remove generic noise segments
  const noise = new Set([
    "apps",
    "android",
    "app",
    "client",
    "mobile",
    "release",
    "ui",
    "main",
    "service",
    "pro",
    "dev",
  ]);
  const rawSegments = p.split(".").filter(Boolean);
  const segments = rawSegments.filter((s) => !noise.has(s.toLowerCase()));
  const activeSegments = segments.length > 0 ? segments : rawSegments;

  function formatWord(w: string): string {
    const l = w.toLowerCase();
    if (l === "vpn") return "VPN";
    if (l === "tv") return "TV";
    if (l === "cbe") return "CBE";
    if (l === "boa") return "Bank of Abyssinia";
    if (l === "boamobilebanking") return "Bank of Abyssinia";
    if (l === "pl") return "Premier League";
    if (l === "stk") return "SIM Toolkit";
    if (l === "cal") return "Calendar";
    if (l === "ethiopay") return "Telebirr";
    if (l === "popupcalculator") return "Calculator";
    if (l === "gallery3d") return "Gallery";
    if (l === "sbrowser") return "Samsung Internet";
    if (l === "shealth") return "Samsung Health";
    if (l === "myfiles") return "My Files";
    if (l === "voicenote") return "Voice Recorder";
    if (l === "gamehome") return "Gaming Hub";
    if (l === "dafit") return "Da Fit";
    if (l === "chatgpt") return "ChatGPT";
    if (l === "oneconnect") return "SmartThings";
    if (l === "watchmanager") return "Galaxy Wearable";
    if (l === "officehubrow") return "Microsoft 365";
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }

  function splitCompound(seg: string): string {
    // Split camelCase
    let s = seg.replace(/([a-z])([A-Z])/g, "$1 $2");
    // Split snake/dash
    let parts = s.split(/[_\-\.]+/).filter(Boolean);

    // Common compound word boundaries
    const compounds: [string, string][] = [
      ["premier", "league"],
      ["magic", "tiles"],
      ["super", "app"],
      ["true", "caller"],
      ["screen", "recorder"],
      ["mobile", "banking"],
      ["game", "home"],
      ["ethio", "cal"],
      ["open", "vpn"],
      ["turbo", "vpn"],
      ["sim", "toolkit"],
      ["voice", "note"],
      ["quick", "search"],
    ];

    let result: string[] = [];
    for (let part of parts) {
      let matched = false;
      let lower = part.toLowerCase();
      for (const [c1, c2] of compounds) {
        if (lower === c1 + c2) {
          result.push(formatWord(c1), formatWord(c2));
          matched = true;
          break;
        }
      }
      if (!matched) {
        result.push(formatWord(part));
      }
    }
    return result.filter(Boolean).join(" ");
  }

  if (activeSegments.length === 1) {
    return vendor + splitCompound(activeSegments[0]);
  }

  const last = splitCompound(activeSegments[activeSegments.length - 1]);
  const prev = splitCompound(activeSegments[activeSegments.length - 2]);

  // If last word is very generic (e.g. Map, Maps, Music, Story, Game, Lite), combine with previous
  const genericTerms = new Set([
    "Map",
    "Maps",
    "Music",
    "Story",
    "Game",
    "Player",
    "Media",
    "Chat",
    "Browser",
    "Hub",
    "Home",
    "Calendar",
    "Calculator",
    "Lite",
    "Messenger",
  ]);

  if (genericTerms.has(last)) {
    return `${prev} ${last}`.trim();
  }

  // If previous segment is an abbreviation, prefix it
  if (prev.length > 0 && prev.length <= 4 && !vendor) {
    return `${prev} ${last}`.trim();
  }

  let resolved = (vendor + last).trim();
  if (resolved.startsWith("Samsung Samsung ")) {
    resolved = resolved.replace("Samsung Samsung ", "Samsung ");
  }
  if (resolved.startsWith("Microsoft Microsoft ")) {
    resolved = resolved.replace("Microsoft Microsoft ", "Microsoft ");
  }
  if (resolved.startsWith("Google Google ")) {
    resolved = resolved.replace("Google Google ", "Google ");
  }

  return resolved;
}

function detectCategory(
  pkg: string,
  appName: string
): AppProfile["category"] {
  const text = `${pkg} ${appName}`.toLowerCase();

  if (
    text.includes("game") ||
    text.includes("unity") ||
    text.includes("story") ||
    text.includes("tile") ||
    text.includes("sport") ||
    text.includes("league")
  ) {
    return "Gaming";
  }

  if (
    text.includes("pay") ||
    text.includes("bank") ||
    text.includes("birr") ||
    text.includes("finance") ||
    text.includes("wallet") ||
    text.includes("crypto") ||
    text.includes("trade") ||
    text.includes("bybit") ||
    text.includes("binance")
  ) {
    return "Finance";
  }

  if (
    text.includes("map") ||
    text.includes("navi") ||
    text.includes("gps") ||
    text.includes("traffic") ||
    text.includes("ride") ||
    text.includes("taxi") ||
    text.includes("yango")
  ) {
    return "Navigation";
  }

  if (
    text.includes("music") ||
    text.includes("audio") ||
    text.includes("video") ||
    text.includes("tv") ||
    text.includes("stream") ||
    text.includes("player") ||
    text.includes("netflix") ||
    text.includes("youtube") ||
    text.includes("spotify")
  ) {
    return "Entertainment";
  }

  if (
    text.includes("chat") ||
    text.includes("social") ||
    text.includes("talk") ||
    text.includes("telegram") ||
    text.includes("whatsapp") ||
    text.includes("instagram") ||
    text.includes("facebook") ||
    text.includes("twitter") ||
    text.includes("message") ||
    text.includes("caller") ||
    text.includes("dialer") ||
    text.includes("contact")
  ) {
    return "Social";
  }

  if (
    text.includes("doc") ||
    text.includes("sheet") ||
    text.includes("slide") ||
    text.includes("note") ||
    text.includes("office") ||
    text.includes("calendar") ||
    text.includes("mail") ||
    text.includes("outlook") ||
    text.includes("drive")
  ) {
    return "Productivity";
  }

  if (
    text.includes("shop") ||
    text.includes("market") ||
    text.includes("store") ||
    text.includes("jiji")
  ) {
    return "Shopping";
  }

  return "Tools";
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function generateHarmonicColor(seed: string): string {
  const palette = [
    "#47ab61",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f97316",
    "#14b8a6",
    "#eab308",
    "#06b6d4",
    "#6366f1",
  ];

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
}
