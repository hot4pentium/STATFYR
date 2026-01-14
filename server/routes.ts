import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { withRetry, db } from "./db";
import { insertUserSchema, insertTeamSchema, insertEventSchema, updateEventSchema, insertHighlightVideoSchema, insertPlaySchema, updatePlaySchema, updateTeamMemberSchema, insertGameSchema, updateGameSchema, insertStatConfigSchema, updateStatConfigSchema, insertGameStatSchema, insertGameRosterSchema, updateGameRosterSchema, insertStartingLineupSchema, insertStartingLineupPlayerSchema, insertShoutoutSchema, insertLiveTapEventSchema, insertBadgeDefinitionSchema, insertProfileLikeSchema, insertProfileCommentSchema, insertChatMessageSchema, insertAthleteFollowerSchema, insertHypePostSchema, insertHypeSchema, teams } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { registerObjectStorageRoutes, ObjectStorageService, objectStorageClient } from "./replit_integrations/object_storage";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
import { sendPushNotification, getFirebaseAdmin, getFirebaseAdminStatus } from "./firebaseAdmin";
import { sendWebPushToMany, WebPushSubscription, initWebPush, getWebPushVapidPublicKey } from "./webPush";
import { sendPasswordResetEmail } from "./emailService";
import crypto from "crypto";
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

  // Note: Authentication is handled via email/password (legacy) and will support
  // Firebase Auth with Google/Apple sign-in for social login

  // Endpoint to provide Firebase config for service worker
  app.get("/api/firebase-config", (req, res) => {
    res.json({
      apiKey: process.env.VITE_FIREBASE_API_KEY || '',
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.VITE_FIREBASE_APP_ID || '',
    });
  });


  // Endpoint to provide Web Push VAPID public key for iOS
  app.get("/api/webpush/vapid-public-key", (req, res) => {
    // Initialize Web Push if not already done
    initWebPush();
    const publicKey = getWebPushVapidPublicKey();
    if (!publicKey) {
      return res.status(503).json({ error: "Web Push not configured" });
    }
    res.json({ publicKey });
  });

  // Debug endpoint to check Firebase Admin status
  app.get("/api/debug/firebase-status", (req, res) => {
    // Initialize Firebase Admin if not already done
    getFirebaseAdmin();
    const status = getFirebaseAdminStatus();
    res.json({
      firebaseAdmin: status,
      envVars: {
        hasServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        hasServiceAccountKeyB64: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64,
      }
    });
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = insertUserSchema.parse(req.body);
      
      // For email/password registration, username and password are required
      if (!parsed.username) {
        return res.status(400).json({ error: "Username is required" });
      }
      if (!parsed.password) {
        return res.status(400).json({ error: "Password is required" });
      }
      
      // Check if username already exists (with retry for db wake-up)
      const existingUsername = await withRetry(() => storage.getUserByUsername(parsed.username!));
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

  // Firebase Auth sync endpoint - creates or updates user from Firebase social login
  app.post("/api/auth/firebase-sync", async (req, res) => {
    try {
      const { firebaseUid, email, displayName, photoURL, role } = req.body;
      
      if (!firebaseUid) {
        return res.status(400).json({ error: "Firebase UID is required" });
      }
      
      // PRIORITY: Check by EMAIL first to link social login to existing accounts
      // If multiple users have the same email, pick the one with team memberships or coach role
      let user = null;
      
      if (email) {
        const usersWithEmail = await withRetry(() => storage.getUsersByEmail(email));
        
        if (usersWithEmail.length > 0) {
          if (usersWithEmail.length === 1) {
            // Only one user with this email - use it
            user = usersWithEmail[0];
          } else {
            // Multiple users with same email - pick the best one deterministically
            // Score each user: team membership count + role priority + ID format preference
            const rolePriority: Record<string, number> = { 'coach': 100, 'staff': 50, 'athlete': 10, 'supporter': 1 };
            
            // Prefer standard UUIDs (36 chars with hyphens) over Firebase UIDs (28 chars, no hyphens)
            const isStandardUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
            
            const scored = await Promise.all(usersWithEmail.map(async (u) => {
              const teams = await storage.getUserTeams(u.id);
              const teamScore = teams.length * 1000; // Team membership is most important
              const roleScore = rolePriority[u.role || 'supporter'] || 0;
              // Prefer standard UUIDs (original accounts) over Firebase UIDs (social login duplicates)
              const idScore = isStandardUUID(u.id) ? 10 : 0;
              return { user: u, score: teamScore + roleScore + idScore };
            }));
            
            // Sort by score descending, then by ID ascending for deterministic tiebreaker
            scored.sort((a, b) => {
              if (b.score !== a.score) return b.score - a.score;
              // Deterministic tiebreaker: sort by ID lexicographically
              return a.user.id.localeCompare(b.user.id);
            });
            user = scored[0].user;
          }
          
          if (user) {
            // Found existing user by email - update their profile and return
            const updated = await storage.updateUser(user.id, {
              profileImageUrl: photoURL || user.profileImageUrl,
              lastAccessedAt: new Date(),
            });
            const userToReturn = updated || user;
            const { password: _, ...safeUser } = userToReturn;
            return res.json(safeUser);
          }
        }
      }
      
      // If not found by email, try by Firebase UID
      user = await withRetry(() => storage.getUser(firebaseUid));
      
      if (user) {
        // Update existing user found by Firebase UID
        const updated = await storage.updateUser(user.id, {
          email: email || user.email,
          profileImageUrl: photoURL || user.profileImageUrl,
          lastAccessedAt: new Date(),
        });
        const userToReturn = updated || user;
        const { password: _, ...safeUser } = userToReturn;
        return res.json(safeUser);
      }
      
      // No existing user found - require role selection before creating account
      if (!role) {
        return res.status(200).json({ 
          needsRoleSelection: true,
          message: "Please select your role to continue"
        });
      }
      
      // Create new user from Firebase data with selected role
      const nameParts = (displayName || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const newUser = await withRetry(() => storage.createUser({
        id: firebaseUid,
        email: email || undefined,
        firstName,
        lastName,
        name: displayName || '',
        role: role,
        profileImageUrl: photoURL || undefined,
        // No password for social login users
      }));
      
      
      const { password: _, ...safeUser } = newUser;
      res.json(safeUser);
    } catch (error: any) {
      console.error("Firebase sync error:", error);
      res.status(500).json({ error: `Failed to sync user: ${error?.message || 'Unknown error'}` });
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
      
      // Check if user has a password (OAuth users may not have one)
      if (!user.password) {
        return res.status(401).json({ error: "This account uses social login. Please use Google or another provider to sign in." });
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
      
      // Check if user has a password to change
      if (!user.password) {
        return res.status(400).json({ error: "This account uses social login and has no password to change" });
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

  // Request password reset - sends email with reset link
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      const user = await storage.getUserByEmail(email.trim().toLowerCase());
      
      // Always return success to prevent email enumeration
      if (!user) {
        console.log('[Auth] Password reset requested for non-existent email:', email);
        return res.json({ message: "If an account exists with this email, you will receive a password reset link." });
      }
      
      // Check if user uses social login (no password)
      if (!user.password) {
        console.log('[Auth] Password reset requested for social login user:', email);
        return res.json({ message: "If an account exists with this email, you will receive a password reset link." });
      }
      
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      // Save token to user
      await storage.updateUser(user.id, {
        resetToken,
        resetTokenExpiry,
      });
      
      // Send email
      const emailResult = await sendPasswordResetEmail(email, resetToken);
      if (!emailResult.success) {
        console.error('[Auth] Failed to send password reset email:', emailResult.error);
        return res.status(500).json({ error: "Failed to send reset email. Please try again." });
      }
      
      res.json({ message: "If an account exists with this email, you will receive a password reset link." });
    } catch (error) {
      console.error("Password reset request failed:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });
  
  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      
      // Find user by reset token
      const user = await storage.getUserByResetToken(token);
      
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired reset link. Please request a new one." });
      }
      
      // Check if token has expired
      if (!user.resetTokenExpiry || new Date() > new Date(user.resetTokenExpiry)) {
        return res.status(400).json({ error: "Reset link has expired. Please request a new one." });
      }
      
      // Hash new password and update user
      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await storage.updateUser(user.id, {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        mustChangePassword: false,
      });
      
      console.log('[Auth] Password reset successful for:', user.email);
      res.json({ message: "Password reset successful. You can now log in with your new password." });
    } catch (error) {
      console.error("Password reset failed:", error);
      res.status(500).json({ error: "Failed to reset password" });
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

  // Season Management Routes
  app.get("/api/teams/:teamId/seasons", async (req, res) => {
    try {
      const archives = await storage.getSeasonArchives(req.params.teamId);
      res.json(archives);
    } catch (error) {
      res.status(500).json({ error: "Failed to get season archives" });
    }
  });

  app.get("/api/teams/:teamId/seasons/:seasonId", async (req, res) => {
    try {
      const archive = await storage.getSeasonArchive(req.params.seasonId);
      if (!archive) {
        return res.status(404).json({ error: "Season archive not found" });
      }
      res.json(archive);
    } catch (error) {
      res.status(500).json({ error: "Failed to get season archive" });
    }
  });

  app.post("/api/teams/:teamId/end-season", async (req, res) => {
    try {
      const { mvpUserId } = req.body;
      const archive = await storage.endSeason(req.params.teamId, mvpUserId);
      res.json(archive);
    } catch (error) {
      console.error('End season error:', error);
      res.status(500).json({ error: "Failed to end season" });
    }
  });

  app.post("/api/teams/:teamId/start-season", async (req, res) => {
    try {
      const { season } = req.body;
      if (!season) {
        return res.status(400).json({ error: "Season name is required" });
      }

      // Update team with new season and set status to active
      const [updatedTeam] = await db
        .update(teams)
        .set({ 
          season,
          seasonStatus: 'active'
        })
        .where(eq(teams.id, req.params.teamId))
        .returning();

      if (!updatedTeam) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.json(updatedTeam);
    } catch (error) {
      console.error('Start season error:', error);
      res.status(500).json({ error: "Failed to start season" });
    }
  });

  app.get("/api/teams/:teamId/athletes-for-mvp", async (req, res) => {
    try {
      const members = await storage.getTeamMembers(req.params.teamId);
      const athletes = members
        .filter(m => m.role === 'athlete')
        .map(m => ({
          id: m.user.id,
          name: m.user.firstName 
            ? `${m.user.firstName} ${m.user.lastName || ''}`.trim()
            : m.user.name,
          position: m.position,
          jerseyNumber: m.jerseyNumber,
        }));
      res.json(athletes);
    } catch (error) {
      res.status(500).json({ error: "Failed to get athletes" });
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

  // Coach endpoint to create a new team member with temporary password
  app.post("/api/teams/:teamId/create-member", async (req, res) => {
    try {
      const { teamId } = req.params;
      const { firstName, lastName, email, role, requesterId } = req.body;
      
      if (!firstName || !lastName || !email || !role || !requesterId) {
        return res.status(400).json({ error: "First name, last name, email, role, and requesterId are required" });
      }
      
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      // Authorization: verify requester is coach or staff of this team
      const requesterMembership = await storage.getTeamMembership(teamId, requesterId);
      const isCoach = team.coachId === requesterId;
      const isStaff = requesterMembership?.role === 'coach' || requesterMembership?.role === 'staff';
      
      if (!isCoach && !isStaff) {
        return res.status(403).json({ error: "Only coaches and staff can create team members" });
      }
      
      // Validate role - only allow athlete, supporter, or staff (not coach or admin)
      const allowedRoles = ["athlete", "supporter", "staff"];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be athlete, supporter, or staff." });
      }
      
      const existingUser = await storage.getUserByEmail(email.trim().toLowerCase());
      if (existingUser) {
        return res.status(400).json({ error: "A user with this email already exists. They can join with the team code." });
      }
      
      const username = email.split("@")[0] + "_" + Date.now().toString(36);
      const tempPassword = "Welcome123!";
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
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

  // Admin routes - note: /api/admin/teams and /api/admin/users are defined later with requireSuperAdmin

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
      
      // Validate role - only allow athlete, supporter, staff, or coach
      const allowedRoles = ["athlete", "supporter", "staff", "coach"];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be athlete, supporter, staff, or coach." });
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

  app.get("/api/events/:eventId", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to get event" });
    }
  });

  app.patch("/api/events/:eventId", async (req, res) => {
    try {
      const parsed = updateEventSchema.parse(req.body);
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
      console.log(`[Play Create] teamId=${req.params.teamId}, userId=${userId}, playName=${playData.name}`);
      
      if (!userId) {
        console.log(`[Play Create] ERROR: No userId provided`);
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Validate user is team member with coach or staff role
      const membership = await storage.getTeamMembership(req.params.teamId, userId);
      console.log(`[Play Create] Membership lookup: ${JSON.stringify(membership)}`);
      
      if (!membership || (membership.role !== "coach" && membership.role !== "staff")) {
        console.log(`[Play Create] ERROR: User role=${membership?.role || 'no membership'} - not authorized`);
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
      console.error("Error creating play:", error);
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

  // Create a managed athlete (supporter creates athlete account - with or without team)
  app.post("/api/users/:supporterId/managed-athletes", async (req, res) => {
    try {
      const { teamCode, firstName, lastName, sport, position, number } = req.body;
      
      if (!firstName || !lastName) {
        return res.status(400).json({ error: "First name and last name are required" });
      }

      // Verify supporter exists
      const supporter = await storage.getUser(req.params.supporterId);
      if (!supporter || supporter.role !== "supporter") {
        return res.status(403).json({ error: "Only supporters can manage athletes" });
      }

      // If teamCode is provided, create linked athlete (joins a team)
      if (teamCode) {
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

        return res.json({ ...managed, athlete, team });
      }

      // No teamCode - create independent managed athlete
      if (!sport) {
        return res.status(400).json({ error: "Sport is required for independent athletes" });
      }

      const managed = await storage.createManagedAthlete({
        supporterId: req.params.supporterId,
        athleteId: null,
        athleteName: `${firstName} ${lastName}`,
        sport,
        position: position || null,
        number: number || null,
        isOwner: true,
        profileImageUrl: null,
      });

      res.json({ ...managed, athlete: { name: `${firstName} ${lastName}` } });
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
      
      if (parsed.trackingMode === 'team') {
        notifyTeamModeStatSession(req.params.teamId).catch(err => {
          console.error('[StatNotify] Failed to send team-mode notifications:', err);
        });
      }
      
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
      
      // Default values in case athlete lookup fails
      let athleteName = "Athlete";
      let teamName = "";
      let athleteAvatar: string | null = null;
      
      // Try to get athlete data (but still serve manifest if not found)
      try {
        const athlete = await storage.getUser(athleteId);
        if (athlete) {
          athleteName = athlete.name || athlete.username || "Athlete";
          athleteAvatar = athlete.avatar || athlete.profileImageUrl;
          
          // Get team info for sport
          const memberships = await storage.getUserTeamMemberships(athleteId);
          const membership = memberships.length > 0 ? memberships[0] : null;
          if (membership) {
            const team = await storage.getTeam(membership.teamId.toString());
            teamName = team?.name || "";
          }
        }
      } catch (e) {
        console.log("Could not fetch athlete for manifest:", e);
      }
      
      const appName = `${athleteName} HYPE`;
      const shortName = athleteName.substring(0, 12);
      const description = teamName 
        ? `Follow ${athleteName} from ${teamName} - Get updates and show your support!`
        : `Follow ${athleteName} - Get updates and show your support!`;
      
      // Build the manifest - always serve a valid manifest for PWA install
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
            src: athleteAvatar || "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: athleteAvatar || "/icon-512.png",
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
      if (!athlete) {
        return res.status(404).json({ error: "Athlete not found" });
      }
      
      // Get team membership (first athlete membership found)
      const memberships = await storage.getUserTeamMemberships(athleteId);
      // Find any team membership where user is an athlete (not just their global role)
      const athleteMembership = memberships.find((m: any) => m.role === 'athlete');
      const membership = athleteMembership || (memberships.length > 0 ? memberships[0] : null);
      
      // Only allow access if user has at least one athlete membership OR is globally an athlete
      if (!athleteMembership && athlete.role !== 'athlete') {
        return res.status(404).json({ error: "Athlete not found" });
      }
      
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

  // Get engagement stats (likes and comments count) for athlete
  app.get("/api/athletes/:athleteId/engagement", async (req, res) => {
    try {
      const athleteId = req.params.athleteId;
      const athlete = await storage.getUser(athleteId);
      if (!athlete || athlete.role !== 'athlete') {
        return res.status(404).json({ error: "Athlete not found" });
      }
      
      const likeCount = await storage.getProfileLikeCount(athleteId);
      const comments = await storage.getProfileComments(athleteId);
      res.json({ likes: likeCount, comments: comments.length });
    } catch (error) {
      console.error("Error getting engagement stats:", error);
      res.status(500).json({ error: "Failed to get engagement stats" });
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

  // Delete a profile comment (athlete only)
  app.delete("/api/athletes/:athleteId/profile-comments/:commentId", async (req, res) => {
    try {
      const { athleteId, commentId } = req.params;
      
      // For now, just delete - in production you'd verify the requesting user is the athlete
      await storage.deleteProfileComment(commentId, athleteId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting profile comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
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

  // Check if an email is following an athlete
  app.get("/api/athletes/:athleteId/followers/check", async (req, res) => {
    try {
      const athleteId = req.params.athleteId;
      const email = req.query.email as string;
      
      if (!email) {
        return res.json({ isFollowing: false });
      }
      
      const follower = await storage.getAthleteFollowerByEmail(athleteId, email.toLowerCase());
      res.json({ isFollowing: !!follower });
    } catch (error) {
      console.error("Error checking follower status:", error);
      res.status(500).json({ error: "Failed to check follower status" });
    }
  });

  // Follow an athlete (public - no auth required, email-based)
  app.post("/api/athletes/:athleteId/followers", async (req, res) => {
    try {
      const athleteId = req.params.athleteId;
      console.log("[Follow] Request received for athlete:", athleteId);
      
      const athlete = await storage.getUser(athleteId);
      if (!athlete || athlete.role !== 'athlete') {
        console.log("[Follow] Athlete not found or not an athlete role");
        return res.status(404).json({ error: "Athlete not found" });
      }
      console.log("[Follow] Found athlete:", athlete.username);
      
      const { email, followerName } = req.body;
      
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: "Valid email address is required" });
      }
      
      const normalizedEmail = email.toLowerCase().trim();
      
      // Check if already following
      const existing = await storage.getAthleteFollowerByEmail(athleteId, normalizedEmail);
      if (existing) {
        const count = await storage.getAthleteFollowerCount(athleteId);
        return res.status(200).json({ follower: existing, count, alreadyFollowing: true });
      }
      
      const follower = await storage.createAthleteFollower({
        athleteId,
        followerEmail: normalizedEmail,
        followerName: followerName || "Anonymous",
      });
      const count = await storage.getAthleteFollowerCount(athleteId);
      console.log("[Follow] Created email follower, total count:", count);
      
      // Send email notification to athlete about new follower
      if (athlete.email) {
        const { sendNewFollowerEmail } = await import('./emailService');
        const prefs = await storage.getNotificationPreferences(athleteId);
        if (!prefs || prefs.emailOnFollow) {
          const athleteDisplayName = athlete.firstName && athlete.lastName 
            ? `${athlete.firstName} ${athlete.lastName}` 
            : (athlete.username || athlete.name || "Athlete");
          await sendNewFollowerEmail(athlete.email, athleteDisplayName, followerName || "Someone");
        }
      }
      
      res.status(201).json({ follower, count });
    } catch (error: any) {
      console.error("[Follow] Error:", error);
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
      const email = req.query.email as string;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      await storage.deleteAthleteFollowerByEmail(athleteId, email.toLowerCase());
      const count = await storage.getAthleteFollowerCount(athleteId);
      
      res.json({ success: true, count });
    } catch (error) {
      console.error("Error unfollowing athlete:", error);
      res.status(500).json({ error: "Failed to unfollow athlete" });
    }
  });

  // FYR - Send email notification to all athlete followers
  app.post("/api/athletes/:athleteId/fyr", async (req, res) => {
    try {
      console.log("[FYR API] Request received");
      const athleteId = req.params.athleteId;
      const userId = req.query.userId as string;
      const { updateType, hypePostId } = req.body;
      console.log("[FYR API] athleteId:", athleteId, "userId:", userId, "updateType:", updateType);
      
      if (!userId) {
        console.log("[FYR API] No userId provided");
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const athlete = await storage.getUser(athleteId);
      if (!athlete || athlete.role !== 'athlete') {
        console.log("[FYR API] Athlete not found or wrong role");
        return res.status(404).json({ error: "Athlete not found" });
      }
      console.log("[FYR API] Athlete found:", athlete.username);
      
      if (athleteId !== userId) {
        console.log("[FYR API] User mismatch");
        return res.status(403).json({ error: "You can only FYR your own HYPE card" });
      }
      
      const followers = await storage.getAthleteFollowers(athleteId);
      console.log("[FYR API] Found", followers.length, "followers");
      
      if (followers.length === 0) {
        console.log("[FYR API] No followers, returning early");
        return res.json({ 
          success: true, 
          message: "No followers to notify",
          successCount: 0,
          failureCount: 0 
        });
      }
      
      const athleteName = athlete.firstName && athlete.lastName 
        ? `${athlete.firstName} ${athlete.lastName}` 
        : (athlete.name || athlete.username || "Athlete");
      
      // Get the HYPE post message if available
      let postMessage = `Check out the latest from ${athleteName}!`;
      if (hypePostId) {
        const post = await storage.getHypePost(hypePostId);
        if (post) {
          postMessage = post.message;
        }
      }
      
      // Send email notifications to all followers
      const { sendHypePostEmail } = await import('./emailService');
      let successCount = 0;
      let failureCount = 0;
      
      for (const follower of followers) {
        try {
          const result = await sendHypePostEmail(
            follower.followerEmail,
            follower.followerName,
            athleteName,
            athleteId,
            hypePostId || '',
            postMessage
          );
          if (result.success) {
            successCount++;
          } else {
            failureCount++;
          }
        } catch (err) {
          console.error("[FYR API] Email failed for:", follower.followerEmail, err);
          failureCount++;
        }
      }
      
      console.log("[FYR API] Emails sent - success:", successCount, "failed:", failureCount);
      
      const followerCount = await storage.getAthleteFollowerCount(athleteId);
      
      res.json({
        success: successCount > 0,
        successCount,
        failureCount,
        remainingFollowers: followerCount
      });
    } catch (error) {
      console.error("[FYR API] Error:", error);
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
      console.log('[HYPE] Creating new HYPE post...');
      const parsed = insertHypePostSchema.parse(req.body);
      console.log('[HYPE] Athlete ID:', parsed.athleteId);
      
      // Verify the athlete exists
      const athlete = await storage.getUser(parsed.athleteId);
      if (!athlete) {
        return res.status(404).json({ error: "Athlete not found" });
      }
      console.log('[HYPE] Athlete found:', athlete.username);
      
      const post = await storage.createHypePost(parsed);
      console.log('[HYPE] Post created with ID:', post.id);
      
      // Note: Notifications are no longer sent automatically when creating posts
      // Athletes can use the "FYR IT OUT!" button to manually notify followers
      
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

  // ============ HYPES (UNIFIED ENGAGEMENT) ROUTES ============
  
  // Send a hype to an athlete during an event
  app.post("/api/hypes", async (req, res) => {
    try {
      const parsed = insertHypeSchema.parse(req.body);
      
      const hype = await storage.sendHype(parsed);
      
      res.json(hype);
    } catch (error: any) {
      console.error("Error sending hype:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to send hype" });
    }
  });
  
  // Get hypes for a specific event
  app.get("/api/events/:eventId/hypes", async (req, res) => {
    try {
      const hypes = await storage.getEventHypes(req.params.eventId);
      res.json(hypes);
    } catch (error) {
      console.error("Error getting event hypes:", error);
      res.status(500).json({ error: "Failed to get hypes" });
    }
  });
  
  // Get hype count for an athlete in a specific event
  app.get("/api/events/:eventId/athletes/:athleteId/hypes/count", async (req, res) => {
    try {
      const count = await storage.getAthleteEventHypeCount(req.params.athleteId, req.params.eventId);
      res.json({ count });
    } catch (error) {
      console.error("Error getting athlete event hype count:", error);
      res.status(500).json({ error: "Failed to get hype count" });
    }
  });
  
  // Get season total hypes for an athlete on a team
  app.get("/api/teams/:teamId/athletes/:athleteId/hypes/total", async (req, res) => {
    try {
      const total = await storage.getAthleteSeasonHypeTotal(req.params.athleteId, req.params.teamId);
      res.json({ total });
    } catch (error) {
      console.error("Error getting athlete season hype total:", error);
      res.status(500).json({ error: "Failed to get hype total" });
    }
  });
  
  // Get hypes by athlete for an event (leaderboard)
  app.get("/api/events/:eventId/hypes/by-athlete", async (req, res) => {
    try {
      const hypesByAthlete = await storage.getEventHypesByAthlete(req.params.eventId);
      res.json(hypesByAthlete);
    } catch (error) {
      console.error("Error getting hypes by athlete:", error);
      res.status(500).json({ error: "Failed to get hypes by athlete" });
    }
  });

  // ============ DIRECT MESSAGE ROUTES ============

  // Get user's conversations for a team
  app.get("/api/teams/:teamId/conversations", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      // Verify user is a member of this team
      const membership = await storage.getTeamMembership(req.params.teamId, userId);
      if (!membership) {
        return res.status(403).json({ error: "You are not a member of this team" });
      }
      
      const conversations = await storage.getUserConversations(userId, req.params.teamId);
      res.json(conversations);
    } catch (error) {
      console.error("Error getting conversations:", error);
      res.status(500).json({ error: "Failed to get conversations" });
    }
  });

  // Get messages in a specific conversation
  app.get("/api/teams/:teamId/conversations/:otherUserId/messages", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      // Verify both users are members of this team
      const userMembership = await storage.getTeamMembership(req.params.teamId, userId);
      const otherMembership = await storage.getTeamMembership(req.params.teamId, req.params.otherUserId);
      if (!userMembership) {
        return res.status(403).json({ error: "You are not a member of this team" });
      }
      if (!otherMembership) {
        return res.status(400).json({ error: "Other user is not a member of this team" });
      }
      
      const messages = await storage.getConversation(
        req.params.teamId,
        userId,
        req.params.otherUserId,
        parseInt(req.query.limit as string) || 50
      );
      res.json(messages);
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  // Send a direct message
  app.post("/api/teams/:teamId/messages", async (req, res) => {
    try {
      const { senderId, recipientId, content } = req.body;
      if (!senderId || !recipientId || !content) {
        return res.status(400).json({ error: "senderId, recipientId, and content are required" });
      }
      
      // Verify both sender and recipient are members of this team
      const senderMembership = await storage.getTeamMembership(req.params.teamId, senderId);
      const recipientMembership = await storage.getTeamMembership(req.params.teamId, recipientId);
      if (!senderMembership) {
        return res.status(403).json({ error: "Sender is not a member of this team" });
      }
      if (!recipientMembership) {
        return res.status(400).json({ error: "Recipient is not a member of this team" });
      }

      const message = await storage.createDirectMessage({
        teamId: req.params.teamId,
        senderId,
        recipientId,
        content,
      });

      // Return immediately, then process email notification asynchronously
      res.status(201).json(message);

      // Smart notification: delay and check if recipient is actively chatting
      const teamId = req.params.teamId;
      setTimeout(async () => {
        try {
          // Check if recipient is actively viewing conversation with sender
          const isRecipientActive = await storage.isUserActiveInConversation(recipientId, senderId);
          if (isRecipientActive) {
            console.log('[Chat] Skipping notification - recipient is actively viewing conversation');
            return;
          }

          // Check recipient's notification preferences
          const prefs = await storage.getNotificationPreferences(recipientId);
          const pushEnabled = prefs?.pushOnMessage !== false; // Default to true
          const emailEnabled = prefs?.emailOnMessage !== false; // Default to true
          
          const senderName = message.sender.name || message.sender.username || "Team Member";
          const recipientName = message.recipient.name || message.recipient.username || "Team Member";
          const messagePreview = content.length > 50 ? content.substring(0, 50) + '...' : content;
          
          let notificationSent = false;

          // Try push notification first if enabled (via Firebase Cloud Messaging)
          if (pushEnabled) {
            const userTokens = await storage.getUserFcmTokens(recipientId);
            if (userTokens.length > 0) {
              const tokens = userTokens.map(t => t.token);
              const pushResult = await sendPushNotification(
                tokens,
                `Message from ${senderName}`,
                messagePreview,
                { type: 'direct_message', teamId, senderId },
                `${APP_BASE_URL}/chat`
              );
              if (pushResult.success && pushResult.successCount > 0) {
                console.log('[Chat] Push sent to', recipientId);
                notificationSent = true;
              }
            }
          }

          // Fallback to email if push failed/unavailable and email is enabled
          if (!notificationSent && emailEnabled && message.recipient.email) {
            const { sendDirectMessageEmail } = await import('./emailService');
            await sendDirectMessageEmail(
              message.recipient.email,
              recipientName,
              senderName,
              content,
              teamId
            );
            console.log('[Chat] Email sent to', message.recipient.email);
          }
        } catch (err) {
          console.error('[Chat] Notification failed:', err);
        }
      }, 5000); // Wait 5 seconds before checking and sending

      return;
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Mark conversation as read
  app.post("/api/teams/:teamId/conversations/:otherUserId/read", async (req, res) => {
    try {
      const userId = req.body.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      // Verify user is a member of this team
      const membership = await storage.getTeamMembership(req.params.teamId, userId);
      if (!membership) {
        return res.status(403).json({ error: "You are not a member of this team" });
      }
      
      const [minId, maxId] = [userId, req.params.otherUserId].sort();
      const conversationKey = `${req.params.teamId}:${minId}-${maxId}`;
      
      await storage.markConversationRead(userId, conversationKey);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking conversation read:", error);
      res.status(500).json({ error: "Failed to mark conversation read" });
    }
  });

  // Get user's total unread message count
  app.get("/api/users/:userId/unread-count", async (req, res) => {
    try {
      const count = await storage.getUserUnreadMessageCount(req.params.userId);
      res.json({ count });
    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  // ============ CHAT PRESENCE ROUTES ============
  
  // Update user's chat presence (heartbeat while viewing a conversation)
  app.post("/api/teams/:teamId/presence", async (req, res) => {
    try {
      const { userId, conversationWithUserId } = req.body;
      if (!userId || !conversationWithUserId) {
        return res.status(400).json({ error: "userId and conversationWithUserId are required" });
      }
      
      // Verify user is a member of this team
      const membership = await storage.getTeamMembership(req.params.teamId, userId);
      if (!membership) {
        return res.status(403).json({ error: "User is not a member of this team" });
      }
      
      await storage.updateChatPresence(userId, req.params.teamId, conversationWithUserId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating chat presence:", error);
      res.status(500).json({ error: "Failed to update presence" });
    }
  });
  
  // Remove user's chat presence (when leaving conversation)
  app.delete("/api/teams/:teamId/presence", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      // Verify user is a member of this team
      const membership = await storage.getTeamMembership(req.params.teamId, userId);
      if (!membership) {
        return res.status(403).json({ error: "User is not a member of this team" });
      }
      
      await storage.removeChatPresence(userId, req.params.teamId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing chat presence:", error);
      res.status(500).json({ error: "Failed to remove presence" });
    }
  });
  
  // Check if user is actively viewing a conversation with us
  app.get("/api/presence/:userId/active-with/:otherUserId", async (req, res) => {
    try {
      const isActive = await storage.isUserActiveInConversation(req.params.userId, req.params.otherUserId);
      res.json({ isActive });
    } catch (error) {
      console.error("Error checking presence:", error);
      res.status(500).json({ error: "Failed to check presence" });
    }
  });

  // ============ NOTIFICATION PREFERENCES ROUTES ============

  // Get user's notification preferences
  app.get("/api/users/:userId/notification-preferences", async (req, res) => {
    try {
      const prefs = await storage.getNotificationPreferences(req.params.userId);
      // Return defaults if no preferences set
      res.json(prefs || {
        emailOnMessage: true,
        pushOnMessage: true,
        emailOnHype: false,
        pushOnHype: true,
      });
    } catch (error) {
      console.error("Error getting notification preferences:", error);
      res.status(500).json({ error: "Failed to get notification preferences" });
    }
  });

  // Update user's notification preferences
  app.put("/api/users/:userId/notification-preferences", async (req, res) => {
    try {
      const prefs = await storage.upsertNotificationPreferences(req.params.userId, req.body);
      res.json(prefs);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ error: "Failed to update notification preferences" });
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
      
      // Check for Legend badge - returning supporter with 1500+ previous season taps who earns Bronze
      const legendBadge = allBadges.find(b => b.name === 'Legend');
      const bronzeBadge = allBadges.find(b => b.name === 'Bronze');
      
      // Check if supporter earned Bronze this season (100 taps)
      const earnedBronzeThisSeason = tapTotal.totalTaps >= 100;
      
      // Check if supporter had 1500+ taps in any previous season (from archived data)
      let hadGoldTapsInPreviousSeason = false;
      if (legendBadge && bronzeBadge && earnedBronzeThisSeason && !existingBadgeIds.has(legendBadge.id)) {
        // Get all season archives for this team
        const previousSeasonArchives = await storage.getSeasonArchives(teamId);
        
        for (const archive of previousSeasonArchives) {
          if (archive.season !== season) {
            // Check the archived supporterTapTotals for this supporter
            // Gracefully handle archives that predate this column or have null values
            const archivedTapTotals = archive.supporterTapTotals as Array<{ supporterId: string; name: string; taps: number }> | null;
            if (archivedTapTotals && Array.isArray(archivedTapTotals)) {
              const supporterRecord = archivedTapTotals.find(t => t && t.supporterId === supporterId);
              if (supporterRecord && typeof supporterRecord.taps === 'number' && supporterRecord.taps >= 1500) {
                hadGoldTapsInPreviousSeason = true;
                break;
              }
            }
          }
        }
        
        // Award Legend badge if returning supporter with 1500+ previous taps
        if (hadGoldTapsInPreviousSeason) {
          const supporterBadge = await storage.createSupporterBadge({
            supporterId,
            badgeId: legendBadge.id,
            teamId,
            season,
          });
          
          const existingThemes = await storage.getSupporterThemes(supporterId);
          const hasTheme = existingThemes.some(t => t.themeId === legendBadge.themeId);
          if (!hasTheme) {
            await storage.createThemeUnlock({
              supporterId,
              themeId: legendBadge.themeId,
              isActive: false,
            });
          }
          
          newBadges.push({ ...supporterBadge, badge: legendBadge });
          existingBadgeIds.add(legendBadge.id);
        }
      }
      
      // Award regular badges based on tap threshold (skip Legend since it has tapThreshold=0)
      for (const badge of allBadges) {
        // Skip Legend badge (handled specially above) - it has tapThreshold = 0
        if (badge.name === 'Legend') continue;
        
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

  // Helper to parse text date string to Date object
  const parseEventDate = (dateStr: string | Date | null): Date | null => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    const parts = dateStr.trim().split(" ");
    if (parts.length < 2) return null;
    const datePart = parts[0];
    const timePart = parts[1];
    const ampm = parts[2];
    const dateParts = datePart.split("-").map(Number);
    if (dateParts.length < 3) return null;
    const [year, month, day] = dateParts;
    const timeParts = timePart.split(":").map(Number);
    let hour = timeParts[0] || 0;
    const minute = timeParts[1] || 0;
    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    return new Date(year, month - 1, day, hour, minute);
  };

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
          const scheduledStart = parseEventDate(event.date) || new Date();
          const scheduledEnd = parseEventDate(event.endDate) || new Date();
          session = await storage.createLiveSession({
            eventId: event.id,
            teamId: event.teamId,
            status: "scheduled",
            scheduledStart: scheduledStart,
            scheduledEnd: scheduledEnd,
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
      
      const scheduledStart = parseEventDate(event.date) || new Date();
      const scheduledEnd = parseEventDate(event.endDate) || new Date();
      const session = await storage.createLiveSession({
        eventId: event.id,
        teamId: event.teamId,
        status: "scheduled",
        scheduledStart: scheduledStart,
        scheduledEnd: scheduledEnd,
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
      
      // Send email notifications to all supporters in the team
      (async () => {
        try {
          const { sendGameDayLiveEmail } = await import('./emailService');
          const event = session.eventId ? await storage.getEvent(session.eventId) : null;
          const team = await storage.getTeam(session.teamId);
          const members = await storage.getTeamMembers(session.teamId);
          const supporters = members.filter(m => m.role === "supporter" && m.user?.email);
          
          const eventDate = event?.date || '';
          const opponent = event?.opponent || null;
          const teamName = team?.name || 'Your Team';
          
          for (const supporter of supporters) {
            if (supporter.user?.email) {
              sendGameDayLiveEmail(
                supporter.user.email,
                supporter.user.name || supporter.user.firstName || 'Supporter',
                teamName,
                opponent,
                eventDate,
                session.eventId || ''
              ).catch(err => console.error('[Email] Failed to send Game Day Live email:', err));
            }
          }
          console.log(`[GameDayLive] Sent email notifications to ${supporters.length} supporters`);
        } catch (err) {
          console.error('[GameDayLive] Error sending email notifications:', err);
        }
      })();
      
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

  // Get team engagement stats (total taps and shoutouts)
  app.get("/api/teams/:teamId/engagement-stats", async (req, res) => {
    try {
      const stats = await storage.getTeamEngagementStats(req.params.teamId);
      res.json(stats);
    } catch (error) {
      console.error("Error getting team engagement stats:", error);
      res.status(500).json({ error: "Failed to get engagement stats" });
    }
  });

  // Get top tappers leaderboard for a team
  app.get("/api/teams/:teamId/top-tappers", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const topTappers = await storage.getTopTappers(req.params.teamId, limit);
      res.json(topTappers);
    } catch (error) {
      console.error("Error getting top tappers:", error);
      res.status(500).json({ error: "Failed to get top tappers" });
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
        
        // Parse event dates
        const eventStartDate = parseEventDate(event.date);
        const eventEndDate = parseEventDate(event.endDate);
        
        // Auto-create session if within 15 min of start
        if (!session && eventStartDate && eventStartDate <= autoStartWindow && eventStartDate >= now) {
          session = await storage.createLiveSession({
            eventId: event.id,
            teamId: event.teamId,
            status: "scheduled",
            scheduledStart: eventStartDate,
            scheduledEnd: eventEndDate,
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
      console.log("[Admin] Fetching all teams...");
      const allTeams = await storage.getAllTeams();
      console.log("[Admin] Found", allTeams.length, "teams:", allTeams.map(t => t.name));
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
          return { ...team, members, coach: safeCoach, memberCount: members.length };
        })
      );
      console.log("[Admin] Returning", teamsWithMembers.length, "teams with members");
      res.json(teamsWithMembers);
    } catch (error) {
      console.error("Admin get teams failed:", error);
      res.status(500).json({ error: "Failed to get teams" });
    }
  });

  // Get all users (for admin panel)
  app.get("/api/admin/users", requireSuperAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const safeUsers = allUsers.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Admin get users failed:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  // Get all subscriptions with user info (for admin panel)
  app.get("/api/admin/subscriptions", requireSuperAdmin, async (req, res) => {
    try {
      const { stripeService } = await import("./stripeService");
      const allUsers = await storage.getAllUsers();
      const subscriptionsWithUsers = await Promise.all(
        allUsers.map(async (user) => {
          const subscription = await stripeService.getUserSubscription(user.id);
          const { password, ...safeUser } = user;
          const defaultSubscription = {
            id: null,
            userId: user.id,
            tier: 'free',
            status: 'active',
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            currentPeriodStart: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          };
          return {
            user: safeUser,
            subscription: subscription ? { ...defaultSubscription, ...subscription } : defaultSubscription
          };
        })
      );
      res.json(subscriptionsWithUsers);
    } catch (error) {
      console.error("Admin get subscriptions failed:", error);
      res.status(500).json({ error: "Failed to get subscriptions" });
    }
  });

  // Get single user subscription (for admin panel)
  app.get("/api/admin/subscriptions/:userId", requireSuperAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { stripeService } = await import("./stripeService");
      const subscription = await stripeService.getUserSubscription(userId);
      const defaultSubscription = {
        id: null,
        userId,
        tier: 'free',
        status: 'active',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
      res.json({ subscription: subscription ? { ...defaultSubscription, ...subscription } : defaultSubscription });
    } catch (error) {
      console.error("Admin get user subscription failed:", error);
      res.status(500).json({ error: "Failed to get subscription" });
    }
  });

  // Admin update user subscription tier (manual override)
  app.patch("/api/admin/subscriptions/:userId", requireSuperAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { tier, status } = req.body;
      
      if (!tier || !['free', 'coach', 'athlete', 'supporter'].includes(tier)) {
        return res.status(400).json({ error: "Valid tier required: free, coach, athlete, supporter" });
      }

      const { stripeService } = await import("./stripeService");
      
      // Upsert the subscription with the new tier
      await stripeService.upsertSubscription(userId, {
        tier,
        status: status || 'active',
      });

      const updated = await stripeService.getUserSubscription(userId);
      res.json({ subscription: updated, message: `Subscription updated to ${tier}` });
    } catch (error) {
      console.error("Admin update subscription failed:", error);
      res.status(500).json({ error: "Failed to update subscription" });
    }
  });

  // ============ ADMIN MESSAGING ROUTES ============

  // Send broadcast to all users
  app.post("/api/admin/broadcast", requireSuperAdmin, async (req, res) => {
    try {
      const { title, message, sendPush } = req.body;
      const adminUser = (req as any).adminUser;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Create the broadcast message
      const broadcastMsg = await storage.createAdminMessage({
        senderId: adminUser.id,
        recipientId: null,
        type: "broadcast",
        message,
        title: title || "STATFYR Announcement",
      });

      // Get all users and create receipts
      const allUsers = await storage.getAllUsersForBroadcast();
      const userIds = allUsers.map(u => u.id);
      await storage.createBroadcastReceipts(broadcastMsg.id, userIds);

      // Send push notifications if requested
      let pushResult = { successCount: 0, failureCount: 0 };
      if (sendPush) {
        const { sendPushNotification } = await import("./firebaseAdmin");
        
        // Get FCM tokens for all users
        for (const user of allUsers) {
          const tokens = await storage.getUserFcmTokens(user.id);
          if (tokens.length > 0) {
            const tokenStrings = tokens.map((t: { token: string }) => t.token);
            const result = await sendPushNotification(
              tokenStrings,
              title || "STATFYR Announcement",
              message,
              { type: "broadcast", messageId: broadcastMsg.id }
            );
            pushResult.successCount += result.successCount;
            pushResult.failureCount += result.failureCount;
          }
        }
      }

      res.json({
        success: true,
        message: broadcastMsg,
        recipientCount: userIds.length,
        pushResult,
      });
    } catch (error: any) {
      console.error("Admin broadcast failed:", error);
      console.error("Error details:", error?.message, error?.stack);
      res.status(500).json({ error: `Failed to send broadcast: ${error?.message || 'Unknown error'}` });
    }
  });

  // Get all broadcasts sent
  app.get("/api/admin/broadcasts", requireSuperAdmin, async (req, res) => {
    try {
      const broadcasts = await storage.getAdminBroadcasts();
      res.json(broadcasts);
    } catch (error) {
      console.error("Get broadcasts failed:", error);
      res.status(500).json({ error: "Failed to get broadcasts" });
    }
  });

  // Send direct support message to a user
  app.post("/api/admin/message/:userId", requireSuperAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { message, sendPush } = req.body;
      const adminUser = (req as any).adminUser;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Verify user exists
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Create the support message
      const supportMsg = await storage.createAdminMessage({
        senderId: adminUser.id,
        recipientId: userId,
        type: "support",
        message,
        title: null,
      });

      // Create receipt for the user
      await storage.createAdminMessageReceipt({
        messageId: supportMsg.id,
        userId,
        sentViaPush: false,
        deliveredAt: new Date(),
      });

      // Send push notification if requested
      let pushSent = false;
      if (sendPush) {
        const { sendPushNotification } = await import("./firebaseAdmin");
        const tokens = await storage.getUserFcmTokens(userId);
        if (tokens.length > 0) {
          const tokenStrings = tokens.map((t: { token: string }) => t.token);
          const result = await sendPushNotification(
            tokenStrings,
            "STATFYR Support",
            message,
            { type: "support", messageId: supportMsg.id }
          );
          pushSent = result.successCount > 0;
        }
      }

      res.json({
        success: true,
        message: supportMsg,
        pushSent,
      });
    } catch (error) {
      console.error("Admin support message failed:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Get all support conversations (admin view)
  app.get("/api/admin/conversations", requireSuperAdmin, async (req, res) => {
    try {
      const conversations = await storage.getAdminSupportConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Get admin conversations failed:", error);
      res.status(500).json({ error: "Failed to get conversations" });
    }
  });

  // Get conversation with a specific user (admin view)
  app.get("/api/admin/conversations/:userId", requireSuperAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const messages = await storage.getAdminConversation(userId);
      res.json(messages);
    } catch (error) {
      console.error("Get admin conversation failed:", error);
      res.status(500).json({ error: "Failed to get conversation" });
    }
  });

  // User endpoint: Get messages from STATFYR Support
  app.get("/api/user/support-messages", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const messages = await storage.getUserAdminMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Get user support messages failed:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  // User endpoint: Mark message as read
  app.post("/api/user/support-messages/:messageId/read", async (req, res) => {
    try {
      const userId = req.body.userId as string;
      const { messageId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      await storage.markAdminMessageRead(userId, messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark message read failed:", error);
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  // ============ STRIPE SUBSCRIPTION ROUTES ============
  
  // Get Stripe publishable key for frontend
  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const { getStripePublishableKey } = await import("./stripeClient");
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Failed to get Stripe publishable key:", error);
      res.status(500).json({ error: "Stripe not configured" });
    }
  });

  // Get products with prices
  app.get("/api/stripe/products", async (req, res) => {
    try {
      const { stripeService } = await import("./stripeService");
      const rows = await stripeService.listProductsWithPrices();
      
      const productsMap = new Map<string, any>();
      for (const row of rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
            metadata: row.price_metadata,
          });
        }
      }

      res.json({ products: Array.from(productsMap.values()) });
    } catch (error) {
      console.error("Failed to get products:", error);
      res.status(500).json({ error: "Failed to get products" });
    }
  });

  // Get current user's subscription
  app.get("/api/subscription", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { stripeService } = await import("./stripeService");
      const subscription = await stripeService.getUserSubscription(userId);
      res.json({ subscription });
    } catch (error) {
      console.error("Failed to get subscription:", error);
      res.status(500).json({ error: "Failed to get subscription" });
    }
  });

  // Create checkout session
  app.post("/api/stripe/checkout", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const { priceId, tier } = req.body;
      if (!priceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }

      const { stripeService } = await import("./stripeService");
      
      let subscription = await stripeService.getUserSubscription(userId);
      let customerId = subscription?.stripeCustomerId;

      if (!customerId) {
        const customer = await stripeService.createCustomer(user.email || '', userId);
        customerId = customer.id;
        await stripeService.upsertSubscription(userId, { stripeCustomerId: customerId });
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        `${baseUrl}/subscription/cancel`,
        { userId, tier: tier || 'supporter' }
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Create customer portal session
  app.post("/api/stripe/portal", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const { stripeService } = await import("./stripeService");
      const subscription = await stripeService.getUserSubscription(userId);
      
      if (!subscription?.stripeCustomerId) {
        return res.status(400).json({ error: "No subscription found" });
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const session = await stripeService.createCustomerPortalSession(
        subscription.stripeCustomerId,
        `${baseUrl}/dashboard`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Failed to create portal session:", error);
      res.status(500).json({ error: "Failed to create portal session" });
    }
  });

  // Get user entitlements based on subscription tier and team roles
  app.get("/api/entitlements", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.json({ entitlements: getDefaultEntitlements() });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.json({ entitlements: getDefaultEntitlements() });
      }

      const { stripeService } = await import("./stripeService");
      const subscription = await stripeService.getUserSubscription(userId);
      const tier = subscription?.status === 'active' ? subscription.tier : 'free';

      const teams = await storage.getUserTeams(userId);
      
      const hasCoachRole = user?.role === 'coach' || teams.some((t: any) => t.role === 'coach');
      const hasStaffRole = teams.some((t: any) => t.role === 'staff');
      const hasAthleteRole = user?.role === 'athlete' || teams.some((t: any) => t.role === 'athlete');

      const entitlements = computeEntitlements(tier, hasCoachRole, hasStaffRole, hasAthleteRole);
      res.json({ entitlements, tier, subscription });
    } catch (error) {
      console.error("Failed to get entitlements:", error);
      res.json({ entitlements: getDefaultEntitlements() });
    }
  });

  // ==================== Supporter Athlete Following ====================
  
  // Get supporter's followed athletes
  app.get("/api/supporter/following", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const links = await storage.getSupporterAthleteLinks(userId);
      res.json({ following: links });
    } catch (error) {
      console.error("Failed to get followed athletes:", error);
      res.status(500).json({ error: "Failed to get followed athletes" });
    }
  });

  // Follow an athlete
  app.post("/api/supporter/follow/:athleteId", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { athleteId } = req.params;
      const { nickname } = req.body;

      // Check if athlete exists
      const athlete = await storage.getUser(athleteId);
      if (!athlete || athlete.role !== 'athlete') {
        return res.status(404).json({ error: "Athlete not found" });
      }

      // Check if already following
      const existingLink = await storage.getSupporterAthleteLink(userId, athleteId);
      if (existingLink) {
        return res.status(400).json({ error: "Already following this athlete" });
      }

      // Get supporter's teams and athlete's teams to determine if cross-team
      const supporterMemberships = await storage.getUserTeamMemberships(userId);
      const athleteMemberships = await storage.getUserTeamMemberships(athleteId);
      
      const supporterTeamIds = new Set(supporterMemberships.map(m => m.teamId));
      const sharedTeam = athleteMemberships.find(m => supporterTeamIds.has(m.teamId));
      
      const isCrossTeamFollow = !sharedTeam;
      
      if (isCrossTeamFollow) {
        // Check if user has cross-team following entitlement
        const { stripeService } = await import("./stripeService");
        const subscription = await stripeService.getUserSubscription(userId);
        const tier = subscription?.status === 'active' ? subscription.tier : 'free';
        
        if (tier !== 'supporter') {
          return res.status(403).json({ 
            error: "Cross-team following requires Supporter Pro subscription",
            requiresUpgrade: true,
            tier: 'supporter'
          });
        }
      }

      // Store the shared team ID if same-team, null for cross-team
      const teamIdToStore = sharedTeam?.teamId || null;
      const link = await storage.createSupporterAthleteLink({
        supporterId: userId,
        athleteId,
        teamId: teamIdToStore,
        nickname: nickname || null,
      });
      res.json({ link, isCrossTeam: isCrossTeamFollow });
    } catch (error) {
      console.error("Failed to follow athlete:", error);
      res.status(500).json({ error: "Failed to follow athlete" });
    }
  });

  // Unfollow an athlete
  app.delete("/api/supporter/follow/:athleteId", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { athleteId } = req.params;

      const link = await storage.getSupporterAthleteLink(userId, athleteId);
      if (!link) {
        return res.status(404).json({ error: "Not following this athlete" });
      }

      await storage.deleteSupporterAthleteLink(link.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to unfollow athlete:", error);
      res.status(500).json({ error: "Failed to unfollow athlete" });
    }
  });

  // Update follow nickname
  app.patch("/api/supporter/follow/:athleteId", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { athleteId } = req.params;
      const { nickname } = req.body;

      const link = await storage.getSupporterAthleteLink(userId, athleteId);
      if (!link) {
        return res.status(404).json({ error: "Not following this athlete" });
      }

      await storage.updateSupporterAthleteLink(link.id, { nickname });
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to update follow:", error);
      res.status(500).json({ error: "Failed to update follow" });
    }
  });

  // Search athletes to follow (accessible to all supporters)
  app.get("/api/supporter/search-athletes", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json({ athletes: [] });
      }

      // Search users who are athletes
      const allUsers = await storage.searchUsers(query);
      const athletes = allUsers.filter(u => u.role === 'athlete');
      
      // Get current following to mark them
      const following = await storage.getSupporterAthleteLinks(userId);
      const followingIds = new Set(following.map(f => f.athleteId));
      
      const results = athletes.map(a => ({
        id: a.id,
        name: a.name || a.username || a.email,
        position: a.position,
        number: a.number,
        profileImageUrl: a.profileImageUrl,
        isFollowing: followingIds.has(a.id),
      }));

      res.json({ athletes: results });
    } catch (error) {
      console.error("Failed to search athletes:", error);
      res.status(500).json({ error: "Failed to search athletes" });
    }
  });

  // Follow athlete by athlete code
  app.post("/api/supporter/follow-by-code", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: "Athlete code is required" });
      }

      // Find athlete by their personal code
      const athlete = await storage.findAthleteByCode(code.toUpperCase());
      if (!athlete) {
        return res.status(404).json({ error: "Invalid athlete code" });
      }

      // Check if already following
      const existingLink = await storage.getSupporterAthleteLink(userId, athlete.id);
      if (existingLink) {
        return res.status(400).json({ error: "Already following this athlete" });
      }

      // Get one of the athlete's teams if they're on any
      const athleteTeams = await storage.getTeamsByUserId(athlete.id);
      const teamId = athleteTeams.length > 0 ? athleteTeams[0].id : null;

      // Create the follow link
      const link = await storage.createSupporterAthleteLink({
        supporterId: userId,
        athleteId: athlete.id,
        teamId,
        nickname: null,
      });

      res.json({ 
        success: true, 
        athlete: {
          id: athlete.id,
          name: athlete.name || athlete.username || athlete.email,
          position: athlete.position,
          number: athlete.number,
          profileImageUrl: athlete.profileImageUrl,
        },
        link 
      });
    } catch (error) {
      console.error("Failed to follow athlete by code:", error);
      res.status(500).json({ error: "Failed to follow athlete by code" });
    }
  });

  // ==================== Supporter Stats (Fallback Tracking) ====================
  
  // Get supporter's stats for an athlete
  app.get("/api/supporter/stats/:athleteId", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { athleteId } = req.params;
      const { eventId } = req.query;

      const stats = await storage.getSupporterStats(userId, athleteId, eventId as string | undefined);
      res.json({ stats });
    } catch (error) {
      console.error("Failed to get supporter stats:", error);
      res.status(500).json({ error: "Failed to get supporter stats" });
    }
  });

  // Record a supporter stat
  app.post("/api/supporter/stats", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Check if user has canTrackOwnStats entitlement
      const { stripeService } = await import("./stripeService");
      const subscription = await stripeService.getUserSubscription(userId);
      const tier = subscription?.status === 'active' ? subscription.tier : 'free';
      
      if (tier !== 'supporter') {
        return res.status(403).json({ 
          error: "Tracking your own stats requires Supporter Pro subscription",
          requiresUpgrade: true,
          tier: 'supporter'
        });
      }

      const { athleteId, eventId, teamId, statName, statValue, period, notes } = req.body;

      if (!athleteId || !teamId || !statName) {
        return res.status(400).json({ error: "Missing required fields: athleteId, teamId, statName" });
      }

      // Verify the supporter follows this athlete
      const followLink = await storage.getSupporterAthleteLink(userId, athleteId);
      if (!followLink) {
        return res.status(403).json({ error: "You must follow this athlete to track their stats" });
      }

      const stat = await storage.createSupporterStat({
        supporterId: userId,
        athleteId,
        eventId: eventId || null,
        teamId,
        statName,
        statValue: statValue || 1,
        period: period || null,
        notes: notes || null,
      });

      res.json({ stat });
    } catch (error) {
      console.error("Failed to record supporter stat:", error);
      res.status(500).json({ error: "Failed to record supporter stat" });
    }
  });

  // Delete a supporter stat
  app.delete("/api/supporter/stats/:id", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id } = req.params;
      
      // Verify the stat belongs to the requesting user
      const stat = await storage.getSupporterStatById(id);
      if (!stat) {
        return res.status(404).json({ error: "Stat not found" });
      }
      if (stat.supporterId !== userId) {
        return res.status(403).json({ error: "You can only delete your own stats" });
      }
      
      await storage.deleteSupporterStat(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete supporter stat:", error);
      res.status(500).json({ error: "Failed to delete supporter stat" });
    }
  });

  // Get aggregate supporter stats for an athlete
  app.get("/api/supporter/stats/:athleteId/aggregate", async (req, res) => {
    try {
      const { athleteId } = req.params;
      const { teamId } = req.query;

      if (!teamId) {
        return res.status(400).json({ error: "teamId is required" });
      }

      const aggregate = await storage.getAthleteSupporterStatsAggregate(athleteId, teamId as string);
      res.json({ aggregate });
    } catch (error) {
      console.error("Failed to get aggregate supporter stats:", error);
      res.status(500).json({ error: "Failed to get aggregate supporter stats" });
    }
  });

  // ==================== Supporter Managed Athletes ====================

  // Get supporter's managed athletes (independently managed)
  app.get("/api/supporter/managed-athletes", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const managedAthletes = await storage.getManagedAthletes(userId);
      res.json({ managedAthletes });
    } catch (error) {
      console.error("Failed to get managed athletes:", error);
      res.status(500).json({ error: "Failed to get managed athletes" });
    }
  });

  // Create a new managed athlete (independent - not linked to existing user)
  app.post("/api/supporter/managed-athletes", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { supporterId, athleteName, sport, position, number } = req.body;
      
      if (supporterId !== userId) {
        return res.status(403).json({ error: "Cannot create managed athlete for another user" });
      }

      if (!athleteName || !sport) {
        return res.status(400).json({ error: "athleteName and sport are required" });
      }

      // Verify the supporter exists in the database (handles stale sessions)
      const supporter = await storage.getUser(supporterId);
      if (!supporter) {
        return res.status(401).json({ error: "Session expired. Please log out and log back in." });
      }

      const managedAthlete = await storage.createManagedAthlete({
        supporterId,
        athleteId: null,
        athleteName,
        sport,
        position: position || null,
        number: number || null,
        isOwner: true,
        profileImageUrl: null,
      });

      res.json({ managedAthlete, athlete: { name: athleteName } });
    } catch (error) {
      console.error("Failed to create managed athlete:", error);
      res.status(500).json({ error: "Failed to create managed athlete" });
    }
  });

  // Update a managed athlete
  app.patch("/api/supporter/managed-athletes/:id", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id } = req.params;
      const { athleteName, sport, position, number, profileImageUrl, nickname } = req.body;

      const existing = await storage.getManagedAthleteById(id);
      if (!existing) {
        return res.status(404).json({ error: "Managed athlete not found" });
      }
      if (existing.supporterId !== userId) {
        return res.status(403).json({ error: "Cannot update another user's managed athlete" });
      }

      // Build updates object with only defined values
      const updates: Partial<{
        athleteName: string;
        sport: string;
        position: string | null;
        number: string | null;
        profileImageUrl: string | null;
        nickname: string | null;
      }> = {};
      
      if (athleteName !== undefined) updates.athleteName = athleteName;
      if (sport !== undefined) updates.sport = sport;
      if (position !== undefined) updates.position = position;
      if (number !== undefined) updates.number = number;
      if (profileImageUrl !== undefined) updates.profileImageUrl = profileImageUrl;
      if (nickname !== undefined) updates.nickname = nickname;

      const updated = await storage.updateManagedAthlete(id, updates);
      res.json({ managedAthlete: updated });
    } catch (error) {
      console.error("Failed to update managed athlete:", error);
      res.status(500).json({ error: "Failed to update managed athlete" });
    }
  });

  // Delete a managed athlete
  app.delete("/api/supporter/managed-athletes/:id", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id } = req.params;

      const existing = await storage.getManagedAthleteById(id);
      if (!existing) {
        return res.status(404).json({ error: "Managed athlete not found" });
      }
      if (existing.supporterId !== userId) {
        return res.status(403).json({ error: "Cannot delete another user's managed athlete" });
      }

      await storage.deleteManagedAthlete(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete managed athlete:", error);
      res.status(500).json({ error: "Failed to delete managed athlete" });
    }
  });

  // ==================== Supporter Events ====================

  // Get events for a managed athlete
  app.get("/api/supporter/managed-athletes/:id/events", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id } = req.params;

      const managedAthlete = await storage.getManagedAthleteById(id);
      if (!managedAthlete) {
        return res.status(404).json({ error: "Managed athlete not found" });
      }
      if (managedAthlete.supporterId !== userId) {
        return res.status(403).json({ error: "Cannot view events for another user's managed athlete" });
      }

      const events = await storage.getSupporterEvents(id);
      res.json({ events });
    } catch (error) {
      console.error("Failed to get supporter events:", error);
      res.status(500).json({ error: "Failed to get supporter events" });
    }
  });

  // Create an event for a managed athlete
  app.post("/api/supporter/managed-athletes/:id/events", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id } = req.params;
      const { title, description, eventType, startTime, endTime, location, opponentName } = req.body;

      const managedAthlete = await storage.getManagedAthleteById(id);
      if (!managedAthlete) {
        return res.status(404).json({ error: "Managed athlete not found" });
      }
      if (managedAthlete.supporterId !== userId) {
        return res.status(403).json({ error: "Cannot create events for another user's managed athlete" });
      }

      if (!title || !startTime) {
        return res.status(400).json({ error: "title and startTime are required" });
      }

      const event = await storage.createSupporterEvent({
        supporterId: userId,
        managedAthleteId: id,
        title,
        description: description || null,
        eventType: eventType || "game",
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        location: location || null,
        opponentName: opponentName || null,
      });

      res.json({ event });
    } catch (error) {
      console.error("Failed to create supporter event:", error);
      res.status(500).json({ error: "Failed to create supporter event" });
    }
  });

  // Update a supporter event
  app.patch("/api/supporter/events/:eventId", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { eventId } = req.params;
      const { title, description, eventType, startTime, endTime, location, opponentName } = req.body;

      const existing = await storage.getSupporterEventById(eventId);
      if (!existing) {
        return res.status(404).json({ error: "Event not found" });
      }
      if (existing.supporterId !== userId) {
        return res.status(403).json({ error: "Cannot update another user's event" });
      }

      // Build updates object with only defined values
      const updates: Partial<{
        title: string;
        description: string | null;
        eventType: string;
        startTime: Date;
        endTime: Date | null;
        location: string | null;
        opponentName: string | null;
      }> = {};
      
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (eventType !== undefined) updates.eventType = eventType;
      if (startTime !== undefined) updates.startTime = new Date(startTime);
      if (endTime !== undefined) updates.endTime = endTime ? new Date(endTime) : null;
      if (location !== undefined) updates.location = location;
      if (opponentName !== undefined) updates.opponentName = opponentName;

      const updated = await storage.updateSupporterEvent(eventId, updates);
      res.json({ event: updated });
    } catch (error) {
      console.error("Failed to update supporter event:", error);
      res.status(500).json({ error: "Failed to update supporter event" });
    }
  });

  // Delete a supporter event
  app.delete("/api/supporter/events/:eventId", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { eventId } = req.params;

      const existing = await storage.getSupporterEventById(eventId);
      if (!existing) {
        return res.status(404).json({ error: "Event not found" });
      }
      if (existing.supporterId !== userId) {
        return res.status(403).json({ error: "Cannot delete another user's event" });
      }

      await storage.deleteSupporterEvent(eventId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete supporter event:", error);
      res.status(500).json({ error: "Failed to delete supporter event" });
    }
  });

  // ==================== Supporter Stat Session Endpoints ====================

  // Get stat sessions for a managed athlete
  app.get("/api/supporter/managed-athletes/:id/stat-sessions", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id: managedAthleteId } = req.params;
      
      const managed = await storage.getManagedAthleteById(managedAthleteId);
      if (!managed) {
        return res.status(404).json({ error: "Managed athlete not found" });
      }
      if (managed.supporterId !== userId) {
        return res.status(403).json({ error: "Not your managed athlete" });
      }

      const sessions = await storage.getSupporterStatSessions(managedAthleteId);
      res.json({ sessions });
    } catch (error) {
      console.error("Failed to get supporter stat sessions:", error);
      res.status(500).json({ error: "Failed to get stat sessions" });
    }
  });

  // Get stats summary for a managed athlete
  app.get("/api/supporter/managed-athletes/:id/stats-summary", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id: managedAthleteId } = req.params;
      
      const managed = await storage.getManagedAthleteById(managedAthleteId);
      if (!managed) {
        return res.status(404).json({ error: "Managed athlete not found" });
      }
      if (managed.supporterId !== userId) {
        return res.status(403).json({ error: "Not your managed athlete" });
      }

      const summary = await storage.getSupporterStatsSummary(managedAthleteId);
      res.json(summary);
    } catch (error) {
      console.error("Failed to get supporter stats summary:", error);
      res.status(500).json({ error: "Failed to get stats summary" });
    }
  });

  // Create a stat session
  app.post("/api/supporter/managed-athletes/:id/stat-sessions", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id: managedAthleteId } = req.params;
      const { eventId, sport, opponentName, totalPeriods, periodType } = req.body;
      
      const managed = await storage.getManagedAthleteById(managedAthleteId);
      if (!managed) {
        return res.status(404).json({ error: "Managed athlete not found" });
      }
      if (managed.supporterId !== userId) {
        return res.status(403).json({ error: "Not your managed athlete" });
      }

      const session = await storage.createSupporterStatSession({
        supporterId: userId,
        managedAthleteId,
        eventId: eventId || null,
        sport: sport || managed.sport || null,
        opponentName: opponentName || null,
        totalPeriods: totalPeriods || 4,
        periodType: periodType || "quarter",
      });

      res.json({ session });
    } catch (error) {
      console.error("Failed to create supporter stat session:", error);
      res.status(500).json({ error: "Failed to create stat session" });
    }
  });

  // Update a stat session
  app.patch("/api/supporter/stat-sessions/:sessionId", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { sessionId } = req.params;
      const { status, currentPeriod, athleteScore, opponentScore, endedAt } = req.body;

      const session = await storage.getSupporterStatSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      if (session.supporterId !== userId) {
        return res.status(403).json({ error: "Not your session" });
      }

      const updates: any = {};
      if (status !== undefined) updates.status = status;
      if (currentPeriod !== undefined) updates.currentPeriod = currentPeriod;
      if (athleteScore !== undefined) updates.athleteScore = athleteScore;
      if (opponentScore !== undefined) updates.opponentScore = opponentScore;
      if (endedAt !== undefined) updates.endedAt = endedAt ? new Date(endedAt) : null;

      const updated = await storage.updateSupporterStatSession(sessionId, updates);
      res.json({ session: updated });
    } catch (error) {
      console.error("Failed to update supporter stat session:", error);
      res.status(500).json({ error: "Failed to update stat session" });
    }
  });

  // Delete a stat session
  app.delete("/api/supporter/stat-sessions/:sessionId", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { sessionId } = req.params;

      const session = await storage.getSupporterStatSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      if (session.supporterId !== userId) {
        return res.status(403).json({ error: "Not your session" });
      }

      await storage.deleteSupporterStatSession(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete supporter stat session:", error);
      res.status(500).json({ error: "Failed to delete stat session" });
    }
  });

  // Get entries for a stat session
  app.get("/api/supporter/stat-sessions/:sessionId/entries", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { sessionId } = req.params;

      const session = await storage.getSupporterStatSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      if (session.supporterId !== userId) {
        return res.status(403).json({ error: "Not your session" });
      }

      const entries = await storage.getSupporterStatEntries(sessionId);
      res.json({ entries });
    } catch (error) {
      console.error("Failed to get supporter stat entries:", error);
      res.status(500).json({ error: "Failed to get stat entries" });
    }
  });

  // Create a stat entry
  app.post("/api/supporter/stat-sessions/:sessionId/entries", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { sessionId } = req.params;
      const { statName, statShortName, value, pointsValue, period } = req.body;

      if (!statName) {
        return res.status(400).json({ error: "statName is required" });
      }

      const session = await storage.getSupporterStatSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      if (session.supporterId !== userId) {
        return res.status(403).json({ error: "Not your session" });
      }

      const entry = await storage.createSupporterStatEntry({
        sessionId,
        statName,
        statShortName: statShortName || null,
        value: value || 1,
        pointsValue: pointsValue || 0,
        period: period || session.currentPeriod,
      });

      // Update athlete score if pointsValue > 0
      if (pointsValue && pointsValue > 0) {
        await storage.updateSupporterStatSession(sessionId, {
          athleteScore: session.athleteScore + pointsValue,
        });
      }

      res.json({ entry });
    } catch (error) {
      console.error("Failed to create supporter stat entry:", error);
      res.status(500).json({ error: "Failed to create stat entry" });
    }
  });

  // Delete a stat entry
  app.delete("/api/supporter/stat-entries/:entryId", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { entryId } = req.params;

      // Verify ownership via session
      const entry = await storage.getSupporterStatEntry(entryId);
      if (!entry) {
        return res.status(404).json({ error: "Entry not found" });
      }
      
      const session = await storage.getSupporterStatSession(entry.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      if (session.supporterId !== userId) {
        return res.status(403).json({ error: "Not your stat entry" });
      }

      await storage.deleteSupporterStatEntry(entryId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete supporter stat entry:", error);
      res.status(500).json({ error: "Failed to delete stat entry" });
    }
  });

  // ==================== Supporter Season Management ====================

  // Get season archives for a managed athlete
  app.get("/api/supporter/managed-athletes/:id/season-archives", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id: managedAthleteId } = req.params;
      
      const managed = await storage.getManagedAthleteById(managedAthleteId);
      if (!managed) {
        return res.status(404).json({ error: "Managed athlete not found" });
      }
      if (managed.supporterId !== userId) {
        return res.status(403).json({ error: "Not your managed athlete" });
      }

      const archives = await storage.getSupporterSeasonArchives(managedAthleteId);
      res.json({ archives });
    } catch (error) {
      console.error("Failed to get supporter season archives:", error);
      res.status(500).json({ error: "Failed to get season archives" });
    }
  });

  // Start a new season for a managed athlete
  app.post("/api/supporter/managed-athletes/:id/start-season", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id: managedAthleteId } = req.params;
      const { season } = req.body;
      
      if (!season) {
        return res.status(400).json({ error: "Season name is required" });
      }

      const managed = await storage.getManagedAthleteById(managedAthleteId);
      if (!managed) {
        return res.status(404).json({ error: "Managed athlete not found" });
      }
      if (managed.supporterId !== userId) {
        return res.status(403).json({ error: "Not your managed athlete" });
      }

      // Update managed athlete with new season
      const updated = await storage.updateManagedAthlete(managedAthleteId, {
        season,
        seasonStatus: 'active',
      });

      res.json({ managedAthlete: updated });
    } catch (error) {
      console.error("Failed to start supporter season:", error);
      res.status(500).json({ error: "Failed to start season" });
    }
  });

  // End the current season for a managed athlete
  app.post("/api/supporter/managed-athletes/:id/end-season", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id: managedAthleteId } = req.params;

      const managed = await storage.getManagedAthleteById(managedAthleteId);
      if (!managed) {
        return res.status(404).json({ error: "Managed athlete not found" });
      }
      if (managed.supporterId !== userId) {
        return res.status(403).json({ error: "Not your managed athlete" });
      }
      if (!managed.season) {
        return res.status(400).json({ error: "No active season to end" });
      }

      const archive = await storage.endSupporterSeason(userId, managedAthleteId);
      res.json({ archive });
    } catch (error) {
      console.error("Failed to end supporter season:", error);
      res.status(500).json({ error: "Failed to end season" });
    }
  });

  // ==================== Athlete Code Endpoints ====================

  // Get athlete's personal code
  app.get("/api/athlete/code", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role !== 'athlete') {
        return res.status(403).json({ error: "Only athletes have personal codes" });
      }

      // Generate code if not exists
      let code = user.athleteCode;
      if (!code) {
        code = await storage.generateAndSetAthleteCode(userId);
      }

      res.json({ code });
    } catch (error) {
      console.error("Failed to get athlete code:", error);
      res.status(500).json({ error: "Failed to get athlete code" });
    }
  });

  // Regenerate athlete's personal code
  app.post("/api/athlete/code/regenerate", async (req, res) => {
    try {
      const oauthUser = (req as any).user?.claims?.sub;
      const headerUserId = req.headers["x-user-id"] as string;
      const userId = oauthUser || headerUserId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role !== 'athlete') {
        return res.status(403).json({ error: "Only athletes can regenerate personal codes" });
      }

      const code = await storage.generateAndSetAthleteCode(userId);
      res.json({ code });
    } catch (error) {
      console.error("Failed to regenerate athlete code:", error);
      res.status(500).json({ error: "Failed to regenerate athlete code" });
    }
  });

  // Internal endpoint for pre-game reminder task (called by cron/scheduled task)
  app.post("/api/internal/run-pregame-reminders", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const internalKey = process.env.INTERNAL_API_KEY;
      if (internalKey && authHeader !== `Bearer ${internalKey}`) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const result = await runPreGameReminders();
      res.json(result);
    } catch (error) {
      console.error("Failed to run pre-game reminders:", error);
      res.status(500).json({ error: "Failed to run pre-game reminders" });
    }
  });

  return httpServer;
}

// Entitlements helper functions
interface Entitlements {
  canUseStatTracker: boolean;
  canEditPlayMaker: boolean;
  canUploadHighlights: boolean;
  canViewIndividualStats: boolean;
  canViewHighlights: boolean;
  canViewRoster: boolean;
  canViewPlaybook: boolean;
  canUseChat: boolean;
  canUseGameDayLive: boolean;
  canEditEvents: boolean;
  canEditRoster: boolean;
  canPromoteMembers: boolean;
  canFollowCrossTeam: boolean;
  canTrackOwnStats: boolean;
}

// Base free entitlements (supporter premium features locked)
function getDefaultEntitlements(): Entitlements {
  return {
    canUseStatTracker: false,
    canEditPlayMaker: false,
    canUploadHighlights: false, // Supporter Pro
    canViewIndividualStats: false,
    canViewHighlights: false, // Supporter Pro
    canViewRoster: true, // Free
    canViewPlaybook: true, // Free
    canUseChat: true, // Free
    canUseGameDayLive: true, // Free
    canEditEvents: false,
    canEditRoster: false,
    canPromoteMembers: false,
    canFollowCrossTeam: false,
    canTrackOwnStats: false,
  };
}

function computeEntitlements(tier: string, isCoach: boolean, isStaff: boolean, isAthlete: boolean = false): Entitlements {
  const base = getDefaultEntitlements();

  if (isCoach) {
    base.canEditEvents = true;
    base.canEditRoster = true;
    base.canViewHighlights = true;
    base.canUseChat = true;
    base.canUseGameDayLive = true;
    base.canViewRoster = true;
    base.canViewPlaybook = true;
    
    if (tier === 'coach') {
      base.canUseStatTracker = true;
      base.canEditPlayMaker = true;
      base.canViewIndividualStats = true;
      base.canPromoteMembers = true;
    }
  }

  if (isStaff) {
    base.canUseStatTracker = true;
    base.canEditPlayMaker = true;
    base.canEditEvents = true;
    base.canEditRoster = true;
    base.canViewIndividualStats = true;
    base.canViewHighlights = true;
  }

  if (isAthlete) {
    base.canViewIndividualStats = true;
    base.canViewHighlights = true;
    
    if (tier === 'athlete') {
      base.canUploadHighlights = true;
    }
  }

  if (tier === 'supporter') {
    base.canUploadHighlights = true;
    base.canViewIndividualStats = true;
    base.canFollowCrossTeam = true;
    base.canTrackOwnStats = true;
    base.canViewHighlights = true;
    base.canUseStatTracker = true;
  }

  return base;
}

const APP_BASE_URL = process.env.REPLIT_APP_URL || 'https://statfyr.replit.app';

async function notifyTeamModeStatSession(teamId: string) {
  try {
    const team = await storage.getTeam(teamId);
    if (!team) {
      console.log('[StatNotify] Team not found:', teamId);
      return;
    }

    const supportersToNotify = await storage.getPaidSupportersFollowingTeam(teamId);
    console.log(`[StatNotify] Notifying ${supportersToNotify.length} paid supporters about team-mode session for team ${team.name}`);

    if (supportersToNotify.length === 0) return;

    const { sendStatSessionStartedEmail } = await import('./emailService');
    
    let pushSent = 0, emailSent = 0, unreachable = 0, skippedNoConsent = 0;

    // Send personalized notifications to each supporter
    for (const supporter of supportersToNotify) {
      const { supporterId, email, name, athleteNames, emailEnabled, pushEnabled } = supporter;
      
      // Skip if user has disabled both channels
      if (!emailEnabled && !pushEnabled) {
        skippedNoConsent++;
        continue;
      }
      
      let notificationSent = false;
      
      // Try push notification first if user has push enabled (via Firebase Cloud Messaging)
      if (pushEnabled) {
        const userTokens = await storage.getUserFcmTokens(supporterId);
        if (userTokens.length > 0) {
          const tokens = userTokens.map(t => t.token);
          const athleteList = athleteNames.length > 2 
            ? `${athleteNames.slice(0, 2).join(', ')} and ${athleteNames.length - 2} more`
            : athleteNames.join(' and ');
          
          const pushResult = await sendPushNotification(
            tokens,
            `${team.name} Stats Session Live`,
            `Track stats for ${athleteList} now!`,
            { type: 'stat_session', teamId },
            `${APP_BASE_URL}/supporter?teamId=${teamId}`
          );

          if (pushResult.success && pushResult.successCount > 0) {
            pushSent++;
            notificationSent = true;
          }
        }
      }

      // Fallback to email if push failed/unavailable and email is enabled
      if (!notificationSent && emailEnabled && email) {
        await sendStatSessionStartedEmail(email, name, team.name, athleteNames, teamId);
        emailSent++;
        notificationSent = true;
      }
      
      if (!notificationSent) {
        unreachable++;
      }
    }
    
    console.log(`[StatNotify] Summary - push: ${pushSent}, email: ${emailSent}, unreachable: ${unreachable}, skipped (no consent): ${skippedNoConsent}`);
  } catch (error) {
    console.error('[StatNotify] Error in notifyTeamModeStatSession:', error);
  }
}

const sentReminders = new Set<string>();

async function runPreGameReminders() {
  const now = new Date();
  const thirtyMinLater = new Date(now.getTime() + 30 * 60 * 1000);
  const fortyFiveMinLater = new Date(now.getTime() + 45 * 60 * 1000);
  
  const allTeams = await storage.getAllTeams();
  let remindersSent = 0;
  
  for (const team of allTeams) {
    const events = await storage.getTeamEvents(team.id);
    
    const upcomingGames = events.filter(event => {
      if (event.type?.toLowerCase() !== 'game') return false;
      const eventDate = new Date(event.date);
      return eventDate >= thirtyMinLater && eventDate <= fortyFiveMinLater;
    });
    
    for (const event of upcomingGames) {
      const reminderKey = `${event.id}-${now.toISOString().split('T')[0]}`;
      if (sentReminders.has(reminderKey)) continue;
      
      const existingGame = await storage.getGameByEvent(event.id);
      if (existingGame && existingGame.status === 'active') continue;
      
      await sendPreGameRemindersForEvent(event, team);
      sentReminders.add(reminderKey);
      remindersSent++;
    }
  }
  
  console.log(`[PreGameReminder] Sent ${remindersSent} reminder batches`);
  return { remindersSent };
}

async function sendPreGameRemindersForEvent(event: any, team: any) {
  try {
    const { sendPreGameReminderEmail } = await import('./emailService');

    const supportersToNotify = await storage.getPaidSupportersFollowingTeam(team.id);
    
    let pushSent = 0, emailSent = 0, unreachable = 0, skippedNoConsent = 0;

    for (const supporter of supportersToNotify) {
      const { supporterId, email, name, athleteNames, emailEnabled, pushEnabled } = supporter;
      const eventTitle = event.title || 'Game';
      
      // Skip if user has disabled both channels
      if (!emailEnabled && !pushEnabled) {
        skippedNoConsent++;
        continue;
      }
      
      let notificationSent = false;
      
      // Try push notification first if user has push enabled (via Firebase Cloud Messaging)
      if (pushEnabled) {
        const userTokens = await storage.getUserFcmTokens(supporterId);
        if (userTokens.length > 0) {
          const tokens = userTokens.map(t => t.token);
          const athleteList = athleteNames.length > 2 
            ? `${athleteNames.slice(0, 2).join(', ')} and ${athleteNames.length - 2} more`
            : athleteNames.join(' and ');

          const pushResult = await sendPushNotification(
            tokens,
            `${eventTitle} Starting Soon`,
            `${team.name} game in 30 min - ${athleteList} playing`,
            { type: 'pre_game_reminder', eventId: event.id, teamId: team.id },
            `${APP_BASE_URL}/supporter?eventId=${event.id}`
          );

          if (pushResult.success && pushResult.successCount > 0) {
            pushSent++;
            notificationSent = true;
          }
        }
      }

      // Fallback to email if push failed/unavailable and email is enabled
      if (!notificationSent && emailEnabled && email) {
        await sendPreGameReminderEmail(email, name, team.name, eventTitle, athleteNames, event.id);
        emailSent++;
        notificationSent = true;
      }
      
      if (!notificationSent) {
        unreachable++;
      }
    }
    
    console.log(`[PreGameReminder] Event ${event.id} summary - push: ${pushSent}, email: ${emailSent}, unreachable: ${unreachable}, skipped (no consent): ${skippedNoConsent}`);
  } catch (error) {
    console.error('[PreGameReminder] Error sending reminders for event:', event.id, error);
  }
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
