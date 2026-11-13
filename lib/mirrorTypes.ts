export interface MirrorMatchMeta {
  hostName: string;
  cityName: string;
  cityFlag: string;
  mode: string;
  scoreHome: number;
  scoreAway: number;
  quarter: number;
  gameClock: number;
  shotClock: number;
  homeTeamName: string;
  awayTeamName: string;
}

export interface MirrorSessionSummary {
  code: string;
  hostName: string;
  cityName: string;
  cityFlag: string;
  mode: string;
  scoreHome: number;
  scoreAway: number;
  viewerCount: number;
  updatedAt: number;
}

export interface MirrorRtcSdp {
  type: "offer" | "answer" | "pranswer" | "rollback";
  sdp?: string;
}

export interface MirrorRtcIceCandidate {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

export type MirrorClientWsMessage =
  | { type: "start_broadcast"; code: string; meta: MirrorMatchMeta }
  | { type: "update_meta"; code: string; meta: MirrorMatchMeta }
  | { type: "frame"; code: string; dataUrl: string; seq: number; meta?: MirrorMatchMeta }
  | { type: "stop_broadcast"; code: string }
  | { type: "join_viewer"; code: string; viewerId: string }
  | { type: "leave_viewer"; code: string; viewerId: string }
  | { type: "rtc_offer"; code: string; viewerId: string; sdp: MirrorRtcSdp }
  | { type: "rtc_answer"; code: string; viewerId: string; sdp: MirrorRtcSdp }
  | {
      type: "rtc_ice";
      code: string;
      viewerId: string;
      from: "sender" | "viewer";
      candidate: MirrorRtcIceCandidate;
    }
  | { type: "ping"; ts: number };

export type MirrorServerWsMessage =
  | { type: "broadcast_started"; code: string; viewerCount: number }
  | { type: "viewer_count"; code: string; viewerCount: number }
  | { type: "viewer_joined"; code: string; viewerId: string; viewerCount: number }
  | { type: "viewer_left"; code: string; viewerId: string; viewerCount: number }
  | {
      type: "session_state";
      code: string;
      active: boolean;
      meta: MirrorMatchMeta | null;
      latestFrame: string | null;
      seq: number;
      viewerCount: number;
    }
  | { type: "frame"; code: string; dataUrl: string; seq: number; meta?: MirrorMatchMeta }
  | { type: "meta"; code: string; meta: MirrorMatchMeta }
  | { type: "rtc_offer"; code: string; viewerId: string; sdp: MirrorRtcSdp }
  | { type: "rtc_answer"; code: string; viewerId: string; sdp: MirrorRtcSdp }
  | {
      type: "rtc_ice";
      code: string;
      viewerId: string;
      from: "sender" | "viewer";
      candidate: MirrorRtcIceCandidate;
    }
  | { type: "broadcast_ended"; code: string }
  | { type: "pong"; ts: number }
  | { type: "error"; message: string };
