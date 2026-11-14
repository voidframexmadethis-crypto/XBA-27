import { loadVersionedState, SAVE_KEYS, saveVersionedState } from "./saveSystem.ts";

export interface ArenaUpgrade {
  id: string;
  name: string;
  category: "lighting" | "display" | "sound" | "hospitality" | "facility";
  level: number;
  maxLevel: number;
  costM: number;
  costMultiplier: number;
  benefitDescription: string;
  revenueBonusPerGameM: number;
  fanSupportBonus: number;
}

export interface PlayerVenture {
  id: string;
  name: string;
  category: "real_estate" | "luxury_vehicle" | "business_venture" | "investment";
  costK: number;
  dailyIncomeK: number;
  description: string;
  owned: boolean;
}

export interface BusinessState {
  arenaName: string;
  ticketPrice: number; // $40 to $250
  luxuryBoxPrice: number; // $500 to $5000
  stadiumCapacity: number; // 18,500 default
  concessionQuality: number; // 1 to 5
  securityLevel: number; // 1 to 5
  liquidCashM: number;
  netWorthM: number;
  upgrades: ArenaUpgrade[];
  ventures: PlayerVenture[];
  namingRightsSponsor: string;
  namingRightsValuePerGameM: number;
}

const DEFAULT_UPGRADES: ArenaUpgrade[] = [
  {
    id: "jumbotron_hd",
    name: "4K Quantum Jumbotron",
    category: "display",
    level: 1,
    maxLevel: 3,
    costM: 4.5,
    costMultiplier: 1.8,
    benefitDescription: "Increases fan excitement and ticket sales by +12% per level.",
    revenueBonusPerGameM: 0.35,
    fanSupportBonus: 4,
  },
  {
    id: "led_ribbon",
    name: "360° LED Ribbon Boards",
    category: "display",
    level: 1,
    maxLevel: 3,
    costM: 2.8,
    costMultiplier: 1.6,
    benefitDescription: "Boosts courtside sponsor revenue and arena energy.",
    revenueBonusPerGameM: 0.22,
    fanSupportBonus: 3,
  },
  {
    id: "sound_system",
    name: "Dolby Atmos Arena Sound",
    category: "sound",
    level: 1,
    maxLevel: 3,
    costM: 2.0,
    costMultiplier: 1.5,
    benefitDescription: "Amplifies crowd roar and authentic buzzer dynamics.",
    revenueBonusPerGameM: 0.15,
    fanSupportBonus: 2,
  },
  {
    id: "luxury_suites",
    name: "VIP Courtside Skyboxes",
    category: "hospitality",
    level: 1,
    maxLevel: 4,
    costM: 8.0,
    costMultiplier: 2.0,
    benefitDescription: "Generates massive high-roller ticket and hospitality income.",
    revenueBonusPerGameM: 0.95,
    fanSupportBonus: 6,
  },
  {
    id: "training_complex",
    name: "Biomechanical Training Center",
    category: "facility",
    level: 1,
    maxLevel: 3,
    costM: 6.0,
    costMultiplier: 1.9,
    benefitDescription: "Accelerates player skill growth and prevents fatigue.",
    revenueBonusPerGameM: 0.20,
    fanSupportBonus: 3,
  },
];

const DEFAULT_VENTURES: PlayerVenture[] = [
  {
    id: "condo_miami",
    name: "Biscayne Bay Luxury Penthouse",
    category: "real_estate",
    costK: 3500,
    dailyIncomeK: 45,
    description: "Prime real estate overlooking Miami with private helipad.",
    owned: false,
  },
  {
    id: "mansion_la",
    name: "Bel-Air Championship Estate",
    category: "real_estate",
    costK: 12000,
    dailyIncomeK: 160,
    description: "Exclusive 7-acre compound with private indoor basketball court.",
    owned: false,
  },
  {
    id: "hyper_car_fleet",
    name: "Custom Hypercar Fleet",
    category: "luxury_vehicle",
    costK: 2400,
    dailyIncomeK: 25,
    description: "Limited-edition carbon fiber sports cars.",
    owned: false,
  },
  {
    id: "sports_agency",
    name: "Next-Gen Athlete Agency",
    category: "business_venture",
    costK: 5000,
    dailyIncomeK: 95,
    description: "Represents top rookie prospects and earns management fees.",
    owned: false,
  },
  {
    id: "apparel_brand",
    name: "Signature Streetwear Brand",
    category: "business_venture",
    costK: 8500,
    dailyIncomeK: 130,
    description: "Global fashion line releasing sellout sneaker drops.",
    owned: false,
  },
  {
    id: "crypto_fund",
    name: "Web3 Sports Venture Fund",
    category: "investment",
    costK: 4000,
    dailyIncomeK: 80,
    description: "High-yield tech and gaming investments.",
    owned: false,
  },
];

export function createInitialBusinessState(): BusinessState {
  return {
    arenaName: "2K Pro Arena",
    ticketPrice: 95,
    luxuryBoxPrice: 1500,
    stadiumCapacity: 18500,
    concessionQuality: 3,
    securityLevel: 3,
    liquidCashM: 14.5,
    netWorthM: 38.0,
    upgrades: DEFAULT_UPGRADES,
    ventures: DEFAULT_VENTURES,
    namingRightsSponsor: "Apex Global Energy",
    namingRightsValuePerGameM: 0.45,
  };
}

export function loadBusinessState(): BusinessState {
  return loadVersionedState<BusinessState>(
    "courtlegends_business_v1",
    createInitialBusinessState,
    (d): d is BusinessState => Boolean(d && typeof d === "object" && typeof (d as BusinessState).arenaName === "string")
  ).data;
}

export function saveBusinessState(state: BusinessState): void {
  saveVersionedState("courtlegends_business_v1", state);
}

export function calculateGameDayRevenue(state: BusinessState): {
  gateRevenueM: number;
  luxuryRevenueM: number;
  concessionRevenueM: number;
  namingRevenueM: number;
  totalGameRevenueM: number;
} {
  const attendance = Math.min(state.stadiumCapacity, Math.round(state.stadiumCapacity * (0.82 + state.concessionQuality * 0.03)));
  const gateRevenueM = (attendance * state.ticketPrice) / 1_000_000;
  const luxuryRevenueM = (120 * state.luxuryBoxPrice) / 1_000_000;
  const upgradeBonusM = state.upgrades.reduce((sum, u) => sum + u.revenueBonusPerGameM * u.level, 0);
  const concessionRevenueM = Number((0.45 * state.concessionQuality + upgradeBonusM).toFixed(2));
  const namingRevenueM = state.namingRightsValuePerGameM;
  const totalGameRevenueM = Number((gateRevenueM + luxuryRevenueM + concessionRevenueM + namingRevenueM).toFixed(2));

  return {
    gateRevenueM,
    luxuryRevenueM,
    concessionRevenueM,
    namingRevenueM,
    totalGameRevenueM,
  };
}

export function upgradeArenaFacility(state: BusinessState, upgradeId: string): BusinessState {
  const upgrade = state.upgrades.find((u) => u.id === upgradeId);
  if (!upgrade || upgrade.level >= upgrade.maxLevel) return state;

  const cost = Number((upgrade.costM * Math.pow(upgrade.costMultiplier, upgrade.level - 1)).toFixed(2));
  if (state.liquidCashM < cost) return state;

  const nextUpgrades = state.upgrades.map((u) => (u.id === upgradeId ? { ...u, level: u.level + 1 } : u));
  const nextCash = Number((state.liquidCashM - cost).toFixed(2));
  const nextNetWorth = Number((state.netWorthM + cost * 1.2).toFixed(2));

  return {
    ...state,
    liquidCashM: nextCash,
    netWorthM: nextNetWorth,
    upgrades: nextUpgrades,
  };
}

export function purchaseVenture(state: BusinessState, ventureId: string): BusinessState {
  const venture = state.ventures.find((v) => v.id === ventureId);
  if (!venture || venture.owned) return state;

  const costM = venture.costK / 1000;
  if (state.liquidCashM < costM) return state;

  const nextVentures = state.ventures.map((v) => (v.id === ventureId ? { ...v, owned: true } : v));
  const nextCash = Number((state.liquidCashM - costM).toFixed(2));
  const nextNetWorth = Number((state.netWorthM + costM * 1.35).toFixed(2));

  return {
    ...state,
    liquidCashM: nextCash,
    netWorthM: nextNetWorth,
    ventures: nextVentures,
  };
}
