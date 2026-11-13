"use client";

import { motion, AnimatePresence } from "motion/react";
import { Tv, Mic, Trophy, Play, Sparkles, X, Award } from "lucide-react";

export interface BroadcastSceneData {
  stage: "pregame" | "halftime" | "postgame" | "championship";
  homeTeamName: string;
  awayTeamName: string;
  homeAbbr: string;
  awayAbbr: string;
  homeColor: string;
  awayColor: string;
  scoreHome: number;
  scoreAway: number;
  arenaName: string;
  startersHome: string[];
  startersAway: string[];
  potgName: string;
  potgLine: string;
  interviewQuestion: string;
  interviewOptions: { label: string; quote: string; repGain: number }[];
  trophyName?: string;
}

interface BroadcastOverlaysProps {
  scene: BroadcastSceneData | null;
  onDismiss: () => void;
  onChooseInterview?: (repGain: number, quote: string) => void;
}

export default function BroadcastOverlays({
  scene,
  onDismiss,
  onChooseInterview,
}: BroadcastOverlaysProps) {
  return (
    <AnimatePresence>
      {scene && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-[185] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.94, y: 14 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 14 }}
            className="w-full max-w-2xl bg-[#080a0f] border border-[#ff963b]/40 rounded-2xl shadow-2xl overflow-hidden text-white"
          >
            {/* Broadcast Desk Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#19120b] via-[#0e121a] to-[#080a0f] border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ff963b] text-black flex items-center justify-center">
                  {scene.stage === "championship" ? (
                    <Trophy className="w-5 h-5" />
                  ) : scene.stage === "postgame" ? (
                    <Mic className="w-5 h-5" />
                  ) : (
                    <Tv className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-[#ff963b]">
                    {scene.stage === "pregame"
                      ? "APBA Primetime Network · Pregame Lineups"
                      : scene.stage === "halftime"
                      ? "Halftime Desk Presentation"
                      : scene.stage === "championship"
                      ? "Championship Trophy Ceremony"
                      : "Postgame Broadcast Interview"}
                  </div>
                  <h3 className="text-lg font-black uppercase">
                    {scene.awayTeamName} @ {scene.homeTeamName}
                  </h3>
                </div>
              </div>
              <button
                onClick={onDismiss}
                aria-label="Close Broadcast Overlay"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {scene.stage === "pregame" && (
                <>
                  <div className="text-xs text-white/65">
                    Live from <strong className="text-white">{scene.arenaName}</strong> — Arena lights dimmed for starting introductions.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="text-xs font-black uppercase" style={{ color: scene.homeColor }}>
                        {scene.homeTeamName} Starting 5
                      </div>
                      <ul className="space-y-1 text-xs text-white/85">
                        {scene.startersHome.map((n, i) => (
                          <li key={i} className="font-bold">
                            {i + 1}. {n}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="text-xs font-black uppercase text-cyan-300">
                        {scene.awayTeamName} Starting 5
                      </div>
                      <ul className="space-y-1 text-xs text-white/85">
                        {scene.startersAway.map((n, i) => (
                          <li key={i} className="font-bold">
                            {i + 1}. {n}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={onDismiss}
                    className="w-full py-3 rounded-xl bg-[#ff963b] hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>Launch Tip-Off</span>
                  </button>
                </>
              )}

              {scene.stage === "halftime" && (
                <>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between tabular-nums">
                    <div>
                      <div className="text-xs text-white/50">{scene.homeAbbr}</div>
                      <div className="text-3xl font-black">{scene.scoreHome}</div>
                    </div>
                    <div className="text-xs font-black uppercase text-[#ff963b]">HALFTIME REPORT</div>
                    <div className="text-right">
                      <div className="text-xs text-white/50">{scene.awayAbbr}</div>
                      <div className="text-3xl font-black">{scene.scoreAway}</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-1">
                    <div className="text-xs font-black uppercase text-[#ff963b] flex items-center gap-1.5">
                      <Award className="w-4 h-4" /> First-Half Pace Setter
                    </div>
                    <div className="text-base font-black">{scene.potgName}</div>
                    <div className="text-xs text-white/70 tabular-nums">{scene.potgLine}</div>
                  </div>
                  <button
                    onClick={onDismiss}
                    className="w-full py-3 rounded-xl bg-[#ff963b] hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider cursor-pointer"
                  >
                    Start 3rd Quarter
                  </button>
                </>
              )}

              {(scene.stage === "postgame" || scene.stage === "championship") && (
                <>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 to-black border border-amber-400/40 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-black uppercase text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {scene.stage === "championship"
                            ? `${scene.trophyName || "Apex Sovereign Cup"} Presentation`
                            : "Player of the Game"}
                        </span>
                      </div>
                      <div className="text-xl font-black mt-0.5">{scene.potgName}</div>
                      <div className="text-xs text-white/75 tabular-nums">{scene.potgLine}</div>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="text-xs text-white/50">Final</div>
                      <div className="text-2xl font-black text-[#ff963b]">
                        {scene.scoreHome} – {scene.scoreAway}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="text-xs font-bold text-white/80 italic">&ldquo;{scene.interviewQuestion}&rdquo;</div>
                    <div className="space-y-2">
                      {scene.interviewOptions.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            onChooseInterview?.(opt.repGain, opt.quote);
                            onDismiss();
                          }}
                          className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <span className="text-xs font-bold">{opt.label}</span>
                          <span className="text-[11px] font-black text-[#ff963b] shrink-0">+{opt.repGain} REP</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
