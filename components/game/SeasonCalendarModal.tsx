"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, X, Play, CheckCircle2, Clock, Filter, Search } from "lucide-react";
import { getLeagueTeams, ProLeagueDivision } from "@/lib/leagueData";
import { LeagueState, ScheduledGame } from "@/lib/leagueEngine";

interface SeasonCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  league: LeagueState;
  onUpdateLeague: (next: LeagueState) => void;
  onPlayMatchup: (homeTeamId: string, awayTeamId: string, isPlayoff?: boolean) => void;
  activeDivision?: ProLeagueDivision;
}

const MONTH_NAMES = [
  "Month 1 (October)",
  "Month 2 (November)",
  "Month 3 (December)",
  "Month 4 (January)",
  "Month 5 (February)",
  "Month 6 (March / April)",
];

export default function SeasonCalendarModal({
  isOpen,
  onClose,
  league,
  onUpdateLeague,
  onPlayMatchup,
  activeDivision,
}: SeasonCalendarModalProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"all" | "played" | "upcoming">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const resolvedDivision: ProLeagueDivision = activeDivision || league.leagueDivision || "mens";
  const leagueTeams = useMemo(() => getLeagueTeams(resolvedDivision), [resolvedDivision]);
  const teamById = useMemo(() => new Map(leagueTeams.map((t) => [t.id, t])), [leagueTeams]);

  // Group 82 rounds into 6 months (~14 rounds per month)
  const getMonthForRound = (round: number) => {
    if (round <= 14) return 1;
    if (round <= 28) return 2;
    if (round <= 42) return 3;
    if (round <= 56) return 4;
    if (round <= 70) return 5;
    return 6;
  };

  const filteredSchedule = useMemo(() => {
    return league.schedule.filter((g) => {
      const m = getMonthForRound(g.round);
      if (m !== selectedMonth) return false;

      if (statusFilter === "played" && !g.played) return false;
      if (statusFilter === "upcoming" && g.played) return false;

      if (teamFilter !== "ALL") {
        if (g.homeTeamId !== teamFilter && g.awayTeamId !== teamFilter) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const home = teamById.get(g.homeTeamId);
        const away = teamById.get(g.awayTeamId);
        const matchText = `${home?.city} ${home?.name} ${away?.city} ${away?.name} r${g.round}`.toLowerCase();
        if (!matchText.includes(q)) return false;
      }

      return true;
    });
  }, [league.schedule, selectedMonth, statusFilter, teamFilter, searchQuery, teamById]);

  const completedCount = useMemo(
    () => league.schedule.filter((g) => getMonthForRound(g.round) === selectedMonth && g.played).length,
    [league.schedule, selectedMonth]
  );
  const totalMonthCount = useMemo(
    () => league.schedule.filter((g) => getMonthForRound(g.round) === selectedMonth).length,
    [league.schedule, selectedMonth]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-[205] flex items-start sm:items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5 overflow-y-auto"
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
                <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">
                    Season Calendar · 82-Game Schedule ({league.seasonYear})
                  </h2>
                  <p className="text-xs text-white/60 tabular-nums">
                    Current Round: <strong className="text-[#ff963b]">R{Math.min(82, league.currentRound)}</strong> · Month{" "}
                    {selectedMonth} Progress: {completedCount} / {totalMonthCount} Games Played
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="Close Season Calendar"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Monthly Navigation Tabs */}
            <div className="px-6 bg-black/50 border-b border-white/10 flex gap-1 overflow-x-auto shrink-0">
              {MONTH_NAMES.map((name, idx) => {
                const mNum = idx + 1;
                const active = selectedMonth === mNum;
                return (
                  <button
                    key={name}
                    onClick={() => setSelectedMonth(mNum)}
                    className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 whitespace-nowrap cursor-pointer ${
                      active ? "border-[#ff963b] text-white bg-white/5" : "border-transparent text-white/45 hover:text-white/80"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>

            {/* Filters & Search Toolbar */}
            <div className="px-6 py-3 bg-black/30 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#ff963b]" />
                  <select
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Teams (League)</option>
                    {leagueTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.city} {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex rounded-lg bg-white/5 border border-white/10 p-0.5">
                  {(
                    [
                      { id: "all", label: "All" },
                      { id: "played", label: "Results" },
                      { id: "upcoming", label: "Upcoming" },
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStatusFilter(s.id)}
                      className={`px-3 py-1 rounded text-xs font-black uppercase cursor-pointer ${
                        statusFilter === s.id ? "bg-[#ff963b] text-black" : "text-white/70 hover:text-white"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-white/40 shrink-0" />
                <input
                  type="text"
                  placeholder="Search team or round..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-white placeholder-white/40 focus:outline-none w-full"
                />
              </div>
            </div>

            {/* Schedule List Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {filteredSchedule.length === 0 ? (
                <div className="p-12 text-center text-sm text-white/50 border border-white/10 rounded-xl">
                  No matches found for the selected month and filter criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredSchedule.map((g) => {
                    const away = teamById.get(g.awayTeamId);
                    const home = teamById.get(g.homeTeamId);
                    const isUserGame = g.homeTeamId === league.userTeamId || g.awayTeamId === league.userTeamId;

                    return (
                      <div
                        key={g.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                          isUserGame ? "bg-[#ff963b]/10 border-[#ff963b]/40" : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 text-[11px] text-white/55 font-bold">
                            <span>Round {g.round}</span>
                            <span>·</span>
                            <span>{home?.arenaName || "Pro Arena"}</span>
                          </div>
                          <div className="text-xs font-black uppercase truncate flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: away?.primaryColor }} />
                            <span>
                              {away?.city} {away?.name} @ {home?.city} {home?.name}
                            </span>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: home?.primaryColor }} />
                          </div>
                          <div className="text-[11px] text-white/70 tabular-nums">
                            {g.played ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Final: {away?.abbr} {g.awayScore} - {home?.abbr} {g.homeScore}
                                {g.overtimePeriods > 0 ? ` (${g.overtimePeriods}OT)` : ""}
                              </span>
                            ) : (
                              <span className="text-amber-400 font-bold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> Upcoming Matchup
                              </span>
                            )}
                          </div>
                        </div>

                        {!g.played && league.phase === "regular_season" && (
                          <button
                            onClick={() => {
                              onClose();
                              onPlayMatchup(g.homeTeamId, g.awayTeamId, false);
                            }}
                            className="px-3.5 py-2 rounded-lg bg-[#ff963b] hover:bg-amber-400 text-black text-xs font-black uppercase cursor-pointer shrink-0 flex items-center gap-1"
                          >
                            <Play className="w-3.5 h-3.5 fill-black" />
                            <span>Play</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
