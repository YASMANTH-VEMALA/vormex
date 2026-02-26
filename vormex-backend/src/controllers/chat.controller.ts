import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { ensureString } from '../utils/request.util';

interface AuthRequest extends Request {
  user?: { userId: string };
}

const userSelect = {
  id: true,
  username: true,
  name: true,
  profileImage: true,
  isOnline: true,
  lastActiveAt: true,
};

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;

    const whereClause: any = {
      OR: [
        { participant1Id: req.user.userId },
        { participant2Id: req.user.userId },
      ],
    };

    if (cursor) {
      whereClause.lastMessageAt = { lt: new Date(cursor) };
    }

    const conversations = await prisma.conversations.findMany({
      where: whereClause,
      include: {
        users_conversations_participant1IdTousers: { select: userSelect },
        users_conversations_participant2IdTousers: { select: userSelect },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            contentType: true,
            senderId: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = conversations.length > limit;
    const results = hasMore ? conversations.slice(0, -1) : conversations;

    const formatted = await Promise.all(
      results.map(async (conv) => {
        const convWithRelations = conv as typeof conv & { users_conversations_participant1IdTousers: unknown; users_conversations_participant2IdTousers: unknown; messages: unknown[] };
        const otherParticipant =
          conv.participant1Id === req.user!.userId ? convWithRelations.users_conversations_participant2IdTousers : convWithRelations.users_conversations_participant1IdTousers;
        
        const unreadCount = await prisma.messages.count({
          where: {
            conversationId: conv.id,
            receiverId: req.user!.userId,
            status: { not: 'READ' },
          },
        });

        return {
          id: conv.id,
          participant1Id: conv.participant1Id,
          participant2Id: conv.participant2Id,
          participant1: convWithRelations.users_conversations_participant1IdTousers,
          participant2: convWithRelations.users_conversations_participant2IdTousers,
          otherParticipant,
          lastMessage: convWithRelations.messages[0] || null,
          lastMessageAt: conv.lastMessageAt?.toISOString() || null,
          unreadCount,
          createdAt: conv.createdAt.toISOString(),
          updatedAt: conv.updatedAt.toISOString(),
        };
      })
    );

    res.status(200).json({
      conversations: formatted,
      hasMore,
      nextCursor: hasMore && results.length > 0
        ? results[results.length - 1].lastMessageAt?.toISOString()
        : undefined,
    });
  } catch (error) {
    console.error('getConversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
};

export const getOrCreateConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { participantId } = req.body;

    if (!participantId) {
      res.status(400).json({ error: 'Participant ID is required' });
      return;
    }

    if (participantId === req.user.userId) {
      res.status(400).json({ error: 'Cannot create conversation with yourself' });
      return;
    }

    const participant = await prisma.user.findUnique({
      where: { id: participantId },
      select: userSelect,
    });

    if (!participant) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let conversation = await prisma.conversations.findFirst({
      where: {
        OR: [
          { participant1Id: req.user.userId, participant2Id: participantId },
          { participant1Id: participantId, participant2Id: req.user.userId },
        ],
      },
      include: {
        users_conversations_participant1IdTousers: { select: userSelect },
        users_conversations_participant2IdTousers: { select: userSelect },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            contentType: true,
            senderId: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversations.create({
        data: {
          id: crypto.randomUUID(),
          participant1Id: req.user.userId,
          participant2Id: participantId,
          updatedAt: new Date(),
        },
        include: {
          users_conversations_participant1IdTousers: { select: userSelect },
          users_conversations_participant2IdTousers: { select: userSelect },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              content: true,
              contentType: true,
              senderId: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });
    }

    const convWithRelations = conversation as typeof conversation & { users_conversations_participant1IdTousers: unknown; users_conversations_participant2IdTousers: unknown; messages: unknown[] };
    const otherParticipant =
      conversation.participant1Id === req.user.userId
        ? convWithRelations.users_conversations_participant2IdTousers
        : convWithRelations.users_conversations_participant1IdTousers;

    res.status(200).json({
      id: conversation.id,
      participant1Id: conversation.participant1Id,
      participant2Id: conversation.participant2Id,
      participant1: convWithRelations.users_conversations_participant1IdTousers,
      participant2: convWithRelations.users_conversations_participant2IdTousers,
      otherParticipant,
      lastMessage: convWithRelations.messages[0] || null,
      lastMessageAt: conversation.lastMessageAt?.toISOString() || null,
      unreadCount: 0,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('getOrCreateConversation error:', error);
    res.status(500).json({ error: 'Failed to get or create conversation' });
  }
};

export const getConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversationId = ensureString(req.params.conversationId);
    if (!conversationId) {
      res.status(400).json({ error: 'Conversation ID is required' });
      return;
    }

    const conversation = await prisma.conversations.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participant1Id: req.user.userId },
          { participant2Id: req.user.userId },
        ],
      },
      include: {
        users_conversations_participant1IdTousers: { select: userSelect },
        users_conversations_participant2IdTousers: { select: userSelect },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            contentType: true,
            senderId: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const convWithRelations = conversation as typeof conversation & { users_conversations_participant1IdTousers: unknown; users_conversations_participant2IdTousers: unknown; messages: unknown[] };
    const otherParticipant =
      conversation.participant1Id === req.user.userId
        ? convWithRelations.users_conversations_participant2IdTousers
        : convWithRelations.users_conversations_participant1IdTousers;

    const unreadCount = await prisma.messages.count({
      where: {
        conversationId: conversation.id,
        receiverId: req.user.userId,
        status: { not: 'READ' },
      },
    });

    res.status(200).json({
      id: conversation.id,
      participant1Id: conversation.participant1Id,
      participant2Id: conversation.participant2Id,
      participant1: convWithRelations.users_conversations_participant1IdTousers,
      participant2: convWithRelations.users_conversations_participant2IdTousers,
      otherParticipant,
      lastMessage: convWithRelations.messages[0] || null,
      lastMessageAt: conversation.lastMessageAt?.toISOString() || null,
      unreadCount,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('getConversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversationId = ensureString(req.params.conversationId);
    if (!conversationId) {
      res.status(400).json({ error: 'Conversation ID is required' });
      return;
    }
    const limit = parseInt(ensureString(req.query.limit) || '50') || 50;
    const cursor = ensureString(req.query.cursor);

    const conversation = await prisma.conversations.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participant1Id: req.user.userId },
          { participant2Id: req.user.userId },
        ],
      },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const whereClause: any = { conversationId };
    if (cursor) {
      whereClause.createdAt = { lt: new Date(cursor) };
    }

    const messages = await prisma.messages.findMany({
      where: whereClause,
      include: {
        message_reactions: true,
        messages: {
          select: {
            id: true,
            content: true,
            contentType: true,
            senderId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const results = hasMore ? messages.slice(0, -1) : messages;

    const sender = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: userSelect,
    });

    const formatted = results.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      content: msg.content,
      contentType: msg.contentType,
      mediaUrl: msg.mediaUrl,
      mediaType: msg.mediaType,
      fileName: msg.fileName,
      fileSize: msg.fileSize,
      status: msg.status,
      deliveredAt: msg.deliveredAt?.toISOString(),
      readAt: msg.readAt?.toISOString(),
      isDeleted: msg.isDeleted,
      replyToId: msg.replyToId,
      replyTo: (msg as typeof msg & { messages: unknown }).messages,
      sender: sender,
      reactions: (msg as typeof msg & { message_reactions: { id: string; userId: string; emoji: string }[] }).message_reactions.map((r) => ({
        id: r.id,
        userId: r.userId,
        emoji: r.emoji,
        user: { id: r.userId, username: '', name: '' },
      })),
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
    }));

    res.status(200).json({
      messages: formatted.reverse(),
      hasMore,
      nextCursor: hasMore && results.length > 0
        ? results[results.length - 1].createdAt.toISOString()
        : undefined,
    });
  } catch (error) {
    console.error('getMessages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversationId = ensureString(req.params.conversationId);
    if (!conversationId) {
      res.status(400).json({ error: 'Conversation ID is required' });
      return;
    }
    const { content, contentType, mediaUrl, mediaType, fileName, fileSize, replyToId } = req.body;

    if (!content && !mediaUrl) {
      res.status(400).json({ error: 'Content or media is required' });
      return;
    }

    const conversation = await prisma.conversations.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participant1Id: req.user.userId },
          { participant2Id: req.user.userId },
        ],
      },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const receiverId =
      conversation.participant1Id === req.user.userId
        ? conversation.participant2Id
        : conversation.participant1Id;

    const message = await prisma.messages.create({
      data: {
        id: crypto.randomUUID(),
        conversationId: conversationId,
        senderId: req.user.userId,
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

    await prisma.conversations.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date(), updatedAt: new Date() },
    });

    const sender = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: userSelect,
    });

    res.status(201).json({
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
    });
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversationId = ensureString(req.params.conversationId);
    if (!conversationId) {
      res.status(400).json({ error: 'Conversation ID is required' });
      return;
    }
    const now = new Date();

    const result = await prisma.messages.updateMany({
      where: {
        conversationId,
        receiverId: req.user.userId,
        status: { not: 'READ' },
      },
      data: {
        status: 'READ',
        readAt: now,
        updatedAt: now,
      },
    });

    res.status(200).json({
      updatedCount: result.count,
      readAt: now.toISOString(),
    });
  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};

export const deleteMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const messageId = ensureString(req.params.messageId);
    if (!messageId) {
      res.status(400).json({ error: 'Message ID is required' });
      return;
    }
    const { forEveryone } = req.body;

    const message = await prisma.messages.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    if (message.senderId !== req.user.userId) {
      res.status(403).json({ error: 'Not authorized to delete this message' });
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

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('deleteMessage error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

export const editMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const messageId = ensureString(req.params.messageId);
    if (!messageId) {
      res.status(400).json({ error: 'Message ID is required' });
      return;
    }
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const message = await prisma.messages.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    if (message.senderId !== req.user.userId) {
      res.status(403).json({ error: 'Not authorized to edit this message' });
      return;
    }

    const updated = await prisma.messages.update({
      where: { id: messageId },
      data: { content, updatedAt: new Date() },
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

    const sender = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: userSelect,
    });

    res.status(200).json({
      id: updated.id,
      conversationId: updated.conversationId,
      senderId: updated.senderId,
      receiverId: updated.receiverId,
      content: updated.content,
      contentType: updated.contentType,
      mediaUrl: updated.mediaUrl,
      mediaType: updated.mediaType,
      fileName: updated.fileName,
      fileSize: updated.fileSize,
      status: updated.status,
      deliveredAt: updated.deliveredAt?.toISOString(),
      readAt: updated.readAt?.toISOString(),
      isDeleted: updated.isDeleted,
      replyToId: updated.replyToId,
      replyTo: (updated as typeof updated & { messages: unknown }).messages,
      sender,
      reactions: [],
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('editMessage error:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
};

export const addReaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const messageId = ensureString(req.params.messageId);
    if (!messageId) {
      res.status(400).json({ error: 'Message ID is required' });
      return;
    }
    const { emoji } = req.body;

    if (!emoji) {
      res.status(400).json({ error: 'Emoji is required' });
      return;
    }

    const message = await prisma.messages.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    const existingReaction = await prisma.message_reactions.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId: req.user.userId,
        },
      },
    });

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        await prisma.message_reactions.delete({
          where: { id: existingReaction.id },
        });
        res.status(200).json({ action: 'removed', emoji });
        return;
      } else {
        await prisma.message_reactions.update({
          where: { id: existingReaction.id },
          data: { emoji },
        });
        res.status(200).json({ action: 'updated', emoji });
        return;
      }
    }

    await prisma.message_reactions.create({
      data: {
        id: crypto.randomUUID(),
        messageId,
        userId: req.user.userId,
        emoji,
      },
    });

    res.status(200).json({ action: 'added', emoji });
  } catch (error) {
    console.error('addReaction error:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const unreadCount = await prisma.messages.count({
      where: {
        receiverId: req.user.userId,
        status: { not: 'READ' },
      },
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

export const searchMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const query = ensureString(req.query.q);
    const limit = parseInt(ensureString(req.query.limit) || '20') || 20;

    if (!query) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const conversations = await prisma.conversations.findMany({
      where: {
        OR: [
          { participant1Id: req.user.userId },
          { participant2Id: req.user.userId },
        ],
      },
      select: { id: true },
    });

    const conversationIds = conversations.map((c) => c.id);

    const messages = await prisma.messages.findMany({
      where: {
        conversationId: { in: conversationIds },
        content: { contains: query, mode: 'insensitive' },
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.status(200).json({ messages });
  } catch (error) {
    console.error('searchMessages error:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
};

export const getMessageLimitStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = ensureString(req.params.userId);
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const isConnected = await prisma.connections.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { requesterId: req.user.userId, addresseeId: userId },
          { requesterId: userId, addresseeId: req.user.userId },
        ],
      },
    });

    if (isConnected) {
      res.status(200).json({
        canSend: true,
        isConnected: true,
        messagesSent: 0,
        messagesRemaining: -1,
        limit: -1,
      });
      return;
    }

    const messagesSent = await prisma.messages.count({
      where: {
        senderId: req.user.userId,
        receiverId: userId,
      },
    });

    const limit = 2;
    const canSend = messagesSent < limit;

    res.status(200).json({
      canSend,
      isConnected: false,
      messagesSent,
      messagesRemaining: Math.max(0, limit - messagesSent),
      limit,
    });
  } catch (error) {
    console.error('getMessageLimitStatus error:', error);
    res.status(500).json({ error: 'Failed to get message limit status' });
  }
};

export const getMessageRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;

    const myConnectionIds = await prisma.connections.findMany({
      where: {
        status: 'accepted',
        OR: [
          { requesterId: req.user.userId },
          { addresseeId: req.user.userId },
        ],
      },
      select: { requesterId: true, addresseeId: true },
    });

    const connectedUserIds = new Set(
      myConnectionIds.flatMap((c) => [c.requesterId, c.addresseeId])
    );
    connectedUserIds.delete(req.user.userId);

    const whereClause: any = {
      OR: [
        { participant1Id: req.user.userId },
        { participant2Id: req.user.userId },
      ],
    };

    if (cursor) {
      whereClause.lastMessageAt = { lt: new Date(cursor) };
    }

    const conversations = await prisma.conversations.findMany({
      where: whereClause,
      include: {
        users_conversations_participant1IdTousers: { select: userSelect },
        users_conversations_participant2IdTousers: { select: userSelect },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: limit + 1,
    });

    const messageRequests = conversations.filter((conv) => {
      const otherId =
        conv.participant1Id === req.user!.userId
          ? conv.participant2Id
          : conv.participant1Id;
      return !connectedUserIds.has(otherId);
    });

    const hasMore = messageRequests.length > limit;
    const results = hasMore ? messageRequests.slice(0, -1) : messageRequests;

    const formatted = results.map((conv) => {
      const convWithRelations = conv as typeof conv & { users_conversations_participant1IdTousers: unknown; users_conversations_participant2IdTousers: unknown; messages: unknown[] };
      const otherParticipant =
        conv.participant1Id === req.user!.userId
          ? convWithRelations.users_conversations_participant2IdTousers
          : convWithRelations.users_conversations_participant1IdTousers;

      return {
        id: conv.id,
        participant1Id: conv.participant1Id,
        participant2Id: conv.participant2Id,
        participant1: convWithRelations.users_conversations_participant1IdTousers,
        participant2: convWithRelations.users_conversations_participant2IdTousers,
        otherParticipant,
        lastMessage: convWithRelations.messages[0] || null,
        lastMessageAt: conv.lastMessageAt?.toISOString() || null,
        unreadCount: 0,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
        isMessageRequest: true,
        messageRequestAcceptedAt: null,
      };
    });

    res.status(200).json({
      messageRequests: formatted,
      hasMore,
      nextCursor: hasMore && results.length > 0
        ? results[results.length - 1].lastMessageAt?.toISOString()
        : undefined,
    });
  } catch (error) {
    console.error('getMessageRequests error:', error);
    res.status(500).json({ error: 'Failed to get message requests' });
  }
};

export const getMessageRequestsCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const myConnectionIds = await prisma.connections.findMany({
      where: {
        status: 'accepted',
        OR: [
          { requesterId: req.user.userId },
          { addresseeId: req.user.userId },
        ],
      },
      select: { requesterId: true, addresseeId: true },
    });

    const connectedUserIds = new Set(
      myConnectionIds.flatMap((c) => [c.requesterId, c.addresseeId])
    );
    connectedUserIds.delete(req.user.userId);

    const conversations = await prisma.conversations.findMany({
      where: {
        OR: [
          { participant1Id: req.user.userId },
          { participant2Id: req.user.userId },
        ],
      },
      select: { participant1Id: true, participant2Id: true },
    });

    const requestCount = conversations.filter((conv) => {
      const otherId =
        conv.participant1Id === req.user!.userId
          ? conv.participant2Id
          : conv.participant1Id;
      return !connectedUserIds.has(otherId);
    }).length;

    res.status(200).json({ count: requestCount });
  } catch (error) {
    console.error('getMessageRequestsCount error:', error);
    res.status(500).json({ error: 'Failed to get message requests count' });
  }
};

export const acceptMessageRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversationId = ensureString(req.params.conversationId);
    if (!conversationId) {
      res.status(400).json({ error: 'Conversation ID is required' });
      return;
    }

    const conversation = await prisma.conversations.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participant1Id: req.user.userId },
          { participant2Id: req.user.userId },
        ],
      },
      include: {
        users_conversations_participant1IdTousers: { select: userSelect },
        users_conversations_participant2IdTousers: { select: userSelect },
      },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const convWithRelations = conversation as typeof conversation & { users_conversations_participant1IdTousers: unknown; users_conversations_participant2IdTousers: unknown };
    const otherParticipant =
      conversation.participant1Id === req.user.userId
        ? convWithRelations.users_conversations_participant2IdTousers
        : convWithRelations.users_conversations_participant1IdTousers;

    res.status(200).json({
      message: 'Message request accepted',
      conversation: {
        id: conversation.id,
        participant1Id: conversation.participant1Id,
        participant2Id: conversation.participant2Id,
        participant1: convWithRelations.users_conversations_participant1IdTousers,
        participant2: convWithRelations.users_conversations_participant2IdTousers,
        otherParticipant,
        lastMessage: null,
        lastMessageAt: conversation.lastMessageAt?.toISOString() || null,
        unreadCount: 0,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('acceptMessageRequest error:', error);
    res.status(500).json({ error: 'Failed to accept message request' });
  }
};

export const declineMessageRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversationId = ensureString(req.params.conversationId);
    if (!conversationId) {
      res.status(400).json({ error: 'Conversation ID is required' });
      return;
    }

    const conversation = await prisma.conversations.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participant1Id: req.user.userId },
          { participant2Id: req.user.userId },
        ],
      },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    await prisma.messages.deleteMany({
      where: { conversationId },
    });

    await prisma.conversations.delete({
      where: { id: conversationId },
    });

    res.status(200).json({ message: 'Message request declined' });
  } catch (error) {
    console.error('declineMessageRequest error:', error);
    res.status(500).json({ error: 'Failed to decline message request' });
  }
};
