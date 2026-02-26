import { Response } from 'express';
import { AuthenticatedRequest, ErrorResponse } from '../types/auth.types';
import { prisma } from '../config/prisma';

interface NearbyUser {
  id: string;
  username: string;
  name: string;
  profileImage: string | null;
  headline: string | null;
  location: string | null;
  distance?: number;
  isOnline: boolean;
}

interface NearbyUsersResponse {
  users: NearbyUser[];
  locationRequired?: boolean;
  locationPermissionDenied?: boolean;
  total: number;
}

/**
 * Get nearby users
 * GET /api/location/nearby
 */
export const getNearbyUsers = async (
  req: AuthenticatedRequest,
  res: Response<NearbyUsersResponse | ErrorResponse>
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = String(req.user.userId);
    const radius = Math.min(500, Math.max(1, parseInt(req.query.radius as string) || 50));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    // Get current user's location
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { location: true, currentCity: true },
    });

    if (!currentUser || (!currentUser.location && !currentUser.currentCity)) {
      res.status(200).json({
        users: [],
        locationRequired: true,
        total: 0,
      });
      return;
    }

    const userLocation = currentUser.currentCity || currentUser.location;

    // For now, we'll do a simple location string match
    // In production, you'd use geospatial queries with lat/lng
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        isBanned: false,
        OR: [
          { location: { contains: userLocation || '', mode: 'insensitive' } },
          { currentCity: { contains: userLocation || '', mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        username: true,
        name: true,
        profileImage: true,
        headline: true,
        location: true,
        currentCity: true,
        isOnline: true,
      },
    });

    const nearbyUsers: NearbyUser[] = users.map((user) => ({
      id: user.id,
      username: user.username,
      name: user.name,
      profileImage: user.profileImage,
      headline: user.headline,
      location: user.currentCity || user.location,
      isOnline: user.isOnline,
      distance: Math.floor(Math.random() * radius), // Mock distance - replace with real calculation
    }));

    res.status(200).json({
      users: nearbyUsers,
      total: nearbyUsers.length,
    });
  } catch (error) {
    console.error('Error fetching nearby users:', error);
    res.status(500).json({ error: 'Failed to fetch nearby users' });
  }
};

/**
 * Update user location
 * POST /api/location/update
 */
export const updateLocation = async (
  req: AuthenticatedRequest,
  res: Response<{ message: string; location?: string } | ErrorResponse>
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = String(req.user.userId);
    const { latitude, longitude, city, country } = req.body;

    // Build location string
    let location = '';
    if (city && country) {
      location = `${city}, ${country}`;
    } else if (city) {
      location = city;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        currentCity: city || null,
        location: location || null,
      },
    });

    res.status(200).json({
      message: 'Location updated',
      location,
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
};

/**
 * Update location settings
 * PUT /api/location/settings
 */
export const updateLocationSettings = async (
  req: AuthenticatedRequest,
  res: Response<{ message: string } | ErrorResponse>
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // For now, just acknowledge - you can add locationPermission field to User model later
    res.status(200).json({ message: 'Settings updated' });
  } catch (error) {
    console.error('Error updating location settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

/**
 * Get current location
 * GET /api/location/current
 */
export const getCurrentLocation = async (
  req: AuthenticatedRequest,
  res: Response<{ location: string | null; city: string | null } | ErrorResponse>
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = String(req.user.userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { location: true, currentCity: true },
    });

    res.status(200).json({
      location: user?.location || null,
      city: user?.currentCity || null,
    });
  } catch (error) {
    console.error('Error getting location:', error);
    res.status(500).json({ error: 'Failed to get location' });
  }
};
