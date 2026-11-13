"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Search,
  Trophy,
  Globe,
  Sparkles,
  Flame,
  Shield,
  Award,
  Play,
  Info,
  Zap,
  Tv,
  Check,
  Wifi,
  ChevronRight,
} from "lucide-react";
import {
  Category,
  Feature,
  NBA_2K27_FEATURES,
  CATEGORY_LABELS,
} from "@/lib/nbaFeatures";

interface NBAFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFeatureMode?: (featureId: string) => void;
}

export default function NBAFeaturesModal({
  isOpen,
  onClose,
  onSelectFeatureMode,
}: NBAFeaturesModalProps) {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const featureList = useMemo(() => Object.values(NBA_2K27_FEATURES), []);

  const filteredFeatures = useMemo(() => {
    return featureList.filter((feat) => {
      const matchesCategory =
        activeCategory === "ALL" || feat.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        feat.name.toLowerCase().includes(q) ||
        feat.description.toLowerCase().includes(q) ||
        feat.subFeatures.some((s) => s.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [featureList, activeCategory, searchQuery]);

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case "Trophy":
        return <Trophy className="w-5 h-5 text-amber-400" />;
      case "Globe":
        return <Globe className="w-5 h-5 text-cyan-400" />;
      case "Sparkles":
        return <Sparkles className="w-5 h-5 text-yellow-400" />;
      case "Flame":
        return <Flame className="w-5 h-5 text-orange-400" />;
      case "Shield":
        return <Shield className="w-5 h-5 text-blue-400" />;
      case "Award":
        return <Award className="w-5 h-5 text-purple-400" />;
      case "Play":
        return <Play className="w-5 h-5 text-emerald-400" />;
      case "Info":
        return <Info className="w-5 h-5 text-indigo-400" />;
      case "Zap":
        return <Zap className="w-5 h-5 text-yellow-300" />;
      case "Tv":
        return <Tv className="w-5 h-5 text-red-400" />;
      default:
        return <Check className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[190] flex items-start sm:items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl bg-neutral-950 border-2 border-amber-500/40 rounded-3xl shadow-[0_0_90px_rgba(245,158,11,0.25)] overflow-hidden text-white flex flex-col max-h-[92dvh] my-auto"
          >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-amber-950/80 via-neutral-900 to-cyan-950/80 border-b border-amber-500/30 flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center text-black font-black text-2xl shadow-lg shadow-amber-500/30 border border-yellow-200">
                2K
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight text-2k-gold">
                    NBA 2K Official Modes & Features
                  </h2>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-amber-400 text-black shadow font-sans">
                    2K27 DIRECTORY
                  </span>
                </div>
                <p className="text-xs text-white/60 font-semibold">
                  Browse game modes, ProPLAY engine details, MyCAREER, MyTEAM, Seasons, and Presentation options.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close Modes and Features Directory"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="px-6 py-3 bg-black/60 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Search Input */}
            <div className="relative min-w-[220px] max-w-xs flex-1">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search modes, mechanics, or features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
              <button
                onClick={() => setActiveCategory("ALL")}
                className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeCategory === "ALL"
                    ? "bg-amber-400 text-black shadow-md shadow-amber-400/20"
                    : "bg-white/5 hover:bg-white/10 text-white/70"
                }`}
              >
                All Modes
              </button>
              {Object.values(Category).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap uppercase transition-all ${
                    activeCategory === cat
                      ? "bg-amber-400 text-black shadow-md shadow-amber-400/20"
                      : "bg-white/5 hover:bg-white/10 text-white/70"
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Feature Grid */}
          <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh]">
            {filteredFeatures.length === 0 ? (
              <div className="md:col-span-2 py-12 text-center text-sm text-white/60 space-y-2">
                <div>No modes or features matched &ldquo;{searchQuery}&rdquo;.</div>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("ALL");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 text-black text-xs font-black uppercase cursor-pointer"
                >
                  Show All Features
                </button>
              </div>
            ) : filteredFeatures.map((feat) => (
              <div
                key={feat.id}
                className="bg-white/5 border border-white/10 hover:border-amber-500/40 rounded-2xl p-5 transition-all duration-200 hover:bg-white/10 flex flex-col justify-between group shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-md">
                        {renderIcon(feat.iconName)}
                      </div>
                      <div>
                        <div className="font-black text-lg text-white group-hover:text-amber-300 transition-colors flex items-center gap-2">
                          <span>{feat.name}</span>
                          {feat.onlineRequired && (
                            <span
                              className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1"
                              title="Requires online account or connection"
                            >
                              <Wifi className="w-2.5 h-2.5" /> online
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-amber-400/90 uppercase tracking-widest">
                          {CATEGORY_LABELS[feat.category]}
                        </span>
                      </div>
                    </div>

                    {feat.badgeText && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-black shadow shrink-0">
                        {feat.badgeText}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-white/70 mb-4 leading-relaxed font-medium">
                    {feat.description}
                  </p>

                  {/* Sub Features Bullet Checklist */}
                  {feat.subFeatures.length > 0 && (
                    <div className="bg-black/40 rounded-xl p-3 border border-white/5 space-y-1.5 mb-4">
                      <div className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-1">
                        Key Features & Sub-Modes:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {feat.subFeatures.map((sub, i) => (
                          <div
                            key={i}
                            className="text-xs text-white/80 font-bold flex items-center gap-1.5"
                          >
                            <span className="text-amber-400 text-sm leading-none">•</span>
                            <span className="truncate">{sub}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Launch / Explore Action Button */}
                <button
                  onClick={() => {
                    onSelectFeatureMode?.(feat.id);
                    onClose();
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black uppercase italic text-xs tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <span>Enter {feat.name}</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            ))}
          </div>

          {/* Footer Info */}
          <div className="px-6 py-3.5 bg-black/60 border-t border-white/10 flex items-center justify-between text-xs text-white/50 shrink-0 font-medium">
            <span>
              Showing {filteredFeatures.length} of {featureList.length} Official 2K Features
            </span>
            <button
              onClick={onClose}
              className="text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider text-xs underline"
            >
              Close Directory
            </button>
          </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
