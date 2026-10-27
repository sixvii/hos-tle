import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient, type Collection } from "mongodb";
import type { BackendConfig } from "./config";
import type { Application, Booking, MaintenanceRequest, Message, Notification, Property, Review, SupportTicket, User } from "./domain";

export type BackendStore = {
  users: Map<string, User>;
  usersByEmail: Map<string, string>;
  sessions: Map<string, { userId: string; expiresAt: number }>;
  passwordResetTokens: Map<string, { userId: string; expiresAt: number }>;
  properties: Map<string, Property>;
  applications: Map<string, Application>;
  bookings: Map<string, Booking>;
  reviews: Map<string, Review>;
  maintenanceRequests: Map<string, MaintenanceRequest>;
  messages: Map<string, Message>;
  notifications: Map<string, Notification>;
  supportTickets: Map<string, SupportTicket>;
};

type PersistedDocument = Record<string, unknown> & { _id: string };

class PersistentMap<T> extends Map<string, T> {
  constructor(
    private readonly collection?: Collection<PersistedDocument>,
    private readonly localFile?: string,
  ) {
    super();
  }

  override set(key: string, value: T): this {
    super.set(key, value);
    if (this.collection) {
      void this.collection.replaceOne({ _id: key }, { ...value, _id: key }, { upsert: true }).catch((error) => {
        console.error(`Could not persist ${this.collection?.collectionName} record`, error);
      });
    }
    if (this.localFile) void this.persistLocal();
    return this;
  }

  override delete(key: string): boolean {
    const deleted = super.delete(key);
    if (deleted && this.collection) {
      void this.collection.deleteOne({ _id: key }).catch((error) => {
        console.error(`Could not delete ${this.collection?.collectionName} record`, error);
      });
    }
    if (deleted && this.localFile) void this.persistLocal();
    return deleted;
  }

  async load(): Promise<void> {
    if (!this.collection) return;
    for await (const document of this.collection.find()) {
      const { _id, ...value } = document;
      super.set(_id, value as T);
    }
  }

  private async persistLocal(): Promise<void> {
    if (!this.localFile) return;
    await mkdir(path.dirname(this.localFile), { recursive: true });
    await writeFile(this.localFile, JSON.stringify(Object.fromEntries(this), null, 2));
  }

  async loadLocal(): Promise<void> {
    if (!this.localFile) return;
    try {
      const saved = JSON.parse(await readFile(this.localFile, "utf8")) as Record<string, T>;
      for (const [key, value] of Object.entries(saved)) super.set(key, value);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}

export type BackendStoreWithLifecycle = BackendStore & {
  ready: Promise<void>;
  close: () => Promise<void>;
};

export function createBackendStore(config?: BackendConfig): BackendStoreWithLifecycle {
  const client = config?.MONGODB_URI && config.MONGODB_DB
    ? new MongoClient(config.MONGODB_URI, {
        appName: "arc-api",
        serverSelectionTimeoutMS: config.NODE_ENV === "development" ? 5000 : 30000,
      })
    : null;
  const database = client && config?.MONGODB_DB ? client.db(config.MONGODB_DB) : null;
  const collection = (name: string) => database?.collection<PersistedDocument>(name);
  const localData = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".data");
  const localFile = (name: string) => database ? undefined : path.join(localData, `${name}.json`);

  const store = {
    users: new PersistentMap<User>(collection("users"), localFile("users")),
    usersByEmail: new Map<string, string>(),
    sessions: new PersistentMap<{ userId: string; expiresAt: number }>(collection("sessions"), localFile("sessions")),
    passwordResetTokens: new PersistentMap<{ userId: string; expiresAt: number }>(collection("passwordResetTokens"), localFile("passwordResetTokens")),
    properties: new PersistentMap<Property>(collection("properties"), localFile("properties")),
    applications: new PersistentMap<Application>(collection("applications"), localFile("applications")),
    bookings: new PersistentMap<Booking>(collection("bookings"), localFile("bookings")),
    reviews: new PersistentMap<Review>(collection("reviews"), localFile("reviews")),
    maintenanceRequests: new PersistentMap<MaintenanceRequest>(collection("maintenanceRequests"), localFile("maintenanceRequests")),
    messages: new PersistentMap<Message>(collection("messages"), localFile("messages")),
    notifications: new PersistentMap<Notification>(collection("notifications"), localFile("notifications")),
    supportTickets: new PersistentMap<SupportTicket>(collection("supportTickets"), localFile("supportTickets")),
  } satisfies BackendStore;

  const persistentMaps = [
    store.users,
    store.sessions,
    store.passwordResetTokens,
    store.properties,
    store.applications,
    store.bookings,
    store.reviews,
    store.maintenanceRequests,
    store.messages,
    store.notifications,
    store.supportTickets,
  ];

  const ready = client
    ? client.connect().then(async () => {
        await Promise.all(persistentMaps.map((map) => map.load()));
        for (const user of store.users.values()) store.usersByEmail.set(user.email, user.id);
      })
    : Promise.all(persistentMaps.map((map) => map.loadLocal())).then(() => {
        for (const user of store.users.values()) store.usersByEmail.set(user.email, user.id);
      });

  return {
    ...store,
    ready,
    close: async () => {
      await client?.close();
    },
  };
}

export function createId(): string {
  return randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}
