"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Target,
  Flame,
  Globe,
  Sparkles,
  UserCheck,
  Award,
  Shirt,
  Info,
  X,
  Trophy,
  BookOpen,
  Users,
  Film,
  Timer,
  Flag,
  Smartphone,
  Monitor,
  Tv,
  Gamepad2,
  Volume2,
  VolumeX,
  Music,
} from "lucide-react";
import { WorldCity } from "@/lib/worldTour";
import { AthleteProfile, calculateOverallRating, formatHeight } from "@/lib/athleteProfile";
import { CareerStats, calculateLevel } from "@/lib/progression";
import type { DeviceType, InputPreference } from "@/lib/multiplayerTypes";
import type { ConnectionTransport } from "@/lib/multiplayerClient";
import type { AudioVolumeSettings } from "@/lib/audioManager";

export type GameMode = "match" | "training" | "streetball" | "freestyle";

interface MainMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMode: GameMode;
  selectedCity: WorldCity;
  athleteProfile: AthleteProfile;
  careerStats: CareerStats;
  quarterLengthSec: number;
  onChangeQuarterLength: (sec: number) => void;
  inputPreference: InputPreference;
  detectedDevice: DeviceType;
  onChangeInputPreference: (pref: InputPreference) => void;
  multiplayerRoomCode: string | null;
  multiplayerTransport: ConnectionTransport;
  multiplayerPeerCount: number;
  highlightsCount: number;
  timeoutsLeft: number;
  onSelectGameMode: (mode: GameMode) => void;
  onOpenWorldTour: () => void;
  onOpenCreateAthlete: () => void;
  onOpenDraft: () => void;
  onOpenLockerRoom: () => void;
  onOpenMovebook: () => void;
  onOpenControls: () => void;
  onOpenFeatures: () => void;
  onOpenMultiplayer: () => void;
  onOpenHighlights: () => void;
  onCallTimeout: () => void;
  onEndQuarterNow: () => void;
  onEndGame: () => void;
  audioSettings: AudioVolumeSettings;
  onChangeAudioSettings: (patch: Partial<AudioVolumeSettings>) => void;
}

export default function MainMenuModal({
  isOpen,
  onClose,
  activeMode,
  selectedCity,
  athleteProfile,
  careerStats,
  quarterLengthSec,
  onChangeQuarterLength,
  inputPreference,
  detectedDevice,
  onChangeInputPreference,
  multiplayerRoomCode,
  multiplayerTransport,
  multiplayerPeerCount,
  highlightsCount,
  timeoutsLeft,
  onSelectGameMode,
  onOpenWorldTour,
  onOpenCreateAthlete,
  onOpenDraft,
  onOpenLockerRoom,
  onOpenMovebook,
  onOpenControls,
  onOpenFeatures,
  onOpenMultiplayer,
  onOpenHighlights,
  onCallTimeout,
  onEndQuarterNow,
  onEndGame,
  audioSettings,
  onChangeAudioSettings,
}: MainMenuModalProps) {
  if (!isOpen) return null;

  const ovr = calculateOverallRating(athleteProfile.attributes);
  const levelInfo = calculateLevel(careerStats.xp);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[185] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.96, y: 16 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl bg-neutral-950 border border-white/15 rounded-2xl p-5 sm:p-8 shadow-2xl text-white space-y-6 max-h-[94vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-black font-black text-xl flex items-center justify-center shrink-0">
                2K
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-2k-gold">
                  Main Menu
                </h2>
                <p className="text-xs text-white/60">
                  {athleteProfile.firstName} {athleteProfile.lastName} · #{athleteProfile.jerseyNumber} · {athleteProfile.position} · {ovr} OVR · Level {levelInfo.level} {levelInfo.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  onClose();
                  onOpenControls();
                }}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/85 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <Info className="w-4 h-4" />
                <span>Controls</span>
              </button>
              <button
                onClick={onClose}
                aria-label="Return to Court"
                className="min-w-[44px] min-h-[44px] px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-white"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Play</span>
              </button>
            </div>
          </div>

          {/* Primary Featured Row: Play Arena, Cross-Play Multiplayer, Draft Night */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                onSelectGameMode("match");
                onClose();
              }}
              className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-neutral-900 to-neutral-950 border border-amber-500/45 hover:border-amber-400 text-left transition-all flex flex-col justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <div className="flex items-center justify-between">
                <Play className="w-7 h-7 text-amber-400" />
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  {selectedCity.name}
                </span>
              </div>
              <div className="mt-5">
                <div className="text-xl font-black uppercase tracking-tight text-white">
                  Play Arena Match
                </div>
                <p className="text-xs text-white/65 mt-1">
                  5v5 full-court game with Tip-Off, quarter highlights, and postgame leaderboard.
                </p>
              </div>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenMultiplayer();
              }}
              className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-neutral-900 to-neutral-950 border border-cyan-500/45 hover:border-cyan-400 text-left transition-all flex flex-col justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <div className="flex items-center justify-between">
                <Users className="w-7 h-7 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-300 uppercase">
                  {multiplayerTransport !== "disconnected" && multiplayerRoomCode
                    ? `${multiplayerRoomCode} · ${multiplayerPeerCount} On Court`
                    : "Cross-Play Live"}
                </span>
              </div>
              <div className="mt-5">
                <div className="text-xl font-black uppercase tracking-tight text-white">
                  Multiplayer Lobby
                </div>
                <p className="text-xs text-white/65 mt-1">
                  Play live across Phone, Tablet, Computer, and Smart TV via rooms or Public Court.
                </p>
              </div>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenDraft();
              }}
              className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-neutral-900 to-neutral-950 border border-emerald-500/40 hover:border-emerald-400 text-left transition-all flex flex-col justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <div className="flex items-center justify-between">
                <Award className="w-7 h-7 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300 uppercase">
                  {athleteProfile.draftRecord?.drafted
                    ? `Pick #${athleteProfile.draftRecord.pickNumber}`
                    : "Prospect"}
                </span>
              </div>
              <div className="mt-5">
                <div className="text-xl font-black uppercase tracking-tight text-white">
                  Draft Night
                </div>
                <p className="text-xs text-white/65 mt-1">
                  Enter the Draft Room, walk the stage in the cutscene, and tip off your Rookie Debut.
                </p>
              </div>
            </button>
          </div>

          {/* Core Modes & Studio Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <button
              onClick={() => {
                onSelectGameMode("training");
                onClose();
              }}
              className={`min-h-[100px] p-4 rounded-2xl border text-left transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 ${
                activeMode === "training"
                  ? "bg-white/10 border-amber-400"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/25"
              }`}
            >
              <Target className="w-6 h-6 text-cyan-400 mb-2.5" />
              <div className="text-base font-black uppercase text-white">Training Drills</div>
              <p className="text-xs text-white/60 mt-1">
                Guided shooting and handles drills to earn Career XP at your own pace.
              </p>
            </button>

            <button
              onClick={() => {
                onSelectGameMode("streetball");
                onClose();
              }}
              className={`min-h-[100px] p-4 rounded-2xl border text-left transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 ${
                activeMode === "streetball"
                  ? "bg-white/10 border-amber-400"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/25"
              }`}
            >
              <Flame className="w-6 h-6 text-orange-400 mb-2.5" />
              <div className="text-base font-black uppercase text-white">Streetball</div>
              <p className="text-xs text-white/60 mt-1">
                Outdoor playground blacktop court with weathered asphalt and grass tufts.
              </p>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenWorldTour();
              }}
              className="min-h-[100px] p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/25 text-left transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <Globe className="w-6 h-6 text-blue-400 mb-2.5" />
              <div className="text-base font-black uppercase text-white">World Tour</div>
              <p className="text-xs text-white/60 mt-1">
                28 host cities across every continent with localized arenas and jerseys.
              </p>
            </button>

            <button
              onClick={() => {
                onSelectGameMode("freestyle");
                onClose();
              }}
              className={`min-h-[100px] p-4 rounded-2xl border text-left transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 ${
                activeMode === "freestyle"
                  ? "bg-white/10 border-amber-400"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/25"
              }`}
            >
              <Sparkles className="w-6 h-6 text-purple-400 mb-2.5" />
              <div className="text-base font-black uppercase text-white">Freestyle</div>
              <p className="text-xs text-white/60 mt-1">
                Open-court shootaround for dunks, step-backs, fadeaways, and handles.
              </p>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenCreateAthlete();
              }}
              className="min-h-[100px] p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/25 text-left transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <UserCheck className="w-6 h-6 text-amber-400 mb-2.5" />
              <div className="text-base font-black uppercase text-white">Create Athlete</div>
              <p className="text-xs text-white/60 mt-1">
                {athleteProfile.firstName} {athleteProfile.lastName} · {formatHeight(athleteProfile.heightInches)} · {athleteProfile.archetype}
              </p>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenLockerRoom();
              }}
              className="min-h-[100px] p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/25 text-left transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <Shirt className="w-6 h-6 text-red-400 mb-2.5" />
              <div className="text-base font-black uppercase text-white">Locker Room</div>
              <p className="text-xs text-white/60 mt-1">
                Jerseys, sneakers &amp; gear · Career {careerStats.matchesWon}W - {careerStats.matchesPlayed - careerStats.matchesWon}L
              </p>
            </button>
          </div>

          {/* Match Controls & Game Highlights (Moved off-screen into Main Menu) */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-white/70">
              In-Game Controls, Highlights &amp; Playbook
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => {
                  onClose();
                  onOpenHighlights();
                }}
                disabled={highlightsCount === 0}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-40 border border-amber-500/40 text-amber-200 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
              >
                <Film className="w-4 h-4" />
                <span>Game Highlights ({highlightsCount}/3)</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onCallTimeout();
                }}
                disabled={timeoutsLeft <= 0}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/15 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
              >
                <Timer className="w-4 h-4 text-amber-400" />
                <span>Timeout &amp; Tactics ({timeoutsLeft})</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenMovebook();
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-cyan-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Movebook (101 Moves)</span>
              </button>

              {(activeMode === "match" || activeMode === "streetball") && (
                <>
                  <button
                    onClick={() => {
                      onClose();
                      onEndQuarterNow();
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/85 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 text-emerald-400" />
                    <span>End Quarter (Play Highlights)</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onEndGame();
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                  >
                    <Flag className="w-4 h-4" />
                    <span>End Game &amp; Leaderboard</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Cross-Device Controls & Quarter Length Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
              <div className="text-xs font-black uppercase tracking-wider text-white/75 flex items-center justify-between">
                <span>Input Device Mode</span>
                <span className="text-[11px] font-normal text-white/50">Detected: {detectedDevice}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  { id: "auto", label: "Auto", icon: Sparkles },
                  { id: "touch", label: "Phone / Tablet", icon: Smartphone },
                  { id: "keyboard", label: "Computer", icon: Monitor },
                  { id: "tv", label: "TV Remote", icon: Tv },
                  { id: "gamepad", label: "Controller", icon: Gamepad2 },
                ] as const).map((opt) => {
                  const Icon = opt.icon;
                  const active = inputPreference === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => onChangeInputPreference(opt.id)}
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${
                        active
                          ? "bg-amber-500 text-black border-amber-300"
                          : "bg-black/40 text-white/80 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
              <div className="text-xs font-black uppercase tracking-wider text-white/75">
                Quarter Clock Length
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { sec: 60, label: "1 Min" },
                  { sec: 120, label: "2 Min" },
                  { sec: 300, label: "5 Min" },
                  { sec: 720, label: "12 Min" },
                ].map((opt) => (
                  <button
                    key={opt.sec}
                    onClick={() => onChangeQuarterLength(opt.sec)}
                    className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                      quarterLengthSec === opt.sec
                        ? "bg-amber-500 text-black border-amber-300"
                        : "bg-black/40 text-white/80 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Arena Audio Mixer (Music, Sound Effects, Crowd Ambience) */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-black uppercase tracking-wider text-white/80 flex items-center gap-2">
                {audioSettings.muted ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-amber-400" />
                )}
                <span>Arena Audio Mixer</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onChangeAudioSettings({ musicEnabled: !audioSettings.musicEnabled })
                  }
                  className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border cursor-pointer transition-colors flex items-center gap-1.5 ${
                    audioSettings.musicEnabled
                      ? "bg-amber-500/20 border-amber-400/70 text-amber-300 hover:bg-amber-500/30"
                      : "bg-black/40 border-white/15 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Music: {audioSettings.musicEnabled ? "ON" : "OFF"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeAudioSettings({ muted: !audioSettings.muted })}
                  className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border cursor-pointer transition-colors ${
                    audioSettings.muted
                      ? "bg-red-600/80 border-red-400 text-white"
                      : "bg-black/40 border-white/15 text-white/80 hover:bg-white/10"
                  }`}
                >
                  {audioSettings.muted ? "Unmute Audio" : "Mute All"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                { key: "sfx", label: "Sound Effects", value: audioSettings.sfx, disabled: false },
                { key: "crowd", label: "Crowd Ambience", value: audioSettings.crowd, disabled: false },
                {
                  key: "music",
                  label: "Menu Music · Rise From Nothing",
                  value: audioSettings.music,
                  disabled: !audioSettings.musicEnabled,
                },
              ] as const).map((ch) => (
                <label
                  key={ch.key}
                  className={`space-y-1.5 block transition-opacity ${
                    ch.disabled ? "opacity-50" : "opacity-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-white/75">
                    <span className="truncate">{ch.label}</span>
                    <span className="tabular-nums text-amber-300 shrink-0">
                      {ch.disabled ? "OFF" : `${Math.round(ch.value * 100)}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(ch.value * 100)}
                    onChange={(e) => {
                      const nextVal = Number(e.target.value) / 100;
                      if (ch.key === "music" && !audioSettings.musicEnabled && nextVal > 0) {
                        onChangeAudioSettings({ music: nextVal, musicEnabled: true });
                      } else {
                        onChangeAudioSettings({ [ch.key]: nextVal });
                      }
                    }}
                    className="w-full accent-amber-400 cursor-pointer h-2 bg-white/15 rounded-lg"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
            <button
              onClick={() => {
                onClose();
                onOpenFeatures();
              }}
              className="min-h-[40px] flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              <span>Modes &amp; Features Directory</span>
            </button>
            <button
              onClick={onClose}
              className="min-h-[40px] px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold uppercase tracking-wider cursor-pointer"
            >
              Return to Court
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
