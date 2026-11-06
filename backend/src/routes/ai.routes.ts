import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/chat', AIController.streamChat);
router.get('/history', AIController.getHistory);
router.delete('/history', AIController.clearHistory);

export default router;
