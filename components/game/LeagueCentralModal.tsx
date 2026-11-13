"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy,
  X,
  Calendar,
  BarChart3,
  Award,
  FastForward,
  Play,
  Crown,
  Shield,
  Sparkles,
  RotateCw,
} from "lucide-react";
import { getLeagueMeta, getLeagueTeams, ProLeagueDivision } from "@/lib/leagueData";
import {
  advanceToNextLeagueSeason,
  calculateStandings,
  computeSeasonAwards,
  LeagueState,
  PlayoffRoundCode,
  simulateEntirePlayoffs,
  simulatePlayoffGame,
  simulatePlayoffRound,
  simulateRemainingRegularSeason,
  simulateRounds,
} from "@/lib/leagueEngine";

interface LeagueCentralModalProps {
  isOpen: boolean;
  onClose: () => void;
  league: LeagueState;
  onUpdateLeague: (next: LeagueState) => void;
  onPlayMatchup: (homeTeamId: string, awayTeamId: string, isPlayoff?: boolean) => void;
  activeDivision?: ProLeagueDivision;
  onChangeDivision?: (div: ProLeagueDivision) => void;
}

type TabId = "standings" | "schedule" | "leaders" | "awards" | "playoffs";

const getRoundLabels = (leagueAbbr: string): Record<PlayoffRoundCode, string> => ({
  conf_first_round: "Conference First Round",
  conf_semis: "Conference Semifinals",
  conf_finals: "Conference Finals",
  finals: `${leagueAbbr} Championship Finals`,
  complete: "Season Champion Crowned",
});

export default function LeagueCentralModal({
  isOpen,
  onClose,
  league,
  onUpdateLeague,
  onPlayMatchup,
  activeDivision,
  onChangeDivision,
}: LeagueCentralModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("standings");
  const [standingsFilter, setStandingsFilter] = useState<"Eastern" | "Western" | "Divisions">("Eastern");
  const [statMode, setStatMode] = useState<"season" | "career">("season");
  const [statSort, setStatSort] = useState<"pts" | "reb" | "ast" | "stl" | "blk">("pts");

  const resolvedDivision: ProLeagueDivision = activeDivision || league.leagueDivision || "mens";
  const leagueTeams = useMemo(() => getLeagueTeams(resolvedDivision), [resolvedDivision]);
  const leagueMeta = useMemo(() => getLeagueMeta(resolvedDivision), [resolvedDivision]);
  const roundLabels = useMemo(() => getRoundLabels(leagueMeta.abbr), [leagueMeta.abbr]);
  const teamById = useMemo(() => new Map(leagueTeams.map((t) => [t.id, t])), [leagueTeams]);
  const standings = useMemo(() => calculateStandings(league), [league]);

  const userTeamStanding = standings.find((s) => s.teamId === league.userTeamId) || standings[0];
  const nextUserGame = useMemo(
    () =>
      league.schedule.find(
        (g) => !g.played && (g.homeTeamId === league.userTeamId || g.awayTeamId === league.userTeamId)
      ),
    [league.schedule, league.userTeamId]
  );

  const upcomingRoundGames = useMemo(() => {
    const targetRound = Math.min(82, league.currentRound);
    return league.schedule.filter((g) => g.round === targetRound);
  }, [league.schedule, league.currentRound]);

  const liveAwards = useMemo(() => {
    const stored = league.awardsHistory.find((a) => a.seasonYear === league.seasonYear);
    if (stored) return stored;
    const anyPlayed = league.players.some((p) => p.seasonStats.gp > 0);
    return anyPlayed ? computeSeasonAwards(league) : null;
  }, [league]);

  const statLeaders = useMemo(() => {
    const list = league.players
      .filter((p) => (statMode === "season" ? p.seasonStats.gp > 0 : p.careerStats.gp > 0))
      .map((p) => {
        const st = statMode === "season" ? p.seasonStats : p.careerStats;
        const g = Math.max(1, st.gp);
        return {
          player: p,
          gp: st.gp,
          minPg: st.min / g,
          ppg: st.pts / g,
          rpg: st.reb / g,
          apg: st.ast / g,
          spg: st.stl / g,
          bpg: st.blk / g,
          tpg: st.tov / g,
          fgPct: st.fga > 0 ? (st.fgm / st.fga) * 100 : 0,
          threePct: st.tpa > 0 ? (st.tpm / st.tpa) * 100 : 0,
          ftPct: st.fta > 0 ? (st.ftm / st.fta) * 100 : 0,
        };
      });

    return list
      .sort((a, b) => {
        if (statSort === "pts") return b.ppg - a.ppg;
        if (statSort === "reb") return b.rpg - a.rpg;
        if (statSort === "ast") return b.apg - a.apg;
        if (statSort === "stl") return b.spg - a.spg;
        return b.bpg - a.bpg;
      })
      .slice(0, 30);
  }, [league.players, statMode, statSort]);

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
            <div className="px-5 py-4 bg-gradient-to-r from-[#131823] via-[#0e121a] to-[#1a130b] border-b border-white/10 flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#ff963b] text-black flex items-center justify-center shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                      {leagueMeta.name}
                    </h2>
                    <span className="text-xs font-black px-2 py-0.5 rounded bg-[#ff963b]/20 text-[#ff963b] border border-[#ff963b]/35 tabular-nums">
                      {leagueMeta.abbr} · {league.seasonYear}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 tabular-nums">
                    {league.phase === "regular_season"
                      ? `Regular Season Round ${Math.min(82, league.currentRound)} of 82 · Your Club: ${userTeamStanding.city} ${userTeamStanding.name} (${userTeamStanding.wins}-${userTeamStanding.losses})`
                      : league.phase === "playoffs" && league.playoffs
                      ? `Championship Playoffs · ${roundLabels[league.playoffs.currentRound]}`
                      : `Offseason · Champion: ${
                          league.playoffs?.championTeamId
                            ? `${teamById.get(league.playoffs.championTeamId)?.city} ${
                                teamById.get(league.playoffs.championTeamId)?.name
                              }`
                            : "Completed"
                        }`}
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
                <label className="text-[11px] font-bold text-white/55 hidden sm:inline">My Team:</label>
                <select
                  value={league.userTeamId}
                  onChange={(e) => onUpdateLeague({ ...league, userTeamId: e.target.value })}
                  className="bg-black/60 border border-white/15 rounded-lg px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#ff963b]"
                >
                  {leagueTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.city} {t.name} ({t.abbr})
                    </option>
                  ))}
                </select>
                <button
                  onClick={onClose}
                  aria-label="Close League Central"
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/75 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sim Action Strip */}
            <div className="px-5 py-3 bg-black/50 border-b border-white/10 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                {league.phase === "regular_season" && (
                  <>
                    <button
                      onClick={() => onUpdateLeague(simulateRounds(league, 1))}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FastForward className="w-3.5 h-3.5 text-[#ff963b]" />
                      <span>Sim 1 Round</span>
                    </button>
                    <button
                      onClick={() => onUpdateLeague(simulateRounds(league, 7))}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FastForward className="w-3.5 h-3.5 text-[#ff963b]" />
                      <span>Sim Week (7)</span>
                    </button>
                    <button
                      onClick={() => {
                        onUpdateLeague(simulateRemainingRegularSeason(league));
                        setActiveTab("playoffs");
                      }}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#ff963b]/20 hover:bg-[#ff963b]/30 border border-[#ff963b]/40 text-[#ff963b] text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      Sim To Playoffs
                    </button>
                  </>
                )}
                {league.phase === "playoffs" && league.playoffs && league.playoffs.currentRound !== "complete" && (
                  <>
                    <button
                      onClick={() => onUpdateLeague(simulatePlayoffRound(league))}
                      className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#ff963b] hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      Sim Current Playoff Round
                    </button>
                    <button
                      onClick={() => onUpdateLeague(simulateEntirePlayoffs(league))}
                      className="min-h-[38px] px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold cursor-pointer"
                    >
                      Sim To Finals Champion
                    </button>
                  </>
                )}
                {league.phase === "offseason" && (
                  <button
                    onClick={() => {
                      onUpdateLeague(advanceToNextLeagueSeason(league));
                      setActiveTab("standings");
                    }}
                    className="min-h-[40px] px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Start {league.seasonYear + 1} {leagueMeta.abbr} Season</span>
                  </button>
                )}
              </div>

              {nextUserGame && league.phase === "regular_season" && (
                <button
                  onClick={() => {
                    onClose();
                    onPlayMatchup(nextUserGame.homeTeamId, nextUserGame.awayTeamId, false);
                  }}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#ff963b] hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>
                    Play Next: {teamById.get(nextUserGame.awayTeamId)?.abbr} @{" "}
                    {teamById.get(nextUserGame.homeTeamId)?.abbr} (R{nextUserGame.round})
                  </span>
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="px-5 bg-neutral-950 border-b border-white/10 flex gap-1 overflow-x-auto shrink-0">
              {(
                [
                  { id: "standings", label: "Standings", icon: Shield },
                  { id: "schedule", label: "82-Game Schedule", icon: Calendar },
                  { id: "leaders", label: "Player Stats & Career", icon: BarChart3 },
                  { id: "awards", label: "League Awards", icon: Award },
                  { id: "playoffs", label: "Playoff Bracket & History", icon: Crown },
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
            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              {activeTab === "standings" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex gap-2">
                      {(["Eastern", "Western", "Divisions"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setStandingsFilter(f)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase cursor-pointer ${
                            standingsFilter === f
                              ? "bg-[#ff963b] text-black"
                              : "bg-white/5 text-white/70 hover:bg-white/10"
                          }`}
                        >
                          {f === "Divisions" ? "All 4 Divisions" : `${f} Conference`}
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-white/50">Top 8 per conference qualify for {leagueMeta.abbr} Playoffs</span>
                  </div>

                  {standingsFilter !== "Divisions" ? (
                    <div className="overflow-x-auto rounded-xl border border-white/10">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 text-white/55 uppercase">
                          <tr>
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Team</th>
                            <th className="py-2.5 px-2 text-right">W</th>
                            <th className="py-2.5 px-2 text-right">L</th>
                            <th className="py-2.5 px-2 text-right">PCT</th>
                            <th className="py-2.5 px-2 text-right">GB</th>
                            <th className="py-2.5 px-2 text-right">HOME</th>
                            <th className="py-2.5 px-2 text-right">AWAY</th>
                            <th className="py-2.5 px-2 text-right">CONF</th>
                            <th className="py-2.5 px-2 text-right">DIFF</th>
                            <th className="py-2.5 px-2 text-right">L10</th>
                            <th className="py-2.5 px-3 text-right">STRK</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 tabular-nums">
                          {standings
                            .filter((s) => s.conference === standingsFilter)
                            .sort((a, b) => a.confRank - b.confRank)
                            .map((s) => {
                              const isUser = s.teamId === league.userTeamId;
                              return (
                                <tr
                                  key={s.teamId}
                                  className={`${isUser ? "bg-[#ff963b]/15" : "hover:bg-white/5"} ${
                                    s.confRank === 8 ? "border-b-2 border-amber-500/40" : ""
                                  }`}
                                >
                                  <td className="py-2.5 px-3 font-black text-white/75">{s.confRank}</td>
                                  <td className="py-2.5 px-3 font-bold flex items-center gap-2">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: s.primaryColor }}
                                    />
                                    <span>
                                      {s.city} {s.name}
                                    </span>
                                    {s.isDivisionLeader && (
                                      <span className="text-[10px] font-black text-amber-400">DIV</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-2 text-right font-bold">{s.wins}</td>
                                  <td className="py-2.5 px-2 text-right text-white/75">{s.losses}</td>
                                  <td className="py-2.5 px-2 text-right font-bold">
                                    {s.gp > 0 ? s.winPct.toFixed(3).replace(/^0/, "") : ".000"}
                                  </td>
                                  <td className="py-2.5 px-2 text-right text-white/70">
                                    {s.gb === 0 ? "-" : s.gb.toFixed(1)}
                                  </td>
                                  <td className="py-2.5 px-2 text-right text-white/70">
                                    {s.homeWins}-{s.homeLosses}
                                  </td>
                                  <td className="py-2.5 px-2 text-right text-white/70">
                                    {s.awayWins}-{s.awayLosses}
                                  </td>
                                  <td className="py-2.5 px-2 text-right text-white/70">
                                    {s.confWins}-{s.confLosses}
                                  </td>
                                  <td
                                    className={`py-2.5 px-2 text-right font-bold ${
                                      s.diff > 0 ? "text-emerald-400" : s.diff < 0 ? "text-red-400" : "text-white/60"
                                    }`}
                                  >
                                    {s.diff > 0 ? `+${s.diff.toFixed(1)}` : s.diff.toFixed(1)}
                                  </td>
                                  <td className="py-2.5 px-2 text-right text-white/70">
                                    {s.last10Wins}-{s.last10Losses}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold">
                                    {s.streak > 0 ? `W${s.streak}` : s.streak < 0 ? `L${Math.abs(s.streak)}` : "-"}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(["Atlantic", "Central", "Mountain", "Pacific"] as const).map((div) => (
                        <div key={div} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                          <h3 className="text-xs font-black uppercase tracking-wider text-[#ff963b] mb-2">
                            {div} Division
                          </h3>
                          <div className="space-y-1.5 text-xs tabular-nums">
                            {standings
                              .filter((s) => s.division === div)
                              .sort((a, b) => a.divRank - b.divRank)
                              .map((s) => (
                                <div key={s.teamId} className="flex items-center justify-between py-1 px-2 rounded bg-white/5">
                                  <span className="font-bold">
                                    {s.divRank}. {s.city} {s.name}
                                  </span>
                                  <span className="font-black">
                                    {s.wins}-{s.losses} ({s.divWins}-{s.divLosses} DIV)
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "schedule" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-wider">
                      Round {Math.min(82, league.currentRound)} Matchups (820 Regular Season Games Total)
                    </h3>
                    <span className="text-xs text-white/55 tabular-nums">
                      Completed: {league.schedule.filter((g) => g.played).length} / 820
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {upcomingRoundGames.map((g) => {
                      const away = teamById.get(g.awayTeamId);
                      const home = teamById.get(g.homeTeamId);
                      const involvesUser =
                        g.homeTeamId === league.userTeamId || g.awayTeamId === league.userTeamId;
                      return (
                        <div
                          key={g.id}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                            involvesUser ? "bg-[#ff963b]/10 border-[#ff963b]/40" : "bg-white/5 border-white/10"
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="text-xs font-black uppercase truncate">
                              {away?.city} {away?.name} @ {home?.city} {home?.name}
                            </div>
                            <div className="text-[11px] text-white/55 tabular-nums">
                              {g.played
                                ? `Final: ${away?.abbr} ${g.awayScore} - ${home?.abbr} ${g.homeScore}${
                                    g.overtimePeriods > 0 ? ` (${g.overtimePeriods}OT)` : ""
                                  }`
                                : `${home?.arenaName} · Round ${g.round}`}
                            </div>
                          </div>
                          {!g.played && league.phase === "regular_season" && (
                            <button
                              onClick={() => {
                                onClose();
                                onPlayMatchup(g.homeTeamId, g.awayTeamId, false);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#ff963b] hover:bg-amber-400 text-black text-xs font-black uppercase cursor-pointer shrink-0"
                            >
                              Play
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === "leaders" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex gap-2">
                      {(["season", "career"] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setStatMode(m)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase cursor-pointer ${
                            statMode === m ? "bg-[#ff963b] text-black" : "bg-white/5 text-white/70"
                          }`}
                        >
                          {m === "season" ? `${league.seasonYear} Season` : "Career Totals/Avg"}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      {(["pts", "reb", "ast", "stl", "blk"] as const).map((k) => (
                        <button
                          key={k}
                          onClick={() => setStatSort(k)}
                          className={`px-2.5 py-1 rounded text-xs font-bold uppercase cursor-pointer ${
                            statSort === k ? "bg-white text-black" : "bg-white/5 text-white/65"
                          }`}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>

                  {statLeaders.length === 0 ? (
                    <div className="p-8 text-center text-sm text-white/55 border border-white/10 rounded-xl">
                      Simulate at least 1 round to generate official {leagueMeta.abbr} box scores and stat leaders.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-white/10">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 text-white/55 uppercase">
                          <tr>
                            <th className="py-2 px-3">#</th>
                            <th className="py-2 px-3">Player</th>
                            <th className="py-2 px-2">TM</th>
                            <th className="py-2 px-2 text-right">GP</th>
                            <th className="py-2 px-2 text-right">MIN</th>
                            <th className="py-2 px-2 text-right">PTS</th>
                            <th className="py-2 px-2 text-right">REB</th>
                            <th className="py-2 px-2 text-right">AST</th>
                            <th className="py-2 px-2 text-right">STL</th>
                            <th className="py-2 px-2 text-right">BLK</th>
                            <th className="py-2 px-2 text-right">TOV</th>
                            <th className="py-2 px-2 text-right">FG%</th>
                            <th className="py-2 px-2 text-right">3P%</th>
                            <th className="py-2 px-3 text-right">FT%</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 tabular-nums">
                          {statLeaders.map((row, idx) => (
                            <tr key={row.player.id} className="hover:bg-white/5">
                              <td className="py-2 px-3 text-white/55 font-bold">{idx + 1}</td>
                              <td className="py-2 px-3 font-bold">
                                {row.player.name}{" "}
                                <span className="text-[10px] text-white/45">
                                  {row.player.position} · {row.player.ratings.ovr}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-white/70">
                                {teamById.get(row.player.teamId)?.abbr}
                              </td>
                              <td className="py-2 px-2 text-right">{row.gp}</td>
                              <td className="py-2 px-2 text-right text-white/70">{row.minPg.toFixed(1)}</td>
                              <td className="py-2 px-2 text-right font-black text-[#ff963b]">
                                {row.ppg.toFixed(1)}
                              </td>
                              <td className="py-2 px-2 text-right">{row.rpg.toFixed(1)}</td>
                              <td className="py-2 px-2 text-right">{row.apg.toFixed(1)}</td>
                              <td className="py-2 px-2 text-right">{row.spg.toFixed(1)}</td>
                              <td className="py-2 px-2 text-right">{row.bpg.toFixed(1)}</td>
                              <td className="py-2 px-2 text-right text-white/60">{row.tpg.toFixed(1)}</td>
                              <td className="py-2 px-2 text-right">{row.fgPct.toFixed(1)}%</td>
                              <td className="py-2 px-2 text-right">{row.threePct.toFixed(1)}%</td>
                              <td className="py-2 px-3 text-right">{row.ftPct.toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "awards" && (
                <div className="space-y-5">
                  {!liveAwards ? (
                    <div className="p-8 text-center text-sm text-white/55 border border-white/10 rounded-xl">
                      Awards race opens once regular-season games have been played.
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[liveAwards.mvp, liveAwards.dpoy, liveAwards.roy, liveAwards.sixthMan, liveAwards.mip].map(
                          (aw) => (
                            <div
                              key={aw.award}
                              className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-black border border-amber-500/30 space-y-1"
                            >
                              <div className="text-[11px] font-black uppercase tracking-wider text-[#ff963b]">
                                {aw.award}
                              </div>
                              <div className="text-lg font-black text-white">
                                {aw.playerName}{" "}
                                <span className="text-xs text-white/60">({aw.teamAbbr})</span>
                              </div>
                              <div className="text-xs text-white/70 tabular-nums">{aw.statSummary}</div>
                            </div>
                          )
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { title: "All-League 1st Team", list: liveAwards.allLeagueFirst },
                          { title: "All-League 2nd Team", list: liveAwards.allLeagueSecond },
                          { title: "All-Defensive 1st Team", list: liveAwards.allDefensiveFirst },
                        ].map((grp) => (
                          <div key={grp.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-[#ff963b]">
                              {grp.title}
                            </h4>
                            <div className="space-y-1.5 text-xs">
                              {grp.list.map((p) => (
                                <div key={`${grp.title}-${p.playerId}`} className="flex justify-between gap-2">
                                  <span className="font-bold truncate">
                                    {p.position} · {p.playerName}
                                  </span>
                                  <span className="text-white/55 shrink-0">{p.teamAbbr}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { title: "Eastern All-Stars (12)", list: liveAwards.allStarEast },
                          { title: "Western All-Stars (12)", list: liveAwards.allStarWest },
                        ].map((conf) => (
                          <div key={conf.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                            <h4 className="text-xs font-black uppercase tracking-wider text-cyan-300 mb-2">
                              {conf.title}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                              {conf.list.map((p) => (
                                <div key={`as-${p.playerId}`} className="px-2 py-1 rounded bg-white/5 flex justify-between">
                                  <span className="font-bold truncate">{p.playerName}</span>
                                  <span className="text-white/55">{p.teamAbbr}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === "playoffs" && (
                <div className="space-y-6">
                  {!league.playoffs ? (
                    <div className="p-8 text-center space-y-3 border border-white/10 rounded-xl bg-white/[0.02]">
                      <Sparkles className="w-8 h-8 text-[#ff963b] mx-auto" />
                      <div className="text-base font-black uppercase">
                        Regular Season In Progress ({83 - league.currentRound} Rounds Left)
                      </div>
                      <p className="text-xs text-white/60 max-w-md mx-auto">
                        Finish all 82 games or click &ldquo;Sim To Playoffs&rdquo; to lock seeds 1–8 in both conferences
                        and launch Best-of-7 Championship Playoffs.
                      </p>
                    </div>
                  ) : (
                    <>
                      {league.playoffs.championTeamId && (
                        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-black border border-amber-400/50 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Trophy className="w-10 h-10 text-amber-400 shrink-0" />
                            <div>
                              <div className="text-xs font-black uppercase tracking-wider text-amber-300">
                                {leagueMeta.trophyName} Champions ({league.seasonYear})
                              </div>
                              <div className="text-2xl font-black uppercase">
                                {teamById.get(league.playoffs.championTeamId)?.city}{" "}
                                {teamById.get(league.playoffs.championTeamId)?.name}
                              </div>
                              {league.playoffs.finalsMvp && (
                                <div className="text-xs text-white/80 tabular-nums">
                                  Finals MVP: <strong>{league.playoffs.finalsMvp.playerName}</strong> (
                                  {league.playoffs.finalsMvp.ppg} PPG · {league.playoffs.finalsMvp.rpg} RPG ·{" "}
                                  {league.playoffs.finalsMvp.apg} APG)
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {(["finals", "conf_finals", "conf_semis", "conf_first_round"] as const).map((roundCode) => {
                        const list = league.playoffs!.series.filter((s) => s.round === roundCode);
                        if (list.length === 0) return null;
                        return (
                          <div key={roundCode} className="space-y-2.5">
                            <h3 className="text-xs font-black uppercase tracking-wider text-[#ff963b]">
                              {roundLabels[roundCode]} (Best of 7)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {list.map((ser) => {
                                const hi = teamById.get(ser.highSeedTeamId);
                                const lo = teamById.get(ser.lowSeedTeamId);
                                return (
                                  <div
                                    key={ser.id}
                                    className="p-3.5 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-between gap-3"
                                  >
                                    <div className="space-y-1 text-xs min-w-0">
                                      <div className="flex items-center gap-2 font-bold">
                                        <span className="text-white/45 tabular-nums">#{ser.highSeedRank}</span>
                                        <span className={ser.winnerId === ser.highSeedTeamId ? "text-emerald-400" : ""}>
                                          {hi?.city} {hi?.name}
                                        </span>
                                        <span className="font-black text-[#ff963b] tabular-nums">{ser.highSeedWins}</span>
                                      </div>
                                      <div className="flex items-center gap-2 font-bold">
                                        <span className="text-white/45 tabular-nums">#{ser.lowSeedRank}</span>
                                        <span className={ser.winnerId === ser.lowSeedTeamId ? "text-emerald-400" : ""}>
                                          {lo?.city} {lo?.name}
                                        </span>
                                        <span className="font-black text-[#ff963b] tabular-nums">{ser.lowSeedWins}</span>
                                      </div>
                                      {ser.games.length > 0 && (
                                        <div className="text-[10px] text-white/45 truncate tabular-nums">
                                          Last Game: {ser.games[ser.games.length - 1].homeScore}-
                                          {ser.games[ser.games.length - 1].awayScore} ·{" "}
                                          {ser.games[ser.games.length - 1].topScorerName} (
                                          {ser.games[ser.games.length - 1].topScorerPts} PTS)
                                        </div>
                                      )}
                                    </div>
                                    {!ser.winnerId ? (
                                      <div className="flex gap-1.5 shrink-0">
                                        <button
                                          onClick={() => onUpdateLeague(simulatePlayoffGame(league, ser.id))}
                                          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-bold cursor-pointer"
                                        >
                                          Sim Game
                                        </button>
                                        <button
                                          onClick={() => {
                                            onClose();
                                            onPlayMatchup(ser.highSeedTeamId, ser.lowSeedTeamId, true);
                                          }}
                                          className="px-2.5 py-1.5 rounded-lg bg-[#ff963b] text-black text-[11px] font-black cursor-pointer"
                                        >
                                          Play
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] font-black uppercase text-emerald-400 shrink-0">
                                        Advances
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {league.championshipHistory.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-white/10">
                      <h3 className="text-xs font-black uppercase tracking-wider text-white/70">
                        {leagueMeta.abbr} Championship History
                      </h3>
                      <div className="space-y-2">
                        {league.championshipHistory.map((h) => (
                          <div
                            key={h.seasonYear}
                            className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums"
                          >
                            <div>
                              <span className="font-black text-[#ff963b] mr-2">{h.seasonYear}</span>
                              <span className="font-bold text-white">{h.championTeamName}</span>
                              <span className="text-white/55"> def. {h.runnerUpTeamName} ({h.seriesScore})</span>
                            </div>
                            <span className="text-white/70">Finals MVP: {h.finalsMvp.playerName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
