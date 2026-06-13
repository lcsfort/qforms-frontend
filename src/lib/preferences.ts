"use client";

import { useSyncExternalStore } from "react";
import { api } from "@/lib/api";
import { type FormBuildMode } from "@/lib/types";

/** Rules that decide what flags a form under "Needs attention" on the dashboard. */
export interface AttentionPreferences {
  lowCompletionEnabled: boolean;
  /** Published forms converting below this % are flagged. */
  lowCompletionThreshold: number;
  /** Minimum started sessions before completion is judged. */
  minSessions: number;
  noResponsesEnabled: boolean;
  /** Minimum views before "no responses yet" is flagged. */
  minViews: number;
  draftIdleEnabled: boolean;
  /** Days without edits before a draft is flagged. */
  draftIdleDays: number;
}

export interface AppPreferences {
  /** Default layout of the dashboard forms list. */
  formsView: "grid" | "list";
  /** Whether the desktop sidebar is collapsed to an icon rail. */
  sidebarCollapsed: boolean;
  /** How the AI builder starts when creating a form. */
  defaultBuildMode: FormBuildMode;
  /** IANA timezone for scheduling and timestamps; null follows the device. */
  timezone: string | null;
  attention: AttentionPreferences;
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  formsView: "grid",
  sidebarCollapsed: false,
  defaultBuildMode: "planning",
  timezone: null,
  attention: {
    lowCompletionEnabled: true,
    lowCompletionThreshold: 40,
    minSessions: 5,
    noResponsesEnabled: true,
    minViews: 5,
    draftIdleEnabled: true,
    draftIdleDays: 7,
  },
};

const STORAGE_KEY = "qforms-preferences";

let cached: AppPreferences | null = null;
const listeners = new Set<() => void>();

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number.NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

/** Date APIs throw on unknown zone names, so anything stored must actually resolve. */
function isValidTimezone(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 64) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function normalize(raw: unknown): AppPreferences {
  const base = DEFAULT_PREFERENCES;
  if (typeof raw !== "object" || raw === null) return base;
  const data = raw as Partial<AppPreferences> & { attention?: Partial<AttentionPreferences> };
  const attention: Partial<AttentionPreferences> = data.attention ?? {};
  return {
    formsView: data.formsView === "list" ? "list" : "grid",
    sidebarCollapsed: typeof data.sidebarCollapsed === "boolean" ? data.sidebarCollapsed : base.sidebarCollapsed,
    defaultBuildMode: data.defaultBuildMode === "straight" ? "straight" : "planning",
    timezone: isValidTimezone(data.timezone) ? data.timezone : null,
    attention: {
      lowCompletionEnabled: attention.lowCompletionEnabled ?? base.attention.lowCompletionEnabled,
      lowCompletionThreshold: clampNumber(attention.lowCompletionThreshold, base.attention.lowCompletionThreshold, 5, 95),
      minSessions: clampNumber(attention.minSessions, base.attention.minSessions, 1, 100),
      noResponsesEnabled: attention.noResponsesEnabled ?? base.attention.noResponsesEnabled,
      minViews: clampNumber(attention.minViews, base.attention.minViews, 1, 100),
      draftIdleEnabled: attention.draftIdleEnabled ?? base.attention.draftIdleEnabled,
      draftIdleDays: clampNumber(attention.draftIdleDays, base.attention.draftIdleDays, 1, 90),
    },
  };
}

function readStored(): AppPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return normalize(JSON.parse(raw));
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function getPreferences(): AppPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  if (!cached) cached = readStored();
  return cached;
}

export function savePreferences(
  patch: Partial<Omit<AppPreferences, "attention">> & { attention?: Partial<AttentionPreferences> },
): void {
  const current = getPreferences();
  cached = normalize({
    ...current,
    ...patch,
    attention: { ...current.attention, ...(patch.attention ?? {}) },
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch {
    // Storage may be unavailable (private mode); preferences still apply in-memory.
  }
  listeners.forEach((listener) => listener());
  schedulePush();
}


/** The timezone everything date-related should use: the preference, else the device's. */
export function getEffectiveTimezone(preferences: AppPreferences): string {
  if (preferences.timezone) return preferences.timezone;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  } catch {
    return "UTC";
  }
}

/* ── Account-level persistence ──────────────────────────────────────────
   The backend is the source of truth; localStorage is a fast local cache
   so the UI never flashes defaults while the account copy loads. */

let pushTimer: number | null = null;
let hasUnsyncedChanges = false;
let serverHydrated = false;
let flushListenerRegistered = false;

function getStoredToken(): string | null {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

async function pushToServer(): Promise<void> {
  const token = getStoredToken();
  if (!token) return;
  try {
    await api.updatePreferences(token, getPreferences() as unknown as Record<string, unknown>);
    hasUnsyncedChanges = false;
  } catch {
    // Keep the local copy; the next change (or page load) retries.
  }
}

function schedulePush(): void {
  hasUnsyncedChanges = true;
  if (!flushListenerRegistered && typeof window !== "undefined") {
    flushListenerRegistered = true;
    window.addEventListener("pagehide", () => {
      if (hasUnsyncedChanges) void pushToServer();
    });
  }
  if (pushTimer != null) window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    pushTimer = null;
    void pushToServer();
  }, 600);
}

/** Loads the account copy once per app load; falls back to the local cache on failure. */
export async function hydratePreferencesFromServer(token: string): Promise<void> {
  if (serverHydrated) return;
  serverHydrated = true;
  try {
    const { preferences } = await api.getPreferences(token);
    const serverIsEmpty = !preferences || Object.keys(preferences).length === 0;

    if (serverIsEmpty) {
      // First sync for this account: publish whatever this device already customized.
      if (JSON.stringify(getPreferences()) !== JSON.stringify(DEFAULT_PREFERENCES)) {
        void pushToServer();
      }
      return;
    }

    if (hasUnsyncedChanges) {
      // The user changed something before the fetch finished — local wins.
      void pushToServer();
      return;
    }

    cached = normalize(preferences);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    } catch {
      // Cache write is best-effort.
    }
    listeners.forEach((listener) => listener());
  } catch {
    serverHydrated = false; // allow a retry on the next mount
  }
}


/** Clears all preference state on auth teardown so accounts never share settings on a device. */
export function resetPreferences(): void {
  if (pushTimer != null) {
    window.clearTimeout(pushTimer);
    pushTimer = null;
  }
  hasUnsyncedChanges = false;
  serverHydrated = false;
  cached = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best effort.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cached = readStored();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function usePreferences(): AppPreferences {
  return useSyncExternalStore(subscribe, getPreferences, () => DEFAULT_PREFERENCES);
}
