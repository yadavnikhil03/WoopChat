import { Search } from "lucide-react";
import { NewChatPopover } from "./newchat-popover";

const ChatListHeader = ({ onSearch }) => {
  return (
    <div className="flex flex-col border-b border-[var(--color-base-border)] bg-[var(--color-base-surface)]">
      <div className="px-5 py-3 flex items-center justify-between h-[64px]">
        <div className="flex items-baseline gap-2">
          <h1 className="font-display text-xl font-extrabold tracking-tight text-[var(--color-base-text)]">
            Inbox
          </h1>
          <span className="font-cursive text-3xl leading-none aurora-text">
            Studio
          </span>
        </div>
        <div className="flex gap-2">
          <NewChatPopover />
        </div>
      </div>
      <div className="px-5 pb-3.5">
        <div className="relative flex items-center bg-[var(--color-base-bg)] border border-[var(--color-base-border)] rounded-full px-3.5 h-9.5 focus-within:border-indigo-400 transition-colors">
          <Search className="w-3.5 h-3.5 text-[var(--color-base-muted)] shrink-0" />
          <input
            placeholder="Search conversations..."
            onChange={(e) => onSearch(e.target.value)}
            className="border-none bg-transparent w-full h-full focus:outline-none focus:ring-0 text-xs placeholder:text-[var(--color-base-muted)] text-[var(--color-base-text)] pl-2.5"
          />
        </div>
      </div>
    </div>
  );
};
export default ChatListHeader;
