"use client";

export const SAVE_KEYS = {
  LEAGUE: "apba_league_state_v1",
  LEAGUE_WOMENS: "wpba_league_state_v1",
  CAREER_HUB: "apba_mycareer_state_v1",
  CAREER_WOMENS: "wpba_mycareer_state_v1",
  FRANCHISE: "apba_franchise_state_v1",
  FRANCHISE_WOMENS: "wpba_franchise_state_v1",
  WORLD_TOUR_V2: "apba_world_tour_v2",
  WORLD_TOUR_WOMENS: "wpba_world_tour_v2",
  ALLSTAR_MENS: "apba_allstar_weekend_v1",
  ALLSTAR_WOMENS: "wpba_allstar_weekend_v1",
  ACTIVE_DIVISION: "gbc_active_league_division_v1",
  CUSTOMIZATION: "apba_customization_studio_v1",
  TRAINING: "apba_training_academy_v1",
  SETTINGS: "apba_game_settings_v1",
  UNIVERSE_V1: "adventureforge_universe_v1",
  // Legacy keys preserved for full backward compatibility
  LEGACY_ATHLETE: "hoops_created_athlete_v1",
  LEGACY_PROGRESSION: "hoops_career_progression_v1",
  LEGACY_AUDIO: "hoops_audio_settings_v1",
} as const;

export type SaveSlotKey = (typeof SAVE_KEYS)[keyof typeof SAVE_KEYS];

interface VersionedEnvelope<T> {
  v: 1;
  savedAt: string;
  checksum: number;
  data: T;
}

function computeSimpleChecksum(raw: string): number {
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function saveVersionedState<T>(key: string, data: T): { ok: boolean; error?: string } {
  if (typeof window === "undefined") return { ok: false, error: "SSR context" };
  try {
    const serializedData = JSON.stringify(data);
    const envelope: VersionedEnvelope<T> = {
      v: 1,
      savedAt: new Date().toISOString(),
      checksum: computeSimpleChecksum(serializedData),
      data,
    };
    const nextPayload = JSON.stringify(envelope);

    // Keep previous valid snapshot in a backup key before replacing primary
    const existing = window.localStorage.getItem(key);
    if (existing) {
      try {
        window.localStorage.setItem(`${key}__backup`, existing);
      } catch {
        // Quota might be tight; still try writing primary
      }
    }

    window.localStorage.setItem(key, nextPayload);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to persist save state",
    };
  }
}

export interface LoadResult<T> {
  data: T;
  recoveredFromBackup: boolean;
  corruptedReset: boolean;
  savedAt?: string;
}

export function loadVersionedState<T>(
  key: string,
  fallbackFactory: () => T,
  validator?: (candidate: unknown) => candidate is T
): LoadResult<T> {
  if (typeof window === "undefined") {
    return { data: fallbackFactory(), recoveredFromBackup: false, corruptedReset: false };
  }

  const tryParseSlot = (raw: string | null): { valid: boolean; data?: T; savedAt?: string } => {
    if (!raw) return { valid: false };
    try {
      const parsed = JSON.parse(raw) as Partial<VersionedEnvelope<T>> | T;
      if (
        parsed &&
        typeof parsed === "object" &&
        "v" in parsed &&
        parsed.v === 1 &&
        "data" in parsed &&
        "checksum" in parsed
      ) {
        const env = parsed as VersionedEnvelope<T>;
        const reserialized = JSON.stringify(env.data);
        if (computeSimpleChecksum(reserialized) !== env.checksum) {
          return { valid: false };
        }
        if (validator && !validator(env.data)) {
          return { valid: false };
        }
        return { valid: true, data: env.data, savedAt: env.savedAt };
      }
      // Support raw un-enveloped objects if validator passes
      if (validator && validator(parsed)) {
        return { valid: true, data: parsed };
      }
      return { valid: false };
    } catch {
      return { valid: false };
    }
  };

  const primary = tryParseSlot(window.localStorage.getItem(key));
  if (primary.valid && primary.data !== undefined) {
    return {
      data: primary.data,
      recoveredFromBackup: false,
      corruptedReset: false,
      savedAt: primary.savedAt,
    };
  }

  // Primary missing or corrupted -> try backup
  const hadPrimary = window.localStorage.getItem(key) !== null;
  const backup = tryParseSlot(window.localStorage.getItem(`${key}__backup`));
  if (backup.valid && backup.data !== undefined) {
    // Restore backup to primary
    saveVersionedState(key, backup.data);
    return {
      data: backup.data,
      recoveredFromBackup: true,
      corruptedReset: false,
      savedAt: backup.savedAt,
    };
  }

  // Fallback cleanly
  const fresh = fallbackFactory();
  return {
    data: fresh,
    recoveredFromBackup: false,
    corruptedReset: hadPrimary,
  };
}

export interface FullBackupBundle {
  format: "UBCE_SAVE_BUNDLE_V1";
  exportedAt: string;
  slots: Record<string, string>;
}

export function exportAllSavesBundle(): FullBackupBundle {
  const slots: Record<string, string> = {};
  if (typeof window !== "undefined") {
    for (const key of Object.values(SAVE_KEYS)) {
      const val = window.localStorage.getItem(key);
      if (val !== null) {
        slots[key] = val;
      }
    }
  }
  return {
    format: "UBCE_SAVE_BUNDLE_V1",
    exportedAt: new Date().toISOString(),
    slots,
  };
}

export function importAllSavesBundle(jsonText: string): {
  ok: boolean;
  restoredKeys: string[];
  error?: string;
} {
  if (typeof window === "undefined") {
    return { ok: false, restoredKeys: [], error: "Unavailable outside browser" };
  }
  try {
    const parsed = JSON.parse(jsonText) as Partial<FullBackupBundle>;
    if (!parsed || parsed.format !== "UBCE_SAVE_BUNDLE_V1" || !parsed.slots || typeof parsed.slots !== "object") {
      return { ok: false, restoredKeys: [], error: "Invalid save bundle format" };
    }
    const allowed = new Set<string>(Object.values(SAVE_KEYS));
    const restoredKeys: string[] = [];
    for (const [k, v] of Object.entries(parsed.slots)) {
      if (allowed.has(k) && typeof v === "string") {
        // Verify JSON is parseable before writing
        JSON.parse(v);
        const current = window.localStorage.getItem(k);
        if (current) {
          window.localStorage.setItem(`${k}__backup`, current);
        }
        window.localStorage.setItem(k, v);
        restoredKeys.push(k);
      }
    }
    if (restoredKeys.length === 0) {
      return { ok: false, restoredKeys: [], error: "No valid save slots found in backup file" };
    }
    return { ok: true, restoredKeys };
  } catch (err) {
    return {
      ok: false,
      restoredKeys: [],
      error: err instanceof Error ? err.message : "Corrupted backup JSON",
    };
  }
}

export function getStorageInventory(): {
  key: string;
  label: string;
  hasSave: boolean;
  hasBackup: boolean;
  bytes: number;
}[] {
  const labels: Record<string, string> = {
    [SAVE_KEYS.LEAGUE]: "APBA Men's Season & Playoffs",
    [SAVE_KEYS.LEAGUE_WOMENS]: "WPBA Women's Season & Playoffs",
    [SAVE_KEYS.CAREER_HUB]: "Men's My Career & Contracts",
    [SAVE_KEYS.CAREER_WOMENS]: "Women's My Career & Contracts",
    [SAVE_KEYS.FRANCHISE]: "Men's Franchise Front Office",
    [SAVE_KEYS.FRANCHISE_WOMENS]: "Women's Franchise Front Office",
    [SAVE_KEYS.WORLD_TOUR_V2]: "World Tour & International Cups (Men)",
    [SAVE_KEYS.WORLD_TOUR_WOMENS]: "World Tour & International Cups (Women)",
    [SAVE_KEYS.ALLSTAR_MENS]: "Men's All-Star Weekend Records",
    [SAVE_KEYS.ALLSTAR_WOMENS]: "Women's All-Star Weekend Records",
    [SAVE_KEYS.CUSTOMIZATION]: "Customization Studio",
    [SAVE_KEYS.TRAINING]: "Training Academy Records",
    [SAVE_KEYS.SETTINGS]: "Audio & Broadcast Settings",
    [SAVE_KEYS.LEGACY_ATHLETE]: "Created Athlete Profile",
    [SAVE_KEYS.LEGACY_PROGRESSION]: "Locker Room Unlocks & XP",
  };
  if (typeof window === "undefined") {
    return Object.entries(labels).map(([key, label]) => ({
      key,
      label,
      hasSave: false,
      hasBackup: false,
      bytes: 0,
    }));
  }
  return Object.entries(labels).map(([key, label]) => {
    const raw = window.localStorage.getItem(key);
    const bak = window.localStorage.getItem(`${key}__backup`);
    return {
      key,
      label,
      hasSave: raw !== null,
      hasBackup: bak !== null,
      bytes: raw ? raw.length : 0,
    };
  });
}
