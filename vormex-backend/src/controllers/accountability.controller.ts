import { Response } from 'express';
import { prisma } from '../config/prisma';

interface AuthenticatedRequest {
  user?: { userId: string };
}

/**
 * Get current accountability partners
 * GET /api/accountability/partners
 */
export const getPartners = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId ? String(req.user.userId) : null;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const pairs = await prisma.accountability_pairs.findMany({
      where: {
        status: 'active',
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        users_accountability_pairs_user1IdTousers: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
            headline: true,
            college: true,
          },
        },
        users_accountability_pairs_user2IdTousers: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
            headline: true,
            college: true,
          },
        },
      },
    });

    const partners = pairs.map((p) => {
      const partner = p.user1Id === userId ? p.users_accountability_pairs_user2IdTousers : p.users_accountability_pairs_user1IdTousers;
      return {
        id: p.id,
        user1Id: p.user1Id,
        user2Id: p.user2Id,
        goal: p.goal,
        status: p.status,
        sharedStreak: p.sharedStreak,
        bestStreak: p.bestStreak,
        lastCheckIn: p.lastCheckIn?.toISOString() ?? null,
        checkInsCompleted: p.checkInsCompleted,
        partner: {
          id: partner.id,
          name: partner.name,
          username: partner.username,
          profileImage: partner.profileImage,
          headline: partner.headline,
          college: partner.college,
        },
      };
    });

    res.json({ partners });
  } catch (error) {
    console.error('Error fetching accountability partners:', error);
    res.status(500).json({ error: 'Failed to fetch partners' });
  }
};

/**
 * Check in for an accountability pair
 * POST /api/accountability/partners/:pairId/check-in
 */
export const checkIn = async (
  req: AuthenticatedRequest & { params: { pairId?: string } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId ? String(req.user.userId) : null;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const pairId = req.params.pairId;
    if (!pairId) {
      res.status(400).json({ error: 'Pair ID required' });
      return;
    }

    const pair = await prisma.accountability_pairs.findFirst({
      where: {
        id: pairId,
        status: 'active',
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    if (!pair) {
      res.status(404).json({ error: 'Pair not found' });
      return;
    }

    const now = new Date();
    const lastCheckIn = pair.lastCheckIn ? new Date(pair.lastCheckIn) : null;
    const lastCheckInDate = lastCheckIn ? lastCheckIn.toISOString().split('T')[0] : null;
    const todayStr = now.toISOString().split('T')[0];

    let newStreak = pair.sharedStreak;
    if (lastCheckInDate === todayStr) {
      return res.status(400).json({ error: 'Already checked in today' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (lastCheckInDate === yesterdayStr) {
      newStreak = pair.sharedStreak + 1;
    } else {
      newStreak = 1;
    }

    const newBest = Math.max(pair.bestStreak, newStreak);

    await prisma.accountability_pairs.update({
      where: { id: pairId },
      data: {
        sharedStreak: newStreak,
        bestStreak: newBest,
        lastCheckIn: now,
        checkInsCompleted: { increment: 1 },
      },
    });

    res.json({
      streak: newStreak,
      bestStreak: newBest,
      checkInsCompleted: pair.checkInsCompleted + 1,
    });
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({ error: 'Failed to check in' });
  }
};

/**
 * Get mentorship matches (stub - returns empty until implemented)
 * GET /api/accountability/mentorships
 */
export const getMentorships = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  res.json({ mentorships: [] });
};
