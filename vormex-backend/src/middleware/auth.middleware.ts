import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';
import { AuthenticatedRequest, ErrorResponse } from '../types/auth.types';

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header and attaches user to request
 * 
 * Usage:
 * router.get('/protected', authenticate, controller)
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response<ErrorResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: 'No token provided. Authorization header is required.',
      });
      return;
    }

    // Extract token from "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        error: 'Invalid token format. Use "Bearer <token>".',
      });
      return;
    }

    const token = parts[1];

    // Verify token
    try {
      const decoded = verifyToken(token);

      // Attach user info to request
      req.user = {
        userId: decoded.userId,
      };

      // Continue to next middleware/controller
      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token verification failed';

      if (errorMessage.includes('expired')) {
        res.status(401).json({
          error: 'Token has expired. Please login again.',
        });
        return;
      }

      res.status(401).json({
        error: 'Invalid or malformed token',
      });
      return;
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'Internal server error during authentication',
    });
  }
};

/**
 * Optional authentication middleware
 * Attempts to verify JWT token but allows request to continue even if no token
 * Useful for endpoints that need user info if available but don't require auth
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // No token provided, continue without user
      next();
      return;
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      // Invalid format, continue without user
      next();
      return;
    }

    const token = parts[1];

    try {
      const decoded = verifyToken(token);
      req.user = {
        userId: decoded.userId,
      };
    } catch (error) {
      // Token invalid, continue without user
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};