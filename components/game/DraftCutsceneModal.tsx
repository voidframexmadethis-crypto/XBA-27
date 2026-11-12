"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Award, Mic, Play, Sparkles, X, SkipForward, CheckCircle2, Trophy } from "lucide-react";
import {
  AthleteProfile,
  DRAFT_FRANCHISES,
  DraftRecord,
  calculateOverallRating,
  formatHeight,
  saveAthleteProfile,
} from "@/lib/athleteProfile";

interface DraftCutsceneModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AthleteProfile;
  careerLevel: number;
  onDraftComplete: (updatedProfile: AthleteProfile, draftedCityId: string) => void;
  onStartRookieDebut: (draftedCityId: string) => void;
}

type CutsceneStage = "lobby" | "on_clock" | "announcement" | "celebration";

const CONFETTI_PIECES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: ((i * 37) % 94) + 3,
  delay: (i % 7) * 0.14,
  duration: 2.2 + (i % 4) * 0.45,
  rotate: (i * 45) % 360,
}));

export default function DraftCutsceneModal({
  isOpen,
  onClose,
  profile,
  careerLevel,
  onDraftComplete,
  onStartRookieDebut,
}: DraftCutsceneModalProps) {
  const ovr = calculateOverallRating(profile.attributes);

  // Determine projected pick based on athlete OVR & career level
  const computedPickIdx = Math.max(
    0,
    Math.min(DRAFT_FRANCHISES.length - 1, Math.floor((95 - Math.min(95, ovr + careerLevel)) / 4))
  );

  const [stage, setStage] = useState<CutsceneStage>("lobby");
  const [countdown, setCountdown] = useState(3);
  const [selectedPickIndex, setSelectedPickIndex] = useState<number>(computedPickIdx);
  const [activeDraft, setActiveDraft] = useState<DraftRecord | null>(profile.draftRecord);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakLine = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const ut = new SpeechSynthesisUtterance(text);
    ut.pitch = 0.95;
    ut.rate = 1.02;
    ut.volume = 0.85;
    window.speechSynthesis.speak(ut);
  };

  const playDraftChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const notes = [392.0, 493.88, 587.33, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.14 + 0.45);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.14);
        osc.stop(ctx.currentTime + idx * 0.14 + 0.5);
      });
    } catch {
      // Ignore audio errors if blocked
    }
  };

  const finalizeDraftPick = (franchiseIdx: number) => {
    const team = DRAFT_FRANCHISES[franchiseIdx] || DRAFT_FRANCHISES[0];
    const record: DraftRecord = {
      drafted: true,
      pickNumber: team.pick,
      round: 1,
      teamName: team.teamName,
      teamCity: team.teamCity,
      teamColor: team.color,
      teamSecondary: team.secondary,
      cityId: team.cityId,
      draftedAt: new Date().toLocaleDateString(),
    };
    const updatedProfile: AthleteProfile = {
      ...profile,
      jerseyColorHex: team.color,
      draftRecord: record,
    };
    saveAthleteProfile(updatedProfile);
    setActiveDraft(record);
    onDraftComplete(updatedProfile, team.cityId);
    return record;
  };

  const startCutscene = (overrideIdx?: number) => {
    const pickIdx = overrideIdx ?? selectedPickIndex;
    const team = DRAFT_FRANCHISES[pickIdx] || DRAFT_FRANCHISES[0];

    setStage("on_clock");
    setCountdown(3);
    playDraftChime();
    speakLine(`The ${team.teamName} are now on the clock with the number ${team.pick} overall pick.`);

    let step = 3;
    const tick = () => {
      step -= 1;
      if (step > 0) {
        setCountdown(step);
        timerRef.current = setTimeout(tick, 900);
      } else {
        setCountdown(0);
        setStage("announcement");
        playDraftChime();
        speakLine(
          `With the number ${team.pick} pick in the Basketball Draft, the ${team.teamName} select ${profile.firstName} ${profile.lastName}!`
        );

        timerRef.current = setTimeout(() => {
          finalizeDraftPick(pickIdx);
          setStage("celebration");
          playDraftChime();
        }, 3200);
      }
    };

    timerRef.current = setTimeout(tick, 900);
  };

  const skipToCelebration = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    finalizeDraftPick(selectedPickIndex);
    setStage("celebration");
  };

  if (!isOpen) return null;

  const targetTeam = DRAFT_FRANCHISES[selectedPickIndex] || DRAFT_FRANCHISES[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[215] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.94, y: 18 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.94, y: 18 }}
          className="relative w-full max-w-4xl bg-neutral-950 border border-amber-500/35 rounded-2xl shadow-[0_0_90px_rgba(245,158,11,0.25)] overflow-hidden text-white flex flex-col max-h-[92vh]"
        >
          {/* Top Broadcast Header */}
          <div className="px-6 py-4 bg-neutral-900 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                  Basketball Draft Night
                </h2>
                <p className="text-xs text-white/60">
                  Draft Room · Commissioner Podium · Live Selection Cutscene
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(stage === "on_clock" || stage === "announcement") && (
                <button
                  onClick={skipToCelebration}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Skip Cutscene</span>
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Close Draft Modal"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stage Content */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 relative">
            {/* STAGE 1: DRAFT ROOM LOBBY */}
            {stage === "lobby" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                  {/* Athlete Prospect Summary */}
                  <div className="md:col-span-5 bg-neutral-900/80 border border-white/10 rounded-xl p-5 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Draft Prospect Profile
                      </div>
                      <div className="text-2xl font-black uppercase mt-1">
                        {profile.firstName} {profile.lastName}
                      </div>
                      <div className="text-xs text-white/60 mt-1">
                        #{profile.jerseyNumber} · {profile.position} · {profile.archetype} · {formatHeight(profile.heightInches)}
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 mt-4">
                        <div className="bg-black/50 border border-white/10 rounded-lg p-2.5">
                          <div className="text-[11px] text-white/50">Projected OVR</div>
                          <div className="text-xl font-black text-amber-400 tabular-nums">{ovr}</div>
                        </div>
                        <div className="bg-black/50 border border-white/10 rounded-lg p-2.5">
                          <div className="text-[11px] text-white/50">Projected Pick</div>
                          <div className="text-xl font-black text-white tabular-nums">
                            Round 1 · #{targetTeam.pick}
                          </div>
                        </div>
                      </div>
                    </div>

                    {profile.draftRecord?.drafted && (
                      <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          Currently drafted #{profile.draftRecord.pickNumber} by {profile.draftRecord.teamName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Draft Lottery / Target Franchise Selection */}
                  <div className="md:col-span-7 bg-neutral-900/80 border border-white/10 rounded-xl p-5 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-black uppercase tracking-wider text-white">
                          First Round Draft Board
                        </h3>
                        <span className="text-xs text-white/50">
                          Select destination or follow lottery projection
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {DRAFT_FRANCHISES.map((team, idx) => {
                          const isSelected = selectedPickIndex === idx;
                          return (
                            <button
                              key={team.cityId}
                              onClick={() => setSelectedPickIndex(idx)}
                              className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? "bg-amber-500/15 border-amber-400"
                                  : "bg-black/40 border-white/10 hover:bg-white/5"
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-black text-white truncate">
                                  #{team.pick} · {team.teamName}
                                </div>
                                <div className="text-[11px] text-white/50">{team.teamCity}</div>
                              </div>
                              <div
                                className="w-4 h-4 rounded-full border border-white/30 shrink-0 ml-2"
                                style={{ backgroundColor: team.color }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                      <button
                        onClick={() => startCutscene()}
                        className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Walk Draft Stage (Start Cutscene)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 2: ON THE CLOCK */}
            {stage === "on_clock" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center space-y-6"
              >
                <div className="text-xs font-black uppercase tracking-widest text-amber-400">
                  Round 1 · Pick #{targetTeam.pick} Overall
                </div>
                <div className="text-4xl sm:text-5xl font-black uppercase tracking-tight">
                  {targetTeam.teamName} Are On The Clock
                </div>
                <p className="text-sm text-white/60 max-w-md mx-auto">
                  The envelope is sealed. The Commissioner is approaching center stage at Draft Night...
                </p>
                <div className="w-24 h-24 mx-auto rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-5xl font-black text-amber-300 tabular-nums">
                  {countdown}
                </div>
              </motion.div>
            )}

            {/* STAGE 3: COMMISSIONER PODIUM ANNOUNCEMENT */}
            {stage === "announcement" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-10 text-center space-y-6 relative"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500 text-black flex items-center justify-center shadow-lg">
                  <Mic className="w-8 h-8" />
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-white/60">
                  Official Commissioner Announcement
                </div>
                <blockquote className="text-2xl sm:text-4xl font-black italic leading-snug max-w-2xl mx-auto text-white">
                  &ldquo;With the <span className="text-amber-400">#{targetTeam.pick} Pick</span> in the Basketball Draft, the{" "}
                  <span style={{ color: targetTeam.secondary }}>{targetTeam.teamName}</span> select{" "}
                  <span className="text-amber-300">
                    {profile.firstName} {profile.lastName}
                  </span>
                  !&rdquo;
                </blockquote>
                <div className="text-xs text-white/50">
                  Cameras flashing · Walking across the draft stage...
                </div>
              </motion.div>
            )}

            {/* STAGE 4: DRAFTED CELEBRATION CUTSCENE */}
            {stage === "celebration" && activeDraft && (
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative py-4 space-y-6 overflow-hidden"
              >
                {/* Confetti particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {CONFETTI_PIECES.map((c) => (
                    <motion.div
                      key={c.id}
                      initial={{ y: -30, opacity: 1, rotate: c.rotate }}
                      animate={{ y: 460, opacity: 0, rotate: c.rotate + 320 }}
                      transition={{
                        duration: c.duration,
                        delay: c.delay,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute w-2.5 h-4 rounded-sm"
                      style={{
                        left: `${c.left}%`,
                        backgroundColor:
                          c.id % 3 === 0
                            ? "#f59e0b"
                            : c.id % 3 === 1
                            ? activeDraft.teamColor
                            : "#ffffff",
                      }}
                    />
                  ))}
                </div>

                <div className="relative z-10 text-center space-y-2">
                  <div className="text-xs font-black uppercase tracking-widest text-amber-400">
                    Official Draft Selection · Round {activeDraft.round} · Pick #{activeDraft.pickNumber}
                  </div>
                  <h3 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tight">
                    Welcome To {activeDraft.teamCity}
                  </h3>
                  <p className="text-sm text-white/70">
                    {profile.firstName} {profile.lastName} (#{profile.jerseyNumber}) puts on the{" "}
                    <span className="font-bold text-white">{activeDraft.teamName}</span> cap &amp; jersey on stage!
                  </p>
                </div>

                {/* Draft Stage Card */}
                <div className="relative z-10 max-w-xl mx-auto bg-neutral-900/90 border border-white/15 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
                  {/* Jersey & Draft Cap visual */}
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className="w-16 h-6 rounded-t-full border border-white/30 flex items-center justify-center text-[9px] font-black uppercase"
                      style={{ backgroundColor: activeDraft.teamColor }}
                    >
                      DRAFTED
                    </div>
                    <div
                      className="w-24 h-24 rounded-xl mt-2 border-2 border-white/25 flex flex-col items-center justify-center shadow-xl"
                      style={{ backgroundColor: activeDraft.teamColor }}
                    >
                      <span className="text-[10px] font-black uppercase text-white/80">
                        {profile.lastName}
                      </span>
                      <span className="text-3xl font-black text-white tabular-nums">
                        #{profile.jerseyNumber}
                      </span>
                    </div>
                  </div>

                  {/* Contract & Rookie Info */}
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="text-xs uppercase font-bold text-white/50">
                      Rookie Franchise Contract Signed
                    </div>
                    <div className="text-2xl font-black text-white">{activeDraft.teamName}</div>
                    <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                      <div className="bg-black/50 border border-white/10 rounded-lg p-2">
                        <div className="text-[10px] text-white/50">Pick</div>
                        <div className="text-sm font-black text-amber-400 tabular-nums">
                          #{activeDraft.pickNumber}
                        </div>
                      </div>
                      <div className="bg-black/50 border border-white/10 rounded-lg p-2">
                        <div className="text-[10px] text-white/50">Rating</div>
                        <div className="text-sm font-black text-white tabular-nums">{ovr} OVR</div>
                      </div>
                      <div className="bg-black/50 border border-white/10 rounded-lg p-2">
                        <div className="text-[10px] text-white/50">Pos</div>
                        <div className="text-sm font-black text-cyan-400">{profile.position}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      onStartRookieDebut(activeDraft.cityId);
                      onClose();
                    }}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>Tip-Off Rookie Debut</span>
                  </button>
                  <button
                    onClick={() => setStage("lobby")}
                    className="px-5 py-3 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold uppercase text-xs tracking-wider rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Re-Run Draft Lottery</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
