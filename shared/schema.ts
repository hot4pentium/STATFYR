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
  coachId: varchar("coach_id").references(() => users.id),
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
