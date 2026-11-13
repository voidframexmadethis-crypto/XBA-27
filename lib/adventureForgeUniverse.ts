import { loadVersionedState, SAVE_KEYS, saveVersionedState } from "./saveSystem";

export type PropertyType = "apartment" | "condo" | "loft" | "penthouse" | "mansion";
export type VehicleType = "sedan" | "sports_car" | "suv" | "supercar" | "motorcycle";
export type BusinessType = "restaurant" | "retail_store" | "gym" | "sportswear_brand" | "basketball_academy";

export interface OwnedProperty {
  id: string;
  name: string;
  type: PropertyType;
  district: string;
  purchasePriceK: number;
  dailyUpkeepK: number;
  comfortRating: number;
  imageTag: string;
  owned: boolean;
}

export interface OwnedVehicle {
  id: string;
  name: string;
  type: VehicleType;
  purchasePriceK: number;
  topSpeedMph: number;
  styleScore: number;
  owned: boolean;
}

export interface OwnedBusiness {
  id: string;
  name: string;
  type: BusinessType;
  district: string;
  costK: number;
  dailyRevenueK: number;
  dailyExpenseK: number;
  level: number;
  employees: number;
  reputation: number;
  owned: boolean;
}

export interface UniverseCalendarEvent {
  dayIndex: number;
  title: string;
  category: "match" | "draft" | "all_star" | "business" | "festival";
  description: string;
}

export interface AdventureForgeUniverseState {
  currentDay: number;
  seasonYear: number;
  bankCashK: number;
  properties: OwnedProperty[];
  vehicles: OwnedVehicle[];
  businesses: OwnedBusiness[];
  calendar: UniverseCalendarEvent[];
  lifestyleReputation: number;
  socialConnectionsCount: number;
}

export const INITIAL_PROPERTIES: OwnedProperty[] = [
  {
    id: "prop_downtown_apt",
    name: "Skyline Studio Apartment",
    type: "apartment",
    district: "Downtown Core",
    purchasePriceK: 350,
    dailyUpkeepK: 0.8,
    comfortRating: 68,
    imageTag: "downtown_apt",
    owned: true,
  },
  {
    id: "prop_waterfront_condo",
    name: "Harbor View Luxury Condo",
    type: "condo",
    district: "Waterfront Marina",
    purchasePriceK: 1200,
    dailyUpkeepK: 2.5,
    comfortRating: 85,
    imageTag: "waterfront_condo",
    owned: false,
  },
  {
    id: "prop_tribeca_loft",
    name: "Tribeca Artist Loft",
    type: "loft",
    district: "Arts District",
    purchasePriceK: 2400,
    dailyUpkeepK: 4.2,
    comfortRating: 92,
    imageTag: "tribeca_loft",
    owned: false,
  },
  {
    id: "prop_beverly_mansion",
    name: "Sovereign Hills Estate Mansion",
    type: "mansion",
    district: "Sovereign Hills",
    purchasePriceK: 8500,
    dailyUpkeepK: 12.0,
    comfortRating: 99,
    imageTag: "beverly_mansion",
    owned: false,
  },
];

export const INITIAL_VEHICLES: OwnedVehicle[] = [
  {
    id: "veh_street_sedan",
    name: "Apex Velocity Executive Sedan",
    type: "sedan",
    purchasePriceK: 65,
    topSpeedMph: 145,
    styleScore: 70,
    owned: true,
  },
  {
    id: "veh_sport_coupe",
    name: "Viper GT Sport Coupe",
    type: "sports_car",
    purchasePriceK: 180,
    topSpeedMph: 195,
    styleScore: 88,
    owned: false,
  },
  {
    id: "veh_exotic_hypercar",
    name: "Sovereign Apex Hypercar",
    type: "supercar",
    purchasePriceK: 850,
    topSpeedMph: 242,
    styleScore: 98,
    owned: false,
  },
  {
    id: "veh_luxury_suv",
    name: "Titan Armor SUV",
    type: "suv",
    purchasePriceK: 140,
    topSpeedMph: 135,
    styleScore: 82,
    owned: false,
  },
];

export const INITIAL_BUSINESSES: OwnedBusiness[] = [
  {
    id: "biz_court_cafe",
    name: "Hoops & Espresso Cafe",
    type: "restaurant",
    district: "Downtown Core",
    costK: 250,
    dailyRevenueK: 4.5,
    dailyExpenseK: 2.1,
    level: 1,
    employees: 6,
    reputation: 74,
    owned: false,
  },
  {
    id: "biz_sneaker_boutique",
    name: "Apex Kicks Flagship Store",
    type: "retail_store",
    district: "Fashion District",
    costK: 600,
    dailyRevenueK: 11.2,
    dailyExpenseK: 5.4,
    level: 1,
    employees: 12,
    reputation: 82,
    owned: false,
  },
  {
    id: "biz_pro_gym",
    name: "Sovereign Elite Athletic Gym",
    type: "gym",
    district: "Sports Complex",
    costK: 1500,
    dailyRevenueK: 26.5,
    dailyExpenseK: 12.0,
    level: 1,
    employees: 20,
    reputation: 89,
    owned: false,
  },
  {
    id: "biz_sportswear_co",
    name: "Apex Global Sportswear Brand",
    type: "sportswear_brand",
    district: "Corporate Center",
    costK: 5000,
    dailyRevenueK: 85.0,
    dailyExpenseK: 34.0,
    level: 1,
    employees: 65,
    reputation: 94,
    owned: false,
  },
];

export const INITIAL_CALENDAR: UniverseCalendarEvent[] = [
  { dayIndex: 1, title: "Season Opening Tip-Off", category: "match", description: "Official start of the APBA / WPBA professional basketball season." },
  { dayIndex: 15, title: "Rookie Showcase & Combine", category: "draft", description: "Top prospects display skills for franchise scouts." },
  { dayIndex: 30, title: "Global All-Star Weekend", category: "all_star", description: "3-Point Contest, Dunk Championship & Global All-Star Game." },
  { dayIndex: 45, title: "Business Investor Summit", category: "business", description: "Collect partnership dividends and expand corporate holdings." },
  { dayIndex: 60, title: "Championship Finals & Parade", category: "festival", description: "Sovereign Cup Finals and city-wide championship celebration." },
];

export function createInitialUniverseState(): AdventureForgeUniverseState {
  return {
    currentDay: 1,
    seasonYear: 2027,
    bankCashK: 3500, // $3.5M starting liquidity
    properties: INITIAL_PROPERTIES.map((p) => ({ ...p })),
    vehicles: INITIAL_VEHICLES.map((v) => ({ ...v })),
    businesses: INITIAL_BUSINESSES.map((b) => ({ ...b })),
    calendar: [...INITIAL_CALENDAR],
    lifestyleReputation: 120,
    socialConnectionsCount: 14,
  };
}

export function loadUniverseState(): AdventureForgeUniverseState {
  return loadVersionedState<AdventureForgeUniverseState>(
    SAVE_KEYS.UNIVERSE_V1,
    createInitialUniverseState,
    (d): d is AdventureForgeUniverseState =>
      Boolean(d && typeof d === "object" && Array.isArray((d as AdventureForgeUniverseState).properties))
  ).data;
}

export function saveUniverseState(state: AdventureForgeUniverseState): void {
  saveVersionedState(SAVE_KEYS.UNIVERSE_V1, state);
}

export function advanceUniverseDay(state: AdventureForgeUniverseState): AdventureForgeUniverseState {
  const dailyPropertyUpkeep = state.properties.filter((p) => p.owned).reduce((sum, p) => sum + p.dailyUpkeepK, 0);
  const dailyBusinessNet = state.businesses
    .filter((b) => b.owned)
    .reduce((sum, b) => sum + (b.dailyRevenueK - b.dailyExpenseK) * (1 + b.level * 0.15), 0);

  const netCashChange = Math.round(dailyBusinessNet - dailyPropertyUpkeep + 25); // daily salary stipend
  const nextCash = Math.max(0, state.bankCashK + netCashChange);

  return {
    ...state,
    currentDay: state.currentDay + 1,
    bankCashK: nextCash,
  };
}

export function buyProperty(state: AdventureForgeUniverseState, propId: string): AdventureForgeUniverseState {
  const target = state.properties.find((p) => p.id === propId);
  if (!target || target.owned || state.bankCashK < target.purchasePriceK) return state;
  return {
    ...state,
    bankCashK: state.bankCashK - target.purchasePriceK,
    lifestyleReputation: state.lifestyleReputation + 25,
    properties: state.properties.map((p) => (p.id === propId ? { ...p, owned: true } : p)),
  };
}

export function buyVehicle(state: AdventureForgeUniverseState, vehId: string): AdventureForgeUniverseState {
  const target = state.vehicles.find((v) => v.id === vehId);
  if (!target || target.owned || state.bankCashK < target.purchasePriceK) return state;
  return {
    ...state,
    bankCashK: state.bankCashK - target.purchasePriceK,
    lifestyleReputation: state.lifestyleReputation + 15,
    vehicles: state.vehicles.map((v) => (v.id === vehId ? { ...v, owned: true } : v)),
  };
}

export function buyOrUpgradeBusiness(state: AdventureForgeUniverseState, bizId: string): AdventureForgeUniverseState {
  const target = state.businesses.find((b) => b.id === bizId);
  if (!target) return state;
  if (!target.owned) {
    if (state.bankCashK < target.costK) return state;
    return {
      ...state,
      bankCashK: state.bankCashK - target.costK,
      lifestyleReputation: state.lifestyleReputation + 40,
      businesses: state.businesses.map((b) => (b.id === bizId ? { ...b, owned: true } : b)),
    };
  } else {
    const upgradeCost = Math.round(target.costK * 0.5 * target.level);
    if (state.bankCashK < upgradeCost) return state;
    return {
      ...state,
      bankCashK: state.bankCashK - upgradeCost,
      businesses: state.businesses.map((b) =>
        b.id === bizId
          ? {
              ...b,
              level: b.level + 1,
              dailyRevenueK: Number((b.dailyRevenueK * 1.35).toFixed(1)),
              dailyExpenseK: Number((b.dailyExpenseK * 1.15).toFixed(1)),
            }
          : b
      ),
    };
  }
}
