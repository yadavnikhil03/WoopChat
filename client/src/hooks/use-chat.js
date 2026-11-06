import { create } from "zustand";
import { toast } from "sonner";
import { useAuth } from "./use-auth";
import { useSocket } from "./use-socket";
import { API } from "@/lib/axios-client";
import { generateUUID } from "@/lib/helper";
import { playOutgoingMessageSound } from "@/lib/sound";

export const useChat = create()((set, get) => ({
  chats: [],
  users: [],
  singleChat: null,

  isChatsLoading: false,
  isUsersLoading: false,
  isCreatingChat: false,
  isSingleChatLoading: false,
  isSendingMsg: false,

  currentAIAbortController: null,
  isAIStreaming: false,

  fetchAllUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await API.get("/users");
      set({ users: res.data.data.users || [] });
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  fetchChats: async () => {
    set({ isChatsLoading: true });
    try {
      const res = await API.get("/chats");
      set({ chats: res.data.data.chats || [] });
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    } finally {
      set({ isChatsLoading: false });
    }
  },

  createChat: async (payload) => {
    set({ isCreatingChat: true });
    try {
      const res = await API.post("/chats", payload);
      const newChat = res.data.data.chat;
      get().addNewChat(newChat);
      toast.success("Chat created successfully");
      return newChat;
    } catch (err) {
      const message = err.response?.data?.message || "Failed to create chat";
      toast.error(message);
      return null;
    } finally {
      set({ isCreatingChat: false });
    }
  },

  fetchSingleChat: async (chatId) => {
    set({ isSingleChatLoading: true });
    try {
      if (chatId === "ai") {
        const historyRes = await API.get("/ai/history");
        const user = useAuth.getState().user;
        const rawMessages = historyRes.data.data.messages || [];
        rawMessages.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        const messages = rawMessages.map((m) => ({
          _id: m._id,
          chatId: "ai",
          content: m.content,
          createdAt: m.createdAt,
          sender:
            m.role === "assistant"
              ? {
                  _id: "whop-ai",
                  name: "WhopAI",
                  isAI: true,
                  avatar: "/whop-ai-logo.png",
                }
              : user,
        }));

        set({
          singleChat: {
            chat: {
              _id: "ai",
              isGroup: false,
              participants: [
                user,
                {
                  _id: "whop-ai",
                  name: "WhopAI Assistant",
                  isAI: true,
                  avatar: "/whop-ai-logo.png",
                },
              ],
            },
            messages,
          },
        });
        return;
      }

      const [chatRes, msgRes] = await Promise.all([
        API.get(`/chats/${chatId}`),
        API.get(`/chats/${chatId}/messages`),
      ]);
      const chat = chatRes.data.data.chat;
      const messages = msgRes.data.data.messages || [];
      set((state) => ({
        singleChat: { chat, messages },
        chats: state.chats.map((c) =>
          c._id === chatId ? { ...c, unreadCount: 0 } : c
        ),
      }));

      API.post(`/chats/${chatId}/read`).catch(() => {});
      const socket = useSocket.getState().socket;
      if (socket?.connected) {
        socket.emit("message:read", { chatId });
      }
    } catch (err) {
      console.error("Failed to load chat:", err);
      toast.error("Failed to load conversation");
    } finally {
      set({ isSingleChatLoading: false });
    }
  },

  sendMessage: async (payload) => {
    set({ isSendingMsg: true });
    const { chatId, replyTo, content, image, audio, audioDuration, isForwarded } = payload;
    const { user } = useAuth.getState();
    if (!chatId || !user?._id) {
      set({ isSendingMsg: false });
      return;
    }

    const socket = useSocket.getState().socket;

    try {
      if (socket?.connected) {
        socket.emit("message:send", {
          chatId,
          content: content || "",
          image: image || undefined,
          audio: audio || undefined,
          audioDuration: audioDuration || undefined,
          replyTo: replyTo || undefined,
          isForwarded: Boolean(isForwarded),
        });
        playOutgoingMessageSound();
      } else {
        const res = await API.post(`/chats/${chatId}/messages`, {
          content: content || "",
          image: image || undefined,
          audio: audio || undefined,
          audioDuration: audioDuration || undefined,
          replyTo: replyTo || undefined,
          isForwarded: Boolean(isForwarded),
        });
        const newMsg = res.data.data.message;
        get().addNewMessage(chatId, newMsg);
        get().updateChatLastMessage(chatId, newMsg);
        playOutgoingMessageSound();
      }
    } catch (err) {
      toast.error("Failed to send message");
    } finally {
      set({ isSendingMsg: false });
    }
  },

  editMessage: async (chatId, messageId, content) => {
    try {
      set((state) => {
        if (!state.singleChat?.messages) return state;
        return {
          singleChat: {
            ...state.singleChat,
            messages: state.singleChat.messages.map((m) =>
              m._id === messageId ? { ...m, content, isEdited: true } : m
            ),
          },
        };
      });

      const socket = useSocket.getState().socket;
      if (socket?.connected) {
        socket.emit("message:edit", { messageId, chatId, content });
      } else {
        const res = await API.patch(`/chats/messages/${messageId}`, { content });
        get().updateSingleMessage(res.data.data.message);
      }
    } catch (err) {
      toast.error("Failed to edit message");
    }
  },

  deleteMessage: async (chatId, messageId) => {
    try {
      get().removeMessageFromChat(messageId);

      const socket = useSocket.getState().socket;
      if (socket?.connected) {
        socket.emit("message:delete", { messageId, chatId });
      } else {
        await API.delete(`/chats/messages/${messageId}`);
      }
    } catch (err) {
      toast.error("Failed to delete message");
    }
  },

  sendAIMessage: async (userPrompt) => {
    const { user } = useAuth.getState();
    if (!userPrompt.trim()) return;

    const controller = new AbortController();
    set({ currentAIAbortController: controller, isAIStreaming: true });

    const tempUserMsgId = generateUUID();
    const tempAIMsgId = generateUUID();

    const userMsg = {
      _id: tempUserMsgId,
      chatId: "ai",
      sender: user,
      content: userPrompt,
      createdAt: new Date().toISOString(),
    };

    const aiMsg = {
      _id: tempAIMsgId,
      chatId: "ai",
      sender: {
        _id: "whop-ai",
        name: "WhopAI",
        avatar: "/whop-ai-logo.png",
        isAI: true,
      },
      content: "",
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      singleChat: {
        ...state.singleChat,
        messages: [...(state.singleChat?.messages || []), userMsg, aiMsg],
      },
    }));

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/ai/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ message: userPrompt }),
          signal: controller.signal,
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("AI request failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.delta) {
                  set((state) => ({
                    singleChat: {
                      ...state.singleChat,
                      messages: state.singleChat.messages.map((m) =>
                        m._id === tempAIMsgId
                          ? { ...m, content: m.content + parsed.delta }
                          : m
                      ),
                    },
                  }));
                }
              } catch {}
            }
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        toast.info("AI response streaming cancelled");
      } else {
        toast.error("Failed to receive AI response");
      }
    } finally {
      set({ currentAIAbortController: null, isAIStreaming: false });
    }
  },

  cancelAIStreaming: () => {
    const { currentAIAbortController } = get();
    if (currentAIAbortController) {
      currentAIAbortController.abort();
      set({ currentAIAbortController: null, isAIStreaming: false });
    }
  },

  addNewChat: (newChat) => {
    set((state) => {
      const existingIndex = state.chats.findIndex((c) => c._id === newChat._id);
      if (existingIndex !== -1) {
        return {
          chats: [newChat, ...state.chats.filter((c) => c._id !== newChat._id)],
        };
      }
      return { chats: [newChat, ...state.chats] };
    });
  },

  updateChatLastMessage: (chatId, lastMessage) => {
    set((state) => {
      const chat = state.chats.find((c) => c._id === chatId);
      if (!chat) return state;

      const isCurrentChatOpen = state.singleChat?.chat?._id === chatId;
      const isFromMe =
        lastMessage?.sender?._id === useAuth.getState().user?._id ||
        lastMessage?.sender === useAuth.getState().user?._id;
      const unreadCount =
        isCurrentChatOpen || isFromMe ? 0 : (chat.unreadCount || 0) + 1;

      return {
        chats: [
          {
            ...chat,
            lastMessage,
            unreadCount,
            updatedAt: lastMessage?.createdAt || new Date(),
          },
          ...state.chats.filter((c) => c._id !== chatId),
        ],
      };
    });
  },

  updateMessageStatus: (chatId, messageId, status) => {
    set((state) => {
      if (state.singleChat?.chat?._id !== chatId) return state;
      return {
        singleChat: {
          ...state.singleChat,
          messages: state.singleChat.messages.map((m) =>
            m._id === messageId ? { ...m, status } : m
          ),
        },
      };
    });
  },

  updateSingleMessage: (updatedMsg) => {
    set((state) => {
      if (!state.singleChat?.messages) return state;
      return {
        singleChat: {
          ...state.singleChat,
          messages: state.singleChat.messages.map((m) =>
            m._id === updatedMsg._id ? updatedMsg : m
          ),
        },
      };
    });
  },

  markChatMessagesAsRead: (chatId, readerUserId) => {
    set((state) => {
      if (state.singleChat?.chat?._id !== chatId || !state.singleChat?.messages)
        return state;
      const updatedMessages = state.singleChat.messages.map((m) => {
        const isFromMe = String(m.sender?._id || m.sender) === String(readerUserId);
        if (!isFromMe) {
          const currentReadBy = Array.isArray(m.readBy) ? m.readBy : [];
          const readBySet = new Set(
            currentReadBy.map((id) => String(id?._id || id))
          );
          readBySet.add(String(readerUserId));
          return {
            ...m,
            status: "read",
            readBy: Array.from(readBySet),
          };
        }
        return m;
      });
      return {
        singleChat: {
          ...state.singleChat,
          messages: updatedMessages,
        },
      };
    });
  },

  removeMessageFromChat: (messageId, lastMessage) => {
    set((state) => {
      if (!state.singleChat?.messages) return state;
      const remaining = state.singleChat.messages.filter((m) => m._id !== messageId);
      const nextLastMessage =
        lastMessage !== undefined
          ? lastMessage
          : remaining.length > 0
          ? remaining[remaining.length - 1]
          : null;
      const chatId = state.singleChat?.chat?._id;
      if (chatId) {
        get().updateChatLastMessage(chatId, nextLastMessage);
      }
      return {
        singleChat: {
          ...state.singleChat,
          messages: remaining,
        },
      };
    });
  },

  addNewMessage: (chatId, message) => {
    const chat = get().singleChat;
    if (chat?.chat?._id === chatId) {
      const exists = chat.messages.some((m) => m._id === message._id);
      if (!exists) {
        set({
          singleChat: {
            chat: chat.chat,
            messages: [...chat.messages, message],
          },
        });
      }
    }
    get().updateChatLastMessage(chatId, message);
  },

  toggleReaction: async (chatId, messageId, emoji) => {
    const socket = useSocket.getState().socket;
    const currentUserId = useAuth.getState().user?._id;

    const chat = get().singleChat;
    if (chat?.messages) {
      const updatedMessages = chat.messages.map((m) => {
        if (m._id !== messageId) return m;
        let reactions = m.reactions ? [...m.reactions] : [];
        let group = reactions.find((r) => r.emoji === emoji);
        if (group) {
          const userHasReacted = group.users.some(
            (u) => (u?._id ? u._id.toString() : u.toString()) === currentUserId?.toString()
          );
          if (userHasReacted) {
            group = {
              ...group,
              users: group.users.filter(
                (u) => (u?._id ? u._id.toString() : u.toString()) !== currentUserId?.toString()
              ),
            };
          } else {
            group = { ...group, users: [...group.users, currentUserId] };
          }
          reactions = reactions
            .map((r) => (r.emoji === emoji ? group : r))
            .filter((r) => r.users.length > 0);
        } else {
          reactions.push({ emoji, users: [currentUserId] });
        }
        return { ...m, reactions };
      });

      set({
        singleChat: {
          ...chat,
          messages: updatedMessages,
        },
      });
    }

    if (socket?.connected) {
      socket.emit("message:react", { messageId, emoji, chatId });
    } else {
      API.post(`/chats/messages/${messageId}/reactions`, { emoji, chatId }).catch(() => {});
    }
  },

  updateMessageReactions: (messageId, reactions) => {
    const chat = get().singleChat;
    if (!chat?.messages) return;
    set({
      singleChat: {
        ...chat,
        messages: chat.messages.map((m) =>
          m._id === messageId ? { ...m, reactions } : m
        ),
      },
    });
  },

  handleNewMessage: (message) => {
    if (message?.chatId) {
      get().addNewMessage(message.chatId, message);
    }
  },

  updateUserData: (updatedUser) => {
    if (!updatedUser?._id) return;
    const uid = updatedUser._id.toString();

    set((state) => {
      const nextChats = state.chats.map((c) => {
        let changed = false;
        const participants = c.participants?.map((p) => {
          const pid = p?._id ? p._id.toString() : p?.toString();
          if (pid === uid) {
            changed = true;
            return { ...p, ...updatedUser };
          }
          return p;
        });
        return changed ? { ...c, participants } : c;
      });

      let nextSingleChat = state.singleChat;
      if (nextSingleChat?.chat?.participants) {
        let changed = false;
        const participants = nextSingleChat.chat.participants.map((p) => {
          const pid = p?._id ? p._id.toString() : p?.toString();
          if (pid === uid) {
            changed = true;
            return { ...p, ...updatedUser };
          }
          return p;
        });
        if (changed) {
          nextSingleChat = {
            ...nextSingleChat,
            chat: { ...nextSingleChat.chat, participants },
          };
        }
      }

      const nextUsers = state.users.map((u) =>
        u._id?.toString() === uid ? { ...u, ...updatedUser } : u
      );

      return {
        chats: nextChats,
        singleChat: nextSingleChat,
        users: nextUsers,
      };
    });
  },

  addMemberToGroup: async (chatId, userId) => {
    try {
      const res = await API.post(`/chats/${chatId}/members`, { userId });
      const updatedChat = res.data.data?.chat;
      const msg = res.data.data?.message;
      if (updatedChat) {
        set((state) => ({
          singleChat: state.singleChat ? { ...state.singleChat, chat: updatedChat } : null,
          chats: state.chats.map((c) => (c._id === chatId ? { ...c, ...updatedChat } : c)),
        }));
      }
      if (msg) {
        get().handleNewMessage(msg);
      }
      toast.success("Member added to group");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add member");
      return false;
    }
  },

  removeMemberFromGroup: async (chatId, userId) => {
    try {
      const res = await API.delete(`/chats/${chatId}/members/${userId}`);
      const updatedChat = res.data.data?.chat;
      const msg = res.data.data?.message;
      if (updatedChat) {
        set((state) => ({
          singleChat: state.singleChat ? { ...state.singleChat, chat: updatedChat } : null,
          chats: state.chats.map((c) => (c._id === chatId ? { ...c, ...updatedChat } : c)),
        }));
      }
      if (msg) {
        get().handleNewMessage(msg);
      }
      toast.success("Member removed from group");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove member");
      return false;
    }
  },

  promoteAdmin: async (chatId, userId) => {
    try {
      const res = await API.post(`/chats/${chatId}/admins/${userId}`);
      const updatedChat = res.data.data?.chat;
      const msg = res.data.data?.message;
      if (updatedChat) {
        set((state) => ({
          singleChat: state.singleChat ? { ...state.singleChat, chat: updatedChat } : null,
          chats: state.chats.map((c) => (c._id === chatId ? { ...c, ...updatedChat } : c)),
        }));
      }
      if (msg) {
        get().handleNewMessage(msg);
      }
      toast.success("Admin role granted");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to grant admin role");
      return false;
    }
  },

  demoteAdmin: async (chatId, userId) => {
    try {
      const res = await API.delete(`/chats/${chatId}/admins/${userId}`);
      const updatedChat = res.data.data?.chat;
      const msg = res.data.data?.message;
      if (updatedChat) {
        set((state) => ({
          singleChat: state.singleChat ? { ...state.singleChat, chat: updatedChat } : null,
          chats: state.chats.map((c) => (c._id === chatId ? { ...c, ...updatedChat } : c)),
        }));
      }
      if (msg) {
        get().handleNewMessage(msg);
      }
      toast.success("Admin role revoked");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to revoke admin role");
      return false;
    }
  },

  updateGroupInfo: async (chatId, payload) => {
    try {
      const res = await API.patch(`/chats/${chatId}`, payload);
      const updatedChat = res.data.data?.chat;
      const msg = res.data.data?.message;
      if (updatedChat) {
        set((state) => ({
          singleChat: state.singleChat ? { ...state.singleChat, chat: updatedChat } : null,
          chats: state.chats.map((c) => (c._id === chatId ? { ...c, ...updatedChat } : c)),
        }));
      }
      if (msg) {
        get().handleNewMessage(msg);
      }
      toast.success("Group details updated");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update group");
      return false;
    }
  },

  deleteGroup: async (chatId) => {
    try {
      await API.delete(`/chats/${chatId}`);
      set((state) => ({
        chats: state.chats.filter((c) => c._id !== chatId),
        singleChat: state.singleChat?.chat?._id === chatId ? null : state.singleChat,
      }));
      toast.success("Group deleted");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete group");
      return false;
    }
  },

  leaveGroup: async (chatId) => {
    try {
      await API.post(`/chats/${chatId}/leave`);
      set((state) => ({
        chats: state.chats.filter((c) => c._id !== chatId),
        singleChat: state.singleChat?.chat?._id === chatId ? null : state.singleChat,
      }));
      toast.success("Left group");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to leave group");
      return false;
    }
  },

  pinMessage: async (chatId, messageId) => {
    try {
      const socket = useSocket.getState().socket;
      if (socket?.connected) {
        socket.emit("message:pin", { chatId, messageId });
      }
      const res = await API.post(`/chats/${chatId}/pin/${messageId}`);
      const pinnedMsg = res.data.data?.message;
      if (pinnedMsg) {
        get().setPinnedMessage(chatId, pinnedMsg);
      }
      toast.success("Message pinned");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to pin message");
    }
  },

  unpinMessage: async (chatId) => {
    try {
      const socket = useSocket.getState().socket;
      if (socket?.connected) {
        socket.emit("message:unpin", { chatId });
      }
      await API.delete(`/chats/${chatId}/pin`);
      get().clearPinnedMessage(chatId);
      toast.success("Message unpinned");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to unpin message");
    }
  },

  setPinnedMessage: (chatId, pinnedMessage) => {
    set((state) => {
      const isCurrent = state.singleChat?.chat?._id === chatId;
      let nextSingleChat = state.singleChat;
      if (isCurrent && nextSingleChat?.chat) {
        const updatedMessages = (nextSingleChat.messages || []).map((m) => ({
          ...m,
          isPinned: m._id === pinnedMessage._id,
        }));
        nextSingleChat = {
          ...nextSingleChat,
          chat: { ...nextSingleChat.chat, pinnedMessage },
          messages: updatedMessages,
        };
      }
      const nextChats = state.chats.map((c) =>
        c._id === chatId ? { ...c, pinnedMessage } : c
      );
      return { singleChat: nextSingleChat, chats: nextChats };
    });
  },

  clearPinnedMessage: (chatId) => {
    set((state) => {
      const isCurrent = state.singleChat?.chat?._id === chatId;
      let nextSingleChat = state.singleChat;
      if (isCurrent && nextSingleChat?.chat) {
        const updatedMessages = (nextSingleChat.messages || []).map((m) => ({
          ...m,
          isPinned: false,
        }));
        nextSingleChat = {
          ...nextSingleChat,
          chat: { ...nextSingleChat.chat, pinnedMessage: null },
          messages: updatedMessages,
        };
      }
      const nextChats = state.chats.map((c) =>
        c._id === chatId ? { ...c, pinnedMessage: null } : c
      );
      return { singleChat: nextSingleChat, chats: nextChats };
    });
  },
}));
