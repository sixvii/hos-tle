import { describe, expect, it } from "vitest";
import { getBackendConfig } from "./config";
import { createMongoClient, getPersistenceProvider } from "./mongodb";

describe("MongoDB configuration", () => {
  it("keeps the empty memory provider when Atlas credentials are absent", () => {
    const config = getBackendConfig({ NODE_ENV: "test", SESSION_TTL_DAYS: "7" });

    expect(getPersistenceProvider(config)).toBe("memory");
    expect(createMongoClient(config)).toBeNull();
  });

  it("requires the Atlas URI and database name together", () => {
    expect(() => getBackendConfig({ MONGODB_URI: "mongodb+srv://example" })).toThrow();
    expect(() => getBackendConfig({ MONGODB_DB: "arc" })).toThrow();
  });

  it("requires MongoDB and configured superadmin credentials in production", () => {
    expect(() => getBackendConfig({ NODE_ENV: "production" })).toThrow();
    const productionConfig = {
      NODE_ENV: "production",
      MONGODB_URI: "mongodb+srv://example",
      MONGODB_DB: "arc",
      SUPERADMIN_EMAIL: "admin@example.com",
      SUPERADMIN_PASSWORD: "a-unique-production-password",
      PUBLIC_APP_URL: "https://app.example.com",
    };

    expect(() => getBackendConfig(productionConfig)).not.toThrow();
    expect(() => getBackendConfig({ ...productionConfig, PUBLIC_APP_URL: "http://localhost:5173" })).toThrow();
  });

  it("accepts blank optional values from the example environment file", () => {
    expect(() => getBackendConfig({
      NODE_ENV: "test",
      MONGODB_URI: "",
      MONGODB_DB: "",
      SUPERADMIN_EMAIL: "",
      SUPERADMIN_PASSWORD: "",
      GOOGLE_CLIENT_ID: "",
      SMTP_HOST: "",
      SMTP_USER: "",
      SMTP_PASSWORD: "",
      SMTP_FROM_EMAIL: "",
      CLOUDINARY_CLOUD_NAME: "",
      CLOUDINARY_API_KEY: "",
      CLOUDINARY_API_SECRET: "",
    })).not.toThrow();
  });

  it("creates an unconnected Mongo client without contacting Atlas", () => {
    const config = getBackendConfig({ MONGODB_URI: "mongodb://localhost:27017", MONGODB_DB: "arc" });
    const client = createMongoClient(config);

    expect(client).not.toBeNull();
    void client?.close();
  });
});
