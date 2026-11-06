import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, Smile, Heart, ThumbsUp, PartyPopper, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";

const EMOJI_CATEGORIES = [
  {
    id: "smileys",
    name: "Smileys",
    icon: Smile,
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "🥹", "☺️", "😊",
      "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋",
      "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏",
      "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺",
      "😢", "😭", "😮‍💨", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱",
      "😨", "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤭", "🫢", "🫡", "🤫", "🫠",
      "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱",
      "😴", "🤤", "😪", "😵", "😵‍💫", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕"
    ],
  },
  {
    id: "gestures",
    name: "Gestures",
    icon: ThumbsUp,
    emojis: [
      "👍", "👎", "👊", "✊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏",
      "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠",
      "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄", "🫦", "👶", "👧", "🧒",
      "👦", "👩", "🧑", "👨", "👱", "🧔", "🧓", "👴", "👵", "🙋", "💁", "🙆"
    ],
  },
  {
    id: "hearts",
    name: "Hearts",
    icon: Heart,
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹",
      "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️",
      "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "🆔", "⚛️", "🔥", "✨",
      "⭐", "🌟", "💫", "💥", "💯", "💢", "💨", "💤", "💬", "💭", "🗯️", "👁️‍🗨️"
    ],
  },
  {
    id: "fun",
    name: "Fun",
    icon: PartyPopper,
    emojis: [
      "🎉", "🎊", "🎈", "🎂", "🍰", "🧁", "🍾", "🥂", "🍻", "🍺", "🍹", "🍸",
      "🍷", "🎁", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🎫", "🎟️", "🎪", "🤹",
      "🎭", "🎨", "🎬", "🎤", "🎧", "🎼", "🎹", "🥁", "🎷", "🎺", "🎸", "🪕",
      "🎻", "🎲", "🎯", "🎳", "🎮", "🕹️", "🎰", "⚽", "🏀", "🏈", "⚾", "🎾"
    ],
  },
  {
    id: "tech",
    name: "Tech",
    icon: Laptop,
    emojis: [
      "💻", "🖥️", "🖨️", "⌨️", "🖱️", "💽", "💾", "💿", "📀", "📱", "📲", "☎️",
      "📞", "📟", "📠", "📺", "📻", "🎙️", "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳",
      "📡", "🔋", "🔌", "💡", "🔦", "🕯️", "🗑️", "💸", "💵", "💰", "💳", "💎",
      "⚖️", "🧰", "🔧", "🔨", "🛠️", "⚙️", "🧱", "⛓️", "🧲", "🛡️", "🔮", "🚀"
    ],
  },
];

export const EmojiPicker = ({ onSelect, onClose, className }) => {
  const [activeCategory, setActiveCategory] = useState("smileys");
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) {
      const cat = EMOJI_CATEGORIES.find((c) => c.id === activeCategory);
      return cat ? cat.emojis : [];
    }
    const all = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
    return Array.from(new Set(all));
  }, [activeCategory, search]);

  return (
    <div
      className={cn(
        "w-[320px] h-[340px] bg-[var(--color-base-panel)] border border-[var(--color-base-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md select-none",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-2.5 border-b border-[var(--color-base-border)] bg-[var(--color-base-bg)] flex items-center gap-2 shrink-0">
        <div className="flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[var(--color-base-panel)] border border-[var(--color-base-border)]">
          <Search className="w-3.5 h-3.5 text-[var(--color-base-muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emojis..."
            className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--color-base-text)] placeholder:text-[var(--color-base-muted)]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-[var(--color-base-muted)] hover:text-[var(--color-base-text)]"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {!search && (
          <div className="px-2 py-1 text-[11px] font-semibold text-[var(--color-base-muted)] uppercase tracking-wider">
            {EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.name}
          </div>
        )}
        <div className="grid grid-cols-7 gap-1 p-1">
          {filteredEmojis.map((emoji, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onSelect(emoji);
              }}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xl hover:bg-[var(--color-base-hover)] hover:scale-120 active:scale-95 transition-all cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {!search && (
        <div className="flex items-center justify-around px-2 py-1.5 border-t border-[var(--color-base-border)] bg-[var(--color-base-bg)] shrink-0">
          {EMOJI_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "p-2 rounded-xl transition-all cursor-pointer",
                  isActive
                    ? "text-emerald-400 bg-emerald-500/15"
                    : "text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)]"
                )}
                title={cat.name}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;

