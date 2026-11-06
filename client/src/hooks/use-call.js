import { create } from "zustand";
import { useSocket } from "./use-socket";
import { useChat } from "./use-chat";
import { useAuth } from "./use-auth";
import { startRingingSound, stopRingingSound } from "@/lib/sound";
import { toast } from "sonner";

let durationInterval = null;
let ringTimeout = null;
let pendingIceCandidates = [];

export const useCall = create()((set, get) => ({
  callState: "idle",
  callType: "video",
  activeChatId: null,
  peerUser: null,
  localStream: null,
  remoteStream: null,
  isMicMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  isMinimized: false,
  isFullscreen: false,
  duration: 0,
  callStatus: "Idle",
  peerConnection: null,
  screenStream: null,

  initiateCall: async ({ chatId, otherUser, callType = "video" }) => {
    const { socket } = useSocket.getState();
    const currentUser = useAuth.getState().user;

    if (!socket || !otherUser?._id) {
      toast.error("Unable to initiate call: socket offline");
      return;
    }

    get().cleanupMedia();
    stopRingingSound();

    set({
      callState: "calling",
      callType,
      activeChatId: chatId,
      peerUser: otherUser,
      callStatus: "Calling...",
      duration: 0,
      isMicMuted: false,
      isVideoOff: callType === "audio",
      isScreenSharing: false,
      isMinimized: false,
      isFullscreen: false,
    });

    startRingingSound();

    let localStream = null;
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === "video",
        });
      }
    } catch {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        set({ isVideoOff: true });
      } catch {
        toast.error("Could not access microphone or camera");
      }
    }

    set({ localStream });

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    });

    set({ peerConnection: pc });
    pendingIceCandidates = [];

    if (localStream) {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    }

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        set({ remoteStream: event.streams[0] });
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("call:ice-candidate", {
          to: otherUser._id,
          candidate: event.candidate,
        });
      }
    };

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call:initiate", {
        to: otherUser._id,
        chatId,
        callType,
        callerName: currentUser?.name || "Someone",
        callerAvatar: currentUser?.avatar || "",
        signalData: offer,
      });

      set({ callStatus: "Ringing..." });

      if (ringTimeout) clearTimeout(ringTimeout);
      ringTimeout = setTimeout(() => {
        if (get().callState === "calling") {
          toast.info(`${otherUser.name || "Contact"} is unavailable`);
          get().endCall(true);
        }
      }, 30000);
    } catch {
      get().endCall(true);
    }
  },

  acceptIncomingCall: async () => {
    stopRingingSound();
    if (ringTimeout) clearTimeout(ringTimeout);

    const { socket } = useSocket.getState();
    const { peerUser, activeChatId, callType, pendingSignal } = get();

    if (!socket || !peerUser?._id) return;

    let localStream = null;
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === "video",
        });
      }
    } catch {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        set({ isVideoOff: true });
      } catch {
        toast.error("Could not access microphone or camera");
      }
    }

    set({ localStream });

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    });

    set({ peerConnection: pc });

    if (localStream) {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    }

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        set({ remoteStream: event.streams[0] });
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("call:ice-candidate", {
          to: peerUser._id,
          candidate: event.candidate,
        });
      }
    };

    try {
      if (pendingSignal) {
        await pc.setRemoteDescription(new RTCSessionDescription(pendingSignal));
        while (pendingIceCandidates.length > 0) {
          const cand = pendingIceCandidates.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch {}
        }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call:accept", {
        to: peerUser._id,
        chatId: activeChatId,
        signalData: answer,
      });

      set({
        callState: "connected",
        callStatus: "Connected",
      });

      get().startTimer();
    } catch {
      get().endCall();
    }
  },

  rejectIncomingCall: () => {
    stopRingingSound();
    if (ringTimeout) clearTimeout(ringTimeout);

    const { socket } = useSocket.getState();
    const { peerUser, activeChatId } = get();

    if (socket && peerUser?._id) {
      socket.emit("call:reject", {
        to: peerUser._id,
        chatId: activeChatId,
        reason: "declined",
      });
    }

    get().cleanupMedia();
    set({
      callState: "idle",
      peerUser: null,
      activeChatId: null,
      callStatus: "Idle",
    });
  },

  endCall: (isMissed = false) => {
    stopRingingSound();
    if (ringTimeout) clearTimeout(ringTimeout);
    if (durationInterval) {
      clearInterval(durationInterval);
      durationInterval = null;
    }

    const { socket } = useSocket.getState();
    const { peerUser, activeChatId, callType, duration, callState } = get();
    const wasConnected = callState === "connected";

    if (socket && peerUser?._id) {
      socket.emit("call:end", {
        to: peerUser._id,
        chatId: activeChatId,
      });
    }

    get().cleanupMedia();

    if (activeChatId && activeChatId !== "ai") {
      const icon = callType === "audio" ? "📞" : "📹";
      const typeLabel = callType === "audio" ? "Audio call" : "Video call";
      if (isMissed || (!wasConnected && duration === 0)) {
        useChat.getState().sendMessage({
          chatId: activeChatId,
          content: `${icon} Missed ${typeLabel.toLowerCase()}`,
        });
      } else {
        const mins = Math.floor(duration / 60);
        const secs = duration % 60;
        const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
        useChat.getState().sendMessage({
          chatId: activeChatId,
          content: `${icon} ${typeLabel} ended • ${formatted}`,
        });
      }
    }

    set({
      callState: "idle",
      peerUser: null,
      activeChatId: null,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      callStatus: "Idle",
      duration: 0,
      isScreenSharing: false,
      isMinimized: false,
      isFullscreen: false,
    });
  },

  startTimer: () => {
    if (durationInterval) clearInterval(durationInterval);
    durationInterval = setInterval(() => {
      set((s) => ({ duration: s.duration + 1 }));
    }, 1000);
  },

  cleanupMedia: () => {
    const { localStream, screenStream, peerConnection } = get();
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnection) {
      try {
        peerConnection.close();
      } catch {}
    }
  },

  toggleMic: () => {
    const { localStream, isMicMuted } = get();
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMicMuted;
      }
    }
    set({ isMicMuted: !isMicMuted });
  },

  toggleCamera: () => {
    const { localStream, isVideoOff } = get();
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff;
      }
    }
    set({ isVideoOff: !isVideoOff });
  },

  toggleScreenShare: async () => {
    const { isScreenSharing, screenStream, localStream, peerConnection } = get();

    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
      }
      if (peerConnection && localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        const sender = peerConnection
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      }
      set({ isScreenSharing: false, screenStream: null });
      toast.info("Screen sharing ended");
    } else {
      try {
        if (!navigator.mediaDevices?.getDisplayMedia) return;
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const displayTrack = displayStream.getVideoTracks()[0];

        if (peerConnection) {
          const sender = peerConnection
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(displayTrack);
          }
        }

        displayTrack.onended = () => {
          get().toggleScreenShare();
        };

        set({ isScreenSharing: true, screenStream: displayStream });
        toast.success("Sharing your screen");
      } catch {
        toast.error("Screen sharing was cancelled");
      }
    }
  },

  toggleMinimize: () => set((s) => ({ isMinimized: !s.isMinimized })),
  toggleFullscreen: () => set((s) => ({ isFullscreen: !s.isFullscreen })),

  setupSocketListeners: (socket) => {
    if (!socket) return;

    socket.off("call:incoming");
    socket.off("call:accepted");
    socket.off("call:rejected");
    socket.off("call:ice-candidate");
    socket.off("call:ended");

    socket.on("call:incoming", (data) => {
      const { callState } = get();
      if (callState !== "idle") {
        socket.emit("call:reject", {
          to: data.from,
          chatId: data.chatId,
          reason: "busy",
        });
        return;
      }

      startRingingSound();

      set({
        callState: "incoming",
        callType: data.callType || "video",
        activeChatId: data.chatId,
        peerUser: {
          _id: data.from,
          name: data.callerName || "Unknown Contact",
          avatar: data.callerAvatar || "",
        },
        pendingSignal: data.signalData,
        callStatus: `Incoming ${data.callType || "video"} call...`,
        duration: 0,
        isMinimized: false,
        isFullscreen: false,
      });

      if (ringTimeout) clearTimeout(ringTimeout);
      ringTimeout = setTimeout(() => {
        if (get().callState === "incoming") {
          get().rejectIncomingCall();
        }
      }, 30000);
    });

    socket.on("call:accepted", async (data) => {
      stopRingingSound();
      if (ringTimeout) clearTimeout(ringTimeout);

      const { peerConnection } = get();
      if (peerConnection && data.signalData) {
        try {
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.signalData)
          );
          while (pendingIceCandidates.length > 0) {
            const cand = pendingIceCandidates.shift();
            try {
              await peerConnection.addIceCandidate(new RTCIceCandidate(cand));
            } catch {}
          }
        } catch {}
      }

      set({
        callState: "connected",
        callStatus: "Connected",
      });

      get().startTimer();
      toast.success("Call connected");
    });

    socket.on("call:rejected", (data) => {
      stopRingingSound();
      if (ringTimeout) clearTimeout(ringTimeout);

      toast.info(data.reason === "busy" ? "User is busy" : "Call declined");
      get().endCall(true);
    });

    socket.on("call:ice-candidate", async (data) => {
      const { peerConnection } = get();
      if (peerConnection && data.candidate) {
        if (peerConnection.remoteDescription) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch {}
        } else {
          pendingIceCandidates.push(data.candidate);
        }
      }
    });

    socket.on("call:ended", () => {
      stopRingingSound();
      if (ringTimeout) clearTimeout(ringTimeout);

      toast.info("Call ended by peer");
      get().cleanupMedia();
      set({
        callState: "idle",
        peerUser: null,
        activeChatId: null,
        localStream: null,
        remoteStream: null,
        peerConnection: null,
        callStatus: "Idle",
        duration: 0,
        isScreenSharing: false,
        isMinimized: false,
        isFullscreen: false,
      });
    });
  },
}));

