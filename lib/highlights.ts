export interface HighlightActorFrame {
  idx: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pelvisY: number;
  hipR: number;
  hipL: number;
  kneeR: number;
  kneeL: number;
  shR: number;
  shL: number;
  elR: number;
  elL: number;
  lean: number;
  visible: boolean;
}

export interface HighlightFrame {
  t: number;
  ballPos: [number, number, number];
  actors: HighlightActorFrame[];
}

export interface HighlightClip {
  id: string;
  quarter: number;
  clockText: string;
  scorerName: string;
  team: "Home" | "Away";
  playType: string;
  points: number;
  scoreHomeAfter: number;
  scoreAwayAfter: number;
  frames: HighlightFrame[];
  signatureTag?: "tiki_tiki_slam";
  accentColors?: [string, string];
}

export function formatClockLabel(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${mins}:${rem < 10 ? "0" : ""}${rem}`;
}

export function interpolateHighlightFrame(
  frames: HighlightFrame[],
  progress01: number
): HighlightFrame | null {
  if (!frames || frames.length === 0) return null;
  if (frames.length === 1) return frames[0];

  const clamped = Math.max(0, Math.min(1, progress01));
  const scaled = clamped * (frames.length - 1);
  const idx0 = Math.floor(scaled);
  const idx1 = Math.min(frames.length - 1, idx0 + 1);
  const alpha = scaled - idx0;

  const f0 = frames[idx0];
  const f1 = frames[idx1];
  const lerp = (a: number, b: number) => a + (b - a) * alpha;

  const actors: HighlightActorFrame[] = f0.actors.map((a0, i) => {
    const a1 = f1.actors[i] || a0;
    // Shortest angular interpolation for yaw
    let dyaw = a1.yaw - a0.yaw;
    while (dyaw > Math.PI) dyaw -= Math.PI * 2;
    while (dyaw < -Math.PI) dyaw += Math.PI * 2;

    return {
      idx: a0.idx,
      x: lerp(a0.x, a1.x),
      y: lerp(a0.y, a1.y),
      z: lerp(a0.z, a1.z),
      yaw: a0.yaw + dyaw * alpha,
      pelvisY: lerp(a0.pelvisY, a1.pelvisY),
      hipR: lerp(a0.hipR, a1.hipR),
      hipL: lerp(a0.hipL, a1.hipL),
      kneeR: lerp(a0.kneeR, a1.kneeR),
      kneeL: lerp(a0.kneeL, a1.kneeL),
      shR: lerp(a0.shR, a1.shR),
      shL: lerp(a0.shL, a1.shL),
      elR: lerp(a0.elR, a1.elR),
      elL: lerp(a0.elL, a1.elL),
      lean: lerp(a0.lean, a1.lean),
      visible: a0.visible,
    };
  });

  return {
    t: lerp(f0.t, f1.t),
    ballPos: [
      lerp(f0.ballPos[0], f1.ballPos[0]),
      lerp(f0.ballPos[1], f1.ballPos[1]),
      lerp(f0.ballPos[2], f1.ballPos[2]),
    ],
    actors,
  };
}
