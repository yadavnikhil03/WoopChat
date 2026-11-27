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
      <div className="flex h-screen w-full bg-[var(--color-base-bg)] overflow-hidden text-[var(--color-base-text)] relative">
        <div className="fixed inset-0 pointer-events-none grain-overlay opacity-[0.025] z-50" />
        <AsideBar />
        {isProfile ? (
          <div className="flex-1 h-full min-w-0 flex flex-col bg-[var(--color-base-bg)] overflow-y-auto">
            <Outlet />
          </div>
        ) : (
          <>
            <div
              className={cn(
                "w-full lg:w-[390px] flex-shrink-0 border-r border-[var(--color-base-border)] bg-[var(--color-base-panel)]/70",
                chatId ? "hidden lg:flex lg:flex-col" : "flex flex-col"
              )}
            >
              <ChatList />
            </div>
            <div
              className={cn(
                "flex-1 h-full min-w-0 flex flex-col bg-[var(--color-base-bg)] relative",
                !chatId
                  ? "hidden lg:flex items-center justify-center bg-[var(--color-base-bg)]"
                  : "flex"
              )}
            >
              {!chatId && (
                <div className="font-mono-tech text-[11px] uppercase tracking-[0.2em] text-[var(--color-base-muted)]">
                  Select a thread to begin
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
