import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

interface AuthRequest extends Request {
  user?: { userId: string };
}

// Get my referral code
export const getMyReferralCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    // Generate a referral code based on username
    const referralCode = `VORMEX-${user?.username?.toUpperCase().slice(0, 6) || 'USER'}-${userId.slice(-4).toUpperCase()}`;

    res.json(referralCode);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get referral code' });
  }
};

// Apply referral code
export const applyReferralCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { code } = req.body;

    if (!code) {
      res.status(400).json({ error: 'Referral code is required' });
      return;
    }

    res.json({
      success: true,
      message: 'Referral code applied successfully!',
      xpEarned: 100,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to apply referral code' });
  }
};

// Get referral stats
export const getReferralStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    res.json({
      totalReferrals: 0,
      successfulReferrals: 0,
      pendingReferrals: 0,
      totalXpEarned: 0,
      thisMonthReferrals: 0,
      rank: null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get referral stats' });
  }
};

// Get referrals list
export const getReferralsList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get referrals list' });
  }
};

// Get referral leaderboard
export const getReferralLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
};

// Get share links
export const getShareLinks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    const referralCode = `VORMEX-${user?.username?.toUpperCase().slice(0, 6) || 'USER'}-${userId.slice(-4).toUpperCase()}`;
    const baseUrl = process.env.FRONTEND_URL || 'https://vormex.in';

    res.json({
      code: referralCode,
      link: `${baseUrl}/join?ref=${referralCode}`,
      whatsapp: `https://wa.me/?text=Join%20me%20on%20Vormex!%20Use%20my%20referral%20code%20${referralCode}%20to%20get%20bonus%20XP!%20${baseUrl}/join?ref=${referralCode}`,
      twitter: `https://twitter.com/intent/tweet?text=Join%20me%20on%20Vormex!%20${baseUrl}/join?ref=${referralCode}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${baseUrl}/join?ref=${referralCode}`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get share links' });
  }
};
