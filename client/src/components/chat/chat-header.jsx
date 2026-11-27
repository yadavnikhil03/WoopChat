import { useState, useEffect } from "react";
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  X,
  Info,
  Download,
  Trash2,
  BellOff,
  ShieldAlert,
  LogOut,
  Users,
  ArrowLeft,
  UserPlus,
  UserMinus,
  Shield,
  Crown,
  Edit2,
  Check,
  ChevronUp,
  ChevronDown,
  Mail,
  FileText,
  Image as ImageIcon,
  Lock,
  Copy,
  Timer,
  Newspaper,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AvatarWithBadge from "../avatar-with-badge";
import { getOtherUserAndGroup, formatChatTime, isUserOnline } from "@/lib/helper";
import { isChatMuted, toggleChatMute } from "@/lib/sound";
import { useSocket } from "@/hooks/use-socket";
import { useChat } from "@/hooks/use-chat";
import { useCall } from "@/hooks/use-call";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const ChatHeader = ({
  chat,
  currentUserId,
  searchQuery = "",
  onSearchChange,
  isSearchOpen = false,
  setIsSearchOpen,
  messages = [],
}) => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const {
    fetchSingleChat,
    fetchAllUsers,
    users,
    addMemberToGroup,
    removeMemberFromGroup,
    promoteAdmin,
    demoteAdmin,
    updateGroupInfo,
    deleteGroup: deleteGroupAction,
    leaveGroup: leaveGroupAction,
    generateDigest,
    singleChat,
  } = useChat();
  const { initiateCall } = useCall();

  const { name, subheading, avatar, isOnline, isGroup, isAI } =
    getOtherUserAndGroup(chat, currentUserId);

  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");

  const [focusState, setFocusState] = useState(null);
  const [focusRemaining, setFocusRemaining] = useState(0);

  const [digestModalOpen, setDigestModalOpen] = useState(false);
  const [digestPreview, setDigestPreview] = useState(null);
  const [isLoadingDigest, setIsLoadingDigest] = useState(false);

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [infoTab, setInfoTab] = useState("overview");
  const [isMuted, setIsMuted] = useState(() => isChatMuted(chat?._id));
  const [isBlocked, setIsBlocked] = useState(false);

  const allChatMessages = singleChat?.messages || [];
  const sharedImages = allChatMessages.filter(
    (m) =>
      m.image &&
      typeof m.image === "string" &&
      !m.content?.startsWith("🎙️") &&
      (m.image.startsWith("data:image/") ||
        m.image.includes("cloudinary") ||
        m.image.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i))
  );
  const sharedDocs = allChatMessages.filter(
    (m) =>
      m.image &&
      typeof m.image === "string" &&
      !m.content?.startsWith("🎙️") &&
      !m.image.startsWith("data:audio") &&
      !m.image.startsWith("data:image/") &&
      !m.image.includes("cloudinary") &&
      !m.image.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i)
  );

  const otherUser = !isGroup
    ? chat?.participants?.find((p) => {
        const pid = p?._id ? p._id.toString() : p?.toString();
        const cid = currentUserId ? currentUserId.toString() : null;
        return pid !== cid;
      })
    : null;

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    description: "",
    confirmLabel: "Confirm",
    confirmVariant: "danger",
    onConfirm: () => {},
  });

  const openConfirm = ({ title, description, confirmLabel = "Confirm", confirmVariant = "danger", onConfirm }) => {
    setConfirmModal({
      isOpen: true,
      title,
      description,
      confirmLabel,
      confirmVariant,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await onConfirm();
      },
    });
  };

  useEffect(() => {
    setIsMuted(isChatMuted(chat?._id));
    setFocusState(null);
    setFocusRemaining(0);
  }, [chat?._id]);

  useEffect(() => {
    if (!socket || !chat?._id) return;
    const handleFocusState = (data) => {
      if (data?.chatId !== chat._id) return;
      if (data.active && data.endsAt) {
        setFocusState(data);
        toast.info(`${data.startedBy || "Teammate"} started a Deep Work Sprint`);
      } else {
        setFocusState(null);
        setFocusRemaining(0);
      }
    };
    socket.on("studio:focus-state", handleFocusState);
    return () => socket.off("studio:focus-state", handleFocusState);
  }, [socket, chat?._id]);

  useEffect(() => {
    if (!focusState?.active || !focusState?.endsAt) return;
    const endMs = new Date(focusState.endsAt).getTime();
    const update = () => {
      const left = Math.max(0, Math.ceil((endMs - Date.now()) / 1000));
      setFocusRemaining(left);
      if (left <= 0) {
        setFocusState(null);
        toast.success("Focus Sprint complete!");
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [focusState]);

  const toggleFocusSprint = () => {
    if (!socket?.connected || !chat?._id || isAI) return;
    if (focusState?.active) {
      socket.emit("studio:focus-stop", { chatId: chat._id });
    } else {
      socket.emit("studio:focus-start", {
        chatId: chat._id,
        durationMinutes: 25,
        label: "Deep Work Sprint",
      });
    }
  };

  const handleOpenDigest = async () => {
    if (!chat?._id || isAI) return;
    setDigestModalOpen(true);
    setIsLoadingDigest(true);
    const data = await generateDigest(chat._id, false);
    setDigestPreview(data);
    setIsLoadingDigest(false);
  };

  const handlePublishDigest = async () => {
    if (!chat?._id || isAI) return;
    setIsLoadingDigest(true);
    await generateDigest(chat._id, true);
    setIsLoadingDigest(false);
    setDigestModalOpen(false);
  };

  const handleDownloadDigest = () => {
    if (!digestPreview) return;
    const md = `# ${digestPreview.title}\n\n_${digestPreview.subtitle}_\n\n## Highlights\n${digestPreview.highlights
      .map((h) => `- ${h}`)
      .join("\n")}\n`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whopchat-digest-${name.replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Digest exported as Markdown");
  };

  const formatFocusClock = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);

  const jumpToMatch = (index) => {
    if (!messages?.length) return;
    const clampedIndex = (index + messages.length) % messages.length;
    setCurrentMatchIndex(clampedIndex);
    const targetMsg = messages[clampedIndex];
    if (targetMsg?._id) {
      const el = document.getElementById(`message-${targetMsg._id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-cyan-400", "bg-indigo-500/10");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-cyan-400", "bg-indigo-500/10");
        }, 1600);
      }
    }
  };

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState("");
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDesc, setEditGroupDesc] = useState("");
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  const isUserAdmin = (userOrId) => {
    if (!userOrId || !chat) return false;
    const uid = String(userOrId?._id || userOrId);
    const createdById = String(chat?.createdBy?._id || chat?.createdBy || "");
    if (createdById && createdById === uid) return true;
    return Array.isArray(chat?.admins) && chat.admins.some((a) => String(a?._id || a) === uid);
  };

  const isUserOwner = (userOrId) => {
    if (!userOrId || !chat) return false;
    const uid = String(userOrId?._id || userOrId);
    const createdById = String(chat?.createdBy?._id || chat?.createdBy || "");
    return Boolean(createdById && createdById === uid);
  };

  const isCurrentUserAdmin = isGroup && isUserAdmin(currentUserId);

  useEffect(() => {
    if (isInfoModalOpen && isGroup) {
      fetchAllUsers();
      setEditGroupName(chat?.groupName || name || "");
      setEditGroupDesc(chat?.groupDescription || "");
    }
  }, [isInfoModalOpen, isGroup, chat?.groupName, chat?.groupDescription, name, fetchAllUsers]);

  useEffect(() => {
    if (!isGroup && !isAI && chat?._id) {
      const other = chat?.participants?.find(
        (p) => (p._id ? p._id.toString() : p.toString()) !== currentUserId
      );
      const otherId = other?._id || other;
      if (otherId) {
        API.get("/users/blocked")
          .then((res) => {
            const list = res.data.data?.users || [];
            const found = list.some((u) => String(u._id || u) === String(otherId));
            setIsBlocked(found);
          })
          .catch(() => {});
      }
    }
  }, [chat, isGroup, isAI, currentUserId]);

  const participantIds = new Set(
    (chat?.participants || []).map((p) => String(p?._id || p))
  );
  const availableUsersToAdd = (users || []).filter(
    (u) => !participantIds.has(String(u._id))
  );
  const filteredAvailableUsers = availableUsersToAdd.filter((u) => {
    const q = addMemberSearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const handleStartAudioCall = () => {
    if (!otherUser?._id) {
      toast.info("Voice calling is available for 1-on-1 direct chats");
      return;
    }
    initiateCall({
      chatId: chat._id,
      otherUser: {
        _id: otherUser._id,
        name,
        avatar,
      },
      callType: "audio",
    });
  };

  const handleStartVideoCall = () => {
    if (!otherUser?._id) {
      toast.info("Video calling is available for 1-on-1 direct chats");
      return;
    }
    initiateCall({
      chatId: chat._id,
      otherUser: {
        _id: otherUser._id,
        name,
        avatar,
      },
      callType: "video",
    });
  };

  useEffect(() => {
    if (!socket || !chat?._id) return;

    let timeout;
    const handleTypingStart = (data) => {
      if (data.chatId === chat._id && data.userId !== currentUserId) {
        setIsTyping(true);
        setTypingUser(data.user?.name || "");
        clearTimeout(timeout);
        timeout = setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const handleTypingStop = (data) => {
      if (data.chatId === chat._id && data.userId !== currentUserId) {
        setIsTyping(false);
      }
    };

    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);

    return () => {
      clearTimeout(timeout);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
    };
  }, [socket, chat?._id, currentUserId]);

  const exportChat = () => {
    if (!messages.length) {
      toast.info("No messages to export");
      return;
    }
    const lines = messages.map((m) => {
      const time = formatChatTime(m.createdAt);
      const sender = m.sender?.name || (m.sender?._id === currentUserId ? "Me" : "Participant");
      return `[${time}] ${sender}: ${m.content || "[Media]"}`;
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whopchat-${name.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat exported successfully!");
  };

  const clearChat = async () => {
    if (chat?._id === "ai") {
      try {
        await API.delete("/ai/history");
        useChat.setState((state) => ({
          singleChat: {
            ...state.singleChat,
            messages: [],
          },
        }));
        toast.success("WhopAI conversation cleared!");
      } catch {
        toast.error("Failed to clear AI history");
      }
      return;
    }

    try {
      useChat.setState((state) => ({
        singleChat: {
          ...state.singleChat,
          messages: [],
        },
      }));
      toast.success("Chat history cleared");
    } catch {
      toast.error("Failed to clear chat");
    }
  };

  const toggleBlockContact = async () => {
    const other = chat?.participants?.find(
      (p) => (p._id ? p._id.toString() : p.toString()) !== currentUserId
    );
    const otherId = other?._id || other;
    if (!otherId) return;

    if (isBlocked) {
      try {
        await API.post(`/users/unblock/${otherId}`);
        setIsBlocked(false);
        toast.success(`${name} has been unblocked`);
        useChat.getState().sendMessage({
          chatId: chat._id,
          content: `✅ You unblocked this contact`,
        });
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to unblock user");
      }
    } else {
      openConfirm({
        title: `Block ${name}?`,
        description: `Are you sure you want to block ${name}? You will no longer receive calls or messages from this contact.`,
        confirmLabel: "Block",
        confirmVariant: "danger",
        onConfirm: async () => {
          try {
            await API.post(`/users/block/${otherId}`);
            setIsBlocked(true);
            toast.success(`${name} has been blocked`);
            useChat.getState().sendMessage({
              chatId: chat._id,
              content: `🚫 You blocked this contact`,
            });
          } catch (err) {
            toast.error(err.response?.data?.message || "Failed to block user");
          }
        },
      });
    }
  };

  const handleAddMember = async (targetUser) => {
    if (isSubmittingAdmin) return;
    setIsSubmittingAdmin(true);
    try {
      const ok = await addMemberToGroup(chat._id, targetUser._id);
      if (ok) {
        setAddMemberSearch("");
        await fetchSingleChat(chat._id);
      }
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleKickMember = async (targetUser) => {
    if (isSubmittingAdmin) return;
    const targetName = targetUser.name || "this user";
    openConfirm({
      title: `Remove ${targetName}?`,
      description: `Are you sure you want to remove ${targetName} from "${name}"? They will lose access to this group conversation.`,
      confirmLabel: "Remove",
      confirmVariant: "danger",
      onConfirm: async () => {
        setIsSubmittingAdmin(true);
        try {
          const ok = await removeMemberFromGroup(chat._id, targetUser._id);
          if (ok) {
            await fetchSingleChat(chat._id);
          }
        } finally {
          setIsSubmittingAdmin(false);
        }
      },
    });
  };

  const handleToggleAdmin = async (targetUser, willBeAdmin) => {
    if (isSubmittingAdmin) return;
    setIsSubmittingAdmin(true);
    try {
      const ok = willBeAdmin
        ? await promoteAdmin(chat._id, targetUser._id)
        : await demoteAdmin(chat._id, targetUser._id);
      if (ok) {
        await fetchSingleChat(chat._id);
      }
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleSaveGroupInfo = async () => {
    if (!editGroupName.trim()) {
      toast.error("Group name cannot be empty");
      return;
    }
    setIsSubmittingAdmin(true);
    try {
      const ok = await updateGroupInfo(chat._id, {
        groupName: editGroupName.trim(),
        groupDescription: editGroupDesc.trim(),
      });
      if (ok) {
        setIsEditingGroup(false);
        await fetchSingleChat(chat._id);
      }
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleLeaveGroup = async () => {
    openConfirm({
      title: "Leave group?",
      description: `Are you sure you want to leave "${name}"? You will not receive any more messages from this group.`,
      confirmLabel: "Leave",
      confirmVariant: "danger",
      onConfirm: async () => {
        const ok = await leaveGroupAction(chat._id);
        if (ok) {
          setIsInfoModalOpen(false);
          navigate("/chat");
        }
      },
    });
  };

  const handleDeleteGroup = async () => {
    openConfirm({
      title: "Delete group permanently?",
      description: `Are you sure you want to permanently delete "${name}" and all of its message history? This action cannot be undone.`,
      confirmLabel: "Delete Group",
      confirmVariant: "danger",
      onConfirm: async () => {
        const ok = await deleteGroupAction(chat._id);
        if (ok) {
          setIsInfoModalOpen(false);
          navigate("/chat");
        }
      },
    });
  };

  return (
    <>
      {digestModalOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setDigestModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl border border-[var(--color-base-border)] bg-[var(--color-base-surface)] shadow-2xl overflow-hidden animate-in zoom-in-95"
          >
            <div className="p-5 border-b border-[var(--color-base-border)] bg-[var(--color-base-panel)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Newspaper className="w-4 h-4 text-cyan-400" />
                <span className="font-display font-bold text-sm">Editorial Thread Digest</span>
              </div>
              <button
                type="button"
                onClick={() => setDigestModalOpen(false)}
                className="p-1.5 rounded-full text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {isLoadingDigest ? (
                <div className="py-12 text-center text-xs text-[var(--color-base-muted)]">
                  Curating highlights...
                </div>
              ) : digestPreview ? (
                <>
                  <p className="font-cursive text-4xl aurora-text leading-[0.8]">
                    Edition Recap
                  </p>
                  <h3 className="font-display font-extrabold text-xl tracking-tight">
                    {digestPreview.title}
                  </h3>
                  <p className="font-editorial italic text-base text-[var(--color-base-muted)]">
                    {digestPreview.subtitle}
                  </p>
                  <div className="space-y-2 pt-3 border-t border-[var(--color-base-border)]">
                    {digestPreview.highlights?.map((h, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-2xl bg-[var(--color-base-panel)] border border-[var(--color-base-border)] text-xs leading-relaxed"
                      >
                        {h}
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            <div className="p-4 border-t border-[var(--color-base-border)] bg-[var(--color-base-panel)] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleDownloadDigest}
                disabled={!digestPreview}
                className="px-4 py-2 rounded-full border border-[var(--color-base-border)] bg-[var(--color-base-bg)] text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .md</span>
              </button>
              <button
                type="button"
                onClick={handlePublishDigest}
                disabled={isLoadingDigest}
                className="px-5 py-2 rounded-full aurora-bg text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Publish to Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isInfoModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-[var(--color-base-surface)] border border-[var(--color-base-border)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-base-border)] bg-[var(--color-base-panel)] shrink-0">
              <h3 className="font-display font-bold text-base text-[var(--color-base-text)] flex items-center gap-2">
                {isGroup ? (
                  <Users className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Info className="w-4 h-4 text-indigo-400" />
                )}
                <span>{isGroup ? "Group Details" : "Contact Information"}</span>
              </h3>
              <button
                onClick={() => {
                  setIsInfoModalOpen(false);
                  setIsEditingGroup(false);
                  setIsAddMemberOpen(false);
                }}
                className="p-1.5 rounded-full text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center border-b border-[var(--color-base-border)] bg-[var(--color-base-panel)] px-6 shrink-0">
              <button
                type="button"
                onClick={() => setInfoTab("overview")}
                className={cn(
                  "py-2.5 px-4 text-[11px] font-mono-tech uppercase tracking-wider border-b-2 transition-colors cursor-pointer",
                  infoTab === "overview"
                    ? "border-indigo-400 text-indigo-400 font-semibold"
                    : "border-transparent text-[var(--color-base-muted)] hover:text-[var(--color-base-text)]"
                )}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setInfoTab("media")}
                className={cn(
                  "py-2.5 px-4 text-[11px] font-mono-tech uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center gap-1.5",
                  infoTab === "media"
                    ? "border-indigo-400 text-indigo-400 font-semibold"
                    : "border-transparent text-[var(--color-base-muted)] hover:text-[var(--color-base-text)]"
                )}
              >
                <span>Media &amp; Files</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-base-bg)] text-[var(--color-base-muted)]">
                  {sharedImages.length + sharedDocs.length}
                </span>
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {infoTab === "media" ? (
                <div className="space-y-5">
                  {sharedImages.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono-tech font-bold text-[var(--color-base-muted)] uppercase tracking-wider block mb-2">
                        Shared Photos ({sharedImages.length})
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {sharedImages.map((m, idx) => (
                          <div
                            key={m._id || idx}
                            className="aspect-square rounded-xl overflow-hidden bg-black/20 border border-[var(--color-base-border)] relative group/img cursor-pointer"
                            onClick={() => {
                              const a = document.createElement("a");
                              a.href = m.image;
                              a.download = `whopchat-photo-${m._id || idx}.png`;
                              a.click();
                            }}
                          >
                            <img
                              src={m.image}
                              alt="Shared"
                              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Download className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sharedDocs.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono-tech font-bold text-[var(--color-base-muted)] uppercase tracking-wider block mb-2">
                        Documents &amp; Files ({sharedDocs.length})
                      </span>
                      <div className="space-y-2">
                        {sharedDocs.map((m, idx) => {
                          const docName = (m.content || "document")
                            .replace(/^📄\s*/, "")
                            .trim();
                          return (
                            <div
                              key={m._id || idx}
                              className="p-2.5 rounded-2xl bg-[var(--color-base-panel)] border border-[var(--color-base-border)] flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-medium text-[var(--color-base-text)] truncate">
                                  {docName}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const a = document.createElement("a");
                                  a.href = m.image;
                                  a.download = docName || "document";
                                  a.click();
                                }}
                                className="p-1.5 rounded-full text-[var(--color-base-muted)] hover:text-indigo-400 hover:bg-[var(--color-base-bg)] transition-colors cursor-pointer shrink-0"
                                title="Download document"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {sharedImages.length === 0 && sharedDocs.length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-[var(--color-base-panel)] border border-[var(--color-base-border)] flex items-center justify-center text-[var(--color-base-muted)] mb-3">
                        <ImageIcon className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                      <p className="text-xs font-medium text-[var(--color-base-text)]">
                        No media or documents shared yet
                      </p>
                      <p className="text-[11px] text-[var(--color-base-muted)] mt-0.5">
                        Photos and files sent in this chat will appear here.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center text-center">
                    <AvatarWithBadge name={name} src={avatar} isGroup={isGroup} className="w-20 h-20 mb-3" />

                    {isEditingGroup ? (
                      <div className="w-full space-y-3 mt-1">
                        <div>
                          <label className="text-[10px] font-mono-tech font-bold text-[var(--color-base-muted)] uppercase tracking-wider block text-left mb-1">
                            Group Name
                          </label>
                          <input
                            type="text"
                            value={editGroupName}
                            onChange={(e) => setEditGroupName(e.target.value)}
                            className="w-full px-3.5 py-2 bg-[var(--color-base-panel)] border border-[var(--color-base-border)] rounded-xl text-sm text-[var(--color-base-text)] focus:outline-none focus:border-indigo-400"
                            placeholder="Group name"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono-tech font-bold text-[var(--color-base-muted)] uppercase tracking-wider block text-left mb-1">
                            Description
                          </label>
                          <textarea
                            value={editGroupDesc}
                            onChange={(e) => setEditGroupDesc(e.target.value)}
                            rows={2}
                            className="w-full px-3.5 py-2 bg-[var(--color-base-panel)] border border-[var(--color-base-border)] rounded-xl text-sm text-[var(--color-base-text)] focus:outline-none focus:border-indigo-400 resize-none"
                            placeholder="Group description (optional)"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => setIsEditingGroup(false)}
                            className="px-3.5 py-1.5 rounded-full text-xs font-medium text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveGroupInfo}
                            disabled={isSubmittingAdmin}
                            className="px-4 py-1.5 rounded-full text-xs font-semibold aurora-bg hover:opacity-90 text-white flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Changes</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display text-lg font-bold text-[var(--color-base-text)]">{name}</h4>
                          {isCurrentUserAdmin && (
                            <button
                              onClick={() => setIsEditingGroup(true)}
                              className="p-1 rounded-full text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-panel)] transition-colors cursor-pointer"
                              title="Edit group details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] font-mono-tech text-[var(--color-base-muted)] mt-0.5">
                          {isAI ? "Automated Intelligence Assistant" : isGroup ? `${chat?.participants?.length || 0} participants` : isOnline ? "Active now" : (subheading || "Offline")}
                        </p>
                      </>
                    )}
                  </div>

                  {!isGroup && !isAI && infoTab === "overview" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsInfoModalOpen(false);
                            handleStartAudioCall();
                          }}
                          className="p-3 rounded-2xl bg-[var(--color-base-panel)] hover:border-indigo-400 border border-[var(--color-base-border)] flex flex-col items-center gap-1.5 text-xs text-[var(--color-base-text)] transition-colors cursor-pointer"
                        >
                          <Phone className="w-4 h-4 text-indigo-400" />
                          <span className="text-[10.5px] font-medium">Audio</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsInfoModalOpen(false);
                            handleStartVideoCall();
                          }}
                          className="p-3 rounded-2xl bg-[var(--color-base-panel)] hover:border-indigo-400 border border-[var(--color-base-border)] flex flex-col items-center gap-1.5 text-xs text-[var(--color-base-text)] transition-colors cursor-pointer"
                        >
                          <Video className="w-4 h-4 text-indigo-400" />
                          <span className="text-[10.5px] font-medium">Video</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const nextMuted = toggleChatMute(chat?._id);
                            setIsMuted(nextMuted);
                            toast.info(nextMuted ? "Notifications muted for this chat" : "Notifications unmuted");
                          }}
                          className="p-3 rounded-2xl bg-[var(--color-base-panel)] hover:border-indigo-400 border border-[var(--color-base-border)] flex flex-col items-center gap-1.5 text-xs text-[var(--color-base-text)] transition-colors cursor-pointer"
                        >
                          <BellOff className={cn("w-4 h-4", isMuted ? "text-amber-400" : "text-[var(--color-base-muted)]")} />
                          <span className="text-[10.5px] font-medium">{isMuted ? "Muted" : "Mute"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={exportChat}
                          className="p-3 rounded-2xl bg-[var(--color-base-panel)] hover:border-indigo-400 border border-[var(--color-base-border)] flex flex-col items-center gap-1.5 text-xs text-[var(--color-base-text)] transition-colors cursor-pointer"
                        >
                          <Download className="w-4 h-4 text-cyan-400" />
                          <span className="text-[10.5px] font-medium">Export</span>
                        </button>
                      </div>

                      {otherUser?.email && (
                        <div className="bg-[var(--color-base-panel)] p-3.5 rounded-2xl border border-[var(--color-base-border)] flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
                              <Mail className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-mono-tech font-bold text-[var(--color-base-muted)] uppercase tracking-wider block">
                                Email Address
                              </span>
                              <span className="text-xs text-[var(--color-base-text)] font-medium truncate block">
                                {otherUser.email}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(otherUser.email);
                              toast.success("Email copied to clipboard");
                            }}
                            className="p-1.5 rounded-full text-[var(--color-base-muted)] hover:text-indigo-400 hover:bg-[var(--color-base-bg)] transition-colors cursor-pointer"
                            title="Copy email"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="bg-[var(--color-base-panel)] p-3.5 rounded-2xl border border-[var(--color-base-border)] flex items-center gap-3 text-xs text-[var(--color-base-muted)]">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-indigo-400 block text-xs">End-to-End Encrypted</span>
                          <span className="text-[11px]">Messages and calls are secured with end-to-end encryption.</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {isGroup && !isEditingGroup && chat?.groupDescription && (
                    <div className="bg-[var(--color-base-panel)] p-3.5 rounded-2xl border border-[var(--color-base-border)]">
                      <span className="text-[10px] font-mono-tech font-bold text-[var(--color-base-muted)] uppercase tracking-wider block mb-1">
                        Description
                      </span>
                      <p className="text-sm text-[var(--color-base-text)]">{chat.groupDescription}</p>
                    </div>
                  )}

                  {isGroup && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono-tech font-bold text-[var(--color-base-muted)] uppercase tracking-wider">
                          Participants ({chat?.participants?.length || 0})
                        </span>
                        {isCurrentUserAdmin && (
                          <button
                            onClick={() => setIsAddMemberOpen(!isAddMemberOpen)}
                            className={`text-xs px-3 py-1 rounded-full border font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isAddMemberOpen
                                ? "aurora-bg text-white border-transparent"
                                : "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                            }`}
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>{isAddMemberOpen ? "Done" : "Add Member"}</span>
                          </button>
                        )}
                      </div>

                      {isAddMemberOpen && (
                        <div className="p-3.5 bg-[var(--color-base-panel)] border border-indigo-500/30 rounded-2xl space-y-3 animate-in slide-in-from-top-2 duration-150">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[var(--color-base-text)] flex items-center gap-1.5">
                              <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
                              Add Someone to Group
                            </span>
                            <span className="text-[11px] font-mono-tech text-[var(--color-base-muted)]">
                              {availableUsersToAdd.length} available
                            </span>
                          </div>

                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-base-muted)]" />
                            <input
                              type="text"
                              value={addMemberSearch}
                              onChange={(e) => setAddMemberSearch(e.target.value)}
                              placeholder="Search users to add..."
                              className="w-full pl-9 pr-3 py-1.5 bg-[var(--color-base-bg)] border border-[var(--color-base-border)] rounded-full text-xs text-[var(--color-base-text)] placeholder:text-[var(--color-base-muted)] focus:outline-none focus:border-indigo-400"
                            />
                          </div>

                          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                            {filteredAvailableUsers.length === 0 ? (
                              <p className="text-xs text-center py-3 text-[var(--color-base-muted)]">
                                {availableUsersToAdd.length === 0
                                  ? "All registered users are already in this group."
                                  : "No users match your search."}
                              </p>
                            ) : (
                              filteredAvailableUsers.map((u) => (
                                <div
                                  key={u._id}
                                  className="flex items-center justify-between p-2 rounded-xl bg-[var(--color-base-bg)] border border-[var(--color-base-border)] transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <AvatarWithBadge name={u.name || "U"} src={u.avatar} className="w-6 h-6 shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium text-[var(--color-base-text)] truncate">{u.name}</p>
                                      <p className="text-[10px] text-[var(--color-base-muted)] truncate">{u.email}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleAddMember(u)}
                                    disabled={isSubmittingAdmin}
                                    className="px-3 py-1 rounded-full aurora-bg hover:opacity-90 text-white text-[11px] font-semibold flex items-center gap-1 transition-transform active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                                  >
                                    <UserPlus className="w-3 h-3" />
                                    <span>Add</span>
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                        {chat?.participants?.map((p) => {
                          const isTargetAdmin = isUserAdmin(p._id);
                          const isTargetOwner = isUserOwner(p._id);
                          const isSelf = p._id === currentUserId;
                          const canManageTarget = isCurrentUserAdmin && !isSelf && !isTargetOwner;

                          return (
                            <div
                              key={p._id || p}
                              className="flex items-center justify-between p-2.5 rounded-2xl bg-[var(--color-base-panel)] border border-[var(--color-base-border)] transition-all gap-2"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <AvatarWithBadge name={p.name || "U"} src={p.avatar} isOnline={isUserOnline(p._id)} className="w-8 h-8 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium text-[var(--color-base-text)] truncate">
                                      {p.name}
                                    </span>
                                    {isSelf && (
                                      <span className="text-[11px] text-[var(--color-base-muted)] font-normal">
                                        (You)
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-[var(--color-base-muted)] truncate">
                                    {p.email || (isUserOnline(p._id) ? "Active now" : "Offline")}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isTargetOwner ? (
                                  <span className="text-[10px] px-2.5 py-0.5 bg-amber-500/15 text-amber-400 rounded-full font-semibold border border-amber-500/30 flex items-center gap-1">
                                    <Crown className="w-3 h-3" />
                                    Owner
                                  </span>
                                ) : isTargetAdmin ? (
                                  <span className="text-[10px] px-2.5 py-0.5 bg-indigo-500/15 text-indigo-400 rounded-full font-semibold border border-indigo-500/30 flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    Admin
                                  </span>
                                ) : null}

                                {canManageTarget && (
                                  <div className="flex items-center gap-1 ml-1">
                                    <button
                                      onClick={() => handleToggleAdmin(p, !isTargetAdmin)}
                                      disabled={isSubmittingAdmin}
                                      className={`p-1.5 rounded-full border border-[var(--color-base-border)] text-xs transition-colors cursor-pointer ${
                                        isTargetAdmin
                                          ? "text-[var(--color-base-muted)] hover:text-amber-400 hover:bg-[var(--color-base-hover)]"
                                          : "text-[var(--color-base-muted)] hover:text-indigo-400 hover:bg-[var(--color-base-hover)]"
                                      }`}
                                      title={isTargetAdmin ? "Dismiss as Admin" : "Make Group Admin"}
                                    >
                                      <Shield className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => handleKickMember(p)}
                                      disabled={isSubmittingAdmin}
                                      className="px-2.5 py-1 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                      title="Kick member from group"
                                    >
                                      <UserMinus className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline">Kick</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {isGroup ? (
              <div className="p-4 border-t border-[var(--color-base-border)] bg-[var(--color-base-panel)] flex items-center justify-between gap-3 shrink-0">
                <button
                  onClick={handleLeaveGroup}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[var(--color-base-muted)] hover:text-red-400 hover:bg-red-500/10 border border-[var(--color-base-border)] hover:border-red-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Leave Group</span>
                </button>

                {isCurrentUserAdmin && (
                  <button
                    onClick={handleDeleteGroup}
                    className="px-4 py-2 rounded-full text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Group</span>
                  </button>
                )}
              </div>
            ) : !isAI && (
              <div className="p-4 border-t border-[var(--color-base-border)] bg-[var(--color-base-panel)] flex items-center justify-between gap-3 shrink-0">
                <button
                  onClick={() => {
                    openConfirm({
                      title: "Clear all messages?",
                      description: "This will remove all message history from your view.",
                      confirmLabel: "Clear Messages",
                      confirmVariant: "danger",
                      onConfirm: clearChat,
                    });
                  }}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[var(--color-base-muted)] hover:text-amber-400 hover:bg-amber-500/10 border border-[var(--color-base-border)] hover:border-amber-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Chat</span>
                </button>
                <button
                  onClick={toggleBlockContact}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer",
                    isBlocked
                      ? "text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30"
                      : "text-red-400 bg-red-500/10 hover:bg-red-500/20 border-red-500/30"
                  )}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{isBlocked ? "Unblock Contact" : "Block Contact"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="w-full flex flex-col bg-[var(--color-base-surface)] border-b border-[var(--color-base-border)] z-20">
        <div className="w-full flex items-center justify-between px-4 sm:px-6 h-[64px]">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => navigate("/chat")}
              className="lg:hidden p-1.5 -ml-1 rounded-full text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer shrink-0"
              title="Back to chats"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div
              onClick={() => setIsInfoModalOpen(true)}
              className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity min-w-0"
              title="Click to view details"
            >
              <AvatarWithBadge name={name} src={avatar} isGroup={isGroup} isOnline={isOnline} className="w-9 h-9 shrink-0" />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h5 className="font-display text-[15px] font-bold text-[var(--color-base-text)] leading-tight truncate">{name}</h5>
                  {isAI && (
                    <span className="text-[9px] font-mono-tech uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shrink-0">
                      AI
                    </span>
                  )}
                </div>

                {isTyping ? (
                  <span className="text-[11px] font-mono-tech text-cyan-400 font-medium truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                    {isGroup && typingUser ? `${typingUser} is typing...` : "typing..."}
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isOnline && !isGroup ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                        <span className="text-[11px] font-mono-tech text-cyan-400 font-medium truncate">online</span>
                      </>
                    ) : (
                      <span className="text-[11px] text-[var(--color-base-muted)] truncate">
                        {subheading || "click for info"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[var(--color-base-muted)]">
            {!isAI && (
              <>
                <button
                  type="button"
                  onClick={toggleFocusSprint}
                  title={focusState?.active ? "Stop Focus Sprint" : "Start 25m Focus Sprint"}
                  className={cn(
                    "hidden sm:flex items-center gap-1.5 px-3 h-8 rounded-full text-[11px] font-mono-tech transition-all cursor-pointer mr-1",
                    focusState?.active
                      ? "aurora-bg text-white shadow-md shadow-indigo-500/25 animate-pulse"
                      : "border border-[var(--color-base-border)] bg-[var(--color-base-panel)] text-[var(--color-base-muted)] hover:text-cyan-400 hover:border-cyan-400/50"
                  )}
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>{focusState?.active ? formatFocusClock(focusRemaining) : "Focus"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenDigest}
                  title="Generate Editorial Thread Digest"
                  className="hover:bg-[var(--color-base-hover)] hover:text-cyan-400 rounded-full h-9 w-9 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Newspaper className="w-4 h-4" />
                </button>

                <button
                  onClick={handleStartAudioCall}
                  title="Start Voice Call"
                  className="hover:bg-[var(--color-base-hover)] hover:text-indigo-400 rounded-full h-9 w-9 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                </button>

                <button
                  onClick={handleStartVideoCall}
                  title="Start Video Call"
                  className="hover:bg-[var(--color-base-hover)] hover:text-indigo-400 rounded-full h-9 w-9 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={() => {
                if (setIsSearchOpen) setIsSearchOpen(!isSearchOpen);
              }}
              title="Search in conversation"
              className={`rounded-full h-9 w-9 flex items-center justify-center transition-colors cursor-pointer ${
                isSearchOpen
                  ? "bg-indigo-500/15 text-indigo-400"
                  : "hover:bg-[var(--color-base-hover)] hover:text-[var(--color-base-text)]"
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  title="More actions"
                  className="hover:bg-[var(--color-base-hover)] hover:text-[var(--color-base-text)] rounded-full h-9 w-9 flex items-center justify-center transition-colors cursor-pointer outline-none"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-52 z-[9999]">
                <DropdownMenuItem
                  onClick={() => setIsInfoModalOpen(true)}
                  className="flex items-center gap-2 cursor-pointer text-sm"
                >
                  <Info className="w-4 h-4" />
                  <span>{isGroup ? "Group Info" : "Contact Info"}</span>
                </DropdownMenuItem>

                {!isAI && (
                  <DropdownMenuItem
                    onClick={handleOpenDigest}
                    className="flex items-center gap-2 cursor-pointer text-sm"
                  >
                    <Newspaper className="w-4 h-4" />
                    <span>Edition Digest</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={exportChat}
                  className="flex items-center gap-2 cursor-pointer text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Chat (.txt)</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    const nextMuted = toggleChatMute(chat?._id);
                    setIsMuted(nextMuted);
                    toast.info(nextMuted ? "Notifications muted for this chat" : "Notifications unmuted");
                  }}
                  className="flex items-center gap-2 cursor-pointer text-sm"
                >
                  <BellOff className="w-4 h-4" />
                  <span>{isMuted ? "Unmute Alerts" : "Mute Alerts"}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={clearChat}
                  className="flex items-center gap-2 cursor-pointer text-sm text-amber-400 hover:text-amber-500 focus:text-amber-500"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Messages</span>
                </DropdownMenuItem>

                {!isGroup && !isAI && (
                  <DropdownMenuItem
                    onClick={toggleBlockContact}
                    className={`flex items-center gap-2 cursor-pointer text-sm ${
                      isBlocked
                        ? "text-indigo-400"
                        : "text-red-400 hover:text-red-500 focus:text-red-500"
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>{isBlocked ? "Unblock Contact" : "Block Contact"}</span>
                  </DropdownMenuItem>
                )}

                {isGroup && (
                  <>
                    <DropdownMenuItem
                      onClick={handleLeaveGroup}
                      className="flex items-center gap-2 cursor-pointer text-sm text-red-400 hover:text-red-500 focus:text-red-500"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Leave Group</span>
                    </DropdownMenuItem>

                    {isCurrentUserAdmin && (
                      <DropdownMenuItem
                        onClick={handleDeleteGroup}
                        className="flex items-center gap-2 cursor-pointer text-sm text-red-400 hover:text-red-500 focus:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Group</span>
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isSearchOpen && (
          <div className="px-6 py-2.5 bg-[var(--color-base-panel)] border-t border-[var(--color-base-border)] flex items-center gap-3 animate-in slide-in-from-top-2 duration-150">
            <Search className="w-4 h-4 text-[var(--color-base-muted)] shrink-0" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (e.shiftKey) {
                    jumpToMatch(currentMatchIndex - 1);
                  } else {
                    jumpToMatch(currentMatchIndex + 1);
                  }
                } else if (e.key === "Escape") {
                  if (onSearchChange) onSearchChange("");
                  if (setIsSearchOpen) setIsSearchOpen(false);
                }
              }}
              placeholder="Search in conversation... (Enter for next, Shift+Enter for prev)"
              className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--color-base-text)] placeholder:text-[var(--color-base-muted)]"
            />

            {searchQuery && (
              <div className="flex items-center gap-1.5 shrink-0 select-none">
                <span className="text-[11px] font-mono-tech text-[var(--color-base-muted)] px-1">
                  {messages?.length > 0
                    ? `${currentMatchIndex + 1} of ${messages.length}`
                    : "No matches"}
                </span>

                {messages?.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => jumpToMatch(currentMatchIndex - 1)}
                      className="p-1 rounded-full text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer"
                      title="Previous match (Shift+Enter)"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => jumpToMatch(currentMatchIndex + 1)}
                      className="p-1 rounded-full text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer"
                      title="Next match (Enter)"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (onSearchChange) onSearchChange("");
                if (setIsSearchOpen) setIsSearchOpen(false);
              }}
              className="p-1 rounded-full text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] transition-colors cursor-pointer"
              title="Close search (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {confirmModal.isOpen && (
        <div
          className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
          onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        >
          <div
            className="w-full max-w-sm bg-[var(--color-base-surface)] border border-[var(--color-base-border)] rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                  confirmModal.confirmVariant === "danger"
                    ? "bg-red-500/15 border-red-500/30 text-red-400"
                    : "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-display text-base font-bold text-[var(--color-base-text)] leading-snug">
                  {confirmModal.title}
                </h4>
                <p className="text-xs text-[var(--color-base-muted)] mt-0.5 leading-relaxed">
                  {confirmModal.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-base-border)]">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-full text-xs font-medium text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-5 py-2 rounded-full text-xs font-semibold text-white transition-all shadow-sm active:scale-95 cursor-pointer ${
                  confirmModal.confirmVariant === "danger"
                    ? "bg-red-500 hover:bg-red-600"
                    : "aurora-bg hover:opacity-90"
                }`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default ChatHeader;
