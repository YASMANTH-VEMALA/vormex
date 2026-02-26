/**
 * Notification Service
 * Handles in-app notifications with persistence and real-time delivery
 */

import { prisma } from '../config/prisma';
import { getIO } from '../sockets';

export type NotificationType = 
  | 'like'
  | 'comment'
  | 'comment_reply'
  | 'mention'
  | 'follow'
  | 'connection_request'
  | 'connection_accepted'
  | 'reel_like'
  | 'reel_comment'
  | 'reel_comment_reply'
  | 'reel_share'
  | 'reel_mention'
  | 'reel_view_milestone'
  | 'message'
  | 'streak_milestone'
  | 'streak_lost'
  | 'xp_earned'
  | 'post_share';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  actorId?: string;
  postId?: string;
  reelId?: string;
  commentId?: string;
  messageId?: string;
  data?: Record<string, any>;
}

class NotificationService {
  /**
   * Create a notification and send real-time update
   */
  async createNotification(params: CreateNotificationParams): Promise<void> {
    const { userId, type, title, body, actorId, postId, reelId, commentId, messageId, data } = params;

    // Don't notify yourself
    if (actorId && actorId === userId) {
      return;
    }

    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          body,
          actorId,
          postId,
          reelId,
          commentId,
          messageId,
          data: data || {},
        },
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              name: true,
              profileImage: true,
            },
          },
          post: {
            select: {
              id: true,
              content: true,
              mediaUrls: true,
            },
          },
          reel: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
            },
          },
        },
      });

      // Send real-time notification via Socket.IO
      const io = getIO();
      if (io) {
        io.to(`user:${userId}`).emit('notification:new', {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          actor: notification.actor,
          post: notification.post,
          reel: notification.reel,
          data: notification.data,
          isRead: notification.isRead,
          createdAt: notification.createdAt.toISOString(),
        });

        // Also emit specific event type for easier client-side handling
        io.to(`user:${userId}`).emit(`notification:${type}`, {
          notificationId: notification.id,
          actor: notification.actor,
          post: notification.post,
          reel: notification.reel,
          data: notification.data,
        });
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }

  /**
   * Send notification for streak milestone
   */
  async notifyStreakMilestone(userId: string, streakType: string, count: number): Promise<void> {
    await this.createNotification({
      userId,
      type: 'streak_milestone',
      title: '🔥 Streak Milestone!',
      body: `Amazing! You've reached a ${count}-day ${streakType} streak!`,
      data: { streakType, count },
    });
  }

  /**
   * Send notification for streak lost
   */
  async notifyStreakLost(userId: string, streakType: string, previousCount: number): Promise<void> {
    await this.createNotification({
      userId,
      type: 'streak_lost',
      title: '😢 Streak Lost',
      body: `Your ${previousCount}-day ${streakType} streak has ended. Start fresh today!`,
      data: { streakType, previousCount },
    });
  }

  /**
   * Send XP earned notification
   */
  async notifyXpEarned(userId: string, amount: number, reason: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'xp_earned',
      title: '⭐ XP Earned!',
      body: `+${amount} XP for ${reason}`,
      data: { amount, reason },
    });
  }

  /**
   * Send connection request notification
   */
  async notifyConnectionRequest(userId: string, requesterId: string, requesterName: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'connection_request',
      title: '🤝 Connection Request',
      body: `${requesterName} wants to connect with you`,
      actorId: requesterId,
    });
  }

  /**
   * Send connection accepted notification
   */
  async notifyConnectionAccepted(userId: string, accepterId: string, accepterName: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'connection_accepted',
      title: '✅ Connection Accepted',
      body: `${accepterName} accepted your connection request`,
      actorId: accepterId,
    });
  }

  /**
   * Send notification when someone comments on a post
   */
  async notifyPostComment(
    postAuthorId: string,
    commenterId: string,
    commenterName: string,
    postId: string,
    commentId: string,
    commentPreview: string
  ): Promise<void> {
    await this.createNotification({
      userId: postAuthorId,
      type: 'comment',
      title: '💬 New Comment',
      body: `${commenterName} commented: "${commentPreview.slice(0, 50)}${commentPreview.length > 50 ? '...' : ''}"`,
      actorId: commenterId,
      postId,
      commentId,
      data: { commentPreview },
    });
  }

  /**
   * Send notification when someone replies to a comment
   */
  async notifyCommentReply(
    originalCommenterId: string,
    replierId: string,
    replierName: string,
    postId: string,
    commentId: string,
    replyPreview: string
  ): Promise<void> {
    await this.createNotification({
      userId: originalCommenterId,
      type: 'comment_reply',
      title: '↩️ New Reply',
      body: `${replierName} replied: "${replyPreview.slice(0, 50)}${replyPreview.length > 50 ? '...' : ''}"`,
      actorId: replierId,
      postId,
      commentId,
      data: { replyPreview },
    });
  }

  /**
   * Send notification when someone likes a post
   */
  async notifyPostLike(
    postAuthorId: string,
    likerId: string,
    likerName: string,
    postId: string
  ): Promise<void> {
    await this.createNotification({
      userId: postAuthorId,
      type: 'like',
      title: '❤️ New Like',
      body: `${likerName} liked your post`,
      actorId: likerId,
      postId,
    });
  }

  /**
   * Send notification when someone shares a post
   */
  async notifyPostShare(
    postAuthorId: string,
    sharerId: string,
    sharerName: string,
    postId: string
  ): Promise<void> {
    await this.createNotification({
      userId: postAuthorId,
      type: 'post_share',
      title: '🔗 Post Shared',
      body: `${sharerName} shared your post`,
      actorId: sharerId,
      postId,
    });
  }

  /**
   * Send notification when someone mentions a user
   */
  async notifyMention(
    mentionedUserId: string,
    mentionerId: string,
    mentionerName: string,
    context: 'post' | 'comment' | 'reel' | 'reel_comment',
    referenceId: string,
    preview: string
  ): Promise<void> {
    const typeMap = {
      post: 'mention' as NotificationType,
      comment: 'mention' as NotificationType,
      reel: 'reel_mention' as NotificationType,
      reel_comment: 'reel_mention' as NotificationType,
    };

    await this.createNotification({
      userId: mentionedUserId,
      type: typeMap[context],
      title: '📢 You were mentioned',
      body: `${mentionerName} mentioned you: "${preview.slice(0, 50)}${preview.length > 50 ? '...' : ''}"`,
      actorId: mentionerId,
      postId: context === 'post' || context === 'comment' ? referenceId : undefined,
      reelId: context === 'reel' || context === 'reel_comment' ? referenceId : undefined,
      data: { context, preview },
    });
  }

  /**
   * Send notification when someone follows a user
   */
  async notifyFollow(
    userId: string,
    followerId: string,
    followerName: string
  ): Promise<void> {
    await this.createNotification({
      userId,
      type: 'follow',
      title: '👤 New Follower',
      body: `${followerName} started following you`,
      actorId: followerId,
    });
  }

  // ============================================
  // REEL-SPECIFIC NOTIFICATIONS
  // ============================================

  /**
   * Send notification when someone likes a reel
   */
  async notifyReelLike(
    reelAuthorId: string,
    likerId: string,
    likerName: string,
    reelId: string
  ): Promise<void> {
    await this.createNotification({
      userId: reelAuthorId,
      type: 'reel_like',
      title: '❤️ New Like on Reel',
      body: `${likerName} liked your reel`,
      actorId: likerId,
      reelId,
    });
  }

  /**
   * Send notification when someone comments on a reel
   */
  async notifyReelComment(
    reelAuthorId: string,
    commenterId: string,
    commenterName: string,
    reelId: string,
    commentId: string,
    commentPreview: string
  ): Promise<void> {
    await this.createNotification({
      userId: reelAuthorId,
      type: 'reel_comment',
      title: '💬 New Comment on Reel',
      body: `${commenterName} commented: "${commentPreview.slice(0, 50)}${commentPreview.length > 50 ? '...' : ''}"`,
      actorId: commenterId,
      reelId,
      commentId,
      data: { commentPreview },
    });
  }

  /**
   * Send notification when someone replies to a reel comment
   */
  async notifyReelCommentReply(
    originalCommenterId: string,
    replierId: string,
    replierName: string,
    reelId: string,
    commentId: string,
    replyPreview: string
  ): Promise<void> {
    await this.createNotification({
      userId: originalCommenterId,
      type: 'reel_comment_reply',
      title: '↩️ New Reply on Reel',
      body: `${replierName} replied: "${replyPreview.slice(0, 50)}${replyPreview.length > 50 ? '...' : ''}"`,
      actorId: replierId,
      reelId,
      commentId,
      data: { replyPreview },
    });
  }

  /**
   * Send notification when someone shares a reel
   */
  async notifyReelShare(
    reelAuthorId: string,
    sharerId: string,
    sharerName: string,
    reelId: string
  ): Promise<void> {
    await this.createNotification({
      userId: reelAuthorId,
      type: 'reel_share',
      title: '🔗 Reel Shared',
      body: `${sharerName} shared your reel`,
      actorId: sharerId,
      reelId,
    });
  }

  /**
   * Send notification for reel view milestones
   */
  async notifyReelViewMilestone(
    reelAuthorId: string,
    reelId: string,
    viewCount: number
  ): Promise<void> {
    const milestoneText = viewCount >= 1000000 
      ? `${(viewCount / 1000000).toFixed(1)}M` 
      : viewCount >= 1000 
      ? `${(viewCount / 1000).toFixed(1)}K` 
      : viewCount.toString();

    await this.createNotification({
      userId: reelAuthorId,
      type: 'reel_view_milestone',
      title: '🎉 Milestone Reached!',
      body: `Your reel reached ${milestoneText} views!`,
      reelId,
      data: { viewCount },
    });
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Mark notifications as read
   */
  async markAsRead(userId: string, notificationIds: string[]): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Delete old notifications (cleanup job)
   */
  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    });

    return result.count;
  }
}

export const notificationService = new NotificationService();
