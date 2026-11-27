import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { X, SunMoon, Check, User, Sparkles, Shield, Upload, Camera, ExternalLink } from "lucide-react";
import { toggleTheme } from "@/lib/theme";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import { Spinner } from "./ui/spinner";
import AvatarWithBadge from "./avatar-with-badge";

const SettingsPanel = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [status, setStatus] = useState(user?.status || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [isSaving, setIsSaving] = useState(false);

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setStatus(user.status || "");
      setBio(user.bio || "");
      setAvatar(user.avatar || "");
    }
  }, [user]);

  useEffect(() => {
    if (open && activeTab === "blocked") {
      fetchBlockedUsers();
    }
  }, [open, activeTab]);

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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await API.patch("/users/me", {
        name,
        status,
        bio,
        avatar,
      });
      useAuth.setState({ user: res.data.data.user });
      toast.success("Profile updated successfully!");
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
      toast.error("Avatar image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatar(ev.target?.result);
      toast.success("Avatar preview updated. Click 'Save Changes' to apply.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const randomizeAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setAvatar(`https://api.dicebear.com/9.x/avataaars/svg?seed=${randomSeed}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md max-h-[90vh] bg-[var(--color-base-surface)] border border-[var(--color-base-border)] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-base-border)] bg-[var(--color-base-panel)] shrink-0">
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-lg font-bold text-[var(--color-base-text)]">Settings</h2>
            <span className="font-cursive text-3xl leading-none aurora-text">
              Studio
            </span>
          </div>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-base-muted)] hover:bg-[var(--color-base-hover)] hover:text-[var(--color-base-text)] transition-colors cursor-pointer"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-[var(--color-base-border)] bg-[var(--color-base-surface)] px-5 pt-2.5 gap-5 shrink-0">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-2.5 text-[11px] font-mono-tech uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === "profile"
                ? "border-indigo-400 text-[var(--color-base-text)] font-semibold"
                : "border-transparent text-[var(--color-base-muted)] hover:text-[var(--color-base-text)]"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("blocked")}
            className={`pb-2.5 text-[11px] font-mono-tech uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === "blocked"
                ? "border-indigo-400 text-[var(--color-base-text)] font-semibold"
                : "border-transparent text-[var(--color-base-muted)] hover:text-[var(--color-base-text)]"
            }`}
          >
            Blocked Users
          </button>
        </div>

        <div className="flex-1 min-h-0 p-6 overflow-y-auto space-y-6">
          <div>
            {activeTab === "profile" ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/profile");
                    onClose();
                  }}
                  className="w-full p-3 rounded-2xl bg-[var(--color-base-panel)] hover:border-indigo-400 border border-[var(--color-base-border)] flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--color-base-text)] group-hover:text-indigo-400 transition-colors">
                        Open Full Profile Page
                      </p>
                      <p className="text-[10.5px] text-[var(--color-base-muted)]">
                        Full-screen view with status presets &amp; bio
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="relative group/avatar">
                    <AvatarWithBadge name={name || "U"} src={avatar} className="w-14 h-14" />
                    <label
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 rounded-full flex items-center justify-center cursor-pointer transition-opacity text-white"
                      title="Upload avatar"
                    >
                      <Camera className="w-5 h-5 drop-shadow" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:underline cursor-pointer">
                        <Upload className="w-3.5 h-3.5" /> Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                      </label>
                      <span className="text-[var(--color-base-muted)]">•</span>
                      <button
                        type="button"
                        onClick={randomizeAvatar}
                        className="flex items-center gap-1 text-xs font-medium text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Randomize
                      </button>
                    </div>
                    <span className="text-[11px] font-mono-tech text-[var(--color-base-muted)] truncate max-w-[200px]">
                      {user?.email}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono-tech font-medium text-[var(--color-base-muted)] uppercase tracking-wider">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-sm text-[var(--color-base-text)] focus:outline-none focus:border-indigo-400"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono-tech font-medium text-[var(--color-base-muted)] uppercase tracking-wider">
                    Status Message
                  </label>
                  <input
                    type="text"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full h-10 px-3.5 rounded-xl bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-sm text-[var(--color-base-text)] focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono-tech font-medium text-[var(--color-base-muted)] uppercase tracking-wider">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others about yourself..."
                    rows={2}
                    className="w-full p-3 rounded-xl bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-sm text-[var(--color-base-text)] focus:outline-none focus:border-indigo-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2.5 aurora-bg text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-500/20"
                >
                  {isSaving ? <Spinner className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  Save Changes
                </button>
              </form>
            ) : (
              <div className="min-h-[200px] flex flex-col">
                {isLoadingBlocked ? (
                  <div className="flex-1 flex items-center justify-center py-12">
                    <Spinner className="w-5 h-5 text-indigo-400" />
                  </div>
                ) : blockedUsers.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-sm text-[var(--color-base-muted)]">
                    <Shield className="w-8 h-8 mb-2 opacity-30 text-[var(--color-base-muted)]" />
                    <span>No blocked users</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blockedUsers.map((bu) => (
                      <div
                        key={bu._id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[var(--color-base-panel)] border border-[var(--color-base-border)]"
                      >
                        <div className="flex items-center gap-2.5">
                          <AvatarWithBadge name={bu.name} src={bu.avatar} className="w-8 h-8" />
                          <div>
                            <p className="text-sm font-medium text-[var(--color-base-text)]">{bu.name}</p>
                            <p className="text-xs text-[var(--color-base-muted)]">{bu.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnblock(bu._id)}
                          className="text-xs px-3 py-1 rounded-full bg-[var(--color-base-hover)] hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-5 border-t border-[var(--color-base-border)]">
            <h3 className="text-[10px] font-mono-tech font-bold text-[var(--color-base-muted)] uppercase tracking-wider">
              Preferences
            </h3>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between bg-[var(--color-base-panel)] hover:bg-[var(--color-base-hover)] border border-[var(--color-base-border)] p-3 rounded-2xl transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <SunMoon className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-[var(--color-base-text)]">Toggle Theme</span>
              </div>
            </button>

            <button
              className="w-full py-2.5 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 text-xs font-semibold transition-colors cursor-pointer"
              onClick={() => {
                logout();
                onClose();
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SettingsPanel;
