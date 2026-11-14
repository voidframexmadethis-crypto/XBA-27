"use client";

import { WorldCity } from "@/lib/worldTour";
import { formatShotClock } from "@/lib/shotClock";

interface ScoreboardProps {
  scoreHome: number;
  scoreAway: number;
  quarter: number;
  gameClock: number;
  shotClock: number;
  selectedCity: WorldCity;
  isPracticeMode?: boolean;
  homeAbbr?: string;
  awayAbbr?: string;
  competitionBadge?: string;
}

export default function Scoreboard({
  scoreHome,
  scoreAway,
  quarter,
  gameClock,
  shotClock,
  selectedCity,
  isPracticeMode = false,
  homeAbbr = "HOM",
  awayAbbr,
  competitionBadge,
}: ScoreboardProps) {
  const formatTime = (seconds: number) => {
    const safe = Math.max(0, Math.ceil(seconds));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const isLowShot = !isPracticeMode && shotClock <= 5;
  const resolvedAwayLabel = awayAbbr || selectedCity.name;

  return (
    <div className="fixed top-[max(0.75rem,env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))] sm:left-1/2 sm:-translate-x-1/2 pointer-events-none z-20 max-w-[calc(100vw-2rem)] flex flex-col items-start sm:items-center gap-1.5">
      {competitionBadge && (
        <div className="px-3 py-0.5 rounded-md bg-neutral-950/90 border border-amber-500/50 text-[10px] font-black uppercase tracking-widest text-amber-400 shadow">
          {competitionBadge}
        </div>
      )}
      <div className="flex items-center gap-3 sm:gap-4 px-3.5 sm:px-5 py-2 rounded-2xl bg-neutral-950/90 backdrop-blur-md border border-white/20 shadow-2xl text-white">
        {/* Home */}
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[11px] font-black uppercase tracking-wider">
            {homeAbbr}
          </span>
          <span className="text-lg sm:text-2xl font-black tabular-nums leading-none">
            {scoreHome}
          </span>
        </div>

        <div className="w-px h-5 bg-white/20" />

        {/* Quarter, Game Clock & Shot Clock */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-black tabular-nums">
          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
            Q{quarter}
          </span>
          <span className="text-white/95 tracking-tight">{formatTime(gameClock)}</span>
          {!isPracticeMode && (
            <span
              className={`px-1.5 py-0.5 rounded text-xs font-black tabular-nums ${
                isLowShot ? "bg-red-600 text-white animate-pulse" : "bg-white/10 text-amber-300"
              }`}
            >
              {formatShotClock(shotClock)}s
            </span>
          )}
        </div>

        <div className="w-px h-5 bg-white/20" />

        {/* Away */}
        <div className="flex items-center gap-2">
          <span className="text-lg sm:text-2xl font-black tabular-nums leading-none">
            {scoreAway}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[11px] font-black uppercase tracking-wider truncate max-w-[70px] sm:max-w-[130px]">
            {resolvedAwayLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
