import test from "node:test";
import assert from "node:assert/strict";
import {
  SHOT_FEEDBACK_DURATION_SEC,
  evaluateShotTimingFromGameClock,
  tickShotFeedbackTimer,
} from "./shotTiming.ts";

test("Green release computed accurately from live match game clock delta", () => {
  const res = evaluateShotTimingFromGameClock({
    startGameClockSec: 118.45,
    releaseGameClockSec: 118.11, // 0.34s elapsed on game clock (dead center)
    startSimClockSec: 1.55,
    releaseSimClockSec: 1.89,
  });

  assert.equal(res.isGreen, true);
  assert.equal(res.tier, "green");
  assert.equal(res.label, "Green - Excellent!");
  assert.ok(res.accuracyPct >= 95);
});

test("Early and Late releases classify properly from game clock delta", () => {
  const early = evaluateShotTimingFromGameClock({
    startGameClockSec: 90.0,
    releaseGameClockSec: 89.84, // 0.16s elapsed -> -0.18s early
    startSimClockSec: 10,
    releaseSimClockSec: 10.16,
  });
  assert.equal(early.tier, "early");
  assert.equal(early.label, "Early");
  assert.equal(early.isGreen, false);

  const late = evaluateShotTimingFromGameClock({
    startGameClockSec: 90.0,
    releaseGameClockSec: 89.48, // 0.52s elapsed -> +0.18s late
    startSimClockSec: 10,
    releaseSimClockSec: 10.52,
  });
  assert.equal(late.tier, "late");
  assert.equal(late.label, "Late");
  assert.equal(late.isGreen, false);
});

test("Falls back to simulation clock cleanly when quarter game clock is paused in practice", () => {
  const res = evaluateShotTimingFromGameClock({
    startGameClockSec: 120,
    releaseGameClockSec: 120, // frozen in practice
    startSimClockSec: 25.0,
    releaseSimClockSec: 25.33,
  });

  assert.equal(res.isGreen, true);
  assert.equal(res.label, "Green - Excellent!");
});

test("Shot feedback timer lasts exactly 1.5 seconds across game clock ticks", () => {
  let timer = SHOT_FEEDBACK_DURATION_SEC;
  assert.equal(timer, 1.5);

  let step = tickShotFeedbackTimer(timer, 0.75);
  assert.equal(step.visible, true);
  assert.equal(step.remainingSec, 0.75);

  step = tickShotFeedbackTimer(step.remainingSec, 0.75);
  assert.equal(step.visible, false);
  assert.equal(step.remainingSec, 0);
});
