import { prisma } from '../config/prisma';

/**
 * Push Notification Service
 * 
 * To enable Firebase Cloud Messaging:
 * 1. Install firebase-admin: npm install firebase-admin
 * 2. Set environment variables:
 *    - FIREBASE_PROJECT_ID
 *    - FIREBASE_CLIENT_EMAIL
 *    - FIREBASE_PRIVATE_KEY (with \n for newlines)
 * 3. Uncomment the Firebase imports and initialization below
 */

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

// Uncomment when firebase-admin is installed:
// import * as admin from 'firebase-admin';
// let firebaseInitialized = false;

let fcmEnabled = false;

function initializeFirebase(): boolean {
  // Uncomment when firebase-admin is installed:
  /*
  if (firebaseInitialized) return true;
  
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('Firebase credentials not configured. Push notifications disabled.');
      return false;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    return false;
  }
  */
  
  // Check if FCM credentials are configured
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  if (projectId && clientEmail && privateKey) {
    console.warn('Firebase credentials found but firebase-admin not installed. Run: npm install firebase-admin');
    return false;
  }
  
  console.log('Push notifications running in mock mode (FCM not configured)');
  return false;
}

class PushNotificationService {
  constructor() {
    fcmEnabled = initializeFirebase();
  }

  async sendToUser(userId: string, payload: NotificationPayload): Promise<boolean> {
    try {
      const tokens = await prisma.deviceToken.findMany({
        where: { userId, isActive: true },
        select: { id: true, token: true },
      });

      if (tokens.length === 0) {
        console.log(`No active device tokens for user ${userId}`);
        return false;
      }

      // Mock mode - log the notification
      if (!fcmEnabled) {
        console.log(`📱 [MOCK] Push notification to ${userId}:`);
        console.log(`  Title: ${payload.title}`);
        console.log(`  Body: ${payload.body}`);
        if (payload.data) {
          console.log(`  Data:`, payload.data);
        }
        return true;
      }

      // When firebase-admin is installed, uncomment:
      /*
      const messaging = admin.messaging();
      const tokenStrings = tokens.map(t => t.token);
      
      const message: admin.messaging.MulticastMessage = {
        tokens: tokenStrings,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        data: payload.data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'vormex_default',
            priority: 'high',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
        webpush: {
          notification: {
            title: payload.title,
            body: payload.body,
            icon: '/icon-192x192.png',
          },
        },
      };

      const response = await messaging.sendEachForMulticast(message);
      
      console.log(`📱 Push notification sent to ${userId}: ${response.successCount}/${tokens.length} successful`);

      if (response.failureCount > 0) {
        const failedTokenIds: string[] = [];
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            if (
              errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered'
            ) {
              failedTokenIds.push(tokens[idx].id);
            }
            console.error(`Token ${idx} failed:`, resp.error?.message);
          }
        });

        if (failedTokenIds.length > 0) {
          await prisma.deviceToken.updateMany({
            where: { id: { in: failedTokenIds } },
            data: { isActive: false },
          });
          console.log(`Deactivated ${failedTokenIds.length} invalid tokens`);
        }
      }

      return response.successCount > 0;
      */
      
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  async sendToMultipleUsers(userIds: string[], payload: NotificationPayload): Promise<number> {
    let successCount = 0;
    const batchSize = 10;

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(userId => this.sendToUser(userId, payload))
      );
      successCount += results.filter(Boolean).length;
    }

    return successCount;
  }

  async pushDailyMatches(userId: string, matchCount: number): Promise<boolean> {
    return this.sendToUser(userId, {
      title: '✨ New Matches Today!',
      body: `You have ${matchCount} new match${matchCount > 1 ? 'es' : ''} waiting for you`,
      data: {
        type: 'daily_match',
        matchCount: String(matchCount),
        screen: 'matches',
      },
    });
  }

  async pushStreakAtRisk(userId: string, streakCount: number, streakType: string = 'activity'): Promise<boolean> {
    return this.sendToUser(userId, {
      title: '🔥 Your Streak is at Risk!',
      body: `Don't lose your ${streakCount}-day ${streakType} streak! Open the app now to keep it going`,
      data: {
        type: 'streak_at_risk',
        streakCount: String(streakCount),
        streakType,
        screen: 'engagement',
      },
    });
  }

  async pushStreakAchieved(userId: string, streakCount: number, streakType: string = 'activity'): Promise<boolean> {
    const milestones = [7, 14, 30, 50, 100, 365];
    const isMilestone = milestones.includes(streakCount);
    
    return this.sendToUser(userId, {
      title: isMilestone ? '🎉 Streak Milestone!' : '🔥 Streak Extended!',
      body: isMilestone 
        ? `Amazing! You've hit a ${streakCount}-day ${streakType} streak!`
        : `Keep it up! You're on a ${streakCount}-day ${streakType} streak!`,
      data: {
        type: 'streak_achieved',
        streakCount: String(streakCount),
        streakType,
        isMilestone: String(isMilestone),
        screen: 'engagement',
      },
    });
  }

  async pushNewConnection(userId: string, connecterName: string, connectionId: string): Promise<boolean> {
    return this.sendToUser(userId, {
      title: '🤝 New Connection!',
      body: `${connecterName} is now connected with you`,
      data: {
        type: 'new_connection',
        connectionId,
        screen: 'connections',
      },
    });
  }

  async pushConnectionRequest(userId: string, requesterName: string, connectionId: string): Promise<boolean> {
    return this.sendToUser(userId, {
      title: '👋 Connection Request',
      body: `${requesterName} wants to connect with you`,
      data: {
        type: 'connection_request',
        connectionId,
        screen: 'connections',
      },
    });
  }

  async pushNewMessage(userId: string, senderName: string, preview: string, conversationId: string): Promise<boolean> {
    return this.sendToUser(userId, {
      title: `💬 ${senderName}`,
      body: preview.length > 100 ? preview.substring(0, 97) + '...' : preview,
      data: {
        type: 'new_message',
        conversationId,
        screen: 'chat',
      },
    });
  }

  async pushStudyGroupInvite(userId: string, groupName: string, inviterName: string, groupId: string): Promise<boolean> {
    return this.sendToUser(userId, {
      title: '📚 Study Group Invite',
      body: `${inviterName} invited you to join "${groupName}"`,
      data: {
        type: 'study_group_invite',
        groupId,
        screen: 'groups',
      },
    });
  }

  async pushProfileView(userId: string, viewerName: string, viewerId: string): Promise<boolean> {
    return this.sendToUser(userId, {
      title: '👀 Profile View',
      body: `${viewerName} checked out your profile`,
      data: {
        type: 'profile_view',
        viewerId,
        screen: 'profile',
      },
    });
  }

  async pushXpEarned(userId: string, amount: number, reason: string): Promise<boolean> {
    return this.sendToUser(userId, {
      title: '⭐ XP Earned!',
      body: `+${amount} XP for ${reason}`,
      data: {
        type: 'xp_earned',
        amount: String(amount),
        reason,
        screen: 'engagement',
      },
    });
  }

  async pushStoryInteraction(userId: string, interactorName: string, interactionType: string, storyId: string): Promise<boolean> {
    const action = interactionType === 'like' ? 'liked' : 
                   interactionType === 'reply' ? 'replied to' : 'viewed';
    return this.sendToUser(userId, {
      title: '📷 Story Activity',
      body: `${interactorName} ${action} your story`,
      data: {
        type: 'story_interaction',
        interactionType,
        storyId,
        screen: 'stories',
      },
    });
  }

  async pushCountdownReminder(userId: string, eventName: string, timeLeft: string, eventId: string): Promise<boolean> {
    return this.sendToUser(userId, {
      title: '⏰ Reminder',
      body: `${eventName} starts in ${timeLeft}`,
      data: {
        type: 'countdown_reminder',
        eventId,
        timeLeft,
        screen: 'events',
      },
    });
  }

  async pushWeeklyGoalProgress(userId: string, progress: number, target: number): Promise<boolean> {
    const remaining = target - progress;
    if (remaining <= 0) {
      return this.sendToUser(userId, {
        title: '🎯 Weekly Goal Complete!',
        body: 'Congratulations! You completed your weekly goal!',
        data: {
          type: 'weekly_goal_complete',
          screen: 'engagement',
        },
      });
    }
    
    return this.sendToUser(userId, {
      title: '📈 Almost There!',
      body: `You're ${progress}/${target} on your weekly goal. ${remaining} more to go!`,
      data: {
        type: 'weekly_goal_progress',
        progress: String(progress),
        target: String(target),
        screen: 'engagement',
      },
    });
  }

  async pushLeaderboardUpdate(userId: string, newRank: number, previousRank: number): Promise<boolean> {
    const improved = newRank < previousRank;
    return this.sendToUser(userId, {
      title: improved ? '📈 Ranking Up!' : '📊 Leaderboard Update',
      body: improved 
        ? `You moved up to #${newRank} on the leaderboard!`
        : `You're now ranked #${newRank} on the leaderboard`,
      data: {
        type: 'leaderboard_update',
        newRank: String(newRank),
        previousRank: String(previousRank),
        screen: 'leaderboard',
      },
    });
  }
}

export const pushNotificationService = new PushNotificationService();
