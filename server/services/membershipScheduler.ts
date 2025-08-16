import * as cron from 'node-cron';
import TelegramBotService from './telegramBot';
import { storage } from '../storage';

export default class MembershipScheduler {
  private telegramBot: TelegramBotService;
  private scheduledTask: cron.ScheduledTask | null = null;

  constructor(botToken: string) {
    this.telegramBot = new TelegramBotService(botToken);
  }

  // Start the scheduler
  start() {
    // Run every 5 minutes during active hours (8 AM to 11 PM)
    this.scheduledTask = cron.schedule('*/5 8-23 * * *', async () => {
      await this.runMembershipCheck();
    }, {
      scheduled: true,
      timezone: "Asia/Tehran"
    });

    console.log('🚀 Starting membership scheduler...');
    
    // Run initial check after 30 seconds
    setTimeout(() => {
      this.runMembershipCheck();
    }, 30000);
  }

  // Stop the scheduler
  stop() {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
      this.scheduledTask = null;
      console.log('🛑 Membership scheduler stopped');
    }
  }

  // Main membership checking routine
  private async runMembershipCheck(): Promise<void> {
    try {
      console.log('📋 Starting scheduled membership check...');
      
      // Get all sponsor channels
      const channels = await storage.getSponsorChannels();
      console.log(`📊 Found ${channels.length} active sponsor channels`);

      if (channels.length === 0) {
        console.log('ℹ️ No sponsor channels found, skipping membership check');
        return;
      }

      // First, update bot access status for all channels
      await this.updateChannelAccess(channels);

      // Then check user memberships for accessible channels
      const accessibleChannels = channels.filter(c => c.botHasAccess);
      
      if (accessibleChannels.length === 0) {
        console.log('⚠️ No accessible channels found, skipping user membership checks');
        return;
      }

      // Run membership checks
      const result = await this.telegramBot.bulkCheckMemberships();
      
      console.log(`📈 Membership check summary: ${result.successfulChecks} users updated across ${accessibleChannels.length} channels`);
      
      if (result.pointsAwarded > 0) {
        console.log(`💰 Total points awarded this round: ${result.pointsAwarded}`);
      }

      console.log('✅ Scheduled membership check completed');
      
    } catch (error) {
      console.error('❌ Error during scheduled membership check:', error);
    }
  }

  // Update bot access status for all channels
  private async updateChannelAccess(channels: any[]): Promise<void> {
    for (const channel of channels) {
      try {
        const hasAccess = await this.telegramBot.checkChannelBotAccess(channel.channelId);
        
        if (hasAccess !== channel.botHasAccess) {
          await storage.updateSponsorChannelBotAccess(channel.channelId, hasAccess);
          console.log(`🔄 Updated bot access for ${channel.channelName}: ${hasAccess ? 'accessible' : 'not accessible'}`);
        }
        
        if (!hasAccess) {
          console.log(`⚠️ Skipping channel ${channel.channelName} - Bot has no access`);
        }
      } catch (error) {
        console.error(`❌ Failed to check bot access for ${channel.channelName}:`, error);
      }
    }
  }

  // Manual trigger for immediate check
  async triggerImmediateCheck(): Promise<void> {
    console.log('🔄 Manual membership check triggered');
    await this.runMembershipCheck();
  }

  // Get scheduler status
  getStatus(): {
    isRunning: boolean;
    nextRun: string | null;
  } {
    return {
      isRunning: this.scheduledTask !== null,
      nextRun: this.scheduledTask ? 'Every 5 minutes (8 AM - 11 PM)' : null
    };
  }
}