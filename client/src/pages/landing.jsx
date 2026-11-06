import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  ArrowRight,
  Zap,
  Shield,
  Video,
  Phone,
  Mic,
  Play,
  CheckCheck,
  Smile,
  Code2,
  Database,
  Server,
  Component,
  SunMoon,
  Sparkles,
  Pin,
  Lock,
  Radio,
  Share2,
  Users,
  Terminal,
  Activity,
  Layers,
  Check,
  Volume2,
} from "lucide-react";
import { toggleTheme } from "@/lib/theme";

const Landing = () => {
  const navigate = useNavigate();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");

  const fillDemo = () => {
    navigate("/sign-in?demo=true");
  };

  return (
    <div className="min-h-screen bg-[var(--color-base-bg)] text-[var(--color-base-text)] font-sans overflow-x-hidden selection:bg-emerald-500/20 selection:text-emerald-400">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-emerald-500/15 via-emerald-600/5 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-[30%] -left-40 w-[500px] h-[500px] bg-indigo-500/10 blur-3xl rounded-full" />
        <div className="absolute top-[60%] -right-40 w-[500px] h-[500px] bg-emerald-500/10 blur-3xl rounded-full" />
      </div>

      <nav className="w-full px-6 py-4 flex items-center justify-between border-b border-[var(--color-base-border)]/60 bg-[var(--color-base-bg)]/80 backdrop-blur-xl fixed top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-black shadow-lg shadow-emerald-500/20">
            <MessageSquare className="w-5 h-5 fill-black stroke-black" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-[var(--color-base-text)]">
              WhopChat
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              v2.0
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-medium text-[var(--color-base-muted)]">
          <a href="#features" className="hover:text-[var(--color-base-text)] transition-colors">
            Features
          </a>
          <a href="#preview" className="hover:text-[var(--color-base-text)] transition-colors">
            Live Demo
          </a>
          <a href="#security" className="hover:text-[var(--color-base-text)] transition-colors">
            Security
          </a>
          <a href="#architecture" className="hover:text-[var(--color-base-text)] transition-colors">
            Architecture
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-[var(--color-base-border)] bg-[var(--color-base-panel)] text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:bg-[var(--color-base-hover)] transition-colors cursor-pointer"
          >
            <SunMoon className="w-4 h-4" />
          </button>
          <Link
            to="/sign-in"
            className="text-xs font-semibold text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] transition-colors px-3 py-2 hidden sm:block"
          >
            Sign In
          </Link>
          <Link
            to="/sign-up"
            className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-xl text-xs font-bold tracking-tight transition-all shadow-md shadow-emerald-500/25 active:scale-95 flex items-center gap-1.5"
          >
            <span>Open WhopChat</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      <section className="pt-36 sm:pt-44 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] max-w-4xl text-[var(--color-base-text)]">
          Real-time messaging, <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
            engineered with pure craft.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-[var(--color-base-muted)] leading-relaxed mt-6 mb-10 max-w-2xl">
          Sub-12ms WebSocket messaging, crystal-clear WebRTC voice and video calls,
          AES-256-GCM encryption at rest, and an intelligent neural AI assistant —
          built for high-velocity teams.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Link
            to="/sign-up"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm tracking-tight flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
          >
            <span>Start Chatting Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={fillDemo}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-[var(--color-base-border)] bg-[var(--color-base-panel)] hover:bg-[var(--color-base-hover)] text-[var(--color-base-text)] font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>1-Click Demo Evaluation</span>
          </button>
        </div>

        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-left border-y border-[var(--color-base-border)]/60 py-6 w-full max-w-4xl">
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--color-base-text)]">
              &lt; 12ms
            </div>
            <div className="text-xs text-[var(--color-base-muted)] mt-0.5">
              WebSocket Dispatch
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
              WebRTC P2P
            </div>
            <div className="text-xs text-[var(--color-base-muted)] mt-0.5">
              1080p Video & Voice
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--color-base-text)]">
              AES-256-GCM
            </div>
            <div className="text-xs text-[var(--color-base-muted)] mt-0.5">
              Encrypted at Rest
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-sky-400">
              WhopAI 2.0
            </div>
            <div className="text-xs text-[var(--color-base-muted)] mt-0.5">
              Integrated Neural Assistant
            </div>
          </div>
        </div>
      </section>

      <section id="preview" className="px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto pb-24">
        <div className="relative rounded-3xl border border-[var(--color-base-border)] bg-[var(--color-base-panel)] shadow-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--color-base-border)] bg-[var(--color-base-bg)] flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="text-xs font-mono text-[var(--color-base-muted)] ml-3">
                whopchat.app/chat/team-core
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Engine Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
            <div className="hidden lg:flex lg:col-span-4 border-r border-[var(--color-base-border)] bg-[var(--color-base-bg)]/60 flex-col">
              <div className="p-4 border-b border-[var(--color-base-border)] flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-base-muted)]">
                  Active Conversations
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">
                  3 Online
                </span>
              </div>

              <div className="divide-y divide-[var(--color-base-border)]/40 flex-1 overflow-hidden">
                <div className="p-3.5 bg-[var(--color-base-panel)] border-l-2 border-emerald-500 flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                      PE
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--color-base-bg)]" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[var(--color-base-text)] truncate">
                        Product Engineering
                      </p>
                      <span className="text-[10px] text-emerald-400 font-medium">Just now</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-base-muted)] truncate mt-0.5">
                      Alex: WebRTC call latency is down to 8ms!
                    </p>
                  </div>
                </div>

                <div className="p-3.5 hover:bg-[var(--color-base-hover)] flex items-center gap-3 cursor-pointer transition-colors">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs border border-sky-500/30">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--color-base-bg)]" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[var(--color-base-text)] truncate flex items-center gap-1">
                        <span>WhopAI Assistant</span>
                        <span className="text-[9px] px-1 rounded bg-sky-500/20 text-sky-400">AI</span>
                      </p>
                      <span className="text-[10px] text-[var(--color-base-muted)]">2m</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-base-muted)] truncate mt-0.5">
                      Ready to assist with code, queries, and summaries.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 hover:bg-[var(--color-base-hover)] flex items-center gap-3 cursor-pointer transition-colors">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/30">
                      PS
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--color-base-bg)]" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[var(--color-base-text)] truncate">
                        Priya Sharma
                      </p>
                      <span className="text-[10px] text-[var(--color-base-muted)]">12m</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-base-muted)] truncate mt-0.5 flex items-center gap-1">
                      <Mic className="w-3 h-3 text-emerald-400" />
                      <span>Voice note (0:24)</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col bg-[var(--color-base-panel)]">
              <div className="p-4 border-b border-[var(--color-base-border)] flex items-center justify-between bg-[var(--color-base-bg)]/80">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                    PE
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--color-base-text)] flex items-center gap-2">
                      <span>Product Engineering</span>
                      <span className="text-[10px] font-normal text-emerald-400 font-mono">
                        #channel
                      </span>
                    </h4>
                    <p className="text-[11px] text-[var(--color-base-muted)]">
                      8 participants • 3 online
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5">
                    <Phone className="w-3 h-3 animate-pulse" />
                    <span>Voice HD Active</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg border border-[var(--color-base-border)] bg-[var(--color-base-panel)] flex items-center justify-center text-[var(--color-base-muted)]">
                    <Video className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="px-4 py-2 border-b border-[var(--color-base-border)] bg-emerald-500/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Pin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400 font-semibold shrink-0">Pinned:</span>
                  <span className="text-[var(--color-base-text)] truncate">
                    Production deployment v2.0 verified with AES-256-GCM encryption & WebRTC voice.
                  </span>
                </div>
                <span className="text-[10px] text-[var(--color-base-muted)] shrink-0 font-mono ml-2">
                  Today
                </span>
              </div>

              <div className="flex-1 p-5 space-y-4 text-left overflow-y-auto">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    AK
                  </div>
                  <div className="flex-1 max-w-[85%]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[var(--color-base-text)]">
                        Alex Kumar
                      </span>
                      <span className="text-[10px] text-[var(--color-base-muted)]">
                        10:42 AM
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl rounded-tl-xs bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-xs text-[var(--color-base-text)] leading-relaxed shadow-xs">
                      Just conducted a multi-party call test over the WebRTC signaling gateway.
                      Audio clarity is pristine with zero packet drop!
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 flex-row-reverse">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    ME
                  </div>
                  <div className="flex-1 max-w-[85%] flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-[var(--color-base-muted)]">
                        10:44 AM
                      </span>
                      <span className="text-xs font-semibold text-[var(--color-base-text)]">
                        You
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl rounded-tr-xs bg-emerald-500 text-black text-xs leading-relaxed shadow-md flex items-center gap-3">
                      <button
                        onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                        className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-black transition-colors cursor-pointer shrink-0"
                      >
                        {isPlayingAudio ? (
                          <Volume2 className="w-4 h-4 animate-pulse" />
                        ) : (
                          <Play className="w-4 h-4 fill-black ml-0.5" />
                        )}
                      </button>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 h-5">
                          {[14, 22, 10, 26, 18, 8, 24, 16, 20, 12, 28, 14, 18, 22, 10, 16].map(
                            (h, i) => (
                              <span
                                key={i}
                                style={{ height: `${h}px` }}
                                className={`w-0.5 rounded-full transition-all ${
                                  isPlayingAudio ? "bg-black animate-pulse" : "bg-black/60"
                                }`}
                              />
                            )
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-medium text-black/75">
                          <span>0:24</span>
                          <span className="font-mono bg-black/15 px-1 rounded">1.5x</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-400 font-medium">
                      <Lock className="w-3 h-3 text-emerald-500" />
                      <span>AES-256-GCM Encrypted</span>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400 ml-1" />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-emerald-400 text-black flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 max-w-[85%]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[var(--color-base-text)] flex items-center gap-1">
                        <span>WhopAI Assistant</span>
                        <span className="text-[9px] px-1 rounded bg-sky-500/20 text-sky-400">AI</span>
                      </span>
                      <span className="text-[10px] text-[var(--color-base-muted)]">
                        10:45 AM
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl rounded-tl-xs bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-xs text-[var(--color-base-text)] leading-relaxed shadow-xs">
                      <p className="mb-2">
                        Summary of current channel activities:
                      </p>
                      <ul className="space-y-1 list-disc list-inside text-[var(--color-base-muted)]">
                        <li>WebRTC voice connection verified active with STUN negotiation.</li>
                        <li>Database compound indexes synced on MongoDB 8.x.</li>
                        <li>All messages secured with authenticated Galois/Counter Mode.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 border-t border-[var(--color-base-border)] bg-[var(--color-base-bg)] flex items-center gap-3">
                <Smile className="w-5 h-5 text-[var(--color-base-muted)] cursor-pointer hover:text-[var(--color-base-text)] transition-colors" />
                <div className="flex-1 h-9 px-3 rounded-lg bg-[var(--color-base-panel)] border border-[var(--color-base-border)] flex items-center text-xs text-[var(--color-base-muted)]">
                  Type a message or press 🎙️ for instant voice note...
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-black font-semibold cursor-pointer shadow-xs">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-6 max-w-7xl mx-auto text-left">
        <div className="max-w-2xl mb-14">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
            Built from First Principles
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-base-text)]">
            Everything your team needs. Nothing it doesn't.
          </h3>
          <p className="text-sm text-[var(--color-base-muted)] mt-3 leading-relaxed">
            Engineered with deep craft, standard MERN architecture, zero third-party bloat,
            and complete ownership of your communications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-[var(--color-base-border)] bg-[var(--color-base-panel)] flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Video className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[var(--color-base-text)] mb-2">
                WebRTC HD Audio & Video Calls
              </h4>
              <p className="text-xs text-[var(--color-base-muted)] leading-relaxed">
                Peer-to-peer 1080p video, high-definition voice, screen sharing,
                and picture-in-picture minimize mode powered by modern browser media engines.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--color-base-border)] flex items-center gap-2 text-[11px] font-semibold text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              <span>Full P2P with STUN fallback</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--color-base-border)] bg-[var(--color-base-panel)] flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[var(--color-base-text)] mb-2">
                Sub-12ms Real-Time Sockets
              </h4>
              <p className="text-xs text-[var(--color-base-muted)] leading-relaxed">
                Socket.io room clusters provide instant messaging, typing indicators,
                message reactions, and live user presence with automatic reconnection.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--color-base-border)] flex items-center gap-2 text-[11px] font-semibold text-sky-400">
              <Check className="w-3.5 h-3.5" />
              <span>Room multiplexing & read receipts</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--color-base-border)] bg-[var(--color-base-panel)] flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[var(--color-base-text)] mb-2">
                AES-256-GCM Chat Encryption
              </h4>
              <p className="text-xs text-[var(--color-base-muted)] leading-relaxed">
                Authenticated encryption at rest using 256-bit derived keys, unique 12-byte
                initialization vectors, and 16-byte authentication tags per message.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--color-base-border)] flex items-center gap-2 text-[11px] font-semibold text-purple-400">
              <Check className="w-3.5 h-3.5" />
              <span>Zero plaintext exposure in database</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--color-base-border)] bg-[var(--color-base-panel)] flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Mic className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[var(--color-base-text)] mb-2">
                Voice Notes & Audio Waveforms
              </h4>
              <p className="text-xs text-[var(--color-base-muted)] leading-relaxed">
                Capture crisp voice notes directly in the browser with live visual waveform
                scrubbing, variable playback speeds (1x, 1.5x, 2x), and instant playback.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--color-base-border)] flex items-center gap-2 text-[11px] font-semibold text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              <span>Web Audio API visualizer</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--color-base-border)] bg-[var(--color-base-panel)] flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[var(--color-base-text)] mb-2">
                WhopAI Neural Assistant
              </h4>
              <p className="text-xs text-[var(--color-base-muted)] leading-relaxed">
                Integrated generative AI partner with conversational memory, code snippet
                formatting, and instant context reasoning ready inside your sidebar.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--color-base-border)] flex items-center gap-2 text-[11px] font-semibold text-amber-400">
              <Check className="w-3.5 h-3.5" />
              <span>Custom Neural Prism architecture</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--color-base-border)] bg-[var(--color-base-panel)] flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[var(--color-base-text)] mb-2">
                Granular Group Administration
              </h4>
              <p className="text-xs text-[var(--color-base-muted)] leading-relaxed">
                Dedicated group channels with admin promotion/demotion, member kick capabilities,
                pinned announcements, and media document galleries.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--color-base-border)] flex items-center gap-2 text-[11px] font-semibold text-teal-400">
              <Check className="w-3.5 h-3.5" />
              <span>Role-based access controls</span>
            </div>
          </div>
        </div>
      </section>

      <section id="architecture" className="py-20 border-t border-[var(--color-base-border)]/60 bg-[var(--color-base-panel)]/40 px-6">
        <div className="max-w-7xl mx-auto text-left">
          <div className="max-w-2xl mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
              Full-Stack Architecture
            </h2>
            <h3 className="text-3xl font-extrabold tracking-tight text-[var(--color-base-text)]">
              Engineered with modern, open standards.
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl border border-[var(--color-base-border)] bg-[var(--color-base-bg)]">
              <Database className="w-6 h-6 text-emerald-400 mb-3" />
              <h4 className="text-sm font-bold text-[var(--color-base-text)] mb-1">
                MongoDB 8.x
              </h4>
              <p className="text-xs text-[var(--color-base-muted)] leading-relaxed">
                Compound indexed collections, unique constraints, and automatic embedded fallback.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--color-base-border)] bg-[var(--color-base-bg)]">
              <Server className="w-6 h-6 text-sky-400 mb-3" />
              <h4 className="text-sm font-bold text-[var(--color-base-text)] mb-1">
                Express 5 & Node.js
              </h4>
              <p className="text-xs text-[var(--color-base-muted)] leading-relaxed">
                TypeScript-driven REST endpoints, rate limiting, and HTTP-only cookie token rotation.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--color-base-border)] bg-[var(--color-base-bg)]">
              <Component className="w-6 h-6 text-teal-400 mb-3" />
              <h4 className="text-sm font-bold text-[var(--color-base-text)] mb-1">
                React 19 & Tailwind v4
              </h4>
              <p className="text-xs text-[var(--color-base-muted)] leading-relaxed">
                Radix UI primitives, Lucide icons, Sonner toasts, and dynamic theme switching.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--color-base-border)] bg-[var(--color-base-bg)]">
              <Radio className="w-6 h-6 text-purple-400 mb-3" />
              <h4 className="text-sm font-bold text-[var(--color-base-text)] mb-1">
                Socket.io & WebRTC
              </h4>
              <p className="text-xs text-[var(--color-base-muted)] leading-relaxed">
                Authenticated socket handshakes, room multiplexing, and STUN peer-to-peer streaming.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 text-center max-w-4xl mx-auto">
        <div className="p-10 sm:p-14 rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 via-[var(--color-base-panel)] to-[var(--color-base-bg)] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-base-text)] tracking-tight mb-4">
            Ready to upgrade your team's communication?
          </h2>
          <p className="text-sm sm:text-base text-[var(--color-base-muted)] max-w-lg mx-auto mb-8 leading-relaxed">
            Experience sub-millisecond real-time messaging, WebRTC calls, and authenticated
            chat encryption with zero setup hassle.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/sign-up"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm tracking-tight shadow-xl shadow-emerald-500/25 transition-all active:scale-95"
            >
              Get Started Free
            </Link>
            <button
              onClick={fillDemo}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-[var(--color-base-border)] bg-[var(--color-base-bg)] hover:bg-[var(--color-base-hover)] text-[var(--color-base-text)] text-sm font-semibold transition-colors cursor-pointer"
            >
              Demo Credentials (1-Click)
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--color-base-border)]/60 py-10 px-6 bg-[var(--color-base-panel)]/30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[var(--color-base-muted)]">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-black">
              <MessageSquare className="w-3.5 h-3.5 fill-black stroke-black" />
            </div>
            <span className="font-bold text-[var(--color-base-text)]">WhopChat Platform</span>
            <span>•</span>
            <span>Engineered on MERN Stack</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>All Systems Operational • 99.99% Uptime</span>
          </div>

          <div className="flex items-center gap-5">
            <Link to="/sign-in" className="hover:text-[var(--color-base-text)] transition-colors">
              Sign In
            </Link>
            <Link to="/sign-up" className="hover:text-[var(--color-base-text)] transition-colors">
              Sign Up
            </Link>
            <Link to="/chat" className="hover:text-[var(--color-base-text)] transition-colors">
              Chat
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
