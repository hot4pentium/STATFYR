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
  createdAt?: string | null;
  lastAccessedAt?: string | null;
  mustChangePassword?: boolean;
  isSuperAdmin?: boolean;
  athleteCode?: string | null;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  sport: string;
  division?: string | null;
  season?: string | null;
  badgeId?: string | null;
  teamColor?: string | null;
  coachId?: string | null;
  createdAt?: string | null;
  wins?: number;
  losses?: number;
  ties?: number;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  jerseyNumber?: string | null;
  position?: string | null;
  joinedAt?: string | null;
  promotedToStaffAt?: string | null;
  staffPromotionSeen?: boolean | null;
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

export type FirebaseSyncResponse = User | { needsRoleSelection: true; message: string };

export async function syncFirebaseUser(data: {
  firebaseUid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: string;
}): Promise<FirebaseSyncResponse> {
  const res = await apiRequest("POST", "/api/auth/firebase-sync", data);
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

export async function updateTeam(id: string, data: Partial<{ name: string; sport: string; season: string; badgeId: string | null; teamColor: string | null }>): Promise<Team> {
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

export async function getUnreadMessageCount(userId: string): Promise<number> {
  const res = await fetch(`/api/users/${userId}/unread-count`);
  if (!res.ok) throw new Error("Failed to get unread count");
  const data = await res.json();
  return data.count;
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

export async function markStaffPromotionSeen(teamId: string, userId: string): Promise<void> {
  await apiRequest("POST", `/api/teams/${teamId}/members/${userId}/promotion-seen`, {});
}

export async function getTeamEvents(teamId: string): Promise<Event[]> {
  const res = await fetch(`/api/teams/${teamId}/events`);
  if (!res.ok) throw new Error("Failed to get team events");
  return res.json();
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const res = await fetch(`/api/events/${eventId}`);
  if (!res.ok) return null;
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

// ================== Play Outcomes API ==================

export interface PlayOutcome {
  id: string;
  playId: string;
  gameId?: string | null;
  teamId: string;
  recordedById: string;
  outcome: 'success' | 'needs_work' | 'unsuccessful';
  notes?: string | null;
  recordedAt: string;
}

export async function createPlayOutcome(data: {
  playId: string;
  gameId?: string | null;
  outcome: 'success' | 'needs_work' | 'unsuccessful';
  notes?: string;
  userId: string;
}): Promise<PlayOutcome> {
  const res = await apiRequest("POST", `/api/play-outcomes`, data);
  return res.json();
}

export async function getPlayOutcomes(playId: string): Promise<PlayOutcome[]> {
  const res = await fetch(`/api/plays/${playId}/outcomes`);
  if (!res.ok) throw new Error("Failed to get play outcomes");
  return res.json();
}

export async function getPlayOutcomeStats(playId: string): Promise<{
  playId: string;
  total: number;
  success: number;
  needs_work: number;
  unsuccessful: number;
  successRate: number;
}> {
  const res = await fetch(`/api/plays/${playId}/stats`);
  if (!res.ok) throw new Error("Failed to get play outcome stats");
  return res.json();
}

export interface TeamPlayStats {
  [playId: string]: {
    total: number;
    success: number;
    needsWork: number;
    unsuccessful: number;
    successRate: number | null;
  };
}

export async function getTeamPlayStats(teamId: string): Promise<TeamPlayStats> {
  const res = await fetch(`/api/teams/${teamId}/play-stats`);
  if (!res.ok) throw new Error("Failed to get team play stats");
  return res.json();
}

export interface PlayNote {
  text: string;
  outcome: string;
  recordedAt: string;
}

export interface GamePlayStats {
  playName: string;
  playType: string;
  total: number;
  success: number;
  needsWork: number;
  unsuccessful: number;
  successRate: number | null;
  notes: PlayNote[];
}

export interface GamePlayOutcomes {
  totalOutcomes: number;
  playStats: Record<string, GamePlayStats>;
}

export async function getGamePlayOutcomes(gameId: string, userId: string): Promise<GamePlayOutcomes> {
  const res = await fetch(`/api/games/${gameId}/play-outcomes?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to get game play outcomes");
  return res.json();
}

export interface ManagedAthlete {
  id: string;
  supporterId: string;
  athleteId: string | null;
  athleteName?: string | null;
  sport?: string | null;
  position?: string | null;
  number?: string | null;
  isOwner?: boolean;
  profileImageUrl?: string | null;
  nickname?: string | null;
  createdAt?: string | null;
  athlete?: User;
  team?: Team;
}

export async function getManagedAthletes(supporterId: string): Promise<ManagedAthlete[]> {
  const res = await fetch(`/api/supporter/managed-athletes`, {
    headers: { "x-user-id": supporterId },
  });
  if (!res.ok) throw new Error("Failed to get managed athletes");
  const data = await res.json();
  return data.managedAthletes || [];
}

export interface ManagedAthleteLimitError {
  error: string;
  code: "LIMIT_REACHED";
  maxAllowed: number;
  current: number;
  requiresUpgrade: boolean;
}

export async function createManagedAthlete(supporterId: string, data: {
  teamCode?: string;
  firstName: string;
  lastName: string;
  sport?: string;
  position?: string;
  number?: string;
}): Promise<ManagedAthlete & { team?: Team; athlete?: { name: string } }> {
  const res = await fetch(`/api/users/${supporterId}/managed-athletes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Failed to create managed athlete" }));
    if (errorData.code === "LIMIT_REACHED") {
      const error = new Error(errorData.error) as Error & { limitReached: true; requiresUpgrade: boolean };
      error.limitReached = true;
      error.requiresUpgrade = errorData.requiresUpgrade;
      throw error;
    }
    throw new Error(errorData.error || "Failed to create managed athlete");
  }
  
  return res.json();
}

export async function deleteManagedAthlete(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/managed-athletes/${id}`, {});
}

// ================== Supporter Events API ==================

export interface SupporterEvent {
  id: string;
  supporterId: string;
  managedAthleteId: string;
  title: string;
  description?: string | null;
  eventType: string;
  startTime: string;
  endTime?: string | null;
  location?: string | null;
  opponentName?: string | null;
  notes?: string | null;
  createdAt?: string | null;
}

export async function getSupporterEvents(managedAthleteId: string, userId: string): Promise<SupporterEvent[]> {
  const res = await fetch(`/api/supporter/managed-athletes/${managedAthleteId}/events`, {
    headers: { "x-user-id": userId },
  });
  if (!res.ok) throw new Error("Failed to get events");
  const data = await res.json();
  return data.events;
}

export async function createSupporterEvent(managedAthleteId: string, userId: string, data: {
  title: string;
  description?: string;
  eventType: string;
  startTime: string;
  endTime?: string;
  location?: string;
  opponentName?: string;
  notes?: string;
}): Promise<SupporterEvent> {
  const res = await fetch(`/api/supporter/managed-athletes/${managedAthleteId}/events`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": userId,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create event");
  const result = await res.json();
  return result.event;
}

export async function updateSupporterEvent(eventId: string, userId: string, data: {
  title?: string;
  description?: string;
  eventType?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  opponentName?: string;
}): Promise<SupporterEvent> {
  const res = await fetch(`/api/supporter/events/${eventId}`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": userId,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update event");
  const result = await res.json();
  return result.event;
}

export async function deleteSupporterEvent(eventId: string, userId: string): Promise<void> {
  const res = await fetch(`/api/supporter/events/${eventId}`, {
    method: "DELETE",
    headers: { "x-user-id": userId },
  });
  if (!res.ok) throw new Error("Failed to delete event");
}

// ================== Supporter Stat Sessions API ==================

export interface SupporterStatSession {
  id: string;
  supporterId: string;
  managedAthleteId: string;
  eventId?: string | null;
  sport?: string | null;
  opponentName?: string | null;
  status: string;
  currentPeriod: number;
  totalPeriods: number;
  periodType: string;
  athleteScore: number;
  opponentScore: number;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt?: string | null;
}

export interface SupporterStatEntry {
  id: string;
  sessionId: string;
  statName: string;
  statShortName?: string | null;
  value: number;
  pointsValue: number;
  period: number;
  recordedAt?: string | null;
}

export interface SupporterStatsSummary {
  totalSessions: number;
  totalStats: number;
  recentSessions: SupporterStatSession[];
  statTotals: { statName: string; total: number }[];
}

export async function getSupporterStatsSummary(managedAthleteId: string, userId: string): Promise<SupporterStatsSummary> {
  const res = await fetch(`/api/supporter/managed-athletes/${managedAthleteId}/stats-summary`, {
    headers: { "x-user-id": userId },
  });
  if (!res.ok) throw new Error("Failed to get stats summary");
  return res.json();
}

export async function getSupporterStatSessions(managedAthleteId: string, userId: string): Promise<SupporterStatSession[]> {
  const res = await fetch(`/api/supporter/managed-athletes/${managedAthleteId}/stat-sessions`, {
    headers: { "x-user-id": userId },
  });
  if (!res.ok) throw new Error("Failed to get stat sessions");
  const data = await res.json();
  return data.sessions;
}

export async function createSupporterStatSession(managedAthleteId: string, userId: string, data: {
  eventId?: string;
  sport?: string;
  opponentName?: string;
  totalPeriods?: number;
  periodType?: string;
}): Promise<SupporterStatSession> {
  const res = await fetch(`/api/supporter/managed-athletes/${managedAthleteId}/stat-sessions`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": userId,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create stat session");
  const result = await res.json();
  return result.session;
}

export async function updateSupporterStatSession(sessionId: string, userId: string, data: {
  status?: string;
  currentPeriod?: number;
  athleteScore?: number;
  opponentScore?: number;
  endedAt?: string | null;
}): Promise<SupporterStatSession> {
  const res = await fetch(`/api/supporter/stat-sessions/${sessionId}`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": userId,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update stat session");
  const result = await res.json();
  return result.session;
}

export async function getSupporterStatEntries(sessionId: string, userId: string): Promise<SupporterStatEntry[]> {
  const res = await fetch(`/api/supporter/stat-sessions/${sessionId}/entries`, {
    headers: { "x-user-id": userId },
  });
  if (!res.ok) throw new Error("Failed to get stat entries");
  const data = await res.json();
  return data.entries;
}

export async function createSupporterStatEntry(sessionId: string, userId: string, data: {
  statName: string;
  statShortName?: string;
  value?: number;
  pointsValue?: number;
  period?: number;
}): Promise<SupporterStatEntry> {
  const res = await fetch(`/api/supporter/stat-sessions/${sessionId}/entries`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": userId,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create stat entry");
  const result = await res.json();
  return result.entry;
}

export async function deleteSupporterStatEntryById(entryId: string, userId: string): Promise<void> {
  const res = await fetch(`/api/supporter/stat-entries/${entryId}`, {
    method: "DELETE",
    headers: { "x-user-id": userId },
  });
  if (!res.ok) throw new Error("Failed to delete stat entry");
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

export interface AthleteStats {
  gamesPlayed: number;
  stats: Record<string, { name: string; total: number; perGame: number }>;
  gameHistory: Array<{ gameId: string; date: string; opponent: string; result: 'W' | 'L' | 'T'; stats: Record<string, number> }>;
  hotStreak: boolean;
  streakLength: number;
}

export async function getAthleteStats(teamId: string, athleteId: string): Promise<AthleteStats> {
  const res = await fetch(`/api/teams/${teamId}/athletes/${athleteId}/stats`);
  if (!res.ok) throw new Error("Failed to get athlete stats");
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

// ============ SHOUTOUTS ============

export interface Shoutout {
  id: string;
  gameId: string;
  supporterId: string;
  athleteId: string;
  message: string;
  createdAt?: string | null;
  supporter?: User;
  athlete?: User;
  game?: Game;
}

export async function getGameShoutouts(gameId: string): Promise<Shoutout[]> {
  const res = await fetch(`/api/games/${gameId}/shoutouts`);
  if (!res.ok) throw new Error("Failed to get shoutouts");
  return res.json();
}

export async function getAthleteShoutouts(athleteId: string, limit = 50): Promise<Shoutout[]> {
  const res = await fetch(`/api/athletes/${athleteId}/shoutouts?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to get shoutouts");
  return res.json();
}

export async function getAthleteShoutoutCount(athleteId: string): Promise<number> {
  const res = await fetch(`/api/athletes/${athleteId}/shoutouts/count`);
  if (!res.ok) throw new Error("Failed to get shoutout count");
  const data = await res.json();
  return data.count;
}

export async function sendShoutout(gameId: string, supporterId: string, athleteId: string, message: string): Promise<Shoutout> {
  const res = await apiRequest("POST", `/api/games/${gameId}/shoutouts?supporterId=${supporterId}`, { athleteId, message });
  return res.json();
}

// ============ LIVE TAPS ============

export interface LiveTapEvent {
  id: string;
  gameId: string;
  supporterId: string;
  teamId: string;
  tapCount: number;
  createdAt?: string | null;
}

export interface TapResponse {
  tapEvent: LiveTapEvent;
  seasonTotal: number;
  gameTapCount: number;
}

export async function sendTapBurst(gameId: string, supporterId: string, tapCount: number): Promise<TapResponse> {
  const res = await apiRequest("POST", `/api/games/${gameId}/taps?supporterId=${supporterId}`, { tapCount });
  return res.json();
}

export async function getGameTapCount(gameId: string): Promise<{ count: number }> {
  const res = await fetch(`/api/games/${gameId}/taps`);
  if (!res.ok) throw new Error("Failed to get tap count");
  return res.json();
}

export async function getSupporterTapTotal(supporterId: string, teamId: string, season = "2024-2025"): Promise<{ totalTaps: number }> {
  const res = await fetch(`/api/supporters/${supporterId}/taps?teamId=${teamId}&season=${season}`);
  if (!res.ok) throw new Error("Failed to get tap total");
  return res.json();
}

export async function getTeamEngagementStats(teamId: string): Promise<{ totalTaps: number; totalShoutouts: number }> {
  const res = await fetch(`/api/teams/${teamId}/engagement-stats`);
  if (!res.ok) throw new Error("Failed to get team engagement stats");
  return res.json();
}

export interface TopTapper {
  supporterId: string;
  totalTaps: number;
  supporter: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export async function getTopTappers(teamId: string, limit: number = 5): Promise<TopTapper[]> {
  const res = await fetch(`/api/teams/${teamId}/top-tappers?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to get top tappers");
  return res.json();
}

// ============ BADGES ============

export interface BadgeDefinition {
  id: string;
  name: string;
  tier: number;
  tapThreshold: number;
  themeId: string;
  iconEmoji: string;
  color: string;
  description?: string | null;
  createdAt?: string | null;
}

export interface SupporterBadge {
  id: string;
  supporterId: string;
  badgeId: string;
  teamId: string;
  season: string;
  earnedAt?: string | null;
  badge: BadgeDefinition;
}

export async function getAllBadges(): Promise<BadgeDefinition[]> {
  const res = await fetch("/api/badges");
  if (!res.ok) throw new Error("Failed to get badges");
  return res.json();
}

export async function getSupporterBadges(supporterId: string, teamId: string, season = "2024-2025"): Promise<SupporterBadge[]> {
  const res = await fetch(`/api/supporters/${supporterId}/badges?teamId=${teamId}&season=${season}`);
  if (!res.ok) throw new Error("Failed to get badges");
  return res.json();
}

export interface CheckBadgesResponse {
  earnedBadges: SupporterBadge[];
  newBadges: Array<SupporterBadge & { badge: BadgeDefinition }>;
}

export async function checkBadges(supporterId: string, teamId: string, season = "2024-2025"): Promise<CheckBadgesResponse> {
  const res = await apiRequest("POST", `/api/supporters/${supporterId}/check-badges?teamId=${teamId}&season=${season}`, {});
  return res.json();
}

// ============ THEMES ============

export interface ThemeUnlock {
  id: string;
  supporterId: string;
  themeId: string;
  isActive: boolean;
  unlockedAt?: string | null;
}

export async function getSupporterThemes(supporterId: string): Promise<ThemeUnlock[]> {
  const res = await fetch(`/api/supporters/${supporterId}/themes`);
  if (!res.ok) throw new Error("Failed to get themes");
  return res.json();
}

export async function getActiveTheme(supporterId: string): Promise<ThemeUnlock | null> {
  const res = await fetch(`/api/supporters/${supporterId}/themes/active`);
  if (!res.ok) throw new Error("Failed to get active theme");
  return res.json();
}

export async function activateTheme(supporterId: string, themeId: string): Promise<ThemeUnlock> {
  const res = await apiRequest("POST", `/api/supporters/${supporterId}/themes/${themeId}/activate`, {});
  return res.json();
}

export async function getActiveGames(teamId: string): Promise<Game[]> {
  const res = await fetch(`/api/teams/${teamId}/games?status=active`);
  if (!res.ok) throw new Error("Failed to get active games");
  return res.json();
}

// ============ LIVE ENGAGEMENT SESSIONS ============

export interface LiveEngagementSession {
  id: string;
  eventId: string;
  teamId: string;
  gameId?: string | null;
  status: string; // "scheduled" | "live" | "ended"
  scheduledStart: string;
  scheduledEnd?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  extendedUntil?: string | null;
  startedBy?: string | null;
  endedBy?: string | null;
  createdAt?: string | null;
  event?: Event;
}

export async function getLiveSession(sessionId: string): Promise<LiveEngagementSession> {
  const res = await fetch(`/api/live-sessions/${sessionId}`);
  if (!res.ok) throw new Error("Failed to get live session");
  return res.json();
}

export async function getActiveLiveSessions(teamId: string): Promise<LiveEngagementSession[]> {
  const res = await fetch(`/api/teams/${teamId}/live-sessions/active`);
  if (!res.ok) throw new Error("Failed to get active sessions");
  return res.json();
}

export async function getUpcomingLiveSessions(teamId: string): Promise<LiveEngagementSession[]> {
  const res = await fetch(`/api/teams/${teamId}/live-sessions/upcoming`);
  if (!res.ok) throw new Error("Failed to get upcoming sessions");
  return res.json();
}

export async function getEventLiveSession(eventId: string): Promise<LiveEngagementSession> {
  const res = await fetch(`/api/events/${eventId}/live-session`);
  if (!res.ok) throw new Error("Failed to get event session");
  return res.json();
}

export async function createEventLiveSession(eventId: string): Promise<LiveEngagementSession> {
  const res = await apiRequest("POST", `/api/events/${eventId}/live-session`, {});
  return res.json();
}

export async function startLiveSession(sessionId: string, startedBy?: string): Promise<LiveEngagementSession> {
  const res = await apiRequest("POST", `/api/live-sessions/${sessionId}/start`, { startedBy });
  return res.json();
}

export async function endLiveSession(sessionId: string, endedBy?: string): Promise<LiveEngagementSession> {
  const res = await apiRequest("POST", `/api/live-sessions/${sessionId}/end`, { endedBy });
  return res.json();
}

export async function extendLiveSession(sessionId: string): Promise<LiveEngagementSession> {
  const res = await apiRequest("POST", `/api/live-sessions/${sessionId}/extend`, {});
  return res.json();
}

export async function getSessionTapCount(sessionId: string): Promise<{ count: number }> {
  const res = await fetch(`/api/live-sessions/${sessionId}/taps`);
  if (!res.ok) throw new Error("Failed to get session tap count");
  return res.json();
}

export async function sendSessionTaps(sessionId: string, supporterId: string, tapCount: number): Promise<{ seasonTotal: number; sessionTapCount: number }> {
  const res = await apiRequest("POST", `/api/live-sessions/${sessionId}/taps`, { supporterId, tapCount });
  return res.json();
}

export async function getSessionShoutouts(sessionId: string): Promise<Shoutout[]> {
  const res = await fetch(`/api/live-sessions/${sessionId}/shoutouts`);
  if (!res.ok) throw new Error("Failed to get session shoutouts");
  return res.json();
}

export async function sendSessionShoutout(sessionId: string, supporterId: string, athleteId: string, message: string): Promise<Shoutout> {
  const res = await apiRequest("POST", `/api/live-sessions/${sessionId}/shoutouts`, { supporterId, athleteId, message });
  return res.json();
}

export async function getSessionRoster(sessionId: string): Promise<TeamMember[]> {
  const res = await fetch(`/api/live-sessions/${sessionId}/roster`);
  if (!res.ok) throw new Error("Failed to get session roster");
  return res.json();
}

export async function checkSessionLifecycle(teamId: string): Promise<{ autoStarted: string[]; autoEnded: string[] }> {
  const res = await apiRequest("POST", `/api/live-sessions/check-lifecycle`, { teamId });
  return res.json();
}

export async function getLiveSessionByEvent(eventId: string): Promise<LiveEngagementSession | null> {
  const res = await fetch(`/api/events/${eventId}/live-session`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to get session for event");
  return res.json();
}

export async function createLiveSessionForEvent(eventId: string, teamId: string, scheduledStart: Date, scheduledEnd?: Date): Promise<LiveEngagementSession> {
  const res = await apiRequest("POST", `/api/events/${eventId}/live-session`, {
    teamId,
    scheduledStart: scheduledStart.toISOString(),
    scheduledEnd: scheduledEnd?.toISOString() || null,
  });
  return res.json();
}

// ============ SUPER ADMIN API ============

export interface AdminUser {
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
  createdAt?: string | null;
  lastAccessedAt?: string | null;
  mustChangePassword?: boolean;
  isSuperAdmin?: boolean;
}

export interface AdminTeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  jerseyNumber?: string | null;
  position?: string | null;
  joinedAt?: string | null;
  team: Team;
}

export interface ImpersonationSession {
  id: string;
  adminId: string;
  targetUserId: string;
  expiresAt: string;
  endedAt?: string | null;
  createdAt?: string | null;
}

export async function adminSearchUsers(query: string, requesterId: string): Promise<AdminUser[]> {
  const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}&requesterId=${requesterId}`);
  if (!res.ok) {
    if (res.status === 403) throw new Error("Super admin access required");
    throw new Error("Search failed");
  }
  return res.json();
}

export async function adminGetUserWithTeams(userId: string, requesterId: string): Promise<{ user: AdminUser; teams: AdminTeamMember[] }> {
  const res = await fetch(`/api/admin/users/${userId}?requesterId=${requesterId}`);
  if (!res.ok) {
    if (res.status === 403) throw new Error("Super admin access required");
    throw new Error("Failed to get user");
  }
  return res.json();
}

export async function adminUpdateTeamMember(memberId: string, data: { role?: string; jerseyNumber?: string | null; position?: string | null }, requesterId: string): Promise<TeamMember> {
  const res = await apiRequest("PATCH", `/api/admin/team-members/${memberId}?requesterId=${requesterId}`, data);
  return res.json();
}

export async function adminRemoveTeamMember(memberId: string, requesterId: string): Promise<void> {
  await apiRequest("DELETE", `/api/admin/team-members/${memberId}?requesterId=${requesterId}`, {});
}

export async function adminAddTeamMember(data: { teamId: string; userId: string; role?: string; requesterId: string }): Promise<TeamMember> {
  const res = await apiRequest("POST", `/api/admin/team-members?requesterId=${data.requesterId}`, data);
  return res.json();
}

export async function adminGetAllTeams(requesterId: string): Promise<Team[]> {
  const res = await fetch(`/api/admin/teams?requesterId=${requesterId}`);
  if (!res.ok) {
    if (res.status === 403) throw new Error("Super admin access required");
    throw new Error("Failed to get teams");
  }
  return res.json();
}

export async function adminDeleteTeam(teamId: string, requesterId: string): Promise<void> {
  const res = await fetch(`/api/admin/teams/${teamId}?requesterId=${requesterId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error("Super admin access required");
    throw new Error("Failed to delete team");
  }
}

export async function adminStartImpersonation(targetUserId: string, requesterId: string): Promise<{ session: ImpersonationSession; targetUser: AdminUser }> {
  const res = await apiRequest("POST", `/api/admin/impersonate?requesterId=${requesterId}`, { targetUserId, requesterId });
  return res.json();
}

export async function adminStopImpersonation(requesterId: string): Promise<void> {
  await apiRequest("POST", `/api/admin/impersonate/stop?requesterId=${requesterId}`, { requesterId });
}

export async function adminGetCurrentImpersonation(requesterId: string): Promise<{ session: ImpersonationSession | null; targetUser?: AdminUser }> {
  const res = await fetch(`/api/admin/impersonate/current?requesterId=${requesterId}`);
  if (!res.ok) {
    if (res.status === 403) throw new Error("Super admin access required");
    throw new Error("Failed to get impersonation session");
  }
  return res.json();
}

// ============ ADMIN SUBSCRIPTION MANAGEMENT ============

export interface AdminSubscription {
  id?: string;
  userId?: string;
  tier: string;
  status: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}

export interface UserWithSubscription {
  user: AdminUser;
  subscription: AdminSubscription;
}

export async function adminGetAllSubscriptions(requesterId: string): Promise<UserWithSubscription[]> {
  const res = await fetch(`/api/admin/subscriptions?requesterId=${requesterId}`);
  if (!res.ok) {
    if (res.status === 403) throw new Error("Super admin access required");
    throw new Error("Failed to get subscriptions");
  }
  return res.json();
}

export async function adminGetUserSubscription(userId: string, requesterId: string): Promise<{ subscription: AdminSubscription }> {
  const res = await fetch(`/api/admin/subscriptions/${userId}?requesterId=${requesterId}`);
  if (!res.ok) {
    if (res.status === 403) throw new Error("Super admin access required");
    throw new Error("Failed to get subscription");
  }
  return res.json();
}

export async function adminUpdateUserSubscription(
  userId: string, 
  data: { tier: string; status?: string }, 
  requesterId: string
): Promise<{ subscription: AdminSubscription; message: string }> {
  const res = await apiRequest("PATCH", `/api/admin/subscriptions/${userId}?requesterId=${requesterId}`, data);
  return res.json();
}

// ============ ADMIN MESSAGING ============

export interface AdminBroadcastResult {
  success: boolean;
  message: { id: string; type: string; title: string; message: string };
  recipientCount: number;
  pushResult: { successCount: number; failureCount: number };
}

export interface AdminSupportMessageResult {
  success: boolean;
  message: { id: string; type: string; message: string };
  pushSent: boolean;
}

export async function adminSendBroadcast(
  data: { title?: string; message: string; sendPush: boolean },
  requesterId: string
): Promise<AdminBroadcastResult> {
  const res = await apiRequest("POST", `/api/admin/broadcast?requesterId=${requesterId}`, data);
  return res.json();
}

export async function adminSendSupportMessage(
  userId: string,
  data: { message: string; sendPush: boolean },
  requesterId: string
): Promise<AdminSupportMessageResult> {
  const res = await apiRequest("POST", `/api/admin/message/${userId}?requesterId=${requesterId}`, data);
  return res.json();
}

// ============ HYPES (UNIFIED ENGAGEMENT) ============

export interface Hype {
  id: string;
  sessionId?: string | null;
  eventId?: string | null;
  supporterId: string;
  athleteId: string;
  teamId: string;
  createdAt?: string | null;
}

export interface AthleteHypeCount {
  athleteId: string;
  athleteName: string;
  avatar: string | null;
  hypeCount: number;
}

export async function sendHype(data: {
  supporterId: string;
  athleteId: string;
  teamId: string;
  eventId?: string;
  sessionId?: string;
}): Promise<Hype> {
  const res = await apiRequest("POST", "/api/hypes", data);
  return res.json();
}

export async function getEventHypes(eventId: string): Promise<Hype[]> {
  const res = await fetch(`/api/events/${eventId}/hypes`);
  if (!res.ok) throw new Error("Failed to get event hypes");
  return res.json();
}

export async function getAthleteEventHypeCount(eventId: string, athleteId: string): Promise<{ count: number }> {
  const res = await fetch(`/api/events/${eventId}/athletes/${athleteId}/hypes/count`);
  if (!res.ok) throw new Error("Failed to get athlete hype count");
  return res.json();
}

export async function getAthleteSeasonHypeTotal(teamId: string, athleteId: string): Promise<{ total: number }> {
  const res = await fetch(`/api/teams/${teamId}/athletes/${athleteId}/hypes/total`);
  if (!res.ok) throw new Error("Failed to get athlete hype total");
  return res.json();
}

export async function getEventHypesByAthlete(eventId: string): Promise<AthleteHypeCount[]> {
  const res = await fetch(`/api/events/${eventId}/hypes/by-athlete`);
  if (!res.ok) throw new Error("Failed to get hypes by athlete");
  return res.json();
}

// ============ SUBSCRIPTIONS & ENTITLEMENTS ============

export interface Entitlements {
  canUseStatTracker: boolean;
  canEditPlayMaker: boolean;
  canUploadHighlights: boolean;
  canViewIndividualStats: boolean;
  canViewHighlights: boolean;
  canViewRoster: boolean;
  canViewPlaybook: boolean;
  canUseChat: boolean;
  canUseGameDayLive: boolean;
  canEditEvents: boolean;
  canEditRoster: boolean;
  canPromoteMembers: boolean;
  canFollowCrossTeam: boolean;
  canTrackOwnStats: boolean;
  maxManagedAthletes: number;
  canEditExtendedProfile: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  tier: string;
  status: string;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface StripeProduct {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  metadata?: Record<string, string>;
  prices: StripePrice[];
}

export interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  recurring?: { interval: string } | null;
  active: boolean;
  metadata?: Record<string, string>;
}

export async function getEntitlements(userId: string): Promise<{ entitlements: Entitlements; tier: string; subscription: Subscription | null }> {
  const res = await fetch(`/api/entitlements`, {
    headers: { 'x-user-id': userId }
  });
  if (!res.ok) throw new Error("Failed to get entitlements");
  return res.json();
}

export async function getSubscription(userId: string): Promise<{ subscription: Subscription | null }> {
  const res = await fetch(`/api/subscription`, {
    headers: { 'x-user-id': userId }
  });
  if (!res.ok) throw new Error("Failed to get subscription");
  return res.json();
}

export async function getStripeProducts(): Promise<{ products: StripeProduct[] }> {
  const res = await fetch(`/api/stripe/products`);
  if (!res.ok) throw new Error("Failed to get products");
  return res.json();
}

export async function getStripePublishableKey(): Promise<{ publishableKey: string }> {
  const res = await fetch(`/api/stripe/publishable-key`);
  if (!res.ok) throw new Error("Failed to get Stripe key");
  return res.json();
}

export async function createCheckoutSession(userId: string, priceId: string, tier: string): Promise<{ url: string }> {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": userId 
    },
    body: JSON.stringify({ priceId, tier })
  });
  if (!res.ok) throw new Error("Failed to create checkout session");
  return res.json();
}

export async function createPortalSession(userId: string): Promise<{ url: string }> {
  const res = await fetch("/api/stripe/portal", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": userId 
    },
    body: JSON.stringify({})
  });
  if (!res.ok) throw new Error("Failed to create portal session");
  return res.json();
}

// ==================== Supporter Athlete Following ====================

export interface FollowedAthlete {
  id: string;
  athleteId: string;
  teamId: string | null;
  nickname: string | null;
  athlete: User;
  team?: Team;
}

export interface AthleteSearchResult {
  id: string;
  name: string;
  position?: string | null;
  number?: number | null;
  profileImageUrl?: string | null;
  isFollowing: boolean;
}

export async function getSupporterFollowing(userId: string): Promise<{ following: FollowedAthlete[] }> {
  const res = await fetch("/api/supporter/following", {
    headers: { "x-user-id": userId }
  });
  if (!res.ok) throw new Error("Failed to get followed athletes");
  return res.json();
}

export async function followAthlete(userId: string, athleteId: string, nickname?: string): Promise<{ isCrossTeam: boolean }> {
  const res = await fetch(`/api/supporter/follow/${athleteId}`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": userId 
    },
    body: JSON.stringify({ nickname })
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to follow athlete");
  }
  return res.json();
}

export async function unfollowAthlete(userId: string, athleteId: string): Promise<void> {
  const res = await fetch(`/api/supporter/follow/${athleteId}`, {
    method: "DELETE",
    headers: { "x-user-id": userId }
  });
  if (!res.ok) throw new Error("Failed to unfollow athlete");
}

export async function updateFollowNickname(userId: string, athleteId: string, nickname: string): Promise<void> {
  const res = await fetch(`/api/supporter/follow/${athleteId}`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": userId 
    },
    body: JSON.stringify({ nickname })
  });
  if (!res.ok) throw new Error("Failed to update nickname");
}

export async function searchAthletesToFollow(userId: string, query: string): Promise<{ athletes: AthleteSearchResult[] }> {
  const res = await fetch(`/api/supporter/search-athletes?q=${encodeURIComponent(query)}`, {
    headers: { "x-user-id": userId }
  });
  if (!res.ok) throw new Error("Failed to search athletes");
  return res.json();
}

// Supporter Stats (fallback tracking)
export interface SupporterStat {
  id: string;
  supporterId: string;
  athleteId: string;
  eventId: string | null;
  teamId: string;
  statName: string;
  statValue: number;
  period: number | null;
  notes: string | null;
  recordedAt: string;
}

export async function getSupporterStats(userId: string, athleteId: string, eventId?: string): Promise<{ stats: SupporterStat[] }> {
  const url = eventId 
    ? `/api/supporter/stats/${athleteId}?eventId=${encodeURIComponent(eventId)}`
    : `/api/supporter/stats/${athleteId}`;
  const res = await fetch(url, {
    headers: { "x-user-id": userId }
  });
  if (!res.ok) throw new Error("Failed to get supporter stats");
  return res.json();
}

export async function recordSupporterStat(
  userId: string, 
  data: { 
    athleteId: string; 
    teamId: string; 
    statName: string; 
    statValue?: number; 
    eventId?: string; 
    period?: number; 
    notes?: string 
  }
): Promise<{ stat: SupporterStat }> {
  const res = await fetch("/api/supporter/stats", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": userId 
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to record stat");
  }
  return res.json();
}

export async function deleteSupporterStat(userId: string, statId: string): Promise<void> {
  const res = await fetch(`/api/supporter/stats/${statId}`, {
    method: "DELETE",
    headers: { "x-user-id": userId }
  });
  if (!res.ok) throw new Error("Failed to delete stat");
}

export async function getAthleteSupporterStatsAggregate(
  athleteId: string, 
  teamId: string
): Promise<{ aggregate: { statName: string; total: number }[] }> {
  const res = await fetch(`/api/supporter/stats/${athleteId}/aggregate?teamId=${encodeURIComponent(teamId)}`);
  if (!res.ok) throw new Error("Failed to get aggregate stats");
  return res.json();
}

export async function getConnectedSupporter(userId: string): Promise<{ connected: boolean; supporter: { id: string; name: string; profileImageUrl?: string; hasProAccess?: boolean } | null }> {
  const res = await fetch("/api/athlete/connected-supporter", {
    headers: { "x-user-id": userId },
  });
  if (!res.ok) throw new Error("Failed to get connected supporter");
  return res.json();
}

export async function disconnectSupporter(userId: string): Promise<{ success: boolean; message: string; newCode: string }> {
  const res = await fetch("/api/athlete/disconnect-supporter", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-id": userId },
  });
  if (!res.ok) throw new Error("Failed to disconnect supporter");
  return res.json();
}

// Calendar subscription API
export async function getCalendarToken(userId: string): Promise<{ token: string; calendarUrl: string }> {
  const res = await fetch("/api/calendar/token", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-id": userId },
  });
  if (!res.ok) throw new Error("Failed to get calendar token");
  return res.json();
}

export async function regenerateCalendarToken(userId: string): Promise<{ token: string; calendarUrl: string }> {
  const res = await fetch("/api/calendar/token/regenerate", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-id": userId },
  });
  if (!res.ok) throw new Error("Failed to regenerate calendar token");
  return res.json();
}
