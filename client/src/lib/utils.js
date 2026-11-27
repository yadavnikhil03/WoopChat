import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const SAFE_DATA_IMAGE_RE = /^data:image\/(png|jpeg|jpg|webp|gif|avif);base64,[A-Za-z0-9+/=]+$/i;
const SAFE_DATA_AUDIO_RE =
  /^data:audio\/(webm|mp3|mpeg|wav|ogg|mp4|aac|m4a)(?:;codecs=[A-Za-z0-9,._-]+)?;base64,[A-Za-z0-9+/=]+$/i;
const SAFE_DATA_DOC_RE =
  /^data:(application\/pdf|text\/plain|application\/msword|application\/vnd\.openxmlformats-officedocument\.[a-z0-9.]+);base64,[A-Za-z0-9+/=]+$/i;

const hasControlChars = (str) => {
  for (let i = 0; i < str.length; i += 1) {
    const code = str.charCodeAt(i);
    if (code < 32 || code === 127) return true;
  }
  return false;
};

export function sanitizeMediaUrl(url, options = {}) {
  if (typeof url !== "string" || !url.trim()) return null;
  const trimmed = url.trim();
  if (hasControlChars(trimmed)) return null;

  if (trimmed.startsWith("/")) {
    return trimmed.startsWith("//") ? null : trimmed;
  }

  if (trimmed.startsWith("data:")) {
    if (SAFE_DATA_IMAGE_RE.test(trimmed)) return trimmed;
    if (options.allowAudio && SAFE_DATA_AUDIO_RE.test(trimmed)) return trimmed;
    if (options.allowDocs && SAFE_DATA_DOC_RE.test(trimmed)) return trimmed;
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return trimmed;
    }
  } catch {
    return null;
  }
  return null;
}
