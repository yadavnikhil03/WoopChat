const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export const sanitizeMongoValue = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMongoValue(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const clean: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (UNSAFE_KEYS.has(key) || key.startsWith('$') || key.includes('.')) {
        continue;
      }
      clean[key] = sanitizeMongoValue(val);
    }
    return clean as T;
  }
  return value;
};

export const escapeRegex = (input: string, maxLen = 64): string => {
  return input
    .trim()
    .slice(0, maxLen)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const SAFE_DATA_IMAGE_RE = /^data:image\/(png|jpeg|jpg|webp|gif|avif);base64,[A-Za-z0-9+/=]+$/i;
const SAFE_DATA_AUDIO_RE =
  /^data:audio\/(webm|mp3|mpeg|wav|ogg|mp4|aac|m4a)(?:;codecs=[A-Za-z0-9,._-]+)?;base64,[A-Za-z0-9+/=]+$/i;
const SAFE_DATA_DOC_RE =
  /^data:(application\/pdf|text\/plain|application\/msword|application\/vnd\.openxmlformats-officedocument\.[a-z0-9.]+);base64,[A-Za-z0-9+/=]+$/i;

export const isSafeHttpUrl = (val: string): boolean => {
  try {
    const parsed = new URL(val);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

const hasControlChars = (str: string): boolean => {
  for (let i = 0; i < str.length; i += 1) {
    const code = str.charCodeAt(i);
    if (code < 32 || code === 127) return true;
  }
  return false;
};

export const isSafeMediaUrl = (
  val: string,
  options: { allowAudio?: boolean; allowDocs?: boolean; maxLength?: number } = {}
): boolean => {
  if (typeof val !== 'string' || val.length === 0) return false;
  const maxLen = options.maxLength ?? 9_500_000;
  if (val.length > maxLen) return false;
  const trimmed = val.trim();
  if (hasControlChars(trimmed)) return false;

  if (trimmed.startsWith('data:')) {
    if (SAFE_DATA_IMAGE_RE.test(trimmed)) return true;
    if (options.allowAudio && SAFE_DATA_AUDIO_RE.test(trimmed)) return true;
    if (options.allowDocs && SAFE_DATA_DOC_RE.test(trimmed)) return true;
    return false;
  }

  return isSafeHttpUrl(trimmed);
};
