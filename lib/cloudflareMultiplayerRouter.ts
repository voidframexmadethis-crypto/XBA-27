import {
  formatToMaxPlayers,
  type MultiplayerRoomState,
  type MultiplayerRoomSummary,
} from "./multiplayerTypes.ts";

export const PUBLIC_ROOM_CODE = "PUBLIC-COURT";
export const GLOBAL_LOBBY_NAME = "GLOBAL-LOBBY";

export interface CloudflareMultiplayerEnv {
  HOOPS_ROOM?: DurableObjectNamespace;
  HOOPS_LOBBY?: DurableObjectNamespace;
}

export function sanitizeDoRoomCode(raw?: string | null): string {
  const cleaned = String(raw || PUBLIC_ROOM_CODE)
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 16);
  return cleaned.length >= 3 ? cleaned : PUBLIC_ROOM_CODE;
}

export function generateDoRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "HOOP-";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function handleCloudflareMultiplayerRequest(
  request: Request,
  env: CloudflareMultiplayerEnv
): Promise<Response | null> {
  if (!env?.HOOPS_ROOM) return null;

  const url = new URL(request.url);

  // WebSocket upgrade goes straight to the targeted HoopsRoom Durable Object
  if (url.pathname.startsWith("/ws/multiplayer") || request.headers.get("Upgrade")?.toLowerCase() === "websocket") {
    const roomCode = sanitizeDoRoomCode(url.searchParams.get("room") || url.searchParams.get("roomCode"));
    const stub = env.HOOPS_ROOM.get(env.HOOPS_ROOM.idFromName(roomCode));
    return stub.fetch(request);
  }

  // HTTP /api/multiplayer routing
  if (request.method === "GET") {
    const action = url.searchParams.get("action") || "room";
    if (action === "list") {
      if (env.HOOPS_LOBBY) {
        const lobbyStub = env.HOOPS_LOBBY.get(env.HOOPS_LOBBY.idFromName(GLOBAL_LOBBY_NAME));
        return lobbyStub.fetch(request);
      }
      const pubStub = env.HOOPS_ROOM.get(env.HOOPS_ROOM.idFromName(PUBLIC_ROOM_CODE));
      const res = await pubStub.fetch(new Request(new URL(`/api/multiplayer?room=${PUBLIC_ROOM_CODE}`, url.origin)));
      const data = (await res.json()) as { ok?: boolean; room?: MultiplayerRoomState };
      const rm = data?.room;
      const rooms: MultiplayerRoomSummary[] = rm
        ? [
            {
              roomCode: rm.roomCode,
              isPrivate: rm.isPrivate,
              format: rm.match.format || "5v5",
              playerCount: Object.keys(rm.players).length,
              maxPlayers: formatToMaxPlayers(rm.match.format),
              cityId: rm.match.cityId,
              mode: rm.match.mode,
              leagueDivision: rm.match.leagueDivision || "mens",
              competitionType: rm.match.competitionType || "pro",
              devices: Array.from(new Set(Object.values(rm.players).map((p) => p.deviceType))),
            },
          ]
        : [];
      return Response.json({ ok: true, rooms, transport: "cloudflare-do" });
    }

    const roomCode = sanitizeDoRoomCode(url.searchParams.get("room") || url.searchParams.get("roomCode"));
    const stub = env.HOOPS_ROOM.get(env.HOOPS_ROOM.idFromName(roomCode));
    return stub.fetch(request);
  }

  if (request.method === "POST") {
    const rawBody = await request.text();
    let parsed: any = {};
    try {
      parsed = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const action = String(parsed?.action || "");
    let roomCode = sanitizeDoRoomCode(
      parsed?.roomCode || url.searchParams.get("room") || url.searchParams.get("roomCode")
    );

    if (action === "create") {
      if (env.HOOPS_LOBBY) {
        const lobbyStub = env.HOOPS_LOBBY.get(env.HOOPS_LOBBY.idFromName(GLOBAL_LOBBY_NAME));
        const reserveRes = await lobbyStub.fetch("https://lobby.internal/reserve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reserve",
            format: parsed.format,
            isPrivate: parsed.isPrivate,
            cityId: parsed.cityId,
            mode: parsed.mode,
            leagueDivision: parsed.leagueDivision,
            competitionType: parsed.competitionType,
          }),
        });
        const reserved = (await reserveRes.json()) as { roomCode?: string };
        roomCode = sanitizeDoRoomCode(reserved?.roomCode || generateDoRoomCode());
      } else {
        roomCode = generateDoRoomCode();
      }
      parsed.roomCode = roomCode;
    }

    const forwardUrl = new URL(request.url);
    forwardUrl.searchParams.set("room", roomCode);
    const stub = env.HOOPS_ROOM.get(env.HOOPS_ROOM.idFromName(roomCode));
    return stub.fetch(
      new Request(forwardUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      })
    );
  }

  return Response.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}
