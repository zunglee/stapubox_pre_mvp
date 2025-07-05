import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import path from "path";
import { fileURLToPath } from "url";

// Environment setup
import { config } from "dotenv";
config({ path: ".env" });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logging middleware
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
        logLine += ` :: ${JSON.stringify(capturedJsonResponse).slice(0, 200)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 80) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Register API routes
registerRoutes(app);

// Serve static files in production
const publicDir = path.join(__dirname, "../public");
app.use(express.static(publicDir));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Catch-all handler for client-side routing
app.get("*", (req, res) => {
  const indexPath = path.join(publicDir, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("Error serving index.html:", err);
      res.status(500).send("Server Error");
    }
  });
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`Error ${status}: ${message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  res.status(status).json({ message });
});

const PORT = parseInt(process.env.PORT || "3000");
const HOST = process.env.HOST || "0.0.0.0";

// Verify critical environment variables
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL must be set. Did you forget to provision a database?");
  process.exit(1);
}

console.log("🔧 Configuration loaded:");
console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`  Database: ${process.env.DATABASE_URL.substring(0, 50)}...`);
console.log(`  Server: http://${HOST}:${PORT}`);

app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;