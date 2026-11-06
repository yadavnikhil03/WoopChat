let audioCtx = null;
let ringInterval = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playIncomingMessageSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.16);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.08);
    gain2.gain.setValueAtTime(0.14, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.32);
  } catch (err) {
    console.debug("Incoming sound error:", err);
  }
}

export function playOutgoingMessageSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch (err) {
    console.debug("Outgoing sound error:", err);
  }
}

function playSingleRingTone() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(440, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(554.37, now + 0.15);
    gain2.gain.setValueAtTime(0.12, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.5);
  } catch {}
}

export function startRingingSound() {
  stopRingingSound();
  playSingleRingTone();
  ringInterval = setInterval(() => {
    playSingleRingTone();
  }, 2400);
}

export function stopRingingSound() {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
}

export function isChatMuted(chatId) {
  if (!chatId || typeof window === "undefined") return false;
  try {
    const mutedList = JSON.parse(localStorage.getItem("whopchat_muted_chats") || "[]");
    return Array.isArray(mutedList) && mutedList.includes(chatId.toString());
  } catch {
    return false;
  }
}

export function toggleChatMute(chatId) {
  if (!chatId || typeof window === "undefined") return false;
  try {
    let mutedList = JSON.parse(localStorage.getItem("whopchat_muted_chats") || "[]");
    if (!Array.isArray(mutedList)) mutedList = [];
    const idStr = chatId.toString();
    const isNowMuted = !mutedList.includes(idStr);
    if (isNowMuted) {
      mutedList.push(idStr);
    } else {
      mutedList = mutedList.filter((id) => id !== idStr);
    }
    localStorage.setItem("whopchat_muted_chats", JSON.stringify(mutedList));
    return isNowMuted;
  } catch {
    return false;
  }
}

export function showDesktopNotification(title, options = {}) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted" && document.visibilityState !== "visible") {
    try {
      new Notification(title, {
        icon: "/favicon.ico",
        ...options,
      });
    } catch {
    }
  }
}
