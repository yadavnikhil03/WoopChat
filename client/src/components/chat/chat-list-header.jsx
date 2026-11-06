import { Search } from "lucide-react";
import { NewChatPopover } from "./newchat-popover";

const ChatListHeader = ({ onSearch }) => {
  return (
    <div className="flex flex-col border-b border-[var(--color-base-border)] bg-[var(--color-base-bg)]">
      <div className="px-4 py-3 flex items-center justify-between h-[60px]">
        <h1 className="text-lg font-semibold text-[var(--color-base-text)]">Chats</h1>
        <div className="flex gap-2">
          <NewChatPopover />
        </div>
      </div>
      <div className="px-4 pb-3">
        <div className="relative flex items-center bg-[var(--color-base-panel)] border border-[var(--color-base-border)] rounded-md px-3 h-9">
          <Search className="w-4 h-4 text-[var(--color-base-muted)] shrink-0" />
          <input
            placeholder="Search chats..."
            onChange={(e) => onSearch(e.target.value)}
            className="border-none bg-transparent w-full h-full focus:outline-none focus:ring-0 text-[13px] placeholder:text-[var(--color-base-muted)] text-[var(--color-base-text)] pl-2"
          />
        </div>
      </div>
    </div>
  );
};
export default ChatListHeader;
