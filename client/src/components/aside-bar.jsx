import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import SettingsPanel from "./settings-panel";
import KeyboardShortcutsModal from "./keyboard-shortcuts-modal";
import {
  MessageSquare,
  Settings,
  LogOut,
  SunMoon,
  Keyboard,
} from "lucide-react";
import AvatarWithBadge from "./avatar-with-badge";
import { toggleTheme } from "@/lib/theme";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const AsideBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const isChat = location.pathname.startsWith("/chat");
  const isProfile = location.pathname.startsWith("/profile");

  const toggleProfile = () => {
    if (isProfile) {
      navigate("/chat");
    } else {
      navigate("/profile");
    }
  };

  return (
    <>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={setShortcutsOpen} />
      <aside className="w-[66px] h-full flex-shrink-0 border-r border-[var(--color-base-border)] bg-[var(--color-base-surface)] flex flex-col items-center py-4">
        <div className="flex flex-col gap-3 items-center">
          <Link
            to="/"
            title="WhopChat Home"
            className="w-10 h-10 rounded-full aurora-bg p-[1.5px] flex items-center justify-center shadow-md shadow-indigo-500/20 hover:scale-105 transition-transform"
          >
            <span className="w-full h-full rounded-full bg-[var(--color-base-bg)] flex items-center justify-center">
              <span className="font-cursive text-2xl leading-none aurora-text translate-y-0.5">
                W
              </span>
            </span>
          </Link>

          <button
            onClick={() => navigate("/chat")}
            title="All Chats"
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer",
              isChat
                ? "aurora-bg text-white shadow-md shadow-indigo-500/25"
                : "text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)]"
            )}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-auto flex flex-col gap-3 items-center">
          <button
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors",
              shortcutsOpen
                ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/40"
                : "text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)]"
            )}
            onClick={() => setShortcutsOpen((prev) => !prev)}
            title="Keyboard Shortcuts (? or Ctrl+/)"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <button
            className="w-10 h-10 rounded-full text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] flex items-center justify-center cursor-pointer transition-colors"
            onClick={toggleTheme}
            title="Toggle Light / Dark Mode"
          >
            <SunMoon className="w-4 h-4" />
          </button>

          <button
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors",
              settingsOpen
                ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/40"
                : "text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)]"
            )}
            onClick={() => setSettingsOpen((prev) => !prev)}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            className="w-10 h-10 rounded-full text-red-400 hover:bg-red-500/10 flex items-center justify-center cursor-pointer transition-colors"
            onClick={logout}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleProfile}
            title={isProfile ? "Close Profile" : "Open Profile"}
            className={cn(
              "relative rounded-full transition-all duration-200 cursor-pointer mt-1 group focus:outline-none",
              isProfile && "ring-2 ring-indigo-400 ring-offset-2 ring-offset-[var(--color-base-surface)] scale-105"
            )}
          >
            <AvatarWithBadge
              name={user?.name || "U"}
              src={user?.avatar || ""}
              isOnline={true}
              className="w-9 h-9 group-hover:opacity-90 transition-opacity"
            />
          </button>
        </div>
      </aside>
    </>
  );
};
export default AsideBar;
