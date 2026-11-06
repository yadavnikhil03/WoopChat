import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { sendMessageSchema, editMessageSchema } from '../validators/chat.validator';

const router = Router();

router.use(authenticate);

router.get('/', ChatController.getConversations);
router.post('/', ChatController.createChat);
router.get('/:chatId', ChatController.getConversation);
router.delete('/:chatId', ChatController.deleteGroup);
router.patch('/:chatId', ChatController.updateGroup);

router.get('/:chatId/messages', ChatController.getMessages);
router.post('/:chatId/messages', validate(sendMessageSchema), ChatController.sendMessage);
router.post('/:chatId/read', ChatController.markRead);
router.post('/:chatId/pin/:messageId', ChatController.pinMessage);
router.delete('/:chatId/pin', ChatController.unpinMessage);

router.patch('/messages/:messageId', validate(editMessageSchema), ChatController.editMessage);
router.delete('/messages/:messageId', ChatController.deleteMessage);
router.post('/messages/:messageId/reactions', ChatController.reactToMessage);

router.post('/:chatId/members', ChatController.addMember);
router.delete('/:chatId/members/:userId', ChatController.removeMember);
router.post('/:chatId/leave', ChatController.leaveGroup);
router.post('/:chatId/admins/:userId', ChatController.promoteAdmin);
router.delete('/:chatId/admins/:userId', ChatController.demoteAdmin);

export default router;
