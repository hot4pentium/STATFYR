import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, text, integer, boolean } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
// 
// DUAL AUTH SUPPORT:
// - OAuth users (Replit Auth): email/firstName/lastName/profileImageUrl from OIDC claims;
//   username and password are NULL. Role defaults to 'athlete'.
// - Legacy password users: Have username, password, email (all required at API level).
//   profileImageUrl may be null.
//
// NOTE: username/password/email are nullable at DB level to support OAuth users.
// Legacy registration API validates these fields are present before inserting.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Auth credentials - nullable for OAuth users, validated at API level for legacy registration
  username: text("username").unique(),
  password: text("password"),
  email: text("email").unique(),
  // Profile info
  role: text("role").notNull().default("athlete"),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  name: text("name").notNull().default(""),
  avatar: text("avatar"),
  profileImageUrl: varchar("profile_image_url"),
  // STATFYR-specific fields
  position: text("position"),
  number: integer("number"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  // Flags
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  // Password reset
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  // Athlete personal code for supporters to follow
  athleteCode: varchar("athlete_code", { length: 8 }).unique(),
  // Extended profile fields for paid athletes (Athlete Pro)
  height: text("height"), // e.g., "5'10" or "178cm"
  weight: text("weight"), // e.g., "165 lbs" or "75kg"
  bio: text("bio"), // personal bio/about me
  gpa: text("gpa"), // academic GPA
  graduationYear: integer("graduation_year"), // expected graduation year
  teamAwards: text("team_awards").array(), // array of team awards
  socialLinks: jsonb("social_links"), // {instagram, twitter, tiktok, youtube}
  handedness: text("handedness"), // "left", "right", or "ambidextrous"
  footedness: text("footedness"), // "left", "right", or "both"
  favoritePlayer: text("favorite_player"), // e.g., "LeBron James"
  favoriteTeam: text("favorite_team"), // e.g., "Lakers"
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
