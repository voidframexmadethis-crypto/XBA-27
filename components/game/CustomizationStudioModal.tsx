"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Palette, X, Check, RotateCcw, Sparkles, Shield, Crown, Flame, Zap, Mountain, Anchor, Star } from "lucide-react";
import {
  BALL_DESIGNS,
  getDefaultCustomization,
  LIGHTING_MOOD_PRESETS,
  StudioCustomization,
  TEAM_EMBLEMS,
  TeamEmblemId,
  WOOD_TONE_PRESETS,
} from "@/lib/customization";

interface CustomizationStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  customization: StudioCustomization;
  onApplyCustomization: (next: StudioCustomization) => void;
}

const COLOR_SWATCHES = [
  "#c8102e", "#1d4ed8", "#047857", "#6d28d9", "#f97316", "#eab308", "#18181b", "#06b6d4", "#f8fafc", "#be123c",
];

function EmblemIcon({ id, className = "w-5 h-5" }: { id: TeamEmblemId; className?: string }) {
  switch (id) {
    case "crown": return <Crown className={className} />;
    case "shield": return <Shield className={className} />;
    case "flame": return <Flame className={className} />;
    case "bolt": return <Zap className={className} />;
    case "mountain": return <Mountain className={className} />;
    case "trident": return <Anchor className={className} />;
    case "phoenix": return <Sparkles className={className} />;
    default: return <Star className={className} />;
  }
}

export default function CustomizationStudioModal({
  isOpen,
  onClose,
  customization,
  onApplyCustomization,
}: CustomizationStudioModalProps) {
  const [draft, setDraft] = useState<StudioCustomization>(customization);
  const [appliedBanner, setAppliedBanner] = useState(false);

  const handleApply = (andClose = false) => {
    const normalized: StudioCustomization = {
      ...draft,
      teamName: draft.teamName.trim().toUpperCase() || "EMPIRE MONARCHS",
      teamAbbr: (draft.teamAbbr.trim().toUpperCase() || "NYM").slice(0, 3),
      centerCourtBanner: draft.centerCourtBanner.trim().toUpperCase() || "APEX PRO",
    };
    onApplyCustomization(normalized);
    setAppliedBanner(true);
    setTimeout(() => setAppliedBanner(false), 1600);
    if (andClose) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-[200] flex items-start sm:items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 14 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 14 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl bg-[#080a0f] border border-white/15 rounded-2xl shadow-2xl text-white flex flex-col max-h-[92dvh] my-auto overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#1a1026] via-[#0e121a] to-[#080a0f] border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#ff963b] text-black flex items-center justify-center">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Customization Studio</h2>
                  <p className="text-xs text-white/60">
                    Jerseys, team logos, basketball skins, shoes, hardwood floor, and arena lighting applied live in 3D
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close Customization Studio"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Live 3D Visual Preview Card */}
              <div className="lg:col-span-4 rounded-xl bg-white/[0.03] border border-white/10 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="text-xs font-black uppercase text-white/50">Live Uniform & Court Preview</div>
                  <div
                    className="rounded-xl p-5 border border-white/15 flex flex-col items-center gap-3"
                    style={{ backgroundColor: draft.apronColor }}
                  >
                    <div
                      className="w-24 h-24 rounded-2xl border-2 flex flex-col items-center justify-center shadow-lg"
                      style={{ backgroundColor: draft.primaryColor, borderColor: draft.trimColor }}
                    >
                      <EmblemIcon id={draft.emblemId} className="w-7 h-7 text-white" />
                      <span className="text-xs font-black tracking-widest mt-1" style={{ color: draft.secondaryColor }}>
                        {draft.teamAbbr || "APX"}
                      </span>
                    </div>
                    <div className="w-full h-14 rounded-lg border border-white/20 flex items-center justify-center text-xs font-black tracking-widest uppercase text-black/80"
                      style={{ backgroundColor: WOOD_TONE_PRESETS.find((w) => w.id === draft.woodTone)?.lightHex }}
                    >
                      <span className="px-2 py-0.5 rounded text-white" style={{ backgroundColor: draft.keyPaintColor }}>
                        {draft.centerCourtBanner || "APEX PRO"}
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-black uppercase">{draft.teamName}</div>
                    <div className="text-xs text-white/55">
                      Ball: {BALL_DESIGNS.find((b) => b.id === draft.ballDesign)?.name}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleApply(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#ff963b] hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  {appliedBanner ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  <span>{appliedBanner ? "Applied to 3D Court!" : "Apply Live to 3D Court"}</span>
                </button>
              </div>

              {/* Studio Controls */}
              <div className="lg:col-span-8 space-y-5">
                {/* Identity & Team Emblem */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-white/55 mb-1">Custom Franchise Name</label>
                    <input
                      type="text"
                      maxLength={22}
                      value={draft.teamName}
                      onChange={(e) => setDraft({ ...draft, teamName: e.target.value })}
                      className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-xs font-bold uppercase text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/55 mb-1">Abbreviation</label>
                    <input
                      type="text"
                      maxLength={3}
                      value={draft.teamAbbr}
                      onChange={(e) => setDraft({ ...draft, teamAbbr: e.target.value.toUpperCase() })}
                      className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-xs font-bold uppercase text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-white/60 mb-2">Team Logo Crest</label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {TEAM_EMBLEMS.map((em) => (
                      <button
                        key={em.id}
                        onClick={() => setDraft({ ...draft, emblemId: em.id })}
                        title={em.label}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          draft.emblemId === em.id
                            ? "bg-[#ff963b]/20 border-[#ff963b] text-[#ff963b]"
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                        }`}
                      >
                        <EmblemIcon id={em.id} className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(
                    [
                      { key: "primaryColor", label: "Jersey Primary" },
                      { key: "secondaryColor", label: "Accent / Numbers" },
                      { key: "keyPaintColor", label: "Key & Apron Paint" },
                    ] as const
                  ).map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs text-white/55 mb-1.5">{label}</label>
                      <div className="flex flex-wrap gap-1.5">
                        {COLOR_SWATCHES.map((hex) => (
                          <button
                            key={`${key}-${hex}`}
                            onClick={() => setDraft({ ...draft, [key]: hex })}
                            className={`w-6 h-6 rounded-md border-2 cursor-pointer ${
                              draft[key] === hex ? "border-white scale-110" : "border-white/20"
                            }`}
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Basketball Design */}
                <div>
                  <label className="block text-xs font-black uppercase text-white/60 mb-2">Basketball Design</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {BALL_DESIGNS.map((ball) => (
                      <button
                        key={ball.id}
                        onClick={() => setDraft({ ...draft, ballDesign: ball.id })}
                        className={`p-3 rounded-xl border text-left cursor-pointer ${
                          draft.ballDesign === ball.id
                            ? "bg-[#ff963b]/15 border-[#ff963b]"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border border-white/30 shrink-0"
                            style={{ backgroundColor: ball.baseHex }}
                          />
                          <span className="text-xs font-black">{ball.name}</span>
                        </div>
                        <div className="text-[11px] text-white/55 mt-1">{ball.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hardwood & Arena Lighting */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-white/60 mb-2">Hardwood Surface</label>
                    <div className="grid grid-cols-2 gap-2">
                      {WOOD_TONE_PRESETS.map((wood) => (
                        <button
                          key={wood.id}
                          onClick={() => setDraft({ ...draft, woodTone: wood.id })}
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2 cursor-pointer ${
                            draft.woodTone === wood.id
                              ? "bg-[#ff963b]/15 border-[#ff963b]"
                              : "bg-white/5 border-white/10"
                          }`}
                        >
                          <span className="w-4 h-4 rounded shrink-0" style={{ backgroundColor: wood.lightHex }} />
                          <span className="truncate">{wood.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-white/60 mb-2">Arena Lighting Mood</label>
                    <div className="grid grid-cols-2 gap-2">
                      {LIGHTING_MOOD_PRESETS.map((lt) => (
                        <button
                          key={lt.id}
                          onClick={() => setDraft({ ...draft, lightingMood: lt.id })}
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold cursor-pointer ${
                            draft.lightingMood === lt.id
                              ? "bg-[#ff963b]/15 border-[#ff963b]"
                              : "bg-white/5 border-white/10"
                          }`}
                        >
                          <div className="truncate">{lt.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-black/60 border-t border-white/10 flex items-center justify-between shrink-0">
              <button
                onClick={() => setDraft(getDefaultCustomization())}
                className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white/65 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Studio</span>
              </button>
              <button
                onClick={() => handleApply(true)}
                className="px-5 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 font-black uppercase text-xs tracking-wider cursor-pointer"
              >
                Save &amp; Apply to Court
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
