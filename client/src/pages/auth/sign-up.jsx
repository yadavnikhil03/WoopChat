import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--color-base-bg)] p-4 relative overflow-hidden select-none">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-[420px] bg-[var(--color-base-panel)] border border-[var(--color-base-border)] rounded-3xl shadow-2xl p-8 backdrop-blur-xl transition-all">
        <div className="flex flex-col items-center mb-7 text-center">
          <Link
            to="/"
            className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-black mb-4 shadow-lg shadow-emerald-500/25 active:scale-95 transition-transform"
          >
            <MessageSquare className="w-6 h-6 fill-black stroke-black" />
          </Link>
          <h1 className="text-2xl font-extrabold text-[var(--color-base-text)] tracking-tight">
            Create Your Account
          </h1>
          <p className="text-xs text-[var(--color-base-muted)] mt-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Join WhopChat for real-time team messaging</span>
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--color-base-text)]">
              Full Name
            </label>
            <Input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="h-10 bg-[var(--color-base-bg)] border-[var(--color-base-border)] text-xs text-[var(--color-base-text)] focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--color-base-text)]">
              Email Address
            </label>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="h-10 bg-[var(--color-base-bg)] border-[var(--color-base-border)] text-xs text-[var(--color-base-text)] focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--color-base-text)]">
              Password
            </label>
            <Input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="h-10 bg-[var(--color-base-bg)] border-[var(--color-base-border)] text-xs text-[var(--color-base-text)] focus:border-emerald-500 transition-colors"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-10 mt-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs tracking-tight shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            disabled={isSigningUp}
          >
            {isSigningUp ? <Spinner className="w-4 h-4 mr-2" /> : null}
            Create Free Account
          </Button>
        </form>

        <div className="flex items-center justify-between text-xs text-[var(--color-base-muted)] mt-6 pt-2 border-t border-[var(--color-base-border)]">
          <span>Already have an account?</span>
          <Link
            to="/sign-in"
            className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors flex items-center gap-1"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
