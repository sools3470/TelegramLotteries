var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  KING_ADMIN_TELEGRAM_ID: () => KING_ADMIN_TELEGRAM_ID,
  adminActions: () => adminActions,
  botConfig: () => botConfig,
  getKingAdminId: () => getKingAdminId,
  insertAdminActionSchema: () => insertAdminActionSchema,
  insertBotConfigSchema: () => insertBotConfigSchema,
  insertRaffleSchema: () => insertRaffleSchema,
  insertReferralSchema: () => insertReferralSchema,
  insertSponsorChannelSchema: () => insertSponsorChannelSchema,
  insertUserSchema: () => insertUserSchema,
  insertUserSponsorMembershipSchema: () => insertUserSponsorMembershipSchema,
  isKingAdmin: () => isKingAdmin,
  raffleParticipants: () => raffleParticipants,
  raffles: () => raffles,
  referrals: () => referrals,
  sessions: () => sessions,
  sponsorChannels: () => sponsorChannels,
  updateSponsorChannelSchema: () => updateSponsorChannelSchema,
  updateUserSponsorMembershipSchema: () => updateUserSponsorMembershipSchema,
  upsertUserSchema: () => upsertUserSchema,
  userSeenRaffles: () => userSeenRaffles,
  userSponsorMemberships: () => userSponsorMemberships,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var KING_ADMIN_TELEGRAM_ID, isKingAdmin, getKingAdminId, sessions, users, botConfig, raffles, userSeenRaffles, raffleParticipants, sponsorChannels, userSponsorMemberships, referrals, adminActions, insertUserSchema, upsertUserSchema, insertBotConfigSchema, insertRaffleSchema, insertSponsorChannelSchema, updateSponsorChannelSchema, insertUserSponsorMembershipSchema, updateUserSponsorMembershipSchema, insertReferralSchema, insertAdminActionSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    KING_ADMIN_TELEGRAM_ID = "128787773";
    isKingAdmin = (telegramId) => {
      return telegramId === KING_ADMIN_TELEGRAM_ID;
    };
    getKingAdminId = () => {
      return KING_ADMIN_TELEGRAM_ID;
    };
    sessions = pgTable(
      "sessions",
      {
        sid: varchar("sid").primaryKey(),
        sess: jsonb("sess").notNull(),
        expire: timestamp("expire").notNull()
      },
      (table) => [index("IDX_session_expire").on(table.expire)]
    );
    users = pgTable("users", {
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
      userType: text("user_type", { enum: ["bot_admin", "regular"] }).notNull().default("regular"),
      adminLevel: integer("admin_level").default(1),
      // 0 = King 👑, 1 = Level 1 Admin, 2 = Level 2 Admin (limited)
      points: integer("points").notNull().default(0),
      level: integer("level").notNull().default(1),
      // سطح کاربر برای دسترسی به قرعه‌کشی‌ها
      referralCode: varchar("referral_code").unique(),
      referrerId: varchar("referrer_id"),
      referralReward: integer("referral_reward").notNull().default(50),
      // امتیاز دعوت دوستان
      isSponsorMember: boolean("is_sponsor_member").notNull().default(false),
      isRestricted: boolean("is_restricted").notNull().default(false),
      restrictionStart: timestamp("restriction_start"),
      restrictionEnd: timestamp("restriction_end"),
      restrictionReason: text("restriction_reason"),
      submissionCount: integer("submission_count").notNull().default(0),
      lastSubmissionAt: timestamp("last_submission_at"),
      lastLoginAt: timestamp("last_login_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    botConfig = pgTable("bot_config", {
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
    raffles = pgTable("raffles", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      channelId: varchar("channel_id").notNull(),
      // Channel ID from forwarded message
      messageId: varchar("message_id").notNull(),
      // Original message ID from channel
      forwardedMessageId: varchar("forwarded_message_id"),
      // Forwarded message ID in bot
      requestNumber: integer("request_number").notNull(),
      // شماره درخواست برای هر کاربر
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
      reviewerId: varchar("reviewer_id"),
      // Admin who reviewed the raffle
      rejectionReason: text("rejection_reason"),
      participantCount: integer("participant_count").notNull().default(0),
      version: integer("version").notNull().default(1),
      // Version tracking for edits
      originalData: jsonb("original_data"),
      // Store original submission for version history
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userSeenRaffles = pgTable("user_seen_raffles", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull(),
      raffleId: varchar("raffle_id").notNull(),
      seenAt: timestamp("seen_at").defaultNow()
    });
    raffleParticipants = pgTable("raffle_participants", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull(),
      raffleId: varchar("raffle_id").notNull(),
      joinedAt: timestamp("joined_at").defaultNow()
    });
    sponsorChannels = pgTable("sponsor_channels", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      channelId: varchar("channel_id").notNull().unique(),
      // Telegram Channel ID (-100xxxxxx)
      channelUsername: varchar("channel_username"),
      // @channelname (اختیاری)
      channelName: text("channel_name").notNull(),
      channelUrl: text("channel_url").notNull(),
      description: text("description"),
      pointsReward: integer("points_reward").notNull().default(100),
      // امتیاز عضویت در کانال
      isSpecial: boolean("is_special").notNull().default(false),
      // کانال ویژه
      isActive: boolean("is_active").notNull().default(true),
      displayOrder: integer("display_order").notNull().default(0),
      // ترتیب نمایش کانال‌ها (قابل تغییر با drag & drop)
      botHasAccess: boolean("bot_has_access").notNull().default(false),
      // آیا ربات در کانال ادمین است
      lastAccessCheck: timestamp("last_access_check"),
      // آخرین بار چک دسترسی
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userSponsorMemberships = pgTable("user_sponsor_memberships", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull(),
      channelId: varchar("channel_id").notNull(),
      // Reference to sponsorChannels.channelId
      isMember: boolean("is_member").notNull().default(false),
      // وضعیت فعلی عضویت
      pointsEarned: integer("points_earned").notNull().default(0),
      joinedAt: timestamp("joined_at"),
      // زمان عضویت
      leftAt: timestamp("left_at"),
      // زمان ترک کانال
      lastChecked: timestamp("last_checked").defaultNow(),
      // آخرین بار چک شده
      checkCount: integer("check_count").notNull().default(0),
      // تعداد بار چک شده
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    referrals = pgTable("referrals", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      referrerId: varchar("referrer_id").notNull(),
      // User who shared the referral link
      referredId: varchar("referred_id").notNull(),
      // User who joined via referral
      pointsEarned: integer("points_earned").notNull().default(50),
      createdAt: timestamp("created_at").defaultNow()
    });
    adminActions = pgTable("admin_actions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      adminId: varchar("admin_id").notNull(),
      action: text("action").notNull(),
      // approve_raffle, reject_raffle, restrict_user, etc.
      targetType: text("target_type").notNull(),
      // raffle, user, channel
      targetId: varchar("target_id").notNull(),
      details: jsonb("details"),
      // Additional action details
      createdAt: timestamp("created_at").defaultNow()
    });
    insertUserSchema = createInsertSchema(users).pick({
      telegramId: true,
      username: true,
      firstName: true,
      lastName: true,
      email: true,
      profileImageUrl: true,
      authMethod: true,
      userType: true,
      adminLevel: true,
      referralCode: true,
      referrerId: true
    });
    upsertUserSchema = createInsertSchema(users).pick({
      id: true,
      telegramId: true,
      email: true,
      firstName: true,
      lastName: true,
      profileImageUrl: true,
      authMethod: true,
      userType: true,
      adminLevel: true
    });
    insertBotConfigSchema = createInsertSchema(botConfig).pick({
      botToken: true,
      botUsername: true,
      startLink: true,
      adminTelegramIds: true
    });
    insertRaffleSchema = createInsertSchema(raffles).pick({
      channelId: true,
      messageId: true,
      forwardedMessageId: true,
      requestNumber: true,
      prizeType: true,
      prizeValue: true,
      requiredChannels: true,
      raffleDateTime: true,
      levelRequired: true,
      submitterId: true
    }).extend({
      raffleDateTime: z.union([
        z.string().transform((str) => new Date(str)),
        z.date()
      ])
    });
    insertSponsorChannelSchema = createInsertSchema(sponsorChannels).pick({
      channelId: true,
      channelUsername: true,
      channelName: true,
      channelUrl: true,
      description: true,
      pointsReward: true,
      isSpecial: true
    }).extend({
      channelId: z.string().min(1, "\u0634\u0646\u0627\u0633\u0647 \u06A9\u0627\u0646\u0627\u0644 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A").refine((id) => {
        if (!id.startsWith("@")) return false;
        const usernamePartLength = id.length - 1;
        if (usernamePartLength < 5) return false;
        return /^@[0-9a-z_]+$/.test(id);
      }, "\u0634\u0646\u0627\u0633\u0647 \u06A9\u0627\u0646\u0627\u0644 \u0628\u0627\u06CC\u062F \u0628\u0627 @ \u0634\u0631\u0648\u0639 \u0634\u0648\u062F\u060C \u0641\u0642\u0637 \u0634\u0627\u0645\u0644 0-9\u060C a-z\u060C _ \u0628\u0627\u0634\u062F \u0648 \u062D\u062F\u0627\u0642\u0644 5 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u0628\u0639\u062F \u0627\u0632 @ \u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F"),
      channelUrl: z.string().min(1, "\u0622\u062F\u0631\u0633 \u06A9\u0627\u0646\u0627\u0644 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A").refine((url) => {
        return url.startsWith("https://") || url.startsWith("http://");
      }, "\u0622\u062F\u0631\u0633 \u06A9\u0627\u0646\u0627\u0644 \u0628\u0627\u06CC\u062F \u0628\u0627 https:// \u06CC\u0627 http:// \u0634\u0631\u0648\u0639 \u0634\u0648\u062F")
    });
    updateSponsorChannelSchema = createInsertSchema(sponsorChannels).pick({
      channelId: true,
      channelUsername: true,
      channelName: true,
      channelUrl: true,
      description: true,
      pointsReward: true,
      isSpecial: true,
      botHasAccess: true
    }).extend({
      channelId: z.string().min(1, "\u0634\u0646\u0627\u0633\u0647 \u06A9\u0627\u0646\u0627\u0644 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A").refine((id) => {
        if (!id.startsWith("@")) return false;
        const usernamePartLength = id.length - 1;
        if (usernamePartLength < 5) return false;
        return /^@[0-9a-z_]+$/.test(id);
      }, "\u0634\u0646\u0627\u0633\u0647 \u06A9\u0627\u0646\u0627\u0644 \u0628\u0627\u06CC\u062F \u0628\u0627 @ \u0634\u0631\u0648\u0639 \u0634\u0648\u062F\u060C \u0641\u0642\u0637 \u0634\u0627\u0645\u0644 0-9\u060C a-z\u060C _ \u0628\u0627\u0634\u062F \u0648 \u062D\u062F\u0627\u0642\u0644 5 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u0628\u0639\u062F \u0627\u0632 @ \u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F").optional(),
      channelUrl: z.string().min(1, "\u0622\u062F\u0631\u0633 \u06A9\u0627\u0646\u0627\u0644 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A").refine((url) => {
        return url.startsWith("https://") || url.startsWith("http://");
      }, "\u0622\u062F\u0631\u0633 \u06A9\u0627\u0646\u0627\u0644 \u0628\u0627\u06CC\u062F \u0628\u0627 https:// \u06CC\u0627 http:// \u0634\u0631\u0648\u0639 \u0634\u0648\u062F").optional()
    }).partial();
    insertUserSponsorMembershipSchema = createInsertSchema(userSponsorMemberships).pick({
      userId: true,
      channelId: true,
      isMember: true,
      pointsEarned: true,
      joinedAt: true,
      leftAt: true
    });
    updateUserSponsorMembershipSchema = createInsertSchema(userSponsorMemberships).pick({
      isMember: true,
      pointsEarned: true,
      joinedAt: true,
      leftAt: true,
      lastChecked: true,
      checkCount: true
    }).partial();
    insertReferralSchema = createInsertSchema(referrals).pick({
      referrerId: true,
      referredId: true,
      pointsEarned: true
    });
    insertAdminActionSchema = createInsertSchema(adminActions).pick({
      adminId: true,
      action: true,
      targetType: true,
      targetId: true,
      details: true
    });
  }
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
var pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    neonConfig.webSocketConstructor = ws;
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema: schema_exports });
  }
});

// server/storage.ts
import { eq, and, lte, inArray, asc, desc, max, sql as sql2 } from "drizzle-orm";
var DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    DatabaseStorage = class {
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
        if (userData.telegramId) {
          const existingUser = await this.getUserByTelegramId(userData.telegramId);
          if (existingUser && existingUser.userType === "bot_admin") {
            if (isKingAdmin(userData.telegramId)) {
              userData.adminLevel = 0;
              userData.userType = "bot_admin";
            } else if (existingUser.adminLevel !== void 0) {
              userData.adminLevel = existingUser.adminLevel;
            }
          }
        }
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
        const existingUser = await this.getUser(id);
        if (existingUser && existingUser.userType === "bot_admin") {
          if (existingUser.telegramId && isKingAdmin(existingUser.telegramId)) {
            delete updates.adminLevel;
            delete updates.userType;
            console.warn(`SECURITY ALERT: Attempt to modify King Admin ${existingUser.telegramId} blocked`);
          } else if ("adminLevel" in updates || "userType" in updates) {
            console.warn(`SECURITY ALERT: Attempt to modify admin levels for ${existingUser.telegramId} blocked`);
            delete updates.adminLevel;
            delete updates.userType;
          }
        }
        const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
        return user || void 0;
      }
      async getUsersByType(userType) {
        if (userType === "bot_admin") {
          return await db.select().from(users).where(eq(users.userType, userType)).orderBy(desc(users.createdAt));
        }
        return await db.select().from(users).where(eq(users.userType, userType));
      }
      // Raffle operations
      async getRaffle(id) {
        const [raffle] = await db.select().from(raffles).where(eq(raffles.id, id));
        return raffle || void 0;
      }
      async getAllRaffles() {
        return await db.select({
          id: raffles.id,
          channelId: raffles.channelId,
          messageId: raffles.messageId,
          forwardedMessageId: raffles.forwardedMessageId,
          requestNumber: raffles.requestNumber,
          prizeType: raffles.prizeType,
          prizeValue: raffles.prizeValue,
          requiredChannels: raffles.requiredChannels,
          raffleDateTime: raffles.raffleDateTime,
          levelRequired: raffles.levelRequired,
          submitterId: raffles.submitterId,
          reviewerId: raffles.reviewerId,
          status: raffles.status,
          rejectionReason: raffles.rejectionReason,
          createdAt: raffles.createdAt,
          updatedAt: raffles.updatedAt,
          submitter: {
            id: users.id,
            telegramId: users.telegramId,
            firstName: users.firstName,
            lastName: users.lastName,
            username: users.username
          }
        }).from(raffles).leftJoin(users, eq(raffles.submitterId, users.id));
      }
      async getRafflesByStatus(status) {
        const query = db.select({
          id: raffles.id,
          channelId: raffles.channelId,
          messageId: raffles.messageId,
          forwardedMessageId: raffles.forwardedMessageId,
          requestNumber: raffles.requestNumber,
          prizeType: raffles.prizeType,
          prizeValue: raffles.prizeValue,
          requiredChannels: raffles.requiredChannels,
          raffleDateTime: raffles.raffleDateTime,
          levelRequired: raffles.levelRequired,
          submitterId: raffles.submitterId,
          reviewerId: raffles.reviewerId,
          status: raffles.status,
          rejectionReason: raffles.rejectionReason,
          createdAt: raffles.createdAt,
          updatedAt: raffles.updatedAt,
          submitter: {
            id: users.id,
            telegramId: users.telegramId,
            firstName: users.firstName,
            lastName: users.lastName,
            username: users.username
          }
        }).from(raffles).leftJoin(users, eq(raffles.submitterId, users.id)).where(eq(raffles.status, status));
        if (status === "pending") {
          return await query.orderBy(asc(raffles.createdAt));
        } else if (status === "approved" || status === "rejected") {
          return await query.orderBy(desc(raffles.updatedAt));
        } else {
          return await query.orderBy(desc(raffles.createdAt));
        }
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
        const existingUser = await this.getUser(userId);
        if (existingUser && existingUser.telegramId && isKingAdmin(existingUser.telegramId)) {
          console.warn(`SECURITY ALERT: Attempt to modify King Admin role blocked`);
          return existingUser;
        }
        console.log(`Admin role change: ${existingUser?.telegramId} -> ${newRole}`);
        return await this.updateUser(userId, { userType: newRole });
      }
      async updateUserLevel(userId, newLevel) {
        return await this.updateUser(userId, { level: newLevel });
      }
      async approveRaffleWithLevel(id, levelRequired, adminUserId) {
        return await this.updateRaffle(id, {
          status: "approved",
          levelRequired,
          reviewerId: adminUserId
        });
      }
      async rejectRaffle(id, reason, restriction, adminUserId) {
        const updates = {
          status: "rejected",
          rejectionReason: reason,
          reviewerId: adminUserId
        };
        if (restriction.type !== "none") {
          const raffle = await this.getRaffle(id);
          if (raffle?.submitterId) {
            const userUpdates = { isRestricted: true, restrictionReason: reason };
            if (restriction.type === "temporary" && restriction.endDate) {
              userUpdates.restrictionStart = /* @__PURE__ */ new Date();
              userUpdates.restrictionEnd = new Date(restriction.endDate);
            } else if (restriction.type === "permanent") {
              userUpdates.restrictionStart = /* @__PURE__ */ new Date();
              userUpdates.restrictionEnd = null;
            }
            await this.updateUser(raffle.submitterId, userUpdates);
          }
        }
        return await this.updateRaffle(id, updates);
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
        const allRaffles = await db.select({ requestNumber: raffles.requestNumber }).from(raffles).orderBy(raffles.requestNumber);
        const nextRequestNumber = allRaffles.length > 0 ? Math.max(...allRaffles.map((r) => r.requestNumber)) + 1 : 1;
        const raffleWithRequestNumber = {
          ...raffle,
          requestNumber: nextRequestNumber
        };
        const [newRaffle] = await db.insert(raffles).values(raffleWithRequestNumber).returning();
        return newRaffle;
      }
      async updateRaffle(id, updates) {
        const [raffle] = await db.update(raffles).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(raffles.id, id)).returning();
        return raffle || void 0;
      }
      async getRafflesBySubmitter(submitterId) {
        return await db.select({
          id: raffles.id,
          channelId: raffles.channelId,
          messageId: raffles.messageId,
          forwardedMessageId: raffles.forwardedMessageId,
          requestNumber: raffles.requestNumber,
          prizeType: raffles.prizeType,
          prizeValue: raffles.prizeValue,
          requiredChannels: raffles.requiredChannels,
          raffleDateTime: raffles.raffleDateTime,
          levelRequired: raffles.levelRequired,
          submitterId: raffles.submitterId,
          reviewerId: raffles.reviewerId,
          status: raffles.status,
          rejectionReason: raffles.rejectionReason,
          createdAt: raffles.createdAt,
          updatedAt: raffles.updatedAt,
          submitter: {
            id: users.id,
            telegramId: users.telegramId,
            firstName: users.firstName,
            lastName: users.lastName,
            username: users.username
          }
        }).from(raffles).leftJoin(users, eq(raffles.submitterId, users.id)).where(eq(raffles.submitterId, submitterId));
      }
      // Sponsor channel operations
      async getSponsorChannels() {
        return await db.select().from(sponsorChannels).where(eq(sponsorChannels.isActive, true)).orderBy(desc(sponsorChannels.displayOrder), desc(sponsorChannels.createdAt));
      }
      async createSponsorChannel(channel) {
        const maxOrderResult = await db.select({ maxOrder: max(sponsorChannels.displayOrder) }).from(sponsorChannels).where(eq(sponsorChannels.isActive, true));
        const nextOrder = (maxOrderResult[0]?.maxOrder || 0) + 1;
        const [newChannel] = await db.insert(sponsorChannels).values({
          channelId: channel.channelId,
          channelUsername: channel.channelUsername,
          channelName: channel.channelName,
          channelUrl: channel.channelUrl,
          description: channel.description,
          pointsReward: channel.pointsReward,
          isSpecial: channel.isSpecial,
          displayOrder: nextOrder
        }).returning();
        return newChannel;
      }
      async deleteSponsorChannel(id) {
        await db.update(sponsorChannels).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(sponsorChannels.id, id));
      }
      async updateSponsorChannel(id, updates) {
        const [updatedChannel] = await db.update(sponsorChannels).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(sponsorChannels.id, id)).returning();
        return updatedChannel;
      }
      async reorderSponsorChannels(channelOrders) {
        for (const { id, displayOrder } of channelOrders) {
          await db.update(sponsorChannels).set({ displayOrder, updatedAt: /* @__PURE__ */ new Date() }).where(eq(sponsorChannels.id, id));
        }
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
      // Missing methods implementation
      async joinSponsorChannel(userId, channelId) {
        const existing = await db.select().from(userSponsorMemberships).where(and(
          eq(userSponsorMemberships.userId, userId),
          eq(userSponsorMemberships.channelId, channelId)
        ));
        if (existing.length > 0) {
          return { pointsEarned: 0 };
        }
        const channel = await this.getSponsorChannels();
        const targetChannel = channel.find((c) => c.id === channelId);
        const pointsEarned = targetChannel?.pointsReward || 100;
        await db.insert(userSponsorMemberships).values({
          userId,
          channelId,
          pointsEarned
        });
        await this.addPoints(userId, pointsEarned);
        return { pointsEarned };
      }
      async getAdminUsers() {
        return await db.select().from(users).where(eq(users.userType, "bot_admin"));
      }
      async getAdminStats() {
        const [pending, approved, rejected, total] = await Promise.all([
          db.select().from(raffles).where(eq(raffles.status, "pending")),
          db.select().from(raffles).where(eq(raffles.status, "approved")),
          db.select().from(raffles).where(eq(raffles.status, "rejected")),
          db.select().from(users)
        ]);
        return {
          pendingRaffles: pending.length,
          approvedRaffles: approved.length,
          rejectedRaffles: rejected.length,
          totalUsers: total.length
        };
      }
      async getUserStats(userId) {
        const user = await this.getUser(userId);
        if (!user) {
          return {
            referralCount: 0,
            totalPoints: 0,
            levelProgress: 0,
            nextLevelPoints: 100
          };
        }
        const referrals2 = await db.select().from(users).where(eq(users.referrerId, userId));
        const currentPoints = user.points;
        const currentLevel = user.level;
        let nextLevelPoints = 100;
        if (currentLevel === 1) nextLevelPoints = 100;
        else if (currentLevel === 2) nextLevelPoints = 200;
        else if (currentLevel === 3) nextLevelPoints = 500;
        else if (currentLevel === 4) nextLevelPoints = 1e3;
        else nextLevelPoints = 2e3;
        const progress = Math.min(100, currentPoints / nextLevelPoints * 100);
        return {
          referralCount: referrals2.length,
          totalPoints: currentPoints,
          levelProgress: progress,
          nextLevelPoints: nextLevelPoints - currentPoints
        };
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
      // User sponsor membership methods
      async getUserSponsorMemberships(userId) {
        return await db.select({
          channelId: userSponsorMemberships.channelId,
          isMember: userSponsorMemberships.isMember,
          pointsEarned: userSponsorMemberships.pointsEarned,
          joinedAt: userSponsorMemberships.joinedAt,
          leftAt: userSponsorMemberships.leftAt,
          lastChecked: userSponsorMemberships.lastChecked,
          channelName: sponsorChannels.channelName,
          channelUrl: sponsorChannels.channelUrl,
          pointsReward: sponsorChannels.pointsReward
        }).from(userSponsorMemberships).leftJoin(sponsorChannels, eq(userSponsorMemberships.channelId, sponsorChannels.channelId)).where(eq(userSponsorMemberships.userId, userId));
      }
      async getAvailableSponsorChannelsForUser(userId) {
        const allChannels = await this.getSponsorChannels();
        const userMemberships = await this.getUserSponsorMemberships(userId);
        const membershipMap = new Map(
          userMemberships.map((m) => [m.channelId, m])
        );
        return allChannels.map((channel) => ({
          ...channel,
          membership: membershipMap.get(channel.channelId) || null,
          isMember: membershipMap.get(channel.channelId)?.isMember || false
        }));
      }
      // Admin level management (keeping only one version)
      async secureAdminLevelChangeV1(currentUserTelegramId, targetUserId, newAdminLevel) {
        if (!isKingAdmin(currentUserTelegramId)) {
          throw new Error("Unauthorized: Only King Admin can change admin levels");
        }
        return await this.updateUser(targetUserId, { adminLevel: newAdminLevel });
      }
      // User channel membership methods for Telegram bot integration
      async updateUserChannelMembership(userId, channelId, isMember, pointsEarned = 0) {
        const existing = await db.select().from(userSponsorMemberships).where(and(
          eq(userSponsorMemberships.userId, userId),
          eq(userSponsorMemberships.channelId, channelId)
        ));
        if (existing.length > 0) {
          const updateData = {
            isMember,
            pointsEarned: existing[0].pointsEarned + pointsEarned,
            lastChecked: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date(),
            checkCount: (existing[0].checkCount || 0) + 1,
            ...isMember ? { joinedAt: /* @__PURE__ */ new Date() } : { leftAt: /* @__PURE__ */ new Date() }
          };
          const [updated] = await db.update(userSponsorMemberships).set(updateData).where(and(
            eq(userSponsorMemberships.userId, userId),
            eq(userSponsorMemberships.channelId, channelId)
          )).returning();
          return updated;
        } else {
          const createData = {
            userId,
            channelId,
            isMember,
            pointsEarned,
            lastChecked: /* @__PURE__ */ new Date(),
            checkCount: 1,
            ...isMember ? { joinedAt: /* @__PURE__ */ new Date() } : { leftAt: /* @__PURE__ */ new Date() }
          };
          const [created] = await db.insert(userSponsorMemberships).values(createData).returning();
          return created;
        }
      }
      // Update sponsor channel bot access status
      async updateSponsorChannelBotAccess(channelId, hasAccess) {
        await db.update(sponsorChannels).set({
          botHasAccess: hasAccess,
          lastAccessCheck: /* @__PURE__ */ new Date()
        }).where(eq(sponsorChannels.channelId, channelId));
      }
      // Get all users (for bulk membership checks)
      async getUsers() {
        return await db.select().from(users);
      }
      // Helper method to check if user is admin based on Telegram ID
      async isUserAdmin(telegramId) {
        try {
          if (isKingAdmin(telegramId)) {
            return true;
          }
          const user = await this.getUserByTelegramId(telegramId);
          return user ? user.userType === "bot_admin" : false;
        } catch (error) {
          console.error("Error checking admin status:", error);
          return isKingAdmin(telegramId);
        }
      }
      // Check if user is King admin (highest level) - NO environment override allowed
      async isUserKing(telegramId) {
        return isKingAdmin(telegramId);
      }
      // ADMIN MANAGEMENT: Update database trigger with current King Admin ID
      async updateDatabaseTriggerForKingAdmin() {
        try {
          const kingAdminId = getKingAdminId();
          await db.execute(sql2`
        CREATE OR REPLACE FUNCTION protect_king_admin()
        RETURNS TRIGGER AS $$
        DECLARE
          king_admin_id TEXT := ${kingAdminId};
        BEGIN
          IF OLD.telegram_id = king_admin_id THEN
            NEW.admin_level = 0;
            NEW.user_type = 'bot_admin';
            RAISE WARNING 'SECURITY: King Admin protection triggered for ID % - forced admin_level=0, user_type=bot_admin', king_admin_id;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
          await db.execute(sql2`
        CREATE OR REPLACE FUNCTION prevent_king_admin_bypass()
        RETURNS TRIGGER AS $$
        DECLARE
          king_admin_id TEXT := ${kingAdminId};
        BEGIN
          -- Prevent any attempt to create another admin_level 0 user
          IF NEW.admin_level = 0 AND NEW.telegram_id != king_admin_id THEN
            RAISE EXCEPTION 'SECURITY VIOLATION: Only one King Admin allowed (telegram_id: %)', king_admin_id;
          END IF;
          
          -- Prevent changing existing King Admin's telegram_id
          IF OLD.admin_level = 0 AND OLD.telegram_id = king_admin_id AND NEW.telegram_id != king_admin_id THEN
            RAISE EXCEPTION 'SECURITY VIOLATION: Cannot change King Admin telegram_id';
          END IF;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
          console.log(`Database triggers updated for King Admin: ${kingAdminId}`);
        } catch (error) {
          console.error("Error updating database trigger:", error);
        }
      }
      // SECURITY METHOD: Only King Admin can promote/demote other admins
      async secureAdminLevelChange(requesterId, targetUserId, newAdminLevel) {
        const requester = await this.getUserByTelegramId(requesterId);
        if (!requester || requester.adminLevel !== 0) {
          console.warn(`SECURITY ALERT: Unauthorized admin level change attempt by ${requesterId}`);
          return void 0;
        }
        const targetUser = await this.getUser(targetUserId);
        if (!targetUser) {
          return void 0;
        }
        if (targetUser.telegramId && isKingAdmin(targetUser.telegramId)) {
          console.warn(`SECURITY ALERT: Attempt to modify King Admin level by ${requesterId} blocked`);
          return targetUser;
        }
        console.log(`SECURITY: King Admin ${requesterId} changing admin level for ${targetUser.telegramId}: ${targetUser.adminLevel} -> ${newAdminLevel}`);
        const [user] = await db.update(users).set({
          adminLevel: newAdminLevel,
          userType: newAdminLevel < 2 ? "bot_admin" : "regular",
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(users.id, targetUserId)).returning();
        return user || void 0;
      }
      // Get admin level for a user
      async getAdminLevel(telegramId) {
        try {
          if (await this.isUserKing(telegramId)) {
            return 0;
          }
          const user = await this.getUserByTelegramId(telegramId);
          if (user && user.userType === "bot_admin") {
            return user.adminLevel || 1;
          }
          return null;
        } catch (error) {
          console.error("Error getting admin level:", error);
          return null;
        }
      }
      // Approve raffle (alternate implementation)
      async approveRaffleSimple(raffleId, level) {
        const [updatedRaffle] = await db.update(raffles).set({
          status: "approved",
          levelRequired: level,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(raffles.id, raffleId)).returning();
        if (!updatedRaffle) {
          throw new Error("Raffle not found");
        }
        return updatedRaffle;
      }
      // Reject raffle (alternate implementation)
      async rejectRaffleSimple(raffleId, reason) {
        const [updatedRaffle] = await db.update(raffles).set({
          status: "rejected",
          rejectionReason: reason,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(raffles.id, raffleId)).returning();
        if (!updatedRaffle) {
          throw new Error("Raffle not found");
        }
        return updatedRaffle;
      }
      async initializeSampleData() {
        try {
          const existingChannels = await this.getSponsorChannels();
          if (existingChannels.length > 0) {
            return;
          }
          await this.createSponsorChannel({
            channelId: "-1001234567890",
            channelName: "\u062A\u0644\u06AF\u0631\u0627\u0645 \u0641\u0627\u0631\u0633\u06CC",
            channelUrl: "https://t.me/telegram_farsi",
            pointsReward: 100,
            isSpecial: false
          });
          await this.createSponsorChannel({
            channelId: "-1001234567891",
            channelName: "\u0627\u062E\u0628\u0627\u0631 \u0641\u0646\u0627\u0648\u0631\u06CC \u0627\u06CC\u0631\u0627\u0646",
            channelUrl: "https://t.me/tech_news_ir",
            pointsReward: 150,
            isSpecial: false
          });
          const now = /* @__PURE__ */ new Date();
          const futureDate1 = new Date(now.getTime() + 24 * 60 * 60 * 1e3);
          const futureDate2 = new Date(now.getTime() + 48 * 60 * 60 * 1e3);
          await this.createRaffle({
            channelId: "@raffle_channel",
            messageId: "123",
            forwardedMessageId: null,
            requestNumber: 1,
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
            requestNumber: 2,
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
      async deleteRaffle(id) {
        try {
          console.log(`Attempting to delete raffle with id: ${id}`);
          const existingRaffle = await this.getRaffle(id);
          console.log(`Existing raffle:`, existingRaffle);
          if (!existingRaffle) {
            console.log(`Raffle with id ${id} not found`);
            return false;
          }
          console.log(`Deleting related data for raffle ${id}...`);
          const participantsDeleteResult = await db.delete(raffleParticipants).where(eq(raffleParticipants.raffleId, id));
          console.log(`Deleted ${participantsDeleteResult.rowCount || 0} participants`);
          const seenDeleteResult = await db.delete(userSeenRaffles).where(eq(userSeenRaffles.raffleId, id));
          console.log(`Deleted ${seenDeleteResult.rowCount || 0} seen records`);
          const result = await db.delete(raffles).where(eq(raffles.id, id));
          console.log(`Delete result:`, result);
          return (result.rowCount || 0) > 0;
        } catch (error) {
          console.error("Delete raffle error:", error);
          return false;
        }
      }
      async bulkDeleteRafflesByStatus(status) {
        try {
          console.log(`Attempting to bulk delete raffles with status: ${status}`);
          const existingRaffles = await db.select().from(raffles).where(eq(raffles.status, status));
          console.log(`Found ${existingRaffles.length} raffles with status ${status}`);
          if (existingRaffles.length === 0) {
            return 0;
          }
          const raffleIds = existingRaffles.map((raffle) => raffle.id);
          console.log(`Deleting related data for ${raffleIds.length} raffles...`);
          const participantsDeleteResult = await db.delete(raffleParticipants).where(inArray(raffleParticipants.raffleId, raffleIds));
          console.log(`Deleted ${participantsDeleteResult.rowCount || 0} participants`);
          const seenDeleteResult = await db.delete(userSeenRaffles).where(inArray(userSeenRaffles.raffleId, raffleIds));
          console.log(`Deleted ${seenDeleteResult.rowCount || 0} seen records`);
          const result = await db.delete(raffles).where(eq(raffles.status, status));
          console.log(`Delete result:`, result);
          return result.rowCount || existingRaffles.length;
        } catch (error) {
          console.error("Bulk delete raffles error:", error);
          return 0;
        }
      }
    };
    storage = new DatabaseStorage();
  }
});

// server/services/telegramBot.ts
var telegramBot_exports = {};
__export(telegramBot_exports, {
  default: () => TelegramBotService
});
import axios from "axios";
var TelegramBotService;
var init_telegramBot = __esm({
  "server/services/telegramBot.ts"() {
    "use strict";
    init_storage();
    TelegramBotService = class {
      botToken;
      baseUrl;
      constructor(botToken) {
        this.botToken = botToken;
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
      }
      // Check if user is a member of a specific channel
      async checkUserMembership(userId, channelId) {
        try {
          const response = await axios.get(
            `${this.baseUrl}/getChatMember`,
            {
              params: {
                chat_id: channelId,
                user_id: userId
              },
              timeout: 1e4
            }
          );
          if (response.data.ok) {
            const status = response.data.result.status;
            const isMember = ["creator", "administrator", "member"].includes(status);
            return {
              isMember,
              status
            };
          } else {
            return {
              isMember: false,
              error: "Failed to get member info"
            };
          }
        } catch (error) {
          console.error(`Error checking membership for user ${userId} in channel ${channelId}:`, error.message);
          if (error.response?.status === 400) {
            return {
              isMember: false,
              error: "User not found or bot has no access to channel"
            };
          }
          return {
            isMember: false,
            error: error.message || "Network error"
          };
        }
      }
      // Update user membership status and award points if newly joined
      async updateUserMembership(userId, channelId) {
        let telegramId = userId;
        if (userId.startsWith("telegram_")) {
          telegramId = userId.replace("telegram_", "");
        } else if (!userId.match(/^\d+$/)) {
          const user = await storage.getUser(userId);
          if (!user) {
            return {
              isMember: false,
              pointsEarned: 0,
              error: "User not found"
            };
          }
          telegramId = user.telegramId;
        }
        const membershipResult = await this.checkUserMembership(telegramId, channelId);
        if (membershipResult.error) {
          return {
            isMember: false,
            pointsEarned: 0,
            error: membershipResult.error
          };
        }
        const isMember = membershipResult.isMember;
        const existingMemberships = await storage.getUserSponsorMemberships(userId);
        const existingMembership = existingMemberships.find((m) => m.channelId === channelId);
        let pointsEarned = 0;
        if (isMember && (!existingMembership || !existingMembership.isMember)) {
          const channels = await storage.getSponsorChannels();
          const channel = channels.find((c) => c.channelId === channelId);
          pointsEarned = channel?.pointsReward || 100;
          await storage.addPoints(userId, pointsEarned);
        }
        await storage.updateUserChannelMembership(
          userId,
          channelId,
          isMember,
          pointsEarned
        );
        return {
          isMember,
          pointsEarned,
          status: membershipResult.status
        };
      }
      // Check bot access to a specific channel
      async checkChannelBotAccess(channelId) {
        try {
          const response = await axios.get(
            `${this.baseUrl}/getChat`,
            {
              params: {
                chat_id: channelId
              },
              timeout: 1e4
            }
          );
          return response.data.ok;
        } catch (error) {
          console.error(`Bot access check failed for channel ${channelId}:`, error.message);
          return false;
        }
      }
      // Update channel bot access status in database
      async updateChannelBotAccess(channelId) {
        const hasAccess = await this.checkChannelBotAccess(channelId);
        await storage.updateSponsorChannelBotAccess(channelId, hasAccess);
        return hasAccess;
      }
      // Check bot access for all channels and update database
      async checkAllChannelsAccess() {
        const channels = await storage.getSponsorChannels();
        const results = [];
        let accessibleCount = 0;
        for (const channel of channels) {
          const hasAccess = await this.checkChannelBotAccess(channel.channelId);
          await storage.updateSponsorChannelBotAccess(channel.channelId, hasAccess);
          results.push({
            channelId: channel.channelId,
            channelName: channel.channelName,
            hasAccess
          });
          if (hasAccess) {
            accessibleCount++;
          }
        }
        return {
          totalChannels: channels.length,
          accessibleChannels: accessibleCount,
          inaccessibleChannels: channels.length - accessibleCount,
          results
        };
      }
      // Check all users' membership in a specific channel
      async checkAllUsersInChannel(channelId) {
        const allUsers = await storage.getUsers();
        let updatedCount = 0;
        const hasAccess = await this.checkChannelBotAccess(channelId);
        await storage.updateSponsorChannelBotAccess(channelId, hasAccess);
        if (!hasAccess) {
          console.warn(`Bot has no access to channel ${channelId}, skipping membership checks`);
          return 0;
        }
        for (const user of allUsers) {
          if (user.telegramId) {
            try {
              await this.updateUserMembership(user.id, channelId);
              updatedCount++;
            } catch (error) {
              console.error(`Failed to update membership for user ${user.id}:`, error);
            }
          }
        }
        return updatedCount;
      }
      // Bulk check memberships for multiple users and channels
      async bulkCheckMemberships() {
        const channels = await storage.getSponsorChannels();
        const users2 = await storage.getUsers();
        let totalChecks = 0;
        let successfulChecks = 0;
        let failedChecks = 0;
        let totalPointsAwarded = 0;
        console.log(`\u{1F4CA} Starting bulk membership check for ${users2.length} users across ${channels.length} channels`);
        for (const channel of channels) {
          if (!channel.botHasAccess) {
            console.log(`\u26A0\uFE0F Skipping channel ${channel.channelName} - Bot has no access`);
            continue;
          }
          console.log(`\u{1F50D} Checking channel: ${channel.channelName}`);
          for (const user of users2) {
            if (user.telegramId) {
              totalChecks++;
              try {
                const result = await this.updateUserMembership(user.id, channel.channelId);
                successfulChecks++;
                totalPointsAwarded += result.pointsEarned;
                if (result.pointsEarned > 0) {
                  console.log(`\u{1F4B0} User ${user.telegramId} earned ${result.pointsEarned} points from ${channel.channelName}`);
                }
              } catch (error) {
                failedChecks++;
                console.error(`\u274C Failed check for user ${user.telegramId} in ${channel.channelName}:`, error);
              }
            }
          }
        }
        console.log(`\u{1F4C8} Bulk check completed: ${successfulChecks}/${totalChecks} successful, ${totalPointsAwarded} total points awarded`);
        return {
          totalChecks,
          successfulChecks,
          failedChecks,
          pointsAwarded: totalPointsAwarded
        };
      }
    };
  }
});

// server/services/membershipScheduler.ts
var membershipScheduler_exports = {};
__export(membershipScheduler_exports, {
  default: () => MembershipScheduler
});
import * as cron from "node-cron";
var MembershipScheduler;
var init_membershipScheduler = __esm({
  "server/services/membershipScheduler.ts"() {
    "use strict";
    init_telegramBot();
    init_storage();
    MembershipScheduler = class {
      telegramBot;
      scheduledTask = null;
      constructor(botToken) {
        this.telegramBot = new TelegramBotService(botToken);
      }
      // Start the scheduler
      start() {
        this.scheduledTask = cron.schedule("*/5 8-23 * * *", async () => {
          await this.runMembershipCheck();
        }, {
          scheduled: true,
          timezone: "Asia/Tehran"
        });
        console.log("\u{1F680} Starting membership scheduler...");
        setTimeout(() => {
          this.runMembershipCheck();
        }, 3e4);
      }
      // Stop the scheduler
      stop() {
        if (this.scheduledTask) {
          this.scheduledTask.stop();
          this.scheduledTask = null;
          console.log("\u{1F6D1} Membership scheduler stopped");
        }
      }
      // Main membership checking routine
      async runMembershipCheck() {
        try {
          console.log("\u{1F4CB} Starting scheduled membership check...");
          const channels = await storage.getSponsorChannels();
          console.log(`\u{1F4CA} Found ${channels.length} active sponsor channels`);
          if (channels.length === 0) {
            console.log("\u2139\uFE0F No sponsor channels found, skipping membership check");
            return;
          }
          await this.updateChannelAccess(channels);
          const accessibleChannels = channels.filter((c) => c.botHasAccess);
          if (accessibleChannels.length === 0) {
            console.log("\u26A0\uFE0F No accessible channels found, skipping user membership checks");
            return;
          }
          const result = await this.telegramBot.bulkCheckMemberships();
          console.log(`\u{1F4C8} Membership check summary: ${result.successfulChecks} users updated across ${accessibleChannels.length} channels`);
          if (result.pointsAwarded > 0) {
            console.log(`\u{1F4B0} Total points awarded this round: ${result.pointsAwarded}`);
          }
          console.log("\u2705 Scheduled membership check completed");
        } catch (error) {
          console.error("\u274C Error during scheduled membership check:", error);
        }
      }
      // Update bot access status for all channels
      async updateChannelAccess(channels) {
        for (const channel of channels) {
          try {
            const hasAccess = await this.telegramBot.checkChannelBotAccess(channel.channelId);
            if (hasAccess !== channel.botHasAccess) {
              await storage.updateSponsorChannelBotAccess(channel.channelId, hasAccess);
              console.log(`\u{1F504} Updated bot access for ${channel.channelName}: ${hasAccess ? "accessible" : "not accessible"}`);
            }
            if (!hasAccess) {
              console.log(`\u26A0\uFE0F Skipping channel ${channel.channelName} - Bot has no access`);
            }
          } catch (error) {
            console.error(`\u274C Failed to check bot access for ${channel.channelName}:`, error);
          }
        }
      }
      // Manual trigger for immediate check
      async triggerImmediateCheck() {
        console.log("\u{1F504} Manual membership check triggered");
        await this.runMembershipCheck();
      }
      // Get scheduler status
      getStatus() {
        return {
          isRunning: this.scheduledTask !== null,
          nextRun: this.scheduledTask ? "Every 5 minutes (8 AM - 11 PM)" : null
        };
      }
    };
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
init_storage();
init_schema();
init_db();
import { createServer } from "http";
import { z as z2 } from "zod";
import { eq as eq2 } from "drizzle-orm";
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
        if (status && status !== "all") {
          raffles2 = await storage.getRafflesByStatus(status);
        } else if (submitterId) {
          raffles2 = await storage.getRafflesBySubmitter(submitterId);
        } else {
          raffles2 = await storage.getRafflesByStatus("pending");
        }
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
  app2.patch("/api/raffles/:id/approve", async (req, res) => {
    try {
      const { levelRequired, adminUserId, status } = req.body;
      const admin = await storage.getUser(adminUserId);
      if (!admin || admin.userType !== "bot_admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const raffle = await storage.approveRaffleWithLevel(req.params.id, levelRequired, adminUserId);
      if (!raffle) {
        return res.status(404).json({ message: "Raffle not found" });
      }
      res.json(raffle);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.patch("/api/raffles/:id/reject", async (req, res) => {
    try {
      const { adminUserId, reason, restriction } = req.body;
      const admin = await storage.getUser(adminUserId);
      if (!admin || admin.userType !== "bot_admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const raffle = await storage.rejectRaffle(req.params.id, reason, restriction || { type: "none" }, adminUserId);
      if (!raffle) {
        return res.status(404).json({ message: "Raffle not found" });
      }
      res.json(raffle);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.delete("/api/raffles/bulk-delete", async (req, res) => {
    try {
      const { status } = req.query;
      if (!status || status !== "approved" && status !== "rejected") {
        return res.status(400).json({ message: "Invalid status. Must be 'approved' or 'rejected'" });
      }
      console.log(`Bulk deleting raffles with status: ${status}`);
      const deletedCount = await storage.bulkDeleteRafflesByStatus(status);
      console.log(`Deleted ${deletedCount} raffles`);
      res.json({
        message: `Successfully deleted ${deletedCount} ${status} raffles`,
        deletedCount
      });
    } catch (error) {
      console.error("Bulk delete raffles error:", error);
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.delete("/api/raffles/:id", async (req, res) => {
    try {
      const raffleId = req.params.id;
      const deleted = await storage.deleteRaffle(raffleId);
      if (!deleted) {
        return res.status(404).json({ message: "Raffle not found" });
      }
      res.json({ message: "Raffle deleted successfully", id: raffleId });
    } catch (error) {
      console.error("Delete raffle error:", error);
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
  app2.post("/api/raffles/:id/approve", async (req, res) => {
    try {
      const { level } = req.body;
      const raffleId = req.params.id;
      if (!level) {
        return res.status(400).json({ message: "Level is required" });
      }
      const result = await storage.approveRaffleWithLevel(raffleId, level, "system");
      res.json(result);
    } catch (error) {
      console.error("Error approving raffle:", error);
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.post("/api/raffles/:id/reject", async (req, res) => {
    try {
      const { reason } = req.body;
      const raffleId = req.params.id;
      const result = await storage.rejectRaffle(raffleId, reason, null, "system");
      res.json(result);
    } catch (error) {
      console.error("Error rejecting raffle:", error);
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.get("/api/users", async (req, res) => {
    try {
      const { userType } = req.query;
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      if (userType) {
        const userTypes = userType.split(",");
        const allUsers = [];
        for (const type of userTypes) {
          const dbUsers = await db.select().from(users).where(eq2(users.userType, type.trim()));
          console.log(`DB query for type "${type}":`, dbUsers.map((u) => ({ id: u.id, telegramId: u.telegramId, userType: u.userType })));
          allUsers.push(...dbUsers);
        }
        console.log(`Final result for types ${userTypes}:`, allUsers.map((u) => ({ id: u.id, telegramId: u.telegramId, userType: u.userType })));
        res.json(allUsers);
      } else {
        res.json([]);
      }
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
      console.log("Received sponsor channel data:", req.body);
      const channelData = insertSponsorChannelSchema.parse(req.body);
      console.log("Validated sponsor channel data:", channelData);
      const channel = await storage.createSponsorChannel(channelData);
      res.json(channel);
    } catch (error) {
      console.error("Sponsor channel creation error:", error);
      res.status(400).json({ message: "Invalid channel data", error: error.message });
    }
  });
  app2.delete("/api/sponsor-channels/:id", async (req, res) => {
    try {
      await storage.deleteSponsorChannel(req.params.id);
      res.json({ message: "Sponsor channel deleted successfully" });
    } catch (error) {
      console.error("Sponsor channel deletion error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  app2.put("/api/sponsor-channels/:id", async (req, res) => {
    try {
      const updates = req.body;
      const updatedChannel = await storage.updateSponsorChannel(req.params.id, updates);
      if (!updatedChannel) {
        return res.status(404).json({ message: "Sponsor channel not found" });
      }
      res.json(updatedChannel);
    } catch (error) {
      console.error("Sponsor channel update error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  app2.put("/api/sponsor-channels-reorder", async (req, res) => {
    try {
      const { channelOrders } = req.body;
      const reorderSchema = z2.object({
        channelOrders: z2.array(z2.object({
          id: z2.string(),
          displayOrder: z2.number()
        }))
      });
      const validatedData = reorderSchema.parse({ channelOrders });
      await storage.reorderSponsorChannels(validatedData.channelOrders);
      res.json({ message: "Sponsor channels reordered successfully" });
    } catch (error) {
      console.error("Sponsor channel reorder error:", error);
      res.status(400).json({ message: "Invalid reorder data", error: error.message });
    }
  });
  app2.get("/api/user/:userId/sponsor-memberships", async (req, res) => {
    try {
      const { userId } = req.params;
      const memberships = await storage.getUserSponsorMemberships(userId);
      res.json(memberships);
    } catch (error) {
      console.error("Error fetching user memberships:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  app2.post("/api/user/:userId/check-membership/:channelId", async (req, res) => {
    try {
      const { userId, channelId } = req.params;
      if (!process.env.BOT_TOKEN) {
        return res.status(500).json({ message: "Bot token not configured" });
      }
      const TelegramBotService2 = (await Promise.resolve().then(() => (init_telegramBot(), telegramBot_exports))).default;
      const telegramBot = new TelegramBotService2(process.env.BOT_TOKEN);
      const result = await telegramBot.updateUserMembership(userId, channelId);
      res.json(result);
    } catch (error) {
      console.error("Error checking membership:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });
  app2.get("/api/user/:userId/available-channels", async (req, res) => {
    try {
      const { userId } = req.params;
      const channels = await storage.getAvailableSponsorChannelsForUser(userId);
      res.json(channels);
    } catch (error) {
      console.error("Error fetching available channels:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  app2.post("/api/admin/check-all-memberships/:channelId", async (req, res) => {
    try {
      if (!process.env.BOT_TOKEN) {
        return res.status(500).json({ message: "Bot token not configured" });
      }
      const { channelId } = req.params;
      const TelegramBotService2 = (await Promise.resolve().then(() => (init_telegramBot(), telegramBot_exports))).default;
      const telegramBot = new TelegramBotService2(process.env.BOT_TOKEN);
      const updatedCount = await telegramBot.checkAllUsersInChannel(channelId);
      res.json({
        message: `Successfully checked ${updatedCount} memberships`,
        updatedCount
      });
    } catch (error) {
      console.error("Error checking all memberships:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });
  app2.post("/api/admin/check-bot-access", async (req, res) => {
    try {
      if (!process.env.BOT_TOKEN) {
        return res.status(500).json({ message: "Bot token not configured" });
      }
      const TelegramBotService2 = (await Promise.resolve().then(() => (init_telegramBot(), telegramBot_exports))).default;
      const telegramBot = new TelegramBotService2(process.env.BOT_TOKEN);
      const result = await telegramBot.checkAllChannelsAccess();
      res.json(result);
    } catch (error) {
      console.error("Error checking bot access:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });
  app2.post("/api/admin/update-channel-access/:channelId", async (req, res) => {
    try {
      if (!process.env.BOT_TOKEN) {
        return res.status(500).json({ message: "Bot token not configured" });
      }
      const { channelId } = req.params;
      const TelegramBotService2 = (await Promise.resolve().then(() => (init_telegramBot(), telegramBot_exports))).default;
      const telegramBot = new TelegramBotService2(process.env.BOT_TOKEN);
      const hasAccess = await telegramBot.updateChannelBotAccess(channelId);
      res.json({
        channelId,
        hasAccess,
        message: hasAccess ? "Bot has access to channel" : "Bot does not have access to channel"
      });
    } catch (error) {
      console.error("Error updating channel access:", error);
      res.status(500).json({ message: error.message || "Server error" });
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
      console.log(`DB query for type "${type}":`, type ? await storage.getUsersByType(type) : []);
      const users2 = type ? await storage.getUsersByType(type) : [];
      res.json(users2);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Server error", error });
    }
  });
  const telegramAuthSchema = z2.object({
    telegramId: z2.string().min(1),
    firstName: z2.string().optional(),
    lastName: z2.string().optional(),
    profileImageUrl: z2.string().url().optional()
  });
  app2.post("/api/auth/telegram", async (req, res) => {
    try {
      const body = telegramAuthSchema.parse(req.body);
      const existingUser = await storage.getUserByTelegramId(body.telegramId);
      const userData = {
        telegramId: body.telegramId,
        firstName: body.firstName,
        lastName: body.lastName,
        profileImageUrl: body.profileImageUrl,
        authMethod: "telegram",
        // Preserve existing user type and adminLevel if user exists, otherwise determine from admin status
        userType: existingUser ? existingUser.userType : await storage.isUserAdmin(body.telegramId) ? "bot_admin" : "regular",
        adminLevel: existingUser ? existingUser.adminLevel : isKingAdmin(body.telegramId) ? 0 : await storage.isUserAdmin(body.telegramId) ? 1 : 2
      };
      const user = await storage.upsertUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid authentication data", error });
    }
  });
  const gmailAuthSchema = z2.object({
    email: z2.string().email(),
    firstName: z2.string().optional(),
    lastName: z2.string().optional(),
    profileImageUrl: z2.string().url().optional()
  });
  app2.post("/api/auth/gmail", async (req, res) => {
    try {
      const body = gmailAuthSchema.parse(req.body);
      const user = await storage.upsertUser({
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        profileImageUrl: body.profileImageUrl,
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
      let adminLevel = null;
      if (user.telegramId) {
        adminLevel = await storage.getAdminLevel(user.telegramId);
      }
      res.json({ ...user, currentAdminLevel: adminLevel });
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
  app2.get("/api/users/:id/stats", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const stats = {
        referralCount: 0,
        // This would be calculated from referrals
        levelProgress: user.points % 100 / 100 * 100,
        // Simple level progress calculation
        nextLevelPoints: Math.ceil((user.level + 1) * 100)
        // Next level points needed
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.get("/api/users/:id/referral", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const referralData = {
        referralLink: user.referralCode ? `https://t.me/YourBotName?start=${user.referralCode}` : null,
        referredCount: 0,
        // Would be calculated from database
        referralPoints: user.points || 0,
        referredUsers: []
        // Would be fetched from database
      };
      res.json(referralData);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.post("/api/users/:id/generate-referral", async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user.referralCode) {
        const referralCode = `ref_${userId}_${Date.now()}`;
        await storage.updateUser(userId, { referralCode });
      }
      const updatedUser = await storage.getUser(userId);
      const referralLink = `https://t.me/YourBotName?start=${updatedUser?.referralCode}`;
      res.json({ referralLink });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.post("/api/admins", async (req, res) => {
    try {
      const { telegramId, userType, adminLevel } = req.body;
      let user = await storage.getUserByTelegramId(telegramId);
      if (!user) {
        user = await storage.createUser({
          telegramId,
          userType,
          adminLevel: adminLevel || 2,
          authMethod: "telegram"
        });
      } else {
        user = await storage.updateUser(user.id, {
          userType,
          adminLevel: adminLevel || 2
        });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.delete("/api/admins/:telegramId", async (req, res) => {
    try {
      const { telegramId } = req.params;
      if (isKingAdmin(telegramId)) {
        return res.status(403).json({
          message: "Cannot remove King Admin",
          error: "Security violation: King Admin cannot be removed"
        });
      }
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const [updatedUser] = await db.update(users).set({
        userType: "regular",
        adminLevel: 2,
        // Regular user level
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq2(users.id, user.id)).returning();
      console.log(`Admin removed: ${telegramId} converted to regular user`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error removing admin:", error);
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.patch("/api/raffles/:id/approve", async (req, res) => {
    try {
      const { levelRequired, adminUserId, reason } = req.body;
      const raffle = await storage.approveRaffleWithLevel(req.params.id, levelRequired, adminUserId);
      if (!raffle) {
        return res.status(404).json({ message: "Raffle not found" });
      }
      res.json(raffle);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.patch("/api/raffles/:id/reject", async (req, res) => {
    try {
      const { reason, restriction, adminUserId } = req.body;
      const raffle = await storage.rejectRaffle(req.params.id, reason, restriction, adminUserId);
      if (!raffle) {
        return res.status(404).json({ message: "Raffle not found" });
      }
      res.json(raffle);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  app2.patch("/api/admin/users/:userId/admin-level", async (req, res) => {
    const currentUserTelegramId = getKingAdminId();
    const currentUser = await storage.getUserByTelegramId(currentUserTelegramId);
    if (!currentUser) {
      return res.status(401).json({ error: "User not found" });
    }
    const { userId } = req.params;
    const { adminLevel } = req.body;
    if (currentUser.adminLevel !== 0) {
      console.warn(`SECURITY ALERT: Unauthorized admin level change attempt by ${currentUser.telegramId}`);
      return res.status(403).json({
        error: "Forbidden: Only King Admin can manage admin levels",
        userLevel: currentUser.adminLevel
      });
    }
    if (typeof adminLevel !== "number" || adminLevel < 0 || adminLevel > 2) {
      return res.status(400).json({ error: "Invalid admin level. Must be 0, 1, or 2" });
    }
    try {
      const updatedUser = await storage.secureAdminLevelChange(
        currentUser.telegramId,
        userId,
        adminLevel
      );
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found or operation denied" });
      }
      res.json({
        success: true,
        user: updatedUser,
        message: `Admin level changed to ${adminLevel}`
      });
    } catch (error) {
      console.error("Error changing admin level:", error);
      res.status(500).json({ error: "Internal server error" });
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
(async () => {
  const server = await registerRoutes(app);
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }
  if (process.env.BOT_TOKEN) {
    try {
      const { default: MembershipScheduler2 } = await Promise.resolve().then(() => (init_membershipScheduler(), membershipScheduler_exports));
      const scheduler = new MembershipScheduler2(process.env.BOT_TOKEN);
      scheduler.start();
      console.log("\u2705 Membership scheduler started successfully");
    } catch (error) {
      console.error("\u274C Failed to start membership scheduler:", error);
    }
  } else {
    console.warn("\u26A0\uFE0F BOT_TOKEN not configured - Membership checking disabled");
  }
  const port = Number(process.env.PORT) || 5e3;
  server.listen(port, "0.0.0.0", () => {
    console.log(`\u{1F680} Server running on port ${port}`);
  });
})();
