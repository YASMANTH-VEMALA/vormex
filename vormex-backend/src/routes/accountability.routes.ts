import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getPartners, checkIn, getMentorships } from '../controllers/accountability.controller';

const router = Router();

router.use(authenticate);

router.get('/partners', getPartners);
router.post('/partners/:pairId/check-in', checkIn);
router.get('/mentorships', getMentorships);

export default router;
