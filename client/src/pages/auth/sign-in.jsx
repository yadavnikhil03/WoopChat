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
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  MessageSquare,
  PlayCircle,
  X,
  KeyRound,
  Sparkles,
  Lock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";

const SignIn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

  useEffect(() => {
    if (searchParams.get("demo") === "true") {
      form.setValue("email", "test@test.com");
      form.setValue("password", "test123");
    }
  }, [searchParams, form]);

  const fillDemoCredentials = () => {
    form.setValue("email", "test@test.com");
    form.setValue("password", "test123");
    toast.success("Demo credentials loaded! Click Sign In to enter.");
  };

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
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--color-base-bg)] p-4 relative overflow-hidden select-none">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-[var(--color-base-panel)] border border-[var(--color-base-border)] rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowForgot(false)}
              className="absolute top-4 right-4 text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-base-text)]">
                  {forgotStep === 1 ? "Reset Password" : "Set New Password"}
                </h3>
                <p className="text-xs text-[var(--color-base-muted)] mt-0.5">
                  {forgotStep === 1
                    ? "Enter your email to receive a password reset token"
                    : "Enter the reset token and your new password"}
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
                  className="h-10 bg-[var(--color-base-bg)] border-[var(--color-base-border)]"
                />
                <Button
                  type="submit"
                  className="w-full h-10 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs"
                  disabled={isSendingForgot}
                >
                  {isSendingForgot ? <Spinner className="w-4 h-4 mr-2" /> : null}
                  Generate Reset Token
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="text-xs text-[var(--color-base-muted)] mb-1 block">
                    Reset Token
                  </label>
                  <Input
                    required
                    type="text"
                    placeholder="Paste reset token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="h-10 bg-[var(--color-base-bg)] font-mono text-xs border-[var(--color-base-border)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-base-muted)] mb-1 block">
                    New Password
                  </label>
                  <Input
                    required
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-10 bg-[var(--color-base-bg)] border-[var(--color-base-border)]"
                    minLength={6}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-1/3 h-10"
                    onClick={() => setForgotStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs"
                    disabled={isSendingForgot}
                  >
                    {isSendingForgot ? <Spinner className="w-4 h-4 mr-2" /> : null}
                    Save & Sign In
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="w-full max-w-[420px] bg-[var(--color-base-panel)] border border-[var(--color-base-border)] rounded-3xl shadow-2xl p-8 backdrop-blur-xl">
        <div className="flex flex-col items-center mb-7 text-center">
          <Link
            to="/"
            className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-black mb-4 shadow-lg shadow-emerald-500/25 active:scale-95 transition-transform"
          >
            <MessageSquare className="w-6 h-6 fill-black stroke-black" />
          </Link>
          <h1 className="text-2xl font-extrabold text-[var(--color-base-text)] tracking-tight">
            Sign In to WhopChat
          </h1>
          <p className="text-xs text-[var(--color-base-muted)] mt-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted WebRTC & WebSocket Communication</span>
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-[var(--color-base-text)]">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="name@example.com"
                      {...field}
                      className="h-10 bg-[var(--color-base-bg)] border-[var(--color-base-border)] text-xs text-[var(--color-base-text)] focus:border-emerald-500 transition-colors"
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
                    <FormLabel className="text-xs font-semibold text-[var(--color-base-text)]">
                      Password
                    </FormLabel>
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-[11px] text-[var(--color-base-muted)] hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      Forgot?
                    </button>
                  </div>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      className="h-10 bg-[var(--color-base-bg)] border-[var(--color-base-border)] text-xs text-[var(--color-base-text)] focus:border-emerald-500 transition-colors"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-10 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs tracking-tight shadow-md shadow-emerald-500/20 active:scale-95 transition-all mt-2 cursor-pointer"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? <Spinner className="w-4 h-4 mr-2" /> : null}
              Sign In to Workspace
            </Button>
          </form>
        </Form>

        <div className="mt-6 pt-5 border-t border-[var(--color-base-border)]">
          <button
            type="button"
            onClick={fillDemoCredentials}
            className="w-full p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 text-left transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                1-Click Demo Evaluator
              </span>
              <span className="text-[10px] text-emerald-400/80 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Auto Fill <ArrowRight className="w-3 h-3" />
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--color-base-text)] mt-1 font-mono">
              <span>test@test.com</span>
              <span className="text-[var(--color-base-muted)]">test123</span>
            </div>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--color-base-muted)] mt-6 pt-2">
          <span>Don't have an account?</span>
          <Link
            to="/sign-up"
            className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
          >
            Create free account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
