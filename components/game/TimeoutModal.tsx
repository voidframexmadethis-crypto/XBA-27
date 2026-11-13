"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  Zap,
  Play,
  RotateCcw,
  Users,
  AlertCircle,
  Activity,
  Target,
  ArrowRight,
  Clipboard,
} from "lucide-react";

export type DefensiveScheme = "press" | "lockdown" | "zone" | "conservative";
export type OffensiveSet = "pace_space" | "pick_roll" | "paint_power" | "fast_break";

export interface TacticalSettings {
  defense: DefensiveScheme;
  offense: OffensiveSet;
}

interface TimeoutModalProps {
  isOpen: boolean;
  onResume: () => void;
  tactics: TacticalSettings;
  onTacticsChange: (newTactics: TacticalSettings) => void;
  teamA: any[];
  onSubstitute: (inIdx: number, outIdx: number) => void;
  timeoutsLeft: number;
}

export default function TimeoutModal({
  isOpen,
  onResume,
  tactics,
  onTacticsChange,
  teamA,
  onSubstitute,
  timeoutsLeft,
}: TimeoutModalProps) {
  const [activeTab, setActiveTab] = useState<"tactics" | "bench">("tactics");
  const [selectedBenchIdx, setSelectedBenchIdx] = useState<number | null>(null);
  const [selectedActiveIdx, setSelectedActiveIdx] = useState<number | null>(null);

  const DEFENSE_OPTIONS: { id: DefensiveScheme; label: string; desc: string; stat: string }[] = [
    {
      id: "press",
      label: "Full-Court Press",
      desc: "Aggressive double-teams & traps in the backcourt. Great for forcing turnovers when trailing.",
      stat: "+50% Steal Rate • Higher Foul Risk",
    },
    {
      id: "lockdown",
      label: "Man-to-Man Lockdown",
      desc: "Balanced tight contest on every shooter. Denies open drives and sticks to assignments.",
      stat: "Balanced • Optimal Perimeter Contest",
    },
    {
      id: "zone",
      label: "2-3 Paint Zone",
      desc: "Packs 3 defenders inside the painted key to block dunks and control defensive rebounds.",
      stat: "+35% Rebounds & Rim Blocks • Leaves 3PT Open",
    },
    {
      id: "conservative",
      label: "Conservative Wall",
      desc: "Discipline first. Protects the basket without fouling and prevents transition fast breaks.",
      stat: "Zero Reach-In Fouls • Concedes Mid-Range",
    },
  ];

  const OFFENSE_OPTIONS: { id: OffensiveSet; label: string; desc: string; stat: string }[] = [
    {
      id: "pick_roll",
      label: "High Pick & Roll",
      desc: "Centers set high solid screens for the ball-handler to create open drive-and-kick or alley-oop dunks.",
      stat: "Primary Scoring Set • High Percentage Inside",
    },
    {
      id: "pace_space",
      label: "Pace & Space 3PT",
      desc: "Teammates fan out beyond the 3-point arc for maximum floor spacing and kickout triples.",
      stat: "Floor Spacing • Heavy 3-Point Generation",
    },
    {
      id: "paint_power",
      label: "Inside Paint Attack",
      desc: "Feeds the low block and clears the lane for athletic slam dunks and powerful putbacks.",
      stat: "High Dunk Probability • Draws Inside Fouls",
    },
    {
      id: "fast_break",
      label: "Showtime Fast Break",
      desc: "Wings immediately streak downcourt on defensive rebounds for uncontested transition layups.",
      stat: "Instant Transition Buckets • Fast Pace",
    },
  ];

  const activePlayers = teamA.filter((p) => !p.isBench);
  const benchPlayers = teamA.filter((p) => p.isBench);

  const handleSubConfirm = () => {
    if (selectedBenchIdx !== null && selectedActiveIdx !== null) {
      const realBenchIdx = teamA.indexOf(benchPlayers[selectedBenchIdx]);
      const realActiveIdx = teamA.indexOf(activePlayers[selectedActiveIdx]);
      if (realBenchIdx !== -1 && realActiveIdx !== -1) {
        onSubstitute(realBenchIdx, realActiveIdx);
        setSelectedBenchIdx(null);
        setSelectedActiveIdx(null);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[160] flex items-start sm:items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="relative w-full max-w-4xl bg-neutral-950 border border-amber-500/30 rounded-3xl shadow-[0_0_80px_rgba(245,158,11,0.2)] overflow-hidden text-white flex flex-col max-h-[92dvh] my-auto"
          >
          {/* Top Clipboard Header */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-amber-950/60 via-neutral-900 to-neutral-900 border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black shadow-lg shadow-amber-500/30">
                <Clipboard className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight text-white">
                    Tactical Timeout
                  </h2>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-black shadow">
                    Huddle
                  </span>
                </div>
                <p className="text-xs text-white/50 font-medium">
                  Adjust defensive intensity, offensive spacing, or rotate the bench during this stoppage.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase text-white/40">Timeouts Left</div>
                <div className="text-sm font-black text-amber-400">{timeoutsLeft} Remaining</div>
              </div>
              <button
                onClick={onResume}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Resume Match</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-white/10 px-6 bg-black/40 shrink-0">
            <button
              onClick={() => setActiveTab("tactics")}
              className={`py-3 px-5 font-black text-xs uppercase tracking-wider transition-all border-b-2 ${
                activeTab === "tactics"
                  ? "border-amber-400 text-amber-300"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              Tactical Playbook
            </button>
            <button
              onClick={() => setActiveTab("bench")}
              className={`py-3 px-5 font-black text-xs uppercase tracking-wider transition-all border-b-2 ${
                activeTab === "bench"
                  ? "border-amber-400 text-amber-300"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              Bench Rotations & Lineup
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6 max-h-[55vh]">
            {activeTab === "tactics" && (
              <div className="space-y-6">
                {/* Defensive Intensity Scheme */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-red-400" />
                    <h3 className="text-sm font-black uppercase text-white tracking-wider">
                      Defensive Scheme & Intensity
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DEFENSE_OPTIONS.map((opt) => {
                      const isSelected = tactics.defense === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() =>
                            onTacticsChange({
                              ...tactics,
                              defense: opt.id,
                            })
                          }
                          className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? "bg-gradient-to-br from-red-950/60 to-black border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)]"
                              : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-black text-sm text-white">{opt.label}</span>
                            {isSelected && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500 text-white">
                                Active Scheme
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/60 mb-2.5 leading-relaxed">{opt.desc}</p>
                          <span className="inline-block text-[10px] font-bold text-red-400 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20">
                            {opt.stat}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Offensive Sets Scheme */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-black uppercase text-white tracking-wider">
                      Offensive Set & Spacing
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {OFFENSE_OPTIONS.map((opt) => {
                      const isSelected = tactics.offense === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() =>
                            onTacticsChange({
                              ...tactics,
                              offense: opt.id,
                            })
                          }
                          className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? "bg-gradient-to-br from-cyan-950/60 to-black border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                              : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-black text-sm text-white">{opt.label}</span>
                            {isSelected && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-400 text-black">
                                Active Set
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/60 mb-2.5 leading-relaxed">{opt.desc}</p>
                          <span className="inline-block text-[10px] font-bold text-cyan-300 px-2 py-0.5 rounded-md bg-cyan-400/10 border border-cyan-400/20">
                            {opt.stat}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "bench" && (
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-xs text-amber-200">
                  <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
                  <span>
                    Select an active on-court player and a bench substitute, then click <strong>Confirm Substitution</strong>.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Active 5 */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-white/60 mb-2">
                      Active On-Court (5 Players)
                    </h4>
                    <div className="space-y-2">
                      {activePlayers.map((p, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            if (!p.isUser) setSelectedActiveIdx(idx);
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            p.isUser
                              ? "bg-amber-500/10 border-amber-500/30 text-white/80 cursor-not-allowed"
                              : selectedActiveIdx === idx
                              ? "bg-red-500/20 border-red-500 text-white cursor-pointer"
                              : "bg-white/5 border-white/10 hover:bg-white/10 text-white/80 cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center font-black text-xs text-white">
                              {p.pos}
                            </span>
                            <div>
                              <div className="font-bold text-sm">
                                {p.name} {p.isUser && "(YOU)"}
                              </div>
                              <div className="text-[10px] text-white/40">
                                PTS: {p.stats.pts} • AST: {p.stats.ast} • REB: {p.stats.reb}
                              </div>
                            </div>
                          </div>
                          {p.isUser ? (
                            <span className="text-[10px] font-black uppercase text-amber-400">
                              On Court
                            </span>
                          ) : (
                            selectedActiveIdx === idx && (
                              <span className="text-[10px] font-black uppercase text-red-400">
                                Selected Out
                              </span>
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bench 5 */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-white/60 mb-2">
                      Available Bench Substitutes (5 Players)
                    </h4>
                    <div className="space-y-2">
                      {benchPlayers.map((p, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedBenchIdx(idx)}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            selectedBenchIdx === idx
                              ? "bg-emerald-500/20 border-emerald-500 text-white"
                              : "bg-white/5 border-white/10 hover:bg-white/10 text-white/80"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-xs text-white">
                              {p.pos}
                            </span>
                            <div>
                              <div className="font-bold text-sm">{p.name}</div>
                              <div className="text-[10px] text-white/40">Fresh Off Bench</div>
                            </div>
                          </div>
                          {selectedBenchIdx === idx && (
                            <span className="text-[10px] font-black uppercase text-emerald-400">
                              Selected In
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Confirm button */}
                <div className="pt-2 flex justify-end">
                  <button
                    disabled={selectedActiveIdx === null || selectedBenchIdx === null}
                    onClick={handleSubConfirm}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                      selectedActiveIdx !== null && selectedBenchIdx !== null
                        ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg"
                        : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                    }`}
                  >
                    <span>Confirm Substitution</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-black/60 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-white/40">
              Active Strategy: <strong className="text-white">{DEFENSE_OPTIONS.find((d) => d.id === tactics.defense)?.label}</strong> &bull;{" "}
              <strong className="text-white">{OFFENSE_OPTIONS.find((o) => o.id === tactics.offense)?.label}</strong>
            </span>

            <button
              onClick={onResume}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md"
            >
              Break Huddle & Resume
            </button>
          </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
