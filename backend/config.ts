import { z } from "zod";

const optionalString = z.preprocess((value) => value === "" ? undefined : value, z.string().min(1).optional());
const booleanString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return value;
}, z.boolean());

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  TRUST_PROXY: booleanString.default(false),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(7),
  MONGODB_URI: z.preprocess((value) => value === "" ? undefined : value, z.string().min(1).refine((value) => /^(mongodb|mongodb\+srv):\/\//.test(value), "MONGODB_URI must be a MongoDB connection string.").optional()),
  MONGODB_DB: optionalString,
  SUPERADMIN_EMAIL: z.preprocess((value) => value === "" ? undefined : value, z.string().email().optional()),
  SUPERADMIN_PASSWORD: z.preprocess((value) => value === "" ? undefined : value, z.string().min(12).max(128).optional()),
  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,
  GOOGLE_CLIENT_ID: optionalString,
  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: optionalString,
  SMTP_PASSWORD: optionalString,
  SMTP_FROM_EMAIL: z.preprocess((value) => value === "" ? undefined : value, z.string().email().optional()),
  PUBLIC_APP_URL: z.string().url().default("http://localhost:5173"),
}).superRefine((config, context) => {
  if (Boolean(config.MONGODB_URI) !== Boolean(config.MONGODB_DB)) {
    context.addIssue({ code: "custom", message: "MONGODB_URI and MONGODB_DB must be provided together." });
  }
  if (Boolean(config.SUPERADMIN_EMAIL) !== Boolean(config.SUPERADMIN_PASSWORD)) {
    context.addIssue({ code: "custom", message: "SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be provided together." });
  }
  if (config.NODE_ENV === "production" && (!config.MONGODB_URI || !config.MONGODB_DB)) {
    context.addIssue({ code: "custom", message: "MONGODB_URI and MONGODB_DB are required in production." });
  }
  if (config.NODE_ENV === "production" && (!config.SUPERADMIN_EMAIL || !config.SUPERADMIN_PASSWORD)) {
    context.addIssue({ code: "custom", message: "SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD are required in production." });
  }
  if (config.NODE_ENV === "production" && ["localhost", "127.0.0.1", "[::1]"].includes(new URL(config.PUBLIC_APP_URL).hostname)) {
    context.addIssue({ code: "custom", message: "PUBLIC_APP_URL must use the deployed app URL in production." });
  }
  const cloudinaryValues = [config.CLOUDINARY_CLOUD_NAME, config.CLOUDINARY_API_KEY, config.CLOUDINARY_API_SECRET];
  if (cloudinaryValues.some(Boolean) && cloudinaryValues.some((value) => !value)) {
    context.addIssue({ code: "custom", message: "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be provided together." });
  }
  const smtpValues = [config.SMTP_HOST, config.SMTP_USER, config.SMTP_PASSWORD, config.SMTP_FROM_EMAIL];
  if (smtpValues.some(Boolean) && smtpValues.some((value) => !value)) {
    context.addIssue({ code: "custom", message: "SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM_EMAIL must be provided together." });
  }
});

export type BackendConfig = z.infer<typeof environmentSchema>;

export function getBackendConfig(env: NodeJS.ProcessEnv = process.env): BackendConfig {
  return environmentSchema.parse(env);
}
