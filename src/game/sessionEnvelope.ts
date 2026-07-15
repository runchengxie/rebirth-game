import type { GameState } from "../types";

const SESSION_FORMAT = "rebirth-research-session";
const SESSION_VERSION = 1;

export interface SessionEnvelope {
  format: typeof SESSION_FORMAT;
  version: typeof SESSION_VERSION;
  year: string;
  revision: number;
  updatedAt: string;
  state: GameState;
  rebirth: unknown;
}

export function sessionEnvelopeKey(year: string): string {
  return `rebirthSession:v1:${year}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isSessionEnvelope(value: unknown): value is SessionEnvelope {
  if (!isRecord(value)) return false;
  if (value.format !== SESSION_FORMAT || value.version !== SESSION_VERSION) return false;
  if (typeof value.year !== "string" || typeof value.revision !== "number") return false;
  if (typeof value.updatedAt !== "string" || !isRecord(value.state)) return false;
  return value.state.year === value.year;
}

export function readSessionEnvelope(
  storage: Storage,
  year: string,
): SessionEnvelope | null {
  try {
    const raw = storage.getItem(sessionEnvelopeKey(year));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isSessionEnvelope(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSessionEnvelope(
  storage: Storage,
  state: GameState,
  rebirth: unknown,
): SessionEnvelope | null {
  try {
    const previous = readSessionEnvelope(storage, state.year);
    const envelope: SessionEnvelope = {
      format: SESSION_FORMAT,
      version: SESSION_VERSION,
      year: state.year,
      revision: (previous?.revision ?? 0) + 1,
      updatedAt: new Date().toISOString(),
      state,
      rebirth,
    };
    storage.setItem(sessionEnvelopeKey(state.year), JSON.stringify(envelope));
    return envelope;
  } catch {
    return null;
  }
}

export function restoreSessionEnvelopeForUrl(
  storage: Storage,
  search: string,
): boolean {
  try {
    const requestedYear = new URLSearchParams(search).get("year");
    const year = requestedYear || "2025";
    const envelope = readSessionEnvelope(storage, year);
    if (!envelope) return false;

    storage.setItem(`rebirthGameState:v2:${year}`, JSON.stringify(envelope.state));
    storage.setItem(`rebirthMeta:v3:${year}`, JSON.stringify(envelope.rebirth));
    return true;
  } catch {
    return false;
  }
}
