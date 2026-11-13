"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import QRCode from "qrcode";
import {
  Cast,
  Tv,
  Copy,
  Check,
  PictureInPicture2,
  Maximize2,
  Minimize2,
  X,
  Radio,
  Square,
  ExternalLink,
  Smartphone,
  Airplay,
} from "lucide-react";
import type { NativeMirrorCapabilities } from "@/lib/mirrorClient";

interface ScreenMirrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMirroring: boolean;
  mirrorCode: string;
  viewerCount: number;
  capabilities: NativeMirrorCapabilities;
  isFullscreen: boolean;
  onStartMirroring: () => Promise<void>;
  onStopMirroring: () => Promise<void>;
  onTriggerAirPlayOrCast: () => Promise<{ ok: boolean; message: string }>;
  onTogglePiP: () => Promise<{ ok: boolean; message: string }>;
  onToggleFullscreen: () => Promise<void>;
}

export default function ScreenMirrorModal({
  isOpen,
  onClose,
  isMirroring,
  mirrorCode,
  viewerCount,
  capabilities,
  isFullscreen,
  onStartMirroring,
  onStopMirroring,
  onTriggerAirPlayOrCast,
  onTogglePiP,
  onToggleFullscreen,
}: ScreenMirrorModalProps) {
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionHint, setActionHint] = useState<string | null>(null);
  const [watchCode, setWatchCode] = useState("");
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const mirrorUrl =
    typeof window !== "undefined" && mirrorCode
      ? `${window.location.origin}/mirror?code=${encodeURIComponent(mirrorCode)}`
      : mirrorCode
      ? `/mirror?code=${encodeURIComponent(mirrorCode)}`
      : "";

  useEffect(() => {
    if (!isOpen || !isMirroring || !mirrorUrl || !qrCanvasRef.current) return;
    QRCode.toCanvas(
      qrCanvasRef.current,
      mirrorUrl,
      {
        width: 172,
        margin: 1,
        color: {
          dark: "#090b10",
          light: "#ffffff",
        },
      },
      () => {
        // Rendered onto canvas
      }
    );
  }, [isOpen, isMirroring, mirrorUrl]);

  const handleCopyLink = async () => {
    if (!mirrorUrl || typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(mirrorUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionHint("Copy blocked by browser permissions. Share the Mirror Code manually.");
    }
  };

  const handleCopyCode = async () => {
    if (!mirrorCode || typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(mirrorCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleToggleMirror = async () => {
    setBusy(true);
    setActionHint(null);
    try {
      if (isMirroring) {
        await onStopMirroring();
      } else {
        await onStartMirroring();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleAirPlayCast = async () => {
    const res = await onTriggerAirPlayOrCast();
    setActionHint(res.message);
  };

  const handlePiP = async () => {
    const res = await onTogglePiP();
    setActionHint(res.message);
  };

  const sanitizedWatchCode = watchCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/88 backdrop-blur-xl z-[205] flex items-start sm:items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 14 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 14 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl bg-carbon border border-cyan-500/30 rounded-2xl p-4 sm:p-7 shadow-[0_0_80px_rgba(0,0,0,0.9),0_0_40px_rgba(6,182,212,0.12)] text-white space-y-5 max-h-[92dvh] my-auto overflow-y-auto"
          >
            <div className="h-1 w-full rounded-full bg-gradient-to-r from-cyan-400 via-amber-400 to-orange-500 opacity-85" />

            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-400/45 flex items-center justify-center text-cyan-300 shrink-0">
                  <Cast className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-tight text-2k-cyan">
                    Screen Mirroring &amp; TV Cast
                  </h2>
                  <p className="text-xs text-white/65 mt-0.5">
                    Mirror your live 3D game to a Smart TV, iPad, Mac, or second monitor in real time.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close Screen Mirroring"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/75 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 1: Wireless TV / Browser Mirroring */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-cyan-950/45 via-neutral-900 to-neutral-950 border border-cyan-500/30 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Tv className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-black uppercase tracking-wider text-white">
                      Wireless Second-Screen Broadcast
                    </span>
                    {isMirroring && (
                      <span className="px-2 py-0.5 rounded bg-red-600/85 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Radio className="w-3 h-3" />
                        LIVE · {viewerCount} {viewerCount === 1 ? "TV" : "TVs"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/65">
                    Streams your court camera and live scoreboard to any TV, tablet, or laptop browser.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={busy}
                  onClick={handleToggleMirror}
                  className={`min-h-[44px] px-5 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                    isMirroring
                      ? "bg-red-600 hover:bg-red-500 text-white border border-red-400"
                      : "bg-cyan-500 hover:bg-cyan-400 text-black border border-cyan-200"
                  }`}
                >
                  {isMirroring ? (
                    <>
                      <Square className="w-4 h-4 fill-current" />
                      <span>Stop Mirroring</span>
                    </>
                  ) : (
                    <>
                      <Cast className="w-4 h-4" />
                      <span>Start Mirroring</span>
                    </>
                  )}
                </button>
              </div>

              {isMirroring && mirrorCode && (
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-center pt-3 border-t border-white/10">
                  <div className="space-y-3 min-w-0">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                        Mirror Code
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5 mt-1">
                        <span className="text-3xl font-black tracking-wider text-white tabular-nums">
                          {mirrorCode}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="min-h-[36px] px-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/55">
                        TV / Receiver Link
                      </div>
                      <div className="px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-cyan-200 truncate font-mono">
                        {mirrorUrl}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span>{copied ? "Mirror Link Copied" : "Copy Mirror Link"}</span>
                      </button>

                      <Link
                        href={`/mirror?code=${encodeURIComponent(mirrorCode)}`}
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Preview TV View</span>
                      </Link>
                    </div>
                  </div>

                  {/* Scannable QR Code */}
                  <div className="flex flex-col items-center gap-1.5 bg-white p-2.5 rounded-xl border border-white/25 mx-auto sm:mx-0">
                    <canvas
                      ref={qrCanvasRef}
                      aria-label={`QR code for mirror session ${mirrorCode}`}
                      className="w-36 h-36 sm:w-40 sm:h-40 rounded-md"
                    />
                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1">
                      <Smartphone className="w-3 h-3" />
                      Scan on TV / iPad
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Native Device Casting, AirPlay, PiP & Fullscreen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={handleAirPlayCast}
                className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-left space-y-2 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <Airplay className="w-5 h-5 text-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/55">
                    {capabilities.airplay
                      ? "AirPlay"
                      : capabilities.remotePlayback
                      ? "Cast"
                      : "System"}
                  </span>
                </div>
                <div className="text-sm font-black uppercase text-white">
                  AirPlay / TV Cast
                </div>
                <p className="text-[11px] text-white/60">
                  Send video stream directly to Apple TV, AirPlay, or Cast displays.
                </p>
              </button>

              <button
                type="button"
                onClick={handlePiP}
                className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-left space-y-2 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <PictureInPicture2 className="w-5 h-5 text-cyan-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/55">
                    {capabilities.pictureInPicture ? "Ready" : "Check"}
                  </span>
                </div>
                <div className="text-sm font-black uppercase text-white">
                  Floating Mini-Screen
                </div>
                <p className="text-[11px] text-white/60">
                  Pop out a Picture-in-Picture feed of your 3D court while multitasking.
                </p>
              </button>

              <button
                type="button"
                onClick={onToggleFullscreen}
                className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-left space-y-2 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  {isFullscreen ? (
                    <Minimize2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Maximize2 className="w-5 h-5 text-emerald-400" />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/55">
                    {isFullscreen ? "Active" : "Display"}
                  </span>
                </div>
                <div className="text-sm font-black uppercase text-white">
                  {isFullscreen ? "Exit Fullscreen" : "Fullscreen TV"}
                </div>
                <p className="text-[11px] text-white/60">
                  Fill an external monitor, projector, or TV browser edge-to-edge.
                </p>
              </button>
            </div>

            {actionHint && (
              <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-400/35 text-xs text-amber-200">
                {actionHint}
              </div>
            )}

            {/* Section 3: Watch Another Device's Screen */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-white/80">
                Using This Device As The TV Display?
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={watchCode}
                  onChange={(e) => setWatchCode(e.target.value.toUpperCase())}
                  placeholder="Enter Mirror Code (e.g. TV-7K4M)"
                  className="flex-1 min-h-[44px] px-4 rounded-xl bg-black/70 border border-white/15 text-sm font-bold tracking-wider uppercase text-white placeholder:text-white/35 focus:outline-none focus:border-cyan-400"
                />
                <Link
                  href={sanitizedWatchCode.length >= 3 ? `/mirror?code=${encodeURIComponent(sanitizedWatchCode)}` : "/mirror"}
                  className="min-h-[44px] px-5 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-black border border-white/15 text-white font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <Tv className="w-4 h-4" />
                  <span>{sanitizedWatchCode.length >= 3 ? "Watch Stream" : "Open TV Receiver"}</span>
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
