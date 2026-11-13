import { loadVersionedState, SAVE_KEYS, saveVersionedState } from "./saveSystem.ts";

export interface WorldCity {
  id: string;
  name: string;
  country: string;
  flag: string;
  region: "usa" | "japan" | "france" | "brazil" | "canada" | "uk" | "australia" | "spain" | "argentina" | "central_america" | "africa" | "asia" | "europe";
  regionName: string;
  teamName: string;
  jerseyPrimary: string;
  jerseySecondary: string;
  shortsColor: string;
  courtBorderColor: string;
  courtKeyColor: string;
  arenaName: string;
  lat: number;
  lng: number;
  crowdChant: string;
  ballBaseHex: string;
  ballSeamHex: string;
  ballStamp: string;
}

export interface GlobalLeaderEntry {
  rank: number;
  name: string;
  jerseyNumber: string;
  city: string;
  country: string;
  flag: string;
  pts: number;
  reb: number;
  ast: number;
  ppg: number;
  isUser?: boolean;
}

export const GLOBAL_LEADERS_BASE: GlobalLeaderEntry[] = [
  { rank: 1, name: "Marcus 'Air' Vance", jerseyNumber: "#23", city: "New York City", country: "United States", flag: "🇺🇸", pts: 842, reb: 312, ast: 420, ppg: 34.2 },
  { rank: 2, name: "Kaito Tanaka", jerseyNumber: "#30", city: "Tokyo", country: "Japan", flag: "🇯🇵", pts: 795, reb: 180, ast: 510, ppg: 31.8 },
  { rank: 3, name: "Mateo Alcaraz", jerseyNumber: "#20", city: "Buenos Aires", country: "Argentina", flag: "🇦🇷", pts: 760, reb: 295, ast: 385, ppg: 30.4 },
  { rank: 4, name: "Lucas Dupont", jerseyNumber: "#7", city: "Paris", country: "France", flag: "🇫🇷", pts: 685, reb: 260, ast: 340, ppg: 27.4 },
  { rank: 5, name: "Mateo Silva", jerseyNumber: "#9", city: "Madrid", country: "Spain", flag: "🇪🇸", pts: 620, reb: 220, ast: 315, ppg: 24.8 },
];

export const WORLD_CITIES: WorldCity[] = [
  // --- UNITED STATES ---
  {
    id: "us_nyc",
    name: "New York City",
    country: "United States",
    flag: "🇺🇸",
    region: "usa",
    regionName: "United States",
    teamName: "Empire Monarchs",
    jerseyPrimary: "#006bb6",
    jerseySecondary: "#f58426",
    shortsColor: "#006bb6",
    courtBorderColor: "#003974",
    courtKeyColor: "#f58426",
    arenaName: "Metropolis Pavilion (Manhattan)",
    lat: 40.7128,
    lng: -74.006,
    crowdChant: "DEFENSE! DEFENSE! EMPIRE CITY!",
    ballBaseHex: "#e8681c",
    ballSeamHex: "#0b1d3a",
    ballStamp: "USA PRO",
  },
  {
    id: "us_la",
    name: "Los Angeles",
    country: "United States",
    flag: "🇺🇸",
    region: "usa",
    regionName: "United States",
    teamName: "Pacific Eclipse",
    jerseyPrimary: "#552583",
    jerseySecondary: "#fdb927",
    shortsColor: "#552583",
    courtBorderColor: "#3c1a5b",
    courtKeyColor: "#fdb927",
    arenaName: "Sunset Crown Forum (Downtown LA)",
    lat: 34.0522,
    lng: -118.2437,
    crowdChant: "ECLIPSE TIME! WEST COAST!",
    ballBaseHex: "#e8681c",
    ballSeamHex: "#552583",
    ballStamp: "USA WEST",
  },
  {
    id: "us_chicago",
    name: "Chicago",
    country: "United States",
    flag: "🇺🇸",
    region: "usa",
    regionName: "United States",
    teamName: "Lakeshore Gale",
    jerseyPrimary: "#ce1141",
    jerseySecondary: "#ffffff",
    shortsColor: "#111111",
    courtBorderColor: "#ce1141",
    courtKeyColor: "#ce1141",
    arenaName: "Windcrest Forum (Chicago)",
    lat: 41.8781,
    lng: -87.6298,
    crowdChant: "LET'S GO GALE! CHI-TOWN!",
    ballBaseHex: "#e8681c",
    ballSeamHex: "#ce1141",
    ballStamp: "USA WINDY",
  },
  {
    id: "us_miami",
    name: "Miami",
    country: "United States",
    flag: "🇺🇸",
    region: "usa",
    regionName: "United States",
    teamName: "Bayfront Solaris",
    jerseyPrimary: "#98002e",
    jerseySecondary: "#f9a01b",
    shortsColor: "#000000",
    courtBorderColor: "#98002e",
    courtKeyColor: "#f9a01b",
    arenaName: "Tropicana Horizon Center",
    lat: 25.7617,
    lng: -80.1918,
    crowdChant: "SOLARIS RISING! MIAMI!",
    ballBaseHex: "#ff7043",
    ballSeamHex: "#98002e",
    ballStamp: "USA MIAMI",
  },
  {
    id: "us_boston",
    name: "Boston",
    country: "United States",
    flag: "🇺🇸",
    region: "usa",
    regionName: "United States",
    teamName: "New England Shamrocks",
    jerseyPrimary: "#007a33",
    jerseySecondary: "#ba9653",
    shortsColor: "#007a33",
    courtBorderColor: "#004d20",
    courtKeyColor: "#ba9653",
    arenaName: "Garden Hardwood Pavilion",
    lat: 42.3601,
    lng: -71.0589,
    crowdChant: "LET'S GO BOSTON! GREEN REIGN!",
    ballBaseHex: "#e8681c",
    ballSeamHex: "#004d20",
    ballStamp: "USA CELTIC",
  },

  // --- JAPAN ---
  {
    id: "jp_tokyo",
    name: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    region: "japan",
    regionName: "Japan",
    teamName: "Tokyo Cyber Samurai",
    jerseyPrimary: "#dc2626",
    jerseySecondary: "#ffffff",
    shortsColor: "#111111",
    courtBorderColor: "#991b1b",
    courtKeyColor: "#dc2626",
    arenaName: "Shibuya Sky Gymnasium",
    lat: 35.6762,
    lng: 139.6503,
    crowdChant: "TOKYO SAMURAI! LET'S GO!",
    ballBaseHex: "#d62828",
    ballSeamHex: "#111111",
    ballStamp: "NIPPON PRO",
  },
  {
    id: "jp_osaka",
    name: "Osaka",
    country: "Japan",
    flag: "🇯🇵",
    region: "japan",
    regionName: "Japan",
    teamName: "Osaka Neon Titans",
    jerseyPrimary: "#2563eb",
    jerseySecondary: "#facc15",
    shortsColor: "#1e3a8a",
    courtBorderColor: "#1e40af",
    courtKeyColor: "#facc15",
    arenaName: "Namba Electric Dome",
    lat: 34.6937,
    lng: 135.5022,
    crowdChant: "KANSAI SPIRIT! OSAKA!",
    ballBaseHex: "#1d428a",
    ballSeamHex: "#facc15",
    ballStamp: "OSAKA KANSAI",
  },
  {
    id: "jp_kyoto",
    name: "Kyoto",
    country: "Japan",
    flag: "🇯🇵",
    region: "japan",
    regionName: "Japan",
    teamName: "Kyoto Zen Dynasties",
    jerseyPrimary: "#b45309",
    jerseySecondary: "#fef3c7",
    shortsColor: "#78350f",
    courtBorderColor: "#78350f",
    courtKeyColor: "#d97706",
    arenaName: "Imperial Bamboo Arena",
    lat: 35.0116,
    lng: 135.7681,
    crowdChant: "KYOTO ETERNAL!",
    ballBaseHex: "#b45309",
    ballSeamHex: "#fef3c7",
    ballStamp: "KYOTO ZEN",
  },

  // --- FRANCE ---
  {
    id: "fr_paris",
    name: "Paris",
    country: "France",
    flag: "🇫🇷",
    region: "france",
    regionName: "France",
    teamName: "Paris Seine Cavaliers",
    jerseyPrimary: "#111827",
    jerseySecondary: "#ffffff",
    shortsColor: "#111827",
    courtBorderColor: "#1f2937",
    courtKeyColor: "#3b82f6",
    arenaName: "Lumière Grand Palais (Paris)",
    lat: 48.8566,
    lng: 2.3522,
    crowdChant: "ALLEZ PARIS!",
    ballBaseHex: "#1d3557",
    ballSeamHex: "#e9c46a",
    ballStamp: "FRANCE CLUB",
  },
  {
    id: "fr_marseille",
    name: "Marseille",
    country: "France",
    flag: "🇫🇷",
    region: "france",
    regionName: "France",
    teamName: "Marseille Mediterranean Vipers",
    jerseyPrimary: "#0284c7",
    jerseySecondary: "#ffffff",
    shortsColor: "#0369a1",
    courtBorderColor: "#0369a1",
    courtKeyColor: "#38bdf8",
    arenaName: "Vélodrome Coastal Arena",
    lat: 43.2965,
    lng: 5.3698,
    crowdChant: "ALLEZ L'OM! MARSEILLE!",
    ballBaseHex: "#0284c7",
    ballSeamHex: "#ffffff",
    ballStamp: "MARSEILLE",
  },
  {
    id: "fr_lyon",
    name: "Lyon",
    country: "France",
    flag: "🇫🇷",
    region: "france",
    regionName: "France",
    teamName: "Lyon Rhône Rhinos",
    jerseyPrimary: "#dc2626",
    jerseySecondary: "#1f2937",
    shortsColor: "#111827",
    courtBorderColor: "#991b1b",
    courtKeyColor: "#dc2626",
    arenaName: "Rhône Valley Coliseum",
    lat: 45.764,
    lng: 4.8357,
    crowdChant: "LYON VAINQUEUR!",
    ballBaseHex: "#dc2626",
    ballSeamHex: "#111827",
    ballStamp: "RHÔNE LYON",
  },

  // --- BRAZIL ---
  {
    id: "br_rio",
    name: "Rio de Janeiro",
    country: "Brazil",
    flag: "🇧🇷",
    region: "brazil",
    regionName: "Brazil",
    teamName: "Rio Carnival Samba",
    jerseyPrimary: "#16a34a",
    jerseySecondary: "#facc15",
    shortsColor: "#111827",
    courtBorderColor: "#15803d",
    courtKeyColor: "#ca8a04",
    arenaName: "Copacabana Beachfront Arena",
    lat: -22.9068,
    lng: -43.1729,
    crowdChant: "BRASIL ESPETACULAR! SAMBA!",
    ballBaseHex: "#ffb703",
    ballSeamHex: "#2b9348",
    ballStamp: "BRASIL RIO",
  },
  {
    id: "br_saopaulo",
    name: "São Paulo",
    country: "Brazil",
    flag: "🇧🇷",
    region: "brazil",
    regionName: "Brazil",
    teamName: "São Paulo Titans",
    jerseyPrimary: "#111827",
    jerseySecondary: "#dc2626",
    shortsColor: "#000000",
    courtBorderColor: "#1f2937",
    courtKeyColor: "#dc2626",
    arenaName: "Paulista Metropolitan Dome",
    lat: -23.5505,
    lng: -46.6333,
    crowdChant: "VAMOS SÃO PAULO!",
    ballBaseHex: "#e8681c",
    ballSeamHex: "#111827",
    ballStamp: "SÃO PAULO",
  },
  {
    id: "br_brasilia",
    name: "Brasília",
    country: "Brazil",
    flag: "🇧🇷",
    region: "brazil",
    regionName: "Brazil",
    teamName: "Brasília Capital Sovereigns",
    jerseyPrimary: "#2563eb",
    jerseySecondary: "#facc15",
    shortsColor: "#1e3a8a",
    courtBorderColor: "#1d428a",
    courtKeyColor: "#facc15",
    arenaName: "Planalto National Arena",
    lat: -15.8267,
    lng: -47.9218,
    crowdChant: "BRASÍLIA CAMPEÃO!",
    ballBaseHex: "#ffb703",
    ballSeamHex: "#1d428a",
    ballStamp: "CAPITAL BR",
  },

  // --- CANADA ---
  {
    id: "ca_toronto",
    name: "Toronto",
    country: "Canada",
    flag: "🇨🇦",
    region: "canada",
    regionName: "Canada",
    teamName: "Toronto North Raptors",
    jerseyPrimary: "#ce1141",
    jerseySecondary: "#000000",
    shortsColor: "#000000",
    courtBorderColor: "#990022",
    courtKeyColor: "#ce1141",
    arenaName: "Northern Lights Arena (Toronto)",
    lat: 43.6532,
    lng: -79.3832,
    crowdChant: "WE THE NORTH! TORONTO!",
    ballBaseHex: "#bc002d",
    ballSeamHex: "#ffffff",
    ballStamp: "CANADA MAPLE",
  },
  {
    id: "ca_vancouver",
    name: "Vancouver",
    country: "Canada",
    flag: "🇨🇦",
    region: "canada",
    regionName: "Canada",
    teamName: "Vancouver Pacific Grizzlies",
    jerseyPrimary: "#002b49",
    jerseySecondary: "#008080",
    shortsColor: "#001a2e",
    courtBorderColor: "#001a2e",
    courtKeyColor: "#008080",
    arenaName: "Pacific Coast Coliseum",
    lat: 49.2827,
    lng: -123.1207,
    crowdChant: "GRIZZLIES ROAR! VANCOUVER!",
    ballBaseHex: "#bc002d",
    ballSeamHex: "#002b49",
    ballStamp: "CANADA WEST",
  },
  {
    id: "ca_montreal",
    name: "Montreal",
    country: "Canada",
    flag: "🇨🇦",
    region: "canada",
    regionName: "Canada",
    teamName: "Montreal Fleur de Lys",
    jerseyPrimary: "#1d428a",
    jerseySecondary: "#ffffff",
    shortsColor: "#111827",
    courtBorderColor: "#1e3a8a",
    courtKeyColor: "#3b82f6",
    arenaName: "St. Lawrence Garden Arena",
    lat: 45.5017,
    lng: -73.5673,
    crowdChant: "GO MONTRÉAL GO!",
    ballBaseHex: "#bc002d",
    ballSeamHex: "#1d428a",
    ballStamp: "MONTRÉAL QC",
  },

  // --- UNITED KINGDOM ---
  {
    id: "uk_london",
    name: "London",
    country: "United Kingdom",
    flag: "🇬🇧",
    region: "uk",
    regionName: "United Kingdom",
    teamName: "London Royal Crowns",
    jerseyPrimary: "#1d428a",
    jerseySecondary: "#dc2626",
    shortsColor: "#111827",
    courtBorderColor: "#0f172a",
    courtKeyColor: "#dc2626",
    arenaName: "Thames Gateway Pavilion (London)",
    lat: 51.5074,
    lng: -0.1278,
    crowdChant: "DEFENCE! LONDON ROYALS!",
    ballBaseHex: "#1d428a",
    ballSeamHex: "#900c3f",
    ballStamp: "GREAT BRITAIN",
  },
  {
    id: "uk_manchester",
    name: "Manchester",
    country: "United Kingdom",
    flag: "🇬🇧",
    region: "uk",
    regionName: "United Kingdom",
    teamName: "Manchester Titans",
    jerseyPrimary: "#f59e0b",
    jerseySecondary: "#111827",
    shortsColor: "#000000",
    courtBorderColor: "#b45309",
    courtKeyColor: "#f59e0b",
    arenaName: "Lancashire Hoops Arena",
    lat: 53.4808,
    lng: -2.2426,
    crowdChant: "MANCHESTER UNITED!",
    ballBaseHex: "#1d428a",
    ballSeamHex: "#f59e0b",
    ballStamp: "UK MANCHESTER",
  },
  {
    id: "uk_liverpool",
    name: "Liverpool",
    country: "United Kingdom",
    flag: "🇬🇧",
    region: "uk",
    regionName: "United Kingdom",
    teamName: "Liverpool Mersey Reds",
    jerseyPrimary: "#c8102e",
    jerseySecondary: "#ffffff",
    shortsColor: "#900c3f",
    courtBorderColor: "#900c3f",
    courtKeyColor: "#c8102e",
    arenaName: "Merseyside Dockside Center",
    lat: 53.4084,
    lng: -2.9916,
    crowdChant: "YNWA! LIVERPOOL!",
    ballBaseHex: "#c8102e",
    ballSeamHex: "#ffffff",
    ballStamp: "UK LIVERPOOL",
  },

  // --- AUSTRALIA ---
  {
    id: "au_sydney",
    name: "Sydney",
    country: "Australia",
    flag: "🇦🇺",
    region: "australia",
    regionName: "Australia",
    teamName: "Sydney Harbour Sovereigns",
    jerseyPrimary: "#7c3aed",
    jerseySecondary: "#facc15",
    shortsColor: "#581c87",
    courtBorderColor: "#581c87",
    courtKeyColor: "#facc15",
    arenaName: "Harbour Bridge Arena (Sydney)",
    lat: -33.8688,
    lng: 151.2093,
    crowdChant: "HARBOUR SOVEREIGNS! OI!",
    ballBaseHex: "#2a9d8f",
    ballSeamHex: "#e76f51",
    ballStamp: "AUSTRALIA SOVEREIGN",
  },
  {
    id: "au_melbourne",
    name: "Melbourne",
    country: "Australia",
    flag: "🇦🇺",
    region: "australia",
    regionName: "Australia",
    teamName: "Melbourne Southern Cross",
    jerseyPrimary: "#0284c7",
    jerseySecondary: "#111827",
    shortsColor: "#000000",
    courtBorderColor: "#0369a1",
    courtKeyColor: "#0284c7",
    arenaName: "Yarra Park Pavilion (Melbourne)",
    lat: -37.8136,
    lng: 144.9631,
    crowdChant: "SOUTHERN CROSS! MELBOURNE!",
    ballBaseHex: "#2a9d8f",
    ballSeamHex: "#0284c7",
    ballStamp: "AUSTRALIA MELB",
  },
  {
    id: "au_brisbane",
    name: "Brisbane",
    country: "Australia",
    flag: "🇦🇺",
    region: "australia",
    regionName: "Australia",
    teamName: "Brisbane Suncoast Heat",
    jerseyPrimary: "#ea580c",
    jerseySecondary: "#facc15",
    shortsColor: "#9a3412",
    courtBorderColor: "#9a3412",
    courtKeyColor: "#facc15",
    arenaName: "Sunshine Coast Arena",
    lat: -27.4698,
    lng: 153.0251,
    crowdChant: "BRISBANE HEAT!",
    ballBaseHex: "#2a9d8f",
    ballSeamHex: "#ea580c",
    ballStamp: "AUSTRALIA BRIS",
  },

  // --- SPAIN ---
  {
    id: "es_madrid",
    name: "Madrid",
    country: "Spain",
    flag: "🇪🇸",
    region: "spain",
    regionName: "Spain",
    teamName: "Madrid Royal Crown",
    jerseyPrimary: "#ffffff",
    jerseySecondary: "#581c87",
    shortsColor: "#ffffff",
    courtBorderColor: "#3b0764",
    courtKeyColor: "#eab308",
    arenaName: "Palacio de Castiella (Madrid)",
    lat: 40.4168,
    lng: -3.7038,
    crowdChant: "VAMOS MADRID!",
    ballBaseHex: "#e63946",
    ballSeamHex: "#ffb703",
    ballStamp: "ESPAÑA ROYAL",
  },
  {
    id: "es_barcelona",
    name: "Barcelona",
    country: "Spain",
    flag: "🇪🇸",
    region: "spain",
    regionName: "Spain",
    teamName: "Barcelona Blaugrana Hoopers",
    jerseyPrimary: "#004d98",
    jerseySecondary: "#a50044",
    shortsColor: "#002244",
    courtBorderColor: "#002244",
    courtKeyColor: "#a50044",
    arenaName: "Catalunya Sea Arena",
    lat: 41.3851,
    lng: 2.1734,
    crowdChant: "BARÇA! BARÇA! BARÇA!",
    ballBaseHex: "#e63946",
    ballSeamHex: "#004d98",
    ballStamp: "ESPAÑA BARÇA",
  },
  {
    id: "es_valencia",
    name: "Valencia",
    country: "Spain",
    flag: "🇪🇸",
    region: "spain",
    regionName: "Spain",
    teamName: "Valencia Orange Basket",
    jerseyPrimary: "#f97316",
    jerseySecondary: "#000000",
    shortsColor: "#111827",
    courtBorderColor: "#c2410c",
    courtKeyColor: "#f97316",
    arenaName: "Mediterranean Coast Pavilion",
    lat: 39.4699,
    lng: -0.3763,
    crowdChant: "VALENCIA AMUNT!",
    ballBaseHex: "#e63946",
    ballSeamHex: "#f97316",
    ballStamp: "ESPAÑA VALENCIA",
  },
];

export const REGIONS_META = [
  { id: "all", label: "All Countries", icon: "Globe" },
  { id: "usa", label: "United States", icon: "Flag" },
  { id: "japan", label: "Japan", icon: "Sparkles" },
  { id: "france", label: "France", icon: "Shield" },
  { id: "brazil", label: "Brazil", icon: "Sun" },
  { id: "canada", label: "Canada", icon: "Compass" },
  { id: "uk", label: "United Kingdom", icon: "Award" },
  { id: "australia", label: "Australia", icon: "MapPin" },
  { id: "spain", label: "Spain", icon: "Flame" },
];

export function getCityById(id: string): WorldCity {
  return WORLD_CITIES.find((c) => c.id === id) || WORLD_CITIES[0];
}

// Tournament & Leaderboard support
export interface InternationalTournamentDef {
  id: string;
  name: string;
  trophyName: string;
  description: string;
  cityIds: string[];
  prizeXp: number;
}

export interface TournamentMatchNode {
  id: string;
  round: "quarterfinal" | "semifinal" | "final";
  slot: number;
  homeCityId: string | null;
  awayCityId: string | null;
  homeScore: number;
  awayScore: number;
  winnerCityId: string | null;
}

export interface WorldTourTournamentState {
  activeTournamentId: string;
  userCityId: string;
  matches: TournamentMatchNode[];
  championCityId: string | null;
  trophiesWon: { tournamentId: string; tournamentName: string; cityId: string; dateIso: string }[];
}

export const GLOBAL_TOURNAMENTS: InternationalTournamentDef[] = [
  {
    id: "cup_global_nations",
    name: "Apex Global Nations Cup",
    trophyName: "Golden Globe Trophy",
    description: "8 international powerhouses battle in single-elimination knockout play for world supremacy.",
    cityIds: ["us_nyc", "jp_tokyo", "fr_paris", "br_rio", "ca_toronto", "uk_london", "au_sydney", "es_madrid"],
    prizeXp: 650,
  },
];

export function createTournamentBracket(tournamentId: string, userCityId: string, prevTrophies: WorldTourTournamentState["trophiesWon"] = []): WorldTourTournamentState {
  const def = GLOBAL_TOURNAMENTS.find((t) => t.id === tournamentId) || GLOBAL_TOURNAMENTS[0];
  const pool = [...def.cityIds];
  if (!pool.includes(userCityId)) {
    pool[0] = userCityId;
  }

  const matches: TournamentMatchNode[] = [
    { id: "qf_0", round: "quarterfinal", slot: 0, homeCityId: pool[0], awayCityId: pool[7], homeScore: 0, awayScore: 0, winnerCityId: null },
    { id: "qf_1", round: "quarterfinal", slot: 1, homeCityId: pool[3], awayCityId: pool[4], homeScore: 0, awayScore: 0, winnerCityId: null },
    { id: "qf_2", round: "quarterfinal", slot: 2, homeCityId: pool[2], awayCityId: pool[5], homeScore: 0, awayScore: 0, winnerCityId: null },
    { id: "qf_3", round: "quarterfinal", slot: 3, homeCityId: pool[1], awayCityId: pool[6], homeScore: 0, awayScore: 0, winnerCityId: null },
    { id: "sf_0", round: "semifinal", slot: 0, homeCityId: null, awayCityId: null, homeScore: 0, awayScore: 0, winnerCityId: null },
    { id: "sf_1", round: "semifinal", slot: 1, homeCityId: null, awayCityId: null, homeScore: 0, awayScore: 0, winnerCityId: null },
    { id: "fin_0", round: "final", slot: 0, homeCityId: null, awayCityId: null, homeScore: 0, awayScore: 0, winnerCityId: null },
  ];

  return {
    activeTournamentId: def.id,
    userCityId,
    matches,
    championCityId: null,
    trophiesWon: prevTrophies,
  };
}

export function resolveTournamentMatch(
  state: WorldTourTournamentState,
  matchId: string,
  homeScore: number,
  awayScore: number
): WorldTourTournamentState {
  const matches = state.matches.map((m) => ({ ...m }));
  const target = matches.find((m) => m.id === matchId);
  if (!target || !target.homeCityId || !target.awayCityId) return state;

  const finalHome = homeScore === awayScore ? homeScore + 2 : homeScore;
  target.homeScore = finalHome;
  target.awayScore = awayScore;
  target.winnerCityId = finalHome > awayScore ? target.homeCityId : target.awayCityId;

  if (target.round === "quarterfinal") {
    const sf = matches.find((m) => m.round === "semifinal" && m.slot === Math.floor(target.slot / 2));
    if (sf) {
      if (target.slot % 2 === 0) sf.homeCityId = target.winnerCityId;
      else sf.awayCityId = target.winnerCityId;
    }
  } else if (target.round === "semifinal") {
    const fin = matches.find((m) => m.round === "final");
    if (fin) {
      if (target.slot === 0) fin.homeCityId = target.winnerCityId;
      else fin.awayCityId = target.winnerCityId;
    }
  }

  const finNode = matches.find((m) => m.round === "final");
  const championCityId = finNode?.winnerCityId || null;
  let trophiesWon = state.trophiesWon;

  if (championCityId && championCityId === state.userCityId && !state.championCityId) {
    const def = GLOBAL_TOURNAMENTS.find((t) => t.id === state.activeTournamentId);
    trophiesWon = [
      ...trophiesWon,
      {
        tournamentId: state.activeTournamentId,
        tournamentName: def?.name || "Global Cup",
        cityId: championCityId,
        dateIso: new Date().toISOString(),
      },
    ];
  }

  return {
    ...state,
    matches,
    championCityId,
    trophiesWon,
  };
}

export function simulateRemainingTournamentRound(state: WorldTourTournamentState): WorldTourTournamentState {
  let curr = state;
  const openMatches = curr.matches.filter((m) => !m.winnerCityId && m.homeCityId && m.awayCityId);
  openMatches.forEach((m, idx) => {
    const base = 74 + ((idx * 17 + m.slot * 9) % 18);
    const opp = 72 + ((idx * 23 + m.slot * 5) % 18);
    const userFavored = m.homeCityId === curr.userCityId ? 6 : m.awayCityId === curr.userCityId ? -6 : 0;
    curr = resolveTournamentMatch(curr, m.id, base + Math.max(0, userFavored), opp + Math.max(0, -userFavored));
  });
  return curr;
}

export function loadWorldTourTournamentState(): WorldTourTournamentState {
  return loadVersionedState<WorldTourTournamentState>(
    SAVE_KEYS.WORLD_TOUR_V2,
    () => createTournamentBracket("cup_global_nations", "us_nyc"),
    (d): d is WorldTourTournamentState =>
      Boolean(d && typeof d === "object" && Array.isArray((d as WorldTourTournamentState).matches))
  ).data;
}

export function saveWorldTourTournamentState(state: WorldTourTournamentState): void {
  saveVersionedState(SAVE_KEYS.WORLD_TOUR_V2, state);
}
