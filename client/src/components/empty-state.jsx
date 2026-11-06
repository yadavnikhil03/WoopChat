import { MessageSquare } from "lucide-react";

const EmptyState = ({
  title = "No chat selected",
  description = "Pick a conversation from the list or start a new one",
}) => {
  return (
    <div className="w-full h-full flex-1 flex flex-col items-center justify-center bg-[var(--color-base-bg)] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:20px_20px] gap-6">
      <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-base-panel)] border border-[var(--color-base-border)] shadow-sm">
        <MessageSquare className="w-8 h-8 text-[var(--color-base-muted)]" strokeWidth={1.5} />
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-xl text-[var(--color-base-text)] tracking-tight">{title}</h3>
        <p className="text-sm text-[var(--color-base-muted)] max-w-[260px] leading-relaxed mx-auto">{description}</p>
      </div>
    </div>
  );
};

export default EmptyState;
