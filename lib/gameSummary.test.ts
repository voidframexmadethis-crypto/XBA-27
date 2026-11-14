import test from "node:test";
import assert from "node:assert/strict";
import {
  buildEndGameSummaryData,
  computeShootingPct,
  resolveDeadBallInboundOwner,
} from "./gameSummary.ts";
import { assignDefensiveMatchups, computeDynamicOffBallTarget } from "./defenseAi.ts";
import type { OffenseMove } from "./basketballMoves.ts";

test("computeShootingPct and buildEndGameSummaryData compute FG%, points, turnovers, and team totals accurately", () => {
  assert.equal(computeShootingPct(0, 0), 0);
  assert.equal(computeShootingPct(7, 12), 58.3);
  assert.equal(computeShootingPct(3, 5), 60);

  const summary = buildEndGameSummaryData([
    {
      name: "Alex Rivera #1",
      pos: "PG",
      team: "Home",
      isUser: true,
      stats: { pts: 22, fgm: 8, fga: 14, tpm: 3, tpa: 6, reb: 4, ast: 7, stl: 2, blk: 1, tov: 2, fouls: 1 },
    },
    {
      name: "Thompson",
      pos: "C",
      team: "Home",
      isUser: false,
      stats: { pts: 10, fgm: 5, fga: 8, tpm: 0, tpa: 0, reb: 9, ast: 1, stl: 0, blk: 3, tov: 1, fouls: 3 },
    },
    {
      name: "Jordan",
      pos: "SG",
      team: "Away",
      isUser: false,
      stats: { pts: 24, fgm: 9, fga: 19, tpm: 2, tpa: 7, reb: 5, ast: 4, stl: 1, blk: 0, tov: 4, fouls: 2 },
    },
  ]);

  assert.equal(summary.players.length, 3);
  const userRow = summary.players.find((p) => p.isUser)!;
  assert.equal(userRow.pts, 22);
  assert.equal(userRow.fgPct, 57.1);
  assert.equal(userRow.tpPct, 50);
  assert.equal(userRow.tov, 2);

  assert.equal(summary.homeTotals.pts, 32);
  assert.equal(summary.homeTotals.fgm, 13);
  assert.equal(summary.homeTotals.fga, 22);
  assert.equal(summary.homeTotals.fgPct, 59.1);
  assert.equal(summary.homeTotals.tov, 3);

  assert.equal(summary.awayTotals.pts, 24);
  assert.equal(summary.awayTotals.fgPct, 47.4);
  assert.equal(summary.awayTotals.tov, 4);
});

test("resolveDeadBallInboundOwner flips offense/defense after scores and preserves fouled team possession", () => {
  // 1. Home scores -> Away inbounds from +12.2 and attacks -HOOP_X (Home transitions to defense)
  const afterHomeScore = resolveDeadBallInboundOwner({
    isPractice: false,
    deadReason: "score",
    lastScoringTeam: "Home",
    currentOwnerTeam: null,
    possessingTeam: "Home",
    ballZ: 4.0,
  });
  assert.equal(afterHomeScore.possessingTeam, "Away");
  assert.equal(afterHomeScore.inboundX, 12.2);
  assert.equal(afterHomeScore.inboundZ, 2.5);

  // 2. Away scores -> Home inbounds from -12.2 and goes from defense to offense
  const afterAwayScore = resolveDeadBallInboundOwner({
    isPractice: false,
    deadReason: "score",
    lastScoringTeam: "Away",
    currentOwnerTeam: null,
    possessingTeam: "Away",
    ballZ: -3.5,
  });
  assert.equal(afterAwayScore.possessingTeam, "Home");
  assert.equal(afterAwayScore.inboundX, -12.2);
  assert.equal(afterAwayScore.inboundZ, -2.5);

  // 3. Foul drawn by Away (or offensive foul on Home) -> Away MUST retain ball and Home goes to defense
  const afterHomeTurnoverFoul = resolveDeadBallInboundOwner({
    isPractice: false,
    deadReason: "foul",
    lastScoringTeam: null,
    currentOwnerTeam: "Away",
    possessingTeam: "Away",
    ballZ: 0.4,
  });
  assert.equal(afterHomeTurnoverFoul.possessingTeam, "Away");
  assert.equal(afterHomeTurnoverFoul.inboundX, null);

  // 4. Foul drawn by Home -> Home keeps ball on offense
  const afterAwayFoul = resolveDeadBallInboundOwner({
    isPractice: false,
    deadReason: "foul",
    lastScoringTeam: null,
    currentOwnerTeam: "Home",
    possessingTeam: "Home",
    ballZ: -0.6,
  });
  assert.equal(afterAwayFoul.possessingTeam, "Home");
});

test("Offense <-> defense flip immediately reorients offensive advance spots and defensive assignments", () => {
  // Home recovers ball on defense near x = -9 and transitions to offense toward +14 while Away goes to defense
  const homePositions = [
    { x: -9.2, z: 0.4 }, // ball handler
    { x: -8.5, z: -4.0 },
    { x: -7.8, z: 4.2 },
    { x: -6.5, z: -2.0 },
    { x: -10.2, z: 1.5 },
  ];
  const offTargetWing = computeDynamicOffBallTarget({
    slotIdx: 1,
    playerRole: "SG",
    targetHoopX: 14,
    ballOwnerPos: homePositions[0],
    shotInFlight: false,
    isFastBreak: true,
    offenseTactic: "balanced",
    activePlayCall: "FAST_BREAK" as OffenseMove,
    timeSec: 5.0,
    teammatePositions: homePositions.filter((_, i) => i !== 1),
  });
  assert.ok(offTargetWing.x > 6.0, `Expected offensive wing fast-break spot in frontcourt (>6.0), got ${offTargetWing.x.toFixed(2)}`);

  // Away transitions back to defend +14 hoop
  const awayDefAssign = assignDefensiveMatchups({
    defenders: [
      { idx: 0, pos: { x: 4.0, z: 0.2 }, role: "PG", prevMatchupIdx: 2 },
      { idx: 1, pos: { x: 8.5, z: -4.5 }, role: "SG", prevMatchupIdx: 3 },
      { idx: 2, pos: { x: 8.2, z: 4.5 }, role: "SF", prevMatchupIdx: 4 },
      { idx: 3, pos: { x: 9.8, z: -1.8 }, role: "PF", prevMatchupIdx: 1 },
      { idx: 4, pos: { x: 11.0, z: 0.5 }, role: "C", prevMatchupIdx: 0 },
    ],
    attackers: homePositions.map((p, idx) => ({ idx, pos: p, role: ["PG", "SG", "SF", "PF", "C"][idx] })),
    ballOwnerIdx: 0,
    ourHoopX: 14,
    isTransition: true,
  });
  assert.equal(awayDefAssign.matchupByDefenderIdx.size, 5);
  assert.equal(new Set(awayDefAssign.matchupByDefenderIdx.values()).size, 5);
  assert.equal(awayDefAssign.primaryDefenderIdx, 0, "Closest transition defender picks up ball handler");
});
