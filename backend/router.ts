import { Router, type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { OAuth2Client } from "google-auth-library";
import nodemailer from "nodemailer";
import { z } from "zod";
import { AuthService, getBearerToken, publicUser } from "./auth";
import { getBackendConfig } from "./config";
import { getPersistenceProvider } from "./mongodb";
import { createCloudinaryUploadSignature } from "./cloudinary";
import { applicationStatuses, type Property, type Role, type User } from "./domain";
import { createBackendStore, createId, now, type BackendStore } from "./store";

const signupSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(2).max(120),
  firstName: z.string().trim().min(1).max(60).optional(),
  lastName: z.string().trim().min(1).max(60).optional(),
  password: z.string().min(8).max(128),
  role: z.enum(["student", "owner"]),
  schoolName: z.string().trim().min(2).max(160).optional(),
  phoneNumber: z.string().trim().min(7).max(30).optional(),
  gender: z.enum(["female", "male", "non_binary", "prefer_not_to_say"]).optional(),
  ownerType: z.enum(["personal", "company"]).optional(),
  companyAddress: z.string().trim().min(5).max(220).optional(),
}).superRefine((input, context) => {
  if (input.role === "student") {
    if (!input.schoolName) context.addIssue({ code: "custom", path: ["schoolName"], message: "School name is required for students." });
    if (!input.phoneNumber) context.addIssue({ code: "custom", path: ["phoneNumber"], message: "Phone number is required for students." });
    if (!input.gender) context.addIssue({ code: "custom", path: ["gender"], message: "Gender is required for students." });
  }

  if (input.role === "owner") {
    if (!input.phoneNumber) context.addIssue({ code: "custom", path: ["phoneNumber"], message: "Phone number is required for owners." });
    if (input.ownerType === "company" && !input.companyAddress) {
      context.addIssue({ code: "custom", path: ["companyAddress"], message: "Company address is required for company owners." });
    }
  }
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
  role: z.enum(["student", "owner", "university", "admin", "superadmin"]).optional(),
});

const adminAccountSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

const userStatusSchema = z.object({ status: z.enum(["active", "suspended"]) });
const changePasswordSchema = z.object({ password: z.string().min(8).max(128) });
const forgotPasswordSchema = z.object({ email: z.string().trim().email() });
const resetPasswordSchema = z.object({ token: z.string().min(32).max(256), password: z.string().min(8).max(128) });
const googleLoginSchema = z.object({
  credential: z.string().min(20).max(10000),
  role: z.enum(["student", "owner", "university", "admin", "superadmin"]),
});

const propertySchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4000).default(""),
  city: z.string().trim().min(2).max(120),
  area: z.string().trim().min(2).max(120),
  university: z.string().trim().min(2).max(500),
  distance: z.string().trim().max(80).default(""),
  photos: z.array(z.string().trim().min(1)).max(50).default([]),
  videos: z.array(z.string().trim().min(1)).max(50).default([]),
  amenities: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
  rooms: z.array(z.object({
    name: z.string().trim().min(1).max(120),
    beds: z.number().int().positive().max(100),
    units: z.number().int().min(0).max(10000).default(1),
    price: z.number().positive().max(100000000),
  })).min(1).max(100),
});

const applicationSchema = z.object({
  propertyId: z.string().uuid(),
  roomName: z.string().trim().min(1).max(120),
  moveInDate: z.string().trim().min(1).max(40),
  details: z.record(z.string(), z.string().trim().max(1000)).default({}),
  documents: z.array(z.string().trim().min(1).max(2000)).max(20).default([]),
});

const bookingSchema = z.object({
  propertyId: z.string().uuid(),
  roomName: z.string().trim().min(1).max(120),
  moveInDate: z.string().trim().min(1).max(40),
});

const bookingStatusSchema = z.object({
  status: z.enum(["requested", "confirmed", "cancelled"]),
});

const supportSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  topic: z.string().trim().min(2).max(120),
  message: z.string().trim().min(10).max(5000),
});

const paymentIntentSchema = z.object({
  bookingId: z.string().uuid(),
});

const messageSchema = z.object({
  recipientId: z.string().uuid(),
  body: z.string().trim().min(1).max(5000),
});

const maintenanceSchema = z.object({
  propertyId: z.string().uuid().optional(),
  subject: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(5000),
});

const uploadSignatureSchema = z.object({
  kind: z.enum(["property", "profile", "documents"]).default("property"),
});

const profilePhotoSchema = z.object({
  profilePhotoUrl: z.string().url().max(2000),
});

const reviewSchema = z.object({
  status: z.enum(applicationStatuses),
  reviewNote: z.string().trim().max(2000).optional(),
});

const studentReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(10).max(2000),
});

const ownerReplySchema = z.object({
  ownerReply: z.string().trim().min(1).max(2000),
});

const propertyReviewSchema = z.object({
  status: z.enum(["verified", "changes_requested"]),
});

type AuthedRequest = Request & { user?: User };

function occupiedUnits(propertyId: string, roomName: string, store: BackendStore) {
  const approvedApplications = [...store.applications.values()].filter(
    (application) => application.propertyId === propertyId && application.roomName === roomName && application.status === "approved",
  ).length;
  const confirmedBookings = [...store.bookings.values()].filter(
    (booking) => booking.propertyId === propertyId && booking.roomName === roomName && booking.status === "confirmed",
  ).length;
  return approvedApplications + confirmedBookings;
}

function roomAvailability(property: Property, roomName: string, store: BackendStore) {
  const room = property.rooms.find((item) => item.name === roomName);
  return Math.max(0, (room?.units ?? 1) - occupiedUnits(property.id, roomName, store));
}

function safeProperty(property: Property, store: BackendStore) {
  const { ownerId: _ownerId, ...publicRecord } = property;
  return {
    ...publicRecord,
    ownerName: store.users.get(property.ownerId)?.name ?? "Property owner",
    rooms: property.rooms.map((room) => ({
      ...room,
      units: room.units ?? 1,
      availableUnits: roomAvailability(property, room.name, store),
    })),
  };
}

function sendError(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ error: { code, message } });
}

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T | null {
  const result = schema.safeParse(body);
  return result.success ? result.data : null;
}

function requireUser(auth: AuthService, allowedRoles?: Role[], allowPasswordChange = false) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const user = auth.getUserByToken(getBearerToken(req.header("authorization")));
    if (!user) return sendError(res, 401, "UNAUTHENTICATED", "A valid session is required.");
    if (user.mustChangePassword && !allowPasswordChange) {
      return sendError(res, 403, "PASSWORD_CHANGE_REQUIRED", "Change your password before continuing.");
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return sendError(res, 403, "FORBIDDEN", "You do not have access to this resource.");
    }
    req.user = user;
    next();
  };
}

export function createBackendRouter(store: BackendStore = createBackendStore(), sharedAuth?: AuthService, backendConfig = getBackendConfig()) {
  const router = Router();
  const config = backendConfig;
  const auth = sharedAuth ?? new AuthService(store, config);
  const googleClient = config.GOOGLE_CLIENT_ID ? new OAuth2Client(config.GOOGLE_CLIENT_ID) : null;
  const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: { code: "RATE_LIMITED", message: "Too many authentication attempts. Try again later." } },
  });
  const passwordResetRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: { code: "RATE_LIMITED", message: "Too many password reset requests. Try again later." } },
  });

  router.get("/health", (_req, res) => {
    const persistence = getPersistenceProvider(config);
    res.json({ status: "ok", service: "arc-api", persistence, data: persistence === "mongodb" ? "mongodb-backed-store" : "in-memory-empty-store" });
  });

  router.post("/auth/signup", authRateLimit, (req, res) => {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message ?? "Provide a valid name, email, password, and role.";
      return sendError(res, 400, "INVALID_REQUEST", issueMessage);
    }

    try {
      const user = auth.createUser(result.data);
      const session = auth.createSession(user);
      res.status(201).json({ user: publicUser(user), token: session.token, expiresAt: session.expiresAt });
    } catch (error) {
      if (error instanceof Error && error.message === "EMAIL_ALREADY_REGISTERED") {
        return sendError(res, 409, "EMAIL_ALREADY_REGISTERED", "An account with this email already exists.");
      }
      throw error;
    }
  });

  router.post("/auth/login", authRateLimit, (req, res) => {
    const input = parseBody(loginSchema, req.body);
    if (!input) return sendError(res, 400, "INVALID_REQUEST", "Provide a valid email and password.");

    const user = auth.authenticate(input.email, input.password);
    if (!user) return sendError(res, 401, "INVALID_CREDENTIALS", "The email or password is incorrect.");
    const roleMatches = input.role === "admin"
      ? user.role === "admin" || user.role === "superadmin"
      : !input.role || user.role === input.role;
    if (!roleMatches) {
      return sendError(res, 403, "WRONG_LOGIN_FORM", `Use the ${user.role} login form for this account.`);
    }

    const session = auth.createSession(user);
    res.json({ user: publicUser(user), token: session.token, expiresAt: session.expiresAt });
  });

  router.post("/auth/google", authRateLimit, async (req, res) => {
    const input = parseBody(googleLoginSchema, req.body);
    if (!input) return sendError(res, 400, "INVALID_REQUEST", "Provide a Google credential and account role.");
    if (!googleClient || !config.GOOGLE_CLIENT_ID) {
      return sendError(res, 503, "GOOGLE_SIGN_IN_UNAVAILABLE", "Google sign-in is not configured.");
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: input.credential, audience: config.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch {
      return sendError(res, 401, "INVALID_GOOGLE_CREDENTIAL", "Google could not verify this sign-in.");
    }
    if (!payload?.email || payload.email_verified !== true) {
      return sendError(res, 401, "UNVERIFIED_GOOGLE_EMAIL", "Use a Google account with a verified email address.");
    }

    const userId = store.usersByEmail.get(payload.email.trim().toLowerCase());
    let user = userId ? store.users.get(userId) : undefined;
    if (user) {
      const roleMatches = input.role === "admin"
        ? user.role === "admin" || user.role === "superadmin"
        : user.role === input.role;
      if (!roleMatches) return sendError(res, 403, "WRONG_LOGIN_FORM", `Use the ${user.role} login form for this account.`);
      if (user.status === "suspended") return sendError(res, 401, "INVALID_CREDENTIALS", "This account is unavailable.");
    } else {
      return sendError(res, 401, "ACCOUNT_NOT_FOUND", "No account is registered with this Google email. Create an account first.");
    }

    const session = auth.createSession(user);
    return res.json({ user: publicUser(user), token: session.token, expiresAt: session.expiresAt });
  });

  router.post("/auth/password/forgot", passwordResetRateLimit, async (req, res) => {
    const input = parseBody(forgotPasswordSchema, req.body);
    if (!input) return sendError(res, 400, "INVALID_REQUEST", "Provide a valid email address.");
    if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASSWORD || !config.SMTP_FROM_EMAIL) {
      return sendError(res, 503, "PASSWORD_RESET_UNAVAILABLE", "Password reset email is not configured.");
    }

    const userId = store.usersByEmail.get(input.email.toLowerCase());
    const user = userId ? store.users.get(userId) : undefined;
    if (user && user.status !== "suspended") {
      const token = auth.issuePasswordResetToken(user.id);
      const resetUrl = new URL("/reset-password", config.PUBLIC_APP_URL);
      resetUrl.searchParams.set("token", token);
      const transport = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_PORT === 465,
        auth: { user: config.SMTP_USER, pass: config.SMTP_PASSWORD },
      });
      try {
        await transport.sendMail({
          from: config.SMTP_FROM_EMAIL,
          to: user.email,
          subject: "Reset your Hostle password",
          text: `Use this link to reset your password. It expires in 30 minutes: ${resetUrl.toString()}`,
        });
      } catch (error) {
        console.error("Password reset email delivery failed:", error);
      }
    }
    return res.json({ message: "If an account exists for that email, a reset link will be sent." });
  });

  router.post("/auth/password/reset", passwordResetRateLimit, (req, res) => {
    const input = parseBody(resetPasswordSchema, req.body);
    if (!input) return sendError(res, 400, "INVALID_REQUEST", "Provide a valid reset token and a password of at least 8 characters.");
    const user = auth.resetPasswordWithToken(input.token, input.password);
    if (!user) return sendError(res, 400, "INVALID_RESET_TOKEN", "This reset link is invalid or expired. Request a new one.");
    return res.json({ message: "Your password has been reset." });
  });

  router.post("/auth/logout", (req, res) => {
    auth.revokeSession(getBearerToken(req.header("authorization")));
    res.status(204).send();
  });

  router.post("/admin/users", requireUser(auth, ["superadmin"]), (req: AuthedRequest, res) => {
    const input = parseBody(adminAccountSchema, req.body);
    if (!input) return sendError(res, 400, "INVALID_REQUEST", "Provide a valid admin name, email, and password.");
    try {
      const user = auth.createUser({ ...input, role: "admin", mustChangePassword: true });
      res.status(201).json({ data: publicUser(user) });
    } catch (error) {
      if (error instanceof Error && error.message === "EMAIL_ALREADY_REGISTERED") {
        return sendError(res, 409, "EMAIL_ALREADY_REGISTERED", "An account with this email already exists.");
      }
      throw error;
    }
  });

  router.patch("/auth/password", requireUser(auth, undefined, true), (req: AuthedRequest, res) => {
    const input = parseBody(changePasswordSchema, req.body);
    if (!input) return sendError(res, 400, "INVALID_REQUEST", "Password must be at least 8 characters.");
    const updated = auth.changePassword(req.user!, input.password);
    res.json({ user: publicUser(updated) });
  });

  router.patch("/admin/users/:id/status", requireUser(auth, ["admin", "superadmin"]), (req: AuthedRequest, res) => {
    const input = parseBody(userStatusSchema, req.body);
    if (!input) return sendError(res, 400, "INVALID_REQUEST", "Provide a valid user status.");
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = store.users.get(userId);
    if (!user || user.id === req.user!.id || user.role === "superadmin" || (req.user!.role !== "superadmin" && user.role === "admin")) {
      return sendError(res, 403, "FORBIDDEN", "You cannot change this user status.");
    }
    const updated = { ...user, status: input.status };
    store.users.set(updated.id, updated);
    res.json({ data: publicUser(updated) });
  });

  router.delete("/admin/users/:id", requireUser(auth, ["superadmin"]), (req: AuthedRequest, res) => {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = store.users.get(userId);
    if (!user || user.role !== "admin") return sendError(res, 403, "FORBIDDEN", "Only standard admin accounts can be deleted.");
    store.users.delete(user.id);
    store.usersByEmail.delete(user.email);
    res.status(204).send();
  });

  router.get("/me", requireUser(auth), (req: AuthedRequest, res) => {
    res.json({ user: publicUser(req.user!) });
  });

  router.patch("/me/profile-photo", requireUser(auth), (req: AuthedRequest, res) => {
    const input = parseBody(profilePhotoSchema, req.body);
    if (!input) return sendError(res, 400, "INVALID_REQUEST", "Provide a valid profile photo URL.");
    req.user!.profilePhotoUrl = input.profilePhotoUrl;
    store.users.set(req.user!.id, req.user!);
    res.json({ user: publicUser(req.user!) });
  });

  router.get("/hostels", (req, res) => {
    const university = typeof req.query.university === "string" ? req.query.university.toLowerCase() : undefined;
    const location = typeof req.query.location === "string" ? req.query.location.toLowerCase() : undefined;
    const room = typeof req.query.room === "string" ? req.query.room.toLowerCase() : undefined;
    const verifiedOnly = req.query.verified === "true";
    const properties = [...store.properties.values()]
      .filter((property) => !verifiedOnly || property.status === "verified")
      .filter((property) => !university || property.university.toLowerCase().includes(university))
      .filter((property) => !location || `${property.city} ${property.area}`.toLowerCase().includes(location))
      .filter((property) => !room || property.rooms.some((item) => item.name.toLowerCase().includes(room)))
      .map((property) => safeProperty(property, store));

    res.json({ data: properties, meta: { count: properties.length } });
  });

  router.get("/hostels/:id", (req, res) => {
    const propertyId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const property = store.properties.get(propertyId);
    if (!property) {
      return sendError(res, 404, "PROPERTY_NOT_FOUND", "Property not found.");
    }
    res.json({ data: safeProperty(property, store) });
  });

  router.post("/uploads/signature", requireUser(auth), (req: AuthedRequest, res) => {
    const input = parseBody(uploadSignatureSchema, req.body);
    if (!input || (input.kind === "property" && !["owner", "admin"].includes(req.user!.role)) || (input.kind === "documents" && !["student", "admin"].includes(req.user!.role))) {
      return sendError(res, 403, "FORBIDDEN", "You do not have access to upload this file.");
    }
    const signature = createCloudinaryUploadSignature(config, req.user!.id, undefined, input.kind);
    if (!signature) return sendError(res, 503, "CLOUDINARY_NOT_CONFIGURED", "Image uploads are not configured yet.");
    res.json({ data: signature });
  });

  router.post("/properties", requireUser(auth, ["owner"]), (req: AuthedRequest, res) => {
    const input = parseBody(propertySchema, req.body);
    if (!input) return sendError(res, 400, "INVALID_REQUEST", "Provide complete property and room details.");

    const property = {
      id: createId(),
      ownerId: req.user!.id,
      ...input,
      status: "under_review" as const,
      createdAt: now(),
    };
    store.properties.set(property.id, property);
    res.status(201).json({ data: safeProperty(property, store) });
  });

  router.get("/properties/mine", requireUser(auth, ["owner"]), (req: AuthedRequest, res) => {
    const properties = [...store.properties.values()]
      .filter((property) => property.ownerId === req.user!.id)
      .map((property) => safeProperty(property, store));
    res.json({ data: properties, meta: { count: properties.length } });
  });

  router.patch("/properties/:id", requireUser(auth, ["owner"]), (req: AuthedRequest, res) => {
    const input = parseBody(propertySchema, req.body);
    if (!input) return sendError(res, 400, "INVALID_REQUEST", "Provide complete property and room details.");
    const propertyId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const property = store.properties.get(propertyId);
    if (!property || property.ownerId !== req.user!.id) {
      return sendError(res, 404, "PROPERTY_NOT_FOUND", "Property not found.");
    }
    const occupiedRoom = property.rooms.find((room) => occupiedUnits(property.id, room.name, store) > (input.rooms.find((nextRoom) => nextRoom.name === room.name)?.units ?? 0));
    if (occupiedRoom) {
      return sendError(res, 409, "ROOMS_OCCUPIED", "Units cannot be reduced below the number of rented rooms.");
    }
    const updated = { ...property, ...input, status: "under_review" as const };
    store.properties.set(updated.id, updated);
    res.json({ data: safeProperty(updated, store) });
  });

  router.delete("/properties/:id", requireUser(auth, ["owner"]), (req: AuthedRequest, res) => {
    const propertyId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const property = store.properties.get(propertyId);
    if (!property || property.ownerId !== req.user!.id) {
      return sendError(res, 404, "PROPERTY_NOT_FOUND", "Property not found.");
    }
    store.properties.delete(propertyId);
    res.status(204).send();
  });

  router.patch("/properties/:id/review", requireUser(auth, ["university", "admin", "superadmin"]), (req: AuthedRequest, res) => {
    const input = parseBody(propertyReviewSchema, req.body);
    if (!input) return sendError(res, 400, "INVALID_REQUEST", "Provide a valid property review status.");

    const propertyId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const property = store.properties.get(propertyId);
    if (!property) return sendError(res, 404, "PROPERTY_NOT_FOUND", "Property not found.");

    const updated = { ...property, status: input.status };
    store.properties.set(updated.id, updated);
    res.json({ data: safeProperty(updated, store) });
  });

  router.get("/owner/overview", requireUser(auth, ["owner"]), (req: AuthedRequest, res) => {
    const properties = [...store.properties.values()].filter((property) => property.ownerId === req.user!.id);
    const propertyIds = new Set(properties.map((property) => property.id));
    const applications = [...store.applications.values()].filter((application) => propertyIds.has(application.propertyId));
    const bookings = [...store.bookings.values()].filter((booking) => propertyIds.has(booking.propertyId));

    res.json({
      data: {
        metrics: {
          properties: properties.length,
          rooms: properties.reduce((total, property) => total + property.rooms.length, 0),
          applications: applications.length,
          bookings: bookings.length,
        },
        properties: properties.map((property) => safeProperty(property, store)),
      },
    });
  });

  router.get("/university/overview", requireUser(auth, ["university"]), (_req, res) => {
    const properties = [...store.properties.values()];
    res.json({
      data: {
        metrics: {
          totalProperties: properties.length,
          pendingVerification: properties.filter((property) => property.status === "under_review").length,
          verifiedProperties: properties.filter((property) => property.status === "verified").length,
          applications: store.applications.size,
        },
      },
    });
  });

  router.get("/university/verification", requireUser(auth, ["university"]), (_req, res) => {
    const queue = [...store.properties.values()]
      .filter((property) => property.status === "under_review" || property.status === "changes_requested")
      .map((property) => safeProperty(property, store));
    res.json({ data: queue, meta: { count: queue.length } });
  });

  router.get("/admin/overview", requireUser(auth, ["admin", "superadmin"]), (_req, res) => {
    res.json({
      data: {
        metrics: {
          users: store.users.size,
          properties: store.properties.size,
          pendingVerification: [...store.properties.values()].filter((property) => property.status === "under_review" || property.status === "changes_requested").length,
          applications: store.applications.size,
          bookings: store.bookings.size,
          supportTickets: store.supportTickets.size,
        },
      },
    });
  });

  router.get("/admin/users", requireUser(auth, ["admin", "superadmin"]), (_req, res) => {
    res.json({ data: [...store.users.values()].map(publicUser), meta: { count: store.users.size } });
  });

  router.get("/admin/properties", requireUser(auth, ["admin", "superadmin"]), (_req, res) => {
    const properties = [...store.properties.values()].map((property) => safeProperty(property, store));
    res.json({ data: properties, meta: { count: properties.length } });
  });

  router.get("/admin/verification", requireUser(auth, ["admin", "superadmin"]), (_req, res) => {
    const queue = [...store.properties.values()]
      .filter((property) => property.status === "under_review" || property.status === "changes_requested")
      .map((property) => safeProperty(property, store));
    res.json({ data: queue, meta: { count: queue.length } });
  });

  router.get("/admin/bookings", requireUser(auth, ["admin", "superadmin"]), (_req, res) => {
    const bookings = [...store.bookings.values()].map((booking) => ({
      ...booking,
      studentName: store.users.get(booking.studentId)?.name ?? "Student",
      studentEmail: store.users.get(booking.studentId)?.email ?? "",
      propertyName: store.properties.get(booking.propertyId)?.name ?? "Property",
    }));
    res.json({ data: bookings, meta: { count: bookings.length } });
  });

  router.get("/admin/disputes", requireUser(auth, ["admin", "superadmin"]), (_req, res) => {
    const disputes = [...store.supportTickets.values()].map((ticket) => ({ ...ticket, status: ticket.status ?? "open" }));
    res.json({ data: disputes, meta: { count: disputes.length } });
  });

  router.get("/admin/reports", requireUser(auth, ["admin", "superadmin"]), (_req, res) => {
    const properties = [...store.properties.values()];
    const bookings = [...store.bookings.values()];
    res.json({ data: {
      usersByRole: [...store.users.values()].reduce<Record<string, number>>((counts, user) => ({ ...counts, [user.role]: (counts[user.role] ?? 0) + 1 }), {}),
      propertiesByStatus: properties.reduce<Record<string, number>>((counts, property) => ({ ...counts, [property.status]: (counts[property.status] ?? 0) + 1 }), {}),
      bookingsByStatus: bookings.reduce<Record<string, number>>((counts, booking) => ({ ...counts, [booking.status]: (counts[booking.status] ?? 0) + 1 }), {}),
      totalBookingValue: bookings.reduce((sum, booking) => sum + booking.amount, 0),
    } });
  });

  router.post("/applications", requireUser(auth, ["student"]), (req: AuthedRequest, res) => {
    const input = parseBody(applicationSchema, req.body);
    if (!input) return sendError(res, 400, "INVALID_REQUEST", "Provide a property, room, move-in date, and valid application details.");

    const property = store.properties.get(input.propertyId);
    if (!property || property.status !== "verified") {
      return sendError(res, 404, "PROPERTY_UNAVAILABLE", "This property is not available for applications.");
    }
    if (!property.rooms.some((room) => room.name === input.roomName)) {
      return sendError(res, 400, "ROOM_NOT_FOUND", "The selected room is not available on this property.");
    }
    if (roomAvailability(property, input.roomName, store) < 1) {
      return sendError(res, 409, "NO_UNITS_AVAILABLE", "This room type is fully rented.");
    }

    const { firstName: _firstName, lastName: _lastName, email: _email, profilePhotoUrl: _profilePhotoUrl, ...submittedDetails } = input.details;
    const timestamp = now();
    const application = {
      id: createId(),
      studentId: req.user!.id,
      ...input,
      details: {
        ...submittedDetails,
        firstName: req.user!.firstName ?? req.user!.name.trim().split(/\s+/)[0] ?? "Student",
        lastName: req.user!.lastName ?? (req.user!.name.trim().split(/\s+/).slice(1).join(" ") || "Applicant"),
        email: req.user!.email,
        ...(req.user!.profilePhotoUrl ? { profilePhotoUrl: req.user!.profilePhotoUrl } : {}),
      },
      status: "submitted" as const,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.applications.set(application.id, application);
    res.status(201).json({ data: application });
  });

  router.get("/applications/mine", requireUser(auth, ["student"]), (req: AuthedRequest, res) => {
    const applications = [...store.applications.values()].filter((application) => application.studentId === req.user!.id);
    res.json({ data: applications, meta: { count: applications.length } });
  });

  router.get("/applications/received", requireUser(auth, ["owner", "university", "admin"]), (req: AuthedRequest, res) => {
    const applications = [...store.applications.values()].filter((application) => {
      if (req.user!.role !== "owner") return true;
      return store.properties.get(application.propertyId)?.ownerId === req.user!.id;
    });
    res.json({ data: applications, meta: { count: applications.length } });
  });

  router.patch("/applications/:id/review", requireUser(auth, ["owner", "university", "admin"]), (req: AuthedRequest, res) => {
    const input = parseBody(reviewSchema, req.body);
    if (!input) return sendError(res, 400, "INVALID_REQUEST", "Provide a valid application status.");

    const applicationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const application = store.applications.get(applicationId);
    if (!application) return sendError(res, 404, "APPLICATION_NOT_FOUND", "Application not found.");
    const property = store.properties.get(application.propertyId);
    if (req.user!.role === "owner" && property?.ownerId !== req.user!.id) {
      return sendError(res, 403, "FORBIDDEN", "You do not manage this application.");
    }
    if (input.status === "approved" && application.status !== "approved" && property && roomAvailability(property, application.roomName, store) < 1) {
      return sendError(res, 409, "NO_UNITS_AVAILABLE", "No units remain for this room type.");
    }

    const updated = { ...application, status: input.status, reviewNote: input.reviewNote, updatedAt: now() };
    store.applications.set(updated.id, updated);
    res.json({ data: updated });
  });

  router.post("/bookings", requireUser(auth, ["student"]), (req: AuthedRequest, res) => {
    const input = parseBody(bookingSchema, req.body);
    if (!input) return sendError(res, 400, "INVALID_REQUEST", "Provide a property, room, and move-in date.");

    const property = store.properties.get(input.propertyId);
    const room = property?.rooms.find((item) => item.name === input.roomName);
    if (!property || property.status !== "verified" || !room) {
      return sendError(res, 404, "BOOKING_UNAVAILABLE", "This property or room is not available for booking.");
    }
    if (roomAvailability(property, room.name, store) < 1) {
      return sendError(res, 409, "NO_UNITS_AVAILABLE", "This room type is fully rented.");
    }

    const booking = {
      id: createId(),
      studentId: req.user!.id,
      ...input,
      amount: room.price,
      status: "requested" as const,
      createdAt: now(),
    };
    store.bookings.set(booking.id, booking);
    res.status(201).json({ data: booking });
  });

  router.get("/bookings/mine", requireUser(auth, ["student"]), (req: AuthedRequest, res) => {
    const bookings = [...store.bookings.values()].filter((booking) => booking.studentId === req.user!.id);
    res.json({ data: bookings, meta: { count: bookings.length } });
  });

  router.get("/owner/bookings", requireUser(auth, ["owner"]), (req: AuthedRequest, res) => {
    const properties = [...store.properties.values()].filter((property) => property.ownerId === req.user!.id);
    const propertyIds = new Set(properties.map((property) => property.id));
    const bookings = [...store.bookings.values()]
      .filter((booking) => propertyIds.has(booking.propertyId))
      .map((booking) => {
        const student = store.users.get(booking.studentId);
        const property = store.properties.get(booking.propertyId);
        return {
          ...booking,
          propertyName: property?.name ?? "Property",
          studentName: student?.name ?? "Student",
          studentEmail: student?.email ?? "",
        };
      });
    res.json({ data: bookings, meta: { count: bookings.length } });
  });

  router.patch("/owner/bookings/:id", requireUser(auth, ["owner"]), (req: AuthedRequest, res) => {
    const input = parseBody(bookingStatusSchema, req.body);
    if (!input) return sendError(res, 400, "INVALID_REQUEST", "Provide a valid booking status.");
    const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const booking = store.bookings.get(bookingId);
    const property = booking ? store.properties.get(booking.propertyId) : undefined;
    if (!booking || property?.ownerId !== req.user!.id) return sendError(res, 404, "BOOKING_NOT_FOUND", "Booking not found.");
    if (input.status === "confirmed" && booking.status !== "confirmed" && property && roomAvailability(property, booking.roomName, store) < 1) {
      return sendError(res, 409, "NO_UNITS_AVAILABLE", "No units remain for this room type.");
    }
    const updated = { ...booking, status: input.status };
    store.bookings.set(updated.id, updated);
    res.json({ data: updated });
  });

  router.get("/owner/reviews", requireUser(auth, ["owner"]), (req: AuthedRequest, res) => {
    const propertyIds = new Set([...store.properties.values()].filter((property) => property.ownerId === req.user!.id).map((property) => property.id));
    const reviews = [...store.reviews.values()].filter((review) => propertyIds.has(review.propertyId)).map((review) => ({
      ...review,
      studentName: store.users.get(review.studentId)?.name ?? "Student",
      propertyName: store.properties.get(review.propertyId)?.name ?? "Property",
      roomName: store.bookings.get(review.bookingId)?.roomName ?? "Room",
    }));
    res.json({ data: reviews, meta: { count: reviews.length } });
  });

  router.patch("/owner/reviews/:id/reply", requireUser(auth, ["owner"]), (req: AuthedRequest, res) => {
    const input = parseBody(ownerReplySchema, req.body);
    if (!input) return sendError(res, 400, "INVALID_REQUEST", "Provide a reply.");
    const reviewId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const review = store.reviews.get(reviewId);
    const property = review ? store.properties.get(review.propertyId) : undefined;
    if (!review || property?.ownerId !== req.user!.id) return sendError(res, 404, "REVIEW_NOT_FOUND", "Review not found.");
    const updated = { ...review, ownerReply: input.ownerReply, updatedAt: now() };
    store.reviews.set(updated.id, updated);
    res.json({ data: updated });
  });

  router.post("/reviews", requireUser(auth, ["student"]), (req: AuthedRequest, res) => {
    const input = parseBody(studentReviewSchema, req.body);
    if (!input) return sendError(res, 400, "INVALID_REQUEST", "Provide a booking, rating, and review.");
    const booking = store.bookings.get(input.bookingId);
    if (!booking || booking.studentId !== req.user!.id) return sendError(res, 404, "BOOKING_NOT_FOUND", "Booking not found.");
    if (booking.status !== "confirmed") return sendError(res, 400, "BOOKING_NOT_COMPLETED", "Only confirmed bookings can be reviewed.");
    if ([...store.reviews.values()].some((review) => review.bookingId === booking.id)) return sendError(res, 409, "REVIEW_EXISTS", "This booking already has a review.");
    const timestamp = now();
    const review = { id: createId(), ...input, studentId: req.user!.id, propertyId: booking.propertyId, createdAt: timestamp, updatedAt: timestamp };
    store.reviews.set(review.id, review);
    res.status(201).json({ data: review });
  });

  router.get("/payments/mine", requireUser(auth, ["student"]), (_req, res) => {
    res.json({ data: [], meta: { count: 0, status: "payment_provider_not_configured" } });
  });

  router.post("/payments/intents", requireUser(auth, ["student"]), (req: AuthedRequest, res) => {
    const input = parseBody(paymentIntentSchema, req.body);
    if (!input) return sendError(res, 400, "INVALID_REQUEST", "Provide a valid booking id.");

    const booking = store.bookings.get(input.bookingId);
    if (!booking || booking.studentId !== req.user!.id) {
      return sendError(res, 404, "BOOKING_NOT_FOUND", "Booking not found.");
    }
    return sendError(res, 501, "PAYMENTS_NOT_CONFIGURED", "Payment processing is not connected yet.");
  });

  router.get("/messages/mine", requireUser(auth), (req: AuthedRequest, res) => {
    const messages = [...store.messages.values()].filter((message) => message.senderId === req.user!.id || message.recipientId === req.user!.id);
    res.json({ data: messages, meta: { count: messages.length } });
  });

  router.get("/messages/contacts", requireUser(auth), (req: AuthedRequest, res) => {
    const contacts = new Map<string, { id: string; name: string; email: string; role: Role }>();
    const addContact = (userId: string) => {
      if (userId === req.user!.id) return;
      const user = store.users.get(userId);
      if (user) contacts.set(user.id, { id: user.id, name: user.name, email: user.email, role: user.role });
    };

    if (req.user!.role === "student") {
      for (const application of store.applications.values()) {
        if (application.studentId === req.user!.id) addContact(store.properties.get(application.propertyId)?.ownerId ?? "");
      }
      for (const booking of store.bookings.values()) {
        if (booking.studentId === req.user!.id) addContact(store.properties.get(booking.propertyId)?.ownerId ?? "");
      }
    } else if (req.user!.role === "owner") {
      const propertyIds = new Set([...store.properties.values()].filter((property) => property.ownerId === req.user!.id).map((property) => property.id));
      for (const application of store.applications.values()) {
        if (propertyIds.has(application.propertyId)) addContact(application.studentId);
      }
      for (const booking of store.bookings.values()) {
        if (propertyIds.has(booking.propertyId)) addContact(booking.studentId);
      }
    }

    res.json({ data: [...contacts.values()] });
  });

  router.post("/messages", requireUser(auth), (req: AuthedRequest, res) => {
    const input = parseBody(messageSchema, req.body);
    if (!input) return sendError(res, 400, "INVALID_REQUEST", "Provide a recipient and message body.");
    if (!store.users.has(input.recipientId)) return sendError(res, 404, "USER_NOT_FOUND", "Recipient not found.");

    const message = { id: createId(), senderId: req.user!.id, ...input, createdAt: now() };
    store.messages.set(message.id, message);
    res.status(201).json({ data: message });
  });

  router.get("/notifications/mine", requireUser(auth), (req: AuthedRequest, res) => {
    const notifications = [...store.notifications.values()].filter((notification) => notification.userId === req.user!.id);
    res.json({ data: notifications, meta: { count: notifications.length } });
  });

  router.get("/maintenance/mine", requireUser(auth, ["student"]), (req: AuthedRequest, res) => {
    const requests = [...store.maintenanceRequests.values()].filter((request) => request.studentId === req.user!.id);
    res.json({ data: requests, meta: { count: requests.length } });
  });

  router.post("/maintenance", requireUser(auth, ["student"]), (req: AuthedRequest, res) => {
    const input = parseBody(maintenanceSchema, req.body);
    if (!input) return sendError(res, 400, "INVALID_REQUEST", "Provide a subject and maintenance description.");
    if (input.propertyId && !store.properties.has(input.propertyId)) return sendError(res, 404, "PROPERTY_NOT_FOUND", "Property not found.");

    const request = { id: createId(), studentId: req.user!.id, ...input, status: "submitted" as const, createdAt: now() };
    store.maintenanceRequests.set(request.id, request);
    res.status(201).json({ data: request });
  });

  router.post("/support/tickets", (req, res) => {
    const input = parseBody(supportSchema, req.body);
    if (!input) return sendError(res, 400, "INVALID_REQUEST", "Provide a name, valid email, topic, and message.");

    const user = auth.getUserByToken(getBearerToken(req.header("authorization")));
    const ticket = { id: createId(), ...input, status: "open" as const, userId: user?.id, createdAt: now() };
    store.supportTickets.set(ticket.id, ticket);
    res.status(201).json({ data: { id: ticket.id, status: "received", createdAt: ticket.createdAt } });
  });

  router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    sendError(res, 500, "INTERNAL_ERROR", "The server could not complete the request.");
  });

  return router;
}
