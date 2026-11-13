import { loadVersionedState, SAVE_KEYS, saveVersionedState } from "./saveSystem.ts";

export type DrillId =
  | "free_throws"
  | "three_point_contest"
  | "dunk_contest"
  | "layup_circuit"
  | "defensive_lockdown"
  | "passing_vision"
  | "dribbling_gauntlet"
  | "shooting_accuracy";

export interface TrainingDrillDefinition {
  id: DrillId;
  title: string;
  category: "Shooting" | "Finishing" | "Playmaking" | "Defense";
  difficulty: "Rookie" | "Pro" | "All-Star" | "Hall of Fame";
  durationSec: number;
  targetReps: number;
  goalLabel: string;
  description: string;
  controlsHint: string;
  xpReward: number;
}

export interface DrillRecord {
  drillId: DrillId;
  bestScore: number;
  bestAccuracyPct: number;
  completions: number;
  lastPlayedAt: string;
}

export interface TrainingAcademyState {
  records: Record<DrillId, DrillRecord>;
  totalDrillsCompleted: number;
  totalAcademyXp: number;
}

export const TRAINING_DRILLS: TrainingDrillDefinition[] = [
  {
    id: "free_throws",
    title: "Clutch Free-Throw Pressure",
    category: "Shooting",
    difficulty: "Rookie",
    durationSec: 45,
    targetReps: 10,
    goalLabel: "Sink 8+ / 10 Free Throws",
    description: "Lock into the green shot meter from the 15-foot stripe with zero clock pressure.",
    controlsHint: "Hold & release SHOOT (Space / Hold Button) at peak arc.",
    xpReward: 120,
  },
  {
    id: "three_point_contest",
    title: "3-Point Shootout Rack",
    category: "Shooting",
    difficulty: "All-Star",
    durationSec: 60,
    targetReps: 15,
    goalLabel: "Drain Deep Arc Triples",
    description: "Catch-and-shoot rhythm around the perimeter arc against a 60-second shootout timer.",
    controlsHint: "Step outside the 3PT arc and release clean greens with SHOOT.",
    xpReward: 200,
  },
  {
    id: "dunk_contest",
    title: "Rim-Rocker Dunk Contest",
    category: "Finishing",
    difficulty: "Pro",
    durationSec: 60,
    targetReps: 6,
    goalLabel: "Execute 6 High-Flying Slams",
    description: "Build momentum with Turbo Sprint and finish acrobatic slams inside the restricted area.",
    controlsHint: "Hold SPRINT (Shift) driving into the paint and press DUNK / SHOOT.",
    xpReward: 190,
  },
  {
    id: "layup_circuit",
    title: "Crafty Layup & Floater Circuit",
    category: "Finishing",
    difficulty: "Rookie",
    durationSec: 50,
    targetReps: 8,
    goalLabel: "Convert 8 Rim Finishes",
    description: "Mix Euro-steps, finger rolls, and floaters off glass from both wings.",
    controlsHint: "Drive diagonally into the key or trigger Euro-Step / Floater from Move Deck.",
    xpReward: 150,
  },
  {
    id: "defensive_lockdown",
    title: "Perimeter Lockdown & Steals",
    category: "Defense",
    difficulty: "All-Star",
    durationSec: 55,
    targetReps: 5,
    goalLabel: "Force 5 Stops, Steals or Blocks",
    description: "Mirror the ball handler in defensive stance, time poke-checks, and contest jumpers vertically.",
    controlsHint: "Hold GUARD (C / Guard button) + STEAL (E) or BLOCK (R).",
    xpReward: 210,
  },
  {
    id: "passing_vision",
    title: "Dime Vision & Assist Targets",
    category: "Playmaking",
    difficulty: "Pro",
    durationSec: 50,
    targetReps: 8,
    goalLabel: "Deliver 8 Clean Assists",
    description: "Draw help defenders and whip crisp chest, skip, and touch passes to open teammates.",
    controlsHint: "Press PASS (B) when a teammate flashes into open shooting space.",
    xpReward: 165,
  },
  {
    id: "dribbling_gauntlet",
    title: "Combo Handle Gauntlet",
    category: "Playmaking",
    difficulty: "Hall of Fame",
    durationSec: 45,
    targetReps: 12,
    goalLabel: "Chain 12 Dribble Combos",
    description: "Chain crossovers, shammgods, behind-the-back wraps, and spins cleanly without losing balance.",
    controlsHint: "Tap CROSSOVER (X) or tap Move Deck dribble combos in rhythm.",
    xpReward: 240,
  },
  {
    id: "shooting_accuracy",
    title: "Deadeye Mid-Range Accuracy",
    category: "Shooting",
    difficulty: "Pro",
    durationSec: 50,
    targetReps: 10,
    goalLabel: "70%+ Make Accuracy",
    description: "Hit pull-ups, step-backs, and corner fadeaways under strict shot-efficiency scoring.",
    controlsHint: "Time green releases from elbow and baseline mid-range zones.",
    xpReward: 185,
  },
];

export function createInitialTrainingState(): TrainingAcademyState {
  const records = {} as Record<DrillId, DrillRecord>;
  for (const d of TRAINING_DRILLS) {
    records[d.id] = {
      drillId: d.id,
      bestScore: 0,
      bestAccuracyPct: 0,
      completions: 0,
      lastPlayedAt: "",
    };
  }
  return {
    records,
    totalDrillsCompleted: 0,
    totalAcademyXp: 0,
  };
}

export function recordTrainingDrillResult(
  state: TrainingAcademyState,
  drillId: DrillId,
  score: number,
  accuracyPct: number,
  xpEarned: number
): TrainingAcademyState {
  const prev = state.records[drillId] || {
    drillId,
    bestScore: 0,
    bestAccuracyPct: 0,
    completions: 0,
    lastPlayedAt: "",
  };
  return {
    records: {
      ...state.records,
      [drillId]: {
        drillId,
        bestScore: Math.max(prev.bestScore, score),
        bestAccuracyPct: Math.max(prev.bestAccuracyPct, Math.round(accuracyPct)),
        completions: prev.completions + 1,
        lastPlayedAt: new Date().toISOString(),
      },
    },
    totalDrillsCompleted: state.totalDrillsCompleted + 1,
    totalAcademyXp: state.totalAcademyXp + xpEarned,
  };
}

export function loadTrainingState(): TrainingAcademyState {
  return loadVersionedState<TrainingAcademyState>(
    SAVE_KEYS.TRAINING,
    createInitialTrainingState,
    (d): d is TrainingAcademyState =>
      Boolean(d && typeof d === "object" && (d as TrainingAcademyState).records)
  ).data;
}

export function saveTrainingState(state: TrainingAcademyState): void {
  saveVersionedState(SAVE_KEYS.TRAINING, state);
}
