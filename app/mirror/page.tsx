"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Tv,
  Maximize2,
  Minimize2,
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff,
  Radio,
  Cast,
} from "lucide-react";
import { MirrorViewerClient, listActiveMirrorSessions } from "@/lib/mirrorClient";
import type { MirrorMatchMeta, MirrorSessionSummary } from "@/lib/mirrorTypes";

function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function MirrorReceiverContent() {
  const searchParams = useSearchParams();
  const initialCode = (searchParams.get("code") || "").trim().toUpperCase();

  const [codeInput, setCodeInput] = useState(initialCode);
  const [connectedCode, setConnectedCode] = useState(initialCode);
  const [status, setStatus] = useState<"idle" | "connecting" | "live" | "ended" | "waiting">(
    initialCode ? "connecting" : "idle"
  );
  const [meta, setMeta] = useState<MirrorMatchMeta | null>(null);
  const [sessions, setSessions] = useState<MirrorSessionSummary[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [showScorebug, setShowScorebug] = useState(true);
  const [hasRtcStream, setHasRtcStream] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameImgRef = useRef<HTMLImageElement | null>(null);
  const viewerRef = useRef<MirrorViewerClient | null>(null);

  const refreshSessions = useCallback(async () => {
    setLoadingList(true);
    try {
      const list = await listActiveMirrorSessions();
      setSessions(list);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadList = async () => {
      const list = await listActiveMirrorSessions();
      if (!cancelled) setSessions(list);
    };
    void loadList();
    const timer = setInterval(loadList, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    if (!connectedCode) return;

    const viewer = new MirrorViewerClient({
      onStatus: (next) => {
        setStatus(next);
        if (next === "ended") {
          setHasRtcStream(false);
        }
      },
      onMeta: (nextMeta) => setMeta(nextMeta),
      onMediaStream: (stream) => {
        const video = videoRef.current;
        if (!video) return;
        if (stream) {
          video.srcObject = stream;
          video.play().catch(() => {});
          setHasRtcStream(true);
        } else {
          video.srcObject = null;
          setHasRtcStream(false);
        }
      },
      onFrame: (dataUrl, frameMeta) => {
        if (frameMeta) setMeta(frameMeta);
        if (!frameImgRef.current) {
          frameImgRef.current = new window.Image();
        }
        const img = frameImgRef.current;
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
          }
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setHasFrame(true);
          }
        };
        img.src = dataUrl;
      },
    });

    viewerRef.current = viewer;
    viewer.connect(connectedCode);

    return () => {
      viewer.disconnect();
      viewerRef.current = null;
    };
  }, [connectedCode]);

  const handleJoinCode = (code: string) => {
    const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (normalized.length < 3) return;
    setHasFrame(false);
    setHasRtcStream(false);
    setCodeInput(normalized);
    setConnectedCode(normalized);
  };

  const toggleFullscreen = async () => {
    if (typeof document === "undefined") return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        const target = stageRef.current || document.documentElement;
        await target.requestFullscreen();
      }
    } catch {
      // Fullscreen may be restricted in some embedded frames
    }
  };

  return (
    <div
      ref={stageRef}
      className="relative w-full h-screen h-dvh bg-[#07090e] text-white flex flex-col overflow-hidden select-none"
    >
      {/* Top Control & Broadcast Bar */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-2.5 pt-[max(0.65rem,env(safe-area-inset-top))] bg-neutral-950/90 border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="min-h-[40px] px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Game</span>
          </Link>
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-cyan-400" />
            <span className="text-sm sm:text-base font-black uppercase italic tracking-tight text-2k-cyan">
              CourtLegends · TV Mirror Receiver
            </span>
          </div>
          {connectedCode && status === "live" && (
            <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              <Radio className="w-3 h-3" />
              LIVE · {connectedCode}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {connectedCode && (
            <>
              <button
                type="button"
                onClick={() => setShowScorebug((v) => !v)}
                className="min-h-[40px] px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                {showScorebug ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="hidden sm:inline">{showScorebug ? "Hide Score" : "Show Score"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  viewerRef.current?.disconnect();
                  setConnectedCode("");
                  setStatus("idle");
                  setHasFrame(false);
                  setHasRtcStream(false);
                  setMeta(null);
                  refreshSessions();
                }}
                className="min-h-[40px] px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Switch Screen
              </button>
            </>
          )}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="min-h-[40px] px-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>
        </div>
      </header>

      {/* Main Viewer Stage */}
      <main className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
        {/* WebRTC Video Element (Primary 30fps stream when direct P2P succeeds) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-contain ${
            connectedCode && hasRtcStream ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />

        {/* Relayed Canvas Fallback / Instant Frame Buffer */}
        <canvas
          ref={canvasRef}
          className={`w-full h-full object-contain ${
            connectedCode && !hasRtcStream && hasFrame ? "block" : "hidden"
          }`}
        />

        {/* Broadcast Scorebug Overlay on TV */}
        {connectedCode && showScorebug && meta && (hasRtcStream || hasFrame) && (
          <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 sm:gap-3 px-4 py-2 rounded-2xl bg-neutral-950/88 border border-amber-400/40 backdrop-blur-md shadow-2xl text-white">
            <div className="text-right">
              <div className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                {meta.homeTeamName}
              </div>
              <div className="text-xl sm:text-2xl font-black tabular-nums leading-none">
                {meta.scoreHome}
              </div>
            </div>
            <div className="px-3 py-1 rounded-xl bg-white/10 border border-white/10 text-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                Q{meta.quarter} · {formatClock(meta.gameClock)}
              </div>
              <div className="text-[10px] font-bold text-white/65">
                {meta.cityFlag} {meta.cityName} · SC {Math.ceil(meta.shotClock)}
              </div>
            </div>
            <div className="text-left">
              <div className="text-[10px] font-black uppercase tracking-wider text-orange-300">
                {meta.awayTeamName}
              </div>
              <div className="text-xl sm:text-2xl font-black tabular-nums leading-none">
                {meta.scoreAway}
              </div>
            </div>
          </div>
        )}

        {/* Waiting / Ended / Lobby State */}
        {(!connectedCode || (!hasRtcStream && !hasFrame)) && (
          <div className="relative z-10 w-full max-w-xl mx-auto p-5 sm:p-8 bg-neutral-950/95 border border-white/15 rounded-2xl shadow-2xl space-y-5 text-white m-4">
            {connectedCode ? (
              <div className="text-center space-y-3 py-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                  <Cast className="w-7 h-7" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black uppercase italic">
                  {status === "ended"
                    ? `Mirror Session ${connectedCode} Ended`
                    : `Connecting to ${connectedCode}...`}
                </h1>
                <p className="text-xs text-white/65 max-w-md mx-auto">
                  {status === "ended"
                    ? "The broadcaster stopped screen mirroring. Start mirroring again from the host device or pick another live court below."
                    : "Waiting for live frames from the host device. Make sure Start Mirroring is active on the player device."}
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleJoinCode(connectedCode)}
                    className="min-h-[42px] px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase text-xs tracking-wider cursor-pointer"
                  >
                    Retry {connectedCode}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConnectedCode("");
                      setStatus("idle");
                      refreshSessions();
                    }}
                    className="min-h-[42px] px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Browse Live Courts
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <h1 className="text-xl sm:text-2xl font-black uppercase italic text-2k-gold">
                    Connect Display to CourtLegends
                  </h1>
                  <p className="text-xs text-white/65">
                    Enter the Mirror Code shown in the player&apos;s Screen Mirroring menu or select a live broadcast below.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleJoinCode(codeInput);
                  }}
                  className="flex flex-col sm:flex-row gap-2.5"
                >
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter Mirror Code (e.g. TV-7K4M)"
                    className="flex-1 min-h-[46px] px-4 rounded-xl bg-black/75 border border-white/15 text-sm font-bold tracking-wider uppercase text-white placeholder:text-white/35 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    disabled={codeInput.trim().length < 3}
                    className="min-h-[46px] px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-black uppercase text-xs tracking-wider cursor-pointer"
                  >
                    Connect TV
                  </button>
                </form>

                <div className="space-y-2.5 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-white/75">
                      Active Screen Mirror Broadcasts
                    </span>
                    <button
                      type="button"
                      onClick={refreshSessions}
                      disabled={loadingList}
                      className="min-h-[34px] px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white/75 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? "animate-spin" : ""}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {sessions.length === 0 ? (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white/55 text-center">
                      No active broadcasts yet. Open Menu &rarr; Screen Mirroring on your phone or computer and tap Start Mirroring.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {sessions.map((s) => (
                        <div
                          key={s.code}
                          className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div>
                            <div className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                              <span>{s.code}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600/80 text-white">
                                LIVE
                              </span>
                            </div>
                            <div className="text-xs text-white/60 mt-0.5">
                              {s.hostName} · {s.cityFlag} {s.cityName} · {s.scoreHome}-{s.scoreAway}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleJoinCode(s.code)}
                            className="min-h-[40px] px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider cursor-pointer"
                          >
                            Mirror Now
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function MirrorPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen bg-[#07090e] text-white flex items-center justify-center text-sm font-bold uppercase tracking-wider">
          Loading Screen Mirroring Receiver...
        </div>
      }
    >
      <MirrorReceiverContent />
    </Suspense>
  );
}
