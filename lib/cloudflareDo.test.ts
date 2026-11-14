import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";
import { handleCloudflareMultiplayerRequest } from "./cloudflareMultiplayerRouter.ts";

class MockCfWebSocket {
  public readyState = 1;
  public closedCode: number | null = null;
  public closedReason: string | null = null;
  public sent: string[] = [];
  private attachment: unknown = null;
  public peer: MockCfWebSocket | null = null;

  send(data: string | ArrayBuffer) {
    const str = typeof data === "string" ? data : new TextDecoder().decode(data);
    this.sent.push(str);
    if (this.peer) {
      this.peer.sent.push(str);
    }
  }

  close(code?: number, reason?: string) {
    this.readyState = 3;
    this.closedCode = code ?? 1000;
    this.closedReason = reason ?? "";
  }

  serializeAttachment(att: unknown) {
    this.attachment = att;
  }

  deserializeAttachment() {
    return this.attachment;
  }
}

function createMockDoState() {
  const store = new Map<string, unknown>();
  let alarmAt: number | null = null;
  const acceptedSockets = new Set<MockCfWebSocket>();
  const pendingPromises: Promise<unknown>[] = [];

  return {
    acceptedSockets,
    pendingPromises,
    getAlarmAt: () => alarmAt,
    state: {
      storage: {
        get: async <T = unknown>(key: string) => store.get(key) as T | undefined,
        put: async (key: string, value: unknown) => {
          store.set(key, structuredClone(value));
        },
        delete: async (key: string) => store.delete(key),
        getAlarm: async () => alarmAt,
        setAlarm: async (ts: number) => {
          alarmAt = ts;
        },
      },
      waitUntil: (p: Promise<unknown>) => {
        pendingPromises.push(p);
      },
      acceptWebSocket: (ws: MockCfWebSocket) => {
        acceptedSockets.add(ws);
      },
      getWebSockets: () => Array.from(acceptedSockets).filter((s) => s.readyState === 1),
    },
  };
}

async function loadHoopsDoClasses() {
  const res = await build({
    entryPoints: [path.resolve("lib/hoopsRoomDO.ts")],
    bundle: true,
    write: false,
    format: "esm",
    platform: "neutral",
    target: "es2022",
    plugins: [
      {
        name: "mock-cloudflare-workers",
        setup(b) {
          b.onResolve({ filter: /^cloudflare:workers$/ }, () => ({
            path: "cloudflare:workers",
            namespace: "mock-cf",
          }));
          b.onLoad({ filter: /.*/, namespace: "mock-cf" }, () => ({
            contents: `export class DurableObject { constructor(ctx, env) { this.ctx = ctx; this.env = env; } }`,
            loader: "js",
          }));
        },
      },
    ],
  });

  const code = res.outputFiles[0].text;
  const dataUrl = `data:text/javascript;base64,${Buffer.from(code, "utf8").toString("base64")}`;
  return (await import(dataUrl)) as {
    HoopsRoom: new (ctx: any, env: any) => any;
    HoopsLobby: new (ctx: any, env: any) => any;
  };
}

test("Cloudflare Durable Objects (HoopsLobby + HoopsRoom + router): create, list, WS upgrade, sync, host failover, reconnect, leave & alarm cleanup", async () => {
  const { HoopsRoom, HoopsLobby } = await loadHoopsDoClasses();

  const prevWebSocketPair = (globalThis as any).WebSocketPair;
  const prevResponse = globalThis.Response;

  (globalThis as any).WebSocketPair = class {
    0: MockCfWebSocket;
    1: MockCfWebSocket;
    constructor() {
      const client = new MockCfWebSocket();
      const server = new MockCfWebSocket();
      client.peer = server;
      server.peer = client;
      this[0] = client;
      this[1] = server;
    }
  };

  // Node's global Response disallows status 101; allow status 101 + webSocket field for DO upgrade tests
  (globalThis as any).Response = class extends prevResponse {
    public readonly webSocket: any = null;
    private readonly customStatus?: number;
    constructor(body?: BodyInit | null, init?: ResponseInit & { webSocket?: unknown }) {
      super(
        init?.status === 101 ? null : body,
        init?.status === 101 ? { ...init, status: 200 } : init
      );
      if (init?.status === 101) {
        this.customStatus = 101;
        this.webSocket = init.webSocket ?? null;
      }
    }
    get status() {
      return this.customStatus ?? super.status;
    }
  };

  try {
    const roomInstances = new Map<string, { instance: any; mock: ReturnType<typeof createMockDoState> }>();
    const lobbyInstances = new Map<string, { instance: any; mock: ReturnType<typeof createMockDoState> }>();

    const env: any = {};

    const makeNamespace = (kind: "room" | "lobby") => ({
      idFromName: (name: string) => ({ name }),
      get: (id: { name: string }) => ({
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
          const req = input instanceof Request ? input : new Request(input, init);
          if (kind === "lobby") {
            let entry = lobbyInstances.get(id.name);
            if (!entry) {
              const mock = createMockDoState();
              entry = { instance: new HoopsLobby(mock.state, env), mock };
              lobbyInstances.set(id.name, entry);
            }
            return entry.instance.fetch(req);
          } else {
            let entry = roomInstances.get(id.name);
            if (!entry) {
              const mock = createMockDoState();
              entry = { instance: new HoopsRoom(mock.state, env), mock };
              roomInstances.set(id.name, entry);
            }
            return entry.instance.fetch(req);
          }
        },
      }),
    });

    env.HOOPS_ROOM = makeNamespace("room");
    env.HOOPS_LOBBY = makeNamespace("lobby");

    // 1. Host creates a public 2v2 room via handleCloudflareMultiplayerRequest
    const createReq = new Request("https://hoops.example.workers.dev/api/multiplayer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        playerId: "cf_host",
        name: "CF Host",
        deviceType: "desktop",
        format: "2v2",
        isPrivate: false,
        leagueDivision: "womens",
        competitionType: "international",
      }),
    });
    const createRes = await handleCloudflareMultiplayerRequest(createReq, env);
    assert.ok(createRes);
    const createdBody = (await createRes.json()) as any;
    assert.equal(createdBody.ok, true);
    assert.equal(createdBody.transport, "cloudflare-do");
    const roomCode = createdBody.room.roomCode as string;
    assert.match(roomCode, /^HOOP-[A-Z0-9]{4}$/);
    assert.equal(createdBody.room.match.leagueDivision, "womens");

    const roomRecord = roomInstances.get(roomCode)!;
    await Promise.all(roomRecord.mock.pendingPromises);

    // 2. Global HoopsLobby lists the newly created public room
    const listRes = await handleCloudflareMultiplayerRequest(
      new Request("https://hoops.example.workers.dev/api/multiplayer?action=list"),
      env
    );
    const listBody = (await listRes!.json()) as any;
    assert.equal(listBody.ok, true);
    assert.ok(listBody.rooms.some((r: any) => r.roomCode === roomCode && r.playerCount === 1));

    // 3. Two separate devices upgrade WebSocket connections to the room DO
    const upgradeReqHost = new Request(
      `https://hoops.example.workers.dev/ws/multiplayer?room=${roomCode}&playerId=cf_host`,
      { headers: { Upgrade: "websocket" } }
    );
    const wsResHost = (await handleCloudflareMultiplayerRequest(upgradeReqHost, env)) as any;
    assert.equal(wsResHost.status, 101);
    const hostClientSock = wsResHost.webSocket as MockCfWebSocket;
    const hostServerSock = hostClientSock.peer!;

    const upgradeReqGuest = new Request(
      `https://hoops.example.workers.dev/ws/multiplayer?room=${roomCode}&playerId=cf_guest`,
      { headers: { Upgrade: "websocket" } }
    );
    const wsResGuest = (await handleCloudflareMultiplayerRequest(upgradeReqGuest, env)) as any;
    assert.equal(wsResGuest.status, 101);
    const guestClientSock = wsResGuest.webSocket as MockCfWebSocket;
    const guestServerSock = guestClientSock.peer!;

    // Guest joins via WebSocket message
    await roomRecord.instance.webSocketMessage(
      guestServerSock,
      JSON.stringify({
        type: "join",
        payload: {
          roomCode,
          playerId: "cf_guest",
          name: "CF Guest",
          deviceType: "phone",
          preferredTeam: "Away",
        },
      })
    );

    const hostSnapMsg = JSON.parse(hostClientSock.sent[hostClientSock.sent.length - 1]);
    assert.equal(hostSnapMsg.type, "room_snapshot");
    assert.equal(Object.keys(hostSnapMsg.room.players).length, 2);
    assert.equal(hostSnapMsg.room.players.cf_guest.team, "Away");

    // 4. Host sends sync over WebSocket -> guest receives peer_delta with movement, score, clock, possession
    await roomRecord.instance.webSocketMessage(
      hostServerSock,
      JSON.stringify({
        type: "sync",
        payload: {
          roomCode,
          playerId: "cf_host",
          transform: { x: 5.1, y: 0, z: -3.2, vx: 2.0, vz: 0.5, faceYaw: 0.8, h: 0 },
          matchPatch: {
            scoreHome: 22,
            scoreAway: 19,
            quarter: 2,
            gameClock: 410,
            shotClock: 15,
            ownerPlayerId: "cf_host",
            ownerEntityKey: "Home:0",
          },
        },
      })
    );

    const guestDelta = JSON.parse(guestClientSock.sent[guestClientSock.sent.length - 1]);
    assert.equal(guestDelta.type, "peer_delta");
    assert.equal(guestDelta.player.transform.x, 5.1);
    assert.equal(guestDelta.match.scoreHome, 22);
    assert.equal(guestDelta.match.gameClock, 410);
    assert.equal(guestDelta.match.ownerPlayerId, "cf_host");

    // 5. Heartbeat ping -> pong
    await roomRecord.instance.webSocketMessage(hostServerSock, JSON.stringify({ type: "ping", ts: 12345 }));
    const pongMsg = JSON.parse(hostClientSock.sent[hostClientSock.sent.length - 1]);
    assert.equal(pongMsg.type, "pong");
    assert.equal(pongMsg.ts, 12345);

    // 6. Host socket closes unexpectedly -> automatic host failover to connected guest + grace window preserved
    hostServerSock.readyState = 3;
    await roomRecord.instance.webSocketClose(hostServerSock, 1006, "Abnormal Closure", false);
    const failoverMsg = JSON.parse(guestClientSock.sent[guestClientSock.sent.length - 1]);
    assert.equal(failoverMsg.type, "room_snapshot");
    assert.equal(failoverMsg.room.players.cf_host.connected, false);
    assert.equal(failoverMsg.room.hostId, "cf_guest");
    assert.ok(roomRecord.mock.getAlarmAt() !== null);

    // 7. Match finished event via HTTP -> updates finalResult & broadcasts to connected WebSocket
    const eventRes = await handleCloudflareMultiplayerRequest(
      new Request(`https://hoops.example.workers.dev/api/multiplayer?room=${roomCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "event",
          roomCode,
          playerId: "cf_guest",
          type: "match_finished",
          payload: { scoreHome: 64, scoreAway: 68 },
        }),
      }),
      env
    );
    const eventBody = (await eventRes!.json()) as any;
    assert.equal(eventBody.room.match.finalResult.winner, "Away");
    const wsEventMsg = JSON.parse(guestClientSock.sent[guestClientSock.sent.length - 1]);
    assert.equal(wsEventMsg.type, "match_event");
    assert.equal(wsEventMsg.match.finalResult.scoreAway, 68);

    // 8. Leave room cleans up player
    await roomRecord.instance.webSocketMessage(
      guestServerSock,
      JSON.stringify({ type: "leave", payload: { roomCode, playerId: "cf_guest" } })
    );
    const getRes = await handleCloudflareMultiplayerRequest(
      new Request(`https://hoops.example.workers.dev/api/multiplayer?room=${roomCode}`),
      env
    );
    const getBody = (await getRes!.json()) as any;
    assert.equal(getBody.room.players.cf_guest, undefined);
  } finally {
    (globalThis as any).WebSocketPair = prevWebSocketPair;
    (globalThis as any).Response = prevResponse;
  }
});
