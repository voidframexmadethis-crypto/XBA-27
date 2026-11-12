"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Smartphone,
  Tablet,
  Monitor,
  Tv,
  Plus,
  Copy,
  Check,
  Play,
  LogOut,
  RefreshCw,
  X,
  Wifi,
} from "lucide-react";
import type {
  DeviceType,
  MultiplayerRoomState,
  MultiplayerRoomSummary,
  TeamSide,
} from "@/lib/multiplayerTypes";
import type { ConnectionTransport } from "@/lib/multiplayerClient";

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceType: DeviceType;
  playerId: string;
  playerName: string;
  transport: ConnectionTransport;
  currentRoom: MultiplayerRoomState | null;
  onFetchRooms: () => Promise<MultiplayerRoomSummary[]>;
  onJoinRoom: (roomCode: string, preferredTeam?: TeamSide) => Promise<void>;
  onCreateRoom: () => Promise<void>;
  onLeaveRoom: () => Promise<void>;
  onStartCourtMatch: () => void;
}

function DeviceIcon({ device, className = "w-4 h-4" }: { device: DeviceType; className?: string }) {
  switch (device) {
    case "phone":
      return <Smartphone className={className} />;
    case "tablet":
      return <Tablet className={className} />;
    case "tv":
      return <Tv className={className} />;
    default:
      return <Monitor className={className} />;
  }
}

function deviceLabel(device: DeviceType): string {
  switch (device) {
    case "phone":
      return "Phone";
    case "tablet":
      return "Tablet";
    case "tv":
      return "Smart TV";
    default:
      return "Computer";
  }
}

export default function MultiplayerModal({
  isOpen,
  onClose,
  deviceType,
  playerId,
  playerName,
  transport,
  currentRoom,
  onFetchRooms,
  onJoinRoom,
  onCreateRoom,
  onLeaveRoom,
  onStartCourtMatch,
}: MultiplayerModalProps) {
  const [rooms, setRooms] = useState<MultiplayerRoomSummary[]>([]);
  const [customCode, setCustomCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [preferredTeam, setPreferredTeam] = useState<TeamSide | undefined>(undefined);

  const refreshRooms = async () => {
    setBusy(true);
    try {
      const list = await onFetchRooms();
      setRooms(list);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    onFetchRooms().then((list) => {
      if (!cancelled) setRooms(list);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, onFetchRooms]);

  if (!isOpen) return null;

  const players = currentRoom ? Object.values(currentRoom.players) : [];
  const isConnected = !!currentRoom && transport !== "disconnected";

  const copyInviteLink = async () => {
    if (!currentRoom || typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(currentRoom.roomCode)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors in restricted iframes
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/88 backdrop-blur-xl z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.96, y: 12 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl bg-neutral-950 border border-white/15 rounded-2xl p-6 sm:p-8 shadow-2xl text-white space-y-6 max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase italic tracking-tight text-white">
                  Cross-Play Multiplayer
                </h2>
                <p className="text-xs text-white/60 flex items-center gap-2 mt-0.5">
                  <DeviceIcon device={deviceType} className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Playing on {deviceLabel(deviceType)} · {playerName} · Phone, Tablet, Computer &amp; TV</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close Multiplayer"
              className="min-w-[44px] min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/75 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Room View */}
          {isConnected && currentRoom ? (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/60 via-neutral-900 to-neutral-950 border border-cyan-500/35 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-widest font-bold text-cyan-300 flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5" />
                    <span>Live Room · {transport === "ws" ? "Real-Time Socket" : "Auto-Sync Bridge"}</span>
                  </div>
                  <div className="text-3xl font-black tracking-wider text-white mt-1 tabular-nums">
                    {currentRoom.roomCode}
                  </div>
                  <p className="text-xs text-white/60 mt-1">
                    Share this code or link so friends on any phone, tablet, TV, or computer can join your court.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={copyInviteLink}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Link Copied" : "Copy Invite Link"}</span>
                  </button>
                  <button
                    onClick={async () => {
                      setBusy(true);
                      await onLeaveRoom();
                      await refreshRooms();
                      setBusy(false);
                    }}
                    disabled={busy}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/70 border border-red-500/40 text-red-200 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Leave Room</span>
                  </button>
                </div>
              </div>

              {/* Connected Players Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white/80">
                    Connected Players ({players.length} / 10)
                  </h3>
                  <span className="text-xs text-white/50">
                    Live Score: Home {currentRoom.match.scoreHome} - Away {currentRoom.match.scoreAway}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {players.map((p) => {
                    const isSelf = p.playerId === playerId;
                    const isHost = currentRoom.hostId === p.playerId;
                    return (
                      <div
                        key={p.playerId}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                          isSelf
                            ? "bg-amber-500/10 border-amber-400/50"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 border border-white/20"
                            style={{ backgroundColor: p.jerseyColor || "#c8102e" }}
                          >
                            <DeviceIcon device={p.deviceType} className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">
                              {p.name} {isSelf ? "(You)" : ""}
                            </div>
                            <div className="text-[11px] text-white/60">
                              {p.team} · {deviceLabel(p.deviceType)}{isHost ? " · Room Host" : ""}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-black uppercase text-emerald-400">
                          Ready
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Enter Match CTA */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onStartCourtMatch();
                  }}
                  className="min-h-[48px] px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-sm flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>Play on Court Now</span>
                </button>
              </div>
            </div>
          ) : (
            /* Lobby Browser / Join Flow */
            <div className="space-y-5">
              {/* Preferred Team Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-white/80">
                    Preferred Side
                  </div>
                  <div className="text-xs text-white/55">
                    Auto balances teams or pick Home / Away before joining
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(["Auto", "Home", "Away"] as const).map((opt) => {
                    const selected =
                      (opt === "Auto" && !preferredTeam) || preferredTeam === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setPreferredTeam(opt === "Auto" ? undefined : opt)}
                        className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold uppercase border cursor-pointer ${
                          selected
                            ? "bg-amber-500 text-black border-amber-300"
                            : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    await onJoinRoom("PUBLIC-COURT", preferredTeam);
                    setBusy(false);
                  }}
                  className="min-h-[88px] p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-neutral-900 to-neutral-950 border border-amber-500/45 hover:border-amber-400 text-left flex flex-col justify-between cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black uppercase text-white">Quick Play Court</span>
                    <Play className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-xs text-white/65 mt-1">
                    Join the global Public Court immediately from any device.
                  </p>
                </button>

                <button
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    await onCreateRoom();
                    await refreshRooms();
                    setBusy(false);
                  }}
                  className="min-h-[88px] p-5 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-neutral-900 to-neutral-950 border border-cyan-500/40 hover:border-cyan-400 text-left flex flex-col justify-between cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black uppercase text-white">Create Private Room</span>
                    <Plus className="w-5 h-5 text-cyan-400" />
                  </div>
                  <p className="text-xs text-white/65 mt-1">
                    Generate a room code &amp; cross-play invite link for friends.
                  </p>
                </button>
              </div>

              {/* Join by Code */}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  placeholder="Enter Room Code (e.g. HOOP-7K2M)"
                  className="flex-1 min-h-[44px] px-4 rounded-xl bg-black/70 border border-white/15 text-sm font-bold tracking-wider uppercase text-white placeholder:text-white/35 focus:outline-none focus:border-cyan-400"
                />
                <button
                  disabled={busy || customCode.trim().length < 3}
                  onClick={async () => {
                    setBusy(true);
                    await onJoinRoom(customCode.trim(), preferredTeam);
                    setBusy(false);
                  }}
                  className="min-h-[44px] px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-black uppercase text-xs tracking-wider cursor-pointer"
                >
                  Join Code
                </button>
              </div>

              {/* Active Rooms Directory */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-white/70">
                    Active Cross-Play Courts
                  </span>
                  <button
                    onClick={refreshRooms}
                    disabled={busy}
                    className="min-h-[36px] px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white/75 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {rooms.map((rm) => (
                    <div
                      key={rm.roomCode}
                      className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-sm font-black uppercase tracking-wider text-white">
                          {rm.roomCode}
                        </div>
                        <div className="text-xs text-white/55 flex items-center gap-2 mt-0.5">
                          <span>{rm.playerCount} / {rm.maxPlayers} Players</span>
                          {rm.devices.length > 0 && (
                            <span className="flex items-center gap-1 text-cyan-300">
                              {rm.devices.map((d) => (
                                <DeviceIcon key={d} device={d} className="w-3.5 h-3.5" />
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          await onJoinRoom(rm.roomCode, preferredTeam);
                          setBusy(false);
                        }}
                        className="min-h-[44px] px-4 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-black text-white font-bold uppercase text-xs tracking-wider transition-colors cursor-pointer"
                      >
                        Join Court
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
