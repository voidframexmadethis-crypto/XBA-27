import http from "node:http";
import { parse } from "node:url";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";
import {
  applyMatchEvent,
  getRoom,
  joinRoom,
  leaveRoom,
  syncPlayerState,
} from "./lib/multiplayerServerStore.ts";
import type { ClientWsMessage, ServerWsMessage } from "./lib/multiplayerTypes.ts";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

interface ClientMeta {
  ws: WebSocket;
  roomCode: string;
  playerId: string;
  isAlive: boolean;
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const clientsBySocket = new Map<WebSocket, ClientMeta>();
  const socketsByRoom = new Map<string, Set<WebSocket>>();

  const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url || "/", true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });
  const nextUpgradeHandler = app.getUpgradeHandler();

  function sendJson(ws: WebSocket, msg: ServerWsMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  function broadcastRoom(roomCode: string, msg: ServerWsMessage, excludeSocket?: WebSocket) {
    const set = socketsByRoom.get(roomCode);
    if (!set) return;
    const raw = JSON.stringify(msg);
    for (const sock of set) {
      if (sock !== excludeSocket && sock.readyState === WebSocket.OPEN) {
        sock.send(raw);
      }
    }
  }

  function attachSocketToRoom(ws: WebSocket, roomCode: string, playerId: string) {
    const prev = clientsBySocket.get(ws);
    if (prev && prev.roomCode !== roomCode) {
      socketsByRoom.get(prev.roomCode)?.delete(ws);
    }
    let set = socketsByRoom.get(roomCode);
    if (!set) {
      set = new Set<WebSocket>();
      socketsByRoom.set(roomCode, set);
    }
    set.add(ws);
    clientsBySocket.set(ws, { ws, roomCode, playerId, isAlive: true });
  }

  wss.on("connection", (ws: WebSocket) => {
    clientsBySocket.set(ws, { ws, roomCode: "", playerId: "", isAlive: true });

    ws.on("pong", () => {
      const meta = clientsBySocket.get(ws);
      if (meta) meta.isAlive = true;
    });

    ws.on("message", (rawData) => {
      let msg: ClientWsMessage;
      try {
        msg = JSON.parse(rawData.toString()) as ClientWsMessage;
      } catch {
        sendJson(ws, { type: "error", message: "Invalid JSON payload" });
        return;
      }

      if (msg.type === "ping") {
        sendJson(ws, { type: "pong", ts: msg.ts });
        return;
      }

      if (msg.type === "join") {
        const room = joinRoom(msg.payload);
        attachSocketToRoom(ws, room.roomCode, msg.payload.playerId);
        sendJson(ws, {
          type: "room_snapshot",
          room,
          you: msg.payload.playerId,
          transport: "ws",
        });
        broadcastRoom(
          room.roomCode,
          {
            type: "room_snapshot",
            room,
            you: "",
            transport: "ws",
          },
          ws
        );
        return;
      }

      if (msg.type === "sync") {
        const { room, player } = syncPlayerState(msg.payload);
        attachSocketToRoom(ws, room.roomCode, msg.payload.playerId);
        if (player) {
          broadcastRoom(
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
        return;
      }

      if (msg.type === "event") {
        const { room, event } = applyMatchEvent(msg.payload);
        broadcastRoom(room.roomCode, {
          type: "match_event",
          roomCode: room.roomCode,
          event,
          match: room.match,
        });
        return;
      }

      if (msg.type === "leave") {
        const room = leaveRoom(msg.payload.roomCode, msg.payload.playerId);
        socketsByRoom.get(msg.payload.roomCode)?.delete(ws);
        if (room) {
          broadcastRoom(room.roomCode, {
            type: "room_snapshot",
            room,
            you: "",
            transport: "ws",
          });
        }
      }
    });

    ws.on("close", () => {
      const meta = clientsBySocket.get(ws);
      clientsBySocket.delete(ws);
      if (meta && meta.roomCode) {
        socketsByRoom.get(meta.roomCode)?.delete(ws);
        if (meta.playerId) {
          const updatedRoom = leaveRoom(meta.roomCode, meta.playerId);
          if (updatedRoom) {
            broadcastRoom(meta.roomCode, {
              type: "room_snapshot",
              room: updatedRoom,
              you: "",
              transport: "ws",
            });
          } else {
            // Ensure public room cleans up cleanly
            const pub = getRoom(meta.roomCode);
            broadcastRoom(meta.roomCode, {
              type: "room_snapshot",
              room: pub,
              you: "",
              transport: "ws",
            });
          }
        }
      }
    });
  });

  // Keep connections healthy and prune dead sockets
  const heartbeat = setInterval(() => {
    for (const [ws, meta] of clientsBySocket.entries()) {
      if (!meta.isAlive) {
        ws.terminate();
        continue;
      }
      meta.isAlive = false;
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }
  }, 10_000);

  server.on("close", () => clearInterval(heartbeat));

  server.on("upgrade", (req, socket, head) => {
    const parsed = parse(req.url || "/", true);
    if (parsed.pathname === "/ws/multiplayer") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } else {
      nextUpgradeHandler(req, socket, head).catch(() => {
        socket.destroy();
      });
    }
  });

  server.listen(port, hostname, () => {
    console.log(`> Hoops Moves server listening on http://${hostname}:${port} (dev=${dev})`);
  });
});
