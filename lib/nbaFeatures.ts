export enum Category {
  GAME_MODE = "GAME_MODE",
  GAMEPLAY = "GAMEPLAY",
  PROGRESSION = "PROGRESSION",
  ECONOMY = "ECONOMY",
  PRESENTATION = "PRESENTATION",
  ONLINE = "ONLINE",
  ACCOUNT = "ACCOUNT",
}

export interface Feature {
  id: string;
  name: string;
  category: Category;
  description: string;
  subFeatures: string[];
  onlineRequired?: boolean;
  badgeText?: string;
  iconName?: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  [Category.GAME_MODE]: "Game Modes",
  [Category.GAMEPLAY]: "ProPLAY Engine",
  [Category.PROGRESSION]: "Seasons & MyCAREER",
  [Category.ECONOMY]: "Economy & Packs",
  [Category.PRESENTATION]: "2K Broadcast",
  [Category.ONLINE]: "Online & Parks",
  [Category.ACCOUNT]: "NBA ID & 2K Account",
};

export const NBA_2K27_FEATURES: Record<string, Feature> = {
  mycareer: {
    id: "mycareer",
    name: "MyCAREER",
    category: Category.GAME_MODE,
    description: "Create and develop your own player from draft to stardom.",
    subFeatures: ["MyPLAYER Builder", "The City", "Badges", "Storyline & cutscenes", "Endorsements"],
    onlineRequired: true,
    badgeText: "POPULAR",
    iconName: "Trophy",
  },
  the_city: {
    id: "the_city",
    name: "The City",
    category: Category.GAME_MODE,
    description: "Open-world hub for MyCAREER, with parks and street courts.",
    subFeatures: ["MyPARKs", "MyCOURT", "Boulevard of the Stars", "Gravity Ball"],
    onlineRequired: true,
    badgeText: "OPEN WORLD",
    iconName: "Globe",
  },
  myteam: {
    id: "myteam",
    name: "MyTEAM",
    category: Category.GAME_MODE,
    description: "Card-collecting mode for building dream lineups.",
    subFeatures: [
      "Packs & card collection",
      "King of the Court",
      "Triple Threat Park",
      "Breakout",
      "Showdown",
      "Salary cap mode",
      "Auction House",
      "The Exchange",
      "MyTEAM REP system",
    ],
    onlineRequired: true,
    badgeText: "CARDS & REPS",
    iconName: "Sparkles",
  },
  seasons: {
    id: "seasons",
    name: "Seasons & Pro Pass",
    category: Category.PROGRESSION,
    description: "Rotating seasons with XP ladders and thematic rewards.",
    subFeatures: ["Seasonal rewards ladder", "Free tier", "Paid premium pass", "Hall of Fame pass"],
    onlineRequired: true,
    badgeText: "XP LADDER",
    iconName: "Flame",
  },
  mynba: {
    id: "mynba",
    name: "MyNBA / Franchise",
    category: Category.GAME_MODE,
    description: "Franchise mode where you run a team as GM.",
    subFeatures: ["MyGM", "Trades", "Draft", "Free agency", "Roster management"],
    badgeText: "GM FRANCHISE",
    iconName: "Shield",
  },
  the_w: {
    id: "the_w",
    name: "The W / MyWNBA",
    category: Category.GAME_MODE,
    description: "WNBA-focused modes, including all 2026-27 WNBA teams.",
    subFeatures: ["MyWNBA career", "Full WNBA rosters"],
    badgeText: "WNBA",
    iconName: "Award",
  },
  play_now: {
    id: "play_now",
    name: "Play Now",
    category: Category.GAME_MODE,
    description: "Quick exhibition games with NBA and historic teams.",
    subFeatures: ["Historic teams", "Custom rosters", "Online and offline play"],
    badgeText: "EXHIBITION",
    iconName: "Play",
  },
  learn_2k: {
    id: "learn_2k",
    name: "Learn 2K",
    category: Category.GAME_MODE,
    description: "Tutorials for new and returning players.",
    subFeatures: ["Gameplay tutorials", "Drills"],
    badgeText: "TUTORIAL",
    iconName: "Info",
  },
  gameplay_engine: {
    id: "gameplay_engine",
    name: "ProPLAY Gameplay",
    category: Category.GAMEPLAY,
    description: "Motion-capture-driven simulation of NBA movement and shooting.",
    subFeatures: [
      "Shot meter & timing",
      "Dribble moves",
      "Layup system",
      "Steals & defense",
      "Pick and roll",
      "Pump fakes",
    ],
    badgeText: "PRO MOTION",
    iconName: "Zap",
  },
  presentation: {
    id: "presentation",
    name: "2K Presentation",
    category: Category.PRESENTATION,
    description: "Broadcast-style visuals, commentary, and licensed arenas.",
    subFeatures: ["Licensed arenas", "Commentary", "Broadcast cameras", "Crowd & atmosphere"],
    badgeText: "TV BROADCAST",
    iconName: "Tv",
  },
  account_link: {
    id: "account_link",
    name: "NBA ID & 2K Account",
    category: Category.ACCOUNT,
    description: "Link your NBA ID and 2K account for online modes.",
    subFeatures: ["NBA ID Perks", "Cross-Progression Sync", "Community Events"],
    onlineRequired: true,
    badgeText: "LINKED ACCOUNT",
    iconName: "Check",
  },
};
