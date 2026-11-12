"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserCheck, X, Check, RotateCcw, Sparkles, Sliders, Ruler } from "lucide-react";
import {
  AthleteProfile,
  PlayerPosition,
  PlaystyleArchetype,
  SKIN_TONES,
  ARCHETYPE_PRESETS,
  formatHeight,
  calculateOverallRating,
  getDefaultAthleteProfile,
  saveAthleteProfile,
} from "@/lib/athleteProfile";

interface CreateAthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AthleteProfile;
  onSaveProfile: (updated: AthleteProfile) => void;
  onEnterDraft?: () => void;
}

const POSITIONS: PlayerPosition[] = ["PG", "SG", "SF", "PF", "C"];
const JERSEY_PALETTE = [
  "#c8102e",
  "#006bb6",
  "#552583",
  "#059669",
  "#f97316",
  "#eab308",
  "#18181b",
  "#06b6d4",
];

export default function CreateAthleteModal({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onEnterDraft,
}: CreateAthleteModalProps) {
  const [draft, setDraft] = useState<AthleteProfile>(profile);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        setDraft(profile);
        setSavedToast(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, profile]);

  const ovr = calculateOverallRating(draft.attributes);
  const maxAttributeBudget = 340;
  const currentTotalPoints =
    draft.attributes.shooting +
    draft.attributes.finishing +
    draft.attributes.handles +
    draft.attributes.defense;
  const remainingPoints = maxAttributeBudget - currentTotalPoints;

  const handleArchetypeSelect = (arch: PlaystyleArchetype) => {
    setDraft((prev) => ({
      ...prev,
      archetype: arch,
      attributes: { ...ARCHETYPE_PRESETS[arch].attributes },
    }));
  };

  const handleAttrChange = (key: keyof AthleteProfile["attributes"], val: number) => {
    const clamped = Math.max(60, Math.min(99, val));
    const otherTotal = currentTotalPoints - draft.attributes[key];
    if (otherTotal + clamped > maxAttributeBudget) {
      const capped = Math.max(60, maxAttributeBudget - otherTotal);
      setDraft((prev) => ({
        ...prev,
        attributes: { ...prev.attributes, [key]: capped },
      }));
      return;
    }
    setDraft((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: clamped },
    }));
  };

  const handleSave = () => {
    const normalized: AthleteProfile = {
      ...draft,
      firstName: draft.firstName.trim().toUpperCase() || "ROOKIE",
      lastName: draft.lastName.trim().toUpperCase() || "PROSPECT",
      jerseyNumber: draft.jerseyNumber.trim() || "23",
    };
    saveAthleteProfile(normalized);
    onSaveProfile(normalized);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1800);
  };

  const handleReset = () => {
    const def = getDefaultAthleteProfile();
    setDraft(def);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/92 backdrop-blur-2xl z-[210] flex items-start sm:items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 18 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 18 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl bg-neutral-950 border border-white/15 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[92dvh] my-auto"
          >
          {/* Header */}
          <div className="px-6 py-4 bg-neutral-900 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500 text-black flex items-center justify-center shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                  Create Athlete Studio
                </h2>
                <p className="text-xs text-white/60">
                  Customize identity, physical build, uniform colorway, and MyPLAYER skill ratings
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close Athlete Creator"
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Split */}
          <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Live Prospect Card Preview */}
            <div className="lg:col-span-4 flex flex-col justify-between bg-neutral-900/70 border border-white/10 rounded-xl p-5 space-y-5">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/50">
                    Prospect Card
                  </span>
                  <span className="text-xs font-bold text-amber-400 tabular-nums">
                    {ovr} OVR · {draft.position}
                  </span>
                </div>

                {/* Visual Jersey & Silhouette Preview */}
                <div className="my-5 flex flex-col items-center justify-center py-6 bg-black/50 rounded-xl border border-white/10 relative">
                  {/* Head */}
                  <div
                    className="w-14 h-14 rounded-full border-2 border-white/20 relative flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: draft.skinToneHex }}
                  >
                    {draft.headbandEnabled && (
                      <div
                        className="absolute top-2 left-0 right-0 h-3 border-y border-black/30"
                        style={{ backgroundColor: draft.headbandColorHex }}
                      />
                    )}
                  </div>
                  {/* Jersey Torso */}
                  <div
                    className="w-28 h-28 rounded-t-2xl mt-2 border border-white/20 flex flex-col items-center justify-center shadow-xl"
                    style={{ backgroundColor: draft.jerseyColorHex }}
                  >
                    <span className="text-[10px] font-black tracking-widest text-white/80 uppercase truncate max-w-[90px]">
                      {draft.lastName || "PLAYER"}
                    </span>
                    <span className="text-4xl font-black text-white tabular-nums leading-none mt-1">
                      #{draft.jerseyNumber || "23"}
                    </span>
                  </div>
                  {/* Shorts */}
                  <div
                    className="w-28 h-10 rounded-b-lg border-x border-b border-white/20"
                    style={{ backgroundColor: draft.shortsColorHex }}
                  />
                  {/* Sneakers */}
                  <div className="flex gap-4 mt-2">
                    <div
                      className="w-8 h-3 rounded-sm border border-white/20"
                      style={{ backgroundColor: draft.shoeColorHex }}
                    />
                    <div
                      className="w-8 h-3 rounded-sm border border-white/20"
                      style={{ backgroundColor: draft.shoeColorHex }}
                    />
                  </div>
                </div>

                <div className="space-y-1 text-center">
                  <div className="text-xl font-black uppercase tracking-tight">
                    {draft.firstName || "ROOKIE"} {draft.lastName || "PROSPECT"}
                  </div>
                  <div className="text-xs text-white/60">
                    {draft.archetype} · {formatHeight(draft.heightInches)} · #{draft.jerseyNumber}
                  </div>
                  {draft.draftRecord?.drafted && (
                    <div className="pt-2 text-xs font-bold text-emerald-400">
                      Drafted #{draft.draftRecord.pickNumber} Overall · {draft.draftRecord.teamName}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-white/10">
                <button
                  onClick={handleSave}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {savedToast ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  <span>{savedToast ? "Athlete Saved to Court" : "Save Athlete"}</span>
                </button>
                {onEnterDraft && (
                  <button
                    onClick={() => {
                      handleSave();
                      onClose();
                      onEnterDraft();
                    }}
                    className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold uppercase text-xs tracking-wider rounded-xl transition-colors cursor-pointer"
                  >
                    Save & Enter Draft Night
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Configuration Controls */}
            <div className="lg:col-span-8 space-y-6">
              {/* Section 1: Identity & Position */}
              <div className="space-y-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-white/80">
                  01. Player Identity & Position
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-white/50 mb-1">First Name</label>
                    <input
                      type="text"
                      maxLength={14}
                      value={draft.firstName}
                      onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
                      className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm font-bold text-white uppercase focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Last Name</label>
                    <input
                      type="text"
                      maxLength={14}
                      value={draft.lastName}
                      onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
                      className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm font-bold text-white uppercase focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Jersey #</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={draft.jerseyNumber}
                      onChange={(e) =>
                        setDraft({ ...draft, jerseyNumber: e.target.value.replace(/[^0-9]/g, "") })
                      }
                      className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm font-bold text-white tabular-nums focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Position Selector */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-white/50 mr-2">Position:</span>
                  {POSITIONS.map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setDraft({ ...draft, position: pos })}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                        draft.position === pos
                          ? "bg-amber-500 text-black"
                          : "bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Physical Build & Appearance */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white/80 flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-amber-400" />
                    <span>02. Physical Build & Appearance</span>
                  </h3>
                  <span className="text-xs font-bold text-amber-400 tabular-nums">
                    Height: {formatHeight(draft.heightInches)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">
                      Height ({formatHeight(draft.heightInches)})
                    </label>
                    <input
                      type="range"
                      min={70}
                      max={85}
                      value={draft.heightInches}
                      onChange={(e) =>
                        setDraft({ ...draft, heightInches: Number(e.target.value) })
                      }
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-white/40 mt-1 tabular-nums">
                      <span>5&apos;10&quot; Guard</span>
                      <span>6&apos;6&quot; Wing</span>
                      <span>7&apos;1&quot; Center</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">Skin Tone</label>
                    <div className="flex items-center gap-2">
                      {SKIN_TONES.map((tone) => (
                        <button
                          key={tone.id}
                          onClick={() => setDraft({ ...draft, skinToneHex: tone.hex })}
                          title={tone.label}
                          aria-label={tone.label}
                          className={`w-8 h-8 rounded-lg border-2 transition-transform cursor-pointer ${
                            draft.skinToneHex === tone.hex
                              ? "border-amber-400 scale-110"
                              : "border-white/20 hover:scale-105"
                          }`}
                          style={{ backgroundColor: tone.hex }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Kit Colors & Headband */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">Home Jersey Color</label>
                    <div className="flex flex-wrap gap-2">
                      {JERSEY_PALETTE.map((hex) => (
                        <button
                          key={hex}
                          onClick={() => setDraft({ ...draft, jerseyColorHex: hex })}
                          className={`w-7 h-7 rounded-md border-2 cursor-pointer ${
                            draft.jerseyColorHex === hex ? "border-white scale-110" : "border-white/20"
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                    <div>
                      <div className="text-xs font-bold text-white">Signature Headband</div>
                      <div className="text-[11px] text-white/50">Show headband on 3D court</div>
                    </div>
                    <button
                      onClick={() =>
                        setDraft({ ...draft, headbandEnabled: !draft.headbandEnabled })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase cursor-pointer ${
                        draft.headbandEnabled
                          ? "bg-amber-500 text-black"
                          : "bg-white/10 text-white/60"
                      }`}
                    >
                      {draft.headbandEnabled ? "On" : "Off"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 3: Archetype & Attributes */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white/80 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span>03. Archetype & Skill Ratings</span>
                  </h3>
                  <span className="text-xs font-bold text-white/60 tabular-nums">
                    Points Remaining: {remainingPoints}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(ARCHETYPE_PRESETS) as PlaystyleArchetype[]).map((arch) => (
                    <button
                      key={arch}
                      onClick={() => handleArchetypeSelect(arch)}
                      className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        draft.archetype === arch
                          ? "bg-amber-500/15 border-amber-400 text-white"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      <div className="text-xs font-black">{arch}</div>
                      <div className="text-[11px] text-white/50 mt-0.5 line-clamp-2">
                        {ARCHETYPE_PRESETS[arch].description}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Attribute Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {(
                    [
                      { key: "shooting", label: "Jump Shot & 3PT Range" },
                      { key: "finishing", label: "Dunks & Rim Finishing" },
                      { key: "handles", label: "Ball Handling & Speed" },
                      { key: "defense", label: "Perimeter Defense & Steals" },
                    ] as const
                  ).map(({ key, label }) => (
                    <div key={key} className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-white/80">{label}</span>
                        <span className="text-amber-400 tabular-nums">
                          {draft.attributes[key]}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={60}
                        max={99}
                        value={draft.attributes[key]}
                        onChange={(e) => handleAttrChange(key, Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-neutral-900 border-t border-white/10 flex items-center justify-between shrink-0">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white/70 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSave();
                  onClose();
                }}
                className="px-5 py-2 bg-white text-black hover:bg-neutral-200 font-black uppercase text-xs tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Apply & Return
              </button>
            </div>
          </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
