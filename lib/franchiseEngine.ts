import {
  APBA_TEAMS,
  computeLeaguePlayerOvr,
  createEmptyStatLine,
  generateDraftClass,
} from "./leagueData.ts";
import type { DraftProspect, LeaguePlayer } from "./leagueData.ts";
import { loadVersionedState, SAVE_KEYS, saveVersionedState } from "./saveSystem.ts";

export interface CoachStaff {
  headCoachName: string;
  offensiveStyle: "Pace & Space" | "Balanced Motion" | "Paint Force" | "Lockdown Grind";
  offenseRating: number; // 70..99
  defenseRating: number; // 70..99
  playerDevRating: number; // 70..99
  annualSalaryM: number;
}

export interface DraftPickAsset {
  id: string;
  year: number;
  round: 1 | 2;
  originalTeamAbbr: string;
}

export interface FranchiseFinances {
  cashReservesM: number;
  salaryCapM: number;
  luxuryTaxLineM: number;
  ticketPrice: number; // $45 - $240
  ticketRevenuePerHomeGameM: number;
  merchRevenueAnnualM: number;
  arenaUpkeepAnnualM: number;
}

export interface FranchiseHistoryEntry {
  seasonYear: number;
  teamId: string;
  wins: number;
  losses: number;
  playoffResult: string;
}

export interface FranchiseState {
  teamId: string;
  ownerName: string;
  gmName: string;
  ownerPatience: number; // 0..100
  chemistry: number; // 0..100
  fanSupport: number; // 0..100
  coach: CoachStaff;
  finances: FranchiseFinances;
  draftPicks: DraftPickAsset[];
  draftBoard: DraftProspect[];
  history: FranchiseHistoryEntry[];
  lastActionNote: string;
}

export function createInitialFranchiseState(teamId = "apba_nyc_monarchs"): FranchiseState {
  const team = APBA_TEAMS.find((t) => t.id === teamId) || APBA_TEAMS[0];
  const baseMarketCash = team.marketSize === "Large" ? 48 : team.marketSize === "Mid" ? 32 : 24;

  return {
    teamId: team.id,
    ownerName: "Victoria Kensington",
    gmName: "Jordan Vance",
    ownerPatience: 84,
    chemistry: 78,
    fanSupport: team.marketSize === "Large" ? 86 : 74,
    coach: {
      headCoachName: team.coachName,
      offensiveStyle: team.coachStyle,
      offenseRating: 82,
      defenseRating: 80,
      playerDevRating: 81,
      annualSalaryM: 6.5,
    },
    finances: {
      cashReservesM: baseMarketCash,
      salaryCapM: 140,
      luxuryTaxLineM: 170,
      ticketPrice: team.marketSize === "Large" ? 135 : 88,
      ticketRevenuePerHomeGameM: team.marketSize === "Large" ? 2.4 : 1.5,
      merchRevenueAnnualM: team.marketSize === "Large" ? 28 : 16,
      arenaUpkeepAnnualM: 22,
    },
    draftPicks: [
      { id: "pk_2027_r1", year: 2027, round: 1, originalTeamAbbr: team.abbr },
      { id: "pk_2027_r2", year: 2027, round: 2, originalTeamAbbr: team.abbr },
      { id: "pk_2028_r1", year: 2028, round: 1, originalTeamAbbr: team.abbr },
      { id: "pk_2028_r2", year: 2028, round: 2, originalTeamAbbr: team.abbr },
    ],
    draftBoard: generateDraftClass(2027, 24),
    history: [],
    lastActionNote: `Took front office control of the ${team.city} ${team.name}.`,
  };
}

export function calculateTeamPayrollM(players: LeaguePlayer[], teamId: string): number {
  const sum = players
    .filter((p) => p.teamId === teamId)
    .reduce((acc, p) => acc + p.salaryMillions, 0);
  return Number(sum.toFixed(1));
}

export function getPlayerTradeValue(p: LeaguePlayer): number {
  const ageFactor = p.age <= 24 ? 14 : p.age <= 28 ? 8 : p.age >= 33 ? -12 : 0;
  const ovrScore = Math.pow(Math.max(1, p.ratings.ovr - 62), 1.55) * 1.4;
  return Math.max(5, Math.round(ovrScore + ageFactor));
}

export interface TradeEvaluation {
  validSalaryMatch: boolean;
  aiAccepts: boolean;
  userOutgoingSalaryM: number;
  userIncomingSalaryM: number;
  userOutgoingValue: number;
  userIncomingValue: number;
  reason: string;
}

export function evaluateTradeProposal(params: {
  players: LeaguePlayer[];
  userTeamId: string;
  partnerTeamId: string;
  userOutgoingPlayerIds: string[];
  partnerOutgoingPlayerIds: string[];
  includeUserFirstRoundPick?: boolean;
}): TradeEvaluation {
  const outPlayers = params.players.filter(
    (p) => p.teamId === params.userTeamId && params.userOutgoingPlayerIds.includes(p.id)
  );
  const inPlayers = params.players.filter(
    (p) => p.teamId === params.partnerTeamId && params.partnerOutgoingPlayerIds.includes(p.id)
  );

  if (outPlayers.length === 0 || inPlayers.length === 0) {
    return {
      validSalaryMatch: false,
      aiAccepts: false,
      userOutgoingSalaryM: 0,
      userIncomingSalaryM: 0,
      userOutgoingValue: 0,
      userIncomingValue: 0,
      reason: "Select at least one player from both teams.",
    };
  }

  const outSal = Number(outPlayers.reduce((s, p) => s + p.salaryMillions, 0).toFixed(1));
  const inSal = Number(inPlayers.reduce((s, p) => s + p.salaryMillions, 0).toFixed(1));

  // CBA-style 125% + $2.5M salary matching rule
  const maxAllowedIn = outSal * 1.25 + 2.5;
  const maxAllowedOut = inSal * 1.25 + 2.5;
  const validSalaryMatch = inSal <= maxAllowedIn && outSal <= maxAllowedOut;

  const pickBonus = params.includeUserFirstRoundPick ? 36 : 0;
  const outVal = outPlayers.reduce((s, p) => s + getPlayerTradeValue(p), 0) + pickBonus;
  const inVal = inPlayers.reduce((s, p) => s + getPlayerTradeValue(p), 0);

  if (!validSalaryMatch) {
    return {
      validSalaryMatch: false,
      aiAccepts: false,
      userOutgoingSalaryM: outSal,
      userIncomingSalaryM: inSal,
      userOutgoingValue: outVal,
      userIncomingValue: inVal,
      reason: `Salary mismatch: Outgoing $${outSal}M vs Incoming $${inSal}M exceeds 125% + $2.5M tolerance.`,
    };
  }

  const aiAccepts = outVal >= inVal * 0.94;
  return {
    validSalaryMatch: true,
    aiAccepts,
    userOutgoingSalaryM: outSal,
    userIncomingSalaryM: inSal,
    userOutgoingValue: outVal,
    userIncomingValue: inVal,
    reason: aiAccepts
      ? "Front office agrees to trade terms!"
      : `Partner GM declined (Needs +${Math.ceil(inVal * 0.94 - outVal)} trade value or a 1st-round pick).`,
  };
}

export function executeApprovedTrade(params: {
  franchise: FranchiseState;
  players: LeaguePlayer[];
  partnerTeamId: string;
  userOutgoingPlayerIds: string[];
  partnerOutgoingPlayerIds: string[];
  pickIdToInclude?: string;
}): { franchise: FranchiseState; players: LeaguePlayer[] } {
  const nextPlayers = params.players.map((p) => {
    if (params.userOutgoingPlayerIds.includes(p.id) && p.teamId === params.franchise.teamId) {
      return { ...p, teamId: params.partnerTeamId };
    }
    if (params.partnerOutgoingPlayerIds.includes(p.id) && p.teamId === params.partnerTeamId) {
      return { ...p, teamId: params.franchise.teamId };
    }
    return p;
  });

  const nextPicks = params.pickIdToInclude
    ? params.franchise.draftPicks.filter((pk) => pk.id !== params.pickIdToInclude)
    : params.franchise.draftPicks;

  return {
    players: nextPlayers,
    franchise: {
      ...params.franchise,
      draftPicks: nextPicks,
      chemistry: Math.max(40, params.franchise.chemistry - 3),
      lastActionNote: `Completed multi-player trade with ${
        APBA_TEAMS.find((t) => t.id === params.partnerTeamId)?.name || "Partner Team"
      }.`,
    },
  };
}

export function draftProspectToTeam(params: {
  franchise: FranchiseState;
  players: LeaguePlayer[];
  prospectId: string;
}): { franchise: FranchiseState; players: LeaguePlayer[] } {
  const prospect = params.franchise.draftBoard.find((p) => p.id === params.prospectId);
  if (!prospect) return { franchise: params.franchise, players: params.players };

  const teamRoster = params.players.filter((p) => p.teamId === params.franchise.teamId);
  const usedNums = new Set(teamRoster.map((p) => p.jerseyNumber));
  let num = 1;
  while (usedNums.has(num)) num++;

  const newPlayer: LeaguePlayer = {
    id: `rookie_${Date.now()}_${prospect.id}`,
    teamId: params.franchise.teamId,
    name: prospect.name,
    position: prospect.position,
    jerseyNumber: num,
    age: prospect.age,
    yearsPro: 0,
    isStarter: false,
    archetype: prospect.archetype,
    ratings: { ...prospect.ratings },
    contractYears: 3,
    salaryMillions: 4.8,
    seasonStats: createEmptyStatLine(),
    careerStats: createEmptyStatLine(),
    priorSeasonPpg: 0,
    priorSeasonRpg: 0,
    priorSeasonApg: 0,
    priorSeasonOvr: prospect.ratings.ovr,
  };

  // Use earliest draft pick if available
  const remainingPicks = params.franchise.draftPicks.slice(1);
  return {
    players: [...params.players, newPlayer],
    franchise: {
      ...params.franchise,
      draftPicks: remainingPicks,
      draftBoard: params.franchise.draftBoard.filter((d) => d.id !== prospect.id),
      fanSupport: Math.min(100, params.franchise.fanSupport + 4),
      lastActionNote: `Drafted ${prospect.name} (${prospect.position}, ${prospect.ratings.ovr} OVR) in the APBA Rookie Draft!`,
    },
  };
}

export function runTeamTrainingCamp(
  franchise: FranchiseState,
  players: LeaguePlayer[],
  focus: "shooting" | "defense" | "athleticism"
): { franchise: FranchiseState; players: LeaguePlayer[] } {
  const devBoost = franchise.coach.playerDevRating >= 84 ? 2 : 1;
  const nextPlayers = players.map((p) => {
    if (p.teamId !== franchise.teamId) return p;
    const raw = {
      shooting: Math.min(99, p.ratings.shooting + (focus === "shooting" ? devBoost : 0)),
      finishing: Math.min(99, p.ratings.finishing + (focus === "athleticism" ? 1 : 0)),
      playmaking: p.ratings.playmaking,
      defense: Math.min(99, p.ratings.defense + (focus === "defense" ? devBoost : 0)),
      rebounding: p.ratings.rebounding,
      athleticism: Math.min(99, p.ratings.athleticism + (focus === "athleticism" ? devBoost : 0)),
    };
    return {
      ...p,
      ratings: { ovr: computeLeaguePlayerOvr(raw), ...raw },
    };
  });

  return {
    players: nextPlayers,
    franchise: {
      ...franchise,
      chemistry: Math.min(100, franchise.chemistry + 3),
      lastActionNote: `Completed ${focus.toUpperCase()} Training Camp (+Chemistry, +${devBoost} Focus Skill).`,
    },
  };
}

export function loadFranchiseState(defaultTeamId = "apba_nyc_monarchs"): FranchiseState {
  return loadVersionedState<FranchiseState>(
    SAVE_KEYS.FRANCHISE,
    () => createInitialFranchiseState(defaultTeamId),
    (d): d is FranchiseState =>
      Boolean(d && typeof d === "object" && typeof (d as FranchiseState).teamId === "string" && (d as FranchiseState).coach)
  ).data;
}

export function saveFranchiseState(state: FranchiseState): void {
  saveVersionedState(SAVE_KEYS.FRANCHISE, state);
}
