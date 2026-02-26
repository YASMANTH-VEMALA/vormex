import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { prisma, disconnectPrisma } from './config/prisma';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import passwordRoutes from './routes/password.routes';
import oauthRoutes from './routes/oauth.routes';
import verificationRoutes from './routes/verification.routes';
import integrationsRoutes from './routes/integrations.routes';
import profileRoutes from './routes/profile.routes';
import professionalFieldsRoutes from './routes/professional-fields.routes';
import uploadRoutes from './routes/upload.routes';
import engagementRoutes from './routes/engagement.routes';
import storiesRoutes from './routes/stories.routes';
import feedRoutes from './routes/feed.routes';
import postRoutes from './routes/post.routes';
import savedRoutes from './routes/saved.routes';
import mentionsRoutes from './routes/mentions.routes';
import connectionRoutes from './routes/connection.routes';
import followRoutes from './routes/follow.routes';
import chatRoutes from './routes/chat.routes';
import peopleRoutes from './routes/people.routes';
import matchingRoutes from './routes/matching.routes';
import accountabilityRoutes from './routes/accountability.routes';
import groupsRoutes from './routes/groups.routes';
import onboardingRoutes from './routes/onboarding.routes';
import gamesRoutes from './routes/games.routes';
import locationRoutes from './routes/location.routes';
import socialProofRoutes from './routes/social-proof.routes';
import notificationsRoutes from './routes/notifications.routes';
import reportsRoutes from './routes/reports.routes';
import storeRoutes from './routes/store.routes';
import badgesRoutes from './routes/badges.routes';
import referralsRoutes from './routes/referrals.routes';
import learningRoutes from './routes/learning.routes';
import jobsRoutes from './routes/jobs.routes';
import interviewsRoutes from './routes/interviews.routes';
import challengesRoutes from './routes/challenges.routes';
import aiChatRoutes from './routes/ai-chat.routes';
import devicesRoutes from './routes/devices.routes';
import reelsRoutes from './routes/reels.routes';
import audioRoutes from './routes/audio.routes';
import dailyHooksRoutes from './routes/daily-hooks.routes';
import { setupSwagger } from './swagger';
import { setIO } from './sockets';

// Validate required environment variables
const requiredEnvVars = [
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GITHUB_CALLBACK_URL',
  'FRONTEND_URL',
  'ENCRYPTION_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Validate ENCRYPTION_KEY format (must be 64 hex characters)
if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length !== 64) {
  throw new Error('ENCRYPTION_KEY must be exactly 64 characters (32 bytes in hex)');
}

const app: Express = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.IO Setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [
      'http://localhost:3001',
      'http://localhost:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3000',
      'https://vormex.in',
      'https://www.vormex.in',
    ],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Share Socket.IO instance with controllers via the sockets module
setIO(io);

// Import JWT verification for socket auth
import { verifyToken } from './utils/jwt.util';

// Import activity service for engagement tracking
import { recordActivity } from './services/activity.service';
import { updateEngagementStreak } from './controllers/engagement.controller';

// Track user socket mappings
const userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds
const socketUsers = new Map<string, string>(); // socketId -> userId

// Helper to get userId from socket
const getSocketUserId = (socket: any): string | null => {
  return socketUsers.get(socket.id) || null;
};

// Helper to emit to user by userId (all their connected sockets)
const emitToUser = (userId: string, event: string, data: any) => {
  const userSocketIds = userSockets.get(userId);
  if (userSocketIds) {
    userSocketIds.forEach(socketId => {
      io.to(socketId).emit(event, data);
    });
  }
};

// User select for chat queries
const chatUserSelect = {
  id: true,
  username: true,
  name: true,
  profileImage: true,
  isOnline: true,
  lastActiveAt: true,
};

// Socket.IO connection handling
io.on('connection', async (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Handle authentication
  const token = socket.handshake.auth?.token;
  let userId: string | null = null;

  if (token) {
    try {
      const decoded = verifyToken(token);
      userId = String(decoded.userId);
      
      // Track socket-user mapping
      socketUsers.set(socket.id, userId);
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)!.add(socket.id);
      
      // Join user's personal room for notifications
      socket.join(`user:${userId}`);
      
      console.log(`✅ Socket ${socket.id} authenticated as user ${userId}`);
    } catch (error) {
      console.error('Socket auth failed:', error);
    }
  }

  // Post room events
  socket.on('post:join', ({ postId }) => {
    socket.join(`post:${postId}`);
  });

  socket.on('post:leave', ({ postId }) => {
    socket.leave(`post:${postId}`);
  });

  // Post like/react via WebSocket
  socket.on('post:react', async ({ postId, reactionType }) => {
    const reactorUserId = getSocketUserId(socket);
    if (!reactorUserId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const post = await prisma.post.findFirst({
        where: { id: postId, isActive: true },
        select: { id: true },
      });
      if (!post) {
        socket.emit('error', { message: 'Post not found' });
        return;
      }

      const existingLike = await prisma.postLike.findUnique({
        where: { postId_userId: { postId, userId: reactorUserId } },
      });

      let liked = false;
      if (existingLike) {
        await prisma.postLike.delete({
          where: { postId_userId: { postId, userId: reactorUserId } },
        });
        liked = false;
      } else {
        await prisma.postLike.create({
          data: { postId, userId: reactorUserId },
        });
        liked = true;
      }

      const likesCount = await prisma.postLike.count({ where: { postId } });
      await prisma.post.update({
        where: { id: postId },
        data: { likesCount },
      });

      // Broadcast to all users viewing the feed
      io.emit('post:reacted', {
        postId,
        userId: reactorUserId,
        liked,
        reactionType: liked ? reactionType : null,
        likesCount,
        reactionSummary: [],
      });

      console.log(`Post ${postId} ${liked ? 'liked' : 'unliked'} by user ${reactorUserId}`);
    } catch (error) {
      console.error('post:react error:', error);
      socket.emit('error', { message: 'Failed to react to post' });
    }
  });

  // Legacy post:like handler
  socket.on('post:like', async ({ postId }) => {
    const userId = getSocketUserId(socket);
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const post = await prisma.post.findFirst({
        where: { id: postId, isActive: true },
        select: { id: true },
      });
      if (!post) {
        socket.emit('error', { message: 'Post not found' });
        return;
      }

      const existingLike = await prisma.postLike.findUnique({
        where: { postId_userId: { postId, userId } },
      });

      let liked = false;
      if (existingLike) {
        await prisma.postLike.delete({
          where: { postId_userId: { postId, userId } },
        });
        liked = false;
      } else {
        await prisma.postLike.create({
          data: { postId, userId },
        });
        liked = true;
      }

      const likesCount = await prisma.postLike.count({ where: { postId } });
      await prisma.post.update({
        where: { id: postId },
        data: { likesCount },
      });

      io.emit('post:liked', {
        postId,
        userId,
        liked,
        likesCount,
        reactionType: liked ? 'LIKE' : null,
        reactionSummary: [],
      });

      console.log(`Post ${postId} ${liked ? 'liked' : 'unliked'} by user ${userId}`);
    } catch (error) {
      console.error('post:like error:', error);
      socket.emit('error', { message: 'Failed to like post' });
    }
  });

  // Post comment via WebSocket
  socket.on('post:comment', async ({ postId, content, parentId, mentions }) => {
    const userId = getSocketUserId(socket);
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      if (!content || typeof content !== 'string') {
        socket.emit('error', { message: 'Content is required' });
        return;
      }

      const post = await prisma.post.findFirst({
        where: { id: postId, isActive: true },
        select: { id: true, authorId: true },
      });
      if (!post) {
        socket.emit('error', { message: 'Post not found' });
        return;
      }

      const comment = await prisma.postComment.create({
        data: {
          postId,
          authorId: userId,
          parentId: parentId || null,
          content: content.trim(),
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              profileImage: true,
              headline: true,
            },
          },
          _count: { select: { replies: true } },
        },
      });

      const commentsCount = await prisma.postComment.count({ where: { postId, parentId: null } });
      await prisma.post.update({
        where: { id: postId },
        data: { commentsCount },
      });

      const mappedComment = {
        id: comment.id,
        postId: comment.postId,
        parentId: comment.parentId,
        author: comment.author,
        content: comment.content,
        contentType: 'text/plain',
        mentions: mentions || [],
        likesCount: comment.likesCount,
        replyCount: comment._count.replies,
        isLiked: false,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      };

      // Broadcast to users in the post room and globally for feed updates
      io.to(`post:${postId}`).emit('comment:created', {
        postId,
        comment: mappedComment,
        commentsCount,
      });

      // Also broadcast globally for feed comment count updates
      io.emit('comment:created', {
        postId,
        commentsCount,
      });

      // Send notification to post author (if not commenting on own post)
      if (post.authorId !== userId) {
        io.to(`user:${post.authorId}`).emit('notification:comment', {
          postId,
          comment: mappedComment,
          commentsCount,
        });
      }

      console.log(`Comment created on post ${postId} by user ${userId}`);
    } catch (error) {
      console.error('post:comment error:', error);
      socket.emit('error', { message: 'Failed to create comment' });
    }
  });

  // Comment like via WebSocket
  socket.on('comment:like', async ({ commentId, postId }) => {
    const userId = getSocketUserId(socket);
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const existing = await prisma.commentLike.findUnique({
        where: { commentId_userId: { commentId, userId } },
      });

      let liked = false;
      if (existing) {
        await prisma.commentLike.delete({
          where: { commentId_userId: { commentId, userId } },
        });
      } else {
        await prisma.commentLike.create({
          data: { commentId, userId },
        });
        liked = true;
      }

      const likesCount = await prisma.commentLike.count({ where: { commentId } });
      await prisma.postComment.update({
        where: { id: commentId },
        data: { likesCount },
      });

      io.to(`post:${postId}`).emit('comment:liked', {
        commentId,
        postId,
        userId,
        liked,
        likesCount,
      });

      console.log(`Comment ${commentId} ${liked ? 'liked' : 'unliked'} by user ${userId}`);
    } catch (error) {
      console.error('comment:like error:', error);
      socket.emit('error', { message: 'Failed to like comment' });
    }
  });

  // Poll vote via WebSocket
  socket.on('poll:vote', async ({ postId, optionId }) => {
    const userId = getSocketUserId(socket);
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      // For now, just broadcast - poll voting logic is simplified
      io.emit('poll:updated', {
        postId,
        voterId: userId,
        votedOptionId: optionId,
        pollOptions: [],
      });

      console.log(`Poll vote on post ${postId} by user ${userId}`);
    } catch (error) {
      console.error('poll:vote error:', error);
      socket.emit('error', { message: 'Failed to vote on poll' });
    }
  });

  // ============================================
  // CHAT SOCKET EVENTS
  // ============================================

  // Join chat room
  socket.on('chat:join', ({ conversationId }) => {
    socket.join(`chat:${conversationId}`);
    console.log(`Socket ${socket.id} joined chat:${conversationId}`);
  });

  // Leave chat room
  socket.on('chat:leave', ({ conversationId }) => {
    socket.leave(`chat:${conversationId}`);
  });

  // Send chat message
  socket.on('chat:send_message', async (data) => {
    const senderId = getSocketUserId(socket);
    if (!senderId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const { conversationId, content, contentType, mediaUrl, mediaType, fileName, fileSize, replyToId } = data;

      // Verify user is part of conversation
      const conversation = await prisma.conversations.findFirst({
        where: {
          id: conversationId,
          OR: [
            { participant1Id: senderId },
            { participant2Id: senderId },
          ],
        },
      });

      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      const receiverId = conversation.participant1Id === senderId
        ? conversation.participant2Id
        : conversation.participant1Id;

      // Create message in database
      const message = await prisma.messages.create({
        data: {
          id: crypto.randomUUID(),
          conversationId,
          senderId,
          receiverId,
          content: content || '',
          contentType: contentType || 'text',
          mediaUrl,
          mediaType,
          fileName,
          fileSize,
          replyToId,
          status: 'SENT',
          updatedAt: new Date(),
        },
        include: {
          messages: {
            select: {
              id: true,
              content: true,
              contentType: true,
              senderId: true,
            },
          },
        },
      });

      // Update conversation lastMessageAt
      await prisma.conversations.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date(), updatedAt: new Date() },
      });

      // Get sender info
      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: chatUserSelect,
      });

      const messagePayload = {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        contentType: message.contentType,
        mediaUrl: message.mediaUrl,
        mediaType: message.mediaType,
        fileName: message.fileName,
        fileSize: message.fileSize,
        status: message.status,
        deliveredAt: message.deliveredAt?.toISOString(),
        readAt: message.readAt?.toISOString(),
        isDeleted: message.isDeleted,
        replyToId: message.replyToId,
        replyTo: (message as typeof message & { messages: unknown }).messages,
        sender,
        reactions: [],
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
      };

      // Broadcast to conversation room
      io.to(`chat:${conversationId}`).emit('chat:new_message', {
        conversationId,
        message: messagePayload,
      });

      // Also emit to receiver's personal room (for notifications when not in chat)
      emitToUser(receiverId, 'chat:notification', {
        type: 'new_message',
        conversationId,
        message: messagePayload,
        sender,
      });

      // Record messaging activity and update streak (non-blocking)
      recordActivity(senderId, 'message', 1).catch(console.error);
      updateEngagementStreak(senderId, 'messaging').catch(console.error);

      console.log(`Message sent in conversation ${conversationId} by user ${senderId}`);
    } catch (error) {
      console.error('chat:send_message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('chat:typing', async ({ conversationId, isTyping }) => {
    const userId = getSocketUserId(socket);
    if (!userId) return;

    socket.to(`chat:${conversationId}`).emit('chat:user_typing', {
      conversationId,
      userId,
      isTyping,
    });
  });

  // Mark messages as read
  socket.on('chat:mark_read', async ({ conversationId }) => {
    const userId = getSocketUserId(socket);
    if (!userId) return;

    try {
      const now = new Date();
      
      // Get conversation to find sender
      const conversation = await prisma.conversations.findFirst({
        where: {
          id: conversationId,
          OR: [
            { participant1Id: userId },
            { participant2Id: userId },
          ],
        },
      });

      if (!conversation) return;

      const senderId = conversation.participant1Id === userId
        ? conversation.participant2Id
        : conversation.participant1Id;

      // Update unread messages
      await prisma.messages.updateMany({
        where: {
          conversationId,
          receiverId: userId,
          status: { not: 'READ' },
        },
        data: {
          status: 'READ',
          readAt: now,
          updatedAt: now,
        },
      });

      // Notify sender that messages were read
      io.to(`chat:${conversationId}`).emit('chat:messages_read', {
        conversationId,
        readBy: userId,
        readAt: now,
      });

      // Also notify sender directly
      emitToUser(senderId, 'chat:messages_read', {
        conversationId,
        readBy: userId,
        readAt: now,
      });
    } catch (error) {
      console.error('chat:mark_read error:', error);
    }
  });

  // Delete message
  socket.on('chat:delete_message', async ({ messageId, conversationId, forEveryone }) => {
    const userId = getSocketUserId(socket);
    if (!userId) return;

    try {
      const message = await prisma.messages.findUnique({
        where: { id: messageId },
      });

      if (!message || message.senderId !== userId) {
        socket.emit('error', { message: 'Cannot delete this message' });
        return;
      }

      if (forEveryone) {
        await prisma.messages.update({
          where: { id: messageId },
          data: { isDeleted: true, content: '', updatedAt: new Date() },
        });
      } else {
        await prisma.messages.delete({
          where: { id: messageId },
        });
      }

      // Broadcast deletion
      io.to(`chat:${conversationId}`).emit('chat:message_deleted', {
        messageId,
        conversationId,
        deletedBy: userId,
        forEveryone,
      });
    } catch (error) {
      console.error('chat:delete_message error:', error);
    }
  });

  // Edit message
  socket.on('chat:edit_message', async ({ messageId, conversationId, content }) => {
    const userId = getSocketUserId(socket);
    if (!userId) return;

    try {
      const message = await prisma.messages.findUnique({
        where: { id: messageId },
      });

      if (!message || message.senderId !== userId) {
        socket.emit('error', { message: 'Cannot edit this message' });
        return;
      }

      const updated = await prisma.messages.update({
        where: { id: messageId },
        data: { content, updatedAt: new Date() },
      });

      // Broadcast edit
      io.to(`chat:${conversationId}`).emit('chat:message_edited', {
        messageId,
        conversationId,
        content,
        editedAt: updated.updatedAt,
      });
    } catch (error) {
      console.error('chat:edit_message error:', error);
    }
  });

  // React to message
  socket.on('chat:react', async ({ messageId, conversationId, emoji }) => {
    const userId = getSocketUserId(socket);
    if (!userId) return;

    try {
      const existingReaction = await prisma.message_reactions.findUnique({
        where: {
          messageId_userId: { messageId, userId },
        },
      });

      let action: string;

      if (existingReaction) {
        if (existingReaction.emoji === emoji) {
          await prisma.message_reactions.delete({
            where: { id: existingReaction.id },
          });
          action = 'removed';
        } else {
          await prisma.message_reactions.update({
            where: { id: existingReaction.id },
            data: { emoji },
          });
          action = 'updated';
        }
      } else {
        await prisma.message_reactions.create({
          data: { id: crypto.randomUUID(), messageId, userId, emoji },
        });
        action = 'added';
      }

      // Broadcast reaction
      io.to(`chat:${conversationId}`).emit('chat:message_reaction', {
        messageId,
        conversationId,
        userId,
        emoji,
        action,
      });
    } catch (error) {
      console.error('chat:react error:', error);
    }
  });

  // ============================================
  // GROUP CHAT SOCKET EVENTS
  // ============================================

  // Track group online counts
  const groupOnlineCounts = new Map<string, Set<string>>();

  // Join group chat room
  socket.on('group:join', async ({ groupId }) => {
    const userId = getSocketUserId(socket);
    if (!userId) return;

    // Verify user is member of group
    const membership = await prisma.group_members.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
    });

    if (!membership) {
      socket.emit('error', { message: 'Not a member of this group' });
      return;
    }

    socket.join(`group:${groupId}`);

    // Track online users
    if (!groupOnlineCounts.has(groupId)) {
      groupOnlineCounts.set(groupId, new Set());
    }
    groupOnlineCounts.get(groupId)!.add(userId);

    const onlineCount = groupOnlineCounts.get(groupId)!.size;

    // Notify group of new user
    io.to(`group:${groupId}`).emit('group:user_joined', {
      groupId,
      userId,
      onlineCount,
    });

    console.log(`User ${userId} joined group:${groupId}`);
  });

  // Leave group chat room
  socket.on('group:leave', ({ groupId }) => {
    const userId = getSocketUserId(socket);
    if (!userId) return;

    socket.leave(`group:${groupId}`);

    // Update online count
    if (groupOnlineCounts.has(groupId)) {
      groupOnlineCounts.get(groupId)!.delete(userId);
      const onlineCount = groupOnlineCounts.get(groupId)!.size;
      
      io.to(`group:${groupId}`).emit('group:user_left', {
        groupId,
        userId,
        onlineCount,
      });
    }
  });

  // Group typing indicator
  socket.on('group:typing', async ({ groupId, isTyping }) => {
    const userId = getSocketUserId(socket);
    if (!userId) return;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: chatUserSelect,
    });

    socket.to(`group:${groupId}`).emit('group:user_typing', {
      groupId,
      user,
      isTyping,
    });
  });

  // Send group message
  socket.on('group:message', async (data) => {
    const userId = getSocketUserId(socket);
    if (!userId) return;

    try {
      const { groupId, content, contentType, mediaUrl, mediaType, fileName, fileSize, replyToId, tempId } = data;

      // Verify membership
      const membership = await prisma.group_members.findUnique({
        where: {
          groupId_userId: { groupId, userId },
        },
      });

      if (!membership) {
        socket.emit('error', { message: 'Not a member of this group' });
        return;
      }

      // Create message in database
      const message = await prisma.group_messages.create({
        data: {
          id: crypto.randomUUID(),
          groupId,
          senderId: userId,
          content: content || '',
          contentType: contentType || 'text',
          mediaUrl,
          mediaType,
          fileName,
          fileSize,
          replyToId,
          updatedAt: new Date(),
        },
        include: {
          users: {
            select: chatUserSelect,
          },
          group_messages: {
            select: {
              id: true,
              content: true,
              senderId: true,
            },
          },
        },
      });

      const messagePayload = {
        id: message.id,
        groupId: message.groupId,
        senderId: message.senderId,
        sender: (message as typeof message & { users: unknown }).users,
        content: message.content,
        contentType: message.contentType,
        mediaUrl: message.mediaUrl,
        mediaType: message.mediaType,
        fileName: message.fileName,
        fileSize: message.fileSize,
        replyToId: message.replyToId,
        replyTo: (message as typeof message & { group_messages: unknown }).group_messages,
        reactions: [],
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
        tempId,
      };

      // Broadcast to group
      io.to(`group:${groupId}`).emit('group:new_message', messagePayload);

      console.log(`Group message sent in ${groupId} by user ${userId}`);
    } catch (error) {
      console.error('group:message error:', error);
      socket.emit('error', { message: 'Failed to send group message' });
    }
  });

  // Delete group message
  socket.on('group:delete_message', async ({ groupId, messageId }) => {
    const userId = getSocketUserId(socket);
    if (!userId) return;

    // Broadcast deletion
    io.to(`group:${groupId}`).emit('group:message_deleted', {
      groupId,
      messageId,
      deletedBy: userId,
    });
  });

  // ============================================
  // REELS SOCKET EVENTS
  // ============================================

  // Join reel room (for live engagement updates)
  socket.on('reel:join', ({ reelId }) => {
    socket.join(`reel:${reelId}`);
  });

  // Leave reel room
  socket.on('reel:leave', ({ reelId }) => {
    socket.leave(`reel:${reelId}`);
  });

  // Reel like via WebSocket
  socket.on('reel:like', async ({ reelId }) => {
    const userId = getSocketUserId(socket);
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const reel = await prisma.reels.findUnique({
        where: { id: reelId },
        select: { id: true, authorId: true },
      });

      if (!reel) {
        socket.emit('error', { message: 'Reel not found' });
        return;
      }

      const existingLike = await prisma.reel_likes.findUnique({
        where: { reelId_userId: { reelId, userId } },
      });

      let liked = false;
      if (existingLike) {
        await prisma.reel_likes.delete({
          where: { reelId_userId: { reelId, userId } },
        });
      } else {
        await prisma.reel_likes.create({
          data: { reelId, userId },
        });
        liked = true;
      }

      const likesCount = await prisma.reel_likes.count({ where: { reelId } });
      await prisma.reels.update({
        where: { id: reelId },
        data: { likesCount },
      });

      // Broadcast to all viewers of this reel
      io.emit('reel:liked', { reelId, userId, liked, likesCount });

      // Notify reel author
      if (liked && reel.authorId !== userId) {
        io.to(`user:${reel.authorId}`).emit('notification:reel_like', {
          reelId,
          likerId: userId,
          likesCount,
        });
      }

      console.log(`Reel ${reelId} ${liked ? 'liked' : 'unliked'} by user ${userId}`);
    } catch (error) {
      console.error('reel:like error:', error);
      socket.emit('error', { message: 'Failed to like reel' });
    }
  });

  // Reel comment via WebSocket
  socket.on('reel:comment', async ({ reelId, content, parentId }) => {
    const userId = getSocketUserId(socket);
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      if (!content || typeof content !== 'string') {
        socket.emit('error', { message: 'Content is required' });
        return;
      }

      const reel = await prisma.reels.findUnique({
        where: { id: reelId },
        select: { id: true, authorId: true, allowComments: true },
      });

      if (!reel) {
        socket.emit('error', { message: 'Reel not found' });
        return;
      }

      if (!reel.allowComments) {
        socket.emit('error', { message: 'Comments are disabled' });
        return;
      }

      const comment = await prisma.reel_comments.create({
        data: {
          reelId,
          authorId: userId,
          content: content.trim(),
          parentId: parentId || null,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              profileImage: true,
            },
          },
        },
      });

      const commentsCount = await prisma.reel_comments.count({
        where: { reelId, parentId: null },
      });
      await prisma.reels.update({
        where: { id: reelId },
        data: { commentsCount },
      });

      const commentPayload = {
        id: comment.id,
        reelId: comment.reelId,
        author: comment.author,
        content: comment.content,
        parentId: comment.parentId,
        createdAt: comment.createdAt,
      };

      // Broadcast to all viewers
      io.emit('reel:commented', { reelId, comment: commentPayload, commentsCount });

      // Notify reel author
      if (reel.authorId !== userId) {
        io.to(`user:${reel.authorId}`).emit('notification:reel_comment', {
          reelId,
          comment: commentPayload,
        });
      }

      console.log(`Reel comment on ${reelId} by user ${userId}`);
    } catch (error) {
      console.error('reel:comment error:', error);
      socket.emit('error', { message: 'Failed to comment on reel' });
    }
  });

  // ============================================
  // OTHER EVENTS
  // ============================================

  // Story view - record view and notify story author for live view count
  socket.on('story:view', async ({ storyId, duration }: { storyId: string; duration?: number }) => {
    const viewerUserId = getSocketUserId(socket);
    if (!viewerUserId) return;

    try {
      const story = await prisma.stories.findFirst({
        where: { id: storyId, expiresAt: { gt: new Date() } },
        select: { id: true, authorId: true, viewsCount: true },
      });
      if (!story) return;

      // Don't count own views
      if (story.authorId === viewerUserId) return;

      const newViewsCount = story.viewsCount + 1;
      await prisma.stories.update({
        where: { id: storyId },
        data: { viewsCount: newViewsCount },
      });

      // Notify story author for live view count update
      io.to(`user:${story.authorId}`).emit('story:viewed', {
        storyId,
        viewsCount: newViewsCount,
      });
    } catch (err) {
      console.error('story:view error:', err);
    }
  });

  // Location update
  socket.on('location:update', (data) => {
    const userId = getSocketUserId(socket);
    socket.broadcast.emit('user:location_changed', {
      userId: userId || socket.id,
      ...data,
    });
  });

  socket.on('disconnect', (reason) => {
    const userId = socketUsers.get(socket.id);
    
    if (userId) {
      // Remove from user sockets
      userSockets.get(userId)?.delete(socket.id);
      if (userSockets.get(userId)?.size === 0) {
        userSockets.delete(userId);
      }
      socketUsers.delete(socket.id);

      // Update online counts for any groups
      groupOnlineCounts.forEach((users, groupId) => {
        if (users.has(userId)) {
          users.delete(userId);
          io.to(`group:${groupId}`).emit('group:user_left', {
            groupId,
            userId,
            onlineCount: users.size,
          });
        }
      });
    }

    console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
  });
});

// Middleware
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3000',
  'https://vormex.in',
  'https://www.vormex.in',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    // Allow local network IPs (e.g. 172.20.10.3:3000, 192.168.x.x:3000)
    if (/^https?:\/\/(172\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}):(3000|3001)$/.test(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Health check endpoint
 * Tests database connection and returns server status
 */
app.get('/api/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Test Prisma connection
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'ok',
      timestamp: Date.now(),
      database: 'connected',
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(503).json({
      status: 'error',
      timestamp: Date.now(),
      database: 'disconnected',
      message: 'Database connection failed',
    });
  }
});

// API Documentation (Swagger UI)
setupSwagger(app);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordRoutes);
app.use('/api/auth', oauthRoutes);
app.use('/api/auth', verificationRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api', profileRoutes);
app.use('/api', professionalFieldsRoutes);
app.use('/api', uploadRoutes);
app.use('/api/engagement', engagementRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/mentions', mentionsRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/accountability', accountabilityRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/social-proof', socialProofRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/interviews', interviewsRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/ai/chat', aiChatRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/reels', reelsRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/daily-hooks', dailyHooksRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start scheduled publish service
import { startScheduledPublishScheduler, stopScheduledPublishScheduler } from './services/scheduled-publish.service';
startScheduledPublishScheduler();

// Start server
const server = httpServer.listen(PORT, (): void => {
  console.log(`
🚀 Server is running!
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server URL: http://localhost:${PORT}
📊 Health Check: http://localhost:${PORT}/api/health
📚 API Docs: http://localhost:${PORT}/api-docs
🔌 WebSocket: ws://localhost:${PORT}
  `);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close(async (): Promise<void> => {
    console.log('HTTP server closed.');
    stopScheduledPublishScheduler();

    try {
      await disconnectPrisma();
      console.log('Database connection closed.');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
