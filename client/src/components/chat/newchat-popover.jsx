import { memo, useEffect, useState, useMemo } from "react";
import { useChat } from "@/hooks/use-chat";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { ArrowLeft, PenBoxIcon, Search, UsersIcon, Bot, X } from "lucide-react";
import { Spinner } from "../ui/spinner";
import AvatarWithBadge from "../avatar-with-badge";
import { Checkbox } from "../ui/checkbox";
import { useNavigate } from "react-router-dom";
import { isUserOnline } from "@/lib/helper";

export const NewChatPopover = memo(() => {
  const navigate = useNavigate();
  const { fetchAllUsers, users, isUsersLoading, createChat, isCreatingChat } =
    useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loadingUserId, setLoadingUserId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchAllUsers();
    }
  }, [isOpen, fetchAllUsers]);

  const toggleUserSelection = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id)
        ? prev.filter((userId) => userId !== id)
        : [...prev, id]
    );
  };

  const resetState = () => {
    setIsGroupMode(false);
    setGroupName("");
    setSearchQuery("");
    setSelectedUsers([]);
  };

  const handleBack = () => {
    resetState();
  };

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) resetState();
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users || [];
    const q = searchQuery.toLowerCase();
    return (users || []).filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers?.length === 0) return;
    const response = await createChat({
      isGroup: true,
      participants: selectedUsers,
      groupName: groupName.trim(),
    });
    setIsOpen(false);
    resetState();
    if (response?._id) {
      navigate(`/chat/${response._id}`);
    }
  };

  const handleCreateChat = async (userId) => {
    setLoadingUserId(userId);
    try {
      const response = await createChat({
        isGroup: false,
        participantId: userId,
      });
      setIsOpen(false);
      resetState();
      if (response?._id) {
        navigate(`/chat/${response._id}`);
      }
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          onClick={() => setIsOpen(true)}
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-[var(--color-base-hover)]"
          title="New conversation"
        >
          <PenBoxIcon className="!h-4.5 !w-4.5 !stroke-1.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-84 z-[999] p-0 rounded-2xl min-h-[420px] max-h-[80vh] flex flex-col bg-[var(--color-base-panel)] border border-[var(--color-base-border)] shadow-2xl overflow-hidden"
      >
        <div className="border-b border-[var(--color-base-border)] p-3 flex flex-col gap-2.5 bg-[var(--color-base-bg)] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isGroupMode && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-1 rounded-md text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <h3 className="text-base font-semibold text-[var(--color-base-text)]">
                {isGroupMode ? "New Group" : "New Chat"}
              </h3>
            </div>
            {isGroupMode && selectedUsers.length > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {selectedUsers.length} selected
              </span>
            )}
          </div>

          {isGroupMode && (
            <input
              autoFocus
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name (required)..."
              className="w-full h-9 px-3 rounded-xl bg-[var(--color-base-panel)] border border-[var(--color-base-border)] text-xs text-[var(--color-base-text)] placeholder:text-[var(--color-base-muted)] outline-none focus:border-emerald-500 transition-colors"
            />
          )}

          <div className="w-full flex items-center gap-2 px-3 h-8.5 rounded-xl bg-[var(--color-base-panel)] border border-[var(--color-base-border)]">
            <Search className="w-3.5 h-3.5 text-[var(--color-base-muted)] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isGroupMode ? "Search members to add..." : "Search name or email..."}
              className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--color-base-text)] placeholder:text-[var(--color-base-muted)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[var(--color-base-muted)] hover:text-[var(--color-base-text)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-1.5 py-1.5 space-y-1">
          {isUsersLoading ? (
            <div className="flex items-center justify-center p-8">
              <Spinner className="w-6 h-6 text-emerald-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-xs text-[var(--color-base-muted)]">
              {searchQuery ? `No contacts matching "${searchQuery}"` : "No contacts available"}
            </div>
          ) : !isGroupMode ? (
            <>
              {!searchQuery && (
                <>
                  <NewAIItem
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/chat/ai");
                    }}
                  />

                  <NewGroupItem
                    disabled={isCreatingChat}
                    onClick={() => setIsGroupMode(true)}
                  />
                </>
              )}

              {filteredUsers.map((user) => (
                <ChatUserItem
                  key={user._id}
                  user={user}
                  isLoading={loadingUserId === user._id}
                  disabled={loadingUserId !== null}
                  onClick={handleCreateChat}
                />
              ))}
            </>
          ) : (
            filteredUsers.map((user) => (
              <GroupUserItem
                key={user._id}
                user={user}
                isSelected={selectedUsers.includes(user._id)}
                onToggle={toggleUserSelection}
              />
            ))
          )}
        </div>

        {isGroupMode && (
          <div className="border-t border-[var(--color-base-border)] p-3 bg-[var(--color-base-bg)] shrink-0">
            <Button
              onClick={handleCreateGroup}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs h-9 rounded-xl transition-all shadow-sm"
              disabled={
                isCreatingChat ||
                !groupName.trim() ||
                selectedUsers.length === 0
              }
            >
              {isCreatingChat && <Spinner className="w-4 h-4 mr-2" />}
              Create Group {selectedUsers.length > 0 && `(${selectedUsers.length} members)`}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
});
NewChatPopover.displayName = "NewChatPopover";

const UserAvatar = memo(({ user }) => {
  const online = isUserOnline(user._id);
  return (
    <div className="flex items-center gap-2.5 min-w-0 flex-1">
      <AvatarWithBadge name={user.name} src={user.avatar ?? ""} isOnline={online} className="w-9 h-9 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <h5 className="text-[13.5px] font-medium text-[var(--color-base-text)] truncate">{user.name}</h5>
          {online && (
            <span className="text-[10px] text-emerald-400 font-medium shrink-0">online</span>
          )}
        </div>
        <p className="text-xs text-[var(--color-base-muted)] truncate">
          {user.status || user.email || "Hey there! I'm using WhopChat"}
        </p>
      </div>
    </div>
  );
});
UserAvatar.displayName = "UserAvatar";

const NewAIItem = memo(({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[var(--color-base-hover)] transition-colors text-left cursor-pointer"
  >
    <div className="bg-emerald-500/15 border border-emerald-500/30 p-2 rounded-full shrink-0">
      <Bot className="size-4 text-emerald-400" />
    </div>
    <div className="flex flex-col min-w-0">
      <span className="font-semibold text-xs text-[var(--color-base-text)]">Chat with WhopAI</span>
      <span className="text-[11px] text-[var(--color-base-muted)] truncate">Real-time intelligent AI assistant</span>
    </div>
  </button>
));
NewAIItem.displayName = "NewAIItem";

const NewGroupItem = memo(({ disabled, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[var(--color-base-hover)] transition-colors text-left disabled:opacity-50 cursor-pointer"
  >
    <div className="bg-[var(--color-base-hover)] border border-[var(--color-base-border)] p-2 rounded-full shrink-0">
      <UsersIcon className="size-4 text-[var(--color-base-text)]" />
    </div>
    <div className="flex flex-col min-w-0">
      <span className="font-semibold text-xs text-[var(--color-base-text)]">New Group</span>
      <span className="text-[11px] text-[var(--color-base-muted)] truncate">Create a group with multiple contacts</span>
    </div>
  </button>
));
NewGroupItem.displayName = "NewGroupItem";

const ChatUserItem = memo(({ user, isLoading, disabled, onClick }) => (
  <button
    type="button"
    className="relative w-full flex items-center gap-2 p-2 rounded-xl hover:bg-[var(--color-base-hover)] transition-colors text-left disabled:opacity-50 cursor-pointer"
    disabled={isLoading || disabled}
    onClick={() => onClick(user._id)}
  >
    <UserAvatar user={user} />
    {isLoading && <Spinner className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />}
  </button>
));
ChatUserItem.displayName = "ChatUserItem";

const GroupUserItem = memo(({ user, isSelected, onToggle }) => (
  <div
    role="button"
    onClick={() => onToggle(user._id)}
    className="w-full flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-[var(--color-base-hover)] transition-colors text-left cursor-pointer select-none"
  >
    <UserAvatar user={user} />
    <Checkbox checked={isSelected} onCheckedChange={() => onToggle(user._id)} className="mr-1" />
  </div>
));
GroupUserItem.displayName = "GroupUserItem";
export default NewChatPopover;
