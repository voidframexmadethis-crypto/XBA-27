import {
  APBA_TEAMS,
  CHAMPIONSHIP_TROPHY_NAME,
  createEmptyStatLine,
  generateInitialRosters,
} from "./leagueData.ts";
import type {
  LeagueConference,
  LeagueDivision,
  LeaguePlayer,
  LeagueTeamTemplate,
  PlayerStatLine,
  PositionCode,
} from "./leagueData.ts";
import { loadVersionedState, SAVE_KEYS, saveVersionedState } from "./saveSystem.ts";

export interface ScheduledGame {
  id: string;
  round: number; // 1..82
  homeTeamId: string;
  awayTeamId: string;
  played: boolean;
  isUserPlayed?: boolean;
  homeScore: number;
  awayScore: number;
  overtimePeriods: number;
  topPerformer?: {
    playerId: string;
    playerName: string;
    teamId: string;
    pts: number;
    reb: number;
    ast: number;
  };
}

export interface TeamStanding {
  teamId: string;
  city: string;
  name: string;
  abbr: string;
  conference: LeagueConference;
  division: LeagueDivision;
  primaryColor: string;
  secondaryColor: string;
  wins: number;
  losses: number;
  gp: number;
  winPct: number;
  homeWins: number;
  homeLosses: number;
  awayWins: number;
  awayLosses: number;
  confWins: number;
  confLosses: number;
  divWins: number;
  divLosses: number;
  pf: number;
  pa: number;
  diff: number;
  streak: number; // positive = W streak, negative = L streak
  last10Wins: number;
  last10Losses: number;
  gb: number;
  confRank: number;
  divRank: number;
  playoffClinched: boolean;
  isDivisionLeader: boolean;
  teamRating: number;
}

export interface AwardSelection {
  award: string;
  playerId: string;
  playerName: string;
  teamId: string;
  teamAbbr: string;
  position: PositionCode;
  statSummary: string;
  score: number;
}

export interface SeasonAwardsSummary {
  seasonYear: number;
  mvp: AwardSelection;
  dpoy: AwardSelection;
  roy: AwardSelection;
  sixthMan: AwardSelection;
  mip: AwardSelection;
  allStarEast: AwardSelection[];
  allStarWest: AwardSelection[];
  allLeagueFirst: AwardSelection[];
  allLeagueSecond: AwardSelection[];
  allDefensiveFirst: AwardSelection[];
}

export type PlayoffRoundCode = "conf_first_round" | "conf_semis" | "conf_finals" | "finals" | "complete";

export interface PlayoffSeriesGame {
  gameNumber: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  winnerId: string;
  topScorerName: string;
  topScorerPts: number;
}

export interface PlayoffSeries {
  id: string;
  round: Exclude<PlayoffRoundCode, "complete">;
  conference: LeagueConference | "Finals";
  slot: number; // 0..3 for R1, 0..1 for Semis, 0 for Conf Finals / Finals
  highSeedTeamId: string;
  lowSeedTeamId: string;
  highSeedRank: number;
  lowSeedRank: number;
  highSeedWins: number;
  lowSeedWins: number;
  winnerId: string | null;
  games: PlayoffSeriesGame[];
  mvpStatsByPlayer: Record<
    string,
    {
      playerId: string;
      playerName: string;
      teamId: string;
      gp: number;
      pts: number;
      reb: number;
      ast: number;
      stl: number;
      blk: number;
    }
  >;
}

export interface ChampionshipRecord {
  seasonYear: number;
  championTeamId: string;
  championTeamName: string;
  championAbbr: string;
  runnerUpTeamId: string;
  runnerUpTeamName: string;
  seriesScore: string;
  trophyName: string;
  finalsMvp: {
    playerId: string;
    playerName: string;
    teamId: string;
    ppg: number;
    rpg: number;
    apg: number;
  };
  seasonMvpName: string;
}

export interface LeagueState {
  seasonYear: number;
  phase: "regular_season" | "playoffs" | "offseason";
  currentRound: number; // 1..83 (83 means regular season complete)
  schedule: ScheduledGame[];
  players: LeaguePlayer[];
  awardsHistory: SeasonAwardsSummary[];
  playoffs: {
    currentRound: PlayoffRoundCode;
    series: PlayoffSeries[];
    championTeamId: string | null;
    finalsMvp: ChampionshipRecord["finalsMvp"] | null;
  } | null;
  championshipHistory: ChampionshipRecord[];
  userTeamId: string;
}

// ============================================================================
// MATHEMATICALLY VERIFIED 82-GAME SCHEDULE GENERATOR
// ============================================================================

function circleRoundRobinPairings(indices: number[]): [number, number][][] {
  const n = indices.length;
  if (n % 2 !== 0) throw new Error("Circle method requires an even number of teams");
  const arr = [...indices];
  const rounds: [number, number][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs: [number, number][] = [];
    for (let i = 0; i < n / 2; i++) {
      pairs.push([arr[i], arr[n - 1 - i]]);
    }
    rounds.push(pairs);
    // Rotate keeping index 0 fixed
    const last = arr.pop()!;
    arr.splice(1, 0, last);
  }
  return rounds;
}

/**
 * Takes two edge-disjoint perfect matchings M_a and M_b on the same vertex set
 * and orients every alternating cycle so every vertex gets exact 1 Home & 1 Away game.
 */
function orientMatchingPair(
  matchingA: [number, number][],
  matchingB: [number, number][]
): { roundA: { home: number; away: number }[]; roundB: { home: number; away: number }[] } {
  const adjA = new Map<number, number>();
  const adjB = new Map<number, number>();
  const edgeIndexA = new Map<string, number>();
  const edgeIndexB = new Map<string, number>();

  const edgeKey = (u: number, v: number) => (u < v ? `${u}-${v}` : `${v}-${u}`);

  matchingA.forEach(([u, v], idx) => {
    adjA.set(u, v);
    adjA.set(v, u);
    edgeIndexA.set(edgeKey(u, v), idx);
  });
  matchingB.forEach(([u, v], idx) => {
    adjB.set(u, v);
    adjB.set(v, u);
    edgeIndexB.set(edgeKey(u, v), idx);
  });

  const roundA: { home: number; away: number }[] = new Array(matchingA.length);
  const roundB: { home: number; away: number }[] = new Array(matchingB.length);
  const visited = new Set<number>();

  for (const start of adjA.keys()) {
    if (visited.has(start)) continue;
    let curr = start;
    let useA = true;
    while (!visited.has(curr) || curr !== start || !useA) {
      if (useA) visited.add(curr);
      const next = useA ? adjA.get(curr)! : adjB.get(curr)!;
      const key = edgeKey(curr, next);
      if (useA) {
        const idx = edgeIndexA.get(key)!;
        roundA[idx] = { home: curr, away: next };
      } else {
        const idx = edgeIndexB.get(key)!;
        roundB[idx] = { home: curr, away: next };
      }
      curr = next;
      useA = !useA;
      if (curr === start && useA) break;
    }
  }

  return { roundA, roundB };
}

export function generate82GameSchedule(
  teams: LeagueTeamTemplate[] = APBA_TEAMS,
  seasonYear = 2027
): ScheduledGame[] {
  const n = teams.length;
  if (n !== 20) {
    throw new Error(`Expected 20 APBA teams for balanced 82-game schedule, got ${n}`);
  }

  const allIndices = teams.map((_, i) => i);
  const fullCycle = circleRoundRobinPairings(allIndices); // 19 rounds

  const games: ScheduledGame[] = [];
  let gameCounter = 1;
  let roundNumber = 1;

  // 4 full round robins = 76 rounds (exact 38 Home, 38 Away per team)
  for (let rep = 0; rep < 4; rep++) {
    const flipHome = rep % 2 === 1;
    for (let r = 0; r < fullCycle.length; r++) {
      const pairs = fullCycle[r];
      pairs.forEach(([u, v], idx) => {
        const defaultUHome = (r + idx) % 2 === 0;
        const uIsHome = flipHome ? !defaultUHome : defaultUHome;
        const homeIdx = uIsHome ? u : v;
        const awayIdx = uIsHome ? v : u;
        games.push({
          id: `g_${seasonYear}_r${roundNumber}_${gameCounter++}`,
          round: roundNumber,
          homeTeamId: teams[homeIdx].id,
          awayTeamId: teams[awayIdx].id,
          played: false,
          homeScore: 0,
          awayScore: 0,
          overtimePeriods: 0,
        });
      });
      roundNumber++;
    }
  }

  // Extra 6 conference rounds (exact 3 Home, 3 Away per team -> 41H + 41A = 82 games total)
  const eastIndices = teams
    .map((t, i) => ({ t, i }))
    .filter((x) => x.t.conference === "Eastern")
    .map((x) => x.i);
  const westIndices = teams
    .map((t, i) => ({ t, i }))
    .filter((x) => x.t.conference === "Western")
    .map((x) => x.i);

  const eastRR = circleRoundRobinPairings(eastIndices);
  const westRR = circleRoundRobinPairings(westIndices);

  for (const pairIdx of [0, 2, 4]) {
    const eOriented = orientMatchingPair(eastRR[pairIdx], eastRR[pairIdx + 1]);
    const wOriented = orientMatchingPair(westRR[pairIdx], westRR[pairIdx + 1]);

    // Round A
    for (const m of [...eOriented.roundA, ...wOriented.roundA]) {
      games.push({
        id: `g_${seasonYear}_r${roundNumber}_${gameCounter++}`,
        round: roundNumber,
        homeTeamId: teams[m.home].id,
        awayTeamId: teams[m.away].id,
        played: false,
        homeScore: 0,
        awayScore: 0,
        overtimePeriods: 0,
      });
    }
    roundNumber++;

    // Round B
    for (const m of [...eOriented.roundB, ...wOriented.roundB]) {
      games.push({
        id: `g_${seasonYear}_r${roundNumber}_${gameCounter++}`,
        round: roundNumber,
        homeTeamId: teams[m.home].id,
        awayTeamId: teams[m.away].id,
        played: false,
        homeScore: 0,
        awayScore: 0,
        overtimePeriods: 0,
      });
    }
    roundNumber++;
  }

  return games;
}

// ============================================================================
// STANDINGS & TIEBREAKERS
// ============================================================================

export function calculateStandings(state: LeagueState): TeamStanding[] {
  const teamMap = new Map<string, TeamStanding>();
  const h2hWins = new Map<string, Map<string, number>>();
  const recentResults = new Map<string, boolean[]>();

  APBA_TEAMS.forEach((t) => {
    const roster = state.players.filter((p) => p.teamId === t.id);
    const topEight = [...roster].sort((a, b) => b.ratings.ovr - a.ratings.ovr).slice(0, 8);
    const avgOvr =
      topEight.length > 0
        ? Math.round(topEight.reduce((acc, p) => acc + p.ratings.ovr, 0) / topEight.length)
        : t.baseRating;

    teamMap.set(t.id, {
      teamId: t.id,
      city: t.city,
      name: t.name,
      abbr: t.abbr,
      conference: t.conference,
      division: t.division,
      primaryColor: t.primaryColor,
      secondaryColor: t.secondaryColor,
      wins: 0,
      losses: 0,
      gp: 0,
      winPct: 0,
      homeWins: 0,
      homeLosses: 0,
      awayWins: 0,
      awayLosses: 0,
      confWins: 0,
      confLosses: 0,
      divWins: 0,
      divLosses: 0,
      pf: 0,
      pa: 0,
      diff: 0,
      streak: 0,
      last10Wins: 0,
      last10Losses: 0,
      gb: 0,
      confRank: 1,
      divRank: 1,
      playoffClinched: false,
      isDivisionLeader: false,
      teamRating: avgOvr,
    });
    h2hWins.set(t.id, new Map());
    recentResults.set(t.id, []);
  });

  const playedGames = state.schedule
    .filter((g) => g.played)
    .sort((a, b) => a.round - b.round);

  for (const g of playedGames) {
    const home = teamMap.get(g.homeTeamId);
    const away = teamMap.get(g.awayTeamId);
    if (!home || !away) continue;

    const homeWon = g.homeScore > g.awayScore;
    home.gp += 1;
    away.gp += 1;
    home.pf += g.homeScore;
    home.pa += g.awayScore;
    away.pf += g.awayScore;
    away.pa += g.homeScore;

    if (homeWon) {
      home.wins += 1;
      home.homeWins += 1;
      away.losses += 1;
      away.awayLosses += 1;
      h2hWins.get(home.teamId)!.set(away.teamId, (h2hWins.get(home.teamId)!.get(away.teamId) || 0) + 1);
    } else {
      away.wins += 1;
      away.awayWins += 1;
      home.losses += 1;
      home.homeLosses += 1;
      h2hWins.get(away.teamId)!.set(home.teamId, (h2hWins.get(away.teamId)!.get(home.teamId) || 0) + 1);
    }

    if (home.conference === away.conference) {
      if (homeWon) {
        home.confWins += 1;
        away.confLosses += 1;
      } else {
        away.confWins += 1;
        home.confLosses += 1;
      }
    }

    if (home.division === away.division) {
      if (homeWon) {
        home.divWins += 1;
        away.divLosses += 1;
      } else {
        away.divWins += 1;
        home.divLosses += 1;
      }
    }

    recentResults.get(home.teamId)!.push(homeWon);
    recentResults.get(away.teamId)!.push(!homeWon);
  }

  for (const s of teamMap.values()) {
    s.winPct = s.gp > 0 ? s.wins / s.gp : 0;
    s.diff = s.gp > 0 ? Number(((s.pf - s.pa) / s.gp).toFixed(1)) : 0;
    const hist = recentResults.get(s.teamId)!;
    const last10 = hist.slice(-10);
    s.last10Wins = last10.filter(Boolean).length;
    s.last10Losses = last10.length - s.last10Wins;
    if (hist.length > 0) {
      const last = hist[hist.length - 1];
      let count = 0;
      for (let i = hist.length - 1; i >= 0 && hist[i] === last; i--) {
        count++;
      }
      s.streak = last ? count : -count;
    }
  }

  const compareStandings = (a: TeamStanding, b: TeamStanding): number => {
    // 1. Winning percentage
    if (Math.abs(b.winPct - a.winPct) > 1e-6) return b.winPct - a.winPct;
    // 2. Head-to-head winning percentage
    const aVsB = h2hWins.get(a.teamId)?.get(b.teamId) || 0;
    const bVsA = h2hWins.get(b.teamId)?.get(a.teamId) || 0;
    if (aVsB !== bVsA) return bVsA - aVsB;
    // 3. Conference winning percentage
    const aConfPct = a.confWins + a.confLosses > 0 ? a.confWins / (a.confWins + a.confLosses) : 0;
    const bConfPct = b.confWins + b.confLosses > 0 ? b.confWins / (b.confWins + b.confLosses) : 0;
    if (Math.abs(bConfPct - aConfPct) > 1e-6) return bConfPct - aConfPct;
    // 4. Division winning percentage
    const aDivPct = a.divWins + a.divLosses > 0 ? a.divWins / (a.divWins + a.divLosses) : 0;
    const bDivPct = b.divWins + b.divLosses > 0 ? b.divWins / (b.divWins + b.divLosses) : 0;
    if (Math.abs(bDivPct - aDivPct) > 1e-6) return bDivPct - aDivPct;
    // 5. Point differential
    if (b.diff !== a.diff) return b.diff - a.diff;
    return a.name.localeCompare(b.name);
  };

  // Division rankings first
  const divisions: LeagueDivision[] = ["Atlantic", "Central", "Mountain", "Pacific"];
  for (const div of divisions) {
    const divTeams = [...teamMap.values()].filter((t) => t.division === div).sort(compareStandings);
    divTeams.forEach((t, idx) => {
      t.divRank = idx + 1;
      t.isDivisionLeader = idx === 0 && t.gp > 0;
    });
  }

  // Conference rankings + GB
  const conferences: LeagueConference[] = ["Eastern", "Western"];
  for (const conf of conferences) {
    const confTeams = [...teamMap.values()].filter((t) => t.conference === conf).sort(compareStandings);
    const leader = confTeams[0];
    confTeams.forEach((t, idx) => {
      t.confRank = idx + 1;
      t.gb = leader ? Math.max(0, ((leader.wins - t.wins) + (t.losses - leader.losses)) / 2) : 0;
      t.playoffClinched = idx < 8;
    });
  }

  return [...teamMap.values()].sort(compareStandings);
}

// ============================================================================
// REALISTIC GAME & PLAYER BOX SCORE SIMULATOR
// ============================================================================

function seededNoise(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function getTeamStrength(players: LeaguePlayer[], teamId: string): number {
  const roster = players
    .filter((p) => p.teamId === teamId)
    .sort((a, b) => (a.isStarter === b.isStarter ? b.ratings.ovr - a.ratings.ovr : a.isStarter ? -1 : 1));
  if (roster.length === 0) return 78;
  const starters = roster.slice(0, 5);
  const bench = roster.slice(5, 10);
  const sAvg = starters.reduce((s, p) => s + p.ratings.ovr, 0) / Math.max(1, starters.length);
  const bAvg = bench.length > 0 ? bench.reduce((s, p) => s + p.ratings.ovr, 0) / bench.length : sAvg - 7;
  return sAvg * 0.76 + bAvg * 0.24;
}

function accumulateStat(target: PlayerStatLine, delta: PlayerStatLine): void {
  target.gp += delta.gp;
  target.gs += delta.gs;
  target.min += delta.min;
  target.pts += delta.pts;
  target.reb += delta.reb;
  target.ast += delta.ast;
  target.stl += delta.stl;
  target.blk += delta.blk;
  target.tov += delta.tov;
  target.fgm += delta.fgm;
  target.fga += delta.fga;
  target.tpm += delta.tpm;
  target.tpa += delta.tpa;
  target.ftm += delta.ftm;
  target.fta += delta.fta;
}

function generateTeamBoxScore(
  roster: LeaguePlayer[],
  targetTeamScore: number,
  opponentStrength: number,
  seedBase: number,
  minutesScale = 1
): { actualScore: number; lines: Map<string, PlayerStatLine>; top: { player: LeaguePlayer; pts: number; reb: number; ast: number } } {
  const ordered = [...roster].sort((a, b) =>
    a.isStarter === b.isStarter ? b.ratings.ovr - a.ratings.ovr : a.isStarter ? -1 : 1
  );
  const active = ordered.slice(0, Math.min(10, ordered.length));
  const weights = active.map((p, i) => {
    const baseMin = p.isStarter || i < 5 ? 32 : 16;
    const ratingEdge = Math.max(0.5, (p.ratings.ovr - 58) / 30);
    return baseMin * (0.65 + ratingEdge * 0.75);
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;

  // Allocate points proportionally so team total matches targetTeamScore cleanly
  const rawPts = active.map((p, i) => {
    const share = weights[i] / totalWeight;
    const variance = 0.78 + seededNoise(seedBase + i * 13) * 0.48;
    return targetTeamScore * share * variance;
  });
  const rawSum = rawPts.reduce((a, b) => a + b, 0) || 1;
  const ptsInt = rawPts.map((x) => Math.max(0, Math.round((x / rawSum) * targetTeamScore)));
  let diff = targetTeamScore - ptsInt.reduce((a, b) => a + b, 0);
  let cursor = 0;
  while (diff !== 0 && ptsInt.length > 0) {
    if (diff > 0) {
      ptsInt[cursor % ptsInt.length] += 1;
      diff--;
    } else if (ptsInt[cursor % ptsInt.length] > 0) {
      ptsInt[cursor % ptsInt.length] -= 1;
      diff++;
    }
    cursor++;
    if (cursor > 300) break;
  }

  const lines = new Map<string, PlayerStatLine>();
  let topPlayer = active[0];
  let topScore = -1;

  active.forEach((p, i) => {
    const pts = ptsInt[i];
    const mins = Math.round((p.isStarter || i < 5 ? 30 + seededNoise(seedBase + i * 3) * 8 : 13 + seededNoise(seedBase + i * 5) * 9) * minutesScale);

    // Derive FT, 3PT, 2PT consistently so 2*(fgm-tpm) + 3*tpm + ftm === pts
    const ftPct = Math.min(0.92, Math.max(0.64, 0.65 + (p.ratings.shooting - 60) * 0.006));
    const maxFtm = Math.min(12, Math.floor(pts * (0.14 + seededNoise(seedBase + i * 7) * 0.14)));
    let ftm = maxFtm;
    let remPts = pts - ftm;
    if (remPts === 1) {
      ftm += 1;
      remPts = 0;
    }

    const threePropensity = p.position === "C" ? 0.12 : p.ratings.shooting >= 82 ? 0.44 : 0.28;
    let tpm = Math.min(Math.floor(remPts / 3), Math.round((remPts * threePropensity) / 3));
    let twoPts = remPts - tpm * 3;
    if (twoPts % 2 !== 0) {
      if (tpm > 0) {
        tpm -= 1;
        twoPts += 3;
      } else {
        ftm += 1;
        twoPts -= 1;
      }
    }
    const twoPm = Math.max(0, twoPts / 2);
    const fgm = twoPm + tpm;

    const fgRate = Math.min(0.62, Math.max(0.36, 0.38 + (p.ratings.finishing + p.ratings.shooting - 130) * 0.003 - (opponentStrength - 80) * 0.002));
    const threeRate = Math.min(0.46, Math.max(0.26, 0.27 + (p.ratings.shooting - 65) * 0.0045));
    const tpa = tpm > 0 ? Math.max(tpm, Math.round(tpm / threeRate)) : p.position === "C" ? 0 : Math.round(seededNoise(seedBase + i * 19) * 2);
    const twoPa = twoPm > 0 ? Math.max(twoPm, Math.round(twoPm / Math.min(0.64, fgRate + 0.05))) : Math.round(seededNoise(seedBase + i * 21) * 2);
    const fga = Math.max(fgm, twoPa + tpa);
    const fta = ftm > 0 ? Math.max(ftm, Math.round(ftm / ftPct)) : 0;

    const rebRate = (p.ratings.rebounding / 80) * (p.position === "C" ? 0.34 : p.position === "PF" ? 0.25 : 0.14);
    const reb = Math.max(0, Math.round((mins * rebRate) * (0.65 + seededNoise(seedBase + i * 23) * 0.7)));
    const astRate = (p.ratings.playmaking / 80) * (p.position === "PG" ? 0.24 : p.position === "SG" ? 0.14 : 0.1);
    const ast = Math.max(0, Math.round((mins * astRate) * (0.65 + seededNoise(seedBase + i * 29) * 0.7)));
    const stl = Math.max(0, Math.round((mins * (p.ratings.defense / 950)) * (0.4 + seededNoise(seedBase + i * 31) * 1.4)));
    const blk = Math.max(0, Math.round((mins * (p.position === "C" || p.position === "PF" ? p.ratings.defense / 900 : p.ratings.defense / 2200)) * (0.4 + seededNoise(seedBase + i * 37) * 1.4)));
    const tov = Math.max(0, Math.round((mins / 24) * (0.5 + seededNoise(seedBase + i * 41) * 1.4) + ast * 0.18));

    const verifiedPts = twoPm * 2 + tpm * 3 + ftm;

    lines.set(p.id, {
      gp: 1,
      gs: p.isStarter || i < 5 ? 1 : 0,
      min: mins,
      pts: verifiedPts,
      reb,
      ast,
      stl,
      blk,
      tov,
      fgm,
      fga,
      tpm,
      tpa,
      ftm,
      fta,
    });

    const gameScore = verifiedPts + reb * 0.6 + ast * 0.8 + stl + blk;
    if (gameScore > topScore) {
      topScore = gameScore;
      topPlayer = p;
    }
  });

  const actualScore = [...lines.values()].reduce((s, l) => s + l.pts, 0);
  const topLine = lines.get(topPlayer.id)!;
  return {
    actualScore,
    lines,
    top: { player: topPlayer, pts: topLine.pts, reb: topLine.reb, ast: topLine.ast },
  };
}

export function simulateMatchup(
  homeTeamId: string,
  awayTeamId: string,
  players: LeaguePlayer[],
  seed: number
): {
  homeScore: number;
  awayScore: number;
  overtimePeriods: number;
  playerLines: Map<string, PlayerStatLine>;
  topPerformer: ScheduledGame["topPerformer"];
} {
  const homeStrength = getTeamStrength(players, homeTeamId) + 2.2; // home-court boost
  const awayStrength = getTeamStrength(players, awayTeamId);

  const basePace = 104 + (seededNoise(seed + 1) - 0.5) * 16;
  const edge = (homeStrength - awayStrength) * 0.55;
  let homeTarget = Math.max(82, Math.round(basePace + edge * 0.55 + (seededNoise(seed + 2) - 0.5) * 18));
  let awayTarget = Math.max(82, Math.round(basePace - edge * 0.45 + (seededNoise(seed + 3) - 0.5) * 18));

  let overtimePeriods = 0;
  while (homeTarget === awayTarget) {
    overtimePeriods++;
    const otH = 7 + Math.round(seededNoise(seed + 10 + overtimePeriods) * 8);
    const otA = 7 + Math.round(seededNoise(seed + 20 + overtimePeriods) * 8);
    homeTarget += otH;
    awayTarget += otA;
    if (otH === otA && overtimePeriods >= 2) {
      homeTarget += homeStrength >= awayStrength ? 2 : 0;
      awayTarget += awayStrength > homeStrength ? 2 : 0;
    }
  }

  const minutesScale = 1 + overtimePeriods * 0.1;
  const homeBox = generateTeamBoxScore(
    players.filter((p) => p.teamId === homeTeamId),
    homeTarget,
    awayStrength,
    seed + 101,
    minutesScale
  );
  const awayBox = generateTeamBoxScore(
    players.filter((p) => p.teamId === awayTeamId),
    awayTarget,
    homeStrength,
    seed + 503,
    minutesScale
  );

  const playerLines = new Map<string, PlayerStatLine>();
  homeBox.lines.forEach((v, k) => playerLines.set(k, v));
  awayBox.lines.forEach((v, k) => playerLines.set(k, v));

  // Ensure no ties even after integer rounding
  let finalHome = homeBox.actualScore;
  let finalAway = awayBox.actualScore;
  if (finalHome === finalAway) {
    const bumpWinner = seededNoise(seed + 999) > 0.45 ? "home" : "away";
    const targetId = bumpWinner === "home" ? homeBox.top.player.id : awayBox.top.player.id;
    const line = playerLines.get(targetId);
    if (line) {
      line.pts += 2;
      line.fgm += 1;
      line.fga += 1;
    }
    if (bumpWinner === "home") finalHome += 2;
    else finalAway += 2;
  }

  const winnerIsHome = finalHome > finalAway;
  const top = winnerIsHome ? homeBox.top : awayBox.top;

  return {
    homeScore: finalHome,
    awayScore: finalAway,
    overtimePeriods,
    playerLines,
    topPerformer: {
      playerId: top.player.id,
      playerName: top.player.name,
      teamId: top.player.teamId,
      pts: top.pts,
      reb: top.reb,
      ast: top.ast,
    },
  };
}

// ============================================================================
// AWARDS ENGINE (DETERMINISTIC FROM REAL SEASON STATS)
// ============================================================================

export function computeSeasonAwards(state: LeagueState): SeasonAwardsSummary {
  const standings = calculateStandings(state);
  const standingByTeam = new Map(standings.map((s) => [s.teamId, s]));
  const teamById = new Map(APBA_TEAMS.map((t) => [t.id, t]));

  const maxTeamGp = Math.max(1, ...standings.map((s) => s.gp));
  const minEligibleGp = Math.max(1, Math.floor(maxTeamGp * 0.5));

  const qualified = state.players.filter((p) => p.seasonStats.gp >= minEligibleGp);
  const pool = qualified.length >= 24 ? qualified : state.players.filter((p) => p.seasonStats.gp > 0);

  const perGame = (p: LeaguePlayer) => {
    const g = Math.max(1, p.seasonStats.gp);
    const ppg = p.seasonStats.pts / g;
    const rpg = p.seasonStats.reb / g;
    const apg = p.seasonStats.ast / g;
    const spg = p.seasonStats.stl / g;
    const bpg = p.seasonStats.blk / g;
    const tpg = p.seasonStats.tov / g;
    const fgPct = p.seasonStats.fga > 0 ? (p.seasonStats.fgm / p.seasonStats.fga) * 100 : 0;
    const threePct = p.seasonStats.tpa > 0 ? (p.seasonStats.tpm / p.seasonStats.tpa) * 100 : 0;
    const teamWinPct = standingByTeam.get(p.teamId)?.winPct ?? 0.5;
    return { ppg, rpg, apg, spg, bpg, tpg, fgPct, threePct, teamWinPct, gp: g };
  };

  const toAward = (award: string, p: LeaguePlayer, score: number): AwardSelection => {
    const pg = perGame(p);
    return {
      award,
      playerId: p.id,
      playerName: p.name,
      teamId: p.teamId,
      teamAbbr: teamById.get(p.teamId)?.abbr || "APBA",
      position: p.position,
      statSummary: `${pg.ppg.toFixed(1)} PPG · ${pg.rpg.toFixed(1)} RPG · ${pg.apg.toFixed(1)} APG · ${pg.fgPct.toFixed(1)}% FG`,
      score: Number(score.toFixed(2)),
    };
  };

  const mvpScore = (p: LeaguePlayer) => {
    const s = perGame(p);
    return (
      s.ppg * 1.45 +
      s.rpg * 0.75 +
      s.apg * 1.15 +
      s.spg * 1.8 +
      s.bpg * 1.6 -
      s.tpg * 0.7 +
      (s.fgPct - 44) * 0.35 +
      s.teamWinPct * 18
    );
  };

  const dpoyScore = (p: LeaguePlayer) => {
    const s = perGame(p);
    const teamSt = standingByTeam.get(p.teamId);
    const teamPaPg = teamSt && teamSt.gp > 0 ? teamSt.pa / teamSt.gp : 106;
    const teamDefBonus = Math.max(-5, (108 - teamPaPg) * 0.9);
    return (
      s.spg * 5.2 +
      s.bpg * 5.6 +
      s.rpg * 0.85 +
      (p.ratings.defense - 70) * 0.55 +
      teamDefBonus
    );
  };

  const mipScore = (p: LeaguePlayer) => {
    if (p.yearsPro === 0) return -999; // Rookies excluded from MIP
    const s = perGame(p);
    const dPpg = s.ppg - p.priorSeasonPpg;
    const dRpg = s.rpg - p.priorSeasonRpg;
    const dApg = s.apg - p.priorSeasonApg;
    const dOvr = p.ratings.ovr - p.priorSeasonOvr;
    return dPpg * 1.6 + dRpg * 0.8 + dApg * 1.2 + dOvr * 0.9;
  };

  const mvpPool = [...pool].sort((a, b) => mvpScore(b) - mvpScore(a));
  const dpoyPool = [...pool].sort((a, b) => dpoyScore(b) - dpoyScore(a));
  const rookies = pool.filter((p) => p.yearsPro === 0).sort((a, b) => mvpScore(b) - mvpScore(a));
  const benchGuys = pool
    .filter((p) => p.seasonStats.gs < p.seasonStats.gp * 0.5)
    .sort((a, b) => mvpScore(b) - mvpScore(a));
  const mipPool = [...pool]
    .filter((p) => p.yearsPro > 0)
    .sort((a, b) => mipScore(b) - mipScore(a));

  const fallbackPlayer = pool[0] || state.players[0];

  // All-Star 12 East + 12 West
  const eastAllStars = pool
    .filter((p) => teamById.get(p.teamId)?.conference === "Eastern")
    .sort((a, b) => mvpScore(b) - mvpScore(a))
    .slice(0, 12)
    .map((p) => toAward("All-Star (East)", p, mvpScore(p)));

  const westAllStars = pool
    .filter((p) => teamById.get(p.teamId)?.conference === "Western")
    .sort((a, b) => mvpScore(b) - mvpScore(a))
    .slice(0, 12)
    .map((p) => toAward("All-Star (West)", p, mvpScore(p)));

  // Positional All-League selection helper: 2 Guards (PG/SG), 2 Forwards (SF/PF), 1 Center (C)
  const pickPositionalFive = (
    candidates: LeaguePlayer[],
    scorer: (p: LeaguePlayer) => number,
    label: string,
    excludeIds: Set<string>
  ): AwardSelection[] => {
    const avail = candidates.filter((p) => !excludeIds.has(p.id)).sort((a, b) => scorer(b) - scorer(a));
    const guards = avail.filter((p) => p.position === "PG" || p.position === "SG").slice(0, 2);
    const forwards = avail.filter((p) => p.position === "SF" || p.position === "PF").slice(0, 2);
    const centers = avail.filter((p) => p.position === "C").slice(0, 1);
    const picked = [...guards, ...forwards, ...centers];
    // Backfill if short
    for (const p of avail) {
      if (picked.length >= 5) break;
      if (!picked.some((x) => x.id === p.id)) picked.push(p);
    }
    picked.forEach((p) => excludeIds.add(p.id));
    return picked.map((p) => toAward(label, p, scorer(p)));
  };

  const allLeagueUsed = new Set<string>();
  const allLeagueFirst = pickPositionalFive(pool, mvpScore, "All-League 1st Team", allLeagueUsed);
  const allLeagueSecond = pickPositionalFive(pool, mvpScore, "All-League 2nd Team", allLeagueUsed);
  const allDefUsed = new Set<string>();
  const allDefensiveFirst = pickPositionalFive(pool, dpoyScore, "All-Defensive 1st Team", allDefUsed);

  const mvpP = mvpPool[0] || fallbackPlayer;
  const dpoyP = dpoyPool[0] || fallbackPlayer;
  const royP = rookies[0] || fallbackPlayer;
  const sixthP = benchGuys[0] || fallbackPlayer;
  const mipP = mipPool[0] || fallbackPlayer;

  return {
    seasonYear: state.seasonYear,
    mvp: toAward("Most Valuable Player", mvpP, mvpScore(mvpP)),
    dpoy: toAward("Defensive Player of the Year", dpoyP, dpoyScore(dpoyP)),
    roy: toAward("Rookie of the Year", royP, mvpScore(royP)),
    sixthMan: toAward("Sixth Man of the Year", sixthP, mvpScore(sixthP)),
    mip: toAward("Most Improved Player", mipP, mipScore(mipP)),
    allStarEast: eastAllStars,
    allStarWest: westAllStars,
    allLeagueFirst,
    allLeagueSecond,
    allDefensiveFirst,
  };
}

// ============================================================================
// PLAYOFFS ENGINE (BEST-OF-7 AUTOMATIC BRACKET PROGRESSION)
// ============================================================================

function makePlayoffSeries(
  id: string,
  round: Exclude<PlayoffRoundCode, "complete">,
  conference: LeagueConference | "Finals",
  slot: number,
  highSeedTeamId: string,
  lowSeedTeamId: string,
  highSeedRank: number,
  lowSeedRank: number
): PlayoffSeries {
  return {
    id,
    round,
    conference,
    slot,
    highSeedTeamId,
    lowSeedTeamId,
    highSeedRank,
    lowSeedRank,
    highSeedWins: 0,
    lowSeedWins: 0,
    winnerId: null,
    games: [],
    mvpStatsByPlayer: {},
  };
}

export function initializePlayoffs(state: LeagueState): LeagueState {
  if (state.playoffs && state.playoffs.series.length > 0) return state;

  const standings = calculateStandings(state);
  const east = standings.filter((s) => s.conference === "Eastern").slice(0, 8);
  const west = standings.filter((s) => s.conference === "Western").slice(0, 8);

  // Bracket order: slot 0 (1v8) & slot 1 (4v5) feed Conf Semi 0; slot 2 (3v6) & slot 3 (2v7) feed Conf Semi 1
  const bracketPairs: [number, number][] = [
    [0, 7],
    [3, 4],
    [2, 5],
    [1, 6],
  ];

  const series: PlayoffSeries[] = [];
  bracketPairs.forEach(([hi, lo], slot) => {
    series.push(
      makePlayoffSeries(
        `po_${state.seasonYear}_e_r1_${slot}`,
        "conf_first_round",
        "Eastern",
        slot,
        east[hi].teamId,
        east[lo].teamId,
        hi + 1,
        lo + 1
      )
    );
    series.push(
      makePlayoffSeries(
        `po_${state.seasonYear}_w_r1_${slot}`,
        "conf_first_round",
        "Western",
        slot,
        west[hi].teamId,
        west[lo].teamId,
        hi + 1,
        lo + 1
      )
    );
  });

  // Compute and store regular season awards if not yet saved for this season
  const hasAwards = state.awardsHistory.some((a) => a.seasonYear === state.seasonYear);
  const nextAwards = hasAwards ? state.awardsHistory : [...state.awardsHistory, computeSeasonAwards(state)];

  return {
    ...state,
    phase: "playoffs",
    awardsHistory: nextAwards,
    playoffs: {
      currentRound: "conf_first_round",
      series,
      championTeamId: null,
      finalsMvp: null,
    },
  };
}

function advancePlayoffBracketIfReady(state: LeagueState): LeagueState {
  if (!state.playoffs) return state;
  const po = state.playoffs;
  const currentRound = po.currentRound;
  if (currentRound === "complete") return state;

  const roundSeries = po.series.filter((s) => s.round === currentRound);
  if (roundSeries.length === 0 || roundSeries.some((s) => !s.winnerId)) {
    return state;
  }

  const standingRankMap = new Map(calculateStandings(state).map((s) => [s.teamId, s.confRank]));
  const standingsFullMap = new Map(calculateStandings(state).map((s) => [s.teamId, s]));

  const nextSeries = [...po.series];

  if (currentRound === "conf_first_round") {
    for (const conf of ["Eastern", "Western"] as LeagueConference[]) {
      const confR1 = roundSeries.filter((s) => s.conference === conf).sort((a, b) => a.slot - b.slot);
      for (const semiSlot of [0, 1]) {
        const sA = confR1[semiSlot * 2];
        const sB = confR1[semiSlot * 2 + 1];
        const wA = sA.winnerId!;
        const wB = sB.winnerId!;
        const rankA = standingRankMap.get(wA) ?? 8;
        const rankB = standingRankMap.get(wB) ?? 8;
        const hi = rankA <= rankB ? wA : wB;
        const lo = rankA <= rankB ? wB : wA;
        nextSeries.push(
          makePlayoffSeries(
            `po_${state.seasonYear}_${conf[0].toLowerCase()}_sf_${semiSlot}`,
            "conf_semis",
            conf,
            semiSlot,
            hi,
            lo,
            Math.min(rankA, rankB),
            Math.max(rankA, rankB)
          )
        );
      }
    }
    return {
      ...state,
      playoffs: { ...po, currentRound: "conf_semis", series: nextSeries },
    };
  }

  if (currentRound === "conf_semis") {
    for (const conf of ["Eastern", "Western"] as LeagueConference[]) {
      const confSF = roundSeries.filter((s) => s.conference === conf).sort((a, b) => a.slot - b.slot);
      const wA = confSF[0].winnerId!;
      const wB = confSF[1].winnerId!;
      const rankA = standingRankMap.get(wA) ?? 8;
      const rankB = standingRankMap.get(wB) ?? 8;
      const hi = rankA <= rankB ? wA : wB;
      const lo = rankA <= rankB ? wB : wA;
      nextSeries.push(
        makePlayoffSeries(
          `po_${state.seasonYear}_${conf[0].toLowerCase()}_cf`,
          "conf_finals",
          conf,
          0,
          hi,
          lo,
          Math.min(rankA, rankB),
          Math.max(rankA, rankB)
        )
      );
    }
    return {
      ...state,
      playoffs: { ...po, currentRound: "conf_finals", series: nextSeries },
    };
  }

  if (currentRound === "conf_finals") {
    const eastChamp = roundSeries.find((s) => s.conference === "Eastern")!.winnerId!;
    const westChamp = roundSeries.find((s) => s.conference === "Western")!.winnerId!;
    const eSt = standingsFullMap.get(eastChamp);
    const wSt = standingsFullMap.get(westChamp);
    // Higher regular season winPct gets Finals home-court advantage
    const eastHigher = (eSt?.winPct ?? 0.5) >= (wSt?.winPct ?? 0.5);
    const hi = eastHigher ? eastChamp : westChamp;
    const lo = eastHigher ? westChamp : eastChamp;
    nextSeries.push(
      makePlayoffSeries(
        `po_${state.seasonYear}_finals`,
        "finals",
        "Finals",
        0,
        hi,
        lo,
        eastHigher ? eSt?.confRank || 1 : wSt?.confRank || 1,
        eastHigher ? wSt?.confRank || 1 : eSt?.confRank || 1
      )
    );
    return {
      ...state,
      playoffs: { ...po, currentRound: "finals", series: nextSeries },
    };
  }

  // Finals completed! Crown champion + Finals MVP + record Championship History
  const finals = roundSeries[0];
  const champId = finals.winnerId!;
  const runnerUpId = champId === finals.highSeedTeamId ? finals.lowSeedTeamId : finals.highSeedTeamId;
  const champTeam = APBA_TEAMS.find((t) => t.id === champId)!;
  const runnerUpTeam = APBA_TEAMS.find((t) => t.id === runnerUpId)!;

  const champMvpCandidates = Object.values(finals.mvpStatsByPlayer).filter((m) => m.teamId === champId);
  champMvpCandidates.sort((a, b) => {
    const sA = a.pts + a.reb * 0.7 + a.ast * 0.9 + a.stl + a.blk;
    const sB = b.pts + b.reb * 0.7 + b.ast * 0.9 + b.stl + b.blk;
    return sB - sA;
  });
  const mvpRow = champMvpCandidates[0];
  const gp = Math.max(1, mvpRow?.gp || 4);
  const finalsMvp = mvpRow
    ? {
        playerId: mvpRow.playerId,
        playerName: mvpRow.playerName,
        teamId: champId,
        ppg: Number((mvpRow.pts / gp).toFixed(1)),
        rpg: Number((mvpRow.reb / gp).toFixed(1)),
        apg: Number((mvpRow.ast / gp).toFixed(1)),
      }
    : {
        playerId: "",
        playerName: `${champTeam.city} Captain`,
        teamId: champId,
        ppg: 27.5,
        rpg: 6.8,
        apg: 6.2,
      };

  const seasonAwards = state.awardsHistory.find((a) => a.seasonYear === state.seasonYear);
  const champWins = Math.max(finals.highSeedWins, finals.lowSeedWins);
  const oppWins = Math.min(finals.highSeedWins, finals.lowSeedWins);

  const historyEntry: ChampionshipRecord = {
    seasonYear: state.seasonYear,
    championTeamId: champId,
    championTeamName: `${champTeam.city} ${champTeam.name}`,
    championAbbr: champTeam.abbr,
    runnerUpTeamId: runnerUpId,
    runnerUpTeamName: `${runnerUpTeam.city} ${runnerUpTeam.name}`,
    seriesScore: `${champWins}-${oppWins}`,
    trophyName: CHAMPIONSHIP_TROPHY_NAME,
    finalsMvp,
    seasonMvpName: seasonAwards?.mvp.playerName || finalsMvp.playerName,
  };

  return {
    ...state,
    phase: "offseason",
    playoffs: {
      ...po,
      currentRound: "complete",
      championTeamId: champId,
      finalsMvp,
    },
    championshipHistory: [...state.championshipHistory, historyEntry],
  };
}

// ============================================================================
// LEAGUE ACTIONS (SIMULATE ROUND, WEEK, SEASON, USER GAME, PLAYOFFS, ROLLOVER)
// ============================================================================

export function createInitialLeagueState(seasonYear = 2027, userTeamId = "apba_nyc_monarchs"): LeagueState {
  return {
    seasonYear,
    phase: "regular_season",
    currentRound: 1,
    schedule: generate82GameSchedule(APBA_TEAMS, seasonYear),
    players: generateInitialRosters(),
    awardsHistory: [],
    playoffs: null,
    championshipHistory: [],
    userTeamId,
  };
}

export function simulateRounds(state: LeagueState, roundCount = 1): LeagueState {
  if (state.phase !== "regular_season") return state;

  const targetEndRound = Math.min(82, state.currentRound + Math.max(1, roundCount) - 1);
  const nextPlayers = state.players.map((p) => ({
    ...p,
    seasonStats: { ...p.seasonStats },
    careerStats: { ...p.careerStats },
  }));
  const playerMap = new Map(nextPlayers.map((p) => [p.id, p]));

  const nextSchedule = state.schedule.map((g, idx) => {
    if (g.played || g.round < state.currentRound || g.round > targetEndRound) {
      return g;
    }
    const sim = simulateMatchup(
      g.homeTeamId,
      g.awayTeamId,
      nextPlayers,
      state.seasonYear * 10000 + g.round * 97 + idx
    );
    sim.playerLines.forEach((line, pId) => {
      const p = playerMap.get(pId);
      if (p) {
        accumulateStat(p.seasonStats, line);
        accumulateStat(p.careerStats, line);
      }
    });
    return {
      ...g,
      played: true,
      homeScore: sim.homeScore,
      awayScore: sim.awayScore,
      overtimePeriods: sim.overtimePeriods,
      topPerformer: sim.topPerformer,
    };
  });

  const nextRound = targetEndRound + 1;
  let updated: LeagueState = {
    ...state,
    currentRound: nextRound,
    schedule: nextSchedule,
    players: nextPlayers,
  };

  if (nextRound > 82) {
    updated = initializePlayoffs(updated);
  }
  return updated;
}

export function simulateRemainingRegularSeason(state: LeagueState): LeagueState {
  if (state.phase !== "regular_season") return state;
  return simulateRounds(state, 83 - state.currentRound);
}

export function simulatePlayoffGame(state: LeagueState, seriesId: string): LeagueState {
  if (!state.playoffs) return state;
  const po = state.playoffs;
  const target = po.series.find((s) => s.id === seriesId);
  if (!target || target.winnerId) return state;

  const gameNum = target.games.length + 1;
  // 2-2-1-1-1 home court format
  const highIsHome = [1, 2, 5, 7].includes(gameNum);
  const homeId = highIsHome ? target.highSeedTeamId : target.lowSeedTeamId;
  const awayId = highIsHome ? target.lowSeedTeamId : target.highSeedTeamId;

  const sim = simulateMatchup(
    homeId,
    awayId,
    state.players,
    state.seasonYear * 99991 + po.series.indexOf(target) * 37 + gameNum * 131
  );

  const nextPlayers = state.players.map((p) => ({ ...p, careerStats: { ...p.careerStats } }));
  const playerMap = new Map(nextPlayers.map((p) => [p.id, p]));
  const nextMvpStats = { ...target.mvpStatsByPlayer };

  sim.playerLines.forEach((line, pId) => {
    const p = playerMap.get(pId);
    if (!p) return;
    accumulateStat(p.careerStats, line);
    const prev = nextMvpStats[pId] || {
      playerId: pId,
      playerName: p.name,
      teamId: p.teamId,
      gp: 0,
      pts: 0,
      reb: 0,
      ast: 0,
      stl: 0,
      blk: 0,
    };
    nextMvpStats[pId] = {
      ...prev,
      gp: prev.gp + 1,
      pts: prev.pts + line.pts,
      reb: prev.reb + line.reb,
      ast: prev.ast + line.ast,
      stl: prev.stl + line.stl,
      blk: prev.blk + line.blk,
    };
  });

  const winnerId = sim.homeScore > sim.awayScore ? homeId : awayId;
  const nextHighWins = target.highSeedWins + (winnerId === target.highSeedTeamId ? 1 : 0);
  const nextLowWins = target.lowSeedWins + (winnerId === target.lowSeedTeamId ? 1 : 0);
  const seriesWinner = nextHighWins >= 4 ? target.highSeedTeamId : nextLowWins >= 4 ? target.lowSeedTeamId : null;

  const nextGame: PlayoffSeriesGame = {
    gameNumber: gameNum,
    homeTeamId: homeId,
    awayTeamId: awayId,
    homeScore: sim.homeScore,
    awayScore: sim.awayScore,
    winnerId,
    topScorerName: sim.topPerformer?.playerName || "",
    topScorerPts: sim.topPerformer?.pts || 0,
  };

  const nextSeries = po.series.map((s) =>
    s.id === seriesId
      ? {
          ...s,
          highSeedWins: nextHighWins,
          lowSeedWins: nextLowWins,
          winnerId: seriesWinner,
          games: [...s.games, nextGame],
          mvpStatsByPlayer: nextMvpStats,
        }
      : s
  );

  return advancePlayoffBracketIfReady({
    ...state,
    players: nextPlayers,
    playoffs: { ...po, series: nextSeries },
  });
}

export function simulatePlayoffRound(state: LeagueState): LeagueState {
  if (!state.playoffs || state.playoffs.currentRound === "complete") return state;
  let curr = state;
  const targetRound = curr.playoffs!.currentRound;
  let safety = 0;
  while (curr.playoffs && curr.playoffs.currentRound === targetRound && safety < 60) {
    const active = curr.playoffs.series.filter((s) => s.round === targetRound && !s.winnerId);
    if (active.length === 0) break;
    for (const s of active) {
      curr = simulatePlayoffGame(curr, s.id);
    }
    safety++;
  }
  return curr;
}

export function simulateEntirePlayoffs(state: LeagueState): LeagueState {
  let curr = state.phase === "regular_season" ? simulateRemainingRegularSeason(state) : state;
  let guard = 0;
  while (curr.playoffs && curr.playoffs.currentRound !== "complete" && guard < 10) {
    curr = simulatePlayoffRound(curr);
    guard++;
  }
  return curr;
}

export function recordUserPlayedMatch(
  state: LeagueState,
  params: {
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number;
    awayScore: number;
    userStats?: {
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
    };
  }
): LeagueState {
  const nextPlayers = state.players.map((p) => ({
    ...p,
    seasonStats: { ...p.seasonStats },
    careerStats: { ...p.careerStats },
  }));

  // Find next unplayed scheduled game matching teams (or any next unplayed game involving userTeamId)
  const gameIdx = state.schedule.findIndex(
    (g) =>
      !g.played &&
      ((g.homeTeamId === params.homeTeamId && g.awayTeamId === params.awayTeamId) ||
        (g.homeTeamId === params.awayTeamId && g.awayTeamId === params.homeTeamId))
  );

  if (gameIdx === -1) return state;

  const g = state.schedule[gameIdx];
  const sameOrientation = g.homeTeamId === params.homeTeamId;
  const homeScore = sameOrientation ? params.homeScore : params.awayScore;
  const awayScore = sameOrientation ? params.awayScore : params.homeScore;

  // Apply realistic stat lines for teammates/opponents and attach user stats to star/user player
  const sim = simulateMatchup(g.homeTeamId, g.awayTeamId, nextPlayers, state.seasonYear * 77 + gameIdx);
  const playerMap = new Map(nextPlayers.map((p) => [p.id, p]));
  const userAvatar =
    nextPlayers.find((p) => p.isUserCreated && p.teamId === state.userTeamId) ||
    nextPlayers.find((p) => p.teamId === state.userTeamId);

  sim.playerLines.forEach((line, pId) => {
    const p = playerMap.get(pId);
    if (!p) return;
    if (userAvatar && p.id === userAvatar.id && params.userStats) {
      const merged: PlayerStatLine = {
        gp: 1,
        gs: 1,
        min: 34,
        ...params.userStats,
      };
      accumulateStat(p.seasonStats, merged);
      accumulateStat(p.careerStats, merged);
    } else {
      accumulateStat(p.seasonStats, line);
      accumulateStat(p.careerStats, line);
    }
  });

  const nextSchedule = state.schedule.map((item, idx) =>
    idx === gameIdx
      ? {
          ...item,
          played: true,
          isUserPlayed: true,
          homeScore,
          awayScore,
        }
      : item
  );

  return {
    ...state,
    schedule: nextSchedule,
    players: nextPlayers,
  };
}

export function advanceToNextLeagueSeason(state: LeagueState): LeagueState {
  const nextYear = state.seasonYear + 1;
  const nextPlayers: LeaguePlayer[] = state.players.map((p) => {
    const gp = Math.max(1, p.seasonStats.gp);
    const ppg = Number((p.seasonStats.pts / gp).toFixed(1));
    const rpg = Number((p.seasonStats.reb / gp).toFixed(1));
    const apg = Number((p.seasonStats.ast / gp).toFixed(1));

    // Age & ratings curve: young players improve, veterans plateau/gradually decline
    const devDelta = p.age <= 24 ? 2 : p.age <= 28 ? 1 : p.age >= 33 ? -2 : 0;
    const clamp = (v: number) => Math.max(58, Math.min(99, v + devDelta));
    const nextRatings = {
      ovr: clamp(p.ratings.ovr),
      shooting: clamp(p.ratings.shooting),
      finishing: clamp(p.ratings.finishing),
      playmaking: clamp(p.ratings.playmaking),
      defense: clamp(p.ratings.defense),
      rebounding: clamp(p.ratings.rebounding),
      athleticism: p.age >= 32 ? Math.max(55, p.ratings.athleticism - 2) : clamp(p.ratings.athleticism),
    };

    const nextAge = p.age >= 38 ? 20 : p.age + 1;
    const resetRookie = p.age >= 38;

    return {
      ...p,
      age: nextAge,
      yearsPro: resetRookie ? 0 : p.yearsPro + 1,
      priorSeasonPpg: resetRookie ? 0 : ppg,
      priorSeasonRpg: resetRookie ? 0 : rpg,
      priorSeasonApg: resetRookie ? 0 : apg,
      priorSeasonOvr: p.ratings.ovr,
      ratings: nextRatings,
      contractYears: Math.max(1, p.contractYears - 1 || 3),
      seasonStats: createEmptyStatLine(),
    };
  });

  return {
    ...state,
    seasonYear: nextYear,
    phase: "regular_season",
    currentRound: 1,
    schedule: generate82GameSchedule(APBA_TEAMS, nextYear),
    players: nextPlayers,
    playoffs: null,
  };
}

// ============================================================================
// PERSISTENCE HELPERS
// ============================================================================

export function loadLeagueState(): LeagueState {
  const res = loadVersionedState<LeagueState>(
    SAVE_KEYS.LEAGUE,
    () => createInitialLeagueState(),
    (d): d is LeagueState =>
      Boolean(
        d &&
          typeof d === "object" &&
          Array.isArray((d as LeagueState).schedule) &&
          Array.isArray((d as LeagueState).players) &&
          (d as LeagueState).schedule.length === 820
      )
  );
  return res.data;
}

export function saveLeagueState(state: LeagueState): void {
  saveVersionedState(SAVE_KEYS.LEAGUE, state);
}
