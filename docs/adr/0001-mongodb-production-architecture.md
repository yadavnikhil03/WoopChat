# ADR 0001: MongoDB Production Architecture & Resilience

## Status

Accepted

## Context

WhopChat requires a resilient, high-performance database layer supporting real-time chat operations, compound querying, message pagination, presence tracking, and graceful server restarts.

## Decisions

1. **Connection Pooling**: Configured `maxPoolSize: 50`, `minPoolSize: 10`, `socketTimeoutMS: 45000`, `connectTimeoutMS: 10000`, `serverSelectionTimeoutMS: 3000`, and `heartbeatFrequencyMS: 10000` to prevent socket exhaustion and handle high concurrency.
2. **Compound Indexing**:
   - `User`: `{ name: 'text', email: 'text' }`, `{ isOnline: 1, lastSeen: -1 }`, and `{ createdAt: -1 }`.
   - `Conversation`: `{ participants: 1, updatedAt: -1 }`, `{ participants: 1, isGroup: 1 }`, `{ isGroup: 1 }`, and `{ updatedAt: -1 }`.
   - `Message`: `{ chatId: 1, isDeleted: 1, createdAt: 1, _id: 1 }`, `{ replyTo: 1 }`, and `{ readBy: 1 }`.
   - `RefreshToken`: TTL index on `{ expiresAt: 1 }` with `expireAfterSeconds: 0`.
   - `AIMessage`: `{ userId: 1, createdAt: -1 }`.
3. **ObjectId Validation & Sanitization**: Strict input validation using `isValidObjectId()` across all service methods and Socket.io event receivers before executing database queries.
4. **Health Check & Latency Probing**: Built-in `/api/health` endpoint actively measuring round-trip database ping latency via `db.admin().ping()`.
5. **Graceful Shutdown**: Intercepts `SIGINT` and `SIGTERM` signals to cleanly drain active socket connections and disconnect Mongoose prior to process termination.

## Consequences

- Queries and message pagination are fully index-backed with O(log N) retrieval.
- Prevents database connection leaks and invalid CastError crashes on malformed input.
- Database health is observable at any time via HTTP.

