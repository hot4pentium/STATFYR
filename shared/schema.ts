import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
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
});

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
