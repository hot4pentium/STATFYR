import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { warmupDatabase } from "./db";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: '10mb' }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Middleware to inject athlete-specific manifest for shareable HYPE cards
  // This intercepts HTML responses for /share/athlete/:id routes and rewrites the manifest link
  app.use((req, res, next) => {
    const shareMatch = req.path.match(/^\/share\/athlete\/([^/?]+)/);
    if (!shareMatch) {
      return next();
    }
    
    const athleteId = shareMatch[1];
    const originalEnd = res.end.bind(res);
    const chunks: Buffer[] = [];
    
    // Override write to capture response chunks
    const originalWrite = res.write.bind(res);
    res.write = function(chunk: any, ...args: any[]): boolean {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return true; // Don't actually write yet
    } as any;
    
    // Override end to process and send the complete response
    res.end = function(chunk?: any, ...args: any[]): Response {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      
      // Check if this is HTML content
      const contentType = res.getHeader('Content-Type');
      if (contentType && typeof contentType === 'string' && contentType.includes('text/html')) {
        let html = Buffer.concat(chunks).toString('utf-8');
        
        // Inject athlete-specific manifest
        html = html.replace(
          /<link\s+rel=["']manifest["']\s+href=["']\/manifest\.json["']\s*\/?>/i,
          `<link rel="manifest" href="/api/athletes/${athleteId}/manifest.json" />`
        );
        
        // Update content-length header
        res.setHeader('Content-Length', Buffer.byteLength(html));
        return originalEnd(html) as Response;
      }
      
      // For non-HTML responses, send as-is
      const body = Buffer.concat(chunks);
      return originalEnd(body) as Response;
    } as any;
    
    next();
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      // Warm up database connection asynchronously after server starts
      warmupDatabase().catch(err => {
        console.error('Background database warmup failed:', err);
      });
    },
  );
})();
