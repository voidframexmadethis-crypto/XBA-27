import type {
  ClientWsMessage,
  DeviceType,
  JoinRoomInput,
  MatchEventInput,
  MatchEventRecord,
  MatchSyncState,
  MultiplayerRoomState,
  MultiplayerRoomSummary,
  RemotePlayerState,
  ServerWsMessage,
  SyncStateInput,
} from "./multiplayerTypes";

export type ConnectionTransport = "disconnected" | "connecting" | "ws" | "http";

export interface MultiplayerCallbacks {
  onRoomSnapshot?: (room: MultiplayerRoomState) => void;
  onPeerDelta?: (playerId: string, player: RemotePlayerState, match?: Partial<MatchSyncState>) => void;
  onMatchEvent?: (event: MatchEventRecord, match: MatchSyncState) => void;
  onTransportChange?: (transport: ConnectionTransport, roomCode: string | null) => void;
}

export function detectDeviceType(): DeviceType {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/SmartTV|SMART-TV|Tizen|Web0S|WebOS|BRAVIA|AppleTV|Roku|FireTV|AFT|Android TV|GoogleTV|CrKey/i.test(ua)) {
    return "tv";
  }
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const minDim = Math.min(window.innerWidth, window.innerHeight);
  const maxDim = Math.max(window.innerWidth, window.innerHeight);
  if (hasTouch) {
    if (minDim >= 600 || /iPad|Tablet/i.test(ua)) return "tablet";
    return "phone";
  }
  if (maxDim >= 1800 && !hasTouch && /TV|Large/i.test(ua)) {
    return "tv";
  }
  return "desktop";
}

export function getOrCreateSessionPlayerId(): string {
  if (typeof window === "undefined") return `player_${Math.random().toString(36).slice(2, 10)}`;
  const key = "hoops_mp_player_id";
  let existing = sessionStorage.getItem(key);
  if (!existing) {
    existing = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    sessionStorage.setItem(key, existing);
  }
  return existing;
}

export class CrossPlayMultiplayerClient {
  public readonly playerId: string;
  public roomCode: string | null = null;
  public transport: ConnectionTransport = "disconnected";
  public currentRoom: MultiplayerRoomState | null = null;

  private ws: WebSocket | null = null;
  private httpPollTimer: ReturnType<typeof setInterval> | null = null;
  private wsRetryTimer: ReturnType<typeof setTimeout> | null = null;
  private wsConnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private joinPayload: JoinRoomInput | null = null;
  private pendingSync: SyncStateInput | null = null;
  private lastHttpSyncAt = 0;
  private lastSeenEventSeq = 0;
  private callbacks: MultiplayerCallbacks = {};
  private disposed = false;

  constructor(callbacks?: MultiplayerCallbacks) {
    this.playerId = getOrCreateSessionPlayerId();
    if (callbacks) this.callbacks = callbacks;
  }

  public setCallbacks(callbacks: MultiplayerCallbacks) {
    this.callbacks = callbacks;
  }

  private setTransport(next: ConnectionTransport) {
    if (this.transport !== next) {
      this.transport = next;
      this.callbacks.onTransportChange?.(next, this.roomCode);
    }
  }

  public async listRooms(): Promise<MultiplayerRoomSummary[]> {
    try {
      const res = await fetch("/api/multiplayer?action=list", { cache: "no-store" });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data?.rooms) ? data.rooms : [];
    } catch {
      return [];
    }
  }

  public async createAndJoinRoom(input: Omit<JoinRoomInput, "playerId" | "roomCode">): Promise<MultiplayerRoomState | null> {
    try {
      const res = await fetch("/api/multiplayer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          playerId: this.playerId,
          ...input,
        }),
      });
      const data = await res.json();
      if (data?.ok && data.room) {
        return await this.joinRoom({
          ...input,
          roomCode: data.room.roomCode,
        });
      }
    } catch {
      // Fallback to joining generated room directly
    }
    const fallbackCode = `HOOP-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    return await this.joinRoom({ ...input, roomCode: fallbackCode });
  }

  public async joinRoom(input: Omit<JoinRoomInput, "playerId">): Promise<MultiplayerRoomState | null> {
    this.disposed = false;
    const payload: JoinRoomInput = {
      ...input,
      playerId: this.playerId,
      roomCode: input.roomCode || "PUBLIC-COURT",
    };
    this.joinPayload = payload;
    this.roomCode = payload.roomCode || "PUBLIC-COURT";
    this.lastSeenEventSeq = 0;
    this.setTransport("connecting");

    // Step 1: Always register via HTTP immediately so the room state exists right away
    let initialRoom: MultiplayerRoomState | null = null;
    try {
      const res = await fetch("/api/multiplayer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", ...payload }),
      });
      const data = await res.json();
      if (data?.ok && data.room) {
        initialRoom = data.room as MultiplayerRoomState;
        this.roomCode = initialRoom.roomCode;
        this.currentRoom = initialRoom;
        this.lastSeenEventSeq = initialRoom.match.eventSeq || 0;
        this.callbacks.onRoomSnapshot?.(initialRoom);
      }
    } catch {
      // WebSocket attempt below will still run
    }

    // Step 2: Try upgrading to low-latency WebSocket; fall back smoothly to HTTP polling if WS fails
    this.openWebSocket(payload);
    return initialRoom;
  }

  private openWebSocket(payload: JoinRoomInput) {
    if (typeof window === "undefined" || this.disposed) return;

    this.clearTimers();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${proto}//${window.location.host}/ws/multiplayer`;

    let opened = false;
    try {
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      this.wsConnectTimeout = setTimeout(() => {
        if (!opened && !this.disposed) {
          try {
            ws.close();
          } catch {
            // ignore
          }
          this.activateHttpFallback();
        }
      }, 2400);

      ws.onopen = () => {
        opened = true;
        if (this.wsConnectTimeout) clearTimeout(this.wsConnectTimeout);
        this.stopHttpFallback();
        this.setTransport("ws");
        this.sendWs({ type: "join", payload });
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(String(evt.data)) as ServerWsMessage;
          if (msg.type === "room_snapshot") {
            this.currentRoom = msg.room;
            this.roomCode = msg.room.roomCode;
            this.callbacks.onRoomSnapshot?.(msg.room);
          } else if (msg.type === "peer_delta") {
            if (this.currentRoom && msg.roomCode === this.currentRoom.roomCode) {
              this.currentRoom.players[msg.playerId] = msg.player;
              if (msg.match) {
                Object.assign(this.currentRoom.match, msg.match);
              }
            }
            this.callbacks.onPeerDelta?.(msg.playerId, msg.player, msg.match);
          } else if (msg.type === "match_event") {
            if (this.currentRoom && msg.roomCode === this.currentRoom.roomCode) {
              this.currentRoom.match = msg.match;
            }
            if (msg.event.seq > this.lastSeenEventSeq) {
              this.lastSeenEventSeq = msg.event.seq;
              this.callbacks.onMatchEvent?.(msg.event, msg.match);
            }
          }
        } catch {
          // ignore malformed packet
        }
      };

      ws.onerror = () => {
        if (!opened && !this.disposed) {
          this.activateHttpFallback();
        }
      };

      ws.onclose = () => {
        if (this.wsConnectTimeout) clearTimeout(this.wsConnectTimeout);
        if (!this.disposed && this.joinPayload) {
          this.activateHttpFallback();
          // Retry WS gently every 12 seconds while keeping HTTP live
          this.wsRetryTimer = setTimeout(() => {
            if (!this.disposed && this.joinPayload && this.transport === "http") {
              this.openWebSocket(this.joinPayload);
            }
          }, 12_000);
        }
      };
    } catch {
      this.activateHttpFallback();
    }
  }

  private activateHttpFallback() {
    if (this.disposed || !this.roomCode) return;
    this.setTransport("http");
    if (this.httpPollTimer) return;

    this.httpPollTimer = setInterval(async () => {
      if (this.disposed || !this.roomCode || this.transport !== "http") return;
      try {
        const now = Date.now();
        let room: MultiplayerRoomState | null = null;

        if (this.pendingSync && now - this.lastHttpSyncAt >= 90) {
          const syncPayload = this.pendingSync;
          this.pendingSync = null;
          this.lastHttpSyncAt = now;
          const res = await fetch("/api/multiplayer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "sync", ...syncPayload }),
          });
          const data = await res.json();
          if (data?.ok && data.room) room = data.room;
        } else {
          const res = await fetch(`/api/multiplayer?room=${encodeURIComponent(this.roomCode)}`, {
            cache: "no-store",
          });
          const data = await res.json();
          if (data?.ok && data.room) room = data.room;
        }

        if (room) {
          this.currentRoom = room;
          this.callbacks.onRoomSnapshot?.(room);
          if (room.match.lastEvent && room.match.lastEvent.seq > this.lastSeenEventSeq) {
            this.lastSeenEventSeq = room.match.lastEvent.seq;
            this.callbacks.onMatchEvent?.(room.match.lastEvent, room.match);
          }
        }
      } catch {
        // Keep trying smoothly
      }
    }, 110);
  }

  private stopHttpFallback() {
    if (this.httpPollTimer) {
      clearInterval(this.httpPollTimer);
      this.httpPollTimer = null;
    }
  }

  private clearTimers() {
    if (this.wsConnectTimeout) {
      clearTimeout(this.wsConnectTimeout);
      this.wsConnectTimeout = null;
    }
    if (this.wsRetryTimer) {
      clearTimeout(this.wsRetryTimer);
      this.wsRetryTimer = null;
    }
    this.stopHttpFallback();
  }

  private sendWs(msg: ClientWsMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }

  public sendSync(input: Omit<SyncStateInput, "roomCode" | "playerId">) {
    if (!this.roomCode) return;
    const payload: SyncStateInput = {
      ...input,
      roomCode: this.roomCode,
      playerId: this.playerId,
    };
    if (!this.sendWs({ type: "sync", payload })) {
      this.pendingSync = payload;
    }
  }

  public async sendEvent(type: MatchEventRecord["type"], payloadData?: Record<string, unknown>) {
    if (!this.roomCode) return;
    const eventInput: MatchEventInput = {
      roomCode: this.roomCode,
      playerId: this.playerId,
      type,
      payload: payloadData,
    };
    if (!this.sendWs({ type: "event", payload: eventInput })) {
      try {
        await fetch("/api/multiplayer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "event", ...eventInput }),
        });
      } catch {
        // ignore transient network failure
      }
    }
  }

  public async leaveRoom() {
    const code = this.roomCode;
    this.disposed = true;
    this.joinPayload = null;
    this.roomCode = null;
    this.currentRoom = null;
    this.clearTimers();

    if (code) {
      this.sendWs({ type: "leave", payload: { roomCode: code, playerId: this.playerId } });
      try {
        await fetch("/api/multiplayer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "leave", roomCode: code, playerId: this.playerId }),
        });
      } catch {
        // ignore
      }
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
    this.setTransport("disconnected");
  }
}
