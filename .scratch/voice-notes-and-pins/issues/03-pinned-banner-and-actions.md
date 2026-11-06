# Ticket 03: Pinned Message Banner & Navigation

Status: done
Type: task
Blocked by: 01, 02

## Goal
Implement pinned message banner in `chat-header.jsx` with jump-to-message functionality and dropdown pin/unpin actions.

## Acceptance Criteria
1. Message context dropdown in `chat-body-message.jsx` includes "Pin message" / "Unpin message" button with pin icon.
2. `PinnedBanner` displays under the chat header when conversation has a pinned message.
3. Clicking the banner smoothly scrolls to the pinned message element `document.getElementById('msg-' + id)` and flashes a highlight ring.
4. Unpin button in banner removes the pin in real time.
5. Zero comments in code.
