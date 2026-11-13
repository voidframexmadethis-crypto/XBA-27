"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  X,
  Building2,
  Car,
  Briefcase,
  Calendar,
  DollarSign,
  TrendingUp,
  Award,
  Sparkles,
  Check,
  Plus,
} from "lucide-react";
import {
  AdventureForgeUniverseState,
  buyProperty,
  buyVehicle,
  buyOrUpgradeBusiness,
  advanceUniverseDay,
  saveUniverseState,
} from "@/lib/adventureForgeUniverse";

interface AdventureForgeUniverseModalProps {
  isOpen: boolean;
  onClose: () => void;
  universe: AdventureForgeUniverseState;
  onUpdateUniverse: (next: AdventureForgeUniverseState) => void;
}

type UniverseTab = "overview" | "real_estate" | "vehicles" | "businesses" | "calendar";

export default function AdventureForgeUniverseModal({
  isOpen,
  onClose,
  universe,
  onUpdateUniverse,
}: AdventureForgeUniverseModalProps) {
  const [activeTab, setActiveTab] = useState<UniverseTab>("overview");
  const [notice, setNotice] = useState<string>("");

  const totalNetWorthK =
    universe.bankCashK +
    universe.properties.filter((p) => p.owned).reduce((sum, p) => sum + p.purchasePriceK, 0) +
    universe.vehicles.filter((v) => v.owned).reduce((sum, v) => sum + v.purchasePriceK, 0) +
    universe.businesses.filter((b) => b.owned).reduce((sum, b) => sum + b.costK * b.level, 0);

  const handleBuyProp = (id: string) => {
    const next = buyProperty(universe, id);
    saveUniverseState(next);
    onUpdateUniverse(next);
    setNotice("Property purchased successfully!");
    setTimeout(() => setNotice(""), 3000);
  };

  const handleBuyVeh = (id: string) => {
    const next = buyVehicle(universe, id);
    saveUniverseState(next);
    onUpdateUniverse(next);
    setNotice("Vehicle added to your garage!");
    setTimeout(() => setNotice(""), 3000);
  };

  const handleBizAction = (id: string) => {
    const next = buyOrUpgradeBusiness(universe, id);
    saveUniverseState(next);
    onUpdateUniverse(next);
    setNotice("Business operation updated successfully!");
    setTimeout(() => setNotice(""), 3000);
  };

  const handleAdvanceDay = () => {
    const next = advanceUniverseDay(universe);
    saveUniverseState(next);
    onUpdateUniverse(next);
    setNotice(`Advanced to Day ${next.currentDay}. Daily revenue collected.`);
    setTimeout(() => setNotice(""), 3000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-[210] flex items-start sm:items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 14 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 14 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl bg-[#07090e] border border-white/15 rounded-2xl shadow-2xl text-white flex flex-col max-h-[92dvh] my-auto overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#171b26] via-[#0d1017] to-[#1f170f] border-b border-white/10 flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#ff963b] text-black flex items-center justify-center font-black">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                      AdventureForge Basketball Universe
                    </h2>
                    <span className="text-xs font-black px-2 py-0.5 rounded bg-[#ff963b]/20 text-[#ff963b] border border-[#ff963b]/35 tabular-nums">
                      Day {universe.currentDay} · {universe.seasonYear}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 tabular-nums">
                    Liquid Cash: ${(universe.bankCashK / 1000).toFixed(2)}M · Estimated Net Worth: ${(totalNetWorthK / 1000).toFixed(2)}M
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAdvanceDay}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Advance Day +1</span>
                </button>
                <button
                  onClick={onClose}
                  aria-label="Close Universe Hub"
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {notice && (
              <div className="px-6 py-2.5 bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
                {notice}
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="px-6 bg-neutral-950 border-b border-white/10 flex gap-1 overflow-x-auto shrink-0">
              {(
                [
                  { id: "overview", label: "Universe Dashboard", icon: TrendingUp },
                  { id: "real_estate", label: "Real Estate & Properties", icon: Building2 },
                  { id: "vehicles", label: "Garage & Vehicles", icon: Car },
                  { id: "businesses", label: "Business Empire", icon: Briefcase },
                  { id: "calendar", label: "Living World Calendar", icon: Calendar },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === id
                      ? "border-[#ff963b] text-white"
                      : "border-transparent text-white/45 hover:text-white/80"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-[#ff963b]" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-[#ff963b]">
                      <DollarSign className="w-4 h-4" />
                      <span>Financial Portfolio</span>
                    </div>
                    <div className="text-3xl font-black tabular-nums">${(totalNetWorthK / 1000).toFixed(2)}M</div>
                    <div className="text-xs text-white/60 space-y-1 tabular-nums">
                      <div>Liquid Balance: ${(universe.bankCashK / 1000).toFixed(2)}M</div>
                      <div>Properties Value: ${(universe.properties.filter((p) => p.owned).reduce((s, p) => s + p.purchasePriceK, 0) / 1000).toFixed(2)}M</div>
                      <div>Businesses Value: ${(universe.businesses.filter((b) => b.owned).reduce((s, b) => s + b.costK * b.level, 0) / 1000).toFixed(2)}M</div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-cyan-300">
                      <Sparkles className="w-4 h-4" />
                      <span>Lifestyle & Status</span>
                    </div>
                    <div className="text-3xl font-black tabular-nums">{universe.lifestyleReputation} REP</div>
                    <div className="text-xs text-white/60 space-y-1 tabular-nums">
                      <div>Owned Properties: {universe.properties.filter((p) => p.owned).length}</div>
                      <div>Garage Vehicles: {universe.vehicles.filter((v) => v.owned).length}</div>
                      <div>Active Enterprises: {universe.businesses.filter((b) => b.owned).length}</div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-400">
                      <Award className="w-4 h-4" />
                      <span>Social Network</span>
                    </div>
                    <div className="text-3xl font-black tabular-nums">{universe.socialConnectionsCount} Contacts</div>
                    <p className="text-xs text-white/60">
                      Connected with teammates, coaches, global brand executives, and franchise general managers across 31 cities.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "real_estate" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {universe.properties.map((prop) => (
                    <div
                      key={prop.id}
                      className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
                        prop.owned ? "bg-emerald-500/10 border-emerald-500/40" : "bg-white/5 border-white/10"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black uppercase">{prop.name}</span>
                          <span className="text-xs font-bold text-[#ff963b]">{prop.district}</span>
                        </div>
                        <div className="text-xs text-white/60">
                          Comfort Rating: {prop.comfortRating}/100 · Daily Upkeep: ${prop.dailyUpkeepK}K
                        </div>
                        <div className="text-xs font-bold text-white/80 tabular-nums">
                          Value: ${(prop.purchasePriceK / 1000).toFixed(2)}M
                        </div>
                      </div>
                      {prop.owned ? (
                        <div className="py-2.5 px-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4" /> Owned Residence
                        </div>
                      ) : (
                        <button
                          onClick={() => handleBuyProp(prop.id)}
                          className="w-full py-2.5 rounded-xl bg-[#ff963b] hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider cursor-pointer transition-colors"
                        >
                          Acquire Property (${(prop.purchasePriceK / 1000).toFixed(2)}M)
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "vehicles" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {universe.vehicles.map((veh) => (
                    <div
                      key={veh.id}
                      className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
                        veh.owned ? "bg-cyan-500/10 border-cyan-500/40" : "bg-white/5 border-white/10"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black uppercase">{veh.name}</span>
                          <span className="text-xs font-bold text-cyan-300">{veh.topSpeedMph} MPH Top Speed</span>
                        </div>
                        <div className="text-xs text-white/60">Style Score: {veh.styleScore}/100</div>
                        <div className="text-xs font-bold text-white/80 tabular-nums">
                          Price: ${(veh.purchasePriceK / 1000).toFixed(2)}M
                        </div>
                      </div>
                      {veh.owned ? (
                        <div className="py-2.5 px-3 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4" /> In Personal Garage
                        </div>
                      ) : (
                        <button
                          onClick={() => handleBuyVeh(veh.id)}
                          className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black uppercase tracking-wider cursor-pointer transition-colors"
                        >
                          Purchase Vehicle (${(veh.purchasePriceK / 1000).toFixed(2)}M)
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "businesses" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {universe.businesses.map((biz) => {
                    const netDaily = (biz.dailyRevenueK - biz.dailyExpenseK) * (1 + biz.level * 0.15);
                    const upgradeCost = Math.round(biz.costK * 0.5 * biz.level);
                    return (
                      <div
                        key={biz.id}
                        className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
                          biz.owned ? "bg-amber-500/10 border-amber-500/40" : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black uppercase">{biz.name}</span>
                            <span className="text-xs font-black text-amber-400">Level {biz.level} Enterprise</span>
                          </div>
                          <div className="text-xs text-white/60">{biz.district} · {biz.employees} Employees</div>
                          <div className="text-xs font-bold text-white/80 tabular-nums">
                            Net Daily Profit: <span className={netDaily >= 0 ? "text-emerald-400" : "text-red-400"}>+${netDaily.toFixed(1)}K / day</span>
                          </div>
                        </div>
                        {biz.owned ? (
                          <button
                            onClick={() => handleBizAction(biz.id)}
                            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                          >
                            <TrendingUp className="w-4 h-4" />
                            <span>Upgrade Enterprise (Cost: ${upgradeCost}K)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBizAction(biz.id)}
                            className="w-full py-2.5 rounded-xl bg-[#ff963b] hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider cursor-pointer transition-colors"
                          >
                            Acquire Business (${biz.costK}K)
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === "calendar" && (
                <div className="space-y-3">
                  {universe.calendar.map((ev, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black px-2 py-0.5 rounded bg-[#ff963b]/20 text-[#ff963b] tabular-nums">
                            Day {ev.dayIndex}
                          </span>
                          <span className="text-sm font-black uppercase">{ev.title}</span>
                        </div>
                        <p className="text-xs text-white/60 mt-1">{ev.description}</p>
                      </div>
                      <span className="text-[11px] font-bold text-white/50 uppercase shrink-0">{ev.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
