import test from "node:test";
import assert from "node:assert/strict";
import {
  applyOfflineMatchEvent,
  createOfflineRoom,
  getOfflineRoom,
  joinOfflineRoom,
  leaveOfflineRoom,
  listOfflineRooms,
  syncOfflinePlayerState,
} from "./offlineMultiplayerStore.ts";
import {
  applyMatchEvent,
  generateRoomCode,
  getRoom,
  joinRoom,
  leaveRoom,
  listPublicRooms,
  markPlayerDisconnected,
  syncPlayerState,
} from "./multiplayerServerStore.ts";
import { CrossPlayMultiplayerClient } from "./multiplayerClient.ts";
import { getCityAtmosphere, getCityById } from "./worldTour.ts";

class MockBroadcastChannel {
  public static channels = new Map<string, Set<MockBroadcastChannel>>();
  public onmessage: ((ev: { data: unknown }) => void) | null = null;
  private readonly name: string;

  constructor(name: string) {
    this.name = name;
    let set = MockBroadcastChannel.channels.get(name);
    if (!set) {
      set = new Set();
      MockBroadcastChannel.channels.set(name, set);
    }
    set.add(this);
  }

  postMessage(data: unknown) {
    const set = MockBroadcastChannel.channels.get(this.name);
    if (!set) return;
    for (const peer of set) {
      if (peer !== this && peer.onmessage) {
        peer.onmessage({ data });
      }
    }
  }

  close() {
    MockBroadcastChannel.channels.get(this.name)?.delete(this);
  }
}

function createMockStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
  };
}

test("Offline Multiplayer Mode: room creation, join, BroadcastChannel cross-tab sync, clock/score/possession, leave & reconnect", async () => {
  const localStorageMock = createMockStorage();
  const sessionStorageMock = createMockStorage();
  const listeners = new Map<string, Set<() => void>>();

  const prevWindow = (globalThis as any).window;
  const prevNavDesc = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const prevBC = (globalThis as any).BroadcastChannel;

  (globalThis as any).BroadcastChannel = MockBroadcastChannel;
  (globalThis as any).window = {
    localStorage: localStorageMock,
    sessionStorage: sessionStorageMock,
    location: { protocol: "http:", host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000", pathname: "/" },
    addEventListener: (ev: string, fn: () => void) => {
      if (!listeners.has(ev)) listeners.set(ev, new Set());
      listeners.get(ev)!.add(fn);
    },
    removeEventListener: (ev: string, fn: () => void) => {
      listeners.get(ev)?.delete(fn);
    },
  };
  (globalThis as any).sessionStorage = sessionStorageMock;
  Object.defineProperty(globalThis, "navigator", {
    value: { onLine: false, userAgent: "NodeTest", maxTouchPoints: 0 },
    configurable: true,
  });

  try {
    // 1. Offline store CRUD & cross-player state
    const created = createOfflineRoom({
      playerId: "tab_host",
      name: "Tab Host",
      deviceType: "desktop",
      format: "2v2",
      cityId: "jp_tokyo",
      isPrivate: false,
    });
    assert.ok(created.roomCode.startsWith("HOOP-"));
    assert.equal(created.hostId, "tab_host");

    const joined = joinOfflineRoom({
      roomCode: created.roomCode,
      playerId: "tab_guest",
      name: "Tab Guest",
      deviceType: "phone",
      preferredTeam: "Away",
    });
    assert.equal(Object.keys(joined.players).length, 2);
    assert.equal(joined.players["tab_guest"].team, "Away");

    const listed = listOfflineRooms();
    assert.ok(listed.some((r) => r.roomCode === created.roomCode && r.playerCount === 2));

    // Sync movement, clock, score, possession
    const synced = syncOfflinePlayerState({
      roomCode: created.roomCode,
      playerId: "tab_host",
      transform: { x: 4.5, y: 0, z: -2.1, vx: 1.2, vz: 0, faceYaw: 0.5, h: 0 },
      matchPatch: {
        scoreHome: 12,
        scoreAway: 9,
        gameClock: 510,
        shotClock: 18,
        ownerPlayerId: "tab_guest",
        ownerEntityKey: "Away:0",
      },
    });
    assert.equal(synced.room.match.scoreHome, 12);
    assert.equal(synced.room.match.scoreAway, 9);
    assert.equal(synced.room.match.gameClock, 510);
    assert.equal(synced.room.match.ownerPlayerId, "tab_guest");

    // Match finished event
    const { room: finishedRoom } = applyOfflineMatchEvent({
      roomCode: created.roomCode,
      playerId: "tab_host",
      type: "match_finished",
      payload: { scoreHome: 21, scoreAway: 17 },
    });
    assert.equal(finishedRoom.match.finalResult?.winner, "Home");
    assert.equal(finishedRoom.match.finalResult?.scoreHome, 21);

    // 2. CrossPlayMultiplayerClient offline BroadcastChannel cross-tab test
    sessionStorageMock.setItem("hoops_mp_player_id", "client_a");
    let clientASnapshots = 0;
    const clientA = new CrossPlayMultiplayerClient({
      onRoomSnapshot: () => {
        clientASnapshots += 1;
      },
    });

    sessionStorageMock.setItem("hoops_mp_player_id", "client_b");
    let clientBReceivedEvent = false;
    const clientB = new CrossPlayMultiplayerClient({
      onMatchEvent: (evt) => {
        if (evt.type === "basket_scored") clientBReceivedEvent = true;
      },
    });

    const roomA = await clientA.createAndJoinRoom({
      name: "Player A",
      deviceType: "desktop",
      format: "1v1",
      isPrivate: false,
    });
    assert.ok(roomA);
    assert.equal(clientA.transport, "offline-local");
    assert.ok(clientASnapshots >= 1);

    const roomB = await clientB.joinRoom({
      roomCode: roomA.roomCode,
      name: "Player B",
      deviceType: "tablet",
    });
    assert.ok(roomB);
    assert.equal(clientB.transport, "offline-local");

    await clientA.sendEvent("basket_scored", { scoreHome: 3, scoreAway: 0, shotClock: 24 });
    assert.equal(clientBReceivedEvent, true);

    await clientB.leaveRoom();
    const afterLeave = getOfflineRoom(roomA.roomCode);
    assert.equal(afterLeave.players[clientB.playerId], undefined);
    await clientA.leaveRoom();
    clientA.destroy();
    clientB.destroy();
    leaveOfflineRoom(created.roomCode, "tab_guest");
    leaveOfflineRoom(created.roomCode, "tab_host");
  } finally {
    (globalThis as any).window = prevWindow;
    if (prevNavDesc) Object.defineProperty(globalThis, "navigator", prevNavDesc);
    (globalThis as any).BroadcastChannel = prevBC;
  }
});

test("Online Room Engine: room codes, joining, movement/clock/score/possession sync, disconnect failover & reconnect", () => {
  const code = generateRoomCode();
  assert.match(code, /^HOOP-[A-Z0-9]{4}$/);

  const hostRoom = joinRoom({
    roomCode: code,
    playerId: "online_host",
    name: "Court Host",
    deviceType: "desktop",
    format: "3v3",
    cityId: "fr_paris",
    isPrivate: false,
  });
  assert.equal(hostRoom.hostId, "online_host");
  assert.equal(hostRoom.match.format, "3v3");

  const withGuest = joinRoom({
    roomCode: code,
    playerId: "online_guest",
    name: "Phone Guest",
    deviceType: "phone",
    preferredTeam: "Away",
  });
  assert.equal(withGuest.players["online_guest"].team, "Away");
  assert.equal(Object.keys(withGuest.players).length, 2);

  const list = listPublicRooms();
  assert.ok(list.some((r) => r.roomCode === code && r.playerCount === 2));

  // Sync movement + game clock + possession + scores
  const syncRes = syncPlayerState({
    roomCode: code,
    playerId: "online_host",
    transform: { x: -3.2, y: 0, z: 1.4, vx: 2.1, vz: -0.4, faceYaw: 1.1, h: 0 },
    matchPatch: {
      scoreHome: 44,
      scoreAway: 42,
      quarter: 3,
      gameClock: 312,
      shotClock: 14,
      ballPos: [2.5, 1.2, -0.5],
      ballVel: [0, 0, 0],
      ballMode: "dribble",
      ownerPlayerId: "online_guest",
      ownerEntityKey: "Away:0",
    },
  });
  assert.equal(syncRes.room.match.scoreHome, 44);
  assert.equal(syncRes.room.match.scoreAway, 42);
  assert.equal(syncRes.room.match.quarter, 3);
  assert.equal(syncRes.room.match.gameClock, 312);
  assert.equal(syncRes.room.match.ownerPlayerId, "online_guest");

  // Host disconnects -> guest becomes host seamlessly
  const afterDc = markPlayerDisconnected(code, "online_host")!;
  assert.equal(afterDc.players["online_host"].connected, false);
  assert.equal(afterDc.hostId, "online_guest");

  // Original host reconnects -> connected restored cleanly
  const rejoined = joinRoom({
    roomCode: code,
    playerId: "online_host",
    name: "Court Host",
    deviceType: "desktop",
  });
  assert.equal(rejoined.players["online_host"].connected, true);

  // Match result sync
  const { room: ended } = applyMatchEvent({
    roomCode: code,
    playerId: "online_guest",
    type: "match_finished",
    payload: { scoreHome: 78, scoreAway: 81 },
  });
  assert.equal(ended.match.finalResult?.winner, "Away");
  assert.equal(ended.match.finalResult?.scoreAway, 81);

  leaveRoom(code, "online_host");
  const lastState = leaveRoom(code, "online_guest");
  assert.equal(lastState, null);
  assert.ok(getRoom("PUBLIC-COURT"));
});

test("World Tour Day-Night Cycle: computes distinct day/golden/night atmospheres for selected cities", () => {
  const tokyo = getCityById("jp_tokyo");
  const nyc = getCityById("us_nyc");

  const dawnAtm = getCityAtmosphere(tokyo, Date.now(), 6.0);
  assert.equal(dawnAtm.phase, "dawn");
  assert.equal(dawnAtm.isDaytime, true);

  const dayAtm = getCityAtmosphere(nyc, Date.now(), 13.5);
  assert.equal(dayAtm.phase, "afternoon");
  assert.equal(dayAtm.starOpacity, 0);

  const sunsetAtm = getCityAtmosphere(nyc, Date.now(), 17.5);
  assert.equal(sunsetAtm.phase, "golden_hour");

  const nightAtm = getCityAtmosphere(tokyo, Date.now(), 23.0);
  assert.equal(nightAtm.phase, "night");
  assert.equal(nightAtm.isDaytime, false);
  assert.ok(nightAtm.starOpacity > 0.5);
});

test("Separate-Device WebSocket & HTTP Multiplayer: room code, join, movement/clock/score/possession sync, disconnect, reconnect, leave", async () => {
  const http = await import("node:http");
  const { WebSocketServer, WebSocket } = await import("ws");

  const socketsByRoom = new Map<string, Set<InstanceType<typeof WebSocket>>>();
  const metaBySock = new Map<InstanceType<typeof WebSocket>, { roomCode: string; playerId: string }>();

  const broadcast = (roomCode: string, msg: unknown, exclude?: InstanceType<typeof WebSocket>) => {
    const raw = JSON.stringify(msg);
    for (const sock of socketsByRoom.get(roomCode) || []) {
      if (sock !== exclude && sock.readyState === WebSocket.OPEN) {
        sock.send(raw);
      }
    }
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    if (url.pathname === "/api/multiplayer" && req.method === "GET") {
      const action = url.searchParams.get("action") || "room";
      if (action === "list") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, rooms: listPublicRooms() }));
        return;
      }
      const room = getRoom(url.searchParams.get("room") || "PUBLIC-COURT");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, room }));
      return;
    }
    if (url.pathname === "/api/multiplayer" && req.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (body.action === "create") {
        const room = joinRoom({ ...body, roomCode: generateRoomCode() });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, room }));
        return;
      }
      if (body.action === "join") {
        const room = joinRoom(body);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, room }));
        return;
      }
    }
    res.writeHead(404);
    res.end();
  });

  const wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (ws, req) => {
    const u = new URL(req.url || "/", "http://127.0.0.1");
    const initRoom = (u.searchParams.get("room") || "PUBLIC-COURT").toUpperCase();
    const initPid = u.searchParams.get("playerId") || "";
    metaBySock.set(ws, { roomCode: initRoom, playerId: initPid });

    ws.on("message", (buf) => {
      const msg = JSON.parse(buf.toString());
      if (msg.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", ts: msg.ts }));
      } else if (msg.type === "join") {
        const room = joinRoom(msg.payload);
        if (!socketsByRoom.has(room.roomCode)) socketsByRoom.set(room.roomCode, new Set());
        socketsByRoom.get(room.roomCode)!.add(ws);
        metaBySock.set(ws, { roomCode: room.roomCode, playerId: msg.payload.playerId });
        ws.send(JSON.stringify({ type: "room_snapshot", room, you: msg.payload.playerId, transport: "ws" }));
        broadcast(room.roomCode, { type: "room_snapshot", room, you: "", transport: "ws" }, ws);
      } else if (msg.type === "sync") {
        const { room, player } = syncPlayerState(msg.payload);
        if (player) {
          broadcast(
            room.roomCode,
            {
              type: "peer_delta",
              roomCode: room.roomCode,
              playerId: msg.payload.playerId,
              player,
              match: msg.payload.matchPatch ? room.match : undefined,
            },
            ws
          );
        }
      } else if (msg.type === "event") {
        const { room, event } = applyMatchEvent(msg.payload);
        broadcast(room.roomCode, { type: "match_event", roomCode: room.roomCode, event, match: room.match });
      } else if (msg.type === "leave") {
        const room = leaveRoom(msg.payload.roomCode, msg.payload.playerId);
        socketsByRoom.get(msg.payload.roomCode)?.delete(ws);
        if (room) broadcast(room.roomCode, { type: "room_snapshot", room, you: "", transport: "ws" });
      }
    });

    ws.on("close", () => {
      const meta = metaBySock.get(ws);
      metaBySock.delete(ws);
      if (meta?.roomCode && meta.playerId) {
        socketsByRoom.get(meta.roomCode)?.delete(ws);
        const updated = markPlayerDisconnected(meta.roomCode, meta.playerId);
        if (updated) broadcast(meta.roomCode, { type: "room_snapshot", room: updated, you: "", transport: "ws" });
      }
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const wsBase = `ws://127.0.0.1:${port}`;

  try {
    // Device 1 creates room via HTTP
    const createRes = await fetch(`${baseUrl}/api/multiplayer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        playerId: "dev1",
        name: "Phone One",
        deviceType: "phone",
        format: "1v1",
        isPrivate: false,
      }),
    });
    const createdJson = (await createRes.json()) as any;
    assert.equal(createdJson.ok, true);
    const roomCode = createdJson.room.roomCode as string;
    assert.ok(roomCode.startsWith("HOOP-"));

    const connectWs = (pid: string) =>
      new Promise<InstanceType<typeof WebSocket>>((resolve, reject) => {
        const sock = new WebSocket(`${wsBase}/ws/multiplayer?room=${encodeURIComponent(roomCode)}&playerId=${pid}`);
        sock.once("open", () => resolve(sock));
        sock.once("error", reject);
      });

    const ws1 = await connectWs("dev1");
    const ws2 = await connectWs("dev2");

    const ws2Messages: any[] = [];
    ws2.on("message", (d) => ws2Messages.push(JSON.parse(d.toString())));

    ws1.send(JSON.stringify({ type: "join", payload: { roomCode, playerId: "dev1", name: "Phone One", deviceType: "phone" } }));
    ws2.send(JSON.stringify({ type: "join", payload: { roomCode, playerId: "dev2", name: "Desktop Two", deviceType: "desktop", preferredTeam: "Away" } }));

    await new Promise((r) => setTimeout(r, 80));
    assert.ok(ws2Messages.some((m) => m.type === "room_snapshot" && Object.keys(m.room.players).length === 2));

    // Device 1 syncs movement, score, clock, possession
    ws1.send(
      JSON.stringify({
        type: "sync",
        payload: {
          roomCode,
          playerId: "dev1",
          transform: { x: 6.2, y: 0, z: -1.5, vx: 3.1, vz: 0.4, faceYaw: 0.9, h: 0 },
          matchPatch: {
            scoreHome: 15,
            scoreAway: 11,
            gameClock: 420,
            shotClock: 19,
            ownerPlayerId: "dev1",
            ownerEntityKey: "Home:0",
          },
        },
      })
    );
    await new Promise((r) => setTimeout(r, 80));
    const delta = ws2Messages.find((m) => m.type === "peer_delta" && m.playerId === "dev1");
    assert.ok(delta);
    assert.equal(delta.player.transform.x, 6.2);
    assert.equal(delta.match.scoreHome, 15);
    assert.equal(delta.match.gameClock, 420);
    assert.equal(delta.match.ownerPlayerId, "dev1");

    // Device 1 disconnects -> Device 2 receives snapshot with dev1 disconnected & host failover
    ws1.close();
    await new Promise((r) => setTimeout(r, 80));
    const failoverSnap = [...ws2Messages].reverse().find((m) => m.type === "room_snapshot");
    assert.ok(failoverSnap);
    assert.equal(failoverSnap.room.players.dev1.connected, false);
    assert.equal(failoverSnap.room.hostId, "dev2");

    // Device 1 reconnects
    const ws1Re = await connectWs("dev1");
    ws1Re.send(JSON.stringify({ type: "join", payload: { roomCode, playerId: "dev1", name: "Phone One", deviceType: "phone" } }));
    await new Promise((r) => setTimeout(r, 80));
    const rejoinedSnap = [...ws2Messages].reverse().find((m) => m.type === "room_snapshot");
    assert.equal(rejoinedSnap.room.players.dev1.connected, true);

    // Match finishes
    ws2.send(
      JSON.stringify({
        type: "event",
        payload: { roomCode, playerId: "dev2", type: "match_finished", payload: { scoreHome: 24, scoreAway: 26 } },
      })
    );
    await new Promise((r) => setTimeout(r, 80));
    const endEvt = ws2Messages.find((m) => m.type === "match_event" && m.event.type === "match_finished");
    assert.ok(endEvt);
    assert.equal(endEvt.match.finalResult.winner, "Away");

    ws1Re.close();
    ws2.close();
    leaveRoom(roomCode, "dev1");
    leaveRoom(roomCode, "dev2");
  } finally {
    wss.close();
    server.close();
  }
});
