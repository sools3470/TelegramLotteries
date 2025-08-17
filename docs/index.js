var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  botConfig: () => botConfig,
  insertBotConfigSchema: () => insertBotConfigSchema,
  insertRaffleSchema: () => insertRaffleSchema,
  insertSponsorChannelSchema: () => insertSponsorChannelSchema,
  insertUserSchema: () => insertUserSchema,
  raffleParticipants: () => raffleParticipants,
  raffles: () => raffles,
  sessions: () => sessions,
  sponsorChannels: () => sponsorChannels,
  upsertUserSchema: () => upsertUserSchema,
  userSeenRaffles: () => userSeenRaffles,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Telegram authentication fields
  telegramId: varchar("telegram_id").unique(),
  // Optional for non-Telegram users
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  // Gmail authentication fields
  email: varchar("email").unique(),
  // Optional for Telegram-only users
  profileImageUrl: varchar("profile_image_url"),
  // Authentication method tracking
  authMethod: text("auth_method", { enum: ["telegram", "gmail", "guest"] }).notNull().default("telegram"),
  // User management
  userType: text("user_type", { enum: ["bot_admin", "regular", "channel_admin"] }).notNull().default("regular"),
  points: integer("points").notNull().default(0),
  level: integer("level").notNull().default(1),
  // سطح کاربر برای دسترسی به قرعه‌کشی‌ها
  referralCode: varchar("referral_code").unique(),
  referrerId: varchar("referrer_id"),
  isSponsorMember: boolean("is_sponsor_member").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var botConfig = pgTable("bot_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botToken: text("bot_token").notNull(),
  botUsername: text("bot_username").notNull(),
  startLink: text("start_link").notNull(),
  // Deep link to start bot
  adminTelegramIds: text("admin_telegram_ids").array().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var raffles = pgTable("raffles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull(),
  // Channel ID from forwarded message
  messageId: varchar("message_id").notNull(),
  // Original message ID from channel
  forwardedMessageId: varchar("forwarded_message_id"),
  // Forwarded message ID in bot
  title: text("title").notNull(),
  description: text("description"),
  prizeDescription: text("prize_description").notNull(),
  prizeType: text("prize_type", { enum: ["stars", "premium", "mixed"] }).notNull(),
  prizeValue: integer("prize_value"),
  // Number of stars or months of premium
  requiredChannels: text("required_channels").array().notNull(),
  // Array of channel IDs required to join
  raffleDateTime: timestamp("raffle_datetime").notNull(),
  levelRequired: integer("level_required").notNull().default(1),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  submitterId: varchar("submitter_id").notNull(),
  // User ID who submitted the raffle
  participantCount: integer("participant_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var userSeenRaffles = pgTable("user_seen_raffles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  raffleId: varchar("raffle_id").notNull(),
  seenAt: timestamp("seen_at").defaultNow()
});
var raffleParticipants = pgTable("raffle_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  raffleId: varchar("raffle_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow()
});
var sponsorChannels = pgTable("sponsor_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull().unique(),
  channelName: text("channel_name").notNull(),
  channelUrl: text("channel_url").notNull(),
  pointsReward: integer("points_reward").notNull().default(100),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  telegramId: true,
  username: true,
  firstName: true,
  lastName: true,
  email: true,
  profileImageUrl: true,
  authMethod: true,
  userType: true,
  referralCode: true,
  referrerId: true
});
var upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  telegramId: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  authMethod: true
});
var insertBotConfigSchema = createInsertSchema(botConfig).pick({
  botToken: true,
  botUsername: true,
  startLink: true,
  adminTelegramIds: true
});
var insertRaffleSchema = createInsertSchema(raffles).pick({
  channelId: true,
  messageId: true,
  forwardedMessageId: true,
  title: true,
  description: true,
  prizeDescription: true,
  prizeType: true,
  prizeValue: true,
  requiredChannels: true,
  raffleDateTime: true,
  levelRequired: true,
  submitterId: true
});
var insertSponsorChannelSchema = createInsertSchema(sponsorChannels).pick({
  channelId: true,
  channelName: true,
  channelUrl: true,
  pointsReward: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, lte } from "drizzle-orm";
var DatabaseStorage = class {
  constructor() {
    if (process.env.NODE_ENV === "development") {
      this.initializeSampleData();
    }
  }
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByTelegramId(telegramId) {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(user) {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: userData.telegramId ? users.telegramId : users.email,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  async updateUser(id, updates) {
    const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user || void 0;
  }
  async getUsersByType(userType) {
    return await db.select().from(users).where(eq(users.userType, userType));
  }
  // Raffle operations
  async getRaffle(id) {
    const [raffle] = await db.select().from(raffles).where(eq(raffles.id, id));
    return raffle || void 0;
  }
  async getRafflesByStatus(status) {
    return await db.select().from(raffles).where(eq(raffles.status, status));
  }
  async getRafflesByLevelAndStatus(maxLevel, status) {
    return await db.select().from(raffles).where(
      and(
        lte(raffles.levelRequired, maxLevel),
        eq(raffles.status, status)
      )
    );
  }
  async updateUserRole(userId, newRole) {
    return await this.updateUser(userId, { userType: newRole });
  }
  async updateUserLevel(userId, newLevel) {
    return await this.updateUser(userId, { level: newLevel });
  }
  async approveRaffleWithLevel(id, levelRequired) {
    return await this.updateRaffle(id, {
      status: "approved",
      levelRequired
    });
  }
  async getTodaysRaffles(userLevel) {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return await db.select().from(raffles).where(
      and(
        lte(raffles.levelRequired, userLevel),
        eq(raffles.status, "approved"),
        lte(raffles.raffleDateTime, tomorrow)
      )
    );
  }
  async getEndedRaffles(userLevel) {
    const now = /* @__PURE__ */ new Date();
    return await db.select().from(raffles).where(
      and(
        lte(raffles.levelRequired, userLevel),
        eq(raffles.status, "approved"),
        lte(raffles.raffleDateTime, now)
      )
    );
  }
  async createRaffle(raffle) {
    const [newRaffle] = await db.insert(raffles).values(raffle).returning();
    return newRaffle;
  }
  async updateRaffle(id, updates) {
    const [raffle] = await db.update(raffles).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(raffles.id, id)).returning();
    return raffle || void 0;
  }
  async getRafflesBySubmitter(submitterId) {
    return await db.select().from(raffles).where(eq(raffles.submitterId, submitterId));
  }
  // Sponsor channel operations
  async getSponsorChannels() {
    return await db.select().from(sponsorChannels).where(eq(sponsorChannels.isActive, true));
  }
  async createSponsorChannel(channel) {
    const [newChannel] = await db.insert(sponsorChannels).values(channel).returning();
    return newChannel;
  }
  // User interactions
  async markRaffleSeen(userId, raffleId) {
    await db.insert(userSeenRaffles).values({
      userId,
      raffleId,
      seenAt: /* @__PURE__ */ new Date()
    }).onConflictDoNothing();
  }
  async joinRaffle(userId, raffleId) {
    await db.insert(raffleParticipants).values({
      userId,
      raffleId,
      joinedAt: /* @__PURE__ */ new Date()
    }).onConflictDoNothing();
  }
  async hasUserJoinedRaffle(userId, raffleId) {
    const [participant] = await db.select().from(raffleParticipants).where(and(
      eq(raffleParticipants.userId, userId),
      eq(raffleParticipants.raffleId, raffleId)
    ));
    return !!participant;
  }
  async getUserSeenRaffles(userId) {
    const seen = await db.select({ raffleId: userSeenRaffles.raffleId }).from(userSeenRaffles).where(eq(userSeenRaffles.userId, userId));
    return seen.map((s) => s.raffleId);
  }
  async getUserJoinedRaffles(userId) {
    const joined = await db.select({ raffleId: raffleParticipants.raffleId }).from(raffleParticipants).where(eq(raffleParticipants.userId, userId));
    return joined.map((j) => j.raffleId);
  }
  // Points and referrals
  async addPoints(userId, points) {
    const user = await this.getUser(userId);
    if (user) {
      await this.updateUser(userId, { points: user.points + points });
      await this.updateUserLevelByPoints(userId);
    }
  }
  async updateUserLevelByPoints(userId) {
    const user = await this.getUser(userId);
    if (user) {
      const newLevel = Math.floor(user.points / 1e3) + 1;
      if (newLevel !== user.level) {
        await this.updateUser(userId, { level: newLevel });
      }
    }
  }
  // Bot configuration
  async getBotConfig() {
    const [config] = await db.select().from(botConfig).where(eq(botConfig.isActive, true));
    return config || void 0;
  }
  async setBotConfig(config) {
    await db.update(botConfig).set({ isActive: false });
    const [newConfig] = await db.insert(botConfig).values({
      ...config,
      isActive: true
    }).returning();
    return newConfig;
  }
  // Helper method to check if user is admin based on Telegram ID
  async isUserAdmin(telegramId) {
    const config = await this.getBotConfig();
    if (config?.adminTelegramIds) {
      return config.adminTelegramIds.includes(telegramId);
    }
    const adminTelegramIds = process.env.ADMIN_TELEGRAM_IDS?.split(",") || ["987654321"];
    return adminTelegramIds.some((id) => id.trim() === telegramId);
  }
  async initializeSampleData() {
    try {
      const existingChannels = await this.getSponsorChannels();
      if (existingChannels.length > 0) {
        return;
      }
      await this.createSponsorChannel({
        channelId: "@telegram_farsi",
        channelName: "\u062A\u0644\u06AF\u0631\u0627\u0645 \u0641\u0627\u0631\u0633\u06CC",
        channelUrl: "https://t.me/telegram_farsi",
        pointsReward: 100
      });
      await this.createSponsorChannel({
        channelId: "@tech_news_ir",
        channelName: "\u0627\u062E\u0628\u0627\u0631 \u0641\u0646\u0627\u0648\u0631\u06CC \u0627\u06CC\u0631\u0627\u0646",
        channelUrl: "https://t.me/tech_news_ir",
        pointsReward: 150
      });
      const now = /* @__PURE__ */ new Date();
      const futureDate1 = new Date(now.getTime() + 24 * 60 * 60 * 1e3);
      const futureDate2 = new Date(now.getTime() + 48 * 60 * 60 * 1e3);
      await this.createRaffle({
        channelId: "@raffle_channel",
        messageId: "123",
        forwardedMessageId: null,
        title: "\u0642\u0631\u0639\u0647\u200C\u06A9\u0634\u06CC \u06F1\u06F0\u06F0 \u0627\u0633\u062A\u0627\u0631\u0632 \u062A\u0644\u06AF\u0631\u0627\u0645",
        description: "\u0628\u0631\u0627\u06CC \u0634\u0631\u06A9\u062A \u062F\u0631 \u0627\u06CC\u0646 \u0642\u0631\u0639\u0647\u200C\u06A9\u0634\u06CC \u06A9\u0627\u0641\u06CC \u0627\u0633\u062A \u0639\u0636\u0648 \u06A9\u0627\u0646\u0627\u0644\u200C\u0647\u0627\u06CC \u0645\u0648\u0631\u062F \u0646\u06CC\u0627\u0632 \u0634\u0648\u06CC\u062F",
        prizeDescription: "\u06F1\u06F0\u06F0 \u0627\u0633\u062A\u0627\u0631\u0632 \u062A\u0644\u06AF\u0631\u0627\u0645",
        prizeType: "stars",
        prizeValue: 100,
        requiredChannels: ["@telegram_farsi", "@tech_news_ir"],
        raffleDateTime: futureDate1,
        levelRequired: 1,
        submitterId: "admin"
      });
      await this.createRaffle({
        channelId: "@premium_channel",
        messageId: "456",
        forwardedMessageId: null,
        title: "\u0642\u0631\u0639\u0647\u200C\u06A9\u0634\u06CC \u0627\u0634\u062A\u0631\u0627\u06A9 \u067E\u0631\u06CC\u0645\u06CC\u0645 \u06F3 \u0645\u0627\u0647\u0647",
        description: "\u062C\u0627\u06CC\u0632\u0647 \u0648\u06CC\u0698\u0647 \u0628\u0631\u0627\u06CC \u06A9\u0627\u0631\u0628\u0631\u0627\u0646 \u0641\u0639\u0627\u0644",
        prizeDescription: "\u0627\u0634\u062A\u0631\u0627\u06A9 \u067E\u0631\u06CC\u0645\u06CC\u0645 \u062A\u0644\u06AF\u0631\u0627\u0645 \u06F3 \u0645\u0627\u0647\u0647",
        prizeType: "premium",
        prizeValue: 3,
        requiredChannels: ["@telegram_farsi"],
        raffleDateTime: futureDate2,
        levelRequired: 2,
        submitterId: "admin"
      });
    } catch (error) {
      console.error("Error initializing sample data:", error);
    }
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
async function registerRoutes(app2) {
  app2.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = userData.telegramId ? await storage.getUserByTelegramId(userData.telegramId) : null;
      if (existingUser) {
        const updatedUser = await storage.updateUser(existingUser.id, userData);
        res.json(updatedUser);
      } else {
        const user = await storage.createUser(userData);
        res.json(user);
      }
    } catch (error) {
      res.status(400).json({ message: "Invalid user data", error });
    }
  });
  app2.get("/api/users/telegram/:telegramId", async (req, res) => {
    try {
      const user = await storage.getUserByTelegramId(req.params.telegramId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.put("/api/users/:id/type", async (req, res) => {
    try {
      const { userType } = req.body;
      const user = await storage.updateUser(req.params.id, { userType });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.get("/api/raffles", async (req, res) => {
    try {
      const { status, level, submitterId, filter, userId } = req.query;
      const user = userId ? await storage.getUser(userId) : null;
      const userLevel = user?.level || 1;
      const userRole = user?.userType || "regular";
      let raffles2;
      if (userRole === "bot_admin") {
        if (status) {
          raffles2 = await storage.getRafflesByStatus(status);
        } else if (submitterId) {
          raffles2 = await storage.getRafflesBySubmitter(submitterId);
        } else {
          raffles2 = await storage.getRafflesByStatus("pending");
        }
      } else if (userRole === "channel_admin") {
        raffles2 = await storage.getRafflesBySubmitter(userId);
      } else {
        if (filter === "today") {
          raffles2 = await storage.getTodaysRaffles(userLevel);
        } else if (filter === "ended") {
          raffles2 = await storage.getEndedRaffles(userLevel);
        } else {
          raffles2 = await storage.getRafflesByLevelAndStatus(userLevel, "approved");
        }
      }
      res.json(raffles2);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.post("/api/raffles", async (req, res) => {
    try {
      const raffleData = insertRaffleSchema.parse(req.body);
      const existingRaffles = await storage.getRafflesByStatus("pending");
      const approvedRaffles = await storage.getRafflesByStatus("approved");
      const allRaffles = [...existingRaffles, ...approvedRaffles];
      const duplicate = allRaffles.find(
        (r) => r.channelId === raffleData.channelId && r.messageId === raffleData.messageId
      );
      if (duplicate) {
        return res.status(400).json({ message: "Raffle with this channel and message already exists" });
      }
      const raffle = await storage.createRaffle(raffleData);
      res.json(raffle);
    } catch (error) {
      res.status(400).json({ message: "Invalid raffle data", error });
    }
  });
  app2.put("/api/raffles/:id", async (req, res) => {
    try {
      const updates = req.body;
      const raffle = await storage.updateRaffle(req.params.id, updates);
      if (!raffle) {
        return res.status(404).json({ message: "Raffle not found" });
      }
      res.json(raffle);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.put("/api/raffles/:id/approve", async (req, res) => {
    try {
      const { levelRequired, adminUserId } = req.body;
      const admin = await storage.getUser(adminUserId);
      if (!admin || admin.userType !== "bot_admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const raffle = await storage.approveRaffleWithLevel(req.params.id, levelRequired);
      if (!raffle) {
        return res.status(404).json({ message: "Raffle not found" });
      }
      res.json(raffle);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.put("/api/raffles/:id/reject", async (req, res) => {
    try {
      const { adminUserId } = req.body;
      const admin = await storage.getUser(adminUserId);
      if (!admin || admin.userType !== "bot_admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const raffle = await storage.updateRaffle(req.params.id, { status: "rejected" });
      if (!raffle) {
        return res.status(404).json({ message: "Raffle not found" });
      }
      res.json(raffle);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.post("/api/raffles/:id/join", async (req, res) => {
    try {
      const { userId } = req.body;
      const hasJoined = await storage.hasUserJoinedRaffle(userId, req.params.id);
      if (hasJoined) {
        return res.status(400).json({ message: "User already joined this raffle" });
      }
      await storage.joinRaffle(userId, req.params.id);
      await storage.markRaffleSeen(userId, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.post("/api/raffles/:id/seen", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      await storage.markRaffleSeen(userId, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.get("/api/users", async (req, res) => {
    try {
      const users2 = await storage.getUsersByType("regular");
      const channelAdmins = await storage.getUsersByType("channel_admin");
      const allUsers = [...users2, ...channelAdmins];
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.get("/api/user/seen-raffles/:userId", async (req, res) => {
    try {
      const seenRaffleIds = await storage.getUserSeenRaffles(req.params.userId);
      res.json(seenRaffleIds);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.get("/api/user/joined-raffles/:userId", async (req, res) => {
    try {
      const joinedRaffles = await storage.getUserJoinedRaffles(req.params.userId);
      res.json(joinedRaffles);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.get("/api/raffles/:raffleId/joined/:userId", async (req, res) => {
    try {
      const { raffleId, userId } = req.params;
      const hasJoined = await storage.hasUserJoinedRaffle(userId, raffleId);
      res.json({ hasJoined });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.get("/api/sponsor-channels", async (req, res) => {
    try {
      const channels = await storage.getSponsorChannels();
      res.json(channels);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.post("/api/sponsor-channels", async (req, res) => {
    try {
      const channelData = insertSponsorChannelSchema.parse(req.body);
      const channel = await storage.createSponsorChannel(channelData);
      res.json(channel);
    } catch (error) {
      res.status(400).json({ message: "Invalid channel data", error });
    }
  });
  app2.post("/api/users/:id/points", async (req, res) => {
    try {
      const { points } = req.body;
      await storage.addPoints(req.params.id, points);
      const user = await storage.getUser(req.params.id);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.get("/api/raffles/submitted/:userId", async (req, res) => {
    try {
      const submittedRaffles = await storage.getRafflesBySubmitter(req.params.userId);
      res.json(submittedRaffles);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.get("/api/admin/raffles/pending", async (req, res) => {
    try {
      const pendingRaffles = await storage.getRafflesByStatus("pending");
      res.json(pendingRaffles);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.get("/api/admin/users", async (req, res) => {
    try {
      const { type } = req.query;
      const users2 = type ? await storage.getUsersByType(type) : [];
      res.json(users2);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.post("/api/auth/telegram", async (req, res) => {
    try {
      const authData = upsertUserSchema.parse(req.body);
      const isAdmin = authData.telegramId ? await storage.isUserAdmin(authData.telegramId) : false;
      const userData = {
        ...authData,
        authMethod: "telegram",
        userType: isAdmin ? "bot_admin" : authData.userType || "regular"
      };
      const user = await storage.upsertUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid authentication data", error });
    }
  });
  app2.post("/api/auth/gmail", async (req, res) => {
    try {
      const authData = upsertUserSchema.parse(req.body);
      const user = await storage.upsertUser({
        ...authData,
        authMethod: "gmail"
      });
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid authentication data", error });
    }
  });
  app2.get("/api/auth/user", async (req, res) => {
    try {
      const { telegramId, email } = req.query;
      let user;
      if (telegramId) {
        user = await storage.getUserByTelegramId(telegramId);
      } else if (email) {
        user = await storage.getUserByEmail(email);
      }
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.post("/api/bot/config", async (req, res) => {
    try {
      const configData = insertBotConfigSchema.parse(req.body);
      const config = await storage.setBotConfig(configData);
      res.json(config);
    } catch (error) {
      res.status(400).json({ message: "Invalid bot configuration", error });
    }
  });
  app2.get("/api/bot/config", async (req, res) => {
    try {
      const config = await storage.getBotConfig();
      if (!config) {
        return res.status(404).json({ message: "Bot configuration not found" });
      }
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
