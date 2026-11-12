"use client";

import { motion, AnimatePresence } from "motion/react";
import { Timer, AlertTriangle, Flame, ShieldAlert, RotateCcw } from "lucide-react";
import {
  getShotClockUrgency,
  formatShotClock,
  calculateShotClockProgress,
  SHOT_CLOCK_FULL,
} from "@/lib/shotClock";

interface ShotClockDisplayProps {
  shotClock: number;
  resetPulseKey?: number;
  lastResetReason?: string;
  isPaused?: boolean;
}

export default function ShotClockDisplay({
  shotClock,
  resetPulseKey = 0,
  lastResetReason = "",
  isPaused = false,
}: ShotClockDisplayProps) {
  const urgency = getShotClockUrgency(shotClock);
  const formattedTime = formatShotClock(shotClock);
  const progress = calculateShotClockProgress(shotClock, SHOT_CLOCK_FULL);

  // SVG circular gauge math (radius 22, circumference ~138.2)
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  // Urgency styling
  const getColors = () => {
    switch (urgency) {
      case "expired":
        return {
          text: "text-red-500",
          border: "border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.8)]",
          ring: "#ef4444",
          badgeBg: "bg-red-500 text-white",
          label: "VIOLATION",
          glow: "bg-red-500/20",
        };
      case "critical":
        return {
          text: "text-red-400",
          border: "border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse",
          ring: "#f43f5e",
          badgeBg: "bg-red-500/90 text-white animate-pulse",
          label: "SHOOT NOW!",
          glow: "bg-red-500/15",
        };
      case "warning":
        return {
          text: "text-amber-400",
          border: "border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.35)]",
          ring: "#f59e0b",
          badgeBg: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
          label: "UNDER 10s",
          glow: "bg-amber-500/10",
        };
      case "normal":
      default:
        return {
          text: "text-amber-300",
          border: "border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
          ring: "#fbbf24",
          badgeBg: "bg-amber-400/10 text-amber-200 border border-amber-400/30",
          label: "POSSESSION",
          glow: "bg-amber-400/5",
        };
    }
  };

  const colors = getColors();

  const getResetLabel = (reason: string) => {
    switch (reason) {
      case "shot_attempt":
        return "SHOT ATTEMPT • RESET 24s";
      case "basket_made":
        return "BASKET SCORED • RESET 24s";
      case "turnover":
      case "violation":
        return "TURNOVER • RESET 24s";
      case "foul":
        return "WHISTLE / FOUL • RESET 24s";
      case "offensive_rebound":
      case "rebound":
        return "REBOUND • RESET 24s";
      default:
        return "RESET 24s";
    }
  };

  return (
    <>
      {/* Full-Screen Peripheral Edge Pressure Vignette when <= 5s */}
      {urgency === "critical" && (
        <div
          data-testid="shot-clock-critical-vignette"
          className="fixed inset-0 pointer-events-none z-10 border-[6px] border-red-500/30 shadow-[inset_0_0_90px_rgba(239,68,68,0.35)] animate-pulse"
        />
      )}

      {urgency === "expired" && (
        <div
          data-testid="shot-clock-expired-vignette"
          className="fixed inset-0 pointer-events-none z-10 border-[8px] border-red-600/60 shadow-[inset_0_0_120px_rgba(220,38,38,0.5)]"
        />
      )}

      {/* On-Screen Shot Clock Stanchion Widget */}
      <aside
        aria-label="24-Second Shot Clock Display"
        className="fixed top-36 right-3 sm:top-20 sm:right-6 pointer-events-auto z-30 flex flex-col items-end gap-1.5"
      >
        <motion.div
          layout
          className={`relative flex items-center gap-2 sm:gap-3 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-gradient-to-br from-neutral-950/95 via-black/95 to-neutral-900/95 backdrop-blur-xl border-2 ${colors.border} transition-all duration-300`}
        >
          {/* Subtle Glow Backdrop */}
          <div className={`absolute inset-0 rounded-2xl ${colors.glow} pointer-events-none`} />

          {/* Circular Countdown Progress Gauge */}
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 -rotate-90 transform" viewBox="0 0 52 52">
              {/* Background Track */}
              <circle
                cx="26"
                cy="26"
                r={radius}
                className="stroke-white/10"
                strokeWidth="4"
                fill="none"
              />
              {/* Dynamic Progress Indicator */}
              <circle
                cx="26"
                cy="26"
                r={radius}
                stroke={colors.ring}
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                  transition: urgency === "critical" ? "stroke-dashoffset 0.1s linear" : "stroke-dashoffset 0.4s ease-out",
                }}
              />
            </svg>

            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {urgency === "expired" ? (
                <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 animate-bounce" />
              ) : urgency === "critical" ? (
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 animate-pulse" />
              ) : urgency === "warning" ? (
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              ) : (
                <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 opacity-80" />
              )}
            </div>
          </div>

          {/* Digital Time & Pressure Status */}
          <div className="flex flex-col items-start pr-1 min-w-[65px] sm:min-w-[76px]">
            <div className="flex items-center gap-1.5 w-full justify-between">
              <span className="text-[8px] sm:text-[9px] uppercase font-black tracking-widest text-white/50">
                Shot Clock
              </span>
              <span className={`text-[7px] sm:text-[8px] font-black uppercase px-1 sm:px-1.5 py-0.5 rounded ${colors.badgeBg} leading-tight`}>
                {colors.label}
              </span>
            </div>

            {/* Time Display */}
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                data-testid="shot-clock-timer-digits"
                className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tight leading-none ${colors.text} drop-shadow-[0_0_12px_currentColor]`}
              >
                {formattedTime}
              </span>
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-white/40 tracking-widest">
                SEC
              </span>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Reset Flash Toast */}
        <AnimatePresence>
          {resetPulseKey > 0 && lastResetReason && (
            <motion.div
              key={resetPulseKey}
              initial={{ opacity: 0, y: -6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-black/80 backdrop-blur-md rounded-xl border border-emerald-400/50 shadow-lg text-[10px] font-black uppercase tracking-wider text-emerald-300"
            >
              <RotateCcw className="w-3 h-3 text-emerald-400 animate-spin" />
              <span>{getResetLabel(lastResetReason)}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>
    </>
  );
}
