const TELEMETRY_KEY = "rebirthPlaytest:v1";
const MAX_EVENTS = 1000;

export interface PlaytestEvent {
  id: string;
  type: string;
  at: string;
  payload: Record<string, string | number | boolean | null>;
}

function eventId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readEvents(storage: Storage): PlaytestEvent[] {
  try {
    const raw = storage.getItem(TELEMETRY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as PlaytestEvent[] : [];
  } catch {
    return [];
  }
}

export function recordPlaytestEvent(
  type: string,
  payload: PlaytestEvent["payload"],
): void {
  try {
    const events = readEvents(localStorage);
    const next = [
      ...events,
      { id: eventId(), type, at: new Date().toISOString(), payload },
    ].slice(-MAX_EVENTS);
    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(next));
  } catch {
    // Local playtest data is optional and never blocks the game.
  }
}

export function playtestTelemetryExport(): string {
  const events = readEvents(localStorage);
  return JSON.stringify({
    format: "rebirth-research-playtest",
    version: 1,
    exportedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    events,
  }, null, 2);
}

export function clearPlaytestTelemetry(): void {
  try {
    localStorage.removeItem(TELEMETRY_KEY);
  } catch {
    // Optional local data.
  }
}
