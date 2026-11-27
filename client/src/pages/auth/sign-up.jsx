import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowRight, SunMoon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/logo";
import { toggleTheme } from "@/lib/theme";

const SignUp = () => {
  const navigate = useNavigate();
  const { register, isSigningUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;
    await register({ name, email, password });
    if (useAuth.getState().user) {
      navigate("/chat");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-base-bg)] text-[var(--color-base-text)] grid grid-cols-1 lg:grid-cols-12 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-[10%] w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-[130px] animate-aurora-drift" />
        <div className="absolute bottom-[-10%] right-[10%] w-[480px] h-[480px] rounded-full bg-cyan-500/15 blur-[130px] animate-aurora-drift [animation-delay:-5s]" />
      </div>
      <div className="fixed inset-0 pointer-events-none grain-overlay opacity-[0.025] z-50" />

      <div className="hidden lg:flex lg:col-span-6 border-r border-[var(--color-base-border)] bg-[var(--color-base-panel)]/55 p-12 flex-col justify-between relative">
        <div className="flex items-center justify-between">
          <Logo />
          <span className="text-[11px] font-mono-tech uppercase tracking-[0.2em] text-[var(--color-base-muted)]">
            Portal / 02
          </span>
        </div>

        <div className="my-auto py-12">
          <p className="font-cursive text-6xl xl:text-7xl aurora-text leading-[0.8] mb-2">
            Start fresh
          </p>
          <h2 className="font-display font-extrabold tracking-[-0.04em] text-5xl xl:text-6xl leading-[0.95]">
            Claim your
            <br />
            Studio.
          </h2>
          <p className="text-sm text-[var(--color-base-muted)] mt-6 max-w-md leading-relaxed">
            Create an identity in seconds and unlock encrypted rooms, live polls, ephemeral ink-burn messages, and @whopai co-pilot.
          </p>
        </div>

        <div className="pt-6 border-t border-[var(--color-base-border)] flex items-center justify-between text-[11px] font-mono-tech uppercase tracking-[0.18em] text-[var(--color-base-muted)]">
          <span>Zero Bloat</span>
          <span>Instant Rooms</span>
          <span>Full Control</span>
        </div>
      </div>

      <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-12">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className="w-9 h-9 rounded-full border border-[var(--color-base-border)] bg-[var(--color-base-surface)] flex items-center justify-center text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] transition-colors cursor-pointer"
            >
              <SunMoon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="w-full max-w-[420px] mx-auto my-auto py-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-[11px] font-mono-tech uppercase tracking-[0.18em] text-[var(--color-accent-cyan)] mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Private Account</span>
            </div>
            <h1 className="text-3xl font-display font-extrabold tracking-tight">
              Create Account
            </h1>
            <p className="text-xs text-[var(--color-base-muted)] mt-1.5">
              Join WhopChat for real-time team messaging.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono-tech uppercase tracking-wider text-[var(--color-base-muted)] block">
                Full Name
              </label>
              <Input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="h-11 rounded-xl bg-[var(--color-base-surface)] border-[var(--color-base-border)] text-sm focus:border-indigo-400 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono-tech uppercase tracking-wider text-[var(--color-base-muted)] block">
                Email Address
              </label>
              <Input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="h-11 rounded-xl bg-[var(--color-base-surface)] border-[var(--color-base-border)] text-sm focus:border-indigo-400 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono-tech uppercase tracking-wider text-[var(--color-base-muted)] block">
                Password
              </label>
              <Input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="h-11 rounded-xl bg-[var(--color-base-surface)] border-[var(--color-base-border)] text-sm focus:border-indigo-400 transition-colors"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 mt-2 rounded-full aurora-bg hover:opacity-95 text-white font-semibold text-xs tracking-tight shadow-lg shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer"
              disabled={isSigningUp}
            >
              {isSigningUp ? <Spinner className="w-4 h-4 mr-2" /> : null}
              Create Free Account
            </Button>
          </form>

          <div className="flex items-center justify-between text-xs text-[var(--color-base-muted)] mt-6 pt-5 border-t border-[var(--color-base-border)]">
            <span>Already have an account?</span>
            <Link
              to="/sign-in"
              className="text-indigo-400 hover:underline font-semibold transition-colors flex items-center gap-1"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="text-[10px] font-mono-tech uppercase tracking-[0.2em] text-[var(--color-base-muted)] text-center lg:text-left">
          WhopChat Studio • Real-Time Messaging
        </div>
      </div>
    </div>
  );
};

export default SignUp;
