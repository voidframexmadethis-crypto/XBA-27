import test from "node:test";
import assert from "node:assert/strict";
import { APBA_TEAMS } from "./leagueData.ts";
import {
  advanceToNextLeagueSeason,
  calculateStandings,
  computeSeasonAwards,
  createInitialLeagueState,
  generate82GameSchedule,
  simulateEntirePlayoffs,
  simulateRemainingRegularSeason,
  simulateRounds,
} from "./leagueEngine.ts";

test("82-game schedule generates 820 total games with exact 41H / 41A per team", () => {
  const schedule = generate82GameSchedule(APBA_TEAMS, 2027);
  assert.equal(schedule.length, 820);

  const homeCounts = new Map<string, number>();
  const awayCounts = new Map<string, number>();
  const roundsByTeam = new Map<string, Set<number>>();

  for (const t of APBA_TEAMS) {
    homeCounts.set(t.id, 0);
    awayCounts.set(t.id, 0);
    roundsByTeam.set(t.id, new Set());
  }

  for (const g of schedule) {
    assert.notEqual(g.homeTeamId, g.awayTeamId, "Team cannot play itself");
    assert.ok(g.round >= 1 && g.round <= 82, "Round must be 1..82");
    homeCounts.set(g.homeTeamId, (homeCounts.get(g.homeTeamId) || 0) + 1);
    awayCounts.set(g.awayTeamId, (awayCounts.get(g.awayTeamId) || 0) + 1);

    assert.equal(roundsByTeam.get(g.homeTeamId)!.has(g.round), false, "No duplicate team in same round");
    assert.equal(roundsByTeam.get(g.awayTeamId)!.has(g.round), false, "No duplicate team in same round");
    roundsByTeam.get(g.homeTeamId)!.add(g.round);
    roundsByTeam.get(g.awayTeamId)!.add(g.round);
  }

  for (const t of APBA_TEAMS) {
    const h = homeCounts.get(t.id)!;
    const a = awayCounts.get(t.id)!;
    assert.equal(h, 41, `${t.abbr} should have 41 home games, got ${h}`);
    assert.equal(a, 41, `${t.abbr} should have 41 away games, got ${a}`);
    assert.equal(h + a, 82, `${t.abbr} should have 82 total games`);
  }
});

test("Simulating full 82-game season updates standings, box scores, and triggers playoffs", () => {
  const init = createInitialLeagueState(2027);
  const afterWeek = simulateRounds(init, 7);
  assert.equal(afterWeek.currentRound, 8);
  assert.equal(afterWeek.schedule.filter((g) => g.played).length, 70);

  const completedReg = simulateRemainingRegularSeason(afterWeek);
  assert.equal(completedReg.phase, "playoffs");
  assert.equal(completedReg.schedule.filter((g) => g.played).length, 820);

  const standings = calculateStandings(completedReg);
  assert.equal(standings.length, 20);
  let totalWins = 0;
  let totalLosses = 0;
  for (const s of standings) {
    assert.equal(s.gp, 82);
    assert.equal(s.wins + s.losses, 82);
    assert.equal(s.homeWins + s.homeLosses, 41);
    assert.equal(s.awayWins + s.awayLosses, 41);
    totalWins += s.wins;
    totalLosses += s.losses;
  }
  assert.equal(totalWins, 820);
  assert.equal(totalLosses, 820);

  // Verify real player statistics & awards calculation
  const scorers = completedReg.players.filter((p) => p.seasonStats.pts > 0);
  assert.ok(scorers.length > 150, "Most league players should accumulate season stats");
  for (const p of scorers) {
    assert.ok(p.seasonStats.fgm <= p.seasonStats.fga);
    assert.ok(p.seasonStats.tpm <= p.seasonStats.tpa);
    assert.ok(p.seasonStats.ftm <= p.seasonStats.fta);
  }

  const awards = computeSeasonAwards(completedReg);
  assert.ok(awards.mvp.playerId);
  assert.ok(awards.dpoy.playerId);
  assert.ok(awards.roy.playerId);
  assert.ok(awards.sixthMan.playerId);
  assert.ok(awards.mip.playerId);
  assert.equal(awards.allStarEast.length, 12);
  assert.equal(awards.allStarWest.length, 12);
  assert.equal(awards.allLeagueFirst.length, 5);
  assert.equal(awards.allLeagueSecond.length, 5);
  assert.equal(awards.allDefensiveFirst.length, 5);
});

test("Championship Playoffs progress automatically from R1 -> Semis -> Conf Finals -> Finals -> Champion & Next Season", () => {
  const init = createInitialLeagueState(2027);
  const donePlayoffs = simulateEntirePlayoffs(init);

  assert.equal(donePlayoffs.phase, "offseason");
  assert.ok(donePlayoffs.playoffs);
  assert.equal(donePlayoffs.playoffs.currentRound, "complete");
  assert.ok(donePlayoffs.playoffs.championTeamId);
  assert.ok(donePlayoffs.playoffs.finalsMvp?.playerName);
  assert.equal(donePlayoffs.playoffs.series.length, 15); // 8 R1 + 4 Semis + 2 CF + 1 Finals
  for (const s of donePlayoffs.playoffs.series) {
    assert.ok(s.winnerId, `Series ${s.id} must have a winner`);
    assert.ok(s.highSeedWins === 4 || s.lowSeedWins === 4, "Best-of-7 winner must have 4 wins");
  }
  assert.equal(donePlayoffs.championshipHistory.length, 1);

  const nextSeason = advanceToNextLeagueSeason(donePlayoffs);
  assert.equal(nextSeason.seasonYear, 2028);
  assert.equal(nextSeason.phase, "regular_season");
  assert.equal(nextSeason.currentRound, 1);
  assert.equal(nextSeason.schedule.length, 820);
  assert.equal(nextSeason.playoffs, null);
  assert.equal(nextSeason.championshipHistory.length, 1);
  assert.ok(nextSeason.players.some((p) => p.careerStats.pts > 0), "Career stats must persist across seasons");
});
