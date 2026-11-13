"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Trophy,
  X,
  Play,
  FastForward,
  Flame,
  Target,
  Award,
  Mic,
  CheckCircle2,
  Users,
} from "lucide-react";
import type { ProLeagueDivision } from "@/lib/leagueData";
import type { AthleteProfile } from "@/lib/athleteProfile";
import {
  AllStarWeekendState,
  getAllStarRosters,
  recordAllStarGameResult,
  simulateAllStarDunkContest,
  simulateAllStarThreePointContest,
} from "@/lib/allStarEngine";

interface AllStarWeekendModalProps {
  isOpen: boolean;
  onClose: () => void;
  division: ProLeagueDivision;
  onChangeDivision: (div: ProLeagueDivision) => void;
  allStarState: AllStarWeekendState;
  onUpdateAllStar: (next: AllStarWeekendState) => void;
  athleteProfile: AthleteProfile;
  onPlayAllStarGame: (division: ProLeagueDivision) => void;
  onLaunchThreePointDrill: (division: ProLeagueDivision) => void;
  onLaunchDunkDrill: (division: ProLeagueDivision) => void;
}

type TabId = "overview" | "threepoint" | "dunk" | "trophies";

export default function AllStarWeekendModal({
  isOpen,
  onClose,
  division,
  onChangeDivision,
  allStarState,
  onUpdateAllStar,
  athleteProfile,
  onPlayAllStarGame,
  onLaunchThreePointDrill,
  onLaunchDunkDrill,
}: AllStarWeekendModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showIntros, setShowIntros] = useState(false);

  const rosters = getAllStarRosters(division);
  const leagueAbbr = division === "womens" ? "WPBA" : "APBA";
  const leagueTitle =
    division === "womens"
      ? "Women's Pro All-Star Weekend"
      : "Men's Pro All-Star Weekend";
  const userFullName = `${athleteProfile.firstName} ${athleteProfile.lastName}`;
  const userTeamAbbr = division === "womens" ? "WPB" : "APB";

  const handleSimAllStarGame = () => {
    const eastScore = 118 + Math.floor(Math.random() * 24);
    const westScore = 116 + Math.floor(Math.random() * 24);
    const winnerList = eastScore >= westScore ? rosters.east : rosters.west;
    const mvp = winnerList[0];
    onUpdateAllStar(
      recordAllStarGameResult(allStarState, eastScore, westScore, mvp.name)
    );
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
            className="w-full max-w-5xl bg-[#080a0f] border border-amber-400/30 rounded-2xl shadow-2xl text-white flex flex-col max-h-[92dvh] my-auto overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#211509] via-[#0e121a] to-[#0d1926] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-black flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight">
                      {leagueTitle}
                    </h2>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 tabular-nums">
                      {leagueAbbr} · {allStarState.seasonYear}
                    </span>
                  </div>
                  <p className="text-xs text-white/60">
                    All-Star Showcase Game, 3-Point Shootout, Dunk &amp; Aerial Contest &amp; MVP Awards
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Men's / Women's Division Toggle */}
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
                      className={`min-h-[36px] px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider cursor-pointer transition-colors ${
                        division === d.id
                          ? "bg-[#ff963b] text-black"
                          : "text-white/65 hover:text-white"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close All-Star Weekend"
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/75 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-5 bg-neutral-950 border-b border-white/10 flex gap-1 overflow-x-auto shrink-0">
              {(
                [
                  { id: "overview", label: "All-Star Game & Intros", icon: Users },
                  { id: "threepoint", label: "3-Point Shootout", icon: Target },
                  { id: "dunk", label: "Dunk & Aerial Contest", icon: Flame },
                  { id: "trophies", label: `MVP & Trophies (${allStarState.trophies.length})`, icon: Trophy },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
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

            {/* Content */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              {activeTab === "overview" && (
                <div className="space-y-5">
                  {/* Main Showcase Banner */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-[#ff963b]/15 via-black/70 to-cyan-500/15 border border-white/15 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-[11px] font-black uppercase tracking-widest text-[#ff963b]">
                        Main Event · 5v5 {leagueAbbr} Showcase
                      </div>
                      <div className="text-xl sm:text-2xl font-black uppercase">
                        {allStarState.eastTeamName} vs. {allStarState.westTeamName}
                      </div>
                      {allStarState.gamePlayed ? (
                        <div className="text-xs text-emerald-300 font-bold tabular-nums">
                          Final Result: East {allStarState.eastScore} – {allStarState.westScore} West · All-Star MVP:{" "}
                          <span className="text-white">{allStarState.gameMvp}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-white/65">
                          Tip off on center stage with full pregame player introductions or simulate for MVP honors.
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowIntros((v) => !v);
                          if (!allStarState.introsPresented) {
                            onUpdateAllStar({ ...allStarState, introsPresented: true });
                          }
                        }}
                        className={`min-h-[42px] px-3.5 py-2 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${
                          showIntros || allStarState.introsPresented
                            ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                            : "bg-white/10 hover:bg-white/15 border-white/15 text-white"
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>{showIntros ? "Hide Intros" : "Player Introductions"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSimAllStarGame}
                        className="min-h-[42px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                      >
                        <FastForward className="w-3.5 h-3.5 text-[#ff963b]" />
                        <span>Sim All-Star Game</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onPlayAllStarGame(division);
                        }}
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-[#ff963b] hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-black" />
                        <span>Play All-Star Game</span>
                      </button>
                    </div>
                  </div>

                  {/* Player Introductions Spotlight Card */}
                  {showIntros && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/60 to-black border border-cyan-400/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                          <Mic className="w-4 h-4" /> Arena P.A. Lineup Introductions
                        </span>
                        <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Spotlight Active
                        </span>
                      </div>
                      <p className="text-xs text-white/80 leading-relaxed">
                        &ldquo;Ladies and gentlemen, welcome to {allStarState.seasonYear} {leagueAbbr} All-Star Weekend!
                        Representing the East, led by {rosters.east[0].name} ({rosters.east[0].teamAbbr}) and{" "}
                        {rosters.east[1].name}, facing the West headlined by {rosters.west[0].name} (
                        {rosters.west[0].teamAbbr}) and special guest MyPlayer <strong className="text-[#ff963b]">{userFullName}</strong>!&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Starting Lineups */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: `${allStarState.eastTeamName} Lineup`, color: "text-[#ff963b]", list: rosters.east },
                      { title: `${allStarState.westTeamName} Lineup`, color: "text-cyan-300", list: rosters.west },
                    ].map((conf) => (
                      <div key={conf.title} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
                        <h3 className={`text-xs font-black uppercase tracking-wider ${conf.color}`}>
                          {conf.title}
                        </h3>
                        <div className="space-y-1.5">
                          {conf.list.map((p, i) => (
                            <div
                              key={p.id}
                              className="px-3 py-2 rounded-lg bg-black/50 border border-white/5 flex items-center justify-between text-xs tabular-nums"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] font-black text-white/45 w-4">{i + 1}</span>
                                <span className="font-bold truncate">{p.name}</span>
                                <span className="text-[10px] text-white/50">{p.teamAbbr}</span>
                              </div>
                              <span className="text-[11px] font-black text-amber-300 shrink-0">
                                {p.position} · {p.rating} OVR
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "threepoint" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-black uppercase">{leagueAbbr} Three-Point Contest</div>
                      <div className="text-xs text-white/60">
                        {allStarState.threePointCompleted && allStarState.threePointChampion
                          ? `Reigning Champion: ${allStarState.threePointChampion}`
                          : "Compete in live 3D shooting or simulate the bracket with your custom player."}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateAllStar(
                            simulateAllStarThreePointContest(allStarState, {
                              name: userFullName,
                              teamAbbr: userTeamAbbr,
                            })
                          )
                        }
                        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold uppercase cursor-pointer"
                      >
                        Sim Contest
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onLaunchThreePointDrill(division);
                        }}
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-[#ff963b] hover:bg-amber-400 text-black text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>Play 3D 3-Point Contest</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allStarState.threePointLeaderboard.map((c, idx) => (
                      <div
                        key={c.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between text-xs tabular-nums ${
                          idx === 0 && allStarState.threePointCompleted
                            ? "bg-amber-500/15 border-amber-400/50"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div>
                          <div className="font-black text-sm">
                            #{idx + 1} {c.name} {c.isUser ? "(YOU)" : ""}
                          </div>
                          <div className="text-white/55">
                            {c.teamAbbr} · {c.position} · {c.rating} OVR
                          </div>
                        </div>
                        <div className="text-lg font-black text-[#ff963b]">
                          {allStarState.threePointCompleted ? `${c.score} PTS` : "Ready"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "dunk" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-black uppercase">
                        {leagueAbbr} Slam Dunk &amp; Aerial Competition
                      </div>
                      <div className="text-xs text-white/60">
                        {allStarState.dunkCompleted && allStarState.dunkChampion
                          ? `Reigning Champion: ${allStarState.dunkChampion}`
                          : "Take flight in 3D or simulate 2-round judges scoring."}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateAllStar(
                            simulateAllStarDunkContest(allStarState, {
                              name: userFullName,
                              teamAbbr: userTeamAbbr,
                            })
                          )
                        }
                        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold uppercase cursor-pointer"
                      >
                        Sim Contest
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onLaunchDunkDrill(division);
                        }}
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-[#ff963b] hover:bg-amber-400 text-black text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>Play 3D Dunk Contest</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allStarState.dunkLeaderboard.map((c, idx) => (
                      <div
                        key={c.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between text-xs tabular-nums ${
                          idx === 0 && allStarState.dunkCompleted
                            ? "bg-amber-500/15 border-amber-400/50"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div>
                          <div className="font-black text-sm">
                            #{idx + 1} {c.name} {c.isUser ? "(YOU)" : ""}
                          </div>
                          <div className="text-white/55">
                            {c.teamAbbr} · {c.position} · {c.rating} OVR
                          </div>
                        </div>
                        <div className="text-lg font-black text-[#ff963b]">
                          {allStarState.dunkCompleted ? `${c.score}/100` : "Ready"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "trophies" && (
                <div className="space-y-3">
                  {allStarState.trophies.length === 0 ? (
                    <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center text-sm text-white/60">
                      Complete or simulate All-Star events in {leagueAbbr} to collect MVP &amp; Contest trophies.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {allStarState.trophies.map((t) => (
                        <div
                          key={t.id}
                          className="p-4 rounded-xl bg-gradient-to-br from-amber-500/15 to-black border border-amber-400/40 flex items-center gap-3"
                        >
                          <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                            <Award className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                              {t.division === "womens" ? "WPBA" : "APBA"} {t.seasonYear} · {t.event}
                            </div>
                            <div className="text-base font-black truncate">{t.winnerName}</div>
                            <div className="text-xs text-white/65 tabular-nums">{t.scoreSummary}</div>
                          </div>
                        </div>
                      ))}
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
