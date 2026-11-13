import { DurableObject } from "cloudflare:workers";
import type {
  ClientWsMessage,
  JoinRoomInput,
  MatchEventInput,
  MatchEventRecord,
  MultiplayerRoomState,
  SyncStateInput,
} from "./multiplayerTypes.ts";

const STALE_PLAYER_MS = 20_000;
const PUBLIC_ROOM_CODE = "PUBLIC-COURT";

export class HoopsRoom extends DurableObject {
  private state: DurableObjectState;
  private roomState: MultiplayerRoomState | null = null;

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
    this.state = ctx;
  }

  private async getRoomState(): Promise<MultiplayerRoomState> {
    if (this.roomState) return this.roomState;
    const stored = await this.state.storage.get<MultiplayerRoomState>("roomState");
    if (stored) {
      this.roomState = stored;
    } else {
      const now = Date.now();
      this.roomState = {
        roomCode: PUBLIC_ROOM_CODE,
        isPrivate: false,
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
          cityId: "us_nyc",
          mode: "match",
          format: "5v5",
          leagueDivision: "mens",
          competitionType: "pro",
          eventSeq: 0,
          finalResult: null,
        },
      };
    }
    return this.roomState;
  }

  private async saveRoomState() {
    if (this.roomState) {
      this.roomState.updatedAt = Date.now();
      await this.state.storage.put("roomState", this.roomState);
    }
  }

  private pruneStale(room: MultiplayerRoomState) {
    const now = Date.now();
    let changed = false;
    for (const [pid, player] of Object.entries(room.players)) {
      if (now - player.lastSeen > STALE_PLAYER_MS) {
        delete room.players[pid];
        changed = true;
      }
    }
    if (room.hostId && !room.players[room.hostId]) {
      const remaining = Object.keys(room.players);
      room.hostId = remaining.length > 0 ? remaining[0] : null;
      room.match.hostId = room.hostId;
      changed = true;
    }
    return changed;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const upgradeHeader = request.headers.get("Upgrade");

    if (upgradeHeader === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];

      this.ctx.acceptWebSocket(server);

      const room = await this.getRoomState();
      this.pruneStale(room);

      server.send(
        JSON.stringify({
          type: "room_snapshot",
          room,
          you: "",
          transport: "ws",
        })
      );

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    const room = await this.getRoomState();
    this.pruneStale(room);

    if (request.method === "GET") {
      return Response.json({ ok: true, room, transport: "cloudflare-do" });
    }

    if (request.method === "POST") {
      try {
        const body = (await request.json()) as any;
        const action = String(body?.action || "");

        if (action === "join" || action === "create") {
          const updatedRoom = this.applyJoin(room, body);
          this.roomState = updatedRoom;
          await this.saveRoomState();
          this.broadcast({ type: "room_snapshot", room: updatedRoom, you: "", transport: "ws" });
          return Response.json({ ok: true, room: updatedRoom, transport: "cloudflare-do" });
        }

        if (action === "sync") {
          const { room: updatedRoom, player } = this.applySync(room, body);
          this.roomState = updatedRoom;
          await this.saveRoomState();
          if (player) {
            this.broadcast({
              type: "peer_delta",
              roomCode: updatedRoom.roomCode,
              playerId: body.playerId,
              player,
              match: body.matchPatch,
            });
          }
          return Response.json({ ok: true, room: updatedRoom, player, transport: "cloudflare-do" });
        }

        if (action === "event") {
          const { room: updatedRoom, event } = this.applyEvent(room, body);
          this.roomState = updatedRoom;
          await this.saveRoomState();
          this.broadcast({
            type: "match_event",
            roomCode: updatedRoom.roomCode,
            event,
            match: updatedRoom.match,
          });
          return Response.json({ ok: true, room: updatedRoom, event, transport: "cloudflare-do" });
        }

        if (action === "leave") {
          const updatedRoom = this.applyLeave(room, body.playerId);
          this.roomState = updatedRoom;
          await this.saveRoomState();
          if (updatedRoom) {
            this.broadcast({ type: "room_snapshot", room: updatedRoom, you: "", transport: "ws" });
          }
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
      const msg = JSON.parse(typeof message === "string" ? message : new TextDecoder().decode(message)) as ClientWsMessage;
      const room = await this.getRoomState();

      if (msg.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", ts: msg.ts }));
        return;
      }

      if (msg.type === "join") {
        const updatedRoom = this.applyJoin(room, msg.payload);
        this.roomState = updatedRoom;
        await this.saveRoomState();
        ws.send(JSON.stringify({ type: "room_snapshot", room: updatedRoom, you: msg.payload.playerId, transport: "ws" }));
        this.broadcast(
          { type: "room_snapshot", room: updatedRoom, you: "", transport: "ws" },
          ws
        );
        return;
      }

      if (msg.type === "sync") {
        const { room: updatedRoom, player } = this.applySync(room, msg.payload);
        this.roomState = updatedRoom;
        await this.saveRoomState();
        if (player) {
          this.broadcast(
            {
              type: "peer_delta",
              roomCode: updatedRoom.roomCode,
              playerId: msg.payload.playerId,
              player,
              match: msg.payload.matchPatch,
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
        this.broadcast({
          type: "match_event",
          roomCode: updatedRoom.roomCode,
          event,
          match: updatedRoom.match,
        });
        return;
      }

      if (msg.type === "leave") {
        const updatedRoom = this.applyLeave(room, msg.payload.playerId);
        this.roomState = updatedRoom;
        await this.saveRoomState();
        if (updatedRoom) {
          this.broadcast({ type: "room_snapshot", room: updatedRoom, you: "", transport: "ws" });
        }
        return;
      }
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "Invalid message payload" }));
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    ws.close(code, reason);
  }

  async webSocketError(ws: WebSocket, error: unknown) {
    try {
      ws.close(1011, "WebSocket error");
    } catch {
      // ignore
    }
  }

  private broadcast(msg: any, excludeWs?: WebSocket) {
    const raw = JSON.stringify(msg);
    const sockets = this.ctx.getWebSockets();
    for (const ws of sockets) {
      if (ws !== excludeWs) {
        try {
          ws.send(raw);
        } catch {
          // ignore
        }
      }
    }
  }

  private applyJoin(room: MultiplayerRoomState, input: JoinRoomInput): MultiplayerRoomState {
    const now = Date.now();
    this.pruneStale(room);
    room.roomCode = input.roomCode || room.roomCode || PUBLIC_ROOM_CODE;
    if (typeof input.isPrivate === "boolean") room.isPrivate = input.isPrivate;
    if (input.leagueDivision && Object.keys(room.players).length === 0) {
      room.match.leagueDivision = input.leagueDivision;
    }
    if (input.competitionType && Object.keys(room.players).length === 0) {
      room.match.competitionType = input.competitionType;
    }

    const existing = room.players[input.playerId];
    if (existing) {
      existing.name = input.name || existing.name;
      existing.deviceType = input.deviceType || existing.deviceType;
      existing.jerseyColor = input.jerseyColor || existing.jerseyColor;
      existing.shortsColor = input.shortsColor || existing.shortsColor;
      existing.connected = true;
      existing.lastSeen = now;
    } else {
      const team = input.preferredTeam || (Object.keys(room.players).length % 2 === 0 ? "Home" : "Away");
      const slotIndex = Object.values(room.players).filter((p) => p.team === team).length;
      const startX = team === "Home" ? -8 + slotIndex * 1.1 : 8 - slotIndex * 1.1;
      const startZ = (slotIndex - 2) * 2.2;
      room.players[input.playerId] = {
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
        transform: { x: startX, y: 0, z: startZ, vx: 0, vz: 0, faceYaw: team === "Home" ? Math.PI / 2 : -Math.PI / 2, h: 0 },
        pts: 0,
        ast: 0,
        reb: 0,
      };
    }

    if (!room.hostId || !room.players[room.hostId]) {
      room.hostId = input.playerId;
      room.match.hostId = input.playerId;
    }
    room.updatedAt = now;
    return room;
  }

  private applySync(room: MultiplayerRoomState, input: SyncStateInput) {
    const now = Date.now();
    this.pruneStale(room);
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
      const remaining = Object.keys(room.players);
      room.hostId = remaining.length > 0 ? remaining[0] : null;
      room.match.hostId = room.hostId;
    }
    room.updatedAt = Date.now();
    return room;
  }
}
