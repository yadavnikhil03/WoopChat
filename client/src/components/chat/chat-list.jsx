import { useEffect, useState, useRef } from "react";
import { useChat } from "@/hooks/use-chat";
import { useSocket } from "@/hooks/use-socket";
import { Spinner } from "../ui/spinner";
import ChatListItem from "./chat-list-item";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import ChatListHeader from "./chat-list-header";
import AvatarWithBadge from "../avatar-with-badge";
import { cn } from "@/lib/utils";
import { playIncomingMessageSound, isChatMuted, showDesktopNotification } from "@/lib/sound";

const ChatList = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { fetchChats, chats, isChatsLoading } = useChat();
  const { socket } = useSocket();
  const { user } = useAuth();
  const currentUserId = user?._id || null;
  const [searchQuery, setSearchQuery] = useState("");
  const [typingMap, setTypingMap] = useState({});
  const typingTimeoutsRef = useRef({});

  const filteredChats =
    chats?.filter(
      (chat) =>
        chat.groupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.participants?.some(
          (p) =>
            p._id !== currentUserId &&
            p.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    ) || [];

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    const totalUnread = (chats || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) WhopChat`;
    } else {
      document.title = "WhopChat";
    }
  }, [chats]);

  useEffect(() => {
    if (!socket) return;
    const handleMessageNew = (msg) => {
      if (msg?.chatId) {
        useChat.getState().updateChatLastMessage(msg.chatId, msg);
        const currentChat = useChat.getState().singleChat;
        if (currentChat?.chat?._id === msg.chatId) {
          useChat.getState().addNewMessage(msg.chatId, msg);
        }

        const currentUid = useAuth.getState().user?._id;
        const senderId = msg?.sender?._id || msg?.sender;
        const isFromOther = senderId && currentUid && senderId.toString() !== currentUid.toString();

        if (isFromOther && !isChatMuted(msg.chatId)) {
          playIncomingMessageSound();
          showDesktopNotification(msg?.sender?.name || "New Message", {
            body: msg?.content || "Sent an attachment",
          });
        }
      }
    };
    const handleMessageEdited = (msg) => {
      if (msg?._id) {
        useChat.getState().updateSingleMessage(msg);
        useChat.getState().updateChatLastMessage(msg.chatId, msg);
      }
    };
    const handleMessageDeleted = (data) => {
      if (data?.messageId) {
        useChat.getState().removeMessageFromChat(data.messageId, data?.lastMessage);
      }
    };
    const handleChatUpdated = (data) => {
      if (data?.chat) {
        useChat.setState((state) => ({
          singleChat:
            state.singleChat?.chat?._id === data.chat._id
              ? { ...state.singleChat, chat: { ...state.singleChat.chat, ...data.chat } }
              : state.singleChat,
          chats: state.chats.map((c) =>
            c._id === data.chat._id ? { ...c, ...data.chat } : c
          ),
        }));
      }
      if (data?.chatId && data?.lastMessage) {
        useChat.getState().updateChatLastMessage(data.chatId, data.lastMessage);
      }
    };
    const handleChatDeleted = (data) => {
      if (data?.chatId) {
        useChat.setState((state) => ({
          chats: state.chats.filter((c) => c._id !== data.chatId),
          singleChat:
            state.singleChat?.chat?._id === data.chatId ? null : state.singleChat,
        }));
      }
    };

    const handleTypingStart = (data) => {
      if (!data?.chatId || data.userId === currentUserId) return;
      setTypingMap((prev) => ({
        ...prev,
        [data.chatId]: data.user?.name || "Someone",
      }));
      clearTimeout(typingTimeoutsRef.current[data.chatId]);
      typingTimeoutsRef.current[data.chatId] = setTimeout(() => {
        setTypingMap((prev) => {
          const next = { ...prev };
          delete next[data.chatId];
          return next;
        });
      }, 3000);
    };

    const handleTypingStop = (data) => {
      if (!data?.chatId || data.userId === currentUserId) return;
      clearTimeout(typingTimeoutsRef.current[data.chatId]);
      setTypingMap((prev) => {
        const next = { ...prev };
        delete next[data.chatId];
        return next;
      });
    };

    const handleChatNew = (newChat) => {
      if (newChat?._id) {
        useChat.getState().addNewChat(newChat);
      }
    };

    socket.on("message:new", handleMessageNew);
    socket.on("message:edited", handleMessageEdited);
    socket.on("message:deleted", handleMessageDeleted);
    socket.on("chat:new", handleChatNew);
    socket.on("chat:updated", handleChatUpdated);
    socket.on("chat:deleted", handleChatDeleted);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("user:updated", (data) => {
      if (data?.user) {
        useChat.getState().updateUserData(data.user);
      }
    });
    return () => {
      socket.off("message:new", handleMessageNew);
      socket.off("message:edited", handleMessageEdited);
      socket.off("message:deleted", handleMessageDeleted);
      socket.off("chat:new", handleChatNew);
      socket.off("chat:updated", handleChatUpdated);
      socket.off("chat:deleted", handleChatDeleted);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("user:updated");
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
    };
  }, [socket]);

  const isAIActive = pathname === "/chat/ai";

  return (
    <div className="flex flex-col h-full bg-[var(--color-base-panel)]">
      <ChatListHeader onSearch={setSearchQuery} />

      <div className="flex-1 overflow-y-auto">
        {(!searchQuery || "whopai assistant ai".includes(searchQuery.toLowerCase())) && (
          <button
            onClick={() => navigate("/chat/ai")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors outline-none border-b border-[var(--color-base-border)]",
              isAIActive
                ? "bg-[var(--color-base-hover)]"
                : "hover:bg-[var(--color-base-hover)]/50"
            )}
          >
            <AvatarWithBadge
              name="WhopAI"
              src="/whop-ai-logo.png"
              isOnline={true}
              className="w-10 h-10"
            />

            <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h5 className="text-[14px] font-medium text-[var(--color-base-text)] truncate">
                    WhopAI Assistant
                  </h5>
                  <span className="text-[9.5px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shrink-0">
                    AI
                  </span>
                </div>
                <span className="text-[11px] text-emerald-500 font-medium shrink-0">
                  Online
                </span>
              </div>
              <p className="text-[13px] text-[var(--color-base-muted)] truncate">
                Ask questions, stream answers, and code...
              </p>
            </div>
          </button>
        )}

        {isChatsLoading ? (
          <div className="flex justify-center p-6">
            <Spinner className="w-5 h-5 text-[var(--color-base-muted)]" />
          </div>
        ) : (
          filteredChats.map((chat) => (
            <ChatListItem
              key={chat._id}
              chat={chat}
              currentUserId={currentUserId}
              isTyping={Boolean(typingMap[chat._id])}
              typingUser={typingMap[chat._id]}
              onClick={() => navigate(`/chat/${chat._id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
};
export default ChatList;
