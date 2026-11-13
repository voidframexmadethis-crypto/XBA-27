"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Briefcase,
  X,
  ArrowLeftRight,
  Users,
  DollarSign,
  GraduationCap,
  Award,
  Play,
  Sparkles,
} from "lucide-react";
import { getLeagueMeta, getLeagueTeams, ProLeagueDivision } from "@/lib/leagueData";
import { calculateStandings, LeagueState } from "@/lib/leagueEngine";
import {
  calculateTeamPayrollM,
  draftProspectToTeam,
  evaluateTradeProposal,
  executeApprovedTrade,
  FranchiseState,
  runTeamTrainingCamp,
} from "@/lib/franchiseEngine";

interface FranchiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  league: LeagueState;
  onUpdateLeague: (next: LeagueState) => void;
  franchise: FranchiseState;
  onUpdateFranchise: (next: FranchiseState) => void;
  onPlayFranchiseGame: (teamId: string) => void;
  activeDivision?: ProLeagueDivision;
  onChangeDivision?: (div: ProLeagueDivision) => void;
}

export default function FranchiseModal({
  isOpen,
  onClose,
  league,
  onUpdateLeague,
  franchise,
  onUpdateFranchise,
  onPlayFranchiseGame,
  activeDivision,
  onChangeDivision,
}: FranchiseModalProps) {
  const [tab, setTab] = useState<"office" | "roster" | "trades" | "draft" | "finances">("office");
  const resolvedDivision: ProLeagueDivision =
    activeDivision || franchise.franchiseDivision || league.leagueDivision || "mens";
  const leagueTeams = useMemo(() => getLeagueTeams(resolvedDivision), [resolvedDivision]);
  const leagueMeta = useMemo(() => getLeagueMeta(resolvedDivision), [resolvedDivision]);

  const [partnerTeamIdRaw, setPartnerTeamId] = useState<string>(
    leagueTeams.find((t) => t.id !== franchise.teamId)?.id || leagueTeams[1].id
  );
  const partnerTeamId =
    leagueTeams.find((t) => t.id === partnerTeamIdRaw && t.id !== franchise.teamId)?.id ||
    leagueTeams.find((t) => t.id !== franchise.teamId)?.id ||
    leagueTeams[0].id;

  const [userOutIds, setUserOutIds] = useState<string[]>([]);
  const [partnerOutIds, setPartnerOutIds] = useState<string[]>([]);
  const [includeFirstPick, setIncludeFirstPick] = useState(false);

  const team = leagueTeams.find((t) => t.id === franchise.teamId) || leagueTeams[0];
  const standings = useMemo(() => calculateStandings(league), [league]);
  const teamStanding = standings.find((s) => s.teamId === franchise.teamId);

  const roster = useMemo(
    () =>
      league.players
        .filter((p) => p.teamId === franchise.teamId)
        .sort((a, b) => b.ratings.ovr - a.ratings.ovr),
    [league.players, franchise.teamId]
  );

  const partnerRoster = useMemo(
    () =>
      league.players
        .filter((p) => p.teamId === partnerTeamId)
        .sort((a, b) => b.ratings.ovr - a.ratings.ovr),
    [league.players, partnerTeamId]
  );

  const payrollM = useMemo(
    () => calculateTeamPayrollM(league.players, franchise.teamId),
    [league.players, franchise.teamId]
  );

  const tradeEval = useMemo(
    () =>
      evaluateTradeProposal({
        players: league.players,
        userTeamId: franchise.teamId,
        partnerTeamId,
        userOutgoingPlayerIds: userOutIds,
        partnerOutgoingPlayerIds: partnerOutIds,
        includeUserFirstRoundPick: includeFirstPick && franchise.draftPicks.some((p) => p.round === 1),
      }),
    [league.players, franchise.teamId, partnerTeamId, userOutIds, partnerOutIds, includeFirstPick, franchise.draftPicks]
  );

  const toggleId = (list: string[], id: string, setter: (v: string[]) => void) => {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const handleSwitchTeam = (nextTeamId: string) => {
    const nextTeam = leagueTeams.find((t) => t.id === nextTeamId) || leagueTeams[0];
    onUpdateFranchise({
      ...franchise,
      teamId: nextTeam.id,
      coach: {
        ...franchise.coach,
        headCoachName: nextTeam.coachName,
        offensiveStyle: nextTeam.coachStyle,
      },
      lastActionNote: `Took GM control of ${nextTeam.city} ${nextTeam.name}.`,
    });
    onUpdateLeague({ ...league, userTeamId: nextTeam.id });
    setUserOutIds([]);
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
            className="w-full max-w-6xl bg-[#080a0f] border border-white/15 rounded-2xl shadow-2xl text-white flex flex-col max-h-[92dvh] my-auto overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#0e1726] via-[#0e121a] to-[#080a0f] border-b border-white/10 flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm border border-white/25"
                  style={{ backgroundColor: team.primaryColor }}
                >
                  {team.abbr}
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">
                    Franchise Front Office · {team.city} {team.name}
                  </h2>
                  <p className="text-xs text-white/60 tabular-nums">
                    Record: {teamStanding?.wins ?? 0}-{teamStanding?.losses ?? 0} · Payroll: ${payrollM}M / $
                    {franchise.finances.salaryCapM}M Cap · Chemistry: {franchise.chemistry}%
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
                <select
                  value={franchise.teamId}
                  onChange={(e) => handleSwitchTeam(e.target.value)}
                  className="bg-black/60 border border-white/15 rounded-lg px-2.5 py-2 text-xs font-bold text-white"
                >
                  {leagueTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      GM: {t.city} {t.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    onClose();
                    onPlayFranchiseGame(franchise.teamId);
                  }}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#ff963b] hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Play Franchise Game</span>
                </button>
                <button
                  onClick={onClose}
                  aria-label="Close Franchise"
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
                  { id: "office", label: "Front Office & Staff", icon: Briefcase },
                  { id: "roster", label: "Roster & Development", icon: Users },
                  { id: "trades", label: "Trade Machine", icon: ArrowLeftRight },
                  { id: "draft", label: `Rookie Draft (${franchise.draftPicks.length} Picks)`, icon: GraduationCap },
                  { id: "finances", label: "Salary Cap & Finances", icon: DollarSign },
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

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              <div className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ff963b] shrink-0" />
                <span>{franchise.lastActionNote}</span>
              </div>

              {tab === "office" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="text-xs font-black uppercase text-white/50">Ownership & GM</div>
                    <div className="text-sm font-black">Owner: {franchise.ownerName}</div>
                    <div className="text-sm font-bold text-[#ff963b]">GM: {franchise.gmName}</div>
                    <div className="text-xs text-white/65 tabular-nums">
                      Owner Patience: {franchise.ownerPatience}% · Fan Support: {franchise.fanSupport}%
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="text-xs font-black uppercase text-white/50">Coaching Staff</div>
                    <div className="text-sm font-black">{franchise.coach.headCoachName}</div>
                    <div className="text-xs text-cyan-300 font-bold">System: {franchise.coach.offensiveStyle}</div>
                    <div className="text-xs text-white/70 tabular-nums">
                      OFF {franchise.coach.offenseRating} · DEF {franchise.coach.defenseRating} · DEV{" "}
                      {franchise.coach.playerDevRating}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="text-xs font-black uppercase text-white/50">Offseason Training Camp</div>
                    <div className="text-xs text-white/60">Run targeted team workouts (+OVR & +Chemistry):</div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(["shooting", "defense", "athleticism"] as const).map((focus) => (
                        <button
                          key={focus}
                          onClick={() => {
                            const res = runTeamTrainingCamp(franchise, league.players, focus);
                            onUpdateFranchise(res.franchise);
                            onUpdateLeague({ ...league, players: res.players });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#ff963b]/20 hover:bg-[#ff963b] hover:text-black border border-[#ff963b]/40 text-xs font-black uppercase cursor-pointer"
                        >
                          +{focus}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === "roster" && (
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-white/55 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Player</th>
                        <th className="py-2.5 px-2">Pos</th>
                        <th className="py-2.5 px-2 text-right">Age</th>
                        <th className="py-2.5 px-2 text-right">OVR</th>
                        <th className="py-2.5 px-2 text-right">SHT</th>
                        <th className="py-2.5 px-2 text-right">FIN</th>
                        <th className="py-2.5 px-2 text-right">DEF</th>
                        <th className="py-2.5 px-2 text-right">Salary</th>
                        <th className="py-2.5 px-3 text-right">Yrs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 tabular-nums">
                      {roster.map((p) => (
                        <tr key={p.id} className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold">
                            #{p.jerseyNumber} {p.name}{" "}
                            {p.isStarter && <span className="text-[10px] text-amber-400">STR</span>}
                          </td>
                          <td className="py-2.5 px-2">{p.position}</td>
                          <td className="py-2.5 px-2 text-right text-white/70">{p.age}</td>
                          <td className="py-2.5 px-2 text-right font-black text-[#ff963b]">{p.ratings.ovr}</td>
                          <td className="py-2.5 px-2 text-right">{p.ratings.shooting}</td>
                          <td className="py-2.5 px-2 text-right">{p.ratings.finishing}</td>
                          <td className="py-2.5 px-2 text-right">{p.ratings.defense}</td>
                          <td className="py-2.5 px-2 text-right">${p.salaryMillions}M</td>
                          <td className="py-2.5 px-3 text-right">{p.contractYears}y</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === "trades" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-white/10 p-4 space-y-2">
                      <div className="text-xs font-black uppercase text-[#ff963b]">
                        Your Outgoing Assets ({team.abbr})
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-1.5">
                        {roster.map((p) => {
                          const picked = userOutIds.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              onClick={() => toggleId(userOutIds, p.id, setUserOutIds)}
                              className={`w-full px-3 py-2 rounded-lg border text-left text-xs flex justify-between cursor-pointer tabular-nums ${
                                picked
                                  ? "bg-[#ff963b]/20 border-[#ff963b]"
                                  : "bg-white/5 border-white/10 hover:bg-white/10"
                              }`}
                            >
                              <span className="font-bold">
                                {p.position} {p.name} ({p.ratings.ovr} OVR)
                              </span>
                              <span>${p.salaryMillions}M</span>
                            </button>
                          );
                        })}
                      </div>
                      {franchise.draftPicks.some((pk) => pk.round === 1) && (
                        <button
                          onClick={() => setIncludeFirstPick((v) => !v)}
                          className={`w-full py-2 px-3 rounded-lg border text-xs font-bold cursor-pointer ${
                            includeFirstPick
                              ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                              : "bg-white/5 border-white/10 text-white/70"
                          }`}
                        >
                          {includeFirstPick ? "✓ Including 1st Round Draft Pick" : "+ Attach 1st Round Draft Pick"}
                        </button>
                      )}
                    </div>

                    <div className="rounded-xl border border-white/10 p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black uppercase text-cyan-300">Trade Partner</span>
                        <select
                          value={partnerTeamId}
                          onChange={(e) => {
                            setPartnerTeamId(e.target.value);
                            setPartnerOutIds([]);
                          }}
                          className="bg-black/70 border border-white/15 rounded-lg px-2 py-1 text-xs font-bold"
                        >
                          {leagueTeams.filter((t) => t.id !== franchise.teamId).map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.city} {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-1.5">
                        {partnerRoster.map((p) => {
                          const picked = partnerOutIds.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              onClick={() => toggleId(partnerOutIds, p.id, setPartnerOutIds)}
                              className={`w-full px-3 py-2 rounded-lg border text-left text-xs flex justify-between cursor-pointer tabular-nums ${
                                picked
                                  ? "bg-cyan-500/20 border-cyan-400"
                                  : "bg-white/5 border-white/10 hover:bg-white/10"
                              }`}
                            >
                              <span className="font-bold">
                                {p.position} {p.name} ({p.ratings.ovr} OVR)
                              </span>
                              <span>${p.salaryMillions}M</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5 text-xs tabular-nums">
                      <div className="font-bold">{tradeEval.reason}</div>
                      <div className="text-white/55">
                        Salary Check: Out ${tradeEval.userOutgoingSalaryM}M vs In ${tradeEval.userIncomingSalaryM}M
                      </div>
                    </div>
                    <button
                      disabled={!tradeEval.aiAccepts}
                      onClick={() => {
                        const pick = includeFirstPick ? franchise.draftPicks.find((pk) => pk.round === 1)?.id : undefined;
                        const res = executeApprovedTrade({
                          franchise,
                          players: league.players,
                          partnerTeamId,
                          userOutgoingPlayerIds: userOutIds,
                          partnerOutgoingPlayerIds: partnerOutIds,
                          pickIdToInclude: pick,
                        });
                        onUpdateFranchise(res.franchise);
                        onUpdateLeague({ ...league, players: res.players });
                        setUserOutIds([]);
                        setPartnerOutIds([]);
                        setIncludeFirstPick(false);
                      }}
                      className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer ${
                        tradeEval.aiAccepts
                          ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                          : "bg-white/5 text-white/35 cursor-not-allowed"
                      }`}
                    >
                      Execute Trade
                    </button>
                  </div>
                </div>
              )}

              {tab === "draft" && (
                <div className="space-y-3">
                  <div className="text-xs text-white/65">
                    Draft Picks Available: <strong className="text-[#ff963b]">{franchise.draftPicks.length}</strong> · Select any scouted prospect to add to your active roster.
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {franchise.draftBoard.map((pr) => (
                      <div key={pr.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-black">{pr.name}</div>
                            <div className="text-[11px] text-white/55">
                              #{pr.projectedPick} Proj · {pr.position} · Age {pr.age}
                            </div>
                          </div>
                          <span className="text-xs font-black text-[#ff963b] tabular-nums">
                            {pr.ratings.ovr} / {pr.potential} POT
                          </span>
                        </div>
                        <div className="text-[11px] text-white/65">
                          {pr.archetype} · {pr.collegeOrOrigin}
                        </div>
                        <button
                          disabled={franchise.draftPicks.length === 0}
                          onClick={() => {
                            const res = draftProspectToTeam({
                              franchise,
                              players: league.players,
                              prospectId: pr.id,
                            });
                            onUpdateFranchise(res.franchise);
                            onUpdateLeague({ ...league, players: res.players });
                          }}
                          className="w-full py-2 rounded-lg bg-[#ff963b] hover:bg-amber-400 disabled:bg-white/5 disabled:text-white/30 text-black text-xs font-black uppercase cursor-pointer"
                        >
                          {franchise.draftPicks.length > 0 ? "Draft Prospect" : "No Picks Remaining"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "finances" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 tabular-nums">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
                    <h4 className="text-xs font-black uppercase text-[#ff963b]">Cap & Payroll Ledger</h4>
                    <div className="flex justify-between text-xs">
                      <span>Active Team Payroll</span>
                      <span className="font-black">${payrollM}M</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>{leagueMeta.abbr} Soft Salary Cap</span>
                      <span>${franchise.finances.salaryCapM}M</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Luxury Tax Threshold</span>
                      <span>${franchise.finances.luxuryTaxLineM}M</span>
                    </div>
                    <div className="flex justify-between text-xs pt-2 border-t border-white/10">
                      <span>Cap Space Remaining</span>
                      <span
                        className={`font-black ${
                          franchise.finances.salaryCapM - payrollM >= 0 ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        ${(franchise.finances.salaryCapM - payrollM).toFixed(1)}M
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
                    <h4 className="text-xs font-black uppercase text-cyan-300">Arena Revenue & Valuation</h4>
                    <div className="flex justify-between text-xs">
                      <span>Liquid Reserves</span>
                      <span className="font-black text-emerald-400">${franchise.finances.cashReservesM}M</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Ticket Price Avg</span>
                      <span>${franchise.finances.ticketPrice}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Gate Revenue / Home Game</span>
                      <span>${franchise.finances.ticketRevenuePerHomeGameM}M</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Annual Merchandising</span>
                      <span>${franchise.finances.merchRevenueAnnualM}M</span>
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
