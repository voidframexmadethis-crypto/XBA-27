export type PlayerPosition = "PG" | "SG" | "SF" | "PF" | "C";

export type PlaystyleArchetype =
  | "Sharpshooter"
  | "Slashing Playmaker"
  | "Two-Way Lockdown"
  | "Stretch Big";

export interface AthleteAttributes {
  shooting: number; // 60 - 99
  finishing: number; // 60 - 99
  handles: number; // 60 - 99
  defense: number; // 60 - 99
}

export interface DraftRecord {
  drafted: boolean;
  pickNumber: number;
  round: number;
  teamName: string;
  teamCity: string;
  teamColor: string;
  teamSecondary: string;
  cityId: string;
  draftedAt: string;
}

export interface AthleteProfile {
  firstName: string;
  lastName: string;
  jerseyNumber: string;
  position: PlayerPosition;
  archetype: PlaystyleArchetype;
  heightInches: number; // 70 (5'10") to 85 (7'1")
  skinToneHex: string;
  jerseyColorHex: string;
  shortsColorHex: string;
  shoeColorHex: string;
  headbandEnabled: boolean;
  headbandColorHex: string;
  attributes: AthleteAttributes;
  draftRecord: DraftRecord | null;
}

export const SKIN_TONES = [
  { id: "tone_1", label: "Deep Espresso", hex: "#4a2c18" },
  { id: "tone_2", label: "Rich Umber", hex: "#6f4124" },
  { id: "tone_3", label: "Warm Bronze", hex: "#8d5524" },
  { id: "tone_4", label: "Golden Tan", hex: "#b87a4b" },
  { id: "tone_5", label: "Light Olive", hex: "#d6a17a" },
  { id: "tone_6", label: "Fair Peach", hex: "#ecc1a1" },
];

export const ARCHETYPE_PRESETS: Record<
  PlaystyleArchetype,
  { description: string; attributes: AthleteAttributes }
> = {
  Sharpshooter: {
    description: "Deadeye perimeter threat with effortless deep range.",
    attributes: { shooting: 92, finishing: 74, handles: 82, defense: 72 },
  },
  "Slashing Playmaker": {
    description: "Explosive first step, elite handles, and high-flying dunks.",
    attributes: { shooting: 78, finishing: 92, handles: 90, defense: 74 },
  },
  "Two-Way Lockdown": {
    description: "Relentless perimeter defender who sparks fast-break buckets.",
    attributes: { shooting: 80, finishing: 80, handles: 78, defense: 93 },
  },
  "Stretch Big": {
    description: "Towering paint presence capable of spacing the floor.",
    attributes: { shooting: 84, finishing: 88, handles: 70, defense: 86 },
  },
};

export const DRAFT_FRANCHISES = [
  { pick: 1, cityId: "us_nyc", teamName: "New York Monarchs", teamCity: "New York", color: "#006bb6", secondary: "#f58426" },
  { pick: 2, cityId: "us_la", teamName: "Los Angeles Royals", teamCity: "Los Angeles", color: "#552583", secondary: "#fdb927" },
  { pick: 3, cityId: "us_chicago", teamName: "Chicago Red Horns", teamCity: "Chicago", color: "#ce1141", secondary: "#111111" },
  { pick: 4, cityId: "us_miami", teamName: "Miami Sun Blaze", teamCity: "Miami", color: "#98002e", secondary: "#f9a01b" },
  { pick: 5, cityId: "us_sf", teamName: "Golden Bay Warriors", teamCity: "San Francisco", color: "#1d428a", secondary: "#ffc72c" },
  { pick: 6, cityId: "eu_paris", teamName: "Paris Metropolitans", teamCity: "Paris", color: "#111827", secondary: "#3b82f6" },
  { pick: 7, cityId: "as_tokyo", teamName: "Tokyo Cyber Samurai", teamCity: "Tokyo", color: "#dc2626", secondary: "#ffffff" },
  { pick: 8, cityId: "ar_buenosaires", teamName: "Buenos Aires Gauchos", teamCity: "Buenos Aires", color: "#0284c7", secondary: "#ffffff" },
];

const ATHLETE_STORAGE_KEY = "hoops_created_athlete_v1";

export function formatHeight(inches: number): string {
  const ft = Math.floor(inches / 12);
  const rem = inches % 12;
  return `${ft}'${rem}"`;
}

export function calculateOverallRating(attrs: AthleteAttributes): number {
  const avg = (attrs.shooting + attrs.finishing + attrs.handles + attrs.defense) / 4;
  return Math.round(avg);
}

export function getDefaultAthleteProfile(): AthleteProfile {
  return {
    firstName: "JORDAN",
    lastName: "MERCER",
    jerseyNumber: "23",
    position: "PG",
    archetype: "Slashing Playmaker",
    heightInches: 75, // 6'3"
    skinToneHex: "#8d5524",
    jerseyColorHex: "#c8102e",
    shortsColorHex: "#161616",
    shoeColorHex: "#f5f5f5",
    headbandEnabled: false,
    headbandColorHex: "#ffffff",
    attributes: { ...ARCHETYPE_PRESETS["Slashing Playmaker"].attributes },
    draftRecord: null,
  };
}

export function loadAthleteProfile(): AthleteProfile {
  if (typeof window === "undefined") return getDefaultAthleteProfile();
  try {
    const raw = localStorage.getItem(ATHLETE_STORAGE_KEY);
    if (!raw) return getDefaultAthleteProfile();
    const parsed = JSON.parse(raw);
    const defaults = getDefaultAthleteProfile();
    return {
      ...defaults,
      ...parsed,
      attributes: {
        ...defaults.attributes,
        ...(parsed.attributes || {}),
      },
    };
  } catch {
    return getDefaultAthleteProfile();
  }
}

export function saveAthleteProfile(profile: AthleteProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ATHLETE_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("Failed to save athlete profile", e);
  }
}
