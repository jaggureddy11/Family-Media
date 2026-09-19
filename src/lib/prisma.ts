import { PrismaClient, Role } from "@prisma/client";
import { SAMPLE_MEDIA } from "./sample-media";

// Global singleton for PrismaClient
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  mockDb: InMemoryDb | undefined;
};

// In-memory fallback database for test environments and when Neon is not yet connected
class InMemoryDb {
  users: any[] = [];
  devices: any[] = [];
  deviceLinks: any[] = [];
  mediaItems: any[] = [];
  albums: any[] = [];
  albumItems: any[] = [];
  systemSettings: any[] = [];

  constructor() {
    // Seed initial admin user
    this.users.push({
      id: "admin-1",
      email: "admin@kutumbam.local",
      name_en: "Family Admin",
      name_te: "కుటుంబ నిర్వాహకుడు",
      role: Role.ADMIN,
      textSize: "EXTRA_LARGE",
      highContrast: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed default Mom user for tests
    this.users.push({
      id: "mom-1",
      email: null,
      name_en: "Amma",
      name_te: "అమ్మా",
      role: Role.FAMILY,
      textSize: "EXTRA_LARGE",
      highContrast: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed initial library with 30 realistic items
    SAMPLE_MEDIA.forEach((item, index) => {
      this.mediaItems.push({
        id: `media_${index + 1}`,
        type: item.type,
        status: "READY",
        title_en: item.title_en,
        title_te: item.title_te,
        titleEn: item.titleEn,
        titleTe: item.titleTe,
        year: item.year,
        durationSeconds: item.durationSeconds,
        durationSec: item.durationSec,
        sizeBytes: item.sizeBytes,
        checksumSha256: item.checksumSha256,
        mimeType: item.mimeType,
        originalKey: item.originalKey,
        storageKey: item.storageKey,
        posterKey: item.posterKey || null,
        thumbKey: item.thumbKey || null,
        createdAt: new Date(Date.now() - (30 - index) * 3600000),
        updatedAt: new Date(),
      });
    });
  }

  get user() {
    return {
      findFirst: async (query?: any) => {
        if (query?.where?.role) {
          return this.users.find((u) => u.role === query.where.role) || null;
        }
        return this.users[0] || null;
      },
      findUnique: async (query: any) => {
        return this.users.find((u) => u.id === query.where.id) || null;
      },
      findMany: async (query?: any) => {
        return this.users.map((u) => ({
          ...u,
          devices: this.devices.filter((d) => d.userId === u.id && !d.isRevoked),
        }));
      },
      create: async ({ data }: any) => {
        const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const user = {
          id,
          email: data.email || null,
          name_en: data.name_en,
          name_te: data.name_te,
          role: data.role || Role.FAMILY,
          textSize: data.textSize || "EXTRA_LARGE",
          highContrast: data.highContrast || false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.users.push(user);
        return user;
      },
      upsert: async ({ where, create, update }: any) => {
        const existing = this.users.find(
          (u) =>
            (where.id && u.id === where.id) ||
            (where.email && u.email === where.email)
        );
        if (existing) {
          Object.assign(existing, update, { updatedAt: new Date() });
          return existing;
        }
        const id = where.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const user = {
          id,
          email: create.email || null,
          name_en: create.name_en,
          name_te: create.name_te,
          role: create.role || Role.FAMILY,
          textSize: create.textSize || "EXTRA_LARGE",
          highContrast: create.highContrast || false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.users.push(user);
        return user;
      },
      update: async ({ where, data }: any) => {
        const user = this.users.find((u) => u.id === where.id || (where.email && u.email === where.email));
        if (user) {
          Object.assign(user, data, { updatedAt: new Date() });
        }
        return user;
      },
      deleteMany: async ({ where }: any = {}) => {
        const before = this.users.length;
        if (where?.role) {
          this.users = this.users.filter((u) => u.role !== where.role);
        }
        return { count: before - this.users.length };
      },
    };
  }

  get device() {
    return {
      create: async ({ data }: any) => {
        const id = `dev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const dev = {
          id,
          userId: data.userId,
          deviceName: data.deviceName,
          tokenHash: data.tokenHash,
          userAgent: data.userAgent || null,
          ipAddress: data.ipAddress || null,
          isRevoked: data.isRevoked ?? false,
          expiresAt: data.expiresAt,
          lastSeenAt: new Date(),
          createdAt: new Date(),
        };
        this.devices.push(dev);
        return dev;
      },
      findUnique: async ({ where, include }: any) => {
        let dev: any = null;
        if (where.tokenHash) {
          dev = this.devices.find((d) => d.tokenHash === where.tokenHash);
        } else if (where.id) {
          dev = this.devices.find((d) => d.id === where.id);
        }
        if (!dev) return null;
        if (include?.user) {
          const user = this.users.find((u) => u.id === dev.userId);
          return { ...dev, user };
        }
        return dev;
      },
      findMany: async (query?: any) => {
        return this.devices.map((d) => ({
          ...d,
          user: this.users.find((u) => u.id === d.userId),
        }));
      },
      update: async ({ where, data }: any) => {
        const dev = this.devices.find((d) => d.id === where.id);
        if (dev) {
          Object.assign(dev, data);
        }
        return dev;
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        for (const dev of this.devices) {
          if (where.tokenHash && dev.tokenHash === where.tokenHash) {
            Object.assign(dev, data);
            count++;
          }
        }
        return { count };
      },
    };
  }

  get deviceLink() {
    return {
      create: async ({ data }: any) => {
        const id = `link-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const link = {
          id,
          userId: data.userId,
          tokenHash: data.tokenHash,
          createdByAdminId: data.createdByAdminId || null,
          expiresAt: data.expiresAt,
          usedAt: null,
          createdAt: new Date(),
        };
        this.deviceLinks.push(link);
        return link;
      },
      findUnique: async ({ where, include }: any) => {
        const link = this.deviceLinks.find((l) => l.tokenHash === where.tokenHash);
        if (!link) return null;
        if (include?.user) {
          const user = this.users.find((u) => u.id === link.userId);
          return { ...link, user };
        }
        return link;
      },
      update: async ({ where, data }: any) => {
        const link = this.deviceLinks.find((l) => l.id === where.id);
        if (link) {
          Object.assign(link, data);
        }
        return link;
      },
    };
  }

  get mediaItem() {
    return {
      create: async ({ data }: any) => {
        const id = `media_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const item = {
          id,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.mediaItems.push(item);
        return item;
      },
      findMany: async ({ where, orderBy, take }: any = {}) => {
        let results = [...this.mediaItems];
        if (where) {
          if (where.id) {
            if (typeof where.id === "string") {
              results = results.filter((m) => m.id === where.id);
            } else if (where.id.in && Array.isArray(where.id.in)) {
              results = results.filter((m) => where.id.in.includes(m.id));
            }
          }
          if (where.type) {
            if (typeof where.type === "string") {
              results = results.filter((m) => m.type === where.type);
            } else if (where.type.in && Array.isArray(where.type.in)) {
              results = results.filter((m) => where.type.in.includes(m.type));
            }
          }
          if (where.status) {
            if (typeof where.status === "string") {
              results = results.filter((m) => m.status === where.status);
            } else if (where.status.in && Array.isArray(where.status.in)) {
              results = results.filter((m) => where.status.in.includes(m.status));
            }
          }
          if (where.checksumSha256) results = results.filter((m) => m.checksumSha256 === where.checksumSha256);
          if (where.OR) {
            results = results.filter((m) =>
              where.OR.some((cond: any) => {
                const q = (cond.title_en?.contains || cond.title_te?.contains || cond.originalKey?.contains || "").toLowerCase();
                return (
                  m.title_en?.toLowerCase().includes(q) ||
                  m.title_te?.toLowerCase().includes(q) ||
                  m.titleEn?.toLowerCase().includes(q) ||
                  m.titleTe?.toLowerCase().includes(q) ||
                  m.originalName?.toLowerCase().includes(q)
                );
              })
            );
          }
        }
        if (orderBy?.createdAt === "desc") {
          results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        if (take) {
          results = results.slice(0, take);
        }
        return results;
      },
      findUnique: async ({ where }: any) => {
        if (where.id) return this.mediaItems.find((m) => m.id === where.id) || null;
        if (where.originalKey) return this.mediaItems.find((m) => m.originalKey === where.originalKey) || null;
        if (where.storageKey) return this.mediaItems.find((m) => m.storageKey === where.storageKey || m.originalKey === where.storageKey) || null;
        return null;
      },
      findFirst: async ({ where }: any) => {
        if (where.checksumSha256) {
          return this.mediaItems.find((m) => m.checksumSha256 === where.checksumSha256) || null;
        }
        if (where.checksum) {
          return this.mediaItems.find((m) => m.checksum === where.checksum || m.checksumSha256 === where.checksum) || null;
        }
        if (where.originalName) {
          return this.mediaItems.find((m) => m.originalName === where.originalName) || null;
        }
        return this.mediaItems[0] || null;
      },
      update: async ({ where, data }: any) => {
        const item = this.mediaItems.find((m) => m.id === where.id);
        if (item) {
          Object.assign(item, data);
          item.updatedAt = new Date();
        }
        return item;
      },
      delete: async ({ where }: any) => {
        const idx = this.mediaItems.findIndex((m) => m.id === where.id);
        if (idx !== -1) {
          const [removed] = this.mediaItems.splice(idx, 1);
          return removed;
        }
        return null;
      },
      upsert: async ({ where, create, update }: any) => {
        const existing = this.mediaItems.find(
          (m) =>
            (where.id && m.id === where.id) ||
            (where.originalKey && m.originalKey === where.originalKey) ||
            (where.storageKey && (m.storageKey === where.storageKey || m.originalKey === where.storageKey))
        );
        if (existing) {
          Object.assign(existing, update);
          return existing;
        }
        const id = `media_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const newItem = {
          id,
          ...create,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.mediaItems.push(newItem);
        return newItem;
      },
    };
  }

  get album() {
    return {
      findMany: async ({ where, include, orderBy }: any = {}) => {
        let list = [...this.albums];
        if (where?.isAutoYearly !== undefined) {
          list = list.filter((a) => a.isAutoYearly === where.isAutoYearly);
        }
        if (where?.year) {
          list = list.filter((a) => a.year === where.year);
        }
        if (orderBy?.year === "desc") {
          list.sort((a, b) => (b.year || 0) - (a.year || 0));
        }
        return list.map((a) => {
          const items = this.albumItems.filter((ai) => ai.albumId === a.id);
          const mapped: any = { ...a };
          if (include?.items) {
            mapped.items = items.map((ai) => ({
              ...ai,
              mediaItem: this.mediaItems.find((m) => m.id === ai.mediaItemId) || null,
            }));
          }
          if (include?._count) {
            mapped._count = { items: items.length };
          }
          return mapped;
        });
      },
      findUnique: async ({ where, include }: any) => {
        const a = this.albums.find((alb) => alb.id === where.id);
        if (!a) return null;
        const items = this.albumItems.filter((ai) => ai.albumId === a.id);
        const mapped: any = { ...a };
        if (include?.items) {
          mapped.items = items.map((ai) => ({
            ...ai,
            mediaItem: this.mediaItems.find((m) => m.id === ai.mediaItemId) || null,
          }));
        }
        if (include?._count) {
          mapped._count = { items: items.length };
        }
        return mapped;
      },
      create: async ({ data }: any) => {
        const id = `album_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const alb = {
          id,
          title_en: data.title_en,
          title_te: data.title_te,
          coverKey: data.coverKey || null,
          isAutoYearly: data.isAutoYearly || false,
          year: data.year || null,
          sortOrder: data.sortOrder || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.albums.push(alb);
        return alb;
      },
      update: async ({ where, data }: any) => {
        const alb = this.albums.find((a) => a.id === where.id);
        if (alb) {
          Object.assign(alb, data, { updatedAt: new Date() });
        }
        return alb;
      },
      delete: async ({ where }: any) => {
        const idx = this.albums.findIndex((a) => a.id === where.id);
        if (idx !== -1) {
          const [removed] = this.albums.splice(idx, 1);
          this.albumItems = this.albumItems.filter((ai) => ai.albumId !== where.id);
          return removed;
        }
        return null;
      },
    };
  }

  get albumItem() {
    return {
      findMany: async ({ where }: any = {}) => {
        let list = [...this.albumItems];
        if (where?.albumId) list = list.filter((ai) => ai.albumId === where.albumId);
        if (where?.mediaItemId) list = list.filter((ai) => ai.mediaItemId === where.mediaItemId);
        return list;
      },
      create: async ({ data }: any) => {
        const id = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const item = { id, ...data, addedAt: new Date() };
        this.albumItems.push(item);
        return item;
      },
      upsert: async ({ where, create }: any) => {
        const existing = this.albumItems.find(
          (ai) =>
            ai.albumId === where?.albumId_mediaItemId?.albumId &&
            ai.mediaItemId === where?.albumId_mediaItemId?.mediaItemId
        );
        if (existing) return existing;
        const id = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const item = { id, ...create, addedAt: new Date() };
        this.albumItems.push(item);
        return item;
      },
      delete: async ({ where }: any) => {
        const idx = this.albumItems.findIndex(
          (ai) =>
            ai.albumId === where?.albumId_mediaItemId?.albumId &&
            ai.mediaItemId === where?.albumId_mediaItemId?.mediaItemId
        );
        if (idx !== -1) {
          const [removed] = this.albumItems.splice(idx, 1);
          return removed;
        }
        return null;
      },
      deleteMany: async ({ where }: any = {}) => {
        const before = this.albumItems.length;
        if (where?.albumId) {
          this.albumItems = this.albumItems.filter((ai) => ai.albumId !== where.albumId);
        }
        if (where?.mediaItemId) {
          this.albumItems = this.albumItems.filter((ai) => ai.mediaItemId !== where.mediaItemId);
        }
        return { count: before - this.albumItems.length };
      },
    };
  }


  rateLimitAttempts: any[] = [];
  get rateLimitAttempt() {
    return {
      create: async ({ data }: any) => {
        const attempt = {
          id: `rla_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        };
        this.rateLimitAttempts.push(attempt);
        return attempt;
      },
      count: async ({ where }: any = {}) => {
        let list = this.rateLimitAttempts;
        if (where?.key) {
          list = list.filter((a) => a.key === where.key);
        }
        if (where?.createdAt?.gte) {
          const gte = new Date(where.createdAt.gte).getTime();
          list = list.filter((a) => new Date(a.createdAt).getTime() >= gte);
        }
        return list.length;
      },
      deleteMany: async ({ where }: any = {}) => {
        const beforeCount = this.rateLimitAttempts.length;
        if (where?.createdAt?.lt) {
          const lt = new Date(where.createdAt.lt).getTime();
          this.rateLimitAttempts = this.rateLimitAttempts.filter(
            (a) => new Date(a.createdAt).getTime() >= lt
          );
        } else if (where?.key) {
          this.rateLimitAttempts = this.rateLimitAttempts.filter((a) => a.key !== where.key);
        }
        return { count: beforeCount - this.rateLimitAttempts.length };
      },
    };
  }

  favorites: any[] = [];
  get favorite() {
    return {
      findMany: async (query?: any) => {
        let list = [...this.favorites];
        if (query?.where?.userId) {
          list = list.filter((f) => f.userId === query.where.userId);
        }
        return list.map((f) => ({
          ...f,
          mediaItem: this.mediaItems.find((m) => m.id === f.mediaItemId) || null,
        }));
      },
      findUnique: async ({ where }: any) => {
        if (where?.userId_mediaItemId) {
          return (
            this.favorites.find(
              (f) =>
                f.userId === where.userId_mediaItemId.userId &&
                f.mediaItemId === where.userId_mediaItemId.mediaItemId
            ) || null
          );
        }
        return null;
      },
      create: async ({ data }: any) => {
        const id = `fav_${Date.now()}`;
        const fav = { id, ...data, createdAt: new Date() };
        this.favorites.push(fav);
        return fav;
      },
      delete: async ({ where }: any) => {
        const idx = this.favorites.findIndex(
          (f) =>
            (where.id && f.id === where.id) ||
            (where.userId_mediaItemId &&
              f.userId === where.userId_mediaItemId.userId &&
              f.mediaItemId === where.userId_mediaItemId.mediaItemId)
        );
        if (idx !== -1) {
          const [removed] = this.favorites.splice(idx, 1);
          return removed;
        }
        return null;
      },
      deleteMany: async ({ where }: any) => {
        const before = this.favorites.length;
        this.favorites = this.favorites.filter((f) => {
          if (where.userId && f.userId === where.userId) return false;
          if (where.mediaItemId && f.mediaItemId === where.mediaItemId) return false;
          return true;
        });
        return { count: before - this.favorites.length };
      },
    };
  }

  watchProgressItems: any[] = [];
  get watchProgress() {
    return {
      findMany: async (query?: any) => {
        let list = [...this.watchProgressItems];
        if (query?.where?.userId) {
          list = list.filter((w) => w.userId === query.where.userId);
        }
        if (query?.where?.isCompleted !== undefined) {
          list = list.filter((w) => w.isCompleted === query.where.isCompleted);
        }
        if (query?.orderBy?.lastWatchedAt === "desc") {
          list.sort(
            (a, b) =>
              new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()
          );
        }
        if (query?.take) {
          list = list.slice(0, query.take);
        }
        return list.map((w) => ({
          ...w,
          mediaItem: this.mediaItems.find((m) => m.id === w.mediaItemId) || null,
        }));
      },
      findUnique: async ({ where }: any) => {
        if (where?.userId_mediaItemId) {
          return (
            this.watchProgressItems.find(
              (w) =>
                w.userId === where.userId_mediaItemId.userId &&
                w.mediaItemId === where.userId_mediaItemId.mediaItemId
            ) || null
          );
        }
        return null;
      },
      upsert: async ({ where, create, update }: any) => {
        const existing = this.watchProgressItems.find(
          (w) =>
            w.userId === where.userId_mediaItemId.userId &&
            w.mediaItemId === where.userId_mediaItemId.mediaItemId
        );
        if (existing) {
          Object.assign(existing, update, { lastWatchedAt: new Date() });
          return existing;
        }
        const id = `wp_${Date.now()}`;
        const newWp = {
          id,
          ...create,
          lastWatchedAt: new Date(),
        };
        this.watchProgressItems.push(newWp);
        return newWp;
      },
    };
  }

  get systemSetting() {
    return {
      findUnique: async ({ where }: any) => {
        return this.systemSettings.find((s) => s.key === where.key) || null;
      },
      findMany: async () => {
        return [...this.systemSettings];
      },
      upsert: async ({ where, create, update }: any) => {
        const existing = this.systemSettings.find((s) => s.key === where.key);
        if (existing) {
          Object.assign(existing, update, { updatedAt: new Date() });
          return existing;
        }
        const created = {
          key: where.key,
          value: create.value,
          updatedAt: new Date(),
        };
        this.systemSettings.push(created);
        return created;
      },
    };
  }

  rateLimitAttempts: any[] = [];
  get rateLimitAttempt() {
    return {
      deleteMany: async ({ where }: any) => {
        const before = this.rateLimitAttempts.length;
        if (where?.createdAt?.lt) {
          this.rateLimitAttempts = this.rateLimitAttempts.filter(
            (r) => new Date(r.createdAt).getTime() >= new Date(where.createdAt.lt).getTime()
          );
        }
        return { count: before - this.rateLimitAttempts.length };
      },
      count: async ({ where }: any) => {
        let list = [...this.rateLimitAttempts];
        if (where?.key) list = list.filter((r) => r.key === where.key);
        if (where?.createdAt?.gte) {
          list = list.filter(
            (r) => new Date(r.createdAt).getTime() >= new Date(where.createdAt.gte).getTime()
          );
        }
        return list.length;
      },
      create: async ({ data }: any) => {
        const item = { id: `rla_${Date.now()}_${Math.random()}`, ...data, createdAt: new Date() };
        this.rateLimitAttempts.push(item);
        return item;
      },
    };
  }
}

// In production (NODE_ENV=production or on Vercel), in-memory Prisma is strictly disabled at runtime
const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
const isBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.npm_lifecycle_event === "build";
const isTestEnv =
  process.env.NODE_ENV === "test" ||
  process.env.TEST_MODE === "true" ||
  process.env.VITEST === "true" ||
  process.env.USE_MOCK_DB === "true";

if (isProduction && !isBuildPhase && !isTestEnv) {
  if (
    !process.env.DATABASE_URL ||
    process.env.DATABASE_URL.includes("localhost:5432") ||
    process.env.USE_MOCK_DB === "true"
  ) {
    throw new Error(
      "DATABASE_URL pointing to real PostgreSQL/Neon is required in production. InMemoryDb fallback is strictly disabled."
    );
  }
}

// Use real PrismaClient if DATABASE_URL is present and not in test environment
const hasRealDatabaseUrl =
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes("localhost:5432") &&
  !isTestEnv;

let prismaInstance: any;

if (hasRealDatabaseUrl && !isBuildPhase) {
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaInstance;
} else {
  if (!globalForPrisma.mockDb) {
    globalForPrisma.mockDb = new InMemoryDb();
  }
  prismaInstance = globalForPrisma.mockDb;
}

export const prisma = prismaInstance;
export default prisma;
