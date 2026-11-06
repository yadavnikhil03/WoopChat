import { z } from 'zod';

export const createChatSchema = z.discriminatedUnion('isGroup', [
  z.object({
    isGroup: z.literal(false),
    participantId: z.string().min(1, 'Participant ID required'),
  }),
  z.object({
    isGroup: z.literal(true),
    groupName: z.string().min(1, 'Group name required').max(100),
    groupDescription: z.string().max(500).optional(),
    participants: z
      .array(z.string())
      .min(1, 'At least one participant required'),
  }),
]);

export const sendMessageSchema = z.object({
  content: z.string().max(5000).optional().default(''),
  image: z.string().optional(),
  audio: z.string().optional(),
  audioDuration: z.number().optional(),
  replyTo: z.string().optional(),
  isForwarded: z.boolean().optional(),
});

export const editMessageSchema = z.object({
  content: z.string().min(1, 'Content required').max(5000),
});

export const updateGroupSchema = z.object({
  groupName: z.string().min(1).max(100).optional(),
  groupDescription: z.string().max(500).optional(),
  groupAvatar: z.string().url().optional().or(z.literal('')),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
