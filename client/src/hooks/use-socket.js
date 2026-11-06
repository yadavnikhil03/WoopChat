import { create } from "zustand";
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_API_URL
    : window.location.origin;

export const useSocket = create()((set, get) => ({
  socket: null,
  onlineUsers: [],
  lastSeenMap: {},

  connectSocket: (accessToken) => {
    const existing = get().socket;
    if (existing?.connected) return;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("🟢 Socket connected:", socket.id);
      set({ socket });
    });

    socket.on("users:online", ({ onlineUsers }) => {
      set({ onlineUsers });
    });

    socket.on("user:online", ({ userId }) => {
      set((state) => ({
        onlineUsers: state.onlineUsers.includes(userId)
          ? state.onlineUsers
          : [...state.onlineUsers, userId],
      }));
    });

    socket.on("user:offline", ({ userId, lastSeen }) => {
      set((state) => ({
        onlineUsers: state.onlineUsers.filter((id) => id !== userId),
        lastSeenMap: {
          ...state.lastSeenMap,
          [userId]: lastSeen || new Date().toISOString(),
        },
      }));
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected");
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect error:", err.message);
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },
}));
