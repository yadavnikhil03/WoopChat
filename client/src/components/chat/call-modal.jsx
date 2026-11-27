import { useEffect, useRef } from "react";
import { useCall } from "@/hooks/use-call";
import { useSocket } from "@/hooks/use-socket";
import AvatarWithBadge from "../avatar-with-badge";
import {
  Phone,
  Video,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  ScreenShare,
  Maximize2,
  Minimize2,
  Minus,
  Lock,
} from "lucide-react";

const CallModal = () => {
  const { socket } = useSocket();
  const {
    callState,
    callType,
    peerUser,
    localStream,
    remoteStream,
    isMicMuted,
    isVideoOff,
    isScreenSharing,
    isMinimized,
    isFullscreen,
    duration,
    callStatus,
    acceptIncomingCall,
    rejectIncomingCall,
    endCall,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    toggleMinimize,
    toggleFullscreen,
    setupSocketListeners,
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    if (socket) {
      setupSocketListeners(socket);
    }
  }, [socket, setupSocketListeners]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState, isMinimized]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState, isMinimized]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (callState === "idle") return null;

  if (callState === "incoming") {
    return (
      <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in select-none">
        <div className="w-full max-w-sm bg-[#0b101d] border border-indigo-500/35 rounded-3xl p-7 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95">
          <div className="relative mb-5">
            <div className="absolute -inset-4 rounded-full border border-indigo-500/40 animate-ping opacity-40" />
            <div className="absolute -inset-8 rounded-full border border-cyan-400/25 animate-pulse opacity-25" />
            <AvatarWithBadge
              name={peerUser?.name || "Caller"}
              src={peerUser?.avatar || ""}
              className="w-24 h-24 ring-4 ring-indigo-500/30 shadow-2xl"
            />
          </div>

          <p className="font-cursive text-4xl aurora-text leading-[0.8] mb-1">
            Incoming
          </p>
          <h3 className="font-display text-xl font-bold text-white tracking-tight">
            {peerUser?.name || "Unknown"}
          </h3>
          <p className="text-xs font-mono-tech text-cyan-400 font-medium mt-1.5 flex items-center gap-1.5">
            {callType === "audio" ? (
              <Phone className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <Video className="w-3.5 h-3.5 animate-pulse" />
            )}
            <span>{callType === "audio" ? "Voice Call" : "Video Call"}</span>
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
            <Lock className="w-3 h-3 text-indigo-400" />
            <span>End-to-End Encrypted WebRTC</span>
          </div>

          <div className="flex items-center justify-center gap-4 mt-8 w-full">
            <button
              type="button"
              onClick={rejectIncomingCall}
              className="flex-1 py-3 px-4 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Decline</span>
            </button>
            <button
              type="button"
              onClick={acceptIncomingCall}
              className="flex-1 py-3 px-4 rounded-full aurora-bg hover:opacity-90 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Accept</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-[99999] w-80 bg-[#0b101d] border border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-5 select-none">
        <audio ref={remoteAudioRef} autoPlay />
        <div className="p-3.5 bg-[#12182b] flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <AvatarWithBadge
              name={peerUser?.name || "Peer"}
              src={peerUser?.avatar || ""}
              className="w-7 h-7"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {peerUser?.name || "Peer"}
              </p>
              <p className="text-[10px] font-mono-tech text-cyan-400 font-medium">
                {callState === "connected" ? formatTimer(duration) : callStatus}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMinimize}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Expand Call"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => endCall()}
              className="p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer ml-1"
              title="End Call"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div
          onClick={toggleMinimize}
          className="aspect-video bg-[#05070e] relative flex items-center justify-center cursor-pointer group"
        >
          {callType === "video" ? (
            <>
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    isVideoOff ? "hidden" : "block"
                  }`}
                />
              )}
              {isVideoOff && !remoteStream && (
                <div className="flex flex-col items-center gap-1.5 animate-pulse">
                  <AvatarWithBadge
                    name={peerUser?.name || "Peer"}
                    src={peerUser?.avatar || ""}
                    className="w-10 h-10"
                  />
                  <span className="text-[11px] text-slate-400">Camera Off</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <AvatarWithBadge
                name={peerUser?.name || "Peer"}
                src={peerUser?.avatar || ""}
                className="w-12 h-12 ring-2 ring-indigo-500/40"
              />
              <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium">
                <Phone className="w-3.5 h-3.5 animate-pulse" />
                <span>Audio Call</span>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium backdrop-blur-xs">
            Click to Expand
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[99999] bg-[#05070e] flex flex-col animate-in fade-in select-none"
          : "fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 animate-in fade-in select-none"
      }
    >
      <audio ref={remoteAudioRef} autoPlay />
      <div
        className={
          isFullscreen
            ? "w-full h-full flex flex-col relative overflow-hidden bg-[#05070e]"
            : "w-full max-w-4xl h-[620px] max-h-[92vh] bg-[#05070e] border border-indigo-500/25 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative"
        }
      >
        <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 z-30 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-3">
            <AvatarWithBadge
              name={peerUser?.name || "Peer"}
              src={peerUser?.avatar || ""}
              className="w-10 h-10 ring-2 ring-indigo-400/50"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-white">
                  {peerUser?.name || "Peer"}
                </h3>
                <span className="text-[10px] font-mono-tech font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-cyan-300 border border-indigo-400/30">
                  {callType === "audio" ? "Voice HD" : "1080p HD"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-mono-tech text-cyan-400 font-medium">
                  {callState === "connected"
                    ? `Connected • ${formatTimer(duration)}`
                    : callStatus}
                </span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-indigo-400" />
                  Encrypted
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMinimize}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Minimize to Picture-in-Picture"
            >
              <Minus className="w-4 h-4" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={() => endCall()}
              className="p-2 rounded-full bg-white/10 hover:bg-red-600/80 text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
              title="Close Call"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 w-full h-full relative flex items-center justify-center bg-gradient-to-b from-[#0b101d] via-[#05070e] to-[#0b101d] overflow-hidden">
          <div className="absolute w-[450px] h-[450px] rounded-full bg-indigo-500/15 blur-3xl pointer-events-none animate-pulse" />

          {callType === "video" && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 z-10 text-center px-4">
              <div className="relative">
                {callState === "connected" && (
                  <>
                    <div className="absolute -inset-4 rounded-full border border-indigo-400/35 animate-ping opacity-30" />
                    <div className="absolute -inset-8 rounded-full border border-cyan-400/20 animate-pulse opacity-20" />
                  </>
                )}
                <AvatarWithBadge
                  name={peerUser?.name || "Peer"}
                  src={peerUser?.avatar || ""}
                  className="w-24 h-24 sm:w-28 sm:h-28 ring-4 ring-indigo-500/30 shadow-2xl"
                />
              </div>

              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {peerUser?.name || "Peer"}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  {callState === "connected"
                    ? callType === "audio"
                      ? "High-Definition Audio Call Active"
                      : "Video Call Connected"
                    : callStatus}
                </p>
              </div>

              {callState === "connected" && (
                <div className="flex items-center gap-1.5 h-6 mt-1">
                  <span className="w-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
                  <span className="w-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s] h-5" />
                  <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-6" />
                  <span className="w-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.2s] h-4" />
                  <span className="w-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.35s] h-2" />
                </div>
              )}
            </div>
          )}

          {callType === "video" && (
            <div className="absolute bottom-24 right-4 sm:bottom-28 sm:right-6 z-20 w-36 sm:w-52 aspect-video bg-[#12182b] border-2 border-white/20 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md transition-all hover:scale-105">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  isVideoOff ? "hidden" : "block"
                }`}
              />
              {isVideoOff && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#12182b] text-slate-400 text-xs">
                  <VideoOff className="w-5 h-5 mb-1 opacity-60" />
                  <span>Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-white font-medium flex items-center gap-1">
                <span>You</span>
                {isMicMuted && <MicOff className="w-2.5 h-2.5 text-red-400" />}
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-30 flex items-center justify-center bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          <div className="flex items-center gap-2 sm:gap-4 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#12182b]/90 border border-white/10 backdrop-blur-xl shadow-2xl">
            <button
              onClick={toggleMic}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isMicMuted
                  ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
              title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {callType === "video" && (
              <>
                <button
                  onClick={toggleCamera}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isVideoOff
                      ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                  title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
                >
                  {isVideoOff ? (
                    <VideoOff className="w-5 h-5" />
                  ) : (
                    <Video className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={toggleScreenShare}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isScreenSharing
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                  title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
                >
                  <ScreenShare className="w-5 h-5" />
                </button>
              </>
            )}

            <button
              onClick={toggleFullscreen}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={() => endCall()}
              className="px-5 py-2.5 sm:py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer ml-1"
              title="End Call"
            >
              <PhoneOff className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-semibold">End Call</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
