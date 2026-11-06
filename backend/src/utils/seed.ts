import mongoose from 'mongoose';
import { config } from '../config/env';
import { User } from '../models/User';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { RefreshToken } from '../models/RefreshToken';
import { AIMessage } from '../models/AIMessage';

export const seedDatabase = async (force = false, disconnectAfter = true) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.mongoUri, { dbName: 'whopchat' });
    }
    const count = await User.countDocuments();
    if (!force && count > 0) {
      console.log(`ℹ️ Database already initialized with ${count} users. Skipping auto-seed.`);
      return;
    }
    console.log('Seeding initial WhopChat data...');

    await Promise.all([
      User.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
      RefreshToken.deleteMany({}),
      AIMessage.deleteMany({}),
    ]);
    console.log('Cleared existing collections.');

    const users = await User.create([
      {
        name: 'Test User',
        email: 'test@test.com',
        password: 'test123',
        avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=TestUser',
        status: 'Exploring WhopChat real-time messaging',
        bio: 'Full-stack developer testing WhopChat.',
        isOnline: true,
      },
      {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        password: 'password123',
        avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Priya',
        status: 'Coding with React 19 & Tailwind',
        bio: 'Frontend enthusiast.',
        isOnline: true,
      },
      {
        name: 'Rahul Verma',
        email: 'rahul@example.com',
        password: 'password123',
        avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Rahul',
        status: 'Node.js & MongoDB backend engineering',
        bio: 'Systems & Backend Engineer.',
        isOnline: true,
      },
      {
        name: 'Anjali Singh',
        email: 'anjali@example.com',
        password: 'password123',
        avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Anjali',
        status: 'Designing sleek conversational UIs',
        bio: 'UI/UX Designer.',
        isOnline: false,
      },
      {
        name: 'Deepak Nair',
        email: 'deepak@example.com',
        password: 'password123',
        avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Deepak',
        status: 'Socket.io real-time streaming rocks!',
        bio: 'Real-time infrastructure architect.',
        isOnline: true,
      },
    ]);

    const [testUser, priya, rahul, anjali, deepak] = users;

    const chat1 = await Conversation.create({
      isGroup: false,
      participants: [testUser!._id, priya!._id],
      createdBy: priya!._id,
    });

    const m1 = await Message.create({
      chatId: chat1._id,
      sender: priya!._id,
      content: 'Hi! How are you doing?',
      status: 'read',
      readBy: [priya!._id, testUser!._id],
    });

    const m2 = await Message.create({
      chatId: chat1._id,
      sender: testUser!._id,
      content: "I'm good! Working on the real-time chat app.",
      status: 'read',
      readBy: [priya!._id, testUser!._id],
    });

    const m3 = await Message.create({
      chatId: chat1._id,
      sender: priya!._id,
      content: 'Hey! Did you finish the MERN project?',
      status: 'read',
      readBy: [priya!._id, testUser!._id],
    });

    chat1.lastMessage = m3._id;
    await chat1.save();

    const chat2 = await Conversation.create({
      isGroup: false,
      participants: [testUser!._id, rahul!._id],
      createdBy: rahul!._id,
    });

    const m4 = await Message.create({
      chatId: chat2._id,
      sender: testUser!._id,
      content: 'Hey, can you help me set up the backend?',
      status: 'read',
      readBy: [rahul!._id, testUser!._id],
    });

    const m5 = await Message.create({
      chatId: chat2._id,
      sender: rahul!._id,
      content: 'The backend is running on port 8000 with Express & Socket.io!',
      status: 'read',
      readBy: [rahul!._id, testUser!._id],
    });

    chat2.lastMessage = m5._id;
    await chat2.save();

    const groupChat = await Conversation.create({
      isGroup: true,
      groupName: 'MERN Project Team',
      groupDescription: 'Collaborative team working on the WhopChat production stack',
      participants: [testUser!._id, priya!._id, rahul!._id, anjali!._id],
      admins: [testUser!._id],
      createdBy: testUser!._id,
    });

    const gm0 = await Message.create({
      chatId: groupChat._id,
      sender: testUser!._id,
      content: '🎉 Test User created group "MERN Project Team"',
      status: 'read',
      readBy: [testUser!._id, priya!._id, rahul!._id, anjali!._id],
      createdAt: new Date(Date.now() - 3600000),
    });

    const gm1 = await Message.create({
      chatId: groupChat._id,
      sender: testUser!._id,
      content: 'Team, the backend and frontend are connected and running!',
      status: 'read',
      readBy: [testUser!._id],
    });

    const gm2 = await Message.create({
      chatId: groupChat._id,
      sender: anjali!._id,
      content: "Let's meet tomorrow to discuss the demo!",
      status: 'read',
      readBy: [testUser!._id, anjali!._id],
    });

    groupChat.lastMessage = gm2._id;
    await groupChat.save();

    const chat3 = await Conversation.create({
      isGroup: false,
      participants: [testUser!._id, deepak!._id],
      createdBy: testUser!._id,
    });

    const dm1 = await Message.create({
      chatId: chat3._id,
      sender: deepak!._id,
      content: 'Socket.io is working perfectly!',
      status: 'read',
      readBy: [deepak!._id, testUser!._id],
    });

    chat3.lastMessage = dm1._id;
    await chat3.save();

    const baseTime = Date.now() - 1000 * 180; 
    await AIMessage.create([
      {
        userId: testUser!._id,
        role: 'user',
        content: 'What is WhopChat?',
        createdAt: new Date(baseTime),
      },
      {
        userId: testUser!._id,
        role: 'assistant',
        content:
          'WhopChat is a high-performance real-time messaging platform powered by the MERN stack (MongoDB, Express, React 19, Node.js) with Socket.io real-time streaming and JWT security.',
        createdAt: new Date(baseTime + 5000),
      },
      {
        userId: testUser!._id,
        role: 'user',
        content: 'What real-time features does it include?',
        createdAt: new Date(baseTime + 30000),
      },
      {
        userId: testUser!._id,
        role: 'assistant',
        content:
          'WhopChat provides sub-millisecond Socket.io real-time features:\n\n• Instant 1-on-1 and Group messaging\n• Real-time delivery and read receipts\n• Live typing indicators and user presence (online/offline)\n• Streaming AI assistant with conversation memory\n• Video calling and media attachments.',
        createdAt: new Date(baseTime + 35000),
      },
    ]);

    console.log('✅ Database successfully seeded with demo users and conversations!');
    console.log('   Demo credentials: test@test.com / test123');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    if (disconnectAfter) {
      await mongoose.disconnect();
    }
  }
};

if (require.main === module) {
  seedDatabase(true, true).then(() => process.exit(0));
}

