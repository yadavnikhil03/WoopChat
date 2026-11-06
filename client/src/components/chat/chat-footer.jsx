import { useState, useRef, useEffect } from "react";
import {
  Paperclip,
  Send,
  Smile,
  Mic,
  X,
  StopCircle,
  Sparkles,
  Trash2,
  CornerUpLeft,
  ShieldAlert,
  FileText,
} from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { useSocket } from "@/hooks/use-socket";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import EmojiPicker from "./emoji-picker";

const AI_SUGGESTIONS = [
  "What is WhopChat?",
  "How does Socket.io work?",
  "Explain JWT auth & security",
  "How do group chats work?",
];

const ChatFooter = ({ chat, chatId, replyTo, currentUserId, onCancelReply }) => {
  const { sendMessage, isSendingMsg, sendAIMessage, isAIStreaming, cancelAIStreaming } = useChat();
  const { socket } = useSocket();
  const [message, setMessage] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };
  const typingTimeoutRef = useRef(null);
  const pickerRef = useRef(null);
  const inputRef = useRef(null);

  const otherParticipant =
    !chat?.isGroup && chatId !== "ai"
      ? chat?.participants?.find(
          (p) => (p._id ? p._id.toString() : p.toString()) !== currentUserId
        )
      : null;
  const otherId = otherParticipant?._id || otherParticipant;

  useEffect(() => {
    if (otherId) {
      API.get("/users/blocked")
        .then((res) => {
          const list = res.data.data?.users || [];
          setIsBlocked(list.some((u) => String(u._id || u) === String(otherId)));
        })
        .catch(() => {});
    } else {
      setIsBlocked(false);
    }
  }, [otherId]);

  const handleUnblock = async () => {
    if (!otherId) return;
    try {
      await API.post(`/users/unblock/${otherId}`);
      setIsBlocked(false);
      toast.success("Contact unblocked");
      sendMessage({
        chatId,
        content: "✅ You unblocked this contact",
      });
    } catch {
      toast.error("Failed to unblock contact");
    }
  };

  useEffect(() => {
    if (replyTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyTo]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioChunksRef = useRef([]);

  const isAIChat = chatId === "ai";

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    if (socket && chatId && !isAIChat) {
      socket.emit("typing:start", { chatId });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing:stop", { chatId });
      }, 1500);
    }
  };

  const startVoiceRecording = async () => {
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingSeconds(0);
        recordingTimerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      } else {
        toast.error("Audio recording not supported on this browser");
      }
    } catch {
      toast.error("Microphone access was denied or is unavailable");
    }
  };

  const stopVoiceRecording = (shouldSend = true) => {
    clearInterval(recordingTimerRef.current);
    const duration = recordingSeconds;
    setIsRecording(false);
    setRecordingSeconds(0);

    if (!mediaRecorderRef.current) return;

    const recorder = mediaRecorderRef.current;
    recorder.onstop = () => {
      recorder.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;

      if (shouldSend && duration > 0) {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const reader = new FileReader();
        reader.onload = () => {
          const audioDataUrl = reader.result;
          const formatted = `${Math.floor(duration / 60)}:${String(
            duration % 60
          ).padStart(2, "0")}`;
          const voiceContent = `🎙️ Voice message (${formatted})`;
          if (isAIChat) {
            sendAIMessage(voiceContent);
          } else {
            sendMessage({
              chatId,
              content: voiceContent,
              audio: audioDataUrl,
              audioDuration: duration,
              image: audioDataUrl,
            });
          }
        };
        reader.readAsDataURL(audioBlob);
      }
    };

    if (recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (isSendingMsg || isAIStreaming || (!message.trim() && !selectedAttachment)) return;

    if (socket && chatId && !isAIChat) {
      socket.emit("typing:stop", { chatId });
    }

    if (isAIChat) {
      sendAIMessage(message.trim());
    } else {
      const contentToSend =
        message.trim() ||
        (selectedAttachment?.type === "document"
          ? `📄 ${selectedAttachment.name}`
          : "");

      sendMessage({
        chatId,
        content: contentToSend,
        image: selectedAttachment?.dataUrl || undefined,
        replyTo: replyTo?._id || undefined,
      });
      if (onCancelReply) onCancelReply();
    }

    setSelectedAttachment(null);
    setMessage("");
    setShowEmojis(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size exceeds 20MB limit");
      return;
    }

    const isImg = file.type.startsWith("image/");
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedAttachment({
        name: file.name,
        size: formatFileSize(file.size),
        type: isImg ? "image" : "document",
        preview: isImg ? ev.target?.result : null,
        dataUrl: ev.target?.result,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const insertEmoji = (emoji) => {
    setMessage((prev) => prev + emoji);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Escape") {
      if (replyTo && onCancelReply) {
        e.preventDefault();
        onCancelReply();
        return;
      }
      if (selectedAttachment) {
        e.preventDefault();
        setSelectedAttachment(null);
        return;
      }
      if (showEmojis) {
        e.preventDefault();
        setShowEmojis(false);
        return;
      }
    }

    const isMod = e.ctrlKey || e.metaKey;
    if (
      isMod &&
      (e.key === "b" ||
        e.key === "B" ||
        e.key === "i" ||
        e.key === "I" ||
        e.key === "e" ||
        e.key === "E")
    ) {
      e.preventDefault();
      const wrapChar =
        e.key === "b" || e.key === "B"
          ? "**"
          : e.key === "i" || e.key === "I"
          ? "*"
          : "`";
      const input = inputRef.current;
      if (!input) return;

      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      const val = input.value;

      const selectedText = val.substring(start, end);
      const replacement = `${wrapChar}${selectedText || "text"}${wrapChar}`;
      const nextVal = val.substring(0, start) + replacement + val.substring(end);

      setMessage(nextVal);

      setTimeout(() => {
        input.focus();
        if (selectedText) {
          input.setSelectionRange(
            start + wrapChar.length,
            end + wrapChar.length
          );
        } else {
          input.setSelectionRange(
            start + wrapChar.length,
            start + wrapChar.length + 4
          );
        }
      }, 0);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowEmojis(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      clearInterval(recordingTimerRef.current);
    };
  }, []);

  return (
    <div className="w-full flex flex-col bg-[var(--color-base-bg)] border-t border-[var(--color-base-border)] z-20">
      {replyTo && (
        <div className="w-full px-4 pt-2.5 pb-2 flex items-center justify-between bg-[var(--color-base-panel)] border-b border-[var(--color-base-border)] animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2.5 min-w-0 border-l-3 border-emerald-500 pl-3">
            <CornerUpLeft className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-emerald-400 block truncate">
                Replying to {replyTo.sender?.name || (replyTo.sender?._id === currentUserId ? "yourself" : "message")}
              </span>
              <span className="text-xs text-[var(--color-base-muted)] block truncate">
                {replyTo.content || (replyTo.image ? "📷 Photo" : "Attachment")}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded-md text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer"
            title="Cancel reply"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isAIChat && !isAIStreaming && !isRecording && (
        <div className="flex items-center gap-2 px-4 pt-2 pb-1 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-semibold text-[var(--color-base-muted)] shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-500" /> Suggestions:
          </span>
          {AI_SUGGESTIONS.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendAIMessage(sug)}
              className="text-[11px] px-2.5 py-0.5 rounded-full bg-[var(--color-base-panel)] hover:bg-[var(--color-base-hover)] border border-[var(--color-base-border)] text-[var(--color-base-text)] transition-colors shrink-0 cursor-pointer shadow-sm active:scale-95"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {isBlocked ? (
        <div className="w-full py-4 px-6 flex items-center justify-center gap-2 bg-[var(--color-base-panel)] text-sm text-[var(--color-base-muted)] select-none">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
          <span>You blocked this contact.</span>
          <button
            type="button"
            onClick={handleUnblock}
            className="text-emerald-400 hover:text-emerald-300 hover:underline font-semibold ml-1 cursor-pointer"
          >
            Unblock
          </button>
        </div>
      ) : (
        <div className="relative w-full px-4 py-2.5 flex items-end gap-2">
        {showEmojis && (
          <div ref={pickerRef} className="absolute bottom-[60px] left-4 z-40">
            <EmojiPicker
              onSelect={(emoji) => insertEmoji(emoji)}
              onClose={() => setShowEmojis(false)}
            />
          </div>
        )}

        {!isRecording && (
          <>
            <button
              type="button"
              onClick={() => setShowEmojis(!showEmojis)}
              className={`p-2 rounded-md transition-colors shrink-0 cursor-pointer ${
                showEmojis
                  ? "text-[var(--color-base-text)] bg-[var(--color-base-hover)]"
                  : "text-[var(--color-base-muted)] hover:bg-[var(--color-base-hover)] hover:text-[var(--color-base-text)]"
              }`}
            >
              <Smile className="w-5 h-5" />
            </button>

            <label
              className="p-2 text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] rounded-md transition-colors shrink-0 cursor-pointer"
              title="Attach photo or document"
            >
              <Paperclip className="w-5 h-5" />
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt,.csv,.zip,.rar,.json"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </>
        )}

        {isRecording ? (
          <div className="flex-1 flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-md px-3 h-10 animate-pulse">
            <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span>
                Recording Voice Note • {Math.floor(recordingSeconds / 60)}:
                {String(recordingSeconds % 60).padStart(2, "0")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => stopVoiceRecording(false)}
                className="text-xs text-[var(--color-base-muted)] hover:text-white px-2 py-1 rounded cursor-pointer"
                title="Cancel"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
              <button
                type="button"
                onClick={() => stopVoiceRecording(true)}
                className="p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-sm"
                title="Send Voice Note"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex-1 flex flex-col gap-2 relative">
            {selectedAttachment && (
              selectedAttachment.type === "image" ? (
                <div className="absolute bottom-full mb-2 left-0 w-24 h-24 bg-[var(--color-base-panel)] rounded-xl shadow-xl border border-[var(--color-base-border)] overflow-hidden animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => setSelectedAttachment(null)}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 cursor-pointer transition-colors z-10"
                    title="Remove attachment"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <img src={selectedAttachment.preview} className="w-full h-full object-cover" alt="Preview" />
                </div>
              ) : (
                <div className="absolute bottom-full mb-2 left-0 min-w-[200px] max-w-xs p-2.5 bg-[var(--color-base-panel)] rounded-xl shadow-xl border border-[var(--color-base-border)] flex items-center gap-2.5 animate-in fade-in zoom-in-95">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <span className="text-xs font-semibold text-[var(--color-base-text)] truncate block">
                      {selectedAttachment.name}
                    </span>
                    <span className="text-[10.5px] text-[var(--color-base-muted)] block">
                      {selectedAttachment.size}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAttachment(null)}
                    className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 text-[var(--color-base-muted)] hover:text-white rounded-full p-1 cursor-pointer transition-colors"
                    title="Remove attachment"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )
            )}
            <div className="w-full bg-[var(--color-base-panel)] border border-[var(--color-base-border)] rounded-md flex items-center min-h-[40px] px-3">
              <input
                ref={inputRef}
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder={isAIChat ? "Ask WhopAI anything..." : "Type a message..."}
                className="flex-1 bg-transparent border-0 focus:ring-0 text-[14px] text-[var(--color-base-text)] placeholder:text-[var(--color-base-muted)] outline-none w-full"
                autoComplete="off"
              />
            </div>
          </form>
        )}

        {!isRecording &&
          (isAIStreaming ? (
            <button
              type="button"
              onClick={cancelAIStreaming}
              className="p-2 text-red-500 hover:bg-red-500/10 rounded-md shrink-0 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
              title="Stop response"
            >
              <StopCircle className="w-5 h-5" />
              <span>Stop</span>
            </button>
          ) : message.trim() || selectedAttachment ? (
            <button
              onClick={onSubmit}
              disabled={isSendingMsg}
              className="p-2 text-[var(--color-base-primary)] hover:bg-[var(--color-base-hover)] rounded-md shrink-0 transition-colors cursor-pointer"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startVoiceRecording}
              className="p-2 text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] rounded-md shrink-0 transition-colors cursor-pointer"
              title="Record Voice Note"
            >
              <Mic className="w-5 h-5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
export default ChatFooter;
