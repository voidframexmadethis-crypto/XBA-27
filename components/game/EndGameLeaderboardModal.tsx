"use client";

import { motion } from "motion/react";
import { Trophy, Globe, Shirt, Play, RotateCcw, Award, Menu } from "lucide-react";
import { WorldCity } from "@/lib/worldTour";
import { CareerStats, calculateLevel } from "@/lib/progression";

interface EndGameLeaderboardModalProps {
  isOpen: boolean;
  scoreHome: number;
  scoreAway: number;
  selectedCity: WorldCity;
  finalStats: any[];
  lastMatchEarnings: {
    pts: number;
    reb: number;
    ast: number;
    xpGained: number;
    leveledUp: boolean;
    unlocked: any[];
  } | null;
  careerStats: CareerStats;
  onRematch: () => void;
  onOpenWorldTour: () => void;
  onOpenLockerRoom: () => void;
  onMainMenu?: () => void;
}

export default function EndGameLeaderboardModal({
  isOpen,
  scoreHome,
  scoreAway,
  selectedCity,
  finalStats,
  lastMatchEarnings,
  careerStats,
  onRematch,
  onOpenWorldTour,
  onOpenLockerRoom,
  onMainMenu,
}: EndGameLeaderboardModalProps) {
  if (!isOpen) return null;

  const userWon = scoreHome > scoreAway;
  const isTie = scoreHome === scoreAway;
  const levelInfo = calculateLevel(careerStats.xp);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[220] flex items-start sm:items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        className="relative w-full max-w-4xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-black border-2 border-amber-500/50 rounded-3xl p-4 sm:p-8 shadow-[0_0_100px_rgba(245,158,11,0.3)] text-white space-y-5 overflow-hidden max-h-[92dvh] my-auto flex flex-col"
      >
        {/* Glow backdrop */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Banner */}
        <div className="text-center space-y-2 relative z-10 shrink-0">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-widest shadow-lg">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>FINAL MATCH LEADERBOARD & SUMMARY</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tight text-2k-gold">
            {userWon ? "VICTORY!" : isTie ? "TIE GAME" : "FINAL BUZZER"}
          </h2>
          <p className="text-xs text-white/60 font-semibold uppercase tracking-wider">
            {selectedCity.arenaName} • {selectedCity.name}, {selectedCity.country} {selectedCity.flag}
          </p>
        </div>

        {/* Final Scoreboard Card */}
        <div className="bg-black/60 border border-amber-500/30 rounded-2xl p-5 flex items-center justify-around relative z-10 shrink-0">
          <div className="text-center space-y-1">
            <div className="text-xs font-black text-red-500 uppercase tracking-widest">HOME SQUAD</div>
            <div className="text-5xl sm:text-6xl font-black italic text-white tabular-nums">{scoreHome}</div>
            <div className="text-[11px] text-white/50">Your Team</div>
          </div>

          <div className="text-3xl font-black italic text-amber-400">VS</div>

          <div className="text-center space-y-1">
            <div className="text-xs font-black text-blue-500 uppercase tracking-widest">{selectedCity.teamName}</div>
            <div className="text-5xl sm:text-6xl font-black italic text-white tabular-nums">{scoreAway}</div>
            <div className="text-[11px] text-white/50">{selectedCity.name} Challengers</div>
          </div>
        </div>

        {/* Match Earnings & XP Summary */}
        {lastMatchEarnings && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10 shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <div className="text-[10px] font-bold text-white/50 uppercase">Points Scored</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{lastMatchEarnings.pts} PTS</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <div className="text-[10px] font-bold text-white/50 uppercase">Rebounds</div>
              <div className="text-2xl font-black text-cyan-400 mt-1">{lastMatchEarnings.reb} REB</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <div className="text-[10px] font-bold text-white/50 uppercase">Assists</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{lastMatchEarnings.ast} AST</div>
            </div>
            <div className="bg-gradient-to-br from-amber-500/20 to-black border border-amber-500/40 rounded-2xl p-3 text-center">
              <div className="text-[10px] font-bold text-amber-300 uppercase">XP Gained</div>
              <div className="text-2xl font-black text-amber-400 mt-1">+{lastMatchEarnings.xpGained} XP</div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden relative z-10 flex-1 overflow-y-auto">
          <div className="grid grid-cols-6 gap-2 p-3 bg-white/10 text-[10px] font-black uppercase tracking-widest opacity-75 sticky top-0 bg-neutral-900">
            <div className="text-left pl-2">Player</div>
            <div className="text-center">Team</div>
            <div className="text-center">PTS</div>
            <div className="text-center">REB</div>
            <div className="text-center">AST</div>
            <div className="text-center">FOULS</div>
          </div>
          <div className="divide-y divide-white/5">
            {finalStats.map((p, i) => (
              <div key={i} className={`grid grid-cols-6 gap-2 p-3 items-center text-xs font-bold ${p.isUser || p.name === "YOU" ? "bg-amber-500/20 border-l-4 border-amber-400" : "hover:bg-white/5"}`}>
                <div className="text-left pl-2 flex items-center gap-1.5 min-w-0">
                  <span className="text-amber-400 font-black shrink-0">#{i + 1}</span>
                  <span className="text-white truncate">{p.name}</span>
                  {(p.isUser || p.name === "YOU") && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-400 text-black text-[9px] font-black shrink-0">YOU</span>
                  )}
                </div>
                <div className="text-center text-white/70">{p.team}</div>
                <div className="text-center font-black text-amber-400 tabular-nums">{p.pts}</div>
                <div className="text-center font-black text-cyan-400 tabular-nums">{p.reb}</div>
                <div className="text-center font-black text-emerald-400 tabular-nums">{p.ast}</div>
                <div className="text-center text-red-400 tabular-nums">{p.fouls}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`grid grid-cols-1 ${onMainMenu ? "sm:grid-cols-4" : "sm:grid-cols-3"} gap-3 pt-2 relative z-10 shrink-0`}>
          <button
            onClick={onRematch}
            className="py-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-black font-black italic uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[3]" />
            <span>Rematch</span>
          </button>

          <button
            onClick={onOpenWorldTour}
            className="py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black italic uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span>World Tour</span>
          </button>

          <button
            onClick={onOpenLockerRoom}
            className="py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black italic uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Shirt className="w-4 h-4 text-amber-400" />
            <span>Locker (LVL {levelInfo.level})</span>
          </button>

          {onMainMenu && (
            <button
              onClick={onMainMenu}
              className="py-3 bg-neutral-800 hover:bg-neutral-700 border border-white/15 text-white font-black italic uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Menu className="w-4 h-4 text-white/80" />
              <span>Main Menu</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
