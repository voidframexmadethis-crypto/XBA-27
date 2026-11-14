"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Flag,
  MapPin,
  Trophy,
  Play,
  X,
  CheckCircle2,
  Lock,
  Sparkles,
  Moon,
  Sun,
  Clock,
  Target,
} from "lucide-react";
import {
  NATIONAL_TOUR_STOPS,
  NationalTourRegion,
  NationalTourState,
  NationalTourStop,
} from "@/lib/nationalTour";
import { getCityById, WorldCity } from "@/lib/worldTour";
import type { ProLeagueDivision } from "@/lib/leagueData";
import type { NightGameMode } from "@/lib/customization";

interface NationalTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourState: NationalTourState;
  activeDivision: ProLeagueDivision;
  onChangeDivision: (division: ProLeagueDivision) => void;
  nightGameMode: NightGameMode;
  onChangeNightGameMode: (mode: NightGameMode) => void;
  tikiTikiUnlocked: boolean;
  onStartStopMatch: (stop: NationalTourStop, city: WorldCity) => void;
}

const REGION_TABS: { id: NationalTourRegion | "all"; label: string }[] = [
  { id: "all", label: "All 13 Stops" },
  { id: "northeast", label: "Northeast" },
  { id: "midwest", label: "Midwest" },
  { id: "south", label: "South" },
  { id: "west", label: "West Coast" },
  { id: "finals", label: "Finals" },
];

export default function NationalTourModal({
  isOpen,
  onClose,
  tourState,
  activeDivision,
  onChangeDivision,
  nightGameMode,
  onChangeNightGameMode,
  tikiTikiUnlocked,
  onStartStopMatch,
}: NationalTourModalProps) {
  const [regionFilter, setRegionFilter] = useState<NationalTourRegion | "all">("all");
  const initialStop =
    NATIONAL_TOUR_STOPS[Math.min(tourState.currentStopIndex, NATIONAL_TOUR_STOPS.length - 1)] ||
    NATIONAL_TOUR_STOPS[0];
  const [selectedStopId, setSelectedStopId] = useState<string>(initialStop.id);

  const visibleStops = useMemo(() => {
    if (regionFilter === "all") return NATIONAL_TOUR_STOPS;
    return NATIONAL_TOUR_STOPS.filter((s) => s.region === regionFilter);
  }, [regionFilter]);

  const selectedStop = useMemo(
    () => NATIONAL_TOUR_STOPS.find((s) => s.id === selectedStopId) || initialStop,
    [selectedStopId, initialStop]
  );

  const selectedCity = getCityById(selectedStop.cityId);
  const completedCount = Object.values(tourState.stopsCompleted).filter((s) => s.completed).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[175] flex items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 16 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl bg-neutral-950 border border-amber-500/35 rounded-3xl shadow-[0_0_80px_rgba(245,158,11,0.2)] text-white flex flex-col max-h-[92dvh] my-auto overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#1f1308] via-[#101829] to-[#080a0f] border-b border-white/10 flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 via-amber-500 to-blue-600 flex items-center justify-center text-white shadow-lg border border-white/25">
                  <Flag className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg sm:text-2xl font-black italic uppercase tracking-tight">
                      USA NATIONAL TOUR CHAMPIONSHIP
                    </h2>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded bg-amber-400 text-black">
                      {completedCount} / {NATIONAL_TOUR_STOPS.length} CITIES CLEARED
                    </span>
                  </div>
                  <p className="text-xs text-white/65">
                    Coast-to-Coast Regional Conferences · Complete 2+ Tour Stops to Unlock Tiki Tiki Signature Slam
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/15">
                  {(["mens", "womens"] as const).map((div) => (
                    <button
                      key={div}
                      type="button"
                      onClick={() => onChangeDivision(div)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase cursor-pointer transition-colors ${
                        activeDivision === div
                          ? div === "womens"
                            ? "bg-teal-400 text-black"
                            : "bg-amber-400 text-black"
                          : "text-white/65 hover:text-white"
                      }`}
                    >
                      {div === "womens" ? "Women's" : "Men's"}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close National Tour"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/75 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Region Filter & Progress Bar */}
            <div className="px-6 py-3 bg-neutral-900 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-1.5">
                {REGION_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRegionFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase cursor-pointer transition-colors ${
                      regionFilter === tab.id
                        ? "bg-amber-500 text-black"
                        : "bg-white/5 hover:bg-white/10 text-white/75"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Tiki Tiki Slam: {tikiTikiUnlocked ? "UNLOCKED" : `${Math.min(2, completedCount)}/2 Stops`}
                </span>
                <span className="text-amber-300 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  Titles: {tourState.championshipsWon}
                </span>
              </div>
            </div>

            {/* Body Grid */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Stop List */}
              <div className="lg:col-span-7 space-y-2.5">
                {visibleStops.map((stop) => {
                  const city = getCityById(stop.cityId);
                  const prog = tourState.stopsCompleted[stop.id];
                  const unlocked = stop.stopNumber - 1 <= tourState.currentStopIndex || Boolean(prog?.completed);
                  const isSelected = selectedStop.id === stop.id;
                  const oppName = activeDivision === "womens" ? stop.opponentNameWomens : stop.opponentNameMens;

                  return (
                    <button
                      key={stop.id}
                      type="button"
                      onClick={() => setSelectedStopId(stop.id)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-gradient-to-r from-amber-500/20 to-neutral-900 border-amber-400 shadow-lg"
                          : unlocked
                            ? "bg-white/5 border-white/10 hover:bg-white/10"
                            : "bg-black/40 border-white/5 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                            prog?.completed
                              ? "bg-emerald-500 text-black"
                              : stop.isChampionshipFinal
                                ? "bg-amber-400 text-black"
                                : unlocked
                                  ? "bg-white/15 text-white"
                                  : "bg-white/5 text-white/40"
                          }`}
                        >
                          {prog?.completed ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : !unlocked ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            `#${stop.stopNumber}`
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm uppercase truncate">
                              {city.name} · {oppName}
                            </span>
                            {stop.isChampionshipFinal && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-black uppercase">
                                Finals
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-white/60 truncate">
                            {stop.regionLabel} · {stop.challengeTitle}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-amber-300 tabular-nums">
                          {stop.opponentOvr} OVR
                        </div>
                        <div className="text-[10px] font-bold text-white/50">
                          +{stop.xpReward} XP
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Selected Stop Spotlight */}
              <div className="lg:col-span-5 rounded-3xl bg-gradient-to-b from-white/[0.06] to-black/70 border border-white/15 p-5 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                      Stop #{selectedStop.stopNumber} · {selectedStop.regionLabel}
                    </span>
                    <span className="text-xs font-black px-2 py-0.5 rounded bg-white/10">
                      {selectedStop.opponentOvr} OVR
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl">{selectedCity.flag}</span>
                      <div>
                        <h3 className="text-xl font-black uppercase leading-tight">
                          {selectedCity.name}
                        </h3>
                        <div className="text-xs text-cyan-300 font-bold flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{selectedCity.arenaName}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Opponent & Challenge */}
                  <div className="p-4 rounded-2xl bg-black/55 border border-white/10 space-y-2.5">
                    <div className="text-xs font-black uppercase text-white/50">
                      Matchup Scout ({activeDivision === "womens" ? "Women's" : "Men's"})
                    </div>
                    <div className="text-sm font-black text-white">
                      {activeDivision === "womens"
                        ? selectedStop.opponentNameWomens
                        : selectedStop.opponentNameMens}
                    </div>
                    <div className="pt-2 border-t border-white/10 flex items-start gap-2 text-xs">
                      <Target className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-emerald-300">Stop Challenge</div>
                        <div className="text-white/75">{selectedStop.challengeTitle}</div>
                      </div>
                    </div>
                  </div>

                  {/* Night Games Everywhere Match Toggle */}
                  <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-2">
                    <div className="text-[11px] font-black uppercase tracking-wider text-white/70">
                      Arena Lighting (Night Games Everywhere)
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { id: "auto", label: "Auto", icon: Clock },
                          { id: "night", label: "Night", icon: Moon },
                          { id: "day", label: "Day", icon: Sun },
                        ] as const
                      ).map((opt) => {
                        const Icon = opt.icon;
                        const active = nightGameMode === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => onChangeNightGameMode(opt.id)}
                            className={`py-2 px-2 rounded-lg text-[11px] font-black uppercase border flex items-center justify-center gap-1 cursor-pointer ${
                              active
                                ? "bg-amber-400 text-black border-amber-200"
                                : "bg-white/5 text-white/75 border-white/10 hover:bg-white/10"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Launch Button */}
                {(() => {
                  const prog = tourState.stopsCompleted[selectedStop.id];
                  const unlocked =
                    selectedStop.stopNumber - 1 <= tourState.currentStopIndex ||
                    Boolean(prog?.completed);
                  return (
                    <button
                      type="button"
                      disabled={!unlocked}
                      onClick={() => {
                        onStartStopMatch(selectedStop, selectedCity);
                        onClose();
                      }}
                      className={`w-full py-3.5 rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all ${
                        unlocked
                          ? "bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black shadow-lg cursor-pointer"
                          : "bg-white/10 text-white/40 border border-white/10 cursor-not-allowed"
                      }`}
                    >
                      {unlocked ? (
                        <>
                          <Play className="w-4 h-4 fill-black" />
                          <span>
                            {prog?.completed
                              ? `Replay Stop #${selectedStop.stopNumber}`
                              : `Tip Off Stop #${selectedStop.stopNumber}`}
                          </span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Clear Stop #{selectedStop.stopNumber - 1} First</span>
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
