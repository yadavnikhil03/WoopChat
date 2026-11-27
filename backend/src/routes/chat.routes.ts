import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { aiLimiter } from '../middleware/rateLimit.middleware';
import {
  createChatSchema,
  sendMessageSchema,
  editMessageSchema,
  updateGroupSchema,
  reactSchema,
  votePollSchema,
  copilotSchema,
  digestSchema,
  memberActionSchema,
} from '../validators/chat.validator';

const router = Router();

router.use(authenticate);

router.get('/', ChatController.getConversations);
router.post('/', validate(createChatSchema), ChatController.createChat);
router.get('/:chatId', ChatController.getConversation);
router.delete('/:chatId', ChatController.deleteGroup);
router.patch('/:chatId', validate(updateGroupSchema), ChatController.updateGroup);

router.get('/:chatId/messages', ChatController.getMessages);
router.post('/:chatId/messages', validate(sendMessageSchema), ChatController.sendMessage);
router.post('/:chatId/copilot', aiLimiter, validate(copilotSchema), ChatController.askInlineCopilot);
router.post('/:chatId/digest', aiLimiter, validate(digestSchema), ChatController.createDigest);
router.get('/:chatId/scheduled', ChatController.getScheduledMessages);
router.delete('/scheduled/:messageId', ChatController.cancelScheduledMessage);

router.post('/:chatId/read', ChatController.markRead);
router.post('/:chatId/pin/:messageId', ChatController.pinMessage);
router.delete('/:chatId/pin', ChatController.unpinMessage);

router.patch('/messages/:messageId', validate(editMessageSchema), ChatController.editMessage);
router.delete('/messages/:messageId', ChatController.deleteMessage);
router.post('/messages/:messageId/reactions', validate(reactSchema), ChatController.reactToMessage);
router.post('/messages/:messageId/vote', validate(votePollSchema), ChatController.votePoll);

router.post('/:chatId/members', validate(memberActionSchema), ChatController.addMember);
router.delete('/:chatId/members/:userId', ChatController.removeMember);
router.post('/:chatId/leave', ChatController.leaveGroup);
router.post('/:chatId/admins/:userId', ChatController.promoteAdmin);
router.delete('/:chatId/admins/:userId', ChatController.demoteAdmin);

export default router;
