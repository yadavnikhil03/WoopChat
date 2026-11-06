import { useChat } from "@/hooks/use-chat";
import { useSocket } from "@/hooks/use-socket";
import { useEffect, useRef, useState, Fragment } from "react";
import ChatBodyMessage from "./chat-body-message";
import { ChevronDown } from "lucide-react";
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
  const { addNewMessage, updateSingleMessage, removeMessageFromChat } = useChat();
  const bottomRef = useRef(null);
  
  const [showScrollBadge, setShowScrollBadge] = useState(true);

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

    socket.on("message:new", handleNewMessage);
    socket.on("message:edited", handleEditedMessage);
    socket.on("message:deleted", handleDeletedMessage);
    socket.on("message:read", handleMessagesRead);
    socket.on("message:reaction", handleReaction);
    socket.on("chat:pinned", handlePinned);
    socket.on("chat:unpinned", handleUnpinned);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:edited", handleEditedMessage);
      socket.off("message:deleted", handleDeletedMessage);
      socket.off("message:read", handleMessagesRead);
      socket.off("message:reaction", handleReaction);
      socket.off("chat:pinned", handlePinned);
      socket.off("chat:unpinned", handleUnpinned);
    };
  }, [socket, chatId, addNewMessage, updateSingleMessage, removeMessageFromChat]);

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
    <div className="w-full h-full flex flex-col relative px-[5%] py-4">
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const showDivider = isDifferentDay(message.createdAt, prevMessage?.createdAt);

        return (
          <Fragment key={message._id}>
            {showDivider && (
              <div className="flex justify-center my-3 select-none animate-in fade-in">
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[var(--color-base-panel)] text-[var(--color-base-muted)] border border-[var(--color-base-border)] shadow-xs">
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
          className="fixed bottom-[80px] right-[40px] w-10 h-10 bg-[var(--color-wa-header)] rounded-full flex items-center justify-center text-[var(--color-wa-muted)] shadow-[0_2px_5px_rgba(0,0,0,0.5)] hover:text-[var(--color-wa-text)] transition-colors z-30 cursor-pointer"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default ChatBody;
