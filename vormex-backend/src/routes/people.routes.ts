import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import {
  getPeople,
  getSuggestions,
  getPeopleFromSameCollege,
  getPeopleNearMe,
  getFilterOptions,
} from '../controllers/people.controller';

const router = Router();

/**
 * People Discovery Routes
 * 
 * GET /api/people - Search and filter people (public with optional auth)
 * GET /api/people/suggestions - Get personalized suggestions (protected)
 * GET /api/people/same-college - Get people from same college (protected)
 * GET /api/people/near-me - Get people nearby (protected)
 * GET /api/people/filter-options - Get available filter options (public)
 */

// Filter options should be first to avoid path conflicts (optional auth - works for both logged in and anonymous)
router.get('/filter-options', optionalAuth, getFilterOptions);

// Protected routes
router.get('/suggestions', authenticate, getSuggestions);
router.get('/same-college', authenticate, getPeopleFromSameCollege);
router.get('/near-me', authenticate, getPeopleNearMe);

// Main people search (optional auth for personalized results)
router.get('/', optionalAuth, getPeople);

export default router;
