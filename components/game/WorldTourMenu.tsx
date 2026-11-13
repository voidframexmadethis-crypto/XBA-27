"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  MapPin,
  Trophy,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  CheckCircle2,
  ArrowLeft,
  FastForward,
  RotateCw,
  Medal,
} from "lucide-react";
import {
  GLOBAL_TOURNAMENTS,
  NATIONAL_TEAMS_16,
  WORLD_CITIES,
  WorldCity,
  WorldTourTournamentState,
  createTournamentBracket,
  getCityById,
  simulateRemainingTournamentRound,
} from "@/lib/worldTour";
import type { ProLeagueDivision } from "@/lib/leagueData";

interface WorldTourMenuProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: WorldCity;
  onSelectCity: (city: WorldCity) => void;
  onStartMatch: (city: WorldCity) => void;
  tournamentState?: WorldTourTournamentState;
  onUpdateTournament?: (next: WorldTourTournamentState) => void;
  onStartCupMatch?: (homeCity: WorldCity, awayCity: WorldCity, matchId: string) => void;
  activeDivision?: ProLeagueDivision;
  onChangeDivision?: (division: ProLeagueDivision) => void;
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
  activeDivision = "mens",
  onChangeDivision,
}: WorldTourMenuProps) {
  const countries = useMemo(() => {
    const map = new Map<string, { country: string; flag: string; cities: WorldCity[] }>();
    for (const city of WORLD_CITIES) {
      if (!map.has(city.country)) {
        map.set(city.country, { country: city.country, flag: city.flag, cities: [] });
      }
      map.get(city.country)!.cities.push(city);
    }
    return Array.from(map.values());
  }, []);

  const [selectedCountryName, setSelectedCountryName] = useState<string>(selectedCity.country);
  const [previewCity, setPreviewCity] = useState<WorldCity>(selectedCity);
  const [viewMode, setViewMode] = useState<"selector" | "tournaments" | "nations">("selector");
  const [localFallbackCup, setLocalFallbackCup] = useState<WorldTourTournamentState>(() =>
    createTournamentBracket(
      activeDivision === "womens" ? "cup_womens_world_16" : "cup_global_nations",
      selectedCity.id,
      [],
      activeDivision
    )
  );

  const cup = tournamentState || localFallbackCup;
  const setCup = (next: WorldTourTournamentState) => {
    if (onUpdateTournament) onUpdateTournament(next);
    else setLocalFallbackCup(next);
  };

  const activeDef = useMemo(
    () => GLOBAL_TOURNAMENTS.find((t) => t.id === cup.activeTournamentId) || GLOBAL_TOURNAMENTS[0],
    [cup.activeTournamentId]
  );

  const visibleTournaments = useMemo(
    () => GLOBAL_TOURNAMENTS.filter((t) => t.division === activeDivision),
    [activeDivision]
  );

  const activeCountryGroup = useMemo(() => {
    return countries.find((c) => c.country === selectedCountryName) || countries[0];
  }, [countries, selectedCountryName]);

  const handlePrevCountry = () => {
    const idx = countries.findIndex((c) => c.country === selectedCountryName);
    const prevIdx = (idx - 1 + countries.length) % countries.length;
    const nextGroup = countries[prevIdx];
    setSelectedCountryName(nextGroup.country);
    if (nextGroup.cities.length > 0) {
      setPreviewCity(nextGroup.cities[0]);
    }
  };

  const handleNextCountry = () => {
    const idx = countries.findIndex((c) => c.country === selectedCountryName);
    const nextIdx = (idx + 1) % countries.length;
    const nextGroup = countries[nextIdx];
    setSelectedCountryName(nextGroup.country);
    if (nextGroup.cities.length > 0) {
      setPreviewCity(nextGroup.cities[0]);
    }
  };

  const handlePrevCity = () => {
    const cities = activeCountryGroup.cities;
    const idx = cities.findIndex((c) => c.id === previewCity.id);
    const prevIdx = (idx - 1 + cities.length) % cities.length;
    setPreviewCity(cities[prevIdx]);
  };

  const handleNextCity = () => {
    const cities = activeCountryGroup.cities;
    const idx = cities.findIndex((c) => c.id === previewCity.id);
    const nextIdx = (idx + 1) % cities.length;
    setPreviewCity(cities[nextIdx]);
  };

  const hasOpenCupMatches = cup.matches.some((m) => !m.winnerCityId && m.homeCityId && m.awayCityId);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[170] flex items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl bg-neutral-950 border border-cyan-500/30 rounded-3xl shadow-[0_0_90px_rgba(6,182,212,0.2)] overflow-hidden text-white flex flex-col max-h-[92dvh] my-auto"
          >
            {/* Header */}
            <div className="relative px-6 py-4 bg-gradient-to-r from-amber-950/80 via-neutral-900 to-cyan-950/80 border-b border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center text-black font-black text-lg shadow-lg shadow-amber-500/30 border border-yellow-200">
                  WT
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg sm:text-2xl font-black italic uppercase tracking-tight text-white">
                      WORLD TOUR &amp; INTERNATIONAL CHAMPIONSHIPS
                    </h2>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-md tracking-wider">
                      16 NATIONS · {WORLD_CITIES.length} CITIES
                    </span>
                  </div>
                  <p className="text-xs text-white/60 font-semibold tracking-wide">
                    Men&apos;s &amp; Women&apos;s national teams, custom country basketballs, unique stadiums &amp; World Championships
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onChangeDivision && (
                  <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/15">
                    {(["mens", "womens"] as const).map((div) => (
                      <button
                        key={div}
                        type="button"
                        onClick={() => onChangeDivision(div)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase cursor-pointer transition-colors ${
                          activeDivision === div
                            ? div === "womens"
                              ? "bg-teal-400 text-black"
                              : "bg-amber-400 text-black"
                            : "text-white/65 hover:text-white"
                        }`}
                      >
                        {div === "womens" ? "Women's" : "Men's"}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close World Tour"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="px-6 py-3 bg-neutral-900 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("selector")}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                    viewMode === "selector"
                      ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/30"
                      : "bg-white/5 hover:bg-white/10 text-white/70"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Destination Selector ({WORLD_CITIES.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("tournaments")}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                    viewMode === "tournaments"
                      ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30"
                      : "bg-white/5 hover:bg-white/10 text-white/70"
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>International Championships</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("nations")}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                    viewMode === "nations"
                      ? "bg-amber-400 text-black shadow-lg shadow-amber-400/30"
                      : "bg-white/5 hover:bg-white/10 text-white/70"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>16 National Teams</span>
                </button>
              </div>

              <div className="text-xs text-cyan-300 font-bold hidden md:block">
                {activeDivision === "womens" ? "Women's" : "Men's"} Active: {selectedCity.flag} {selectedCity.name}
              </div>
            </div>

            {viewMode === "tournaments" ? (
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
                {/* Tournament Picker & Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {visibleTournaments.map((tDef) => (
                        <button
                          key={tDef.id}
                          type="button"
                          onClick={() =>
                            setCup(
                              createTournamentBracket(
                                tDef.id,
                                selectedCity.id,
                                cup.trophiesWon,
                                tDef.division
                              )
                            )
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase cursor-pointer border ${
                            cup.activeTournamentId === tDef.id
                              ? "bg-emerald-500 text-black border-emerald-300"
                              : "bg-black/50 text-white/75 border-white/15 hover:bg-white/10"
                          }`}
                        >
                          {tDef.name}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-white/60">
                      {activeDef.description} · Trophy: <strong className="text-amber-300">{activeDef.trophyName}</strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {hasOpenCupMatches && (
                      <button
                        type="button"
                        onClick={() => setCup(simulateRemainingTournamentRound(cup))}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer"
                      >
                        <FastForward className="w-3.5 h-3.5" />
                        <span>Sim Active Round</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setCup(
                          createTournamentBracket(
                            cup.activeTournamentId,
                            selectedCity.id,
                            cup.trophiesWon,
                            activeDivision
                          )
                        )
                      }
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>New Bracket</span>
                    </button>
                  </div>
                </div>

                {/* Champion Ceremony Banner */}
                {cup.championCityId && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-black border border-amber-400/50 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-10 h-10 text-amber-400 shrink-0" />
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-amber-300">
                          {activeDef.trophyName} Winner ({activeDivision === "womens" ? "Women's" : "Men's"})
                        </div>
                        <div className="text-2xl font-black uppercase">
                          {getCityById(cup.championCityId).flag}{" "}
                          {getCityById(cup.championCityId).country} ({getCityById(cup.championCityId).teamName})
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-white/75 font-bold tabular-nums">
                      Record: {cup.intlWins || 0}W - {cup.intlLosses || 0}L · Trophies Held: {cup.trophiesWon.length}
                    </div>
                  </div>
                )}

                {/* Bracket Rounds */}
                {(["final", "semifinal", "quarterfinal", "round16"] as const).map((roundCode) => {
                  const roundMatches = cup.matches.filter((m) => m.round === roundCode);
                  if (roundMatches.length === 0) return null;
                  const roundTitle =
                    roundCode === "round16"
                      ? "Round of 16"
                      : roundCode === "quarterfinal"
                      ? "Quarterfinals"
                      : roundCode === "semifinal"
                      ? "Semifinals"
                      : "Championship Final";
                  return (
                    <div key={roundCode} className="space-y-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-cyan-300">
                        {roundTitle}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {roundMatches.map((m) => {
                          const home = m.homeCityId ? getCityById(m.homeCityId) : null;
                          const away = m.awayCityId ? getCityById(m.awayCityId) : null;
                          const playable = Boolean(home && away && !m.winnerCityId);
                          return (
                            <div
                              key={m.id}
                              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                                m.winnerCityId
                                  ? "bg-white/[0.03] border-white/10"
                                  : playable
                                  ? "bg-cyan-500/10 border-cyan-400/40"
                                  : "bg-black/40 border-white/10 opacity-60"
                              }`}
                            >
                              <div className="space-y-1 text-xs min-w-0">
                                <div className="font-bold flex items-center gap-2 truncate">
                                  <span>{home ? `${home.flag} ${home.country}` : "TBD"}</span>
                                  {m.winnerCityId && (
                                    <span className="font-black text-amber-300 tabular-nums">{m.homeScore}</span>
                                  )}
                                  {m.winnerCityId === m.homeCityId && m.homeCityId && (
                                    <span className="text-[10px] font-black text-emerald-400">WIN</span>
                                  )}
                                </div>
                                <div className="font-bold flex items-center gap-2 truncate">
                                  <span>{away ? `${away.flag} ${away.country}` : "TBD"}</span>
                                  {m.winnerCityId && (
                                    <span className="font-black text-amber-300 tabular-nums">{m.awayScore}</span>
                                  )}
                                  {m.winnerCityId === m.awayCityId && m.awayCityId && (
                                    <span className="text-[10px] font-black text-emerald-400">WIN</span>
                                  )}
                                </div>
                              </div>

                              {playable && home && away && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectCity(home);
                                    if (onStartCupMatch) onStartCupMatch(home, away, m.id);
                                    else onStartMatch(home);
                                    onClose();
                                  }}
                                  className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer shrink-0"
                                >
                                  <Play className="w-3.5 h-3.5 fill-black" />
                                  <span>Play Match</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Trophies Showcase */}
                {cup.trophiesWon.length > 0 && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Medal className="w-4 h-4" /> International Trophy Cabinet ({cup.trophiesWon.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {cup.trophiesWon.map((tr, i) => {
                        const c = getCityById(tr.cityId);
                        return (
                          <div key={`${tr.tournamentId}-${i}`} className="px-3 py-2 rounded-lg bg-black/50 border border-white/10 flex justify-between">
                            <span className="font-bold">{tr.tournamentName}</span>
                            <span className="text-amber-300 font-black">{c.flag} {c.country}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : viewMode === "nations" ? (
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">
                      Official 16 National Federations ({activeDivision === "womens" ? "Women's Division" : "Men's Division"})
                    </h3>
                    <p className="text-xs text-white/60">
                      Click any nation to travel to their capital arena and tip off in custom national colors.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {NATIONAL_TEAMS_16.map((nat) => {
                    const capital = getCityById(nat.capitalCityId);
                    const teamTitle = activeDivision === "womens" ? nat.womensTeamName : nat.mensTeamName;
                    const captain = activeDivision === "womens" ? nat.womensCaptain : nat.mensCaptain;
                    const ovr = activeDivision === "womens" ? nat.womensOvr : nat.mensOvr;
                    return (
                      <div
                        key={nat.id}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-400/50 transition-all flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl">{nat.flag}</span>
                            <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 tabular-nums">
                              {ovr} OVR
                            </span>
                          </div>
                          <div className="text-sm font-black uppercase">{nat.country}</div>
                          <div className="text-[11px] font-bold text-cyan-300 truncate">{teamTitle}</div>
                          <div className="text-[11px] text-white/55">Captain: {captain}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectCity(capital);
                            onStartMatch(capital);
                            onClose();
                          }}
                          className="w-full py-2 rounded-xl bg-white/10 hover:bg-cyan-400 hover:text-black text-xs font-black uppercase transition-colors cursor-pointer"
                        >
                          Tip Off ({nat.code})
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Destination Selector Main Body */
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Country Selection Buttons & Navigation */}
                <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-white/50">
                        1. Select Country ({countries.length})
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handlePrevCountry}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white cursor-pointer"
                          title="Previous Country"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextCountry}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white cursor-pointer"
                          title="Next Country"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Country Selection Buttons */}
                    <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                      {countries.map((c) => {
                        const isSelected = c.country === selectedCountryName;
                        return (
                          <button
                            key={c.country}
                            type="button"
                            onClick={() => {
                              setSelectedCountryName(c.country);
                              if (c.cities.length > 0) setPreviewCity(c.cities[0]);
                            }}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                              isSelected
                                ? "bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <span className="text-2xl shrink-0">{c.flag}</span>
                            <div className="min-w-0">
                              <div className="font-black text-xs uppercase truncate">{c.country}</div>
                              <div className="text-[10px] text-white/40">{c.cities.length} {c.cities.length === 1 ? "city" : "cities"}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* City Selection Buttons within Country */}
                  <div className="space-y-3 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-white/50">
                        2. Select City in {activeCountryGroup.country}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handlePrevCity}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white cursor-pointer"
                          title="Previous City"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextCity}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white cursor-pointer"
                          title="Next City"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {activeCountryGroup.cities.map((city) => {
                        const isSelected = previewCity.id === city.id;
                        const isCurrentActive = selectedCity.id === city.id;
                        return (
                          <button
                            key={city.id}
                            type="button"
                            onClick={() => setPreviewCity(city)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "bg-gradient-to-r from-cyan-950/80 to-neutral-900 border-cyan-400 text-white shadow-md"
                                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <MapPin className={`w-4 h-4 shrink-0 ${isSelected ? "text-cyan-400" : "text-white/40"}`} />
                              <div className="truncate">
                                <div className="font-black text-xs uppercase truncate">{city.name}</div>
                                <div className="text-[10px] text-white/40 truncate">{city.teamName}</div>
                              </div>
                            </div>
                            {isCurrentActive && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500 text-black shrink-0">
                                Active
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column: Dynamic Destination Preview */}
                <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{previewCity.flag}</span>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                            {previewCity.name}, {previewCity.country}
                          </h3>
                          <div className="text-xs text-cyan-400 font-bold">{previewCity.arenaName}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
                          {previewCity.teamName}
                        </span>
                      </div>
                    </div>

                    {/* Unique Country Basketball Design Preview */}
                    <div className="p-4 rounded-2xl bg-neutral-900 border border-white/10 space-y-2.5">
                      <div className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center justify-between">
                        <span>Unique Country Basketball Design</span>
                        <span className="text-[10px] text-white/50 font-normal">Stamp: {previewCity.ballStamp}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div
                          className="w-14 h-14 rounded-full border-2 border-white/30 shadow-lg flex items-center justify-center text-xs font-black text-white shrink-0"
                          style={{
                            background: `radial-gradient(circle at 35% 35%, ${previewCity.ballBaseHex}, #111)`,
                            boxShadow: `0 0 15px ${previewCity.ballSeamHex}66`,
                          }}
                        >
                          🏀
                        </div>
                        <div className="text-xs text-white/70 space-y-0.5">
                          <div><strong className="text-white">Leather Color:</strong> {previewCity.ballBaseHex}</div>
                          <div><strong className="text-white">Channel Seams:</strong> {previewCity.ballSeamHex}</div>
                          <div className="text-white/50 text-[11px]">Visibly changes to match {previewCity.country}&apos;s official ball specification.</div>
                        </div>
                      </div>
                    </div>

                    {/* Unique Stadium & Court Appearance */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase text-white/40">Stadium Color Scheme</div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: previewCity.jerseyPrimary }} />
                          <span>{previewCity.teamName} Kit</span>
                        </div>
                        <div className="text-[10px] text-white/50">{previewCity.crowdChant}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase text-white/40">Custom Hardwood Court</div>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: previewCity.courtBorderColor }} title="Border Color" />
                          <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: previewCity.courtKeyColor }} title="Key Color" />
                          <span className="font-bold text-cyan-300">Custom Painted Apron</span>
                        </div>
                        <div className="text-[10px] text-white/50">Unique court branding &amp; lighting atmosphere.</div>
                      </div>
                    </div>
                  </div>

                  {/* Confirm & Back Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Menu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectCity(previewCity);
                        onStartMatch(previewCity);
                        onClose();
                      }}
                      className="py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black italic uppercase tracking-wider text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 fill-black text-cyan-400" />
                      <span>Confirm Destination &amp; Tip-Off</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
