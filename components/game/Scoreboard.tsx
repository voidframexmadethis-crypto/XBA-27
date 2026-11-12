"use client";

import { motion, AnimatePresence } from "motion/react";
import { MapPin, Tv } from "lucide-react";
import { WorldCity } from "@/lib/worldTour";
import { formatShotClock } from "@/lib/shotClock";
import { useEffect, useState } from "react";

interface ScoreboardProps {
  scoreHome: number;
  scoreAway: number;
  quarter: number;
  gameClock: number;
  shotClock: number;
  selectedCity: WorldCity;
}

export default function Scoreboard({
  scoreHome,
  scoreAway,
  quarter,
  gameClock,
  shotClock,
  selectedCity,
}: ScoreboardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="absolute top-3 left-4 right-4 flex justify-between items-start pointer-events-none z-20">
      {/* Left: Home Score Panel */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="relative flex items-center gap-3 bg-gradient-to-r from-red-950/90 via-black/90 to-black/80 backdrop-blur-xl px-5 py-2.5 rounded-2xl border-2 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.25)]"
      >
        <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center font-black text-white text-xs border border-white/20 shadow-md">
          HOM
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-black tracking-widest text-red-400">Home Franchise</span>
          <div className="relative overflow-visible h-10 flex items-center">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={scoreHome}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-4xl font-black text-white tabular-nums leading-none block"
              >
                {scoreHome}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Center: 2K Broadcast Clock Hub */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col items-center gap-1.5 bg-gradient-to-b from-neutral-900/95 via-black/95 to-neutral-950/95 backdrop-blur-2xl px-6 py-2 rounded-2xl border-2 border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.25)]"
      >
        <div className="flex items-center gap-4">
          {/* 2K Badge */}
          <div className="px-2 py-0.5 rounded bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-[10px] tracking-tighter shadow-md">
            2K HD
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase font-black tracking-widest text-white/40">Quarter</span>
            <span className="text-xl font-black text-amber-400">{quarter}</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex flex-col items-center min-w-[85px]">
            <span className="text-[9px] uppercase font-black tracking-widest text-white/40">Game Clock</span>
            <span className="text-3xl font-black text-yellow-300 tabular-nums">{formatTime(gameClock)}</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex flex-col items-center min-w-[54px]">
            <span className="text-[9px] uppercase font-black tracking-widest text-white/40">Shot</span>
            <span
              className={`text-2xl font-black tabular-nums transition-colors ${
                shotClock <= 5
                  ? "text-red-500 font-extrabold animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                  : shotClock <= 10
                  ? "text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                  : "text-yellow-400"
              }`}
            >
              {formatShotClock(shotClock)}
            </span>
          </div>
        </div>
        {/* Active Arena & City Badge */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-white/10 w-full justify-center">
          <MapPin className="w-3 h-3 text-cyan-400" />
          <span className="text-[10px] font-black uppercase text-white/90 tracking-wider truncate max-w-[220px]">
            {selectedCity.name} • {selectedCity.arenaName}
          </span>
          <span className="text-xs">{selectedCity.flag}</span>
        </div>
      </motion.div>

      {/* Right: Away Score Panel */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex items-center gap-3 bg-gradient-to-l from-cyan-950/90 via-black/90 to-black/80 backdrop-blur-xl px-5 py-2.5 rounded-2xl border-2 border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.25)]"
      >
        <div className="flex flex-col items-end text-right">
          <span className="text-[10px] uppercase font-black tracking-widest text-cyan-400 truncate max-w-[110px]">{selectedCity.name}</span>
          <div className="relative overflow-visible h-10 flex items-center justify-end">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={scoreAway}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-4xl font-black text-white tabular-nums leading-none block"
              >
                {scoreAway}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs border border-white/20 shadow-md shrink-0"
          style={{ backgroundColor: selectedCity.jerseyPrimary }}
        >
          {selectedCity.flag}
        </div>
      </motion.div>
    </div>
  );
}
