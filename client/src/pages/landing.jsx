import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Flame,
  Radio,
  Newspaper,
  BarChart3,
  Clock,
  SunMoon,
  Check,
  Copy,
  Database,
  Server,
  Component,
  Zap,
  RotateCcw,
} from "lucide-react";
import { toggleTheme } from "@/lib/theme";
import Logo from "@/components/logo";
import {
  ScrollProgressBar,
  RevealBlock,
  SplitLineReveal,
  ScrollScrubRow,
  ScrollScaleFrame,
} from "@/components/motion/scroll-primitives";

const CAPABILITIES = [
  {
    index: "01",
    tag: "Inline Assistant",
    title: "Ask @whopai in any room",
    cursive: "In-thread",
    desc: "Mention @whopai right inside a conversation to catch up on missed messages, draft a reply, or summarize a voice note.",
    icon: Sparkles,
    meta: "Context aware",
  },
  {
    index: "02",
    tag: "Timed Notes",
    title: "Disappearing ink",
    cursive: "Temporary",
    desc: "Attach an expiration timer (30s, 5m, or 1h) to sensitive notes so they fade out of view and expire from storage.",
    icon: Flame,
    meta: "TTL expiration",
  },
  {
    index: "03",
    tag: "Shared Focus",
    title: "Sprint timer & walkie-talkie",
    cursive: "Together",
    desc: "Run a 25-minute focus timer synced to the room header, or hold to send a short voice burst without starting a call.",
    icon: Radio,
    meta: "Room synced",
  },
  {
    index: "04",
    tag: "Thread Recaps",
    title: "Editorial digests",
    cursive: "Readable",
    desc: "Collect the key moments of a busy channel into a tidy summary card you can post back to the group or save as Markdown.",
    icon: Newspaper,
    meta: "Markdown export",
  },
  {
    index: "05",
    tag: "Quick Decisions",
    title: "Live polls & code blocks",
    cursive: "Decisive",
    desc: "Settle questions with live-updating polls and share syntax-labeled code snippets with one-click copy.",
    icon: BarChart3,
    meta: "Real-time votes",
  },
  {
    index: "06",
    tag: "Quiet Delivery",
    title: "Whispers & scheduled send",
    cursive: "Intentional",
    desc: "Direct a private whisper to specific members of a group, or queue a message to send at a better time.",
    icon: Clock,
    meta: "Timed dispatch",
  },
];

const ARCHITECTURE_STACK = [
  {
    num: "01",
    layer: "Database",
    name: "MongoDB & Mongoose",
    detail: "Compound indexes for fast thread queries, strict ObjectId checks, and TTL indexes for self-expiring messages.",
    icon: Database,
  },
  {
    num: "02",
    layer: "API & Worker",
    name: "Express & TypeScript",
    detail: "Zod input validation, rate limiting, HTTP-only refresh cookies, and a background dispatcher for scheduled messages.",
    icon: Server,
  },
  {
    num: "03",
    layer: "Realtime & Calls",
    name: "Socket.io & WebRTC",
    detail: "Room-isolated messaging, read receipts, live poll updates, walkie-talkie audio bursts, and peer-to-peer calls.",
    icon: Zap,
  },
  {
    num: "04",
    layer: "Interface",
    name: "React 19 & Tailwind CSS",
    detail: "Accessible keyboard shortcuts, persistent light and dark themes, and reduced-motion support.",
    icon: Component,
  },
];

const SAMPLE_SNIPPET = `const ttl = expiresAt ? new Date(expiresAt) : null;\nawait Message.create({\n  chatId,\n  content,\n  expiresAt: ttl,\n});`;

const Landing = () => {
  const [activeTab, setActiveTab] = useState("poll");

  const [pollQuestion, setPollQuestion] = useState("When should we review the release notes?");
  const [pollVotes, setPollVotes] = useState({ a: 1, b: 0, c: 0 });
  const [selectedVote, setSelectedVote] = useState("a");

  const [burnText, setBurnText] = useState("Staging credentials expire right after this note.");
  const [burnDuration, setBurnDuration] = useState(10);
  const [burnLeft, setBurnLeft] = useState(null);
  const [isBurning, setIsBurning] = useState(false);

  const [copiedCode, setCopiedCode] = useState(false);

  const [healthStatus, setHealthStatus] = useState({
    checked: false,
    ok: false,
    pingMs: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";
    fetch(`${apiBase}/api/health`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setHealthStatus({
          checked: true,
          ok: Boolean(data?.success),
          pingMs: typeof data?.database?.pingMs === "number" ? data.database.pingMs : null,
        });
      })
      .catch(() => {
        setHealthStatus({ checked: true, ok: false, pingMs: null });
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (burnLeft === null) return;
    if (burnLeft <= 0) {
      setIsBurning(true);
      const t = setTimeout(() => {
        setBurnLeft(null);
        setIsBurning(false);
      }, 650);
      return () => clearTimeout(t);
    }
    const timer = setTimeout(() => setBurnLeft((prev) => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [burnLeft]);

  const handleSandboxVote = (key) => {
    if (selectedVote === key) return;
    setPollVotes((prev) => ({
      ...prev,
      [selectedVote]: Math.max(0, prev[selectedVote] - 1),
      [key]: prev[key] + 1,
    }));
    setSelectedVote(key);
  };

  const totalSandboxVotes = pollVotes.a + pollVotes.b + pollVotes.c;

  const startBurnPreview = () => {
    if (!burnText.trim()) return;
    setIsBurning(false);
    setBurnLeft(burnDuration);
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(SAMPLE_SNIPPET);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  return (
    <div className="min-h-screen bg-[var(--color-base-bg)] text-[var(--color-base-text)] overflow-x-hidden relative selection:bg-indigo-500 selection:text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-48 left-[15%] w-[620px] h-[620px] rounded-full bg-indigo-500/20 blur-[140px] animate-aurora-drift" />
        <div className="absolute top-[28%] right-[5%] w-[520px] h-[520px] rounded-full bg-cyan-500/15 blur-[130px] animate-aurora-drift [animation-delay:-4s]" />
        <div className="absolute bottom-[5%] left-[25%] w-[560px] h-[560px] rounded-full bg-violet-600/15 blur-[140px] animate-aurora-drift [animation-delay:-8s]" />
      </div>
      <div className="fixed inset-0 pointer-events-none grain-overlay opacity-[0.025] z-50" />
      <ScrollProgressBar />

      <header className="fixed top-0 left-0 right-0 z-40 border-b border-[var(--color-base-border)] glass-surface">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
          </div>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-8 text-[11px] font-mono-tech uppercase tracking-[0.16em] text-[var(--color-base-muted)]"
          >
            <a href="#sandbox" className="hover:text-[var(--color-base-text)] transition-colors">
              01 / Interactive
            </a>
            <a href="#capabilities" className="hover:text-[var(--color-base-text)] transition-colors">
              02 / Features
            </a>
            <a href="#architecture" className="hover:text-[var(--color-base-text)] transition-colors">
              03 / Stack
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className="w-9 h-9 rounded-full flex items-center justify-center border border-[var(--color-base-border)] bg-[var(--color-base-surface)] text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] hover:border-indigo-400 transition-colors cursor-pointer"
            >
              <SunMoon className="w-4 h-4" />
            </button>
            <Link
              to="/sign-in"
              className="hidden sm:inline-flex px-4 py-2 text-xs font-medium text-[var(--color-base-muted)] hover:text-[var(--color-base-text)] transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/sign-up"
              className="group relative overflow-hidden inline-flex items-center gap-2 px-5 py-2.5 rounded-full aurora-bg text-white text-xs font-semibold tracking-tight shadow-lg shadow-indigo-500/25 transition-transform active:scale-95"
            >
              <span>Create account</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-5 sm:px-10 max-w-[1440px] mx-auto relative">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-base-border)] pb-5 mb-10 sm:mb-14">
            <div className="flex items-center gap-3 text-[11px] font-mono-tech uppercase tracking-[0.2em] text-[var(--color-base-muted)]">
              <span className="w-2 h-2 rounded-full bg-[var(--color-accent-cyan)]" />
              <span>Private Team Messaging &amp; Live Rooms</span>
            </div>
            <div className="flex items-center gap-6 text-[11px] font-mono-tech uppercase tracking-[0.18em] text-[var(--color-base-muted)]">
              <span>Encrypted Storage</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">WebRTC Calls</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Inline @whopai</span>
            </div>
          </div>

          <div className="relative">
            <h1 className="font-display font-extrabold tracking-[-0.04em] leading-[0.9] text-[clamp(3rem,8.5vw,8rem)] text-[var(--color-base-text)]">
              <span className="block">
                <SplitLineReveal delay={40}>Where teams talk,</SplitLineReveal>
              </span>
              <span className="flex flex-wrap items-baseline gap-x-4 sm:gap-x-7 my-1 sm:my-2">
                <SplitLineReveal
                  delay={140}
                  className="font-editorial italic font-normal tracking-[-0.02em] text-[clamp(2.5rem,6vw,5.4rem)] text-[var(--color-base-muted)]"
                >
                  think
                </SplitLineReveal>
                <SplitLineReveal
                  delay={220}
                  rotate={1.5}
                  className="font-cursive font-normal tracking-normal text-[clamp(4.4rem,12vw,11rem)] leading-[0.75] aurora-text pr-4 pt-2"
                >
                  together
                </SplitLineReveal>
              </span>
              <span className="block">
                <SplitLineReveal delay={320}>&amp; decide faster.</SplitLineReveal>
              </span>
            </h1>

            <div className="hidden xl:flex absolute right-6 top-8 w-32 h-32 items-center justify-center animate-float-slow pointer-events-none select-none">
              <svg viewBox="0 0 120 120" className="w-full h-full animate-[spin_22s_linear_infinite]">
                <defs>
                  <path
                    id="studioCircle"
                    d="M 60, 60 m -44, 0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0"
                  />
                </defs>
                <text className="fill-[var(--color-base-muted)] text-[9.2px] font-mono-tech uppercase tracking-[0.24em]">
                  <textPath href="#studioCircle">
                    ENCRYPTED • REALTIME • WHOPCHAT •
                  </textPath>
                </text>
              </svg>
              <span className="font-cursive text-4xl aurora-text absolute">W</span>
            </div>
          </div>

          <div className="mt-12 sm:mt-16 pt-8 border-t border-[var(--color-base-border)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-6">
              <p className="text-base sm:text-xl text-[var(--color-base-muted)] leading-relaxed max-w-xl font-normal">
                Direct messages, group channels, voice notes, peer-to-peer calls, and an inline assistant — gathered into one{" "}
                <span className="font-editorial italic text-2xl text-[var(--color-base-text)]">
                  calm workspace
                </span>{" "}
                that stays out of your way.
              </p>
            </div>

            <div className="lg:col-span-6 flex flex-col sm:flex-row lg:justify-end items-stretch sm:items-center gap-3.5">
              <Link
                to="/sign-up"
                className="group px-7 py-4 rounded-full aurora-bg text-white font-semibold text-sm tracking-tight flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-500/25 hover:opacity-95 transition-all active:scale-95"
              >
                <span>Create an account</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/sign-in"
                className="px-7 py-4 rounded-full border border-[var(--color-base-border)] bg-[var(--color-base-surface)] hover:border-indigo-400 text-[var(--color-base-text)] font-medium text-sm flex items-center justify-center gap-2.5 transition-colors"
              >
                <span>Sign in</span>
              </Link>
            </div>
          </div>
        </section>

        <div className="border-y border-[var(--color-base-border)] bg-[var(--color-base-panel)]/70 py-5 overflow-hidden select-none">
          <div className="flex whitespace-nowrap animate-marquee-left items-center">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex items-center gap-10 pr-10">
                <span className="font-display text-xl sm:text-2xl font-bold tracking-tight">
                  Direct &amp; Group Rooms
                </span>
                <span className="font-cursive text-4xl sm:text-5xl aurora-text leading-none">
                  Disappearing Ink
                </span>
                <span className="font-display text-xl sm:text-2xl font-bold tracking-tight">
                  Live Polls
                </span>
                <span className="font-cursive text-4xl sm:text-5xl aurora-text leading-none">
                  Focus Sprints
                </span>
                <span className="font-display text-xl sm:text-2xl font-bold tracking-tight">
                  Whispers &amp; Scheduling
                </span>
                <span className="font-cursive text-4xl sm:text-5xl aurora-text leading-none">
                  Thread Digests
                </span>
              </div>
            ))}
          </div>
        </div>

        <section className="py-24 sm:py-36 overflow-hidden border-b border-[var(--color-base-border)]">
          <div className="space-y-4 sm:space-y-6 select-none">
            <ScrollScrubRow direction={1} distance={160} className="flex items-baseline whitespace-nowrap gap-6 -ml-24">
              <span className="font-display font-extrabold text-[clamp(3rem,8vw,7.5rem)] tracking-[-0.04em] leading-none">
                Clear threads.
              </span>
              <span className="font-cursive text-[clamp(4.4rem,10.5vw,9.5rem)] aurora-text leading-[0.75]">
                Fewer meetings.
              </span>
              <span className="font-display font-extrabold text-[clamp(3rem,8vw,7.5rem)] tracking-[-0.04em] leading-none opacity-25">
                Calm pace.
              </span>
            </ScrollScrubRow>

            <ScrollScrubRow direction={-1} distance={160} className="flex items-baseline whitespace-nowrap gap-6 -ml-10">
              <span className="font-cursive text-[clamp(4.4rem,10.5vw,9.5rem)] aurora-text leading-[0.75]">
                Built to stay
              </span>
              <span className="font-display font-extrabold text-[clamp(3rem,8vw,7.5rem)] tracking-[-0.04em] leading-none">
                out of your way.
              </span>
              <span className="font-editorial italic text-[clamp(3rem,7.5vw,7rem)] text-[var(--color-base-muted)] leading-none">
                every day
              </span>
            </ScrollScrubRow>
          </div>
        </section>

        <section id="sandbox" className="py-24 sm:py-32 px-5 sm:px-10 max-w-[1440px] mx-auto">
          <RevealBlock className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-[11px] font-mono-tech uppercase tracking-[0.2em] text-[var(--color-accent-cyan)] block mb-3">
                01 / Try how it feels
              </span>
              <h2 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-[-0.03em] leading-[0.98]">
                Interactive{" "}
                <span className="font-cursive font-normal text-[1.45em] aurora-text leading-[0.7]">
                  Controls
                </span>
              </h2>
            </div>

            <div className="inline-flex p-1 rounded-full border border-[var(--color-base-border)] bg-[var(--color-base-panel)] w-fit">
              {[
                { id: "poll", label: "Poll" },
                { id: "burn", label: "Burn Timer" },
                { id: "code", label: "Code Snippet" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-mono-tech uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "aurora-bg text-white shadow-sm"
                      : "text-[var(--color-base-muted)] hover:text-[var(--color-base-text)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </RevealBlock>

          <ScrollScaleFrame>
            <div className="p-[1px] rounded-3xl bg-gradient-to-br from-indigo-500/40 via-violet-500/20 to-cyan-400/40 shadow-2xl shadow-indigo-500/10">
              <div className="rounded-[23px] bg-[var(--color-base-surface)] p-6 sm:p-10 min-h-[380px] flex flex-col justify-between">
                {activeTab === "poll" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-5 space-y-4">
                      <span className="text-[10px] font-mono-tech uppercase tracking-widest text-indigo-400">
                        Interactive Poll Preview
                      </span>
                      <h3 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
                        Settle decisions without long threads.
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--color-base-muted)] leading-relaxed">
                        Edit the question below and click an option to test how live percentages animate inside any chat room.
                      </p>
                      <input
                        type="text"
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        aria-label="Sandbox poll question"
                        className="w-full h-10 px-4 rounded-xl bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-xs focus:outline-none focus:border-indigo-400"
                      />
                    </div>

                    <div className="lg:col-span-7">
                      <div className="p-6 rounded-3xl bg-[var(--color-base-panel)] border border-[var(--color-base-border)] space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-mono-tech uppercase tracking-wider text-[var(--color-base-muted)]">
                          <span>Live Poll</span>
                          <span>{totalSandboxVotes} vote</span>
                        </div>
                        <p className="font-display font-bold text-base">
                          {pollQuestion || "Your poll question"}
                        </p>
                        {[
                          { key: "a", text: "Today at 4:00 PM" },
                          { key: "b", text: "Tomorrow morning" },
                          { key: "c", text: "Async in thread" },
                        ].map((opt) => {
                          const count = pollVotes[opt.key];
                          const pct = totalSandboxVotes > 0 ? Math.round((count / totalSandboxVotes) * 100) : 0;
                          const active = selectedVote === opt.key;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => handleSandboxVote(opt.key)}
                              className={`w-full relative overflow-hidden rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                                active
                                  ? "border-indigo-400 bg-[var(--color-base-surface)]"
                                  : "border-[var(--color-base-border)] bg-[var(--color-base-bg)] hover:border-indigo-400/50"
                              }`}
                            >
                              <div
                                className="absolute inset-y-0 left-0 bg-indigo-500/20 transition-all duration-700 ease-out"
                                style={{ width: `${pct}%` }}
                              />
                              <div className="relative flex items-center justify-between text-xs">
                                <span className="font-medium flex items-center gap-2">
                                  {active && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                                  <span>{opt.text}</span>
                                </span>
                                <span className="font-mono-tech text-[11px] text-indigo-400">
                                  {pct}%
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "burn" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-5 space-y-4">
                      <span className="text-[10px] font-mono-tech uppercase tracking-widest text-amber-400">
                        Disappearing Ink Preview
                      </span>
                      <h3 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
                        Notes that clear themselves when time runs out.
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--color-base-muted)] leading-relaxed">
                        In the real workspace, timed messages use MongoDB TTL indexes to purge automatically. Test the fade-out effect here.
                      </p>
                      <div className="flex items-center gap-2">
                        {[5, 10, 30].map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => setBurnDuration(sec)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-mono-tech cursor-pointer ${
                              burnDuration === sec
                                ? "aurora-bg text-white"
                                : "bg-[var(--color-base-panel)] border border-[var(--color-base-border)] text-[var(--color-base-muted)]"
                            }`}
                          >
                            {sec}s
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={startBurnPreview}
                          className="ml-auto px-5 py-1.5 rounded-full bg-amber-500 text-black font-semibold text-xs cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-1.5"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>Start Timer</span>
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-7 space-y-3">
                      <input
                        type="text"
                        value={burnText}
                        onChange={(e) => setBurnText(e.target.value)}
                        aria-label="Timed note message"
                        className="w-full h-10 px-4 rounded-xl bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-xs focus:outline-none focus:border-amber-400"
                      />
                      <div className="min-h-[120px] flex items-center justify-center rounded-3xl border border-dashed border-[var(--color-base-border)] bg-[var(--color-base-panel)]/50 p-6">
                        {burnLeft === null && !isBurning ? (
                          <div className="text-center space-y-2">
                            <p className="text-xs text-[var(--color-base-muted)]">
                              Click <span className="font-semibold text-[var(--color-base-text)]">Start Timer</span> to watch the timed message dissolve.
                            </p>
                            <button
                              type="button"
                              onClick={startBurnPreview}
                              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:underline cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" /> Preview now
                            </button>
                          </div>
                        ) : (
                          <div
                            className={`w-full max-w-md p-4 rounded-2xl aurora-bg text-white shadow-lg transition-all ${
                              isBurning ? "animate-ink-burn" : "animate-message-in"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-[10px] font-mono-tech uppercase tracking-wider text-amber-200 mb-1.5">
                              <Flame className="w-3 h-3 animate-pulse" />
                              <span>Expires in {burnLeft}s</span>
                            </div>
                            <p className="text-xs leading-relaxed">{burnText}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "code" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-5 space-y-4">
                      <span className="text-[10px] font-mono-tech uppercase tracking-widest text-cyan-400">
                        Structured Code Sharing
                      </span>
                      <h3 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
                        Keep indentation and context intact.
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--color-base-muted)] leading-relaxed">
                        Send labeled code blocks straight from the composer without losing formatting or digging through pasted walls of text.
                      </p>
                    </div>

                    <div className="lg:col-span-7">
                      <div className="rounded-2xl overflow-hidden border border-[var(--color-base-border)] bg-[#05070e] text-[#e2e8f0] shadow-xl">
                        <div className="px-4 py-2.5 border-b border-white/10 bg-white/5 flex items-center justify-between text-[10px] font-mono-tech">
                          <span className="uppercase tracking-wider text-cyan-300">
                            typescript • ephemeral.ts
                          </span>
                          <button
                            type="button"
                            onClick={copySnippet}
                            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer flex items-center gap-1"
                          >
                            {copiedCode ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedCode ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                        <pre className="p-5 text-xs font-mono-tech overflow-x-auto leading-relaxed">
                          <code>{SAMPLE_SNIPPET}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollScaleFrame>
        </section>

        <section id="capabilities" className="py-24 sm:py-32 px-5 sm:px-10 max-w-[1440px] mx-auto">
          <RevealBlock className="mb-14 sm:mb-20 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <span className="text-[11px] font-mono-tech uppercase tracking-[0.2em] text-[var(--color-accent-cyan)] block mb-3">
                02 / Capabilities
              </span>
              <h2 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-[-0.03em] leading-[0.98]">
                Thoughtful tools for{" "}
                <span className="font-cursive font-normal text-[1.45em] aurora-text leading-[0.7]">
                  daily work
                </span>
              </h2>
            </div>
            <p className="text-sm text-[var(--color-base-muted)] max-w-md leading-relaxed">
              Every feature is wired through authenticated sockets and validated storage — ready when your team signs in.
            </p>
          </RevealBlock>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CAPABILITIES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <RevealBlock
                  key={item.index}
                  delay={idx * 70}
                  className="group rounded-3xl border border-[var(--color-base-border)] bg-[var(--color-base-surface)]/80 hover:border-indigo-400/60 hover:-translate-y-1 transition-all duration-500 p-8 flex flex-col justify-between min-h-[280px] shadow-sm hover:shadow-xl hover:shadow-indigo-500/10"
                >
                  <div>
                    <div className="flex items-center justify-between mb-7">
                      <span className="font-mono-tech text-[11px] text-[var(--color-base-muted)]">
                        {item.index} / {item.tag}
                      </span>
                      <div className="w-10 h-10 rounded-full border border-[var(--color-base-border)] bg-[var(--color-base-panel)] flex items-center justify-center text-indigo-400 group-hover:aurora-bg group-hover:text-white group-hover:border-transparent transition-all">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    <p className="font-cursive text-4xl aurora-text leading-none mb-2">
                      {item.cursive}
                    </p>
                    <h3 className="font-display font-bold text-xl tracking-tight mb-2.5">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--color-base-muted)] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-7 pt-4 border-t border-[var(--color-base-border)] flex items-center justify-between text-[10px] font-mono-tech uppercase tracking-[0.18em] text-[var(--color-base-muted)]">
                    <span>{item.meta}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:text-[var(--color-accent-cyan)] transition-all" />
                  </div>
                </RevealBlock>
              );
            })}
          </div>
        </section>

        <section id="architecture" className="py-24 sm:py-32 border-t border-[var(--color-base-border)] bg-[var(--color-base-panel)]/45 px-5 sm:px-10">
          <div className="max-w-[1440px] mx-auto">
            <RevealBlock className="mb-14">
              <span className="text-[11px] font-mono-tech uppercase tracking-[0.2em] text-[var(--color-accent-cyan)] block mb-3">
                03 / Under the hood
              </span>
              <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-[-0.03em]">
                Built for{" "}
                <span className="font-editorial italic font-normal text-[var(--color-base-muted)]">
                  reliability.
                </span>
              </h2>
            </RevealBlock>

            <div className="divide-y divide-[var(--color-base-border)] border-y border-[var(--color-base-border)]">
              {ARCHITECTURE_STACK.map((row, idx) => {
                const Icon = row.icon;
                return (
                  <RevealBlock
                    key={row.num}
                    delay={idx * 80}
                    className="group py-7 sm:py-9 px-2 sm:px-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-[var(--color-base-surface)]/70 transition-colors rounded-xl"
                  >
                    <div className="md:col-span-2 flex items-center gap-3 text-xs font-mono-tech text-[var(--color-base-muted)]">
                      <span className="text-[var(--color-accent-cyan)]">{row.num}</span>
                      <span>{row.layer}</span>
                    </div>
                    <div className="md:col-span-4 flex items-center gap-3">
                      <Icon className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span className="font-display font-bold text-xl sm:text-2xl tracking-tight group-hover:translate-x-1 transition-transform">
                        {row.name}
                      </span>
                    </div>
                    <div className="md:col-span-6 text-xs sm:text-sm text-[var(--color-base-muted)] leading-relaxed">
                      {row.detail}
                    </div>
                  </RevealBlock>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-28 sm:py-40 px-5 sm:px-10 max-w-[1440px] mx-auto text-center">
          <RevealBlock>
            <p className="font-cursive text-[clamp(3.8rem,9vw,8.5rem)] aurora-text leading-[0.8]">
              Start
            </p>
            <h2 className="font-display font-extrabold text-[clamp(2.2rem,6vw,5.5rem)] tracking-[-0.04em] leading-[0.95] mt-2 mb-6">
              your workspace
            </h2>
            <p className="text-sm sm:text-base text-[var(--color-base-muted)] max-w-md mx-auto mb-10 leading-relaxed">
              Register your account, invite teammates, and keep conversations, decisions, and calls in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/sign-up"
                className="w-full sm:w-auto px-8 py-4 rounded-full aurora-bg text-white font-semibold text-sm tracking-tight shadow-xl shadow-indigo-500/25 hover:opacity-95 transition-all active:scale-95"
              >
                Create account
              </Link>
              <Link
                to="/sign-in"
                className="w-full sm:w-auto px-8 py-4 rounded-full border border-[var(--color-base-border)] bg-[var(--color-base-surface)] hover:border-indigo-400 text-[var(--color-base-text)] font-medium text-sm transition-colors"
              >
                Sign in
              </Link>
            </div>
          </RevealBlock>
        </section>
      </main>

      <footer className="border-t border-[var(--color-base-border)] bg-[var(--color-base-panel)]/40 pt-14 pb-8 px-5 sm:px-10 overflow-hidden">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-12 border-b border-[var(--color-base-border)] text-xs font-mono-tech uppercase tracking-[0.15em] text-[var(--color-base-muted)]">
            <div className="flex items-center gap-3">
              <span
                className={`w-2 h-2 rounded-full ${
                  !healthStatus.checked
                    ? "bg-slate-400"
                    : healthStatus.ok
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-amber-400"
                }`}
              />
              <span>
                {!healthStatus.checked
                  ? "Checking server..."
                  : healthStatus.ok
                  ? `API Online${healthStatus.pingMs !== null ? ` • DB ${healthStatus.pingMs}ms` : ""}`
                  : "API Unreachable"}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/sign-in" className="hover:text-[var(--color-base-text)] transition-colors">
                Sign in
              </Link>
              <Link to="/sign-up" className="hover:text-[var(--color-base-text)] transition-colors">
                Create account
              </Link>
              <Link to="/chat" className="hover:text-[var(--color-base-text)] transition-colors">
                Workspace
              </Link>
            </div>
          </div>

          <div className="pt-10 flex items-baseline justify-between select-none">
            <div className="flex items-baseline gap-2 sm:gap-4 leading-none">
              <span className="font-display font-extrabold tracking-[-0.05em] text-[clamp(3.2rem,13vw,12rem)] text-[var(--color-base-text)]">
                Whop
              </span>
              <span className="font-cursive text-[clamp(4.4rem,16vw,15rem)] aurora-text leading-[0.7]">
                Chat
              </span>
            </div>
            <span className="hidden md:inline text-[11px] font-mono-tech uppercase tracking-[0.2em] text-[var(--color-base-muted)]">
              © {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
