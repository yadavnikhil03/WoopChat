import { getOtherUserAndGroup, formatChatTime } from "@/lib/helper";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import AvatarWithBadge from "../avatar-with-badge";
import { CheckCheck } from "lucide-react";
import { useSocket } from "@/hooks/use-socket";

const ChatListItem = ({
  chat,
  currentUserId,
  onClick,
  isTyping = false,
  typingUser = "",
}) => {
  const { pathname } = useLocation();
  const { onlineUsers } = useSocket();
  const { lastMessage, createdAt } = chat;
  const { name, avatar, isOnline, isGroup } = getOtherUserAndGroup(chat, currentUserId);
  const isActive = pathname.includes(chat._id);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors outline-none border-b border-[var(--color-base-border)]",
        isActive ? "bg-[var(--color-base-hover)]" : "hover:bg-[var(--color-base-hover)]/50"
      )}
    >
      <AvatarWithBadge name={name} src={avatar} isGroup={isGroup} isOnline={isOnline} className="w-10 h-10" />
      <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
        <div className="flex items-center justify-between mb-1">
          <h5 className="text-[14px] font-medium text-[var(--color-base-text)] truncate">{name}</h5>
          {isTyping ? (
            <span className="text-[11px] text-emerald-400 font-semibold shrink-0 animate-pulse">
              typing...
            </span>
          ) : (
            <span
              className={cn(
                "text-[11px] shrink-0",
                chat.unreadCount > 0 && !isActive
                  ? "text-emerald-400 font-semibold"
                  : "text-[var(--color-base-muted)]"
              )}
            >
              {formatChatTime(lastMessage?.updatedAt || createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          {isTyping ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block shrink-0" />
              <p className="text-[13px] text-emerald-400 font-medium truncate">
                {isGroup && typingUser && typingUser !== "Someone"
                  ? `${typingUser} is typing...`
                  : "typing..."}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-1 min-w-0">
              {lastMessage?.sender?._id === currentUserId &&
                !["👤", "🚫", "🚪", "🛡️", "✏️", "🎉", "ℹ️", "📹", "📞"].some((p) =>
                  lastMessage?.content?.startsWith(p)
                ) && (
                  <CheckCheck className="w-3.5 h-3.5 text-[var(--color-base-muted)] shrink-0" />
                )}
              <p
                className={cn(
                  "text-[13px] truncate",
                  chat.unreadCount > 0 && !isActive
                    ? "text-[var(--color-base-text)] font-medium"
                    : "text-[var(--color-base-muted)]"
                )}
              >
                {lastMessage?.content || (lastMessage?.image ? "📷 Photo" : "No messages yet")}
              </p>
            </div>
          )}

          {chat.unreadCount > 0 && !isActive && (
            <span className="min-w-4.5 h-4.5 px-1.5 rounded-full bg-emerald-500 text-black text-[10.5px] font-bold flex items-center justify-center shrink-0 shadow-sm animate-in zoom-in-50">
              {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
export default ChatListItem;
