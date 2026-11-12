"use client";

import { motion } from "motion/react";
import { Sparkles, Zap } from "lucide-react";
import { WorldCity } from "@/lib/worldTour";

interface TipOffModalProps {
  isOpen: boolean;
  onTipOff: (userWon: boolean) => void;
  selectedCity: WorldCity;
}

export default function TipOffModal({ isOpen, onTipOff, selectedCity }: TipOffModalProps) {
  if (!isOpen) return null;

  const handleAction = (userWon: boolean) => {
    onTipOff(userWon);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[200] flex items-center justify-center p-3 sm:p-8 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 30 }}
        className="relative w-full max-w-2xl max-h-[92dvh] overflow-y-auto bg-gradient-to-br from-neutral-950 via-neutral-900 to-black border-2 border-amber-500/50 rounded-3xl p-5 sm:p-10 shadow-[0_0_80px_rgba(245,158,11,0.3)] text-center text-white space-y-5 sm:space-y-6"
      >
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>OFFICIAL TIP-OFF CEREMONY</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tight text-2k-gold">
            CENTER COURT TIP-OFF
          </h2>
          <p className="text-sm text-white/70 font-semibold max-w-md mx-auto">
            {selectedCity.arenaName} • {selectedCity.name}, {selectedCity.country} {selectedCity.flag}
          </p>
        </div>

        {/* Matchup visual card */}
        <div className="grid grid-cols-3 gap-4 items-center bg-black/50 border border-white/10 rounded-2xl p-5 relative z-10">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 mx-auto rounded-xl bg-red-600/30 border border-red-500 flex items-center justify-center font-black text-xl text-red-400">
              HOME
            </div>
            <div className="font-black text-sm uppercase">Your Squad</div>
            <div className="text-[10px] text-white/50">Possession Playmaker</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-black italic text-amber-400 animate-pulse">VS</div>
            <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">Jump Ball</div>
          </div>

          <div className="text-center space-y-1">
            <div className="w-12 h-12 mx-auto rounded-xl bg-blue-600/30 border border-blue-500 flex items-center justify-center font-black text-xl text-blue-400">
              AWAY
            </div>
            <div className="font-black text-sm uppercase">{selectedCity.teamName}</div>
            <div className="text-[10px] text-white/50">Rival Challengers</div>
          </div>
        </div>

        {/* Referee / Instructions */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs font-semibold text-amber-200/90 relative z-10 leading-relaxed">
          The referee tosses the basketball high into the air at center court. Tap the button below to time your jump, swipe the ball from the referee&apos;s hand, and secure first possession for your team!
        </div>

        {/* Tip-Off Action Button */}
        <div className="pt-2 relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAction(true)}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-black font-black italic uppercase tracking-wider text-lg rounded-2xl border-2 border-yellow-100 shadow-[0_0_40px_rgba(245,158,11,0.6)] flex items-center justify-center gap-3 cursor-pointer"
          >
            <span className="text-2xl">🏀</span>
            <span>SWIPE TIP-OFF & WIN POSSESSION</span>
            <Zap className="w-5 h-5 fill-black" />
          </motion.button>
        </div>

        {/* Quick auto-win or simulated challenge */}
        <div className="text-[11px] text-white/40 font-semibold relative z-10">
          Press <span className="text-amber-400 font-bold">[SPACEBAR]</span> or click above to contest tip-off.
        </div>
      </motion.div>
    </div>
  );
}
