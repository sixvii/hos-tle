import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AuthService } from "./auth";
import { getBackendConfig } from "./config";
import type { BackendStore } from "./store";
import { createBackendRouter } from "./router";

let server: Server;
let baseUrl = "";
let reviewerToken = "";
let auth: AuthService;
let store: BackendStore;

beforeAll(async () => {
  store = {
    users: new Map(),
    usersByEmail: new Map(),
    sessions: new Map(),
    passwordResetTokens: new Map(),
    properties: new Map(),
    applications: new Map(),
    bookings: new Map(),
    reviews: new Map(),
    maintenanceRequests: new Map(),
    messages: new Map(),
    notifications: new Map(),
    supportTickets: new Map(),
  };
  const config = getBackendConfig({ NODE_ENV: "test" });
  auth = new AuthService(store, config);
  const admin = auth.createUser({
    name: "Inventory Reviewer",
    email: "inventory-reviewer@example.com",
    password: "correct-horse-battery-staple",
    role: "admin",
  });
  reviewerToken = auth.createSession(admin).token;
  const app = express();
  app.use(express.json());
  app.use("/api/v1", createBackendRouter(store, auth, config));

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not start");
  baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

describe("backend API", () => {
  it("keeps sessions available to a new auth service without storing raw tokens", () => {
    const user = auth.createUser({
      name: "Persistent Session User",
      email: `persistent-session-${Date.now()}@example.com`,
      password: "correct-horse-battery-staple",
      role: "student",
    });
    const session = auth.createSession(user);
    const restartedAuth = new AuthService(store, getBackendConfig({ NODE_ENV: "test" }));

    expect(store.sessions.has(session.token)).toBe(false);
    expect(restartedAuth.getUserByToken(session.token)?.id).toBe(user.id);
    restartedAuth.revokeSession(session.token);
    expect(auth.getUserByToken(session.token)).toBeNull();
  });

  it("replaces the legacy default superadmin credentials", () => {
    const legacyAdmin = auth.createUser({
      name: "Legacy Super Admin",
      email: "superadmin@admin.com",
      password: "password123",
      role: "superadmin",
    });

    const configuredAdmin = auth.ensureConfiguredSuperadmin("root@example.com", "a-unique-production-password");

    expect(store.users.get(legacyAdmin.id)?.status).toBe("suspended");
    expect(auth.authenticate("superadmin@admin.com", "password123")).toBeNull();
    expect(configuredAdmin.mustChangePassword).toBe(true);
    expect(auth.authenticate("root@example.com", "a-unique-production-password")?.id).toBe(configuredAdmin.id);
  });

  it("requires an initial admin password change before protected actions", async () => {
    const admin = auth.createUser({
      name: "Temporary Admin",
      email: `temporary-admin-${Date.now()}@example.com`,
      password: "temporary-admin-password",
      role: "admin",
      mustChangePassword: true,
    });
    const token = auth.createSession(admin).token;
    const blocked = await fetch(`${baseUrl}/admin/overview`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const changed = await fetch(`${baseUrl}/auth/password`, {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ password: "permanent-admin-password" }),
    });
    const allowed = await fetch(`${baseUrl}/admin/overview`, {
      headers: { authorization: `Bearer ${token}` },
    });

    expect(blocked.status).toBe(403);
    expect((await blocked.json()).error.code).toBe("PASSWORD_CHANGE_REQUIRED");
    expect(changed.status).toBe(200);
    expect(allowed.status).toBe(200);
  });

  it("reports health and starts with no marketplace records", async () => {
    const health = await fetch(`${baseUrl}/health`);
    const hostels = await fetch(`${baseUrl}/hostels?verified=true`);

    expect(health.status).toBe(200);
    expect((await health.json()).data).toBe("in-memory-empty-store");
    expect(hostels.status).toBe(200);
    expect((await hostels.json()).data).toEqual([]);
  });

  it("reports unavailable external sign-in services without leaking account details", async () => {
    const google = await fetch(`${baseUrl}/auth/google`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ credential: "x".repeat(30), role: "student" }),
    });
    const reset = await fetch(`${baseUrl}/auth/password/forgot`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "unknown@example.com" }),
    });

    expect(google.status).toBe(503);
    expect(reset.status).toBe(503);
  });

  it("rejects invalid or expired password reset tokens", async () => {
    const response = await fetch(`${baseUrl}/auth/password/reset`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "x".repeat(32), password: "new-secure-password" }),
    });

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("INVALID_RESET_TOKEN");
  });

  it("resets a password once and revokes the user's existing sessions", async () => {
    const user = auth.createUser({
      name: "Password Reset User",
      email: `password-reset-${Date.now()}@example.com`,
      password: "old-secure-password",
      role: "student",
    });
    const session = auth.createSession(user);
    const resetToken = auth.issuePasswordResetToken(user.id);
    const response = await fetch(`${baseUrl}/auth/password/reset`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: resetToken, password: "new-secure-password" }),
    });
    const oldSession = await fetch(`${baseUrl}/me`, {
      headers: { authorization: `Bearer ${session.token}` },
    });
    const oldPassword = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: user.email, password: "old-secure-password" }),
    });
    const newPassword = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: user.email, password: "new-secure-password" }),
    });

    expect(response.status).toBe(200);
    expect(oldSession.status).toBe(401);
    expect(oldPassword.status).toBe(401);
    expect(newPassword.status).toBe(200);
    expect(session.token).not.toBe(resetToken);
  });

  it("creates a student session and returns the current user", async () => {
    const signup = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Test Student",
        email: `student-${Date.now()}@example.com`,
        password: "correct-horse-battery-staple",
        role: "student",
        schoolName: "Lagos State University",
        phoneNumber: "+2348000000001",
        gender: "male",
      }),
    });
    const signupBody = await signup.json();
    const me = await fetch(`${baseUrl}/me`, {
      headers: { authorization: `Bearer ${signupBody.token}` },
    });

    expect(signup.status).toBe(201);
    expect(signupBody.user).toMatchObject({ name: "Test Student", role: "student" });
    expect(signupBody.user.passwordHash).toBeUndefined();
    expect(me.status).toBe(200);
    expect((await me.json()).user.email).toBe(signupBody.user.email);
  });

  it("requires owner phone number and company address only for company owners", async () => {
    const missingPhone = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Owner Without Phone",
        email: `owner-no-phone-${Date.now()}@example.com`,
        password: "correct-horse-battery-staple",
        role: "owner",
        ownerType: "personal",
      }),
    });

    expect(missingPhone.status).toBe(400);
    expect((await missingPhone.json()).error.message).toContain("Phone number is required");

    const companyOwner = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Company Owner",
        email: `owner-company-${Date.now()}@example.com`,
        password: "correct-horse-battery-staple",
        role: "owner",
        phoneNumber: "+2348000000000",
        ownerType: "company",
        companyAddress: "12 Broad Street, Lagos",
      }),
    });

    expect(companyOwner.status).toBe(201);
    expect((await companyOwner.json()).user).toMatchObject({
      role: "owner",
      ownerType: "company",
      companyAddress: "12 Broad Street, Lagos",
    });
  });

  it("stores video-only property media", async () => {
    const signup = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Video Property Owner",
        email: `owner-video-${Date.now()}@example.com`,
        password: "correct-horse-battery-staple",
        role: "owner",
        phoneNumber: "+2348000000003",
        ownerType: "personal",
      }),
    });
    const { token } = await signup.json();
    const response = await fetch(`${baseUrl}/properties`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: "Video Hostel",
        description: "A property shown with a video tour.",
        city: "Lagos",
        area: "Yaba",
        university: "University of Lagos",
        distance: "2 km",
        photos: [],
        videos: ["https://res.cloudinary.com/example/video/upload/tour.mp4"],
        amenities: ["Wi-Fi"],
        rooms: [{ name: "Single room", beds: 1, units: 2, price: 400000 }],
      }),
    });
    const property = (await response.json()).data;

    expect(response.status).toBe(201);
    expect(property).toMatchObject({
      ownerName: "Video Property Owner",
      photos: [],
      videos: ["https://res.cloudinary.com/example/video/upload/tour.mp4"],
      rooms: [{ name: "Single room", units: 2, availableUnits: 2 }],
    });
  });

  it("tracks available room units through applications and bookings", async () => {
    const signup = async (name: string, role: "owner" | "student") => {
      const response = await fetch(`${baseUrl}/auth/signup`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email: `${name.toLowerCase().replaceAll(" ", "-")}-${Date.now()}@example.com`,
          password: "correct-horse-battery-staple",
          role,
          phoneNumber: "+2348000000000",
          ownerType: role === "owner" ? "personal" : undefined,
          schoolName: role === "student" ? "Test University" : undefined,
          gender: role === "student" ? "prefer_not_to_say" : undefined,
        }),
      });
      return response.json();
    };
    const owner = await signup("Inventory Owner", "owner");
    const applicant = await signup("First Applicant", "student");
    const renter = await signup("Confirmed Renter", "student");
    const anotherApplicant = await signup("Another Applicant", "student");
    const ownerHeaders = {
      "content-type": "application/json",
      authorization: `Bearer ${owner.token}`,
    };
    const reviewerHeaders = {
      "content-type": "application/json",
      authorization: `Bearer ${reviewerToken}`,
    };
    const propertyResponse = await fetch(`${baseUrl}/properties`, {
      method: "POST",
      headers: ownerHeaders,
      body: JSON.stringify({
        name: "Unit Inventory House",
        description: "Room inventory test.",
        city: "Lagos",
        area: "Yaba",
        university: "Test University",
        distance: "1 km",
        photos: [],
        amenities: ["Wi-Fi"],
        rooms: [{ name: "Single room", beds: 4, units: 2, price: 400000 }],
      }),
    });
    const property = (await propertyResponse.json()).data;
    const propertyId = property.id as string;

    const verified = await fetch(`${baseUrl}/properties/${propertyId}/review`, {
      method: "PATCH",
      headers: reviewerHeaders,
      body: JSON.stringify({ status: "verified" }),
    });
    expect(verified.status).toBe(200);

    const applicationResponse = await fetch(`${baseUrl}/applications`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${applicant.token}`,
      },
      body: JSON.stringify({
        propertyId,
        roomName: "Single room",
        moveInDate: "2026-10-01",
        details: {},
        documents: [],
      }),
    });
    const application = (await applicationResponse.json()).data;
    const approval = await fetch(`${baseUrl}/applications/${application.id}/review`, {
      method: "PATCH",
      headers: reviewerHeaders,
      body: JSON.stringify({ status: "approved" }),
    });
    expect(approval.status).toBe(200);

    const bookingResponse = await fetch(`${baseUrl}/bookings`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${renter.token}`,
      },
      body: JSON.stringify({ propertyId, roomName: "Single room", moveInDate: "2026-10-01" }),
    });
    const booking = (await bookingResponse.json()).data;
    const confirmation = await fetch(`${baseUrl}/owner/bookings/${booking.id}`, {
      method: "PATCH",
      headers: ownerHeaders,
      body: JSON.stringify({ status: "confirmed" }),
    });
    expect(confirmation.status).toBe(200);

    const unavailableApplication = await fetch(`${baseUrl}/applications`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${anotherApplicant.token}`,
      },
      body: JSON.stringify({
        propertyId,
        roomName: "Single room",
        moveInDate: "2026-10-01",
        details: {},
        documents: [],
      }),
    });
    expect(unavailableApplication.status).toBe(409);

    const cancelBooking = await fetch(`${baseUrl}/owner/bookings/${booking.id}`, {
      method: "PATCH",
      headers: ownerHeaders,
      body: JSON.stringify({ status: "cancelled" }),
    });
    expect(cancelBooking.status).toBe(200);
    const rejectApplication = await fetch(`${baseUrl}/applications/${application.id}/review`, {
      method: "PATCH",
      headers: reviewerHeaders,
      body: JSON.stringify({ status: "rejected" }),
    });
    expect(rejectApplication.status).toBe(200);

    const updatedProperty = await fetch(`${baseUrl}/hostels/${propertyId}`);
    const room = (await updatedProperty.json()).data.rooms[0];
    expect(room).toMatchObject({ units: 2, availableUnits: 2 });
  });

  it("does not allow an unauthenticated application submission", async () => {
    const response = await fetch(`${baseUrl}/applications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ propertyId: "00000000-0000-0000-0000-000000000000", roomName: "Room", moveInDate: "2026-09-01" }),
    });

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("UNAUTHENTICATED");
  });

  it("returns empty operation states until records are created", async () => {
    const signup = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Operations Student",
        email: `operations-${Date.now()}@example.com`,
        password: "correct-horse-battery-staple",
        role: "student",
        schoolName: "University of Ibadan",
        phoneNumber: "+2348000000002",
        gender: "female",
      }),
    });
    const { token } = await signup.json();
    const headers = { authorization: `Bearer ${token}` };

    const [payments, messages, notifications, maintenance] = await Promise.all([
      fetch(`${baseUrl}/payments/mine`, { headers }),
      fetch(`${baseUrl}/messages/mine`, { headers }),
      fetch(`${baseUrl}/notifications/mine`, { headers }),
      fetch(`${baseUrl}/maintenance/mine`, { headers }),
    ]);

    for (const response of [payments, messages, notifications, maintenance]) {
      expect(response.status).toBe(200);
      expect((await response.json()).data).toEqual([]);
    }
  });
});
