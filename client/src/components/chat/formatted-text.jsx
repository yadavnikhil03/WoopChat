import { memo } from "react";

export const FormattedText = memo(({ content = "", searchQuery = "" }) => {
  if (!content) return null;

  let cleanContent = content
    .replace(/\*{1,2}WhopAI\*{1,2}/gi, "WhopAI")
    .replace(/\*{1,2}whoop\s*ai\*{1,2}/gi, "WhopAI")
    .replace(/Hello!\s*👋\s*I'm\s*(?:\*\*)?WhopAI(?:\*\*)?,\s*your assistant inside WhopChat\.\s*/i, "Hello! 👋 ")
    .replace(/^Thank you for your question:\s*"[^"]*"\s*!\s*As WhopChat's integrated assistant[^\.]*\.\s*/i, "");

  const codeBlockRegex = /```([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(cleanContent)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        value: cleanContent.slice(lastIndex, match.index),
      });
    }
    parts.push({
      type: "codeblock",
      value: match[1]?.trim() || "",
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < cleanContent.length) {
    parts.push({
      type: "text",
      value: cleanContent.slice(lastIndex),
    });
  }

  return (
    <div className="space-y-1.5 leading-relaxed text-[13.5px]">
      {parts.map((part, pIdx) => {
        if (part.type === "codeblock") {
          return (
            <pre
              key={pIdx}
              className="my-2 p-3 rounded-md bg-neutral-900/90 border border-neutral-800 text-emerald-400 font-mono text-xs overflow-x-auto select-text"
            >
              <code>{part.value}</code>
            </pre>
          );
        }

        const lines = part.value.split("\n");

        return (
          <div key={pIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();

              if (!trimmed) {
                return <div key={lIdx} className="h-1.5" />;
              }

              const isBullet =
                trimmed.startsWith("•") ||
                trimmed.startsWith("- ") ||
                trimmed.startsWith("* ");

              const displayLine = isBullet
                ? trimmed.replace(/^[•\-\*]\s*/, "")
                : line;

              return (
                <div
                  key={lIdx}
                  className={isBullet ? "flex items-start gap-2 pl-2" : ""}
                >
                  {isBullet && (
                    <span className="text-emerald-500 font-bold shrink-0 text-xs mt-0.5">
                      •
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    {parseInlineStyles(displayLine, searchQuery)}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
});

FormattedText.displayName = "FormattedText";

function highlightMatch(text, query) {
  if (!query || !query.trim() || typeof text !== "string") return text;
  const q = query.trim();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  if (parts.length === 1) return text;

  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark
        key={i}
        className="bg-emerald-500/35 text-emerald-300 font-semibold px-0.5 rounded-xs"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function parseInlineStyles(text, searchQuery = "") {
  const inlineRegex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
  const segments = text.split(inlineRegex);

  return segments.map((seg, idx) => {
    if (!seg) return null;

    if (seg.startsWith("**") && seg.endsWith("**") && seg.length >= 4) {
      return (
        <strong
          key={idx}
          className="font-semibold text-[var(--color-base-text)]"
        >
          {highlightMatch(seg.slice(2, -2), searchQuery)}
        </strong>
      );
    }

    if (seg.startsWith("`") && seg.endsWith("`") && seg.length >= 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-[var(--color-base-hover)] border border-[var(--color-base-border)] text-emerald-400 font-mono text-xs"
        >
          {highlightMatch(seg.slice(1, -1), searchQuery)}
        </code>
      );
    }

    if (
      seg.startsWith("*") &&
      seg.endsWith("*") &&
      seg.length >= 2 &&
      !seg.startsWith("**")
    ) {
      return (
        <em key={idx} className="italic text-[var(--color-base-text)]">
          {highlightMatch(seg.slice(1, -1), searchQuery)}
        </em>
      );
    }

    return <span key={idx}>{highlightMatch(seg, searchQuery)}</span>;
  });
}
