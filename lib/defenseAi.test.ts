import test from "node:test";
import assert from "node:assert/strict";
import type { DefenseMove, OffenseMove } from "./basketballMoves.ts";
import {
  chooseAdaptiveAiDefenseScheme,
  computeDefenseAiDecision,
  computeDynamicOffBallTarget,
} from "./defenseAi.ts";

test("On-ball defender executes authentic defensive moves across drive, closeout, and shot contest", () => {
  // 1. Perimeter closeout (> 3.6m away)
  const closeout = computeDefenseAiDecision({
    defenderIdx: 0,
    defenderPos: { x: -6, z: 0 },
    defenderVel: { x: 0, z: 0 },
    defenderHeight: 0,
    defenderRole: "PG",
    ourHoopX: -14,
    ballPos: { x: -1, z: 2 },
    ballHeight: 1.1,
    ballOwnerPos: { x: -1, z: 2 },
    ballOwnerVel: { x: 0, z: 0 },
    matchupPos: { x: -1, z: 2 },
    isOnBall: true,
    isNearestToBallHandler: true,
    shotInFlight: false,
    passInFlight: false,
    scheme: "MAN_TO_MAN" as DefenseMove,
    defenseTactic: "balanced",
    timeSec: 12,
    cooldownReady: true,
  });
  assert.equal(closeout.move, "CLOSEOUT" as DefenseMove);
  assert.equal(closeout.activateContest, true);
  assert.ok(closeout.speed >= 10);

  // 2. Shot in flight near rim -> Wall Up with jump & contest
  const wallUp = computeDefenseAiDecision({
    defenderIdx: 4,
    defenderPos: { x: -11.5, z: 0.4 },
    defenderVel: { x: 0, z: 0 },
    defenderHeight: 0,
    defenderRole: "C",
    ourHoopX: -14,
    ballPos: { x: -10.8, z: 0.2 },
    ballHeight: 2.3,
    ballOwnerPos: { x: -10.8, z: 0.2 },
    ballOwnerVel: { x: 0, z: 0 },
    matchupPos: { x: -10.8, z: 0.2 },
    isOnBall: true,
    isNearestToBallHandler: true,
    shotInFlight: true,
    passInFlight: false,
    scheme: "MAN_TO_MAN" as DefenseMove,
    defenseTactic: "balanced",
    timeSec: 14,
    cooldownReady: true,
  });
  assert.equal(wallUp.move, "WALL_UP" as DefenseMove);
  assert.equal(wallUp.activateWallUp, true);
  assert.equal(wallUp.triggerJump, true);

  // 3. Off-ball defender on shot -> Box Out / Wedge Crash
  const boxOut = computeDefenseAiDecision({
    defenderIdx: 2,
    defenderPos: { x: -8, z: -3 },
    defenderVel: { x: 0, z: 0 },
    defenderHeight: 0,
    defenderRole: "SF",
    ourHoopX: -14,
    ballPos: { x: -11, z: 0 },
    ballHeight: 2.8,
    ballOwnerPos: { x: -7, z: 4 },
    ballOwnerVel: { x: 0, z: 0 },
    matchupPos: { x: -9, z: -2.5 },
    isOnBall: false,
    isNearestToBallHandler: false,
    shotInFlight: true,
    passInFlight: false,
    scheme: "MAN_TO_MAN" as DefenseMove,
    defenseTactic: "balanced",
    timeSec: 14,
    cooldownReady: true,
  });
  assert.equal(boxOut.activateBoxOut, true);
  assert.ok(boxOut.move === "BOX_OUT" as DefenseMove || boxOut.move === "WEDGE_CRASH" as DefenseMove);
});

test("Adaptive AI defense switches to full court press when trailing late", () => {
  const pressOrTrap = chooseAdaptiveAiDefenseScheme({
    quarter: 4,
    gameClock: 45,
    scoreDiff: -7,
    timeSec: 4,
  });
  assert.ok(
    pressOrTrap === "FULL_COURT_PRESS" as DefenseMove || pressOrTrap === "BLITZ_TRAP" as DefenseMove
  );
});

test("Off-ball offensive targets continuously relocate and space away from ball handler", () => {
  const t1 = computeDynamicOffBallTarget({
    slotIdx: 1,
    targetHoopX: 14,
    ballOwnerPos: { x: 8, z: 0 },
    shotInFlight: false,
    isFastBreak: false,
    offenseTactic: "balanced",
    activePlayCall: null,
    timeSec: 2.0,
  });
  const t2 = computeDynamicOffBallTarget({
    slotIdx: 1,
    targetHoopX: 14,
    ballOwnerPos: { x: 8, z: 0 },
    shotInFlight: false,
    isFastBreak: false,
    offenseTactic: "balanced",
    activePlayCall: null,
    timeSec: 4.5,
  });
  const movedDist = Math.hypot(t2.x - t1.x, t2.z - t1.z);
  assert.ok(movedDist > 0.5, `Expected continuous motion, moved only ${movedDist.toFixed(2)}m`);

  const pnrRoll = computeDynamicOffBallTarget({
    slotIdx: 4,
    targetHoopX: 14,
    ballOwnerPos: { x: 7, z: 2 },
    shotInFlight: false,
    isFastBreak: false,
    offenseTactic: "balanced",
    activePlayCall: "PICK_AND_ROLL" as OffenseMove,
    timeSec: 0.3,
  });
  assert.equal(pnrRoll.isCutting, true);
});
