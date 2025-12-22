import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTeamSchema, insertEventSchema, updateEventSchema, insertHighlightVideoSchema, insertPlaySchema, updatePlaySchema, updateTeamMemberSchema, insertGameSchema, updateGameSchema, insertStatConfigSchema, updateStatConfigSchema, insertGameStatSchema, insertGameRosterSchema, updateGameRosterSchema } from "@shared/schema";
import { z } from "zod";
import { registerObjectStorageRoutes, ObjectStorageService, objectStorageClient } from "./replit_integrations/object_storage";
import { spawn } from "child_process";
import path from "path";
import bcrypt from "bcrypt";

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
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(parsed.username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Check if email already exists
      if (parsed.email) {
        const existingEmail = await storage.getUserByEmail(parsed.email);
        if (existingEmail) {
          return res.status(400).json({ error: "Email already exists" });
        }
      }
      
      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(parsed.password, SALT_ROUNDS);
      const user = await storage.createUser({ ...parsed, password: hashedPassword });
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
      
      // Try to find user by email first, then by username
      let user = await storage.getUserByEmail(username);
      if (!user) {
        user = await storage.getUserByUsername(username);
      }
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Verify password with bcrypt
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
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
      const games = await storage.getTeamGames(req.params.teamId);
      res.json(games);
    } catch (error) {
      console.error("Error getting games:", error);
      res.status(500).json({ error: "Failed to get games" });
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

      const parsed = updateGameSchema.parse(req.body);
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
