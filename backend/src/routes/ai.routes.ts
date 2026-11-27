import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { aiLimiter } from '../middleware/rateLimit.middleware';
import { aiChatSchema } from '../validators/chat.validator';

const router = Router();

router.use(authenticate);

router.post('/chat', aiLimiter, validate(aiChatSchema), AIController.streamChat);
router.get('/history', AIController.getHistory);
router.delete('/history', AIController.clearHistory);

export default router;
