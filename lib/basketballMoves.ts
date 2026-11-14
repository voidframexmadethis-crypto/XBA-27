export enum OffenseMove {
  // 1. Triple-Threat & Jab Series (Pre-Dribble)
  TRIPLE_THREAT_STANCE = "TRIPLE_THREAT_STANCE",
  JAB_STEP = "JAB_STEP",
  JAB_AND_GO = "JAB_AND_GO",
  JAB_AND_CROSS = "JAB_AND_CROSS",
  PUMP_FAKE = "PUMP_FAKE",
  PASS_FAKE = "PASS_FAKE",
  ROCKER_STEP = "ROCKER_STEP",
  SWEEP_RIP_THROUGH = "SWEEP_RIP_THROUGH",

  // 2. Dribble Moves & Ball-Handling (Perimeter Creation)
  SPEED_DRIBBLE = "SPEED_DRIBBLE",
  PROTECT_DRIBBLE = "PROTECT_DRIBBLE",
  CROSSOVER = "CROSSOVER",
  KILLER_CROSSOVER = "KILLER_CROSSOVER",
  BETWEEN_THE_LEGS = "BETWEEN_THE_LEGS",
  BEHIND_THE_BACK = "BEHIND_THE_BACK",
  SPIN_MOVE = "SPIN_MOVE",
  HALF_SPIN = "HALF_SPIN",
  HESITATION = "HESITATION",
  IN_AND_OUT = "IN_AND_OUT",
  SNATCH_BACK = "SNATCH_BACK",
  STUTTER_STEP = "STUTTER_STEP",
  SHAMMGOD = "SHAMMGOD",
  POCKET_DRIBBLE = "POCKET_DRIBBLE",
  HOSTAGE_DRIBBLE = "HOSTAGE_DRIBBLE",
  NASH_DRIBBLE = "NASH_DRIBBLE",

  // 3. Shot Creation & Jump-Shooting Footwork
  CATCH_AND_SHOOT = "CATCH_AND_SHOOT",
  PULL_UP_JUMPER = "PULL_UP_JUMPER",
  STEPBACK_JUMPER = "STEPBACK_JUMPER",
  SIDE_STEP_JUMPER = "SIDE_STEP_JUMPER",
  FADEAWAY = "FADEAWAY",
  TURNAROUND_JUMPER = "TURNAROUND_JUMPER",
  DIRK_FADEAWAY = "DIRK_FADEAWAY",
  DRIFT_JUMPER = "DRIFT_JUMPER",
  JUMP_SHOT = "JUMP_SHOT",

  // 4. Finishing at the Rim & Paint Moves
  OVERHAND_LAYUP = "OVERHAND_LAYUP",
  FINGER_ROLL = "FINGER_ROLL",
  REVERSE_LAYUP = "REVERSE_LAYUP",
  FLOATER = "FLOATER",
  RUNNER = "RUNNER",
  EURO_STEP = "EURO_STEP",
  PRO_HOP = "PRO_HOP",
  PINOY_STEP = "PINOY_STEP",
  RONDO_FAKE = "RONDO_FAKE",
  VEER_FINISH = "VEER_FINISH",
  STRIDE_STOP = "STRIDE_STOP",
  SCOOP_SHOT = "SCOOP_SHOT",
  WRONG_FOOT_LAYUP = "WRONG_FOOT_LAYUP",
  UP_AND_UNDER = "UP_AND_UNDER",
  TOMAHAWK_DUNK = "TOMAHAWK_DUNK",
  TWO_HAND_DUNK = "TWO_HAND_DUNK",
  WINDMILL_DUNK = "WINDMILL_DUNK",
  REVERSE_DUNK = "REVERSE_DUNK",
  BASELINE_CUFF_DUNK = "BASELINE_CUFF_DUNK",
  TIKI_TIKI_SLAM = "TIKI_TIKI_SLAM",
  ALLEY_OOP = "ALLEY_OOP",
  PUT_BACK = "PUT_BACK",

  // 5. Post-Up & Interior Moves (Back-to-the-Basket)
  DEEP_SEAL = "DEEP_SEAL",
  DROP_STEP = "DROP_STEP",
  HOOK_SHOT = "HOOK_SHOT",
  SKY_HOOK = "SKY_HOOK",
  DREAM_SHAKE = "DREAM_SHAKE",
  SHIMMY_FADEAWAY = "SHIMMY_FADEAWAY",
  POST_SPIN = "POST_SPIN",
  POST_UP_AND_UNDER = "POST_UP_AND_UNDER",
  FACE_UP_JAB = "FACE_UP_JAB",

  // 6. Off-Ball Movement & Screen Actions
  V_CUT = "V_CUT",
  L_CUT = "L_CUT",
  BACKDOOR_CUT = "BACKDOOR_CUT",
  FLASH_CUT = "FLASH_CUT",
  GIVE_AND_GO = "GIVE_AND_GO",
  CURL_CUT = "CURL_CUT",
  FLARE_CUT = "FLARE_CUT",
  FADE_CUT = "FADE_CUT",
  PICK_AND_ROLL = "PICK_AND_ROLL",
  PICK_AND_POP = "PICK_AND_POP",
  SLIP_SCREEN = "SLIP_SCREEN",
  GHOST_SCREEN = "GHOST_SCREEN",
  SPAIN_PICK_AND_ROLL = "SPAIN_PICK_AND_ROLL",
  DRIBBLE_HANDOFF = "DRIBBLE_HANDOFF",
  CHICAGO_ACTION = "CHICAGO_ACTION",
  PIN_DOWN = "PIN_DOWN",
  FAST_BREAK = "FAST_BREAK",

  // 7. Passing & Playmaking Maneuvers
  CHEST_PASS = "CHEST_PASS",
  BOUNCE_PASS = "BOUNCE_PASS",
  OUTLET_PASS = "OUTLET_PASS",
  SKIP_PASS = "SKIP_PASS",
  POCKET_PASS = "POCKET_PASS",
  LOB_PASS = "LOB_PASS",
  WRAPAROUND_PASS = "WRAPAROUND_PASS",
  NO_LOOK_PASS = "NO_LOOK_PASS",
  TOUCH_PASS = "TOUCH_PASS",
  BEHIND_BACK_PASS = "BEHIND_BACK_PASS",

  // 8. Offensive Rebounding Moves
  SPIN_OFF_BOX_OUT = "SPIN_OFF_BOX_OUT",
  SWIM_MOVE_REB = "SWIM_MOVE_REB",
  TIP_IN_TAP = "TIP_IN_TAP",
}

export enum DefenseMove {
  // 1. Foundational Footwork & Stance
  DEFENSIVE_STANCE = "DEFENSIVE_STANCE",
  DEFENSIVE_SLIDE = "DEFENSIVE_SLIDE",
  DROP_STEP_SWING = "DROP_STEP_SWING",
  SPRINT_TO_SLIDE = "SPRINT_TO_SLIDE",
  CLOSEOUT = "CLOSEOUT",

  // 2. On-Ball Perimeter Moves
  SHADING_FORCING = "SHADING_FORCING",
  HAND_CHECK_ARM_BAR = "HAND_CHECK_ARM_BAR",
  STUNT_DIG = "STUNT_DIG",
  POKE_STEAL = "POKE_STEAL",
  GLOVE_RIP_STRIP = "GLOVE_RIP_STRIP",
  HIP_RIDE = "HIP_RIDE",
  WALL_UP = "WALL_UP",
  SHOT_CONTEST = "SHOT_CONTEST",
  CHASE_DOWN_BLOCK = "CHASE_DOWN_BLOCK",
  VOLLEY_SWAT_BLOCK = "VOLLEY_SWAT_BLOCK",
  BASELINE_TRAP_CUTOFF = "BASELINE_TRAP_CUTOFF",
  PULL_CHAIR_PERIMETER = "PULL_CHAIR_PERIMETER",

  // 3. Pick-and-Roll (Screen) Defense
  OVER_SCREEN = "OVER_SCREEN",
  UNDER_SCREEN = "UNDER_SCREEN",
  HARD_HEDGE = "HARD_HEDGE",
  SOFT_HEDGE = "SOFT_HEDGE",
  DROP_COVERAGE = "DROP_COVERAGE",
  BLITZ_TRAP = "BLITZ_TRAP",
  ICE_BLUE = "ICE_BLUE",
  SWITCH = "SWITCH",
  SCRAM_SWITCH = "SCRAM_SWITCH",
  VEER_SWITCH = "VEER_SWITCH",
  SLIP_LATE_SWITCH = "SLIP_LATE_SWITCH",
  LOCK_AND_TRAIL = "LOCK_AND_TRAIL",
  TOP_LOCK = "TOP_LOCK",

  // 4. Off-Ball & Passing Lane Moves
  BALL_YOU_MAN = "BALL_YOU_MAN",
  FULL_DENIAL = "FULL_DENIAL",
  THREE_QUARTER_DENIAL = "THREE_QUARTER_DENIAL",
  GAP_HELP = "GAP_HELP",
  HELP_AND_RECOVER = "HELP_AND_RECOVER",
  X_OUT_ROTATION = "X_OUT_ROTATION",
  CHARGE_DRAW = "CHARGE_DRAW",
  DEFLECTION = "DEFLECTION",
  JUMP_PASSING_LANE = "JUMP_PASSING_LANE",

  // 5. Interior & Post Defense Moves
  FRONT_POST = "FRONT_POST",
  THREE_QUARTER_FRONT = "THREE_QUARTER_FRONT",
  POST_SWIM_DENIAL = "POST_SWIM_DENIAL",
  PULL_CHAIR_POST = "PULL_CHAIR_POST",
  PUSH_OFF_SPOT = "PUSH_OFF_SPOT",
  DIG_DOWN = "DIG_DOWN",
  WEAK_SIDE_RIM_PROTECTION = "WEAK_SIDE_RIM_PROTECTION",

  // 6. Rebounding Moves
  BOX_OUT = "BOX_OUT",
  SWIM_SPIN_COUNTER = "SWIM_SPIN_COUNTER",
  WEDGE_CRASH = "WEDGE_CRASH",

  // 7. Team Defensive Schemes & Traps
  MAN_TO_MAN = "MAN_TO_MAN",
  DOUBLE_TEAM = "DOUBLE_TEAM",
  RUN_AND_JUMP = "RUN_AND_JUMP",
  ZONE_2_3 = "ZONE_2_3",
  ZONE_3_2 = "ZONE_3_2",
  ZONE_1_3_1 = "ZONE_1_3_1",
  BOX_AND_ONE = "BOX_AND_ONE",
  TRIANGLE_AND_TWO = "TRIANGLE_AND_TWO",
  FULL_COURT_PRESS = "FULL_COURT_PRESS",
}

export type OffenseCategoryKey =
  | "triple_threat"
  | "dribbling"
  | "shooting"
  | "finishing"
  | "post_up"
  | "off_ball_actions"
  | "passing"
  | "off_rebounding";

export type DefenseCategoryKey =
  | "footwork_stance"
  | "on_ball"
  | "pnr_coverage"
  | "off_ball"
  | "interior_post"
  | "rebounding"
  | "schemes";

export const OFFENSE_CATEGORIES: Record<OffenseCategoryKey, OffenseMove[]> = {
  triple_threat: [
    OffenseMove.TRIPLE_THREAT_STANCE,
    OffenseMove.JAB_STEP,
    OffenseMove.JAB_AND_GO,
    OffenseMove.JAB_AND_CROSS,
    OffenseMove.PUMP_FAKE,
    OffenseMove.PASS_FAKE,
    OffenseMove.ROCKER_STEP,
    OffenseMove.SWEEP_RIP_THROUGH,
  ],
  dribbling: [
    OffenseMove.SPEED_DRIBBLE,
    OffenseMove.PROTECT_DRIBBLE,
    OffenseMove.CROSSOVER,
    OffenseMove.KILLER_CROSSOVER,
    OffenseMove.BETWEEN_THE_LEGS,
    OffenseMove.BEHIND_THE_BACK,
    OffenseMove.SPIN_MOVE,
    OffenseMove.HALF_SPIN,
    OffenseMove.HESITATION,
    OffenseMove.IN_AND_OUT,
    OffenseMove.SNATCH_BACK,
    OffenseMove.STUTTER_STEP,
    OffenseMove.SHAMMGOD,
    OffenseMove.POCKET_DRIBBLE,
    OffenseMove.HOSTAGE_DRIBBLE,
    OffenseMove.NASH_DRIBBLE,
  ],
  shooting: [
    OffenseMove.CATCH_AND_SHOOT,
    OffenseMove.PULL_UP_JUMPER,
    OffenseMove.STEPBACK_JUMPER,
    OffenseMove.SIDE_STEP_JUMPER,
    OffenseMove.FADEAWAY,
    OffenseMove.TURNAROUND_JUMPER,
    OffenseMove.DIRK_FADEAWAY,
    OffenseMove.DRIFT_JUMPER,
    OffenseMove.JUMP_SHOT,
  ],
  finishing: [
    OffenseMove.OVERHAND_LAYUP,
    OffenseMove.FINGER_ROLL,
    OffenseMove.REVERSE_LAYUP,
    OffenseMove.FLOATER,
    OffenseMove.RUNNER,
    OffenseMove.EURO_STEP,
    OffenseMove.PRO_HOP,
    OffenseMove.PINOY_STEP,
    OffenseMove.RONDO_FAKE,
    OffenseMove.VEER_FINISH,
    OffenseMove.STRIDE_STOP,
    OffenseMove.SCOOP_SHOT,
    OffenseMove.WRONG_FOOT_LAYUP,
    OffenseMove.UP_AND_UNDER,
    OffenseMove.TOMAHAWK_DUNK,
    OffenseMove.TWO_HAND_DUNK,
    OffenseMove.WINDMILL_DUNK,
    OffenseMove.REVERSE_DUNK,
    OffenseMove.BASELINE_CUFF_DUNK,
    OffenseMove.TIKI_TIKI_SLAM,
    OffenseMove.ALLEY_OOP,
    OffenseMove.PUT_BACK,
  ],
  post_up: [
    OffenseMove.DEEP_SEAL,
    OffenseMove.DROP_STEP,
    OffenseMove.HOOK_SHOT,
    OffenseMove.SKY_HOOK,
    OffenseMove.DREAM_SHAKE,
    OffenseMove.SHIMMY_FADEAWAY,
    OffenseMove.POST_SPIN,
    OffenseMove.POST_UP_AND_UNDER,
    OffenseMove.FACE_UP_JAB,
  ],
  off_ball_actions: [
    OffenseMove.V_CUT,
    OffenseMove.L_CUT,
    OffenseMove.BACKDOOR_CUT,
    OffenseMove.FLASH_CUT,
    OffenseMove.GIVE_AND_GO,
    OffenseMove.CURL_CUT,
    OffenseMove.FLARE_CUT,
    OffenseMove.FADE_CUT,
    OffenseMove.PICK_AND_ROLL,
    OffenseMove.PICK_AND_POP,
    OffenseMove.SLIP_SCREEN,
    OffenseMove.GHOST_SCREEN,
    OffenseMove.SPAIN_PICK_AND_ROLL,
    OffenseMove.DRIBBLE_HANDOFF,
    OffenseMove.CHICAGO_ACTION,
    OffenseMove.PIN_DOWN,
    OffenseMove.FAST_BREAK,
  ],
  passing: [
    OffenseMove.CHEST_PASS,
    OffenseMove.BOUNCE_PASS,
    OffenseMove.OUTLET_PASS,
    OffenseMove.SKIP_PASS,
    OffenseMove.POCKET_PASS,
    OffenseMove.LOB_PASS,
    OffenseMove.WRAPAROUND_PASS,
    OffenseMove.NO_LOOK_PASS,
    OffenseMove.TOUCH_PASS,
    OffenseMove.BEHIND_BACK_PASS,
  ],
  off_rebounding: [
    OffenseMove.SPIN_OFF_BOX_OUT,
    OffenseMove.SWIM_MOVE_REB,
    OffenseMove.TIP_IN_TAP,
  ],
};

export const DEFENSE_CATEGORIES: Record<DefenseCategoryKey, DefenseMove[]> = {
  footwork_stance: [
    DefenseMove.DEFENSIVE_STANCE,
    DefenseMove.DEFENSIVE_SLIDE,
    DefenseMove.DROP_STEP_SWING,
    DefenseMove.SPRINT_TO_SLIDE,
    DefenseMove.CLOSEOUT,
    DefenseMove.BASELINE_TRAP_CUTOFF,
  ],
  on_ball: [
    DefenseMove.SHADING_FORCING,
    DefenseMove.HAND_CHECK_ARM_BAR,
    DefenseMove.STUNT_DIG,
    DefenseMove.POKE_STEAL,
    DefenseMove.GLOVE_RIP_STRIP,
    DefenseMove.HIP_RIDE,
    DefenseMove.WALL_UP,
    DefenseMove.SHOT_CONTEST,
    DefenseMove.CHASE_DOWN_BLOCK,
    DefenseMove.VOLLEY_SWAT_BLOCK,
    DefenseMove.PULL_CHAIR_PERIMETER,
  ],
  pnr_coverage: [
    DefenseMove.OVER_SCREEN,
    DefenseMove.UNDER_SCREEN,
    DefenseMove.HARD_HEDGE,
    DefenseMove.SOFT_HEDGE,
    DefenseMove.DROP_COVERAGE,
    DefenseMove.BLITZ_TRAP,
    DefenseMove.ICE_BLUE,
    DefenseMove.SWITCH,
    DefenseMove.SCRAM_SWITCH,
    DefenseMove.VEER_SWITCH,
    DefenseMove.SLIP_LATE_SWITCH,
    DefenseMove.LOCK_AND_TRAIL,
    DefenseMove.TOP_LOCK,
  ],
  off_ball: [
    DefenseMove.BALL_YOU_MAN,
    DefenseMove.FULL_DENIAL,
    DefenseMove.THREE_QUARTER_DENIAL,
    DefenseMove.GAP_HELP,
    DefenseMove.HELP_AND_RECOVER,
    DefenseMove.X_OUT_ROTATION,
    DefenseMove.CHARGE_DRAW,
    DefenseMove.DEFLECTION,
    DefenseMove.JUMP_PASSING_LANE,
  ],
  interior_post: [
    DefenseMove.FRONT_POST,
    DefenseMove.THREE_QUARTER_FRONT,
    DefenseMove.POST_SWIM_DENIAL,
    DefenseMove.PULL_CHAIR_POST,
    DefenseMove.PUSH_OFF_SPOT,
    DefenseMove.DIG_DOWN,
    DefenseMove.WEAK_SIDE_RIM_PROTECTION,
  ],
  rebounding: [
    DefenseMove.BOX_OUT,
    DefenseMove.SWIM_SPIN_COUNTER,
    DefenseMove.WEDGE_CRASH,
  ],
  schemes: [
    DefenseMove.MAN_TO_MAN,
    DefenseMove.DOUBLE_TEAM,
    DefenseMove.RUN_AND_JUMP,
    DefenseMove.ZONE_2_3,
    DefenseMove.ZONE_3_2,
    DefenseMove.ZONE_1_3_1,
    DefenseMove.BOX_AND_ONE,
    DefenseMove.TRIANGLE_AND_TWO,
    DefenseMove.FULL_COURT_PRESS,
  ],
};

export const OFFENSE_CATEGORY_LABELS: Record<OffenseCategoryKey, string> = {
  triple_threat: "Triple-Threat & Jab",
  dribbling: "Dribble & Handles",
  shooting: "Shot Creation",
  finishing: "Finishing & Dunks",
  post_up: "Post-Up & Interior",
  off_ball_actions: "Off-Ball & Screens",
  passing: "Passing & Playmaking",
  off_rebounding: "Off. Rebounding",
};

export const DEFENSE_CATEGORY_LABELS: Record<DefenseCategoryKey, string> = {
  footwork_stance: "Footwork & Stance",
  on_ball: "On-Ball Perimeter",
  pnr_coverage: "Pick & Roll Defense",
  off_ball: "Off-Ball & Lanes",
  interior_post: "Interior & Post",
  rebounding: "Rebounding",
  schemes: "Team Schemes & Traps",
};

export interface MoveMetadata {
  id: OffenseMove | DefenseMove;
  name: string;
  side: "offense" | "defense";
  category: OffenseCategoryKey | DefenseCategoryKey;
  description: string;
  keyHint: string;
}

const CUSTOM_DESCRIPTIONS: Partial<
  Record<OffenseMove | DefenseMove, { name?: string; desc: string; key: string }>
> = {
  // 1. Triple-Threat & Jab Series
  [OffenseMove.TRIPLE_THREAT_STANCE]: {
    name: "Triple-Threat Stance",
    desc: "Athletic low base, knees bent, ball tucked in the shooting pocket ready to shoot, pass, or drive.",
    key: "Z (Offense) / Deck",
  },
  [OffenseMove.JAB_STEP]: {
    name: "Jab Step",
    desc: "Quick directional step toward the defender to test cushion and freeze their lead foot.",
    key: "J / Shift+J",
  },
  [OffenseMove.JAB_AND_GO]: {
    name: "Jab-and-Go",
    desc: "Sharp jab freezes the defender's hips, then explode past them in the exact same lane.",
    key: "Move Deck",
  },
  [OffenseMove.JAB_AND_CROSS]: {
    name: "Jab-and-Cross (Crossover Step)",
    desc: "Jab one way to shift defender weight, then step across the body to attack the opposite side.",
    key: "Move Deck",
  },
  [OffenseMove.PUMP_FAKE]: {
    name: "Pump Fake / Shot Fake",
    desc: "Lift ball and eyes toward the rim to make defenders jump or raise their center of gravity.",
    key: "J (Offense)",
  },
  [OffenseMove.PASS_FAKE]: {
    name: "Pass Fake",
    desc: "Deceptive ball snap and eye shift simulating a pass to pull help defenders off the lane.",
    key: "Move Deck",
  },
  [OffenseMove.ROCKER_STEP]: {
    name: "Rocker Step",
    desc: "Jab step forward into a weight-shift rock back—elevate cleanly into a jumper or re-attack.",
    key: "Move Deck",
  },
  [OffenseMove.SWEEP_RIP_THROUGH]: {
    name: "Sweep (Rip-Through)",
    desc: "Swing the ball low below the knees across the body to clear reach-ins and launch a drive.",
    key: "Move Deck",
  },

  // 2. Dribble Moves & Ball-Handling
  [OffenseMove.SPEED_DRIBBLE]: {
    name: "Speed Dribble",
    desc: "Push the ball out ahead at waist height to sprint down open floor lanes at top speed.",
    key: "Shift + Move",
  },
  [OffenseMove.PROTECT_DRIBBLE]: {
    name: "Control / Protection Dribble",
    desc: "Seal body between ball and defender with a low tight dribble and off-arm shield.",
    key: "G (Offense)",
  },
  [OffenseMove.CROSSOVER]: {
    name: "Crossover",
    desc: "Low, explosive V-dribble snapping the ball from hand to hand in front of the body.",
    key: "U / X",
  },
  [OffenseMove.KILLER_CROSSOVER]: {
    name: "Killer Crossover (Iverson)",
    desc: "Wide deceptive head-and-shoulder fake one way before snapping a hard cross back.",
    key: "Shift + U",
  },
  [OffenseMove.BETWEEN_THE_LEGS]: {
    name: "Between-the-Legs",
    desc: "Bounce the ball beneath the legs to shield the handle from heavy ball-pressure.",
    key: "Move Deck",
  },
  [OffenseMove.BEHIND_THE_BACK]: {
    name: "Behind-the-Back",
    desc: "Wrap the ball cleanly around the back hip to change lanes while shielding from reaches.",
    key: "C (Offense)",
  },
  [OffenseMove.SPIN_MOVE]: {
    name: "Spin Move (Reverse Pivot)",
    desc: "Plant inside foot, seal defender on your back, and spin 360° into the open lane.",
    key: "V (Perimeter)",
  },
  [OffenseMove.HALF_SPIN]: {
    name: "Half-Spin",
    desc: "Initiate a spin shoulder turn to freeze the defender, then snap back to the original lane.",
    key: "Move Deck",
  },
  [OffenseMove.HESITATION]: {
    name: "Hesitation (Hesi)",
    desc: "Pause momentum and lift eyes toward the rim as if pulling up, then explode past.",
    key: "H (Perimeter)",
  },
  [OffenseMove.IN_AND_OUT]: {
    name: "In-and-Out Dribble",
    desc: "Bring the ball toward the midline like a crossover, then roll wrist back out in same lane.",
    key: "Move Deck",
  },
  [OffenseMove.SNATCH_BACK]: {
    name: "Snatch-Back (Retreat)",
    desc: "Sudden hard backward dribble dropping hips to create instant perimeter shot separation.",
    key: "U + Back",
  },
  [OffenseMove.STUTTER_STEP]: {
    name: "Stutter Step",
    desc: "Rapid choppy dribble footwork disrupting defensive cadence before an acceleration burst.",
    key: "Move Deck",
  },
  [OffenseMove.SHAMMGOD]: {
    name: "Shamgod",
    desc: "Push the ball out one-handed as if losing it, then snatch it across with the opposite hand.",
    key: "Shift + V",
  },
  [OffenseMove.POCKET_DRIBBLE]: {
    name: "Pocket Dribble / Hip Swivel",
    desc: "Pull the ball near your back hip pocket to read screen coverage without stopping.",
    key: "Move Deck",
  },
  [OffenseMove.HOSTAGE_DRIBBLE]: {
    name: "Hostage Dribble (Jail)",
    desc: "Keep a beaten defender pinned on your hip/back after a screen to read the 2-on-1.",
    key: "Move Deck",
  },
  [OffenseMove.NASH_DRIBBLE]: {
    name: "Nash Dribble (Baseline Probe)",
    desc: "Maintain dribble underneath the basket and probe back out to reset passing angles.",
    key: "Move Deck",
  },

  // 3. Shot Creation & Jump-Shooting Footwork
  [OffenseMove.CATCH_AND_SHOOT]: {
    name: "Catch-and-Shoot (Hop / 1-2)",
    desc: "Hop cleanly into balanced shooting alignment for an ultra-quick perimeter release.",
    key: "Move Deck",
  },
  [OffenseMove.PULL_UP_JUMPER]: {
    name: "Pull-Up Jumper",
    desc: "Sudden 1-2 or hop stop out of a sprint straight into a vertical mid-range/three jumper.",
    key: "Space (Dribble)",
  },
  [OffenseMove.STEPBACK_JUMPER]: {
    name: "Step-Back Jumper",
    desc: "Plant lead foot off a hard drive and push backward into clean perimeter shooting space.",
    key: "U + Back / Space",
  },
  [OffenseMove.SIDE_STEP_JUMPER]: {
    name: "Side-Step Jumper",
    desc: "Push laterally off the bounce to escape an aggressive closeout angle.",
    key: "Move Deck",
  },
  [OffenseMove.FADEAWAY]: {
    name: "Fadeaway",
    desc: "Elevate backward away from the basket to shoot cleanly over taller contests.",
    key: "Space + Back",
  },
  [OffenseMove.TURNAROUND_JUMPER]: {
    name: "Turnaround Jumper",
    desc: "Pivot 180° from a back-to-basket stance directly into a square, high-release jumper.",
    key: "Move Deck",
  },
  [OffenseMove.DIRK_FADEAWAY]: {
    name: "Dirk One-Legged Fadeaway",
    desc: "Fade off one leg raising the opposite knee to create unguardable vertical separation.",
    key: "Move Deck",
  },
  [OffenseMove.DRIFT_JUMPER]: {
    name: "Drift / Leaning Jumper",
    desc: "Balanced off-axis perimeter jumper while drifting laterally along the arc or baseline.",
    key: "Move Deck",
  },
  [OffenseMove.JUMP_SHOT]: {
    name: "Jump Shot",
    desc: "Classic high-arc balanced two-motion perimeter jump shot.",
    key: "Space / A",
  },

  // 4. Finishing at the Rim & Paint Moves
  [OffenseMove.OVERHAND_LAYUP]: {
    name: "Standard Overhand Layup",
    desc: "Traditional one-foot takeoff kissing the ball softly off the backboard square.",
    key: "Space (Paint)",
  },
  [OffenseMove.FINGER_ROLL]: {
    name: "Underhand Layup (Finger Roll)",
    desc: "Soft high-arcing fingertip extension floating over outstretched shot blockers.",
    key: "Move Deck",
  },
  [OffenseMove.REVERSE_LAYUP]: {
    name: "Reverse Layup",
    desc: "Glide underneath the hoop along the baseline and finish using the rim as a shield.",
    key: "I (Baseline)",
  },
  [OffenseMove.FLOATER]: {
    name: "Floater / Tear Drop",
    desc: "High-arcing one-handed touch shot released early before reaching rim protectors.",
    key: "Move Deck",
  },
  [OffenseMove.RUNNER]: {
    name: "Runner",
    desc: "One-footed forward-momentum push shot taken cleanly in stride through the lane.",
    key: "Move Deck",
  },
  [OffenseMove.EURO_STEP]: {
    name: "Euro-Step",
    desc: "Gather step one direction to shift the help defender, then step laterally opposite.",
    key: "U + Drive",
  },
  [OffenseMove.PRO_HOP]: {
    name: "Pro-Hop (Jump Stop)",
    desc: "Power gather onto both feet simultaneously to absorb contact in traffic.",
    key: "U + Forward",
  },
  [OffenseMove.PINOY_STEP]: {
    name: "Pinoy Step",
    desc: "Combine a mid-gather pump fake with a Euro-step stride to freeze airborne shot blockers.",
    key: "Move Deck",
  },
  [OffenseMove.RONDO_FAKE]: {
    name: "Rondo Fake Layup",
    desc: "Wrap the ball behind your back on the gather to fake a pass, then scoop it up to score.",
    key: "Move Deck",
  },
  [OffenseMove.VEER_FINISH]: {
    name: "Veer Finish",
    desc: "Initiate legal shoulder-to-chest contact on the drive, then veer off for an open finish.",
    key: "Move Deck",
  },
  [OffenseMove.STRIDE_STOP]: {
    name: "Stride Stop / Veer Step",
    desc: "Gather on one foot, decelerate as the defender flies past, and step through cleanly.",
    key: "Move Deck",
  },
  [OffenseMove.SCOOP_SHOT]: {
    name: "Scoop Shot",
    desc: "Low extended underhand scoop sweeping upward past a shot blocker's reaching fingertips.",
    key: "Move Deck",
  },
  [OffenseMove.WRONG_FOOT_LAYUP]: {
    name: "Wrong-Foot Layup (Speed)",
    desc: "Take off from the same-side foot as your shooting hand to throw off a blocker's timing.",
    key: "Move Deck",
  },
  [OffenseMove.UP_AND_UNDER]: {
    name: "Up-and-Under (Step-Through)",
    desc: "Ball-fake close to the rim to get the defender airborne, then step through to score.",
    key: "Move Deck",
  },
  [OffenseMove.TOMAHAWK_DUNK]: {
    name: "One-Hand Tomahawk Dunk",
    desc: "Explosive one-handed cock-back slam hammered violently down through the rim.",
    key: "I / Y",
  },
  [OffenseMove.TWO_HAND_DUNK]: {
    name: "Two-Hand Power Flush",
    desc: "Authoritative two-handed rim-rocking slam finished cleanly through heavy contact.",
    key: "Shift + I",
  },
  [OffenseMove.WINDMILL_DUNK]: {
    name: "Windmill Dunk",
    desc: "Full-extension circular arm windmill sweep in mid-air into a thunderous slam.",
    key: "Move Deck",
  },
  [OffenseMove.REVERSE_DUNK]: {
    name: "Reverse Dunk",
    desc: "Fly past the front of the rim and throw down a two-hand reverse flush on the back side.",
    key: "Move Deck",
  },
  [OffenseMove.BASELINE_CUFF_DUNK]: {
    name: "Baseline Cuff Dunk",
    desc: "Cuff the basketball against your forearm gliding along the baseline for a poster dunk.",
    key: "Move Deck",
  },
  [OffenseMove.TIKI_TIKI_SLAM]: {
    name: "Tiki Tiki Signature Slam",
    desc: "Unlockable coiled 360-degree emerald-and-gold aerial dunk with shockwave ring, custom audio, and slow-mo replay.",
    key: "Shift+I / K (Lane)",
  },
  [OffenseMove.ALLEY_OOP]: {
    name: "Alley-Oop Finish",
    desc: "Catch and slam an airborne lob pass right above the cylinder in one fluid motion.",
    key: "L + I",
  },
  [OffenseMove.PUT_BACK]: {
    name: "Putback Slam",
    desc: "Crash the offensive glass and slam a missed shot straight back through the hoop.",
    key: "Move Deck",
  },

  // 5. Post-Up & Interior Moves
  [OffenseMove.DEEP_SEAL]: {
    name: "Deep Seal / Pin",
    desc: "Use wide base and forearm leverage to pin the defender behind you for deep paint position.",
    key: "Move Deck",
  },
  [OffenseMove.DROP_STEP]: {
    name: "Drop Step",
    desc: "Feel defender leverage, swing leg behind them to seal, and power straight to the rim.",
    key: "V (Paint)",
  },
  [OffenseMove.HOOK_SHOT]: {
    name: "Hook Shot / Baby Hook",
    desc: "Turn sideways shielding with your off-shoulder and sweep a soft arc hook over your man.",
    key: "H (Paint)",
  },
  [OffenseMove.SKY_HOOK]: {
    name: "Skyhook",
    desc: "Sweeping full-extension hook shot released from maximum height sideways to the defender.",
    key: "Move Deck",
  },
  [OffenseMove.DREAM_SHAKE]: {
    name: "Dream Shake",
    desc: "Rapid shoulder-and-head fakes in the post freezing the defender before spinning to score.",
    key: "Move Deck",
  },
  [OffenseMove.SHIMMY_FADEAWAY]: {
    name: "Shimmy Fadeaway",
    desc: "Back-down shoulder shimmy disguising which shoulder you turn over for a fadeaway.",
    key: "Move Deck",
  },
  [OffenseMove.POST_SPIN]: {
    name: "Spin Move (Post Seal)",
    desc: "Spin sharply off a post defender's high-side pressure toward baseline or middle.",
    key: "Move Deck",
  },
  [OffenseMove.POST_UP_AND_UNDER]: {
    name: "Up-and-Under (Post)",
    desc: "Fake a turnaround jumper to lift the post defender, then step underneath for a layup.",
    key: "Move Deck",
  },
  [OffenseMove.FACE_UP_JAB]: {
    name: "Face-Up Jab",
    desc: "Catch in the post, pivot to face the defender, and attack directly out of triple threat.",
    key: "Move Deck",
  },

  // 6. Off-Ball Movement & Screen Actions
  [OffenseMove.V_CUT]: {
    name: "V-Cut",
    desc: "Teammates walk defenders into the lane, plant hard, and pop out to the perimeter to catch.",
    key: "Move Deck",
  },
  [OffenseMove.L_CUT]: {
    name: "L-Cut",
    desc: "Cut from low block to elbow, plant at 90 degrees, and flare cleanly to the wing.",
    key: "Move Deck",
  },
  [OffenseMove.BACKDOOR_CUT]: {
    name: "Backdoor Cut",
    desc: "Plant outside foot against an overplay and sprint directly behind the defender to the rim.",
    key: "4 (Offense)",
  },
  [OffenseMove.FLASH_CUT]: {
    name: "Flash Cut",
    desc: "Sudden weak-side burst into an open gap in the high post or paint.",
    key: "Move Deck",
  },
  [OffenseMove.GIVE_AND_GO]: {
    name: "Give-and-Go",
    desc: "Pass to a wing teammate and immediately burst toward the basket for the return dish.",
    key: "5 (Offense)",
  },
  [OffenseMove.CURL_CUT]: {
    name: "Curl Cut",
    desc: "Wrap tightly around an off-ball screen toward the rim while the defender trails.",
    key: "Move Deck",
  },
  [OffenseMove.FLARE_CUT]: {
    name: "Flare Cut",
    desc: "Fade away from an off-ball screen to the corner/wing when the defender fights over.",
    key: "Move Deck",
  },
  [OffenseMove.FADE_CUT]: {
    name: "Fade Cut",
    desc: "Drift backward into open three-point space when the defender cheats under the screen.",
    key: "Move Deck",
  },
  [OffenseMove.PICK_AND_ROLL]: {
    name: "Pick-and-Roll",
    desc: "Big sets a solid ball screen, then rolls hard toward the basket showing target hands.",
    key: "1 (Offense)",
  },
  [OffenseMove.PICK_AND_POP]: {
    name: "Pick-and-Pop",
    desc: "Screener pops outward to the open three-point arc immediately after setting the pick.",
    key: "2 (Offense)",
  },
  [OffenseMove.SLIP_SCREEN]: {
    name: "Slip Screen",
    desc: "Fake the ball screen and sprint early to the rim before contact to punish hard hedges.",
    key: "Move Deck",
  },
  [OffenseMove.GHOST_SCREEN]: {
    name: "Ghost Screen",
    desc: "Sprint at the ball handler as if screening, then peel into open 3PT space before contact.",
    key: "Move Deck",
  },
  [OffenseMove.SPAIN_PICK_AND_ROLL]: {
    name: "Spain Pick-and-Roll",
    desc: "Back-screener screens the roller's defender right as the initial ball screen unfolds.",
    key: "Move Deck",
  },
  [OffenseMove.DRIBBLE_HANDOFF]: {
    name: "Dribble Hand-Off (DHO)",
    desc: "Dribble toward a wing cutter, flip a tight handoff, and seal as a moving screen.",
    key: "Move Deck",
  },
  [OffenseMove.CHICAGO_ACTION]: {
    name: "Chicago Action",
    desc: "Shooter sprints off a pindown screen directly into a perimeter dribble hand-off.",
    key: "Move Deck",
  },
  [OffenseMove.PIN_DOWN]: {
    name: "Pin-Down Screen",
    desc: "Off-ball down screen freeing a shooter to curl or flare onto the perimeter wing.",
    key: "3 (Offense)",
  },
  [OffenseMove.FAST_BREAK]: {
    name: "Fast Break Lanes",
    desc: "Push tempo full-court with wings sprinting wide lanes and trailer filling the arc.",
    key: "6 (Offense)",
  },

  // 7. Passing & Playmaking Maneuvers
  [OffenseMove.CHEST_PASS]: {
    name: "Chest Pass",
    desc: "Crisp two-handed pass snapped directly from your chest to a teammate's target hands.",
    key: "K / B",
  },
  [OffenseMove.BOUNCE_PASS]: {
    name: "Bounce Pass",
    desc: "Drive the ball off the floor two-thirds of the way to slip beneath reaching arms.",
    key: "Move Deck",
  },
  [OffenseMove.OUTLET_PASS]: {
    name: "Overhead (Outlet) Pass",
    desc: "Two-handed overhead outlet launch over defenders to ignite fast-break transitions.",
    key: "Move Deck",
  },
  [OffenseMove.SKIP_PASS]: {
    name: "Skip Pass",
    desc: "Long cross-court pass over shifted help defense to hit an open weak-side shooter.",
    key: "Move Deck",
  },
  [OffenseMove.POCKET_PASS]: {
    name: "Pocket Pass",
    desc: "Quick one-handed bounce pass threaded tightly between PnR defenders to the roller.",
    key: "Move Deck",
  },
  [OffenseMove.LOB_PASS]: {
    name: "Lob / Alley-Oop Pass",
    desc: "High-arcing lob placed above the rim for an airborne finisher.",
    key: "L (Offense)",
  },
  [OffenseMove.WRAPAROUND_PASS]: {
    name: "Wrap-Around Pass",
    desc: "Step around your defender with one foot and whip a one-handed pass around their hip.",
    key: "Move Deck",
  },
  [OffenseMove.NO_LOOK_PASS]: {
    name: "No-Look / Look-Away Pass",
    desc: "Look one direction to freeze help rotation while delivering accurately to another cutter.",
    key: "Move Deck",
  },
  [OffenseMove.TOUCH_PASS]: {
    name: "Touch Pass (Tic-Tac-Toe)",
    desc: "Instantly redirect the ball to an open cutter with zero hold time to beat rotations.",
    key: "Move Deck",
  },
  [OffenseMove.BEHIND_BACK_PASS]: {
    name: "Behind-the-Back Pass",
    desc: "Wrap the ball behind your waist in stride to hit a cutting or trailing teammate.",
    key: "Move Deck",
  },

  // 8. Offensive Rebounding Moves
  [OffenseMove.SPIN_OFF_BOX_OUT]: {
    name: "Spin-Off Box-Out",
    desc: "Plant a hand on the defender's hip and spin tightly around them to claim inside position.",
    key: "Move Deck",
  },
  [OffenseMove.SWIM_MOVE_REB]: {
    name: "Swim Move (Rebound)",
    desc: "Sweep one arm over the boxing-out defender's shoulder while stepping into the paint.",
    key: "Move Deck",
  },
  [OffenseMove.TIP_IN_TAP]: {
    name: "Tip-In / Volleyball Tap",
    desc: "Leap at the rim to tip an offensive rebound straight back through the hoop mid-air.",
    key: "Move Deck",
  },

  // Defense Moves (1-7 Categories)
  [DefenseMove.DEFENSIVE_STANCE]: {
    name: "Defensive Stance",
    desc: "Wide base, knees bent, hips low, weight on balls of feet with active contest/lane hands.",
    key: "Z / LT",
  },
  [DefenseMove.DEFENSIVE_SLIDE]: {
    name: "Defensive Slide",
    desc: "Move laterally without crossing feet—lead foot steps, trail foot pushes to reset base.",
    key: "V (Defense)",
  },
  [DefenseMove.DROP_STEP_SWING]: {
    name: "Drop Step (Swing Step)",
    desc: "Pivot backward on one foot and open hips to cut off a ball handler who gained a step.",
    key: "Shift + V (Def)",
  },
  [DefenseMove.SPRINT_TO_SLIDE]: {
    name: "Sprint-to-Slide",
    desc: "Turn hips to sprint and catch up when beaten on a drive, then snap back into a low slide.",
    key: "Shift + C (Def)",
  },
  [DefenseMove.CLOSEOUT]: {
    name: "Closeout",
    desc: "Sprint at perimeter shooter, then break down into choppy stutter steps with a high contest hand.",
    key: "C (Defense)",
  },
  [DefenseMove.SHADING_FORCING]: {
    name: "Shading / Forcing",
    desc: "Angle your body to cut off the ball handler's strong hand and funnel them toward the baseline/sideline.",
    key: "X (Defense)",
  },
  [DefenseMove.HAND_CHECK_ARM_BAR]: {
    name: "Hand-Checking / Arm-Barring",
    desc: "Use a legal bent forearm on the driver's hip to feel and slow their drive without pushing.",
    key: "Shift + R (Def)",
  },
  [DefenseMove.STUNT_DIG]: {
    name: "Stunt / Dig",
    desc: "Quickly lunge and swipe at the ball handler from one pass away to disrupt rhythm, then recover.",
    key: "Shift + X (Def)",
  },
  [DefenseMove.POKE_STEAL]: {
    name: "Poke-Check / Strip",
    desc: "Time a quick downward swipe at the ball during an exposed crossover, gather, or dribble.",
    key: "E / RB",
  },
  [DefenseMove.GLOVE_RIP_STRIP]: {
    name: "Glove Rip Strip",
    desc: "Timed two-hand downward rake toward the ball-handler's live dribble—devastating in backcourt traps & crossover gathers.",
    key: "U (Def) / Move Deck",
  },
  [DefenseMove.HIP_RIDE]: {
    name: "Hip-Ride",
    desc: "Stay glued to the driver's hip, matching speed and angle to steer them into a difficult layup.",
    key: "R (Defense)",
  },
  [DefenseMove.WALL_UP]: {
    name: "Wall-Up (Verticality)",
    desc: "Jump straight up near the rim with both arms vertical to absorb contact without fouling.",
    key: "G (Near Rim)",
  },
  [DefenseMove.SHOT_CONTEST]: {
    name: "Shot Contest",
    desc: "Raise your hand to the shooter's release point to alter trajectory without entering landing space.",
    key: "G (Perimeter)",
  },
  [DefenseMove.CHASE_DOWN_BLOCK]: {
    name: "Chase-Down Block",
    desc: "Trail a fast-break handler, match their strides, and time a high leap to pin the layup off the glass.",
    key: "G (Trailing)",
  },
  [DefenseMove.VOLLEY_SWAT_BLOCK]: {
    name: "Volley Swat Block",
    desc: "High-timing explosive rim rejection spiking shots cleanly back into play to ignite an instant fast break.",
    key: "O (Def) / Move Deck",
  },
  [DefenseMove.BASELINE_TRAP_CUTOFF]: {
    name: "Sideline Cutoff Clamp",
    desc: "Explosive lateral-diagonal backcourt/wing barrier slide that seals off the sideline corridor and drains handler stamina.",
    key: "K (Def) / Move Deck",
  },
  [DefenseMove.PULL_CHAIR_PERIMETER]: {
    name: "Pulling the Chair (Perimeter)",
    desc: "Offer brief resistance against a shoulder-lowering driver, then step back so they lose balance.",
    key: "Shift + T (Def)",
  },
  [DefenseMove.OVER_SCREEN]: {
    name: "Going Over the Screen",
    desc: "Fight over the top of the screen between screener and handler to deny an open three.",
    key: "1 (Def) / Movebook",
  },
  [DefenseMove.UNDER_SCREEN]: {
    name: "Going Under the Screen",
    desc: "Slide beneath the screener to cut off the driving lane and concede the perimeter jumper.",
    key: "Movebook",
  },
  [DefenseMove.HARD_HEDGE]: {
    name: "Hedge (Hard Show)",
    desc: "Screener's defender steps aggressively into handler's path to halt momentum before recovering.",
    key: "Shift + H (Def)",
  },
  [DefenseMove.SOFT_HEDGE]: {
    name: "Soft Hedge / Show",
    desc: "Step out briefly to show presence and slow the ball handler without overcommitting.",
    key: "H (Defense)",
  },
  [DefenseMove.DROP_COVERAGE]: {
    name: "Drop Coverage",
    desc: "Big sags back toward the paint to protect the rim and contain both handler and roller.",
    key: "3 (Def) / Movebook",
  },
  [DefenseMove.BLITZ_TRAP]: {
    name: "Blitz / Trap",
    desc: "Both on-ball and screener defenders aggressively trap the handler off the screen to force a turnover.",
    key: "4 (Def) / Movebook",
  },
  [DefenseMove.ICE_BLUE]: {
    name: "Ice / Blue (Side PnR)",
    desc: "Force the ball handler away from the middle screen toward the sideline while the big drops.",
    key: "Movebook",
  },
  [DefenseMove.SWITCH]: {
    name: "Switch",
    desc: "Two defenders exchange assignments immediately upon screen contact.",
    key: "2 (Def) / Movebook",
  },
  [DefenseMove.SCRAM_SWITCH]: {
    name: "Scram Switch",
    desc: "Smaller defender caught inside swaps off-ball with a bigger teammate before the post pass arrives.",
    key: "Movebook",
  },
  [DefenseMove.VEER_SWITCH]: {
    name: "Veer Switch",
    desc: "When beaten on a screen, peel off and switch onto the rolling big man instead of chasing.",
    key: "Movebook",
  },
  [DefenseMove.SLIP_LATE_SWITCH]: {
    name: "Slip / Late Switch",
    desc: "Switch at the last second as the offensive player picks up their dribble or rises to shoot.",
    key: "Movebook",
  },
  [DefenseMove.LOCK_AND_TRAIL]: {
    name: "Lock-and-Trail",
    desc: "Stay glued to a shooter's hip and chase them tightly through off-ball screens.",
    key: "Movebook",
  },
  [DefenseMove.TOP_LOCK]: {
    name: "Top-Lock",
    desc: "Position between shooter and screen to force a backdoor cut rather than a perimeter curl.",
    key: "Movebook",
  },
  [DefenseMove.BALL_YOU_MAN]: {
    name: "Ball-You-Man Positioning",
    desc: "Form a flat defensive triangle keeping eyes on both the basketball and your assigned man.",
    key: "Movebook",
  },
  [DefenseMove.FULL_DENIAL]: {
    name: "Full Denial",
    desc: "Place arm and leg in the passing lane face-guarding your man to deny any catch.",
    key: "J (Defense)",
  },
  [DefenseMove.THREE_QUARTER_DENIAL]: {
    name: "Three-Quarter Denial",
    desc: "Shade slightly ball-side with one active hand in the passing lane while keeping sight of the ball.",
    key: "Movebook",
  },
  [DefenseMove.GAP_HELP]: {
    name: "Gap / Help Positioning",
    desc: "Sag off non-ball handlers toward the paint to shrink the floor and clog driving lanes.",
    key: "Movebook",
  },
  [DefenseMove.HELP_AND_RECOVER]: {
    name: "Help-and-Recover",
    desc: "Leave your man to stop a driving ball handler in the paint, then sprint back to contest your shooter.",
    key: "L (Defense)",
  },
  [DefenseMove.X_OUT_ROTATION]: {
    name: "X-Out Rotation",
    desc: "Scramble rotation: closest perimeter defender covers the corner while helper sprints to the wing.",
    key: "Movebook",
  },
  [DefenseMove.CHARGE_DRAW]: {
    name: "Taking a Charge",
    desc: "Plant both feet stationary outside the restricted arc to absorb torso contact and draw an offensive foul.",
    key: "T (Defense)",
  },
  [DefenseMove.DEFLECTION]: {
    name: "Deflection",
    desc: "Tip or knock away an airborne pass using active hands in the passing lane.",
    key: "Movebook",
  },
  [DefenseMove.JUMP_PASSING_LANE]: {
    name: "Jumping the Passing Lane",
    desc: "Anticipate the pass, burst into the lane, and intercept the ball to spark a fast break.",
    key: "Shift + E (Def)",
  },
  [DefenseMove.FRONT_POST]: {
    name: "Fronting the Post",
    desc: "Stand directly between the post-up player and the basketball to deny the entry pass.",
    key: "Shift + J (Def)",
  },
  [DefenseMove.THREE_QUARTER_FRONT]: {
    name: "Three-Quarter Front",
    desc: "Put an arm and leg across the post player on the high or baseline side while guarding against a lob.",
    key: "Movebook",
  },
  [DefenseMove.POST_SWIM_DENIAL]: {
    name: "Full-Body Post Denial / Swim",
    desc: "Use an arm-over swim move to fight around a post player trying to seal you off.",
    key: "Movebook",
  },
  [DefenseMove.PULL_CHAIR_POST]: {
    name: "Pulling the Chair (Post)",
    desc: "Let a heavy post player lean against your forearm, then step back so they stumble or travel.",
    key: "Shift + T (Paint)",
  },
  [DefenseMove.PUSH_OFF_SPOT]: {
    name: "Pushing Off the Spot",
    desc: "Use low center of gravity and bent knees to push a post player's catch further from the basket.",
    key: "Movebook",
  },
  [DefenseMove.DIG_DOWN]: {
    name: "Digging Down",
    desc: "Perimeter defender drops into the post to swipe at the ball while the post player backs down.",
    key: "Movebook",
  },
  [DefenseMove.WEAK_SIDE_RIM_PROTECTION]: {
    name: "Weak-Side Rim Protection",
    desc: "Rotate across the paint from the weak side to block or alter a shot after primary containment breaks.",
    key: "Shift + L (Def)",
  },
  [DefenseMove.BOX_OUT]: {
    name: "Box-Out (Reverse Pivot)",
    desc: "Forearm contact + reverse pivot putting your backside into the opponent's hips to seal the rim.",
    key: "G (Rebound)",
  },
  [DefenseMove.SWIM_SPIN_COUNTER]: {
    name: "Swim-Around / Spin-Off Counter",
    desc: "Quick swim move or spin to escape an offensive player trying to pin you under the basket.",
    key: "Movebook",
  },
  [DefenseMove.WEDGE_CRASH]: {
    name: "Wedge / Crash",
    desc: "Pin an offensive rebounder deep under the backboard so they cannot jump for an offensive tip-in.",
    key: "Shift + G (Reb)",
  },
  [DefenseMove.MAN_TO_MAN]: {
    name: "Man-to-Man",
    desc: "Tight individual assignments across the court with balanced contest and help positioning.",
    key: "Timeout / Movebook",
  },
  [DefenseMove.DOUBLE_TEAM]: {
    name: "Double-Team / Trap",
    desc: "Two defenders corner the ball handler in the corner, post, or half-court to force a bad pass.",
    key: "Movebook",
  },
  [DefenseMove.RUN_AND_JUMP]: {
    name: "Run-and-Jump",
    desc: "An off-ball defender sprints to surprise-trap the handler while a third defender rotates.",
    key: "Movebook",
  },
  [DefenseMove.ZONE_2_3]: {
    name: "Zone Bump / Slide (2-3)",
    desc: "Two guards up top with three bigs shifting collectively in the paint as the ball moves.",
    key: "5 (Def) / Timeout",
  },
  [DefenseMove.ZONE_3_2]: {
    name: "Zone Bump / Slide (3-2)",
    desc: "Three perimeter defenders bump and slide across the arc with two bigs guarding the blocks.",
    key: "Movebook",
  },
  [DefenseMove.ZONE_1_3_1]: {
    name: "Zone Bump / Slide (1-3-1)",
    desc: "Aggressive trapping zone swarming the point, wings, and baseline corners on every pass.",
    key: "Movebook",
  },
  [DefenseMove.BOX_AND_ONE]: {
    name: "Box-and-1 (Junk Defense)",
    desc: "One defender plays strict denial on the top scorer while four pack a tight paint box.",
    key: "Movebook",
  },
  [DefenseMove.TRIANGLE_AND_TWO]: {
    name: "Triangle-and-2 (Junk Defense)",
    desc: "Two defenders lock down the top two scorers while three hold a tight paint triangle.",
    key: "Movebook",
  },
  [DefenseMove.FULL_COURT_PRESS]: {
    name: "Full-Court Press (Man/Zone)",
    desc: "Apply relentless 94-foot pressure immediately after inbounds to drain the shot clock.",
    key: "6 (Def) / Timeout",
  },
};

export function formatMoveTitle(name: string): string {
  return name
    .toLowerCase()
    .split("_")
    .map((word) => {
      if (word === "ucla") return "UCLA";
      if (word === "2" || word === "3" || word === "1") return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function getMoveMetadata(move: OffenseMove | DefenseMove): MoveMetadata {
  const isOffense = Object.values(OffenseMove).includes(move as OffenseMove);
  let category: OffenseCategoryKey | DefenseCategoryKey = isOffense ? "triple_threat" : "footwork_stance";

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
  const label = custom?.name || formatMoveTitle(move);
  const defaultDesc = isOffense
    ? `Execute authentic ${label} technique with tailored 3D footwork and ball physics.`
    : `Deploy ${label} defensive technique or coverage scheme across your squad.`;

  return {
    id: move,
    name: label,
    side: isOffense ? "offense" : "defense",
    category,
    description: custom?.desc || defaultDesc,
    keyHint: custom?.key || "Move Deck",
  };
}

export const ALL_OFFENSE_MOVES: OffenseMove[] = Object.values(OffenseMove);
export const ALL_DEFENSE_MOVES: DefenseMove[] = Object.values(DefenseMove);
