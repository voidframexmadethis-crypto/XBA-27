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

export interface TeammateDefenderInfo {
  idx: number;
  pos: SpatialVec2;
  vel?: SpatialVec2;
  role?: string;
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
  primaryDefenderPos?: SpatialVec2 | null;
  primaryDefenderVel?: SpatialVec2 | null;
  teammatePositions?: TeammateDefenderInfo[];
  helpProximityRadius?: number;
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
  isLaneCutOff?: boolean;
  isBeatenTeammateHelp?: boolean;
  helpTargetRole?: "primary_cutoff" | "help_rotate" | "rim_wall" | "recover" | "matchup";
}

export interface DrivingLaneAnalysis {
  handlerToHoopDist: number;
  laneDirX: number;
  laneDirZ: number;
  laneLatX: number;
  laneLatZ: number;
  ownerSpeed: number;
  driveForwardSpeed: number;
  driveLateralSpeed: number;
  projectedHandlerX: number;
  projectedHandlerZ: number;
  interceptX: number;
  interceptZ: number;
  isPrimaryBeaten: boolean;
  shouldHelpRotate: boolean;
  helpUrgency: number;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function dist2d(a: SpatialVec2, b: SpatialVec2): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

/**
 * Evaluates ball-handler driving lane velocity, predicts the cutoff point along
 * the attacking corridor, and uses proximity-based teammate detection to determine
 * whether the primary defender has been beaten and whether this defender should
 * dynamically rotate into Help Defense.
 */
export function evaluateDrivingLaneAndBeatenTeammate(params: {
  defenderIdx: number;
  defenderPos: SpatialVec2;
  defenderRole: string;
  ourHoopX: number;
  handlerPos: SpatialVec2;
  ballOwnerVel: SpatialVec2 | null;
  primaryDefenderPos?: SpatialVec2 | null;
  teammatePositions?: TeammateDefenderInfo[];
  helpProximityRadius?: number;
  isOnBall: boolean;
  isNearestToBallHandler: boolean;
}): DrivingLaneAnalysis {
  const {
    defenderIdx,
    defenderPos,
    defenderRole,
    ourHoopX,
    handlerPos,
    ballOwnerVel,
    primaryDefenderPos,
    teammatePositions,
    helpProximityRadius = 6.2,
    isOnBall,
    isNearestToBallHandler,
  } = params;

  const hoop: SpatialVec2 = { x: ourHoopX, z: 0 };
  const hoopSign = ourHoopX < 0 ? -1 : 1;
  const defendHalfDir = -hoopSign;

  const dx = hoop.x - handlerPos.x;
  const dz = hoop.z - handlerPos.z;
  const handlerToHoopDist = Math.max(0.55, Math.hypot(dx, dz));
  const laneDirX = dx / handlerToHoopDist;
  const laneDirZ = dz / handlerToHoopDist;
  const laneLatX = -laneDirZ;
  const laneLatZ = laneDirX;

  const vx = ballOwnerVel?.x ?? 0;
  const vz = ballOwnerVel?.z ?? 0;
  const ownerSpeed = Math.hypot(vx, vz);
  const driveForwardSpeed = vx * laneDirX + vz * laneDirZ;
  const driveLateralSpeed = vx * laneLatX + vz * laneLatZ;

  // Anticipate where the ball handler is moving in the next ~0.22-0.34s to beat them to the spot
  const distToHandler = dist2d(defenderPos, handlerPos);
  const leadTime = ownerSpeed > 1.0 ? clamp(0.16 + distToHandler * 0.035, 0.16, 0.34) : 0;
  const projectedHandlerX = clamp(handlerPos.x + vx * leadTime, -13.3, 13.3);
  const projectedHandlerZ = clamp(handlerPos.z + vz * leadTime, -6.8, 6.8);

  // Help intercept sits directly inside the driving corridor between projected handler and rim
  const interceptDistFromHoop = clamp(handlerToHoopDist * 0.44, 1.35, 3.6);
  const projDx = hoop.x - projectedHandlerX;
  const projDz = hoop.z - projectedHandlerZ;
  const projLen = Math.max(0.6, Math.hypot(projDx, projDz));
  const interceptX = clamp(hoop.x - (projDx / projLen) * interceptDistFromHoop, -13.2, 13.2);
  const interceptZ = clamp(hoop.z - (projDz / projLen) * interceptDistFromHoop, -5.8, 5.8);

  // Identify primary defender position (explicit or nearest teammate to ball handler)
  let effPrimaryPos: SpatialVec2 | null = primaryDefenderPos ?? null;
  let effPrimaryIdx = -1;
  if (!effPrimaryPos && teammatePositions && teammatePositions.length > 0) {
    let bestD = Infinity;
    for (const mate of teammatePositions) {
      const d = dist2d(mate.pos, handlerPos);
      if (d < bestD) {
        bestD = d;
        effPrimaryPos = mate.pos;
        effPrimaryIdx = mate.idx;
      }
    }
  }

  let isPrimaryBeaten = false;
  if (effPrimaryPos) {
    const primaryToHoop = dist2d(effPrimaryPos, hoop);
    const primaryToHandler = dist2d(effPrimaryPos, handlerPos);
    const lateralOffset = Math.abs(
      (effPrimaryPos.x - handlerPos.x) * laneLatX + (effPrimaryPos.z - handlerPos.z) * laneLatZ
    );
    const depthBehind =
      (handlerPos.x - hoop.x) * defendHalfDir + 0.2 < (effPrimaryPos.x - hoop.x) * defendHalfDir;
    const closerToHoop = handlerToHoopDist + 0.25 < primaryToHoop;
    const coneBlowBy =
      (driveForwardSpeed > 1.9 || ownerSpeed > 2.8) &&
      (lateralOffset > 1.05 || primaryToHandler > 2.05) &&
      handlerToHoopDist < 8.4;
    isPrimaryBeaten = (depthBehind || closerToHoop || coneBlowBy) && handlerToHoopDist < 9.2;
  } else {
    // Fallback heuristic when caller doesn't supply teammate positions
    isPrimaryBeaten = handlerToHoopDist < 6.8 && ownerSpeed > 3.2 && driveForwardSpeed > 0.25;
  }

  const interceptPoint: SpatialVec2 = { x: interceptX, z: interceptZ };
  const distToIntercept = dist2d(defenderPos, interceptPoint);
  const isBig = defenderRole === "C" || defenderRole === "PF" || defenderIdx >= 3;

  // Proximity-based help trigger: closest eligible off-ball teammate within helpProximityRadius rotates
  let isClosestHelper = true;
  if (teammatePositions && teammatePositions.length > 1) {
    const myScore = distToIntercept - (isBig ? 0.45 : 0);
    for (const mate of teammatePositions) {
      if (mate.idx === defenderIdx) continue;
      if (mate.idx === effPrimaryIdx) continue;
      if (effPrimaryPos && dist2d(mate.pos, effPrimaryPos) < 0.25) continue;
      const mateBig = mate.role === "C" || mate.role === "PF" || mate.idx >= 3;
      const mateScore = dist2d(mate.pos, interceptPoint) - (mateBig ? 0.45 : 0);
      if (mateScore + 0.15 < myScore) {
        isClosestHelper = false;
        break;
      }
    }
  }

  const withinHelpProximity =
    distToIntercept <= helpProximityRadius || distToHandler <= helpProximityRadius + 0.6;
  const activeAttackThreat =
    handlerToHoopDist < 8.6 &&
    (driveForwardSpeed > 0.45 || (ownerSpeed > 2.2 && handlerToHoopDist < 6.2) || isPrimaryBeaten);

  const shouldHelpRotate =
    !isOnBall &&
    !isNearestToBallHandler &&
    isPrimaryBeaten &&
    activeAttackThreat &&
    withinHelpProximity &&
    isClosestHelper;

  const helpUrgency = shouldHelpRotate
    ? clamp((helpProximityRadius + 1.2 - distToIntercept) / helpProximityRadius + (handlerToHoopDist < 4.8 ? 0.35 : 0), 0.25, 1)
    : 0;

  return {
    handlerToHoopDist,
    laneDirX,
    laneDirZ,
    laneLatX,
    laneLatZ,
    ownerSpeed,
    driveForwardSpeed,
    driveLateralSpeed,
    projectedHandlerX,
    projectedHandlerZ,
    interceptX,
    interceptZ,
    isPrimaryBeaten,
    shouldHelpRotate,
    helpUrgency,
  };
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
    primaryDefenderPos,
    teammatePositions,
    helpProximityRadius,
  } = input;

  const hoop: SpatialVec2 = { x: ourHoopX, z: 0 };
  const hoopSign = ourHoopX < 0 ? -1 : 1; // -1 for Team A (-X hoop), +1 for Team B (+X hoop)
  const defendHalfDir = -hoopSign; // direction from our hoop toward midcourt (+1 for Team A, -1 for Team B)

  const handlerPos = ballOwnerPos || matchupPos;
  const distToHandler = dist2d(defenderPos, handlerPos);
  const distToMatchup = dist2d(defenderPos, matchupPos);
  const handlerToHoopDist = dist2d(handlerPos, hoop);
  const defenderToHoopDist = dist2d(defenderPos, hoop);

  const lane = evaluateDrivingLaneAndBeatenTeammate({
    defenderIdx,
    defenderPos,
    defenderRole,
    ourHoopX,
    handlerPos,
    ballOwnerVel,
    primaryDefenderPos,
    teammatePositions,
    helpProximityRadius,
    isOnBall,
    isNearestToBallHandler,
  });

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
  let isLaneCutOff = false;
  let isBeatenTeammateHelp = false;
  let helpTargetRole: DefenseAiDecision["helpTargetRole"] = "matchup";
  // Shade toward the direction the driver is attacking laterally (or toward middle/sideline force)
  const shadingSide =
    Math.abs(lane.driveLateralSpeed) > 0.65
      ? Math.sign(lane.driveLateralSpeed)
      : handlerPos.z >= 0
        ? 1
        : -1;

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

  // 4. ON-BALL INTELLIGENT DEFENSIVE STANCE & DRIVING LANE CUTOFF
  if (isOnBall || isNearestToBallHandler) {
    const ownerSpeed = lane.ownerSpeed;
    // Project along ball-handler driving velocity vector so defender beats driver to the lane spot
    const aimHandlerX = ownerSpeed > 1.2 ? lane.projectedHandlerX : handlerPos.x;
    const aimHandlerZ = ownerSpeed > 1.2 ? lane.projectedHandlerZ : handlerPos.z;
    const dx = hoop.x - aimHandlerX;
    const dz = hoop.z - aimHandlerZ;
    const len = Math.max(0.6, Math.hypot(dx, dz));
    const dirX = dx / len;
    const dirZ = dz / len;
    const latX = -dirZ;
    const latZ = dirX;

    // Check if offensive player has already gained a step past our hoop-side containment plane
    const defBetween =
      (defenderPos.x - hoop.x) * defendHalfDir <= (handlerPos.x - hoop.x) * defendHalfDir + 0.35;

    if (distToHandler > 3.6) {
      // Closing out onto perimeter ball handler while staying inside driving lane
      move = DM.CLOSEOUT;
      targetX = aimHandlerX + dirX * 1.22;
      targetZ = aimHandlerZ + dirZ * 1.22;
      speed = 10.9;
      stanceActive = distToHandler < 4.5;
      activateContest = true;
      contestLevel = 1;
      isLaneCutOff = true;
      helpTargetRole = "primary_cutoff";
    } else if (!defBetween && ownerSpeed > 2.8) {
      // Beaten on a drive -> Drop Step Swing & Sprint-to-Slide cut-off ahead of driving line
      move = DM.DROP_STEP_SWING;
      targetX = aimHandlerX + dirX * 1.55;
      targetZ = aimHandlerZ + dirZ * 1.55;
      speed = clamp(10.8 + ownerSpeed * 0.2, 10.8, 12.2);
      stanceActive = true;
      isLaneCutOff = true;
      helpTargetRole = "primary_cutoff";
    } else if (handlerToHoopDist < 3.6 && distToHandler < 2.2) {
      // Rim protection verticality + wall-up
      move = DM.WALL_UP;
      targetX = aimHandlerX + dirX * 1.0;
      targetZ = aimHandlerZ + dirZ * 1.0;
      speed = 9.0;
      stanceActive = true;
      activateWallUp = true;
      activateContest = true;
      contestLevel = 2;
      isLaneCutOff = true;
      helpTargetRole = "rim_wall";
      if (cooldownReady && ownerSpeed > 4.0 && defenderHeight <= 0.05) {
        triggerJump = true;
        jumpVel = 3.2;
      }
    } else if (ownerSpeed > 3.2 && distToHandler < 2.35) {
      // Driving-lane cutoff: ride hip & slide directly into projected lateral driving path
      const lateralLead = clamp(lane.driveLateralSpeed * 0.16, -0.55, 0.55);
      move = cooldownReady ? DM.HIP_RIDE : DM.DEFENSIVE_SLIDE;
      targetX = aimHandlerX + dirX * 1.15 + latX * (shadingSide * 0.24 + lateralLead);
      targetZ = aimHandlerZ + dirZ * 1.15 + latZ * (shadingSide * 0.24 + lateralLead);
      speed = clamp(9.4 + ownerSpeed * 0.18, 9.4, 11.4);
      stanceActive = true;
      activateHipRide = true;
      activateHandCheck = true;
      isLaneCutOff = true;
      helpTargetRole = "primary_cutoff";
    } else {
      // Active Defensive Stance: squared to handler, micro-shading to cut off preferred driving angle
      const latOsc = ownerSpeed > 0.8 ? 0 : Math.sin(timeSec * 2.8 + defenderIdx) * 0.16;
      const gap = defenseTactic === "conservative" ? 1.85 : defenseTactic === "press" ? 1.05 : 1.26;
      const lateralLead = clamp(lane.driveLateralSpeed * 0.14, -0.45, 0.45);
      targetX = aimHandlerX + dirX * gap + latX * (shadingSide * 0.22 + lateralLead + latOsc);
      targetZ = aimHandlerZ + dirZ * gap + latZ * (shadingSide * 0.22 + lateralLead + latOsc);
      speed = ownerSpeed > 2.2 ? 9.4 : 8.2;
      stanceActive = true;
      isLaneCutOff = ownerSpeed > 1.2;
      helpTargetRole = "primary_cutoff";
      if (cooldownReady && distToHandler < 1.65 && ownerSpeed < 4.5) {
        move = DM.POKE_STEAL;
        triggerPoke = true;
      } else if (ownerSpeed > 1.2) {
        move = DM.DEFENSIVE_SLIDE;
      } else {
        move = DM.DEFENSIVE_STANCE;
      }
    }
  } else {
    // 5. OFF-BALL PROXIMITY-BASED HELP DEFENSE, TEAM SCHEMES, DENIAL & RECOVERY
    const ballShiftX = clamp(ballPos.x * 0.16, -1.6, 1.6);
    const ballShiftZ = clamp(ballPos.z * 0.35, -2.2, 2.2);
    const isBig = defenderRole === "C" || defenderRole === "PF" || defenderIdx >= 3;

    // Proximity-based dynamic Help Defense takes priority whenever a teammate is beaten on a drive
    // (except full-court press assignments far upcourt where handlerToHoopDist >= 9.2)
    if (lane.shouldHelpRotate) {
      const nearRimThreat = handlerToHoopDist < 4.8 || dist2d({ x: lane.interceptX, z: lane.interceptZ }, hoop) < 3.1;
      move = nearRimThreat ? DM.WEAK_SIDE_RIM_PROTECTION : DM.HELP_AND_RECOVER;
      targetX = lane.interceptX;
      targetZ = lane.interceptZ;
      speed = clamp(10.5 + lane.ownerSpeed * 0.22 + lane.helpUrgency * 0.9, 10.4, 12.2);
      stanceActive = true;
      isLaneCutOff = true;
      isBeatenTeammateHelp = true;
      helpTargetRole = nearRimThreat ? "rim_wall" : "help_rotate";
      activateWallUp = handlerToHoopDist < 4.9;
      activateContest = handlerToHoopDist < 4.6;
      contestLevel = handlerToHoopDist < 4.2 ? 2 : handlerToHoopDist < 4.8 ? 1 : 0;
      if (cooldownReady && nearRimThreat && distToHandler < 2.5 && defenderHeight <= 0.05 && lane.ownerSpeed > 4.2) {
        triggerJump = true;
        jumpVel = 3.3;
      }
    } else if (scheme === DM.FULL_COURT_PRESS || defenseTactic === "press") {
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
      speed = 8.4;
      stanceActive = distToHandler < 4.6;
    } else if (scheme === DM.ZONE_3_2) {
      move = defenderIdx < 3 ? DM.GAP_HELP : DM.WEAK_SIDE_RIM_PROTECTION;
      const baseDepth = defenderIdx < 3 ? 5.2 : 2.1;
      const spreadZ =
        defenderIdx < 3 ? (defenderIdx - 1) * 3.1 : defenderIdx === 3 ? -2.3 : 2.3;
      targetX = hoop.x + defendHalfDir * baseDepth + ballShiftX * 0.6;
      targetZ = spreadZ + ballShiftZ * 0.7;
      speed = 8.4;
      stanceActive = true;
    } else if (scheme === DM.BLITZ_TRAP && defenderIdx === 1) {
      // Second defender doubles / stunts on the ball handler!
      move = DM.STUNT_DIG;
      targetX = lane.projectedHandlerX + defendHalfDir * 0.95;
      targetZ = lane.projectedHandlerZ + (handlerPos.z >= 0 ? -0.9 : 0.9);
      speed = 10.4;
      stanceActive = true;
      isLaneCutOff = true;
      triggerStunt = cooldownReady && distToHandler < 2.2;
    } else if (scheme === DM.DROP_COVERAGE && isBig) {
      move = DM.DROP_COVERAGE;
      targetX = hoop.x + defendHalfDir * 2.55;
      targetZ = clamp(lane.projectedHandlerZ * 0.42, -2.1, 2.1);
      speed = 8.4;
      stanceActive = true;
      activateWallUp = handlerToHoopDist < 4.4;
    } else {
      // Man-to-Man / Ice Blue with intelligent Ball-You-Man, Gap Help, Post Fronting & Recovery
      const matchupToHoopDist = dist2d(matchupPos, hoop);
      const matchupToBallDist = dist2d(matchupPos, handlerPos);
      const laneDx = hoop.x - matchupPos.x;
      const laneDz = hoop.z - matchupPos.z;
      const laneLen = Math.max(0.6, Math.hypot(laneDx, laneDz));

      // Proactive gap help if defender is close to driving lane even before primary is fully beaten
      const mildDriveShrink =
        handlerToHoopDist < 6.4 &&
        lane.ownerSpeed > 2.8 &&
        lane.driveForwardSpeed > 0.6 &&
        distToHandler < 4.8;

      if (mildDriveShrink) {
        move = DM.GAP_HELP;
        targetX = matchupPos.x * 0.62 + lane.interceptX * 0.38;
        targetZ = matchupPos.z * 0.62 + lane.interceptZ * 0.38;
        speed = 9.2;
        stanceActive = true;
        isLaneCutOff = true;
        helpTargetRole = "recover";
      } else if (matchupToHoopDist < 4.3 && isBig) {
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
        // Weak-side Ball-You-Man / Gap Help & Rim Protection recovery
        move = isBig ? DM.WEAK_SIDE_RIM_PROTECTION : DM.BALL_YOU_MAN;
        const helpBlend = handlerToHoopDist < 5.5 ? 0.44 : 0.28;
        targetX = matchupPos.x * (1 - helpBlend) + (hoop.x + defendHalfDir * 2.4) * helpBlend;
        targetZ = matchupPos.z * (1 - helpBlend) + clamp(ballPos.z * 0.35, -2.2, 2.2) * helpBlend;
        speed = distToMatchup > 2.6 ? 9.4 : 8.2;
        stanceActive = distToHandler < 4.8;
        helpTargetRole = distToMatchup > 2.6 ? "recover" : "matchup";
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
    isLaneCutOff,
    isBeatenTeammateHelp,
    helpTargetRole,
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

  // Automatic & Called Pick & Roll / Screen-and-Roll / Pick-and-Pop (keeps AI active with ball handler drives)
  const inFrontCourt = ballOwnerPos ? (ballOwnerPos.x - hoopX) * attackDir > -11.5 : false;
  const ballDistToHoop = ballOwnerPos ? Math.hypot(hoopX - ballOwnerPos.x, ballOwnerPos.z) : 99;
  const isCalledPnr =
    activePlayCall === OM.PICK_AND_ROLL ||
    activePlayCall === OM.SPAIN_PICK_AND_ROLL ||
    activePlayCall === OM.SLIP_SCREEN;

  if (slotIdx === 4 && ballOwnerPos && (isCalledPnr || (inFrontCourt && ballDistToHoop > 3.8))) {
    const rollCycle = (timeSec * 0.65) % 2.4;
    if (rollCycle < 0.95 && ballDistToHoop > 4.2) {
      // Set physical on-ball screen at ball-handler shoulder toward hoop
      return {
        x: clamp(ballOwnerPos.x + attackDir * 1.25, -13.2, 13.2),
        z: clamp(ballOwnerPos.z + (ballOwnerPos.z >= 0 ? -0.95 : 0.95), -6.5, 6.5),
        speed: 9.2,
        isCutting: true,
      };
    }
    if (rollCycle < 1.85) {
      // Hard dive/roll down the paint lane
      return {
        x: clamp(hoopX - attackDir * 2.0, -13.2, 13.2),
        z: ballOwnerPos.z >= 0 ? -1.1 : 1.1,
        speed: 10.6,
        isCutting: true,
      };
    }
    // Pop out to open 3-point trailer arc if roll isn't hit
    return {
      x: clamp(hoopX - attackDir * 7.1, -13.2, 13.2),
      z: ballOwnerPos.z >= 0 ? -4.8 : 4.8,
      speed: 9.0,
      isCutting: false,
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

  // Drive-and-Kick 3-Point Floor Fade: when ball handler drives inside the paint, wing teammates fade to open 3PT spots
  if (ballOwnerPos && ballDistToHoop < 4.5 && (slotIdx === 1 || slotIdx === 2 || slotIdx === 3)) {
    const threeSpotsZ = slotIdx === 1 ? -6.25 : slotIdx === 2 ? 6.25 : ballOwnerPos.z >= 0 ? -4.6 : 4.6;
    const threeDepth = slotIdx === 3 ? 6.95 : 2.35;
    return {
      x: clamp(hoopX - attackDir * threeDepth, -13.2, 13.2),
      z: clamp(threeSpotsZ, -6.65, 6.65),
      speed: 8.8,
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
