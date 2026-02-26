import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Authentication Routes
 * 
 * POST /api/auth/register - Register a new user
 * POST /api/auth/login - Login user
 * GET /api/auth/me - Get current authenticated user profile
 */

// Register endpoint
router.post('/register', register);

// Login endpoint
router.post('/login', login);

// Get current user endpoint (protected)
router.get('/me', authenticate, getCurrentUser);

export default router;

