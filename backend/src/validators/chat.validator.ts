import { z } from 'zod';
import { isValidObjectId } from '../utils/database.util';
import { isSafeMediaUrl } from '../utils/sanitize.util';

const objectIdString = z.string().refine(isValidObjectId, 'Invalid ID format');

export const createChatSchema = z.discriminatedUnion('isGroup', [
  z.object({
    isGroup: z.literal(false),
    participantId: objectIdString,
  }),
  z.object({
    isGroup: z.literal(true),
    groupName: z.string().trim().min(1, 'Group name required').max(100),
    groupDescription: z.string().trim().max(500).optional(),
    participants: z
      .array(objectIdString)
      .min(1, 'At least one participant required')
      .max(100),
  }),
]);

export const sendMessageSchema = z.object({
  content: z.string().max(5000).optional().default(''),
  messageType: z.enum(['text', 'poll', 'code', 'digest', 'ai_copilot', 'whisper']).optional(),
  image: z
    .string()
    .refine(
      (val) => isSafeMediaUrl(val, { allowAudio: true, allowDocs: true }),
      'Unsupported attachment format or size'
    )
    .optional()
    .nullable(),
  audio: z
    .string()
    .refine(
      (val) => isSafeMediaUrl(val, { allowAudio: true, maxLength: 3_000_000 }),
      'Unsupported audio format or size'
    )
    .optional()
    .nullable(),
  audioDuration: z.number().min(0).max(3600).optional(),
  replyTo: objectIdString.optional().nullable(),
  isForwarded: z.boolean().optional(),
  poll: z
    .object({
      question: z.string().trim().min(1).max(300),
      options: z
        .array(
          z.object({
            id: z.string().trim().min(1).max(64),
            text: z.string().trim().min(1).max(160),
          })
        )
        .min(2)
        .max(6),
      allowMultiple: z.boolean().optional(),
    })
    .optional(),
  codeBlock: z
    .object({
      language: z.string().trim().max(40).optional(),
      title: z.string().trim().max(120).optional(),
      code: z.string().min(1).max(4000),
    })
    .optional(),
  digest: z
    .object({
      title: z.string().trim().min(1).max(200),
      subtitle: z.string().trim().max(300).optional(),
      highlights: z.array(z.string().max(400)).max(10),
      messageCount: z.number().int().min(0).max(10000).optional(),
      participantCount: z.number().int().min(0).max(1000).optional(),
    })
    .optional(),
  whisperTo: z.array(objectIdString).max(50).optional(),
  ephemeralSeconds: z.number().int().min(5).max(86400).nullable().optional(),
  scheduledFor: z.string().datetime().nullable().optional(),
});

export const editMessageSchema = z.object({
  content: z.string().trim().min(1, 'Content required').max(5000),
});

export const updateGroupSchema = z.object({
  groupName: z.string().trim().min(1).max(100).optional(),
  groupDescription: z.string().trim().max(500).optional(),
  groupAvatar: z
    .string()
    .refine(
      (val) => val === '' || isSafeMediaUrl(val, { maxLength: 2_000_000 }),
      'Invalid or unsupported group avatar URL'
    )
    .optional(),
});

export const reactSchema = z.object({
  emoji: z.string().trim().min(1, 'Emoji is required').max(16),
  chatId: objectIdString.optional(),
});

export const votePollSchema = z.object({
  optionId: z.string().trim().min(1, 'Option ID is required').max(64),
});

export const copilotSchema = z.object({
  prompt: z.string().trim().min(1).max(1000).optional().default('catch me up'),
});

export const digestSchema = z.object({
  publishToChat: z.boolean().optional().default(false),
});

export const memberActionSchema = z.object({
  userId: objectIdString,
});

export const aiChatSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(4000),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
