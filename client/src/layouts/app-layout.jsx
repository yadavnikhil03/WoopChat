import AppWrapper from "@/components/app-wrapper";
import ChatList from "@/components/chat/chat-list";
import AsideBar from "@/components/aside-bar";
import CallModal from "@/components/chat/call-modal";
import useChatId from "@/hooks/use-chat-id";
import { cn } from "@/lib/utils";
import { Outlet, useLocation } from "react-router-dom";

const AppLayout = () => {
  const chatId = useChatId();
  const location = useLocation();
  const isProfile = location.pathname.startsWith("/profile");

  return (
    <AppWrapper>
      <CallModal />
      <div className="flex h-screen w-full bg-[var(--color-base-bg)] overflow-hidden text-[var(--color-base-text)]">
        <AsideBar />
        {isProfile ? (
          <div className="flex-1 h-full min-w-0 flex flex-col bg-[var(--color-base-bg)] overflow-y-auto">
            <Outlet />
          </div>
        ) : (
          <>
            <div
              className={cn(
                "w-full lg:w-[400px] flex-shrink-0 border-r border-[var(--color-base-border)] bg-[var(--color-base-panel)]",
                chatId ? "hidden lg:flex lg:flex-col" : "flex flex-col"
              )}
            >
              <ChatList />
            </div>
            <div
              className={cn(
                "flex-1 h-full min-w-0 flex flex-col bg-[var(--color-base-bg)] relative",
                !chatId
                  ? "hidden lg:flex items-center justify-center bg-[var(--color-base-panel)] border-l border-[var(--color-base-border)]"
                  : "flex"
              )}
            >
              {!chatId && (
                <div className="text-[var(--color-base-muted)] text-sm font-medium">
                  Select a chat to start messaging
                </div>
              )}
              <div className="relative z-10 flex flex-col h-full w-full">
                <Outlet />
              </div>
            </div>
          </>
        )}
      </div>
    </AppWrapper>
  );
};

export default AppLayout;
