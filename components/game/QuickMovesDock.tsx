"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Play, Shield, Target } from "lucide-react";
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

interface QuickMovesDockProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteMove: (move: OffenseMove | DefenseMove) => void;
  activeOffensePlay: OffenseMove | null;
  activeDefenseScheme: DefenseMove | null;
  defaultSide?: "offense" | "defense";
}

export default function QuickMovesDock({
  isOpen,
  onClose,
  onExecuteMove,
  activeOffensePlay,
  activeDefenseScheme,
  defaultSide = "offense",
}: QuickMovesDockProps) {
  const [sideOverride, setSideOverride] = useState<"offense" | "defense" | null>(null);
  const sideTab = sideOverride ?? defaultSide;

  const [offenseCat, setOffenseCat] = useState<OffenseCategoryKey>("triple_threat");
  const [defenseCat, setDefenseCat] = useState<DefenseCategoryKey>("footwork_stance");
  const [showAllInSide, setShowAllInSide] = useState(false);

  const visibleMoves = useMemo(() => {
    const list: (OffenseMove | DefenseMove)[] =
      sideTab === "offense"
        ? showAllInSide
          ? ALL_OFFENSE_MOVES
          : OFFENSE_CATEGORIES[offenseCat]
        : showAllInSide
        ? ALL_DEFENSE_MOVES
        : DEFENSE_CATEGORIES[defenseCat];

    return list.map((m) => getMoveMetadata(m));
  }, [sideTab, offenseCat, defenseCat, showAllInSide]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed bottom-[max(0.65rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-40 w-[min(96vw,56rem)] bg-neutral-950/88 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden text-white pointer-events-auto"
        >
          {/* Top Bar: Offense/Defense Switch + Collapse */}
          <div className="px-3 py-2 bg-neutral-900/90 border-b border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-0.5 bg-white/5 border border-white/10 rounded-lg">
              <button
                type="button"
                onClick={() => setSideOverride("offense")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors ${
                  sideTab === "offense"
                    ? "bg-amber-500 text-black"
                    : "text-white/75 hover:text-white"
                }`}
              >
                <Target className="w-3 h-3" />
                <span>Offense ({ALL_OFFENSE_MOVES.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSideOverride("defense")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors ${
                  sideTab === "defense"
                    ? "bg-emerald-500 text-black"
                    : "text-white/75 hover:text-white"
                }`}
              >
                <Shield className="w-3 h-3" />
                <span>Defense ({ALL_DEFENSE_MOVES.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowAllInSide((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
                  showAllInSide
                    ? "bg-white text-black border-white"
                    : "bg-white/5 text-white/75 border-white/15 hover:text-white"
                }`}
              >
                {showAllInSide ? "By Category" : "Show All"}
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Collapse Move Deck"
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Strip */}
          {!showAllInSide && (
            <div className="px-3 py-1.5 bg-black/45 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto">
              {sideTab === "offense"
                ? (Object.keys(OFFENSE_CATEGORIES) as OffenseCategoryKey[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setOffenseCat(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                        offenseCat === cat
                          ? "bg-amber-400 text-black"
                          : "bg-white/5 text-white/75 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {OFFENSE_CATEGORY_LABELS[cat]} ({OFFENSE_CATEGORIES[cat].length})
                    </button>
                  ))
                : (Object.keys(DEFENSE_CATEGORIES) as DefenseCategoryKey[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setDefenseCat(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                        defenseCat === cat
                          ? "bg-emerald-400 text-black"
                          : "bg-white/5 text-white/75 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {DEFENSE_CATEGORY_LABELS[cat]} ({DEFENSE_CATEGORIES[cat].length})
                    </button>
                  ))}
            </div>
          )}

          {/* Action Buttons Grid (All Moves Functional Live) */}
          <div className="p-2.5 max-h-40 sm:max-h-48 overflow-y-auto flex flex-wrap gap-1.5">
            {visibleMoves.map((move) => {
              const isActive =
                move.id === activeOffensePlay || move.id === activeDefenseScheme;
              return (
                <button
                  key={move.id}
                  type="button"
                  title={move.description}
                  onClick={() => onExecuteMove(move.id)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-extrabold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all ${
                    isActive
                      ? sideTab === "offense"
                        ? "bg-amber-500 text-black border-amber-300"
                        : "bg-emerald-500 text-black border-emerald-300"
                      : "bg-white/8 hover:bg-white/20 text-white border-white/15"
                  }`}
                >
                  <Play className="w-3 h-3 shrink-0 opacity-80" />
                  <span className="whitespace-nowrap">{move.name}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
