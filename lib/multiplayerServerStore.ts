import {
  formatToMaxPlayers,
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

const STALE_PLAYER_MS = 20_000;
const PUBLIC_ROOM_CODE = "PUBLIC-COURT";

interface GlobalWithHoopsStore {
  __hoopsMultiplayerStore?: Map<string, MultiplayerRoomState>;
}

function getRoomMap(): Map<string, MultiplayerRoomState> {
  const g = globalThis as unknown as GlobalWithHoopsStore;
  if (!g.__hoopsMultiplayerStore) {
    g.__hoopsMultiplayerStore = new Map<string, MultiplayerRoomState>();
  }
  const map = g.__hoopsMultiplayerStore;
  if (!map.has(PUBLIC_ROOM_CODE)) {
    map.set(PUBLIC_ROOM_CODE, createEmptyRoom(PUBLIC_ROOM_CODE, "us_nyc", "match"));
  }
  return map;
}

export function sanitizeRoomCode(raw?: string): string {
  const cleaned = String(raw || PUBLIC_ROOM_CODE)
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 16);
  return cleaned.length >= 3 ? cleaned : PUBLIC_ROOM_CODE;
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "HOOP-";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createEmptyRoom(
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

export function pruneStalePlayers(room: MultiplayerRoomState, now = Date.now()): boolean {
  let changed = false;
  for (const [pid, player] of Object.entries(room.players)) {
    if (now - player.lastSeen > STALE_PLAYER_MS) {
      delete room.players[pid];
      changed = true;
    }
  }
  if (room.hostId && !room.players[room.hostId]) {
    const remainingIds = Object.keys(room.players);
    room.hostId = remainingIds.length > 0 ? remainingIds[0] : null;
    room.match.hostId = room.hostId;
    changed = true;
  }
  return changed;
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

export function joinRoom(input: JoinRoomInput): MultiplayerRoomState {
  const map = getRoomMap();
  const roomCode = sanitizeRoomCode(input.roomCode);
  let room = map.get(roomCode);
  if (!room) {
    room = createEmptyRoom(
      roomCode,
      input.cityId || "us_nyc",
      input.mode || "match",
      input.format || "5v5",
      Boolean(input.isPrivate),
      input.leagueDivision || "mens",
      input.competitionType || "pro"
    );
    map.set(roomCode, room);
  }

  const now = Date.now();
  pruneStalePlayers(room, now);

  const existing = room.players[input.playerId];
  if (existing) {
    existing.name = input.name || existing.name;
    existing.deviceType = input.deviceType || existing.deviceType;
    existing.jerseyColor = input.jerseyColor || existing.jerseyColor;
    existing.shortsColor = input.shortsColor || existing.shortsColor;
    existing.connected = true;
    existing.lastSeen = now;
  } else {
    const { team, slotIndex } = assignTeamAndSlot(room, input.preferredTeam);
    const startX = team === "Home" ? -8 + slotIndex * 1.1 : 8 - slotIndex * 1.1;
    const startZ = (slotIndex - 2) * 2.2;
    const player: RemotePlayerState = {
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
    room.players[input.playerId] = player;
  }

  if (!room.hostId || !room.players[room.hostId]) {
    room.hostId = input.playerId;
    room.match.hostId = input.playerId;
  }

  room.updatedAt = now;
  return room;
}

export function getRoom(roomCodeRaw?: string): MultiplayerRoomState {
  const map = getRoomMap();
  const roomCode = sanitizeRoomCode(roomCodeRaw);
  let room = map.get(roomCode);
  if (!room) {
    room = createEmptyRoom(roomCode);
    map.set(roomCode, room);
  }
  pruneStalePlayers(room);
  return room;
}

export function syncPlayerState(input: SyncStateInput): {
  room: MultiplayerRoomState;
  player: RemotePlayerState | null;
} {
  const map = getRoomMap();
  const roomCode = sanitizeRoomCode(input.roomCode);
  let room = map.get(roomCode);
  if (!room) {
    room = createEmptyRoom(roomCode);
    map.set(roomCode, room);
  }
  const now = Date.now();
  pruneStalePlayers(room, now);

  let player = room.players[input.playerId];
  if (!player) {
    joinRoom({
      roomCode,
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

  // Host (or any peer when host hasn't updated ball) can sync authoritative ball/clock
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

export function applyMatchEvent(input: MatchEventInput): {
  room: MultiplayerRoomState;
  event: MatchEventRecord;
} {
  const room = getRoom(input.roomCode);
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

export function leaveRoom(roomCodeRaw: string, playerId: string): MultiplayerRoomState | null {
  const map = getRoomMap();
  const roomCode = sanitizeRoomCode(roomCodeRaw);
  const room = map.get(roomCode);
  if (!room) return null;

  delete room.players[playerId];
  if (room.hostId === playerId) {
    const remaining = Object.keys(room.players);
    room.hostId = remaining.length > 0 ? remaining[0] : null;
    room.match.hostId = room.hostId;
  }
  room.updatedAt = Date.now();

  if (roomCode !== PUBLIC_ROOM_CODE && Object.keys(room.players).length === 0) {
    map.delete(roomCode);
    return null;
  }
  return room;
}

export function markPlayerDisconnected(roomCodeRaw: string, playerId: string): MultiplayerRoomState | null {
  const map = getRoomMap();
  const roomCode = sanitizeRoomCode(roomCodeRaw);
  const room = map.get(roomCode);
  if (!room) return null;
  const player = room.players[playerId];
  if (player) {
    player.connected = false;
    player.lastSeen = Date.now();
    if (room.hostId === playerId) {
      const nextConnected = Object.values(room.players).find((p) => p.connected && p.playerId !== playerId);
      if (nextConnected) {
        room.hostId = nextConnected.playerId;
        room.match.hostId = nextConnected.playerId;
      }
    }
    room.updatedAt = Date.now();
  }
  return room;
}

export function listPublicRooms(): MultiplayerRoomSummary[] {
  const map = getRoomMap();
  const now = Date.now();
  const summaries: MultiplayerRoomSummary[] = [];

  for (const [code, room] of map.entries()) {
    pruneStalePlayers(room, now);
    const players = Object.values(room.players);
    if (code !== PUBLIC_ROOM_CODE && players.length === 0 && now - room.updatedAt > 60_000) {
      map.delete(code);
      continue;
    }
    if (room.isPrivate) continue;
    const deviceSet = new Set<DeviceType>();
    for (const pl of players) deviceSet.add(pl.deviceType);
    summaries.push({
      roomCode: code,
      isPrivate: room.isPrivate,
      format: room.match.format || "5v5",
      playerCount: players.length,
      maxPlayers: formatToMaxPlayers(room.match.format),
      cityId: room.match.cityId,
      mode: room.match.mode,
      leagueDivision: room.match.leagueDivision || "mens",
      competitionType: room.match.competitionType || "pro",
      devices: Array.from(deviceSet),
    });
  }

  summaries.sort((a, b) => {
    if (a.roomCode === PUBLIC_ROOM_CODE) return -1;
    if (b.roomCode === PUBLIC_ROOM_CODE) return 1;
    return b.playerCount - a.playerCount;
  });
  return summaries;
}
