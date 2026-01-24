import type { Game, StatConfig, GameStat, GameRoster, User, Play } from "./api";

export const DEMO_TEAM_ID = "demo-team-001";
export const DEMO_GAME_ID = "demo-game-001";

export const demoPlayers: User[] = [
  { id: "demo-player-1", username: "marcus_j", name: "Marcus Johnson", firstName: "Marcus", lastName: "Johnson", email: "", role: "athlete", number: 23, position: "Point Guard" },
  { id: "demo-player-2", username: "tyler_w", name: "Tyler Williams", firstName: "Tyler", lastName: "Williams", email: "", role: "athlete", number: 11, position: "Shooting Guard" },
  { id: "demo-player-3", username: "jordan_s", name: "Jordan Smith", firstName: "Jordan", lastName: "Smith", email: "", role: "athlete", number: 34, position: "Small Forward" },
  { id: "demo-player-4", username: "chris_d", name: "Chris Davis", firstName: "Chris", lastName: "Davis", email: "", role: "athlete", number: 55, position: "Power Forward" },
  { id: "demo-player-5", username: "alex_t", name: "Alex Thompson", firstName: "Alex", lastName: "Thompson", email: "", role: "athlete", number: 42, position: "Center" },
];

export const demoStatConfigs: StatConfig[] = [
  { id: "demo-stat-1", teamId: DEMO_TEAM_ID, name: "Points", shortName: "PTS", value: 1, category: "Scoring", isActive: true, displayOrder: 1 },
  { id: "demo-stat-2", teamId: DEMO_TEAM_ID, name: "3-Pointer", shortName: "3PT", value: 3, category: "Scoring", isActive: true, displayOrder: 2 },
  { id: "demo-stat-3", teamId: DEMO_TEAM_ID, name: "Free Throw", shortName: "FT", value: 1, category: "Scoring", isActive: true, displayOrder: 3 },
  { id: "demo-stat-4", teamId: DEMO_TEAM_ID, name: "Rebound", shortName: "REB", value: 0, category: "Rebounds", isActive: true, displayOrder: 4 },
  { id: "demo-stat-5", teamId: DEMO_TEAM_ID, name: "Assist", shortName: "AST", value: 0, category: "Playmaking", isActive: true, displayOrder: 5 },
  { id: "demo-stat-6", teamId: DEMO_TEAM_ID, name: "Steal", shortName: "STL", value: 0, category: "Defense", isActive: true, displayOrder: 6 },
  { id: "demo-stat-7", teamId: DEMO_TEAM_ID, name: "Block", shortName: "BLK", value: 0, category: "Defense", isActive: true, displayOrder: 7 },
  { id: "demo-stat-8", teamId: DEMO_TEAM_ID, name: "Turnover", shortName: "TO", value: 0, category: "Mistakes", isActive: true, displayOrder: 8 },
];

export const demoGame: Game = {
  id: DEMO_GAME_ID,
  teamId: DEMO_TEAM_ID,
  trackingMode: "individual",
  status: "active",
  currentPeriod: 2,
  totalPeriods: 4,
  periodType: "quarter",
  teamScore: 28,
  opponentScore: 24,
  opponentName: "Demo Opponents",
  startedAt: new Date().toISOString(),
};

export const demoGameRoster: GameRoster[] = demoPlayers.map((player, index) => ({
  id: `demo-roster-${index + 1}`,
  gameId: DEMO_GAME_ID,
  athleteId: player.id,
  jerseyNumber: player.number?.toString() || null,
  positions: player.position ? [player.position] : [],
  isInGame: true,
  athlete: player,
}));

export const demoGameStats: GameStat[] = [
  { id: "demo-gs-1", gameId: DEMO_GAME_ID, statConfigId: "demo-stat-1", athleteId: "demo-player-1", period: 1, value: 8, pointsValue: 8, isDeleted: false, statConfig: demoStatConfigs[0], athlete: demoPlayers[0] },
  { id: "demo-gs-2", gameId: DEMO_GAME_ID, statConfigId: "demo-stat-2", athleteId: "demo-player-2", period: 1, value: 2, pointsValue: 6, isDeleted: false, statConfig: demoStatConfigs[1], athlete: demoPlayers[1] },
  { id: "demo-gs-3", gameId: DEMO_GAME_ID, statConfigId: "demo-stat-4", athleteId: "demo-player-5", period: 1, value: 5, pointsValue: 0, isDeleted: false, statConfig: demoStatConfigs[3], athlete: demoPlayers[4] },
  { id: "demo-gs-4", gameId: DEMO_GAME_ID, statConfigId: "demo-stat-5", athleteId: "demo-player-1", period: 1, value: 4, pointsValue: 0, isDeleted: false, statConfig: demoStatConfigs[4], athlete: demoPlayers[0] },
  { id: "demo-gs-5", gameId: DEMO_GAME_ID, statConfigId: "demo-stat-1", athleteId: "demo-player-3", period: 2, value: 6, pointsValue: 6, isDeleted: false, statConfig: demoStatConfigs[0], athlete: demoPlayers[2] },
  { id: "demo-gs-6", gameId: DEMO_GAME_ID, statConfigId: "demo-stat-6", athleteId: "demo-player-4", period: 2, value: 2, pointsValue: 0, isDeleted: false, statConfig: demoStatConfigs[5], athlete: demoPlayers[3] },
];

const demoCoach: User = {
  id: "demo-coach",
  username: "demo_coach",
  name: "Demo Coach",
  firstName: "Demo",
  lastName: "Coach",
  email: "",
  role: "coach",
};

const basketballPlayCanvas = JSON.stringify({
  version: "1.0",
  objects: [
    { type: "circle", left: 150, top: 200, radius: 15, fill: "#3b82f6", stroke: "#1d4ed8", strokeWidth: 2 },
    { type: "circle", left: 250, top: 150, radius: 15, fill: "#3b82f6", stroke: "#1d4ed8", strokeWidth: 2 },
    { type: "circle", left: 350, top: 200, radius: 15, fill: "#3b82f6", stroke: "#1d4ed8", strokeWidth: 2 },
    { type: "circle", left: 200, top: 300, radius: 15, fill: "#3b82f6", stroke: "#1d4ed8", strokeWidth: 2 },
    { type: "circle", left: 300, top: 300, radius: 15, fill: "#3b82f6", stroke: "#1d4ed8", strokeWidth: 2 },
    { type: "line", x1: 150, y1: 200, x2: 250, y2: 150, stroke: "#ef4444", strokeWidth: 3 },
    { type: "line", x1: 250, y1: 150, x2: 350, y2: 200, stroke: "#ef4444", strokeWidth: 3 },
  ],
});

export const demoPlays: Play[] = [
  {
    id: "demo-play-1",
    teamId: DEMO_TEAM_ID,
    createdById: "demo-coach",
    createdBy: demoCoach,
    name: "Pick and Roll",
    description: "Classic pick and roll play with the point guard and center. The guard uses the screen to create space for a drive or pass.",
    canvasData: basketballPlayCanvas,
    thumbnailData: "/screenshots/playmaker-demo.png",
    category: "Offense",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-play-2",
    teamId: DEMO_TEAM_ID,
    createdById: "demo-coach",
    createdBy: demoCoach,
    name: "Box Out Zone",
    description: "Defensive zone setup with emphasis on box out positioning for rebounds.",
    canvasData: basketballPlayCanvas,
    thumbnailData: null,
    category: "Defense",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-play-3",
    teamId: DEMO_TEAM_ID,
    createdById: "demo-coach",
    createdBy: demoCoach,
    name: "Fast Break",
    description: "Quick transition offense after a defensive stop. Focus on filling lanes and quick ball movement.",
    canvasData: basketballPlayCanvas,
    thumbnailData: null,
    category: "Transition",
    status: "Draft",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-play-4",
    teamId: DEMO_TEAM_ID,
    createdById: "demo-coach",
    createdBy: demoCoach,
    name: "Inbound - Baseline",
    description: "Baseline inbound play with multiple options for the passer.",
    canvasData: basketballPlayCanvas,
    thumbnailData: null,
    category: "Set Plays",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
];

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('demo') === 'true';
}

export function getDemoUrl(path: string): string {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}demo=true`;
}
