"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy,
  X,
  Lock,
  Check,
  Sparkles,
  Award,
  Zap,
  RotateCcw,
  Shield,
  ChevronRight,
  Flame,
} from "lucide-react";
import {
  CareerStats,
  JERSEY_ITEMS,
  SNEAKER_ITEMS,
  HEADBAND_ITEMS,
  ProgressionItem,
  calculateLevel,
  saveCareerStats,
  addDebugCareerStats,
  resetCareerStats,
} from "@/lib/progression";

interface LockerRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  careerStats: CareerStats;
  onStatsChange: (newStats: CareerStats) => void;
  onEquipItem: (type: "jersey" | "sneakers" | "headband", id: string) => void;
}

export default function LockerRoomModal({
  isOpen,
  onClose,
  careerStats,
  onStatsChange,
  onEquipItem,
}: LockerRoomModalProps) {
  const [activeTab, setActiveTab] = useState<"jerseys" | "sneakers" | "headbands" | "milestones">("jerseys");
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const levelInfo = calculateLevel(careerStats.xp);
  const xpPercent = Math.min(100, Math.round((levelInfo.currentLevelXp / levelInfo.nextLevelXp) * 100));

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleEquip = (item: ProgressionItem) => {
    const updated = { ...careerStats };
    if (item.type === "jersey") {
      updated.equippedJersey = item.id;
    } else if (item.type === "sneakers") {
      updated.equippedSneakers = item.id;
    } else if (item.type === "headband") {
      updated.equippedHeadband = item.id;
    }
    saveCareerStats(updated);
    onStatsChange(updated);
    onEquipItem(item.type, item.id);
    showToast(`Equipped ${item.name}!`);
  };

  const handlePracticeDrill = () => {
    const result = addDebugCareerStats(6, 3, 3);
    onStatsChange(result.updatedStats);
    if (result.newlyUnlockedItems.length > 0) {
      showToast(`🔥 Practice Complete! UNLOCKED: ${result.newlyUnlockedItems.map((i) => i.name).join(", ")}`);
    } else {
      showToast("🏀 Practice Complete! +6 PTS, +3 REB, +3 AST added to Career!");
    }
  };

  const handleReset = () => {
    if (confirm("Reset all career stats, XP, and unlocked gear to Rookie defaults?")) {
      const reset = resetCareerStats();
      onStatsChange(reset);
      onEquipItem("jersey", reset.equippedJersey);
      onEquipItem("sneakers", reset.equippedSneakers);
      onEquipItem("headband", reset.equippedHeadband);
      showToast("Career stats reset to rookie baseline.");
    }
  };

  const getItemProgress = (item: ProgressionItem) => {
    if (item.reqType === "none" || item.unlockedByDefault) {
      return { current: 1, target: 1, percent: 100, label: "Unlocked by default" };
    }
    if (item.reqType === "pts") {
      const cur = careerStats.careerPts;
      const pct = Math.min(100, Math.round((cur / item.reqValue) * 100));
      return { current: cur, target: item.reqValue, percent: pct, label: `${cur} / ${item.reqValue} Career PTS` };
    }
    if (item.reqType === "reb") {
      const cur = careerStats.careerReb;
      const pct = Math.min(100, Math.round((cur / item.reqValue) * 100));
      return { current: cur, target: item.reqValue, percent: pct, label: `${cur} / ${item.reqValue} Career REB` };
    }
    if (item.reqType === "ast") {
      const cur = careerStats.careerAst;
      const pct = Math.min(100, Math.round((cur / item.reqValue) * 100));
      return { current: cur, target: item.reqValue, percent: pct, label: `${cur} / ${item.reqValue} Career AST` };
    }
    return { current: 0, target: 1, percent: 0, label: "" };
  };

  const renderItemCard = (item: ProgressionItem) => {
    const isUnlocked = careerStats.unlockedIds.includes(item.id);
    const isEquipped =
      (item.type === "jersey" && careerStats.equippedJersey === item.id) ||
      (item.type === "sneakers" && careerStats.equippedSneakers === item.id) ||
      (item.type === "headband" && careerStats.equippedHeadband === item.id);

    const progress = getItemProgress(item);

    return (
      <div
        key={item.id}
        className={`relative flex flex-col justify-between p-4 rounded-2xl border transition-all duration-200 ${
          isEquipped
            ? "bg-gradient-to-br from-emerald-500/20 via-black/60 to-black/80 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
            : isUnlocked
            ? "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10"
            : "bg-black/40 border-white/5 opacity-75"
        }`}
      >
        {/* Top Swatch & Type */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl border border-white/20 shadow-inner flex items-center justify-center relative overflow-hidden shrink-0"
              style={{ backgroundColor: item.colorHex }}
            >
              {item.secondaryHex && (
                <div
                  className="absolute bottom-0 right-0 w-5 h-5 -rotate-45 translate-x-1 translate-y-1 border-t border-white/30"
                  style={{ backgroundColor: item.secondaryHex }}
                />
              )}
              {!isUnlocked && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-white/80" />
                </div>
              )}
            </div>
            <div>
              <div className="font-black text-white text-base leading-tight flex items-center gap-2">
                {item.name}
              </div>
              <span className="text-[11px] text-white/50 font-medium capitalize">
                {item.type}
              </span>
            </div>
          </div>

          {isEquipped ? (
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500 text-black shadow">
              <Check className="w-3 h-3 stroke-[3]" /> Equipped
            </span>
          ) : isUnlocked ? (
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/80">
              Unlocked
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
              <Lock className="w-2.5 h-2.5" /> Locked
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-white/60 mb-3 min-h-[32px] line-clamp-2">
          {item.description}
        </p>

        {/* Unlock Requirement / Progress Bar */}
        <div className="space-y-1.5 mt-auto pt-2 border-t border-white/5">
          <div className="flex justify-between items-center text-[10px] font-bold text-white/60">
            <span>{isUnlocked ? "Status" : "Requirement"}</span>
            <span className={isUnlocked ? "text-emerald-400" : "text-yellow-400"}>
              {progress.label}
            </span>
          </div>

          {!isUnlocked && (
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          )}

          {/* Action button */}
          <div className="pt-2">
            {isEquipped ? (
              <button
                disabled
                className="w-full py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-wider rounded-xl cursor-default"
              >
                In Use
              </button>
            ) : isUnlocked ? (
              <button
                onClick={() => handleEquip(item)}
                className="w-full py-2 bg-white text-black hover:bg-neutral-200 active:scale-[0.98] transition-all font-black text-xs uppercase tracking-wider rounded-xl shadow-md"
              >
                Equip Item
              </button>
            ) : (
              <button
                disabled
                className="w-full py-2 bg-white/5 border border-white/10 text-white/40 font-bold text-xs uppercase tracking-wider rounded-xl cursor-not-allowed"
              >
                Locked ({progress.percent}%)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[150] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-neutral-950 border border-white/10 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden text-white"
        >
          {/* Toast Notification Banner */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-emerald-500 text-black font-black text-xs uppercase tracking-wider shadow-xl flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{notification}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Banner Header */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-red-950/60 via-neutral-900 to-neutral-900 border-b border-white/10 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-900/40">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight">
                      Locker Room & Progression
                    </h2>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-600/30 text-red-400 border border-red-500/30">
                      Career
                    </span>
                  </div>
                  <p className="text-xs text-white/50 font-medium">
                    Dominate on the hardwood to unlock elite jerseys, kicks & accessories.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Career Stats & Level Overview Card */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {/* Level Card */}
              <div className="col-span-2 sm:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xs">
                      {levelInfo.level}
                    </span>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                        Player Tier
                      </div>
                      <div className="text-sm font-black text-amber-400 leading-tight">
                        {levelInfo.title}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-white/60">
                    {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Career PTS */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                  Career PTS
                </span>
                <span className="text-2xl font-black text-red-500 tabular-nums">
                  {careerStats.careerPts}
                </span>
              </div>

              {/* Career REB */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                  Career REB
                </span>
                <span className="text-2xl font-black text-amber-400 tabular-nums">
                  {careerStats.careerReb}
                </span>
              </div>

              {/* Career AST */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                  Career AST
                </span>
                <span className="text-2xl font-black text-cyan-400 tabular-nums">
                  {careerStats.careerAst}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 px-6 bg-black/40 shrink-0 overflow-x-auto scrollbar-hide">
            {[
              { id: "jerseys", label: `Jerseys (${JERSEY_ITEMS.filter((j) => careerStats.unlockedIds.includes(j.id)).length}/${JERSEY_ITEMS.length})` },
              { id: "sneakers", label: `Sneakers (${SNEAKER_ITEMS.filter((s) => careerStats.unlockedIds.includes(s.id)).length}/${SNEAKER_ITEMS.length})` },
              { id: "headbands", label: `Accessories (${HEADBAND_ITEMS.filter((h) => careerStats.unlockedIds.includes(h.id)).length}/${HEADBAND_ITEMS.length})` },
              { id: "milestones", label: "Career Milestones" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 font-black text-xs uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-red-500 text-white"
                    : "border-transparent text-white/40 hover:text-white/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[50vh]">
            {activeTab === "jerseys" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {JERSEY_ITEMS.map(renderItemCard)}
              </div>
            )}

            {activeTab === "sneakers" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {SNEAKER_ITEMS.map(renderItemCard)}
              </div>
            )}

            {activeTab === "headbands" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {HEADBAND_ITEMS.map(renderItemCard)}
              </div>
            )}

            {activeTab === "milestones" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Summary Metric 1 */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-white/40">Matches Played</div>
                      <div className="text-xl font-black">{careerStats.matchesPlayed}</div>
                    </div>
                    <Flame className="w-6 h-6 text-orange-500" />
                  </div>

                  {/* Summary Metric 2 */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-white/40">Matches Won</div>
                      <div className="text-xl font-black text-emerald-400">
                        {careerStats.matchesWon}{" "}
                        <span className="text-xs text-white/40 font-normal">
                          ({careerStats.matchesPlayed > 0 ? Math.round((careerStats.matchesWon / careerStats.matchesPlayed) * 100) : 0}% win rate)
                        </span>
                      </div>
                    </div>
                    <Shield className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-sm font-black uppercase text-white/70 mb-3 tracking-wider">
                    Item Unlock Tracker
                  </h3>
                  <div className="space-y-2">
                    {[...JERSEY_ITEMS, ...SNEAKER_ITEMS, ...HEADBAND_ITEMS]
                      .filter((item) => item.reqType !== "none")
                      .map((item) => {
                        const isUnlocked = careerStats.unlockedIds.includes(item.id);
                        const progress = getItemProgress(item);
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 gap-4"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-3.5 h-3.5 rounded-full shrink-0"
                                style={{ backgroundColor: item.colorHex }}
                              />
                              <div className="truncate">
                                <div className="text-xs font-bold text-white truncate">{item.name}</div>
                                <div className="text-[10px] text-white/40 capitalize">{item.type}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              <div className="w-28 sm:w-40 text-right">
                                <div className="text-[10px] font-bold text-white/60 mb-1">
                                  {progress.label}
                                </div>
                                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                                  <div
                                    className={`h-full rounded-full ${
                                      isUnlocked ? "bg-emerald-400" : "bg-amber-400"
                                    }`}
                                    style={{ width: `${progress.percent}%` }}
                                  />
                                </div>
                              </div>

                              {isUnlocked ? (
                                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="w-6 h-6 rounded-full bg-white/5 text-white/40 border border-white/10 flex items-center justify-center shrink-0">
                                  <Lock className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="px-6 py-4 bg-black/60 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePracticeDrill}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 transition-all text-xs font-bold uppercase tracking-wider"
                title="Simulate a 5-minute shooting drill for testing unlockables"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Practice Drill (+6 PTS, +3 REB, +3 AST)</span>
              </button>

              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-300 border border-white/10 text-white/40 transition-all text-xs font-bold"
                title="Reset all career stats to zero"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2 bg-white text-black font-black uppercase text-xs tracking-wider rounded-xl hover:bg-neutral-200 transition-all"
            >
              Back to Court
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
