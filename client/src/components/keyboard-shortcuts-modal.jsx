import { useEffect } from "react";
import {
  Keyboard,
  X,
  MessageSquare,
  Search,
  Sparkles,
  CornerDownLeft,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SHORTCUT_GROUPS = [
  {
    category: "Messaging & Formatting",
    icon: MessageSquare,
    items: [
      {
        keys: ["Enter"],
        label: "Send message",
      },
      {
        keys: ["Shift", "Enter"],
        label: "Insert new line (in multi-line)",
      },
      {
        keys: ["Ctrl / ⌘", "B"],
        label: "Bold text (**bold**)",
      },
      {
        keys: ["Ctrl / ⌘", "I"],
        label: "Italic text (*italic*)",
      },
      {
        keys: ["Ctrl / ⌘", "E"],
        label: "Monospace code (`code`)",
      },
      {
        keys: ["Esc"],
        label: "Cancel reply, attachment, or emoji picker",
      },
    ],
  },
  {
    category: "In-Conversation Search",
    icon: Search,
    items: [
      {
        keys: ["Ctrl / ⌘", "F"],
        label: "Open & focus search in conversation",
      },
      {
        keys: ["Enter"],
        label: "Jump to next search match",
      },
      {
        keys: ["Shift", "Enter"],
        label: "Jump to previous search match",
      },
      {
        keys: ["Esc"],
        label: "Close search bar",
      },
    ],
  },
  {
    category: "Voice Notes & Audio",
    icon: Sparkles,
    items: [
      {
        keys: ["Space"],
        label: "Play / pause focused voice note",
      },
      {
        keys: ["Click 1x"],
        label: "Cycle speed: 1x → 1.5x → 2x",
      },
      {
        keys: ["Waveform"],
        label: "Click anywhere on audio waveform to seek",
      },
    ],
  },
  {
    category: "General & Navigation",
    icon: Command,
    items: [
      {
        keys: ["Ctrl / ⌘", "/"],
        label: "Open this keyboard shortcuts modal",
      },
      {
        keys: ["?"],
        label: "Open keyboard shortcuts (when not in text input)",
      },
      {
        keys: ["Esc"],
        label: "Close any modal or dialog",
      },
    ],
  },
];

const KeyboardShortcutsModal = ({ open, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.key === "?" && !["INPUT", "TEXTAREA"].includes(e.target.tagName)) ||
        ((e.ctrlKey || e.metaKey) && e.key === "/")
      ) {
        e.preventDefault();
        onClose(true); 
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        onClose(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={() => onClose(false)}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[var(--color-base-bg)] border border-[var(--color-base-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-base-border)] bg-[var(--color-base-panel)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--color-base-text)]">
                Keyboard Shortcuts
              </h3>
              <p className="text-xs text-[var(--color-base-muted)]">
                Navigate WhopChat faster with keyboard shortcuts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onClose(false)}
            className="p-1.5 rounded-lg text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {SHORTCUT_GROUPS.map((group, gIdx) => {
            const GroupIcon = group.icon;
            return (
              <div key={gIdx} className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <GroupIcon className="w-3.5 h-3.5" />
                  <span>{group.category}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {group.items.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--color-base-panel)] border border-[var(--color-base-border)] hover:border-emerald-500/25 transition-colors"
                    >
                      <span className="text-xs text-[var(--color-base-text)] pr-2">
                        {item.label}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.keys.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-2 py-0.5 rounded bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-[10.5px] font-mono font-semibold text-[var(--color-base-text)] shadow-xs"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-3 border-t border-[var(--color-base-border)] bg-[var(--color-base-panel)] flex items-center justify-between text-xs text-[var(--color-base-muted)]">
          <span className="flex items-center gap-1.5">
            Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-[10px] font-mono">?</kbd> anywhere outside inputs to open this modal
          </span>
          <button
            type="button"
            onClick={() => onClose(false)}
            className="px-4 py-1.5 rounded-lg bg-[var(--color-base-primary)] text-[var(--color-base-primary-fg)] font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;

