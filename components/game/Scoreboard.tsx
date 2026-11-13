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
    <div className="fixed top-[max(0.65rem,env(safe-area-inset-top))] left-[max(0.65rem,env(safe-area-inset-left))] sm:left-1/2 sm:-translate-x-1/2 pointer-events-none z-20 max-w-[calc(100vw-7.75rem)] sm:max-w-[calc(100vw-16rem)] flex flex-col items-start sm:items-center gap-1">
      {competitionBadge && (
        <div className="px-2.5 py-0.5 rounded-md bg-[#090b10]/90 border border-[#ff963b]/40 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#ff963b] shadow">
          {competitionBadge}
        </div>
      )}
      <div className="flex items-center gap-2 sm:gap-4 px-2.5 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-neutral-950/85 backdrop-blur-md border border-white/15 shadow-lg text-white">
        {/* Home */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-red-400">
            {homeAbbr}
          </span>
          <span className="text-base sm:text-2xl font-black tabular-nums leading-none">
            {scoreHome}
          </span>
        </div>

        <div className="w-px h-4 sm:h-5 bg-white/15" />

        {/* Quarter, Game Clock & Shot Clock */}
        <div className="flex items-center gap-1.5 sm:gap-3 text-[11px] sm:text-sm font-black tabular-nums">
          <span className="text-amber-400">Q{quarter}</span>
          <span className="text-white/95">{formatTime(gameClock)}</span>
          {!isPracticeMode && (
            <span
              className={`px-1 sm:px-1.5 py-0.5 rounded text-[11px] sm:text-xs font-black tabular-nums ${
                isLowShot ? "bg-red-600 text-white" : "bg-white/10 text-amber-300"
              }`}
            >
              :{formatShotClock(shotClock)}
            </span>
          )}
        </div>

        <div className="w-px h-4 sm:h-5 bg-white/15" />

        {/* Away */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-base sm:text-2xl font-black tabular-nums leading-none">
            {scoreAway}
          </span>
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-cyan-300 truncate max-w-[54px] sm:max-w-[110px]">
            {resolvedAwayLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
