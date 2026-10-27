import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { BackendConfig } from "./config";
import type { Role, Session, User } from "./domain";
import { createId, now, type BackendStore } from "./store";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, expectedHash] = storedHash.split(":");
  if (!salt || !expectedHash) return false;

  const actualHash = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, "hex");
  return expected.length === actualHash.length && timingSafeEqual(expected, actualHash);
}

export class AuthService {
  constructor(
    private readonly store: BackendStore,
    private readonly config: BackendConfig,
  ) {}

  ensureConfiguredSuperadmin(email: string, password: string): User {
    const normalizedEmail = email.trim().toLowerCase();
    const legacyId = this.store.usersByEmail.get("superadmin@admin.com");
    const legacyUser = legacyId ? this.store.users.get(legacyId) : undefined;
    if (legacyUser && verifyPassword("password123", legacyUser.passwordHash)) {
      if (legacyUser.email === normalizedEmail) {
        const updated = { ...legacyUser, passwordHash: hashPassword(password), mustChangePassword: true };
        this.store.users.set(updated.id, updated);
        return updated;
      }
      this.store.users.set(legacyUser.id, { ...legacyUser, status: "suspended" });
    }

    const existingId = this.store.usersByEmail.get(normalizedEmail);
    const existing = existingId ? this.store.users.get(existingId) : undefined;
    if (existing) return existing;
    return this.createUser({
      email: normalizedEmail,
      name: "Super Admin",
      password,
      role: "superadmin",
      mustChangePassword: true,
    });
  }

  createUser(input: { email: string; name: string; firstName?: string; lastName?: string; password: string; role: Role; schoolName?: string; phoneNumber?: string; gender?: User["gender"]; ownerType?: User["ownerType"]; companyAddress?: string; mustChangePassword?: boolean }): User {
    const email = input.email.trim().toLowerCase();
    if (this.store.usersByEmail.has(email)) {
      throw new Error("EMAIL_ALREADY_REGISTERED");
    }

    const user: User = {
      id: createId(),
      email,
      name: input.name.trim(),
      firstName: input.firstName?.trim(),
      lastName: input.lastName?.trim(),
      schoolName: input.schoolName?.trim(),
      phoneNumber: input.phoneNumber?.trim(),
      gender: input.gender,
      ownerType: input.ownerType,
      companyAddress: input.companyAddress?.trim(),
      role: input.role,
      status: "active",
      mustChangePassword: input.mustChangePassword,
      passwordHash: hashPassword(input.password),
      createdAt: now(),
    };

    this.store.users.set(user.id, user);
    this.store.usersByEmail.set(user.email, user.id);
    return user;
  }

  changePassword(user: User, password: string): User {
    const updated = { ...user, passwordHash: hashPassword(password), mustChangePassword: false };
    this.store.users.set(updated.id, updated);
    for (const [tokenHash, reset] of this.store.passwordResetTokens) {
      if (reset.userId === user.id) this.store.passwordResetTokens.delete(tokenHash);
    }
    return updated;
  }

  issuePasswordResetToken(userId: string): string {
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const nowMs = Date.now();
    for (const [existingHash, reset] of this.store.passwordResetTokens) {
      if (reset.expiresAt <= nowMs || reset.userId === userId) this.store.passwordResetTokens.delete(existingHash);
    }
    this.store.passwordResetTokens.set(tokenHash, { userId, expiresAt: nowMs + 30 * 60 * 1000 });
    return token;
  }

  resetPasswordWithToken(token: string, password: string): User | null {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const reset = this.store.passwordResetTokens.get(tokenHash);
    if (!reset) return null;
    this.store.passwordResetTokens.delete(tokenHash);
    if (reset.expiresAt <= Date.now()) return null;
    const user = this.store.users.get(reset.userId);
    if (!user || user.status === "suspended") return null;
    const updated = this.changePassword(user, password);
    for (const [sessionTokenHash, session] of this.store.sessions) {
      if (session.userId === user.id) this.store.sessions.delete(sessionTokenHash);
    }
    return updated;
  }

  authenticate(email: string, password: string): User | null {
    const userId = this.store.usersByEmail.get(email.trim().toLowerCase());
    if (!userId) return null;

    const user = this.store.users.get(userId);
    return user && user.status !== "suspended" && verifyPassword(password, user.passwordHash) ? user : null;
  }

  createSession(user: User): Session {
    const session: Session = {
      token: randomBytes(32).toString("hex"),
      userId: user.id,
      expiresAt: Date.now() + this.config.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
    };
    this.store.sessions.set(createHash("sha256").update(session.token).digest("hex"), {
      userId: session.userId,
      expiresAt: session.expiresAt,
    });
    return session;
  }

  getUserByToken(token: string | undefined): User | null {
    if (!token) return null;
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const session = this.store.sessions.get(tokenHash);
    if (!session) return null;
    if (session.expiresAt <= Date.now()) {
      this.store.sessions.delete(tokenHash);
      return null;
    }
    const user = this.store.users.get(session.userId);
    if (!user || user.status === "suspended") return null;
    return user;
  }

  revokeSession(token: string | undefined): void {
    if (token) this.store.sessions.delete(createHash("sha256").update(token).digest("hex"));
  }
}

export function getBearerToken(header: string | undefined): string | undefined {
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice("Bearer ".length).trim() || undefined;
}

export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    profilePhotoUrl: user.profilePhotoUrl,
    schoolName: user.schoolName,
    phoneNumber: user.phoneNumber,
    gender: user.gender,
    ownerType: user.ownerType,
    companyAddress: user.companyAddress,
    role: user.role,
    status: user.status ?? "active",
    mustChangePassword: user.mustChangePassword ?? false,
    createdAt: user.createdAt,
  };
}
