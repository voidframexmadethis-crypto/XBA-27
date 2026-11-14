import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import type { DefenseMove, OffenseMove } from "./basketballMoves.ts";
import {
  GLOBAL_TOURNAMENTS,
  WORLD_CITIES,
  getCityById,
  resolveArenaAtmosphere,
} from "./worldTour.ts";
import {
  NATIONAL_TOUR_STOPS,
  createInitialNationalTourState,
  resolveNationalTourStopMatch,
} from "./nationalTour.ts";
import { computeDefenseAiDecision } from "./defenseAi.ts";
import {
  SIGNATURE_DUNKS,
  getDefaultCareerStats,
  recordMatchToCareer,
  unlockProgressionItem,
} from "./progression.ts";

test("1. World Tour US expansion includes 9 new US cities and USA Classic tournaments", () => {
  const expectedNewCities = [
    "us_sf",
    "us_seattle",
    "us_dallas",
    "us_houston",
    "us_atlanta",
    "us_phoenix",
    "us_denver",
    "us_philly",
    "us_neworleans",
  ];
  for (const id of expectedNewCities) {
    const city = getCityById(id);
    assert.equal(city.id, id, `Expected US city ${id} to exist`);
  }
  const usCities = WORLD_CITIES.filter((c) => c.id.startsWith("us_"));
  assert.ok(usCities.length >= 13, `Expected >=13 US cities, found ${usCities.length}`);

  const mensUsaCup = GLOBAL_TOURNAMENTS.find((t) => t.id === "cup_usa_pro_classic");
  const womensUsaCup = GLOBAL_TOURNAMENTS.find((t) => t.id === "cup_womens_usa_classic");
  assert.ok(mensUsaCup, "Expected Men's USA Pro Classic tournament");
  assert.ok(womensUsaCup, "Expected Women's USA Classic tournament");
  assert.equal(mensUsaCup?.division, "mens");
  assert.equal(womensUsaCup?.division, "womens");
});

test("2. National Tour defines 13 US stops, tracks stop challenges, and unlocks Tiki Tiki & Championship", () => {
  assert.equal(NATIONAL_TOUR_STOPS.length, 13);
  let tour = createInitialNationalTourState("mens");
  assert.equal(tour.currentStopIndex, 0);

  // Stop 1 win (win challenge)
  const stop1 = resolveNationalTourStopMatch(tour, NATIONAL_TOUR_STOPS[0].id, 24, 18, {
    steals: 0,
    threes: 0,
    dunks: 0,
  });
  assert.equal(stop1.won, true);
  assert.equal(stop1.challengeCleared, true);
  assert.equal(stop1.unlockTikiTiki, false);
  tour = stop1.nextState;

  // Stop 2 win with 2 steals -> clears challenge AND unlocks Tiki Tiki Slam (>= 2 wins)
  const stop2 = resolveNationalTourStopMatch(tour, NATIONAL_TOUR_STOPS[1].id, 30, 22, {
    steals: 3,
    threes: 1,
    dunks: 1,
  });
  assert.equal(stop2.won, true);
  assert.equal(stop2.challengeCleared, true);
  assert.equal(stop2.unlockTikiTiki, true);
  tour = stop2.nextState;

  // Final stop win crowns National Tour Champion
  const finalsStop = NATIONAL_TOUR_STOPS[NATIONAL_TOUR_STOPS.length - 1];
  const finalsRes = resolveNationalTourStopMatch(tour, finalsStop.id, 42, 34, {
    steals: 2,
    threes: 3,
    dunks: 2,
  });
  assert.equal(finalsRes.wonChampionship, true);
  assert.equal(finalsRes.nextState.championshipsWon, 1);
  assert.ok(finalsRes.nextState.championUnlockedAt);
});

test("3. Three advanced defensive moves & Tiki Tiki Slam are registered in basketballMoves.ts", () => {
  const movesSource = fs.readFileSync(path.join(process.cwd(), "lib", "basketballMoves.ts"), "utf8");
  for (const mv of [
    "GLOVE_RIP_STRIP",
    "VOLLEY_SWAT_BLOCK",
    "BASELINE_TRAP_CUTOFF",
    "TIKI_TIKI_SLAM",
  ]) {
    assert.ok(movesSource.includes(mv), `Expected ${mv} to be defined in basketballMoves.ts`);
  }
  const typedTiki: OffenseMove = "TIKI_TIKI_SLAM" as OffenseMove;
  const typedRip: DefenseMove = "GLOVE_RIP_STRIP" as DefenseMove;
  assert.equal(typedTiki, "TIKI_TIKI_SLAM");
  assert.equal(typedRip, "GLOVE_RIP_STRIP");
});

test("4. Defensive Backcourt Mechanics trigger 94ft press, cutoff clamp, glove rip, recovery burst & volley swat", () => {
  // Handler dribbling in own backcourt with defender squared up at cutoff distance -> BASELINE_TRAP_CUTOFF
  const cutoff = computeDefenseAiDecision({
    defenderIdx: 0,
    defenderPos: { x: 5.4, z: 1.0 },
    defenderVel: { x: 0, z: 0 },
    defenderHeight: 0,
    defenderRole: "PG",
    ourHoopX: -14,
    ballPos: { x: 7.4, z: 1.4 },
    ballHeight: 1.0,
    ballOwnerPos: { x: 7.4, z: 1.4 },
    ballOwnerVel: { x: -2.5, z: 0.4 },
    matchupPos: { x: 7.4, z: 1.4 },
    isOnBall: true,
    isNearestToBallHandler: true,
    shotInFlight: false,
    passInFlight: false,
    scheme: "FULL_COURT_PRESS" as DefenseMove,
    defenseTactic: "press",
    timeSec: 5,
    cooldownReady: true,
  });
  assert.equal(cutoff.isBackcourtPress, true);
  assert.equal(cutoff.move, "BASELINE_TRAP_CUTOFF" as DefenseMove);
  assert.equal(cutoff.activateCutoffClamp, true);

  // Close stationary handler in backcourt -> GLOVE_RIP_STRIP
  const rip = computeDefenseAiDecision({
    defenderIdx: 0,
    defenderPos: { x: 7.0, z: 1.2 },
    defenderVel: { x: 0, z: 0 },
    defenderHeight: 0,
    defenderRole: "PG",
    ourHoopX: -14,
    ballPos: { x: 7.9, z: 1.4 },
    ballHeight: 1.0,
    ballOwnerPos: { x: 7.9, z: 1.4 },
    ballOwnerVel: { x: -0.5, z: 0 },
    matchupPos: { x: 7.9, z: 1.4 },
    isOnBall: true,
    isNearestToBallHandler: true,
    shotInFlight: false,
    passInFlight: false,
    scheme: "FULL_COURT_PRESS" as DefenseMove,
    defenseTactic: "press",
    timeSec: 6,
    cooldownReady: true,
  });
  assert.equal(rip.move, "GLOVE_RIP_STRIP" as DefenseMove);
  assert.equal(rip.triggerGloveRip, true);

  // Defender beaten behind handler in backcourt -> explosive recovery burst
  const recovery = computeDefenseAiDecision({
    defenderIdx: 0,
    defenderPos: { x: 9.8, z: 0.5 },
    defenderVel: { x: 0, z: 0 },
    defenderHeight: 0,
    defenderRole: "PG",
    ourHoopX: -14,
    ballPos: { x: 6.0, z: 0.8 },
    ballHeight: 1.0,
    ballOwnerPos: { x: 6.0, z: 0.8 },
    ballOwnerVel: { x: -4.2, z: 0 },
    matchupPos: { x: 6.0, z: 0.8 },
    isOnBall: true,
    isNearestToBallHandler: true,
    shotInFlight: false,
    passInFlight: false,
    scheme: "FULL_COURT_PRESS" as DefenseMove,
    defenseTactic: "press",
    timeSec: 7,
    cooldownReady: true,
  });
  assert.equal(recovery.backcourtRecoveryBurst, true);
  assert.ok(recovery.speed >= 12.2);

  // Perimeter shot in flight -> VOLLEY_SWAT_BLOCK
  const swat = computeDefenseAiDecision({
    defenderIdx: 1,
    defenderPos: { x: -8.2, z: 1.5 },
    defenderVel: { x: 0, z: 0 },
    defenderHeight: 0,
    defenderRole: "SG",
    ourHoopX: -14,
    ballPos: { x: -7.1, z: 1.4 },
    ballHeight: 2.6,
    ballOwnerPos: { x: -7.1, z: 1.4 },
    ballOwnerVel: { x: 0, z: 0 },
    matchupPos: { x: -7.1, z: 1.4 },
    isOnBall: true,
    isNearestToBallHandler: true,
    shotInFlight: true,
    passInFlight: false,
    scheme: "MAN_TO_MAN" as DefenseMove,
    defenseTactic: "balanced",
    timeSec: 9,
    cooldownReady: true,
  });
  assert.equal(swat.move, "VOLLEY_SWAT_BLOCK" as DefenseMove);
  assert.equal(swat.triggerVolleySwat, true);
});

test("5. Night Games Everywhere resolves night and day arena lighting cleanly for every city", () => {
  const nyc = getCityById("us_nyc");
  const nightAtm = resolveArenaAtmosphere(nyc, "night");
  assert.equal(nightAtm.isDaytime, false);
  assert.equal(nightAtm.phase, "night");
  assert.equal(nightAtm.starOpacity, 1);
  assert.ok(nightAtm.spotIntensity >= 3.0);

  const dayAtm = resolveArenaAtmosphere(nyc, "day");
  assert.equal(dayAtm.isDaytime, true);
  assert.equal(dayAtm.starOpacity, 0);
});

test("6. Tiki Tiki Signature Slam is unlockable in progression and defaults to standard dunk until unlocked", () => {
  const defaults = getDefaultCareerStats();
  assert.equal(defaults.equippedSignatureDunk, "dunk_standard");
  assert.equal(defaults.unlockedIds.includes("dunk_tiki_tiki"), false);

  const tikiItem = SIGNATURE_DUNKS.find((d) => d.id === "dunk_tiki_tiki");
  assert.ok(tikiItem);
  assert.equal(tikiItem?.colorHex, "#10b981");
  assert.equal(tikiItem?.secondaryHex, "#facc15");

  // Reaching 20 career points unlocks Tiki Tiki Slam cleanly
  const res = recordMatchToCareer({ pts: 22, reb: 2, ast: 2, fouls: 0, won: true });
  assert.ok(res.updatedStats.unlockedIds.includes("dunk_tiki_tiki"));

  // Direct unlock + autoEquip works (for National Tour milestone)
  const direct = unlockProgressionItem("dunk_tiki_tiki", true);
  assert.ok(direct.stats.unlockedIds.includes("dunk_tiki_tiki"));
  assert.equal(direct.stats.equippedSignatureDunk, "dunk_tiki_tiki");
});
