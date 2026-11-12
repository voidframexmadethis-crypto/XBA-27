import test from "node:test";
import assert from "node:assert/strict";
import {
  SHOT_CLOCK_FULL,
  getShotClockUrgency,
  formatShotClock,
  calculateShotClockProgress,
  resetShotClock,
  tickShotClock,
} from "./shotClock.ts";

test("getShotClockUrgency categorizes thresholds correctly", () => {
  assert.equal(getShotClockUrgency(24.0), "normal");
  assert.equal(getShotClockUrgency(15.2), "normal");
  assert.equal(getShotClockUrgency(10.0), "warning");
  assert.equal(getShotClockUrgency(7.5), "warning");
  assert.equal(getShotClockUrgency(5.0), "critical");
  assert.equal(getShotClockUrgency(2.3), "critical");
  assert.equal(getShotClockUrgency(0.0), "expired");
  assert.equal(getShotClockUrgency(-0.5), "expired");
});

test("formatShotClock displays ceiling for >5s and decimals for <=5s", () => {
  assert.equal(formatShotClock(24.0), "24");
  assert.equal(formatShotClock(10.1), "11");
  assert.equal(formatShotClock(6.0), "6");
  assert.equal(formatShotClock(5.0), "5.0");
  assert.equal(formatShotClock(4.82), "4.8");
  assert.equal(formatShotClock(0.9), "0.9");
  assert.equal(formatShotClock(0.0), "0.0");
  assert.equal(formatShotClock(-1.0), "0.0");
});

test("calculateShotClockProgress calculates percentage smoothly", () => {
  assert.equal(calculateShotClockProgress(24), 100);
  assert.equal(calculateShotClockProgress(12), 50);
  assert.equal(calculateShotClockProgress(6), 25);
  assert.equal(calculateShotClockProgress(0), 0);
  assert.equal(calculateShotClockProgress(-5), 0);
  assert.equal(calculateShotClockProgress(30), 100);
});

test("resetShotClock resets to 24s", () => {
  assert.equal(resetShotClock("shot_attempt"), SHOT_CLOCK_FULL);
  assert.equal(resetShotClock("basket_made"), SHOT_CLOCK_FULL);
  assert.equal(resetShotClock("turnover"), SHOT_CLOCK_FULL);
});

test("tickShotClock counts down and triggers beeps at critical seconds", () => {
  const t1 = tickShotClock(24.0, 1.0);
  assert.equal(t1.newTime, 23.0);
  assert.equal(t1.expired, false);
  assert.equal(t1.shouldBeep, false);

  // Crossing from 5.2 to 4.8 should trigger a beep for 5s threshold
  const t2 = tickShotClock(5.2, 0.4);
  assert.equal(t2.shouldBeep, true);
  assert.equal(t2.beepSecond, 5);
  assert.equal(t2.urgency, "critical");

  // Crossing into 0 should trigger expired
  const t3 = tickShotClock(0.2, 0.3);
  assert.equal(t3.newTime, 0);
  assert.equal(t3.expired, true);
  assert.equal(t3.urgency, "expired");

  // Ticking while paused does not decrement
  const t4 = tickShotClock(18.5, 0.5, true);
  assert.equal(t4.newTime, 18.5);
  assert.equal(t4.expired, false);
});
