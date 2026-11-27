import { MessageSquare } from "lucide-react";

const EmptyState = ({
  title = "Select a conversation",
  description = "Pick a thread from the sidebar or start a new room to begin messaging.",
}) => {
  return (
    <div className="w-full h-full flex-1 flex flex-col items-center justify-center bg-[var(--color-base-bg)] px-6 gap-5 select-none relative overflow-hidden">
      <div className="w-72 h-72 rounded-full bg-indigo-500/10 blur-[100px] absolute pointer-events-none animate-aurora-drift" />
      <div className="w-16 h-16 rounded-full aurora-bg p-[1.5px] shadow-lg shadow-indigo-500/20 relative">
        <div className="w-full h-full rounded-full bg-[var(--color-base-surface)] flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-indigo-400" strokeWidth={1.6} />
        </div>
      </div>
      <div className="text-center space-y-2 max-w-sm relative">
        <p className="font-cursive text-5xl aurora-text leading-[0.8]">
          WhopChat
        </p>
        <h3 className="font-display font-bold text-2xl text-[var(--color-base-text)] tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-[var(--color-base-muted)] leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
