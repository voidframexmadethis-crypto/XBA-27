export type ShotTimingTier =
  | "early"
  | "slightly_early"
  | "green"
  | "slightly_late"
  | "late";

export interface ShotTimingInput {
  startGameClockSec: number;
  releaseGameClockSec: number;
  startSimClockSec: number;
  releaseSimClockSec: number;
  idealReleaseSec?: number;
  cyclePeriodSec?: number;
  greenWindowNormalized?: number;
  forgiveQuickTap?: boolean;
}

export interface ShotTimingEvaluation {
  label: string;
  tier: ShotTimingTier;
  isGreen: boolean;
  color: string;
  elapsedSec: number;
  deltaSec: number;
  accuracyPct: number;
  normalizedMeter: number;
}

export const SHOT_FEEDBACK_DURATION_SEC = 1.5;

const clampNum = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/**
 * Computes jump shot release timing and accuracy using the elapsed delta from
 * the match game clock (or active simulation clock fallback in practice modes).
 */
export function evaluateShotTimingFromGameClock(
  input: ShotTimingInput
): ShotTimingEvaluation {
  const cyclePeriodSec = input.cyclePeriodSec ?? 0.68;
  const idealReleaseSec = input.idealReleaseSec ?? cyclePeriodSec * 0.5;
  const greenWindowNormalized = input.greenWindowNormalized ?? 0.105;

  const gameClockDelta = input.startGameClockSec - input.releaseGameClockSec;
  const simClockDelta = input.releaseSimClockSec - input.startSimClockSec;
  const rawElapsedSec = Math.max(
    0,
    gameClockDelta > 0.0005 ? gameClockDelta : simClockDelta
  );

  // Forgive ultra-fast catch-and-shoot button taps (< 0.14s) so quick releases stay responsive
  const effectiveElapsedSec =
    input.forgiveQuickTap && rawElapsedSec < 0.14
      ? idealReleaseSec
      : rawElapsedSec;

  const deltaSec = effectiveElapsedSec - idealReleaseSec;
  const greenHalfWindowSec = greenWindowNormalized * cyclePeriodSec;
  const normalizedMeter = clampNum(0.5 + deltaSec / cyclePeriodSec, 0, 1);
  const accuracyPct = Math.round(
    clampNum(1 - Math.abs(deltaSec) / (cyclePeriodSec * 0.5), 0, 1) * 100
  );

  const isGreen = Math.abs(deltaSec) <= greenHalfWindowSec;
  if (isGreen) {
    return {
      label: "Green - Excellent!",
      tier: "green",
      isGreen: true,
      color: "#22c55e",
      elapsedSec: rawElapsedSec,
      deltaSec,
      accuracyPct: Math.max(92, accuracyPct),
      normalizedMeter,
    };
  }

  if (deltaSec < -0.135) {
    return {
      label: "Early",
      tier: "early",
      isGreen: false,
      color: "#f59e0b",
      elapsedSec: rawElapsedSec,
      deltaSec,
      accuracyPct,
      normalizedMeter,
    };
  }

  if (deltaSec < -greenHalfWindowSec) {
    return {
      label: "Slightly Early",
      tier: "slightly_early",
      isGreen: false,
      color: "#38bdf8",
      elapsedSec: rawElapsedSec,
      deltaSec,
      accuracyPct,
      normalizedMeter,
    };
  }

  if (deltaSec <= 0.125) {
    return {
      label: "Slightly Late",
      tier: "slightly_late",
      isGreen: false,
      color: "#38bdf8",
      elapsedSec: rawElapsedSec,
      deltaSec,
      accuracyPct,
      normalizedMeter,
    };
  }

  return {
    label: "Late",
    tier: "late",
    isGreen: false,
    color: "#ef4444",
    elapsedSec: rawElapsedSec,
    deltaSec,
    accuracyPct,
    normalizedMeter,
  };
}

/**
 * Advances the 1.5-second post-animation overlay countdown using the game loop dt.
 */
export function tickShotFeedbackTimer(
  remainingSec: number,
  dt: number
): { remainingSec: number; visible: boolean } {
  if (remainingSec <= 0) {
    return { remainingSec: 0, visible: false };
  }
  const next = Math.max(0, remainingSec - Math.max(0, dt));
  return { remainingSec: next, visible: next > 0 };
}
