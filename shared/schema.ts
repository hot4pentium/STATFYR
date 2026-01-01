import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("athlete"),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  email: text("email").notNull().default(""),
  name: text("name").notNull().default(""),
  avatar: text("avatar"),
  position: text("position"),
  number: integer("number"),
  createdAt: timestamp("created_at").defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
});

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
  date: timestamp("date").notNull(),
  endDate: timestamp("end_date"),
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
  athleteId: varchar("athlete_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const managedAthletesRelations = relations(managedAthletes, ({ one }) => ({
  supporter: one(users, {
    fields: [managedAthletes.supporterId],
    references: [users.id],
  }),
  athlete: one(users, {
    fields: [managedAthletes.athleteId],
    references: [users.id],
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
  username: true,
  password: true,
  role: true,
  firstName: true,
  lastName: true,
  email: true,
  name: true,
  avatar: true,
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
export type User = typeof users.$inferSelect;
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

// Athlete Followers - for anonymous fans who follow athletes via push notifications
export const athleteFollowers = pgTable("athlete_followers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull().references(() => users.id),
  fcmToken: text("fcm_token"), // FCM token for Android/desktop (nullable for web push)
  followerName: text("follower_name").notNull().default("Anonymous"),
  // Web Push fields for iOS Safari PWA support
  pushEndpoint: text("push_endpoint"),
  pushP256dh: text("push_p256dh"),
  pushAuth: text("push_auth"),
  isWebPush: boolean("is_web_push").notNull().default(false),
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
  pushOnMessage: boolean("push_on_message").notNull().default(true),
  emailOnHype: boolean("email_on_hype").notNull().default(false),
  pushOnHype: boolean("push_on_hype").notNull().default(true),
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
