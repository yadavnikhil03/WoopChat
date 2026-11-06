import ChatBody from "@/components/chat/chat-body";
import ChatFooter from "@/components/chat/chat-footer";
import ChatHeader from "@/components/chat/chat-header";
import PinnedBanner from "@/components/chat/pinned-banner";
import ForwardModal from "@/components/chat/forward-modal";
import AvatarWithBadge from "@/components/avatar-with-badge";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import useChatId from "@/hooks/use-chat-id";
import { useSocket } from "@/hooks/use-socket";
import { getOtherUserAndGroup } from "@/lib/helper";
import { Lock, Sparkles, Send } from "lucide-react";
import { useEffect, useState } from "react";

const SingleChat = () => {
  const chatId = useChatId();
  const { fetchSingleChat, isSingleChatLoading, singleChat } = useChat();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [replyTo, setReplyTo] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const currentUserId = user?._id || null;
  const chat = singleChat?.chat;
  const messages = singleChat?.messages || [];

  useEffect(() => {
    if (!chatId) return;
    setSearchQuery("");
    setIsSearchOpen(false);
    fetchSingleChat(chatId);
  }, [fetchSingleChat, chatId]);

  useEffect(() => {
    if (!chatId || !socket) return;
    socket.emit("chat:join", chatId);
    return () => {
      socket.emit("chat:leave", chatId);
    };
  }, [chatId, socket]);

  if (isSingleChatLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-base-bg)]">
        <Spinner className="w-11 h-11 text-[var(--color-base-text)]" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-base-bg)]">
        <p className="text-lg text-[var(--color-base-muted)]">Chat not found</p>
      </div>
    );
  }

  const matchingMessages = searchQuery.trim()
    ? messages.filter((m) =>
        m.content?.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : [];

  return (
    <div className="relative h-svh flex flex-col bg-[var(--color-base-bg)]">
      <ChatHeader
        chat={chat}
        currentUserId={currentUserId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        messages={matchingMessages}
      />

      <PinnedBanner chat={chat} />

      <div className="flex-1 overflow-y-auto bg-[var(--color-base-bg)]">
        {messages.length === 0 ? (
          chatId === "ai" ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto animate-in fade-in zoom-in-95">
              <div className="relative mb-4">
                <img
                  src="/whop-ai-logo.png"
                  alt="WhopAI"
                  className="w-16 h-16 rounded-2xl shadow-xl ring-2 ring-emerald-500/30"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[var(--color-base-bg)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-base-text)] mb-2">
                How can I help you today?
              </h3>
              <p className="text-sm text-[var(--color-base-muted)] mb-8 max-w-sm">
                WhopAI is your real-time assistant inside WhopChat. Ask questions, explore features, or choose a prompt below.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {[
                  {
                    title: "What is WhopChat?",
                    desc: "Explore architecture & tech stack",
                  },
                  {
                    title: "How does Socket.io work?",
                    desc: "Real-time communication & rooms",
                  },
                  {
                    title: "Explain JWT security",
                    desc: "Tokens, bcrypt & authentication",
                  },
                  {
                    title: "How do group chats work?",
                    desc: "Admins, members & permissions",
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => useChat.getState().sendAIMessage(item.title)}
                    className="p-3.5 text-left rounded-xl bg-[var(--color-base-panel)] hover:bg-[var(--color-base-hover)] border border-[var(--color-base-border)] transition-all group cursor-pointer shadow-sm hover:border-emerald-500/30"
                  >
                    <p className="text-xs font-semibold text-[var(--color-base-text)] group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-[var(--color-base-muted)] mt-0.5">
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            (() => {
              const otherInfo = getOtherUserAndGroup(chat, currentUserId);
              return (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto animate-in fade-in zoom-in-95 select-none">
                  <div className="mb-4">
                    <AvatarWithBadge
                      name={otherInfo.name}
                      src={otherInfo.avatar}
                      isGroup={otherInfo.isGroup}
                      className="w-20 h-20 shadow-xl border-2 border-[var(--color-base-border)] text-2xl font-bold"
                    />
                  </div>

                  <h3 className="text-lg font-bold text-[var(--color-base-text)]">
                    {otherInfo.name}
                  </h3>
                  <p className="text-xs text-[var(--color-base-muted)] mt-1 mb-3 max-w-xs leading-relaxed">
                    {otherInfo.isGroup
                      ? `Welcome to ${otherInfo.name}! Start the discussion by posting the first message.`
                      : `This is the very beginning of your direct conversation with ${otherInfo.name}.`}
                  </p>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium mb-6">
                    <Lock className="w-3 h-3 shrink-0" />
                    <span>End-to-end encrypted</span>
                  </div>

                  <div className="flex flex-col gap-2 w-full max-w-xs">
                    <span className="text-[11px] font-semibold text-[var(--color-base-muted)] flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" /> Quick Starters:
                    </span>
                    {[
                      "👋 Hey, how are you doing?",
                      "☕ Free for a quick sync?",
                      "🚀 Looking forward to collaborating!",
                    ].map((text, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          useChat.getState().sendMessage({
                            chatId,
                            content: text,
                          });
                        }}
                        className="w-full py-2 px-3.5 rounded-xl bg-[var(--color-base-panel)] hover:bg-[var(--color-base-hover)] border border-[var(--color-base-border)] hover:border-emerald-500/30 text-xs text-[var(--color-base-text)] flex items-center justify-between transition-all group cursor-pointer shadow-xs active:scale-98"
                      >
                        <span>{text}</span>
                        <Send className="w-3 h-3 text-[var(--color-base-muted)] group-hover:text-emerald-400 transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()
          )
        ) : (
          <ChatBody
            chatId={chatId}
            messages={messages}
            onReply={setReplyTo}
            onForward={setForwardingMessage}
            isGroup={chat?.isGroup}
            searchQuery={searchQuery}
          />
        )}
      </div>

      <ChatFooter
        chat={chat}
        replyTo={replyTo}
        chatId={chatId}
        currentUserId={currentUserId}
        onCancelReply={() => setReplyTo(null)}
      />

      <ForwardModal
        isOpen={Boolean(forwardingMessage)}
        message={forwardingMessage}
        currentUserId={currentUserId}
        onClose={() => setForwardingMessage(null)}
      />
    </div>
  );
};

export default SingleChat;
