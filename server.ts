import http from "node:http";
import { parse } from "node:url";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";
import {
  applyMatchEvent,
  getRoom,
  joinRoom,
  leaveRoom,
  markPlayerDisconnected,
  syncPlayerState,
} from "./lib/multiplayerServerStore.ts";
import {
  addMirrorViewer,
  endMirrorSession,
  getMirrorSession,
  normalizeMirrorCode,
  pushMirrorFrame,
  removeMirrorViewer,
  updateMirrorMeta,
  upsertMirrorSession,
} from "./lib/mirrorServerStore.ts";
import type { ClientWsMessage, ServerWsMessage } from "./lib/multiplayerTypes.ts";
import type { MirrorClientWsMessage, MirrorServerWsMessage } from "./lib/mirrorTypes.ts";

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

let isListening = false;

process.on("unhandledRejection", (reason) => {
  console.error("[server] Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[server] Uncaught exception:", err);
  if (!isListening) {
    process.exit(1);
  }
});

app
  .prepare()
  .then(() => {
    const clientsBySocket = new Map<WebSocket, ClientMeta>();
    const socketsByRoom = new Map<string, Set<WebSocket>>();

    const server = http.createServer((req, res) => {
      req.on("error", (err) => {
        console.error("[server] Request stream error:", err);
      });
      res.on("error", (err) => {
        console.error("[server] Response stream error:", err);
      });
      const parsedUrl = parse(req.url || "/", true);
      Promise.resolve(handle(req, res, parsedUrl)).catch((err) => {
        console.error("[server] Request handler error:", err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end("Internal Server Error");
        } else if (!res.writableEnded) {
          res.end();
        }
      });
    });

    server.on("clientError", (err, socket) => {
      if ((err as NodeJS.ErrnoException)?.code === "ECONNRESET" || !socket.writable) {
        return;
      }
      socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
    });

    server.on("error", (err) => {
      console.error("[server] HTTP server error:", err);
      if (!isListening) {
        process.exit(1);
      }
    });

    const wss = new WebSocketServer({ noServer: true });
    const mirrorWss = new WebSocketServer({ noServer: true, maxPayload: 4 * 1024 * 1024 });
    const nextUpgradeHandler = app.getUpgradeHandler();

    wss.on("error", (err) => {
      console.error("[server] Multiplayer WSS error:", err);
    });
    mirrorWss.on("error", (err) => {
      console.error("[server] Mirror WSS error:", err);
    });

  interface MirrorSocketMeta {
    ws: WebSocket;
    code: string;
    role: "sender" | "viewer" | null;
    viewerId: string;
    isAlive: boolean;
  }
  const mirrorSockets = new Map<WebSocket, MirrorSocketMeta>();
  const mirrorSenderByCode = new Map<string, WebSocket>();
  const mirrorViewersByCode = new Map<string, Map<string, WebSocket>>();

  function sendMirrorJson(ws: WebSocket, msg: MirrorServerWsMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  function broadcastMirrorViewers(code: string, msg: MirrorServerWsMessage) {
    const viewers = mirrorViewersByCode.get(code);
    if (!viewers || viewers.size === 0) return;
    const raw = JSON.stringify(msg);
    for (const sock of viewers.values()) {
      if (sock.readyState === WebSocket.OPEN) {
        sock.send(raw);
      }
    }
  }

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

  wss.on("connection", (ws: WebSocket, req) => {
    const parsedReq = parse(req?.url || "/", true);
    const initialRoom = typeof parsedReq.query.room === "string" ? parsedReq.query.room.toUpperCase() : "";
    const initialPlayer = typeof parsedReq.query.playerId === "string" ? parsedReq.query.playerId : "";
    clientsBySocket.set(ws, { ws, roomCode: initialRoom, playerId: initialPlayer, isAlive: true });
    if (initialRoom && initialPlayer) {
      attachSocketToRoom(ws, initialRoom, initialPlayer);
    }

    ws.on("error", (err) => {
      console.error("[server] Multiplayer WS client error:", err);
    });

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

      if (!msg || typeof msg !== "object") {
        sendJson(ws, { type: "error", message: "Invalid message object" });
        return;
      }

      try {
        if (msg.type === "ping") {
          sendJson(ws, { type: "pong", ts: msg.ts });
          return;
        }

        if (msg.type === "join") {
          if (!msg.payload || typeof msg.payload !== "object") {
            sendJson(ws, { type: "error", message: "Missing join payload" });
            return;
          }
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
          if (!msg.payload || typeof msg.payload !== "object") {
            sendJson(ws, { type: "error", message: "Missing sync payload" });
            return;
          }
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
          if (!msg.payload || typeof msg.payload !== "object") {
            sendJson(ws, { type: "error", message: "Missing event payload" });
            return;
          }
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
          if (!msg.payload || typeof msg.payload !== "object") {
            return;
          }
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
      } catch (err) {
        console.error("[server] Multiplayer WS message error:", err);
        sendJson(ws, { type: "error", message: "Failed to process multiplayer message" });
      }
    });

    ws.on("close", () => {
      const meta = clientsBySocket.get(ws);
      clientsBySocket.delete(ws);
      if (meta && meta.roomCode) {
        const roomSet = socketsByRoom.get(meta.roomCode);
        roomSet?.delete(ws);
        if (meta.playerId) {
          let hasOtherSocket = false;
          if (roomSet) {
            for (const sock of roomSet) {
              const other = clientsBySocket.get(sock);
              if (other && other.playerId === meta.playerId && sock.readyState === WebSocket.OPEN) {
                hasOtherSocket = true;
                break;
              }
            }
          }
          if (!hasOtherSocket) {
            const updatedRoom = markPlayerDisconnected(meta.roomCode, meta.playerId);
            if (updatedRoom) {
              broadcastRoom(meta.roomCode, {
                type: "room_snapshot",
                room: updatedRoom,
                you: "",
                transport: "ws",
              });
            }
          }
        }
      }
    });
  });

  mirrorWss.on("connection", (ws: WebSocket) => {
    mirrorSockets.set(ws, { ws, code: "", role: null, viewerId: "", isAlive: true });

    ws.on("error", (err) => {
      console.error("[server] Mirror WS client error:", err);
    });

    ws.on("pong", () => {
      const meta = mirrorSockets.get(ws);
      if (meta) meta.isAlive = true;
    });

    ws.on("message", (rawData) => {
      let msg: MirrorClientWsMessage;
      try {
        msg = JSON.parse(rawData.toString()) as MirrorClientWsMessage;
      } catch {
        sendMirrorJson(ws, { type: "error", message: "Invalid mirror JSON" });
        return;
      }

      if (!msg || typeof msg !== "object") {
        sendMirrorJson(ws, { type: "error", message: "Invalid mirror message" });
        return;
      }

      try {
        if (msg.type === "ping") {
          sendMirrorJson(ws, { type: "pong", ts: msg.ts });
          return;
        }

      if (msg.type === "start_broadcast") {
        const code = normalizeMirrorCode(msg.code);
        const sess = upsertMirrorSession(code, msg.meta);
        mirrorSockets.set(ws, { ws, code, role: "sender", viewerId: "", isAlive: true });
        mirrorSenderByCode.set(code, ws);
        const viewers = mirrorViewersByCode.get(code);
        sendMirrorJson(ws, {
          type: "broadcast_started",
          code,
          viewerCount: viewers ? viewers.size : sess.viewers.size,
        });
        broadcastMirrorViewers(code, {
          type: "session_state",
          code,
          active: true,
          meta: sess.meta,
          latestFrame: sess.latestFrame,
          seq: sess.seq,
          viewerCount: viewers ? viewers.size : sess.viewers.size,
        });
        return;
      }

      if (msg.type === "update_meta") {
        const code = normalizeMirrorCode(msg.code);
        updateMirrorMeta(code, msg.meta);
        broadcastMirrorViewers(code, { type: "meta", code, meta: msg.meta });
        return;
      }

      if (msg.type === "frame") {
        const code = normalizeMirrorCode(msg.code);
        pushMirrorFrame(code, msg.dataUrl, msg.seq, msg.meta);
        broadcastMirrorViewers(code, {
          type: "frame",
          code,
          dataUrl: msg.dataUrl,
          seq: msg.seq,
          meta: msg.meta,
        });
        return;
      }

      if (msg.type === "stop_broadcast") {
        const code = normalizeMirrorCode(msg.code);
        endMirrorSession(code);
        mirrorSenderByCode.delete(code);
        broadcastMirrorViewers(code, { type: "broadcast_ended", code });
        return;
      }

      if (msg.type === "join_viewer") {
        const code = normalizeMirrorCode(msg.code);
        const viewerId = msg.viewerId || `v_${Date.now()}`;
        mirrorSockets.set(ws, { ws, code, role: "viewer", viewerId, isAlive: true });
        let viewers = mirrorViewersByCode.get(code);
        if (!viewers) {
          viewers = new Map<string, WebSocket>();
          mirrorViewersByCode.set(code, viewers);
        }
        viewers.set(viewerId, ws);

        const sess = addMirrorViewer(code, viewerId) || getMirrorSession(code);
        const viewerCount = Math.max(viewers.size, sess ? sess.viewers.size : 0);
        sendMirrorJson(ws, {
          type: "session_state",
          code,
          active: Boolean(sess?.active),
          meta: sess?.meta || null,
          latestFrame: sess?.latestFrame || null,
          seq: sess?.seq || 0,
          viewerCount,
        });

        const senderSock = mirrorSenderByCode.get(code);
        if (senderSock && senderSock.readyState === WebSocket.OPEN) {
          sendMirrorJson(senderSock, {
            type: "viewer_joined",
            code,
            viewerId,
            viewerCount,
          });
        }
        return;
      }

      if (msg.type === "leave_viewer") {
        const code = normalizeMirrorCode(msg.code);
        const viewers = mirrorViewersByCode.get(code);
        viewers?.delete(msg.viewerId);
        const sess = removeMirrorViewer(code, msg.viewerId);
        const viewerCount = Math.max(viewers?.size || 0, sess?.viewers.size || 0);
        const senderSock = mirrorSenderByCode.get(code);
        if (senderSock && senderSock.readyState === WebSocket.OPEN) {
          sendMirrorJson(senderSock, {
            type: "viewer_left",
            code,
            viewerId: msg.viewerId,
            viewerCount,
          });
        }
        return;
      }

      if (msg.type === "rtc_offer") {
        const code = normalizeMirrorCode(msg.code);
        const target = mirrorViewersByCode.get(code)?.get(msg.viewerId);
        if (target && target.readyState === WebSocket.OPEN) {
          sendMirrorJson(target, {
            type: "rtc_offer",
            code,
            viewerId: msg.viewerId,
            sdp: msg.sdp,
          });
        }
        return;
      }

      if (msg.type === "rtc_answer") {
        const code = normalizeMirrorCode(msg.code);
        const senderSock = mirrorSenderByCode.get(code);
        if (senderSock && senderSock.readyState === WebSocket.OPEN) {
          sendMirrorJson(senderSock, {
            type: "rtc_answer",
            code,
            viewerId: msg.viewerId,
            sdp: msg.sdp,
          });
        }
        return;
      }

      if (msg.type === "rtc_ice") {
        const code = normalizeMirrorCode(msg.code);
        if (msg.from === "sender") {
          const target = mirrorViewersByCode.get(code)?.get(msg.viewerId);
          if (target && target.readyState === WebSocket.OPEN) {
            sendMirrorJson(target, msg);
          }
        } else {
          const senderSock = mirrorSenderByCode.get(code);
          if (senderSock && senderSock.readyState === WebSocket.OPEN) {
            sendMirrorJson(senderSock, msg);
          }
        }
        }
      } catch (err) {
        console.error("[server] Mirror WS message error:", err);
        sendMirrorJson(ws, { type: "error", message: "Failed to process mirror message" });
      }
    });

    ws.on("close", () => {
      const meta = mirrorSockets.get(ws);
      mirrorSockets.delete(ws);
      if (!meta || !meta.code) return;
      if (meta.role === "sender") {
        if (mirrorSenderByCode.get(meta.code) === ws) {
          mirrorSenderByCode.delete(meta.code);
          endMirrorSession(meta.code);
          broadcastMirrorViewers(meta.code, { type: "broadcast_ended", code: meta.code });
        }
      } else if (meta.role === "viewer" && meta.viewerId) {
        const viewers = mirrorViewersByCode.get(meta.code);
        if (viewers?.get(meta.viewerId) === ws) {
          viewers.delete(meta.viewerId);
        }
        const sess = removeMirrorViewer(meta.code, meta.viewerId);
        const viewerCount = Math.max(viewers?.size || 0, sess?.viewers.size || 0);
        const senderSock = mirrorSenderByCode.get(meta.code);
        if (senderSock && senderSock.readyState === WebSocket.OPEN) {
          sendMirrorJson(senderSock, {
            type: "viewer_left",
            code: meta.code,
            viewerId: meta.viewerId,
            viewerCount,
          });
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
    for (const [ws, meta] of mirrorSockets.entries()) {
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
      socket.on("error", () => {
        try {
          socket.destroy();
        } catch {}
      });
      const parsed = parse(req.url || "/", true);
      if (parsed.pathname === "/ws/multiplayer") {
        try {
          wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit("connection", ws, req);
          });
        } catch {
          try {
            socket.destroy();
          } catch {}
        }
      } else if (parsed.pathname === "/ws/mirror") {
        try {
          mirrorWss.handleUpgrade(req, socket, head, (ws) => {
            mirrorWss.emit("connection", ws, req);
          });
        } catch {
          try {
            socket.destroy();
          } catch {}
        }
      } else {
        Promise.resolve(nextUpgradeHandler(req, socket, head)).catch(() => {
          try {
            socket.destroy();
          } catch {}
        });
      }
    });

    server.listen(port, hostname, () => {
      isListening = true;
      console.log(`> Hoops Moves server listening on http://${hostname}:${port} (dev=${dev})`);
    });
  })
  .catch((err) => {
    console.error("[server] Failed to prepare Next.js app:", err);
    process.exit(1);
  });
