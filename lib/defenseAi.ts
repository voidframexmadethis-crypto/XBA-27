import type { DefenseMove, OffenseMove } from "./basketballMoves.ts";

const DM = {
  DEFENSIVE_STANCE: "DEFENSIVE_STANCE" as DefenseMove,
  DEFENSIVE_SLIDE: "DEFENSIVE_SLIDE" as DefenseMove,
  DROP_STEP_SWING: "DROP_STEP_SWING" as DefenseMove,
  SPRINT_TO_SLIDE: "SPRINT_TO_SLIDE" as DefenseMove,
  CLOSEOUT: "CLOSEOUT" as DefenseMove,
  SHADING_FORCING: "SHADING_FORCING" as DefenseMove,
  HAND_CHECK_ARM_BAR: "HAND_CHECK_ARM_BAR" as DefenseMove,
  STUNT_DIG: "STUNT_DIG" as DefenseMove,
  POKE_STEAL: "POKE_STEAL" as DefenseMove,
  HIP_RIDE: "HIP_RIDE" as DefenseMove,
  WALL_UP: "WALL_UP" as DefenseMove,
  SHOT_CONTEST: "SHOT_CONTEST" as DefenseMove,
  CHASE_DOWN_BLOCK: "CHASE_DOWN_BLOCK" as DefenseMove,
  DROP_COVERAGE: "DROP_COVERAGE" as DefenseMove,
  BLITZ_TRAP: "BLITZ_TRAP" as DefenseMove,
  ICE_BLUE: "ICE_BLUE" as DefenseMove,
  BALL_YOU_MAN: "BALL_YOU_MAN" as DefenseMove,
  FULL_DENIAL: "FULL_DENIAL" as DefenseMove,
  THREE_QUARTER_DENIAL: "THREE_QUARTER_DENIAL" as DefenseMove,
  GAP_HELP: "GAP_HELP" as DefenseMove,
  HELP_AND_RECOVER: "HELP_AND_RECOVER" as DefenseMove,
  X_OUT_ROTATION: "X_OUT_ROTATION" as DefenseMove,
  JUMP_PASSING_LANE: "JUMP_PASSING_LANE" as DefenseMove,
  THREE_QUARTER_FRONT: "THREE_QUARTER_FRONT" as DefenseMove,
  WEAK_SIDE_RIM_PROTECTION: "WEAK_SIDE_RIM_PROTECTION" as DefenseMove,
  BOX_OUT: "BOX_OUT" as DefenseMove,
  WEDGE_CRASH: "WEDGE_CRASH" as DefenseMove,
  MAN_TO_MAN: "MAN_TO_MAN" as DefenseMove,
  ZONE_2_3: "ZONE_2_3" as DefenseMove,
  ZONE_3_2: "ZONE_3_2" as DefenseMove,
  FULL_COURT_PRESS: "FULL_COURT_PRESS" as DefenseMove,
} as const;

const OM = {
  FAST_BREAK: "FAST_BREAK" as OffenseMove,
  PICK_AND_ROLL: "PICK_AND_ROLL" as OffenseMove,
  SPAIN_PICK_AND_ROLL: "SPAIN_PICK_AND_ROLL" as OffenseMove,
  SLIP_SCREEN: "SLIP_SCREEN" as OffenseMove,
  PICK_AND_POP: "PICK_AND_POP" as OffenseMove,
  GHOST_SCREEN: "GHOST_SCREEN" as OffenseMove,
} as const;

export interface SpatialVec2 {
  x: number;
  z: number;
}

export interface DefenseAiInput {
  defenderIdx: number;
  defenderPos: SpatialVec2;
  defenderVel: SpatialVec2;
  defenderHeight: number;
  defenderRole: string;
  ourHoopX: number; // -HOOP_X for Team A, +HOOP_X for Team B
  ballPos: SpatialVec2;
  ballHeight: number;
  ballOwnerPos: SpatialVec2 | null;
  ballOwnerVel: SpatialVec2 | null;
  matchupPos: SpatialVec2;
  isOnBall: boolean;
  isNearestToBallHandler: boolean;
  shotInFlight: boolean;
  passInFlight: boolean;
  scheme: DefenseMove;
  defenseTactic: string;
  timeSec: number;
  cooldownReady: boolean;
}

export interface DefenseAiDecision {
  move: DefenseMove;
  targetX: number;
  targetZ: number;
  speed: number;
  stanceActive: boolean;
  activateContest: boolean;
  contestLevel: number;
  activateWallUp: boolean;
  activateBoxOut: boolean;
  activateHipRide: boolean;
  activateHandCheck: boolean;
  activatePassLane: boolean;
  passLaneMode: "intercept" | "deflect";
  triggerPoke: boolean;
  triggerStunt: boolean;
  triggerJump: boolean;
  jumpVel: number;
  shadingSide: number;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function dist2d(a: SpatialVec2, b: SpatialVec2): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

/**
 * Selects an adaptive team defensive scheme for AI opponents (or honors player choice).
 */
export function chooseAdaptiveAiDefenseScheme(params: {
  quarter: number;
  gameClock: number;
  scoreDiff: number; // aiScore - oppScore
  timeSec: number;
}): DefenseMove {
  const { quarter, gameClock, scoreDiff, timeSec } = params;
  // Trailing late -> aggressive full-court press or blitz trap
  if (quarter >= 4 && gameClock < 75 && scoreDiff <= -4) {
    return Math.floor(timeSec / 12) % 2 === 0
      ? DM.FULL_COURT_PRESS
      : DM.BLITZ_TRAP;
  }
  // Holding a late lead -> protect the paint with Drop / 2-3 Zone
  if (quarter >= 4 && gameClock < 60 && scoreDiff >= 6) {
    return DM.ZONE_2_3;
  }
  // Rotate authentic pro coverages every ~18 seconds so matches feel alive and tactical
  const phase = Math.floor(timeSec / 18) % 5;
  if (phase === 1) return DM.ZONE_2_3;
  if (phase === 2) return DM.DROP_COVERAGE;
  if (phase === 3) return DM.ICE_BLUE;
  if (phase === 4) return DM.ZONE_3_2;
  return DM.MAN_TO_MAN;
}

/**
 * Computes real basketball defensive positioning AND tactical DefenseMove execution
 * for every active defender on both teams in every match.
 */
export function computeDefenseAiDecision(input: DefenseAiInput): DefenseAiDecision {
  const {
    defenderIdx,
    defenderPos,
    defenderHeight,
    defenderRole,
    ourHoopX,
    ballPos,
    ballOwnerPos,
    ballOwnerVel,
    matchupPos,
    isOnBall,
    isNearestToBallHandler,
    shotInFlight,
    passInFlight,
    scheme,
    defenseTactic,
    timeSec,
    cooldownReady,
  } = input;

  const hoop: SpatialVec2 = { x: ourHoopX, z: 0 };
  const hoopSign = ourHoopX < 0 ? -1 : 1; // -1 for Team A (-X hoop), +1 for Team B (+X hoop)
  const defendHalfDir = -hoopSign; // direction from our hoop toward midcourt (+1 for Team A, -1 for Team B)

  const handlerPos = ballOwnerPos || matchupPos;
  const distToHandler = dist2d(defenderPos, handlerPos);
  const distToMatchup = dist2d(defenderPos, matchupPos);
  const handlerToHoopDist = dist2d(handlerPos, hoop);
  const defenderToHoopDist = dist2d(defenderPos, hoop);

  // Base decision defaults
  let move: DefenseMove = DM.DEFENSIVE_STANCE;
  let targetX = matchupPos.x;
  let targetZ = matchupPos.z;
  let speed = 8.4;
  let stanceActive = false;
  let activateContest = false;
  let contestLevel = 0;
  let activateWallUp = false;
  let activateBoxOut = false;
  let activateHipRide = false;
  let activateHandCheck = false;
  let activatePassLane = false;
  let passLaneMode: "intercept" | "deflect" = "deflect";
  let triggerPoke = false;
  let triggerStunt = false;
  let triggerJump = false;
  let jumpVel = 0;
  const shadingSide = handlerPos.z >= 0 ? 1 : -1;

  // 1. SHOT IN FLIGHT -> SHOT CONTEST / WALL-UP / CHASE-DOWN / BOX OUT & WEDGE CRASH
  if (shotInFlight) {
    if (isOnBall || isNearestToBallHandler || distToHandler < 3.2) {
      const shooterBehindDef =
        (handlerPos.x - hoop.x) * defendHalfDir < (defenderPos.x - hoop.x) * defendHalfDir;
      if (shooterBehindDef && distToHandler < 3.4) {
        move = DM.CHASE_DOWN_BLOCK;
        speed = 11.4;
      } else if (defenderToHoopDist < 4.1) {
        move = DM.WALL_UP;
        activateWallUp = true;
        speed = 9.2;
      } else {
        move = DM.SHOT_CONTEST;
        speed = 9.8;
      }
      targetX = handlerPos.x + (hoop.x - handlerPos.x) * 0.25;
      targetZ = handlerPos.z * 0.85;
      activateContest = true;
      contestLevel = 2;
      if (cooldownReady && defenderHeight <= 0.05 && distToHandler < 2.8) {
        triggerJump = true;
        jumpVel = move === DM.CHASE_DOWN_BLOCK ? 4.3 : 3.6;
      }
    } else {
      // Off-ball defenders immediately box out their man toward the defensive glass
      move = defenderIdx % 3 === 0 ? DM.WEDGE_CRASH : DM.BOX_OUT;
      activateBoxOut = true;
      const toMatchupX = matchupPos.x - hoop.x;
      const toMatchupZ = matchupPos.z - hoop.z;
      const len = Math.max(0.5, Math.hypot(toMatchupX, toMatchupZ));
      const boxDist = Math.max(1.4, Math.min(4.8, len - 0.85));
      targetX = hoop.x + (toMatchupX / len) * boxDist;
      targetZ = hoop.z + (toMatchupZ / len) * boxDist;
      speed = 9.4;
    }
    return {
      move,
      targetX: clamp(targetX, -13.4, 13.4),
      targetZ: clamp(targetZ, -6.9, 6.9),
      speed,
      stanceActive: true,
      activateContest,
      contestLevel,
      activateWallUp,
      activateBoxOut,
      activateHipRide,
      activateHandCheck,
      activatePassLane,
      passLaneMode,
      triggerPoke,
      triggerStunt,
      triggerJump,
      jumpVel,
      shadingSide,
    };
  }

  // 2. PASS IN FLIGHT -> JUMP PASSING LANE / DEFLECTION / X-OUT CLOSEOUT
  if (passInFlight && !isOnBall) {
    move = distToMatchup > 3.0 ? DM.X_OUT_ROTATION : DM.JUMP_PASSING_LANE;
    activatePassLane = true;
    passLaneMode = dist2d(defenderPos, ballPos) < 3.4 ? "intercept" : "deflect";
    targetX = (ballPos.x + matchupPos.x) * 0.5;
    targetZ = (ballPos.z + matchupPos.z) * 0.5;
    speed = 10.6;
    stanceActive = true;
    return {
      move,
      targetX: clamp(targetX, -13.4, 13.4),
      targetZ: clamp(targetZ, -6.9, 6.9),
      speed,
      stanceActive,
      activateContest,
      contestLevel,
      activateWallUp,
      activateBoxOut,
      activateHipRide,
      activateHandCheck,
      activatePassLane,
      passLaneMode,
      triggerPoke,
      triggerStunt,
      triggerJump,
      jumpVel,
      shadingSide,
    };
  }

  // 3. TRANSITION RECOVERY (Sprint back when caught behind the ball)
  const handlerCloserToHoop =
    (handlerPos.x - hoop.x) * defendHalfDir + 0.65 < (defenderPos.x - hoop.x) * defendHalfDir;
  if (handlerCloserToHoop && handlerToHoopDist < 14.5) {
    move = isOnBall ? DM.SPRINT_TO_SLIDE : DM.HELP_AND_RECOVER;
    targetX = hoop.x + defendHalfDir * Math.max(1.8, handlerToHoopDist * 0.48);
    targetZ = clamp(matchupPos.z * 0.65 + ballPos.z * 0.25, -5.2, 5.2);
    speed = 12.6;
    return {
      move,
      targetX: clamp(targetX, -13.4, 13.4),
      targetZ: clamp(targetZ, -6.9, 6.9),
      speed,
      stanceActive: false,
      activateContest,
      contestLevel,
      activateWallUp,
      activateBoxOut,
      activateHipRide,
      activateHandCheck,
      activatePassLane,
      passLaneMode,
      triggerPoke,
      triggerStunt,
      triggerJump,
      jumpVel,
      shadingSide,
    };
  }

  // 4. ON-BALL PERIMETER & DRIVE CONTAINMENT
  if (isOnBall || isNearestToBallHandler) {
    const dx = hoop.x - handlerPos.x;
    const dz = hoop.z - handlerPos.z;
    const len = Math.max(0.6, Math.hypot(dx, dz));
    const dirX = dx / len;
    const dirZ = dz / len;
    const ownerSpeed = ballOwnerVel ? Math.hypot(ballOwnerVel.x, ballOwnerVel.z) : 0;

    // Check if offensive player beat defender on a drive
    const defBetween =
      (defenderPos.x - hoop.x) * defendHalfDir <= (handlerPos.x - hoop.x) * defendHalfDir + 0.35;

    if (distToHandler > 3.6) {
      // Closing out onto perimeter ball handler
      move = DM.CLOSEOUT;
      targetX = handlerPos.x + dirX * 1.25;
      targetZ = handlerPos.z + dirZ * 1.25;
      speed = 10.8;
      activateContest = true;
      contestLevel = 1;
    } else if (!defBetween && ownerSpeed > 3.2) {
      // Beaten on a drive -> Drop Step Swing & Sprint-to-Slide cut-off
      move = DM.DROP_STEP_SWING;
      targetX = handlerPos.x + dirX * 1.45;
      targetZ = handlerPos.z + dirZ * 1.45;
      speed = 11.4;
      stanceActive = true;
    } else if (handlerToHoopDist < 3.6 && distToHandler < 2.2) {
      // Rim protection verticality + wall-up
      move = DM.WALL_UP;
      targetX = handlerPos.x + dirX * 1.05;
      targetZ = handlerPos.z + dirZ * 1.05;
      speed = 8.8;
      stanceActive = true;
      activateWallUp = true;
      activateContest = true;
      contestLevel = 2;
      if (cooldownReady && ownerSpeed > 4.0 && defenderHeight <= 0.05) {
        triggerJump = true;
        jumpVel = 3.2;
      }
    } else if (ownerSpeed > 4.0 && distToHandler < 2.1) {
      // Riding the driver's hip & forcing weak side / baseline
      move = cooldownReady ? DM.HIP_RIDE : DM.HAND_CHECK_ARM_BAR;
      const latX = -dirZ;
      const latZ = dirX;
      targetX = handlerPos.x + dirX * 1.15 + latX * shadingSide * 0.32;
      targetZ = handlerPos.z + dirZ * 1.15 + latZ * shadingSide * 0.32;
      speed = 9.6;
      stanceActive = true;
      activateHipRide = true;
      activateHandCheck = true;
    } else {
      // Tight on-ball Defensive Slide + Shading + timed Poke-Steal
      const latOsc = Math.sin(timeSec * 3.1 + defenderIdx) * 0.22;
      const latX = -dirZ;
      const latZ = dirX;
      const gap = defenseTactic === "conservative" ? 1.85 : defenseTactic === "press" ? 1.05 : 1.28;
      targetX = handlerPos.x + dirX * gap + latX * (shadingSide * 0.25 + latOsc);
      targetZ = handlerPos.z + dirZ * gap + latZ * (shadingSide * 0.25 + latOsc);
      speed = ownerSpeed > 2.5 ? 9.2 : 8.1;
      stanceActive = true;
      if (cooldownReady && distToHandler < 1.65 && ownerSpeed < 4.5) {
        move = DM.POKE_STEAL;
        triggerPoke = true;
      } else if (ownerSpeed > 1.2) {
        move = DM.DEFENSIVE_SLIDE;
      } else {
        move = DM.SHADING_FORCING;
      }
    }
  } else {
    // 5. OFF-BALL TEAM SCHEMES, DENIAL, GAP HELP, RIM PROTECTION, STUNT & DIG
    const ballShiftX = clamp(ballPos.x * 0.16, -1.6, 1.6);
    const ballShiftZ = clamp(ballPos.z * 0.35, -2.2, 2.2);
    const isBig = defenderRole === "C" || defenderRole === "PF" || defenderIdx >= 3;

    if (scheme === DM.FULL_COURT_PRESS || defenseTactic === "press") {
      move = distToMatchup < 2.5 ? DM.FULL_DENIAL : DM.BALL_YOU_MAN;
      const toBallX = ballPos.x - matchupPos.x;
      const toBallZ = ballPos.z - matchupPos.z;
      const l = Math.max(0.8, Math.hypot(toBallX, toBallZ));
      targetX = matchupPos.x + (toBallX / l) * 0.95 + hoopSign * 0.45;
      targetZ = matchupPos.z + (toBallZ / l) * 0.95;
      speed = 9.6;
      activatePassLane = true;
      passLaneMode = "intercept";
      stanceActive = distToMatchup < 3.0;
    } else if (scheme === DM.ZONE_2_3 || defenseTactic === "zone") {
      move = isBig ? DM.WEAK_SIDE_RIM_PROTECTION : DM.GAP_HELP;
      const baseDepth = defenderIdx < 2 ? 4.4 : 1.95;
      const spreadZ =
        defenderIdx === 0 ? -2.5 : defenderIdx === 1 ? 2.5 : (defenderIdx - 3) * 2.8;
      targetX = hoop.x + defendHalfDir * baseDepth + ballShiftX * 0.55;
      targetZ = spreadZ + ballShiftZ * 0.72;
      speed = 8.2;
      stanceActive = distToHandler < 4.2;
    } else if (scheme === DM.ZONE_3_2) {
      move = defenderIdx < 3 ? DM.GAP_HELP : DM.WEAK_SIDE_RIM_PROTECTION;
      const baseDepth = defenderIdx < 3 ? 5.2 : 2.1;
      const spreadZ =
        defenderIdx < 3 ? (defenderIdx - 1) * 3.1 : defenderIdx === 3 ? -2.3 : 2.3;
      targetX = hoop.x + defendHalfDir * baseDepth + ballShiftX * 0.6;
      targetZ = spreadZ + ballShiftZ * 0.7;
      speed = 8.3;
      stanceActive = true;
    } else if (scheme === DM.BLITZ_TRAP && defenderIdx === 1) {
      // Second defender doubles / stunts on the ball handler!
      move = DM.STUNT_DIG;
      targetX = handlerPos.x + defendHalfDir * 0.95;
      targetZ = handlerPos.z + (handlerPos.z >= 0 ? -0.9 : 0.9);
      speed = 10.2;
      stanceActive = true;
      triggerStunt = cooldownReady && distToHandler < 2.2;
    } else if (scheme === DM.DROP_COVERAGE && isBig) {
      move = DM.DROP_COVERAGE;
      targetX = hoop.x + defendHalfDir * 2.55;
      targetZ = clamp(ballPos.z * 0.38, -2.1, 2.1);
      speed = 8.0;
      stanceActive = true;
      activateWallUp = handlerToHoopDist < 4.4;
    } else {
      // Man-to-Man / Ice Blue with intelligent Ball-You-Man, Gap Help, Post Fronting & Stunt/Dig
      const matchupToHoopDist = dist2d(matchupPos, hoop);
      const matchupToBallDist = dist2d(matchupPos, handlerPos);
      const laneDx = hoop.x - matchupPos.x;
      const laneDz = hoop.z - matchupPos.z;
      const laneLen = Math.max(0.6, Math.hypot(laneDx, laneDz));

      if (matchupToHoopDist < 4.3 && isBig) {
        // Post defense: Front / 3/4 Front & Dig Down
        move = DM.THREE_QUARTER_FRONT;
        targetX = matchupPos.x + (laneDx / laneLen) * 1.05;
        targetZ = matchupPos.z + (laneDz / laneLen) * 1.05 + (ballPos.z - matchupPos.z) * 0.14;
        speed = 8.4;
        stanceActive = true;
      } else if (matchupToBallDist < 5.6) {
        // 1-pass away -> Three-Quarter Denial + occasional Stunt & Dig at the driver
        if (cooldownReady && distToHandler < 3.1 && Math.sin(timeSec * 2.3 + defenderIdx) > 0.45) {
          move = DM.STUNT_DIG;
          targetX = (matchupPos.x + handlerPos.x) * 0.5;
          targetZ = (matchupPos.z + handlerPos.z) * 0.5;
          triggerStunt = true;
        } else {
          move = DM.THREE_QUARTER_DENIAL;
          targetX = matchupPos.x + (laneDx / laneLen) * 1.3 + (ballPos.x - matchupPos.x) * 0.18;
          targetZ = matchupPos.z + (laneDz / laneLen) * 1.3 + (ballPos.z - matchupPos.z) * 0.18;
          activatePassLane = true;
          passLaneMode = "deflect";
        }
        speed = 8.6;
        stanceActive = true;
      } else {
        // Weak-side Ball-You-Man / Gap Help & Rim Protection
        move = isBig ? DM.WEAK_SIDE_RIM_PROTECTION : DM.BALL_YOU_MAN;
        const helpBlend = handlerToHoopDist < 5.5 ? 0.44 : 0.28;
        targetX = matchupPos.x * (1 - helpBlend) + (hoop.x + defendHalfDir * 2.4) * helpBlend;
        targetZ = matchupPos.z * (1 - helpBlend) + clamp(ballPos.z * 0.35, -2.2, 2.2) * helpBlend;
        speed = 8.2;
        stanceActive = false;
      }
    }
  }

  return {
    move,
    targetX: clamp(targetX, -13.4, 13.4),
    targetZ: clamp(targetZ, -6.9, 6.9),
    speed,
    stanceActive,
    activateContest,
    contestLevel,
    activateWallUp,
    activateBoxOut,
    activateHipRide,
    activateHandCheck,
    activatePassLane,
    passLaneMode,
    triggerPoke,
    triggerStunt,
    triggerJump,
    jumpVel,
    shadingSide,
  };
}

/**
 * Computes continuous, lively off-ball offensive targets so teammates NEVER stand still.
 * Includes perimeter spacing, corner relocations, backdoor cuts, P&R rolls/pops, and rebound crashes.
 */
export function computeDynamicOffBallTarget(params: {
  slotIdx: number; // 0..4
  targetHoopX: number; // +HOOP_X for Team A, -HOOP_X for Team B
  ballOwnerPos: SpatialVec2 | null;
  shotInFlight: boolean;
  isFastBreak: boolean;
  offenseTactic: string;
  activePlayCall: OffenseMove | null;
  timeSec: number;
}): { x: number; z: number; speed: number; isCutting: boolean } {
  const {
    slotIdx,
    targetHoopX,
    ballOwnerPos,
    shotInFlight,
    isFastBreak,
    offenseTactic,
    activePlayCall,
    timeSec,
  } = params;

  const attackDir = targetHoopX > 0 ? 1 : -1;
  const hoopX = targetHoopX;

  // On shot in flight, 2 frontcourt players crash offensive boards while perimeter stays balanced
  if (shotInFlight) {
    if (slotIdx >= 3) {
      return {
        x: clamp(hoopX - attackDir * 2.1, -13.3, 13.3),
        z: slotIdx === 3 ? -1.4 : 1.4,
        speed: 10.8,
        isCutting: true,
      };
    }
    return {
      x: clamp(hoopX - attackDir * 6.8, -13.3, 13.3),
      z: (slotIdx - 1) * 3.8,
      speed: 8.4,
      isCutting: false,
    };
  }

  // Fast Break -> sprint down wide wings & rim runner lane
  if (isFastBreak || activePlayCall === OM.FAST_BREAK || offenseTactic === "fast_break") {
    const laneZs = [0, -5.8, 5.8, -2.4, 2.4];
    const laneXs = [hoopX - attackDir * 4.5, hoopX - attackDir * 2.8, hoopX - attackDir * 2.8, hoopX - attackDir * 1.9, hoopX - attackDir * 6.2];
    const drift = Math.sin(timeSec * 2.2 + slotIdx) * 0.45;
    return {
      x: clamp(laneXs[slotIdx % 5] + drift, -13.3, 13.3),
      z: clamp(laneZs[slotIdx % 5], -6.8, 6.8),
      speed: 12.6,
      isCutting: true,
    };
  }

  // Pick & Roll / Spain P&R -> big screens near ball handler then rolls to rim
  if (
    slotIdx === 4 &&
    ballOwnerPos &&
    (activePlayCall === OM.PICK_AND_ROLL ||
      activePlayCall === OM.SPAIN_PICK_AND_ROLL ||
      activePlayCall === OM.SLIP_SCREEN)
  ) {
    const rollCycle = (timeSec * 0.65) % 2;
    if (rollCycle < 0.9) {
      return {
        x: clamp(ballOwnerPos.x + attackDir * 1.35, -13.2, 13.2),
        z: clamp(ballOwnerPos.z + (ballOwnerPos.z >= 0 ? -0.9 : 0.9), -6.5, 6.5),
        speed: 9.0,
        isCutting: true,
      };
    }
    return {
      x: clamp(hoopX - attackDir * 2.0, -13.2, 13.2),
      z: ballOwnerPos.z >= 0 ? -1.1 : 1.1,
      speed: 10.6,
      isCutting: true,
    };
  }

  // Pick & Pop / Ghost Screen -> pop to open arc
  if (
    slotIdx === 4 &&
    ballOwnerPos &&
    (activePlayCall === OM.PICK_AND_POP || activePlayCall === OM.GHOST_SCREEN)
  ) {
    return {
      x: clamp(hoopX - attackDir * 7.2, -13.2, 13.2),
      z: ballOwnerPos.z >= 0 ? -5.2 : 5.2,
      speed: 9.0,
      isCutting: false,
    };
  }

  // Motion 5-Out / Paint Power continuous cutting & spacing cycle so no teammate stands idle
  const cycle = timeSec * 0.85 + slotIdx * 1.45;
  const waveX = Math.sin(cycle) * 1.75;
  const waveZ = Math.cos(cycle * 0.8) * 1.35;

  // Periodic backdoor / flash cut every ~6.5s staggered by slotIdx
  const cutWindow = (timeSec + slotIdx * 1.9) % 6.5;
  if (cutWindow < 1.35) {
    const cutSide = slotIdx % 2 === 0 ? -1.4 : 1.4;
    return {
      x: clamp(hoopX - attackDir * 2.1, -13.2, 13.2),
      z: clamp(cutSide + Math.sin(timeSec * 2) * 0.6, -6.5, 6.5),
      speed: 10.2,
      isCutting: true,
    };
  }

  // Base spacing coordinates (wings, corners, top-key, dunker spot)
  const spacingSpots: [number, number][] =
    offenseTactic === "paint_power"
      ? [
          [7.4, 0],
          [5.4, 5.6],
          [5.4, -5.6],
          [2.4, 2.3],
          [2.1, -2.3],
        ]
      : [
          [7.8, 0],
          [5.8, 5.7],
          [5.8, -5.7],
          [2.8, 5.9],
          [3.6, -2.2],
        ];

  const [distFromHoop, baseZ] = spacingSpots[slotIdx % 5];
  let tx = hoopX - attackDir * distFromHoop + waveX;
  let tz = baseZ + waveZ;

  // Maintain healthy spacing away from ball owner so teammates don't crowd the ball handler
  if (ballOwnerPos) {
    const dx = tx - ballOwnerPos.x;
    const dz = tz - ballOwnerPos.z;
    const d = Math.hypot(dx, dz);
    if (d < 3.1) {
      const pushZ = dz >= 0 ? 1 : -1;
      tz = clamp(tz + pushZ * (3.3 - d), -6.6, 6.6);
      tx = clamp(tx - attackDir * 1.2, -13.2, 13.2);
    }
  }

  return {
    x: clamp(tx, -13.2, 13.2),
    z: clamp(tz, -6.7, 6.7),
    speed: 7.9,
    isCutting: false,
  };
}
