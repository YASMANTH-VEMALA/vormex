import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getConversationStarters,
  getRevivalSuggestions,
  fixGrammar,
  getSmartReplies,
  changeTone,
  translateMessage,
  expandMessage,
} from '../controllers/ai-chat.controller';

const router = Router();

router.use(authenticate);

router.post('/conversation-starters', getConversationStarters);
router.post('/revival-suggestions', getRevivalSuggestions);
router.post('/fix-grammar', fixGrammar);
router.post('/smart-replies', getSmartReplies);
router.post('/change-tone', changeTone);
router.post('/translate', translateMessage);
router.post('/expand', expandMessage);

export default router;
