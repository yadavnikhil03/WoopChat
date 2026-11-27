import { useEffect } from "react";
import {
  Keyboard,
  X,
  MessageSquare,
  Search,
  Sparkles,
  Command,
} from "lucide-react";

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
        className="w-full max-w-2xl bg-[var(--color-base-surface)] border border-[var(--color-base-border)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-base-border)] bg-[var(--color-base-panel)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full aurora-bg flex items-center justify-center text-white">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[var(--color-base-text)]">
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
            className="p-1.5 rounded-full text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {SHORTCUT_GROUPS.map((group, gIdx) => {
            const GroupIcon = group.icon;
            return (
              <div key={gIdx} className="space-y-3">
                <div className="flex items-center gap-2 text-[11px] font-mono-tech font-bold text-cyan-400 uppercase tracking-wider">
                  <GroupIcon className="w-3.5 h-3.5" />
                  <span>{group.category}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {group.items.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[var(--color-base-panel)] border border-[var(--color-base-border)] hover:border-indigo-400/40 transition-colors"
                    >
                      <span className="text-xs text-[var(--color-base-text)] pr-2">
                        {item.label}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.keys.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-2 py-0.5 rounded-md bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-[10px] font-mono-tech font-semibold text-[var(--color-base-text)]"
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

        <div className="px-6 py-3.5 border-t border-[var(--color-base-border)] bg-[var(--color-base-panel)] flex items-center justify-between text-xs text-[var(--color-base-muted)]">
          <span className="flex items-center gap-1.5">
            Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-[10px] font-mono-tech">?</kbd> anywhere outside inputs
          </span>
          <button
            type="button"
            onClick={() => onClose(false)}
            className="px-5 py-1.5 rounded-full aurora-bg text-white font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
