import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTeamSchema, insertEventSchema, updateEventSchema, insertHighlightVideoSchema } from "@shared/schema";
import { z } from "zod";
import { registerObjectStorageRoutes, ObjectStorageService, objectStorageClient } from "./replit_integrations/object_storage";
import { spawn } from "child_process";
import path from "path";

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const objectStorageService = new ObjectStorageService();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = insertUserSchema.parse(req.body);
      const existing = await storage.getUserByUsername(parsed.username);
      if (existing) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const user = await storage.createUser(parsed);
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      let user = await storage.getUserByEmail(username);
      if (!user) {
        user = await storage.getUserByUsername(username);
      }
      if (!user || user.password !== password) {
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
      console.log("Updating user:", req.params.id, "with data:", JSON.stringify(req.body).substring(0, 200));
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        console.log("User not found:", req.params.id);
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

  app.delete("/api/teams/:teamId/members/:userId", async (req, res) => {
    try {
      await storage.removeTeamMember(req.params.teamId, req.params.userId);
      res.json({ success: true });
    } catch (error) {
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
