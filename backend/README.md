# WhopChat Backend Documentation

A production-ready, highly modular backend for **WhopChat** built with Node.js, Express, TypeScript, MongoDB with Mongoose, and Socket.io.

---

## 🛠 Technology Stack

- **Runtime & Language:** Node.js & TypeScript
- **Web Framework:** Express.js 4.x
- **Database & ODM:** MongoDB with Mongoose 8.x
- **Real-Time Communication:** Socket.io 4.x
- **Authentication:** JWT (Short-lived Access Tokens + Rotating Refresh Tokens with HTTP-only Cookies)
- **Password Security:** bcryptjs (12 salt rounds)
- **Validation:** Zod schemas for all request payloads
- **Security Middleware:** Helmet, CORS, and Express Rate Limiting
- **AI Integration:** OpenAI-compatible streaming LLM integration with client cancellation and fallback

---

## 📁 Directory Structure

```text
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── env.ts
│   ├── controllers/
│   │   ├── ai.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── chat.controller.ts
│   │   └── user.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   └── validate.middleware.ts
│   ├── models/
│   │   ├── AIMessage.ts
│   │   ├── Conversation.ts
│   │   ├── Message.ts
│   │   ├── RefreshToken.ts
│   │   └── User.ts
│   ├── routes/
│   │   ├── ai.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── chat.routes.ts
│   │   └── user.routes.ts
│   ├── services/
│   │   ├── ai.service.ts
│   │   ├── auth.service.ts
│   │   ├── chat.service.ts
│   │   └── user.service.ts
│   ├── sockets/
│   │   └── socket.handler.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── cookie.ts
│   │   ├── database.util.ts
│   │   ├── jwt.ts
│   │   ├── response.ts
│   │   └── seed.ts
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   └── chat.validator.ts
│   ├── app.ts
│   └── server.ts
├── .env.example
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js >= 18.x
- MongoDB (Local instance, Docker, or MongoDB Atlas free cloud cluster)

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration values:
```env
PORT=8000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/whopchat
JWT_ACCESS_SECRET=whopchat_super_secret_access_jwt_key_2026_prod
JWT_REFRESH_SECRET=whopchat_super_secret_refresh_jwt_key_2026_prod
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

### 3. Database Setup Instructions

Choose **one** of the following options:

#### Option A: Docker (Fastest)
```bash
docker run -d -p 27017:27017 --name whopchat-mongo mongo:latest
```

#### Option B: MongoDB Atlas (Cloud Free Tier)
1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free M0 cluster and create a database user.
3. In Network Access, whitelist `0.0.0.0/0` (or your current IP).
4. Get your connection string (e.g. `mongodb+srv://<username>:<password>@cluster0.mongodb.net/whopchat?retryWrites=true&w=majority`).
5. Paste it as `MONGO_URI` in `backend/.env`.

#### Option C: Local MongoDB Community Server
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community).
2. Start the service (runs by default on port `27017`).

### 4. Seed Initial Data
Populate the database with demo users, conversations, and messages:
```bash
npm run seed
```
Demo Account:
- **Email:** `test@test.com`
- **Password:** `test123`

### 5. Start Backend Server
```bash
# Development (with hot-reload)
npm run dev

# Production Build & Start
npm run build
npm start
```

---

## 📡 REST API Reference

All successful responses follow this format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user with name, email, password | No |
| `POST` | `/api/auth/login` | Login with email & password | No |
| `POST` | `/api/auth/refresh` | Rotate access & refresh token | Yes (Cookie) |
| `POST` | `/api/auth/logout` | Revoke refresh token & sign out | Yes |
| `GET` | `/api/auth/me` | Fetch currently logged-in user profile | Yes |
| `POST` | `/api/auth/forgot-password` | Request password reset token | No |
| `POST` | `/api/auth/reset-password` | Reset password using valid token | No |

### Users (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users` | List all users (excluding current user) | Yes |
| `GET` | `/api/users/search?q=:query` | Search users by name or email | Yes |
| `GET` | `/api/users/:userId` | Get specific user public profile | Yes |
| `PATCH` | `/api/users/me` | Update name, bio, status, or avatar | Yes |
| `POST` | `/api/users/block/:userId` | Block a user | Yes |
| `POST` | `/api/users/unblock/:userId` | Unblock a user | Yes |
| `GET` | `/api/users/blocked` | List blocked users | Yes |

### Conversations & Messages (`/api/chats`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/chats` | List user's conversations sorted by latest activity | Yes |
| `POST` | `/api/chats` | Create 1-on-1 or group conversation | Yes |
| `GET` | `/api/chats/:chatId` | Get single conversation details | Yes |
| `DELETE` | `/api/chats/:chatId` | Delete a group conversation (Admins only) | Yes |
| `PATCH` | `/api/chats/:chatId` | Update group name/description/avatar | Yes |
| `GET` | `/api/chats/:chatId/messages` | Get paginated message history | Yes |
| `POST` | `/api/chats/:chatId/messages` | Send a new message | Yes |
| `POST` | `/api/chats/:chatId/read` | Mark all unread messages as read | Yes |
| `PATCH` | `/api/chats/messages/:messageId`| Edit a message (Author only) | Yes |
| `DELETE`| `/api/chats/messages/:messageId`| Soft delete a message (Author only) | Yes |
| `POST` | `/api/chats/:chatId/members` | Add a participant to a group | Yes |
| `DELETE`| `/api/chats/:chatId/members/:userId` | Remove member from group | Yes |

### AI Integration (`/api/ai`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/ai/chat` | Stream AI response via Server-Sent Events (SSE) with context | Yes |
| `GET` | `/api/ai/history` | Get past AI conversation history | Yes |
| `DELETE`| `/api/ai/history`| Clear AI conversation history | Yes |

---

## 🔌 Socket.io Real-Time Events

### Connection & Auth
Connect with Bearer access token:
```javascript
const socket = io("http://localhost:8000", {
  auth: { token: accessToken },
  withCredentials: true
});
```

### Client -> Server Events

- `chat:join` (`chatId: string`): Join conversation room
- `chat:leave` (`chatId: string`): Leave conversation room
- `message:send` (`{ chatId, content, image?, replyTo? }`): Send instant message
- `typing:start` (`{ chatId }`): Broadcast typing indicator
- `typing:stop` (`{ chatId }`): Stop typing indicator
- `message:read` (`{ chatId }`): Acknowledge read receipt
- `message:edit` (`{ messageId, chatId, content }`): Edit message in real-time
- `message:delete` (`{ messageId, chatId }`): Delete message in real-time

### Server -> Client Events

- `message:new` (`messageObject`): New message received in room
- `typing:start` (`{ chatId, userId, user }`): Participant is typing
- `typing:stop` (`{ chatId, userId }`): Participant stopped typing
- `message:read` (`{ chatId, userId }`): Messages marked as read
- `message:delivered` (`{ chatId, messageId }`): Delivery receipt confirmation
- `message:edited` (`updatedMessage`): Message content modified
- `message:deleted` (`{ messageId, chatId }`): Message removed
- `user:online` (`{ userId }`): Broadcast when a user connects
- `user:offline` (`{ userId }`): Broadcast when a user disconnects
- `users:online` (`{ onlineUsers: string[] }`): Initial list of active online user IDs
- `chat:new` (`conversationObject`): Broadcast to participants when added to a new chat

---

## 🔒 Security Measures

1. **Helmet:** Enforces secure HTTP headers (XSS Filter, HSTS, frameguard, etc.).
2. **CORS:** Restricted strictly to client origin with credential support.
3. **Rate Limiting:** Protects `/api/auth` endpoints (20 req / 15m) and general API (300 req / 15m).
4. **JWT Security:**
   - Access tokens have short lifetime (15 minutes).
   - Refresh tokens stored in MongoDB with TTL auto-expiration.
   - Refresh tokens transmitted via `HttpOnly`, `SameSite` cookies to prevent XSS exfiltration.
5. **Database Indexes:**
   - TTL index on `RefreshToken.expiresAt`.
   - Text index on `User.name` and `User.email` for efficient lookup.
   - Compound indexes on `Message.chatId + Message.createdAt` for fast pagination.
   - Access permission enforcement on every conversation read/write.

