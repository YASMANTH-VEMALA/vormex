import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { ensureString } from '../utils/request.util';
import { recordActivity, calculateStreak } from '../services/activity.service';
import { getIO } from '../sockets';

interface AuthRequest extends Request {
  user?: { userId: string };
}

// Helper to get today's date at midnight UTC
function getTodayStart(): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

// Helper to get start of current week (Monday)
function getWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
  const weekStart = new Date(now);
  weekStart.setUTCDate(weekStart.getUTCDate() - diff);
  weekStart.setUTCHours(0, 0, 0, 0);
  return weekStart;
}

// Helper to check if date is today
function isToday(date: Date | null): boolean {
  if (!date) return false;
  const today = getTodayStart();
  const checkDate = new Date(date);
  checkDate.setUTCHours(0, 0, 0, 0);
  return checkDate.getTime() === today.getTime();
}

// Helper to check if streak is at risk (no activity today and had streak yesterday)
function checkAtRisk(lastDate: Date | null, currentStreak: number): boolean {
  if (currentStreak === 0) return false;
  if (!lastDate) return false;
  return !isToday(lastDate);
}

// ======================
// STREAKS
// ======================
export const getStreaks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get or create EngagementStreak record
    let streak = await prisma.engagement_streaks.findUnique({
      where: { userId },
    });

    if (!streak) {
      streak = await prisma.engagement_streaks.create({
        data: { userId },
      });
    }

    // Get UserStats for overall activity streak
    const userStats = await prisma.userStats.findUnique({
      where: { userId },
    });

    // Calculate overall streak from UserDailyActivity
    const activityStreak = await calculateStreak(userId);

    // Get weekly connections count
    const weekStart = getWeekStart();
    const weeklyConnections = await prisma.connections.count({
      where: {
        status: 'accepted',
        updatedAt: { gte: weekStart },
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
    });

    // Calculate at-risk status for each streak type
    const isAtRisk = {
      connection: checkAtRisk(streak.lastConnectionDate, streak.connectionStreak),
      login: checkAtRisk(streak.lastLoginDate, streak.loginStreak),
      posting: checkAtRisk(streak.lastPostDate, streak.postingStreak),
      messaging: checkAtRisk(streak.lastMessageDate, streak.messagingStreak),
    };

    // Calculate overall best streak
    const overallBestStreak = Math.max(
      streak.longestConnectionStreak || streak.bestConnectionStreak || 0,
      streak.longestLoginStreak || streak.bestLoginStreak || 0,
      streak.longestPostingStreak || streak.bestPostingStreak || 0,
      streak.longestMessagingStreak || streak.bestMessagingStreak || 0,
      activityStreak.longestStreak
    );

    // Calculate engagement score (0-100)
    const engagementScore = Math.min(100, Math.round(
      (streak.connectionStreak * 10 +
       streak.loginStreak * 5 +
       streak.postingStreak * 15 +
       streak.messagingStreak * 8 +
       (userStats?.xp || 0) / 10) / 5
    ));

    res.json({
      data: {
        connectionStreak: streak.connectionStreak,
        longestConnectionStreak: streak.longestConnectionStreak || streak.bestConnectionStreak || streak.connectionStreak,
        loginStreak: streak.loginStreak,
        longestLoginStreak: streak.longestLoginStreak || streak.bestLoginStreak || streak.loginStreak,
        postingStreak: streak.postingStreak,
        longestPostingStreak: streak.longestPostingStreak || streak.bestPostingStreak || streak.postingStreak,
        messagingStreak: streak.messagingStreak,
        longestMessagingStreak: streak.longestMessagingStreak || streak.bestMessagingStreak || streak.messagingStreak,
        overallBestStreak,
        weeklyConnectionsMade: weeklyConnections,
        weeklyConnectionsGoal: 10,
        streakFreezes: streak.streakFreezes,
        streakShieldActive: streak.streakShieldActive,
        totalFreezesUsed: 3 - streak.streakFreezes, // Assuming max 3 freezes
        isAtRisk,
        engagementScore,
        showOnProfile: true, // TODO: Add to EngagementStreak model
      },
    });
  } catch (error) {
    console.error('getStreaks error:', error);
    res.status(500).json({ error: 'Failed to fetch streaks' });
  }
};

// ======================
// RECORD LOGIN
// ======================
export const recordLogin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const today = getTodayStart();

    // Get or create EngagementStreak
    let streak = await prisma.engagement_streaks.findUnique({
      where: { userId },
    });

    if (!streak) {
      streak = await prisma.engagement_streaks.create({
        data: {
          userId,
          loginStreak: 1,
          lastLoginDate: today,
          bestLoginStreak: 1,
          longestLoginStreak: 1,
        },
      });
    } else {
      // Check if already logged in today
      if (streak.lastLoginDate && isToday(streak.lastLoginDate)) {
        res.status(200).json({ message: 'Login already recorded today' });
        return;
      }

      // Check if continuing streak (logged in yesterday)
      const yesterday = new Date(today);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      
      let newLoginStreak = 1;
      if (streak.lastLoginDate) {
        const lastLoginDate = new Date(streak.lastLoginDate);
        lastLoginDate.setUTCHours(0, 0, 0, 0);
        if (lastLoginDate.getTime() === yesterday.getTime()) {
          newLoginStreak = streak.loginStreak + 1;
        }
      }

      const newLongestStreak = Math.max(streak.longestLoginStreak || 0, newLoginStreak);

      await prisma.engagement_streaks.update({
        where: { userId },
        data: {
          loginStreak: newLoginStreak,
          lastLoginDate: today,
          bestLoginStreak: newLongestStreak,
          longestLoginStreak: newLongestStreak,
        },
      });
    }

    // Record activity for overall streak
    await recordActivity(userId, 'post', 0); // Just to mark as active

    // Emit Socket.IO event for streak update
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('streak:updated', { type: 'login' });
    }

    res.status(200).json({ message: 'Login recorded' });
  } catch (error) {
    console.error('recordLogin error:', error);
    res.status(500).json({ error: 'Failed to record login' });
  }
};

// ======================
// DAILY MATCHES (Variable Rewards)
// ======================
export const getDailyMatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get current user for matching
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { college: true, interests: true },
    });

    // Get existing connections to exclude
    const existingConnections = await prisma.connections.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
      select: { requesterId: true, addresseeId: true },
    });

    const connectedUserIds = new Set<string>();
    existingConnections.forEach((conn) => {
      connectedUserIds.add(conn.requesterId);
      connectedUserIds.add(conn.addresseeId);
    });
    connectedUserIds.add(userId);

    // Variable reward: randomize match count (1-5)
    const matchCount = Math.floor(Math.random() * 5) + 1;

    // Find users with similar interests or same college
    const potentialMatches = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(connectedUserIds) },
        isBanned: false,
      },
      select: {
        id: true,
        username: true,
        name: true,
        profileImage: true,
        headline: true,
        college: true,
        lastActiveAt: true,
        interests: true,
      },
      take: matchCount * 3, // Get more than needed for filtering
    });

    // Score and sort by relevance
    const scoredMatches = potentialMatches.map((user) => {
      let score = 0;
      if (currentUser?.college && user.college === currentUser.college) {
        score += 20;
      }
      // Check interest overlap
      if (currentUser?.interests && user.interests) {
        const userInterests = Array.isArray(user.interests) ? user.interests : [];
        const myInterests = Array.isArray(currentUser.interests) ? currentUser.interests : [];
        const overlap = userInterests.filter((i: string) => myInterests.includes(i)).length;
        score += overlap * 10;
      }
      // Boost recently active users
      if (user.lastActiveAt && new Date(user.lastActiveAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
        score += 10;
      }
      return { ...user, score };
    });

    // Sort by score and take top matches
    const matches = scoredMatches
      .sort((a, b) => b.score - a.score)
      .slice(0, matchCount)
      .map((user) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        profileImage: user.profileImage,
        headline: user.headline,
        college: user.college,
        isOnline: user.lastActiveAt ? new Date(user.lastActiveAt) > new Date(Date.now() - 5 * 60 * 1000) : false,
        replyRate: Math.floor(Math.random() * 40) + 60, // TODO: Calculate real reply rate
      }));

    // Generate surprise message (variable reward)
    const surpriseMessages = [
      "You have new matches waiting!",
      "Someone from your college is here!",
      "A perfect match just joined!",
      "Great networking opportunities today!",
      "Check back tomorrow for more matches!",
    ];
    const surpriseMessage = matches.length > 0 
      ? surpriseMessages[Math.floor(Math.random() * (surpriseMessages.length - 1))]
      : surpriseMessages[surpriseMessages.length - 1];

    res.json({
      data: {
        matches,
        matchCount: matches.length,
        surpriseMessage,
      },
    });
  } catch (error) {
    console.error('getDailyMatches error:', error);
    res.status(500).json({ error: 'Failed to fetch daily matches' });
  }
};

// ======================
// HIDDEN GEM (Variable Reward)
// ======================
export const getHiddenGem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get existing connections to exclude
    const existingConnections = await prisma.connections.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
      select: { requesterId: true, addresseeId: true },
    });

    const connectedUserIds = new Set<string>();
    existingConnections.forEach((conn) => {
      connectedUserIds.add(conn.requesterId);
      connectedUserIds.add(conn.addresseeId);
    });
    connectedUserIds.add(userId);

    // Find a "hidden gem" - high-quality user with good stats
    const hiddenGem = await prisma.user.findFirst({
      where: {
        id: { notIn: Array.from(connectedUserIds) },
        isBanned: false,
        userStats: {
          connectionsCount: { gte: 10 },
        },
      },
      select: {
        id: true,
        username: true,
        name: true,
        profileImage: true,
        headline: true,
        college: true,
        lastActiveAt: true,
      },
      orderBy: {
        userStats: { connectionsCount: 'desc' },
      },
    });

    if (!hiddenGem) {
      res.json({ data: null });
      return;
    }

    res.json({
      data: {
        match: {
          id: hiddenGem.id,
          username: hiddenGem.username,
          name: hiddenGem.name,
          profileImage: hiddenGem.profileImage,
          headline: hiddenGem.headline,
          college: hiddenGem.college,
          isOnline: hiddenGem.lastActiveAt ? new Date(hiddenGem.lastActiveAt) > new Date(Date.now() - 5 * 60 * 1000) : false,
          replyRate: 85,
        },
        message: "This week's hidden gem - a highly connected professional!",
      },
    });
  } catch (error) {
    console.error('getHiddenGem error:', error);
    res.status(500).json({ error: 'Failed to fetch hidden gem' });
  }
};

// ======================
// LIVE ACTIVITY (Social Proof)
// ======================
export const getLiveActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { location } = req.query;
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const todayStart = getTodayStart();

    // Count active users in last 15 minutes
    const activeUsersNow = await prisma.user.count({
      where: {
        lastActiveAt: { gte: fifteenMinsAgo },
        isBanned: false,
      },
    });

    // Count connections made today
    const connectionsToday = await prisma.connections.count({
      where: {
        status: 'accepted',
        updatedAt: { gte: todayStart },
      },
    });

    // Count new users today
    const newUsersToday = await prisma.user.count({
      where: {
        createdAt: { gte: todayStart },
      },
    });

    res.json({
      data: {
        activeUsersNow,
        connectionsToday,
        newUsersToday,
        locationLabel: location as string || 'Worldwide',
      },
    });
  } catch (error) {
    console.error('getLiveActivity error:', error);
    res.status(500).json({ error: 'Failed to fetch live activity' });
  }
};

// ======================
// LEADERBOARD (Social Proof)
// ======================
export const getLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { period = 'weekly', limit = 10 } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 10, 50);

    // Try to get from cache (SocialProofLeaderboard)
    const cached = await prisma.social_proof_leaderboards.findMany({
      where: {
        period: period as string,
        scope: 'global',
      },
      orderBy: { rank: 'asc' },
      take: limitNum,
    });

    if (cached.length > 0) {
      res.json({
        data: {
          period,
          leaderboard: cached.map((entry) => ({
            id: entry.userId,
            username: entry.userName,
            name: entry.userName,
            profileImage: entry.userImage,
            college: null,
            connectionCount: entry.score,
          })),
          updatedAt: cached[0].calculatedAt.toISOString(),
        },
      });
      return;
    }

    // Calculate leaderboard from connections (fallback)
    const topConnectors = await prisma.userStats.findMany({
      where: {
        connectionsCount: { gt: 0 },
      },
      orderBy: { connectionsCount: 'desc' },
      take: limitNum,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
            college: true,
          },
        },
      },
    });

    const leaderboard = topConnectors.map((stats) => ({
      id: stats.user.id,
      username: stats.user.username,
      name: stats.user.name,
      profileImage: stats.user.profileImage,
      college: stats.user.college,
      connectionCount: stats.connectionsCount,
    }));

    res.json({
      data: {
        period,
        leaderboard,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('getLeaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

// ======================
// NUDGES (Zeigarnik Effect)
// ======================
export const getNudges = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const nudges: Array<{
      type: string;
      message: string;
      progress: number;
      target: number;
      icon: string;
    }> = [];

    // Get user stats
    const userStats = await prisma.userStats.findUnique({
      where: { userId },
    });

    // Get profile views
    const profileViews = await prisma.profile_views.count({
      where: {
        viewedId: userId,
        viewedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    // Get user profile completeness
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        headline: true,
        bio: true,
        profileImage: true,
        college: true,
        interests: true,
      },
    });

    // Profile view nudge
    if (profileViews > 0) {
      const hasCompleteProfile = user?.headline && user?.bio && user?.profileImage;
      if (!hasCompleteProfile) {
        nudges.push({
          type: 'profile_views',
          message: `${profileViews} people viewed your profile. Complete it to get more connections!`,
          progress: profileViews,
          target: 10,
          icon: '👀',
        });
      }
    }

    // Weekly connections nudge
    const weekStart = getWeekStart();
    const weeklyConnections = await prisma.connections.count({
      where: {
        status: 'accepted',
        updatedAt: { gte: weekStart },
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
    });

    if (weeklyConnections < 10) {
      nudges.push({
        type: 'weekly_connections',
        message: `You're ${weeklyConnections}/10 on weekly connections. ${10 - weeklyConnections} more to go!`,
        progress: weeklyConnections,
        target: 10,
        icon: '🤝',
      });
    }

    // Streak at risk nudge
    const streak = await prisma.engagement_streaks.findUnique({
      where: { userId },
    });

    if (streak && streak.connectionStreak > 0 && !isToday(streak.lastConnectionDate)) {
      nudges.push({
        type: 'streak_at_risk',
        message: `Your ${streak.connectionStreak}-day networking streak is at risk! Connect with someone today.`,
        progress: 0,
        target: 1,
        icon: '🔥',
      });
    }

    // Post engagement nudge
    const todayStart = getTodayStart();
    const todayPosts = await prisma.post.count({
      where: {
        authorId: userId,
        createdAt: { gte: todayStart },
      },
    });

    if (todayPosts === 0 && (userStats?.totalPosts || 0) > 0) {
      nudges.push({
        type: 'daily_post',
        message: "You haven't posted today. Share something with your network!",
        progress: 0,
        target: 1,
        icon: '✍️',
      });
    }

    res.json({ data: nudges });
  } catch (error) {
    console.error('getNudges error:', error);
    res.status(500).json({ error: 'Failed to fetch nudges' });
  }
};

// ======================
// WEEKLY GOALS (Progress)
// ======================
export const getWeeklyGoals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const weekStart = getWeekStart();

    // Count weekly connections
    const connectionsMade = await prisma.connections.count({
      where: {
        status: 'accepted',
        updatedAt: { gte: weekStart },
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
    });

    // Count weekly posts
    const postsMade = await prisma.post.count({
      where: {
        authorId: userId,
        createdAt: { gte: weekStart },
      },
    });

    // Count weekly messages (from UserDailyActivity)
    const weeklyActivity = await prisma.userDailyActivity.aggregate({
      where: {
        userId,
        date: { gte: weekStart },
      },
      _sum: {
        messagesCount: true,
      },
    });

    const messagesSent = weeklyActivity._sum.messagesCount || 0;

    // Define targets
    const connectionsTarget = 10;
    const postsTarget = 3;
    const messagesTarget = 20;

    // Calculate progress percentages
    const connectionsProgress = Math.min(100, Math.round((connectionsMade / connectionsTarget) * 100));
    const postsProgress = Math.min(100, Math.round((postsMade / postsTarget) * 100));
    const messagesProgress = Math.min(100, Math.round((messagesSent / messagesTarget) * 100));

    const isCompleted = connectionsProgress >= 100 && postsProgress >= 100 && messagesProgress >= 100;

    res.json({
      data: {
        id: `weekly-${weekStart.toISOString().split('T')[0]}`,
        weekStart: weekStart.toISOString(),
        connectionsTarget,
        postsTarget,
        messagesTarget,
        connectionsMade,
        postsMade,
        messagesSent,
        isCompleted,
        xpEarned: isCompleted ? 100 : 0,
        connectionsProgress,
        postsProgress,
        messagesProgress,
      },
    });
  } catch (error) {
    console.error('getWeeklyGoals error:', error);
    res.status(500).json({ error: 'Failed to fetch weekly goals' });
  }
};

// ======================
// CONNECTION LIMIT (Scarcity)
// ======================
export const getConnectionLimit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const todayStart = getTodayStart();
    const DAILY_LIMIT = 50;

    // Count connection requests sent today
    const sentToday = await prisma.connections.count({
      where: {
        requesterId: userId,
        createdAt: { gte: todayStart },
      },
    });

    const remaining = Math.max(0, DAILY_LIMIT - sentToday);
    const canSend = remaining > 0;

    // Reset time is tomorrow midnight
    const tomorrow = new Date(todayStart);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    res.json({
      data: {
        canSend,
        remaining,
        limit: DAILY_LIMIT,
        resetsAt: tomorrow.toISOString(),
      },
    });
  } catch (error) {
    console.error('getConnectionLimit error:', error);
    res.status(500).json({ error: 'Failed to fetch connection limit' });
  }
};

// ======================
// SESSION SUMMARY (Peak-End Rule)
// ======================
export const getSessionSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const todayStart = getTodayStart();

    // Get today's activity
    const todayActivity = await prisma.userDailyActivity.findUnique({
      where: {
        userId_date: {
          userId,
          date: todayStart,
        },
      },
    });

    // Count connections accepted today
    const connectionsAccepted = await prisma.connections.count({
      where: {
        status: 'accepted',
        updatedAt: { gte: todayStart },
        addresseeId: userId, // Connections they accepted
      },
    });

    // Count new posts today
    const newPosts = todayActivity?.postsCount || 0;

    // Count messages sent today
    const messagesCount = todayActivity?.messagesCount || 0;

    // Generate appropriate message based on activity
    let message = 'Great session!';
    let emoji = '👋';

    const totalActivity = connectionsAccepted + newPosts + messagesCount;

    if (totalActivity === 0) {
      message = 'See you next time!';
      emoji = '👋';
    } else if (totalActivity >= 10) {
      message = 'Amazing networking today!';
      emoji = '🚀';
    } else if (connectionsAccepted > 0) {
      message = 'Great connections made!';
      emoji = '🤝';
    } else if (newPosts > 0) {
      message = 'Nice content shared!';
      emoji = '✍️';
    } else if (messagesCount > 0) {
      message = 'Good conversations!';
      emoji = '💬';
    }

    res.json({
      data: {
        connectionsAccepted,
        newPosts,
        messagesCount,
        message,
        emoji,
      },
    });
  } catch (error) {
    console.error('getSessionSummary error:', error);
    res.status(500).json({ error: 'Failed to fetch session summary' });
  }
};

// ======================
// CONNECTION CELEBRATION
// ======================
export const getConnectionCelebration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const connectionId = ensureString(req.params.connectionId);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!connectionId) {
      res.status(400).json({ error: 'Connection ID is required' });
      return;
    }

    // Get the connection with both users
    const connection = await prisma.connections.findUnique({
      where: { id: connectionId },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
          },
        },
        addressee: {
          select: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    if (!connection || connection.status !== 'accepted') {
      res.json({ data: null });
      return;
    }

    // Determine the other user
    const connWithRelations = connection as typeof connection & { requester: { id: string; name: string; profileImage: string | null }; addressee: { id: string; name: string; profileImage: string | null } };
    const otherUser = connection.requesterId === userId ? connWithRelations.addressee : connWithRelations.requester;

    // Count mutual connections
    const userConnections = await prisma.connections.findMany({
      where: {
        status: 'accepted',
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
      select: { requesterId: true, addresseeId: true },
    });

    const otherUserConnections = await prisma.connections.findMany({
      where: {
        status: 'accepted',
        OR: [
          { requesterId: otherUser.id },
          { addresseeId: otherUser.id },
        ],
      },
      select: { requesterId: true, addresseeId: true },
    });

    const userConnIds = new Set<string>();
    userConnections.forEach((c) => {
      userConnIds.add(c.requesterId === userId ? c.addresseeId : c.requesterId);
    });

    let mutualConnections = 0;
    otherUserConnections.forEach((c) => {
      const otherId = c.requesterId === otherUser.id ? c.addresseeId : c.requesterId;
      if (userConnIds.has(otherId)) mutualConnections++;
    });

    // Get user's streak
    const streak = await prisma.engagement_streaks.findUnique({
      where: { userId },
    });

    const showConfetti = (streak?.connectionStreak || 0) > 0;

    // Generate celebration message
    const messages = [
      `You're now connected with ${otherUser.name}!`,
      `Great connection! ${otherUser.name} is in your network now.`,
      `Welcome ${otherUser.name} to your professional network!`,
    ];

    res.json({
      data: {
        otherUser: {
          name: otherUser.name,
          profileImage: otherUser.profileImage,
          username: otherUser.username,
        },
        mutualConnections,
        celebrationMessage: messages[Math.floor(Math.random() * messages.length)],
        showConfetti,
      },
    });
  } catch (error) {
    console.error('getConnectionCelebration error:', error);
    res.status(500).json({ error: 'Failed to fetch celebration' });
  }
};

// ======================
// STREAK HISTORY
// ======================
export const getStreakHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 30;

    // Get activity records for streak history
    const activities = await prisma.userDailyActivity.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    });

    const history = activities.map((activity, i) => ({
      id: activity.id,
      date: activity.date.toISOString().split('T')[0],
      type: activity.postsCount > 0 ? 'posting' : activity.messagesCount > 0 ? 'messaging' : 'login',
      streakCount: activities.length - i, // Approximate
      xpEarned: (activity.postsCount * 10) + (activity.commentsCount * 2) + (activity.messagesCount * 1),
      wasAtRisk: false, // TODO: Track this separately
      usedFreeze: false, // TODO: Track this separately
    }));

    res.json(history);
  } catch (error) {
    console.error('getStreakHistory error:', error);
    res.status(500).json({ error: 'Failed to fetch streak history' });
  }
};

// ======================
// DASHBOARD
// ======================
export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get streak data
    const streak = await prisma.engagement_streaks.findUnique({
      where: { userId },
    });

    // Get user stats
    const userStats = await prisma.userStats.findUnique({
      where: { userId },
    });

    // Get weekly goals data
    const weekStart = getWeekStart();
    const connectionsMade = await prisma.connections.count({
      where: {
        status: 'accepted',
        updatedAt: { gte: weekStart },
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
    });

    const postsMade = await prisma.post.count({
      where: {
        authorId: userId,
        createdAt: { gte: weekStart },
      },
    });

    // Calculate rank
    const rank = await prisma.userStats.count({
      where: {
        connectionsCount: { gt: userStats?.connectionsCount || 0 },
      },
    }) + 1;

    res.json({
      data: {
        streaks: {
          connectionStreak: streak?.connectionStreak || 0,
          loginStreak: streak?.loginStreak || 0,
          postingStreak: streak?.postingStreak || 0,
          messagingStreak: streak?.messagingStreak || 0,
        },
        weeklyGoals: {
          connectionsTarget: 10,
          connectionsMade,
          postsTarget: 3,
          postsMade,
        },
        xpEarned: userStats?.xp || 0,
        level: userStats?.level || 1,
        rank,
      },
    });
  } catch (error) {
    console.error('getDashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
};

// ======================
// RECENT JOINS
// ======================
export const getRecentJoins = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Count new users this week
    const count = await prisma.user.count({
      where: {
        createdAt: { gte: weekAgo },
      },
    });

    res.json({
      count,
      label: 'new members this week',
    });
  } catch (error) {
    console.error('getRecentJoins error:', error);
    res.status(500).json({ error: 'Failed to fetch recent joins' });
  }
};

// ======================
// PUBLIC STREAKS
// ======================
export const getPublicStreaks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = ensureString(req.params.userId);
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const streak = await prisma.engagement_streaks.findUnique({
      where: { userId },
    });

    res.json({
      data: {
        connectionStreak: streak?.connectionStreak || 0,
        loginStreak: streak?.loginStreak || 0,
        showOnProfile: true, // TODO: Add to EngagementStreak model
      },
    });
  } catch (error) {
    console.error('getPublicStreaks error:', error);
    res.status(500).json({ error: 'Failed to fetch public streaks' });
  }
};

// ======================
// PURCHASE STREAK FREEZE
// ======================
export const purchaseStreakFreeze = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const XP_COST = 100;

    // Get user stats and streak
    const [userStats, streak] = await Promise.all([
      prisma.userStats.findUnique({ where: { userId } }),
      prisma.engagement_streaks.findUnique({ where: { userId } }),
    ]);

    if (!userStats || userStats.xp < XP_COST) {
      res.status(400).json({ error: 'Not enough XP' });
      return;
    }

    if (!streak) {
      res.status(400).json({ error: 'Streak data not found' });
      return;
    }

    // Deduct XP and add freeze
    await Promise.all([
      prisma.userStats.update({
        where: { userId },
        data: { xp: { decrement: XP_COST } },
      }),
      prisma.engagement_streaks.update({
        where: { userId },
        data: { streakFreezes: { increment: 1 } },
      }),
    ]);

    res.json({
      data: {
        success: true,
        streakFreezes: streak.streakFreezes + 1,
        xpCost: XP_COST,
        message: 'Streak freeze purchased!',
      },
    });
  } catch (error) {
    console.error('purchaseStreakFreeze error:', error);
    res.status(500).json({ error: 'Failed to purchase streak freeze' });
  }
};

// ======================
// TOGGLE STREAK SHIELD
// ======================
export const toggleStreakShield = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const streak = await prisma.engagement_streaks.findUnique({
      where: { userId },
    });

    if (!streak) {
      res.status(400).json({ error: 'Streak data not found' });
      return;
    }

    // Check if user has freezes available
    if (!streak.streakShieldActive && streak.streakFreezes <= 0) {
      res.status(400).json({ error: 'No streak freezes available' });
      return;
    }

    const newShieldState = !streak.streakShieldActive;

    await prisma.engagement_streaks.update({
      where: { userId },
      data: { streakShieldActive: newShieldState },
    });

    res.json({
      data: {
        streakShieldActive: newShieldState,
        message: newShieldState ? 'Streak shield activated!' : 'Streak shield deactivated!',
      },
    });
  } catch (error) {
    console.error('toggleStreakShield error:', error);
    res.status(500).json({ error: 'Failed to toggle streak shield' });
  }
};

// ======================
// STREAK LEADERBOARD
// ======================
export const getStreakLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { type = 'login', limit = 10 } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 10, 50);

    const streakField = type === 'connection' ? 'connectionStreak' :
                        type === 'posting' ? 'postingStreak' :
                        type === 'messaging' ? 'messagingStreak' : 'loginStreak';
    const longestField = type === 'connection' ? 'longestConnectionStreak' :
                         type === 'posting' ? 'longestPostingStreak' :
                         type === 'messaging' ? 'longestMessagingStreak' : 'longestLoginStreak';

    const topStreaks = await prisma.engagement_streaks.findMany({
      where: {
        [streakField]: { gt: 0 },
      },
      orderBy: { [streakField]: 'desc' },
      take: limitNum,
      include: {
        users: {
          select: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
            college: true,
            bio: true,
          },
        },
      },
    });

    // Find current user's rank
    let myRank: number | null = null;
    if (userId) {
      const userStreak = await prisma.engagement_streaks.findUnique({
        where: { userId },
      });

      if (userStreak) {
        const userStreakValue = (userStreak as any)[streakField] || 0;
        myRank = await prisma.engagement_streaks.count({
          where: {
            [streakField]: { gt: userStreakValue },
          },
        }) + 1;
      }
    }

    res.json({
      data: {
        type,
        leaderboard: topStreaks.map((s, i) => ({
          rank: i + 1,
          user: {
            id: s.users.id,
            username: s.users.username,
            name: s.users.name,
            profileImage: s.users.profileImage,
            college: s.users.college ?? null,
            bio: s.users.bio ?? null,
          },
          currentStreak: (s as any)[streakField],
          longestStreak: (s as any)[longestField] ?? (s as any)[streakField],
        })),
        myRank,
      },
    });
  } catch (error) {
    console.error('getStreakLeaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch streak leaderboard' });
  }
};

// ======================
// TOGGLE STREAK VISIBILITY
// ======================
export const toggleStreakVisibility = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // TODO: Add showOnProfile field to EngagementStreak model
    // For now, just return success
    res.json({
      data: {
        showOnProfile: true,
        message: 'Streak visibility updated!',
      },
    });
  } catch (error) {
    console.error('toggleStreakVisibility error:', error);
    res.status(500).json({ error: 'Failed to toggle streak visibility' });
  }
};

// ======================
// HELPER: Update Engagement Streaks
// ======================
export async function updateEngagementStreak(
  userId: string,
  streakType: 'connection' | 'login' | 'posting' | 'messaging'
): Promise<void> {
  try {
    const today = getTodayStart();
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    let streak = await prisma.engagement_streaks.findUnique({
      where: { userId },
    });

    if (!streak) {
      streak = await prisma.engagement_streaks.create({
        data: { userId },
      });
    }

    const fieldMap = {
      connection: { streak: 'connectionStreak', lastDate: 'lastConnectionDate', longest: 'longestConnectionStreak', best: 'bestConnectionStreak' },
      login: { streak: 'loginStreak', lastDate: 'lastLoginDate', longest: 'longestLoginStreak', best: 'bestLoginStreak' },
      posting: { streak: 'postingStreak', lastDate: 'lastPostDate', longest: 'longestPostingStreak', best: 'bestPostingStreak' },
      messaging: { streak: 'messagingStreak', lastDate: 'lastMessageDate', longest: 'longestMessagingStreak', best: 'bestMessagingStreak' },
    };

    const fields = fieldMap[streakType];
    const currentStreak = (streak as any)[fields.streak] as number;
    const lastDate = (streak as any)[fields.lastDate] as Date | null;

    // Check if already updated today
    if (lastDate && isToday(lastDate)) {
      return;
    }

    // Calculate new streak
    let newStreak = 1;
    if (lastDate) {
      const lastDateNorm = new Date(lastDate);
      lastDateNorm.setUTCHours(0, 0, 0, 0);
      if (lastDateNorm.getTime() === yesterday.getTime()) {
        newStreak = currentStreak + 1;
      }
    }

    const currentLongest = (streak as any)[fields.longest] || 0;
    const newLongest = Math.max(currentLongest, newStreak);

    await prisma.engagement_streaks.update({
      where: { userId },
      data: {
        [fields.streak]: newStreak,
        [fields.lastDate]: today,
        [fields.longest]: newLongest,
        [fields.best]: newLongest,
      },
    });

    // Emit Socket.IO event
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('streak:updated', {
        type: streakType,
        newStreak,
        isNewRecord: newStreak > currentLongest,
      });
    }

    console.log(`Updated ${streakType} streak for user ${userId}: ${newStreak}`);
  } catch (error) {
    console.error(`Failed to update ${streakType} streak for user ${userId}:`, error);
  }
}
