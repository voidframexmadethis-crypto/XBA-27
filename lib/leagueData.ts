export type ProLeagueDivision = "mens" | "womens";
export type LeagueConference = "Eastern" | "Western";
export type LeagueDivision = "Atlantic" | "Central" | "Mountain" | "Pacific";
export type PositionCode = "PG" | "SG" | "SF" | "PF" | "C";

export interface PlayerRatings {
  ovr: number;
  shooting: number;
  finishing: number;
  playmaking: number;
  defense: number;
  rebounding: number;
  athleticism: number;
}

export interface PlayerStatLine {
  gp: number;
  gs: number;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
}

export interface LeaguePlayer {
  id: string;
  teamId: string;
  name: string;
  position: PositionCode;
  jerseyNumber: number;
  age: number;
  yearsPro: number; // 0 = rookie
  isStarter: boolean;
  isUserCreated?: boolean;
  gender?: ProLeagueDivision extends never ? never : "male" | "female";
  archetype: string;
  ratings: PlayerRatings;
  contractYears: number;
  salaryMillions: number;
  seasonStats: PlayerStatLine;
  careerStats: PlayerStatLine;
  priorSeasonPpg: number;
  priorSeasonRpg: number;
  priorSeasonApg: number;
  priorSeasonOvr: number;
}

export interface LeagueTeamTemplate {
  id: string;
  city: string;
  name: string;
  abbr: string;
  conference: LeagueConference;
  division: LeagueDivision;
  primaryColor: string;
  secondaryColor: string;
  arenaName: string;
  marketSize: "Large" | "Mid" | "Small";
  baseRating: number;
  coachName: string;
  coachStyle: "Pace & Space" | "Lockdown Grind" | "Paint Force" | "Balanced Motion";
}

export const LEAGUE_NAME = "Apex Pro Basketball Association";
export const LEAGUE_ABBR = "APBA";
export const CHAMPIONSHIP_TROPHY_NAME = "The Apex Sovereign Cup";

export const WOMENS_LEAGUE_NAME = "Women's Pro Basketball Association";
export const WOMENS_LEAGUE_ABBR = "WPBA";
export const WOMENS_TROPHY_NAME = "The Aurora Sovereign Cup";

export const APBA_TEAMS: LeagueTeamTemplate[] = [
  // EASTERN CONFERENCE — ATLANTIC DIVISION
  {
    id: "apba_nyc_monarchs",
    city: "New York",
    name: "Empire Monarchs",
    abbr: "NYM",
    conference: "Eastern",
    division: "Atlantic",
    primaryColor: "#1d4ed8",
    secondaryColor: "#f97316",
    arenaName: "Metropolis Pavilion",
    marketSize: "Large",
    baseRating: 87,
    coachName: "Marcus Vance",
    coachStyle: "Pace & Space",
  },
  {
    id: "apba_bos_sentinels",
    city: "Boston",
    name: "Harbor Sentinels",
    abbr: "BOS",
    conference: "Eastern",
    division: "Atlantic",
    primaryColor: "#047857",
    secondaryColor: "#f8fafc",
    arenaName: "Emerald Vault Arena",
    marketSize: "Large",
    baseRating: 89,
    coachName: "Connor Gallagher",
    coachStyle: "Balanced Motion",
  },
  {
    id: "apba_phi_foundry",
    city: "Philadelphia",
    name: "Liberty Foundry",
    abbr: "PHI",
    conference: "Eastern",
    division: "Atlantic",
    primaryColor: "#dc2626",
    secondaryColor: "#1e3a8a",
    arenaName: "Keystone Coliseum",
    marketSize: "Large",
    baseRating: 84,
    coachName: "Andre Sterling",
    coachStyle: "Paint Force",
  },
  {
    id: "apba_tor_aurora",
    city: "Toronto",
    name: "Northern Aurora",
    abbr: "TOR",
    conference: "Eastern",
    division: "Atlantic",
    primaryColor: "#991b1b",
    secondaryColor: "#a855f7",
    arenaName: "Boreal Dome",
    marketSize: "Large",
    baseRating: 81,
    coachName: "Nolan Mercer",
    coachStyle: "Lockdown Grind",
  },
  {
    id: "apba_mia_solaris",
    city: "Miami",
    name: "Bayfront Solaris",
    abbr: "MIA",
    conference: "Eastern",
    division: "Atlantic",
    primaryColor: "#be123c",
    secondaryColor: "#f59e0b",
    arenaName: "Tropicana Horizon Center",
    marketSize: "Mid",
    baseRating: 85,
    coachName: "Rafael Morales",
    coachStyle: "Lockdown Grind",
  },

  // EASTERN CONFERENCE — CENTRAL DIVISION
  {
    id: "apba_chi_gale",
    city: "Chicago",
    name: "Lakeshore Gale",
    abbr: "CHI",
    conference: "Eastern",
    division: "Central",
    primaryColor: "#b91c1c",
    secondaryColor: "#111827",
    arenaName: "Windcrest Forum",
    marketSize: "Large",
    baseRating: 83,
    coachName: "Terrell Brooks",
    coachStyle: "Balanced Motion",
  },
  {
    id: "apba_cle_ironworks",
    city: "Cleveland",
    name: "Rustbelt Ironworks",
    abbr: "CLE",
    conference: "Eastern",
    division: "Central",
    primaryColor: "#7f1d1d",
    secondaryColor: "#eab308",
    arenaName: "Forge Fieldhouse",
    marketSize: "Mid",
    baseRating: 86,
    coachName: "David Kowalski",
    coachStyle: "Lockdown Grind",
  },
  {
    id: "apba_mil_timber",
    city: "Milwaukee",
    name: "Northwoods Timber",
    abbr: "MIL",
    conference: "Eastern",
    division: "Central",
    primaryColor: "#065f46",
    secondaryColor: "#d97706",
    arenaName: "Cedar Creek Pavilion",
    marketSize: "Small",
    baseRating: 86,
    coachName: "Grant Halvorsen",
    coachStyle: "Paint Force",
  },
  {
    id: "apba_atl_tempest",
    city: "Atlanta",
    name: "Peachtree Tempest",
    abbr: "ATL",
    conference: "Eastern",
    division: "Central",
    primaryColor: "#e11d48",
    secondaryColor: "#fde047",
    arenaName: "Piedmont Skyway Arena",
    marketSize: "Mid",
    baseRating: 82,
    coachName: "Darius Holloway",
    coachStyle: "Pace & Space",
  },
  {
    id: "apba_det_dynamo",
    city: "Detroit",
    name: "Motor City Dynamo",
    abbr: "DET",
    conference: "Eastern",
    division: "Central",
    primaryColor: "#1e40af",
    secondaryColor: "#ef4444",
    arenaName: "Assembly Foundry Center",
    marketSize: "Mid",
    baseRating: 79,
    coachName: "Malik Henderson",
    coachStyle: "Paint Force",
  },

  // WESTERN CONFERENCE — MOUNTAIN DIVISION
  {
    id: "apba_den_summit",
    city: "Denver",
    name: "Mile High Summit",
    abbr: "DEN",
    conference: "Western",
    division: "Mountain",
    primaryColor: "#1e3a8a",
    secondaryColor: "#facc15",
    arenaName: "Altitude Peak Arena",
    marketSize: "Mid",
    baseRating: 88,
    coachName: "Trevor Caldwell",
    coachStyle: "Balanced Motion",
  },
  {
    id: "apba_dal_maverons",
    city: "Dallas",
    name: "Lone Star Trailblazers",
    abbr: "DAL",
    conference: "Western",
    division: "Mountain",
    primaryColor: "#0284c7",
    secondaryColor: "#0f172a",
    arenaName: "Prairie Star Coliseum",
    marketSize: "Large",
    baseRating: 86,
    coachName: "Cole Bennett",
    coachStyle: "Pace & Space",
  },
  {
    id: "apba_phx_mirage",
    city: "Phoenix",
    name: "Sonoran Mirage",
    abbr: "PHX",
    conference: "Western",
    division: "Mountain",
    primaryColor: "#7c3aed",
    secondaryColor: "#f97316",
    arenaName: "Canyon Flare Arena",
    marketSize: "Mid",
    baseRating: 84,
    coachName: "Victor Mendoza",
    coachStyle: "Pace & Space",
  },
  {
    id: "apba_hou_orbit",
    city: "Houston",
    name: "Bayou Orbit",
    abbr: "HOU",
    conference: "Western",
    division: "Mountain",
    primaryColor: "#dc2626",
    secondaryColor: "#cbd5e1",
    arenaName: "Launchpad Center",
    marketSize: "Large",
    baseRating: 82,
    coachName: "Kendrick Shaw",
    coachStyle: "Lockdown Grind",
  },
  {
    id: "apba_min_glacier",
    city: "Minneapolis",
    name: "Twin Glacier",
    abbr: "MIN",
    conference: "Western",
    division: "Mountain",
    primaryColor: "#172554",
    secondaryColor: "#22c55e",
    arenaName: "Frostline Fieldhouse",
    marketSize: "Small",
    baseRating: 85,
    coachName: "Liam O'Connor",
    coachStyle: "Lockdown Grind",
  },

  // WESTERN CONFERENCE — PACIFIC DIVISION
  {
    id: "apba_la_eclipse",
    city: "Los Angeles",
    name: "Pacific Eclipse",
    abbr: "LAE",
    conference: "Western",
    division: "Pacific",
    primaryColor: "#6d28d9",
    secondaryColor: "#fbbf24",
    arenaName: "Sunset Crown Forum",
    marketSize: "Large",
    baseRating: 88,
    coachName: "Julian Cross",
    coachStyle: "Balanced Motion",
  },
  {
    id: "apba_bay_vanguard",
    city: "San Francisco",
    name: "Bay Area Vanguard",
    abbr: "BAY",
    conference: "Western",
    division: "Pacific",
    primaryColor: "#2563eb",
    secondaryColor: "#facc15",
    arenaName: "Golden Tide Pavilion",
    marketSize: "Large",
    baseRating: 87,
    coachName: "Ethan Park",
    coachStyle: "Pace & Space",
  },
  {
    id: "apba_sea_evergreen",
    city: "Seattle",
    name: "Cascade Evergreen",
    abbr: "SEA",
    conference: "Western",
    division: "Pacific",
    primaryColor: "#15803d",
    secondaryColor: "#fde047",
    arenaName: "Soundview Arena",
    marketSize: "Mid",
    baseRating: 83,
    coachName: "Owen Takahashi",
    coachStyle: "Pace & Space",
  },
  {
    id: "apba_lv_royals",
    city: "Las Vegas",
    name: "Mojave Royals",
    abbr: "LVR",
    conference: "Western",
    division: "Pacific",
    primaryColor: "#b45309",
    secondaryColor: "#18181b",
    arenaName: "Neon Mirage Dome",
    marketSize: "Mid",
    baseRating: 80,
    coachName: "Caleb Thornton",
    coachStyle: "Paint Force",
  },
  {
    id: "apba_por_redwoods",
    city: "Portland",
    name: "Willamette Redwoods",
    abbr: "POR",
    conference: "Western",
    division: "Pacific",
    primaryColor: "#b91c1c",
    secondaryColor: "#334155",
    arenaName: "Timberline Garden",
    marketSize: "Small",
    baseRating: 78,
    coachName: "Seth Albright",
    coachStyle: "Balanced Motion",
  },
];

export const WPBA_TEAMS: LeagueTeamTemplate[] = [
  // EASTERN CONFERENCE — ATLANTIC DIVISION
  {
    id: "wpba_nyc_valkyries",
    city: "New York",
    name: "Liberty Valkyries",
    abbr: "NYV",
    conference: "Eastern",
    division: "Atlantic",
    primaryColor: "#0d9488",
    secondaryColor: "#f8fafc",
    arenaName: "Barclays Harbor Arena",
    marketSize: "Large",
    baseRating: 89,
    coachName: "Elena Ramirez",
    coachStyle: "Pace & Space",
  },
  {
    id: "wpba_bos_beacons",
    city: "Boston",
    name: "Bay State Beacons",
    abbr: "BSB",
    conference: "Eastern",
    division: "Atlantic",
    primaryColor: "#065f46",
    secondaryColor: "#fbbf24",
    arenaName: "Commonwealth Pavilion",
    marketSize: "Large",
    baseRating: 86,
    coachName: "Claire Donovan",
    coachStyle: "Balanced Motion",
  },
  {
    id: "wpba_phi_sirens",
    city: "Philadelphia",
    name: "Schuylkill Sirens",
    abbr: "PHS",
    conference: "Eastern",
    division: "Atlantic",
    primaryColor: "#e11d48",
    secondaryColor: "#1e293b",
    arenaName: "Independence Court",
    marketSize: "Large",
    baseRating: 83,
    coachName: "Simone Brooks",
    coachStyle: "Lockdown Grind",
  },
  {
    id: "wpba_tor_crown",
    city: "Toronto",
    name: "Maple Queen Tempo",
    abbr: "TQT",
    conference: "Eastern",
    division: "Atlantic",
    primaryColor: "#7e22ce",
    secondaryColor: "#f43f5e",
    arenaName: "Ontario Crown Dome",
    marketSize: "Large",
    baseRating: 84,
    coachName: "Nadia Bouchard",
    coachStyle: "Pace & Space",
  },
  {
    id: "wpba_mia_flamingos",
    city: "Miami",
    name: "Biscayne Flamingos",
    abbr: "MBF",
    conference: "Eastern",
    division: "Atlantic",
    primaryColor: "#db2777",
    secondaryColor: "#22d3ee",
    arenaName: "Ocean Drive Arena",
    marketSize: "Mid",
    baseRating: 85,
    coachName: "Valeria Cruz",
    coachStyle: "Balanced Motion",
  },

  // EASTERN CONFERENCE — CENTRAL DIVISION
  {
    id: "wpba_chi_skyhawks",
    city: "Chicago",
    name: "Windcrest Skyhawks",
    abbr: "CSK",
    conference: "Eastern",
    division: "Central",
    primaryColor: "#0284c7",
    secondaryColor: "#fde047",
    arenaName: "Wintrust Lakeview Arena",
    marketSize: "Large",
    baseRating: 85,
    coachName: "Tamika Jordan",
    coachStyle: "Paint Force",
  },
  {
    id: "wpba_ind_nova",
    city: "Indianapolis",
    name: "Heartland Nova",
    abbr: "IND",
    conference: "Eastern",
    division: "Central",
    primaryColor: "#dc2626",
    secondaryColor: "#facc15",
    arenaName: "Circle City Fieldhouse",
    marketSize: "Mid",
    baseRating: 88,
    coachName: "Hannah Mercer",
    coachStyle: "Pace & Space",
  },
  {
    id: "wpba_atl_aurora",
    city: "Atlanta",
    name: "Peachtree Queens",
    abbr: "ATQ",
    conference: "Eastern",
    division: "Central",
    primaryColor: "#be123c",
    secondaryColor: "#f8fafc",
    arenaName: "Gateway Peach Center",
    marketSize: "Mid",
    baseRating: 83,
    coachName: "Brianna Jackson",
    coachStyle: "Lockdown Grind",
  },
  {
    id: "wpba_cle_firebirds",
    city: "Cleveland",
    name: "Erie Firebirds",
    abbr: "CLF",
    conference: "Eastern",
    division: "Central",
    primaryColor: "#b45309",
    secondaryColor: "#0f172a",
    arenaName: "North Coast Pavilion",
    marketSize: "Small",
    baseRating: 80,
    coachName: "Laura Nowak",
    coachStyle: "Paint Force",
  },
  {
    id: "wpba_det_sparkplugs",
    city: "Detroit",
    name: "Belle Isle Shock",
    abbr: "DTW",
    conference: "Eastern",
    division: "Central",
    primaryColor: "#1d4ed8",
    secondaryColor: "#f97316",
    arenaName: "Riverfront Palace",
    marketSize: "Mid",
    baseRating: 81,
    coachName: "Kendra Cole",
    coachStyle: "Lockdown Grind",
  },

  // WESTERN CONFERENCE — MOUNTAIN DIVISION
  {
    id: "wpba_min_auroras",
    city: "Minneapolis",
    name: "Northstar Lynx",
    abbr: "MNL",
    conference: "Western",
    division: "Mountain",
    primaryColor: "#1e3a8a",
    secondaryColor: "#10b981",
    arenaName: "Twin Cities Center",
    marketSize: "Small",
    baseRating: 89,
    coachName: "Cheryl Lindholm",
    coachStyle: "Balanced Motion",
  },
  {
    id: "wpba_dal_wings",
    city: "Dallas",
    name: "Prairie Wings",
    abbr: "DLW",
    conference: "Western",
    division: "Mountain",
    primaryColor: "#0369a1",
    secondaryColor: "#a3e635",
    arenaName: "Arlington College Arena",
    marketSize: "Large",
    baseRating: 84,
    coachName: "Rachel Sterling",
    coachStyle: "Pace & Space",
  },
  {
    id: "wpba_phx_sunfire",
    city: "Phoenix",
    name: "Desert Mercury",
    abbr: "PHM",
    conference: "Western",
    division: "Mountain",
    primaryColor: "#6d28d9",
    secondaryColor: "#f97316",
    arenaName: "Footprint Valley Dome",
    marketSize: "Mid",
    baseRating: 86,
    coachName: "Sofia Navarro",
    coachStyle: "Pace & Space",
  },
  {
    id: "wpba_den_alpine",
    city: "Denver",
    name: "Alpine Grizzlies",
    abbr: "DVA",
    conference: "Western",
    division: "Mountain",
    primaryColor: "#1d4ed8",
    secondaryColor: "#f59e0b",
    arenaName: "Front Range Pavilion",
    marketSize: "Mid",
    baseRating: 81,
    coachName: "Maya Takahashi",
    coachStyle: "Paint Force",
  },
  {
    id: "wpba_hou_comets",
    city: "Houston",
    name: "Space City Comets",
    abbr: "HCC",
    conference: "Western",
    division: "Mountain",
    primaryColor: "#b91c1c",
    secondaryColor: "#e2e8f0",
    arenaName: "Apollo Hardwood Forum",
    marketSize: "Large",
    baseRating: 83,
    coachName: "Denise Foster",
    coachStyle: "Lockdown Grind",
  },

  // WESTERN CONFERENCE — PACIFIC DIVISION
  {
    id: "wpba_lv_aces",
    city: "Las Vegas",
    name: "Mojave Aces",
    abbr: "LVA",
    conference: "Western",
    division: "Pacific",
    primaryColor: "#18181b",
    secondaryColor: "#fbbf24",
    arenaName: "Silver Crown Pavilion",
    marketSize: "Mid",
    baseRating: 90,
    coachName: "Becky Holloway",
    coachStyle: "Pace & Space",
  },
  {
    id: "wpba_sea_storm",
    city: "Seattle",
    name: "Emerald Storm",
    abbr: "SES",
    conference: "Western",
    division: "Pacific",
    primaryColor: "#15803d",
    secondaryColor: "#fde047",
    arenaName: "Puget Climate Arena",
    marketSize: "Mid",
    baseRating: 87,
    coachName: "Noelle Park",
    coachStyle: "Balanced Motion",
  },
  {
    id: "wpba_la_sparks",
    city: "Los Angeles",
    name: "Sunset Sparks",
    abbr: "LAS",
    conference: "Western",
    division: "Pacific",
    primaryColor: "#7e22ce",
    secondaryColor: "#facc15",
    arenaName: "Hollywood Star Forum",
    marketSize: "Large",
    baseRating: 84,
    coachName: "Lynne Alvarez",
    coachStyle: "Balanced Motion",
  },
  {
    id: "wpba_bay_valkyrie",
    city: "San Francisco",
    name: "Golden Bay Valkyries",
    abbr: "GBV",
    conference: "Western",
    division: "Pacific",
    primaryColor: "#4338ca",
    secondaryColor: "#c084fc",
    arenaName: "Chase Pier Pavilion",
    marketSize: "Large",
    baseRating: 82,
    coachName: "Natalie Chen",
    coachStyle: "Pace & Space",
  },
  {
    id: "wpba_por_cascades",
    city: "Portland",
    name: "Rose City Fire",
    abbr: "RCF",
    conference: "Western",
    division: "Pacific",
    primaryColor: "#991b1b",
    secondaryColor: "#f8fafc",
    arenaName: "Willamette Court",
    marketSize: "Small",
    baseRating: 79,
    coachName: "Erin Lindqvist",
    coachStyle: "Lockdown Grind",
  },
];

export function getLeagueTeams(division: ProLeagueDivision = "mens"): LeagueTeamTemplate[] {
  return division === "womens" ? WPBA_TEAMS : APBA_TEAMS;
}

export function getTeamByIdAnyLeague(teamId: string): LeagueTeamTemplate | undefined {
  return APBA_TEAMS.find((t) => t.id === teamId) || WPBA_TEAMS.find((t) => t.id === teamId);
}

export function getLeagueMeta(division: ProLeagueDivision = "mens") {
  if (division === "womens") {
    return {
      division: "womens" as const,
      name: WOMENS_LEAGUE_NAME,
      abbr: WOMENS_LEAGUE_ABBR,
      trophyName: WOMENS_TROPHY_NAME,
      defaultTeamId: WPBA_TEAMS[0].id,
    };
  }
  return {
    division: "mens" as const,
    name: LEAGUE_NAME,
    abbr: LEAGUE_ABBR,
    trophyName: CHAMPIONSHIP_TROPHY_NAME,
    defaultTeamId: APBA_TEAMS[0].id,
  };
}

const FIRST_NAMES = [
  "Marcus", "Jalen", "Darius", "Caleb", "Tariq", "Luka", "Mateo", "Devon", "Kobe", "Xavier",
  "Andre", "Miles", "Quentin", "Kieran", "Nikola", "Soren", "Jordan", "Cameron", "Nolan", "Isaiah",
  "Bryce", "Tyson", "Roman", "Julian", "Victor", "Malik", "Christian", "Rafael", "Jonas", "Henrik",
  "Zaire", "Kellan", "Dante", "Elias", "Tristan", "Hakeem", "Cedric", "Gavin", "Tobias", "Emilio",
];

const WOMENS_FIRST_NAMES = [
  "A'ja", "Sabrina", "Caitlin", "Breanna", "Napheesa", "Ariana", "Kelsey", "Nneka", "Jonquel", "Alyssa",
  "Paige", "Maya", "Kamilla", "Rhyne", "Arike", "Jewell", "Elena", "Jackie", "Satou", "Marine",
  "Ezi", "Gabby", "Alanna", "Chelsea", "Kaila", "Sienna", "Zoe", "Naomi", "Yuki", "Mei",
  "Camila", "Sofia", "Nadia", "Tessa", "Kira", "Aaliyah", "Jordyn", "Mikaela", "Chiara", "Amara",
];

const LAST_NAMES = [
  "Mercer", "Vance", "Holloway", "Sterling", "Kowalski", "Solis", "Takahashi", "Delgado", "Gallagher", "Okoro",
  "Lindqvist", "Bautista", "Thornton", "Carmichael", "Petrov", "Okafor", "Reyes", "Whitaker", "Callahan", "Fontaine",
  "Navarro", "Diallo", "Kessler", "Alvarado", "Benoit", "Sato", "Ibrahim", "Montoya", "Redding", "Strickland",
  "Drummond", "Morales", "Kovacs", "Ndiaye", "Prescott", "Vargas", "Harrington", "Chambers", "Castillo", "Moreau",
];

const ARCHETYPES_BY_POS: Record<PositionCode, string[]> = {
  PG: ["Floor General", "Shot-Creating Maestro", "Two-Way Playmaker"],
  SG: ["3-Level Scorer", "Perimeter Lockdown", "Sharpshooting Wing"],
  SF: ["Two-Way Slashing Wing", "Point Forward", "3-and-D Specialist"],
  PF: ["Stretch Four", "Glass-Cleaning Finisher", "Playmaking Four"],
  C: ["Rim-Protecting Anchor", "Stretch Center", "Interior Paint Force"],
};

export function createEmptyStatLine(): PlayerStatLine {
  return {
    gp: 0,
    gs: 0,
    min: 0,
    pts: 0,
    reb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    tov: 0,
    fgm: 0,
    fga: 0,
    tpm: 0,
    tpa: 0,
    ftm: 0,
    fta: 0,
  };
}

function deterministicHash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function computeLeaguePlayerOvr(r: Omit<PlayerRatings, "ovr">): number {
  return Math.round(
    r.shooting * 0.2 +
      r.finishing * 0.19 +
      r.playmaking * 0.16 +
      r.defense * 0.19 +
      r.rebounding * 0.13 +
      r.athleticism * 0.13
  );
}

export function generateInitialRosters(division: ProLeagueDivision = "mens"): LeaguePlayer[] {
  const teams = getLeagueTeams(division);
  const namePool = division === "womens" ? WOMENS_FIRST_NAMES : FIRST_NAMES;
  const seedShift = division === "womens" ? 5000 : 0;
  const positions: PositionCode[] = ["PG", "SG", "SF", "PF", "C"];
  const players: LeaguePlayer[] = [];
  const usedNumbersByTeam = new Map<string, Set<number>>();

  teams.forEach((team, tIdx) => {
    const usedNums = new Set<number>();
    usedNumbersByTeam.set(team.id, usedNums);

    // 10 players per team: 5 starters + 5 bench
    for (let slot = 0; slot < 10; slot++) {
      const pos = positions[slot % 5];
      const isStarter = slot < 5;
      const seed = seedShift + tIdx * 100 + slot * 7 + 19;

      const fn = namePool[Math.floor(deterministicHash(seed + 1) * namePool.length)];
      const ln = LAST_NAMES[Math.floor(deterministicHash(seed + 2) * LAST_NAMES.length)];

      // Assign unique jersey number
      let jersey = ((tIdx * 7 + slot * 9 + 3) % 55) + 0;
      while (usedNums.has(jersey)) {
        jersey = (jersey + 1) % 99;
      }
      usedNums.add(jersey);

      const isFranchiseStar = slot === (tIdx % 5);
      const isRookie = slot === 8 && tIdx % 3 !== 2;
      const yearsPro = isRookie ? 0 : Math.max(1, Math.floor(deterministicHash(seed + 3) * 11));
      const age = isRookie ? 19 + Math.floor(deterministicHash(seed + 4) * 3) : 21 + yearsPro;

      const tierOffset = isFranchiseStar
        ? 7
        : isStarter
        ? 1 - Math.floor(deterministicHash(seed + 5) * 4)
        : -9 - Math.floor(deterministicHash(seed + 6) * 6);

      const targetBase = Math.max(66, Math.min(96, team.baseRating + tierOffset));
      const clampR = (v: number) => Math.max(52, Math.min(99, Math.round(v)));

      const posBias = {
        shooting: pos === "SG" || pos === "PG" ? 5 : pos === "SF" ? 2 : -4,
        finishing: pos === "C" || pos === "PF" ? 5 : pos === "SF" ? 3 : 0,
        playmaking: pos === "PG" ? 11 : pos === "SG" ? 2 : pos === "SF" ? 0 : -8,
        defense: pos === "C" || pos === "SF" ? 3 : 0,
        rebounding: pos === "C" ? 13 : pos === "PF" ? 9 : pos === "SF" ? 1 : -10,
        athleticism: pos === "SF" || pos === "SG" ? 4 : 0,
      };

      const noise = (offset: number) => Math.round((deterministicHash(seed + offset) - 0.5) * 8);
      const rawRatings = {
        shooting: clampR(targetBase + posBias.shooting + noise(10)),
        finishing: clampR(targetBase + posBias.finishing + noise(11)),
        playmaking: clampR(targetBase + posBias.playmaking + noise(12)),
        defense: clampR(targetBase + posBias.defense + noise(13)),
        rebounding: clampR(targetBase + posBias.rebounding + noise(14)),
        athleticism: clampR(targetBase + posBias.athleticism + noise(15)),
      };
      const ovr = computeLeaguePlayerOvr(rawRatings);

      const archetypes = ARCHETYPES_BY_POS[pos];
      const archetype = archetypes[Math.floor(deterministicHash(seed + 16) * archetypes.length)];

      const salary = isRookie
        ? Number((2.4 + deterministicHash(seed + 17) * 3.8).toFixed(1))
        : isFranchiseStar
        ? Number(Math.max(24, Math.min(44, (ovr - 70) * 1.55)).toFixed(1))
        : isStarter
        ? Number(Math.max(9.5, Math.min(26, (ovr - 70) * 1.05)).toFixed(1))
        : Number(Math.max(2.2, Math.min(11, (ovr - 65) * 0.65)).toFixed(1));
      const contractYears = isRookie ? 3 : 1 + Math.floor(deterministicHash(seed + 18) * 4);

      const priorPpg = isRookie
        ? 0
        : Number((isFranchiseStar ? 18 + deterministicHash(seed + 19) * 8 : isStarter ? 9 + deterministicHash(seed + 20) * 8 : 4 + deterministicHash(seed + 21) * 4).toFixed(1));
      const priorRpg = isRookie ? 0 : Number((pos === "C" || pos === "PF" ? 5.5 + deterministicHash(seed + 22) * 4 : 2.5 + deterministicHash(seed + 23) * 3).toFixed(1));
      const priorApg = isRookie ? 0 : Number((pos === "PG" ? 4.8 + deterministicHash(seed + 24) * 3.5 : 1.5 + deterministicHash(seed + 25) * 2.5).toFixed(1));

      players.push({
        id: `p_${division === "womens" ? "w_" : ""}${team.abbr.toLowerCase()}_${slot}`,
        teamId: team.id,
        name: `${fn} ${ln}`,
        position: pos,
        jerseyNumber: jersey,
        age,
        yearsPro,
        isStarter,
        gender: division === "womens" ? "female" : "male",
        archetype,
        ratings: { ovr, ...rawRatings },
        contractYears,
        salaryMillions: salary,
        seasonStats: createEmptyStatLine(),
        careerStats: createEmptyStatLine(),
        priorSeasonPpg: priorPpg,
        priorSeasonRpg: priorRpg,
        priorSeasonApg: priorApg,
        priorSeasonOvr: Math.max(64, ovr - 2),
      });
    }
  });

  return players;
}

export interface DraftProspect {
  id: string;
  name: string;
  position: PositionCode;
  age: number;
  collegeOrOrigin: string;
  projectedPick: number;
  archetype: string;
  potential: number;
  ratings: PlayerRatings;
}

const ORIGIN_PROGRAMS = [
  "Pacific Tech", "Empire State Univ.", "Harbor Academy", "Prairie A&M", "Cascade Prep",
  "Northwoods Poly", "Boreal Select", "Liberty Institute", "Sonoran State", "Lakeshore U",
  "Madrid Youth Club", "Belgrade Hoops Lab", "Melbourne Institute", "Paris Metro Elite",
  "Seoul Yonsei Select", "Manila Archers Academy", "Athens Acropolis Club", "Munich Bavaria Prep",
];

export function generateDraftClass(
  seasonYear: number,
  count = 24,
  division: ProLeagueDivision = "mens"
): DraftProspect[] {
  const positions: PositionCode[] = ["PG", "SG", "SF", "PF", "C"];
  const namePool = division === "womens" ? WOMENS_FIRST_NAMES : FIRST_NAMES;
  const seedShift = division === "womens" ? 777 : 0;
  const prospects: DraftProspect[] = [];
  for (let i = 0; i < count; i++) {
    const seed = seasonYear * 313 + i * 17 + seedShift;
    const pos = positions[i % positions.length];
    const fn = namePool[Math.floor(deterministicHash(seed + 1) * namePool.length)];
    const ln = LAST_NAMES[Math.floor(deterministicHash(seed + 2) * LAST_NAMES.length)];
    const tierBase = Math.max(68, 84 - Math.floor(i * 0.55));
    const clampR = (v: number) => Math.max(58, Math.min(95, Math.round(v)));
    const raw = {
      shooting: clampR(tierBase + (pos === "SG" ? 4 : 0) + (deterministicHash(seed + 3) - 0.5) * 8),
      finishing: clampR(tierBase + (pos === "C" ? 5 : 0) + (deterministicHash(seed + 4) - 0.5) * 8),
      playmaking: clampR(tierBase + (pos === "PG" ? 8 : -3) + (deterministicHash(seed + 5) - 0.5) * 8),
      defense: clampR(tierBase + (deterministicHash(seed + 6) - 0.5) * 10),
      rebounding: clampR(tierBase + (pos === "C" || pos === "PF" ? 9 : -6) + (deterministicHash(seed + 7) - 0.5) * 8),
      athleticism: clampR(tierBase + 3 + (deterministicHash(seed + 8) - 0.5) * 9),
    };
    const ovr = computeLeaguePlayerOvr(raw);
    const potential = Math.min(97, ovr + 6 + Math.floor(deterministicHash(seed + 9) * 10));
    const archetypes = ARCHETYPES_BY_POS[pos];

    prospects.push({
      id: `draft_${division}_${seasonYear}_${i + 1}`,
      name: `${fn} ${ln}`,
      position: pos,
      age: 19 + (i % 3),
      collegeOrOrigin: ORIGIN_PROGRAMS[Math.floor(deterministicHash(seed + 10) * ORIGIN_PROGRAMS.length)],
      projectedPick: i + 1,
      archetype: archetypes[i % archetypes.length],
      potential,
      ratings: { ovr, ...raw },
    });
  }
  return prospects.sort((a, b) => b.ratings.ovr - a.ratings.ovr).map((p, idx) => ({ ...p, projectedPick: idx + 1 }));
}
