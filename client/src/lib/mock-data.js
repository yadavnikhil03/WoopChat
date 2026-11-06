export const MOCK_USERS = [
  { _id: "user-test-001", name: "Test User", email: "test@test.com", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=TestUser" },
  { _id: "user-002", name: "Priya Sharma", email: "priya@example.com", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Priya" },
  { _id: "user-003", name: "Rahul Verma", email: "rahul@example.com", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Rahul" },
  { _id: "user-004", name: "Anjali Singh", email: "anjali@example.com", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Anjali" },
  { _id: "user-005", name: "Deepak Nair", email: "deepak@example.com", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Deepak" },
];

export const TEST_USER = MOCK_USERS[0];

const now = new Date();
const minsAgo = (m) => new Date(now - m * 60 * 1000).toISOString();

export const MOCK_CHATS = [
  { _id: "chat-001", isGroup: false, participants: [TEST_USER, MOCK_USERS[1]], createdBy: "user-002", lastMessage: { _id: "msg-101", content: "Hey! Did you finish the MERN project?", sender: MOCK_USERS[1], createdAt: minsAgo(5) }, updatedAt: minsAgo(5), createdAt: minsAgo(120) },
  { _id: "chat-002", isGroup: false, participants: [TEST_USER, MOCK_USERS[2]], createdBy: "user-003", lastMessage: { _id: "msg-201", content: "The backend is running on port 8000", sender: MOCK_USERS[2], createdAt: minsAgo(30) }, updatedAt: minsAgo(30), createdAt: minsAgo(200) },
  { _id: "chat-003", isGroup: true, groupName: "MERN Project Team", participants: [TEST_USER, MOCK_USERS[1], MOCK_USERS[2], MOCK_USERS[3]], createdBy: "user-test-001", lastMessage: { _id: "msg-301", content: "Let's meet tomorrow to discuss the demo!", sender: MOCK_USERS[3], createdAt: minsAgo(10) }, updatedAt: minsAgo(10), createdAt: minsAgo(500) },
  { _id: "chat-004", isGroup: false, participants: [TEST_USER, MOCK_USERS[4]], createdBy: "user-test-001", lastMessage: { _id: "msg-401", content: "Socket.io is working perfectly!", sender: TEST_USER, createdAt: minsAgo(60) }, updatedAt: minsAgo(60), createdAt: minsAgo(300) },
];

export const MOCK_MESSAGES = {
  "chat-001": [
    { _id: "msg-001", chatId: "chat-001", content: "Hi! How are you doing?", sender: MOCK_USERS[1], replyTo: null, createdAt: minsAgo(60) },
    { _id: "msg-002", chatId: "chat-001", content: "I'm good! Working on the real-time chat app.", sender: TEST_USER, replyTo: null, createdAt: minsAgo(58) },
    { _id: "msg-003", chatId: "chat-001", content: "Oh nice! Which stack are you using?", sender: MOCK_USERS[1], replyTo: null, createdAt: minsAgo(55) },
    { _id: "msg-004", chatId: "chat-001", content: "MERN! MongoDB, Express, React, Node.js", sender: TEST_USER, replyTo: null, createdAt: minsAgo(52) },
    { _id: "msg-005", chatId: "chat-001", content: "Also added Socket.io for real-time messaging!", sender: TEST_USER, replyTo: null, createdAt: minsAgo(50) },
    { _id: "msg-101", chatId: "chat-001", content: "Hey! Did you finish the MERN project?", sender: MOCK_USERS[1], replyTo: null, createdAt: minsAgo(5) },
  ],
  "chat-002": [
    { _id: "msg-201a", chatId: "chat-002", content: "Hey, can you help me set up the backend?", sender: TEST_USER, replyTo: null, createdAt: minsAgo(90) },
    { _id: "msg-201b", chatId: "chat-002", content: "Sure! First run npm install in the backend folder", sender: MOCK_USERS[2], replyTo: null, createdAt: minsAgo(85) },
    { _id: "msg-201c", chatId: "chat-002", content: "Then set up your .env with MONGO_URI", sender: MOCK_USERS[2], replyTo: null, createdAt: minsAgo(83) },
    { _id: "msg-201", chatId: "chat-002", content: "The backend is running on port 8000", sender: MOCK_USERS[2], replyTo: null, createdAt: minsAgo(30) },
  ],
  "chat-003": [
    { _id: "msg-301a", chatId: "chat-003", content: "Team, the frontend is ready for demo!", sender: TEST_USER, replyTo: null, createdAt: minsAgo(40) },
    { _id: "msg-301b", chatId: "chat-003", content: "Great work! The UI looks really clean.", sender: MOCK_USERS[1], replyTo: null, createdAt: minsAgo(35) },
    { _id: "msg-301c", chatId: "chat-003", content: "I tested the socket connection, it works!", sender: MOCK_USERS[2], replyTo: null, createdAt: minsAgo(25) },
    { _id: "msg-301", chatId: "chat-003", content: "Let's meet tomorrow to discuss the demo!", sender: MOCK_USERS[3], replyTo: null, createdAt: minsAgo(10) },
  ],
  "chat-004": [
    { _id: "msg-401a", chatId: "chat-004", content: "Testing real-time messaging...", sender: TEST_USER, replyTo: null, createdAt: minsAgo(120) },
    { _id: "msg-401b", chatId: "chat-004", content: "Received it instantly! Great stuff.", sender: MOCK_USERS[4], replyTo: null, createdAt: minsAgo(118) },
    { _id: "msg-401", chatId: "chat-004", content: "Socket.io is working perfectly!", sender: TEST_USER, replyTo: null, createdAt: minsAgo(60) },
  ],
};
