import axios from 'axios';
import { storage } from '../storage';

interface TelegramMember {
  ok: boolean;
  result: {
    user: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    status: string; // 'creator', 'administrator', 'member', 'restricted', 'left', 'kicked'
    until_date?: number;
  };
}

export default class TelegramBotService {
  private botToken: string;
  private baseUrl: string;

  constructor(botToken: string) {
    this.botToken = botToken;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  // Check if user is a member of a specific channel
  async checkUserMembership(userId: string, channelId: string): Promise<{
    isMember: boolean;
    status?: string;
    error?: string;
  }> {
    try {
      const response = await axios.get<TelegramMember>(
        `${this.baseUrl}/getChatMember`,
        {
          params: {
            chat_id: channelId,
            user_id: userId
          },
          timeout: 10000
        }
      );

      if (response.data.ok) {
        const status = response.data.result.status;
        const isMember = ['creator', 'administrator', 'member'].includes(status);
        
        return {
          isMember,
          status
        };
      } else {
        return {
          isMember: false,
          error: 'Failed to get member info'
        };
      }
    } catch (error: any) {
      console.error(`Error checking membership for user ${userId} in channel ${channelId}:`, error.message);
      
      // Handle specific Telegram API errors
      if (error.response?.status === 400) {
        return {
          isMember: false,
          error: 'User not found or bot has no access to channel'
        };
      }
      
      return {
        isMember: false,
        error: error.message || 'Network error'
      };
    }
  }

  // Update user membership status and award points if newly joined
  async updateUserMembership(userId: string, channelId: string): Promise<{
    isMember: boolean;
    pointsEarned: number;
    status?: string;
    error?: string;
  }> {
    // Convert userId to Telegram ID if it's a system user ID
    let telegramId = userId;
    if (userId.startsWith('telegram_')) {
      telegramId = userId.replace('telegram_', '');
    } else if (!userId.match(/^\d+$/)) {
      // If it's not a pure number and not telegram_ prefixed, get user from DB
      const user = await storage.getUser(userId);
      if (!user) {
        return {
          isMember: false,
          pointsEarned: 0,
          error: 'User not found'
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
    
    // Get existing membership record using original userId (system ID)
    const existingMemberships = await storage.getUserSponsorMemberships(userId);
    const existingMembership = existingMemberships.find(m => m.channelId === channelId);
    
    let pointsEarned = 0;

    if (isMember && (!existingMembership || !existingMembership.isMember)) {
      // User is newly a member - award points
      const channels = await storage.getSponsorChannels();
      const channel = channels.find(c => c.channelId === channelId);
      pointsEarned = channel?.pointsReward || 100;

      // Update user points
      await storage.addPoints(userId, pointsEarned);
    }

    // Update or create membership record
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
  async checkChannelBotAccess(channelId: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/getChat`,
        {
          params: {
            chat_id: channelId
          },
          timeout: 10000
        }
      );

      return response.data.ok;
    } catch (error: any) {
      console.error(`Bot access check failed for channel ${channelId}:`, error.message);
      return false;
    }
  }

  // Update channel bot access status in database
  async updateChannelBotAccess(channelId: string): Promise<boolean> {
    const hasAccess = await this.checkChannelBotAccess(channelId);
    await storage.updateSponsorChannelBotAccess(channelId, hasAccess);
    return hasAccess;
  }

  // Check bot access for all channels and update database
  async checkAllChannelsAccess(): Promise<{
    totalChannels: number;
    accessibleChannels: number;
    inaccessibleChannels: number;
    results: Array<{
      channelId: string;
      channelName: string;
      hasAccess: boolean;
    }>;
  }> {
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
  async checkAllUsersInChannel(channelId: string): Promise<number> {
    // Get all users who have interacted with this channel
    const allUsers = await storage.getUsers();
    let updatedCount = 0;

    // Check bot access first
    const hasAccess = await this.checkChannelBotAccess(channelId);
    await storage.updateSponsorChannelBotAccess(channelId, hasAccess);

    if (!hasAccess) {
      console.warn(`Bot has no access to channel ${channelId}, skipping membership checks`);
      return 0;
    }

    // Check membership for users who have Telegram IDs
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
  async bulkCheckMemberships(): Promise<{
    totalChecks: number;
    successfulChecks: number;
    failedChecks: number;
    pointsAwarded: number;
  }> {
    const channels = await storage.getSponsorChannels();
    const users = await storage.getUsers();
    
    let totalChecks = 0;
    let successfulChecks = 0;
    let failedChecks = 0;
    let totalPointsAwarded = 0;

    console.log(`📊 Starting bulk membership check for ${users.length} users across ${channels.length} channels`);

    for (const channel of channels) {
      // Skip channels where bot has no access
      if (!channel.botHasAccess) {
        console.log(`⚠️ Skipping channel ${channel.channelName} - Bot has no access`);
        continue;
      }

      console.log(`🔍 Checking channel: ${channel.channelName}`);
      
      for (const user of users) {
        if (user.telegramId) {
          totalChecks++;
          
          try {
            const result = await this.updateUserMembership(user.id, channel.channelId);
            successfulChecks++;
            totalPointsAwarded += result.pointsEarned;
            
            if (result.pointsEarned > 0) {
              console.log(`💰 User ${user.telegramId} earned ${result.pointsEarned} points from ${channel.channelName}`);
            }
          } catch (error) {
            failedChecks++;
            console.error(`❌ Failed check for user ${user.telegramId} in ${channel.channelName}:`, error);
          }
        }
      }
    }

    console.log(`📈 Bulk check completed: ${successfulChecks}/${totalChecks} successful, ${totalPointsAwarded} total points awarded`);

    return {
      totalChecks,
      successfulChecks,
      failedChecks,
      pointsAwarded: totalPointsAwarded
    };
  }
}