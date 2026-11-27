import { memo, useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { cn, sanitizeMediaUrl } from "@/lib/utils";
import { formatMessageTime, formatFullDateTime } from "@/lib/helper";
import {
  CheckCheck,
  Video,
  Phone,
  PhoneOff,
  Play,
  Pause,
  Pencil,
  Trash2,
  CornerUpLeft,
  Copy,
  Check,
  X,
  Forward,
  Download,
  Smile,
  FileText,
  Pin,
  Sparkles,
  Flame,
  BarChart3,
  Code2,
  Newspaper,
  EyeOff,
} from "lucide-react";
import { FormattedText } from "./formatted-text";
import { toast } from "sonner";

const WAVE_BARS = [35, 65, 45, 85, 55, 95, 70, 40, 80, 60, 90, 75, 45, 80, 50, 70, 85, 40];

const parseDurationFromContent = (content) => {
  if (typeof content !== "string") return 0;
  const match = content.match(/\((\d+):(\d+)\)/);
  if (match) {
    const mins = parseInt(match[1], 10) || 0;
    const secs = parseInt(match[2], 10) || 0;
    return mins * 60 + secs;
  }
  return 0;
};

const formatAudioTime = (sec) => {
  if (isNaN(sec) || !isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

const formatRemainingTtl = (sec) => {
  if (sec <= 0) return "0s";
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.ceil(sec / 60)}m`;
  return `${Math.ceil(sec / 3600)}h`;
};

const ChatMessageBody = memo(
  ({ message, onReply, onForward, isGroup = false, searchQuery = "" }) => {
    const { user } = useAuth();
    const currentUserId = user?._id;
    const {
      editMessage,
      deleteMessage,
      toggleReaction,
      pinMessage,
      unpinMessage,
      votePoll,
      askInlineCopilot,
      removeExpiredMessage,
    } = useChat();

    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const [audioCurrentTime, setAudioCurrentTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState(
      () => message.audioDuration || parseDurationFromContent(message.content)
    );
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const audioPlayerRef = useRef(null);
    const synthTimerRef = useRef(null);

    const [remainingTtl, setRemainingTtl] = useState(() => {
      if (!message.expiresAt) return null;
      return Math.max(0, Math.ceil((new Date(message.expiresAt).getTime() - Date.now()) / 1000));
    });
    const [isBurning, setIsBurning] = useState(false);
    const [isSummarizingVoice, setIsSummarizingVoice] = useState(false);
    const [isCopiedCode, setIsCopiedCode] = useState(false);

    useEffect(() => {
      if (!message.expiresAt) return;
      const targetMs = new Date(message.expiresAt).getTime();

      const tick = () => {
        const left = Math.ceil((targetMs - Date.now()) / 1000);
        if (left <= 0) {
          setRemainingTtl(0);
          setIsBurning(true);
          setTimeout(() => {
            removeExpiredMessage(message._id);
          }, 620);
          return true;
        }
        setRemainingTtl(left);
        return false;
      };

      if (tick()) return;
      const timer = setInterval(() => {
        if (tick()) clearInterval(timer);
      }, 1000);

      return () => clearInterval(timer);
    }, [message.expiresAt, message._id, removeExpiredMessage]);

    useEffect(() => {
      return () => {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.pause();
          audioPlayerRef.current = null;
        }
        if (synthTimerRef.current) {
          clearInterval(synthTimerRef.current);
          synthTimerRef.current = null;
        }
      };
    }, []);

    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content || "");
    const [isCopied, setIsCopied] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleToggleReaction = (emoji) => {
      if (toggleReaction && message.chatId && message._id) {
        toggleReaction(message.chatId, message._id, emoji);
      }
    };

    const handleDownloadImage = () => {
      if (!safeAttachmentUrl) return;
      const a = document.createElement("a");
      a.href = safeAttachmentUrl;
      a.download = `whopchat-image-${message._id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Image downloaded");
    };

    const togglePlayVoiceNote = () => {
      if (isPlayingAudio) {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.pause();
        }
        if (synthTimerRef.current) {
          clearInterval(synthTimerRef.current);
          synthTimerRef.current = null;
        }
        setIsPlayingAudio(false);
        return;
      }

      const totalDur =
        audioDuration || message.audioDuration || parseDurationFromContent(message.content) || 3;
      if (audioCurrentTime >= totalDur - 0.1) {
        setAudioCurrentTime(0);
        setAudioProgress(0);
        if (audioPlayerRef.current) {
          audioPlayerRef.current.currentTime = 0;
        }
      }

      const rawAudioSrc =
        message.audio ||
        (typeof message.image === "string" && message.image.startsWith("data:audio")
          ? message.image
          : null);
      const audioSrc = sanitizeMediaUrl(rawAudioSrc, { allowAudio: true });

      if (audioSrc) {
        let audio = audioPlayerRef.current;
        if (!audio) {
          audio = new Audio(audioSrc);
          audioPlayerRef.current = audio;
          audio.playbackRate = playbackSpeed;

          audio.onloadedmetadata = () => {
            if (audio.duration && isFinite(audio.duration)) {
              setAudioDuration(audio.duration);
            }
          };
          audio.ontimeupdate = () => {
            if (audio.duration && isFinite(audio.duration)) {
              setAudioCurrentTime(audio.currentTime);
              setAudioProgress(audio.currentTime / audio.duration);
            }
          };
          audio.onended = () => {
            setIsPlayingAudio(false);
            setAudioCurrentTime(0);
            setAudioProgress(0);
          };
          audio.onerror = () => {
            setIsPlayingAudio(false);
          };
        }

        audio.playbackRate = playbackSpeed;
        audio
          .play()
          .then(() => setIsPlayingAudio(true))
          .catch(() => setIsPlayingAudio(false));
      } else {
        const startSec = audioCurrentTime >= totalDur - 0.1 ? 0 : audioCurrentTime;
        const remainingSec = Math.max(0.5, totalDur - startSec);

        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(360, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + remainingSec);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + remainingSec);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + remainingSec);
        } catch (err) {
          void err;
        }

        setIsPlayingAudio(true);
        const startTime = Date.now() - (startSec * 1000) / playbackSpeed;
        const durMs = (totalDur * 1000) / playbackSpeed;

        if (synthTimerRef.current) clearInterval(synthTimerRef.current);
        synthTimerRef.current = setInterval(() => {
          const elapsedMs = Date.now() - startTime;
          const progress = Math.min(1, elapsedMs / durMs);
          const curTime = progress * totalDur;

          setAudioProgress(progress);
          setAudioCurrentTime(curTime);

          if (progress >= 1) {
            clearInterval(synthTimerRef.current);
            synthTimerRef.current = null;
            setIsPlayingAudio(false);
            setAudioProgress(0);
            setAudioCurrentTime(0);
          }
        }, 50);
      }
    };

    const handleSeek = (e) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      setAudioProgress(ratio);

      const totalDur =
        audioDuration || message.audioDuration || parseDurationFromContent(message.content) || 3;
      const targetTime = ratio * totalDur;
      setAudioCurrentTime(targetTime);

      if (audioPlayerRef.current) {
        audioPlayerRef.current.currentTime = targetTime;
      }
    };

    const cyclePlaybackSpeed = (e) => {
      e.stopPropagation();
      const speeds = [1, 1.5, 2];
      const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
      setPlaybackSpeed(nextSpeed);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.playbackRate = nextSpeed;
      }
    };

    const handleSummarizeVoice = async (e) => {
      e.stopPropagation();
      if (isSummarizingVoice || !message.chatId || message.chatId === "ai") return;
      setIsSummarizingVoice(true);
      try {
        await askInlineCopilot(
          message.chatId,
          `transcribe and summarize voice note: ${message.content || "audio"}`
        );
      } finally {
        setIsSummarizingVoice(false);
      }
    };

    const isInlineCopilot = Boolean(
      message.isAICopilot || message.messageType === "ai_copilot"
    );
    const isCurrentUser =
      !isInlineCopilot && message.sender?._id === (user?._id || null);
    const isAI =
      isInlineCopilot ||
      message.sender?.isAI ||
      message.chatId === "ai" ||
      message.sender?._id === "whop-ai";
    const isWhisper =
      Array.isArray(message.whisperTo) && message.whisperTo.length > 0;
    const isRead =
      message.status === "read" ||
      (Array.isArray(message.readBy) &&
        message.readBy.some(
          (id) => String(id?._id || id) !== String(user?._id)
        ));
    const isDelivered = message.status === "delivered";

    const handleCopy = () => {
      if (!message.content) return;
      navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    };

    const handleStartEdit = () => {
      setEditContent(message.content || "");
      setIsEditing(true);
    };

    const handleSaveEdit = async () => {
      if (!editContent.trim()) {
        toast.error("Message cannot be empty");
        return;
      }
      if (editContent.trim() === message.content) {
        setIsEditing(false);
        return;
      }
      await editMessage(message.chatId, message._id, editContent.trim());
      setIsEditing(false);
    };

    const handleCancelEdit = () => {
      setEditContent(message.content || "");
      setIsEditing(false);
    };

    const handleDelete = () => {
      setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
      setIsDeleteModalOpen(false);
      await deleteMessage(message.chatId, message._id);
      toast.success("Message deleted");
    };

    const handleKeyDown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSaveEdit();
      } else if (e.key === "Escape") {
        handleCancelEdit();
      }
    };

    const isCallMessage =
      typeof message.content === "string" &&
      (message.content.startsWith("📹") || message.content.startsWith("📞"));
    const isAudioCall =
      typeof message.content === "string" && message.content.startsWith("📞");
    const isMissedCall =
      isCallMessage &&
      (message.content.includes("Missed") ||
        message.content.includes("Unavailable") ||
        message.content.includes("offline"));

    const isVoiceMessage =
      Boolean(message.audio) ||
      (typeof message.content === "string" && message.content.startsWith("🎙️"));
    const safeAttachmentUrl = sanitizeMediaUrl(message.image, {
      allowAudio: true,
      allowDocs: true,
    });
    const isImageAttachment =
      Boolean(safeAttachmentUrl) &&
      !isVoiceMessage &&
      (safeAttachmentUrl.startsWith("data:image/") ||
        safeAttachmentUrl.includes("res.cloudinary.com") ||
        safeAttachmentUrl.match(/\.(jpeg|jpg|gif|png|webp|avif)($|\?)/i));
    const isDocumentAttachment =
      Boolean(safeAttachmentUrl) &&
      !isVoiceMessage &&
      !isImageAttachment;

    if (isCallMessage) {
      return (
        <div className="flex justify-center my-3 px-4 animate-message-in">
          <div
            className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-full border text-xs shadow-xs",
              isMissedCall
                ? "bg-red-500/10 border-red-500/25 text-red-400"
                : "bg-[var(--color-base-panel)] border-[var(--color-base-border)] text-indigo-400"
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                isMissedCall
                  ? "bg-red-500/20 text-red-400"
                  : "bg-indigo-500/15 text-indigo-400"
              )}
            >
              {isMissedCall ? (
                <PhoneOff className="w-3.5 h-3.5" />
              ) : isAudioCall ? (
                <Phone className="w-3.5 h-3.5" />
              ) : (
                <Video className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-[var(--color-base-text)]">
                {message.content.replace(/^(?:📹|📞)\s*/, "")}
              </span>
              <span
                className="text-[10px] font-mono-tech text-[var(--color-base-muted)]"
                title={formatFullDateTime(message.createdAt)}
              >
                • {formatMessageTime(message.createdAt)}
              </span>
            </div>
          </div>
        </div>
      );
    }

    const isActivityMessage =
      typeof message.content === "string" &&
      ["👤", "🚫", "🚪", "🛡️", "✏️", "🎉", "ℹ️", "✅"].some((prefix) =>
        message.content.startsWith(prefix)
      );

    if (isActivityMessage) {
      const text = message.content;
      const isRemove = text.startsWith("🚫") || text.startsWith("🚪");
      const isAdmin = text.startsWith("🛡️");
      const isAdd = text.startsWith("👤") || text.startsWith("🎉") || text.startsWith("✅");

      return (
        <div className="flex justify-center my-3 px-4 animate-message-in">
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs max-w-lg text-center",
              isRemove
                ? "bg-red-500/10 border-red-500/25 text-red-400"
                : isAdmin
                ? "bg-amber-500/10 border-amber-500/25 text-amber-400"
                : isAdd
                ? "bg-indigo-500/10 border-indigo-500/25 text-indigo-400"
                : "bg-[var(--color-base-panel)] border-[var(--color-base-border)] text-[var(--color-base-muted)]"
            )}
          >
            <span className="font-medium text-xs leading-tight text-[var(--color-base-text)]">
              {message.content}
            </span>
            <span
              className="text-[10px] font-mono-tech text-[var(--color-base-muted)] opacity-80 shrink-0"
              title={formatFullDateTime(message.createdAt)}
            >
              • {formatMessageTime(message.createdAt)}
            </span>
          </div>
        </div>
      );
    }

    const totalPollVotes =
      message.poll?.options?.reduce((sum, o) => sum + (o.votes?.length || 0), 0) || 0;

    return (
      <div
        id={`message-${message._id}`}
        className={cn(
          "group relative flex px-4 py-1.5 transition-all duration-300 rounded-2xl animate-message-in",
          isCurrentUser && "justify-end",
          isBurning && "animate-ink-burn"
        )}
      >
        {!isEditing && (
          <div
            className={cn(
              "absolute -top-3 z-10 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[var(--color-base-surface)] border border-[var(--color-base-border)] shadow-md text-[var(--color-base-muted)] opacity-0 group-hover:opacity-100 transition-all duration-150",
              isCurrentUser ? "right-6" : "left-6"
            )}
          >
            {!isAI && (
              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => setShowReactionPicker((prev) => !prev)}
                  className={cn(
                    "p-1 rounded-full hover:text-indigo-400 hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer",
                    showReactionPicker && "text-indigo-400 bg-[var(--color-base-hover)]"
                  )}
                  title="React to message"
                >
                  <Smile className="w-3.5 h-3.5" />
                </button>

                {showReactionPicker && (
                  <div
                    className={cn(
                      "absolute bottom-full mb-1 flex items-center gap-1 p-1 rounded-full bg-[var(--color-base-surface)] border border-[var(--color-base-border)] shadow-xl z-30 select-none",
                      isCurrentUser ? "right-0" : "left-0"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {["❤️", "👍", "😂", "😮", "😢", "🔥"].map((emoji) => {
                      const reactionGroup = message.reactions?.find((r) => r.emoji === emoji);
                      const userReacted = reactionGroup?.users?.some(
                        (u) => (u?._id ? u._id.toString() : u.toString()) === currentUserId?.toString()
                      );
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            handleToggleReaction(emoji);
                            setShowReactionPicker(false);
                          }}
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-sm transition-transform hover:scale-125 active:scale-90 cursor-pointer",
                            userReacted ? "bg-indigo-500/20 ring-1 ring-indigo-400" : "hover:bg-[var(--color-base-hover)]"
                          )}
                          title={`React with ${emoji}`}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {onReply && !isAI && (
              <button
                type="button"
                onClick={() => onReply(message)}
                className="p-1 rounded-full hover:text-indigo-400 hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer"
                title="Reply to message"
              >
                <CornerUpLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {onForward && !isAI && (
              <button
                type="button"
                onClick={() => onForward(message)}
                className="p-1 rounded-full hover:text-indigo-400 hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer"
                title="Forward message"
              >
                <Forward className="w-3.5 h-3.5" />
              </button>
            )}

            {!isAI && (
              <button
                type="button"
                onClick={() => {
                  if (message.isPinned) {
                    unpinMessage(message.chatId);
                  } else {
                    pinMessage(message.chatId, message._id);
                  }
                }}
                className={cn(
                  "p-1 rounded-full hover:text-amber-400 hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer",
                  message.isPinned && "text-amber-400"
                )}
                title={message.isPinned ? "Unpin message" : "Pin message"}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
            )}

            {message.content && !isVoiceMessage && (
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded-full hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer"
                title={isCopied ? "Copied" : "Copy text"}
              >
                {isCopied ? (
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            {isCurrentUser && !isVoiceMessage && message.messageType !== "poll" && (
              <>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="p-1 rounded-full hover:text-indigo-400 hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer"
                  title="Edit message"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-1 rounded-full hover:text-red-400 hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer"
                  title="Delete message"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}

        <div
          className={cn(
            "max-w-[78%] md:max-w-[66%] px-4 py-3 leading-relaxed relative flex flex-col border transition-all duration-200",
            isInlineCopilot
              ? "bg-[var(--color-base-surface)] text-[var(--color-base-text)] rounded-2xl rounded-tl-xs border-indigo-500/40 shadow-lg shadow-indigo-500/10"
              : isWhisper
              ? "bg-violet-500/15 text-[var(--color-base-text)] rounded-2xl border-violet-500/40 shadow-md"
              : isCurrentUser
              ? "aurora-bg text-white rounded-2xl rounded-tr-xs border-transparent shadow-md shadow-indigo-500/20"
              : isAI
              ? "bg-[var(--color-base-surface)] text-[var(--color-base-text)] rounded-2xl rounded-tl-xs border-indigo-500/30 shadow-xs"
              : "bg-[var(--color-base-surface)] text-[var(--color-base-text)] rounded-2xl rounded-tl-xs border-[var(--color-base-border)]"
          )}
        >
          {isInlineCopilot && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono-tech uppercase tracking-wider font-semibold text-cyan-400 mb-1.5 select-none">
              <Sparkles className="w-3 h-3" />
              <span>@whopai Co-Pilot</span>
            </div>
          )}

          {isWhisper && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono-tech uppercase tracking-wider font-semibold text-violet-400 mb-1.5 select-none">
              <EyeOff className="w-3 h-3" />
              <span>
                Private Whisper{" "}
                {message.whisperTo
                  ?.map((u) => u?.name || "member")
                  .slice(0, 2)
                  .join(", ")}
              </span>
            </div>
          )}

          {remainingTtl !== null && (
            <div className="flex items-center gap-1 text-[10px] font-mono-tech uppercase tracking-wider text-amber-400 mb-1 select-none">
              <Flame className="w-3 h-3 animate-pulse" />
              <span>Ink &amp; Burn • {formatRemainingTtl(remainingTtl)}</span>
            </div>
          )}

          {message.isPinned && (
            <div className="flex items-center gap-1 text-[10px] font-mono-tech uppercase tracking-wider font-medium text-amber-400 mb-1 select-none">
              <Pin className="w-3 h-3 rotate-45" />
              <span>Pinned</span>
            </div>
          )}

          {message.isForwarded && (
            <div className="flex items-center gap-1 text-[10px] italic opacity-75 mb-1 select-none">
              <Forward className="w-3 h-3 inline shrink-0" />
              <span>Forwarded</span>
            </div>
          )}

          {!isCurrentUser && !isInlineCopilot && isGroup && message.sender?.name && (
            <span className="text-[11px] font-display font-bold text-cyan-400 mb-1">
              {message.sender?.name}
            </span>
          )}

          {message.replyTo && (
            <button
              type="button"
              onClick={() => {
                const targetId = message.replyTo?._id;
                if (targetId) {
                  const el = document.getElementById(`message-${targetId}`);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    el.classList.add("ring-2", "ring-cyan-400", "bg-indigo-500/10");
                    setTimeout(() => {
                      el.classList.remove("ring-2", "ring-cyan-400", "bg-indigo-500/10");
                    }, 1800);
                  } else {
                    toast.info("Original message is further up in history");
                  }
                }
              }}
              title="Click to jump to quoted message"
              className="mb-2 p-2 rounded-xl bg-black/20 hover:bg-black/30 border-l-2 border-cyan-400 text-xs opacity-90 max-w-full text-left cursor-pointer transition-colors block w-full truncate"
            >
              <span className="font-semibold text-[11px] block text-cyan-300">
                {message.replyTo.sender?.name || (message.replyTo.sender?._id === user?._id ? "You" : "Reply")}
              </span>
              <span className="truncate block opacity-80 text-[11.5px]">
                {message.replyTo.content || (message.replyTo.image ? "📷 Photo" : "Message")}
              </span>
            </button>
          )}

          {isImageAttachment && (
            <div className="mb-2 rounded-xl overflow-hidden max-w-sm border border-white/10 group/img relative">
              <img
                src={safeAttachmentUrl}
                alt="Attachment"
                className="w-full max-h-72 object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => setIsLightboxOpen(true)}
              />
              <div
                onClick={() => setIsLightboxOpen(true)}
                className="absolute inset-0 bg-black/25 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-xl text-white text-xs font-semibold backdrop-blur-xs"
              >
                Click to view full image
              </div>
            </div>
          )}

          {isDocumentAttachment && (
            <div className="mb-2 p-3 rounded-xl bg-black/20 border border-white/10 flex items-center justify-between gap-3 min-w-[220px] max-w-sm select-none">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-cyan-300 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold truncate block">
                    {message.content ? message.content.replace(/^📄\s*/, "") : "Document Attachment"}
                  </span>
                  <span className="text-[10px] opacity-70 block">Click to download</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!safeAttachmentUrl) return;
                  const a = document.createElement("a");
                  a.href = safeAttachmentUrl;
                  const cleanName = (message.content || "document")
                    .replace(/^📄\s*/, "")
                    .replace(/[/\\?%*:|"<>]/g, "_")
                    .trim();
                  a.download = cleanName || `document-${message._id}`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  toast.success("Downloading document");
                }}
                className="p-2 rounded-full bg-black/20 hover:bg-black/30 transition-colors cursor-pointer shrink-0"
                title="Download file"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}

          {message.messageType === "poll" && message.poll ? (
            <div className="min-w-[250px] sm:min-w-[300px] space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono-tech uppercase tracking-wider opacity-80">
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-3.5 h-3.5" /> Live Poll
                </span>
                <span>{totalPollVotes} {totalPollVotes === 1 ? "vote" : "votes"}</span>
              </div>
              <p className="font-display font-bold text-sm leading-snug">
                {message.poll.question}
              </p>
              <div className="space-y-1.5">
                {message.poll.options?.map((opt) => {
                  const voteCount = opt.votes?.length || 0;
                  const pct = totalPollVotes > 0 ? Math.round((voteCount / totalPollVotes) * 100) : 0;
                  const hasVoted = opt.votes?.some(
                    (v) => String(v?._id || v) === String(currentUserId)
                  );
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => votePoll(message.chatId, message._id, opt.id)}
                      className={cn(
                        "w-full relative overflow-hidden rounded-xl border p-2.5 text-left transition-all cursor-pointer",
                        hasVoted
                          ? "border-cyan-300 bg-black/20"
                          : "border-white/20 bg-black/10 hover:bg-black/20"
                      )}
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-white/20 transition-all duration-700 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium flex items-center gap-1.5">
                          {hasVoted && <Check className="w-3.5 h-3.5 shrink-0" />}
                          <span>{opt.text}</span>
                        </span>
                        <span className="font-mono-tech text-[11px] shrink-0">{pct}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : message.messageType === "code" && message.codeBlock ? (
            <div className="min-w-[260px] sm:min-w-[340px] rounded-xl overflow-hidden border border-white/15 bg-[#05070e] text-[#e2e8f0]">
              <div className="px-3.5 py-2 border-b border-white/10 bg-white/5 flex items-center justify-between text-[10px] font-mono-tech">
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="uppercase tracking-wider text-cyan-300">
                    {message.codeBlock.language || "code"}
                  </span>
                  {message.codeBlock.title && (
                    <span className="text-slate-400">• {message.codeBlock.title}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(message.codeBlock.code || "");
                    setIsCopiedCode(true);
                    toast.success("Code snippet copied");
                    setTimeout(() => setIsCopiedCode(false), 1800);
                  }}
                  className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer flex items-center gap-1"
                >
                  {isCopiedCode ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopiedCode ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <pre className="p-3.5 text-xs font-mono-tech overflow-x-auto leading-relaxed">
                <code>{message.codeBlock.code}</code>
              </pre>
            </div>
          ) : message.messageType === "digest" && message.digest ? (
            <div className="min-w-[260px] sm:min-w-[340px] space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono-tech uppercase tracking-wider opacity-85">
                <span className="flex items-center gap-1">
                  <Newspaper className="w-3.5 h-3.5" /> Editorial Edition
                </span>
                <span>{message.digest.messageCount} msgs</span>
              </div>
              <p className="font-cursive text-3xl leading-[0.85] text-cyan-200">
                Thread Digest
              </p>
              <h4 className="font-display font-bold text-base leading-snug">
                {message.digest.title}
              </h4>
              <p className="font-editorial italic text-sm opacity-90">
                {message.digest.subtitle}
              </p>
              <ul className="space-y-1.5 pt-2 border-t border-white/15 text-xs">
                {message.digest.highlights?.map((h, idx) => (
                  <li key={idx} className="leading-relaxed opacity-90">
                    • {h}
                  </li>
                ))}
              </ul>
            </div>
          ) : isEditing ? (
            <div className="w-full my-1 space-y-2 min-w-[200px]">
              <textarea
                autoFocus
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                className="w-full p-2.5 text-sm bg-black/25 rounded-xl border border-white/25 focus:outline-none focus:border-cyan-400 resize-none"
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1 rounded-full text-xs font-medium opacity-75 hover:opacity-100 hover:bg-black/15 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3.5 py-1 rounded-full bg-white text-indigo-950 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          ) : isVoiceMessage ? (
            <div className="flex flex-col gap-2 py-1 min-w-[220px]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlayVoiceNote}
                  className="w-9 h-9 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95 cursor-pointer"
                >
                  {isPlayingAudio ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5 fill-current" />
                  )}
                </button>

                <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                  <div
                    onClick={handleSeek}
                    className="flex items-center gap-[3px] h-6 cursor-pointer py-1 px-0.5 rounded select-none group/waveform"
                    title="Click or drag to seek"
                  >
                    {WAVE_BARS.map((heightPercent, i) => {
                      const barProgress = i / (WAVE_BARS.length - 1);
                      const isPast = audioProgress >= barProgress;
                      return (
                        <span
                          key={i}
                          style={{ height: `${heightPercent}%` }}
                          className={cn(
                            "w-[3px] rounded-full transition-all duration-100",
                            isPast
                              ? "bg-cyan-300"
                              : "bg-current opacity-30 group-hover/waveform:opacity-55",
                            isPlayingAudio && Math.abs(audioProgress - barProgress) < 0.08 && "scale-y-125"
                          )}
                        />
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[10px] opacity-80 font-mono-tech select-none">
                    <span>
                      {isPlayingAudio || audioCurrentTime > 0
                        ? `${formatAudioTime(audioCurrentTime)} / ${formatAudioTime(
                            audioDuration || message.audioDuration || parseDurationFromContent(message.content) || 3
                          )}`
                        : formatAudioTime(
                            audioDuration || message.audioDuration || parseDurationFromContent(message.content) || 3
                          )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {message.chatId !== "ai" && (
                        <button
                          type="button"
                          onClick={handleSummarizeVoice}
                          disabled={isSummarizingVoice}
                          className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-black/20 hover:bg-black/30 cursor-pointer flex items-center gap-1"
                          title="Summarize voice note with @whopai"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{isSummarizingVoice ? "..." : "AI"}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={cyclePlaybackSpeed}
                        className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-black/20 hover:bg-black/30 cursor-pointer transition-colors leading-none"
                        title="Change playback speed (1x, 1.5x, 2x)"
                      >
                        {playbackSpeed}x
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            message.content && (
              <div className="break-words text-[13.5px]">
                <FormattedText content={message.content} searchQuery={searchQuery} />
              </div>
            )
          )}

          <div
            className={cn(
              "flex justify-end items-center gap-1.5 mt-1.5 select-none opacity-80",
              isCurrentUser ? "" : "text-[var(--color-base-muted)]"
            )}
          >
            {message.isEdited && (
              <span className="text-[10px] italic">(edited)</span>
            )}
            <span
              className="text-[10px] font-mono-tech tracking-tight"
              title={formatFullDateTime(message?.createdAt)}
            >
              {formatMessageTime(message?.createdAt)}
            </span>
            {isCurrentUser && !isAI && (
              <span
                className="inline-flex items-center ml-0.5"
                title={isRead ? "Read by recipient" : isDelivered ? "Delivered" : "Sent"}
              >
                {isRead ? (
                  <CheckCheck className="w-3.5 h-3.5 text-cyan-300" />
                ) : isDelivered ? (
                  <CheckCheck className="w-3.5 h-3.5 opacity-75" />
                ) : (
                  <Check className="w-3.5 h-3.5 opacity-75" />
                )}
              </span>
            )}
          </div>

          {message.reactions && message.reactions.some((r) => r.users && r.users.length > 0) && (
            <div className="flex flex-wrap items-center gap-1 mt-1.5 pt-1 border-t border-current/10">
              {message.reactions
                .filter((r) => r.users && r.users.length > 0)
                .map((r) => {
                  const hasReacted = r.users.some(
                    (u) => (u?._id ? u._id.toString() : u.toString()) === currentUserId?.toString()
                  );
                  return (
                    <button
                      key={r.emoji}
                      type="button"
                      onClick={() => handleToggleReaction(r.emoji)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-transform active:scale-90 cursor-pointer border select-none",
                        hasReacted
                          ? "bg-white/25 border-white/40 font-medium"
                          : "bg-black/15 border-current/15 hover:bg-black/25"
                      )}
                      title={
                        hasReacted
                          ? `You reacted with ${r.emoji} (click to remove)`
                          : `Click to react with ${r.emoji}`
                      }
                    >
                      <span>{r.emoji}</span>
                      <span className="text-[10px] font-mono-tech">{r.users.length}</span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {isLightboxOpen && message.image && (
          <div
            className="fixed inset-0 z-[999999] bg-black/92 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in select-none"
            onClick={() => setIsLightboxOpen(false)}
          >
            <div
              className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-neutral-200">
                  {message.sender?.name || (isCurrentUser ? "You" : "Photo")}
                </span>
                <span className="text-xs font-mono-tech text-neutral-400">
                  • {formatMessageTime(message.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="px-3.5 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
                  title="Download image"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-colors cursor-pointer shadow-lg"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              className="max-w-[90vw] max-h-[85vh] flex items-center justify-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={safeAttachmentUrl}
                alt="Full Preview"
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            </div>
          </div>
        )}

        {isDeleteModalOpen && (
          <div
            className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            <div
              className="w-full max-w-sm bg-[var(--color-base-surface)] border border-[var(--color-base-border)] rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 text-red-500 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display text-base font-bold text-[var(--color-base-text)] leading-snug">
                    Delete message?
                  </h4>
                  <p className="text-xs text-[var(--color-base-muted)] mt-0.5">
                    This message will be permanently deleted for everyone in this chat.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--color-base-panel)] border border-[var(--color-base-border)] text-xs text-[var(--color-base-muted)] line-clamp-2 italic">
                &ldquo;{message.content || (message.image ? "Photo attachment" : "Message")}&rdquo;
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ChatMessageBody.displayName = "ChatMessageBody";
export default ChatMessageBody;
