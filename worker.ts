import { HoopsRoom } from "./lib/hoopsRoomDO.ts";

export { HoopsRoom };

export interface Env {
  HOOPS_ROOM: DurableObjectNamespace;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/ws/multiplayer") || url.pathname.startsWith("/api/multiplayer")) {
      const roomCode = (url.searchParams.get("room") || url.searchParams.get("roomCode") || "PUBLIC-COURT").toUpperCase();
      const id = env.HOOPS_ROOM.idFromName(roomCode);
      const stub = env.HOOPS_ROOM.get(id);
      return stub.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  },
};

export default worker;
