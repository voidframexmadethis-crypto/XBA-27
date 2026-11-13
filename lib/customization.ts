import { loadVersionedState, SAVE_KEYS, saveVersionedState } from "./saveSystem.ts";

export type JerseyPattern = "solid" | "sash" | "pinstripes" | "city_gradient" | "classic_trim";
export type TeamEmblemId = "crown" | "shield" | "flame" | "bolt" | "phoenix" | "mountain" | "trident" | "star";
export type BallDesignId = "classic_leather" | "championship_gold" | "street_charcoal" | "neon_volt" | "frost_arctic";
export type ArenaLightingMood = "broadcast" | "spotlight" | "sunset" | "cyber";
export type CourtWoodTone = "classic_maple" | "dark_walnut" | "bleached_ash" | "royal_oak";

export interface StudioCustomization {
  teamName: string;
  teamAbbr: string;
  emblemId: TeamEmblemId;
  jerseyPattern: JerseyPattern;
  primaryColor: string;
  secondaryColor: string;
  trimColor: string;
  ballDesign: BallDesignId;
  shoePrimaryColor: string;
  shoeAccentColor: string;
  lightingMood: ArenaLightingMood;
  woodTone: CourtWoodTone;
  apronColor: string;
  keyPaintColor: string;
  centerCourtBanner: string;
}

export const BALL_DESIGNS: {
  id: BallDesignId;
  name: string;
  baseHex: string;
  seamHex: string;
  roughness: number;
  metalness: number;
  desc: string;
}[] = [
  {
    id: "classic_leather",
    name: "Pro Composite Leather",
    baseHex: "#d65a18",
    seamHex: "#18181b",
    roughness: 0.44,
    metalness: 0.08,
    desc: "Official regulation pebbled composite orange.",
  },
  {
    id: "championship_gold",
    name: "Sovereign Finals Gold",
    baseHex: "#eab308",
    seamHex: "#78350f",
    roughness: 0.25,
    metalness: 0.42,
    desc: "Metallic gold finish minted for championship finals.",
  },
  {
    id: "street_charcoal",
    name: "Midnight Blacktop",
    baseHex: "#1f2937",
    seamHex: "#f97316",
    roughness: 0.52,
    metalness: 0.14,
    desc: "Stealth charcoal grip with safety-orange channels.",
  },
  {
    id: "neon_volt",
    name: "Apex Volt Glow",
    baseHex: "#84cc16",
    seamHex: "#0f172a",
    roughness: 0.36,
    metalness: 0.18,
    desc: "High-visibility neon court ball under arena spotlights.",
  },
  {
    id: "frost_arctic",
    name: "Glacier Ice Edition",
    baseHex: "#38bdf8",
    seamHex: "#ffffff",
    roughness: 0.3,
    metalness: 0.28,
    desc: "Cool glacier cyan composite shell with white ribs.",
  },
];

export const WOOD_TONE_PRESETS: { id: CourtWoodTone; name: string; lightHex: string; darkHex: string }[] = [
  { id: "classic_maple", name: "Classic Arena Maple", lightHex: "#deb078", darkHex: "#cf9f64" },
  { id: "dark_walnut", name: "Rich Dark Walnut", lightHex: "#9c6b3f", darkHex: "#82542d" },
  { id: "bleached_ash", name: "Scandinavian Blonde Ash", lightHex: "#ecd3ae", darkHex: "#dec195" },
  { id: "royal_oak", name: "Championship Honey Oak", lightHex: "#d5964e", darkHex: "#bd7f38" },
];

export const LIGHTING_MOOD_PRESETS: {
  id: ArenaLightingMood;
  name: string;
  ambientHex: string;
  ambientIntensity: number;
  keyIntensity: number;
  skyHex: string;
  desc: string;
}[] = [
  {
    id: "broadcast",
    name: "National Broadcast",
    ambientHex: "#d8e4ff",
    ambientIntensity: 0.95,
    keyIntensity: 2.3,
    skyHex: "#080b12",
    desc: "Bright, even TV studio clarity across every seat and line.",
  },
  {
    id: "spotlight",
    name: "Playoff Theater",
    ambientHex: "#1e293b",
    ambientIntensity: 0.52,
    keyIntensity: 2.9,
    skyHex: "#040509",
    desc: "Dramatic darkened stands with high-contrast court spotlights.",
  },
  {
    id: "sunset",
    name: "Golden Hour Open-Air",
    ambientHex: "#fde68a",
    ambientIntensity: 0.85,
    keyIntensity: 2.4,
    skyHex: "#1c1220",
    desc: "Warm amber twilight casting rich highlights across the hardwood.",
  },
  {
    id: "cyber",
    name: "Electric Showcase",
    ambientHex: "#38bdf8",
    ambientIntensity: 0.78,
    keyIntensity: 2.5,
    skyHex: "#060916",
    desc: "Cool cyan & electric rim accents built for All-Star weekend.",
  },
];

export const TEAM_EMBLEMS: { id: TeamEmblemId; label: string }[] = [
  { id: "crown", label: "Sovereign Crown" },
  { id: "shield", label: "Fortress Shield" },
  { id: "flame", label: "Wildfire Crest" },
  { id: "bolt", label: "Voltage Bolt" },
  { id: "phoenix", label: "Rising Phoenix" },
  { id: "mountain", label: "Summit Peak" },
  { id: "trident", label: "Bay Trident" },
  { id: "star", label: "Apex Star" },
];

export function getDefaultCustomization(): StudioCustomization {
  return {
    teamName: "EMPIRE MONARCHS",
    teamAbbr: "NYM",
    emblemId: "crown",
    jerseyPattern: "sash",
    primaryColor: "#c8102e",
    secondaryColor: "#f59e0b",
    trimColor: "#ffffff",
    ballDesign: "classic_leather",
    shoePrimaryColor: "#f8fafc",
    shoeAccentColor: "#c8102e",
    lightingMood: "broadcast",
    woodTone: "classic_maple",
    apronColor: "#141820",
    keyPaintColor: "#991b1b",
    centerCourtBanner: "APEX PRO",
  };
}

export function loadStudioCustomization(): StudioCustomization {
  return loadVersionedState<StudioCustomization>(
    SAVE_KEYS.CUSTOMIZATION,
    getDefaultCustomization,
    (d): d is StudioCustomization =>
      Boolean(d && typeof d === "object" && typeof (d as StudioCustomization).primaryColor === "string")
  ).data;
}

export function saveStudioCustomization(custom: StudioCustomization): void {
  saveVersionedState(SAVE_KEYS.CUSTOMIZATION, custom);
}
