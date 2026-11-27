import { useChat } from "@/hooks/use-chat";
import { Pin, X } from "lucide-react";
import { toast } from "sonner";

const PinnedBanner = ({ chat }) => {
  const { unpinMessage } = useChat();
  const pinned = chat?.pinnedMessage;

  if (!pinned || typeof pinned !== "object" || !pinned._id) {
    return null;
  }

  const handleJumpToMessage = () => {
    const el =
      document.getElementById(`message-${pinned._id}`) ||
      document.getElementById(`msg-${pinned._id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-cyan-400", "bg-indigo-500/10");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-cyan-400", "bg-indigo-500/10");
      }, 1800);
    } else {
      toast.info("Pinned message is further up in history");
    }
  };

  const handleUnpin = async (e) => {
    e.stopPropagation();
    try {
      await unpinMessage(chat._id);
      toast.success("Message unpinned");
    } catch {
      toast.error("Failed to unpin message");
    }
  };

  const renderSnippet = () => {
    if (pinned.audio) {
      return "🎙️ Voice message";
    }
    if (pinned.content) {
      return pinned.content;
    }
    if (pinned.image) {
      return "📷 Photo attachment";
    }
    return "Pinned message";
  };

  return (
    <div
      onClick={handleJumpToMessage}
      className="w-full px-5 py-2.5 bg-[var(--color-base-panel)]/95 border-b border-[var(--color-base-border)] backdrop-blur-md flex items-center justify-between gap-3 cursor-pointer hover:bg-[var(--color-base-hover)] transition-colors z-20 select-none animate-in slide-in-from-top-2"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-7 h-7 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
          <Pin className="w-3.5 h-3.5 rotate-45" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono-tech font-semibold text-cyan-400 uppercase tracking-wider">
              Pinned
            </span>
            {pinned.sender?.name && (
              <span className="text-[11px] text-[var(--color-base-muted)] truncate">
                • {pinned.sender.name}
              </span>
            )}
          </div>
          <span className="text-xs text-[var(--color-base-text)] truncate font-normal">
            {renderSnippet()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={handleUnpin}
          className="p-1.5 rounded-full text-[var(--color-base-muted)] hover:text-red-400 hover:bg-[var(--color-base-bg)] transition-colors cursor-pointer"
          title="Unpin message"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default PinnedBanner;
