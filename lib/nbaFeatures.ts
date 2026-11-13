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
  [Category.GAMEPLAY]: "Apex Motion Engine",
  [Category.PROGRESSION]: "Seasons & My Career",
  [Category.ECONOMY]: "Front Office & Cap",
  [Category.PRESENTATION]: "Broadcast Live",
  [Category.ONLINE]: "Online Multiplayer",
  [Category.ACCOUNT]: "Cloud Saves & Backup",
};

export const NBA_2K27_FEATURES: Record<string, Feature> = {
  mycareer: {
    id: "mycareer",
    name: "My Career",
    category: Category.GAME_MODE,
    description: "Create and develop your custom athlete from draft night to APBA championship stardom.",
    subFeatures: ["Athlete Studio", "XP Skill Upgrades", "Contracts & Endorsements", "Draft Night Cutscene", "Championship Rings"],
    badgeText: "FLAGSHIP",
    iconName: "Trophy",
  },
  the_city: {
    id: "the_city",
    name: "World Tour 2.0",
    category: Category.GAME_MODE,
    description: "28 global cities with original arenas, uniforms, crowd chants, and knockout international cups.",
    subFeatures: ["Global Nations Cup", "Pacific Rim Invitational", "Euro-Atlantic Masters", "Custom City Courts"],
    badgeText: "GLOBAL CUPS",
    iconName: "Globe",
  },
  mynba: {
    id: "mynba",
    name: "Franchise Mode",
    category: Category.GAME_MODE,
    description: "Take front-office control as GM and owner across full 82-game APBA seasons.",
    subFeatures: ["Trade Machine", "Rookie Draft Board", "Salary Cap & Revenue", "Coaching Staff", "Team Chemistry"],
    badgeText: "GM OFFICE",
    iconName: "Shield",
  },
  seasons: {
    id: "seasons",
    name: "APBA League & Playoffs",
    category: Category.PROGRESSION,
    description: "Complete 20-team pro league with 82-game schedule, tiebreakers, awards, and Best-of-7 playoffs.",
    subFeatures: ["Conference & Division Standings", "MVP / DPOY / ROY / 6MOY / MIP", "15-Series Playoff Bracket", "Finals MVP Trophy"],
    badgeText: "82 GAMES",
    iconName: "Flame",
  },
  play_now: {
    id: "play_now",
    name: "Play Now & Streetball",
    category: Category.GAME_MODE,
    description: "Instant 5v5 arena tip-off or outdoor blacktop streetball matchups.",
    subFeatures: ["5v5 Championship Arena", "Blacktop Streetball", "Freestyle Shootaround", "Tactical Timeouts"],
    badgeText: "INSTANT",
    iconName: "Play",
  },
  learn_2k: {
    id: "learn_2k",
    name: "Training Academy",
    category: Category.GAME_MODE,
    description: "8 interactive basketball skill drills tracking high scores, accuracy, and XP rewards.",
    subFeatures: ["Free-Throw Pressure", "3-Point Shootout", "Dunk Contest", "Lockdown Defense", "Dribble Gauntlet"],
    badgeText: "8 DRILLS",
    iconName: "Info",
  },
  gameplay_engine: {
    id: "gameplay_engine",
    name: "93 Offense + 55 Defense Engine",
    category: Category.GAMEPLAY,
    description: "Complete biomechanical offensive and defensive move library with Move Deck & Movebook.",
    subFeatures: [
      "Green Shot Meter Timing",
      "Crossovers & Euro-Steps",
      "Post Moves & Spin Fades",
      "Shading, Steals & Verticality",
      "Pick & Roll / Cutters",
      "Open-Player Passing",
    ],
    badgeText: "148 MOVES",
    iconName: "Zap",
  },
  presentation: {
    id: "presentation",
    name: "Broadcast Presentation",
    category: Category.PRESENTATION,
    description: "Arena lighting presets, lineup intros, halftime report, POTG interviews, and instant replays.",
    subFeatures: ["Lineup Intros", "Halftime Desk", "Player of the Game", "Instant Replay", "Referee Whistle & Crowd SFX"],
    badgeText: "TV BROADCAST",
    iconName: "Tv",
  },
  customization_studio: {
    id: "customization_studio",
    name: "Customization Studio",
    category: Category.ECONOMY,
    description: "Design custom jerseys, team emblems, basketball skins, shoes, hardwood tones, and lighting.",
    subFeatures: ["5 Ball Designs", "4 Wood Tones", "4 Arena Lighting Moods", "Team Emblems & Jerseys"],
    badgeText: "3D LIVE",
    iconName: "Sparkles",
  },
  online_multiplayer: {
    id: "online_multiplayer",
    name: "Online Multiplayer Rooms",
    category: Category.ONLINE,
    description: "Real-time WebSocket & HTTP-synced private and public rooms across 1v1, 2v2, 3v3, and 5v5.",
    subFeatures: ["1v1 / 2v2 / 3v3 / 5v5 Formats", "Private Room Codes", "Live Score & State Sync", "Auto Reconnect"],
    onlineRequired: true,
    badgeText: "LIVE SYNC",
    iconName: "Award",
  },
  account_link: {
    id: "account_link",
    name: "Unified Save & Backup",
    category: Category.ACCOUNT,
    description: "Checksummed local persistence with automatic backup snapshots and JSON export/import.",
    subFeatures: ["Corruption Recovery", "JSON Full Export", "One-Click Restore", "Cross-Mode Persistence"],
    badgeText: "PROTECTED",
    iconName: "Check",
  },
};
