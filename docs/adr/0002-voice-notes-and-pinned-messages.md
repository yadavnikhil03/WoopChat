# ADR 0002: Voice Notes & Pinned Message Architecture

## Status
Accepted

## Context
Standard text messaging can feel static and lacks voice expressiveness as well as persistent contextual anchoring for important group instructions or announcements. Adding voice notes and pinned messages elevates WhopChat to a modern messaging tier.

## Decisions
1. **Audio Storage & Transport**: In-browser recording via standard `MediaRecorder` encoding to webm/opus; transmitted as audio payload with explicit duration metadata.
2. **Pinned Message State**:
   - `Message.isPinned`: Boolean flag with index `{ chatId: 1, isPinned: 1 }`.
   - `Conversation.pinnedMessage`: Stored as a direct ObjectId reference on the conversation for O(1) populate during chat initialization without extra queries.
3. **Real-time Synchronisation**:
   - `chat:pinned` & `chat:unpinned` broadcasted to the conversation socket room and active participant sockets.
   - Jump-to-message navigation using client-side DOM IDs with CSS pulse highlighting.

## Consequences
- Voice recording works natively on desktop and mobile browsers without third-party dependencies.
- Pinned messages load instantly with the conversation envelope.

