import { toast } from "sonner";
import { create } from "zustand";
import { useSocket } from "./use-socket";
import { API } from "@/lib/axios-client";

export const useAuth = create()((set) => ({
  user: null,
  isSigningUp: false,
  isLoggingIn: false,
  isAuthStatusLoading: false,

  register: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await API.post("/auth/register", data);
      const { user, accessToken } = res.data.data;
      localStorage.setItem("accessToken", accessToken);
      set({ user });
      useSocket.getState().connectSocket(accessToken);
      toast.success("Registered successfully!");
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
      toast.error(message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await API.post("/auth/login", data);
      const { user, accessToken } = res.data.data;
      localStorage.setItem("accessToken", accessToken);
      set({ user });
      useSocket.getState().connectSocket(accessToken);
      toast.success("Login successful!");
    } catch (err) {
      const message = err.response?.data?.message || "Invalid email or password";
      toast.error(message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await API.post("/auth/logout");
    } catch {}
    localStorage.removeItem("accessToken");
    set({ user: null });
    useSocket.getState().disconnectSocket();
    toast.success("Logged out successfully!");
  },

  isAuthStatus: async () => {
    set({ isAuthStatusLoading: true });
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        const refreshRes = await API.post("/auth/refresh");
        const { user, accessToken } = refreshRes.data.data;
        localStorage.setItem("accessToken", accessToken);
        set({ user });
        useSocket.getState().connectSocket(accessToken);
        return;
      }
      const res = await API.get("/auth/me");
      const { user } = res.data.data;
      set({ user });
      useSocket.getState().connectSocket(token);
    } catch {
      localStorage.removeItem("accessToken");
      set({ user: null });
    } finally {
      set({ isAuthStatusLoading: false });
    }
  },
}));
