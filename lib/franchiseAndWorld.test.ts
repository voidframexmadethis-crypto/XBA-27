import test from "node:test";
import assert from "node:assert/strict";
import { createInitialLeagueState } from "./leagueEngine.ts";
import {
  calculateTeamPayrollM,
  createInitialFranchiseState,
  draftProspectToTeam,
  evaluateTradeProposal,
  executeApprovedTrade,
} from "./franchiseEngine.ts";
import {
  createTournamentBracket,
  resolveTournamentMatch,
  simulateRemainingTournamentRound,
} from "./worldTour.ts";

test("Franchise trade evaluation enforces salary cap matching and updates rosters cleanly", () => {
  const league = createInitialLeagueState(2027, "apba_nyc_monarchs");
  const franchise = createInitialFranchiseState("apba_nyc_monarchs");
  const payrollBefore = calculateTeamPayrollM(league.players, "apba_nyc_monarchs");
  assert.ok(payrollBefore > 80 && payrollBefore < 220);

  const userRoster = league.players.filter((p) => p.teamId === "apba_nyc_monarchs").sort((a, b) => a.salaryMillions - b.salaryMillions);
  const partnerRoster = league.players.filter((p) => p.teamId === "apba_bos_sentinels").sort((a, b) => b.salaryMillions - a.salaryMillions);

  // Extreme salary mismatch should fail
  const mismatchEval = evaluateTradeProposal({
    players: league.players,
    userTeamId: "apba_nyc_monarchs",
    partnerTeamId: "apba_bos_sentinels",
    userOutgoingPlayerIds: [userRoster[0].id],
    partnerOutgoingPlayerIds: [partnerRoster[0].id],
  });
  assert.equal(mismatchEval.validSalaryMatch, false);
  assert.equal(mismatchEval.aiAccepts, false);

  // Similar OVR / salary swap + 1st round pick should validate and move players
  const userStar = [...userRoster].sort((a, b) => b.ratings.ovr - a.ratings.ovr)[0];
  const partnerStar = [...partnerRoster].find((p) => Math.abs(p.salaryMillions - userStar.salaryMillions) <= 6) || partnerRoster[1];

  const fairEval = evaluateTradeProposal({
    players: league.players,
    userTeamId: "apba_nyc_monarchs",
    partnerTeamId: "apba_bos_sentinels",
    userOutgoingPlayerIds: [userStar.id],
    partnerOutgoingPlayerIds: [partnerStar.id],
    includeUserFirstRoundPick: true,
  });
  assert.equal(fairEval.validSalaryMatch, true);
  assert.equal(fairEval.aiAccepts, true);

  const executed = executeApprovedTrade({
    franchise,
    players: league.players,
    partnerTeamId: "apba_bos_sentinels",
    userOutgoingPlayerIds: [userStar.id],
    partnerOutgoingPlayerIds: [partnerStar.id],
    pickIdToInclude: franchise.draftPicks[0].id,
  });
  assert.equal(executed.players.find((p) => p.id === userStar.id)?.teamId, "apba_bos_sentinels");
  assert.equal(executed.players.find((p) => p.id === partnerStar.id)?.teamId, "apba_nyc_monarchs");

  // Rookie draft adds selected prospect to roster
  const prospectId = executed.franchise.draftBoard[0].id;
  const afterDraft = draftProspectToTeam({
    franchise: executed.franchise,
    players: executed.players,
    prospectId,
  });
  assert.equal(afterDraft.players.length, league.players.length + 1);
  assert.equal(afterDraft.franchise.draftBoard.length, executed.franchise.draftBoard.length - 1);
});

test("World Tour 2.0 tournament bracket advances Quarterfinals -> Semis -> Final -> Champion", () => {
  let cup = createTournamentBracket("cup_global_nations", "us_nyc");
  assert.equal(cup.matches.length, 7);
  // Resolve QF
  cup = simulateRemainingTournamentRound(cup);
  // Resolve SF
  cup = simulateRemainingTournamentRound(cup);
  // Resolve Final manually
  const fin = cup.matches.find((m) => m.round === "final")!;
  assert.ok(fin.homeCityId && fin.awayCityId);
  cup = resolveTournamentMatch(cup, fin.id, 88, 79);
  assert.ok(cup.championCityId);
});
