import { 
  type User, 
  type InsertUser, 
  type UpsertUser,
  type Raffle, 
  type InsertRaffle,
  type SponsorChannel,
  type InsertSponsorChannel,
  type UserSeenRaffle,
  type RaffleParticipant,
  type BotConfig,
  type InsertBotConfig,
  users,
  raffles,
  sponsorChannels,
  userSeenRaffles,
  raffleParticipants,
  userSponsorMemberships,
  botConfig,
  KING_ADMIN_TELEGRAM_ID,
  isKingAdmin,
  getKingAdminId
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lte, inArray, asc, desc, max, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getUsersByType(userType: string): Promise<User[]>;
  updateUserRole(userId: string, newRole: string): Promise<User | undefined>;
  updateUserLevel(userId: string, newLevel: number): Promise<User | undefined>;
  isUserAdmin(telegramId: string): Promise<boolean>;
  
  // Raffle operations
  getRaffle(id: string): Promise<Raffle | undefined>;
  getAllRaffles(): Promise<Raffle[]>;
  getRafflesByStatus(status: string): Promise<Raffle[]>;
  getRafflesByLevelAndStatus(maxLevel: number, status: string): Promise<Raffle[]>;
  createRaffle(raffle: InsertRaffle): Promise<Raffle>;
  updateRaffle(id: string, updates: Partial<Raffle>): Promise<Raffle | undefined>;
  getRafflesBySubmitter(submitterId: string): Promise<Raffle[]>;
  approveRaffleWithLevel(id: string, levelRequired: number, adminUserId: string): Promise<Raffle | undefined>;
  rejectRaffle(id: string, reason: string, restriction: any, adminUserId: string): Promise<Raffle | undefined>;
  getTodaysRaffles(userLevel: number): Promise<Raffle[]>;
  getEndedRaffles(userLevel: number): Promise<Raffle[]>;
  deleteRaffle(id: string): Promise<boolean>;
  bulkDeleteRafflesByStatus(status: string): Promise<number>;
  
  // Sponsor channel operations
  getSponsorChannels(): Promise<SponsorChannel[]>;
  createSponsorChannel(channel: InsertSponsorChannel): Promise<SponsorChannel>;
  deleteSponsorChannel(id: string): Promise<void>;
  updateSponsorChannel(id: string, updates: Partial<SponsorChannel>): Promise<SponsorChannel | undefined>;
  reorderSponsorChannels(channelOrders: { id: string; displayOrder: number }[]): Promise<void>;
  joinSponsorChannel(userId: string, channelId: string): Promise<{ pointsEarned: number }>;
  
  // User interactions
  markRaffleSeen(userId: string, raffleId: string): Promise<void>;
  joinRaffle(userId: string, raffleId: string): Promise<void>;
  hasUserJoinedRaffle(userId: string, raffleId: string): Promise<boolean>;
  getUserSeenRaffles(userId: string): Promise<string[]>;
  getUserJoinedRaffles(userId: string): Promise<string[]>;
  
  // Admin operations
  getAdminUsers(): Promise<User[]>;
  getAdminStats(): Promise<{
    pendingRaffles: number;
    approvedRaffles: number;
    rejectedRaffles: number;
    totalUsers: number;
  }>;
  
  // User stats
  getUserStats(userId: string): Promise<{
    referralCount: number;
    totalPoints: number;
    levelProgress: number;
    nextLevelPoints: number;
  }>;
  
  // Points and referrals
  addPoints(userId: string, points: number): Promise<void>;
  updateUserLevelByPoints(userId: string): Promise<void>;
  
  // Bot configuration
  getBotConfig(): Promise<BotConfig | undefined>;
  setBotConfig(config: InsertBotConfig): Promise<BotConfig>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize sample data if needed in development
    if (process.env.NODE_ENV === "development") {
      this.initializeSampleData();
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // SECURITY: Admin level protection layer
    if (userData.telegramId) {
      const existingUser = await this.getUserByTelegramId(userData.telegramId);
      
      // If user exists, protect admin levels from unauthorized changes
      if (existingUser && existingUser.userType === 'bot_admin') {
        // CRITICAL SECURITY: King Admin must ALWAYS remain level 0
        if (isKingAdmin(userData.telegramId)) {
          userData.adminLevel = 0; // Force King level - NEVER change this
          userData.userType = "bot_admin"; // Force bot_admin type
        }
        // Other admins: preserve their existing admin level unless explicitly authorized
        else if (existingUser.adminLevel !== undefined) {
          userData.adminLevel = existingUser.adminLevel; // Preserve existing admin level
        }
      }
    }
    
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: userData.telegramId ? users.telegramId : users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    // SECURITY: Admin level protection - prevent unauthorized admin level changes
    const existingUser = await this.getUser(id);
    if (existingUser && existingUser.userType === 'bot_admin') {
      // CRITICAL SECURITY: King Admin protection
      if (existingUser.telegramId && isKingAdmin(existingUser.telegramId)) {
        // King Admin CANNOT have their admin level or user type changed
        delete updates.adminLevel;
        delete updates.userType;
        // Log security attempt for monitoring
        console.warn(`SECURITY ALERT: Attempt to modify King Admin ${existingUser.telegramId} blocked`);
      }
      // Other bot_admin protection - only allow authorized changes
      else if ('adminLevel' in updates || 'userType' in updates) {
        // Only allow admin level changes through specific authorized methods
        console.warn(`SECURITY ALERT: Attempt to modify admin levels for ${existingUser.telegramId} blocked`);
        delete updates.adminLevel;
        delete updates.userType;
      }
    }
    
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getUsersByType(userType: string): Promise<User[]> {
    // For bot_admin users, order by createdAt DESC to show newest admins first
    if (userType === 'bot_admin') {
      return await db
        .select()
        .from(users)
        .where(eq(users.userType, userType as any))
        .orderBy(desc(users.createdAt));
    }
    
    // For other user types, keep default ordering
    return await db.select().from(users).where(eq(users.userType, userType as any));
  }

  // Raffle operations
  async getRaffle(id: string): Promise<Raffle | undefined> {
    const [raffle] = await db.select().from(raffles).where(eq(raffles.id, id));
    return raffle || undefined;
  }

  async getAllRaffles(): Promise<any[]> {
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
        username: users.username,
        level: users.level,
      },
    })
    .from(raffles)
    .leftJoin(users, eq(raffles.submitterId, users.id));
  }

  async getRafflesByStatus(status: string): Promise<any[]> {
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
        username: users.username,
        level: users.level,
      },
    })
    .from(raffles)
    .leftJoin(users, eq(raffles.submitterId, users.id))
    .where(eq(raffles.status, status as any));

    // Apply different ordering based on status
    if (status === 'pending') {
      // For pending: oldest submissions first (FIFO for fair review)
      return await query.orderBy(asc(raffles.createdAt));
    } else if (status === 'approved' || status === 'rejected') {
      // For approved/rejected: newest decisions first (recent admin actions first)
      return await query.orderBy(desc(raffles.updatedAt));
    } else {
      // Default ordering for any other status
      return await query.orderBy(desc(raffles.createdAt));
    }
  }

  async getRafflesByLevelAndStatus(maxLevel: number, status: string): Promise<Raffle[]> {
    return await db.select().from(raffles).where(
      and(
        lte(raffles.levelRequired, maxLevel),
        eq(raffles.status, status as any)
      )
    );
  }

  async updateUserRole(userId: string, newRole: string): Promise<User | undefined> {
    // SECURITY: Only allow role changes through proper admin authorization
    const existingUser = await this.getUser(userId);
    
    if (existingUser && existingUser.telegramId && isKingAdmin(existingUser.telegramId)) {
      console.warn(`SECURITY ALERT: Attempt to modify King Admin role blocked`);
      return existingUser; // Return unchanged - King can never change role
    }
    
    // Log all role change attempts for security monitoring
    console.log(`Admin role change: ${existingUser?.telegramId} -> ${newRole}`);
    
    return await this.updateUser(userId, { userType: newRole as any });
  }

  async updateUserLevel(userId: string, newLevel: number): Promise<User | undefined> {
    // SECURITY NOTE: This is for user progression levels, NOT admin levels
    // Admin levels (adminLevel) are protected separately
    return await this.updateUser(userId, { level: newLevel });
  }

  async approveRaffleWithLevel(id: string, levelRequired: number, adminUserId: string): Promise<Raffle | undefined> {
    return await this.updateRaffle(id, { 
      status: "approved" as any, 
      levelRequired,
      reviewerId: adminUserId
    });
  }

  async rejectRaffle(id: string, reason: string, restriction: any, adminUserId: string): Promise<Raffle | undefined> {
    const updates: any = { 
      status: "rejected" as any, 
      rejectionReason: reason,
      reviewerId: adminUserId
    };

    // Handle user restriction if specified
    if (restriction.type !== "none") {
      const raffle = await this.getRaffle(id);
      if (raffle?.submitterId) {
        const userUpdates: any = { isRestricted: true, restrictionReason: reason };
        
        if (restriction.type === "temporary" && restriction.endDate) {
          userUpdates.restrictionStart = new Date();
          userUpdates.restrictionEnd = new Date(restriction.endDate);
        } else if (restriction.type === "permanent") {
          userUpdates.restrictionStart = new Date();
          userUpdates.restrictionEnd = null;
        }
        
        await this.updateUser(raffle.submitterId, userUpdates);
      }
    }

    return await this.updateRaffle(id, updates);
  }

  async getTodaysRaffles(userLevel: number): Promise<Raffle[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await db.select().from(raffles).where(
      and(
        lte(raffles.levelRequired, userLevel),
        eq(raffles.status, "approved" as any),
        lte(raffles.raffleDateTime, tomorrow)
      )
    );
  }

  async getEndedRaffles(userLevel: number): Promise<Raffle[]> {
    const now = new Date();
    
    return await db.select().from(raffles).where(
      and(
        lte(raffles.levelRequired, userLevel),
        eq(raffles.status, "approved" as any),
        lte(raffles.raffleDateTime, now)
      )
    );
  }

  async createRaffle(raffle: InsertRaffle): Promise<Raffle> {
    // محاسبه شماره درخواست بعدی برای کل سیستم
    const allRaffles = await db.select({ requestNumber: raffles.requestNumber })
      .from(raffles)
      .orderBy(raffles.requestNumber);
    
    const nextRequestNumber = allRaffles.length > 0 
      ? Math.max(...allRaffles.map(r => r.requestNumber)) + 1 
      : 1;

    const raffleWithRequestNumber = {
      ...raffle,
      requestNumber: nextRequestNumber
    };

    const [newRaffle] = await db.insert(raffles).values(raffleWithRequestNumber).returning();
    return newRaffle;
  }

  async updateRaffle(id: string, updates: Partial<Raffle>): Promise<Raffle | undefined> {
    const [raffle] = await db
      .update(raffles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(raffles.id, id))
      .returning();
    return raffle || undefined;
  }

  async getRafflesBySubmitter(submitterId: string): Promise<any[]> {
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
        username: users.username,
      },
    })
    .from(raffles)
    .leftJoin(users, eq(raffles.submitterId, users.id))
    .where(eq(raffles.submitterId, submitterId));
  }

  // Sponsor channel operations
  async getSponsorChannels(): Promise<SponsorChannel[]> {
    // Order by displayOrder first (for custom admin ordering), then by newest first (createdAt DESC)
    return await db.select()
      .from(sponsorChannels)
      .where(eq(sponsorChannels.isActive, true))
      .orderBy(desc(sponsorChannels.displayOrder), desc(sponsorChannels.createdAt));
  }

  async createSponsorChannel(channel: InsertSponsorChannel): Promise<SponsorChannel> {
    // Get the highest displayOrder and increment it for new channels
    const maxOrderResult = await db.select({ maxOrder: max(sponsorChannels.displayOrder) })
      .from(sponsorChannels)
      .where(eq(sponsorChannels.isActive, true));
    
    const nextOrder = (maxOrderResult[0]?.maxOrder || 0) + 1;
    
    const [newChannel] = await db.insert(sponsorChannels).values({
      channelId: channel.channelId!,
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

  async deleteSponsorChannel(id: string): Promise<void> {
    await db.update(sponsorChannels)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(sponsorChannels.id, id));
  }

  async updateSponsorChannel(id: string, updates: Partial<SponsorChannel>): Promise<SponsorChannel | undefined> {
    const [updatedChannel] = await db
      .update(sponsorChannels)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sponsorChannels.id, id))
      .returning();
    return updatedChannel;
  }

  async reorderSponsorChannels(channelOrders: { id: string; displayOrder: number }[]): Promise<void> {
    // Batch update the display order for multiple channels (for drag & drop)
    for (const { id, displayOrder } of channelOrders) {
      await db.update(sponsorChannels)
        .set({ displayOrder, updatedAt: new Date() })
        .where(eq(sponsorChannels.id, id));
    }
  }

  // User interactions
  async markRaffleSeen(userId: string, raffleId: string): Promise<void> {
    await db.insert(userSeenRaffles).values({
      userId,
      raffleId,
      seenAt: new Date()
    }).onConflictDoNothing();
  }

  async joinRaffle(userId: string, raffleId: string): Promise<void> {
    await db.insert(raffleParticipants).values({
      userId,
      raffleId,
      joinedAt: new Date()
    }).onConflictDoNothing();
  }

  async hasUserJoinedRaffle(userId: string, raffleId: string): Promise<boolean> {
    const [participant] = await db
      .select()
      .from(raffleParticipants)
      .where(and(
        eq(raffleParticipants.userId, userId),
        eq(raffleParticipants.raffleId, raffleId)
      ));
    return !!participant;
  }

  async getUserSeenRaffles(userId: string): Promise<string[]> {
    const seen = await db
      .select({ raffleId: userSeenRaffles.raffleId })
      .from(userSeenRaffles)
      .where(eq(userSeenRaffles.userId, userId));
    return seen.map(s => s.raffleId);
  }

  async getUserJoinedRaffles(userId: string): Promise<string[]> {
    const joined = await db
      .select({ raffleId: raffleParticipants.raffleId })
      .from(raffleParticipants)
      .where(eq(raffleParticipants.userId, userId));
    return joined.map(j => j.raffleId);
  }

  // Points and referrals
  async addPoints(userId: string, points: number): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      await this.updateUser(userId, { points: user.points + points });
      await this.updateUserLevelByPoints(userId);
    }
  }

  async updateUserLevelByPoints(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      // Level calculation: 1000 points per level
      const newLevel = Math.floor(user.points / 1000) + 1;
      if (newLevel !== user.level) {
        await this.updateUser(userId, { level: newLevel });
      }
    }
  }

  // Missing methods implementation
  async joinSponsorChannel(userId: string, channelId: string): Promise<{ pointsEarned: number }> {
    // Check if already joined
    const existing = await db
      .select()
      .from(userSponsorMemberships)
      .where(and(
        eq(userSponsorMemberships.userId, userId),
        eq(userSponsorMemberships.channelId, channelId)
      ));
    
    if (existing.length > 0) {
      return { pointsEarned: 0 };
    }
    
    // Get channel info for points
    const channel = await this.getSponsorChannels();
    const targetChannel = channel.find(c => c.id === channelId);
    const pointsEarned = targetChannel?.pointsReward || 100;
    
    // Add membership and points
    await db.insert(userSponsorMemberships).values({
      userId,
      channelId,
      pointsEarned
    });
    
    await this.addPoints(userId, pointsEarned);
    
    return { pointsEarned };
  }

  async getAdminUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.userType, 'bot_admin'));
  }

  async getAdminStats(): Promise<{
    pendingRaffles: number;
    approvedRaffles: number;
    rejectedRaffles: number;
    totalUsers: number;
  }> {
    const [pending, approved, rejected, total] = await Promise.all([
      db.select().from(raffles).where(eq(raffles.status, 'pending')),
      db.select().from(raffles).where(eq(raffles.status, 'approved')), 
      db.select().from(raffles).where(eq(raffles.status, 'rejected')),
      db.select().from(users)
    ]);
    
    return {
      pendingRaffles: pending.length,
      approvedRaffles: approved.length,
      rejectedRaffles: rejected.length,
      totalUsers: total.length
    };
  }

  async getUserStats(userId: string): Promise<{
    referralCount: number;
    totalPoints: number;
    levelProgress: number;
    nextLevelPoints: number;
  }> {
    const user = await this.getUser(userId);
    if (!user) {
      return {
        referralCount: 0,
        totalPoints: 0,
        levelProgress: 0,
        nextLevelPoints: 100
      };
    }
    
    const referrals = await db.select().from(users).where(eq(users.referrerId, userId));
    
    // Calculate next level points
    const currentPoints = user.points;
    const currentLevel = user.level;
    let nextLevelPoints = 100;
    
    if (currentLevel === 1) nextLevelPoints = 100;
    else if (currentLevel === 2) nextLevelPoints = 200;
    else if (currentLevel === 3) nextLevelPoints = 500;
    else if (currentLevel === 4) nextLevelPoints = 1000;
    else nextLevelPoints = 2000;
    
    const progress = Math.min(100, (currentPoints / nextLevelPoints) * 100);
    
    return {
      referralCount: referrals.length,
      totalPoints: currentPoints,
      levelProgress: progress,
      nextLevelPoints: nextLevelPoints - currentPoints
    };
  }

  // Bot configuration
  async getBotConfig(): Promise<BotConfig | undefined> {
    const [config] = await db.select().from(botConfig).where(eq(botConfig.isActive, true));
    return config || undefined;
  }

  async setBotConfig(config: InsertBotConfig): Promise<BotConfig> {
    // Deactivate all existing configs
    await db.update(botConfig).set({ isActive: false });
    
    // Insert new config
    const [newConfig] = await db.insert(botConfig).values({
      ...config,
      isActive: true
    }).returning();
    return newConfig;
  }

  // User sponsor membership methods
  async getUserSponsorMemberships(userId: string): Promise<any[]> {
    return await db
      .select({
        channelId: userSponsorMemberships.channelId,
        isMember: userSponsorMemberships.isMember,
        pointsEarned: userSponsorMemberships.pointsEarned,
        joinedAt: userSponsorMemberships.joinedAt,
        leftAt: userSponsorMemberships.leftAt,
        lastChecked: userSponsorMemberships.lastChecked,
        channelName: sponsorChannels.channelName,
        channelUrl: sponsorChannels.channelUrl,
        pointsReward: sponsorChannels.pointsReward
      })
      .from(userSponsorMemberships)
      .leftJoin(sponsorChannels, eq(userSponsorMemberships.channelId, sponsorChannels.channelId))
      .where(eq(userSponsorMemberships.userId, userId));
  }

  async getAvailableSponsorChannelsForUser(userId: string): Promise<any[]> {
    const allChannels = await this.getSponsorChannels();
    const userMemberships = await this.getUserSponsorMemberships(userId);
    
    const membershipMap = new Map(
      userMemberships.map(m => [m.channelId, m])
    );

    return allChannels.map(channel => ({
      ...channel,
      membership: membershipMap.get(channel.channelId) || null,
      isMember: membershipMap.get(channel.channelId)?.isMember || false
    }));
  }

  // Admin level management (keeping only one version)
  async secureAdminLevelChangeV1(currentUserTelegramId: string, targetUserId: string, newAdminLevel: number): Promise<any> {
    if (!isKingAdmin(currentUserTelegramId)) {
      throw new Error("Unauthorized: Only King Admin can change admin levels");
    }
    return await this.updateUser(targetUserId, { adminLevel: newAdminLevel });
  }

  // User channel membership methods for Telegram bot integration
  async updateUserChannelMembership(
    userId: string,
    channelId: string,
    isMember: boolean,
    pointsEarned: number = 0
  ): Promise<any> {
    // Check if membership record exists
    const existing = await db
      .select()
      .from(userSponsorMemberships)
      .where(and(
        eq(userSponsorMemberships.userId, userId),
        eq(userSponsorMemberships.channelId, channelId)
      ));

    if (existing.length > 0) {
      // Update existing membership (don't update userId, channelId, or createdAt)
      const updateData = {
        isMember,
        pointsEarned: existing[0].pointsEarned + pointsEarned,
        lastChecked: new Date(),
        updatedAt: new Date(),
        checkCount: (existing[0].checkCount || 0) + 1,
        ...(isMember ? { joinedAt: new Date() } : { leftAt: new Date() })
      };
      
      const [updated] = await db
        .update(userSponsorMemberships)
        .set(updateData)
        .where(and(
          eq(userSponsorMemberships.userId, userId),
          eq(userSponsorMemberships.channelId, channelId)
        ))
        .returning();
      return updated;
    } else {
      // Create new membership record (includes all required fields)
      const createData = {
        userId,
        channelId,
        isMember,
        pointsEarned,
        lastChecked: new Date(),
        checkCount: 1,
        ...(isMember ? { joinedAt: new Date() } : { leftAt: new Date() })
      };
      
      const [created] = await db
        .insert(userSponsorMemberships)
        .values(createData)
        .returning();
      return created;
    }
  }

  // Update sponsor channel bot access status
  async updateSponsorChannelBotAccess(channelId: string, hasAccess: boolean): Promise<void> {
    await db
      .update(sponsorChannels)
      .set({ 
        botHasAccess: hasAccess,
        lastAccessCheck: new Date()
      })
      .where(eq(sponsorChannels.channelId, channelId));
  }

  // Get all users (for bulk membership checks)
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Helper method to check if user is admin based on Telegram ID
  async isUserAdmin(telegramId: string): Promise<boolean> {
    try {
      // SECURITY: King Admin is always admin regardless of database state
      if (isKingAdmin(telegramId)) {
        return true;
      }
      
      const user = await this.getUserByTelegramId(telegramId);
      return user ? (user.userType === 'bot_admin') : false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      // Fallback - only the King Admin (NO environment override)
      return isKingAdmin(telegramId);
    }
  }

  // Check if user is King admin (highest level) - NO environment override allowed
  async isUserKing(telegramId: string): Promise<boolean> {
    return isKingAdmin(telegramId);
  }

  // ADMIN MANAGEMENT: Update database trigger with current King Admin ID
  async updateDatabaseTriggerForKingAdmin(): Promise<void> {
    try {
      // Update trigger function with current King Admin ID
      const kingAdminId = getKingAdminId();
      
      // Protection trigger for existing King Admin
      await db.execute(sql`
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
      
      // Anti-bypass trigger to prevent multiple King Admins
      await db.execute(sql`
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
      console.error('Error updating database trigger:', error);
    }
  }

  // SECURITY METHOD: Only King Admin can promote/demote other admins
  async secureAdminLevelChange(requesterId: string, targetUserId: string, newAdminLevel: number): Promise<User | undefined> {
    const requester = await this.getUserByTelegramId(requesterId);
    
    // Only King Admin (level 0) can change admin levels
    if (!requester || requester.adminLevel !== 0) {
      console.warn(`SECURITY ALERT: Unauthorized admin level change attempt by ${requesterId}`);
      return undefined;
    }
    
    const targetUser = await this.getUser(targetUserId);
    if (!targetUser) {
      return undefined;
    }
    
    // CRITICAL: King Admin cannot be demoted
    if (targetUser.telegramId && isKingAdmin(targetUser.telegramId)) {
      console.warn(`SECURITY ALERT: Attempt to modify King Admin level by ${requesterId} blocked`);
      return targetUser;
    }
    
    // Log security operation
    console.log(`SECURITY: King Admin ${requesterId} changing admin level for ${targetUser.telegramId}: ${targetUser.adminLevel} -> ${newAdminLevel}`);
    
    // Direct database update bypassing normal protections (only for King Admin)
    const [user] = await db
      .update(users)
      .set({ 
        adminLevel: newAdminLevel,
        userType: newAdminLevel < 2 ? 'bot_admin' : 'regular',
        updatedAt: new Date() 
      })
      .where(eq(users.id, targetUserId))
      .returning();
    
    return user || undefined;
  }

  // Get admin level for a user
  async getAdminLevel(telegramId: string): Promise<number | null> {
    try {
      // Check if user is King first
      if (await this.isUserKing(telegramId)) {
        return 0; // King level
      }
      
      const user = await this.getUserByTelegramId(telegramId);
      if (user && user.userType === 'bot_admin') {
        return user.adminLevel || 1;
      }
      
      return null; // Not an admin
    } catch (error) {
      console.error('Error getting admin level:', error);
      return null;
    }
  }

  // Approve raffle (alternate implementation)
  async approveRaffleSimple(raffleId: string, level: number): Promise<Raffle> {
    const [updatedRaffle] = await db.update(raffles)
      .set({ 
        status: 'approved',
        levelRequired: level,
        updatedAt: new Date()
      })
      .where(eq(raffles.id, raffleId))
      .returning();
    
    if (!updatedRaffle) {
      throw new Error('Raffle not found');
    }
    
    return updatedRaffle;
  }

  // Reject raffle (alternate implementation)
  async rejectRaffleSimple(raffleId: string, reason?: string): Promise<Raffle> {
    const [updatedRaffle] = await db.update(raffles)
      .set({ 
        status: 'rejected',
        rejectionReason: reason,
        updatedAt: new Date()
      })
      .where(eq(raffles.id, raffleId))
      .returning();
    
    if (!updatedRaffle) {
      throw new Error('Raffle not found');
    }
    
    return updatedRaffle;
  }

  private async initializeSampleData() {
    try {
      // Check if sample data already exists
      const existingChannels = await this.getSponsorChannels();
      if (existingChannels.length > 0) {
        return; // Sample data already exists
      }

      // Add sample sponsor channels
      await this.createSponsorChannel({
        channelId: "-1001234567890",
        channelName: "تلگرام فارسی",
        channelUrl: "https://t.me/telegram_farsi",
        pointsReward: 100,
        isSpecial: false
      });

      await this.createSponsorChannel({
        channelId: "-1001234567891",
        channelName: "اخبار فناوری ایران",
        channelUrl: "https://t.me/tech_news_ir",
        pointsReward: 150,
        isSpecial: false
      });

      // Add sample raffles
      const now = new Date();
      const futureDate1 = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      const futureDate2 = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now

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
        submitterId: "admin",
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
        submitterId: "admin",
      });

    } catch (error) {
      console.error("Error initializing sample data:", error);
    }
  }

  async deleteRaffle(id: string): Promise<boolean> {
    try {
      console.log(`Attempting to delete raffle with id: ${id}`);
      
      // First check if raffle exists
      const existingRaffle = await this.getRaffle(id);
      console.log(`Existing raffle:`, existingRaffle);
      
      if (!existingRaffle) {
        console.log(`Raffle with id ${id} not found`);
        return false;
      }
      
      // Delete related data first to maintain referential integrity
      console.log(`Deleting related data for raffle ${id}...`);
      
      // Delete participants
      const participantsDeleteResult = await db.delete(raffleParticipants).where(eq(raffleParticipants.raffleId, id));
      console.log(`Deleted ${participantsDeleteResult.rowCount || 0} participants`);
      
      // Delete seen records
      const seenDeleteResult = await db.delete(userSeenRaffles).where(eq(userSeenRaffles.raffleId, id));
      console.log(`Deleted ${seenDeleteResult.rowCount || 0} seen records`);
      
      // Finally delete the raffle itself
      const result = await db.delete(raffles).where(eq(raffles.id, id));
      console.log(`Delete result:`, result);
      
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Delete raffle error:", error);
      return false;
    }
  }

  async bulkDeleteRafflesByStatus(status: string): Promise<number> {
    try {
      console.log(`Attempting to bulk delete raffles with status: ${status}`);
      
      // First, check how many raffles exist with this status
      const existingRaffles = await db.select().from(raffles).where(eq(raffles.status, status as any));
      console.log(`Found ${existingRaffles.length} raffles with status ${status}`);
      
      if (existingRaffles.length === 0) {
        return 0;
      }
      
      // Get all raffle IDs to delete related data
      const raffleIds = existingRaffles.map(raffle => raffle.id);
      console.log(`Deleting related data for ${raffleIds.length} raffles...`);
      
      // Delete participants for all raffles
      const participantsDeleteResult = await db.delete(raffleParticipants)
        .where(inArray(raffleParticipants.raffleId, raffleIds));
      console.log(`Deleted ${participantsDeleteResult.rowCount || 0} participants`);
      
      // Delete seen records for all raffles
      const seenDeleteResult = await db.delete(userSeenRaffles)
        .where(inArray(userSeenRaffles.raffleId, raffleIds));
      console.log(`Deleted ${seenDeleteResult.rowCount || 0} seen records`);
      
      // Finally delete all raffles
      const result = await db.delete(raffles).where(eq(raffles.status, status as any));
      console.log(`Delete result:`, result);
      
      return result.rowCount || existingRaffles.length;
    } catch (error) {
      console.error("Bulk delete raffles error:", error);
      return 0;
    }
  }
}

export const storage = new DatabaseStorage();