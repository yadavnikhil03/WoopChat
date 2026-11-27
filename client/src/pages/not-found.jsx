import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/logo";

const NotFound = () => {
  return (
    <div className="min-h-screen w-full bg-[var(--color-base-bg)] text-[var(--color-base-text)] flex flex-col justify-between p-6 sm:p-10">
      <header>
        <Logo />
      </header>

      <main className="max-w-lg mx-auto text-center space-y-5 my-auto">
        <p className="font-cursive text-7xl aurora-text leading-[0.75]">404</p>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
          Page not found
        </h1>
        <p className="text-sm text-[var(--color-base-muted)] leading-relaxed">
          The route you tried to open doesn&apos;t exist or may have moved.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full aurora-bg text-white text-xs font-semibold hover:opacity-95 transition-opacity"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <Link
            to="/chat"
            className="inline-flex items-center px-6 py-3 rounded-full border border-[var(--color-base-border)] bg-[var(--color-base-surface)] text-xs font-medium hover:border-indigo-400 transition-colors"
          >
            Open Chats
          </Link>
        </div>
      </main>

      <footer className="text-[11px] font-mono-tech text-[var(--color-base-muted)] text-center">
        WhopChat
      </footer>
    </div>
  );
};

export default NotFound;
