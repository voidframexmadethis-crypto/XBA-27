"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  X,
  Trophy,
  Briefcase,
  TrendingUp,
  Zap,
  Play,
  Award,
  Check,
  Edit3,
} from "lucide-react";
import { getLeagueMeta, getLeagueTeams, ProLeagueDivision } from "@/lib/leagueData";
import {
  AthleteAttributes,
  AthleteProfile,
  calculateOverallRating,
  formatHeight,
  saveAthleteProfile,
} from "@/lib/athleteProfile";
import {
  getReputationTier,
  MyCareerState,
  negotiateCareerContract,
  signCareerSponsorship,
} from "@/lib/careerEngine";

interface CareerHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AthleteProfile;
  onUpdateProfile: (next: AthleteProfile) => void;
  career: MyCareerState;
  onUpdateCareer: (next: MyCareerState) => void;
  onOpenCreateAthlete: () => void;
  onLaunchCareerGame: () => void;
  activeDivision?: ProLeagueDivision;
  onChangeDivision?: (div: ProLeagueDivision) => void;
}

export default function CareerHubModal({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  career,
  onUpdateCareer,
  onOpenCreateAthlete,
  onLaunchCareerGame,
  activeDivision,
  onChangeDivision,
}: CareerHubModalProps) {
  const [selectedTab, setSelectedTab] = useState<"overview" | "upgrades" | "endorsements" | "contracts">("overview");
  const resolvedDivision: ProLeagueDivision = activeDivision || career.careerDivision || "mens";
  const leagueTeams = getLeagueTeams(resolvedDivision);
  const leagueMeta = getLeagueMeta(resolvedDivision);
  const ovr = calculateOverallRating(profile.attributes);
  const repTier = getReputationTier(career.reputation);
  const currentTeam = leagueTeams.find((t) => t.id === career.teamId) || leagueTeams[0];

  const upgradeCost = (val: number) => Math.max(80, (val - 55) * 14);

  const handleUpgradeSkill = (key: keyof AthleteAttributes) => {
    const curVal = profile.attributes[key];
    const cost = upgradeCost(curVal);
    if (curVal >= 99 || career.xpAvailable < cost) return;
    const updatedProfile: AthleteProfile = {
      ...profile,
      attributes: {
        ...profile.attributes,
        [key]: Math.min(99, curVal + 1),
      },
    };
    saveAthleteProfile(updatedProfile);
    onUpdateProfile(updatedProfile);
    onUpdateCareer({
      ...career,
      xpAvailable: career.xpAvailable - cost,
    });
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
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl border border-white/25"
                  style={{ backgroundColor: profile.jerseyColorHex }}
                >
                  #{profile.jerseyNumber}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black uppercase tracking-tight">
                      My Career · {profile.firstName} {profile.lastName}
                    </h2>
                    <span className="text-xs font-black px-2 py-0.5 rounded bg-[#ff963b] text-black tabular-nums">
                      {ovr} OVR {profile.position}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 tabular-nums">
                    {currentTeam.city} {currentTeam.name} · {repTier.title} ({career.reputation} REP) · $
                    {(career.bankBalanceK / 1000).toFixed(2)}M Net Earnings
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {onChangeDivision && (
                  <div className="flex rounded-xl bg-black/60 border border-white/15 p-1">
                    {(
                      [
                        { id: "mens", label: "Men's (APBA)" },
                        { id: "womens", label: "Women's (WPBA)" },
                      ] as const
                    ).map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => onChangeDivision(d.id)}
                        className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[11px] font-black uppercase cursor-pointer ${
                          resolvedDivision === d.id
                            ? "bg-[#ff963b] text-black"
                            : "text-white/65 hover:text-white"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => {
                    onClose();
                    onOpenCreateAthlete();
                  }}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Build & Look</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onLaunchCareerGame();
                  }}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#ff963b] hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Play Next Career Game</span>
                </button>
                <button
                  onClick={onClose}
                  aria-label="Close My Career"
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6 bg-black/40 border-b border-white/10 flex gap-1 overflow-x-auto shrink-0">
              {(
                [
                  { id: "overview", label: "Career Dashboard", icon: User },
                  { id: "upgrades", label: `Attribute Lab (${career.xpAvailable} XP)`, icon: Zap },
                  { id: "endorsements", label: "Sponsorships", icon: Award },
                  { id: "contracts", label: "Team & Contracts", icon: Briefcase },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setSelectedTab(id)}
                  className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    selectedTab === id
                      ? "border-[#ff963b] text-white"
                      : "border-transparent text-white/45 hover:text-white/80"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-[#ff963b]" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {selectedTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="text-xs font-black uppercase text-white/50">Bio & Archetype</div>
                    <div className="text-base font-black">{profile.archetype}</div>
                    <div className="text-xs text-white/65 tabular-nums">
                      Height: {formatHeight(profile.heightInches)} · Jersey #{profile.jerseyNumber}
                    </div>
                    <div className="text-xs text-emerald-400 font-bold">
                      Contract: ${career.contract.annualSalaryM}M / yr ({career.contract.yearsLeft} yrs left)
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="text-xs font-black uppercase text-white/50">Reputation & Rings</div>
                    <div className="text-base font-black text-[#ff963b] flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>{repTier.title}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/10">
                      <div
                        className="h-full bg-[#ff963b]"
                        style={{ width: `${Math.min(100, Math.round((career.reputation / repTier.nextAt) * 100))}%` }}
                      />
                    </div>
                    <div className="text-xs text-white/65 flex items-center justify-between tabular-nums">
                      <span>{career.reputation} / {repTier.nextAt} REP</span>
                      <span className="flex items-center gap-1 text-amber-300 font-bold">
                        <Trophy className="w-3.5 h-3.5" /> {career.championshipRings} Rings
                      </span>
                    </div>
                    <div className="text-[11px] text-cyan-300/85 font-bold tabular-nums pt-1 border-t border-white/10">
                      All-Star Selections: {career.allStarSelections ?? 0} · Int&apos;l Medals: {career.internationalMedals ?? 0}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="text-xs font-black uppercase text-white/50">XP & Progression</div>
                    <div className="text-2xl font-black text-white tabular-nums">{career.xpAvailable} XP</div>
                    <div className="text-xs text-white/60 tabular-nums">
                      Lifetime Earned: {career.totalXpEarned} XP
                    </div>
                    <button
                      onClick={() => setSelectedTab("upgrades")}
                      className="text-xs font-black uppercase text-[#ff963b] hover:underline cursor-pointer"
                    >
                      Upgrade Player Ratings →
                    </button>
                  </div>
                </div>
              )}

              {selectedTab === "upgrades" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
                    <div>
                      <div className="text-sm font-black uppercase">Spend Earned XP to Boost Ratings</div>
                      <div className="text-xs text-white/60">
                        Ratings apply live on court in all My Career & Exhibition games.
                      </div>
                    </div>
                    <div className="text-lg font-black text-[#ff963b] tabular-nums">{career.xpAvailable} XP</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(
                      [
                        { key: "shooting", label: "Jump Shot & 3PT Range" },
                        { key: "finishing", label: "Driving Layups & Dunks" },
                        { key: "handles", label: "Ball Handling & Quickness" },
                        { key: "defense", label: "Perimeter Defense & Steals" },
                      ] as const
                    ).map(({ key, label }) => {
                      const val = profile.attributes[key];
                      const cost = upgradeCost(val);
                      const canBuy = val < 99 && career.xpAvailable >= cost;
                      return (
                        <div key={key} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold">{label}</span>
                            <span className="text-xl font-black text-[#ff963b] tabular-nums">{val}</span>
                          </div>
                          <div className="w-full h-2 rounded bg-black/60 overflow-hidden">
                            <div className="h-full bg-amber-400" style={{ width: `${val}%` }} />
                          </div>
                          <button
                            disabled={!canBuy}
                            onClick={() => handleUpgradeSkill(key)}
                            className={`w-full py-2 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer ${
                              canBuy
                                ? "bg-[#ff963b] hover:bg-amber-400 text-black"
                                : "bg-white/5 text-white/35 cursor-not-allowed"
                            }`}
                          >
                            {val >= 99 ? "Maxed (99)" : `+1 Rating (${cost} XP)`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedTab === "endorsements" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {career.sponsorships.map((sp) => {
                    const eligible = career.reputation >= sp.minReputation;
                    return (
                      <div
                        key={sp.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                          sp.signed ? "bg-emerald-500/10 border-emerald-500/40" : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-black uppercase">{sp.brandName}</span>
                            <span className="text-[11px] font-bold text-[#ff963b]">{sp.tierLabel}</span>
                          </div>
                          <div className="text-xs text-white/60 mt-0.5">{sp.category}</div>
                          <div className="text-xs text-white/80 mt-2 tabular-nums">
                            Signing Bonus: ${Math.round(sp.baseSalaryPerSeason * 0.4)}K · +${sp.perWinBonus}K per Win
                          </div>
                        </div>
                        {sp.signed ? (
                          <div className="py-2 px-3 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase flex items-center justify-center gap-1.5">
                            <Check className="w-4 h-4" /> Active Partner
                          </div>
                        ) : (
                          <button
                            disabled={!eligible}
                            onClick={() => onUpdateCareer(signCareerSponsorship(career, sp.id))}
                            className={`w-full py-2 rounded-lg text-xs font-black uppercase cursor-pointer ${
                              eligible
                                ? "bg-white text-black hover:bg-neutral-200"
                                : "bg-white/5 text-white/40 cursor-not-allowed"
                            }`}
                          >
                            {eligible ? "Sign Endorsement" : `Requires ${sp.minReputation} REP`}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedTab === "contracts" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-sm font-black uppercase">Sign / Transfer to Starting {leagueMeta.abbr} Franchise</div>
                    <div className="text-xs text-white/60">
                      Negotiate a fresh 4-year deal scaled to your {ovr} OVR rating & {career.reputation} REP.
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {leagueTeams.map((t) => {
                      const isCurrent = t.id === career.teamId;
                      return (
                        <div
                          key={t.id}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 ${
                            isCurrent ? "bg-[#ff963b]/15 border-[#ff963b]" : "bg-white/5 border-white/10"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-black uppercase truncate">
                              {t.city} {t.name}
                            </div>
                            <div className="text-[11px] text-white/55">
                              {t.conference} · {t.baseRating} Team OVR
                            </div>
                          </div>
                          {isCurrent ? (
                            <span className="text-[10px] font-black uppercase text-[#ff963b] shrink-0">Active</span>
                          ) : (
                            <button
                              onClick={() => onUpdateCareer(negotiateCareerContract(career, t.id, ovr))}
                              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#ff963b] hover:text-black text-[11px] font-black uppercase cursor-pointer shrink-0"
                            >
                              Sign
                            </button>
                          )}
                        </div>
                      );
                    })}
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
