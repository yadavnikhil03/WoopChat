# Ticket 01: Schema & Backend REST API for Audio and Pins

Status: done
Type: task

## Goal
Extend MongoDB models and REST API for voice audio and pinned messages.

## Acceptance Criteria
1. `Message` model has `audio`, `audioDuration`, `isPinned`, `pinnedBy`, `pinnedAt` fields.
2. Compound index on `{ chatId: 1, isPinned: 1 }`.
3. `Conversation` model has `pinnedMessage` reference.
4. `ChatService.pinMessage(chatId, messageId, userId)` validates ObjectIds and sets pinnedMessage.
5. `ChatService.unpinMessage(chatId, userId)` unpins the conversation's pinned message.
6. `POST /api/chats/:chatId/pin/:messageId` and `DELETE /api/chats/:chatId/pin` routes mounted.
7. Zero comments anywhere in code.
