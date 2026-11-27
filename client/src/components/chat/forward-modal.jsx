import { useState, useMemo, useEffect } from "react";
import { X, Search, Forward, Check } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import AvatarWithBadge from "../avatar-with-badge";
import { toast } from "sonner";
import { getOtherUserAndGroup } from "@/lib/helper";

const ForwardModal = ({ isOpen, onClose, message, currentUserId }) => {
  const { chats, users, sendMessage, createChat, fetchChats, fetchAllUsers } = useChat();
  const [search, setSearch] = useState("");
  const [forwardingTargetId, setForwardingTargetId] = useState(null);
  const [forwardedIds, setForwardedIds] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchAllUsers();
    }
  }, [isOpen, fetchAllUsers]);

  const filteredChats = useMemo(() => {
    if (!chats) return [];
    const q = search.toLowerCase().trim();
    if (!q) return chats;
    return chats.filter((c) => {
      const { name } = getOtherUserAndGroup(c, currentUserId);
      return name?.toLowerCase().includes(q);
    });
  }, [chats, search, currentUserId]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const q = search.toLowerCase().trim();
    if (!q) return [];
    return users.filter(
      (u) =>
        u._id !== currentUserId &&
        (u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
    );
  }, [users, search, currentUserId]);

  if (!isOpen || !message) return null;

  const handleForwardToChat = async (targetChat) => {
    const targetChatId = targetChat._id;
    setForwardingTargetId(targetChatId);
    try {
      await sendMessage({
        chatId: targetChatId,
        content: message.content || "",
        image: message.image || undefined,
        isForwarded: true,
      });
      setForwardedIds((prev) => new Set([...prev, targetChatId]));
      const { name } = getOtherUserAndGroup(targetChat, currentUserId);
      toast.success(`Message forwarded to ${name || "chat"}`);
      setTimeout(() => onClose(), 600);
    } catch {
      toast.error("Failed to forward message");
    } finally {
      setForwardingTargetId(null);
    }
  };

  const handleForwardToUser = async (targetUser) => {
    setForwardingTargetId(targetUser._id);
    try {
      const newChat = await createChat({
        isGroup: false,
        participantId: targetUser._id,
      });
      if (newChat?._id) {
        await sendMessage({
          chatId: newChat._id,
          content: message.content || "",
          image: message.image || undefined,
          isForwarded: true,
        });
        setForwardedIds((prev) => new Set([...prev, targetUser._id]));
        toast.success(`Message forwarded to ${targetUser.name}`);
        await fetchChats();
        setTimeout(() => onClose(), 600);
      }
    } catch {
      toast.error("Failed to forward message");
    } finally {
      setForwardingTargetId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[var(--color-base-surface)] border border-[var(--color-base-border)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-base-border)] bg-[var(--color-base-panel)] shrink-0">
          <h3 className="font-display font-bold text-base text-[var(--color-base-text)] flex items-center gap-2">
            <Forward className="w-4 h-4 text-indigo-400" />
            <span>Forward message</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 bg-[var(--color-base-panel)]/50 border-b border-[var(--color-base-border)] shrink-0 flex items-center gap-3">
          <div className="flex-1 min-w-0 border-l-2 border-indigo-400 pl-3">
            <p className="text-[10px] font-mono-tech uppercase tracking-wider font-semibold text-indigo-400">
              Snippet
            </p>
            <p className="text-xs text-[var(--color-base-text)] truncate mt-0.5">
              {message.content || (message.image ? "📷 Photo" : "Attachment")}
            </p>
          </div>
          {message.image && (
            <img
              src={message.image}
              alt="Thumbnail"
              className="w-9 h-9 object-cover rounded-lg border border-[var(--color-base-border)] shrink-0"
            />
          )}
        </div>

        <div className="p-3.5 border-b border-[var(--color-base-border)] shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-base-muted)]" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations or contacts..."
              className="w-full pl-10 pr-4 py-2 bg-[var(--color-base-bg)] border border-[var(--color-base-border)] rounded-full text-xs text-[var(--color-base-text)] placeholder:text-[var(--color-base-muted)] focus:outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        <div className="p-3.5 overflow-y-auto flex-1 space-y-2">
          <span className="text-[10px] font-mono-tech font-bold text-[var(--color-base-muted)] uppercase tracking-wider block px-1">
            Recent Conversations ({filteredChats.length})
          </span>

          {filteredChats.length === 0 ? (
            <p className="text-xs text-center py-4 text-[var(--color-base-muted)]">
              No active conversations match your search.
            </p>
          ) : (
            filteredChats.map((c) => {
              const { name, avatar, isOnline, isGroup } = getOtherUserAndGroup(
                c,
                currentUserId
              );
              const isForwarded = forwardedIds.has(c._id);
              const isLoading = forwardingTargetId === c._id;

              return (
                <div
                  key={c._id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-[var(--color-base-panel)] border border-[var(--color-base-border)] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                    <AvatarWithBadge
                      name={name}
                      src={avatar}
                      isGroup={isGroup}
                      isOnline={isOnline}
                      className="w-8 h-8 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--color-base-text)] truncate">
                        {name}
                      </p>
                      <p className="text-[10px] font-mono-tech text-[var(--color-base-muted)] truncate">
                        {isGroup ? `${c.participants?.length || 0} members` : isOnline ? "Online" : "Offline"}
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={isLoading || isForwarded}
                    onClick={() => handleForwardToChat(c)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                      isForwarded
                        ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                        : "aurora-bg hover:opacity-90 text-white active:scale-95 disabled:opacity-50"
                    }`}
                  >
                    {isForwarded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Sent</span>
                      </>
                    ) : (
                      <>
                        <Forward className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}

          {search.trim() && filteredUsers.length > 0 && (
            <div className="pt-3 space-y-1.5">
              <span className="text-[10px] font-mono-tech font-bold text-[var(--color-base-muted)] uppercase tracking-wider block px-1">
                Other Contacts
              </span>
              {filteredUsers.map((u) => {
                const isForwarded = forwardedIds.has(u._id);
                const isLoading = forwardingTargetId === u._id;

                return (
                  <div
                    key={u._id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-[var(--color-base-panel)] border border-[var(--color-base-border)] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <AvatarWithBadge
                        name={u.name || "U"}
                        src={u.avatar}
                        className="w-8 h-8 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[var(--color-base-text)] truncate">
                          {u.name}
                        </p>
                        <p className="text-[10px] text-[var(--color-base-muted)] truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>

                    <button
                      disabled={isLoading || isForwarded}
                      onClick={() => handleForwardToUser(u)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        isForwarded
                          ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                          : "aurora-bg hover:opacity-90 text-white active:scale-95 disabled:opacity-50"
                      }`}
                    >
                      {isForwarded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Sent</span>
                        </>
                      ) : (
                        <>
                          <Forward className="w-3.5 h-3.5" />
                          <span>Send</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;
