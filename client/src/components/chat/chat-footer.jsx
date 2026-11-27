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
  Flame,
  BarChart3,
  Code2,
  EyeOff,
  Clock,
  Radio,
  Plus,
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

const EPHEMERAL_OPTIONS = [
  { label: "Off", value: null },
  { label: "30s", value: 30 },
  { label: "5m", value: 300 },
  { label: "1h", value: 3600 },
];

const SCHEDULE_PRESETS = [
  { label: "Now", minutes: 0 },
  { label: "+1 min", minutes: 1 },
  { label: "+15 min", minutes: 15 },
  { label: "+1 hr", minutes: 60 },
];

const ChatFooter = ({ chat, chatId, replyTo, currentUserId, onCancelReply }) => {
  const {
    sendMessage,
    isSendingMsg,
    sendAIMessage,
    isAIStreaming,
    cancelAIStreaming,
    askInlineCopilot,
    scheduledMessages,
    cancelScheduledMessage,
  } = useChat();
  const { socket } = useSocket();
  const [message, setMessage] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const [activeStudioTool, setActiveStudioTool] = useState(null);
  const [ephemeralSeconds, setEphemeralSeconds] = useState(null);
  const [whisperUserIds, setWhisperUserIds] = useState([]);
  const [scheduledMinutes, setScheduledMinutes] = useState(0);
  const [customScheduleTime, setCustomScheduleTime] = useState("");

  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [codeLanguage, setCodeLanguage] = useState("typescript");
  const [codeTitle, setCodeTitle] = useState("");
  const [codeContent, setCodeContent] = useState("");

  const [isWalkieActive, setIsWalkieActive] = useState(false);
  const walkieRecorderRef = useRef(null);
  const walkieChunksRef = useRef([]);
  const walkieStartedAtRef = useRef(0);

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

  const isAIChat = chatId === "ai";
  const otherParticipants = (chat?.participants || []).filter(
    (p) => String(p?._id || p) !== String(currentUserId)
  );

  const otherParticipant =
    !chat?.isGroup && !isAIChat ? otherParticipants[0] || null : null;
  const otherId = otherParticipant?._id || otherParticipant;

  useEffect(() => {
    setActiveStudioTool(null);
    setEphemeralSeconds(null);
    setWhisperUserIds([]);
    setScheduledMinutes(0);
    setCustomScheduleTime("");
  }, [chatId]);

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
              ephemeralSeconds: ephemeralSeconds || undefined,
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

  const startWalkieTalkie = async () => {
    if (isAIChat || !socket?.connected || isWalkieActive) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      walkieRecorderRef.current = recorder;
      walkieChunksRef.current = [];
      walkieStartedAtRef.current = Date.now();
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) walkieChunksRef.current.push(e.data);
      };
      recorder.start();
      setIsWalkieActive(true);
    } catch {
      toast.error("Microphone needed for Walkie-Talkie burst");
    }
  };

  const stopWalkieTalkie = () => {
    if (!walkieRecorderRef.current) {
      setIsWalkieActive(false);
      return;
    }
    const recorder = walkieRecorderRef.current;
    const elapsedSec = Math.max(1, Math.round((Date.now() - walkieStartedAtRef.current) / 1000));
    setIsWalkieActive(false);

    recorder.onstop = () => {
      recorder.stream.getTracks().forEach((t) => t.stop());
      walkieRecorderRef.current = null;
      const blob = new Blob(walkieChunksRef.current, { type: "audio/webm" });
      if (blob.size < 200) return;
      const reader = new FileReader();
      reader.onload = () => {
        socket?.emit("studio:walkie-audio", {
          chatId,
          audioDataUrl: reader.result,
          duration: elapsedSec,
        });
        toast.success(`Walkie burst transmitted (${elapsedSec}s)`);
      };
      reader.readAsDataURL(blob);
    };

    if (recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const getScheduledIso = () => {
    if (customScheduleTime) {
      const d = new Date(customScheduleTime);
      if (!isNaN(d.getTime()) && d.getTime() > Date.now() + 2000) {
        return d.toISOString();
      }
    }
    if (scheduledMinutes > 0) {
      return new Date(Date.now() + scheduledMinutes * 60 * 1000).toISOString();
    }
    return null;
  };

  const handleSendPoll = () => {
    const validOpts = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!pollQuestion.trim() || validOpts.length < 2) {
      toast.error("Add a question and at least 2 options");
      return;
    }
    sendMessage({
      chatId,
      content: `📊 ${pollQuestion.trim()}`,
      messageType: "poll",
      poll: {
        question: pollQuestion.trim(),
        options: validOpts.map((text, idx) => ({ id: `opt-${idx + 1}`, text })),
        allowMultiple: false,
      },
      ephemeralSeconds: ephemeralSeconds || undefined,
      scheduledFor: getScheduledIso(),
    });
    setPollQuestion("");
    setPollOptions(["", ""]);
    setActiveStudioTool(null);
    setScheduledMinutes(0);
    setCustomScheduleTime("");
  };

  const handleSendCode = () => {
    if (!codeContent.trim()) {
      toast.error("Paste or write a code snippet first");
      return;
    }
    sendMessage({
      chatId,
      content: codeTitle.trim() ? `💻 ${codeTitle.trim()}` : `💻 ${codeLanguage} snippet`,
      messageType: "code",
      codeBlock: {
        language: codeLanguage,
        title: codeTitle.trim(),
        code: codeContent,
      },
      ephemeralSeconds: ephemeralSeconds || undefined,
      scheduledFor: getScheduledIso(),
    });
    setCodeTitle("");
    setCodeContent("");
    setActiveStudioTool(null);
    setScheduledMinutes(0);
    setCustomScheduleTime("");
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
      const trimmed = message.trim();
      if (trimmed.startsWith("/poll ")) {
        const parts = trimmed.slice(6).split("|").map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 3) {
          sendMessage({
            chatId,
            content: `📊 ${parts[0]}`,
            messageType: "poll",
            poll: {
              question: parts[0],
              options: parts.slice(1, 7).map((text, idx) => ({
                id: `opt-${idx + 1}`,
                text,
              })),
            },
          });
          setMessage("");
          return;
        }
      }

      const contentToSend =
        trimmed ||
        (selectedAttachment?.type === "document"
          ? `📄 ${selectedAttachment.name}`
          : "");

      const scheduledFor = getScheduledIso();

      sendMessage({
        chatId,
        content: contentToSend,
        image: selectedAttachment?.dataUrl || undefined,
        replyTo: replyTo?._id || undefined,
        whisperTo: whisperUserIds.length > 0 ? whisperUserIds : undefined,
        ephemeralSeconds: ephemeralSeconds || undefined,
        scheduledFor,
      });
      if (onCancelReply) onCancelReply();
      setScheduledMinutes(0);
      setCustomScheduleTime("");
    }

    setSelectedAttachment(null);
    setMessage("");
    setShowEmojis(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 7 * 1024 * 1024) {
      toast.error("File size exceeds 7MB upload limit");
      return;
    }

    const allowedImageTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "image/avif"];
    const allowedDocTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const isImg = allowedImageTypes.includes(file.type);
    const isDoc = allowedDocTypes.includes(file.type);

    if (!isImg && !isDoc) {
      toast.error("Unsupported file type. Use PNG, JPEG, WebP, GIF, PDF, TXT, or DOCX.");
      e.target.value = "";
      return;
    }

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
      if (activeStudioTool) {
        e.preventDefault();
        setActiveStudioTool(null);
        return;
      }
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

  const toggleStudioTool = (tool) => {
    setActiveStudioTool((prev) => (prev === tool ? null : tool));
  };

  const toggleWhisperRecipient = (uid) => {
    setWhisperUserIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const hasScheduled = scheduledMinutes > 0 || Boolean(customScheduleTime);

  return (
    <div className="w-full flex flex-col bg-[var(--color-base-surface)] border-t border-[var(--color-base-border)] z-20 relative">
      {replyTo && (
        <div className="w-full px-5 pt-2.5 pb-2 flex items-center justify-between bg-[var(--color-base-panel)] border-b border-[var(--color-base-border)] animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2.5 min-w-0 border-l-2 border-indigo-400 pl-3">
            <CornerUpLeft className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-indigo-400 block truncate">
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
            className="p-1.5 rounded-full text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer"
            title="Cancel reply"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!isAIChat && activeStudioTool === "poll" && (
        <div className="p-4 bg-[var(--color-base-panel)] border-b border-[var(--color-base-border)] space-y-3 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-tech uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Create Live Poll
            </span>
            <button
              type="button"
              onClick={() => setActiveStudioTool(null)}
              className="text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="w-full h-9 px-3.5 rounded-xl bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-xs focus:outline-none focus:border-indigo-400"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pollOptions.map((opt, idx) => (
              <input
                key={idx}
                type="text"
                value={opt}
                onChange={(e) =>
                  setPollOptions((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))
                }
                placeholder={`Option ${idx + 1}`}
                className="h-9 px-3.5 rounded-xl bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-xs focus:outline-none focus:border-indigo-400"
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            {pollOptions.length < 4 ? (
              <button
                type="button"
                onClick={() => setPollOptions((prev) => [...prev, ""])}
                className="text-xs text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Option
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={handleSendPoll}
              className="px-4 py-1.5 rounded-full aurora-bg text-white text-xs font-semibold cursor-pointer"
            >
              Launch Poll
            </button>
          </div>
        </div>
      )}

      {!isAIChat && activeStudioTool === "code" && (
        <div className="p-4 bg-[var(--color-base-panel)] border-b border-[var(--color-base-border)] space-y-3 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-tech uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" /> Share Code Snippet
            </span>
            <button
              type="button"
              onClick={() => setActiveStudioTool(null)}
              className="text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={codeLanguage}
              onChange={(e) => setCodeLanguage(e.target.value)}
              placeholder="Language (e.g. tsx, python)"
              className="h-9 px-3 rounded-xl bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-xs font-mono-tech focus:outline-none focus:border-cyan-400"
            />
            <input
              type="text"
              value={codeTitle}
              onChange={(e) => setCodeTitle(e.target.value)}
              placeholder="Optional title"
              className="h-9 px-3 rounded-xl bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>
          <textarea
            value={codeContent}
            onChange={(e) => setCodeContent(e.target.value)}
            rows={4}
            placeholder="Paste code here..."
            className="w-full p-3 rounded-xl bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-xs font-mono-tech focus:outline-none focus:border-cyan-400 resize-none"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSendCode}
              className="px-4 py-1.5 rounded-full aurora-bg text-white text-xs font-semibold cursor-pointer"
            >
              Send Code Block
            </button>
          </div>
        </div>
      )}

      {!isAIChat && activeStudioTool === "ephemeral" && (
        <div className="px-5 py-3 bg-[var(--color-base-panel)] border-b border-[var(--color-base-border)] flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2 text-xs">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="font-semibold">Ink &amp; Burn Timer:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {EPHEMERAL_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  setEphemeralSeconds(opt.value);
                  setActiveStudioTool(null);
                }}
                className={`px-3 py-1 rounded-full text-xs font-mono-tech cursor-pointer transition-colors ${
                  ephemeralSeconds === opt.value
                    ? "aurora-bg text-white"
                    : "bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-[var(--color-base-muted)] hover:text-[var(--color-base-text)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isAIChat && activeStudioTool === "whisper" && (
        <div className="px-5 py-3 bg-[var(--color-base-panel)] border-b border-[var(--color-base-border)] space-y-2 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-tech uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5" /> Private Whisper Recipients
            </span>
            {whisperUserIds.length > 0 && (
              <button
                type="button"
                onClick={() => setWhisperUserIds([])}
                className="text-[11px] text-[var(--color-base-muted)] hover:text-red-400 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {otherParticipants.map((p) => {
              const pid = String(p?._id || p);
              const selected = whisperUserIds.includes(pid);
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => toggleWhisperRecipient(pid)}
                  className={`px-3 py-1 rounded-full text-xs cursor-pointer transition-all ${
                    selected
                      ? "bg-violet-500 text-white"
                      : "bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-[var(--color-base-text)]"
                  }`}
                >
                  @{p?.name || "Member"}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!isAIChat && activeStudioTool === "schedule" && (
        <div className="px-5 py-3 bg-[var(--color-base-panel)] border-b border-[var(--color-base-border)] space-y-3 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold">Schedule Dispatch:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {SCHEDULE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setScheduledMinutes(p.minutes);
                    setCustomScheduleTime("");
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-mono-tech cursor-pointer ${
                    scheduledMinutes === p.minutes && !customScheduleTime
                      ? "aurora-bg text-white"
                      : "bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-[var(--color-base-muted)]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <input
                type="datetime-local"
                value={customScheduleTime}
                onChange={(e) => {
                  setCustomScheduleTime(e.target.value);
                  setScheduledMinutes(0);
                }}
                className="h-7 px-2 rounded-full bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-[11px] font-mono-tech"
              />
            </div>
          </div>

          {scheduledMessages.length > 0 && (
            <div className="pt-2 border-t border-[var(--color-base-border)] space-y-1.5">
              <span className="text-[10px] font-mono-tech uppercase tracking-wider text-[var(--color-base-muted)] block">
                Pending Scheduled ({scheduledMessages.length})
              </span>
              {scheduledMessages.map((sm) => (
                <div
                  key={sm._id}
                  className="flex items-center justify-between text-xs px-3 py-1.5 rounded-xl bg-[var(--color-base-bg)] border border-[var(--color-base-border)]"
                >
                  <span className="truncate pr-2">
                    {sm.content} •{" "}
                    <span className="font-mono-tech text-[10px] text-cyan-400">
                      {new Date(sm.scheduledFor).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => cancelScheduledMessage(sm._id)}
                    className="text-red-400 hover:underline text-[11px] cursor-pointer shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isAIChat && !isBlocked && !isRecording && (
        <div className="flex items-center gap-1.5 px-4 sm:px-5 pt-2 pb-1 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => askInlineCopilot(chatId, "catch me up")}
            className="text-[10.5px] font-mono-tech px-2.5 py-1 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
            title="Summarize recent conversation with @whopai"
          >
            <Sparkles className="w-3 h-3" />
            <span>@whopai Catch Up</span>
          </button>

          <button
            type="button"
            onClick={() => toggleStudioTool("poll")}
            className={`text-[10.5px] font-mono-tech px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 cursor-pointer transition-colors ${
              activeStudioTool === "poll"
                ? "aurora-bg text-white border-transparent"
                : "bg-[var(--color-base-panel)] border-[var(--color-base-border)] text-[var(--color-base-muted)] hover:text-[var(--color-base-text)]"
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>Poll</span>
          </button>

          <button
            type="button"
            onClick={() => toggleStudioTool("code")}
            className={`text-[10.5px] font-mono-tech px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 cursor-pointer transition-colors ${
              activeStudioTool === "code"
                ? "aurora-bg text-white border-transparent"
                : "bg-[var(--color-base-panel)] border-[var(--color-base-border)] text-[var(--color-base-muted)] hover:text-[var(--color-base-text)]"
            }`}
          >
            <Code2 className="w-3 h-3" />
            <span>Code</span>
          </button>

          <button
            type="button"
            onClick={() => toggleStudioTool("ephemeral")}
            className={`text-[10.5px] font-mono-tech px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 cursor-pointer transition-colors ${
              ephemeralSeconds
                ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                : "bg-[var(--color-base-panel)] border-[var(--color-base-border)] text-[var(--color-base-muted)] hover:text-[var(--color-base-text)]"
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>{ephemeralSeconds ? `Burn ${ephemeralSeconds}s` : "Burn"}</span>
          </button>

          {chat?.isGroup && (
            <button
              type="button"
              onClick={() => toggleStudioTool("whisper")}
              className={`text-[10.5px] font-mono-tech px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 cursor-pointer transition-colors ${
                whisperUserIds.length > 0
                  ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                  : "bg-[var(--color-base-panel)] border-[var(--color-base-border)] text-[var(--color-base-muted)] hover:text-[var(--color-base-text)]"
              }`}
            >
              <EyeOff className="w-3 h-3" />
              <span>
                {whisperUserIds.length > 0 ? `Whisper (${whisperUserIds.length})` : "Whisper"}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => toggleStudioTool("schedule")}
            className={`text-[10.5px] font-mono-tech px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 cursor-pointer transition-colors ${
              hasScheduled || scheduledMessages.length > 0
                ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400"
                : "bg-[var(--color-base-panel)] border-[var(--color-base-border)] text-[var(--color-base-muted)] hover:text-[var(--color-base-text)]"
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>
              {hasScheduled
                ? customScheduleTime
                  ? "Scheduled"
                  : `+${scheduledMinutes}m`
                : scheduledMessages.length > 0
                ? `Queue (${scheduledMessages.length})`
                : "Schedule"}
            </span>
          </button>

          <button
            type="button"
            onMouseDown={startWalkieTalkie}
            onMouseUp={stopWalkieTalkie}
            onMouseLeave={() => {
              if (isWalkieActive) stopWalkieTalkie();
            }}
            onTouchStart={startWalkieTalkie}
            onTouchEnd={stopWalkieTalkie}
            className={`text-[10.5px] font-mono-tech px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 cursor-pointer select-none transition-all ${
              isWalkieActive
                ? "aurora-bg text-white border-transparent scale-105 shadow-md shadow-indigo-500/30"
                : "bg-[var(--color-base-panel)] border-[var(--color-base-border)] text-[var(--color-base-muted)] hover:text-cyan-400"
            }`}
            title="Hold to stream instant Walkie-Talkie audio to room"
          >
            <Radio className={`w-3 h-3 ${isWalkieActive ? "animate-ping" : ""}`} />
            <span>{isWalkieActive ? "Transmitting..." : "Hold Walkie"}</span>
          </button>
        </div>
      )}

      {isAIChat && !isAIStreaming && !isRecording && (
        <div className="flex items-center gap-2 px-5 pt-2.5 pb-1 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-mono-tech uppercase tracking-wider text-[var(--color-base-muted)] shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Prompts
          </span>
          {AI_SUGGESTIONS.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendAIMessage(sug)}
              className="text-[11px] px-3 py-1 rounded-full bg-[var(--color-base-panel)] hover:border-indigo-400 border border-[var(--color-base-border)] text-[var(--color-base-text)] transition-colors shrink-0 cursor-pointer"
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
            className="text-indigo-400 hover:underline font-semibold ml-1 cursor-pointer"
          >
            Unblock
          </button>
        </div>
      ) : (
        <div className="relative w-full px-4 sm:px-5 py-2.5 flex items-end gap-2">
          {showEmojis && (
            <div ref={pickerRef} className="absolute bottom-[64px] left-4 z-40">
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
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                  showEmojis
                    ? "text-indigo-400 bg-[var(--color-base-hover)]"
                    : "text-[var(--color-base-muted)] hover:bg-[var(--color-base-hover)] hover:text-[var(--color-base-text)]"
                }`}
              >
                <Smile className="w-4.5 h-4.5" />
              </button>

              <label
                className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] transition-colors shrink-0 cursor-pointer"
                title="Attach photo or document"
              >
                <Paperclip className="w-4.5 h-4.5" />
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
            <div className="flex-1 flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-full px-4 h-10 animate-pulse">
              <div className="flex items-center gap-2 text-red-400 text-xs font-mono-tech font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span>
                  REC • {Math.floor(recordingSeconds / 60)}:
                  {String(recordingSeconds % 60).padStart(2, "0")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => stopVoiceRecording(false)}
                  className="text-xs text-[var(--color-base-muted)] hover:text-red-400 px-2 py-1 rounded-full cursor-pointer"
                  title="Cancel"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
                <button
                  type="button"
                  onClick={() => stopVoiceRecording(true)}
                  className="w-8 h-8 rounded-full aurora-bg text-white flex items-center justify-center cursor-pointer shadow-sm"
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
                  <div className="absolute bottom-full mb-2 left-0 w-24 h-24 bg-[var(--color-base-panel)] rounded-2xl shadow-xl border border-[var(--color-base-border)] overflow-hidden animate-in fade-in zoom-in-95">
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
                  <div className="absolute bottom-full mb-2 left-0 min-w-[200px] max-w-xs p-2.5 bg-[var(--color-base-panel)] rounded-2xl shadow-xl border border-[var(--color-base-border)] flex items-center gap-2.5 animate-in fade-in zoom-in-95">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <span className="text-xs font-semibold text-[var(--color-base-text)] truncate block">
                        {selectedAttachment.name}
                      </span>
                      <span className="text-[10.5px] font-mono-tech text-[var(--color-base-muted)] block">
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
              <div className="w-full bg-[var(--color-base-bg)] border border-[var(--color-base-border)] focus-within:border-indigo-400 transition-colors rounded-full flex items-center min-h-[42px] px-4">
                <input
                  ref={inputRef}
                  value={message}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  placeholder={
                    isAIChat
                      ? "Ask WhopAI anything..."
                      : whisperUserIds.length > 0
                      ? "Write a private whisper..."
                      : "Message, @whopai, or /poll Q | A | B..."
                  }
                  className="flex-1 bg-transparent border-0 focus:ring-0 text-sm text-[var(--color-base-text)] placeholder:text-[var(--color-base-muted)] outline-none w-full"
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
                className="px-3.5 h-10 text-red-400 hover:bg-red-500/10 rounded-full shrink-0 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                title="Stop response"
              >
                <StopCircle className="w-4 h-4" />
                <span>Stop</span>
              </button>
            ) : message.trim() || selectedAttachment ? (
              <button
                onClick={onSubmit}
                disabled={isSendingMsg}
                className="w-10 h-10 aurora-bg text-white hover:opacity-95 rounded-full shrink-0 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md shadow-indigo-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startVoiceRecording}
                className="w-10 h-10 text-[var(--color-base-muted)] hover:text-cyan-400 hover:bg-[var(--color-base-hover)] rounded-full shrink-0 flex items-center justify-center transition-colors cursor-pointer"
                title="Record Voice Note"
              >
                <Mic className="w-4.5 h-4.5" />
              </button>
            ))}
        </div>
      )}
    </div>
  );
};
export default ChatFooter;
