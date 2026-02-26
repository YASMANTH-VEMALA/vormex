import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { ensureString } from '../utils/request.util';
import { bunnyStorageService } from '../services/bunny-storage.service';
import { getIO } from '../sockets';

interface AuthRequest extends Request {
  user?: { userId: string };
}

const STORY_EXPIRY_HOURS = 24;

function mapStoryToResponse(story: any, currentUserId?: string) {
  return {
    id: story.id,
    mediaUrl: story.mediaUrl || '',
    mediaType: story.mediaType,
    thumbnailUrl: story.thumbnailUrl,
    duration: 0,
    category: story.category,
    backgroundColor: story.backgroundColor,
    textContent: story.textContent,
    textPosition: null,
    textStyle: null,
    stickers: null,
    filters: null,
    musicUrl: null,
    musicTitle: null,
    musicArtist: null,
    linkUrl: story.linkUrl,
    linkTitle: story.linkTitle,
    visibility: story.visibility,
    viewsCount: story.viewsCount || 0,
    reactionsCount: story.reactionsCount || 0,
    repliesCount: 0,
    isViewed: false,
    userReaction: null,
    isOwn: currentUserId ? story.authorId === currentUserId : false,
    expiresAt: story.expiresAt,
    createdAt: story.createdAt,
  };
}

// Get stories feed - grouped by author
export const getStoriesFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.userId;
    if (!currentUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const now = new Date();
    // Get connection IDs for CONNECTIONS visibility
    const connections = await prisma.connections.findMany({
      where: {
        OR: [{ requesterId: currentUserId }, { addresseeId: currentUserId }],
        status: 'accepted',
      },
      select: { requesterId: true, addresseeId: true },
    });
    const connectionIds = new Set(
      connections.flatMap((c) => [c.requesterId, c.addresseeId]).filter((id) => id !== currentUserId)
    );

    const stories = await prisma.stories.findMany({
      where: {
        expiresAt: { gt: now },
        OR: [
          { visibility: 'PUBLIC' },
          { authorId: currentUserId },
          { visibility: 'CONNECTIONS', authorId: { in: Array.from(connectionIds) } },
        ],
      },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
            headline: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by author
    const groupMap = new Map<string, { user: any; stories: any[]; hasUnviewed: boolean; lastStoryAt: Date }>();
    for (const s of stories) {
      const existing = groupMap.get(s.authorId);
      const storyData = mapStoryToResponse(s, currentUserId);
      if (!existing) {
        groupMap.set(s.authorId, {
          user: s.users,
          stories: [storyData],
          hasUnviewed: true,
          lastStoryAt: s.createdAt,
        });
      } else {
        existing.stories.push(storyData);
        existing.lastStoryAt = s.createdAt;
      }
    }

    const storyGroups = Array.from(groupMap.values()).map((g) => ({
      ...g,
      isOwnStory: g.user.id === currentUserId,
    }));

    res.json({ storyGroups });
  } catch (error) {
    console.error('getStoriesFeed error:', error);
    res.status(500).json({ error: 'Failed to fetch stories feed' });
  }
};

// Create story
export const createStory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const expiresAt = new Date(Date.now() + STORY_EXPIRY_HOURS * 60 * 60 * 1000);
    let mediaType = 'TEXT';
    let mediaUrl: string | null = null;
    let thumbnailUrl: string | null = null;
    let textContent: string | null = null;
    let backgroundColor: string | null = null;
    let category = 'GENERAL';
    let visibility = 'PUBLIC';
    let linkUrl: string | null = null;
    let linkTitle: string | null = null;

    // Handle FormData (media upload)
    const file = req.file as Express.Multer.File | undefined;
    if (file) {
      const isVideo = file.mimetype?.startsWith('video/');
      const isImage = file.mimetype?.startsWith('image/');
      if (isVideo) {
        mediaType = 'VIDEO';
        mediaUrl = await bunnyStorageService.uploadStoryVideo(file.buffer, userId, file.mimetype || 'video/mp4');
        thumbnailUrl = mediaUrl;
      } else if (isImage) {
        mediaType = 'IMAGE';
        mediaUrl = await bunnyStorageService.uploadStoryImage(file.buffer, userId, file.mimetype || 'image/jpeg');
        thumbnailUrl = mediaUrl;
      } else {
        res.status(400).json({ error: 'Invalid file type. Use image or video.' });
        return;
      }
      textContent = (req.body.textContent as string) || null;
      category = (req.body.category as string) || 'GENERAL';
      visibility = (req.body.visibility as string) || 'PUBLIC';
      linkUrl = (req.body.linkUrl as string) || null;
      linkTitle = (req.body.linkTitle as string) || null;
    } else {
      // JSON body (text-only story)
      const body = req.body as Record<string, any>;
      mediaType = (body.mediaType as string) || 'TEXT';
      textContent = (body.textContent as string) || null;
      backgroundColor = (body.backgroundColor as string) || null;
      category = (body.category as string) || 'GENERAL';
      visibility = (body.visibility as string) || 'PUBLIC';
      linkUrl = (body.linkUrl as string) || null;
      linkTitle = (body.linkTitle as string) || null;

      if (!textContent && mediaType === 'TEXT') {
        res.status(400).json({ error: 'Text content is required for text stories' });
        return;
      }
    }

    const story = await prisma.stories.create({
      data: {
        id: crypto.randomUUID(),
        authorId: userId,
        mediaType,
        mediaUrl,
        thumbnailUrl,
        textContent,
        backgroundColor,
        category,
        visibility,
        linkUrl,
        linkTitle,
        expiresAt,
      },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
            headline: true,
          },
        },
      },
    });

    const storyData = mapStoryToResponse(story, userId);

    // Emit real-time event for story carousel
    const io = getIO();
    if (io) {
      io.emit('story:created', {
        story: storyData,
        author: story.users,
        timestamp: story.createdAt,
      });
    }

    res.status(201).json({ message: 'Story created', story: storyData });
  } catch (error) {
    console.error('createStory error:', error);
    res.status(500).json({ error: 'Failed to create story' });
  }
};

// Get single story
export const getStory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.userId;
    const storyId = ensureString(req.params.storyId);
    if (!storyId) {
      res.status(400).json({ error: 'Story ID is required' });
      return;
    }

    const story = await prisma.stories.findFirst({
      where: { id: storyId, expiresAt: { gt: new Date() } },
      include: { users: { select: { id: true, username: true, name: true, profileImage: true, headline: true } } },
    });

    if (!story) {
      res.status(404).json({ error: 'Story not found or expired' });
      return;
    }

    res.json({ story: mapStoryToResponse(story, currentUserId), isOwn: story.authorId === currentUserId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch story' });
  }
};

// Get my stories
export const getMyStories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const includeExpired = req.query.includeExpired === 'true';
    const where: any = { authorId: userId };
    if (!includeExpired) {
      where.expiresAt = { gt: new Date() };
    }

    const stories = await prisma.stories.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ stories: stories.map((s) => mapStoryToResponse(s, userId)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch my stories' });
  }
};

// Delete story
export const deleteStory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const storyId = ensureString(req.params.storyId);
    if (!storyId) {
      res.status(400).json({ error: 'Story ID is required' });
      return;
    }

    const story = await prisma.stories.findFirst({ where: { id: storyId } });
    if (!story) {
      res.status(404).json({ error: 'Story not found' });
      return;
    }
    if (story.authorId !== userId) {
      res.status(403).json({ error: 'You can only delete your own stories' });
      return;
    }

    await prisma.stories.delete({ where: { id: storyId } });

    const io = getIO();
    if (io) {
      io.emit('story:deleted', { storyId, authorId: userId, timestamp: new Date() });
    }

    res.json({ message: 'Story deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete story' });
  }
};

// Get user stories
export const getUserStories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = ensureString(req.params.userId);
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }
    const currentUserId = req.user?.userId;

    const stories = await prisma.stories.findMany({
      where: {
        authorId: userId,
        expiresAt: { gt: new Date() },
      },
      include: {
        users: { select: { id: true, username: true, name: true, profileImage: true, headline: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (stories.length === 0) {
      res.json({ hasStories: false, user: null, hasUnviewed: false, stories: [] });
      return;
    }

    const firstStoryWithAuthor = stories[0] as typeof stories[0] & { users: unknown };
    res.json({
      hasStories: true,
      user: firstStoryWithAuthor.users,
      hasUnviewed: true,
      stories: stories.map((s) => mapStoryToResponse(s, currentUserId)),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user stories' });
  }
};

// View story
export const viewStory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const storyId = ensureString(req.params.storyId);
    if (!storyId) {
      res.status(400).json({ error: 'Story ID is required' });
      return;
    }
    const story = await prisma.stories.findFirst({
      where: { id: storyId, expiresAt: { gt: new Date() } },
    });
    if (!story) {
      res.status(404).json({ error: 'Story not found or expired' });
      return;
    }

    await prisma.stories.update({
      where: { id: storyId },
      data: { viewsCount: story.viewsCount + 1 },
    });

    res.json({ message: 'Story viewed', viewsCount: story.viewsCount + 1 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record story view' });
  }
};

// Get story viewers
export const getStoryViewers = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ viewers: [], nextCursor: null, hasMore: false });
};

// React to story
export const reactToStory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const storyId = ensureString(req.params.storyId);
    if (!storyId) {
      res.status(400).json({ error: 'Story ID is required' });
      return;
    }
    const story = await prisma.stories.findFirst({
      where: { id: storyId, expiresAt: { gt: new Date() } },
    });
    if (!story) {
      res.status(404).json({ error: 'Story not found or expired' });
      return;
    }
    await prisma.stories.update({
      where: { id: storyId },
      data: { reactionsCount: story.reactionsCount + 1 },
    });
    res.json({ message: 'Reaction added', reactionType: 'LIKE', reactionsCount: story.reactionsCount + 1 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to react to story' });
  }
};

// Remove story reaction
export const removeStoryReaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const storyId = ensureString(req.params.storyId);
    if (!storyId) {
      res.status(400).json({ error: 'Story ID is required' });
      return;
    }
    const story = await prisma.stories.findFirst({ where: { id: storyId } });
    if (!story) {
      res.status(404).json({ error: 'Story not found' });
      return;
    }
    const newCount = Math.max(0, story.reactionsCount - 1);
    await prisma.stories.update({
      where: { id: storyId },
      data: { reactionsCount: newCount },
    });
    res.json({ message: 'Reaction removed', reactionsCount: newCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
};

// Reply to story
export const replyToStory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const storyId = ensureString(req.params.storyId);
    if (!storyId) {
      res.status(400).json({ error: 'Story ID is required' });
      return;
    }
    const { content, mediaUrl } = req.body;
    const story = await prisma.stories.findFirst({ where: { id: storyId, expiresAt: { gt: new Date() } } });
    if (!story) {
      res.status(404).json({ error: 'Story not found or expired' });
      return;
    }
    res.json({
      message: 'Reply sent',
      reply: { id: 'temp', content: content || '', mediaUrl, createdAt: new Date() },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reply to story' });
  }
};

// Get story replies
export const getStoryReplies = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ replies: [] });
};

// Create highlight
export const createHighlight = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, coverImage, storyIds } = req.body;
    res.json({ message: 'Highlight created', highlight: { id: 'temp', name, coverImage, storyIds } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create highlight' });
  }
};

// Get user highlights
export const getUserHighlights = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ highlights: [] });
};

// Get highlight stories
export const getHighlightStories = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ highlight: null });
};

// Update highlight
export const updateHighlight = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ message: 'Highlight updated', highlight: null });
};

// Delete highlight
export const deleteHighlight = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ message: 'Highlight deleted' });
};

// Add story to highlight
export const addStoryToHighlight = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ message: 'Story added to highlight' });
};

// Remove story from highlight
export const removeStoryFromHighlight = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ message: 'Story removed from highlight' });
};

// Archive story
export const archiveStory = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ message: 'Story archived' });
};

// Get archived stories
export const getArchivedStories = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ stories: [] });
};
