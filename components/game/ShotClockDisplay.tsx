"use client";

interface ShotClockDisplayProps {
  shotClock: number;
  resetPulseKey?: number;
  lastResetReason?: string;
  isPaused?: boolean;
}

// Shot clock is now integrated cleanly into the top Scoreboard strip and 3D backboard stanchions
// to keep the live gameplay screen completely free of peripheral flashing distractions.
export default function ShotClockDisplay(_props: ShotClockDisplayProps) {
  return null;
}
