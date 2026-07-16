import type { ExperienceMode } from "../types";

export type PlatformMode = "story" | "committee" | "daily" | "studio";
export type AppDestination = "menu" | PlatformMode;

export const PLATFORM_MODES: ReadonlyArray<{
  id: PlatformMode;
  label: string;
  short: string;
}> = [
  { id: "story", label: "年度剧情", short: "十二个月主线" },
  { id: "committee", label: "投委会", short: "独立答辩模式" },
  { id: "daily", label: "每日挑战", short: "全员同题" },
  { id: "studio", label: "内容工坊", short: "创作社区案例" },
];

const PLATFORM_MODE_IDS = new Set<PlatformMode>(
  PLATFORM_MODES.map((mode) => mode.id),
);

// These parameters all predate the start menu and used to open the story directly.
// Keeping them here prevents bookmarks and prototype links from unexpectedly landing
// one level higher in the new information architecture.
const LEGACY_STORY_PARAMS = ["year", "pixivn", "pixi", "staticStage"] as const;

interface StorageReader {
  getItem(key: string): string | null;
}

function isPlatformMode(value: string | null): value is PlatformMode {
  return value !== null && PLATFORM_MODE_IDS.has(value as PlatformMode);
}

function hasLegacyStoryTarget(params: URLSearchParams): boolean {
  return LEGACY_STORY_PARAMS.some((key) => params.has(key));
}

export function appDestinationFromSearch(search: string): AppDestination {
  const params = new URLSearchParams(search);
  const mode = params.get("mode");
  if (isPlatformMode(mode)) return mode;
  return hasLegacyStoryTarget(params) ? "story" : "menu";
}

/**
 * Compatibility helper for callers that still expect one of the four playable
 * platform modes. New shell code should use appDestinationFromSearch instead.
 */
export function platformModeFromSearch(search: string): PlatformMode {
  const destination = appDestinationFromSearch(search);
  return destination === "menu" ? "story" : destination;
}

function relativeUrl(url: URL): string {
  return `${url.pathname}${url.search}${url.hash}`;
}

function clearStoryTarget(params: URLSearchParams): void {
  for (const key of LEGACY_STORY_PARAMS) params.delete(key);
  params.delete("play");
  params.delete("new");
}

function experienceModeIn(value: unknown): ExperienceMode | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (record.experienceMode === "romance" || record.experienceMode === "career") {
    return record.experienceMode;
  }
  return experienceModeIn(record.rebirth);
}

export function storedExperienceMode(
  storage: StorageReader,
  year = "2025",
): ExperienceMode {
  const keys = [
    `rebirthSession:v1:${year}`,
    `rebirthMeta:v4:${year}`,
    `rebirthMeta:v3:${year}`,
  ];

  for (const key of keys) {
    try {
      const raw = storage.getItem(key);
      if (!raw) continue;
      const mode = experienceModeIn(JSON.parse(raw) as unknown);
      if (mode) return mode;
    } catch {
      // Keep checking older local formats when one entry is unavailable or corrupt.
    }
  }
  return "career";
}

export function hasStoredGame(storage: StorageReader, year = "2025"): boolean {
  for (const key of [`rebirthSession:v1:${year}`, `rebirthGameState:v2:${year}`]) {
    try {
      const raw = storage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed !== "object" || parsed === null) continue;
      const record = parsed as Record<string, unknown>;
      const state = typeof record.state === "object" && record.state !== null
        ? record.state as Record<string, unknown>
        : record;
      if (state.year === year) return true;
    } catch {
      // Corrupt browser entries are not resumable saves.
    }
  }
  return false;
}

export function appDestinationUrl(
  destination: AppDestination,
  href: string = window.location.href,
): string {
  const url = new URL(href);
  clearStoryTarget(url.searchParams);

  if (destination === "menu") url.searchParams.delete("mode");
  else url.searchParams.set("mode", destination);

  return relativeUrl(url);
}

export function platformModeUrl(
  mode: PlatformMode,
  href: string = window.location.href,
): string {
  return appDestinationUrl(mode, href);
}

export function newGameUrl(
  experience: ExperienceMode,
  href: string = window.location.href,
): string {
  const url = new URL(appDestinationUrl("story", href), href);
  url.searchParams.set("play", experience);
  url.searchParams.set("new", "1");
  return relativeUrl(url);
}

export function continueGameUrl(
  storage: StorageReader,
  href: string = window.location.href,
  year = "2025",
): string {
  const url = new URL(appDestinationUrl("story", href), href);
  url.searchParams.set("play", storedExperienceMode(storage, year));
  if (year !== "2025") url.searchParams.set("year", year);
  return relativeUrl(url);
}

export function navigatePlatformMode(mode: PlatformMode): void {
  window.location.assign(platformModeUrl(mode));
}
