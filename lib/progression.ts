export interface ProgressionItem {
  id: string;
  name: string;
  type: "jersey" | "sneakers" | "headband" | "dunk";
  description: string;
  colorHex: string;
  secondaryHex?: string;
  accentHex?: string;
  unlockedByDefault?: boolean;
  reqType: "pts" | "reb" | "ast" | "matches" | "none";
  reqValue: number;
}

export interface CareerStats {
  careerPts: number;
  careerReb: number;
  careerAst: number;
  careerFouls: number;
  matchesPlayed: number;
  matchesWon: number;
  xp: number;
  level: number;
  equippedJersey: string;
  equippedSneakers: string;
  equippedHeadband: string;
  equippedSignatureDunk: string;
  unlockedIds: string[];
}

export const JERSEY_ITEMS: ProgressionItem[] = [
  {
    id: "jersey_red_hawks",
    name: "Red Hawks Classic",
    type: "jersey",
    description: "Iconic home team red and crisp white trim.",
    colorHex: "#c8102e",
    secondaryHex: "#ffffff",
    accentHex: "#111111",
    unlockedByDefault: true,
    reqType: "none",
    reqValue: 0,
  },
  {
    id: "jersey_stealth_blackout",
    name: "Stealth Blackout",
    type: "jersey",
    description: "Midnight carbon black with matte gold detailing.",
    colorHex: "#18181b",
    secondaryHex: "#f59e0b",
    accentHex: "#3f3f46",
    reqType: "pts",
    reqValue: 10,
  },
  {
    id: "jersey_cyber_neon",
    name: "Cyber Neon",
    type: "jersey",
    description: "High-voltage electric cyan & synthwave lime.",
    colorHex: "#06b6d4",
    secondaryHex: "#a3e635",
    accentHex: "#083344",
    reqType: "pts",
    reqValue: 25,
  },
  {
    id: "jersey_sunset_blaze",
    name: "Sunset Blaze",
    type: "jersey",
    description: "South Beach fiery sunset orange and hot magenta.",
    colorHex: "#f97316",
    secondaryHex: "#ec4899",
    accentHex: "#7c2d12",
    reqType: "pts",
    reqValue: 50,
  },
  {
    id: "jersey_emerald_royale",
    name: "Emerald Royale",
    type: "jersey",
    description: "Deep Boston heritage emerald with gold champion piping.",
    colorHex: "#059669",
    secondaryHex: "#fbbf24",
    accentHex: "#064e3b",
    reqType: "pts",
    reqValue: 75,
  },
  {
    id: "jersey_galaxy_nebula",
    name: "Galaxy Nebula",
    type: "jersey",
    description: "Deep cosmic ultraviolet with starlight silver.",
    colorHex: "#7c3aed",
    secondaryHex: "#38bdf8",
    accentHex: "#2e1065",
    reqType: "pts",
    reqValue: 100,
  },
  {
    id: "jersey_gold_trophy",
    name: "24K Championship Gold",
    type: "jersey",
    description: "Radiant championship gold worn only by franchise legends.",
    colorHex: "#eab308",
    secondaryHex: "#ffffff",
    accentHex: "#713f12",
    reqType: "pts",
    reqValue: 150,
  },
];

export const SNEAKER_ITEMS: ProgressionItem[] = [
  {
    id: "kicks_classic_white",
    name: "Classic Pro Whites",
    type: "sneakers",
    description: "Clean, pristine white low-tops with ice grip.",
    colorHex: "#f5f5f5",
    unlockedByDefault: true,
    reqType: "none",
    reqValue: 0,
  },
  {
    id: "kicks_crimson_boost",
    name: "Crimson Boost Highs",
    type: "sneakers",
    description: "High-flying red sneakers engineered for glass cleaners.",
    colorHex: "#ef4444",
    reqType: "reb",
    reqValue: 4,
  },
  {
    id: "kicks_volt_air",
    name: "Volt Lime Air Max",
    type: "sneakers",
    description: "Electrifying fluorescent green court grippers.",
    colorHex: "#84cc16",
    reqType: "reb",
    reqValue: 8,
  },
  {
    id: "kicks_carbon_stealth",
    name: "Triple Carbon Stealth",
    type: "sneakers",
    description: "Matte blackout kicks for lockdown perimeter stoppers.",
    colorHex: "#1e293b",
    reqType: "reb",
    reqValue: 14,
  },
  {
    id: "kicks_gold_elite",
    name: "24K Golden Hoopers",
    type: "sneakers",
    description: "Solid gold-accented kicks for the most dominant rebounder.",
    colorHex: "#f59e0b",
    reqType: "reb",
    reqValue: 20,
  },
];

export const HEADBAND_ITEMS: ProgressionItem[] = [
  {
    id: "acc_none",
    name: "No Headband",
    type: "headband",
    description: "Classic clean hair with no headwear.",
    colorHex: "#000000",
    unlockedByDefault: true,
    reqType: "none",
    reqValue: 0,
  },
  {
    id: "acc_white_band",
    name: "Pro Terrycloth (White)",
    type: "headband",
    description: "Classic headband for legendary playmakers.",
    colorHex: "#ffffff",
    reqType: "ast",
    reqValue: 3,
  },
  {
    id: "acc_red_band",
    name: "Hawks Crimson Band",
    type: "headband",
    description: "Fiery red headband worn during clutch fourth quarters.",
    colorHex: "#c8102e",
    reqType: "ast",
    reqValue: 6,
  },
  {
    id: "acc_black_band",
    name: "Ninja Onyx Band",
    type: "headband",
    description: "Stealth blackout sweatband for unselfish court vision.",
    colorHex: "#111827",
    reqType: "ast",
    reqValue: 10,
  },
  {
    id: "acc_gold_crown",
    name: "Golden Crown Band",
    type: "headband",
    description: "Royal gold headwear reserved for assist maestros.",
    colorHex: "#eab308",
    reqType: "ast",
    reqValue: 18,
  },
];

export const SIGNATURE_DUNKS: ProgressionItem[] = [
  {
    id: "dunk_standard",
    name: "Pro Arsenal Package",
    type: "dunk",
    description: "Classic tomahawk, two-hand flush, windmill, and reverse slams.",
    colorHex: "#f97316",
    secondaryHex: "#ffffff",
    accentHex: "#18181b",
    unlockedByDefault: true,
    reqType: "none",
    reqValue: 0,
  },
  {
    id: "dunk_tiki_tiki",
    name: "Tiki Tiki Signature Slam",
    type: "dunk",
    description: "Exclusive 360-coiled green & gold shockwave dunk with championship audio & replay.",
    colorHex: "#10b981",
    secondaryHex: "#facc15",
    accentHex: "#064e3b",
    reqType: "pts",
    reqValue: 20,
  },
];

export const ALL_CUSTOMIZATION_ITEMS: ProgressionItem[] = [
  ...JERSEY_ITEMS,
  ...SNEAKER_ITEMS,
  ...HEADBAND_ITEMS,
  ...SIGNATURE_DUNKS,
];

const STORAGE_KEY = "hoops_career_progression_v1";

export function getDefaultCareerStats(): CareerStats {
  return {
    careerPts: 0,
    careerReb: 0,
    careerAst: 0,
    careerFouls: 0,
    matchesPlayed: 0,
    matchesWon: 0,
    xp: 0,
    level: 1,
    equippedJersey: "jersey_red_hawks",
    equippedSneakers: "kicks_classic_white",
    equippedHeadband: "acc_none",
    equippedSignatureDunk: "dunk_standard",
    unlockedIds: ["jersey_red_hawks", "kicks_classic_white", "acc_none", "dunk_standard"],
  };
}

export function calculateLevel(xp: number): { level: number; title: string; currentLevelXp: number; nextLevelXp: number } {
  // 150 XP per level scaling gently
  const xpPerLevel = 150;
  const level = Math.floor(xp / xpPerLevel) + 1;
  const currentLevelXp = xp % xpPerLevel;
  const nextLevelXp = xpPerLevel;

  const titles = [
    "Rookie",
    "Bench Mob",
    "Sixth Man",
    "Starting Five",
    "Floor General",
    "Clutch Shooter",
    "All-Star",
    "All-League First Team",
    "MVP Frontrunner",
    "League MVP",
    "Finals MVP",
    "APBA Champion",
    "Hall of Famer",
    "Basketball Legend",
    "The G.O.A.T.",
  ];

  const title = titles[Math.min(level - 1, titles.length - 1)];
  return { level, title, currentLevelXp, nextLevelXp };
}

export function loadCareerStats(): CareerStats {
  if (typeof window === "undefined") return getDefaultCareerStats();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultCareerStats();
    const parsed = JSON.parse(raw);
    const defaults = getDefaultCareerStats();
    return {
      ...defaults,
      ...parsed,
      equippedSignatureDunk: parsed.equippedSignatureDunk || defaults.equippedSignatureDunk,
      unlockedIds: Array.from(new Set([...defaults.unlockedIds, ...(parsed.unlockedIds || [])])),
    };
  } catch {
    return getDefaultCareerStats();
  }
}

export function saveCareerStats(stats: CareerStats): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error("Failed to save career progression", e);
  }
}

export interface MatchEarnings {
  pts: number;
  reb: number;
  ast: number;
  fouls: number;
  won: boolean;
}

export interface RecordMatchResult {
  updatedStats: CareerStats;
  newlyUnlockedItems: ProgressionItem[];
  xpGained: number;
  leveledUp: boolean;
}

export function recordMatchToCareer(earnings: MatchEarnings): RecordMatchResult {
  const current = loadCareerStats();

  const xpGained =
    earnings.pts * 15 +
    earnings.ast * 20 +
    earnings.reb * 20 +
    (earnings.won ? 150 : 50) +
    Math.max(0, 20 - earnings.fouls * 5);

  const prevLevel = calculateLevel(current.xp).level;
  const newXp = current.xp + xpGained;
  const newLevel = calculateLevel(newXp).level;

  const updatedStats: CareerStats = {
    ...current,
    careerPts: current.careerPts + earnings.pts,
    careerReb: current.careerReb + earnings.reb,
    careerAst: current.careerAst + earnings.ast,
    careerFouls: current.careerFouls + earnings.fouls,
    matchesPlayed: current.matchesPlayed + 1,
    matchesWon: current.matchesWon + (earnings.won ? 1 : 0),
    xp: newXp,
    level: newLevel,
    unlockedIds: [...current.unlockedIds],
  };

  const newlyUnlockedItems: ProgressionItem[] = [];

  for (const item of ALL_CUSTOMIZATION_ITEMS) {
    if (updatedStats.unlockedIds.includes(item.id)) continue;

    let unlocked = false;
    if (item.reqType === "none" || item.unlockedByDefault) {
      unlocked = true;
    } else if (item.reqType === "pts" && updatedStats.careerPts >= item.reqValue) {
      unlocked = true;
    } else if (item.reqType === "reb" && updatedStats.careerReb >= item.reqValue) {
      unlocked = true;
    } else if (item.reqType === "ast" && updatedStats.careerAst >= item.reqValue) {
      unlocked = true;
    } else if (item.reqType === "matches" && updatedStats.matchesPlayed >= item.reqValue) {
      unlocked = true;
    }

    if (unlocked) {
      updatedStats.unlockedIds.push(item.id);
      newlyUnlockedItems.push(item);
    }
  }

  saveCareerStats(updatedStats);

  return {
    updatedStats,
    newlyUnlockedItems,
    xpGained,
    leveledUp: newLevel > prevLevel,
  };
}

export function addDebugCareerStats(pts: number, reb: number, ast: number): RecordMatchResult {
  return recordMatchToCareer({
    pts,
    reb,
    ast,
    fouls: 0,
    won: true,
  });
}

export function unlockProgressionItem(itemId: string, autoEquip = false): { stats: CareerStats; newlyUnlocked: boolean } {
  const current = loadCareerStats();
  const already = current.unlockedIds.includes(itemId);
  const item = ALL_CUSTOMIZATION_ITEMS.find((i) => i.id === itemId);
  const unlockedIds = already ? current.unlockedIds : [...current.unlockedIds, itemId];
  const updated: CareerStats = {
    ...current,
    unlockedIds,
    equippedSignatureDunk:
      autoEquip && item?.type === "dunk" ? itemId : current.equippedSignatureDunk || "dunk_standard",
  };
  saveCareerStats(updated);
  return { stats: updated, newlyUnlocked: !already };
}

export function resetCareerStats(): CareerStats {
  const initial = getDefaultCareerStats();
  saveCareerStats(initial);
  return initial;
}
