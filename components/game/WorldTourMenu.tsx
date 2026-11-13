"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  MapPin,
  Search,
  Trophy,
  Play,
  X,
  Compass,
  Sparkles,
  ChevronRight,
  Shield,
  Flame,
} from "lucide-react";
import {
  WORLD_CITIES,
  WorldCity,
  REGIONS_META,
  GLOBAL_LEADERS_BASE,
  GlobalLeaderEntry,
  GLOBAL_TOURNAMENTS,
  WorldTourTournamentState,
  createTournamentBracket,
  simulateRemainingTournamentRound,
  getCityById,
} from "@/lib/worldTour";
import { CareerStats, getDefaultCareerStats, loadCareerStats } from "@/lib/progression";
import { AthleteProfile, getDefaultAthleteProfile, loadAthleteProfile } from "@/lib/athleteProfile";

interface WorldTourMenuProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: WorldCity;
  onSelectCity: (city: WorldCity) => void;
  onStartMatch: (city: WorldCity) => void;
  tournamentState?: WorldTourTournamentState;
  onUpdateTournament?: (next: WorldTourTournamentState) => void;
  onStartCupMatch?: (homeCity: WorldCity, awayCity: WorldCity, matchId: string) => void;
}

export default function WorldTourMenu({
  isOpen,
  onClose,
  selectedCity,
  onSelectCity,
  onStartMatch,
  tournamentState,
  onUpdateTournament,
  onStartCupMatch,
}: WorldTourMenuProps) {
  const [activeRegion, setActiveRegion] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [previewCity, setPreviewCity] = useState<WorldCity>(selectedCity);
  const [viewMode, setViewMode] = useState<"arenas" | "leaders" | "tournaments">("arenas");
  const [leaderCategory, setLeaderCategory] = useState<"pts" | "reb" | "ast">("pts");
  const [careerStats, setCareerStats] = useState<CareerStats>(getDefaultCareerStats);
  const [athleteProfile, setAthleteProfile] = useState<AthleteProfile>(getDefaultAthleteProfile);
  const [localCup, setLocalCup] = useState<WorldTourTournamentState>(() =>
    createTournamentBracket("cup_global_nations", selectedCity.id)
  );
  const activeCup = tournamentState || localCup;
  const setCupState = (next: WorldTourTournamentState) => {
    setLocalCup(next);
    onUpdateTournament?.(next);
  };

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        setPreviewCity(selectedCity);
        setCareerStats(loadCareerStats());
        setAthleteProfile(loadAthleteProfile());
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedCity]);

  const allLeaders = useMemo(() => {
    const fullName = `${athleteProfile.firstName} ${athleteProfile.lastName}`.trim() || "MY PLAYER";
    const userEntry: GlobalLeaderEntry = {
      rank: 0,
      name: fullName,
      jerseyNumber: `#${athleteProfile.jerseyNumber || "23"}`,
      city: selectedCity.name,
      country: selectedCity.country,
      flag: selectedCity.flag,
      pts: careerStats.careerPts,
      reb: careerStats.careerReb,
      ast: careerStats.careerAst,
      ppg:
        careerStats.matchesPlayed > 0
          ? Number((careerStats.careerPts / careerStats.matchesPlayed).toFixed(1))
          : careerStats.careerPts,
      isUser: true,
    };
    const combined = [...GLOBAL_LEADERS_BASE, userEntry];
    if (leaderCategory === "reb") {
      return combined.sort((a, b) => b.reb - a.reb).map((e, i) => ({ ...e, rank: i + 1 }));
    } else if (leaderCategory === "ast") {
      return combined.sort((a, b) => b.ast - a.ast).map((e, i) => ({ ...e, rank: i + 1 }));
    } else {
      return combined.sort((a, b) => b.pts - a.pts).map((e, i) => ({ ...e, rank: i + 1 }));
    }
  }, [leaderCategory, careerStats, athleteProfile, selectedCity]);

  const filteredCities = useMemo(() => {
    return WORLD_CITIES.filter((city) => {
      const matchesRegion = activeRegion === "all" || city.region === activeRegion;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        city.name.toLowerCase().includes(q) ||
        city.country.toLowerCase().includes(q) ||
        city.teamName.toLowerCase().includes(q) ||
        city.arenaName.toLowerCase().includes(q);
      return matchesRegion && matchesSearch;
    });
  }, [activeRegion, searchQuery]);

  // Convert lat/lng to SVG map coordinates (simple equirectangular projection)
  const getMapCoords = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 500;
    return { x, y };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[170] flex items-start sm:items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-6xl bg-neutral-950 border border-cyan-500/30 rounded-3xl shadow-[0_0_90px_rgba(6,182,212,0.2)] overflow-hidden text-white flex flex-col max-h-[92dvh] my-auto"
          >
          {/* Header */}
          <div className="relative px-6 py-4 bg-gradient-to-r from-amber-950/80 via-neutral-900 to-cyan-950/80 border-b border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center text-black font-black text-lg shadow-lg shadow-amber-500/30 border border-yellow-200">
                WT
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight text-white flex items-center gap-2">
                    <span>WORLD TOUR 2.0</span>
                  </h2>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-md tracking-wider">
                    INTERNATIONAL CUPS
                  </span>
                </div>
                <p className="text-xs text-white/60 font-semibold tracking-wide">
                  28 Global Host Clubs, Knockout Cup Tournaments & Real-Time World Leaderboards
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                aria-label="Close World Tour"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-95 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Interactive World Map SVG Banner */}
          <div className="relative h-44 sm:h-56 bg-gradient-to-b from-blue-950/40 via-neutral-950 to-neutral-950 border-b border-white/10 overflow-hidden shrink-0">
            <svg
              viewBox="0 0 1000 500"
              className="w-full h-full object-cover opacity-60"
            >
              {/* Simplified world map continent paths */}
              <defs>
                <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect width="1000" height="500" fill="#080d1a" />
              <circle cx="500" cy="250" r="300" fill="url(#mapGlow)" />

              {/* Grid lines */}
              {[100, 200, 300, 400].map((y) => (
                <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#ffffff" strokeOpacity="0.05" strokeDasharray="4 4" />
              ))}
              {[200, 400, 600, 800].map((x) => (
                <line key={x} x1={x} y1="0" x2={x} y2="500" stroke="#ffffff" strokeOpacity="0.05" strokeDasharray="4 4" />
              ))}

              {/* Continent Outlines (Abstracted) */}
              {/* North America */}
              <path d="M120 80 Q 200 60, 280 100 T 260 220 T 180 230 T 140 160 Z" fill="#1e293b" opacity="0.6" />
              {/* South America */}
              <path d="M260 260 Q 320 280, 340 360 T 280 460 T 240 340 Z" fill="#1e293b" opacity="0.6" />
              {/* Europe */}
              <path d="M480 80 Q 560 90, 580 140 T 490 190 T 450 120 Z" fill="#1e293b" opacity="0.6" />
              {/* Africa */}
              <path d="M460 200 Q 560 220, 580 320 T 520 440 T 440 300 Z" fill="#1e293b" opacity="0.6" />
              {/* Asia */}
              <path d="M600 80 Q 750 90, 850 160 T 780 280 T 640 220 Z" fill="#1e293b" opacity="0.6" />
              {/* Australia */}
              <path d="M780 340 Q 880 340, 880 410 T 800 440 Z" fill="#1e293b" opacity="0.6" />

              {/* City Pins */}
              {WORLD_CITIES.map((city) => {
                const { x, y } = getMapCoords(city.lat, city.lng);
                const isSelected = previewCity.id === city.id;
                return (
                  <g
                    key={city.id}
                    onClick={() => setPreviewCity(city)}
                    className="cursor-pointer transition-transform hover:scale-125"
                  >
                    {isSelected && (
                      <circle cx={x} cy={y} r="13" fill="#06b6d4" fillOpacity="0.28" />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? "6" : "3.5"}
                      fill={isSelected ? "#38bdf8" : city.jerseyPrimary}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? "2" : "1"}
                    />
                    {isSelected && (
                      <text
                        x={x}
                        y={y - 10}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                        className="pointer-events-none drop-shadow"
                      >
                        {city.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Overlay Banner Bar */}
            <div className="absolute bottom-2.5 left-3 right-3 flex flex-wrap items-center justify-between gap-1.5 text-[10px] sm:text-xs font-bold text-white/80 pointer-events-none">
              <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
                <span>28 Global Host Arenas</span>
              </span>
              <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-cyan-300 truncate max-w-full">
                Selected: {previewCity.flag} {previewCity.name} ({previewCity.teamName})
              </span>
            </div>
          </div>

          {/* View Mode Tab Switcher */}
          <div className="px-6 py-3 bg-neutral-900 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("arenas")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  viewMode === "arenas"
                    ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/30"
                    : "bg-white/5 hover:bg-white/10 text-white/70"
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>World Arenas ({WORLD_CITIES.length})</span>
              </button>
              <button
                onClick={() => setViewMode("tournaments")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  viewMode === "tournaments"
                    ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30"
                    : "bg-white/5 hover:bg-white/10 text-white/70"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Cup Tournaments ({activeCup.trophiesWon.length})</span>
              </button>
              <button
                onClick={() => setViewMode("leaders")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  viewMode === "leaders"
                    ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                    : "bg-white/5 hover:bg-white/10 text-white/70"
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Global Leaders</span>
              </button>
            </div>

            {viewMode === "leaders" && (
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setLeaderCategory("pts")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                    leaderCategory === "pts" ? "bg-amber-400 text-black" : "text-white/60 hover:text-white"
                  }`}
                >
                  Top Scorers (PTS)
                </button>
                <button
                  onClick={() => setLeaderCategory("reb")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                    leaderCategory === "reb" ? "bg-amber-400 text-black" : "text-white/60 hover:text-white"
                  }`}
                >
                  Top Rebounders (REB)
                </button>
                <button
                  onClick={() => setLeaderCategory("ast")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                    leaderCategory === "ast" ? "bg-amber-400 text-black" : "text-white/60 hover:text-white"
                  }`}
                >
                  Top Playmakers (AST)
                </button>
              </div>
            )}
          </div>

          {viewMode === "tournaments" ? (
            <div className="p-6 overflow-y-auto flex-1 space-y-5 max-h-[62vh]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {GLOBAL_TOURNAMENTS.map((cup) => (
                    <button
                      key={cup.id}
                      onClick={() =>
                        setCupState(
                          createTournamentBracket(cup.id, previewCity.id, activeCup.trophiesWon)
                        )
                      }
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase border cursor-pointer ${
                        activeCup.activeTournamentId === cup.id
                          ? "bg-emerald-500 text-black border-emerald-300"
                          : "bg-white/5 text-white/75 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {cup.name}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {!activeCup.championCityId ? (
                    <button
                      onClick={() => setCupState(simulateRemainingTournamentRound(activeCup))}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase cursor-pointer"
                    >
                      Simulate Round
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        setCupState(
                          createTournamentBracket(
                            activeCup.activeTournamentId,
                            previewCity.id,
                            activeCup.trophiesWon
                          )
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black uppercase cursor-pointer"
                    >
                      Start New Cup
                    </button>
                  )}
                </div>
              </div>

              {activeCup.championCityId && (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-7 h-7 text-amber-400" />
                    <div>
                      <div className="text-[10px] font-black uppercase text-amber-300">
                        Tournament Champion
                      </div>
                      <div className="text-base font-black text-white">
                        {getCityById(activeCup.championCityId).flag}{" "}
                        {getCityById(activeCup.championCityId).teamName}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-amber-200">
                    {GLOBAL_TOURNAMENTS.find((c) => c.id === activeCup.activeTournamentId)?.trophyName}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["quarterfinal", "semifinal", "final"] as const).map((rndName) => {
                  const rndMatches = activeCup.matches.filter((m) => m.round === rndName);
                  return (
                    <div key={rndName} className="space-y-3">
                      <div className="text-[11px] font-black uppercase tracking-widest text-white/50">
                        {rndName === "quarterfinal"
                          ? "Quarterfinals"
                          : rndName === "semifinal"
                          ? "Semifinals"
                          : "Championship Final"}
                      </div>
                      {rndMatches.map((m) => {
                        const homeC = m.homeCityId ? getCityById(m.homeCityId) : null;
                        const awayC = m.awayCityId ? getCityById(m.awayCityId) : null;
                        const involvesUser =
                          m.homeCityId === activeCup.userCityId || m.awayCityId === activeCup.userCityId;
                        const canPlay = !m.winnerCityId && homeC && awayC && involvesUser;
                        return (
                          <div
                            key={m.id}
                            className={`p-3.5 rounded-xl border space-y-2 ${
                              involvesUser
                                ? "bg-cyan-500/10 border-cyan-400/40"
                                : "bg-white/5 border-white/10"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="truncate">
                                {homeC ? `${homeC.flag} ${homeC.teamName}` : "TBD"}
                              </span>
                              <span className="tabular-nums text-amber-300">
                                {m.winnerCityId ? m.homeScore : "—"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="truncate">
                                {awayC ? `${awayC.flag} ${awayC.teamName}` : "TBD"}
                              </span>
                              <span className="tabular-nums text-amber-300">
                                {m.winnerCityId ? m.awayScore : "—"}
                              </span>
                            </div>
                            {canPlay && homeC && awayC && (
                              <button
                                onClick={() => {
                                  if (onStartCupMatch) {
                                    onStartCupMatch(homeC, awayC, m.id);
                                  } else {
                                    onStartMatch(awayC.id === activeCup.userCityId ? homeC : awayC);
                                  }
                                  onClose();
                                }}
                                className="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5 fill-black" />
                                <span>Tip-Off Cup Match</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : viewMode === "leaders" ? (
            <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[62vh]">
              <div className="bg-gradient-to-r from-amber-500/10 via-neutral-900 to-amber-500/10 border border-amber-500/30 rounded-3xl p-6 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
                  <Trophy className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black italic uppercase text-white">Global Basketball Leaders</h3>
                <p className="text-xs text-white/50 max-w-xl mx-auto">
                  Tracking elite career points, rebounds, and assists from matches played across arenas worldwide. Your franchise career stats are updated in real time.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="grid grid-cols-6 gap-4 p-4 bg-white/10 text-[10px] font-black uppercase tracking-widest opacity-60">
                  <div className="text-center">Rank</div>
                  <div className="col-span-2 text-left">Player & Franchise</div>
                  <div className="text-center">PTS</div>
                  <div className="text-center">REB</div>
                  <div className="text-center">AST</div>
                </div>
                <div className="divide-y divide-white/5">
                  {allLeaders.map((leader, i) => (
                    <div
                      key={i}
                      className={`grid grid-cols-6 gap-4 p-4 items-center transition-colors ${
                        leader.isUser ? "bg-amber-500/25 border-l-4 border-amber-400" : i < 3 ? "bg-white/5" : "hover:bg-white/5"
                      }`}
                    >
                      <div className="text-center font-black text-lg">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${leader.rank}`}
                      </div>
                      <div className="col-span-2 flex items-center gap-3 text-left">
                        <span className="text-2xl">{leader.flag}</span>
                        <div>
                          <div className="font-black text-sm text-white flex items-center gap-1.5">
                            <span>{leader.name}</span>
                            <span className="text-[10px] font-bold text-amber-400/90 px-1.5 py-0.2 rounded bg-white/5 border border-white/10">
                              {leader.jerseyNumber}
                            </span>
                            {leader.isUser && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-black">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-white/50">{leader.city}, {leader.country}</div>
                        </div>
                      </div>
                      <div className="text-center font-black text-lg text-amber-400 tabular-nums">{leader.pts}</div>
                      <div className="text-center font-black text-lg text-cyan-400 tabular-nums">{leader.reb}</div>
                      <div className="text-center font-black text-lg text-emerald-400 tabular-nums">{leader.ast}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Search & Region Filter Bar */}
              <div className="px-6 py-3 bg-black/60 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
                {/* Search Box */}
                <div className="relative min-w-[220px] max-w-sm flex-1">
                  <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search city, country, or team..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>

                {/* Region Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
                  {REGIONS_META.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setActiveRegion(r.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        activeRegion === r.id
                          ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                          : "bg-white/5 hover:bg-white/10 text-white/70"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

          {/* Main Content Area: Cities Grid & Active City Preview Panel */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 min-h-0">
            {/* Left 2 Cols: City Cards Grid */}
            <div className="lg:col-span-2 space-y-3">
              {filteredCities.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                  <div className="text-sm font-bold text-white/70">No host arenas matched &ldquo;{searchQuery}&rdquo;.</div>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveRegion("all");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black text-xs font-black uppercase cursor-pointer"
                  >
                    Show All 28 Arenas
                  </button>
                </div>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredCities.map((city) => {
                  const isCurrent = previewCity.id === city.id;
                  const isActiveCourt = selectedCity.id === city.id;

                  return (
                    <div
                      key={city.id}
                      onClick={() => setPreviewCity(city)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                        isCurrent
                          ? "bg-gradient-to-br from-cyan-950/60 to-black border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                          : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{city.flag}</span>
                          <div>
                            <div className="font-black text-sm text-white flex items-center gap-1.5">
                              <span>{city.name}</span>
                              {isActiveCourt && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500 text-black">
                                  Current Court
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-white/50">{city.country}</div>
                          </div>
                        </div>

                        {/* Uniform Colorway Swatches */}
                        <div className="flex items-center gap-1 shrink-0">
                          <div
                            className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
                            style={{ backgroundColor: city.jerseyPrimary }}
                            title="Jersey Primary"
                          />
                          <div
                            className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
                            style={{ backgroundColor: city.jerseySecondary }}
                            title="Jersey Accent"
                          />
                          <div
                            className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
                            style={{ backgroundColor: city.shortsColor }}
                            title="Shorts"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 mt-1">
                        <div className="text-xs font-bold text-cyan-300 truncate">{city.teamName}</div>
                        <div className="text-[10px] text-white/40 truncate">{city.arenaName}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>

            {/* Right 1 Col: Selected City Detail / Tip-Off Card */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{previewCity.flag}</span>
                    <div>
                      <h3 className="text-lg font-black uppercase text-white leading-tight">
                        {previewCity.name}
                      </h3>
                      <span className="text-xs text-white/50 font-bold">{previewCity.country}</span>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20">
                    {previewCity.regionName}
                  </span>
                </div>

                {/* Team & Jersey Design Preview */}
                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 mb-4 space-y-3">
                  <div className="text-[10px] font-bold uppercase text-white/40 tracking-wider">
                    Official Franchise & Uniform
                  </div>
                  <div className="text-base font-black text-amber-400">{previewCity.teamName}</div>

                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex -space-x-1">
                      <div
                        className="w-8 h-8 rounded-xl border border-white/20 shadow-inner flex items-center justify-center text-[10px] font-black text-white"
                        style={{ backgroundColor: previewCity.jerseyPrimary }}
                      >
                        J
                      </div>
                      <div
                        className="w-8 h-8 rounded-xl border border-white/20 shadow-inner flex items-center justify-center text-[10px] font-black text-white"
                        style={{ backgroundColor: previewCity.jerseySecondary }}
                      >
                        A
                      </div>
                      <div
                        className="w-8 h-8 rounded-xl border border-white/20 shadow-inner flex items-center justify-center text-[10px] font-black text-white"
                        style={{ backgroundColor: previewCity.shortsColor }}
                      >
                        S
                      </div>
                    </div>
                    <div className="text-xs text-white/60">
                      Primary, Accent & Shorts Colorway
                    </div>
                  </div>
                </div>

                {/* Arena Details */}
                <div className="space-y-2 mb-4 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/40">Home Arena:</span>
                    <span className="font-bold text-white text-right">{previewCity.arenaName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/40">Court Apron:</span>
                    <span className="flex items-center gap-1.5 font-bold">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: previewCity.courtBorderColor }}
                      />
                      <span>Custom Painted Floor</span>
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/40">Crowd Atmosphere:</span>
                    <span className="font-bold text-amber-300 italic">{previewCity.crowdChant}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    onStartMatch(previewCity);
                    onClose();
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black italic uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Tip-Off in {previewCity.name}</span>
                </button>

                <button
                  onClick={() => {
                    onSelectCity(previewCity);
                    onClose();
                  }}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                >
                  Set as Active Court & Uniform
                </button>
              </div>
            </div>
          </div>
          </>)}

          {/* Footer */}
          <div className="px-6 py-3.5 bg-black/60 border-t border-white/10 flex items-center justify-between text-xs text-white/40 shrink-0">
            <span>
              Tap any city around the world to load local arena courts, custom jersey colors, and crowd atmosphere.
            </span>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white font-bold uppercase tracking-wider text-xs underline"
            >
              Close Menu
            </button>
          </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
