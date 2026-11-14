import { NextRequest, NextResponse } from "next/server";
import {
  handleCloudflareMultiplayerRequest,
  type CloudflareMultiplayerEnv,
} from "@/lib/cloudflareMultiplayerRouter";
import {
  applyMatchEvent,
  generateRoomCode,
  getRoom,
  joinRoom,
  leaveRoom,
  listPublicRooms,
  syncPlayerState,
} from "@/lib/multiplayerServerStore";

export const dynamic = "force-dynamic";

const CLOUDFLARE_CONTEXT_SYMBOL = Symbol.for("__cloudflare-context__");

function getActiveCloudflareEnv(): CloudflareMultiplayerEnv | null {
  const ctx = (globalThis as Record<symbol, unknown>)[CLOUDFLARE_CONTEXT_SYMBOL] as
    | { env?: CloudflareMultiplayerEnv }
    | undefined;
  if (ctx?.env?.HOOPS_ROOM) {
    return ctx.env;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const cfEnv = getActiveCloudflareEnv();
    if (cfEnv) {
      const cfRes = await handleCloudflareMultiplayerRequest(req, cfEnv);
      if (cfRes) return cfRes;
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "room";
    if (action === "list") {
      return NextResponse.json({ ok: true, rooms: listPublicRooms(), transport: "http" });
    }
    const roomCode = searchParams.get("room") || "PUBLIC-COURT";
    const room = getRoom(roomCode);
    return NextResponse.json({ ok: true, room, transport: "http" });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to fetch multiplayer state" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const cfEnv = getActiveCloudflareEnv();
    if (cfEnv) {
      const cfRes = await handleCloudflareMultiplayerRequest(req, cfEnv);
      if (cfRes) return cfRes;
    }

    const body = (await req.json()) as any;
    const action = String(body?.action || "");

    if (action === "create") {
      const code = generateRoomCode();
      const room = joinRoom({
        roomCode: code,
        playerId: String(body.playerId || `host_${Date.now()}`),
        name: String(body.name || "Host"),
        deviceType: body.deviceType || "desktop",
        jerseyColor: body.jerseyColor,
        shortsColor: body.shortsColor,
        cityId: body.cityId,
        mode: body.mode,
        format: body.format,
        leagueDivision: body.leagueDivision,
        competitionType: body.competitionType,
        isPrivate: Boolean(body.isPrivate),
      });
      return NextResponse.json({ ok: true, room, transport: "http" });
    }

    if (action === "join") {
      const room = joinRoom({
        roomCode: body.roomCode,
        playerId: String(body.playerId),
        name: String(body.name || "Player"),
        deviceType: body.deviceType || "desktop",
        jerseyColor: body.jerseyColor,
        shortsColor: body.shortsColor,
        preferredTeam: body.preferredTeam,
        cityId: body.cityId,
        mode: body.mode,
        format: body.format,
        leagueDivision: body.leagueDivision,
        competitionType: body.competitionType,
        isPrivate: Boolean(body.isPrivate),
      });
      return NextResponse.json({ ok: true, room, transport: "http" });
    }

    if (action === "sync") {
      const { room, player } = syncPlayerState({
        roomCode: body.roomCode || "PUBLIC-COURT",
        playerId: String(body.playerId),
        transform: body.transform,
        ready: body.ready,
        name: body.name,
        deviceType: body.deviceType,
        stats: body.stats,
        matchPatch: body.matchPatch,
      });
      return NextResponse.json({ ok: true, room, player, transport: "http" });
    }

    if (action === "event") {
      const { room, event } = applyMatchEvent({
        roomCode: body.roomCode || "PUBLIC-COURT",
        playerId: String(body.playerId),
        type: body.type,
        payload: body.payload,
      });
      return NextResponse.json({ ok: true, room, event, transport: "http" });
    }

    if (action === "leave") {
      const room = leaveRoom(String(body.roomCode || "PUBLIC-COURT"), String(body.playerId));
      return NextResponse.json({ ok: true, room, transport: "http" });
    }

    return NextResponse.json({ ok: false, error: "Unknown multiplayer action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Multiplayer POST error" },
      { status: 500 }
    );
  }
}
