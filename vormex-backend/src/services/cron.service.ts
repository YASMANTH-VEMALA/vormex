import Queue, { Job } from 'bull';
import { prisma } from '../config/prisma';
import { pushNotificationService } from './push-notification.service';
import { engagementService } from './engagement.service';
import { socialProofService } from './social-proof.service';
import { storyService } from './story.service';

/**
 * Cron Jobs Service
 * Uses Bull queues for scheduled background tasks
 * - Daily match notifications (9 PM IST / 3:30 PM UTC)
 * - Streak-at-risk reminders (8 PM IST / 2:30 PM UTC)
 * - Streak freeze processing (midnight IST / 6:30 PM UTC)
 * - Weekly counter reset (Monday midnight IST)
 */

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DAILY MATCH NOTIFICATION QUEUE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const dailyMatchQueue = new Queue('daily-match-notifications', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

dailyMatchQueue.process(async (_job: Job) => {
  console.log('🔔 Running daily match push notifications...');

  try {
    // Find all users who have active device tokens (i.e., have the app installed)
    const usersWithTokens = await prisma.deviceToken.findMany({
      where: { isActive: true },
      select: { userId: true },
      distinct: ['userId'],
    });

    const userIds = usersWithTokens.map(u => u.userId);
    console.log(`📱 Sending daily match pushes to ${userIds.length} users`);

    let sent = 0;
    for (const userId of userIds) {
      try {
        // Random match count for the push (creates curiosity)
        const matchCount = Math.floor(Math.random() * 4) + 1; // 1-4
        await pushNotificationService.pushDailyMatches(userId, matchCount);
        sent++;
      } catch (err) {
        // Continue to next user on error
      }
    }

    console.log(`✅ Daily match notifications sent: ${sent}/${userIds.length}`);
    return { sent, total: userIds.length };
  } catch (error) {
    console.error('❌ Daily match cron error:', error);
    throw error;
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STREAK REMINDER QUEUE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const streakReminderQueue = new Queue('streak-reminders', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

streakReminderQueue.process(async (_job: Job) => {
  console.log('🔥 Running streak reminder push notifications...');

  try {
    // Find users whose streaks are at risk (haven't connected today but have a streak ≥ 2)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check all 4 streak types
    const streakChecks = [
      { field: 'connectionStreak', dateField: 'lastConnectionDate', label: 'networking' },
      { field: 'loginStreak', dateField: 'lastLoginDate', label: 'login' },
      { field: 'postingStreak', dateField: 'lastPostDate', label: 'posting' },
      { field: 'messagingStreak', dateField: 'lastMessageDate', label: 'messaging' },
    ];

    let totalSent = 0;

    for (const check of streakChecks) {
      const atRiskUsers: any[] = await prisma.engagement_streaks.findMany({
        where: {
          [check.field]: { gte: 2 },
          [check.dateField]: { lt: today },
        },
        select: {
          userId: true,
          [check.field]: true,
          streakFreezes: true,
          streakShieldActive: true,
        },
      });

      // Filter to only those with active device tokens
      const usersWithTokens = await prisma.deviceToken.findMany({
        where: {
          userId: { in: atRiskUsers.map((u: any) => u.userId) },
          isActive: true,
        },
        select: { userId: true },
        distinct: ['userId'],
      });
      const tokenUserIds = new Set(usersWithTokens.map(u => u.userId));

      for (const user of atRiskUsers) {
        if (!tokenUserIds.has(user.userId)) continue;
        try {
          const streakCount = (user as any)[check.field];
          const hasProtection = user.streakShieldActive && user.streakFreezes > 0;
          
          // Customize message based on whether they have protection
          const message = hasProtection
            ? `Your ${streakCount}-day ${check.label} streak has a shield, but don't rely on it! 🛡️`
            : `Don't lose your ${streakCount}-day ${check.label} streak! 🔥`;
          
          await pushNotificationService.pushStreakAtRisk(user.userId, streakCount);
          totalSent++;
        } catch (err) {
          // Continue to next user
        }
      }
    }

    console.log(`✅ Streak reminders sent: ${totalSent} across all streak types`);
    return { sent: totalSent };
  } catch (error) {
    console.error('❌ Streak reminder cron error:', error);
    throw error;
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STREAK FREEZE PROCESSING QUEUE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const streakFreezeQueue = new Queue('streak-freeze-processor', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

streakFreezeQueue.process(async (_job: Job) => {
  console.log('🛡️ Processing streak freezes...');
  try {
    await engagementService.processStreakFreezes();
    console.log('✅ Streak freezes processed');
    return { success: true };
  } catch (error) {
    console.error('❌ Streak freeze processing error:', error);
    throw error;
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WEEKLY COUNTER RESET QUEUE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const weeklyResetQueue = new Queue('weekly-counter-reset', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

weeklyResetQueue.process(async (_job: Job) => {
  console.log('📊 Resetting weekly counters...');
  try {
    await engagementService.resetWeeklyCounters();
    console.log('✅ Weekly counters reset');
    return { success: true };
  } catch (error) {
    console.error('❌ Weekly counter reset error:', error);
    throw error;
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SOCIAL PROOF CRON QUEUES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const socialProofLeaderboardQueue = new Queue('social-proof-leaderboard', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 5,
    removeOnFail: 20,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

socialProofLeaderboardQueue.process(async (_job: Job) => {
  console.log('🏆 Running social proof leaderboard update...');
  try {
    await socialProofService.runLeaderboardCron();
    return { success: true };
  } catch (error) {
    console.error('❌ Social proof leaderboard error:', error);
    throw error;
  }
});

const socialProofTrendingQueue = new Queue('social-proof-trending', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 5,
    removeOnFail: 20,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

socialProofTrendingQueue.process(async (_job: Job) => {
  console.log('🔥 Running trending detection...');
  try {
    await socialProofService.runTrendingCron();
    return { success: true };
  } catch (error) {
    console.error('❌ Trending detection error:', error);
    throw error;
  }
});

const socialProofCleanupQueue = new Queue('social-proof-cleanup', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 5,
    removeOnFail: 20,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

socialProofCleanupQueue.process(async (_job: Job) => {
  console.log('🧹 Running social proof cleanup...');
  try {
    await socialProofService.cleanupOldActivities();
    await socialProofService.cleanupOldProfileViews();
    await socialProofService.runOnboardingCron();
    return { success: true };
  } catch (error) {
    console.error('❌ Social proof cleanup error:', error);
    throw error;
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STORY CLEANUP QUEUE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const storyCleanupQueue = new Queue('story-cleanup', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 5,
    removeOnFail: 20,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

storyCleanupQueue.process(async (_job: Job) => {
  console.log('🧹 Running story cleanup (expired stories)...');
  try {
    const result = await storyService.cleanupExpiredStories();
    console.log(`✅ Story cleanup complete: ${result.deleted} deleted, ${result.archived} archived`);
    return result;
  } catch (error) {
    console.error('❌ Story cleanup error:', error);
    throw error;
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STUDY STREAK QUEUE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const studyStreakQueue = new Queue('study-streak-calculation', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 5,
    removeOnFail: 20,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

studyStreakQueue.process(async (_job: Job) => {
  console.log('📚 Calculating study streaks...');
  try {
    const result = await storyService.calculateStudyStreaks();
    console.log(`✅ Study streaks updated for ${result.updated} users`);
    return result;
  } catch (error) {
    console.error('❌ Study streak calculation error:', error);
    throw error;
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INTERACTIVE ELEMENT NOTIFICATIONS QUEUE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const interactiveNotificationsQueue = new Queue('story-interactive-notifications', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 5,
    removeOnFail: 20,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

interactiveNotificationsQueue.process(async (_job: Job) => {
  console.log('📊 Processing interactive element notifications...');
  try {
    const result = await storyService.processInteractiveNotifications();
    console.log(`✅ Interactive notifications sent: ${result.sent}`);
    return result;
  } catch (error) {
    console.error('❌ Interactive notifications error:', error);
    throw error;
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COUNTDOWN NOTIFICATIONS QUEUE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const countdownNotificationsQueue = new Queue('story-countdown-notifications', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 5,
    removeOnFail: 20,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

countdownNotificationsQueue.process(async (_job: Job) => {
  console.log('⏰ Processing countdown notifications...');
  try {
    const result = await storyService.processCountdownNotifications();
    console.log(`✅ Countdown notifications sent: ${result.sent}`);
    return result;
  } catch (error) {
    console.error('❌ Countdown notifications error:', error);
    throw error;
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INITIALIZE CRON SCHEDULES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function initCronJobs() {
  try {
    // Remove existing repeatable jobs first (to prevent duplicates on restart)
    const existingDailyJobs = await dailyMatchQueue.getRepeatableJobs();
    for (const job of existingDailyJobs) {
      await dailyMatchQueue.removeRepeatableByKey(job.key);
    }

    const existingStreakJobs = await streakReminderQueue.getRepeatableJobs();
    for (const job of existingStreakJobs) {
      await streakReminderQueue.removeRepeatableByKey(job.key);
    }

    const existingFreezeJobs = await streakFreezeQueue.getRepeatableJobs();
    for (const job of existingFreezeJobs) {
      await streakFreezeQueue.removeRepeatableByKey(job.key);
    }

    const existingWeeklyJobs = await weeklyResetQueue.getRepeatableJobs();
    for (const job of existingWeeklyJobs) {
      await weeklyResetQueue.removeRepeatableByKey(job.key);
    }

    // Daily match notifications at 9:00 PM IST (3:30 PM UTC)
    await dailyMatchQueue.add(
      {},
      {
        repeat: { cron: '30 15 * * *' }, // 3:30 PM UTC = 9:00 PM IST
        jobId: 'daily-match-push',
      }
    );

    // Streak reminders at 8:00 PM IST (2:30 PM UTC)
    await streakReminderQueue.add(
      {},
      {
        repeat: { cron: '30 14 * * *' }, // 2:30 PM UTC = 8:00 PM IST
        jobId: 'streak-reminder-push',
      }
    );

    // Streak freeze processing at 12:30 AM IST (7:00 PM previous day UTC)
    await streakFreezeQueue.add(
      {},
      {
        repeat: { cron: '0 19 * * *' }, // 7:00 PM UTC = 12:30 AM IST (next day)
        jobId: 'streak-freeze-processor',
      }
    );

    // Weekly counter reset every Monday at 12:00 AM IST (6:30 PM Sunday UTC)
    await weeklyResetQueue.add(
      {},
      {
        repeat: { cron: '30 18 * * 0' }, // 6:30 PM UTC Sunday = 12:00 AM IST Monday
        jobId: 'weekly-counter-reset',
      }
    );

    // ━━━━ Social Proof Cron Schedules ━━━━

    // Clear existing social proof repeatable jobs
    const existingSPLeaderboardJobs = await socialProofLeaderboardQueue.getRepeatableJobs();
    for (const job of existingSPLeaderboardJobs) {
      await socialProofLeaderboardQueue.removeRepeatableByKey(job.key);
    }
    const existingSPTrendingJobs = await socialProofTrendingQueue.getRepeatableJobs();
    for (const job of existingSPTrendingJobs) {
      await socialProofTrendingQueue.removeRepeatableByKey(job.key);
    }
    const existingSPCleanupJobs = await socialProofCleanupQueue.getRepeatableJobs();
    for (const job of existingSPCleanupJobs) {
      await socialProofCleanupQueue.removeRepeatableByKey(job.key);
    }

    // Leaderboard update every hour (IST-aligned)
    await socialProofLeaderboardQueue.add(
      {},
      {
        repeat: { cron: '0 * * * *' }, // Every hour on the hour
        jobId: 'social-proof-leaderboard',
      }
    );

    // Trending detection every 15 minutes
    await socialProofTrendingQueue.add(
      {},
      {
        repeat: { cron: '*/15 * * * *' }, // Every 15 minutes
        jobId: 'social-proof-trending',
      }
    );

    // Cleanup & onboarding stats daily at 1:00 AM IST (7:30 PM UTC previous day)
    await socialProofCleanupQueue.add(
      {},
      {
        repeat: { cron: '30 19 * * *' }, // 7:30 PM UTC = 1:00 AM IST
        jobId: 'social-proof-cleanup',
      }
    );

    // ━━━━ Story Cron Schedules ━━━━

    // Clear existing story repeatable jobs
    const existingStoryCleanupJobs = await storyCleanupQueue.getRepeatableJobs();
    for (const job of existingStoryCleanupJobs) {
      await storyCleanupQueue.removeRepeatableByKey(job.key);
    }
    const existingStudyStreakJobs = await studyStreakQueue.getRepeatableJobs();
    for (const job of existingStudyStreakJobs) {
      await studyStreakQueue.removeRepeatableByKey(job.key);
    }
    const existingInteractiveJobs = await interactiveNotificationsQueue.getRepeatableJobs();
    for (const job of existingInteractiveJobs) {
      await interactiveNotificationsQueue.removeRepeatableByKey(job.key);
    }
    const existingCountdownJobs = await countdownNotificationsQueue.getRepeatableJobs();
    for (const job of existingCountdownJobs) {
      await countdownNotificationsQueue.removeRepeatableByKey(job.key);
    }

    // Story cleanup every hour (delete expired 24h stories)
    await storyCleanupQueue.add(
      {},
      {
        repeat: { cron: '0 * * * *' }, // Every hour
        jobId: 'story-cleanup',
      }
    );

    // Study streak calculation at midnight IST (6:30 PM UTC)
    await studyStreakQueue.add(
      {},
      {
        repeat: { cron: '30 18 * * *' }, // 6:30 PM UTC = 12:00 AM IST
        jobId: 'study-streak-calculation',
      }
    );

    // Interactive element notifications every 5 minutes
    await interactiveNotificationsQueue.add(
      {},
      {
        repeat: { cron: '*/5 * * * *' }, // Every 5 minutes
        jobId: 'story-interactive-notifications',
      }
    );

    // Countdown notifications every minute
    await countdownNotificationsQueue.add(
      {},
      {
        repeat: { cron: '* * * * *' }, // Every minute
        jobId: 'story-countdown-notifications',
      }
    );

    console.log('⏰ Cron jobs initialized:');
    console.log('   📩 Daily match notifications — 9:00 PM IST');
    console.log('   🔥 Streak reminders — 8:00 PM IST');
    console.log('   🛡️ Streak freeze processing — 12:30 AM IST');
    console.log('   📊 Weekly counter reset — Monday 12:00 AM IST');
    console.log('   🏆 Social proof leaderboard — Every hour');
    console.log('   📈 Trending detection — Every 15 minutes');
    console.log('   🧹 Social proof cleanup — 1:00 AM IST daily');
    console.log('   📷 Story cleanup — Every hour');
    console.log('   📚 Study streak calculation — 12:00 AM IST');
    console.log('   🗳️ Interactive notifications — Every 5 minutes');
    console.log('   ⏰ Countdown notifications — Every minute');
  } catch (error) {
    console.error('❌ Failed to initialize cron jobs:', error);
  }
}

// Error handlers
dailyMatchQueue.on('failed', (job: Job, err: Error) => {
  console.error(`Daily match job ${job.id} failed:`, err.message);
});

streakReminderQueue.on('failed', (job: Job, err: Error) => {
  console.error(`Streak reminder job ${job.id} failed:`, err.message);
});

streakFreezeQueue.on('failed', (job: Job, err: Error) => {
  console.error(`Streak freeze job ${job.id} failed:`, err.message);
});

weeklyResetQueue.on('failed', (job: Job, err: Error) => {
  console.error(`Weekly reset job ${job.id} failed:`, err.message);
});

socialProofLeaderboardQueue.on('failed', (job: Job, err: Error) => {
  console.error(`Social proof leaderboard job ${job.id} failed:`, err.message);
});

socialProofTrendingQueue.on('failed', (job: Job, err: Error) => {
  console.error(`Social proof trending job ${job.id} failed:`, err.message);
});

socialProofCleanupQueue.on('failed', (job: Job, err: Error) => {
  console.error(`Social proof cleanup job ${job.id} failed:`, err.message);
});

storyCleanupQueue.on('failed', (job: Job, err: Error) => {
  console.error(`Story cleanup job ${job.id} failed:`, err.message);
});

studyStreakQueue.on('failed', (job: Job, err: Error) => {
  console.error(`Study streak job ${job.id} failed:`, err.message);
});

interactiveNotificationsQueue.on('failed', (job: Job, err: Error) => {
  console.error(`Interactive notifications job ${job.id} failed:`, err.message);
});

countdownNotificationsQueue.on('failed', (job: Job, err: Error) => {
  console.error(`Countdown notifications job ${job.id} failed:`, err.message);
});
