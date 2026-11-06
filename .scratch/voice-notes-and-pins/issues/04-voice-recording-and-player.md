# Ticket 04: Voice Recording & Waveform Audio Player

Status: done
Type: task
Blocked by: 01, 02

## Goal
Implement client-side voice recording in `chat-footer.jsx` and rich waveform playback in message bubbles.

## Acceptance Criteria
1. Microphone icon button in `chat-footer.jsx`.
2. Clicking activates recording using `MediaRecorder`, displays elapsed timer `00:05`, live pulsating wave, cancel button, and send button.
3. Once sent, audio is encoded into base64 and delivered via Socket.io / API.
4. Voice message bubbles render an interactive audio player with waveform bars, play/pause toggle, playback scrubber, duration, and `1x` / `1.5x` / `2x` speed button.
5. Zero comments in code.
