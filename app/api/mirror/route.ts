import { NextRequest, NextResponse } from "next/server";
import {
  addMirrorViewer,
  endMirrorSession,
  generateMirrorCode,
  getMirrorSession,
  listMirrorSessions,
  pushMirrorFrame,
  removeMirrorViewer,
  touchMirrorViewer,
  updateMirrorMeta,
  upsertMirrorSession,
} from "@/lib/mirrorServerStore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "session";
    if (action === "list") {
      return NextResponse.json({ ok: true, sessions: listMirrorSessions() });
    }
    const code = searchParams.get("code") || "";
    const viewerId = searchParams.get("viewerId");
    if (!code) {
      return NextResponse.json({ ok: false, error: "Missing mirror code" }, { status: 400 });
    }
    const sess = viewerId ? touchMirrorViewer(code, viewerId) : getMirrorSession(code);
    if (!sess) {
      return NextResponse.json({
        ok: true,
        active: false,
        session: null,
      });
    }
    return NextResponse.json({
      ok: true,
      active: sess.active,
      session: {
        code: sess.code,
        active: sess.active,
        meta: sess.meta,
        latestFrame: sess.latestFrame,
        seq: sess.seq,
        viewerCount: sess.viewers.size,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to query mirror session" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const action = String(body?.action || "");

    if (action === "start") {
      const code = body.code ? String(body.code) : generateMirrorCode();
      const sess = upsertMirrorSession(code, body.meta);
      return NextResponse.json({
        ok: true,
        code: sess.code,
        viewerCount: sess.viewers.size,
      });
    }

    if (action === "frame") {
      const code = String(body.code || "");
      const dataUrl = String(body.dataUrl || "");
      const seq = Number(body.seq || 0);
      const sess = pushMirrorFrame(code, dataUrl, seq, body.meta);
      if (!sess) {
        return NextResponse.json({ ok: false, error: "Mirror session not active" }, { status: 404 });
      }
      return NextResponse.json({
        ok: true,
        code: sess.code,
        viewerCount: sess.viewers.size,
      });
    }

    if (action === "meta") {
      const sess = updateMirrorMeta(String(body.code || ""), body.meta);
      if (!sess) {
        return NextResponse.json({ ok: false, error: "Mirror session not active" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, viewerCount: sess.viewers.size });
    }

    if (action === "join_viewer") {
      const code = String(body.code || "");
      const viewerId = String(body.viewerId || `v_${Date.now()}`);
      const sess = addMirrorViewer(code, viewerId);
      if (!sess) {
        return NextResponse.json({ ok: true, active: false, session: null });
      }
      return NextResponse.json({
        ok: true,
        active: true,
        session: {
          code: sess.code,
          active: sess.active,
          meta: sess.meta,
          latestFrame: sess.latestFrame,
          seq: sess.seq,
          viewerCount: sess.viewers.size,
        },
      });
    }

    if (action === "leave_viewer") {
      const sess = removeMirrorViewer(String(body.code || ""), String(body.viewerId || ""));
      return NextResponse.json({ ok: true, viewerCount: sess ? sess.viewers.size : 0 });
    }

    if (action === "stop") {
      const stopped = endMirrorSession(String(body.code || ""));
      return NextResponse.json({ ok: true, stopped });
    }

    return NextResponse.json({ ok: false, error: "Unknown mirror action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Mirror POST error" },
      { status: 500 }
    );
  }
}
