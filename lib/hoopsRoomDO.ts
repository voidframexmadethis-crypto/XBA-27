import { DurableObject } from "cloudflare:workers";
import {
  formatToMaxPlayers,
  type ClientWsMessage,
  type DeviceType,
  type JoinRoomInput,
  type MatchEventInput,
  type MatchEventRecord,
  type MultiplayerFormat,
  type MultiplayerRoomState,
  type MultiplayerRoomSummary,
  type RemotePlayerState,
  type SyncStateInput,
  type TeamSide,
} from "./multiplayerTypes.ts";
import {
  GLOBAL_LOBBY_NAME,
  PUBLIC_ROOM_CODE,
  generateDoRoomCode,
  sanitizeDoRoomCode,
  type CloudflareMultiplayerEnv,
} from "./cloudflareMultiplayerRouter.ts";

const STALE_DISCONNECTED_MS = 35_000;
const STALE_SILENT_MS = 60_000;
const EMPTY_ROOM_TTL_MS = 120_000;

interface LobbyRoomEntry extends MultiplayerRoomSummary {
  updatedAt: number;
  hostId: string | null;
}

interface WsAttachment {
  playerId: string;
  roomCode: string;
}

function createDefaultRoomState(
  roomCode: string,
  cityId = "us_nyc",
  mode = "match",
  format: MultiplayerFormat = "5v5",
  isPrivate = false,
  leagueDivision: "mens" | "womens" = "mens",
  competitionType: "pro" | "international" | "allstar" | "streetball" = "pro"
): MultiplayerRoomState {
  const now = Date.now();
  return {
    roomCode,
    isPrivate,
    createdAt: now,
    updatedAt: now,
    hostId: null,
    players: {},
    match: {
      scoreHome: 0,
      scoreAway: 0,
      quarter: 1,
      gameClock: 720,
      shotClock: 24,
      ballPos: [0, 1.2, 0],
      ballVel: [0, 0, 0],
      ballMode: "dribble",
      ownerPlayerId: null,
      ownerEntityKey: "Home:0",
      hostId: null,
      cityId,
      mode,
      format,
      leagueDivision,
      competitionType,
      eventSeq: 0,
      finalResult: null,
    },
  };
}

function assignTeamAndSlot(
  room: MultiplayerRoomState,
  preferredTeam?: TeamSide
): { team: TeamSide; slotIndex: number } {
  const maxPerSide = Math.max(1, Math.floor(formatToMaxPlayers(room.match.format) / 2));
  const homeUsed = new Set<number>();
  const awayUsed = new Set<number>();
  for (const p of Object.values(room.players)) {
    if (p.team === "Home") homeUsed.add(p.slotIndex);
    else awayUsed.add(p.slotIndex);
  }

  let team: TeamSide;
  if (
    preferredTeam &&
    ((preferredTeam === "Home" && homeUsed.size < maxPerSide) ||
      (preferredTeam === "Away" && awayUsed.size < maxPerSide))
  ) {
    team = preferredTeam;
  } else {
    team = homeUsed.size <= awayUsed.size ? "Home" : "Away";
  }

  const used = team === "Home" ? homeUsed : awayUsed;
  for (let i = 0; i < maxPerSide; i++) {
    if (!used.has(i)) return { team, slotIndex: i };
  }
  return { team, slotIndex: used.size % maxPerSide };
}

function pickNextHostId(room: MultiplayerRoomState): string | null {
  const players = Object.values(room.players);
  if (players.length === 0) return null;
  const connected = players.filter((p) => p.connected);
  if (connected.length > 0) return connected[0].playerId;
  return players[0].playerId;
}

function toRoomSummary(room: MultiplayerRoomState): LobbyRoomEntry {
  const players = Object.values(room.players);
  const deviceSet = new Set<DeviceType>();
  for (const p of players) deviceSet.add(p.deviceType);
  return {
    roomCode: room.roomCode,
    isPrivate: room.isPrivate,
    format: room.match.format || "5v5",
    playerCount: players.length,
    maxPlayers: formatToMaxPlayers(room.match.format),
    cityId: room.match.cityId,
    mode: room.match.mode,
    leagueDivision: room.match.leagueDivision || "mens",
    competitionType: room.match.competitionType || "pro",
    devices: Array.from(deviceSet),
    updatedAt: room.updatedAt,
    hostId: room.hostId,
  };
}

function safeCloseSocket(ws: WebSocket, code?: number, reason?: string) {
  try {
    // WebSocket close frames only allow 1000 or 3000-4999 from application code
    const validCode =
      typeof code === "number" && (code === 1000 || (code >= 3000 && code <= 4999))
        ? code
        : 1000;
    ws.close(validCode, (reason || "Closed").slice(0, 120));
  } catch {
    // Socket may already be closed or closing
  }
}

export class HoopsLobby extends DurableObject<CloudflareMultiplayerEnv> {
  private roomsMap: Record<string, LobbyRoomEntry> | null = null;

  constructor(ctx: DurableObjectState, env: CloudflareMultiplayerEnv) {
    super(ctx, env);
  }

  private async getRooms(): Promise<Record<string, LobbyRoomEntry>> {
    if (this.roomsMap) return this.roomsMap;
    const stored = await this.ctx.storage.get<Record<string, LobbyRoomEntry>>("lobbyRooms");
    const map: Record<string, LobbyRoomEntry> = stored && typeof stored === "object" ? { ...stored } : {};
    if (!map[PUBLIC_ROOM_CODE]) {
      map[PUBLIC_ROOM_CODE] = {
        roomCode: PUBLIC_ROOM_CODE,
        isPrivate: false,
        format: "5v5",
        playerCount: 0,
        maxPlayers: 10,
        cityId: "us_nyc",
        mode: "match",
        leagueDivision: "mens",
        competitionType: "pro",
        devices: [],
        updatedAt: Date.now(),
        hostId: null,
      };
    }
    this.roomsMap = map;
    return map;
  }

  private async saveRooms(map: Record<string, LobbyRoomEntry>) {
    this.roomsMap = map;
    await this.ctx.storage.put("lobbyRooms", map);
  }

  private pruneExpired(map: Record<string, LobbyRoomEntry>, now = Date.now()): boolean {
    let dirty = false;
    for (const [code, entry] of Object.entries(map)) {
      if (code !== PUBLIC_ROOM_CODE && entry.playerCount === 0 && now - entry.updatedAt > EMPTY_ROOM_TTL_MS) {
        delete map[code];
        dirty = true;
      }
    }
    return dirty;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const map = await this.getRooms();
    const now = Date.now();
    const pruned = this.pruneExpired(map, now);

    if (request.method === "GET" || url.pathname.endsWith("/list")) {
      if (pruned) await this.saveRooms(map);
      const visible: MultiplayerRoomSummary[] = Object.values(map)
        .filter((r) => !r.isPrivate || r.roomCode === PUBLIC_ROOM_CODE)
        .map(({ updatedAt: _u, hostId: _h, ...summary }) => summary)
        .sort((a, b) => {
          if (a.roomCode === PUBLIC_ROOM_CODE) return -1;
          if (b.roomCode === PUBLIC_ROOM_CODE) return 1;
          return b.playerCount - a.playerCount;
        });
      return Response.json({ ok: true, rooms: visible, transport: "cloudflare-do" });
    }

    if (request.method === "POST") {
      try {
        const body = (await request.json().catch(() => ({}))) as any;

        if (url.pathname.endsWith("/reserve") || body?.action === "reserve") {
          let code = generateDoRoomCode();
          for (let attempt = 0; attempt < 8 && map[code]; attempt++) {
            code = generateDoRoomCode();
          }
          const fmt = (body?.format || "5v5") as MultiplayerFormat;
          map[code] = {
            roomCode: code,
            isPrivate: Boolean(body?.isPrivate),
            format: fmt,
            playerCount: 0,
            maxPlayers: formatToMaxPlayers(fmt),
            cityId: String(body?.cityId || "us_nyc"),
            mode: String(body?.mode || "match"),
            leagueDivision: body?.leagueDivision === "womens" ? "womens" : "mens",
            competitionType: body?.competitionType || "pro",
            devices: [],
            updatedAt: now,
            hostId: null,
          };
          await this.saveRooms(map);
          return Response.json({ ok: true, roomCode: code });
        }

        if (url.pathname.endsWith("/upsert") || body?.action === "upsert") {
          const entry = body?.summary as LobbyRoomEntry | undefined;
          if (entry && entry.roomCode) {
            const code = sanitizeDoRoomCode(entry.roomCode);
            map[code] = { ...entry, roomCode: code, updatedAt: entry.updatedAt || now };
            await this.saveRooms(map);
          }
          return Response.json({ ok: true });
        }

        if (url.pathname.endsWith("/remove") || body?.action === "remove") {
          const code = sanitizeDoRoomCode(body?.roomCode);
          if (code !== PUBLIC_ROOM_CODE && map[code]) {
            delete map[code];
            await this.saveRooms(map);
          }
          return Response.json({ ok: true });
        }

        return Response.json({ ok: false, error: "Unknown lobby action" }, { status: 400 });
      } catch (err) {
        return Response.json(
          { ok: false, error: err instanceof Error ? err.message : "Lobby error" },
          { status: 500 }
        );
      }
    }

    return Response.json({ ok: false, error: "Method not allowed" }, { status: 405 });
  }
}

export class HoopsRoom extends DurableObject<CloudflareMultiplayerEnv> {
  private roomState: MultiplayerRoomState | null = null;

  constructor(ctx: DurableObjectState, env: CloudflareMultiplayerEnv) {
    super(ctx, env);
  }

  private async getRoomState(preferredCode?: string): Promise<MultiplayerRoomState> {
    if (this.roomState) return this.roomState;
    const stored = await this.ctx.storage.get<MultiplayerRoomState>("roomState");
    if (stored) {
      this.roomState = stored;
    } else {
      const code = sanitizeDoRoomCode(preferredCode);
      this.roomState = createDefaultRoomState(code);
    }
    return this.roomState;
  }

  private async saveRoomState() {
    if (this.roomState) {
      this.roomState.updatedAt = Date.now();
      await this.ctx.storage.put("roomState", this.roomState);
    }
  }

  private async syncLobbyDirectory(room: MultiplayerRoomState | null, removedCode?: string) {
    if (!this.env?.HOOPS_LOBBY) return;
    try {
      const stub = this.env.HOOPS_LOBBY.get(this.env.HOOPS_LOBBY.idFromName(GLOBAL_LOBBY_NAME));
      if (!room || (room.roomCode !== PUBLIC_ROOM_CODE && Object.keys(room.players).length === 0)) {
        const code = room?.roomCode || removedCode;
        if (code && code !== PUBLIC_ROOM_CODE) {
          await stub.fetch("https://lobby.internal/remove", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "remove", roomCode: code }),
          });
          return;
        }
      }
      if (room) {
        await stub.fetch("https://lobby.internal/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "upsert", summary: toRoomSummary(room) }),
        });
      }
    } catch {
      // Non-fatal directory sync failure
    }
  }

  private async ensurePruneAlarm() {
    const existing = await this.ctx.storage.getAlarm();
    if (!existing) {
      await this.ctx.storage.setAlarm(Date.now() + 20_000);
    }
  }

  private pruneStale(room: MultiplayerRoomState, now = Date.now()): boolean {
    let changed = false;
    for (const [pid, player] of Object.entries(room.players)) {
      const ttl = player.connected ? STALE_SILENT_MS : STALE_DISCONNECTED_MS;
      if (now - player.lastSeen > ttl) {
        delete room.players[pid];
        changed = true;
      }
    }
    if (room.hostId && !room.players[room.hostId]) {
      room.hostId = pickNextHostId(room);
      room.match.hostId = room.hostId;
      changed = true;
    } else if (room.hostId && room.players[room.hostId] && !room.players[room.hostId].connected) {
      const activeReplacement = Object.values(room.players).find((p) => p.connected);
      if (activeReplacement) {
        room.hostId = activeReplacement.playerId;
        room.match.hostId = activeReplacement.playerId;
        changed = true;
      }
    }
    return changed;
  }

  async alarm() {
    const room = await this.getRoomState();
    const changed = this.pruneStale(room);
    if (changed) {
      await this.saveRoomState();
      await this.syncLobbyDirectory(room);
      this.broadcast({ type: "room_snapshot", room, you: "", transport: "ws" });
    }
    if (Object.keys(room.players).length > 0) {
      await this.ctx.storage.setAlarm(Date.now() + 20_000);
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const requestedRoomCode = sanitizeDoRoomCode(url.searchParams.get("room") || url.searchParams.get("roomCode"));
    const upgradeHeader = request.headers.get("Upgrade");

    if (upgradeHeader?.toLowerCase() === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];

      this.ctx.acceptWebSocket(server);

      const room = await this.getRoomState(requestedRoomCode);
      const playerIdParam = url.searchParams.get("playerId") || "";
      if (playerIdParam) {
        server.serializeAttachment({ playerId: playerIdParam, roomCode: room.roomCode } satisfies WsAttachment);
        if (room.players[playerIdParam]) {
          room.players[playerIdParam].connected = true;
          room.players[playerIdParam].lastSeen = Date.now();
          await this.saveRoomState();
        }
      }
      if (this.pruneStale(room)) {
        await this.saveRoomState();
      }

      server.send(
        JSON.stringify({
          type: "room_snapshot",
          room,
          you: playerIdParam,
          transport: "ws",
        })
      );

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    const room = await this.getRoomState(requestedRoomCode);
    if (this.pruneStale(room)) {
      await this.saveRoomState();
    }

    if (request.method === "GET") {
      return Response.json({ ok: true, room, transport: "cloudflare-do" });
    }

    if (request.method === "POST") {
      try {
        const body = (await request.json()) as any;
        const action = String(body?.action || "");

        if (action === "join" || action === "create") {
          const updatedRoom = this.applyJoin(room, {
            ...body,
            roomCode: body.roomCode || requestedRoomCode,
          });
          this.roomState = updatedRoom;
          await this.saveRoomState();
          await this.ensurePruneAlarm();
          this.ctx.waitUntil(this.syncLobbyDirectory(updatedRoom));
          this.broadcast({ type: "room_snapshot", room: updatedRoom, you: "", transport: "ws" });
          return Response.json({ ok: true, room: updatedRoom, transport: "cloudflare-do" });
        }

        if (action === "sync") {
          const { room: updatedRoom, player } = this.applySync(room, {
            ...body,
            roomCode: body.roomCode || requestedRoomCode,
          });
          this.roomState = updatedRoom;
          await this.saveRoomState();
          await this.ensurePruneAlarm();
          if (player) {
            this.broadcast({
              type: "peer_delta",
              roomCode: updatedRoom.roomCode,
              playerId: body.playerId,
              player,
              match: body.matchPatch ? updatedRoom.match : undefined,
            });
          }
          return Response.json({ ok: true, room: updatedRoom, player, transport: "cloudflare-do" });
        }

        if (action === "event") {
          const { room: updatedRoom, event } = this.applyEvent(room, {
            ...body,
            roomCode: body.roomCode || requestedRoomCode,
          });
          this.roomState = updatedRoom;
          await this.saveRoomState();
          if (
            body.type === "city_change" ||
            body.type === "mode_change" ||
            body.type === "tip_off" ||
            body.type === "match_finished"
          ) {
            this.ctx.waitUntil(this.syncLobbyDirectory(updatedRoom));
          }
          this.broadcast({
            type: "match_event",
            roomCode: updatedRoom.roomCode,
            event,
            match: updatedRoom.match,
          });
          return Response.json({ ok: true, room: updatedRoom, event, transport: "cloudflare-do" });
        }

        if (action === "leave") {
          const updatedRoom = this.applyLeave(room, String(body.playerId || ""));
          this.roomState = updatedRoom;
          await this.saveRoomState();
          this.ctx.waitUntil(this.syncLobbyDirectory(updatedRoom));
          this.broadcast({ type: "room_snapshot", room: updatedRoom, you: "", transport: "ws" });
          return Response.json({ ok: true, room: updatedRoom, transport: "cloudflare-do" });
        }

        return Response.json({ ok: false, error: "Unknown DO action" }, { status: 400 });
      } catch (err) {
        return Response.json(
          { ok: false, error: err instanceof Error ? err.message : "DO error" },
          { status: 500 }
        );
      }
    }

    return Response.json({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    try {
      const raw = typeof message === "string" ? message : new TextDecoder().decode(message);
      const msg = JSON.parse(raw) as ClientWsMessage;
      const att = (ws.deserializeAttachment() as WsAttachment | null) || null;
      const room = await this.getRoomState(att?.roomCode);

      if (msg.type === "ping") {
        if (att?.playerId && room.players[att.playerId]) {
          room.players[att.playerId].lastSeen = Date.now();
          room.players[att.playerId].connected = true;
        }
        ws.send(JSON.stringify({ type: "pong", ts: msg.ts }));
        return;
      }

      if (msg.type === "join") {
        const updatedRoom = this.applyJoin(room, {
          ...msg.payload,
          roomCode: msg.payload.roomCode || att?.roomCode || room.roomCode,
        });
        ws.serializeAttachment({
          playerId: msg.payload.playerId,
          roomCode: updatedRoom.roomCode,
        } satisfies WsAttachment);
        this.roomState = updatedRoom;
        await this.saveRoomState();
        await this.ensurePruneAlarm();
        this.ctx.waitUntil(this.syncLobbyDirectory(updatedRoom));
        ws.send(
          JSON.stringify({
            type: "room_snapshot",
            room: updatedRoom,
            you: msg.payload.playerId,
            transport: "ws",
          })
        );
        this.broadcast({ type: "room_snapshot", room: updatedRoom, you: "", transport: "ws" }, ws);
        return;
      }

      if (msg.type === "sync") {
        if (!att?.playerId) {
          ws.serializeAttachment({
            playerId: msg.payload.playerId,
            roomCode: msg.payload.roomCode || room.roomCode,
          } satisfies WsAttachment);
        }
        const { room: updatedRoom, player } = this.applySync(room, msg.payload);
        this.roomState = updatedRoom;
        await this.saveRoomState();
        await this.ensurePruneAlarm();
        if (player) {
          this.broadcast(
            {
              type: "peer_delta",
              roomCode: updatedRoom.roomCode,
              playerId: msg.payload.playerId,
              player,
              match: msg.payload.matchPatch ? updatedRoom.match : undefined,
            },
            ws
          );
        }
        return;
      }

      if (msg.type === "event") {
        const { room: updatedRoom, event } = this.applyEvent(room, msg.payload);
        this.roomState = updatedRoom;
        await this.saveRoomState();
        if (
          msg.payload.type === "city_change" ||
          msg.payload.type === "mode_change" ||
          msg.payload.type === "tip_off" ||
          msg.payload.type === "match_finished"
        ) {
          this.ctx.waitUntil(this.syncLobbyDirectory(updatedRoom));
        }
        this.broadcast({
          type: "match_event",
          roomCode: updatedRoom.roomCode,
          event,
          match: updatedRoom.match,
        });
        return;
      }

      if (msg.type === "leave") {
        ws.serializeAttachment({ playerId: "", roomCode: room.roomCode } satisfies WsAttachment);
        const updatedRoom = this.applyLeave(room, msg.payload.playerId);
        this.roomState = updatedRoom;
        await this.saveRoomState();
        this.ctx.waitUntil(this.syncLobbyDirectory(updatedRoom));
        this.broadcast({ type: "room_snapshot", room: updatedRoom, you: "", transport: "ws" }, ws);
        return;
      }
    } catch {
      try {
        ws.send(JSON.stringify({ type: "error", message: "Invalid message payload" }));
      } catch {
        // ignore send errors on broken socket
      }
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, _wasClean: boolean) {
    await this.handleSocketDisconnect(ws);
    safeCloseSocket(ws, code, reason);
  }

  async webSocketError(ws: WebSocket, _error: unknown) {
    await this.handleSocketDisconnect(ws);
    safeCloseSocket(ws, 1000, "WebSocket error");
  }

  private async handleSocketDisconnect(closedWs: WebSocket) {
    const att = (closedWs.deserializeAttachment() as WsAttachment | null) || null;
    if (!att?.playerId) return;

    const remainingSockets = this.ctx.getWebSockets();
    const stillConnected = remainingSockets.some((sock) => {
      if (sock === closedWs) return false;
      const otherAtt = sock.deserializeAttachment() as WsAttachment | null;
      return otherAtt?.playerId === att.playerId;
    });
    if (stillConnected) return;

    const room = await this.getRoomState(att.roomCode);
    const player = room.players[att.playerId];
    if (!player) return;

    player.connected = false;
    player.lastSeen = Date.now();
    if (room.hostId === att.playerId) {
      const nextConnected = Object.values(room.players).find((p) => p.connected && p.playerId !== att.playerId);
      if (nextConnected) {
        room.hostId = nextConnected.playerId;
        room.match.hostId = nextConnected.playerId;
      }
    }
    this.roomState = room;
    await this.saveRoomState();
    await this.ensurePruneAlarm();
    this.ctx.waitUntil(this.syncLobbyDirectory(room));
    this.broadcast({ type: "room_snapshot", room, you: "", transport: "ws" }, closedWs);
  }

  private broadcast(msg: unknown, excludeWs?: WebSocket) {
    const raw = JSON.stringify(msg);
    const sockets = this.ctx.getWebSockets();
    for (const ws of sockets) {
      if (ws !== excludeWs) {
        try {
          ws.send(raw);
        } catch {
          // ignore dead sockets
        }
      }
    }
  }

  private applyJoin(room: MultiplayerRoomState, input: JoinRoomInput): MultiplayerRoomState {
    const now = Date.now();
    this.pruneStale(room, now);
    room.roomCode = sanitizeDoRoomCode(input.roomCode || room.roomCode);
    const wasEmpty = Object.keys(room.players).length === 0;
    if (typeof input.isPrivate === "boolean" && (wasEmpty || room.roomCode !== PUBLIC_ROOM_CODE)) {
      room.isPrivate = input.isPrivate;
    }
    if (wasEmpty) {
      if (input.format) room.match.format = input.format;
      if (input.cityId) room.match.cityId = input.cityId;
      if (input.mode) room.match.mode = input.mode;
      if (input.leagueDivision) room.match.leagueDivision = input.leagueDivision;
      if (input.competitionType) room.match.competitionType = input.competitionType;
    }

    const existing = room.players[input.playerId];
    if (existing) {
      existing.name = (input.name || existing.name).slice(0, 28);
      existing.deviceType = input.deviceType || existing.deviceType;
      existing.jerseyColor = input.jerseyColor || existing.jerseyColor;
      existing.shortsColor = input.shortsColor || existing.shortsColor;
      existing.connected = true;
      existing.lastSeen = now;
    } else {
      const { team, slotIndex } = assignTeamAndSlot(room, input.preferredTeam);
      const startX = team === "Home" ? -8 + slotIndex * 1.1 : 8 - slotIndex * 1.1;
      const startZ = (slotIndex - 2) * 2.2;
      const newPlayer: RemotePlayerState = {
        playerId: input.playerId,
        name: (input.name || "Player").slice(0, 28),
        team,
        slotIndex,
        deviceType: input.deviceType || "desktop",
        jerseyColor: input.jerseyColor || (team === "Home" ? "#c8102e" : "#1d428a"),
        shortsColor: input.shortsColor || "#161616",
        ready: true,
        connected: true,
        lastSeen: now,
        transform: {
          x: startX,
          y: 0,
          z: startZ,
          vx: 0,
          vz: 0,
          faceYaw: team === "Home" ? Math.PI / 2 : -Math.PI / 2,
          h: 0,
        },
        pts: 0,
        ast: 0,
        reb: 0,
      };
      room.players[input.playerId] = newPlayer;
    }

    if (!room.hostId || !room.players[room.hostId] || !room.players[room.hostId].connected) {
      room.hostId = input.playerId;
      room.match.hostId = input.playerId;
    }
    room.updatedAt = now;
    return room;
  }

  private applySync(room: MultiplayerRoomState, input: SyncStateInput) {
    const now = Date.now();
    this.pruneStale(room, now);
    let player = room.players[input.playerId];
    if (!player) {
      this.applyJoin(room, {
        roomCode: input.roomCode,
        playerId: input.playerId,
        name: input.name || "Hooper",
        deviceType: input.deviceType || "desktop",
      });
      player = room.players[input.playerId];
    }
    if (player) {
      player.lastSeen = now;
      player.connected = true;
      if (input.name) player.name = input.name.slice(0, 28);
      if (input.deviceType) player.deviceType = input.deviceType;
      if (typeof input.ready === "boolean") player.ready = input.ready;
      if (input.transform) player.transform = input.transform;
      if (input.stats) {
        player.pts = input.stats.pts;
        player.ast = input.stats.ast;
        player.reb = input.stats.reb;
      }
    }

    if (!room.hostId || !room.players[room.hostId] || !room.players[room.hostId].connected) {
      room.hostId = input.playerId;
      room.match.hostId = input.playerId;
    }

    if (input.matchPatch) {
      const isHost = !room.hostId || room.hostId === input.playerId;
      if (isHost) {
        if (typeof input.matchPatch.scoreHome === "number") room.match.scoreHome = input.matchPatch.scoreHome;
        if (typeof input.matchPatch.scoreAway === "number") room.match.scoreAway = input.matchPatch.scoreAway;
        if (typeof input.matchPatch.quarter === "number") room.match.quarter = input.matchPatch.quarter;
        if (typeof input.matchPatch.gameClock === "number") room.match.gameClock = input.matchPatch.gameClock;
        if (typeof input.matchPatch.shotClock === "number") room.match.shotClock = input.matchPatch.shotClock;
        if (input.matchPatch.ballPos) room.match.ballPos = input.matchPatch.ballPos;
        if (input.matchPatch.ballVel) room.match.ballVel = input.matchPatch.ballVel;
        if (input.matchPatch.ballMode) room.match.ballMode = input.matchPatch.ballMode;
        if (input.matchPatch.ownerPlayerId !== undefined) room.match.ownerPlayerId = input.matchPatch.ownerPlayerId;
        if (input.matchPatch.ownerEntityKey !== undefined) room.match.ownerEntityKey = input.matchPatch.ownerEntityKey;
        if (input.matchPatch.cityId) room.match.cityId = input.matchPatch.cityId;
        if (input.matchPatch.mode) room.match.mode = input.matchPatch.mode;
        if (input.matchPatch.format) room.match.format = input.matchPatch.format;
        if (input.matchPatch.leagueDivision) room.match.leagueDivision = input.matchPatch.leagueDivision;
        if (input.matchPatch.competitionType) room.match.competitionType = input.matchPatch.competitionType;
      }
    }

    room.updatedAt = now;
    return { room, player: player || null };
  }

  private applyEvent(room: MultiplayerRoomState, input: MatchEventInput) {
    const now = Date.now();
    room.match.eventSeq += 1;
    const event: MatchEventRecord = {
      seq: room.match.eventSeq,
      type: input.type,
      playerId: input.playerId,
      payload: input.payload,
      ts: now,
    };
    room.match.lastEvent = event;

    const p = input.payload || {};
    if (input.type === "basket_scored") {
      if (typeof p.scoreHome === "number") room.match.scoreHome = p.scoreHome;
      if (typeof p.scoreAway === "number") room.match.scoreAway = p.scoreAway;
      if (typeof p.shotClock === "number") room.match.shotClock = p.shotClock;
    } else if (input.type === "tip_off") {
      room.match.scoreHome = 0;
      room.match.scoreAway = 0;
      room.match.quarter = 1;
      room.match.shotClock = 24;
      room.match.finalResult = null;
      if (typeof p.ownerEntityKey === "string") room.match.ownerEntityKey = p.ownerEntityKey;
    } else if (input.type === "city_change" && typeof p.cityId === "string") {
      room.match.cityId = p.cityId;
    } else if (input.type === "mode_change" && typeof p.mode === "string") {
      room.match.mode = p.mode;
    } else if (input.type === "reset_match") {
      room.match.scoreHome = 0;
      room.match.scoreAway = 0;
      room.match.quarter = 1;
      room.match.shotClock = 24;
      room.match.finalResult = null;
    } else if (input.type === "quarter_end" && typeof p.quarter === "number") {
      room.match.quarter = p.quarter;
    } else if (input.type === "match_finished") {
      const sh = typeof p.scoreHome === "number" ? p.scoreHome : room.match.scoreHome;
      const sa = typeof p.scoreAway === "number" ? p.scoreAway : room.match.scoreAway;
      room.match.scoreHome = sh;
      room.match.scoreAway = sa;
      room.match.finalResult = {
        winner: sh > sa ? "Home" : sa > sh ? "Away" : "Tie",
        scoreHome: sh,
        scoreAway: sa,
        finishedAt: now,
      };
    }

    room.updatedAt = now;
    return { room, event };
  }

  private applyLeave(room: MultiplayerRoomState, playerId: string) {
    delete room.players[playerId];
    if (room.hostId === playerId) {
      room.hostId = pickNextHostId(room);
      room.match.hostId = room.hostId;
    }
    room.updatedAt = Date.now();
    return room;
  }
}
