# Ticket 02: Real-time Socket.io Pin & Audio Events

Status: done
Type: task
Blocked by: 01

## Goal
Add real-time Socket.io events for message pinning and audio transmission.

## Acceptance Criteria
1. `message:send` handler supports `audio` and `audioDuration`.
2. `message:pin` event validates ObjectIds, pins the message, and broadcasts `chat:pinned` to room and all conversation participants.
3. `message:unpin` event validates ObjectIds, unpins the message, and broadcasts `chat:unpinned`.
4. Zero comments in code.
