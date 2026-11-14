"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Briefcase,
  X,
  DollarSign,
  Building2,
  TrendingUp,
  ShieldCheck,
  Check,
  Zap,
  Award,
  Home,
  Car,
} from "lucide-react";
import {
  BusinessState,
  calculateGameDayRevenue,
  purchaseVenture,
  saveBusinessState,
  upgradeArenaFacility,
} from "@/lib/basketballBusiness";

interface BusinessHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: BusinessState;
  onUpdateBusiness: (next: BusinessState) => void;
}

export default function BusinessHubModal({
  isOpen,
  onClose,
  business,
  onUpdateBusiness,
}: BusinessHubModalProps) {
  const [tab, setTab] = useState<"arena" | "ventures" | "finances">("arena");
  const [notice, setNotice] = useState<string>("");

  const rev = calculateGameDayRevenue(business);

  const handleUpgrade = (upgradeId: string) => {
    const updated = upgradeArenaFacility(business, upgradeId);
    if (updated === business) {
      setNotice("Insufficient liquid cash to purchase arena upgrade.");
    } else {
      saveBusinessState(updated);
      onUpdateBusiness(updated);
      setNotice("Arena facility upgrade successfully installed!");
    }
  };

  const handleBuyVenture = (ventureId: string) => {
    const updated = purchaseVenture(business, ventureId);
    if (updated === business) {
      setNotice("Insufficient liquid cash for this venture.");
    } else {
      saveBusinessState(updated);
      onUpdateBusiness(updated);
      setNotice("Successfully acquired new business venture / property!");
    }
  };

  const handleUpdateTicketPrice = (val: number) => {
    const next = { ...business, ticketPrice: val };
    saveBusinessState(next);
    onUpdateBusiness(next);
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
            <div className="px-6 py-4 bg-gradient-to-r from-[#18120c] via-[#0e121a] to-[#080a0f] border-b border-white/10 flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">
                    Court &amp; Player Business Hub · {business.arenaName}
                  </h2>
                  <p className="text-xs text-white/60 tabular-nums">
                    Liquid Cash: <strong className="text-emerald-400">${business.liquidCashM.toFixed(2)}M</strong> · Net
                    Worth: <strong className="text-amber-400">${business.netWorthM.toFixed(2)}M</strong> · Game Revenue:{" "}
                    <strong className="text-sky-300">${rev.totalGameRevenueM}M / game</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="Close Business Hub"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 bg-black/40 border-b border-white/10 flex gap-1 overflow-x-auto shrink-0">
              {(
                [
                  { id: "arena", label: "Arena & Court Management", icon: Building2 },
                  { id: "ventures", label: "Player Financial Empire", icon: Briefcase },
                  { id: "finances", label: "Revenue & Financial Ledger", icon: DollarSign },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    tab === id ? "border-[#ff963b] text-white" : "border-transparent text-white/45 hover:text-white/80"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-[#ff963b]" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {notice && (
                <div className="px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 flex items-center justify-between">
                  <span>{notice}</span>
                  <button onClick={() => setNotice("")} className="text-xs underline font-bold cursor-pointer">
                    Dismiss
                  </button>
                </div>
              )}

              {tab === "arena" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="text-xs font-black uppercase text-white/50">Naming Rights Partner</div>
                      <div className="text-base font-black text-amber-400">{business.namingRightsSponsor}</div>
                      <div className="text-xs text-emerald-400 font-bold tabular-nums">
                        +${business.namingRightsValuePerGameM}M per home game
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="text-xs font-black uppercase text-white/50">Stadium Capacity</div>
                      <div className="text-base font-black tabular-nums">{business.stadiumCapacity.toLocaleString()} Seats</div>
                      <div className="text-xs text-white/65">Sellout crowd guaranteed with high team win rate.</div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="text-xs font-black uppercase text-white/50">Ticket Price Setting</div>
                      <div className="flex items-center justify-between text-sm font-bold">
                        <span>Average Ticket</span>
                        <span className="text-[#ff963b] tabular-nums">${business.ticketPrice}</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="220"
                        step="5"
                        value={business.ticketPrice}
                        onChange={(e) => handleUpdateTicketPrice(Number(e.target.value))}
                        className="w-full accent-[#ff963b] cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-black uppercase text-[#ff963b]">Arena &amp; Facility Upgrades</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {business.upgrades.map((upg) => {
                        const isMax = upg.level >= upg.maxLevel;
                        const cost = Number((upg.costM * Math.pow(upg.costMultiplier, upg.level - 1)).toFixed(2));
                        return (
                          <div key={upg.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-sm font-black">{upg.name}</div>
                                <div className="text-xs text-white/60 mt-0.5">{upg.benefitDescription}</div>
                              </div>
                              <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 tabular-nums">
                                Lv. {upg.level} / {upg.maxLevel}
                              </span>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-white/10">
                              <span className="text-xs text-white/70 tabular-nums">
                                {isMax ? "Fully Upgraded" : `Cost: $${cost}M`}
                              </span>
                              <button
                                disabled={isMax}
                                onClick={() => handleUpgrade(upg.id)}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase cursor-pointer ${
                                  isMax
                                    ? "bg-white/5 text-white/30 cursor-not-allowed"
                                    : "bg-[#ff963b] hover:bg-amber-400 text-black"
                                }`}
                              >
                                {isMax ? "Max Level" : "Upgrade Facility"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {tab === "ventures" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black uppercase">Player Lifestyle &amp; Business Empire</div>
                      <div className="text-xs text-white/60">
                        Acquire luxury real estate, hypercars, and business ventures to generate passive income.
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/50 uppercase">Liquid Capital</div>
                      <div className="text-lg font-black text-emerald-400 tabular-nums">
                        ${business.liquidCashM.toFixed(2)}M
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {business.ventures.map((v) => {
                      const costM = v.costK / 1000;
                      return (
                        <div
                          key={v.id}
                          className={`p-4 rounded-xl border flex flex-col justify-between gap-4 ${
                            v.owned ? "bg-emerald-500/10 border-emerald-500/40" : "bg-white/5 border-white/10"
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-black uppercase">{v.name}</span>
                              <span className="text-xs font-bold text-amber-400 tabular-nums">
                                ${costM >= 1 ? `${costM}M` : `${v.costK}K`}
                              </span>
                            </div>
                            <p className="text-xs text-white/65 leading-relaxed">{v.description}</p>
                            <div className="text-xs text-emerald-300 font-bold tabular-nums">
                              Yield: +${v.dailyIncomeK}K / day
                            </div>
                          </div>

                          {v.owned ? (
                            <div className="py-2 px-3 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase flex items-center justify-center gap-1.5">
                              <Check className="w-4 h-4" /> Owned &amp; Generating Revenue
                            </div>
                          ) : (
                            <button
                              onClick={() => handleBuyVenture(v.id)}
                              className="w-full py-2.5 rounded-lg bg-[#ff963b] hover:bg-amber-400 text-black text-xs font-black uppercase cursor-pointer"
                            >
                              Acquire Property
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {tab === "finances" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 tabular-nums">
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                    <h3 className="text-sm font-black uppercase text-[#ff963b]">Home Game Revenue Breakdown</h3>
                    <div className="flex justify-between text-xs">
                      <span>Gate Revenue (Tickets)</span>
                      <span className="font-bold">${rev.gateRevenueM.toFixed(2)}M</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>VIP Luxury Boxes</span>
                      <span className="font-bold">${rev.luxuryRevenueM.toFixed(2)}M</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Concessions &amp; Upgrades</span>
                      <span className="font-bold">${rev.concessionRevenueM.toFixed(2)}M</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Arena Naming Rights</span>
                      <span className="font-bold">${rev.namingRevenueM.toFixed(2)}M</span>
                    </div>
                    <div className="flex justify-between text-xs pt-3 border-t border-white/10 font-black text-emerald-400">
                      <span>Total Game Revenue</span>
                      <span>${rev.totalGameRevenueM}M</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                    <h3 className="text-sm font-black uppercase text-cyan-300">Financial Net Worth &amp; Reserves</h3>
                    <div className="flex justify-between text-xs">
                      <span>Liquid Cash Reserves</span>
                      <span className="font-bold text-emerald-400">${business.liquidCashM.toFixed(2)}M</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Total Estimated Net Worth</span>
                      <span className="font-bold text-amber-400">${business.netWorthM.toFixed(2)}M</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Owned Ventures Count</span>
                      <span className="font-bold">
                        {business.ventures.filter((v) => v.owned).length} / {business.ventures.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Active Arena Level Upgrades</span>
                      <span className="font-bold">
                        {business.upgrades.reduce((s, u) => s + u.level, 0)} total levels
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
