import type { Game, StatConfig, GameStat, GameRoster, User, Play } from "./api";

export const DEMO_TEAM_ID = "demo-team-001";
export const DEMO_GAME_ID = "demo-game-001";

export const demoPlayers: User[] = [
  { id: "demo-player-1", username: "jaylen_c", name: "Jaylen Carter", firstName: "Jaylen", lastName: "Carter", email: "", role: "athlete", number: 7, position: "Quarterback" },
  { id: "demo-player-2", username: "marcus_w", name: "Marcus Williams", firstName: "Marcus", lastName: "Williams", email: "", role: "athlete", number: 22, position: "Running Back" },
  { id: "demo-player-3", username: "deon_j", name: "DeShawn Jackson", firstName: "DeShawn", lastName: "Jackson", email: "", role: "athlete", number: 81, position: "Wide Receiver" },
  { id: "demo-player-4", username: "travis_h", name: "Travis Henderson", firstName: "Travis", lastName: "Henderson", email: "", role: "athlete", number: 88, position: "Tight End" },
  { id: "demo-player-5", username: "jordan_b", name: "Jordan Brooks", firstName: "Jordan", lastName: "Brooks", email: "", role: "athlete", number: 55, position: "Linebacker" },
  { id: "demo-player-6", username: "malik_t", name: "Malik Thompson", firstName: "Malik", lastName: "Thompson", email: "", role: "athlete", number: 24, position: "Cornerback" },
  { id: "demo-player-7", username: "chris_r", name: "Chris Rodriguez", firstName: "Chris", lastName: "Rodriguez", email: "", role: "athlete", number: 72, position: "Offensive Line" },
  { id: "demo-player-8", username: "tyler_m", name: "Tyler Mitchell", firstName: "Tyler", lastName: "Mitchell", email: "", role: "athlete", number: 11, position: "Wide Receiver" },
];

export const demoStatConfigs: StatConfig[] = [
  { id: "demo-stat-1", teamId: DEMO_TEAM_ID, name: "Touchdown", shortName: "TD", value: 6, category: "Scoring", isActive: true, displayOrder: 1 },
  { id: "demo-stat-2", teamId: DEMO_TEAM_ID, name: "Field Goal", shortName: "FG", value: 3, category: "Scoring", isActive: true, displayOrder: 2 },
  { id: "demo-stat-3", teamId: DEMO_TEAM_ID, name: "Extra Point", shortName: "XP", value: 1, category: "Scoring", isActive: true, displayOrder: 3 },
  { id: "demo-stat-4", teamId: DEMO_TEAM_ID, name: "Passing Yards", shortName: "PYD", value: 0, category: "Passing", isActive: true, displayOrder: 4 },
  { id: "demo-stat-5", teamId: DEMO_TEAM_ID, name: "Rushing Yards", shortName: "RYD", value: 0, category: "Rushing", isActive: true, displayOrder: 5 },
  { id: "demo-stat-6", teamId: DEMO_TEAM_ID, name: "Tackle", shortName: "TKL", value: 0, category: "Defense", isActive: true, displayOrder: 6 },
  { id: "demo-stat-7", teamId: DEMO_TEAM_ID, name: "Sack", shortName: "SCK", value: 0, category: "Defense", isActive: true, displayOrder: 7 },
  { id: "demo-stat-8", teamId: DEMO_TEAM_ID, name: "Interception", shortName: "INT", value: 0, category: "Defense", isActive: true, displayOrder: 8 },
  { id: "demo-stat-9", teamId: DEMO_TEAM_ID, name: "Reception", shortName: "REC", value: 0, category: "Receiving", isActive: true, displayOrder: 9 },
  { id: "demo-stat-10", teamId: DEMO_TEAM_ID, name: "Fumble", shortName: "FUM", value: 0, category: "Turnover", isActive: true, displayOrder: 10 },
];

export const demoGame: Game = {
  id: DEMO_GAME_ID,
  teamId: DEMO_TEAM_ID,
  trackingMode: "individual",
  status: "active",
  currentPeriod: 2,
  totalPeriods: 4,
  periodType: "quarter",
  teamScore: 14,
  opponentScore: 7,
  opponentName: "Riverside Tigers",
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
  { id: "demo-gs-1", gameId: DEMO_GAME_ID, statConfigId: "demo-stat-1", athleteId: "demo-player-2", period: 1, value: 1, pointsValue: 6, isDeleted: false, statConfig: demoStatConfigs[0], athlete: demoPlayers[1] },
  { id: "demo-gs-2", gameId: DEMO_GAME_ID, statConfigId: "demo-stat-3", athleteId: "demo-player-1", period: 1, value: 1, pointsValue: 1, isDeleted: false, statConfig: demoStatConfigs[2], athlete: demoPlayers[0] },
  { id: "demo-gs-3", gameId: DEMO_GAME_ID, statConfigId: "demo-stat-5", athleteId: "demo-player-2", period: 1, value: 45, pointsValue: 0, isDeleted: false, statConfig: demoStatConfigs[4], athlete: demoPlayers[1] },
  { id: "demo-gs-4", gameId: DEMO_GAME_ID, statConfigId: "demo-stat-4", athleteId: "demo-player-1", period: 1, value: 85, pointsValue: 0, isDeleted: false, statConfig: demoStatConfigs[3], athlete: demoPlayers[0] },
  { id: "demo-gs-5", gameId: DEMO_GAME_ID, statConfigId: "demo-stat-1", athleteId: "demo-player-3", period: 2, value: 1, pointsValue: 6, isDeleted: false, statConfig: demoStatConfigs[0], athlete: demoPlayers[2] },
  { id: "demo-gs-6", gameId: DEMO_GAME_ID, statConfigId: "demo-stat-3", athleteId: "demo-player-1", period: 2, value: 1, pointsValue: 1, isDeleted: false, statConfig: demoStatConfigs[2], athlete: demoPlayers[0] },
  { id: "demo-gs-7", gameId: DEMO_GAME_ID, statConfigId: "demo-stat-6", athleteId: "demo-player-5", period: 2, value: 4, pointsValue: 0, isDeleted: false, statConfig: demoStatConfigs[5], athlete: demoPlayers[4] },
  { id: "demo-gs-8", gameId: DEMO_GAME_ID, statConfigId: "demo-stat-9", athleteId: "demo-player-3", period: 1, value: 3, pointsValue: 0, isDeleted: false, statConfig: demoStatConfigs[8], athlete: demoPlayers[2] },
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

const soccerPlayCanvas = JSON.stringify({
  version: "1.0",
  objects: [
    { type: "circle", left: 200, top: 150, radius: 15, fill: "#22c55e", stroke: "#16a34a", strokeWidth: 2 },
    { type: "circle", left: 300, top: 120, radius: 15, fill: "#22c55e", stroke: "#16a34a", strokeWidth: 2 },
    { type: "circle", left: 250, top: 220, radius: 15, fill: "#22c55e", stroke: "#16a34a", strokeWidth: 2 },
    { type: "circle", left: 150, top: 280, radius: 15, fill: "#22c55e", stroke: "#16a34a", strokeWidth: 2 },
    { type: "circle", left: 350, top: 280, radius: 15, fill: "#22c55e", stroke: "#16a34a", strokeWidth: 2 },
    { type: "line", x1: 250, y1: 220, x2: 200, y2: 150, stroke: "#ef4444", strokeWidth: 3 },
    { type: "line", x1: 250, y1: 220, x2: 300, y2: 120, stroke: "#ef4444", strokeWidth: 3 },
  ],
});

export const demoPlays: Play[] = [
  {
    id: "demo-play-1",
    teamId: DEMO_TEAM_ID,
    createdById: "demo-coach",
    createdBy: demoCoach,
    name: "Through Ball Attack",
    description: "Quick attacking play with midfielders splitting the defense using through balls to forwards.",
    canvasData: soccerPlayCanvas,
    thumbnailData: "/screenshots/playmaker-demo.png?v=3",
    category: "Offense",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
];

export const DEMO_SPORTS = ["Baseball", "Basketball", "Football", "Soccer", "Volleyball"] as const;
export type DemoSport = typeof DEMO_SPORTS[number];

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('demo') === 'true';
}

export function getDemoUrl(path: string): string {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}demo=true`;
}
