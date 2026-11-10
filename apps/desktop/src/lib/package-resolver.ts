// Smart package resolver for human-readable app names, categories, and brand identities

export interface AppProfile {
  packageName: string;
  appName: string;
  isSystem: boolean;
  category: "Social" | "Entertainment" | "Finance" | "Tools" | "Productivity" | "Shopping" | "System" | "Other";
  iconType: "brand" | "initials";
  brandColor: string;
  initials: string;
}

const KNOWN_APPS: Record<string, { name: string; category: AppProfile["category"]; color: string }> = {
  // Streaming & Media
  "com.spotify.music": { name: "Spotify", category: "Entertainment", color: "#1DB954" },
  "com.google.android.youtube": { name: "YouTube", category: "Entertainment", color: "#FF0000" },
  "com.google.android.apps.youtube.music": { name: "YouTube Music", category: "Entertainment", color: "#FF0000" },
  "com.netflix.mediaclient": { name: "Netflix", category: "Entertainment", color: "#E50914" },
  "com.disney.disneyplus": { name: "Disney+", category: "Entertainment", color: "#113CCF" },
  "tv.twitch.android.app": { name: "Twitch", category: "Entertainment", color: "#9146FF" },

  // Communication & Social
  "org.telegram.messenger": { name: "Telegram", category: "Social", color: "#229ED9" },
  "org.telegram.messenger.web": { name: "Telegram Web", category: "Social", color: "#229ED9" },
  "com.whatsapp": { name: "WhatsApp", category: "Social", color: "#25D366" },
  "com.whatsapp.w4b": { name: "WhatsApp Business", category: "Social", color: "#25D366" },
  "com.instagram.android": { name: "Instagram", category: "Social", color: "#E1306C" },
  "com.facebook.katana": { name: "Facebook", category: "Social", color: "#1877F2" },
  "com.twitter.android": { name: "X (Twitter)", category: "Social", color: "#000000" },
  "com.zhiliaoapp.musically": { name: "TikTok", category: "Social", color: "#00F2FE" },
  "com.discord": { name: "Discord", category: "Social", color: "#5865F2" },
  "com.snapchat.android": { name: "Snapchat", category: "Social", color: "#FFFC00" },
  "com.linkedin.android": { name: "LinkedIn", category: "Social", color: "#0A66C2" },

  // AI & Productivity
  "com.openai.chatgpt": { name: "ChatGPT", category: "Productivity", color: "#10A37F" },
  "com.google.android.apps.docs": { name: "Google Docs", category: "Productivity", color: "#4285F4" },
  "com.google.android.apps.docs.editors.sheets": { name: "Google Sheets", category: "Productivity", color: "#0F9D58" },
  "com.google.android.apps.docs.editors.slides": { name: "Google Slides", category: "Productivity", color: "#F4B400" },
  "com.google.android.keep": { name: "Google Keep", category: "Productivity", color: "#FBBC04" },
  "com.notion.id": { name: "Notion", category: "Productivity", color: "#000000" },
  "com.microsoft.office.word": { name: "Microsoft Word", category: "Productivity", color: "#2B579A" },
  "com.microsoft.office.excel": { name: "Microsoft Excel", category: "Productivity", color: "#217346" },

  // Browsers & Tools
  "com.android.chrome": { name: "Google Chrome", category: "Tools", color: "#4285F4" },
  "org.mozilla.firefox": { name: "Firefox", category: "Tools", color: "#FF7139" },
  "com.sec.android.app.sbrowser": { name: "Samsung Internet", category: "Tools", color: "#1249D6" },
  "com.brave.browser": { name: "Brave Browser", category: "Tools", color: "#FB542B" },
  "com.google.android.gm": { name: "Gmail", category: "Productivity", color: "#EA4335" },
  "com.google.android.apps.maps": { name: "Google Maps", category: "Tools", color: "#34A853" },

  // Finance & Commerce
  "com.bybit.app": { name: "Bybit", category: "Finance", color: "#F7A600" },
  "com.binance.dev": { name: "Binance", category: "Finance", color: "#F3BA2F" },
  "com.coinbase.android": { name: "Coinbase", category: "Finance", color: "#0052FF" },
  "com.cbe.superapp": { name: "CBE Superapp", category: "Finance", color: "#7B1FA2" },
  "et.jiji.app": { name: "Jiji", category: "Shopping", color: "#3DB83A" },
  "com.amazon.mShop.android.shopping": { name: "Amazon", category: "Shopping", color: "#FF9900" },
  "com.ebay.mobile": { name: "eBay", category: "Shopping", color: "#E53238" },
};

const SYSTEM_PREFIXES = [
  "com.android.",
  "com.google.android.gms",
  "com.google.android.gsf",
  "com.sec.android.",
  "com.samsung.",
  "android.",
  "com.qualcomm.",
  "com.miui.",
  "com.huawei.",
  "com.oppo.",
  "com.vivo.",
];

export function resolveAppProfile(packageName: string): AppProfile {
  const isSystem = SYSTEM_PREFIXES.some(prefix => packageName.startsWith(prefix)) &&
    !KNOWN_APPS[packageName];

  // 1. Check known catalog
  if (KNOWN_APPS[packageName]) {
    const known = KNOWN_APPS[packageName];
    return {
      packageName,
      appName: known.name,
      isSystem,
      category: known.category,
      iconType: "brand",
      brandColor: known.color,
      initials: getInitials(known.name),
    };
  }

  // 2. Derive human-readable name from package segments
  const parts = packageName.split(".").filter(Boolean);
  let meaningful = parts[parts.length - 1];
  
  // If the last part is generic ("app", "android", "mobile", "client", "ui"), use previous
  const genericTerms = new Set(["app", "android", "mobile", "client", "ui", "main", "release"]);
  if (parts.length > 2 && genericTerms.has(meaningful.toLowerCase())) {
    meaningful = parts[parts.length - 2];
  }

  // Clean and title-case
  const appName = formatSegment(meaningful);
  const brandColor = generateHarmonicColor(packageName);
  const initials = getInitials(appName);

  return {
    packageName,
    appName,
    isSystem,
    category: isSystem ? "System" : "Other",
    iconType: "initials",
    brandColor,
    initials,
  };
}

function formatSegment(segment: string): string {
  // Replace underscores and hyphens with spaces
  let text = segment.replace(/[_-]+/g, " ");
  
  // Split camelCase or PascalCase
  text = text.replace(/([a-z])([A-Z])/g, "$1 $2");

  // Title case each word
  return text
    .split(" ")
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
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
    "#47ab61", // Rize Green
    "#3b82f6", // Blue
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#f97316", // Orange
    "#14b8a6", // Teal
    "#eab308", // Amber
    "#06b6d4", // Cyan
    "#6366f1", // Indigo
  ];

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
}
