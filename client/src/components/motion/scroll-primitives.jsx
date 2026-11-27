import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const ScrollProgressBar = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafId = null;

    const update = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
      setProgress(pct);
      rafId = null;
    };

    const onScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[60] bg-transparent pointer-events-none">
      <div
        className="h-full aurora-bg origin-left transition-transform duration-75"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
};

export const RevealBlock = ({
  children,
  className,
  delay = 0,
  y = 28,
  once = true,
}) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(node);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate3d(0, 0, 0)" : `translate3d(0, ${y}px, 0)`,
        transition: `opacity 850ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 850ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
};

export const SplitLineReveal = ({
  children,
  className,
  delay = 0,
  rotate = 2.5,
}) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className={cn("inline-block overflow-hidden align-bottom", className)}>
      <span
        className="inline-block"
        style={{
          transform: visible
            ? "translate3d(0, 0%, 0) rotate(0deg)"
            : `translate3d(0, 115%, 0) rotate(${rotate}deg)`,
          opacity: visible ? 1 : 0,
          transition: `transform 1000ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, opacity 800ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
          willChange: "transform, opacity",
        }}
      >
        {children}
      </span>
    </span>
  );
};

export const ScrollScrubRow = ({
  children,
  className,
  direction = 1,
  distance = 140,
}) => {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let rafId = null;

    const update = () => {
      const node = ref.current;
      if (node) {
        const rect = node.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        const centerProgress = (vh - rect.top) / (vh + rect.height);
        const clamped = Math.min(1, Math.max(0, centerProgress));
        const shift = (clamped - 0.5) * distance * direction;
        setOffset(shift);
      }
      rafId = null;
    };

    const onScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [direction, distance]);

  return (
    <div
      ref={ref}
      className={cn("will-change-transform", className)}
      style={{
        transform: `translate3d(${offset}px, 0, 0)`,
      }}
    >
      {children}
    </div>
  );
};

export const ScrollScaleFrame = ({ children, className }) => {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafId = null;

    const update = () => {
      const node = ref.current;
      if (node) {
        const rect = node.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        const raw = (vh - rect.top) / (vh * 0.72);
        const clamped = Math.min(1, Math.max(0, raw));
        setProgress(clamped);
      }
      rafId = null;
    };

    const onScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const scale = 0.93 + progress * 0.07;
  const translateY = (1 - progress) * 28;

  return (
    <div
      ref={ref}
      className={cn("will-change-transform", className)}
      style={{
        transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
        opacity: 0.4 + progress * 0.6,
      }}
    >
      {children}
    </div>
  );
};
