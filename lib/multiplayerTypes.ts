export type DeviceType = "phone" | "tablet" | "desktop" | "tv";

export type InputPreference = "auto" | "touch" | "keyboard" | "gamepad" | "tv";

export type TeamSide = "Home" | "Away";

export interface PoseSnapshot {
  hipR: number;
  hipL: number;
  kneeR: number;
  kneeL: number;
  shR: number;
  shL: number;
  elR: number;
  elL: number;
  lean: number;
  crouch: number;
}

export interface PlayerTransform {
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  faceYaw: number;
  h: number;
  pose?: PoseSnapshot;
  activeMove?: string;
}

export interface RemotePlayerState {
  playerId: string;
  name: string;
  team: TeamSide;
  slotIndex: number;
  deviceType: DeviceType;
  jerseyColor: string;
  shortsColor: string;
  ready: boolean;
  connected: boolean;
  lastSeen: number;
  transform: PlayerTransform;
  pts: number;
  ast: number;
  reb: number;
}

export interface MatchEventRecord {
  seq: number;
  type: "basket_scored" | "tip_off" | "quarter_end" | "city_change" | "mode_change" | "reset_match" | "move_executed";
  playerId: string;
  payload?: Record<string, unknown>;
  ts: number;
}

export interface MatchSyncState {
  scoreHome: number;
  scoreAway: number;
  quarter: number;
  gameClock: number;
  shotClock: number;
  ballPos: [number, number, number];
  ballVel: [number, number, number];
  ballMode: string;
  ownerPlayerId: string | null;
  ownerEntityKey: string | null;
  hostId: string | null;
  cityId: string;
  mode: string;
  eventSeq: number;
  lastEvent?: MatchEventRecord;
}

export interface MultiplayerRoomState {
  roomCode: string;
  createdAt: number;
  updatedAt: number;
  hostId: string | null;
  players: Record<string, RemotePlayerState>;
  match: MatchSyncState;
}

export interface MultiplayerRoomSummary {
  roomCode: string;
  playerCount: number;
  maxPlayers: number;
  cityId: string;
  mode: string;
  devices: DeviceType[];
}

export interface JoinRoomInput {
  roomCode?: string;
  playerId: string;
  name: string;
  deviceType: DeviceType;
  jerseyColor?: string;
  shortsColor?: string;
  preferredTeam?: TeamSide;
  cityId?: string;
  mode?: string;
}

export interface SyncStateInput {
  roomCode: string;
  playerId: string;
  transform?: PlayerTransform;
  ready?: boolean;
  name?: string;
  deviceType?: DeviceType;
  stats?: { pts: number; ast: number; reb: number };
  matchPatch?: Partial<Pick<
    MatchSyncState,
    "scoreHome" | "scoreAway" | "quarter" | "gameClock" | "shotClock" | "ballPos" | "ballVel" | "ballMode" | "ownerPlayerId" | "ownerEntityKey" | "cityId" | "mode"
  >>;
}

export interface MatchEventInput {
  roomCode: string;
  playerId: string;
  type: MatchEventRecord["type"];
  payload?: Record<string, unknown>;
}

export type ClientWsMessage =
  | { type: "join"; payload: JoinRoomInput }
  | { type: "sync"; payload: SyncStateInput }
  | { type: "event"; payload: MatchEventInput }
  | { type: "leave"; payload: { roomCode: string; playerId: string } }
  | { type: "ping"; ts: number };

export type ServerWsMessage =
  | { type: "room_snapshot"; room: MultiplayerRoomState; you: string; transport: "ws" | "http" }
  | { type: "peer_delta"; roomCode: string; playerId: string; player: RemotePlayerState; match?: Partial<MatchSyncState> }
  | { type: "match_event"; roomCode: string; event: MatchEventRecord; match: MatchSyncState }
  | { type: "pong"; ts: number }
  | { type: "error"; message: string };
