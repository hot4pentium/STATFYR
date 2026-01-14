import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import and re-export auth models (users table and sessions table for Replit Auth)
import { users, sessions } from "./models/auth";
export { users, sessions };
export type { User, UpsertUser } from "./models/auth";

export const usersRelations = relations(users, ({ many }) => ({
  teamMemberships: many(teamMembers),
  ownedTeams: many(teams),
}));

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: varchar("code", { length: 6 }).notNull().unique(),
  sport: text("sport").notNull().default("Football"),
  division: text("division"),
  season: text("season"),
  seasonStatus: text("season_status").notNull().default("active"), // 'active', 'ended', 'not_started'
  badgeId: text("badge_id"),
  teamColor: text("team_color"),
  coachId: varchar("coach_id").references(() => users.id),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  ties: integer("ties").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teamsRelations = relations(teams, ({ one, many }) => ({
  coach: one(users, {
    fields: [teams.coachId],
    references: [users.id],
  }),
  members: many(teamMembers),
}));

export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: text("role").notNull().default("athlete"),
  jerseyNumber: text("jersey_number"),
  position: text("position"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  title: text("title").notNull().default(""),
  type: text("type").notNull().default("Practice"),
  date: text("date").notNull(),
  endDate: text("end_date"),
  location: text("location"),
  details: text("details"),
  opponent: text("opponent"),
  drinksAthleteId: varchar("drinks_athlete_id").references(() => users.id),
  snacksAthleteId: varchar("snacks_athlete_id").references(() => users.id),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventsRelations = relations(events, ({ one }) => ({
  team: one(teams, {
    fields: [events.teamId],
    references: [teams.id],
  }),
  creator: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
}));

export const highlightVideos = pgTable("highlight_videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  uploaderId: varchar("uploader_id").notNull().references(() => users.id),
  title: text("title"),
  originalKey: text("original_key"),
  processedKey: text("processed_key"),
  thumbnailKey: text("thumbnail_key"),
  publicUrl: text("public_url"),
  status: text("status").notNull().default("queued"),
  durationSeconds: integer("duration_seconds"),
  fileSizeBytes: integer("file_size_bytes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const highlightVideosRelations = relations(highlightVideos, ({ one }) => ({
  team: one(teams, {
    fields: [highlightVideos.teamId],
    references: [teams.id],
  }),
  uploader: one(users, {
    fields: [highlightVideos.uploaderId],
    references: [users.id],
  }),
}));

export const plays = pgTable("plays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  canvasData: text("canvas_data").notNull(),
  thumbnailData: text("thumbnail_data"),
  category: text("category").notNull().default("Offense"),
  status: text("status"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const playsRelations = relations(plays, ({ one }) => ({
  team: one(teams, {
    fields: [plays.teamId],
    references: [teams.id],
  }),
  createdBy: one(users, {
    fields: [plays.createdById],
    references: [users.id],
  }),
}));

export const managedAthletes = pgTable("managed_athletes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supporterId: varchar("supporter_id").notNull().references(() => users.id),
  athleteId: varchar("athlete_id").references(() => users.id),
  athleteName: text("athlete_name"),
  sport: text("sport"),
  position: text("position"),
  number: text("number"),
  isOwner: boolean("is_owner").notNull().default(false),
  profileImageUrl: text("profile_image_url"),
  shareCode: varchar("share_code", { length: 8 }).unique(),
  // Season management
  season: text("season"), // e.g., "2024-2025"
  seasonStatus: text("season_status").default("none"), // 'none', 'active', 'ended'
  createdAt: timestamp("created_at").defaultNow(),
});

export const supporterEvents = pgTable("supporter_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supporterId: varchar("supporter_id").notNull().references(() => users.id),
  managedAthleteId: varchar("managed_athlete_id").notNull().references(() => managedAthletes.id),
  title: text("title").notNull(),
  description: text("description"),
  eventType: text("event_type").notNull().default("game"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  location: text("location"),
  opponentName: text("opponent_name"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const managedAthletesRelations = relations(managedAthletes, ({ one, many }) => ({
  supporter: one(users, {
    fields: [managedAthletes.supporterId],
    references: [users.id],
  }),
  athlete: one(users, {
    fields: [managedAthletes.athleteId],
    references: [users.id],
  }),
  events: many(supporterEvents),
}));

export const supporterEventsRelations = relations(supporterEvents, ({ one }) => ({
  supporter: one(users, {
    fields: [supporterEvents.supporterId],
    references: [users.id],
  }),
  managedAthlete: one(managedAthletes, {
    fields: [supporterEvents.managedAthleteId],
    references: [managedAthletes.id],
  }),
}));

// Supporter StatTracker tables (for independent supporters tracking their managed athletes)
export const supporterStatSessions = pgTable("supporter_stat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supporterId: varchar("supporter_id").notNull().references(() => users.id),
  managedAthleteId: varchar("managed_athlete_id").notNull().references(() => managedAthletes.id),
  eventId: varchar("event_id").references(() => supporterEvents.id),
  sport: text("sport"),
  opponentName: text("opponent_name"),
  status: text("status").notNull().default("active"), // 'active', 'paused', 'completed'
  currentPeriod: integer("current_period").notNull().default(1),
  totalPeriods: integer("total_periods").notNull().default(4),
  periodType: text("period_type").notNull().default("quarter"),
  athleteScore: integer("athlete_score").notNull().default(0),
  opponentScore: integer("opponent_score").notNull().default(0),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const supporterStatEntries = pgTable("supporter_stat_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => supporterStatSessions.id),
  statName: text("stat_name").notNull(), // e.g., "Points", "Rebounds", "Assists"
  statShortName: text("stat_short_name"), // e.g., "PTS", "REB", "AST"
  value: integer("value").notNull().default(1),
  pointsValue: integer("points_value").notNull().default(0),
  period: integer("period").notNull().default(1),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

export const supporterStatSessionsRelations = relations(supporterStatSessions, ({ one, many }) => ({
  supporter: one(users, {
    fields: [supporterStatSessions.supporterId],
    references: [users.id],
  }),
  managedAthlete: one(managedAthletes, {
    fields: [supporterStatSessions.managedAthleteId],
    references: [managedAthletes.id],
  }),
  event: one(supporterEvents, {
    fields: [supporterStatSessions.eventId],
    references: [supporterEvents.id],
  }),
  entries: many(supporterStatEntries),
}));

export const supporterStatEntriesRelations = relations(supporterStatEntries, ({ one }) => ({
  session: one(supporterStatSessions, {
    fields: [supporterStatEntries.sessionId],
    references: [supporterStatSessions.id],
  }),
}));

// Supporter Season Archives - stores end-of-season snapshots for managed athletes
export const supporterSeasonArchives = pgTable("supporter_season_archives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supporterId: varchar("supporter_id").notNull().references(() => users.id),
  managedAthleteId: varchar("managed_athlete_id").notNull().references(() => managedAthletes.id),
  season: text("season").notNull(), // e.g., "2024-2025"
  // Performance summary
  totalGames: integer("total_games").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  // Stat totals - stored as JSON object {statName: total}
  statTotals: jsonb("stat_totals"),
  // Per-game stats - stored as JSON array [{sessionId, opponent, date, score, stats}]
  gameStats: jsonb("game_stats"),
  // Archived events - stored as JSON array
  archivedEvents: jsonb("archived_events"),
  // Metadata
  endedAt: timestamp("ended_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("supporter_season_archives_supporter_id_idx").on(table.supporterId),
  index("supporter_season_archives_managed_athlete_id_idx").on(table.managedAthleteId),
]);

export const supporterSeasonArchivesRelations = relations(supporterSeasonArchives, ({ one }) => ({
  supporter: one(users, {
    fields: [supporterSeasonArchives.supporterId],
    references: [users.id],
  }),
  managedAthlete: one(managedAthletes, {
    fields: [supporterSeasonArchives.managedAthleteId],
    references: [managedAthletes.id],
  }),
}));

// StatTracker tables
export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  eventId: varchar("event_id").references(() => events.id),
  trackingMode: text("tracking_mode").notNull().default("individual"), // 'individual' or 'team'
  status: text("status").notNull().default("setup"), // 'setup', 'active', 'paused', 'completed'
  currentPeriod: integer("current_period").notNull().default(1),
  totalPeriods: integer("total_periods").notNull().default(4),
  periodType: text("period_type").notNull().default("quarter"), // 'quarter', 'half', 'period'
  teamScore: integer("team_score").notNull().default(0),
  opponentScore: integer("opponent_score").notNull().default(0),
  opponentName: text("opponent_name"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gamesRelations = relations(games, ({ one, many }) => ({
  team: one(teams, {
    fields: [games.teamId],
    references: [teams.id],
  }),
  event: one(events, {
    fields: [games.eventId],
    references: [events.id],
  }),
  stats: many(gameStats),
  roster: many(gameRosters),
}));

export const statConfigurations = pgTable("stat_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  name: text("name").notNull(), // e.g., "2 Points", "3 Points", "Rebound"
  shortName: text("short_name").notNull(), // e.g., "2PT", "3PT", "REB"
  value: integer("value").notNull().default(0), // points value for scoreboard (0 for non-scoring stats)
  positions: text("positions").array(), // positions that can record this stat (null = all)
  category: text("category").notNull().default("scoring"), // 'scoring', 'defense', 'other'
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const statConfigurationsRelations = relations(statConfigurations, ({ one }) => ({
  team: one(teams, {
    fields: [statConfigurations.teamId],
    references: [teams.id],
  }),
}));

export const gameStats = pgTable("game_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull().references(() => games.id),
  statConfigId: varchar("stat_config_id").notNull().references(() => statConfigurations.id),
  athleteId: varchar("athlete_id").references(() => users.id), // null for team-only stats
  period: integer("period").notNull(),
  value: integer("value").notNull().default(1), // how many (usually 1)
  pointsValue: integer("points_value").notNull().default(0), // points added to score
  isDeleted: boolean("is_deleted").notNull().default(false), // soft delete for corrections
  recordedAt: timestamp("recorded_at").defaultNow(),
  recordedById: varchar("recorded_by_id").references(() => users.id),
});

export const gameStatsRelations = relations(gameStats, ({ one }) => ({
  game: one(games, {
    fields: [gameStats.gameId],
    references: [games.id],
  }),
  statConfig: one(statConfigurations, {
    fields: [gameStats.statConfigId],
    references: [statConfigurations.id],
  }),
  athlete: one(users, {
    fields: [gameStats.athleteId],
    references: [users.id],
  }),
  recordedBy: one(users, {
    fields: [gameStats.recordedById],
    references: [users.id],
  }),
}));

export const gameRosters = pgTable("game_rosters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull().references(() => games.id),
  athleteId: varchar("athlete_id").notNull().references(() => users.id),
  jerseyNumber: text("jersey_number"),
  positions: text("positions").array(), // can have multiple positions
  isInGame: boolean("is_in_game").notNull().default(false), // true = in game, false = on bench
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameRostersRelations = relations(gameRosters, ({ one }) => ({
  game: one(games, {
    fields: [gameRosters.gameId],
    references: [games.id],
  }),
  athlete: one(users, {
    fields: [gameRosters.athleteId],
    references: [users.id],
  }),
}));

// Starting Lineups - pre-game lineup planning
export const startingLineups = pgTable("starting_lineups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const startingLineupsRelations = relations(startingLineups, ({ one, many }) => ({
  event: one(events, {
    fields: [startingLineups.eventId],
    references: [events.id],
  }),
  team: one(teams, {
    fields: [startingLineups.teamId],
    references: [teams.id],
  }),
  createdBy: one(users, {
    fields: [startingLineups.createdById],
    references: [users.id],
  }),
  players: many(startingLineupPlayers),
}));

export const startingLineupPlayers = pgTable("starting_lineup_players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lineupId: varchar("lineup_id").notNull().references(() => startingLineups.id),
  teamMemberId: varchar("team_member_id").notNull().references(() => teamMembers.id),
  positionOverride: text("position_override"),
  orderIndex: integer("order_index").notNull().default(0),
  isStarter: boolean("is_starter").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const startingLineupPlayersRelations = relations(startingLineupPlayers, ({ one }) => ({
  lineup: one(startingLineups, {
    fields: [startingLineupPlayers.lineupId],
    references: [startingLineups.id],
  }),
  teamMember: one(teamMembers, {
    fields: [startingLineupPlayers.teamMemberId],
    references: [teamMembers.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  username: true,
  password: true,
  role: true,
  firstName: true,
  lastName: true,
  email: true,
  name: true,
  avatar: true,
  profileImageUrl: true,
  position: true,
  number: true,
  mustChangePassword: true,
  isSuperAdmin: true,
});

export const insertTeamSchema = createInsertSchema(teams).pick({
  name: true,
  sport: true,
  division: true,
  season: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).pick({
  teamId: true,
  userId: true,
  role: true,
  jerseyNumber: true,
  position: true,
});

export const updateTeamMemberSchema = createInsertSchema(teamMembers).pick({
  role: true,
  jerseyNumber: true,
  position: true,
}).partial();

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const updateEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  teamId: true,
}).partial();

export const insertHighlightVideoSchema = createInsertSchema(highlightVideos).omit({
  id: true,
  createdAt: true,
});

export const updateHighlightVideoSchema = createInsertSchema(highlightVideos).omit({
  id: true,
  createdAt: true,
  teamId: true,
  uploaderId: true,
}).partial();

export const insertPlaySchema = createInsertSchema(plays).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePlaySchema = createInsertSchema(plays).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  teamId: true,
  createdById: true,
}).partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type UpdateTeamMember = z.infer<typeof updateTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type UpdateEvent = z.infer<typeof updateEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertHighlightVideo = z.infer<typeof insertHighlightVideoSchema>;
export type UpdateHighlightVideo = z.infer<typeof updateHighlightVideoSchema>;
export type HighlightVideo = typeof highlightVideos.$inferSelect;
export type InsertPlay = z.infer<typeof insertPlaySchema>;
export type UpdatePlay = z.infer<typeof updatePlaySchema>;
export type Play = typeof plays.$inferSelect;

export const insertManagedAthleteSchema = createInsertSchema(managedAthletes).omit({
  id: true,
  createdAt: true,
});

export type InsertManagedAthlete = z.infer<typeof insertManagedAthleteSchema>;
export type ManagedAthlete = typeof managedAthletes.$inferSelect;

export const insertSupporterEventSchema = createInsertSchema(supporterEvents).omit({
  id: true,
  createdAt: true,
});

export const updateSupporterEventSchema = createInsertSchema(supporterEvents).omit({
  id: true,
  supporterId: true,
  createdAt: true,
}).partial();

export type InsertSupporterEvent = z.infer<typeof insertSupporterEventSchema>;
export type UpdateSupporterEvent = z.infer<typeof updateSupporterEventSchema>;
export type SupporterEvent = typeof supporterEvents.$inferSelect;

// Supporter StatTracker schemas
export const insertSupporterStatSessionSchema = createInsertSchema(supporterStatSessions).omit({
  id: true,
  createdAt: true,
});

export const updateSupporterStatSessionSchema = createInsertSchema(supporterStatSessions).omit({
  id: true,
  supporterId: true,
  managedAthleteId: true,
  createdAt: true,
}).partial();

export const insertSupporterStatEntrySchema = createInsertSchema(supporterStatEntries).omit({
  id: true,
  recordedAt: true,
});

export type InsertSupporterStatSession = z.infer<typeof insertSupporterStatSessionSchema>;
export type UpdateSupporterStatSession = z.infer<typeof updateSupporterStatSessionSchema>;
export type SupporterStatSession = typeof supporterStatSessions.$inferSelect;
export type InsertSupporterStatEntry = z.infer<typeof insertSupporterStatEntrySchema>;
export type SupporterStatEntry = typeof supporterStatEntries.$inferSelect;

// StatTracker schemas
export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
});

export const updateGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
  teamId: true,
}).partial();

export const insertStatConfigSchema = createInsertSchema(statConfigurations).omit({
  id: true,
  createdAt: true,
});

export const updateStatConfigSchema = createInsertSchema(statConfigurations).omit({
  id: true,
  createdAt: true,
  teamId: true,
}).partial();

export const insertGameStatSchema = createInsertSchema(gameStats).omit({
  id: true,
  recordedAt: true,
});

export const insertGameRosterSchema = createInsertSchema(gameRosters).omit({
  id: true,
  createdAt: true,
});

export const updateGameRosterSchema = createInsertSchema(gameRosters).omit({
  id: true,
  createdAt: true,
  gameId: true,
  athleteId: true,
}).partial();

export type InsertGame = z.infer<typeof insertGameSchema>;
export type UpdateGame = z.infer<typeof updateGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertStatConfig = z.infer<typeof insertStatConfigSchema>;
export type UpdateStatConfig = z.infer<typeof updateStatConfigSchema>;
export type StatConfig = typeof statConfigurations.$inferSelect;
export type InsertGameStat = z.infer<typeof insertGameStatSchema>;
export type GameStat = typeof gameStats.$inferSelect;
export type InsertGameRoster = z.infer<typeof insertGameRosterSchema>;
export type UpdateGameRoster = z.infer<typeof updateGameRosterSchema>;
export type GameRoster = typeof gameRosters.$inferSelect;

// Starting Lineup schemas
export const insertStartingLineupSchema = createInsertSchema(startingLineups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStartingLineupPlayerSchema = createInsertSchema(startingLineupPlayers).omit({
  id: true,
  createdAt: true,
});

export type InsertStartingLineup = z.infer<typeof insertStartingLineupSchema>;
export type StartingLineup = typeof startingLineups.$inferSelect;
export type InsertStartingLineupPlayer = z.infer<typeof insertStartingLineupPlayerSchema>;
export type StartingLineupPlayer = typeof startingLineupPlayers.$inferSelect;

// Live Engagement Sessions - independent from StatTracker games
export const liveEngagementSessions = pgTable("live_engagement_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  gameId: varchar("game_id").references(() => games.id), // optional link to StatTracker game
  status: text("status").notNull().default("scheduled"), // scheduled, live, ended
  scheduledStart: timestamp("scheduled_start").notNull(), // event start time
  scheduledEnd: timestamp("scheduled_end"), // event end time
  startedAt: timestamp("started_at"), // actual start time (manual or auto)
  endedAt: timestamp("ended_at"), // actual end time
  extendedUntil: timestamp("extended_until"), // if supporter extends past auto-end
  startedBy: varchar("started_by").references(() => users.id), // who started (null = auto)
  endedBy: varchar("ended_by").references(() => users.id), // who ended (null = auto)
  createdAt: timestamp("created_at").defaultNow(),
});

export const liveEngagementSessionsRelations = relations(liveEngagementSessions, ({ one }) => ({
  event: one(events, {
    fields: [liveEngagementSessions.eventId],
    references: [events.id],
  }),
  team: one(teams, {
    fields: [liveEngagementSessions.teamId],
    references: [teams.id],
  }),
  game: one(games, {
    fields: [liveEngagementSessions.gameId],
    references: [games.id],
  }),
}));

// Shoutouts - supporters send quick cheers to athletes during games
export const shoutouts = pgTable("shoutouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => liveEngagementSessions.id), // new: session-based
  gameId: varchar("game_id").references(() => games.id), // legacy: keep for backward compat (nullable now)
  supporterId: varchar("supporter_id").notNull().references(() => users.id),
  athleteId: varchar("athlete_id").notNull().references(() => users.id),
  message: text("message").notNull().default("🔥"), // preset emoji/message
  createdAt: timestamp("created_at").defaultNow(),
});

export const shoutoutsRelations = relations(shoutouts, ({ one }) => ({
  session: one(liveEngagementSessions, {
    fields: [shoutouts.sessionId],
    references: [liveEngagementSessions.id],
  }),
  game: one(games, {
    fields: [shoutouts.gameId],
    references: [games.id],
  }),
  supporter: one(users, {
    fields: [shoutouts.supporterId],
    references: [users.id],
  }),
  athlete: one(users, {
    fields: [shoutouts.athleteId],
    references: [users.id],
  }),
}));

// Live Tap Events - audit log of tap bursts (every 3 taps = 1 increment)
export const liveTapEvents = pgTable("live_tap_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => liveEngagementSessions.id), // new: session-based
  gameId: varchar("game_id").references(() => games.id), // legacy: keep for backward compat (nullable now)
  supporterId: varchar("supporter_id").notNull().references(() => users.id),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  tapCount: integer("tap_count").notNull().default(1), // number of increments in this burst
  createdAt: timestamp("created_at").defaultNow(),
});

export const liveTapEventsRelations = relations(liveTapEvents, ({ one }) => ({
  session: one(liveEngagementSessions, {
    fields: [liveTapEvents.sessionId],
    references: [liveEngagementSessions.id],
  }),
  game: one(games, {
    fields: [liveTapEvents.gameId],
    references: [games.id],
  }),
  supporter: one(users, {
    fields: [liveTapEvents.supporterId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [liveTapEvents.teamId],
    references: [teams.id],
  }),
}));

// Live Tap Totals - aggregated season totals per supporter per team
export const liveTapTotals = pgTable("live_tap_totals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supporterId: varchar("supporter_id").notNull().references(() => users.id),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  season: text("season").notNull(), // e.g., "2024-2025"
  totalTaps: integer("total_taps").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const liveTapTotalsRelations = relations(liveTapTotals, ({ one }) => ({
  supporter: one(users, {
    fields: [liveTapTotals.supporterId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [liveTapTotals.teamId],
    references: [teams.id],
  }),
}));

// Chat Messages - team chat messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  channel: text("channel").notNull().default("general"), // general, announcements, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  team: one(teams, {
    fields: [chatMessages.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

// Badge Definitions - defines badge tiers and their requirements
export const badgeDefinitions = pgTable("badge_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Bronze", "Silver", "Gold", "Legend"
  tier: integer("tier").notNull(), // 1, 2, 3, 4 for ordering
  tapThreshold: integer("tap_threshold").notNull(), // taps needed to earn
  themeId: text("theme_id").notNull(), // theme unlocked by this badge
  iconEmoji: text("icon_emoji").notNull().default("🏅"),
  color: text("color").notNull().default("#cd7f32"), // badge color
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Supporter Badges - badges earned by supporters
export const supporterBadges = pgTable("supporter_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supporterId: varchar("supporter_id").notNull().references(() => users.id),
  badgeId: varchar("badge_id").notNull().references(() => badgeDefinitions.id),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  season: text("season").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const supporterBadgesRelations = relations(supporterBadges, ({ one }) => ({
  supporter: one(users, {
    fields: [supporterBadges.supporterId],
    references: [users.id],
  }),
  badge: one(badgeDefinitions, {
    fields: [supporterBadges.badgeId],
    references: [badgeDefinitions.id],
  }),
  team: one(teams, {
    fields: [supporterBadges.teamId],
    references: [teams.id],
  }),
}));

// Theme Unlocks - themes unlocked by badges (supporter's active selection)
export const themeUnlocks = pgTable("theme_unlocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supporterId: varchar("supporter_id").notNull().references(() => users.id),
  themeId: text("theme_id").notNull(), // references badge's themeId
  isActive: boolean("is_active").notNull().default(false), // currently selected theme
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const themeUnlocksRelations = relations(themeUnlocks, ({ one }) => ({
  supporter: one(users, {
    fields: [themeUnlocks.supporterId],
    references: [users.id],
  }),
}));

// Season Archives - stores end-of-season snapshots
export const seasonArchives = pgTable("season_archives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  season: text("season").notNull(), // e.g., "2024-2025"
  // Team performance
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  ties: integer("ties").notNull().default(0),
  totalGames: integer("total_games").notNull().default(0),
  // Top performers - stored as JSON array [{userId, name, statName, value}]
  topPerformers: jsonb("top_performers"),
  // Season MVP (optional - coach can pick)
  mvpUserId: varchar("mvp_user_id").references(() => users.id),
  mvpName: text("mvp_name"),
  // Supporter engagement
  totalTaps: integer("total_taps").notNull().default(0),
  topTapperId: varchar("top_tapper_id").references(() => users.id),
  topTapperName: text("top_tapper_name"),
  topTapperTaps: integer("top_tapper_taps").notNull().default(0),
  totalBadgesEarned: integer("total_badges_earned").notNull().default(0),
  // Archived events - stored as JSON array
  archivedEvents: jsonb("archived_events"),
  // Per-supporter tap totals - stored as JSON array [{supporterId, name, taps}]
  supporterTapTotals: jsonb("supporter_tap_totals"),
  // Metadata
  endedAt: timestamp("ended_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("season_archives_team_id_idx").on(table.teamId),
]);

export const seasonArchivesRelations = relations(seasonArchives, ({ one }) => ({
  team: one(teams, {
    fields: [seasonArchives.teamId],
    references: [teams.id],
  }),
  mvp: one(users, {
    fields: [seasonArchives.mvpUserId],
    references: [users.id],
  }),
  topTapper: one(users, {
    fields: [seasonArchives.topTapperId],
    references: [users.id],
  }),
}));

// Shoutouts schemas
export const insertShoutoutSchema = createInsertSchema(shoutouts).omit({
  id: true,
  createdAt: true,
});

export type InsertShoutout = z.infer<typeof insertShoutoutSchema>;
export type Shoutout = typeof shoutouts.$inferSelect;

// Live Tap schemas
export const insertLiveTapEventSchema = createInsertSchema(liveTapEvents).omit({
  id: true,
  createdAt: true,
});

export const upsertLiveTapTotalSchema = createInsertSchema(liveTapTotals).omit({
  id: true,
  updatedAt: true,
});

export type InsertLiveTapEvent = z.infer<typeof insertLiveTapEventSchema>;
export type LiveTapEvent = typeof liveTapEvents.$inferSelect;
export type UpsertLiveTapTotal = z.infer<typeof upsertLiveTapTotalSchema>;
export type LiveTapTotal = typeof liveTapTotals.$inferSelect;

// Badge schemas
export const insertBadgeDefinitionSchema = createInsertSchema(badgeDefinitions).omit({
  id: true,
  createdAt: true,
});

export const insertSupporterBadgeSchema = createInsertSchema(supporterBadges).omit({
  id: true,
  earnedAt: true,
});

export type InsertBadgeDefinition = z.infer<typeof insertBadgeDefinitionSchema>;
export type BadgeDefinition = typeof badgeDefinitions.$inferSelect;
export type InsertSupporterBadge = z.infer<typeof insertSupporterBadgeSchema>;
export type SupporterBadge = typeof supporterBadges.$inferSelect;

// Theme schemas
export const insertThemeUnlockSchema = createInsertSchema(themeUnlocks).omit({
  id: true,
  unlockedAt: true,
});

export type InsertThemeUnlock = z.infer<typeof insertThemeUnlockSchema>;
export type ThemeUnlock = typeof themeUnlocks.$inferSelect;

// Season Archive schemas
export const insertSeasonArchiveSchema = createInsertSchema(seasonArchives).omit({
  id: true,
  createdAt: true,
});

export type InsertSeasonArchive = z.infer<typeof insertSeasonArchiveSchema>;
export type SeasonArchive = typeof seasonArchives.$inferSelect;

// Supporter Season Archive schemas
export const insertSupporterSeasonArchiveSchema = createInsertSchema(supporterSeasonArchives).omit({
  id: true,
  createdAt: true,
});

export type InsertSupporterSeasonArchive = z.infer<typeof insertSupporterSeasonArchiveSchema>;
export type SupporterSeasonArchive = typeof supporterSeasonArchives.$inferSelect;

// Live Engagement Session schemas
export const insertLiveEngagementSessionSchema = createInsertSchema(liveEngagementSessions).omit({
  id: true,
  createdAt: true,
});

export const updateLiveEngagementSessionSchema = createInsertSchema(liveEngagementSessions).omit({
  id: true,
  eventId: true,
  teamId: true,
  createdAt: true,
}).partial();

export type InsertLiveEngagementSession = z.infer<typeof insertLiveEngagementSessionSchema>;
export type UpdateLiveEngagementSession = z.infer<typeof updateLiveEngagementSessionSchema>;
export type LiveEngagementSession = typeof liveEngagementSessions.$inferSelect;

// Profile Likes - public likes on athlete profiles
export const profileLikes = pgTable("profile_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull().references(() => users.id),
  visitorName: text("visitor_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const profileLikesRelations = relations(profileLikes, ({ one }) => ({
  athlete: one(users, {
    fields: [profileLikes.athleteId],
    references: [users.id],
  }),
}));

// Profile Comments - public comments on athlete profiles
export const profileComments = pgTable("profile_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull().references(() => users.id),
  visitorName: text("visitor_name").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const profileCommentsRelations = relations(profileComments, ({ one }) => ({
  athlete: one(users, {
    fields: [profileComments.athleteId],
    references: [users.id],
  }),
}));

// Profile Like schemas
export const insertProfileLikeSchema = createInsertSchema(profileLikes).omit({
  id: true,
  createdAt: true,
});

export type InsertProfileLike = z.infer<typeof insertProfileLikeSchema>;
export type ProfileLike = typeof profileLikes.$inferSelect;

// Profile Comment schemas
export const insertProfileCommentSchema = createInsertSchema(profileComments).omit({
  id: true,
  createdAt: true,
});

export type InsertProfileComment = z.infer<typeof insertProfileCommentSchema>;
export type ProfileComment = typeof profileComments.$inferSelect;

// FCM Tokens - Firebase Cloud Messaging tokens for push notifications
export const fcmTokens = pgTable("fcm_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull(),
  deviceInfo: text("device_info"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fcmTokensRelations = relations(fcmTokens, ({ one }) => ({
  user: one(users, {
    fields: [fcmTokens.userId],
    references: [users.id],
  }),
}));

export const insertFcmTokenSchema = createInsertSchema(fcmTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFcmToken = z.infer<typeof insertFcmTokenSchema>;
export type FcmToken = typeof fcmTokens.$inferSelect;

// Chat Message schemas
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Athlete Followers - for fans who follow athletes via email notifications
export const athleteFollowers = pgTable("athlete_followers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull().references(() => users.id),
  followerEmail: text("follower_email").notNull(),
  followerName: text("follower_name").notNull().default("Anonymous"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const athleteFollowersRelations = relations(athleteFollowers, ({ one }) => ({
  athlete: one(users, {
    fields: [athleteFollowers.athleteId],
    references: [users.id],
  }),
}));

export const insertAthleteFollowerSchema = createInsertSchema(athleteFollowers).omit({
  id: true,
  createdAt: true,
});

export type InsertAthleteFollower = z.infer<typeof insertAthleteFollowerSchema>;
export type AthleteFollower = typeof athleteFollowers.$inferSelect;

// HYPE Posts - athletes create HYPE posts with template images
export const hypePosts = pgTable("hype_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull().references(() => users.id),
  templateImage: text("template_image").notNull(), // template name: clutch, domination, etc.
  message: text("message").notNull(), // athlete's custom message
  highlightId: varchar("highlight_id").references(() => highlightVideos.id), // optional attached highlight
  createdAt: timestamp("created_at").defaultNow(),
});

export const hypePostsRelations = relations(hypePosts, ({ one }) => ({
  athlete: one(users, {
    fields: [hypePosts.athleteId],
    references: [users.id],
  }),
  highlight: one(highlightVideos, {
    fields: [hypePosts.highlightId],
    references: [highlightVideos.id],
  }),
}));

export const insertHypePostSchema = createInsertSchema(hypePosts).omit({
  id: true,
  createdAt: true,
});

export type InsertHypePost = z.infer<typeof insertHypePostSchema>;
export type HypePost = typeof hypePosts.$inferSelect;

// Super Admin Impersonation Sessions - track when admins view as users
export const impersonationSessions = pgTable("impersonation_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  targetUserId: varchar("target_user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const impersonationSessionsRelations = relations(impersonationSessions, ({ one }) => ({
  admin: one(users, {
    fields: [impersonationSessions.adminId],
    references: [users.id],
  }),
  targetUser: one(users, {
    fields: [impersonationSessions.targetUserId],
    references: [users.id],
  }),
}));

export const insertImpersonationSessionSchema = createInsertSchema(impersonationSessions).omit({
  id: true,
  createdAt: true,
  endedAt: true,
});

export type InsertImpersonationSession = z.infer<typeof insertImpersonationSessionSchema>;
export type ImpersonationSession = typeof impersonationSessions.$inferSelect;

// Hypes - unified engagement system (replaces taps)
export const hypes = pgTable("hypes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => liveEngagementSessions.id),
  eventId: varchar("event_id").references(() => events.id),
  supporterId: varchar("supporter_id").notNull().references(() => users.id),
  athleteId: varchar("athlete_id").notNull().references(() => users.id),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const hypesRelations = relations(hypes, ({ one }) => ({
  session: one(liveEngagementSessions, {
    fields: [hypes.sessionId],
    references: [liveEngagementSessions.id],
  }),
  event: one(events, {
    fields: [hypes.eventId],
    references: [events.id],
  }),
  supporter: one(users, {
    fields: [hypes.supporterId],
    references: [users.id],
  }),
  athlete: one(users, {
    fields: [hypes.athleteId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [hypes.teamId],
    references: [teams.id],
  }),
}));

export const insertHypeSchema = createInsertSchema(hypes).omit({
  id: true,
  createdAt: true,
});

export type InsertHype = z.infer<typeof insertHypeSchema>;
export type Hype = typeof hypes.$inferSelect;

// Athlete Hype Totals - aggregated hype counts per athlete per event
export const athleteHypeTotals = pgTable("athlete_hype_totals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull().references(() => users.id),
  eventId: varchar("event_id").references(() => events.id),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  totalHypes: integer("total_hypes").notNull().default(0),
  season: text("season"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const athleteHypeTotalsRelations = relations(athleteHypeTotals, ({ one }) => ({
  athlete: one(users, {
    fields: [athleteHypeTotals.athleteId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [athleteHypeTotals.eventId],
    references: [events.id],
  }),
  team: one(teams, {
    fields: [athleteHypeTotals.teamId],
    references: [teams.id],
  }),
}));

export const insertAthleteHypeTotalSchema = createInsertSchema(athleteHypeTotals).omit({
  id: true,
  updatedAt: true,
});

export type InsertAthleteHypeTotal = z.infer<typeof insertAthleteHypeTotalSchema>;
export type AthleteHypeTotal = typeof athleteHypeTotals.$inferSelect;

// Direct Messages - 1-on-1 messages between team members
export const directMessages = pgTable("direct_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  recipientId: varchar("recipient_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  team: one(teams, {
    fields: [directMessages.teamId],
    references: [teams.id],
  }),
  sender: one(users, {
    fields: [directMessages.senderId],
    references: [users.id],
  }),
  recipient: one(users, {
    fields: [directMessages.recipientId],
    references: [users.id],
  }),
}));

// Message Read Status - tracks which messages have been read
export const messageReads = pgTable("message_reads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  conversationKey: text("conversation_key").notNull(), // format: "teamId:minUserId-maxUserId"
  lastReadAt: timestamp("last_read_at").notNull().defaultNow(),
});

export const messageReadsRelations = relations(messageReads, ({ one }) => ({
  user: one(users, {
    fields: [messageReads.userId],
    references: [users.id],
  }),
}));

// User Notification Preferences
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  emailOnMessage: boolean("email_on_message").notNull().default(true),
  emailOnHype: boolean("email_on_hype").notNull().default(true),
  emailOnFollow: boolean("email_on_follow").notNull().default(true),
  emailOnEvent: boolean("email_on_event").notNull().default(true),
  pushOnEvent: boolean("push_on_event").notNull().default(false),
  pushOnMessage: boolean("push_on_message").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

// Direct Message schemas
export const insertDirectMessageSchema = createInsertSchema(directMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type DirectMessage = typeof directMessages.$inferSelect;

// Message Read schemas
export const insertMessageReadSchema = createInsertSchema(messageReads).omit({
  id: true,
});

export type InsertMessageRead = z.infer<typeof insertMessageReadSchema>;
export type MessageRead = typeof messageReads.$inferSelect;

// Notification Preferences schemas
export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  updatedAt: true,
});

export const updateNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  userId: true,
  updatedAt: true,
}).partial();

export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type UpdateNotificationPreferences = z.infer<typeof updateNotificationPreferencesSchema>;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;

// Chat Presence - tracks which users are actively viewing a conversation
export const chatPresence = pgTable("chat_presence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  conversationWithUserId: varchar("conversation_with_user_id").references(() => users.id),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
});

export const chatPresenceRelations = relations(chatPresence, ({ one }) => ({
  user: one(users, {
    fields: [chatPresence.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [chatPresence.teamId],
    references: [teams.id],
  }),
  conversationWith: one(users, {
    fields: [chatPresence.conversationWithUserId],
    references: [users.id],
  }),
}));

export const insertChatPresenceSchema = createInsertSchema(chatPresence).omit({
  id: true,
  lastSeenAt: true,
});

export type InsertChatPresence = z.infer<typeof insertChatPresenceSchema>;
export type ChatPresence = typeof chatPresence.$inferSelect;

// Subscriptions - Stripe subscription data for users
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  tier: text("tier").notNull().default("free"), // 'free', 'coach', 'supporter'
  status: text("status").notNull().default("active"), // 'active', 'canceled', 'past_due', 'trialing'
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

// Supporter Athlete Links - cross-team following for paid supporters
export const supporterAthleteLinks = pgTable("supporter_athlete_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supporterId: varchar("supporter_id").notNull().references(() => users.id),
  athleteId: varchar("athlete_id").notNull().references(() => users.id),
  teamId: varchar("team_id").references(() => teams.id), // optional - null means cross-team follow
  nickname: text("nickname"), // supporter's nickname for the athlete (e.g., "My Son")
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const supporterAthleteLinksRelations = relations(supporterAthleteLinks, ({ one }) => ({
  supporter: one(users, {
    fields: [supporterAthleteLinks.supporterId],
    references: [users.id],
  }),
  athlete: one(users, {
    fields: [supporterAthleteLinks.athleteId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [supporterAthleteLinks.teamId],
    references: [teams.id],
  }),
}));

// Supporter Stats - fallback stats tracked by paid supporters when coach doesn't track individual stats
export const supporterStats = pgTable("supporter_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supporterId: varchar("supporter_id").notNull().references(() => users.id),
  athleteId: varchar("athlete_id").notNull().references(() => users.id),
  eventId: varchar("event_id").references(() => events.id),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  statName: text("stat_name").notNull(), // e.g., "2 Points", "Rebounds"
  statValue: integer("stat_value").notNull().default(1),
  period: integer("period"),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

export const supporterStatsRelations = relations(supporterStats, ({ one }) => ({
  supporter: one(users, {
    fields: [supporterStats.supporterId],
    references: [users.id],
  }),
  athlete: one(users, {
    fields: [supporterStats.athleteId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [supporterStats.eventId],
    references: [events.id],
  }),
  team: one(teams, {
    fields: [supporterStats.teamId],
    references: [teams.id],
  }),
}));

// Subscription schemas
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type UpdateSubscription = z.infer<typeof updateSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// Supporter Athlete Link schemas
export const insertSupporterAthleteLinkSchema = createInsertSchema(supporterAthleteLinks).omit({
  id: true,
  createdAt: true,
});

export type InsertSupporterAthleteLink = z.infer<typeof insertSupporterAthleteLinkSchema>;
export type SupporterAthleteLink = typeof supporterAthleteLinks.$inferSelect;

// Supporter Stats schemas
export const insertSupporterStatSchema = createInsertSchema(supporterStats).omit({
  id: true,
  recordedAt: true,
});

export type InsertSupporterStat = z.infer<typeof insertSupporterStatSchema>;
export type SupporterStat = typeof supporterStats.$inferSelect;

// Admin Messages - broadcasts and support DMs from admin to users
export const adminMessages = pgTable("admin_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id), // Admin who sent
  recipientId: varchar("recipient_id").references(() => users.id), // Null for broadcasts
  type: text("type").notNull().default("support"), // 'broadcast' or 'support'
  message: text("message").notNull(),
  title: text("title"), // For broadcasts
  createdAt: timestamp("created_at").defaultNow(),
});

// Per-user receipt tracking for admin messages (especially broadcasts)
export const adminMessageReceipts = pgTable("admin_message_receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => adminMessages.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  isRead: boolean("is_read").notNull().default(false),
  sentViaPush: boolean("sent_via_push").notNull().default(false),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
});

export const adminMessagesRelations = relations(adminMessages, ({ one, many }) => ({
  sender: one(users, {
    fields: [adminMessages.senderId],
    references: [users.id],
  }),
  recipient: one(users, {
    fields: [adminMessages.recipientId],
    references: [users.id],
  }),
  receipts: many(adminMessageReceipts),
}));

export const adminMessageReceiptsRelations = relations(adminMessageReceipts, ({ one }) => ({
  message: one(adminMessages, {
    fields: [adminMessageReceipts.messageId],
    references: [adminMessages.id],
  }),
  user: one(users, {
    fields: [adminMessageReceipts.userId],
    references: [users.id],
  }),
}));

// Admin Message schemas
export const insertAdminMessageSchema = createInsertSchema(adminMessages).omit({
  id: true,
  createdAt: true,
});

export const insertAdminMessageReceiptSchema = createInsertSchema(adminMessageReceipts).omit({
  id: true,
  isRead: true,
  readAt: true,
});

export type InsertAdminMessage = z.infer<typeof insertAdminMessageSchema>;
export type AdminMessage = typeof adminMessages.$inferSelect;
export type InsertAdminMessageReceipt = z.infer<typeof insertAdminMessageReceiptSchema>;
export type AdminMessageReceipt = typeof adminMessageReceipts.$inferSelect;
