import type { ProLeagueDivision } from "./leagueData.ts";
import { loadVersionedState, SAVE_KEYS, saveVersionedState } from "./saveSystem.ts";

export interface WorldCity {
  id: string;
  name: string;
  country: string;
  flag: string;
  region:
    | "usa"
    | "canada"
    | "brazil"
    | "mexico"
    | "france"
    | "spain"
    | "germany"
    | "italy"
    | "uk"
    | "serbia"
    | "greece"
    | "australia"
    | "china"
    | "japan"
    | "south_korea"
    | "philippines";
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

export interface NationalTeamDef {
  id: string;
  country: string;
  code: string;
  flag: string;
  region: WorldCity["region"];
  capitalCityId: string;
  mensTeamName: string;
  womensTeamName: string;
  mensCaptain: string;
  womensCaptain: string;
  mensOvr: number;
  womensOvr: number;
  primaryColor: string;
  secondaryColor: string;
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
  division?: ProLeagueDivision;
  isUser?: boolean;
}

export const GLOBAL_LEADERS_BASE: GlobalLeaderEntry[] = [
  { rank: 1, name: "Marcus 'Air' Vance", jerseyNumber: "#23", city: "New York City", country: "United States", flag: "🇺🇸", pts: 842, reb: 312, ast: 420, ppg: 34.2, division: "mens" },
  { rank: 2, name: "A'ja Mercer", jerseyNumber: "#22", city: "New York City", country: "United States", flag: "🇺🇸", pts: 828, reb: 348, ast: 310, ppg: 33.1, division: "womens" },
  { rank: 3, name: "Kaito Tanaka", jerseyNumber: "#30", city: "Tokyo", country: "Japan", flag: "🇯🇵", pts: 795, reb: 180, ast: 510, ppg: 31.8, division: "mens" },
  { rank: 4, name: "Sabrina Moreno", jerseyNumber: "#11", city: "Paris", country: "France", flag: "🇫🇷", pts: 774, reb: 215, ast: 448, ppg: 30.9, division: "womens" },
  { rank: 5, name: "Nikola Petrov", jerseyNumber: "#15", city: "Belgrade", country: "Serbia", flag: "🇷🇸", pts: 760, reb: 365, ast: 395, ppg: 30.4, division: "mens" },
  { rank: 6, name: "Mateo Silva", jerseyNumber: "#9", city: "Madrid", country: "Spain", flag: "🇪🇸", pts: 685, reb: 220, ast: 315, ppg: 27.4, division: "mens" },
  { rank: 7, name: "Yuki Takahashi", jerseyNumber: "#7", city: "Tokyo", country: "Japan", flag: "🇯🇵", pts: 664, reb: 194, ast: 388, ppg: 26.5, division: "womens" },
  { rank: 8, name: "Kai Santos", jerseyNumber: "#8", city: "Manila", country: "Philippines", flag: "🇵🇭", pts: 640, reb: 205, ast: 350, ppg: 25.6, division: "mens" },
];

export const NATIONAL_TEAMS_16: NationalTeamDef[] = [
  { id: "nat_usa", country: "United States", code: "USA", flag: "🇺🇸", region: "usa", capitalCityId: "us_nyc", mensTeamName: "USA Basketball Men's National", womensTeamName: "USA Basketball Women's National", mensCaptain: "Marcus Vance", womensCaptain: "Breanna Sterling", mensOvr: 94, womensOvr: 95, primaryColor: "#0a2240", secondaryColor: "#dc2626" },
  { id: "nat_can", country: "Canada", code: "CAN", flag: "🇨🇦", region: "canada", capitalCityId: "ca_toronto", mensTeamName: "Canada Red & White", womensTeamName: "Team Canada Women", mensCaptain: "Shai Brooks", womensCaptain: "Nadia Bouchard", mensOvr: 90, womensOvr: 88, primaryColor: "#ce1141", secondaryColor: "#ffffff" },
  { id: "nat_bra", country: "Brazil", code: "BRA", flag: "🇧🇷", region: "brazil", capitalCityId: "br_rio", mensTeamName: "Seleção Brasileira", womensTeamName: "Seleção Feminina", mensCaptain: "Mateus Silva", womensCaptain: "Kamilla Cardoso-Lima", mensOvr: 85, womensOvr: 86, primaryColor: "#16a34a", secondaryColor: "#facc15" },
  { id: "nat_mex", country: "Mexico", code: "MEX", flag: "🇲🇽", region: "mexico", capitalCityId: "mx_mexico", mensTeamName: "México Guerreros", womensTeamName: "México Águilas", mensCaptain: "Emilio Navarro", womensCaptain: "Sofia Delgado", mensOvr: 83, womensOvr: 82, primaryColor: "#006847", secondaryColor: "#ce1126" },
  { id: "nat_fra", country: "France", code: "FRA", flag: "🇫🇷", region: "france", capitalCityId: "fr_paris", mensTeamName: "Les Bleus National", womensTeamName: "Les Bleues National", mensCaptain: "Victor Fontaine", womensCaptain: "Marine Benoit", mensOvr: 91, womensOvr: 91, primaryColor: "#1d4ed8", secondaryColor: "#f8fafc" },
  { id: "nat_esp", country: "Spain", code: "ESP", flag: "🇪🇸", region: "spain", capitalCityId: "es_madrid", mensTeamName: "España La Roja", womensTeamName: "España Femenina", mensCaptain: "Mateo Alcaraz", womensCaptain: "Alba Torrens-Cruz", mensOvr: 89, womensOvr: 89, primaryColor: "#dc2626", secondaryColor: "#facc15" },
  { id: "nat_ger", country: "Germany", code: "GER", flag: "🇩🇪", region: "germany", capitalCityId: "de_berlin", mensTeamName: "Deutschland Adler", womensTeamName: "Deutschland Damen", mensCaptain: "Dennis Kessler", womensCaptain: "Satou Lindholm", mensOvr: 90, womensOvr: 87, primaryColor: "#111827", secondaryColor: "#fbbf24" },
  { id: "nat_ita", country: "Italy", code: "ITA", flag: "🇮🇹", region: "italy", capitalCityId: "it_milan", mensTeamName: "Italia Azzurri", womensTeamName: "Italia Azzurre", mensCaptain: "Marco Gallinari", womensCaptain: "Chiara Moretti", mensOvr: 86, womensOvr: 85, primaryColor: "#0284c7", secondaryColor: "#ffffff" },
  { id: "nat_gbr", country: "United Kingdom", code: "GBR", flag: "🇬🇧", region: "uk", capitalCityId: "uk_london", mensTeamName: "Great Britain Lions", womensTeamName: "Great Britain Lionesses", mensCaptain: "Tariq Chambers", womensCaptain: "Amara Prescott", mensOvr: 84, womensOvr: 83, primaryColor: "#1e3a8a", secondaryColor: "#dc2626" },
  { id: "nat_srb", country: "Serbia", code: "SRB", flag: "🇷🇸", region: "serbia", capitalCityId: "rs_belgrade", mensTeamName: "Srbija Orlovi", womensTeamName: "Srbija Orlice", mensCaptain: "Nikola Petrov", womensCaptain: "Jelena Kovacs", mensOvr: 92, womensOvr: 88, primaryColor: "#b91c1c", secondaryColor: "#1e40af" },
  { id: "nat_gre", country: "Greece", code: "GRE", flag: "🇬🇷", region: "greece", capitalCityId: "gr_athens", mensTeamName: "Hellas Ethniki", womensTeamName: "Hellas Women's National", mensCaptain: "Giannis Vlahos", womensCaptain: "Elena Papadopoulos", mensOvr: 89, womensOvr: 84, primaryColor: "#0369a1", secondaryColor: "#ffffff" },
  { id: "nat_aus", country: "Australia", code: "AUS", flag: "🇦🇺", region: "australia", capitalCityId: "au_sydney", mensTeamName: "Australia Boomers", womensTeamName: "Australia Opals", mensCaptain: "Patty Gallagher", womensCaptain: "Ezi Magbegor-Park", mensOvr: 89, womensOvr: 91, primaryColor: "#047857", secondaryColor: "#facc15" },
  { id: "nat_chn", country: "China", code: "CHN", flag: "🇨🇳", region: "china", capitalCityId: "cn_shanghai", mensTeamName: "Team China Dragons", womensTeamName: "China Golden Phoenix", mensCaptain: "Zhou Yao", womensCaptain: "Mei Han", mensOvr: 84, womensOvr: 89, primaryColor: "#dc2626", secondaryColor: "#facc15" },
  { id: "nat_jpn", country: "Japan", code: "JPN", flag: "🇯🇵", region: "japan", capitalCityId: "jp_tokyo", mensTeamName: "Akatsuki Japan Men", womensTeamName: "Akatsuki Japan Women", mensCaptain: "Kaito Tanaka", womensCaptain: "Yuki Takahashi", mensOvr: 86, womensOvr: 89, primaryColor: "#dc2626", secondaryColor: "#111827" },
  { id: "nat_kor", country: "South Korea", code: "KOR", flag: "🇰🇷", region: "south_korea", capitalCityId: "kr_seoul", mensTeamName: "Korea Taegeuk Men", womensTeamName: "Korea Taegeuk Women", mensCaptain: "Hyun-Joon Park", womensCaptain: "Jisoo Kim", mensOvr: 83, womensOvr: 85, primaryColor: "#1d4ed8", secondaryColor: "#ef4444" },
  { id: "nat_phl", country: "Philippines", code: "PHL", flag: "🇵🇭", region: "philippines", capitalCityId: "ph_manila", mensTeamName: "Gilas Pilipinas Men", womensTeamName: "Gilas Pilipinas Women", mensCaptain: "Kai Bautista", womensCaptain: "Camila Reyes", mensOvr: 84, womensOvr: 83, primaryColor: "#1e40af", secondaryColor: "#facc15" },
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
    teamName: "Harbor Sentinels",
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
    ballStamp: "USA BOSTON",
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

  // --- MEXICO ---
  {
    id: "mx_mexico",
    name: "Mexico City",
    country: "Mexico",
    flag: "🇲🇽",
    region: "mexico",
    regionName: "Mexico",
    teamName: "Ciudad Azteca Guerreros",
    jerseyPrimary: "#006847",
    jerseySecondary: "#ce1126",
    shortsColor: "#004d33",
    courtBorderColor: "#004d33",
    courtKeyColor: "#ce1126",
    arenaName: "Arena Ciudad de México",
    lat: 19.4326,
    lng: -99.1332,
    crowdChant: "MÉXICO! MÉXICO! GUERREROS!",
    ballBaseHex: "#006847",
    ballSeamHex: "#f8fafc",
    ballStamp: "MÉXICO CDMX",
  },
  {
    id: "mx_guadalajara",
    name: "Guadalajara",
    country: "Mexico",
    flag: "🇲🇽",
    region: "mexico",
    regionName: "Mexico",
    teamName: "Jalisco Águilas Reales",
    jerseyPrimary: "#ce1126",
    jerseySecondary: "#fbbf24",
    shortsColor: "#111827",
    courtBorderColor: "#991b1b",
    courtKeyColor: "#006847",
    arenaName: "Estadio Panamericano Arena",
    lat: 20.6597,
    lng: -103.3496,
    crowdChant: "ARRIBA JALISCO!",
    ballBaseHex: "#ce1126",
    ballSeamHex: "#fbbf24",
    ballStamp: "MÉXICO GDL",
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
    jerseySecondary: "#3b82f6",
    shortsColor: "#111827",
    courtBorderColor: "#1f2937",
    courtKeyColor: "#3b82f6",
    arenaName: "Lumière Grand Palais (Paris)",
    lat: 48.8566,
    lng: 2.3522,
    crowdChant: "ALLEZ PARIS! LES BLEUS!",
    ballBaseHex: "#1d3557",
    ballSeamHex: "#e9c46a",
    ballStamp: "FRANCE PARIS",
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
    ballSeamHex: "#ffffff",
    ballStamp: "RHÔNE LYON",
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
    crowdChant: "VAMOS MADRID! ESPAÑA!",
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
    teamName: "Barcelona Blaugrana",
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

  // --- GERMANY ---
  {
    id: "de_berlin",
    name: "Berlin",
    country: "Germany",
    flag: "🇩🇪",
    region: "germany",
    regionName: "Germany",
    teamName: "Berlin Brandenburg Eagles",
    jerseyPrimary: "#111827",
    jerseySecondary: "#fbbf24",
    shortsColor: "#111827",
    courtBorderColor: "#78350f",
    courtKeyColor: "#dc2626",
    arenaName: "Spreewelt Olympic Arena (Berlin)",
    lat: 52.52,
    lng: 13.405,
    crowdChant: "DEUTSCHLAND! BERLIN VOR!",
    ballBaseHex: "#18181b",
    ballSeamHex: "#fbbf24",
    ballStamp: "GERMANY PRO",
  },
  {
    id: "de_munich",
    name: "Munich",
    country: "Germany",
    flag: "🇩🇪",
    region: "germany",
    regionName: "Germany",
    teamName: "Munich Bavaria Lions",
    jerseyPrimary: "#b91c1c",
    jerseySecondary: "#ffffff",
    shortsColor: "#991b1b",
    courtBorderColor: "#7f1d1d",
    courtKeyColor: "#dc2626",
    arenaName: "Isar Park SAP Pavilion (Munich)",
    lat: 48.1351,
    lng: 11.582,
    crowdChant: "MIA SAN BASKETBALL! MÜNCHEN!",
    ballBaseHex: "#b91c1c",
    ballSeamHex: "#f8fafc",
    ballStamp: "BAYERN MÜNCHEN",
  },

  // --- ITALY ---
  {
    id: "it_milan",
    name: "Milan",
    country: "Italy",
    flag: "🇮🇹",
    region: "italy",
    regionName: "Italy",
    teamName: "Milano Azzurri Crown",
    jerseyPrimary: "#0284c7",
    jerseySecondary: "#ffffff",
    shortsColor: "#0369a1",
    courtBorderColor: "#0c4a6e",
    courtKeyColor: "#0284c7",
    arenaName: "Lombardia Fashion Forum (Milan)",
    lat: 45.4642,
    lng: 9.19,
    crowdChant: "FORZA AZZURRI! MILANO!",
    ballBaseHex: "#0284c7",
    ballSeamHex: "#ffffff",
    ballStamp: "ITALIA MILANO",
  },
  {
    id: "it_rome",
    name: "Rome",
    country: "Italy",
    flag: "🇮🇹",
    region: "italy",
    regionName: "Italy",
    teamName: "Roma Gladiators",
    jerseyPrimary: "#881337",
    jerseySecondary: "#facc15",
    shortsColor: "#4c0519",
    courtBorderColor: "#4c0519",
    courtKeyColor: "#ca8a04",
    arenaName: "Foro Italico Coliseum (Rome)",
    lat: 41.9028,
    lng: 12.4964,
    crowdChant: "FORZA ROMA! GLADIATORI!",
    ballBaseHex: "#881337",
    ballSeamHex: "#facc15",
    ballStamp: "ITALIA ROMA",
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
    ballSeamHex: "#dc2626",
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
    crowdChant: "MANCHESTER ROAR!",
    ballBaseHex: "#1d428a",
    ballSeamHex: "#f59e0b",
    ballStamp: "UK MANCHESTER",
  },

  // --- SERBIA ---
  {
    id: "rs_belgrade",
    name: "Belgrade",
    country: "Serbia",
    flag: "🇷🇸",
    region: "serbia",
    regionName: "Serbia",
    teamName: "Beograd White Eagles",
    jerseyPrimary: "#b91c1c",
    jerseySecondary: "#1e40af",
    shortsColor: "#1e3a8a",
    courtBorderColor: "#7f1d1d",
    courtKeyColor: "#1d4ed8",
    arenaName: "Štark Danube Fortress (Belgrade)",
    lat: 44.7866,
    lng: 20.4489,
    crowdChant: "SRBIJA! SRBIJA! ORLOVI!",
    ballBaseHex: "#b91c1c",
    ballSeamHex: "#f8fafc",
    ballStamp: "SERBIA BEOGRAD",
  },

  // --- GREECE ---
  {
    id: "gr_athens",
    name: "Athens",
    country: "Greece",
    flag: "🇬🇷",
    region: "greece",
    regionName: "Greece",
    teamName: "Athens Acropolis Titans",
    jerseyPrimary: "#0369a1",
    jerseySecondary: "#ffffff",
    shortsColor: "#0c4a6e",
    courtBorderColor: "#0c4a6e",
    courtKeyColor: "#0284c7",
    arenaName: "OAKA Olympic Marble Dome (Athens)",
    lat: 37.9838,
    lng: 23.7275,
    crowdChant: "HELLAS! HELLAS! ATHENS!",
    ballBaseHex: "#0369a1",
    ballSeamHex: "#ffffff",
    ballStamp: "GREECE HELLAS",
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
    jerseyPrimary: "#047857",
    jerseySecondary: "#facc15",
    shortsColor: "#064e3b",
    courtBorderColor: "#064e3b",
    courtKeyColor: "#facc15",
    arenaName: "Harbour Bridge Arena (Sydney)",
    lat: -33.8688,
    lng: 151.2093,
    crowdChant: "AUSSIE! AUSSIE! HARBOUR SOVEREIGNS!",
    ballBaseHex: "#047857",
    ballSeamHex: "#facc15",
    ballStamp: "AUSTRALIA GOLD",
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

  // --- CHINA ---
  {
    id: "cn_shanghai",
    name: "Shanghai",
    country: "China",
    flag: "🇨🇳",
    region: "china",
    regionName: "China",
    teamName: "Shanghai Golden Dragons",
    jerseyPrimary: "#dc2626",
    jerseySecondary: "#facc15",
    shortsColor: "#991b1b",
    courtBorderColor: "#7f1d1d",
    courtKeyColor: "#facc15",
    arenaName: "Pudong Pearl Harbor Arena (Shanghai)",
    lat: 31.2304,
    lng: 121.4737,
    crowdChant: "JIAYOU CHINA! SHANGHAI DRAGONS!",
    ballBaseHex: "#dc2626",
    ballSeamHex: "#facc15",
    ballStamp: "CHINA SHANGHAI",
  },
  {
    id: "cn_beijing",
    name: "Beijing",
    country: "China",
    flag: "🇨🇳",
    region: "china",
    regionName: "China",
    teamName: "Beijing Imperial Ducks",
    jerseyPrimary: "#1e3a8a",
    jerseySecondary: "#facc15",
    shortsColor: "#172554",
    courtBorderColor: "#991b1b",
    courtKeyColor: "#1d4ed8",
    arenaName: "Wukesong Grand Pavilion (Beijing)",
    lat: 39.9042,
    lng: 116.4074,
    crowdChant: "BEIJING! JIAYOU!",
    ballBaseHex: "#b91c1c",
    ballSeamHex: "#fde047",
    ballStamp: "CHINA BEIJING",
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
    arenaName: "Shibuya Sky Gymnasium (Tokyo)",
    lat: 35.6762,
    lng: 139.6503,
    crowdChant: "AKATSUKI JAPAN! TOKYO!",
    ballBaseHex: "#d62828",
    ballSeamHex: "#111111",
    ballStamp: "NIPPON TOKYO",
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
    arenaName: "Namba Electric Dome (Osaka)",
    lat: 34.6937,
    lng: 135.5022,
    crowdChant: "KANSAI SPIRIT! OSAKA!",
    ballBaseHex: "#1d428a",
    ballSeamHex: "#facc15",
    ballStamp: "OSAKA KANSAI",
  },

  // --- SOUTH KOREA ---
  {
    id: "kr_seoul",
    name: "Seoul",
    country: "South Korea",
    flag: "🇰🇷",
    region: "south_korea",
    regionName: "South Korea",
    teamName: "Seoul Taegeuk Tigers",
    jerseyPrimary: "#1d4ed8",
    jerseySecondary: "#ef4444",
    shortsColor: "#0f172a",
    courtBorderColor: "#1e3a8a",
    courtKeyColor: "#dc2626",
    arenaName: "Jamsil Han River Arena (Seoul)",
    lat: 37.5665,
    lng: 126.978,
    crowdChant: "DAEHAN MINGUK! SEOUL!",
    ballBaseHex: "#1d4ed8",
    ballSeamHex: "#ef4444",
    ballStamp: "KOREA SEOUL",
  },

  // --- PHILIPPINES ---
  {
    id: "ph_manila",
    name: "Manila",
    country: "Philippines",
    flag: "🇵🇭",
    region: "philippines",
    regionName: "Philippines",
    teamName: "Manila Gilas Kings",
    jerseyPrimary: "#1e40af",
    jerseySecondary: "#facc15",
    shortsColor: "#1e3a8a",
    courtBorderColor: "#172554",
    courtKeyColor: "#dc2626",
    arenaName: "Araneta Mall of Asia Dome (Manila)",
    lat: 14.5995,
    lng: 120.9842,
    crowdChant: "PUSO! GILAS PILIPINAS! MANILA!",
    ballBaseHex: "#1e40af",
    ballSeamHex: "#facc15",
    ballStamp: "PILIPINAS MANILA",
  },
];

export const REGIONS_META = [
  { id: "all", label: "All 16 Countries", icon: "Globe" },
  { id: "usa", label: "🇺🇸 United States", icon: "Flag" },
  { id: "canada", label: "🇨🇦 Canada", icon: "Compass" },
  { id: "brazil", label: "🇧🇷 Brazil", icon: "Sun" },
  { id: "mexico", label: "🇲🇽 Mexico", icon: "Sun" },
  { id: "france", label: "🇫🇷 France", icon: "Shield" },
  { id: "spain", label: "🇪🇸 Spain", icon: "Flame" },
  { id: "germany", label: "🇩🇪 Germany", icon: "Shield" },
  { id: "italy", label: "🇮🇹 Italy", icon: "Award" },
  { id: "uk", label: "🇬🇧 United Kingdom", icon: "Award" },
  { id: "serbia", label: "🇷🇸 Serbia", icon: "Trophy" },
  { id: "greece", label: "🇬🇷 Greece", icon: "Shield" },
  { id: "australia", label: "🇦🇺 Australia", icon: "MapPin" },
  { id: "china", label: "🇨🇳 China", icon: "Flame" },
  { id: "japan", label: "🇯🇵 Japan", icon: "Sparkles" },
  { id: "south_korea", label: "🇰🇷 South Korea", icon: "Zap" },
  { id: "philippines", label: "🇵🇭 Philippines", icon: "Flame" },
];

export function getCityById(id: string): WorldCity {
  return WORLD_CITIES.find((c) => c.id === id) || WORLD_CITIES[0];
}

// Tournament & Leaderboard support
export interface InternationalTournamentDef {
  id: string;
  name: string;
  trophyName: string;
  division: ProLeagueDivision;
  description: string;
  cityIds: string[]; // 8 or 16
  prizeXp: number;
}

export interface TournamentMatchNode {
  id: string;
  round: "round16" | "quarterfinal" | "semifinal" | "final";
  slot: number;
  homeCityId: string | null;
  awayCityId: string | null;
  homeScore: number;
  awayScore: number;
  winnerCityId: string | null;
}

export interface WorldTourTournamentState {
  division?: ProLeagueDivision;
  activeTournamentId: string;
  userCityId: string;
  matches: TournamentMatchNode[];
  championCityId: string | null;
  trophiesWon: { tournamentId: string; tournamentName: string; cityId: string; division?: ProLeagueDivision; dateIso: string }[];
  intlWins?: number;
  intlLosses?: number;
}

const ALL_16_NATIONAL_CAPITALS = NATIONAL_TEAMS_16.map((n) => n.capitalCityId);

export const GLOBAL_TOURNAMENTS: InternationalTournamentDef[] = [
  {
    id: "cup_global_nations",
    name: "Apex Global Nations Cup",
    trophyName: "Golden Globe Trophy",
    division: "mens",
    description: "8 iconic basketball nations battle in single-elimination knockout play for global supremacy.",
    cityIds: ["us_nyc", "jp_tokyo", "fr_paris", "br_rio", "ca_toronto", "uk_london", "au_sydney", "es_madrid"],
    prizeXp: 650,
  },
  {
    id: "cup_mens_world_16",
    name: "Men's World Basketball Championship",
    trophyName: "Global Crown Naismith Cup",
    division: "mens",
    description: "Full 16-nation Men's International Championship bracket spanning Americas, Europe, and Asia-Pacific.",
    cityIds: ALL_16_NATIONAL_CAPITALS,
    prizeXp: 1200,
  },
  {
    id: "cup_womens_nations",
    name: "Women's International Nations Cup",
    trophyName: "Aurora World Nations Trophy",
    division: "womens",
    description: "8 top Women's National Teams face off in an elite international knockout showcase.",
    cityIds: ["us_nyc", "au_sydney", "fr_paris", "jp_tokyo", "es_madrid", "cn_shanghai", "ca_toronto", "rs_belgrade"],
    prizeXp: 750,
  },
  {
    id: "cup_womens_world_16",
    name: "Women's World Basketball Championship",
    trophyName: "Sovereign Empress World Cup",
    division: "womens",
    description: "Full 16-nation Women's International Championship tournament with gold medal ceremony & stats.",
    cityIds: ALL_16_NATIONAL_CAPITALS,
    prizeXp: 1200,
  },
];

export function createTournamentBracket(
  tournamentId: string,
  userCityId: string,
  prevTrophies: WorldTourTournamentState["trophiesWon"] = [],
  division?: ProLeagueDivision
): WorldTourTournamentState {
  const def = GLOBAL_TOURNAMENTS.find((t) => t.id === tournamentId) || GLOBAL_TOURNAMENTS[0];
  const resolvedDivision = division || def.division;
  const pool = [...def.cityIds];
  if (!pool.includes(userCityId)) {
    pool[0] = userCityId;
  }

  let matches: TournamentMatchNode[];

  if (pool.length === 16) {
    // 16-nation Round of 16 -> QF -> SF -> Final (15 matches)
    const r16: TournamentMatchNode[] = [];
    for (let s = 0; s < 8; s++) {
      r16.push({
        id: `r16_${s}`,
        round: "round16",
        slot: s,
        homeCityId: pool[s],
        awayCityId: pool[15 - s],
        homeScore: 0,
        awayScore: 0,
        winnerCityId: null,
      });
    }
    const qf: TournamentMatchNode[] = [0, 1, 2, 3].map((slot) => ({
      id: `qf_${slot}`,
      round: "quarterfinal",
      slot,
      homeCityId: null,
      awayCityId: null,
      homeScore: 0,
      awayScore: 0,
      winnerCityId: null,
    }));
    const sf: TournamentMatchNode[] = [0, 1].map((slot) => ({
      id: `sf_${slot}`,
      round: "semifinal",
      slot,
      homeCityId: null,
      awayCityId: null,
      homeScore: 0,
      awayScore: 0,
      winnerCityId: null,
    }));
    const fin: TournamentMatchNode[] = [
      { id: "fin_0", round: "final", slot: 0, homeCityId: null, awayCityId: null, homeScore: 0, awayScore: 0, winnerCityId: null },
    ];
    matches = [...r16, ...qf, ...sf, ...fin];
  } else {
    // 8-team Quarterfinals -> Semis -> Final (7 matches)
    matches = [
      { id: "qf_0", round: "quarterfinal", slot: 0, homeCityId: pool[0], awayCityId: pool[7], homeScore: 0, awayScore: 0, winnerCityId: null },
      { id: "qf_1", round: "quarterfinal", slot: 1, homeCityId: pool[3], awayCityId: pool[4], homeScore: 0, awayScore: 0, winnerCityId: null },
      { id: "qf_2", round: "quarterfinal", slot: 2, homeCityId: pool[2], awayCityId: pool[5], homeScore: 0, awayScore: 0, winnerCityId: null },
      { id: "qf_3", round: "quarterfinal", slot: 3, homeCityId: pool[1], awayCityId: pool[6], homeScore: 0, awayScore: 0, winnerCityId: null },
      { id: "sf_0", round: "semifinal", slot: 0, homeCityId: null, awayCityId: null, homeScore: 0, awayScore: 0, winnerCityId: null },
      { id: "sf_1", round: "semifinal", slot: 1, homeCityId: null, awayCityId: null, homeScore: 0, awayScore: 0, winnerCityId: null },
      { id: "fin_0", round: "final", slot: 0, homeCityId: null, awayCityId: null, homeScore: 0, awayScore: 0, winnerCityId: null },
    ];
  }

  return {
    division: resolvedDivision,
    activeTournamentId: def.id,
    userCityId,
    matches,
    championCityId: null,
    trophiesWon: prevTrophies,
    intlWins: 0,
    intlLosses: 0,
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

  if (target.round === "round16") {
    const qf = matches.find((m) => m.round === "quarterfinal" && m.slot === Math.floor(target.slot / 2));
    if (qf) {
      if (target.slot % 2 === 0) qf.homeCityId = target.winnerCityId;
      else qf.awayCityId = target.winnerCityId;
    }
  } else if (target.round === "quarterfinal") {
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

  const userInvolved = target.homeCityId === state.userCityId || target.awayCityId === state.userCityId;
  const userWon = userInvolved && target.winnerCityId === state.userCityId;
  const intlWins = (state.intlWins || 0) + (userWon ? 1 : 0);
  const intlLosses = (state.intlLosses || 0) + (userInvolved && !userWon ? 1 : 0);

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
        division: state.division || def?.division || "mens",
        dateIso: new Date().toISOString(),
      },
    ];
  }

  return {
    ...state,
    matches,
    championCityId,
    trophiesWon,
    intlWins,
    intlLosses,
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

export function loadWorldTourTournamentState(division: ProLeagueDivision = "mens"): WorldTourTournamentState {
  const key = division === "womens" ? SAVE_KEYS.WORLD_TOUR_WOMENS : SAVE_KEYS.WORLD_TOUR_V2;
  const defaultTournament = division === "womens" ? "cup_womens_world_16" : "cup_global_nations";
  const loaded = loadVersionedState<WorldTourTournamentState>(
    key,
    () => createTournamentBracket(defaultTournament, "us_nyc", [], division),
    (d): d is WorldTourTournamentState =>
      Boolean(d && typeof d === "object" && Array.isArray((d as WorldTourTournamentState).matches))
  ).data;
  return {
    ...loaded,
    division: loaded.division || division,
  };
}

export function saveWorldTourTournamentState(state: WorldTourTournamentState, division?: ProLeagueDivision): void {
  const div = division || state.division || "mens";
  const key = div === "womens" ? SAVE_KEYS.WORLD_TOUR_WOMENS : SAVE_KEYS.WORLD_TOUR_V2;
  saveVersionedState(key, { ...state, division: div });
}
