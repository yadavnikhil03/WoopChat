# Specification: Voice Notes & Pinned Messages

## Summary
Add modern rich communication capabilities to WhopChat:
1. **Voice Notes**: In-browser microphone audio recording with live recording timer and waveform, audio preview, base64 payload delivery, and an interactive waveform audio player with 1x / 1.5x / 2x speed controls.
2. **Pinned Messages**: Ability to pin any message to the top of a conversation with a sticky banner under the chat header, unpin action, and smooth jump-to-message navigation.

## Architecture & Data Contracts

### 1. MongoDB Schema Enhancements

#### Message Model (`Message.ts`)
- `audio`: String (Base64 audio data URI or audio file URL)
- `audioDuration`: Number (recording duration in seconds)
- `isPinned`: Boolean (default: false)
- `pinnedBy`: ObjectId (ref: User)
- `pinnedAt`: Date

Compound Index:
- `{ chatId: 1, isPinned: 1 }`

#### Conversation Model (`Conversation.ts`)
- `pinnedMessage`: ObjectId (ref: Message, default: null)

### 2. Backend Services & Socket Events

#### Socket Events
- `message:send`: Accepts optional `audio` and `audioDuration` alongside text and images.
- `message:pin`: Payload `{ chatId, messageId }`. Updates `Message.isPinned = true` and `Conversation.pinnedMessage = message._id`. Emits `chat:pinned` to room.
- `message:unpin`: Payload `{ chatId }`. Updates `Message.isPinned = false` and `Conversation.pinnedMessage = null`. Emits `chat:unpinned` to room.

#### REST Endpoints
- `POST /api/chats/:chatId/pin/:messageId`: Pin message.
- `DELETE /api/chats/:chatId/pin`: Unpin current message.

### 3. Frontend Experience

#### Voice Recording (`chat-footer.jsx`)
- Microphone button switches input area to active voice recording mode.
- Uses browser `navigator.mediaDevices.getUserMedia({ audio: true })` and `MediaRecorder`.
- Visual animated recording wave indicator, elapsed timer, discard (trash), and send button.

#### Waveform Audio Player (`chat-body-message.jsx` / `audio-player.jsx`)
- Interactive play/pause button.
- Progress scrubber and animated waveform representation.
- Current time and total duration display.
- Playback rate pill button (`1x` -> `1.5x` -> `2x` -> `1x`).

#### Pinned Banner (`chat-header.jsx` / `pinned-banner.jsx`)
- Subtle pinned icon, snippet of pinned content, and quick close/unpin button.
- Clicking the banner smoothly scrolls to the message element in the chat timeline and briefly pulses its background.

