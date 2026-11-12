"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Keyboard, Gamepad2, Info, Trophy, Sparkles, Shirt, Flag, Globe, Timer, MapPin, Menu, Tv, Play, Flame, Shield, X, ChevronRight } from "lucide-react";
import LockerRoomModal from "./LockerRoomModal";
import TimeoutModal, { TacticalSettings } from "./TimeoutModal";
import WorldTourMenu from "./WorldTourMenu";
import NBAFeaturesModal from "./NBAFeaturesModal";
import { WORLD_CITIES, WorldCity } from "@/lib/worldTour";
import {
  loadCareerStats,
  recordMatchToCareer,
  CareerStats,
  calculateLevel,
  JERSEY_ITEMS,
  SNEAKER_ITEMS,
  HEADBAND_ITEMS,
  ProgressionItem,
} from "@/lib/progression";

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
  const [shotClock, setShotClock] = useState(24);
  const [gameClock, setGameClock] = useState(720); // 12 minutes in seconds
  const [quarter, setQuarter] = useState(1);
  const [message, setMessage] = useState({ text: "", color: "#fff", visible: false });
  const [label, setLabel] = useState({ text: "", visible: false });
  const [showMeter, setShowMeter] = useState(false);
  const [meterFill, setMeterFill] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [isBallLoose, setIsBallLoose] = useState(false);
  const isBallLooseRef = useRef(false);
  const [finalStats, setFinalStats] = useState<any[]>([]);
  const [isMobileUI, setIsMobileUI] = useState(false);

  const handlePickUpBall = useCallback(() => {
    if (gameRef.current?.scoopBall) {
      gameRef.current.scoopBall();
    }
  }, []);

  // Player Career Progression & Customization States
  const [careerStats, setCareerStats] = useState<CareerStats>(loadCareerStats);
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
    if (gameRef.current?.applyCity) {
      gameRef.current.applyCity(city);
    }
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const initialCity = initialCityRef.current;

    // Detect mobile for UI
    setIsMobileUI("ontouchstart" in window || navigator.maxTouchPoints > 0);

    // --- SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0d12);
    scene.fog = new THREE.Fog(0x0b0d12, 35, 120);

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

    // --- LIGHTING ---
    scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(0, 30, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -20; sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 10; sun.shadow.camera.bottom = -10;
    scene.add(sun);

    // --- COURT & ARENA APRON ---
    const apronMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialCity.courtBorderColor),
      roughness: 0.6,
    });
    const apronFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(COURT_W + 16, COURT_H + 16),
      apronMat
    );
    apronFloor.rotation.x = -Math.PI / 2;
    apronFloor.position.y = -0.005;
    apronFloor.receiveShadow = true;
    scene.add(apronFloor);

    // Hardwood Court (Boundaries)
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(COURT_W, COURT_H),
      new THREE.MeshStandardMaterial({ color: 0xc68b59, roughness: 0.55 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

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

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
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

    [1, -1].forEach(side => {
      const x = 14 * side;
      line(5.8, 0.05, x - 2.9 * side, 2.45); line(5.8, 0.05, x - 2.9 * side, -2.45);
      line(0.05, 4.9, x - 5.8 * side, 0);
      ring(6.7, 6.78, x - 1.2 * side, 0, (side > 0 ? -1 : 1) * Math.PI / 2, Math.PI);
      line(3, 0.05, x - 1.5 * side, 6.6); line(3, 0.05, x - 1.5 * side, -6.6);
      
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.05, 1.8), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
      board.position.set(x - 0.4 * side, 3.45, 0);
      scene.add(board);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(RIM_R, 0.02, 12, 32), new THREE.MeshStandardMaterial({ color: 0xff6a00 }));
      rim.rotation.x = Math.PI / 2; rim.position.set(x - 1.2 * side, RIM_Y, 0);
      scene.add(rim);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.5), new THREE.MeshStandardMaterial({ color: 0x888888 }));
      pole.position.set(x + 0.1 * side, 2.25, 0);
      scene.add(pole);

      const netPts = [];
      const rimX = x - 1.2 * side;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        netPts.push(V(rimX + Math.cos(a) * RIM_R, RIM_Y, Math.sin(a) * RIM_R), V(rimX + Math.cos(a) * 0.08, RIM_Y - 0.45, Math.sin(a) * 0.08));
      }
      scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(netPts), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })));
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
    ball.castShadow = true; scene.add(ball);

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
      return { root, pelvis, torso, legs, arms, hands, jerseyMat, shortsMat, shoeMat, headbandMat, headbandMesh, logoMesh };
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
        shortsMat: H.shortsMat,
        shoeMat: H.shoeMat,
        headbandMat: H.headbandMat,
        headbandMesh: H.headbandMesh,
      };
    }

    const ME = makeEntity(0xc8102e, -10, 0, "YOU", "PG", homeLogoTex, true);
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

    // Apply initially equipped items on startup
    applyCustomization(loadCareerStats());

    // --- STATE ---
    const state = {
      owner: ME as any, ballMode: "dribble" as any, flight: null as any, 
      scoreHome: 0, scoreAway: 0, shotClock: 24, 
      gameClock: 720, quarter: 1, isGameOver: false,
      isPaused: false, pauseT: 0,
      crowdCheer: 0,
      lastPasser: null as GameEntity | null,
      lastPassTime: 0,
      hadRimContact: false,
      deadT: 0, looseT: 0, lbUsed: false, rbUsed: false, ballVel: V(),
      keys: {} as any, prevKeys: {} as any, joystick: { x: 0, y: 0, active: false }, 
      touchButtons: {} as any, lastTime: performance.now(), camLook: V(0, 1.4, 0)
    };

    // --- HELPERS ---
    const fwd = (P: any) => { const hoopX = teamA.includes(P) ? 13.6 : -13.6; const v = V(hoopX - P.root.position.x, 0, -P.root.position.z); return v.lengthSq() < 1e-6 ? V(1, 0, 0) : v.normalize(); };
    const rightOf = (P: any) => { const f = fwd(P); return V(-f.z, 0, f.x); };
    const torsoPos = (P: any) => V(P.root.position.x, P.h + 1.2, P.root.position.z);
    const handPos = (P: any) => P.hands[P.hand].getWorldPosition(V());
    const applyVel = (P: any, want: THREE.Vector3, dt: number) => { if(P.act && P.act.lock) return; P.vel.lerp(want, 1 - Math.exp(-9 * dt)); P.root.position.x = clamp(P.root.position.x + P.vel.x * dt, -13.9, 13.9); P.root.position.z = clamp(P.root.position.z + P.vel.z * dt, -7.4, 7.4); };
    const aiSteer = (P: any, tx: number, tz: number, sp: number, dt: number) => { const dx = tx - P.root.position.x, dz = tz - P.root.position.z, d = Math.hypot(dx, dz); const s = Math.min(sp, d * 2.5); applyVel(P, d > 0.01 ? V(dx/d*s, 0, dz/d*s) : V(), dt); };
    
    // --- AUDIO ---
    const Audio = (() => {
      let ctx: any = null, master: any = null, noiseBuf: any = null, voices = 0;
      function init() { if (ctx) return; ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); const comp = ctx.createDynamicsCompressor(); master = ctx.createGain(); master.gain.value = 0.25; master.connect(comp).connect(ctx.destination); noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      function squeak({ pan = 0, vol = 1 } = {}) { if (!ctx || ctx.state !== "running" || voices > 8) return; voices++; const t = ctx.currentTime; const out = ctx.createGain(); out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(0.3 * vol, t + 0.01); out.gain.exponentialRampToValueAtTime(0.001, t + 0.12); const panner = ctx.createStereoPanner(); panner.pan.value = clamp(pan, -1, 1); out.connect(panner).connect(master!); const f0 = 2800 + Math.random() * 800; const osc = ctx.createOscillator(); osc.type = "sawtooth"; osc.frequency.setValueAtTime(f0, t); osc.frequency.exponentialRampToValueAtTime(f0 * 0.6, t + 0.12); osc.start(t); osc.stop(t + 0.15); osc.onended = () => voices--; }
      function whistle() { if (!ctx || ctx.state !== "running") return; const t = ctx.currentTime; const osc = ctx.createOscillator(); osc.type = "triangle"; osc.frequency.setValueAtTime(3500, t); osc.frequency.exponentialRampToValueAtTime(3800, t + 0.1); const g = ctx.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.4); osc.connect(g).connect(master!); osc.start(t); osc.stop(t + 0.4); }
      
      let cheerNode: any = null, cheerGain: any = null;
      function startCheer() { 
        if (!ctx || cheerNode) return;
        cheerGain = ctx.createGain(); cheerGain.gain.value = 0; cheerGain.connect(master);
        const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1000;
        src.connect(lp).connect(cheerGain); src.start(); cheerNode = src;
      }
      function updateCheer(val: number) { if (cheerGain) cheerGain.gain.setTargetAtTime(clamp(val * 0.15, 0, 0.4), ctx.currentTime, 0.1); }
      
      function speak(text: string) {
        if (typeof window === "undefined" || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const ut = new SpeechSynthesisUtterance(text);
        ut.pitch = 1.1; ut.rate = 1.2; ut.volume = 0.8;
        window.speechSynthesis.speak(ut);
      }

      function dribble({ pan = 0, vol = 0.6 } = {}) {
        if (!ctx || ctx.state !== "running") return;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const panner = ctx.createStereoPanner();
        panner.pan.value = clamp(pan, -1, 1);
        osc.type = "sine";
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);
        g.gain.setValueAtTime(0.7 * vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(g).connect(panner).connect(master!);
        osc.start(t);
        osc.stop(t + 0.1);
      }

      function crowdScream() {
        if (!ctx || ctx.state !== "running") return;
        const t = ctx.currentTime;
        const src = ctx.createBufferSource();
        src.buffer = noiseBuf;
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(900, t);
        filter.frequency.exponentialRampToValueAtTime(2500, t + 0.3);
        filter.Q.value = 2.5;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.5, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

        src.connect(filter).connect(gain).connect(master!);
        src.start(t);
        src.stop(t + 1.25);
      }

      function netSwish() {
        if (!ctx || ctx.state !== "running") return;
        const t = ctx.currentTime;
        const src = ctx.createBufferSource();
        src.buffer = noiseBuf;
        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 3200;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        src.connect(filter).connect(gain).connect(master!);
        src.start(t);
        src.stop(t + 0.18);
      }

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
        unlock: () => { init(); if (ctx && ctx.state === "suspended") ctx.resume(); startCheer(); }, 
        squeak, 
        whistle,
        dribble,
        crowdScream,
        netSwish,
        updateCheer, 
        speak,
        commentary: (type: keyof typeof phrases, val?: any) => {
          const p = phrases[type];
          const text = typeof p === "function" ? p(val) : random(p as string[]);
          speak(text);
        }
      };
    })();
    const jumpAct = (P: any, name: string, dur: number) => { if (P.act || P.h > 0.05) return; P.vy = 3.4; P.act = { kind: "jump", name, t: 0, dur, lock: false, pose: (u: any, T: any) => { T.shL = T.shR = -2.5; T.elL = T.elR = -1.4; } }; };

    function triggerMsg(text: string, color = "#fff") { setMessage({ text, color, visible: true }); setTimeout(() => setMessage(m => ({ ...m, visible: false })), 1500); }
    function triggerLabel(text: string) { setLabel({ text, visible: true }); setTimeout(() => setLabel(l => ({ ...l, visible: false })), 1000); }

    function fire(P: any, from: THREE.Vector3, aim: THREE.Vector3, FT: number, type: string, ex: any = {}) {
      state.flight = { kind: type, shooter: P, passTo: ex.passTo || null, pts: ex.pts || 0, perfect: !!ex.perfect, dunk: !!ex.dunk, layup: !!ex.layup, t: 0, T: FT, rim: 0 };
      ball.position.copy(from); state.ballVel.set((aim.x - from.x) / FT, (aim.y - from.y) / FT + 0.5 * G * FT, (aim.z - from.z) / FT);
      state.owner = null; state.ballMode = "flight"; if (type === "shot") state.shotClock = 24;
    }
    function releaseShot(P: any, a: any, forced: boolean) {
      if (a.released) return; a.released = true;
      const hoopX = teamA.includes(P) ? 13.6 : -13.6;
      const d = Math.hypot(P.root.position.x - hoopX, P.root.position.z);
      const e = Math.abs((a.c || 0.5) - 0.5);
      let spread, FT, pts = d > 7.2 ? 3 : 2;
      if (a.dunk) { spread = 0.03; FT = 0.42; pts = 2; } else if (a.layup) { spread = 0.1; FT = 0.5 + d * 0.03; pts = 2; }
      else { spread = 0.05 + e * 0.85; FT = 0.8 + d * 0.045; }
      const from = handPos(P); const f = fwd(P); const aim = V(hoopX + rnd(spread), RIM_Y + rnd(spread * 0.4), rnd(spread));
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
      P.act = a; state.ballMode = "held"; P.vy = a.dunk ? 5.4 : a.stepback ? 3.5 : 4.6; if (P.isUser) triggerLabel(a.name); return a;
    }
    function performFoul(defender: GameEntity, attacker: GameEntity) {
      if (state.deadT > 0) return;
      defender.stats.fouls++;
      triggerMsg("FOUL!", "#ff0000");
      Audio.whistle();
      Audio.commentary("foul");
      state.ballMode = "dead"; state.deadT = 1.5; state.ballVel.set(0,0,0);
      state.owner = attacker;
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

    // --- APPLY WORLD TOUR CITY ARENA & TEAMS ---
    const applyCity = (city: WorldCity) => {
      if (apronMat) {
        apronMat.color.setStyle(city.courtBorderColor);
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

    // --- END MATCH & RECORD PROGRESSION ---
    const endGameAndRecordStats = () => {
      if (state.isGameOver) return;
      state.isGameOver = true;
      triggerMsg("GAME OVER", "#ef476f");
      Audio.commentary("gameover");
      const stats = entities.map((p) => ({
        name: p.name,
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
        won: state.scoreHome > state.scoreAway,
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

      setTimeout(() => setShowSummary(true), 1500);
    };

    const scoopBall = () => {
      ME.root.position.x = clamp(ball.position.x - (ball.position.x > 0 ? 0.3 : -0.3), -13.5, 13.5);
      ME.root.position.z = clamp(ball.position.z, -7.0, 7.0);
      state.owner = ME;
      state.ballMode = "dribble";
      state.ballVel.set(0, 0, 0);
      isBallLooseRef.current = false;
      setIsBallLoose(false);
      triggerLabel("PICKED UP BALL!");
      Audio.squeak({ pan: 0, vol: 0.9 });
      Audio.dribble({ pan: 0, vol: 0.9 });
      Audio.crowdScream();
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
      applyCity,
      substitute,
      Audio,
      triggerMsg,
      triggerLabel,
      scoopBall,
      endMatch: endGameAndRecordStats,
    };

    // --- LOOP ---
    let frameId: number; let prevInput: any = {};
    const onKeyDown = (e: any) => { state.keys[e.code] = true; Audio.unlock(); };
    const onKeyUp = (e: any) => { state.keys[e.code] = false; };
    window.addEventListener("keydown", onKeyDown); window.addEventListener("keyup", onKeyUp);

    const loop = (now: number) => {
      if (state.isGameOver) return;
      const dt = Math.min((now - state.lastTime) / 1000, 0.05); state.lastTime = now;
      
      Audio.updateCheer(state.crowdCheer);

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

      // HUD Update logic (optimized to prevent unnecessary re-renders)
      const nextClock = Math.max(0, Math.ceil(state.shotClock)); if (nextClock !== lastClockRef.current) { setShotClock(nextClock); lastClockRef.current = nextClock; }
      
      state.gameClock -= dt;
      if (state.gameClock <= 0) {
        state.gameClock = 0;
        if (state.quarter < 4) {
          state.quarter++;
          state.gameClock = 720;
          setQuarter(state.quarter);
          triggerMsg(`QUARTER ${state.quarter}`, "#ffd166");
          Audio.commentary("quarter", state.quarter);
        } else {
          endGameAndRecordStats();
        }
      }
      setGameClock(Math.ceil(state.gameClock));

      if (ME.act && ME.act.kind === "shot" && !ME.act.released && !ME.act.auto && !ME.act.layup && !ME.act.dunk) { setShowMeter(true); setMeterFill((ME.act.c || 0.5) * 100); } else setShowMeter(false);

      const pads = navigator.getGamepads ? navigator.getGamepads() : []; let gp = pads[0];
      const b = (i: number) => !!(gp && gp.buttons[i]?.pressed); const ax = (i: number) => (gp && Math.abs(gp.axes[i]) > 0.15) ? gp.axes[i] : 0;
      const k = (c: string) => !!state.keys[c]; const tb = (c: string) => !!state.touchButtons[c];
      const input = {
        A: b(0) || k("Space") || tb("A"), B: b(1) || k("KeyK") || tb("B"), X: b(2) || k("KeyU") || tb("X"), Y: b(3) || k("KeyI") || tb("Y"),
        LB: b(4) || k("KeyQ") || tb("LB"), RB: b(5) || k("KeyE") || tb("RB"), LT: b(6) || k("KeyZ") || tb("LT"), RT: b(7) || k("ShiftLeft") || tb("RT"),
        mx: clamp(ax(0) + (k("KeyD")?1:0) - (k("KeyA")?1:0) + (state.joystick.active?state.joystick.x:0), -1, 1),
        my: clamp(ax(1) + (k("KeyS")?1:0) - (k("KeyW")?1:0) + (state.joystick.active?state.joystick.y:0), -1, 1)
      };
      const edge = (k: keyof typeof input) => !!input[k] && !prevInput[k];

      const scoopBall = () => {
        ME.root.position.x = clamp(ball.position.x - (ball.position.x > 0 ? 0.3 : -0.3), -13.5, 13.5);
        ME.root.position.z = clamp(ball.position.z, -7.0, 7.0);
        state.owner = ME;
        state.ballMode = "dribble";
        state.ballVel.set(0, 0, 0);
        isBallLooseRef.current = false;
        setIsBallLoose(false);
        triggerLabel("PICKED UP BALL!");
        Audio.squeak({ pan: 0, vol: 0.9 });
        Audio.dribble({ pan: 0, vol: 0.9 });
        Audio.crowdScream();
      };

      // USER
      const sp = 4.8 * (input.RT ? 1.4 : 1);
      const wantVel = V(-input.my * sp, 0, -input.mx * sp);
      applyVel(ME, wantVel, dt);
      if ((edge("A") || k("KeyF")) && (state.ballMode === "loose" || !state.owner)) {
        scoopBall();
      } else if (edge("A") && state.owner === ME) {
        const hoopX = teamA.includes(ME) ? 13.6 : -13.6;
        const toHoop = hoopX - ME.root.position.x;
        const isMovingAway = (toHoop > 0 && input.mx < -0.3) || (toHoop < 0 && input.mx > 0.3);
        if (isMovingAway) startShot(ME, { name: "FADEAWAY", stepback: true, dur: 1.5 });
        else startShot(ME);
      }
      if (!input.A && prevInput.A && ME.act?.kind === "shot" && !ME.act.released && !ME.act.auto) releaseShot(ME, ME.act, false);
      if (edge("Y") && state.owner === ME) startShot(ME, { dunk: true, name: "SLAM DUNK" });
      if (edge("X") && state.owner === ME) {
        const speed = Math.hypot(input.mx, input.my);
        if (speed > 0.5) {
          // Check direction relative to hoop
          const hoopX = teamA.includes(ME) ? 13.6 : -13.6;
          const toHoop = hoopX - ME.root.position.x;
          const isMovingToHoop = (toHoop > 0 && input.mx > 0.3) || (toHoop < 0 && input.mx < -0.3);
          
          if (isMovingToHoop) {
            // Hop Step
            ME.vy = 2.5;
            ME.vel.addScaledVector(fwd(ME), 6);
            triggerLabel("HOP STEP");
          } else {
            // Step Back
            startShot(ME, { stepback: true, name: "STEP BACK", dur: 1.4 });
          }
        } else {
          // Crossover / Jab
          ME.act = { kind: "cross", name: "CROSSOVER", t: 0, dur: 0.4, pose: (u: any, T: any) => { T.lean = 0.2; T.shR = -1.5; T.elR = -1; } };
          triggerLabel("CROSSOVER");
        }
      }
      if (edge("B") && state.owner === ME) {
        const target = teamA.find(p => !p.isBench && p !== ME); 
        if (target) {
          state.lastPasser = ME;
          state.lastPassTime = now;
          fire(ME, handPos(ME), torsoPos(target), 0.4, "pass", { passTo: target });
        }
      }
      if (edge("LB")) {
        const benchIdx = teamA.findIndex(p => p.isBench);
        const activeIdx = teamA.findIndex(p => !p.isBench && p !== ME);
        if (benchIdx !== -1 && activeIdx !== -1) substitute(teamA, benchIdx, activeIdx);
      }

      // AI
      const isTeamA = state.owner ? teamA.includes(state.owner) : true;
      const currentTactics = tacticsRef.current;

      teamA.forEach((P, i) => {
        if(P.isBench || P.isUser) return;
        if(state.owner === P) {
          P.holdT += dt;
          if(!P.act) {
            aiSteer(P, 12, rnd(2), 2.5, dt);
            if(P.holdT > 1.5) startShot(P, { auto: true, stepback: Math.random() < 0.2, name: Math.random() < 0.2 ? "STEP BACK" : "JUMP SHOT" });
          }
        } else if(isTeamA) {
          // Offense Tactical Sets
          if (currentTactics.offense === "pace_space") {
            aiSteer(P, 5 + (i % 2) * 2, (i - 2) * 5.2, 4.2, dt);
          } else if (currentTactics.offense === "paint_power") {
            aiSteer(P, i >= 3 ? 12.5 : 7, (i - 2) * 2.2, 4.8, dt);
          } else if (currentTactics.offense === "fast_break") {
            aiSteer(P, 11.5, (i % 2 === 0 ? 5.5 : -5.5), 5.5, dt);
          } else {
            // Pick and roll: Center sets high screen near user
            if (i === 4 && state.owner === ME) {
              aiSteer(P, ME.root.position.x + 1.2, ME.root.position.z + 0.4, 4.5, dt);
            } else {
              aiSteer(P, 8, (i-2)*4, 4, dt);
            }
          }
        } else {
          // Defense Tactical Schemes for Team A
          if (currentTactics.defense === "zone") {
            const zoneX = -10.5 + (i < 2 ? 2.5 : 0);
            const zoneZ = i === 0 ? -2.5 : i === 1 ? 2.5 : (i - 3) * 2.2;
            aiSteer(P, zoneX, zoneZ, 4.5, dt);
          } else if (currentTactics.defense === "press") {
            const opp = teamB[i];
            if (opp && !opp.isBench) {
              aiSteer(P, opp.root.position.x + 0.5, opp.root.position.z, 5.2, dt);
            } else {
              aiSteer(P, 0, (i - 2) * 3, 5, dt);
            }
          } else {
            aiSteer(P, -8, (i-2)*3, currentTactics.defense === "conservative" ? 3.8 : 5, dt);
          }
        }
      });

      teamB.forEach((P, i) => {
        if(P.isBench) return;
        if(state.owner === P) {
          P.holdT += dt;
          if(!P.act) {
            aiSteer(P, -12, rnd(2), 2.8, dt);
            if(P.holdT > 1.6) startShot(P, { auto: true, stepback: Math.random() < 0.2, name: Math.random() < 0.2 ? "STEP BACK" : "JUMP SHOT" });
          }
        } else if(!isTeamA) {
          aiSteer(P, -8, (i-2)*4, 4.2, dt);
        } else {
          const t = teamA.find(p => !p.isBench && teamA.indexOf(p) === i);
          if(t) aiSteer(P, t.root.position.x+fwd(t).x*1.2, t.root.position.z+fwd(t).z*1.2, 4.8, dt);
        }
      });

      // DEFENSE / FOULS / STEALS
      if (state.owner && state.ballMode === "dribble") {
        const owner = state.owner;
        const opponentTeam = teamA.includes(owner) ? teamB : teamA;
        const isTeamADefending = !teamA.includes(owner);
        let stealRadius = 0.8;
        let stealProb = 0.01 * dt * 60;
        let foulProb = 0.2;

        if (isTeamADefending) {
          if (currentTactics.defense === "press") {
            stealRadius = 1.3;
            stealProb = 0.025 * dt * 60;
            foulProb = 0.35;
          } else if (currentTactics.defense === "conservative") {
            stealRadius = 0.6;
            stealProb = 0.003 * dt * 60;
            foulProb = 0.0;
          } else if (currentTactics.defense === "zone") {
            stealRadius = 0.7;
            stealProb = 0.007 * dt * 60;
            foulProb = 0.15;
          }
        }

        opponentTeam.forEach(opp => {
          if (opp.isBench) return;
          const dist = opp.root.position.distanceTo(owner.root.position);
          if (dist < stealRadius) {
            if (Math.random() < stealProb) {
              if (Math.random() < foulProb) performFoul(opp, owner);
              else {
                state.owner = opp;
                triggerMsg("STEAL!", "#337733");
                Audio.commentary("steal");
              }
            }
          }
        });
      }

      // PHYSICS
      entities.forEach(P => {
        if(P.isBench) return;
        if(P.act) { P.act.t += dt; if(P.act.update) P.act.update(); if(P.act.t >= P.act.dur) { if(P.act.end) P.act.end(); P.act = null; } }
        if(P.h > 0 || P.vy > 0) { P.vy -= G*dt; P.h += P.vy*dt; if(P.h <= 0) { P.h = 0; P.vy = 0; } }
        const sp = Math.hypot(P.vel.x, P.vel.z); P.runPhase += dt * sp * 2.4; const fa = fwd(P); P.faceYaw = Math.atan2(fa.x, fa.z);
        const T: any = { shR: -0.25, elR: -0.5, shL: -0.25, elL: -0.5, hipR: 0, kneeR: 0.05, hipL: 0, kneeL: 0.05, lean: 0, crouch: 0 };
        if(P.h > 0.03) { T.hipR = T.hipL = -0.45; T.kneeR = T.kneeL = 0.75; } else if(sp > 0.4) { const s = Math.sin(P.runPhase); T.hipR = s*0.55; T.hipL = -s*0.55; T.kneeR = 0.15+Math.max(0,-s)*0.7; T.kneeL = 0.15+Math.max(0,s)*0.7; T.lean = 0.12; }
        if(state.owner === P && state.ballMode === "dribble" && !P.act) { const k = P.hand, o = k === "R" ? "L" : "R"; T["sh"+k] = -0.45; T["el"+k] = -1.05; T["sh"+o] = -0.9; T["el"+o] = -1.5; T.lean = 0.1; }
        if(P.act?.pose) P.act.pose(clamp(P.act.t/P.act.dur, 0, 1), T); const k_ = Math.min(1, dt*16); for(const key in T) (P.cur as any)[key] += ((T as any)[key] - (P.cur as any)[key]) * k_;
        const c = P.cur, L = P.legs, A = P.arms; L.R.hip.rotation.x = c.hipR; L.R.knee.rotation.x = c.kneeR; L.L.hip.rotation.x = c.hipL; L.L.knee.rotation.x = c.kneeL; A.R.sh.rotation.x = c.shR; A.R.el.rotation.x = c.elR; A.L.sh.rotation.x = c.shL; A.L.el.rotation.x = c.elL; P.torso.rotation.x = c.lean; P.pelvis.position.y = 0.95-c.crouch; P.root.position.y = P.h; P.root.rotation.y = P.faceYaw;

        // SQUEAKS
        if (!P.squeak) P.squeak = { prevVel: V(), cool: 0 };
        P.squeak.cool -= dt;
        const speed = Math.hypot(P.vel.x, P.vel.z);
        const prevSpeed = Math.hypot(P.squeak.prevVel.x, P.squeak.prevVel.z);
        if (P.squeak.cool <= 0 && speed > 3 && prevSpeed > speed * 1.5) {
          const pan = clamp(P.root.position.z / 7.5, -1, 1);
          Audio.squeak({ pan, vol: clamp(speed / 5, 0.2, 1) });
          P.squeak.cool = 0.2 + Math.random() * 0.2;
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
        if(p.x < -14 || p.x > 14) { if(p.y > 2.9 && p.y < 4 && Math.abs(p.z) < 0.9) { state.ballVel.x *= -0.5; p.x = p.x < 0 ? -13.9 : 13.9; } }
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
            triggerMsg(state.flight.dunk ? "SLAM DUNK" : state.flight.layup ? "LAYUP" : "SWISH", isHome ? "#ef476f" : "#1d428a"); 
            
            if (state.flight.dunk) { Audio.commentary("dunk"); Audio.crowdScream(); }
            else if (state.flight.layup) { Audio.commentary("layup"); Audio.crowdScream(); }
            else if (state.flight.pts === 3) { Audio.commentary("three"); Audio.crowdScream(); }
            else { Audio.commentary("swish"); Audio.netSwish(); Audio.crowdScream(); }

            state.ballMode = "dead"; state.deadT = 1.4; state.ballVel.set(0,0,0); state.shotClock = 24; state.flight = null;
            state.crowdCheer = 3.0; // SCREAMING CHEER!
          } else if (d < RIM_R + 0.1 && state.flight.rim < 3) { 
            state.flight.rim++; p.y = RIM_Y+0.02; state.ballVel.y = 1.5; state.ballVel.x += dx*2; 
            state.hadRimContact = true;
            if (state.flight.rim === 1 && Math.random() < 0.3) Audio.commentary("block"); // Pretend it was contested
          }
        }
        if(p.y < BALL_R) { p.y = BALL_R; if(state.ballVel.y < -1.2) { state.ballVel.y *= -0.5; if(state.flight?.kind === "shot") { state.flight = null; state.ballMode = "loose"; triggerMsg("MISS", "#ef476f"); state.crowdCheer = Math.max(state.crowdCheer, 0.5); Audio.commentary("miss"); } } else state.ballVel.y = 0; state.ballVel.multiplyScalar(0.98); }
      };
      if(state.ballMode === "dribble" && state.owner) {
        const P = state.owner;
        const prevBounce = Math.abs(Math.cos(P.dribPhase));
        P.dribPhase += dt * 8;
        const bounce = Math.abs(Math.cos(P.dribPhase));
        if (prevBounce > 0.8 && bounce <= 0.8) {
          const pan = clamp(P.root.position.z / 7.5, -1, 1);
          Audio.dribble({ pan, vol: 0.65 });
        }
        const hp = handPos(P);
        ball.position.set(hp.x, BALL_R + Math.max(0, hp.y-BALL_R)*bounce, hp.z);
      }
      else if(state.ballMode === "held" && state.owner) { const hp = handPos(state.owner); ball.position.set(hp.x, hp.y+0.03, hp.z); }
      else { for(let i=0; i<4; i++) stepBall(dt/4); if(state.ballMode === "dead") { state.deadT -= dt; if(state.deadT <= 0) { state.owner = ME; state.ballMode = "dribble"; state.ballVel.set(0,0,0); } } }
      if(state.flight) {
        if(state.flight.kind === "pass") { const t = state.flight.passTo; if(ball.position.distanceTo(torsoPos(t)) < 0.6) { state.owner = t; state.ballMode = "dribble"; state.flight = null; if(t.isUser) triggerLabel("GOT IT"); } }
        else if(state.flight.t > 5) { state.flight = null; state.ballMode = "loose"; }
      }
      if(state.ballMode === "loose" && ball.position.y < 0.5) { 
        let best: GameEntity | null = null, bd = 1.2; 
        const teamARebMax = tacticsRef.current.defense === "zone" ? 1.7 : 1.2;
        entities.forEach(P => {
          if(P.isBench) return;
          const maxDist = teamA.includes(P) ? teamARebMax : 1.2;
          const d = Math.hypot(P.root.position.x-ball.position.x, P.root.position.z-ball.position.z);
          if(d < maxDist && (!best || d < bd)) {
            bd = d;
            best = P;
          }
        }); 
        if(best) { 
          if (state.hadRimContact) {
            (best as GameEntity).stats.reb++;
            state.hadRimContact = false;
          }
          state.owner = best; state.ballMode = "dribble"; state.looseT = 0; if((best as GameEntity).isUser) triggerLabel("BALL!"); 
        } 
      }

      // Track if ball is loose on floor for UI Pick Up Ball button
      const looseNow = state.ballMode === "loose" || (!state.owner && ball.position.y < 0.9);
      if (looseNow !== isBallLooseRef.current) {
        isBallLooseRef.current = looseNow;
        setIsBallLoose(looseNow);
      }

      state.shotClock -= dt; if(state.shotClock <= 0) { state.shotClock = 24; if(state.owner) { state.owner = teamA.includes(state.owner) ? teamB[0] : teamA[0]; state.ballMode = "dribble"; triggerMsg("SHOT CLOCK", "#ffd166"); } }

      // CAMERA
      const focusX = state.owner ? state.owner.root.position.x : ball.position.x;
      const camTarget = V(focusX + 12, 12, (state.owner ? state.owner.root.position.z : ball.position.z) * 0.5);
      camera.position.lerp(camTarget, 1-Math.exp(-3*dt)); state.camLook.lerp(V(focusX, 0, (state.owner ? state.owner.root.position.z : ball.position.z) * 0.5), 1-Math.exp(-3*dt)); camera.lookAt(state.camLook);

      prevInput = { ...input }; renderer.render(scene, camera); frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);

    const onResize = () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); };
    window.addEventListener("resize", onResize);
    const mountNode = mountRef.current;
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); window.removeEventListener("resize", onResize); cancelAnimationFrame(frameId); renderer.dispose(); if (mountNode) mountNode.removeChild(renderer.domElement); };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="w-full h-full relative touch-none select-none overflow-hidden">
      <div ref={mountRef} className="w-full h-full" />

      {/* NBA 2K Television Broadcast Scoreboard HUD */}
      <div className="absolute top-3 left-4 right-4 flex justify-between items-start pointer-events-none z-20">
        {/* Left: Home Score Panel */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-red-950/90 via-black/90 to-black/80 backdrop-blur-xl px-5 py-2.5 rounded-2xl border-2 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.25)]">
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center font-black text-white text-xs border border-white/20 shadow-md">
            HOM
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black tracking-widest text-red-400">Home Franchise</span>
            <span className="text-4xl font-black text-white tabular-nums leading-none">{scoreHome}</span>
          </div>
        </div>

        {/* Center: 2K Broadcast Clock Hub */}
        <div className="flex flex-col items-center gap-1.5 bg-gradient-to-b from-neutral-900/95 via-black/95 to-neutral-950/95 backdrop-blur-2xl px-6 py-2 rounded-2xl border-2 border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.25)]">
          <div className="flex items-center gap-4">
            {/* 2K Badge */}
            <div className="px-2 py-0.5 rounded bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-[10px] tracking-tighter">
              2K HD
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase font-black tracking-widest text-white/40">Quarter</span>
              <span className="text-xl font-black text-amber-400">{quarter}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-center min-w-[85px]">
              <span className="text-[9px] uppercase font-black tracking-widest text-white/40">Game Clock</span>
              <span className="text-3xl font-black text-yellow-300 tabular-nums">{formatTime(gameClock)}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-center min-w-[50px]">
              <span className="text-[9px] uppercase font-black tracking-widest text-white/40">Shot</span>
              <span className={`text-2xl font-black tabular-nums transition-colors ${shotClock <= 5 ? "text-red-500 animate-pulse" : "text-yellow-400"}`}>
                {shotClock}
              </span>
            </div>
          </div>
          {/* Active Arena & City Badge */}
          <div className="flex items-center gap-1.5 pt-1 border-t border-white/10 w-full justify-center">
            <MapPin className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] font-black uppercase text-white/90 tracking-wider truncate max-w-[220px]">
              {selectedCity.name} • {selectedCity.arenaName}
            </span>
            <span className="text-xs">{selectedCity.flag}</span>
          </div>
        </div>

        {/* Right: Away Score Panel */}
        <div
          className="flex items-center gap-3 bg-gradient-to-l from-cyan-950/90 via-black/90 to-black/80 backdrop-blur-xl px-5 py-2.5 rounded-2xl border-2 border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.25)]"
        >
          <div className="flex flex-col items-right text-right">
            <span className="text-[10px] uppercase font-black tracking-widest text-cyan-400 truncate max-w-[110px]">{selectedCity.name}</span>
            <span className="text-4xl font-black text-white tabular-nums leading-none">{scoreAway}</span>
          </div>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs border border-white/20 shadow-md shrink-0"
            style={{ backgroundColor: selectedCity.jerseyPrimary }}
          >
            {selectedCity.flag}
          </div>
        </div>
      </div>

      <AnimatePresence>{message.visible && <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-[20%] left-0 right-0 text-center pointer-events-none z-30 font-black italic text-7xl uppercase drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]" style={{ color: message.color }}>{message.text}</motion.div>}</AnimatePresence>
      <AnimatePresence>{label.visible && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-[34%] left-0 right-0 text-center pointer-events-none z-30 text-2xl font-black tracking-widest text-amber-300 italic uppercase drop-shadow">{label.text}</motion.div>}</AnimatePresence>
      {showMeter && <div className="absolute bottom-48 left-1/2 -translate-x-1/2 w-80 h-6 bg-black/80 rounded-full border-2 border-white/20 overflow-hidden"><div className="h-full bg-gradient-to-r from-red-600 via-green-400 to-red-600" style={{ width: `${meterFill}%` }} /><div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white" /></div>}

      {/* Interactive "PICK UP THE BALL" Button */}
      <AnimatePresence>
        {isBallLoose && (
          <motion.button
            initial={{ scale: 0.8, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 30, opacity: 0 }}
            onClick={handlePickUpBall}
            className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-50 px-8 py-3.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-black font-black italic uppercase tracking-wider text-base sm:text-lg rounded-2xl border-2 border-yellow-100 shadow-[0_0_50px_rgba(245,158,11,0.7)] animate-bounce active:scale-95 flex items-center gap-2.5 pointer-events-auto cursor-pointer"
          >
            <span className="text-2xl">🏀</span>
            <span>PICK UP THE BALL</span>
            <span className="text-[10px] bg-black/20 text-black px-2 py-0.5 rounded-full font-sans not-italic font-bold">
              [SPACE / TAP]
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Live 2K Sports Bottom Marquee Ticker */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-black/90 border-t border-amber-500/30 backdrop-blur-md z-20 overflow-hidden pointer-events-none flex items-center">
        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black px-3 py-1 font-black text-[10px] uppercase tracking-widest shrink-0 z-30 flex items-center gap-1 shadow-md">
          <Tv className="w-3 h-3" />
          <span>2K SPORTS LIVE TICKER</span>
        </div>
        <div className="overflow-hidden relative w-full h-full flex items-center text-xs font-bold text-white/80 whitespace-nowrap">
          <div className="animate-ticker flex items-center gap-12">
            <span>🏀 GLOBAL HOOPS BROADCAST • TOP SCORER: KOBE B. (42.8 PPG) • REBOUND LEADER: SHAQ O. (18.5 RPG)</span>
            <span>📍 HOST ARENA: {selectedCity.arenaName.toUpperCase()} IN {selectedCity.name.toUpperCase()} ({selectedCity.country.toUpperCase()})</span>
            <span>⚡ TOUCH ANALOG JOYSTICK DRAG DRIBBLE & SQUEAKY SNEAKER SOUND EFFECTS ACTIVE</span>
            <span>🏆 UNLOCK ELITE JERSEYS & SNEAKERS IN MYCAREER LOCKER ROOM</span>
            <span>🏀 GLOBAL HOOPS BROADCAST • TOP SCORER: KOBE B. (42.8 PPG) • REBOUND LEADER: SHAQ O. (18.5 RPG)</span>
            <span>📍 HOST ARENA: {selectedCity.arenaName.toUpperCase()} IN {selectedCity.name.toUpperCase()} ({selectedCity.country.toUpperCase()})</span>
          </div>
        </div>
      </div>

      {isMobileUI && (
        <>
          <div className="absolute bottom-12 left-8 z-40"><Joystick onChange={(x: number, y: number, active: boolean) => { if(gameRef.current) gameRef.current.state.joystick = { x, y: -y, active }; }} /></div>
          <div className="absolute bottom-12 right-8 grid grid-cols-3 gap-3 z-40">
            <ActionButton label="Sprint" icon="RT" color="bg-orange-600" onStateChange={(s: boolean) => { if(gameRef.current) gameRef.current.state.touchButtons.RT = s; }} />
            <ActionButton label="Shot" icon="A" color="bg-red-600" onStateChange={(s: boolean) => { if(gameRef.current) gameRef.current.state.touchButtons.A = s; }} />
            <ActionButton label="Pass" icon="B" color="bg-blue-600" onStateChange={(s: boolean) => { if(gameRef.current) gameRef.current.state.touchButtons.B = s; }} />
            <ActionButton label="Cross" icon="X" color="bg-purple-600" onStateChange={(s: boolean) => { if(gameRef.current) gameRef.current.state.touchButtons.X = s; }} />
            <ActionButton label="Dunk" icon="Y" color="bg-yellow-600" onStateChange={(s: boolean) => { if(gameRef.current) gameRef.current.state.touchButtons.Y = s; }} />
            <ActionButton label="Def" icon="LT" color="bg-gray-600" onStateChange={(s: boolean) => { if(gameRef.current) gameRef.current.state.touchButtons.LT = s; }} />
          </div>
        </>
      )}

      {/* Top Navigation Hub Bar */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30 pointer-events-auto">
        {/* 2K Main Menu Button */}
        <button
          onClick={() => setShowMainMenu(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black uppercase text-xs tracking-wider rounded-full shadow-lg shadow-amber-500/30 transition-all active:scale-95 border border-yellow-200"
          title="Open NBA 2K Main Menu Hub"
        >
          <Menu className="w-4 h-4 stroke-[3]" />
          <span>2K Main Menu</span>
        </button>

        {/* World Tour Navigation Hub */}
        <button
          onClick={() => setShowWorldTour(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-950/80 hover:bg-cyan-900 backdrop-blur-md rounded-full border border-cyan-500/40 hover:border-cyan-400 text-xs font-black uppercase tracking-wider text-cyan-200 transition-all shadow-lg shadow-cyan-950/40 active:scale-95"
          title="World Tour: Global Arena & Opponent Select"
        >
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">World Tour</span>
          <span className="px-1.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 text-[10px]">
            {selectedCity.flag} {selectedCity.name}
          </span>
        </button>

        {/* Tactical Timeout Button */}
        <button
          onClick={callTimeout}
          disabled={timeoutsLeft <= 0}
          className={`flex items-center gap-1.5 px-3.5 py-2 backdrop-blur-md rounded-full border text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95 ${
            timeoutsLeft > 0
              ? "bg-amber-950/70 hover:bg-amber-900 border-amber-500/40 hover:border-amber-400 text-amber-200 shadow-amber-950/40"
              : "bg-neutral-900/60 border-neutral-700 text-neutral-500 opacity-60 cursor-not-allowed"
          }`}
          title="Call Tactical Timeout"
        >
          <Timer className="w-4 h-4 text-amber-400" />
          <span>Timeout</span>
          <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px]">
            {timeoutsLeft}
          </span>
        </button>

        {/* Locker Room */}
        <button
          onClick={() => setShowLockerRoom(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full border border-amber-500/30 hover:border-amber-400 text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-black/40 text-white active:scale-95"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="hidden md:inline">Locker Room</span>
          <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black">
            LVL {calculateLevel(careerStats.xp).level}
          </span>
        </button>

        {/* Controls Info */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center gap-1.5 px-3 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full border border-white/10 hover:border-white/30 text-xs font-bold uppercase tracking-widest text-white/80 hover:text-white transition-all shadow-lg active:scale-95"
        >
          <Info className="w-4 h-4" />
          <span className="hidden lg:inline">Controls</span>
        </button>
      </div>

      {/* 2K Sports Main Menu Modal Overlay */}
      <AnimatePresence>
        {showMainMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[180] flex items-center justify-center p-4 sm:p-8"
            onClick={() => setShowMainMenu(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-neutral-950 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_100px_rgba(245,158,11,0.25)] text-white space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 text-black font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 border border-yellow-200">
                    2K
                  </div>
                  <div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tight text-2k-gold">
                      NBA 2K HOOPS HUB
                    </h2>
                    <p className="text-xs text-white/60 font-semibold">
                      Full-Court 3D Action • Global Arenas • MyCAREER Progression
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowMainMenu(false)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Play Now */}
                <button
                  onClick={() => setShowMainMenu(false)}
                  className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-black to-black border border-amber-500/50 hover:border-amber-400 text-left transition-all hover:scale-[1.02] shadow-xl group"
                >
                  <Play className="w-8 h-8 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
                  <div className="text-lg font-black uppercase text-white">Play Now</div>
                  <div className="text-xs text-white/50">Return to active match court</div>
                </button>

                {/* Global Leaders */}
                <button
                  onClick={() => {
                    setShowMainMenu(false);
                    setShowWorldTour(true);
                  }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-black to-black border border-cyan-500/50 hover:border-cyan-400 text-left transition-all hover:scale-[1.02] shadow-xl group"
                >
                  <Trophy className="w-8 h-8 text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
                  <div className="text-lg font-black uppercase text-white">Global Leaders</div>
                  <div className="text-xs text-white/50">View top scorers & rebounders worldwide</div>
                </button>

                {/* World Tour Arenas */}
                <button
                  onClick={() => {
                    setShowMainMenu(false);
                    setShowWorldTour(true);
                  }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/20 via-black to-black border border-blue-500/50 hover:border-blue-400 text-left transition-all hover:scale-[1.02] shadow-xl group"
                >
                  <Globe className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                  <div className="text-lg font-black uppercase text-white">World Arenas</div>
                  <div className="text-xs text-white/50">Select host cities across USA, Africa, Asia & Argentina</div>
                </button>

                {/* Locker Room */}
                <button
                  onClick={() => {
                    setShowMainMenu(false);
                    setShowLockerRoom(true);
                  }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-red-500/20 via-black to-black border border-red-500/50 hover:border-red-400 text-left transition-all hover:scale-[1.02] shadow-xl group"
                >
                  <Shirt className="w-8 h-8 text-red-400 mb-3 group-hover:scale-110 transition-transform" />
                  <div className="text-lg font-black uppercase text-white">MyCAREER Gear</div>
                  <div className="text-xs text-white/50">Unlock custom jerseys, kicks & headbands</div>
                </button>

                {/* Tactical Timeout */}
                <button
                  onClick={() => {
                    setShowMainMenu(false);
                    callTimeout();
                  }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-black to-black border border-emerald-500/50 hover:border-emerald-400 text-left transition-all hover:scale-[1.02] shadow-xl group"
                >
                  <Timer className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
                  <div className="text-lg font-black uppercase text-white">Tactical Timeout</div>
                  <div className="text-xs text-white/50">Adjust defensive intensity & offensive plays</div>
                </button>

                {/* Controls */}
                <button
                  onClick={() => {
                    setShowMainMenu(false);
                    setShowHelp(true);
                  }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/20 via-black to-black border border-purple-500/50 hover:border-purple-400 text-left transition-all hover:scale-[1.02] shadow-xl group"
                >
                  <Info className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                  <div className="text-lg font-black uppercase text-white">Controls Guide</div>
                  <div className="text-xs text-white/50">View PC keyboard & touch analog layout</div>
                </button>

                {/* 2K Features Directory */}
                <button
                  onClick={() => {
                    setShowMainMenu(false);
                    setShowFeaturesModal(true);
                  }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-yellow-500/20 via-black to-black border border-yellow-500/50 hover:border-yellow-400 text-left transition-all hover:scale-[1.02] shadow-xl group sm:col-span-2 md:col-span-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-6 h-6 text-yellow-400 group-hover:scale-110 transition-transform" />
                        <span className="text-lg font-black uppercase text-white">2K Official Modes & Features Directory</span>
                        <span className="px-2 py-0.5 rounded bg-yellow-400 text-black text-[9px] font-black uppercase">
                          ALL MODES
                        </span>
                      </div>
                      <div className="text-xs text-white/60">
                        Explore MyCAREER, MyTEAM, Seasons, ProPLAY Engine, MyNBA, The W, and 2K Presentation.
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-yellow-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Bottom Quick Info */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-white/50 font-semibold">
                <span>Active City: {selectedCity.flag} {selectedCity.name} ({selectedCity.arenaName})</span>
                <span>Franchise Level {calculateLevel(careerStats.xp).level}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-8 z-[100]"
            onClick={() => setShowHelp(false)}
          >
            <div className="max-w-5xl w-full grid md:grid-cols-2 gap-12" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-4">
                <h3 className="text-3xl font-black italic uppercase text-red-500 border-b border-white/10 pb-2">
                  PC Controls
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm font-bold">
                  <div>Move</div><div>WASD / Arrows</div>
                  <div>Sprint</div><div>Shift / RT</div>
                  <div>Shot / Fadeaway</div><div>Space / A</div>
                  <div>Dunk</div><div>Y</div>
                  <div>Step Back / Hop</div><div>U / X</div>
                  <div>Pass</div><div>K / B</div>
                  <div>Sub Bench</div><div>Q / LB</div>
                  <div>Tactical Timeout</div><div>Top Bar Button</div>
                  <div>World Tour</div><div>Top Bar Button</div>
                  <div>Locker Room</div><div>Top Bar Button</div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black italic uppercase text-blue-500 border-b border-white/10 pb-2">
                  World Tour & Tactics
                </h3>
                <p className="text-sm opacity-80 leading-relaxed">
                  Travel to global courts in North America, Argentina, Central America, Africa, Asia, Australia, and Europe. Adjust defensive intensity (Press, Lockdown, 2-3 Zone, Conservative Wall) or offensive sets (Pace & Space, Pick & Roll, Inside Paint Power, Fast Break) anytime during tactical timeouts!
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setShowHelp(false);
                      setShowWorldTour(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Open World Tour</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowHelp(false);
                      setShowLockerRoom(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Locker Room</span>
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
        }}
        onEquipItem={(_type, _id) => {
          if (gameRef.current?.applyCustomization) {
            const current = loadCareerStats();
            gameRef.current.applyCustomization(current);
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
            setShowLockerRoom(true);
          } else if (featId === "play_now" || featId === "the_city") {
            setShowWorldTour(true);
          } else if (featId === "learn_2k" || featId === "gameplay_engine") {
            setShowHelp(true);
          } else if (featId === "mynba") {
            callTimeout();
          } else {
            setShowWorldTour(true);
          }
        }}
      />
    </div>
  );
}

function ActionButton({ label, icon, color, onStateChange }: { label: string, icon: string, color: string, onStateChange: (s: boolean) => void }) { return (<div className="flex flex-col items-center gap-1"><button onPointerDown={() => onStateChange(true)} onPointerUp={() => onStateChange(false)} onPointerLeave={() => onStateChange(false)} className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-lg shadow-xl active:scale-90 transition-transform ${color} border-2 border-white/20`}>{icon}</button><span className="text-[9px] font-bold uppercase text-white/60">{label}</span></div>); }
function Joystick({ onChange }: { onChange: (x: number, y: number, active: boolean) => void }) {
  const containerRef = useRef<HTMLDivElement>(null); const handleRef = useRef<HTMLDivElement>(null); const state = useRef({ active: false, startX: 0, startY: 0 });
  const onStart = (e: any) => { state.current.active = true; state.current.startX = e.clientX; state.current.startY = e.clientY; onChange(0, 0, true); };
  useEffect(() => {
    const onMove = (e: any) => { if (!state.current.active || !handleRef.current) return; const dx = e.clientX - state.current.startX, dy = e.clientY - state.current.startY, dist = Math.min(Math.hypot(dx, dy), 40), angle = Math.atan2(dy, dx), x = Math.cos(angle) * dist, y = Math.sin(angle) * dist; handleRef.current.style.transform = `translate(${x}px, ${y}px)`; onChange(x / 40, y / 40, true); };
    const onEnd = () => { state.current.active = false; if (handleRef.current) handleRef.current.style.transform = "translate(0, 0)"; onChange(0, 0, false); };
    window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onEnd); return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onEnd); };
  }, [onChange]);
  return (<div ref={containerRef} onPointerDown={onStart} className="w-28 h-28 bg-white/10 backdrop-blur-xl rounded-full border-2 border-white/20 flex items-center justify-center relative touch-none"><div ref={handleRef} className="w-12 h-12 bg-white/40 rounded-full border-2 border-white/60 shadow-2xl pointer-events-none" /></div>);
}
