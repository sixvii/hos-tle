import { MongoClient } from "mongodb";
import type { BackendConfig } from "./config";

export function createMongoClient(config: BackendConfig): MongoClient | null {
  if (!config.MONGODB_URI) return null;
  return new MongoClient(config.MONGODB_URI, { appName: "arc-api" });
}

export function getPersistenceProvider(config: BackendConfig): "mongodb" | "memory" {
  return config.MONGODB_URI && config.MONGODB_DB ? "mongodb" : "memory";
}
