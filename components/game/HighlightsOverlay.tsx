"use client";

import { motion, AnimatePresence } from "motion/react";
import { Film, ChevronLeft, ChevronRight, RotateCcw, FastForward } from "lucide-react";
import type { HighlightClip } from "@/lib/highlights";

interface HighlightsOverlayProps {
  isOpen: boolean;
  clips: HighlightClip[];
  activeClipIndex: number;
  quarterCompleted: number;
  isEndOfMatch?: boolean;
  onSelectClip: (index: number) => void;
  onReplayCurrent: () => void;
  onContinue: () => void;
}

export default function HighlightsOverlay({
  isOpen,
  clips,
  activeClipIndex,
  quarterCompleted,
  isEndOfMatch = false,
  onSelectClip,
  onReplayCurrent,
  onContinue,
}: HighlightsOverlayProps) {
  const clip = clips[activeClipIndex] || clips[0];

  const isTikiSlam = clip?.signatureTag === "tiki_tiki_slam";

  return (
    <AnimatePresence>
      {isOpen && clips.length > 0 && clip && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] right-[max(0.75rem,env(safe-area-inset-right))] sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full sm:max-w-3xl z-[160] pointer-events-auto"
        >
        <div
          className={`backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-2xl text-white border ${
            isTikiSlam
              ? "bg-gradient-to-r from-emerald-950/95 via-neutral-950/95 to-amber-950/95 border-emerald-400 shadow-[0_0_45px_rgba(16,185,129,0.45)]"
              : "bg-neutral-950/92 border-amber-500/40"
          }`}
        >
          {/* Top Highlight Header & Play Info */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isTikiSlam
                    ? "bg-gradient-to-tr from-emerald-400 to-yellow-400 text-black"
                    : "bg-amber-500 text-black"
                }`}
              >
                <Film className="w-5 h-5" />
              </div>
              <div>
                <div
                  className={`text-[11px] font-black uppercase tracking-widest ${
                    isTikiSlam ? "text-emerald-300" : "text-amber-400"
                  }`}
                >
                  {isTikiSlam
                    ? "★ TIKI TIKI SIGNATURE SLAM REPLAY · EMERALD & GOLD EDITION ★"
                    : `Game Highlights · Q${quarterCompleted} Last ${clips.length} Scoring ${clips.length === 1 ? "Play" : "Plays"}`}
                </div>
                <div className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                  {clip.scorerName} · {clip.playType} (+{clip.points})
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-white/60">
                Q{clip.quarter} · {clip.clockText}
              </div>
              <div className="text-sm font-black tabular-nums text-white">
                Home {clip.scoreHomeAfter} - Away {clip.scoreAwayAfter}
              </div>
            </div>
          </div>

          {/* Playback Controls & Clip Dots */}
          <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {clips.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => onSelectClip(idx)}
                  className={`min-h-[44px] px-3.5 rounded-xl text-xs font-black uppercase tracking-wider border cursor-pointer ${
                    idx === activeClipIndex
                      ? "bg-amber-500 text-black border-amber-300"
                      : "bg-white/5 text-white/75 border-white/10 hover:bg-white/10"
                  }`}
                >
                  Play {idx + 1}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onSelectClip((activeClipIndex - 1 + clips.length) % clips.length)}
                aria-label="Previous Highlight"
                className="min-h-[44px] min-w-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={onReplayCurrent}
                className="min-h-[44px] px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Replay</span>
              </button>
              <button
                onClick={() => onSelectClip((activeClipIndex + 1) % clips.length)}
                aria-label="Next Highlight"
                className="min-h-[44px] min-w-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={onContinue}
                className="min-h-[44px] px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <FastForward className="w-4 h-4" />
                <span>{isEndOfMatch ? "Finish & Leaderboard" : `Start Q${quarterCompleted + 1}`}</span>
              </button>
            </div>
          </div>
        </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
