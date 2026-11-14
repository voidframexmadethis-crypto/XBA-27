"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Keyboard, Gamepad2, Info, Trophy, Sparkles, Shirt, Flag, Globe, Timer, MapPin, Menu, Tv, Play, Flame, Shield, X, ChevronRight, ChevronUp, ChevronDown, Target, BookOpen, Cast, Layers, Moon, Sun } from "lucide-react";
import LockerRoomModal from "./LockerRoomModal";
import TimeoutModal, { TacticalSettings } from "./TimeoutModal";
import WorldTourMenu from "./WorldTourMenu";
import NationalTourModal from "./NationalTourModal";
import NBAFeaturesModal from "./NBAFeaturesModal";
import Scoreboard from "./Scoreboard";
import ShotClockDisplay from "./ShotClockDisplay";
import TipOffModal from "./TipOffModal";
import EndGameLeaderboardModal from "./EndGameLeaderboardModal";
import MainMenuModal, { GameMode } from "./MainMenuModal";
import CreateAthleteModal from "./CreateAthleteModal";
import DraftCutsceneModal from "./DraftCutsceneModal";
import MovebookModal from "./MovebookModal";
import QuickMovesDock from "./QuickMovesDock";
import MultiplayerModal from "./MultiplayerModal";
import HighlightsOverlay from "./HighlightsOverlay";
import ScreenMirrorModal from "./ScreenMirrorModal";
import LeagueCentralModal from "./LeagueCentralModal";
import CareerHubModal from "./CareerHubModal";
import FranchiseModal from "./FranchiseModal";
import CustomizationStudioModal from "./CustomizationStudioModal";
import TrainingAcademyModal from "./TrainingAcademyModal";
import AdventureForgeUniverseModal from "./AdventureForgeUniverseModal";
import {
  AdventureForgeUniverseState,
  loadUniverseState,
  saveUniverseState,
} from "@/lib/adventureForgeUniverse";
import BroadcastOverlays, { BroadcastSceneData } from "./BroadcastOverlays";
import {
  SHOT_CLOCK_FULL,
  resetShotClock,
  tickShotClock,
  formatShotClock,
} from "@/lib/shotClock";
import {
  WORLD_CITIES,
  WorldCity,
  getCityAtmosphere,
  getCityById,
  resolveArenaAtmosphere,
  WorldTourTournamentState,
  createTournamentBracket,
  loadWorldTourTournamentState,
  saveWorldTourTournamentState,
  resolveTournamentMatch,
} from "@/lib/worldTour";
import {
  NATIONAL_TOUR_STOPS,
  NationalTourState,
  NationalTourStop,
  loadNationalTourState,
  saveNationalTourState,
  resolveNationalTourStopMatch,
} from "@/lib/nationalTour";
import {
  loadCareerStats,
  saveCareerStats,
  getDefaultCareerStats,
  recordMatchToCareer,
  addDebugCareerStats,
  unlockProgressionItem,
  CareerStats,
  calculateLevel,
  JERSEY_ITEMS,
  SNEAKER_ITEMS,
  HEADBAND_ITEMS,
  ProgressionItem,
} from "@/lib/progression";
import {
  AthleteProfile,
  getDefaultAthleteProfile,
  loadAthleteProfile,
  saveAthleteProfile,
} from "@/lib/athleteProfile";
import {
  OffenseMove,
  DefenseMove,
  OFFENSE_CATEGORIES,
  DEFENSE_CATEGORIES,
  formatMoveTitle,
  getMoveMetadata,
} from "@/lib/basketballMoves";
import {
  HighlightClip,
  HighlightFrame,
  formatClockLabel,
  interpolateHighlightFrame,
} from "@/lib/highlights";
import {
  CrossPlayMultiplayerClient,
  ConnectionTransport,
  detectDeviceType,
} from "@/lib/multiplayerClient";
import {
  formatToMaxPlayers,
  type DeviceType,
  type InputPreference,
  type MatchSyncState,
  type MultiplayerFormat,
  type MultiplayerRoomState,
  type PoseSnapshot,
  type RemotePlayerState,
  type TeamSide,
} from "@/lib/multiplayerTypes";
import {
  BasketballAudioManager,
  AudioVolumeSettings,
  DEFAULT_AUDIO_SETTINGS,
  loadAudioSettings,
} from "@/lib/audioManager";
import {
  MirrorBroadcaster,
  NativeMirrorCapabilities,
  createMirrorSessionCode,
  detectNativeMirrorCapabilities,
} from "@/lib/mirrorClient";
import type { MirrorMatchMeta } from "@/lib/mirrorTypes";
import {
  LeagueState,
  createInitialLeagueState,
  loadLeagueState,
  saveLeagueState,
  recordUserPlayedMatch,
} from "@/lib/leagueEngine";
import { APBA_TEAMS, CHAMPIONSHIP_TROPHY_NAME, ProLeagueDivision } from "@/lib/leagueData";
import {
  MyCareerState,
  createInitialCareerState,
  loadCareerState,
  saveCareerState,
  applyCareerGameReward,
} from "@/lib/careerEngine";
import {
  FranchiseState,
  createInitialFranchiseState,
  loadFranchiseState,
  saveFranchiseState,
} from "@/lib/franchiseEngine";
import {
  StudioCustomization,
  NightGameMode,
  getDefaultCustomization,
  loadStudioCustomization,
  saveStudioCustomization,
  BALL_DESIGNS,
  WOOD_TONE_PRESETS,
  LIGHTING_MOOD_PRESETS,
} from "@/lib/customization";
import {
  TrainingAcademyState,
  TrainingDrillDefinition,
  createInitialTrainingState,
  loadTrainingState,
  saveTrainingState,
  recordTrainingDrillResult,
} from "@/lib/trainingDrills";
import {
  chooseAdaptiveAiDefenseScheme,
  computeDefenseAiDecision,
  computeDynamicOffBallTarget,
} from "@/lib/defenseAi";
import {
  buildStrandHairGroup,
  attachFacialExpressionRig,
  updateFacialExpression,
  createSubsurfaceSkinMaterial,
  updateSkinExertion,
  createJerseyClothMaterial,
  createJerseyFabricBumpTexture,
  createContactShadowTexture,
  createDeformableNet,
  triggerNetSwish,
  stepDeformableNet,
  createBroadcastComposer,
  getLikenessPreset,
  type FacialRig,
  type DeformableNet,
  type BroadcastComposerPipeline,
  type PlayerLikenessPreset,
} from "@/lib/nba2kGraphics";
import {
  SHOT_FEEDBACK_DURATION_SEC,
  evaluateShotTimingFromGameClock,
  tickShotFeedbackTimer,
} from "@/lib/shotTiming";

// Game Constants
const COURT_W = 28, COURT_H = 15;
const HOOP_X = 12.8, RIM_Y = 3.05, RIM_R = 0.23, BOARD_X = 13.2;
const BALL_R = 0.12, G = 9.8;

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const rnd = (s: number) => (Math.random() * 2 - 1) * s;
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export default function BasketballGame() {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any>(null);
  const lastClockRef = useRef<number>(24);

  // React state for HUD
  const [scoreHome, setScoreHome] = useState(0);
  const [scoreAway, setScoreAway] = useState(0);
  const [shotClock, setShotClock] = useState(24.0);
  const [shotClockResetPulse, setShotClockResetPulse] = useState(0);
  const [lastShotResetReason, setLastShotResetReason] = useState<string>("init");
  const [gameClock, setGameClock] = useState(120); // Default 2 min quarters (configurable in Main Menu)
  const [quarterLengthSec, setQuarterLengthSec] = useState(120);
  const quarterLengthRef = useRef(120);
  const [quarter, setQuarter] = useState(1);
  const [message, setMessage] = useState({ text: "", color: "#fff", visible: false });
  const [label, setLabel] = useState({ text: "", visible: false });
  const [shotFeedback, setShotFeedback] = useState({
    text: "",
    color: "#22c55e",
    accuracyPct: 100,
    deltaSec: 0,
    normalizedMeter: 0.5,
    x: 50,
    y: 26,
    visible: false,
    isGreen: false,
  });
  const activeTagRef = useRef<HTMLDivElement>(null);
  const staminaBarRef = useRef<HTMLDivElement>(null);
  const [showMeter, setShowMeter] = useState(false);
  const [meterFill, setMeterFill] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(true);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [showCreateAthlete, setShowCreateAthlete] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showMovebook, setShowMovebook] = useState(false);
  const [showQuickMoves, setShowQuickMoves] = useState(false);
  const [movebookDefaultSide, setMovebookDefaultSide] = useState<"offense" | "defense">("offense");
  const [showMultiplayer, setShowMultiplayer] = useState(false);

  // Game Highlights states & refs
  const [showHighlights, setShowHighlights] = useState(false);
  const [highlightClips, setHighlightClips] = useState<HighlightClip[]>([]);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(0);
  const [highlightQuarterCompleted, setHighlightQuarterCompleted] = useState(1);
  const [highlightIsEndOfMatch, setHighlightIsEndOfMatch] = useState(false);
  const [highlightsCount, setHighlightsCount] = useState(0);
  const quarterHighlightsRef = useRef<HighlightClip[]>([]);
  const allHighlightsRef = useRef<HighlightClip[]>([]);
  const isHighlightReplayRef = useRef(false);
  const replayClipsRef = useRef<HighlightClip[]>([]);
  const replayClipIndexRef = useRef(0);
  const replayProgressRef = useRef(0);
  const pendingPostHighlightActionRef = useRef<"next_quarter" | "end_match" | "close_only">("close_only");

  // Cross-Play Device & Multiplayer states & refs
  const [detectedDevice, setDetectedDevice] = useState<DeviceType>("desktop");
  const [mpPlayerId, setMpPlayerId] = useState<string>("local");
  const [inputPreference, setInputPreference] = useState<InputPreference>("auto");
  const inputPreferenceRef = useRef<InputPreference>("auto");
  const [mpTransport, setMpTransport] = useState<ConnectionTransport>("disconnected");
  const [mpRoom, setMpRoom] = useState<MultiplayerRoomState | null>(null);
  const mpRoomRef = useRef<MultiplayerRoomState | null>(null);
  const mpClientRef = useRef<CrossPlayMultiplayerClient | null>(null);

  const [activeOffensePlay, setActiveOffensePlay] = useState<OffenseMove | null>(OffenseMove.PICK_AND_ROLL);
  const activeOffensePlayRef = useRef<OffenseMove | null>(OffenseMove.PICK_AND_ROLL);
  const [activeDefenseScheme, setActiveDefenseScheme] = useState<DefenseMove | null>(DefenseMove.MAN_TO_MAN);
  const activeDefenseSchemeRef = useRef<DefenseMove | null>(DefenseMove.MAN_TO_MAN);
  const [gameMode, setGameMode] = useState<GameMode>("match");
  const gameModeRef = useRef<GameMode>("match");
  const [athleteProfile, setAthleteProfile] = useState<AthleteProfile>(getDefaultAthleteProfile);
  const athleteProfileRef = useRef<AthleteProfile>(athleteProfile);
  const [trainingDrill, setTrainingDrill] = useState({ made: 0, target: 5, completedCount: 0 });
  const [isBallLoose, setIsBallLoose] = useState(false);
  const isBallLooseRef = useRef(false);
  const [finalStats, setFinalStats] = useState<any[]>([]);
  const [isMobileUI, setIsMobileUI] = useState(false);
  const [hasTouchInput, setHasTouchInput] = useState(false);
  const [showOnScreenPad, setShowOnScreenPad] = useState(true);
  const [showExpandedMoves, setShowExpandedMoves] = useState(true);
  const [showDesktopStick, setShowDesktopStick] = useState(false);
  const [padSideOverride, setPadSideOverride] = useState<"auto" | "offense" | "defense">("auto");
  const [isUserOffenseUI, setIsUserOffenseUI] = useState(true);
  const isUserOffenseRef = useRef(true);
  const [isUiDefending, setIsUiDefending] = useState(false);
  const isUiDefendingRef = useRef(false);
  const [showTipOff, setShowTipOff] = useState(false);
  const isOverlayOpenRef = useRef(true);
  const audioManagerRef = useRef<BasketballAudioManager | null>(null);
  const [audioSettings, setAudioSettings] = useState<AudioVolumeSettings>(() => ({
    ...DEFAULT_AUDIO_SETTINGS,
  }));

  // Player Career Progression & Customization States
  const [careerStats, setCareerStats] = useState<CareerStats>(getDefaultCareerStats);
  const careerStatsRef = useRef<CareerStats>(careerStats);
  useEffect(() => {
    careerStatsRef.current = careerStats;
  }, [careerStats]);
  const [showLockerRoom, setShowLockerRoom] = useState(false);
  const [lastMatchEarnings, setLastMatchEarnings] = useState<{
    pts: number;
    reb: number;
    ast: number;
    xpGained: number;
    leveledUp: boolean;
    unlocked: ProgressionItem[];
  } | null>(null);

  // World Tour, National Tour & Tactical Timeout States
  const [selectedCity, setSelectedCity] = useState<WorldCity>(WORLD_CITIES[0]);
  const [showWorldTour, setShowWorldTour] = useState(false);
  const [showNationalTour, setShowNationalTour] = useState(false);
  const [activeDivision, setActiveDivision] = useState<ProLeagueDivision>("mens");
  const [showTimeout, setShowTimeout] = useState(false);
  const [timeoutsLeft, setTimeoutsLeft] = useState(3);
  const [tactics, setTactics] = useState<TacticalSettings>({
    defense: "lockdown",
    offense: "pick_roll",
  });
  const tacticsRef = useRef<TacticalSettings>(tactics);
  const [subVersion, setSubVersion] = useState(0);
  const [teamARoster, setTeamARoster] = useState<any[]>([]);
  const initialCityRef = useRef(selectedCity);

  // Championship Edition Modals & Persistent Suite States (Phases 1-12)
  const [showLeagueCentral, setShowLeagueCentral] = useState(false);
  const [showCareerHub, setShowCareerHub] = useState(false);
  const [showFranchise, setShowFranchise] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showTrainingAcademy, setShowTrainingAcademy] = useState(false);
  const [showUniverseHub, setShowUniverseHub] = useState(false);
  const [universeState, setUniverseState] = useState<AdventureForgeUniverseState>(loadUniverseState);

  const [leagueState, setLeagueState] = useState<LeagueState>(() => createInitialLeagueState(2027, "apba_nyc_monarchs"));
  const leagueStateRef = useRef<LeagueState>(leagueState);
  const [myCareer, setMyCareer] = useState<MyCareerState>(() => createInitialCareerState("apba_nyc_monarchs"));
  const myCareerRef = useRef<MyCareerState>(myCareer);
  const [franchiseState, setFranchiseState] = useState<FranchiseState>(() => createInitialFranchiseState("apba_nyc_monarchs"));
  const franchiseStateRef = useRef<FranchiseState>(franchiseState);
  const [studioCustom, setStudioCustom] = useState<StudioCustomization>(() => getDefaultCustomization());
  const studioCustomRef = useRef<StudioCustomization>(studioCustom);
  const [trainingAcademy, setTrainingAcademy] = useState<TrainingAcademyState>(() => createInitialTrainingState());
  const trainingAcademyRef = useRef<TrainingAcademyState>(trainingAcademy);
  const [worldTournament, setWorldTournament] = useState<WorldTourTournamentState>(() =>
    createTournamentBracket("cup_global_nations", WORLD_CITIES[0].id)
  );
  const worldTournamentRef = useRef<WorldTourTournamentState>(worldTournament);
  const [nationalTour, setNationalTour] = useState<NationalTourState>(() => loadNationalTourState("mens"));
  const nationalTourRef = useRef<NationalTourState>(nationalTour);
  const matchExtraStatsRef = useRef({ steals: 0, threes: 0, dunks: 0, blocks: 0 });

  type MatchContext =
    | { kind: "exhibition" }
    | { kind: "league"; homeTeamId: string; awayTeamId: string; isPlayoff?: boolean }
    | { kind: "career"; teamId: string }
    | { kind: "franchise"; teamId: string }
    | { kind: "world_cup"; matchId: string; homeCityId: string; awayCityId: string }
    | { kind: "national_tour"; stopId: string; cityId: string };
  const activeMatchContextRef = useRef<MatchContext>({ kind: "exhibition" });

  const [activeAcademyDrill, setActiveAcademyDrill] = useState<{
    drill: TrainingDrillDefinition;
    repsMade: number;
    attempts: number;
    timeLeft: number;
  } | null>(null);
  const activeAcademyDrillRef = useRef<typeof activeAcademyDrill>(null);
  const [broadcastScene, setBroadcastScene] = useState<BroadcastSceneData | null>(null);
  const pendingPostBroadcastActionRef = useRef<"resume_q3" | "show_summary" | "none">("none");

  // Screen Mirroring & TV Cast States
  const [showScreenMirror, setShowScreenMirror] = useState(false);
  const [isMirroring, setIsMirroring] = useState(false);
  const [mirrorCode, setMirrorCode] = useState("");
  const [mirrorViewerCount, setMirrorViewerCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mirrorCaps, setMirrorCaps] = useState<NativeMirrorCapabilities>({
    airplay: false,
    remotePlayback: false,
    pictureInPicture: false,
    fullscreen: false,
  });
  const mirrorVideoRef = useRef<HTMLVideoElement | null>(null);
  const mirrorBroadcasterRef = useRef<MirrorBroadcaster | null>(null);
  const mirrorFrameHookRef = useRef<((canvas: HTMLCanvasElement) => void) | null>(null);
  const mirrorMetaRef = useRef<MirrorMatchMeta>({
    hostName: `${athleteProfile.firstName} ${athleteProfile.lastName}`,
    cityName: selectedCity.name,
    cityFlag: selectedCity.flag,
    mode: gameMode,
    scoreHome: 0,
    scoreAway: 0,
    quarter: 1,
    gameClock: 120,
    shotClock: 24,
    homeTeamName: "HOME",
    awayTeamName: selectedCity.name.toUpperCase(),
  });

  useEffect(() => {
    const nextMeta: MirrorMatchMeta = {
      hostName: `${athleteProfile.firstName} ${athleteProfile.lastName}`,
      cityName: selectedCity.name,
      cityFlag: selectedCity.flag,
      mode: gameMode,
      scoreHome,
      scoreAway,
      quarter,
      gameClock,
      shotClock,
      homeTeamName: "HOME",
      awayTeamName: selectedCity.name.toUpperCase(),
    };
    mirrorMetaRef.current = nextMeta;
    mirrorBroadcasterRef.current?.updateMeta(nextMeta);
  }, [
    athleteProfile.firstName,
    athleteProfile.lastName,
    selectedCity.name,
    selectedCity.flag,
    gameMode,
    scoreHome,
    scoreAway,
    quarter,
    gameClock,
    shotClock,
  ]);

  useEffect(() => {
    setMirrorCaps(detectNativeMirrorCapabilities(mirrorVideoRef.current));
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      mirrorFrameHookRef.current = null;
      mirrorBroadcasterRef.current?.stop();
      mirrorBroadcasterRef.current = null;
    };
  }, []);

  const ensureMirrorVideoStream = useCallback(() => {
    const canvas = gameRef.current?.renderer?.domElement as HTMLCanvasElement | undefined;
    const video = mirrorVideoRef.current;
    if (!canvas || !video) return null;
    if (!video.srcObject && typeof canvas.captureStream === "function") {
      try {
        const stream = canvas.captureStream(30);
        video.srcObject = stream;
        video.muted = true;
        video.play().catch(() => {});
      } catch {
        return null;
      }
    }
    return video;
  }, []);

  const handleStartMirroring = useCallback(async () => {
    const canvas = (gameRef.current?.renderer?.domElement as HTMLCanvasElement | undefined) || null;
    ensureMirrorVideoStream();
    if (!mirrorBroadcasterRef.current) {
      mirrorBroadcasterRef.current = new MirrorBroadcaster(mirrorMetaRef.current, (info) => {
        setIsMirroring(info.active);
        setMirrorCode(info.code);
        setMirrorViewerCount(info.viewerCount);
      });
    }
    const nextCode = createMirrorSessionCode();
    await mirrorBroadcasterRef.current.start(nextCode, canvas, mirrorMetaRef.current);
    mirrorFrameHookRef.current = (renderedCanvas: HTMLCanvasElement) => {
      mirrorBroadcasterRef.current?.captureRenderedFrame(renderedCanvas, mirrorMetaRef.current);
    };
  }, [ensureMirrorVideoStream]);

  const handleStopMirroring = useCallback(async () => {
    mirrorFrameHookRef.current = null;
    if (mirrorBroadcasterRef.current) {
      await mirrorBroadcasterRef.current.stop();
    }
    setIsMirroring(false);
    setMirrorViewerCount(0);
  }, []);

  const handleTriggerAirPlayOrCast = useCallback(async (): Promise<{ ok: boolean; message: string }> => {
    const video = ensureMirrorVideoStream() as (HTMLVideoElement & {
      webkitShowPlaybackTargetPicker?: () => void;
      remote?: { prompt: () => Promise<void> };
    }) | null;

    if (video && typeof video.webkitShowPlaybackTargetPicker === "function") {
      try {
        video.webkitShowPlaybackTargetPicker();
        return {
          ok: true,
          message: "AirPlay device picker opened. If no Apple TV appears, swipe down Control Center and tap Screen Mirroring.",
        };
      } catch {
        // Fallback guidance below
      }
    }
    if (video?.remote && typeof video.remote.prompt === "function") {
      try {
        await video.remote.prompt();
        return { ok: true, message: "Wireless Cast device picker opened." };
      } catch {
        // User dismissed or browser blocked remote playback in iframe
      }
    }
    return {
      ok: false,
      message:
        "Use Start Screen Mirroring above with the QR code / Mirror Link to cast wirelessly to any TV, or use your device's Control Center / browser Cast menu.",
    };
  }, [ensureMirrorVideoStream]);

  const handleTogglePiP = useCallback(async (): Promise<{ ok: boolean; message: string }> => {
    const video = ensureMirrorVideoStream() as (HTMLVideoElement & {
      webkitSupportsPresentationMode?: (mode: string) => boolean;
      webkitSetPresentationMode?: (mode: string) => void;
      webkitPresentationMode?: string;
    }) | null;
    if (!video) {
      return { ok: false, message: "Video capture stream is unavailable on this browser." };
    }
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        return { ok: true, message: "Exited floating mini-screen." };
      }
      if (typeof video.requestPictureInPicture === "function") {
        await video.play().catch(() => {});
        await video.requestPictureInPicture();
        return { ok: true, message: "Floating Picture-in-Picture mini-screen active." };
      }
      if (
        typeof video.webkitSupportsPresentationMode === "function" &&
        video.webkitSupportsPresentationMode("picture-in-picture") &&
        typeof video.webkitSetPresentationMode === "function"
      ) {
        const nextMode =
          video.webkitPresentationMode === "picture-in-picture" ? "inline" : "picture-in-picture";
        video.webkitSetPresentationMode(nextMode);
        return { ok: true, message: "Toggled Picture-in-Picture mini-screen." };
      }
    } catch {
      // Fallback below
    }
    return {
      ok: false,
      message: "Picture-in-Picture requires starting playback on the court first or is blocked by this iframe.",
    };
  }, [ensureMirrorVideoStream]);

  const handleToggleFullscreen = useCallback(async () => {
    if (typeof document === "undefined") return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Ignore fullscreen permission errors inside sandboxed iframes
    }
  }, []);

  const handleExecuteMove = useCallback((move: OffenseMove | DefenseMove) => {
    if (gameRef.current?.executeMove) {
      gameRef.current.executeMove(move);
    }
  }, []);

  const handleOpenMovebookSmart = useCallback(() => {
    const g = gameRef.current;
    const isDef = Boolean(g?.state && g?.ME && g.state.owner !== g.ME);
    setMovebookDefaultSide(isDef ? "defense" : "offense");
    setShowMovebook(true);
  }, []);

  const handleToggleQuickMovesSmart = useCallback(() => {
    const g = gameRef.current;
    const isDef = Boolean(g?.state && g?.ME && g.state.owner !== g.ME);
    setMovebookDefaultSide(isDef ? "defense" : "offense");
    setShowQuickMoves((prev) => !prev);
  }, []);

  const handlePickUpBall = useCallback(() => {
    if (gameRef.current?.scoopBall) {
      gameRef.current.scoopBall();
    }
  }, []);

  const handleTipOffComplete = useCallback((userWon: boolean) => {
    setShowTipOff(false);
    if (gameRef.current?.executeTipOff) {
      gameRef.current.executeTipOff(userWon);
    }
    if (mpClientRef.current?.roomCode) {
      mpClientRef.current.sendEvent("tip_off", {
        ownerEntityKey: userWon ? "Home:0" : "Away:0",
      });
    }
  }, []);

  const handleSelectGameMode = useCallback((mode: GameMode, triggerTipOff = true) => {
    setGameMode(mode);
    gameModeRef.current = mode;
    setShowSummary(false);
    setShowHighlights(false);
    setShowMeter(false);
    setTimeoutsLeft(3);
    isHighlightReplayRef.current = false;
    if (mode === "training") {
      setTrainingDrill({ made: 0, target: 5, completedCount: 0 });
    }
    if (gameRef.current?.applyGameMode) {
      gameRef.current.applyGameMode(mode);
    }
    if (mpClientRef.current?.roomCode) {
      mpClientRef.current.sendEvent("mode_change", { mode });
    }
    if (triggerTipOff && (mode === "match" || mode === "streetball")) {
      setShowTipOff(true);
    } else {
      setShowTipOff(false);
    }
  }, []);

  const handleChangeQuarterLength = useCallback((sec: number) => {
    setQuarterLengthSec(sec);
    quarterLengthRef.current = sec;
    setGameClock(sec);
    if (gameRef.current?.state) {
      gameRef.current.state.gameClock = sec;
    }
  }, []);

  const handleChangeInputPreference = useCallback((pref: InputPreference) => {
    setInputPreference(pref);
    inputPreferenceRef.current = pref;
    if (pref === "keyboard") {
      setShowOnScreenPad(false);
    } else if (pref === "touch" || pref === "gamepad") {
      setShowOnScreenPad(true);
    }
  }, []);

  const handleTouchButtonState = useCallback((btnKey: string, pressed: boolean) => {
    const g = gameRef.current;
    if (!g?.state) return;
    g.state.touchButtons[btnKey] = pressed;
    if (pressed) {
      g.state.touchPulses[btnKey] = true;
      void audioManagerRef.current?.unlock().catch(() => {});
    }
  }, []);

  const handleContinueFromHighlights = useCallback(() => {
    setShowHighlights(false);
    isHighlightReplayRef.current = false;
    const action = pendingPostHighlightActionRef.current;
    pendingPostHighlightActionRef.current = "close_only";
    if (gameRef.current?.finishHighlightPlayback) {
      gameRef.current.finishHighlightPlayback(action);
    }
  }, []);

  const handleOpenHighlightsFromMenu = useCallback(() => {
    const clips = allHighlightsRef.current.slice(-3);
    if (clips.length === 0) return;
    if (gameRef.current?.startHighlightPlayback) {
      gameRef.current.startHighlightPlayback(clips, "close_only", clips[clips.length - 1].quarter, false);
    }
  }, []);

  const handleEndQuarterNow = useCallback(() => {
    if (gameRef.current?.completeQuarter) {
      gameRef.current.completeQuarter();
    }
  }, []);

  const handleFetchRooms = useCallback(async () => {
    return mpClientRef.current ? await mpClientRef.current.listRooms() : [];
  }, []);

  const handleChangeAudioSettings = useCallback((patch: Partial<AudioVolumeSettings>) => {
    if (!audioManagerRef.current) {
      audioManagerRef.current = new BasketballAudioManager();
    }
    void audioManagerRef.current.unlock().catch(() => {});
    const updated = audioManagerRef.current.updateSettings(patch);
    setAudioSettings(updated);
  }, []);

  const handleTacticsChange = useCallback((newTactics: TacticalSettings) => {
    setTactics(newTactics);
    tacticsRef.current = newTactics;
    if (gameRef.current?.triggerMsg) {
      gameRef.current.triggerMsg(`TACTIC: ${newTactics.defense.toUpperCase()}`, "#38bdf8");
    }
  }, []);

  const openTacticsHuddle = useCallback((consumeTimeout: boolean) => {
    const inLiveMatch = gameModeRef.current === "match" || gameModeRef.current === "streetball";
    if (consumeTimeout && inLiveMatch) {
      if (timeoutsLeft <= 0) {
        if (gameRef.current?.triggerMsg) {
          gameRef.current.triggerMsg("NO TIMEOUTS REMAINING", "#ef4444");
        }
        return;
      }
      setTimeoutsLeft((prev) => prev - 1);
    }
    if (gameRef.current?.state) {
      gameRef.current.state.isPaused = true;
      gameRef.current.state.pauseT = 0;
    }
    if (consumeTimeout && inLiveMatch && gameRef.current?.Audio) {
      gameRef.current.Audio.whistle();
      gameRef.current.Audio.speak("Timeout! Tactical huddle!");
    }
    setShowTimeout(true);
  }, [timeoutsLeft]);

  const callTimeout = useCallback(() => {
    openTacticsHuddle(true);
  }, [openTacticsHuddle]);

  const resumeFromTimeout = useCallback(() => {
    setShowTimeout(false);
    if (gameRef.current?.state) {
      gameRef.current.state.isPaused = false;
    }
    if (gameRef.current?.Audio) {
      gameRef.current.Audio.whistle();
    }
    if (gameRef.current?.triggerMsg) {
      gameRef.current.triggerMsg("RESUMING ACTION", "#10b981");
    }
  }, []);

  const handleSelectCity = useCallback((city: WorldCity) => {
    setSelectedCity(city);
    if (gameRef.current?.applyCity) {
      gameRef.current.applyCity(city);
    }
    if (mpClientRef.current?.roomCode) {
      mpClientRef.current.sendEvent("city_change", { cityId: city.id });
    }
  }, []);

  const handleStartMatchCity = useCallback((city: WorldCity) => {
    setSelectedCity(city);
    setShowWorldTour(false);
    setShowSummary(false);
    setShowHighlights(false);
    setShowMeter(false);
    setTimeoutsLeft(3);
    setGameMode("match");
    gameModeRef.current = "match";
    if (gameRef.current?.applyGameMode) {
      gameRef.current.applyGameMode("match");
    }
    if (gameRef.current?.applyCity) {
      gameRef.current.applyCity(city);
    }
    if (mpClientRef.current?.roomCode) {
      mpClientRef.current.sendEvent("city_change", { cityId: city.id });
      mpClientRef.current.sendEvent("mode_change", { mode: "match" });
    }
    setShowTipOff(true);
  }, []);

  const handleChangeDivision = useCallback((division: ProLeagueDivision) => {
    setActiveDivision(division);
    const nextTour = loadNationalTourState(division);
    nationalTourRef.current = nextTour;
    setNationalTour(nextTour);
    const nextLeague = loadLeagueState(division);
    leagueStateRef.current = nextLeague;
    setLeagueState(nextLeague);
  }, []);

  const handleChangeNightGameMode = useCallback((mode: NightGameMode) => {
    const next = { ...studioCustomRef.current, nightGameMode: mode };
    studioCustomRef.current = next;
    setStudioCustom(next);
    saveStudioCustomization(next);
    if (gameRef.current?.applyStudioCustomToScene) {
      gameRef.current.applyStudioCustomToScene(next);
    }
    if (gameRef.current?.triggerLabel) {
      const lbl =
        mode === "night"
          ? "NIGHT GAMES EVERYWHERE: ON"
          : mode === "day"
          ? "ARENA LIGHTING: DAYTIME"
          : "ARENA LIGHTING: CITY AUTO TIME";
      gameRef.current.triggerLabel(lbl);
    }
  }, []);

  const handleStartNationalTourStop = useCallback(
    (stop: NationalTourStop, city: WorldCity) => {
      activeMatchContextRef.current = {
        kind: "national_tour",
        stopId: stop.id,
        cityId: city.id,
      };
      setShowNationalTour(false);
      setShowMainMenu(false);
      handleStartMatchCity(city);
      const oppName = activeDivision === "womens" ? stop.opponentNameWomens : stop.opponentNameMens;
      if (gameRef.current?.triggerMsg) {
        gameRef.current.triggerMsg(`STOP #${stop.stopNumber}: VS ${oppName.toUpperCase()}`, "#38bdf8");
      }
    },
    [activeDivision, handleStartMatchCity]
  );

  const reloadAllSavedStates = useCallback(() => {
    const savedProfile = loadAthleteProfile();
    const savedCareer = loadCareerStats();
    const savedLeague = loadLeagueState(activeDivision);
    const savedMyCareer = loadCareerState();
    const savedFranchise = loadFranchiseState();
    const savedCustom = loadStudioCustomization();
    const savedTraining = loadTrainingState();
    const savedCup = loadWorldTourTournamentState();
    const savedUniverse = loadUniverseState();
    const savedNatTour = loadNationalTourState(activeDivision);

    athleteProfileRef.current = savedProfile;
    setAthleteProfile(savedProfile);
    careerStatsRef.current = savedCareer;
    setCareerStats(savedCareer);
    leagueStateRef.current = savedLeague;
    setLeagueState(savedLeague);
    myCareerRef.current = savedMyCareer;
    setMyCareer(savedMyCareer);
    franchiseStateRef.current = savedFranchise;
    setFranchiseState(savedFranchise);
    studioCustomRef.current = savedCustom;
    setStudioCustom(savedCustom);
    trainingAcademyRef.current = savedTraining;
    setTrainingAcademy(savedTraining);
    worldTournamentRef.current = savedCup;
    setWorldTournament(savedCup);
    setUniverseState(savedUniverse);
    nationalTourRef.current = savedNatTour;
    setNationalTour(savedNatTour);

    if (gameRef.current?.applyCustomization) gameRef.current.applyCustomization(savedCareer);
    if (gameRef.current?.applyAthleteProfile) gameRef.current.applyAthleteProfile(savedProfile);
    if (gameRef.current?.applyStudioCustomToScene) gameRef.current.applyStudioCustomToScene(savedCustom);
  }, [activeDivision]);

  const handleStartAcademyDrill = useCallback((drill: TrainingDrillDefinition) => {
    setShowTrainingAcademy(false);
    setShowMainMenu(false);
    const nextDrill = { drill, repsMade: 0, attempts: 0, timeLeft: drill.durationSec };
    activeAcademyDrillRef.current = nextDrill;
    setActiveAcademyDrill(nextDrill);
    handleSelectGameMode("training", false);
    if (gameRef.current?.triggerMsg) {
      gameRef.current.triggerMsg(`${drill.title.toUpperCase()}`, "#10b981");
    }
  }, [handleSelectGameMode]);

  const handleCompleteAcademyDrill = useCallback(() => {
    const curr = activeAcademyDrillRef.current;
    if (!curr) return;
    const accPct = Math.min(
      100,
      Math.round((curr.repsMade / Math.max(1, curr.attempts, curr.drill.targetReps)) * 100)
    );
    const score = curr.repsMade * 100 + accPct * 5;
    const passed = curr.repsMade >= curr.drill.targetReps;
    const xpEarned = passed ? curr.drill.xpReward : Math.max(25, Math.round(curr.drill.xpReward * 0.45));
    const nextAcademy = recordTrainingDrillResult(
      trainingAcademyRef.current,
      curr.drill.id,
      score,
      accPct,
      xpEarned
    );
    trainingAcademyRef.current = nextAcademy;
    setTrainingAcademy(nextAcademy);
    saveTrainingState(nextAcademy);

    const nextCareer = {
      ...myCareerRef.current,
      xpAvailable: myCareerRef.current.xpAvailable + xpEarned,
    };
    myCareerRef.current = nextCareer;
    setMyCareer(nextCareer);
    saveCareerState(nextCareer);

    const drillRes = addDebugCareerStats(curr.repsMade * 2, 0, 0);
    setCareerStats(drillRes.updatedStats);
    activeAcademyDrillRef.current = null;
    setActiveAcademyDrill(null);
    if (gameRef.current?.triggerMsg) {
      gameRef.current.triggerMsg(`DRILL COMPLETE · +${xpEarned} XP`, "#10b981");
    }
    setShowTrainingAcademy(true);
  }, []);

  const handleCompleteAcademyDrillRef = useRef(handleCompleteAcademyDrill);
  useEffect(() => {
    handleCompleteAcademyDrillRef.current = handleCompleteAcademyDrill;
  }, [handleCompleteAcademyDrill]);

  const handleDismissBroadcast = useCallback(() => {
    const action = pendingPostBroadcastActionRef.current;
    pendingPostBroadcastActionRef.current = "none";
    setBroadcastScene(null);
    if (action === "show_summary") {
      setShowSummary(true);
    }
  }, []);

  const handleChooseInterview = useCallback((repGain: number, quote: string) => {
    const updatedCareer = {
      ...myCareerRef.current,
      reputation: Math.min(1200, myCareerRef.current.reputation + repGain),
    };
    myCareerRef.current = updatedCareer;
    setMyCareer(updatedCareer);
    saveCareerState(updatedCareer);
    if (gameRef.current?.triggerMsg) {
      gameRef.current.triggerMsg(`+${repGain} REP · "${quote.slice(0, 26)}..."`, "#f59e0b");
    }
  }, []);

  const handleStartLeagueMatchup = useCallback((homeTeamId: string, awayTeamId: string, isPlayoff = false) => {
    const homeTeam = APBA_TEAMS.find((t) => t.id === homeTeamId) || APBA_TEAMS[0];
    const awayTeam = APBA_TEAMS.find((t) => t.id === awayTeamId) || APBA_TEAMS[1];
    activeMatchContextRef.current = { kind: "league", homeTeamId, awayTeamId, isPlayoff };
    setShowLeagueCentral(false);
    setShowFranchise(false);
    setShowCareerHub(false);
    handleSelectGameMode("match", true);
    if (gameRef.current?.triggerMsg) {
      gameRef.current.triggerMsg(`${awayTeam.abbr} @ ${homeTeam.abbr}`, homeTeam.primaryColor);
    }
  }, [handleSelectGameMode]);

  const handleStartCupMatch = useCallback((homeCity: WorldCity, awayCity: WorldCity, matchId: string) => {
    activeMatchContextRef.current = {
      kind: "world_cup",
      matchId,
      homeCityId: homeCity.id,
      awayCityId: awayCity.id,
    };
    const hostCity = awayCity.id === worldTournamentRef.current.userCityId ? homeCity : awayCity;
    handleStartMatchCity(hostCity);
  }, [handleStartMatchCity]);

  const isMenuNavigationOpen =
    showMainMenu ||
    showWorldTour ||
    showNationalTour ||
    showCreateAthlete ||
    showDraftModal ||
    showMovebook ||
    showLockerRoom ||
    showFeaturesModal ||
    showMultiplayer ||
    showScreenMirror ||
    showLeagueCentral ||
    showCareerHub ||
    showFranchise ||
    showCustomization ||
    showTrainingAcademy ||
    showHelp;

  useEffect(() => {
    const open =
      showMainMenu ||
      showTipOff ||
      showCreateAthlete ||
      showDraftModal ||
      showMovebook ||
      showWorldTour ||
      showNationalTour ||
      showLockerRoom ||
      showTimeout ||
      showHelp ||
      showFeaturesModal ||
      showMultiplayer ||
      showScreenMirror ||
      showLeagueCentral ||
      showCareerHub ||
      showFranchise ||
      showCustomization ||
      showTrainingAcademy ||
      Boolean(broadcastScene) ||
      showSummary;
    isOverlayOpenRef.current = open;
    if (open && gameRef.current?.state) {
      gameRef.current.state.keys = {};
      gameRef.current.state.touchButtons = {};
      gameRef.current.state.touchPulses = {};
      gameRef.current.state.joystick = { x: 0, y: 0, active: false, autoSprint: false };
    }
  }, [
    showMainMenu,
    showTipOff,
    showCreateAthlete,
    showDraftModal,
    showMovebook,
    showWorldTour,
    showNationalTour,
    showLockerRoom,
    showTimeout,
    showHelp,
    showFeaturesModal,
    showMultiplayer,
    showScreenMirror,
    showLeagueCentral,
    showCareerHub,
    showFranchise,
    showCustomization,
    showTrainingAcademy,
    broadcastScene,
    showSummary,
  ]);

  // Synchronize Main Menu soundtrack ("Rise From Nothing"): plays across all Main Menu screens,
  // fades smoothly over 3 seconds when gameplay begins, and restarts cleanly when returning to Main Menu.
  useEffect(() => {
    if (!audioManagerRef.current) {
      audioManagerRef.current = new BasketballAudioManager();
    }
    audioManagerRef.current.setMenuActive(isMenuNavigationOpen);
  }, [isMenuNavigationOpen]);

  // Initialize Cross-Play Device Detection & Multiplayer Client
  useEffect(() => {
    const dev = detectDeviceType();
    const client = new CrossPlayMultiplayerClient({
      onTransportChange: (t) => {
        setMpTransport(t);
      },
      onRoomSnapshot: (room) => {
        mpRoomRef.current = room;
        setMpRoom({ ...room });
        if (gameRef.current?.applyRemoteRoomSnapshot) {
          gameRef.current.applyRemoteRoomSnapshot(room);
        }
      },
      onPeerDelta: (pid, player, match) => {
        if (mpRoomRef.current) {
          mpRoomRef.current.players[pid] = player;
          if (match) Object.assign(mpRoomRef.current.match, match);
        }
        if (match && gameRef.current?.applyRemoteMatchPatch) {
          gameRef.current.applyRemoteMatchPatch(match);
        }
      },
      onMatchEvent: (event, match) => {
        if (gameRef.current?.applyRemoteMatchEvent) {
          gameRef.current.applyRemoteMatchEvent(event, match);
        }
      },
    });
    mpClientRef.current = client;

    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      const savedProfile = loadAthleteProfile();
      const savedCareer = loadCareerStats();
      const savedAudio = loadAudioSettings();
      const savedLeague = loadLeagueState();
      const savedMyCareer = loadCareerState();
      const savedFranchise = loadFranchiseState();
      const savedCustom = loadStudioCustomization();
      const savedTraining = loadTrainingState();
      const savedCup = loadWorldTourTournamentState();
      const savedNatTour = loadNationalTourState("mens");
      athleteProfileRef.current = savedProfile;
      setAthleteProfile(savedProfile);
      careerStatsRef.current = savedCareer;
      setCareerStats(savedCareer);
      setAudioSettings(savedAudio);
      leagueStateRef.current = savedLeague;
      setLeagueState(savedLeague);
      myCareerRef.current = savedMyCareer;
      setMyCareer(savedMyCareer);
      franchiseStateRef.current = savedFranchise;
      setFranchiseState(savedFranchise);
      studioCustomRef.current = savedCustom;
      setStudioCustom(savedCustom);
      trainingAcademyRef.current = savedTraining;
      setTrainingAcademy(savedTraining);
      worldTournamentRef.current = savedCup;
      setWorldTournament(savedCup);
      nationalTourRef.current = savedNatTour;
      setNationalTour(savedNatTour);
      if (gameRef.current?.applyCustomization) {
        gameRef.current.applyCustomization(savedCareer);
      }
      if (gameRef.current?.applyAthleteProfile) {
        gameRef.current.applyAthleteProfile(savedProfile);
      }
      if (gameRef.current?.applyStudioCustomToScene) {
        gameRef.current.applyStudioCustomToScene(savedCustom);
      }

      setDetectedDevice(dev);
      setMpPlayerId(client.playerId);

      // Auto-join room if URL contains ?room=CODE
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const urlRoom = params.get("room");
        if (urlRoom && urlRoom.trim().length >= 3) {
          client.joinRoom({
            roomCode: urlRoom.trim(),
            name: `${savedProfile.firstName} ${savedProfile.lastName}`.trim(),
            deviceType: dev,
            jerseyColor: savedProfile.jerseyColorHex,
            shortsColor: savedProfile.shortsColorHex,
            cityId: initialCityRef.current.id,
            mode: gameModeRef.current,
          });
        }
      }
    });

    return () => {
      cancelled = true;
      client.leaveRoom();
      client.destroy();
    };
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const initialCity = initialCityRef.current;

    if (!audioManagerRef.current) {
      audioManagerRef.current = new BasketballAudioManager();
    }
    const audioMgr = audioManagerRef.current;

    // Auto-detect touch capability & listen for touch/pen/key interaction + audio unlock (iOS & Desktop)
    const isCoarsePointer = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    setIsMobileUI(isCoarsePointer || "ontouchstart" in window || navigator.maxTouchPoints > 0);
    const onAutoTouchDetect = (e: PointerEvent) => {
      void audioMgr.unlock().catch(() => {});
      if (e.pointerType === "touch" || e.pointerType === "pen") {
        setHasTouchInput(true);
      }
    };
    const onFirstTouchStart = () => {
      void audioMgr.unlock().catch(() => {});
      setHasTouchInput(true);
    };
    const onFirstKeyUnlock = () => {
      void audioMgr.unlock().catch(() => {});
    };
    const onVisibilityAudioResume = () => {
      if (document.visibilityState === "visible") {
        void audioMgr.unlock().catch(() => {});
      }
    };
    window.addEventListener("pointerdown", onAutoTouchDetect, { passive: true });
    window.addEventListener("touchstart", onFirstTouchStart, { passive: true });
    window.addEventListener("keydown", onFirstKeyUnlock, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityAudioResume);
    // Attempt auto-start on mount (starts immediately if permitted by browser, otherwise starts on first gesture)
    void audioMgr.unlock().catch(() => {});

    // --- SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f19);
    scene.fog = new THREE.FogExp2(0x0b0f19, 0.015);

    const isSoftwareGl = (() => {
      if (typeof document === "undefined") return true;
      const gl = document.createElement("canvas").getContext("webgl2");
      if (!gl) return true;
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 300);
    const renderer = new THREE.WebGLRenderer({ antialias: !isSoftwareGl, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    scene.environmentIntensity = 0.52;
    roomEnv.dispose();
    pmrem.dispose();

    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // --- LIGHTING (2K Arena Rafter Spotlights + GI Maple Bounce + Volumetric Cones) ---
    const ambientLight = new THREE.AmbientLight(0x1a233a, 0.85);
    scene.add(ambientLight);
    scene.add(new THREE.HemisphereLight(0xaec8ff, 0xc78242, 0.85));

    const arenaSpot = new THREE.SpotLight(0xfff8ee, 2.75, 130, Math.PI / 4, 0.48, 0.82);
    arenaSpot.position.set(0, 40, 0);
    arenaSpot.target.position.set(0, 0, 0);
    arenaSpot.castShadow = !isSoftwareGl;
    arenaSpot.shadow.mapSize.set(2048, 2048);
    arenaSpot.shadow.bias = -0.0005;
    scene.add(arenaSpot, arenaSpot.target);

    const rimLight = new THREE.DirectionalLight(0xff9a4a, 0.72);
    rimLight.position.set(-18, 12, -10);
    scene.add(rimLight);

    const sun = new THREE.DirectionalLight(0xffffff, 0.62);
    sun.position.set(8, 28, 12);
    sun.castShadow = !isSoftwareGl;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -20; sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 10; sun.shadow.camera.bottom = -10;
    scene.add(sun);

    // Shadowless warm hardwood upward bounce lights + subtle volumetric arena light cones
    const courtBouncePositions: [number, number, number][] = [
      [0, 1.2, 0],
      [-9.5, 1.2, 0],
      [9.5, 1.2, 0],
    ];
    courtBouncePositions.forEach(([bx, by, bz]) => {
      const bouncePt = new THREE.PointLight(0xd99b5e, 1.35, 24, 1.4);
      bouncePt.position.set(bx, by, bz);
      scene.add(bouncePt);
    });

    const arenaVolumetricGroup = new THREE.Group();
    const beamConeGeo = new THREE.CylinderGeometry(1.1, 5.2, 12.2, 16, 1, true);
    const beamConeMat = new THREE.MeshBasicMaterial({
      color: 0xfff5e4,
      transparent: true,
      opacity: 0.032,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    [
      [-7.5, -2.5],
      [0, 0],
      [7.5, 2.5],
    ].forEach(([vx, vz]) => {
      const beam = new THREE.Mesh(beamConeGeo, beamConeMat);
      beam.position.set(vx, 6.2, vz);
      arenaVolumetricGroup.add(beam);
    });
    scene.add(arenaVolumetricGroup);

    // --- NIGHT GAMES EVERYWHERE: STADIUM FLOODLIGHT TOWERS + STARFIELD + MOON ---
    const nightFloodGroup = new THREE.Group();
    const towerPoleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.7 });
    const towerLedMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const towerPositions: [number, number][] = [
      [-14.8, -9.6],
      [14.8, -9.6],
      [-14.8, 9.6],
      [14.8, 9.6],
    ];
    towerPositions.forEach(([tx, tz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 13.5, 8), towerPoleMat);
      pole.position.set(tx, 6.75, tz);
      nightFloodGroup.add(pole);

      const head = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.72, 0.35), towerPoleMat);
      head.position.set(tx, 13.5, tz);
      head.lookAt(0, 0, 0);
      nightFloodGroup.add(head);

      const led = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 0.56), towerLedMat);
      led.position.set(tx * 0.96, 13.45, tz * 0.94);
      led.lookAt(0, 0, 0);
      nightFloodGroup.add(led);
    });
    const floodSpotL = new THREE.PointLight(0xe0f2fe, 1.85, 36, 1.3);
    floodSpotL.position.set(-10.5, 11.5, 0);
    const floodSpotR = new THREE.PointLight(0xe0f2fe, 1.85, 36, 1.3);
    floodSpotR.position.set(10.5, 11.5, 0);
    nightFloodGroup.add(floodSpotL, floodSpotR);
    scene.add(nightFloodGroup);

    const nightSkyGroup = new THREE.Group();
    const starCount = 720;
    const starPositions = new Float32Array(starCount * 3);
    for (let sIdx = 0; sIdx < starCount; sIdx++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(0.18 + Math.random() * 0.82);
      const rad = 74 + Math.random() * 20;
      starPositions[sIdx * 3] = rad * Math.sin(phi) * Math.cos(theta);
      starPositions[sIdx * 3 + 1] = rad * Math.cos(phi);
      starPositions[sIdx * 3 + 2] = rad * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xe2e8f0,
      size: 0.48,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    nightSkyGroup.add(starPoints);

    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xfef9c3 })
    );
    moonMesh.position.set(-34, 42, -52);
    nightSkyGroup.add(moonMesh);
    scene.add(nightSkyGroup);

    // --- TIKI TIKI SIGNATURE SLAM VFX POOL (PRE-ALLOCATED GREEN & GOLD PARTICLES + SHOCKWAVE) ---
    const tikiFlashLight = new THREE.PointLight(0x10b981, 0, 16, 1.4);
    tikiFlashLight.position.set(HOOP_X, RIM_Y + 0.6, 0);
    scene.add(tikiFlashLight);

    const tikiShockMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const tikiShockRing = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.56, 36), tikiShockMat);
    tikiShockRing.rotation.x = -Math.PI / 2;
    tikiShockRing.position.set(HOOP_X, 0.04, 0);
    tikiShockRing.visible = false;
    scene.add(tikiShockRing);

    const tikiGreenMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.95 });
    const tikiGoldMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.95 });
    const tikiPartGeo = new THREE.OctahedronGeometry(0.11, 0);
    const tikiParticles = Array.from({ length: 64 }, (_, idx) => {
      const m = new THREE.Mesh(tikiPartGeo, idx % 2 === 0 ? tikiGreenMat : tikiGoldMat);
      m.visible = false;
      scene.add(m);
      return { mesh: m, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1.1 };
    });
    const tikiVfxState = { flashT: 0, ringT: 0, hoopX: HOOP_X, lastReplayClipId: "" };
    const triggerTikiSlamVfx = (hoopX: number) => {
      tikiVfxState.flashT = 1.05;
      tikiVfxState.ringT = 0.85;
      tikiVfxState.hoopX = hoopX;
      tikiFlashLight.position.set(hoopX, RIM_Y + 0.5, 0);
      tikiShockRing.position.set(hoopX, 0.045, 0);
      tikiShockRing.scale.setScalar(1);
      tikiShockRing.visible = true;
      tikiShockMat.opacity = 0.95;
      for (let i = 0; i < tikiParticles.length; i++) {
        const pt = tikiParticles[i];
        const ang = (i / tikiParticles.length) * Math.PI * 2 + Math.random() * 0.4;
        const horiz = 2.4 + Math.random() * 4.8;
        pt.mesh.position.set(hoopX + rnd(0.22), RIM_Y + rnd(0.18), rnd(0.22));
        pt.mesh.scale.setScalar(0.85 + Math.random() * 0.75);
        pt.mesh.visible = true;
        pt.vx = Math.cos(ang) * horiz;
        pt.vy = 2.5 + Math.random() * 5.2;
        pt.vz = Math.sin(ang) * horiz;
        pt.maxLife = 0.85 + Math.random() * 0.5;
        pt.life = pt.maxLife;
      }
    };

    // --- PROCEDURAL REALISTIC WOODGRAIN & WEAR TEXTURE ---
    const createWoodgrainTexture = (lightHex = "#c99256", darkHex = "#b9803f") => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Base alternating maple hardwood planks matching Original Court Scene
      const plankCount = 36;
      const plankH = canvas.height / plankCount;
      for (let i = 0; i < plankCount; i++) {
        ctx.fillStyle = i % 2 ? lightHex : darkHex;
        ctx.fillRect(0, i * plankH, canvas.width, plankH + 1);
        ctx.fillStyle = "rgba(60, 30, 10, 0.35)";
        ctx.fillRect(0, i * plankH, canvas.width, 2);

        // Staggered cross-plank seams & subtle grain
        ctx.strokeStyle = "rgba(70, 35, 12, 0.16)";
        ctx.lineWidth = 1.2;
        const seamOffset = (i % 4) * 240 + 80;
        for (let sx = seamOffset; sx < canvas.width; sx += 320) {
          ctx.fillStyle = "rgba(50, 24, 8, 0.32)";
          ctx.fillRect(sx, i * plankH, 2, plankH);
        }
        ctx.beginPath();
        ctx.moveTo(0, i * plankH + plankH * 0.5);
        ctx.bezierCurveTo(320, i * plankH + plankH * 0.2, 680, i * plankH + plankH * 0.8, 1024, i * plankH + plankH * 0.5);
        ctx.stroke();
      }

      // Add wear and tear / scuff marks (shoe scuffs, resin wear near paint)
      ctx.fillStyle = "rgba(25, 15, 8, 0.24)";
      for (let i = 0; i < 42; i++) {
        const sx = Math.random() * 1024;
        const sz = Math.random() * 512;
        ctx.beginPath();
        ctx.ellipse(sx, sz, 12 + Math.random() * 32, 3 + Math.random() * 7, (Math.random() - 0.5) * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Center court arena spotlight sheen
      const grad = ctx.createRadialGradient(512, 256, 20, 512, 256, 240);
      grad.addColorStop(0, "rgba(255, 244, 224, 0.16)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = 8;
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };

    // --- PROCEDURAL STREETBALL ASPHALT TEXTURE ---
    const createAsphaltTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.fillStyle = "#2b303a";
      ctx.fillRect(0, 0, 1024, 512);

      // Aggregate grit & asphalt wear
      for (let i = 0; i < 4000; i++) {
        const shade = Math.random() > 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.18)";
        ctx.fillStyle = shade;
        ctx.fillRect(Math.random() * 1024, Math.random() * 512, 2, 2);
      }

      // Cracks & weathering
      ctx.strokeStyle = "rgba(10, 12, 16, 0.6)";
      ctx.lineWidth = 2;
      for (let c = 0; c < 18; c++) {
        let cx = Math.random() * 1024;
        let cy = Math.random() * 512;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        for (let seg = 0; seg < 6; seg++) {
          cx += (Math.random() - 0.5) * 45;
          cy += (Math.random() - 0.5) * 45;
          ctx.lineTo(cx, cy);
        }
        ctx.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 1);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };

    // --- COURT, DARK ARENA SURROUND & APRON ---
    const surround = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x15171d, roughness: 1 })
    );
    surround.rotation.x = -Math.PI / 2;
    surround.position.y = -0.012;
    surround.receiveShadow = true;
    scene.add(surround);

    const apronMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialCity.courtBorderColor),
      roughness: 0.75,
      metalness: 0.1,
    });
    const apronFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(COURT_W + 16, COURT_H + 16),
      apronMat
    );
    apronFloor.rotation.x = -Math.PI / 2;
    apronFloor.position.y = -0.005;
    apronFloor.receiveShadow = true;
    scene.add(apronFloor);

    // Hardwood Court with high-gloss polyurethane clearcoat finish & woodgrain wear
    let floorTex = createWoodgrainTexture();
    const asphaltTex = createAsphaltTexture();
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: floorTex ? 0xffffff : 0xd4a373,
      map: floorTex || undefined,
      roughness: 0.24,
      metalness: 0.08,
      clearcoat: 0.9,
      clearcoatRoughness: 0.14,
      envMapIntensity: 1.35,
    });
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(COURT_W, COURT_H),
      floorMat
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // --- GRASS TUFTS & WEAR AROUND COURT MARGINS ---
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x1b4d3e, roughness: 0.85 });
    const dirtMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 });
    const marginGroup = new THREE.Group();

    for (let i = 0; i < 160; i++) {
      const edge = Math.floor(Math.random() * 4);
      let gx = 0, gz = 0;
      const halfW = (COURT_W + 15) / 2;
      const halfH = (COURT_H + 15) / 2;
      if (edge === 0) { gx = (Math.random() - 0.5) * (COURT_W + 15); gz = halfH - Math.random() * 3.5; }
      else if (edge === 1) { gx = (Math.random() - 0.5) * (COURT_W + 15); gz = -halfH + Math.random() * 3.5; }
      else if (edge === 2) { gx = halfW - Math.random() * 3.5; gz = (Math.random() - 0.5) * (COURT_H + 15); }
      else { gx = -halfW + Math.random() * 3.5; gz = (Math.random() - 0.5) * (COURT_H + 15); }

      // Sprouting grass tuft
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 5), grassMat);
      tuft.position.set(gx, 0.18, gz);
      tuft.rotation.z = (Math.random() - 0.5) * 0.5;
      tuft.rotation.x = (Math.random() - 0.5) * 0.5;
      marginGroup.add(tuft);

      // Small dirt patch / crack
      if (i % 3 === 0) {
        const patch = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), dirtMat);
        patch.rotation.x = -Math.PI / 2;
        patch.position.set(gx + (Math.random() - 0.5) * 0.4, 0.001, gz + (Math.random() - 0.5) * 0.4);
        marginGroup.add(patch);
      }
    }
    scene.add(marginGroup);

    // Painted Free Throw Keys
    const keyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialCity.courtKeyColor),
      roughness: 0.5,
    });
    [1, -1].forEach((side) => {
      const keyMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 4.9), keyMat);
      keyMesh.rotation.x = -Math.PI / 2;
      keyMesh.position.set((14 - 2.9) * side, 0.002, 0);
      scene.add(keyMesh);
    });

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf5f2ea });
    function line(w: number, d: number, x: number, z: number) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lineMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.012, z);
      scene.add(m);
    }
    function ring(r1: number, r2: number, x: number, z: number, a: number, len: number) {
      const m = new THREE.Mesh(new THREE.RingGeometry(r1, r2, 48, 1, a, len), lineMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.012, z);
      scene.add(m);
    }

    line(COURT_W, 0.1, 0, 7.5); line(COURT_W, 0.1, 0, -7.5);
    line(0.1, 15, 14, 0);  line(0.1, 15, -14, 0);
    line(0.1, 15, 0, 0);
    ring(1.75, 1.85, 0, 0, 0, Math.PI * 2);

    const shotClock3DMats: THREE.MeshBasicMaterial[] = [];
    let leftNet: DeformableNet | undefined;
    let rightNet: DeformableNet | undefined;

    [1, -1].forEach(side => {
      const x = 14 * side;
      line(5.8, 0.06, x - 2.9 * side, 2.45); line(5.8, 0.06, x - 2.9 * side, -2.45);
      line(0.06, 4.9, x - 5.8 * side, 0);
      // Free throw circle
      ring(1.75, 1.83, x - 5.8 * side, 0, 0, Math.PI * 2);
      // Three-point arc + corner sidelines centered on hoop
      ring(6.7, 6.78, x - 1.2 * side, 0, (side > 0 ? -1 : 1) * Math.PI / 2, Math.PI);
      line(3, 0.06, x - 1.5 * side, 6.6); line(3, 0.06, x - 1.5 * side, -6.6);

      // Tempered Glass Backboard with Orange-Red Perimeter Frame & Shooter's Square
      const boardGeo = new THREE.BoxGeometry(0.05, 1.05, 1.8);
      const board = new THREE.Mesh(
        boardGeo,
        new THREE.MeshStandardMaterial({ color: 0xe8f0f8, transparent: true, opacity: 0.6, roughness: 0.3 })
      );
      board.position.set(x - 0.8 * side, 3.42, 0);
      scene.add(board);

      const boardEdge = new THREE.LineSegments(
        new THREE.EdgesGeometry(boardGeo),
        new THREE.LineBasicMaterial({ color: 0xd8431e })
      );
      boardEdge.position.copy(board.position);
      scene.add(boardEdge);

      const shooterSquare = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(0.055, 0.45, 0.59)),
        new THREE.LineBasicMaterial({ color: 0xffffff })
      );
      shooterSquare.position.set(x - 0.8 * side, 3.28, 0);
      scene.add(shooterSquare);

      // 3D Arena Shot Clock unit on top of backboard
      const clockHousing = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.35, 0.55),
        new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 })
      );
      clockHousing.position.set(x - 0.8 * side, 4.15, 0);
      scene.add(clockHousing);

      // Glowing LED face
      const clockFaceMat = new THREE.MeshBasicMaterial({ color: 0xffbb00 });
      shotClock3DMats.push(clockFaceMat);
      const clockFace = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 0.3),
        clockFaceMat
      );
      clockFace.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      clockFace.position.set(x - (0.8 + 0.065) * side, 4.15, 0);
      scene.add(clockFace);

      // Metallic Rim + Mounting Collar + Diagonal Backboard Support Struts
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(RIM_R, 0.022, 14, 36),
        new THREE.MeshStandardMaterial({ color: 0xe64a19, metalness: 0.65, roughness: 0.28 })
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.set(x - 1.2 * side, RIM_Y, 0);
      rim.castShadow = true;
      scene.add(rim);

      const rimCollar = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.09, 0.16),
        new THREE.MeshStandardMaterial({ color: 0xd8431e, metalness: 0.55, roughness: 0.35 })
      );
      rimCollar.position.set(x - 0.9 * side, RIM_Y - 0.02, 0);
      scene.add(rimCollar);

      // Stanchion Pole + Padded Base + Accent Stripe + Gooseneck Extension Arm
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.72, roughness: 0.28 });
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 3.65, 16), poleMat);
      pole.position.set(x + 0.65 * side, 1.825, 0);
      pole.castShadow = true;
      scene.add(pole);

      const stanchionPad = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 1.42, 0.48),
        new THREE.MeshStandardMaterial({ color: 0x11151d, roughness: 0.65 })
      );
      stanchionPad.position.set(x + 0.65 * side, 0.71, 0);
      stanchionPad.castShadow = true;
      scene.add(stanchionPad);

      const padStripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.16, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45, metalness: 0.2 })
      );
      padStripe.position.set(x + 0.65 * side, 1.22, 0);
      scene.add(padStripe);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.13, 0.13), poleMat);
      arm.position.set(x - 0.1 * side, 3.05, 0);
      arm.castShadow = true;
      scene.add(arm);

      const boardBracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.95, 1.55),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.35, wireframe: true })
      );
      boardBracket.position.set(x - 0.77 * side, 3.42, 0);
      scene.add(boardBracket);

      // Deformable vertex-animated braided nylon net
      const netObj = createDeformableNet(RIM_R);
      netObj.mesh.position.set(x - 1.2 * side, RIM_Y - 0.22, 0);
      scene.add(netObj.mesh);
      if (side > 0) rightNet = netObj;
      else leftNet = netObj;
    });

    // --- STADIUM BLEACHERS (TIERED CONCRETE RISERS & CHAIRS) ---
    const bleacherTierMat = new THREE.MeshStandardMaterial({ color: 0x242a35, roughness: 0.85 });
    const seatBackMat = new THREE.MeshStandardMaterial({ color: 0x131822, roughness: 0.6 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });

    // Side Bleachers (North & South sidelines)
    for (const side of [1, -1]) {
      for (let row = 0; row < 5; row++) {
        const stepY = 0.225 + row * 0.45;
        const stepZ = side * (8.6 + row * 0.75);

        // Concrete bleacher step tier
        const step = new THREE.Mesh(new THREE.BoxGeometry(COURT_W + 2, 0.45, 0.85), bleacherTierMat);
        step.position.set(0, stepY, stepZ);
        step.receiveShadow = true;
        scene.add(step);

        // Molded stadium seat backrests behind sitting fans
        const backrest = new THREE.Mesh(new THREE.BoxGeometry(COURT_W + 1.8, 0.32, 0.08), seatBackMat);
        backrest.position.set(0, stepY + 0.38, stepZ + 0.38 * side);
        scene.add(backrest);
      }

      // Safety rail in front of the bottom tier
      const rail = new THREE.Mesh(new THREE.BoxGeometry(COURT_W, 0.04, 0.04), railMat);
      rail.position.set(0, 0.75, side * 7.9);
      scene.add(rail);
    }

    // End Stands Bleachers (Behind East & West hoops)
    for (const side of [1, -1]) {
      for (let row = 0; row < 4; row++) {
        const stepY = 0.225 + row * 0.45;
        const stepX = side * (15.5 + row * 0.75);

        const step = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, COURT_H + 2), bleacherTierMat);
        step.position.set(stepX, stepY, 0);
        step.receiveShadow = true;
        scene.add(step);

        const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, COURT_H + 1.8), seatBackMat);
        backrest.position.set(stepX + 0.38 * side, stepY + 0.38, 0);
        scene.add(backrest);
      }
    }

    // Team Benches (Player chairs on court sideline with seat cushions)
    const benchHomeMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4 });
    const benchAwayMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.4 });
    for (let i = 0; i < 6; i++) {
      const chairH = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), benchHomeMat);
      chairH.position.set(-6 + i * 0.85, 0.225, 7.8);
      scene.add(chairH);

      const chairA = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), benchAwayMat);
      chairA.position.set(2 + i * 0.85, 0.225, 7.8);
      scene.add(chairA);
    }

    // --- LED COURTSIDE RIBBON BOARD, SCORER'S TABLE & OVERHEAD JUMBOTRON ---
    const createLedBannerTex = (cityName: string, primaryHex: string) => {
      const c = document.createElement("canvas");
      c.width = 1024;
      c.height = 128;
      const g = c.getContext("2d");
      if (g) {
        g.fillStyle = "#090c14";
        g.fillRect(0, 0, 1024, 128);
        g.fillStyle = primaryHex;
        g.fillRect(0, 0, 1024, 14);
        g.fillRect(0, 114, 1024, 14);
        g.fillStyle = "#f59e0b";
        g.font = "900 44px sans-serif";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(`APBA PRO  ·  ${cityName.toUpperCase()} ARENA  ·  WORLD TOUR`, 512, 66);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const ledBoardGroup = new THREE.Group();
    let ledBannerTex = createLedBannerTex(initialCity.name, initialCity.jerseyPrimary);
    const ledBannerMat = new THREE.MeshBasicMaterial({ map: ledBannerTex });
    const ledHousing = new THREE.Mesh(
      new THREE.BoxGeometry(COURT_W - 2, 0.56, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.6 })
    );
    ledHousing.position.set(0, 0.28, -8.02);
    ledBoardGroup.add(ledHousing);

    const ledFace = new THREE.Mesh(new THREE.PlaneGeometry(COURT_W - 2.2, 0.46), ledBannerMat);
    ledFace.position.set(0, 0.28, -7.93);
    ledBoardGroup.add(ledFace);

    // Midcourt Scorer's Table
    const scorerTable = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.78, 0.72),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5, metalness: 0.4 })
    );
    scorerTable.position.set(0, 0.39, -7.65);
    ledBoardGroup.add(scorerTable);

    const scorerApronMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialCity.jerseyPrimary),
      emissive: new THREE.Color(initialCity.jerseyPrimary),
      emissiveIntensity: 0.22,
      roughness: 0.35,
    });
    const scorerApron = new THREE.Mesh(new THREE.PlaneGeometry(4.1, 0.58), scorerApronMat);
    scorerApron.position.set(0, 0.4, -7.28);
    ledBoardGroup.add(scorerApron);

    for (const mx of [-1.2, 0, 1.2]) {
      const monitor = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.26, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.4, roughness: 0.2 })
      );
      monitor.position.set(mx, 0.91, -7.65);
      monitor.rotation.x = -0.25;
      ledBoardGroup.add(monitor);
    }
    scene.add(ledBoardGroup);

    // Overhead Arena Steel Roof Trusses & 4-Sided Center-Hung Jumbotron (y >= 9.2m)
    const arenaOverheadGroup = new THREE.Group();
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.78, roughness: 0.35 });
    for (const tx of [-12, -4, 4, 12]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.45, 22), trussMat);
      beam.position.set(tx, 12.2, 0);
      arenaOverheadGroup.add(beam);
      for (const lz of [-6, 0, 6]) {
        const lamp = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.12, 0.45),
          new THREE.MeshBasicMaterial({ color: 0xfff7ed })
        );
        lamp.position.set(tx, 11.9, lz);
        arenaOverheadGroup.add(lamp);
      }
    }

    const jumboGroup = new THREE.Group();
    jumboGroup.position.set(0, 9.65, 0);
    const jumboFrame = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 2.0, 4.6),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 })
    );
    jumboGroup.add(jumboFrame);

    const jumboRingTop = new THREE.Mesh(
      new THREE.BoxGeometry(4.85, 0.16, 4.85),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 0.45, metalness: 0.6, roughness: 0.3 })
    );
    jumboRingTop.position.y = 1.02;
    jumboGroup.add(jumboRingTop);

    const jumboScreenTex = (() => {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 256;
      const g = c.getContext("2d");
      if (g) {
        const grad = g.createLinearGradient(0, 0, 512, 256);
        grad.addColorStop(0, "#090d16");
        grad.addColorStop(0.5, "#111827");
        grad.addColorStop(1, "#090d16");
        g.fillStyle = grad;
        g.fillRect(0, 0, 512, 256);
        g.strokeStyle = "#f59e0b";
        g.lineWidth = 8;
        g.strokeRect(10, 10, 492, 236);
        g.fillStyle = "#fbbf24";
        g.font = "900 58px sans-serif";
        g.textAlign = "center";
        g.fillText("APBA PRO", 256, 104);
        g.fillStyle = "#38bdf8";
        g.font = "800 30px sans-serif";
        g.fillText("HOOPS MOVES · LIVE ARENA", 256, 165);
        g.fillStyle = "#e2e8f0";
        g.font = "700 20px sans-serif";
        g.fillText("WORLD TOUR CHAMPIONSHIP", 256, 208);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    })();
    const jumboScreenMat = new THREE.MeshBasicMaterial({ map: jumboScreenTex });
    [
      { pos: [0, 0, 2.32], rotY: 0 },
      { pos: [0, 0, -2.32], rotY: Math.PI },
      { pos: [2.32, 0, 0], rotY: Math.PI / 2 },
      { pos: [-2.32, 0, 0], rotY: -Math.PI / 2 },
    ].forEach((side) => {
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(4.1, 1.55), jumboScreenMat);
      scr.position.set(side.pos[0], side.pos[1], side.pos[2]);
      scr.rotation.y = side.rotY;
      jumboGroup.add(scr);
    });
    const cableGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.8, 8);
    [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]].forEach(([cx, cz]) => {
      const cable = new THREE.Mesh(cableGeo, trussMat);
      cable.position.set(cx, 1.9, cz);
      jumboGroup.add(cable);
    });
    arenaOverheadGroup.add(jumboGroup);
    scene.add(arenaOverheadGroup);

    // --- SEATED SPECTATORS IN BLEACHERS ---
    const crowdCount = 1200;
    // Seated spectator body shape (torso sitting on bleacher seat)
    const spectatorGeo = new THREE.BoxGeometry(0.34, 0.38, 0.32);
    const spectatorMat = new THREE.MeshStandardMaterial({ roughness: 0.75 });
    const crowdMesh = new THREE.InstancedMesh(spectatorGeo, spectatorMat, crowdCount);
    crowdMesh.castShadow = true;
    scene.add(crowdMesh);

    const crowdData: { pos: THREE.Vector3, color: THREE.Color, phase: number, baseScale: THREE.Vector3 }[] = [];
    const _dummy = new THREE.Object3D();
    const colors = [0x555555, 0x992222, 0x222299, 0x337733, 0xddaa44, 0x0284c7, 0xd97706];

    let idx = 0;
    // Side bleachers fans (Sitting directly on the bleacher steps)
    for (let side of [1, -1]) {
      for (let row = 0; row < 5; row++) {
        for (let x = -13; x <= 13; x += 0.65) {
          if (idx >= crowdCount) break;
          // Positioned sitting directly in their seat on the tier
          const pos = V(x + rnd(0.08), 0.55 + row * 0.45, side * (8.6 + row * 0.75 - 0.05 * side));
          const color = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
          crowdMesh.setColorAt(idx, color);
          crowdData.push({ pos, color, phase: Math.random() * Math.PI * 2, baseScale: V(1, 1, 1) });
          idx++;
        }
      }
    }
    // End stands bleachers fans
    for (let side of [1, -1]) {
      for (let row = 0; row < 4; row++) {
        for (let z = -6; z <= 6; z += 0.65) {
          if (idx >= crowdCount) break;
          const pos = V(side * (15.5 + row * 0.75 - 0.05 * side), 0.55 + row * 0.45, z + rnd(0.08));
          const color = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
          crowdMesh.setColorAt(idx, color);
          crowdData.push({ pos, color, phase: Math.random() * Math.PI * 2, baseScale: V(1, 1, 1) });
          idx++;
        }
      }
    }
    crowdMesh.count = idx;
    crowdMesh.instanceColor!.needsUpdate = true;

    // --- BALL (1024x512 Pebbled Leather + Recessed Channel Bump Map) ---
    function ballTexture(baseHex = "#e8681c", seamHex = "#161412", stampText = "WORLD TOUR") {
      const c = document.createElement("canvas");
      c.width = 1024;
      c.height = 512;
      const g = c.getContext("2d");
      if (!g) return null;

      const grad = g.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, baseHex);
      grad.addColorStop(0.5, baseHex);
      grad.addColorStop(1, baseHex);
      g.fillStyle = grad;
      g.fillRect(0, 0, 1024, 512);

      // Leather pebble grain dots
      for (let i = 0; i < 6500; i++) {
        const px = Math.random() * 1024;
        const py = Math.random() * 512;
        g.fillStyle = i % 2 === 0 ? "rgba(255, 185, 110, 0.16)" : "rgba(70, 20, 4, 0.18)";
        g.fillRect(px, py, 2, 2);
      }

      // Recessed rubber basketball channels
      g.strokeStyle = seamHex;
      g.lineWidth = 13;
      g.beginPath(); g.moveTo(0, 256); g.lineTo(1024, 256); g.stroke();
      g.beginPath(); g.moveTo(512, 0); g.lineTo(512, 512); g.stroke();
      g.beginPath(); g.arc(0, 256, 280, -1.12, 1.12); g.stroke();
      g.beginPath(); g.arc(1024, 256, 280, Math.PI - 1.12, Math.PI + 1.12); g.stroke();

      // Country custom basketball stamp
      g.fillStyle = "rgba(24, 16, 10, 0.85)";
      g.font = "900 24px sans-serif";
      g.textAlign = "center";
      g.fillText(stampText, 370, 198);
      g.font = "700 12px sans-serif";
      g.fillText("OFFICIAL INTERNATIONAL", 370, 220);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      return tex;
    }

    function ballBumpTexture() {
      const c = document.createElement("canvas");
      c.width = 1024;
      c.height = 512;
      const g = c.getContext("2d");
      if (!g) return null;
      g.fillStyle = "#9a9a9a";
      g.fillRect(0, 0, 1024, 512);
      for (let i = 0; i < 9000; i++) {
        g.fillStyle = i % 2 === 0 ? "#cfcfcf" : "#686868";
        g.fillRect(Math.random() * 1024, Math.random() * 512, 2, 2);
      }
      g.strokeStyle = "#121212";
      g.lineWidth = 15;
      g.beginPath(); g.moveTo(0, 256); g.lineTo(1024, 256); g.stroke();
      g.beginPath(); g.moveTo(512, 0); g.lineTo(512, 512); g.stroke();
      g.beginPath(); g.arc(0, 256, 280, -1.12, 1.12); g.stroke();
      g.beginPath(); g.arc(1024, 256, 280, Math.PI - 1.12, Math.PI + 1.12); g.stroke();
      return new THREE.CanvasTexture(c);
    }

    let ballColorTex = ballTexture();
    const ballBumpTex = ballBumpTexture();
    const ballMat = new THREE.MeshPhysicalMaterial({
      map: ballColorTex,
      bumpMap: ballBumpTex,
      bumpScale: 0.012,
      roughness: 0.4,
      metalness: 0.04,
      clearcoat: 0.24,
      clearcoatRoughness: 0.34,
    });
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(BALL_R, 36, 24),
      ballMat
    );
    ball.castShadow = true;
    ball.position.set(0, 2.1, 0);
    scene.add(ball);

    // --- ENTITIES (Detailed Player Meshes + Live Jersey Nameplates) ---
    const createJerseyPlateTexture = (
      jerseyNumber: string,
      lastName: string,
      jerseyHex: string,
      accentHex: string,
      isBack: boolean
    ) => {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 256;
      const g = c.getContext("2d");
      if (g) {
        g.clearRect(0, 0, 256, 256);
        // Pick crisp contrast ink against jersey luminance
        const col = new THREE.Color(jerseyHex);
        const lum = 0.299 * col.r + 0.587 * col.g + 0.114 * col.b;
        const ink = lum > 0.62 ? "#0f172a" : "#ffffff";
        const outline = lum > 0.62 ? "#ffffff" : accentHex;

        g.textAlign = "center";
        g.textBaseline = "middle";
        if (isBack) {
          g.fillStyle = ink;
          g.font = "900 30px sans-serif";
          g.fillText(lastName.toUpperCase().slice(0, 11), 128, 44);
          g.lineWidth = 8;
          g.strokeStyle = outline;
          g.font = "900 116px sans-serif";
          g.strokeText(jerseyNumber, 128, 148);
          g.fillStyle = ink;
          g.fillText(jerseyNumber, 128, 148);
        } else {
          g.fillStyle = accentHex;
          g.font = "900 22px sans-serif";
          g.fillText("APBA", 128, 46);
          g.lineWidth = 7;
          g.strokeStyle = outline;
          g.font = "900 94px sans-serif";
          g.strokeText(jerseyNumber, 128, 138);
          g.fillStyle = ink;
          g.fillText(jerseyNumber, 128, 138);
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const SKIN_PRESETS = [0x8d5524, 0xc68642, 0xf1c27d, 0x5c3818, 0xe0ac69];

    const jerseyBumpTex = createJerseyFabricBumpTexture();
    const contactShadowTex = createContactShadowTexture();

    function makeHuman(
      color: number,
      logoTex?: THREE.Texture,
      opts?: { jerseyNumber?: string; lastName?: string; hairStyle?: number; skinHex?: number; accentHex?: number; preset?: PlayerLikenessPreset }
    ) {
      const root = new THREE.Group();
      scene.add(root);
      const preset = opts?.preset ?? getLikenessPreset(opts?.lastName || "PLAYER", opts?.hairStyle ?? 0);
      const mat = (c: number, r = 0.6, m = 0.04) =>
        new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });

      const jerseyMat = createJerseyClothMaterial(color, opts?.accentHex ?? 0xf59e0b, jerseyBumpTex, false);
      const trimMat = mat(opts?.accentHex ?? 0xf59e0b, 0.45, 0.08);
      const skinMat = createSubsurfaceSkinMaterial(opts?.skinHex ?? preset.skinHex);
      const shortsMat = createJerseyClothMaterial(0x161616, opts?.accentHex ?? 0xf59e0b, jerseyBumpTex, true);
      const shoeMat = new THREE.MeshPhysicalMaterial({
        color: 0xf5f5f5,
        roughness: 0.24,
        metalness: 0.08,
        clearcoat: 0.65,
        clearcoatRoughness: 0.22,
      });
      const sockMat = mat(0xf8fafc, 0.72, 0.01);
      const soleMat = mat(0x18181b, 0.8, 0.02);
      const midsoleMat = mat(0xfefefe, 0.38, 0.04);

      const box = (w: number, h: number, d: number, m: THREE.Material, p: THREE.Object3D, x: number, y: number, z: number) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        p.add(mesh);
        return mesh;
      };
      const limb = (rTop: number, rBot: number, h: number, m: THREE.Material, p: THREE.Object3D, x: number, y: number, z: number) => {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 14), m);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        p.add(mesh);
        return mesh;
      };

      // Grounded radial contact shadow anchored directly to court surface
      const contactShadow = new THREE.Mesh(
        new THREE.PlaneGeometry(0.95, 0.95),
        new THREE.MeshBasicMaterial({ map: contactShadowTex, transparent: true, opacity: 0.75, depthWrite: false })
      );
      contactShadow.rotation.x = -Math.PI / 2;
      contactShadow.position.set(0, 0.014, 0);
      root.add(contactShadow);

      const pelvis = new THREE.Group();
      pelvis.position.y = 0.95;
      root.add(pelvis);
      // Tapered athletic shorts hip block + rounded glutes
      const pelvisMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.235, 0.3, 14), shortsMat);
      pelvisMesh.scale.set(1.06, 1, 0.68);
      pelvisMesh.castShadow = true;
      pelvis.add(pelvisMesh);
      const waistband = new THREE.Mesh(new THREE.CylinderGeometry(0.222, 0.222, 0.058, 14), trimMat);
      waistband.scale.set(1.06, 1, 0.69);
      waistband.position.set(0, 0.135, 0);
      pelvis.add(waistband);

      const torso = new THREE.Group();
      pelvis.add(torso);
      // Sculpted V-taper athletic chest + lats
      const chestMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.265, 0.215, 0.62, 16), jerseyMat);
      chestMesh.scale.set(1.02, 1, 0.62);
      chestMesh.position.set(0, 0.31, 0);
      chestMesh.castShadow = true;
      torso.add(chestMesh);
      // V-neck collar & side jersey piping
      box(0.22, 0.05, 0.295, trimMat, torso, 0, 0.605, 0);
      box(0.032, 0.56, 0.275, trimMat, torso, -0.242, 0.31, 0);
      box(0.032, 0.56, 0.275, trimMat, torso, 0.242, 0.31, 0);

      // Front & Back Jersey Number / Nameplate decals
      const numStr = opts?.jerseyNumber || "27";
      const lastStr = opts?.lastName || "PLAYER";
      const jerseyHexStr = `#${new THREE.Color(color).getHexString()}`;
      const accentHexStr = `#${new THREE.Color(opts?.accentHex ?? 0xf59e0b).getHexString()}`;
      const frontPlateTex = createJerseyPlateTexture(numStr, lastStr, jerseyHexStr, accentHexStr, false);
      const backPlateTex = createJerseyPlateTexture(numStr, lastStr, jerseyHexStr, accentHexStr, true);
      const frontPlateMat = new THREE.MeshBasicMaterial({ map: frontPlateTex, transparent: true });
      const backPlateMat = new THREE.MeshBasicMaterial({ map: backPlateTex, transparent: true });
      const frontPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.4), frontPlateMat);
      frontPlate.position.set(0, 0.34, 0.168);
      torso.add(frontPlate);
      const backPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.37, 0.44), backPlateMat);
      backPlate.position.set(0, 0.35, -0.168);
      backPlate.rotation.y = Math.PI;
      torso.add(backPlate);

      let logoMesh: THREE.Mesh | undefined;
      if (logoTex) {
        logoMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(0.11, 0.11),
          new THREE.MeshBasicMaterial({ map: logoTex, transparent: true })
        );
        logoMesh.position.set(0.15, 0.51, 0.17);
        torso.add(logoMesh);
      }

      // Neck & Detailed Sculpted Head + Likeness Hair + Facial Morph Rig
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.072, 0.13, 12), skinMat);
      neck.position.set(0, 0.66, 0);
      torso.add(neck);

      const headGroup = new THREE.Group();
      headGroup.position.y = 0.8;
      torso.add(headGroup);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.134, 22, 18), skinMat);
      head.scale.set(0.95, 1.06, 1.0);
      head.castShadow = true;
      headGroup.add(head);

      const eyeWhiteMat = mat(0xf8fafc, 0.25);
      const pupilMat = mat(0x0f172a, 0.15);
      [-0.044, 0.044].forEach((ex) => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.017, 10, 8), eyeWhiteMat);
        eye.position.set(ex, 0.018, 0.118);
        headGroup.add(eye);
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), pupilMat);
        pupil.position.set(ex, 0.018, 0.131);
        headGroup.add(pupil);
      });
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.017, 0.042, 6), skinMat);
      nose.rotation.x = Math.PI * 0.16;
      nose.position.set(0, -0.004, 0.132);
      headGroup.add(nose);
      [-0.128, 0.128].forEach((earX) => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), skinMat);
        ear.scale.set(0.5, 1.05, 0.75);
        ear.position.set(earX, 0, -0.005);
        headGroup.add(ear);
      });

      const hairColorHex = preset.hairHex ?? 0x151210;
      const hairGroup = buildStrandHairGroup(preset.hairStyle, hairColorHex);
      headGroup.add(hairGroup);

      const facialRig = attachFacialExpressionRig(headGroup, skinMat, hairColorHex, preset.facialHair);

      // Headband accessory mesh
      const headbandMat = mat(0xffffff, 0.5);
      const headbandMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.138, 0.138, 0.044, 22), headbandMat);
      headbandMesh.position.y = 0.84;
      torso.add(headbandMesh);
      headbandMesh.visible = Boolean(preset.headband);

      const legs: any = {}, arms: any = {}, hands: any = {};
      [["R", -1], ["L", 1]].forEach(([key, side]: any) => {
        const hip = new THREE.Group();
        hip.position.set(side * 0.13, -0.05, 0);
        pelvis.add(hip);
        // Sculpted shorts thigh & trim stripe
        limb(0.112, 0.095, 0.44, shortsMat, hip, 0, -0.22, 0);
        box(0.02, 0.4, 0.11, trimMat, hip, side * 0.1, -0.22, 0);

        const knee = new THREE.Group();
        knee.position.y = -0.44;
        hip.add(knee);
        // Anatomical knee cap & tapered athletic calf
        const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.072, 12, 10), skinMat);
        kneeCap.position.set(0, -0.01, 0.01);
        knee.add(kneeCap);
        limb(0.086, 0.062, 0.34, skinMat, knee, 0, -0.17, 0);
        // Crew basketball socks
        limb(0.068, 0.064, 0.115, sockMat, knee, 0, -0.38, 0);
        // Articulated Ankle Joint + Multi-part Contoured High-Top Sneaker
        const ankle = new THREE.Group();
        ankle.position.y = -0.455;
        knee.add(ankle);
        box(0.204, 0.024, 0.32, soleMat, ankle, 0, -0.035, 0.052);
        box(0.2, 0.028, 0.31, midsoleMat, ankle, 0, -0.013, 0.05);
        const upperShoe = new THREE.Mesh(new THREE.CapsuleGeometry(0.082, 0.135, 6, 12), shoeMat);
        upperShoe.rotation.x = Math.PI / 2;
        upperShoe.scale.set(1.06, 1.0, 0.68);
        upperShoe.position.set(0, 0.026, 0.055);
        upperShoe.castShadow = true;
        ankle.add(upperShoe);
        box(0.185, 0.055, 0.12, trimMat, ankle, 0, 0.042, -0.028);
        box(0.018, 0.032, 0.16, trimMat, ankle, side * 0.092, 0.029, 0.05);
        legs[key] = { hip, knee, ankle };
      });

      [["R", -1], ["L", 1]].forEach(([key, side]: any) => {
        const sh = new THREE.Group();
        sh.position.set(side * 0.32, 0.55, 0);
        torso.add(sh);
        // Rounded deltoid cap + muscular bicep
        const delt = new THREE.Mesh(new THREE.SphereGeometry(0.082, 12, 10), skinMat);
        delt.position.set(0, -0.02, 0);
        delt.castShadow = true;
        sh.add(delt);
        const jerseyShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.16), trimMat);
        jerseyShoulder.position.set(-side * 0.045, 0.02, 0);
        sh.add(jerseyShoulder);
        limb(0.072, 0.06, 0.3, skinMat, sh, 0, -0.2, 0);

        const el = new THREE.Group();
        el.position.y = -0.36;
        sh.add(el);
        const elJoint = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 8), skinMat);
        el.add(elJoint);
        const hasSleeve = preset.sleeveArm ? preset.sleeveArm === key : key === "R";
        limb(0.058, 0.046, 0.33, hasSleeve ? trimMat : skinMat, el, 0, -0.17, 0);
        limb(0.052, 0.052, 0.052, trimMat, el, 0, -0.3, 0);

        const hand = new THREE.Group();
        hand.position.y = -0.34;
        el.add(hand);
        const palm = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 8), skinMat);
        palm.scale.set(0.95, 0.72, 1.15);
        palm.position.set(0, -0.035, 0.025);
        hand.add(palm);
        arms[key] = { sh, el };
        hands[key] = hand;
      });
      return {
        root,
        pelvis,
        torso,
        headGroup,
        legs,
        arms,
        hands,
        jerseyMat,
        trimMat,
        skinMat,
        shortsMat,
        shoeMat,
        headbandMat,
        headbandMesh,
        logoMesh,
        frontPlateMat,
        backPlateMat,
        facialRig,
        contactShadow,
        jerseyNumber: numStr,
        lastName: lastStr,
      };
    }

    const updateEntityJerseyPlates = (
      p: GameEntity,
      jerseyHex: string,
      accentHex: string,
      jerseyNumber: string,
      lastName: string
    ) => {
      p.jerseyNumber = jerseyNumber;
      p.lastName = lastName;
      if (p.trimMat) {
        p.trimMat.color.setStyle(accentHex);
        p.trimMat.needsUpdate = true;
      }
      if (p.frontPlateMat) {
        const old = p.frontPlateMat.map;
        p.frontPlateMat.map = createJerseyPlateTexture(jerseyNumber, lastName, jerseyHex, accentHex, false);
        p.frontPlateMat.needsUpdate = true;
        old?.dispose();
      }
      if (p.backPlateMat) {
        const old = p.backPlateMat.map;
        p.backPlateMat.map = createJerseyPlateTexture(jerseyNumber, lastName, jerseyHex, accentHex, true);
        p.backPlateMat.needsUpdate = true;
        old?.dispose();
      }
    };

    interface EntityDefenseState {
      stanceActive: boolean;
      stanceT: number;
      shadingSide: number;
      shadingT: number;
      handCheckT: number;
      hipRideT: number;
      hipRideTarget: GameEntity | null;
      contestT: number;
      contestLevel: number;
      verticalWallT: number;
      chargePlantedT: number;
      pullChairWindowT: number;
      pullChairKind: "perimeter" | "post" | null;
      boxOutT: number;
      passLaneHunterT: number;
      passLaneMode: "intercept" | "deflect";
      stumbleT: number;
      matchupIdx: number;
      recoverTarget: { x: number; z: number } | null;
      aiMoveCoolT?: number;
      activeAiDefMove?: DefenseMove;
      gloveRipT?: number;
      volleySwatT?: number;
      cutoffClampT?: number;
    }

    interface EntityOffenseState {
      tripleThreatActive: boolean;
      tripleThreatT: number;
      hostageT: number;
      hostageTarget: GameEntity | null;
      postSealT: number;
      reboundBoostT: number;
      cutActionT: number;
      openWaveT: number;
    }

    interface GameEntity {
      root: THREE.Group; pelvis: THREE.Group; torso: THREE.Group; headGroup: THREE.Group; legs: any; arms: any; hands: any;
      name: string; isUser: boolean; vel: THREE.Vector3; h: number; vy: number; hand: "R"|"L"; dribPhase: number; runPhase: number; spin: number; faceYaw: number;
      act: any; holdT: number; shield: boolean; cur: any; squeak?: any;
      stamina: number;
      maxStamina: number;
      currentStamina: number;
      isExhausted: boolean;
      exhaustionTimer: number;
      bumpCoolT: number;
      hypeT: number;
      landingT?: number;
      stats: { pts: number, ast: number, reb: number, fouls: number };
      pos: string;
      isBench: boolean;
      defState: EntityDefenseState;
      offState: EntityOffenseState;
      logoMesh?: THREE.Mesh;
      jerseyMat: THREE.MeshPhysicalMaterial;
      trimMat: THREE.MeshStandardMaterial;
      skinMat: THREE.MeshPhysicalMaterial;
      shortsMat: THREE.MeshPhysicalMaterial;
      shoeMat: THREE.MeshPhysicalMaterial;
      headbandMat: THREE.MeshStandardMaterial;
      headbandMesh: THREE.Mesh;
      frontPlateMat?: THREE.MeshBasicMaterial;
      backPlateMat?: THREE.MeshBasicMaterial;
      facialRig?: FacialRig;
      contactShadow?: THREE.Mesh;
      jerseyNumber: string;
      lastName: string;
    }

    const loader = new THREE.TextureLoader();
    const loadProcessedTexture = (url: string) => {
      const tex = new THREE.Texture();
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < data.data.length; i += 4) {
            const r = data.data[i], g = data.data[i+1], b = data.data[i+2];
            if (r > 235 && g > 235 && b > 235) data.data[i+3] = 0;
          }
          ctx.putImageData(data, 0, 0);
          tex.image = canvas;
          tex.needsUpdate = true;
        }
      };
      return tex;
    };

    const homeLogoTex = loadProcessedTexture("/assets/logos/home_team_logo_1794490855434.jpg");
    const awayLogoTex = loadProcessedTexture("/assets/logos/away_team_logo_1794490855181.jpg");

    // --- CENTER COURT LOGO ---
    const centerLogo = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 5),
      new THREE.MeshBasicMaterial({ map: homeLogoTex, transparent: true, opacity: 0.72, depthWrite: false })
    );
    centerLogo.rotation.x = -Math.PI / 2;
    centerLogo.position.set(0, 0.015, 0);
    scene.add(centerLogo);

    let entitySpawnIdx = 0;
    function makeEntity(
      color: number,
      x: number,
      z: number,
      name: string,
      pos: string,
      logoTex: THREE.Texture,
      isUser = false,
      isBench = false,
      jerseyNum?: string
    ): GameEntity {
      const idxSeed = entitySpawnIdx++;
      const lastToken = name.split(" ")[0].replace(/#\d+/, "").trim() || "PLAYER";
      const preset = getLikenessPreset(name, idxSeed);
      const H = makeHuman(color, logoTex, {
        jerseyNumber: jerseyNum || String(((idxSeed * 7 + 3) % 90) + 1),
        lastName: lastToken,
        hairStyle: idxSeed % 5,
        skinHex: preset.skinHex,
        accentHex: color === 0xc8102e ? 0xf59e0b : 0x38bdf8,
        preset,
      });
      H.root.position.set(x, 0, z);
      if (!isUser) {
        H.root.scale.set(preset.buildScale, preset.heightScale, preset.buildScale);
      }
      if (isBench) H.root.visible = false;
      return {
        ...H,
        name,
        pos,
        isUser,
        isBench,
        vel: V(),
        h: 0,
        vy: 0,
        hand: "R" as "R"|"L",
        dribPhase: 0,
        runPhase: 0,
        spin: 0,
        faceYaw: 0,
        act: null as any,
        holdT: 0,
        shield: false,
        stamina: 1,
        maxStamina: 100,
        currentStamina: 100,
        isExhausted: false,
        exhaustionTimer: 0,
        bumpCoolT: 0,
        hypeT: 0,
        cur: { shR: -0.25, elR: -0.5, shL: -0.25, elL: -0.5, hipR: 0, kneeR: 0.05, hipL: 0, kneeL: 0.05, lean: 0, crouch: 0, ankR: 0, ankL: 0, hipRollR: 0, hipRollL: 0, shRollR: 0, shRollL: 0, twist: 0, pelvYaw: 0, pelvRoll: 0, bob: 0 },
        stats: { pts: 0, ast: 0, reb: 0, fouls: 0 },
        defState: {
          stanceActive: false,
          stanceT: 0,
          shadingSide: 1,
          shadingT: 0,
          handCheckT: 0,
          hipRideT: 0,
          hipRideTarget: null,
          contestT: 0,
          contestLevel: 0,
          verticalWallT: 0,
          chargePlantedT: 0,
          pullChairWindowT: 0,
          pullChairKind: null,
          boxOutT: 0,
          passLaneHunterT: 0,
          passLaneMode: "deflect",
          stumbleT: 0,
          matchupIdx: idxSeed % 5,
          recoverTarget: null,
          aiMoveCoolT: 0,
          gloveRipT: 0,
          volleySwatT: 0,
          cutoffClampT: 0,
        },
        offState: {
          tripleThreatActive: false,
          tripleThreatT: 0,
          hostageT: 0,
          hostageTarget: null,
          postSealT: 0,
          reboundBoostT: 0,
          cutActionT: 0,
          openWaveT: 0,
        },
        jerseyMat: H.jerseyMat,
        trimMat: H.trimMat,
        skinMat: H.skinMat,
        shortsMat: H.shortsMat,
        shoeMat: H.shoeMat,
        headbandMat: H.headbandMat,
        headbandMesh: H.headbandMesh,
        facialRig: H.facialRig,
        contactShadow: H.contactShadow,
      };
    }

    const initialAthlete = athleteProfileRef.current;
    const ME = makeEntity(0xc8102e, -10, 0, `${initialAthlete.firstName} ${initialAthlete.lastName} #${initialAthlete.jerseyNumber}`, initialAthlete.position, homeLogoTex, true, false, String(initialAthlete.jerseyNumber));
    const teamA: GameEntity[] = [
      ME, 
      makeEntity(0xc8102e, -8, 4, "Johnson", "SG", homeLogoTex, false, false, "11"), 
      makeEntity(0xc8102e, -8, -4, "Miller", "SF", homeLogoTex, false, false, "22"), 
      makeEntity(0xc8102e, -4, 5, "Davis", "PF", homeLogoTex, false, false, "3"), 
      makeEntity(0xc8102e, -4, -5, "Thompson", "C", homeLogoTex, false, false, "33"),
      // Bench
      makeEntity(0xc8102e, 0, 0, "White", "PG", homeLogoTex, false, true, "9"),
      makeEntity(0xc8102e, 0, 0, "Green", "SG", homeLogoTex, false, true, "14"),
      makeEntity(0xc8102e, 0, 0, "Black", "SF", homeLogoTex, false, true, "21"),
      makeEntity(0xc8102e, 0, 0, "Brown", "PF", homeLogoTex, false, true, "7"),
      makeEntity(0xc8102e, 0, 0, "Taylor", "C", homeLogoTex, false, true, "44"),
    ];
    const teamB: GameEntity[] = [
      makeEntity(0x1d428a, 10, 0, "Jordan", "SG", awayLogoTex, false, false, "23"), 
      makeEntity(0x1d428a, 8, 4, "Bryant", "SF", awayLogoTex, false, false, "24"), 
      makeEntity(0x1d428a, 8, -4, "James", "PF", awayLogoTex, false, false, "6"), 
      makeEntity(0x1d428a, 4, 5, "Curry", "PG", awayLogoTex, false, false, "30"), 
      makeEntity(0x1d428a, 4, -5, "Durant", "C", awayLogoTex, false, false, "35"),
      // Bench
      makeEntity(0x1d428a, 0, 0, "O'Neal", "C", awayLogoTex, false, true, "34"),
      makeEntity(0x1d428a, 0, 0, "Bird", "SF", awayLogoTex, false, true, "33"),
      makeEntity(0x1d428a, 0, 0, "Magic", "PG", awayLogoTex, false, true, "32"),
      makeEntity(0x1d428a, 0, 0, "Barkley", "PF", awayLogoTex, false, true, "34"),
      makeEntity(0x1d428a, 0, 0, "Pippen", "SG", awayLogoTex, false, true, "33"),
    ];
    const entities: GameEntity[] = [...teamA, ...teamB];

    // Active User Ground Team Ring Indicator
    const playerGroundRing = new THREE.Mesh(
      new THREE.RingGeometry(0.46, 0.58, 32),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    playerGroundRing.rotation.x = -Math.PI / 2;
    playerGroundRing.position.set(ME.root.position.x, 0.025, ME.root.position.z);
    scene.add(playerGroundRing);

    // Seat reserve bench players on sideline chairs in realistic seated postures
    teamA.slice(5).forEach((p, i) => {
      p.root.position.set(-6 + i * 0.85, 0.15, 7.8);
      p.root.visible = true;
      p.pelvis.position.y = 0.5;
      p.legs.R.hip.rotation.x = -1.4;
      p.legs.L.hip.rotation.x = -1.4;
      p.legs.R.knee.rotation.x = 1.4;
      p.legs.L.knee.rotation.x = 1.4;
    });
    teamB.slice(5).forEach((p, i) => {
      p.root.position.set(2 + i * 0.85, 0.15, 7.8);
      p.root.visible = true;
      p.pelvis.position.y = 0.5;
      p.legs.R.hip.rotation.x = -1.4;
      p.legs.L.hip.rotation.x = -1.4;
      p.legs.R.knee.rotation.x = 1.4;
      p.legs.L.knee.rotation.x = 1.4;
    });

    setTeamARoster([...teamA]);

    // --- APPLY CAREER CUSTOMIZATION TO 3D PLAYERS ---
    const applyCustomization = (prog: CareerStats) => {
      const jersey = JERSEY_ITEMS.find((j) => j.id === prog.equippedJersey) || JERSEY_ITEMS[0];
      const kicks = SNEAKER_ITEMS.find((s) => s.id === prog.equippedSneakers) || SNEAKER_ITEMS[0];
      const headband = HEADBAND_ITEMS.find((h) => h.id === prog.equippedHeadband) || HEADBAND_ITEMS[0];

      // Update team jersey colors for Home Team
      teamA.forEach((p) => {
        if (p.jerseyMat) {
          p.jerseyMat.color.setStyle(jersey.colorHex);
          p.jerseyMat.needsUpdate = true;
        }
        if (p !== ME) {
          updateEntityJerseyPlates(p, jersey.colorHex, "#f59e0b", p.jerseyNumber, p.lastName);
        }
      });

      // Update user player's sneakers
      if (ME.shoeMat) {
        ME.shoeMat.color.setStyle(kicks.colorHex);
        ME.shoeMat.needsUpdate = true;
      }

      // Update user player's headband
      if (ME.headbandMesh && ME.headbandMat) {
        if (headband.id === "acc_none") {
          ME.headbandMesh.visible = false;
        } else {
          ME.headbandMesh.visible = true;
          ME.headbandMat.color.setStyle(headband.colorHex);
          ME.headbandMat.needsUpdate = true;
        }
      }
    };

    // --- APPLY CREATED ATHLETE PROFILE TO 3D USER PLAYER ---
    const applyAthleteProfile = (prof: AthleteProfile) => {
      ME.name = `${prof.firstName} ${prof.lastName} #${prof.jerseyNumber}`;
      ME.pos = prof.position;
      const scaleY = prof.heightInches / 75;
      ME.root.scale.set(0.96 + (scaleY - 1) * 0.45, scaleY, 0.96 + (scaleY - 1) * 0.45);
      if (ME.skinMat) {
        ME.skinMat.color.setStyle(prof.skinToneHex);
        ME.skinMat.needsUpdate = true;
      }
      if (ME.jerseyMat) {
        ME.jerseyMat.color.setStyle(prof.jerseyColorHex);
        ME.jerseyMat.needsUpdate = true;
      }
      if (ME.shortsMat) {
        ME.shortsMat.color.setStyle(prof.shortsColorHex);
        ME.shortsMat.needsUpdate = true;
      }
      if (ME.shoeMat) {
        ME.shoeMat.color.setStyle(prof.shoeColorHex);
        ME.shoeMat.needsUpdate = true;
      }
      if (ME.headbandMesh && ME.headbandMat) {
        ME.headbandMesh.visible = prof.headbandEnabled;
        if (prof.headbandEnabled) {
          ME.headbandMat.color.setStyle(prof.headbandColorHex);
          ME.headbandMat.needsUpdate = true;
        }
      }
      updateEntityJerseyPlates(
        ME,
        prof.jerseyColorHex,
        prof.headbandEnabled ? prof.headbandColorHex : "#f59e0b",
        String(prof.jerseyNumber),
        prof.lastName
      );
      setTeamARoster([...teamA]);
    };

    // --- APPLY STUDIO CUSTOMIZATION (JERSEYS, BALL SKINS, WOOD, LIGHTING) ---
    let lastAppliedWoodTone = "";
    let lastAppliedBallDesign = "";
    const applyStudioCustomToScene = (custom: StudioCustomization) => {
      studioCustomRef.current = custom;

      // Team A Uniforms
      teamA.forEach((p) => {
        if (p.jerseyMat) {
          p.jerseyMat.color.setStyle(custom.primaryColor);
          p.jerseyMat.needsUpdate = true;
        }
        if (p.shortsMat) {
          p.shortsMat.color.setStyle(custom.secondaryColor);
          p.shortsMat.needsUpdate = true;
        }
        if (p.trimMat) {
          p.trimMat.color.setStyle(custom.trimColor);
          p.trimMat.needsUpdate = true;
        }
        if (p.shoeMat) {
          p.shoeMat.color.setStyle(custom.shoePrimaryColor);
          p.shoeMat.needsUpdate = true;
        }
        updateEntityJerseyPlates(
          p,
          custom.primaryColor,
          custom.secondaryColor,
          p === ME ? String(athleteProfileRef.current.jerseyNumber) : p.jerseyNumber,
          p === ME ? athleteProfileRef.current.lastName : p.lastName
        );
      });

      // Court Apron & Paint
      if (apronMat && gameModeRef.current !== "streetball") {
        apronMat.color.setStyle(custom.apronColor);
        apronMat.needsUpdate = true;
      }
      if (keyMat) {
        keyMat.color.setStyle(custom.keyPaintColor);
        keyMat.needsUpdate = true;
      }

      // Hardwood Tone Texture Update (rebuilds only when tone changes)
      if (custom.woodTone !== lastAppliedWoodTone && gameModeRef.current !== "streetball") {
        lastAppliedWoodTone = custom.woodTone;
        const wood = WOOD_TONE_PRESETS.find((w) => w.id === custom.woodTone) || WOOD_TONE_PRESETS[0];
        const nextFloorTex = createWoodgrainTexture(wood.lightHex, wood.darkHex);
        if (nextFloorTex) {
          const oldTex = floorTex;
          floorTex = nextFloorTex;
          floorMat.map = floorTex;
          floorMat.needsUpdate = true;
          oldTex?.dispose();
        }
      }

      // Basketball Skin Update
      const ballSkin = BALL_DESIGNS.find((b) => b.id === custom.ballDesign) || BALL_DESIGNS[0];
      ballMat.roughness = ballSkin.roughness;
      ballMat.metalness = ballSkin.metalness;
      if (custom.ballDesign !== lastAppliedBallDesign) {
        lastAppliedBallDesign = custom.ballDesign;
        const nextBallTex = ballTexture(ballSkin.baseHex, ballSkin.seamHex);
        if (nextBallTex) {
          const oldBallTex = ballColorTex;
          ballColorTex = nextBallTex;
          ballMat.map = ballColorTex;
          oldBallTex?.dispose();
        }
      }
      ballMat.needsUpdate = true;

      // Arena Lighting Mood & Night Games Everywhere
      const mood = LIGHTING_MOOD_PRESETS.find((m) => m.id === custom.lightingMood) || LIGHTING_MOOD_PRESETS[0];
      ambientLight.color.setStyle(mood.ambientHex);
      ambientLight.intensity = mood.ambientIntensity;
      arenaSpot.intensity = mood.keyIntensity;
      applyArenaLighting(currentCity, custom);
    };

    // Apply initially equipped items & athlete build on startup
    applyCustomization(loadCareerStats());
    applyAthleteProfile(athleteProfileRef.current);

    // --- STATE ---
    const state = {
      owner: null as any, ballMode: "held" as any, flight: null as any, 
      scoreHome: 0, scoreAway: 0, shotClock: 24, 
      gameClock: quarterLengthRef.current, simClock: 0, shotFeedbackTimer: 0, quarter: 1, isGameOver: false,
      isPaused: false, pauseT: 0,
      crowdCheer: 0,
      lastPasser: null as GameEntity | null,
      lastPassTime: 0,
      hadRimContact: false,
      deadT: 0,
      deadReason: null as "score" | "foul" | null,
      lastScoringTeam: null as "Home" | "Away" | null,
      fastTransitionT: 0,
      prevPossessionTeam: null as "Home" | "Away" | null,
      looseT: 0, lbUsed: false, rbUsed: false, stealGraceT: 0, ballVel: V(),
      ballStallT: 0, ballStallX: 0, ballStallZ: 0, tripleBreakT: 0,
      backcourtClock: 0, closelyGuardedClock: 0, backcourtTeam: null as "Home" | "Away" | null,
      keys: {} as any, prevKeys: {} as any, joystick: { x: 0, y: 0, active: false, autoSprint: false }, 
      touchButtons: {} as any, touchPulses: {} as Record<string, boolean>, rightStickCoolT: 0,
      isDefending: false, uiDefenseToggle: false, lastTime: performance.now(), camLook: V(0, 1.4, 0)
    };

    // --- HELPERS ---
    const fwd = (P: any) => { const hoopX = teamA.includes(P) ? HOOP_X : -HOOP_X; const v = V(hoopX - P.root.position.x, 0, -P.root.position.z); return v.lengthSq() < 1e-6 ? V(1, 0, 0) : v.normalize(); };
    const rightOf = (P: any) => { const f = fwd(P); return V(-f.z, 0, f.x); };
    const torsoPos = (P: any) => V(P.root.position.x, P.h + 1.2, P.root.position.z);
    const handPos = (P: any) => P.hands[P.hand].getWorldPosition(V());
    const isNearHoop = (pos: THREE.Vector3) =>
      Math.hypot(pos.x - HOOP_X, pos.z) < 3.0 || Math.hypot(pos.x + HOOP_X, pos.z) < 3.0;
    const MOVEMENT_SETTINGS = {
      moveSpeed: 6.2,
      defenseMoveSpeed: 3.65,
      sprintMultiplier: 1.45,
      rotationSpeed: 15,
      fixedStep: 1 / 60,
    };
    const STAMINA_SETTINGS = {
      maxStamina: 100,
      staminaDrainRate: 25,
      staminaRecoveryRate: 20,
      exhaustionRecoveryDelay: 1.5,
      exhaustedSpeedMultiplier: 0.78,
    };
    const getStaminaNormalized = (P: GameEntity): number =>
      P.maxStamina > 0 ? clamp(P.currentStamina / P.maxStamina, 0, 1) : 0;
    const resetEntityStamina = (P: GameEntity) => {
      P.maxStamina = STAMINA_SETTINGS.maxStamina;
      P.currentStamina = STAMINA_SETTINGS.maxStamina;
      P.isExhausted = false;
      P.exhaustionTimer = 0;
      P.stamina = 1;
    };
    const consumeStamina = (P: GameEntity, wantsToSprint: boolean, dt: number): boolean => {
      if (P.isExhausted) {
        wantsToSprint = false;
        P.exhaustionTimer -= dt;
        if (P.exhaustionTimer <= 0) {
          P.isExhausted = false;
          P.exhaustionTimer = 0;
        }
      }
      if (wantsToSprint && P.currentStamina > 0) {
        P.currentStamina = Math.max(0, P.currentStamina - STAMINA_SETTINGS.staminaDrainRate * dt);
        P.stamina = getStaminaNormalized(P);
        if (P.currentStamina <= 0) {
          P.isExhausted = true;
          P.exhaustionTimer = STAMINA_SETTINGS.exhaustionRecoveryDelay;
          if (P.isUser) {
            triggerLabel("EXHAUSTED! SPEED PENALIZED");
          }
        }
        return true;
      }
      P.stamina = getStaminaNormalized(P);
      return false;
    };
    const handleStaminaRecovery = (P: GameEntity, isActivelySprinting: boolean, dt: number) => {
      if (!P.isExhausted && !isActivelySprinting && P.currentStamina < P.maxStamina) {
        P.currentStamina = Math.min(P.maxStamina, P.currentStamina + STAMINA_SETTINGS.staminaRecoveryRate * dt);
      }
      P.stamina = getStaminaNormalized(P);
    };
    const avoidStanchions = (P: any) => {
      for (const sx of [HOOP_X + 0.95, -HOOP_X - 0.95]) {
        const dx = P.root.position.x - sx;
        const dz = P.root.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.78) {
          const nx = dist > 0.01 ? dx / dist : sx > 0 ? -1 : 1;
          const nz = dist > 0.01 ? dz / dist : 0;
          P.root.position.x = clamp(sx + nx * 0.8, -13.65, 13.65);
          P.root.position.z = clamp(nz * 0.8, -7.15, 7.15);
          // Project inward velocity onto tangent for clean collision sliding around stanchions
          const vn = P.vel.x * nx + P.vel.z * nz;
          if (vn < 0) {
            P.vel.x -= vn * nx;
            P.vel.z -= vn * nz;
          }
        }
      }
    };
    const slideBoundaries = (P: any) => {
      const nextX = clamp(P.root.position.x, -13.85, 13.85);
      const nextZ = clamp(P.root.position.z, -7.35, 7.35);
      if (nextX !== P.root.position.x) {
        if ((nextX <= -13.85 && P.vel.x < 0) || (nextX >= 13.85 && P.vel.x > 0)) P.vel.x = 0;
        P.root.position.x = nextX;
      }
      if (nextZ !== P.root.position.z) {
        if ((nextZ <= -7.35 && P.vel.z < 0) || (nextZ >= 7.35 && P.vel.z > 0)) P.vel.z = 0;
        P.root.position.z = nextZ;
      }
    };
    const applyVel = (P: any, want: THREE.Vector3, dt: number) => {
      if (!Number.isFinite(P.root.position.x)) P.root.position.x = 0;
      if (!Number.isFinite(P.root.position.z)) P.root.position.z = 0;
      if (!Number.isFinite(P.vel.x) || !Number.isFinite(P.vel.z)) P.vel.set(0, 0, 0);

      // Freeze pitch/roll rotation so player rigidbody never tips over on contact
      P.root.rotation.x = 0;
      P.root.rotation.z = 0;

      if (P.act && (!Number.isFinite(P.act.t) || P.act.t >= P.act.dur || P.act.t > 1.75)) {
        if (P.act.end) P.act.end();
        P.act = null;
        P.shield = false;
      }

      if (P.bumpCoolT > 0) P.bumpCoolT = Math.max(0, P.bumpCoolT - dt);
      const curSp = Math.hypot(P.vel.x, P.vel.z);
      const wantSp = Math.hypot(want.x, want.z);
      if (!P.isUser) {
        const aiWantsSprint = wantSp > 7.2 && curSp > 6.4;
        const aiCanSprint = consumeStamina(P, aiWantsSprint, dt);
        handleStaminaRecovery(P, aiCanSprint, dt);
      }

      // Fixed-timestep continuous substeps to guarantee buttery-smooth motion & prevent fast-sprint tunneling
      const fixedDt = MOVEMENT_SETTINGS.fixedStep;
      const steps = Math.max(1, Math.min(4, Math.ceil(dt / fixedDt)));
      const subDt = dt / steps;

      for (let s = 0; s < steps; s++) {
        if (P.act && P.act.lock) {
          // Carry decaying horizontal momentum during shots/dunks/step-backs
          const drag = P.act.released ? 10 : 4.5;
          P.vel.multiplyScalar(Math.exp(-drag * subDt));
        } else {
          // Foot-plant sliding friction when braking abruptly from high speed or cutting hard across the hardwood
          const dotVel = curSp > 0.5 && wantSp > 0.5 ? (P.vel.x * want.x + P.vel.z * want.z) / (curSp * wantSp) : 1;
          const isStoppingOrCutting = want.lengthSq() < 0.01 || dotVel < 0.35;
          const isHighSpeedPlant = curSp > 4.2 && isStoppingOrCutting;
          const responseRate = isHighSpeedPlant
            ? (P.isUser ? 14.5 : 13.5)
            : P.isUser
              ? (isStoppingOrCutting ? 24 : 22)
              : (isStoppingOrCutting ? 21 : 17);
          P.vel.lerp(want, 1 - Math.exp(-responseRate * subDt));
        }
        P.root.position.x += P.vel.x * subDt;
        P.root.position.z += P.vel.z * subDt;
        slideBoundaries(P);
        avoidStanchions(P);
      }
    };
    const _aiWant = V();
    const aiSteer = (P: any, tx: number, tz: number, sp: number, dt: number) => {
      const clampedX = clamp(tx, -13.45, 13.45);
      const clampedZ = clamp(tz, -7.05, 7.05);
      const dx = clampedX - P.root.position.x;
      const dz = clampedZ - P.root.position.z;
      const d = Math.hypot(dx, dz);
      const s = Math.min(sp, d * 6.0);

      if (!P._stuck) {
        P._stuck = { lastX: P.root.position.x, lastZ: P.root.position.z, stuckT: 0, bypassT: 0, side: 1 };
      }
      const st = P._stuck;
      const moved = Math.hypot(P.root.position.x - st.lastX, P.root.position.z - st.lastZ);
      st.lastX = P.root.position.x;
      st.lastZ = P.root.position.z;

      if (d > 0.55 && sp > 1.2 && (!P.act || !P.act.lock)) {
        if (moved < Math.max(0.008, sp * dt * 0.18)) {
          st.stuckT += dt;
          if (st.stuckT > 0.22) {
            st.stuckT = 0;
            st.bypassT = 0.55;
            st.side = -st.side;
          }
        } else {
          st.stuckT = Math.max(0, st.stuckT - dt * 1.6);
        }
      } else {
        st.stuckT = 0;
      }

      if (d > 0.04) {
        const nx = dx / d;
        const nz = dz / d;
        if (st.bypassT > 0) {
          st.bypassT = Math.max(0, st.bypassT - dt);
          // Blend strong orthogonal sidestep around blocking players/stanchions
          const ox = -nz * st.side;
          const oz = nx * st.side;
          _aiWant.set((nx * 0.4 + ox * 0.95) * Math.max(s, 5.2), 0, (nz * 0.4 + oz * 0.95) * Math.max(s, 5.2));
        } else {
          _aiWant.set(nx * s, 0, nz * s);
        }
      } else {
        _aiWant.set(0, 0, 0);
      }
      applyVel(P, _aiWant, dt);
    };

    const resolvePlayerCollisions = () => {
      const MIN_SEP = 0.74;
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < entities.length; i++) {
          const a = entities[i];
          if (a.isBench || !a.root.visible) continue;
          for (let j = i + 1; j < entities.length; j++) {
            const b = entities[j];
            if (b.isBench || !b.root.visible) continue;
            let dx = b.root.position.x - a.root.position.x;
            let dz = b.root.position.z - a.root.position.z;
            let dist = Math.hypot(dx, dz);
            if (dist < MIN_SEP) {
              if (dist < 0.001) {
                const angle = (i * 1.7 + j * 2.3) % (Math.PI * 2);
                dx = Math.cos(angle);
                dz = Math.sin(angle);
                dist = 1;
              }
              const overlap = MIN_SEP - dist;
              const nx = dx / dist;
              const nz = dz / dist;
              const aRemote = remoteDrivenEntities.has(a);
              const bRemote = remoteDrivenEntities.has(b);
              const aAir = a.h > 0.15;
              const bAir = b.h > 0.15;
              let wA = 0.5;
              let wB = 0.5;
              if (aRemote && !bRemote) { wA = 0; wB = 1; }
              else if (bRemote && !aRemote) { wA = 1; wB = 0; }
              else if (aAir && !bAir) { wA = 0.2; wB = 0.8; }
              else if (bAir && !aAir) { wA = 0.8; wB = 0.2; }

              if (wA > 0) {
                a.root.position.x = clamp(a.root.position.x - nx * overlap * wA * 0.9, -13.85, 13.85);
                a.root.position.z = clamp(a.root.position.z - nz * overlap * wA * 0.9, -7.35, 7.35);
              }
              if (wB > 0) {
                b.root.position.x = clamp(b.root.position.x + nx * overlap * wB * 0.9, -13.85, 13.85);
                b.root.position.z = clamp(b.root.position.z + nz * overlap * wB * 0.9, -7.35, 7.35);
              }

              // Clean collision velocity sliding along tangent plane with smooth damping (prevents sticking/oscillating)
              const relVx = b.vel.x - a.vel.x;
              const relVz = b.vel.z - a.vel.z;
              const relNormal = relVx * nx + relVz * nz;
              if (relNormal < 0) {
                const restitution = 0.35;
                if (wA > 0) {
                  a.vel.x += nx * relNormal * wA * (1 + restitution);
                  a.vel.z += nz * relNormal * wA * (1 + restitution);
                }
                if (wB > 0) {
                  b.vel.x -= nx * relNormal * wB * (1 + restitution);
                  b.vel.z -= nz * relNormal * wB * (1 + restitution);
                }
              }

              // Shoulder-to-Shoulder "The Bump": ball-handler driving into an intense/stance defender absorbs momentum & triggers body-up
              if (pass === 0 && (state.owner === a || state.owner === b)) {
                const driver = state.owner === a ? a : b;
                const defender = state.owner === a ? b : a;
                const sameTeam = (teamA.includes(driver) && teamA.includes(defender)) || (teamB.includes(driver) && teamB.includes(defender));
                const defIntense =
                  defender.defState.stanceActive ||
                  (defender === ME && state.isDefending) ||
                  defender.defState.hipRideT > 0;
                const driverSp = Math.hypot(driver.vel.x, driver.vel.z);
                if (!sameTeam && defIntense && driverSp > 3.6 && driver.bumpCoolT <= 0 && !driver.act && !defender.act) {
                  driver.bumpCoolT = 0.72;
                  defender.bumpCoolT = 0.72;
                  driver.vel.multiplyScalar(0.28);
                  driver.currentStamina = Math.max(0, (driver.currentStamina ?? STAMINA_SETTINGS.maxStamina) - 8);
                  driver.stamina = getStaminaNormalized(driver);
                  if (driver.currentStamina <= 0 && !driver.isExhausted) {
                    driver.isExhausted = true;
                    driver.exhaustionTimer = STAMINA_SETTINGS.exhaustionRecoveryDelay;
                  }
                  driver.act = {
                    kind: "bump",
                    name: "BODY UP",
                    t: 0,
                    dur: 0.34,
                    lock: false,
                    pose: (u: number, T: any) => {
                      const recoil = Math.sin(u * Math.PI);
                      T.lean = -0.18 * recoil;
                      T.crouch = 0.16 * recoil;
                      T.shL = -0.95;
                      T.elL = -1.45;
                    },
                  };
                  defender.act = {
                    kind: "bump_brace",
                    name: "CLAMP",
                    t: 0,
                    dur: 0.3,
                    lock: false,
                    pose: (u: number, T: any) => {
                      const brace = Math.sin(u * Math.PI);
                      T.crouch = 0.24 * brace;
                      T.lean = 0.22 * brace;
                      T.shR = -1.45;
                      T.shL = -1.45;
                    },
                  };
                  Audio.squeak({ pan: clamp(driver.root.position.z / 7.5, -1, 1), vol: 0.85, entityKey: driver.name });
                  if (driver.isUser || defender.isUser) {
                    triggerLabel(defender.isUser ? "BODY UP! CLAMPED" : "DEFENSIVE BUMP!");
                  }
                }
              }
            }
          }
        }
      }
    };
    
    // --- CENTRALIZED AUDIO MANAGER ADAPTER (Uses only uploaded audio files) ---
    let lastSpeechEndMs = 0;
    const Audio = (() => {
      const phrases = {
        swish: ["Swish!", "Beautiful jump shot!", "Nothing but net!", "Count it!", "He's heating up!", "Got it!"],
        dunk: ["Boom! Slams it down!", "Powerful dunk!", "He rises for the jam!", "Posterized!", "Elevates and finishes!"],
        layup: ["Easy finger roll.", "Nice finish at the rim.", "Off the glass!", "Lays it in."],
        three: ["From downtown!", "Bang!", "From way back!", "The triple is good!"],
        miss: ["Off the mark.", "Just short.", "Clank!", "Can't find the bottom of the net.", "Brick!"],
        shotclock: ["Buzzer sounds!", "Out of time!", "Shot clock violation!"],
        block: ["Blocked by the defender!", "Not today!", "Sent it back!", "Rejected!"],
        steal: ["Stolen away!", "A pickpocket in the backcourt!", "Intercepted!", "He takes it!"],
        foul: ["Whistle blows. That's a foul.", "Contact on the play.", "Reach-in foul.", "Personal foul called."],
        unlock: ["Milestone reached! New gear in the locker room!", "Achievement unlocked! Check your career gear!"],
        quarter: (q: number) => `Start of quarter ${q}.`,
        gameover: "That's the buzzer! Ball game over!"
      };
      const random = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
      const markSpeechWindow = (text: string) => {
        lastSpeechEndMs = performance.now() + Math.min(2800, Math.max(950, text.length * 64));
      };

      return {
        unlock: () => { void audioMgr.unlock().catch(() => {}); },
        squeak: (opts?: { pan?: number; vol?: number; entityKey?: string }) => audioMgr.squeak(opts),
        dribble: (opts?: { pan?: number; vol?: number }) => audioMgr.dribble(opts),
        shotRelease: (opts?: { pan?: number; vol?: number }) => audioMgr.shotRelease(opts),
        pass: (opts?: { pan?: number; vol?: number }) => audioMgr.pass(opts),
        catchBall: (opts?: { pan?: number; vol?: number }) => audioMgr.catchBall(opts),
        floorBounce: (opts?: { pan?: number; vol?: number }) => audioMgr.floorBounce(opts),
        netSwish: (opts?: { pan?: number; vol?: number }) => audioMgr.netSwish(opts),
        rimHit: (opts?: { pan?: number; vol?: number }) => audioMgr.rimHit(opts),
        backboardHit: (opts?: { pan?: number; vol?: number }) => audioMgr.backboardHit(opts),
        dunk: (opts?: { pan?: number; vol?: number }) => audioMgr.dunk(opts),
        tikiTikiSlam: (opts?: { pan?: number; vol?: number }) => audioMgr.tikiTikiSlam(opts),
        crowdScream: (opts?: { pan?: number; vol?: number }) => audioMgr.crowdCheer(opts),
        crowdReaction: (opts?: { pan?: number; vol?: number }) => audioMgr.crowdReaction(opts),
        crowdBoo: (opts?: { pan?: number; vol?: number }) => audioMgr.crowdBoo(opts),
        whistle: (kind: "foul" | "timeout" | "tipoff" | "violation" = "foul") =>
          audioMgr.refereeWhistle(kind === "tipoff" || kind === "violation" ? "jumpball" : kind),
        shotClockBeep: (high = false) => audioMgr.shotClockBeep(high),
        shotClockBuzzer: () => audioMgr.buzzer("shotclock"),
        buzzer: (kind: "quarter" | "game" | "shotclock" = "quarter") => audioMgr.buzzer(kind),
        shotResetSound: () => {},
        updateCheer: (val: number) => audioMgr.updateCrowdAmbience(val),
        speak: (text: string) => {
          markSpeechWindow(text);
          audioMgr.speak(text);
        },
        commentary: (type: keyof typeof phrases, val?: any) => {
          const p = phrases[type];
          const text = typeof p === "function" ? p(val) : random(p as string[]);
          markSpeechWindow(text);
          audioMgr.speak(text);
        },
      };
    })();
    const jumpAct = (P: any, name: string, dur: number) => { if (P.act || P.h > 0.05) return; P.vy = 5.0; P.act = { kind: "jump", name, t: 0, dur, lock: false, pose: (u: any, T: any) => { T.shL = T.shR = -2.55; T.elL = T.elR = -1.1; } }; };

    function triggerMsg(text: string, color = "#fff") { setMessage({ text, color, visible: true }); setTimeout(() => setMessage(m => ({ ...m, visible: false })), 1500); }
    function triggerLabel(text: string) { setLabel({ text, visible: true }); setTimeout(() => setLabel(l => ({ ...l, visible: false })), 1000); }

    function fire(P: any, from: THREE.Vector3, aim: THREE.Vector3, FT: number, type: string, ex: any = {}) {
      const targetPos =
        type === "pass" && ex.passTo && !ex.fromRemote
          ? V(
              aim.x + ex.passTo.vel.x * FT * 0.42,
              aim.y,
              aim.z + ex.passTo.vel.z * FT * 0.42
            )
          : aim;
      state.flight = { kind: type, shooter: P, passTo: ex.passTo || null, pts: ex.pts || 0, perfect: !!ex.perfect, dunk: !!ex.dunk, dunkStyle: ex.dunkStyle || null, layup: !!ex.layup, t: 0, T: FT, rim: 0 };
      ball.position.copy(from); state.ballVel.set((targetPos.x - from.x) / FT, (targetPos.y - from.y) / FT + 0.5 * G * FT, (targetPos.z - from.z) / FT);
      state.owner = null; state.ballMode = "flight";
      const pan = clamp(from.z / 7.5, -1, 1);
      if (type === "pass") {
        Audio.pass({ pan, vol: 0.85 });
      }
      if (type === "shot") {
        state.shotClock = resetShotClock("shot_attempt");
        setShotClockResetPulse(k => k + 1);
        setLastShotResetReason("shot_attempt");
      }
      if (!ex.fromRemote && P === ME && isMpGuestSession() && mpClientRef.current?.roomCode) {
        const sign = isMirrorPerspective() ? -1 : 1;
        if (type === "shot") {
          mpClientRef.current.sendEvent("move_executed", {
            action: "shot",
            from: [from.x * sign, from.y, from.z * sign],
            aim: [targetPos.x * sign, targetPos.y, targetPos.z * sign],
            ft: FT,
            pts: ex.pts || 2,
            dunk: !!ex.dunk,
            layup: !!ex.layup,
          });
        } else if (type === "pass" && ex.passTo) {
          mpClientRef.current.sendEvent("move_executed", {
            action: "pass",
            from: [from.x * sign, from.y, from.z * sign],
            aim: [targetPos.x * sign, targetPos.y, targetPos.z * sign],
            ft: FT,
            targetKey: getOwnerEntityKey(ex.passTo),
          });
        }
      }
    }
    function releaseShot(P: any, a: any, forced: boolean) {
      if (a.released) return; a.released = true;
      const isHomeTeam = teamA.includes(P);
      const hoopX = isHomeTeam ? HOOP_X : -HOOP_X;
      const d = Math.hypot(P.root.position.x - hoopX, P.root.position.z);
      const greenWindow = isHomeTeam ? 0.105 : 0.075;

      // Use existing game clock logic (start vs release delta) to compute jump shot timing & accuracy
      const clockEval = evaluateShotTimingFromGameClock({
        startGameClockSec: a.startGameClock ?? state.gameClock,
        releaseGameClockSec: state.gameClock,
        startSimClockSec: a.startSimClock ?? state.simClock,
        releaseSimClockSec: state.simClock,
        idealReleaseSec: a.idealReleaseSec ?? 0.34,
        cyclePeriodSec: 0.68,
        greenWindowNormalized: greenWindow,
        forgiveQuickTap: P.isUser && !a.auto && !a.dunk && !a.layup,
      });

      const releaseC =
        P.isUser && !a.dunk && !a.layup
          ? a.auto && a.c === 0.5
            ? 0.5
            : clockEval.normalizedMeter
          : a.c ?? 0.5;
      const e = Math.abs(releaseC - 0.5);
      const isCornerThree =
        Math.abs(P.root.position.z) >= 6.6 &&
        (isHomeTeam ? P.root.position.x > 11.0 : P.root.position.x < -11.0);
      const isArcThree = d >= 6.74;
      let spread, FT, pts = isCornerThree || isArcThree ? 3 : 2;
      if (a.dunk) {
        spread = isHomeTeam ? 0.015 : 0.03;
        FT = 0.48;
        pts = 2;
      } else if (a.layup) {
        spread = isHomeTeam ? 0.045 : 0.085;
        FT = 0.62 + d * 0.036;
        pts = 2;
      } else {
        spread =
          e <= greenWindow
            ? isHomeTeam
              ? 0.015
              : 0.025
            : isHomeTeam
              ? 0.025 + e * 0.42
              : 0.045 + e * 0.78;
        FT = 1.02 + d * 0.056;
      }
      if (P.isUser) {
        const shootRating = athleteProfileRef.current.attributes.shooting;
        const shootFactor = clamp(1 - (shootRating - 68) / 85, 0.35, 0.92);
        spread *= shootFactor;
      } else if (isHomeTeam) {
        // Red Team AI shooters get crisp NBA-caliber release precision
        spread *= 0.56;
      }
      const contestPenalty = getContestPenalty(P) * (a.contestFactor ?? 1);
      spread += isHomeTeam ? contestPenalty * (P.isUser ? 0.65 : 0.58) : contestPenalty;
      if (isHomeTeam && !a.dunk) {
        spread = Math.min(spread, e <= greenWindow ? 0.11 : 0.24);
      }
      const from = handPos(P);
      // Aim directly at rim plane (RIM_Y) so the parabolic arc passes through (aim.x, aim.z) cleanly without backboard bounce errors
      const aim = V(hoopX + rnd(spread), RIM_Y, rnd(spread));

      // Queue timing feedback to pop for 1.5s immediately once the jump shot animation finishes
      if (P.isUser && !a.dunk && !a.layup) {
        a.pendingFeedback = {
          text: clockEval.label,
          color: clockEval.color,
          accuracyPct: clockEval.accuracyPct,
          deltaSec: clockEval.deltaSec,
          normalizedMeter: clockEval.normalizedMeter,
          isGreen: clockEval.isGreen,
          hoopX,
        };
      }

      const pan = clamp(P.root.position.z / 7.5, -1, 1);
      if (a.dunk) {
        Audio.dunk({ pan, vol: 0.95 });
      } else {
        Audio.shotRelease({ pan, vol: 0.82 });
      }

      // Reset shot clock on shot attempt
      state.shotClock = resetShotClock("shot_attempt");
      setShotClockResetPulse(k => k + 1);
      setLastShotResetReason("shot_attempt");

      fire(P, from, aim, FT, "shot", { perfect: e <= 0.075, dunk: a.dunk, dunkStyle: a.dunkStyle, layup: a.layup, pts });
    }
    function startShot(P: any, o: any = {}) {
      if (P.act && (!Number.isFinite(P.act.t) || P.act.t >= P.act.dur)) P.act = null;
      if (P.act || P.h > 0.05 || (!o.auto && state.owner !== P)) return null;
      const hoopX = teamA.includes(P) ? HOOP_X : -HOOP_X;
      const distToHoop = Math.hypot(P.root.position.x - hoopX, P.root.position.z);
      let useDunk = !!o.dunk;
      let useLayup = !!o.layup;
      let shotName = o.name || "JUMP SHOT";
      if (useDunk && distToHoop > 4.6) {
        useDunk = false;
        if (distToHoop <= 6.5) {
          useLayup = true;
          shotName = "DRIVING LAYUP";
        } else {
          shotName = "PULL-UP JUMPER";
        }
      }
      const a: any = {
        kind: "shot",
        name: shotName,
        t: 0,
        dur: o.dur || (o.dunkStyle === "tiki_tiki" && useDunk ? 1.14 : useDunk || useLayup ? 0.95 : 0.92),
        lock: !o.move,
        released: false,
        layup: useLayup,
        dunk: useDunk,
        auto: !!o.auto,
        startGameClock: state.gameClock,
        startSimClock: state.simClock,
        idealReleaseSec: o.releaseAt ?? 0.34,
        pendingFeedback: null as any,
        c: o.perfectRelease ? 0.5 : 0.5,
        stepback: !!o.stepback,
        style: o.style || null,
        dunkStyle: o.dunkStyle || null,
        contestFactor: o.contestFactor ?? 1,
      };
      if (o.auto) {
        const autoVar = teamA.includes(P) ? 0.085 : 0.18;
        a.c = o.perfectRelease ? 0.5 : 0.5 + (rnd(autoVar) + rnd(autoVar)) * 0.5;
      }
      if (o.stepback) { P.vel.addScaledVector(fwd(P), -4.5); }
      a.pose = (u: number, T: any) => {
        const k = P.hand, opp = k === "R" ? "L" : "R";
        // Visible airborne knee tuck & gather crouch before lift-off
        if (P.h > 0.03) {
          const lift = clamp(P.h / 0.52, 0, 1);
          T.crouch = 0;
          T.hipR = -0.36 - 0.6 * lift;
          T.kneeR = 0.48 + 1.05 * lift;
          T.hipL = -0.3 - 0.52 * lift;
          T.kneeL = 0.42 + 0.96 * lift;
          T.ankR = 0.42 * lift;
          T.ankL = 0.42 * lift;
        }
        if (a.dunk) {
          if (a.dunkStyle === "tiki_tiki") {
            if (u < 0.24) {
              // Deep rhythmic gather & emerald-gold launch coil
              const p = u / 0.24;
              T.crouch = 0.32 * Math.sin(p * Math.PI);
              T.lean = 0.28 * p;
              T.shR = -1.2 - p * 1.4;
              T.shL = -1.2 - p * 1.4;
              T.elR = -0.9;
              T.elL = -0.9;
            } else if (u < 0.68) {
              // Full 360-degree coiled tornado flight + cocked double overhead tomahawk
              const spinFrac = (u - 0.24) / 0.44;
              T.pelvYaw = spinFrac * Math.PI * 2;
              T.twist = Math.sin(spinFrac * Math.PI) * 0.45;
              T.lean = -0.22;
              T.shR = -3.15;
              T.shL = -2.95;
              T.elR = -0.35;
              T.elL = -0.45;
            } else {
              // Explosive green-and-gold two-handed rim flush
              T.lean = 0.32;
              T.shR = -2.75;
              T.shL = -2.75;
              T.elR = -0.08;
              T.elL = -0.08;
            }
          } else if (a.dunkStyle === "windmill") {
            T.shR = -0.6 - u * Math.PI * 2;
            T.elR = -0.2;
            T.shL = -1.3;
          } else if (a.dunkStyle === "tomahawk") {
            T["sh" + k] = -3.25;
            T["el" + k] = -0.25;
            T["sh" + opp] = -0.8;
          } else if (a.dunkStyle === "reverse") {
            T.lean = -0.28;
            T.shR = T.shL = -2.9;
            T.elR = T.elL = -0.4;
          } else if (a.dunkStyle === "cuff") {
            T["sh" + k] = -2.2;
            T["el" + k] = -1.6;
            T.twist = 0.45;
          } else {
            T.shR = T.shL = -3.0;
            T.elR = T.elL = -0.5;
          }
          return;
        }
        if (a.layup) {
          if (a.style === "finger_roll" || a.style === "scoop") {
            T["sh" + k] = -1.85 - u * 0.8;
            T["el" + k] = -0.25;
          } else if (a.style === "reverse") {
            T["sh" + k] = -2.5;
            T.twist = 0.7;
          } else {
            T["sh" + k] = -2.2;
            T["el" + k] = -1.9;
          }
          return;
        }
        if (a.style === "dirk") {
          T.hipL = -1.25;
          T.kneeL = 1.45;
          T.lean = -0.26;
        } else if (a.style === "skyhook" || a.style === "hook") {
          T.twist = a.style === "skyhook" ? 0.95 : 0.65;
          T["sh" + k] = -3.05;
          T["el" + k] = a.style === "skyhook" ? -0.1 : -0.45;
          T["sh" + opp] = -1.2;
          return;
        } else if (a.style === "turnaround") {
          T.twist = (1 - Math.min(1, u * 2.2)) * 1.6;
          T.lean = -0.18;
        }
        if (!a.released) {
          T["sh" + k] = -2.5;
          T["el" + k] = -1.9;
          if (a.stepback) T.lean = -0.22;
        } else {
          T["sh" + k] = -2.9;
          T["el" + k] = -0.2;
        }
      };
      a.update = () => {
        if (a.released) return;
        const dunkReleaseAt = a.dunkStyle === "tiki_tiki" ? 0.68 : 0.3;
        if ((a.layup && a.t >= 0.35) || (a.dunk && a.t >= dunkReleaseAt) || (a.auto && a.t >= (o.releaseAt || 0.38))) {
          return releaseShot(P, a, false);
        }
        if (P.isUser && !a.auto && !a.layup && !a.dunk) a.c = (((a.t / 0.68) % 2 + 2) % 2) < 1 ? ((a.t / 0.68) % 2) : 2 - ((a.t / 0.68) % 2);
      };
      a.end = () => {
        if (!a.released) releaseShot(P, a, true);
        if (P.isUser && !a.dunk && !a.layup && a.pendingFeedback) {
          const fb = a.pendingFeedback;
          const anchorProj = V(fb.hoopX, RIM_Y + 1.15, 0).project(camera);
          const sx = clamp((anchorProj.x * 0.5 + 0.5) * 100, 16, 84);
          const sy = clamp((-anchorProj.y * 0.5 + 0.5) * 100, 14, 70);
          state.shotFeedbackTimer = SHOT_FEEDBACK_DURATION_SEC;
          setShotFeedback({
            text: fb.text,
            color: fb.color,
            accuracyPct: fb.accuracyPct,
            deltaSec: fb.deltaSec,
            normalizedMeter: fb.normalizedMeter,
            x: sx,
            y: sy,
            visible: true,
            isGreen: fb.isGreen,
          });
        }
      };
      const finishBoost = P.isUser ? 1 + (athleteProfileRef.current.attributes.finishing - 75) / 260 : 1;
      const baseJumpVy = a.dunkStyle === "tiki_tiki" && a.dunk ? 6.85 : a.dunk ? 6.0 : a.stepback ? 4.4 : a.layup ? 4.8 : 5.2;
      P.act = a; P.shield = false; state.ballMode = "held"; P.vy = baseJumpVy * finishBoost; if (P.isUser) triggerLabel(a.name); return a;
    }
    function performFoul(defender: GameEntity, attacker: GameEntity) {
      if (state.deadT > 0) return;
      defender.stats.fouls++;
      defender.act = null;
      attacker.act = null;
      attacker.shield = false;
      triggerMsg("FOUL!", "#ff0000");
      Audio.whistle();
      Audio.commentary("foul");
      state.ballMode = "dead";
      state.deadReason = "foul";
      state.deadT = 1.5;
      state.ballVel.set(0, 0, 0);
      state.owner = attacker;
      state.shotClock = resetShotClock("foul");
      setShotClockResetPulse(k => k + 1);
      setLastShotResetReason("foul");
    }
    function getContestPenalty(shooter: GameEntity): number {
      const defenders = teamA.includes(shooter) ? teamB : teamA;
      let penalty = 0;
      for (const def of defenders) {
        if (def.isBench || !def.root.visible) continue;
        const d = def.root.position.distanceTo(shooter.root.position);
        if (d < 3.1) {
          const proximity = clamp(1 - d / 3.1, 0, 1);
          let mult = 0.25;
          if (def.defState.contestT > 0 || def.defState.verticalWallT > 0) mult += 0.55 + def.defState.contestLevel * 0.25;
          if (def.defState.hipRideT > 0) mult += 0.35;
          if (def.defState.handCheckT > 0) mult += 0.2;
          if (def.defState.stanceActive) mult += 0.15;
          if (def.h > 0.12) mult += 0.3;
          penalty = Math.max(penalty, proximity * mult * 0.42);
        }
      }
      return penalty;
    }
    function performOffensiveFoul(attacker: GameEntity, defender: GameEntity, reason: string) {
      if (state.deadT > 0) return;
      attacker.stats.fouls++;
      attacker.act = null;
      attacker.shield = false;
      defender.act = null;
      defender.defState.chargePlantedT = 0;
      triggerMsg(reason, "#10b981");
      Audio.whistle();
      Audio.crowdReaction({ vol: 0.9 });
      state.ballMode = "dead";
      state.deadReason = "foul";
      state.deadT = 1.4;
      state.ballVel.set(0, 0, 0);
      state.owner = defender;
      state.fastTransitionT = 3.6;
      state.shotClock = resetShotClock("turnover");
      setShotClockResetPulse((k) => k + 1);
      setLastShotResetReason("turnover");
    }
    function triggerStumbleTurnover(attacker: GameEntity, defender: GameEntity, reason: string) {
      attacker.defState.stumbleT = 0.95;
      attacker.vel.multiplyScalar(0.15);
      attacker.shield = false;
      attacker.act = {
        kind: "stumble",
        name: "STUMBLE",
        t: 0,
        dur: 0.85,
        lock: true,
        pose: (u: number, T: any) => {
          const wob = Math.sin(u * Math.PI * 3);
          T.lean = 0.55 * (1 - u * 0.3);
          T.twist = wob * 0.45;
          T.crouch = 0.25;
          T.shR = -1.4;
          T.shL = -1.4;
        },
      };
      if (state.owner === attacker) {
        state.owner = null;
        state.ballMode = "loose";
        state.flight = null;
        const pushDir = V(attacker.root.position.x - defender.root.position.x, 0, attacker.root.position.z - defender.root.position.z);
        if (pushDir.lengthSq() > 0.01) pushDir.normalize();
        else pushDir.set(1, 0, 0);
        state.ballVel.set(pushDir.x * 3.2, 2.1, pushDir.z * 3.2);
      }
      Audio.whistle();
      Audio.crowdReaction({ vol: 0.85 });
      triggerMsg(reason, "#10b981");
    }
    function triggerShotBlock(blocker: GameEntity, labelText = "REJECTED!") {
      if (blocker.isUser) {
        matchExtraStatsRef.current.blocks++;
      }
      const dirX = teamA.includes(blocker) ? 1 : -1;
      blocker.hypeT = 1.4;
      state.ballVel.x = dirX * (4.5 + Math.random() * 2.5);
      state.ballVel.y = 2.2;
      state.ballVel.z += rnd(2.2);
      state.flight = null;
      state.ballMode = "loose";
      Audio.backboardHit({ pan: clamp(blocker.root.position.z / 7.5, -1, 1), vol: 0.95 });
      Audio.crowdReaction({ vol: 0.92 });
      Audio.commentary("block");
      triggerMsg(labelText, "#ef4444");
    }
    function getMatchupForDefender(def: GameEntity, oppTeam: GameEntity[]): GameEntity | null {
      const activeOpp = oppTeam.filter((p) => !p.isBench && p.root.visible);
      if (activeOpp.length === 0) return null;
      return activeOpp[def.defState.matchupIdx % activeOpp.length] || activeOpp[0];
    }
    function swapDefenderMatchups(def1: GameEntity, def2: GameEntity) {
      const tmp = def1.defState.matchupIdx;
      def1.defState.matchupIdx = def2.defState.matchupIdx;
      def2.defState.matchupIdx = tmp;
    }
    function getNearestDefenderDist(entity: GameEntity, defenders: GameEntity[]): number {
      let best = Infinity;
      for (const def of defenders) {
        if (def.isBench || !def.root.visible) continue;
        const d = Math.hypot(
          def.root.position.x - entity.root.position.x,
          def.root.position.z - entity.root.position.z
        );
        if (d < best) best = d;
      }
      return best;
    }
    function findOpenTeammate(
      passer: GameEntity,
      teammates: GameEntity[],
      defenders: GameEntity[],
      targetHoopX: number
    ): { mate: GameEntity; defDist: number; hoopDist: number } | null {
      let best: { mate: GameEntity; defDist: number; hoopDist: number; score: number } | null = null;
      for (const mate of teammates) {
        if (mate === passer || mate.isBench || !mate.root.visible) continue;
        const defDist = getNearestDefenderDist(mate, defenders);
        const hoopDist = Math.hypot(targetHoopX - mate.root.position.x, mate.root.position.z);
        const score =
          defDist * 1.45 -
          hoopDist * 0.12 +
          (mate.isUser ? 0.55 : 0) +
          (hoopDist <= 8.8 ? 0.65 : 0);
        if (!best || score > best.score) {
          best = { mate, defDist, hoopDist, score };
        }
      }
      return best ? { mate: best.mate, defDist: best.defDist, hoopDist: best.hoopDist } : null;
    }
    function substitute(team: GameEntity[], idxIn: number, idxOut: number) {
      const pIn = team[idxIn], pOut = team[idxOut];
      if (!pIn || !pOut || !pIn.isBench || pOut.isBench || pOut.isUser) return;
      const oldCourtPos = pOut.root.position.clone();
      const benchPos = pIn.root.position.clone();

      pIn.isBench = false;
      pIn.root.visible = true;
      pIn.root.position.copy(oldCourtPos);
      resetEntityStamina(pIn);
      pIn.pelvis.position.y = 0.95;
      pIn.pelvis.rotation.set(0, 0, 0);
      pIn.torso.rotation.set(0, 0, 0);
      pIn.headGroup.rotation.set(0, 0, 0);
      pIn.legs.R.hip.rotation.set(0, 0, 0);
      pIn.legs.L.hip.rotation.set(0, 0, 0);
      pIn.legs.R.knee.rotation.x = 0.05;
      pIn.legs.L.knee.rotation.x = 0.05;
      pIn.legs.R.ankle.rotation.x = 0;
      pIn.legs.L.ankle.rotation.x = 0;

      pOut.isBench = true;
      pOut.root.visible = true;
      pOut.root.position.copy(benchPos);
      pOut.vel.set(0, 0, 0);
      pOut.pelvis.position.y = 0.5;
      pOut.pelvis.rotation.set(0, 0, 0);
      pOut.torso.rotation.set(0, 0, 0);
      pOut.headGroup.rotation.set(0, 0, 0);
      pOut.legs.R.hip.rotation.set(-1.4, 0, 0);
      pOut.legs.L.hip.rotation.set(-1.4, 0, 0);
      pOut.legs.R.knee.rotation.x = 1.4;
      pOut.legs.L.knee.rotation.x = 1.4;
      pOut.legs.R.ankle.rotation.x = 0;
      pOut.legs.L.ankle.rotation.x = 0;

      if (state.owner === pOut) state.owner = pIn;
      setTeamARoster([...team]);
      triggerMsg(`SUB: ${pIn.name} IN`, "#10b981");
      Audio.whistle();
    }

    let currentCity = initialCity;

    const applyArenaLighting = (city: WorldCity, custom: StudioCustomization) => {
      const atm = resolveArenaAtmosphere(city, custom.nightGameMode);
      const isNightScene = !atm.isDaytime;
      ambientLight.color.setStyle(atm.ambientHex);
      ambientLight.intensity = atm.ambientIntensity;
      arenaSpot.color.setStyle(atm.spotHex);
      arenaSpot.intensity = atm.spotIntensity;
      sun.intensity = isNightScene ? 0.42 : 0.95;
      rimLight.intensity = isNightScene ? 0.96 : 0.55;
      scene.background = new THREE.Color(atm.sceneSkyHex);
      scene.fog = new THREE.FogExp2(atm.sceneSkyHex, gameModeRef.current === "streetball" ? (isNightScene ? 0.012 : 0.008) : 0.015);
      nightSkyGroup.visible = isNightScene;
      starMat.opacity = atm.starOpacity;
      nightFloodGroup.visible = isNightScene;
      renderer.toneMappingExposure = isNightScene ? 1.18 : 1.06;
      floorMat.envMapIntensity = isNightScene ? 1.55 : 1.25;
      floorMat.needsUpdate = true;
      arenaVolumetricGroup.visible = gameModeRef.current !== "streetball" || isNightScene;
      return atm;
    };

    // --- APPLY WORLD TOUR CITY ARENA & TEAMS ---
    const applyCity = (city: WorldCity, silent = false) => {
      currentCity = city;
      if (apronMat) {
        apronMat.color.setStyle(gameModeRef.current === "streetball" ? "#1d262b" : city.courtBorderColor);
        apronMat.needsUpdate = true;
      }
      if (keyMat) {
        keyMat.color.setStyle(city.courtKeyColor);
        keyMat.needsUpdate = true;
      }
      if (scorerApronMat) {
        scorerApronMat.color.setStyle(city.jerseyPrimary);
        scorerApronMat.emissive.setStyle(city.jerseyPrimary);
        scorerApronMat.needsUpdate = true;
      }
      if (ledBannerMat) {
        const oldBanner = ledBannerTex;
        ledBannerTex = createLedBannerTex(city.name, city.jerseyPrimary);
        ledBannerMat.map = ledBannerTex;
        ledBannerMat.needsUpdate = true;
        oldBanner.dispose();
      }

      // Update Team B jerseys, trim & shorts to reflect this visited city's kit
      teamB.forEach((p) => {
        if (p.jerseyMat) {
          p.jerseyMat.color.setStyle(city.jerseyPrimary);
          p.jerseyMat.needsUpdate = true;
        }
        if (p.shortsMat) {
          p.shortsMat.color.setStyle(city.shortsColor);
          p.shortsMat.needsUpdate = true;
        }
        updateEntityJerseyPlates(p, city.jerseyPrimary, city.jerseySecondary, p.jerseyNumber, p.lastName);
      });

      if (ballMat && ballColorTex) {
        const oldTex = ballColorTex;
        const newTex = ballTexture(city.ballBaseHex || "#e8681c", city.ballSeamHex || "#161412", city.ballStamp || "WORLD TOUR");
        if (newTex) {
          ballColorTex = newTex;
          ballMat.map = ballColorTex;
          ballMat.needsUpdate = true;
          oldTex.dispose();
        }
      }

      // Dynamic Day-Night / Night Games Everywhere Atmosphere
      const cityAtm = applyArenaLighting(city, studioCustomRef.current);

      if (!silent) {
        Audio.whistle();
        triggerMsg(`${city.name.toUpperCase()} · ${cityAtm.phaseLabel.toUpperCase()}`, city.jerseyPrimary);
        Audio.speak(`Welcome to ${city.arenaName} in ${city.country}!`);
        setTimeout(() => {
          Audio.speak(city.crowdChant);
        }, 1800);
      }
    };

    // Apply initial studio customization & chosen city silently on boot
    applyStudioCustomToScene(studioCustomRef.current);
    applyCity(initialCity, true);

    // --- APPLY GAME MODE (MATCH, STREETBALL, TRAINING, FREESTYLE) ---
    const starterPosA: [number, number][] = [[-10, 0], [-8, 4], [-8, -4], [-4, 5], [-4, -5]];
    const starterPosB: [number, number][] = [[10, 0], [8, 4], [8, -4], [4, 5], [4, -5]];

    const resetStartersAndBench = () => {
      const mpFormat = mpRoomRef.current?.match?.format;
      const perSideActive = mpFormat ? Math.max(1, Math.min(5, Math.floor(formatToMaxPlayers(mpFormat) / 2))) : 5;
      teamA.slice(0, 5).forEach((p, idx) => {
        const isInactiveSlot = idx >= perSideActive;
        p.isBench = isInactiveSlot;
        p.root.visible = !isInactiveSlot;
        p.root.position.set(starterPosA[idx][0], isInactiveSlot ? 0.15 : 0, isInactiveSlot ? 7.8 : starterPosA[idx][1]);
        p.vel.set(0, 0, 0);
        p.h = 0;
        p.vy = 0;
        p.shield = false;
        p.act = null;
        p.holdT = 0;
        p.pelvis.position.y = isInactiveSlot ? 0.5 : 0.95;
        p.pelvis.rotation.set(0, 0, 0);
        p.torso.rotation.set(0, 0, 0);
        p.headGroup.rotation.set(0, 0, 0);
        p.legs.R.hip.rotation.set(0, 0, 0);
        p.legs.L.hip.rotation.set(0, 0, 0);
        p.legs.R.knee.rotation.x = 0.05;
        p.legs.L.knee.rotation.x = 0.05;
        p.legs.R.ankle.rotation.x = 0;
        p.legs.L.ankle.rotation.x = 0;
      });
      teamA.slice(5).forEach((p, i) => {
        p.isBench = true;
        p.root.visible = perSideActive >= 5;
        p.root.position.set(-6 + i * 0.85, 0.15, 7.8);
        p.vel.set(0, 0, 0);
        p.h = 0;
        p.vy = 0;
        p.shield = false;
        p.act = null;
        p.pelvis.position.y = 0.5;
        p.pelvis.rotation.set(0, 0, 0);
        p.torso.rotation.set(0, 0, 0);
        p.headGroup.rotation.set(0, 0, 0);
        p.legs.R.hip.rotation.set(-1.4, 0, 0);
        p.legs.L.hip.rotation.set(-1.4, 0, 0);
        p.legs.R.knee.rotation.x = 1.4;
        p.legs.L.knee.rotation.x = 1.4;
        p.legs.R.ankle.rotation.x = 0;
        p.legs.L.ankle.rotation.x = 0;
      });
      teamB.slice(0, 5).forEach((p, idx) => {
        const isInactiveSlot = idx >= perSideActive;
        p.isBench = isInactiveSlot;
        p.root.visible = !isInactiveSlot;
        p.root.position.set(starterPosB[idx][0], isInactiveSlot ? 0.15 : 0, isInactiveSlot ? 7.8 : starterPosB[idx][1]);
        p.vel.set(0, 0, 0);
        p.h = 0;
        p.vy = 0;
        p.shield = false;
        p.act = null;
        p.holdT = 0;
        p.pelvis.position.y = isInactiveSlot ? 0.5 : 0.95;
        p.pelvis.rotation.set(0, 0, 0);
        p.torso.rotation.set(0, 0, 0);
        p.headGroup.rotation.set(0, 0, 0);
        p.legs.R.hip.rotation.set(0, 0, 0);
        p.legs.L.hip.rotation.set(0, 0, 0);
        p.legs.R.knee.rotation.x = 0.05;
        p.legs.L.knee.rotation.x = 0.05;
        p.legs.R.ankle.rotation.x = 0;
        p.legs.L.ankle.rotation.x = 0;
      });
      teamB.slice(5).forEach((p, i) => {
        p.isBench = true;
        p.root.visible = perSideActive >= 5;
        p.root.position.set(2 + i * 0.85, 0.15, 7.8);
        p.vel.set(0, 0, 0);
        p.h = 0;
        p.vy = 0;
        p.shield = false;
        p.act = null;
        p.pelvis.position.y = 0.5;
        p.pelvis.rotation.set(0, 0, 0);
        p.torso.rotation.set(0, 0, 0);
        p.headGroup.rotation.set(0, 0, 0);
        p.legs.R.hip.rotation.set(-1.4, 0, 0);
        p.legs.L.hip.rotation.set(-1.4, 0, 0);
        p.legs.R.knee.rotation.x = 1.4;
        p.legs.L.knee.rotation.x = 1.4;
        p.legs.R.ankle.rotation.x = 0;
        p.legs.L.ankle.rotation.x = 0;
      });
      setTeamARoster([...teamA]);
    };

    const applyGameMode = (mode: GameMode) => {
      gameModeRef.current = mode;
      state.isGameOver = false;
      state.isPaused = false;
      state.flight = null;
      state.deadT = 0;
      state.deadReason = null;
      state.lastScoringTeam = null;
      state.prevPossessionTeam = null;
      state.fastTransitionT = 0;
      state.looseT = 0;
      state.ballStallT = 0;
      state.tripleBreakT = 0;
      state.backcourtClock = 0;
      state.closelyGuardedClock = 0;
      state.backcourtTeam = null;
      state.hadRimContact = false;
      state.lastPasser = null;
      state.ballVel.set(0, 0, 0);
      state.shotFeedbackTimer = 0;
      matchExtraStatsRef.current = { steals: 0, threes: 0, dunks: 0, blocks: 0 };
      setShotFeedback((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      setShowMeter(false);
      isBallLooseRef.current = false;
      setIsBallLoose(false);
      entities.forEach((p) => {
        p.stats = { pts: 0, ast: 0, reb: 0, fouls: 0 };
        p.act = null;
        p.h = 0;
        p.vy = 0;
        p.shield = false;
        p.holdT = 0;
        p.vel.set(0, 0, 0);
        resetEntityStamina(p);
        p.defState.stanceActive = false;
        p.defState.stanceT = 0;
        p.defState.chargePlantedT = 0;
        p.defState.stumbleT = 0;
        p.defState.boxOutT = 0;
        p.defState.contestT = 0;
        p.defState.verticalWallT = 0;
        p.defState.hipRideT = 0;
        p.defState.handCheckT = 0;
        p.defState.passLaneHunterT = 0;
        p.defState.aiMoveCoolT = 0;
        p.defState.gloveRipT = 0;
        p.defState.volleySwatT = 0;
        p.defState.cutoffClampT = 0;
        p.offState.tripleThreatActive = false;
        p.offState.tripleThreatT = 0;
        p.offState.cutActionT = 0;
        (p as any)._stuck = null;
      });

      if (mode === "streetball") {
        floorMat.map = asphaltTex || floorTex || null;
        floorMat.roughness = 0.85;
        floorMat.metalness = 0.02;
        floorMat.clearcoat = 0;
        floorMat.clearcoatRoughness = 0.8;
        floorMat.needsUpdate = true;
        apronMat.color.setHex(0x1d262b);
        apronMat.needsUpdate = true;
        marginGroup.visible = true;
        arenaOverheadGroup.visible = false;
        ledBoardGroup.visible = false;
      } else {
        floorMat.color.setHex(floorTex ? 0xffffff : 0xd4a373);
        floorMat.map = floorTex || null;
        floorMat.roughness = 0.24;
        floorMat.metalness = 0.08;
        floorMat.clearcoat = 0.9;
        floorMat.clearcoatRoughness = 0.14;
        floorMat.envMapIntensity = 1.35;
        floorMat.needsUpdate = true;
        apronMat.color.setStyle(currentCity.courtBorderColor);
        apronMat.needsUpdate = true;
        marginGroup.visible = true;
        arenaOverheadGroup.visible = true;
        ledBoardGroup.visible = true;
      }
      applyArenaLighting(currentCity, studioCustomRef.current);

      if (mode === "freestyle") {
        entities.forEach((p) => {
          p.root.visible = p === ME;
        });
        ME.isBench = false;
        ME.root.visible = true;
        ME.root.position.set(2, 0, 0);
        state.owner = ME;
        state.ballMode = "dribble";
        state.scoreHome = 0;
        state.scoreAway = 0;
        setScoreHome(0);
        setScoreAway(0);
        state.shotClock = resetShotClock("quarter_start");
        setShotClock(24);
        triggerMsg("FREESTYLE OPEN COURT", "#a855f7");
        Audio.speak("Freestyle shootaround. Own the open court.");
      } else if (mode === "training") {
        entities.forEach((p) => {
          p.root.visible = p === ME || p === teamA[1];
        });
        ME.isBench = false;
        ME.root.visible = true;
        ME.root.position.set(5, 0, 0);
        teamA[1].isBench = false;
        teamA[1].root.visible = true;
        teamA[1].root.position.set(11.5, 0, 2.5);
        teamA[1].pelvis.position.y = 0.95;
        teamA[1].legs.R.hip.rotation.x = 0;
        teamA[1].legs.L.hip.rotation.x = 0;
        state.owner = ME;
        state.ballMode = "dribble";
        state.scoreHome = 0;
        state.scoreAway = 0;
        setScoreHome(0);
        setScoreAway(0);
        state.shotClock = resetShotClock("quarter_start");
        setShotClock(24);
        triggerMsg("TRAINING DRILL: MAKE 5 SHOTS", "#06b6d4");
        Audio.speak("Training facility open. Drain five buckets to earn Career XP.");
      } else {
        resetStartersAndBench();
        state.owner = ME;
        state.ballMode = "dribble";
        state.scoreHome = 0;
        state.scoreAway = 0;
        state.gameClock = quarterLengthRef.current;
        state.quarter = 1;
        quarterHighlightsRef.current = [];
        allHighlightsRef.current = [];
        setHighlightsCount(0);
        setScoreHome(0);
        setScoreAway(0);
        setGameClock(quarterLengthRef.current);
        setQuarter(1);
        state.shotClock = resetShotClock("quarter_start");
        setShotClock(24);
        if (mode === "streetball") {
          triggerMsg("STREETBALL BLACKTOP", "#f97316");
        }
      }
    };

    // --- END MATCH & RECORD PROGRESSION ---
    const endGameAndRecordStats = () => {
      if (state.isGameOver) return;
      state.isGameOver = true;
      setShowMeter(false);
      triggerMsg("GAME OVER", "#ef476f");
      Audio.buzzer("game");
      Audio.crowdScream({ vol: 0.95 });
      Audio.commentary("gameover");
      const stats = entities
        .filter((p) => !p.isBench || p.stats.pts > 0 || p.stats.reb > 0 || p.stats.ast > 0 || p.stats.fouls > 0)
        .map((p) => ({
          name: p.name,
          isUser: p.isUser,
          pts: p.stats.pts,
          ast: p.stats.ast,
          reb: p.stats.reb,
          fouls: p.stats.fouls,
          team: teamA.includes(p) ? "Home" : "Away",
        }));
      const sortedStats = stats.sort((a, b) => (b.pts + b.ast * 2 + b.reb * 1.5) - (a.pts + a.ast * 2 + a.reb * 1.5));
      setFinalStats(sortedStats);

      // Sync Online Multiplayer Final Result
      if (mpClientRef.current?.roomCode) {
        const isMirror = mpRoomRef.current?.players[mpClientRef.current.playerId]?.team === "Away";
        const syncedHome = isMirror ? state.scoreAway : state.scoreHome;
        const syncedAway = isMirror ? state.scoreHome : state.scoreAway;
        const winner: TeamSide | "Tie" =
          syncedHome > syncedAway ? "Home" : syncedAway > syncedHome ? "Away" : "Tie";
        mpClientRef.current.sendEvent("match_finished", {
          winner,
          scoreHome: syncedHome,
          scoreAway: syncedAway,
        });
      }

      // Record match to career stats
      const won = state.scoreHome > state.scoreAway;
      const earnings = {
        pts: ME.stats.pts,
        reb: ME.stats.reb,
        ast: ME.stats.ast,
        fouls: ME.stats.fouls,
        won,
      };
      const recordResult = recordMatchToCareer(earnings);
      careerStatsRef.current = recordResult.updatedStats;
      setCareerStats(recordResult.updatedStats);
      setLastMatchEarnings({
        pts: earnings.pts,
        reb: earnings.reb,
        ast: earnings.ast,
        xpGained: recordResult.xpGained,
        leveledUp: recordResult.leveledUp,
        unlocked: recordResult.newlyUnlockedItems,
      });

      // Record MyCareer progression
      const nextMyCareer = applyCareerGameReward(myCareerRef.current, {
        pts: earnings.pts,
        reb: earnings.reb,
        ast: earnings.ast,
        stl: matchExtraStatsRef.current.steals,
        blk: matchExtraStatsRef.current.blocks,
        won,
      });
      myCareerRef.current = nextMyCareer;
      setMyCareer(nextMyCareer);
      saveCareerState(nextMyCareer);

      // Record APBA League / World Tour Cup / National Tour result
      let crownedChampion = false;
      const ctx = activeMatchContextRef.current;
      if (ctx.kind === "league" || ctx.kind === "franchise") {
        const prevChamp = leagueStateRef.current.playoffs?.championTeamId ?? null;
        let homeId = ctx.kind === "league" ? ctx.homeTeamId : ctx.teamId;
        let awayId = ctx.kind === "league" ? ctx.awayTeamId : "apba_chi_vipers";
        if (ctx.kind === "franchise") {
          const nextSched = leagueStateRef.current.schedule.find(
            (g) => !g.played && (g.homeTeamId === ctx.teamId || g.awayTeamId === ctx.teamId)
          );
          if (nextSched) {
            homeId = nextSched.homeTeamId;
            awayId = nextSched.awayTeamId;
          }
        }
        const approxFgm = Math.max(0, Math.round(earnings.pts / 2.2));
        const nextLeague = recordUserPlayedMatch(leagueStateRef.current, {
          homeTeamId: homeId,
          awayTeamId: awayId,
          homeScore: state.scoreHome,
          awayScore: state.scoreAway,
          userStats: {
            pts: earnings.pts,
            reb: earnings.reb,
            ast: earnings.ast,
            stl: matchExtraStatsRef.current.steals,
            blk: matchExtraStatsRef.current.blocks,
            tov: 0,
            fgm: approxFgm,
            fga: Math.max(approxFgm, Math.round(approxFgm * 1.9)),
            tpm: matchExtraStatsRef.current.threes,
            tpa: Math.max(matchExtraStatsRef.current.threes, Math.floor(approxFgm / 1.8)),
            ftm: 0,
            fta: 0,
          },
        });
        leagueStateRef.current = nextLeague;
        setLeagueState(nextLeague);
        saveLeagueState(nextLeague);
        if (!prevChamp && nextLeague.playoffs?.championTeamId) {
          crownedChampion = true;
        }
      } else if (ctx.kind === "world_cup") {
        const nextCup = resolveTournamentMatch(
          worldTournamentRef.current,
          ctx.matchId,
          state.scoreHome,
          state.scoreAway
        );
        worldTournamentRef.current = nextCup;
        setWorldTournament(nextCup);
        saveWorldTourTournamentState(nextCup);
        if (nextCup.championCityId === nextCup.userCityId) {
          crownedChampion = true;
        }
      } else if (ctx.kind === "national_tour") {
        const tourRes = resolveNationalTourStopMatch(
          nationalTourRef.current,
          ctx.stopId,
          state.scoreHome,
          state.scoreAway,
          {
            steals: matchExtraStatsRef.current.steals,
            threes: matchExtraStatsRef.current.threes,
            dunks: matchExtraStatsRef.current.dunks,
          }
        );
        nationalTourRef.current = tourRes.nextState;
        setNationalTour(tourRes.nextState);
        saveNationalTourState(tourRes.nextState);
        if (tourRes.unlockTikiTiki) {
          const unlockedRes = unlockProgressionItem("dunk_tiki_tiki", false);
          careerStatsRef.current = unlockedRes.stats;
          setCareerStats(unlockedRes.stats);
          if (unlockedRes.newlyUnlocked) {
            Audio.commentary("unlock");
            triggerMsg("UNLOCKED: TIKI TIKI SIGNATURE SLAM!", "#10b981");
          }
        }
        if (tourRes.wonChampionship) {
          crownedChampion = true;
        }
      }
      activeMatchContextRef.current = { kind: "exhibition" };

      if (recordResult.newlyUnlockedItems.length > 0) {
        Audio.commentary("unlock");
        triggerMsg("NEW GEAR UNLOCKED!", "#10b981");
      }

      // Broadcast Postgame Interview or Championship Trophy Ceremony
      const potg = sortedStats[0] || { name: ME.name, pts: ME.stats.pts, reb: ME.stats.reb, ast: ME.stats.ast };
      pendingPostBroadcastActionRef.current = "show_summary";
      setTimeout(() => {
        setBroadcastScene({
          stage: crownedChampion ? "championship" : "postgame",
          homeTeamName: studioCustomRef.current.teamName,
          awayTeamName: currentCity.teamName,
          homeAbbr: studioCustomRef.current.teamAbbr,
          awayAbbr: currentCity.name.slice(0, 3).toUpperCase(),
          homeColor: studioCustomRef.current.primaryColor,
          awayColor: currentCity.jerseyPrimary,
          scoreHome: state.scoreHome,
          scoreAway: state.scoreAway,
          arenaName: currentCity.arenaName,
          startersHome: teamA.slice(0, 5).map((p) => p.name),
          startersAway: teamB.slice(0, 5).map((p) => p.name),
          potgName: potg.name,
          potgLine: `${potg.pts} PTS · ${potg.reb} REB · ${potg.ast} AST`,
          interviewQuestion: won
            ? "Big-time statement tonight! What turned the momentum in your favor down the stretch?"
            : "Hard-fought battle until the final buzzer. What is the adjustment heading into the next matchup?",
          interviewOptions: [
            { label: "Team Chemistry", quote: "Our spacing and trust in the locker room carried us.", repGain: 4 },
            { label: "Lockdown Defense", quote: "Stops fueled our transition attack every single quarter.", repGain: 5 },
            { label: "Championship Standard", quote: "Every possession is preparation for raising the Sovereign Cup.", repGain: 6 },
          ],
          trophyName: CHAMPIONSHIP_TROPHY_NAME,
        });
      }, 650);
    };

    const scoopBall = () => {
      const distToBall = ME.root.position.distanceTo(ball.position);
      if (state.owner === ME) return;
      if (state.owner && teamA.includes(state.owner)) return;
      if (distToBall > 4.5) return;

      const fromHoop = isNearHoop(ball.position);
      const wasHeldByOpp = Boolean(state.owner && !teamA.includes(state.owner));
      const wasDeadAfterScore = state.ballMode === "dead" && state.deadReason === "score";

      if (distToBall > 1.35) {
        const stepX = clamp(ball.position.x - ME.root.position.x, -1.25, 1.25);
        const stepZ = clamp(ball.position.z - ME.root.position.z, -1.25, 1.25);
        ME.root.position.x = clamp(ME.root.position.x + stepX, -13.5, 13.5);
        ME.root.position.z = clamp(ME.root.position.z + stepZ, -7.0, 7.0);
      }
      if (ball.position.y > 1.65 && ME.h <= 0.1) {
        ME.vy = 3.8;
      }
      if (state.hadRimContact) {
        ME.stats.reb++;
        state.hadRimContact = false;
      }
      state.flight = null;
      state.deadT = 0;
      state.deadReason = null;
      state.owner = ME;
      state.ballMode = "dribble";
      state.ballVel.set(0, 0, 0);
      state.fastTransitionT = 3.6;
      state.prevPossessionTeam = "Home";
      isBallLooseRef.current = false;
      setIsBallLoose(false);
      if (isMpGuestSession() && mpClientRef.current?.roomCode) {
        mpClientRef.current.sendEvent("move_executed", { action: "scoop" });
      }

      if (fromHoop && (wasHeldByOpp || wasDeadAfterScore)) {
        triggerLabel("STOLE FROM HOOP!");
        triggerMsg("STOLE FROM HOOP!", "#10b981");
        Audio.crowdReaction({ vol: 0.92 });
      } else if (fromHoop) {
        triggerLabel("TOOK FROM HOOP!");
        Audio.crowdScream();
      } else if (wasHeldByOpp) {
        triggerLabel("STOLE THE BALL!");
        Audio.crowdReaction({ vol: 0.9 });
      } else {
        triggerLabel("PICKED UP BALL!");
        Audio.crowdScream();
      }
      Audio.catchBall({ pan: clamp(ME.root.position.z / 7.5, -1, 1), vol: 0.9 });
      Audio.squeak({ pan: 0, vol: 0.9 });
      Audio.dribble({ pan: 0, vol: 0.9 });
    };

    const executeMove = (move: OffenseMove | DefenseMove) => {
      Audio.unlock();
      const label = formatMoveTitle(move);
      const isOffense = Object.values(OffenseMove).includes(move as OffenseMove);
      const f = fwd(ME);
      const r = rightOf(ME);

      if (isOffense) {
        const offMove = move as OffenseMove;
        const meta = getMoveMetadata(offMove);
        const disp = meta.name.toUpperCase();
        const activeOpp = teamB.filter((p) => !p.isBench && p.root.visible);
        const activeMates = teamA.filter((p) => !p.isBench && p.root.visible && p !== ME);
        const nearestDef = activeOpp.reduce<GameEntity | null>((best, cand) => {
          if (!best) return cand;
          return cand.root.position.distanceTo(ME.root.position) < best.root.position.distanceTo(ME.root.position) ? cand : best;
        }, null);
        const baitDefender = (mode: "jump" | "lateral" | "freeze", range = 3.4) => {
          if (!nearestDef || nearestDef.root.position.distanceTo(ME.root.position) > range) return;
          if (mode === "jump" && nearestDef.h <= 0.08) {
            nearestDef.vy = 3.9;
            nearestDef.defState.stumbleT = 0.55;
          } else if (mode === "lateral") {
            nearestDef.vel.addScaledVector(r, (ME.hand === "R" ? -1 : 1) * 4.4);
          } else {
            nearestDef.vel.multiplyScalar(0.15);
            nearestDef.defState.stumbleT = 0.7;
          }
        };

        // 8. OFFENSIVE REBOUNDING MOVES (Executable off-ball / during loose & rebound windows)
        if (OFFENSE_CATEGORIES.off_rebounding.includes(offMove)) {
          Audio.squeak({ pan: 0, vol: 0.85 });
          if (offMove === OffenseMove.SPIN_OFF_BOX_OUT || offMove === OffenseMove.SWIM_MOVE_REB) {
            const isSpin = offMove === OffenseMove.SPIN_OFF_BOX_OUT;
            ME.offState.reboundBoostT = 1.6;
            ME.vel.addScaledVector(f, 5.2).addScaledVector(r, isSpin ? 2.2 : -1.8);
            if (nearestDef && nearestDef.root.position.distanceTo(ME.root.position) < 2.2) {
              nearestDef.vel.addScaledVector(r, isSpin ? -3.4 : 3.2);
              nearestDef.defState.boxOutT = 0;
            }
            ME.act = {
              kind: "rebound_counter",
              name: disp,
              t: 0,
              dur: 0.48,
              pose: (u: number, T: any) => {
                T.crouch = 0.24;
                T.lean = 0.22;
                if (isSpin) ME.faceYaw += u * Math.PI * 1.5;
                else {
                  T.shR = -2.6 + u * 2.1;
                  T.elR = -0.35;
                }
              },
            };
          } else {
            // TIP_IN_TAP
            ME.vy = 5.0;
            ME.offState.reboundBoostT = 1.2;
            const distToHoop = Math.hypot(HOOP_X - ME.root.position.x, ME.root.position.z);
            const distToBall = ME.root.position.distanceTo(ball.position);
            ME.act = {
              kind: "tip_in",
              name: disp,
              t: 0,
              dur: 0.52,
              pose: (_u: number, T: any) => {
                T.shR = -3.05;
                T.shL = -2.2;
                T.elR = -0.15;
              },
            };
            if (distToBall < 3.6 && (state.ballMode === "loose" || state.flight?.kind === "shot")) {
              if (distToHoop < 5.5) {
                state.owner = null;
                state.hadRimContact = false;
                const aim = V(HOOP_X + rnd(0.12), RIM_Y + 0.15, rnd(0.12));
                fire(ME, ball.position.clone(), aim, 0.42, "shot", { layup: true, pts: 2 });
                triggerMsg("TIP-IN!", "#f59e0b");
              } else if (activeMates[0]) {
                state.owner = null;
                fire(ME, ball.position.clone(), torsoPos(activeMates[0]), 0.45, "pass", { passTo: activeMates[0] });
                triggerMsg("TIP-OUT!", "#38bdf8");
              }
            }
          }
          triggerLabel(disp);
          return;
        }

        // 6. OFF-BALL MOVEMENT & SCREEN ACTIONS
        if (OFFENSE_CATEGORIES.off_ball_actions.includes(offMove)) {
          activeOffensePlayRef.current = offMove;
          setActiveOffensePlay(offMove);
          const nextOff =
            offMove === OffenseMove.FAST_BREAK
              ? "fast_break"
              : offMove === OffenseMove.FLARE_CUT ||
                offMove === OffenseMove.FADE_CUT ||
                offMove === OffenseMove.PIN_DOWN ||
                offMove === OffenseMove.V_CUT ||
                offMove === OffenseMove.L_CUT ||
                offMove === OffenseMove.CHICAGO_ACTION
              ? "pace_space"
              : offMove === OffenseMove.BACKDOOR_CUT ||
                offMove === OffenseMove.FLASH_CUT ||
                offMove === OffenseMove.CURL_CUT
              ? "paint_power"
              : "pick_roll";
          const nextTactics = { ...tacticsRef.current, offense: nextOff as any };
          tacticsRef.current = nextTactics;
          setTactics(nextTactics);

          const primaryMate = activeMates[0];
          const secondMate = activeMates[1] || primaryMate;
          if (primaryMate) {
            primaryMate.offState.cutActionT = 2.6;
            if (offMove === OffenseMove.GIVE_AND_GO && state.owner === ME) {
              state.lastPasser = ME;
              state.lastPassTime = performance.now();
              fire(ME, handPos(ME), torsoPos(primaryMate), 0.34, "pass", { passTo: primaryMate });
              ME.vel.addScaledVector(f, 7.6);
            } else if (offMove === OffenseMove.DRIBBLE_HANDOFF || offMove === OffenseMove.CHICAGO_ACTION) {
              primaryMate.vel.copy(ME.root.position.clone().sub(primaryMate.root.position).setY(0).normalize().multiplyScalar(8.5));
              if (state.owner === ME && ME.root.position.distanceTo(primaryMate.root.position) < 4.5) {
                fire(ME, handPos(ME), torsoPos(primaryMate), 0.28, "pass", { passTo: primaryMate });
                ME.shield = true;
                setTimeout(() => { ME.shield = false; }, 600);
              }
            } else if (
              offMove === OffenseMove.BACKDOOR_CUT ||
              offMove === OffenseMove.SLIP_SCREEN ||
              offMove === OffenseMove.CURL_CUT ||
              offMove === OffenseMove.FLASH_CUT
            ) {
              const rimDir = V(HOOP_X - primaryMate.root.position.x, 0, -primaryMate.root.position.z).normalize();
              primaryMate.vel.copy(rimDir.multiplyScalar(9.0));
            } else if (
              offMove === OffenseMove.FLARE_CUT ||
              offMove === OffenseMove.FADE_CUT ||
              offMove === OffenseMove.PICK_AND_POP ||
              offMove === OffenseMove.GHOST_SCREEN
            ) {
              const popSpot = V(HOOP_X - 6.8, 0, primaryMate.root.position.z >= 0 ? 5.8 : -5.8);
              primaryMate.vel.copy(popSpot.sub(primaryMate.root.position).normalize().multiplyScalar(8.2));
            } else if (offMove === OffenseMove.SPAIN_PICK_AND_ROLL && secondMate) {
              const screenSpot = ME.root.position.clone().addScaledVector(f, 1.5);
              primaryMate.vel.copy(screenSpot.sub(primaryMate.root.position).normalize().multiplyScalar(8.2));
              secondMate.offState.cutActionT = 2.6;
              secondMate.vel.set(2.5, 0, 0);
            }
          }
          Audio.squeak({ pan: 0, vol: 0.75 });
          triggerLabel(`PLAY: ${disp}`);
          triggerMsg(disp, "#38bdf8");
          return;
        }

        // In solo modes or when user holds ball (give ball in freestyle/training)
        if (state.owner !== ME) {
          if (gameModeRef.current === "freestyle" || gameModeRef.current === "training") {
            state.owner = ME;
            state.ballMode = "dribble";
            state.flight = null;
          } else {
            triggerMsg("NEED POSSESSION", "#f59e0b");
            return;
          }
        }

        // Clear Triple-Threat stance when initiating dribble or shot
        if (!OFFENSE_CATEGORIES.triple_threat.includes(offMove)) {
          ME.offState.tripleThreatActive = false;
          ME.offState.tripleThreatT = 0;
        }

        // 1. TRIPLE-THREAT & JAB SERIES (Pre-Dribble)
        if (OFFENSE_CATEGORIES.triple_threat.includes(offMove)) {
          Audio.squeak({ pan: 0, vol: 0.85 });
          if (offMove === OffenseMove.TRIPLE_THREAT_STANCE) {
            ME.offState.tripleThreatActive = !ME.offState.tripleThreatActive;
            ME.offState.tripleThreatT = ME.offState.tripleThreatActive ? 6.0 : 0;
            ME.vel.multiplyScalar(0.15);
            ME.act = {
              kind: "triple_threat",
              name: disp,
              t: 0,
              dur: 0.45,
              pose: (_u: number, T: any) => {
                T.crouch = 0.28;
                T.lean = 0.16;
                T.shR = -1.35;
                T.elR = -1.65;
                T.shL = -1.35;
                T.elL = -1.65;
              },
            };
            triggerLabel(ME.offState.tripleThreatActive ? "TRIPLE-THREAT READY" : "DRIBBLE LIVE");
            return;
          } else if (offMove === OffenseMove.PUMP_FAKE) {
            baitDefender("jump", 3.6);
            ME.act = {
              kind: "footwork",
              name: disp,
              t: 0,
              dur: 0.42,
              pose: (u: number, T: any) => {
                const peak = Math.sin(u * Math.PI);
                T.shR = -0.5 - peak * 2.0;
                T.shL = -0.5 - peak * 2.0;
                T.elR = -1.1;
                T.elL = -1.1;
                T.crouch = 0.16;
              },
            };
          } else if (offMove === OffenseMove.PASS_FAKE) {
            baitDefender("lateral", 4.2);
            ME.act = {
              kind: "footwork",
              name: disp,
              t: 0,
              dur: 0.38,
              pose: (u: number, T: any) => {
                const p = Math.sin(u * Math.PI);
                T.twist = p * 0.55;
                T.shR = -1.45 - p * 0.5;
                T.shL = -1.45 - p * 0.5;
                T.elR = -0.35;
                T.elL = -0.35;
              },
            };
          } else if (offMove === OffenseMove.JAB_STEP) {
            baitDefender("freeze", 3.4);
            ME.act = {
              kind: "footwork",
              name: disp,
              t: 0,
              dur: 0.4,
              pose: (u: number, T: any) => {
                const p = Math.sin(u * Math.PI);
                T.crouch = 0.25;
                T.hipR = -0.45 * p;
                T.kneeR = 0.65 * p;
                T.hipRollR = -0.25 * p;
                T.shR = -1.35;
                T.elR = -1.55;
              },
            };
          } else if (offMove === OffenseMove.JAB_AND_GO || offMove === OffenseMove.JAB_AND_CROSS) {
            const sameSide = offMove === OffenseMove.JAB_AND_GO;
            baitDefender("lateral", 3.5);
            ME.vel.addScaledVector(f, 6.2).addScaledVector(r, (sameSide ? 1 : -1) * 2.8);
            ME.act = {
              kind: "footwork",
              name: disp,
              t: 0,
              dur: 0.48,
              pose: (u: number, T: any) => {
                T.crouch = 0.26;
                T.lean = 0.28;
                T.hipR = u < 0.38 ? -0.55 : -0.25;
                T.twist = sameSide ? 0.25 : -0.42;
                T.shR = -1.5;
                T.elR = -1.2;
              },
            };
          } else if (offMove === OffenseMove.ROCKER_STEP) {
            baitDefender("freeze", 3.5);
            ME.vel.addScaledVector(f, -2.6);
            ME.act = {
              kind: "footwork",
              name: disp,
              t: 0,
              dur: 0.45,
              pose: (u: number, T: any) => {
                T.lean = u < 0.45 ? 0.2 : -0.22;
                T.crouch = 0.25;
                T.hipR = u < 0.45 ? -0.5 : 0.15;
              },
              end: () => {
                startShot(ME, { name: "ROCKER STEP JUMPER", auto: true, dur: 0.85 });
              },
            };
          } else {
            // SWEEP_RIP_THROUGH
            ME.shield = true;
            baitDefender("lateral", 3.2);
            ME.vel.addScaledVector(f, 6.0).addScaledVector(r, -2.4);
            ME.act = {
              kind: "footwork",
              name: disp,
              t: 0,
              dur: 0.46,
              pose: (u: number, T: any) => {
                T.crouch = 0.34;
                T.lean = 0.28;
                T.twist = -0.6 + u * 1.2;
                T.shR = -0.85;
                T.shL = -0.85;
                T.elR = -0.4;
                T.elL = -0.4;
              },
              end: () => {
                ME.shield = false;
              },
            };
          }
          triggerLabel(disp);
          return;
        }

        // 2. DRIBBLE MOVES & BALL-HANDLING (Perimeter Creation)
        if (OFFENSE_CATEGORIES.dribbling.includes(offMove)) {
          ME.hand = ME.hand === "R" ? "L" : "R";
          Audio.dribble({ pan: clamp(ME.root.position.z / 7.5, -1, 1), vol: 0.9 });
          Audio.squeak({ pan: 0, vol: 0.8 });

          if (offMove === OffenseMove.SPIN_MOVE || offMove === OffenseMove.HALF_SPIN) {
            const isHalf = offMove === OffenseMove.HALF_SPIN;
            if (isHalf) baitDefender("lateral", 3.0);
            ME.vel.addScaledVector(f, isHalf ? 4.4 : 5.4).addScaledVector(r, isHalf ? 1.8 : 0);
            ME.act = {
              kind: "dribble_move",
              name: disp,
              t: 0,
              dur: isHalf ? 0.5 : 0.55,
              pose: (u: number, T: any) => {
                T.lean = 0.25;
                T.crouch = 0.18;
                if (isHalf) {
                  ME.faceYaw += (u < 0.5 ? u * 2 : (1 - u) * 2) * Math.PI * 0.78;
                } else {
                  ME.faceYaw += u * Math.PI * 2;
                }
              },
            };
          } else if (offMove === OffenseMove.SNATCH_BACK) {
            baitDefender("freeze", 3.2);
            ME.vel.addScaledVector(f, -5.6);
            ME.act = {
              kind: "dribble_move",
              name: disp,
              t: 0,
              dur: 0.45,
              pose: (_u: number, T: any) => {
                T.lean = -0.18;
                T.crouch = 0.28;
                T.shR = -1.1;
                T.elR = -1.4;
              },
            };
          } else if (
            offMove === OffenseMove.HESITATION ||
            offMove === OffenseMove.STUTTER_STEP ||
            offMove === OffenseMove.POCKET_DRIBBLE
          ) {
            const isStutter = offMove === OffenseMove.STUTTER_STEP;
            ME.vel.multiplyScalar(0.28);
            baitDefender("freeze", 3.4);
            ME.act = {
              kind: "dribble_move",
              name: disp,
              t: 0,
              dur: 0.44,
              pose: (u: number, T: any) => {
                T.lean = u < 0.5 ? -0.14 : 0.28;
                T.shR = offMove === OffenseMove.POCKET_DRIBBLE ? -0.85 : -1.35;
                T.elR = -1.1;
                if (isStutter) {
                  const chop = Math.sin(u * Math.PI * 6);
                  T.hipR = -0.25 + chop * 0.25;
                  T.hipL = -0.25 - chop * 0.25;
                }
              },
              end: () => {
                ME.vel.addScaledVector(f, 5.8);
              },
            };
          } else if (offMove === OffenseMove.PROTECT_DRIBBLE) {
            ME.shield = true;
            ME.act = {
              kind: "dribble_move",
              name: disp,
              t: 0,
              dur: 0.65,
              pose: (_u: number, T: any) => {
                T.crouch = 0.28;
                T.lean = 0.22;
                T.shL = -1.2;
                T.elL = -1.6;
              },
              end: () => {
                ME.shield = false;
              },
            };
          } else if (offMove === OffenseMove.HOSTAGE_DRIBBLE) {
            ME.offState.hostageT = 1.85;
            ME.offState.hostageTarget = nearestDef;
            ME.vel.multiplyScalar(0.45);
            ME.shield = true;
            ME.act = {
              kind: "dribble_move",
              name: disp,
              t: 0,
              dur: 0.75,
              pose: (_u: number, T: any) => {
                T.crouch = 0.24;
                T.lean = 0.14;
                T.shR = -1.2;
                T.elR = -1.3;
                T.shL = -1.1;
              },
              end: () => {
                ME.shield = false;
              },
            };
          } else if (offMove === OffenseMove.NASH_DRIBBLE) {
            const baselineDir = V(HOOP_X - ME.root.position.x, 0, -ME.root.position.z + (ME.root.position.z >= 0 ? -3.2 : 3.2)).normalize();
            ME.vel.addScaledVector(baselineDir, 6.2);
            ME.act = {
              kind: "dribble_move",
              name: disp,
              t: 0,
              dur: 0.55,
              pose: (_u: number, T: any) => {
                T.crouch = 0.24;
                T.lean = 0.2;
                T.shR = -1.0;
                T.elR = -1.4;
              },
            };
          } else if (offMove === OffenseMove.SPEED_DRIBBLE) {
            ME.vel.addScaledVector(f, 7.6);
            ME.act = {
              kind: "dribble_move",
              name: disp,
              t: 0,
              dur: 0.45,
              pose: (_u: number, T: any) => {
                T.lean = 0.34;
                T.crouch = 0.14;
                T.shR = -1.2;
                T.elR = -0.8;
              },
            };
          } else {
            // CROSSOVER, KILLER_CROSSOVER, BETWEEN_THE_LEGS, BEHIND_THE_BACK, IN_AND_OUT, SHAMMGOD
            const lateralSign = ME.hand === "R" ? 1 : -1;
            const impulse =
              offMove === OffenseMove.KILLER_CROSSOVER || offMove === OffenseMove.SHAMMGOD
                ? 5.6
                : offMove === OffenseMove.IN_AND_OUT
                ? 4.4
                : 3.8;
            if (offMove === OffenseMove.KILLER_CROSSOVER || offMove === OffenseMove.SHAMMGOD) {
              baitDefender("freeze", 3.1);
            } else if (offMove === OffenseMove.IN_AND_OUT) {
              baitDefender("lateral", 3.1);
            }
            ME.vel.addScaledVector(r, lateralSign * impulse);
            ME.vel.addScaledVector(f, 3.1);
            ME.act = {
              kind: "dribble_move",
              name: disp,
              t: 0,
              dur: 0.42,
              pose: (u: number, T: any) => {
                T.crouch = 0.24;
                T.lean = 0.24;
                T.twist = (offMove === OffenseMove.IN_AND_OUT ? -0.35 : 0.35) * Math.sin(u * Math.PI) * lateralSign;
                T.shR = -1.6;
                T.elR = -1.1;
                T.shL = -1.2;
                T.elL = -1.3;
              },
            };
          }
          triggerLabel(disp);
          return;
        }

        // 3. SHOT CREATION & JUMP-SHOOTING FOOTWORK
        if (OFFENSE_CATEGORIES.shooting.includes(offMove)) {
          if (offMove === OffenseMove.STEPBACK_JUMPER || offMove === OffenseMove.FADEAWAY) {
            startShot(ME, { name: disp, stepback: true, auto: true, dur: 1.05 });
          } else if (offMove === OffenseMove.SIDE_STEP_JUMPER || offMove === OffenseMove.DRIFT_JUMPER) {
            ME.vel.addScaledVector(r, (ME.hand === "R" ? 1 : -1) * 4.4);
            startShot(ME, { name: disp, auto: true, dur: 0.95 });
          } else if (offMove === OffenseMove.DIRK_FADEAWAY) {
            ME.vel.addScaledVector(f, -3.5);
            startShot(ME, { name: disp, stepback: true, auto: true, dur: 1.15, style: "dirk", contestFactor: 0.55 });
          } else if (offMove === OffenseMove.TURNAROUND_JUMPER) {
            startShot(ME, { name: disp, stepback: true, auto: true, dur: 1.1, style: "turnaround", contestFactor: 0.72 });
          } else if (offMove === OffenseMove.CATCH_AND_SHOOT) {
            startShot(ME, { name: disp, auto: true, dur: 0.65, releaseAt: 0.25, perfectRelease: true });
          } else {
            // PULL_UP_JUMPER, JUMP_SHOT
            startShot(ME, { name: disp, auto: true, dur: 0.9 });
          }
          return;
        }

        // 4. FINISHING AT THE RIM & PAINT MOVES
        if (OFFENSE_CATEGORIES.finishing.includes(offMove)) {
          const dunksMap: Partial<
            Record<OffenseMove, "tomahawk" | "two_hand" | "windmill" | "reverse" | "cuff" | "alley_oop" | "putback" | "tiki_tiki">
          > = {
            [OffenseMove.TOMAHAWK_DUNK]: "tomahawk",
            [OffenseMove.TWO_HAND_DUNK]: "two_hand",
            [OffenseMove.WINDMILL_DUNK]: "windmill",
            [OffenseMove.REVERSE_DUNK]: "reverse",
            [OffenseMove.BASELINE_CUFF_DUNK]: "cuff",
            [OffenseMove.ALLEY_OOP]: "alley_oop",
            [OffenseMove.PUT_BACK]: "putback",
            [OffenseMove.TIKI_TIKI_SLAM]: "tiki_tiki",
          };
          const dunkStyle = dunksMap[offMove];
          if (dunkStyle) {
            if (dunkStyle === "tiki_tiki" && !careerStatsRef.current.unlockedIds.includes("dunk_tiki_tiki")) {
              triggerMsg("LOCKED: 20 CAREER PTS OR 2 TOUR STOPS", "#f59e0b");
              return;
            }
            ME.vel.addScaledVector(f, dunkStyle === "tiki_tiki" ? 7.6 : 6.4);
            if (dunkStyle === "reverse") ME.vel.addScaledVector(r, 2.2);
            startShot(ME, { dunk: true, dunkStyle, name: disp, auto: true });
          } else if (offMove === OffenseMove.EURO_STEP || offMove === OffenseMove.PINOY_STEP) {
            const isPinoy = offMove === OffenseMove.PINOY_STEP;
            if (isPinoy) baitDefender("jump", 3.4);
            else baitDefender("lateral", 3.2);
            ME.vel.addScaledVector(f, 5.4).addScaledVector(r, -2.6);
            ME.act = {
              kind: "finishing_gather",
              name: disp,
              t: 0,
              dur: 0.44,
              pose: (u: number, T: any) => {
                T.crouch = 0.24;
                T.twist = u < 0.5 ? -0.45 : 0.45;
                if (isPinoy && u < 0.5) {
                  T.shR = -2.4;
                  T.shL = -2.4;
                } else {
                  T.shR = -1.6;
                  T.elR = -1.0;
                }
              },
              end: () => {
                ME.vel.addScaledVector(r, 4.4);
                startShot(ME, { layup: true, name: disp, auto: true, style: "finger_roll" });
              },
            };
          } else if (offMove === OffenseMove.RONDO_FAKE || offMove === OffenseMove.UP_AND_UNDER) {
            baitDefender("jump", 3.4);
            ME.vel.addScaledVector(f, 4.4);
            ME.act = {
              kind: "finishing_gather",
              name: disp,
              t: 0,
              dur: 0.42,
              pose: (u: number, T: any) => {
                if (offMove === OffenseMove.RONDO_FAKE) {
                  T.twist = Math.sin(u * Math.PI) * 1.1;
                  T.shR = -1.1;
                } else {
                  T.shR = -2.4;
                  T.shL = -2.4;
                }
              },
              end: () => {
                ME.vel.addScaledVector(f, 3.2);
                startShot(ME, { layup: true, name: disp, auto: true, style: "scoop" });
              },
            };
          } else if (offMove === OffenseMove.PRO_HOP || offMove === OffenseMove.STRIDE_STOP || offMove === OffenseMove.VEER_FINISH) {
            if (offMove === OffenseMove.VEER_FINISH && nearestDef && nearestDef.root.position.distanceTo(ME.root.position) < 2.2) {
              nearestDef.vel.addScaledVector(r, -3.4);
              ME.vel.addScaledVector(r, 2.8);
            } else {
              ME.vel.addScaledVector(f, 4.8);
            }
            startShot(ME, { layup: true, name: disp, auto: true });
          } else if (offMove === OffenseMove.REVERSE_LAYUP) {
            ME.vel.addScaledVector(f, 5.2).addScaledVector(r, 2.6);
            startShot(ME, { layup: true, name: disp, auto: true, style: "reverse" });
          } else if (offMove === OffenseMove.FINGER_ROLL || offMove === OffenseMove.SCOOP_SHOT) {
            ME.vel.addScaledVector(f, 5.4);
            startShot(ME, { layup: true, name: disp, auto: true, style: "finger_roll" });
          } else {
            // OVERHAND_LAYUP, FLOATER, RUNNER, WRONG_FOOT_LAYUP
            ME.vel.addScaledVector(f, 5.2);
            startShot(ME, { layup: true, name: disp, auto: true, dur: offMove === OffenseMove.FLOATER ? 0.72 : undefined });
          }
          return;
        }

        // 5. POST-UP & INTERIOR MOVES
        if (OFFENSE_CATEGORIES.post_up.includes(offMove)) {
          Audio.squeak({ pan: 0, vol: 0.85 });
          if (offMove === OffenseMove.DEEP_SEAL) {
            ME.offState.postSealT = 2.0;
            ME.shield = true;
            if (nearestDef && nearestDef.root.position.distanceTo(ME.root.position) < 2.2) {
              nearestDef.vel.addScaledVector(f, 3.6);
            }
            ME.act = {
              kind: "post_move",
              name: disp,
              t: 0,
              dur: 0.65,
              pose: (_u: number, T: any) => {
                T.crouch = 0.34;
                T.hipRollR = -0.25;
                T.hipRollL = 0.25;
                T.shR = -1.2;
                T.shL = -1.2;
                T.elR = -1.5;
                T.elL = -1.5;
              },
              end: () => { ME.shield = false; },
            };
          } else if (offMove === OffenseMove.HOOK_SHOT || offMove === OffenseMove.SKY_HOOK) {
            const isSky = offMove === OffenseMove.SKY_HOOK;
            startShot(ME, {
              name: disp,
              auto: true,
              dur: 1.05,
              style: isSky ? "skyhook" : "hook",
              contestFactor: isSky ? 0.48 : 0.7,
            });
          } else if (offMove === OffenseMove.DREAM_SHAKE || offMove === OffenseMove.SHIMMY_FADEAWAY) {
            const isShimmy = offMove === OffenseMove.SHIMMY_FADEAWAY;
            baitDefender(isShimmy ? "freeze" : "jump", 3.5);
            ME.act = {
              kind: "post_move",
              name: disp,
              t: 0,
              dur: 0.52,
              pose: (u: number, T: any) => {
                T.crouch = 0.24;
                T.twist = Math.sin(u * Math.PI * 3) * 0.65;
                T.shR = -1.8;
                T.shL = -1.8;
              },
              end: () => {
                if (isShimmy) {
                  startShot(ME, { name: disp, stepback: true, auto: true, dur: 1.0, style: "turnaround" });
                } else {
                  ME.vel.addScaledVector(f, 5.2);
                  startShot(ME, { layup: true, name: disp, auto: true, style: "scoop" });
                }
              },
            };
          } else if (offMove === OffenseMove.POST_UP_AND_UNDER) {
            baitDefender("jump", 3.5);
            ME.act = {
              kind: "post_move",
              name: disp,
              t: 0,
              dur: 0.44,
              pose: (u: number, T: any) => {
                T.shR = -2.4;
                T.shL = -2.4;
                T.twist = u * 0.8;
              },
              end: () => {
                ME.vel.addScaledVector(f, 5.0);
                startShot(ME, { layup: true, name: disp, auto: true, style: "finger_roll" });
              },
            };
          } else if (offMove === OffenseMove.FACE_UP_JAB) {
            baitDefender("lateral", 3.5);
            ME.vel.addScaledVector(f, 4.6).addScaledVector(r, 2.2);
            ME.act = {
              kind: "post_move",
              name: disp,
              t: 0,
              dur: 0.42,
              pose: (_u: number, T: any) => {
                T.crouch = 0.26;
                T.hipR = -0.45;
                T.shR = -1.4;
              },
            };
          } else {
            // DROP_STEP, POST_SPIN
            ME.vy = 1.8;
            ME.vel.addScaledVector(f, 5.8).addScaledVector(r, 2.4);
            ME.act = {
              kind: "footwork",
              name: disp,
              t: 0,
              dur: 0.55,
              pose: (u: number, T: any) => {
                T.lean = 0.22;
                T.shR = -1.7;
                T.elR = -1.0;
                ME.faceYaw += u * Math.PI;
              },
            };
          }
          triggerLabel(disp);
          return;
        }

        // 7. PASSING & PLAYMAKING MANEUVERS
        if (OFFENSE_CATEGORIES.passing.includes(offMove)) {
          if (activeMates.length === 0) {
            triggerLabel("SOLO COURT - NO TEAMMATE");
            return;
          }
          const sorted = [...activeMates].sort((a, b) =>
            offMove === OffenseMove.SKIP_PASS || offMove === OffenseMove.OUTLET_PASS
              ? b.root.position.distanceTo(ME.root.position) - a.root.position.distanceTo(ME.root.position)
              : a.root.position.distanceTo(ME.root.position) - b.root.position.distanceTo(ME.root.position)
          );
          const target = sorted[0];
          state.lastPasser = ME;
          state.lastPassTime = performance.now();
          const ft =
            offMove === OffenseMove.LOB_PASS || offMove === OffenseMove.OUTLET_PASS
              ? 0.65
              : offMove === OffenseMove.TOUCH_PASS
              ? 0.22
              : offMove === OffenseMove.BOUNCE_PASS || offMove === OffenseMove.POCKET_PASS
              ? 0.38
              : 0.35;
          if (offMove === OffenseMove.NO_LOOK_PASS) {
            ME.faceYaw += 0.95;
          } else if (offMove === OffenseMove.BEHIND_BACK_PASS) {
            ME.act = {
              kind: "pass_wrap",
              name: disp,
              t: 0,
              dur: 0.35,
              pose: (u: number, T: any) => {
                T.twist = Math.sin(u * Math.PI) * 1.25;
                T.shR = -0.8;
              },
            };
          }
          fire(ME, handPos(ME), torsoPos(target), ft, "pass", { passTo: target });
          triggerLabel(disp);
          return;
        }
      } else {
        // DEFENSE MOVES (All 7 Tactical Categories Functional)
        const defMove = move as DefenseMove;
        const meta = getMoveMetadata(defMove);
        const disp = meta.name.toUpperCase();
        const activeOpp = teamB.filter((p) => !p.isBench && p.root.visible);
        const activeMates = teamA.filter((p) => !p.isBench && p.root.visible && p !== ME);
        const ballOwner = (state.owner && !teamA.includes(state.owner) ? state.owner : activeOpp[0]) || teamB[0];
        const ourHoop = V(-HOOP_X, 0, 0);

        const dirTo = (from: THREE.Vector3, to: THREE.Vector3) => {
          const v = V(to.x - from.x, 0, to.z - from.z);
          return v.lengthSq() > 1e-5 ? v.normalize() : V(1, 0, 0);
        };
        const nearestFrom = (list: GameEntity[], refPos: THREE.Vector3) =>
          list.reduce<GameEntity | null>((best, cand) => {
            if (!best) return cand;
            return cand.root.position.distanceTo(refPos) < best.root.position.distanceTo(refPos) ? cand : best;
          }, null);

        const offBallOpp = activeOpp.filter((p) => p !== ballOwner);
        const targetOffBall = nearestFrom(offBallOpp, ME.root.position) || ballOwner;
        const targetPostOpp = nearestFrom(activeOpp, ourHoop) || ballOwner;
        const nearestMate = nearestFrom(activeMates, ME.root.position);
        const ownerDirToHoop = dirTo(ballOwner.root.position, ourHoop);
        const ownerLateral = V(-ownerDirToHoop.z, 0, ownerDirToHoop.x);

        // --- 1. TEAM SCHEMES & PICK-AND-ROLL COVERAGES ---
        if (
          DEFENSE_CATEGORIES.schemes.includes(defMove) ||
          DEFENSE_CATEGORIES.pnr_coverage.includes(defMove)
        ) {
          activeDefenseSchemeRef.current = defMove;
          setActiveDefenseScheme(defMove);
          const nextDef =
            defMove === DefenseMove.FULL_COURT_PRESS ||
            defMove === DefenseMove.BLITZ_TRAP ||
            defMove === DefenseMove.DOUBLE_TEAM ||
            defMove === DefenseMove.RUN_AND_JUMP
              ? "press"
              : defMove === DefenseMove.ZONE_2_3 ||
                defMove === DefenseMove.ZONE_3_2 ||
                defMove === DefenseMove.ZONE_1_3_1 ||
                defMove === DefenseMove.DROP_COVERAGE ||
                defMove === DefenseMove.BOX_AND_ONE ||
                defMove === DefenseMove.TRIANGLE_AND_TWO
              ? "zone"
              : defMove === DefenseMove.ICE_BLUE
              ? "conservative"
              : "lockdown";
          const nextTactics = { ...tacticsRef.current, defense: nextDef as any };
          tacticsRef.current = nextTactics;
          setTactics(nextTactics);

          // Immediate live physical & assignment execution for PnR / Scheme calls
          if (
            defMove === DefenseMove.SWITCH ||
            defMove === DefenseMove.SCRAM_SWITCH ||
            defMove === DefenseMove.VEER_SWITCH ||
            defMove === DefenseMove.SLIP_LATE_SWITCH
          ) {
            if (defMove === DefenseMove.SCRAM_SWITCH) {
              const bigMate =
                activeMates.find((m) => m.pos === "C" || m.pos === "PF") ||
                nearestFrom(activeMates, ourHoop);
              if (bigMate) {
                swapDefenderMatchups(ME, bigMate);
                bigMate.vel.addScaledVector(dirTo(bigMate.root.position, targetPostOpp.root.position), 5.5);
              }
            } else if (defMove === DefenseMove.VEER_SWITCH) {
              if (nearestMate) {
                swapDefenderMatchups(ME, nearestMate);
                ME.vel.addScaledVector(dirTo(ME.root.position, targetPostOpp.root.position), 5.8);
                nearestMate.vel.addScaledVector(dirTo(nearestMate.root.position, ballOwner.root.position), 5.8);
              }
            } else {
              const swapMate = nearestMate || activeMates[0];
              if (swapMate) {
                swapDefenderMatchups(ME, swapMate);
                swapMate.vel.addScaledVector(dirTo(swapMate.root.position, ballOwner.root.position), 5.0);
              }
            }
            ME.act = {
              kind: "def_stance",
              name: disp,
              t: 0,
              dur: 0.45,
              pose: (_u: number, T: any) => {
                T.crouch = 0.24;
                T.shR = -1.6;
                T.shL = -1.2;
                T.shRollL = 0.6;
              },
            };
          } else if (defMove === DefenseMove.OVER_SCREEN) {
            const topSpot = ballOwner.root.position.clone().addScaledVector(ownerDirToHoop, 1.05);
            ME.vel.addScaledVector(dirTo(ME.root.position, topSpot), 6.5);
            ME.defState.contestT = 0.7;
            ME.act = {
              kind: "def_stance",
              name: disp,
              t: 0,
              dur: 0.48,
              pose: (_u: number, T: any) => {
                T.crouch = 0.25;
                T.lean = 0.24;
                T.shR = -2.2;
                T.shL = -1.3;
              },
            };
          } else if (defMove === DefenseMove.UNDER_SCREEN) {
            const underSpot = ballOwner.root.position.clone().addScaledVector(ownerDirToHoop, 2.35);
            ME.vel.addScaledVector(dirTo(ME.root.position, underSpot), 6.2);
            ME.act = {
              kind: "def_stance",
              name: disp,
              t: 0,
              dur: 0.48,
              pose: (_u: number, T: any) => {
                T.crouch = 0.34;
                T.lean = 0.14;
                T.shR = -0.9;
                T.shL = -0.9;
              },
            };
          } else if (defMove === DefenseMove.HARD_HEDGE || defMove === DefenseMove.SOFT_HEDGE) {
            const isHard = defMove === DefenseMove.HARD_HEDGE;
            const hedgeSpot = ballOwner.root.position.clone().addScaledVector(ownerDirToHoop, 1.25);
            ME.vel.addScaledVector(dirTo(ME.root.position, hedgeSpot), isHard ? 7.2 : 4.8);
            if (isHard && ME.root.position.distanceTo(ballOwner.root.position) < 2.6) {
              ballOwner.vel.multiplyScalar(0.25);
            }
            ME.defState.recoverTarget = {
              x: clamp(targetPostOpp.root.position.x - 1.1, -13, 13),
              z: targetPostOpp.root.position.z,
            };
            ME.act = {
              kind: "def_stance",
              name: disp,
              t: 0,
              dur: isHard ? 0.6 : 0.45,
              pose: (u: number, T: any) => {
                T.crouch = 0.28;
                T.shR = -1.8;
                T.shL = -1.8;
                T.shRollR = -0.55;
                T.shRollL = 0.55;
                if (u > 0.65 && ME.defState.recoverTarget) {
                  ME.vel.addScaledVector(
                    dirTo(ME.root.position, V(ME.defState.recoverTarget.x, 0, ME.defState.recoverTarget.z)),
                    0.55
                  );
                }
              },
            };
          } else if (defMove === DefenseMove.DROP_COVERAGE || defMove === DefenseMove.ICE_BLUE) {
            const sideSign = ballOwner.root.position.z >= 0 ? 1 : -1;
            if (defMove === DefenseMove.ICE_BLUE) {
              ME.vel.addScaledVector(V(0, 0, sideSign), 4.5);
              if (ME.root.position.distanceTo(ballOwner.root.position) < 2.3) {
                ballOwner.vel.z += sideSign * 3.2;
              }
            } else {
              ME.vel.addScaledVector(dirTo(ME.root.position, V(-10.4, 0, 0)), 5.4);
            }
            ME.defState.stanceActive = true;
            ME.defState.stanceT = 2.0;
          } else if (
            defMove === DefenseMove.BLITZ_TRAP ||
            defMove === DefenseMove.DOUBLE_TEAM ||
            defMove === DefenseMove.RUN_AND_JUMP
          ) {
            const trappers = activeMates.filter((m) => m !== ME);
            const secondTrapper = nearestFrom(trappers, ballOwner.root.position);
            ME.vel.addScaledVector(dirTo(ME.root.position, ballOwner.root.position), 7.2);
            if (secondTrapper) {
              secondTrapper.vel.addScaledVector(dirTo(secondTrapper.root.position, ballOwner.root.position), 7.8);
            }
            ME.defState.passLaneHunterT = 1.1;
            ME.defState.passLaneMode = "deflect";
            ME.act = {
              kind: "def_stance",
              name: disp,
              t: 0,
              dur: 0.6,
              pose: (_u: number, T: any) => {
                T.crouch = 0.25;
                T.shR = -2.1;
                T.shL = -2.1;
                T.shRollR = -0.65;
                T.shRollL = 0.65;
              },
            };
          } else if (defMove === DefenseMove.LOCK_AND_TRAIL || defMove === DefenseMove.TOP_LOCK) {
            const topOff =
              defMove === DefenseMove.TOP_LOCK
                ? targetOffBall.root.position.clone().add(V(0, 0, targetOffBall.root.position.z > 0 ? -1.1 : 1.1))
                : targetOffBall.root.position.clone().addScaledVector(dirTo(targetOffBall.root.position, ourHoop), 0.9);
            ME.vel.addScaledVector(dirTo(ME.root.position, topOff), 6.8);
            ME.defState.passLaneHunterT = 1.2;
            ME.defState.passLaneMode = "deflect";
          }

          Audio.squeak({ pan: 0, vol: 0.75 });
          triggerLabel(`DEF: ${disp}`);
          triggerMsg(disp, "#ef4444");
          return;
        }

        // --- 2. FOUNDATIONAL FOOTWORK & STANCE ---
        if (defMove === DefenseMove.DEFENSIVE_STANCE) {
          ME.defState.stanceActive = !ME.defState.stanceActive;
          ME.defState.stanceT = ME.defState.stanceActive ? 8.0 : 0;
          ME.defState.passLaneHunterT = ME.defState.stanceActive ? 1.2 : 0;
          ME.defState.passLaneMode = "deflect";
          ME.act = {
            kind: "def_stance",
            name: disp,
            t: 0,
            dur: 0.5,
            pose: (_u: number, T: any) => {
              T.crouch = 0.3;
              T.lean = 0.16;
              T.hipR = -0.45;
              T.hipL = -0.45;
              T.kneeR = 0.78;
              T.kneeL = 0.78;
              T.hipRollR = -0.2;
              T.hipRollL = 0.2;
              T.shR = -2.35;
              T.elR = -0.35;
              T.shL = -1.1;
              T.elL = -0.65;
              T.shRollL = 0.78;
            },
          };
          Audio.squeak({ pan: 0, vol: 0.8 });
          triggerLabel(ME.defState.stanceActive ? "DEFENSIVE STANCE ON" : "STANCE RELEASED");
          return;
        }

        if (defMove === DefenseMove.DEFENSIVE_SLIDE) {
          const slideSign = Math.sign(ME.vel.dot(ownerLateral)) || ME.defState.shadingSide || 1;
          ME.vel.copy(ownerLateral).multiplyScalar(slideSign * 7.2);
          ME.defState.stanceT = 1.6;
          ME.faceYaw = Math.atan2(ballOwner.root.position.x - ME.root.position.x, ballOwner.root.position.z - ME.root.position.z);
          ME.act = {
            kind: "def_stance",
            name: disp,
            t: 0,
            dur: 0.45,
            pose: (u: number, T: any) => {
              const shuf = Math.sin(u * Math.PI * 3);
              T.crouch = 0.28;
              T.lean = 0.16;
              T.hipR = -0.42;
              T.hipL = -0.42;
              T.kneeR = 0.72;
              T.kneeL = 0.72;
              T.hipRollR = -0.18 - Math.max(0, shuf) * 0.2;
              T.hipRollL = 0.18 + Math.max(0, -shuf) * 0.2;
              T.shR = -1.3;
              T.shL = -1.3;
              T.shRollR = -0.52;
              T.shRollL = 0.52;
            },
          };
          Audio.squeak({ pan: 0, vol: 0.85 });
          triggerLabel(disp);
          return;
        }

        if (defMove === DefenseMove.DROP_STEP_SWING) {
          const cutoffSpot = ballOwner.root.position.clone().addScaledVector(ownerDirToHoop, 1.85);
          ME.vel.copy(dirTo(ME.root.position, cutoffSpot)).multiplyScalar(8.4);
          ME.act = {
            kind: "def_stance",
            name: disp,
            t: 0,
            dur: 0.46,
            pose: (u: number, T: any) => {
              T.crouch = 0.26;
              T.pelvYaw = Math.sin(u * Math.PI) * 0.85;
              T.twist = -Math.sin(u * Math.PI) * 0.45;
              T.hipR = -0.5;
              T.kneeR = 0.8;
              T.shR = -1.4;
              T.shL = -1.0;
            },
          };
          Audio.squeak({ pan: 0, vol: 0.9 });
          triggerLabel(disp);
          return;
        }

        if (defMove === DefenseMove.SPRINT_TO_SLIDE) {
          const recoverySpot = ballOwner.root.position.clone().addScaledVector(ownerDirToHoop, 1.75);
          ME.vel.copy(dirTo(ME.root.position, recoverySpot)).multiplyScalar(10.6);
          ME.defState.stanceT = 2.0;
          ME.act = {
            kind: "def_stance",
            name: disp,
            t: 0,
            dur: 0.65,
            pose: (u: number, T: any) => {
              if (u < 0.55) {
                const stride = Math.sin(u * Math.PI * 6);
                T.lean = 0.34;
                T.hipR = -stride * 0.72;
                T.hipL = stride * 0.72;
                T.kneeR = 0.75;
                T.kneeL = 0.75;
                T.shR = stride * 0.8;
                T.shL = -stride * 0.8;
              } else {
                T.crouch = 0.3;
                T.lean = 0.14;
                T.hipRollR = -0.22;
                T.hipRollL = 0.22;
                T.shR = -1.6;
                T.shL = -1.4;
                T.shRollR = -0.45;
                T.shRollL = 0.45;
                ME.vel.multiplyScalar(0.88);
              }
            },
          };
          Audio.squeak({ pan: 0, vol: 0.88 });
          triggerLabel(disp);
          return;
        }

        if (defMove === DefenseMove.CLOSEOUT) {
          const closeoutSpot = ballOwner.root.position.clone().addScaledVector(ownerDirToHoop, 1.35);
          ME.vel.copy(dirTo(ME.root.position, closeoutSpot)).multiplyScalar(9.6);
          ME.defState.contestT = 1.05;
          ME.defState.contestLevel = 0.9;
          ME.act = {
            kind: "def_stance",
            name: disp,
            t: 0,
            dur: 0.62,
            pose: (u: number, T: any) => {
              if (u >= 0.48) {
                // Choppy stutter steps braking before shooter's landing space
                ME.vel.multiplyScalar(0.82);
                const chop = Math.sin(u * Math.PI * 10);
                T.crouch = 0.26;
                T.lean = 0.08;
                T.hipR = -0.35 + chop * 0.18;
                T.hipL = -0.35 - chop * 0.18;
                T.kneeR = 0.65;
                T.kneeL = 0.65;
              } else {
                T.lean = 0.28;
              }
              T.shR = -2.85;
              T.elR = -0.22;
              T.shL = -1.2;
            },
          };
          Audio.squeak({ pan: 0, vol: 0.9 });
          triggerLabel(disp);
          return;
        }

        // --- 3. ON-BALL PERIMETER MOVES ---
        if (defMove === DefenseMove.SHADING_FORCING) {
          ME.defState.shadingSide *= -1;
          ME.defState.shadingT = 1.6;
          const shadeSpot = ballOwner.root.position
            .clone()
            .addScaledVector(ownerDirToHoop, 1.1)
            .addScaledVector(ownerLateral, ME.defState.shadingSide * 0.85);
          ME.vel.copy(dirTo(ME.root.position, shadeSpot)).multiplyScalar(7.6);
          if (ME.root.position.distanceTo(ballOwner.root.position) < 2.2) {
            ballOwner.vel.addScaledVector(ownerLateral, -ME.defState.shadingSide * 2.8);
          }
          ME.act = {
            kind: "def_stance",
            name: disp,
            t: 0,
            dur: 0.5,
            pose: (_u: number, T: any) => {
              T.crouch = 0.26;
              T.pelvYaw = ME.defState.shadingSide * 0.45;
              T.shR = -1.5;
              T.shL = -1.2;
              T.shRollR = -0.5;
              T.shRollL = 0.5;
            },
          };
          Audio.squeak({ pan: 0, vol: 0.8 });
          triggerLabel(ME.defState.shadingSide > 0 ? "SHADE BASELINE" : "FORCE WEAK HAND");
          return;
        }

        if (defMove === DefenseMove.HAND_CHECK_ARM_BAR) {
          ME.defState.handCheckT = 1.25;
          const barSpot = ballOwner.root.position.clone().addScaledVector(ownerDirToHoop, 0.95);
          ME.vel.copy(dirTo(ME.root.position, barSpot)).multiplyScalar(7.4);
          if (ME.root.position.distanceTo(ballOwner.root.position) < 2.0) {
            ballOwner.vel.multiplyScalar(0.55);
          }
          ME.act = {
            kind: "def_stance",
            name: disp,
            t: 0,
            dur: 0.55,
            pose: (_u: number, T: any) => {
              T.crouch = 0.26;
              T.lean = 0.18;
              T.shL = -1.25;
              T.elL = -1.6; // bent legal forearm bar
              T.shR = -1.0;
              T.elR = -0.9;
            },
          };
          Audio.squeak({ pan: 0, vol: 0.78 });
          triggerLabel(disp);
          return;
        }

        if (defMove === DefenseMove.STUNT_DIG) {
          ME.defState.recoverTarget = { x: targetOffBall.root.position.x - 1.2, z: targetOffBall.root.position.z };
          const toBall = dirTo(ME.root.position, ballOwner.root.position);
          ME.vel.copy(toBall).multiplyScalar(8.4);
          if (ME.root.position.distanceTo(ballOwner.root.position) < 3.2 && state.owner === ballOwner) {
            ballOwner.vel.multiplyScalar(0.2);
            if (Math.random() < 0.35) {
              state.owner = null;
              state.ballMode = "loose";
              state.ballVel.set(rnd(2.5), 1.6, rnd(2.5));
              triggerMsg("STUNT STRIP!", "#10b981");
            }
          }
          ME.act = {
            kind: "def_reach",
            name: disp,
            t: 0,
            dur: 0.48,
            pose: (u: number, T: any) => {
              if (u < 0.5) {
                T.crouch = 0.28;
                T.lean = 0.34;
                T.shR = -1.7;
                T.elR = -0.2;
              } else {
                T.lean = -0.05;
                T.shR = -0.5;
                if (ME.defState.recoverTarget) {
                  ME.vel.copy(
                    dirTo(ME.root.position, V(ME.defState.recoverTarget.x, 0, ME.defState.recoverTarget.z))
                  ).multiplyScalar(8.8);
                }
              }
            },
          };
          Audio.squeak({ pan: 0, vol: 0.85 });
          triggerLabel(disp);
          return;
        }

        if (defMove === DefenseMove.HIP_RIDE) {
          ME.defState.hipRideTarget = ballOwner;
          ME.defState.hipRideT = 1.25;
          ME.defState.contestT = 1.1;
          ME.defState.contestLevel = 0.65;
          const hipSpot = ballOwner.root.position.clone().addScaledVector(ownerLateral, 0.85);
          ME.vel.copy(dirTo(ME.root.position, hipSpot)).multiplyScalar(8.6);
          ME.act = {
            kind: "def_stance",
            name: disp,
            t: 0,
            dur: 0.75,
            pose: (_u: number, T: any) => {
              T.crouch = 0.24;
              T.lean = 0.2;
              T.shL = -1.25;
              T.elL = -1.5;
              T.shR = -1.85;
            },
          };
          Audio.squeak({ pan: 0, vol: 0.85 });
          triggerLabel(disp);
          return;
        }

        if (defMove === DefenseMove.WALL_UP) {
          // Pure verticality jump near rim with both arms straight up, zero foul
          ME.vel.set(0, 0, 0);
          if (ME.h <= 0.05) ME.vy = 4.35;
          ME.defState.verticalWallT = 0.95;
          ME.defState.contestT = 0.95;
          ME.defState.contestLevel = 1.0;
          ME.act = {
            kind: "def_contest",
            name: disp,
            t: 0,
            dur: 0.65,
            pose: (_u: number, T: any) => {
              T.lean = -0.04;
              T.shR = -3.05;
              T.shL = -3.05;
              T.elR = -0.06;
              T.elL = -0.06;
            },
          };
          if (state.ballMode === "flight" && state.flight?.kind === "shot" && ME.root.position.distanceTo(ball.position) < 2.55) {
            triggerShotBlock(ME, "VERTICAL WALL-UP!");
            return;
          }
          triggerLabel(disp);
          return;
        }

        if (defMove === DefenseMove.SHOT_CONTEST) {
          ME.defState.contestT = 1.15;
          ME.defState.contestLevel = 1.0;
          const contestSpot = ballOwner.root.position.clone().addScaledVector(ownerDirToHoop, 1.15);
          ME.vel.copy(dirTo(ME.root.position, contestSpot)).multiplyScalar(5.8);
          ME.act = {
            kind: "def_contest",
            name: disp,
            t: 0,
            dur: 0.6,
            pose: (_u: number, T: any) => {
              T.crouch = 0.08;
              T.shR = -2.95;
              T.elR = -0.15;
              T.shL = -1.0;
            },
          };
          if (state.ballMode === "flight" && state.flight?.kind === "shot" && ME.root.position.distanceTo(ball.position) < 2.35) {
            triggerShotBlock(ME, "CONTESTED SWAT!");
            return;
          }
          triggerLabel(disp);
          return;
        }

        if (defMove === DefenseMove.CHASE_DOWN_BLOCK) {
          const chaseTarget = state.ballMode === "flight" ? ball.position : ballOwner.root.position;
          ME.vel.copy(dirTo(ME.root.position, chaseTarget)).multiplyScalar(11.4);
          if (ME.h <= 0.05) ME.vy = 4.95;
          ME.defState.contestT = 0.9;
          ME.defState.contestLevel = 1.0;
          ME.act = {
            kind: "def_contest",
            name: disp,
            t: 0,
            dur: 0.65,
            pose: (_u: number, T: any) => {
              T.lean = 0.25;
              T.shR = -3.08;
              T.shL = -2.1;
              T.elR = -0.08;
            },
          };
          if (state.ballMode === "flight" && state.flight?.kind === "shot" && ME.root.position.distanceTo(ball.position) < 2.95) {
            triggerShotBlock(ME, "CHASE-DOWN BLOCK!");
            return;
          }
          Audio.squeak({ pan: 0, vol: 0.92 });
          triggerLabel(disp);
          return;
        }

        if (defMove === DefenseMove.PULL_CHAIR_PERIMETER || defMove === DefenseMove.PULL_CHAIR_POST) {
          const isPost = defMove === DefenseMove.PULL_CHAIR_POST;
          const nearbyAttacker = nearestFrom(activeOpp, ME.root.position);
          ME.defState.pullChairWindowT = 0.85;
          ME.defState.pullChairKind = isPost ? "post" : "perimeter";
          ME.vel.copy(dirTo(ballOwner.root.position, ME.root.position)).multiplyScalar(5.8);
          if (nearbyAttacker && ME.root.position.distanceTo(nearbyAttacker.root.position) < 2.45) {
            const atkSpeed = Math.hypot(nearbyAttacker.vel.x, nearbyAttacker.vel.z);
            if (isPost || atkSpeed > 2.2 || state.owner === nearbyAttacker) {
              triggerStumbleTurnover(
                nearbyAttacker,
                ME,
                isPost ? "PULLED THE CHAIR! TRAVEL!" : "PULLED THE CHAIR!"
              );
              return;
            }
          }
          ME.act = {
            kind: "def_stance",
            name: disp,
            t: 0,
            dur: 0.5,
            pose: (u: number, T: any) => {
              T.crouch = u < 0.35 ? 0.3 : 0.14;
              T.lean = u < 0.35 ? 0.2 : -0.22;
              T.shR = -1.2;
              T.shL = -1.2;
            },
          };
          Audio.squeak({ pan: 0, vol: 0.82 });
          triggerLabel(disp);
          return;
        }

        if (defMove === DefenseMove.POKE_STEAL) {
          if (
            !state.owner &&
            (state.ballMode === "loose" ||
              (state.ballMode === "dead" && state.deadReason === "score") ||
              (state.ballMode === "flight" && isNearHoop(ball.position) && ball.position.y < 3.45)) &&
            ME.root.position.distanceTo(ball.position) < 4.0
          ) {
            scoopBall();
            return;
          }
          if (ballOwner && ballOwner.root.visible) {
            const toOwner = dirTo(ME.root.position, ballOwner.root.position);
            ME.vel.addScaledVector(toOwner, 6.8);
            const dist = ME.root.position.distanceTo(ballOwner.root.position);
            const nearHoop = isNearHoop(ballOwner.root.position) || isNearHoop(ball.position);
            const exposedDribble = Boolean(ballOwner.act && (ballOwner.act.kind === "dribble_move" || ballOwner.act.kind === "footwork"));
            const stripChance = exposedDribble ? 0.94 : 0.82;
            if (dist < (nearHoop ? 2.85 : 2.65) && state.owner === ballOwner) {
              if (nearHoop || dist < 1.9 || Math.random() < stripChance) {
                state.owner = ME;
                state.ballMode = "dribble";
                state.flight = null;
                state.deadT = 0;
                state.deadReason = null;
                state.fastTransitionT = 3.6;
                state.prevPossessionTeam = "Home";
                matchExtraStatsRef.current.steals++;
                Audio.squeak({ pan: clamp(ME.root.position.z / 7.5, -1, 1), vol: 0.9, entityKey: "me" });
                Audio.crowdReaction({ vol: 0.92 });
                Audio.commentary("steal");
                triggerMsg(nearHoop ? "STOLE FROM HOOP!" : "POKE-CHECK STRIP!", "#10b981");
                return;
              }
            }
          }
          ME.act = {
            kind: "def_reach",
            name: disp,
            t: 0,
            dur: 0.4,
            pose: (_u: number, T: any) => {
              T.crouch = 0.25;
              T.lean = 0.35;
              T.shR = -1.6;
              T.elR = -0.2;
            },
          };
          triggerLabel(disp);
          return;
        }

        if (defMove === DefenseMove.GLOVE_RIP_STRIP) {
          if (
            !state.owner &&
            (state.ballMode === "loose" ||
              (state.ballMode === "dead" && state.deadReason === "score") ||
              (state.ballMode === "flight" && isNearHoop(ball.position) && ball.position.y < 3.45)) &&
            ME.root.position.distanceTo(ball.position) < 4.0
          ) {
            scoopBall();
            return;
          }
          ME.defState.gloveRipT = 0.45;
          if (ballOwner && ballOwner.root.visible) {
            const toOwner = dirTo(ME.root.position, ballOwner.root.position);
            ME.vel.addScaledVector(toOwner, 7.8);
            const dist = ME.root.position.distanceTo(ballOwner.root.position);
            if (dist < 2.85 && state.owner === ballOwner && (dist < 2.2 || !ballOwner.shield || Math.random() < 0.88)) {
              state.owner = ME;
              state.ballMode = "dribble";
              state.flight = null;
              state.deadT = 0;
              state.deadReason = null;
              state.fastTransitionT = 3.6;
              state.prevPossessionTeam = "Home";
              matchExtraStatsRef.current.steals++;
              Audio.squeak({ pan: clamp(ME.root.position.z / 7.5, -1, 1), vol: 0.92, entityKey: "me" });
              Audio.crowdReaction({ vol: 0.94 });
              Audio.commentary("steal");
              triggerMsg("GLOVE RIP STEAL!", "#10b981");
              return;
            }
          }
          ME.act = {
            kind: "def_reach",
            name: disp,
            t: 0,
            dur: 0.42,
            pose: (u: number, T: any) => {
              const snap = Math.sin(u * Math.PI);
              T.crouch = 0.28;
              T.lean = 0.38 * snap;
              T.shR = -1.75 - snap * 0.45;
              T.shL = -1.45 - snap * 0.35;
              T.elR = -0.25;
              T.elL = -0.4;
            },
          };
          Audio.squeak({ pan: 0, vol: 0.86 });
          triggerLabel("GLOVE RIP!");
          return;
        }

        if (defMove === DefenseMove.VOLLEY_SWAT_BLOCK) {
          ME.defState.volleySwatT = 0.65;
          ME.defState.contestT = 1.0;
          ME.defState.contestLevel = 1.0;
          if (ME.h <= 0.06) ME.vy = 5.55;
          const swatTarget = state.ballMode === "flight" ? ball.position : ballOwner.root.position;
          ME.vel.copy(dirTo(ME.root.position, swatTarget)).multiplyScalar(8.6);
          ME.act = {
            kind: "def_contest",
            name: disp,
            t: 0,
            dur: 0.62,
            pose: (_u: number, T: any) => {
              T.lean = 0.14;
              T.shR = -3.12;
              T.shL = -3.12;
              T.elR = -0.05;
              T.elL = -0.05;
            },
          };
          if (state.ballMode === "flight" && state.flight?.kind === "shot" && ME.root.position.distanceTo(ball.position) < 3.25) {
            triggerShotBlock(ME, "VOLLEY SWAT REJECTION!");
            state.ballVel.x = 7.5;
            return;
          }
          Audio.squeak({ pan: 0, vol: 0.9 });
          triggerLabel("VOLLEY SWAT!");
          return;
        }

        if (defMove === DefenseMove.BASELINE_TRAP_CUTOFF) {
          ME.defState.cutoffClampT = 1.35;
          ME.defState.stanceActive = true;
          ME.defState.stanceT = 1.5;
          const sideSign = ballOwner.root.position.z >= 0 ? 1 : -1;
          const trapSpot = V(
            clamp(ballOwner.root.position.x - 1.05, -13.2, 13.2),
            0,
            clamp(ballOwner.root.position.z + sideSign * 0.72, -6.9, 6.9)
          );
          ME.vel.copy(dirTo(ME.root.position, trapSpot)).multiplyScalar(9.6);
          if (ME.root.position.distanceTo(ballOwner.root.position) < 2.4) {
            ballOwner.vel.multiplyScalar(0.32);
            ballOwner.currentStamina = Math.max(0, (ballOwner.currentStamina ?? STAMINA_SETTINGS.maxStamina) - 10);
            ballOwner.stamina = getStaminaNormalized(ballOwner);
          }
          ME.act = {
            kind: "def_stance",
            name: disp,
            t: 0,
            dur: 0.58,
            pose: (_u: number, T: any) => {
              T.crouch = 0.3;
              T.pelvYaw = sideSign * 0.5;
              T.shR = -1.65;
              T.shL = -1.65;
              T.shRollR = -0.68;
              T.shRollL = 0.68;
            },
          };
          Audio.squeak({ pan: 0, vol: 0.88 });
          triggerLabel("BASELINE CUTOFF TRAP!");
          return;
        }

        // --- 4. OFF-BALL & PASSING LANE MOVES ---
        if (
          defMove === DefenseMove.BALL_YOU_MAN ||
          defMove === DefenseMove.FULL_DENIAL ||
          defMove === DefenseMove.THREE_QUARTER_DENIAL ||
          defMove === DefenseMove.GAP_HELP ||
          defMove === DefenseMove.HELP_AND_RECOVER ||
          defMove === DefenseMove.X_OUT_ROTATION
        ) {
          if (defMove === DefenseMove.BALL_YOU_MAN) {
            const triSpot = V(
              targetOffBall.root.position.x * 0.62 + ball.position.x * 0.38 - 0.5,
              0,
              targetOffBall.root.position.z * 0.62 + ball.position.z * 0.38
            );
            ME.vel.copy(dirTo(ME.root.position, triSpot)).multiplyScalar(7.6);
            ME.defState.stanceT = 1.4;
          } else if (defMove === DefenseMove.FULL_DENIAL || defMove === DefenseMove.THREE_QUARTER_DENIAL) {
            const isFull = defMove === DefenseMove.FULL_DENIAL;
            const laneSpot = targetOffBall.root.position
              .clone()
              .addScaledVector(dirTo(targetOffBall.root.position, ball.position), isFull ? 0.85 : 0.7)
              .addScaledVector(ownerLateral, isFull ? 0 : 0.45);
            ME.vel.copy(dirTo(ME.root.position, laneSpot)).multiplyScalar(8.4);
            ME.defState.passLaneHunterT = 1.5;
            ME.defState.passLaneMode = isFull ? "intercept" : "deflect";
          } else if (defMove === DefenseMove.GAP_HELP) {
            const nailSpot = V(-8.5, 0, clamp(ball.position.z * 0.35, -2.6, 2.6));
            ME.vel.copy(dirTo(ME.root.position, nailSpot)).multiplyScalar(8.0);
            ME.defState.stanceT = 1.6;
          } else if (defMove === DefenseMove.HELP_AND_RECOVER) {
            const paintStopSpot = ballOwner.root.position.clone().addScaledVector(ownerDirToHoop, 1.4);
            ME.defState.recoverTarget = { x: targetOffBall.root.position.x - 1.1, z: targetOffBall.root.position.z };
            ME.vel.copy(dirTo(ME.root.position, paintStopSpot)).multiplyScalar(9.6);
            ME.defState.contestT = 0.85;
            ME.act = {
              kind: "def_stance",
              name: disp,
              t: 0,
              dur: 0.72,
              pose: (u: number, T: any) => {
                T.crouch = 0.24;
                T.shR = -2.4;
                T.shL = -1.6;
                if (u > 0.58 && ME.defState.recoverTarget) {
                  ME.vel.copy(
                    dirTo(ME.root.position, V(ME.defState.recoverTarget.x, 0, ME.defState.recoverTarget.z))
                  ).multiplyScalar(9.2);
                }
              },
            };
            Audio.squeak({ pan: 0, vol: 0.85 });
            triggerLabel(disp);
            return;
          } else if (defMove === DefenseMove.X_OUT_ROTATION) {
            // Scramble rotation: shift AI teammate assignments & sprint to corners/wings
            if (activeMates.length >= 2) {
              swapDefenderMatchups(activeMates[0], activeMates[1]);
              activeMates.forEach((mate, idx) => {
                const mOpp = getMatchupForDefender(mate, activeOpp);
                if (mOpp) {
                  mate.vel.addScaledVector(dirTo(mate.root.position, mOpp.root.position), 8.2 + idx * 0.3);
                }
              });
            }
            ME.vel.copy(dirTo(ME.root.position, V(-11.0, 0, ball.position.z > 0 ? -5.8 : 5.8))).multiplyScalar(9.6);
          }

          ME.act = {
            kind: "def_stance",
            name: disp,
            t: 0,
            dur: 0.55,
            pose: (_u: number, T: any) => {
              T.crouch = 0.26;
              T.shR = -1.8;
              T.shL = -1.5;
              T.shRollR = -0.55;
              T.shRollL = 0.55;
            },
          };
          Audio.squeak({ pan: 0, vol: 0.82 });
          triggerLabel(disp);
          return;
        }

        if (defMove === DefenseMove.CHARGE_DRAW) {
          ME.vel.set(0, 0, 0);
          ME.defState.chargePlantedT = 1.65;
          ME.faceYaw = Math.atan2(ballOwner.root.position.x - ME.root.position.x, ballOwner.root.position.z - ME.root.position.z);
          ME.act = {
            kind: "def_charge",
            name: disp,
            t: 0,
            dur: 1.1,
            lock: true,
            pose: (_u: number, T: any) => {
              T.crouch = 0.18;
              T.lean = -0.05;
              T.shR = -0.95;
              T.shL = -0.95;
              T.elR = -1.85;
              T.elL = -1.85;
            },
          };
          const distFromRim = Math.hypot(ME.root.position.x + HOOP_X, ME.root.position.z);
          triggerLabel(distFromRim > 1.35 ? "CHARGE SET — FEET PLANTED!" : "WARNING: INSIDE RESTRICTED ARC");
          return;
        }

        if (defMove === DefenseMove.DEFLECTION || defMove === DefenseMove.JUMP_PASSING_LANE) {
          const isIntercept = defMove === DefenseMove.JUMP_PASSING_LANE;
          ME.defState.passLaneHunterT = 1.25;
          ME.defState.passLaneMode = isIntercept ? "intercept" : "deflect";
          if (state.ballMode === "flight" && state.flight?.kind === "pass") {
            ME.vel.copy(dirTo(ME.root.position, ball.position)).multiplyScalar(isIntercept ? 10.8 : 8.5);
            if (ME.root.position.distanceTo(ball.position) < 2.95) {
              if (isIntercept) {
                state.owner = ME;
                state.ballMode = "dribble";
                state.flight = null;
                state.fastTransitionT = 3.6;
                state.prevPossessionTeam = "Home";
                matchExtraStatsRef.current.steals++;
                Audio.catchBall({ pan: 0, vol: 0.9 });
                Audio.commentary("steal");
                triggerMsg("LANE INTERCEPTED!", "#10b981");
              } else {
                state.flight = null;
                state.ballMode = "loose";
                state.ballVel.set(rnd(3.2), 2.3, rnd(3.2));
                Audio.dribble({ pan: 0, vol: 0.9 });
                triggerMsg("PASS DEFLECTED!", "#38bdf8");
              }
              return;
            }
          } else {
            const laneMid = V(
              (ballOwner.root.position.x + targetOffBall.root.position.x) * 0.5,
              0,
              (ballOwner.root.position.z + targetOffBall.root.position.z) * 0.5
            );
            ME.vel.copy(dirTo(ME.root.position, laneMid)).multiplyScalar(isIntercept ? 9.4 : 7.0);
          }
          ME.act = {
            kind: "def_reach",
            name: disp,
            t: 0,
            dur: 0.5,
            pose: (_u: number, T: any) => {
              T.crouch = 0.22;
              T.lean = 0.25;
              T.shR = -2.1;
              T.shL = -1.9;
              T.shRollR = -0.65;
              T.shRollL = 0.65;
            },
          };
          Audio.squeak({ pan: 0, vol: 0.82 });
          triggerLabel(disp);
          return;
        }

        // --- 5. INTERIOR & POST DEFENSE MOVES ---
        if (
          defMove === DefenseMove.FRONT_POST ||
          defMove === DefenseMove.THREE_QUARTER_FRONT ||
          defMove === DefenseMove.POST_SWIM_DENIAL ||
          defMove === DefenseMove.PUSH_OFF_SPOT ||
          defMove === DefenseMove.DIG_DOWN ||
          defMove === DefenseMove.WEAK_SIDE_RIM_PROTECTION
        ) {
          if (defMove === DefenseMove.FRONT_POST || defMove === DefenseMove.THREE_QUARTER_FRONT) {
            const isFullFront = defMove === DefenseMove.FRONT_POST;
            const postFrontSpot = targetPostOpp.root.position
              .clone()
              .addScaledVector(dirTo(targetPostOpp.root.position, ball.position), isFullFront ? 0.95 : 0.75)
              .addScaledVector(ownerLateral, isFullFront ? 0 : 0.55);
            ME.vel.copy(dirTo(ME.root.position, postFrontSpot)).multiplyScalar(8.2);
            ME.defState.passLaneHunterT = 1.4;
            ME.defState.passLaneMode = isFullFront ? "intercept" : "deflect";
          } else if (defMove === DefenseMove.POST_SWIM_DENIAL) {
            const frontSpot = targetPostOpp.root.position
              .clone()
              .addScaledVector(dirTo(targetPostOpp.root.position, ball.position), 1.0);
            ME.vel.copy(dirTo(ME.root.position, frontSpot)).multiplyScalar(9.0);
            ME.defState.passLaneHunterT = 1.1;
            ME.act = {
              kind: "def_stance",
              name: disp,
              t: 0,
              dur: 0.52,
              pose: (u: number, T: any) => {
                T.twist = Math.sin(u * Math.PI) * 0.9;
                T.shR = -3.1 * Math.sin(u * Math.PI);
                T.elR = -0.4;
                T.crouch = 0.22;
              },
            };
            Audio.squeak({ pan: 0, vol: 0.85 });
            triggerLabel(disp);
            return;
          } else if (defMove === DefenseMove.PUSH_OFF_SPOT) {
            const pushDir = dirTo(ourHoop, targetPostOpp.root.position);
            ME.vel.copy(dirTo(ME.root.position, targetPostOpp.root.position)).multiplyScalar(7.5);
            if (ME.root.position.distanceTo(targetPostOpp.root.position) < 2.35) {
              targetPostOpp.root.position.x = clamp(targetPostOpp.root.position.x + pushDir.x * 1.35, -13.5, 13.5);
              targetPostOpp.root.position.z = clamp(targetPostOpp.root.position.z + pushDir.z * 1.35, -7.1, 7.1);
              targetPostOpp.vel.addScaledVector(pushDir, 3.2);
            }
            ME.act = {
              kind: "def_stance",
              name: disp,
              t: 0,
              dur: 0.55,
              pose: (_u: number, T: any) => {
                T.crouch = 0.35;
                T.lean = 0.25;
                T.shR = -1.2;
                T.shL = -1.2;
                T.elR = -1.4;
                T.elL = -1.4;
              },
            };
            Audio.squeak({ pan: 0, vol: 0.88 });
            triggerLabel(disp);
            return;
          } else if (defMove === DefenseMove.DIG_DOWN) {
            ME.defState.recoverTarget = { x: targetOffBall.root.position.x - 1.2, z: targetOffBall.root.position.z };
            ME.vel.copy(dirTo(ME.root.position, ballOwner.root.position)).multiplyScalar(9.0);
            if (ME.root.position.distanceTo(ballOwner.root.position) < 2.95 && state.owner === ballOwner) {
              state.owner = null;
              state.ballMode = "loose";
              state.ballVel.set(rnd(2.6), 1.8, rnd(2.6));
              Audio.crowdReaction({ vol: 0.86 });
              triggerMsg("POST DIG STRIP!", "#10b981");
              return;
            }
          } else if (defMove === DefenseMove.WEAK_SIDE_RIM_PROTECTION) {
            const rimSpot = V(-11.2, 0, 0);
            ME.vel.copy(dirTo(ME.root.position, rimSpot)).multiplyScalar(10.2);
            if (ME.h <= 0.05) ME.vy = 4.6;
            ME.defState.verticalWallT = 0.9;
            ME.defState.contestT = 0.95;
            ME.defState.contestLevel = 1.0;
            ME.act = {
              kind: "def_contest",
              name: disp,
              t: 0,
              dur: 0.6,
              pose: (_u: number, T: any) => {
                T.shR = -3.0;
                T.shL = -2.8;
                T.elR = -0.15;
                T.elL = -0.25;
              },
            };
            if (state.ballMode === "flight" && state.flight?.kind === "shot" && ME.root.position.distanceTo(ball.position) < 2.65) {
              triggerShotBlock(ME, "WEAK-SIDE BLOCK!");
              return;
            }
            Audio.squeak({ pan: 0, vol: 0.88 });
            triggerLabel(disp);
            return;
          }

          ME.act = {
            kind: "def_stance",
            name: disp,
            t: 0,
            dur: 0.55,
            pose: (_u: number, T: any) => {
              T.crouch = 0.28;
              T.shR = -1.75;
              T.shL = -1.45;
              T.elR = -0.7;
            },
          };
          Audio.squeak({ pan: 0, vol: 0.82 });
          triggerLabel(disp);
          return;
        }

        // --- 6. REBOUNDING MOVES ---
        if (
          defMove === DefenseMove.BOX_OUT ||
          defMove === DefenseMove.SWIM_SPIN_COUNTER ||
          defMove === DefenseMove.WEDGE_CRASH
        ) {
          const rebOpp = nearestFrom(activeOpp, ourHoop) || ballOwner;
          if (defMove === DefenseMove.BOX_OUT) {
            ME.defState.boxOutT = 1.5;
            const sealSpot = rebOpp.root.position.clone().addScaledVector(dirTo(rebOpp.root.position, ourHoop), 0.85);
            ME.vel.copy(dirTo(ME.root.position, sealSpot)).multiplyScalar(7.4);
            if (ME.root.position.distanceTo(rebOpp.root.position) < 2.8) {
              const pushAway = dirTo(ourHoop, rebOpp.root.position);
              rebOpp.root.position.x = clamp(rebOpp.root.position.x + pushAway.x * 0.9, -13.5, 13.5);
              rebOpp.root.position.z = clamp(rebOpp.root.position.z + pushAway.z * 0.9, -7.1, 7.1);
              rebOpp.vel.multiplyScalar(0.2);
            }
            ME.act = {
              kind: "def_stance",
              name: disp,
              t: 0,
              dur: 0.65,
              pose: (u: number, T: any) => {
                T.crouch = 0.34;
                T.pelvYaw = Math.min(1, u * 2.5) * Math.PI * 0.75;
                T.shR = -1.0;
                T.shL = -1.0;
                T.elR = -1.4;
                T.elL = -1.4;
                T.shRollR = -0.5;
                T.shRollL = 0.5;
              },
            };
          } else if (defMove === DefenseMove.SWIM_SPIN_COUNTER) {
            ME.defState.boxOutT = 1.25;
            ME.vel.copy(dirTo(ME.root.position, V(-HOOP_X + 1.2, 0, 0))).multiplyScalar(8.6);
            ME.act = {
              kind: "def_stance",
              name: disp,
              t: 0,
              dur: 0.52,
              pose: (u: number, T: any) => {
                ME.faceYaw += u * Math.PI * 1.4;
                T.shR = -2.8 * Math.sin(u * Math.PI);
                T.twist = Math.sin(u * Math.PI) * 0.8;
                T.crouch = 0.22;
              },
            };
          } else {
            // WEDGE_CRASH
            ME.defState.boxOutT = 1.4;
            const wedgeSpot = V(-12.7, 0, clamp(rebOpp.root.position.z, -2.5, 2.5));
            ME.vel.copy(dirTo(ME.root.position, wedgeSpot)).multiplyScalar(8.4);
            if (ME.root.position.distanceTo(rebOpp.root.position) < 2.6) {
              rebOpp.root.position.x = clamp(rebOpp.root.position.x - 1.1, -13.6, 13.6);
              rebOpp.vel.set(0, 0, 0);
            }
            ME.act = {
              kind: "def_stance",
              name: disp,
              t: 0,
              dur: 0.6,
              pose: (_u: number, T: any) => {
                T.crouch = 0.32;
                T.lean = 0.28;
                T.shR = -1.1;
                T.shL = -1.1;
                T.elR = -1.5;
                T.elL = -1.5;
              },
            };
          }
          Audio.squeak({ pan: 0, vol: 0.85 });
          triggerLabel(disp);
          return;
        }
      }
    };

    // --- HIGHLIGHTS ROLLING CAPTURE & REPLAY HELPERS ---
    const rollingFrames: HighlightFrame[] = [];
    let lastSnapshotAt = 0;
    let lastMpSyncAt = 0;
    const remoteDrivenEntities = new Set<GameEntity>();

    const captureCurrentFrame = (tNow: number): HighlightFrame => ({
      t: tNow,
      ballPos: [ball.position.x, ball.position.y, ball.position.z],
      actors: entities.map((p, idx) => ({
        idx,
        x: p.root.position.x,
        y: p.root.position.y,
        z: p.root.position.z,
        yaw: p.root.rotation.y,
        pelvisY: p.pelvis.position.y,
        hipR: p.legs.R.hip.rotation.x,
        hipL: p.legs.L.hip.rotation.x,
        kneeR: p.legs.R.knee.rotation.x,
        kneeL: p.legs.L.knee.rotation.x,
        shR: p.arms.R.sh.rotation.x,
        shL: p.arms.L.sh.rotation.x,
        elR: p.arms.R.el.rotation.x,
        elL: p.arms.L.el.rotation.x,
        lean: p.torso.rotation.x,
        visible: p.root.visible,
      })),
    });

    const startHighlightPlayback = (
      clips: HighlightClip[],
      postAction: "next_quarter" | "end_match" | "close_only",
      qCompleted: number,
      isEnd: boolean
    ) => {
      if (!clips || clips.length === 0) return;
      replayClipsRef.current = clips;
      replayClipIndexRef.current = 0;
      replayProgressRef.current = 0;
      pendingPostHighlightActionRef.current = postAction;
      isHighlightReplayRef.current = true;
      setHighlightClips(clips);
      setActiveHighlightIndex(0);
      setHighlightQuarterCompleted(qCompleted);
      setHighlightIsEndOfMatch(isEnd);
      setShowHighlights(true);
    };

    const finishHighlightPlayback = (action: "next_quarter" | "end_match" | "close_only") => {
      isHighlightReplayRef.current = false;
      setShowHighlights(false);
      // Reset court entity poses cleanly after replay scrubbing
      if (action === "next_quarter") {
        const prevQ = state.quarter;
        state.quarter += 1;
        state.gameClock = quarterLengthRef.current;
        quarterHighlightsRef.current = [];
        setQuarter(state.quarter);
        setGameClock(quarterLengthRef.current);
        resetStartersAndBench();
        state.owner = ME;
        state.ballMode = "dribble";
        state.shotClock = resetShotClock("quarter_start");
        setShotClock(24);
        triggerMsg(`QUARTER ${state.quarter}`, "#ffd166");
        Audio.commentary("quarter", state.quarter);
        if (prevQ === 2 && !mpRoomRef.current) {
          pendingPostBroadcastActionRef.current = "none";
          setBroadcastScene({
            stage: "halftime",
            homeTeamName: studioCustomRef.current.teamName,
            awayTeamName: currentCity.teamName,
            homeAbbr: studioCustomRef.current.teamAbbr,
            awayAbbr: currentCity.name.slice(0, 3).toUpperCase(),
            homeColor: studioCustomRef.current.primaryColor,
            awayColor: currentCity.jerseyPrimary,
            scoreHome: state.scoreHome,
            scoreAway: state.scoreAway,
            arenaName: currentCity.arenaName,
            startersHome: teamA.slice(0, 5).map((p) => p.name),
            startersAway: teamB.slice(0, 5).map((p) => p.name),
            potgName: ME.name,
            potgLine: `${ME.stats.pts} PTS · ${ME.stats.reb} REB · ${ME.stats.ast} AST`,
            interviewQuestion: "",
            interviewOptions: [],
          });
        }
      } else if (action === "end_match") {
        endGameAndRecordStats();
      } else {
        resetStartersAndBench();
        state.owner = ME;
        state.ballMode = "dribble";
      }
    };

    const completeQuarter = () => {
      if (state.isGameOver || isHighlightReplayRef.current) return;
      const isFinalQuarter = state.quarter >= 4;
      Audio.buzzer(isFinalQuarter ? "game" : "quarter");
      const clipsToPlay =
        quarterHighlightsRef.current.length > 0
          ? [...quarterHighlightsRef.current]
          : [...allHighlightsRef.current];

      if (mpClientRef.current?.roomCode) {
        mpClientRef.current.sendEvent("quarter_end", { quarter: state.quarter });
      }

      if (clipsToPlay.length > 0) {
        triggerMsg(`END OF Q${state.quarter} · HIGHLIGHTS`, "#f59e0b");
        startHighlightPlayback(
          clipsToPlay.slice(-3),
          isFinalQuarter ? "end_match" : "next_quarter",
          state.quarter,
          isFinalQuarter
        );
      } else {
        finishHighlightPlayback(isFinalQuarter ? "end_match" : "next_quarter");
      }
    };

    const isMpGuestSession = () => {
      const r = mpRoomRef.current;
      const c = mpClientRef.current;
      return Boolean(r && c && c.transport !== "disconnected" && r.hostId && r.hostId !== c.playerId);
    };

    const isMirrorPerspective = () => {
      const r = mpRoomRef.current;
      const c = mpClientRef.current;
      if (!r || !c) return false;
      return r.players[c.playerId]?.team === "Away";
    };

    const getOwnerEntityKey = (ent: GameEntity | null): string | null => {
      if (!ent) return null;
      const mirror = isMirrorPerspective();
      const idxA = teamA.indexOf(ent);
      if (idxA !== -1) return `${mirror ? "Away" : "Home"}:${idxA}`;
      const idxB = teamB.indexOf(ent);
      if (idxB !== -1) return `${mirror ? "Home" : "Away"}:${idxB}`;
      return null;
    };

    const resolveEntityByKey = (key: string | null | undefined): GameEntity | null => {
      if (!key) return null;
      const [rawTeam, rawIdx] = key.split(":");
      const idx = parseInt(rawIdx || "0", 10);
      if (Number.isNaN(idx) || idx < 0 || idx >= 5) return null;
      const mirror = isMirrorPerspective();
      const isLocalHome = mirror ? rawTeam === "Away" : rawTeam === "Home";
      return isLocalHome ? teamA[idx] || teamA[0] : teamB[idx] || teamB[0];
    };

    const remoteBallSync = {
      pos: V(0, 1.2, 0),
      vel: V(0, 0, 0),
      mode: "dribble",
      ownerPlayerId: null as string | null,
      ownerKey: null as string | null,
      updatedAt: 0,
    };

    const resolvePeerEntityMap = (room: MultiplayerRoomState, myPlayerId: string): Map<string, GameEntity> => {
      const mapping = new Map<string, GameEntity>();
      const mirror = room.players[myPlayerId]?.team === "Away";
      const homeNonMeSlots = teamA.filter((p) => !p.isBench && p !== ME);
      const awaySlots = teamB.filter((p) => !p.isBench);
      const peers = Object.values(room.players)
        .filter((p) => p.playerId !== myPlayerId)
        .sort((a, b) => a.slotIndex - b.slotIndex || a.playerId.localeCompare(b.playerId));

      let hFallback = 0;
      let aFallback = 0;
      for (const peer of peers) {
        const localIsHomeTeam = mirror ? peer.team === "Away" : peer.team === "Home";
        if (localIsHomeTeam) {
          const preferred = teamA[peer.slotIndex];
          const ent =
            preferred && !preferred.isBench && preferred !== ME && !Array.from(mapping.values()).includes(preferred)
              ? preferred
              : homeNonMeSlots.find((s) => !Array.from(mapping.values()).includes(s)) || homeNonMeSlots[hFallback++];
          if (ent) mapping.set(peer.playerId, ent);
        } else {
          const preferred = teamB[peer.slotIndex];
          const ent =
            preferred && !preferred.isBench && !Array.from(mapping.values()).includes(preferred)
              ? preferred
              : awaySlots.find((s) => !Array.from(mapping.values()).includes(s)) || awaySlots[aFallback++];
          if (ent) mapping.set(peer.playerId, ent);
        }
      }
      return mapping;
    };

    const applyRemoteMatchPatch = (match: Partial<MatchSyncState>) => {
      const room = mpRoomRef.current;
      const client = mpClientRef.current;
      if (!room || !client || client.transport === "disconnected") return;
      if (!room.hostId || room.hostId === client.playerId) return;

      const mirror = isMirrorPerspective();
      const nextHome = mirror ? match.scoreAway : match.scoreHome;
      const nextAway = mirror ? match.scoreHome : match.scoreAway;
      if (typeof nextHome === "number" && nextHome !== state.scoreHome) {
        state.scoreHome = nextHome;
        setScoreHome(nextHome);
      }
      if (typeof nextAway === "number" && nextAway !== state.scoreAway) {
        state.scoreAway = nextAway;
        setScoreAway(nextAway);
      }
      if (typeof match.quarter === "number" && match.quarter !== state.quarter) {
        state.quarter = match.quarter;
        setQuarter(match.quarter);
      }
      if (typeof match.gameClock === "number") {
        const nextClock = Math.max(0, Math.ceil(match.gameClock));
        if (Math.ceil(state.gameClock) !== nextClock) {
          state.gameClock = nextClock;
          setGameClock(nextClock);
        }
      }
      if (typeof match.shotClock === "number") {
        state.shotClock = match.shotClock;
      }
      if (match.cityId && match.cityId !== currentCity.id) {
        const c = getCityById(String(match.cityId));
        setSelectedCity(c);
        applyCity(c);
      }
      if (match.ballPos && match.ballPos.length === 3) {
        const sign = mirror ? -1 : 1;
        remoteBallSync.pos.set(match.ballPos[0] * sign, match.ballPos[1], match.ballPos[2] * sign);
        if (match.ballVel && match.ballVel.length === 3) {
          remoteBallSync.vel.set(match.ballVel[0] * sign, match.ballVel[1], match.ballVel[2] * sign);
        }
        if (match.ballMode) {
          remoteBallSync.mode = match.ballMode;
        }
        if (match.ownerPlayerId !== undefined) {
          remoteBallSync.ownerPlayerId = match.ownerPlayerId;
        }
        if (match.ownerEntityKey !== undefined) {
          remoteBallSync.ownerKey = match.ownerEntityKey;
        }
        remoteBallSync.updatedAt = performance.now();
      }
    };

    const applyRemoteRoomSnapshot = (room: MultiplayerRoomState) => {
      if (!room) return;
      applyRemoteMatchPatch(room.match);
    };

    const applyRemoteMatchEvent = (event: any, match: any) => {
      if (!event || !mpClientRef.current) return;
      if (event.playerId === mpClientRef.current.playerId) return;
      const mirror = isMirrorPerspective();

      if (event.type === "basket_scored" && match) {
        const nextHome = mirror ? match.scoreAway : match.scoreHome;
        const nextAway = mirror ? match.scoreHome : match.scoreAway;
        if (typeof nextHome === "number") {
          state.scoreHome = nextHome;
          setScoreHome(nextHome);
        }
        if (typeof nextAway === "number") {
          state.scoreAway = nextAway;
          setScoreAway(nextAway);
        }
        if (typeof match.shotClock === "number") {
          state.shotClock = match.shotClock;
          setShotClockResetPulse((k) => k + 1);
        }
        Audio.netSwish({ pan: 0, vol: 0.9 });
        Audio.crowdScream({ vol: 0.9 });
        triggerMsg(String(event.payload?.playType || "BUCKET!"), "#38bdf8");
      } else if (event.type === "city_change" && event.payload?.cityId) {
        const c = getCityById(String(event.payload.cityId));
        setSelectedCity(c);
        applyCity(c);
      } else if (event.type === "mode_change" && event.payload?.mode) {
        const nextMode = event.payload.mode as GameMode;
        setGameMode(nextMode);
        gameModeRef.current = nextMode;
        setShowSummary(false);
        setShowHighlights(false);
        setShowMeter(false);
        applyGameMode(nextMode);
      } else if (event.type === "tip_off") {
        setShowTipOff(false);
        const ownerKey = String(event.payload?.ownerEntityKey || "Home:0");
        const localUserWon = mirror ? ownerKey.startsWith("Away:") : ownerKey.startsWith("Home:");
        if (gameRef.current?.executeTipOff) {
          gameRef.current.executeTipOff(localUserWon);
        }
      } else if (event.type === "quarter_end" && typeof event.payload?.quarter === "number") {
        const q = Number(event.payload.quarter);
        if (q >= 4 && !state.isGameOver) {
          endGameAndRecordStats();
        } else if (state.quarter <= q) {
          state.quarter = q + 1;
          state.gameClock = quarterLengthRef.current;
          setQuarter(state.quarter);
          setGameClock(quarterLengthRef.current);
          triggerMsg(`QUARTER ${state.quarter}`, "#ffd166");
        }
      } else if (event.type === "reset_match") {
        applyGameMode(gameModeRef.current);
      } else if (event.type === "match_finished") {
        if (match) {
          const nextHome = mirror ? match.scoreAway : match.scoreHome;
          const nextAway = mirror ? match.scoreHome : match.scoreAway;
          if (typeof nextHome === "number") {
            state.scoreHome = nextHome;
            setScoreHome(nextHome);
          }
          if (typeof nextAway === "number") {
            state.scoreAway = nextAway;
            setScoreAway(nextAway);
          }
        }
        if (!state.isGameOver) {
          endGameAndRecordStats();
        }
      } else if (event.type === "move_executed" && !isMpGuestSession()) {
        // Host executes forwarded guest shot/pass/scoop in authoritative simulation
        const room = mpRoomRef.current;
        const client = mpClientRef.current;
        if (!room || !client) return;
        const map = resolvePeerEntityMap(room, client.playerId);
        const actor = map.get(String(event.playerId));
        if (!actor) return;
        const p = event.payload || {};
        if (p.action === "shot" && Array.isArray(p.from) && Array.isArray(p.aim)) {
          fire(
            actor,
            V(Number(p.from[0]), Number(p.from[1]), Number(p.from[2])),
            V(Number(p.aim[0]), Number(p.aim[1]), Number(p.aim[2])),
            clamp(Number(p.ft || 0.8), 0.25, 2.5),
            "shot",
            { pts: Number(p.pts || 2), dunk: !!p.dunk, layup: !!p.layup, fromRemote: true }
          );
        } else if (p.action === "pass" && Array.isArray(p.from) && Array.isArray(p.aim)) {
          const passTo = resolveEntityByKey(String(p.targetKey || "")) || teamA[0];
          fire(
            actor,
            V(Number(p.from[0]), Number(p.from[1]), Number(p.from[2])),
            V(Number(p.aim[0]), Number(p.aim[1]), Number(p.aim[2])),
            clamp(Number(p.ft || 0.36), 0.2, 1.5),
            "pass",
            { passTo, fromRemote: true }
          );
        } else if (p.action === "scoop") {
          if (actor.root.position.distanceTo(ball.position) < 5.0) {
            state.owner = actor;
            state.ballMode = "dribble";
            state.flight = null;
            state.deadT = 0;
            state.deadReason = null;
          }
        }
      }
    };

    gameRef.current = {
      state,
      entities,
      ball,
      camera,
      renderer,
      scene,
      teamA,
      teamB,
      ME,
      applyCustomization,
      applyAthleteProfile,
      applyStudioCustomToScene,
      applyArenaLighting,
      applyGameMode,
      applyCity,
      executeMove,
      substitute,
      Audio,
      triggerMsg,
      triggerLabel,
      scoopBall,
      startHighlightPlayback,
      finishHighlightPlayback,
      completeQuarter,
      setReplayClipIndex: (index: number) => {
        if (replayClipsRef.current.length === 0) return;
        const safe = ((index % replayClipsRef.current.length) + replayClipsRef.current.length) % replayClipsRef.current.length;
        replayClipIndexRef.current = safe;
        replayProgressRef.current = 0;
        setActiveHighlightIndex(safe);
      },
      replayCurrentClip: () => {
        replayProgressRef.current = 0;
      },
      applyRemoteRoomSnapshot,
      applyRemoteMatchPatch,
      applyRemoteMatchEvent,
      resetShotClock: (reason = "shot_attempt") => {
        state.shotClock = resetShotClock(reason as any);
        setShotClockResetPulse(k => k + 1);
        setLastShotResetReason(reason);
        Audio.shotResetSound();
      },
      executeTipOff: (userWon: boolean) => {
        Audio.whistle();
        Audio.speak(userWon ? "Tip off won! Your team has first possession!" : "Tip off won by opponents!");
        triggerMsg(userWon ? "TIP OFF WON - YOUR POSSESSION!" : "OPPONENT WINS TIP OFF!", userWon ? "#10b981" : "#ef4444");

        if (userWon) {
          state.owner = ME;
          state.ballMode = "dribble";
          ME.root.position.set(-2, 0, 0);
        } else {
          state.owner = teamB[0];
          state.ballMode = "dribble";
          teamB[0].root.position.set(2, 0, 0);
        }
        state.shotClock = resetShotClock("quarter_start");
        setShotClockResetPulse(k => k + 1);
      },
      playerController: {
        onSprintButtonDown: (active = true) => {
          state.touchButtons.RT = active;
          if (active) state.touchPulses.RT = true;
        },
        onShootButton: () => {
          Audio.unlock();
          if (state.owner === ME) {
            if (!ME.act) startShot(ME);
            else if (ME.act.kind === "shot" && !ME.act.released && !ME.act.auto) {
              releaseShot(ME, ME.act, false);
            }
          } else {
            const distBall = ME.root.position.distanceTo(ball.position);
            if (distBall < 4.5 && (state.ballMode === "loose" || state.flight?.reboundable || (isNearHoop(ball.position) && ball.position.y < 3.45))) {
              scoopBall();
            } else {
              if (ME.h <= 0.08) ME.vy = Math.max(ME.vy, 4.9);
              executeMove(state.flight?.kind === "shot" ? DefenseMove.BOX_OUT : DefenseMove.SHOT_CONTEST);
            }
          }
        },
        onPassButton: () => {
          Audio.unlock();
          if (state.owner === ME) {
            const teammates = teamA.filter((p) => !p.isBench && p !== ME);
            if (teammates.length > 0) {
              const openPick = findOpenTeammate(ME, teammates, teamB, HOOP_X);
              const target = openPick ? openPick.mate : teammates[0];
              state.lastPasser = ME;
              state.lastPassTime = performance.now();
              fire(ME, handPos(ME), torsoPos(target), 0.36, "pass", { passTo: target });
            }
          } else if (state.owner && teamA.includes(state.owner) && state.ballMode === "dribble") {
            const holder = state.owner;
            state.lastPasser = holder;
            state.lastPassTime = performance.now();
            fire(holder, handPos(holder), torsoPos(ME), 0.36, "pass", { passTo: ME });
            triggerLabel("CALL FOR PASS");
          } else {
            executeMove(DefenseMove.SWITCH);
          }
        },
        onCrossoverButton: () => {
          Audio.unlock();
          if (state.owner === ME) {
            executeMove(state.touchButtons.RT || state.keys["ShiftLeft"] ? OffenseMove.KILLER_CROSSOVER : OffenseMove.CROSSOVER);
          } else {
            executeMove(state.touchButtons.RT || state.keys["ShiftLeft"] ? DefenseMove.STUNT_DIG : DefenseMove.SHADING_FORCING);
          }
        },
        onDunkButton: () => {
          Audio.unlock();
          if (state.owner === ME) {
            const canTiki =
              careerStatsRef.current.equippedSignatureDunk === "dunk_tiki_tiki" &&
              careerStatsRef.current.unlockedIds.includes("dunk_tiki_tiki");
            executeMove(
              canTiki
                ? OffenseMove.TIKI_TIKI_SLAM
                : state.touchButtons.RT || state.keys["ShiftLeft"]
                ? OffenseMove.TWO_HAND_DUNK
                : OffenseMove.TOMAHAWK_DUNK
            );
          } else {
            const distBall = ME.root.position.distanceTo(ball.position);
            if (distBall < 4.2 && (state.ballMode === "loose" || state.flight?.reboundable)) {
              scoopBall();
              return;
            }
            const ballOwner = state.owner && !teamA.includes(state.owner) ? state.owner : null;
            const distOwnHoop = Math.hypot(ME.root.position.x + HOOP_X, ME.root.position.z);
            if (ME.h <= 0.08) ME.vy = Math.max(ME.vy, 5.2);
            if (ballOwner && ME.root.position.x > ballOwner.root.position.x + 0.65) {
              executeMove(DefenseMove.CHASE_DOWN_BLOCK);
            } else if (distOwnHoop < 4.4) {
              executeMove(DefenseMove.WALL_UP);
            } else {
              executeMove(DefenseMove.SHOT_CONTEST);
            }
          }
        },
        onDefenseButtonToggle: (defendingState?: boolean) => {
          Audio.unlock();
          const next = typeof defendingState === "boolean" ? defendingState : !state.uiDefenseToggle;
          state.uiDefenseToggle = next;
          state.isDefending = next;
          if (state.owner !== ME) {
            ME.defState.stanceActive = next;
            if (next) executeMove(DefenseMove.DEFENSIVE_STANCE);
          }
          if (isUiDefendingRef.current !== next) {
            isUiDefendingRef.current = next;
            setIsUiDefending(next);
          }
          triggerLabel(next ? "DEFENSE STANCE ON" : "DEFENSE STANCE OFF");
        },
        // Expanded Offensive Actions
        onSpinButton: () => {
          executeMove(state.touchButtons.RT || state.keys["ShiftLeft"] ? OffenseMove.SHAMMGOD : OffenseMove.SPIN_MOVE);
        },
        onBehindBackButton: () => {
          executeMove(state.touchButtons.RT || state.keys["ShiftLeft"] ? OffenseMove.BETWEEN_THE_LEGS : OffenseMove.BEHIND_THE_BACK);
        },
        onStepbackButton: () => {
          executeMove(state.touchButtons.RT || state.keys["ShiftLeft"] ? OffenseMove.SNATCH_BACK : OffenseMove.STEPBACK_JUMPER);
        },
        onFakeJabButton: () => {
          executeMove(state.touchButtons.RT || state.keys["ShiftLeft"] ? OffenseMove.JAB_STEP : OffenseMove.PUMP_FAKE);
        },
        onLobPassButton: () => {
          executeMove(OffenseMove.LOB_PASS);
        },
        onProtectHookButton: () => {
          const hoopX = teamA.includes(ME) ? HOOP_X : -HOOP_X;
          const dHoop = Math.hypot(ME.root.position.x - hoopX, ME.root.position.z);
          executeMove(dHoop < 5.5 ? OffenseMove.HOOK_SHOT : OffenseMove.PROTECT_DRIBBLE);
        },
        onCallPlayButton: () => {
          executeMove(state.touchButtons.RT || state.keys["ShiftLeft"] ? OffenseMove.GIVE_AND_GO : OffenseMove.PICK_AND_ROLL);
        },
        // Expanded Defensive Actions
        onBlockButton: () => {
          const distBall = ME.root.position.distanceTo(ball.position);
          if (distBall < 4.2 && (state.ballMode === "loose" || state.flight?.reboundable)) {
            scoopBall();
            return;
          }
          const ballOwner = state.owner && !teamA.includes(state.owner) ? state.owner : null;
          const distOwnHoop = Math.hypot(ME.root.position.x + HOOP_X, ME.root.position.z);
          if (ME.h <= 0.08) ME.vy = Math.max(ME.vy, 5.2);
          if (ballOwner && ME.root.position.x > ballOwner.root.position.x + 0.65) {
            executeMove(DefenseMove.CHASE_DOWN_BLOCK);
          } else if (distOwnHoop < 4.4) {
            executeMove(DefenseMove.WALL_UP);
          } else {
            executeMove(DefenseMove.SHOT_CONTEST);
          }
        },
        onStealButton: () => {
          const distBall = ME.root.position.distanceTo(ball.position);
          if (distBall < 4.5 && (state.ballMode === "loose" || (state.owner && !teamA.includes(state.owner) && isNearHoop(ball.position)))) {
            scoopBall();
            return;
          }
          executeMove(state.touchButtons.RT || state.keys["ShiftLeft"] ? DefenseMove.JUMP_PASSING_LANE : DefenseMove.POKE_STEAL);
        },
        onContestButton: () => {
          const distBall = ME.root.position.distanceTo(ball.position);
          if (distBall < 4.2 && state.ballMode === "loose") {
            scoopBall();
            return;
          }
          if (ME.h <= 0.08) ME.vy = Math.max(ME.vy, 4.7);
          executeMove(state.flight?.kind === "shot" ? DefenseMove.BOX_OUT : DefenseMove.CLOSEOUT);
        },
        onShadeButton: () => {
          executeMove(state.touchButtons.RT || state.keys["ShiftLeft"] ? DefenseMove.STUNT_DIG : DefenseMove.SHADING_FORCING);
        },
        onBoxOutButton: () => {
          executeMove(state.touchButtons.RT || state.keys["ShiftLeft"] ? DefenseMove.WEDGE_CRASH : DefenseMove.BOX_OUT);
        },
        onChargeButton: () => {
          const distOwnHoop = Math.hypot(ME.root.position.x + HOOP_X, ME.root.position.z);
          executeMove(state.touchButtons.RT || state.keys["ShiftLeft"] ? (distOwnHoop < 5.5 ? DefenseMove.PULL_CHAIR_POST : DefenseMove.PULL_CHAIR_PERIMETER) : DefenseMove.CHARGE_DRAW);
        },
        onTrapPressButton: () => {
          executeMove(state.touchButtons.RT || state.keys["ShiftLeft"] ? DefenseMove.FULL_COURT_PRESS : DefenseMove.BLITZ_TRAP);
        },
        onHedgeRideButton: () => {
          executeMove(state.touchButtons.RT || state.keys["ShiftLeft"] ? DefenseMove.HAND_CHECK_ARM_BAR : DefenseMove.HIP_RIDE);
        },
        onSwitchDefenseButton: () => {
          executeMove(DefenseMove.SWITCH);
        },
        onZoneHelpButton: () => {
          executeMove(state.touchButtons.RT || state.keys["ShiftLeft"] ? DefenseMove.ZONE_2_3 : DefenseMove.HELP_AND_RECOVER);
        },
      },
      playerStamina: {
        consumeStamina: (wantsToSprint: boolean, dt = MOVEMENT_SETTINGS.fixedStep) =>
          consumeStamina(ME, wantsToSprint, dt),
        handleStaminaRecovery: (dt = MOVEMENT_SETTINGS.fixedStep, isActivelySprinting = false) =>
          handleStaminaRecovery(ME, isActivelySprinting, dt),
        getStaminaNormalized: () => getStaminaNormalized(ME),
        getCurrentStamina: () => ME.currentStamina,
        getMaxStamina: () => ME.maxStamina,
        isExhausted: () => ME.isExhausted,
      },
      endMatch: endGameAndRecordStats,
    };

    // --- POST-PROCESSING BROADCAST PIPELINE & LOOP ---
    const broadcastComposer: BroadcastComposerPipeline | null = isSoftwareGl
      ? null
      : createBroadcastComposer(renderer, scene, camera);
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let softwareTimerId = 0;
    let isUnmounted = false;
    let prevInput: any = {};
    let lastOpenCallMs = 0;
    // Interactive Drag-to-Orbit & Scroll-to-Zoom Camera State (tight player-follow framing)
    let orbitTheta = 1.48;
    let orbitPhi = 0.96;
    let orbitRadius = window.innerWidth < window.innerHeight ? 17.5 : 13.5;
    let orbitPointerId: number | null = null;
    let orbitLastX = 0;
    let orbitLastY = 0;

    const onKeyDown = (e: any) => {
      state.keys[e.code] = true;
      Audio.unlock();
      if (!e.repeat && (e.code === "Escape" || e.code === "KeyM")) {
        setShowMainMenu((prev) => !prev);
      }
    };
    const onKeyUp = (e: any) => { state.keys[e.code] = false; };
    const onWindowBlur = () => {
      state.keys = {};
      state.touchButtons = {};
      state.touchPulses = {};
      state.joystick = { x: 0, y: 0, active: false, autoSprint: false };
      orbitPointerId = null;
    };
    window.addEventListener("keydown", onKeyDown); window.addEventListener("keyup", onKeyUp); window.addEventListener("blur", onWindowBlur);

    camera.position.set(
      ME.root.position.x + orbitRadius * Math.sin(orbitPhi) * Math.cos(orbitTheta),
      1.15 + orbitRadius * Math.cos(orbitPhi),
      ME.root.position.z + orbitRadius * Math.sin(orbitPhi) * Math.sin(orbitTheta)
    );
    state.camLook.set(ME.root.position.x, 1.15, ME.root.position.z);
    camera.lookAt(state.camLook);

    const renderAndSchedule = (speedBlur: number, replayDof: number, allowMirror: boolean) => {
      if (isUnmounted) return;
      if (broadcastComposer) {
        broadcastComposer.updateFrame({ speedBlur, replayDof });
        broadcastComposer.composer.render();
      } else {
        renderer.render(scene, camera);
      }
      if (allowMirror) {
        mirrorFrameHookRef.current?.(renderer.domElement);
      }
      if (isSoftwareGl) {
        softwareTimerId = window.setTimeout(() => {
          if (!isUnmounted) frameId = requestAnimationFrame(loop);
        }, 16);
      } else {
        frameId = requestAnimationFrame(loop);
      }
    };

    const stepTikiVfx = (dt: number) => {
      if (tikiVfxState.flashT > 0) {
        tikiVfxState.flashT = Math.max(0, tikiVfxState.flashT - dt);
        tikiFlashLight.intensity = tikiVfxState.flashT > 0 ? Math.sin(Math.min(1, tikiVfxState.flashT) * Math.PI) * 16 : 0;
      } else {
        tikiFlashLight.intensity = 0;
      }
      if (tikiVfxState.ringT > 0) {
        tikiVfxState.ringT = Math.max(0, tikiVfxState.ringT - dt);
        const p = 1 - tikiVfxState.ringT / 0.85;
        tikiShockRing.scale.setScalar(1 + p * 8.5);
        tikiShockMat.opacity = Math.max(0, (1 - p) * 0.9);
        if (tikiVfxState.ringT <= 0) tikiShockRing.visible = false;
      }
      for (let i = 0; i < tikiParticles.length; i++) {
        const pt = tikiParticles[i];
        if (pt.life <= 0) continue;
        pt.life -= dt;
        if (pt.life <= 0) {
          pt.mesh.visible = false;
          continue;
        }
        pt.vy -= 9.5 * dt;
        pt.mesh.position.x += pt.vx * dt;
        pt.mesh.position.y = Math.max(0.08, pt.mesh.position.y + pt.vy * dt);
        pt.mesh.position.z += pt.vz * dt;
        pt.mesh.rotation.x += dt * 7;
        pt.mesh.rotation.y += dt * 9;
        const fade = pt.life / pt.maxLife;
        pt.mesh.scale.setScalar(Math.max(0.15, fade * 1.35));
      }
    };

    const loop = (now: number) => {
      const dt = Math.min((now - state.lastTime) / 1000, 0.05); state.lastTime = now;
      Audio.updateCheer(state.crowdCheer);
      stepTikiVfx(dt);

      // Game Highlights 3D Slow-Motion Playback
      if (isHighlightReplayRef.current && replayClipsRef.current.length > 0) {
        const preClip = replayClipsRef.current[replayClipIndexRef.current];
        const isTikiReplay = preClip?.signatureTag === "tiki_tiki_slam";
        const rate = isTikiReplay && replayProgressRef.current > 0.55 && replayProgressRef.current < 0.9 ? 0.2 : 0.42;
        replayProgressRef.current += dt * rate;
        if (replayProgressRef.current < 0.2) {
          tikiVfxState.lastReplayClipId = "";
        }
        if (replayProgressRef.current >= 1) {
          replayProgressRef.current = 0;
          tikiVfxState.lastReplayClipId = "";
          replayClipIndexRef.current = (replayClipIndexRef.current + 1) % replayClipsRef.current.length;
          setActiveHighlightIndex(replayClipIndexRef.current);
        }
        const activeClip = replayClipsRef.current[replayClipIndexRef.current];
        const activeIsTiki = activeClip?.signatureTag === "tiki_tiki_slam";
        const frame = activeClip ? interpolateHighlightFrame(activeClip.frames, replayProgressRef.current) : null;
        if (frame) {
          ball.position.set(frame.ballPos[0], frame.ballPos[1], frame.ballPos[2]);
          if (activeIsTiki && replayProgressRef.current >= 0.72) {
            const clipKey = `${activeClip.id}_${replayClipIndexRef.current}`;
            if (tikiVfxState.lastReplayClipId !== clipKey) {
              tikiVfxState.lastReplayClipId = clipKey;
              triggerTikiSlamVfx(ball.position.x >= 0 ? HOOP_X : -HOOP_X);
            }
          }
          for (const actor of frame.actors) {
            const ent = entities[actor.idx];
            if (!ent) continue;
            ent.root.visible = actor.visible;
            ent.root.position.set(actor.x, actor.y, actor.z);
            ent.root.rotation.y = actor.yaw;
            ent.pelvis.position.y = actor.pelvisY;
            ent.legs.R.hip.rotation.x = actor.hipR;
            ent.legs.L.hip.rotation.x = actor.hipL;
            ent.legs.R.knee.rotation.x = actor.kneeR;
            ent.legs.L.knee.rotation.x = actor.kneeL;
            ent.arms.R.sh.rotation.x = actor.shR;
            ent.arms.L.sh.rotation.x = actor.shL;
            ent.arms.R.el.rotation.x = actor.elR;
            ent.arms.L.el.rotation.x = actor.elL;
            ent.torso.rotation.x = actor.lean;
          }
          const camTarget = activeIsTiki
            ? V(ball.position.x * 0.7 + 4.2, 4.3, ball.position.z * 0.65 + 4.6)
            : V(ball.position.x * 0.55 + 7.5, 5.8, ball.position.z * 0.5 + 6.5);
          camera.position.lerp(camTarget, 1 - Math.exp(-4 * dt));
          state.camLook.lerp(ball.position, 1 - Math.exp(-5 * dt));
          camera.lookAt(state.camLook);
        }
        renderAndSchedule(0.08, 1.0, false);
        return;
      }

      if (state.isGameOver || (isOverlayOpenRef.current && !state.isPaused)) {
        renderAndSchedule(0.0, 0.25, false);
        return;
      }

      // Handle Tactical Timeout Pause
      if (state.isPaused) {
        state.pauseT += dt;
        // Cinematic camera sweep around the bench huddle during timeout
        const orbitAngle = state.pauseT * 0.35;
        camera.position.set(
          -2 + Math.cos(orbitAngle) * 6.5,
          3.0 + Math.sin(orbitAngle * 0.7) * 0.5,
          6 + Math.sin(orbitAngle) * 4.5
        );
        state.camLook.set(-2, 1.1, 7.5);
        camera.lookAt(state.camLook);
        renderAndSchedule(0.0, 0.65, false);
        return;
      }

      const isPracticeMode = gameModeRef.current === "freestyle" || gameModeRef.current === "training";
      const mpGuestMode = isMpGuestSession();

      // Shot Clock Tick & Urgency Processing (Host-authoritative when in multiplayer)
      if (!mpGuestMode) {
        const tickRes = tickShotClock(state.shotClock, dt, state.isPaused || state.ballMode === "dead" || isPracticeMode);
        state.shotClock = tickRes.newTime;

        if (tickRes.shouldBeep) {
          Audio.shotClockBeep(tickRes.beepSecond === 1);
        }

        if (tickRes.expired && state.deadT <= 0) {
          state.shotClock = resetShotClock("turnover");
          setShotClockResetPulse(k => k + 1);
          setLastShotResetReason("turnover");
          Audio.shotClockBuzzer();
          Audio.whistle();
          Audio.commentary("shotclock");
          triggerMsg("SHOT CLOCK VIOLATION", "#ef4444");

          if (state.owner) {
            state.owner = teamA.includes(state.owner) ? teamB[0] : teamA[0];
            state.ballMode = "dribble";
          }
        }
      }

      // 8-Second Backcourt Violation & 5-Second Backcourt Trap Pressure Clock
      if (!isPracticeMode && !mpGuestMode && state.owner && (state.ballMode === "dribble" || state.ballMode === "held") && state.deadT <= 0) {
        const ownerHome = teamA.includes(state.owner);
        const inOwnBackcourt = ownerHome ? state.owner.root.position.x < -0.35 : state.owner.root.position.x > 0.35;
        if (inOwnBackcourt) {
          state.backcourtClock += dt;
          const oppDefTeam = ownerHome ? teamB : teamA;
          const closePressingDef = oppDefTeam.find(
            (d) =>
              !d.isBench &&
              d.root.visible &&
              d.root.position.distanceTo(state.owner!.root.position) < 2.15 &&
              (d.defState.stanceActive || (d.defState.cutoffClampT ?? 0) > 0 || (d === ME && state.isDefending))
          );
          if (closePressingDef) {
            state.closelyGuardedClock += dt;
            state.owner.currentStamina = Math.max(0, (state.owner.currentStamina ?? STAMINA_SETTINGS.maxStamina) - dt * 14);
            state.owner.stamina = getStaminaNormalized(state.owner);
          } else {
            state.closelyGuardedClock = Math.max(0, state.closelyGuardedClock - dt * 0.8);
          }
          if (state.backcourtClock >= 8.0 || state.closelyGuardedClock >= 5.0) {
            const isTrapTo = state.closelyGuardedClock >= 5.0;
            state.backcourtClock = 0;
            state.closelyGuardedClock = 0;
            state.shotClock = resetShotClock("turnover");
            setShotClockResetPulse((k) => k + 1);
            setLastShotResetReason("turnover");
            Audio.whistle("violation");
            Audio.crowdReaction({ vol: 0.88 });
            triggerMsg(isTrapTo ? "5-SECOND BACKCOURT TRAP TURNOVER!" : "8-SECOND BACKCOURT VIOLATION!", "#f59e0b");
            if (!ownerHome) matchExtraStatsRef.current.steals++;
            state.owner = ownerHome ? teamB[0] : ME;
            state.ballMode = "dribble";
            state.stealGraceT = 1.25;
            state.fastTransitionT = 3.6;
          }
        } else {
          state.backcourtClock = 0;
          state.closelyGuardedClock = 0;
        }
      } else {
        state.backcourtClock = 0;
        state.closelyGuardedClock = 0;
      }

      // Update 3D arena shot clock displays
      shotClock3DMats.forEach((mat) => {
        if (state.shotClock <= 0) {
          mat.color.setHex(0xff0000);
        } else if (state.shotClock <= 5) {
          mat.color.setHex(Math.sin(now * 0.015) > 0 ? 0xff0022 : 0x550000);
        } else if (state.shotClock <= 10) {
          mat.color.setHex(0xff9900);
        } else {
          mat.color.setHex(0xffcc00);
        }
      });

      // HUD Update logic (updates smoothly, with sub-second precision when <= 5s)
      const curShot = state.shotClock;
      const displayKey = curShot <= 5.0 ? Math.floor(curShot * 10) / 10 : Math.ceil(curShot);
      if (displayKey !== lastClockRef.current) {
        setShotClock(curShot);
        lastClockRef.current = displayKey;
      }
      
      state.simClock += dt;
      if (state.shotFeedbackTimer > 0) {
        const fbStep = tickShotFeedbackTimer(state.shotFeedbackTimer, dt);
        state.shotFeedbackTimer = fbStep.remainingSec;
        if (!fbStep.visible) {
          setShotFeedback((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        }
      }

      if (!isPracticeMode && !mpGuestMode) {
        state.gameClock -= dt;
        if (state.gameClock <= 0) {
          state.gameClock = 0;
          setGameClock(0);
          completeQuarter();
        } else {
          setGameClock(Math.ceil(state.gameClock));
        }
      }

      if (ME.act && ME.act.kind === "shot" && !ME.act.released && !ME.act.auto && !ME.act.layup && !ME.act.dunk) { setShowMeter(true); setMeterFill((ME.act.c || 0.5) * 100); } else setShowMeter(false);

      const pads = navigator.getGamepads ? navigator.getGamepads() : []; let gp = pads[0];
      const b = (i: number) => !!(gp && (gp.buttons[i]?.pressed || (gp.buttons[i]?.value ?? 0) > 0.25));
      const ax = (i: number) => (gp && Math.abs(gp.axes[i]) > 0.15) ? gp.axes[i] : 0;
      if (b(9) && !prevInput.START) {
        setShowMainMenu(true);
      }
      if (b(8) && !prevInput.BACK) {
        setShowQuickMoves((prev) => !prev);
      }
      const k = (c: string) => !!state.keys[c];
      const tb = (c: string) => !!(state.touchButtons[c] || state.touchPulses[c]);
      if (state.owner === ME && state.uiDefenseToggle) {
        state.uiDefenseToggle = false;
      }
      const isDefending =
        (k("ControlLeft") ||
          k("ControlRight") ||
          k("KeyQ") ||
          b(6) ||
          tb("LT") ||
          !!state.uiDefenseToggle) &&
        state.owner !== ME;
      state.isDefending = isDefending;
      if (isUiDefendingRef.current !== isDefending) {
        isUiDefendingRef.current = isDefending;
        setIsUiDefending(isDefending);
      }
      if (state.owner !== ME) {
        if (isDefending) ME.defState.stanceActive = true;
        else if (!k("KeyZ") && prevInput.defHold && !isDefending) ME.defState.stanceActive = false;
      }
      const input = {
        A: b(0) || k("Space") || k("Enter") || k("NumpadEnter") || tb("A"),
        B: b(1) || k("KeyK") || k("KeyP") || tb("B"),
        X: b(2) || k("KeyX") || tb("X"),
        Y: b(3) || k("KeyI") || (k("KeyF") && state.owner === ME) || tb("Y"),
        LB: b(4) || k("Tab") || tb("LB"),
        RB: b(5) || k("KeyE") || tb("RB"),
        LT: b(6) || k("KeyZ") || tb("LT"),
        RT: b(7) || k("ShiftLeft") || k("ShiftRight") || tb("RT"),
        BACK: b(8),
        START: b(9),
        L3: b(10),
        R3: b(11),
        DPAD_UP: b(12),
        DPAD_DOWN: b(13),
        DPAD_LEFT: b(14),
        DPAD_RIGHT: b(15),
        defHold: isDefending,
        mx: clamp(ax(0) + (k("KeyD") || k("ArrowRight") ? 1 : 0) - (k("KeyA") || k("ArrowLeft") ? 1 : 0) + (state.joystick.active ? state.joystick.x : 0), -1, 1),
        my: clamp(ax(1) + (k("KeyS") || k("ArrowDown") ? 1 : 0) - (k("KeyW") || k("ArrowUp") ? 1 : 0) + (state.joystick.active ? state.joystick.y : 0), -1, 1)
      };
      const edge = (k: keyof typeof input) => !!input[k] && !prevInput[k];

      // USER (Camera-Relative Fixed-Step Normalized Movement, Defense Speed & Sprint Multiplier)
      const camDir = V();
      camera.getWorldDirection(camDir);
      camDir.y = 0;
      if (camDir.lengthSq() < 1e-6) camDir.set(0, 0, -1);
      else camDir.normalize();
      const camRight = V(-camDir.z, 0, camDir.x);

      const moveForward = -input.my;
      const moveRight = input.mx;
      const moveMag = Math.hypot(moveRight, moveForward);
      const normScale = moveMag > 1 ? 1 / moveMag : 1;
      const joystickSprint = state.joystick.active && !!state.joystick.autoSprint;
      const handleBoost = 1 + (athleteProfileRef.current.attributes.handles - 75) / 140;
      const isTransitionSprint = state.fastTransitionT > 0 && moveMag > 0.2;

      // Auto-break Triple-Threat or Charge anchor immediately when player pushes stick/keys to move or sprint
      if (ME.offState.tripleThreatActive && (input.RT || joystickSprint || moveMag > 0.35)) {
        state.tripleBreakT += dt;
        if (input.RT || joystickSprint || state.tripleBreakT > 0.12) {
          ME.offState.tripleThreatActive = false;
          ME.offState.tripleThreatT = 0;
          state.tripleBreakT = 0;
          if (ME.act?.kind === "triple_threat") ME.act = null;
        }
      } else {
        state.tripleBreakT = 0;
      }
      if (ME.defState.chargePlantedT > 0 && (input.RT || moveMag > 0.55)) {
        ME.defState.chargePlantedT = 0;
      }
      if (ME.act && !ME.act.lock && ME.act.kind !== "shot" && ME.act.t > 0.16 && moveMag > 0.5 && (input.RT || joystickSprint)) {
        ME.act = null;
      }

      const stanceLocked = (isDefending || ME.defState.stanceActive) && state.owner !== ME;
      const chargeAnchor = ME.defState.chargePlantedT > 0 || ME.offState.tripleThreatActive ? 0.35 : 1;
      const wantsToSprint = (input.RT || joystickSprint || isTransitionSprint) && moveMag > 0.08;
      const isSprinting = consumeStamina(ME, wantsToSprint, dt);
      handleStaminaRecovery(ME, isSprinting, dt);
      const exhaustionPenalty = ME.isExhausted ? STAMINA_SETTINGS.exhaustedSpeedMultiplier : 1;
      const inBackcourtPress =
        state.owner &&
        state.owner !== ME &&
        ((teamB.includes(state.owner) && state.owner.root.position.x > 0.35) ||
          (teamA.includes(state.owner) && state.owner.root.position.x < -0.35));
      const beatenInBackcourt = Boolean(
        inBackcourtPress &&
          state.owner &&
          teamB.includes(state.owner) &&
          ME.root.position.x > state.owner.root.position.x + 0.55
      );
      const defenseBaseSpeed = inBackcourtPress ? 4.55 : MOVEMENT_SETTINGS.defenseMoveSpeed;
      const backcourtRecoveryBoost = beatenInBackcourt && isSprinting ? 1.16 : 1.0;
      const baseSpeed = stanceLocked && !isSprinting ? defenseBaseSpeed : MOVEMENT_SETTINGS.moveSpeed;
      const sp =
        baseSpeed *
        handleBoost *
        chargeAnchor *
        exhaustionPenalty *
        backcourtRecoveryBoost *
        (isSprinting ? MOVEMENT_SETTINGS.sprintMultiplier : 1);
      const wantVel = V()
        .addScaledVector(camDir, moveForward * normScale * sp)
        .addScaledVector(camRight, moveRight * normScale * sp);
      applyVel(ME, wantVel, dt);

      const hoopX = teamA.includes(ME) ? HOOP_X : -HOOP_X;
      const toHoopDir = V(hoopX - ME.root.position.x, 0, -ME.root.position.z);
      if (toHoopDir.lengthSq() > 1e-6) toHoopDir.normalize();
      const inputWorldDir = moveMag > 0.1 && wantVel.lengthSq() > 1e-6 ? wantVel.clone().normalize() : V();
      const moveTowardHoopDot = moveMag > 0.1 ? inputWorldDir.dot(toHoopDir) : 0;

      const distMeToBall = ME.root.position.distanceTo(ball.position);
      const canTakeOrStealFromHoop =
        state.owner !== ME &&
        (!state.owner || !teamA.includes(state.owner)) &&
        distMeToBall < 3.6 &&
        (state.ballMode === "loose" ||
          (state.ballMode === "dead" && state.deadReason === "score") ||
          (state.ballMode === "flight" &&
            state.flight?.kind === "shot" &&
            (state.flight.reboundable || (isNearHoop(ball.position) && ball.position.y < 3.45))) ||
          Boolean(state.owner && !teamA.includes(state.owner) && isNearHoop(ball.position) && distMeToBall < 2.85));

      if ((edge("A") || k("KeyF")) && canTakeOrStealFromHoop) {
        scoopBall();
      } else if (edge("A") && state.owner === ME && !isDefending) {
        if (moveTowardHoopDot < -0.3) startShot(ME, { name: "FADEAWAY", stepback: true, dur: 1.5 });
        else startShot(ME);
      } else if (edge("A") && state.owner !== ME) {
        if (ME.h <= 0.08) ME.vy = Math.max(ME.vy, 4.7);
        executeMove(state.flight?.kind === "shot" ? DefenseMove.BOX_OUT : DefenseMove.SHOT_CONTEST);
      }
      if (!input.A && prevInput.A && ME.act?.kind === "shot" && !ME.act.released && !ME.act.auto) releaseShot(ME, ME.act, false);
      if (edge("Y") && state.owner === ME) {
        const tikiUnlocked = careerStatsRef.current.unlockedIds.includes("dunk_tiki_tiki");
        const useTiki =
          tikiUnlocked &&
          (careerStatsRef.current.equippedSignatureDunk === "dunk_tiki_tiki" || (k("KeyI") && input.RT));
        executeMove(useTiki ? OffenseMove.TIKI_TIKI_SLAM : input.RT ? OffenseMove.TWO_HAND_DUNK : OffenseMove.TOMAHAWK_DUNK);
      } else if (edge("Y") && canTakeOrStealFromHoop) {
        scoopBall();
      } else if (edge("Y") && state.owner !== ME) {
        const ballOwner = state.owner && !teamA.includes(state.owner) ? state.owner : null;
        const distOwnHoop = Math.hypot(ME.root.position.x + HOOP_X, ME.root.position.z);
        if (ME.h <= 0.08) ME.vy = Math.max(ME.vy, 5.2);
        if (ballOwner && ME.root.position.x > ballOwner.root.position.x + 0.65) {
          executeMove(DefenseMove.CHASE_DOWN_BLOCK);
        } else if (distOwnHoop < 4.4) {
          executeMove(DefenseMove.WALL_UP);
        } else {
          executeMove(DefenseMove.SHOT_CONTEST);
        }
      }
      if (edge("X") && state.owner === ME) {
        if (input.RT) {
          executeMove(OffenseMove.KILLER_CROSSOVER);
        } else if (moveMag > 0.45) {
          if (moveTowardHoopDot > 0.25) {
            executeMove(OffenseMove.PRO_HOP);
          } else {
            executeMove(OffenseMove.STEPBACK_JUMPER);
          }
        } else {
          executeMove(OffenseMove.CROSSOVER);
        }
      } else if (edge("X") && state.owner !== ME && !k("KeyX")) {
        executeMove(input.RT ? DefenseMove.STUNT_DIG : DefenseMove.SHADING_FORCING);
      }
      if (edge("B") && state.owner === ME) {
        const teammates = teamA.filter((p) => !p.isBench && p !== ME);
        if (teammates.length > 0) {
          let target = teammates[0];
          if (moveMag > 0.15 && inputWorldDir.lengthSq() > 1e-6) {
            let bestScore = -Infinity;
            for (const mate of teammates) {
              const toMate = mate.root.position.clone().sub(ME.root.position);
              toMate.y = 0;
              const dist = Math.max(0.5, toMate.length());
              const openBonus = Math.min(3.5, getNearestDefenderDist(mate, teamB)) * 0.08;
              const score = toMate.normalize().dot(inputWorldDir) - dist * 0.025 + openBonus;
              if (score > bestScore) {
                bestScore = score;
                target = mate;
              }
            }
          } else {
            const openPick = findOpenTeammate(ME, teammates, teamB, HOOP_X);
            target = openPick ? openPick.mate : teammates[0];
          }
          state.lastPasser = ME;
          state.lastPassTime = now;
          fire(ME, handPos(ME), torsoPos(target), 0.36, "pass", { passTo: target });
        }
      } else if (edge("B") && state.owner && state.owner !== ME && teamA.includes(state.owner) && state.ballMode === "dribble") {
        // Call for pass from AI teammate
        const holder = state.owner;
        state.lastPasser = holder;
        state.lastPassTime = now;
        fire(holder, handPos(holder), torsoPos(ME), 0.36, "pass", { passTo: ME });
        triggerLabel("CALL FOR PASS");
      } else if (edge("B") && state.owner !== ME) {
        executeMove(input.LT ? DefenseMove.CHARGE_DRAW : DefenseMove.SWITCH);
      }
      if (edge("LB") || edge("L3")) {
        const benchIdx = teamA.findIndex(p => p.isBench);
        const activeIdx = teamA.findIndex(p => !p.isBench && p !== ME);
        if (benchIdx !== -1 && activeIdx !== -1) substitute(teamA, benchIdx, activeIdx);
      }
      if (edge("R3")) {
        if (state.owner === ME) executeMove(OffenseMove.PROTECT_DRIBBLE);
        else executeMove(DefenseMove.PULL_CHAIR_POST);
      }
      // Gamepad D-Pad & Right Stick Pro-Moves
      if (edge("DPAD_UP")) executeMove(state.owner === ME ? OffenseMove.PICK_AND_ROLL : DefenseMove.FULL_COURT_PRESS);
      if (edge("DPAD_DOWN")) executeMove(state.owner === ME ? OffenseMove.PICK_AND_POP : DefenseMove.ZONE_2_3);
      if (edge("DPAD_LEFT")) executeMove(state.owner === ME ? OffenseMove.GIVE_AND_GO : DefenseMove.BLITZ_TRAP);
      if (edge("DPAD_RIGHT")) executeMove(state.owner === ME ? OffenseMove.FAST_BREAK : DefenseMove.SWITCH);

      if (state.rightStickCoolT > 0) state.rightStickCoolT = Math.max(0, state.rightStickCoolT - dt);
      const rsX = ax(2);
      const rsY = ax(3);
      if (Math.hypot(rsX, rsY) > 0.68 && state.rightStickCoolT <= 0) {
        state.rightStickCoolT = 0.34;
        if (state.owner === ME) {
          if (rsY > 0.55) executeMove(OffenseMove.STEPBACK_JUMPER);
          else if (rsY < -0.55) executeMove(OffenseMove.HESITATION);
          else executeMove(input.RT ? OffenseMove.BEHIND_THE_BACK : OffenseMove.CROSSOVER);
        } else {
          executeMove(DefenseMove.SHOT_CONTEST);
        }
      }

      // Expanded Offense & Defense Move Key Bindings
      const prevRawKeys: Record<string, boolean> = prevInput.rawKeys || {};
      const edgeKey = (code: string) => !!state.keys[code] && !prevRawKeys[code];
      const userTeamOffense = state.owner ? teamA.includes(state.owner) : false;

      if (edgeKey("KeyB")) {
        setMovebookDefaultSide(state.owner !== ME ? "defense" : "offense");
        setShowMovebook(true);
      }
      if (edgeKey("KeyN")) {
        setMovebookDefaultSide(state.owner !== ME ? "defense" : "offense");
        setShowQuickMoves((prev) => !prev);
      }
      if (edgeKey("KeyZ")) {
        if (state.owner === ME) executeMove(OffenseMove.TRIPLE_THREAT_STANCE);
        else executeMove(DefenseMove.DEFENSIVE_STANCE);
      }
      if (edgeKey("KeyC")) {
        if (state.owner === ME) executeMove(input.RT ? OffenseMove.BETWEEN_THE_LEGS : OffenseMove.BEHIND_THE_BACK);
        else executeMove(input.RT ? DefenseMove.SPRINT_TO_SLIDE : DefenseMove.CLOSEOUT);
      }
      if (edgeKey("KeyH")) {
        if (state.owner === ME) {
          const distToHoop = Math.hypot(ME.root.position.x - hoopX, ME.root.position.z);
          executeMove(distToHoop < 7.5 ? OffenseMove.HOOK_SHOT : OffenseMove.HESITATION);
        } else {
          executeMove(input.RT ? DefenseMove.HARD_HEDGE : DefenseMove.SOFT_HEDGE);
        }
      }
      if (edgeKey("KeyV")) {
        if (state.owner === ME) {
          const distToHoop = Math.hypot(ME.root.position.x - hoopX, ME.root.position.z);
          if (input.RT) executeMove(OffenseMove.SHAMMGOD);
          else executeMove(distToHoop < 5.5 ? OffenseMove.DROP_STEP : OffenseMove.SPIN_MOVE);
        } else {
          executeMove(input.RT ? DefenseMove.DROP_STEP_SWING : DefenseMove.DEFENSIVE_SLIDE);
        }
      }
      if (edgeKey("KeyJ")) {
        if (state.owner === ME) executeMove(input.RT ? OffenseMove.JAB_STEP : OffenseMove.PUMP_FAKE);
        else executeMove(input.RT ? DefenseMove.FRONT_POST : DefenseMove.FULL_DENIAL);
      }
      if (edgeKey("KeyL")) {
        if (state.owner === ME) executeMove(OffenseMove.LOB_PASS);
        else executeMove(input.RT ? DefenseMove.WEAK_SIDE_RIM_PROTECTION : DefenseMove.HELP_AND_RECOVER);
      }
      if (edgeKey("KeyR")) {
        if (state.owner !== ME) {
          executeMove(input.RT ? DefenseMove.HAND_CHECK_ARM_BAR : DefenseMove.HIP_RIDE);
        }
      }
      if (edgeKey("KeyT")) {
        if (state.owner !== ME) {
          const distToOwnHoop = Math.hypot(ME.root.position.x + HOOP_X, ME.root.position.z);
          if (input.RT) {
            executeMove(distToOwnHoop < 5.5 ? DefenseMove.PULL_CHAIR_POST : DefenseMove.PULL_CHAIR_PERIMETER);
          } else {
            executeMove(DefenseMove.CHARGE_DRAW);
          }
        }
      }
      if (edgeKey("KeyX")) {
        if (state.owner !== ME) {
          executeMove(input.RT ? DefenseMove.STUNT_DIG : DefenseMove.SHADING_FORCING);
        }
      }
      if (edgeKey("KeyG")) {
        if (state.owner !== ME) {
          if (canTakeOrStealFromHoop || state.flight?.kind === "shot") {
            executeMove(input.RT ? DefenseMove.WEDGE_CRASH : DefenseMove.BOX_OUT);
          } else {
            const ballOwner = state.owner && !teamA.includes(state.owner) ? state.owner : null;
            const distToOwnHoop = Math.hypot(ME.root.position.x + HOOP_X, ME.root.position.z);
            if (ballOwner && ME.root.position.x > ballOwner.root.position.x + 0.65) {
              executeMove(DefenseMove.CHASE_DOWN_BLOCK);
            } else if (distToOwnHoop < 4.2) {
              executeMove(DefenseMove.WALL_UP);
            } else {
              executeMove(DefenseMove.SHOT_CONTEST);
            }
          }
        } else {
          executeMove(OffenseMove.PROTECT_DRIBBLE);
        }
      }
      if (edgeKey("KeyE") || edge("RB")) {
        if (canTakeOrStealFromHoop && ME.root.position.distanceTo(ball.position) < 4.5) {
          scoopBall();
        } else if (state.owner === ME) {
          executeMove(input.RT ? OffenseMove.PROTECT_DRIBBLE : OffenseMove.PUMP_FAKE);
        } else {
          executeMove(input.RT ? DefenseMove.JUMP_PASSING_LANE : DefenseMove.POKE_STEAL);
        }
      }
      if (edgeKey("KeyF") && state.owner !== ME && !canTakeOrStealFromHoop) {
        executeMove(DefenseMove.GLOVE_RIP_STRIP);
      }
      if (edgeKey("KeyO") && state.owner !== ME) {
        executeMove(DefenseMove.VOLLEY_SWAT_BLOCK);
      }
      if (edgeKey("KeyU") && state.owner !== ME) {
        executeMove(DefenseMove.BASELINE_TRAP_CUTOFF);
      }
      if (edgeKey("Digit1")) executeMove(userTeamOffense ? OffenseMove.PICK_AND_ROLL : DefenseMove.OVER_SCREEN);
      if (edgeKey("Digit2")) executeMove(userTeamOffense ? OffenseMove.PICK_AND_POP : DefenseMove.SWITCH);
      if (edgeKey("Digit3")) executeMove(userTeamOffense ? OffenseMove.PIN_DOWN : DefenseMove.DROP_COVERAGE);
      if (edgeKey("Digit4")) executeMove(userTeamOffense ? OffenseMove.BACKDOOR_CUT : DefenseMove.BLITZ_TRAP);
      if (edgeKey("Digit5")) executeMove(userTeamOffense ? OffenseMove.GIVE_AND_GO : DefenseMove.ZONE_2_3);
      if (edgeKey("Digit6")) executeMove(userTeamOffense ? OffenseMove.FAST_BREAK : DefenseMove.FULL_COURT_PRESS);

      // MULTIPLAYER REMOTE PEER SYNCHRONIZATION
      remoteDrivenEntities.clear();
      const activeMpRoom = mpRoomRef.current;
      const activeMpClient = mpClientRef.current;
      const mirror = isMirrorPerspective();
      if (activeMpRoom && activeMpClient && activeMpClient.transport !== "disconnected") {
        const peerMap = resolvePeerEntityMap(activeMpRoom, activeMpClient.playerId);
        for (const peer of Object.values(activeMpRoom.players)) {
          if (peer.playerId === activeMpClient.playerId) continue;
          const targetEntity = peerMap.get(peer.playerId);
          if (!targetEntity) continue;

          if (!(targetEntity as any)._baseName) {
            (targetEntity as any)._baseName = targetEntity.name;
          }
          remoteDrivenEntities.add(targetEntity);
          (targetEntity as any)._wasRemoteDriven = true;
          targetEntity.isBench = false;
          targetEntity.root.visible = true;
          targetEntity.name = peer.name;
          if (peer.jerseyColor && (targetEntity as any)._lastRemoteJersey !== peer.jerseyColor) {
            (targetEntity as any)._lastRemoteJersey = peer.jerseyColor;
            targetEntity.jerseyMat.color.setStyle(peer.jerseyColor);
            targetEntity.jerseyMat.needsUpdate = true;
          }
          if (peer.shortsColor && (targetEntity as any)._lastRemoteShorts !== peer.shortsColor) {
            (targetEntity as any)._lastRemoteShorts = peer.shortsColor;
            targetEntity.shortsMat.color.setStyle(peer.shortsColor);
            targetEntity.shortsMat.needsUpdate = true;
          }
          const sign = mirror ? -1 : 1;
          const lerpAlpha = 1 - Math.exp(-14 * dt);
          targetEntity.root.position.x += (peer.transform.x * sign - targetEntity.root.position.x) * lerpAlpha;
          targetEntity.root.position.z += (peer.transform.z * sign - targetEntity.root.position.z) * lerpAlpha;
          targetEntity.vel.set((peer.transform.vx || 0) * sign, 0, (peer.transform.vz || 0) * sign);
          targetEntity.h += ((peer.transform.h || 0) - targetEntity.h) * lerpAlpha;
          targetEntity.faceYaw = (peer.transform.faceYaw || 0) + (mirror ? Math.PI : 0);
          (targetEntity as any)._remotePose = peer.transform.pose || null;
        }
      }
      // Restore AI name/pose if a peer previously drove an entity and left
      entities.forEach((ent) => {
        if ((ent as any)._wasRemoteDriven && !remoteDrivenEntities.has(ent)) {
          (ent as any)._wasRemoteDriven = false;
          (ent as any)._remotePose = null;
          (ent as any)._lastRemoteJersey = null;
          (ent as any)._lastRemoteShorts = null;
          if ((ent as any)._baseName) ent.name = (ent as any)._baseName;
          if (teamA.includes(ent)) {
            ent.jerseyMat.color.setStyle(athleteProfileRef.current.jerseyColorHex);
            ent.shortsMat.color.setStyle(athleteProfileRef.current.shortsColorHex);
          } else {
            ent.jerseyMat.color.setStyle(currentCity.jerseyPrimary);
            ent.shortsMat.color.setStyle(currentCity.shortsColor);
          }
          ent.jerseyMat.needsUpdate = true;
          ent.shortsMat.needsUpdate = true;
        }
      });

      // AI & FULL-COURT FAST-BREAK TRANSITIONS
      const ownerTeam: "Home" | "Away" | null = state.owner
        ? teamA.includes(state.owner)
          ? "Home"
          : "Away"
        : null;
      if (ownerTeam && ownerTeam !== state.prevPossessionTeam) {
        state.prevPossessionTeam = ownerTeam;
        state.fastTransitionT = 3.6;
      }
      if (state.fastTransitionT > 0) {
        state.fastTransitionT = Math.max(0, state.fastTransitionT - dt);
      }

      const isTeamA = state.owner ? teamA.includes(state.owner) : state.lastScoringTeam === "Away";
      const isTeamATransition = isTeamA && (state.fastTransitionT > 0 || ball.position.x < 3.0);
      const isTeamBTransition = !isTeamA && (state.fastTransitionT > 0 || ball.position.x > -3.0);
      const currentTactics = tacticsRef.current;

      // Per-frame Defense State Timers & Physical Collisions (Hip-Ride, Hand-Check, Charge, Pull-the-Chair)
      entities.forEach((P) => {
        if (P.isBench) return;
        const ds = P.defState;
        if (ds.stanceT > 0) {
          ds.stanceT = Math.max(0, ds.stanceT - dt);
          if (ds.stanceT === 0) ds.stanceActive = false;
        }
        if (state.owner === P) {
          ds.stanceActive = false;
          ds.stanceT = 0;
        }
        if (ds.shadingT > 0) ds.shadingT = Math.max(0, ds.shadingT - dt);
        if (ds.handCheckT > 0) ds.handCheckT = Math.max(0, ds.handCheckT - dt);
        if (ds.hipRideT > 0) {
          ds.hipRideT = Math.max(0, ds.hipRideT - dt);
          const target = ds.hipRideTarget;
          if (target && !target.isBench && target.root.visible) {
            const toHoop = V(-HOOP_X - target.root.position.x, 0, -target.root.position.z);
            if (toHoop.lengthSq() > 1e-5) toHoop.normalize();
            const lat = V(-toHoop.z, 0, toHoop.x);
            const side = Math.sign(P.root.position.clone().sub(target.root.position).dot(lat)) || 1;
            const hipX = target.root.position.x + lat.x * side * 0.9;
            const hipZ = target.root.position.z + lat.z * side * 0.9;
            if (P === ME) {
              ME.root.position.x += (hipX - ME.root.position.x) * Math.min(1, dt * 8);
              ME.root.position.z += (hipZ - ME.root.position.z) * Math.min(1, dt * 8);
            }
            if (P.root.position.distanceTo(target.root.position) < 2.2) {
              target.vel.addScaledVector(lat, -side * 3.8 * dt);
              target.vel.multiplyScalar(1 - Math.min(0.45, dt * 3.0));
            }
          }
          if (ds.hipRideT === 0) ds.hipRideTarget = null;
        }
        if (ds.handCheckT > 0 && state.owner && teamA.includes(P) !== teamA.includes(state.owner)) {
          if (P.root.position.distanceTo(state.owner.root.position) < 2.15) {
            state.owner.vel.multiplyScalar(Math.pow(0.72, dt * 10));
          }
        }
        if (ds.contestT > 0) {
          ds.contestT = Math.max(0, ds.contestT - dt);
          if (ds.contestT === 0) ds.contestLevel = 0;
        }
        if (ds.verticalWallT > 0) ds.verticalWallT = Math.max(0, ds.verticalWallT - dt);
        if ((ds.gloveRipT ?? 0) > 0) ds.gloveRipT = Math.max(0, (ds.gloveRipT ?? 0) - dt);
        if ((ds.volleySwatT ?? 0) > 0) ds.volleySwatT = Math.max(0, (ds.volleySwatT ?? 0) - dt);
        if ((ds.cutoffClampT ?? 0) > 0) {
          ds.cutoffClampT = Math.max(0, (ds.cutoffClampT ?? 0) - dt);
          if (state.owner && teamA.includes(P) !== teamA.includes(state.owner) && P.root.position.distanceTo(state.owner.root.position) < 2.15) {
            state.owner.vel.multiplyScalar(Math.pow(0.58, dt * 10));
          }
        }
        if (ds.chargePlantedT > 0) {
          ds.chargePlantedT = Math.max(0, ds.chargePlantedT - dt);
          const attacker = state.owner && teamA.includes(P) !== teamA.includes(state.owner) ? state.owner : null;
          if (attacker && P.root.position.distanceTo(attacker.root.position) < 1.25) {
            const attSpd = Math.hypot(attacker.vel.x, attacker.vel.z);
            const toDef = P.root.position.clone().sub(attacker.root.position);
            toDef.y = 0;
            if (attSpd > 3.1 && toDef.lengthSq() > 1e-4 && attacker.vel.dot(toDef.normalize()) > 2.2) {
              const distFromOwnHoop = Math.hypot(P.root.position.x + HOOP_X, P.root.position.z);
              if (distFromOwnHoop > 1.35 && Math.hypot(P.vel.x, P.vel.z) < 2.4) {
                performOffensiveFoul(attacker, P, "CHARGE DRAWN!");
              } else {
                ds.chargePlantedT = 0;
                performFoul(P, attacker);
              }
            }
          }
        }
        if (ds.pullChairWindowT > 0) {
          ds.pullChairWindowT = Math.max(0, ds.pullChairWindowT - dt);
          const oppList = teamA.includes(P) ? teamB : teamA;
          const attacker =
            (state.owner && !teamA.includes(state.owner) ? state.owner : null) ||
            oppList.find((o) => !o.isBench && o.root.visible && o.root.position.distanceTo(P.root.position) < 2.25);
          if (attacker && P.root.position.distanceTo(attacker.root.position) < 2.25) {
            const toDef = P.root.position.clone().sub(attacker.root.position);
            toDef.y = 0;
            if (toDef.lengthSq() > 1e-4 && attacker.vel.dot(toDef.normalize()) > 1.45) {
              const kind = ds.pullChairKind;
              ds.pullChairWindowT = 0;
              ds.pullChairKind = null;
              triggerStumbleTurnover(attacker, P, kind === "post" ? "POST CHAIR PULLED!" : "PULLED THE CHAIR!");
            }
          }
          if (ds.pullChairWindowT === 0) ds.pullChairKind = null;
        }
        if (ds.boxOutT > 0) ds.boxOutT = Math.max(0, ds.boxOutT - dt);
        if (ds.passLaneHunterT > 0) ds.passLaneHunterT = Math.max(0, ds.passLaneHunterT - dt);
        if (ds.stumbleT > 0) ds.stumbleT = Math.max(0, ds.stumbleT - dt);

        // Offense State Timers (Triple-Threat, Hostage Jail Pin, Deep Seal, Rebound Counters)
        const os = P.offState;
        if (os.tripleThreatT > 0) {
          os.tripleThreatT = Math.max(0, os.tripleThreatT - dt);
          if (os.tripleThreatT === 0 || state.owner !== P) os.tripleThreatActive = false;
        }
        if (os.hostageT > 0) {
          os.hostageT = Math.max(0, os.hostageT - dt);
          if (os.hostageTarget && P.root.position.distanceTo(os.hostageTarget.root.position) < 2.2) {
            const jailSpot = P.root.position.clone().addScaledVector(fwd(P), -1.15);
            os.hostageTarget.root.position.x += (jailSpot.x - os.hostageTarget.root.position.x) * Math.min(1, dt * 8);
            os.hostageTarget.root.position.z += (jailSpot.z - os.hostageTarget.root.position.z) * Math.min(1, dt * 8);
          }
          if (os.hostageT === 0) os.hostageTarget = null;
        }
        if (os.postSealT > 0) os.postSealT = Math.max(0, os.postSealT - dt);
        if (os.reboundBoostT > 0) os.reboundBoostT = Math.max(0, os.reboundBoostT - dt);
        if (os.cutActionT > 0) os.cutActionT = Math.max(0, os.cutActionT - dt);
        if (os.openWaveT > 0) os.openWaveT = Math.max(0, os.openWaveT - dt);
      });

      // Safety guard: never leave ball owned by a benched/hidden entity or stalled in "held" without action
      if (!mpGuestMode && state.owner && (state.owner.isBench || !state.owner.root.visible)) {
        const fallbackActive = teamA.find((p) => !p.isBench && p.root.visible) || ME;
        state.owner = fallbackActive;
        state.ballMode = "dribble";
        state.ballStallT = 0;
      }
      if (!mpGuestMode && state.owner && !state.owner.act && state.ballMode === "held") {
        state.ballMode = "dribble";
      }

      if (gameModeRef.current === "training") {
        // Training mode: partner at wing actively rebounds, relocates, and passes back crisply to user
        const partner = teamA[1];
        if (partner && !remoteDrivenEntities.has(partner)) {
          if (state.owner === partner) {
            partner.holdT += dt;
            aiSteer(partner, 10.4, Math.sin(now * 0.0018) * 3.4, 8.2, dt);
            if (partner.holdT > 0.35) {
              partner.holdT = 0;
              fire(partner, handPos(partner), torsoPos(ME), 0.36, "pass", { passTo: ME });
            }
          } else if (
            state.ballMode === "loose" ||
            (state.ballMode === "dead" && state.deadReason === "score") ||
            (state.ballMode === "flight" && state.flight?.kind === "shot" && state.flight.reboundable)
          ) {
            aiSteer(partner, ball.position.x, ball.position.z, 12.0, dt);
          } else {
            aiSteer(partner, 10.2 + Math.cos(now * 0.0014) * 1.4, Math.sin(now * 0.0018) * 3.8, 7.8, dt);
          }
        }
      } else if (gameModeRef.current !== "freestyle") {
        // Identify nearest non-user chasers when ball is loose, rebounding off hoop, or dead after a score
        let nearestLooseA: GameEntity | null = null;
        let nearestLooseB: GameEntity | null = null;
        const isShotInFlight = state.ballMode === "flight" && state.flight?.kind === "shot";
        const isPassInFlight = state.ballMode === "flight" && state.flight?.kind === "pass";
        const canAiChaseBall =
          state.ballMode === "loose" ||
          (state.ballMode === "dead" && state.deadReason === "score") ||
          (isShotInFlight &&
            (state.flight.reboundable || (isNearHoop(ball.position) && ball.position.y < 3.65)));

        if (canAiChaseBall) {
          let bestA = Infinity;
          let bestB = Infinity;
          for (const P of teamA) {
            if (P.isBench || !P.root.visible || P.isUser || remoteDrivenEntities.has(P)) continue;
            const d = Math.hypot(P.root.position.x - ball.position.x, P.root.position.z - ball.position.z);
            if (d < bestA) { bestA = d; nearestLooseA = P; }
          }
          for (const P of teamB) {
            if (P.isBench || !P.root.visible || remoteDrivenEntities.has(P)) continue;
            const d = Math.hypot(P.root.position.x - ball.position.x, P.root.position.z - ball.position.z);
            if (d < bestB) { bestB = d; nearestLooseB = P; }
          }
        }

        // Anti-stall detector for non-user AI ball handlers so ball NEVER stops moving
        if (state.owner && !state.owner.isUser && (state.ballMode === "dribble" || state.ballMode === "held")) {
          const movedSince = Math.hypot(
            state.owner.root.position.x - state.ballStallX,
            state.owner.root.position.z - state.ballStallZ
          );
          if (movedSince < 0.32) {
            state.ballStallT += dt;
          } else {
            state.ballStallT = 0;
            state.ballStallX = state.owner.root.position.x;
            state.ballStallZ = state.owner.root.position.z;
          }
        } else {
          state.ballStallT = 0;
        }

        const timeSec = now * 0.001;
        const activeTeamA = teamA.filter((p) => !p.isBench && p.root.visible);
        const activeTeamB = teamB.filter((p) => !p.isBench && p.root.visible);
        const defSchemeTeamA = activeDefenseSchemeRef.current || DefenseMove.MAN_TO_MAN;
        const defSchemeTeamB = chooseAdaptiveAiDefenseScheme({
          quarter: state.quarter,
          gameClock: state.gameClock,
          scoreDiff: state.scoreAway - state.scoreHome,
          timeSec,
        });

        const ballOwnerA = state.owner && teamA.includes(state.owner) ? state.owner : activeTeamA[0] || ME;
        const ballOwnerB = state.owner && teamB.includes(state.owner) ? state.owner : activeTeamB[0] || teamB[0];

        if (state.owner === ME && state.ballMode === "dribble" && isTeamA && ME.root.position.x > 1.0) {
          const openCheck = findOpenTeammate(ME, teamA, teamB, HOOP_X);
          if (openCheck && openCheck.defDist >= 2.75 && openCheck.hoopDist <= 9.8) {
            openCheck.mate.offState.openWaveT = 0.45;
            if (now - lastOpenCallMs > 7500) {
              lastOpenCallMs = now;
              triggerLabel(`${openCheck.mate.name}: I'M OPEN!`);
              Audio.speak("I'm open!");
            }
          }
        }

        // Helper: Execute live DefenseMove & biomechanical actions for ANY defender on BOTH teams
        const executeAiDefender = (
          P: GameEntity,
          defIdx: number,
          ourHoopX: number,
          ownTeam: GameEntity[],
          oppTeam: GameEntity[],
          oppBallHandler: GameEntity | null,
          scheme: DefenseMove
        ) => {
          const ds = P.defState;
          if ((ds.aiMoveCoolT ?? 0) > 0) ds.aiMoveCoolT = Math.max(0, (ds.aiMoveCoolT ?? 0) - dt);
          const activeOpp = oppTeam.filter((o) => !o.isBench && o.root.visible);
          const nearestToBallHandler =
            oppBallHandler &&
            ownTeam.reduce<GameEntity | null>((best, cand) => {
              if (cand.isBench || !cand.root.visible) return best;
              if (!best) return cand;
              return cand.root.position.distanceTo(oppBallHandler.root.position) <
                best.root.position.distanceTo(oppBallHandler.root.position)
                ? cand
                : best;
            }, null);

          const matchup =
            (oppBallHandler && P === nearestToBallHandler ? oppBallHandler : getMatchupForDefender(P, activeOpp)) ||
            activeOpp[0];
          if (!matchup) return;

          const activeTeammates = ownTeam
            .map((mate, mateIdx) =>
              mate.isBench || !mate.root.visible
                ? null
                : {
                    idx: mateIdx,
                    pos: { x: mate.root.position.x, z: mate.root.position.z },
                    vel: { x: mate.vel.x, z: mate.vel.z },
                    role: mate.pos,
                  }
            )
            .filter((t): t is NonNullable<typeof t> => t !== null);

          const isOnBall = Boolean(oppBallHandler && (matchup === oppBallHandler || P === nearestToBallHandler));
          const decision = computeDefenseAiDecision({
            defenderIdx: defIdx,
            defenderPos: { x: P.root.position.x, z: P.root.position.z },
            defenderVel: { x: P.vel.x, z: P.vel.z },
            defenderHeight: P.h,
            defenderRole: P.pos,
            ourHoopX,
            ballPos: { x: ball.position.x, z: ball.position.z },
            ballHeight: ball.position.y,
            ballOwnerPos: oppBallHandler
              ? { x: oppBallHandler.root.position.x, z: oppBallHandler.root.position.z }
              : null,
            ballOwnerVel: oppBallHandler ? { x: oppBallHandler.vel.x, z: oppBallHandler.vel.z } : null,
            matchupPos: { x: matchup.root.position.x, z: matchup.root.position.z },
            isOnBall,
            isNearestToBallHandler: P === nearestToBallHandler,
            shotInFlight: isShotInFlight,
            passInFlight: isPassInFlight,
            scheme,
            defenseTactic: currentTactics.defense,
            timeSec,
            cooldownReady: (ds.aiMoveCoolT ?? 0) <= 0,
            primaryDefenderPos:
              nearestToBallHandler && nearestToBallHandler !== P
                ? { x: nearestToBallHandler.root.position.x, z: nearestToBallHandler.root.position.z }
                : null,
            primaryDefenderVel:
              nearestToBallHandler && nearestToBallHandler !== P
                ? { x: nearestToBallHandler.vel.x, z: nearestToBallHandler.vel.z }
                : null,
            teammatePositions: activeTeammates,
            helpProximityRadius: 6.2,
          });

          ds.activeAiDefMove = decision.move;
          ds.stanceActive = decision.stanceActive;
          if (decision.stanceActive) ds.stanceT = Math.max(ds.stanceT, 0.35);
          ds.shadingSide = decision.shadingSide;
          if (decision.activateContest) {
            ds.contestT = Math.max(ds.contestT, 0.55);
            ds.contestLevel = Math.max(ds.contestLevel, decision.contestLevel);
          }
          if (decision.activateWallUp) ds.verticalWallT = Math.max(ds.verticalWallT, 0.65);
          if (decision.activateBoxOut) ds.boxOutT = Math.max(ds.boxOutT, 0.75);
          if (decision.activateHipRide && oppBallHandler) {
            ds.hipRideT = Math.max(ds.hipRideT, 0.45);
            ds.hipRideTarget = oppBallHandler;
          }
          if (decision.activateHandCheck) ds.handCheckT = Math.max(ds.handCheckT, 0.4);
          if (decision.activatePassLane) {
            ds.passLaneHunterT = Math.max(ds.passLaneHunterT, 0.55);
            ds.passLaneMode = decision.passLaneMode;
          }
          if (decision.activateCutoffClamp) {
            ds.cutoffClampT = Math.max(ds.cutoffClampT ?? 0, 0.55);
          }

          // Animate physical jumps / volley swats / poke steals / glove rips / stunts cleanly without locking movement
          if ((decision.triggerJump || decision.triggerVolleySwat) && P.h <= 0.04 && !P.act) {
            ds.aiMoveCoolT = 1.35;
            P.vy = Math.max(decision.triggerVolleySwat ? 5.3 : 4.6, decision.jumpVel + 1.1);
            if (decision.triggerVolleySwat) ds.volleySwatT = 0.55;
            P.act = {
              kind: "def_jump",
              name: decision.move,
              t: 0,
              dur: 0.55,
              lock: false,
              pose: (_u: number, T: any) => {
                T.shR = decision.triggerVolleySwat ? -3.1 : -2.65;
                T.shL = decision.triggerVolleySwat || decision.activateWallUp ? -2.95 : -1.2;
                T.elR = -0.15;
                T.elL = decision.triggerVolleySwat || decision.activateWallUp ? -0.15 : -0.8;
              },
            };
          } else if ((decision.triggerPoke || decision.triggerStunt || decision.triggerGloveRip) && !P.act && oppBallHandler) {
            ds.aiMoveCoolT = 1.65;
            if (decision.triggerGloveRip) ds.gloveRipT = 0.35;
            const kHand = P.hand || "R";
            P.act = {
              kind: "def_swipe",
              name: decision.move,
              t: 0,
              dur: 0.32,
              lock: false,
              pose: (u: number, T: any) => {
                const reach = Math.sin(u * Math.PI);
                T["sh" + kHand] = -0.8 - reach * (decision.triggerGloveRip ? 1.3 : 1.1);
                T["el" + kHand] = -0.3;
                T.lean = 0.24;
              },
            };
            // Real timed Poke-Steal / Glove-Rip / Stunt-Dig attempt if very close and ball is not shielded
            if (
              oppBallHandler === state.owner &&
              state.ballMode === "dribble" &&
              state.stealGraceT <= 0 &&
              !oppBallHandler.shield &&
              P.root.position.distanceTo(oppBallHandler.root.position) < (decision.triggerGloveRip ? 1.55 : 1.35) &&
              Math.random() < (decision.triggerGloveRip ? 0.28 : 0.2)
            ) {
              state.owner = null;
              state.ballMode = "loose";
              state.flight = null;
              state.ballVel.set(rnd(3.8), 1.9, rnd(3.8));
              Audio.squeak({ pan: clamp(P.root.position.z / 7.5, -1, 1), vol: 0.85, entityKey: P.name });
              triggerMsg(decision.triggerGloveRip ? "GLOVE RIP!" : "POKE STEAL!", "#38bdf8");
            }
          }

          aiSteer(P, decision.targetX, decision.targetZ, decision.speed, dt);
        };

        // Helper: Dynamic live Ball-Handler AI for Team A teammates & Team B opponents
        const runAiBallHandler = (
          P: GameEntity,
          slotIdx: number,
          ownTeam: GameEntity[],
          oppTeam: GameEntity[],
          targetHoopX: number
        ) => {
          P.holdT += dt;
          if (P.act || (state.ballMode !== "dribble" && state.ballMode !== "held")) return;

          const attackDir = targetHoopX > 0 ? 1 : -1;
          const selfDefDist = getNearestDefenderDist(P, oppTeam);
          const hoopDist = Math.hypot(targetHoopX - P.root.position.x, P.root.position.z);
          const openChoice = findOpenTeammate(P, ownTeam, oppTeam, targetHoopX);

          // Advance ball swiftly across half-court timeline
          const pastMid = attackDir > 0 ? P.root.position.x >= 0.6 : P.root.position.x <= -0.6;
          if (!pastMid) {
            const weaveZ = Math.sin(timeSec * 2.6 + slotIdx) * 2.4;
            aiSteer(P, targetHoopX - attackDir * 3.8, weaveZ, 11.8, dt);
            if (
              P.holdT > 0.45 &&
              openChoice &&
              openChoice.defDist >= 2.25 &&
              (openChoice.mate.root.position.x - P.root.position.x) * attackDir > 2.2
            ) {
              P.holdT = 0;
              state.ballStallT = 0;
              state.stealGraceT = 0.85;
              state.lastPasser = P;
              state.lastPassTime = now;
              fire(P, handPos(P), torsoPos(openChoice.mate), 0.34, "pass", { passTo: openChoice.mate });
            }
            return;
          }

          const isRedTeam = teamA.includes(P);
          // Attack driving lanes & perimeter pull-up spots so both teams run genuine offensive sets
          const drivePhase = Math.sin(timeSec * 2.2 + slotIdx * 1.4);
          const driveZ = selfDefDist >= 1.9 ? 0 : clamp(drivePhase * 3.6, -5.2, 5.2);
          const driveX = targetHoopX - attackDir * (selfDefDist >= 1.95 ? 1.45 : 4.6 + Math.cos(timeSec * 1.7) * 1.4);
          aiSteer(P, driveX, driveZ, selfDefDist >= 1.95 ? 9.4 : 8.4, dt);

          const wideOpenSelf = selfDefDist >= (isRedTeam ? 1.95 : 2.2) && P.holdT > (isRedTeam ? 0.26 : 0.32);
          const openSelf = selfDefDist >= (isRedTeam ? 1.65 : 1.8) && P.holdT > (isRedTeam ? 0.52 : 0.65);
          const mateIsBetterOption =
            openChoice &&
            openChoice.defDist >= (isRedTeam ? 1.9 : 2.25) &&
            (selfDefDist < (isRedTeam ? 1.75 : 1.95) || openChoice.defDist > selfDefDist + 0.55 || (openChoice.mate.isUser && P.holdT > 0.45));
          const forcedShot = isRedTeam
            ? P.holdT > 1.75 || state.ballStallT > 1.2
            : P.holdT > 1.25 || state.ballStallT > 0.9;

          if (P.h <= 0.05 && hoopDist <= 10.6 && (wideOpenSelf || openSelf) && !(selfDefDist < 1.95 && mateIsBetterOption)) {
            P.holdT = 0;
            state.ballStallT = 0;
            const perfectOpen = isRedTeam && selfDefDist >= 2.15;
            if (hoopDist <= 2.35 && selfDefDist >= 1.6) {
              startShot(P, { auto: true, dunk: true, perfectRelease: isRedTeam, name: "DRIVING DUNK" });
            } else if (hoopDist <= 4.1) {
              startShot(P, { auto: true, layup: true, perfectRelease: perfectOpen, name: hoopDist <= 2.4 ? "DRIVING LAYUP" : "FLOATER" });
            } else {
              startShot(P, {
                auto: true,
                perfectRelease: perfectOpen,
                stepback: selfDefDist < 2.05,
                name: selfDefDist >= 2.2 ? (hoopDist >= 6.75 ? "THREE-POINTER" : "OPEN JUMP SHOT") : "JUMP SHOT",
              });
            }
          } else if (P.holdT > 0.42 && mateIsBetterOption && openChoice) {
            P.holdT = 0;
            state.ballStallT = 0;
            P.h = 0;
            P.vy = 0;
            state.stealGraceT = 0.85;
            state.lastPasser = P;
            state.lastPassTime = now;
            fire(P, handPos(P), torsoPos(openChoice.mate), 0.34, "pass", { passTo: openChoice.mate });
            if (openChoice.mate.isUser) triggerLabel("PASS TO OPEN MAN!");
          } else if (forcedShot) {
            P.holdT = 0;
            state.ballStallT = 0;
            P.h = 0;
            P.vy = 0;
            if (isRedTeam && openChoice && openChoice.defDist >= 1.75 && selfDefDist < 1.55) {
              state.stealGraceT = 0.85;
              state.lastPasser = P;
              state.lastPassTime = now;
              fire(P, handPos(P), torsoPos(openChoice.mate), 0.34, "pass", { passTo: openChoice.mate });
              if (openChoice.mate.isUser) triggerLabel("PASS TO OPEN MAN!");
            } else if (hoopDist <= 10.6) {
              if (hoopDist <= 4.2) {
                startShot(P, { auto: true, layup: true, perfectRelease: isRedTeam, name: "DRIVING LAYUP" });
              } else {
                startShot(P, { auto: true, stepback: selfDefDist < 2.0, name: "CONTESTED JUMPER" });
              }
            } else if (openChoice && openChoice.defDist >= 1.45) {
              state.stealGraceT = 0.85;
              state.lastPasser = P;
              state.lastPassTime = now;
              fire(P, handPos(P), torsoPos(openChoice.mate), 0.34, "pass", { passTo: openChoice.mate });
            } else {
              startShot(P, { auto: true, stepback: true, name: "STEP BACK" });
            }
          }
        };

        // Update Team A AI Players (Offense, Loose Ball, & Full Defense Moves)
        teamA.forEach((P, i) => {
          if (P.isBench || !P.root.visible || P.isUser || remoteDrivenEntities.has(P)) return;
          if (P === nearestLooseA || (canAiChaseBall && Math.hypot(P.root.position.x - ball.position.x, P.root.position.z - ball.position.z) < 2.7)) {
            aiSteer(P, ball.position.x, ball.position.z, 12.6, dt);
            if (ball.position.y > 1.75 && P.h <= 0.05 && Math.hypot(P.root.position.x - ball.position.x, P.root.position.z - ball.position.z) < 2.2) {
              P.vy = 5.0;
            }
            return;
          }
          if (isPassInFlight && state.flight?.passTo === P) {
            aiSteer(P, ball.position.x, ball.position.z, 11.4, dt);
            return;
          }
          if (state.owner === P) {
            runAiBallHandler(P, i, teamA, teamB, HOOP_X);
          } else if (isTeamA) {
            const dyn = computeDynamicOffBallTarget({
              slotIdx: i,
              targetHoopX: HOOP_X,
              ballOwnerPos: ballOwnerA ? { x: ballOwnerA.root.position.x, z: ballOwnerA.root.position.z } : null,
              shotInFlight: isShotInFlight,
              isFastBreak: isTeamATransition,
              offenseTactic: currentTactics.offense,
              activePlayCall: activeOffensePlayRef.current,
              timeSec,
            });
            if (dyn.isCutting) P.offState.cutActionT = Math.max(P.offState.cutActionT, 0.25);
            aiSteer(P, dyn.x, dyn.z, dyn.speed, dt);
          } else {
            executeAiDefender(P, i, -HOOP_X, teamA, teamB, ballOwnerB, defSchemeTeamA);
          }
        });

        // Update Team B AI Players (Offense, Loose Ball, & Full Defense Moves)
        teamB.forEach((P, i) => {
          if (P.isBench || !P.root.visible || remoteDrivenEntities.has(P)) return;
          if (P === nearestLooseB || (canAiChaseBall && Math.hypot(P.root.position.x - ball.position.x, P.root.position.z - ball.position.z) < 2.7)) {
            aiSteer(P, ball.position.x, ball.position.z, 12.6, dt);
            if (ball.position.y > 1.75 && P.h <= 0.05 && Math.hypot(P.root.position.x - ball.position.x, P.root.position.z - ball.position.z) < 2.2) {
              P.vy = 5.0;
            }
            return;
          }
          if (isPassInFlight && state.flight?.passTo === P) {
            aiSteer(P, ball.position.x, ball.position.z, 11.4, dt);
            return;
          }
          if (state.owner === P) {
            runAiBallHandler(P, i, teamB, teamA, -HOOP_X);
          } else if (!isTeamA) {
            const dyn = computeDynamicOffBallTarget({
              slotIdx: i,
              targetHoopX: -HOOP_X,
              ballOwnerPos: ballOwnerB ? { x: ballOwnerB.root.position.x, z: ballOwnerB.root.position.z } : null,
              shotInFlight: isShotInFlight,
              isFastBreak: isTeamBTransition,
              offenseTactic: "balanced",
              activePlayCall: null,
              timeSec,
            });
            if (dyn.isCutting) P.offState.cutActionT = Math.max(P.offState.cutActionT, 0.25);
            aiSteer(P, dyn.x, dyn.z, dyn.speed, dt);
          } else {
            executeAiDefender(P, i, HOOP_X, teamB, teamA, ballOwnerA, defSchemeTeamB);
          }
        });

        // DEFENSE / FOULS / STEALS (realistic steal probability + inbound/catch grace so both teams run sets & shoot)
        if (state.stealGraceT > 0) state.stealGraceT = Math.max(0, state.stealGraceT - dt);
        if (state.owner && state.ballMode === "dribble" && state.stealGraceT <= 0) {
          const owner = state.owner;
          const opponentTeam = teamA.includes(owner) ? teamB : teamA;
          const isTeamADefending = !teamA.includes(owner);
          const ownerNearHoop = isNearHoop(owner.root.position);
          let stealRadius = ownerNearHoop ? 1.15 : 0.85;
          let stealProb = (ownerNearHoop ? 0.0032 : 0.0014) * dt * 60;
          let foulProb = ownerNearHoop ? 0.14 : 0.22;

          if (isTeamADefending) {
            if (currentTactics.defense === "press") {
              stealRadius = ownerNearHoop ? 1.35 : 1.05;
              stealProb = (ownerNearHoop ? 0.005 : 0.0028) * dt * 60;
              foulProb = 0.28;
            } else if (currentTactics.defense === "conservative") {
              stealRadius = ownerNearHoop ? 0.95 : 0.65;
              stealProb = (ownerNearHoop ? 0.002 : 0.0005) * dt * 60;
              foulProb = 0.0;
            } else if (currentTactics.defense === "zone") {
              stealRadius = ownerNearHoop ? 1.1 : 0.8;
              stealProb = (ownerNearHoop ? 0.003 : 0.0012) * dt * 60;
              foulProb = 0.14;
            }
          }

          const defBonus = !isTeamADefending ? 1 : 1 + (athleteProfileRef.current.attributes.defense - 75) / 140;

          opponentTeam.forEach(opp => {
            if (opp.isBench || !opp.root.visible || opp.defState.stumbleT > 0) return;
            const dist = opp.root.position.distanceTo(owner.root.position);
            if (dist < stealRadius) {
              const stanceStealBoost = opp.defState.stanceActive ? 1.35 : 1;
              const prob = (opp.isUser ? stealProb * defBonus : stealProb) * stanceStealBoost;
              if (Math.random() < prob) {
                const effFoulProb = opp.defState.verticalWallT > 0 ? 0 : foulProb;
                if (Math.random() < effFoulProb) performFoul(opp, owner);
                else {
                  state.owner = opp;
                  state.stealGraceT = 1.2;
                  state.fastTransitionT = 3.6;
                  if (opp.isUser) matchExtraStatsRef.current.steals++;
                  Audio.squeak({ pan: clamp(opp.root.position.z / 7.5, -1, 1), vol: 0.8, entityKey: opp.name });
                  Audio.crowdReaction({ vol: 0.85 });
                  triggerMsg(ownerNearHoop ? "STOLE FROM HOOP!" : "STEAL!", "#337733");
                  Audio.commentary("steal");
                }
              }
            }
          });
        }
      }

      // SEPARATE OVERLAPPING PLAYERS (prevents clustering/jamming in paint or rebounds)
      resolvePlayerCollisions();

      // PHYSICS
      entities.forEach(P => {
        if(P.isBench) return;
        if (!Number.isFinite(P.root.position.x) || !Number.isFinite(P.root.position.z)) {
          P.root.position.set(0, 0, 0);
          P.vel.set(0, 0, 0);
        }
        if (!Number.isFinite(P.h) || !Number.isFinite(P.vy)) {
          P.h = 0;
          P.vy = 0;
        }
        const remotePose = remoteDrivenEntities.has(P) ? ((P as any)._remotePose as PoseSnapshot | null) : null;
        if (remotePose) {
          const L = P.legs, A = P.arms;
          L.R.hip.rotation.x = remotePose.hipR; L.R.knee.rotation.x = remotePose.kneeR;
          L.L.hip.rotation.x = remotePose.hipL; L.L.knee.rotation.x = remotePose.kneeL;
          A.R.sh.rotation.x = remotePose.shR; A.R.el.rotation.x = remotePose.elR;
          A.L.sh.rotation.x = remotePose.shL; A.L.el.rotation.x = remotePose.elL;
          P.torso.rotation.x = remotePose.lean;
          P.pelvis.position.y = 0.95 - remotePose.crouch;
          P.root.position.y = P.h;
          P.root.rotation.y = P.faceYaw;
          return;
        }
        if(P.act) {
          P.act.t += dt;
          if(P.act.update) P.act.update();
          if(!Number.isFinite(P.act.t) || P.act.t >= P.act.dur || P.act.t > 3.5) {
            if(P.act.end) P.act.end();
            P.act = null;
            P.shield = false;
          }
        }
        if (state.owner === P && state.ballMode === "held" && !P.act) {
          state.ballMode = "dribble";
        }
        // Preserve vertical gravity / jump integration cleanly without tipping
        const wasAir = P.h > 0.03;
        if (P.h > 0 || P.vy > 0) {
          const vSteps = Math.max(1, Math.min(3, Math.ceil(dt / MOVEMENT_SETTINGS.fixedStep)));
          const vDt = dt / vSteps;
          for (let vs = 0; vs < vSteps; vs++) {
            P.vy -= G * vDt;
            P.h += P.vy * vDt;
            if (P.h <= 0) { P.h = 0; P.vy = 0; break; }
          }
        }
        if (wasAir && P.h <= 0.02) {
          (P as any).landingT = 0.16;
        }
        if ((P as any).landingT > 0) {
          (P as any).landingT = Math.max(0, (P as any).landingT - dt);
        }
        const sp = Math.hypot(P.vel.x, P.vel.z);
        const fa = fwd(P);
        const hoopYaw = Math.atan2(fa.x, fa.z);
        const velYaw = sp > 0.05 ? Math.atan2(P.vel.x, P.vel.z) : hoopYaw;
        const movingTowardHoop = sp > 0.2 ? (P.vel.x * fa.x + P.vel.z * fa.z) / sp : 1;
        const isDefendingOpponent =
          Boolean(
            state.owner &&
              ((teamA.includes(P) && teamB.includes(state.owner)) ||
                (teamB.includes(P) && teamA.includes(state.owner)))
          );
        const stanceFacingTarget =
          !P.act && P.defState.stanceActive && isDefendingOpponent && state.owner && sp < 10.6
            ? Math.atan2(
                state.owner.root.position.x - P.root.position.x,
                state.owner.root.position.z - P.root.position.z
              )
            : null;
        const targetYaw =
          stanceFacingTarget !== null
            ? stanceFacingTarget
            : !P.act && sp > 0.18 && (state.owner !== P || sp > 3.6 || movingTowardHoop > -0.25)
              ? velYaw
              : hoopYaw;
        const yawDiff = Math.atan2(Math.sin(targetYaw - P.faceYaw), Math.cos(targetYaw - P.faceYaw));
        const rotAlpha = 1 - Math.exp(-MOVEMENT_SETTINGS.rotationSpeed * dt);
        P.faceYaw += yawDiff * rotAlpha;
        P.root.rotation.x = 0;
        P.root.rotation.z = 0;

        // Decompose velocity in player-local space (forward/backpedal vs lateral shuffle)
        const faceSin = Math.sin(P.faceYaw);
        const faceCos = Math.cos(P.faceYaw);
        const fwdSp = P.vel.x * faceSin + P.vel.z * faceCos;
        const latSp = P.vel.x * faceCos - P.vel.z * faceSin;
        const isBackpedaling = fwdSp < -0.55 && Math.abs(fwdSp) >= Math.abs(latSp) * 0.85;
        const isLateralShuffle = !P.act && P.h <= 0.03 && sp > 0.5 && Math.abs(latSp) > Math.abs(fwdSp) * 1.25 && sp < 7.0;

        // Ground-matched phase cadence so sneakers plant naturally without skating
        P.runPhase += (isBackpedaling ? -1 : 1) * dt * clamp(sp * 1.82, 0, 21.5);

        const strideAmp = clamp((sp - 0.25) / 5.2, 0, 1);
        const sprintAmp = clamp((sp - 5.4) / 5.8, 0, 1);
        const T: any = {
          shR: -0.22,
          elR: -0.48,
          shL: -0.22,
          elL: -0.48,
          hipR: -0.04,
          kneeR: 0.09,
          hipL: -0.04,
          kneeL: 0.09,
          lean: 0.02,
          crouch: 0.015,
          ankR: 0,
          ankL: 0,
          hipRollR: 0,
          hipRollL: 0,
          shRollR: -0.06,
          shRollL: 0.06,
          twist: 0,
          pelvYaw: 0,
          pelvRoll: 0,
          bob: 0,
        };

        if (P.h > 0.03) {
          // Explosive airborne jump posture: knees bend & lift clearly off the ground
          const airFrac = clamp(P.h / 0.52, 0, 1);
          T.crouch = 0;
          T.bob = 0.08 * airFrac;
          T.hipR = -0.38 - 0.62 * airFrac;
          T.hipL = -0.32 - 0.54 * airFrac;
          T.kneeR = 0.52 + 1.06 * airFrac;
          T.kneeL = 0.45 + 0.96 * airFrac;
          T.ankR = 0.44 * airFrac;
          T.ankL = 0.44 * airFrac;
          T.shR = -0.65;
          T.shL = -0.65;
          T.elR = -0.85;
          T.elL = -0.85;
        } else if ((P as any).landingT > 0) {
          // Cushioned landing knee-flex absorption
          const landFrac = (P as any).landingT / 0.16;
          T.crouch = 0.14 * landFrac;
          T.hipR = -0.35 * landFrac;
          T.hipL = -0.35 * landFrac;
          T.kneeR = 0.65 * landFrac;
          T.kneeL = 0.65 * landFrac;
          T.lean = 0.12 * landFrac;
        } else if (isLateralShuffle) {
          // Real basketball defensive slide / lateral shuffle
          const shuf = Math.sin(P.runPhase * 1.15);
          const open = Math.abs(shuf);
          T.crouch = 0.15 + open * 0.03;
          T.lean = 0.16;
          T.hipR = -0.34 - open * 0.14;
          T.hipL = -0.34 - open * 0.14;
          T.kneeR = 0.56 + open * 0.22;
          T.kneeL = 0.56 + open * 0.22;
          T.hipRollR = -0.14 - Math.max(0, shuf) * 0.22;
          T.hipRollL = 0.14 + Math.max(0, -shuf) * 0.22;
          T.shRollR = -0.38;
          T.shRollL = 0.38;
          T.shR = -0.55;
          T.shL = -0.55;
          T.elR = -1.05;
          T.elL = -1.05;
          T.bob = (open - 0.5) * 0.04;
        } else if (sp > 0.25) {
          // Full human running / sprinting / backpedal gait biomechanics
          const pR = P.runPhase;
          const pL = P.runPhase + Math.PI;
          const sR = Math.sin(pR);
          const cR = Math.cos(pR);
          const sL = Math.sin(pL);
          const cL = Math.cos(pL);

          const thighSwing = 0.58 * strideAmp + 0.24 * sprintAmp;
          const kneeFold = 0.65 * strideAmp + 0.58 * sprintAmp;
          const stanceFlex = 0.16 + 0.14 * strideAmp;
          const backFactor = isBackpedaling ? 0.72 : 1;

          // Asymmetric thigh swing (higher knee drive in front, smooth extension behind)
          T.hipR = (-sR * thighSwing - 0.08 * strideAmp) * backFactor;
          T.hipL = (-sL * thighSwing - 0.08 * strideAmp) * backFactor;

          // Dynamic knee bend: folds deeply during recovery swing (heel kick) & softens on landing
          T.kneeR = stanceFlex + Math.max(0, isBackpedaling ? -cR : cR) * kneeFold;
          T.kneeL = stanceFlex + Math.max(0, isBackpedaling ? -cL : cL) * kneeFold;

          // Ankle roll: plantarflex toe push-off behind, dorsiflex heel clearance in front
          T.ankR = cR < 0 ? 0.4 * strideAmp * (-cR) : -0.26 * strideAmp * cR;
          T.ankL = cL < 0 ? 0.4 * strideAmp * (-cL) : -0.26 * strideAmp * cL;

          // Double-frequency vertical stride float + cushioned knee absorption
          T.bob = (Math.abs(sR) - 0.42) * (0.045 * strideAmp + 0.042 * sprintAmp);
          T.crouch = 0.03 + 0.04 * strideAmp;

          // Forward sprint lean, pelvis/shoulder counter-rotation, and banking into sharp cuts
          T.lean = isBackpedaling
            ? -0.05
            : 0.06 + 0.13 * strideAmp + 0.13 * sprintAmp;
          T.pelvYaw = sR * (0.08 * strideAmp + 0.07 * sprintAmp);
          T.twist = -sR * (0.14 * strideAmp + 0.11 * sprintAmp);
          T.pelvRoll = cR * 0.038 * strideAmp + clamp(-yawDiff * 0.16, -0.18, 0.18);

          // Opposite bent-elbow athletic arm pump (right arm forward with left leg, left arm forward with right leg)
          const armGain = 0.56 * strideAmp + 0.38 * sprintAmp;
          T.shR = sR * armGain - 0.12;
          T.shL = -sR * armGain - 0.12;
          T.elR = -0.78 - 0.44 * strideAmp - Math.max(0, -sR) * (0.36 * strideAmp + 0.2 * sprintAmp);
          T.elL = -0.78 - 0.44 * strideAmp - Math.max(0, sR) * (0.36 * strideAmp + 0.2 * sprintAmp);
          T.shRollR = -0.08 - 0.06 * sprintAmp;
          T.shRollL = 0.08 + 0.06 * sprintAmp;
        } else {
          // Subtle living idle breathing & athletic ready stance
          const breathe = Math.sin(now * 0.0032 + P.faceYaw);
          T.bob = breathe * 0.008;
          T.crouch = 0.025;
          T.kneeR = 0.12;
          T.kneeL = 0.12;
          T.shR = -0.22 + breathe * 0.015;
          T.shL = -0.22 + breathe * 0.015;
        }

        if (!P.act && P.h <= 0.03 && P.defState.stanceActive) {
          T.crouch = Math.max(T.crouch, 0.24);
          T.lean = Math.max(T.lean, 0.15);
          if (!isLateralShuffle) {
            T.hipR = -0.42;
            T.hipL = -0.42;
            T.kneeR = 0.72;
            T.kneeL = 0.72;
            T.hipRollR = -0.18;
            T.hipRollL = 0.18;
          }
          T.shR = -2.08;
          T.elR = -0.45;
          T.shL = -1.05;
          T.elL = -0.75;
          T.shRollL = 0.68;
        }
        if (!P.act && P.offState.openWaveT > 0 && state.owner !== P) {
          T.shR = -2.45;
          T.elR = -0.35;
        }
        if(state.owner === P && state.ballMode === "dribble" && !P.act) {
          const k = P.hand, o = k === "R" ? "L" : "R";
          T["sh" + k] = -0.45 - 0.12 * strideAmp;
          T["el" + k] = -1.05;
          if (sp <= 0.6) {
            T["sh" + o] = -0.75;
            T["el" + o] = -1.35;
          }
          T.lean = Math.max(T.lean, 0.12 + 0.14 * sprintAmp);
        }
        if(P.act?.pose) P.act.pose(clamp(P.act.t/P.act.dur, 0, 1), T);
        const k_ = Math.min(1, dt * 20);
        for(const key in T) (P.cur as any)[key] += ((T as any)[key] - (P.cur as any)[key]) * k_;
        const c = P.cur, L = P.legs, A = P.arms;
        L.R.hip.rotation.x = c.hipR;
        L.R.hip.rotation.z = c.hipRollR || 0;
        L.R.knee.rotation.x = c.kneeR;
        L.R.ankle.rotation.x = c.ankR || 0;
        L.L.hip.rotation.x = c.hipL;
        L.L.hip.rotation.z = c.hipRollL || 0;
        L.L.knee.rotation.x = c.kneeL;
        L.L.ankle.rotation.x = c.ankL || 0;
        A.R.sh.rotation.x = c.shR;
        A.R.sh.rotation.z = c.shRollR || 0;
        A.R.el.rotation.x = c.elR;
        A.L.sh.rotation.x = c.shL;
        A.L.sh.rotation.z = c.shRollL || 0;
        A.L.el.rotation.x = c.elL;
        P.pelvis.position.y = 0.95 - c.crouch + (c.bob || 0);
        // Analytical Foot-Floor Grounding IK so sneakers stay firmly planted without clipping or hovering
        if (P.h <= 0.03) {
          const legH_R = 0.44 * Math.cos(c.hipR) + 0.49 * Math.cos(c.hipR + c.kneeR);
          const legH_L = 0.44 * Math.cos(c.hipL) + 0.49 * Math.cos(c.hipL + c.kneeL);
          const groundedPelvisY = clamp(Math.max(legH_R, legH_L) + 0.055 + (c.bob || 0), 0.56, 0.96);
          P.pelvis.position.y = groundedPelvisY;
        }
        P.pelvis.rotation.y = c.pelvYaw || 0;
        P.pelvis.rotation.z = c.pelvRoll || 0;
        P.torso.rotation.x = c.lean;
        P.torso.rotation.y = c.twist || 0;
        P.headGroup.rotation.x = -c.lean * 0.55;
        P.headGroup.rotation.y = -(c.twist || 0) * 0.65;
        P.root.position.y = P.h;
        P.root.rotation.y = P.faceYaw;

        // Analytical Hand Ball-Tracking IK during dribble so the palm pushes/tracks the live basketball
        if (state.owner === P && state.ballMode === "dribble" && !P.act) {
          const ballRelY = ball.position.y - P.h;
          const armReachBias = clamp((1.05 - ballRelY) * 0.52, -0.22, 0.4);
          A[P.hand].sh.rotation.x += armReachBias * 0.42;
          A[P.hand].el.rotation.x -= armReachBias * 0.62;
        }

        // Dynamic Exertion Sweat (SSS specular sheen), Cloth Hem Flutter, Contact Shadow & Facial Morphs
        const stamVal = P.stamina ?? 1;
        const exertion = clamp(1 - stamVal * 0.88, 0.06, 1);
        updateSkinExertion(P.skinMat, exertion);
        const timeSec = now * 0.001;
        const clothSpd = clamp(sp / 9.5, 0, 1);
        if (P.jerseyMat.userData?.uClothTime) {
          P.jerseyMat.userData.uClothTime.value = timeSec;
          P.jerseyMat.userData.uClothSpeed.value = clothSpd;
        }
        if (P.shortsMat.userData?.uClothTime) {
          P.shortsMat.userData.uClothTime.value = timeSec;
          P.shortsMat.userData.uClothSpeed.value = clothSpd;
        }
        if (P.contactShadow) {
          P.contactShadow.scale.setScalar(clamp(1.0 + P.h * 0.35, 0.88, 1.45));
          (P.contactShadow.material as THREE.MeshBasicMaterial).opacity = clamp(0.76 - P.h * 0.48, 0.12, 0.76);
        }
        P.hypeT = Math.max(0, (P.hypeT || 0) - dt);
        const isSpeakingNow = now < lastSpeechEndMs && (state.owner === P || P.hypeT > 0.25 || P.isUser);
        updateFacialExpression(P.facialRig, dt, {
          timeSec,
          isSpeaking: isSpeakingNow,
          hype: clamp(P.hypeT, 0, 1),
          exertion,
          isDefending: P.defState.stanceActive,
        });

        // SNEAKER SQUEAKS (movement, rapid direction changes > 4.0, pivots, defensive slides, & hard stops)
        if (!P.squeak) P.squeak = { prevVel: V(), cool: 0 };
        P.squeak.cool -= dt;
        const speed = Math.hypot(P.vel.x, P.vel.z);
        const prevSpeed = Math.hypot(P.squeak.prevVel.x, P.squeak.prevVel.z);
        const dotDir =
          speed > 1.2 && prevSpeed > 1.2
            ? (P.vel.x * P.squeak.prevVel.x + P.vel.z * P.squeak.prevVel.z) / (speed * prevSpeed)
            : 1;
        const isHardStop = prevSpeed > 3.2 && speed < 1.3;
        const isRapidDirectionChange = speed > 4.0 && dotDir < 0.72;
        const isDefSlideCut = P.defState.stanceActive && speed > 2.2 && dotDir < 0.88;
        const isFastRunStride = speed > 4.8 && P.h <= 0.05;
        if (P.squeak.cool <= 0 && P.h <= 0.05 && (isHardStop || isRapidDirectionChange || isDefSlideCut || isFastRunStride)) {
          const pan = clamp(P.root.position.z / 7.5, -1, 1);
          const vol = isHardStop || isRapidDirectionChange || isDefSlideCut
            ? clamp(Math.max(speed, prevSpeed) / 5.0, 0.38, 0.95)
            : 0.4;
          Audio.squeak({ pan, vol, entityKey: P.name });
          P.squeak.cool = isFastRunStride && !isHardStop && !isRapidDirectionChange && !isDefSlideCut
            ? 0.42 + Math.random() * 0.25
            : 0.2 + Math.random() * 0.14;
        }
        P.squeak.prevVel.copy(P.vel);
      });

      // CROWD ANIMATION
      state.crowdCheer = Math.max(0, state.crowdCheer - dt * 1.5);
      for (let i = 0; i < crowdData.length; i++) {
        const d = crowdData[i];
        const cheerScale = 1 + state.crowdCheer * (0.5 + Math.sin(now * 0.01 + d.phase) * 0.5);
        const jumpY = Math.max(0, Math.sin(now * 0.005 + d.phase) * 0.1 * (1 + state.crowdCheer * 3));
        _dummy.position.copy(d.pos).add(V(0, jumpY, 0));
        _dummy.scale.set(1, cheerScale, 1);
        _dummy.updateMatrix();
        crowdMesh.setMatrixAt(i, _dummy.matrix);
      }
      crowdMesh.instanceMatrix.needsUpdate = true;

      // BALL
      const stepBall = (h: number) => {
        const p = ball.position; const prevY = p.y; state.ballVel.y -= G*h; p.addScaledVector(state.ballVel, h);
        // Authentic shooter backspin vs forward roll
        if (state.flight?.kind === "shot") {
          ball.rotation.x -= h * 11;
          ball.rotation.z += h * 1.8;
        } else {
          ball.rotation.x += h * 8;
          ball.rotation.z += h * 2.5;
        }
        // Keep ball inside playable court perimeter so it never leaves bounds or gets stuck behind walls
        if (p.x > 13.55 || p.x < -13.55) {
          p.x = clamp(p.x, -13.55, 13.55);
          state.ballVel.x = -state.ballVel.x * 0.72;
        }
        if (p.z > 7.1 || p.z < -7.1) {
          p.z = clamp(p.z, -7.1, 7.1);
          state.ballVel.z = -state.ballVel.z * 0.72;
        }
        if ((p.x >= BOARD_X - BALL_R && state.ballVel.x > 0) || (p.x <= -BOARD_X + BALL_R && state.ballVel.x < 0)) {
          if (p.y > 2.85 && p.y < 4.0 && Math.abs(p.z) < 0.92) {
            state.ballVel.x *= -0.52;
            p.x = p.x < 0 ? -BOARD_X + BALL_R + 0.02 : BOARD_X - BALL_R - 0.02;
            if (state.flight) state.flight.reboundable = true;
            state.hadRimContact = true;
            Audio.backboardHit({ pan: clamp(p.z / 7.5, -1, 1), vol: 0.9 });
          }
        }
        if(!mpGuestMode && state.flight && state.flight.kind !== "pass" && prevY > RIM_Y && p.y <= RIM_Y && state.ballVel.y < 0) {
          const hoopX = teamA.includes(state.flight.shooter) ? HOOP_X : -HOOP_X; const dx = p.x - hoopX, dz = p.z; const d = Math.hypot(dx, dz);
          if(d < RIM_R - 0.03) {
            p.x = hoopX + dx * 0.35;
            p.z = dz * 0.35;
            const shooter = state.flight.shooter;
            shooter.stats.pts += state.flight.pts;
            if (state.lastPasser && state.lastPasser !== shooter && now - state.lastPassTime < 5000) {
              state.lastPasser.stats.ast++;
            }
            state.lastPasser = null;

            const isHome = teamA.includes(shooter);
            const isTikiDunk = Boolean(state.flight.dunk && state.flight.dunkStyle === "tiki_tiki");
            if (shooter.isUser) {
              if (state.flight.dunk) matchExtraStatsRef.current.dunks++;
              if (state.flight.pts === 3) matchExtraStatsRef.current.threes++;
            }
            shooter.hypeT = isTikiDunk ? 2.4 : 1.85;
            triggerNetSwish(isHome ? rightNet : leftNet, state.flight.dunk ? 1.25 : 0.95);
            if(isHome) { state.scoreHome+=state.flight.pts; setScoreHome(state.scoreHome); } else { state.scoreAway+=state.flight.pts; setScoreAway(state.scoreAway); }
            const playTypeLabel = isTikiDunk
              ? "TIKI TIKI SIGNATURE SLAM"
              : state.flight.dunk
              ? "SLAM DUNK"
              : state.flight.layup
              ? "LAYUP"
              : state.flight.pts === 3
              ? "THREE-POINTER"
              : "SWISH";
            triggerMsg(isTikiDunk ? "TIKI TIKI SIGNATURE SLAM!" : playTypeLabel, isTikiDunk ? "#10b981" : isHome ? "#ef476f" : "#1d428a");

            // Capture this scoring play into Game Highlights (keeps last 3 scoring plays)
            const snapFrame = captureCurrentFrame(now);
            const clipFrames = [...rollingFrames.slice(-68), snapFrame];
            const clip: HighlightClip = {
              id: `hl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              quarter: state.quarter,
              clockText: formatClockLabel(state.gameClock),
              scorerName: shooter.name,
              team: isHome ? "Home" : "Away",
              playType: playTypeLabel,
              points: state.flight.pts,
              scoreHomeAfter: state.scoreHome,
              scoreAwayAfter: state.scoreAway,
              frames: clipFrames,
              ...(isTikiDunk
                ? { signatureTag: "tiki_tiki_slam" as const, accentColors: ["#10b981", "#facc15"] as [string, string] }
                : {}),
            };
            quarterHighlightsRef.current = [...quarterHighlightsRef.current, clip].slice(-3);
            allHighlightsRef.current = [...allHighlightsRef.current, clip].slice(-3);
            setHighlightsCount(allHighlightsRef.current.length);

            if (!mpGuestMode && activeMpClient && activeMpClient.roomCode) {
              activeMpClient.sendEvent("basket_scored", {
                scoreHome: mirror ? state.scoreAway : state.scoreHome,
                scoreAway: mirror ? state.scoreHome : state.scoreAway,
                shotClock: 24,
                scorerName: shooter.name,
                playType: playTypeLabel,
                points: state.flight.pts,
              });
            }

            if (shooter.isUser && gameModeRef.current === "training") {
              if (activeAcademyDrillRef.current) {
                const curDrill = activeAcademyDrillRef.current;
                const nextReps = curDrill.repsMade + 1;
                const nextObj = { ...curDrill, repsMade: nextReps, attempts: curDrill.attempts + 1 };
                activeAcademyDrillRef.current = nextObj;
                setActiveAcademyDrill(nextObj);
                if (nextReps >= curDrill.drill.targetReps) {
                  handleCompleteAcademyDrillRef.current();
                }
              } else {
                setTrainingDrill((prev) => {
                  const nextMade = prev.made + 1;
                  if (nextMade >= prev.target) {
                    const drillRes = addDebugCareerStats(10, 0, 1);
                    setCareerStats(drillRes.updatedStats);
                    triggerMsg(`DRILL COMPLETE! +${drillRes.xpGained} XP`, "#10b981");
                    return { ...prev, made: 0, completedCount: prev.completedCount + 1 };
                  }
                  return { ...prev, made: nextMade };
                });
              }
            }
            
            const scorePan = clamp(p.z / 7.5, -1, 1);
            if (!isHome) {
              Audio.crowdBoo({ pan: scorePan, vol: 0.65 });
            }
            if (state.flight.dunk) {
              if (isTikiDunk) {
                triggerTikiSlamVfx(hoopX);
                Audio.tikiTikiSlam({ pan: scorePan, vol: 1.0 });
              } else {
                Audio.dunk({ pan: scorePan, vol: 1.0 });
              }
              Audio.netSwish({ pan: scorePan, vol: 0.7 });
              Audio.crowdScream({ vol: isHome ? 1.0 : 0.45 });
              Audio.commentary("dunk");
            } else if (state.flight.layup) {
              Audio.netSwish({ pan: scorePan, vol: 0.85 });
              Audio.crowdScream({ vol: isHome ? 0.85 : 0.4 });
              Audio.commentary("layup");
            } else if (state.flight.pts === 3) {
              Audio.netSwish({ pan: scorePan, vol: 1.0 });
              Audio.crowdScream({ vol: isHome ? 1.0 : 0.45 });
              Audio.commentary("three");
            } else {
              Audio.netSwish({ pan: scorePan, vol: 0.95 });
              Audio.crowdScream({ vol: isHome ? 0.88 : 0.4 });
              Audio.commentary("swish");
            }

            state.ballMode = "dead";
            state.deadReason = "score";
            state.lastScoringTeam = isHome ? "Home" : "Away";
            state.deadT = 0.65;
            state.ballVel.set(rnd(0.35), -2.4, rnd(0.35));
            state.shotClock = resetShotClock("basket_made");
            setShotClockResetPulse(k => k + 1);
            setLastShotResetReason("basket_made");
            state.flight = null;
            state.crowdCheer = 3.0; // SCREAMING CHEER!
          } else if (d < RIM_R + BALL_R + 0.04 && state.flight.rim < 3) { 
            state.flight.rim++;
            state.flight.reboundable = true;
            const nx = d > 0.01 ? dx / d : 0;
            const nz = d > 0.01 ? dz / d : 1;
            p.y = RIM_Y + 0.03;
            state.ballVel.y = clamp(Math.abs(state.ballVel.y) * 0.44, 1.35, 2.75);
            state.ballVel.x = state.ballVel.x * 0.45 + nx * 2.35;
            state.ballVel.z = state.ballVel.z * 0.45 + nz * 2.35;
            state.hadRimContact = true;
            triggerNetSwish(p.x > 0 ? rightNet : leftNet, 0.4);
            Audio.rimHit({ pan: clamp(p.z / 7.5, -1, 1), vol: 0.92 });
            if (state.flight.rim === 1) {
              Audio.crowdReaction({ vol: 0.72 });
            }
          }
        }
        if(p.y < BALL_R) {
          p.y = BALL_R;
          if(state.ballVel.y < -1.1) {
            const impactVol = clamp(Math.abs(state.ballVel.y) / 9, 0.35, 0.95);
            ball.scale.set(1.07, 0.88, 1.07);
            Audio.floorBounce({ pan: clamp(p.z / 7.5, -1, 1), vol: impactVol });
            state.ballVel.y *= -0.58;
            if(state.flight?.kind === "shot") {
              state.flight = null;
              state.ballMode = "loose";
              triggerMsg("MISS", "#ef476f");
              state.crowdCheer = Math.max(state.crowdCheer, 0.5);
              Audio.crowdReaction({ vol: 0.78 });
              Audio.commentary("miss");
            } else if (state.flight?.kind === "pass" && state.flight.t > 0.22) {
              state.flight = null;
              state.ballMode = "loose";
            }
          } else {
            state.ballVel.y = 0;
            if (state.flight?.kind === "pass" && state.flight.t > 0.22) {
              state.flight = null;
              state.ballMode = "loose";
            }
          }
          state.ballVel.multiplyScalar(0.985);
        }
      };
      if (mpGuestMode && now - remoteBallSync.updatedAt < 1200) {
        // Non-host follows host-authoritative ball & possession state smoothly
        let syncedOwner: GameEntity | null = null;
        if (remoteBallSync.ownerPlayerId && activeMpClient && activeMpRoom) {
          if (remoteBallSync.ownerPlayerId === activeMpClient.playerId) {
            syncedOwner = ME;
          } else {
            syncedOwner = resolvePeerEntityMap(activeMpRoom, activeMpClient.playerId).get(remoteBallSync.ownerPlayerId) || null;
          }
        }
        if (!syncedOwner) {
          syncedOwner = resolveEntityByKey(remoteBallSync.ownerKey);
        }
        state.owner = syncedOwner;
        state.ballMode = remoteBallSync.mode as any;
        state.flight = null;
        if (state.ballMode === "dribble" && state.owner) {
          const P = state.owner;
          P.dribPhase += dt * 8;
          const bounce = Math.abs(Math.cos(P.dribPhase));
          const hp = handPos(P);
          ball.position.set(hp.x, BALL_R + Math.max(0, hp.y - BALL_R) * bounce, hp.z);
        } else if (state.ballMode === "held" && state.owner) {
          const hp = handPos(state.owner);
          ball.position.set(hp.x, hp.y + 0.03, hp.z);
        } else {
          ball.position.lerp(remoteBallSync.pos, 1 - Math.exp(-22 * dt));
          state.ballVel.copy(remoteBallSync.vel);
          ball.rotation.x += dt * 8;
          ball.rotation.z += dt * 2.5;
        }
      } else if(state.ballMode === "dribble" && state.owner) {
        const P = state.owner;
        const playerSpeed = Math.hypot(P.vel.x, P.vel.z);
        const stam = P.stamina ?? 1;
        const prevBounce = Math.abs(Math.cos(P.dribPhase));
        // Tie dribble cadence & weight dynamically to movement speed + stamina (no glued static bounce)
        const dribFreq = 7.4 + clamp(playerSpeed * 0.62, 0, 5.2) * (0.78 + 0.22 * stam);
        P.dribPhase += dt * dribFreq;
        const bounce = Math.abs(Math.cos(P.dribPhase));
        // Trigger dribble & subtle squash right as the ball touches the court floor
        if (prevBounce > 0.2 && bounce <= 0.2) {
          const pan = clamp(P.root.position.z / 7.5, -1, 1);
          ball.scale.set(1.06, 0.89, 1.06);
          Audio.dribble({ pan, vol: clamp(0.65 + playerSpeed * 0.04, 0.65, 0.95) });
        }
        const hp = handPos(P);
        // Lead ball ahead along velocity so basketball carries independent physical momentum
        const leadScale = clamp(playerSpeed * 0.0085, 0, 0.09);
        const dribbleApex = Math.max(0, hp.y - BALL_R) * (1 - clamp(playerSpeed * 0.025, 0, 0.22));
        ball.position.set(
          hp.x + P.vel.x * leadScale,
          BALL_R + dribbleApex * bounce,
          hp.z + P.vel.z * leadScale
        );
        ball.rotation.x += dt * (4.5 + playerSpeed * 0.8);
        ball.rotation.z -= dt * (playerSpeed * 0.35);
      }
      else if(state.ballMode === "held" && state.owner) { const hp = handPos(state.owner); ball.position.set(hp.x, hp.y+0.03, hp.z); }
      else {
        for(let i=0; i<4; i++) stepBall(dt/4);
        if(state.ballMode === "dead") {
          state.deadT -= dt;
          if(state.deadT <= 0) {
            const isPractice = gameModeRef.current === "freestyle" || gameModeRef.current === "training";
            if (!isPractice && state.deadReason === "score" && state.lastScoringTeam === "Home") {
              const inbounder = teamB.find((p) => !p.isBench && p.root.visible) || teamB[0];
              inbounder.root.position.set(12.2, 0, clamp(ball.position.z, -2.5, 2.5));
              inbounder.holdT = 0.15;
              state.owner = inbounder;
            } else {
              if (!isPractice && state.deadReason === "score" && state.lastScoringTeam === "Away") {
                ME.root.position.set(-12.2, 0, clamp(ball.position.z, -2.5, 2.5));
              }
              ME.holdT = 0;
              state.owner = ME;
            }
            state.ballMode = "dribble";
            state.deadReason = null;
            state.stealGraceT = 1.35;
            state.ballVel.set(0, 0, 0);
            state.fastTransitionT = 3.6;
          }
        }
      }
      if(!mpGuestMode && state.flight) {
        state.flight.t += dt;
        if(state.flight.kind === "pass") {
          const t = state.flight.passTo;
          // Passes travel through 3D space as physical projectiles with independent momentum (no auto-lock homing)
          // Check defenders' extended arm & body passing-lane reach for dynamic deflections & steals
          let interceptedOrDeflected = false;
          if (state.flight.t > 0.05) {
            const passerIsHome = teamA.includes(state.flight.shooter);
            const laneDefenders = passerIsHome ? teamB : teamA;
            for (const def of laneDefenders) {
              if (def.isBench || !def.root.visible || def.defState.stumbleT > 0) continue;
              const isUserDef = def === ME && state.isDefending;
              const laneReach =
                def.defState.passLaneHunterT > 0 ? 2.45 : isUserDef || def.defState.stanceActive ? 1.55 : 1.1;
              if (ball.position.distanceTo(torsoPos(def)) < laneReach && ball.position.y < 2.75 + def.h) {
                const wantIntercept =
                  (def.defState.passLaneHunterT > 0 && def.defState.passLaneMode === "intercept") ||
                  (isUserDef && Math.random() < 0.72);
                if (wantIntercept) {
                  state.owner = def;
                  state.ballMode = "dribble";
                  state.flight = null;
                  state.stealGraceT = 1.2;
                  state.fastTransitionT = 3.6;
                  if (def.isUser) matchExtraStatsRef.current.steals++;
                  state.shotClock = resetShotClock("turnover");
                  setShotClockResetPulse((k) => k + 1);
                  setLastShotResetReason("turnover");
                  Audio.catchBall({ pan: clamp(def.root.position.z / 7.5, -1, 1), vol: 0.9 });
                  Audio.commentary("steal");
                  triggerMsg("PASS INTERCEPTED!", "#10b981");
                  interceptedOrDeflected = true;
                  break;
                } else if (def.defState.passLaneHunterT > 0 || isUserDef || def.defState.stanceActive || Math.random() < 0.28) {
                  state.flight = null;
                  state.ballMode = "loose";
                  state.ballVel.set(rnd(4.5), 2.6, rnd(4.5));
                  Audio.backboardHit({ pan: clamp(def.root.position.z / 7.5, -1, 1), vol: 0.78 });
                  triggerMsg("PASS DEFLECTED!", "#38bdf8");
                  interceptedOrDeflected = true;
                  break;
                }
              }
            }
          }
          if (!interceptedOrDeflected && state.flight && t && ball.position.distanceTo(torsoPos(t)) < 1.15) {
            state.owner = t; state.ballMode = "dribble"; state.flight = null; t.holdT = 0; state.stealGraceT = 0.85;
            Audio.catchBall({ pan: clamp(t.root.position.z / 7.5, -1, 1), vol: 0.8 });
            if(t.isUser) triggerLabel("GOT IT");
          } else if (!interceptedOrDeflected && state.flight && state.flight.t > state.flight.T + 0.45) {
            state.flight = null;
            state.ballMode = "loose";
          }
        } else if (state.flight.kind === "shot") {
          // Live Shot Block Check (Wall-Up Verticality, Volley Swat, Chase-Down, & Timed Shot Contests)
          if (!state.flight.reboundable && state.flight.t < 0.58) {
            const shooterIsHome = teamA.includes(state.flight.shooter);
            const blkDefenders = shooterIsHome ? teamB : teamA;
            for (const def of blkDefenders) {
              if (def.isBench || !def.root.visible) continue;
              const hasVolley = (def.defState.volleySwatT ?? 0) > 0;
              const canBlock =
                def.h > 0.14 ||
                def.defState.verticalWallT > 0 ||
                hasVolley ||
                (def.defState.contestT > 0 && def.h > 0.04);
              if (!canBlock) continue;
              const horizDist = Math.hypot(def.root.position.x - ball.position.x, def.root.position.z - ball.position.z);
              const maxHoriz = hasVolley ? 2.6 : 1.85;
              const maxVert =
                2.45 + def.h * 1.15 + (def.defState.verticalWallT > 0 ? 0.35 : 0) + (hasVolley ? 0.8 : 0);
              if (horizDist < maxHoriz && ball.position.y <= maxVert && ball.position.y >= 1.2) {
                triggerShotBlock(
                  def,
                  hasVolley
                    ? "VOLLEY SWAT REJECTION!"
                    : def.defState.verticalWallT > 0
                    ? "VERTICAL WALL BLOCK!"
                    : "BLOCKED!"
                );
                break;
              }
            }
          }
          if (state.flight && state.flight.t > 3.8) {
            state.flight = null; state.ballMode = "loose";
          }
        }
        else if(state.flight && state.flight.t > 3.5) { state.flight = null; state.ballMode = "loose"; }
      }
      // Take / Rebound Basketball directly from the hoop or loose on floor (respecting opponent scored inbounds in matches)
      const isPracticeDeadInbound = gameModeRef.current === "freestyle" || gameModeRef.current === "training";
      const canGrabOrTakeFromHoop =
        !mpGuestMode &&
        (state.ballMode === "loose" ||
        (isPracticeDeadInbound && state.ballMode === "dead" && state.deadReason === "score" && state.deadT < 0.5) ||
        (state.ballMode === "flight" &&
          state.flight?.kind === "shot" &&
          (state.flight.reboundable || (isNearHoop(ball.position) && state.ballVel.y < 1.2 && ball.position.y <= 3.35))));

      if(canGrabOrTakeFromHoop) { 
        let best: GameEntity | null = null, bd = 2.4; 
        const teamARebMax = tacticsRef.current.defense === "zone" ? 2.05 : 1.8;
        const ballAtHoop = isNearHoop(ball.position);
        entities.forEach(P => {
          if(P.isBench || !P.root.visible) return;
          if(state.ballMode === "dead" && state.deadReason === "score" && !P.isUser) {
            const pIsHome = teamA.includes(P);
            if ((state.lastScoringTeam === "Home" && pIsHome) || (state.lastScoringTeam === "Away" && !pIsHome)) {
              return;
            }
          }
          const maxReachY = 2.55 + P.h * 0.95;
          if (ball.position.y > maxReachY) return;
          const jumpBonus = P.h > 0.1 ? 0.35 : 0;
          const boxOutBonus = P.defState.boxOutT > 0 || P.offState.reboundBoostT > 0 ? 0.85 : 0;
          const maxDist = (P.isUser ? 1.95 : (teamA.includes(P) ? teamARebMax : 1.75)) + jumpBonus + boxOutBonus;
          const d = Math.hypot(P.root.position.x - ball.position.x, P.root.position.z - ball.position.z);
          if(d < maxDist && (!best || d < bd)) {
            bd = d;
            best = P;
          }
        }); 
        if(best) { 
          const grabber = best as GameEntity;
          const wasDeadScore = state.ballMode === "dead" && state.deadReason === "score";
          if (state.hadRimContact) {
            grabber.stats.reb++;
            state.hadRimContact = false;
            state.shotClock = resetShotClock("offensive_rebound");
            setShotClockResetPulse(k => k + 1);
            setLastShotResetReason("rebound");
          }
          grabber.act = null;
          grabber.shield = false;
          grabber.holdT = 0;
          state.owner = grabber;
          state.ballMode = "dribble";
          state.flight = null;
          state.deadT = 0;
          state.deadReason = null;
          state.looseT = 0;
          state.stealGraceT = 1.1;
          state.fastTransitionT = 3.6;
          Audio.catchBall({ pan: clamp(grabber.root.position.z / 7.5, -1, 1), vol: 0.85 });
          if (grabber.isUser) {
            triggerLabel(ballAtHoop ? (wasDeadScore ? "STOLE FROM HOOP!" : "TOOK FROM HOOP!") : "GOT BALL!");
          }
        } 
      }

      // Watchdog: keep ball moving — recover cleanly if loose > 2.0s (or 0.85s if stationary)
      if (!mpGuestMode && !state.owner && state.ballMode === "loose") {
        state.looseT += dt;
        ball.position.x = clamp(ball.position.x, -13.55, 13.55);
        ball.position.z = clamp(ball.position.z, -7.1, 7.1);
        const looseSpd = Math.hypot(state.ballVel.x, state.ballVel.z);
        if (state.looseT > 2.0 || (looseSpd < 0.35 && state.looseT > 0.85)) {
          state.looseT = 0;
          state.flight = null;
          state.ballVel.set(0, 0, 0);
          let nearestActive: GameEntity = ME;
          let bestD = Infinity;
          for (const P of entities) {
            if (P.isBench || !P.root.visible) continue;
            const d = Math.hypot(P.root.position.x - ball.position.x, P.root.position.z - ball.position.z);
            if (d < bestD) { bestD = d; nearestActive = P; }
          }
          state.owner = nearestActive;
          state.ballMode = "dribble";
          nearestActive.act = null;
          nearestActive.holdT = 0;
          if (nearestActive.isUser) triggerLabel("RECOVERED BALL");
        }
      } else {
        state.looseT = 0;
      }

      // Track if ball is loose, rebounding at hoop, or stealable near hoop for UI button
      const looseNow =
        distMeToBall < 4.5 &&
        state.owner !== ME &&
        (state.ballMode === "loose" ||
          (state.ballMode === "dead" && state.deadReason === "score") ||
          (state.ballMode === "flight" &&
            state.flight?.kind === "shot" &&
            ball.position.y < 3.45 &&
            (state.flight.reboundable || isNearHoop(ball.position))) ||
          Boolean(
            state.owner &&
              !teamA.includes(state.owner) &&
              isNearHoop(ball.position) &&
              ME.root.position.distanceTo(state.owner.root.position) < 2.85
          ));
      if (looseNow !== isBallLooseRef.current) {
        isBallLooseRef.current = looseNow;
        setIsBallLoose(looseNow);
      }

      // Rolling Highlights Snapshot Buffer (~30fps)
      if (now - lastSnapshotAt >= 32) {
        lastSnapshotAt = now;
        rollingFrames.push(captureCurrentFrame(now));
        if (rollingFrames.length > 85) rollingFrames.shift();
      }

      // Cross-Play Multiplayer Broadcast Sync (~20Hz)
      if (activeMpRoom && activeMpClient && activeMpClient.transport !== "disconnected" && now - lastMpSyncAt >= 50) {
        lastMpSyncAt = now;
        const isHost = !activeMpRoom.hostId || activeMpRoom.hostId === activeMpClient.playerId;
        const sign = mirror ? -1 : 1;
        let ownerPlayerId: string | null = null;
        if (state.owner === ME) {
          ownerPlayerId = activeMpClient.playerId;
        } else if (state.owner) {
          const peerEntries = resolvePeerEntityMap(activeMpRoom, activeMpClient.playerId).entries();
          for (const [pid, ent] of peerEntries) {
            if (ent === state.owner) {
              ownerPlayerId = pid;
              break;
            }
          }
        }
        activeMpClient.sendSync({
          transform: {
            x: ME.root.position.x * sign,
            y: ME.root.position.y,
            z: ME.root.position.z * sign,
            vx: ME.vel.x * sign,
            vz: ME.vel.z * sign,
            faceYaw: ME.faceYaw + (mirror ? Math.PI : 0),
            h: ME.h,
            pose: {
              hipR: ME.cur.hipR,
              hipL: ME.cur.hipL,
              kneeR: ME.cur.kneeR,
              kneeL: ME.cur.kneeL,
              shR: ME.cur.shR,
              shL: ME.cur.shL,
              elR: ME.cur.elR,
              elL: ME.cur.elL,
              lean: ME.cur.lean,
              crouch: ME.cur.crouch,
            },
          },
          stats: {
            pts: ME.stats.pts,
            ast: ME.stats.ast,
            reb: ME.stats.reb,
          },
          matchPatch: isHost
            ? {
                scoreHome: mirror ? state.scoreAway : state.scoreHome,
                scoreAway: mirror ? state.scoreHome : state.scoreAway,
                quarter: state.quarter,
                gameClock: Math.ceil(state.gameClock),
                shotClock: state.shotClock,
                ballPos: [ball.position.x * sign, ball.position.y, ball.position.z * sign],
                ballVel: [state.ballVel.x * sign, state.ballVel.y, state.ballVel.z * sign],
                ballMode: state.ballMode,
                ownerPlayerId,
                ownerEntityKey: getOwnerEntityKey(state.owner),
                cityId: currentCity.id,
                mode: gameModeRef.current,
              }
            : undefined,
        });
      }

      // Ground team ring indicator under active user player
      playerGroundRing.position.set(ME.root.position.x, 0.025, ME.root.position.z);
      (playerGroundRing.material as THREE.MeshBasicMaterial).color.setHex(
        state.isDefending ? 0x38bdf8 : state.owner === ME ? 0xf59e0b : 0xef4444
      );

      // 2K WEIGHTED BROADCAST CAMERA PIVOT (Sweeps smoothly down court + subtle zoom shift on offense/defense)
      const isUserOffense = state.owner ? teamA.includes(state.owner) : state.lastScoringTeam === "Away";
      const targetFov = isUserOffense ? 47.5 : 52.0;
      if (Math.abs(camera.fov - targetFov) > 0.05) {
        camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 3.5);
        camera.updateProjectionMatrix();
      }
      const focusX = ME.root.position.x * 0.78 + ball.position.x * 0.22 + ME.vel.x * 0.12;
      const focusY = 1.18 + ME.h * 0.42;
      const focusZ = ME.root.position.z * 0.78 + ball.position.z * 0.22 + ME.vel.z * 0.12;
      const sideZoomShift = isUserOffense ? -0.45 : 0.65;
      const effectiveRadius = orbitRadius + sideZoomShift;
      const camTarget = V(
        focusX + effectiveRadius * Math.sin(orbitPhi) * Math.cos(orbitTheta),
        focusY + effectiveRadius * Math.cos(orbitPhi),
        focusZ + effectiveRadius * Math.sin(orbitPhi) * Math.sin(orbitTheta)
      );
      camera.position.lerp(camTarget, 1 - Math.exp(-7.2 * dt));
      state.camLook.lerp(V(focusX, focusY, focusZ), 1 - Math.exp(-9.5 * dt));
      camera.lookAt(state.camLook);

      // Project Floating Player Name, Stamina Bar & Team Ring Tag above ME's head at 60fps without React re-renders
      if (activeTagRef.current) {
        const tagPos = V(ME.root.position.x, 2.38 + ME.h, ME.root.position.z).project(camera);
        if (tagPos.z < 1) {
          const px = (tagPos.x * 0.5 + 0.5) * window.innerWidth;
          const py = (-tagPos.y * 0.5 + 0.5) * window.innerHeight;
          activeTagRef.current.style.opacity = isOverlayOpenRef.current ? "0" : "1";
          activeTagRef.current.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -100%)`;
          if (staminaBarRef.current) {
            const stamNorm = getStaminaNormalized(ME);
            staminaBarRef.current.style.width = `${Math.round(stamNorm * 100)}%`;
            staminaBarRef.current.style.backgroundColor = ME.isExhausted
              ? "#ef4444"
              : stamNorm < 0.3
              ? "#f97316"
              : "#22c55e";
          }
        } else {
          activeTagRef.current.style.opacity = "0";
        }
      }

      if (isUserOffense !== isUserOffenseRef.current) {
        isUserOffenseRef.current = isUserOffense;
        setIsUserOffenseUI(isUserOffense);
      }

      // Step deformable vertex-animated nets & recover ball squash/stretch smoothly
      if (leftNet) stepDeformableNet(leftNet, dt);
      if (rightNet) stepDeformableNet(rightNet, dt);
      ball.scale.lerp(V(1, 1, 1), Math.min(1, dt * 16));

      state.touchPulses = {};
      prevInput = { ...input, rawKeys: { ...state.keys } };
      const meSpeedBlur = clamp((Math.hypot(ME.vel.x, ME.vel.z) - 6.5) / 6.0, 0, 0.42);
      renderAndSchedule(meSpeedBlur, 0.0, true);
    };

    // Interactive Drag-to-Orbit & Scroll-to-Zoom Event Bindings on Court Canvas
    const onOrbitDown = (e: PointerEvent) => {
      if (e.target !== renderer.domElement || orbitPointerId !== null) return;
      orbitPointerId = e.pointerId;
      orbitLastX = e.clientX;
      orbitLastY = e.clientY;
    };
    const onOrbitUp = (e: PointerEvent) => {
      if (e.pointerId === orbitPointerId) {
        orbitPointerId = null;
      }
    };
    const onOrbitMove = (e: PointerEvent) => {
      if (e.pointerId !== orbitPointerId) return;
      orbitTheta += (e.clientX - orbitLastX) * 0.0055;
      orbitPhi = clamp(orbitPhi - (e.clientY - orbitLastY) * 0.004, 0.32, 1.38);
      orbitLastX = e.clientX;
      orbitLastY = e.clientY;
    };
    const onOrbitWheel = (e: WheelEvent) => {
      orbitRadius = clamp(orbitRadius + e.deltaY * 0.012, 8, 30);
    };
    renderer.domElement.addEventListener("pointerdown", onOrbitDown);
    window.addEventListener("pointerup", onOrbitUp);
    window.addEventListener("pointercancel", onOrbitUp);
    window.addEventListener("pointermove", onOrbitMove);
    window.addEventListener("wheel", onOrbitWheel, { passive: true });

    frameId = requestAnimationFrame(loop);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      broadcastComposer?.setSize(window.innerWidth, window.innerHeight, renderer.getPixelRatio());
      orbitRadius = window.innerWidth < window.innerHeight ? 17.5 : 13.5;
    };
    window.addEventListener("resize", onResize);
    const mountNode = mountRef.current;
    return () => {
      isUnmounted = true;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointerdown", onAutoTouchDetect);
      window.removeEventListener("touchstart", onFirstTouchStart);
      window.removeEventListener("keydown", onFirstKeyUnlock);
      document.removeEventListener("visibilitychange", onVisibilityAudioResume);
      renderer.domElement.removeEventListener("pointerdown", onOrbitDown);
      window.removeEventListener("pointerup", onOrbitUp);
      window.removeEventListener("pointercancel", onOrbitUp);
      window.removeEventListener("pointermove", onOrbitMove);
      window.removeEventListener("wheel", onOrbitWheel);
      if (softwareTimerId) clearTimeout(softwareTimerId);
      cancelAnimationFrame(frameId);
      audioMgr.dispose();
      if (audioManagerRef.current === audioMgr) {
        audioManagerRef.current = null;
      }
      broadcastComposer?.dispose();
      jerseyBumpTex.dispose();
      contactShadowTex.dispose();
      envRT.dispose();
      floorTex?.dispose();
      asphaltTex?.dispose();
      ballColorTex?.dispose();
      ballBumpTex?.dispose();
      ledBannerTex.dispose();
      jumboScreenTex.dispose();
      homeLogoTex.dispose();
      awayLogoTex.dispose();
      entities.forEach((p) => {
        p.frontPlateMat?.map?.dispose();
        p.backPlateMat?.map?.dispose();
      });
      renderer.dispose();
      if (mountNode) mountNode.removeChild(renderer.domElement);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const showTouchJoystick =
    inputPreference === "touch" ||
    showDesktopStick ||
    (inputPreference === "auto" && (isMobileUI || hasTouchInput || detectedDevice === "phone" || detectedDevice === "tablet"));

  const showTouchControls = showOnScreenPad && inputPreference !== "keyboard";
  const effectivePadSide = padSideOverride === "auto" ? (isUserOffenseUI ? "offense" : "defense") : padSideOverride;

  const mpPeerCount = mpRoom ? Object.keys(mpRoom.players).length : 0;

  return (
    <div className="w-full h-full relative touch-none select-none overflow-hidden">
      <div ref={mountRef} className="w-full h-full" />
      <video ref={mirrorVideoRef} muted playsInline className="sr-only pointer-events-none" />

      {/* Opening Tip-Off Ceremony Modal */}
      <TipOffModal
        isOpen={showTipOff}
        onTipOff={handleTipOffComplete}
        selectedCity={selectedCity}
      />

      {/* Minimal Distraction-Free Top Score & Clock Strip */}
      <Scoreboard
        scoreHome={scoreHome}
        scoreAway={scoreAway}
        quarter={quarter}
        gameClock={gameClock}
        shotClock={shotClock}
        selectedCity={selectedCity}
        isPracticeMode={gameMode === "freestyle" || gameMode === "training"}
      />

      {/* Non-intrusive Shot Clock component (no peripheral flashing banners) */}
      <ShotClockDisplay
        shotClock={shotClock}
        resetPulseKey={shotClockResetPulse}
        lastResetReason={lastShotResetReason}
        isPaused={showTimeout || showMainMenu || showTipOff || showCreateAthlete || showDraftModal || gameMode === "training" || gameMode === "freestyle"}
      />

      {/* Minimal Training Drill Counter (only shown during Training Drill) */}
      {gameMode === "training" && !showMainMenu && (
        <div className="fixed top-[calc(3.25rem+env(safe-area-inset-top))] sm:top-[max(0.75rem,env(safe-area-inset-top))] left-[max(0.65rem,env(safe-area-inset-left))] z-20 bg-neutral-950/85 backdrop-blur-md border border-white/15 rounded-xl px-3.5 py-2 text-white flex items-center gap-3">
          {activeAcademyDrill ? (
            <>
              <div className="text-[11px] font-black uppercase tracking-wider text-emerald-300 tabular-nums">
                {activeAcademyDrill.drill.title} · {activeAcademyDrill.repsMade}/{activeAcademyDrill.drill.targetReps}
              </div>
              <button
                type="button"
                onClick={handleCompleteAcademyDrill}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase cursor-pointer"
              >
                Finish Drill
              </button>
            </>
          ) : (
            <div className="text-[11px] font-black uppercase tracking-wider text-cyan-300 tabular-nums pointer-events-none">
              Drill {trainingDrill.made}/{trainingDrill.target} · Done {trainingDrill.completedCount}
            </div>
          )}
        </div>
      )}

      {/* Floating Active Player Name, Team Indicator & Live Stamina Bar */}
      {!showMainMenu && !showHighlights && (
        <div
          ref={activeTagRef}
          className="fixed top-0 left-0 pointer-events-none z-20 flex flex-col gap-0.5 px-2.5 py-1 rounded-lg bg-neutral-950/80 border border-amber-400/50 backdrop-blur-sm shadow-md transition-opacity duration-150"
          style={{ opacity: 0 }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="text-[10px] sm:text-xs font-black tracking-wide text-white whitespace-nowrap">
              {athleteProfile.firstName} {athleteProfile.lastName}
            </span>
          </div>
          <div className="w-full h-1 bg-white/15 rounded-full overflow-hidden">
            <div
              ref={staminaBarRef}
              className="h-full rounded-full transition-[background-color] duration-150"
              style={{ width: "100%", backgroundColor: "#22c55e" }}
            />
          </div>
        </div>
      )}

      {/* Shot Release Timing Feedback Pop-Up (1.5s immediately after jump shot completes) */}
      <AnimatePresence>
        {shotFeedback.visible && !showMainMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: shotFeedback.isGreen ? 1.08 : 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed z-30 pointer-events-none -translate-x-1/2 -translate-y-full px-3.5 py-2 rounded-xl bg-neutral-950/90 border border-white/20 backdrop-blur-md shadow-2xl min-w-[175px]"
            style={{ left: `${shotFeedback.x}%`, top: `${shotFeedback.y}%`, color: shotFeedback.color }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs sm:text-sm font-black italic uppercase tracking-wider whitespace-nowrap drop-shadow">
                {shotFeedback.text}
              </span>
              <span className="text-[11px] font-bold text-white/90 tabular-nums">
                {shotFeedback.accuracyPct}%
              </span>
            </div>
            <div className="mt-1.5 relative h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
              <div className="absolute inset-y-0 left-[40%] w-[20%] bg-emerald-500/45" />
              <div
                className="absolute top-0 bottom-0 w-1.5 -translate-x-1/2 rounded-full shadow"
                style={{
                  left: `${Math.round(shotFeedback.normalizedMeter * 100)}%`,
                  backgroundColor: shotFeedback.color,
                }}
              />
            </div>
            <div className="mt-1 text-[10px] font-medium text-neutral-300 text-right tabular-nums">
              {shotFeedback.deltaSec >= 0 ? "+" : ""}
              {shotFeedback.deltaSec.toFixed(2)}s vs ideal
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{message.visible && <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-[18%] left-0 right-0 text-center pointer-events-none z-30 font-black italic text-4xl sm:text-6xl uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)]" style={{ color: message.color }}>{message.text}</motion.div>}</AnimatePresence>
      <AnimatePresence>{label.visible && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-[30%] left-0 right-0 text-center pointer-events-none z-30 text-lg sm:text-2xl font-black tracking-widest text-amber-300 italic uppercase drop-shadow">{label.text}</motion.div>}</AnimatePresence>
      {showMeter && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 w-56 sm:w-80 h-5 bg-black/80 rounded-full border border-white/25 overflow-hidden pointer-events-none z-30 ${
            showTouchControls ? "bottom-[calc(15.5rem+env(safe-area-inset-bottom))] sm:bottom-48" : "bottom-36 sm:bottom-44"
          }`}
        >
          <div className="h-full bg-gradient-to-r from-red-600 via-green-400 to-red-600" style={{ width: `${meterFill}%` }} />
          <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white" />
        </div>
      )}

      {/* Interactive "TAKE / STEAL BALL" Button when loose or at hoop */}
      <AnimatePresence>
        {isBallLoose && !showHighlights && !showMainMenu && (
          <motion.button
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            onClick={handlePickUpBall}
            className={`fixed left-1/2 -translate-x-1/2 z-40 min-h-[44px] sm:min-h-[48px] px-4 sm:px-6 py-2 sm:py-3 bg-amber-400 hover:bg-amber-300 text-black font-black uppercase tracking-wider text-xs sm:text-sm rounded-xl border border-yellow-100 shadow-xl active:scale-95 flex items-center gap-2 pointer-events-auto cursor-pointer whitespace-nowrap ${
              showTouchControls
                ? "bottom-[calc(13.25rem+env(safe-area-inset-bottom))] sm:bottom-12"
                : "bottom-[max(2.5rem,env(safe-area-inset-bottom))]"
            }`}
          >
            <span className="sm:hidden">Take / Steal Ball</span>
            <span className="hidden sm:inline">Take / Steal Ball [Space / E / Tap]</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Universal Virtual Joystick & Expanded Offense/Defense Controller Pad */}
      {showTouchControls && !showHighlights && !showMainMenu && (
        <>
          {showTouchJoystick ? (
            <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[max(0.5rem,env(safe-area-inset-left))] z-40">
              <Joystick
                onChange={(x: number, y: number, active: boolean, autoSprint: boolean) => {
                  if (gameRef.current) {
                    gameRef.current.state.joystick = { x, y, active, autoSprint };
                  }
                }}
              />
            </div>
          ) : (
            <div className="fixed bottom-[max(0.85rem,env(safe-area-inset-bottom))] left-[max(0.85rem,env(safe-area-inset-left))] z-30">
              <button
                type="button"
                onClick={() => setShowDesktopStick(true)}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-neutral-950/85 hover:bg-neutral-900 border border-white/20 text-white/90 text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer whitespace-nowrap"
              >
                <Gamepad2 className="w-4 h-4 text-amber-400" />
                <span>Show Move Stick</span>
              </button>
            </div>
          )}

          <div className="fixed bottom-[max(0.65rem,env(safe-area-inset-bottom))] right-[max(0.55rem,env(safe-area-inset-right))] z-40 flex flex-col items-end gap-1.5 pointer-events-auto">
            {/* Compact Pad Bar: Offense / Defense Switcher + Expand/Collapse */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-950/88 backdrop-blur-md border border-white/15 shadow-lg">
              {showDesktopStick && !isMobileUI && !hasTouchInput && (
                <button
                  type="button"
                  onClick={() => setShowDesktopStick(false)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-white/70 hover:text-white hover:bg-white/10 cursor-pointer whitespace-nowrap"
                  title="Hide virtual move stick"
                >
                  Hide Stick
                </button>
              )}
              <button
                type="button"
                onClick={() => setPadSideOverride(effectivePadSide === "offense" ? "auto" : "offense")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                  effectivePadSide === "offense"
                    ? "bg-amber-500 text-black"
                    : "text-white/75 hover:text-white"
                }`}
              >
                <Target className="w-3 h-3" />
                <span>Offense</span>
              </button>
              <button
                type="button"
                onClick={() => setPadSideOverride(effectivePadSide === "defense" ? "auto" : "defense")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                  effectivePadSide === "defense"
                    ? "bg-cyan-400 text-black"
                    : "text-white/75 hover:text-white"
                }`}
              >
                <Shield className="w-3 h-3" />
                <span>Defense</span>
              </button>
              {padSideOverride !== "auto" && (
                <button
                  type="button"
                  onClick={() => setPadSideOverride("auto")}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-emerald-300 hover:bg-white/10 cursor-pointer whitespace-nowrap"
                  title="Auto-switch on possession"
                >
                  Auto
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowExpandedMoves((prev) => !prev)}
                aria-label={showExpandedMoves ? "Collapse extra buttons" : "Expand more buttons"}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
              >
                {showExpandedMoves ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                <span>{showExpandedMoves ? "6" : "+12"}</span>
              </button>
            </div>

            {/* Active Offense or Defense Button Grid */}
            {effectivePadSide === "offense" ? (
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {showExpandedMoves && (
                  <>
                    <ActionButton label="Fake" icon="JK" color="bg-indigo-600" onStateChange={(s) => { if (s) gameRef.current?.playerController?.onFakeJabButton(); }} />
                    <ActionButton label="Lob" icon="LB" color="bg-sky-600" onStateChange={(s) => { if (s) gameRef.current?.playerController?.onLobPassButton(); }} />
                    <ActionButton label="Shield" icon="SH" color="bg-teal-600" onStateChange={(s) => { if (s) gameRef.current?.playerController?.onProtectHookButton(); }} />
                    <ActionButton label="PnR" icon="PL" color="bg-emerald-600" onStateChange={(s) => { if (s) gameRef.current?.playerController?.onCallPlayButton(); }} />

                    <ActionButton label="Spin" icon="SP" color="bg-fuchsia-600" onStateChange={(s) => { if (s) gameRef.current?.playerController?.onSpinButton(); }} />
                    <ActionButton label="Behind" icon="BH" color="bg-violet-600" onStateChange={(s) => { if (s) gameRef.current?.playerController?.onBehindBackButton(); }} />
                    <ActionButton label="Stepback" icon="SB" color="bg-rose-600" onStateChange={(s) => { if (s) gameRef.current?.playerController?.onStepbackButton(); }} />
                    <ActionButton label="Cross" icon="X" color="bg-purple-600" onStateChange={(s) => handleTouchButtonState("X", s)} />
                  </>
                )}
                {!showExpandedMoves && (
                  <>
                    <ActionButton label="Cross" icon="X" color="bg-purple-600" onStateChange={(s) => handleTouchButtonState("X", s)} />
                    <ActionButton label="Spin" icon="SP" color="bg-fuchsia-600" onStateChange={(s) => { if (s) gameRef.current?.playerController?.onSpinButton(); }} />
                  </>
                )}
                <ActionButton label="Pass" icon="B" color="bg-blue-600" onStateChange={(s) => handleTouchButtonState("B", s)} />
                <ActionButton label="Dunk" icon="Y" color="bg-amber-600" onStateChange={(s) => handleTouchButtonState("Y", s)} />
                <ActionButton label="Shot" icon="A" color="bg-red-600" onStateChange={(s) => handleTouchButtonState("A", s)} />
                <ActionButton label="Sprint" icon="RT" color="bg-orange-600" onStateChange={(s) => handleTouchButtonState("RT", s)} />
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {showExpandedMoves && (
                  <>
                    <ActionButton label="Charge" icon="CH" color="bg-rose-700" onStateChange={(s) => { if (s) gameRef.current?.playerController?.onChargeButton(); }} />
                    <ActionButton label="Trap" icon="TR" color="bg-red-700" onStateChange={(s) => { if (s) gameRef.current?.playerController?.onTrapPressButton(); }} />
                    <ActionButton label="Hedge" icon="HG" color="bg-amber-700" onStateChange={(s) => { if (s) gameRef.current?.playerController?.onHedgeRideButton(); }} />
                    <ActionButton label="Zone" icon="ZN" color="bg-teal-700" onStateChange={(s) => { if (s) gameRef.current?.playerController?.onZoneHelpButton(); }} />

                    <ActionButton label="BoxOut" icon="BX" color="bg-indigo-700" onStateChange={(s) => { if (s) gameRef.current?.playerController?.onBoxOutButton(); }} />
                    <ActionButton label="Switch" icon="SW" color="bg-sky-700" onStateChange={(s) => { if (s) gameRef.current?.playerController?.onSwitchDefenseButton(); }} />
                    <ActionButton label="Shade" icon="X" color="bg-purple-700" onStateChange={(s) => { if (s) gameRef.current?.playerController?.onShadeButton(); }} />
                    <ActionButton label="Contest" icon="A" color="bg-emerald-600" onStateChange={(s) => { if (s) gameRef.current?.playerController?.onContestButton(); }} />
                  </>
                )}
                {!showExpandedMoves && (
                  <>
                    <ActionButton label="Shade" icon="X" color="bg-purple-700" onStateChange={(s) => { if (s) gameRef.current?.playerController?.onShadeButton(); }} />
                    <ActionButton label="Switch" icon="SW" color="bg-sky-700" onStateChange={(s) => { if (s) gameRef.current?.playerController?.onSwitchDefenseButton(); }} />
                  </>
                )}
                <ActionButton label="Steal" icon="RB" color="bg-blue-600" onStateChange={(s) => handleTouchButtonState("RB", s)} />
                <ActionButton label="Block" icon="Y" color="bg-amber-600" onStateChange={(s) => handleTouchButtonState("Y", s)} />
                <ActionButton
                  label={isUiDefending ? "Clamp On" : "Defend"}
                  icon="LT"
                  color={isUiDefending ? "bg-cyan-500 text-black" : "bg-neutral-700"}
                  active={isUiDefending}
                  onStateChange={(s) => { if (s) gameRef.current?.playerController?.onDefenseButtonToggle(); }}
                />
                <ActionButton label="Sprint" icon="RT" color="bg-orange-600" onStateChange={(s) => handleTouchButtonState("RT", s)} />
              </div>
            )}
          </div>
        </>
      )}

      {/* Top-Right Court Controls: Night Mode, Pad Toggle, Move Deck, Moves, Screen Mirror & Main Menu */}
      <div className="fixed top-[max(0.65rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-30 pointer-events-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const nextMode: NightGameMode =
              studioCustom.nightGameMode === "auto"
                ? "night"
                : studioCustom.nightGameMode === "night"
                ? "day"
                : "auto";
            handleChangeNightGameMode(nextMode);
          }}
          aria-label="Toggle Night Games Lighting"
          className={`min-h-[40px] sm:min-h-[44px] px-3 py-1.5 sm:py-2 backdrop-blur-md font-black uppercase text-xs tracking-wider rounded-xl border shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            studioCustom.nightGameMode === "night"
              ? "bg-indigo-500 text-white border-indigo-300 hover:bg-indigo-400"
              : studioCustom.nightGameMode === "day"
              ? "bg-amber-400 text-black border-amber-200 hover:bg-amber-300"
              : "bg-neutral-950/85 text-indigo-300 border-indigo-400/40 hover:bg-indigo-500 hover:text-white"
          }`}
        >
          {studioCustom.nightGameMode === "night" ? (
            <Moon className="w-4 h-4" />
          ) : studioCustom.nightGameMode === "day" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Clock className="w-4 h-4" />
          )}
          <span className="hidden md:inline">
            {studioCustom.nightGameMode === "night"
              ? "Night"
              : studioCustom.nightGameMode === "day"
              ? "Day"
              : "Auto Time"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (inputPreference === "keyboard") {
              handleChangeInputPreference("auto");
              setShowOnScreenPad(true);
            } else {
              setShowOnScreenPad((prev) => !prev);
            }
          }}
          aria-label="Toggle On-Screen Controller Pad"
          className={`min-h-[40px] sm:min-h-[44px] px-3 sm:px-3.5 py-1.5 sm:py-2 backdrop-blur-md font-black uppercase text-xs tracking-wider rounded-xl border shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400 whitespace-nowrap ${
            showTouchControls
              ? "bg-sky-500 text-black border-sky-200 hover:bg-sky-400"
              : "bg-neutral-950/85 hover:bg-sky-500 hover:text-black text-sky-300 border-sky-400/40 hover:border-sky-300"
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span className="hidden sm:inline">{showTouchControls ? "Pad On" : "Pad Off"}</span>
        </button>

        <button
          type="button"
          onClick={handleToggleQuickMovesSmart}
          aria-label="Toggle Move Deck"
          className={`min-h-[40px] sm:min-h-[44px] px-3 sm:px-3.5 py-1.5 sm:py-2 backdrop-blur-md font-black uppercase text-xs tracking-wider rounded-xl border shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 whitespace-nowrap ${
            showQuickMoves
              ? "bg-amber-500 text-black border-amber-200 hover:bg-amber-400"
              : "bg-neutral-950/85 hover:bg-amber-500 hover:text-black text-amber-300 border-amber-400/40 hover:border-amber-300"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="hidden sm:inline">Move Deck</span>
        </button>

        <button
          type="button"
          onClick={handleOpenMovebookSmart}
          aria-label="Open Movebook"
          className="min-h-[40px] sm:min-h-[44px] px-3 sm:px-3.5 py-1.5 sm:py-2 bg-neutral-950/85 hover:bg-emerald-500 hover:text-black backdrop-blur-md text-emerald-300 font-black uppercase text-xs tracking-wider rounded-xl border border-emerald-400/40 hover:border-emerald-300 shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 whitespace-nowrap"
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Moves</span>
        </button>

        <button
          type="button"
          onClick={() => setShowScreenMirror(true)}
          aria-label="Screen Mirror"
          className={`min-h-[40px] sm:min-h-[44px] px-3 sm:px-3.5 py-1.5 sm:py-2 backdrop-blur-md font-black uppercase text-xs tracking-wider rounded-xl border shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 whitespace-nowrap ${
            isMirroring
              ? "bg-cyan-500 text-black border-cyan-200 hover:bg-cyan-400"
              : "bg-neutral-950/85 hover:bg-cyan-500 hover:text-black text-cyan-300 border-cyan-400/40 hover:border-cyan-300"
          }`}
        >
          <Cast className="w-4 h-4" />
          <span className="hidden sm:inline">{isMirroring ? "Mirroring" : "Screen Mirror"}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowMainMenu(true)}
          aria-label="Open Main Menu"
          className="min-h-[40px] sm:min-h-[44px] px-3 sm:px-4 py-1.5 sm:py-2 bg-neutral-950/85 hover:bg-amber-500 hover:text-black backdrop-blur-md text-white font-black uppercase text-xs tracking-wider rounded-xl border border-white/20 hover:border-amber-300 shadow-lg transition-colors flex items-center gap-1.5 sm:gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 whitespace-nowrap"
        >
          <Menu className="w-4 h-4" />
          <span className="hidden xs:inline sm:inline">Menu</span>
        </button>
      </div>

      {/* Live On-Court Move Deck (All 93 Offense & 55 Defense Move Buttons) */}
      {!showHighlights && !showMainMenu && (
        <QuickMovesDock
          isOpen={showQuickMoves}
          onClose={() => setShowQuickMoves(false)}
          onExecuteMove={handleExecuteMove}
          activeOffensePlay={activeOffensePlay}
          activeDefenseScheme={activeDefenseScheme}
          defaultSide={movebookDefaultSide}
        />
      )}

      {/* End-of-Quarter Game Highlights Replay Bar */}
      <HighlightsOverlay
        isOpen={showHighlights}
        clips={highlightClips}
        activeClipIndex={activeHighlightIndex}
        quarterCompleted={highlightQuarterCompleted}
        isEndOfMatch={highlightIsEndOfMatch}
        onSelectClip={(idx) => {
          setActiveHighlightIndex(idx);
          if (gameRef.current?.setReplayClipIndex) {
            gameRef.current.setReplayClipIndex(idx);
          }
        }}
        onReplayCurrent={() => {
          if (gameRef.current?.replayCurrentClip) {
            gameRef.current.replayCurrentClip();
          }
        }}
        onContinue={handleContinueFromHighlights}
      />

      {/* Cross-Play Multiplayer Modal (Opened from Main Menu) */}
      <MultiplayerModal
        isOpen={showMultiplayer}
        onClose={() => setShowMultiplayer(false)}
        deviceType={detectedDevice}
        playerId={mpPlayerId}
        playerName={`${athleteProfile.firstName} ${athleteProfile.lastName}`}
        transport={mpTransport}
        currentRoom={mpRoom}
        onFetchRooms={handleFetchRooms}
        onJoinRoom={async (code, preferredTeam, format, leagueDivision, competitionType) => {
          if (!mpClientRef.current) return;
          await mpClientRef.current.joinRoom({
            roomCode: code,
            name: `${athleteProfile.firstName} ${athleteProfile.lastName}`,
            deviceType: detectedDevice,
            jerseyColor: athleteProfile.jerseyColorHex,
            shortsColor: athleteProfile.shortsColorHex,
            preferredTeam,
            cityId: selectedCity.id,
            mode: gameMode,
            format,
            leagueDivision,
            competitionType,
          });
        }}
        onCreateRoom={async (options) => {
          if (!mpClientRef.current) return;
          await mpClientRef.current.createAndJoinRoom({
            name: `${athleteProfile.firstName} ${athleteProfile.lastName}`,
            deviceType: detectedDevice,
            jerseyColor: athleteProfile.jerseyColorHex,
            shortsColor: athleteProfile.shortsColorHex,
            cityId: selectedCity.id,
            mode: gameMode,
            format: options?.format || "5v5",
            isPrivate: options?.isPrivate ?? true,
            leagueDivision: options?.leagueDivision,
            competitionType: options?.competitionType,
          });
        }}
        onLeaveRoom={async () => {
          if (!mpClientRef.current) return;
          await mpClientRef.current.leaveRoom();
          mpRoomRef.current = null;
          setMpRoom(null);
        }}
        onReconnectRoom={async () => {
          if (!mpClientRef.current) return;
          await mpClientRef.current.reconnect();
        }}
        onStartCourtMatch={() => {
          handleSelectGameMode("match", true);
        }}
      />

      {/* Main Menu Hub Modal (All Features & Match Controls Live Here) */}
      <MainMenuModal
        isOpen={showMainMenu}
        onClose={() => setShowMainMenu(false)}
        activeMode={gameMode}
        selectedCity={selectedCity}
        athleteProfile={athleteProfile}
        careerStats={careerStats}
        quarterLengthSec={quarterLengthSec}
        onChangeQuarterLength={handleChangeQuarterLength}
        inputPreference={inputPreference}
        detectedDevice={detectedDevice}
        onChangeInputPreference={handleChangeInputPreference}
        multiplayerRoomCode={mpRoom?.roomCode || null}
        multiplayerTransport={mpTransport}
        multiplayerPeerCount={mpPeerCount}
        highlightsCount={highlightsCount}
        timeoutsLeft={timeoutsLeft}
        onSelectGameMode={(mode) => {
          activeMatchContextRef.current = { kind: "exhibition" };
          handleSelectGameMode(mode, true);
        }}
        onOpenWorldTour={() => setShowWorldTour(true)}
        onOpenCreateAthlete={() => setShowCreateAthlete(true)}
        onOpenDraft={() => setShowDraftModal(true)}
        onOpenLockerRoom={() => setShowLockerRoom(true)}
        onOpenMovebook={handleOpenMovebookSmart}
        onOpenControls={() => setShowHelp(true)}
        onOpenFeatures={() => setShowFeaturesModal(true)}
        onOpenMultiplayer={() => setShowMultiplayer(true)}
        onOpenScreenMirroring={() => setShowScreenMirror(true)}
        isMirroring={isMirroring}
        onOpenHighlights={handleOpenHighlightsFromMenu}
        onCallTimeout={callTimeout}
        onEndQuarterNow={handleEndQuarterNow}
        onEndGame={() => {
          if (gameRef.current?.endMatch) gameRef.current.endMatch();
        }}
        audioSettings={audioSettings}
        onChangeAudioSettings={handleChangeAudioSettings}
        onOpenLeagueCentral={() => setShowLeagueCentral(true)}
        onOpenCareerHub={() => setShowCareerHub(true)}
        onOpenFranchise={() => setShowFranchise(true)}
        onOpenCustomization={() => setShowCustomization(true)}
        onOpenTrainingAcademy={() => setShowTrainingAcademy(true)}
        leagueSummaryLabel={`Season ${leagueState.seasonYear} · Round ${Math.min(82, leagueState.currentRound)}/82 (${leagueState.phase.replace("_", " ")})`}
        careerSummaryLabel={`${athleteProfile.firstName} ${athleteProfile.lastName} · ${myCareer.reputation} Rep · ${myCareer.championshipRings} Rings`}
        franchiseSummaryLabel={`${APBA_TEAMS.find((t) => t.id === franchiseState.teamId)?.abbr || "NYM"} Front Office · Cap & Draft`}
        onOpenUniverse={() => setShowUniverseHub(true)}
        universeSummaryLabel={`Day ${universeState.currentDay} · ${universeState.properties.filter((p) => p.owned).length} Properties · ${universeState.vehicles.filter((v) => v.owned).length} Cars`}
        activeDivision={activeDivision}
        onChangeDivision={handleChangeDivision}
        onOpenNationalTour={() => setShowNationalTour(true)}
        nationalTourSummaryLabel={`${Object.values(nationalTour.stopsCompleted).filter((s) => s.completed).length}/${NATIONAL_TOUR_STOPS.length} US Stops · ${nationalTour.totalTourWins}W · ${nationalTour.championshipsWon} Titles`}
        nightGameMode={studioCustom.nightGameMode}
        onChangeNightGameMode={handleChangeNightGameMode}
        onSavesImported={reloadAllSavedStates}
      />

      {/* AdventureForge Basketball Universe Hub (Properties, Vehicles & Businesses) */}
      <AdventureForgeUniverseModal
        isOpen={showUniverseHub}
        onClose={() => setShowUniverseHub(false)}
        universe={universeState}
        onUpdateUniverse={setUniverseState}
      />

      {/* Screen Mirroring & TV Cast Modal */}
      <ScreenMirrorModal
        isOpen={showScreenMirror}
        onClose={() => setShowScreenMirror(false)}
        isMirroring={isMirroring}
        mirrorCode={mirrorCode}
        viewerCount={mirrorViewerCount}
        capabilities={mirrorCaps}
        isFullscreen={isFullscreen}
        onStartMirroring={handleStartMirroring}
        onStopMirroring={handleStopMirroring}
        onTriggerAirPlayOrCast={handleTriggerAirPlayOrCast}
        onTogglePiP={handleTogglePiP}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Offense & Defense Movebook Modal */}
      <MovebookModal
        isOpen={showMovebook}
        onClose={() => setShowMovebook(false)}
        onExecuteMove={handleExecuteMove}
        activeOffensePlay={activeOffensePlay}
        activeDefenseScheme={activeDefenseScheme}
        defaultSide={movebookDefaultSide}
      />

      {/* Create Athlete Studio Modal */}
      {showCreateAthlete && (
        <CreateAthleteModal
          isOpen={showCreateAthlete}
          onClose={() => setShowCreateAthlete(false)}
          profile={athleteProfile}
          onSaveProfile={(updated) => {
            setAthleteProfile(updated);
            athleteProfileRef.current = updated;
            if (gameRef.current?.applyAthleteProfile) {
              gameRef.current.applyAthleteProfile(updated);
            }
          }}
          onEnterDraft={() => setShowDraftModal(true)}
        />
      )}

      {/* Draft Night & Cutscene Modal */}
      {showDraftModal && (
        <DraftCutsceneModal
          isOpen={showDraftModal}
          onClose={() => setShowDraftModal(false)}
          profile={athleteProfile}
          careerLevel={calculateLevel(careerStats.xp).level}
          onDraftComplete={(updatedProfile, draftedCityId) => {
            setAthleteProfile(updatedProfile);
            athleteProfileRef.current = updatedProfile;
            if (gameRef.current?.applyAthleteProfile) {
              gameRef.current.applyAthleteProfile(updatedProfile);
            }
            const draftedCity = getCityById(draftedCityId);
            setSelectedCity(draftedCity);
            if (gameRef.current?.applyCity) {
              gameRef.current.applyCity(draftedCity);
            }
          }}
          onStartRookieDebut={(draftedCityId) => {
            const draftedCity = getCityById(draftedCityId);
            setSelectedCity(draftedCity);
            if (gameRef.current?.applyCity) {
              gameRef.current.applyCity(draftedCity);
            }
            handleSelectGameMode("match", true);
          }}
        />
      )}

      {/* Controls Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-start sm:items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-8 z-[195] overflow-y-auto"
            onClick={() => setShowHelp(false)}
          >
            <div
              className="relative max-w-5xl w-full bg-neutral-950/95 border border-white/15 rounded-2xl p-5 sm:p-8 grid md:grid-cols-2 gap-8 max-h-[92dvh] my-auto overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                aria-label="Close Controls"
                className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="space-y-4">
                <h3 className="text-2xl sm:text-3xl font-black italic uppercase text-red-500 border-b border-white/10 pb-2 pr-10">
                  Gamepad, Touch &amp; Keyboard Controls
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm font-bold">
                  <div>Move / Slide</div><div>WASD / Arrows / Touch Stick / L-Stick</div>
                  <div>Sprint (Stamina)</div><div>Shift / RT Button / R2</div>
                  <div>Offense &amp; Defense Pad</div><div>On-Screen Bottom Right (Toggle: Pad On)</div>
                  <div>Live Move Deck (148 Moves)</div><div>N / Select Button / Move Deck</div>
                  <div>Movebook (93 Off &amp; 55 Def)</div><div>B / Top-Right Moves</div>
                  <div>Shot / Contest / Rebound</div><div>Space / A (Cross) Button</div>
                  <div>Dunk / Block / Wall Up</div><div>F / I / Y (Triangle) Button</div>
                  <div>Tiki Tiki Signature Dunk</div><div>F / I / Shift+I / Y (Unlocked &amp; Equipped)</div>
                  <div>Glove Rip / Volley Swat / Cutoff</div><div>F / O / U (On Defense)</div>
                  <div>Cross / Shade / Pro-Stick</div><div>X (Square) / Right Stick</div>
                  <div>Pass / Call Pass / Switch Def</div><div>P / K / B (Circle) · 1 - 6 · D-Pad</div>
                  <div>Steal / Poke / Pass Lane</div><div>E / RB (R1) Button</div>
                  <div>Defense Clamp Stance</div><div>Left Ctrl / Q / Z / LT (L2)</div>
                  <div>Spin / Shamgod / Drop Step</div><div>V / Shift+V / Spin Pad</div>
                  <div>Behind-Back / Between-Legs</div><div>C / Shift+C / Behind Pad</div>
                  <div>Hesi / Hook / Hedge</div><div>H / Shift+H / Hedge Pad</div>
                  <div>Pump Fake / Jab / Denial</div><div>J / Shift+J / Fake Pad</div>
                  <div>Lob Pass / Help-Recover</div><div>L / Shift+L / Lob &amp; Zone Pads</div>
                  <div>Protect Dribble / Box-Out</div><div>G / Shift+G / Shield &amp; BoxOut Pads</div>
                  <div>Hip-Ride / Hand-Check</div><div>R / Shift+R / Hedge Pad</div>
                  <div>Take Charge / Pull Chair</div><div>T / Shift+T / R3 / Charge Pad</div>
                  <div>Sub Bench</div><div>Tab / LB (L1) / L3 / Timeout</div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl sm:text-3xl font-black italic uppercase text-blue-500 border-b border-white/10 pb-2">
                  World Tour &amp; Tactics
                </h3>
                <p className="text-sm opacity-80 leading-relaxed">
                  Travel to global courts in North America, Argentina, Central America, Africa, Asia, Australia, and Europe. Adjust defensive intensity (Press, Lockdown, 2-3 Zone, Conservative Wall) or offensive sets (Pace &amp; Space, Pick &amp; Roll, Inside Paint Power, Fast Break) anytime during tactical timeouts!
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setShowHelp(false);
                      setShowWorldTour(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Open World Tour</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowHelp(false);
                      setShowLockerRoom(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Locker Room</span>
                  </button>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    <span>Back</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Locker Room Modal */}
      <LockerRoomModal
        isOpen={showLockerRoom}
        onClose={() => setShowLockerRoom(false)}
        careerStats={careerStats}
        onStatsChange={(newStats) => {
          setCareerStats(newStats);
          if (gameRef.current?.applyCustomization) {
            gameRef.current.applyCustomization(newStats);
          }
          if (gameRef.current?.applyAthleteProfile) {
            gameRef.current.applyAthleteProfile(athleteProfileRef.current);
          }
        }}
        onEquipItem={(type, id) => {
          if (type === "dunk") {
            const currentCareer = loadCareerStats();
            currentCareer.equippedSignatureDunk = id;
            saveCareerStats(currentCareer);
            careerStatsRef.current = currentCareer;
            setCareerStats(currentCareer);
            if (gameRef.current?.triggerLabel) {
              gameRef.current.triggerLabel(
                id === "dunk_tiki_tiki" ? "EQUIPPED: TIKI TIKI SLAM!" : "EQUIPPED: CLASSIC DUNK"
              );
            }
            return;
          }
          const nextProfile = { ...athleteProfileRef.current };
          if (type === "jersey") {
            const jItem = JERSEY_ITEMS.find((j) => j.id === id);
            if (jItem) {
              nextProfile.jerseyColorHex = jItem.colorHex;
              if (jItem.secondaryHex) nextProfile.shortsColorHex = jItem.secondaryHex;
            }
          } else if (type === "sneakers") {
            const sItem = SNEAKER_ITEMS.find((s) => s.id === id);
            if (sItem) nextProfile.shoeColorHex = sItem.colorHex;
          } else if (type === "headband") {
            const hItem = HEADBAND_ITEMS.find((h) => h.id === id);
            if (hItem) {
              nextProfile.headbandEnabled = hItem.id !== "acc_none";
              if (hItem.id !== "acc_none") nextProfile.headbandColorHex = hItem.colorHex;
            }
          }
          saveAthleteProfile(nextProfile);
          athleteProfileRef.current = nextProfile;
          setAthleteProfile(nextProfile);
          if (gameRef.current?.applyCustomization) {
            const current = loadCareerStats();
            gameRef.current.applyCustomization(current);
          }
          if (gameRef.current?.applyAthleteProfile) {
            gameRef.current.applyAthleteProfile(nextProfile);
          }
        }}
      />

      {/* Tactical Timeout Modal */}
      <TimeoutModal
        isOpen={showTimeout}
        onResume={resumeFromTimeout}
        tactics={tactics}
        onTacticsChange={handleTacticsChange}
        teamA={teamARoster}
        onSubstitute={(inIdx, outIdx) => {
          if (gameRef.current?.substitute && gameRef.current?.teamA) {
            gameRef.current.substitute(gameRef.current.teamA, inIdx, outIdx);
            setSubVersion((v) => v + 1);
          }
        }}
        timeoutsLeft={timeoutsLeft}
      />

      {/* World Tour Navigation Hub Modal */}
      <WorldTourMenu
        isOpen={showWorldTour}
        onClose={() => setShowWorldTour(false)}
        selectedCity={selectedCity}
        onSelectCity={handleSelectCity}
        onStartMatch={handleStartMatchCity}
        tournamentState={worldTournament}
        onUpdateTournament={(next) => {
          worldTournamentRef.current = next;
          setWorldTournament(next);
          saveWorldTourTournamentState(next);
        }}
        onStartCupMatch={handleStartCupMatch}
        activeDivision={activeDivision}
        onChangeDivision={handleChangeDivision}
        nightGameMode={studioCustom.nightGameMode}
        onChangeNightGameMode={handleChangeNightGameMode}
      />

      {/* National Tour USA Progression Modal */}
      <NationalTourModal
        isOpen={showNationalTour}
        onClose={() => setShowNationalTour(false)}
        tourState={nationalTour}
        activeDivision={activeDivision}
        onChangeDivision={handleChangeDivision}
        nightGameMode={studioCustom.nightGameMode}
        onChangeNightGameMode={handleChangeNightGameMode}
        tikiTikiUnlocked={careerStats.unlockedIds.includes("dunk_tiki_tiki")}
        onStartStopMatch={handleStartNationalTourStop}
      />

      {/* APBA Pro League Central Modal (Phases 1-3) */}
      <LeagueCentralModal
        isOpen={showLeagueCentral}
        onClose={() => setShowLeagueCentral(false)}
        league={leagueState}
        onUpdateLeague={(next) => {
          leagueStateRef.current = next;
          setLeagueState(next);
          saveLeagueState(next);
        }}
        onPlayMatchup={handleStartLeagueMatchup}
      />

      {/* My Career Hub Modal (Phase 4) */}
      <CareerHubModal
        isOpen={showCareerHub}
        onClose={() => setShowCareerHub(false)}
        profile={athleteProfile}
        onUpdateProfile={(updated) => {
          setAthleteProfile(updated);
          athleteProfileRef.current = updated;
          if (gameRef.current?.applyAthleteProfile) gameRef.current.applyAthleteProfile(updated);
        }}
        career={myCareer}
        onUpdateCareer={(next) => {
          myCareerRef.current = next;
          setMyCareer(next);
          saveCareerState(next);
        }}
        onOpenCreateAthlete={() => {
          setShowCareerHub(false);
          setShowCreateAthlete(true);
        }}
        onLaunchCareerGame={() => {
          activeMatchContextRef.current = { kind: "career", teamId: myCareer.teamId };
          setShowCareerHub(false);
          handleSelectGameMode("match", true);
        }}
      />

      {/* Franchise Mode GM Modal (Phase 5) */}
      <FranchiseModal
        isOpen={showFranchise}
        onClose={() => setShowFranchise(false)}
        league={leagueState}
        onUpdateLeague={(next) => {
          leagueStateRef.current = next;
          setLeagueState(next);
          saveLeagueState(next);
        }}
        franchise={franchiseState}
        onUpdateFranchise={(next) => {
          franchiseStateRef.current = next;
          setFranchiseState(next);
          saveFranchiseState(next);
        }}
        onPlayFranchiseGame={(teamId) => {
          const nextUserGame = leagueStateRef.current.schedule.find(
            (g) => !g.played && (g.homeTeamId === teamId || g.awayTeamId === teamId)
          );
          if (nextUserGame) {
            handleStartLeagueMatchup(nextUserGame.homeTeamId, nextUserGame.awayTeamId, false);
          } else {
            activeMatchContextRef.current = { kind: "franchise", teamId };
            setShowFranchise(false);
            handleSelectGameMode("match", true);
          }
        }}
      />

      {/* Customization Studio Modal (Phase 9) */}
      <CustomizationStudioModal
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
        customization={studioCustom}
        onApplyCustomization={(next) => {
          studioCustomRef.current = next;
          setStudioCustom(next);
          saveStudioCustomization(next);
          if (gameRef.current?.applyStudioCustomToScene) {
            gameRef.current.applyStudioCustomToScene(next);
          }
        }}
        careerStats={careerStats}
        onEquipSignatureDunk={(dunkId) => {
          const currentCareer = loadCareerStats();
          currentCareer.equippedSignatureDunk = dunkId;
          saveCareerStats(currentCareer);
          careerStatsRef.current = currentCareer;
          setCareerStats(currentCareer);
          if (gameRef.current?.triggerLabel) {
            gameRef.current.triggerLabel(
              dunkId === "dunk_tiki_tiki" ? "EQUIPPED: TIKI TIKI SLAM!" : "EQUIPPED: CLASSIC DUNK"
            );
          }
        }}
      />

      {/* Training Academy Modal (Phase 10) */}
      <TrainingAcademyModal
        isOpen={showTrainingAcademy}
        onClose={() => setShowTrainingAcademy(false)}
        trainingState={trainingAcademy}
        onStartDrill={handleStartAcademyDrill}
      />

      {/* Broadcast Presentation & Ceremony Overlays (Phase 8) */}
      <BroadcastOverlays
        scene={broadcastScene}
        onDismiss={handleDismissBroadcast}
        onChooseInterview={handleChooseInterview}
      />

      {/* Championship Edition Features & Modes Modal Directory */}
      <NBAFeaturesModal
        isOpen={showFeaturesModal}
        onClose={() => setShowFeaturesModal(false)}
        onSelectFeatureMode={(featId) => {
          if (featId === "mycareer") {
            setShowCareerHub(true);
          } else if (featId === "myteam" || featId === "seasons") {
            setShowLeagueCentral(true);
          } else if (featId === "play_now" || featId === "the_city" || featId === "the_w") {
            setShowWorldTour(true);
          } else if (featId === "learn_2k") {
            setShowTrainingAcademy(true);
          } else if (featId === "gameplay_engine") {
            setShowMovebook(true);
          } else if (featId === "mynba") {
            setShowFranchise(true);
          } else if (featId === "presentation") {
            if (allHighlightsRef.current.length > 0) {
              handleOpenHighlightsFromMenu();
            } else {
              setShowMainMenu(true);
            }
          } else if (featId === "account_link") {
            setShowMultiplayer(true);
          } else {
            setShowWorldTour(true);
          }
        }}
      />

      {/* End of Game Leaderboard & Summary Modal */}
      <EndGameLeaderboardModal
        isOpen={showSummary}
        scoreHome={scoreHome}
        scoreAway={scoreAway}
        selectedCity={selectedCity}
        finalStats={finalStats}
        lastMatchEarnings={lastMatchEarnings}
        careerStats={careerStats}
        onRematch={() => {
          setShowSummary(false);
          handleSelectGameMode(gameMode === "streetball" ? "streetball" : "match", true);
        }}
        onOpenWorldTour={() => {
          setShowSummary(false);
          setShowWorldTour(true);
        }}
        onOpenLockerRoom={() => {
          setShowSummary(false);
          setShowLockerRoom(true);
        }}
        onMainMenu={() => {
          setShowSummary(false);
          setShowMainMenu(true);
        }}
      />
    </div>
  );
}

function ActionButton({
  label,
  icon,
  color,
  active = false,
  onStateChange,
}: {
  label: string;
  icon: string;
  color: string;
  active?: boolean;
  onStateChange: (s: boolean) => void;
}) {
  const activePointerId = useRef<number | null>(null);
  const handleDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    activePointerId.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    onStateChange(true);
  };
  const handleUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (activePointerId.current === null || e.pointerId === activePointerId.current) {
      activePointerId.current = null;
      onStateChange(false);
    }
  };
  const resetButton = () => {
    if (activePointerId.current !== null) {
      activePointerId.current = null;
      onStateChange(false);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.code === "Enter" || e.code === "Space") {
      e.preventDefault();
      if (!e.repeat) onStateChange(true);
    }
  };
  const handleKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.code === "Enter" || e.code === "Space") {
      e.preventDefault();
      onStateChange(false);
    }
  };
  return (
    <div className="flex flex-col items-center gap-0.5 select-none touch-none">
      <button
        type="button"
        aria-label={label}
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={handleDown}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        onLostPointerCapture={resetButton}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        className={`min-w-[44px] min-h-[44px] w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-black text-xs sm:text-sm shadow-xl active:scale-90 transition-transform ${color} ${
          active ? "ring-2 ring-white border-2 border-white scale-105" : "border-2 border-white/25 text-white"
        } touch-none select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300`}
      >
        {icon}
      </button>
      <span className="text-[9px] font-bold uppercase text-white/85 drop-shadow whitespace-nowrap">{label}</span>
    </div>
  );
}

function Joystick({ onChange }: { onChange: (x: number, y: number, active: boolean, autoSprint: boolean) => void }) {
  const padRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const stick = useRef<{
    pointerId: number | null;
    originX: number;
    originY: number;
    maxR: number;
  }>({ pointerId: null, originX: 0, originY: 0, maxR: 44 });

  const updateStick = (clientX: number, clientY: number) => {
    const s = stick.current;
    const dx = clientX - s.originX;
    const dy = clientY - s.originY;
    const rawDist = Math.hypot(dx, dy);
    const maxR = s.maxR;
    const clampedDist = Math.min(rawDist, maxR);
    const angle = Math.atan2(dy, dx);
    const kx = rawDist > 0.001 ? Math.cos(angle) * clampedDist : 0;
    const ky = rawDist > 0.001 ? Math.sin(angle) * clampedDist : 0;

    if (handleRef.current) {
      handleRef.current.style.transition = "none";
      handleRef.current.style.transform = `translate3d(${kx}px, ${ky}px, 0)`;
    }

    const norm = clampedDist / maxR;
    const deadzone = 0.04;
    if (norm < deadzone) {
      if (handleRef.current) {
        handleRef.current.style.boxShadow = "0 6px 20px rgba(0,0,0,0.45)";
        handleRef.current.style.borderColor = "rgba(255,255,255,0.65)";
      }
      onChangeRef.current(0, 0, true, false);
      return;
    }

    const curved = Math.pow((norm - deadzone) / (1 - deadzone), 0.78);
    const autoSprint = norm >= 0.78;
    const nx = Math.cos(angle) * curved;
    const ny = Math.sin(angle) * curved;

    if (handleRef.current) {
      handleRef.current.style.boxShadow = autoSprint
        ? "0 0 22px rgba(245, 158, 11, 0.85)"
        : "0 0 14px rgba(56, 189, 248, 0.55)";
      handleRef.current.style.borderColor = autoSprint
        ? "rgba(251, 191, 36, 0.95)"
        : "rgba(255, 255, 255, 0.85)";
    }
    onChangeRef.current(nx, ny, true, autoSprint);
  };

  const resetStick = () => {
    stick.current.pointerId = null;
    if (handleRef.current) {
      handleRef.current.style.transition = "transform 110ms cubic-bezier(0.22, 1, 0.36, 1)";
      handleRef.current.style.transform = "translate3d(0px, 0px, 0)";
      handleRef.current.style.boxShadow = "0 6px 20px rgba(0,0,0,0.45)";
      handleRef.current.style.borderColor = "rgba(255,255,255,0.6)";
    }
    if (ringRef.current) {
      ringRef.current.style.borderColor = "rgba(255,255,255,0.22)";
    }
    onChangeRef.current(0, 0, false, false);
  };

  useEffect(() => {
    const handleBlur = () => {
      if (stick.current.pointerId !== null) {
        resetStick();
      }
    };
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, []);

  const onStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (stick.current.pointerId !== null) return;
    stick.current.pointerId = e.pointerId;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    if (ringRef.current) {
      const rect = ringRef.current.getBoundingClientRect();
      stick.current.originX = rect.left + rect.width / 2;
      stick.current.originY = rect.top + rect.height / 2;
      stick.current.maxR = Math.max(38, rect.width * 0.42);
      ringRef.current.style.borderColor = "rgba(251, 191, 36, 0.7)";
    } else {
      stick.current.originX = e.clientX;
      stick.current.originY = e.clientY;
    }
    updateStick(e.clientX, e.clientY);
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== stick.current.pointerId) return;
    e.stopPropagation();
    updateStick(e.clientX, e.clientY);
  };

  const onEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== stick.current.pointerId) return;
    e.stopPropagation();
    resetStick();
  };

  return (
    <div
      ref={padRef}
      onPointerDown={onStart}
      onPointerMove={onMove}
      onPointerUp={onEnd}
      onPointerCancel={onEnd}
      onLostPointerCapture={resetStick}
      className="w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center touch-none select-none cursor-pointer"
    >
      <div
        ref={ringRef}
        className="w-24 h-24 sm:w-32 sm:h-32 bg-white/10 backdrop-blur-xl rounded-full border-2 border-white/25 flex items-center justify-center relative pointer-events-none transition-colors"
      >
        <div
          ref={handleRef}
          className="w-10 h-10 sm:w-14 sm:h-14 bg-white/45 rounded-full border-2 border-white/60 shadow-2xl pointer-events-none will-change-transform"
        />
      </div>
    </div>
  );
}
