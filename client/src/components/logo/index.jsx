import { Link } from "react-router-dom";
import logoSvg from "@/assets/whop-logo.svg";
import { cn } from "@/lib/utils";

const Logo = ({
  url = "/",
  showText = true,
  imgClass = "size-[30px]",
  textClass,
}) => (
  <Link to={url} className="flex items-center gap-2 w-fit">
    <img src={logoSvg} alt="WhopChat" className={imgClass} />
    {showText && (
      <span className={cn("font-semibold text-lg leading-tight", textClass)}>
        WhopChat.
      </span>
    )}
  </Link>
);

export default Logo;
