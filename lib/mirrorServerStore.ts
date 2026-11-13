import type { MirrorMatchMeta, MirrorSessionSummary } from "./mirrorTypes.ts";

export interface MirrorServerSession {
  code: string;
  active: boolean;
  meta: MirrorMatchMeta;
  latestFrame: string | null;
  seq: number;
  createdAt: number;
  updatedAt: number;
  viewers: Map<string, number>;
}

interface GlobalWithMirrorStore {
  __hoopsMirrorStore?: Map<string, MirrorServerSession>;
}

const STALE_SESSION_MS = 10 * 60_000;
const STALE_VIEWER_MS = 20_000;

function getMirrorMap(): Map<string, MirrorServerSession> {
  const g = globalThis as unknown as GlobalWithMirrorStore;
  if (!g.__hoopsMirrorStore) {
    g.__hoopsMirrorStore = new Map<string, MirrorServerSession>();
  }
  return g.__hoopsMirrorStore;
}

export function normalizeMirrorCode(raw?: string): string {
  const cleaned = (raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 16);
  return cleaned.length >= 3 ? cleaned : generateMirrorCode();
}

export function generateMirrorCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TV-${suffix}`;
}

export function pruneMirrorSessions() {
  const map = getMirrorMap();
  const now = Date.now();
  for (const [code, sess] of map.entries()) {
    for (const [vid, lastSeen] of sess.viewers.entries()) {
      if (now - lastSeen > STALE_VIEWER_MS) {
        sess.viewers.delete(vid);
      }
    }
    if (!sess.active || now - sess.updatedAt > STALE_SESSION_MS) {
      map.delete(code);
    }
  }
}

export function upsertMirrorSession(rawCode: string, meta: MirrorMatchMeta): MirrorServerSession {
  pruneMirrorSessions();
  const map = getMirrorMap();
  const code = normalizeMirrorCode(rawCode);
  const now = Date.now();
  const existing = map.get(code);
  if (existing) {
    existing.active = true;
    existing.meta = meta;
    existing.updatedAt = now;
    return existing;
  }
  const created: MirrorServerSession = {
    code,
    active: true,
    meta,
    latestFrame: null,
    seq: 0,
    createdAt: now,
    updatedAt: now,
    viewers: new Map<string, number>(),
  };
  map.set(code, created);
  return created;
}

export function updateMirrorMeta(rawCode: string, meta: MirrorMatchMeta): MirrorServerSession | null {
  const map = getMirrorMap();
  const code = normalizeMirrorCode(rawCode);
  const existing = map.get(code);
  if (!existing) return null;
  existing.meta = meta;
  existing.updatedAt = Date.now();
  return existing;
}

export function pushMirrorFrame(
  rawCode: string,
  dataUrl: string,
  seq: number,
  meta?: MirrorMatchMeta
): MirrorServerSession | null {
  const map = getMirrorMap();
  const code = normalizeMirrorCode(rawCode);
  let sess = map.get(code);
  const now = Date.now();
  if (!sess) {
    if (!meta) return null;
    sess = upsertMirrorSession(code, meta);
  }
  sess.latestFrame = dataUrl;
  sess.seq = seq;
  if (meta) sess.meta = meta;
  sess.active = true;
  sess.updatedAt = now;
  return sess;
}

export function addMirrorViewer(rawCode: string, viewerId: string): MirrorServerSession | null {
  pruneMirrorSessions();
  const map = getMirrorMap();
  const code = normalizeMirrorCode(rawCode);
  const sess = map.get(code);
  if (!sess || !sess.active) return null;
  sess.viewers.set(viewerId, Date.now());
  return sess;
}

export function touchMirrorViewer(rawCode: string, viewerId: string): MirrorServerSession | null {
  const map = getMirrorMap();
  const code = normalizeMirrorCode(rawCode);
  const sess = map.get(code);
  if (!sess || !sess.active) return null;
  sess.viewers.set(viewerId, Date.now());
  return sess;
}

export function removeMirrorViewer(rawCode: string, viewerId: string): MirrorServerSession | null {
  const map = getMirrorMap();
  const code = normalizeMirrorCode(rawCode);
  const sess = map.get(code);
  if (!sess) return null;
  sess.viewers.delete(viewerId);
  return sess;
}

export function endMirrorSession(rawCode: string): boolean {
  const map = getMirrorMap();
  const code = normalizeMirrorCode(rawCode);
  const sess = map.get(code);
  if (!sess) return false;
  sess.active = false;
  sess.latestFrame = null;
  map.delete(code);
  return true;
}

export function getMirrorSession(rawCode: string): MirrorServerSession | null {
  pruneMirrorSessions();
  const map = getMirrorMap();
  const code = normalizeMirrorCode(rawCode);
  return map.get(code) || null;
}

export function listMirrorSessions(): MirrorSessionSummary[] {
  pruneMirrorSessions();
  const map = getMirrorMap();
  const out: MirrorSessionSummary[] = [];
  for (const sess of map.values()) {
    if (!sess.active) continue;
    out.push({
      code: sess.code,
      hostName: sess.meta.hostName,
      cityName: sess.meta.cityName,
      cityFlag: sess.meta.cityFlag,
      mode: sess.meta.mode,
      scoreHome: sess.meta.scoreHome,
      scoreAway: sess.meta.scoreAway,
      viewerCount: sess.viewers.size,
      updatedAt: sess.updatedAt,
    });
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt);
}
