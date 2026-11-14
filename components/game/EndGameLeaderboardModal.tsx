"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Trophy, Globe, Shirt, RotateCcw, Menu, Mic } from "lucide-react";
import type { WorldCity } from "@/lib/worldTour";
import { type CareerStats, calculateLevel } from "@/lib/progression";
import {
  buildEndGameSummaryData,
  type FinalPlayerSummaryRow,
  type TeamTotalsSummary,
} from "@/lib/gameSummary";

interface EndGameLeaderboardModalProps {
  isOpen: boolean;
  scoreHome: number;
  scoreAway: number;
  selectedCity: WorldCity;
  finalStats: FinalPlayerSummaryRow[];
  teamTotals?: {
    home: TeamTotalsSummary;
    away: TeamTotalsSummary;
  } | null;
  lastMatchEarnings: {
    pts: number;
    fgm?: number;
    fga?: number;
    fgPct?: number;
    tov?: number;
    reb: number;
    ast: number;
    stl?: number;
    blk?: number;
    xpGained: number;
    leveledUp: boolean;
    unlocked: unknown[];
  } | null;
  careerStats: CareerStats;
  hasPostgameInterview?: boolean;
  onOpenPostgameInterview?: () => void;
  onRematch: () => void;
  onOpenWorldTour: () => void;
  onOpenLockerRoom: () => void;
  onMainMenu?: () => void;
}

export default function EndGameLeaderboardModal({
  isOpen,
  scoreHome,
  scoreAway,
  selectedCity,
  finalStats,
  teamTotals,
  lastMatchEarnings,
  careerStats,
  hasPostgameInterview = false,
  onOpenPostgameInterview,
  onRematch,
  onOpenWorldTour,
  onOpenLockerRoom,
  onMainMenu,
}: EndGameLeaderboardModalProps) {
  const [teamFilter, setTeamFilter] = useState<"all" | "Home" | "Away">("all");

  if (!isOpen) return null;

  const userWon = scoreHome > scoreAway;
  const isTie = scoreHome === scoreAway;
  const levelInfo = calculateLevel(careerStats.xp);

  const fallbackSummary =
    !teamTotals && finalStats.length > 0
      ? buildEndGameSummaryData(
          finalStats.map((p) => ({
            name: p.name,
            pos: p.pos,
            team: p.team,
            isUser: p.isUser,
            stats: p,
          }))
        )
      : null;

  const homeTotals = teamTotals?.home ?? fallbackSummary?.homeTotals;
  const awayTotals = teamTotals?.away ?? fallbackSummary?.awayTotals;

  const userRow = finalStats.find((p) => p.isUser || p.name === "YOU") || null;
  const userPts = lastMatchEarnings?.pts ?? userRow?.pts ?? 0;
  const userFgm = lastMatchEarnings?.fgm ?? userRow?.fgm ?? 0;
  const userFga = lastMatchEarnings?.fga ?? userRow?.fga ?? 0;
  const userFgPct =
    lastMatchEarnings?.fgPct ??
    userRow?.fgPct ??
    (userFga > 0 ? Math.round((userFgm / userFga) * 1000) / 10 : 0);
  const userTov = lastMatchEarnings?.tov ?? userRow?.tov ?? 0;
  const userReb = lastMatchEarnings?.reb ?? userRow?.reb ?? 0;
  const userAst = lastMatchEarnings?.ast ?? userRow?.ast ?? 0;
  const userStl = lastMatchEarnings?.stl ?? userRow?.stl ?? 0;
  const userBlk = lastMatchEarnings?.blk ?? userRow?.blk ?? 0;

  const visibleRows =
    teamFilter === "all"
      ? finalStats
      : finalStats.filter((row) => row.team === teamFilter);

  const activeTeamSummary =
    teamFilter === "Home"
      ? homeTotals
      : teamFilter === "Away"
      ? awayTotals
      : null;

  return (
    <div className="fixed inset-0 bg-black/92 backdrop-blur-2xl z-[220] flex items-start sm:items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 16 }}
        transition={{ duration: 0.18 }}
        className="relative w-full max-w-5xl bg-[#090b10] border border-white/15 rounded-2xl p-4 sm:p-7 shadow-2xl text-white space-y-5 overflow-hidden max-h-[94dvh] my-auto flex flex-col"
      >
        {/* Header & Final Buzzer Scoreboard */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Trophy className="w-4 h-4 shrink-0" />
              <span>Final Buzzer Summary</span>
              <span aria-hidden="true" className="text-white/30">
                ·
              </span>
              <span className="text-white/70">
                {userWon ? "Home Win" : isTie ? "Draw" : "Road Win"}
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              {userWon ? "Victory at the Buzzer" : isTie ? "Overtime Draw" : "Final Box Score"}
            </h2>
            <p className="text-xs text-white/60">
              {selectedCity.arenaName}
              <span aria-hidden="true" className="mx-1.5 text-white/30">
                ·
              </span>
              {selectedCity.name}, {selectedCity.country}
            </p>
          </div>

          <div className="flex items-center gap-5 sm:gap-7 bg-[#111520] border border-white/10 rounded-xl px-5 py-3 tabular-nums self-start md:self-auto">
            <div className="text-left">
              <div className="text-[11px] font-bold text-red-400">Home Squad</div>
              <div className="text-3xl sm:text-4xl font-black text-white">{scoreHome}</div>
            </div>
            <div className="text-xs font-bold text-white/35">FINAL</div>
            <div className="text-right">
              <div className="text-[11px] font-bold text-sky-400">{selectedCity.teamName}</div>
              <div className="text-3xl sm:text-4xl font-black text-white">{scoreAway}</div>
            </div>
          </div>
        </div>

        {/* Highlighted User Performance Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0 tabular-nums">
          <div className="bg-[#111520] border border-white/10 rounded-xl p-3.5">
            <div className="text-xs text-white/55 font-medium">Points</div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">{userPts}</div>
            <div className="text-[11px] text-white/50 mt-0.5">
              {userRow ? `${userRow.tpm}/${userRow.tpa} 3PT` : "Scoring Total"}
            </div>
          </div>

          <div className="bg-[#111520] border border-white/10 rounded-xl p-3.5">
            <div className="text-xs text-white/55 font-medium">Field Goal %</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
              {userFgPct.toFixed(1)}%
            </div>
            <div className="text-[11px] text-white/50 mt-0.5">
              {userFgm} made · {userFga} att
            </div>
          </div>

          <div className="bg-[#111520] border border-white/10 rounded-xl p-3.5">
            <div className="text-xs text-white/55 font-medium">Turnovers</div>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">{userTov}</div>
            <div className="text-[11px] text-white/50 mt-0.5">
              {userAst} AST · {userStl} STL · {userBlk} BLK
            </div>
          </div>

          <div className="bg-[#111520] border border-amber-400/30 rounded-xl p-3.5">
            <div className="text-xs text-amber-300/80 font-medium">Impact & XP</div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {userReb} <span className="text-sm font-bold text-white/50">REB</span> ·{" "}
              {userAst} <span className="text-sm font-bold text-white/50">AST</span>
            </div>
            <div className="text-[11px] text-amber-300 mt-0.5">
              {lastMatchEarnings ? `+${lastMatchEarnings.xpGained} XP earned` : `Level ${levelInfo.level}`}
              {lastMatchEarnings?.leveledUp ? " · Level Up" : ""}
            </div>
          </div>
        </div>

        {/* Team Shooting & Ball Security Comparison */}
        {homeTotals && awayTotals && (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 px-3.5 py-2.5 rounded-xl bg-[#111520]/80 border border-white/10 text-xs tabular-nums shrink-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-white/55">Home FG%</span>
              <span className="font-bold text-white">
                {homeTotals.fgPct.toFixed(1)}% ({homeTotals.fgm}/{homeTotals.fga})
              </span>
            </div>
            <div className="flex items-center justify-center gap-3 border-x border-white/10 px-2">
              <span className="text-white/55">Turnovers</span>
              <span className="font-bold text-white">
                {homeTotals.tov} – {awayTotals.tov}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-white/55">Away FG%</span>
              <span className="font-bold text-white">
                {awayTotals.fgPct.toFixed(1)}% ({awayTotals.fgm}/{awayTotals.fga})
              </span>
            </div>
          </div>
        )}

        {/* Team Filter Tabs + Full Box Score Table */}
        <div className="flex flex-col flex-1 min-h-0 space-y-2.5">
          <div className="flex items-center justify-between gap-3 shrink-0">
            <h3 className="text-sm font-bold text-white/90">Player Box Score</h3>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#111520] border border-white/10">
              {(
                [
                  { id: "all", label: "All Players" },
                  { id: "Home", label: "Home" },
                  { id: "Away", label: "Away" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTeamFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    teamFilter === tab.id
                      ? "bg-amber-400 text-black"
                      : "text-white/65 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#111520] border border-white/10 rounded-xl overflow-auto flex-1 min-h-[180px]">
            <table className="w-full min-w-[660px] text-left border-collapse tabular-nums">
              <thead className="sticky top-0 bg-[#161b29] border-b border-white/10 text-[11px] font-bold text-white/60">
                <tr>
                  <th className="py-2.5 px-3">Player</th>
                  <th className="py-2.5 px-2 text-center">Team</th>
                  <th className="py-2.5 px-2 text-right">PTS</th>
                  <th className="py-2.5 px-2 text-right">FG</th>
                  <th className="py-2.5 px-2 text-right">FG%</th>
                  <th className="py-2.5 px-2 text-right">3P</th>
                  <th className="py-2.5 px-2 text-right">REB</th>
                  <th className="py-2.5 px-2 text-right">AST</th>
                  <th className="py-2.5 px-2 text-right">STL</th>
                  <th className="py-2.5 px-2 text-right">BLK</th>
                  <th className="py-2.5 px-2 text-right">TOV</th>
                  <th className="py-2.5 px-3 text-right">PF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {visibleRows.map((p, idx) => {
                  const isMe = p.isUser || p.name === "YOU";
                  return (
                    <tr
                      key={`${p.team}-${p.name}-${idx}`}
                      className={isMe ? "bg-amber-500/12" : "hover:bg-white/[0.03]"}
                    >
                      <td className="py-2.5 px-3 font-semibold text-white">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate max-w-[175px]">{p.name}</span>
                          <span className="text-[11px] font-medium text-white/45 shrink-0">
                            {p.pos || "G"}
                          </span>
                          {isMe && (
                            <span className="text-[11px] font-bold text-amber-400 shrink-0">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center text-white/65">{p.team}</td>
                      <td className="py-2.5 px-2 text-right font-bold text-amber-400">{p.pts}</td>
                      <td className="py-2.5 px-2 text-right text-white/85">
                        {p.fgm ?? 0}-{p.fga ?? 0}
                      </td>
                      <td className="py-2.5 px-2 text-right font-semibold text-emerald-400">
                        {(p.fgPct ?? 0).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-2 text-right text-white/75">
                        {p.tpm ?? 0}-{p.tpa ?? 0}
                      </td>
                      <td className="py-2.5 px-2 text-right text-sky-300">{p.reb}</td>
                      <td className="py-2.5 px-2 text-right text-emerald-300">{p.ast}</td>
                      <td className="py-2.5 px-2 text-right text-white/80">{p.stl ?? 0}</td>
                      <td className="py-2.5 px-2 text-right text-white/80">{p.blk ?? 0}</td>
                      <td className="py-2.5 px-2 text-right font-semibold text-rose-400">
                        {p.tov ?? 0}
                      </td>
                      <td className="py-2.5 px-3 text-right text-white/65">{p.fouls}</td>
                    </tr>
                  );
                })}
                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={12} className="py-6 text-center text-xs text-white/50">
                      No player statistics recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
              {activeTeamSummary && (
                <tfoot className="bg-[#161b29] border-t border-white/15 text-xs font-bold text-white">
                  <tr>
                    <td className="py-2.5 px-3">{activeTeamSummary.team} Team Totals</td>
                    <td className="py-2.5 px-2 text-center text-white/50">—</td>
                    <td className="py-2.5 px-2 text-right text-amber-400">
                      {activeTeamSummary.pts}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      {activeTeamSummary.fgm}-{activeTeamSummary.fga}
                    </td>
                    <td className="py-2.5 px-2 text-right text-emerald-400">
                      {activeTeamSummary.fgPct.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      {activeTeamSummary.tpm}-{activeTeamSummary.tpa}
                    </td>
                    <td className="py-2.5 px-2 text-right text-sky-300">
                      {activeTeamSummary.reb}
                    </td>
                    <td className="py-2.5 px-2 text-right text-emerald-300">
                      {activeTeamSummary.ast}
                    </td>
                    <td className="py-2.5 px-2 text-right">{activeTeamSummary.stl}</td>
                    <td className="py-2.5 px-2 text-right">{activeTeamSummary.blk}</td>
                    <td className="py-2.5 px-2 text-right text-rose-400">
                      {activeTeamSummary.tov}
                    </td>
                    <td className="py-2.5 px-3 text-right text-white/75">
                      {activeTeamSummary.fouls}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1 shrink-0">
          {hasPostgameInterview && onOpenPostgameInterview && (
            <button
              type="button"
              onClick={onOpenPostgameInterview}
              className="min-h-[44px] px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Mic className="w-4 h-4 text-amber-400" />
              <span>Postgame Interview</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenLockerRoom}
            className="min-h-[44px] px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Shirt className="w-4 h-4 text-amber-400" />
            <span>Locker (Lvl {levelInfo.level})</span>
          </button>

          <button
            type="button"
            onClick={onOpenWorldTour}
            className="min-h-[44px] px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span>World Tour</span>
          </button>

          {onMainMenu && (
            <button
              type="button"
              onClick={onMainMenu}
              className="min-h-[44px] px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-white/15 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Menu className="w-4 h-4 text-white/80" />
              <span>Main Menu</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRematch}
            className="min-h-[44px] px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rematch</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
