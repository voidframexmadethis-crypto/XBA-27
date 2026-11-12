export interface AudioVolumeSettings {
  music: number; // 0..1
  musicEnabled: boolean;
  sfx: number; // 0..1
  crowd: number; // 0..1
  muted: boolean;
}

const AUDIO_SETTINGS_KEY = "hoops_audio_settings_v1";

export const DEFAULT_AUDIO_SETTINGS: AudioVolumeSettings = {
  music: 0.65,
  musicEnabled: true,
  sfx: 0.85,
  crowd: 0.7,
  muted: false,
};

export const MENU_MUSIC_PATH =
  "/assets/aistudio/rahulsapkal-rise-from-nothing-english-rap-song-powerful-hip-hop-track-507580_352e927a.mp3";

export const UPLOADED_AUDIO_PATHS = {
  bounces: "/assets/aistudio/mixkit-ball-bouncing-to-a-stop-2089_f1c9a4c3.wav",
  buzzer: "/assets/aistudio/mixkit-basketball-buzzer-1647_35208d2c.wav",
  crowdGame: "/assets/aistudio/freesound_community-basketball-game-65753_4a8ab5ef.mp3",
  netSwish: "/assets/aistudio/freesound_community-basketball-net-swish-sound-40170_ec4ea39e.mp3",
  sneakerSqueak: "/assets/aistudio/freesound_community-sneaker-squeak-rubber-91711_9c4236f1.mp3",
} as const;

type AssetKey = keyof typeof UPLOADED_AUDIO_PATHS;

interface SliceDef {
  offset: number;
  duration: number;
  baseGain?: number;
  rateMin?: number;
  rateMax?: number;
}

// Verified exact timestamp slices inside the user's 5 uploaded audio files
const SQUEAK_SLICES: SliceDef[] = [
  { offset: 1.70, duration: 0.34, baseGain: 0.72, rateMin: 0.96, rateMax: 1.05 },
  { offset: 2.10, duration: 0.25, baseGain: 0.68, rateMin: 0.96, rateMax: 1.05 },
  { offset: 3.40, duration: 0.30, baseGain: 0.72, rateMin: 0.96, rateMax: 1.05 },
  { offset: 4.65, duration: 0.30, baseGain: 0.58, rateMin: 0.97, rateMax: 1.04 },
  { offset: 5.75, duration: 0.38, baseGain: 0.75, rateMin: 0.96, rateMax: 1.04 },
  { offset: 7.00, duration: 0.34, baseGain: 0.58, rateMin: 0.97, rateMax: 1.04 },
  { offset: 7.75, duration: 0.25, baseGain: 0.85, rateMin: 0.96, rateMax: 1.05 },
  { offset: 8.70, duration: 0.25, baseGain: 0.68, rateMin: 0.96, rateMax: 1.04 },
  { offset: 9.25, duration: 0.22, baseGain: 0.82, rateMin: 0.96, rateMax: 1.05 },
];

const DRIBBLE_SLICES: SliceDef[] = [
  { offset: 0.01, duration: 0.26, baseGain: 0.78, rateMin: 0.97, rateMax: 1.03 },
  { offset: 0.59, duration: 0.26, baseGain: 0.92, rateMin: 0.97, rateMax: 1.03 },
  { offset: 1.23, duration: 0.24, baseGain: 1.05, rateMin: 0.98, rateMax: 1.03 },
  { offset: 1.79, duration: 0.20, baseGain: 1.02, rateMin: 0.98, rateMax: 1.04 },
];

const SHOT_RELEASE_SLICES: SliceDef[] = [
  { offset: 1.23, duration: 0.14, baseGain: 0.85, rateMin: 1.04, rateMax: 1.1 },
  { offset: 1.79, duration: 0.14, baseGain: 0.85, rateMin: 1.02, rateMax: 1.08 },
];

const PASS_SLICES: SliceDef[] = [
  { offset: 1.79, duration: 0.16, baseGain: 0.88, rateMin: 1.0, rateMax: 1.06 },
  { offset: 2.19, duration: 0.16, baseGain: 0.95, rateMin: 0.98, rateMax: 1.05 },
];

const CATCH_SLICES: SliceDef[] = [
  { offset: 2.19, duration: 0.15, baseGain: 0.9, rateMin: 0.95, rateMax: 1.02 },
  { offset: 2.59, duration: 0.15, baseGain: 0.95, rateMin: 0.96, rateMax: 1.02 },
];

const FLOOR_BOUNCE_SLICES: SliceDef[] = [
  { offset: 0.59, duration: 0.24, baseGain: 0.85, rateMin: 0.95, rateMax: 1.03 },
  { offset: 1.23, duration: 0.22, baseGain: 0.95, rateMin: 0.96, rateMax: 1.03 },
  { offset: 2.19, duration: 0.18, baseGain: 0.95, rateMin: 0.95, rateMax: 1.04 },
];

const NET_SWISH_SLICES: SliceDef[] = [
  { offset: 0.20, duration: 0.36, baseGain: 1.05, rateMin: 0.98, rateMax: 1.03 },
  { offset: 0.90, duration: 0.32, baseGain: 1.1, rateMin: 0.98, rateMax: 1.03 },
  { offset: 1.60, duration: 0.40, baseGain: 0.95, rateMin: 0.97, rateMax: 1.02 },
  { offset: 2.75, duration: 0.34, baseGain: 1.05, rateMin: 0.98, rateMax: 1.04 },
];

const RIM_HIT_SLICES: SliceDef[] = [
  { offset: 3.55, duration: 0.34, baseGain: 1.05, rateMin: 0.9, rateMax: 0.96 },
  { offset: 4.15, duration: 0.36, baseGain: 1.05, rateMin: 0.88, rateMax: 0.95 },
];

const BACKBOARD_HIT_SLICES: SliceDef[] = [
  { offset: 4.15, duration: 0.36, baseGain: 1.0, rateMin: 1.04, rateMax: 1.1 },
  { offset: 3.55, duration: 0.32, baseGain: 0.95, rateMin: 1.05, rateMax: 1.12 },
];

const DUNK_SLICES: SliceDef[] = [
  { offset: 5.00, duration: 0.65, baseGain: 1.15, rateMin: 0.96, rateMax: 1.02 },
];

const CROWD_CHEER_SLICES: SliceDef[] = [
  { offset: 0.55, duration: 2.1, baseGain: 0.95, rateMin: 0.98, rateMax: 1.02 },
  { offset: 10.15, duration: 2.3, baseGain: 0.95, rateMin: 0.98, rateMax: 1.02 },
  { offset: 14.85, duration: 2.4, baseGain: 0.92, rateMin: 0.98, rateMax: 1.02 },
];

const CROWD_REACTION_SLICES: SliceDef[] = [
  { offset: 5.45, duration: 1.35, baseGain: 0.88, rateMin: 0.97, rateMax: 1.03 },
  { offset: 8.85, duration: 1.35, baseGain: 0.88, rateMin: 0.97, rateMax: 1.03 },
  { offset: 13.05, duration: 1.45, baseGain: 0.85, rateMin: 0.97, rateMax: 1.03 },
];

export function loadAudioSettings(): AudioVolumeSettings {
  if (typeof window === "undefined") return { ...DEFAULT_AUDIO_SETTINGS };
  try {
    const raw = window.localStorage.getItem(AUDIO_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_AUDIO_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      music: clamp01(typeof parsed.music === "number" ? parsed.music : DEFAULT_AUDIO_SETTINGS.music),
      musicEnabled:
        typeof parsed.musicEnabled === "boolean"
          ? parsed.musicEnabled
          : DEFAULT_AUDIO_SETTINGS.musicEnabled,
      sfx: clamp01(typeof parsed.sfx === "number" ? parsed.sfx : DEFAULT_AUDIO_SETTINGS.sfx),
      crowd: clamp01(typeof parsed.crowd === "number" ? parsed.crowd : DEFAULT_AUDIO_SETTINGS.crowd),
      muted: Boolean(parsed.muted),
    };
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

export function saveAudioSettings(settings: AudioVolumeSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function clampPan(v: number): number {
  return Math.min(1, Math.max(-1, v));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class BasketballAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private crowdGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private buffers = new Map<AssetKey, AudioBuffer>();
  private loadingPromise: Promise<void> | null = null;
  private settings: AudioVolumeSettings = loadAudioSettings();

  // Continuous Crowd Ambience loop node
  private ambienceSource: AudioBufferSourceNode | null = null;
  private ambienceGain: GainNode | null = null;

  // Main Menu Soundtrack ("Rise From Nothing") singleton playback state
  private menuMusicRawPromise: Promise<ArrayBuffer | null> | null = null;
  private menuMusicDecodePromise: Promise<AudioBuffer | null> | null = null;
  private menuMusicBuffer: AudioBuffer | null = null;
  private menuMusicSource: AudioBufferSourceNode | null = null;
  private menuMusicFadeGain: GainNode | null = null;
  private menuMusicFadeTimer: ReturnType<typeof setTimeout> | null = null;
  private menuMusicSessionId = 0;
  private isInMenu = true;
  private menuWasStoppedForGameplay = false;
  private menuMusicPendingRestart = false;

  // Polyphony & cooldown tracking to avoid excessive audio stacking
  private lastPlayedMs = new Map<string, number>();
  private activeSfxCount = 0;
  private activeSqueakCount = 0;
  private activeCrowdCount = 0;
  private unlocked = false;
  private disposed = false;

  constructor() {
    this.settings = loadAudioSettings();
    // Begin downloading "Rise From Nothing" immediately so it starts instantaneously once AudioContext is unlocked
    if (typeof window !== "undefined") {
      this.prefetchMenuMusicBytes();
    }
  }

  public getSettings(): AudioVolumeSettings {
    return { ...this.settings };
  }

  public updateSettings(patch: Partial<AudioVolumeSettings>): AudioVolumeSettings {
    const prevEnabled = this.settings.musicEnabled;
    this.settings = {
      ...this.settings,
      ...patch,
      music: clamp01(patch.music ?? this.settings.music),
      musicEnabled: patch.musicEnabled ?? this.settings.musicEnabled,
      sfx: clamp01(patch.sfx ?? this.settings.sfx),
      crowd: clamp01(patch.crowd ?? this.settings.crowd),
    };
    saveAudioSettings(this.settings);
    this.applyGains();

    if (prevEnabled && !this.settings.musicEnabled) {
      this.fadeOutMenuMusic(0.45);
    } else if (!prevEnabled && this.settings.musicEnabled && this.isInMenu) {
      this.startMenuMusic({ restart: false });
    }
    return this.getSettings();
  }

  private prefetchMenuMusicBytes(): Promise<ArrayBuffer | null> {
    if (this.menuMusicRawPromise) return this.menuMusicRawPromise;
    this.menuMusicRawPromise = fetch(MENU_MUSIC_PATH)
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .catch(() => null);
    return this.menuMusicRawPromise;
  }

  private async ensureMenuMusicDecoded(): Promise<AudioBuffer | null> {
    if (this.menuMusicBuffer) return this.menuMusicBuffer;
    if (!this.ctx) return null;
    if (this.menuMusicDecodePromise) return this.menuMusicDecodePromise;

    this.menuMusicDecodePromise = (async () => {
      try {
        const bytes = await this.prefetchMenuMusicBytes();
        if (!bytes || !this.ctx || this.disposed) return null;
        // Pass a defensive slice so decodeAudioData never leaves a detached shared reference
        const decoded = await this.decodeAudio(this.ctx, bytes.slice(0));
        this.menuMusicBuffer = decoded;
        return decoded;
      } catch {
        this.menuMusicDecodePromise = null;
        return null;
      }
    })();

    return this.menuMusicDecodePromise;
  }

  public setMenuActive(active: boolean): void {
    if (active) {
      const returningFromGameplay = !this.isInMenu && this.menuWasStoppedForGameplay;
      this.isInMenu = true;
      this.menuWasStoppedForGameplay = false;
      this.startMenuMusic({ restart: returningFromGameplay });
    } else {
      if (this.isInMenu) {
        this.isInMenu = false;
        this.menuWasStoppedForGameplay = true;
        this.fadeOutMenuMusic(3.0);
      }
    }
  }

  public startMenuMusic(options?: { restart?: boolean }): void {
    if (this.disposed || !this.isInMenu || !this.settings.musicEnabled) return;

    const restart = Boolean(options?.restart);
    if (restart) {
      this.menuMusicPendingRestart = true;
    }

    // Cancel any active fade-out timer
    if (this.menuMusicFadeTimer) {
      clearTimeout(this.menuMusicFadeTimer);
      this.menuMusicFadeTimer = null;
    }

    // If soundtrack is already loaded and actively playing and no restart was requested,
    // keep it playing seamlessly and restore full fade gain (prevents duplicates!)
    if (this.menuMusicSource && !restart && !this.menuMusicPendingRestart) {
      if (this.ctx && this.menuMusicFadeGain && this.ctx.state === "running") {
        const now = this.ctx.currentTime;
        const g = this.menuMusicFadeGain.gain;
        g.cancelScheduledValues(now);
        g.setValueAtTime(Math.max(0.0001, g.value), now);
        g.linearRampToValueAtTime(1.0, now + 0.35);
      }
      return;
    }

    void this.tryStartMenuMusicPlayback();
  }

  private async tryStartMenuMusicPlayback(): Promise<void> {
    if (this.disposed || !this.isInMenu || !this.settings.musicEnabled) return;
    if (!this.ctx || this.ctx.state !== "running" || !this.musicGain) return;

    const mySession = ++this.menuMusicSessionId;
    const buffer = await this.ensureMenuMusicDecoded();
    if (
      this.disposed ||
      mySession !== this.menuMusicSessionId ||
      !buffer ||
      !this.ctx ||
      this.ctx.state !== "running" ||
      !this.musicGain ||
      !this.isInMenu ||
      !this.settings.musicEnabled
    ) {
      return;
    }

    const shouldRestart = this.menuMusicPendingRestart;
    this.menuMusicPendingRestart = false;

    // Singleton protection: never allow more than one instance to play simultaneously
    if (this.menuMusicSource && !shouldRestart) {
      return;
    }
    this.stopMenuMusicImmediate();

    const now = this.ctx.currentTime;
    const fadeGain = this.ctx.createGain();
    fadeGain.gain.setValueAtTime(0.001, now);
    fadeGain.gain.linearRampToValueAtTime(1.0, now + 0.45);
    fadeGain.connect(this.musicGain);

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(fadeGain);

    src.onended = () => {
      if (this.menuMusicSource === src) {
        this.menuMusicSource = null;
        try {
          fadeGain.disconnect();
        } catch {}
        if (this.menuMusicFadeGain === fadeGain) {
          this.menuMusicFadeGain = null;
        }
      }
    };

    this.menuMusicSource = src;
    this.menuMusicFadeGain = fadeGain;
    try {
      src.start(now, 0);
    } catch {
      this.stopMenuMusicImmediate();
    }
  }

  public fadeOutMenuMusic(durationSec = 3.0): void {
    // Invalidate any in-flight async start so a slow decode cannot resurrect after gameplay starts
    this.menuMusicSessionId++;
    this.menuMusicPendingRestart = false;

    if (this.menuMusicFadeTimer) {
      clearTimeout(this.menuMusicFadeTimer);
      this.menuMusicFadeTimer = null;
    }

    if (!this.menuMusicSource || !this.menuMusicFadeGain || !this.ctx) {
      this.stopMenuMusicImmediate();
      return;
    }

    const now = this.ctx.currentTime;
    const g = this.menuMusicFadeGain.gain;
    const currentGain = Math.max(0.0001, g.value);
    g.cancelScheduledValues(now);
    g.setValueAtTime(currentGain, now);
    g.linearRampToValueAtTime(0.0001, now + Math.max(0.1, durationSec));

    const fadingSource = this.menuMusicSource;
    this.menuMusicFadeTimer = setTimeout(() => {
      this.menuMusicFadeTimer = null;
      if (!this.isInMenu || !this.settings.musicEnabled) {
        if (this.menuMusicSource === fadingSource) {
          this.stopMenuMusicImmediate();
        }
      }
    }, Math.ceil(durationSec * 1000) + 80);
  }

  private stopMenuMusicImmediate(): void {
    if (this.menuMusicFadeTimer) {
      clearTimeout(this.menuMusicFadeTimer);
      this.menuMusicFadeTimer = null;
    }
    if (this.menuMusicSource) {
      const oldSrc = this.menuMusicSource;
      this.menuMusicSource = null;
      oldSrc.onended = null;
      try {
        oldSrc.stop();
      } catch {}
      try {
        oldSrc.disconnect();
      } catch {}
    }
    if (this.menuMusicFadeGain) {
      try {
        this.menuMusicFadeGain.disconnect();
      } catch {}
      this.menuMusicFadeGain = null;
    }
  }

  public async unlock(): Promise<void> {
    if (typeof window === "undefined" || this.disposed) return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.value = -14;
      compressor.knee.value = 18;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.005;
      compressor.release.value = 0.18;

      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.crowdGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.sfxGain.connect(this.masterGain);
      this.crowdGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(compressor).connect(this.ctx.destination);
      this.applyGains();
    }

    if (this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
      } catch {
        // Ignore resume failure before gesture completes
      }
    }

    // iOS Safari unlock nudge (silent 1-sample buffer)
    if (!this.unlocked && this.ctx.state === "running") {
      try {
        const silent = this.ctx.createBuffer(1, 1, 22050);
        const src = this.ctx.createBufferSource();
        src.buffer = silent;
        src.connect(this.ctx.destination);
        src.start(0);
        this.unlocked = true;
      } catch {
        // Ignore
      }
    }

    // Start/ensure Main Menu Music if currently in the main menu and music is enabled
    if (this.isInMenu && this.settings.musicEnabled && !this.menuMusicSource && this.ctx.state === "running") {
      void this.tryStartMenuMusicPlayback();
    }

    await this.preloadAll();
    this.ensureAmbienceStarted();
  }

  public async preloadAll(): Promise<void> {
    if (!this.ctx) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      const entries = Object.entries(UPLOADED_AUDIO_PATHS) as [AssetKey, string][];
      await Promise.all(
        entries.map(async ([key, url]) => {
          if (this.buffers.has(key) || !this.ctx) return;
          try {
            const res = await fetch(url);
            if (!res.ok) return;
            const arr = await res.arrayBuffer();
            const decoded = await this.decodeAudio(this.ctx, arr);
            this.buffers.set(key, decoded);
          } catch {
            // Keep resilient if a network fetch aborts during unmount
          }
        })
      );
      this.ensureAmbienceStarted();
    })();

    return this.loadingPromise;
  }

  private decodeAudio(ctx: AudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
      try {
        const maybePromise = ctx.decodeAudioData(
          data,
          (buf) => resolve(buf),
          (err) => reject(err)
        );
        if (maybePromise && typeof (maybePromise as Promise<AudioBuffer>).then === "function") {
          (maybePromise as Promise<AudioBuffer>).then(resolve).catch(reject);
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  private applyGains(): void {
    if (!this.ctx || !this.masterGain || !this.sfxGain || !this.crowdGain || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const muteMult = this.settings.muted ? 0 : 1;
    const musicMult = this.settings.musicEnabled ? this.settings.music * 0.72 : 0;
    this.masterGain.gain.setTargetAtTime(muteMult, now, 0.02);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfx * 0.9, now, 0.02);
    this.crowdGain.gain.setTargetAtTime(this.settings.crowd * 0.75, now, 0.03);
    this.musicGain.gain.setTargetAtTime(musicMult, now, 0.03);
  }

  private canTrigger(tag: string, cooldownMs: number): boolean {
    const now = performance.now();
    const prev = this.lastPlayedMs.get(tag) ?? -Infinity;
    if (now - prev < cooldownMs) return false;
    this.lastPlayedMs.set(tag, now);
    return true;
  }

  private ensureAmbienceStarted(): void {
    if (!this.ctx || this.ctx.state !== "running") return;
    const crowdBuf = this.buffers.get("crowdGame");
    if (!crowdBuf) return;

    if (!this.ambienceSource && this.crowdGain) {
      const gain = this.ctx.createGain();
      gain.gain.value = this.isInMenu ? 0.08 : 0.28;
      const src = this.ctx.createBufferSource();
      src.buffer = crowdBuf;
      src.loop = true;
      src.loopStart = 1.9;
      src.loopEnd = Math.min(8.8, crowdBuf.duration - 0.1);
      src.connect(gain).connect(this.crowdGain);
      src.start(0, 2.0);
      this.ambienceGain = gain;
      this.ambienceSource = src;
    }
  }

  public updateCrowdAmbience(cheerIntensity: number): void {
    if (!this.ctx || this.ctx.state !== "running") return;
    this.ensureAmbienceStarted();
    const base = this.isInMenu ? 0.08 : 0.24;
    const target = base + Math.min(0.45, Math.max(0, cheerIntensity) * 0.18);
    if (this.ambienceGain) {
      this.ambienceGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.12);
    }
  }

  private playSlice(
    asset: AssetKey,
    slice: SliceDef,
    options: {
      bus: "sfx" | "crowd";
      vol?: number;
      pan?: number;
      voiceKind?: "squeak" | "crowd" | "sfx";
      fadeOutSec?: number;
    }
  ): void {
    if (!this.ctx || this.ctx.state !== "running") return;
    const buffer = this.buffers.get(asset);
    if (!buffer) return;

    const voiceKind = options.voiceKind ?? "sfx";
    if (voiceKind === "squeak" && this.activeSqueakCount >= 3) return;
    if (voiceKind === "crowd" && this.activeCrowdCount >= 2) return;
    if (this.activeSfxCount >= 14) return;

    const busNode = options.bus === "crowd" ? this.crowdGain : this.sfxGain;
    if (!busNode) return;

    const t = this.ctx.currentTime;
    const offset = Math.min(slice.offset, Math.max(0, buffer.duration - 0.05));
    const maxAvail = Math.max(0.04, buffer.duration - offset);
    const dur = Math.min(slice.duration, maxAvail);

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const rateMin = slice.rateMin ?? 1.0;
    const rateMax = slice.rateMax ?? 1.0;
    const rate = rateMin + Math.random() * (rateMax - rateMin);
    src.playbackRate.value = rate;

    const gain = this.ctx.createGain();
    const targetVol = Math.max(0.02, Math.min(1.35, (options.vol ?? 1) * (slice.baseGain ?? 1)));
    const fadeIn = 0.008;
    const fadeOut = Math.min(dur * 0.45, options.fadeOutSec ?? 0.045);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(targetVol, t + fadeIn);
    if (dur > fadeIn + fadeOut) {
      gain.gain.setValueAtTime(targetVol, t + dur - fadeOut);
    }
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    if (typeof this.ctx.createStereoPanner === "function") {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = clampPan(options.pan ?? 0);
      src.connect(gain).connect(panner).connect(busNode);
    } else {
      src.connect(gain).connect(busNode);
    }

    this.activeSfxCount++;
    if (voiceKind === "squeak") this.activeSqueakCount++;
    if (voiceKind === "crowd") this.activeCrowdCount++;

    src.onended = () => {
      this.activeSfxCount = Math.max(0, this.activeSfxCount - 1);
      if (voiceKind === "squeak") this.activeSqueakCount = Math.max(0, this.activeSqueakCount - 1);
      if (voiceKind === "crowd") this.activeCrowdCount = Math.max(0, this.activeCrowdCount - 1);
    };

    try {
      src.start(t, offset, dur + 0.02);
    } catch {
      this.activeSfxCount = Math.max(0, this.activeSfxCount - 1);
      if (voiceKind === "squeak") this.activeSqueakCount = Math.max(0, this.activeSqueakCount - 1);
      if (voiceKind === "crowd") this.activeCrowdCount = Math.max(0, this.activeCrowdCount - 1);
    }
  }

  // 1. Basketball sneaker squeaks (movement, running, stopping, pivoting)
  public squeak({ pan = 0, vol = 0.75, entityKey = "global" } = {}): void {
    if (!this.canTrigger(`squeak:${entityKey}`, 130)) return;
    if (!this.canTrigger("squeak:global", 65)) return;
    this.playSlice("sneakerSqueak", pickRandom(SQUEAK_SLICES), {
      bus: "sfx",
      pan,
      vol: vol * 0.75,
      voiceKind: "squeak",
      fadeOutSec: 0.04,
    });
  }

  // 2. Basketball dribbling (synced to floor bounce)
  public dribble({ pan = 0, vol = 0.85 } = {}): void {
    if (!this.canTrigger("dribble", 95)) return;
    this.playSlice("bounces", pickRandom(DRIBBLE_SLICES), {
      bus: "sfx",
      pan,
      vol,
      voiceKind: "sfx",
      fadeOutSec: 0.04,
    });
  }

  // 3. Basketball shooting (ball release)
  public shotRelease({ pan = 0, vol = 0.75 } = {}): void {
    if (!this.canTrigger("shotRelease", 140)) return;
    this.playSlice("bounces", pickRandom(SHOT_RELEASE_SLICES), {
      bus: "sfx",
      pan,
      vol,
      voiceKind: "sfx",
      fadeOutSec: 0.03,
    });
  }

  // 4. Basketball passing & catching
  public pass({ pan = 0, vol = 0.8 } = {}): void {
    if (!this.canTrigger("pass", 100)) return;
    this.playSlice("bounces", pickRandom(PASS_SLICES), {
      bus: "sfx",
      pan,
      vol,
      voiceKind: "sfx",
      fadeOutSec: 0.03,
    });
  }

  public catchBall({ pan = 0, vol = 0.72 } = {}): void {
    if (!this.canTrigger("catch", 100)) return;
    this.playSlice("bounces", pickRandom(CATCH_SLICES), {
      bus: "sfx",
      pan,
      vol,
      voiceKind: "sfx",
      fadeOutSec: 0.03,
    });
  }

  // Loose / missed ball bouncing on hardwood
  public floorBounce({ pan = 0, vol = 0.75 } = {}): void {
    if (!this.canTrigger("floorBounce", 90)) return;
    this.playSlice("bounces", pickRandom(FLOOR_BOUNCE_SLICES), {
      bus: "sfx",
      pan,
      vol,
      voiceKind: "sfx",
      fadeOutSec: 0.04,
    });
  }

  // 5. Basketball net (successful made shots)
  public netSwish({ pan = 0, vol = 0.95 } = {}): void {
    if (!this.canTrigger("netSwish", 180)) return;
    this.playSlice("netSwish", pickRandom(NET_SWISH_SLICES), {
      bus: "sfx",
      pan,
      vol,
      voiceKind: "sfx",
      fadeOutSec: 0.05,
    });
  }

  // 6. Basketball rim (missed shots & rim contact)
  public rimHit({ pan = 0, vol = 0.9 } = {}): void {
    if (!this.canTrigger("rimHit", 120)) return;
    this.playSlice("netSwish", pickRandom(RIM_HIT_SLICES), {
      bus: "sfx",
      pan,
      vol,
      voiceKind: "sfx",
      fadeOutSec: 0.05,
    });
  }

  // 7. Basketball backboard (backboard impacts)
  public backboardHit({ pan = 0, vol = 0.85 } = {}): void {
    if (!this.canTrigger("backboardHit", 130)) return;
    this.playSlice("netSwish", pickRandom(BACKBOARD_HIT_SLICES), {
      bus: "sfx",
      pan,
      vol,
      voiceKind: "sfx",
      fadeOutSec: 0.05,
    });
  }

  // 8. Dunk effects (dunk animations & heavy rim slam)
  public dunk({ pan = 0, vol = 1.0 } = {}): void {
    if (!this.canTrigger("dunk", 300)) return;
    this.playSlice("netSwish", DUNK_SLICES[0], {
      bus: "sfx",
      pan,
      vol,
      voiceKind: "sfx",
      fadeOutSec: 0.08,
    });
  }

  // 9. Crowd cheers (successful baskets & exciting plays)
  public crowdCheer({ pan = 0, vol = 0.9 } = {}): void {
    if (!this.canTrigger("crowdCheer", 650)) return;
    this.playSlice("crowdGame", pickRandom(CROWD_CHEER_SLICES), {
      bus: "crowd",
      pan,
      vol,
      voiceKind: "crowd",
      fadeOutSec: 0.35,
    });
  }

  // 10. Crowd reactions (blocks, steals, fouls, missed shots)
  public crowdReaction({ pan = 0, vol = 0.78 } = {}): void {
    if (!this.canTrigger("crowdReaction", 550)) return;
    this.playSlice("crowdGame", pickRandom(CROWD_REACTION_SLICES), {
      bus: "crowd",
      pan,
      vol,
      voiceKind: "crowd",
      fadeOutSec: 0.25,
    });
  }

  // 11. Buzzer (quarter endings, final game completion, shot clock violation)
  public buzzer(kind: "quarter" | "game" | "shotclock" = "quarter"): void {
    if (!this.canTrigger("buzzer", 750)) return;
    const duration = kind === "shotclock" ? 1.0 : kind === "quarter" ? 1.85 : 2.5;
    this.playSlice(
      "buzzer",
      { offset: 0.03, duration, baseGain: 0.92, rateMin: 0.99, rateMax: 1.01 },
      {
        bus: "sfx",
        pan: 0,
        vol: 0.95,
        voiceKind: "sfx",
        fadeOutSec: 0.22,
      }
    );
  }

  public speak(text: string): void {
    if (typeof window === "undefined" || !window.speechSynthesis || this.settings.muted) return;
    try {
      window.speechSynthesis.cancel();
      const ut = new SpeechSynthesisUtterance(text);
      ut.pitch = 1.08;
      ut.rate = 1.15;
      ut.volume = Math.min(1, Math.max(0.1, this.settings.sfx * 0.75));
      window.speechSynthesis.speak(ut);
    } catch {
      // Ignore speech synthesis restrictions
    }
  }

  public dispose(): void {
    this.disposed = true;
    this.stopMenuMusicImmediate();
    try {
      this.ambienceSource?.stop();
    } catch {}
    this.ambienceSource = null;
    if (this.ctx && this.ctx.state !== "closed") {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
  }
}
