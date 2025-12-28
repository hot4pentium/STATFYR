import { 
  users, teams, teamMembers, events, highlightVideos, plays, managedAthletes,
  games, statConfigurations, gameStats, gameRosters, startingLineups, startingLineupPlayers,
  shoutouts, liveTapEvents, liveTapTotals, badgeDefinitions, supporterBadges, themeUnlocks,
  liveEngagementSessions, profileLikes, profileComments, fcmTokens, chatMessages,
  type User, type InsertUser,
  type Team, type InsertTeam,
  type TeamMember, type InsertTeamMember, type UpdateTeamMember,
  type Event, type InsertEvent, type UpdateEvent,
  type HighlightVideo, type InsertHighlightVideo, type UpdateHighlightVideo,
  type Play, type InsertPlay, type UpdatePlay,
  type ManagedAthlete, type InsertManagedAthlete,
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
  type ChatMessage, type InsertChatMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, sql } from "drizzle-orm";

function generateTeamCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser> & { lastAccessedAt?: Date; password?: string; mustChangePassword?: boolean }): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  
  getTeam(id: string): Promise<Team | undefined>;
  getTeamByCode(code: string): Promise<Team | undefined>;
  getTeamsByCoach(coachId: string): Promise<Team[]>;
  getAllTeams(): Promise<Team[]>;
  getAllUsers(): Promise<User[]>;
  createTeam(team: InsertTeam, coachId: string): Promise<Team>;
  updateTeam(id: string, data: Partial<{ name: string; sport: string; season: string; badgeId: string | null }>): Promise<Team | undefined>;
  
  getTeamMembers(teamId: string): Promise<(TeamMember & { user: User })[]>;
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
  
  getManagedAthletes(supporterId: string): Promise<(ManagedAthlete & { athlete: User })[]>;
  createManagedAthlete(data: InsertManagedAthlete): Promise<ManagedAthlete>;
  deleteManagedAthlete(id: string): Promise<void>;
  supporterManagesAthlete(supporterId: string, athleteId: string): Promise<boolean>;
  
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
  
  // Profile Likes and Comments (public interactions)
  getProfileLikes(athleteId: string): Promise<ProfileLike[]>;
  getProfileLikeCount(athleteId: string): Promise<number>;
  createProfileLike(data: InsertProfileLike): Promise<ProfileLike>;
  getProfileComments(athleteId: string): Promise<ProfileComment[]>;
  createProfileComment(data: InsertProfileComment): Promise<ProfileComment>;
  
  // Chat methods
  getTeamChatMessages(teamId: string, channel: string, limit?: number): Promise<(ChatMessage & { user: Omit<User, 'password'> })[]>;
  createChatMessage(data: InsertChatMessage): Promise<ChatMessage>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser> & { lastAccessedAt?: Date; password?: string; mustChangePassword?: boolean }): Promise<User | undefined> {
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

  async updateTeam(id: string, data: Partial<{ name: string; sport: string; season: string; badgeId: string | null }>): Promise<Team | undefined> {
    const [team] = await db
      .update(teams)
      .set(data)
      .where(eq(teams.id, id))
      .returning();
    return team || undefined;
  }

  async getTeamMembers(teamId: string): Promise<(TeamMember & { user: User })[]> {
    const members = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));
    
    const result: (TeamMember & { user: User })[] = [];
    for (const member of members) {
      const user = await this.getUser(member.userId);
      if (user) {
        result.push({ ...member, user });
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

  async getManagedAthletes(supporterId: string): Promise<(ManagedAthlete & { athlete: User })[]> {
    const managed = await db
      .select()
      .from(managedAthletes)
      .where(eq(managedAthletes.supporterId, supporterId));
    
    const result: (ManagedAthlete & { athlete: User })[] = [];
    for (const m of managed) {
      const athlete = await this.getUser(m.athleteId);
      if (athlete) {
        result.push({ ...m, athlete });
      }
    }
    return result;
  }

  async createManagedAthlete(data: InsertManagedAthlete): Promise<ManagedAthlete> {
    const [managed] = await db.insert(managedAthletes).values(data).returning();
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
            athleteData = {
              athleteId: game_stats.athleteId,
              athleteName: user ? `${user.firstName} ${user.lastName}`.trim() || user.username : 'Unknown',
              gamesPlayed: new Set(),
              stats: {},
              recentGames: []
            };
            athleteStatsMap.set(game_stats.athleteId, athleteData);
          }
          athleteData.gamesPlayed.add(game.id);
          athleteData.stats[key] = (athleteData.stats[key] || 0) + game_stats.value;

          let gameEntry = athleteData.recentGames.find(g => g.gameId === game.id);
          if (!gameEntry) {
            gameEntry = { gameId: game.id, date: game.createdAt?.toISOString() || '', stats: {} };
            athleteData.recentGames.push(gameEntry);
          }
          gameEntry.stats[key] = (gameEntry.stats[key] || 0) + game_stats.value;
        }
      }

      let result: 'W' | 'L' | 'T' = 'T';
      if (game.teamScore > game.opponentScore) result = 'W';
      else if (game.teamScore < game.opponentScore) result = 'L';

      gameHistory.push({
        id: game.id,
        date: event?.date?.toISOString() || game.createdAt?.toISOString() || '',
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
        date: event?.date?.toISOString() || game.createdAt?.toISOString() || '',
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
}

export const storage = new DatabaseStorage();
