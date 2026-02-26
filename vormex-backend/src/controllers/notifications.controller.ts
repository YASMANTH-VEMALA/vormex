import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { ensureString } from '../utils/request.util';
import { notificationService } from '../services/notification.service';

interface AuthRequest extends Request {
  user?: { userId: string };
}

// Get notifications with pagination
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const cursor = ensureString(req.query.cursor);
    const limit = parseInt(ensureString(req.query.limit) || '20') || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const whereClause: any = { userId };
    
    if (unreadOnly) {
      whereClause.isRead = false;
    }
    
    if (cursor) {
      whereClause.createdAt = { lt: new Date(cursor) };
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
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
            caption: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = notifications.length > limit;
    const results = hasMore ? notifications.slice(0, -1) : notifications;

    const formatted = results.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      actor: n.actor,
      post: n.post,
      reel: n.reel,
      data: n.data,
      isRead: n.isRead,
      readAt: n.readAt?.toISOString() || null,
      createdAt: n.createdAt.toISOString(),
    }));

    res.json({
      notifications: formatted,
      nextCursor: hasMore && results.length > 0
        ? results[results.length - 1].createdAt.toISOString()
        : null,
      hasMore,
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Get unread count
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const count = await notificationService.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

// Mark notifications as read
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      res.status(400).json({ error: 'notificationIds must be a non-empty array' });
      return;
    }

    await notificationService.markAsRead(userId, notificationIds);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await notificationService.markAllAsRead(userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

// Delete a notification
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const notificationId = ensureString(req.params.notificationId);
    if (!notificationId) {
      res.status(400).json({ error: 'Notification ID is required' });
      return;
    }

    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

// Get notification settings (placeholder for future)
export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Default settings - can be stored in user preferences later
    res.json({
      settings: {
        likes: true,
        comments: true,
        mentions: true,
        follows: true,
        reelLikes: true,
        reelComments: true,
        reelShares: true,
        messages: true,
        streaks: true,
        email: false,
        push: true,
      },
    });
  } catch (error) {
    console.error('Failed to fetch notification settings:', error);
    res.status(500).json({ error: 'Failed to fetch notification settings' });
  }
};
