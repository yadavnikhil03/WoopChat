import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { X, SunMoon, Check, User, Sparkles, Shield, UserX, Upload, Camera, ExternalLink } from "lucide-react";
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
      <div className="w-full max-w-md h-[640px] max-h-[90vh] bg-[var(--color-base-bg)] border border-[var(--color-base-border)] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-base-border)] bg-[var(--color-base-panel)] shrink-0">
          <h2 className="text-lg font-semibold text-[var(--color-base-text)]">Settings</h2>
          <button
            className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--color-base-muted)] hover:bg-[var(--color-base-hover)] hover:text-[var(--color-base-text)] transition-colors cursor-pointer"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-[var(--color-base-border)] bg-[var(--color-base-bg)] px-4 pt-2 gap-4 shrink-0">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === "profile"
                ? "border-[var(--color-base-primary)] text-[var(--color-base-text)]"
                : "border-transparent text-[var(--color-base-muted)] hover:text-[var(--color-base-text)]"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("blocked")}
            className={`pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === "blocked"
                ? "border-[var(--color-base-primary)] text-[var(--color-base-text)]"
                : "border-transparent text-[var(--color-base-muted)] hover:text-[var(--color-base-text)]"
            }`}
          >
            Blocked Users
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between space-y-6">
          <div className="min-h-[320px] flex flex-col">
            {activeTab === "profile" ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/profile");
                    onClose();
                  }}
                  className="w-full p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--color-base-text)] group-hover:text-emerald-400 transition-colors">
                        Open Full Profile Page
                      </p>
                      <p className="text-[10.5px] text-[var(--color-base-muted)]">
                        Full-screen view with status presets & bio
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
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
                      <label className="flex items-center gap-1 text-xs font-semibold text-[var(--color-base-primary)] hover:underline cursor-pointer">
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
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Randomize
                      </button>
                    </div>
                    <span className="text-[11px] text-[var(--color-base-muted)] truncate max-w-[200px]">
                      {user?.email}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-base-muted)] uppercase tracking-wider">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 px-3 rounded-md bg-[var(--color-base-panel)] border border-[var(--color-base-border)] text-sm text-[var(--color-base-text)] focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-base-muted)] uppercase tracking-wider">
                    Status Message
                  </label>
                  <input
                    type="text"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full h-9 px-3 rounded-md bg-[var(--color-base-panel)] border border-[var(--color-base-border)] text-sm text-[var(--color-base-text)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-base-muted)] uppercase tracking-wider">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others about yourself..."
                    rows={2}
                    className="w-full p-2.5 rounded-md bg-[var(--color-base-panel)] border border-[var(--color-base-border)] text-sm text-[var(--color-base-text)] focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2 bg-[var(--color-base-primary)] text-[var(--color-base-primary-fg)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSaving ? <Spinner className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  Save Changes
                </button>
              </form>
            ) : (
              <div className="flex-1 flex flex-col">
                {isLoadingBlocked ? (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <Spinner className="w-5 h-5 text-[var(--color-base-muted)]" />
                  </div>
                ) : blockedUsers.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-sm text-[var(--color-base-muted)]">
                    <Shield className="w-8 h-8 mb-2 opacity-30 text-[var(--color-base-muted)]" />
                    <span>No blocked users</span>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[320px]">
                    {blockedUsers.map((bu) => (
                      <div
                        key={bu._id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--color-base-panel)] border border-[var(--color-base-border)]"
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
                          className="text-xs px-2.5 py-1 rounded bg-[var(--color-base-hover)] hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
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

          <div className="space-y-4 pt-4 border-t border-[var(--color-base-border)] mt-auto shrink-0">
            <h3 className="text-xs font-bold text-[var(--color-base-muted)] uppercase tracking-wider">
              Preferences
            </h3>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between bg-[var(--color-base-panel)] hover:bg-[var(--color-base-hover)] border border-[var(--color-base-border)] p-3 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <SunMoon className="w-5 h-5 text-[var(--color-base-text)]" />
                <span className="text-sm font-medium text-[var(--color-base-text)]">Toggle Theme</span>
              </div>
            </button>

            <button
              className="w-full py-2.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 text-sm font-semibold transition-colors cursor-pointer"
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
