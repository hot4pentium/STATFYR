import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  name: string;
  avatar?: string | null;
  position?: string | null;
  number?: number | null;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  sport: string;
  division?: string | null;
  season?: string | null;
  badgeId?: string | null;
  coachId?: string | null;
  createdAt?: string | null;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  jerseyNumber?: string | null;
  position?: string | null;
  joinedAt?: string | null;
  user: User;
}

export interface Event {
  id: string;
  teamId: string;
  title: string;
  type: string;
  date: string;
  endDate?: string | null;
  location?: string | null;
  details?: string | null;
  opponent?: string | null;
  drinksAthleteId?: string | null;
  snacksAthleteId?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
}

export async function registerUser(data: {
  username: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  name: string;
}): Promise<User> {
  const res = await apiRequest("POST", "/api/auth/register", data);
  return res.json();
}

export async function loginUser(username: string, password: string): Promise<User> {
  const res = await apiRequest("POST", "/api/auth/login", { username, password });
  return res.json();
}

export async function getUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error("Failed to get user");
  return res.json();
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const res = await apiRequest("PATCH", `/api/users/${id}`, data);
  return res.json();
}

export async function deleteUser(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/users/${id}`, {});
}

export async function createTeam(data: {
  name: string;
  sport: string;
  division?: string;
  season?: string;
  coachId: string;
}): Promise<Team> {
  const res = await apiRequest("POST", "/api/teams", data);
  return res.json();
}

export async function updateTeam(id: string, data: Partial<{ name: string; sport: string; season: string; badgeId: string | null }>): Promise<Team> {
  const res = await apiRequest("PATCH", `/api/teams/${id}`, data);
  return res.json();
}

export async function getTeamByCode(code: string): Promise<Team> {
  const res = await fetch(`/api/teams/code/${code}`);
  if (!res.ok) throw new Error("Team not found");
  return res.json();
}

export async function getTeam(id: string): Promise<Team> {
  const res = await fetch(`/api/teams/${id}`);
  if (!res.ok) throw new Error("Team not found");
  return res.json();
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const res = await fetch(`/api/teams/${teamId}/members`);
  if (!res.ok) throw new Error("Failed to get team members");
  return res.json();
}

export async function joinTeamByCode(code: string, userId: string, role: string): Promise<{ team: Team; member: TeamMember }> {
  const res = await apiRequest("POST", "/api/teams/join-by-code", { code, userId, role });
  return res.json();
}

export async function joinTeam(teamId: string, userId: string, role: string): Promise<TeamMember> {
  const res = await apiRequest("POST", `/api/teams/${teamId}/join`, { userId, role });
  return res.json();
}

export async function getUserTeams(userId: string): Promise<Team[]> {
  const res = await fetch(`/api/users/${userId}/teams`);
  if (!res.ok) throw new Error("Failed to get user teams");
  return res.json();
}

export async function getCoachTeams(coachId: string): Promise<Team[]> {
  const res = await fetch(`/api/coach/${coachId}/teams`);
  if (!res.ok) throw new Error("Failed to get coach teams");
  return res.json();
}

export async function updateTeamMember(
  teamId: string, 
  userId: string, 
  requesterId: string,
  data: { role?: string; jerseyNumber?: string | null; position?: string | null }
): Promise<TeamMember> {
  const res = await apiRequest("PATCH", `/api/teams/${teamId}/members/${userId}?requesterId=${requesterId}`, data);
  return res.json();
}

export async function removeTeamMember(teamId: string, userId: string, requesterId: string): Promise<void> {
  await apiRequest("DELETE", `/api/teams/${teamId}/members/${userId}?requesterId=${requesterId}`, {});
}

export async function getTeamEvents(teamId: string): Promise<Event[]> {
  const res = await fetch(`/api/teams/${teamId}/events`);
  if (!res.ok) throw new Error("Failed to get team events");
  return res.json();
}

export async function createEvent(teamId: string, data: {
  title: string;
  type: string;
  date: string;
  endDate?: string | null;
  location?: string | null;
  details?: string | null;
  createdBy?: string | null;
}): Promise<Event> {
  const res = await apiRequest("POST", `/api/teams/${teamId}/events`, data);
  return res.json();
}

export async function updateEvent(eventId: string, data: Partial<{
  title: string;
  type: string;
  date: string;
  endDate?: string | null;
  location?: string | null;
  details?: string | null;
}>): Promise<Event> {
  const res = await apiRequest("PATCH", `/api/events/${eventId}`, data);
  return res.json();
}

export async function deleteEvent(eventId: string): Promise<void> {
  await apiRequest("DELETE", `/api/events/${eventId}`, {});
}

export interface HighlightVideo {
  id: string;
  teamId: string;
  uploaderId: string;
  title?: string | null;
  originalKey?: string | null;
  processedKey?: string | null;
  thumbnailKey?: string | null;
  publicUrl?: string | null;
  status: string;
  durationSeconds?: number | null;
  fileSizeBytes?: number | null;
  createdAt?: string | null;
  uploader: User;
}

export async function getTeamHighlights(teamId: string): Promise<HighlightVideo[]> {
  const res = await fetch(`/api/teams/${teamId}/highlights`);
  if (!res.ok) throw new Error("Failed to get highlights");
  return res.json();
}

export async function getAllTeamHighlights(teamId: string): Promise<HighlightVideo[]> {
  const res = await fetch(`/api/teams/${teamId}/highlights/all`);
  if (!res.ok) throw new Error("Failed to get highlights");
  return res.json();
}

export async function requestVideoUpload(teamId: string, userId: string, fileName: string, fileSize: number, contentType: string): Promise<{
  uploadURL: string;
  objectPath: string;
  videoId: string;
}> {
  const res = await apiRequest("POST", `/api/teams/${teamId}/highlights/request-upload`, {
    userId,
    fileName,
    fileSize,
    contentType,
  });
  return res.json();
}

export async function completeVideoUpload(videoId: string): Promise<void> {
  await apiRequest("POST", `/api/highlights/${videoId}/complete-upload`, {});
}

export async function deleteHighlightVideo(videoId: string, userId: string): Promise<void> {
  await apiRequest("DELETE", `/api/highlights/${videoId}`, { userId });
}

export interface Play {
  id: string;
  teamId: string;
  createdById: string;
  name: string;
  description?: string | null;
  canvasData: string;
  thumbnailData?: string | null;
  category: string;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy: User;
}

export async function getTeamPlays(teamId: string): Promise<Play[]> {
  const res = await fetch(`/api/teams/${teamId}/plays`);
  if (!res.ok) throw new Error("Failed to get plays");
  return res.json();
}

export async function createPlay(teamId: string, userId: string, data: {
  name: string;
  description?: string;
  canvasData: string;
  thumbnailData?: string;
  category: string;
}): Promise<Play> {
  const res = await apiRequest("POST", `/api/teams/${teamId}/plays`, { ...data, userId });
  return res.json();
}

export async function updatePlay(playId: string, userId: string, data: {
  name?: string;
  description?: string;
  canvasData?: string;
  status?: string;
}): Promise<Play> {
  const res = await apiRequest("PATCH", `/api/plays/${playId}`, { ...data, userId });
  return res.json();
}

export async function deletePlay(playId: string, userId: string): Promise<void> {
  await apiRequest("DELETE", `/api/plays/${playId}`, { userId });
}

export interface ManagedAthlete {
  id: string;
  supporterId: string;
  athleteId: string;
  createdAt?: string | null;
  athlete: User;
}

export async function getManagedAthletes(supporterId: string): Promise<ManagedAthlete[]> {
  const res = await fetch(`/api/users/${supporterId}/managed-athletes`);
  if (!res.ok) throw new Error("Failed to get managed athletes");
  return res.json();
}

export async function createManagedAthlete(supporterId: string, data: {
  teamCode: string;
  firstName: string;
  lastName: string;
}): Promise<ManagedAthlete & { team: Team }> {
  const res = await apiRequest("POST", `/api/users/${supporterId}/managed-athletes`, data);
  return res.json();
}

export async function deleteManagedAthlete(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/managed-athletes/${id}`, {});
}

// ================== StatTracker API ==================

export interface Game {
  id: string;
  teamId: string;
  eventId?: string | null;
  trackingMode: string; // 'individual' or 'team'
  status: string; // 'setup', 'active', 'paused', 'completed'
  currentPeriod: number;
  totalPeriods: number;
  periodType: string; // 'quarter', 'half', 'period'
  teamScore: number;
  opponentScore: number;
  opponentName?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt?: string | null;
  event?: Event;
}

export interface StatConfig {
  id: string;
  teamId: string;
  name: string;
  shortName: string;
  value: number;
  positions?: string[] | null;
  category: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string | null;
}

export interface GameStat {
  id: string;
  gameId: string;
  statConfigId: string;
  athleteId?: string | null;
  period: number;
  value: number;
  pointsValue: number;
  isDeleted: boolean;
  recordedAt?: string | null;
  recordedById?: string | null;
  statConfig: StatConfig;
  athlete?: User;
}

export interface GameRoster {
  id: string;
  gameId: string;
  athleteId: string;
  jerseyNumber?: string | null;
  positions?: string[] | null;
  isInGame: boolean;
  createdAt?: string | null;
  athlete: User;
}

// Games
export async function getTeamGames(teamId: string): Promise<Game[]> {
  const res = await fetch(`/api/teams/${teamId}/games`);
  if (!res.ok) throw new Error("Failed to get games");
  return res.json();
}

export interface TeamAggregateStats {
  games: number;
  wins: number;
  losses: number;
  statTotals: Record<string, { name: string; total: number }>;
}

export async function getTeamAggregateStats(teamId: string): Promise<TeamAggregateStats> {
  const res = await fetch(`/api/teams/${teamId}/stats/aggregate`);
  if (!res.ok) throw new Error("Failed to get aggregate stats");
  return res.json();
}

export interface AdvancedTeamStats {
  gameHistory: Array<{
    id: string;
    date: string;
    opponent: string;
    teamScore: number;
    opponentScore: number;
    result: 'W' | 'L' | 'T';
    stats: Record<string, number>;
  }>;
  athletePerformance: Array<{
    athleteId: string;
    athleteName: string;
    gamesPlayed: number;
    stats: Record<string, number>;
    recentGames: Array<{ gameId: string; stats: Record<string, number> }>;
    hotStreak: boolean;
    streakLength: number;
  }>;
  ratios: Record<string, { name: string; value: number; description: string }>;
}

export async function getAdvancedTeamStats(teamId: string): Promise<AdvancedTeamStats> {
  const res = await fetch(`/api/teams/${teamId}/stats/advanced`);
  if (!res.ok) throw new Error("Failed to get advanced stats");
  return res.json();
}

export async function getGame(gameId: string): Promise<Game> {
  const res = await fetch(`/api/games/${gameId}`);
  if (!res.ok) throw new Error("Failed to get game");
  return res.json();
}

export async function getGameByEvent(eventId: string): Promise<Game | null> {
  const res = await fetch(`/api/events/${eventId}/game`);
  if (!res.ok) throw new Error("Failed to get game");
  return res.json();
}

export async function createGame(teamId: string, requesterId: string, data: {
  eventId?: string;
  trackingMode: string;
  totalPeriods: number;
  periodType: string;
  opponentName?: string;
}): Promise<Game> {
  const res = await apiRequest("POST", `/api/teams/${teamId}/games?requesterId=${requesterId}`, data);
  return res.json();
}

export async function updateGame(gameId: string, requesterId: string, data: {
  status?: string;
  currentPeriod?: number;
  teamScore?: number;
  opponentScore?: number;
  startedAt?: string;
  endedAt?: string;
}): Promise<Game> {
  const res = await apiRequest("PATCH", `/api/games/${gameId}?requesterId=${requesterId}`, data);
  return res.json();
}

export async function deleteGame(gameId: string, requesterId: string): Promise<void> {
  await apiRequest("DELETE", `/api/games/${gameId}?requesterId=${requesterId}`, {});
}

// Stat Configurations
export async function getTeamStatConfigs(teamId: string): Promise<StatConfig[]> {
  const res = await fetch(`/api/teams/${teamId}/stat-configs`);
  if (!res.ok) throw new Error("Failed to get stat configurations");
  return res.json();
}

export async function createStatConfig(teamId: string, requesterId: string, data: {
  name: string;
  shortName: string;
  value: number;
  positions?: string[];
  category: string;
  displayOrder?: number;
}): Promise<StatConfig> {
  const res = await apiRequest("POST", `/api/teams/${teamId}/stat-configs?requesterId=${requesterId}`, data);
  return res.json();
}

export async function updateStatConfig(configId: string, requesterId: string, data: {
  name?: string;
  shortName?: string;
  value?: number;
  positions?: string[];
  category?: string;
  isActive?: boolean;
  displayOrder?: number;
}): Promise<StatConfig> {
  const res = await apiRequest("PATCH", `/api/stat-configs/${configId}?requesterId=${requesterId}`, data);
  return res.json();
}

export async function deleteStatConfig(configId: string, requesterId: string): Promise<void> {
  await apiRequest("DELETE", `/api/stat-configs/${configId}?requesterId=${requesterId}`, {});
}

// Game Stats
export async function getGameStats(gameId: string): Promise<GameStat[]> {
  const res = await fetch(`/api/games/${gameId}/stats`);
  if (!res.ok) throw new Error("Failed to get game stats");
  return res.json();
}

export async function recordGameStat(gameId: string, requesterId: string, data: {
  statConfigId: string;
  athleteId?: string;
  period: number;
  value?: number;
  pointsValue: number;
}): Promise<GameStat> {
  const res = await apiRequest("POST", `/api/games/${gameId}/stats?requesterId=${requesterId}`, data);
  return res.json();
}

export async function deleteGameStat(statId: string, requesterId: string, hard?: boolean): Promise<void> {
  await apiRequest("DELETE", `/api/game-stats/${statId}?requesterId=${requesterId}${hard ? '&hard=true' : ''}`, {});
}

// Game Roster
export async function getGameRoster(gameId: string): Promise<GameRoster[]> {
  const res = await fetch(`/api/games/${gameId}/roster`);
  if (!res.ok) throw new Error("Failed to get game roster");
  return res.json();
}

export async function addToGameRoster(gameId: string, requesterId: string, data: {
  athleteId: string;
  jerseyNumber?: string;
  positions?: string[];
  isInGame?: boolean;
}): Promise<GameRoster> {
  const res = await apiRequest("POST", `/api/games/${gameId}/roster?requesterId=${requesterId}`, data);
  return res.json();
}

export async function updateGameRoster(rosterId: string, requesterId: string, data: {
  jerseyNumber?: string;
  positions?: string[];
  isInGame?: boolean;
}): Promise<GameRoster> {
  const res = await apiRequest("PATCH", `/api/game-roster/${rosterId}?requesterId=${requesterId}`, data);
  return res.json();
}

export async function bulkCreateGameRoster(gameId: string, requesterId: string): Promise<GameRoster[]> {
  const res = await apiRequest("POST", `/api/games/${gameId}/roster/bulk?requesterId=${requesterId}`, {});
  return res.json();
}

// Starting Lineup
export interface StartingLineupPlayer {
  id: string;
  lineupId: string;
  teamMemberId: string;
  positionOverride?: string | null;
  orderIndex: number;
  isStarter: boolean;
  createdAt?: string | null;
  teamMember: TeamMember;
}

export interface StartingLineup {
  id: string;
  eventId: string;
  teamId: string;
  createdById: string;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  players: StartingLineupPlayer[];
}

export async function getStartingLineup(eventId: string): Promise<StartingLineup | null> {
  const res = await fetch(`/api/events/${eventId}/lineup`);
  if (!res.ok) throw new Error("Failed to get starting lineup");
  return res.json();
}

export async function saveStartingLineup(eventId: string, requesterId: string, data: {
  notes?: string;
  players: {
    teamMemberId: string;
    positionOverride?: string;
    orderIndex?: number;
    isStarter: boolean;
  }[];
}): Promise<StartingLineup> {
  const res = await apiRequest("PUT", `/api/events/${eventId}/lineup?requesterId=${requesterId}`, data);
  return res.json();
}

export async function deleteStartingLineup(eventId: string, requesterId: string): Promise<void> {
  await apiRequest("DELETE", `/api/events/${eventId}/lineup?requesterId=${requesterId}`, {});
}
