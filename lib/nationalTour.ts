import type { ProLeagueDivision } from "./leagueData.ts";
import { loadVersionedState, SAVE_KEYS, saveVersionedState } from "./saveSystem.ts";

export type NationalTourRegion = "northeast" | "midwest" | "south" | "west" | "finals";

export interface NationalTourStop {
  id: string;
  stopNumber: number;
  region: NationalTourRegion;
  regionLabel: string;
  cityId: string;
  opponentNameMens: string;
  opponentNameWomens: string;
  opponentOvr: number;
  challengeTitle: string;
  challengeType: "win" | "steals" | "threes" | "dunks" | "margin";
  challengeTarget: number;
  xpReward: number;
  isChampionshipFinal?: boolean;
}

export interface NationalTourStopProgress {
  stopId: string;
  completed: boolean;
  challengeCompleted: boolean;
  bestUserScore: number;
  bestOppScore: number;
  completedAt?: string;
}

export interface NationalTourState {
  division: ProLeagueDivision;
  currentStopIndex: number;
  stopsCompleted: Record<string, NationalTourStopProgress>;
  championshipsWon: number;
  totalTourWins: number;
  totalChallengesCleared: number;
  championUnlockedAt?: string;
}

export const NATIONAL_TOUR_STOPS: NationalTourStop[] = [
  {
    id: "nt_1_nyc",
    stopNumber: 1,
    region: "northeast",
    regionLabel: "Northeast Conference",
    cityId: "us_nyc",
    opponentNameMens: "NYC Gotham Royals",
    opponentNameWomens: "NYC Liberty Valkyries",
    opponentOvr: 80,
    challengeTitle: "Win the Tip-Off Showcase",
    challengeType: "win",
    challengeTarget: 1,
    xpReward: 220,
  },
  {
    id: "nt_2_philly",
    stopNumber: 2,
    region: "northeast",
    regionLabel: "Northeast Conference",
    cityId: "us_philly",
    opponentNameMens: "Philly Liberty Founders",
    opponentNameWomens: "Philly Broad Street Stars",
    opponentOvr: 82,
    challengeTitle: "Force 2+ Steals or Backcourt Stops",
    challengeType: "steals",
    challengeTarget: 2,
    xpReward: 260,
  },
  {
    id: "nt_3_boston",
    stopNumber: 3,
    region: "northeast",
    regionLabel: "Northeast Conference",
    cityId: "us_boston",
    opponentNameMens: "Boston Harbor Sentinels",
    opponentNameWomens: "Boston Emerald Queens",
    opponentOvr: 84,
    challengeTitle: "Win by 4+ Points in Garden Pavilion",
    challengeType: "margin",
    challengeTarget: 4,
    xpReward: 320,
  },
  {
    id: "nt_4_chicago",
    stopNumber: 4,
    region: "midwest",
    regionLabel: "Midwest Heartland",
    cityId: "us_chicago",
    opponentNameMens: "Chicago Lakeshore Gale",
    opponentNameWomens: "Chicago Skyhawks",
    opponentOvr: 85,
    challengeTitle: "Knock Down 2+ Three-Pointers",
    challengeType: "threes",
    challengeTarget: 2,
    xpReward: 340,
  },
  {
    id: "nt_5_denver",
    stopNumber: 5,
    region: "midwest",
    regionLabel: "Midwest Heartland",
    cityId: "us_denver",
    opponentNameMens: "Denver Altitude Summit",
    opponentNameWomens: "Denver Peak Blaze",
    opponentOvr: 86,
    challengeTitle: "Finish 1+ High-Flying Dunk",
    challengeType: "dunks",
    challengeTarget: 1,
    xpReward: 380,
  },
  {
    id: "nt_6_atlanta",
    stopNumber: 6,
    region: "south",
    regionLabel: "Southern Crown",
    cityId: "us_atlanta",
    opponentNameMens: "Atlanta Peachtree Firebirds",
    opponentNameWomens: "Atlanta Dream Monarchs",
    opponentOvr: 87,
    challengeTitle: "Clamp Perimeter: 2+ Steals",
    challengeType: "steals",
    challengeTarget: 2,
    xpReward: 400,
  },
  {
    id: "nt_7_miami",
    stopNumber: 7,
    region: "south",
    regionLabel: "Southern Crown",
    cityId: "us_miami",
    opponentNameMens: "Miami Bayfront Solaris",
    opponentNameWomens: "Miami Tropicana Surge",
    opponentOvr: 88,
    challengeTitle: "Splash 3+ Perimeter Threes",
    challengeType: "threes",
    challengeTarget: 3,
    xpReward: 430,
  },
  {
    id: "nt_8_neworleans",
    stopNumber: 8,
    region: "south",
    regionLabel: "Southern Crown",
    cityId: "us_neworleans",
    opponentNameMens: "New Orleans Crescent Kings",
    opponentNameWomens: "New Orleans Jazz Belles",
    opponentOvr: 89,
    challengeTitle: "Win by 6+ Points",
    challengeType: "margin",
    challengeTarget: 6,
    xpReward: 460,
  },
  {
    id: "nt_9_dallas",
    stopNumber: 9,
    region: "south",
    regionLabel: "Southern Crown",
    cityId: "us_dallas",
    opponentNameMens: "Dallas Lone Star Mustangs",
    opponentNameWomens: "Dallas Starlight Wings",
    opponentOvr: 90,
    challengeTitle: "Throw Down 2+ Rim-Rocking Dunks",
    challengeType: "dunks",
    challengeTarget: 2,
    xpReward: 500,
  },
  {
    id: "nt_10_phoenix",
    stopNumber: 10,
    region: "west",
    regionLabel: "Western Coast Gauntlet",
    cityId: "us_phoenix",
    opponentNameMens: "Phoenix Sonoran Sunburst",
    opponentNameWomens: "Phoenix Mercury Flame",
    opponentOvr: 91,
    challengeTitle: "Desert Shootout: 3+ Threes",
    challengeType: "threes",
    challengeTarget: 3,
    xpReward: 540,
  },
  {
    id: "nt_11_seattle",
    stopNumber: 11,
    region: "west",
    regionLabel: "Western Coast Gauntlet",
    cityId: "us_seattle",
    opponentNameMens: "Seattle Emerald Cascade",
    opponentNameWomens: "Seattle Storm Surge",
    opponentOvr: 92,
    challengeTitle: "Lockdown Rain City: 3+ Steals",
    challengeType: "steals",
    challengeTarget: 3,
    xpReward: 580,
  },
  {
    id: "nt_12_sf",
    stopNumber: 12,
    region: "west",
    regionLabel: "Western Coast Gauntlet",
    cityId: "us_sf",
    opponentNameMens: "San Francisco Bay Vanguard",
    opponentNameWomens: "Golden Gate Valkyries",
    opponentOvr: 93,
    challengeTitle: "Win Bayfront Semifinal by 5+ PTS",
    challengeType: "margin",
    challengeTarget: 5,
    xpReward: 650,
  },
  {
    id: "nt_13_la_finals",
    stopNumber: 13,
    region: "finals",
    regionLabel: "National Tour Championship",
    cityId: "us_la",
    opponentNameMens: "LA Pacific Eclipse Dynasty",
    opponentNameWomens: "LA Sunset Sparks Dynasty",
    opponentOvr: 96,
    challengeTitle: "Capture the United States National Tour Crown",
    challengeType: "win",
    challengeTarget: 1,
    xpReward: 1250,
    isChampionshipFinal: true,
  },
];

export function createInitialNationalTourState(division: ProLeagueDivision = "mens"): NationalTourState {
  return {
    division,
    currentStopIndex: 0,
    stopsCompleted: {},
    championshipsWon: 0,
    totalTourWins: 0,
    totalChallengesCleared: 0,
  };
}

export function evaluateStopChallenge(
  stop: NationalTourStop,
  userScore: number,
  oppScore: number,
  stats?: { steals?: number; threes?: number; dunks?: number }
): boolean {
  const won = userScore > oppScore;
  if (!won) return false;
  switch (stop.challengeType) {
    case "win":
      return true;
    case "margin":
      return userScore - oppScore >= stop.challengeTarget;
    case "steals":
      return (stats?.steals ?? 0) >= stop.challengeTarget;
    case "threes":
      return (stats?.threes ?? 0) >= stop.challengeTarget;
    case "dunks":
      return (stats?.dunks ?? 0) >= stop.challengeTarget;
    default:
      return true;
  }
}

export function resolveNationalTourStopMatch(
  state: NationalTourState,
  stopId: string,
  userScore: number,
  oppScore: number,
  matchStats?: { steals?: number; threes?: number; dunks?: number }
): {
  nextState: NationalTourState;
  won: boolean;
  challengeCleared: boolean;
  wonChampionship: boolean;
  unlockTikiTiki: boolean;
} {
  const stopIdx = NATIONAL_TOUR_STOPS.findIndex((s) => s.id === stopId);
  if (stopIdx === -1) {
    return {
      nextState: state,
      won: false,
      challengeCleared: false,
      wonChampionship: false,
      unlockTikiTiki: false,
    };
  }

  const stop = NATIONAL_TOUR_STOPS[stopIdx];
  const won = userScore > oppScore;
  const challengeCleared = evaluateStopChallenge(stop, userScore, oppScore, matchStats);
  const prev = state.stopsCompleted[stopId];

  const updatedEntry: NationalTourStopProgress = {
    stopId,
    completed: Boolean(prev?.completed || won),
    challengeCompleted: Boolean(prev?.challengeCompleted || challengeCleared),
    bestUserScore: Math.max(prev?.bestUserScore ?? 0, userScore),
    bestOppScore: prev ? Math.min(prev.bestOppScore, oppScore) : oppScore,
    completedAt: won ? new Date().toISOString() : prev?.completedAt,
  };

  const nextStops = {
    ...state.stopsCompleted,
    [stopId]: updatedEntry,
  };

  const completedCount = Object.values(nextStops).filter((s) => s.completed).length;
  const challengesCount = Object.values(nextStops).filter((s) => s.challengeCompleted).length;
  const wonChampionship = Boolean(stop.isChampionshipFinal && won);

  const nextStopIndex = won
    ? Math.min(NATIONAL_TOUR_STOPS.length - 1, Math.max(state.currentStopIndex, stopIdx + 1))
    : state.currentStopIndex;

  const nextState: NationalTourState = {
    ...state,
    currentStopIndex: nextStopIndex,
    stopsCompleted: nextStops,
    championshipsWon: state.championshipsWon + (wonChampionship ? 1 : 0),
    totalTourWins: state.totalTourWins + (won ? 1 : 0),
    totalChallengesCleared: challengesCount,
    championUnlockedAt: wonChampionship ? new Date().toISOString() : state.championUnlockedAt,
  };

  // Unlock Tiki Tiki Signature Slam after winning 2+ National Tour stops or the Championship
  const unlockTikiTiki = won && (completedCount >= 2 || wonChampionship);

  return {
    nextState,
    won,
    challengeCleared,
    wonChampionship,
    unlockTikiTiki,
  };
}

export function loadNationalTourState(division: ProLeagueDivision = "mens"): NationalTourState {
  const slotKey = `${SAVE_KEYS.NATIONAL_TOUR_V1}_${division}`;
  const res = loadVersionedState<NationalTourState>(
    slotKey,
    () => createInitialNationalTourState(division),
    (d): d is NationalTourState =>
      Boolean(d && typeof d === "object" && typeof (d as NationalTourState).currentStopIndex === "number")
  );
  return {
    ...createInitialNationalTourState(division),
    ...res.data,
    division,
  };
}

export function saveNationalTourState(state: NationalTourState): void {
  const slotKey = `${SAVE_KEYS.NATIONAL_TOUR_V1}_${state.division || "mens"}`;
  saveVersionedState(slotKey, state);
}
