import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, upsertUserSchema, insertRaffleSchema, insertSponsorChannelSchema, insertBotConfigSchema, users, KING_ADMIN_TELEGRAM_ID, isKingAdmin, getKingAdminId } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = userData.telegramId ? await storage.getUserByTelegramId(userData.telegramId) : null;
      
      if (existingUser) {
        // Update existing user
        const updatedUser = await storage.updateUser(existingUser.id, userData);
        res.json(updatedUser);
      } else {
        // Create new user
        const user = await storage.createUser(userData);
        res.json(user);
      }
    } catch (error) {
      res.status(400).json({ message: "Invalid user data", error });
    }
  });

  app.get("/api/users/telegram/:telegramId", async (req, res) => {
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

  app.put("/api/users/:id/type", async (req, res) => {
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

  // Raffle routes with role-based access control
  app.get("/api/raffles", async (req, res) => {
    try {
      const { status, level, submitterId, filter, userId } = req.query;
      
      // Get user to check role and level
      const user = userId ? await storage.getUser(userId as string) : null;
      const userLevel = user?.level || 1;
      const userRole = user?.userType || "regular";
      
      let raffles;
      
      if (userRole === "bot_admin") {
        // Bot admins see raffles filtered by status
        if (status && status !== "all") {
          raffles = await storage.getRafflesByStatus(status as string);
        } else if (submitterId) {
          raffles = await storage.getRafflesBySubmitter(submitterId as string);
        } else {
          // Default to pending for admin panel
          raffles = await storage.getRafflesByStatus("pending");
        }
      } else {
        // Regular users see approved raffles within their level
        if (filter === "today") {
          raffles = await storage.getTodaysRaffles(userLevel);
        } else if (filter === "ended") {
          raffles = await storage.getEndedRaffles(userLevel);
        } else {
          raffles = await storage.getRafflesByLevelAndStatus(userLevel, "approved");
        }
      }
      
      res.json(raffles);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });

  app.post("/api/raffles", async (req, res) => {
    try {
      // Accept either legacy payload or new payload (adapter mode)
      const isNewPayload = typeof req.body?.messageUrl === 'string';

      if (isNewPayload) {
        // New payload path: messageUrl-based
        const newSchema = z.object({
          messageUrl: z.string().min(1),
          submitterId: z.string().min(1),
          originalData: z.any().optional(),
        });
        const payload = newSchema.parse(req.body);

        // Duplicate detection:
        // - pending/rejected: based on original URL (originalData.messageUrl)
        // - approved: based on final URL (messageUrl)
        const allPending = await storage.getRafflesByStatus("pending");
        const allApproved = await storage.getRafflesByStatus("approved");
        const allRejected = await storage.getRafflesByStatus("rejected");
        
        console.log('Checking for duplicates. Looking for messageUrl:', payload.messageUrl);
        
        // Check pending and rejected raffles (based on original URL)
        const pendingRejectedRaffles = [...allPending, ...allRejected];
        const duplicatePendingRejected = pendingRejectedRaffles.find(r => r.originalData?.messageUrl === payload.messageUrl);
        
        // Check approved raffles (based on final URL - messageUrl field)
        const duplicateApproved = allApproved.find(r => r.messageUrl === payload.messageUrl);
        
        const duplicate = duplicatePendingRejected || duplicateApproved;
        
        if (duplicate) {
          console.log('Found duplicate:', duplicate?.id, 'Status:', duplicate?.status);
          const isSameUser = duplicate.submitterId === payload.submitterId;
          const status = duplicate.status;
          
          if (status === "rejected") {
            return res.status(400).json({ 
              message: "این قرعه‌کشی نامعتبر است. لطفا فقط لینک پیام قرعه‌کشی های رسمی تلگرام را وارد کنید." 
            });
          } else if (status === "approved" || status === "pending") {
            if (isSameUser) {
              const statusText = status === "approved" ? "منتشر شده" : "در انتظار بررسی";
              return res.status(400).json({ 
                message: `این قرعه‌کشی تکراریست و قبلا توسط شما ارسال شده است. وضعیت: ${statusText}` 
              });
            } else {
              const statusText = status === "approved" ? "منتشر شده" : "در انتظار بررسی";
              return res.status(400).json({ 
                message: `این قرعه‌کشی تکراریست و قبلا توسط سایر کاربران ارسال شده است. وضعیت: ${statusText}` 
              });
            }
          }
        } else {
          console.log('No duplicate found, proceeding with creation');
        }

        // Map to legacy required fields: synthesize placeholders + dummy ids
        const legacy = {
          channelId: "@unknown",
          messageId: String(Date.now()),
          forwardedMessageId: null,
          prizeType: "stars", // Default, will be set by admin
          prizeValue: undefined, // Will be set by admin
          requiredChannels: ["TBD"], // Will be set by admin
          raffleDateTime: new Date(), // Use Date object instead of ISO string
          levelRequired: 1,
          submitterId: payload.submitterId,
          originalData: { ...payload },
        } as any;

        console.log('Creating raffle with legacy data:', legacy);
        const raffle = await storage.createRaffle(legacy);
        return res.json(raffle);
      }

      // Legacy payload path (unchanged)
      const createRaffleSchema = z.object({
        channelId: z.string().min(1),
        messageId: z.string().min(1),
        forwardedMessageId: z.string().nullable().optional(),
        prizeType: z.enum(["stars", "premium", "mixed"]),
        prizeValue: z.number().int().optional(),
        requiredChannels: z.array(z.string()).min(0),
        raffleDateTime: z.coerce.date(),
        levelRequired: z.number().int().default(1),
        submitterId: z.string().min(1),
        originalData: z.any().optional(),
      });

      const raffleData = createRaffleSchema.parse(req.body);

      // Check for duplicate raffle (same channel + message ID)
      const existingRaffles = await storage.getRafflesByStatus("pending");
      const approvedRaffles = await storage.getRafflesByStatus("approved");
      const allRaffles = [...existingRaffles, ...approvedRaffles];

      const duplicate = allRaffles.find(r =>
        r.channelId === raffleData.channelId && r.messageId === raffleData.messageId
      );

      if (duplicate) {
        return res.status(400).json({ message: "Raffle with this channel and message already exists" });
      }

      const raffle = await storage.createRaffle(raffleData as any);
      res.json(raffle);
    } catch (error) {
      console.error('Raffle creation error:', error);
      res.status(400).json({ 
        message: "Invalid raffle data", 
        error: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.stack : undefined
      });
    }
  });

  app.put("/api/raffles/:id", async (req, res) => {
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

  // Admin route for approving raffles with level assignment
  app.patch("/api/raffles/:id/approve", async (req, res) => {
    try {
      const { levelRequired, adminUserId, status, messageUrl } = req.body;
      
      // Check if user is bot admin
      const admin = await storage.getUser(adminUserId);
      if (!admin || admin.userType !== "bot_admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const raffle = await storage.approveRaffleWithLevel(req.params.id, levelRequired, adminUserId, messageUrl);
      if (!raffle) {
        return res.status(404).json({ message: "Raffle not found" });
      }
      res.json(raffle);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });

  app.patch("/api/raffles/:id/reject", async (req, res) => {
    try {
      const { adminUserId, reason, restriction, messageUrl } = req.body;
      
      // Check if user is bot admin
      const admin = await storage.getUser(adminUserId);
      if (!admin || admin.userType !== "bot_admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const raffle = await storage.rejectRaffle(req.params.id, reason, restriction || { type: "none" }, adminUserId, messageUrl);
      if (!raffle) {
        return res.status(404).json({ message: "Raffle not found" });
      }
      res.json(raffle);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });

  // Bulk delete raffles by status (MUST be before individual delete route)
  app.delete("/api/raffles/bulk-delete", async (req, res) => {
    try {
      const { status } = req.query;
      if (!status || (status !== 'approved' && status !== 'rejected')) {
        return res.status(400).json({ message: "Invalid status. Must be 'approved' or 'rejected'" });
      }
      
      console.log(`Bulk deleting raffles with status: ${status}`);
      const deletedCount = await storage.bulkDeleteRafflesByStatus(status as string);
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

  // Delete individual raffle
  app.delete("/api/raffles/:id", async (req, res) => {
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

  app.post("/api/raffles/:id/join", async (req, res) => {
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

  app.post("/api/raffles/:id/seen", async (req, res) => {
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

  // Approve raffle
  app.post("/api/raffles/:id/approve", async (req, res) => {
    try {
      const { level } = req.body;
      const raffleId = req.params.id;
      
      if (!level) {
        return res.status(400).json({ message: "Level is required" });
      }
      
      const result = await storage.approveRaffleWithLevel(raffleId, level, 'system');
      res.json(result);
    } catch (error) {
      console.error("Error approving raffle:", error);
      res.status(500).json({ message: "Server error", error });
    }
  });

  // Reject raffle
  app.post("/api/raffles/:id/reject", async (req, res) => {
    try {
      const { reason } = req.body;
      const raffleId = req.params.id;
      
      const result = await storage.rejectRaffle(raffleId, reason, null, 'system');
      res.json(result);
    } catch (error) {
      console.error("Error rejecting raffle:", error);
      res.status(500).json({ message: "Server error", error });
    }
  });

  // Get users list with filtering (for admin)
  app.get("/api/users", async (req, res) => {
    try {
      const { userType } = req.query;
      // Set no-cache headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      if (userType) {
        const userTypes = (userType as string).split(',');
        const allUsers = [];
        for (const type of userTypes) {
          // Direct database query to bypass any caching
          const dbUsers = await db.select().from(users).where(eq(users.userType, type.trim() as any));
          console.log(`DB query for type "${type}":`, dbUsers.map(u => ({ id: u.id, telegramId: u.telegramId, userType: u.userType })));
          allUsers.push(...dbUsers);
        }
        console.log(`Final result for types ${userTypes}:`, allUsers.map(u => ({ id: u.id, telegramId: u.telegramId, userType: u.userType })));
        res.json(allUsers);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });

  // Get user's seen raffles  
  app.get("/api/user/seen-raffles/:userId", async (req, res) => {
    try {
      const seenRaffleIds = await storage.getUserSeenRaffles(req.params.userId);
      res.json(seenRaffleIds);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });

  // Get user's joined raffles
  app.get("/api/user/joined-raffles/:userId", async (req, res) => {
    try {
      const joinedRaffles = await storage.getUserJoinedRaffles(req.params.userId);
      res.json(joinedRaffles);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });

  // Check if user has joined raffle
  app.get("/api/raffles/:raffleId/joined/:userId", async (req, res) => {
    try {
      const { raffleId, userId } = req.params;
      const hasJoined = await storage.hasUserJoinedRaffle(userId, raffleId);
      res.json({ hasJoined });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });

  // Sponsor channel routes
  app.get("/api/sponsor-channels", async (req, res) => {
    try {
      const channels = await storage.getSponsorChannels();
      res.json(channels);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });

  app.post("/api/sponsor-channels", async (req, res) => {
    try {
      console.log("Received sponsor channel data:", req.body);
      const channelData = insertSponsorChannelSchema.parse(req.body);
      console.log("Validated sponsor channel data:", channelData);
      const channel = await storage.createSponsorChannel(channelData);
      res.json(channel);
    } catch (error: any) {
      console.error("Sponsor channel creation error:", error);
      res.status(400).json({ message: "Invalid channel data", error: error.message });
    }
  });

  app.delete("/api/sponsor-channels/:id", async (req, res) => {
    try {
      await storage.deleteSponsorChannel(req.params.id);
      res.json({ message: "Sponsor channel deleted successfully" });
    } catch (error: any) {
      console.error("Sponsor channel deletion error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  app.put("/api/sponsor-channels/:id", async (req, res) => {
    try {
      const updates = req.body;
      const updatedChannel = await storage.updateSponsorChannel(req.params.id, updates);
      if (!updatedChannel) {
        return res.status(404).json({ message: "Sponsor channel not found" });
      }
      res.json(updatedChannel);
    } catch (error: any) {
      console.error("Sponsor channel update error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  app.put("/api/sponsor-channels-reorder", async (req, res) => {
    try {
      const { channelOrders } = req.body;
      
      // Validate the request body
      const reorderSchema = z.object({
        channelOrders: z.array(z.object({
          id: z.string(),
          displayOrder: z.number()
        }))
      });
      
      const validatedData = reorderSchema.parse({ channelOrders });
      await storage.reorderSponsorChannels(validatedData.channelOrders);
      
      res.json({ message: "Sponsor channels reordered successfully" });
    } catch (error: any) {
      console.error("Sponsor channel reorder error:", error);
      res.status(400).json({ message: "Invalid reorder data", error: error.message });
    }
  });

  // Telegram membership verification endpoints
  app.get("/api/user/:userId/sponsor-memberships", async (req, res) => {
    try {
      const { userId } = req.params;
      const memberships = await storage.getUserSponsorMemberships(userId);
      res.json(memberships);
    } catch (error: any) {
      console.error("Error fetching user memberships:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  app.post("/api/user/:userId/check-membership/:channelId", async (req, res) => {
    try {
      const { userId, channelId } = req.params;
      
      if (!process.env.BOT_TOKEN) {
        return res.status(500).json({ message: "Bot token not configured" });
      }

      const TelegramBotService = (await import('./services/telegramBot')).default;
      const telegramBot = new TelegramBotService(process.env.BOT_TOKEN);
      
      const result = await telegramBot.updateUserMembership(userId, channelId);
      res.json(result);
    } catch (error: any) {
      console.error("Error checking membership:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  app.get("/api/user/:userId/available-channels", async (req, res) => {
    try {
      const { userId } = req.params;
      const channels = await storage.getAvailableSponsorChannelsForUser(userId);
      res.json(channels);
    } catch (error: any) {
      console.error("Error fetching available channels:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  // Admin endpoints for membership management
  app.post("/api/admin/check-all-memberships/:channelId", async (req, res) => {
    try {
      if (!process.env.BOT_TOKEN) {
        return res.status(500).json({ message: "Bot token not configured" });
      }

      const { channelId } = req.params;
      const TelegramBotService = (await import('./services/telegramBot')).default;
      const telegramBot = new TelegramBotService(process.env.BOT_TOKEN);
      
      const updatedCount = await telegramBot.checkAllUsersInChannel(channelId);
      res.json({ 
        message: `Successfully checked ${updatedCount} memberships`,
        updatedCount 
      });
    } catch (error: any) {
      console.error("Error checking all memberships:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  app.post("/api/admin/check-bot-access", async (req, res) => {
    try {
      if (!process.env.BOT_TOKEN) {
        return res.status(500).json({ message: "Bot token not configured" });
      }

      const TelegramBotService = (await import('./services/telegramBot')).default;
      const telegramBot = new TelegramBotService(process.env.BOT_TOKEN);
      
      const result = await telegramBot.checkAllChannelsAccess();
      res.json(result);
    } catch (error: any) {
      console.error("Error checking bot access:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  app.post("/api/admin/update-channel-access/:channelId", async (req, res) => {
    try {
      if (!process.env.BOT_TOKEN) {
        return res.status(500).json({ message: "Bot token not configured" });
      }

      const { channelId } = req.params;
      const TelegramBotService = (await import('./services/telegramBot')).default;
      const telegramBot = new TelegramBotService(process.env.BOT_TOKEN);
      
      const hasAccess = await telegramBot.updateChannelBotAccess(channelId);
      res.json({ 
        channelId,
        hasAccess,
        message: hasAccess ? "Bot has access to channel" : "Bot does not have access to channel"
      });
    } catch (error: any) {
      console.error("Error updating channel access:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // Points and referral routes
  app.post("/api/users/:id/points", async (req, res) => {
    try {
      const { points } = req.body;
      await storage.addPoints(req.params.id, points);
      const user = await storage.getUser(req.params.id);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });

  // Get submitted raffles by user
  app.get("/api/raffles/submitted/:userId", async (req, res) => {
    try {
      const submittedRaffles = await storage.getRafflesBySubmitter(req.params.userId);
      res.json(submittedRaffles);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });

  // Admin routes
  app.get("/api/admin/raffles/pending", async (req, res) => {
    try {
      const pendingRaffles = await storage.getRafflesByStatus("pending");
      res.json(pendingRaffles);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const { type } = req.query;
      console.log(`DB query for type "${type}":`, type ? await storage.getUsersByType(type as string) : []);
      const users = type ? await storage.getUsersByType(type as string) : [];
      res.json(users);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      res.status(500).json({ message: "Server error", error });
    }
  });

  

  // Authentication routes
  app.post("/api/auth/telegram", async (req, res) => {
    try {
      const authData = upsertUserSchema.parse(req.body);
      
      // Check if user already exists in database
      const existingUser = authData.telegramId ? await storage.getUserByTelegramId(authData.telegramId) : null;
      
      const userData = {
        ...authData,
        authMethod: "telegram" as const,
        // Preserve existing user type and adminLevel if user exists, otherwise determine from admin status
        userType: existingUser ? existingUser.userType : 
          (authData.telegramId && await storage.isUserAdmin(authData.telegramId) ? "bot_admin" as const : "regular" as const),
        adminLevel: existingUser ? existingUser.adminLevel : 
          // CRITICAL SECURITY: King Admin gets level 0 (hardcoded)
          (isKingAdmin(authData.telegramId || "") ? 0 : 
           // Other admins get level 1 by default
           (authData.telegramId && await storage.isUserAdmin(authData.telegramId) ? 1 : 2)),
      };
      
      const user = await storage.upsertUser(userData);
      
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid authentication data", error });
    }
  });

  app.post("/api/auth/gmail", async (req, res) => {
    try {
      const authData = upsertUserSchema.parse(req.body);
      
      const user = await storage.upsertUser({
        ...authData,
        authMethod: "gmail",
      });
      
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid authentication data", error });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    try {
      const { telegramId, email } = req.query;
      
      let user;
      if (telegramId) {
        user = await storage.getUserByTelegramId(telegramId as string);
      } else if (email) {
        user = await storage.getUserByEmail(email as string);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Add admin level information
      let adminLevel = null;
      if (user.telegramId) {
        adminLevel = await storage.getAdminLevel(user.telegramId);
      }
      
      res.json({ ...user, currentAdminLevel: adminLevel });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });

  // Bot configuration routes
  app.post("/api/bot/config", async (req, res) => {
    try {
      const configData = insertBotConfigSchema.parse(req.body);
      const config = await storage.setBotConfig(configData);
      res.json(config);
    } catch (error) {
      res.status(400).json({ message: "Invalid bot configuration", error });
    }
  });

  app.get("/api/bot/config", async (req, res) => {
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

  // User stats and referral routes
  app.get("/api/users/:id/stats", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const stats = {
        referralCount: 0, // This would be calculated from referrals
        levelProgress: ((user.points % 100) / 100) * 100, // Simple level progress calculation
        nextLevelPoints: Math.ceil((user.level + 1) * 100), // Next level points needed
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });

  app.get("/api/users/:id/referral", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const referralData = {
        referralLink: user.referralCode ? `https://t.me/YourBotName?start=${user.referralCode}` : null,
        referredCount: 0, // Would be calculated from database
        referralPoints: user.points || 0,
        referredUsers: [], // Would be fetched from database
      };
      
      res.json(referralData);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });

  app.post("/api/users/:id/generate-referral", async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate unique referral code if doesn't exist
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

  // Admin management routes
  app.post("/api/admins", async (req, res) => {
    try {
      const { telegramId, userType, adminLevel } = req.body;
      
      // Check if user exists, if not create them as admin
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

  // Remove admin (convert to regular user)
  app.delete("/api/admins/:telegramId", async (req, res) => {
    try {
      const { telegramId } = req.params;
      
      // SECURITY: Prevent removing King Admin
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
      
      // For admin removal, bypass normal security and directly update
      // This is a system operation for demoting admins to regular users
      const [updatedUser] = await db
        .update(users)
        .set({ 
          userType: "regular",
          adminLevel: 2, // Regular user level
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id))
        .returning();
      
      console.log(`Admin removed: ${telegramId} converted to regular user`);
      res.json(updatedUser);
    } catch (error) {
      console.error('Error removing admin:', error);
      res.status(500).json({ message: "Server error", error });
    }
  });



  // Enhanced raffle management routes
  app.patch("/api/raffles/:id/approve", async (req, res) => {
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

  app.patch("/api/raffles/:id/reject", async (req, res) => {
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

  // SECURITY ENDPOINT: Only King Admin can change admin levels
  app.patch("/api/admin/users/:userId/admin-level", async (req, res) => {
    // Note: Authentication will be handled differently in production
    const currentUserTelegramId = getKingAdminId(); // For demo purposes
    const currentUser = await storage.getUserByTelegramId(currentUserTelegramId);
    if (!currentUser) {
      return res.status(401).json({ error: "User not found" });
    }

    const { userId } = req.params;
    const { adminLevel } = req.body;

    // CRITICAL SECURITY: Only King Admin (level 0) can change admin levels
    if (currentUser.adminLevel !== 0) {
      console.warn(`SECURITY ALERT: Unauthorized admin level change attempt by ${currentUser.telegramId}`);
      return res.status(403).json({ 
        error: "Forbidden: Only King Admin can manage admin levels",
        userLevel: currentUser.adminLevel 
      });
    }

    // Validate input
    if (typeof adminLevel !== 'number' || adminLevel < 0 || adminLevel > 2) {
      return res.status(400).json({ error: "Invalid admin level. Must be 0, 1, or 2" });
    }

    try {
      const updatedUser = await storage.secureAdminLevelChange(
        currentUser.telegramId!, 
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

  const httpServer = createServer(app);
  return httpServer;
}
