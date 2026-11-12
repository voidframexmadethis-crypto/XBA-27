"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Keyboard, Gamepad2, Info, Trophy, Sparkles, Shirt, Flag, Globe, Timer, MapPin, Menu, Tv, Play, Flame, Shield, X, ChevronRight, BookOpen } from "lucide-react";
import LockerRoomModal from "./LockerRoomModal";
import TimeoutModal, { TacticalSettings } from "./TimeoutModal";
import WorldTourMenu from "./WorldTourMenu";
import NBAFeaturesModal from "./NBAFeaturesModal";
import Scoreboard from "./Scoreboard";
import ShotClockDisplay from "./ShotClockDisplay";
import TipOffModal from "./TipOffModal";
import EndGameLeaderboardModal from "./EndGameLeaderboardModal";
import MainMenuModal, { GameMode } from "./MainMenuModal";
import CreateAthleteModal from "./CreateAthleteModal";
import DraftCutsceneModal from "./DraftCutsceneModal";
import MovebookModal from "./MovebookModal";
import MultiplayerModal from "./MultiplayerModal";
import HighlightsOverlay from "./HighlightsOverlay";
import {
  SHOT_CLOCK_FULL,
  resetShotClock,
  tickShotClock,
  formatShotClock,
} from "@/lib/shotClock";
import { WORLD_CITIES, WorldCity, getCityById } from "@/lib/worldTour";
import {
  loadCareerStats,
  getDefaultCareerStats,
  recordMatchToCareer,
  addDebugCareerStats,
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
import type {
  DeviceType,
  InputPreference,
  MultiplayerRoomState,
  TeamSide,
} from "@/lib/multiplayerTypes";
import {
  BasketballAudioManager,
  AudioVolumeSettings,
  DEFAULT_AUDIO_SETTINGS,
  loadAudioSettings,
} from "@/lib/audioManager";

// Game Constants
const COURT_W = 28, COURT_H = 15;
const HOOP_X = 13.6, RIM_Y = 3.05, RIM_R = 0.23, BOARD_X = 14.1;
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
  const [showMeter, setShowMeter] = useState(false);
  const [meterFill, setMeterFill] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(true);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [showCreateAthlete, setShowCreateAthlete] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showMovebook, setShowMovebook] = useState(false);
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
  const [showTipOff, setShowTipOff] = useState(false);
  const isOverlayOpenRef = useRef(true);
  const audioManagerRef = useRef<BasketballAudioManager | null>(null);
  const [audioSettings, setAudioSettings] = useState<AudioVolumeSettings>(() => ({
    ...DEFAULT_AUDIO_SETTINGS,
  }));

  const handleExecuteMove = useCallback((move: OffenseMove | DefenseMove) => {
    if (gameRef.current?.executeMove) {
      gameRef.current.executeMove(move);
    }
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
    audioManagerRef.current.unlock();
    const updated = audioManagerRef.current.updateSettings(patch);
    setAudioSettings(updated);
  }, []);

  // Player Career Progression & Customization States
  const [careerStats, setCareerStats] = useState<CareerStats>(getDefaultCareerStats);
  const [showLockerRoom, setShowLockerRoom] = useState(false);
  const [lastMatchEarnings, setLastMatchEarnings] = useState<{
    pts: number;
    reb: number;
    ast: number;
    xpGained: number;
    leveledUp: boolean;
    unlocked: ProgressionItem[];
  } | null>(null);

  // World Tour & Tactical Timeout States
  const [selectedCity, setSelectedCity] = useState<WorldCity>(WORLD_CITIES[0]);
  const [showWorldTour, setShowWorldTour] = useState(false);
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

  const handleTacticsChange = useCallback((newTactics: TacticalSettings) => {
    setTactics(newTactics);
    tacticsRef.current = newTactics;
    if (gameRef.current?.triggerMsg) {
      gameRef.current.triggerMsg(`TACTIC: ${newTactics.defense.toUpperCase()}`, "#38bdf8");
    }
  }, []);

  const callTimeout = useCallback(() => {
    if (timeoutsLeft <= 0) {
      if (gameRef.current?.triggerMsg) {
        gameRef.current.triggerMsg("NO TIMEOUTS REMAINING", "#ef4444");
      }
      return;
    }
    setTimeoutsLeft((prev) => prev - 1);
    if (gameRef.current?.state) {
      gameRef.current.state.isPaused = true;
      gameRef.current.state.pauseT = 0;
    }
    if (gameRef.current?.Audio) {
      gameRef.current.Audio.whistle();
      gameRef.current.Audio.speak("Timeout! Tactical huddle!");
    }
    setShowTimeout(true);
  }, [timeoutsLeft]);

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
  }, []);

  const handleStartMatchCity = useCallback((city: WorldCity) => {
    setSelectedCity(city);
    setShowWorldTour(false);
    setGameMode("match");
    gameModeRef.current = "match";
    if (gameRef.current?.applyGameMode) {
      gameRef.current.applyGameMode("match");
    }
    if (gameRef.current?.applyCity) {
      gameRef.current.applyCity(city);
    }
    setShowTipOff(true);
  }, []);

  const isMenuNavigationOpen =
    showMainMenu ||
    showWorldTour ||
    showCreateAthlete ||
    showDraftModal ||
    showMovebook ||
    showLockerRoom ||
    showFeaturesModal ||
    showMultiplayer ||
    showHelp;

  useEffect(() => {
    isOverlayOpenRef.current =
      showMainMenu ||
      showTipOff ||
      showCreateAthlete ||
      showDraftModal ||
      showMovebook ||
      showWorldTour ||
      showLockerRoom ||
      showTimeout ||
      showHelp ||
      showFeaturesModal ||
      showMultiplayer ||
      showSummary;
  }, [
    showMainMenu,
    showTipOff,
    showCreateAthlete,
    showDraftModal,
    showMovebook,
    showWorldTour,
    showLockerRoom,
    showTimeout,
    showHelp,
    showFeaturesModal,
    showMultiplayer,
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
      athleteProfileRef.current = savedProfile;
      setAthleteProfile(savedProfile);
      setCareerStats(savedCareer);
      setAudioSettings(savedAudio);
      if (gameRef.current?.applyCustomization) {
        gameRef.current.applyCustomization(savedCareer);
      }
      if (gameRef.current?.applyAthleteProfile) {
        gameRef.current.applyAthleteProfile(savedProfile);
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
      void audioMgr.unlock();
      if (e.pointerType === "touch" || e.pointerType === "pen") {
        setHasTouchInput(true);
      }
    };
    const onFirstTouchStart = () => {
      void audioMgr.unlock();
      setHasTouchInput(true);
    };
    const onFirstKeyUnlock = () => {
      void audioMgr.unlock();
    };
    const onVisibilityAudioResume = () => {
      if (document.visibilityState === "visible") {
        void audioMgr.unlock();
      }
    };
    window.addEventListener("pointerdown", onAutoTouchDetect, { passive: true });
    window.addEventListener("touchstart", onFirstTouchStart, { passive: true });
    window.addEventListener("keydown", onFirstKeyUnlock, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityAudioResume);
    // Attempt auto-start on mount (starts immediately if permitted by browser, otherwise starts on first gesture)
    void audioMgr.unlock();

    // --- SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c11);
    scene.fog = new THREE.Fog(0x0a0c11, 35, 95);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 300);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    
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

    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // --- LIGHTING (Overhead Arena Spotlight + Warm Rim Light + Hemisphere Fill) ---
    scene.add(new THREE.HemisphereLight(0x9fb4dd, 0x201a12, 0.72));
    const arenaSpot = new THREE.SpotLight(0xfff4e0, 2.2, 95, 0.58, 0.7, 1);
    arenaSpot.position.set(0, 24, 0);
    arenaSpot.target.position.set(0, 0, 0);
    arenaSpot.castShadow = !isSoftwareGl;
    arenaSpot.shadow.mapSize.set(2048, 2048);
    arenaSpot.shadow.bias = -0.0008;
    scene.add(arenaSpot, arenaSpot.target);

    const rimLight = new THREE.DirectionalLight(0xff9a4a, 0.65);
    rimLight.position.set(-18, 12, -10);
    scene.add(rimLight);

    const sun = new THREE.DirectionalLight(0xffffff, 0.55);
    sun.position.set(8, 28, 12);
    sun.castShadow = !isSoftwareGl;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -20; sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 10; sun.shadow.camera.bottom = -10;
    scene.add(sun);

    // --- PROCEDURAL REALISTIC WOODGRAIN & WEAR TEXTURE ---
    const createWoodgrainTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Base alternating maple hardwood planks matching Original Court Scene
      const plankCount = 36;
      const plankH = canvas.height / plankCount;
      for (let i = 0; i < plankCount; i++) {
        ctx.fillStyle = i % 2 ? "#c99256" : "#b9803f";
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

    // Hardwood Court with realistic woodgrain and wear & tear
    const floorTex = createWoodgrainTexture();
    const asphaltTex = createAsphaltTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex || undefined,
      roughness: 0.55,
      metalness: 0.04,
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

      // Metallic Rim
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(RIM_R, 0.02, 12, 32),
        new THREE.MeshStandardMaterial({ color: 0xd8431e, metalness: 0.5, roughness: 0.4 })
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.set(x - 1.2 * side, RIM_Y, 0);
      rim.castShadow = true;
      scene.add(rim);

      // Stanchion Pole + Padded Base + Gooseneck Extension Arm
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x888c94, metalness: 0.6, roughness: 0.4 });
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 3.6, 14), poleMat);
      pole.position.set(x + 0.65 * side, 1.8, 0);
      pole.castShadow = true;
      scene.add(pole);

      const stanchionPad = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 1.35, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.7 })
      );
      stanchionPad.position.set(x + 0.65 * side, 0.675, 0);
      stanchionPad.castShadow = true;
      scene.add(stanchionPad);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.12, 0.12), poleMat);
      arm.position.set(x - 0.1 * side, 3.05, 0);
      arm.castShadow = true;
      scene.add(arm);

      // Tapered Wireframe Basketball Net
      const netMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(RIM_R, 0.11, 0.42, 16, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.55 })
      );
      netMesh.position.set(x - 1.2 * side, RIM_Y - 0.21, 0);
      scene.add(netMesh);
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

    // Team Benches (Player chairs on court sideline)
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

    // --- BALL ---
    function ballTexture() {
      const c = document.createElement("canvas"); c.width = 512; c.height = 256; const g = c.getContext("2d"); if (!g) return null;
      g.fillStyle = "#e8651a"; g.fillRect(0, 0, 512, 256); g.strokeStyle = "#161616"; g.lineWidth = 8;
      g.beginPath(); g.moveTo(0, 128); g.lineTo(512, 128); g.stroke(); g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 256); g.stroke();
      g.beginPath(); g.arc(0, 128, 140, -1.1, 1.1); g.stroke(); g.beginPath(); g.arc(512, 128, 140, Math.PI - 1.1, Math.PI + 1.1); g.stroke();
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
    }
    const ball = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 32, 20), new THREE.MeshStandardMaterial({ map: ballTexture(), roughness: 0.5 }));
    ball.castShadow = true; ball.position.set(0, 2.1, 0); scene.add(ball);

    // --- ENTITIES ---
    function makeHuman(color: number, logoTex?: THREE.Texture) {
      const root = new THREE.Group(); scene.add(root);
      const mat = (c: number, r = 0.6) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
      const jerseyMat = mat(color), skinMat = mat(0x8d5524, 0.7), shortsMat = mat(0x161616), shoeMat = mat(0xf5f5f5, 0.4);
      const box = (w: number, h: number, d: number, m: THREE.Material, p: THREE.Object3D, x: number, y: number, z: number) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); mesh.position.set(x, y, z); mesh.castShadow = true; p.add(mesh); return mesh;
      };
      const pelvis = new THREE.Group(); pelvis.position.y = 0.95; root.add(pelvis); box(0.46, 0.3, 0.28, shortsMat, pelvis, 0, 0, 0);
      const torso = new THREE.Group(); pelvis.add(torso); box(0.5, 0.62, 0.28, jerseyMat, torso, 0, 0.31, 0);
      
      let logoMesh;
      if (logoTex) {
        logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshBasicMaterial({ map: logoTex, transparent: true }));
        logoMesh.position.set(0, 0.4, 0.15);
        torso.add(logoMesh);
      }

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), skinMat); head.position.y = 0.8; head.castShadow = true; torso.add(head);

      // Headband accessory mesh
      const headbandMat = mat(0xffffff, 0.5);
      const headbandMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.138, 0.138, 0.045, 18), headbandMat);
      headbandMesh.position.y = 0.83;
      torso.add(headbandMesh);
      headbandMesh.visible = false;

      const legs: any = {}, arms: any = {}, hands: any = {};
      [["R", -1], ["L", 1]].forEach(([key, side]: any) => {
        const hip = new THREE.Group(); hip.position.set(side * 0.13, -0.05, 0); pelvis.add(hip);
        box(0.19, 0.44, 0.2, shortsMat, hip, 0, -0.22, 0); const knee = new THREE.Group(); knee.position.y = -0.44; hip.add(knee);
        box(0.16, 0.44, 0.18, skinMat, knee, 0, -0.22, 0); box(0.2, 0.08, 0.3, shoeMat, knee, 0, -0.46, 0.05); legs[key] = { hip, knee };
      });
      [["R", -1], ["L", 1]].forEach(([key, side]: any) => {
        const sh = new THREE.Group(); sh.position.set(side * 0.32, 0.55, 0); torso.add(sh);
        box(0.14, 0.36, 0.14, jerseyMat, sh, 0, -0.18, 0); const el = new THREE.Group(); el.position.y = -0.36; sh.add(el);
        box(0.12, 0.34, 0.12, skinMat, el, 0, -0.17, 0); const hand = new THREE.Group(); hand.position.y = -0.34; el.add(hand);
        box(0.14, 0.1, 0.16, skinMat, hand, 0, -0.04, 0.03); arms[key] = { sh, el }; hands[key] = hand;
      });
      return { root, pelvis, torso, legs, arms, hands, jerseyMat, skinMat, shortsMat, shoeMat, headbandMat, headbandMesh, logoMesh };
    }
    interface GameEntity {
      root: THREE.Group; pelvis: THREE.Group; torso: THREE.Group; legs: any; arms: any; hands: any;
      name: string; isUser: boolean; vel: THREE.Vector3; h: number; vy: number; hand: "R"|"L"; dribPhase: number; runPhase: number; spin: number; faceYaw: number;
      act: any; holdT: number; shield: boolean; cur: any; squeak?: any;
      stats: { pts: number, ast: number, reb: number, fouls: number };
      pos: string;
      isBench: boolean;
      logoMesh?: THREE.Mesh;
      jerseyMat: THREE.MeshStandardMaterial;
      skinMat: THREE.MeshStandardMaterial;
      shortsMat: THREE.MeshStandardMaterial;
      shoeMat: THREE.MeshStandardMaterial;
      headbandMat: THREE.MeshStandardMaterial;
      headbandMesh: THREE.Mesh;
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
      new THREE.MeshBasicMaterial({ map: homeLogoTex, transparent: true, opacity: 0.7, depthWrite: false })
    );
    centerLogo.rotation.x = -Math.PI / 2;
    centerLogo.position.set(0, 0.015, 0);
    scene.add(centerLogo);

    function makeEntity(color: number, x: number, z: number, name: string, pos: string, logoTex: THREE.Texture, isUser = false, isBench = false): GameEntity {
      const H = makeHuman(color, logoTex); H.root.position.set(x, 0, z);
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
        cur: { shR: -0.25, elR: -0.5, shL: -0.25, elL: -0.5, hipR: 0, kneeR: 0.05, hipL: 0, kneeL: 0.05, lean: 0, crouch: 0 },
        stats: { pts: 0, ast: 0, reb: 0, fouls: 0 },
        jerseyMat: H.jerseyMat,
        skinMat: H.skinMat,
        shortsMat: H.shortsMat,
        shoeMat: H.shoeMat,
        headbandMat: H.headbandMat,
        headbandMesh: H.headbandMesh,
      };
    }

    const initialAthlete = athleteProfileRef.current;
    const ME = makeEntity(0xc8102e, -10, 0, `${initialAthlete.firstName} ${initialAthlete.lastName} #${initialAthlete.jerseyNumber}`, initialAthlete.position, homeLogoTex, true);
    const teamA: GameEntity[] = [
      ME, 
      makeEntity(0xc8102e, -8, 4, "Johnson", "SG", homeLogoTex), 
      makeEntity(0xc8102e, -8, -4, "Miller", "SF", homeLogoTex), 
      makeEntity(0xc8102e, -4, 5, "Davis", "PF", homeLogoTex), 
      makeEntity(0xc8102e, -4, -5, "Thompson", "C", homeLogoTex),
      // Bench
      makeEntity(0xc8102e, 0, 0, "White", "PG", homeLogoTex, false, true),
      makeEntity(0xc8102e, 0, 0, "Green", "SG", homeLogoTex, false, true),
      makeEntity(0xc8102e, 0, 0, "Black", "SF", homeLogoTex, false, true),
      makeEntity(0xc8102e, 0, 0, "Brown", "PF", homeLogoTex, false, true),
      makeEntity(0xc8102e, 0, 0, "Taylor", "C", homeLogoTex, false, true),
    ];
    const teamB: GameEntity[] = [
      makeEntity(0x1d428a, 10, 0, "Jordan", "SG", awayLogoTex), 
      makeEntity(0x1d428a, 8, 4, "Bryant", "SF", awayLogoTex), 
      makeEntity(0x1d428a, 8, -4, "James", "PF", awayLogoTex), 
      makeEntity(0x1d428a, 4, 5, "Curry", "PG", awayLogoTex), 
      makeEntity(0x1d428a, 4, -5, "Durant", "C", awayLogoTex),
      // Bench
      makeEntity(0x1d428a, 0, 0, "O'Neal", "C", awayLogoTex, false, true),
      makeEntity(0x1d428a, 0, 0, "Bird", "SF", awayLogoTex, false, true),
      makeEntity(0x1d428a, 0, 0, "Magic", "PG", awayLogoTex, false, true),
      makeEntity(0x1d428a, 0, 0, "Barkley", "PF", awayLogoTex, false, true),
      makeEntity(0x1d428a, 0, 0, "Pippen", "SG", awayLogoTex, false, true),
    ];
    const entities: GameEntity[] = [...teamA, ...teamB];

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
      setTeamARoster([...teamA]);
    };

    // Apply initially equipped items & athlete build on startup
    applyCustomization(loadCareerStats());
    applyAthleteProfile(athleteProfileRef.current);

    // --- STATE ---
    const state = {
      owner: null as any, ballMode: "held" as any, flight: null as any, 
      scoreHome: 0, scoreAway: 0, shotClock: 24, 
      gameClock: quarterLengthRef.current, quarter: 1, isGameOver: false,
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
      looseT: 0, lbUsed: false, rbUsed: false, ballVel: V(),
      keys: {} as any, prevKeys: {} as any, joystick: { x: 0, y: 0, active: false, autoSprint: false }, 
      touchButtons: {} as any, lastTime: performance.now(), camLook: V(0, 1.4, 0)
    };

    // --- HELPERS ---
    const fwd = (P: any) => { const hoopX = teamA.includes(P) ? 13.6 : -13.6; const v = V(hoopX - P.root.position.x, 0, -P.root.position.z); return v.lengthSq() < 1e-6 ? V(1, 0, 0) : v.normalize(); };
    const rightOf = (P: any) => { const f = fwd(P); return V(-f.z, 0, f.x); };
    const torsoPos = (P: any) => V(P.root.position.x, P.h + 1.2, P.root.position.z);
    const handPos = (P: any) => P.hands[P.hand].getWorldPosition(V());
    const isNearHoop = (pos: THREE.Vector3) =>
      Math.hypot(pos.x - 13.6, pos.z) < 3.2 || Math.hypot(pos.x + 13.6, pos.z) < 3.2;
    const applyVel = (P: any, want: THREE.Vector3, dt: number) => {
      if (P.act && P.act.lock) return;
      const isStoppingOrCutting = want.lengthSq() < 0.01 || P.vel.dot(want) < 0;
      const responseRate = P.isUser ? (isStoppingOrCutting ? 28 : 22) : (isStoppingOrCutting ? 22 : 17);
      P.vel.lerp(want, 1 - Math.exp(-responseRate * dt));
      P.root.position.x = clamp(P.root.position.x + P.vel.x * dt, -13.9, 13.9);
      P.root.position.z = clamp(P.root.position.z + P.vel.z * dt, -7.4, 7.4);
    };
    const aiSteer = (P: any, tx: number, tz: number, sp: number, dt: number) => { const dx = tx - P.root.position.x, dz = tz - P.root.position.z, d = Math.hypot(dx, dz); const s = Math.min(sp, d * 4.5); applyVel(P, d > 0.01 ? V(dx/d*s, 0, dz/d*s) : V(), dt); };
    
    // --- CENTRALIZED AUDIO MANAGER ADAPTER (Uses only uploaded audio files) ---
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

      return {
        unlock: () => { audioMgr.unlock(); },
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
        crowdScream: (opts?: { pan?: number; vol?: number }) => audioMgr.crowdCheer(opts),
        crowdReaction: (opts?: { pan?: number; vol?: number }) => audioMgr.crowdReaction(opts),
        whistle: () => audioMgr.crowdReaction({ vol: 0.72 }),
        shotClockBeep: (_high = false) => {},
        shotClockBuzzer: () => audioMgr.buzzer("shotclock"),
        buzzer: (kind: "quarter" | "game" | "shotclock" = "quarter") => audioMgr.buzzer(kind),
        shotResetSound: () => {},
        updateCheer: (val: number) => audioMgr.updateCrowdAmbience(val),
        speak: (text: string) => audioMgr.speak(text),
        commentary: (type: keyof typeof phrases, val?: any) => {
          const p = phrases[type];
          const text = typeof p === "function" ? p(val) : random(p as string[]);
          audioMgr.speak(text);
        },
      };
    })();
    const jumpAct = (P: any, name: string, dur: number) => { if (P.act || P.h > 0.05) return; P.vy = 3.4; P.act = { kind: "jump", name, t: 0, dur, lock: false, pose: (u: any, T: any) => { T.shL = T.shR = -2.5; T.elL = T.elR = -1.4; } }; };

    function triggerMsg(text: string, color = "#fff") { setMessage({ text, color, visible: true }); setTimeout(() => setMessage(m => ({ ...m, visible: false })), 1500); }
    function triggerLabel(text: string) { setLabel({ text, visible: true }); setTimeout(() => setLabel(l => ({ ...l, visible: false })), 1000); }

    function fire(P: any, from: THREE.Vector3, aim: THREE.Vector3, FT: number, type: string, ex: any = {}) {
      state.flight = { kind: type, shooter: P, passTo: ex.passTo || null, pts: ex.pts || 0, perfect: !!ex.perfect, dunk: !!ex.dunk, layup: !!ex.layup, t: 0, T: FT, rim: 0 };
      ball.position.copy(from); state.ballVel.set((aim.x - from.x) / FT, (aim.y - from.y) / FT + 0.5 * G * FT, (aim.z - from.z) / FT);
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
    }
    function releaseShot(P: any, a: any, forced: boolean) {
      if (a.released) return; a.released = true;
      const hoopX = teamA.includes(P) ? 13.6 : -13.6;
      const d = Math.hypot(P.root.position.x - hoopX, P.root.position.z);
      const e = Math.abs((a.c || 0.5) - 0.5);
      let spread, FT, pts = d > 7.2 ? 3 : 2;
      if (a.dunk) { spread = 0.03; FT = 0.42; pts = 2; } else if (a.layup) { spread = 0.1; FT = 0.5 + d * 0.03; pts = 2; }
      else { spread = 0.05 + e * 0.85; FT = 0.8 + d * 0.045; }
      if (P.isUser) {
        const shootRating = athleteProfileRef.current.attributes.shooting;
        const shootFactor = clamp(1 - (shootRating - 72) / 90, 0.45, 1.15);
        spread *= shootFactor;
      }
      const from = handPos(P); const aim = V(hoopX + rnd(spread), RIM_Y + rnd(spread * 0.4), rnd(spread));

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

      fire(P, from, aim, FT, "shot", { perfect: e < 0.06, dunk: a.dunk, layup: a.layup, pts });
    }
    function startShot(P: any, o: any = {}) {
      if (P.act || P.h > 0.05 || (!o.auto && state.owner !== P)) return null;
      const a: any = { kind: "shot", name: o.name || "JUMP SHOT", t: 0, dur: o.dur || 1.25, lock: !o.move, released: false, layup: !!o.layup, dunk: !!o.dunk, auto: !!o.auto, c: 0.5, stepback: !!o.stepback };
      if (o.auto) a.c = 0.5 + rnd(0.3);
      if (o.stepback) { P.vel.addScaledVector(fwd(P), -4.5); }
      a.pose = (u: number, T: any) => { const k = P.hand, o = k === "R" ? "L" : "R"; if (a.dunk) { T.shR = T.shL = -3.0; T.elR = T.elL = -0.5; return; } if (a.layup) { T["sh" + k] = -2.2; T["el" + k] = -1.9; return; } if (!a.released) { T["sh" + k] = -2.5; T["el" + k] = -1.9; if(a.stepback) T.lean = -0.2; } else { T["sh" + k] = -2.9; T["el" + k] = -0.2; } };
      a.update = () => { if (a.released) return; if ((a.layup && a.t >= 0.35) || (a.dunk && a.t >= 0.3) || (a.auto && a.t >= 0.4)) return releaseShot(P, a, false); if (P.isUser && !a.auto && !a.layup && !a.dunk) a.c = (((a.t / 0.55) % 2 + 2) % 2) < 1 ? ((a.t / 0.55) % 2) : 2 - ((a.t / 0.55) % 2); };
      a.end = () => { if (!a.released) releaseShot(P, a, true); };
      const finishBoost = P.isUser ? 1 + (athleteProfileRef.current.attributes.finishing - 75) / 260 : 1;
      P.act = a; state.ballMode = "held"; P.vy = (a.dunk ? 5.4 : a.stepback ? 3.5 : 4.6) * finishBoost; if (P.isUser) triggerLabel(a.name); return a;
    }
    function performFoul(defender: GameEntity, attacker: GameEntity) {
      if (state.deadT > 0) return;
      defender.stats.fouls++;
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
    function substitute(team: GameEntity[], idxIn: number, idxOut: number) {
      const pIn = team[idxIn], pOut = team[idxOut];
      if (!pIn.isBench || pOut.isBench) return;
      const oldCourtPos = pOut.root.position.clone();
      const benchPos = pIn.root.position.clone();

      pIn.isBench = false;
      pIn.root.visible = true;
      pIn.root.position.copy(oldCourtPos);
      pIn.pelvis.position.y = 0.95;
      pIn.legs.R.hip.rotation.x = 0;
      pIn.legs.L.hip.rotation.x = 0;
      pIn.legs.R.knee.rotation.x = 0.05;
      pIn.legs.L.knee.rotation.x = 0.05;

      pOut.isBench = true;
      pOut.root.visible = true;
      pOut.root.position.copy(benchPos);
      pOut.vel.set(0, 0, 0);
      pOut.pelvis.position.y = 0.5;
      pOut.legs.R.hip.rotation.x = -1.4;
      pOut.legs.L.hip.rotation.x = -1.4;
      pOut.legs.R.knee.rotation.x = 1.4;
      pOut.legs.L.knee.rotation.x = 1.4;

      if (state.owner === pOut) state.owner = pIn;
      setTeamARoster([...team]);
      triggerMsg(`SUB: ${pIn.name} IN`, "#10b981");
      Audio.whistle();
    }

    let currentCity = initialCity;

    // --- APPLY WORLD TOUR CITY ARENA & TEAMS ---
    const applyCity = (city: WorldCity) => {
      currentCity = city;
      if (apronMat) {
        apronMat.color.setStyle(gameModeRef.current === "streetball" ? "#1d262b" : city.courtBorderColor);
        apronMat.needsUpdate = true;
      }
      if (keyMat) {
        keyMat.color.setStyle(city.courtKeyColor);
        keyMat.needsUpdate = true;
      }

      // Update Team B jerseys & shorts to reflect this visited city's kit
      teamB.forEach((p) => {
        if (p.jerseyMat) {
          p.jerseyMat.color.setStyle(city.jerseyPrimary);
          p.jerseyMat.needsUpdate = true;
        }
        if (p.shortsMat) {
          p.shortsMat.color.setStyle(city.shortsColor);
          p.shortsMat.needsUpdate = true;
        }
      });

      Audio.whistle();
      triggerMsg(`${city.name.toUpperCase()} ARENA`, city.jerseyPrimary);
      Audio.speak(`Welcome to ${city.arenaName} in ${city.country}!`);
      setTimeout(() => {
        Audio.speak(city.crowdChant);
      }, 1800);
    };

    // Apply the initial chosen city
    applyCity(initialCity);

    // --- APPLY GAME MODE (MATCH, STREETBALL, TRAINING, FREESTYLE) ---
    const starterPosA: [number, number][] = [[-10, 0], [-8, 4], [-8, -4], [-4, 5], [-4, -5]];
    const starterPosB: [number, number][] = [[10, 0], [8, 4], [8, -4], [4, 5], [4, -5]];

    const resetStartersAndBench = () => {
      teamA.slice(0, 5).forEach((p, idx) => {
        p.isBench = false;
        p.root.visible = true;
        p.root.position.set(starterPosA[idx][0], 0, starterPosA[idx][1]);
        p.vel.set(0, 0, 0);
        p.act = null;
        p.holdT = 0;
        p.pelvis.position.y = 0.95;
        p.legs.R.hip.rotation.x = 0;
        p.legs.L.hip.rotation.x = 0;
        p.legs.R.knee.rotation.x = 0.05;
        p.legs.L.knee.rotation.x = 0.05;
      });
      teamA.slice(5).forEach((p, i) => {
        p.isBench = true;
        p.root.visible = true;
        p.root.position.set(-6 + i * 0.85, 0.15, 7.8);
        p.vel.set(0, 0, 0);
        p.pelvis.position.y = 0.5;
        p.legs.R.hip.rotation.x = -1.4;
        p.legs.L.hip.rotation.x = -1.4;
        p.legs.R.knee.rotation.x = 1.4;
        p.legs.L.knee.rotation.x = 1.4;
      });
      teamB.slice(0, 5).forEach((p, idx) => {
        p.isBench = false;
        p.root.visible = true;
        p.root.position.set(starterPosB[idx][0], 0, starterPosB[idx][1]);
        p.vel.set(0, 0, 0);
        p.act = null;
        p.holdT = 0;
        p.pelvis.position.y = 0.95;
        p.legs.R.hip.rotation.x = 0;
        p.legs.L.hip.rotation.x = 0;
        p.legs.R.knee.rotation.x = 0.05;
        p.legs.L.knee.rotation.x = 0.05;
      });
      teamB.slice(5).forEach((p, i) => {
        p.isBench = true;
        p.root.visible = true;
        p.root.position.set(2 + i * 0.85, 0.15, 7.8);
        p.vel.set(0, 0, 0);
        p.pelvis.position.y = 0.5;
        p.legs.R.hip.rotation.x = -1.4;
        p.legs.L.hip.rotation.x = -1.4;
        p.legs.R.knee.rotation.x = 1.4;
        p.legs.L.knee.rotation.x = 1.4;
      });
      setTeamARoster([...teamA]);
    };

    const applyGameMode = (mode: GameMode) => {
      gameModeRef.current = mode;
      state.isGameOver = false;
      state.isPaused = false;
      state.flight = null;
      state.deadT = 0;
      state.hadRimContact = false;
      state.lastPasser = null;
      entities.forEach((p) => {
        p.stats = { pts: 0, ast: 0, reb: 0, fouls: 0 };
        p.act = null;
        p.vel.set(0, 0, 0);
      });

      if (mode === "streetball") {
        floorMat.map = asphaltTex || floorTex || null;
        floorMat.roughness = 0.85;
        floorMat.needsUpdate = true;
        scene.background = new THREE.Color(0x1b2b3a);
        scene.fog = new THREE.Fog(0x1b2b3a, 35, 110);
        apronMat.color.setHex(0x1d262b);
        apronMat.needsUpdate = true;
        marginGroup.visible = true;
      } else {
        floorMat.map = floorTex || null;
        floorMat.roughness = 0.45;
        floorMat.needsUpdate = true;
        scene.background = new THREE.Color(0x0b0d12);
        scene.fog = new THREE.Fog(0x0b0d12, 35, 120);
        apronMat.color.setStyle(currentCity.courtBorderColor);
        apronMat.needsUpdate = true;
        marginGroup.visible = true;
      }

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
      triggerMsg("GAME OVER", "#ef476f");
      Audio.buzzer("game");
      Audio.crowdScream({ vol: 0.95 });
      Audio.commentary("gameover");
      const stats = entities
        .filter((p) => p.root.visible)
        .map((p) => ({
          name: p.name,
          isUser: p.isUser,
          pts: p.stats.pts,
          ast: p.stats.ast,
          reb: p.stats.reb,
          fouls: p.stats.fouls,
          team: teamA.includes(p) ? "Home" : "Away",
        }));
      setFinalStats(stats.sort((a, b) => (b.pts + b.ast * 2 + b.reb * 1.5) - (a.pts + a.ast * 2 + a.reb * 1.5)));

      // Record match to career stats
      const earnings = {
        pts: ME.stats.pts,
        reb: ME.stats.reb,
        ast: ME.stats.ast,
        fouls: ME.stats.fouls,
        won: state.scoreHome >= state.scoreAway,
      };
      const recordResult = recordMatchToCareer(earnings);
      setCareerStats(recordResult.updatedStats);
      setLastMatchEarnings({
        pts: earnings.pts,
        reb: earnings.reb,
        ast: earnings.ast,
        xpGained: recordResult.xpGained,
        leveledUp: recordResult.leveledUp,
        unlocked: recordResult.newlyUnlockedItems,
      });

      if (recordResult.newlyUnlockedItems.length > 0) {
        Audio.commentary("unlock");
        triggerMsg("NEW GEAR UNLOCKED!", "#10b981");
      }

      setTimeout(() => setShowSummary(true), 800);
    };

    const scoopBall = () => {
      const fromHoop = isNearHoop(ball.position);
      const wasHeldByOpp = Boolean(state.owner && !teamA.includes(state.owner));
      const wasDeadAfterScore = state.ballMode === "dead" && state.deadReason === "score";

      ME.root.position.x = clamp(ball.position.x - (ball.position.x > 0 ? 0.35 : -0.35), -13.5, 13.5);
      ME.root.position.z = clamp(ball.position.z, -7.0, 7.0);
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

        // Plays & Actions can be called anytime on offense
        if (OFFENSE_CATEGORIES.plays.includes(offMove)) {
          activeOffensePlayRef.current = offMove;
          setActiveOffensePlay(offMove);
          const nextOff =
            offMove === OffenseMove.FAST_BREAK
              ? "fast_break"
              : offMove === OffenseMove.FLARE_SCREEN ||
                offMove === OffenseMove.PIN_DOWN ||
                offMove === OffenseMove.ELEVATOR_SCREEN
              ? "pace_space"
              : offMove === OffenseMove.BACK_SCREEN ||
                offMove === OffenseMove.CROSS_SCREEN
              ? "paint_power"
              : "pick_roll";
          const nextTactics = { ...tacticsRef.current, offense: nextOff as any };
          tacticsRef.current = nextTactics;
          setTactics(nextTactics);
          triggerLabel(`PLAY: ${label.toUpperCase()}`);
          triggerMsg(label.toUpperCase(), "#38bdf8");
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

        if (OFFENSE_CATEGORIES.dribbling.includes(offMove)) {
          ME.hand = ME.hand === "R" ? "L" : "R";
          Audio.dribble({ pan: clamp(ME.root.position.z / 7.5, -1, 1), vol: 0.9 });
          Audio.squeak({ pan: 0, vol: 0.8 });

          if (offMove === OffenseMove.SPIN_MOVE) {
            ME.vel.addScaledVector(f, 5.2);
            ME.act = {
              kind: "dribble_move",
              name: label.toUpperCase(),
              t: 0,
              dur: 0.55,
              pose: (u: number, T: any) => {
                T.lean = 0.25;
                T.crouch = 0.16;
                ME.faceYaw += u * Math.PI * 2;
              },
            };
          } else if (
            offMove === OffenseMove.STEPBACK_DRIBBLE ||
            offMove === OffenseMove.RETREAT_DRIBBLE ||
            offMove === OffenseMove.SNATCH_DRIBBLE
          ) {
            ME.vel.addScaledVector(f, -5.0);
            ME.act = {
              kind: "dribble_move",
              name: label.toUpperCase(),
              t: 0,
              dur: 0.45,
              pose: (_u: number, T: any) => {
                T.lean = -0.18;
                T.crouch = 0.22;
                T.shR = -1.1;
                T.elR = -1.4;
              },
            };
          } else if (offMove === OffenseMove.HESITATION) {
            ME.vel.multiplyScalar(0.25);
            ME.act = {
              kind: "dribble_move",
              name: label.toUpperCase(),
              t: 0,
              dur: 0.45,
              pose: (u: number, T: any) => {
                T.lean = u < 0.5 ? -0.15 : 0.3;
                T.shR = -1.3;
                T.elR = -0.8;
              },
              end: () => {
                ME.vel.addScaledVector(f, 5.5);
              },
            };
          } else if (offMove === OffenseMove.PROTECT_DRIBBLE) {
            ME.shield = true;
            ME.act = {
              kind: "dribble_move",
              name: label.toUpperCase(),
              t: 0,
              dur: 0.6,
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
          } else {
            // CROSSOVER, KILLER_CROSSOVER, BEHIND_THE_BACK, BETWEEN_THE_LEGS, PUNCH_DRIBBLE, SHAMMGOD
            const lateralSign = ME.hand === "R" ? 1 : -1;
            const impulse =
              offMove === OffenseMove.KILLER_CROSSOVER || offMove === OffenseMove.SHAMMGOD
                ? 5.2
                : 3.6;
            ME.vel.addScaledVector(r, lateralSign * impulse);
            ME.vel.addScaledVector(f, 2.8);
            ME.act = {
              kind: "dribble_move",
              name: label.toUpperCase(),
              t: 0,
              dur: 0.42,
              pose: (_u: number, T: any) => {
                T.crouch = 0.22;
                T.lean = 0.24;
                T.shR = -1.6;
                T.elR = -1.1;
                T.shL = -1.2;
                T.elL = -1.3;
              },
            };
          }
          triggerLabel(label.toUpperCase());
          return;
        }

        if (OFFENSE_CATEGORIES.footwork.includes(offMove)) {
          Audio.squeak({ pan: 0, vol: 0.85 });
          if (
            offMove === OffenseMove.PUMP_FAKE ||
            offMove === OffenseMove.BALL_FAKE ||
            offMove === OffenseMove.SHOULDER_FAKE ||
            offMove === OffenseMove.JAB_STEP ||
            offMove === OffenseMove.PIVOT
          ) {
            ME.act = {
              kind: "footwork",
              name: label.toUpperCase(),
              t: 0,
              dur: 0.42,
              pose: (u: number, T: any) => {
                const peak = Math.sin(u * Math.PI);
                T.shR = -0.5 - peak * 1.9;
                T.shL = -0.5 - peak * 1.9;
                T.elR = -1.2;
                T.elL = -1.2;
                T.crouch = 0.15;
              },
            };
          } else if (offMove === OffenseMove.HOP_STEP || offMove === OffenseMove.JUMP_STOP) {
            ME.vy = 2.6;
            ME.vel.addScaledVector(f, 5.5);
            ME.act = {
              kind: "footwork",
              name: label.toUpperCase(),
              t: 0,
              dur: 0.45,
              pose: (_u: number, T: any) => {
                T.crouch = 0.28;
                T.hipR = -0.4;
                T.hipL = -0.4;
              },
            };
          } else {
            // DROP_STEP, UP_AND_UNDER, EURO_STEP, BASELINE_SPIN
            const dir = offMove === OffenseMove.EURO_STEP ? -1 : 1;
            ME.vy = 1.8;
            ME.vel.addScaledVector(f, 5.8).addScaledVector(r, dir * 2.4);
            ME.act = {
              kind: "footwork",
              name: label.toUpperCase(),
              t: 0,
              dur: 0.55,
              pose: (u: number, T: any) => {
                T.lean = 0.2;
                T.shR = -1.7;
                T.elR = -1.0;
                if (offMove === OffenseMove.DROP_STEP || offMove === OffenseMove.BASELINE_SPIN) {
                  ME.faceYaw += u * Math.PI;
                }
              },
            };
          }
          triggerLabel(label.toUpperCase());
          return;
        }

        if (OFFENSE_CATEGORIES.shooting.includes(offMove)) {
          if (offMove === OffenseMove.STEPBACK_THREE || offMove === OffenseMove.FADEAWAY) {
            startShot(ME, { name: label.toUpperCase(), stepback: true, auto: true, dur: 1.05 });
          } else if (
            offMove === OffenseMove.FLOATER ||
            offMove === OffenseMove.TEAR_DROP ||
            offMove === OffenseMove.RUNNER
          ) {
            startShot(ME, { name: label.toUpperCase(), layup: true, auto: true, dur: 0.7 });
          } else if (offMove === OffenseMove.HOOK_SHOT || offMove === OffenseMove.SKY_HOOK) {
            startShot(ME, { name: label.toUpperCase(), auto: true, dur: 0.95 });
          } else {
            startShot(ME, { name: label.toUpperCase(), auto: true, dur: 0.9 });
          }
          return;
        }

        if (OFFENSE_CATEGORIES.finishing.includes(offMove)) {
          if (
            offMove === OffenseMove.DUNK ||
            offMove === OffenseMove.ALLEY_OOP ||
            offMove === OffenseMove.PUT_BACK
          ) {
            ME.vel.addScaledVector(f, 6.2);
            startShot(ME, { dunk: true, name: label.toUpperCase(), auto: true });
          } else if (offMove === OffenseMove.TIP_OUT) {
            const target = teamA.find((p) => !p.isBench && p.root.visible && p !== ME);
            if (target) {
              fire(ME, handPos(ME), torsoPos(target), 0.45, "pass", { passTo: target });
              triggerLabel(label.toUpperCase());
            } else {
              startShot(ME, { layup: true, name: label.toUpperCase(), auto: true });
            }
          } else {
            ME.vel.addScaledVector(f, 5.2);
            startShot(ME, { layup: true, name: label.toUpperCase(), auto: true });
          }
          return;
        }

        if (OFFENSE_CATEGORIES.passing.includes(offMove)) {
          const candidates = teamA.filter((p) => !p.isBench && p.root.visible && p !== ME);
          if (candidates.length === 0) {
            triggerLabel("SOLO COURT - NO TEAMMATE");
            return;
          }
          const sorted = [...candidates].sort((a, b) =>
            offMove === OffenseMove.SKIP_PASS || offMove === OffenseMove.OUTLET_PASS
              ? b.root.position.distanceTo(ME.root.position) - a.root.position.distanceTo(ME.root.position)
              : a.root.position.distanceTo(ME.root.position) - b.root.position.distanceTo(ME.root.position)
          );
          const target = sorted[0];
          state.lastPasser = ME;
          state.lastPassTime = performance.now();
          const ft =
            offMove === OffenseMove.LOB_PASS || offMove === OffenseMove.OVERHEAD_PASS
              ? 0.65
              : offMove === OffenseMove.BOUNCE_PASS
              ? 0.38
              : 0.36;
          fire(ME, handPos(ME), torsoPos(target), ft, "pass", { passTo: target });
          triggerLabel(label.toUpperCase());
          return;
        }
      } else {
        // DEFENSE MOVES
        const defMove = move as DefenseMove;
        const ballOwner = state.owner && !teamA.includes(state.owner) ? state.owner : teamB[0];

        if (
          DEFENSE_CATEGORIES.schemes.includes(defMove) ||
          DEFENSE_CATEGORIES.pnr_coverage.includes(defMove)
        ) {
          activeDefenseSchemeRef.current = defMove;
          setActiveDefenseScheme(defMove);
          const nextDef =
            defMove === DefenseMove.FULL_COURT_PRESS ||
            defMove === DefenseMove.HALF_COURT_TRAP ||
            defMove === DefenseMove.TRAP ||
            defMove === DefenseMove.DOUBLE_TEAM
              ? "press"
              : defMove === DefenseMove.ZONE_2_3 ||
                defMove === DefenseMove.ZONE_3_2 ||
                defMove === DefenseMove.ZONE_1_3_1 ||
                defMove === DefenseMove.DROP_COVERAGE ||
                defMove === DefenseMove.MATCHUP_ZONE
              ? "zone"
              : defMove === DefenseMove.GAP_HELP || defMove === DefenseMove.WEAK_SIDE_HELP
              ? "conservative"
              : "lockdown";
          const nextTactics = { ...tacticsRef.current, defense: nextDef as any };
          tacticsRef.current = nextTactics;
          setTactics(nextTactics);
          triggerLabel(`DEF: ${label.toUpperCase()}`);
          triggerMsg(label.toUpperCase(), "#ef4444");
          return;
        }

        if (DEFENSE_CATEGORIES.shot_defense.includes(defMove) || defMove === DefenseMove.DEFENSIVE_REBOUND) {
          if (ME.h <= 0.05) {
            ME.vy = defMove === DefenseMove.BLOCK || defMove === DefenseMove.CHALLENGE ? 4.4 : 3.0;
          }
          ME.act = {
            kind: "def_contest",
            name: label.toUpperCase(),
            t: 0,
            dur: 0.55,
            pose: (_u: number, T: any) => {
              T.shR = -2.85;
              T.shL = -2.65;
              T.elR = -0.25;
              T.elL = -0.35;
            },
          };
          if (state.ballMode === "flight" && state.flight?.kind === "shot") {
            const distToBall = ME.root.position.distanceTo(ball.position);
            if (distToBall < 2.4) {
              state.ballVel.x *= -0.7;
              state.ballVel.y = 2.0;
              state.flight = null;
              state.ballMode = "loose";
              Audio.backboardHit({ pan: clamp(ME.root.position.z / 7.5, -1, 1), vol: 0.9 });
              Audio.crowdReaction({ vol: 0.88 });
              Audio.commentary("block");
              triggerMsg("REJECTED!", "#ef4444");
              return;
            }
          }
          triggerLabel(label.toUpperCase());
          return;
        }

        if (DEFENSE_CATEGORIES.disruption.includes(defMove)) {
          // If ball is loose, rebounding near the hoop, or falling from a make, grab/steal it directly from the hoop
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
            const toOwner = V().subVectors(ballOwner.root.position, ME.root.position);
            if (toOwner.length() > 0.1) {
              toOwner.y = 0;
              toOwner.normalize();
              ME.vel.addScaledVector(toOwner, 6.8);
            }
            const dist = ME.root.position.distanceTo(ballOwner.root.position);
            const nearHoop = isNearHoop(ballOwner.root.position) || isNearHoop(ball.position);
            if (dist < (nearHoop ? 2.85 : 2.55) && state.owner === ballOwner && defMove !== DefenseMove.CHARGE_DRAW) {
              if (nearHoop || dist < 1.85 || Math.random() < 0.84) {
                state.owner = ME;
                state.ballMode = "dribble";
                state.flight = null;
                state.deadT = 0;
                state.deadReason = null;
                state.fastTransitionT = 3.6;
                state.prevPossessionTeam = "Home";
                Audio.squeak({ pan: clamp(ME.root.position.z / 7.5, -1, 1), vol: 0.9, entityKey: "me" });
                Audio.crowdReaction({ vol: 0.92 });
                Audio.commentary("steal");
                triggerMsg(nearHoop ? "STOLE FROM HOOP!" : `${label.toUpperCase()}!`, "#10b981");
                return;
              }
            }
          }
          ME.act = {
            kind: "def_reach",
            name: label.toUpperCase(),
            t: 0,
            dur: 0.4,
            pose: (_u: number, T: any) => {
              T.crouch = 0.25;
              T.lean = 0.35;
              T.shR = -1.6;
              T.elR = -0.2;
            },
          };
          triggerLabel(label.toUpperCase());
          return;
        }

        // Stance / Movement / Rebounding Box Out
        ME.act = {
          kind: "def_stance",
          name: label.toUpperCase(),
          t: 0,
          dur: 0.55,
          pose: (_u: number, T: any) => {
            T.crouch = 0.32;
            T.lean = 0.15;
            T.shR = -1.1;
            T.shL = -1.1;
            T.elR = -0.8;
            T.elL = -0.8;
          },
        };
        if (ballOwner && ballOwner.root.visible && defMove === DefenseMove.CLOSEOUT) {
          const toOwner = V().subVectors(ballOwner.root.position, ME.root.position);
          toOwner.y = 0;
          if (toOwner.length() > 0.2) ME.vel.addScaledVector(toOwner.normalize(), 6.0);
        }
        Audio.squeak({ pan: 0, vol: 0.8 });
        triggerLabel(label.toUpperCase());
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

    const applyRemoteRoomSnapshot = (room: MultiplayerRoomState) => {
      if (!room) return;
      if (mpClientRef.current && room.hostId && room.hostId !== mpClientRef.current.playerId) {
        state.scoreHome = room.match.scoreHome;
        state.scoreAway = room.match.scoreAway;
        setScoreHome(room.match.scoreHome);
        setScoreAway(room.match.scoreAway);
      }
    };

    const applyRemoteMatchEvent = (event: any, match: any) => {
      if (!event || !mpClientRef.current) return;
      if (event.playerId === mpClientRef.current.playerId) return;
      if (event.type === "basket_scored" && match) {
        state.scoreHome = match.scoreHome;
        state.scoreAway = match.scoreAway;
        setScoreHome(match.scoreHome);
        setScoreAway(match.scoreAway);
        triggerMsg("REMOTE BUCKET!", "#38bdf8");
      } else if (event.type === "city_change" && event.payload?.cityId) {
        const c = getCityById(String(event.payload.cityId));
        setSelectedCity(c);
        applyCity(c);
      } else if (event.type === "mode_change" && event.payload?.mode) {
        applyGameMode(event.payload.mode as GameMode);
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
      endMatch: endGameAndRecordStats,
    };

    // --- LOOP ---
    let frameId: number; let prevInput: any = {};
    const onKeyDown = (e: any) => {
      state.keys[e.code] = true;
      Audio.unlock();
      if (!e.repeat && (e.code === "Escape" || e.code === "KeyM")) {
        setShowMainMenu((prev) => !prev);
      }
    };
    const onKeyUp = (e: any) => { state.keys[e.code] = false; };
    window.addEventListener("keydown", onKeyDown); window.addEventListener("keyup", onKeyUp);

    // Interactive Drag-to-Orbit & Scroll-to-Zoom Camera State (tight player-follow framing)
    let orbitTheta = 1.48;
    let orbitPhi = 0.96;
    let orbitRadius = window.innerWidth < window.innerHeight ? 17.5 : 13.5;
    let orbitPointerId: number | null = null;
    let orbitLastX = 0;
    let orbitLastY = 0;

    camera.position.set(
      ME.root.position.x + orbitRadius * Math.sin(orbitPhi) * Math.cos(orbitTheta),
      1.15 + orbitRadius * Math.cos(orbitPhi),
      ME.root.position.z + orbitRadius * Math.sin(orbitPhi) * Math.sin(orbitTheta)
    );
    state.camLook.set(ME.root.position.x, 1.15, ME.root.position.z);
    camera.lookAt(state.camLook);

    const loop = (now: number) => {
      const dt = Math.min((now - state.lastTime) / 1000, 0.05); state.lastTime = now;
      Audio.updateCheer(state.crowdCheer);

      // Game Highlights 3D Slow-Motion Playback
      if (isHighlightReplayRef.current && replayClipsRef.current.length > 0) {
        replayProgressRef.current += dt * 0.42;
        if (replayProgressRef.current >= 1) {
          replayProgressRef.current = 0;
          replayClipIndexRef.current = (replayClipIndexRef.current + 1) % replayClipsRef.current.length;
          setActiveHighlightIndex(replayClipIndexRef.current);
        }
        const activeClip = replayClipsRef.current[replayClipIndexRef.current];
        const frame = activeClip ? interpolateHighlightFrame(activeClip.frames, replayProgressRef.current) : null;
        if (frame) {
          ball.position.set(frame.ballPos[0], frame.ballPos[1], frame.ballPos[2]);
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
          const camTarget = V(ball.position.x * 0.55 + 7.5, 5.8, ball.position.z * 0.5 + 6.5);
          camera.position.lerp(camTarget, 1 - Math.exp(-4 * dt));
          state.camLook.lerp(ball.position, 1 - Math.exp(-5 * dt));
          camera.lookAt(state.camLook);
        }
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(loop);
        return;
      }

      if (state.isGameOver || (isOverlayOpenRef.current && !state.isPaused)) {
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(loop);
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
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(loop);
        return;
      }

      const isPracticeMode = gameModeRef.current === "freestyle" || gameModeRef.current === "training";

      // Shot Clock Tick & Urgency Processing
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
      
      if (!isPracticeMode) {
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
      const b = (i: number) => !!(gp && gp.buttons[i]?.pressed); const ax = (i: number) => (gp && Math.abs(gp.axes[i]) > 0.15) ? gp.axes[i] : 0;
      if (b(9) && !prevInput.START) {
        setShowMainMenu(true);
      }
      const k = (c: string) => !!state.keys[c]; const tb = (c: string) => !!state.touchButtons[c];
      const input = {
        A: b(0) || k("Space") || k("Enter") || k("NumpadEnter") || tb("A"),
        B: b(1) || k("KeyK") || tb("B"),
        X: b(2) || k("KeyU") || tb("X"),
        Y: b(3) || k("KeyI") || tb("Y"),
        LB: b(4) || k("KeyQ") || tb("LB"),
        RB: b(5) || k("KeyE") || tb("RB"),
        LT: b(6) || k("KeyZ") || tb("LT"),
        RT: b(7) || k("ShiftLeft") || tb("RT"),
        START: b(9),
        mx: clamp(ax(0) + (k("KeyD") || k("ArrowRight") ? 1 : 0) - (k("KeyA") || k("ArrowLeft") ? 1 : 0) + (state.joystick.active ? state.joystick.x : 0), -1, 1),
        my: clamp(ax(1) + (k("KeyS") || k("ArrowDown") ? 1 : 0) - (k("KeyW") || k("ArrowUp") ? 1 : 0) + (state.joystick.active ? state.joystick.y : 0), -1, 1)
      };
      const edge = (k: keyof typeof input) => !!input[k] && !prevInput[k];

      // USER (Camera-Relative Ultra-Responsive Movement & Controls)
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
      const sp = 6.2 * handleBoost * (input.RT || joystickSprint || isTransitionSprint ? 1.62 : 1);
      const wantVel = V()
        .addScaledVector(camDir, moveForward * normScale * sp)
        .addScaledVector(camRight, moveRight * normScale * sp);
      applyVel(ME, wantVel, dt);

      const hoopX = teamA.includes(ME) ? 13.6 : -13.6;
      const toHoopDir = V(hoopX - ME.root.position.x, 0, -ME.root.position.z);
      if (toHoopDir.lengthSq() > 1e-6) toHoopDir.normalize();
      const inputWorldDir = moveMag > 0.1 && wantVel.lengthSq() > 1e-6 ? wantVel.clone().normalize() : V();
      const moveTowardHoopDot = moveMag > 0.1 ? inputWorldDir.dot(toHoopDir) : 0;

      const canTakeOrStealFromHoop =
        state.owner !== ME &&
        (state.ballMode === "loose" ||
          (state.ballMode === "dead" && state.deadReason === "score") ||
          !state.owner ||
          (state.flight?.kind === "shot" && (state.flight.reboundable || isNearHoop(ball.position))));

      if ((edge("A") || k("KeyF")) && canTakeOrStealFromHoop) {
        scoopBall();
      } else if (edge("A") && state.owner === ME) {
        if (moveTowardHoopDot < -0.3) startShot(ME, { name: "FADEAWAY", stepback: true, dur: 1.5 });
        else startShot(ME);
      }
      if (!input.A && prevInput.A && ME.act?.kind === "shot" && !ME.act.released && !ME.act.auto) releaseShot(ME, ME.act, false);
      if (edge("Y") && state.owner === ME) startShot(ME, { dunk: true, name: "SLAM DUNK" });
      else if (edge("Y") && canTakeOrStealFromHoop) {
        scoopBall();
      }
      if (edge("X") && state.owner === ME) {
        if (moveMag > 0.45) {
          if (moveTowardHoopDot > 0.25) {
            // Hop Step
            ME.vy = 2.6;
            ME.vel.addScaledVector(fwd(ME), 6.5);
            triggerLabel("HOP STEP");
          } else {
            // Step Back
            startShot(ME, { stepback: true, name: "STEP BACK", dur: 1.4 });
          }
        } else {
          // Crossover / Jab
          ME.act = { kind: "cross", name: "CROSSOVER", t: 0, dur: 0.35, pose: (u: any, T: any) => { T.lean = 0.2; T.shR = -1.5; T.elR = -1; } };
          triggerLabel("CROSSOVER");
        }
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
              const score = toMate.normalize().dot(inputWorldDir) - dist * 0.025;
              if (score > bestScore) {
                bestScore = score;
                target = mate;
              }
            }
          } else {
            target = teammates.reduce((best, mate) => (mate.root.position.x > best.root.position.x ? mate : best), teammates[0]);
          }
          state.lastPasser = ME;
          state.lastPassTime = now;
          fire(ME, handPos(ME), torsoPos(target), 0.36, "pass", { passTo: target });
        }
      }
      if (edge("LB")) {
        const benchIdx = teamA.findIndex(p => p.isBench);
        const activeIdx = teamA.findIndex(p => !p.isBench && p !== ME);
        if (benchIdx !== -1 && activeIdx !== -1) substitute(teamA, benchIdx, activeIdx);
      }

      // Expanded Offense & Defense Move Key Bindings
      const prevRawKeys: Record<string, boolean> = prevInput.rawKeys || {};
      const edgeKey = (code: string) => !!state.keys[code] && !prevRawKeys[code];
      if (edgeKey("KeyC")) {
        executeMove(state.owner === ME ? OffenseMove.BEHIND_THE_BACK : DefenseMove.CLOSEOUT);
      }
      if (edgeKey("KeyH")) {
        if (state.owner === ME) {
          const hoopX = teamA.includes(ME) ? 13.6 : -13.6;
          const distToHoop = Math.hypot(ME.root.position.x - hoopX, ME.root.position.z);
          executeMove(distToHoop < 7.5 ? OffenseMove.HOOK_SHOT : OffenseMove.HESITATION);
        } else {
          executeMove(DefenseMove.HEDGE);
        }
      }
      if (edgeKey("KeyV")) {
        if (state.owner === ME) {
          const hoopX = teamA.includes(ME) ? 13.6 : -13.6;
          const distToHoop = Math.hypot(ME.root.position.x - hoopX, ME.root.position.z);
          executeMove(distToHoop < 5.5 ? OffenseMove.DROP_STEP : OffenseMove.SPIN_MOVE);
        } else {
          executeMove(DefenseMove.DEFENSIVE_SLIDE);
        }
      }
      if (edgeKey("KeyJ")) {
        if (state.owner === ME) executeMove(OffenseMove.PUMP_FAKE);
        else executeMove(DefenseMove.DENY);
      }
      if (edgeKey("KeyL")) {
        if (state.owner === ME) executeMove(OffenseMove.LOB_PASS);
        else executeMove(DefenseMove.HELP_AND_RECOVER);
      }
      if (edgeKey("KeyG")) {
        if (state.owner !== ME) {
          executeMove(input.LT ? DefenseMove.BOX_OUT : DefenseMove.BLOCK);
        } else {
          executeMove(OffenseMove.PROTECT_DRIBBLE);
        }
      }
      if (edgeKey("KeyE") || edge("RB") || (state.owner !== ME && edge("LT"))) {
        if (canTakeOrStealFromHoop && ME.root.position.distanceTo(ball.position) < 4.5) {
          scoopBall();
        } else if (state.owner !== ME) {
          executeMove(DefenseMove.POKE_STEAL);
        }
      }
      if (edgeKey("Digit1")) executeMove(OffenseMove.PICK_AND_ROLL);
      if (edgeKey("Digit2")) executeMove(OffenseMove.PICK_AND_POP);
      if (edgeKey("Digit3")) executeMove(OffenseMove.PIN_DOWN);
      if (edgeKey("Digit4")) executeMove(OffenseMove.BACKDOOR_CUT);
      if (edgeKey("Digit5")) executeMove(OffenseMove.GIVE_AND_GO);
      if (edgeKey("Digit6")) executeMove(OffenseMove.FAST_BREAK);

      // MULTIPLAYER REMOTE PEER SYNCHRONIZATION
      remoteDrivenEntities.clear();
      const activeMpRoom = mpRoomRef.current;
      const activeMpClient = mpClientRef.current;
      if (activeMpRoom && activeMpClient && activeMpClient.transport !== "disconnected") {
        const homeNonMeSlots = teamA.filter((p) => !p.isBench && p !== ME);
        const awaySlots = teamB.filter((p) => !p.isBench);
        let hCursor = 0;
        let aCursor = 0;

        for (const peer of Object.values(activeMpRoom.players)) {
          if (peer.playerId === activeMpClient.playerId) continue;
          let targetEntity: GameEntity | undefined;
          if (peer.team === "Home") {
            targetEntity = homeNonMeSlots[hCursor++];
          } else {
            targetEntity = awaySlots[aCursor++];
          }
          if (!targetEntity) continue;

          remoteDrivenEntities.add(targetEntity);
          targetEntity.root.visible = true;
          targetEntity.name = peer.name;
          if (peer.jerseyColor) {
            targetEntity.jerseyMat.color.setStyle(peer.jerseyColor);
          }
          const lerpAlpha = 1 - Math.exp(-14 * dt);
          targetEntity.root.position.x += (peer.transform.x - targetEntity.root.position.x) * lerpAlpha;
          targetEntity.root.position.z += (peer.transform.z - targetEntity.root.position.z) * lerpAlpha;
          targetEntity.vel.set(peer.transform.vx || 0, 0, peer.transform.vz || 0);
          targetEntity.h += ((peer.transform.h || 0) - targetEntity.h) * lerpAlpha;
          targetEntity.faceYaw = peer.transform.faceYaw || targetEntity.faceYaw;
        }
      }

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

      if (gameModeRef.current === "training") {
        // Training mode: partner at wing rebounds and passes back to user
        const partner = teamA[1];
        if (partner && !remoteDrivenEntities.has(partner)) {
          if (state.owner === partner) {
            partner.holdT += dt;
            if (partner.holdT > 0.55) {
              partner.holdT = 0;
              fire(partner, handPos(partner), torsoPos(ME), 0.42, "pass", { passTo: ME });
            }
          } else if (state.ballMode === "loose" || (state.ballMode === "dead" && state.deadReason === "score")) {
            aiSteer(partner, ball.position.x, ball.position.z, 10.5, dt);
          } else {
            aiSteer(partner, 10.5, 3.2, 7.5, dt);
          }
        }
      } else if (gameModeRef.current !== "freestyle") {
        // Identify nearest non-user chasers when ball is loose, rebounding off hoop, or dead after a score
        let nearestLooseA: GameEntity | null = null;
        let nearestLooseB: GameEntity | null = null;
        const canAiChaseBall =
          state.ballMode === "loose" ||
          (state.ballMode === "dead" && state.deadReason === "score") ||
          (state.ballMode === "flight" &&
            state.flight?.kind === "shot" &&
            (state.flight.reboundable || (isNearHoop(ball.position) && ball.position.y < 3.45)));

        if (canAiChaseBall) {
          let bestA = Infinity;
          let bestB = Infinity;
          for (const P of teamA) {
            if (P.isBench || P.isUser || remoteDrivenEntities.has(P)) continue;
            const d = Math.hypot(P.root.position.x - ball.position.x, P.root.position.z - ball.position.z);
            if (d < bestA) { bestA = d; nearestLooseA = P; }
          }
          for (const P of teamB) {
            if (P.isBench || remoteDrivenEntities.has(P)) continue;
            const d = Math.hypot(P.root.position.x - ball.position.x, P.root.position.z - ball.position.z);
            if (d < bestB) { bestB = d; nearestLooseB = P; }
          }
        }

        const fastLanesZ = [-5.4, 5.4, -2.6, 2.6, 0];

        teamA.forEach((P, i) => {
          if (P.isBench || P.isUser || remoteDrivenEntities.has(P)) return;
          if (P === nearestLooseA) {
            aiSteer(P, ball.position.x, ball.position.z, 12.2, dt);
            if (ball.position.y > 1.75 && P.h <= 0.05 && Math.hypot(P.root.position.x - ball.position.x, P.root.position.z - ball.position.z) < 2.1) {
              P.vy = 4.2;
            }
            return;
          }
          if (state.owner === P) {
            P.holdT += dt;
            if (!P.act) {
              if (P.root.position.x < 4.5) {
                // Sprint really fast down to the other half of the court
                aiSteer(P, 10.6, clamp(P.root.position.z * 0.5, -3.5, 3.5), 11.8, dt);
              } else {
                aiSteer(P, 11.8, rnd(1.8), 7.6, dt);
                if (P.holdT > 1.25) startShot(P, { auto: true, stepback: Math.random() < 0.2, name: Math.random() < 0.2 ? "STEP BACK" : "JUMP SHOT" });
              }
            }
          } else if (isTeamA) {
            if (isTeamATransition) {
              // All teammates sprint fast into the offensive half of the court
              const tx = 8.4 + (i % 2) * 3.2;
              const tz = fastLanesZ[i % fastLanesZ.length];
              aiSteer(P, tx, tz, 12.6, dt);
            } else if (currentTactics.offense === "pace_space") {
              aiSteer(P, 7.5 + (i % 2) * 2.5, (i - 2) * 5.2, 7.4, dt);
            } else if (currentTactics.offense === "paint_power") {
              aiSteer(P, i >= 3 ? 12.5 : 8.0, (i - 2) * 2.2, 7.6, dt);
            } else if (currentTactics.offense === "fast_break") {
              aiSteer(P, 11.5, i % 2 === 0 ? 5.5 : -5.5, 11.8, dt);
            } else {
              if (i === 4 && state.owner === ME) {
                aiSteer(P, ME.root.position.x + 1.2, ME.root.position.z + 0.4, 7.6, dt);
              } else {
                aiSteer(P, 9.2, (i - 2) * 3.8, 7.4, dt);
              }
            }
          } else {
            // Defense: Sprint back really fast to the other half (-X) when Team B transitions
            if (isTeamBTransition || P.root.position.x > -2.5) {
              const defX = -8.4 - (i % 2) * 3.0;
              const defZ = fastLanesZ[i % fastLanesZ.length] * 0.75;
              aiSteer(P, defX, defZ, 12.8, dt);
            } else if (currentTactics.defense === "zone") {
              const zoneX = -10.5 + (i < 2 ? 2.5 : 0);
              const zoneZ = i === 0 ? -2.5 : i === 1 ? 2.5 : (i - 3) * 2.2;
              aiSteer(P, zoneX, zoneZ, 7.6, dt);
            } else if (currentTactics.defense === "press") {
              const opp = teamB[i];
              if (opp && !opp.isBench) {
                aiSteer(P, opp.root.position.x + 0.5, opp.root.position.z, 8.6, dt);
              } else {
                aiSteer(P, -4, (i - 2) * 3, 8.0, dt);
              }
            } else {
              aiSteer(P, -9.2, (i - 2) * 3, currentTactics.defense === "conservative" ? 6.8 : 7.8, dt);
            }
          }
        });

        teamB.forEach((P, i) => {
          if (P.isBench || remoteDrivenEntities.has(P)) return;
          if (P === nearestLooseB) {
            aiSteer(P, ball.position.x, ball.position.z, 12.2, dt);
            if (ball.position.y > 1.75 && P.h <= 0.05 && Math.hypot(P.root.position.x - ball.position.x, P.root.position.z - ball.position.z) < 2.1) {
              P.vy = 4.2;
            }
            return;
          }
          if (state.owner === P) {
            P.holdT += dt;
            if (!P.act) {
              if (P.root.position.x > -4.5) {
                // Sprint really fast down to the other half of the court
                aiSteer(P, -10.6, clamp(P.root.position.z * 0.5, -3.5, 3.5), 11.8, dt);
              } else {
                aiSteer(P, -11.8, rnd(1.8), 7.6, dt);
                if (P.holdT > 1.25) startShot(P, { auto: true, stepback: Math.random() < 0.2, name: Math.random() < 0.2 ? "STEP BACK" : "JUMP SHOT" });
              }
            }
          } else if (!isTeamA) {
            if (isTeamBTransition) {
              // All Team B teammates sprint fast into the offensive (-X) half of the court
              const tx = -8.4 - (i % 2) * 3.2;
              const tz = fastLanesZ[i % fastLanesZ.length];
              aiSteer(P, tx, tz, 12.6, dt);
            } else {
              aiSteer(P, -9.2, (i - 2) * 3.8, 7.6, dt);
            }
          } else {
            const t = teamA.find((p) => !p.isBench && teamA.indexOf(p) === i);
            if (isTeamATransition || P.root.position.x < 2.5) {
              // Sprint back really fast to the other half (+X) to defend the hoop
              const defX = t ? Math.max(6.5, t.root.position.x + 1.2) : 9.4;
              const defZ = t ? t.root.position.z : fastLanesZ[i % fastLanesZ.length] * 0.75;
              aiSteer(P, defX, defZ, 12.8, dt);
            } else if (t) {
              aiSteer(P, t.root.position.x + fwd(t).x * 1.2, t.root.position.z + fwd(t).z * 1.2, 7.6, dt);
            }
          }
        });

        // DEFENSE / FOULS / STEALS (including heightened steals around either hoop)
        if (state.owner && state.ballMode === "dribble") {
          const owner = state.owner;
          const opponentTeam = teamA.includes(owner) ? teamB : teamA;
          const isTeamADefending = !teamA.includes(owner);
          const ownerNearHoop = isNearHoop(owner.root.position);
          let stealRadius = ownerNearHoop ? 1.4 : 0.9;
          let stealProb = (ownerNearHoop ? 0.032 : 0.012) * dt * 60;
          let foulProb = ownerNearHoop ? 0.12 : 0.2;

          if (isTeamADefending) {
            if (currentTactics.defense === "press") {
              stealRadius = ownerNearHoop ? 1.65 : 1.35;
              stealProb = (ownerNearHoop ? 0.05 : 0.028) * dt * 60;
              foulProb = 0.28;
            } else if (currentTactics.defense === "conservative") {
              stealRadius = ownerNearHoop ? 1.15 : 0.65;
              stealProb = (ownerNearHoop ? 0.02 : 0.004) * dt * 60;
              foulProb = 0.0;
            } else if (currentTactics.defense === "zone") {
              stealRadius = ownerNearHoop ? 1.35 : 0.8;
              stealProb = (ownerNearHoop ? 0.028 : 0.009) * dt * 60;
              foulProb = 0.12;
            }
          }

          const defBonus = !isTeamADefending ? 1 : 1 + (athleteProfileRef.current.attributes.defense - 75) / 140;

          opponentTeam.forEach(opp => {
            if (opp.isBench || !opp.root.visible) return;
            const dist = opp.root.position.distanceTo(owner.root.position);
            if (dist < stealRadius) {
              const prob = opp.isUser ? stealProb * defBonus : stealProb;
              if (Math.random() < prob) {
                if (Math.random() < foulProb) performFoul(opp, owner);
                else {
                  state.owner = opp;
                  state.fastTransitionT = 3.6;
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

      // PHYSICS
      entities.forEach(P => {
        if(P.isBench) return;
        if(P.act) { P.act.t += dt; if(P.act.update) P.act.update(); if(P.act.t >= P.act.dur) { if(P.act.end) P.act.end(); P.act = null; } }
        if(P.h > 0 || P.vy > 0) { P.vy -= G*dt; P.h += P.vy*dt; if(P.h <= 0) { P.h = 0; P.vy = 0; } }
        const sp = Math.hypot(P.vel.x, P.vel.z);
        P.runPhase += dt * Math.min(sp * 2.1, 22);
        const fa = fwd(P);
        const targetYaw = (state.owner !== P && !P.act && sp > 2.0)
          ? Math.atan2(P.vel.x, P.vel.z)
          : Math.atan2(fa.x, fa.z);
        const yawDiff = Math.atan2(Math.sin(targetYaw - P.faceYaw), Math.cos(targetYaw - P.faceYaw));
        P.faceYaw += yawDiff * Math.min(1, dt * 18);
        const T: any = { shR: -0.25, elR: -0.5, shL: -0.25, elL: -0.5, hipR: 0, kneeR: 0.05, hipL: 0, kneeL: 0.05, lean: 0, crouch: 0 };
        if(P.h > 0.03) { T.hipR = T.hipL = -0.45; T.kneeR = T.kneeL = 0.75; } else if(sp > 0.35) { const s = Math.sin(P.runPhase); T.hipR = s*0.64; T.hipL = -s*0.64; T.kneeR = 0.15+Math.max(0,-s)*0.78; T.kneeL = 0.15+Math.max(0,s)*0.78; T.lean = clamp(sp * 0.024, 0.06, 0.28); }
        if(state.owner === P && state.ballMode === "dribble" && !P.act) { const k = P.hand, o = k === "R" ? "L" : "R"; T["sh"+k] = -0.45; T["el"+k] = -1.05; T["sh"+o] = -0.9; T["el"+o] = -1.5; T.lean = 0.12; }
        if(P.act?.pose) P.act.pose(clamp(P.act.t/P.act.dur, 0, 1), T); const k_ = Math.min(1, dt*20); for(const key in T) (P.cur as any)[key] += ((T as any)[key] - (P.cur as any)[key]) * k_;
        const c = P.cur, L = P.legs, A = P.arms; L.R.hip.rotation.x = c.hipR; L.R.knee.rotation.x = c.kneeR; L.L.hip.rotation.x = c.hipL; L.L.knee.rotation.x = c.kneeL; A.R.sh.rotation.x = c.shR; A.R.el.rotation.x = c.elR; A.L.sh.rotation.x = c.shL; A.L.el.rotation.x = c.elL; P.torso.rotation.x = c.lean; P.pelvis.position.y = 0.95-c.crouch; P.root.position.y = P.h; P.root.rotation.y = P.faceYaw;

        // SNEAKER SQUEAKS (movement, sharp cuts/pivots, running strides, and stops)
        if (!P.squeak) P.squeak = { prevVel: V(), cool: 0 };
        P.squeak.cool -= dt;
        const speed = Math.hypot(P.vel.x, P.vel.z);
        const prevSpeed = Math.hypot(P.squeak.prevVel.x, P.squeak.prevVel.z);
        const dotDir =
          speed > 1.2 && prevSpeed > 1.2
            ? (P.vel.x * P.squeak.prevVel.x + P.vel.z * P.squeak.prevVel.z) / (speed * prevSpeed)
            : 1;
        const isHardStop = prevSpeed > 3.0 && speed < 1.2;
        const isSharpCutOrPivot = dotDir < 0.65 && speed > 2.0;
        const isFastRunStride = speed > 4.6 && P.h <= 0.05;
        if (P.squeak.cool <= 0 && P.h <= 0.05 && (isHardStop || isSharpCutOrPivot || isFastRunStride)) {
          const pan = clamp(P.root.position.z / 7.5, -1, 1);
          const vol = isHardStop || isSharpCutOrPivot ? clamp(Math.max(speed, prevSpeed) / 5.2, 0.35, 0.95) : 0.42;
          Audio.squeak({ pan, vol, entityKey: P.name });
          P.squeak.cool = isFastRunStride && !isHardStop && !isSharpCutOrPivot
            ? 0.42 + Math.random() * 0.25
            : 0.22 + Math.random() * 0.16;
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
        ball.rotation.x += h * 8;
        ball.rotation.z += h * 2.5;
        if(p.x < -14 || p.x > 14) {
          if(p.y > 2.9 && p.y < 4 && Math.abs(p.z) < 0.9) {
            state.ballVel.x *= -0.5;
            p.x = p.x < 0 ? -13.9 : 13.9;
            if (state.flight) state.flight.reboundable = true;
            state.hadRimContact = true;
            Audio.backboardHit({ pan: clamp(p.z / 7.5, -1, 1), vol: 0.9 });
          }
        }
        if(state.flight && state.flight.kind !== "pass" && prevY > RIM_Y && p.y <= RIM_Y && state.ballVel.y < 0) {
          const hoopX = teamA.includes(state.flight.shooter) ? 13.6 : -13.6; const dx = p.x - hoopX, dz = p.z; const d = Math.hypot(dx, dz);
          if(d < RIM_R - 0.04) {
            const shooter = state.flight.shooter;
            shooter.stats.pts += state.flight.pts;
            if (state.lastPasser && state.lastPasser !== shooter && now - state.lastPassTime < 5000) {
              state.lastPasser.stats.ast++;
            }
            state.lastPasser = null;

            const isHome = teamA.includes(shooter); if(isHome) { state.scoreHome+=state.flight.pts; setScoreHome(state.scoreHome); } else { state.scoreAway+=state.flight.pts; setScoreAway(state.scoreAway); }
            const playTypeLabel = state.flight.dunk ? "SLAM DUNK" : state.flight.layup ? "LAYUP" : state.flight.pts === 3 ? "THREE-POINTER" : "SWISH";
            triggerMsg(playTypeLabel, isHome ? "#ef476f" : "#1d428a");

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
            };
            quarterHighlightsRef.current = [...quarterHighlightsRef.current, clip].slice(-3);
            allHighlightsRef.current = [...allHighlightsRef.current, clip].slice(-3);
            setHighlightsCount(allHighlightsRef.current.length);

            if (activeMpClient && activeMpClient.roomCode) {
              activeMpClient.sendEvent("basket_scored", {
                scoreHome: state.scoreHome,
                scoreAway: state.scoreAway,
                shotClock: 24,
                scorerName: shooter.name,
                playType: playTypeLabel,
                points: state.flight.pts,
              });
            }

            if (shooter.isUser && gameModeRef.current === "training") {
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
            
            const scorePan = clamp(p.z / 7.5, -1, 1);
            if (state.flight.dunk) {
              Audio.dunk({ pan: scorePan, vol: 1.0 });
              Audio.netSwish({ pan: scorePan, vol: 0.7 });
              Audio.crowdScream({ vol: 1.0 });
              Audio.commentary("dunk");
            } else if (state.flight.layup) {
              Audio.netSwish({ pan: scorePan, vol: 0.85 });
              Audio.crowdScream({ vol: 0.85 });
              Audio.commentary("layup");
            } else if (state.flight.pts === 3) {
              Audio.netSwish({ pan: scorePan, vol: 1.0 });
              Audio.crowdScream({ vol: 1.0 });
              Audio.commentary("three");
            } else {
              Audio.netSwish({ pan: scorePan, vol: 0.95 });
              Audio.crowdScream({ vol: 0.88 });
              Audio.commentary("swish");
            }

            state.ballMode = "dead";
            state.deadReason = "score";
            state.lastScoringTeam = isHome ? "Home" : "Away";
            state.deadT = 0.75;
            state.ballVel.set(rnd(0.35), -2.4, rnd(0.35));
            state.shotClock = resetShotClock("basket_made");
            setShotClockResetPulse(k => k + 1);
            setLastShotResetReason("basket_made");
            state.flight = null;
            state.crowdCheer = 3.0; // SCREAMING CHEER!
          } else if (d < RIM_R + 0.1 && state.flight.rim < 3) { 
            state.flight.rim++;
            state.flight.reboundable = true;
            p.y = RIM_Y+0.02; state.ballVel.y = 1.5; state.ballVel.x += dx*2; 
            state.hadRimContact = true;
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
            Audio.floorBounce({ pan: clamp(p.z / 7.5, -1, 1), vol: impactVol });
            state.ballVel.y *= -0.5;
            if(state.flight?.kind === "shot") {
              state.flight = null;
              state.ballMode = "loose";
              triggerMsg("MISS", "#ef476f");
              state.crowdCheer = Math.max(state.crowdCheer, 0.5);
              Audio.crowdReaction({ vol: 0.78 });
              Audio.commentary("miss");
            }
          } else state.ballVel.y = 0;
          state.ballVel.multiplyScalar(0.98);
        }
      };
      if(state.ballMode === "dribble" && state.owner) {
        const P = state.owner;
        const prevBounce = Math.abs(Math.cos(P.dribPhase));
        P.dribPhase += dt * 8;
        const bounce = Math.abs(Math.cos(P.dribPhase));
        // Trigger dribble right as the ball touches the court floor (bounce crosses near 0)
        if (prevBounce > 0.2 && bounce <= 0.2) {
          const pan = clamp(P.root.position.z / 7.5, -1, 1);
          Audio.dribble({ pan, vol: 0.85 });
        }
        const hp = handPos(P);
        ball.position.set(hp.x, BALL_R + Math.max(0, hp.y-BALL_R)*bounce, hp.z);
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
              inbounder.root.position.set(12.5, 0, clamp(ball.position.z, -2.5, 2.5));
              state.owner = inbounder;
            } else {
              if (!isPractice && state.deadReason === "score" && state.lastScoringTeam === "Away") {
                ME.root.position.set(-12.5, 0, clamp(ball.position.z, -2.5, 2.5));
              }
              state.owner = ME;
            }
            state.ballMode = "dribble";
            state.deadReason = null;
            state.ballVel.set(0, 0, 0);
            state.fastTransitionT = 3.6;
          }
        }
      }
      if(state.flight) {
        state.flight.t += dt;
        if(state.flight.kind === "pass") {
          const t = state.flight.passTo;
          if(ball.position.distanceTo(torsoPos(t)) < 0.75) {
            state.owner = t; state.ballMode = "dribble"; state.flight = null;
            Audio.catchBall({ pan: clamp(t.root.position.z / 7.5, -1, 1), vol: 0.8 });
            if(t.isUser) triggerLabel("GOT IT");
          }
        }
        else if(state.flight.t > 4.5) { state.flight = null; state.ballMode = "loose"; }
      }
      // Take / Rebound / Steal Basketball directly from the hoop (or loose on floor)
      const canGrabOrTakeFromHoop =
        state.ballMode === "loose" ||
        (state.ballMode === "dead" && state.deadReason === "score" && state.deadT < 0.55) ||
        (state.ballMode === "flight" &&
          state.flight?.kind === "shot" &&
          (state.flight.reboundable || (isNearHoop(ball.position) && state.ballVel.y < 1.2 && ball.position.y <= 3.3)));

      if(canGrabOrTakeFromHoop) { 
        let best: GameEntity | null = null, bd = 2.0; 
        const teamARebMax = tacticsRef.current.defense === "zone" ? 1.95 : 1.7;
        const ballAtHoop = isNearHoop(ball.position);
        entities.forEach(P => {
          if(P.isBench || !P.root.visible) return;
          if(state.ballMode === "dead" && state.deadReason === "score" && !P.isUser) {
            const pIsHome = teamA.includes(P);
            if ((state.lastScoringTeam === "Home" && pIsHome) || (state.lastScoringTeam === "Away" && !pIsHome)) {
              return;
            }
          }
          const maxReachY = 2.45 + P.h * 0.95;
          if (ball.position.y > maxReachY) return;
          const jumpBonus = P.h > 0.1 ? 0.3 : 0;
          const maxDist = (P.isUser ? 1.85 : (teamA.includes(P) ? teamARebMax : 1.55)) + jumpBonus;
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
          state.owner = grabber;
          state.ballMode = "dribble";
          state.flight = null;
          state.deadT = 0;
          state.deadReason = null;
          state.looseT = 0;
          state.fastTransitionT = 3.6;
          Audio.catchBall({ pan: clamp(grabber.root.position.z / 7.5, -1, 1), vol: 0.85 });
          if (grabber.isUser) {
            triggerLabel(ballAtHoop ? (wasDeadScore ? "STOLE FROM HOOP!" : "TOOK FROM HOOP!") : "GOT BALL!");
          }
        } 
      }

      // Track if ball is loose, rebounding at hoop, or stealable near hoop for UI button
      const looseNow =
        state.ballMode === "loose" ||
        (state.ballMode === "dead" && state.deadReason === "score") ||
        (!state.owner && ball.position.y < 3.35) ||
        Boolean(
          state.owner &&
            !teamA.includes(state.owner) &&
            isNearHoop(ball.position) &&
            ME.root.position.distanceTo(state.owner.root.position) < 2.85
        );
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
        activeMpClient.sendSync({
          transform: {
            x: ME.root.position.x,
            y: ME.root.position.y,
            z: ME.root.position.z,
            vx: ME.vel.x,
            vz: ME.vel.z,
            faceYaw: ME.faceYaw,
            h: ME.h,
          },
          stats: {
            pts: ME.stats.pts,
            ast: ME.stats.ast,
            reb: ME.stats.reb,
          },
          matchPatch: isHost
            ? {
                scoreHome: state.scoreHome,
                scoreAway: state.scoreAway,
                quarter: state.quarter,
                gameClock: Math.ceil(state.gameClock),
                shotClock: state.shotClock,
                ballPos: [ball.position.x, ball.position.y, ball.position.z],
                ballVel: [state.ballVel.x, state.ballVel.y, state.ballVel.z],
                ballMode: state.ballMode,
              }
            : undefined,
        });
      }

      // CAMERA (Moves tightly with the player ME as they move, with optional drag-to-orbit & scroll-to-zoom)
      const focusX = ME.root.position.x + ME.vel.x * 0.08;
      const focusY = 1.15 + ME.h * 0.45;
      const focusZ = ME.root.position.z + ME.vel.z * 0.08;
      const camTarget = V(
        focusX + orbitRadius * Math.sin(orbitPhi) * Math.cos(orbitTheta),
        focusY + orbitRadius * Math.cos(orbitPhi),
        focusZ + orbitRadius * Math.sin(orbitPhi) * Math.sin(orbitTheta)
      );
      camera.position.lerp(camTarget, 1 - Math.exp(-16 * dt));
      state.camLook.lerp(V(focusX, focusY, focusZ), 1 - Math.exp(-20 * dt));
      camera.lookAt(state.camLook);

      prevInput = { ...input, rawKeys: { ...state.keys } }; renderer.render(scene, camera); frameId = requestAnimationFrame(loop);
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
      orbitRadius = window.innerWidth < window.innerHeight ? 17.5 : 13.5;
    };
    window.addEventListener("resize", onResize);
    const mountNode = mountRef.current;
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
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
      cancelAnimationFrame(frameId);
      audioMgr.dispose();
      if (audioManagerRef.current === audioMgr) {
        audioManagerRef.current = null;
      }
      renderer.dispose();
      if (mountNode) mountNode.removeChild(renderer.domElement);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const showTouchControls =
    inputPreference === "touch" ||
    (inputPreference === "auto" && (isMobileUI || hasTouchInput || detectedDevice === "phone" || detectedDevice === "tablet"));

  const mpPeerCount = mpRoom ? Object.keys(mpRoom.players).length : 0;

  return (
    <div className="w-full h-full relative touch-none select-none overflow-hidden">
      <div ref={mountRef} className="w-full h-full" />

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
        <div className="fixed top-3 left-3 z-20 bg-neutral-950/85 backdrop-blur-md border border-white/15 rounded-xl px-3.5 py-2 text-white pointer-events-none">
          <div className="text-[11px] font-black uppercase tracking-wider text-cyan-300">
            Drill {trainingDrill.made}/{trainingDrill.target} · Done {trainingDrill.completedCount}
          </div>
        </div>
      )}

      <AnimatePresence>{message.visible && <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-[18%] left-0 right-0 text-center pointer-events-none z-30 font-black italic text-5xl sm:text-6xl uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)]" style={{ color: message.color }}>{message.text}</motion.div>}</AnimatePresence>
      <AnimatePresence>{label.visible && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-[30%] left-0 right-0 text-center pointer-events-none z-30 text-xl sm:text-2xl font-black tracking-widest text-amber-300 italic uppercase drop-shadow">{label.text}</motion.div>}</AnimatePresence>
      {showMeter && <div className="absolute bottom-44 left-1/2 -translate-x-1/2 w-72 sm:w-80 h-5 bg-black/80 rounded-full border border-white/25 overflow-hidden pointer-events-none"><div className="h-full bg-gradient-to-r from-red-600 via-green-400 to-red-600" style={{ width: `${meterFill}%` }} /><div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white" /></div>}

      {/* Interactive "TAKE / STEAL BALL" Button when loose or at hoop */}
      <AnimatePresence>
        {isBallLoose && !showHighlights && !showMainMenu && (
          <motion.button
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            onClick={handlePickUpBall}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40 min-h-[48px] px-6 py-3 bg-amber-400 hover:bg-amber-300 text-black font-black uppercase tracking-wider text-sm rounded-xl border border-yellow-100 shadow-xl active:scale-95 flex items-center gap-2 pointer-events-auto cursor-pointer"
          >
            <span>Take / Steal Ball [Space / E / Tap]</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Auto-Responsive Multi-Touch Controls for Phone / Tablet / Touchscreen */}
      {showTouchControls && !showHighlights && !showMainMenu && (
        <>
          <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] z-40">
            <Joystick
              onChange={(x: number, y: number, active: boolean, autoSprint: boolean) => {
                if (gameRef.current) {
                  gameRef.current.state.joystick = { x, y, active, autoSprint };
                }
              }}
            />
          </div>
          <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))] grid grid-cols-3 gap-2 sm:gap-3 z-40">
            <ActionButton label="Sprint" icon="RT" color="bg-orange-600" onStateChange={(s: boolean) => { if(gameRef.current) gameRef.current.state.touchButtons.RT = s; }} />
            <ActionButton label="Shot" icon="A" color="bg-red-600" onStateChange={(s: boolean) => { if(gameRef.current) gameRef.current.state.touchButtons.A = s; }} />
            <ActionButton label="Pass" icon="B" color="bg-blue-600" onStateChange={(s: boolean) => { if(gameRef.current) gameRef.current.state.touchButtons.B = s; }} />
            <ActionButton label="Cross" icon="X" color="bg-purple-600" onStateChange={(s: boolean) => { if(gameRef.current) gameRef.current.state.touchButtons.X = s; }} />
            <ActionButton label="Dunk" icon="Y" color="bg-yellow-600" onStateChange={(s: boolean) => { if(gameRef.current) gameRef.current.state.touchButtons.Y = s; }} />
            <ActionButton label="Def" icon="LT" color="bg-neutral-700" onStateChange={(s: boolean) => { if(gameRef.current) gameRef.current.state.touchButtons.LT = s; }} />
          </div>
        </>
      )}

      {/* Single Discreet Main Menu Button on Court (Zero Distractions) */}
      <div className="fixed top-[max(0.65rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-30 pointer-events-auto">
        <button
          onClick={() => setShowMainMenu(true)}
          aria-label="Open Main Menu"
          className="min-h-[40px] sm:min-h-[44px] px-3 sm:px-4 py-1.5 sm:py-2 bg-neutral-950/85 hover:bg-amber-500 hover:text-black backdrop-blur-md text-white font-black uppercase text-xs tracking-wider rounded-xl border border-white/20 hover:border-amber-300 shadow-lg transition-colors flex items-center gap-1.5 sm:gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <Menu className="w-4 h-4" />
          <span className="hidden xs:inline sm:inline">Menu</span>
        </button>
      </div>

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
        onJoinRoom={async (code, preferredTeam) => {
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
          });
        }}
        onCreateRoom={async () => {
          if (!mpClientRef.current) return;
          await mpClientRef.current.createAndJoinRoom({
            name: `${athleteProfile.firstName} ${athleteProfile.lastName}`,
            deviceType: detectedDevice,
            jerseyColor: athleteProfile.jerseyColorHex,
            shortsColor: athleteProfile.shortsColorHex,
            cityId: selectedCity.id,
            mode: gameMode,
          });
        }}
        onLeaveRoom={async () => {
          if (!mpClientRef.current) return;
          await mpClientRef.current.leaveRoom();
          mpRoomRef.current = null;
          setMpRoom(null);
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
        onSelectGameMode={(mode) => handleSelectGameMode(mode, true)}
        onOpenWorldTour={() => setShowWorldTour(true)}
        onOpenCreateAthlete={() => setShowCreateAthlete(true)}
        onOpenDraft={() => setShowDraftModal(true)}
        onOpenLockerRoom={() => setShowLockerRoom(true)}
        onOpenMovebook={() => setShowMovebook(true)}
        onOpenControls={() => setShowHelp(true)}
        onOpenFeatures={() => setShowFeaturesModal(true)}
        onOpenMultiplayer={() => setShowMultiplayer(true)}
        onOpenHighlights={handleOpenHighlightsFromMenu}
        onCallTimeout={callTimeout}
        onEndQuarterNow={handleEndQuarterNow}
        onEndGame={() => {
          if (gameRef.current?.endMatch) gameRef.current.endMatch();
        }}
        audioSettings={audioSettings}
        onChangeAudioSettings={handleChangeAudioSettings}
      />

      {/* Offense & Defense Movebook Modal */}
      <MovebookModal
        isOpen={showMovebook}
        onClose={() => setShowMovebook(false)}
        onExecuteMove={handleExecuteMove}
        activeOffensePlay={activeOffensePlay}
        activeDefenseScheme={activeDefenseScheme}
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
                  Offense &amp; Defense Controls
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm font-bold">
                  <div>Move / Slide</div><div>WASD / Arrows / Touch Stick</div>
                  <div>Sprint</div><div>Shift / RT Button</div>
                  <div>Shot / Fadeaway</div><div>Space / A Button</div>
                  <div>Dunk / Reverse</div><div>I / Y Button</div>
                  <div>Cross / Hop / Stepback</div><div>U / X Button</div>
                  <div>Behind-Back / Closeout</div><div>C</div>
                  <div>Hesitation / Hook Shot</div><div>H</div>
                  <div>Spin Move / Drop Step</div><div>V</div>
                  <div>Pump Fake / Jab Step</div><div>J</div>
                  <div>Pass / Lob Pass</div><div>K / L / B Button</div>
                  <div>Block / Box Out / Shield</div><div>G / LT Button</div>
                  <div>Steal / Poke Reach</div><div>E / LT Button</div>
                  <div>Call Plays (PnR / Cuts)</div><div>1 - 6 / Movebook</div>
                  <div>Sub Bench</div><div>Q / LB / Timeout</div>
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
      />

      {/* 2K Official Features & Modes Modal Directory */}
      <NBAFeaturesModal
        isOpen={showFeaturesModal}
        onClose={() => setShowFeaturesModal(false)}
        onSelectFeatureMode={(featId) => {
          if (featId === "mycareer") {
            setShowCreateAthlete(true);
          } else if (featId === "myteam" || featId === "seasons") {
            setShowLockerRoom(true);
          } else if (featId === "play_now" || featId === "the_city" || featId === "the_w") {
            setShowWorldTour(true);
          } else if (featId === "learn_2k") {
            handleSelectGameMode("training", false);
          } else if (featId === "gameplay_engine") {
            setShowMovebook(true);
          } else if (featId === "mynba") {
            callTimeout();
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
      />
    </div>
  );
}

function ActionButton({ label, icon, color, onStateChange }: { label: string, icon: string, color: string, onStateChange: (s: boolean) => void }) {
  const activePointerId = useRef<number | null>(null);
  const handleDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    activePointerId.current = e.pointerId;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    onStateChange(true);
  };
  const handleUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (activePointerId.current === null || e.pointerId === activePointerId.current) {
      activePointerId.current = null;
      onStateChange(false);
    }
  };
  return (
    <div className="flex flex-col items-center gap-1 select-none touch-none">
      <button
        type="button"
        onPointerDown={handleDown}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white font-black text-base sm:text-lg shadow-xl active:scale-90 transition-transform ${color} border-2 border-white/25 touch-none select-none cursor-pointer`}
      >
        {icon}
      </button>
      <span className="text-[9px] font-bold uppercase text-white/75">{label}</span>
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
      className="w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center touch-none select-none cursor-pointer"
    >
      <div
        ref={ringRef}
        className="w-28 h-28 sm:w-32 sm:h-32 bg-white/10 backdrop-blur-xl rounded-full border-2 border-white/25 flex items-center justify-center relative pointer-events-none transition-colors"
      >
        <div
          ref={handleRef}
          className="w-12 h-12 sm:w-14 sm:h-14 bg-white/45 rounded-full border-2 border-white/60 shadow-2xl pointer-events-none will-change-transform"
        />
      </div>
    </div>
  );
}
