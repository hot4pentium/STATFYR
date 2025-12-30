import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { withRetry } from "./db";
import { insertUserSchema, insertTeamSchema, insertEventSchema, updateEventSchema, insertHighlightVideoSchema, insertPlaySchema, updatePlaySchema, updateTeamMemberSchema, insertGameSchema, updateGameSchema, insertStatConfigSchema, updateStatConfigSchema, insertGameStatSchema, insertGameRosterSchema, updateGameRosterSchema, insertStartingLineupSchema, insertStartingLineupPlayerSchema, insertShoutoutSchema, insertLiveTapEventSchema, insertBadgeDefinitionSchema, insertProfileLikeSchema, insertProfileCommentSchema, insertChatMessageSchema, insertAthleteFollowerSchema, insertHypePostSchema } from "@shared/schema";
import { z } from "zod";
import { registerObjectStorageRoutes, ObjectStorageService, objectStorageClient } from "./replit_integrations/object_storage";
import { spawn } from "child_process";
import path from "path";
import bcrypt from "bcrypt";
import { sendPushNotification } from "./firebaseAdmin";
import { WebSocketServer, WebSocket } from "ws";

// Store connected WebSocket clients by team
const teamClients = new Map<string, Set<WebSocket>>();

const SALT_ROUNDS = 10;

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const objectStorageService = new ObjectStorageService();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = insertUserSchema.parse(req.body);
      
      // Check if username already exists (with retry for db wake-up)
      const existingUsername = await withRetry(() => storage.getUserByUsername(parsed.username));
      if (existingUsername) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Check if email already exists (with retry for db wake-up)
      if (parsed.email) {
        const email = parsed.email;
        const existingEmail = await withRetry(() => storage.getUserByEmail(email));
        if (existingEmail) {
          return res.status(400).json({ error: "Email already exists" });
        }
      }
      
      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(parsed.password, SALT_ROUNDS);
      const user = await withRetry(() => storage.createUser({ ...parsed, password: hashedPassword }));
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      const errorMessage = error?.message || "Failed to register user";
      res.status(500).json({ error: `Failed to register user: ${errorMessage}` });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Try to find user by email first, then by username (with retry for db wake-up)
      let user = await withRetry(() => storage.getUserByEmail(username));
      if (!user) {
        user = await withRetry(() => storage.getUserByUsername(username));
      }
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Verify password with bcrypt
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Update last accessed time and get updated user
      const updatedUser = await storage.updateUser(user.id, { lastAccessedAt: new Date() });
      const userToReturn = updatedUser || user;
      
      const { password: _, ...safeUser } = userToReturn;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/change-password", async (req, res) => {
    try {
      const { userId, currentPassword, newPassword } = req.body;
      
      if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ error: "All fields are required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatedUser = await storage.updateUser(userId, {
        password: hashedPassword,
        mustChangePassword: false,
      });
      
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update password" });
      }
      
      const { password: _, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Failed to change password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const targetUserId = req.params.id;
      const requesterId = req.query.requesterId as string | undefined;
      
      console.log("Updating user:", targetUserId, "with data:", JSON.stringify(req.body).substring(0, 200));
      
      // Authorization check: requesterId is required for all updates
      if (!requesterId) {
        return res.status(400).json({ error: "requesterId is required" });
      }
      
      // If updating someone else's profile, verify authorization
      if (requesterId !== targetUserId) {
        const requester = await storage.getUser(requesterId);
        if (!requester) {
          return res.status(403).json({ error: "Invalid requester" });
        }
        
        // Supporters can only edit athletes they manage
        if (requester.role === 'supporter') {
          const managesAthlete = await storage.supporterManagesAthlete(requesterId, targetUserId);
          if (!managesAthlete) {
            return res.status(403).json({ error: "You can only edit athletes you manage" });
          }
        } else {
          // Non-supporters cannot edit other users (except coaches/staff which could be added later)
          return res.status(403).json({ error: "Unauthorized to edit this user" });
        }
      }
      
      const user = await storage.updateUser(targetUserId, req.body);
      if (!user) {
        console.log("User not found:", targetUserId);
        return res.status(404).json({ error: "User not found" });
      }
      console.log("User updated successfully:", user.id);
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Failed to update user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const coachTeams = await storage.getTeamsByCoach(userId);
      if (coachTeams.length > 0) {
        return res.status(400).json({ error: "Cannot delete user with existing teams" });
      }
      await storage.deleteUser(userId);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      const { coachId, ...teamData } = req.body;
      if (!coachId) {
        return res.status(400).json({ error: "Coach ID is required" });
      }
      const parsed = insertTeamSchema.parse(teamData);
      const team = await storage.createTeam(parsed, coachId);
      res.json(team);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create team" });
    }
  });

  app.get("/api/teams/code/:code", async (req, res) => {
    try {
      const team = await storage.getTeamByCode(req.params.code);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to get team" });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const team = await storage.getTeam(req.params.id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to get team" });
    }
  });

  app.patch("/api/teams/:id", async (req, res) => {
    try {
      const team = await storage.updateTeam(req.params.id, req.body);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to update team" });
    }
  });

  app.get("/api/teams/:id/members", async (req, res) => {
    try {
      const members = await storage.getTeamMembers(req.params.id);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to get team members" });
    }
  });

  app.post("/api/teams/:id/join", async (req, res) => {
    try {
      const { userId, role } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const team = await storage.getTeam(req.params.id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      const member = await storage.addTeamMember({
        teamId: req.params.id,
        userId,
        role: role || "athlete"
      });
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: "Failed to join team" });
    }
  });

  app.post("/api/teams/join-by-code", async (req, res) => {
    try {
      const { code, userId, role } = req.body;
      if (!code || !userId) {
        return res.status(400).json({ error: "Code and user ID are required" });
      }
      
      const team = await storage.getTeamByCode(code);
      if (!team) {
        return res.status(404).json({ error: "Invalid team code" });
      }

      const member = await storage.addTeamMember({
        teamId: team.id,
        userId,
        role: role || "supporter"
      });
      
      res.json({ team, member });
    } catch (error) {
      res.status(500).json({ error: "Failed to join team" });
    }
  });

  app.patch("/api/teams/:teamId/members/:userId", async (req, res) => {
    try {
      const { teamId, userId } = req.params;
      const requesterId = req.query.requesterId as string | undefined;
      
      if (!requesterId) {
        return res.status(400).json({ error: "requesterId is required" });
      }
      
      // Authorization: verify requester belongs to this team and has coach/staff role
      const requesterMembership = await storage.getTeamMembership(teamId, requesterId);
      const team = await storage.getTeam(teamId);
      
      // Requester must be a member of this team
      if (!requesterMembership && team?.coachId !== requesterId) {
        return res.status(403).json({ error: "You are not a member of this team" });
      }
      
      const isCoach = team?.coachId === requesterId;
      const isStaff = requesterMembership?.role === 'staff';
      
      if (!isCoach && !isStaff) {
        return res.status(403).json({ error: "Only coaches and staff can manage team members" });
      }
      
      // Prevent demoting the team coach
      if (team?.coachId === userId && req.body.role && req.body.role !== 'coach') {
        return res.status(400).json({ error: "Cannot change the team coach's role" });
      }
      
      // Staff members can only toggle between 'athlete' and 'staff' roles, not promote to 'coach'
      if (isStaff && !isCoach && req.body.role === 'coach') {
        return res.status(403).json({ error: "Only the coach can assign the coach role" });
      }
      
      const parsed = updateTeamMemberSchema.parse(req.body);
      const member = await storage.updateTeamMember(teamId, userId, parsed);
      
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      
      res.json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Failed to update team member:", error);
      res.status(500).json({ error: "Failed to update team member" });
    }
  });

  app.delete("/api/teams/:teamId/members/:userId", async (req, res) => {
    try {
      const { teamId, userId } = req.params;
      const requesterId = req.query.requesterId as string | undefined;
      
      if (!requesterId) {
        return res.status(400).json({ error: "requesterId is required" });
      }
      
      // Authorization: verify requester belongs to this team and has coach/staff role
      const requesterMembership = await storage.getTeamMembership(teamId, requesterId);
      const team = await storage.getTeam(teamId);
      
      // Requester must be a member of this team
      if (!requesterMembership && team?.coachId !== requesterId) {
        return res.status(403).json({ error: "You are not a member of this team" });
      }
      
      const isCoach = team?.coachId === requesterId;
      const isStaff = requesterMembership?.role === 'staff';
      
      if (!isCoach && !isStaff) {
        return res.status(403).json({ error: "Only coaches and staff can remove team members" });
      }
      
      // Prevent removing the team coach
      if (team?.coachId === userId) {
        return res.status(400).json({ error: "Cannot remove the team coach" });
      }
      
      await storage.removeTeamMember(teamId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to remove team member:", error);
      res.status(500).json({ error: "Failed to remove team member" });
    }
  });

  app.get("/api/users/:id/teams", async (req, res) => {
    try {
      const teams = await storage.getUserTeams(req.params.id);
      res.json(teams);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user teams" });
    }
  });

  app.get("/api/coach/:coachId/teams", async (req, res) => {
    try {
      const teams = await storage.getTeamsByCoach(req.params.coachId);
      res.json(teams);
    } catch (error) {
      res.status(500).json({ error: "Failed to get coach teams" });
    }
  });

  // Admin routes
  app.get("/api/admin/teams", async (req, res) => {
    try {
      const allTeams = await storage.getAllTeams();
      const teamsWithMembers = await Promise.all(
        allTeams.map(async (team) => {
          const members = await storage.getTeamMembers(team.id);
          let safeCoach = null;
          if (team.coachId) {
            const coach = await storage.getUser(team.coachId);
            if (coach) {
              const { password: _, ...rest } = coach;
              safeCoach = rest;
            }
          }
          return { ...team, members, coach: safeCoach };
        })
      );
      res.json(teamsWithMembers);
    } catch (error) {
      console.error("Failed to get all teams:", error);
      res.status(500).json({ error: "Failed to get all teams" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const safeUsers = allUsers.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Failed to get all users:", error);
      res.status(500).json({ error: "Failed to get all users" });
    }
  });

  app.post("/api/admin/teams/:teamId/members", async (req, res) => {
    try {
      const { teamId } = req.params;
      const { userId, role } = req.body;
      
      if (!userId || !role) {
        return res.status(400).json({ error: "userId and role are required" });
      }
      
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      const existingMember = await storage.getTeamMembership(teamId, userId);
      if (existingMember) {
        return res.status(400).json({ error: "User is already a member of this team" });
      }
      
      const member = await storage.addTeamMember({
        teamId,
        userId,
        role,
      });
      
      res.json(member);
    } catch (error) {
      console.error("Failed to add team member:", error);
      res.status(500).json({ error: "Failed to add team member" });
    }
  });

  app.delete("/api/admin/teams/:teamId/members/:userId", async (req, res) => {
    try {
      const { teamId, userId } = req.params;
      
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      if (team.coachId === userId) {
        return res.status(400).json({ error: "Cannot remove the team coach" });
      }
      
      await storage.removeTeamMember(teamId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to remove team member:", error);
      res.status(500).json({ error: "Failed to remove team member" });
    }
  });

  app.post("/api/admin/teams/:teamId/create-member", async (req, res) => {
    try {
      const { teamId } = req.params;
      const { firstName, lastName, email, role } = req.body;
      
      if (!firstName || !lastName || !email || !role) {
        return res.status(400).json({ error: "First name, last name, email, and role are required" });
      }
      
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "A user with this email already exists" });
      }
      
      const username = email.split("@")[0] + "_" + Date.now().toString(36);
      const tempPassword = "Welcome123!";
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        firstName,
        lastName,
        email,
        name: `${firstName} ${lastName}`,
        role,
        mustChangePassword: true,
      });
      
      await storage.addTeamMember({
        teamId,
        userId: newUser.id,
        role,
      });
      
      const { password: _, ...safeUser } = newUser;
      res.json({ user: safeUser, tempPassword });
    } catch (error) {
      console.error("Failed to create team member:", error);
      res.status(500).json({ error: "Failed to create team member" });
    }
  });

  app.get("/api/teams/:teamId/events", async (req, res) => {
    try {
      const events = await storage.getTeamEvents(req.params.teamId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to get team events" });
    }
  });

  app.post("/api/teams/:teamId/events", async (req, res) => {
    try {
      const parsed = insertEventSchema.parse({
        ...req.body,
        teamId: req.params.teamId,
        date: new Date(req.body.date),
        endDate: req.body.endDate ? new Date(req.body.endDate) : null
      });
      const event = await storage.createEvent(parsed);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.patch("/api/events/:eventId", async (req, res) => {
    try {
      const data: Record<string, unknown> = { ...req.body };
      if (data.date) data.date = new Date(data.date as string);
      if (data.endDate) data.endDate = new Date(data.endDate as string);
      
      const parsed = updateEventSchema.parse(data);
      const event = await storage.updateEvent(req.params.eventId, parsed);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/events/:eventId", async (req, res) => {
    try {
      await storage.deleteEvent(req.params.eventId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // Plays CRUD routes
  app.get("/api/teams/:teamId/plays", async (req, res) => {
    try {
      const plays = await storage.getTeamPlays(req.params.teamId);
      res.json(plays);
    } catch (error) {
      res.status(500).json({ error: "Failed to get plays" });
    }
  });

  app.post("/api/teams/:teamId/plays", async (req, res) => {
    try {
      const { userId, ...playData } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Validate user is team member with coach or staff role
      const membership = await storage.getTeamMembership(req.params.teamId, userId);
      if (!membership || (membership.role !== "coach" && membership.role !== "staff")) {
        return res.status(403).json({ error: "Only coaches and staff can create plays" });
      }
      
      // Validate category value
      const validCategories = ["Offense", "Defense", "Special"];
      if (playData.category && !validCategories.includes(playData.category)) {
        return res.status(400).json({ error: "Invalid category value" });
      }
      
      const parsed = insertPlaySchema.parse({
        ...playData,
        teamId: req.params.teamId,
        createdById: userId,
      });
      const play = await storage.createPlay(parsed);
      res.json(play);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create play" });
    }
  });

  app.patch("/api/plays/:playId", async (req, res) => {
    try {
      const { userId, ...updateData } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const play = await storage.getPlay(req.params.playId);
      if (!play) {
        return res.status(404).json({ error: "Play not found" });
      }
      
      // Validate user is team member with coach or staff role
      const membership = await storage.getTeamMembership(play.teamId, userId);
      if (!membership || (membership.role !== "coach" && membership.role !== "staff")) {
        return res.status(403).json({ error: "Only coaches and staff can edit plays" });
      }
      
      // Validate status value if provided
      const validStatuses = ["Successful", "Not Successful", "Needs Work"];
      if (updateData.status && !validStatuses.includes(updateData.status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      
      const parsed = updatePlaySchema.parse(updateData);
      const updatedPlay = await storage.updatePlay(req.params.playId, parsed);
      res.json(updatedPlay);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update play" });
    }
  });

  app.delete("/api/plays/:playId", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const play = await storage.getPlay(req.params.playId);
      if (!play) {
        return res.status(404).json({ error: "Play not found" });
      }
      
      // Validate user is team member with coach or staff role
      const membership = await storage.getTeamMembership(play.teamId, userId);
      if (!membership || (membership.role !== "coach" && membership.role !== "staff")) {
        return res.status(403).json({ error: "Only coaches and staff can delete plays" });
      }
      
      await storage.deletePlay(req.params.playId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete play" });
    }
  });

  // Register object storage routes
  registerObjectStorageRoutes(app);

  // Video upload request - validates size and creates database record
  app.post("/api/teams/:teamId/highlights/request-upload", async (req, res) => {
    try {
      const { userId, fileName, fileSize, contentType } = req.body;
      const teamId = req.params.teamId;

      if (!userId || !fileName || !fileSize) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate file size (100MB max)
      if (fileSize > MAX_VIDEO_SIZE) {
        return res.status(400).json({ error: "File too large. Maximum size is 100MB" });
      }

      // Validate user is team member
      const membership = await storage.getTeamMembership(teamId, userId);
      if (!membership) {
        return res.status(403).json({ error: "Not a team member" });
      }

      // Get upload URL from object storage
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      // Create highlight video record with queued status
      const video = await storage.createHighlightVideo({
        teamId,
        uploaderId: userId,
        title: fileName,
        originalKey: objectPath,
        status: "queued",
        fileSizeBytes: fileSize,
      });

      res.json({
        uploadURL,
        objectPath,
        videoId: video.id,
      });
    } catch (error) {
      console.error("Error requesting video upload:", error);
      res.status(500).json({ error: "Failed to request upload" });
    }
  });

  // Mark video upload complete and start transcoding
  app.post("/api/highlights/:videoId/complete-upload", async (req, res) => {
    try {
      const video = await storage.getHighlightVideo(req.params.videoId);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      // Update status to processing
      await storage.updateHighlightVideo(video.id, { status: "processing" });

      // Start async transcoding
      transcodeVideo(video.id, video.originalKey!);

      res.json({ success: true, status: "processing" });
    } catch (error) {
      console.error("Error completing upload:", error);
      res.status(500).json({ error: "Failed to complete upload" });
    }
  });

  // Get team highlight videos (only ready ones for non-coaches)
  app.get("/api/teams/:teamId/highlights", async (req, res) => {
    try {
      const videos = await storage.getTeamHighlightVideos(req.params.teamId);
      // Filter to only ready videos for public display
      const readyVideos = videos.filter(v => v.status === "ready");
      res.json(readyVideos);
    } catch (error) {
      res.status(500).json({ error: "Failed to get highlights" });
    }
  });

  // Get all team highlight videos (including pending/processing for coaches)
  app.get("/api/teams/:teamId/highlights/all", async (req, res) => {
    try {
      const videos = await storage.getTeamHighlightVideos(req.params.teamId);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: "Failed to get highlights" });
    }
  });

  // Delete highlight video (owner, coach, or staff only)
  // NOTE: This relies on client-provided userId. In production, use session-based auth
  // to prevent userId spoofing. Current implementation is suitable for trusted environments only.
  app.delete("/api/highlights/:videoId", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      // Verify the user exists in the database
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "Invalid user" });
      }

      const video = await storage.getHighlightVideo(req.params.videoId);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      // Check authorization: owner, coach, or staff
      const membership = await storage.getTeamMembership(video.teamId, userId);
      const isOwner = video.uploaderId === userId;
      const isCoachOrStaff = membership && (membership.role === "coach" || membership.role === "staff");

      if (!isOwner && !isCoachOrStaff) {
        return res.status(403).json({ error: "Not authorized to delete this video" });
      }

      // Delete from storage first
      try {
        if (video.processedKey) {
          const processedFile = await objectStorageService.getObjectEntityFile(video.processedKey);
          await processedFile.delete();
        }
        if (video.thumbnailKey) {
          const thumbnailFile = await objectStorageService.getObjectEntityFile(video.thumbnailKey);
          await thumbnailFile.delete();
        }
        if (video.originalKey) {
          const originalFile = await objectStorageService.getObjectEntityFile(video.originalKey);
          await originalFile.delete();
        }
      } catch (storageError) {
        console.error("Error deleting files from storage:", storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // Delete from database
      await storage.deleteHighlightVideo(video.id);

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting video:", error);
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  // Get managed athletes for a supporter
  app.get("/api/users/:supporterId/managed-athletes", async (req, res) => {
    try {
      const managedAthletes = await storage.getManagedAthletes(req.params.supporterId);
      res.json(managedAthletes);
    } catch (error) {
      console.error("Error getting managed athletes:", error);
      res.status(500).json({ error: "Failed to get managed athletes" });
    }
  });

  // Create a managed athlete (supporter creates athlete account and adds to team)
  app.post("/api/users/:supporterId/managed-athletes", async (req, res) => {
    try {
      const { teamCode, firstName, lastName } = req.body;
      
      if (!teamCode || !firstName || !lastName) {
        return res.status(400).json({ error: "Team code, first name, and last name are required" });
      }

      // Verify supporter exists
      const supporter = await storage.getUser(req.params.supporterId);
      if (!supporter || supporter.role !== "supporter") {
        return res.status(403).json({ error: "Only supporters can manage athletes" });
      }

      // Find team by code
      const team = await storage.getTeamByCode(teamCode);
      if (!team) {
        return res.status(404).json({ error: "Team not found with that code" });
      }

      // Create athlete user account (no login credentials - managed by supporter)
      const username = `managed_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const athlete = await storage.createUser({
        username,
        password: "", // No password - can't log in directly
        role: "athlete",
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email: "",
      });

      // Add athlete to team roster
      await storage.addTeamMember({
        teamId: team.id,
        userId: athlete.id,
        role: "athlete",
      });

      // Create managed athlete relationship
      const managed = await storage.createManagedAthlete({
        supporterId: req.params.supporterId,
        athleteId: athlete.id,
      });

      res.json({ ...managed, athlete, team });
    } catch (error) {
      console.error("Error creating managed athlete:", error);
      res.status(500).json({ error: "Failed to create managed athlete" });
    }
  });

  // Delete a managed athlete
  app.delete("/api/managed-athletes/:id", async (req, res) => {
    try {
      await storage.deleteManagedAthlete(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting managed athlete:", error);
      res.status(500).json({ error: "Failed to delete managed athlete" });
    }
  });

  // ================== StatTracker Routes ==================

  // Games
  app.get("/api/teams/:teamId/games", async (req, res) => {
    try {
      let games = await storage.getTeamGames(req.params.teamId);
      const status = req.query.status as string | undefined;
      if (status) {
        games = games.filter(g => g.status === status);
      }
      res.json(games);
    } catch (error) {
      console.error("Error getting games:", error);
      res.status(500).json({ error: "Failed to get games" });
    }
  });

  // Get aggregated team stats from all completed games
  app.get("/api/teams/:teamId/stats/aggregate", async (req, res) => {
    try {
      const stats = await storage.getTeamAggregateStats(req.params.teamId);
      res.json(stats);
    } catch (error) {
      console.error("Error getting aggregate stats:", error);
      res.status(500).json({ error: "Failed to get aggregate stats" });
    }
  });

  app.get("/api/teams/:teamId/stats/advanced", async (req, res) => {
    try {
      const stats = await storage.getAdvancedTeamStats(req.params.teamId);
      res.json(stats);
    } catch (error) {
      console.error("Error getting advanced stats:", error);
      res.status(500).json({ error: "Failed to get advanced stats" });
    }
  });

  app.get("/api/teams/:teamId/athletes/:athleteId/stats", async (req, res) => {
    try {
      const stats = await storage.getAthleteStats(req.params.teamId, req.params.athleteId);
      res.json(stats);
    } catch (error) {
      console.error("Error getting athlete stats:", error);
      res.status(500).json({ error: "Failed to get athlete stats" });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const game = await storage.getGame(req.params.id);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      console.error("Error getting game:", error);
      res.status(500).json({ error: "Failed to get game" });
    }
  });

  app.get("/api/events/:eventId/game", async (req, res) => {
    try {
      const game = await storage.getGameByEvent(req.params.eventId);
      res.json(game || null);
    } catch (error) {
      console.error("Error getting game by event:", error);
      res.status(500).json({ error: "Failed to get game" });
    }
  });

  app.post("/api/teams/:teamId/games", async (req, res) => {
    try {
      const requesterId = req.query.requesterId as string;
      if (!requesterId) {
        return res.status(400).json({ error: "requesterId is required" });
      }

      const membership = await storage.getTeamMembership(req.params.teamId, requesterId);
      if (!membership || (membership.role !== "coach" && membership.role !== "staff")) {
        return res.status(403).json({ error: "Only coaches and staff can create games" });
      }

      const parsed = insertGameSchema.parse({ ...req.body, teamId: req.params.teamId });
      const game = await storage.createGame(parsed);
      res.json(game);
    } catch (error: any) {
      console.error("Error creating game:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create game" });
    }
  });

  app.patch("/api/games/:id", async (req, res) => {
    try {
      const requesterId = req.query.requesterId as string;
      if (!requesterId) {
        return res.status(400).json({ error: "requesterId is required" });
      }

      const game = await storage.getGame(req.params.id);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      const membership = await storage.getTeamMembership(game.teamId, requesterId);
      if (!membership || (membership.role !== "coach" && membership.role !== "staff")) {
        return res.status(403).json({ error: "Only coaches and staff can update games" });
      }

      const body = { ...req.body };
      if (body.startedAt && typeof body.startedAt === 'string') {
        body.startedAt = new Date(body.startedAt);
      }
      if (body.endedAt && typeof body.endedAt === 'string') {
        body.endedAt = new Date(body.endedAt);
      }
      const parsed = updateGameSchema.parse(body);
      const updatedGame = await storage.updateGame(req.params.id, parsed);
      res.json(updatedGame);
    } catch (error: any) {
      console.error("Error updating game:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update game" });
    }
  });

  app.delete("/api/games/:id", async (req, res) => {
    try {
      const requesterId = req.query.requesterId as string;
      if (!requesterId) {
        return res.status(400).json({ error: "requesterId is required" });
      }

      const game = await storage.getGame(req.params.id);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      const membership = await storage.getTeamMembership(game.teamId, requesterId);
      if (!membership || (membership.role !== "coach" && membership.role !== "staff")) {
        return res.status(403).json({ error: "Only coaches and staff can delete games" });
      }

      await storage.deleteGame(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting game:", error);
      res.status(500).json({ error: "Failed to delete game" });
    }
  });

  // Stat Configurations
  app.get("/api/teams/:teamId/stat-configs", async (req, res) => {
    try {
      const configs = await storage.getTeamStatConfigs(req.params.teamId);
      res.json(configs);
    } catch (error) {
      console.error("Error getting stat configs:", error);
      res.status(500).json({ error: "Failed to get stat configurations" });
    }
  });

  app.post("/api/teams/:teamId/stat-configs", async (req, res) => {
    try {
      const requesterId = req.query.requesterId as string;
      if (!requesterId) {
        return res.status(400).json({ error: "requesterId is required" });
      }

      const membership = await storage.getTeamMembership(req.params.teamId, requesterId);
      if (!membership || (membership.role !== "coach" && membership.role !== "staff")) {
        return res.status(403).json({ error: "Only coaches and staff can configure stats" });
      }

      const parsed = insertStatConfigSchema.parse({ ...req.body, teamId: req.params.teamId });
      const config = await storage.createStatConfig(parsed);
      res.json(config);
    } catch (error: any) {
      console.error("Error creating stat config:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create stat configuration" });
    }
  });

  app.patch("/api/stat-configs/:id", async (req, res) => {
    try {
      const requesterId = req.query.requesterId as string;
      if (!requesterId) {
        return res.status(400).json({ error: "requesterId is required" });
      }

      const config = await storage.getStatConfig(req.params.id);
      if (!config) {
        return res.status(404).json({ error: "Stat configuration not found" });
      }

      const membership = await storage.getTeamMembership(config.teamId, requesterId);
      if (!membership || (membership.role !== "coach" && membership.role !== "staff")) {
        return res.status(403).json({ error: "Only coaches and staff can update stat configurations" });
      }

      const parsed = updateStatConfigSchema.parse(req.body);
      const updatedConfig = await storage.updateStatConfig(req.params.id, parsed);
      res.json(updatedConfig);
    } catch (error: any) {
      console.error("Error updating stat config:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update stat configuration" });
    }
  });

  app.delete("/api/stat-configs/:id", async (req, res) => {
    try {
      const requesterId = req.query.requesterId as string;
      if (!requesterId) {
        return res.status(400).json({ error: "requesterId is required" });
      }

      const config = await storage.getStatConfig(req.params.id);
      if (!config) {
        return res.status(404).json({ error: "Stat configuration not found" });
      }

      const membership = await storage.getTeamMembership(config.teamId, requesterId);
      if (!membership || (membership.role !== "coach" && membership.role !== "staff")) {
        return res.status(403).json({ error: "Only coaches and staff can delete stat configurations" });
      }

      await storage.deleteStatConfig(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting stat config:", error);
      res.status(500).json({ error: "Failed to delete stat configuration" });
    }
  });

  // Game Stats
  app.get("/api/games/:gameId/stats", async (req, res) => {
    try {
      const stats = await storage.getGameStats(req.params.gameId);
      res.json(stats);
    } catch (error) {
      console.error("Error getting game stats:", error);
      res.status(500).json({ error: "Failed to get game stats" });
    }
  });

  app.post("/api/games/:gameId/stats", async (req, res) => {
    try {
      const requesterId = req.query.requesterId as string;
      if (!requesterId) {
        return res.status(400).json({ error: "requesterId is required" });
      }

      const game = await storage.getGame(req.params.gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      const membership = await storage.getTeamMembership(game.teamId, requesterId);
      if (!membership || (membership.role !== "coach" && membership.role !== "staff")) {
        return res.status(403).json({ error: "Only coaches and staff can record stats" });
      }

      const parsed = insertGameStatSchema.parse({ 
        ...req.body, 
        gameId: req.params.gameId,
        recordedById: requesterId 
      });
      const stat = await storage.createGameStat(parsed);

      // Auto-update team score if stat has point value
      if (parsed.pointsValue && parsed.pointsValue > 0) {
        await storage.updateGame(req.params.gameId, {
          teamScore: game.teamScore + parsed.pointsValue
        });
      }

      res.json(stat);
    } catch (error: any) {
      console.error("Error recording stat:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to record stat" });
    }
  });

  app.delete("/api/game-stats/:id", async (req, res) => {
    try {
      const requesterId = req.query.requesterId as string;
      const hardDelete = req.query.hard === "true";
      
      if (!requesterId) {
        return res.status(400).json({ error: "requesterId is required" });
      }

      // Soft delete by default for corrections
      if (hardDelete) {
        await storage.deleteGameStat(req.params.id);
      } else {
        await storage.softDeleteGameStat(req.params.id);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting stat:", error);
      res.status(500).json({ error: "Failed to delete stat" });
    }
  });

  // Game Roster
  app.get("/api/games/:gameId/roster", async (req, res) => {
    try {
      const roster = await storage.getGameRoster(req.params.gameId);
      res.json(roster);
    } catch (error) {
      console.error("Error getting game roster:", error);
      res.status(500).json({ error: "Failed to get game roster" });
    }
  });

  app.post("/api/games/:gameId/roster", async (req, res) => {
    try {
      const requesterId = req.query.requesterId as string;
      if (!requesterId) {
        return res.status(400).json({ error: "requesterId is required" });
      }

      const game = await storage.getGame(req.params.gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      const membership = await storage.getTeamMembership(game.teamId, requesterId);
      if (!membership || (membership.role !== "coach" && membership.role !== "staff")) {
        return res.status(403).json({ error: "Only coaches and staff can manage game roster" });
      }

      const parsed = insertGameRosterSchema.parse({ ...req.body, gameId: req.params.gameId });
      const rosterEntry = await storage.createGameRoster(parsed);
      res.json(rosterEntry);
    } catch (error: any) {
      console.error("Error adding to game roster:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add to game roster" });
    }
  });

  app.patch("/api/game-roster/:id", async (req, res) => {
    try {
      const requesterId = req.query.requesterId as string;
      if (!requesterId) {
        return res.status(400).json({ error: "requesterId is required" });
      }

      const parsed = updateGameRosterSchema.parse(req.body);
      const rosterEntry = await storage.updateGameRoster(req.params.id, parsed);
      res.json(rosterEntry);
    } catch (error: any) {
      console.error("Error updating game roster:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update game roster" });
    }
  });

  app.delete("/api/game-roster/:id", async (req, res) => {
    try {
      await storage.deleteGameRoster(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing from game roster:", error);
      res.status(500).json({ error: "Failed to remove from game roster" });
    }
  });

  // Bulk create game roster from team members
  app.post("/api/games/:gameId/roster/bulk", async (req, res) => {
    try {
      const requesterId = req.query.requesterId as string;
      if (!requesterId) {
        return res.status(400).json({ error: "requesterId is required" });
      }

      const game = await storage.getGame(req.params.gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      const membership = await storage.getTeamMembership(game.teamId, requesterId);
      if (!membership || (membership.role !== "coach" && membership.role !== "staff")) {
        return res.status(403).json({ error: "Only coaches and staff can manage game roster" });
      }

      // Get all team athletes
      const teamMembers = await storage.getTeamMembers(game.teamId);
      const athletes = teamMembers.filter(m => m.role === "athlete" || m.role === "staff");

      const createdRoster = [];
      for (const member of athletes) {
        const existing = (await storage.getGameRoster(req.params.gameId)).find(
          r => r.athleteId === member.userId
        );
        if (!existing) {
          const rosterEntry = await storage.createGameRoster({
            gameId: req.params.gameId,
            athleteId: member.userId,
            jerseyNumber: member.jerseyNumber || undefined,
            positions: member.position ? [member.position] : [],
            isInGame: false,
          });
          createdRoster.push(rosterEntry);
        }
      }

      res.json(createdRoster);
    } catch (error) {
      console.error("Error bulk creating game roster:", error);
      res.status(500).json({ error: "Failed to create game roster" });
    }
  });

  // Starting Lineup routes
  app.get("/api/events/:eventId/lineup", async (req, res) => {
    try {
      const lineup = await storage.getStartingLineupByEvent(req.params.eventId);
      res.json(lineup || null);
    } catch (error) {
      console.error("Error getting starting lineup:", error);
      res.status(500).json({ error: "Failed to get starting lineup" });
    }
  });

  app.post("/api/events/:eventId/lineup", async (req, res) => {
    try {
      const requesterId = req.query.requesterId as string;
      if (!requesterId) {
        return res.status(400).json({ error: "requesterId is required" });
      }

      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const membership = await storage.getTeamMembership(event.teamId, requesterId);
      if (!membership || (membership.role !== "coach" && membership.role !== "staff")) {
        return res.status(403).json({ error: "Only coaches and staff can create lineups" });
      }

      // Check if lineup already exists
      const existing = await storage.getStartingLineupByEvent(req.params.eventId);
      if (existing) {
        return res.status(400).json({ error: "Lineup already exists for this event. Use PUT to update." });
      }

      const lineup = await storage.createStartingLineup({
        eventId: req.params.eventId,
        teamId: event.teamId,
        createdById: requesterId,
        notes: req.body.notes,
      });

      // Add players if provided
      if (req.body.players && Array.isArray(req.body.players)) {
        const players = req.body.players.map((p: any, index: number) => ({
          lineupId: lineup.id,
          teamMemberId: p.teamMemberId,
          positionOverride: p.positionOverride,
          orderIndex: p.orderIndex ?? index,
          isStarter: p.isStarter ?? true,
        }));
        await storage.setStartingLineupPlayers(lineup.id, players);
      }

      const fullLineup = await storage.getStartingLineupByEvent(req.params.eventId);
      res.json(fullLineup);
    } catch (error: any) {
      console.error("Error creating starting lineup:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create starting lineup" });
    }
  });

  app.put("/api/events/:eventId/lineup", async (req, res) => {
    try {
      const requesterId = req.query.requesterId as string;
      if (!requesterId) {
        return res.status(400).json({ error: "requesterId is required" });
      }

      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const membership = await storage.getTeamMembership(event.teamId, requesterId);
      if (!membership || (membership.role !== "coach" && membership.role !== "staff")) {
        return res.status(403).json({ error: "Only coaches and staff can update lineups" });
      }

      let lineup = await storage.getStartingLineupByEvent(req.params.eventId);
      
      if (!lineup) {
        // Create new lineup
        const newLineup = await storage.createStartingLineup({
          eventId: req.params.eventId,
          teamId: event.teamId,
          createdById: requesterId,
          notes: req.body.notes,
        });
        lineup = { ...newLineup, players: [] };
      } else {
        // Update existing
        await storage.updateStartingLineup(lineup.id, { notes: req.body.notes });
      }

      // Update players
      if (req.body.players && Array.isArray(req.body.players)) {
        const players = req.body.players.map((p: any, index: number) => ({
          lineupId: lineup!.id,
          teamMemberId: p.teamMemberId,
          positionOverride: p.positionOverride,
          orderIndex: p.orderIndex ?? index,
          isStarter: p.isStarter ?? true,
        }));
        await storage.setStartingLineupPlayers(lineup.id, players);
      }

      const fullLineup = await storage.getStartingLineupByEvent(req.params.eventId);
      res.json(fullLineup);
    } catch (error: any) {
      console.error("Error updating starting lineup:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update starting lineup" });
    }
  });

  app.delete("/api/events/:eventId/lineup", async (req, res) => {
    try {
      const requesterId = req.query.requesterId as string;
      if (!requesterId) {
        return res.status(400).json({ error: "requesterId is required" });
      }

      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const membership = await storage.getTeamMembership(event.teamId, requesterId);
      if (!membership || (membership.role !== "coach" && membership.role !== "staff")) {
        return res.status(403).json({ error: "Only coaches and staff can delete lineups" });
      }

      const lineup = await storage.getStartingLineupByEvent(req.params.eventId);
      if (lineup) {
        await storage.deleteStartingLineup(lineup.id);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting starting lineup:", error);
      res.status(500).json({ error: "Failed to delete starting lineup" });
    }
  });

  // ============ PUBLIC ATHLETE PROFILE ============

  // Dynamic PWA manifest for athlete HYPE cards
  app.get("/api/athletes/:athleteId/manifest.json", async (req, res) => {
    try {
      const athleteId = req.params.athleteId;
      
      // Get athlete data
      const athlete = await storage.getUser(athleteId);
      if (!athlete) {
        return res.status(404).json({ error: "Athlete not found" });
      }
      
      // Get team info for sport
      const memberships = await storage.getUserTeamMemberships(athleteId);
      const membership = memberships.length > 0 ? memberships[0] : null;
      let teamName = "";
      if (membership) {
        const team = await storage.getTeam(membership.teamId.toString());
        teamName = team?.name || "";
      }
      
      const athleteName = athlete.name || athlete.username;
      const appName = `${athleteName} HYPE`;
      const shortName = athleteName.substring(0, 12);
      const description = teamName 
        ? `Follow ${athleteName} from ${teamName} - Get updates and show your support!`
        : `Follow ${athleteName} - Get updates and show your support!`;
      
      // Build the manifest
      const manifest = {
        name: appName,
        short_name: shortName,
        description: description,
        start_url: `/share/athlete/${athleteId}`,
        scope: `/share/athlete/${athleteId}`,
        display: "standalone",
        orientation: "portrait",
        theme_color: "#f97316",
        background_color: "#0a0a0a",
        icons: [
          {
            src: athlete.avatar || "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: athlete.avatar || "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        categories: ["sports", "social"],
        lang: "en"
      };
      
      res.setHeader("Content-Type", "application/manifest+json");
      res.json(manifest);
    } catch (error) {
      console.error("Error generating athlete manifest:", error);
      res.status(500).json({ error: "Failed to generate manifest" });
    }
  });
  
  app.get("/api/athletes/:athleteId/public-profile", async (req, res) => {
    try {
      const athleteId = req.params.athleteId;
      
      // Get athlete user data
      const athlete = await storage.getUser(athleteId);
      if (!athlete || athlete.role !== 'athlete') {
        return res.status(404).json({ error: "Athlete not found" });
      }
      
      // Get team membership (first team found)
      const memberships = await storage.getUserTeamMemberships(athleteId);
      const membership = memberships.length > 0 ? memberships[0] : null;
      
      // Get team info if membership exists
      let membershipWithTeam = null;
      if (membership) {
        const team = await storage.getTeam(membership.teamId.toString());
        membershipWithTeam = {
          ...membership,
          team: team ? { id: team.id, name: team.name, sport: team.sport } : null
        };
      }
      
      // Get athlete stats
      let stats: any = { gamesPlayed: 0, stats: {}, gameHistory: [], hotStreak: false, streakLength: 0 };
      if (membership) {
        try {
          stats = await storage.getAthleteStats(membership.teamId.toString(), athleteId);
        } catch (e) {
          // Stats might not exist, use defaults
        }
      }
      
      // Get athlete highlights (only public metadata - no video URLs)
      let highlights: any[] = [];
      if (membership) {
        try {
          const allHighlights = await storage.getTeamHighlightVideos(membership.teamId.toString());
          highlights = allHighlights
            .filter((h: any) => h.uploaderId === parseInt(athleteId))
            .slice(0, 4)
            .map((h: any) => ({
              id: h.id,
              title: h.title,
              thumbnail: h.thumbnail,
              // Intentionally omit videoUrl for public profile
            }));
        } catch (e) {
          // Highlights might not exist
        }
      }
      
      // Get shoutouts
      const shoutouts = await storage.getAthleteShoutouts(athleteId, 20);
      const shoutoutCount = await storage.getAthleteShoutoutCount(athleteId);
      
      // Return public profile data (no private team info like roster, plays, chat)
      res.json({
        athlete: {
          id: athlete.id,
          username: athlete.username,
          name: athlete.name,
          avatar: athlete.avatar,
          role: athlete.role
        },
        membership: membershipWithTeam,
        stats,
        highlights,
        shoutouts,
        shoutoutCount
      });
    } catch (error) {
      console.error("Error getting public athlete profile:", error);
      res.status(500).json({ error: "Failed to get athlete profile" });
    }
  });

  // Get profile likes count and list
  app.get("/api/athletes/:athleteId/profile-likes", async (req, res) => {
    try {
      const athleteId = req.params.athleteId;
      const athlete = await storage.getUser(athleteId);
      if (!athlete || athlete.role !== 'athlete') {
        return res.status(404).json({ error: "Athlete not found" });
      }
      
      const likes = await storage.getProfileLikes(athleteId);
      const count = await storage.getProfileLikeCount(athleteId);
      res.json({ likes, count });
    } catch (error) {
      console.error("Error getting profile likes:", error);
      res.status(500).json({ error: "Failed to get profile likes" });
    }
  });

  // Add a like to athlete profile (public - no auth required)
  app.post("/api/athletes/:athleteId/profile-likes", async (req, res) => {
    try {
      const athleteId = req.params.athleteId;
      
      // Validate with Zod schema
      const parsed = insertProfileLikeSchema.parse({
        athleteId,
        visitorName: req.body.visitorName,
      });
      
      if (!parsed.visitorName || parsed.visitorName.trim().length === 0) {
        return res.status(400).json({ error: "Visitor name is required" });
      }
      
      const athlete = await storage.getUser(athleteId);
      if (!athlete || athlete.role !== 'athlete') {
        return res.status(404).json({ error: "Athlete not found" });
      }
      
      const like = await storage.createProfileLike({
        athleteId: parsed.athleteId,
        visitorName: parsed.visitorName.trim()
      });
      
      res.status(201).json(like);
    } catch (error: any) {
      console.error("Error creating profile like:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add like" });
    }
  });

  // Get profile comments
  app.get("/api/athletes/:athleteId/profile-comments", async (req, res) => {
    try {
      const athleteId = req.params.athleteId;
      const athlete = await storage.getUser(athleteId);
      if (!athlete || athlete.role !== 'athlete') {
        return res.status(404).json({ error: "Athlete not found" });
      }
      
      const comments = await storage.getProfileComments(athleteId);
      res.json(comments);
    } catch (error) {
      console.error("Error getting profile comments:", error);
      res.status(500).json({ error: "Failed to get profile comments" });
    }
  });

  // Add a comment to athlete profile (public - no auth required)
  app.post("/api/athletes/:athleteId/profile-comments", async (req, res) => {
    try {
      const athleteId = req.params.athleteId;
      
      // Validate with Zod schema
      const parsed = insertProfileCommentSchema.parse({
        athleteId,
        visitorName: req.body.visitorName,
        message: req.body.message,
      });
      
      if (!parsed.visitorName || parsed.visitorName.trim().length === 0) {
        return res.status(400).json({ error: "Visitor name is required" });
      }
      if (!parsed.message || parsed.message.trim().length === 0) {
        return res.status(400).json({ error: "Message is required" });
      }
      if (parsed.message.length > 500) {
        return res.status(400).json({ error: "Message too long (max 500 characters)" });
      }
      
      const athlete = await storage.getUser(athleteId);
      if (!athlete || athlete.role !== 'athlete') {
        return res.status(404).json({ error: "Athlete not found" });
      }
      
      const comment = await storage.createProfileComment({
        athleteId: parsed.athleteId,
        visitorName: parsed.visitorName.trim(),
        message: parsed.message.trim()
      });
      
      res.status(201).json(comment);
    } catch (error: any) {
      console.error("Error creating profile comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  // ============ ATHLETE FOLLOWERS ROUTES ============

  // Get follower count for an athlete
  app.get("/api/athletes/:athleteId/followers/count", async (req, res) => {
    try {
      const athleteId = req.params.athleteId;
      const count = await storage.getAthleteFollowerCount(athleteId);
      res.json({ count });
    } catch (error) {
      console.error("Error getting follower count:", error);
      res.status(500).json({ error: "Failed to get follower count" });
    }
  });

  // Check if a token is following an athlete
  app.get("/api/athletes/:athleteId/followers/check", async (req, res) => {
    try {
      const athleteId = req.params.athleteId;
      const fcmToken = req.query.token as string;
      
      if (!fcmToken) {
        return res.json({ isFollowing: false });
      }
      
      const follower = await storage.getAthleteFollowerByToken(athleteId, fcmToken);
      res.json({ isFollowing: !!follower });
    } catch (error) {
      console.error("Error checking follower status:", error);
      res.status(500).json({ error: "Failed to check follower status" });
    }
  });

  // Follow an athlete (public - no auth required)
  app.post("/api/athletes/:athleteId/followers", async (req, res) => {
    try {
      const athleteId = req.params.athleteId;
      
      const athlete = await storage.getUser(athleteId);
      if (!athlete || athlete.role !== 'athlete') {
        return res.status(404).json({ error: "Athlete not found" });
      }
      
      const parsed = insertAthleteFollowerSchema.parse({
        athleteId,
        fcmToken: req.body.fcmToken,
        followerName: req.body.followerName || "Anonymous",
      });
      
      if (!parsed.fcmToken) {
        return res.status(400).json({ error: "FCM token is required" });
      }
      
      const follower = await storage.createAthleteFollower(parsed);
      const count = await storage.getAthleteFollowerCount(athleteId);
      
      res.status(201).json({ follower, count });
    } catch (error: any) {
      console.error("Error following athlete:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to follow athlete" });
    }
  });

  // Unfollow an athlete
  app.delete("/api/athletes/:athleteId/followers", async (req, res) => {
    try {
      const athleteId = req.params.athleteId;
      const fcmToken = req.query.token as string;
      
      if (!fcmToken) {
        return res.status(400).json({ error: "FCM token is required" });
      }
      
      await storage.deleteAthleteFollower(athleteId, fcmToken);
      const count = await storage.getAthleteFollowerCount(athleteId);
      
      res.json({ success: true, count });
    } catch (error) {
      console.error("Error unfollowing athlete:", error);
      res.status(500).json({ error: "Failed to unfollow athlete" });
    }
  });

  // FYR - Send push notification to all athlete followers
  app.post("/api/athletes/:athleteId/fyr", async (req, res) => {
    try {
      const athleteId = req.params.athleteId;
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const athlete = await storage.getUser(athleteId);
      if (!athlete || athlete.role !== 'athlete') {
        return res.status(404).json({ error: "Athlete not found" });
      }
      
      if (athleteId !== userId) {
        return res.status(403).json({ error: "You can only FYR your own HYPE card" });
      }
      
      const followers = await storage.getAthleteFollowers(athleteId);
      
      if (followers.length === 0) {
        return res.json({ 
          success: true, 
          message: "No followers to notify",
          successCount: 0,
          failureCount: 0 
        });
      }
      
      const tokens = followers.map(f => f.fcmToken);
      const athleteName = athlete.firstName && athlete.lastName 
        ? `${athlete.firstName} ${athlete.lastName}` 
        : athlete.name || athlete.username;
      
      const baseUrl = process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : '';
      
      const hypeCardUrl = `${baseUrl}/athlete/${athleteId}`;
      
      const result = await sendPushNotification(
        tokens,
        `${athleteName} just FYR'd!`,
        `Check out ${athleteName}'s latest HYPE card updates!`,
        { athleteId, type: 'fyr' },
        hypeCardUrl
      );
      
      if (result.invalidTokens.length > 0) {
        for (const token of result.invalidTokens) {
          await storage.deleteAthleteFollower(athleteId, token);
        }
      }
      
      const remainingCount = await storage.getAthleteFollowerCount(athleteId);
      
      res.json({
        success: result.success,
        successCount: result.successCount,
        failureCount: result.failureCount,
        invalidTokensRemoved: result.invalidTokens.length,
        remainingFollowers: remainingCount
      });
    } catch (error) {
      console.error("Error sending FYR notification:", error);
      res.status(500).json({ error: "Failed to send FYR notification" });
    }
  });

  // ============ HYPE POSTS ROUTES ============
  
  // Get all HYPE posts for an athlete
  app.get("/api/athletes/:athleteId/hype-posts", async (req, res) => {
    try {
      const posts = await storage.getAthleteHypePosts(req.params.athleteId);
      res.json(posts);
    } catch (error) {
      console.error("Error getting athlete HYPE posts:", error);
      res.status(500).json({ error: "Failed to get HYPE posts" });
    }
  });
  
  // Get a single HYPE post
  app.get("/api/hype-posts/:id", async (req, res) => {
    try {
      const post = await storage.getHypePost(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "HYPE post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error getting HYPE post:", error);
      res.status(500).json({ error: "Failed to get HYPE post" });
    }
  });
  
  // Create a HYPE post
  app.post("/api/hype-posts", async (req, res) => {
    try {
      const parsed = insertHypePostSchema.parse(req.body);
      
      // Verify the athlete exists
      const athlete = await storage.getUser(parsed.athleteId);
      if (!athlete) {
        return res.status(404).json({ error: "Athlete not found" });
      }
      
      const post = await storage.createHypePost(parsed);
      
      // Send push notification to followers
      const followers = await storage.getAthleteFollowers(parsed.athleteId);
      if (followers.length > 0) {
        const tokens = followers.map(f => f.fcmToken);
        
        const athleteName = athlete.firstName && athlete.lastName
          ? `${athlete.firstName} ${athlete.lastName}`
          : athlete.name || athlete.username;
        
        const baseUrl = process.env.REPLIT_DOMAINS 
          ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
          : process.env.REPLIT_DEV_DOMAIN 
            ? `https://${process.env.REPLIT_DEV_DOMAIN}`
            : '';
        
        const hypeCardUrl = `${baseUrl}/share/athlete/${parsed.athleteId}`;
        
        try {
          const result = await sendPushNotification(
            tokens,
            `New HYPE from ${athleteName}!`,
            parsed.message.length > 60 ? parsed.message.substring(0, 57) + '...' : parsed.message,
            { athleteId: parsed.athleteId, hypePostId: post.id, type: 'hype_post' },
            hypeCardUrl
          );
          
          // Clean up invalid tokens
          if (result.invalidTokens.length > 0) {
            for (const token of result.invalidTokens) {
              await storage.deleteAthleteFollower(parsed.athleteId, token);
            }
          }
        } catch (notificationError) {
          console.error("Error sending HYPE post notification:", notificationError);
          // Don't fail the request if notification fails
        }
      }
      
      res.json(post);
    } catch (error: any) {
      console.error("Error creating HYPE post:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create HYPE post" });
    }
  });
  
  // Delete a HYPE post
  app.delete("/api/hype-posts/:id", async (req, res) => {
    try {
      const post = await storage.getHypePost(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "HYPE post not found" });
      }
      
      await storage.deleteHypePost(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting HYPE post:", error);
      res.status(500).json({ error: "Failed to delete HYPE post" });
    }
  });

  // ============ SHOUTOUTS ROUTES ============
  
  app.get("/api/games/:gameId/shoutouts", async (req, res) => {
    try {
      const shoutouts = await storage.getGameShoutouts(req.params.gameId);
      res.json(shoutouts);
    } catch (error) {
      console.error("Error getting game shoutouts:", error);
      res.status(500).json({ error: "Failed to get shoutouts" });
    }
  });

  app.get("/api/athletes/:athleteId/shoutouts", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const shoutouts = await storage.getAthleteShoutouts(req.params.athleteId, limit);
      res.json(shoutouts);
    } catch (error) {
      console.error("Error getting athlete shoutouts:", error);
      res.status(500).json({ error: "Failed to get shoutouts" });
    }
  });

  app.get("/api/athletes/:athleteId/shoutouts/count", async (req, res) => {
    try {
      const count = await storage.getAthleteShoutoutCount(req.params.athleteId);
      res.json({ count });
    } catch (error) {
      console.error("Error getting athlete shoutout count:", error);
      res.status(500).json({ error: "Failed to get shoutout count" });
    }
  });

  app.post("/api/games/:gameId/shoutouts", async (req, res) => {
    try {
      const supporterId = req.query.supporterId as string;
      if (!supporterId) {
        return res.status(400).json({ error: "supporterId is required" });
      }

      const game = await storage.getGame(req.params.gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      if (game.status !== "active") {
        return res.status(400).json({ error: "Can only send shoutouts during active games" });
      }

      const parsed = insertShoutoutSchema.parse({
        ...req.body,
        gameId: req.params.gameId,
        supporterId,
      });

      const shoutout = await storage.createShoutout(parsed);
      res.json(shoutout);
    } catch (error: any) {
      console.error("Error creating shoutout:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create shoutout" });
    }
  });

  // ============ LIVE TAPS ROUTES ============
  
  const tapRateLimiter = new Map<string, { count: number; resetAt: number }>();
  const TAP_RATE_LIMIT = 5; // max 5 bursts
  const TAP_RATE_WINDOW = 10000; // per 10 seconds

  app.post("/api/games/:gameId/taps", async (req, res) => {
    try {
      const supporterId = req.query.supporterId as string;
      if (!supporterId) {
        return res.status(400).json({ error: "supporterId is required" });
      }

      const game = await storage.getGame(req.params.gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      if (game.status !== "active") {
        return res.status(400).json({ error: "Can only tap during active games" });
      }

      const now = Date.now();
      const key = `${supporterId}-${req.params.gameId}`;
      const limiter = tapRateLimiter.get(key);
      
      if (limiter && now < limiter.resetAt) {
        if (limiter.count >= TAP_RATE_LIMIT) {
          return res.status(429).json({ error: "Too many taps, please slow down" });
        }
        limiter.count++;
      } else {
        tapRateLimiter.set(key, { count: 1, resetAt: now + TAP_RATE_WINDOW });
      }

      const tapCount = req.body.tapCount || 1;
      
      const tapEvent = await storage.createLiveTapEvent({
        gameId: req.params.gameId,
        supporterId,
        teamId: game.teamId,
        tapCount,
      });

      const team = await storage.getTeam(game.teamId);
      const season = team?.season || "2024-2025";
      
      const updatedTotal = await storage.upsertLiveTapTotal(
        supporterId,
        game.teamId,
        season,
        tapCount
      );

      const gameTapCount = await storage.getGameTapCount(req.params.gameId);

      res.json({ 
        tapEvent, 
        seasonTotal: updatedTotal.totalTaps,
        gameTapCount 
      });
    } catch (error: any) {
      console.error("Error recording tap:", error);
      res.status(500).json({ error: "Failed to record tap" });
    }
  });

  app.get("/api/games/:gameId/taps", async (req, res) => {
    try {
      const count = await storage.getGameTapCount(req.params.gameId);
      res.json({ count });
    } catch (error) {
      console.error("Error getting tap count:", error);
      res.status(500).json({ error: "Failed to get tap count" });
    }
  });

  app.get("/api/supporters/:supporterId/taps", async (req, res) => {
    try {
      const teamId = req.query.teamId as string;
      const season = req.query.season as string || "2024-2025";
      
      if (!teamId) {
        return res.status(400).json({ error: "teamId is required" });
      }

      const total = await storage.getSupporterTapTotal(req.params.supporterId, teamId, season);
      res.json({ totalTaps: total?.totalTaps || 0 });
    } catch (error) {
      console.error("Error getting supporter tap total:", error);
      res.status(500).json({ error: "Failed to get tap total" });
    }
  });

  // ============ BADGE ROUTES ============

  const DEFAULT_BADGES = [
    { name: "Bronze", tier: 1, tapThreshold: 100, themeId: "bronze", iconEmoji: "🥉", color: "#cd7f32", description: "Earned 100 taps - Bronze supporter!" },
    { name: "Silver", tier: 2, tapThreshold: 500, themeId: "silver", iconEmoji: "🥈", color: "#c0c0c0", description: "Earned 500 taps - Silver supporter!" },
    { name: "Gold", tier: 3, tapThreshold: 2000, themeId: "gold", iconEmoji: "🥇", color: "#ffd700", description: "Earned 2000 taps - Gold supporter!" },
    { name: "Legend", tier: 4, tapThreshold: 10000, themeId: "legend", iconEmoji: "🏆", color: "#9333ea", description: "Earned 10000 taps - Legendary supporter!" },
  ];

  app.get("/api/badges", async (req, res) => {
    try {
      let badges = await storage.getAllBadgeDefinitions();
      
      if (badges.length === 0) {
        for (const badge of DEFAULT_BADGES) {
          await storage.createBadgeDefinition(badge);
        }
        badges = await storage.getAllBadgeDefinitions();
      }
      
      res.json(badges);
    } catch (error) {
      console.error("Error getting badges:", error);
      res.status(500).json({ error: "Failed to get badges" });
    }
  });

  app.post("/api/badges/seed", async (req, res) => {
    try {
      const existing = await storage.getAllBadgeDefinitions();
      if (existing.length > 0) {
        return res.json({ message: "Badges already seeded", badges: existing });
      }
      
      const created = [];
      for (const badge of DEFAULT_BADGES) {
        const newBadge = await storage.createBadgeDefinition(badge);
        created.push(newBadge);
      }
      
      res.json({ message: "Badges seeded successfully", badges: created });
    } catch (error) {
      console.error("Error seeding badges:", error);
      res.status(500).json({ error: "Failed to seed badges" });
    }
  });

  app.post("/api/badges", async (req, res) => {
    try {
      const parsed = insertBadgeDefinitionSchema.parse(req.body);
      const badge = await storage.createBadgeDefinition(parsed);
      res.json(badge);
    } catch (error: any) {
      console.error("Error creating badge:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create badge" });
    }
  });

  app.get("/api/supporters/:supporterId/badges", async (req, res) => {
    try {
      const teamId = req.query.teamId as string;
      const season = req.query.season as string || "2024-2025";
      
      if (!teamId) {
        return res.status(400).json({ error: "teamId is required" });
      }

      const badges = await storage.getSupporterBadges(req.params.supporterId, teamId, season);
      res.json(badges);
    } catch (error) {
      console.error("Error getting supporter badges:", error);
      res.status(500).json({ error: "Failed to get badges" });
    }
  });

  app.post("/api/supporters/:supporterId/check-badges", async (req, res) => {
    try {
      const { supporterId } = req.params;
      const teamId = req.query.teamId as string;
      const season = req.query.season as string || "2024-2025";
      
      if (!teamId) {
        return res.status(400).json({ error: "teamId is required" });
      }

      const tapTotal = await storage.getSupporterTapTotal(supporterId, teamId, season);
      if (!tapTotal) {
        return res.json({ earnedBadges: [], newBadges: [] });
      }

      const allBadges = await storage.getAllBadgeDefinitions();
      const existingBadges = await storage.getSupporterBadges(supporterId, teamId, season);
      const existingBadgeIds = new Set(existingBadges.map(b => b.badgeId));

      const newBadges = [];
      
      for (const badge of allBadges) {
        if (tapTotal.totalTaps >= badge.tapThreshold && !existingBadgeIds.has(badge.id)) {
          const supporterBadge = await storage.createSupporterBadge({
            supporterId,
            badgeId: badge.id,
            teamId,
            season,
          });
          
          const existingThemes = await storage.getSupporterThemes(supporterId);
          const hasTheme = existingThemes.some(t => t.themeId === badge.themeId);
          if (!hasTheme) {
            await storage.createThemeUnlock({
              supporterId,
              themeId: badge.themeId,
              isActive: false,
            });
          }
          
          newBadges.push({ ...supporterBadge, badge });
        }
      }

      const allEarned = await storage.getSupporterBadges(supporterId, teamId, season);
      res.json({ earnedBadges: allEarned, newBadges });
    } catch (error) {
      console.error("Error checking badges:", error);
      res.status(500).json({ error: "Failed to check badges" });
    }
  });

  // ============ THEME ROUTES ============

  app.get("/api/supporters/:supporterId/themes", async (req, res) => {
    try {
      const themes = await storage.getSupporterThemes(req.params.supporterId);
      res.json(themes);
    } catch (error) {
      console.error("Error getting supporter themes:", error);
      res.status(500).json({ error: "Failed to get themes" });
    }
  });

  app.get("/api/supporters/:supporterId/themes/active", async (req, res) => {
    try {
      const theme = await storage.getActiveTheme(req.params.supporterId);
      res.json(theme || null);
    } catch (error) {
      console.error("Error getting active theme:", error);
      res.status(500).json({ error: "Failed to get active theme" });
    }
  });

  app.post("/api/supporters/:supporterId/themes/:themeId/activate", async (req, res) => {
    try {
      const theme = await storage.setActiveTheme(req.params.supporterId, req.params.themeId);
      if (!theme) {
        return res.status(404).json({ error: "Theme not found or not unlocked" });
      }
      res.json(theme);
    } catch (error) {
      console.error("Error activating theme:", error);
      res.status(500).json({ error: "Failed to activate theme" });
    }
  });

  // ============ LIVE ENGAGEMENT SESSION ROUTES ============

  // Get a specific live session
  app.get("/api/live-sessions/:sessionId", async (req, res) => {
    try {
      const session = await storage.getLiveSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error getting live session:", error);
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  // Get active live sessions for a team
  app.get("/api/teams/:teamId/live-sessions/active", async (req, res) => {
    try {
      const sessions = await storage.getActiveLiveSessionsForTeam(req.params.teamId);
      res.json(sessions);
    } catch (error) {
      console.error("Error getting active sessions:", error);
      res.status(500).json({ error: "Failed to get active sessions" });
    }
  });

  // Get upcoming live sessions for a team
  app.get("/api/teams/:teamId/live-sessions/upcoming", async (req, res) => {
    try {
      const sessions = await storage.getUpcomingLiveSessionsForTeam(req.params.teamId);
      res.json(sessions);
    } catch (error) {
      console.error("Error getting upcoming sessions:", error);
      res.status(500).json({ error: "Failed to get upcoming sessions" });
    }
  });

  // Get or create session for an event (auto-creates if event exists and is a game type)
  app.get("/api/events/:eventId/live-session", async (req, res) => {
    try {
      let session = await storage.getLiveSessionByEvent(req.params.eventId);
      
      // If no session exists and this is a game event, auto-create one
      if (!session) {
        const event = await storage.getEvent(req.params.eventId);
        if (!event) {
          return res.status(404).json({ error: "Event not found" });
        }
        
        // Only auto-create for game events
        if (event.type === "Game") {
          session = await storage.createLiveSession({
            eventId: event.id,
            teamId: event.teamId,
            status: "scheduled",
            scheduledStart: event.date,
            scheduledEnd: event.endDate || null,
          });
        } else {
          return res.status(404).json({ error: "No live session for this event" });
        }
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error getting event live session:", error);
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  // Create a live session for an event (coach/staff)
  app.post("/api/events/:eventId/live-session", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      // Check if session already exists
      const existing = await storage.getLiveSessionByEvent(event.id);
      if (existing) {
        return res.status(400).json({ error: "Session already exists for this event" });
      }
      
      const session = await storage.createLiveSession({
        eventId: event.id,
        teamId: event.teamId,
        status: "scheduled",
        scheduledStart: event.date,
        scheduledEnd: event.endDate || null,
      });
      
      res.json(session);
    } catch (error) {
      console.error("Error creating live session:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  // Start a live session (coach/staff or auto-triggered)
  app.post("/api/live-sessions/:sessionId/start", async (req, res) => {
    try {
      const { startedBy } = req.body;
      const session = await storage.startLiveSession(req.params.sessionId, startedBy);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error starting live session:", error);
      res.status(500).json({ error: "Failed to start session" });
    }
  });

  // End a live session (coach/staff or auto-triggered)
  app.post("/api/live-sessions/:sessionId/end", async (req, res) => {
    try {
      const { endedBy } = req.body;
      const session = await storage.endLiveSession(req.params.sessionId, endedBy);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error ending live session:", error);
      res.status(500).json({ error: "Failed to end session" });
    }
  });

  // Extend a live session (supporter clicks "Continue Cheering")
  app.post("/api/live-sessions/:sessionId/extend", async (req, res) => {
    try {
      const session = await storage.extendLiveSession(req.params.sessionId, 30); // 30 min extension
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error extending live session:", error);
      res.status(500).json({ error: "Failed to extend session" });
    }
  });

  // Get tap count for a session
  app.get("/api/live-sessions/:sessionId/taps", async (req, res) => {
    try {
      const count = await storage.getSessionTapCount(req.params.sessionId);
      res.json({ count });
    } catch (error) {
      console.error("Error getting session taps:", error);
      res.status(500).json({ error: "Failed to get tap count" });
    }
  });

  // Send taps to a session
  app.post("/api/live-sessions/:sessionId/taps", async (req, res) => {
    try {
      const { supporterId, tapCount } = req.body;
      if (!supporterId || !tapCount) {
        return res.status(400).json({ error: "supporterId and tapCount required" });
      }
      
      // Rate limiting check (using same pattern as game-based taps)
      const key = `tap-session:${supporterId}`;
      const now = Date.now();
      
      const limiter = tapRateLimiter.get(key);
      if (limiter && now < limiter.resetAt) {
        if (limiter.count >= TAP_RATE_LIMIT) {
          return res.status(429).json({ error: "Too many taps. Slow down!" });
        }
        limiter.count++;
      } else {
        tapRateLimiter.set(key, { count: 1, resetAt: now + TAP_RATE_WINDOW });
      }
      
      // Get session to find team
      const session = await storage.getLiveSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      if (session.status !== "live") {
        return res.status(400).json({ error: "Session is not active" });
      }
      
      // Create tap event
      await storage.createSessionTapEvent({
        sessionId: session.id,
        supporterId,
        teamId: session.teamId,
        tapCount,
      });
      
      // Update season total
      const season = "2024-2025";
      const total = await storage.upsertLiveTapTotal(supporterId, session.teamId, season, tapCount);
      
      // Get session tap count
      const sessionTapCount = await storage.getSessionTapCount(session.id);
      
      res.json({
        seasonTotal: total.totalTaps,
        sessionTapCount,
      });
    } catch (error) {
      console.error("Error recording session taps:", error);
      res.status(500).json({ error: "Failed to record taps" });
    }
  });

  // Get shoutouts for a session
  app.get("/api/live-sessions/:sessionId/shoutouts", async (req, res) => {
    try {
      const shoutouts = await storage.getSessionShoutouts(req.params.sessionId);
      res.json(shoutouts);
    } catch (error) {
      console.error("Error getting session shoutouts:", error);
      res.status(500).json({ error: "Failed to get shoutouts" });
    }
  });

  // Send shoutout to a session
  app.post("/api/live-sessions/:sessionId/shoutouts", async (req, res) => {
    try {
      const { supporterId, athleteId, message } = req.body;
      if (!supporterId || !athleteId || !message) {
        return res.status(400).json({ error: "supporterId, athleteId, and message required" });
      }
      
      const session = await storage.getLiveSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      if (session.status !== "live") {
        return res.status(400).json({ error: "Session is not active" });
      }
      
      const shoutout = await storage.createSessionShoutout({
        sessionId: session.id,
        supporterId,
        athleteId,
        message,
      });
      
      res.json(shoutout);
    } catch (error) {
      console.error("Error creating session shoutout:", error);
      res.status(500).json({ error: "Failed to create shoutout" });
    }
  });

  // Get roster for a session (athletes on team)
  app.get("/api/live-sessions/:sessionId/roster", async (req, res) => {
    try {
      const session = await storage.getLiveSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      // Get team members who are athletes
      const members = await storage.getTeamMembers(session.teamId);
      const athletes = members.filter(m => m.role === "athlete" || m.role === "staff");
      
      res.json(athletes);
    } catch (error) {
      console.error("Error getting session roster:", error);
      res.status(500).json({ error: "Failed to get roster" });
    }
  });

  // ============ AUTO SESSION MANAGEMENT (called on app load) ============

  // Check and auto-start/end sessions based on time
  app.post("/api/live-sessions/check-lifecycle", async (req, res) => {
    try {
      const { teamId } = req.body;
      if (!teamId) {
        return res.status(400).json({ error: "teamId required" });
      }
      
      const now = new Date();
      const autoStartWindow = new Date(now.getTime() + 15 * 60 * 1000); // 15 min from now
      const autoEndBuffer = 30 * 60 * 1000; // 30 min buffer after scheduled end
      
      // Get all events for team
      const events = await storage.getTeamEvents(teamId);
      const gameEvents = events.filter(e => e.type === "Game");
      
      const results = {
        autoStarted: [] as string[],
        autoEnded: [] as string[],
      };
      
      for (const event of gameEvents) {
        let session = await storage.getLiveSessionByEvent(event.id);
        
        // Auto-create session if within 15 min of start
        if (!session && event.date <= autoStartWindow && event.date >= now) {
          session = await storage.createLiveSession({
            eventId: event.id,
            teamId: event.teamId,
            status: "scheduled",
            scheduledStart: event.date,
            scheduledEnd: event.endDate || null,
          });
        }
        
        if (session) {
          // Auto-start if scheduled and within 15 min of start
          if (session.status === "scheduled" && now >= new Date(session.scheduledStart.getTime() - 15 * 60 * 1000)) {
            await storage.startLiveSession(session.id);
            results.autoStarted.push(session.id);
          }
          
          // Auto-end if live and past end time + buffer (unless extended)
          if (session.status === "live") {
            const endTime = session.extendedUntil || session.scheduledEnd;
            if (endTime && now >= new Date(endTime.getTime() + autoEndBuffer)) {
              await storage.endLiveSession(session.id);
              results.autoEnded.push(session.id);
            }
          }
        }
      }
      
      res.json(results);
    } catch (error) {
      console.error("Error checking session lifecycle:", error);
      res.status(500).json({ error: "Failed to check lifecycle" });
    }
  });

  // FCM Token Routes
  app.post("/api/fcm-tokens", async (req, res) => {
    try {
      const { userId, token, deviceInfo } = req.body;
      
      if (!userId || !token) {
        return res.status(400).json({ error: "userId and token are required" });
      }
      
      const saved = await storage.saveFcmToken(userId, token, deviceInfo);
      res.json(saved);
    } catch (error) {
      console.error("Error saving FCM token:", error);
      res.status(500).json({ error: "Failed to save FCM token" });
    }
  });

  app.delete("/api/fcm-tokens/:token", async (req, res) => {
    try {
      await storage.deleteFcmToken(req.params.token);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting FCM token:", error);
      res.status(500).json({ error: "Failed to delete FCM token" });
    }
  });

  // Chat API routes
  app.get("/api/teams/:teamId/chat/:channel", async (req, res) => {
    try {
      const { teamId, channel } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getTeamChatMessages(teamId, channel, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  const ALLOWED_CHANNELS = ["general", "announcements", "tactics"];
  const MAX_MESSAGE_LENGTH = 2000;

  app.post("/api/teams/:teamId/chat/:channel", async (req, res) => {
    try {
      const { teamId, channel } = req.params;
      const { userId, content } = req.body;
      
      // Validate channel
      if (!ALLOWED_CHANNELS.includes(channel)) {
        return res.status(400).json({ error: "Invalid channel" });
      }
      
      if (!userId || !content) {
        return res.status(400).json({ error: "userId and content are required" });
      }
      
      // Validate content length
      if (typeof content !== "string" || content.length > MAX_MESSAGE_LENGTH) {
        return res.status(400).json({ error: `Message must be ${MAX_MESSAGE_LENGTH} characters or less` });
      }
      
      // Verify user is a member of the team
      const membership = await storage.getTeamMembership(teamId, userId);
      if (!membership) {
        return res.status(403).json({ error: "User is not a member of this team" });
      }
      
      const message = await storage.createChatMessage({
        teamId,
        userId,
        content: content.trim(),
        channel,
      });
      
      // Get the user info to include in the broadcast (sanitized - no password)
      const user = await storage.getUser(userId);
      const safeUser = user ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        avatar: user.avatar,
      } : null;
      const messageWithUser = { ...message, user: safeUser };
      
      // Broadcast to all connected clients for this team
      const clients = teamClients.get(teamId);
      if (clients) {
        const broadcast = JSON.stringify({ type: "new_message", data: messageWithUser });
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(broadcast);
          }
        });
      }
      
      res.json(messageWithUser);
    } catch (error) {
      console.error("Error sending chat message:", error);
      res.status(500).json({ error: "Failed to send chat message" });
    }
  });

  // Set up WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/chat" });
  
  wss.on("connection", async (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const teamId = url.searchParams.get("teamId");
    const userId = url.searchParams.get("userId");
    
    if (!teamId) {
      ws.close(1008, "teamId is required");
      return;
    }
    
    // Verify user is a member of the team (if userId provided)
    if (userId) {
      try {
        const membership = await storage.getTeamMembership(teamId, userId);
        if (!membership) {
          ws.close(1008, "User is not a member of this team");
          return;
        }
      } catch (error) {
        console.error("Error verifying team membership:", error);
      }
    }
    
    // Add client to team's client set
    if (!teamClients.has(teamId)) {
      teamClients.set(teamId, new Set());
    }
    teamClients.get(teamId)!.add(ws);
    
    console.log(`WebSocket client connected to team ${teamId}`);
    
    ws.on("close", () => {
      const clients = teamClients.get(teamId);
      if (clients) {
        clients.delete(ws);
        if (clients.size === 0) {
          teamClients.delete(teamId);
        }
      }
      console.log(`WebSocket client disconnected from team ${teamId}`);
    });
    
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  // ============ SUPER ADMIN ROUTES ============
  
  // Middleware to check if user is super admin
  async function requireSuperAdmin(req: any, res: any, next: any) {
    const requesterId = req.query.requesterId as string || req.body.requesterId;
    if (!requesterId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const user = await storage.getUser(requesterId);
    if (!user || !user.isSuperAdmin) {
      return res.status(403).json({ error: "Super admin access required" });
    }
    req.adminUser = user;
    next();
  }

  // Search users by email or name
  app.get("/api/admin/users/search", requireSuperAdmin, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.status(400).json({ error: "Search query must be at least 2 characters" });
      }
      const users = await storage.searchUsers(query);
      res.json(users);
    } catch (error) {
      console.error("Admin user search failed:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Get user with their team memberships
  app.get("/api/admin/users/:userId", requireSuperAdmin, async (req, res) => {
    try {
      const result = await storage.getUserWithTeams(req.params.userId);
      if (!result) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Admin get user failed:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Update a team member (role, jersey number, position)
  app.patch("/api/admin/team-members/:memberId", requireSuperAdmin, async (req, res) => {
    try {
      const parsed = updateTeamMemberSchema.parse(req.body);
      const updated = await storage.adminUpdateTeamMember(req.params.memberId, parsed);
      if (!updated) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json(updated);
    } catch (error: any) {
      console.error("Admin update team member failed:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update team member" });
    }
  });

  // Remove a team member
  app.delete("/api/admin/team-members/:memberId", requireSuperAdmin, async (req, res) => {
    try {
      await storage.adminRemoveTeamMember(req.params.memberId);
      res.json({ success: true });
    } catch (error) {
      console.error("Admin remove team member failed:", error);
      res.status(500).json({ error: "Failed to remove team member" });
    }
  });

  // Add a user to a team
  app.post("/api/admin/team-members", requireSuperAdmin, async (req, res) => {
    try {
      const { teamId, userId, role } = req.body;
      if (!teamId || !userId) {
        return res.status(400).json({ error: "teamId and userId are required" });
      }
      
      // Check if already a member
      const existing = await storage.getTeamMembership(teamId, userId);
      if (existing) {
        return res.status(400).json({ error: "User is already a team member" });
      }
      
      const member = await storage.adminAddTeamMember({
        teamId,
        userId,
        role: role || "athlete",
      });
      res.json(member);
    } catch (error) {
      console.error("Admin add team member failed:", error);
      res.status(500).json({ error: "Failed to add team member" });
    }
  });

  // Delete entire team and all associated data
  app.delete("/api/admin/teams/:teamId", requireSuperAdmin, async (req, res) => {
    try {
      const teamId = req.params.teamId;
      
      // Verify team exists
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      await storage.deleteTeam(teamId);
      res.json({ success: true, message: `Team "${team.name}" and all associated data deleted` });
    } catch (error) {
      console.error("Admin delete team failed:", error);
      res.status(500).json({ error: "Failed to delete team" });
    }
  });

  // Start impersonation session
  app.post("/api/admin/impersonate", requireSuperAdmin, async (req, res) => {
    try {
      const { targetUserId } = req.body;
      const adminUser = (req as any).adminUser;
      
      if (!targetUserId) {
        return res.status(400).json({ error: "targetUserId is required" });
      }
      
      // Get target user
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ error: "Target user not found" });
      }
      
      // Create session (expires in 1 hour)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      const session = await storage.createImpersonationSession({
        adminId: adminUser.id,
        targetUserId,
        expiresAt,
      });
      
      const { password, ...safeTargetUser } = targetUser;
      res.json({ session, targetUser: safeTargetUser });
    } catch (error) {
      console.error("Start impersonation failed:", error);
      res.status(500).json({ error: "Failed to start impersonation" });
    }
  });

  // End impersonation session
  app.post("/api/admin/impersonate/stop", requireSuperAdmin, async (req, res) => {
    try {
      const adminUser = (req as any).adminUser;
      
      const activeSession = await storage.getActiveImpersonationSession(adminUser.id);
      if (!activeSession) {
        return res.status(404).json({ error: "No active impersonation session" });
      }
      
      await storage.endImpersonationSession(activeSession.id);
      res.json({ success: true });
    } catch (error) {
      console.error("End impersonation failed:", error);
      res.status(500).json({ error: "Failed to end impersonation" });
    }
  });

  // Get current impersonation session (if any)
  app.get("/api/admin/impersonate/current", requireSuperAdmin, async (req, res) => {
    try {
      const adminUser = (req as any).adminUser;
      
      const activeSession = await storage.getActiveImpersonationSession(adminUser.id);
      if (!activeSession) {
        return res.json({ session: null });
      }
      
      const targetUser = await storage.getUser(activeSession.targetUserId);
      if (!targetUser) {
        return res.json({ session: null });
      }
      
      const { password, ...safeTargetUser } = targetUser;
      res.json({ session: activeSession, targetUser: safeTargetUser });
    } catch (error) {
      console.error("Get impersonation session failed:", error);
      res.status(500).json({ error: "Failed to get impersonation session" });
    }
  });

  // Get all teams with members (for admin panel)
  app.get("/api/admin/teams", requireSuperAdmin, async (req, res) => {
    try {
      const allTeams = await storage.getAllTeams();
      const teamsWithMembers = await Promise.all(
        allTeams.map(async (team) => {
          const members = await storage.getTeamMembers(team.id);
          return { ...team, members, memberCount: members.length };
        })
      );
      res.json(teamsWithMembers);
    } catch (error) {
      console.error("Admin get teams failed:", error);
      res.status(500).json({ error: "Failed to get teams" });
    }
  });

  return httpServer;
}

// Async transcoding function using FFmpeg
async function transcodeVideo(videoId: string, originalKey: string) {
  try {
    console.log(`Starting transcoding for video ${videoId}`);
    
    // Get the original file
    const originalFile = await objectStorageService.getObjectEntityFile(originalKey);
    
    // Create temp paths
    const tempInputPath = `/tmp/input_${videoId}.mp4`;
    const tempOutputPath = `/tmp/output_${videoId}.mp4`;
    const tempThumbnailPath = `/tmp/thumb_${videoId}.jpg`;
    
    // Download original to temp
    const [buffer] = await originalFile.download();
    const fs = await import("fs/promises");
    await fs.writeFile(tempInputPath, buffer);
    
    // Run FFmpeg to transcode to web-optimized MP4
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i", tempInputPath,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        "-y",
        tempOutputPath
      ]);
      
      ffmpeg.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg exited with code ${code}`));
      });
      
      ffmpeg.on("error", reject);
    });
    
    // Generate thumbnail
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i", tempInputPath,
        "-ss", "00:00:01",
        "-vframes", "1",
        "-y",
        tempThumbnailPath
      ]);
      
      ffmpeg.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg thumbnail exited with code ${code}`));
      });
      
      ffmpeg.on("error", reject);
    });
    
    // Upload processed video to public storage
    const processedUploadURL = await objectStorageService.getObjectEntityUploadURL();
    const processedPath = objectStorageService.normalizeObjectEntityPath(processedUploadURL);
    
    const processedBuffer = await fs.readFile(tempOutputPath);
    await fetch(processedUploadURL, {
      method: "PUT",
      body: processedBuffer,
      headers: { "Content-Type": "video/mp4" },
    });
    
    // Upload thumbnail
    const thumbnailUploadURL = await objectStorageService.getObjectEntityUploadURL();
    const thumbnailPath = objectStorageService.normalizeObjectEntityPath(thumbnailUploadURL);
    
    const thumbnailBuffer = await fs.readFile(tempThumbnailPath);
    await fetch(thumbnailUploadURL, {
      method: "PUT",
      body: thumbnailBuffer,
      headers: { "Content-Type": "image/jpeg" },
    });
    
    // Update database with processed paths
    await storage.updateHighlightVideo(videoId, {
      processedKey: processedPath,
      thumbnailKey: thumbnailPath,
      publicUrl: processedPath,
      status: "ready",
    });
    
    // Delete original file to save space
    await originalFile.delete();
    
    // Clean up temp files
    await fs.unlink(tempInputPath).catch(() => {});
    await fs.unlink(tempOutputPath).catch(() => {});
    await fs.unlink(tempThumbnailPath).catch(() => {});
    
    console.log(`Transcoding complete for video ${videoId}`);
  } catch (error) {
    console.error(`Transcoding failed for video ${videoId}:`, error);
    await storage.updateHighlightVideo(videoId, { status: "failed" });
  }
}
