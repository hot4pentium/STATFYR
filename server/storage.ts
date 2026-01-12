import { 
  users, teams, teamMembers, events, highlightVideos, plays, managedAthletes, supporterEvents,
  supporterStatSessions, supporterStatEntries,
  games, statConfigurations, gameStats, gameRosters, startingLineups, startingLineupPlayers,
  shoutouts, liveTapEvents, liveTapTotals, badgeDefinitions, supporterBadges, themeUnlocks,
  liveEngagementSessions, profileLikes, profileComments, fcmTokens, chatMessages, athleteFollowers, hypePosts,
  impersonationSessions, hypes, athleteHypeTotals, directMessages, messageReads, notificationPreferences,
  supporterAthleteLinks, supporterStats, subscriptions, adminMessages,
  type User, type InsertUser,
  type Team, type InsertTeam,
  type TeamMember, type InsertTeamMember, type UpdateTeamMember,
  type Event, type InsertEvent, type UpdateEvent,
  type HighlightVideo, type InsertHighlightVideo, type UpdateHighlightVideo,
  type Play, type InsertPlay, type UpdatePlay,
  type ManagedAthlete, type InsertManagedAthlete,
  type SupporterEvent, type InsertSupporterEvent, type UpdateSupporterEvent,
  type SupporterStatSession, type InsertSupporterStatSession, type UpdateSupporterStatSession,
  type SupporterStatEntry, type InsertSupporterStatEntry,
  type Game, type InsertGame, type UpdateGame,
  type StatConfig, type InsertStatConfig, type UpdateStatConfig,
  type GameStat, type InsertGameStat,
  type GameRoster, type InsertGameRoster, type UpdateGameRoster,
  type StartingLineup, type InsertStartingLineup,
  type StartingLineupPlayer, type InsertStartingLineupPlayer,
  type Shoutout, type InsertShoutout,
  type LiveTapEvent, type InsertLiveTapEvent,
  type LiveTapTotal, type UpsertLiveTapTotal,
  type BadgeDefinition, type InsertBadgeDefinition,
  type SupporterBadge, type InsertSupporterBadge,
  type ThemeUnlock, type InsertThemeUnlock,
  type LiveEngagementSession, type InsertLiveEngagementSession, type UpdateLiveEngagementSession,
  type ProfileLike, type InsertProfileLike,
  type ProfileComment, type InsertProfileComment,
  type FcmToken, type InsertFcmToken,
  type ChatMessage, type InsertChatMessage,
  type AthleteFollower, type InsertAthleteFollower,
  type HypePost, type InsertHypePost,
  type ImpersonationSession, type InsertImpersonationSession,
  type Hype, type InsertHype,
  type AthleteHypeTotal, type InsertAthleteHypeTotal,
  type DirectMessage, type InsertDirectMessage,
  type MessageRead, type InsertMessageRead,
  type NotificationPreferences, type UpdateNotificationPreferences,
  type ChatPresence, type InsertChatPresence,
  type SupporterStat, type InsertSupporterStat,
  type AdminMessage, type InsertAdminMessage,
  type AdminMessageReceipt, type InsertAdminMessageReceipt,
  adminMessageReceipts,
  chatPresence
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, sql, or, ilike } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

function generateTeamCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateAthleteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByEmail(email: string): Promise<User[]>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser> & { lastAccessedAt?: Date; password?: string; mustChangePassword?: boolean; profileImageUrl?: string | null; resetToken?: string | null; resetTokenExpiry?: Date | null }): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  
  getTeam(id: string): Promise<Team | undefined>;
  getTeamByCode(code: string): Promise<Team | undefined>;
  getTeamsByCoach(coachId: string): Promise<Team[]>;
  getAllTeams(): Promise<Team[]>;
  getAllUsers(): Promise<User[]>;
  createTeam(team: InsertTeam, coachId: string): Promise<Team>;
  updateTeam(id: string, data: Partial<{ name: string; sport: string; season: string; badgeId: string | null; teamColor: string | null }>): Promise<Team | undefined>;
  deleteTeam(id: string): Promise<void>;
  
  getTeamMembers(teamId: string): Promise<(TeamMember & { user: Omit<User, 'password'> })[]>;
  getTeamMembership(teamId: string, userId: string): Promise<TeamMember | undefined>;
  getUserTeams(userId: string): Promise<Team[]>;
  getUserTeamMemberships(userId: string): Promise<TeamMember[]>;
  addTeamMember(data: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(teamId: string, userId: string, data: UpdateTeamMember): Promise<TeamMember | undefined>;
  removeTeamMember(teamId: string, userId: string): Promise<void>;
  
  getTeamEvents(teamId: string): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(data: InsertEvent): Promise<Event>;
  updateEvent(id: string, data: UpdateEvent): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<void>;
  
  getTeamHighlightVideos(teamId: string): Promise<(HighlightVideo & { uploader: User })[]>;
  getHighlightVideo(id: string): Promise<HighlightVideo | undefined>;
  createHighlightVideo(data: InsertHighlightVideo): Promise<HighlightVideo>;
  updateHighlightVideo(id: string, data: UpdateHighlightVideo): Promise<HighlightVideo | undefined>;
  deleteHighlightVideo(id: string): Promise<void>;
  
  getTeamPlays(teamId: string): Promise<(Play & { createdBy: User })[]>;
  getPlay(id: string): Promise<Play | undefined>;
  createPlay(data: InsertPlay): Promise<Play>;
  updatePlay(id: string, data: UpdatePlay): Promise<Play | undefined>;
  deletePlay(id: string): Promise<void>;
  
  getManagedAthletes(supporterId: string): Promise<(ManagedAthlete & { athlete?: User; team?: Team })[]>;
  getManagedAthleteById(id: string): Promise<ManagedAthlete | undefined>;
  createManagedAthlete(data: InsertManagedAthlete): Promise<ManagedAthlete>;
  updateManagedAthlete(id: string, data: Partial<InsertManagedAthlete>): Promise<ManagedAthlete | undefined>;
  deleteManagedAthlete(id: string): Promise<void>;
  supporterManagesAthlete(supporterId: string, athleteId: string): Promise<boolean>;
  
  // Supporter Events methods
  getSupporterEvents(managedAthleteId: string): Promise<SupporterEvent[]>;
  getSupporterEventById(id: string): Promise<SupporterEvent | undefined>;
  createSupporterEvent(data: InsertSupporterEvent): Promise<SupporterEvent>;
  updateSupporterEvent(id: string, data: UpdateSupporterEvent): Promise<SupporterEvent | undefined>;
  deleteSupporterEvent(id: string): Promise<void>;
  
  // Supporter StatTracker methods
  getSupporterStatSessions(managedAthleteId: string): Promise<SupporterStatSession[]>;
  getSupporterStatSession(id: string): Promise<SupporterStatSession | undefined>;
  createSupporterStatSession(data: InsertSupporterStatSession): Promise<SupporterStatSession>;
  updateSupporterStatSession(id: string, data: UpdateSupporterStatSession): Promise<SupporterStatSession | undefined>;
  deleteSupporterStatSession(id: string): Promise<void>;
  getSupporterStatEntries(sessionId: string): Promise<SupporterStatEntry[]>;
  getSupporterStatEntry(id: string): Promise<SupporterStatEntry | undefined>;
  createSupporterStatEntry(data: InsertSupporterStatEntry): Promise<SupporterStatEntry>;
  deleteSupporterStatEntry(id: string): Promise<void>;
  getSupporterStatsSummary(managedAthleteId: string): Promise<{ 
    totalSessions: number; 
    totalStats: number; 
    recentSessions: SupporterStatSession[]; 
    statTotals: { statName: string; total: number }[] 
  }>;
  
  // StatTracker methods
  getGame(id: string): Promise<Game | undefined>;
  getGameByEvent(eventId: string): Promise<Game | undefined>;
  getTeamGames(teamId: string): Promise<(Game & { event?: Event })[]>;
  getTeamAggregateStats(teamId: string): Promise<{ games: number; wins: number; losses: number; statTotals: Record<string, { name: string; total: number }> }>;
  createGame(data: InsertGame): Promise<Game>;
  updateGame(id: string, data: UpdateGame): Promise<Game | undefined>;
  deleteGame(id: string): Promise<void>;
  
  getTeamStatConfigs(teamId: string): Promise<StatConfig[]>;
  getStatConfig(id: string): Promise<StatConfig | undefined>;
  createStatConfig(data: InsertStatConfig): Promise<StatConfig>;
  updateStatConfig(id: string, data: UpdateStatConfig): Promise<StatConfig | undefined>;
  deleteStatConfig(id: string): Promise<void>;
  
  getGameStats(gameId: string): Promise<(GameStat & { statConfig: StatConfig; athlete?: User })[]>;
  createGameStat(data: InsertGameStat): Promise<GameStat>;
  deleteGameStat(id: string): Promise<void>;
  softDeleteGameStat(id: string): Promise<void>;
  
  getGameRoster(gameId: string): Promise<(GameRoster & { athlete: User })[]>;
  createGameRoster(data: InsertGameRoster): Promise<GameRoster>;
  updateGameRoster(id: string, data: UpdateGameRoster): Promise<GameRoster | undefined>;
  deleteGameRoster(id: string): Promise<void>;
  
  // Starting Lineup methods
  getStartingLineupByEvent(eventId: string): Promise<(StartingLineup & { players: (StartingLineupPlayer & { teamMember: TeamMember & { user: User } })[] }) | undefined>;
  createStartingLineup(data: InsertStartingLineup): Promise<StartingLineup>;
  updateStartingLineup(id: string, data: Partial<InsertStartingLineup>): Promise<StartingLineup | undefined>;
  deleteStartingLineup(id: string): Promise<void>;
  setStartingLineupPlayers(lineupId: string, players: InsertStartingLineupPlayer[]): Promise<void>;
  
  // Shoutouts methods
  getGameShoutouts(gameId: string): Promise<(Shoutout & { supporter: User; athlete: User })[]>;
  getAthleteShoutouts(athleteId: string, limit?: number): Promise<(Shoutout & { supporter: User; game?: Game })[]>;
  getAthleteShoutoutCount(athleteId: string): Promise<number>;
  createShoutout(data: InsertShoutout): Promise<Shoutout>;
  
  // Live Taps methods
  createLiveTapEvent(data: InsertLiveTapEvent): Promise<LiveTapEvent>;
  getGameTapCount(gameId: string): Promise<number>;
  getSupporterTapTotal(supporterId: string, teamId: string, season: string): Promise<LiveTapTotal | undefined>;
  upsertLiveTapTotal(supporterId: string, teamId: string, season: string, incrementBy: number): Promise<LiveTapTotal>;
  
  // Badge methods
  getAllBadgeDefinitions(): Promise<BadgeDefinition[]>;
  getBadgeDefinition(id: string): Promise<BadgeDefinition | undefined>;
  createBadgeDefinition(data: InsertBadgeDefinition): Promise<BadgeDefinition>;
  getSupporterBadges(supporterId: string, teamId: string, season: string): Promise<(SupporterBadge & { badge: BadgeDefinition })[]>;
  createSupporterBadge(data: InsertSupporterBadge): Promise<SupporterBadge>;
  
  // Theme methods
  getSupporterThemes(supporterId: string): Promise<ThemeUnlock[]>;
  getActiveTheme(supporterId: string): Promise<ThemeUnlock | undefined>;
  createThemeUnlock(data: InsertThemeUnlock): Promise<ThemeUnlock>;
  setActiveTheme(supporterId: string, themeId: string): Promise<ThemeUnlock | undefined>;
  
  // Live Engagement Session methods
  getLiveSession(id: string): Promise<LiveEngagementSession | undefined>;
  getLiveSessionByEvent(eventId: string): Promise<LiveEngagementSession | undefined>;
  getActiveLiveSessionsForTeam(teamId: string): Promise<(LiveEngagementSession & { event: Event })[]>;
  getUpcomingLiveSessionsForTeam(teamId: string): Promise<(LiveEngagementSession & { event: Event })[]>;
  createLiveSession(data: InsertLiveEngagementSession): Promise<LiveEngagementSession>;
  updateLiveSession(id: string, data: UpdateLiveEngagementSession): Promise<LiveEngagementSession | undefined>;
  startLiveSession(id: string, startedBy?: string): Promise<LiveEngagementSession | undefined>;
  endLiveSession(id: string, endedBy?: string): Promise<LiveEngagementSession | undefined>;
  extendLiveSession(id: string, extendMinutes: number): Promise<LiveEngagementSession | undefined>;
  
  // Session-based shoutouts and taps
  getSessionShoutouts(sessionId: string): Promise<(Shoutout & { supporter: User; athlete: User })[]>;
  getSessionTapCount(sessionId: string): Promise<number>;
  createSessionShoutout(data: { sessionId: string; supporterId: string; athleteId: string; message: string }): Promise<Shoutout>;
  createSessionTapEvent(data: { sessionId: string; supporterId: string; teamId: string; tapCount: number }): Promise<LiveTapEvent>;
  
  // Team engagement stats
  getTeamEngagementStats(teamId: string): Promise<{ totalTaps: number; totalShoutouts: number }>;
  getTopTappers(teamId: string, limit?: number): Promise<{ supporterId: string; totalTaps: number; supporter: Omit<User, 'password'> }[]>;
  
  // Profile Likes and Comments (public interactions)
  getProfileLikes(athleteId: string): Promise<ProfileLike[]>;
  getProfileLikeCount(athleteId: string): Promise<number>;
  createProfileLike(data: InsertProfileLike): Promise<ProfileLike>;
  getProfileComments(athleteId: string): Promise<ProfileComment[]>;
  createProfileComment(data: InsertProfileComment): Promise<ProfileComment>;
  
  // Chat methods
  getTeamChatMessages(teamId: string, channel: string, limit?: number): Promise<(ChatMessage & { user: Omit<User, 'password'> })[]>;
  createChatMessage(data: InsertChatMessage): Promise<ChatMessage>;
  
  // Athlete Follower methods
  getAthleteFollowers(athleteId: string): Promise<AthleteFollower[]>;
  getAthleteFollowerCount(athleteId: string): Promise<number>;
  createAthleteFollower(data: InsertAthleteFollower): Promise<AthleteFollower>;
  deleteAthleteFollowerByEmail(athleteId: string, email: string): Promise<void>;
  getAthleteFollowerByEmail(athleteId: string, email: string): Promise<AthleteFollower | undefined>;
  
  // HYPE Post methods
  getAthleteHypePosts(athleteId: string): Promise<(HypePost & { highlight?: HighlightVideo })[]>;
  getHypePost(id: string): Promise<(HypePost & { athlete: User; highlight?: HighlightVideo }) | undefined>;
  createHypePost(data: InsertHypePost): Promise<HypePost>;
  deleteHypePost(id: string): Promise<void>;
  
  // Super Admin methods
  searchUsers(query: string): Promise<Omit<User, 'password'>[]>;
  getUserWithTeams(userId: string): Promise<{ user: Omit<User, 'password'>; teams: (TeamMember & { team: Team })[] } | undefined>;
  adminUpdateTeamMember(memberId: string, data: UpdateTeamMember): Promise<TeamMember | undefined>;
  adminRemoveTeamMember(memberId: string): Promise<void>;
  adminAddTeamMember(data: InsertTeamMember): Promise<TeamMember>;
  
  // Impersonation session methods
  createImpersonationSession(data: InsertImpersonationSession): Promise<ImpersonationSession>;
  getActiveImpersonationSession(adminId: string): Promise<ImpersonationSession | undefined>;
  endImpersonationSession(sessionId: string): Promise<ImpersonationSession | undefined>;
  
  // Hypes methods (unified engagement system)
  sendHype(data: InsertHype): Promise<Hype>;
  getEventHypes(eventId: string): Promise<Hype[]>;
  getAthleteEventHypeCount(athleteId: string, eventId: string): Promise<number>;
  getAthleteSeasonHypeTotal(athleteId: string, teamId: string): Promise<number>;
  getEventHypesByAthlete(eventId: string): Promise<{ athleteId: string; athleteName: string; avatar: string | null; hypeCount: number }[]>;
  
  // Direct Message methods
  getConversation(teamId: string, userId1: string, userId2: string, limit?: number): Promise<(DirectMessage & { sender: Omit<User, 'password'>; recipient: Omit<User, 'password'> })[]>;
  getUserConversations(userId: string, teamId: string): Promise<{ otherUser: Omit<User, 'password'>; lastMessage: DirectMessage; unreadCount: number }[]>;
  createDirectMessage(data: InsertDirectMessage): Promise<DirectMessage>;
  getUserUnreadMessageCount(userId: string): Promise<number>;
  markConversationRead(userId: string, conversationKey: string): Promise<void>;
  
  // Chat Presence methods
  updateChatPresence(userId: string, teamId: string, conversationWithUserId: string): Promise<void>;
  removeChatPresence(userId: string, teamId: string): Promise<void>;
  isUserActiveInConversation(userId: string, conversationWithUserId: string, withinSeconds?: number): Promise<boolean>;
  
  // Notification Preferences methods
  getNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined>;
  upsertNotificationPreferences(userId: string, data: UpdateNotificationPreferences): Promise<NotificationPreferences>;
  
  // Athlete Code methods
  findAthleteByCode(code: string): Promise<User | undefined>;
  generateAndSetAthleteCode(userId: string): Promise<string>;
  getTeamsByUserId(userId: string): Promise<Team[]>;
  
  // Supporter Athlete Links methods (cross-team following)
  getSupporterAthleteLinks(supporterId: string): Promise<{ id: string; athleteId: string; teamId: string | null; nickname: string | null; athlete: User; team?: Team }[]>;
  getSupporterAthleteLink(supporterId: string, athleteId: string): Promise<{ id: string; athleteId: string; teamId: string | null; nickname: string | null } | undefined>;
  createSupporterAthleteLink(data: { supporterId: string; athleteId: string; teamId: string | null; nickname: string | null }): Promise<{ id: string; supporterId: string; athleteId: string; teamId: string | null; nickname: string | null }>;
  updateSupporterAthleteLink(id: string, data: { nickname?: string; isActive?: boolean }): Promise<void>;
  deleteSupporterAthleteLink(id: string): Promise<void>;
  countCrossTeamFollows(supporterId: string): Promise<number>;
  
  // Supporter Stats methods (fallback stat tracking)
  getSupporterStats(supporterId: string, athleteId: string, eventId?: string): Promise<SupporterStat[]>;
  getSupporterStatById(id: string): Promise<SupporterStat | undefined>;
  getSupporterStatsByEvent(eventId: string): Promise<(SupporterStat & { supporter: User; athlete: User })[]>;
  createSupporterStat(data: InsertSupporterStat): Promise<SupporterStat>;
  deleteSupporterStat(id: string): Promise<void>;
  getAthleteSupporterStatsAggregate(athleteId: string, teamId: string): Promise<{ statName: string; total: number }[]>;
  
  // Optimized supporter notification queries
  getPaidSupportersFollowingTeam(teamId: string): Promise<{ supporterId: string; email: string; name: string; athleteNames: string[]; emailEnabled: boolean; pushEnabled: boolean }[]>;
  
  // Admin Messages methods
  createAdminMessage(data: InsertAdminMessage): Promise<AdminMessage>;
  createAdminMessageReceipt(data: InsertAdminMessageReceipt): Promise<AdminMessageReceipt>;
  createBroadcastReceipts(messageId: string, userIds: string[]): Promise<void>;
  getAdminBroadcasts(): Promise<(AdminMessage & { sender: User; recipientCount: number })[]>;
  getUserAdminMessages(userId: string): Promise<(AdminMessage & { sender: User; isRead: boolean })[]>;
  getAdminSupportConversations(): Promise<{ recipientId: string; recipient: User; lastMessage: AdminMessage; unreadCount: number }[]>;
  getAdminConversation(recipientId: string): Promise<(AdminMessage & { sender: User })[]>;
  markAdminMessageRead(userId: string, messageId: string): Promise<void>;
  getAllUsersForBroadcast(): Promise<{ id: string; email: string; firstName: string; lastName: string }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUsersByEmail(email: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.email, email));
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetToken, token));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser> & { lastAccessedAt?: Date; password?: string; mustChangePassword?: boolean; profileImageUrl?: string | null; resetToken?: string | null; resetTokenExpiry?: Date | null }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(teamMembers).where(eq(teamMembers.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async getTeamByCode(code: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.code, code.toUpperCase()));
    return team || undefined;
  }

  async getTeamsByCoach(coachId: string): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.coachId, coachId));
  }

  async getAllTeams(): Promise<Team[]> {
    return await db.select().from(teams);
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createTeam(insertTeam: InsertTeam, coachId: string): Promise<Team> {
    let code = generateTeamCode();
    let existingTeam = await this.getTeamByCode(code);
    while (existingTeam) {
      code = generateTeamCode();
      existingTeam = await this.getTeamByCode(code);
    }

    const [team] = await db
      .insert(teams)
      .values({ ...insertTeam, code, coachId })
      .returning();
    
    await this.addTeamMember({ teamId: team.id, userId: coachId, role: "coach" });
    
    return team;
  }

  async updateTeam(id: string, data: Partial<{ name: string; sport: string; season: string; badgeId: string | null; teamColor: string | null }>): Promise<Team | undefined> {
    const [team] = await db
      .update(teams)
      .set(data)
      .where(eq(teams.id, id))
      .returning();
    return team || undefined;
  }

  async deleteTeam(id: string): Promise<void> {
    // Get all live engagement sessions for this team first
    const teamSessions = await db.select().from(liveEngagementSessions).where(eq(liveEngagementSessions.teamId, id));
    const sessionIds = teamSessions.map(s => s.id);
    
    // Delete shoutouts and tap events for team sessions
    if (sessionIds.length > 0) {
      for (const sessionId of sessionIds) {
        await db.delete(shoutouts).where(eq(shoutouts.sessionId, sessionId));
        await db.delete(liveTapEvents).where(eq(liveTapEvents.sessionId, sessionId));
      }
    }
    
    // Delete tap totals for team
    await db.delete(liveTapTotals).where(eq(liveTapTotals.teamId, id));
    
    // Delete live engagement sessions
    await db.delete(liveEngagementSessions).where(eq(liveEngagementSessions.teamId, id));
    
    // Get all games for this team to delete related data
    const teamGames = await db.select().from(games).where(eq(games.teamId, id));
    const gameIds = teamGames.map(g => g.id);
    
    // Delete game stats and rosters
    if (gameIds.length > 0) {
      for (const gameId of gameIds) {
        await db.delete(gameStats).where(eq(gameStats.gameId, gameId));
        await db.delete(gameRosters).where(eq(gameRosters.gameId, gameId));
      }
    }
    
    // Get starting lineups to delete their players
    const teamLineups = await db.select().from(startingLineups).where(eq(startingLineups.teamId, id));
    const lineupIds = teamLineups.map(l => l.id);
    
    if (lineupIds.length > 0) {
      for (const lineupId of lineupIds) {
        await db.delete(startingLineupPlayers).where(eq(startingLineupPlayers.lineupId, lineupId));
      }
    }
    
    // Delete all team-related tables
    await db.delete(chatMessages).where(eq(chatMessages.teamId, id));
    await db.delete(startingLineups).where(eq(startingLineups.teamId, id));
    await db.delete(games).where(eq(games.teamId, id));
    await db.delete(statConfigurations).where(eq(statConfigurations.teamId, id));
    await db.delete(plays).where(eq(plays.teamId, id));
    await db.delete(highlightVideos).where(eq(highlightVideos.teamId, id));
    await db.delete(events).where(eq(events.teamId, id));
    await db.delete(teamMembers).where(eq(teamMembers.teamId, id));
    
    // Finally delete the team itself
    await db.delete(teams).where(eq(teams.id, id));
  }

  async getTeamMembers(teamId: string): Promise<(TeamMember & { user: Omit<User, 'password'> })[]> {
    const members = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));
    
    const result: (TeamMember & { user: Omit<User, 'password'> })[] = [];
    for (const member of members) {
      const user = await this.getUser(member.userId);
      if (user) {
        const { password, ...safeUser } = user;
        result.push({ ...member, user: safeUser });
      }
    }
    return result;
  }

  async getTeamMembership(teamId: string, userId: string): Promise<TeamMember | undefined> {
    const [member] = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
    return member || undefined;
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    const memberships = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));
    
    const userTeams: Team[] = [];
    for (const membership of memberships) {
      const team = await this.getTeam(membership.teamId);
      if (team) {
        userTeams.push(team);
      }
    }
    return userTeams;
  }

  async getUserTeamMemberships(userId: string): Promise<TeamMember[]> {
    return await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));
  }

  async addTeamMember(data: InsertTeamMember): Promise<TeamMember> {
    const existing = await this.getTeamMembership(data.teamId, data.userId);
    if (existing) {
      return existing;
    }
    
    const [member] = await db
      .insert(teamMembers)
      .values(data)
      .returning();
    return member;
  }

  async updateTeamMember(teamId: string, userId: string, data: UpdateTeamMember): Promise<TeamMember | undefined> {
    const [member] = await db
      .update(teamMembers)
      .set(data)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
      .returning();
    return member || undefined;
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  }

  async getTeamEvents(teamId: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.teamId, teamId))
      .orderBy(desc(events.date));
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(data: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(data).returning();
    return event;
  }

  async updateEvent(id: string, data: UpdateEvent): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set(data)
      .where(eq(events.id, id))
      .returning();
    return event || undefined;
  }

  async deleteEvent(id: string): Promise<void> {
    // Delete related records first to avoid foreign key constraint violations
    // First, get all starting lineups for this event
    const eventLineups = await db.select({ id: startingLineups.id }).from(startingLineups).where(eq(startingLineups.eventId, id));
    // Delete starting lineup players for each lineup
    for (const lineup of eventLineups) {
      await db.delete(startingLineupPlayers).where(eq(startingLineupPlayers.lineupId, lineup.id));
    }
    // Now delete the starting lineups
    await db.delete(startingLineups).where(eq(startingLineups.eventId, id));
    // Delete live engagement sessions
    await db.delete(liveEngagementSessions).where(eq(liveEngagementSessions.eventId, id));
    // Note: games have eventId as optional, so we set it to null instead of deleting
    await db.update(games).set({ eventId: null }).where(eq(games.eventId, id));
    // Now delete the event
    await db.delete(events).where(eq(events.id, id));
  }

  async getTeamHighlightVideos(teamId: string): Promise<(HighlightVideo & { uploader: User })[]> {
    const videos = await db
      .select()
      .from(highlightVideos)
      .where(eq(highlightVideos.teamId, teamId))
      .orderBy(desc(highlightVideos.createdAt));
    
    const result: (HighlightVideo & { uploader: User })[] = [];
    for (const video of videos) {
      const uploader = await this.getUser(video.uploaderId);
      if (uploader) {
        result.push({ ...video, uploader });
      }
    }
    return result;
  }

  async getHighlightVideo(id: string): Promise<HighlightVideo | undefined> {
    const [video] = await db.select().from(highlightVideos).where(eq(highlightVideos.id, id));
    return video || undefined;
  }

  async createHighlightVideo(data: InsertHighlightVideo): Promise<HighlightVideo> {
    const [video] = await db.insert(highlightVideos).values(data).returning();
    return video;
  }

  async updateHighlightVideo(id: string, data: UpdateHighlightVideo): Promise<HighlightVideo | undefined> {
    const [video] = await db
      .update(highlightVideos)
      .set(data)
      .where(eq(highlightVideos.id, id))
      .returning();
    return video || undefined;
  }

  async deleteHighlightVideo(id: string): Promise<void> {
    await db.delete(highlightVideos).where(eq(highlightVideos.id, id));
  }

  async getTeamPlays(teamId: string): Promise<(Play & { createdBy: User })[]> {
    const teamPlays = await db
      .select()
      .from(plays)
      .where(eq(plays.teamId, teamId))
      .orderBy(desc(plays.createdAt));
    
    const result: (Play & { createdBy: User })[] = [];
    for (const play of teamPlays) {
      const creator = await this.getUser(play.createdById);
      if (creator) {
        result.push({ ...play, createdBy: creator });
      }
    }
    return result;
  }

  async getPlay(id: string): Promise<Play | undefined> {
    const [play] = await db.select().from(plays).where(eq(plays.id, id));
    return play || undefined;
  }

  async createPlay(data: InsertPlay): Promise<Play> {
    const [play] = await db.insert(plays).values(data).returning();
    return play;
  }

  async updatePlay(id: string, data: UpdatePlay): Promise<Play | undefined> {
    const [play] = await db
      .update(plays)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(plays.id, id))
      .returning();
    return play || undefined;
  }

  async deletePlay(id: string): Promise<void> {
    await db.delete(plays).where(eq(plays.id, id));
  }

  async getManagedAthletes(supporterId: string): Promise<(ManagedAthlete & { athlete?: User; team?: Team })[]> {
    const managed = await db
      .select()
      .from(managedAthletes)
      .where(eq(managedAthletes.supporterId, supporterId));
    
    const result: (ManagedAthlete & { athlete?: User; team?: Team })[] = [];
    for (const m of managed) {
      if (m.athleteId) {
        const athlete = await this.getUser(m.athleteId);
        if (athlete) {
          const membership = await db
            .select()
            .from(teamMembers)
            .where(eq(teamMembers.userId, m.athleteId))
            .limit(1);
          
          let team: Team | undefined;
          if (membership.length > 0) {
            const [t] = await db.select().from(teams).where(eq(teams.id, membership[0].teamId));
            team = t;
          }
          
          result.push({ ...m, athlete, team });
        }
      } else {
        result.push({ ...m });
      }
    }
    return result;
  }

  async createManagedAthlete(data: InsertManagedAthlete): Promise<ManagedAthlete> {
    // Generate a unique 8-character share code
    const generateCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };
    
    let shareCode = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.select().from(managedAthletes).where(eq(managedAthletes.shareCode, shareCode)).limit(1);
      if (existing.length === 0) break;
      shareCode = generateCode();
      attempts++;
    }
    
    const [managed] = await db.insert(managedAthletes).values({ ...data, shareCode }).returning();
    return managed;
  }

  async deleteManagedAthlete(id: string): Promise<void> {
    await db.delete(managedAthletes).where(eq(managedAthletes.id, id));
  }

  async supporterManagesAthlete(supporterId: string, athleteId: string): Promise<boolean> {
    const [managed] = await db
      .select()
      .from(managedAthletes)
      .where(and(
        eq(managedAthletes.supporterId, supporterId),
        eq(managedAthletes.athleteId, athleteId)
      ));
    return !!managed;
  }

  async getManagedAthleteById(id: string): Promise<ManagedAthlete | undefined> {
    const [managed] = await db.select().from(managedAthletes).where(eq(managedAthletes.id, id));
    return managed || undefined;
  }

  async updateManagedAthlete(id: string, data: Partial<InsertManagedAthlete>): Promise<ManagedAthlete | undefined> {
    const [updated] = await db.update(managedAthletes).set(data).where(eq(managedAthletes.id, id)).returning();
    return updated || undefined;
  }

  // Supporter Events implementations
  async getSupporterEvents(managedAthleteId: string): Promise<SupporterEvent[]> {
    return await db.select().from(supporterEvents).where(eq(supporterEvents.managedAthleteId, managedAthleteId)).orderBy(desc(supporterEvents.startTime));
  }

  async getSupporterEventById(id: string): Promise<SupporterEvent | undefined> {
    const [event] = await db.select().from(supporterEvents).where(eq(supporterEvents.id, id));
    return event || undefined;
  }

  async createSupporterEvent(data: InsertSupporterEvent): Promise<SupporterEvent> {
    const [event] = await db.insert(supporterEvents).values(data).returning();
    return event;
  }

  async updateSupporterEvent(id: string, data: UpdateSupporterEvent): Promise<SupporterEvent | undefined> {
    const [updated] = await db.update(supporterEvents).set(data).where(eq(supporterEvents.id, id)).returning();
    return updated || undefined;
  }

  async deleteSupporterEvent(id: string): Promise<void> {
    await db.delete(supporterEvents).where(eq(supporterEvents.id, id));
  }

  // Supporter StatTracker implementations
  async getSupporterStatSessions(managedAthleteId: string): Promise<SupporterStatSession[]> {
    return await db.select().from(supporterStatSessions)
      .where(eq(supporterStatSessions.managedAthleteId, managedAthleteId))
      .orderBy(desc(supporterStatSessions.createdAt));
  }

  async getSupporterStatSession(id: string): Promise<SupporterStatSession | undefined> {
    const [session] = await db.select().from(supporterStatSessions)
      .where(eq(supporterStatSessions.id, id));
    return session || undefined;
  }

  async createSupporterStatSession(data: InsertSupporterStatSession): Promise<SupporterStatSession> {
    const [session] = await db.insert(supporterStatSessions).values(data).returning();
    return session;
  }

  async updateSupporterStatSession(id: string, data: UpdateSupporterStatSession): Promise<SupporterStatSession | undefined> {
    const [updated] = await db.update(supporterStatSessions).set(data)
      .where(eq(supporterStatSessions.id, id)).returning();
    return updated || undefined;
  }

  async deleteSupporterStatSession(id: string): Promise<void> {
    await db.delete(supporterStatEntries).where(eq(supporterStatEntries.sessionId, id));
    await db.delete(supporterStatSessions).where(eq(supporterStatSessions.id, id));
  }

  async getSupporterStatEntries(sessionId: string): Promise<SupporterStatEntry[]> {
    return await db.select().from(supporterStatEntries)
      .where(eq(supporterStatEntries.sessionId, sessionId))
      .orderBy(desc(supporterStatEntries.recordedAt));
  }

  async createSupporterStatEntry(data: InsertSupporterStatEntry): Promise<SupporterStatEntry> {
    const [entry] = await db.insert(supporterStatEntries).values(data).returning();
    return entry;
  }

  async getSupporterStatEntry(id: string): Promise<SupporterStatEntry | undefined> {
    const [entry] = await db.select().from(supporterStatEntries)
      .where(eq(supporterStatEntries.id, id));
    return entry || undefined;
  }

  async deleteSupporterStatEntry(id: string): Promise<void> {
    await db.delete(supporterStatEntries).where(eq(supporterStatEntries.id, id));
  }

  async getSupporterStatsSummary(managedAthleteId: string): Promise<{ 
    totalSessions: number; 
    totalStats: number; 
    recentSessions: SupporterStatSession[]; 
    statTotals: { statName: string; total: number }[] 
  }> {
    const sessions = await db.select().from(supporterStatSessions)
      .where(eq(supporterStatSessions.managedAthleteId, managedAthleteId))
      .orderBy(desc(supporterStatSessions.createdAt));
    
    const recentSessions = sessions.slice(0, 5);
    
    const statTotalsMap: Record<string, number> = {};
    let totalStats = 0;
    
    for (const session of sessions) {
      const entries = await db.select().from(supporterStatEntries)
        .where(eq(supporterStatEntries.sessionId, session.id));
      
      totalStats += entries.length;
      
      for (const entry of entries) {
        statTotalsMap[entry.statName] = (statTotalsMap[entry.statName] || 0) + entry.value;
      }
    }
    
    const statTotals = Object.entries(statTotalsMap)
      .map(([statName, total]) => ({ statName, total }))
      .sort((a, b) => b.total - a.total);
    
    return {
      totalSessions: sessions.length,
      totalStats,
      recentSessions,
      statTotals
    };
  }

  // StatTracker implementations
  async getGame(id: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game || undefined;
  }

  async getGameByEvent(eventId: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.eventId, eventId));
    return game || undefined;
  }

  async getTeamGames(teamId: string): Promise<(Game & { event?: Event })[]> {
    const teamGames = await db
      .select()
      .from(games)
      .where(eq(games.teamId, teamId))
      .orderBy(desc(games.createdAt));
    
    const result: (Game & { event?: Event })[] = [];
    for (const game of teamGames) {
      let event: Event | undefined;
      if (game.eventId) {
        event = await this.getEvent(game.eventId);
      }
      result.push({ ...game, event });
    }
    return result;
  }

  async getTeamAggregateStats(teamId: string): Promise<{ games: number; wins: number; losses: number; statTotals: Record<string, { name: string; total: number }> }> {
    const completedGames = await db
      .select()
      .from(games)
      .where(and(eq(games.teamId, teamId), eq(games.status, "completed")));
    
    let wins = 0;
    let losses = 0;
    for (const game of completedGames) {
      if (game.teamScore > game.opponentScore) wins++;
      else if (game.teamScore < game.opponentScore) losses++;
    }

    const statTotals: Record<string, { name: string; total: number }> = {};
    
    for (const game of completedGames) {
      const stats = await db
        .select()
        .from(gameStats)
        .innerJoin(statConfigurations, eq(gameStats.statConfigId, statConfigurations.id))
        .where(and(eq(gameStats.gameId, game.id), eq(gameStats.isDeleted, false)));
      
      for (const { game_stats, stat_configurations } of stats) {
        const key = stat_configurations.shortName;
        if (!statTotals[key]) {
          statTotals[key] = { name: stat_configurations.name, total: 0 };
        }
        statTotals[key].total += game_stats.value;
      }
    }

    return {
      games: completedGames.length,
      wins,
      losses,
      statTotals
    };
  }

  async getAdvancedTeamStats(teamId: string): Promise<{
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
  }> {
    const completedGames = await db
      .select()
      .from(games)
      .where(and(eq(games.teamId, teamId), eq(games.status, "completed")))
      .orderBy(desc(games.createdAt));

    const gameHistory: Array<{
      id: string;
      date: string;
      opponent: string;
      teamScore: number;
      opponentScore: number;
      result: 'W' | 'L' | 'T';
      stats: Record<string, number>;
    }> = [];

    const athleteStatsMap: Map<string, {
      athleteId: string;
      athleteName: string;
      gamesPlayed: Set<string>;
      stats: Record<string, number>;
      recentGames: Array<{ gameId: string; date: string; stats: Record<string, number> }>;
    }> = new Map();

    let totalMade = 0;
    let totalAttempts = 0;

    for (const game of completedGames) {
      const event = game.eventId ? await this.getEvent(game.eventId) : undefined;
      const statsResult = await db
        .select()
        .from(gameStats)
        .innerJoin(statConfigurations, eq(gameStats.statConfigId, statConfigurations.id))
        .where(and(eq(gameStats.gameId, game.id), eq(gameStats.isDeleted, false)));

      const statsForGame: Record<string, number> = {};
      for (const { game_stats, stat_configurations } of statsResult) {
        const key = stat_configurations.shortName;
        statsForGame[key] = (statsForGame[key] || 0) + game_stats.value;

        if (key.toLowerCase().includes('fg') || key.toLowerCase().includes('made')) {
          totalMade += game_stats.value;
        }
        if (key.toLowerCase().includes('fga') || key.toLowerCase().includes('att')) {
          totalAttempts += game_stats.value;
        }

        if (game_stats.athleteId) {
          let athleteData = athleteStatsMap.get(game_stats.athleteId);
          if (!athleteData) {
            const user = await this.getUser(game_stats.athleteId);
            const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
            athleteData = {
              athleteId: game_stats.athleteId,
              athleteName: fullName || user?.username || user?.name || 'Unknown',
              gamesPlayed: new Set(),
              stats: {},
              recentGames: []
            };
            athleteStatsMap.set(game_stats.athleteId, athleteData);
          }
          athleteData!.gamesPlayed.add(game.id);
          athleteData!.stats[key] = (athleteData!.stats[key] || 0) + game_stats.value;

          let gameEntry = athleteData!.recentGames.find(g => g.gameId === game.id);
          if (!gameEntry) {
            gameEntry = { gameId: game.id, date: game.createdAt?.toISOString() || '', stats: {} };
            athleteData!.recentGames.push(gameEntry);
          }
          gameEntry.stats[key] = (gameEntry.stats[key] || 0) + game_stats.value;
        }
      }

      let result: 'W' | 'L' | 'T' = 'T';
      if (game.teamScore > game.opponentScore) result = 'W';
      else if (game.teamScore < game.opponentScore) result = 'L';

      gameHistory.push({
        id: game.id,
        date: event?.date || game.createdAt?.toISOString() || '',
        opponent: game.opponentName || 'Opponent',
        teamScore: game.teamScore,
        opponentScore: game.opponentScore,
        result,
        stats: statsForGame
      });
    }

    const athletePerformance = Array.from(athleteStatsMap.values()).map(athlete => {
      athlete.recentGames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const last5 = athlete.recentGames.slice(0, 5);

      let hotStreak = false;
      let streakLength = 0;
      if (last5.length >= 3) {
        const totalStats = Object.values(athlete.stats).reduce((a, b) => a + b, 0);
        const avgPerGame = totalStats / athlete.gamesPlayed.size;
        
        for (const game of last5) {
          const gameTotal = Object.values(game.stats).reduce((a, b) => a + b, 0);
          if (gameTotal >= avgPerGame * 1.2) {
            streakLength++;
          } else {
            break;
          }
        }
        hotStreak = streakLength >= 3;
      }

      return {
        athleteId: athlete.athleteId,
        athleteName: athlete.athleteName,
        gamesPlayed: athlete.gamesPlayed.size,
        stats: athlete.stats,
        recentGames: last5.map(g => ({ gameId: g.gameId, stats: g.stats })),
        hotStreak,
        streakLength
      };
    }).sort((a, b) => {
      const aTotalStats = Object.values(a.stats).reduce((sum, v) => sum + v, 0);
      const bTotalStats = Object.values(b.stats).reduce((sum, v) => sum + v, 0);
      return bTotalStats - aTotalStats;
    });

    const ratios: Record<string, { name: string; value: number; description: string }> = {};
    if (totalAttempts > 0) {
      ratios['fg_pct'] = {
        name: 'Field Goal %',
        value: Math.round((totalMade / totalAttempts) * 1000) / 10,
        description: 'Made shots / Attempts'
      };
    }
    
    const wins = gameHistory.filter(g => g.result === 'W').length;
    const totalGames = gameHistory.length;
    if (totalGames > 0) {
      ratios['win_pct'] = {
        name: 'Win Rate',
        value: Math.round((wins / totalGames) * 1000) / 10,
        description: 'Games won / Total games'
      };
    }

    const totalPoints = gameHistory.reduce((sum, g) => sum + g.teamScore, 0);
    const totalOpponentPoints = gameHistory.reduce((sum, g) => sum + g.opponentScore, 0);
    if (totalGames > 0) {
      ratios['ppg'] = {
        name: 'Points Per Game',
        value: Math.round((totalPoints / totalGames) * 10) / 10,
        description: 'Average points scored per game'
      };
      ratios['opp_ppg'] = {
        name: 'Opp PPG',
        value: Math.round((totalOpponentPoints / totalGames) * 10) / 10,
        description: 'Average points allowed per game'
      };
      ratios['point_diff'] = {
        name: 'Point Differential',
        value: Math.round(((totalPoints - totalOpponentPoints) / totalGames) * 10) / 10,
        description: 'Average margin per game'
      };
    }

    return { gameHistory, athletePerformance, ratios };
  }

  async getAthleteStats(teamId: string, athleteId: string): Promise<{
    gamesPlayed: number;
    stats: Record<string, { name: string; total: number; perGame: number }>;
    gameHistory: Array<{ gameId: string; date: string; opponent: string; result: 'W' | 'L' | 'T'; stats: Record<string, number> }>;
    hotStreak: boolean;
    streakLength: number;
  }> {
    const completedGames = await db
      .select()
      .from(games)
      .where(and(eq(games.teamId, teamId), eq(games.status, "completed")))
      .orderBy(desc(games.createdAt));

    const gameHistory: Array<{ gameId: string; date: string; opponent: string; result: 'W' | 'L' | 'T'; stats: Record<string, number> }> = [];
    const statTotals: Record<string, { name: string; total: number }> = {};
    const gamesWithStats = new Set<string>();

    for (const game of completedGames) {
      const event = game.eventId ? await this.getEvent(game.eventId) : undefined;
      const statsResult = await db
        .select({ game_stats: gameStats, stat_configurations: statConfigurations })
        .from(gameStats)
        .innerJoin(statConfigurations, eq(gameStats.statConfigId, statConfigurations.id))
        .where(and(
          eq(gameStats.gameId, game.id),
          eq(gameStats.athleteId, athleteId),
          eq(gameStats.isDeleted, false)
        ));

      if (statsResult.length === 0) continue;

      gamesWithStats.add(game.id);
      const gameStatsMap: Record<string, number> = {};
      
      for (const { game_stats, stat_configurations } of statsResult) {
        const key = stat_configurations.shortName;
        gameStatsMap[key] = (gameStatsMap[key] || 0) + game_stats.value;
        
        if (!statTotals[key]) {
          statTotals[key] = { name: stat_configurations.name, total: 0 };
        }
        statTotals[key].total += game_stats.value;
      }

      let result: 'W' | 'L' | 'T' = 'T';
      if (game.teamScore > game.opponentScore) result = 'W';
      else if (game.teamScore < game.opponentScore) result = 'L';

      gameHistory.push({
        gameId: game.id,
        date: event?.date || game.createdAt?.toISOString() || '',
        opponent: game.opponentName || 'Opponent',
        result,
        stats: gameStatsMap
      });
    }

    const gamesPlayed = gamesWithStats.size;
    const stats: Record<string, { name: string; total: number; perGame: number }> = {};
    for (const [key, { name, total }] of Object.entries(statTotals)) {
      stats[key] = { name, total, perGame: gamesPlayed > 0 ? Math.round((total / gamesPlayed) * 10) / 10 : 0 };
    }

    let hotStreak = false;
    let streakLength = 0;
    if (gameHistory.length >= 3) {
      const totalStats = Object.values(statTotals).reduce((a, b) => a + b.total, 0);
      const avgPerGame = totalStats / gamesPlayed;
      
      for (const game of gameHistory.slice(0, 5)) {
        const gameTotal = Object.values(game.stats).reduce((a, b) => a + b, 0);
        if (gameTotal >= avgPerGame * 1.2) {
          streakLength++;
        } else {
          break;
        }
      }
      hotStreak = streakLength >= 3;
    }

    return { gamesPlayed, stats, gameHistory, hotStreak, streakLength };
  }

  async createGame(data: InsertGame): Promise<Game> {
    const [game] = await db.insert(games).values(data).returning();
    return game;
  }

  async updateGame(id: string, data: UpdateGame): Promise<Game | undefined> {
    const [game] = await db
      .update(games)
      .set(data)
      .where(eq(games.id, id))
      .returning();
    return game || undefined;
  }

  async deleteGame(id: string): Promise<void> {
    await db.delete(gameStats).where(eq(gameStats.gameId, id));
    await db.delete(gameRosters).where(eq(gameRosters.gameId, id));
    await db.delete(games).where(eq(games.id, id));
  }

  async getTeamStatConfigs(teamId: string): Promise<StatConfig[]> {
    return await db
      .select()
      .from(statConfigurations)
      .where(eq(statConfigurations.teamId, teamId))
      .orderBy(statConfigurations.displayOrder);
  }

  async getStatConfig(id: string): Promise<StatConfig | undefined> {
    const [config] = await db.select().from(statConfigurations).where(eq(statConfigurations.id, id));
    return config || undefined;
  }

  async createStatConfig(data: InsertStatConfig): Promise<StatConfig> {
    const [config] = await db.insert(statConfigurations).values(data).returning();
    return config;
  }

  async updateStatConfig(id: string, data: UpdateStatConfig): Promise<StatConfig | undefined> {
    const [config] = await db
      .update(statConfigurations)
      .set(data)
      .where(eq(statConfigurations.id, id))
      .returning();
    return config || undefined;
  }

  async deleteStatConfig(id: string): Promise<void> {
    await db.delete(statConfigurations).where(eq(statConfigurations.id, id));
  }

  async getGameStats(gameId: string): Promise<(GameStat & { statConfig: StatConfig; athlete?: User })[]> {
    const stats = await db
      .select()
      .from(gameStats)
      .where(and(eq(gameStats.gameId, gameId), eq(gameStats.isDeleted, false)))
      .orderBy(desc(gameStats.recordedAt));
    
    const result: (GameStat & { statConfig: StatConfig; athlete?: User })[] = [];
    for (const stat of stats) {
      const statConfig = await this.getStatConfig(stat.statConfigId);
      if (!statConfig) continue;
      
      let athlete: User | undefined;
      if (stat.athleteId) {
        athlete = await this.getUser(stat.athleteId);
      }
      result.push({ ...stat, statConfig, athlete });
    }
    return result;
  }

  async createGameStat(data: InsertGameStat): Promise<GameStat> {
    const [stat] = await db.insert(gameStats).values(data).returning();
    return stat;
  }

  async deleteGameStat(id: string): Promise<void> {
    await db.delete(gameStats).where(eq(gameStats.id, id));
  }

  async softDeleteGameStat(id: string): Promise<void> {
    await db.update(gameStats).set({ isDeleted: true }).where(eq(gameStats.id, id));
  }

  async getGameRoster(gameId: string): Promise<(GameRoster & { athlete: User })[]> {
    const roster = await db
      .select()
      .from(gameRosters)
      .where(eq(gameRosters.gameId, gameId));
    
    const result: (GameRoster & { athlete: User })[] = [];
    for (const r of roster) {
      const athlete = await this.getUser(r.athleteId);
      if (athlete) {
        result.push({ ...r, athlete });
      }
    }
    return result;
  }

  async createGameRoster(data: InsertGameRoster): Promise<GameRoster> {
    const [roster] = await db.insert(gameRosters).values(data).returning();
    return roster;
  }

  async updateGameRoster(id: string, data: UpdateGameRoster): Promise<GameRoster | undefined> {
    const [roster] = await db
      .update(gameRosters)
      .set(data)
      .where(eq(gameRosters.id, id))
      .returning();
    return roster || undefined;
  }

  async deleteGameRoster(id: string): Promise<void> {
    await db.delete(gameRosters).where(eq(gameRosters.id, id));
  }

  // Starting Lineup methods
  async getStartingLineupByEvent(eventId: string): Promise<(StartingLineup & { players: (StartingLineupPlayer & { teamMember: TeamMember & { user: User } })[] }) | undefined> {
    const [lineup] = await db
      .select()
      .from(startingLineups)
      .where(eq(startingLineups.eventId, eventId));
    
    if (!lineup) return undefined;

    const players = await db
      .select()
      .from(startingLineupPlayers)
      .where(eq(startingLineupPlayers.lineupId, lineup.id))
      .orderBy(startingLineupPlayers.orderIndex);

    const playersWithDetails: (StartingLineupPlayer & { teamMember: TeamMember & { user: User } })[] = [];
    for (const player of players) {
      const [member] = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.id, player.teamMemberId));
      if (member) {
        const user = await this.getUser(member.userId);
        if (user) {
          playersWithDetails.push({
            ...player,
            teamMember: { ...member, user }
          });
        }
      }
    }

    return { ...lineup, players: playersWithDetails };
  }

  async createStartingLineup(data: InsertStartingLineup): Promise<StartingLineup> {
    const [lineup] = await db.insert(startingLineups).values(data).returning();
    return lineup;
  }

  async updateStartingLineup(id: string, data: Partial<InsertStartingLineup>): Promise<StartingLineup | undefined> {
    const [lineup] = await db
      .update(startingLineups)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(startingLineups.id, id))
      .returning();
    return lineup || undefined;
  }

  async deleteStartingLineup(id: string): Promise<void> {
    await db.delete(startingLineupPlayers).where(eq(startingLineupPlayers.lineupId, id));
    await db.delete(startingLineups).where(eq(startingLineups.id, id));
  }

  async setStartingLineupPlayers(lineupId: string, players: InsertStartingLineupPlayer[]): Promise<void> {
    await db.delete(startingLineupPlayers).where(eq(startingLineupPlayers.lineupId, lineupId));
    if (players.length > 0) {
      await db.insert(startingLineupPlayers).values(players);
    }
  }

  // Shoutouts implementations
  async getGameShoutouts(gameId: string): Promise<(Shoutout & { supporter: User; athlete: User })[]> {
    const gameShoutouts = await db
      .select()
      .from(shoutouts)
      .where(eq(shoutouts.gameId, gameId))
      .orderBy(desc(shoutouts.createdAt));
    
    const result: (Shoutout & { supporter: User; athlete: User })[] = [];
    for (const shoutout of gameShoutouts) {
      const supporter = await this.getUser(shoutout.supporterId);
      const athlete = await this.getUser(shoutout.athleteId);
      if (supporter && athlete) {
        result.push({ ...shoutout, supporter, athlete });
      }
    }
    return result;
  }

  async getAthleteShoutouts(athleteId: string, limit = 50): Promise<(Shoutout & { supporter: User; game?: Game })[]> {
    const athleteShoutouts = await db
      .select()
      .from(shoutouts)
      .where(eq(shoutouts.athleteId, athleteId))
      .orderBy(desc(shoutouts.createdAt))
      .limit(limit);
    
    const result: (Shoutout & { supporter: User; game?: Game })[] = [];
    for (const shoutout of athleteShoutouts) {
      const supporter = await this.getUser(shoutout.supporterId);
      const game = shoutout.gameId ? await this.getGame(shoutout.gameId) : undefined;
      if (supporter) {
        result.push({ ...shoutout, supporter, game });
      }
    }
    return result;
  }

  async createShoutout(data: InsertShoutout): Promise<Shoutout> {
    const [shoutout] = await db.insert(shoutouts).values(data).returning();
    return shoutout;
  }

  async getAthleteShoutoutCount(athleteId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(shoutouts)
      .where(eq(shoutouts.athleteId, athleteId));
    return result[0]?.count || 0;
  }

  // Live Taps implementations
  async createLiveTapEvent(data: InsertLiveTapEvent): Promise<LiveTapEvent> {
    const [tapEvent] = await db.insert(liveTapEvents).values(data).returning();
    return tapEvent;
  }

  async getGameTapCount(gameId: string): Promise<number> {
    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(${liveTapEvents.tapCount}), 0)` })
      .from(liveTapEvents)
      .where(eq(liveTapEvents.gameId, gameId));
    return result[0]?.total || 0;
  }

  async getSupporterTapTotal(supporterId: string, teamId: string, season: string): Promise<LiveTapTotal | undefined> {
    const [total] = await db
      .select()
      .from(liveTapTotals)
      .where(and(
        eq(liveTapTotals.supporterId, supporterId),
        eq(liveTapTotals.teamId, teamId),
        eq(liveTapTotals.season, season)
      ));
    return total || undefined;
  }

  async upsertLiveTapTotal(supporterId: string, teamId: string, season: string, incrementBy: number): Promise<LiveTapTotal> {
    const existing = await this.getSupporterTapTotal(supporterId, teamId, season);
    
    if (existing) {
      const [updated] = await db
        .update(liveTapTotals)
        .set({ 
          totalTaps: existing.totalTaps + incrementBy,
          updatedAt: new Date()
        })
        .where(eq(liveTapTotals.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(liveTapTotals)
        .values({ supporterId, teamId, season, totalTaps: incrementBy })
        .returning();
      return created;
    }
  }

  // Badge implementations
  async getAllBadgeDefinitions(): Promise<BadgeDefinition[]> {
    return await db
      .select()
      .from(badgeDefinitions)
      .orderBy(badgeDefinitions.tier);
  }

  async getBadgeDefinition(id: string): Promise<BadgeDefinition | undefined> {
    const [badge] = await db.select().from(badgeDefinitions).where(eq(badgeDefinitions.id, id));
    return badge || undefined;
  }

  async createBadgeDefinition(data: InsertBadgeDefinition): Promise<BadgeDefinition> {
    const [badge] = await db.insert(badgeDefinitions).values(data).returning();
    return badge;
  }

  async getSupporterBadges(supporterId: string, teamId: string, season: string): Promise<(SupporterBadge & { badge: BadgeDefinition })[]> {
    const badges = await db
      .select()
      .from(supporterBadges)
      .where(and(
        eq(supporterBadges.supporterId, supporterId),
        eq(supporterBadges.teamId, teamId),
        eq(supporterBadges.season, season)
      ))
      .orderBy(desc(supporterBadges.earnedAt));
    
    const result: (SupporterBadge & { badge: BadgeDefinition })[] = [];
    for (const sb of badges) {
      const badge = await this.getBadgeDefinition(sb.badgeId);
      if (badge) {
        result.push({ ...sb, badge });
      }
    }
    return result;
  }

  async createSupporterBadge(data: InsertSupporterBadge): Promise<SupporterBadge> {
    const [badge] = await db.insert(supporterBadges).values(data).returning();
    return badge;
  }

  // Theme implementations
  async getSupporterThemes(supporterId: string): Promise<ThemeUnlock[]> {
    return await db
      .select()
      .from(themeUnlocks)
      .where(eq(themeUnlocks.supporterId, supporterId))
      .orderBy(desc(themeUnlocks.unlockedAt));
  }

  async getActiveTheme(supporterId: string): Promise<ThemeUnlock | undefined> {
    const [theme] = await db
      .select()
      .from(themeUnlocks)
      .where(and(
        eq(themeUnlocks.supporterId, supporterId),
        eq(themeUnlocks.isActive, true)
      ));
    return theme || undefined;
  }

  async createThemeUnlock(data: InsertThemeUnlock): Promise<ThemeUnlock> {
    const [theme] = await db.insert(themeUnlocks).values(data).returning();
    return theme;
  }

  async setActiveTheme(supporterId: string, themeId: string): Promise<ThemeUnlock | undefined> {
    await db
      .update(themeUnlocks)
      .set({ isActive: false })
      .where(eq(themeUnlocks.supporterId, supporterId));
    
    const [theme] = await db
      .update(themeUnlocks)
      .set({ isActive: true })
      .where(and(
        eq(themeUnlocks.supporterId, supporterId),
        eq(themeUnlocks.themeId, themeId)
      ))
      .returning();
    return theme || undefined;
  }

  // Live Engagement Session implementations
  async getLiveSession(id: string): Promise<LiveEngagementSession | undefined> {
    const [session] = await db.select().from(liveEngagementSessions).where(eq(liveEngagementSessions.id, id));
    return session || undefined;
  }

  async getLiveSessionByEvent(eventId: string): Promise<LiveEngagementSession | undefined> {
    const [session] = await db.select().from(liveEngagementSessions).where(eq(liveEngagementSessions.eventId, eventId));
    return session || undefined;
  }

  async getActiveLiveSessionsForTeam(teamId: string): Promise<(LiveEngagementSession & { event: Event })[]> {
    const sessions = await db
      .select()
      .from(liveEngagementSessions)
      .where(and(
        eq(liveEngagementSessions.teamId, teamId),
        eq(liveEngagementSessions.status, "live")
      ));
    
    const result: (LiveEngagementSession & { event: Event })[] = [];
    for (const session of sessions) {
      const event = await this.getEvent(session.eventId);
      if (event) {
        result.push({ ...session, event });
      }
    }
    return result;
  }

  async getUpcomingLiveSessionsForTeam(teamId: string): Promise<(LiveEngagementSession & { event: Event })[]> {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    
    const sessions = await db
      .select()
      .from(liveEngagementSessions)
      .where(and(
        eq(liveEngagementSessions.teamId, teamId),
        eq(liveEngagementSessions.status, "scheduled"),
        gte(liveEngagementSessions.scheduledStart, fifteenMinutesAgo)
      ));
    
    const result: (LiveEngagementSession & { event: Event })[] = [];
    for (const session of sessions) {
      const event = await this.getEvent(session.eventId);
      if (event) {
        result.push({ ...session, event });
      }
    }
    return result;
  }

  async createLiveSession(data: InsertLiveEngagementSession): Promise<LiveEngagementSession> {
    const [session] = await db.insert(liveEngagementSessions).values(data).returning();
    return session;
  }

  async updateLiveSession(id: string, data: UpdateLiveEngagementSession): Promise<LiveEngagementSession | undefined> {
    const [session] = await db
      .update(liveEngagementSessions)
      .set(data)
      .where(eq(liveEngagementSessions.id, id))
      .returning();
    return session || undefined;
  }

  async startLiveSession(id: string, startedBy?: string): Promise<LiveEngagementSession | undefined> {
    const [session] = await db
      .update(liveEngagementSessions)
      .set({
        status: "live",
        startedAt: new Date(),
        startedBy: startedBy || null,
      })
      .where(eq(liveEngagementSessions.id, id))
      .returning();
    return session || undefined;
  }

  async endLiveSession(id: string, endedBy?: string): Promise<LiveEngagementSession | undefined> {
    const [session] = await db
      .update(liveEngagementSessions)
      .set({
        status: "ended",
        endedAt: new Date(),
        endedBy: endedBy || null,
      })
      .where(eq(liveEngagementSessions.id, id))
      .returning();
    return session || undefined;
  }

  async extendLiveSession(id: string, extendMinutes: number): Promise<LiveEngagementSession | undefined> {
    const session = await this.getLiveSession(id);
    if (!session) return undefined;
    
    const baseTime = session.extendedUntil || session.scheduledEnd || new Date();
    const newExtendedUntil = new Date(baseTime.getTime() + extendMinutes * 60 * 1000);
    
    const [updated] = await db
      .update(liveEngagementSessions)
      .set({ extendedUntil: newExtendedUntil })
      .where(eq(liveEngagementSessions.id, id))
      .returning();
    return updated || undefined;
  }

  // Session-based shoutouts and taps implementations
  async getSessionShoutouts(sessionId: string): Promise<(Shoutout & { supporter: User; athlete: User })[]> {
    const shoutoutList = await db
      .select()
      .from(shoutouts)
      .where(eq(shoutouts.sessionId, sessionId))
      .orderBy(desc(shoutouts.createdAt));
    
    const result: (Shoutout & { supporter: User; athlete: User })[] = [];
    for (const s of shoutoutList) {
      const supporter = await this.getUser(s.supporterId);
      const athlete = await this.getUser(s.athleteId);
      if (supporter && athlete) {
        result.push({ ...s, supporter, athlete });
      }
    }
    return result;
  }

  async getSessionTapCount(sessionId: string): Promise<number> {
    const [result] = await db
      .select({ total: sql<number>`COALESCE(SUM(${liveTapEvents.tapCount}), 0)` })
      .from(liveTapEvents)
      .where(eq(liveTapEvents.sessionId, sessionId));
    return Number(result?.total || 0);
  }

  async createSessionShoutout(data: { sessionId: string; supporterId: string; athleteId: string; message: string }): Promise<Shoutout> {
    const [shoutout] = await db.insert(shoutouts).values({
      sessionId: data.sessionId,
      supporterId: data.supporterId,
      athleteId: data.athleteId,
      message: data.message,
    }).returning();
    return shoutout;
  }

  async createSessionTapEvent(data: { sessionId: string; supporterId: string; teamId: string; tapCount: number }): Promise<LiveTapEvent> {
    const [event] = await db.insert(liveTapEvents).values({
      sessionId: data.sessionId,
      supporterId: data.supporterId,
      teamId: data.teamId,
      tapCount: data.tapCount,
    }).returning();
    return event;
  }

  async getTeamEngagementStats(teamId: string): Promise<{ totalTaps: number; totalShoutouts: number }> {
    // Get total taps from liveTapTotals for the team
    const [tapsResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${liveTapTotals.totalTaps}), 0)` })
      .from(liveTapTotals)
      .where(eq(liveTapTotals.teamId, teamId));
    
    // Get total shoutouts from sessions for this team
    const [shoutoutsResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(shoutouts)
      .innerJoin(liveEngagementSessions, eq(shoutouts.sessionId, liveEngagementSessions.id))
      .where(eq(liveEngagementSessions.teamId, teamId));
    
    return {
      totalTaps: Number(tapsResult?.total || 0),
      totalShoutouts: Number(shoutoutsResult?.count || 0),
    };
  }

  async getTopTappers(teamId: string, limit: number = 5): Promise<{ supporterId: string; totalTaps: number; supporter: Omit<User, 'password'> }[]> {
    const topTappers = await db
      .select({
        supporterId: liveTapTotals.supporterId,
        totalTaps: liveTapTotals.totalTaps,
      })
      .from(liveTapTotals)
      .where(eq(liveTapTotals.teamId, teamId))
      .orderBy(desc(liveTapTotals.totalTaps))
      .limit(limit);
    
    const result: { supporterId: string; totalTaps: number; supporter: Omit<User, 'password'> }[] = [];
    for (const tapper of topTappers) {
      const supporter = await this.getUser(tapper.supporterId);
      if (supporter) {
        const { password, ...safeSupporter } = supporter;
        result.push({
          supporterId: tapper.supporterId,
          totalTaps: tapper.totalTaps,
          supporter: safeSupporter,
        });
      }
    }
    return result;
  }

  // Profile Likes and Comments implementations
  async getProfileLikes(athleteId: string): Promise<ProfileLike[]> {
    return await db
      .select()
      .from(profileLikes)
      .where(eq(profileLikes.athleteId, athleteId))
      .orderBy(desc(profileLikes.createdAt));
  }

  async getProfileLikeCount(athleteId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(profileLikes)
      .where(eq(profileLikes.athleteId, athleteId));
    return Number(result?.count || 0);
  }

  async createProfileLike(data: InsertProfileLike): Promise<ProfileLike> {
    const [like] = await db.insert(profileLikes).values(data).returning();
    return like;
  }

  async getProfileComments(athleteId: string): Promise<ProfileComment[]> {
    return await db
      .select()
      .from(profileComments)
      .where(eq(profileComments.athleteId, athleteId))
      .orderBy(desc(profileComments.createdAt));
  }

  async createProfileComment(data: InsertProfileComment): Promise<ProfileComment> {
    const [comment] = await db.insert(profileComments).values(data).returning();
    return comment;
  }

  async deleteProfileComment(commentId: string, athleteId: string): Promise<boolean> {
    const result = await db
      .delete(profileComments)
      .where(and(eq(profileComments.id, commentId), eq(profileComments.athleteId, athleteId)));
    return true;
  }

  // FCM Token methods
  async saveFcmToken(userId: string, token: string, deviceInfo?: string): Promise<FcmToken> {
    const existing = await db
      .select()
      .from(fcmTokens)
      .where(and(eq(fcmTokens.userId, userId), eq(fcmTokens.token, token)))
      .limit(1);
    
    if (existing.length > 0) {
      const [updated] = await db
        .update(fcmTokens)
        .set({ updatedAt: new Date(), deviceInfo })
        .where(eq(fcmTokens.id, existing[0].id))
        .returning();
      return updated;
    }
    
    const [created] = await db.insert(fcmTokens).values({
      userId,
      token,
      deviceInfo,
    }).returning();
    return created;
  }

  async getUserFcmTokens(userId: string): Promise<FcmToken[]> {
    return await db
      .select()
      .from(fcmTokens)
      .where(eq(fcmTokens.userId, userId));
  }

  async getTeamFcmTokens(teamId: string): Promise<FcmToken[]> {
    const members = await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));
    
    if (members.length === 0) return [];
    
    const userIds = members.map(m => m.userId);
    const tokens: FcmToken[] = [];
    
    for (const userId of userIds) {
      const userTokens = await db
        .select()
        .from(fcmTokens)
        .where(eq(fcmTokens.userId, userId));
      tokens.push(...userTokens);
    }
    
    return tokens;
  }

  async deleteFcmToken(token: string): Promise<void> {
    await db.delete(fcmTokens).where(eq(fcmTokens.token, token));
  }

  // Chat methods
  async getTeamChatMessages(teamId: string, channel: string, limit: number = 50): Promise<(ChatMessage & { user: Omit<User, 'password'> })[]> {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.teamId, teamId), eq(chatMessages.channel, channel)))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
    
    const result: (ChatMessage & { user: Omit<User, 'password'> })[] = [];
    for (const message of messages) {
      const [user] = await db.select().from(users).where(eq(users.id, message.userId));
      if (user) {
        const { password, ...safeUser } = user;
        result.push({ ...message, user: safeUser });
      }
    }
    
    return result.reverse();
  }

  async createChatMessage(data: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(data).returning();
    return message;
  }

  // Athlete Follower methods
  async getAthleteFollowers(athleteId: string): Promise<AthleteFollower[]> {
    return await db
      .select()
      .from(athleteFollowers)
      .where(eq(athleteFollowers.athleteId, athleteId))
      .orderBy(desc(athleteFollowers.createdAt));
  }

  async getAthleteFollowerCount(athleteId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(athleteFollowers)
      .where(eq(athleteFollowers.athleteId, athleteId));
    return result[0]?.count || 0;
  }

  async createAthleteFollower(data: InsertAthleteFollower): Promise<AthleteFollower> {
    // Check for existing follower by email
    const existing = await db
      .select()
      .from(athleteFollowers)
      .where(and(
        eq(athleteFollowers.athleteId, data.athleteId),
        eq(athleteFollowers.followerEmail, data.followerEmail)
      ));
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [follower] = await db.insert(athleteFollowers).values(data).returning();
    return follower;
  }

  async deleteAthleteFollowerByEmail(athleteId: string, email: string): Promise<void> {
    await db
      .delete(athleteFollowers)
      .where(and(
        eq(athleteFollowers.athleteId, athleteId),
        eq(athleteFollowers.followerEmail, email)
      ));
  }

  async getAthleteFollowerByEmail(athleteId: string, email: string): Promise<AthleteFollower | undefined> {
    const [follower] = await db
      .select()
      .from(athleteFollowers)
      .where(and(
        eq(athleteFollowers.athleteId, athleteId),
        eq(athleteFollowers.followerEmail, email)
      ));
    return follower || undefined;
  }

  // HYPE Post methods
  async getAthleteHypePosts(athleteId: string): Promise<(HypePost & { highlight?: HighlightVideo })[]> {
    const posts = await db
      .select()
      .from(hypePosts)
      .where(eq(hypePosts.athleteId, athleteId))
      .orderBy(desc(hypePosts.createdAt));
    
    const result: (HypePost & { highlight?: HighlightVideo })[] = [];
    for (const post of posts) {
      let highlight: HighlightVideo | undefined;
      if (post.highlightId) {
        const [h] = await db.select().from(highlightVideos).where(eq(highlightVideos.id, post.highlightId));
        highlight = h || undefined;
      }
      result.push({ ...post, highlight });
    }
    return result;
  }

  async getHypePost(id: string): Promise<(HypePost & { athlete: User; highlight?: HighlightVideo }) | undefined> {
    const [post] = await db.select().from(hypePosts).where(eq(hypePosts.id, id));
    if (!post) return undefined;
    
    const athlete = await this.getUser(post.athleteId);
    if (!athlete) return undefined;
    
    let highlight: HighlightVideo | undefined;
    if (post.highlightId) {
      const [h] = await db.select().from(highlightVideos).where(eq(highlightVideos.id, post.highlightId));
      highlight = h || undefined;
    }
    
    return { ...post, athlete, highlight };
  }

  async createHypePost(data: InsertHypePost): Promise<HypePost> {
    const [post] = await db.insert(hypePosts).values(data).returning();
    return post;
  }

  async deleteHypePost(id: string): Promise<void> {
    await db.delete(hypePosts).where(eq(hypePosts.id, id));
  }

  // Super Admin methods
  async searchUsers(query: string): Promise<Omit<User, 'password'>[]> {
    const searchPattern = `%${query}%`;
    const results = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        name: users.name,
        avatar: users.avatar,
        profileImageUrl: users.profileImageUrl,
        position: users.position,
        number: users.number,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastAccessedAt: users.lastAccessedAt,
        mustChangePassword: users.mustChangePassword,
        isSuperAdmin: users.isSuperAdmin,
        resetToken: users.resetToken,
        resetTokenExpiry: users.resetTokenExpiry,
      })
      .from(users)
      .where(
        or(
          ilike(users.email, searchPattern),
          ilike(users.firstName, searchPattern),
          ilike(users.lastName, searchPattern),
          ilike(users.name, searchPattern),
          ilike(users.username, searchPattern)
        )
      )
      .limit(50);
    return results;
  }

  async getUserWithTeams(userId: string): Promise<{ user: Omit<User, 'password'>; teams: (TeamMember & { team: Team })[] } | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const memberships = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));

    const teamsWithInfo: (TeamMember & { team: Team })[] = [];
    for (const membership of memberships) {
      const [team] = await db.select().from(teams).where(eq(teams.id, membership.teamId));
      if (team) {
        teamsWithInfo.push({ ...membership, team });
      }
    }

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, teams: teamsWithInfo };
  }

  async adminUpdateTeamMember(memberId: string, data: UpdateTeamMember): Promise<TeamMember | undefined> {
    const [updated] = await db
      .update(teamMembers)
      .set(data)
      .where(eq(teamMembers.id, memberId))
      .returning();
    return updated || undefined;
  }

  async adminRemoveTeamMember(memberId: string): Promise<void> {
    await db.delete(teamMembers).where(eq(teamMembers.id, memberId));
  }

  async adminAddTeamMember(data: InsertTeamMember): Promise<TeamMember> {
    const [member] = await db.insert(teamMembers).values(data).returning();
    return member;
  }

  // Impersonation session methods
  async createImpersonationSession(data: InsertImpersonationSession): Promise<ImpersonationSession> {
    const [session] = await db.insert(impersonationSessions).values(data).returning();
    return session;
  }

  async getActiveImpersonationSession(adminId: string): Promise<ImpersonationSession | undefined> {
    const now = new Date();
    const [session] = await db
      .select()
      .from(impersonationSessions)
      .where(
        and(
          eq(impersonationSessions.adminId, adminId),
          gte(impersonationSessions.expiresAt, now),
          sql`${impersonationSessions.endedAt} IS NULL`
        )
      )
      .orderBy(desc(impersonationSessions.createdAt))
      .limit(1);
    return session || undefined;
  }

  async endImpersonationSession(sessionId: string): Promise<ImpersonationSession | undefined> {
    const [session] = await db
      .update(impersonationSessions)
      .set({ endedAt: new Date() })
      .where(eq(impersonationSessions.id, sessionId))
      .returning();
    return session || undefined;
  }

  // Hypes methods (unified engagement system)
  async sendHype(data: InsertHype): Promise<Hype> {
    const [hype] = await db.insert(hypes).values(data).returning();
    return hype;
  }

  async getEventHypes(eventId: string): Promise<Hype[]> {
    return await db
      .select()
      .from(hypes)
      .where(eq(hypes.eventId, eventId))
      .orderBy(desc(hypes.createdAt));
  }

  async getAthleteEventHypeCount(athleteId: string, eventId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(hypes)
      .where(and(eq(hypes.athleteId, athleteId), eq(hypes.eventId, eventId)));
    return result[0]?.count || 0;
  }

  async getAthleteSeasonHypeTotal(athleteId: string, teamId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(hypes)
      .where(and(eq(hypes.athleteId, athleteId), eq(hypes.teamId, teamId)));
    return result[0]?.count || 0;
  }

  async getEventHypesByAthlete(eventId: string): Promise<{ athleteId: string; athleteName: string; avatar: string | null; hypeCount: number }[]> {
    const result = await db
      .select({
        athleteId: hypes.athleteId,
        athleteName: users.name,
        avatar: users.avatar,
        hypeCount: sql<number>`count(*)::int`,
      })
      .from(hypes)
      .leftJoin(users, eq(hypes.athleteId, users.id))
      .where(eq(hypes.eventId, eventId))
      .groupBy(hypes.athleteId, users.name, users.avatar);
    return result.map(r => ({
      athleteId: r.athleteId,
      athleteName: r.athleteName || "Unknown",
      avatar: r.avatar,
      hypeCount: r.hypeCount,
    }));
  }

  // Direct Message methods
  private getConversationKey(teamId: string, userId1: string, userId2: string): string {
    const [minId, maxId] = [userId1, userId2].sort();
    return `${teamId}:${minId}-${maxId}`;
  }

  async getConversation(teamId: string, userId1: string, userId2: string, limit: number = 50): Promise<(DirectMessage & { sender: Omit<User, 'password'>; recipient: Omit<User, 'password'> })[]> {
    const messages = await db
      .select()
      .from(directMessages)
      .where(
        and(
          eq(directMessages.teamId, teamId),
          or(
            and(eq(directMessages.senderId, userId1), eq(directMessages.recipientId, userId2)),
            and(eq(directMessages.senderId, userId2), eq(directMessages.recipientId, userId1))
          )
        )
      )
      .orderBy(desc(directMessages.createdAt))
      .limit(limit);

    const messagesWithUsers = await Promise.all(
      messages.map(async (msg) => {
        const [sender] = await db.select().from(users).where(eq(users.id, msg.senderId));
        const [recipient] = await db.select().from(users).where(eq(users.id, msg.recipientId));
        const { password: _sp, ...senderWithoutPassword } = sender;
        const { password: _rp, ...recipientWithoutPassword } = recipient;
        return { ...msg, sender: senderWithoutPassword, recipient: recipientWithoutPassword };
      })
    );

    return messagesWithUsers.reverse();
  }

  async getUserConversations(userId: string, teamId: string): Promise<{ otherUser: Omit<User, 'password'>; lastMessage: DirectMessage; unreadCount: number }[]> {
    // Get all messages for this user in this team
    const allMessages = await db
      .select()
      .from(directMessages)
      .where(
        and(
          eq(directMessages.teamId, teamId),
          or(eq(directMessages.senderId, userId), eq(directMessages.recipientId, userId))
        )
      )
      .orderBy(desc(directMessages.createdAt));

    // Group by conversation partner
    const conversationMap = new Map<string, { messages: DirectMessage[]; otherUserId: string }>();
    for (const msg of allMessages) {
      const otherUserId = msg.senderId === userId ? msg.recipientId : msg.senderId;
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, { messages: [], otherUserId });
      }
      conversationMap.get(otherUserId)!.messages.push(msg);
    }

    // Get last read timestamps
    const readRecords = await db
      .select()
      .from(messageReads)
      .where(eq(messageReads.userId, userId));
    
    const readMap = new Map<string, Date>();
    for (const record of readRecords) {
      readMap.set(record.conversationKey, record.lastReadAt!);
    }

    // Build result
    const result: { otherUser: Omit<User, 'password'>; lastMessage: DirectMessage; unreadCount: number }[] = [];
    const conversationEntries = Array.from(conversationMap.entries());
    for (let i = 0; i < conversationEntries.length; i++) {
      const [otherUserId, data] = conversationEntries[i];
      const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId));
      if (!otherUser) continue;

      const { password: _, ...otherUserWithoutPassword } = otherUser;
      const lastMessage = data.messages[0];
      const conversationKey = this.getConversationKey(teamId, userId, otherUserId);
      const lastReadAt = readMap.get(conversationKey) || new Date(0);

      // Count unread messages (messages from other user after lastReadAt)
      const unreadCount = data.messages.filter(
        (msg: DirectMessage) => msg.senderId === otherUserId && msg.createdAt! > lastReadAt
      ).length;

      result.push({ otherUser: otherUserWithoutPassword, lastMessage, unreadCount });
    }

    // Sort by last message time
    result.sort((a, b) => (b.lastMessage.createdAt?.getTime() || 0) - (a.lastMessage.createdAt?.getTime() || 0));
    return result;
  }

  async createDirectMessage(data: InsertDirectMessage): Promise<DirectMessage & { sender: Omit<User, 'password'>; recipient: Omit<User, 'password'> }> {
    const [message] = await db.insert(directMessages).values(data).returning();
    
    // Hydrate sender and recipient
    const [sender] = await db.select().from(users).where(eq(users.id, message.senderId));
    const [recipient] = await db.select().from(users).where(eq(users.id, message.recipientId));
    const { password: _sp, ...senderWithoutPassword } = sender;
    const { password: _rp, ...recipientWithoutPassword } = recipient;
    
    return { ...message, sender: senderWithoutPassword, recipient: recipientWithoutPassword };
  }

  async getUserUnreadMessageCount(userId: string): Promise<number> {
    // Get all teams user is member of
    const memberships = await db.select().from(teamMembers).where(eq(teamMembers.userId, userId));
    let totalUnread = 0;

    for (const membership of memberships) {
      const conversations = await this.getUserConversations(userId, membership.teamId);
      totalUnread += conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
    }

    return totalUnread;
  }

  async markConversationRead(userId: string, conversationKey: string): Promise<void> {
    // Use upsert pattern - delete existing and insert new
    await db
      .delete(messageReads)
      .where(and(eq(messageReads.userId, userId), eq(messageReads.conversationKey, conversationKey)));
    
    await db.insert(messageReads).values({ userId, conversationKey, lastReadAt: new Date() });
  }

  // Notification Preferences methods
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
    return prefs || undefined;
  }

  async upsertNotificationPreferences(userId: string, data: UpdateNotificationPreferences): Promise<NotificationPreferences> {
    const existing = await this.getNotificationPreferences(userId);
    if (existing) {
      const [updated] = await db
        .update(notificationPreferences)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(notificationPreferences.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(notificationPreferences)
        .values({ userId, ...data })
        .returning();
      return created;
    }
  }

  // Chat Presence methods
  async updateChatPresence(userId: string, teamId: string, conversationWithUserId: string): Promise<void> {
    // Delete any existing presence for this user/team combo
    await db
      .delete(chatPresence)
      .where(and(eq(chatPresence.userId, userId), eq(chatPresence.teamId, teamId)));
    
    // Insert new presence record
    await db.insert(chatPresence).values({
      userId,
      teamId,
      conversationWithUserId,
      lastSeenAt: new Date(),
    });
  }

  async removeChatPresence(userId: string, teamId: string): Promise<void> {
    await db
      .delete(chatPresence)
      .where(and(eq(chatPresence.userId, userId), eq(chatPresence.teamId, teamId)));
  }

  async isUserActiveInConversation(userId: string, conversationWithUserId: string, withinSeconds: number = 15): Promise<boolean> {
    const cutoff = new Date(Date.now() - withinSeconds * 1000);
    const [presence] = await db
      .select()
      .from(chatPresence)
      .where(
        and(
          eq(chatPresence.userId, userId),
          eq(chatPresence.conversationWithUserId, conversationWithUserId),
          gte(chatPresence.lastSeenAt, cutoff)
        )
      );
    return !!presence;
  }

  // Athlete Code methods
  async findAthleteByCode(code: string): Promise<User | undefined> {
    const [athlete] = await db
      .select()
      .from(users)
      .where(eq(users.athleteCode, code.toUpperCase()));
    return athlete;
  }

  async generateAndSetAthleteCode(userId: string): Promise<string> {
    // Generate code with retry on collision
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = generateAthleteCode();
      try {
        await db.update(users).set({ athleteCode: code }).where(eq(users.id, userId));
        return code;
      } catch (error: any) {
        // Retry on unique constraint violation
        if (error.code === '23505') continue;
        throw error;
      }
    }
    throw new Error('Failed to generate unique athlete code');
  }

  async getTeamsByUserId(userId: string): Promise<Team[]> {
    const memberships = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));
    
    if (memberships.length === 0) return [];
    
    const teamIds = memberships.map(m => m.teamId);
    const result = await db
      .select()
      .from(teams)
      .where(sql`${teams.id} IN (${sql.join(teamIds.map(id => sql`${id}`), sql`, `)})`);
    
    return result;
  }

  // Supporter Athlete Links methods
  async getSupporterAthleteLinks(supporterId: string): Promise<{ id: string; athleteId: string; teamId: string | null; nickname: string | null; athlete: User; team?: Team }[]> {
    const links = await db
      .select()
      .from(supporterAthleteLinks)
      .where(and(eq(supporterAthleteLinks.supporterId, supporterId), eq(supporterAthleteLinks.isActive, true)));
    
    const result = [];
    for (const link of links) {
      const [athlete] = await db.select().from(users).where(eq(users.id, link.athleteId));
      if (!athlete) continue;
      
      let team: Team | undefined;
      if (link.teamId) {
        const [t] = await db.select().from(teams).where(eq(teams.id, link.teamId));
        team = t;
      }
      
      result.push({
        id: link.id,
        athleteId: link.athleteId,
        teamId: link.teamId,
        nickname: link.nickname,
        athlete,
        team,
      });
    }
    return result;
  }

  async getSupporterAthleteLink(supporterId: string, athleteId: string): Promise<{ id: string; athleteId: string; teamId: string | null; nickname: string | null } | undefined> {
    const [link] = await db
      .select()
      .from(supporterAthleteLinks)
      .where(
        and(
          eq(supporterAthleteLinks.supporterId, supporterId),
          eq(supporterAthleteLinks.athleteId, athleteId),
          eq(supporterAthleteLinks.isActive, true)
        )
      );
    return link ? { id: link.id, athleteId: link.athleteId, teamId: link.teamId, nickname: link.nickname } : undefined;
  }

  async createSupporterAthleteLink(data: { supporterId: string; athleteId: string; teamId: string | null; nickname: string | null }): Promise<{ id: string; supporterId: string; athleteId: string; teamId: string | null; nickname: string | null }> {
    const [link] = await db
      .insert(supporterAthleteLinks)
      .values({
        supporterId: data.supporterId,
        athleteId: data.athleteId,
        teamId: data.teamId,
        nickname: data.nickname,
      })
      .returning();
    return { id: link.id, supporterId: link.supporterId, athleteId: link.athleteId, teamId: link.teamId, nickname: link.nickname };
  }

  async updateSupporterAthleteLink(id: string, data: { nickname?: string; isActive?: boolean }): Promise<void> {
    await db
      .update(supporterAthleteLinks)
      .set(data)
      .where(eq(supporterAthleteLinks.id, id));
  }

  async deleteSupporterAthleteLink(id: string): Promise<void> {
    await db
      .delete(supporterAthleteLinks)
      .where(eq(supporterAthleteLinks.id, id));
  }

  async countCrossTeamFollows(supporterId: string): Promise<number> {
    const links = await db
      .select()
      .from(supporterAthleteLinks)
      .where(
        and(
          eq(supporterAthleteLinks.supporterId, supporterId),
          eq(supporterAthleteLinks.isActive, true),
          sql`${supporterAthleteLinks.teamId} IS NULL`
        )
      );
    return links.length;
  }

  // Supporter Stats methods (fallback stat tracking)
  async getSupporterStats(supporterId: string, athleteId: string, eventId?: string): Promise<SupporterStat[]> {
    const conditions = [
      eq(supporterStats.supporterId, supporterId),
      eq(supporterStats.athleteId, athleteId)
    ];
    if (eventId) {
      conditions.push(eq(supporterStats.eventId, eventId));
    }
    return db
      .select()
      .from(supporterStats)
      .where(and(...conditions))
      .orderBy(desc(supporterStats.recordedAt));
  }

  async getSupporterStatById(id: string): Promise<SupporterStat | undefined> {
    const [stat] = await db.select().from(supporterStats).where(eq(supporterStats.id, id));
    return stat;
  }

  async getSupporterStatsByEvent(eventId: string): Promise<(SupporterStat & { supporter: User; athlete: User })[]> {
    const results = await db
      .select()
      .from(supporterStats)
      .leftJoin(users, eq(supporterStats.supporterId, users.id))
      .where(eq(supporterStats.eventId, eventId))
      .orderBy(desc(supporterStats.recordedAt));
    
    const statsWithRelations: (SupporterStat & { supporter: User; athlete: User })[] = [];
    for (const row of results) {
      const athlete = await db.select().from(users).where(eq(users.id, row.supporter_stats.athleteId));
      if (row.users && athlete[0]) {
        statsWithRelations.push({
          ...row.supporter_stats,
          supporter: row.users,
          athlete: athlete[0]
        });
      }
    }
    return statsWithRelations;
  }

  async createSupporterStat(data: InsertSupporterStat): Promise<SupporterStat> {
    const [stat] = await db
      .insert(supporterStats)
      .values(data)
      .returning();
    return stat;
  }

  async deleteSupporterStat(id: string): Promise<void> {
    await db
      .delete(supporterStats)
      .where(eq(supporterStats.id, id));
  }

  async getAthleteSupporterStatsAggregate(athleteId: string, teamId: string): Promise<{ statName: string; total: number }[]> {
    const stats = await db
      .select({
        statName: supporterStats.statName,
        total: sql<number>`COALESCE(SUM(${supporterStats.statValue}), 0)`
      })
      .from(supporterStats)
      .where(
        and(
          eq(supporterStats.athleteId, athleteId),
          eq(supporterStats.teamId, teamId)
        )
      )
      .groupBy(supporterStats.statName);
    return stats;
  }

  async getPaidSupportersFollowingTeam(teamId: string): Promise<{ supporterId: string; email: string; name: string; athleteNames: string[]; emailEnabled: boolean; pushEnabled: boolean }[]> {
    const supporterUsers = alias(users, 'supporter');
    
    const results = await db
      .select({
        supporterId: supporterAthleteLinks.supporterId,
        athleteId: supporterAthleteLinks.athleteId,
        athleteName: sql<string>`COALESCE(${users.name}, ${users.username}, 'Unknown')`,
        supporterEmail: supporterUsers.email,
        supporterName: sql<string>`COALESCE(${supporterUsers.name}, ${supporterUsers.username}, 'Supporter')`,
        emailOnEvent: notificationPreferences.emailOnEvent,
        pushOnEvent: notificationPreferences.pushOnEvent,
      })
      .from(supporterAthleteLinks)
      .innerJoin(teamMembers, and(
        eq(teamMembers.userId, supporterAthleteLinks.athleteId),
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.role, 'athlete')
      ))
      .innerJoin(users, eq(users.id, supporterAthleteLinks.athleteId))
      .innerJoin(supporterUsers, eq(supporterUsers.id, supporterAthleteLinks.supporterId))
      .innerJoin(subscriptions, and(
        eq(subscriptions.userId, supporterAthleteLinks.supporterId),
        eq(subscriptions.tier, 'supporter'),
        eq(subscriptions.status, 'active')
      ))
      .leftJoin(notificationPreferences, eq(notificationPreferences.userId, supporterAthleteLinks.supporterId))
      .where(eq(supporterAthleteLinks.isActive, true));

    const supporterMap = new Map<string, { supporterId: string; email: string; name: string; athleteNames: string[]; emailEnabled: boolean; pushEnabled: boolean }>();
    
    for (const row of results) {
      const existing = supporterMap.get(row.supporterId);
      if (existing) {
        if (!existing.athleteNames.includes(row.athleteName)) {
          existing.athleteNames.push(row.athleteName);
        }
      } else {
        supporterMap.set(row.supporterId, {
          supporterId: row.supporterId,
          email: row.supporterEmail || '',
          name: row.supporterName,
          athleteNames: [row.athleteName],
          emailEnabled: row.emailOnEvent !== false,
          pushEnabled: row.pushOnEvent === true,
        });
      }
    }

    return Array.from(supporterMap.values());
  }

  // Admin Messages implementation
  async createAdminMessage(data: InsertAdminMessage): Promise<AdminMessage> {
    const [message] = await db.insert(adminMessages).values(data).returning();
    return message;
  }

  async createAdminMessageReceipt(data: InsertAdminMessageReceipt): Promise<AdminMessageReceipt> {
    const [receipt] = await db.insert(adminMessageReceipts).values(data).returning();
    return receipt;
  }

  async createBroadcastReceipts(messageId: string, userIds: string[]): Promise<void> {
    if (userIds.length === 0) return;
    const receipts = userIds.map(userId => ({
      messageId,
      userId,
      sentViaPush: false,
      deliveredAt: new Date(),
    }));
    await db.insert(adminMessageReceipts).values(receipts);
  }

  async getAdminBroadcasts(): Promise<(AdminMessage & { sender: User; recipientCount: number })[]> {
    const broadcasts = await db
      .select()
      .from(adminMessages)
      .leftJoin(users, eq(users.id, adminMessages.senderId))
      .where(eq(adminMessages.type, 'broadcast'))
      .orderBy(desc(adminMessages.createdAt));

    const results: (AdminMessage & { sender: User; recipientCount: number })[] = [];
    for (const row of broadcasts) {
      if (!row.users) continue;
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(adminMessageReceipts)
        .where(eq(adminMessageReceipts.messageId, row.admin_messages.id));
      results.push({
        ...row.admin_messages,
        sender: row.users,
        recipientCount: Number(countResult?.count || 0),
      });
    }
    return results;
  }

  async getUserAdminMessages(userId: string): Promise<(AdminMessage & { sender: User; isRead: boolean })[]> {
    // Get broadcasts with receipts for this user
    const broadcastMessages = await db
      .select()
      .from(adminMessages)
      .innerJoin(adminMessageReceipts, and(
        eq(adminMessageReceipts.messageId, adminMessages.id),
        eq(adminMessageReceipts.userId, userId)
      ))
      .leftJoin(users, eq(users.id, adminMessages.senderId))
      .where(eq(adminMessages.type, 'broadcast'))
      .orderBy(desc(adminMessages.createdAt));

    // Get direct support messages to this user
    const directMessages = await db
      .select()
      .from(adminMessages)
      .leftJoin(users, eq(users.id, adminMessages.senderId))
      .leftJoin(adminMessageReceipts, and(
        eq(adminMessageReceipts.messageId, adminMessages.id),
        eq(adminMessageReceipts.userId, userId)
      ))
      .where(and(
        eq(adminMessages.type, 'support'),
        eq(adminMessages.recipientId, userId)
      ))
      .orderBy(desc(adminMessages.createdAt));

    const results: (AdminMessage & { sender: User; isRead: boolean })[] = [];

    for (const row of broadcastMessages) {
      if (!row.users) continue;
      results.push({
        ...row.admin_messages,
        sender: row.users,
        isRead: row.admin_message_receipts?.isRead || false,
      });
    }

    for (const row of directMessages) {
      if (!row.users) continue;
      results.push({
        ...row.admin_messages,
        sender: row.users,
        isRead: row.admin_message_receipts?.isRead || false,
      });
    }

    return results.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getAdminSupportConversations(): Promise<{ recipientId: string; recipient: User; lastMessage: AdminMessage; unreadCount: number }[]> {
    const conversations = await db
      .select()
      .from(adminMessages)
      .leftJoin(users, eq(users.id, adminMessages.recipientId))
      .where(and(
        eq(adminMessages.type, 'support'),
        sql`${adminMessages.recipientId} IS NOT NULL`
      ))
      .orderBy(desc(adminMessages.createdAt));

    const convMap = new Map<string, { recipientId: string; recipient: User; lastMessage: AdminMessage; unreadCount: number }>();

    for (const row of conversations) {
      if (!row.users || !row.admin_messages.recipientId) continue;
      
      if (!convMap.has(row.admin_messages.recipientId)) {
        // Get unread count for this conversation
        const [unreadResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(adminMessageReceipts)
          .innerJoin(adminMessages, eq(adminMessages.id, adminMessageReceipts.messageId))
          .where(and(
            eq(adminMessageReceipts.userId, row.admin_messages.recipientId),
            eq(adminMessageReceipts.isRead, false),
            eq(adminMessages.type, 'support')
          ));

        convMap.set(row.admin_messages.recipientId, {
          recipientId: row.admin_messages.recipientId,
          recipient: row.users,
          lastMessage: row.admin_messages,
          unreadCount: Number(unreadResult?.count || 0),
        });
      }
    }

    return Array.from(convMap.values());
  }

  async getAdminConversation(recipientId: string): Promise<(AdminMessage & { sender: User })[]> {
    const messages = await db
      .select()
      .from(adminMessages)
      .leftJoin(users, eq(users.id, adminMessages.senderId))
      .where(and(
        eq(adminMessages.type, 'support'),
        eq(adminMessages.recipientId, recipientId)
      ))
      .orderBy(adminMessages.createdAt);

    return messages
      .filter(row => row.users)
      .map(row => ({
        ...row.admin_messages,
        sender: row.users!,
      }));
  }

  async markAdminMessageRead(userId: string, messageId: string): Promise<void> {
    await db
      .update(adminMessageReceipts)
      .set({ isRead: true, readAt: new Date() })
      .where(and(
        eq(adminMessageReceipts.userId, userId),
        eq(adminMessageReceipts.messageId, messageId)
      ));
  }

  async getAllUsersForBroadcast(): Promise<{ id: string; email: string; firstName: string; lastName: string }[]> {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(sql`${users.email} IS NOT NULL`);

    return allUsers.map(u => ({
      id: u.id,
      email: u.email || '',
      firstName: u.firstName || '',
      lastName: u.lastName || '',
    }));
  }
}

export const storage = new DatabaseStorage();
