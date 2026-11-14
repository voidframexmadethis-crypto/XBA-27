export interface PlayerBoxScoreStats {
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fouls: number;
}

export interface FinalPlayerSummaryRow extends PlayerBoxScoreStats {
  name: string;
  pos: string;
  team: "Home" | "Away";
  isUser: boolean;
  fgPct: number;
  tpPct: number;
}

export interface TeamTotalsSummary extends PlayerBoxScoreStats {
  team: "Home" | "Away";
  fgPct: number;
  tpPct: number;
}

export interface EndGameSummaryPayload {
  players: FinalPlayerSummaryRow[];
  homeTotals: TeamTotalsSummary;
  awayTotals: TeamTotalsSummary;
}

export function createEmptyPlayerStats(): PlayerBoxScoreStats {
  return {
    pts: 0,
    fgm: 0,
    fga: 0,
    tpm: 0,
    tpa: 0,
    reb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    tov: 0,
    fouls: 0,
  };
}

export function computeShootingPct(made: number, attempts: number): number {
  if (attempts <= 0 || made <= 0) return 0;
  return Math.round((Math.min(made, attempts) / attempts) * 1000) / 10;
}

function createTeamTotals(team: "Home" | "Away"): TeamTotalsSummary {
  return {
    team,
    ...createEmptyPlayerStats(),
    fgPct: 0,
    tpPct: 0,
  };
}

export function buildEndGameSummaryData(
  rawPlayers: Array<{
    name: string;
    pos?: string;
    team: "Home" | "Away";
    isUser: boolean;
    stats: Partial<PlayerBoxScoreStats>;
  }>
): EndGameSummaryPayload {
  const homeTotals = createTeamTotals("Home");
  const awayTotals = createTeamTotals("Away");

  const players: FinalPlayerSummaryRow[] = rawPlayers.map((p) => {
    const fgm = Math.max(0, p.stats.fgm ?? 0);
    const fga = Math.max(fgm, p.stats.fga ?? 0);
    const tpm = Math.max(0, p.stats.tpm ?? 0);
    const tpa = Math.max(tpm, p.stats.tpa ?? 0);
    const pts = Math.max(0, p.stats.pts ?? 0);
    const reb = Math.max(0, p.stats.reb ?? 0);
    const ast = Math.max(0, p.stats.ast ?? 0);
    const stl = Math.max(0, p.stats.stl ?? 0);
    const blk = Math.max(0, p.stats.blk ?? 0);
    const tov = Math.max(0, p.stats.tov ?? 0);
    const fouls = Math.max(0, p.stats.fouls ?? 0);

    const target = p.team === "Home" ? homeTotals : awayTotals;
    target.pts += pts;
    target.fgm += fgm;
    target.fga += fga;
    target.tpm += tpm;
    target.tpa += tpa;
    target.reb += reb;
    target.ast += ast;
    target.stl += stl;
    target.blk += blk;
    target.tov += tov;
    target.fouls += fouls;

    return {
      name: p.name,
      pos: p.pos || "G",
      team: p.team,
      isUser: p.isUser,
      pts,
      fgm,
      fga,
      fgPct: computeShootingPct(fgm, fga),
      tpm,
      tpa,
      tpPct: computeShootingPct(tpm, tpa),
      reb,
      ast,
      stl,
      blk,
      tov,
      fouls,
    };
  });

  homeTotals.fgPct = computeShootingPct(homeTotals.fgm, homeTotals.fga);
  homeTotals.tpPct = computeShootingPct(homeTotals.tpm, homeTotals.tpa);
  awayTotals.fgPct = computeShootingPct(awayTotals.fgm, awayTotals.fga);
  awayTotals.tpPct = computeShootingPct(awayTotals.tpm, awayTotals.tpa);

  const sorted = players.sort((a, b) => {
    const impactA = a.pts + a.ast * 1.8 + a.reb * 1.4 + a.stl * 2 + a.blk * 2 - a.tov * 1.2;
    const impactB = b.pts + b.ast * 1.8 + b.reb * 1.4 + b.stl * 2 + b.blk * 2 - b.tov * 1.2;
    if (impactB !== impactA) return impactB - impactA;
    if (b.pts !== a.pts) return b.pts - a.pts;
    return a.isUser ? -1 : b.isUser ? 1 : 0;
  });

  return {
    players: sorted,
    homeTotals,
    awayTotals,
  };
}

export interface DeadBallInboundResolution {
  possessingTeam: "Home" | "Away";
  inboundX: number | null;
  inboundZ: number | null;
}

/**
 * Resolves which team gets the ball after a dead-ball period (score, foul, turnover)
 * and where the inbounder starts so offense <-> defense transitions never invert.
 */
export function resolveDeadBallInboundOwner(params: {
  isPractice: boolean;
  deadReason: string | null;
  lastScoringTeam: "Home" | "Away" | null;
  currentOwnerTeam: "Home" | "Away" | null;
  possessingTeam: "Home" | "Away";
  ballZ: number;
}): DeadBallInboundResolution {
  const { isPractice, deadReason, lastScoringTeam, currentOwnerTeam, possessingTeam, ballZ } = params;
  const clampedZ = Math.max(-2.5, Math.min(2.5, Number.isFinite(ballZ) ? ballZ : 0));

  if (isPractice) {
    return {
      possessingTeam: "Home",
      inboundX: deadReason === "score" && lastScoringTeam === "Away" ? -12.2 : null,
      inboundZ: deadReason === "score" && lastScoringTeam === "Away" ? clampedZ : null,
    };
  }

  if (deadReason === "score" && lastScoringTeam === "Home") {
    return {
      possessingTeam: "Away",
      inboundX: 12.2,
      inboundZ: clampedZ,
    };
  }

  if (deadReason === "score" && lastScoringTeam === "Away") {
    return {
      possessingTeam: "Home",
      inboundX: -12.2,
      inboundZ: clampedZ,
    };
  }

  // Fouls and turnovers preserve the team awarded possession rather than forcing Home!
  const nextTeam = currentOwnerTeam ?? possessingTeam;
  return {
    possessingTeam: nextTeam,
    inboundX: null,
    inboundZ: null,
  };
}
