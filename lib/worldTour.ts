import { loadVersionedState, SAVE_KEYS, saveVersionedState } from "./saveSystem.ts";

export interface WorldCity {
  id: string;
  name: string;
  country: string;
  flag: string;
  region: "usa" | "argentina" | "central_america" | "africa" | "asia" | "australia" | "europe";
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
  { rank: 4, name: "Chidi Adebayo", jerseyNumber: "#34", city: "Lagos", country: "Nigeria", flag: "🇳🇬", pts: 740, reb: 490, ast: 210, ppg: 29.6 },
  { rank: 5, name: "Dmitri Volkov", jerseyNumber: "#11", city: "Belgrade", country: "Serbia", flag: "🇷🇸", pts: 710, reb: 240, ast: 390, ppg: 28.4 },
  { rank: 6, name: "Lucas Dupont", jerseyNumber: "#7", city: "Paris", country: "France", flag: "🇫🇷", pts: 685, reb: 260, ast: 340, ppg: 27.4 },
  { rank: 7, name: "Jin Woo", jerseyNumber: "#10", city: "Seoul", country: "South Korea", flag: "🇰🇷", pts: 650, reb: 190, ast: 445, ppg: 26.0 },
  { rank: 8, name: "Mateo Silva", jerseyNumber: "#9", city: "Madrid", country: "Spain", flag: "🇪🇸", pts: 620, reb: 220, ast: 315, ppg: 24.8 },
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
  },
  {
    id: "us_sf",
    name: "San Francisco",
    country: "United States",
    flag: "🇺🇸",
    region: "usa",
    regionName: "United States",
    teamName: "Bay Area Vanguard",
    jerseyPrimary: "#1d428a",
    jerseySecondary: "#ffc72c",
    shortsColor: "#1d428a",
    courtBorderColor: "#1d428a",
    courtKeyColor: "#ffc72c",
    arenaName: "Golden Tide Pavilion (SF)",
    lat: 37.7749,
    lng: -122.4194,
    crowdChant: "VAN-GUARD! BAY AREA!",
  },

  // --- ARGENTINA & SOUTH AMERICA ---
  {
    id: "ar_buenosaires",
    name: "Buenos Aires",
    country: "Argentina",
    flag: "🇦🇷",
    region: "argentina",
    regionName: "Argentina",
    teamName: "Buenos Aires Gauchos",
    jerseyPrimary: "#75aadb",
    jerseySecondary: "#ffffff",
    shortsColor: "#1a365d",
    courtBorderColor: "#1a365d",
    courtKeyColor: "#75aadb",
    arenaName: "Plata Harbor Dome (Buenos Aires)",
    lat: -34.6037,
    lng: -58.3816,
    crowdChant: "VAMOS GAUCHOS! ARGENTINA!",
  },
  {
    id: "ar_cordoba",
    name: "Córdoba",
    country: "Argentina",
    flag: "🇦🇷",
    region: "argentina",
    regionName: "Argentina",
    teamName: "Córdoba Sierras",
    jerseyPrimary: "#047857",
    jerseySecondary: "#ffffff",
    shortsColor: "#065f46",
    courtBorderColor: "#065f46",
    courtKeyColor: "#10b981",
    arenaName: "Polideportivo Alto Valle",
    lat: -31.4201,
    lng: -64.1888,
    crowdChant: "DALE SIERRAS DALE!",
  },
  {
    id: "ar_rosario",
    name: "Rosario",
    country: "Argentina",
    flag: "🇦🇷",
    region: "argentina",
    regionName: "Argentina",
    teamName: "Rosario Paraná",
    jerseyPrimary: "#dc2626",
    jerseySecondary: "#111827",
    shortsColor: "#000000",
    courtBorderColor: "#991b1b",
    courtKeyColor: "#dc2626",
    arenaName: "Coliseo del Río Paraná",
    lat: -32.9468,
    lng: -60.6393,
    crowdChant: "ROSARIO TIENE AGUANTE!",
  },
  {
    id: "ar_mendoza",
    name: "Mendoza",
    country: "Argentina",
    flag: "🇦🇷",
    region: "argentina",
    regionName: "Argentina",
    teamName: "Mendoza Andinos",
    jerseyPrimary: "#b45309",
    jerseySecondary: "#ffffff",
    shortsColor: "#78350f",
    courtBorderColor: "#78350f",
    courtKeyColor: "#d97706",
    arenaName: "Arena Cordillera",
    lat: -32.8895,
    lng: -68.8458,
    crowdChant: "FUERZA ANDINOS!",
  },

  // --- CENTRAL AMERICA & CARIBBEAN ---
  {
    id: "ca_mexicocity",
    name: "Mexico City",
    country: "Mexico",
    flag: "🇲🇽",
    region: "central_america",
    regionName: "Central America",
    teamName: "CDMX Azteca Falcons",
    jerseyPrimary: "#15803d",
    jerseySecondary: "#b91c1c",
    shortsColor: "#ffffff",
    courtBorderColor: "#14532d",
    courtKeyColor: "#b91c1c",
    arenaName: "Centro Deportivo Chapultepec",
    lat: 19.4326,
    lng: -99.1332,
    crowdChant: "MÉXICO! MÉXICO!",
  },
  {
    id: "ca_sanjuan",
    name: "San Juan",
    country: "Puerto Rico",
    flag: "🇵🇷",
    region: "central_america",
    regionName: "Central America",
    teamName: "San Juan Mariners",
    jerseyPrimary: "#ef4444",
    jerseySecondary: "#3b82f6",
    shortsColor: "#1e3a8a",
    courtBorderColor: "#1e40af",
    courtKeyColor: "#ef4444",
    arenaName: "Coliseo del Caribe",
    lat: 18.4655,
    lng: -66.1057,
    crowdChant: "BORICUA BALLERS!",
  },
  {
    id: "ca_sanjose",
    name: "San José",
    country: "Costa Rica",
    flag: "🇨🇷",
    region: "central_america",
    regionName: "Central America",
    teamName: "San José Quetzals",
    jerseyPrimary: "#0284c7",
    jerseySecondary: "#dc2626",
    shortsColor: "#0369a1",
    courtBorderColor: "#0369a1",
    courtKeyColor: "#dc2626",
    arenaName: "Gimnasio del Valle Central",
    lat: 9.9281,
    lng: -84.0907,
    crowdChant: "PURA VIDA BASKET!",
  },
  {
    id: "ca_panama",
    name: "Panama City",
    country: "Panama",
    flag: "🇵🇦",
    region: "central_america",
    regionName: "Central America",
    teamName: "Panama Canal Hoopers",
    jerseyPrimary: "#1e40af",
    jerseySecondary: "#dc2626",
    shortsColor: "#ffffff",
    courtBorderColor: "#1e3a8a",
    courtKeyColor: "#dc2626",
    arenaName: "Domo Pacífico Central",
    lat: 8.9824,
    lng: -79.5199,
    crowdChant: "VAMOS PANAMÁ!",
  },

  // --- AFRICA ---
  {
    id: "af_lagos",
    name: "Lagos",
    country: "Nigeria",
    flag: "🇳🇬",
    region: "africa",
    regionName: "Africa",
    teamName: "Lagos Coastal Titans",
    jerseyPrimary: "#16a34a",
    jerseySecondary: "#ffffff",
    shortsColor: "#15803d",
    courtBorderColor: "#14532d",
    courtKeyColor: "#22c55e",
    arenaName: "Eko National Pavilion",
    lat: 6.5244,
    lng: 3.3792,
    crowdChant: "LAGOS TITANS RISE!",
  },
  {
    id: "af_cairo",
    name: "Cairo",
    country: "Egypt",
    flag: "🇪🇬",
    region: "africa",
    regionName: "Africa",
    teamName: "Cairo Pharaohs",
    jerseyPrimary: "#b91c1c",
    jerseySecondary: "#eab308",
    shortsColor: "#111827",
    courtBorderColor: "#7f1d1d",
    courtKeyColor: "#ca8a04",
    arenaName: "Nile Horizon Covered Hall",
    lat: 30.0444,
    lng: 31.2357,
    crowdChant: "CAIRO PHARAOHS!",
  },
  {
    id: "af_dakar",
    name: "Dakar",
    country: "Senegal",
    flag: "🇸🇳",
    region: "africa",
    regionName: "Africa",
    teamName: "Dakar Atlantic Lions",
    jerseyPrimary: "#15803d",
    jerseySecondary: "#eab308",
    shortsColor: "#b91c1c",
    courtBorderColor: "#14532d",
    courtKeyColor: "#eab308",
    arenaName: "Cap-Vert Hoops Arena",
    lat: 14.7167,
    lng: -17.4677,
    crowdChant: "LIONS DE DAKAR!",
  },
  {
    id: "af_luanda",
    name: "Luanda",
    country: "Angola",
    flag: "🇦🇴",
    region: "africa",
    regionName: "Africa",
    teamName: "Luanda Harbor Kings",
    jerseyPrimary: "#eab308",
    jerseySecondary: "#1d428a",
    shortsColor: "#1e3a8a",
    courtBorderColor: "#1e3a8a",
    courtKeyColor: "#eab308",
    arenaName: "Pavilhão Atlântico Luanda",
    lat: -8.839,
    lng: 13.2894,
    crowdChant: "FORÇA LUANDA!",
  },
  {
    id: "af_kigali",
    name: "Kigali",
    country: "Rwanda",
    flag: "🇷🇼",
    region: "africa",
    regionName: "Africa",
    teamName: "Kigali Thousand Hills",
    jerseyPrimary: "#0284c7",
    jerseySecondary: "#eab308",
    shortsColor: "#15803d",
    courtBorderColor: "#0369a1",
    courtKeyColor: "#eab308",
    arenaName: "Highland Crown Arena",
    lat: -1.9706,
    lng: 30.1044,
    crowdChant: "KIGALI PRIDE!",
  },
  {
    id: "af_joburg",
    name: "Johannesburg",
    country: "South Africa",
    flag: "🇿🇦",
    region: "africa",
    regionName: "Africa",
    teamName: "Joburg Gold Strikers",
    jerseyPrimary: "#d97706",
    jerseySecondary: "#047857",
    shortsColor: "#111827",
    courtBorderColor: "#78350f",
    courtKeyColor: "#047857",
    arenaName: "Highveld Sovereign Dome",
    lat: -26.2041,
    lng: 28.0473,
    crowdChant: "STRIKERS UNITED!",
  },

  // --- ASIA ---
  {
    id: "as_tokyo",
    name: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    region: "asia",
    regionName: "Asia",
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
  },
  {
    id: "as_manila",
    name: "Manila",
    country: "Philippines",
    flag: "🇵🇭",
    region: "asia",
    regionName: "Asia",
    teamName: "Manila Bay Eagles",
    jerseyPrimary: "#1d428a",
    jerseySecondary: "#dc2626",
    shortsColor: "#1e3a8a",
    courtBorderColor: "#1e3a8a",
    courtKeyColor: "#facc15",
    arenaName: "Pearl of the Orient Coliseum",
    lat: 14.5995,
    lng: 120.9842,
    crowdChant: "PUSO MANILA! PUSO!",
  },
  {
    id: "as_beijing",
    name: "Beijing",
    country: "China",
    flag: "🇨🇳",
    region: "asia",
    regionName: "Asia",
    teamName: "Beijing Imperial Dragons",
    jerseyPrimary: "#b91c1c",
    jerseySecondary: "#facc15",
    shortsColor: "#7f1d1d",
    courtBorderColor: "#7f1d1d",
    courtKeyColor: "#facc15",
    arenaName: "Capital Dragon Pavilion",
    lat: 39.9042,
    lng: 116.4074,
    crowdChant: "IMPERIAL DRAGONS!",
  },
  {
    id: "as_seoul",
    name: "Seoul",
    country: "South Korea",
    flag: "🇰🇷",
    region: "asia",
    regionName: "Asia",
    teamName: "Seoul Neon Knights",
    jerseyPrimary: "#dc2626",
    jerseySecondary: "#2563eb",
    shortsColor: "#1e3a8a",
    courtBorderColor: "#1e3a8a",
    courtKeyColor: "#dc2626",
    arenaName: "Han River Arena (Seoul)",
    lat: 37.5665,
    lng: 126.978,
    crowdChant: "SEOUL KNIGHTS!",
  },
  {
    id: "as_taipei",
    name: "Taipei",
    country: "Taiwan",
    flag: "🇹🇼",
    region: "asia",
    regionName: "Asia",
    teamName: "Taipei Formosa Flyers",
    jerseyPrimary: "#0284c7",
    jerseySecondary: "#ffffff",
    shortsColor: "#0369a1",
    courtBorderColor: "#0369a1",
    courtKeyColor: "#0284c7",
    arenaName: "Taipei Summit Basketball Hall",
    lat: 25.033,
    lng: 121.5654,
    crowdChant: "FORMOSA FLYERS!",
  },
  {
    id: "as_mumbai",
    name: "Mumbai",
    country: "India",
    flag: "🇮🇳",
    region: "asia",
    regionName: "Asia",
    teamName: "Mumbai Monsoons",
    jerseyPrimary: "#ea580c",
    jerseySecondary: "#16a34a",
    shortsColor: "#1e3a8a",
    courtBorderColor: "#1e3a8a",
    courtKeyColor: "#ea580c",
    arenaName: "Marine Drive Hoops Dome",
    lat: 19.076,
    lng: 72.8777,
    crowdChant: "MUMBAI MONSOONS!",
  },

  // --- AUSTRALIA & OCEANIA ---
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
  },
  {
    id: "au_perth",
    name: "Perth",
    country: "Australia",
    flag: "🇦🇺",
    region: "australia",
    regionName: "Australia",
    teamName: "Perth Outback Phantoms",
    jerseyPrimary: "#dc2626",
    jerseySecondary: "#111827",
    shortsColor: "#000000",
    courtBorderColor: "#991b1b",
    courtKeyColor: "#dc2626",
    arenaName: "Swan River Arena (Perth)",
    lat: -31.9505,
    lng: 115.8605,
    crowdChant: "GO PHANTOMS GO!",
  },

  // --- EUROPE ---
  {
    id: "eu_paris",
    name: "Paris",
    country: "France",
    flag: "🇫🇷",
    region: "europe",
    regionName: "Europe",
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
  },
  {
    id: "eu_madrid",
    name: "Madrid",
    country: "Spain",
    flag: "🇪🇸",
    region: "europe",
    regionName: "Europe",
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
  },
  {
    id: "eu_belgrade",
    name: "Belgrade",
    country: "Serbia",
    flag: "🇷🇸",
    region: "europe",
    regionName: "Europe",
    teamName: "Belgrade Danube Wolves",
    jerseyPrimary: "#dc2626",
    jerseySecondary: "#ffffff",
    shortsColor: "#dc2626",
    courtBorderColor: "#991b1b",
    courtKeyColor: "#dc2626",
    arenaName: "Kalemegdan Fortress Arena",
    lat: 44.7866,
    lng: 20.4489,
    crowdChant: "BELGRADE WOLVES!",
  },
  {
    id: "eu_athens",
    name: "Athens",
    country: "Greece",
    flag: "🇬🇷",
    region: "europe",
    regionName: "Europe",
    teamName: "Athens Acropolis Spartans",
    jerseyPrimary: "#047857",
    jerseySecondary: "#ffffff",
    shortsColor: "#065f46",
    courtBorderColor: "#065f46",
    courtKeyColor: "#10b981",
    arenaName: "Aegean Marble Hall (Athens)",
    lat: 37.9838,
    lng: 23.7275,
    crowdChant: "SPARTANS OF ATHENS!",
  },
];

export const REGIONS_META = [
  { id: "all", label: "All Cities", icon: "Globe" },
  { id: "usa", label: "United States", icon: "Flag" },
  { id: "argentina", label: "Argentina", icon: "Sun" },
  { id: "central_america", label: "Central America", icon: "Compass" },
  { id: "africa", label: "Africa", icon: "Flame" },
  { id: "asia", label: "Asia", icon: "Sparkles" },
  { id: "australia", label: "Australia", icon: "MapPin" },
  { id: "europe", label: "Europe", icon: "Shield" },
];

export function getCityById(id: string): WorldCity {
  return WORLD_CITIES.find((c) => c.id === id) || WORLD_CITIES[0];
}

// ============================================================================
// WORLD TOUR 2.0 — INTERNATIONAL CUPS & TOURNAMENTS
// ============================================================================

export interface InternationalTournamentDef {
  id: string;
  name: string;
  trophyName: string;
  description: string;
  cityIds: string[]; // 8 participating global clubs
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
    description: "8 continental powerhouses battle in single-elimination knockout play for world supremacy.",
    cityIds: ["us_nyc", "ar_buenosaires", "eu_madrid", "eu_belgrade", "as_tokyo", "af_lagos", "au_sydney", "ca_mexicocity"],
    prizeXp: 650,
  },
  {
    id: "cup_pacific_rim",
    name: "Pacific Rim Invitational",
    trophyName: "Trans-Pacific Shield",
    description: "High-tempo shootout showcase featuring Asia, Oceania, and the North American West Coast.",
    cityIds: ["us_la", "us_sf", "as_tokyo", "as_manila", "as_seoul", "as_beijing", "au_sydney", "au_melbourne"],
    prizeXp: 500,
  },
  {
    id: "cup_euro_atlantic",
    name: "Euro-Atlantic Club Masters",
    trophyName: "Sovereign Continental Goblet",
    description: "Tactical half-court mastery pitting European capitals against Americas heavyweight clubs.",
    cityIds: ["eu_paris", "eu_madrid", "eu_belgrade", "eu_athens", "us_nyc", "us_chicago", "ar_buenosaires", "ca_sanjuan"],
    prizeXp: 550,
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

  // Feed winner to next bracket node
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
