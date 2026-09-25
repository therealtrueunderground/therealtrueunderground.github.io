export type Settings = {
  theme: "dark" | "light" | "mocha" | "latte";
  font: "jetbrains" | "ibm-plex" | "system";
  fontSize: number;
  lineHeight: number;
  accent: "ice" | "violet" | "amber" | "mint" | "rose";
  wrap: boolean;
  readingWidth: number;
  sidebarPosition: "left" | "right";
};

export const defaultSettings: Settings = {
  theme: "dark",
  font: "jetbrains",
  fontSize: 16,
  lineHeight: 1.6,
  accent: "ice",
  wrap: true,
  readingWidth: 82,
  sidebarPosition: "left",
};

export const SETTINGS_KEY = "talvnn-portfolio-settings-v1";

export function parseStoredSettings(raw: string | null): Settings {
  if (!raw) return defaultSettings;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return defaultSettings;
    const data = value as Record<string, unknown>;
    if (!["dark", "light", "mocha", "latte"].includes(String(data.theme))) return defaultSettings;
    if (!["jetbrains", "ibm-plex", "system"].includes(String(data.font))) return defaultSettings;
    if (!["ice", "violet", "amber", "mint", "rose"].includes(String(data.accent))) return defaultSettings;
    if (typeof data.fontSize !== "number" || !Number.isFinite(data.fontSize) || data.fontSize < 14 || data.fontSize > 22) return defaultSettings;
    if (typeof data.lineHeight !== "number" || !Number.isFinite(data.lineHeight) || data.lineHeight < 1.3 || data.lineHeight > 2) return defaultSettings;
    if (typeof data.readingWidth !== "number" || !Number.isFinite(data.readingWidth) || data.readingWidth < 60 || data.readingWidth > 110) return defaultSettings;
    if (typeof data.wrap !== "boolean") return defaultSettings;
    const sidebarPosition = data.sidebarPosition === "right" ? "right" : "left";
    return {
      theme: data.theme as Settings["theme"],
      font: data.font as Settings["font"],
      fontSize: data.fontSize,
      lineHeight: data.lineHeight,
      accent: data.accent as Settings["accent"],
      wrap: data.wrap,
      readingWidth: data.readingWidth,
      sidebarPosition,
    };
  } catch {
    return defaultSettings;
  }
}
