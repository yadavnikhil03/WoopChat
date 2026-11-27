import { useChat } from "@/hooks/use-chat";
import { useSocket } from "@/hooks/use-socket";
import { useEffect, useRef, useState, Fragment } from "react";
import ChatBodyMessage from "./chat-body-message";
import { ChevronDown, Radio } from "lucide-react";
import { formatDateDivider, isDifferentDay } from "@/lib/helper";

const ChatBody = ({
  chatId,
  messages,
  onReply,
  onForward,
  isGroup = false,
  searchQuery = "",
}) => {
  const { socket } = useSocket();
  const { addNewMessage, updateSingleMessage, removeMessageFromChat, updatePoll } = useChat();
  const bottomRef = useRef(null);

  const [showScrollBadge, setShowScrollBadge] = useState(true);
  const [walkieBanner, setWalkieBanner] = useState(null);

  useEffect(() => {
    if (!chatId || !socket) return;

    const handleNewMessage = (msg) => {
      if (msg?.chatId === chatId) addNewMessage(chatId, msg);
    };
    const handleEditedMessage = (msg) => updateSingleMessage(msg);
    const handleDeletedMessage = (data) => removeMessageFromChat(data.messageId, data?.lastMessage);
    const handleMessagesRead = (data) => {
      if (data?.chatId === chatId) {
        useChat.getState().markChatMessagesAsRead(chatId, data.userId);
      }
    };
    const handleReaction = (data) => {
      if (data?.messageId && data?.reactions) {
        useChat.getState().updateMessageReactions(data.messageId, data.reactions);
      }
    };
    const handlePinned = (data) => {
      if (data?.chatId === chatId && data?.pinnedMessage) {
        useChat.getState().setPinnedMessage(chatId, data.pinnedMessage);
      }
    };
    const handleUnpinned = (data) => {
      if (data?.chatId === chatId) {
        useChat.getState().clearPinnedMessage(chatId);
      }
    };
    const handlePollUpdated = (data) => {
      if (data?.chatId === chatId && data?.messageId && data?.poll) {
        updatePoll(data.messageId, data.poll);
      }
    };
    const handleWalkieAudio = (data) => {
      if (data?.chatId !== chatId || !data?.audioDataUrl) return;
      setWalkieBanner({ senderName: data.senderName || "Teammate" });
      try {
        const audio = new Audio(data.audioDataUrl);
        audio.play().catch(() => {});
      } catch (err) {
        void err;
      }
      setTimeout(() => setWalkieBanner(null), 3200);
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:edited", handleEditedMessage);
    socket.on("message:deleted", handleDeletedMessage);
    socket.on("message:read", handleMessagesRead);
    socket.on("message:reaction", handleReaction);
    socket.on("chat:pinned", handlePinned);
    socket.on("chat:unpinned", handleUnpinned);
    socket.on("poll:updated", handlePollUpdated);
    socket.on("studio:walkie-audio", handleWalkieAudio);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:edited", handleEditedMessage);
      socket.off("message:deleted", handleDeletedMessage);
      socket.off("message:read", handleMessagesRead);
      socket.off("message:reaction", handleReaction);
      socket.off("chat:pinned", handlePinned);
      socket.off("chat:unpinned", handleUnpinned);
      socket.off("poll:updated", handlePollUpdated);
      socket.off("studio:walkie-audio", handleWalkieAudio);
    };
  }, [socket, chatId, addNewMessage, updateSingleMessage, removeMessageFromChat, updatePoll]);

  useEffect(() => {
    if (!messages.length) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

    const timeout = setTimeout(() => setShowScrollBadge(false), 500);
    return () => clearTimeout(timeout);
  }, [messages, chatId]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBadge(false);
  };

  return (
    <div className="w-full h-full flex flex-col relative px-[5%] py-5">
      {walkieBanner && (
        <div className="sticky top-2 z-30 self-center mb-3 px-4 py-2 rounded-full aurora-bg text-white text-xs font-semibold flex items-center gap-2 shadow-xl animate-in fade-in slide-in-from-top-2">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Walkie-Talkie live from {walkieBanner.senderName}</span>
        </div>
      )}

      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const showDivider = isDifferentDay(message.createdAt, prevMessage?.createdAt);

        return (
          <Fragment key={message._id}>
            {showDivider && (
              <div className="flex justify-center my-4 select-none animate-in fade-in">
                <span className="px-3.5 py-1 rounded-full text-[10px] font-mono-tech uppercase tracking-widest bg-[var(--color-base-panel)] text-[var(--color-base-muted)] border border-[var(--color-base-border)]">
                  {formatDateDivider(message.createdAt)}
                </span>
              </div>
            )}
            <div id={`msg-${message._id}`} className="transition-all duration-300">
              <ChatBodyMessage
                message={message}
                onReply={onReply}
                onForward={onForward}
                isGroup={isGroup}
                searchQuery={searchQuery}
              />
            </div>
          </Fragment>
        );
      })}
      <div ref={bottomRef} className="h-4" />

      {showScrollBadge && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-[90px] right-[32px] w-10 h-10 bg-[var(--color-base-surface)] border border-[var(--color-base-border)] rounded-full flex items-center justify-center text-[var(--color-base-muted)] shadow-lg hover:text-indigo-400 hover:border-indigo-400 transition-colors z-30 cursor-pointer"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default ChatBody;
