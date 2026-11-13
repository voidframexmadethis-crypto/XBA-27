"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Play, Search, Shield, Target, X } from "lucide-react";
import {
  OffenseMove,
  DefenseMove,
  OffenseCategoryKey,
  DefenseCategoryKey,
  OFFENSE_CATEGORIES,
  DEFENSE_CATEGORIES,
  OFFENSE_CATEGORY_LABELS,
  DEFENSE_CATEGORY_LABELS,
  ALL_OFFENSE_MOVES,
  ALL_DEFENSE_MOVES,
  getMoveMetadata,
} from "@/lib/basketballMoves";

interface MovebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteMove: (move: OffenseMove | DefenseMove) => void;
  activeOffensePlay: OffenseMove | null;
  activeDefenseScheme: DefenseMove | null;
  defaultSide?: "offense" | "defense";
}

export default function MovebookModal({
  isOpen,
  onClose,
  onExecuteMove,
  activeOffensePlay,
  activeDefenseScheme,
  defaultSide = "offense",
}: MovebookModalProps) {
  const [sideOverride, setSideOverride] = useState<{
    base: "offense" | "defense";
    tab: "offense" | "defense";
  } | null>(null);
  const sideTab = sideOverride && sideOverride.base === defaultSide ? sideOverride.tab : defaultSide;
  const handleClose = () => {
    setSideOverride(null);
    onClose();
  };
  const [offenseCat, setOffenseCat] = useState<OffenseCategoryKey | "all">("all");
  const [defenseCat, setDefenseCat] = useState<DefenseCategoryKey | "all">("all");
  const [query, setQuery] = useState("");

  const visibleMoves = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list: (OffenseMove | DefenseMove)[] =
      sideTab === "offense"
        ? offenseCat === "all"
          ? ALL_OFFENSE_MOVES
          : OFFENSE_CATEGORIES[offenseCat]
        : defenseCat === "all"
        ? ALL_DEFENSE_MOVES
        : DEFENSE_CATEGORIES[defenseCat];

    return list
      .map((m) => getMoveMetadata(m))
      .filter((meta) => {
        if (!q) return true;
        return (
          meta.name.toLowerCase().includes(q) ||
          meta.description.toLowerCase().includes(q) ||
          meta.keyHint.toLowerCase().includes(q)
        );
      });
  }, [sideTab, offenseCat, defenseCat, query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[205] flex items-start sm:items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6 overflow-y-auto"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 14 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 14 }}
            transition={{ duration: 0.16 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl bg-neutral-950 border border-white/15 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[92dvh] my-auto"
          >
          {/* Header */}
          <div className="px-6 py-4 bg-neutral-900 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">
                  Offense &amp; Defense Movebook
                </h2>
                <p className="text-xs text-white/60 tabular-nums">
                  {ALL_OFFENSE_MOVES.length} Offense Moves · {ALL_DEFENSE_MOVES.length} Defense Moves · Click any move to execute live on court
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              aria-label="Close Movebook"
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Tabs + Search */}
          <div className="px-6 py-3 bg-neutral-950 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-lg">
              <button
                onClick={() => setSideOverride({ base: defaultSide, tab: "offense" })}
                className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  sideTab === "offense"
                    ? "bg-amber-500 text-black"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span className="tabular-nums">Offense ({ALL_OFFENSE_MOVES.length})</span>
              </button>
              <button
                onClick={() => setSideOverride({ base: defaultSide, tab: "defense" })}
                className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  sideTab === "defense"
                    ? "bg-amber-500 text-black"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="tabular-nums">Defense ({ALL_DEFENSE_MOVES.length})</span>
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search moves or controls..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Category Filter Bar */}
          <div className="px-6 py-2.5 bg-black/50 border-b border-white/10 flex items-center gap-2 overflow-x-auto shrink-0">
            {sideTab === "offense" ? (
              <>
                <button
                  onClick={() => setOffenseCat("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    offenseCat === "all"
                      ? "bg-white text-black"
                      : "bg-white/5 text-white/70 hover:text-white"
                  }`}
                >
                  All Offense ({ALL_OFFENSE_MOVES.length})
                </button>
                {(Object.keys(OFFENSE_CATEGORIES) as OffenseCategoryKey[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setOffenseCat(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-colors tabular-nums cursor-pointer ${
                      offenseCat === cat
                        ? "bg-white text-black"
                        : "bg-white/5 text-white/70 hover:text-white"
                    }`}
                  >
                    {OFFENSE_CATEGORY_LABELS[cat]} ({OFFENSE_CATEGORIES[cat].length})
                  </button>
                ))}
              </>
            ) : (
              <>
                <button
                  onClick={() => setDefenseCat("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    defenseCat === "all"
                      ? "bg-white text-black"
                      : "bg-white/5 text-white/70 hover:text-white"
                  }`}
                >
                  All Defense ({ALL_DEFENSE_MOVES.length})
                </button>
                {(Object.keys(DEFENSE_CATEGORIES) as DefenseCategoryKey[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setDefenseCat(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-colors tabular-nums cursor-pointer ${
                      defenseCat === cat
                        ? "bg-white text-black"
                        : "bg-white/5 text-white/70 hover:text-white"
                    }`}
                  >
                    {DEFENSE_CATEGORY_LABELS[cat]} ({DEFENSE_CATEGORIES[cat].length})
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Moves Grid */}
          <div className="p-6 overflow-y-auto flex-1">
            {visibleMoves.length === 0 ? (
              <div className="text-center py-12 text-sm text-white/50">
                No basketball moves matched &ldquo;{query}&rdquo;.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {visibleMoves.map((move) => {
                  const isActiveScheme =
                    move.id === activeOffensePlay || move.id === activeDefenseScheme;
                  const catLabel =
                    move.side === "offense"
                      ? OFFENSE_CATEGORY_LABELS[move.category as OffenseCategoryKey]
                      : DEFENSE_CATEGORY_LABELS[move.category as DefenseCategoryKey];

                  return (
                    <button
                      key={move.id}
                      onClick={() => {
                        onExecuteMove(move.id);
                        handleClose();
                      }}
                      className={`p-4 rounded-xl border text-left transition-colors flex flex-col justify-between gap-3 cursor-pointer ${
                        isActiveScheme
                          ? "bg-amber-500/15 border-amber-400"
                          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/25"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-black text-white">
                            {move.name}
                          </span>
                          <Play className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        </div>
                        <div className="text-[11px] text-white/50">
                          {catLabel} · {move.keyHint}
                        </div>
                        <p className="text-xs text-white/75 pt-1 leading-relaxed">
                          {move.description}
                        </p>
                      </div>
                      <div className="text-[11px] font-bold text-amber-400">
                        {isActiveScheme
                          ? "Active Set · Trigger Again"
                          : move.category === "off_ball_actions" ||
                            move.category === "schemes" ||
                            move.category === "pnr_coverage"
                          ? "Call Set / Coverage"
                          : "Perform Move"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
