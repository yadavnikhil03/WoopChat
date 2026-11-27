import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Link, useNavigate } from "react-router-dom";
import { X, KeyRound, ShieldCheck, SunMoon } from "lucide-react";
import { useState } from "react";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import Logo from "@/components/logo";
import { toggleTheme } from "@/lib/theme";

const SignIn = () => {
  const navigate = useNavigate();
  const { login, isLoggingIn } = useAuth();
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingForgot, setIsSendingForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const formSchema = z.object({
    email: z.string().email("Invalid email").min(1, "Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values) => {
    await login(values);
    if (useAuth.getState().user) {
      navigate("/chat");
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setIsSendingForgot(true);
    try {
      const res = await API.post("/auth/forgot-password", { email: forgotEmail });
      toast.success(res.data.message || "Reset token generated!");
      if (res.data?.data?.resetToken) {
        setResetToken(res.data.data.resetToken);
      }
      setForgotStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process request");
    } finally {
      setIsSendingForgot(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken || !newPassword) return;
    setIsSendingForgot(true);
    try {
      const res = await API.post("/auth/reset-password", {
        token: resetToken,
        password: newPassword,
      });
      toast.success("Password reset successfully! Logging you in...");
      localStorage.setItem("accessToken", res.data.data.accessToken);
      useAuth.setState({
        user: res.data.data.user,
        isAuthenticated: true,
      });
      setShowForgot(false);
      setForgotStep(1);
      navigate("/chat");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setIsSendingForgot(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-base-bg)] text-[var(--color-base-text)] grid grid-cols-1 lg:grid-cols-12 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-[10%] w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-[130px] animate-aurora-drift" />
        <div className="absolute bottom-[-10%] right-[10%] w-[480px] h-[480px] rounded-full bg-cyan-500/15 blur-[130px] animate-aurora-drift [animation-delay:-5s]" />
      </div>
      <div className="fixed inset-0 pointer-events-none grain-overlay opacity-[0.025] z-50" />

      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-[var(--color-base-surface)] border border-[var(--color-base-border)] rounded-3xl shadow-2xl w-full max-w-md p-7 relative">
            <button
              onClick={() => setShowForgot(false)}
              className="absolute top-5 right-5 text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-10 h-10 rounded-full aurora-bg text-white flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-display font-bold text-[var(--color-base-text)]">
                  {forgotStep === 1 ? "Reset Password" : "Set New Password"}
                </h3>
                <p className="text-xs text-[var(--color-base-muted)] mt-0.5">
                  {forgotStep === 1
                    ? "Enter your email to generate a reset token"
                    : "Enter the token and your new password"}
                </p>
              </div>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <Input
                  required
                  type="email"
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="h-11 rounded-xl bg-[var(--color-base-bg)] border-[var(--color-base-border)]"
                />
                <Button
                  type="submit"
                  className="w-full h-11 rounded-full aurora-bg hover:opacity-90 text-white font-semibold text-xs cursor-pointer"
                  disabled={isSendingForgot}
                >
                  {isSendingForgot ? <Spinner className="w-4 h-4 mr-2" /> : null}
                  Generate Reset Token
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono-tech uppercase tracking-wider text-[var(--color-base-muted)] mb-1.5 block">
                    Reset Token
                  </label>
                  <Input
                    required
                    type="text"
                    placeholder="Paste reset token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="h-11 rounded-xl bg-[var(--color-base-bg)] font-mono-tech text-xs border-[var(--color-base-border)]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono-tech uppercase tracking-wider text-[var(--color-base-muted)] mb-1.5 block">
                    New Password
                  </label>
                  <Input
                    required
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 rounded-xl bg-[var(--color-base-bg)] border-[var(--color-base-border)]"
                    minLength={6}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-1/3 h-11 rounded-full"
                    onClick={() => setForgotStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 rounded-full aurora-bg hover:opacity-90 text-white font-semibold text-xs cursor-pointer"
                    disabled={isSendingForgot}
                  >
                    {isSendingForgot ? <Spinner className="w-4 h-4 mr-2" /> : null}
                    Save &amp; Sign In
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="hidden lg:flex lg:col-span-6 border-r border-[var(--color-base-border)] bg-[var(--color-base-panel)]/55 p-12 flex-col justify-between relative">
        <div className="flex items-center justify-between">
          <Logo />
          <span className="text-[11px] font-mono-tech uppercase tracking-[0.2em] text-[var(--color-base-muted)]">
            Portal / 01
          </span>
        </div>

        <div className="my-auto py-12">
          <p className="font-cursive text-6xl xl:text-7xl aurora-text leading-[0.8] mb-2">
            Welcome back
          </p>
          <h2 className="font-display font-extrabold tracking-[-0.04em] text-5xl xl:text-6xl leading-[0.95]">
            Open your
            <br />
            workspace.
          </h2>
          <p className="text-sm text-[var(--color-base-muted)] mt-6 max-w-md leading-relaxed">
            Pick up your threads, voice notes, polls, and calls right where you left off.
          </p>
        </div>

        <div className="pt-6 border-t border-[var(--color-base-border)] flex items-center justify-between text-[11px] font-mono-tech uppercase tracking-[0.18em] text-[var(--color-base-muted)]">
          <span>AES-256-GCM</span>
          <span>WebRTC P2P</span>
          <span>@whopai Co-Pilot</span>
        </div>
      </div>

      <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-12">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto flex items-center gap-3">
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
              <span>Authenticated Session</span>
            </div>
            <h1 className="text-3xl font-display font-extrabold tracking-tight">
              Sign In
            </h1>
            <p className="text-xs text-[var(--color-base-muted)] mt-1.5">
              Access your WhopChat conversations and voice rooms.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-mono-tech uppercase tracking-wider text-[var(--color-base-muted)]">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="name@example.com"
                        {...field}
                        className="h-11 rounded-xl bg-[var(--color-base-surface)] border-[var(--color-base-border)] text-sm focus:border-indigo-400 transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-[11px] font-mono-tech uppercase tracking-wider text-[var(--color-base-muted)]">
                        Password
                      </FormLabel>
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-[11px] font-mono-tech text-[var(--color-base-muted)] hover:text-indigo-400 transition-colors cursor-pointer"
                      >
                        Forgot?
                      </button>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        className="h-11 rounded-xl bg-[var(--color-base-surface)] border-[var(--color-base-border)] text-sm focus:border-indigo-400 transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 rounded-full aurora-bg hover:opacity-95 text-white font-semibold text-xs tracking-tight shadow-lg shadow-indigo-500/25 active:scale-95 transition-all mt-2 cursor-pointer"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Spinner className="w-4 h-4 mr-2" /> : null}
                Sign In to Workspace
              </Button>
            </form>
          </Form>

          <div className="flex items-center justify-between text-xs text-[var(--color-base-muted)] mt-6 pt-5 border-t border-[var(--color-base-border)]">
            <span>New to WhopChat?</span>
            <Link
              to="/sign-up"
              className="text-indigo-400 hover:underline font-semibold transition-colors"
            >
              Create free account
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

export default SignIn;
