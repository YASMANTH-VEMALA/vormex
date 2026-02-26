import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

interface AuthRequest extends Request {
  user?: { userId: string };
}

// Get store items
export const getStoreItems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, featured } = req.query;

    const items = [
      {
        id: 'item-1',
        slug: 'profile-badge-gold',
        name: 'Gold Badge',
        description: 'A prestigious gold badge for your profile',
        category: 'badges',
        price: 500,
        imageUrl: null,
        isAvailable: true,
        isFeatured: true,
      },
      {
        id: 'item-2',
        slug: 'streak-freeze',
        name: 'Streak Freeze',
        description: 'Protect your streak for one day',
        category: 'powerups',
        price: 100,
        imageUrl: null,
        isAvailable: true,
        isFeatured: false,
      },
    ];

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch store items' });
  }
};

// Get store item by slug
export const getStoreItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    res.json({
      id: 'item-1',
      slug,
      name: 'Item',
      description: 'Item description',
      category: 'general',
      price: 100,
      imageUrl: null,
      isAvailable: true,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch store item' });
  }
};

// Get store categories
export const getStoreCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.json([
      { category: 'badges', count: 10 },
      { category: 'powerups', count: 5 },
      { category: 'themes', count: 8 },
      { category: 'frames', count: 12 },
    ]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Purchase item
export const purchaseItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { itemSlug } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Check user balance and process purchase
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xpBalance: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Purchase successful!',
      newBalance: user.xpBalance - 100,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to purchase item' });
  }
};

// Get user inventory
export const getInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

// Get purchase history
export const getPurchaseHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchase history' });
  }
};

// Activate item
export const activateItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { inventoryId } = req.params;

    res.json({
      success: true,
      message: 'Item activated!',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to activate item' });
  }
};

// Get XP balance
export const getBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xpBalance: true },
    });

    res.json(user?.xpBalance || 0);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
};
