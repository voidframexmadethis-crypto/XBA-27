import test from "node:test";
import assert from "node:assert/strict";
import type { DefenseMove, OffenseMove } from "./basketballMoves.ts";
import {
  assignDefensiveMatchups,
  checkPassLaneInterception,
  computeDefenseAiDecision,
  computeDynamicOffBallTarget,
  stepSmoothSteering,
  type SmoothSteerState,
  type SteerObstacle,
} from "./defenseAi.ts";

test("stepSmoothSteering converges smoothly without back-and-forth jitter and avoids blocking obstacles", () => {
  // 1. Static target convergence without directional flip oscillation
  let pos = { x: -4.0, z: -2.0 };
  let vel = { x: 0, z: 0 };
  let steerState: SmoothSteerState | null = null;
  const target = { x: 4.0, z: 2.5 };
  const dt = 1 / 60;
  let prevDist = Math.hypot(target.x - pos.x, target.z - pos.z);
  let signFlips = 0;
  let lastVxSign = 0;

  for (let step = 0; step < 180; step++) {
    const res = stepSmoothSteering({
      pos,
      vel,
      target,
      maxSpeed: 8.5,
      dt,
      prevState: steerState,
    });
    steerState = res.state;
    vel = { x: res.vx, z: res.vz };
    pos = { x: pos.x + vel.x * dt, z: pos.z + vel.z * dt };
    const dist = Math.hypot(target.x - pos.x, target.z - pos.z);
    if (dist > 0.35) {
      assert.ok(dist <= prevDist + 0.02, `Expected monotonic approach, dist went ${prevDist.toFixed(3)} -> ${dist.toFixed(3)}`);
    }
    const vxSign = Math.abs(vel.x) > 0.25 ? Math.sign(vel.x) : 0;
    if (lastVxSign !== 0 && vxSign !== 0 && vxSign !== lastVxSign) {
      signFlips++;
    }
    if (vxSign !== 0) lastVxSign = vxSign;
    prevDist = dist;
  }

  const finalDist = Math.hypot(target.x - pos.x, target.z - pos.z);
  assert.ok(finalDist < 0.2, `Expected convergence within 0.2m, got ${finalDist.toFixed(3)}m`);
  assert.equal(signFlips, 0, `Expected zero back-and-forth oscillation flips, saw ${signFlips}`);

  // 2. Navigating around a blocking stanchion/player obstacle directly in path
  let obsPos = { x: 0, z: 0 };
  let obsVel = { x: 0, z: 0 };
  let obsState: SmoothSteerState | null = null;
  const obsTarget = { x: 8.0, z: 0 };
  const obstacles: SteerObstacle[] = [{ x: 3.5, z: 0.08, radius: 0.85 }];
  let minClearance = Infinity;

  for (let step = 0; step < 200; step++) {
    const res = stepSmoothSteering({
      pos: obsPos,
      vel: obsVel,
      target: obsTarget,
      maxSpeed: 8.0,
      dt,
      prevState: obsState,
      obstacles,
    });
    obsState = res.state;
    obsVel = { x: res.vx, z: res.vz };
    obsPos = { x: obsPos.x + obsVel.x * dt, z: obsPos.z + obsVel.z * dt };
    const dObs = Math.hypot(obsPos.x - obstacles[0].x, obsPos.z - obstacles[0].z);
    minClearance = Math.min(minClearance, dObs);
  }

  const obsFinalDist = Math.hypot(obsTarget.x - obsPos.x, obsTarget.z - obsPos.z);
  assert.ok(obsFinalDist < 0.35, `Expected obstacle bypass arrival < 0.35m, got ${obsFinalDist.toFixed(3)}m`);
  assert.ok(minClearance > 0.7, `Expected smooth bypass around obstacle center, minClearance=${minClearance.toFixed(3)}m`);
});

test("assignDefensiveMatchups produces bijective 5v5 assignments with single primary on-ball defender and role awareness", () => {
  const defenders = [
    { idx: 0, pos: { x: 6.2, z: 0.4 }, role: "PG", prevMatchupIdx: 0 },
    { idx: 1, pos: { x: 7.5, z: -5.2 }, role: "SG", prevMatchupIdx: 1 },
    { idx: 2, pos: { x: 7.8, z: 5.0 }, role: "SF", prevMatchupIdx: 2 },
    { idx: 3, pos: { x: 10.2, z: -3.2 }, role: "PF", prevMatchupIdx: 3 },
    { idx: 4, pos: { x: 11.8, z: 0.8 }, role: "C", prevMatchupIdx: 4 },
  ];
  const attackers = [
    { idx: 0, pos: { x: 5.0, z: 0.3 }, role: "PG" },
    { idx: 1, pos: { x: 8.0, z: -5.8 }, role: "SG" },
    { idx: 2, pos: { x: 8.2, z: 5.6 }, role: "SF" },
    { idx: 3, pos: { x: 10.6, z: -3.6 }, role: "PF" },
    { idx: 4, pos: { x: 11.4, z: 1.4 }, role: "C" },
  ];

  const out1 = assignDefensiveMatchups({
    defenders,
    attackers,
    ballOwnerIdx: 0,
    ourHoopX: 14,
  });

  assert.equal(out1.primaryDefenderIdx, 0);
  assert.equal(out1.matchupByDefenderIdx.size, 5);
  assert.equal(new Set(out1.matchupByDefenderIdx.values()).size, 5, "All 5 attackers must have unique defenders");
  assert.equal(out1.roleByDefenderIdx.get(0), "on_ball");
  assert.equal(out1.roleByDefenderIdx.get(4), "rim_anchor");

  // After pass to SG (idx 1), primary on-ball defender shifts cleanly to SG's defender (idx 1)
  const out2 = assignDefensiveMatchups({
    defenders,
    attackers,
    ballOwnerIdx: 1,
    ourHoopX: 14,
  });
  assert.equal(out2.primaryDefenderIdx, 1);
  assert.equal(out2.matchupByDefenderIdx.get(1), 1);
  assert.equal(new Set(out2.matchupByDefenderIdx.values()).size, 5);
});

test("checkPassLaneInterception prevents passer on-ball auto-steals and catches true mid-lane interceptions", () => {
  const from = { x: 6.0, z: 0.5 };
  const to = { x: 10.5, z: -5.5 };

  // 1. Passer's own on-ball defender hovering near passer right after release -> NO steal
  const earlyCheck = checkPassLaneInterception({
    from,
    to,
    ballPos: { x: 6.45, y: 1.55, z: -0.1 }, // ballAlong < 0.16
    defenderPos: { x: 7.0, z: 0.1 },
    defenderHeight: 0,
    laneReach: 1.45,
    passLaneHunterActive: true,
    passLaneMode: "intercept",
    isUserDef: false,
    roll: 0.05,
  });
  assert.equal(earlyCheck.hit, false);

  // 2. Wide-open pass with defender well off the passing line -> NO steal
  const openPass = checkPassLaneInterception({
    from,
    to,
    ballPos: { x: 8.25, y: 1.75, z: -2.5 }, // midpoint
    defenderPos: { x: 6.5, z: -4.8 }, // > 2m off lane
    defenderHeight: 0,
    laneReach: 1.45,
    passLaneHunterActive: false,
    passLaneMode: "deflect",
    isUserDef: false,
    roll: 0.1,
  });
  assert.equal(openPass.hit, false);

  // 3. Defender sitting directly in the passing lane at midpoint -> deflected or intercepted
  const stolenPass = checkPassLaneInterception({
    from,
    to,
    ballPos: { x: 8.25, y: 1.7, z: -2.5 }, // midpoint (ballAlong = 0.5)
    defenderPos: { x: 8.3, z: -2.55 },
    defenderHeight: 0,
    laneReach: 1.45,
    passLaneHunterActive: true,
    passLaneMode: "intercept",
    isUserDef: false,
    roll: 0.1,
  });
  assert.equal(stolenPass.hit, true);
  assert.equal(stolenPass.action, "intercept");
});

test("Full 5v5 half-court possession simulation maintains role spacing, bijective defense, and smooth motion", () => {
  const roles = ["PG", "SG", "SF", "PF", "C"];
  const offPos = [
    { x: 5.2, z: 0.2 }, // PG ball handler top of key
    { x: 8.5, z: 5.5 }, // SG wing
    { x: 8.8, z: -5.4 }, // SF weak wing
    { x: 10.6, z: -4.5 }, // PF corner
    { x: 9.8, z: 1.2 }, // C screen/roll
  ];
  const offVel = offPos.map(() => ({ x: 0, z: 0 }));
  const offSteer: (SmoothSteerState | null)[] = offPos.map(() => null);

  const defPos = [
    { x: 6.8, z: 0.1 },
    { x: 9.5, z: 4.5 },
    { x: 9.6, z: -4.4 },
    { x: 11.4, z: -3.2 },
    { x: 11.6, z: 0.7 },
  ];
  const defVel = defPos.map(() => ({ x: 0, z: 0 }));
  const defSteer: (SmoothSteerState | null)[] = defPos.map(() => null);
  let prevMatchups = [0, 1, 2, 3, 4];

  const dt = 1 / 60;
  let minTeammateSpacingAfterSettle = Infinity;
  let velocitySignFlipSum = 0;
  const prevDefVxSign = [0, 0, 0, 0, 0];

  for (let frame = 0; frame < 240; frame++) {
    const t = frame * dt;

    // 1. Update offense (PG holds ball around top of key; 4 off-ball roles run motion + PnR)
    for (let i = 1; i < 5; i++) {
      const mates = offPos.filter((_, idx) => idx !== i);
      const tgt = computeDynamicOffBallTarget({
        slotIdx: i,
        targetHoopX: 14,
        ballOwnerPos: offPos[0],
        shotInFlight: false,
        isFastBreak: false,
        offenseTactic: "balanced",
        activePlayCall: "PICK_AND_ROLL" as OffenseMove,
        timeSec: t,
        playerRole: roles[i],
        teammatePositions: mates,
      });
      const res = stepSmoothSteering({
        pos: offPos[i],
        vel: offVel[i],
        target: tgt,
        maxSpeed: tgt.speed,
        dt,
        prevState: offSteer[i],
      });
      offSteer[i] = res.state;
      offVel[i] = { x: res.vx, z: res.vz };
      offPos[i] = { x: offPos[i].x + res.vx * dt, z: offPos[i].z + res.vz * dt };
    }

    // 2. Bijective defensive matchup assignment
    const assign = assignDefensiveMatchups({
      defenders: defPos.map((p, idx) => ({ idx, pos: p, role: roles[idx], prevMatchupIdx: prevMatchups[idx] })),
      attackers: offPos.map((p, idx) => ({ idx, pos: p, role: roles[idx] })),
      ballOwnerIdx: 0,
      ourHoopX: 14,
    });
    assert.equal(new Set(assign.matchupByDefenderIdx.values()).size, 5, `Frame ${frame}: duplicate matchup detected`);

    const primaryIdx = assign.primaryDefenderIdx ?? 0;
    const primaryPos = defPos[primaryIdx];

    // 3. Defense decisions & steering
    for (let d = 0; d < 5; d++) {
      const attIdx = assign.matchupByDefenderIdx.get(d) ?? d;
      prevMatchups[d] = attIdx;
      const decision = computeDefenseAiDecision({
        defenderIdx: d,
        defenderPos: defPos[d],
        defenderVel: defVel[d],
        defenderHeight: 0,
        defenderRole: roles[d],
        ourHoopX: 14,
        ballPos: offPos[0],
        ballHeight: 1.0,
        ballOwnerPos: offPos[0],
        ballOwnerVel: offVel[0],
        matchupPos: offPos[attIdx],
        isOnBall: d === primaryIdx,
        isNearestToBallHandler: d === primaryIdx,
        shotInFlight: false,
        passInFlight: false,
        scheme: "MAN_TO_MAN" as DefenseMove,
        defenseTactic: "balanced",
        timeSec: t,
        cooldownReady: false,
        primaryDefenderPos: d === primaryIdx ? null : primaryPos,
        teammatePositions: defPos.map((p, idx) => ({ idx, pos: p, role: roles[idx] })),
        helpProximityRadius: 6.2,
      });

      const res = stepSmoothSteering({
        pos: defPos[d],
        vel: defVel[d],
        target: { x: decision.targetX, z: decision.targetZ },
        maxSpeed: decision.speed,
        dt,
        prevState: defSteer[d],
      });
      defSteer[d] = res.state;
      defVel[d] = { x: res.vx, z: res.vz };
      defPos[d] = { x: defPos[d].x + res.vx * dt, z: defPos[d].z + res.vz * dt };

      if (frame > 90 && Math.abs(res.vx) > 0.65) {
        const s = Math.sign(res.vx);
        if (prevDefVxSign[d] !== 0 && s !== prevDefVxSign[d]) {
          velocitySignFlipSum++;
        }
        prevDefVxSign[d] = s;
      }
    }

    if (frame > 120) {
      for (let a = 0; a < 5; a++) {
        for (let b = a + 1; b < 5; b++) {
          // Exclude screener (C=4) intentionally setting screen on handler (PG=0) during screen phase
          if ((a === 0 && b === 4) || (a === 4 && b === 0)) continue;
          const d = Math.hypot(offPos[a].x - offPos[b].x, offPos[a].z - offPos[b].z);
          minTeammateSpacingAfterSettle = Math.min(minTeammateSpacingAfterSettle, d);
        }
      }
    }
  }

  assert.ok(
    minTeammateSpacingAfterSettle >= 1.5,
    `Expected healthy off-ball teammate spacing >= 1.5m, got ${minTeammateSpacingAfterSettle.toFixed(2)}m`
  );
  // Center should remain closer to basket than top-of-key ball handler
  assert.ok(offPos[4].x > offPos[0].x, `Expected C (${offPos[4].x.toFixed(2)}) deeper toward +14 hoop than PG (${offPos[0].x.toFixed(2)})`);
  assert.ok(velocitySignFlipSum <= 6, `Expected smooth defensive tracking without jitter, flips=${velocitySignFlipSum}`);
});

test("stepSmoothSteering latches shoulder bypass side when approaching a blocker dead head-on", () => {
  let pos = { x: 0, z: 0 };
  let vel = { x: 0, z: 0 };
  let steerState: SmoothSteerState | null = null;
  const target = { x: 7.5, z: 0 };
  const blocker: SteerObstacle[] = [{ x: 3.0, z: 0.0, radius: 0.55 }];
  const dt = 1 / 60;

  let chosenSide = 0;
  let sideChanges = 0;
  let minClearance = Infinity;

  for (let frame = 0; frame < 180; frame++) {
    const res = stepSmoothSteering({
      pos,
      vel,
      target,
      maxSpeed: 8.5,
      dt,
      prevState: steerState,
      obstacles: blocker,
    });
    steerState = res.state;
    const s = res.state.avoidSide || 0;
    if (s !== 0) {
      if (chosenSide === 0) chosenSide = s;
      else if (s !== chosenSide) {
        sideChanges++;
        chosenSide = s;
      }
    }
    vel = { x: res.vx, z: res.vz };
    pos = { x: pos.x + vel.x * dt, z: pos.z + vel.z * dt };
    minClearance = Math.min(minClearance, Math.hypot(pos.x - blocker[0].x, pos.z - blocker[0].z));
  }

  assert.notEqual(chosenSide, 0, "Expected shoulder bypass side to latch on head-on obstacle");
  assert.equal(sideChanges, 0, `Expected zero left/right bypass side flips, saw ${sideChanges}`);
  assert.ok(minClearance > 0.72, `Expected clean clearance around player radius, got ${minClearance.toFixed(3)}m`);
  assert.ok(Math.hypot(target.x - pos.x, target.z - pos.z) < 0.35, "Expected arrival past head-on blocker");
});

test("assignDefensiveMatchups runs proactive switches on screens, shuffled crosses, and transitions while honoring switchLockT", () => {
  // 1. On-ball screen: C's defender (idx 4) is closer & between handler and hoop -> defense switches immediately
  const screenOut = assignDefensiveMatchups({
    defenders: [
      { idx: 0, pos: { x: 3.4, z: 0.4 }, role: "PG", prevMatchupIdx: 0 }, // caught behind screen
      { idx: 1, pos: { x: 8.2, z: -5.4 }, role: "SG", prevMatchupIdx: 1 },
      { idx: 2, pos: { x: 8.4, z: 5.4 }, role: "SF", prevMatchupIdx: 2 },
      { idx: 3, pos: { x: 10.2, z: -3.2 }, role: "PF", prevMatchupIdx: 3 },
      { idx: 4, pos: { x: 6.4, z: 0.2 }, role: "C", prevMatchupIdx: 4 }, // in position ahead of screen
    ],
    attackers: [
      { idx: 0, pos: { x: 5.0, z: 0.2 }, role: "PG" }, // ball handler coming off screen
      { idx: 1, pos: { x: 8.8, z: -5.8 }, role: "SG" },
      { idx: 2, pos: { x: 9.0, z: 5.8 }, role: "SF" },
      { idx: 3, pos: { x: 10.6, z: -3.6 }, role: "PF" },
      { idx: 4, pos: { x: 4.5, z: 0.6 }, role: "C" }, // screener next to handler (<2.6m)
    ],
    ballOwnerIdx: 0,
    ourHoopX: 14,
  });

  assert.equal(screenOut.primaryDefenderIdx, 4, "Expected big in drop/switch position to switch onto screened ball handler");
  assert.equal(screenOut.matchupByDefenderIdx.get(0), 4, "Expected PG defender to switch onto the roller/screener");
  assert.ok(screenOut.switchedDefenderIdxs.includes(4), "Expected switchedDefenderIdxs to record defender 4");
  assert.ok(screenOut.switchedDefenderIdxs.includes(0), "Expected switchedDefenderIdxs to record defender 0");

  // 2. Explicit manual switchLockT honors user swap even if another defender is slightly closer
  const lockedOut = assignDefensiveMatchups({
    defenders: [
      { idx: 0, pos: { x: 7.4, z: 0.3 }, role: "PG", prevMatchupIdx: 4, switchLockT: 1.2 },
      { idx: 1, pos: { x: 8.2, z: -5.4 }, role: "SG", prevMatchupIdx: 1 },
      { idx: 2, pos: { x: 8.4, z: 5.4 }, role: "SF", prevMatchupIdx: 2 },
      { idx: 3, pos: { x: 10.2, z: -3.2 }, role: "PF", prevMatchupIdx: 3 },
      { idx: 4, pos: { x: 6.4, z: 0.2 }, role: "C", prevMatchupIdx: 0, switchLockT: 1.2 },
    ],
    attackers: [
      { idx: 0, pos: { x: 5.0, z: 0.2 }, role: "PG" },
      { idx: 1, pos: { x: 8.8, z: -5.8 }, role: "SG" },
      { idx: 2, pos: { x: 9.0, z: 5.8 }, role: "SF" },
      { idx: 3, pos: { x: 10.6, z: -3.6 }, role: "PF" },
      { idx: 4, pos: { x: 8.6, z: 1.0 }, role: "C" },
    ],
    ballOwnerIdx: 0,
    ourHoopX: 14,
  });
  assert.equal(lockedOut.matchupByDefenderIdx.get(4), 0);

  // 3. Transition flip ignores stale prevMatchupIdx and matches nearest floor balance
  const transOut = assignDefensiveMatchups({
    defenders: [
      { idx: 0, pos: { x: 11.2, z: 4.5 }, role: "PG", prevMatchupIdx: 0 },
      { idx: 1, pos: { x: 11.0, z: -4.5 }, role: "SG", prevMatchupIdx: 1 },
      { idx: 2, pos: { x: 7.5, z: 0.1 }, role: "SF", prevMatchupIdx: 2 }, // right in front of PG handler
      { idx: 3, pos: { x: 10.0, z: 2.2 }, role: "PF", prevMatchupIdx: 3 },
      { idx: 4, pos: { x: 11.8, z: 0.0 }, role: "C", prevMatchupIdx: 4 },
    ],
    attackers: [
      { idx: 0, pos: { x: 6.1, z: 0.2 }, role: "PG" },
      { idx: 1, pos: { x: 10.4, z: 4.6 }, role: "SG" },
      { idx: 2, pos: { x: 10.5, z: -4.4 }, role: "SF" },
      { idx: 3, pos: { x: 9.4, z: 2.0 }, role: "PF" },
      { idx: 4, pos: { x: 11.2, z: 0.2 }, role: "C" },
    ],
    ballOwnerIdx: 0,
    ourHoopX: 14,
    isTransition: true,
  });
  assert.equal(transOut.primaryDefenderIdx, 2, "Expected transition pickup by nearest rim-side defender 2");
  assert.ok(transOut.switchedDefenderIdxs.length >= 2, "Expected transition switches across cross-matched floor");
});

test("computeDefenseAiDecision jumps on shotInFlight regardless of cooldownReady and closes out aggressively in zone", () => {
  const shotDecision = computeDefenseAiDecision({
    defenderIdx: 0,
    defenderPos: { x: 8.2, z: 0.4 },
    defenderVel: { x: 0, z: 0 },
    defenderHeight: 0,
    defenderRole: "PG",
    ourHoopX: 14,
    ballPos: { x: 7.1, z: 0.3 },
    ballHeight: 2.4,
    ballOwnerPos: { x: 6.9, z: 0.3 },
    ballOwnerVel: { x: 0, z: 0 },
    matchupPos: { x: 6.9, z: 0.3 },
    isOnBall: true,
    isNearestToBallHandler: true,
    shotInFlight: true,
    passInFlight: false,
    scheme: "MAN_TO_MAN" as DefenseMove,
    defenseTactic: "balanced",
    timeSec: 12.5,
    cooldownReady: false, // Must NOT prevent jump contest
    primaryDefenderPos: null,
    teammatePositions: [],
    helpProximityRadius: 6.2,
  });

  assert.equal(shotDecision.activateContest, true);
  assert.equal(shotDecision.triggerJump, true);
  assert.ok(shotDecision.jumpVel >= 4.9, `Expected strong contest jump velocity >= 4.9, got ${shotDecision.jumpVel}`);

  const zoneCloseout = computeDefenseAiDecision({
    defenderIdx: 1,
    defenderPos: { x: 10.8, z: -2.6 },
    defenderVel: { x: 0, z: 0 },
    defenderHeight: 0,
    defenderRole: "SG",
    ourHoopX: 14,
    ballPos: { x: 8.4, z: -3.2 },
    ballHeight: 1.0,
    ballOwnerPos: { x: 8.4, z: -3.2 },
    ballOwnerVel: { x: 0, z: 0 },
    matchupPos: { x: 8.4, z: -3.2 },
    isOnBall: false,
    isNearestToBallHandler: false,
    shotInFlight: false,
    passInFlight: false,
    scheme: "ZONE_2_3" as DefenseMove,
    defenseTactic: "balanced",
    timeSec: 15.0,
    cooldownReady: true,
    primaryDefenderPos: { x: 9.8, z: 1.5 },
    teammatePositions: [],
    helpProximityRadius: 6.2,
  });

  assert.equal(zoneCloseout.move, "CLOSEOUT");
  assert.equal(zoneCloseout.activateContest, true);
  assert.ok(zoneCloseout.speed >= 10.3, `Expected aggressive zone closeout speed >= 10.3, got ${zoneCloseout.speed}`);
});

