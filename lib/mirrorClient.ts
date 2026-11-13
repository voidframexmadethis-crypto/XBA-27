import type {
  MirrorClientWsMessage,
  MirrorMatchMeta,
  MirrorRtcIceCandidate,
  MirrorRtcSdp,
  MirrorServerWsMessage,
  MirrorSessionSummary,
} from "./mirrorTypes";

export type MirrorTransportMode = "idle" | "connecting" | "ws" | "http";

export interface NativeMirrorCapabilities {
  airplay: boolean;
  remotePlayback: boolean;
  pictureInPicture: boolean;
  fullscreen: boolean;
}

interface WebKitVideoElement extends HTMLVideoElement {
  webkitShowPlaybackTargetPicker?: () => void;
  webkitCurrentPlaybackTargetIsWireless?: boolean;
  webkitSupportsPresentationMode?: (mode: string) => boolean;
  webkitSetPresentationMode?: (mode: string) => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function createMirrorSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TV-${suffix}`;
}

export function detectNativeMirrorCapabilities(video?: HTMLVideoElement | null): NativeMirrorCapabilities {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { airplay: false, remotePlayback: false, pictureInPicture: false, fullscreen: false };
  }
  const v = (video || document.createElement("video")) as WebKitVideoElement;
  const airplay =
    typeof v.webkitShowPlaybackTargetPicker === "function" ||
    "WebKitPlaybackTargetAvailabilityEvent" in window;
  const remotePlayback = Boolean(v.remote && typeof v.remote.prompt === "function");
  const pictureInPicture =
    Boolean(document.pictureInPictureEnabled && typeof v.requestPictureInPicture === "function") ||
    Boolean(v.webkitSupportsPresentationMode && v.webkitSupportsPresentationMode("picture-in-picture"));
  const fullscreen = Boolean(
    document.fullscreenEnabled ||
      (document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void })
        .webkitRequestFullscreen
  );
  return { airplay, remotePlayback, pictureInPicture, fullscreen };
}

export async function listActiveMirrorSessions(): Promise<MirrorSessionSummary[]> {
  try {
    const res = await fetch("/api/mirror?action=list", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.sessions) ? data.sessions : [];
  } catch {
    return [];
  }
}

export class MirrorBroadcaster {
  public code: string = "";
  public active = false;
  public transport: MirrorTransportMode = "idle";
  public viewerCount = 0;

  private ws: WebSocket | null = null;
  private wsConnectTimer: ReturnType<typeof setTimeout> | null = null;
  private wsRetryTimer: ReturnType<typeof setTimeout> | null = null;
  private metaTimer: ReturnType<typeof setInterval> | null = null;
  private bc: BroadcastChannel | null = null;
  private bcHasViewer = false;
  private stream: MediaStream | null = null;
  private captureCanvas: HTMLCanvasElement | null = null;
  private captureCtx: CanvasRenderingContext2D | null = null;
  private peers = new Map<string, RTCPeerConnection>();
  private rtcConnectedViewers = new Set<string>();
  private seq = 0;
  private lastFrameSentAt = 0;
  private lastHttpFrameAt = 0;
  private latestMeta: MirrorMatchMeta;
  private disposed = false;

  private onStateChange?: (info: {
    active: boolean;
    code: string;
    viewerCount: number;
    transport: MirrorTransportMode;
  }) => void;

  constructor(
    initialMeta: MirrorMatchMeta,
    onStateChange?: (info: {
      active: boolean;
      code: string;
      viewerCount: number;
      transport: MirrorTransportMode;
    }) => void
  ) {
    this.latestMeta = initialMeta;
    this.onStateChange = onStateChange;
  }

  private emitState() {
    this.onStateChange?.({
      active: this.active,
      code: this.code,
      viewerCount: this.viewerCount,
      transport: this.transport,
    });
  }

  public getOrCreateCaptureStream(sourceCanvas: HTMLCanvasElement): MediaStream | null {
    if (this.stream && this.stream.getTracks().some((t) => t.readyState === "live")) {
      return this.stream;
    }
    if (typeof sourceCanvas.captureStream === "function") {
      try {
        this.stream = sourceCanvas.captureStream(30);
        return this.stream;
      } catch {
        return null;
      }
    }
    return null;
  }

  public async start(code: string, sourceCanvas: HTMLCanvasElement | null, meta: MirrorMatchMeta) {
    this.disposed = false;
    this.code = code;
    this.latestMeta = meta;
    this.active = true;
    this.transport = "connecting";
    this.seq = 0;
    this.emitState();

    if (sourceCanvas) {
      this.getOrCreateCaptureStream(sourceCanvas);
    }

    // Same-browser second-window BroadcastChannel for instant local tab mirroring
    if (typeof BroadcastChannel !== "undefined") {
      try {
        this.bc?.close();
        this.bc = new BroadcastChannel(`hoops_mirror_${code}`);
        this.bc.onmessage = (ev) => {
          if (ev.data?.type === "viewer_ping") {
            this.bcHasViewer = true;
            this.bc?.postMessage({ type: "meta", code: this.code, meta: this.latestMeta });
          }
        };
      } catch {
        // ignore BroadcastChannel failures
      }
    }

    // Register via HTTP immediately so /api/mirror?action=list and ?code= work right away
    try {
      const res = await fetch("/api/mirror", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", code: this.code, meta: this.latestMeta }),
      });
      const data = await res.json();
      if (data?.ok) {
        if (data.code) this.code = data.code;
        this.viewerCount = Number(data.viewerCount || 0);
      }
    } catch {
      // WebSocket below will still run
    }

    this.openWebSocket();

    // Sync metadata & poll viewer count if using HTTP fallback
    if (this.metaTimer) clearInterval(this.metaTimer);
    this.metaTimer = setInterval(async () => {
      if (!this.active || this.disposed) return;
      this.bc?.postMessage({ type: "meta", code: this.code, meta: this.latestMeta });
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendWs({ type: "update_meta", code: this.code, meta: this.latestMeta });
      } else {
        try {
          const res = await fetch("/api/mirror", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "meta", code: this.code, meta: this.latestMeta }),
          });
          const data = await res.json();
          if (data?.ok && typeof data.viewerCount === "number") {
            if (this.viewerCount !== data.viewerCount) {
              this.viewerCount = data.viewerCount;
              this.emitState();
            }
          }
        } catch {
          // ignore transient network errors
        }
      }
    }, 1000);
  }

  public updateMeta(meta: MirrorMatchMeta) {
    this.latestMeta = meta;
  }

  private openWebSocket() {
    if (typeof window === "undefined" || this.disposed || !this.active) return;

    if (this.wsConnectTimer) clearTimeout(this.wsConnectTimer);
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${proto}//${window.location.host}/ws/mirror?code=${encodeURIComponent(this.code)}`;
    let opened = false;

    try {
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      this.wsConnectTimer = setTimeout(() => {
        if (!opened && !this.disposed && this.active) {
          this.transport = "http";
          this.emitState();
        }
      }, 2200);

      ws.onopen = () => {
        opened = true;
        if (this.wsConnectTimer) clearTimeout(this.wsConnectTimer);
        this.transport = "ws";
        this.sendWs({ type: "start_broadcast", code: this.code, meta: this.latestMeta });
        this.emitState();
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(String(evt.data)) as MirrorServerWsMessage;
          if (msg.type === "broadcast_started") {
            this.viewerCount = msg.viewerCount;
            this.emitState();
          } else if (msg.type === "viewer_joined") {
            this.viewerCount = msg.viewerCount;
            this.emitState();
            this.initiateWebRtcOffer(msg.viewerId);
          } else if (msg.type === "viewer_left") {
            this.viewerCount = msg.viewerCount;
            this.closePeer(msg.viewerId);
            this.emitState();
          } else if (msg.type === "rtc_answer") {
            const pc = this.peers.get(msg.viewerId);
            if (pc && msg.sdp) {
              pc.setRemoteDescription(new RTCSessionDescription(msg.sdp)).catch(() => {});
            }
          } else if (msg.type === "rtc_ice" && msg.from === "viewer") {
            const pc = this.peers.get(msg.viewerId);
            if (pc && msg.candidate) {
              pc.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(() => {});
            }
          }
        } catch {
          // ignore malformed packet
        }
      };

      ws.onerror = () => {
        if (!opened && !this.disposed && this.active) {
          this.transport = "http";
          this.emitState();
        }
      };

      ws.onclose = () => {
        if (this.wsConnectTimer) clearTimeout(this.wsConnectTimer);
        if (!this.disposed && this.active) {
          this.transport = "http";
          this.emitState();
          this.wsRetryTimer = setTimeout(() => {
            if (!this.disposed && this.active) {
              this.openWebSocket();
            }
          }, 8000);
        }
      };
    } catch {
      this.transport = "http";
      this.emitState();
    }
  }

  private async initiateWebRtcOffer(viewerId: string) {
    if (typeof RTCPeerConnection === "undefined" || !this.stream) return;
    this.closePeer(viewerId);
    try {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      this.peers.set(viewerId, pc);

      for (const track of this.stream.getTracks()) {
        pc.addTrack(track, this.stream);
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          this.sendWs({
            type: "rtc_ice",
            code: this.code,
            viewerId,
            from: "sender",
            candidate: e.candidate.toJSON() as MirrorRtcIceCandidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          this.rtcConnectedViewers.add(viewerId);
        } else if (
          pc.connectionState === "failed" ||
          pc.connectionState === "closed" ||
          pc.connectionState === "disconnected"
        ) {
          this.rtcConnectedViewers.delete(viewerId);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.sendWs({
        type: "rtc_offer",
        code: this.code,
        viewerId,
        sdp: offer as MirrorRtcSdp,
      });
    } catch {
      // Frame relay remains active automatically
    }
  }

  private closePeer(viewerId: string) {
    this.rtcConnectedViewers.delete(viewerId);
    const pc = this.peers.get(viewerId);
    if (pc) {
      try {
        pc.close();
      } catch {
        // ignore
      }
      this.peers.delete(viewerId);
    }
  }

  private sendWs(msg: MirrorClientWsMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }

  /**
   * Called synchronously right after renderer.render(scene, camera) so the WebGL
   * drawing buffer is guaranteed to contain the current frame with zero flicker.
   */
  public captureRenderedFrame(sourceCanvas: HTMLCanvasElement, meta: MirrorMatchMeta) {
    if (!this.active || this.disposed) return;
    this.latestMeta = meta;

    const needsRelay =
      this.bcHasViewer ||
      this.viewerCount === 0 || // keep 1 initial thumbnail frame fresh every 1.2s for preview
      this.rtcConnectedViewers.size < this.viewerCount;

    if (!needsRelay) return;

    const now = performance.now();
    const minIntervalMs = this.viewerCount > 0 || this.bcHasViewer ? 66 : 1200;
    if (now - this.lastFrameSentAt < minIntervalMs) return;
    this.lastFrameSentAt = now;

    if (sourceCanvas.width === 0 || sourceCanvas.height === 0) return;

    const maxW = 854;
    const scale = Math.min(1, maxW / sourceCanvas.width);
    const targetW = Math.max(2, Math.round(sourceCanvas.width * scale));
    const targetH = Math.max(2, Math.round(sourceCanvas.height * scale));

    if (!this.captureCanvas) {
      this.captureCanvas = document.createElement("canvas");
      this.captureCtx = this.captureCanvas.getContext("2d", { alpha: false });
    }
    if (!this.captureCanvas || !this.captureCtx) return;

    if (this.captureCanvas.width !== targetW || this.captureCanvas.height !== targetH) {
      this.captureCanvas.width = targetW;
      this.captureCanvas.height = targetH;
    }

    this.captureCtx.drawImage(sourceCanvas, 0, 0, targetW, targetH);
    const dataUrl = this.captureCanvas.toDataURL("image/jpeg", 0.68);
    this.seq += 1;

    if (this.bcHasViewer) {
      this.bc?.postMessage({
        type: "frame",
        code: this.code,
        dataUrl,
        seq: this.seq,
        meta,
      });
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Avoid saturating socket buffer on slow connections
      if (this.ws.bufferedAmount < 512 * 1024) {
        this.sendWs({
          type: "frame",
          code: this.code,
          dataUrl,
          seq: this.seq,
          meta,
        });
      }
    } else if (now - this.lastHttpFrameAt >= 180) {
      this.lastHttpFrameAt = now;
      fetch("/api/mirror", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "frame",
          code: this.code,
          dataUrl,
          seq: this.seq,
          meta,
        }),
      }).catch(() => {});
    }
  }

  public async stop() {
    this.disposed = true;
    const prevCode = this.code;
    this.active = false;
    this.viewerCount = 0;
    this.transport = "idle";
    this.bcHasViewer = false;

    if (this.wsConnectTimer) clearTimeout(this.wsConnectTimer);
    if (this.wsRetryTimer) clearTimeout(this.wsRetryTimer);
    if (this.metaTimer) clearInterval(this.metaTimer);
    this.wsConnectTimer = null;
    this.wsRetryTimer = null;
    this.metaTimer = null;

    if (prevCode) {
      this.sendWs({ type: "stop_broadcast", code: prevCode });
      this.bc?.postMessage({ type: "broadcast_ended", code: prevCode });
      fetch("/api/mirror", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop", code: prevCode }),
      }).catch(() => {});
    }

    for (const vid of Array.from(this.peers.keys())) {
      this.closePeer(vid);
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }

    if (this.bc) {
      try {
        this.bc.close();
      } catch {
        // ignore
      }
      this.bc = null;
    }

    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        try {
          track.stop();
        } catch {
          // ignore
        }
      }
      this.stream = null;
    }

    this.emitState();
  }
}

export class MirrorViewerClient {
  public readonly viewerId: string;
  public code: string = "";

  private ws: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private bc: BroadcastChannel | null = null;
  private httpPollTimer: ReturnType<typeof setInterval> | null = null;
  private wsConnectTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  private lastSeq = 0;

  private callbacks: {
    onFrame?: (dataUrl: string, meta?: MirrorMatchMeta) => void;
    onMeta?: (meta: MirrorMatchMeta) => void;
    onMediaStream?: (stream: MediaStream | null) => void;
    onStatus?: (status: "connecting" | "live" | "ended" | "waiting") => void;
  };

  constructor(callbacks: {
    onFrame?: (dataUrl: string, meta?: MirrorMatchMeta) => void;
    onMeta?: (meta: MirrorMatchMeta) => void;
    onMediaStream?: (stream: MediaStream | null) => void;
    onStatus?: (status: "connecting" | "live" | "ended" | "waiting") => void;
  }) {
    this.viewerId = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    this.callbacks = callbacks;
  }

  public connect(rawCode: string) {
    this.disconnect();
    this.disposed = false;
    this.lastSeq = 0;
    this.code = rawCode.trim().toUpperCase();
    if (!this.code) return;

    this.callbacks.onStatus?.("connecting");

    // 1. Local BroadcastChannel for zero-latency same-browser external monitor tabs
    if (typeof BroadcastChannel !== "undefined") {
      try {
        this.bc = new BroadcastChannel(`hoops_mirror_${this.code}`);
        this.bc.postMessage({ type: "viewer_ping", code: this.code });
        this.bc.onmessage = (ev) => {
          const msg = ev.data;
          if (!msg || this.disposed) return;
          if (msg.type === "frame" && msg.dataUrl) {
            this.callbacks.onStatus?.("live");
            this.callbacks.onFrame?.(msg.dataUrl, msg.meta);
          } else if (msg.type === "meta" && msg.meta) {
            this.callbacks.onMeta?.(msg.meta);
          } else if (msg.type === "broadcast_ended") {
            this.callbacks.onStatus?.("ended");
          }
        };
      } catch {
        // ignore
      }
    }

    // 2. Register viewer via HTTP first for immediate snapshot
    fetch("/api/mirror", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join_viewer", code: this.code, viewerId: this.viewerId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (this.disposed) return;
        if (data?.active && data.session) {
          if (data.session.meta) this.callbacks.onMeta?.(data.session.meta);
          if (data.session.latestFrame) {
            this.lastSeq = data.session.seq || 0;
            this.callbacks.onStatus?.("live");
            this.callbacks.onFrame?.(data.session.latestFrame, data.session.meta);
          } else {
            this.callbacks.onStatus?.("waiting");
          }
        } else {
          this.callbacks.onStatus?.("waiting");
        }
      })
      .catch(() => {});

    // 3. Connect WebSocket for real-time WebRTC signaling + frame stream
    this.openWebSocket();
  }

  private openWebSocket() {
    if (typeof window === "undefined" || this.disposed || !this.code) return;
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${proto}//${window.location.host}/ws/mirror?code=${encodeURIComponent(this.code)}`;
    let opened = false;

    try {
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      this.wsConnectTimer = setTimeout(() => {
        if (!opened && !this.disposed) {
          this.startHttpPolling();
        }
      }, 2200);

      ws.onopen = () => {
        opened = true;
        if (this.wsConnectTimer) clearTimeout(this.wsConnectTimer);
        this.stopHttpPolling();
        this.sendWs({ type: "join_viewer", code: this.code, viewerId: this.viewerId });
      };

      ws.onmessage = async (evt) => {
        if (this.disposed) return;
        try {
          const msg = JSON.parse(String(evt.data)) as MirrorServerWsMessage;
          if (msg.type === "session_state") {
            if (msg.meta) this.callbacks.onMeta?.(msg.meta);
            if (msg.latestFrame) {
              this.lastSeq = msg.seq;
              this.callbacks.onStatus?.("live");
              this.callbacks.onFrame?.(msg.latestFrame, msg.meta || undefined);
            } else {
              this.callbacks.onStatus?.(msg.active ? "live" : "waiting");
            }
          } else if (msg.type === "frame") {
            this.lastSeq = msg.seq;
            this.callbacks.onStatus?.("live");
            this.callbacks.onFrame?.(msg.dataUrl, msg.meta);
          } else if (msg.type === "meta") {
            this.callbacks.onMeta?.(msg.meta);
          } else if (msg.type === "broadcast_ended") {
            this.callbacks.onMediaStream?.(null);
            this.callbacks.onStatus?.("ended");
          } else if (msg.type === "rtc_offer") {
            await this.handleRtcOffer(msg.sdp);
          } else if (msg.type === "rtc_ice" && msg.from === "sender") {
            if (this.pc && msg.candidate) {
              this.pc.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(() => {});
            }
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onerror = () => {
        if (!opened && !this.disposed) {
          this.startHttpPolling();
        }
      };

      ws.onclose = () => {
        if (this.wsConnectTimer) clearTimeout(this.wsConnectTimer);
        if (!this.disposed && this.code) {
          this.startHttpPolling();
        }
      };
    } catch {
      this.startHttpPolling();
    }
  }

  private async handleRtcOffer(sdp: MirrorRtcSdp) {
    if (typeof RTCPeerConnection === "undefined") return;
    if (this.pc) {
      try {
        this.pc.close();
      } catch {
        // ignore
      }
      this.pc = null;
    }
    try {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      this.pc = pc;

      pc.ontrack = (e) => {
        if (e.streams && e.streams[0]) {
          this.callbacks.onStatus?.("live");
          this.callbacks.onMediaStream?.(e.streams[0]);
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          this.sendWs({
            type: "rtc_ice",
            code: this.code,
            viewerId: this.viewerId,
            from: "viewer",
            candidate: e.candidate.toJSON() as MirrorRtcIceCandidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          this.callbacks.onMediaStream?.(null);
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.sendWs({
        type: "rtc_answer",
        code: this.code,
        viewerId: this.viewerId,
        sdp: answer as MirrorRtcSdp,
      });
    } catch {
      // Relayed frames keep playing smoothly
    }
  }

  private startHttpPolling() {
    if (this.httpPollTimer || this.disposed || !this.code) return;
    this.httpPollTimer = setInterval(async () => {
      if (this.disposed || !this.code) return;
      try {
        const res = await fetch(
          `/api/mirror?code=${encodeURIComponent(this.code)}&viewerId=${encodeURIComponent(this.viewerId)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (data?.active && data.session) {
          if (data.session.meta) this.callbacks.onMeta?.(data.session.meta);
          if (data.session.latestFrame && data.session.seq !== this.lastSeq) {
            this.lastSeq = data.session.seq;
            this.callbacks.onStatus?.("live");
            this.callbacks.onFrame?.(data.session.latestFrame, data.session.meta);
          }
        } else if (data?.ok && !data.active && this.lastSeq > 0) {
          this.callbacks.onStatus?.("ended");
        }
      } catch {
        // ignore transient polling failure
      }
    }, 130);
  }

  private stopHttpPolling() {
    if (this.httpPollTimer) {
      clearInterval(this.httpPollTimer);
      this.httpPollTimer = null;
    }
  }

  private sendWs(msg: MirrorClientWsMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  public disconnect() {
    this.disposed = true;
    if (this.wsConnectTimer) clearTimeout(this.wsConnectTimer);
    this.stopHttpPolling();

    if (this.code) {
      this.sendWs({ type: "leave_viewer", code: this.code, viewerId: this.viewerId });
      fetch("/api/mirror", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave_viewer", code: this.code, viewerId: this.viewerId }),
      }).catch(() => {});
    }

    if (this.pc) {
      try {
        this.pc.close();
      } catch {
        // ignore
      }
      this.pc = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
    if (this.bc) {
      try {
        this.bc.close();
      } catch {
        // ignore
      }
      this.bc = null;
    }
    this.callbacks.onMediaStream?.(null);
  }
}
