export const SHOT_CLOCK_FULL = 24.0;
export const SHOT_CLOCK_WARNING_THRESHOLD = 10.0;
export const SHOT_CLOCK_CRITICAL_THRESHOLD = 5.0;

export type ShotClockUrgency = "normal" | "warning" | "critical" | "expired";

export type ResetReason =
  | "shot_attempt"
  | "basket_made"
  | "turnover"
  | "quarter_start"
  | "foul"
  | "offensive_rebound";

/**
 * Returns the urgency level of the shot clock.
 */
export function getShotClockUrgency(seconds: number): ShotClockUrgency {
  if (seconds <= 0.0) return "expired";
  if (seconds <= SHOT_CLOCK_CRITICAL_THRESHOLD) return "critical";
  if (seconds <= SHOT_CLOCK_WARNING_THRESHOLD) return "warning";
  return "normal";
}

/**
 * Formats shot clock time in authentic NBA broadcast fashion:
 * - Shows 1 decimal place under 5 seconds (e.g., "4.8", "2.1")
 * - Shows whole integer ceiling when above 5 seconds (e.g., "24", "14", "6")
 * - Clamps at 0.0
 */
export function formatShotClock(seconds: number): string {
  if (seconds <= 0) return "0.0";
  if (seconds <= SHOT_CLOCK_CRITICAL_THRESHOLD) {
    return (Math.max(0, Math.floor(seconds * 10) / 10)).toFixed(1);
  }
  return Math.ceil(seconds).toString();
}

/**
 * Calculates progress percentage (0 to 100) from 24 seconds down to 0.
 */
export function calculateShotClockProgress(seconds: number, maxSeconds = SHOT_CLOCK_FULL): number {
  const clamped = Math.max(0, Math.min(seconds, maxSeconds));
  return (clamped / maxSeconds) * 100;
}

/**
 * Resets shot clock to 24s (or custom max).
 */
export function resetShotClock(_reason?: ResetReason, max = SHOT_CLOCK_FULL): number {
  return max;
}

export interface TickResult {
  newTime: number;
  expired: boolean;
  urgency: ShotClockUrgency;
  shouldBeep: boolean;
  beepSecond?: number;
}

/**
 * Ticks the shot clock down by dt seconds.
 * Detects integer boundaries for urgency countdown beeps (5, 4, 3, 2, 1).
 */
export function tickShotClock(currentTime: number, dt: number, isPaused = false): TickResult {
  if (isPaused || currentTime <= 0) {
    return {
      newTime: Math.max(0, currentTime),
      expired: currentTime <= 0,
      urgency: getShotClockUrgency(currentTime),
      shouldBeep: false,
    };
  }

  const newTime = Math.max(0, currentTime - dt);
  const expired = newTime <= 0;
  const urgency = getShotClockUrgency(newTime);

  // Check if an integer boundary between 1 and 5 was crossed
  let shouldBeep = false;
  let beepSecond: number | undefined;

  const prevInt = Math.ceil(currentTime);
  const newInt = Math.ceil(newTime);

  if (prevInt !== newInt && newInt >= 1 && newInt <= 5) {
    shouldBeep = true;
    beepSecond = newInt;
  }

  return {
    newTime,
    expired,
    urgency,
    shouldBeep,
    beepSecond,
  };
}
