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
} from "./multiplayerTypes.ts";
import {
  applyOfflineMatchEvent,
  createOfflineBusChannel,
  createOfflineRoom,
  joinOfflineRoom,
  leaveOfflineRoom,
  listOfflineRooms,
  saveOfflineRoomSnapshot,
  syncOfflinePlayerState,
  type OfflineBusMessage,
} from "./offlineMultiplayerStore.ts";

export type ConnectionTransport = "disconnected" | "connecting" | "ws" | "http" | "offline-local";

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

function isBrowserOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = 2200): Promise<Response> {
  if (typeof AbortController === "undefined") {
    return fetch(url, init);
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export class CrossPlayMultiplayerClient {
  public readonly playerId: string;
  public roomCode: string | null = null;
  public transport: ConnectionTransport = "disconnected";
  public currentRoom: MultiplayerRoomState | null = null;

  private ws: WebSocket | null = null;
  private httpPollTimer: ReturnType<typeof setInterval> | null = null;
  private offlineProbeTimer: ReturnType<typeof setInterval> | null = null;
  private offlineSyncTimer: ReturnType<typeof setInterval> | null = null;
  private wsRetryTimer: ReturnType<typeof setTimeout> | null = null;
  private wsConnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private bus: BroadcastChannel | null = null;
  private storageListener: ((ev: StorageEvent) => void) | null = null;
  private onlineListener: (() => void) | null = null;
  private offlineListener: (() => void) | null = null;

  private joinPayload: JoinRoomInput | null = null;
  private pendingSync: SyncStateInput | null = null;
  private pendingEvents: MatchEventInput[] = [];
  private httpFailureStreak = 0;
  private lastHttpSyncAt = 0;
  private lastOfflineSyncAt = 0;
  private lastSeenEventSeq = 0;
  private callbacks: MultiplayerCallbacks = {};
  private disposed = false;

  constructor(callbacks?: MultiplayerCallbacks) {
    this.playerId = getOrCreateSessionPlayerId();
    if (callbacks) this.callbacks = callbacks;
    this.bindConnectivityListeners();
  }

  public setCallbacks(callbacks: MultiplayerCallbacks) {
    this.callbacks = callbacks;
  }

  private bindConnectivityListeners() {
    if (typeof window === "undefined") return;
    this.onlineListener = () => {
      if (!this.disposed && this.joinPayload && this.transport === "offline-local") {
        this.attemptOnlineUpgrade();
      }
    };
    this.offlineListener = () => {
      if (!this.disposed && this.joinPayload && this.roomCode) {
        this.activateOfflineFallback();
      }
    };
    window.addEventListener("online", this.onlineListener);
    window.addEventListener("offline", this.offlineListener);
  }

  private setTransport(next: ConnectionTransport) {
    if (this.transport !== next) {
      this.transport = next;
      this.callbacks.onTransportChange?.(next, this.roomCode);
    }
  }

  public async listRooms(): Promise<MultiplayerRoomSummary[]> {
    const localRooms = listOfflineRooms();
    if (isBrowserOffline()) {
      return localRooms;
    }
    try {
      const res = await fetchWithTimeout("/api/multiplayer?action=list", { cache: "no-store" }, 1800);
      if (!res.ok) return localRooms;
      const data = await res.json();
      const onlineRooms: MultiplayerRoomSummary[] = Array.isArray(data?.rooms) ? data.rooms : [];
      if (onlineRooms.length === 0) return localRooms;
      // Merge online rooms with any locally hosted offline rooms (preserving unique roomCodes)
      const byCode = new Map<string, MultiplayerRoomSummary>();
      for (const rm of onlineRooms) byCode.set(rm.roomCode, rm);
      for (const localRm of localRooms) {
        if (!byCode.has(localRm.roomCode)) byCode.set(localRm.roomCode, localRm);
      }
      return Array.from(byCode.values());
    } catch {
      return localRooms;
    }
  }

  public async createAndJoinRoom(
    input: Omit<JoinRoomInput, "playerId" | "roomCode">
  ): Promise<MultiplayerRoomState | null> {
    if (!isBrowserOffline()) {
      try {
        const res = await fetchWithTimeout(
          "/api/multiplayer",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "create",
              playerId: this.playerId,
              ...input,
            }),
          },
          2200
        );
        const data = await res.json();
        if (data?.ok && data.room) {
          saveOfflineRoomSnapshot(data.room as MultiplayerRoomState);
          return await this.joinRoom({
            ...input,
            roomCode: data.room.roomCode,
          });
        }
      } catch {
        // Offline / unreachable -> create locally below
      }
    }

    const offlineRoom = createOfflineRoom({
      ...input,
      playerId: this.playerId,
    });
    return await this.joinRoom({
      ...input,
      roomCode: offlineRoom.roomCode,
    });
  }

  public async joinRoom(input: Omit<JoinRoomInput, "playerId">): Promise<MultiplayerRoomState | null> {
    this.disposed = false;
    const payload: JoinRoomInput = {
      ...input,
      playerId: this.playerId,
      roomCode: (input.roomCode || "PUBLIC-COURT").toUpperCase(),
    };
    this.joinPayload = payload;
    this.roomCode = payload.roomCode || "PUBLIC-COURT";
    this.lastSeenEventSeq = 0;
    this.httpFailureStreak = 0;
    this.setTransport("connecting");

    // Step 1: Always register in local offline store immediately so room is guaranteed available offline & online
    const localSnapshot = joinOfflineRoom(payload);
    this.currentRoom = localSnapshot;
    saveOfflineRoomSnapshot(localSnapshot);

    // If explicitly offline, enter offline-local multiplayer immediately without waiting on network timeouts
    if (isBrowserOffline()) {
      this.activateOfflineFallback();
      this.callbacks.onRoomSnapshot?.(localSnapshot);
      return localSnapshot;
    }

    // Step 2: Register via HTTP with fast timeout so Cloudflare DO / Node room state initializes immediately
    let onlineRegistered = false;
    try {
      const res = await fetchWithTimeout(
        `/api/multiplayer?room=${encodeURIComponent(this.roomCode)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "join", ...payload }),
        },
        2200
      );
      const data = await res.json();
      if (data?.ok && data.room) {
        onlineRegistered = true;
        const room = data.room as MultiplayerRoomState;
        this.roomCode = room.roomCode;
        this.currentRoom = room;
        this.lastSeenEventSeq = room.match.eventSeq || 0;
        saveOfflineRoomSnapshot(room);
        this.callbacks.onRoomSnapshot?.(room);
      }
    } catch {
      // WebSocket attempt below or offline fallback will handle it
    }

    // Step 3: Attempt low-latency WebSocket upgrade (with query ?room= for Cloudflare Durable Objects)
    this.openWebSocket(payload, onlineRegistered);
    return this.currentRoom;
  }

  private openWebSocket(payload: JoinRoomInput, onlineRegistered = false) {
    if (typeof window === "undefined" || this.disposed) return;

    if (isBrowserOffline()) {
      this.activateOfflineFallback();
      return;
    }

    this.clearNetworkTimers();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }

    const roomCode = payload.roomCode || this.roomCode || "PUBLIC-COURT";
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${proto}//${window.location.host}/ws/multiplayer?room=${encodeURIComponent(roomCode)}`;

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
          if (onlineRegistered) {
            this.activateHttpFallback();
          } else {
            this.activateOfflineFallback();
          }
        }
      }, 2400);

      ws.onopen = () => {
        opened = true;
        this.httpFailureStreak = 0;
        if (this.wsConnectTimeout) clearTimeout(this.wsConnectTimeout);
        this.stopOfflineFallback();
        this.stopHttpFallback();
        this.setTransport("ws");
        this.sendWs({ type: "join", payload });
        this.flushPendingEvents();
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(String(evt.data)) as ServerWsMessage;
          if (msg.type === "room_snapshot") {
            this.currentRoom = msg.room;
            this.roomCode = msg.room.roomCode;
            saveOfflineRoomSnapshot(msg.room);
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
              saveOfflineRoomSnapshot(this.currentRoom);
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
          if (onlineRegistered) this.activateHttpFallback();
          else this.activateOfflineFallback();
        }
      };

      ws.onclose = () => {
        if (this.wsConnectTimeout) clearTimeout(this.wsConnectTimeout);
        if (!this.disposed && this.joinPayload) {
          if (isBrowserOffline()) {
            this.activateOfflineFallback();
          } else {
            this.activateHttpFallback();
            this.wsRetryTimer = setTimeout(() => {
              if (!this.disposed && this.joinPayload && this.transport === "http") {
                this.openWebSocket(this.joinPayload, true);
              }
            }, 12_000);
          }
        }
      };
    } catch {
      if (onlineRegistered) this.activateHttpFallback();
      else this.activateOfflineFallback();
    }
  }

  private activateHttpFallback() {
    if (this.disposed || !this.roomCode) return;
    if (isBrowserOffline()) {
      this.activateOfflineFallback();
      return;
    }
    this.stopOfflineFallback();
    this.setTransport("http");
    if (this.httpPollTimer) return;

    this.httpPollTimer = setInterval(async () => {
      if (this.disposed || !this.roomCode || this.transport !== "http") return;
      if (isBrowserOffline()) {
        this.activateOfflineFallback();
        return;
      }
      try {
        const now = Date.now();
        let room: MultiplayerRoomState | null = null;

        if (this.pendingSync && now - this.lastHttpSyncAt >= 90) {
          const syncPayload = this.pendingSync;
          this.pendingSync = null;
          this.lastHttpSyncAt = now;
          const res = await fetchWithTimeout(
            `/api/multiplayer?room=${encodeURIComponent(this.roomCode)}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "sync", ...syncPayload }),
            },
            2000
          );
          if (!res.ok) throw new Error("HTTP sync failed");
          const data = await res.json();
          if (data?.ok && data.room) room = data.room;
        } else {
          const res = await fetchWithTimeout(
            `/api/multiplayer?room=${encodeURIComponent(this.roomCode)}`,
            { cache: "no-store" },
            2000
          );
          if (!res.ok) throw new Error("HTTP poll failed");
          const data = await res.json();
          if (data?.ok && data.room) room = data.room;
        }

        if (room) {
          this.httpFailureStreak = 0;
          if (!room.players[this.playerId] && this.joinPayload) {
            const rejoinRes = await fetchWithTimeout(
              `/api/multiplayer?room=${encodeURIComponent(this.roomCode)}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "join", ...this.joinPayload }),
              },
              2000
            );
            const rejoinData = await rejoinRes.json();
            if (rejoinData?.ok && rejoinData.room) {
              room = rejoinData.room as MultiplayerRoomState;
            }
          }
          if (room) {
            this.currentRoom = room;
            saveOfflineRoomSnapshot(room);
            this.callbacks.onRoomSnapshot?.(room);
            if (room.match.lastEvent && room.match.lastEvent.seq > this.lastSeenEventSeq) {
              this.lastSeenEventSeq = room.match.lastEvent.seq;
              this.callbacks.onMatchEvent?.(room.match.lastEvent, room.match);
            }
            this.flushPendingEvents();
          }
        }
      } catch {
        this.httpFailureStreak += 1;
        // After 3 consecutive unreachable HTTP checks, drop gracefully into offline-local mode
        if (this.httpFailureStreak >= 3) {
          this.activateOfflineFallback();
        }
      }
    }, 110);
  }

  private activateOfflineFallback() {
    if (this.disposed || !this.roomCode) return;
    this.stopHttpFallback();
    this.setTransport("offline-local");

    // Ensure local room contains this player cleanly
    if (this.joinPayload) {
      const localRoom = joinOfflineRoom(this.joinPayload);
      this.currentRoom = localRoom;
      this.callbacks.onRoomSnapshot?.(localRoom);
    }

    // Bind real-time BroadcastChannel for cross-tab offline multiplayer on same device
    if (!this.bus) {
      const ch = createOfflineBusChannel();
      if (ch) {
        this.bus = ch;
        ch.onmessage = (evt) => {
          const msg = evt.data as OfflineBusMessage | undefined;
          if (!msg || msg.senderId === this.playerId || this.disposed) return;
          if (msg.kind === "room_snapshot" && msg.room.roomCode === this.roomCode) {
            this.currentRoom = msg.room;
            saveOfflineRoomSnapshot(msg.room);
            this.callbacks.onRoomSnapshot?.(msg.room);
          } else if (msg.kind === "peer_delta" && msg.roomCode === this.roomCode) {
            if (this.currentRoom) {
              this.currentRoom.players[msg.playerId] = msg.player;
              if (msg.match) Object.assign(this.currentRoom.match, msg.match);
            }
            this.callbacks.onPeerDelta?.(msg.playerId, msg.player, msg.match);
          } else if (msg.kind === "match_event" && msg.roomCode === this.roomCode) {
            if (this.currentRoom) {
              this.currentRoom.match = msg.match;
              saveOfflineRoomSnapshot(this.currentRoom);
            }
            if (msg.event.seq > this.lastSeenEventSeq) {
              this.lastSeenEventSeq = msg.event.seq;
              this.callbacks.onMatchEvent?.(msg.event, msg.match);
            }
          }
        };
      }
    }

    // Broadcast presence immediately to any other offline open browser tabs
    if (this.currentRoom) {
      this.postOfflineBus({
        kind: "room_snapshot",
        room: this.currentRoom,
        senderId: this.playerId,
      });
    }

    // Storage event listener fallback for browsers without BroadcastChannel
    if (typeof window !== "undefined" && !this.storageListener) {
      this.storageListener = (ev: StorageEvent) => {
        if (ev.key !== "hoops_mp_offline_rooms_v1" || !ev.newValue || !this.roomCode || this.disposed) return;
        try {
          const map = JSON.parse(ev.newValue) as Record<string, MultiplayerRoomState>;
          const updated = map[this.roomCode];
          if (updated && updated.updatedAt !== this.currentRoom?.updatedAt) {
            this.currentRoom = updated;
            this.callbacks.onRoomSnapshot?.(updated);
          }
        } catch {
          // ignore
        }
      };
      window.addEventListener("storage", this.storageListener);
    }

    // Flush offline pendingSync every 100ms across tabs
    if (!this.offlineSyncTimer) {
      this.offlineSyncTimer = setInterval(() => {
        if (this.disposed || this.transport !== "offline-local" || !this.roomCode) return;
        const now = Date.now();
        if (this.pendingSync && now - this.lastOfflineSyncAt >= 90) {
          const payload = this.pendingSync;
          this.pendingSync = null;
          this.lastOfflineSyncAt = now;
          const { room, player } = syncOfflinePlayerState(payload);
          this.currentRoom = room;
          if (player) {
            this.postOfflineBus({
              kind: "peer_delta",
              roomCode: room.roomCode,
              playerId: this.playerId,
              player,
              match: payload.matchPatch,
              senderId: this.playerId,
            });
          }
        }
      }, 100);
    }

    // Gently probe server every 8 seconds so online play seamlessly resumes when connection returns
    if (!this.offlineProbeTimer) {
      this.offlineProbeTimer = setInterval(() => {
        if (this.disposed || this.transport !== "offline-local" || !this.joinPayload) return;
        if (!isBrowserOffline()) {
          this.attemptOnlineUpgrade();
        }
      }, 8000);
    }
  }

  private async attemptOnlineUpgrade() {
    if (this.disposed || !this.joinPayload || !this.roomCode || isBrowserOffline()) return;
    try {
      const res = await fetchWithTimeout(
        `/api/multiplayer?room=${encodeURIComponent(this.roomCode)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "join", ...this.joinPayload }),
        },
        1800
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data?.ok && data.room) {
        this.httpFailureStreak = 0;
        this.stopOfflineFallback();
        this.currentRoom = data.room as MultiplayerRoomState;
        this.callbacks.onRoomSnapshot?.(this.currentRoom);
        this.openWebSocket(this.joinPayload, true);
      }
    } catch {
      // Still offline; remain smoothly in offline-local mode
    }
  }

  private postOfflineBus(msg: OfflineBusMessage) {
    try {
      this.bus?.postMessage(msg);
    } catch {
      // ignore closed channel
    }
  }

  private stopHttpFallback() {
    if (this.httpPollTimer) {
      clearInterval(this.httpPollTimer);
      this.httpPollTimer = null;
    }
  }

  private stopOfflineFallback() {
    if (this.offlineProbeTimer) {
      clearInterval(this.offlineProbeTimer);
      this.offlineProbeTimer = null;
    }
    if (this.offlineSyncTimer) {
      clearInterval(this.offlineSyncTimer);
      this.offlineSyncTimer = null;
    }
    if (this.bus) {
      try {
        this.bus.close();
      } catch {
        // ignore
      }
      this.bus = null;
    }
    if (typeof window !== "undefined" && this.storageListener) {
      window.removeEventListener("storage", this.storageListener);
      this.storageListener = null;
    }
  }

  private clearNetworkTimers() {
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

  private async flushPendingEvents() {
    if (this.pendingEvents.length === 0) return;
    const queued = this.pendingEvents.splice(0, this.pendingEvents.length);
    for (const evt of queued) {
      if (this.sendWs({ type: "event", payload: evt })) continue;
      try {
        await fetchWithTimeout(
          `/api/multiplayer?room=${encodeURIComponent(evt.roomCode)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "event", ...evt }),
          },
          1800
        );
      } catch {
        this.pendingEvents.push(evt);
        break;
      }
    }
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

    if (this.transport === "offline-local" || isBrowserOffline()) {
      const { room, event } = applyOfflineMatchEvent(eventInput);
      this.currentRoom = room;
      this.postOfflineBus({
        kind: "match_event",
        roomCode: room.roomCode,
        event,
        match: room.match,
        senderId: this.playerId,
      });
      if (this.pendingEvents.length < 32) {
        this.pendingEvents.push(eventInput);
      }
      return;
    }

    if (!this.sendWs({ type: "event", payload: eventInput })) {
      try {
        const res = await fetchWithTimeout(
          `/api/multiplayer?room=${encodeURIComponent(this.roomCode)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "event", ...eventInput }),
          },
          2000
        );
        if (!res.ok) throw new Error("HTTP event failed");
      } catch {
        // Mirror locally and queue for server sync when network recovers
        const { room, event } = applyOfflineMatchEvent(eventInput);
        this.currentRoom = room;
        this.postOfflineBus({
          kind: "match_event",
          roomCode: room.roomCode,
          event,
          match: room.match,
          senderId: this.playerId,
        });
        if (this.pendingEvents.length < 32) {
          this.pendingEvents.push(eventInput);
        }
      }
    }
  }

  public async leaveRoom() {
    const code = this.roomCode;
    this.disposed = true;
    this.joinPayload = null;
    this.roomCode = null;
    this.currentRoom = null;
    this.pendingEvents = [];
    this.clearNetworkTimers();
    this.stopOfflineFallback();

    if (code) {
      const updated = leaveOfflineRoom(code, this.playerId);
      if (updated) {
        this.postOfflineBus({
          kind: "room_snapshot",
          room: updated,
          senderId: this.playerId,
        });
      }
      this.sendWs({ type: "leave", payload: { roomCode: code, playerId: this.playerId } });
      if (!isBrowserOffline()) {
        try {
          await fetchWithTimeout(
            `/api/multiplayer?room=${encodeURIComponent(code)}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "leave", roomCode: code, playerId: this.playerId }),
            },
            1500
          );
        } catch {
          // ignore
        }
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

  public destroy() {
    if (typeof window !== "undefined") {
      if (this.onlineListener) window.removeEventListener("online", this.onlineListener);
      if (this.offlineListener) window.removeEventListener("offline", this.offlineListener);
    }
    this.disposed = true;
    this.clearNetworkTimers();
    this.stopOfflineFallback();
  }
}
