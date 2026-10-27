import "dotenv/config";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { existsSync } from "node:fs";
import { setServers } from "node:dns";
import express from "express";
import helmet from "helmet";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { attachRealtime } from "./realtime";
import { AuthService } from "./auth";
import { getBackendConfig } from "./config";
import { createBackendRouter } from "./index";
import { createBackendStore } from "./store";
import { handleDemo } from "./routes/demo";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".env"), quiet: true });

const mongoDnsServers = process.env.MONGODB_DNS_SERVERS?.split(",").map((server) => server.trim()).filter(Boolean);
if (mongoDnsServers?.length) setServers(mongoDnsServers);

export async function createServer() {
  let config = getBackendConfig();
  let store = createBackendStore(config);
  try {
    await store.ready;
  } catch (error) {
    await store.close();
    if (config.NODE_ENV === "production") throw error;

    console.warn("MongoDB is unavailable; starting with the in-memory store for development.");
    config = getBackendConfig({ ...process.env, MONGODB_URI: undefined, MONGODB_DB: undefined });
    store = createBackendStore(config);
  }
  const auth = new AuthService(store, config);
  if (config.SUPERADMIN_EMAIL && config.SUPERADMIN_PASSWORD) {
    auth.ensureConfiguredSuperadmin(config.SUPERADMIN_EMAIL, config.SUPERADMIN_PASSWORD);
  }
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", config.TRUST_PROXY);

  app.locals.arcBackend = { store, auth };
  app.use(helmet());
  app.use(cors(config.NODE_ENV === "production" ? { origin: new URL(config.PUBLIC_APP_URL).origin } : undefined));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use("/api", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: { code: "RATE_LIMITED", message: "Too many requests. Try again later." } },
  }));
  app.get("/api/ping", (_req, res) => res.json({ message: process.env.PING_MESSAGE ?? "ping" }));
  app.get("/api/demo", handleDemo);
  app.use("/api/v1", createBackendRouter(store, auth, config));

  const frontendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../frontend/dist/spa");
  const frontendIndex = path.join(frontendDirectory, "index.html");
  if (existsSync(frontendIndex)) {
    app.use(express.static(frontendDirectory));
    app.use((req, res, next) => {
      if (req.method !== "GET" || req.path.startsWith("/api/") || req.path.startsWith("/socket.io") || !req.accepts("html")) {
        return next();
      }
      return res.sendFile(frontendIndex);
    });
  }

  return { app, store, auth, config };
}

export async function startServer() {
  const { app, store, auth, config } = await createServer();
  const httpServer = http.createServer(app);
  attachRealtime(httpServer, store, auth, config);

  httpServer.requestTimeout = 30_000;
  httpServer.headersTimeout = 35_000;
  httpServer.keepAliveTimeout = 5_000;
  httpServer.listen(config.PORT, () => {
    console.log(`Backend API running at http://localhost:${config.PORT}`);
  });

  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    httpServer.close(() => void store.close().then(() => process.exit(0)));
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}

const entrypoint = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entrypoint === path.resolve(fileURLToPath(import.meta.url))) void startServer();