"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Target, X, Play, Trophy, Award, Flame } from "lucide-react";
import {
  DrillId,
  TRAINING_DRILLS,
  TrainingAcademyState,
  TrainingDrillDefinition,
} from "@/lib/trainingDrills";

interface TrainingAcademyModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainingState: TrainingAcademyState;
  onStartDrill: (drill: TrainingDrillDefinition) => void;
}

export default function TrainingAcademyModal({
  isOpen,
  onClose,
  trainingState,
  onStartDrill,
}: TrainingAcademyModalProps) {
  const [filter, setFilter] = useState<"All" | "Shooting" | "Finishing" | "Playmaking" | "Defense">("All");

  const drills = TRAINING_DRILLS.filter((d) => filter === "All" || d.category === filter);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-[200] flex items-start sm:items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 14 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 14 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl bg-[#080a0f] border border-white/15 rounded-2xl shadow-2xl text-white flex flex-col max-h-[92dvh] my-auto overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#0e1b18] via-[#0e121a] to-[#080a0f] border-b border-white/10 flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500 text-black flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Training Academy</h2>
                  <p className="text-xs text-white/60 tabular-nums">
                    8 interactive skill challenges · Completed: {trainingState.totalDrillsCompleted} · Academy XP:{" "}
                    {trainingState.totalAcademyXp}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close Training Academy"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Filter */}
            <div className="px-6 py-3 bg-black/40 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap gap-1.5">
                {(["All", "Shooting", "Finishing", "Playmaking", "Defense"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase cursor-pointer ${
                      filter === cat ? "bg-emerald-500 text-black" : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <span className="text-xs text-white/50 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Personal Bests save automatically after every drill</span>
              </span>
            </div>

            {/* Drills Grid */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              {drills.map((drill) => {
                const rec = trainingState.records[drill.id as DrillId];
                return (
                  <div
                    key={drill.id}
                    className="p-5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-emerald-400/50 transition-colors flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-base font-black">{drill.title}</div>
                          <div className="text-[11px] font-bold uppercase text-emerald-400">
                            {drill.category} · {drill.difficulty} · {drill.durationSec}s
                          </div>
                        </div>
                        <span className="text-xs font-black text-[#ff963b] tabular-nums">
                          +{drill.xpReward} XP
                        </span>
                      </div>

                      <p className="text-xs text-white/70 leading-relaxed">{drill.description}</p>

                      <div className="text-[11px] text-white/55 bg-black/40 border border-white/5 rounded-lg px-3 py-2">
                        <strong className="text-white/80">Goal:</strong> {drill.goalLabel}
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 text-center tabular-nums">
                        <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                          <div className="text-[10px] uppercase text-white/45">High Score</div>
                          <div className="text-sm font-black text-amber-400">{rec?.bestScore ?? 0}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                          <div className="text-[10px] uppercase text-white/45">Best Acc</div>
                          <div className="text-sm font-black text-emerald-400">{rec?.bestAccuracyPct ?? 0}%</div>
                        </div>
                        <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                          <div className="text-[10px] uppercase text-white/45">Runs</div>
                          <div className="text-sm font-black text-white">{rec?.completions ?? 0}</div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onStartDrill(drill);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-black" />
                      <span>Start Drill on 3D Court</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
