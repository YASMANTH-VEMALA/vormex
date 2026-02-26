import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { ensureString } from '../utils/request.util';

interface AuthRequest extends Request {
  user?: { userId: string };
}

export const getSaved = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const userId = String(req.user.userId);
    const cursor = ensureString(req.query.cursor);
    const limit = Math.min(50, Math.max(1, parseInt(ensureString(req.query.limit) || '20', 10)));

    const saved = await prisma.savedPost.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            author: { select: { id: true, username: true, name: true, profileImage: true, headline: true } },
            likes: { where: { userId }, select: { userId: true } },
            savedBy: { where: { userId }, select: { userId: true } },
            _count: { select: { savedBy: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = saved.length > limit;
    const pageItems = hasMore ? saved.slice(0, limit) : saved;
    const posts = pageItems
      .filter((s) => s.post && s.post.isActive)
      .map((s) => {
        const post: any = s.post;
        const mediaUrls = post.mediaUrls || [];
        const isVideo = (post.type || '').toLowerCase() === 'video';
        const videoUrl = isVideo && mediaUrls.length > 0 ? mediaUrls[0] : null;
        return {
          id: post.id,
          kind: 'POST',
          type: (post.type || 'text').toUpperCase(),
          authorId: post.authorId,
          author: post.author,
          content: post.content,
          contentType: 'text/plain',
          mentions: [],
          mediaUrls,
          mediaCount: mediaUrls.length,
          videoUrl,
          videoThumbnail: isVideo && mediaUrls[0] ? mediaUrls[0] : null,
          videoDuration: null,
          videoSize: null,
          videoFormat: null,
          documentUrl: null,
          documentName: null,
          documentType: null,
          documentSize: null,
          documentPages: null,
          documentThumbnail: null,
          linkUrl: null,
          linkTitle: null,
          linkDescription: null,
          linkImage: null,
          linkDomain: null,
          articleTitle: null,
          articleCoverImage: null,
          articleReadTime: null,
          articleTags: [],
          pollDuration: null,
          pollEndsAt: null,
          pollOptions: [],
          userVotedOptionId: null,
          showResultsBeforeVote: false,
          celebrationType: null,
          celebrationMeta: null,
          celebrationBadge: null,
          visibility: (post.visibility || 'public').toUpperCase(),
          likesCount: post.likesCount || 0,
          commentsCount: post.commentsCount || 0,
          sharesCount: post.sharesCount || 0,
          savesCount: post._count?.savedBy ?? 0,
          isLiked: Boolean(post.likes?.some((l: any) => l.userId === userId)),
          isSaved: true,
          userReactionType: null,
          reactionSummary: [],
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          savedAt: s.createdAt,
        };
      });

    res.json({
      posts,
      nextCursor: hasMore ? pageItems[pageItems.length - 1]?.id : null,
      hasMore,
    });
  } catch (error) {
    console.error('getSaved error:', error);
    res.status(500).json({ error: 'Failed to fetch saved posts' });
  }
};

export const toggleSave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const userId = String(req.user.userId);
    const postId = ensureString(req.params.postId);

    if (!postId) {
      res.status(400).json({ error: 'Post ID is required' });
      return;
    }

    const post = await prisma.post.findFirst({
      where: { id: postId, isActive: true },
      select: { id: true },
    });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const existing = await prisma.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    let saved = false;
    if (existing) {
      await prisma.savedPost.delete({
        where: { userId_postId: { userId, postId } },
      });
    } else {
      await prisma.savedPost.create({
        data: { userId, postId },
      });
      saved = true;
    }

    const savesCount = await prisma.savedPost.count({ where: { postId } });

    res.json({
      message: saved ? 'Post saved' : 'Post unsaved',
      saved,
      savesCount,
    });
  } catch (error) {
    console.error('toggleSave error:', error);
    res.status(500).json({ error: 'Failed to toggle save' });
  }
};

export const savePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const userId = String(req.user.userId);
    const postId = ensureString(req.params.postId);

    if (!postId) {
      res.status(400).json({ error: 'Post ID is required' });
      return;
    }

    const post = await prisma.post.findFirst({
      where: { id: postId, isActive: true },
      select: { id: true },
    });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    await prisma.savedPost.upsert({
      where: { userId_postId: { userId, postId } },
      create: { userId, postId },
      update: {},
    });

    res.json({ message: 'Post saved' });
  } catch (error) {
    console.error('savePost error:', error);
    res.status(500).json({ error: 'Failed to save post' });
  }
};

export const unsavePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const userId = String(req.user.userId);
    const postId = ensureString(req.params.postId);

    if (!postId) {
      res.status(400).json({ error: 'Post ID is required' });
      return;
    }

    await prisma.savedPost.deleteMany({
      where: { userId, postId },
    });

    res.json({ message: 'Post unsaved' });
  } catch (error) {
    console.error('unsavePost error:', error);
    res.status(500).json({ error: 'Failed to unsave post' });
  }
};

export const checkSaved = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const userId = String(req.user.userId);
    const postId = ensureString(req.params.postId);

    if (!postId) {
      res.status(400).json({ error: 'Post ID is required' });
      return;
    }

    const saved = await prisma.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    res.json({ saved: !!saved });
  } catch (error) {
    console.error('checkSaved error:', error);
    res.status(500).json({ error: 'Failed to check save status' });
  }
};
