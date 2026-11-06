# WhopChat Domain Glossary

This document records the ubiquitous language for the WhopChat codebase. Use these terms consistently in code, tickets, ADRs, and conversations.

## Core Concepts

### Conversation
A communication thread between two or more users.
- **Direct Chat**: Exactly two participants (`isGroup: false`).
- **Group Chat**: Multiple participants with group metadata, creator, and designated admins (`isGroup: true`).

### Participant
A registered user who belongs to a conversation and has access to read and send messages within it.

### Message
An atomic communication entry within a conversation. May contain plain text, an optional image URL, reactions, and a reference to another message being replied to (`replyTo`).

### Message Status & Receipts
The lifecycle state of a message:
- **`sent`**: Saved to the database by the sender.
- **`delivered`**: Emitted via Socket.io to active recipient sockets.
- **`read`**: Acknowledged by recipient client(s) as viewed.

### Presence
Real-time connectivity tracking of a user (`isOnline`, `lastSeen`) maintained by the Socket.io connection pool and user-socket mappings.

### AI Assistant (WhopAI)
Integrated OpenAI-compatible conversational streaming agent accessible within the application with fallback support.

### Voice Note
An audio recording captured via client-side microphone media stream and transmitted as encoded audio with duration and waveform playback controls.

### Pinned Message
A designated message elevated to the top of a conversation for quick reference by all participants.


