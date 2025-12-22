import { 
  users, teams, teamMembers, events, highlightVideos, plays, managedAthletes,
  games, statConfigurations, gameStats, gameRosters, startingLineups, startingLineupPlayers,
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
  type StartingLineupPlayer, type InsertStartingLineupPlayer
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

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
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  
  getTeam(id: string): Promise<Team | undefined>;
  getTeamByCode(code: string): Promise<Team | undefined>;
  getTeamsByCoach(coachId: string): Promise<Team[]>;
  createTeam(team: InsertTeam, coachId: string): Promise<Team>;
  updateTeam(id: string, data: Partial<{ name: string; sport: string; season: string; badgeId: string | null }>): Promise<Team | undefined>;
  
  getTeamMembers(teamId: string): Promise<(TeamMember & { user: User })[]>;
  getTeamMembership(teamId: string, userId: string): Promise<TeamMember | undefined>;
  getUserTeams(userId: string): Promise<Team[]>;
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

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
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
}

export const storage = new DatabaseStorage();
