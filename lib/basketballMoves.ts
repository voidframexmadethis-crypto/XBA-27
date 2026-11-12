export enum OffenseMove {
  // Dribbling
  CROSSOVER = "CROSSOVER",
  KILLER_CROSSOVER = "KILLER_CROSSOVER",
  BEHIND_THE_BACK = "BEHIND_THE_BACK",
  BETWEEN_THE_LEGS = "BETWEEN_THE_LEGS",
  HESITATION = "HESITATION",
  SPIN_MOVE = "SPIN_MOVE",
  STEPBACK_DRIBBLE = "STEPBACK_DRIBBLE",
  RETREAT_DRIBBLE = "RETREAT_DRIBBLE",
  SNATCH_DRIBBLE = "SNATCH_DRIBBLE",
  PUNCH_DRIBBLE = "PUNCH_DRIBBLE",
  SHAMMGOD = "SHAMMGOD",
  PROTECT_DRIBBLE = "PROTECT_DRIBBLE",

  // Footwork and post
  DROP_STEP = "DROP_STEP",
  UP_AND_UNDER = "UP_AND_UNDER",
  JAB_STEP = "JAB_STEP",
  PIVOT = "PIVOT",
  EURO_STEP = "EURO_STEP",
  HOP_STEP = "HOP_STEP",
  JUMP_STOP = "JUMP_STOP",
  BALL_FAKE = "BALL_FAKE",
  SHOULDER_FAKE = "SHOULDER_FAKE",
  PUMP_FAKE = "PUMP_FAKE",
  BASELINE_SPIN = "BASELINE_SPIN",

  // Shooting
  JUMP_SHOT = "JUMP_SHOT",
  PULL_UP_JUMPER = "PULL_UP_JUMPER",
  CATCH_AND_SHOOT = "CATCH_AND_SHOOT",
  STEPBACK_THREE = "STEPBACK_THREE",
  FADEAWAY = "FADEAWAY",
  FLOATER = "FLOATER",
  HOOK_SHOT = "HOOK_SHOT",
  SKY_HOOK = "SKY_HOOK",
  BANK_SHOT = "BANK_SHOT",
  RUNNER = "RUNNER",
  TEAR_DROP = "TEAR_DROP",
  FREE_THROW = "FREE_THROW",

  // Finishing
  LAYUP = "LAYUP",
  REVERSE_LAYUP = "REVERSE_LAYUP",
  EURO_LAYUP = "EURO_LAYUP",
  DUNK = "DUNK",
  ALLEY_OOP = "ALLEY_OOP",
  TIP_IN = "TIP_IN",
  PUT_BACK = "PUT_BACK",
  TIP_OUT = "TIP_OUT",

  // Passing
  CHEST_PASS = "CHEST_PASS",
  BOUNCE_PASS = "BOUNCE_PASS",
  OVERHEAD_PASS = "OVERHEAD_PASS",
  BEHIND_BACK_PASS = "BEHIND_BACK_PASS",
  NO_LOOK_PASS = "NO_LOOK_PASS",
  OUTLET_PASS = "OUTLET_PASS",
  SKIP_PASS = "SKIP_PASS",
  LOB_PASS = "LOB_PASS",
  WRAPAROUND_PASS = "WRAPAROUND_PASS",
  HOCKEY_ASSIST = "HOCKEY_ASSIST",

  // Screens and actions
  PICK_AND_ROLL = "PICK_AND_ROLL",
  PICK_AND_POP = "PICK_AND_POP",
  PIN_DOWN = "PIN_DOWN",
  FLARE_SCREEN = "FLARE_SCREEN",
  BACK_SCREEN = "BACK_SCREEN",
  CROSS_SCREEN = "CROSS_SCREEN",
  ELEVATOR_SCREEN = "ELEVATOR_SCREEN",
  DRIBBLE_HANDOFF = "DRIBBLE_HANDOFF",
  GIVE_AND_GO = "GIVE_AND_GO",
  BACKDOOR_CUT = "BACKDOOR_CUT",
  UCLA_CUT = "UCLA_CUT",
  FAST_BREAK = "FAST_BREAK",
}

export enum DefenseMove {
  // Stance and movement
  DEFENSIVE_SLIDE = "DEFENSIVE_SLIDE",
  CLOSEOUT = "CLOSEOUT",
  CHASE = "CHASE",
  RECOVER = "RECOVER",
  ROTATE = "ROTATE",
  SWITCH = "SWITCH",
  DENY = "DENY",
  FACE_GUARD = "FACE_GUARD",
  BOX_OUT = "BOX_OUT",

  // Pick-and-roll coverage
  HEDGE = "HEDGE",
  SHOW = "SHOW",
  ICE = "ICE",
  DROP_COVERAGE = "DROP_COVERAGE",
  TRAP = "TRAP",
  DOUBLE_TEAM = "DOUBLE_TEAM",
  GAP_HELP = "GAP_HELP",
  WEAK_SIDE_HELP = "WEAK_SIDE_HELP",

  // Zone and team schemes
  MAN_TO_MAN = "MAN_TO_MAN",
  ZONE_2_3 = "ZONE_2_3",
  ZONE_3_2 = "ZONE_3_2",
  ZONE_1_3_1 = "ZONE_1_3_1",
  MATCHUP_ZONE = "MATCHUP_ZONE",
  BOX_AND_ONE = "BOX_AND_ONE",
  FULL_COURT_PRESS = "FULL_COURT_PRESS",
  HALF_COURT_TRAP = "HALF_COURT_TRAP",

  // Ball disruption
  STEAL = "STEAL",
  POKE_STEAL = "POKE_STEAL",
  STRIP = "STRIP",
  CHARGE_DRAW = "CHARGE_DRAW",
  DEFLECTION = "DEFLECTION",

  // Shot defense
  BLOCK = "BLOCK",
  CONTEST = "CONTEST",
  CHALLENGE = "CHALLENGE",
  HELP_AND_RECOVER = "HELP_AND_RECOVER",

  // Rebounding
  DEFENSIVE_REBOUND = "DEFENSIVE_REBOUND",
  BOX_OUT_REBOUND = "BOX_OUT_REBOUND",
}

export type OffenseCategoryKey =
  | "dribbling"
  | "footwork"
  | "shooting"
  | "finishing"
  | "passing"
  | "plays";

export type DefenseCategoryKey =
  | "stance"
  | "pnr_coverage"
  | "schemes"
  | "disruption"
  | "shot_defense"
  | "rebounding";

export const OFFENSE_CATEGORIES: Record<OffenseCategoryKey, OffenseMove[]> = {
  dribbling: [
    OffenseMove.CROSSOVER,
    OffenseMove.KILLER_CROSSOVER,
    OffenseMove.BEHIND_THE_BACK,
    OffenseMove.BETWEEN_THE_LEGS,
    OffenseMove.HESITATION,
    OffenseMove.SPIN_MOVE,
    OffenseMove.STEPBACK_DRIBBLE,
    OffenseMove.RETREAT_DRIBBLE,
    OffenseMove.SNATCH_DRIBBLE,
    OffenseMove.PUNCH_DRIBBLE,
    OffenseMove.SHAMMGOD,
    OffenseMove.PROTECT_DRIBBLE,
  ],
  footwork: [
    OffenseMove.DROP_STEP,
    OffenseMove.UP_AND_UNDER,
    OffenseMove.JAB_STEP,
    OffenseMove.PIVOT,
    OffenseMove.EURO_STEP,
    OffenseMove.HOP_STEP,
    OffenseMove.JUMP_STOP,
    OffenseMove.BALL_FAKE,
    OffenseMove.SHOULDER_FAKE,
    OffenseMove.PUMP_FAKE,
    OffenseMove.BASELINE_SPIN,
  ],
  shooting: [
    OffenseMove.JUMP_SHOT,
    OffenseMove.PULL_UP_JUMPER,
    OffenseMove.CATCH_AND_SHOOT,
    OffenseMove.STEPBACK_THREE,
    OffenseMove.FADEAWAY,
    OffenseMove.FLOATER,
    OffenseMove.HOOK_SHOT,
    OffenseMove.SKY_HOOK,
    OffenseMove.BANK_SHOT,
    OffenseMove.RUNNER,
    OffenseMove.TEAR_DROP,
    OffenseMove.FREE_THROW,
  ],
  finishing: [
    OffenseMove.LAYUP,
    OffenseMove.REVERSE_LAYUP,
    OffenseMove.EURO_LAYUP,
    OffenseMove.DUNK,
    OffenseMove.ALLEY_OOP,
    OffenseMove.TIP_IN,
    OffenseMove.PUT_BACK,
    OffenseMove.TIP_OUT,
  ],
  passing: [
    OffenseMove.CHEST_PASS,
    OffenseMove.BOUNCE_PASS,
    OffenseMove.OVERHEAD_PASS,
    OffenseMove.BEHIND_BACK_PASS,
    OffenseMove.NO_LOOK_PASS,
    OffenseMove.OUTLET_PASS,
    OffenseMove.SKIP_PASS,
    OffenseMove.LOB_PASS,
    OffenseMove.WRAPAROUND_PASS,
    OffenseMove.HOCKEY_ASSIST,
  ],
  plays: [
    OffenseMove.PICK_AND_ROLL,
    OffenseMove.PICK_AND_POP,
    OffenseMove.PIN_DOWN,
    OffenseMove.FLARE_SCREEN,
    OffenseMove.BACK_SCREEN,
    OffenseMove.CROSS_SCREEN,
    OffenseMove.ELEVATOR_SCREEN,
    OffenseMove.DRIBBLE_HANDOFF,
    OffenseMove.GIVE_AND_GO,
    OffenseMove.BACKDOOR_CUT,
    OffenseMove.UCLA_CUT,
    OffenseMove.FAST_BREAK,
  ],
};

export const DEFENSE_CATEGORIES: Record<DefenseCategoryKey, DefenseMove[]> = {
  stance: [
    DefenseMove.DEFENSIVE_SLIDE,
    DefenseMove.CLOSEOUT,
    DefenseMove.CHASE,
    DefenseMove.RECOVER,
    DefenseMove.ROTATE,
    DefenseMove.SWITCH,
    DefenseMove.DENY,
    DefenseMove.FACE_GUARD,
    DefenseMove.BOX_OUT,
  ],
  pnr_coverage: [
    DefenseMove.HEDGE,
    DefenseMove.SHOW,
    DefenseMove.ICE,
    DefenseMove.DROP_COVERAGE,
    DefenseMove.TRAP,
    DefenseMove.DOUBLE_TEAM,
    DefenseMove.GAP_HELP,
    DefenseMove.WEAK_SIDE_HELP,
  ],
  schemes: [
    DefenseMove.MAN_TO_MAN,
    DefenseMove.ZONE_2_3,
    DefenseMove.ZONE_3_2,
    DefenseMove.ZONE_1_3_1,
    DefenseMove.MATCHUP_ZONE,
    DefenseMove.BOX_AND_ONE,
    DefenseMove.FULL_COURT_PRESS,
    DefenseMove.HALF_COURT_TRAP,
  ],
  disruption: [
    DefenseMove.STEAL,
    DefenseMove.POKE_STEAL,
    DefenseMove.STRIP,
    DefenseMove.CHARGE_DRAW,
    DefenseMove.DEFLECTION,
  ],
  shot_defense: [
    DefenseMove.BLOCK,
    DefenseMove.CONTEST,
    DefenseMove.CHALLENGE,
    DefenseMove.HELP_AND_RECOVER,
  ],
  rebounding: [
    DefenseMove.DEFENSIVE_REBOUND,
    DefenseMove.BOX_OUT_REBOUND,
  ],
};

export const OFFENSE_CATEGORY_LABELS: Record<OffenseCategoryKey, string> = {
  dribbling: "Dribbling",
  footwork: "Footwork & Post",
  shooting: "Shooting",
  finishing: "Finishing",
  passing: "Passing",
  plays: "Screens & Actions",
};

export const DEFENSE_CATEGORY_LABELS: Record<DefenseCategoryKey, string> = {
  stance: "Stance & Movement",
  pnr_coverage: "Pick & Roll Coverage",
  schemes: "Zone & Team Schemes",
  disruption: "Ball Disruption",
  shot_defense: "Shot Defense",
  rebounding: "Rebounding",
};

export interface MoveMetadata {
  id: OffenseMove | DefenseMove;
  name: string;
  side: "offense" | "defense";
  category: OffenseCategoryKey | DefenseCategoryKey;
  description: string;
  keyHint: string;
}

const CUSTOM_DESCRIPTIONS: Partial<Record<OffenseMove | DefenseMove, { desc: string; key: string }>> = {
  [OffenseMove.CROSSOVER]: { desc: "Quick front hand-to-hand shift to break a defender's ankles.", key: "U / X" },
  [OffenseMove.KILLER_CROSSOVER]: { desc: "Wide-stance hard double cross with explosive first step.", key: "Shift + U" },
  [OffenseMove.BEHIND_THE_BACK]: { desc: "Wrap dribble cleanly behind your back while changing lanes.", key: "C" },
  [OffenseMove.BETWEEN_THE_LEGS]: { desc: "Low rhythm split dribble through the legs to shield the ball.", key: "C + Move" },
  [OffenseMove.HESITATION]: { desc: "Freeze defender with a high shoulder fake before accelerating.", key: "H" },
  [OffenseMove.SPIN_MOVE]: { desc: "360-degree tight pivot spin past perimeter pressure.", key: "V" },
  [OffenseMove.STEPBACK_DRIBBLE]: { desc: "Hop backward onto the perimeter to create separation.", key: "U + Back" },
  [OffenseMove.SHAMMGOD]: { desc: "Extend push-out dribble and whip back with the opposite hand.", key: "Movebook / V" },
  [OffenseMove.PROTECT_DRIBBLE]: { desc: "Turn hip and seal defender away with off-arm shield.", key: "Z (Ball)" },
  [OffenseMove.DROP_STEP]: { desc: "Seal post defender and spin powerfully toward the rim.", key: "V (Paint)" },
  [OffenseMove.UP_AND_UNDER]: { desc: "Bait defender airborne with pump fake, then step through.", key: "J + Space" },
  [OffenseMove.JAB_STEP]: { desc: "Sharp triple-threat jab step to gauge defensive cushion.", key: "J" },
  [OffenseMove.EURO_STEP]: { desc: "Sinuous two-step finish weaving around interior help.", key: "U + Drive" },
  [OffenseMove.HOP_STEP]: { desc: "Two-foot gather hop into the lane for balance.", key: "U + Forward" },
  [OffenseMove.PUMP_FAKE]: { desc: "Raise shooting pocket cleanly without leaving the floor.", key: "Tap J" },
  [OffenseMove.BASELINE_SPIN]: { desc: "Tight spin along the baseline underneath the backboard.", key: "V + Side" },
  [OffenseMove.JUMP_SHOT]: { desc: "Classic elevated two-motion perimeter jumper.", key: "Space / A" },
  [OffenseMove.PULL_UP_JUMPER]: { desc: "Sudden stop off the bounce straight into a jumper.", key: "Space (Dribble)" },
  [OffenseMove.STEPBACK_THREE]: { desc: "Deep step-back separation behind the 3-point arc.", key: "Space + Back" },
  [OffenseMove.FADEAWAY]: { desc: "Fade backward over tight contests with high arc.", key: "Space + Away" },
  [OffenseMove.FLOATER]: { desc: "Soft high-arc runner lifted over outstretched bigs.", key: "F + Paint" },
  [OffenseMove.HOOK_SHOT]: { desc: "Classic side-body turn post hook off one shoulder.", key: "H (Paint)" },
  [OffenseMove.SKY_HOOK]: { desc: "Unblockable sweeping extended-arm hook from deep in the key.", key: "Movebook" },
  [OffenseMove.BANK_SHOT]: { desc: "Precision glass jumper aimed cleanly off the backboard square.", key: "45° Wing Shot" },
  [OffenseMove.DUNK]: { desc: "Explosive rim-rocking slam finish in traffic.", key: "I / Y" },
  [OffenseMove.ALLEY_OOP]: { desc: "High lob above the square finished with an airborne slam.", key: "L" },
  [OffenseMove.REVERSE_LAYUP]: { desc: "Slip under the rim to lay it in off the opposite glass.", key: "I (Baseline)" },
  [OffenseMove.CHEST_PASS]: { desc: "Crisp two-hand chest zip pass to the open teammate.", key: "K / B" },
  [OffenseMove.BOUNCE_PASS]: { desc: "Sharp hardwood bounce pass beneath reaching arms.", key: "K + Low" },
  [OffenseMove.LOB_PASS]: { desc: "High arc entry lob over fronting post defenders.", key: "L" },
  [OffenseMove.NO_LOOK_PASS]: { desc: "Deceptive look-off dish freezing help defenders.", key: "B + Flair" },
  [OffenseMove.PICK_AND_ROLL]: { desc: "Teammate sets on-ball screen and dives hard to the rim.", key: "1 / Timeout" },
  [OffenseMove.PICK_AND_POP]: { desc: "Screener pops outward to the 3PT line after contact.", key: "2 / Timeout" },
  [OffenseMove.FAST_BREAK]: { desc: "All wings sprint full-court lanes in transition.", key: "6 / Timeout" },
  [DefenseMove.DEFENSIVE_SLIDE]: { desc: "Low lateral slide keeping chest square to the ball-handler.", key: "Z / LT" },
  [DefenseMove.CLOSEOUT]: { desc: "High-speed sprint with high contest hand toward perimeter shooter.", key: "C (Defense)" },
  [DefenseMove.BOX_OUT]: { desc: "Low hip seal securing interior rebound position.", key: "G / Z" },
  [DefenseMove.STEAL]: { desc: "Quick reach poke targeting exposed dribble.", key: "E / RB" },
  [DefenseMove.BLOCK]: { desc: "Explosive vertical leap meeting the shot at its peak.", key: "G / Y (Def)" },
  [DefenseMove.CHARGE_DRAW]: { desc: "Plant both feet cleanly outside the restricted arc.", key: "Movebook" },
  [DefenseMove.FULL_COURT_PRESS]: { desc: "Pick up opponents 94 feet immediately after baskets.", key: "Timeout / Movebook" },
  [DefenseMove.ZONE_2_3]: { desc: "Two guards up top with three bigs walling off the paint.", key: "Timeout / Movebook" },
  [DefenseMove.ZONE_1_3_1]: { desc: "Aggressive trapping zone swarming wings and corners.", key: "Timeout / Movebook" },
};

export function formatMoveTitle(name: string): string {
  return name
    .toLowerCase()
    .split("_")
    .map((word) => {
      if (word === "ucla") return "UCLA";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function getMoveMetadata(move: OffenseMove | DefenseMove): MoveMetadata {
  const isOffense = Object.values(OffenseMove).includes(move as OffenseMove);
  let category: OffenseCategoryKey | DefenseCategoryKey = isOffense ? "dribbling" : "stance";

  if (isOffense) {
    for (const [cat, list] of Object.entries(OFFENSE_CATEGORIES)) {
      if (list.includes(move as OffenseMove)) {
        category = cat as OffenseCategoryKey;
        break;
      }
    }
  } else {
    for (const [cat, list] of Object.entries(DEFENSE_CATEGORIES)) {
      if (list.includes(move as DefenseMove)) {
        category = cat as DefenseCategoryKey;
        break;
      }
    }
  }

  const custom = CUSTOM_DESCRIPTIONS[move];
  const label = formatMoveTitle(move);
  const defaultDesc = isOffense
    ? `Execute authentic ${label} technique with tailored 3D footwork and ball physics.`
    : `Deploy ${label} defensive technique or coverage scheme across your squad.`;

  return {
    id: move,
    name: label,
    side: isOffense ? "offense" : "defense",
    category,
    description: custom?.desc || defaultDesc,
    keyHint: custom?.key || "Movebook",
  };
}

export const ALL_OFFENSE_MOVES: OffenseMove[] = Object.values(OffenseMove);
export const ALL_DEFENSE_MOVES: DefenseMove[] = Object.values(DefenseMove);
