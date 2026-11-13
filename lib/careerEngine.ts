import { APBA_TEAMS } from "./leagueData.ts";
import { loadVersionedState, SAVE_KEYS, saveVersionedState } from "./saveSystem.ts";

export interface SponsorshipDeal {
  id: string;
  brandName: string;
  category: string;
  minReputation: number;
  baseSalaryPerSeason: number; // in thousands ($K)
  perWinBonus: number;
  signed: boolean;
  tierLabel: string;
}

export interface CareerSeasonLog {
  seasonYear: number;
  teamId: string;
  teamName: string;
  gp: number;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  wonChampionship: boolean;
  awards: string[];
}

export interface MyCareerState {
  active: boolean;
  teamId: string;
  seasonYear: number;
  xpAvailable: number;
  totalXpEarned: number;
  reputation: number; // 0 .. 1000+
  bankBalanceK: number; // in $K
  contract: {
    yearsLeft: number;
    annualSalaryM: number;
    role: "Rookie Prospect" | "Sixth Man" | "Starter" | "Franchise Star" | "Max Legend";
  };
  championshipRings: number;
  sponsorships: SponsorshipDeal[];
  seasonLogs: CareerSeasonLog[];
  extraAttributes: {
    playmaking: number;
    rebounding: number;
    athleticism: number;
  };
}

export const INITIAL_SPONSORSHIPS: SponsorshipDeal[] = [
  {
    id: "sp_apex_footwear",
    brandName: "Apex Velocity Footwear",
    category: "Signature Sneakers",
    minReputation: 80,
    baseSalaryPerSeason: 350,
    perWinBonus: 12,
    signed: false,
    tierLabel: "Tier 1 Signature",
  },
  {
    id: "sp_courtfuel",
    brandName: "CourtFuel Electrolytes",
    category: "Sports Hydration",
    minReputation: 220,
    baseSalaryPerSeason: 680,
    perWinBonus: 20,
    signed: false,
    tierLabel: "Tier 2 National",
  },
  {
    id: "sp_horizonsports",
    brandName: "Horizon Wearables",
    category: "Biometric Tech",
    minReputation: 440,
    baseSalaryPerSeason: 1250,
    perWinBonus: 35,
    signed: false,
    tierLabel: "Tier 3 Global",
  },
  {
    id: "sp_sovereignchrono",
    brandName: "Sovereign Timepieces",
    category: "Luxury Apparel",
    minReputation: 700,
    baseSalaryPerSeason: 2400,
    perWinBonus: 65,
    signed: false,
    tierLabel: "Icon Flagship",
  },
];

export function createInitialCareerState(teamId = "apba_nyc_monarchs"): MyCareerState {
  return {
    active: true,
    teamId,
    seasonYear: 2027,
    xpAvailable: 450,
    totalXpEarned: 450,
    reputation: 110,
    bankBalanceK: 1450,
    contract: {
      yearsLeft: 3,
      annualSalaryM: 4.2,
      role: "Starter",
    },
    championshipRings: 0,
    sponsorships: INITIAL_SPONSORSHIPS.map((s) => ({ ...s })),
    seasonLogs: [],
    extraAttributes: {
      playmaking: 78,
      rebounding: 72,
      athleticism: 82,
    },
  };
}

export function getReputationTier(rep: number): { title: string; nextAt: number } {
  if (rep >= 850) return { title: "Hall of Fame Legend", nextAt: 1000 };
  if (rep >= 600) return { title: "League Superstar", nextAt: 850 };
  if (rep >= 380) return { title: "All-Star Contender", nextAt: 600 };
  if (rep >= 200) return { title: "Established Starter", nextAt: 380 };
  if (rep >= 90) return { title: "Rising Sixth Man", nextAt: 200 };
  return { title: "Draft Rookie", nextAt: 90 };
}

export function applyCareerGameReward(
  state: MyCareerState,
  stats: { pts: number; reb: number; ast: number; stl: number; blk: number; won: boolean }
): MyCareerState {
  const xpGain = Math.max(
    45,
    stats.pts * 14 + stats.reb * 12 + stats.ast * 16 + stats.stl * 25 + stats.blk * 25 + (stats.won ? 120 : 35)
  );
  const repGain = Math.max(8, Math.round(stats.pts * 0.6 + stats.ast * 0.8 + (stats.won ? 18 : 4)));

  const sponsorBonusK = state.sponsorships
    .filter((s) => s.signed)
    .reduce((sum, s) => sum + (stats.won ? s.perWinBonus : Math.round(s.perWinBonus * 0.25)), 0);

  return {
    ...state,
    xpAvailable: state.xpAvailable + xpGain,
    totalXpEarned: state.totalXpEarned + xpGain,
    reputation: Math.min(1200, state.reputation + repGain),
    bankBalanceK: state.bankBalanceK + sponsorBonusK + Math.round((state.contract.annualSalaryM * 1000) / 82),
  };
}

export function signCareerSponsorship(state: MyCareerState, sponsorId: string): MyCareerState {
  const target = state.sponsorships.find((s) => s.id === sponsorId);
  if (!target || target.signed || state.reputation < target.minReputation) {
    return state;
  }
  return {
    ...state,
    bankBalanceK: state.bankBalanceK + Math.round(target.baseSalaryPerSeason * 0.4),
    sponsorships: state.sponsorships.map((s) => (s.id === sponsorId ? { ...s, signed: true } : s)),
  };
}

export function negotiateCareerContract(
  state: MyCareerState,
  newTeamId: string,
  ovr: number
): MyCareerState {
  const validTeam = APBA_TEAMS.some((t) => t.id === newTeamId);
  if (!validTeam) return state;
  const marketSalary = Number(Math.max(4.5, Math.min(52, (ovr - 68) * 1.65 + state.reputation * 0.012)).toFixed(1));
  const role: MyCareerState["contract"]["role"] =
    ovr >= 90 ? "Max Legend" : ovr >= 84 ? "Franchise Star" : ovr >= 78 ? "Starter" : "Sixth Man";
  return {
    ...state,
    teamId: newTeamId,
    contract: {
      yearsLeft: 4,
      annualSalaryM: marketSalary,
      role,
    },
  };
}

export function loadCareerState(): MyCareerState {
  return loadVersionedState<MyCareerState>(
    SAVE_KEYS.CAREER_HUB,
    () => createInitialCareerState(),
    (d): d is MyCareerState => Boolean(d && typeof d === "object" && typeof (d as MyCareerState).teamId === "string")
  ).data;
}

export function saveCareerState(state: MyCareerState): void {
  saveVersionedState(SAVE_KEYS.CAREER_HUB, state);
}
