import type { DefenseMove, OffenseMove } from "./basketballMoves.ts";

export interface SpatialVec2 {
  x: number;
  z: number;
}

export interface TeammateDefenderInfo {
  idx: number;
  pos: SpatialVec2;
  vel?: SpatialVec2;
  role: string;
}

export interface DefenseAiInput {
  defenderIdx: number;
  defenderPos: SpatialVec2;
  defenderVel: SpatialVec2;
  defenderHeight: number;
  defenderRole: string;
  ourHoopX: number;
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
  helpTargetRole?: "matchup" | "primary_cutoff" | "help_rotate" | "rim_wall" | "recover";
  isBackcourtPress?: boolean;
  backcourtPressure?: number;
  backcourtRecoveryBurst?: boolean;
  activateCutoffClamp?: boolean;
  triggerGloveRip?: boolean;
  triggerVolleySwat?: boolean;
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
  return v < lo ? lo : v > hi ? hi : v;
}

function dist2d(a: SpatialVec2, b: SpatialVec2): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

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
  GLOVE_RIP_STRIP: "GLOVE_RIP_STRIP" as DefenseMove,
  HIP_RIDE: "HIP_RIDE" as DefenseMove,
  WALL_UP: "WALL_UP" as DefenseMove,
  SHOT_CONTEST: "SHOT_CONTEST" as DefenseMove,
  CHASE_DOWN_BLOCK: "CHASE_DOWN_BLOCK" as DefenseMove,
  VOLLEY_SWAT_BLOCK: "VOLLEY_SWAT_BLOCK" as DefenseMove,
  BASELINE_TRAP_CUTOFF: "BASELINE_TRAP_CUTOFF" as DefenseMove,
  DROP_COVERAGE: "DROP_COVERAGE" as DefenseMove,
  BLITZ_TRAP: "BLITZ_TRAP" as DefenseMove,
  DOUBLE_TEAM: "DOUBLE_TEAM" as DefenseMove,
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

export interface SteerObstacle {
  x: number;
  z: number;
  radius: number;
}

export interface SmoothSteerState {
  vx: number;
  vz: number;
  stuckT: number;
  lastProgressX: number;
  lastProgressZ: number;
  avoidSide?: number;
  avoidLockT?: number;
}

export interface SmoothSteerResult {
  vx: number;
  vz: number;
  state: SmoothSteerState;
}

/**
 * Velocity-based smooth critically-damped steering controller with stabilized shoulder-bypass
 * obstacle avoidance. Commits to a clear side around blocking players so characters glide
 * cleanly around each other without back-and-forth hesitation.
 */
export function stepSmoothSteering(params: {
  pos: SpatialVec2;
  vel: SpatialVec2;
  target: SpatialVec2;
  maxSpeed: number;
  dt: number;
  prevState?: SmoothSteerState | null;
  obstacles?: SteerObstacle[];
  bounds?: { minX: number; maxX: number; minZ: number; maxZ: number };
  arrivalRadius?: number;
  stopRadius?: number;
}): SmoothSteerResult {
  const {
    pos,
    vel,
    target,
    maxSpeed,
    dt,
    prevState,
    obstacles = [],
    bounds = { minX: -13.45, maxX: 13.45, minZ: -7.05, maxZ: 7.05 },
    arrivalRadius = 0.82,
    stopRadius = 0.08,
  } = params;

  const safeDt = clamp(Number.isFinite(dt) ? dt : 1 / 60, 0.001, 0.06);
  const tx = clamp(target.x, bounds.minX, bounds.maxX);
  const tz = clamp(target.z, bounds.minZ, bounds.maxZ);
  const dx = tx - pos.x;
  const dz = tz - pos.z;
  const dist = Math.hypot(dx, dz);

  const st: SmoothSteerState = prevState
    ? {
        vx: prevState.vx || 0,
        vz: prevState.vz || 0,
        stuckT: prevState.stuckT || 0,
        lastProgressX: prevState.lastProgressX ?? pos.x,
        lastProgressZ: prevState.lastProgressZ ?? pos.z,
        avoidSide: prevState.avoidSide || 0,
        avoidLockT: Math.max(0, (prevState.avoidLockT || 0) - safeDt),
      }
    : {
        vx: vel.x || 0,
        vz: vel.z || 0,
        stuckT: 0,
        lastProgressX: pos.x,
        lastProgressZ: pos.z,
        avoidSide: 0,
        avoidLockT: 0,
      };

  if (dist <= stopRadius) {
    const decay = Math.exp(-22 * safeDt);
    st.vx *= decay;
    st.vz *= decay;
    if (Math.hypot(st.vx, st.vz) < 0.08) {
      st.vx = 0;
      st.vz = 0;
    }
    st.stuckT = 0;
    st.avoidLockT = 0;
    return { vx: st.vx, vz: st.vz, state: st };
  }

  const dirX = dx / dist;
  const dirZ = dz / dist;

  // Obstacle avoidance (stanchions + teammates/opponents): steer smoothly around clear shoulder
  let avoidX = 0;
  let avoidZ = 0;
  let maxBlockStrength = 0;
  const lookAhead = clamp(maxSpeed * 0.34, 1.35, 3.2);
  for (const obs of obstacles) {
    const ox = obs.x - pos.x;
    const oz = obs.z - pos.z;
    const od = Math.hypot(ox, oz);
    const safeDist = obs.radius + 0.68;
    // Ignore obstacles further than target when already very close to target
    if (od < 0.001 || od > Math.min(lookAhead + obs.radius, dist + 0.75)) continue;
    const forwardDot = ox * dirX + oz * dirZ;
    if (forwardDot <= -0.1) continue; // Obstacle is behind us

    // Lateral miss distance relative to intended ray: perp = dot((ox, oz), (-dirZ, dirX))
    const perpSigned = ox * -dirZ + oz * dirX;
    if (Math.abs(perpSigned) < safeDist) {
      const clearanceRatio = (safeDist - Math.abs(perpSigned)) / safeDist;
      const distRatio = (lookAhead + obs.radius - od) / Math.max(0.45, lookAhead);
      const strength = clamp(clearanceRatio * distRatio * 1.25, 0, 1.65);
      maxBlockStrength = Math.max(maxBlockStrength, strength);

      // Stabilize bypass side so head-on encounters never flip left/right frame-to-frame
      let side: number;
      if (Math.abs(perpSigned) > 0.24 && (!st.avoidLockT || st.avoidLockT <= 0)) {
        side = perpSigned >= 0 ? -1 : 1;
        st.avoidSide = side;
        st.avoidLockT = 0.28;
      } else if (st.avoidSide && st.avoidSide !== 0 && st.avoidLockT && st.avoidLockT > 0) {
        side = st.avoidSide;
      } else {
        // Choose side that aligns with current lateral velocity and stays away from court sidelines
        const velLat = st.vx * -dirZ + st.vz * dirX;
        const candPosZ = pos.z + dirX * 1.2;
        const candNegZ = pos.z - dirX * 1.2;
        const boundaryBias = Math.abs(candPosZ) < Math.abs(candNegZ) ? 1 : -1;
        side = Math.abs(velLat) > 0.35 ? Math.sign(velLat) : boundaryBias;
        st.avoidSide = side;
        st.avoidLockT = 0.34;
      }

      // Blend strong tangential shoulder bypass + gentle radial push-out
      const invOd = 1 / od;
      avoidX += (-dirZ * side * 1.48 - ox * invOd * 0.52) * strength;
      avoidZ += (dirX * side * 1.48 - oz * invOd * 0.52) * strength;
    }
  }

  if (maxBlockStrength <= 0.05 && st.avoidLockT && st.avoidLockT <= 0) {
    st.avoidSide = 0;
  }

  // Soften forward drive proportionally when directly blocked so player arcs smoothly around shoulder
  const forwardScale = maxBlockStrength > 0.35 ? clamp(1 - (maxBlockStrength - 0.35) * 0.5, 0.42, 1) : 1;
  let steerX = dirX * forwardScale + avoidX;
  let steerZ = dirZ * forwardScale + avoidZ;
  const steerLen = Math.hypot(steerX, steerZ);
  if (steerLen > 1e-4) {
    steerX /= steerLen;
    steerZ /= steerLen;
  } else {
    steerX = dirX;
    steerZ = dirZ;
  }

  // Track if blocked/stuck despite large desired movement; commit to lateral escape arc earlier
  const movedFromLast = Math.hypot(pos.x - st.lastProgressX, pos.z - st.lastProgressZ);
  if (dist > 0.9 && movedFromLast < 0.07 * (safeDt / (1 / 60))) {
    st.stuckT += safeDt;
    if (st.stuckT > 0.16) {
      const escapeSide = st.avoidSide && st.avoidSide !== 0 ? st.avoidSide : (Math.round(tx + tz) & 1) === 0 ? 1 : -1;
      st.avoidSide = escapeSide;
      st.avoidLockT = 0.36;
      steerX = clamp(steerX - dirZ * escapeSide * 0.95, -1, 1);
      steerZ = clamp(steerZ + dirX * escapeSide * 0.95, -1, 1);
      const escLen = Math.hypot(steerX, steerZ);
      if (escLen > 1e-4) {
        steerX /= escLen;
        steerZ /= escLen;
      }
    }
  } else {
    st.stuckT = Math.max(0, st.stuckT - safeDt * 2.5);
  }
  st.lastProgressX = pos.x;
  st.lastProgressZ = pos.z;

  // Smooth arrival ramp prevents overshoot around target
  const arrivalFactor = dist < arrivalRadius ? dist / arrivalRadius : 1;
  const targetSpeed = maxSpeed * clamp(arrivalFactor, 0.03, 1);
  const desiredVx = steerX * targetSpeed;
  const desiredVz = steerZ * targetSpeed;

  // Acceleration-capped exponential velocity smoothing (no erratic derivative kick)
  const dampRate = dist < arrivalRadius ? 22.0 : 16.5;
  const blend = 1 - Math.exp(-dampRate * safeDt);
  const nextVx = st.vx + (desiredVx - st.vx) * blend;
  const nextVz = st.vz + (desiredVz - st.vz) * blend;
  st.vx = Number.isFinite(nextVx) ? nextVx : 0;
  st.vz = Number.isFinite(nextVz) ? nextVz : 0;

  return { vx: st.vx, vz: st.vz, state: st };
}

export type DefensiveTacticalRole =
  | "on_ball"
  | "deny_wing"
  | "paint_nail"
  | "weak_side_help"
  | "rim_anchor";

export interface DefensiveAssignmentPlayer {
  idx: number;
  pos: SpatialVec2;
  role: string;
  prevMatchupIdx?: number;
  isUser?: boolean;
  switchLockT?: number;
}

export interface DefensiveAssignmentOutput {
  matchupByDefenderIdx: Map<number, number>; // defender idx -> attacker idx
  roleByDefenderIdx: Map<number, DefensiveTacticalRole>;
  primaryDefenderIdx: number | null;
  switchedDefenderIdxs: number[];
}

const ROLE_GROUP: Record<string, number> = {
  PG: 0,
  SG: 1,
  SF: 2,
  PF: 3,
  C: 4,
};

/**
 * Bijectively assigns 5 active defenders to 5 active offensive players (no duplicate chasing).
 * Proactively runs defensive switches BEFORE screens/crosses/shuffled offenses break open,
 * resets stale matchups immediately on transition, and ensures the ball handler is always picked up.
 */
export function assignDefensiveMatchups(params: {
  defenders: DefensiveAssignmentPlayer[];
  attackers: DefensiveAssignmentPlayer[];
  ballOwnerIdx: number | null;
  ourHoopX: number;
  userGuardIdx?: number | null;
  isTransition?: boolean;
}): DefensiveAssignmentOutput {
  const {
    defenders,
    attackers,
    ballOwnerIdx,
    ourHoopX,
    userGuardIdx = null,
    isTransition = false,
  } = params;
  const matchupByDefenderIdx = new Map<number, number>();
  const roleByDefenderIdx = new Map<number, DefensiveTacticalRole>();
  const switchedDefenderIdxs: number[] = [];

  if (defenders.length === 0 || attackers.length === 0) {
    return { matchupByDefenderIdx, roleByDefenderIdx, primaryDefenderIdx: null, switchedDefenderIdxs };
  }

  const handler =
    ballOwnerIdx !== null ? attackers.find((a) => a.idx === ballOwnerIdx) ?? attackers[0] : attackers[0];
  const hoopPos: SpatialVec2 = { x: ourHoopX, z: 0 };
  const hoopSign = ourHoopX < 0 ? -1 : 1;

  // Detect screen / shuffled cross exchanges among attackers so defense switches cleanly ahead of offense
  const shuffledAttackerIdxs = new Set<number>();
  for (let i = 0; i < attackers.length; i++) {
    for (let j = i + 1; j < attackers.length; j++) {
      const a = attackers[i];
      const b = attackers[j];
      if (dist2d(a.pos, b.pos) < 2.45) {
        shuffledAttackerIdxs.add(a.idx);
        shuffledAttackerIdxs.add(b.idx);
      }
    }
  }
  const hasOnBallScreen = attackers.some((a) => a.idx !== handler.idx && dist2d(a.pos, handler.pos) < 2.6);

  // Step 1: Select ONE primary on-ball defender for `handler`
  // If handler is screened or user stepped off-ball, immediately switch the better-positioned defender onto the ball!
  let primaryDef = defenders[0];
  let bestPrimaryScore = Infinity;
  for (const def of defenders) {
    const d = dist2d(def.pos, handler.pos);
    const defBetweenHoop =
      (def.pos.x - ourHoopX) * (hoopSign < 0 ? 1 : -1) <= (handler.pos.x - ourHoopX) * (hoopSign < 0 ? 1 : -1) + 0.25;
    const hoopDistBonus = defBetweenHoop ? -0.65 : 0.75;
    const defToHoop = dist2d(def.pos, hoopPos);
    const handlerToHoop = dist2d(handler.pos, hoopPos);
    const rimSideBonus = defToHoop < handlerToHoop ? -0.35 : 0.35;

    // Drop sticky prevMatchup bonus during transition, on-ball screens, or if user defender wandered off-ball
    const allowPrevSticky =
      !isTransition &&
      !hasOnBallScreen &&
      !shuffledAttackerIdxs.has(handler.idx) &&
      !(def.isUser && d > 2.35);
    const prevBonus =
      def.switchLockT && def.switchLockT > 0 && def.prevMatchupIdx === handler.idx
        ? -2.8
        : allowPrevSticky && def.prevMatchupIdx === handler.idx
          ? -1.05
          : 0;
    const userOnBallBonus = userGuardIdx !== null && def.idx === userGuardIdx && d < 2.8 ? -1.4 : 0;
    const roleDiff = Math.abs((ROLE_GROUP[def.role] ?? 2) - (ROLE_GROUP[handler.role] ?? 2));
    const rolePenalty = isTransition || hasOnBallScreen ? roleDiff * 0.08 : roleDiff * 0.2;
    const score = d + hoopDistBonus + rimSideBonus + prevBonus + userOnBallBonus + rolePenalty;
    if (score < bestPrimaryScore) {
      bestPrimaryScore = score;
      primaryDef = def;
    }
  }

  matchupByDefenderIdx.set(primaryDef.idx, handler.idx);
  roleByDefenderIdx.set(primaryDef.idx, "on_ball");
  if (primaryDef.prevMatchupIdx !== undefined && primaryDef.prevMatchupIdx !== handler.idx) {
    switchedDefenderIdxs.push(primaryDef.idx);
  }

  // Step 2: Minimum-cost bijective matching for remaining defenders -> remaining attackers
  const remDefs = defenders.filter((d) => d.idx !== primaryDef.idx);
  const remAtts = attackers.filter((a) => a.idx !== handler.idx);

  if (remDefs.length > 0 && remAtts.length > 0) {
    const k = remDefs.length;
    const m = remAtts.length;
    const used = new Array<boolean>(m).fill(false);
    const curAssign = new Array<number>(k).fill(0);
    let bestCost = Infinity;
    let bestAssign = new Array<number>(k).fill(0);

    const pairCost = (def: DefensiveAssignmentPlayer, att: DefensiveAssignmentPlayer): number => {
      const d = dist2d(def.pos, att.pos);
      const isShuffledOrTransition = isTransition || shuffledAttackerIdxs.has(att.idx);
      const roleDiff = Math.abs((ROLE_GROUP[def.role] ?? 2) - (ROLE_GROUP[att.role] ?? 2));
      const rolePenalty = isShuffledOrTransition ? roleDiff * 0.14 : roleDiff * 0.42;
      let hysteresis = 0;
      if (def.switchLockT && def.switchLockT > 0 && def.prevMatchupIdx === att.idx) {
        hysteresis = -2.8;
      } else if (!isShuffledOrTransition && def.prevMatchupIdx === att.idx) {
        hysteresis = -1.05;
      }
      // Bonus for staying between the attacker and our basket
      const betweenBonus =
        dist2d(def.pos, hoopPos) <= dist2d(att.pos, hoopPos) + 0.35 ? -0.3 : 0.25;
      return d + rolePenalty + hysteresis + betweenBonus;
    };

    const dfs = (depth: number, accCost: number) => {
      if (accCost >= bestCost) return;
      if (depth === k) {
        bestCost = accCost;
        bestAssign = curAssign.slice();
        return;
      }
      if (depth >= m) {
        for (let j = 0; j < m; j++) {
          curAssign[depth] = j;
          dfs(depth + 1, accCost + pairCost(remDefs[depth], remAtts[j]) + 4.0);
        }
        return;
      }
      for (let j = 0; j < m; j++) {
        if (used[j]) continue;
        used[j] = true;
        curAssign[depth] = j;
        dfs(depth + 1, accCost + pairCost(remDefs[depth], remAtts[j]));
        used[j] = false;
      }
    };

    dfs(0, 0);
    for (let i = 0; i < k; i++) {
      const def = remDefs[i];
      const att = remAtts[bestAssign[i]];
      matchupByDefenderIdx.set(def.idx, att.idx);
      if (def.prevMatchupIdx !== undefined && def.prevMatchupIdx !== att.idx) {
        switchedDefenderIdxs.push(def.idx);
      }
    }
  }

  // Step 3: Assign coherent off-ball tactical roles to the 4 off-ball defenders
  const ballSideSign = handler.pos.z >= 0 ? 1 : -1;
  const offBallDefs = defenders.filter((d) => d.idx !== primaryDef.idx);
  let rimAnchorIdx: number | null = null;
  let bestRimScore = Infinity;
  for (const d of offBallDefs) {
    const isBig = d.role === "C" || d.role === "PF" || d.idx >= 3;
    const score = dist2d(d.pos, hoopPos) - (isBig ? 2.4 : 0);
    if (score < bestRimScore) {
      bestRimScore = score;
      rimAnchorIdx = d.idx;
    }
  }
  for (const d of offBallDefs) {
    if (d.idx === rimAnchorIdx) {
      roleByDefenderIdx.set(d.idx, "rim_anchor");
      continue;
    }
    const attIdx = matchupByDefenderIdx.get(d.idx);
    const att = attackers.find((a) => a.idx === attIdx);
    const attDistToBall = att ? dist2d(att.pos, handler.pos) : 6;
    const sameSide = att ? Math.sign(att.pos.z || 0.01) === ballSideSign : false;
    if (attDistToBall < 5.8 && sameSide) {
      roleByDefenderIdx.set(d.idx, "deny_wing");
    } else if (d.role === "PF" || d.role === "SF" || dist2d(d.pos, hoopPos) < 7.5) {
      roleByDefenderIdx.set(d.idx, "paint_nail");
    } else {
      roleByDefenderIdx.set(d.idx, "weak_side_help");
    }
  }

  return {
    matchupByDefenderIdx,
    roleByDefenderIdx,
    primaryDefenderIdx: primaryDef.idx,
    switchedDefenderIdxs,
  };
}

/**
 * Evaluates whether a defender intersects a pass segment cleanly.
 * Prevents the passer's own on-ball guard from auto-deflecting passes right out of the passer's hands.
 */
export function checkPassLaneInterception(params: {
  from: SpatialVec2;
  to: SpatialVec2;
  ballPos: { x: number; y: number; z: number };
  defenderPos: SpatialVec2;
  defenderHeight: number;
  laneReach: number;
  passLaneHunterActive: boolean;
  passLaneMode: "intercept" | "deflect";
  isUserDef: boolean;
  roll?: number; // deterministic 0..1 for testing, defaults to Math.random()
}): { hit: boolean; action: "intercept" | "deflect" | null } {
  const {
    from,
    to,
    ballPos,
    defenderPos,
    defenderHeight,
    laneReach,
    passLaneHunterActive,
    passLaneMode,
    isUserDef,
    roll = Math.random(),
  } = params;

  // Height reach ceiling
  if (ballPos.y > 2.65 + defenderHeight) {
    return { hit: false, action: null };
  }

  const passDx = to.x - from.x;
  const passDz = to.z - from.z;
  const passLenSq = passDx * passDx + passDz * passDz;
  const passLen = Math.sqrt(passLenSq);
  if (passLen < 0.75) return { hit: false, action: null };

  // Project defender & ball along the pass ray
  const defAlong = ((defenderPos.x - from.x) * passDx + (defenderPos.z - from.z) * passDz) / passLenSq;
  const ballAlong = ((ballPos.x - from.x) * passDx + (ballPos.z - from.z) * passDz) / passLenSq;

  // Never trigger steals right at the passer's hands or receiver's catch pocket unless directly in front of ray
  if (ballAlong < 0.16 || ballAlong > 0.88) {
    return { hit: false, action: null };
  }
  if (defAlong < 0.14 || defAlong > 0.9) {
    return { hit: false, action: null };
  }

  // Distance from ball to defender and perpendicular distance from defender to pass line
  const distToBall = Math.hypot(ballPos.x - defenderPos.x, ballPos.z - defenderPos.z);
  const closestX = from.x + passDx * defAlong;
  const closestZ = from.z + passDz * defAlong;
  const perpDist = Math.hypot(defenderPos.x - closestX, defenderPos.z - closestZ);

  if (distToBall > laneReach || perpDist > laneReach * 0.78) {
    return { hit: false, action: null };
  }

  // Defender is legitimately sitting in the passing lane
  if (passLaneHunterActive && passLaneMode === "intercept") {
    return { hit: true, action: "intercept" };
  }
  if (isUserDef) {
    return { hit: true, action: roll < 0.65 ? "intercept" : "deflect" };
  }
  if (perpDist < 0.72 || passLaneHunterActive || roll < 0.34) {
    return { hit: true, action: perpDist < 0.5 && roll < 0.35 ? "intercept" : "deflect" };
  }
  return { hit: false, action: null };
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
  if (quarter >= 4 && gameClock < 75 && scoreDiff <= -4) {
    return Math.floor(timeSec / 12) % 2 === 0
      ? DM.FULL_COURT_PRESS
      : DM.BLITZ_TRAP;
  }
  if (quarter >= 4 && gameClock < 60 && scoreDiff >= 6) {
    return DM.ZONE_2_3;
  }
  const phase = Math.floor(timeSec / 22) % 4;
  if (phase === 1) return DM.ZONE_2_3;
  if (phase === 2) return DM.DROP_COVERAGE;
  if (phase === 3) return DM.ICE_BLUE;
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
  let isBackcourtPress = false;
  let backcourtPressure = 0;
  let backcourtRecoveryBurst = false;
  let activateCutoffClamp = false;
  let triggerGloveRip = false;
  let triggerVolleySwat = false;

  const shadingSide =
    Math.abs(lane.driveLateralSpeed) > 0.65
      ? Math.sign(lane.driveLateralSpeed)
      : handlerPos.z >= 0
        ? 1
        : -1;

  // 1. SHOT IN FLIGHT -> AGGRESSIVE SHOT CONTEST / VOLLEY SWAT / WALL-UP / CHASE-DOWN / BOX OUT & WEDGE CRASH
  if (shotInFlight) {
    if (isOnBall || isNearestToBallHandler || distToHandler < 3.6 || defenderToHoopDist < 3.2) {
      const shooterBehindDef =
        (handlerPos.x - hoop.x) * defendHalfDir < (defenderPos.x - hoop.x) * defendHalfDir;
      if (shooterBehindDef && distToHandler < 3.8) {
        move = DM.CHASE_DOWN_BLOCK;
        speed = 12.4;
      } else if (defenderToHoopDist < 3.4) {
        move = DM.WALL_UP;
        activateWallUp = true;
        speed = 10.6;
      } else if (defenderToHoopDist < 8.4 && distToHandler < 3.2) {
        move = DM.VOLLEY_SWAT_BLOCK;
        triggerVolleySwat = true;
        activateWallUp = true;
        speed = 11.4;
      } else {
        move = DM.SHOT_CONTEST;
        speed = 11.2;
      }
      targetX = handlerPos.x + (hoop.x - handlerPos.x) * 0.22;
      targetZ = handlerPos.z * 0.88;
      activateContest = true;
      contestLevel = 2;
      // Never gate shot-contest/block jumping behind swipe cooldown! Jump immediately if near shooter/rim.
      if (defenderHeight <= 0.06 && (distToHandler < 3.35 || defenderToHoopDist < 2.8)) {
        triggerJump = true;
        jumpVel = move === DM.VOLLEY_SWAT_BLOCK ? 5.65 : move === DM.CHASE_DOWN_BLOCK ? 5.25 : 4.95;
      }
    } else {
      move = defenderIdx % 3 === 0 ? DM.WEDGE_CRASH : DM.BOX_OUT;
      activateBoxOut = true;
      const toMatchupX = matchupPos.x - hoop.x;
      const toMatchupZ = matchupPos.z - hoop.z;
      const len = Math.max(0.5, Math.hypot(toMatchupX, toMatchupZ));
      const boxDist = Math.max(1.3, Math.min(4.6, len - 0.9));
      targetX = hoop.x + (toMatchupX / len) * boxDist;
      targetZ = hoop.z + (toMatchupZ / len) * boxDist;
      speed = 10.2;
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
      triggerVolleySwat,
    };
  }

  // 2. PASS IN FLIGHT -> JUMP PASSING LANE / DEFLECTION / X-OUT CLOSEOUT (only nearest off-ball defender to ball or close matchup)
  if (passInFlight && !isOnBall) {
    const distBall = dist2d(defenderPos, ballPos);
    if (distBall < 4.5 || distToMatchup > 3.2) {
      move = distToMatchup > 3.0 ? DM.X_OUT_ROTATION : DM.JUMP_PASSING_LANE;
      activatePassLane = distBall < 3.8;
      passLaneMode = distBall < 2.9 ? "intercept" : "deflect";
      targetX = distBall < 3.4 ? (ballPos.x + matchupPos.x) * 0.5 : matchupPos.x + (hoop.x - matchupPos.x) * 0.25;
      targetZ = distBall < 3.4 ? (ballPos.z + matchupPos.z) * 0.5 : matchupPos.z * 0.88;
      speed = 10.4;
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
  }

  // 3. TRANSITION RECOVERY (Sprint back to paint/matchup side when caught behind the ball)
  const handlerCloserToHoop =
    (handlerPos.x - hoop.x) * defendHalfDir + 0.65 < (defenderPos.x - hoop.x) * defendHalfDir;
  if (handlerCloserToHoop && handlerToHoopDist < 14.5) {
    move = isOnBall ? DM.SPRINT_TO_SLIDE : DM.HELP_AND_RECOVER;
    if (isOnBall) {
      targetX = hoop.x + defendHalfDir * Math.max(1.8, handlerToHoopDist * 0.48);
      targetZ = clamp(handlerPos.z * 0.72, -4.8, 4.8);
    } else {
      // Off-ball defenders sprint back to between their own assignment and basket (not all chasing ball!)
      targetX = hoop.x + defendHalfDir * clamp(dist2d(matchupPos, hoop) * 0.52, 2.0, 9.5);
      targetZ = clamp(matchupPos.z * 0.72, -5.4, 5.4);
    }
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

  // 3B. DEFENSIVE BACKCOURT MECHANICS (94ft Press, Sideline Funneling, Cutoff Clamp & Recovery)
  const isHandlerInBackcourt = handlerPos.x * defendHalfDir > 0.45;
  if (
    isHandlerInBackcourt &&
    (isOnBall || isNearestToBallHandler) &&
    (scheme === DM.FULL_COURT_PRESS || defenseTactic === "press" || distToHandler < 6.5)
  ) {
    isBackcourtPress = true;
    const ownerSpeed = lane.ownerSpeed;
    const sidelineSign = Math.abs(handlerPos.z) > 1.2 ? Math.sign(handlerPos.z) : shadingSide;
    const defBetween =
      (defenderPos.x - hoop.x) * defendHalfDir <= (handlerPos.x - hoop.x) * defendHalfDir + 0.25;
    const aimX = ownerSpeed > 1.0 ? lane.projectedHandlerX : handlerPos.x;
    const aimZ = ownerSpeed > 1.0 ? lane.projectedHandlerZ : handlerPos.z;

    if (!defBetween && ownerSpeed > 2.2) {
      move = DM.SPRINT_TO_SLIDE;
      backcourtRecoveryBurst = true;
      targetX = aimX - defendHalfDir * 1.45;
      targetZ = aimZ * 0.82;
      speed = clamp(12.2 + ownerSpeed * 0.18, 12.2, 13.4);
      stanceActive = false;
    } else if (distToHandler < 1.55 && cooldownReady && (ownerSpeed < 4.2 || Math.abs(handlerPos.z) > 3.6)) {
      move = DM.GLOVE_RIP_STRIP;
      triggerGloveRip = true;
      triggerPoke = true;
      activateCutoffClamp = true;
      targetX = aimX - defendHalfDir * 0.95;
      targetZ = aimZ - sidelineSign * 0.25;
      speed = 10.6;
      stanceActive = true;
      backcourtPressure = 0.95;
    } else {
      move = DM.BASELINE_TRAP_CUTOFF;
      activateCutoffClamp = true;
      activateHandCheck = true;
      targetX = aimX - defendHalfDir * 1.15;
      targetZ = aimZ - sidelineSign * 0.48;
      speed = clamp(10.0 + ownerSpeed * 0.22, 10.0, 12.4);
      stanceActive = true;
      isLaneCutOff = true;
      helpTargetRole = "primary_cutoff";
      backcourtPressure = clamp(1 - (distToHandler - 1.0) / 3.0, 0.25, 0.92);
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
      isBackcourtPress,
      backcourtPressure,
      backcourtRecoveryBurst,
      activateCutoffClamp,
      triggerGloveRip,
      triggerVolleySwat,
    };
  }

  // 4. ON-BALL INTELLIGENT DEFENSIVE STANCE & DRIVING LANE CUTOFF
  if (isOnBall || isNearestToBallHandler) {
    const ownerSpeed = lane.ownerSpeed;
    const aimHandlerX = ownerSpeed > 1.2 ? lane.projectedHandlerX : handlerPos.x;
    const aimHandlerZ = ownerSpeed > 1.2 ? lane.projectedHandlerZ : handlerPos.z;
    const dx = hoop.x - aimHandlerX;
    const dz = hoop.z - aimHandlerZ;
    const len = Math.max(0.6, Math.hypot(dx, dz));
    const dirX = dx / len;
    const dirZ = dz / len;
    const latX = -dirZ;
    const latZ = dirX;

    const defBetween =
      (defenderPos.x - hoop.x) * defendHalfDir <= (handlerPos.x - hoop.x) * defendHalfDir + 0.35;

    if (distToHandler > 3.2) {
      move = DM.CLOSEOUT;
      targetX = aimHandlerX + dirX * 1.08;
      targetZ = aimHandlerZ + dirZ * 1.08;
      speed = 11.8;
      stanceActive = distToHandler < 4.5;
      activateContest = true;
      contestLevel = 1;
      isLaneCutOff = true;
      helpTargetRole = "primary_cutoff";
    } else if (!defBetween && ownerSpeed > 2.4) {
      move = DM.DROP_STEP_SWING;
      targetX = aimHandlerX + dirX * 1.38;
      targetZ = aimHandlerZ + dirZ * 1.38;
      speed = clamp(11.6 + ownerSpeed * 0.22, 11.6, 13.0);
      stanceActive = true;
      isLaneCutOff = true;
      helpTargetRole = "primary_cutoff";
    } else if (handlerToHoopDist < 3.8 && distToHandler < 2.3) {
      move = DM.WALL_UP;
      targetX = aimHandlerX + dirX * 0.98;
      targetZ = aimHandlerZ + dirZ * 0.98;
      speed = 10.2;
      stanceActive = true;
      activateWallUp = true;
      activateContest = true;
      contestLevel = 2;
      isLaneCutOff = true;
      helpTargetRole = "rim_wall";
      if (cooldownReady && ownerSpeed > 3.6 && defenderHeight <= 0.05) {
        triggerJump = true;
        jumpVel = 4.6;
      }
    } else if (ownerSpeed > 2.8 && distToHandler < 2.4) {
      const lateralLead = clamp(lane.driveLateralSpeed * 0.18, -0.58, 0.58);
      move = Math.abs(handlerPos.z) > 4.2 ? DM.BASELINE_TRAP_CUTOFF : cooldownReady ? DM.HIP_RIDE : DM.DEFENSIVE_SLIDE;
      targetX = aimHandlerX + dirX * 1.05 + latX * (shadingSide * 0.2 + lateralLead);
      targetZ = aimHandlerZ + dirZ * 1.05 + latZ * (shadingSide * 0.2 + lateralLead);
      speed = clamp(10.2 + ownerSpeed * 0.2, 10.2, 12.2);
      stanceActive = true;
      activateHipRide = true;
      activateHandCheck = true;
      activateContest = handlerToHoopDist < 9.5;
      contestLevel = handlerToHoopDist < 8.5 ? 1 : 0;
      activateCutoffClamp = move === DM.BASELINE_TRAP_CUTOFF;
      isLaneCutOff = true;
      helpTargetRole = "primary_cutoff";
    } else {
      // Zero artificial stationary sine-wave oscillation! Hold tight lockdown squared defensive stance.
      const gap = defenseTactic === "conservative" ? 1.55 : defenseTactic === "press" ? 0.96 : 1.12;
      const lateralLead = clamp(lane.driveLateralSpeed * 0.16, -0.48, 0.48);
      targetX = aimHandlerX + dirX * gap + latX * (shadingSide * 0.16 + lateralLead);
      targetZ = aimHandlerZ + dirZ * gap + latZ * (shadingSide * 0.16 + lateralLead);
      speed = ownerSpeed > 1.8 ? 10.2 : 9.2;
      stanceActive = true;
      activateContest = distToHandler < 2.35 && handlerToHoopDist < 9.5;
      contestLevel = distToHandler < 1.85 ? 2 : activateContest ? 1 : 0;
      isLaneCutOff = ownerSpeed > 1.0;
      helpTargetRole = "primary_cutoff";
      if (cooldownReady && distToHandler < 1.65 && ownerSpeed < 4.5) {
        move = defenseTactic === "press" ? DM.GLOVE_RIP_STRIP : DM.POKE_STEAL;
        triggerPoke = true;
        triggerGloveRip = move === DM.GLOVE_RIP_STRIP;
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

    if (lane.shouldHelpRotate) {
      const nearRimThreat = handlerToHoopDist < 4.8 || dist2d({ x: lane.interceptX, z: lane.interceptZ }, hoop) < 3.1;
      move = nearRimThreat ? DM.WEAK_SIDE_RIM_PROTECTION : DM.HELP_AND_RECOVER;
      targetX = lane.interceptX;
      targetZ = lane.interceptZ;
      speed = clamp(11.0 + lane.ownerSpeed * 0.24 + lane.helpUrgency * 1.0, 10.8, 12.8);
      stanceActive = true;
      isLaneCutOff = true;
      isBeatenTeammateHelp = true;
      helpTargetRole = nearRimThreat ? "rim_wall" : "help_rotate";
      activateWallUp = handlerToHoopDist < 4.9;
      activateContest = handlerToHoopDist < 4.6;
      contestLevel = handlerToHoopDist < 4.2 ? 2 : handlerToHoopDist < 4.8 ? 1 : 0;
      if (cooldownReady && nearRimThreat && distToHandler < 2.6 && defenderHeight <= 0.05 && lane.ownerSpeed > 3.8) {
        triggerJump = true;
        jumpVel = 4.6;
      }
    } else if (scheme === DM.FULL_COURT_PRESS || defenseTactic === "press") {
      move = distToMatchup < 2.5 ? DM.FULL_DENIAL : DM.BALL_YOU_MAN;
      const toBallX = ballPos.x - matchupPos.x;
      const toBallZ = ballPos.z - matchupPos.z;
      const l = Math.max(0.8, Math.hypot(toBallX, toBallZ));
      targetX = matchupPos.x + (toBallX / l) * 0.95 + hoopSign * 0.45;
      targetZ = matchupPos.z + (toBallZ / l) * 0.95;
      speed = 10.4;
      activatePassLane = true;
      passLaneMode = "intercept";
      stanceActive = distToMatchup < 3.2;
    } else if (scheme === DM.ZONE_2_3 || defenseTactic === "zone") {
      const inMyZone = distToHandler < 4.4 && (isBig ? handlerToHoopDist < 5.6 : true);
      if (inMyZone) {
        move = DM.CLOSEOUT;
        targetX = handlerPos.x + (hoop.x - handlerPos.x) * 0.22;
        targetZ = handlerPos.z * 0.9;
        speed = 10.4;
        stanceActive = true;
        activateContest = true;
        contestLevel = distToHandler < 2.5 ? 2 : 1;
      } else {
        move = isBig ? DM.WEAK_SIDE_RIM_PROTECTION : DM.GAP_HELP;
        const baseDepth = defenderIdx < 2 ? 4.4 : 1.95;
        const spreadZ =
          defenderIdx === 0 ? -2.5 : defenderIdx === 1 ? 2.5 : (defenderIdx - 3) * 2.8;
        targetX = hoop.x + defendHalfDir * baseDepth + ballShiftX * 0.55;
        targetZ = spreadZ + ballShiftZ * 0.72;
        speed = 9.2;
        stanceActive = distToHandler < 4.8;
      }
    } else if (scheme === DM.ZONE_3_2) {
      const inMyZone = distToHandler < 4.4;
      if (inMyZone) {
        move = DM.CLOSEOUT;
        targetX = handlerPos.x + (hoop.x - handlerPos.x) * 0.22;
        targetZ = handlerPos.z * 0.9;
        speed = 10.4;
        stanceActive = true;
        activateContest = true;
        contestLevel = distToHandler < 2.5 ? 2 : 1;
      } else {
        move = defenderIdx < 3 ? DM.GAP_HELP : DM.WEAK_SIDE_RIM_PROTECTION;
        const baseDepth = defenderIdx < 3 ? 5.2 : 2.1;
        const spreadZ =
          defenderIdx < 3 ? (defenderIdx - 1) * 3.1 : defenderIdx === 3 ? -2.3 : 2.3;
        targetX = hoop.x + defendHalfDir * baseDepth + ballShiftX * 0.6;
        targetZ = spreadZ + ballShiftZ * 0.7;
        speed = 9.2;
        stanceActive = true;
      }
    } else if ((scheme === DM.BLITZ_TRAP || scheme === DM.DOUBLE_TEAM) && defenderIdx === 1) {
      move = DM.STUNT_DIG;
      targetX = lane.projectedHandlerX + defendHalfDir * 0.95;
      targetZ = lane.projectedHandlerZ + (handlerPos.z >= 0 ? -0.9 : 0.9);
      speed = 11.2;
      stanceActive = true;
      isLaneCutOff = true;
      triggerStunt = cooldownReady && distToHandler < 2.3;
    } else if (scheme === DM.DROP_COVERAGE && isBig) {
      move = DM.DROP_COVERAGE;
      targetX = hoop.x + defendHalfDir * 2.45;
      targetZ = clamp(lane.projectedHandlerZ * 0.42, -2.1, 2.1);
      speed = 9.4;
      stanceActive = true;
      activateWallUp = handlerToHoopDist < 4.6;
    } else {
      // Man-to-Man / Ice Blue: Ball-You-Man positioning, Gap Help, Post Fronting & Rim Anchor
      const matchupToHoopDist = dist2d(matchupPos, hoop);
      const matchupToBallDist = dist2d(matchupPos, handlerPos);
      const laneDx = hoop.x - matchupPos.x;
      const laneDz = hoop.z - matchupPos.z;
      const laneLen = Math.max(0.6, Math.hypot(laneDx, laneDz));

      const mildDriveShrink =
        handlerToHoopDist < 6.4 &&
        lane.ownerSpeed > 2.8 &&
        lane.driveForwardSpeed > 0.6 &&
        distToHandler < 4.8;

      if (mildDriveShrink) {
        move = DM.GAP_HELP;
        targetX = matchupPos.x * 0.62 + lane.interceptX * 0.38;
        targetZ = matchupPos.z * 0.62 + lane.interceptZ * 0.38;
        speed = 10.2;
        stanceActive = true;
        isLaneCutOff = true;
        helpTargetRole = "recover";
      } else if (matchupToHoopDist < 4.3 && isBig) {
        move = DM.THREE_QUARTER_FRONT;
        targetX = matchupPos.x + (laneDx / laneLen) * 0.98;
        targetZ = matchupPos.z + (laneDz / laneLen) * 0.98 + (ballPos.z - matchupPos.z) * 0.16;
        speed = 9.4;
        stanceActive = true;
      } else if (matchupToBallDist < 5.6) {
        if (cooldownReady && distToHandler < 2.8 && lane.ownerSpeed > 2.4 && lane.driveForwardSpeed > 0.6) {
          move = DM.STUNT_DIG;
          targetX = matchupPos.x * 0.72 + handlerPos.x * 0.28;
          targetZ = matchupPos.z * 0.72 + handlerPos.z * 0.28;
          triggerStunt = true;
        } else {
          move = DM.THREE_QUARTER_DENIAL;
          targetX = matchupPos.x + (laneDx / laneLen) * 1.05 + (ballPos.x - matchupPos.x) * 0.18;
          targetZ = matchupPos.z + (laneDz / laneLen) * 1.05 + (ballPos.z - matchupPos.z) * 0.18;
          activatePassLane = distToMatchup < 2.5;
          passLaneMode = "deflect";
        }
        speed = 9.8;
        stanceActive = true;
      } else {
        // Weak-side Ball-You-Man / Help I & Rim Anchor protection
        move = isBig ? DM.WEAK_SIDE_RIM_PROTECTION : DM.BALL_YOU_MAN;
        const helpBlend = handlerToHoopDist < 5.5 ? 0.42 : 0.26;
        targetX = matchupPos.x * (1 - helpBlend) + (hoop.x + defendHalfDir * 2.5) * helpBlend;
        targetZ = matchupPos.z * (1 - helpBlend) + clamp(ballPos.z * 0.3, -2.0, 2.0) * helpBlend;
        speed = distToMatchup > 2.6 ? 10.4 : 9.2;
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
    isBackcourtPress,
    backcourtPressure,
    backcourtRecoveryBurst,
    activateCutoffClamp,
    triggerGloveRip,
    triggerVolleySwat,
  };
}

/**
 * Resolves 5-role offensive off-ball spacing, cutting, Pick-and-Roll screens,
 * drive-and-kick fades, rebound crashing, and fast-break lanes without aimless jitter.
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
  playerRole?: string;
  teammatePositions?: SpatialVec2[];
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
    playerRole,
    teammatePositions = [],
  } = params;

  const attackDir = targetHoopX > 0 ? 1 : -1;
  const hoopX = targetHoopX;
  const role = (playerRole || ["PG", "SG", "SF", "PF", "C"][slotIdx % 5]).toUpperCase();
  const ballSideSign = ballOwnerPos && Math.abs(ballOwnerPos.z) > 0.35 ? Math.sign(ballOwnerPos.z) : 1;

  const separateFromMates = (tx: number, tz: number, isScreening = false): { x: number; z: number } => {
    let rx = tx;
    let rz = tz;
    if (ballOwnerPos && !isScreening) {
      const dx = rx - ballOwnerPos.x;
      const dz = rz - ballOwnerPos.z;
      const d = Math.hypot(dx, dz);
      if (d < 3.2) {
        const pushZ = Math.abs(dz) > 0.2 ? Math.sign(dz) : ballSideSign > 0 ? -1 : 1;
        rz = clamp(rz + pushZ * (3.35 - d), -6.55, 6.55);
        rx = clamp(rx - attackDir * 0.9, -13.1, 13.1);
      }
    }
    for (const mate of teammatePositions) {
      const dx = rx - mate.x;
      const dz = rz - mate.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.05 && d < 2.2) {
        const push = (2.3 - d) / d;
        rx = clamp(rx + dx * push * 0.5, -13.1, 13.1);
        rz = clamp(rz + dz * push * 0.5, -6.55, 6.55);
      }
    }
    return { x: clamp(rx, -13.2, 13.2), z: clamp(rz, -6.7, 6.7) };
  };

  // 1. SHOT IN FLIGHT -> PF & C crash offensive glass; perimeter balances transition safety
  if (shotInFlight) {
    if (role === "PF" || role === "C" || slotIdx >= 3) {
      return {
        x: clamp(hoopX - attackDir * (role === "C" ? 1.85 : 2.35), -13.2, 13.2),
        z: role === "C" || slotIdx === 4 ? -1.55 : 1.55,
        speed: 10.8,
        isCutting: true,
      };
    }
    if (role === "PG") {
      return {
        x: clamp(hoopX - attackDir * 7.8, -13.2, 13.2),
        z: 0,
        speed: 8.6,
        isCutting: false,
      };
    }
    return {
      x: clamp(hoopX - attackDir * 5.6, -13.2, 13.2),
      z: role === "SG" ? 4.4 : -4.4,
      speed: 8.4,
      isCutting: false,
    };
  }

  // 2. FAST BREAK -> Crisp 5-lane transition (rim runners, wide wings, safety trailer)
  if (isFastBreak || activePlayCall === OM.FAST_BREAK || offenseTactic === "fast_break") {
    const lanePos: Record<string, [number, number]> = {
      PG: [5.4, 0],
      SG: [2.9, -5.85],
      SF: [2.9, 5.85],
      PF: [3.2, -2.3],
      C: [1.95, 1.85],
    };
    const [distHoop, zSpot] = lanePos[role] || [4.0, (slotIdx - 2) * 2.5];
    const sep = separateFromMates(hoopX - attackDir * distHoop, zSpot);
    return { x: sep.x, z: sep.z, speed: 12.4, isCutting: true };
  }

  // 3. PICK & ROLL / SCREEN ACTION -> C (or slot 4) sets screen toward hoop shoulder, then dives or pops
  const inFrontCourt = ballOwnerPos ? (ballOwnerPos.x - hoopX) * attackDir > -11.5 : false;
  const ballDistToHoop = ballOwnerPos ? Math.hypot(hoopX - ballOwnerPos.x, ballOwnerPos.z) : 99;
  const isCalledPnr =
    activePlayCall === OM.PICK_AND_ROLL ||
    activePlayCall === OM.SPAIN_PICK_AND_ROLL ||
    activePlayCall === OM.SLIP_SCREEN;
  const isCalledPop = activePlayCall === OM.PICK_AND_POP || activePlayCall === OM.GHOST_SCREEN;

  if ((role === "C" || slotIdx === 4) && ballOwnerPos && (isCalledPop || isCalledPnr || (inFrontCourt && ballDistToHoop > 4.4))) {
    if (isCalledPop) {
      const pop = separateFromMates(hoopX - attackDir * 7.2, ballSideSign > 0 ? -5.0 : 5.0);
      return { x: pop.x, z: pop.z, speed: 9.0, isCutting: false };
    }
    const pnrCycle = timeSec % 4.2;
    if (pnrCycle < 1.35) {
      // Set physical screen on ball-handler's hip toward the middle
      const screenX = clamp(ballOwnerPos.x + attackDir * 1.15, -13.1, 13.1);
      const screenZ = clamp(ballOwnerPos.z + (ballOwnerPos.z >= 0 ? -0.95 : 0.95), -6.4, 6.4);
      return { x: screenX, z: screenZ, speed: 9.4, isCutting: true };
    }
    if (pnrCycle < 2.85) {
      // Roll hard down the paint lane opposite ball handler's lateral side
      const roll = separateFromMates(hoopX - attackDir * 2.05, ballSideSign > 0 ? -1.35 : 1.35);
      return { x: roll.x, z: roll.z, speed: 10.6, isCutting: true };
    }
    // Establish deep dunker-spot seal / short-roll pocket
    const dunker = separateFromMates(hoopX - attackDir * 2.5, ballSideSign > 0 ? -2.8 : 2.8);
    return { x: dunker.x, z: dunker.z, speed: 8.6, isCutting: false };
  }

  // 4. DRIVE-AND-KICK SPACING -> When handler penetrates inside 4.7m, perimeter flares to open 3PT windows
  if (ballOwnerPos && ballDistToHoop < 4.7 && (role === "PG" || role === "SG" || role === "SF" || role === "PF")) {
    const spotMap: Record<string, [number, number]> = {
      PG: [7.6, 0],
      SG: [2.4, ballSideSign > 0 ? -6.35 : 6.35],
      SF: [5.9, ballSideSign > 0 ? -5.1 : 5.1],
      PF: [6.8, ballSideSign > 0 ? 4.4 : -4.4],
    };
    const [depth, zTarget] = spotMap[role] || [6.2, 5.2];
    const sep = separateFromMates(hoopX - attackDir * depth, zTarget);
    return { x: sep.x, z: sep.z, speed: 9.0, isCutting: false };
  }

  // 5. HALF-COURT ROLE-BASED MOTION OFFENSE (Smooth intentional basketball relocations, zero jitter)
  const relocWave = Math.sin(timeSec * 0.68 + slotIdx * 1.3); // smooth slow perimeter read
  if (role === "PG") {
    // Safety outlet & swing reversal above top of arc
    const zShift = -ballSideSign * 1.45 + relocWave * 0.65;
    const sep = separateFromMates(hoopX - attackDir * 7.6, zShift);
    return { x: sep.x, z: sep.z, speed: 8.0, isCutting: false };
  }

  if (role === "SG") {
    // Wing / Corner perimeter V-cut & flare relocation along 3-point arc
    const wingPhase = 0.5 - 0.5 * Math.cos(timeSec * 0.72); // smooth 0 -> 1 -> 0 over ~4.4s
    const depth = 2.6 + wingPhase * 3.4; // corner (2.6m) <-> wing (6.0m)
    const side = ballSideSign > 0 ? 1 : -1;
    const zPos = side * (6.25 - wingPhase * 0.65);
    const sep = separateFromMates(hoopX - attackDir * depth, zPos);
    return { x: sep.x, z: sep.z, speed: 8.2, isCutting: false };
  }

  if (role === "SF") {
    // Weak-side wing slasher with periodic crisp backdoor cut every ~7.5s
    const cutWindow = (timeSec + 2.5) % 7.5;
    if (cutWindow < 1.35) {
      const cutSpot = separateFromMates(hoopX - attackDir * 2.15, -ballSideSign * 1.35);
      return { x: cutSpot.x, z: cutSpot.z, speed: 10.4, isCutting: true };
    }
    const zSide = -ballSideSign * 5.75;
    const xDepth = 5.4 + relocWave * 0.85;
    const sep = separateFromMates(hoopX - attackDir * xDepth, zSide);
    return { x: sep.x, z: sep.z, speed: 8.2, isCutting: false };
  }

  if (role === "PF") {
    // High-post / elbow flash in paint_power or opposite corner/slot spacer
    if (offenseTactic === "paint_power") {
      const cutWindow = (timeSec + 4.8) % 8.0;
      const isSeal = cutWindow < 1.8;
      const pDepth = isSeal ? 2.6 : 4.6;
      const pZ = isSeal ? ballSideSign * 2.2 : -ballSideSign * 2.4;
      const sep = separateFromMates(hoopX - attackDir * pDepth, pZ);
      return { x: sep.x, z: sep.z, speed: isSeal ? 9.2 : 8.0, isCutting: isSeal };
    }
    const sep = separateFromMates(hoopX - attackDir * (2.9 + relocWave * 0.7), -ballSideSign * 6.05);
    return { x: sep.x, z: sep.z, speed: 8.0, isCutting: false };
  }

  // C fallback (when ball is already inside 4.4m): opposite dunker-spot seal / lob threat
  const dunker = separateFromMates(hoopX - attackDir * 2.25, -ballSideSign * 2.35);
  return { x: dunker.x, z: dunker.z, speed: 8.4, isCutting: false };
}
