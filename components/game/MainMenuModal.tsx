"use client";

import { useRef, useState } from "react";
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
  Cast,
  ArrowRight,
  ArrowLeft,
  CircleDot,
  SlidersHorizontal,
  Briefcase,
  Palette,
  Download,
  Upload,
  HardDrive,
  Moon,
  Sun,
  Clock,
  Building2,
} from "lucide-react";
import { WORLD_CITIES, WorldCity } from "@/lib/worldTour";
import { ALL_OFFENSE_MOVES, ALL_DEFENSE_MOVES } from "@/lib/basketballMoves";
import type { NightGameMode } from "@/lib/customization";
import { AthleteProfile, calculateOverallRating, formatHeight } from "@/lib/athleteProfile";
import { CareerStats, calculateLevel } from "@/lib/progression";
import type { DeviceType, InputPreference } from "@/lib/multiplayerTypes";
import type { ConnectionTransport } from "@/lib/multiplayerClient";
import type { AudioVolumeSettings } from "@/lib/audioManager";
import {
  exportAllSavesBundle,
  getStorageInventory,
  importAllSavesBundle,
} from "@/lib/saveSystem";

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
  onOpenScreenMirroring: () => void;
  isMirroring: boolean;
  onOpenHighlights: () => void;
  onCallTimeout: () => void;
  onEndQuarterNow: () => void;
  onEndGame: () => void;
  audioSettings: AudioVolumeSettings;
  onChangeAudioSettings: (patch: Partial<AudioVolumeSettings>) => void;
  onOpenLeagueCentral?: () => void;
  onOpenCareerHub?: () => void;
  onOpenFranchise?: () => void;
  onOpenCustomization?: () => void;
  onOpenTrainingAcademy?: () => void;
  onOpenAllStarWeekend?: () => void;
  activeDivision?: "mens" | "womens";
  onChangeDivision?: (div: "mens" | "womens") => void;
  leagueSummaryLabel?: string;
  careerSummaryLabel?: string;
  franchiseSummaryLabel?: string;
  onOpenUniverse?: () => void;
  universeSummaryLabel?: string;
  onOpenNationalTour?: () => void;
  nationalTourSummaryLabel?: string;
  nightGameMode?: NightGameMode;
  onChangeNightGameMode?: (mode: NightGameMode) => void;
  onSavesImported?: () => void;
  onOpenBusinessHub?: () => void;
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
  onOpenScreenMirroring,
  isMirroring,
  onOpenHighlights,
  onCallTimeout,
  onEndQuarterNow,
  onEndGame,
  audioSettings,
  onChangeAudioSettings,
  onOpenLeagueCentral,
  onOpenCareerHub,
  onOpenFranchise,
  onOpenCustomization,
  onOpenTrainingAcademy,
  onOpenAllStarWeekend,
  activeDivision = "mens",
  onChangeDivision,
  leagueSummaryLabel,
  careerSummaryLabel,
  franchiseSummaryLabel,
  onOpenUniverse,
  universeSummaryLabel,
  onOpenNationalTour,
  nationalTourSummaryLabel,
  nightGameMode = "auto",
  onChangeNightGameMode,
  onSavesImported,
  onOpenBusinessHub,
}: MainMenuModalProps) {
  const [activeTab, setActiveTab] = useState<"home" | "settings">("home");
  const [saveNotice, setSaveNotice] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const ovr = calculateOverallRating(athleteProfile.attributes);
  const levelInfo = calculateLevel(careerStats.xp);

  const handleExportSaves = () => {
    const bundle = exportAllSavesBundle();
    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `courtlegeneds-championship-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSaveNotice("Save backup JSON exported cleanly.");
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const raw = await file.text();
    const res = importAllSavesBundle(raw);
    if (res.ok) {
      setSaveNotice(`Restored ${res.restoredKeys.length} career/league save slots.`);
      onSavesImported?.();
    } else {
      setSaveNotice(res.error || "Import failed.");
    }
    e.target.value = "";
  };

  const handleCloseMenu = () => {
    setActiveTab("home");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#080a0f]/95 backdrop-blur-xl z-[185] overflow-y-auto overscroll-contain"
        >
          <motion.main
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.18 }}
            className="min-h-full w-full bg-[#080a0f] text-white flex flex-col justify-between pb-[max(0.5rem,env(safe-area-inset-bottom))]"
          >
            {/* Header */}
            <header className="sticky top-0 z-20 min-h-[76px] sm:min-h-[85px] px-[5%] py-3.5 pt-[max(0.9rem,env(safe-area-inset-top))] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-5 bg-[#090b10]/95 backdrop-blur-md border-b border-[#252a32]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ff963b]/15 border border-[#ff963b]/40 flex items-center justify-center text-[#ff963b] shrink-0">
                    <CircleDot className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="m-0 text-lg sm:text-[22px] font-black tracking-wide leading-tight uppercase">
                      COURT<span className="text-[#ff963b]">LEGENDS</span>
                    </h1>
                    <small className="block text-[#8e98a8] text-[9px] font-bold tracking-[3px] uppercase">
                      ULTIMATE BASKETBALL · CHAMPIONSHIP EDITION
                    </small>
                  </div>
                </div>

                {/* Mobile Close / Return Button */}
                <button
                  type="button"
                  onClick={handleCloseMenu}
                  aria-label="Return to Court"
                  className="sm:hidden min-w-[44px] min-h-[44px] px-3 rounded bg-[#ff963b] text-[#101014] font-black text-[11px] uppercase flex items-center justify-center gap-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Court</span>
                </button>
              </div>

              <nav className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-5 w-full sm:w-auto">
                {onChangeDivision && (
                  <div className="flex rounded-lg bg-black/60 border border-[#343b46] p-0.5">
                    {(
                      [
                        { id: "mens", label: "MEN'S APBA" },
                        { id: "womens", label: "WOMEN'S WPBA" },
                      ] as const
                    ).map((div) => (
                      <button
                        key={div.id}
                        type="button"
                        onClick={() => onChangeDivision(div.id)}
                        className={`min-h-[34px] px-2.5 py-1 rounded text-[10px] font-black tracking-wider uppercase cursor-pointer transition-colors ${
                          activeDivision === div.id
                            ? "bg-[#ff963b] text-[#101014]"
                            : "text-[#aab0bb] hover:text-white"
                        }`}
                      >
                        {div.label}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab("home")}
                  className={`min-h-[40px] px-1.5 font-extrabold text-[10px] sm:text-[11px] tracking-wider uppercase cursor-pointer transition-colors ${
                    activeTab === "home"
                      ? "text-[#ff963b]"
                      : "text-[#aab0bb] hover:text-white"
                  }`}
                >
                  HOME
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCloseMenu();
                    onOpenWorldTour();
                  }}
                  className="min-h-[40px] px-1.5 font-extrabold text-[10px] sm:text-[11px] tracking-wider uppercase text-[#aab0bb] hover:text-white cursor-pointer transition-colors"
                >
                  WORLD TOUR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCloseMenu();
                    onOpenCreateAthlete();
                  }}
                  className="min-h-[40px] px-1.5 font-extrabold text-[10px] sm:text-[11px] tracking-wider uppercase text-[#aab0bb] hover:text-white cursor-pointer transition-colors"
                >
                  MY PLAYER
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab((prev) => (prev === "settings" ? "home" : "settings"))
                  }
                  className={`min-h-[40px] px-1.5 font-extrabold text-[10px] sm:text-[11px] tracking-wider uppercase cursor-pointer transition-colors ${
                    activeTab === "settings"
                      ? "text-[#ff963b]"
                      : "text-[#aab0bb] hover:text-white"
                  }`}
                >
                  SETTINGS
                </button>
                <button
                  type="button"
                  onClick={handleCloseMenu}
                  aria-label="Return to Court"
                  className="hidden sm:inline-flex min-h-[40px] px-3.5 rounded bg-[#ff963b] hover:bg-[#ffc078] text-[#101014] font-black text-[11px] tracking-wider uppercase items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>COURT</span>
                </button>
              </nav>
            </header>

            {activeTab === "home" ? (
              <div className="flex-1 flex flex-col">
                {/* Hero Section */}
                <section
                  className="relative min-h-[380px] sm:min-h-[440px] px-[6%] sm:px-[7%] pt-10 pb-20 sm:py-16 flex items-center overflow-hidden border-b border-[#252a32]"
                  style={{
                    background:
                      "radial-gradient(ellipse at 75% 45%, #59402b 0%, transparent 42%), linear-gradient(110deg, #111720, #25201d 55%, #090b10)",
                  }}
                >
                  {/* Watermark Emblem */}
                  <div className="pointer-events-none absolute right-[6%] top-8 opacity-15 -rotate-12 text-[#ff963b]">
                    <CircleDot className="w-44 h-44 sm:w-64 sm:h-64" strokeWidth={1.25} />
                  </div>

                  {/* Hero Gradient Overlay */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(8, 10, 15, 0.96), rgba(8, 10, 15, 0.55), transparent)",
                    }}
                  />

                  <div className="relative z-10 max-w-[620px]">
                    <div className="flex items-center text-[#ffab53] text-[10px] sm:text-[11px] font-black tracking-[2px] uppercase mb-4 sm:mb-5">
                      <span className="inline-block h-2 w-2 bg-[#ff963b] rounded-full mr-2.5 shrink-0" />
                      <span>THE NEXT GENERATION OF BASKETBALL</span>
                    </div>

                    <h2 className="text-[46px] sm:text-[74px] md:text-[88px] leading-[0.88] font-black tracking-[-2px] sm:tracking-[-4px] m-0 uppercase">
                      OWN THE
                      <br />
                      <span className="text-[#ff963b]">COURT.</span>
                    </h2>

                    <p className="text-[#b9c0cb] text-sm sm:text-[15px] leading-relaxed max-w-[380px] my-5">
                      Build your legacy. Represent your city. Compete against the world.
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectGameMode("match");
                          handleCloseMenu();
                        }}
                        className="min-h-[48px] bg-[#ff963b] hover:bg-[#ffc078] hover:-translate-y-0.5 rounded px-8 py-4 text-[#101014] text-xs sm:text-[13px] font-black tracking-wider uppercase inline-flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>PLAY NOW</span>
                      </button>

                      <div className="px-3.5 py-2.5 rounded bg-black/50 border border-white/15 text-xs text-white/80">
                        <span className="font-black text-white">
                          {athleteProfile.firstName} {athleteProfile.lastName}
                        </span>{" "}
                        · <span className="text-[#ff963b] font-black">{ovr} OVR</span> ·{" "}
                        <span className="text-cyan-300 font-black">
                          {activeDivision === "womens" ? "WPBA" : "APBA"}
                        </span>{" "}
                        ·{" "}
                        <span>
                          {selectedCity.flag} {selectedCity.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hero Bottom Strip */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-around gap-2 px-3 py-3.5 bg-black/55 border-t border-white/15 text-[#d3d6dc] text-[8px] sm:text-[10px] font-black tracking-wider uppercase text-center">
                    <span>MEN&apos;S &amp; WOMEN&apos;S PRO LEAGUES</span>
                    <span>16 NATIONS · {WORLD_CITIES.length} GLOBAL CITIES</span>
                    <span>ONLINE &amp; OFFLINE MULTIPLAYER</span>
                  </div>
                </section>

                {/* Game Modes 01 - 12 */}
                <section className="px-[5%] py-7 sm:py-9 space-y-6">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <small className="block text-[#ff963b] font-black tracking-[2px] text-[10px] uppercase">
                        CHAMPIONSHIP SUITE
                      </small>
                      <h2 className="text-2xl sm:text-[27px] font-black mt-1.5 m-0 uppercase">
                        GAME MODES &amp; LEAGUE
                      </h2>
                    </div>
                    <span className="text-[#78808d] text-xs font-bold tabular-nums">
                      01 — 12
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {/* 01 Play Now */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectGameMode("match");
                        handleCloseMenu();
                      }}
                      className="group relative min-h-[125px] p-5 text-left text-white border border-[#343b46] hover:border-[#ff963b] rounded-[7px] bg-gradient-to-br from-[#1b222d] to-[#101319] hover:from-[#30271f] hover:to-[#171a20] hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between transition-all overflow-hidden"
                    >
                      <div className="flex items-center justify-between w-full">
                        <Play className="w-6 h-6 text-[#ff963b]" />
                        <span className="text-[#667080] text-[11px] font-black">01</span>
                      </div>
                      <div className="pr-8">
                        <h3 className="mt-4 mb-1 text-[16px] font-black uppercase">
                          PLAY NOW
                        </h3>
                        <p className="text-[#9da6b4] text-[11px] m-0">
                          5v5 Exhibition · {selectedCity.arenaName}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#ff963b] absolute bottom-4 right-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* 02 League Central (82-Game Season & Playoffs) */}
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseMenu();
                        onOpenLeagueCentral?.();
                      }}
                      className="group relative min-h-[125px] p-5 text-left text-white border border-amber-500/40 hover:border-[#ff963b] rounded-[7px] bg-gradient-to-br from-[#231d15] to-[#101319] hover:from-[#342617] hover:to-[#171a20] hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between transition-all overflow-hidden"
                    >
                      <div className="flex items-center justify-between w-full">
                        <Trophy className="w-6 h-6 text-amber-400" />
                        <span className="text-[#667080] text-[11px] font-black">02</span>
                      </div>
                      <div className="pr-8">
                        <h3 className="mt-4 mb-1 text-[16px] font-black uppercase">
                          {activeDivision === "womens" ? "WPBA WOMEN'S LEAGUE" : "APBA MEN'S LEAGUE"}
                        </h3>
                        <p className="text-[#9da6b4] text-[11px] m-0">
                          {leagueSummaryLabel || "82-Game Season, Standings, Awards & Best-of-7 Playoffs"}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#ff963b] absolute bottom-4 right-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* 03 My Career */}
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseMenu();
                        (onOpenCareerHub || onOpenCreateAthlete)();
                      }}
                      className="group relative min-h-[125px] p-5 text-left text-white border border-[#66513b] hover:border-[#ff963b] rounded-[7px] bg-gradient-to-br from-[#1b222d] to-[#101319] hover:from-[#30271f] hover:to-[#171a20] hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between transition-all overflow-hidden"
                    >
                      <div className="flex items-center justify-between w-full">
                        <UserCheck className="w-6 h-6 text-[#ff963b]" />
                        <span className="text-[#667080] text-[11px] font-black">03</span>
                      </div>
                      <div className="pr-8">
                        <h3 className="mt-4 mb-1 text-[16px] font-black uppercase">
                          MY CAREER
                        </h3>
                        <p className="text-[#9da6b4] text-[11px] m-0">
                          {careerSummaryLabel || `${athleteProfile.firstName} ${athleteProfile.lastName} · ${ovr} OVR · Lv.${levelInfo.level}`}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#ff963b] absolute bottom-4 right-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* 04 Franchise Mode */}
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseMenu();
                        onOpenFranchise?.();
                      }}
                      className="group relative min-h-[125px] p-5 text-left text-white border border-emerald-500/35 hover:border-[#ff963b] rounded-[7px] bg-gradient-to-br from-[#12201b] to-[#101319] hover:from-[#1b3129] hover:to-[#171a20] hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between transition-all overflow-hidden"
                    >
                      <div className="flex items-center justify-between w-full">
                        <Briefcase className="w-6 h-6 text-emerald-400" />
                        <span className="text-[#667080] text-[11px] font-black">04</span>
                      </div>
                      <div className="pr-8">
                        <h3 className="mt-4 mb-1 text-[16px] font-black uppercase">
                          FRANCHISE GM
                        </h3>
                        <p className="text-[#9da6b4] text-[11px] m-0">
                          {franchiseSummaryLabel || "Trades, Salary Cap, Rookie Draft & Team Finances"}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#ff963b] absolute bottom-4 right-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* 05 World Tour 2.0 */}
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseMenu();
                        onOpenWorldTour();
                      }}
                      className="group relative min-h-[125px] p-5 text-left text-white border border-[#385e79] hover:border-[#ff963b] rounded-[7px] bg-gradient-to-br from-[#1b222d] to-[#101319] hover:from-[#30271f] hover:to-[#171a20] hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between transition-all overflow-hidden"
                    >
                      <div className="flex items-center justify-between w-full">
                        <Globe className="w-6 h-6 text-sky-400" />
                        <span className="text-[#667080] text-[11px] font-black">05</span>
                      </div>
                      <div className="pr-8">
                        <h3 className="mt-4 mb-1 text-[16px] font-black uppercase">
                          WORLD TOUR · 16 NATIONS
                        </h3>
                        <p className="text-[#9da6b4] text-[11px] m-0">
                          16 National Teams, {WORLD_CITIES.length} Cities &amp; Int&apos;l Cups · {selectedCity.flag} {selectedCity.name}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#ff963b] absolute bottom-4 right-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* 06 Online Multiplayer */}
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseMenu();
                        onOpenMultiplayer();
                      }}
                      className="group relative min-h-[125px] p-5 text-left text-white border border-[#176c83] hover:border-[#ff963b] rounded-[7px] bg-gradient-to-br from-[#1b222d] to-[#101319] hover:from-[#30271f] hover:to-[#171a20] hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between transition-all overflow-hidden"
                    >
                      <div className="flex items-center justify-between w-full">
                        <Users className="w-6 h-6 text-cyan-400" />
                        <span className="text-[#667080] text-[11px] font-black">
                          {multiplayerTransport !== "disconnected" && multiplayerRoomCode
                            ? `${multiplayerRoomCode} · ${multiplayerPeerCount}`
                            : "06"}
                        </span>
                      </div>
                      <div className="pr-8">
                        <h3 className="mt-4 mb-1 text-[16px] font-black uppercase">
                          MULTIPLAYER (ONLINE &amp; OFFLINE)
                        </h3>
                        <p className="text-[#9da6b4] text-[11px] m-0">
                          1v1, 2v2, 3v3 &amp; 5v5 Cross-Play · Works Online &amp; Offline
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#ff963b] absolute bottom-4 right-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* 07 Training Academy */}
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseMenu();
                        if (onOpenTrainingAcademy) onOpenTrainingAcademy();
                        else onSelectGameMode("training");
                      }}
                      className="group relative min-h-[125px] p-5 text-left text-white border border-[#343b46] hover:border-[#ff963b] rounded-[7px] bg-gradient-to-br from-[#1b222d] to-[#101319] hover:from-[#30271f] hover:to-[#171a20] hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between transition-all overflow-hidden"
                    >
                      <div className="flex items-center justify-between w-full">
                        <Target className="w-6 h-6 text-emerald-400" />
                        <span className="text-[#667080] text-[11px] font-black">07</span>
                      </div>
                      <div className="pr-8">
                        <h3 className="mt-4 mb-1 text-[16px] font-black uppercase">
                          TRAINING ACADEMY
                        </h3>
                        <p className="text-[#9da6b4] text-[11px] m-0">
                          8 Interactive Skill Drills · Shootouts, Dunks &amp; Handles
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#ff963b] absolute bottom-4 right-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* 08 Customization Studio */}
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseMenu();
                        onOpenCustomization?.();
                      }}
                      className="group relative min-h-[125px] p-5 text-left text-white border border-purple-500/35 hover:border-[#ff963b] rounded-[7px] bg-gradient-to-br from-[#1d1629] to-[#101319] hover:from-[#30223d] hover:to-[#171a20] hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between transition-all overflow-hidden"
                    >
                      <div className="flex items-center justify-between w-full">
                        <Palette className="w-6 h-6 text-purple-400" />
                        <span className="text-[#667080] text-[11px] font-black">08</span>
                      </div>
                      <div className="pr-8">
                        <h3 className="mt-4 mb-1 text-[16px] font-black uppercase">
                          CUSTOMIZATION STUDIO
                        </h3>
                        <p className="text-[#9da6b4] text-[11px] m-0">
                          Jerseys, Basketball Skins, Hardwood &amp; Arena Lighting
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#ff963b] absolute bottom-4 right-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* 09 Blacktop Streetball */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectGameMode("streetball");
                        handleCloseMenu();
                      }}
                      className="group relative min-h-[125px] p-5 text-left text-white border border-[#74502b] hover:border-[#ff963b] rounded-[7px] bg-gradient-to-br from-[#1b222d] to-[#101319] hover:from-[#30271f] hover:to-[#171a20] hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between transition-all overflow-hidden"
                    >
                      <div className="flex items-center justify-between w-full">
                        <Flame className="w-6 h-6 text-orange-400" />
                        <span className="text-[#667080] text-[11px] font-black">09</span>
                      </div>
                      <div className="pr-8">
                        <h3 className="mt-4 mb-1 text-[16px] font-black uppercase">
                          BLACKTOP STREETBALL
                        </h3>
                        <p className="text-[#9da6b4] text-[11px] m-0">
                          Outdoor asphalt showcase under night stadium lights
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#ff963b] absolute bottom-4 right-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* 10 All-Star Weekend */}
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseMenu();
                        onOpenAllStarWeekend?.();
                      }}
                      className="group relative min-h-[125px] p-5 text-left text-white border border-amber-400/45 hover:border-[#ff963b] rounded-[7px] bg-gradient-to-br from-[#2a1d12] to-[#101319] hover:from-[#3d2914] hover:to-[#171a20] hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between transition-all overflow-hidden"
                    >
                      <div className="flex items-center justify-between w-full">
                        <Sparkles className="w-6 h-6 text-amber-300" />
                        <span className="text-[#667080] text-[11px] font-black">10</span>
                      </div>
                      <div className="pr-8">
                        <h3 className="mt-4 mb-1 text-[16px] font-black uppercase">
                          ALL-STAR WEEKEND ({activeDivision === "womens" ? "WPBA" : "APBA"})
                        </h3>
                        <p className="text-[#9da6b4] text-[11px] m-0">
                          All-Star Game, 3-Point Contest, Dunk Contest &amp; MVP Trophies
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#ff963b] absolute bottom-4 right-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* 11 AdventureForge Universe Hub */}
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseMenu();
                        onOpenUniverse?.();
                      }}
                      className="group relative min-h-[125px] p-5 text-left text-white border border-emerald-400/45 hover:border-[#ff963b] rounded-[7px] bg-gradient-to-br from-[#122a22] to-[#101319] hover:from-[#1b3d31] hover:to-[#171a20] hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between transition-all overflow-hidden"
                    >
                      <div className="flex items-center justify-between w-full">
                        <Globe className="w-6 h-6 text-emerald-400" />
                        <span className="text-[#667080] text-[11px] font-black">11</span>
                      </div>
                      <div className="pr-8">
                        <h3 className="mt-4 mb-1 text-[16px] font-black uppercase">
                          ADVENTUREFORGE UNIVERSE HUB
                        </h3>
                        <p className="text-[#9da6b4] text-[11px] m-0">
                          {universeSummaryLabel || "Real Estate, Luxury Garages, Businesses & Living World"}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#ff963b] absolute bottom-4 right-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* 12 USA National Tour */}
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseMenu();
                        onOpenNationalTour?.();
                      }}
                      className="group relative min-h-[125px] p-5 text-left text-white border border-red-400/45 hover:border-[#ff963b] rounded-[7px] bg-gradient-to-br from-[#2b141a] to-[#101319] hover:from-[#3d1c23] hover:to-[#171a20] hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between transition-all overflow-hidden"
                    >
                      <div className="flex items-center justify-between w-full">
                        <Flag className="w-6 h-6 text-red-400" />
                        <span className="text-[#667080] text-[11px] font-black">12</span>
                      </div>
                      <div className="pr-8">
                        <h3 className="mt-4 mb-1 text-[16px] font-black uppercase">
                          USA NATIONAL TOUR
                        </h3>
                        <p className="text-[#9da6b4] text-[11px] m-0">
                          {nationalTourSummaryLabel || "13 US Host Cities · Regional Conferences, Challenges & Crown"}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#ff963b] absolute bottom-4 right-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* 13 Court & Player Business Hub */}
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseMenu();
                        onOpenBusinessHub?.();
                      }}
                      className="group relative min-h-[125px] p-5 text-left text-white border border-amber-500/45 hover:border-[#ff963b] rounded-[7px] bg-gradient-to-br from-[#2a1d12] to-[#101319] hover:from-[#3d2a17] hover:to-[#171a20] hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between transition-all overflow-hidden"
                    >
                      <div className="flex items-center justify-between w-full">
                        <Building2 className="w-6 h-6 text-amber-400" />
                        <span className="text-[#667080] text-[11px] font-black">13</span>
                      </div>
                      <div className="pr-8">
                        <h3 className="mt-4 mb-1 text-[16px] font-black uppercase">
                          COURT &amp; PLAYER BUSINESS HUB
                        </h3>
                        <p className="text-[#9da6b4] text-[11px] m-0">
                          Arena Upgrades, Ticket Pricing, Real Estate &amp; Financial Empire
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#ff963b] absolute bottom-4 right-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  {/* Additional Modes, Career Studio & Live Match Controls */}
                  <div className="pt-2 space-y-3">
                    <div className="text-[10px] font-black tracking-[2px] uppercase text-[#8e98a8]">
                      STUDIO, TRAINING &amp; BROADCAST TOOLS
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          handleCloseMenu();
                          onOpenDraft();
                        }}
                        className="min-h-[44px] px-4 py-2 rounded-[7px] bg-[#101319] hover:bg-[#1b222d] border border-[#343b46] hover:border-[#ff963b] text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Award className="w-4 h-4 text-emerald-400" />
                        <span>
                          Draft Night
                          {athleteProfile.draftRecord?.drafted
                            ? ` (#${athleteProfile.draftRecord.pickNumber})`
                            : ""}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleCloseMenu();
                          onOpenLockerRoom();
                        }}
                        className="min-h-[44px] px-4 py-2 rounded-[7px] bg-[#101319] hover:bg-[#1b222d] border border-[#343b46] hover:border-[#ff963b] text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Shirt className="w-4 h-4 text-red-400" />
                        <span>
                          Locker Room ({careerStats.matchesWon}W-
                          {careerStats.matchesPlayed - careerStats.matchesWon}L)
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectGameMode("training");
                          handleCloseMenu();
                        }}
                        className={`min-h-[44px] px-4 py-2 rounded-[7px] border text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors ${
                          activeMode === "training"
                            ? "bg-[#30271f] border-[#ff963b] text-[#ffab53]"
                            : "bg-[#101319] hover:bg-[#1b222d] border-[#343b46] hover:border-[#ff963b] text-white"
                        }`}
                      >
                        <Target className="w-4 h-4 text-cyan-400" />
                        <span>Training Drills</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectGameMode("freestyle");
                          handleCloseMenu();
                        }}
                        className={`min-h-[44px] px-4 py-2 rounded-[7px] border text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors ${
                          activeMode === "freestyle"
                            ? "bg-[#30271f] border-[#ff963b] text-[#ffab53]"
                            : "bg-[#101319] hover:bg-[#1b222d] border-[#343b46] hover:border-[#ff963b] text-white"
                        }`}
                      >
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span>Freestyle</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleCloseMenu();
                          onOpenScreenMirroring();
                        }}
                        className={`min-h-[44px] px-4 py-2 rounded-[7px] border text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors ${
                          isMirroring
                            ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                            : "bg-[#101319] hover:bg-[#1b222d] border-[#343b46] hover:border-cyan-400 text-cyan-300"
                        }`}
                      >
                        <Cast className="w-4 h-4" />
                        <span>{isMirroring ? "Screen Mirroring (LIVE)" : "Screen Mirroring"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleCloseMenu();
                          onOpenMovebook();
                        }}
                        className="min-h-[44px] px-4 py-2 rounded-[7px] bg-[#101319] hover:bg-[#1b222d] border border-[#343b46] hover:border-[#ff963b] text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <BookOpen className="w-4 h-4 text-sky-400" />
                        <span>Movebook ({ALL_OFFENSE_MOVES.length + ALL_DEFENSE_MOVES.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleCloseMenu();
                          onOpenHighlights();
                        }}
                        disabled={highlightsCount === 0}
                        className="min-h-[44px] px-4 py-2 rounded-[7px] bg-[#101319] hover:bg-[#1b222d] disabled:opacity-40 border border-[#343b46] text-xs font-bold uppercase tracking-wider text-amber-200 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Film className="w-4 h-4 text-[#ff963b]" />
                        <span>Highlights ({highlightsCount}/3)</span>
                      </button>

                      {(activeMode === "match" || activeMode === "streetball") && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              handleCloseMenu();
                              onCallTimeout();
                            }}
                            disabled={timeoutsLeft <= 0}
                            className="min-h-[44px] px-4 py-2 rounded-[7px] bg-[#101319] hover:bg-[#1b222d] disabled:opacity-40 border border-[#343b46] text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Timer className="w-4 h-4 text-[#ff963b]" />
                            <span>Timeout ({timeoutsLeft})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              handleCloseMenu();
                              onEndQuarterNow();
                            }}
                            className="min-h-[44px] px-4 py-2 rounded-[7px] bg-[#101319] hover:bg-[#1b222d] border border-[#343b46] text-xs font-bold uppercase tracking-wider text-white/90 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Play className="w-4 h-4 text-emerald-400" />
                            <span>End Quarter</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              handleCloseMenu();
                              onEndGame();
                            }}
                            className="min-h-[44px] px-4 py-2 rounded-[7px] bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Flag className="w-4 h-4" />
                            <span>End Game</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          handleCloseMenu();
                          onOpenControls();
                        }}
                        className="min-h-[44px] px-4 py-2 rounded-[7px] bg-[#101319] hover:bg-[#1b222d] border border-[#343b46] text-xs font-bold uppercase tracking-wider text-white/85 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Info className="w-4 h-4 text-[#aab0bb]" />
                        <span>Controls</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleCloseMenu();
                          onOpenFeatures();
                        }}
                        className="min-h-[44px] px-4 py-2 rounded-[7px] bg-[#101319] hover:bg-[#1b222d] border border-[#343b46] text-xs font-bold uppercase tracking-wider text-[#ffab53] flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Users className="w-4 h-4" />
                        <span>Features Directory</span>
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              /* SETTINGS TAB: Audio Mixer, Input Device Mode, Quarter Clock & Controls */
              <section className="flex-1 px-[5%] py-7 sm:py-9 space-y-6 max-w-5xl w-full mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#252a32] pb-4">
                  <div className="flex items-center gap-3">
                    <SlidersHorizontal className="w-6 h-6 text-[#ff963b]" />
                    <div>
                      <small className="block text-[#ff963b] font-black tracking-[2px] text-[10px] uppercase">
                        SYSTEM PREFERENCES
                      </small>
                      <h2 className="text-2xl font-black uppercase m-0">
                        GAME SETTINGS &amp; AUDIO
                      </h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("home")}
                    className="min-h-[42px] px-4 rounded bg-[#1b222d] hover:bg-[#252d3b] border border-[#343b46] text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Home</span>
                  </button>
                </div>

                {/* Input Device & Quarter Clock */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-[7px] bg-[#101319] border border-[#343b46] space-y-3">
                    <div className="text-xs font-black uppercase tracking-wider text-white/80 flex items-center justify-between">
                      <span>Input Device Mode</span>
                      <span className="text-[11px] font-normal text-white/50">
                        Detected: {detectedDevice}
                      </span>
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
                            type="button"
                            onClick={() => onChangeInputPreference(opt.id)}
                            className={`min-h-[42px] px-3.5 py-2 rounded text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${
                              active
                                ? "bg-[#ff963b] text-[#101014] border-[#ffc078]"
                                : "bg-[#090b10] text-white/80 border-[#343b46] hover:bg-[#1b222d]"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-5 rounded-[7px] bg-[#101319] border border-[#343b46] space-y-3">
                    <div className="text-xs font-black uppercase tracking-wider text-white/80">
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
                          type="button"
                          onClick={() => onChangeQuarterLength(opt.sec)}
                          className={`min-h-[42px] px-4 py-2 rounded text-xs font-bold border cursor-pointer ${
                            quarterLengthSec === opt.sec
                              ? "bg-[#ff963b] text-[#101014] border-[#ffc078]"
                              : "bg-[#090b10] text-white/80 border-[#343b46] hover:bg-[#1b222d]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Night Games Everywhere Preference */}
                {onChangeNightGameMode && (
                  <div className="p-5 rounded-[7px] bg-[#101319] border border-[#343b46] flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-white/85">
                        Night Games Everywhere (All Arenas)
                      </div>
                      <p className="text-xs text-white/55 m-0 mt-1">
                        Play daytime broadcast, city local time, or under full stadium floodlights &amp; starry night skies in every arena.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { id: "auto", label: "Auto (City Clock)", icon: Clock },
                          { id: "night", label: "Night Game ON", icon: Moon },
                          { id: "day", label: "Daytime ON", icon: Sun },
                        ] as const
                      ).map((opt) => {
                        const Icon = opt.icon;
                        const active = nightGameMode === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => onChangeNightGameMode(opt.id)}
                            className={`min-h-[40px] px-3.5 py-2 rounded text-xs font-black uppercase border flex items-center gap-1.5 cursor-pointer ${
                              active
                                ? "bg-cyan-400 text-black border-cyan-200"
                                : "bg-[#090b10] text-white/80 border-[#343b46] hover:bg-[#1b222d]"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Arena Audio Mixer (Music, Sound Effects, Crowd Ambience) */}
                <div className="p-5 rounded-[7px] bg-[#101319] border border-[#343b46] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-black uppercase tracking-wider text-white/85 flex items-center gap-2">
                      {audioSettings.muted ? (
                        <VolumeX className="w-4 h-4 text-red-400" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-[#ff963b]" />
                      )}
                      <span>Arena Audio Mixer</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onChangeAudioSettings({ musicEnabled: !audioSettings.musicEnabled })
                        }
                        className={`min-h-[38px] px-3.5 py-1.5 rounded text-xs font-black uppercase tracking-wider border cursor-pointer transition-colors flex items-center gap-1.5 ${
                          audioSettings.musicEnabled
                            ? "bg-[#ff963b]/20 border-[#ff963b] text-[#ffab53]"
                            : "bg-[#090b10] border-[#343b46] text-white/60 hover:bg-[#1b222d]"
                        }`}
                      >
                        <Music className="w-3.5 h-3.5" />
                        <span>Music: {audioSettings.musicEnabled ? "ON" : "OFF"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onChangeAudioSettings({ muted: !audioSettings.muted })}
                        className={`min-h-[38px] px-3.5 py-1.5 rounded text-xs font-black uppercase tracking-wider border cursor-pointer transition-colors ${
                          audioSettings.muted
                            ? "bg-red-600/80 border-red-400 text-white"
                            : "bg-[#090b10] border-[#343b46] text-white/80 hover:bg-[#1b222d]"
                        }`}
                      >
                        {audioSettings.muted ? "Unmute Audio" : "Mute All"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {([
                      { key: "sfx", label: "Sound Effects", value: audioSettings.sfx, disabled: false },
                      {
                        key: "crowd",
                        label: "Crowd Ambience",
                        value: audioSettings.crowd,
                        disabled: false,
                      },
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
                          <span className="tabular-nums text-[#ff963b] shrink-0">
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
                          className="w-full accent-[#ff963b] cursor-pointer h-2 bg-white/15 rounded-lg"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Save System Backup & Recovery (Phase 12) */}
                <div className="p-5 rounded-[7px] bg-[#101319] border border-[#343b46] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-black uppercase tracking-wider text-white/85 flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-emerald-400" />
                      <span>Save Data &amp; Checksummed Backups</span>
                    </div>
                    <span className="text-[11px] text-white/50 tabular-nums">
                      {getStorageInventory().filter((s) => s.hasSave).length} Active Slots
                    </span>
                  </div>
                  <p className="text-xs text-white/60">
                    All League seasons, My Career progress, Franchise rosters, Training records, and Customization presets are stored with FNV-1a checksum validation and automatic backup recovery.
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleExportSaves}
                      className="min-h-[42px] px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Full Save (.JSON)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="min-h-[42px] px-4 py-2 rounded bg-[#090b10] hover:bg-[#1b222d] border border-[#343b46] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Import Save File</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/json,.json"
                      onChange={handleImportFile}
                      className="sr-only"
                    />
                  </div>
                  {saveNotice && (
                    <div className="text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded px-3 py-2">
                      {saveNotice}
                    </div>
                  )}
                </div>

                {/* Quick Links from Settings */}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseMenu();
                      onOpenScreenMirroring();
                    }}
                    className="min-h-[44px] px-4 py-2 rounded bg-[#101319] hover:bg-[#1b222d] border border-[#176c83] text-cyan-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                  >
                    <Cast className="w-4 h-4" />
                    <span>Screen Mirroring &amp; TV Cast</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseMenu();
                      onOpenControls();
                    }}
                    className="min-h-[44px] px-4 py-2 rounded bg-[#101319] hover:bg-[#1b222d] border border-[#343b46] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                  >
                    <Info className="w-4 h-4" />
                    <span>Controls Guide</span>
                  </button>
                </div>
              </section>
            )}

            {/* Footer */}
            <footer className="flex flex-wrap items-center justify-between gap-3 px-[5%] py-5 border-t border-[#292e38] text-[#737d8c] text-[9px] font-extrabold tracking-wider uppercase">
              <span>COURTLEGENDS © 2026</span>
              <span>BUILT FOR THE LOVE OF BASKETBALL</span>
              <span>ONLINE • OFFLINE</span>
            </footer>
          </motion.main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
