import type { ProLeagueDivision } from "./leagueData.ts";
import { loadVersionedState, SAVE_KEYS, saveVersionedState } from "./saveSystem.ts";

export interface AllStarContestant {
  id: string;
  name: string;
  teamAbbr: string;
  position: string;
  rating: number;
  score: number;
  isUser?: boolean;
}

export interface AllStarTrophyEntry {
  id: string;
  seasonYear: number;
  division: ProLeagueDivision;
  event: "All-Star Game MVP" | "3-Point Champion" | "Dunk / Aerial Champion";
  winnerName: string;
  scoreSummary: string;
  dateIso: string;
}

export interface AllStarWeekendState {
  division: ProLeagueDivision;
  seasonYear: number;
  eastTeamName: string;
  westTeamName: string;
  gamePlayed: boolean;
  eastScore: number;
  westScore: number;
  gameMvp: string | null;
  threePointCompleted: boolean;
  threePointChampion: string | null;
  threePointLeaderboard: AllStarContestant[];
  dunkCompleted: boolean;
  dunkChampion: string | null;
  dunkLeaderboard: AllStarContestant[];
  trophies: AllStarTrophyEntry[];
  introsPresented: boolean;
}

const MENS_STARTERS_EAST: AllStarContestant[] = [
  { id: "as_m_e1", name: "Jalen Mercer", teamAbbr: "NYM", position: "PG", rating: 94, score: 0 },
  { id: "as_m_e2", name: "Darius Holloway", teamAbbr: "ATL", position: "SG", rating: 91, score: 0 },
  { id: "as_m_e3", name: "Connor Brooks", teamAbbr: "BOS", position: "SF", rating: 93, score: 0 },
  { id: "as_m_e4", name: "Grant Okafor", teamAbbr: "MIL", position: "PF", rating: 92, score: 0 },
  { id: "as_m_e5", name: "Andre Sterling", teamAbbr: "PHI", position: "C", rating: 91, score: 0 },
  { id: "as_m_e6", name: "Rafael Morales", teamAbbr: "MIA", position: "SG", rating: 89, score: 0 },
];

const MENS_STARTERS_WEST: AllStarContestant[] = [
  { id: "as_m_w1", name: "Ethan Park", teamAbbr: "BAY", position: "PG", rating: 95, score: 0 },
  { id: "as_m_w2", name: "Kaito Tanaka", teamAbbr: "LAE", position: "SG", rating: 92, score: 0 },
  { id: "as_m_w3", name: "Julian Cross", teamAbbr: "LAE", position: "SF", rating: 94, score: 0 },
  { id: "as_m_w4", name: "Nikola Petrov", teamAbbr: "DEN", position: "C", rating: 95, score: 0 },
  { id: "as_m_w5", name: "Luka Navarro", teamAbbr: "DAL", position: "PG", rating: 93, score: 0 },
  { id: "as_m_w6", name: "Owen Takahashi", teamAbbr: "SEA", position: "SF", rating: 89, score: 0 },
];

const WOMENS_STARTERS_EAST: AllStarContestant[] = [
  { id: "as_w_e1", name: "Sabrina Mercer", teamAbbr: "NYV", position: "PG", rating: 95, score: 0 },
  { id: "as_w_e2", name: "Caitlin Novak", teamAbbr: "IND", position: "PG", rating: 94, score: 0 },
  { id: "as_w_e3", name: "Breanna Sterling", teamAbbr: "NYV", position: "PF", rating: 94, score: 0 },
  { id: "as_w_e4", name: "Kamilla Delgado", teamAbbr: "CSK", position: "C", rating: 90, score: 0 },
  { id: "as_w_e5", name: "Rhyne Holloway", teamAbbr: "ATQ", position: "SG", rating: 91, score: 0 },
  { id: "as_w_e6", name: "Valeria Cruz", teamAbbr: "MBF", position: "SF", rating: 89, score: 0 },
];

const WOMENS_STARTERS_WEST: AllStarContestant[] = [
  { id: "as_w_w1", name: "A'ja Holloway", teamAbbr: "LVA", position: "C", rating: 96, score: 0 },
  { id: "as_w_w2", name: "Napheesa Lindholm", teamAbbr: "MNL", position: "PF", rating: 95, score: 0 },
  { id: "as_w_w3", name: "Jackie Alvarez", teamAbbr: "LVA", position: "SG", rating: 92, score: 0 },
  { id: "as_w_w4", name: "Yuki Park", teamAbbr: "SES", position: "SF", rating: 91, score: 0 },
  { id: "as_w_w5", name: "Sofia Navarro", teamAbbr: "PHM", position: "PG", rating: 90, score: 0 },
  { id: "as_w_w6", name: "Paige Vance", teamAbbr: "DLW", position: "PG", rating: 90, score: 0 },
];

export function getAllStarRosters(division: ProLeagueDivision) {
  return division === "womens"
    ? { east: WOMENS_STARTERS_EAST, west: WOMENS_STARTERS_WEST }
    : { east: MENS_STARTERS_EAST, west: MENS_STARTERS_WEST };
}

export function createInitialAllStarState(
  division: ProLeagueDivision = "mens",
  seasonYear = 2027,
  prevTrophies: AllStarTrophyEntry[] = []
): AllStarWeekendState {
  const { east, west } = getAllStarRosters(division);
  return {
    division,
    seasonYear,
    eastTeamName: division === "womens" ? "WPBA Eastern Stars" : "APBA Eastern All-Stars",
    westTeamName: division === "womens" ? "WPBA Western Stars" : "APBA Western All-Stars",
    gamePlayed: false,
    eastScore: 0,
    westScore: 0,
    gameMvp: null,
    threePointCompleted: false,
    threePointChampion: null,
    threePointLeaderboard: [east[0], west[0], east[1], west[2]].map((c) => ({ ...c, score: 0 })),
    dunkCompleted: false,
    dunkChampion: null,
    dunkLeaderboard: [east[2], west[1], east[3], west[5]].map((c) => ({ ...c, score: 0 })),
    trophies: prevTrophies,
    introsPresented: false,
  };
}

export function recordAllStarGameResult(
  state: AllStarWeekendState,
  eastScore: number,
  westScore: number,
  mvpName: string
): AllStarWeekendState {
  const fEast = eastScore === westScore ? eastScore + 3 : eastScore;
  const trophy: AllStarTrophyEntry = {
    id: `as_mvp_${state.division}_${Date.now()}`,
    seasonYear: state.seasonYear,
    division: state.division,
    event: "All-Star Game MVP",
    winnerName: mvpName,
    scoreSummary: `East ${fEast} - ${westScore} West`,
    dateIso: new Date().toISOString(),
  };
  return {
    ...state,
    gamePlayed: true,
    eastScore: fEast,
    westScore,
    gameMvp: mvpName,
    trophies: [...state.trophies, trophy],
  };
}

export function simulateAllStarThreePointContest(
  state: AllStarWeekendState,
  userPlayer?: { name: string; teamAbbr: string; score?: number }
): AllStarWeekendState {
  const { east, west } = getAllStarRosters(state.division);
  const pool: AllStarContestant[] = [
    ...(userPlayer
      ? [{
          id: "user_3pt",
          name: userPlayer.name,
          teamAbbr: userPlayer.teamAbbr || "YOU",
          position: "G",
          rating: 92,
          score: userPlayer.score ?? (21 + Math.floor(Math.random() * 9)),
          isUser: true,
        }]
      : []),
    { ...east[0], score: 20 + Math.floor(Math.random() * 8) },
    { ...west[0], score: 21 + Math.floor(Math.random() * 8) },
    { ...east[1], score: 18 + Math.floor(Math.random() * 9) },
    { ...west[1], score: 19 + Math.floor(Math.random() * 9) },
  ].sort((a, b) => b.score - a.score);

  const champ = pool[0];
  const trophy: AllStarTrophyEntry = {
    id: `as_3pt_${state.division}_${Date.now()}`,
    seasonYear: state.seasonYear,
    division: state.division,
    event: "3-Point Champion",
    winnerName: champ.name,
    scoreSummary: `${champ.score} / 30 PTS`,
    dateIso: new Date().toISOString(),
  };

  return {
    ...state,
    threePointCompleted: true,
    threePointChampion: champ.name,
    threePointLeaderboard: pool,
    trophies: [...state.trophies, trophy],
  };
}

export function simulateAllStarDunkContest(
  state: AllStarWeekendState,
  userPlayer?: { name: string; teamAbbr: string; score?: number }
): AllStarWeekendState {
  const { east, west } = getAllStarRosters(state.division);
  // 2-round judges score out of 100
  const pool: AllStarContestant[] = [
    ...(userPlayer
      ? [{
          id: "user_dunk",
          name: userPlayer.name,
          teamAbbr: userPlayer.teamAbbr || "YOU",
          position: "F",
          rating: 93,
          score: userPlayer.score ?? (88 + Math.floor(Math.random() * 12)),
          isUser: true,
        }]
      : []),
    { ...east[2], score: 85 + Math.floor(Math.random() * 14) },
    { ...west[2], score: 84 + Math.floor(Math.random() * 15) },
    { ...west[5], score: 82 + Math.floor(Math.random() * 16) },
  ].sort((a, b) => b.score - a.score);

  const champ = pool[0];
  const trophy: AllStarTrophyEntry = {
    id: `as_dunk_${state.division}_${Date.now()}`,
    seasonYear: state.seasonYear,
    division: state.division,
    event: "Dunk / Aerial Champion",
    winnerName: champ.name,
    scoreSummary: `${champ.score} / 100 Judges`,
    dateIso: new Date().toISOString(),
  };

  return {
    ...state,
    dunkCompleted: true,
    dunkChampion: champ.name,
    dunkLeaderboard: pool,
    trophies: [...state.trophies, trophy],
  };
}

export function loadAllStarState(division: ProLeagueDivision = "mens"): AllStarWeekendState {
  const key = division === "womens" ? SAVE_KEYS.ALLSTAR_WOMENS : SAVE_KEYS.ALLSTAR_MENS;
  return loadVersionedState<AllStarWeekendState>(
    key,
    () => createInitialAllStarState(division),
    (d): d is AllStarWeekendState =>
      Boolean(d && typeof d === "object" && Array.isArray((d as AllStarWeekendState).trophies))
  ).data;
}

export function saveAllStarState(state: AllStarWeekendState): void {
  const key = state.division === "womens" ? SAVE_KEYS.ALLSTAR_WOMENS : SAVE_KEYS.ALLSTAR_MENS;
  saveVersionedState(key, state);
}
