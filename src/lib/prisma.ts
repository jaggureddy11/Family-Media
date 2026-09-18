import { PrismaClient, Role } from "@prisma/client";

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
  favorites: any[] = [];
  watchProgress: any[] = [];
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
}

// In development or when Neon is not reachable yet, use the InMemoryDb
const useMock =
  process.env.USE_MOCK_DB === "true" ||
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes("localhost:5432");

let prismaInstance: any;

if (useMock) {
  if (!globalForPrisma.mockDb) {
    globalForPrisma.mockDb = new InMemoryDb();
  }
  prismaInstance = globalForPrisma.mockDb;
} else {
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaInstance;
}

export const prisma = prismaInstance;
export default prisma;
