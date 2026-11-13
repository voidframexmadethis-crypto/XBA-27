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

const FIRST_NAMES = [
  "Marcus", "Jalen", "Darius", "Caleb", "Tariq", "Luka", "Mateo", "Devon", "Kobe", "Xavier",
  "Andre", "Miles", "Quentin", "Kieran", "Nikola", "Soren", "Jordan", "Cameron", "Nolan", "Isaiah",
  "Bryce", "Tyson", "Roman", "Julian", "Victor", "Malik", "Christian", "Rafael", "Jonas", "Henrik",
  "Zaire", "Kellan", "Dante", "Elias", "Tristan", "Hakeem", "Cedric", "Gavin", "Tobias", "Emilio",
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

export function generateInitialRosters(): LeaguePlayer[] {
  const positions: PositionCode[] = ["PG", "SG", "SF", "PF", "C"];
  const players: LeaguePlayer[] = [];
  const usedNumbersByTeam = new Map<string, Set<number>>();

  APBA_TEAMS.forEach((team, tIdx) => {
    const usedNums = new Set<number>();
    usedNumbersByTeam.set(team.id, usedNums);

    // 10 players per team: 5 starters + 5 bench
    for (let slot = 0; slot < 10; slot++) {
      const pos = positions[slot % 5];
      const isStarter = slot < 5;
      const seed = tIdx * 100 + slot * 7 + 19;

      const fn = FIRST_NAMES[Math.floor(deterministicHash(seed + 1) * FIRST_NAMES.length)];
      const ln = LAST_NAMES[Math.floor(deterministicHash(seed + 2) * LAST_NAMES.length)];

      // Assign unique jersey number
      let jersey = ((tIdx * 7 + slot * 9 + 3) % 55) + 0;
      while (usedNums.has(jersey)) {
        jersey = (jersey + 1) % 99;
      }
      usedNums.add(jersey);

      // Franchise anchor at slot 0..2 depending on team, rookie at slot 8 or 9 for most teams
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

      // Salary scaled realistically so 10-man team payroll sits around $115M-$165M against $140M cap
      const salary = isRookie
        ? Number((2.4 + deterministicHash(seed + 17) * 3.8).toFixed(1))
        : isFranchiseStar
        ? Number(Math.max(24, Math.min(44, (ovr - 70) * 1.55)).toFixed(1))
        : isStarter
        ? Number(Math.max(9.5, Math.min(26, (ovr - 70) * 1.05)).toFixed(1))
        : Number(Math.max(2.2, Math.min(11, (ovr - 65) * 0.65)).toFixed(1));
      const contractYears = isRookie ? 3 : 1 + Math.floor(deterministicHash(seed + 18) * 4);

      // Realistic prior season stats for MIP comparisons
      const priorPpg = isRookie
        ? 0
        : Number((isFranchiseStar ? 18 + deterministicHash(seed + 19) * 8 : isStarter ? 9 + deterministicHash(seed + 20) * 8 : 4 + deterministicHash(seed + 21) * 4).toFixed(1));
      const priorRpg = isRookie ? 0 : Number((pos === "C" || pos === "PF" ? 5.5 + deterministicHash(seed + 22) * 4 : 2.5 + deterministicHash(seed + 23) * 3).toFixed(1));
      const priorApg = isRookie ? 0 : Number((pos === "PG" ? 4.8 + deterministicHash(seed + 24) * 3.5 : 1.5 + deterministicHash(seed + 25) * 2.5).toFixed(1));

      players.push({
        id: `p_${team.abbr.toLowerCase()}_${slot}`,
        teamId: team.id,
        name: `${fn} ${ln}`,
        position: pos,
        jerseyNumber: jersey,
        age,
        yearsPro,
        isStarter,
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
];

export function generateDraftClass(seasonYear: number, count = 24): DraftProspect[] {
  const positions: PositionCode[] = ["PG", "SG", "SF", "PF", "C"];
  const prospects: DraftProspect[] = [];
  for (let i = 0; i < count; i++) {
    const seed = seasonYear * 313 + i * 17;
    const pos = positions[i % positions.length];
    const fn = FIRST_NAMES[Math.floor(deterministicHash(seed + 1) * FIRST_NAMES.length)];
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
      id: `draft_${seasonYear}_${i + 1}`,
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
