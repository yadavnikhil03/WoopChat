import groupImg from "@/assets/group-img.png";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "@/lib/utils";

const AvatarWithBadge = ({
  name,
  src,
  isOnline,
  isGroup = false,
  size,
  className,
}) => {
  const avatar = isGroup ? groupImg : src || "";
  const dimensionClass = size || className || "w-9 h-9";
  const isLarge =
    typeof dimensionClass === "string" &&
    (dimensionClass.includes("20") ||
      dimensionClass.includes("24") ||
      dimensionClass.includes("28") ||
      dimensionClass.includes("32"));

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 rounded-full",
        dimensionClass
      )}
    >
      <Avatar className="size-full rounded-full">
        <AvatarImage
          src={avatar}
          alt={name || "Avatar"}
          className="aspect-square size-full object-cover rounded-full"
        />
        <AvatarFallback
          className="bg-[var(--color-base-hover)] text-[var(--color-base-text)] font-semibold size-full flex items-center justify-center rounded-full"
        >
          {name?.charAt(0)?.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {isOnline && !isGroup && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 bg-emerald-500 border-[var(--color-base-bg)] ring-1 ring-black/20",
            isLarge ? "h-4 w-4 border-[2.5px]" : "h-2.5 w-2.5"
          )}
        />
      )}
    </div>
  );
};

export default AvatarWithBadge;
