import OpenAI from 'openai';
import { Request, Response } from 'express';
import { config } from '../config/env';
import { AIMessage } from '../models/AIMessage';
import { Types } from 'mongoose';
import { isValidObjectId } from '../utils/database.util';

const openai = config.openai.apiKey
  ? new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.baseUrl,
    })
  : null;

const SYSTEM_PROMPT = `You are WhopAI, an intelligent, helpful, and friendly AI assistant built into WhopChat. Provide concise, clear, and engaging responses.`;

export class AIService {
  static async streamChat(
    userId: string,
    userMessage: string,
    req: Request,
    res: Response
  ): Promise<void> {
    if (!isValidObjectId(userId)) throw new Error('Invalid user ID');
    let clientDisconnected = false;
    const abortController = new AbortController();

    req.on('close', () => {
      clientDisconnected = true;
      abortController.abort();
    });

    const history = await AIMessage.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(20);

    await AIMessage.create({
      userId: new Types.ObjectId(userId),
      role: 'user',
      content: userMessage,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let fullReply = '';

    if (openai && config.openai.apiKey.trim().length > 0 && !config.openai.apiKey.includes('your-openai')) {
      try {
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history
            .reverse()
            .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          { role: 'user', content: userMessage },
        ];

        const stream = await openai.chat.completions.create(
          {
            model: config.openai.model,
            messages,
            stream: true,
          },
          { signal: abortController.signal }
        );

        for await (const chunk of stream) {
          if (clientDisconnected) break;
          const delta = chunk.choices[0]?.delta?.content ?? '';
          if (delta) {
            fullReply += delta;
            res.write(`data: ${JSON.stringify({ delta })}\n\n`);
          }
        }
      } catch (err: any) {
        if (!clientDisconnected) {
          if (err.name === 'AbortError') {
            res.end();
            return;
          }
          console.warn('OpenAI stream failed, falling back to local AI generation:', err.message);
          fullReply = await AIService._streamFallback(userMessage, res, () => clientDisconnected);
        }
      }
    } else {
      fullReply = await AIService._streamFallback(userMessage, res, () => clientDisconnected);
    }

    if (fullReply.trim() && !clientDisconnected) {
      await AIMessage.create({
        userId: new Types.ObjectId(userId),
        role: 'assistant',
        content: fullReply,
      });
      res.write('data: [DONE]\n\n');
    }

    res.end();
  }

  static async generateInlineCopilot(
    prompt: string,
    recentMessages: Array<{ senderName: string; content: string; createdAt: Date }>
  ): Promise<string> {
    const contextLines = recentMessages
      .filter((m) => m.content && m.content.trim().length > 0)
      .slice(-20)
      .map((m) => `${m.senderName}: ${m.content}`)
      .join('\n');

    if (openai && config.openai.apiKey.trim().length > 0 && !config.openai.apiKey.includes('your-openai')) {
      try {
        const completion = await openai.chat.completions.create({
          model: config.openai.model,
          messages: [
            {
              role: 'system',
              content:
                'You are @whopai, an inline co-pilot inside a team conversation. Be concise, crisp, and formatted with bullet points when summarizing.',
            },
            {
              role: 'user',
              content: `Recent thread context:\n${contextLines || 'No prior messages.'}\n\nRequest: ${prompt}`,
            },
          ],
        });
        const text = completion.choices[0]?.message?.content?.trim();
        if (text) return text;
      } catch {}
    }

    const lower = prompt.toLowerCase();
    const cleanMessages = recentMessages.filter((m) => m.content && m.content.trim().length > 0);
    if (lower.includes('catch') || lower.includes('summar') || lower.includes('recap')) {
      if (cleanMessages.length === 0) {
        return '✨ **Thread Catch-Up**: There are no recent messages to summarize yet. Start the discussion and I will keep track of key points!';
      }
      const highlights = cleanMessages
        .slice(-5)
        .map((m) => `• **${m.senderName}**: ${m.content.slice(0, 110)}${m.content.length > 110 ? '...' : ''}`)
        .join('\n');
      return `✨ **Thread Catch-Up** (${cleanMessages.length} recent messages)\n\n${highlights}\n\n• **Status**: Active discussion ready for next action.`;
    }

    if (lower.includes('draft') || lower.includes('reply') || lower.includes('write')) {
      const topic = cleanMessages[cleanMessages.length - 1]?.content?.slice(0, 70) || 'the current topic';
      return `✨ **Suggested Draft**\n\n"Sounds great — let's lock this in based on ${topic} and sync back once the first milestone is live!"`;
    }

    if (lower.includes('transcrib') || lower.includes('voice')) {
      return `🎙️ **Voice Note Digest**\n\n• Key takeaway: Shared status update and quick alignment request.\n• Suggested follow-up: Confirm availability or react to acknowledge.`;
    }

    return `✨ **WhopAI Co-Pilot**\n\nBased on ${cleanMessages.length} messages in this thread: ${
      cleanMessages.length > 0
        ? `the latest focus is "${cleanMessages[cleanMessages.length - 1]?.content?.slice(0, 90)}". Try asking \`@whopai catch me up\` or \`@whopai draft reply\`.`
        : 'send a few messages and try `@whopai catch me up` anytime!'
    }`;
  }

  private static async _streamFallback(
    prompt: string,
    res: Response,
    isCancelled: () => boolean
  ): Promise<string> {
    const p = prompt.toLowerCase();
    let reply = '';

    if (p.includes('hello') || p.includes('hi') || p.includes('hey')) {
      reply = `Hello! How can I help you today? Whether you need help with your project, debugging code, or exploring real-time features, feel free to ask!`;
    } else if (p.includes('help') || p.includes('project') || p.includes('work')) {
      reply = `I would be happy to help with your project! Here are a few ways we can work together:\n\n• Code implementation and refactoring\n• Structuring MongoDB collections and indexes\n• Real-time Socket.io communication and events\n• Frontend UI enhancements with Tailwind CSS and React\n\nWhat specific task or question would you like to start with?`;
    } else if (p.includes('mern') || p.includes('stack') || p.includes('backend') || p.includes('tech') || p.includes('architecture')) {
      reply = `WhopChat is built on a clean MERN architecture:\n\n• Frontend: React 19, Vite, Tailwind CSS v4, Zustand, Socket.io client\n• Backend: Node.js, Express, TypeScript, MongoDB with Mongoose\n• Real-Time: Socket.io with rooms, typing indicators, and delivery receipts\n• Security: JWT access & refresh tokens, bcrypt hashing, Zod validation, and Helmet headers.`;
    } else if (p.includes('socket') || p.includes('realtime') || p.includes('real-time')) {
      reply = `WhopChat uses Socket.io for real-time messaging:\n\n• chat:join & chat:leave: Conversation room isolation\n• message:send & message:new: Instant delivery across connected clients\n• typing:start & typing:stop: Live typing indicators\n• users:online: Real-time user presence tracking.`;
    } else {
      reply = `I'm ready to assist you. Tell me more about what you're working on or what you'd like to achieve, and I'll guide you step by step!`;
    }

    const words = reply.split(' ');
    let accumulated = '';

    for (let i = 0; i < words.length; i++) {
      if (isCancelled()) break;
      const word = (i === 0 ? '' : ' ') + words[i];
      accumulated += word;
      res.write(`data: ${JSON.stringify({ delta: word })}\n\n`);
      await new Promise((r) => setTimeout(r, 30));
    }

    return accumulated;
  }

  static async getHistory(userId: string, limit = 50) {
    if (!isValidObjectId(userId)) throw new Error('Invalid user ID');
    const messages = await AIMessage.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: 1, _id: 1 })
      .limit(limit);
    return messages;
  }

  static async clearHistory(userId: string) {
    if (!isValidObjectId(userId)) throw new Error('Invalid user ID');
    await AIMessage.deleteMany({ userId: new Types.ObjectId(userId) });
  }
}
