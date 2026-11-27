import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { API } from "@/lib/axios-client";
import { toggleTheme } from "@/lib/theme";
import { toast } from "sonner";
import { format } from "date-fns";
import AvatarWithBadge from "@/components/avatar-with-badge";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  Camera,
  Upload,
  RefreshCw,
  Check,
  Copy,
  Lock,
  Shield,
  ShieldCheck,
  User,
  Sun,
  Moon,
  LogOut,
  Keyboard,
  CircleDot,
  Code2,
  Coffee,
  Zap,
  Headphones,
  Search,
} from "lucide-react";
import KeyboardShortcutsModal from "@/components/keyboard-shortcuts-modal";

const STATUS_OPTIONS = [
  { icon: Zap, label: "Available" },
  { icon: Code2, label: "Deep Work" },
  { icon: Coffee, label: "Stepped Away" },
  { icon: Headphones, label: "Listening" },
  { icon: Moon, label: "Out of Office" },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [status, setStatus] = useState(user?.status || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(false);
  const [blockedSearch, setBlockedSearch] = useState("");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setStatus(user.status || "");
      setBio(user.bio || "");
      setAvatar(user.avatar || "");
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "blocked") {
      fetchBlockedUsers();
    }
  }, [activeTab]);

  const fetchBlockedUsers = async () => {
    setIsLoadingBlocked(true);
    try {
      const res = await API.get("/users/blocked");
      setBlockedUsers(res.data.data.users || []);
    } catch {
      setBlockedUsers([]);
    } finally {
      setIsLoadingBlocked(false);
    }
  };

  const handleUnblock = async (targetId) => {
    try {
      await API.post(`/users/unblock/${targetId}`);
      toast.success("User unblocked");
      setBlockedUsers((prev) => prev.filter((u) => u._id !== targetId));
    } catch {
      toast.error("Failed to unblock user");
    }
  };

  const isDirty =
    name !== (user?.name || "") ||
    status !== (user?.status || "") ||
    bio !== (user?.bio || "") ||
    avatar !== (user?.avatar || "");

  const handleReset = () => {
    setName(user?.name || "");
    setStatus(user?.status || "");
    setBio(user?.bio || "");
    setAvatar(user?.avatar || "");
    toast.info("Changes reverted");
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }
    setIsSaving(true);
    try {
      const res = await API.patch("/users/me", {
        name: name.trim(),
        status: status.trim(),
        bio: bio.trim(),
        avatar,
      });
      useAuth.setState({ user: res.data.data.user });
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatar(ev.target?.result);
      toast.success("Avatar selected. Save to apply.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const randomizeAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/9.x/avataaars/svg?seed=${randomSeed}`;
    setAvatar(newAvatar);
    toast.success("Avatar generated");
  };

  const handleCopyId = () => {
    if (!user?._id) return;
    navigator.clipboard.writeText(user._id);
    setCopiedId(true);
    toast.success("User ID copied");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const memberSince = user?.createdAt
    ? format(new Date(user.createdAt), "MMMM yyyy")
    : "Recently";

  const filteredBlocked = blockedUsers.filter((u) => {
    if (!blockedSearch.trim()) return true;
    const q = blockedSearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full h-full flex flex-col bg-[var(--color-base-bg)] text-[var(--color-base-text)] overflow-y-auto">
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={setShortcutsOpen} />

      <header className="sticky top-0 z-20 bg-[var(--color-base-surface)]/90 backdrop-blur-md border-b border-[var(--color-base-border)] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/chat")}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-[var(--color-base-border)] bg-[var(--color-base-bg)] text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:border-indigo-400 transition-colors cursor-pointer"
            title="Back to conversation"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-[11px] font-mono-tech uppercase tracking-wider">
            <span className="text-[var(--color-base-muted)]">Settings</span>
            <span className="text-[var(--color-base-muted)] opacity-50">/</span>
            <span className="font-semibold text-[var(--color-base-text)]">
              Account Profile
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-1.5 text-xs font-medium text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] rounded-full transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={isSaving || !isDirty}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isDirty
                ? "aurora-bg text-white hover:opacity-90 active:scale-95"
                : "bg-[var(--color-base-panel)] text-[var(--color-base-muted)] border border-[var(--color-base-border)] opacity-50 cursor-not-allowed"
            }`}
          >
            {isSaving ? (
              <Spinner className="w-3.5 h-3.5" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? "Saving" : "Save Changes"}</span>
          </button>
        </div>
      </header>

      <div className="max-w-4xl w-full mx-auto p-6 lg:p-10 space-y-8">
        <div>
          <p className="font-cursive text-5xl aurora-text leading-[0.8]">
            Identity
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--color-base-text)] mt-1">
            Account Settings
          </h1>
          <p className="text-xs text-[var(--color-base-muted)] mt-1">
            Manage your personal profile, status presence, and account security.
          </p>
        </div>

        <div className="flex border-b border-[var(--color-base-border)] gap-6 text-[11px] font-mono-tech uppercase tracking-wider overflow-x-auto">
          {[
            { id: "general", label: "Profile Information", icon: User },
            { id: "security", label: "Security & Sessions", icon: ShieldCheck },
            { id: "blocked", label: "Blocked Contacts", icon: Shield },
            { id: "preferences", label: "Preferences", icon: Sun },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "border-indigo-400 text-[var(--color-base-text)] font-semibold"
                    : "border-transparent text-[var(--color-base-muted)] hover:text-[var(--color-base-text)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "general" && (
          <form onSubmit={handleSaveProfile} className="space-y-8">
            <div className="border border-[var(--color-base-border)] rounded-3xl bg-[var(--color-base-surface)] divide-y divide-[var(--color-base-border)]">
              <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative group/avatar shrink-0">
                    <AvatarWithBadge
                      name={name || "U"}
                      src={avatar}
                      isOnline={true}
                      className="w-20 h-20 text-2xl font-bold ring-2 ring-[var(--color-base-border)]"
                    />
                    <label
                      className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity backdrop-blur-xs"
                      title="Upload avatar"
                    >
                      <Camera className="w-5 h-5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  </div>

                  <div>
                    <h3 className="font-display text-sm font-bold text-[var(--color-base-text)]">
                      Profile Avatar
                    </h3>
                    <p className="text-xs text-[var(--color-base-muted)] mt-0.5">
                      JPG, PNG, GIF or SVG format. Maximum file size 5MB.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <label className="px-3.5 py-1.5 rounded-full border border-[var(--color-base-border)] bg-[var(--color-base-bg)] hover:border-indigo-400 text-xs font-medium text-[var(--color-base-text)] flex items-center gap-1.5 transition-colors cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={randomizeAvatar}
                        className="px-3.5 py-1.5 rounded-full border border-[var(--color-base-border)] bg-[var(--color-base-bg)] hover:border-indigo-400 text-xs font-medium text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Generate avatar"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Randomize</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex flex-col items-end text-xs text-[var(--color-base-muted)] space-y-1">
                  <span className="font-mono-tech">{user?._id?.slice(0, 10)}...</span>
                  <span className="text-[10px] font-mono-tech uppercase tracking-wider text-cyan-400">
                    Active account
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono-tech uppercase tracking-wider text-[var(--color-base-muted)] flex items-center justify-between">
                      <span>Display Name</span>
                      <span className="text-[10px] font-normal">
                        {name.length}/50
                      </span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      maxLength={50}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full h-10 px-3.5 rounded-xl bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-xs text-[var(--color-base-text)] focus:outline-none focus:border-indigo-400 transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-mono-tech uppercase tracking-wider text-[var(--color-base-muted)] flex items-center justify-between">
                      <span>Email Address</span>
                      <span className="text-[10px] text-cyan-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Verified
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="w-full h-10 px-3.5 pr-9 rounded-xl bg-[var(--color-base-panel)] border border-[var(--color-base-border)] text-xs text-[var(--color-base-muted)] cursor-not-allowed select-none"
                      />
                      <Lock className="absolute right-3 top-3 w-3.5 h-3.5 text-[var(--color-base-muted)]" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-[11px] font-mono-tech uppercase tracking-wider text-[var(--color-base-muted)] flex items-center justify-between">
                    <span>Presence Status</span>
                    <span className="text-[10px] font-normal">
                      {status.length}/100
                    </span>
                  </label>
                  <div className="relative">
                    <CircleDot className="absolute left-3.5 top-3 w-4 h-4 text-indigo-400" />
                    <input
                      type="text"
                      value={status}
                      maxLength={100}
                      onChange={(e) => setStatus(e.target.value)}
                      placeholder="What is your current status?"
                      className="w-full h-10 pl-10 pr-3.5 rounded-xl bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-xs text-[var(--color-base-text)] focus:outline-none focus:border-indigo-400 transition-colors"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-mono-tech uppercase tracking-wider text-[var(--color-base-muted)] mr-1">
                      Presets:
                    </span>
                    {STATUS_OPTIONS.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setStatus(item.label)}
                          className="px-3 py-1 rounded-full bg-[var(--color-base-panel)] hover:border-indigo-400 border border-[var(--color-base-border)] text-[11px] text-[var(--color-base-text)] flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Icon className="w-3 h-3 text-indigo-400" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-mono-tech uppercase tracking-wider text-[var(--color-base-muted)] flex items-center justify-between">
                    <span>Bio</span>
                    <span className="text-[10px] font-normal">
                      {bio.length}/200
                    </span>
                  </label>
                  <textarea
                    value={bio}
                    maxLength={200}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief description about yourself for teammates and direct contacts..."
                    rows={3}
                    className="w-full p-3.5 rounded-2xl bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-xs text-[var(--color-base-text)] focus:outline-none focus:border-indigo-400 transition-colors resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              {isDirty && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-semibold rounded-full text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer"
                >
                  Discard
                </button>
              )}
              <button
                type="submit"
                disabled={isSaving || !isDirty}
                className={`px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDirty
                    ? "aurora-bg text-white hover:opacity-90 active:scale-95"
                    : "bg-[var(--color-base-panel)] text-[var(--color-base-muted)] border border-[var(--color-base-border)] opacity-50 cursor-not-allowed"
                }`}
              >
                {isSaving ? (
                  <Spinner className="w-3.5 h-3.5" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="border border-[var(--color-base-border)] rounded-3xl bg-[var(--color-base-surface)] divide-y divide-[var(--color-base-border)]">
              <div className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full border border-[var(--color-base-border)] bg-[var(--color-base-panel)] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-[var(--color-base-text)]">
                    End-to-End Encryption
                  </h3>
                  <p className="text-xs text-[var(--color-base-muted)] mt-1 leading-relaxed">
                    Direct messages and media are transferred across authenticated web sockets and protected database connections.
                  </p>
                </div>
              </div>

              <div className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full border border-[var(--color-base-border)] bg-[var(--color-base-panel)] flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-[var(--color-base-muted)]" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-[var(--color-base-text)]">
                    JWT Session Authentication
                  </h3>
                  <p className="text-xs text-[var(--color-base-muted)] mt-1 leading-relaxed">
                    Signed and verified using HTTP-only secure cookie tokens with automatic background refresh.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-[var(--color-base-border)] rounded-3xl bg-[var(--color-base-surface)] divide-y divide-[var(--color-base-border)]">
              <div className="px-6 py-4 flex items-center justify-between text-xs">
                <span className="text-[var(--color-base-muted)] font-medium">
                  Account ID
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono-tech text-[var(--color-base-text)]">
                    {user?._id}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="p-1.5 rounded-full hover:bg-[var(--color-base-hover)] text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] transition-colors cursor-pointer"
                    title={copiedId ? "Copied" : "Copy ID"}
                  >
                    {copiedId ? (
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 flex items-center justify-between text-xs">
                <span className="text-[var(--color-base-muted)] font-medium">
                  Member Registration
                </span>
                <span className="text-[var(--color-base-text)] font-medium">
                  {memberSince}
                </span>
              </div>

              <div className="px-6 py-4 flex items-center justify-between text-xs">
                <span className="text-[var(--color-base-muted)] font-medium">
                  Account Status
                </span>
                <span className="text-cyan-400 font-mono-tech uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Active
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "blocked" && (
          <div className="border border-[var(--color-base-border)] rounded-3xl bg-[var(--color-base-surface)] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-sm font-bold text-[var(--color-base-text)]">
                  Blocked Contacts
                </h3>
                <p className="text-xs text-[var(--color-base-muted)] mt-0.5">
                  Blocked users cannot send you direct messages or view your presence.
                </p>
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-[var(--color-base-muted)]" />
                <input
                  type="text"
                  value={blockedSearch}
                  onChange={(e) => setBlockedSearch(e.target.value)}
                  placeholder="Filter blocked users..."
                  className="w-full h-9 pl-9 pr-3.5 rounded-full bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-xs text-[var(--color-base-text)] focus:outline-none focus:border-indigo-400 transition-colors"
                />
              </div>
            </div>

            {isLoadingBlocked ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="w-5 h-5 text-indigo-400" />
              </div>
            ) : filteredBlocked.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center select-none border border-dashed border-[var(--color-base-border)] rounded-2xl">
                <Shield className="w-6 h-6 text-[var(--color-base-muted)] opacity-40 mb-2" />
                <h4 className="text-xs font-semibold text-[var(--color-base-text)]">
                  No blocked contacts
                </h4>
                <p className="text-[11px] text-[var(--color-base-muted)] max-w-xs mt-0.5">
                  Users you block in chat will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-base-border)] border border-[var(--color-base-border)] rounded-2xl bg-[var(--color-base-bg)] overflow-hidden">
                {filteredBlocked.map((bu) => (
                  <div
                    key={bu._id}
                    className="p-3.5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AvatarWithBadge
                        name={bu.name}
                        src={bu.avatar}
                        className="w-8 h-8 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--color-base-text)] truncate">
                          {bu.name}
                        </p>
                        <p className="text-[11px] text-[var(--color-base-muted)] truncate">
                          {bu.email}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUnblock(bu._id)}
                      className="px-3 py-1 rounded-full border border-[var(--color-base-border)] bg-[var(--color-base-panel)] hover:bg-red-500/10 hover:text-red-400 text-xs font-medium text-[var(--color-base-text)] transition-colors cursor-pointer shrink-0"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="space-y-4">
            <div className="border border-[var(--color-base-border)] rounded-3xl bg-[var(--color-base-surface)] divide-y divide-[var(--color-base-border)]">
              <div className="p-6 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-sm font-bold text-[var(--color-base-text)]">
                    Color Theme
                  </h3>
                  <p className="text-xs text-[var(--color-base-muted)] mt-0.5">
                    Toggle interface between Silk Pearl and Luminous Midnight modes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="px-4 py-2 rounded-full border border-[var(--color-base-border)] bg-[var(--color-base-bg)] hover:border-indigo-400 text-xs font-semibold text-[var(--color-base-text)] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Sun className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Toggle Theme</span>
                </button>
              </div>

              <div className="p-6 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-sm font-bold text-[var(--color-base-text)]">
                    Keyboard Shortcuts
                  </h3>
                  <p className="text-xs text-[var(--color-base-muted)] mt-0.5">
                    View global productivity shortcuts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShortcutsOpen(true)}
                  className="px-4 py-2 rounded-full border border-[var(--color-base-border)] bg-[var(--color-base-bg)] hover:border-indigo-400 text-xs font-semibold text-[var(--color-base-text)] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
                  <span>View Keys</span>
                </button>
              </div>
            </div>

            <div className="border border-red-500/20 rounded-3xl bg-red-500/5 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-sm font-bold text-red-400">
                  Sign Out
                </h3>
                <p className="text-xs text-[var(--color-base-muted)] mt-0.5">
                  End your current browser session on WhopChat.
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="px-5 py-2.5 rounded-full bg-red-500 text-white hover:bg-red-600 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
