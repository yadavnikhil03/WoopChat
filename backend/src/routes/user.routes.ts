import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { updateProfileSchema } from '../validators/auth.validator';

const router = Router();

router.use(authenticate);

router.get('/', UserController.getAllUsers);
router.get('/search', UserController.searchUsers);
router.get('/blocked', UserController.getBlockedUsers);
router.get('/:userId', UserController.getProfile);
router.patch('/me', validate(updateProfileSchema), UserController.updateProfile);
router.post('/block/:userId', UserController.blockUser);
router.post('/unblock/:userId', UserController.unblockUser);

export default router;
