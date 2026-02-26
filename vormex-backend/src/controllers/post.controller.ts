import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { ensureString } from '../utils/request.util';
import { bunnyStorageService } from '../services/bunny-storage.service';
import { getIO } from '../sockets';
import { notificationService } from '../services/notification.service';
import { recordActivity } from '../services/activity.service';
import { updateEngagementStreak } from './engagement.controller';

interface AuthRequest extends Request {
  user?: { userId: string };
}

const DEFAULT_CONTENT_TYPE = 'text/plain';

function mapPostTypeToFrontend(type: string): string {
  const normalized = type.toLowerCase();
  switch (normalized) {
    case 'image':
      return 'IMAGE';
    case 'video':
      return 'VIDEO';
    case 'link':
      return 'LINK';
    case 'poll':
      return 'POLL';
    case 'article':
      return 'ARTICLE';
    case 'celebration':
      return 'CELEBRATION';
    case 'document':
      return 'DOCUMENT';
    case 'mixed':
      return 'MIXED';
    default:
      return 'TEXT';
  }
}

function mapVisibilityToFrontend(visibility: string): string {
  const normalized = visibility.toLowerCase();
  if (normalized === 'connections') return 'CONNECTIONS';
  if (normalized === 'private') return 'PRIVATE';
  return 'PUBLIC';
}

function parseVisibility(value?: string): string {
  const normalized = (value || 'PUBLIC').toUpperCase();
  if (normalized === 'CONNECTIONS') return 'connections';
  if (normalized === 'PRIVATE') return 'private';
  return 'public';
}

function mapPostResponse(post: any, currentUserId: string) {
  const mediaUrls = post.mediaUrls || [];
  const isVideo = (post.type || '').toLowerCase() === 'video';
  const videoUrl = isVideo && mediaUrls.length > 0 ? mediaUrls[0] : null;
  const isSaved = Boolean(post.saved_posts?.some((s: any) => s.userId === currentUserId));
  const savesCount = post._count?.saved_posts ?? post.saved_posts?.length ?? 0;

  return {
    id: post.id,
    kind: 'POST',
    type: mapPostTypeToFrontend(post.type),
    authorId: post.authorId,
    author: {
      id: post.author.id,
      username: post.author.username,
      name: post.author.name,
      profileImage: post.author.profileImage,
      headline: post.author.headline,
    },
    content: post.content,
    contentType: DEFAULT_CONTENT_TYPE,
    mentions: [],
    mediaUrls,
    mediaCount: mediaUrls.length,
    videoUrl,
    videoThumbnail: isVideo && mediaUrls.length > 0 ? mediaUrls[0] : null,
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
    visibility: mapVisibilityToFrontend(post.visibility),
    likesCount: post.likesCount || 0,
    commentsCount: post.commentsCount || 0,
    sharesCount: post.sharesCount || 0,
    savesCount,
    isLiked: Boolean(post.likes?.some((like: any) => like.userId === currentUserId)),
    isSaved,
    userReactionType: null,
    reactionSummary: [],
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

// Get feed
export const getFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const currentUserId = String(req.user.userId);
    const cursor = ensureString(req.query.cursor);
    const limit = Math.min(Math.max(parseInt(ensureString(req.query.limit) || '20', 10), 1), 50);

    const posts = await prisma.post.findMany({
      where: {
        isActive: true,
        OR: [{ visibility: 'public' }, { authorId: currentUserId }],
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
        likes: {
          where: { userId: currentUserId },
          select: { userId: true },
        },
        saved_posts: {
          where: { userId: currentUserId },
          select: { userId: true },
        },
        _count: { select: { saved_posts: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = posts.length > limit;
    const pageItems = hasMore ? posts.slice(0, limit) : posts;

    res.json({
      posts: pageItems.map((post) => mapPostResponse(post, currentUserId)),
      nextCursor: hasMore ? pageItems[pageItems.length - 1].id : null,
      hasMore,
    });
  } catch (error) {
    console.error('getFeed error:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
};

// Get single post
export const getPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const currentUserId = String(req.user.userId);
    const postId = ensureString(req.params.postId);
    if (!postId) {
      res.status(400).json({ error: 'Post ID is required' });
      return;
    }

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        isActive: true,
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
        likes: {
          where: { userId: currentUserId },
          select: { userId: true },
        },
        saved_posts: {
          where: { userId: currentUserId },
          select: { userId: true },
        },
        _count: { select: { saved_posts: true } },
      },
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    if (post.visibility === 'private' && post.authorId !== currentUserId) {
      res.status(403).json({ error: 'Post is private' });
      return;
    }

    res.status(200).json(mapPostResponse(post, currentUserId));
  } catch (error) {
    console.error('getPost error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};

// Create post
export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = String(req.user.userId);
    const typeRaw = String(req.body.type || 'TEXT').toUpperCase();
    const visibilityRaw = String(req.body.visibility || 'PUBLIC');
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

    const mappedType = typeRaw.toLowerCase();
    const visibility = parseVisibility(visibilityRaw);

    // Web currently sends multipart FormData for all post types.
    // For now, require content for non-media drafts and allow empty content for media types.
    const isMediaPost = ['image', 'video', 'document', 'mixed'].includes(mappedType);
    if (!content && !isMediaPost) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const files = (req.files as Express.Multer.File[] | undefined) || [];
    const mediaUrls: string[] = [];

    // Upload images/videos to Bunny.net CDN
    if (files.length > 0) {
      if (!process.env.BUNNY_STORAGE_API_KEY) {
        res.status(500).json({ error: 'Media storage is not configured. Please contact support.' });
        return;
      }
      
      try {
        const imageFiles = files.filter((f) => f.mimetype?.startsWith('image/'));
        const videoFiles = files.filter((f) => f.mimetype?.startsWith('video/'));
        for (let i = 0; i < imageFiles.length; i++) {
          const url = await bunnyStorageService.uploadPostImage(
            imageFiles[i].buffer,
            userId,
            i,
            imageFiles[i].mimetype || 'image/jpeg'
          );
          mediaUrls.push(url);
        }
        for (const v of videoFiles) {
          const url = await bunnyStorageService.uploadPostVideo(
            v.buffer,
            userId,
            v.mimetype || 'video/mp4'
          );
          mediaUrls.push(url);
        }
      } catch (uploadError) {
        console.error('Failed to upload media to CDN:', uploadError);
        res.status(500).json({ error: 'Failed to upload media. Please try again.' });
        return;
      }
    }

    const created = await prisma.post.create({
      data: {
        authorId: userId,
        content: content || '',
        type: mappedType,
        visibility,
        mediaUrls,
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
        likes: {
          where: { userId },
          select: { userId: true },
        },
      },
    });

    // Record activity and update posting streak (non-blocking)
    const activityType = mappedType === 'article' ? 'article' : 'post';
    recordActivity(userId, activityType, 1).catch(console.error);
    updateEngagementStreak(userId, 'posting').catch(console.error);

    // Emit Socket.IO events for real-time feed update
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('streak:updated', { type: 'posting' });
      // Broadcast new post to all connected clients for instant feed update
      const mappedPost = mapPostResponse(created, userId);
      io.emit('post:created', { post: mappedPost });
    }

    res.status(201).json(mapPostResponse(created, userId));
  } catch (error) {
    console.error('createPost error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

// Update post
export const updatePost = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const existing = await prisma.post.findFirst({
      where: { id: postId, isActive: true },
      select: { id: true, authorId: true },
    });

    if (!existing) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    if (existing.authorId !== userId) {
      res.status(403).json({ error: 'You can only edit your own posts' });
      return;
    }

    const data: { content?: string; visibility?: string } = {};
    if (typeof req.body.content === 'string') {
      data.content = req.body.content.trim();
    }
    if (typeof req.body.visibility === 'string') {
      data.visibility = parseVisibility(req.body.visibility);
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data,
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
        likes: {
          where: { userId },
          select: { userId: true },
        },
      },
    });

    res.status(200).json(mapPostResponse(updated, userId));
  } catch (error) {
    console.error('updatePost error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
};

// Delete post
export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const existing = await prisma.post.findFirst({
      where: { id: postId, isActive: true },
      select: { id: true, authorId: true },
    });

    if (!existing) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    if (existing.authorId !== userId) {
      res.status(403).json({ error: 'You can only delete your own posts' });
      return;
    }

    await prisma.post.update({
      where: { id: postId },
      data: { isActive: false },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('deletePost error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

// Toggle like
export const toggleLike = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Emit Socket.IO event for real-time updates
    const io = getIO();
    if (io) {
      io.emit('post:liked', {
        postId,
        userId,
        liked,
        likesCount,
        reactionType: liked ? 'LIKE' : null,
        reactionSummary: [],
      });
    }

    res.json({ liked, likesCount });
  } catch (error) {
    console.error('toggleLike error:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};

// Vote poll
export const votePoll = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({ success: false, pollOptions: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to vote on poll' });
  }
};

// Get comments
export const getComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const currentUserId = String(req.user.userId);
    const postId = ensureString(req.params.postId);
    const parentId = ensureString(req.query.parentId) || undefined;
    const page = Math.max(1, parseInt(ensureString(req.query.page) || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(ensureString(req.query.limit) || '20', 10)));

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

    const where = { postId: postId as string, parentId: parentId || null };
    const [comments, total] = await Promise.all([
      prisma.postComment.findMany({
        where,
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
          likes: {
            where: { userId: currentUserId },
            select: { userId: true },
          },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit + 1,
      }),
      prisma.postComment.count({ where }),
    ]);

    const hasMore = comments.length > limit;
    const items = hasMore ? comments.slice(0, limit) : comments;

    const mapped = items.map((c) => {
      const cWithRelations = c as typeof c & { author: unknown; _count: { replies: number }; likes?: { userId: string }[] };
      return {
      id: c.id,
      postId: c.postId,
      parentId: c.parentId,
      author: cWithRelations.author,
      content: c.content,
      contentType: 'text/plain',
      mentions: [],
      likesCount: c.likesCount,
      replyCount: cWithRelations._count.replies,
      isLiked: Boolean(cWithRelations.likes?.some((l: any) => l.userId === currentUserId)),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
    });

    res.json({ comments: mapped, total, hasMore });
  } catch (error) {
    console.error('getComments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

// Create comment
export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const userId = String(req.user.userId);
    const postId = ensureString(req.params.postId);
    const { content, parentId, mentions } = req.body || {};

    if (!postId || !content || typeof content !== 'string') {
      res.status(400).json({ error: 'Post ID and content are required' });
      return;
    }

    const post = await prisma.post.findFirst({
      where: { id: postId, isActive: true },
      select: { id: true, authorId: true },
    });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
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
        likes: {
          where: { userId },
          select: { userId: true },
        },
        _count: { select: { replies: true } },
      },
    });

    const commentsCount = await prisma.postComment.count({ where: { postId, parentId: null } });
    await prisma.post.update({
      where: { id: postId },
      data: { commentsCount },
    });

    const commentWithRelations = comment as typeof comment & { author: unknown; _count: { replies: number } };
    const mapped = {
      id: comment.id,
      postId: comment.postId,
      parentId: comment.parentId,
      author: commentWithRelations.author,
      content: comment.content,
      contentType: 'text/plain',
      mentions: mentions || [],
      likesCount: comment.likesCount,
      replyCount: commentWithRelations._count.replies,
      isLiked: false,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };

    // Emit Socket.IO event for real-time updates
    const io = getIO();
    if (io) {
      // Broadcast to post room for detailed comment data
      io.to(`post:${postId as string}`).emit('comment:created', {
        postId,
        comment: mapped,
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
          comment: mapped,
          commentsCount,
        });
        
        // Create persistent notification
        notificationService.notifyPostComment(
          post.authorId,
          userId,
          (commentWithRelations.author as { name: string }).name,
          postId,
          mapped.id,
          content.trim()
        );
      }
    }

    // Record comment activity (non-blocking)
    recordActivity(userId, 'comment', 1).catch(console.error);

    res.status(201).json(mapped);
  } catch (error) {
    console.error('createComment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

// Toggle comment like
export const toggleCommentLike = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const userId = String(req.user.userId);
    const postId = ensureString(req.params.postId);
    const commentId = ensureString(req.params.commentId);

    if (!postId || !commentId) {
      res.status(400).json({ error: 'Post ID and comment ID are required' });
      return;
    }

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

    // Emit Socket.IO event for real-time updates
    const io = getIO();
    if (io) {
      io.to(`post:${postId}`).emit('comment:liked', {
        commentId,
        postId,
        userId,
        liked,
        likesCount,
      });
    }

    res.json({ isLiked: liked, liked, likesCount });
  } catch (error) {
    console.error('toggleCommentLike error:', error);
    res.status(500).json({ error: 'Failed to toggle comment like' });
  }
};

// Share post
export const sharePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const postId = ensureString(req.params.postId);
    // targetUserId from req.body can be used to send DM/notification when implemented

    if (!postId) {
      res.status(400).json({ error: 'Post ID is required' });
      return;
    }

    const post = await prisma.post.findFirst({
      where: { id: postId, isActive: true },
      select: { id: true, sharesCount: true },
    });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const sharesCount = (post.sharesCount || 0) + 1;
    await prisma.post.update({
      where: { id: postId },
      data: { sharesCount },
    });

    // Emit Socket.IO event for real-time updates
    const io = getIO();
    if (io) {
      io.emit('post:shared', {
        postId,
        userId: String(req.user?.userId),
        sharesCount,
      });
    }

    // TODO: Create share notification or DM to targetUserId when targetUserId is provided
    res.status(200).json({ message: 'Post shared successfully', sharesCount });
  } catch (error) {
    console.error('sharePost error:', error);
    res.status(500).json({ error: 'Failed to share post' });
  }
};

// Get post likes list
export const getLikes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postId = ensureString(req.params.postId);
    if (!postId) {
      res.status(400).json({ error: 'Post ID is required' });
      return;
    }

    const likes = await prisma.postLike.findMany({
      where: { postId },
      include: {
        user: {
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
      take: 200,
    });

    res.status(200).json({
      likes: likes.map((like) => {
        const likeWithUser = like as typeof like & { user: { username: string; name: string; profileImage: string | null; headline: string | null } };
        return {
        id: like.id,
        username: likeWithUser.user.username,
        name: likeWithUser.user.name,
        profileImage: likeWithUser.user.profileImage,
        headline: likeWithUser.user.headline,
        reactionType: 'LIKE',
        createdAt: like.createdAt,
      };
      }),
    });
  } catch (error) {
    console.error('getLikes error:', error);
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
};
