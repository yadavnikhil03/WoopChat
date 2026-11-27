import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const Logo = ({
  url = "/",
  showText = true,
  imgClass = "w-9 h-9",
  textClass,
}) => (
  <Link to={url} className="inline-flex items-center gap-2.5 w-fit group">
    <span
      className={cn(
        "rounded-full aurora-bg p-[1.5px] shadow-md shadow-indigo-500/20 flex items-center justify-center transition-transform duration-500 group-hover:rotate-12 group-hover:scale-105",
        imgClass
      )}
    >
      <span className="w-full h-full rounded-full bg-[var(--color-base-bg)] flex items-center justify-center">
        <span className="font-cursive text-2xl leading-none aurora-text translate-y-0.5">
          W
        </span>
      </span>
    </span>
    {showText && (
      <span className={cn("flex items-baseline gap-1", textClass)}>
        <span className="font-display font-bold tracking-tight text-lg leading-none text-[var(--color-base-text)]">
          Whop
        </span>
        <span className="font-cursive text-3xl leading-none aurora-text">
          Chat
        </span>
      </span>
    )}
  </Link>
);

export default Logo;
