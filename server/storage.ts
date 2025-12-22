import { 
  users, teams, teamMembers, events, highlightVideos, plays, managedAthletes,
  type User, type InsertUser,
  type Team, type InsertTeam,
  type TeamMember, type InsertTeamMember, type UpdateTeamMember,
  type Event, type InsertEvent, type UpdateEvent,
  type HighlightVideo, type InsertHighlightVideo, type UpdateHighlightVideo,
  type Play, type InsertPlay, type UpdatePlay,
  type ManagedAthlete, type InsertManagedAthlete
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
  updateTeam(id: string, data: Partial<{ name: string; sport: string; season: string }>): Promise<Team | undefined>;
  
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

  async updateTeam(id: string, data: Partial<{ name: string; sport: string; season: string }>): Promise<Team | undefined> {
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
}

export const storage = new DatabaseStorage();
