import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 👑 KING ADMIN CONFIGURATION - Change this ID to transfer King Admin privileges
export const KING_ADMIN_TELEGRAM_ID = "128787773";

// You can change the above constant to any Telegram ID to make that user the new King Admin
// Example: export const KING_ADMIN_TELEGRAM_ID = "YOUR_NEW_TELEGRAM_ID_HERE";

// 🔧 HELPER FUNCTIONS for King Admin checks (always use these instead of hardcoding)
export const isKingAdmin = (telegramId: string): boolean => {
  return telegramId === KING_ADMIN_TELEGRAM_ID;
};

export const getKingAdminId = (): string => {
  return KING_ADMIN_TELEGRAM_ID;
};

// 📝 IMPORTANT: Always use these helper functions instead of direct string comparisons
// ✅ CORRECT: isKingAdmin(userTelegramId)
// ❌ WRONG: userTelegramId === "128787773"

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Telegram authentication fields
  telegramId: varchar("telegram_id").unique(), // Optional for non-Telegram users
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  // Gmail authentication fields
  email: varchar("email").unique(), // Optional for Telegram-only users
  profileImageUrl: varchar("profile_image_url"),
  // Authentication method tracking
  authMethod: text("auth_method", { enum: ["telegram", "gmail", "guest"] }).notNull().default("telegram"),
  // User management
  userType: text("user_type", { enum: ["bot_admin", "regular"] }).notNull().default("regular"),
  adminLevel: integer("admin_level").default(1), // 0 = King 👑, 1 = Level 1 Admin, 2 = Level 2 Admin (limited)
  points: integer("points").notNull().default(0),
  level: integer("level").notNull().default(1), // سطح کاربر برای دسترسی به قرعه‌کشی‌ها
  referralCode: varchar("referral_code").unique(),
  referrerId: varchar("referrer_id"),
  referralReward: integer("referral_reward").notNull().default(50), // امتیاز دعوت دوستان
  isSponsorMember: boolean("is_sponsor_member").notNull().default(false),
  isRestricted: boolean("is_restricted").notNull().default(false),
  restrictionStart: timestamp("restriction_start"),
  restrictionEnd: timestamp("restriction_end"),
  restrictionReason: text("restriction_reason"),
  submissionCount: integer("submission_count").notNull().default(0),
  lastSubmissionAt: timestamp("last_submission_at"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bot configuration table
export const botConfig = pgTable("bot_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botToken: text("bot_token").notNull(),
  botUsername: text("bot_username").notNull(),
  startLink: text("start_link").notNull(), // Deep link to start bot
  adminTelegramIds: text("admin_telegram_ids").array().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const raffles = pgTable("raffles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull(), // Channel ID from forwarded message
  messageId: varchar("message_id").notNull(), // Original message ID from channel
  forwardedMessageId: varchar("forwarded_message_id"), // Forwarded message ID in bot
  requestNumber: integer("request_number").notNull(), // شماره درخواست برای هر کاربر
  prizeType: text("prize_type", { enum: ["stars", "premium", "mixed"] }).notNull(),
  prizeValue: integer("prize_value"), // Number of stars or months of premium
  requiredChannels: text("required_channels").array().notNull(), // Array of channel IDs required to join
  raffleDateTime: timestamp("raffle_datetime").notNull(),
  levelRequired: integer("level_required").notNull().default(1),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  submitterId: varchar("submitter_id").notNull(), // User ID who submitted the raffle
  reviewerId: varchar("reviewer_id"), // Admin who reviewed the raffle
  rejectionReason: text("rejection_reason"),
  participantCount: integer("participant_count").notNull().default(0),
  version: integer("version").notNull().default(1), // Version tracking for edits
  originalData: jsonb("original_data"), // Store original submission for version history
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userSeenRaffles = pgTable("user_seen_raffles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  raffleId: varchar("raffle_id").notNull(),
  seenAt: timestamp("seen_at").defaultNow(),
});

export const raffleParticipants = pgTable("raffle_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  raffleId: varchar("raffle_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const sponsorChannels = pgTable("sponsor_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull().unique(), // Telegram Channel ID (-100xxxxxx)
  channelUsername: varchar("channel_username"), // @channelname (اختیاری)
  channelName: text("channel_name").notNull(),
  channelUrl: text("channel_url").notNull(),
  description: text("description"),
  pointsReward: integer("points_reward").notNull().default(100), // امتیاز عضویت در کانال
  isSpecial: boolean("is_special").notNull().default(false), // کانال ویژه
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0), // ترتیب نمایش کانال‌ها (قابل تغییر با drag & drop)
  botHasAccess: boolean("bot_has_access").notNull().default(false), // آیا ربات در کانال ادمین است
  lastAccessCheck: timestamp("last_access_check"), // آخرین بار چک دسترسی
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User membership in sponsor channels - Enhanced for real-time tracking
export const userSponsorMemberships = pgTable("user_sponsor_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  channelId: varchar("channel_id").notNull(), // Reference to sponsorChannels.channelId
  isMember: boolean("is_member").notNull().default(false), // وضعیت فعلی عضویت
  pointsEarned: integer("points_earned").notNull().default(0),
  joinedAt: timestamp("joined_at"), // زمان عضویت
  leftAt: timestamp("left_at"), // زمان ترک کانال
  lastChecked: timestamp("last_checked").defaultNow(), // آخرین بار چک شده
  checkCount: integer("check_count").notNull().default(0), // تعداد بار چک شده
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Referral tracking
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull(), // User who shared the referral link
  referredId: varchar("referred_id").notNull(), // User who joined via referral
  pointsEarned: integer("points_earned").notNull().default(50),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin action logs
export const adminActions = pgTable("admin_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull(),
  action: text("action").notNull(), // approve_raffle, reject_raffle, restrict_user, etc.
  targetType: text("target_type").notNull(), // raffle, user, channel
  targetId: varchar("target_id").notNull(),
  details: jsonb("details"), // Additional action details
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
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
  referrerId: true,
});

// Upsert user schema for authentication
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  telegramId: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  authMethod: true,
  userType: true,
  adminLevel: true,
});

export const insertBotConfigSchema = createInsertSchema(botConfig).pick({
  botToken: true,
  botUsername: true,
  startLink: true,
  adminTelegramIds: true,
});

export const insertRaffleSchema = createInsertSchema(raffles).pick({
  channelId: true,
  messageId: true,
  forwardedMessageId: true,
  requestNumber: true,
  prizeType: true,
  prizeValue: true,
  requiredChannels: true,
  raffleDateTime: true,
  levelRequired: true,
  submitterId: true,
}).extend({
  raffleDateTime: z.union([
    z.string().transform((str) => new Date(str)),
    z.date()
  ])
});

export const insertSponsorChannelSchema = createInsertSchema(sponsorChannels).pick({
  channelId: true,
  channelUsername: true,
  channelName: true,
  channelUrl: true,
  description: true,
  pointsReward: true,
  isSpecial: true,
}).extend({
  channelId: z.string()
    .min(1, "شناسه کانال الزامی است")
    .refine((id) => {
      // Channel ID must start with @ and contain only 0-9, a-z, @, _ with minimum 5 chars after @
      if (!id.startsWith('@')) return false;
      const usernamePartLength = id.length - 1; // exclude @
      if (usernamePartLength < 5) return false;
      return /^@[0-9a-z_]+$/.test(id);
    }, "شناسه کانال باید با @ شروع شود، فقط شامل 0-9، a-z، _ باشد و حداقل 5 کاراکتر بعد از @ داشته باشد"),
  channelUrl: z.string()
    .min(1, "آدرس کانال الزامی است")
    .refine((url) => {
      return url.startsWith('https://') || url.startsWith('http://');
    }, "آدرس کانال باید با https:// یا http:// شروع شود"),
});

export const updateSponsorChannelSchema = createInsertSchema(sponsorChannels).pick({
  channelId: true,
  channelUsername: true,
  channelName: true,
  channelUrl: true,
  description: true,
  pointsReward: true,
  isSpecial: true,
  botHasAccess: true,
}).extend({
  channelId: z.string()
    .min(1, "شناسه کانال الزامی است")
    .refine((id) => {
      // Channel ID must start with @ and contain only 0-9, a-z, @, _ with minimum 5 chars after @
      if (!id.startsWith('@')) return false;
      const usernamePartLength = id.length - 1; // exclude @
      if (usernamePartLength < 5) return false;
      return /^@[0-9a-z_]+$/.test(id);
    }, "شناسه کانال باید با @ شروع شود، فقط شامل 0-9، a-z، _ باشد و حداقل 5 کاراکتر بعد از @ داشته باشد")
    .optional(),
  channelUrl: z.string()
    .min(1, "آدرس کانال الزامی است")
    .refine((url) => {
      return url.startsWith('https://') || url.startsWith('http://');
    }, "آدرس کانال باید با https:// یا http:// شروع شود")
    .optional(),
}).partial();

export const insertUserSponsorMembershipSchema = createInsertSchema(userSponsorMemberships).pick({
  userId: true,
  channelId: true,
  isMember: true,
  pointsEarned: true,
  joinedAt: true,
  leftAt: true,
});

export const updateUserSponsorMembershipSchema = createInsertSchema(userSponsorMemberships).pick({
  isMember: true,
  pointsEarned: true,
  joinedAt: true,
  leftAt: true,
  lastChecked: true,
  checkCount: true,
}).partial();

export const insertReferralSchema = createInsertSchema(referrals).pick({
  referrerId: true,
  referredId: true,
  pointsEarned: true,
});

export const insertAdminActionSchema = createInsertSchema(adminActions).pick({
  adminId: true,
  action: true,
  targetType: true,
  targetId: true,
  details: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRaffle = z.infer<typeof insertRaffleSchema>;
export type Raffle = typeof raffles.$inferSelect;
export type InsertSponsorChannel = z.infer<typeof insertSponsorChannelSchema>;
export type SponsorChannel = typeof sponsorChannels.$inferSelect;
export type UserSeenRaffle = typeof userSeenRaffles.$inferSelect;
export type RaffleParticipant = typeof raffleParticipants.$inferSelect;
export type InsertBotConfig = z.infer<typeof insertBotConfigSchema>;
export type BotConfig = typeof botConfig.$inferSelect;
export type UserSponsorMembership = typeof userSponsorMemberships.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type AdminAction = typeof adminActions.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type InsertAdminAction = z.infer<typeof insertAdminActionSchema>;
