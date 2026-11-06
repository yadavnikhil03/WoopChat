import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { useSocket } from "@/hooks/use-socket";

export const isUserOnline = (userId) => {
  if (!userId) return false;
  const uid = userId.toString();
  const { onlineUsers } = useSocket.getState();
  return (onlineUsers || []).some(
    (id) => (id?._id ? id._id.toString() : id?.toString()) === uid
  );
};

export const formatLastSeen = (date) => {
  if (!date) return "offline";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "offline";

  const timeStr = format(d, "h:mm a");
  if (isToday(d)) {
    return `last seen today at ${timeStr}`;
  }
  if (isYesterday(d)) {
    return `last seen yesterday at ${timeStr}`;
  }
  if (isThisWeek(d)) {
    return `last seen ${format(d, "EEE")} at ${timeStr}`;
  }
  return `last seen ${format(d, "MMM d")} at ${timeStr}`;
};

export const getOtherUserAndGroup = (chat, currentUserId) => {
  const isGroup = chat?.isGroup;

  if (isGroup) {
    return {
      name: chat.groupName || "Unnamed Group",
      subheading: `${chat.participants?.length || 0} members`,
      avatar: chat.groupAvatar || "",
      isGroup,
    };
  }

  const other = chat?.participants?.find((p) => {
    const pid = p?._id ? p._id.toString() : p?.toString();
    const cid = currentUserId ? currentUserId.toString() : null;
    return pid !== cid;
  });

  const isAI = other?.isAI || chat?._id === "ai";
  const otherId = other?._id ? other._id.toString() : "";
  const isOnline = isAI ? true : isUserOnline(otherId);

  const { lastSeenMap } = useSocket.getState();
  const effectiveLastSeen = (otherId && lastSeenMap?.[otherId]) || other?.lastSeen;

  let subheading = "offline";
  if (isAI) {
    subheading = "Active Assistant";
  } else if (isOnline) {
    subheading = "online";
  } else if (effectiveLastSeen) {
    subheading = formatLastSeen(effectiveLastSeen);
  }

  return {
    name: isAI ? "WhopAI Assistant" : other?.name || "Unknown",
    subheading,
    avatar: isAI ? "/whop-ai-logo.png" : other?.avatar || "",
    isGroup: false,
    isOnline,
    isAI,
    lastSeen: effectiveLastSeen,
    otherUser: other,
  };
};

export const formatChatTime = (date) => {
  if (!date) return "";
  const newDate = new Date(date);
  if (isNaN(newDate.getTime())) return "";

  if (isToday(newDate)) return format(newDate, "h:mm a");
  if (isYesterday(newDate)) return "Yesterday";
  if (isThisWeek(newDate)) return format(newDate, "EEEE");
  return format(newDate, "M/d");
};

export const formatMessageTime = (date) => {
  if (!date) return format(new Date(), "h:mm a");
  const d = new Date(date);
  if (isNaN(d.getTime())) return format(new Date(), "h:mm a");

  const timeStr = format(d, "h:mm a");
  if (isToday(d)) {
    return timeStr;
  }
  if (isYesterday(d)) {
    return `Yesterday, ${timeStr}`;
  }
  if (isThisWeek(d)) {
    return `${format(d, "EEE")}, ${timeStr}`;
  }
  return `${format(d, "MMM d")}, ${timeStr}`;
};

export const formatFullDateTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return format(d, "EEEE, MMMM d, yyyy 'at' h:mm:ss a");
};

export const formatDateDivider = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  if (isThisWeek(d)) return format(d, "EEEE, MMMM d");
  return format(d, "MMMM d, yyyy");
};

export const isDifferentDay = (date1, date2) => {
  if (!date1 || !date2) return true;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return true;
  return (
    d1.getFullYear() !== d2.getFullYear() ||
    d1.getMonth() !== d2.getMonth() ||
    d1.getDate() !== d2.getDate()
  );
};

export function generateUUID() {
  return uuidv4();
}
