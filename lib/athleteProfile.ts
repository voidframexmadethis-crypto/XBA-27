import type { HairStyleType, FacialHairType } from "./nba2kGraphics.ts";

export type PlayerPosition = "PG" | "SG" | "SF" | "PF" | "C";
export type AthleteGender = "male" | "female";
export type BodyProportion = "lean" | "athletic" | "power";
export type ActiveLeagueDivision = "mens" | "womens";

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
  gender: AthleteGender;
  hairStyle: HairStyleType;
  facialHair: FacialHairType;
  hairColorHex: string;
  bodyProportion: BodyProportion;
  heightInches: number; // 66 (5'6") to 85 (7'1")
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

export const HAIR_COLORS = [
  { id: "hair_jet", label: "Jet Black", hex: "#151210" },
  { id: "hair_espresso", label: "Dark Brown", hex: "#2f1e14" },
  { id: "hair_chestnut", label: "Chestnut", hex: "#5a351c" },
  { id: "hair_blonde", label: "Gold Blonde", hex: "#c89d54" },
  { id: "hair_crimson", label: "Arena Red", hex: "#991b1b" },
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
  { pick: 1, cityId: "us_nyc", teamName: "Empire Monarchs", teamCity: "New York", color: "#006bb6", secondary: "#f58426" },
  { pick: 2, cityId: "us_la", teamName: "Pacific Eclipse", teamCity: "Los Angeles", color: "#552583", secondary: "#fdb927" },
  { pick: 3, cityId: "us_chicago", teamName: "Lakeshore Gale", teamCity: "Chicago", color: "#ce1141", secondary: "#111111" },
  { pick: 4, cityId: "us_miami", teamName: "Bayfront Solaris", teamCity: "Miami", color: "#98002e", secondary: "#f9a01b" },
  { pick: 5, cityId: "us_sf", teamName: "Bay Area Vanguard", teamCity: "San Francisco", color: "#1d428a", secondary: "#ffc72c" },
  { pick: 6, cityId: "fr_paris", teamName: "Paris Seine Cavaliers", teamCity: "Paris", color: "#111827", secondary: "#3b82f6" },
  { pick: 7, cityId: "jp_tokyo", teamName: "Tokyo Cyber Samurai", teamCity: "Tokyo", color: "#dc2626", secondary: "#ffffff" },
  { pick: 8, cityId: "es_madrid", teamName: "Madrid Royal Crown", teamCity: "Madrid", color: "#ffffff", secondary: "#581c87" },
];

export const WOMENS_DRAFT_FRANCHISES = [
  { pick: 1, cityId: "us_nyc", teamName: "Liberty Valkyries", teamCity: "New York", color: "#0d9488", secondary: "#f8fafc" },
  { pick: 2, cityId: "us_la", teamName: "Sunset Sparks", teamCity: "Los Angeles", color: "#7e22ce", secondary: "#facc15" },
  { pick: 3, cityId: "us_chicago", teamName: "Windcrest Skyhawks", teamCity: "Chicago", color: "#0284c7", secondary: "#fde047" },
  { pick: 4, cityId: "us_miami", teamName: "Biscayne Flamingos", teamCity: "Miami", color: "#db2777", secondary: "#111827" },
  { pick: 5, cityId: "us_boston", teamName: "Harbor Lynx", teamCity: "Seattle", color: "#15803d", secondary: "#facc15" },
  { pick: 6, cityId: "fr_paris", teamName: "Paris Lumière Stars", teamCity: "Paris", color: "#1e3a8a", secondary: "#f43f5e" },
  { pick: 7, cityId: "jp_tokyo", teamName: "Tokyo Phoenix", teamCity: "Tokyo", color: "#dc2626", secondary: "#fbbf24" },
  { pick: 8, cityId: "au_sydney", teamName: "Sydney Opals Crown", teamCity: "Sydney", color: "#047857", secondary: "#facc15" },
];

const ATHLETE_STORAGE_KEY = "hoops_created_athlete_v1";
const DIVISION_STORAGE_KEY = "gbc_active_league_division_v1";

export function formatHeight(inches: number): string {
  const ft = Math.floor(inches / 12);
  const rem = inches % 12;
  return `${ft}'${rem}"`;
}

export function calculateOverallRating(attrs: AthleteAttributes): number {
  const avg = (attrs.shooting + attrs.finishing + attrs.handles + attrs.defense) / 4;
  return Math.round(avg);
}

export function getDefaultAthleteProfile(gender: AthleteGender = "male"): AthleteProfile {
  return {
    firstName: gender === "female" ? "MAYA" : "JORDAN",
    lastName: "MERCER",
    jerseyNumber: "23",
    position: "PG",
    archetype: "Slashing Playmaker",
    gender,
    hairStyle: gender === "female" ? "ponytail" : "fade",
    facialHair: "none",
    hairColorHex: "#151210",
    bodyProportion: "athletic",
    heightInches: gender === "female" ? 70 : 75, // 5'10" or 6'3"
    skinToneHex: "#8d5524",
    jerseyColorHex: gender === "female" ? "#0d9488" : "#c8102e",
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
    const defaults = getDefaultAthleteProfile(parsed?.gender === "female" ? "female" : "male");
    return {
      ...defaults,
      ...parsed,
      gender: parsed?.gender === "female" ? "female" : "male",
      hairStyle: parsed?.hairStyle || defaults.hairStyle,
      facialHair: parsed?.facialHair || "none",
      hairColorHex: parsed?.hairColorHex || defaults.hairColorHex,
      bodyProportion: parsed?.bodyProportion || "athletic",
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

export function loadActiveDivision(): ActiveLeagueDivision {
  if (typeof window === "undefined") return "mens";
  try {
    const raw = window.localStorage.getItem(DIVISION_STORAGE_KEY);
    return raw === "womens" ? "womens" : "mens";
  } catch {
    return "mens";
  }
}

export function saveActiveDivision(division: ActiveLeagueDivision): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DIVISION_STORAGE_KEY, division);
  } catch {
    // ignore storage errors
  }
}
