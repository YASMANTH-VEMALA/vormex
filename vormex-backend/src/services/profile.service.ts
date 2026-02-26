import { prisma } from '../config/prisma';
import { isUUID } from '../utils/username.util';
import type {
  UnifiedContentItem,
  UnifiedFeedResponse,
  FullProfileResponse,
} from '../types/profile.types';
import { getActivityHeatmap } from './activity.service';

/**
 * Calculate XP required for next level
 * 
 * @param currentLevel - Current user level
 * @returns XP required to reach next level
 */
function calculateXpForNextLevel(currentLevel: number): number {
  return (currentLevel + 1) * 100;
}

/**
 * Format database item to UnifiedContentItem
 * 
 * @param item - Database item from any content table
 * @param contentType - Type of content
 * @returns Formatted UnifiedContentItem
 */
function formatUnifiedItem(item: any, contentType: string): UnifiedContentItem {
  const baseItem: UnifiedContentItem = {
    id: item.id,
    contentType: contentType as any,
    content: item.content || item.body || item.description || '',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt || item.createdAt,
  };

  // Add title for articles and forum questions
  if (contentType === 'article' || contentType === 'forum_question') {
    baseItem.title = item.title;
  }

  // Add engagement metrics if available
  if (item.likesCount !== undefined) {
    baseItem.likesCount = item.likesCount;
  }
  if (item.commentsCount !== undefined) {
    baseItem.commentsCount = item.commentsCount;
  }
  if (item.viewsCount !== undefined) {
    baseItem.viewsCount = item.viewsCount;
  }

  // For forum answers, add question reference
  if (contentType === 'forum_answer' && item.question) {
    baseItem.questionId = item.question.id;
    baseItem.questionTitle = item.question.title;
  }

  // Add images and tags for posts/articles if available
  if (item.images) {
    baseItem.images = Array.isArray(item.images) ? item.images : [item.images];
  }
  if (item.tags) {
    baseItem.tags = Array.isArray(item.tags) ? item.tags : [item.tags];
  }

  return baseItem;
}

/**
 * Get unified content feed for a user
 * Combines posts, articles, forum Q&A in chronological order
 * 
 * @param userId - User ID
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20)
 * @param filter - Content type filter (default: 'all')
 * @returns UnifiedFeedResponse with paginated items
 */
export async function getUnifiedContentFeed(
  userId: string,
  page: number = 1,
  limit: number = 20,
  filter?: 'all' | 'posts' | 'articles' | 'forum' | 'videos'
): Promise<UnifiedFeedResponse> {
  try {
    const skip = (page - 1) * limit;
    const allItems: UnifiedContentItem[] = [];

    // Query different content types based on filter
    const shouldFetchPosts = !filter || filter === 'all' || filter === 'posts';
    const shouldFetchReels = !filter || filter === 'all' || filter === 'videos';
    const shouldFetchArticles = !filter || filter === 'all' || filter === 'articles';
    const shouldFetchForum = !filter || filter === 'all' || filter === 'forum';

    // Fetch reels (from Reel model - short-form videos)
    if (shouldFetchReels) {
      try {
        const reels = await prisma.reels.findMany({
          where: {
            authorId: userId,
            status: 'ready',
            visibility: 'public',
            publishedAt: { not: null },
          },
          orderBy: { publishedAt: 'desc' },
          take: 100,
        });

        for (const reel of reels) {
          const item: UnifiedContentItem = {
            id: reel.id,
            contentType: 'short_video',
            content: reel.caption || '',
            createdAt: reel.publishedAt!,
            updatedAt: reel.updatedAt,
            likesCount: reel.likesCount,
            commentsCount: reel.commentsCount,
            viewsCount: reel.viewsCount,
            title: reel.title || undefined,
            images: reel.thumbnailUrl ? [reel.thumbnailUrl] : undefined,
            tags: reel.hashtags?.length ? reel.hashtags : undefined,
          };
          allItems.push(item);
        }
      } catch (err) {
        console.debug('Reel model not found, skipping reels', err);
      }
    }

    // Fetch posts (if Post model exists) - exclude video type when showing reels
    if (shouldFetchPosts) {
      try {
        const postModel = (prisma as any).post;
        if (postModel) {
          const postTypeFilter =
            filter === 'posts'
              ? { in: ['text', 'image', 'link', 'poll', 'celebration', 'document', 'mixed'] }
              : { in: ['text', 'image', 'video', 'link', 'poll', 'celebration', 'document', 'mixed'] };

          const posts = await postModel.findMany({
            where: {
              authorId: userId,
              isActive: true,
              type: postTypeFilter,
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
          });

          for (const post of posts) {
            const contentType = post.type === 'video' ? 'short_video' : 'post';
            allItems.push(formatUnifiedItem(post, contentType));
          }
        }
      } catch (err) {
        console.debug('Post model not found, skipping posts');
      }
    }

    // Fetch articles (if Post model exists with ARTICLE type)
    if (shouldFetchArticles) {
      try {
        const postModel = (prisma as any).post;
        if (postModel) {
          const articles = await postModel.findMany({
            where: {
              authorId: userId,
              isActive: true,
              type: 'article',
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
          });

          for (const article of articles) {
            allItems.push(formatUnifiedItem(article, 'article'));
          }
        }
      } catch (err) {
        console.debug('Article model not found, skipping articles');
      }
    }

    // Fetch forum questions (if ForumQuestion model exists)
    if (shouldFetchForum) {
      try {
        const forumQuestionModel = (prisma as any).forumQuestion;
        if (forumQuestionModel) {
          const questions = await forumQuestionModel.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 100,
          });

          for (const question of questions) {
            allItems.push(formatUnifiedItem(question, 'forum_question'));
          }
        }
      } catch (err) {
        console.debug('ForumQuestion model not found, skipping forum questions');
      }

      // Fetch forum answers (if Answer model exists)
      try {
        const answerModel = (prisma as any).answer;
        if (answerModel) {
          const answers = await answerModel.findMany({
            where: { userId },
            include: {
              question: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
          });

          for (const answer of answers) {
            allItems.push(formatUnifiedItem(answer, 'forum_answer'));
          }
        }
      } catch (err) {
        console.debug('Answer model not found, skipping forum answers');
      }
    }

    // Sort all items by createdAt DESC
    allItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Calculate total count
    const totalCount = allItems.length;

    // Paginate
    const paginatedItems = allItems.slice(skip, skip + limit);
    const hasMore = skip + limit < totalCount;

    return {
      items: paginatedItems,
      totalCount,
      hasMore,
    };
  } catch (error) {
    console.error(`Failed to get unified feed for user ${userId}:`, error);
    return {
      items: [],
      totalCount: 0,
      hasMore: false,
    };
  }
}

/**
 * Get full profile with all data (user info, stats, GitHub, activity, feed)
 * 
 * @param requestingUserId - ID of user making the request (null if anonymous)
 * @param targetUsernameOrId - Username or UUID of target user
 * @returns FullProfileResponse with all profile data
 */
export async function getFullProfile(
  requestingUserId: string | null,
  targetUsernameOrId: string
): Promise<FullProfileResponse> {
  try {
    // Remove @ prefix if present (e.g., @koushik -> koushik)
    let identifier = targetUsernameOrId;
    if (identifier.startsWith('@')) {
      identifier = identifier.substring(1);
    }

    // Find target user by UUID or username
    const user = await prisma.user.findFirst({
      where: isUUID(identifier)
        ? { id: identifier }
        : { username: identifier.toLowerCase() },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const targetUserId = user.id;

    // Check if requesting user is the owner
    const isOwner = requestingUserId !== null && requestingUserId === targetUserId;

    // All profiles are public - no privacy checks needed

    // Fetch all related data in parallel
    const [
      userStats,
      githubStats,
      activityHeatmap,
      recentActivity,
      userSkills,
      experiences,
      educationHistory,
      projects,
      certificates,
      achievements,
    ] = await Promise.all([
      // UserStats
      prisma.userStats.findUnique({
        where: { userId: targetUserId },
      }).catch(() => null),

      // GitHubStats (only if connected)
      user.githubConnected
        ? prisma.gitHubStats.findUnique({
            where: { userId: targetUserId },
          }).catch(() => null)
        : Promise.resolve(null),

      // Activity heatmap (last 365 days - default view)
      getActivityHeatmap(targetUserId).catch(() => ({
        days: [],
        stats: {
          totalContributions: 0,
          currentStreak: 0,
          longestStreak: 0,
          contributionLevels: {
            level0: 0,
            level1: 0,
            level2: 0,
            level3: 0,
          },
        },
      })),

      // Recent activity feed (first 20 items)
      getUnifiedContentFeed(targetUserId, 1, 20, 'all').catch(() => ({
        items: [],
        totalCount: 0,
        hasMore: false,
      })),

      // Skills
      prisma.userSkill.findMany({
        where: { userId: targetUserId },
        include: { skill: true },
        orderBy: { createdAt: 'desc' },
      }).catch(() => []),

      // Experiences
      prisma.experience.findMany({
        where: { userId: targetUserId },
        orderBy: [
          { isCurrent: 'desc' },
          { startDate: 'desc' },
        ],
      }).catch(() => []),

      // Education
      prisma.education.findMany({
        where: { userId: targetUserId },
        orderBy: [
          { isCurrent: 'desc' },
          { startDate: 'desc' },
        ],
      }).catch(() => []),

      // Projects
      prisma.project.findMany({
        where: { userId: targetUserId },
        orderBy: [
          { featured: 'desc' },
          { startDate: 'desc' },
        ],
      }).catch(() => []),

      // Certificates
      prisma.certificate.findMany({
        where: { userId: targetUserId },
        orderBy: { issueDate: 'desc' },
      }).catch(() => []),

      // Achievements
      prisma.achievement.findMany({
        where: { userId: targetUserId },
        orderBy: { date: 'desc' },
      }).catch(() => []),
    ]);

    // Build stats object
    const stats = userStats || {
      xp: 0,
      level: 1,
      totalPosts: 0,
      totalArticles: 0,
      totalShortVideos: 0,
      totalForumQuestions: 0,
      totalForumAnswers: 0,
      totalComments: 0,
      totalLikesReceived: 0,
      connectionsCount: 0,
      followersCount: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      totalActiveDays: 0,
    };

    const xpToNextLevel = calculateXpForNextLevel(stats.level) - stats.xp;

    // Build GitHub object
    const github = {
      connected: user.githubConnected || false,
      username: user.githubUsername,
      avatarUrl: user.githubAvatarUrl,
      profileUrl: user.githubProfileUrl,
      stats: githubStats
        ? {
            totalPublicRepos: githubStats.totalPublicRepos,
            totalStars: githubStats.totalStars,
            totalForks: githubStats.totalForks,
            followers: githubStats.followers,
            following: githubStats.following,
            topLanguages: githubStats.topLanguages || {},
            topRepos: githubStats.topRepos || [],
          }
        : null,
      lastSyncedAt: user.githubLastSyncedAt,
    };

    // Build user object (exclude sensitive fields)
    const userResponse = {
      id: user.id,
      username: user.username, // Username is required
      name: user.name,
      ...(isOwner && { email: user.email }), // Only include email if owner
      avatar: user.profileImage,
      bannerImageUrl: user.bannerImageUrl,
      headline: user.headline,
      bio: user.bio,
      location: user.location,
      college: user.college || '',
      degree: user.degree,
      branch: user.branch || '',
      currentYear: user.currentYear,
      graduationYear: user.graduationYear,
      portfolioUrl: user.portfolioUrl,
      linkedinUrl: user.linkedinUrl,
      githubProfileUrl: user.githubProfileUrl,
      otherSocialUrls: user.otherSocialUrls,
      isOpenToOpportunities: user.isOpenToOpportunities,
      verified: user.isVerified,
      createdAt: user.createdAt,
    };

    // Format skills for response
    const formattedSkills = userSkills.map((us) => ({
      id: us.id,
      skill: {
        id: us.skill.id,
        name: us.skill.name,
        category: us.skill.category,
      },
      proficiency: us.proficiency,
      yearsOfExp: us.yearsOfExp,
    }));

    // Log profile view
    console.log(
      `Profile viewed: ${targetUsernameOrId} by ${requestingUserId || 'anonymous'}`
    );

    return {
      user: {
        ...userResponse,
        interests: user.interests || [],
      },
      stats: {
        ...stats,
        xpToNextLevel: Math.max(0, xpToNextLevel),
      },
      github: github as any,
      activityHeatmap: activityHeatmap.days || [], // Extract days array for backward compatibility
      recentActivity,
      skills: formattedSkills,
      experiences,
      education: educationHistory,
      projects,
      certificates,
      achievements,
    };
  } catch (error) {
    console.error(
      `Failed to get full profile for ${targetUsernameOrId}:`,
      error
    );
    throw error;
  }
}

